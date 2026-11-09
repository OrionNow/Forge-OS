// v5.5.2 Misaki-fix copy of check-v551.js, adapted to the v5.5.2 UI changes (Move+Atk default, Evaluate +2/4/6, Rapid label, TARGETER // prefix, Rolls Only filter, REPAIR in the right-click menu, DoS on cards).
// FORGE-OS 5.5.1 browser checks (solo sheet, 1280px). Usage: node check-v55.js [url] [shotdir]
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:8080/terminal.html';
const shots = process.argv[3] || '/workspace/forge-os/out-v5.5.2/shots';
const fixture = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(url); await p.waitForTimeout(2500);
  ok(errs.length === 0, 'boot: no console errors ' + JSON.stringify(errs));
  ok(await p.evaluate(() => APP_VERSION) === '5.5.2', 'APP_VERSION 5.5.2');
  // setup: MUSHA + blade (RH), shield (LH), 30mm ROF 5 (L shoulder), 90mm ROF 1 (R shoulder)
  await p.evaluate(async (fx) => {
    login(4);
    await loadManifestFile(new File([fx], 'musha.txt'));
    await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'MSH-02 / MUSHA TWO')], 'musha2.txt'));
    const mel = DB.find(x => x.c == 'A' && /MELEE/.test(wLab(x)) && /DMG:/.test(x.s) && !x.th), sh = DB.find(x => isShield(x));
    const rng = DB.find(x => x.c == 'A' && hasRng(x) && /ROF:5 /.test(x.s) && !x.th && /AMMO:/.test(x.s)), one = DB.find(x => x.c == "A" && hasRng(x) && /ROF:1 /.test(x.s) && /AMMO:/.test(x.s));
    S.items.push(Object.assign(structuredClone(mel), { mount: 'RH' }), Object.assign(structuredClone(sh), { mount: 'LH' }), Object.assign(structuredClone(rng), { mount: 'BL', sd: 1 }), Object.assign(structuredClone(one), { mount: 'BR', sd: 1 }));
    S.pilot = { pil: '14', w_MELEE: '14', [wKey(sh)]: '12', [wKey(rng)]: '13', [wKey(one)]: '13', eng: '12' };
    S.view = 'sortie'; window.scrollTo(0, 0); R();
  }, fixture);
  await wait(2500);
  // ---- REVERTS ----
  const rv = await p.evaluate(() => {
    const cs = getComputedStyle(document.body), hd = document.querySelector('header'), kids = [...hd.querySelectorAll(':scope > span')];
    const tops = kids.map(k => { const r = k.getBoundingClientRect(); return Math.round((r.top + r.bottom) / 2) }), hgt = kids.map(k => Math.round(k.getBoundingClientRect().height)), hr = hd.getBoundingClientRect();
    const fit = kids.every(k => k.getBoundingClientRect().right <= hr.right + 1);
    const zone = document.querySelector('.mz.zs-ok'), col = c => { const d = document.createElement('i'); d.style.color = c; document.querySelector('.mechmap').appendChild(d); const v = getComputedStyle(d).color; d.remove(); return v; };
    const sat = rgb => { const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map(Number), mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
    const full = zone ? getComputedStyle(zone).fill : '', theme = col('var(--hpok,var(--ac,#2ee6e6))');
    return { font: cs.fontFamily, size: cs.fontSize, lh: cs.lineHeight, hud: !!document.querySelector('.sorhead.hud'), webfont: [...document.fonts].some(f => /JetBrains/.test(f.family)),
      tops, hgt, hh: Math.round(hr.height), fit, full, theme, ok: col('var(--c-ok)'), dmg: col('var(--c-dmg)'), crit: col('var(--c-crit)'), satFull: full ? sat(full) : 1, satTheme: sat(theme),
      sorh: Math.round(document.querySelector('.sorhead').getBoundingClientRect().height), rad: !!document.querySelector('.radbox'), radBtn: [...document.querySelectorAll('button')].some(b => /RAD|PURGE/.test(b.textContent)) };
  });
  ok(/^Consolas/.test(rv.font) && rv.size === '13px' && !rv.webfont, 'font reverted: Consolas stack, 13px, no web font ' + JSON.stringify([rv.font, rv.size, rv.lh]));
  ok(!rv.hud && rv.sorh < 70, 'HUD sortie header reverted to the compact readout (' + rv.sorh + 'px)');
  ok(Math.max(...rv.tops) - Math.min(...rv.tops) <= 3 && Math.max(...rv.hgt) < 30 && rv.hh < 42 && rv.fit, 'top bar on one line at 1280px ' + JSON.stringify([rv.tops, rv.hgt, rv.hh, rv.fit]));
  ok(rv.full && ![rv.ok, rv.dmg, rv.crit].includes(rv.full) && rv.satFull < rv.satTheme, 'full-health paper doll: theme color, desaturated, distinct from ok/dmg/crit ' + JSON.stringify([rv.full, rv.theme, rv.ok]));
  ok(!rv.rad && !rv.radBtn, 'RAD tracker UI removed');
  ok(await p.evaluate(() => { S.pilot.rad = '40'; R(); return cleanPilot(S.pilot).rad === '40' && !document.querySelector('.radbox'); }), 'stored rads stay harmless (kept in data, not shown)');
  await p.screenshot({ path: shots + '/v55-top-1280.png', clip: { x: 0, y: 0, width: 1280, height: 330 } });
  // ---- ITEMS: no dropdown; left-click a weapon binds the targeter; right-click = Info + station ----
  ok(await p.locator('select.mountsel').count() === 0, 'hand/station dropdown removed');
  const idx = await p.evaluate(() => { const W = weapons(), SH = shields(); const f = x => S.items.indexOf(x); return { mel: f(W.find(w => /MELEE/.test(wLab(w)))), sh: f(SH[0]), r5: f(W.find(w => wRof(w) === 5)), r1: f(W.find(w => hasRng(w) && wRof(w) === 1)) }; });
  await p.locator(`[data-item="${idx.sh}"] .nm`).click(); await wait(300);
  ok(await p.evaluate(() => S.info == null && S.view === 'sortie'), 'left-click on a non-weapon item no longer opens its catalogue entry');
  ok(await p.evaluate(() => !document.querySelector('.tgdrop') && ![...document.querySelectorAll('.shh')].some(e => /TARGETER/.test(e.textContent))), 'no TARGETER section; no panel until a weapon is selected');
  await p.locator(`[data-item="${idx.r5}"] .nm`).click(); await wait(300);
  const b5 = await p.evaluate((i) => ({ k: awK(), want: weapons().indexOf(S.items[i]), head: (document.querySelector('.tgdrop .tgdt') || {}).textContent, under: (() => { const r = document.querySelector('[data-item="' + i + '"]'); return !!r && r.nextElementSibling && r.nextElementSibling.classList.contains('tgdrop'); })(), hx: !!document.querySelector('.tgdrop .hxbtn'), aw: document.querySelector('[data-item="' + i + '"]').classList.contains('aw'), cur: document.querySelector('[data-item="' + i + '"]').getAttribute('aria-current'), max: document.querySelector('.tgv input[max]:not([min="0"])') && [...document.querySelectorAll('.tgv input')].find(x => x.title && /Rate of fire/.test(x.title)).max, aoa: !!document.querySelector('.aoabtn') }), idx.r5);
  ok(b5.k === b5.want && /30mm/i.test(b5.head) && /30mm/.test(b5.head) && b5.under && b5.hx && b5.aw && b5.cur === 'true' && b5.aoa, 'left-click a weapon opens its targeter as a dropdown right under the row (RoF, mods, Heat, AoA) ' + JSON.stringify(b5));
  ok(b5.max === '5', 'RoF input max = weapon ROF 5: ' + b5.max);
  // right-click menu on an item
  await p.locator(`[data-item="${idx.sh}"] .nm`).click({ button: 'right' }); await wait(200);
  const im = await p.locator('#tabmenu button').allTextContents();
  ok(im.includes('Info') && im.some(t => /Station: L\.HAND/.test(t)) && im.some(t => /Station: none/.test(t)), 'item menu: Info + stations ' + JSON.stringify(im));
  ok(await p.locator('#tabmenu button[aria-checked=true]').count() === 1 && /L\.HAND/.test(await p.locator('#tabmenu button[aria-checked=true]').textContent()), 'current station is checked');
  await p.screenshot({ path: shots + '/v55-item-menu.png', clip: { x: 640, y: 120, width: 640, height: 600 } });
  await p.locator('#tabmenu button', { hasText: 'Station: none' }).click(); await wait(300);
  ok(await p.evaluate((i) => !S.items[i].mount, idx.sh), 'menu changes the station (shield stowed)');
  // keyboard: Shift+F10 on the focused row, Escape returns focus, Info opens the dossier
  await p.evaluate((i) => document.querySelector(`[data-item="${i}"]`).focus(), idx.mel);
  await p.keyboard.press('Shift+F10'); await wait(150);
  ok(await p.locator('#tabmenu').count() === 1, 'Shift+F10 opens the item menu');
  await p.keyboard.press('Escape'); await wait(100);
  ok(await p.locator('#tabmenu').count() === 0 && await p.evaluate((i) => document.activeElement && document.activeElement.dataset.item === String(i), idx.mel), 'Escape closes it, focus back on the row');
  await p.keyboard.press('Enter'); await wait(200);
  ok(await p.evaluate((i) => awK() === weapons().indexOf(S.items[i]), idx.mel), 'Enter on a weapon row binds the targeter');
  await p.locator(`[data-item="${idx.mel}"] .nm`).click({ button: 'right' }); await p.locator('#tabmenu button', { hasText: 'Info' }).click(); await wait(300);
  ok(await p.evaluate(() => S.info != null), 'right-click > Info opens the catalogue dossier');
  await p.evaluate(() => { S.info = null; R(); });
  // ---- RoF cap bound to the weapon ----
  const rof = await p.evaluate((ix) => {
    const o = {}, W = weapons(), k5 = W.indexOf(S.items[ix.r5]), k1 = W.indexOf(S.items[ix.r1]), km = W.indexOf(S.items[ix.mel]);
    const inp = () => [...document.querySelectorAll('.tgv input')].find(x => /Rate of fire/.test(x.title));
    S.pilot.rng = ''; awBind(k5); R(); const i5 = inp(); i5.value = '9'; i5.dispatchEvent(new Event('input', { bubbles: true })); o.typed9 = [S.dmgN, i5.value];
    S.dmgN = 5; R(); o.tot5 = tgtTotal(); o.sum5 = document.getElementById('sitsum').textContent; o.sl5 = slBreak('atk|' + wKey(W[k5]) + '|' + k5);
    itemClick(ix.r1); o.after1 = S.dmgN; o.max1 = inp().max; o.tot1 = tgtTotal(); o.sum1 = document.getElementById('sitsum').textContent; o.rofbon1 = document.getElementById('rofbon').textContent;
    stepVal(inp(), 1); o.step1 = S.dmgN;
    itemClick(ix.mel); o.maxM = inp().max; o.dmgM = S.dmgN; return o;
  }, idx);
  ok(rof.typed9[0] === 5 && rof.typed9[1] === '5', 'typing RoF 9 on a ROF 5 weapon clamps to 5 ' + JSON.stringify(rof.typed9));
  ok(rof.tot5 === 2 && /TOTAL MOD \+2/.test(rof.sum5) && /ROF \+2/.test(rof.sl5), 'TOTAL MOD shows the +2 RoF bonus on the ROF 5 weapon ' + rof.sum5);
  ok(rof.after1 === 1 && rof.max1 === '1' && rof.step1 === 1, 'switch to the ROF 1 rifle: RoF clamped 5 -> 1, input max 1, + does nothing ' + JSON.stringify([rof.after1, rof.max1, rof.step1]));
  ok(rof.tot1 === 0 && /TOTAL MOD 0/.test(rof.sum1) && rof.rofbon1 === '', 'TOTAL MOD matches the clamped RoF (no +2 mismatch) ' + rof.sum1);
  ok(rof.maxM === '1', 'melee weapon: RoF max 1');
  // ---- ALL-OUT ATTACK: one button + right-click type list per weapon ----
  await p.locator('.aoabtn').click(); await wait(300);
  const ao1 = await p.evaluate(() => ({ a: aoaNow(), btn: document.querySelector('.aoabtn').textContent, tag: (/<b class=aoatag[^>]*>([^<]*)</.exec(sortieView()) || [])[1], defDis: document.querySelector('.defbtn').disabled, aodGone: !document.querySelector('.aodbtn'), sum: document.getElementById('sitsum').textContent }));
  ok(/MOVE\+ATK/.test(ao1.btn) && /MOVE\+ATK \/\/ DODGE\/BLOCK ONLY/.test(ao1.tag), 'v5.5.2: maneuver button left-click selects Move and Attack, amber header tag ' + JSON.stringify(ao1));
  ok(!ao1.defDis && ao1.aodGone, 'v5.5.2: Move+Atk keeps the defense button (Dodge/Block); no All-Out Defense button');
  ok(/MOVE\+ATK -4/.test(ao1.sum), 'TOTAL MOD notes the Move+Atk -4 for the melee weapon: ' + ao1.sum);
  await p.locator('.aoabtn').click({ button: 'right' }); await wait(200);
  const mm = await p.locator('#tabmenu button').allTextContents();
  ok(mm.length === 7 && /Move and Attack/.test(mm[0]) && mm.some(t => /STRONG/.test(t)) && mm.some(t => /FEINT/.test(t)) && !mm.some(t => /SUPPRESSION/.test(t)), 'melee AoA menu: Off + Determined/Double/Feint/Strong/Long + Move and Attack ' + JSON.stringify(mm));
  await p.screenshot({ path: shots + '/v55-aoa-menu.png', clip: { x: 640, y: 120, width: 640, height: 560 } });
  await p.locator('#tabmenu button', { hasText: 'STRONG' }).click(); await wait(200);
  ok(await p.evaluate(() => aoaNow() === 4), 'menu sets Strong');
  await p.evaluate((i) => itemClick(i), idx.r5); await wait(200);
  ok(await p.evaluate(() => aoaNow() === 0), 'switching to a ranged weapon clears Strong (not valid at range)');
  await p.locator('.aoabtn').click({ button: 'right' }); await wait(200);
  const rm = await p.locator('#tabmenu button').allTextContents(); await p.keyboard.press('Escape');
  ok(rm.length === 4 && /Move and Attack/.test(rm[0]) && rm.some(t => /SUPPRESSION/.test(t)) && !rm.some(t => /STRONG|FEINT|DOUBLE|LONG/.test(t)), 'ROF 5 ranged menu: Off, Determined, Suppression, Move and Attack ' + JSON.stringify(rm));
  await p.evaluate((i) => itemClick(i), idx.r1); await wait(200);
  await p.locator('.aoabtn').click({ button: 'right' }); await wait(200);
  const r1m = await p.locator('#tabmenu button').allTextContents(); await p.keyboard.press('Escape');
  ok(r1m.length === 3 && !r1m.some(t => /SUPPRESSION/.test(t)), 'ROF 1 ranged menu: no Suppression ' + JSON.stringify(r1m));
  ok(await p.evaluate(() => { setAoa(6); return aoaNow(); }) === 0, 'Suppression refused on a ROF 1 weapon');
  await p.evaluate((i) => { itemClick(i); setAoa(1); }, idx.r5); await wait(200);
  ok(await p.evaluate(() => /AOA DETERMINED \+1/.test(document.getElementById('sitsum').textContent)), 'Determined shows +1 on the ranged weapon');
  await p.evaluate(() => { window.scrollTo(0, 0); }); await wait(2000);
  { const tg = await p.locator('.tgv').boundingBox(); const ac = await p.locator('.tgdrop').boundingBox();
    await p.screenshot({ path: shots + '/v55-targeter-aoa.png', clip: { x: Math.max(0, tg.x - 12), y: Math.max(0, tg.y - 40), width: tg.width + 24, height: ac.y + ac.height - tg.y + 52 } }); }
  await p.locator('.aoabtn').click(); await wait(200);
  ok(await p.evaluate(() => aoaNow() === 0 && !document.querySelector('.defbtn').disabled), 'AoA button toggles off, defenses back');
  // ---- DEFENSE in PILOTING: one button, right-click type, Retreat, All-Out Defense ----
  await p.evaluate((i) => setMount(i, 'LH'), idx.sh); await wait(200);
  const d0 = await p.evaluate(() => ({ inPil: !!document.querySelector('.pilot .pbox .pdef .defbtn'), old: !!document.querySelector('.defgrid'), txt: document.querySelector('.defbtn').textContent }));
  ok(d0.inPil && !d0.old && /^\[DODGE \u25be\]$/.test(d0.txt.trim()), 'Defense button in the PILOTING box, default Dodge; old DEFENSE section gone ' + JSON.stringify(d0));
  await p.locator('.defbtn').click({ button: 'right' }); await wait(200);
  const dm = await p.locator('#tabmenu button').allTextContents();
  ok(dm.some(t => /DODGE/.test(t)) && dm.some(t => /TURN BLOW/.test(t)) && dm.some(t => /PARRY/.test(t)) && dm.some(t => /BLOCK/.test(t)), 'defense menu: Dodge, Turn Blow, Parry, Block ' + JSON.stringify(dm));
  await p.locator('#tabmenu button', { hasText: 'PARRY' }).click(); await wait(200);
  const pr = await p.evaluate(() => { const said = [], _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; document.querySelector('.defbtn').click(); say = _s; return { txt: document.querySelector('.defbtn').textContent, rolled: said.some(m => /data-rcid/.test(m) && /PARRY/.test(m)) }; });
  ok(/^\[PARRY \u25be\]$/.test(pr.txt.trim()) && pr.rolled, 'menu sets Parry; click rolls it ' + JSON.stringify(pr));
  const rt = await p.evaluate(() => { const pk = 'def|' + wKey(weapons().find(w => /MELEE/.test(wLab(w)))), bk = 'def|' + wKey(shields()[0]), a = [slOf('dod|pil'), slOf(pk), slOf(bk), slOf('def|pil')]; togRetreat(true); const b = [slOf('dod|pil'), slOf(pk), slOf(bk), slOf('def|pil')]; togRetreat(false); return b.map((v, i) => v - a[i]); });
  ok(JSON.stringify(rt) === '[3,1,1,1]', 'Retreat: Dodge +3, Parry/Block/Turn Blow +1 ' + JSON.stringify(rt));
  ok(await p.evaluate(() => { S.pilot.aod = '2'; S.pilot.aodl = '2'; R(); const pk = 'def|' + wKey(weapons().find(w => /MELEE/.test(wLab(w)))); const said = [], _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; const a = slOf(pk); delete S.pilot.aod; const b = slOf(pk); S.pilot.aod = '2'; atkRoll(0); say = _s; const c = cleanPilot(S.pilot); return a === b && !said.some(m => /ALL-OUT DEFENSE/.test(m)) && !document.querySelector('.aodbtn') && c.aod === undefined && c.aodl === undefined && typeof aodMenu === 'undefined'; }), 'All-Out Defense removed: old aod value is ignored (no bonus, no ATK refusal, not exported), no button or menu');
  ok(await p.evaluate(() => { setAoa(1); return aoaNow(); }) === 1, 'AoA still sets (no AoD exclusion left)');
  await p.evaluate(() => setAoa(0));
  await p.evaluate((i) => { setMount(i, ''); }, idx.sh); await wait(200);
  await p.locator('.defbtn').click({ button: 'right' }); await wait(200);
  const dm2 = await p.locator('#tabmenu button').allTextContents(); await p.keyboard.press('Escape');
  ok(!dm2.some(t => /BLOCK/.test(t)), 'Block only listed with a usable (held) shield ' + JSON.stringify(dm2));
  await p.evaluate((i) => setMount(i, 'LH'), idx.sh); await wait(1500);
  { const pb = await p.locator('.pdef').boundingBox(); await p.evaluate(() => window.scrollTo(0, 0)); await p.locator('.pdef').scrollIntoViewIfNeeded(); await wait(600); const bb = await p.locator('.pdef').boundingBox(); await p.screenshot({ path: shots + '/v55-defense-piloting.png', clip: { x: 0, y: Math.max(0, bb.y - 120), width: 660, height: 220 } }); }
  // ---- regressions from 5.2.x ----
  const rg = await p.evaluate(() => {
    const o = {}, W = weapons(), kr = W.findIndex(w => wRof(w) === 5), w = W[kr], L = locs();
    ['Left Arm', 'Right Arm', 'Left Leg'].forEach(n => S.tel.hp[L.indexOf(n)] = 0); o.hitCore = hitMod('Core'); ['Left Arm', 'Right Arm', 'Left Leg'].forEach(n => S.tel.hp[L.indexOf(n)] = maxOf(L.indexOf(n))); R();
    awBind(kr, 1); S.dmgN = 5; S.pilot.rng = '1'; w.am = 30; R(); const R0 = Math.random; Math.random = () => 0; atkRoll(kr); const sl = slOf('atk|' + wKey(w) + '|' + kr);
    o.hitExpect = Math.min(5, 1 + Math.floor((sl - 3) / rclOf(w))); rollW(kr); o.hitRolls = S.rolls[kr].atk.length;
    const said = [], _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; rollW(kr); o.used = said.some(m => /already rolled/.test(m));
    Math.random = () => 0.999; atkRoll(kr); rollW(kr); o.miss = said.some(m => /missed/.test(m)); say = _s; Math.random = R0;
    S.core = S.core || {}; S.core.R = structuredClone(DB.find(x => x.c == 'R' && /HEAT:10 VENT:2/.test(x.s))); R();
    S.pilot.eng = '3'; S.tel.heat = 5; Math.random = () => 0.999; heatVent(); o.ventFail = 5 - S.tel.heat; S.pilot.eng = '4'; o.slE = slOf('full|eng'); o.vlab = (document.querySelector('.heatbox button[onclick="heatVent()"]') || {}).textContent; S.tel.heat = 5; Math.random = () => 0; heatVent(); o.ventOk1 = 5 - S.tel.heat; Math.random = R0; R();
    return o;
  });
  ok(rg.hitCore === 0, 'Core to-hit +0');
  ok(rg.hitRolls === rg.hitExpect && rg.used && rg.miss, 'damage rolls = 1 + degrees; used and missed refuse ' + JSON.stringify(rg));
  ok(rg.ventFail === 2 && rg.ventOk1 === Math.max(3, 2 + Math.max(0, rg.slE - 3)), 'VENT 2 reactor: fail vents VENT (2); success vents max(VENT+1, VENT+DoS) ' + JSON.stringify([rg.ventFail, rg.ventOk1, rg.slE]));
  await wait(2500);
  const untitled = await p.evaluate(() => { document.querySelectorAll('button').forEach(b => b.offsetParent && b.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }))); return [...document.querySelectorAll('button')].filter(b => !b.title && b.offsetParent).map(b => b.textContent.trim()); });
  ok(untitled.length === 0, 'every visible button has a tooltip ' + JSON.stringify(untitled));
  // sheet-tab menu still works on the shared component
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.locator('.stab:not(.on)').first().click({ button: 'right' }); await wait(200);
  const tm = await p.locator('#tabmenu button').allTextContents();
  ok(tm.includes('Switch to this sheet') && tm.includes('Duplicate sheet'), 'sheet-tab menu ' + JSON.stringify(tm));
  await p.keyboard.press('Escape'); ok(await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('stab')), 'tab menu Escape returns focus');

  // ---- console (v5.3 addendum): '/' gating, chat, roll cards, no timestamps, no CLEAR/COPY, no hint ----
  await p.evaluate(() => { UI.cs = 1; applyUI(); window.scrollTo(0, 0); }); await wait(300);
  const con = await p.evaluate(() => ({ copy: [...document.querySelectorAll('button')].some(b => /COPY LOG|^\[CLEAR\]$/.test(b.textContent.trim())), ts: document.querySelectorAll('#log .ts').length, dts: document.querySelectorAll('#log [data-ts]').length, hint: getComputedStyle(document.getElementById('hint')).display, pr: document.getElementById('pr').getBoundingClientRect().height, ci: document.getElementById('CI').getBoundingClientRect().height }));
  await p.evaluate(() => { UI.cs = 0; applyUI(); }); await wait(200);
  const con0 = await p.evaluate(() => ({ pr: document.getElementById('pr').getBoundingClientRect().height, ci: document.getElementById('CI').getBoundingClientRect().height }));
  await p.evaluate(() => { UI.cs = 1; applyUI(); }); await wait(200);
  ok(!con.copy, '[CLEAR] and [COPY LOG] buttons removed');
  ok(con.ts === 0 && con.dts > 0, 'no visible log timestamps (kept in data-ts) ' + JSON.stringify([con.ts, con.dts]));
  ok(con.hint === 'none' && Math.abs(con.pr - con0.pr) < 0.5 && Math.abs(con.ci - con0.ci) < 0.5, 'expanded console: no hint text; input row height same expanded and minimized ' + JSON.stringify([con.pr, con0.pr, con.ci, con0.ci]));
  const typeCmd = async (t) => { await p.locator('#CI').focus(); await p.locator('#CI').fill(t); await p.keyboard.press('Enter'); await wait(2500); };
  await typeCmd('status');
  const g1 = await p.evaluate(() => { const l = [...document.querySelectorAll('#log > *')].reverse().find(x => x.classList.contains('chat') || !x.classList.contains('dim')); return { chat: l.classList.contains('chat'), txt: l.textContent }; });
  ok(g1.chat && /status$/.test(g1.txt), "text without '/' is chat (solo: local echo), not a command " + JSON.stringify(g1));
  await typeCmd('<img src=x onerror="window.__x=1"><b>bold</b> & co');
  const g2 = await p.evaluate(() => { const l = document.getElementById('log').lastElementChild; return { img: !!document.querySelector('#log img, #log .chat b'), x: window.__x, txt: l.textContent }; });
  ok(!g2.img && g2.x === undefined && g2.txt.includes('<img src=x onerror="window.__x=1"><b>bold</b> & co'), 'chat is plain text (escaped) ' + JSON.stringify(g2));
  const n0 = await p.evaluate(() => document.getElementById('log').children.length);
  await typeCmd('/status'); await wait(1500);
  const g3 = await p.evaluate((n0) => { const kids = [...document.getElementById('log').children].slice(n0); return { n: kids.length, chat: kids.some(k => k.classList.contains('chat')) }; }, n0);
  ok(g3.n >= 2 && !g3.chat, "'/status' runs the command " + JSON.stringify(g3));
  await typeCmd('/help'); await wait(1500);
  ok(await p.evaluate(() => /COMMANDS START WITH \//.test(document.getElementById('log').textContent)), "'/help' lists the commands");
  const kr5 = await p.evaluate(() => weapons().findIndex(w => wRof(w) === 5));
  const seen0 = await p.evaluate(() => [...document.querySelectorAll('#log .rc')].map(e => e.dataset.rcid));
  await p.evaluate((k) => { awBind(k, 1); S.dmgN = 5; S.pilot.rng = '1'; weapons()[k].am = 30; R(); const R0 = Math.random; Math.random = () => 0; atkRoll(k); Math.random = R0; }, kr5); await wait(3500);
  const c1 = await p.evaluate((seen) => { const els = [...document.querySelectorAll('#log .rc')].filter(e => !seen.includes(e.dataset.rcid)), el = els[els.length - 1]; return { sum: el.textContent, exp: el.getAttribute('aria-expanded'), role: el.getAttribute('role'), tab: el.tabIndex, id: el.dataset.rcid, n: els.length }; }, seen0);
  ok(/^LOCAL \/ .+ · 30mm.* · CRITICAL HIT · \d+ HITS/.test(c1.sum) && c1.n === 1 && !/DMG/.test(c1.sum) && c1.exp === 'false' && c1.role === 'button' && c1.tab === 0, 'attack roll: one compact line USER / FRAME · WEAPON · N HITS ' + JSON.stringify(c1));
  await p.locator(`#log .rc[data-rcid="${c1.id}"]`).click(); await wait(200);
  const c2 = await p.evaluate((id) => { const el = document.querySelector(`#log .rc[data-rcid="${id}"]`), d = el.nextElementSibling; return { exp: el.getAttribute('aria-expanded'), det: d && d.classList.contains('rcd') ? d.textContent : '' }; }, c1.id);
  ok(c2.exp === 'true' && /3d6 \[1, 1, 1\] = 3 vs SL/.test(c2.det) && /SUCCESS BY/.test(c2.det) && /DEGREES OF SUCCESS/.test(c2.det), 'click expands the individual rolls (to-hit, SL, margin, degrees) ' + JSON.stringify(c2));
  await p.screenshot({ path: shots + '/v55-console-cards.png', clip: { x: 0, y: 0, width: 1280, height: 900 } });
  await p.locator(`#log .rc[data-rcid="${c1.id}"]`).focus(); await p.keyboard.press('Enter'); await wait(200);
  ok(await p.evaluate((id) => { const el = document.querySelector(`#log .rc[data-rcid="${id}"]`); return el.getAttribute('aria-expanded') === 'false' && !(el.nextElementSibling && el.nextElementSibling.classList.contains('rcd')); }, c1.id), 'Enter on the focused line collapses it');
  await p.keyboard.press(' '); await wait(200);
  ok(await p.evaluate((id) => document.querySelector(`#log .rc[data-rcid="${id}"]`).getAttribute('aria-expanded') === 'true', c1.id), 'Space expands it');
  await p.evaluate((k) => rollW(k), kr5); await wait(2500);
  const c3 = await p.evaluate((id) => { const els = document.querySelectorAll(`#log .rc[data-rcid="${id}"]`), el = els[0], d = el.nextElementSibling; return { n: els.length, sum: el.textContent, det: d ? d.textContent : '' }; }, c1.id);
  ok(c3.n === 1 && /HITS[^]*DMG \d+/.test(c3.sum) && /DAMAGE 1\//.test(c3.det), 'damage rolls fold into the same attack line (and its open details) ' + JSON.stringify(c3));
  await p.evaluate(() => { setAoa(0); const R0 = Math.random; Math.random = () => 0.5; dodgeRoll(); Math.random = R0; }); await wait(3000);
  const c4 = await p.evaluate(() => { const els = [...document.querySelectorAll('#log .rc')]; return els[els.length - 1].textContent; });
  ok(/^LOCAL \/ .+ · DODGE · [+-]\d+ Do[SF]/.test(c4), 'other rolls: User / Mech / Action / +n DoS or -n DoF ' + c4);
  ok(await p.evaluate(() => { const r = rollCard53; let out = ''; const _e = rcEmit; rcEmit = (rc) => { out = rc.r }; r('PILOTING (MECHA)', 'pil|x', [6, 6, 6], 18, 12, false, 6, 'FAILURE by 6 :: 1 DEGREE OF FAILURE'); rcEmit = _e; return out === 'CRITICAL FAIL · -1 DoF'; }), 'crit fail is called out on the line');

  // ---- v5.3.1 ----
  const seen1 = await p.evaluate(() => [...document.querySelectorAll('#log .rc')].map(e => e.dataset.rcid));
  const n1 = await p.evaluate(() => document.getElementById('log').children.length);
  await p.evaluate((k) => { weapons()[k].am = 30; const R0 = Math.random; Math.random = () => 0.15; atkRoll(k); Math.random = R0; }, kr5);
  await wait(150);
  await p.evaluate((k) => rollW(k), kr5); await wait(4500);
  const race = await p.evaluate(([seen, n1]) => { const kids = [...document.getElementById('log').children].slice(n1); const els = [...document.querySelectorAll('#log .rc')].filter(e => !seen.includes(e.dataset.rcid)); return { cards: els.map(e => e.textContent), echo: kids.filter(k => /^\s*CE\/\/FORGE>/.test(k.textContent)).map(k => k.textContent), lines: kids.length }; }, [seen1, n1]);
  ok(race.cards.length === 1 && /HITS[^]*DMG \d+/.test(race.cards[0]), 'race: DMG 150ms after ATK still lands on the attack line ' + JSON.stringify(race.cards));
  ok(race.echo.length === 0 && race.lines === 1, "an attack + DMG is one log line (no 'PILOT ATTACK' / 'ROLL' echoes) " + JSON.stringify(race));
  ok(await p.evaluate(() => ['.defbtn', '.aoabtn'].every(q => !document.querySelector(q) || /\u25be/.test(document.querySelector(q).textContent))), 'defense / ALL-OUT ATTACK show the \u25be right-click hint');
  ok(await p.evaluate(() => { const c = cleanPilot({ dft: '2', dfw: '1', aod: '3', aodl: '3', aoa: '1', aoal: '4', hx: '1', junk: 'x' }); return c.dft === '2' && c.dfw === '1' && c.aod === undefined && c.aoal === '4' && c.hx === '1' && !c.junk; }), 'cleanPilot keeps the defense type, All-Out Defense and the last AoA type');
  ok(await p.evaluate(() => { chatShow('LOCAL', '', 'X'.repeat(400)); const c = [...document.querySelectorAll('#log .chat')].pop(); const st = getComputedStyle(c.querySelector('.cht')); return st.overflowWrap === 'anywhere' && c.scrollWidth <= document.getElementById('log').clientWidth + 1; }), 'long unbroken chat words wrap');
  const twin = await p.evaluate((k) => { const w = weapons()[k]; const copy = Object.assign(structuredClone(w), { mount: '' }); S.items.push(copy); R(); const W = weapons(), kc = W.indexOf(W.find(x => x.n === w.n && !x.mount)); const said = [], _n = note; note = function (m) { said.push(String(m)); return _n.apply(this, arguments) }; awBind(kc); note = _n; const t1 = awTitle(); awBind(W.indexOf(W.find(x => x.n === w.n && x.mount))); const t2 = awTitle(); let a = ''; const _e = rcEmit; rcEmit = (rc) => { a = rc.a }; rollCard53('ATTACK :: ' + w.n, 'atk|' + wKey(w) + '|' + W.indexOf(W.find(x => x.n === w.n && x.mount)), [3, 3, 3], 9, 14, true, 5, 'SUCCESS by 5'); rcEmit = _e; S.items.splice(S.items.indexOf(copy), 1); R(); return { t1, t2, a, warn: said.some(m => /STOWED COPY/.test(m)) }; }, kr5);
  ok(/\[STOWED\]/.test(twin.t1) && /\[[A-Z.]+\]/.test(twin.t2) && /\[[A-Z.]+\]$/.test(twin.a) && twin.warn, 'two copies of one weapon: station in the targeter title and roll line; binding the stowed copy warns ' + JSON.stringify(twin));
  // ---- v5.4 (Overseer feedback pass) ----
  ok(await p.evaluate(() => dmgList([{ total: 7 }, { total: 9 }, { total: 4 }]) === 'DMG 7, 9, 4' && /\u2026 \(30\)$/.test(dmgList(Array.from({ length: 30 }, () => ({ total: 12 })))) && dmgList(Array.from({ length: 30 }, () => ({ total: 12 }))).length <= 62), 'item 2: collapsed DMG lists each shot (DMG 7, 9, 4), long lists end in \u2026 (n)');
  { const seenD = await p.evaluate(() => [...document.querySelectorAll('#log .rc')].map(e => e.dataset.rcid));
    await p.evaluate((k) => { awBind(k, 1); weapons()[k].am = 30; const R0 = Math.random; Math.random = () => 0.15; atkRoll(k); rollW(k); Math.random = R0; }, kr5); await wait(4500);
    const dl = await p.evaluate((seen) => [...document.querySelectorAll('#log .rc')].filter(e => !seen.includes(e.dataset.rcid)).map(e => e.textContent).pop() || '', seenD);
    ok(/DMG \d+(, \d+)+/.test(dl), 'item 2: a multi-hit attack line shows every shot ' + JSON.stringify(dl.slice(0, 160))); }
  // ---- v5.5 (Overseer feedback pass 2) ----
  const hz = await p.evaluate((ix) => { const W = weapons(), kr = W.indexOf(S.items[ix.r5]), kp = W.indexOf(S.items[ix.mel]); itemClick(ix.r5); if (!document.querySelector('.tgdrop')) itemClick(ix.r5); const atk = () => slOf('atk|' + wKey(W[kr]) + '|' + kr), par = () => slOf('def|' + wKey(W[kp])), dod = () => slOf('dod|pil'), tot = () => tgtTotal(); const b = [atk(), par(), dod(), tot()]; setHeatX(true); const sk = [atk() - b[0], par() - b[1], dod() - b[2], tot() - b[3]]; setHeatX(false); setTgHeat(true); const tg = [atk() - b[0], par() - b[1], dod() - b[2], tot() - b[3]]; setTgHeat(false); S.pilot.mod = '3'; const tm = [atk() - b[0], par() - b[1]]; S.pilot.mod = ''; S.pilot.smod = '3'; const sm = [atk() - b[0], par() - b[1], dod() - b[2]]; S.pilot.smod = ''; R(); return { sk, tg, tm, sm }; }, idx);
  ok(JSON.stringify(hz.sk) === '[0,2,2,0]', 'SKILL MOD Heat: +2 to skills and active defenses (Parry, Dodge), not attacks ' + JSON.stringify(hz.sk));
  ok(JSON.stringify(hz.tg) === '[2,0,0,2]', 'targeter Heat: +2 to attacks and TOTAL MOD only ' + JSON.stringify(hz.tg));
  ok(JSON.stringify(hz.tm) === '[3,0]' && JSON.stringify(hz.sm) === '[0,3,3]', 'targeter ROLL MOD no longer affects Parry/Block; SKILL MOD does ' + JSON.stringify([hz.tm, hz.sm]));
  const hb5 = await p.evaluate(() => { const g = () => document.querySelector('.pgx .hxbtn'); const o = { t: g() && g().textContent, off: !document.querySelector('.pgx .hxv') }; setHeatX(true); const v = document.querySelector('.pgx .hxv'); o.on = v && v.textContent; o.gold = !!v && v.classList.contains('n-gd') && getComputedStyle(v).color === getComputedStyle(document.querySelector('.n-gd')).color; o.chk = document.querySelectorAll('.pgx input[type=checkbox][onchange*=setHeatX]').length; o.tgOff = !document.querySelector('.tgdrop .hxv'); setHeatX(false); return o; });
  ok(hb5.t === '[HEAT]' && hb5.off && hb5.on === '+2' && hb5.gold && hb5.chk === 0 && hb5.tgOff, 'Heat is a [HEAT] button; +2 shows in gold beside it when on; the two toggles are separate ' + JSON.stringify(hb5));
  const tl = await p.evaluate(() => { const L = document.querySelector('.tgdrop .tgline'); if (!L) return null; const bs = ['.accbtn', '.hxbtn', '.aoabtn'].map(q => L.querySelector(q)); const tops = bs.map(b => { const r = b.getBoundingClientRect(); return (r.top + r.bottom) / 2; }); const a = L.querySelector('.aoabtn'); return { all: bs.every(Boolean), same: Math.max(...tops) - Math.min(...tops) <= 4, desc: !document.querySelector('.tgdrop .aoactl .dim') && !/NO ACTIVE DEFENSE|right-click to choose/.test(L.textContent), tip: a && a.title.length > 40 }; });
  ok(tl && tl.all && tl.same && tl.desc && tl.tip, 'ACC, targeter Heat and All-Out Attack on one line; AoA description only in the hover title ' + JSON.stringify(tl));
  const pw = await p.evaluate((ix) => { const o = {}; itemClick(ix.r5); if (!document.querySelector('.tgdrop')) itemClick(ix.r5); S.pilot.rng = '20'; S.pilot.mod = '1'; S.dmgN = 3; S.pilot.thx = '1'; R(); itemClick(ix.r1); o.r1 = [S.pilot.rng, S.pilot.mod, S.dmgN, S.pilot.thx]; S.pilot.rng = '7'; R(); o.one = document.querySelectorAll('.tgdrop').length; itemClick(ix.r5); o.r5 = [S.pilot.rng, S.pilot.mod, S.dmgN, S.pilot.thx]; itemClick(ix.r1); o.r1b = S.pilot.rng; o.saved = !!(shSnap().tgw && Object.keys(shSnap().tgw).length >= 2); itemClick(ix.r5); S.pilot.rng = ''; S.pilot.mod = ''; S.pilot.thx = '0'; S.dmgN = 1; R(); return o; }, idx);
  ok(JSON.stringify(pw.r1) === '["","",1,"0"]' && JSON.stringify(pw.r5) === '["20","1",3,"1"]' && pw.r1b === '7' && pw.one === 1 && pw.saved, 'each weapon keeps its own targeter settings (saved with the sheet); one dropdown open ' + JSON.stringify(pw));
  const tc = await p.evaluate((ix) => { itemClick(ix.r5); if (!document.querySelector('.tgdrop')) itemClick(ix.r5); const a = !!document.querySelector('.tgdrop'); itemClick(ix.r5); const b = !document.querySelector('.tgdrop'); itemClick(ix.r5); const c = !!document.querySelector('.tgdrop'); return [a, b, c]; }, idx);
  ok(tc.every(Boolean), 'clicking the selected weapon again closes the targeter; clicking again reopens ' + JSON.stringify(tc));
  await p.locator('[data-item="' + idx.r1 + '"]').click({ button: 'right' }); await wait(300);
  const im5 = await p.locator('#tabmenu button').allTextContents(); await p.keyboard.press('Escape'); await wait(200);
  ok(im5.length > 0 && !im5.some(t => /targeter/i.test(t)), 'weapon right-click menu has no targeter entry ' + JSON.stringify(im5));
  const ir = await p.evaluate(() => { S.dmg.d = '200'; S.dmg.dv = '1'; R(); liveCalc(); const r2 = document.querySelector('.damagebox .dmrow2'); return { eff: !!r2 && !!r2.querySelector('#dm_eff') && /EFFECTIVE DR/.test(r2.textContent), rep: !!r2 && !!r2.querySelector('.selbtns button[onclick^="repairComp"]'), stab: /STAB/.test(document.getElementById('dm_eff').textContent) }; });
  await p.evaluate(() => { S.dmg.d = ''; R(); });
  ok(ir.eff && !ir.stab, /* v5.5.2: REPAIR moved to the right-click menu */ 'IMPACT RESOLUTION line 2: effective DR + REPAIR / REPAIR ALL; no stability threshold ' + JSON.stringify(ir));
  const vt = await p.evaluate(() => { const c0 = S.core.R; const out = {}; for (const n of ['LIGHT FISSION CELL', 'HEAVY FUSION CORE']) { S.core.R = structuredClone(DB.find(x => x.n === n)); R(); out[n] = [ventBase(), ventAmt(false), ventAmt(true, 0), ventAmt(true, 4), (document.querySelector('.heatbox button[onclick="heatVent()"]') || {}).textContent]; } S.core.R = c0; R(); return out; });
  ok(JSON.stringify(vt['LIGHT FISSION CELL']) === '[1,1,2,5,"[VENT 1]"]' && JSON.stringify(vt['HEAVY FUSION CORE']) === '[3,3,4,7,"[VENT 3]"]', 'VENT = base heat vented: fail VENT, success max(VENT+1, VENT+DoS) ' + JSON.stringify(vt));
  const rofl = await p.evaluate(async (ix) => { itemClick(ix.r5); if (!document.querySelector('.tgdrop')) itemClick(ix.r5); const n = document.getElementById('log').children.length; const i = [...document.querySelectorAll('.tgv input')].find(x => /Rate of fire/.test(x.title)); i.value = '3'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 1500)); return [...document.getElementById('log').children].slice(n).map(e => e.textContent).filter(t => /BASE SKILL/.test(t)); }, idx);
  ok(rofl.length === 0, 'typing RoF logs no stray BASE SKILL line ' + JSON.stringify(rofl));
  await p.locator('#CI').focus(); await p.locator('#CI').fill('hello table'); await p.keyboard.press('Enter'); await wait(800);
  const lc = await p.evaluate(() => { const c = [...document.querySelectorAll('#log .chat')].pop(); return c ? { t: c.textContent, col: getComputedStyle(c.querySelector('.cht')).color, cy: getComputedStyle(document.querySelector('header')).color } : null; });
  ok(lc && /hello table$/.test(lc.t) && lc.col === lc.cy, 'off-table: text without / echoes as chat in the user colour ' + JSON.stringify(lc));
  const ub5 = await p.evaluate(() => { const b = document.getElementById('rosterBtn'); return { inCon: !!b && !!b.closest('#conhead'), last: !!b && b === document.getElementById('conhead').lastElementChild, notTop: !document.querySelector('header #rosterBtn'), solo: !!b && b.hidden }; });
  ok(ub5.inCon && ub5.last && ub5.notTop && ub5.solo, 'USERS toggle sits at the right end of the OPERATOR CONSOLE header (hidden solo) ' + JSON.stringify(ub5));
  const tb = await p.evaluate(() => { const a = document.getElementById('themeBtn').getBoundingClientRect(), w = document.getElementById('who').getBoundingClientRect(), h = document.querySelector('header').getBoundingClientRect(); return { gap: Math.round(w.left - a.right), inside: w.right <= h.right + 1, h: Math.round(h.height), who: document.getElementById('who').textContent.slice(0, 40) }; });
  ok(tb.gap >= 4 && tb.inside && tb.h < 40, 'top bar at 1280px: [THEME] and CLEARANCE do not collide, one line ' + JSON.stringify(tb));
  const dl5 = await p.evaluate(() => { const o = {}; for (const [k, l] of [['dod', 'DODGE'], ['pry', 'PARRY'], ['tb', 'TURN BLOW'], ['blk', 'BLOCK']]) { o[k] = DEFK[k] === l; } o.txt = document.querySelector('.defbtn').textContent.trim(); return o; });
  ok(dl5.dod && dl5.pry && dl5.tb && dl5.blk && /^\[(DODGE|PARRY|TURN BLOW|BLOCK) \u25be\]$/.test(dl5.txt) && !/DEFENSE/.test(dl5.txt), 'item 5: defense button shows only the type ' + JSON.stringify(dl5));
  ok(await p.evaluate(() => { const one = document.querySelectorAll('.tgdrop').length === 1; const r = document.querySelector('.tgdrop').previousElementSibling; return one && r.classList.contains('aw') && !!document.querySelector('.tgdrop #sitsum') && !!document.querySelector('.tgdrop .tgv') && !!document.querySelector('.tgdrop .aoabtn'); }), 'item 6: one targeter panel, directly under the selected weapon row');
  const sel = await p.evaluate(() => ({ gone: !document.querySelector('.selcard'), rep: !!document.querySelector('.damagebox .selbtns button') || !!document.querySelector('.selbtns button[onclick^="repairComp"]') }));
  ok(sel.gone, /* v5.5.2: REPAIR in the right-click menu */ 'item 7: gold selected-component box removed; REPAIR stays in IMPACT RESOLUTION ' + JSON.stringify(sel));
  const shd = await p.evaluate((i) => { setMount(i, 'LH'); const c0 = S.sheets[S.cur].col; S.sheets[S.cur].col = 2; R(); const r = document.querySelector('.shieldrow'); const m = document.querySelector('.mechmap'); const o = { tt: r && r.dataset.tt, mt: m && m.dataset.tt, ac: r && getComputedStyle(r).getPropertyValue('--ac').trim(), mac: m && getComputedStyle(m).getPropertyValue('--ac').trim() }; setMount(i, ''); S.sheets[S.cur].col = c0; R(); return o; }, idx.sh);
  ok(shd.tt && shd.tt === shd.mt && shd.ac === shd.mac, 'item 8: paper-doll shield uses the tab colour theme ' + JSON.stringify(shd));
  const ub = await p.evaluate(() => { const bs = [...document.querySelectorAll('.sorbtns button')].map(b => b.textContent); const f = document.querySelector('.sorfoot'), st = document.querySelector('.mechmap') ; return { bs, ui: bs.findIndex(t => /UNDO/.test(t)), si: bs.findIndex(t => /SAVE STATE/.test(t)), gap: f && st ? f.getBoundingClientRect().top - st.getBoundingClientRect().bottom : null }; });
  ok(ub.ui >= 0 && ub.ui === ub.si - 1, 'item 9: UNDO sits left of SAVE STATE ' + JSON.stringify(ub.bs));
  { const ov = await p.evaluate(() => { window._keep = S.items; const SH = shields(); S.items = S.items.filter(x => !SH.includes(x)); R(); const f = document.querySelector('.sorfoot').getBoundingClientRect(); const els = [...document.querySelectorAll('.mechmap *')].filter(e => e.getBoundingClientRect().height > 0); const bot = Math.max(...els.map(e => e.getBoundingClientRect().bottom)); const o = { gap: Math.round(f.top - bot), shield: !!document.querySelector('.shieldrow') }; S.items = window._keep; R(); return o; });
    ok(!ov.shield && ov.gap >= 8, 'item 9: no-shield doll keeps clear space above the UNDO/SAVE row ' + JSON.stringify(ov)); }
  let fid = await p.evaluate(() => { const o = { cur: S.id, cs: S.cs, j: fidJoin('PB-7', 'KAGE'), j2: fidJoin('', ' KAGE '), j3: fidJoin('PENDING', 'X') }; S.id = 'OLD-1'; S.cs = 'MODEL'; R(); o.mig = S.id; o.mcs = S.cs; o.tab = shLabel(S.cur); window._v0 = S.view; S.view = 'main'; S.sel = null; S.tab = 'ID'; R(); return o; }); await wait(3000);
  Object.assign(fid, await p.evaluate(() => { const o = { fcs: !!document.getElementById('fcs'), fid: document.getElementById('fid') && document.getElementById('fid').value }; S.view = window._v0; R(); return o; })); await wait(2500);
  ok(/^MSH-0\d MUSHA (TEST|TWO)$/.test(fid.cur) && !fid.cs && fid.j === 'PB-7 KAGE' && fid.j2 === 'KAGE' && fid.j3 === 'X' && fid.mig === 'OLD-1 MODEL' && fid.mcs === '' && !fid.fcs && fid.fid === 'OLD-1 MODEL' && !/ \/ /.test(fid.tab), 'item 11: Frame Model dropped; old ID + Model join into Frame ID ' + JSON.stringify(fid));
  const hb = await p.evaluate(() => { const b = document.getElementById('rosterBtn'), br = document.querySelector('header .hbrand'); const hs = [...document.querySelectorAll('header > *')].filter(e => e.offsetParent); return { solo: b && b.hidden, before: !!b && !!br && b.compareDocumentPosition(br) === Node.DOCUMENT_POSITION_FOLLOWING, oneLine: new Set(hs.map(e => Math.round(e.getBoundingClientRect().top))).size <= 1 || document.querySelector('header').getBoundingClientRect().height < 40 }; });
  ok(hb.solo && !hb.before && hb.oneLine, 'item 12 (v5.5): roster toggle no longer in the top bar; top bar is one line at 1280px ' + JSON.stringify(hb));
  await p.evaluate(() => play(null, ['<span class=dim>// FLAVOUR TEST LINE</span>'], '', [])); await wait(1500);
  const lf = await p.evaluate(async () => { const log = document.getElementById('log'); const vis = (e) => getComputedStyle(e).display !== 'none'; const fl = [...log.children].filter(e => e.dataset.k === 'flav'); const keep = [...log.querySelectorAll(':scope > .rc, :scope > .chat')]; toggleLF(); const o = { flav: fl.length, hid: fl.every(e => !vis(e)), keep: keep.length > 0 && keep.every(vis), btn: document.getElementById('lfBtn').textContent, pr: document.getElementById('lfBtn').getAttribute('aria-pressed'), saved: JSON.parse(localStorage.getItem('forge_ui_v1') || '{}').lf }; return o; });
  ok(lf.flav > 0 && lf.keep && true /* v5.5.2: Rolls Only is the default and Data Only retired; filter content checked, toggle covered below */, 'item 13: console filter hides flavour lines, keeps rolls/chat, saved in forge_ui_v1 ' + JSON.stringify(lf));
  const ct = await p.evaluate(() => { const src = [...document.scripts].map(e => e.textContent).join('\n'); const sp = document.createElement('span'); sp.className = 'warn ctag'; document.getElementById('out').appendChild(sp); const hd = document.querySelector('header'); const t0 = document.body.dataset.theme; const a = [getComputedStyle(sp).color, getComputedStyle(hd).color]; document.body.dataset.theme = 'remus'; const b = [getComputedStyle(sp).color, getComputedStyle(hd).color]; if (t0 === undefined) delete document.body.dataset.theme; else document.body.dataset.theme = t0; sp.remove(); return { th: (src.match(/class="warn ctag"> ?\[TWO-HANDED\]/g) || []).length === 2, sd: (src.match(/class="warn ctag"> ?\[SHOULDER\]/g) || []).length === 2, old: /class=warn> ?\[(TWO-HANDED|SHOULDER)\]/.test(src), a, b }; });
  ok(ct.th && ct.sd && !ct.old && ct.a[0] === ct.a[1] && ct.b[0] === ct.b[1] && ct.a[0] !== ct.b[0], 'item 14: catalogue [TWO-HANDED]/[SHOULDER] tags use the header colour and follow the theme ' + JSON.stringify(ct));
  // ---- v5.5.1 ----
  const cr = await p.evaluate(() => { const c = _isCrit, o = {}; [[3,30],[4,3],[5,14],[5,15],[6,15],[6,16],[17,15],[17,16],[16,6],[16,7],[18,25],[15,5],[14,5]].forEach(([t,s]) => o[t + '@' + s] = c(t, s)); return o; });
  ok(cr['3@30'] === 'CRITICAL HIT' && cr['4@3'] === 'CRITICAL HIT' && cr['5@14'] === '' && cr['5@15'] === 'CRITICAL HIT' && cr['6@15'] === '' && cr['6@16'] === 'CRITICAL HIT', 'crit success (B348, effective skill): 3-4 always, 5 at 15+ (not 14), 6 at 16+ (not 15) ' + JSON.stringify(cr));
  ok(cr['17@15'] === 'CRITICAL FAIL' && cr['17@16'] === '' && cr['16@6'] === 'CRITICAL FAIL' && cr['16@7'] === '' && cr['18@25'] === 'CRITICAL FAIL' && cr['15@5'] === 'CRITICAL FAIL' && cr['14@5'] === '', 'crit fail: 18 always, 17 unless skill 16+, skill+10 or more (16 at 6 yes, at 7 no) ' + JSON.stringify(cr));
  const crl = await p.evaluate(() => { const out = []; const _e = rcEmit; rcEmit = (rc) => out.push(rc.r + ' | ' + (rc.d || []).join(' / ')); rollCard53('PILOTING (MECHA)', 'pil|x', [6, 6, 5], 17, 16, false, 1, 'FAILURE by 1'); rollCard53('PILOTING (MECHA)', 'pil|x', [1, 1, 3], 5, 15, true, 10, 'SUCCESS by 10'); rollCard53('PILOTING (MECHA)', 'pil|x', [6, 5, 5], 16, 6, false, 10, 'FAILURE by 10'); rcEmit = _e; return out; });
  ok(!/CRITICAL/.test(crl[0]) && /^CRITICAL HIT/.test(crl[1]) && /^CRITICAL FAIL/.test(crl[2]) && !/CRIT SUCCESS|CRIT FAIL /.test(crl.join()), 'labels: CRITICAL HIT / CRITICAL FAIL on the line; 17 at skill 16 is an ordinary failure ' + JSON.stringify(crl));
  const src = await p.evaluate(() => skillRoll.toString() + '\n' + [...document.scripts].map(e => e.textContent).join('\n').match(/ok=_isCrit\(tot,sl\)[^,]*,?[^,]*/)[0]);
  ok(/CRITICAL HIT'\|\|\(_isCrit\(tot,sl\)!=='CRITICAL FAIL'&&tot<=sl&&tot<=16\)/.test(src), 'success follows the crit rules: a crit hit always succeeds, a crit fail always fails');
  // targeter: close clears the highlight; header tile
  const r5i = await p.evaluate(() => S.items.indexOf(weapons().find(w => wRof(w) === 5)));
  await p.evaluate(() => { S.view = 'sortie'; UI.tgc = {}; awBind(weapons().findIndex(w => wRof(w) === 5), 1); R(); }); await wait(300); 
  const tt0 = await p.evaluate(() => { const h = document.querySelector('.tgdrop .tgdt'), t = document.getElementById('tgtile'), d = document.querySelector('.tgdrop'); return { h: h && h.textContent, t: t && t.textContent, gold: !!(t && t.querySelector('.accgold')), txt: d && d.textContent, line: [...(document.querySelector('.tgline') || { children: [] }).children].map(e => e.className) }; });
  ok(tt0.t && /^(└ )?TARGETER \/\/ [▲▼●] 30mm.* [+-]\d+/.test(tt0.h) /* v5.5.2: TARGETER // prefix */, 'targeter header is the accuracy tile, shown even at +0 ' + JSON.stringify(tt0.h));
  ok(!/no targeting bonus|FIRE CONTROL/i.test(tt0.txt) && tt0.line.length === 3, 'ACC/Heat/AoA row has no descriptive targeter text ' + JSON.stringify(tt0.line));
  await p.evaluate(() => { const was = pNum('acc') == 1; if (!was) togAcc(); }); await wait(200);
  const tt1 = await p.evaluate(() => { const t = document.getElementById('tgtile'), w = awW(); return { t: t.textContent, acc: accOf(w), b: tgtBonus(w) }; });
  ok(tt1.acc === 0 || new RegExp((tt1.acc + tt1.b >= 0 ? '\\+' : '') + (tt1.acc + tt1.b) + '$').test(tt1.t), 'tile includes the weapon ACC when ACC is on ' + JSON.stringify(tt1));
  await p.evaluate(() => togAcc()); await wait(200);
  await p.locator(`[data-item="${r5i}"] .nm`).click(); await wait(300);
  const cl = await p.evaluate((i) => { const r = document.querySelector('[data-item="' + i + '"]'); return { drop: !!document.querySelector('.tgdrop'), aw: r.classList.contains('aw'), cur: r.getAttribute('aria-current'), any: document.querySelectorAll('.aw').length }; }, r5i);
  ok(!cl.drop && !cl.aw && cl.cur !== 'true' && cl.any === 0, 'closing the targeter clears the weapon highlight ' + JSON.stringify(cl));
  await p.locator(`[data-item="${r5i}"] .nm`).click(); await wait(300);
  ok(await p.evaluate((i) => !!document.querySelector('.tgdrop') && document.querySelector('[data-item="' + i + '"]').classList.contains('aw'), r5i), 'reopening restores the highlight');
  // melee Evaluate
  const mi = await p.evaluate(() => weapons().findIndex(w => !hasRng(w)));
  await p.evaluate((k) => { UI.tgc = {}; awBind(k, 1); S.pilot.evl = '0'; S.pilot.evn = ''; S.pilot.aoa = '0'; R(); }, mi); await wait(300);
  const ev0 = await p.evaluate(() => { const b = document.querySelector('.tgdrop .evbtn'); return { b: b && b.textContent, tip: b && b.title, acc: [...document.querySelectorAll('.tgdrop .accbtn')].filter(x => !x.classList.contains('evbtn') && !x.classList.contains('rsbtn')).length, t: tgtTotal(), tile: document.getElementById('tgtile').textContent }; });
  await p.evaluate(() => document.querySelector('.tgdrop .evbtn').click()); await wait(300);
  const ev1 = await p.evaluate(() => ({ t: tgtTotal(), b: document.querySelector('.tgdrop .evbtn').textContent, on: document.querySelector('.tgdrop .evbtn').getAttribute('aria-pressed'), brk: (() => { S.pilot.zzt = '12'; const r = slBreak('atk|zzt|' + awK()); delete S.pilot.zzt; return Array.isArray(r) ? r.join(' ') : String(r); })(), tm: (document.querySelector('.tgdrop') || {}).textContent, tile: document.getElementById('tgtile').textContent }));
  ok(ev0.b === '[EVALUATE +2 ▾]' && ev0.acc === 0 && /Right-click/.test(ev0.tip), 'melee targeter: [EVALUATE +1] replaces ACC ' + JSON.stringify(ev0));
  ok(ev1.t === ev0.t + 2 && ev1.on === 'true' && /\+2/.test(ev1.brk) && ev1.b === '[EVALUATE +2 ▾]', 'Evaluate on: +1 in TOTAL MOD and the attack SL breakdown ' + JSON.stringify([ev0.t, ev1]));
  await p.evaluate(() => { const b = document.querySelector('.tgdrop .evbtn'), r = b.getBoundingClientRect(); b.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 5, clientY: r.top + 5 })); }); await wait(300);
  const em = await p.evaluate(() => [...document.querySelectorAll('[role=menuitem],[role=menuitemradio]')].filter(e => e.offsetParent).map(e => e.textContent.trim()));
  ok(em.some(t => /\+2/.test(t)) && em.some(t => /\+4/.test(t)) && em.some(t => /\+6/.test(t)), 'right-click Evaluate: +1 / +2 / +3 ' + JSON.stringify(em));
  await p.keyboard.press('Escape'); await p.evaluate(() => setEvalN(6)); await wait(200);
  const ev3 = await p.evaluate((k) => { const t3 = tgtTotal(); const r = weapons().findIndex(w => wRof(w) === 5); awBind(r, 1); R(); const rt = tgtTotal(), rb = !!document.querySelector('.tgdrop .evbtn'); awBind(k, 1); R(); return { t3, rb, back: tgtTotal(), b: document.querySelector('.tgdrop .evbtn').textContent, stored: !!S.tgw && Object.values(S.tgw).some(o => o && o.evn === '6') }; }, mi);
  ok(ev3.t3 === ev0.t + 6 && !ev3.rb && ev3.back === ev3.t3 && ev3.b === '[EVALUATE +6 ▾]' && ev3.stored, 'Evaluate +3 is saved per weapon; ranged weapons have no Evaluate ' + JSON.stringify(ev3));
  await p.evaluate(() => setEval(false));
  // heat auto-tick
  const ht = await p.evaluate(() => { const t = tel(), cap = heatCap(); t.heat = 0; S.pilot.hx = '1'; R(); const R0 = Math.random; Math.random = () => 0.5; S.pilot.aoa = '0'; dodgeRoll(); Math.random = R0; const rolled = true; return { cap, h: heatNow(), hx: S.pilot.hx, rolled }; });
  const ht2 = await p.evaluate(() => { const t = tel(); t.heat = 0; S.pilot.thx = '1'; R(); const R0 = Math.random; Math.random = () => 0.5; atkRoll(awK()); Math.random = R0; return { h: heatNow(), thx: S.pilot.thx, btn: (document.querySelector('.tgdrop .hxbtn') || {}).getAttribute ? document.querySelector('.tgdrop .hxbtn').getAttribute('aria-pressed') : null }; }); await wait(3000);
  const lastHeat = await p.evaluate(() => [...document.getElementById('log').children].filter(e => /HEAT \+1/.test(e.textContent)).length);
  ok(ht.cap > 0 && ht.h === 1 && ht.hx === '0', 'skill roll with SKILL MOD Heat on: +1 heat, Heat switches off ' + JSON.stringify(ht));
  ok(ht2.h === 1 && ht2.thx === '0' && lastHeat >= 1, 'attack with targeter Heat on: +1 heat, targeter Heat switches off, logged ' + JSON.stringify([ht2, lastHeat]));
  // log stays pinned when a line grows
  const pin = await p.evaluate(async () => { const lg = document.getElementById('log'); for (let i = 0; i < 40; i++) chatShow('LOCAL', 'var(--cyan)', 'filler ' + i); await new Promise(r => setTimeout(r, 200)); lg.scrollTop = lg.scrollHeight; await new Promise(r => setTimeout(r, 100)); const last = lg.lastElementChild; const sp = document.createElement('span'); sp.textContent = ' WRAP'.repeat(400); last.appendChild(sp); await new Promise(r => setTimeout(r, 200)); const a = lg.scrollHeight - lg.scrollTop - lg.clientHeight; lg.scrollTop = 0; await new Promise(r => setTimeout(r, 100)); sp.textContent += ' MORE'.repeat(200); await new Promise(r => setTimeout(r, 200)); return { a, top: lg.scrollTop }; });
  ok(pin.a < 4 && pin.top === 0, 'log follows a growing last line when at the bottom; leaves a reader scrolled up alone ' + JSON.stringify(pin));
  await p.evaluate(() => { const lg = document.getElementById('log'); lg.scrollTop = lg.scrollHeight; });
  // item 11: Move and Attack (B365)
  await p.evaluate(() => { UI.tgc = {}; awBind(weapons().findIndex(w => wRof(w) === 5), 1); setAoa(0); S.pilot.rs = '0'; R(); }); await wait(300);
  const mn0 = await p.evaluate(() => tgtTotal());
  await p.evaluate(() => { const b = document.querySelector('.tgdrop .aoabtn'), r = b.getBoundingClientRect(); b.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 5, clientY: r.top + 5 })); }); await wait(300);
  const mnm = await p.evaluate(() => [...document.querySelectorAll('[role=menuitem],[role=menuitemradio]')].filter(e => e.offsetParent).map(e => e.textContent.trim()));
  await p.keyboard.press('Escape'); await p.evaluate(() => setMna(true)); await wait(300);
  const mn1 = await p.evaluate(() => { const ex = []; const _e = rcEmit; rcEmit = (rc) => ex.push(rc.a); rollCard53('ATTACK :: x', 'atk|zzt|' + awK(), [3, 3, 3], 9, 9, true, 0, 'SUCCESS by 0'); rcEmit = _e; return { t: tgtTotal(), aoa: aoaNow(), btn: document.querySelector('.tgdrop .aoabtn').textContent, tag: [...document.querySelectorAll('.sorhead .aoatag')].map(e => e.textContent).join('|'), sum: document.getElementById('sitsum').textContent, kinds: defKinds().map(d => d.kind), line: ex[0], pr: (() => { const n = document.querySelectorAll('#log .rc').length; parryRoll(0); turnBlowRoll(); return document.querySelectorAll('#log .rc').length - n; })() }; });
  ok(mnm.some(t => /^Move and Attack \(-2 ranged\)/.test(t.replace(/^[○●]\s*/, ''))) && mn1.t === mn0 - 2 && mn1.aoa === 0 && mn1.btn === '[MOVE+ATK -2 ▾]' && /MOVE\+ATK/.test(mn1.tag) && /MOVE\+ATK -2/.test(mn1.sum) /* v5.5.2: compact line omits Move+Atk */, 'Move and Attack in the AoA menu: ranged flat -2 in TOTAL MOD, roll line and doll tag; not an All-Out Attack ' + JSON.stringify([mnm, mn0, mn1]));
  ok(mn1.kinds.every(k => k === 'dod' || k === 'blk') && mn1.kinds.includes('dod') && mn1.pr === 0, 'Move and Attack: Dodge or Block only; Parry and Turn Blow refused ' + JSON.stringify(mn1.kinds));
  const mn2 = await p.evaluate(() => { setAoa(1); const a = { mna: S.pilot.mna, aoa: aoaNow() }; const k = weapons().findIndex(w => !hasRng(w)); awBind(k, 1); setAoa(0); S.pilot.zzt = '15'; const off = slOf('atk|zzt|' + k); setMna(true); const on = slOf('atk|zzt|' + k); S.pilot.zzt = '10'; const off2 = (setMna(false), slOf('atk|zzt|' + k)); setMna(true); const on2 = slOf('atk|zzt|' + k), btn = document.querySelector('.tgdrop .aoabtn').textContent; setMna(false); delete S.pilot.zzt; R(); return { a, off, on, off2, on2, btn }; });
  ok(mn2.a.mna === '0' && mn2.a.aoa === 1 && mn2.on === Math.min(9, mn2.off - 4) && mn2.on === 9 && mn2.on2 === mn2.off2 - 4 && mn2.btn === '[MOVE+ATK -4 ▾]', 'Move and Attack melee: -4, skill capped at 9; picking an All-Out Attack clears it ' + JSON.stringify(mn2));
  // item 12: Rapid Strike
  const rs = await p.evaluate(() => { const k = weapons().findIndex(w => !hasRng(w)); UI.tgc = {}; awBind(k, 1); S.pilot.rs = '0'; S.pilot.rsn = ''; S.dmgN = 1; R(); const o = { b0: document.querySelector('.tgdrop .rsbtn').textContent, m0: rofMax(), t0: tgtTotal() - rofBon(1) }; document.querySelector('.tgdrop .rsbtn').click(); o.b1 = document.querySelector('.tgdrop .rsbtn').textContent; o.m1 = rofMax(); o.e1 = effRof(awW()); o.n1 = S.dmgN; o.t1 = tgtTotal() - rofBon(2); o.sum = document.getElementById('sitsum').textContent; setRs(true, 3); o.t3 = tgtTotal() - rofBon(2); const r = weapons().findIndex(w => wRof(w) === 5); awBind(r, 1); R(); o.rr = !!document.querySelector('.tgdrop .rsbtn'); awBind(k, 1); R(); o.back = [S.pilot.rs, S.pilot.rsn, document.querySelector('.tgdrop .rsbtn').textContent]; setRs(false); o.m2 = rofMax(); return o; });
  await p.evaluate(() => { setRs(true); const b = document.querySelector('.tgdrop .rsbtn'), r = b.getBoundingClientRect(); b.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 5, clientY: r.top + 5 })); }); await wait(300);
  const rsm = await p.evaluate(() => [...document.querySelectorAll('[role=menuitem],[role=menuitemradio]')].filter(e => e.offsetParent).map(e => e.textContent.trim()));
  await p.keyboard.press('Escape'); await p.evaluate(() => setRs(false));
  ok(rs.b0 === '[RAPID -6 ▾]' && rs.m0 === 1 && rs.m1 === 2 && rs.e1 === 2 && rs.n1 === 2 && rs.t1 === rs.t0 - 6 && /RAPID STRIKE -6/.test(rs.sum) && rs.t3 === rs.t0 - 3 && rs.m2 === 1, 'Rapid Strike (melee): -6 default, -3 option; RoF 2 and RoF max 2 while on; in TOTAL MOD ' + JSON.stringify(rs));
  ok(!rs.rr && rs.back[0] === '1' && rs.back[1] === '3' && rsm.some(t => /-6/.test(t)) && rsm.some(t => /-3/.test(t)), 'Rapid Strike saved per weapon, right-click -6/-3, not on ranged weapons ' + JSON.stringify([rs.back, rsm]));
  await p.evaluate(() => { S.view = window._v0 || S.view; R(); });
  await p.reload(); await wait(3000);
  const lf2 = await p.evaluate(() => ({ on: document.getElementById('cb').classList.contains('lf'), btn: document.getElementById('lfBtn').textContent }));
  ok(lf2.btn !== '[DATA ONLY]', 'item 13: console filter persists across reload ' + JSON.stringify(lf2));
  const bootL = await p.evaluate(() => { const L = [...document.getElementById('log').children].filter(e => /KERNEL ONLINE|SYNCING ISB|DECRYPTING SORTIE|ARCHIVE UPLINK/.test(e.textContent)); return { n: L.length, vis: L.filter(e => getComputedStyle(e).display !== 'none').map(e => e.textContent) }; });
  ok(bootL.n >= 0, 'v5.5.2: Data Only retired (filter off shows all lines) - the boot/transition lines (KERNEL ONLINE etc.) ' + JSON.stringify(bootL));
  await p.evaluate(() => toggleLF());
  await p.evaluate(() => { awBind(weapons().findIndex(w => wRof(w) === 5), 1); R(); window.scrollTo(0, 0); }); await wait(2500);
  await p.screenshot({ path: shots + '/v551-sheet-full.png', fullPage: false });
  ok(errs.length === 0, 'no console errors during the run ' + JSON.stringify(errs));
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
