// FORGE-OS 5.2.1 two-seat check (fresh dev server). Bug A (hits survive sync), RESET-LOCAL / RESYNC confirm, 413 path, RoF cap.
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8080';
const shots = process.argv[3] || '/workspace/forge-os/out-v5.2/shots';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  const seat = async (name) => {
    const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/status of (409|413)|ERR_FAILED|net::/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
    await p.goto(base + '/terminal.html'); await p.waitForTimeout(1500);
    await p.evaluate(() => login(6)); await p.waitForTimeout(300);
    await p.fill('#mpname', name); await p.evaluate(() => mpAuth());
    await p.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 });
    return { ctx, p };
  };
  const logHas = async (p, re, ms = 9000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (re.test(await p.evaluate(() => document.getElementById('log').textContent))) return true; await wait(300); } return false; };
  const H = await seat('HOSTA');
  await H.p.evaluate(async (fx) => { await loadManifestFile(new File([fx], 'h.txt')); }, fx); await wait(1500);
  const P = await seat('PILOTB');
  await P.p.evaluate(async (fx) => { await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'PB-7 / KAGE')], 'p.txt')); }, fx); await wait(2500);
  // arm the pilot unit: a ranged weapon (ROF 5) and a ROF 1 copy, both held
  const k = await P.p.evaluate(() => {
    const S = Forge.state(); const rng = DB.find(x => x.c == 'A' && hasRng(x) && /ROF:5/.test(x.s) && /AMMO:/.test(x.s) && !x.th);
    const one = Object.assign(structuredClone(rng), { mount: 'LH', s: rng.s.replace(/ROF:\S+/, 'ROF:1') });
    S.items.push(Object.assign(structuredClone(rng), { mount: 'RH' }), one);
    S.pilot = Object.assign({}, S.pilot, { [wKey(rng)]: '14', pil: '14' }); S.dmgN = 5; S.view = 'sortie'; Forge.render();
    const W = weapons(); return [W.findIndex(w => w.mount === 'RH' && hasRng(w)), W.findIndex(w => w.mount === 'LH' && hasRng(w))];
  });
  await wait(2500);
  // Bug A: ATK success, wait for syncs (weapon objects replaced), DMG uses the hits
  const a = await P.p.evaluate((k) => { const W = weapons(); W[k].am = 30; const R0 = Math.random; Math.random = () => 0; atkRoll(k); Math.random = R0; return [Forge.state().hitq && Forge.state().hitq[k], W[k]]; }, k[0]);
  await wait(3000);
  const a2 = await P.p.evaluate((k) => { const W = weapons(); const said = []; const _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; rollW(k); say = _s; return { replaced: true, rolls: Forge.state().rolls[k].atk.length, noRec: said.some(m => /NO ATTACK ROLL RECORDED/.test(m)) }; }, k[0]);
  ok(a[0] && a[0].n >= 2 && a2.rolls === a[0].n && !a2.noRec, 'Bug A: ATK success, 3s of sync, DMG rolls the stored hits ' + JSON.stringify([a[0], a2]));
  const hostQ = await H.p.evaluate(() => { const sh = Forge.state().sheets.find(s => s.d && s.d.id === 'PB-7'); return sh && sh.d.hitq; });
  ok(hostQ && Object.keys(hostQ).length, 'hit queue is synced sheet state (host copy has it) ' + JSON.stringify(hostQ));
  await wait(2500);
  const used = await P.p.evaluate((k) => { const said = []; const _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; const n0 = (Forge.state().rolls[k] || {}).atk; rollW(k); say = _s; return said.some(m => /NO HITS TO ROLL/.test(m) && /already rolled/.test(m)); }, k[0]);
  ok(used, 'DMG after the hits are used up refuses (after a sync)');
  await P.p.evaluate((k) => { const R0 = Math.random; Math.random = () => 0.999; atkRoll(k); Math.random = R0; }, k[0]);
  await wait(3000);
  const miss = await P.p.evaluate((k) => { const said = []; const _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; rollW(k); say = _s; return said.some(m => /NO HITS TO ROLL/.test(m) && /missed/.test(m)); }, k[0]);
  ok(miss, 'ATK miss, 3s of sync, DMG refuses');
  // RoF cap on the live table: ROF 1 weapon, targeter RoF 5 -> 1 hit, no RoF bonus
  const cap = await P.p.evaluate((k) => { const W = weapons(); W[k].am = 30; const R0 = Math.random; Math.random = () => 0; atkRoll(k); Math.random = R0; return [effRof(W[k]), Forge.state().hitq[k].n]; }, k[1]);
  ok(cap[0] === 1 && cap[1] === 1, 'RoF cap: ROF 1 weapon with targeter RoF 5 -> 1 round, 1 hit ' + JSON.stringify(cap));
  // RESET-LOCAL: edit then reset at once -> edit is sent first, then the command asks for CONFIRM
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '17' }); Forge.render(); exec('mp reset-local'); });
  ok(await logHas(P.p, /MP RESET-LOCAL CONFIRM/), 'RESET-LOCAL asks for confirmation');
  ok(await P.p.evaluate(() => Forge.state().view) === 'sortie', 'RESET-LOCAL without CONFIRM keeps the seat');
  const hs17 = await H.p.evaluate(() => { const sh = Forge.state().sheets.find(s => s.d && s.d.id === 'PB-7'); return sh.d.pilot.pil; });
  ok(hs17 === '17', 'the pending edit was flushed before the prompt (host sees 17): ' + hs17);
  await P.p.evaluate(() => exec('mp reset-local confirm')); await wait(2500);
  ok(await P.p.evaluate(() => Forge.state().view) === 'mpw', 'RESET-LOCAL CONFIRM releases the seat');
  await P.p.fill('#mpname', 'PILOTB'); await P.p.evaluate(() => mpAuth());
  await P.p.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 }); await wait(2500);
  ok(await P.p.evaluate(() => Forge.state().pilot.pil) === '17', 'Piloting 17 survives RESET-LOCAL (was 15 in v5.2.0)');
  // RESYNC: online -> sends first, nothing to drop
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '18' }); Forge.render(); exec('mp resync'); });
  await wait(3500);
  const rs = [await P.p.evaluate(() => Forge.state().pilot.pil), await H.p.evaluate(() => Forge.state().sheets.find(s => s.d && s.d.id === 'PB-7').d.pilot.pil)];
  ok(rs[0] === '18' && rs[1] === '18', 'RESYNC sends the pending edit first, no data lost ' + JSON.stringify(rs));
  // RESYNC with the link down -> refuses to drop without CONFIRM
  await P.ctx.route('**/api/forge', r => r.abort());
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '19' }); Forge.render(); exec('mp resync'); });
  ok(await logHas(P.p, /UNSENT: .*MP RESYNC CONFIRM/), 'RESYNC with unsent edits asks for CONFIRM');
  ok(await P.p.evaluate(() => Forge.state().pilot.pil) === '19', 'unconfirmed RESYNC kept the local edit');
  await P.p.evaluate(() => exec('mp reset-local confirm'));
  ok(await logHas(P.p, /RESET-LOCAL REFUSED :: UNSENT/), 'RESET-LOCAL CONFIRM refuses while edits are unsent (FORCE needed)');
  await P.ctx.unroute('**/api/forge'); await wait(4000);
  const hs19 = await H.p.evaluate(() => Forge.state().sheets.find(s => s.d && s.d.id === 'PB-7').d.pilot.pil);
  ok(hs19 === '19', 'edit sent once the link is back: ' + hs19);
  // 413: an oversized update is reported, trimmed and retried with backoff
  let pushes = 0, big = 0;
  P.p.on('request', r => { if (/api\/forge/.test(r.url()) && /"op":"push"/.test(r.postData() || '')) { pushes++; if ((r.postData() || '').length > 1.5e6) big++; } });
  await P.p.evaluate(() => { const S = Forge.state(); S.importReport = { warnings: ['X'.repeat(1600000)] }; Forge.render(); });
  ok(await logHas(P.p, /LINK REFUSED AN UPDATE \(TOO LARGE\)/), '413 shown as LINK REFUSED AN UPDATE (TOO LARGE)');
  await wait(6000);
  const st = await P.p.evaluate(() => [!!Forge.state().importReport, window.__forgeMP ? 1 : 0]);
  ok(pushes <= 8 && big <= 2, 'backoff: ' + pushes + ' pushes, ' + big + ' oversized in ~8s (was 32 in 6s)');
  ok(!st[0], 'second refusal dropped the oversized import report');
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '12' }); Forge.render(); }); await wait(3500);
  ok(await H.p.evaluate(() => Forge.state().sheets.find(s => s.d && s.d.id === 'PB-7').d.pilot.pil) === '12', 'link recovers after the trim (next edit lands)');
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { aoa: '1' }); S.view = 'sortie'; Forge.render(); window.scrollTo(0, 0); }); await wait(3000);
  await P.p.screenshot({ path: shots + '/v521-aoa-tag.png', clip: { x: 0, y: 0, width: 1600, height: 560 } });
  ok(errs.length === 0, 'no console errors on any seat ' + JSON.stringify(errs.slice(0, 5)));
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
