#!/usr/bin/env node
// Focused FORGE-OS 5.5.3 gameplay regression. Requires npm package playwright
// and Chromium (CHROMIUM_PATH overrides /usr/bin/chromium).
// BASE_URL may be an app origin or the terminal.html URL; no live-table seats
// are created. The browser context is disposable and uses reduced motion.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.BASE_URL || 'http://localhost:8080';
const url = /\.html(?:[?#]|$)/.test(base) ? base : base.replace(/\/$/, '') + '/terminal.html';
const fixture = fs.readFileSync(path.join(__dirname, 'tests/musha-brittle.manifest.txt'), 'utf8');
let failures = 0;
let checks = 0;
function check(condition, message, evidence) {
  checks++;
  console.log((condition ? 'PASS ' : 'FAIL ') + message);
  if (!condition) {
    failures++;
    if (evidence !== undefined) console.log('  ' + JSON.stringify(evidence));
  }
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(() => typeof Forge === 'object' && typeof R === 'function');
    check(await page.evaluate(() => APP_VERSION) === '5.5.3', 'version is 5.5.3');

    // Real manifest parser/import path, then catalogue equipment for a complete
    // test loadout: melee RH, shield LH, ROF 5 BL, ROF 1 BR.
    const setup = await page.evaluate(async fx => {
      login(4);
      await loadManifestFile(new File([fx], 'musha-one.txt'));
      await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'MSH-02 / MUSHA TWO')], 'musha-two.txt'));
      const melee = DB.find(x => x.c === 'A' && /MELEE/.test(wLab(x)) && /DMG:/.test(x.s) && !x.th);
      const shield = DB.find(isShield);
      const five = DB.find(x => x.c === 'A' && hasRng(x) && wRof(x) === 5 && !x.th && ammoInfo(x));
      const one = DB.find(x => x.c === 'A' && hasRng(x) && wRof(x) === 1 && ammoInfo(x));
      if (!melee || !shield || !five || !one) throw new Error('Required catalogue equipment missing');
      S.items.push(
        Object.assign(structuredClone(melee), { mount: 'RH' }),
        Object.assign(structuredClone(shield), { mount: 'LH' }),
        Object.assign(structuredClone(five), { mount: 'BL', sd: 1 }),
        Object.assign(structuredClone(one), { mount: 'BR', sd: 1 }),
      );
      S.pilot = { pil: '14', eng: '12', [wKey(melee)]: '16', [wKey(shield)]: '14', [wKey(five)]: '16', [wKey(one)]: '16' };
      S.view = 'sortie';
      R();
      return { sheets: S.sheets.length, current: S.cur, ids: S.sheets.map((_, i) => shLabel(i)),
        ix: { melee: S.items.findIndex(x => x.n === melee.n), shield: S.items.findIndex(x => x.n === shield.n),
          five: S.items.findIndex(x => x.n === five.n), one: S.items.findIndex(x => x.n === one.n) } };
    }, fixture);
    check(setup.sheets === 2 && setup.ids.some(x => /MSH-01/.test(x)) && setup.ids.some(x => /MSH-02/.test(x)), 'two manifests become distinct sheet tabs', setup);
    await page.waitForSelector('[data-item="' + setup.ix.five + '"]');
    await page.locator('[data-item="' + setup.ix.five + '"] .nm').click();
    const targeter = await page.evaluate(ix => {
      const row = document.querySelector('[data-item="' + ix.five + '"]');
      const input = [...document.querySelectorAll('.tgdrop input')].find(x => /Rate of fire/.test(x.title));
      return { under: row.nextElementSibling?.classList.contains('tgdrop'), max: input?.max,
        active: row.getAttribute('aria-current'), head: document.querySelector('.tgdt')?.textContent,
        regions: document.querySelectorAll('.tgdrop').length };
    }, setup.ix);
    check(targeter.under && targeter.max === '5' && targeter.active === 'true' && targeter.regions === 1 && /TARGETER/.test(targeter.head), 'weapon click opens one targeter directly under its row with correct RoF maximum', targeter);
    const rof = await page.evaluate(ix => {
      const input = [...document.querySelectorAll('.tgdrop input')].find(x => /Rate of fire/.test(x.title));
      input.value = '9'; input.dispatchEvent(new Event('input', { bubbles: true }));
      const high = { state: S.dmgN, value: input.value };
      itemClick(ix.one);
      const next = [...document.querySelectorAll('.tgdrop input')].find(x => /Rate of fire/.test(x.title));
      return { high, next: { state: S.dmgN, max: next.max }, actual: effRof(awW()) };
    }, setup.ix);
    check(rof.high.state === 5 && rof.high.value === '5' && rof.next.state === 1 && rof.next.max === '1' && rof.actual === 1, 'RoF clamps both typed values and switching to a single-shot weapon', rof);

    const attack = await page.evaluate(ix => {
      const w = S.items[ix.five], k = weapons().indexOf(w);
      awBind(k); S.dmgN = 1; w.am = ammoInfo(w).mag; S.hitq = {}; R();
      const before = !!document.querySelector('[data-item="' + ix.five + '"] .atk-ready');
      const ammo = w.am, random = Math.random;
      try { Math.random = () => 0.1; atkRoll(k); } finally { Math.random = random; }
      return { before, hits: S.hitq[k]?.n, ammoUsed: ammo - w.am,
        ready: !!document.querySelector('[data-item="' + ix.five + '"] .dmg-ready'),
        card: document.querySelector('#log .rc:last-of-type')?.textContent, k };
    }, setup.ix);
    check(attack.before && attack.hits === 1 && attack.ammoUsed === 1 && attack.ready, 'successful ATK consumes ammo, records a hit, and lights DMG readiness', attack);
    await page.locator('[data-item="' + setup.ix.five + '"] [data-menu=dmg]').click();
    const damage = await page.evaluate(({ ix, k }) => ({ hits: S.hitq[k]?.n, rolls: S.rolls[k]?.atk.length,
      ready: !!document.querySelector('[data-item="' + ix.five + '"] .dmg-ready'),
      detail: document.querySelector('#log')?.textContent }), { ix: setup.ix, k: attack.k });
    check(damage.hits === 0 && damage.rolls === 1 && !damage.ready && /DMG/.test(damage.detail), 'DMG rolls the recorded hit and clears pending readiness', damage);
    await page.evaluate(ix => { setAmmo(ix.five, 'am', 0); }, setup.ix);
    check(await page.locator('[data-item="' + setup.ix.five + '"] .atk-empty:disabled').count() === 1, 'empty magazine leaves the disabled ATK control visible');
    const forceBefore = await page.locator('#log .rc').count();
    await page.locator('[data-item="' + setup.ix.five + '"] [data-menu=dmg]').click({ button: 'right' });
    await page.locator('#tabmenu button', { hasText: 'Force 1 damage roll' }).click();
    const force = await page.evaluate(k => ({ ammo: weapons()[k].am, count: S.rolls[k]?.atk.length }), attack.k);
    check(force.ammo === 0 && force.count === 1 && await page.locator('#log .rc').count() === forceBefore + 1, 'context action forces one separate damage roll with a dry magazine', force);

    // Invoke damage through the component menu, then repair and undo through
    // the existing application functions. Armor math is exercised with a known
    // penetrating amount, rather than writing HP directly for this check.
    const impact = await page.evaluate(() => {
      const i = locs().indexOf('Right Arm'), before = tel().hp[i];
      S.undo = []; S.dmg = { loc: i, d: String(armorOf(locs()[i]) + 10), dv: '1', rear: false, chink: false, calc: null }; R();
      return { i, before };
    });
    await page.locator('.mlab[data-loc="' + impact.i + '"]').click({ button: 'right' });
    await page.locator('#tabmenu button', { hasText: 'Apply entered damage' }).click();
    const repair = await page.evaluate(({ i, before }) => {
      const damaged = tel().hp[i]; repairComp(i); const repaired = tel().hp[i];
      undoLast(); const undoRepair = tel().hp[i]; undoLast(); const undoDamage = tel().hp[i];
      return { before, damaged, repaired, undoRepair, undoDamage };
    }, impact);
    check(repair.damaged === repair.before - 10 && repair.repaired === repair.before, 'component menu applies penetrating damage and field repair restores HP', repair);
    check(repair.undoRepair === repair.damaged && repair.undoDamage === repair.before, 'undo restores both repair and damage in order', repair);

    await page.evaluate(ix => { awBind(weapons().indexOf(S.items[ix.melee])); R(); }, setup.ix);
    check(await page.evaluate(() => evN()) === 2, 'Evaluate defaults to +2');
    await page.locator('.evbtn').click({ button: 'right' });
    const evalChoices = (await page.locator('#tabmenu button').allTextContents()).map(x => x.replace(/^[○●]\s*/, ''));
    check(['+2', '+4', '+6'].every(x => evalChoices.includes(x)), 'Evaluate menu offers +2, +4 and +6', evalChoices);
    await page.locator('#tabmenu button', { hasText: '+6' }).click();
    const capped = await page.evaluate(() => {
      const w = awW(), h = locs().indexOf('Head / Targeting Equipment');
      S.core = Object.assign({}, S.core, { G: structuredClone(DB.find(x => x.c === 'G' && /ACC-ALL:\+2/.test(x.s))) });
      const intact = targetAimBonus(w); tel().hp[h] = 0; R();
      const broken = targetAimBonus(w), text = document.querySelector('#tgtile').textContent, breakdown = slBreak('atk|' + wKey(w) + '|' + awK());
      tel().hp[h] = maxOf(h); R();
      return { intact, broken, text, breakdown };
    });
    check(capped.intact === 8 && capped.broken === 1 && /HEAD DAMAGED/.test(capped.text) && /HEAD LIMIT \+1/.test(capped.breakdown), 'destroyed head caps combined Targeter and Evaluate bonus at +1 in mechanics and UI', capped);

    const maneuver = await page.evaluate(() => {
      setEval(false); const w = awW(), spec = 'atk|' + wKey(w) + '|' + awK();
      const ordinary = slOf(spec); aoaToggle();
      const on = mnaOn(), skill = slOf(spec), kinds = defKinds().map(x => x.kind), aoa = aoaNow();
      setMna(false);
      return { ordinary, on, skill, kinds, aoa };
    });
    check(maneuver.on && maneuver.aoa === 0 && maneuver.skill === Math.min(9, maneuver.ordinary - 4) && maneuver.kinds.includes('dod') && maneuver.kinds.includes('blk') && maneuver.kinds.every(x => ['dod', 'blk'].includes(x)), 'Move+Atk applies melee skill cap and leaves only Dodge/Block defenses', maneuver);
    const retreat = await page.evaluate(() => {
      S.pilot.pil = ''; togRetreat(true); dodgeRoll(); const rejected = pNum('ret');
      S.pilot.pil = '14'; dodgeRoll(); return { rejected, rolled: pNum('ret'), checked: document.querySelector('.rtr input')?.checked };
    });
    check(retreat.rejected === 1 && retreat.rolled === 0 && retreat.checked === false, 'Retreat stays set after a rejected roll and clears after a valid defense', retreat);

    // Slow actual keyboard input with a redraw between digits reproduces the
    // former two-digit skill/caret regression, including the console's focus.
    await page.locator('input[data-skill=pil]').fill('');
    await page.locator('input[data-skill=pil]').pressSequentially('1', { delay: 50 });
    await page.evaluate(() => R());
    const firstDigit = await page.evaluate(() => ({ skill: S.pilot.pil, focused: document.activeElement?.dataset.skill, caret: document.activeElement?.selectionStart }));
    await page.keyboard.type('4', { delay: 50 });
    await page.evaluate(() => R());
    const secondDigit = await page.evaluate(() => ({ skill: S.pilot.pil, focused: document.activeElement?.dataset.skill, caret: document.activeElement?.selectionStart }));
    check(firstDigit.skill === '1' && firstDigit.focused === 'pil' && firstDigit.caret === 1 && secondDigit.skill === '14' && secondDigit.focused === 'pil' && secondDigit.caret === 2, 'typing two-digit skills retains focus and caret through redraws', { firstDigit, secondDigit });
    check(await page.evaluate(() => /^ SHEET EXPORT VERSION: 5\.5\.3$/m.test(txt())), 'exported manifest identifies version 5.5.3');
    const tabState = await page.evaluate(() => { const id = S.id; shGo(0); const first = S.id; shGo(1); return { first, restored: S.id === id, skill: S.pilot.pil }; });
    check(/MSH-01/.test(tabState.first) && tabState.restored && tabState.skill === '14', 'switching sheets preserves independent identity and edited skill', tabState);

    check(await page.locator('.ux-menu,.ux-item-menu,#uxDamageTarget,#sheetMenu').count() === 0, 'extra menu triggers, target selector and sheet-actions button are absent');
    check(await page.locator('#con>.pane-head,#sh>.pane-head').count() === 0, 'sortie numbered section headers are absent');
    await page.locator('.defbtn').click({ button: 'right' });
    check(await page.locator('#tabmenu').count() === 1, 'main defense button retains its right-click menu');
    await page.keyboard.press('Escape');

    const ui = await context.newPage();
    ui.on('pageerror', e => errors.push(e.message));
    await ui.goto(url);
    await ui.waitForSelector('[data-ux-row]');
    await ui.locator('[data-ux-row]').first().focus(); await ui.keyboard.press('Enter');
    await ui.waitForFunction(() => S.view === 'chassis');
    const frameChoice = ui.locator('[data-ux-row][onclick^="cfgCh("]').first();
    await frameChoice.waitFor();
    await frameChoice.focus(); await ui.keyboard.press('Space');
    check(await ui.evaluate(() => cfg().ch !== null || !!S.ch), 'keyboard Enter opens Guest and Space selects a chassis');
    check(await ui.locator('#uxbar,#uxDisplay,#uxHelp').count() === 0, 'location/display/help toolbar is absent');
    const overflow = [];
    for (const width of [1920, 1280, 1024, 768, 390, 320]) {
      await ui.setViewportSize({ width, height: 900 });
      const bounds = await ui.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }));
      if (bounds.page > bounds.viewport + 1) overflow.push(bounds);
    }
    check(overflow.length === 0, 'login layout fits widths from 320px to 1920px', overflow);
    check(errors.length === 0, 'no page-level script errors', errors);
  } finally {
    await browser.close();
  }
  console.log(failures ? failures + ' FAILED / ' + checks + ' checks' : 'ALL ' + checks + ' CHECKS PASSED');
  process.exitCode = failures ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
