// FORGE-OS 5.5.4 quick checks for the Overseer-approved fixes: 3 shield first DR, 4 vent, 6 gold DoS/DMG, 7 parry step, 8 no heat DR on shields, 9 LOST frame cannot attack, 10 RoF bonus from rounds fired.
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:8080/terminal.html';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(2000);
  ok(await p.evaluate(() => APP_VERSION) === '5.5.4', 'APP_VERSION 5.5.4');
  await p.evaluate(async (fx) => { login(4); await loadManifestFile(new File([fx], 'm.txt'));
    const mel = DB.find(x => x.c == 'A' && /MELEE/.test(wLab(x)) && /DMG:/.test(x.s) && !x.th), sh = DB.find(x => isShield(x) && /(^| )DR:\d+\/\d+/.test(x.s));
    const rng = DB.find(x => x.c == 'A' && hasRng(x) && /ROF:5 /.test(x.s) && !x.th && /AMMO:/.test(x.s));
    S.items.push(Object.assign(structuredClone(mel), { mount: 'RH' }), Object.assign(structuredClone(sh), { mount: 'LH' }), Object.assign(structuredClone(rng), { mount: 'BL', sd: 1 }));
    S.core = Object.assign({}, S.core || {}, { R: structuredClone(DB.find(x => x.c == 'R' && x.n == 'LIGHT FISSION CELL')) }); S.pilot = { pil: '14', w_MELEE: '14', [wKey(sh)]: '12', [wKey(rng)]: '13', eng: '12' }; S.view = 'sortie'; R(); }, fx);
  await p.waitForTimeout(1500);
  // 3 + 8
  const sh = await p.evaluate(() => { const x = shields()[0], m = /(^| )DR:(\d+)\/(\d+)/.exec(x.s), n = 'Shield: ' + x.n; const t = tel(); const h0 = t.heat;
    const a0 = armorOf(n), c0 = armorOf('Core'); t.heat = heatCap(); const z = heatZone(), a1 = armorOf(n), c1 = armorOf('Core'); t.heat = h0; return { first: +m[2], second: +m[3], a0, a1, c0, c1, z, s: x.s.slice(0, 60) }; });
  ok(sh.a0 === sh.first && sh.first !== sh.second, '3: shield with two DR numbers reads the FIRST ' + JSON.stringify(sh));
  ok(sh.z === 2 && sh.c1 < sh.c0 && sh.a1 === sh.a0, '8: redline heat halves frame DR but not shield DR ' + JSON.stringify(sh));
  // 4 vent
  const vent = await p.evaluate(() => { const out = {}; const t = tel(), v = Math.max(1, ventBase()); out.v = v; const R0 = Math.random;
    t.heat = heatCap(); Math.random = () => 0.4; const sl = slOf('full|eng'); let b = heatNow(); heatVent(); out.succ = b - heatNow(); out.wantS = Math.min(b, v + 1 + (sl - 9)); out.sl = sl;
    t.heat = heatCap(); Math.random = () => 0.99; b = heatNow(); heatVent(); out.fail = b - heatNow(); out.wantF = v;
    t.heat = heatCap(); Math.random = () => 0.4; const R1 = S.core.R; S.core.R = structuredClone(DB.find(x => x.c == 'R' && x.n == 'HEAVY FUSION CORE')); out.v2 = ventBase(); t.heat = heatCap(); b = heatNow(); heatVent(); out.hi = b - heatNow(); S.core.R = R1;
    Math.random = R0; t.heat = 0; R(); return out; });
  ok(vent.succ === vent.wantS && vent.fail === vent.wantF && vent.v2 > vent.v && vent.hi === vent.succ + (vent.v2 - vent.v), '4: vent fail = VENT, success = VENT + 1 + DoS, higher VENT vents more ' + JSON.stringify(vent));
  ok(await p.evaluate(() => !/MINIMUM 1 HEAT SHED/.test(heatVent.toString()) && !document.documentElement.innerHTML.includes("FAILED :: MINIMUM 1 HEAT SHED")), '4: dead vent code removed');
  // 6 gold
  await p.evaluate(() => { const k = weapons().findIndex(w => hasRng(w) && wRof(w) === 5); awBind(k, 1); weapons()[k].am = 15; const R0 = Math.random; Math.random = () => 0.2; atkRoll(k); rollW(k); Math.random = R0; });
  await p.waitForTimeout(4000);
  const gold2 = await p.evaluate(() => {
    const g = [...document.querySelectorAll('#log .rc .rcgold')]; const last = [...document.querySelectorAll('#log .rc')].pop(); return { n: g.length, col: g.length ? getComputedStyle(g[g.length - 1]).color : '', txt: g.map(e => e.textContent).slice(-4), line: last && last.textContent.slice(0, 120), fn: rcGold('+3 DoS · DMG 12, 40') }; });
  const gold = gold2; ok(gold.n >= 2 && gold.col === 'rgb(255, 215, 0)' && gold.txt.some(t => /DoS/.test(t)) && gold.txt.some(t => /^\d/.test(t)) && /rcgold>\+3 DoS<[^]*rcgold>12, 40</.test(gold.fn), '6: DoS and damage numbers in gold ' + JSON.stringify(gold));
  // 7 parry
  const parry = await p.evaluate(() => { const k = weapons().findIndex(w => /MELEE/.test(wLab(w))); let args = null; const _s = skillRoll; skillRoll = function () { args = [...arguments]; }; parryRoll(k); skillRoll = _s;
    let blk = null; skillRoll = function () { blk = [...arguments]; }; blockRoll(0); skillRoll = _s; return { inc: args && args[3], tag: args && args[4], finc: args && args[5], blk: blk && [blk[3], blk[4], blk[5]] }; });
  ok(parry.inc === 1 && parry.tag !== 'RECOIL' && parry.finc === 1 && parry.blk[0] === 1, '7: parry uses degree step 1 (like Block), not RCL ' + JSON.stringify(parry));
  // 10 RoF bonus from rounds actually fired
  const rof = await p.evaluate(() => { const k = weapons().findIndex(w => hasRng(w) && wRof(w) === 5), w = weapons()[k]; awBind(k, 1); S.dmgN = 5; const spec = 'atk|' + wKey(w) + '|' + k;
    w.am = 15; const full = slOf(spec), fb = rofBon(rofFired(w)); w.am = 2; const shrt = slOf(spec), sb = rofBon(rofFired(w)); HITCAP.set(w, 3); const hc = rofFired(w); HITCAP.delete(w); w.am = 15; R(); return { req: effRof(w), full, shrt, fb, sb, hc }; });
  ok(rof.req === 5 && rof.fb === 2 && rof.sb === 0 && rof.full - rof.shrt === 2 && rof.hc === 3, '10: RoF bonus uses rounds actually fired (5 requested, 2 left -> +0 instead of +2) ' + JSON.stringify(rof));
  // 9 LOST
  const lost = await p.evaluate(() => { const t = tel(), i = locs().indexOf('Core'), h = t.hp[i]; const k = weapons().findIndex(w => hasRng(w) && wRof(w) === 5); weapons()[k].am = 15; t.hp[i] = 0;
    const st = frameStatus()[0]; atkRoll(k); const said = [document.getElementById('log').textContent.slice(-3000), String(S.echo || '')]; const am = weapons()[k].am; t.hp[i] = h; atkRoll(k); const am2 = weapons()[k].am; R(); return { st, am, am2, said: said.join('|').slice(0, 120) }; });
  ok(lost.st === 'LOST' && lost.am === 15 && lost.am2 < 15, '9: LOST frame cannot attack (no ammo spent); restored frame can ' + JSON.stringify(lost));
  ok(errs.length === 0, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
