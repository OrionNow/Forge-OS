const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs'); const wait = ms => new Promise(r => setTimeout(r, ms));
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await p.goto('' + (process.argv[2] || 'http://localhost:8833/terminal.html') + ''); await wait(1500);
  await p.evaluate(async (fx) => { login(4); await loadManifestFile(new File([fx], 'm.txt'));
    const rng = DB.find(x => x.c == 'A' && hasRng(x) && /ROF:5 /.test(x.s) && !x.th && /AMMO:/.test(x.s));
    S.items.push(Object.assign(structuredClone(rng), { mount: 'RH', am: 15 })); S.pilot = { pil: '14', [wKey(rng)]: '13' }; S.view = 'sortie'; R(); }, fx);
  await wait(1500);
  const i = await p.evaluate(() => S.items.indexOf(weapons()[0]));
  const row = p.locator(`[data-item="${i}"]`);
  await row.click({ position: { x: 30, y: 6 } }); await p.evaluate(() => { S.dmgN = 5; R() }); await wait(1500);
  for (const gap of [150, 400, 800, 1500]) {
    await p.evaluate(() => { window.__R0 = Math.random; Math.random = () => 0.15; });
    await row.locator('button', { hasText: '[ATK]' }).click(); await p.evaluate(() => { Math.random = window.__R0; });
    await wait(gap); await p.evaluate(() => { const w = weapons()[0]; w.am = 15; });
    await row.locator('button', { hasText: '[DMG]' }).click(); await wait(2500);
    const r = await p.evaluate(() => { const c = [...document.querySelectorAll('#log .rc')]; const last = c[c.length - 1]; return { cards: c.slice(-2).map(x => x.innerText), rcR: [...RC.values()].slice(-1)[0].r } });
    console.log('gap', gap, JSON.stringify(r));
  }
  await b.close();
})();
