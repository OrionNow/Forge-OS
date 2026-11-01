// FORGE-OS 5.2 browser checks (solo sheet). Usage: node check-v52.js [url] [shotdir]
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:8080/terminal.html';
const shots = process.argv[3] || '/workspace/forge-os/out-v5.2/shots';
const fixture = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(url); await p.waitForTimeout(2500);
  ok(errs.length === 0, 'boot: no console errors ' + JSON.stringify(errs));
  ok(await p.evaluate(() => APP_VERSION) === '5.2.1', 'APP_VERSION 5.2.1');
  const r = await p.evaluate(async (fx) => {
    const o = {};
    login(4);
    await loadManifestFile(new File([fx], 'musha.txt'));
    await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'MSH-02 / MUSHA TWO')], 'musha2.txt'));
    const mel = DB.find(x => x.c == 'A' && /MELEE/.test(wLab(x)) && /DMG:/.test(x.s) && !x.th);
    const sh = DB.find(x => isShield(x));
    const rng = DB.find(x => x.c == 'A' && hasRng(x) && /DMG:\d+d/.test(x.s) && !x.th && /AMMO:/.test(x.s));
    S.items.push(Object.assign(structuredClone(mel), { mount: 'RH' }), Object.assign(structuredClone(sh), { mount: 'LH' }), Object.assign(structuredClone(rng), { mount: 'BL', sd: 1 }));
    S.pilot = { pil: '14', w_MELEE: '14', [wKey(sh)]: '12', [wKey(rng)]: '13' };
    o.names = [mel && mel.n, sh && sh.n, rng && rng.n];
    R();
    // 5) Core to-hit +0 even with limbs disabled
    const L = locs(); ['Left Arm', 'Right Arm', 'Left Leg'].forEach(n => S.tel.hp[L.indexOf(n)] = 0);
    o.hitCore = hitMod('Core'); o.hitCabin = hitMod('Crew Cabin');
    ['Left Arm', 'Right Arm', 'Left Leg'].forEach(n => S.tel.hp[L.indexOf(n)] = maxOf(L.indexOf(n)));
    S.dmg.loc = L.indexOf('Core'); R();
    o.selCard = (/TO-HIT [^&]*/.exec(document.querySelector('.selcard').textContent) || [''])[0];
    // 2) defense section
    const df = document.querySelector('.defgrid');
    o.defBtns = df ? [...df.querySelectorAll('button')].map(b => b.textContent) : null;
    o.pryInRows = !!document.querySelector('.rbtn button[onclick^="parryRoll"]');
    o.pilotDodge = !!document.querySelector('.pilot button[onclick="dodgeRoll()"]');
    // 3) AoA
    const W = weapons(), km = W.indexOf(W.find(w => /MELEE/.test(wLab(w)))), kr = W.indexOf(W.find(w => hasRng(w)));
    o.slMelee0 = slOf('atk|' + wKey(W[km]) + '|' + km); o.slRng0 = slOf('atk|' + wKey(W[kr]) + '|' + kr);
    setAoa(1);
    o.slMelee1 = slOf('atk|' + wKey(W[km]) + '|' + km); o.slRng1 = slOf('atk|' + wKey(W[kr]) + '|' + kr);
    o.noDef = /NO ACTIVE DEFENSE/.test(document.querySelector('#defsum').textContent);
    o.defDisabled = [...document.querySelectorAll('.defgrid button')].every(b => b.disabled);
    o.sitsum = document.querySelector('#sitsum').textContent;
    S.dmgN = 1; setAoa(6); o.supRefused = aoaNow() === 1;
    S.dmgN = 5; setAoa(6); o.supOk = aoaNow() === 6;
    S.dmgN = 1; setAoa(0); o.cleared = aoaNow() === 0 && !document.querySelector('.defgrid button[disabled]');
    o.aoaKept = cleanPilot({ aoa: '4' }).aoa === '4';
    // v5.2.1: active AoA tag in the sortie readout; melee-only options greyed out without a held melee weapon
    setAoa(1); o.aoaTagTitle = /class=aoatag title=/.test(sortieView()); setAoa(0); o.aoaTagGone = !/aoatag/.test(sortieView());
    { const h0 = wDisabled; wDisabled = (x) => /MELEE/.test(wLab(x)) || h0(x); R(); o.melDis = [2, 3, 4, 5].map(v => !!document.querySelector('.defgrid input[name=aoa][value="' + v + '"]:disabled')); o.detOn = !document.querySelector('.defgrid input[name=aoa][value="1"]:disabled'); setAoa(4); o.strongRefused = aoaNow() !== 4; wDisabled = h0; R(); }
    // v5.2.1 Bug B: targeter RoF 5 on a ROF 1 weapon -> 1 round, 1 hit, no RoF bonus
    { const W2 = weapons(), k2 = W2.indexOf(W2.find(w => hasRng(w))), w2 = W2[k2], s0 = w2.s; S.dmgN = 1; R(); const base = slOf('atk|' + wKey(w2) + '|' + k2);
      w2.s = s0.replace(/ROF:\S+/, 'ROF:1'); S.dmgN = 5; R(); o.rofCapSL = slOf('atk|' + wKey(w2) + '|' + k2) - base; o.rofEff = effRof(w2); w2.am = 30;
      const R1 = Math.random; Math.random = () => 0; atkRoll(k2); Math.random = R1; o.rofCapHits = ((S.hitq || {})[k2] || {}).n;
      w2.s = s0.replace(/ROF:\S+/, 'ROF:5'); R(); o.rof5SL = slOf('atk|' + wKey(w2) + '|' + k2) - base; w2.s = s0; S.dmgN = 1; R(); }
    // Strong adds max(2, dice) per melee damage roll
    setAoa(4); const R0 = Math.random; Math.random = () => 0; // every die = 1
    rollW(km, 1); const sr = S.rolls[km].atk[0]; const n = S.rolls[km].n;
    o.strong = { total: sr.total, expect: (n + Math.max(2, n)) * S.rolls[km].mult };
    setAoa(0);
    // 6) damage rolls = 1 + degrees (margin / Recoil), capped at rounds fired
    S.dmgN = 5; S.pilot.rng = '1'; R();
    const w = W[kr]; w.am = 30;
    Math.random = () => 0; // 3d6 = 3: margin = SL - 3
    atkRoll(kr);
    const sl = slOf('atk|' + wKey(w) + '|' + kr), rcl = rclOf(w);
    o.hitExpect = Math.min(effRof(w), 1 + Math.floor((sl - 3) / rcl)); o.wRof = wRof(w); o.hitq = JSON.stringify(S.hitq);
    rollW(kr); o.hitRolls = S.rolls[kr].atk.length;
    { const said = [], _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; rollW(kr); say = _s; o.usedRejected = said.some(m => /NO HITS TO ROLL/.test(m) && /already rolled/.test(m)); }
    Math.random = () => 0.999; // 18: failure
    atkRoll(kr); o.missQ = JSON.stringify((S.hitq || {})[kr]); const said = [], _s = say; say = function (m, t) { said.push(String(m)); return _s.apply(this, arguments) }; rollW(kr); say = _s;
    o.missRejected = said.some(m => /NO HITS TO ROLL/.test(m));
    Math.random = R0;
    // 7) vent floor (fit a reactor so the frame has a heat pool)
    S.core = S.core || {}; S.core.R = structuredClone(DB.find(x => x.c == 'R' && /HEAT:10 VENT:2/.test(x.s))); R();
    S.pilot.eng = '3'; S.tel.heat = 5; Math.random = () => 0.999; heatVent(); o.ventFail = 5 - S.tel.heat;
    S.pilot.eng = '18'; S.tel.heat = 5; Math.random = () => 0; heatVent(); o.ventOkLow = 5 - S.tel.heat; // margin 15
    S.pilot.eng = '4'; S.tel.heat = 5; Math.random = () => 0; heatVent(); o.ventOk1 = 5 - S.tel.heat; // margin 1: 1 + 0 -> floor 2
    Math.random = R0; o.heatCap = heatCap();
    R();
    // 4) tooltips (wait out the sheet text crawl)
    setAoa(1); o.aoaTag = (/<b class=aoatag[^>]*>([^<]*)</.exec(sortieView()) || [])[1] || ''; setAoa(0);
    await new Promise(r => setTimeout(r, 2500));
    document.querySelectorAll('button').forEach(b => b.offsetParent && b.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })));
    o.untitled = [...document.querySelectorAll('button')].filter(b => !b.title && b.offsetParent).map(b => b.textContent.trim()).slice(0, 12);
    o.buttons = [...document.querySelectorAll('button')].filter(b => b.offsetParent).length;
    return o;
  }, fixture);
  console.log(JSON.stringify(r));
  ok(r.hitCore === 0 && r.hitCabin === -8, 'to-hit: Core +0, Cabin -8, no stacking with 3 limbs disabled');
  ok(/TO-HIT \+0/.test(r.selCard), 'selCard shows Core TO-HIT +0: ' + r.selCard);
  ok(r.defBtns && r.defBtns.some(t => /DODGE/.test(t)) && r.defBtns.some(t => /TURN BLOW/.test(t)) && r.defBtns.some(t => /PARRY/.test(t)) && r.defBtns.some(t => /BLOCK/.test(t)), 'defense section: dodge, turn blow, parry, block ' + JSON.stringify(r.defBtns));
  ok(!r.pryInRows && !r.pilotDodge, 'defense buttons moved out of weapon rows and the PILOTING box');
  ok(r.slMelee1 - r.slMelee0 === 4 && r.slRng1 - r.slRng0 === 1, 'AoA Determined: +4 melee / +1 ranged SL');
  ok(r.noDef && r.defDisabled, 'AoA shows NO ACTIVE DEFENSE and disables defense rolls');
  ok(/AOA \+4 MELEE/.test(r.sitsum), 'targeter TOTAL MOD notes the AoA bonus');
  ok(r.supRefused && r.supOk, 'Suppression Fire only at RoF 5+');
  ok(r.cleared, 'AoA NONE restores defenses');
  ok(r.aoaKept, 'cleanPilot keeps aoa (manifest round trip)');
  ok(r.strong.total === r.strong.expect, 'AoA Strong adds max(2, dice) before the multiplier ' + JSON.stringify(r.strong));
  ok(r.hitRolls === r.hitExpect, 'damage rolls = 1 + degrees, cap RoF: ' + r.hitRolls + ' vs ' + r.hitExpect);
  ok(r.missRejected, 'missed attack: no damage roll');
  ok(/"m":1/.test(r.missQ || ''), 'miss stored in synced sheet state S.hitq ' + r.missQ);
  ok(r.usedRejected, 'DMG after the hits are used up refuses');
  ok(/AOA: DETERMINED \/\/ NO DEFENSE/.test(r.aoaTag) && r.aoaTagGone && r.aoaTagTitle, 'active AoA tag in the sortie readout: ' + r.aoaTag);
  ok(r.melDis.every(Boolean) && r.detOn && r.strongRefused, 'melee-only AoA options greyed out without a held melee weapon ' + JSON.stringify(r.melDis));
  ok(r.rofEff === 1 && r.rofCapSL === 0 && r.rofCapHits === 1 && r.rof5SL === 2, 'RoF capped at weapon ROF (ROF 1 + targeter 5: +0, 1 hit; ROF 5: +2) ' + JSON.stringify([r.rofEff, r.rofCapSL, r.rofCapHits, r.rof5SL]));
  ok(r.heatCap ? (r.ventFail === 1 && r.ventOk1 === 2 && r.ventOkLow >= 2) : true, 'vent floors: fail 1, success >= 2 ' + JSON.stringify([r.ventFail, r.ventOk1, r.ventOkLow, r.heatCap]));
  ok(r.untitled.length === 0, 'every visible button has a tooltip (' + r.buttons + ' buttons) missing: ' + JSON.stringify(r.untitled));
  // 1) context menu: right-click, keyboard, Escape
  await p.evaluate(() => { UI.sh.DF = true; R(); window.scrollTo(0, 0); });
  const tab = p.locator('.stab:not(.on)').first();
  await tab.click({ button: 'right' });
  const items = await p.locator('#tabmenu button').allTextContents();
  ok(items.includes('Rename sheet') && items.includes('Duplicate sheet') && items.includes('Close sheet') && items.includes('Switch to this sheet'), 'context menu items ' + JSON.stringify(items));
  ok(await p.locator('#tabmenu button[title]').count() === items.length, 'every menu item has a tooltip');
  await p.screenshot({ path: shots + '/v52-tab-context-menu.png', clip: { x: 0, y: 0, width: 1600, height: 420 } });
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Escape');
  ok(await p.locator('#tabmenu').count() === 0, 'Escape closes the menu');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('stab')), 'focus returns to the tab');
  await p.keyboard.press('Shift+F10');
  ok(await p.locator('#tabmenu').count() === 1, 'Shift+F10 opens the menu on the focused tab');
  const nBefore = await p.evaluate(() => S.sheets.length);
  await p.locator('#tabmenu button', { hasText: 'Duplicate sheet' }).click();
  ok(await p.evaluate(() => S.sheets.length) === nBefore + 1, 'menu action runs (duplicate)');
  ok(await p.locator('.stab .stx[data-act]:visible').count() === 0, 'one-letter tab buttons are hidden');
  // defense + AoA screenshot
  await p.evaluate(() => { shSave(); const i = S.sheets.findIndex(s => (s.d.items || []).length > 0); S.cur = i; shApply(S.sheets[i].d); S.pilot.rng = '40'; R(); setAoa(1); });
  const box = await p.locator('.defgrid').boundingBox();
  const tg = await p.locator('.tgv').boundingBox();
  const y0 = Math.max(0, (tg ? tg.y : box.y) - 40);
  await p.screenshot({ path: shots + '/v52-defense-aoa.png', clip: { x: Math.max(0, box.x - 20), y: y0, width: Math.min(1600 - Math.max(0, box.x - 20), box.width + 40), height: box.y + box.height - y0 + 20 } });
  await p.evaluate(() => setAoa(0));
  await p.screenshot({ path: shots + '/v52-sheet-full.png', fullPage: false });
  ok(errs.length === 0, 'no console errors during the run ' + JSON.stringify(errs));
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
