// v5.5.5 responsive screenshots + layout checks (solo and MP, console visible). Usage: node check-v555-layout.js [base] [outdir]
const { chromium } = require('/workspace/pw/node_modules/playwright-core'); const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8080', out = process.argv[3] || '/workspace/forge-os/feedback/v555-shots';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sizes = [['below-min', 900, 700], ['below-min-small', 640, 560], ['between', 1200, 896], ['wide', 1700, 950], ['wide-xl', 2200, 1100]];
const geo = (p) => p.evaluate(() => { const r = s => { const e = document.querySelector(s); if (!e || !e.offsetParent && getComputedStyle(e).display === 'none') return null; const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom, w: q.width, h: q.height }; };
  return { vw: innerWidth, vh: innerHeight, cw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, header: r('header'), con: r('#con'), shp: r('#sh'), cb: r('#cb'), fr: r('#mpfriends'), scaled: document.documentElement.classList.contains('ux-scaled') }; });
async function check(p, tag, w, mp) {
  const g = await geo(p);
  ok(g.sw <= g.cw + 1, `${tag}: no horizontal overflow (scrollWidth ${g.sw} <= ${g.cw})`);
  ok(g.sh <= g.vh + 1, `${tag}: no vertical page overflow (scrollHeight ${g.sh} <= ${g.vh})`);
  for (const k of ['header', 'con', 'shp', 'cb']) ok(g[k] && g[k].l >= 0 && g[k].r <= g.cw + 1 && g[k].b <= g.vh + 1 && g[k].w > 100, `${tag}: ${k} inside the window ${g[k] && [g[k].l, g[k].t, g[k].r, g[k].b].map(Math.round)}`);
  ok(g.scaled === (w < 1103), `${tag}: scaled=${g.scaled}`);
  if (w >= 1299) {
    ok(g.cb.l > g.shp.r && g.shp.l > g.con.r, `${tag}: three columns (sheet | loadout | console)`);
    ok(Math.abs(g.con.h - g.cb.h) < 2 && Math.abs(g.shp.h - g.con.h) < 2 && Math.abs(g.con.t - g.cb.t) < 2, `${tag}: sheet, loadout and console all full height`);
    ok(g.con.w <= 627 && g.shp.w <= 627, `${tag}: sheet/loadout columns capped at 626px (${Math.round(g.con.w)}/${Math.round(g.shp.w)})`);
  } else ok(Math.abs(g.cb.l - g.shp.l) < 2 && g.cb.t > g.shp.b, `${tag}: two columns, console under the loadout`);
  if (mp) ok(g.fr && g.fr.r <= g.cb.r + 1 && g.fr.l >= g.cb.l - 1, `${tag}: user list visible inside the console`);
  // clicks land on the right element (true coordinates under zoom)
  const hit = await p.evaluate(() => { const bs = [...document.querySelectorAll('#wrap button')].filter(b => b.offsetParent); let good = 0, n = 0; for (const b of bs.slice(0, 40)) { const q = b.getBoundingClientRect(); if (q.width < 2 || q.bottom > innerHeight || q.top < 0) continue; n++; const e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); if (e && (e === b || b.contains(e))) good++; } return [good, n]; });
  ok(hit[1] > 5 && hit[0] === hit[1], `${tag}: hit-testing matches button centres (${hit[0]}/${hit[1]})`);
  await p.screenshot({ path: `${out}/${tag}.png` });
}
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); const errs = [];
  const page = async (w, h, name) => { const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/status of (409|413)|net::/.test(m.text())) errs.push(name + ': ' + m.text()); }); await p.goto(base + '/terminal.html'); await p.waitForTimeout(1200); return p; };
  for (const [tag, w, h] of sizes.filter(s => !process.env.ONLY || process.env.ONLY.split(',').includes(s[0]))) {
    const p = await page(w, h, 'solo-' + tag);
    await p.evaluate(async (fx) => { login(4); await loadManifestFile(new File([fx], 'a.txt')); S.view = 'sortie'; R(); }, fx); await p.waitForTimeout(1200);
    await check(p, `solo-${tag}-${w}x${h}`, w, false);
    if (w < 1103) { // right-click menu opens at the pointer; a real click through the zoom works
      const btn = await p.$('#wrap [data-menu]'); if (btn) { const q = await btn.boundingBox(); await p.mouse.click(q.x + q.width / 2, q.y + q.height / 2, { button: 'right' }); await p.waitForTimeout(300);
        const m = await p.evaluate(() => { const e = document.getElementById('tabmenu'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
        ok(m && Math.abs(m[0] - Math.min(q.x + q.width / 2, w - (m[2] - m[0]) - 8)) < 12 && m[2] <= w, `solo-${tag}: right-click menu opens at the pointer ${m && m.map(Math.round)} vs ${Math.round(q.x + q.width / 2)},${Math.round(q.y + q.height / 2)}`);
        await p.screenshot({ path: `${out}/solo-${tag}-menu.png` }); await p.keyboard.press('Escape'); }
      const sc = await p.evaluate(() => { const c = document.getElementById('con'); c.scrollTop = 0; return c.scrollHeight > c.clientHeight; });
      if (sc) { const q = await (await p.$('#con')).boundingBox(); await p.mouse.move(q.x + q.width / 2, q.y + q.height / 2); await p.mouse.wheel(0, 300); await p.waitForTimeout(300); ok(await p.evaluate(() => document.getElementById('con').scrollTop > 0), `solo-${tag}: wheel scrolls the sheet column`); }
    }
    await p.context().close();
    // MP: host + pilot, console expanded with the user list
    const H = await page(w, h, 'host-' + tag); await H.evaluate(() => login(6)); await H.waitForTimeout(300); await H.fill('#mpname', 'HOSTA' + tag.length + w); await H.evaluate(() => mpAuth()); await H.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 });
    await H.evaluate(async (fx) => { await loadManifestFile(new File([fx], 'h.txt')); }, fx); await H.waitForTimeout(1200);
    const P = await page(w, h, 'pilot-' + tag); await P.evaluate(() => login(6)); await P.waitForTimeout(300); await P.fill('#mpname', 'PILOTB' + tag.length + w); await P.evaluate(() => mpAuth()); await P.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 });
    await P.evaluate(async (fx) => { await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'PB-7 / KAGE')], 'p.txt')); }, fx); await P.waitForTimeout(2500);
    for (const X of [H, P]) { for (let i = 0; i < 20; i++) { const done = await X.evaluate(() => { const S = Forge.state(); if (S.view !== 'sortie') { S.view = 'sortie'; Forge.render(); } const cb = document.getElementById('cb'); if (cb.classList.contains('cs0')) (document.querySelector('#cb .chead,#cb [data-act=cs]') || cb).click(); if (!cb.classList.contains('users')) { const u = [...cb.querySelectorAll('button')].find(b => /USERS/.test(b.textContent)); if (u) u.click(); } const f = document.getElementById('mpfriends'); return !!(f && f.offsetParent && /HOSTA/.test(f.textContent) && /PILOTB/.test(f.textContent)); }); if (done) break; await X.waitForTimeout(500); } }
    await P.keyboard.type(''); await P.evaluate(() => { const t = document.getElementById('typed') || document.querySelector('#pr input'); }); await H.waitForTimeout(2500);
    await check(H, `mp-host-${tag}-${w}x${h}`, w, true); await check(P, `mp-pilot-${tag}-${w}x${h}`, w, true);
    await H.context().close(); await P.context().close();
  }
  ok(errs.length === 0, 'no page/console errors ' + errs.slice(0, 5).join(' | '));
  await b.close(); console.log(fails ? `FAILED ${fails}` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
