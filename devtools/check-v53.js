// FORGE-OS 5.3 browser checks (solo sheet, 1280px). Usage: node check-v53.js [url] [shotdir]
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:8080/terminal.html';
const shots = process.argv[3] || '/workspace/forge-os/out-v5.3/shots';
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
  ok(await p.evaluate(() => APP_VERSION) === '5.3.0', 'APP_VERSION 5.3.0');
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
  await p.screenshot({ path: shots + '/v53-top-1280.png', clip: { x: 0, y: 0, width: 1280, height: 330 } });
  // ---- ITEMS: no dropdown; left-click a weapon binds the targeter; right-click = Info + station ----
  ok(await p.locator('select.mountsel').count() === 0, 'hand/station dropdown removed');
  const idx = await p.evaluate(() => { const W = weapons(), SH = shields(); const f = x => S.items.indexOf(x); return { mel: f(W.find(w => /MELEE/.test(wLab(w)))), sh: f(SH[0]), r5: f(W.find(w => wRof(w) === 5)), r1: f(W.find(w => hasRng(w) && wRof(w) === 1)) }; });
  await p.locator(`[data-item="${idx.sh}"] .nm`).click(); await wait(300);
  ok(await p.evaluate(() => S.info == null && S.view === 'sortie'), 'left-click on a non-weapon item no longer opens its catalogue entry');
  ok(await p.evaluate(() => !document.querySelector('.tgrow') && /left-click a weapon/.test(document.querySelector('.tghint').textContent)), 'targeter waits for a weapon');
  await p.locator(`[data-item="${idx.r5}"] .nm`).click(); await wait(300);
  const b5 = await p.evaluate((i) => ({ k: awK(), want: weapons().indexOf(S.items[i]), head: [...document.querySelectorAll('.shh')].map(e => e.textContent).find(t => /TARGETER/.test(t)), aw: document.querySelector('[data-item="' + i + '"]').classList.contains('aw'), cur: document.querySelector('[data-item="' + i + '"]').getAttribute('aria-current'), max: document.querySelector('.tgv input[max]:not([min="0"])') && [...document.querySelectorAll('.tgv input')].find(x => x.title && /Rate of fire/.test(x.title)).max, aoa: !!document.querySelector('.aoabtn') }), idx.r5);
  ok(b5.k === b5.want && /TARGETER \/\/ 30mm/i.test(b5.head) && b5.aw && b5.cur === 'true' && b5.aoa, 'left-click a weapon opens its targeter + AoA ' + JSON.stringify(b5));
  ok(b5.max === '5', 'RoF input max = weapon ROF 5: ' + b5.max);
  // right-click menu on an item
  await p.locator(`[data-item="${idx.sh}"] .nm`).click({ button: 'right' }); await wait(200);
  const im = await p.locator('#tabmenu button').allTextContents();
  ok(im.includes('Info') && im.some(t => /Station: L\.HAND/.test(t)) && im.some(t => /Station: none/.test(t)), 'item menu: Info + stations ' + JSON.stringify(im));
  ok(await p.locator('#tabmenu button[aria-checked=true]').count() === 1 && /L\.HAND/.test(await p.locator('#tabmenu button[aria-checked=true]').textContent()), 'current station is checked');
  await p.screenshot({ path: shots + '/v53-item-menu.png', clip: { x: 640, y: 120, width: 640, height: 600 } });
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
  const ao1 = await p.evaluate(() => ({ a: aoaNow(), btn: document.querySelector('.aoabtn').textContent, tag: (/<b class=aoatag[^>]*>([^<]*)</.exec(sortieView()) || [])[1], defDis: document.querySelector('.defbtn').disabled, aodDis: document.querySelector('.aodbtn').disabled, sum: document.getElementById('sitsum').textContent }));
  ok(ao1.a === 1 && /ALL-OUT ATTACK: DETERMINED/.test(ao1.btn) && /AOA: DETERMINED \/\/ NO DEFENSE/.test(ao1.tag), 'AoA button toggles on (Determined), amber header tag ' + JSON.stringify(ao1));
  ok(ao1.defDis && ao1.aodDis, 'AoA disables the defense buttons');
  ok(/AOA DETERMINED \+4/.test(ao1.sum), 'TOTAL MOD notes the Determined +4 for the melee weapon: ' + ao1.sum);
  await p.locator('.aoabtn').click({ button: 'right' }); await wait(200);
  const mm = await p.locator('#tabmenu button').allTextContents();
  ok(mm.length === 6 && mm.some(t => /STRONG/.test(t)) && mm.some(t => /FEINT/.test(t)) && !mm.some(t => /SUPPRESSION/.test(t)), 'melee AoA menu: Off + Determined/Double/Feint/Strong/Long ' + JSON.stringify(mm));
  await p.screenshot({ path: shots + '/v53-aoa-menu.png', clip: { x: 640, y: 120, width: 640, height: 560 } });
  await p.locator('#tabmenu button', { hasText: 'STRONG' }).click(); await wait(200);
  ok(await p.evaluate(() => aoaNow() === 4), 'menu sets Strong');
  await p.evaluate((i) => itemClick(i), idx.r5); await wait(200);
  ok(await p.evaluate(() => aoaNow() === 0), 'switching to a ranged weapon clears Strong (not valid at range)');
  await p.locator('.aoabtn').click({ button: 'right' }); await wait(200);
  const rm = await p.locator('#tabmenu button').allTextContents(); await p.keyboard.press('Escape');
  ok(rm.length === 3 && rm.some(t => /SUPPRESSION/.test(t)) && !rm.some(t => /STRONG|FEINT|DOUBLE|LONG/.test(t)), 'ROF 5 ranged menu: Off, Determined, Suppression ' + JSON.stringify(rm));
  await p.evaluate((i) => itemClick(i), idx.r1); await wait(200);
  await p.locator('.aoabtn').click({ button: 'right' }); await wait(200);
  const r1m = await p.locator('#tabmenu button').allTextContents(); await p.keyboard.press('Escape');
  ok(r1m.length === 2 && !r1m.some(t => /SUPPRESSION/.test(t)), 'ROF 1 ranged menu: no Suppression ' + JSON.stringify(r1m));
  ok(await p.evaluate(() => { setAoa(6); return aoaNow(); }) === 0, 'Suppression refused on a ROF 1 weapon');
  await p.evaluate((i) => { itemClick(i); setAoa(1); }, idx.r5); await wait(200);
  ok(await p.evaluate(() => /AOA DETERMINED \+1/.test(document.getElementById('sitsum').textContent)), 'Determined shows +1 on the ranged weapon');
  await p.evaluate(() => { window.scrollTo(0, 0); }); await wait(2000);
  { const tg = await p.locator('.tgv').boundingBox(); const ac = await p.locator('.aoactl').boundingBox();
    await p.screenshot({ path: shots + '/v53-targeter-aoa.png', clip: { x: Math.max(0, tg.x - 12), y: Math.max(0, tg.y - 40), width: tg.width + 24, height: ac.y + ac.height - tg.y + 52 } }); }
  await p.locator('.aoabtn').click(); await wait(200);
  ok(await p.evaluate(() => aoaNow() === 0 && !document.querySelector('.defbtn').disabled), 'AoA button toggles off, defenses back');
  // ---- DEFENSE in PILOTING: one button, right-click type, Retreat, All-Out Defense ----
  await p.evaluate((i) => setMount(i, 'LH'), idx.sh); await wait(200);
  const d0 = await p.evaluate(() => ({ inPil: !!document.querySelector('.pilot .pbox .pdef .defbtn'), old: !!document.querySelector('.defgrid'), txt: document.querySelector('.defbtn').textContent }));
  ok(d0.inPil && !d0.old && /DEFENSE: DODGE/.test(d0.txt), 'Defense button in the PILOTING box, default Dodge; old DEFENSE section gone ' + JSON.stringify(d0));
  await p.locator('.defbtn').click({ button: 'right' }); await wait(200);
  const dm = await p.locator('#tabmenu button').allTextContents();
  ok(dm.some(t => /DODGE/.test(t)) && dm.some(t => /TURN BLOW/.test(t)) && dm.some(t => /PARRY/.test(t)) && dm.some(t => /BLOCK/.test(t)), 'defense menu: Dodge, Turn Blow, Parry, Block ' + JSON.stringify(dm));
  await p.locator('#tabmenu button', { hasText: 'PARRY' }).click(); await wait(200);
  const pr = await p.evaluate(() => { const said = [], _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; document.querySelector('.defbtn').click(); say = _s; return { txt: document.querySelector('.defbtn').textContent, rolled: said.some(m => /data-rcid/.test(m) && /PARRY/.test(m)) }; });
  ok(/DEFENSE: PARRY/.test(pr.txt) && pr.rolled, 'menu sets Parry; click rolls it ' + JSON.stringify(pr));
  const rt = await p.evaluate(() => { const pk = 'def|' + wKey(weapons().find(w => /MELEE/.test(wLab(w)))), bk = 'def|' + wKey(shields()[0]), a = [slOf('dod|pil'), slOf(pk), slOf(bk), slOf('def|pil')]; togRetreat(true); const b = [slOf('dod|pil'), slOf(pk), slOf(bk), slOf('def|pil')]; togRetreat(false); return b.map((v, i) => v - a[i]); });
  ok(JSON.stringify(rt) === '[3,1,1,1]', 'Retreat: Dodge +3, Parry/Block/Turn Blow +1 ' + JSON.stringify(rt));
  await p.locator('.aodbtn').click(); await wait(200);
  const ad = await p.evaluate(() => { const pk = 'def|' + wKey(weapons().find(w => /MELEE/.test(wLab(w)))); const on = [aodNow(), document.querySelector('.aodbtn').textContent, slOf(pk), slOf('dod|pil')]; const said = [], _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; atkRoll(0); say = _s; const ref = said.some(m => /ALL-OUT DEFENSE :: no attack/.test(m)); setAod(0); return { on, off: [slOf(pk), slOf('dod|pil')], ref }; });
  ok(ad.on[0] === 2 && /INCREASED PARRY \+2/.test(ad.on[1]) && ad.on[2] - ad.off[0] === 2 && ad.on[3] === ad.off[1], 'All-Out Defense button: Increased Parry +2 (current defense), Dodge unchanged ' + JSON.stringify(ad));
  ok(ad.ref, 'All-Out Defense: ATK refused (no attack this turn)');
  await p.locator('.aodbtn').click({ button: 'right' }); await wait(200);
  const om = await p.locator('#tabmenu button').allTextContents();
  ok(om.some(t => /DOUBLE DEFENSE/.test(t)) && om.some(t => /INCREASED DODGE/.test(t)) && om.some(t => /INCREASED BLOCK/.test(t)), 'All-Out Defense menu ' + JSON.stringify(om));
  await p.locator('#tabmenu button', { hasText: 'DOUBLE DEFENSE' }).click(); await wait(200);
  const dd = await p.evaluate(() => { const said = [], _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; dodgeRoll(); say = _s; return [aodNow(), /DOUBLE DEFENSE/.test([...RC.values()].pop().d.join(' '))]; });
  ok(dd[0] === 5 && dd[1], 'Double Defense set and noted on the defense roll ' + JSON.stringify(dd));
  ok(await p.evaluate(() => { setAoa(1); return [aoaNow(), aodNow()]; }).then(v => v[0] === 1 && v[1] === 0), 'setting AoA clears All-Out Defense');
  await p.evaluate(() => setAoa(0));
  await p.evaluate((i) => { setMount(i, ''); }, idx.sh); await wait(200);
  await p.locator('.defbtn').click({ button: 'right' }); await wait(200);
  const dm2 = await p.locator('#tabmenu button').allTextContents(); await p.keyboard.press('Escape');
  ok(!dm2.some(t => /BLOCK/.test(t)), 'Block only listed with a usable (held) shield ' + JSON.stringify(dm2));
  await p.evaluate((i) => setMount(i, 'LH'), idx.sh); await wait(1500);
  { const pb = await p.locator('.pdef').boundingBox(); await p.evaluate(() => window.scrollTo(0, 0)); await p.locator('.pdef').scrollIntoViewIfNeeded(); await wait(600); const bb = await p.locator('.pdef').boundingBox(); await p.screenshot({ path: shots + '/v53-defense-piloting.png', clip: { x: 0, y: Math.max(0, bb.y - 120), width: 660, height: 220 } }); }
  // ---- regressions from 5.2.x ----
  const rg = await p.evaluate(() => {
    const o = {}, W = weapons(), kr = W.findIndex(w => wRof(w) === 5), w = W[kr], L = locs();
    ['Left Arm', 'Right Arm', 'Left Leg'].forEach(n => S.tel.hp[L.indexOf(n)] = 0); o.hitCore = hitMod('Core'); ['Left Arm', 'Right Arm', 'Left Leg'].forEach(n => S.tel.hp[L.indexOf(n)] = maxOf(L.indexOf(n))); R();
    awBind(kr, 1); S.dmgN = 5; S.pilot.rng = '1'; w.am = 30; R(); const R0 = Math.random; Math.random = () => 0; atkRoll(kr); const sl = slOf('atk|' + wKey(w) + '|' + kr);
    o.hitExpect = Math.min(5, 1 + Math.floor((sl - 3) / rclOf(w))); rollW(kr); o.hitRolls = S.rolls[kr].atk.length;
    const said = [], _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; rollW(kr); o.used = said.some(m => /already rolled/.test(m));
    Math.random = () => 0.999; atkRoll(kr); rollW(kr); o.miss = said.some(m => /missed/.test(m)); say = _s; Math.random = R0;
    S.core = S.core || {}; S.core.R = structuredClone(DB.find(x => x.c == 'R' && /HEAT:10 VENT:2/.test(x.s))); R();
    S.pilot.eng = '3'; S.tel.heat = 5; Math.random = () => 0.999; heatVent(); o.ventFail = 5 - S.tel.heat; S.pilot.eng = '4'; S.tel.heat = 5; Math.random = () => 0; heatVent(); o.ventOk1 = 5 - S.tel.heat; Math.random = R0; R();
    return o;
  });
  ok(rg.hitCore === 0, 'Core to-hit +0');
  ok(rg.hitRolls === rg.hitExpect && rg.used && rg.miss, 'damage rolls = 1 + degrees; used and missed refuse ' + JSON.stringify(rg));
  ok(rg.ventFail === 1 && rg.ventOk1 === 2, 'vent floors 1 / 2');
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
  await p.evaluate((k) => { awBind(k, 1); S.dmgN = 5; S.pilot.rng = '1'; weapons()[k].am = 30; R(); const R0 = Math.random; Math.random = () => 0; atkRoll(k); Math.random = R0; }, kr5); await wait(3500);
  const c1 = await p.evaluate(() => { const els = [...document.querySelectorAll('#log .rc')], el = els[els.length - 1]; return { sum: el.textContent, exp: el.getAttribute('aria-expanded'), role: el.getAttribute('role'), tab: el.tabIndex, id: el.dataset.rcid }; });
  ok(/^LOCAL \/ .+ · 30mm.* · CRIT SUCCESS · \d+ HITS/.test(c1.sum) && c1.exp === 'false' && c1.role === 'button' && c1.tab === 0, 'attack roll: one compact line USER / FRAME · WEAPON · N HITS ' + JSON.stringify(c1));
  await p.locator(`#log .rc[data-rcid="${c1.id}"]`).click(); await wait(200);
  const c2 = await p.evaluate((id) => { const el = document.querySelector(`#log .rc[data-rcid="${id}"]`), d = el.nextElementSibling; return { exp: el.getAttribute('aria-expanded'), det: d && d.classList.contains('rcd') ? d.textContent : '' }; }, c1.id);
  ok(c2.exp === 'true' && /3d6 \[1, 1, 1\] = 3 vs SL/.test(c2.det) && /SUCCESS BY/.test(c2.det) && /DEGREES OF SUCCESS/.test(c2.det), 'click expands the individual rolls (to-hit, SL, margin, degrees) ' + JSON.stringify(c2));
  await p.screenshot({ path: shots + '/v53-console-cards.png', clip: { x: 0, y: 0, width: 1280, height: 900 } });
  await p.locator(`#log .rc[data-rcid="${c1.id}"]`).focus(); await p.keyboard.press('Enter'); await wait(200);
  ok(await p.evaluate((id) => { const el = document.querySelector(`#log .rc[data-rcid="${id}"]`); return el.getAttribute('aria-expanded') === 'false' && !(el.nextElementSibling && el.nextElementSibling.classList.contains('rcd')); }, c1.id), 'Enter on the focused line collapses it');
  await p.keyboard.press(' '); await wait(200);
  ok(await p.evaluate((id) => document.querySelector(`#log .rc[data-rcid="${id}"]`).getAttribute('aria-expanded') === 'true', c1.id), 'Space expands it');
  await p.evaluate((k) => rollW(k), kr5); await wait(2500);
  const c3 = await p.evaluate((id) => { const els = document.querySelectorAll(`#log .rc[data-rcid="${id}"]`), el = els[0], d = el.nextElementSibling; return { n: els.length, sum: el.textContent, det: d ? d.textContent : '' }; }, c1.id);
  ok(c3.n === 1 && /HITS · DMG \d+/.test(c3.sum) && /DAMAGE 1\//.test(c3.det), 'damage rolls fold into the same attack line (and its open details) ' + JSON.stringify(c3));
  await p.evaluate(() => { setAod(0); setAoa(0); const R0 = Math.random; Math.random = () => 0.5; dodgeRoll(); Math.random = R0; }); await wait(3000);
  const c4 = await p.evaluate(() => { const els = [...document.querySelectorAll('#log .rc')]; return els[els.length - 1].textContent; });
  ok(/^LOCAL \/ .+ · DODGE · [+-]\d+ Do[SF]/.test(c4), 'other rolls: User / Mech / Action / +n DoS or -n DoF ' + c4);
  ok(await p.evaluate(() => { const r = rollCard53; let out = ''; const _e = rcEmit; rcEmit = (rc) => { out = rc.r }; r('PILOTING (MECHA)', 'pil|x', [6, 6, 6], 18, 12, false, 6, 'FAILURE by 6 :: 1 DEGREE OF FAILURE'); rcEmit = _e; return out === 'CRIT FAIL · -1 DoF'; }), 'crit fail is called out on the line');
  await p.evaluate(() => { awBind(weapons().findIndex(w => wRof(w) === 5), 1); R(); window.scrollTo(0, 0); }); await wait(2500);
  await p.screenshot({ path: shots + '/v53-sheet-full.png', fullPage: false });
  ok(errs.length === 0, 'no console errors during the run ' + JSON.stringify(errs));
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
