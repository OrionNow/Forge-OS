const { chromium } = require('/workspace/pw/node_modules/playwright-core');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [], nets = []; let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  for (const [w, h, path] of [[1600, 1000, '/terminal.html'], [390, 844, '/terminal.html'], [1600, 1000, '/']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(w + path + ' pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(w + path + ' console: ' + m.text()); });
    p.on('response', r => { if (r.status() >= 400) nets.push(w + path + ' ' + r.status() + ' ' + r.url()); });
    await p.goto('http://localhost:8080' + path); await p.waitForTimeout(3000);
    if (path === '/terminal.html') { const v = await p.evaluate(() => typeof APP_VERSION !== 'undefined' && APP_VERSION); ok(v === '5.5.4', w + ' APP_VERSION ' + v);
      for (const n of [1, 4]) { await p.evaluate((n) => { try { login(n) } catch (e) { console.error('login ' + n + ' ' + e.message) } }, n); await p.waitForTimeout(1200); await p.evaluate(() => { try { S.view = 'login'; R() } catch (e) {} }); } }
    await ctx.close(); }
  ok(errs.length === 0, 'no console/page errors ' + JSON.stringify(errs).slice(0, 1500));
  ok(nets.length === 0, 'no failed requests ' + JSON.stringify(nets).slice(0, 800));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
