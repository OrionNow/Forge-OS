// v5.5.5 close-ups: ISB LINK on line 1 of the telemetry header (all states, long names) and SKILL INPUTS as 2 rows of 6.
// Usage: node check-v555-closeup.js [base] [outdir]   (fresh dev server)
const { chromium } = require('/workspace/pw/node_modules/playwright-core'); const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8080', out = process.argv[3] || '/workspace/forge-os/feedback/v555b-shots';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const head = (p) => p.evaluate(() => { const r = e => e.getBoundingClientRect(); const h = document.querySelector('#con .sorhead'), nm = h.querySelector('.nm'), isb = h.querySelector('.isb'), rest = [...h.children].filter(e => e !== nm && e !== isb);
  return { h: r(h), nm: r(nm), isb: r(isb), restTop: Math.min(...rest.map(e => r(e).top)), ell: nm.scrollWidth > nm.clientWidth, txt: isb.textContent }; });
async function checkHead(p, tag) {
  const g = await head(p);
  ok(Math.abs(g.isb.top - g.nm.top) < 3 && g.isb.right <= g.h.right + 1 && g.nm.right <= g.isb.left + 1 && g.restTop >= g.nm.bottom - 1,
    `${tag}: "${g.txt}" right-aligned on line 1 with the title, no overlap, other items below (${[g.nm.right, g.isb.left, g.isb.right, g.h.right].map(Math.round)})`);
  return g;
}
async function checkSkills(p, tag) {
  const s = await p.evaluate(() => { const pg = document.querySelector('.pilot .pg'); if (!pg) return null; const R = pg.getBoundingClientRect(); const ins = [...pg.querySelectorAll('input')].map(i => i.getBoundingClientRect());
    const rows = {}; ins.forEach(q => { const k = Math.round(q.top); rows[k] = (rows[k] || 0) + 1; }); return { n: ins.length, rows: Object.values(rows), inside: ins.every(q => q.left >= R.left - 1 && q.right <= R.right + 1 && q.width >= 30), lab: [...pg.querySelectorAll('label')].every(l => l.scrollWidth <= l.clientWidth + 1) }; });
  ok(s && s.rows.length === 2 && s.rows.every(n => n <= 6) && s.rows[0] === 6, `${tag}: SKILL INPUTS ${s && s.n} fields in 2 rows of up to 6 (${s && s.rows})`);
  ok(s && s.inside && s.lab, `${tag}: skill fields and labels fit their cells`);
}
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); const errs = [];
  for (const [tag, w, h] of [['floor', 963, 904], ['3col', 1920, 1080]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(base + '/terminal.html'); await p.waitForTimeout(1200);
    await p.evaluate(async (fx) => { login(4); await loadManifestFile(new File([fx], 'a.txt')); S.view = 'sortie'; R(); }, fx); await p.waitForTimeout(1200);
    await p.evaluate(() => { if (!document.querySelector('.pilot .pg')) { const t = [...document.querySelectorAll('.pilot *')].find(e => /SKILL INPUTS/.test(e.textContent) && e.children.length < 6 && e.onclick); if (t) t.click(); } }); await p.waitForTimeout(400);
    if (!(await p.$('.pilot .pg'))) await p.evaluate(() => { const t = [...document.querySelectorAll('[onclick]')].find(e => /SKILL INPUTS/.test(e.textContent)); if (t) t.click(); }); await p.waitForTimeout(400);
    await checkHead(p, `solo-${tag}`); await checkSkills(p, `solo-${tag}`);
    const con = await p.$('#con'); const cb = await con.boundingBox();
    const hd = await (await p.$('#con .sorhead')).boundingBox();
    await p.screenshot({ path: `${out}/closeup-isb-solo-${tag}-${w}x${h}.png`, clip: { x: cb.x, y: hd.y - 6, width: cb.width, height: hd.height + 70 } });
    const pl = await (await p.$('.pilot')).boundingBox();
    await p.screenshot({ path: `${out}/closeup-skills-${tag}-${w}x${h}.png`, clip: { x: pl.x - 4, y: pl.y - 4, width: pl.width + 8, height: Math.min(pl.height + 8, h - pl.y + 4) } });
    for (const [st, txt] of [['ok', '[LINK OK]'], ['off', '[OFFLINE \u00b7 1 QUEUED]'], ['off', '[OFFLINE \u00b7 12 QUEUED]'], ['sync', '[SYNCING]']]) {
      await p.evaluate(([st, txt]) => { const s = document.getElementById('sync'); s.dataset.s = st; s.textContent = txt; }, [st, txt]);
      await checkHead(p, `solo-${tag} state ${st}`);
    }
    await p.evaluate(() => { const s = document.getElementById('sync'); s.textContent = '[OFFLINE \u00b7 1 QUEUED]'; const nm = document.querySelector('#con .sorhead .nm'); nm.textContent = 'LIVE SORTIE TELEMETRY // ' + 'MSH-01 MUSHA TEST WITH AN EXTREMELY LONG CALLSIGN THAT KEEPS GOING AND GOING'; });
    const g = await checkHead(p, `solo-${tag} long name`); ok(g.ell, `solo-${tag}: long name is cut with an ellipsis`);
    await p.screenshot({ path: `${out}/closeup-isb-longname-offline-${tag}-${w}x${h}.png`, clip: { x: cb.x, y: hd.y - 6, width: cb.width, height: hd.height + 70 } });
    await ctx.close();
    // MP: real LINK OK state from the bridge
    const c2 = await b.newContext({ viewport: { width: w, height: h } }); const q = await c2.newPage(); q.on('pageerror', e => errs.push(e.message));
    await q.goto(base + '/terminal.html'); await q.waitForTimeout(1200); await q.evaluate(() => login(6)); await q.waitForTimeout(300); await q.fill('#mpname', 'CLOSE' + w); await q.evaluate(() => mpAuth());
    await q.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 });
    await q.evaluate(async (fx) => { await loadManifestFile(new File([fx], 'h.txt')); }, fx); await q.waitForTimeout(2500);
    await q.evaluate(() => { const S = Forge.state(); if (S.view !== 'sortie') { S.view = 'sortie'; Forge.render(); } }); await q.waitForTimeout(1500);
    const g2 = await checkHead(q, `mp-${tag}`); ok(/LINK OK/.test(g2.txt), `mp-${tag}: bridge shows ${g2.txt}`);
    const c3 = await (await q.$('#con')).boundingBox(); const h3 = await (await q.$('#con .sorhead')).boundingBox();
    await q.screenshot({ path: `${out}/closeup-isb-mp-${tag}-${w}x${h}.png`, clip: { x: c3.x, y: h3.y - 6, width: c3.width, height: h3.height + 70 } });
    await c2.close();
  }
  ok(errs.length === 0, 'no page errors ' + errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? `FAILED ${fails}` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
