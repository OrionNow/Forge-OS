// v5.5.5 tab / owner colours (Overseer):
// - default tab outline is dull grey; tab-label unit name follows live STATUS colour
// - a real connected user's name is always their member colour (tab + console)
// - console mech name uses the sheet's tab colour, or dull grey #5f6366 when none is set
// - a host-created custom owner on a host-owned NPC sheet inherits the tab colour (dull grey if none)
// - Closed / Open / Unknown / LOCAL stay muted grey
// Shots: [base] [outdir]. Fresh dev server.
const { chromium } = require('/workspace/pw/node_modules/playwright-core'); const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8080', out = process.argv[3] || '/workspace/forge-os/feedback/v555e-shots';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const GREY = 'rgb(95, 99, 102)', GREY_ON = 'rgb(138, 143, 147)'; // #5f6366 / #8a8f93
const rgb = h => { h = h.replace('#', ''); return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`; };
const resolve = (p, v) => p.evaluate(v => { const s = document.createElement('span'); s.style.color = v; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; }, v);
const STATES = [['all', 1], ['light', .5], ['all', .9], ['all', .75], ['severe', 0], ['core', .6], ['core', 0]];
async function setState(p, kind, f) {
  await p.evaluate(([kind, f]) => { const St = Forge.state(), t = St.tel, L = locs(); t.hp = t.hp.map((v, i) => i < L.length ? Math.round((maxOf(i) || 1) * (kind === 'all' ? f : 1)) : v);
    const keep = [L.indexOf(isMech() ? 'Core' : 'Chassis'), L.indexOf('Crew Cabin')];
    if (kind === 'light') t.hp[L.findIndex((n, i) => !keep.includes(i))] = Math.round((maxOf(L.findIndex((n, i) => !keep.includes(i))) || 1) * f);
    if (kind === 'severe') L.forEach((n, i) => { if (i < baseLocs().length && !keep.includes(i)) t.hp[i] = 0; });
    if (kind === 'core') t.hp[keep[0]] = Math.round((baseHP() || 1) * f); Forge.render(); }, [kind, f]);
  await wait(250);
}
const tabInfo = (p, sel) => p.evaluate(sel => { const t = document.querySelector(sel); if (!t) return null; const n = t.querySelector('.stn'), cs = getComputedStyle(t);
  const ownEl = [...t.querySelectorAll('.stx')].find(x => /^\[.*\]$/.test(x.textContent.trim()) && !/^\[(R|D|X|H|S|Hold|Sortie|Dupe)\]$/.test(x.textContent.trim()) || x.classList.contains('asg'));
  return { border: cs.borderTopColor, name: n && getComputedStyle(n).color, cls: n && n.className, own: ownEl && ownEl.textContent.trim(), ownCol: ownEl && getComputedStyle(ownEl).color }; }, sel);
const readout = p => p.evaluate(() => { const b = [...document.querySelectorAll('#con .sorhead b')].find(x => /^fs-/.test(x.className)); return b ? { txt: b.textContent, cls: b.className, col: getComputedStyle(b).color } : null; });
const rollParts = p => p.evaluate(() => { const c = [...document.querySelectorAll('#log .rc')].pop(); if (!c) return null;
  const u = c.querySelector('.rcu'), f = c.querySelector('.rcf');
  return { u: u && u.textContent, uCol: u && getComputedStyle(u).color, f: f && f.textContent, fCol: f && getComputedStyle(f).color, txt: c.textContent.slice(0, 120) }; });
const logCol = (p, kind) => p.evaluate(kind => { const ls = [...document.querySelectorAll('#log > div')].filter(d => kind === 'chat' ? d.dataset.k === 'chat' : d.querySelector('.rc') || d.classList.contains('rc')); const d = ls.pop(); if (!d) return null;
  const u = d.querySelector('.rcu, .chn, span[style]'); const f = d.querySelector('.rcf');
  return { u: u && u.textContent, col: u && getComputedStyle(u).color, f: f && f.textContent, fCol: f && getComputedStyle(f).color, txt: d.textContent.slice(0, 80) }; }, kind);
const memCol = async (p, name) => {
  await p.evaluate(() => { const f = document.getElementById('mpfriends'), b = document.getElementById('rosterBtn');
    if (f && getComputedStyle(f).display === 'none' && b) b.click(); });
  await wait(300);
  return p.evaluate(name => { const b = [...document.querySelectorAll('#mpfriends b')].find(x => new RegExp('^' + name + '\\b', 'i').test(x.textContent.trim()));
    return b ? getComputedStyle(b).color : null; }, name);
};
(async () => {
  fs.mkdirSync(out, { recursive: true });
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
  const muted = await resolve(s, 'var(--muted)');
  const soloRoll = async () => { await s.evaluate(() => { S.pilot = Object.assign({}, S.pilot, { pil: '12' }); pilRoll(); }); await wait(500);
    return rollParts(s); };
  let r0 = await soloRoll();
  ok(r0 && r0.u === 'LOCAL' && r0.uCol === muted, `solo: no owner -> roll author ${r0 && r0.u} muted grey`);
  ok(r0 && r0.fCol === GREY, `solo: no tab colour -> console mech name dull grey (${r0 && r0.fCol}; name ${r0 && r0.f})`);
  ok(r0 && (await tabInfo(s, '.stab.on')).name === (await readout(s)).col, 'solo: tab label stays on the STATUS colour while the console mech name is dull grey');
  await s.evaluate(() => { S.own = 'ACE <b>'; R(); }); let r1 = await soloRoll();
  ok(r1 && r1.u === 'ACE <b>' && r1.uCol === GREY, `solo: custom owner, no tab colour -> dull grey (not theme accent) (${r1 && r1.uCol}); name escaped`);
  ok(r1 && r1.fCol === GREY, `solo: custom owner, no tab colour -> console mech name also dull grey (${r1 && r1.fCol})`);
  for (const label of ['Open', 'CLOSED', 'Unknown', 'LOCAL']) {
    await s.evaluate(label => { S.own = label; R(); }, label); const r = await soloRoll();
    ok(r && r.u === label && r.uCol === muted, `solo: reserved owner "${label}" stays muted grey (${r && r.uCol})`);
  }
  await s.evaluate(() => { S.own = 'ACE <b>'; R(); });
  await s.evaluate(() => { shClick(S.cur); shClick(S.cur); shClick(S.cur); }); await wait(300); // col 3 = #ff5a5a
  let r2 = await soloRoll(), t2 = await tabInfo(s, '.stab.on');
  ok(t2.border === rgb('#ff5a5a') && r2.uCol === rgb('#ff5a5a'), `solo: custom owner roll author = tab colour (${r2.uCol}; outline ${t2.border})`);
  ok(r2.fCol === rgb('#ff5a5a'), `solo: console mech name = tab colour (${r2.fCol})`);
  ok(t2.name === (await readout(s)).col, 'solo: with a custom tab colour the tab label still shows the status colour');
  await s.screenshot({ path: `${out}/solo-tab-custom-owner-console.png`, clip: { x: 0, y: 0, width: 1600, height: 1000 } });
  await s.context().close();
  // ---------- MP ----------
  const seat = async (name) => { const p = await page(name); await p.evaluate(() => login(6)); await wait(300); await p.fill('#mpname', name); await p.evaluate(() => mpAuth()); await p.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 }); return p; };
  const H = await seat('HOSTA');
  await H.evaluate(async (fx) => { await loadManifestFile(new File([fx], 'h.txt')); }, fx); await wait(1500);
  const P = await seat('PILOTB');
  await P.evaluate(async (fx) => { await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'PB-7 / KAGE')], 'p.txt')); }, fx); await wait(3000);
  for (const X of [H, P]) await X.evaluate(() => { const S = Forge.state(); S.view = 'sortie'; Forge.render(); const cb = document.getElementById('cb'); if (cb.classList.contains('cs0')) cb.click(); });
  const tabBy = (p, re) => p.evaluate(re => { const t = [...document.querySelectorAll('.stab')].find(x => new RegExp(re).test((x.querySelector('.stn') || {}).textContent || '')); if (!t) return null; t.setAttribute('data-probe', re); return true; }, re);
  const info = async (p, re) => { await tabBy(p, re); return tabInfo(p, `.stab[data-probe="${re}"]`); };
  const until = async (fn, ms = 12000) => { const t0 = Date.now(); let v; while (Date.now() - t0 < ms) { v = await fn(); if (v) return v; await wait(400); } return v; };
  let hk = await until(async () => { const v = await info(H, 'KAGE'); return v && /PILOTB/.test(v.own || '') ? v : null; });
  let pk0 = await info(P, 'KAGE');
  const pMem = pk0 && pk0.ownCol, hMem = hk && hk.ownCol;
  const muted0 = await resolve(P, 'var(--muted)');
  const cyan0 = await resolve(P, 'var(--cyan)');
  ok(!!pMem && pMem === hMem && pMem !== muted0 && pMem !== GREY && pMem !== cyan0, `MP: PILOTB member colour agrees on both seats and is not grey or the theme accent (${pMem})`);
  ok(hk && hk.border === GREY && hk.ownCol === pMem, `MP host view: real owner PILOTB is in their member colour, grey outline (${hk && hk.own} ${hk && hk.ownCol})`);
  ok(pk0 && pk0.ownCol === pMem, `MP pilot view: own name on the tab is member colour (${pk0 && pk0.ownCol})`);
  let hm = await info(H, 'MUSHA');
  ok(hm && /Closed/.test(hm.own || '') && hm.ownCol === await resolve(H, 'var(--muted)'), `MP host view: Closed owner stays grey (${hm && hm.own} ${hm && hm.ownCol})`);
  const plus = await H.evaluate(() => { const t = [...document.querySelectorAll('.stab')].find(x => /MUSHA/.test((x.querySelector('.stn') || {}).textContent || '')); const a = t && t.querySelector('.asg'); return a ? { txt: a.textContent.trim(), col: getComputedStyle(a).color } : null; });
  // Closed shows [Closed], not [+]; unassigned Open is tested after we clear Closed below if needed.
  // Paint the pilot unit and confirm the real user's name does NOT follow the tab colour.
  await P.evaluate(() => { const t = document.querySelector('.stab.on'); t.click(); }); await wait(400); await P.evaluate(() => { document.querySelector('.stab.on').click(); }); await wait(600);
  const pk = await info(P, 'KAGE'); const want = pk.border;
  ok(want !== GREY && want !== GREY_ON && pk.ownCol === pMem && pk.ownCol !== want, `MP pilot view: after painting the tab, owner stays member colour (not tab colour ${want}; got ${pk.ownCol})`);
  hk = await until(async () => { const v = await info(H, 'KAGE'); return v && v.border === want && v.ownCol === pMem ? v : null; });
  ok(!!hk, `MP sync: host sees the pilot's tab colour and the real owner still in member colour (${hk && hk.border} / ${hk && hk.ownCol})`);
  // status sync: pilot damages its unit; both views' tab name follows the status readout colour
  for (const [k, f] of [['light', .5], ['all', .75], ['severe', 0], ['core', .6], ['core', 0], ['all', 1]]) {
    await setState(P, k, f); const r = await readout(P);
    const pv = await info(P, 'KAGE'); ok(pv.name === r.col, `MP pilot view ${r.txt}: tab name colour = readout`);
    const hv = await until(async () => { const v = await info(H, 'KAGE'); return v && v.cls.includes(r.cls) && v.name === r.col ? v : null; });
    ok(!!hv, `MP sync ${r.txt}: host's tab name for the pilot unit turns ${r.col}`);
    if (r.txt !== 'NOMINAL') { await H.screenshot({ path: `${out}/mp-host-tabs-${r.txt.toLowerCase()}.png`, clip: { x: 0, y: 0, width: 1600, height: 210 } }); await P.screenshot({ path: `${out}/mp-pilot-tabs-${r.txt.toLowerCase()}.png`, clip: { x: 0, y: 0, width: 1600, height: 210 } }); }
  }
  // console: pilot chat + roll -> author in member colour; mech name in the tab colour
  await P.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '12' }); pilRoll(); }); await wait(300);
  await P.evaluate(() => { const ci = document.getElementById('CI'); ci.value = 'hello <i>x</i>'; ci.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }); await wait(300);
  const pc = await logCol(P, 'chat'), pr = await logCol(P, 'roll');
  ok(pc && pc.col === pMem && /hello <i>x<\/i>/.test(pc.txt), `MP pilot view: own chat author in member colour, text escaped (${pc && pc.u} ${pc && pc.col})`);
  ok(pr && pr.col === pMem && /PILOTB/.test(pr.u), `MP pilot view: own roll author in member colour (${pr && pr.u} ${pr && pr.col})`);
  ok(pr && pr.fCol === want, `MP pilot view: console mech name in tab colour (${pr && pr.f} ${pr && pr.fCol})`);
  const hc = await until(async () => { const v = await logCol(H, 'chat'); return v && /PILOTB/.test(v.u) ? v : null; });
  ok(hc && hc.col === pMem, `MP sync: host console chat author PILOTB in member colour (${hc && hc.col})`);
  const hr = await until(async () => { const v = await logCol(H, 'roll'); return v && /PILOTB/.test(v.u) ? v : null; });
  ok(hr && hr.col === pMem, `MP sync: host console roll author PILOTB in member colour (${hr && hr.col})`);
  ok(hr && hr.fCol === want, `MP sync: host console mech name for the pilot unit in tab colour (${hr && hr.fCol})`);
  // host rolls on the Closed unit -> Unknown grey; mech name dull grey (no tab colour yet)
  await H.evaluate(() => { const S = Forge.state(); const i = S.sheets.findIndex(s => /MUSHA/.test(s.name || (s.d && s.d.id) || '')); if (i >= 0 && i !== S.cur) mpGo(S.sheets[i].uid); }); await wait(500);
  await H.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '12' }); pilRoll(); }); await wait(300);
  const hu = await logCol(H, 'roll');
  ok(hu && /Unknown/.test(hu.u) && hu.col === await resolve(H, 'var(--muted)'), `MP host view: roll on the Closed unit reads ${hu && hu.u} in muted grey`);
  const pu = await until(async () => { const v = await logCol(P, 'roll'); return v && /Unknown/.test(v.u) ? v : null; });
  ok(pu && pu.col === await resolve(P, 'var(--muted)'), `MP sync: pilot sees the Closed unit's roll as Unknown in grey`);
  ok(hu && hu.fCol === GREY, `MP host view: Closed unit with no tab colour -> console mech name dull grey (${hu && hu.fCol})`);
  // host-created custom NPC owner, no tab colour -> dull grey on tab and in console (both seats)
  const mushaUid = await H.evaluate(() => { const S = Forge.state(); const sh = S.sheets.find(s => /MUSHA/.test(s.name || (s.d && s.d.id) || '')); return sh && sh.uid; });
  await H.evaluate(uid => { const el = document.querySelector(`.stab[data-uid="${uid}"] .asg`); if (el) el.click(); }, mushaUid); await wait(400);
  await H.keyboard.press('Control+A'); await H.keyboard.type('ACE'); await H.keyboard.press('Enter'); await wait(1500);
  const npcH = await until(async () => { const v = await info(H, 'MUSHA'); return v && /ACE/.test(v.own || '') ? v : null; });
  ok(npcH && npcH.ownCol === GREY, `MP host view: custom NPC owner, no tab colour -> dull grey (${npcH && npcH.own} ${npcH && npcH.ownCol})`);
  const npcP = await until(async () => { const v = await info(P, 'MUSHA'); return v && /ACE/.test(v.own || '') ? v : null; });
  ok(npcP && npcP.ownCol === GREY, `MP sync: pilot sees custom NPC owner ACE in dull grey (${npcP && npcP.ownCol})`);
  await H.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '12' }); pilRoll(); }); await wait(400);
  const npcRollH = await logCol(H, 'roll');
  ok(npcRollH && /ACE/.test(npcRollH.u) && npcRollH.col === GREY, `MP host view: custom NPC roll author dull grey (${npcRollH && npcRollH.u} ${npcRollH && npcRollH.col})`);
  ok(npcRollH && npcRollH.fCol === GREY, `MP host view: custom NPC console mech name dull grey (${npcRollH && npcRollH.fCol})`);
  const npcRollP = await until(async () => { const v = await logCol(P, 'roll'); return v && /ACE/.test(v.u) ? v : null; });
  ok(npcRollP && npcRollP.col === GREY && npcRollP.fCol === GREY, `MP sync: pilot sees custom NPC roll author and mech name in dull grey`);
  // paint the host NPC tab and confirm custom owner + console mech name follow the tab colour
  await H.evaluate(() => { document.querySelector('.stab.on').click(); }); await wait(400);
  await H.evaluate(() => { document.querySelector('.stab.on').click(); }); await wait(800);
  const npcPainted = await info(H, 'MUSHA'); const npcTab = npcPainted.border;
  ok(npcTab !== GREY && npcTab !== GREY_ON && npcPainted.ownCol === npcTab, `MP host view: custom NPC owner follows tab colour (${npcPainted.ownCol} / ${npcTab})`);
  ok(npcPainted.name === (await readout(H)).col, 'MP host view: NPC tab label still follows STATUS colour after a tab colour is set');
  const npcP2 = await until(async () => { const v = await info(P, 'MUSHA'); return v && v.border === npcTab && v.ownCol === npcTab ? v : null; });
  ok(!!npcP2, `MP sync: pilot sees custom NPC owner in the new tab colour (${npcP2 && npcP2.ownCol})`);
  await H.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '12' }); pilRoll(); }); await wait(400);
  const npcRollH2 = await logCol(H, 'roll');
  ok(npcRollH2 && /ACE/.test(npcRollH2.u) && npcRollH2.col === npcTab && npcRollH2.fCol === npcTab, `MP host view: custom NPC roll author and mech name in tab colour (${npcRollH2 && npcRollH2.col})`);
  const npcRollP2 = await until(async () => { const v = await logCol(P, 'roll'); return v && /ACE/.test(v.u) && v.col === npcTab ? v : null; });
  ok(npcRollP2 && npcRollP2.fCol === npcTab, `MP sync: pilot sees custom NPC roll author and mech name in tab colour`);
  // reserved "Open" owner stays muted grey even with a tab colour set
  await H.evaluate(uid => { const el = document.querySelector(`.stab[data-uid="${uid}"] .asg`); if (el) el.click(); }, mushaUid); await wait(400);
  await H.keyboard.press('Control+A'); await H.keyboard.type('Open'); await H.keyboard.press('Enter'); await wait(1500);
  const openH = await until(async () => { const v = await info(H, 'MUSHA'); return v && /Open/.test(v.own || '') ? v : null; });
  const mutedH = await resolve(H, 'var(--muted)');
  ok(openH && openH.ownCol === mutedH, `MP host view: reserved owner Open stays muted grey (not tab colour ${npcTab}; got ${openH && openH.ownCol})`);
  const openP = await until(async () => { const v = await info(P, 'MUSHA'); return v && /Open/.test(v.own || '') ? v : null; });
  ok(openP && openP.ownCol === await resolve(P, 'var(--muted)'), `MP sync: pilot sees Open in muted grey`);
  await H.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '12' }); pilRoll(); }); await wait(400);
  const openRoll = await logCol(H, 'roll');
  ok(openRoll && /Open/.test(openRoll.u) && openRoll.col === mutedH, `MP host view: Open roll author muted grey (${openRoll && openRoll.col})`);
  ok(openRoll && openRoll.fCol === npcTab, `MP host view: Open unit's console mech name still uses the tab colour (${openRoll && openRoll.fCol})`);
  // restore a named NPC owner for the console screenshot
  await H.evaluate(uid => { const el = document.querySelector(`.stab[data-uid="${uid}"] .asg`); if (el) el.click(); }, mushaUid); await wait(400);
  await H.keyboard.press('Control+A'); await H.keyboard.type('ACE'); await H.keyboard.press('Enter'); await wait(1000);
  await H.screenshot({ path: `${out}/mp-host-console.png` }); await P.screenshot({ path: `${out}/mp-pilot-console.png` });
  const cbH = await (await H.$('#cb')).boundingBox(); if (cbH) await H.screenshot({ path: `${out}/mp-host-console-closeup.png`, clip: cbH });
  const cbP = await (await P.$('#cb')).boundingBox(); if (cbP) await P.screenshot({ path: `${out}/mp-pilot-console-closeup.png`, clip: cbP });
  ok(errs.length === 0, 'no page errors ' + errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? `FAILED ${fails}` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
