// FORGE-OS desktop shell milestone 1 checks (1280px). Usage: node check-desktop-m1.js [url] [shotdir]
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:8857/terminal.html';
const shots = process.argv[3] || '/workspace/forge-os/out-desktop-m1/shots';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url); await wait(2500);
  await p.evaluate(async (fx) => { login(4); await loadManifestFile(new File([fx], 'm.txt')); S.view = 'sortie'; R(); }, fx); await wait(3000);
  await p.evaluate(() => { awBind(0, 1); R(); }); await wait(800);
  const o = await p.evaluate(() => { const box = id => { const r = document.getElementById(id).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }; return { desk: document.body.classList.contains('desk'), con: document.getElementById('con').closest('#win-tele') !== null, bar: document.getElementById('bar').closest('#win-tele') !== null, sh: document.getElementById('sh').closest('#win-sheet') !== null, cb: document.getElementById('cb').closest('#win-con') !== null, t: ['tele', 'sheet', 'con'].map(k => document.getElementById('wt-' + k).textContent), bay: [...document.querySelectorAll('#deskbay [id^=bay-]')].map(x => x.textContent), boxes: ['win-tele', 'win-sheet', 'win-con'].map(box), primary: document.getElementById('win-tele').classList.contains('primary'), btns: [...document.querySelectorAll('.win-t button')].every(x => x.title && x.getAttribute('aria-label')), sortie: !!document.querySelector('#con .sorhead'), doc: document.documentElement.scrollWidth <= 1280 }; });
  ok(o.desk && o.con && o.bar && o.sh && o.cb && o.sortie, 'desktop on by default: telemetry (#bar + #con), sheet and console hosted in windows; R() still renders into them ' + JSON.stringify(o));
  ok(/^MSH-01 MUSHA TEST \/\/ SORTIE TELEMETRY$/.test(o.t[0]) && /FRAME SHEET$/.test(o.t[1]) && o.t[2] === 'OPERATOR CONSOLE' && o.primary && o.btns && o.bay.length === 3, 'titles unit-first, telemetry primary, chrome buttons labelled, module bay lists the windows ' + JSON.stringify([o.t, o.bay]));
  ok(o.boxes[0][0] + o.boxes[0][2] <= o.boxes[1][0] && o.boxes[1][1] + o.boxes[1][3] <= o.boxes[2][1] && o.doc, 'default layout: telemetry left, sheet top right, console bottom right, no page overflow at 1280 ' + JSON.stringify(o.boxes));
  await p.screenshot({ path: shots + '/desk-m1-default.png' });
  // drag the sheet window by its title strip
  const t = await p.locator('#win-sheet .win-t .wt').boundingBox();
  await p.mouse.move(t.x + 40, t.y + 10); await p.mouse.down(); await p.mouse.move(t.x - 160, t.y + 90, { steps: 8 }); await p.mouse.up(); await wait(300);
  const d = await p.evaluate(() => { const w = document.getElementById('win-sheet'); return { l: w.offsetLeft, t: w.offsetTop, g: UI.desk.L.solo.sheet, saved: JSON.parse(localStorage.getItem('forge_ui_v1')).desk.L.solo.sheet, focus: w.classList.contains('focus') && w.getAttribute('aria-current') === 'true', z: +w.style.zIndex > +document.getElementById('win-tele').style.zIndex || !document.getElementById('win-tele').style.zIndex }; });
  ok(d.saved && Math.abs(d.saved.x - d.g.x) < 0.002 && d.t >= 80 && d.focus && d.z, 'dragging a title strip moves the window, raises and focuses it, and saves the position in forge_ui_v1 ' + JSON.stringify(d));
  // collapse + minimize + bay restore
  await p.click('#win-con [data-a=col]'); await wait(200);
  const c1 = await p.evaluate(() => ({ h: document.getElementById('win-con').offsetHeight, btn: document.querySelector('#win-con [data-a=col]').textContent, exp: document.querySelector('#win-con [data-a=col]').getAttribute('aria-expanded') }));
  await p.click('#win-sheet [data-a=min]'); await wait(200);
  const m1 = await p.evaluate(() => ({ hid: getComputedStyle(document.getElementById('win-sheet')).display === 'none', bay: document.getElementById('bay-sheet').getAttribute('aria-pressed'), foc: document.activeElement && document.activeElement.id }));
  await p.screenshot({ path: shots + '/desk-m1-moved-collapsed.png' });
  await p.click('#bay-sheet'); await p.click('#bay-con'); await wait(200);
  const m2 = await p.evaluate(() => ({ sh: getComputedStyle(document.getElementById('win-sheet')).display !== 'none', con: document.getElementById('win-con').offsetHeight > 60 }));
  ok(c1.h <= 30 && c1.btn === '[+]' && c1.exp === 'false' && m1.hid && m1.bay === 'false' && m1.foc === 'bay-sheet' && m2.sh && m2.con, 'collapse to the strip, minimize to the module bay, restore from the bay ' + JSON.stringify([c1, m1, m2]));
  await p.click('#win-tele [data-a=max]'); await wait(200);
  const mx = await p.evaluate(() => { const w = document.getElementById('win-tele'), a = document.getElementById('deskarea'); return [w.offsetWidth === a.clientWidth, w.offsetHeight === a.clientHeight]; });
  await p.click('#win-tele [data-a=max]'); await wait(200);
  ok(mx[0] && mx[1], 'maximize fills the desktop area, and restores ' + JSON.stringify(mx));
  // console still works inside its window; Alt+C focuses it
  await p.keyboard.press('Alt+c'); await wait(100);
  const ci = await p.evaluate(() => document.activeElement && document.activeElement.id);
  await p.keyboard.type('desk chat line'); await p.keyboard.press('Enter'); await wait(400);
  ok(ci === 'CI' && await p.evaluate(() => /desk chat line/.test(document.getElementById('log').textContent)), 'Alt+C focuses the console input; console works inside its window ' + ci);
  // persist across reload
  const before = await p.evaluate(() => { const w = document.getElementById('win-sheet'); return [w.offsetLeft, w.offsetTop]; });
  await p.reload(); await wait(3000);
  const after = await p.evaluate(() => { const w = document.getElementById('win-sheet'); return [w.offsetLeft, w.offsetTop, document.body.classList.contains('desk')]; });
  ok(after[2] && Math.abs(after[0] - before[0]) <= 2 && Math.abs(after[1] - before[1]) <= 2, 'window positions persist across reload ' + JSON.stringify([before, after]));
  // classic toggle and back
  await p.click('#deskClassic'); await wait(500);
  const cl = await p.evaluate(() => ({ desk: document.body.classList.contains('desk'), sh: document.getElementById('sh').parentElement.id, con: document.getElementById('con').parentElement.tagName, cb: document.getElementById('cb').parentElement.id, bar: document.getElementById('bar').parentElement.id, btn: document.getElementById('deskBtn').textContent, saved: JSON.parse(localStorage.getItem('forge_ui_v1')).desk.on, root: getComputedStyle(document.getElementById('deskroot')).display }));
  ok(!cl.desk && cl.sh === 'rt' && cl.con === 'MAIN' && cl.cb === 'rt' && cl.bar === 'wrap' && cl.btn === '[DESK]' && cl.saved === false && cl.root === 'none', 'classic toggle puts every container back in the v5.5.1 layout and is saved ' + JSON.stringify(cl));
  await p.reload(); await wait(3000);
  const cl2 = await p.evaluate(() => document.body.classList.contains('desk'));
  await p.click('#deskBtn'); await wait(500);
  const back = await p.evaluate(() => ({ desk: document.body.classList.contains('desk'), sh: !!document.getElementById('sh').closest('#win-sheet') }));
  ok(!cl2 && back.desk && back.sh, 'classic survives reload; [DESK] in the header brings the desktop back ' + JSON.stringify([cl2, back]));
  await p.click('#deskReset'); await wait(300);
  ok(await p.evaluate(() => Object.keys(UI.desk.L.solo || {}).length === 0 && Math.abs(document.getElementById('win-sheet').offsetLeft - document.getElementById('win-con').offsetLeft) < 2), '[RESET LAYOUT] clears the saved layout');
  const hd = await p.evaluate(() => { const hs = [...document.querySelectorAll('header > *')].filter(e => e.offsetParent); const tops = hs.map(e => [e.className || e.id, Math.round(e.getBoundingClientRect().top), Math.round(e.getBoundingClientRect().height)]); const cs = tops.filter(x => x[2] > 0).map(x => x[1] + x[2] / 2); return Math.max(...cs) - Math.min(...cs) <= 8 && document.querySelector('header').getBoundingClientRect().height < 40 ? true : JSON.stringify([tops, document.querySelector('header').getBoundingClientRect().height]); });
  ok(hd === true, 'header stays one line at 1280px with the [CLASSIC]/[DESK] toggle ' + hd);
  await p.evaluate(() => { S.view = 'catalog'; R(); }); await wait(2500);
  ok(await p.evaluate(() => /COMPONENT REGISTRY$/.test(document.getElementById('wt-tele').textContent)), 'the main window retitles with the view (COMPONENT REGISTRY)');
  await p.screenshot({ path: shots + '/desk-m1-registry.png' });
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
