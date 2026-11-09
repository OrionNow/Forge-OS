// FORGE-OS 5.5.3 two-seat browser check (fresh dev server): roll-line spoofing refused, "(via SEAT)" label, solo LOCAL fallback.
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8080';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  const page = async (name) => { const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message)); await p.goto(base + '/terminal.html'); await p.waitForTimeout(1500); return p; };
  const seat = async (name) => { const p = await page(name); await p.evaluate(() => login(6)); await p.waitForTimeout(300);
    await p.fill('#mpname', name); await p.evaluate(() => mpAuth()); await p.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 }); return p; };
  const logTxt = (p) => p.evaluate(() => document.getElementById('log').textContent);
  const logHas = async (p, re, ms = 9000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (re.test(await logTxt(p))) return true; await wait(300); } return false; };
  // solo: no owner name -> LOCAL, not Unknown
  const S = await page('SOLO');
  const solo = await S.evaluate(async (fx) => { login(4); await loadManifestFile(new File([fx], 's.txt')); const st = Forge.state(); st.own = ''; const sh = st.sheets && st.sheets[st.cur]; if (sh && sh.d) sh.d.own = ''; return rcWho().u; }, fx);
  ok(solo === 'LOCAL', 'solo roll author with no owner name reads LOCAL: ' + solo);
  const H = await seat('HOSTA');
  await H.evaluate(async (fx) => { await loadManifestFile(new File([fx], 'h.txt')); }, fx); await wait(1500);
  const P = await seat('PILOTB');
  await P.evaluate(async (fx) => { await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'PB-7 / KAGE')], 'p.txt')); }, fx); await wait(3500);
  const tokOf = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('forge_mp_token_TABLE')));
  const ht = await tokOf(H), pt = await tokOf(P);
  const api = (b) => fetch(base + '/api/forge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
  const snap = await api({ op: 'poll', code: 'TABLE', token: ht.token, since: -1 });
  const kage = snap.snapshot.sheets.find(s => s.ownerId === pt.id), hunit = snap.snapshot.sheets.find(s => s.ownerId !== pt.id);
  ok(kage && hunit, 'both units on the table');
  const pushLog = async (t, line) => { const v = await api({ op: 'poll', code: 'TABLE', token: t, since: -1 }); return api({ op: 'push', code: 'TABLE', token: t, baseRevision: v.revision, logs: [line] }); };
  // spoof repro: PILOTB pushes a roll card on the HOST's unit -> refused, host never sees it
  await pushLog(pt.token, { nonce: 'nspoof553', uid: hunit.uid, tone: 'bad', html: '', rc: { k: 'roll', id: 'rcevilspoof1', a: '30mm AUTOCANNON', r: 'CRIT FAIL · MISS' } });
  ok(!(await logHas(H, /CRIT FAIL · MISS/, 5000)) && !(await logHas(P, /CRIT FAIL · MISS/, 500)), 'spoofed roll card on another seat\'s unit is refused (neither seat sees it)');
  // host posts a card on PILOTB's unit -> allowed, labelled "(via HOSTA)"
  await pushLog(ht.token, { nonce: 'nvia553', uid: kage.uid, tone: 'ok', html: '', rc: { k: 'roll', id: 'rchostvia01', a: 'VIA TEST', r: 'HIT' } });
  ok(await logHas(P, /\(via HOSTA\)[^]*VIA TEST/), 'pilot sees host-sent roll on KAGE as "(via HOSTA)"');
  ok(await logHas(H, /\(via HOSTA\)[^]*VIA TEST/), 'host sees the same "(via HOSTA)" label');
  // owner's own card: no via
  await pushLog(pt.token, { nonce: 'nown553', uid: kage.uid, tone: 'ok', html: '', rc: { k: 'roll', id: 'rcownroll02', a: 'OWN TEST', r: 'HIT' } });
  ok(await logHas(H, /OWN TEST/), 'owner roll arrives at host');
  const ownLine = await H.evaluate(() => [...document.querySelectorAll('#log .rc')].map(e => e.textContent).find(t => /OWN TEST/.test(t)) || '');
  ok(/PILOTB/.test(ownLine) && !/via/.test(ownLine), 'owner roll names PILOTB with no via: ' + ownLine.slice(0, 80));
  ok(errs.length === 0, 'no page errors ' + errs.join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
