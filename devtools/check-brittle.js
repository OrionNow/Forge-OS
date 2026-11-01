// Regression check: MUSHA BRITTLE token is never read as SR, survives the catalogue and manifest paths,
// and applies -1 SR only below half Core HP. Usage: node check-brittle.js [url]
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:8822/terminal.html';
const fixture = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await p.waitForTimeout(1500);
  const r = await p.evaluate(async (fx) => {
    const out = {};
    const tok = 'BRITTLE:-1_SR_below_half_HP';
    out.naiveRegexOnToken = /SR[:=]?(-?\d+)/.exec(tok);            // must be null
    const ci = CH.findIndex(x => /MUSHA/.test(x[0]));
    out.chLine = CH[ci] && CH[ci][1];
    const st = { ...S }; 
    out.parse = (() => { const q = parseManifest(fx); return { stat: q.chassis[1], ep: q.chassis[2], type: q.chassis[3], status: q.frameStatus, warnings: q.warnings }; })();
    const colon = fx.replace('ST/HP165 DR650/325 MOVE10L/20S SM+6 HND/SR+2/2', 'ST/HP:165 DR:650/325 MOVE:10L/20S SM:+6 HND:+2 SR:2');
    out.colon = (() => { const q = parseManifest(colon); return { stat: q.chassis[1], status: q.frameStatus }; })();
    login(4);
    await loadManifestFile(new File([fx], 'musha.txt'));
    const sr = () => chStats().sr;
    out.srFull = sr(); out.brittleFull = brittleOn();
    const L = locs(), k = L.indexOf('Core');
    S.tel.hp[k] = Math.floor(maxOf(k) / 2) + 1; R(); out.srJustAbove = sr();
    S.tel.hp[k] = Math.floor((maxOf(k) - 1) / 2); R(); out.srBelow = sr(); out.brittleBelow = brittleOn();
    out.tag = (/\[BRITTLE [^\]]*\]/.exec(sortieView()) || [null])[0];
    S.tel.hp = S.tel.hp.map((v, i) => i === k ? maxOf(i) : 1); R(); out.srOtherLocsLowCoreFull = sr();
    out.allFramesHaveSR = CH.every(x => /HND\/SR[+-]?\d+\/\d+/.test(x[1]));
    return out;
  }, fixture);
  const checks = [
    ['naive /SR[:=]?(-?\\d+)/ does not match the BRITTLE token', r.naiveRegexOnToken === null],
    ['catalogue CH line keeps BRITTLE and SR 2', /HND\/SR\+2\/2 BRITTLE:-1_SR_below_half_HP$/.test(r.chLine || '')],
    ['manifest keeps BRITTLE verbatim', /BRITTLE:-1_SR_below_half_HP/.test(r.parse.stat)],
    ['manifest: EP 6, Mech', r.parse.ep === 6 && r.parse.type === 'Mech'],
    ['manifest frameStatus is match once the MUSHA line is in the catalogue', r.parse.status === 'match'],
    ['colon-form frame line normalised to compact form', /^ST\/HP165 DR650\/325 MOVE10L\/20S SM\+6 HND\/SR\+2\/2/.test(r.colon.stat)],
    ['SR 2 at full HP, brittle off', r.srFull === 2 && r.brittleFull === false],
    ['SR 2 just above half Core HP', r.srJustAbove === 2],
    ['SR 1 below half Core HP, brittle on', r.srBelow === 1 && r.brittleBelow === true],
    ['visible ACTIVE tag below half', /BRITTLE SR-1 ACTIVE/.test(r.tag || '')],
    ['other locations low but Core full: SR 2', r.srOtherLocsLowCoreFull === 2],
    ['every catalogue frame still parses an SR', r.allFramesHaveSR],
    ['no page errors', errs.length === 0],
  ];
  let f = 0; for (const [n, ok] of checks) { console.log((ok ? 'PASS ' : 'FAIL ') + n); if (!ok) f++; }
  console.log('frameStatus:', r.parse.status, '| warnings:', JSON.stringify(r.parse.warnings));
  if (f) console.log(JSON.stringify(r, null, 1), errs);
  console.log(f ? f + ' FAILED' : 'ALL PASS'); await b.close(); process.exit(f ? 1 : 0);
})();
