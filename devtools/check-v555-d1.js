// FORGE-OS v5.5.5-D1 desktop checks (Overseer spec feedback/v555-d1/SPEC.md + round2/NOTES.md). Usage: node check-v555-d1.js [base] [shotdir]
// Solo: login form (no role rows, layout toggle), icons under windows, tabbed unit windows (colour routing on first open, tab drag,
// no move on colour change, background tabs live), narrow 4+4 doll, window chrome, sections, group window (collapsible selector,
// mini dolls, SELECTED UNIT area, OPEN / double-click), console window, settings + REMUS accents, workstation windows, classic toggle.
// MP (fresh dev server): login on connect + prefill, roll permissions across tabs and the group area, tall console user strip.
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8090';
const shots = process.argv[3] || '/workspace/forge-os/feedback/v555-d1/round2/shots';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(shots, { recursive: true });
const shot = (p, f) => p.screenshot({ path: shots + '/' + f });
const NAMES = ['MSH-01 / MUSHA TEST', 'ICR-07 / ICARUS', 'RVN-06 / RAVEN'];
async function loadUnits(p, names, arm) {
  await p.evaluate(async ([fx, names, arm]) => {
    for (const nm of names) {
      await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', nm)], nm + '.txt'));
      if (arm) { const S = Forge.state(); const mel = DB.find(x => x.c == 'A' && /MELEE/.test(wLab(x)) && /DMG:/.test(x.s) && !x.th), rng = DB.find(x => x.c == 'A' && hasRng(x) && /ROF:5 /.test(x.s) && !x.th && /AMMO:/.test(x.s));
        S.items.push(Object.assign(structuredClone(mel), { mount: 'RH' }), Object.assign(structuredClone(rng), { mount: 'BL', sd: 1 })); S.pilot = { pil: '14', w_MELEE: '13', [wKey(rng)]: '12', eng: '12', sen: '11' }; }
    }
    Forge.state().view = 'sortie'; Forge.render();
  }, [fx, names, arm]);
  await wait(2500);
}
const labels = (p, id) => p.evaluate((id) => { const w = Desk.wins().find(w => w.id === id); const h = Desk.hosts().get(w.u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; const win = document.querySelector(`.dkw[data-id="${id}"]`).getBoundingClientRect();
  const ls = [...r.querySelectorAll('.mechmap .mlab')].map(e => { const b = e.getBoundingClientRect(); return { n: e.querySelector('.mn').textContent.trim(), l: Math.round(b.left), t: b.top, r: Math.max(b.right, b.left + e.scrollWidth), b: b.bottom }; });
  const bad = []; for (let i = 0; i < ls.length; i++) { const a = ls[i]; if (a.r > win.right - 1) bad.push(a.n + ' spills past the window'); for (let j = i + 1; j < ls.length; j++) { const c = ls[j]; if (a.l < c.r - 1 && c.l < a.r - 1 && a.t < c.b - 1 && c.t < a.b - 1) bad.push(a.n + ' x ' + c.n); } }
  const svg = r.querySelector('.mechmap svg').getBoundingClientRect(), mid = svg.left + svg.width / 2;
  return { w: Math.round(win.width), n: ls.length, bad, lefts: ls.map(x => x.l), sides: [ls.filter(x => x.r <= mid).length, ls.filter(x => x.l >= mid).length], below: ls.filter(x => x.t >= svg.bottom - 1).length }; }, id);
const uw = p => p.evaluate(() => Desk.wins().filter(w => w.k === 'unit').map(w => ({ id: w.id, u: w.u, c: w.c, tabs: (w.tabs || []).slice(), n: document.querySelector(`.dkw[data-id="${w.id}"] .dk-n`).textContent })));
const dupIds = p => p.evaluate(() => { const c = {}; document.querySelectorAll('[id]').forEach(e => { c[e.id] = (c[e.id] || 0) + 1; }); return Object.keys(c).filter(k => c[k] > 1); });
const hpOf = (p, nm) => p.evaluate((nm) => { const S = Forge.state(); Forge.save(); const sh = S.sheets.find(s => (s.d && (s.d.id + ' ' + s.d.cs).includes(nm.split(' / ')[0]))); return sh && sh.d.tel.hp.slice(); }, nm);
const keyOf = (p, nm) => p.evaluate((nm) => { const sh = Forge.state().sheets.find(s => (s.d.id + ' ' + s.d.cs).includes(nm.split(' / ')[0])); return Desk.ukey(sh); }, nm);
const hostTxt = (p, u, s) => p.evaluate(([u, s]) => { const h = Desk.hosts().get(u + '|' + s); return h ? (h.firstChild ? h : h.shadowRoot).textContent : ''; }, [u, s]);
const geo = (p, id) => p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`), r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), hid: e.hidden, max: e.classList.contains('max') }; }, id);
const areaR = p => p.evaluate(() => { const r = document.getElementById('dkarea').getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; });
async function dragBy(p, sel, dx, dy) { const t = await p.locator(sel).boundingBox(); await p.mouse.move(t.x + 30, t.y + t.height / 2); await p.mouse.down(); await p.mouse.move(t.x + 30 + dx, t.y + t.height / 2 + dy, { steps: 8 }); await p.mouse.up(); await wait(250); }
/* REMUS: no cyan accents anywhere except the deliberate tab-colour palette (paper doll data-tt, tab/colour swatches, coloured sheet tabs) */
const cyanScan = p => p.evaluate(() => {
  const cyan = (c) => { const m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(c || ''); if (!m || (m[4] !== undefined && +m[4] < .25)) return false; const [r, g, b] = [+m[1], +m[2], +m[3]]; return r < 120 && g > 150 && b > 150 && g - r > 60 && b - r > 60; };
  const skip = '[data-tt],.dk-sw,.dk-ut i,.sw i,.cur i,.dk-mini,[onclick^=shClick],#dklkcol,.mptint,#mptint,[style*="2ee6e6"],[style*="46, 230, 230"]';
  const out = {};
  const scan = (root, tag) => root.querySelectorAll('*').forEach((e) => { if (e.closest(skip)) return; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    for (const q of ['borderTopColor', 'borderLeftColor', 'outlineColor', 'color', 'backgroundColor', 'boxShadow', 'fill', 'stroke']) { const v = cs[q]; if ((q === 'outlineColor' && cs.outlineStyle === 'none') || (q.startsWith('border') && cs[q.replace('Color', 'Width')] === '0px')) continue;
      if (cyan(v) || (q === 'boxShadow' && /rgb/.test(v) && cyan((v.match(/rgba?\([^)]*\)/) || [''])[0]))) { const k = tag + ' ' + q + ' ' + (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + [...e.classList].join('.')); out[k] = (out[k] || 0) + 1; } } });
  scan(document.getElementById('dk'), 'L'); Desk.hosts().forEach((h) => { if (h.isConnected) scan(h.shadowRoot, 'S'); });
  return out; });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  /* ================= SOLO ================= */
  {
    const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/status of (409|413)|ERR_FAILED|net::/.test(m.text())) errs.push(m.text()); });
    await p.goto(base + '/terminal.html'); await wait(2500);
    // 1/3/6 login form
    const lk = await p.evaluate(() => { const l = document.getElementById('dklock'), r = l.getBoundingClientRect(); return { vis: !l.hidden, full: r.width >= innerWidth - 1 && r.height >= innerHeight - 1, rows: l.querySelectorAll('.row').length, tabs: l.querySelectorAll('[role=tab],.lk-sec,.lk-tabs').length, f: ['dklkname', 'dklkcol', 'dklkgo', 'dklkoff', 'dklkdesk', 'dklkclassic'].every(i => !!document.getElementById(i)), desk: document.getElementById('dklkdesk').classList.contains('on'), wrap: getComputedStyle(document.getElementById('wrap')).display }; });
    ok(lk.vis && lk.full && lk.rows === 0 && lk.tabs === 0 && lk.f && lk.desk && lk.wrap === 'none', 'login: one form (callsign, colour, LOGIN, WORK OFFLINE) with no role rows or sections; layout toggle on DESKTOP ' + JSON.stringify(lk));
    await shot(p, 'r2-01-login.png');
    await p.click('#dklkoff'); await wait(1500);
    ok(await p.evaluate(() => document.getElementById('dklock').hidden && Desk.wins().some(w => w.k === 'enc' && !w.hidden)), 'login > desktop: WORK OFFLINE goes straight to the desktop (ENCOUNTER window)');
    // 2 icons under windows; windows may sit over the icon column
    const encId = await p.evaluate(() => Desk.wins().find(w => w.k === 'enc').id);
    await dragBy(p, `.dkw[data-id="${encId}"] .dk-t .dk-n`, -200, 140);
    const under = await p.evaluate((id) => { const w = document.querySelector(`.dkw[data-id="${id}"]`).getBoundingClientRect(); const ic = [...document.querySelectorAll('#dkicons .dk-ico')].map(i => i.getBoundingClientRect()).find(r => r.top > w.top + 30 && r.bottom < w.bottom && r.left >= w.left); if (!ic) return { w: [w.left, w.top, w.height] }; const e = document.elementFromPoint(ic.left + ic.width / 2, ic.top + ic.height / 2); return { wl: Math.round(w.left), onWin: !!(e && e.closest(`.dkw[data-id="${id}"]`)) }; }, encId);
    ok(under.wl < 88 && under.onWin, 'desktop icons render under windows: a window dragged over the icon column covers the icons ' + JSON.stringify(under));
    await p.evaluate((id) => Desk.geo(id, { x: 88, y: 8, w: 900, h: 96 }), encId); await wait(200);
    // 16 tabbed unit windows
    await loadUnits(p, NAMES, true);
    let ws = await uw(p);
    ok(ws.length === 1 && ws[0].tabs.length === 3 && ws[0].c === 0 && await p.evaluate((id) => document.querySelectorAll(`.dkw[data-id="${id}"] .dk-ut`).length === 3, ws[0].id), 'tabbed unit windows: three opened units with no tab colour share ONE unit window (grey bucket) with a tab strip ' + JSON.stringify(ws));
    const [kA, kB, kC] = [await keyOf(p, NAMES[0]), await keyOf(p, NAMES[1]), await keyOf(p, NAMES[2])];
    await p.evaluate(() => { Desk.wins().filter(w => w.k === 'unit').forEach(w => Desk.close(w.id)); const S = Forge.state(); Forge.save(); S.sheets[0].col = 1; S.sheets[1].col = 1; S.sheets[2].col = 3; Forge.render(); }); await wait(500);
    for (const i of [0, 1, 2]) { await p.locator(`.dkw[data-k=enc] [data-i="${i}"][onclick^=shClick]`).click(); await wait(500); }
    ws = await uw(p); let cy = ws.find(w => w.c === 1), rd = ws.find(w => w.c === 3);
    ok(ws.length === 2 && cy && rd && JSON.stringify(cy.tabs) === JSON.stringify([kA, kB]) && JSON.stringify(rd.tabs) === JSON.stringify([kC]) && /CYAN/.test(cy.n) && /RED/.test(rd.n), 'open routing by colour: first open puts each unit in the window for its tab colour (CYAN: 2 tabs, RED: 1), creating windows as needed ' + JSON.stringify(ws.map(w => [w.n, w.tabs])));
    await p.evaluate(([c, r]) => { Desk.geo(c, { x: 88, y: 112, w: 700, h: 740 }); Desk.geo(r, { x: 796, y: 112, w: 700, h: 740 }); }, [cy.id, rd.id]); await wait(300);
    const fitW = [await labels(p, cy.id), await labels(p, rd.id)];
    ok(fitW.every(f => f.n === 8 && !f.bad.length), 'paper doll labels fit in both colour windows ' + JSON.stringify(fitW.map(f => [f.w, f.bad])));
    // background tabs stay live; the active tab is the acting unit
    await p.click(`.dkw[data-id="${cy.id}"] .dk-ut[data-u="${kA}"]`); await wait(500);
    ok(await p.evaluate(([id, u]) => Desk.wins().find(w => w.id === id).u === u && Desk.curKey() === u, [cy.id, kA]), 'clicking a tab makes it the active tab and the acting unit');
    const dmg = async (u, loc, v) => { await p.locator(`.dk-sec[data-u="${u}"][data-s=doll] .mlab`).nth(loc).click(); await wait(300); await p.locator(`.dk-sec[data-u="${u}"][data-s=impact] input[type=number]`).first().fill(String(v)); await wait(200); await p.locator(`.dk-sec[data-u="${u}"][data-s=impact] .damage-apply`).click(); await wait(1200); };
    const a0 = await hpOf(p, NAMES[0]), c0 = await hpOf(p, NAMES[2]);
    await dmg(kA, 1, 700); const a1 = await hpOf(p, NAMES[0]), c1 = await hpOf(p, NAMES[2]);
    await dmg(kC, 2, 720); const a2 = await hpOf(p, NAMES[0]), c2 = await hpOf(p, NAMES[2]);
    ok(JSON.stringify(a1) !== JSON.stringify(a0) && JSON.stringify(c1) === JSON.stringify(c0) && JSON.stringify(c2) !== JSON.stringify(c1) && JSON.stringify(a2) === JSON.stringify(a1), 'all units live: damage in the CYAN window hits only its active unit, then the RED window hits only its unit, no switch step ' + JSON.stringify([a0, a1, c1, c2].map(x => x && x.join('/'))));
    await p.evaluate((u) => { const S = Forge.state(), i = S.sheets.findIndex(s => Desk.ukey(s) === u); if (i === S.cur) return; S.sheets[i].d.tel.hp[0] = 1; Forge.render(); }, kB); await wait(400);
    const bgLive = /\b1\/\d+ HP/.test(await hostTxt(p, kB, 'doll'));
    await p.click(`.dkw[data-id="${cy.id}"] .dk-ut[data-u="${kB}"]`); await wait(500);
    const bgShown = await p.evaluate(([id, u]) => { const s = document.querySelector(`.dkw[data-id="${id}"] .dk-seg[data-s=doll] .dk-sec`); return s && s.dataset.u === u && /\b1\/\d+ HP/.test((s.firstChild ? s : s.shadowRoot).textContent); }, [cy.id, kB]);
    ok(bgLive && bgShown, 'a background tab keeps rendering from its own data (live) and shows the change when its tab is opened ' + JSON.stringify([bgLive, bgShown]));
    const rl0 = await p.evaluate(() => document.getElementById('log').textContent.length);
    await p.locator(`.dk-sec[data-u="${kB}"][data-s=rolls] button:has-text("[ROLL]")`).first().click(); await wait(2500);
    const rl = await p.evaluate(([n, u]) => [Desk.curKey() === u, document.getElementById('log').textContent.slice(n)], [rl0, kB]);
    ok(rl[0] && /ICR-07/.test(rl[1]) && /Do[SF]/.test(rl[1]), 'a [ROLL] on the newly active tab rolls for that unit ' + JSON.stringify(rl[1].slice(0, 140)));
    ok((await dupIds(p)).length === 0, 'no duplicate ids with tabbed windows ' + JSON.stringify(await dupIds(p)));
    // skill input focus survives a render
    await p.locator(`.dk-sec[data-u="${kB}"][data-s=skills] input[data-skill=pil]`).fill('15'); await wait(200);
    await p.evaluate(() => Forge.render()); await wait(300);
    const fk = await p.evaluate((u) => { const a = document.activeElement; return [a && a.dataset && a.dataset.skill, a && a.value, a && a.closest('.dk-sec') && a.closest('.dk-sec').dataset.u === u]; }, kB);
    ok(fk[0] === 'pil' && fk[1] === '15' && fk[2], 'a skill input keeps focus and value through a re-render ' + JSON.stringify(fk));
    await p.click(`.dkw[data-id="${cy.id}"] .dk-ut[data-u="${kA}"]`); await wait(400);
    await shot(p, 'r2-02-unit-windows-two-colours.png');
    // colour change later does not move the unit
    await p.evaluate(() => { const S = Forge.state(); Forge.save(); S.sheets[0].col = 3; Forge.render(); }); await wait(500);
    ws = await uw(p); cy = ws.find(w => w.id === cy.id); rd = ws.find(w => w.id === rd.id);
    ok(cy.tabs.includes(kA) && !rd.tabs.includes(kA), 'changing a unit\'s tab colour later does NOT move it out of its window ' + JSON.stringify(ws.map(w => [w.n, w.tabs])));
    await p.evaluate(() => { const S = Forge.state(); Forge.save(); S.sheets[0].col = 1; Forge.render(); }); await wait(400);
    // tab drag between windows, and onto the desktop (tear-off)
    await p.locator(`.dkw[data-id="${cy.id}"] .dk-ut[data-u="${kB}"]`).dragTo(p.locator(`.dkw[data-id="${rd.id}"] .dk-utabs`)); await wait(800);
    ws = await uw(p); cy = ws.find(w => w.id === cy.id); rd = ws.find(w => w.id === rd.id);
    ok(JSON.stringify(cy.tabs) === JSON.stringify([kA]) && JSON.stringify(rd.tabs) === JSON.stringify([kC, kB]) && rd.u === kB, 'tab drag: dragging a tab onto another unit window moves the unit there as its active tab ' + JSON.stringify(ws.map(w => [w.n, w.tabs])));
    await shot(p, 'r2-03-unit-window-several-tabs.png');
    await p.locator(`.dkw[data-id="${rd.id}"] .dk-ut[data-u="${kC}"]`).dragTo(p.locator('#dkdesk'), { targetPosition: { x: 1530, y: 500 } }); await wait(800);
    ws = await uw(p); const torn = ws.find(w => w.tabs.length === 1 && w.tabs[0] === kC);
    ok(ws.length === 3 && torn && torn.c === null && JSON.stringify(ws.find(w => w.id === rd.id).tabs) === JSON.stringify([kB]), 'tab dropped on the desktop: tears off into a new unit window of its own at the drop point ' + JSON.stringify(ws.map(w => [w.n, w.tabs, w.c])));
    await p.locator(`.dkw[data-id="${torn.id}"] .dk-ut`).dragTo(p.locator(`.dkw[data-id="${rd.id}"] .dk-utabs`)); await wait(800);
    ws = await uw(p); rd = ws.find(w => w.id === rd.id);
    ok(ws.length === 2 && rd.tabs.length === 2, 'dragging the last tab into another window closes the emptied window ' + JSON.stringify(ws.map(w => [w.n, w.tabs])));
    // 4 narrow paper doll: 4 + 4
    await p.evaluate((id) => Desk.geo(id, { x: 796, y: 112, w: 440, h: 740 }), rd.id); await wait(400);
    const nar = await labels(p, rd.id), cols = [...new Set(nar.lefts)];
    ok(nar.n === 8 && !nar.bad.length && cols.length === 2 && cols.every(c => nar.lefts.filter(l => l === c).length === 4) && nar.below === 8, 'narrow paper doll: the 8 components sit in 2 even columns (4 + 4) under the doll ' + JSON.stringify(nar));
    await p.locator(`.dkw[data-id="${rd.id}"]`).screenshot({ path: shots + '/r2-04-narrow-doll.png' });
    await p.evaluate((id) => Desk.geo(id, { x: 796, y: 112, w: 700, h: 740 }), rd.id); await wait(300);
    // 9 sheet search hidden with more than 3 sheets
    await loadUnits(p, ['KTE-4 / KITE'], false);
    ok(await p.evaluate(() => Forge.state().sheets.length === 4 && (!document.getElementById('sheetQuery') || getComputedStyle(document.getElementById('sheetQuery')).display === 'none')), 'encounter window: no sheet search bar (4 sheets loaded)');
    ws = await uw(p);
    ok(ws.length === 3 && ws.some(w => w.c === 0 && w.tabs.length === 1), 'a new unit with no colour opens in the grey bucket window ' + JSON.stringify(ws.map(w => [w.n, w.tabs])));
    await p.evaluate(() => { const x = Desk.wins().find(w => w.k === 'unit' && w.c === 0); if (x) Desk.close(x.id); }); await wait(300);
    // window chrome on the RED unit window
    const B = rd.id;
    await p.evaluate((id) => { Desk.geo(id, { x: 200, y: 60, w: 700, h: 600 }); Desk.front(id); }, B); await wait(200);
    const g0 = await geo(p, B); await dragBy(p, `.dkw[data-id="${B}"] .dk-t .dk-n`, 100, 60); const g1 = await geo(p, B);
    ok(Math.abs(g1.x - g0.x - 100) <= 8 && Math.abs(g1.y - g0.y - 60) <= 8, 'drag: the title bar moves the window ' + JSON.stringify([g0, g1]));
    const hs = await p.locator(`.dkw[data-id="${B}"] .dk-h[data-d=se]`).boundingBox();
    await p.mouse.move(hs.x + 5, hs.y + 5); await p.mouse.down(); await p.mouse.move(hs.x + 85, hs.y - 75, { steps: 8 }); await p.mouse.up(); await wait(200);
    const g2 = await geo(p, B);
    ok(Math.abs(g2.w - g1.w - 80) <= 8 && Math.abs(g2.h - g1.h + 80) <= 8, 'resize: the corner handle resizes ' + JSON.stringify([g1, g2]));
    await p.click(`.dkw[data-id="${B}"] [data-a=max]`); await wait(200);
    const gm = await geo(p, B), ar = await areaR(p);
    ok(gm.max && Math.abs(gm.w - ar.w) <= 2 && Math.abs(gm.h - ar.h) <= 2, 'maximize fills the desktop area ' + JSON.stringify([gm, ar]));
    await p.click(`.dkw[data-id="${B}"] [data-a=max]`); await wait(200);
    const gr = await geo(p, B);
    ok(!gr.max && gr.w === g2.w && gr.x === g2.x, 'restore returns the previous geometry ' + JSON.stringify(gr));
    await p.click(`.dkw[data-id="${B}"] [data-a=min]`); await wait(200);
    const tb = await p.evaluate((id) => { const t = document.querySelector(`#dktabs [data-id="${id}"]`); return t && t.className; }, B);
    ok((await geo(p, B)).hid && /min/.test(tb || ''), 'minimize hides the window; its taskbar tab stays ' + tb);
    await p.click(`#dktabs [data-id="${B}"]`); await wait(200);
    ok(!(await geo(p, B)).hid, 'the taskbar tab restores it');
    // sections on the active tab: collapse, pop out, dock
    await p.click(`.dkw[data-id="${B}"] .dk-seg[data-s=sheet] [data-a=col]`); await wait(200);
    ok(await p.evaluate((id) => { const s = document.querySelector(`.dkw[data-id="${id}"] .dk-seg[data-s=sheet]`); return s.classList.contains('col') && getComputedStyle(s.querySelector('.dk-sb')).display === 'none'; }, B), 'collapse: a section folds in place');
    await p.click(`.dkw[data-id="${B}"] .dk-seg[data-s=sheet] [data-a=col]`); await wait(200);
    const actB = (await uw(p)).find(w => w.id === B).u;
    await p.click(`.dkw[data-id="${B}"] .dk-seg[data-s=doll] [data-a=pop]`); await wait(800);
    const pop = await p.evaluate((u) => { const w = Desk.wins().find(w => w.k === 'sec' && w.u === u && w.s === 'doll'); const e = w && document.querySelector(`.dkw[data-id="${w.id}"]`); const h = e && e.querySelector('.dk-sec'); const r = h && (h.firstChild ? h : h.shadowRoot); return { id: w && w.id, has: !!(r && r.querySelector('.mechmap')), title: e && e.querySelector('.dk-n').textContent, ph: !!document.querySelector(`.dkw[data-k=unit] .dk-seg[data-s=doll] .dk-ph`) }; }, actB);
    ok(pop.id && pop.has && /PAPER DOLL/.test(pop.title) && pop.ph, 'pop out: the active tab\'s paper doll gets its own window; the unit window shows a placeholder ' + JSON.stringify(pop));
    await p.click(`.dkw[data-id="${pop.id}"] [data-a=dock]`); await wait(500);
    ok(await p.evaluate((u) => !Desk.wins().some(w => w.k === 'sec') && !!document.querySelector(`.dkw[data-k=unit] .dk-seg[data-s=doll] .dk-sec[data-u="${u}"]`), actB), 'dock: the section returns to its unit window');
    // group window: 10 collapsible selector, 11/14 mini dolls, 15 SELECTED UNIT area
    await p.evaluate(() => { const S = Forge.state(); Forge.save(); S.sheets[0].col = 1; S.sheets[1].col = 1; S.sheets[2].col = 3; Forge.render(); }); await wait(300);
    await p.click(`.dkw[data-id="${cy.id}"] .dk-seg[data-s=doll] .mlab >> nth=2`); await wait(300); // a selected part in the real doll
    await p.evaluate(([c, r]) => { Desk.geo(c, { x: 88, y: 112, w: 700, h: 740 }); Desk.geo(r, { x: 796, y: 112, w: 700, h: 740 }); }, [cy.id, rd.id]); await wait(300);
    await p.click(`.dkw[data-id="${rd.id}"] .dk-ut[data-u="${kB}"]`); await wait(400);
    await p.click('.dk-ico[data-ico=units]'); await wait(600);
    const gw = await p.evaluate(() => Desk.wins().filter(w => w.k === 'group').pop());
    await p.evaluate((id) => Desk.geo(id, { x: 88, y: 8, w: 620, h: 860 }), gw.id); await wait(200);
    await p.click(`.dkw[data-id="${gw.id}"] .sw button[data-c="1"]`); await wait(400);
    const cards = await p.evaluate((id) => [...document.querySelectorAll(`.dkw[data-id="${id}"] .dk-card`)].map(c => { const s = c.querySelector('svg'), cr = c.getBoundingClientRect(), sr = s.getBoundingClientRect(), z = s.querySelector('g.mz,.mz'); return { n: c.querySelector('.nm2').textContent, inCard: sr.top >= cr.top - 1 && sr.bottom <= cr.bottom + 1, sel: s.querySelectorAll('.sel,.ld.on').length, tt: c.querySelector('.doll').dataset.tt, stroke: z && getComputedStyle(z).stroke, fill: z && getComputedStyle(z.querySelector('path,polygon,rect') || z).fill }; }), gw.id);
    const realFill = await p.evaluate((u) => { const h = Desk.hosts().get(u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; const z = [...r.querySelectorAll('.mechmap g.mz')].find(g => !g.classList.contains('sel')); return getComputedStyle(z.querySelector('path,polygon,rect') || z).fill; }, kA);
    const realSel = await p.evaluate((u) => { const h = Desk.hosts().get(u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; return r.querySelectorAll('.mechmap g.mz.sel').length; }, kA);
    ok(cards.length === 2 && cards.every(c => c.inCard) && cards.some(c => /MUSHA/.test(c.n)) && cards.some(c => /ICARUS/.test(c.n)), 'group window (CYAN): the two CYAN units as mini paper-doll cards, each doll inside its card ' + JSON.stringify(cards.map(c => [c.n, c.inCard])));
    ok(realSel === 1 && cards.every(c => c.sel === 0 && /46, 230, 230/.test(c.stroke || '')), 'group mini dolls show no selected-component highlight (the unit window still does) ' + JSON.stringify([realSel, cards.map(c => [c.sel, c.stroke])]));
    ok(cards.every(c => c.tt === 'navy') && cards.some(c => /MUSHA/.test(c.n) && c.fill === realFill), 'group mini dolls keep inheriting the tab colour (data-tt navy, same zone fill as the full doll) ' + JSON.stringify([realFill, cards.map(c => [c.tt, c.fill])]));
    await p.click(`.dkw[data-id="${gw.id}"] [data-swt]`); await wait(300);
    const col1 = await p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`); return { btns: e.querySelectorAll('.sw button[data-c]').length, cur: (e.querySelector('.sw .cur') || {}).textContent, ex: e.querySelector('[data-swt]').getAttribute('aria-expanded') }; }, gw.id);
    ok(col1.btns === 0 && /CYAN/.test(col1.cur || '') && col1.ex === 'false', 'group window: the tab-colour selector collapses to the current colour ' + JSON.stringify(col1));
    await p.evaluate((id) => Desk.front(id), gw.id); await shot(p, 'r2-05-group-selector-collapsed.png');
    await p.click(`.dkw[data-id="${gw.id}"] [data-swt]`); await wait(300);
    ok(await p.evaluate((id) => document.querySelectorAll(`.dkw[data-id="${id}"] .sw button[data-c]`).length === 6, gw.id), 'group window: the selector expands again (6 colours)');
    await shot(p, 'r2-06-group-selector-expanded.png');
    // 15 select a card -> SELECTED UNIT area (live, routed); no window opens
    const nW0 = (await uw(p)).length;
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-card:has-text("ICARUS")`).click(); await wait(800);
    const selA = await p.evaluate(([id, u]) => { const e = document.querySelector(`.dkw[data-id="${id}"]`); const hs = [...e.querySelectorAll('.dk-gsb>.dk-sec')]; return { sel: Desk.wins().find(w => w.id === id).sel === u, on: (e.querySelector('.dk-card.on .nm2') || {}).textContent, hosts: hs.map(h => h.dataset.u + '|' + h.dataset.s), map: hs.some(h => !!(h.firstChild ? h : h.shadowRoot).querySelector('.mechmap')), dmg: hs.some(h => !!(h.firstChild ? h : h.shadowRoot).querySelector('.damage-apply')), hdr: e.querySelector('.dk-gsel .dk-n').textContent, open: !!e.querySelector('.dk-gsel [data-g=open]') }; }, [gw.id, kB]);
    ok(selA.sel && /ICARUS/.test(selA.on || '') && selA.hosts.join() === `${kB}|doll,${kB}|impact` && selA.map && selA.dmg && /ICARUS/.test(selA.hdr) && selA.open && (await uw(p)).length === nW0, 'single click selects a card: its paper doll and impact resolution show in the group window\'s SELECTED UNIT area; no window opens ' + JSON.stringify(selA));
    const ph = await p.evaluate(([id]) => /SHOWN IN THE UNIT GROUP WINDOW/.test(document.querySelector(`.dkw[data-id="${id}"] .dk-seg[data-s=doll]`).textContent), [rd.id]);
    ok(ph, 'its unit window (active tab) shows a placeholder for the sections now in the group window');
    const bS0 = await hpOf(p, NAMES[1]);
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-gsb .mlab`).nth(4).click(); await wait(300);
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-gsb input[type=number]`).first().fill('700'); await wait(200);
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-gsb .damage-apply`).click(); await wait(1200);
    const bS1 = await hpOf(p, NAMES[1]);
    ok(JSON.stringify(bS1) !== JSON.stringify(bS0) && await p.evaluate((u) => Desk.curKey() === u, kB), 'the SELECTED UNIT area is live: pick a part and APPLY there damages that unit (routed like any unit window) ' + JSON.stringify([bS0, bS1].map(x => x.join('/'))));
    ok((await dupIds(p)).length === 0, 'no duplicate ids with a unit selected in the group window');
    await p.evaluate((id) => Desk.front(id), gw.id); await wait(200);
    await shot(p, 'r2-07-group-unit-selected.png');
    // [OPEN ↗]: focuses that unit's tab in its window
    await p.click(`.dkw[data-id="${rd.id}"] .dk-ut[data-u="${kC}"]`); await wait(400);
    await p.click(`.dkw[data-id="${gw.id}"] .dk-gsel [data-g=open]`); await wait(800);
    const op1 = await p.evaluate(([id, gid, u]) => { const w = Desk.wins().find(w => w.id === id); const s = document.querySelector(`.dkw[data-id="${id}"] .dk-seg[data-s=doll] .dk-sec`); return { act: w.u === u, top: Desk.wins().filter(w => !w.hidden).sort((a, b) => b.z - a.z)[0].id === id, inWin: !!s && s.dataset.u === u, gph: /OPEN IN ITS UNIT WINDOW/.test(document.querySelector(`.dkw[data-id="${gid}"] .dk-gsel`).textContent) }; }, [rd.id, gw.id, kB]);
    ok(op1.act && op1.top && op1.inWin && op1.gph, '[OPEN ↗] focuses the unit\'s tab in its window; the full window gets its sections back (group shows OPEN IN ITS UNIT WINDOW / SHOW HERE) ' + JSON.stringify(op1));
    await p.click(`.dkw[data-id="${gw.id}"] [data-g=here]`); await wait(500);
    ok(await p.evaluate(([gid, u]) => !!document.querySelector(`.dkw[data-id="${gid}"] .dk-gsb>.dk-sec[data-u="${u}"]`), [gw.id, kB]), '[SHOW HERE] brings the sections back into the group window');
    // double-click on a card whose unit has no window: routed by colour (CYAN window gets the tab)
    await p.click(`.dkw[data-id="${rd.id}"] .dk-ut[data-u="${kB}"] [data-ux]`); await wait(500);
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-card:has-text("ICARUS")`).dblclick(); await wait(900);
    ws = await uw(p); const cyw = ws.find(w => w.id === cy.id);
    ok(cyw && cyw.tabs.includes(kB) && cyw.u === kB, 'double-click on a card opens the unit: no window holds it, so it joins the window for its colour (CYAN) as the active tab ' + JSON.stringify(ws.map(w => [w.n, w.tabs])));
    // ref2 default size when a new window is created from the group
    await p.evaluate((id) => Desk.close(id), cy.id); await wait(400);
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-card:has-text("ICARUS")`).click(); await wait(400);
    await p.click(`.dkw[data-id="${gw.id}"] .dk-gsel [data-g=open]`); await wait(900);
    ws = await uw(p); const nw = ws.find(w => w.tabs.includes(kB));
    const g6 = nw && await geo(p, nw.id), wide = nw && await labels(p, nw.id);
    const shield = nw && await p.evaluate((u) => { const h = Desk.hosts().get(u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; const s = r.querySelector('.shieldrow'); return !s || s.getBoundingClientRect().height > 0; /* the test frame has no shields */ }, kB);
    ok(nw && nw.c === 1 && Math.abs(g6.w - 600) <= 2 && Math.abs(g6.h - 500) <= 2 && wide.n === 8 && !wide.bad.length && wide.sides[0] > 0 && wide.sides[1] > 0 && shield, 'a unit window created from the group opens at the ref2 size (600 x 500): wide doll with labels on both sides, shield row (when the frame has shields) visible ' + JSON.stringify({ g6, sides: wide && wide.sides, bad: wide && wide.bad, shield }));
    await shot(p, 'r2-08-unit-from-group.png');
    // 13 console window
    const conId = await p.evaluate(() => (Desk.conWin() || {}).w ? Desk.conWin().w.id : (Desk.wins().find(w => w.k === 'con') || {}).id);
    ok(await p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`); return e && e.hidden && e.contains(document.getElementById('cb')) && !document.querySelector(`#dktabs [data-id="${id}"]`); }, conId), 'console: one shared console in a window, hidden by default, with no taskbar tab (the tray button is its toggle)');
    await p.click('#dktray'); await wait(400);
    const cg = await geo(p, conId), arc = await areaR(p);
    ok(!cg.hid && Math.abs(cg.x + cg.w - arc.r) <= 8 && Math.abs(cg.y + cg.h - arc.b) <= 8, 'console: the tray button opens it at the bottom right (where the flyout was) ' + JSON.stringify([cg, arc]));
    await p.fill('#CI', 'hello table'); await p.keyboard.press('Enter'); await wait(600);
    await p.mouse.click(700, 500); await p.keyboard.press('Escape'); await wait(300);
    ok(!(await geo(p, conId)).hid, 'console: typing, outside clicks and Escape leave it open');
    await shot(p, 'r2-09-console-default.png');
    await dragBy(p, `.dkw[data-id="${conId}"] .dk-t .dk-n`, -500, -300); const cg2 = await geo(p, conId);
    const ch = await p.locator(`.dkw[data-id="${conId}"] .dk-h[data-d=se]`).boundingBox();
    await p.mouse.move(ch.x + 5, ch.y + 5); await p.mouse.down(); await p.mouse.move(ch.x + 65, ch.y + 45, { steps: 6 }); await p.mouse.up(); await wait(200);
    const cg3 = await geo(p, conId);
    ok(Math.abs(cg2.x - cg.x + 500) <= 8 && Math.abs(cg2.y - cg.y + 300) <= 8 && Math.abs(cg3.w - cg2.w - 60) <= 8 && Math.abs(cg3.h - cg2.h - 40) <= 8, 'console: a normal window: drag moves it and the corner resizes it ' + JSON.stringify([cg, cg2, cg3]));
    await shot(p, 'r2-10-console-moved.png');
    await p.click(`.dkw[data-id="${conId}"] [data-a=close]`); await wait(300);
    const hid1 = (await geo(p, conId)).hid;
    await p.click('#dktray'); await wait(300); const cg4 = await geo(p, conId);
    await p.click('#dktray'); await wait(300); const hid2 = (await geo(p, conId)).hid;
    ok(hid1 && !cg4.hid && cg4.x === cg3.x && cg4.y === cg3.y && hid2, 'console: × hides it; the tray button reopens it where it was left and toggles it closed ' + JSON.stringify([hid1, cg4, hid2]));
    // settings, 7 REMUS accents
    await p.click('.dk-ico[data-ico=set]'); await wait(500);
    const sw = await p.evaluate(() => Desk.wins().find(w => w.k === 'set'));
    const sect = await p.evaluate((id) => [...document.querySelectorAll(`.dkw[data-id="${id}"] legend`)].map(l => l.textContent), sw.id);
    ok(['THEME', 'AUDIO', 'UI SCALE', 'LAYOUT SLOTS'].every(k => sect.some(s => s.startsWith(k))), 'settings: theme, audio, UI scale and layout slots ' + JSON.stringify(sect));
    await shot(p, 'r2-11-settings.png');
    await p.click(`.dkw[data-id="${sw.id}"] button:has-text("REMUS ACCORD")`); await wait(500);
    await p.click('#dktray'); await wait(300);
    const cy1 = await cyanScan(p);
    ok(await p.evaluate(() => document.body.getAttribute('data-theme')) === 'remus' && Object.keys(cy1).length === 0, 'REMUS ACCORD: no cyan outlines or accents left (tab-colour palette excepted) ' + JSON.stringify(cy1));
    await p.click('#dktray'); await wait(200);
    await p.evaluate(() => { Desk.wins().filter(w => w.k === 'set' || w.k === 'group').forEach(w => Desk.minimize(w.id)); }); await wait(300);
    await shot(p, 'r2-12-desktop-amber.png');
    await p.evaluate(() => { const s = Desk.wins().find(w => w.k === 'set'); Desk.restore(s.id); }); await wait(200);
    await p.click(`.dkw[data-id="${sw.id}"] [data-ss="2"]`); await wait(300);
    const nWin = await p.evaluate(() => Desk.wins().length);
    await p.evaluate(() => Desk.close(Desk.wins().find(w => w.k === 'group').id)); await wait(300);
    await p.click(`.dkw[data-id="${sw.id}"] [data-sl="2"]`); await wait(800);
    ok(await p.evaluate((n) => Desk.wins().length === n && Desk.wins().some(w => w.k === 'group') && Desk.wins().some(w => w.k === 'unit' && (w.tabs || []).length), nWin), 'layout slot 2: SAVE then LOAD restores the window set (tabbed unit windows included)');
    const sw2 = await p.evaluate(() => { const s = Desk.wins().find(w => w.k === 'set'); Desk.front(s.id); return s.id; }); await wait(200);
    await p.click(`.dkw[data-id="${sw2}"] button:has-text("IMPERIAL NAVY")`); await wait(300);
    // 1 no swapping: workstation windows
    const before = await p.evaluate(() => ({ role: Forge.state().role, n: Forge.state().sheets.length, view: Forge.state().view }));
    await p.click('.dk-ico[data-ico=guest]'); await wait(3000);
    const asm = await p.evaluate(() => { const w = Desk.wins().find(w => w.k === 'ws' && w.n === 1); return w && { t: document.querySelector(`.dkw[data-id="${w.id}"] .dk-n`).textContent, modal: !!document.getElementById('dkmodal'), role: Forge.state().role, n: Forge.state().sheets.length, view: Forge.state().view }; });
    ok(asm && /FRAME ASSEMBLY/.test(asm.t) && !asm.modal && asm.role === before.role && asm.n === before.n && asm.view === before.view, 'FRAME ASSEMBLY opens as its own workstation window; the encounter, role and units are untouched (no swapping) ' + JSON.stringify([before, asm]));
    await p.click('.dk-ico[data-ico=cat]'); await wait(3500);
    const catW = await p.evaluate(() => Desk.wins().find(w => w.k === 'ws' && w.n === 3).id);
    const cf = p.frameLocator(`.dkw[data-id="${catW}"] iframe`);
    await cf.locator('#researchPw').fill('WRONG'); await cf.locator('#researchPw').press('Enter'); await wait(800);
    const ce1 = await p.evaluate((id) => { const f = document.querySelector(`.dkw[data-id="${id}"] iframe`).contentWindow; return { v: f.Forge.state().view, t: document.querySelector(`.dkw[data-id="${id}"] .dk-n`).textContent }; }, catW);
    ok(ce1.v === 'researchPw' && /KEY REQUIRED/.test(ce1.t), 'CATALOGUE EDITOR window: key prompt; a wrong key keeps it locked ' + JSON.stringify(ce1));
    await shot(p, 'r2-13-catalogue-key.png');
    await cf.locator('#researchPw').fill('BINAH'); await cf.locator('#researchPw').press('Enter'); await wait(1500);
    const ce2 = await p.evaluate((id) => { const f = document.querySelector(`.dkw[data-id="${id}"] iframe`).contentWindow; return { v: f.Forge.state().view, r: f.Forge.state().role, main: Forge.state().role, n: Forge.state().sheets.length }; }, catW);
    ok(/catalog/.test(ce2.v) && ce2.r === 'RESEARCH STAFF' && ce2.main === before.role && ce2.n === before.n, 'the right key opens the catalogue editor inside its window; the desktop session keeps its role and units ' + JSON.stringify(ce2));
    await p.click('.dk-ico[data-ico=ovr]'); await wait(3500);
    const ovW = await p.evaluate(() => Desk.wins().find(w => w.k === 'ws' && w.n === 5).id);
    const of = p.frameLocator(`.dkw[data-id="${ovW}"] iframe`);
    await of.locator('#pw').fill('MALKUTH'); await of.locator('#pw').press('Enter'); await wait(1500);
    ok(await p.evaluate((id) => document.querySelector(`.dkw[data-id="${id}"] iframe`).contentWindow.Forge.state().role === 'OVERSEER', ovW), 'OVERSEER window opens with its key, in its own window');
    ok(await p.evaluate((r) => Forge.state().role === r, before.role), 'the desktop session role is unchanged after the OVERSEER window unlocks ' + before.role);
    // logout -> login screen; 6 classic toggle and back
    await p.click('#dkstart'); await p.click('#dkmenu button:has-text("LOGOUT")'); await wait(200); if (await p.evaluate(() => !!document.getElementById('dkmodal'))) await p.click('#dkmodal [data-ok]'); await wait(1200);
    ok(await p.evaluate(() => !document.getElementById('dklock').hidden && Forge.state().view === 'login' && !Desk.wins().some(w => w.k === 'ws')), 'logout returns to the login screen and closes the workstation windows');
    await p.click('#dklkclassic'); await wait(2500);
    ok(await p.evaluate(() => !!(window.Desk && Desk.classic) && getComputedStyle(document.getElementById('wrap')).display !== 'none' && !document.getElementById('dklock')), 'login screen CLASSIC toggle swaps to the classic layout');
    await p.click('#dkBack'); await wait(2500);
    ok(await p.evaluate(() => window.Desk && Desk.on !== false && !Desk.classic && !document.getElementById('dklock').hidden), 'classic [DESKTOP] button swaps back to the desktop login');
    ok(errs.length === 0, 'solo: no page errors ' + JSON.stringify(errs.slice(0, 4)));
    await ctx.close();
  }
  /* ================= MP ================= */
  {
    const errs = [];
    const seat = async (name, col) => {
      const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } }); const p = await ctx.newPage();
      p.on('pageerror', e => errs.push(name + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/status of (409|413)|ERR_FAILED|net::/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
      await p.goto(base + '/terminal.html'); await wait(2000);
      const l0 = await p.evaluate(() => !document.getElementById('dklock').hidden);
      await p.fill('#dklkname', name); if (col) await p.fill('#dklkcol', col); await p.click('#dklkgo');
      await p.waitForFunction(() => !document.getElementById('mpveil') && document.getElementById('dklock').hidden && document.body.classList.contains('mp-live'), null, { timeout: 15000 });
      ok(l0, name + ': login screen on connect; LOGIN with the callsign opens the desktop on the live table');
      return { ctx, p };
    };
    const H = await seat('HOSTA');
    await loadUnits(H.p, ['HST-1 / HOSTUNIT'], true);
    const Pl = await seat('PILOTB', '#ff8800');
    await loadUnits(Pl.p, ['PB-7 / KAGE'], true); await wait(3500);
    await H.p.evaluate(() => Forge.render()); await wait(1500);
    for (const s of [H, Pl]) { await s.p.evaluate(() => { Forge.state().sheets.forEach(sh => Desk.open({ k: 'unit', u: Desk.ukey(sh) }, false)); Forge.render(); }); await wait(600); }
    const pw = await uw(Pl.p), hw = await uw(H.p);
    const pK = await keyOf(Pl.p, 'PB-7 / KAGE'), pH = await keyOf(Pl.p, 'HST-1 / HOSTUNIT');
    ok(pw.length === 1 && pw[0].tabs.length === 2 && hw.length === 1 && hw[0].tabs.length === 2, 'both seats: both units as tabs in one grey-bucket unit window ' + JSON.stringify([pw, hw].map(x => x.map(w => w.tabs))));
    const viewOnly = await Pl.p.evaluate(([o, m]) => { const g = (u, s) => { const h = Desk.hosts().get(u + '|' + s); return h.firstChild ? h : h.shadowRoot; };
      return { otherSkills: /VIEW ONLY/.test(g(o, 'skills').textContent), otherRolls: /VIEW ONLY/.test(g(o, 'rolls').textContent), ownRolls: /\[ROLL\]/.test(g(m, 'rolls').textContent) }; }, [pH, pK]);
    const wid = pw[0].id;
    const rbVis = async (u) => { await Pl.p.click(`.dkw[data-id="${wid}"] .dk-ut[data-u="${u}"]`); await wait(500); return Pl.p.evaluate((u) => { const h = Desk.hosts().get(u + '|loadout'); const r = h.firstChild ? h : h.shadowRoot; return [...r.querySelectorAll('.rbtn')].filter(b => b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden').length; }, u); };
    viewOnly.otherRb = await rbVis(pH); viewOnly.ownRb = await rbVis(pK);
    ok(viewOnly.otherSkills && viewOnly.otherRolls && viewOnly.ownRolls && viewOnly.otherRb === 0 && viewOnly.ownRb > 0, "pilot: the host's unit is view-only in its tab; the own unit tab has rolls " + JSON.stringify(viewOnly));
    await Pl.p.click(`.dkw[data-id="${wid}"] .dk-ut[data-u="${pH}"]`); await wait(500);
    const n0 = await Pl.p.evaluate(() => document.getElementById('log').textContent.length);
    const routedOther = await Pl.p.evaluate((u) => Desk.curKey() === u && document.body.classList.contains('mp-view'), pH);
    await Pl.p.evaluate(() => { try { atkRoll(0); } catch (e) { } }); await wait(1500);
    const deny = await Pl.p.evaluate((n) => document.getElementById('log').textContent.slice(n), n0);
    ok(routedOther && /ASSIGNED PILOT OR HOST ONLY/.test(deny), "pilot: the host unit's tab acts as the host unit and its roll is refused (guard) " + JSON.stringify(deny.slice(0, 160)));
    await Pl.p.click(`.dkw[data-id="${wid}"] .dk-ut[data-u="${pK}"]`); await wait(500);
    const n1 = await Pl.p.evaluate(() => document.getElementById('log').textContent.length);
    await Pl.p.locator(`.dk-sec[data-u="${pK}"][data-s=rolls] button:has-text("[ROLL]")`).first().click(); await wait(2500);
    const mine = await Pl.p.evaluate((n) => document.getElementById('log').textContent.slice(n), n1);
    ok(/KAGE/.test(mine) && !/ASSIGNED PILOT OR HOST ONLY/.test(mine), 'pilot: a [ROLL] on the own unit tab rolls ' + JSON.stringify(mine.slice(0, 140)));
    await shot(Pl.p, 'r2-14-pilot-tabs.png');
    // group area keeps the same permissions
    await Pl.p.click('.dk-ico[data-ico=units]'); await wait(800);
    const pg = await Pl.p.evaluate(() => Desk.wins().filter(w => w.k === 'group').pop().id);
    await Pl.p.locator(`.dkw[data-id="${pg}"] .dk-card:has-text("HOSTUNIT")`).click(); await wait(800);
    const gro = await Pl.p.evaluate(([id, u]) => { const h = document.querySelector(`.dkw[data-id="${id}"] .dk-gsb>.dk-sec[data-s=doll]`); return h && h.dataset.u === u && h.dataset.ro === '1'; }, [pg, pH]);
    await Pl.p.locator(`.dkw[data-id="${pg}"] .dk-gsb .sorhead`).first().click(); await wait(400);
    const n2 = await Pl.p.evaluate(() => document.getElementById('log').textContent.length);
    await Pl.p.evaluate(() => { try { atkRoll(0); } catch (e) { } }); await wait(1500);
    const deny2 = await Pl.p.evaluate((n) => document.getElementById('log').textContent.slice(n), n2);
    ok(gro && /ASSIGNED PILOT OR HOST ONLY/.test(deny2), "pilot: the host unit in the group's SELECTED UNIT area is view-only and its rolls are refused, as everywhere else " + JSON.stringify([gro, deny2.slice(0, 120)]));
    // host may roll on the pilot's unit (background tab, then active)
    const hK = await keyOf(H.p, 'PB-7 / KAGE');
    await H.p.click(`.dkw[data-id="${hw[0].id}"] .dk-ut[data-u="${hK}"]`); await wait(500);
    const n3 = await H.p.evaluate(() => document.getElementById('log').textContent.length);
    await H.p.locator(`.dk-sec[data-u="${hK}"][data-s=rolls] button:has-text("[ROLL]")`).first().click(); await wait(2500);
    const hr = await H.p.evaluate((n) => document.getElementById('log').textContent.slice(n), n3);
    ok(/KAGE/.test(hr) && !/ASSIGNED PILOT OR HOST ONLY/.test(hr), "host: a roll on the pilot's unit tab is allowed " + JSON.stringify(hr.slice(0, 140)));
    // live across seats into a background tab on the pilot seat
    await Pl.p.evaluate((id) => Desk.minimize(id), pg);
    await Pl.p.click(`.dkw[data-id="${wid}"] .dk-ut[data-u="${pH}"]`); await wait(500); // own unit now a background tab
    const pv0 = (await hostTxt(Pl.p, pK, 'doll')).match(/\d+\/\d+ HP/g).join(',');
    await H.p.locator(`.dk-sec[data-u="${hK}"][data-s=doll] .mlab`).nth(1).click(); await wait(200);
    await H.p.locator(`.dk-sec[data-u="${hK}"][data-s=impact] input[type=number]`).first().fill('700'); await H.p.locator(`.dk-sec[data-u="${hK}"][data-s=impact] .damage-apply`).click(); await wait(5000);
    const pv1 = (await hostTxt(Pl.p, pK, 'doll')).match(/\d+\/\d+ HP/g).join(',');
    ok(pv0 !== pv1, "live table: host damage reaches the pilot's unit even in a background tab " + JSON.stringify([pv0, pv1]));
    // 8 tall console: user list strip across the top
    await H.p.click('#dktray'); await wait(300);
    const hc = await H.p.evaluate(() => Desk.wins().find(w => w.k === 'con').id);
    await H.p.evaluate((id) => { Desk.geo(id, { x: 1100, y: 40, w: 380, h: 760 }); Desk.front(id); }, hc); await wait(500);
    const tall = await H.p.evaluate((id) => { const f = document.getElementById('mpfriends'), l = document.getElementById('log'), w = document.querySelector(`.dkw[data-id="${id}"] .dk-b`).getBoundingClientRect(); if (!f) return null; const fr = f.getBoundingClientRect(), lr = l.getBoundingClientRect(); return { strip: fr.bottom <= lr.top + 2 && fr.width >= w.width - 24, fr: [fr.top, fr.width, fr.height], lr: [lr.top], w: w.width, rows: f.querySelectorAll('.mprow').length }; }, hc);
    ok(tall && tall.strip && tall.rows >= 2, 'tall console window: the user list moves to a strip across the top ' + JSON.stringify(tall));
    await H.p.locator(`.dkw[data-id="${hc}"]`).screenshot({ path: shots + '/r2-15-console-tall-strip.png' });
    await H.p.evaluate((id) => Desk.geo(id, { x: 900, y: 400, w: 640, h: 420 }), hc); await wait(400);
    const wide = await H.p.evaluate(() => { const f = document.getElementById('mpfriends'), l = document.getElementById('log'); const fr = f.getBoundingClientRect(), lr = l.getBoundingClientRect(); return fr.bottom > lr.top + 10; });
    ok(wide, 'a wide console window keeps the user list at the side');
    ok((await dupIds(Pl.p)).length === 0 && (await dupIds(H.p)).length === 0, 'MP: no duplicate ids on either seat');
    // 3 prefill: reload the pilot seat
    await Pl.p.reload(); await wait(2500);
    const pre = await Pl.p.evaluate(() => [document.getElementById('dklkname').value, document.getElementById('dklkcol').value, !document.getElementById('dklock').hidden]);
    ok(pre[0] === 'PILOTB' && pre[1] === '#ff8800' && pre[2], 'login pre-fills the last used callsign and colour ' + JSON.stringify(pre));
    ok(errs.length === 0, 'MP: no page errors ' + JSON.stringify(errs.slice(0, 4)));
    await H.ctx.close(); await Pl.ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED of ' + n : 'ALL PASS ' + n + '/' + n); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
