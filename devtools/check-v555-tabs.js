// v5.5.5 tab colours (Overseer): grey default outline; unit name = frame STATUS colour; custom owner = TAB colour
// (tab owner name + console chat/roll lines); Closed/Unknown grey; MP sync. Shots: [base] [outdir]. Fresh dev server.
const { chromium } = require('/workspace/pw/node_modules/playwright-core'); const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8080', out = process.argv[3] || '/workspace/forge-os/feedback/v555d-shots';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const GREY = 'rgb(95, 99, 102)', GREY_ON = 'rgb(138, 143, 147)';
const rgb = h => { h = h.replace('#', ''); return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`; };
// colour of a CSS value as the browser resolves it
const resolve = (p, v) => p.evaluate(v => { const s = document.createElement('span'); s.style.color = v; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; }, v);
// damage states: scale every location to a fraction of its max (and Core/Cabin for CRIT/LOST)
const STATES = [['all', 1], ['light', .5], ['all', .9], ['all', .75], ['severe', 0], ['core', .6], ['core', 0]];
async function setState(p, kind, f) {
  await p.evaluate(([kind, f]) => { const St = Forge.state(), t = St.tel, L = locs(); t.hp = t.hp.map((v, i) => i < L.length ? Math.round((maxOf(i) || 1) * (kind === 'all' ? f : 1)) : v);
    const keep = [L.indexOf(isMech() ? 'Core' : 'Chassis'), L.indexOf('Crew Cabin')];
    if (kind === 'light') t.hp[L.findIndex((n, i) => !keep.includes(i))] = Math.round((maxOf(L.findIndex((n, i) => !keep.includes(i))) || 1) * f); // one limb damaged
    if (kind === 'severe') L.forEach((n, i) => { if (i < baseLocs().length && !keep.includes(i)) t.hp[i] = 0; }); // limbs destroyed, Core/Cabin intact
    if (kind === 'core') t.hp[keep[0]] = Math.round((baseHP() || 1) * f); Forge.render(); }, [kind, f]);
  await wait(250);
}
const tabInfo = (p, sel) => p.evaluate(sel => { const t = document.querySelector(sel); if (!t) return null; const n = t.querySelector('.stn'), cs = getComputedStyle(t);
  const ownEl = [...t.querySelectorAll('.stx')].find(x => /^\[.*\]$/.test(x.textContent.trim()) && !/^\[(R|D|X|H|S|Hold|Sortie|Dupe)\]$/.test(x.textContent.trim()) || x.classList.contains('asg'));
  return { border: cs.borderTopColor, name: n && getComputedStyle(n).color, cls: n && n.className, own: ownEl && ownEl.textContent.trim(), ownCol: ownEl && getComputedStyle(ownEl).color }; }, sel);
const readout = p => p.evaluate(() => { const b = [...document.querySelectorAll('#con .sorhead b')].find(x => /^fs-/.test(x.className)); return b ? { txt: b.textContent, cls: b.className, col: getComputedStyle(b).color } : null; });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); const errs = [];
  const page = async (name, w = 1600, h = 1000) => { const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); await p.goto(base + '/terminal.html'); await p.waitForTimeout(1200); return p; };
  // ---------- SOLO ----------
  const s = await page('solo');
  await s.evaluate(async (fx) => { login(4); await loadManifestFile(new File([fx], 'a.txt')); await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'PB-7 / KAGE')], 'b.txt')); }, fx); await wait(1200);
  await s.evaluate(() => { S.view = 'sortie'; R(); }); await wait(300);
  let t0 = await tabInfo(s, '.stab:not(.on)'), t1 = await tabInfo(s, '.stab.on');
  ok(t0.border === GREY && t1.border === GREY_ON, `solo: default tab outline is dull grey (${t0.border}; active ${t1.border})`);
  const seen = new Set();
  for (const [k, f] of STATES) { await setState(s, k, f); const r = await readout(s), t = await tabInfo(s, '.stab.on'); seen.add(r.txt);
    ok(t.cls.includes(r.cls) && t.name === r.col, `solo ${r.txt}: tab name colour ${t.name} = STATUS readout colour ${r.col}`);
    if (true) await s.screenshot({ path: `${out}/solo-tabs-${r.txt.toLowerCase()}.png`, clip: { x: 0, y: 0, width: 1600, height: 210 } }); }
  ok(['NOMINAL', 'LIGHT', 'DEGRADE', 'IMPAIR', 'SEVERE', 'CRIT', 'LOST'].every(x => seen.has(x)), 'solo: all 7 status states covered: ' + [...seen].join(', '));
  await setState(s, 'all', 1);
  // owner: none -> LOCAL grey; custom owner -> theme accent (no tab colour) then the tab colour
  const soloRoll = async () => { await s.evaluate(() => { S.pilot = Object.assign({}, S.pilot, { pil: '12' }); pilRoll(); }); await wait(500);
    return s.evaluate(() => { const c = [...document.querySelectorAll('#log .rc')].pop(); const w = c && c.querySelector('span[style]'); return w ? { u: w.textContent, col: getComputedStyle(w).color } : null; }); };
  let r0 = await soloRoll(); ok(r0 && r0.u === 'LOCAL' && r0.col === await resolve(s, 'var(--muted)'), `solo: no owner -> roll author ${r0 && r0.u} grey`);
  await s.evaluate(() => { S.own = 'ACE <b>'; R(); }); let r1 = await soloRoll();
  ok(r1 && r1.u === 'ACE <b>' && r1.col === await resolve(s, 'var(--cyan)'), `solo: custom owner, no tab colour -> theme accent (${r1 && r1.col}); name escaped`);
  await s.evaluate(() => { shClick(S.cur); shClick(S.cur); shClick(S.cur); }); await wait(300); // col 3 = #ff5a5a
  let r2 = await soloRoll(), t2 = await tabInfo(s, '.stab.on');
  ok(t2.border === rgb('#ff5a5a') && r2.col === rgb('#ff5a5a'), `solo: custom owner roll author = tab colour (${r2.col}; outline ${t2.border})`);
  ok(t2.name === (await readout(s)).col, 'solo: with a custom tab colour the name still shows the status colour');
  await s.screenshot({ path: `${out}/solo-tab-custom-owner-console.png`, clip: { x: 0, y: 0, width: 1600, height: 1000 } });
  await s.context().close();
  // ---------- MP ----------
  const seat = async (name) => { const p = await page(name); await p.evaluate(() => login(6)); await wait(300); await p.fill('#mpname', name); await p.evaluate(() => mpAuth()); await p.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 }); return p; };
  const H = await seat('HOSTA');
  await H.evaluate(async (fx) => { await loadManifestFile(new File([fx], 'h.txt')); }, fx); await wait(1500);
  const P = await seat('PILOTB');
  await P.evaluate(async (fx) => { await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'PB-7 / KAGE')], 'p.txt')); }, fx); await wait(3000);
  for (const X of [H, P]) await X.evaluate(() => { const S = Forge.state(); S.view = 'sortie'; Forge.render(); const cb = document.getElementById('cb'); if (cb.classList.contains('cs0')) cb.click(); });
  const sel = name => `.stab:has(.stn)`; // pick by name below
  const tabBy = (p, re) => p.evaluate(re => { const t = [...document.querySelectorAll('.stab')].find(x => new RegExp(re).test((x.querySelector('.stn') || {}).textContent || '')); if (!t) return null; t.setAttribute('data-probe', re); return true; }, re);
  const info = async (p, re) => { await tabBy(p, re); return tabInfo(p, `.stab[data-probe="${re}"]`); };
  const until = async (fn, ms = 12000) => { const t0 = Date.now(); let v; while (Date.now() - t0 < ms) { v = await fn(); if (v) return v; await wait(400); } return v; };
  let hk = await until(async () => { const v = await info(H, 'KAGE'); return v && /PILOTB/.test(v.own || '') ? v : null; });
  ok(hk && hk.border === GREY && hk.ownCol === await resolve(H, 'var(--cyan)'), `MP host view: pilot unit, no tab colour -> grey outline, owner ${hk && hk.own} in theme accent (${hk && hk.ownCol})`);
  let hm = await info(H, 'MUSHA');
  ok(hm && /Closed/.test(hm.own || '') && hm.ownCol === await resolve(H, 'var(--muted)'), `MP host view: Closed owner stays grey (${hm && hm.own} ${hm && hm.ownCol})`);
  // pilot paints its unit's tab (click the active tab twice -> colour 2)
  await P.evaluate(() => { const t = document.querySelector('.stab.on'); t.click(); }); await wait(400); await P.evaluate(() => { document.querySelector('.stab.on').click(); }); await wait(600);
  const pk = await info(P, 'KAGE'); const want = pk.border;
  ok(want !== GREY && want !== GREY_ON && pk.ownCol === want, `MP pilot view: owner on the tab = tab colour (${pk.own} ${pk.ownCol} / ${want})`);
  hk = await until(async () => { const v = await info(H, 'KAGE'); return v && v.border === want && v.ownCol === want ? v : null; });
  ok(!!hk, `MP sync: host sees the pilot's tab colour and owner in it (${hk && hk.border})`);
  // status sync: pilot damages its unit; both views' tab name follows the status readout colour
  for (const [k, f] of [['light', .5], ['all', .75], ['severe', 0], ['core', .6], ['core', 0], ['all', 1]]) {
    await setState(P, k, f); const r = await readout(P);
    const pv = await info(P, 'KAGE'); ok(pv.name === r.col, `MP pilot view ${r.txt}: tab name colour = readout`);
    const hv = await until(async () => { const v = await info(H, 'KAGE'); return v && v.cls.includes(r.cls) && v.name === r.col ? v : null; });
    ok(!!hv, `MP sync ${r.txt}: host's tab name for the pilot unit turns ${r.col}`);
    if (r.txt !== 'NOMINAL') { await H.screenshot({ path: `${out}/mp-host-tabs-${r.txt.toLowerCase()}.png`, clip: { x: 0, y: 0, width: 1600, height: 210 } }); await P.screenshot({ path: `${out}/mp-pilot-tabs-${r.txt.toLowerCase()}.png`, clip: { x: 0, y: 0, width: 1600, height: 210 } }); }
  }
  // console: pilot chat + roll -> host sees the author in the pilot's tab colour; host roll on its Closed unit -> Unknown grey on the pilot
  await P.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '12' }); pilRoll(); }); await wait(300);
  await P.evaluate(() => { const ci = document.getElementById('CI'); ci.value = 'hello <i>x</i>'; ci.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }); await wait(300);
  const logCol = (p, kind) => p.evaluate(kind => { const ls = [...document.querySelectorAll('#log > div')].filter(d => kind === 'chat' ? d.dataset.k === 'chat' : d.querySelector('.rc') || d.classList.contains('rc')); const d = ls.pop(); if (!d) return null; const w = d.querySelector('span[style], b[style]'); return w ? { u: w.textContent, col: getComputedStyle(w).color, txt: d.textContent.slice(0, 80) } : null; }, kind);
  const pc = await logCol(P, 'chat'), pr = await logCol(P, 'roll');
  ok(pc && pc.col === want && /hello <i>x<\/i>/.test(pc.txt), `MP pilot view: own chat author in tab colour, text escaped (${pc && pc.u} ${pc && pc.col})`);
  ok(pr && pr.col === want && /PILOTB/.test(pr.u), `MP pilot view: own roll author in tab colour (${pr && pr.u})`);
  const hc = await until(async () => { const v = await logCol(H, 'chat'); return v && /PILOTB/.test(v.u) ? v : null; });
  ok(hc && hc.col === want, `MP sync: host console chat author PILOTB in the pilot's tab colour (${hc && hc.col})`);
  const hr = await until(async () => { const v = await logCol(H, 'roll'); return v && /PILOTB/.test(v.u) ? v : null; });
  ok(hr && hr.col === want, `MP sync: host console roll author PILOTB in the pilot's tab colour (${hr && hr.col})`);
  await H.evaluate(() => { const S = Forge.state(); const i = S.sheets.findIndex(s => /MUSHA/.test(s.name || (s.d && s.d.id) || '')); if (i >= 0 && i !== S.cur) mpGo(S.sheets[i].uid); }); await wait(500);
  await H.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '12' }); pilRoll(); }); await wait(300);
  const hu = await logCol(H, 'roll');
  ok(hu && /Unknown/.test(hu.u) && hu.col === await resolve(H, 'var(--muted)'), `MP host view: roll on the Closed unit reads ${hu && hu.u} in grey`);
  const pu = await until(async () => { const v = await logCol(P, 'roll'); return v && /Unknown/.test(v.u) ? v : null; });
  ok(pu && pu.col === await resolve(P, 'var(--muted)'), `MP sync: pilot sees the Closed unit's roll as Unknown in grey`);
  await H.screenshot({ path: `${out}/mp-host-console.png` }); await P.screenshot({ path: `${out}/mp-pilot-console.png` });
  const cbH = await (await H.$('#cb')).boundingBox(); await H.screenshot({ path: `${out}/mp-host-console-closeup.png`, clip: cbH });
  ok(errs.length === 0, 'no page errors ' + errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? `FAILED ${fails}` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
