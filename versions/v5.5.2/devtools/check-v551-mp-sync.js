// FORGE-OS 5.2 two-seat check on a FRESH dev server (host = first seat). Usage: node check-v52-mp.js [base] [shotdir]
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8080';
const shots = process.argv[3] || '/workspace/forge-os/out-v5.5.1/shots';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  const seat = async (name) => {
    const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/status of 409/.test(m.text())) errs.push(name + ' console: ' + m.text()); }); // 409 = the protocol's conflict reply, expected in the collision step
    await p.goto(base + '/terminal.html'); await p.waitForTimeout(1500);
    await p.evaluate((n) => { login(6); }, name); await p.waitForTimeout(300);
    await p.fill('#mpname', name); await p.evaluate(() => mpAuth());
    await p.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 });
    return { ctx, p };
  };
  const H = await seat('HOSTA');
  await H.p.evaluate(async (fx) => { await loadManifestFile(new File([fx], 'h.txt')); }, fx); await wait(1500);
  const P = await seat('PILOTB');
  await P.p.evaluate(async (fx) => { await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'PB-7 / KAGE')], 'p.txt')); }, fx); await wait(2500);
  const roles = [await H.p.evaluate(() => Forge.state().sheets.length), await P.p.evaluate(() => (Forge.state().sheets || []).length)];
  ok(roles[0] >= 2, 'host sees both units ' + JSON.stringify(roles));
  // host context menu on the pilot's tab
  await H.p.evaluate(() => window.scrollTo(0, 0));
  const ptab = H.p.locator('.stab:not(.on)').first();
  await ptab.click({ button: 'right' }); await wait(200);
  const items = await H.p.locator('#tabmenu button').allTextContents();
  ok(items.some(t => /Assign pilot/.test(t)) && items.some(t => /Duplicate unit/.test(t)) && items.some(t => /holding bay|Deploy/.test(t)) && items.some(t => /Delete unit/.test(t)), 'host menu: ' + JSON.stringify(items));
  await H.p.screenshot({ path: shots + '/v55-sync-host-tab-menu.png', clip: { x: 0, y: 0, width: 1600, height: 400 } });
  await H.p.keyboard.press('Escape');
  // pilot edits skills on their own unit -> reaches the table
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '15' }); Forge.render(); }); await wait(2500);
  const hostSees = await H.p.evaluate(() => { const S = Forge.state(); const sh = S.sheets.find(s => s.name && /KAGE/.test(s.name) || (s.d && /^PB-7\b/.test(s.d.id))); return sh && sh.d && sh.d.pilot && sh.d.pilot.pil; });
  ok(hostSees === '15', 'pilot skill edit reaches the host: ' + hostSees);
  // guard: the host blanks the pilot's skills on the table copy; the pilot keeps theirs and re-sends
  await H.p.evaluate(() => { const S = Forge.state(); const sh = S.sheets.find(s => s.d && /^PB-7\b/.test(s.d.id)); sh.d = Object.assign({}, sh.d, { pilot: {} }); Forge.render(); }); await wait(3500);
  const after = await P.p.evaluate(() => [Forge.state().pilot && Forge.state().pilot.pil, document.getElementById('log').textContent.includes('SYNC GUARD')]);
  const hostAfter = await H.p.evaluate(() => { const sh = Forge.state().sheets.find(s => s.d && /^PB-7\b/.test(s.d.id)); return sh && sh.d.pilot && sh.d.pilot.pil; });
  ok(after[0] === '15' && after[1], 'empty table copy did not wipe the pilot skills (guard noted): ' + JSON.stringify(after));
  ok(hostAfter === '15', 'guard re-sent the pilot copy, table repaired: ' + hostAfter);
  // MP WHOAMI
  await P.p.evaluate(() => exec('/mp whoami')); await wait(6000);
  const who = await P.p.evaluate(() => document.getElementById('log').textContent);
  ok(/SEAT :: PILOTB/.test(who) && /YOUR EDITS ARE SAVED/.test(who), 'MP WHOAMI reports seat and write rights');
  // a second tab with the same callsign is refused (no ghost seat)
  const ctx3 = await b.newContext(); const p3 = await ctx3.newPage(); p3.on('pageerror', e => errs.push('dup pageerror: ' + e.message));
  await p3.goto(base + '/terminal.html'); await p3.waitForTimeout(1200); await p3.evaluate(() => login(6)); await p3.waitForTimeout(300);
  await p3.fill('#mpname', 'PILOTB'); await p3.evaluate(() => mpAuth()); await wait(1500);
  const dupLog = await p3.evaluate(() => document.getElementById('log').textContent);
  ok(/INTERCEPT REFUSED/.test(dupLog) && /active at the table/.test(dupLog), 'duplicate online callsign refused in the UI');
  await ctx3.close();
  // MP RESET-LOCAL releases the seat and re-entering the callsign re-takes the same seat (unit kept)
  const id0 = await P.p.evaluate(() => window.__forgeSelf);
  await P.p.evaluate(() => exec('/mp reset-local confirm')); await wait(2500);
  ok(await P.p.evaluate(() => Forge.state().view) === 'mpw', 'MP RESET-LOCAL returns to the callsign prompt');
  await P.p.fill('#mpname', 'PILOTB'); await P.p.evaluate(() => mpAuth());
  await P.p.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 }); await wait(2000);
  const id1 = await P.p.evaluate(() => window.__forgeSelf);
  const own = await P.p.evaluate(() => { const S = Forge.state(); const sh = S.sheets[S.cur]; return [sh && sh.ownerId === window.__forgeSelf, S.pilot && S.pilot.pil]; }); // lands on its own unit
  ok(id1 === id0 && own[0] && own[1] === '15', 'same seat re-taken, unit and skills intact ' + JSON.stringify([id0, id1, own]));
  // owner wins a same-field collision on their unit
  await H.p.evaluate(() => { const S = Forge.state(); const i = S.sheets.findIndex(s => s.d && /^PB-7\b/.test(s.d.id)); mpGo(S.sheets[i].uid); });
  await wait(800);
  await Promise.all([
    H.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '9' }); Forge.render(); }),
    P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '16' }); Forge.render(); }),
  ]);
  await wait(4000);
  const fin = [await H.p.evaluate(() => Forge.state().pilot.pil), await P.p.evaluate(() => Forge.state().pilot.pil)];
  ok(fin[0] === '16' && fin[1] === '16', 'collision on the pilot unit: owner value kept on both seats ' + JSON.stringify(fin));
  ok(errs.length === 0, 'no console errors on any seat ' + JSON.stringify(errs.slice(0, 5)));
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
