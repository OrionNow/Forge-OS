// User-facing builder/export, encounter filtering and small-screen workflows.
// Requires playwright and Chromium. Run against npm run dev on port 8080.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const base = (process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
let checks = 0;
function check(ok, label) {
  if (!ok) throw new Error(label);
  checks++; console.log('PASS ' + label);
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/terminal.html');
    await page.locator('[data-ux-row]').first().focus(); await page.keyboard.press('Enter');
    await page.locator('button[onclick="chassisTab(\'Mech\')"]').click();
    await page.locator('.row[onclick^="cfgCh"]').first().focus(); await page.keyboard.press('Space');
    const frameFocus = await page.evaluate(() => document.activeElement.getAttribute('onclick')?.startsWith('cfgCh('));
    for (const kind of ['R', 'T', 'G']) {
      const row = page.locator('.row[onclick]').filter({ has: page.locator('.nm') });
      const action = await row.evaluateAll((els, kind) => els.find(el => el.getAttribute('onclick').startsWith("cfgAdd('" + kind + "'"))?.getAttribute('onclick'), kind);
      await page.locator('.row').filter({ has: page.locator('.nm') }).evaluateAll((els, action) => els.find(el => el.getAttribute('onclick') === action).focus(), action);
      await page.keyboard.press('Enter');
    }
    await page.getByRole('button', { name: '[CONFIRM FRAME CONFIGURATION]', exact: true }).click();
    check(frameFocus && await page.evaluate(() => S.view === 'main' && !!S.ch && !!S.core.R && !!S.core.T && !!S.core.G), 'keyboard builder retains selection focus and confirms a complete frame');
    await page.locator('#catq').fill('VIBROBLADE');
    const visible = page.locator('.row[onclick^="addMech"]:visible');
    await visible.first().focus(); await page.keyboard.press('Enter');
    check(await page.evaluate(() => S.items.length === 1), 'catalogue search and keyboard selection install equipment');
    await page.locator('button[onclick="tab(\'ID\')"]').click();
    await page.locator('#fid').fill('UX-553 RAPTOR');
    await page.getByRole('button', { name: 'COMMIT DESIGNATION', exact: true }).click();
    const downloadEvent = page.waitForEvent('download');
    await page.locator('button[onclick="compile()"]:visible').first().click();
    const download = await downloadEvent;
    const manifest = fs.readFileSync(await download.path(), 'utf8');
    check(/SHEET EXPORT VERSION: 5\.5\.3/.test(manifest) && /UX-553 RAPTOR/.test(manifest) && /VIBROBLADE/.test(manifest), 'saved manifest preserves designation, equipment and 5.5.3 version');

    const exported = await page.evaluate(() => buildCatalogHTML('5.5.3'));
    check(!/id="uxbar"|id="uxhelp"/.test(exported) && !/src="terminal-ui\.js|href="terminal-ui\.css/.test(exported), 'catalogue HTML export embeds the UI and clears live toolbar state');
    await page.route('**/exported-553.html', route => route.fulfill({ contentType: 'text/html', body: exported }));
    await page.goto(base + '/exported-553.html');
    await page.waitForSelector('#uxbar');
    check(await page.locator('#uxbar').count() === 1 && await page.locator('[data-ux-row]').count() === 6, 'exported HTML reopens with one usable clearance screen');

    const fixture = fs.readFileSync(path.join(__dirname, 'tests/musha-brittle.manifest.txt'), 'utf8');
    await page.evaluate(async fixture => {
      login(4);
      for (let i = 1; i <= 5; i++) await loadManifestFile(new File([fixture.replace('MSH-01 / MUSHA TEST', 'UNIT-0' + i + ' / ENCOUNTER')], 'unit-' + i + '.txt'));
    }, fixture);
    await page.locator('#sheetQuery').fill('UNIT-03');
    check(await page.locator('#bar .stab:visible').count() === 1 && await page.evaluate(() => S.sheets.length) === 5, 'encounter search finds a sheet without changing the encounter');
    await page.locator('#sheetQuery').fill('x');
    check(await page.locator('#sheetEmpty').isVisible() && await page.locator('#bar .stab:visible').count() === 0, 'sheet search ignores hidden action labels and explains an empty result');
    await page.locator('#sheetQuery').press('Escape');
    check(await page.locator('#bar .stab:visible').count() === 5, 'Escape clears sheet search and restores all units');

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator('.ux-panes button[data-pane=workspace]').click();
      check(await page.locator('#con').isVisible() && !await page.locator('#sh').isVisible(), width + 'px workspace shows damage controls without the hidden loadout taking space');
      await page.locator('#uxDamageTarget').selectOption('1');
      check(await page.evaluate(() => S.dmg.loc === 1), width + 'px component selector changes the incoming target');
      await page.locator('.ux-panes button[data-pane=sheet]').click();
      check(await page.locator('#sh').isVisible() && !await page.locator('#con').isVisible(), width + 'px loadout is reachable in one action');
      await page.locator('.ux-panes button[data-pane=console]').click();
      check(await page.locator('#cb').isVisible() && await page.evaluate(() => document.activeElement.id === 'CI'), width + 'px console opens with command focus');
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), width + 'px encounter fits the viewport');
    }
    check(errors.length === 0, 'builder, export and encounter flows have no page errors');
    console.log('ALL ' + checks + ' CHECKS PASSED');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
