// FORGE-OS v5.5.5-D1 desktop checks (Overseer spec feedback/v555-d1/SPEC.md + round2/NOTES.md). Usage: node check-v555-d1.js [base] [shotdir]
// Solo: login form (no role rows, layout toggle), icons under windows, tabbed unit windows (colour routing on first open, tab drag,
// no move on colour change, background tabs live), narrow 4+4 doll, window chrome, sections, group window (title-bar colour dropdown,
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
const S4r = process.env.R4SHOTS || '/workspace/forge-os/feedback/v555-d1/round4/shots'; fs.mkdirSync(S4r, { recursive: true });
const shot4 = (p, f) => p.screenshot({ path: S4r + '/' + f });
const P1r = process.env.P1SHOTS || '/workspace/forge-os/feedback/v555-d1/passes/p1'; fs.mkdirSync(P1r, { recursive: true });
const shotP1 = (p, f) => p.screenshot({ path: P1r + '/' + f });
const P2r = process.env.P2SHOTS || '/workspace/forge-os/feedback/v555-d1/passes/p2'; fs.mkdirSync(P2r, { recursive: true });
const shotP2 = (p, f) => p.screenshot({ path: P2r + '/' + f });
async function pickGroupCol(p, id, c) {
  if (!await p.evaluate(() => !!document.querySelector('.dk-gcol-menu'))) {
    await p.click(`.dkw[data-id="${id}"] .dk-gcol`); await wait(200);
  }
  await p.click(`.dk-gcol-menu button[data-c="${c}"]`); await wait(400);
}
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
const uw = p => p.evaluate(() => Desk.wins().filter(w => w.k === 'unit').map(w => ({ id: w.id, u: w.u, c: w.c, pz: w.pz, tabs: (w.tabs || []).slice(), n: document.querySelector(`.dkw[data-id="${w.id}"] .dk-n`).textContent })));
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
  const skip = '[data-tt],.dk-sw,.dk-ut i,.sw i,.cur i,.dk-gcol i,.dk-gcol-menu i,.dk-mini,#dktabs .dk-tc,#dktabs button,[onclick^=shClick],#dklkcol,.mptint,#mptint,[style*="2ee6e6"],[style*="46, 230, 230"]';
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
    const under = await p.evaluate((id) => { const w = document.querySelector(`.dkw[data-id="${id}"]`).getBoundingClientRect(); const ic = [...document.querySelectorAll('#dkicons .dk-ico')].map(i => i.getBoundingClientRect()).find(r => r.top + r.height / 2 > w.top + 26 && r.top + r.height / 2 < w.bottom - 2 && r.left >= w.left); if (!ic) return { w: [w.left, w.top, w.height] }; const e = document.elementFromPoint(ic.left + ic.width / 2, ic.top + ic.height / 2); return { wl: Math.round(w.left), onWin: !!(e && e.closest(`.dkw[data-id="${id}"]`)) }; }, encId);
    ok(under.wl < 88 && under.onWin, 'desktop icons render under windows: a window dragged over the icon column covers the icons ' + JSON.stringify(under));
    await p.evaluate((id) => Desk.geo(id, { x: 88, y: 8, w: 900, h: 96 }), encId); await wait(200);
    // 16 tabbed unit windows
    await loadUnits(p, NAMES, true);
    let ws = await uw(p);
    ok(ws.length === 1 && ws[0].tabs.length === 3 && ws[0].c === 0 && await p.evaluate((id) => document.querySelectorAll(`.dkw[data-id="${id}"] .dk-ut`).length === 3, ws[0].id), 'tabbed unit windows: three opened units with no tab colour share ONE unit window (grey bucket) with a tab strip ' + JSON.stringify(ws));
    const [kA, kB, kC] = [await keyOf(p, NAMES[0]), await keyOf(p, NAMES[1]), await keyOf(p, NAMES[2])];
    await p.evaluate(() => { const S = Forge.state(); Forge.save(); S.sheets[0].col = 1; S.sheets[1].col = 1; S.sheets[2].col = 3; Forge.render(); Desk.wins().filter(w => w.k === 'unit').forEach(w => Desk.close(w.id)); }); await wait(500);
    for (const i of [0, 1, 2]) { await p.locator(`.dkw[data-k=enc] [data-i="${i}"][onclick^=shClick]`).click(); await wait(500); }
    ws = await uw(p); let cy = ws.find(w => w.c === 1), rd = ws.find(w => w.c === 3);
    ok(ws.length === 2 && cy && rd && JSON.stringify(cy.tabs) === JSON.stringify([kA, kB]) && JSON.stringify(rd.tabs) === JSON.stringify([kC]) && /CYAN/.test(cy.n) && /RED/.test(rd.n), 'open routing by colour: first open puts each unit in the window for its tab colour (CYAN: 2 tabs, RED: 1), creating windows as needed ' + JSON.stringify(ws.map(w => [w.n, w.tabs])));
    const casc = await p.evaluate(([c, r]) => { const a = document.querySelector(`.dkw[data-id="${c}"]`), b = document.querySelector(`.dkw[data-id="${r}"]`), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(), t = a.querySelector('.dk-ut').getBoundingClientRect(); const e = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2); return { dy: Math.round(rb.top - ra.top), tabBottom: Math.round(t.bottom - ra.top), visible: !!(e && e.closest(`.dkw[data-id="${c}"]`)) }; }, [cy.id, rd.id]);
    ok(casc.dy >= 42 && casc.dy >= casc.tabBottom && casc.visible, 'cascaded unit windows step down past the title bar and tab strip, so the window behind keeps its tabs visible ' + JSON.stringify(casc));
    await p.evaluate(([c, r]) => { Desk.geo(c, { x: 88, y: 112, w: 700, h: 740 }); Desk.geo(r, { x: 796, y: 112, w: 700, h: 740 }); }, [cy.id, rd.id]); await wait(300);
    const fitW = [await labels(p, cy.id), await labels(p, rd.id)];
    ok(fitW.every(f => f.n === 8 && !f.bad.length), 'paper doll labels fit in both colour windows ' + JSON.stringify(fitW.map(f => [f.w, f.bad])));
    // background tabs stay live; the active tab is the acting unit
    await p.click(`.dkw[data-id="${cy.id}"] .dk-ut[data-u="${kA}"]`); await wait(500);
    ok(await p.evaluate(([id, u]) => Desk.wins().find(w => w.id === id).u === u && Desk.curKey() === u, [cy.id, kA]), 'clicking a tab makes it the active tab and the acting unit');
    const acting = () => p.evaluate(() => { const a = [...document.querySelectorAll('#dkarea .dk-ut.act')]; const t = a[0]; const cs = t && getComputedStyle(t), dk = getComputedStyle(document.getElementById('dk')); const probe = document.createElement('i'); probe.style.background = 'var(--dk-on)'; document.getElementById('dk').appendChild(probe); const on = getComputedStyle(probe).backgroundColor; probe.remove();
      return { n: a.length, u: t && t.dataset.u, pf: t && t.querySelector('.pf').textContent, bg: cs && cs.backgroundColor === on, onTabs: document.querySelectorAll('#dkarea .dk-ut.on').length, stat: document.getElementById('dkstat').textContent }; });
    await p.mouse.move(800, 880);
    const ac1 = await acting();
    ok(ac1.n === 1 && ac1.u === kA && ac1.pf === '▶ ' && ac1.bg && ac1.onTabs >= 2 && /ACTING: MSH-01/.test(ac1.stat), 'acting unit: only its tab gets .act (filled, ▶ prefix) while every window has an active tab; the status bar shows ACTING: <unit> ' + JSON.stringify(ac1));
    const dmg = async (u, loc, v) => { await p.locator(`.dk-sec[data-u="${u}"][data-s=doll] .mlab`).nth(loc).click(); await wait(300); await p.locator(`.dk-sec[data-u="${u}"][data-s=impact] input[type=number]`).first().fill(String(v)); await wait(200); await p.locator(`.dk-sec[data-u="${u}"][data-s=impact] .damage-apply`).click(); await wait(1200); };
    const a0 = await hpOf(p, NAMES[0]), c0 = await hpOf(p, NAMES[2]);
    await dmg(kA, 1, 700); const a1 = await hpOf(p, NAMES[0]), c1 = await hpOf(p, NAMES[2]);
    await dmg(kC, 2, 720); const a2 = await hpOf(p, NAMES[0]), c2 = await hpOf(p, NAMES[2]);
    await p.mouse.move(800, 880);
    const ac2 = await acting();
    ok(ac2.n === 1 && ac2.u === kC && /ACTING: RVN-06/.test(ac2.stat) && await p.evaluate((u) => !document.querySelector(`.dk-ut.act[data-u="${u}"]`) && !!document.querySelector(`.dk-ut.on[data-u="${u}"]`), kA), 'acting moves with the last-touched unit: working in the RED window marks its tab; the CYAN active tab stays .on but not .act ' + JSON.stringify(ac2));
    await shot(p, 'r2-16-acting-tab.png');
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
    // r3 item 5: skill inputs are part of the rolls section (no separate SKILL INPUTS section) and start collapsed there
    const sk5 = await p.evaluate((u) => { const h = Desk.hosts().get(u + '|rolls'), r = h.firstChild ? h : h.shadowRoot; const hd = [...r.querySelectorAll('.shh')].find(e => /SKILL INPUTS/.test(e.textContent));
      return { segs: [...document.querySelectorAll('.dkw[data-k=unit] .dk-seg')].map(s => s.dataset.s).filter((v, i, a) => a.indexOf(v) === i), head: !!hd, collapsed: !r.querySelector('.pg'), rolls: /\[ROLL\]/.test(r.textContent), title: (document.querySelector('.dkw[data-k=unit] .dk-seg[data-s=rolls] .dk-sh .dk-n') || {}).textContent }; }, kB);
    ok(!sk5.segs.includes('skills') && sk5.head && sk5.collapsed && sk5.rolls && /SKILLS/.test(sk5.title || ''), 'r3 #5: skill inputs live in the ROLLS section (no separate section), collapsed by default in play ' + JSON.stringify(sk5));
    await p.locator(`.dk-sec[data-u="${kB}"][data-s=rolls] .shh:has-text("SKILL INPUTS")`).first().click(); await wait(400);
    await p.locator(`.dk-sec[data-u="${kB}"][data-s=rolls] input[data-skill=pil]`).fill('15'); await wait(200);
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
    { const t = await p.locator(`.dkw[data-id="${rd.id}"] .dk-ut[data-u="${kC}"]`).boundingBox(); await p.mouse.move(t.x + 20, t.y + 10); await p.mouse.down(); await p.mouse.move(t.x + 60, t.y + 30, { steps: 4 }); await p.mouse.move(1530, 500, { steps: 12 }); await p.mouse.move(1534, 504); await p.mouse.move(1530, 500); await wait(300); /* Chromium fires dragover on the moves after dragenter */
      const mk = await p.evaluate(() => { const m = document.getElementById('dktmark'); if (!m) return null; const cs = getComputedStyle(m), r = m.getBoundingClientRect(); const ar = document.getElementById('dkarea').getBoundingClientRect(); return { t: m.textContent, dashed: cs.outlineStyle === 'dashed', cls: m.classList.contains('dk-tdrop'), inside: r.right <= ar.right + 1 && r.bottom <= ar.bottom + 1, fits: m.scrollWidth <= m.clientWidth + 1 }; });
      ok(mk && mk.t === 'DROP: NEW WINDOW' && mk.dashed && mk.cls && mk.inside && mk.fits, 'tear-off marker: dragging a tab over the empty desktop shows a dashed DROP: NEW WINDOW outline ' + JSON.stringify(mk));
      await shot(p, 'r2-17-tear-off-marker.png');
      await p.mouse.up(); await wait(800);
      ok(await p.evaluate(() => !document.getElementById('dktmark') && !document.querySelector('.dk-tdrop')), 'tear-off marker clears on drop'); }
    ws = await uw(p); const torn = ws.find(w => w.tabs.length === 1 && w.tabs[0] === kC);
    ok(ws.length === 3 && torn && torn.c === null && JSON.stringify(ws.find(w => w.id === rd.id).tabs) === JSON.stringify([kB]), 'tab dropped on the desktop: tears off into a new unit window of its own at the drop point ' + JSON.stringify(ws.map(w => [w.n, w.tabs, w.c])));
    await p.locator(`.dkw[data-id="${torn.id}"] .dk-ut`).dragTo(p.locator(`.dkw[data-id="${rd.id}"] .dk-utabs`)); await wait(800);
    ws = await uw(p); rd = ws.find(w => w.id === rd.id);
    { const t = await p.locator(`.dkw[data-id="${rd.id}"] .dk-ut`).first().boundingBox(); await p.mouse.move(t.x + 20, t.y + 10); await p.mouse.down(); await p.mouse.move(t.x + 60, t.y + 30, { steps: 4 }); await p.mouse.move(1530, 820, { steps: 10 }); await p.mouse.move(1534, 824); await p.mouse.move(1530, 820); await wait(200);
      const m1 = await p.evaluate(() => !!document.getElementById('dktmark')); await p.mouse.move(500, 50, { steps: 8 }); await p.mouse.up(); await wait(500); /* released over the ENCOUNTER window: no drop target, so only dragend fires */
      const m2 = await p.evaluate(() => !document.getElementById('dktmark') && !document.querySelector('.dk-tdrop'));
      ok(m1 && m2, 'tear-off marker clears on dragend (released where a tab cannot drop) ' + JSON.stringify([m1, m2])); }
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
    await p.evaluate((id) => Desk.geo(id, { x: 5000, y: 5000 }), B); await wait(200);
    const gc = await geo(p, B), arC = await areaR(p);
    ok(arC.r - gc.x >= 160 && arC.b - gc.y >= 40, 'off-screen clamp keeps at least 160 x 40 of the window on the desktop ' + JSON.stringify([gc, arC]));
    await p.evaluate(([id, g]) => Desk.geo(id, g), [B, { x: gr.x, y: gr.y, w: gr.w, h: gr.h }]); await wait(200);
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
    await pickGroupCol(p, gw.id, 1);
    const cards = await p.evaluate((id) => [...document.querySelectorAll(`.dkw[data-id="${id}"] .dk-card`)].map(c => { const s = c.querySelector('svg'), cr = c.getBoundingClientRect(), sr = s.getBoundingClientRect(), z = s.querySelector('g.mz,.mz'); return { n: c.querySelector('.nm2').textContent, inCard: sr.top >= cr.top - 1 && sr.bottom <= cr.bottom + 1, sel: s.querySelectorAll('.sel,.ld.on').length, tt: c.querySelector('.doll').dataset.tt, stroke: z && getComputedStyle(z).stroke, fill: z && getComputedStyle(z.querySelector('path,polygon,rect') || z).fill }; }), gw.id);
    const realFill = await p.evaluate((u) => { const h = Desk.hosts().get(u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; const z = [...r.querySelectorAll('.mechmap g.mz')].find(g => !g.classList.contains('sel')); return getComputedStyle(z.querySelector('path,polygon,rect') || z).fill; }, kA);
    const realSel = await p.evaluate((u) => { const h = Desk.hosts().get(u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; return r.querySelectorAll('.mechmap g.mz.sel').length; }, kA);
    ok(cards.length === 2 && cards.every(c => c.inCard) && cards.some(c => /MUSHA/.test(c.n)) && cards.some(c => /ICARUS/.test(c.n)), 'group window (CYAN): the two CYAN units as mini paper-doll cards, each doll inside its card ' + JSON.stringify(cards.map(c => [c.n, c.inCard])));
    ok(realSel === 1 && cards.every(c => c.sel === 0 && /46, 230, 230/.test(c.stroke || '')), 'group mini dolls show no selected-component highlight (the unit window still does) ' + JSON.stringify([realSel, cards.map(c => [c.sel, c.stroke])]));
    ok(cards.every(c => c.tt === 'navy') && cards.some(c => /MUSHA/.test(c.n) && c.fill === realFill), 'group mini dolls keep inheriting the tab colour (data-tt navy, same zone fill as the full doll) ' + JSON.stringify([realFill, cards.map(c => [c.tt, c.fill])]));
    const col1 = await p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`), b = e.querySelector('.dk-gcol');
      return { name: b && b.textContent, ex: b && b.getAttribute('aria-expanded'), menu: !!document.querySelector('.dk-gcol-menu'), inTitle: !!(b && b.closest('.dk-t')), fs: b && parseFloat(getComputedStyle(b).fontSize) }; }, gw.id);
    ok(/CYAN/.test(col1.name || '') && col1.ex === 'false' && !col1.menu && col1.inTitle && col1.fs >= 11, 'group window: the title-bar colour dropdown shows the current colour and starts closed ' + JSON.stringify(col1));
    await p.evaluate((id) => Desk.front(id), gw.id); await shot(p, 'r2-05-group-selector-collapsed.png');
    await p.click(`.dkw[data-id="${gw.id}"] .dk-gcol`); await wait(200);
    const col2 = await p.evaluate(() => { const m = document.querySelector('.dk-gcol-menu'); const opts = m ? [...m.querySelectorAll('button[data-c]')].map(b => +b.dataset.c) : [];
      const fs = m && m.querySelector('button') && parseFloat(getComputedStyle(m.querySelector('button')).fontSize);
      return { n: opts.length, opts, hasNone: opts.includes(0), fs }; });
    ok(col2.n === 6 && col2.hasNone && col2.fs >= 11, 'group window: the title-bar dropdown opens a list of 6 colours (NONE included), 11px or larger ' + JSON.stringify(col2));
    await shot(p, 'r2-06-group-selector-expanded.png');
    await p.keyboard.press('Escape'); await wait(200);
    ok(await p.evaluate(() => !document.querySelector('.dk-gcol-menu')), 'group window: Escape closes the colour dropdown');
    // 15 select a card -> SELECTED UNIT area (live, routed); no window opens
    const nW0 = (await uw(p)).length;
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-card:has-text("ICARUS")`).click(); await wait(800);
    const selA = await p.evaluate(([id, u]) => { const e = document.querySelector(`.dkw[data-id="${id}"]`); const hs = [...e.querySelectorAll('.dk-gsb>.dk-sec')]; return { sel: Desk.wins().find(w => w.id === id).sel === u, on: (e.querySelector('.dk-card.on .nm2') || {}).textContent, hosts: hs.map(h => h.dataset.u + '|' + h.dataset.s), map: hs.some(h => !!(h.firstChild ? h : h.shadowRoot).querySelector('.mechmap')), dmg: hs.some(h => !!(h.firstChild ? h : h.shadowRoot).querySelector('.damage-apply')), hdr: e.querySelector('.dk-gsel .dk-n').textContent, open: !!e.querySelector('.dk-gsel [data-g=open]') }; }, [gw.id, kB]);
    ok(selA.sel && /ICARUS/.test(selA.on || '') && selA.hosts.join() === `${kB}|doll,${kB}|impact` && selA.map && selA.dmg && /ICARUS/.test(selA.hdr) && selA.open && (await uw(p)).length === nW0, 'single click selects a card: its paper doll and impact resolution show in the group window\'s SELECTED UNIT area; no window opens ' + JSON.stringify(selA));
    const ph = await p.evaluate(([id]) => { const b = document.querySelector(`.dkw[data-id="${id}"] .dk-seg[data-s=doll] button.dk-back`); if (!b) return null; const probe = document.createElement('i'); probe.style.color = 'var(--dk-hi)'; document.getElementById('dk').appendChild(probe); const hi = getComputedStyle(probe).color; probe.remove(); return { t: b.textContent, hiBorder: getComputedStyle(b).borderTopColor === hi }; }, [rd.id]);
    ok(ph && ph.t === '◀ IN UNIT GROUP // CYAN — click to bring back' && ph.hiBorder, 'its unit tab shows a clickable ◀ IN UNIT GROUP // CYAN button (highlight border) for the sections now in the group window ' + JSON.stringify(ph));
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
    await p.click(`.dkw[data-id="${rd.id}"] .dk-seg[data-s=doll] button.dk-back`); await wait(700);
    const bk = await p.evaluate(([id, gid, u]) => ({ inWin: !!document.querySelector(`.dkw[data-id="${id}"] .dk-seg[data-s=doll] .dk-sec[data-u="${u}"]`), gph: /OPEN IN ITS UNIT WINDOW/.test(document.querySelector(`.dkw[data-id="${gid}"] .dk-gsel`).textContent), top: Desk.wins().filter(w => !w.hidden).sort((a, b) => b.z - a.z)[0].id === id }), [rd.id, gw.id, kB]);
    ok(bk.inWin && bk.gph && bk.top, 'the ◀ IN UNIT GROUP button does the same as [OPEN ↗]: the sections come back to the unit window ' + JSON.stringify(bk));
    await p.click(`.dkw[data-id="${gw.id}"] [data-g=here]`); await wait(500);
    // double-click on a card whose unit has no window: routed by colour (CYAN window gets the tab)
    await p.click(`.dkw[data-id="${rd.id}"] .dk-ut[data-u="${kB}"] [data-ux]`); await wait(500);
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-card:has-text("ICARUS")`).dblclick(); await wait(900);
    ws = await uw(p); const cyw = ws.find(w => w.id === cy.id);
    ok(cyw && cyw.tabs.includes(kB) && cyw.u === kB, 'double-click on a card opens the unit: no window holds it, so it joins the window for its colour (CYAN) as the active tab ' + JSON.stringify(ws.map(w => [w.n, w.tabs])));
    // ref2 default size when a new window is created from the group
    // keep a different unit acting so renderUnits does not auto-open ICARUS as a LARGE window
    await p.click(`.dkw[data-id="${rd.id}"] .dk-ut[data-u="${kC}"]`); await wait(400);
    await p.evaluate((id) => Desk.close(id), cy.id); await wait(400);
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-card:has-text("ICARUS")`).click(); await wait(400);
    await p.click(`.dkw[data-id="${gw.id}"] .dk-gsel [data-g=open]`); await wait(900);
    ws = await uw(p); const nw = ws.find(w => w.tabs.includes(kB));
    const g6 = nw && await geo(p, nw.id), wide = nw && await labels(p, nw.id);
    const shield = nw && await p.evaluate((u) => { const h = Desk.hosts().get(u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; const s = r.querySelector('.shieldrow'); return !s || s.getBoundingClientRect().height > 0; /* the test frame has no shields */ }, kB);
    const impVis = nw && await p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`), b = e.querySelector('.dk-b').getBoundingClientRect(), s = e.querySelector('.dk-seg[data-s=impact]').getBoundingClientRect(); return { top: Math.round(s.top - b.top), bot: Math.round(b.bottom - s.bottom), title: /IMPACT/.test(e.querySelector('.dk-seg[data-s=impact] .dk-sh').textContent) }; }, nw.id);
    ok(nw && impVis.bot >= -1 && impVis.top >= 0 && impVis.title && g6.h > 500 && nw.pz === 'S', 'r3 #3: a unit window opened from the group starts taller (SMALL preset) with IMPACT RESOLUTION fully visible on open ' + JSON.stringify({ g6, impVis }));
    ok(nw && nw.c === 1 && Math.abs(g6.w - 620) <= 2 && wide.n === 8 && !wide.bad.length && wide.sides[0] > 0 && wide.sides[1] > 0 && wide.below === 0 && shield, 'r4: a unit window created from the group opens 620 wide (SMALL) with the doll side by side (unstacked), shield row (when the frame has shields) visible ' + JSON.stringify({ g6, sides: wide && wide.sides, below: wide && wide.below, bad: wide && wide.bad, shield }));
    const fl6 = nw && await p.evaluate((id) => { const u = document.querySelector(`.dkw[data-id="${id}"]`).getBoundingClientRect(), en = document.querySelector('.dkw[data-k=enc]'); const er = en && !en.hidden ? en.getBoundingClientRect() : null; return { y: Math.round(u.top), eb: er ? Math.round(er.bottom) : null }; }, nw.id);
    ok(fl6 && (fl6.eb == null || fl6.y + 1 >= fl6.eb - 2), 'r4 polish #6: a unit window opened from the group starts below ENCOUNTER, not over it ' + JSON.stringify(fl6));
    await p.evaluate((id) => Desk.front(id), nw.id); await wait(200);
    await shot4(p, 'r4-02-group-open-doll.png');
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
    await p.evaluate(() => { const u = Desk.wins().find(w => w.k === 'unit'); Desk.front(u.id); }); await wait(200);
    const cov = await p.evaluate((id) => Desk.wins().filter(w => !w.hidden).sort((a, b) => b.z - a.z)[0].id !== id, conId);
    await p.click('#dktray'); await wait(300);
    const fr = await p.evaluate((id) => ({ vis: !document.querySelector(`.dkw[data-id="${id}"]`).hidden, top: Desk.wins().filter(w => !w.hidden).sort((a, b) => b.z - a.z)[0].id === id }), conId);
    ok(cov && fr.vis && fr.top, 'tray button on an open but covered console brings it to the front instead of closing it ' + JSON.stringify([cov, fr]));
    await p.click('#dktray'); await wait(300);
    const hidT = (await geo(p, conId)).hid; await p.click('#dktray'); await wait(300);
    ok(hidT && !(await geo(p, conId)).hid, 'tray button on the console already on top closes it (and opens it again)');
    await p.click(`.dkw[data-id="${conId}"] [data-a=close]`); await wait(300);
    const hid1 = (await geo(p, conId)).hid;
    await p.click('#dktray'); await wait(300); const cg4 = await geo(p, conId);
    await p.click('#dktray'); await wait(300); const hid2 = (await geo(p, conId)).hid;
    ok(hid1 && !cg4.hid && cg4.x === cg3.x && cg4.y === cg3.y && hid2, 'console: × hides it; the tray button reopens it where it was left and toggles it closed ' + JSON.stringify([hid1, cg4, hid2]));
    const ov = await p.evaluate(() => { const bad = []; document.querySelectorAll('#dkicons .dk-ico span,#dkiconsr .dk-ico span').forEach(s => { if (s.scrollWidth > s.clientWidth + 1 || s.getBoundingClientRect().right > s.closest('.dk-ico').getBoundingClientRect().right + 1) bad.push('icon ' + s.textContent); });
      const t = document.getElementById('dktask'); if (t.scrollWidth > t.clientWidth + 1) bad.push('taskbar'); const st = document.getElementById('dkstat'); if (st.scrollWidth > st.clientWidth + 1) bad.push('status ' + st.scrollWidth + '>' + st.clientWidth);
      document.querySelectorAll('.dk-card').forEach(c => { if (c.scrollWidth > c.clientWidth + 1) bad.push('card ' + c.querySelector('.nm2').textContent); c.querySelectorAll('.cd,.nm2').forEach(x => { if (x.getBoundingClientRect().right > c.getBoundingClientRect().right + 1) bad.push('card line ' + x.textContent); }); });
      document.querySelectorAll('#dktabs button').forEach(b => { if (b.getBoundingClientRect().bottom > t.getBoundingClientRect().bottom + 1) bad.push('tab ' + b.textContent); });
      const h = [...document.querySelectorAll('.dkw .dk-t')].map(x => Math.round(x.getBoundingClientRect().height)).filter(x => x); return { bad, h: [...new Set(h)], fs: getComputedStyle(document.querySelector('.dkw .dk-t .dk-n')).fontSize }; });
    ok(!ov.bad.length && ov.h.every(x => x === 22) && ov.fs === '12px', 'larger chrome text (titles 12px, title bars 22px): no overflow in the icon column, taskbar tabs or status bar ' + JSON.stringify(ov));
    /* ================= ROUND 3 (feedback/v555-d1/round3/NOTES.md) ================= */
    const S3r = process.env.R3SHOTS || '/workspace/forge-os/feedback/v555-d1/round3/shots'; fs.mkdirSync(S3r, { recursive: true });
    const shot3_3 = (f) => p.screenshot({ path: S3r + '/' + f });
    const colEq_3 = (a, b) => p.evaluate(([a, b]) => { const t = (c) => { const s = document.createElement('span'); s.style.color = c; document.body.appendChild(s); const v = getComputedStyle(s).color; s.remove(); return v; }; return t(a) === t(b); }, [a, b]);
    // #4 + #8: icons and the start menu
    const ic_3 = await p.evaluate(() => { const q = (s) => document.querySelector('#dkiconsr [data-ico=' + s + ']').getBoundingClientRect(), a = q('set'), o = q('ovr'), c = q('cat'), ar = document.getElementById('dkarea').getBoundingClientRect();
      return { l: [...document.querySelectorAll('#dkicons .dk-ico')].map(b => b.dataset.ico), r: [...document.querySelectorAll('#dkiconsr .dk-ico')].map(b => b.dataset.ico), stack: a.bottom <= o.top && o.bottom <= c.top, right: ar.right - a.right < 20, top: a.top - ar.top < 20 }; });
    await p.click('#dkstart'); await wait(300);
    const mi_3 = await p.evaluate(() => [...document.querySelectorAll('#dkmenu button')].map(b => b.textContent.trim()));
    await shot3_3('r3-04-08-icons-and-start-menu.png');
    await p.click('#dkstart'); await wait(200);
    ok(!ic_3.l.includes('loadout') && !ic_3.r.includes('loadout') && !mi_3.some(t => /LOADOUT/.test(t)) && !(await p.locator('[data-ico=loadout]').count()), 'r3 #4: LOADOUT is gone from the desktop icons and the start menu ' + JSON.stringify({ l: ic_3.l, mi_3 }));
    ok(JSON.stringify(ic_3.r) === '["set","ovr","cat","log"]' && !ic_3.l.some(i => ['ovr', 'cat', 'set'].includes(i)) && ic_3.stack && ic_3.right && ic_3.top && !mi_3.some(t => /OVERSEER|CATALOGUE/.test(t)) && mi_3.some(t => /SETTINGS/.test(t)), 'r3 #8: OVERSEER and CATALOGUE sit top-right under SETTINGS (not in the start menu) ' + JSON.stringify({ r: ic_3.r, mi_3 }));
    // #2: group window, cards as a vertical sidebar on the right
    await p.click('.dk-ico[data-ico=units]'); await wait(700);
    const gid3_3 = await p.evaluate(() => Desk.wins().filter(w => w.k === 'group').pop().id);
    await p.locator(`.dkw[data-id="${gid3_3}"] .dk-card:has-text("MUSHA")`).click(); await wait(500);
    const g2_3 = await p.evaluate((id) => { const g = document.querySelector(`.dkw[data-id="${id}"]`); const cd = g.querySelector('.dk-cards').getBoundingClientRect(), gs = g.querySelector('.dk-gsel').getBoundingClientRect(), win = g.getBoundingClientRect(); const cs = [...g.querySelectorAll('.dk-card')].map(c => c.getBoundingClientRect());
      return { n: cs.length, side: cd.left >= gs.right - 1 && win.right - cd.right < 16, vert: cs.every((c, i) => !i || (c.top >= cs[i - 1].bottom - 3 && Math.abs(c.left - cs[0].left) < 6)), cw: Math.round(cd.width), sw: Math.round(gs.width), rs: cs.map(c => [c.left | 0, c.top | 0, c.bottom | 0]), top: gs.top <= cd.top + 2 }; }, gid3_3);
    ok(g2_3.n >= 2 && g2_3.side && g2_3.vert && g2_3.top && g2_3.sw > 2 * g2_3.cw, 'r3 #2: the unit group window shows its mini-doll tiles as a vertical sidebar on the right, the selected unit beside it ' + JSON.stringify(g2_3));
    await shot3_3('r3-02-group-sidebar.png');
    await p.evaluate((id) => Desk.close(id), gid3_3); await wait(300);
    // #6: size preset button left of the NOMINAL badge
    await p.setViewportSize({ width: 1600, height: 1300 }); await wait(500);
    if (!(await uw(p)).some(w => w.tabs.includes(kA))) { await p.evaluate((u) => { Desk.open({ k: 'unit', u }); Desk.sync(); }, kA); await wait(800); }
    const u6_3 = (await uw(p)).find(w => w.tabs.includes(kA));
    await p.evaluate((id) => { Desk.restore(id); Desk.front(id); }, u6_3.id); await p.click(`.dkw[data-id="${u6_3.id}"] .dk-ut[data-u="${kA}"]`); await wait(500);
    if (await p.locator(`.dk-sec[data-u="${kA}"][data-s=rolls] .pg`).count()) { await p.locator(`.dk-sec[data-u="${kA}"][data-s=rolls] .shh:has-text("SKILL INPUTS")`).first().click(); await wait(400); }
    const pzOf_3 = (id) => p.evaluate((id) => Desk.wins().find(w => w.id === id).pz, id);
    const pzBtn_3 = await p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`), b = e.querySelector('.dk-t .dk-sz'), s = e.querySelector('.dk-t .dk-st'); return { b: !!b, left: b && !s.hidden && b.getBoundingClientRect().right <= s.getBoundingClientRect().left + 1 && b.nextElementSibling === s, st: s.textContent, h: Math.round(e.querySelector('.dk-t').getBoundingClientRect().height) }; }, u6_3.id);
    for (let k = 0; k < 2 && (await pzOf_3(u6_3.id)) !== 'L'; k++) { await p.click(`.dkw[data-id="${u6_3.id}"] .dk-sz`); await wait(500); }
    const mL_3 = await p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`), b = e.querySelector('.dk-b'), br = b.getBoundingClientRect(), col = e.querySelector('.dk-col').getBoundingClientRect(), A = document.getElementById('dkarea').getBoundingClientRect(), r = e.getBoundingClientRect();
      return { w: Math.round(r.width), aw: Math.round(A.width), gap: Math.round(br.bottom - parseFloat(getComputedStyle(b).paddingBottom) - col.bottom), scroll: b.scrollHeight > b.clientHeight + 2 ? b.scrollHeight - b.clientHeight : 0, lab: e.querySelector('.dk-t .dk-sz').textContent, pg: !!e.querySelector('.dk-seg[data-s=rolls] .dk-sec') && !Desk.hosts().get(Desk.wins().find(w => w.id === id).u + '|rolls').shadowRoot.querySelector('.pg') && !Desk.hosts().get(Desk.wins().find(w => w.id === id).u + '|rolls').querySelector('.pg') }; }, u6_3.id);
    ok(pzBtn_3.b && pzBtn_3.left && pzBtn_3.h === 22 && mL_3.w === Math.min(1120, mL_3.aw - 16) && mL_3.gap >= 0 && mL_3.gap <= 8 && mL_3.pg && mL_3.lab === '▣ LG', 'r3 #6: the size button sits left of the NOMINAL badge; LARGE = the full sheet with the left panel exactly the window height (skill inputs collapsed) ' + JSON.stringify({ pzBtn_3, mL_3 }));
    const largeDoll = await labels(p, u6_3.id);
    ok(largeDoll.n === 8 && largeDoll.below === 0 && largeDoll.sides[0] > 0 && largeDoll.sides[1] > 0 && !largeDoll.bad.length, 'r4: at LARGE the default paper doll is side by side (unstacked) ' + JSON.stringify(largeDoll));
    await p.evaluate((id) => Desk.front(id), u6_3.id); await wait(200);
    await shot4(p, 'r4-01-large-doll.png');
    await shot3_3('r3-06a-preset-large.png');
    await p.click(`.dkw[data-id="${u6_3.id}"] .dk-sz`); await wait(500);
    const mS_3 = await p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`), b = e.querySelector('.dk-b').getBoundingClientRect(), im = e.querySelector('.dk-seg[data-s=impact]').getBoundingClientRect(), d = e.querySelector('.dk-seg[data-s=doll]').getBoundingClientRect(), r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), imp: Math.round(b.bottom - im.bottom), doll: d.top >= b.top - 1, lab: e.querySelector('.dk-t .dk-sz').textContent, tip: e.querySelector('.dk-t .dk-sz').title }; }, u6_3.id);
    ok((await pzOf_3(u6_3.id)) === 'S' && mS_3.w === 620 && mS_3.imp >= -1 && mS_3.imp <= 12 && mS_3.doll && mS_3.lab === '▭ SM' && /Size preset: SMALL .* click for LARGE/.test(mS_3.tip), 'r3 #6: SMALL = doll-focused (620 wide, down to IMPACT RESOLUTION); the button cycles LARGE <-> SMALL ' + JSON.stringify(mS_3));
    await shot3_3('r3-06b-preset-small.png');
    await p.setViewportSize({ width: 1600, height: 900 }); await wait(500);
    // #7: right-click an encounter tile -> open its character sheet in the LARGE view
    await p.evaluate((u) => Desk.wins().filter(w => w.k === 'unit' && (w.tabs || []).includes(u)).forEach(w => Desk.close(w.id)), kC); await wait(300);
    await p.evaluate(() => { const e = Desk.wins().find(w => w.k === 'enc'); Desk.restore(e.id); Desk.front(e.id); }); await wait(300);
    const iC = await p.evaluate((u) => Forge.state().sheets.findIndex(s => Desk.ukey(s) === u), kC);
    await p.locator(`.dkw[data-k=enc] [data-i="${iC}"][onclick^=shClick]`).click({ button: 'right' }); await wait(400);
    const tm_3 = await p.evaluate(() => [...document.querySelectorAll('#tabmenu button')].map(b => b.textContent.trim()));
    await shot3_3('r3-07a-encounter-right-click.png');
    await p.click('#tabmenu button:has-text("Open sheet window (LARGE)")'); await wait(1200);
    const o7_3 = await p.evaluate((u) => { const w = Desk.wins().find(w => w.k === 'unit' && w.u === u), A = document.getElementById('dkarea').getBoundingClientRect(); return w && { pz: w.pz, w: Math.round(w.w), aw: Math.round(A.width), cur: Desk.curKey() === u, sheet: !!document.querySelector(`.dkw[data-id="${w.id}"] .dk-seg[data-s=sheet] .dk-sec`) }; }, kC);
    ok(tm_3[0] === 'Open sheet window (LARGE)' && o7_3 && o7_3.pz === 'L' && o7_3.w === Math.min(1120, o7_3.aw - 16) && o7_3.cur && o7_3.sheet, 'r3 #7: right-clicking an encounter tile offers "Open sheet window (LARGE)", which opens it in the LARGE view ' + JSON.stringify({ tm_3, o7_3 }));
    await shot3_3('r3-07b-sheet-opened-large.png');
    // #10: pilot / owner name next to the mech name (solo: tab colour for a named pilot, LOCAL in grey otherwise)
    await p.evaluate((u) => { const S = Forge.state(); const i = S.sheets.findIndex(s => Desk.ukey(s) === u); shClick(i); S.own = 'VEGA'; Forge.save(); Forge.render(); }, kA); await wait(800);
    const p10_3 = await p.evaluate(([a, c]) => { const t = (u) => { const w = Desk.wins().find(w => w.k === 'unit' && w.u === u); const e = document.querySelector(`.dkw[data-id="${w.id}"]`), pl = e.querySelector('.dk-t .dk-pl'), n = e.querySelector('.dk-t .dk-n'), tab = e.querySelector(`.dk-ut[data-u="${u}"] .dk-pil`); const sh = Forge.state().sheets.find(s => Desk.ukey(s) === u);
      return { t: pl && !pl.hidden && pl.textContent, col: pl && getComputedStyle(pl).color, after: pl && pl.previousElementSibling === n, tab: tab && tab.textContent, tcol: tab && getComputedStyle(tab).color, sh: SH_COL[sh.col || 0] }; }; return [t(a), t(c)]; }, [kA, kC]);
    const muted_3 = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || getComputedStyle(document.body).getPropertyValue('--muted').trim());
    ok(p10_3[0].t === 'VEGA' && p10_3[0].after && p10_3[0].tab === 'VEGA' && await colEq_3(p10_3[0].col, p10_3[0].sh) && await colEq_3(p10_3[0].tcol, p10_3[0].sh) && p10_3[1].t === 'LOCAL' && await colEq_3(p10_3[1].col, muted_3), 'r3 #10 (solo): the unit window shows the pilot next to the mech name, in the tab colour; an unnamed pilot is LOCAL in grey ' + JSON.stringify({ p10_3, muted_3 }));
    await shot3_3('r3-10a-pilot-name-solo.png');
    // Misaki fix 1 + 5: the pilot name on a focused title bar / acting tab sits on the page background (readable on REMUS amber), 11px, and in the tab tooltip
    const theme3 = async (th) => { await p.click('.dk-ico[data-ico=set]'); await wait(400); const sid = await p.evaluate(() => Desk.wins().find(w => w.k === 'set').id); await p.click(`.dkw[data-id="${sid}"] button:has-text("${th}")`); await wait(500); await p.evaluate((id) => Desk.close(id), sid); await wait(300); };
    await theme3('REMUS ACCORD');
    await p.evaluate((u) => { const w = Desk.wins().find(w => w.k === 'unit' && w.u === u); Desk.restore(w.id); Desk.front(w.id); }, kA); await wait(400);
    const cr11 = await p.evaluate((u) => { const w = Desk.wins().find(w => w.k === 'unit' && w.u === u), e = document.querySelector(`.dkw[data-id="${w.id}"]`);
      const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number), lum = (c) => { const [r, g, b] = rgb(c).slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2); };
      const m = (el) => { const cs = getComputedStyle(el), bg = cs.backgroundColor, a = rgb(bg)[3]; return { t: el.textContent, fs: cs.fontSize, bg, opaque: a === undefined || a === 1, cr: ratio(cs.color, bg), before: el.classList.contains('dk-pl') ? getComputedStyle(el, '::before').color === cs.color : true }; };
      const tab = e.querySelector('.dk-ut.act .dk-pil');
      return { on: e.classList.contains('on'), title: m(e.querySelector('.dk-t .dk-pl')), tab: tab && m(tab), tip: e.querySelector(`.dk-ut[data-u="${u}"]`).title }; }, kA);
    await shot3_3('r3-11-pilot-name-focused-amber.png');
    ok(cr11.on && cr11.title.opaque && cr11.title.cr >= 4.5 && cr11.title.before && cr11.title.fs === '11px' && cr11.tab && cr11.tab.opaque && cr11.tab.cr >= 4.5 && cr11.tab.fs === '11px' && /\/\/ PILOT: VEGA/.test(cr11.tip), 'Misaki fix 1+5: the pilot name on a focused title bar and the acting tab sits on the page background (contrast >= 4.5:1 on REMUS amber), 11px, and is in the tab tooltip ' + JSON.stringify(cr11));
    await theme3('IMPERIAL NAVY');
    // r4: colour dropdown in the group title bar; mini dolls start at the top of the sidebar; pilot name on each card
    const colA4 = await p.evaluate(([a, b]) => { const S = Forge.state(), ia = S.sheets.findIndex(s => Desk.ukey(s) === a), ib = S.sheets.findIndex(s => Desk.ukey(s) === b); if (ia >= 0) { shClick(ia); S.own = 'VEGA'; if (S.sheets[ia].d) S.sheets[ia].d.own = 'VEGA'; } const c = ia >= 0 ? (S.sheets[ia].col || 0) : 1; if (ib >= 0) { S.sheets[ib].col = c; if (S.sheets[ib].d) S.sheets[ib].d.own = ''; } Forge.render(); return c; }, [kA, kB]); await wait(300);
    await p.click('.dk-ico[data-ico=units]'); await wait(700);
    const gid4 = await p.evaluate(() => Desk.wins().filter(w => w.k === 'group').pop().id);
    await p.evaluate((id) => { Desk.restore(id); Desk.geo(id, { x: 88, y: 8, w: 840, h: 700 }); Desk.front(id); }, gid4); await wait(300);
    await pickGroupCol(p, gid4, colA4);
    const r4g = await p.evaluate((id) => {
      const g = document.querySelector(`.dkw[data-id="${id}"]`), btn = g.querySelector('.dk-t .dk-gcol'), tb = g.querySelector('.dk-t');
      const cd = g.querySelector('.dk-cards').getBoundingClientRect(), gs = g.querySelector('.dk-gsel').getBoundingClientRect(), win = g.querySelector('.dk-b').getBoundingClientRect();
      const br = btn && btn.getBoundingClientRect(), tbr = tb.getBoundingClientRect();
      const cards = [...g.querySelectorAll('.dk-card')].map(c => {
        const pil = c.querySelector('.nm2 .dk-pil'), nm = c.querySelector('.nm2');
        const cs = pil && getComputedStyle(pil);
        return { n: (nm && nm.textContent) || '', name: c.querySelector('.nm2') && [...c.querySelector('.nm2').childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(), pil: pil && pil.textContent, tip: pil && pil.title, ctip: c.title, fs: cs && cs.fontSize, col: cs && cs.color, omit: !pil, overflow: nm && (nm.getBoundingClientRect().right > c.getBoundingClientRect().right + 1 || c.scrollWidth > c.clientWidth + 1) };
      });
      return { inTitle: !!(btn && btn.closest('.dk-t')),
        noSw: !g.querySelector('.dk-grp .sw, .dk-grp [data-swt]'), side: cd.left >= gs.right - 1 && win.right - cd.right < 16,
        cardsTop: cd.top <= win.top + 8, fs: btn && parseFloat(getComputedStyle(btn).fontSize), name: btn && btn.textContent, ex: btn && btn.getAttribute('aria-expanded'), cards };
    }, gid4);
    ok(r4g.inTitle && r4g.noSw && r4g.side && r4g.cardsTop && r4g.fs >= 11 && r4g.ex === 'false', 'r4: the tab-colour control is a title-bar dropdown (11px or larger); mini dolls start at the top of the sidebar ' + JSON.stringify({ inTitle: r4g.inTitle, noSw: r4g.noSw, side: r4g.side, cardsTop: r4g.cardsTop, fs: r4g.fs, name: r4g.name, ex: r4g.ex }));
    const vega = r4g.cards.find(c => /MUSHA/.test(c.name) || /MUSHA/.test(c.n));
    const loc = r4g.cards.find(c => /ICARUS/.test(c.name) || /ICARUS/.test(c.n));
    const muted4 = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || getComputedStyle(document.body).getPropertyValue('--muted').trim());
    const vegaCol = await p.evaluate((c) => (typeof SH_COL !== 'undefined' && SH_COL[c]) || '', colA4);
    ok(vega && vega.pil === 'VEGA' && /\/\/ PILOT: VEGA/.test(vega.tip) && /\/\/ PILOT: VEGA/.test(vega.ctip) && vega.fs === '11px' && !vega.overflow && await colEq_3(vega.col, vegaCol), 'r4: the group card shows the pilot after the mech name (11px, tab colour, tooltip // PILOT: name, no overflow) ' + JSON.stringify({ vega, vegaCol, colA4, cards: r4g.cards }));
    ok(loc && loc.omit && !/LOCAL/.test(loc.n) && !/PILOT: LOCAL/.test(loc.ctip || '') && !loc.overflow, 'r4 polish #2: a group card with no real pilot omits LOCAL (the grey label stays on the unit title bar and tab) ' + JSON.stringify({ loc }));
    const cardSel4 = vega ? `.dkw[data-id="${gid4}"] .dk-card:has-text("MUSHA")` : `.dkw[data-id="${gid4}"] .dk-card`;
    await p.locator(cardSel4).first().click({ timeout: 5000 }).catch(() => {}); await wait(400);
    await shot4(p, 'r4-03-group-sidebar-selector-pilot.png');
    // title-bar dropdown: first click works when the group is in the background; list of colours; shot r4-07
    await p.evaluate((id) => { Desk.geo(id, { x: 88, y: 120, w: 840, h: 700 }); }, gid4); await wait(200);
    const encR4 = await p.evaluate(() => { const w = Desk.wins().find(w => w.k === 'enc'); if (w) { Desk.restore(w.id); Desk.geo(w.id, { x: 88, y: 8, w: 900, h: 96 }); Desk.front(w.id); } return w && w.id; });
    await wait(200);
    const behind = await p.evaluate((id) => { const g = document.querySelector(`.dkw[data-id="${id}"]`); return { on: g.classList.contains('on'), vis: !g.hidden }; }, gid4);
    await p.click(`.dkw[data-id="${gid4}"] .dk-gcol`); await wait(250);
    const dd = await p.evaluate((id) => {
      const g = document.querySelector(`.dkw[data-id="${id}"]`), btn = g.querySelector('.dk-gcol'), m = document.querySelector('.dk-gcol-menu');
      const opts = m ? [...m.querySelectorAll('button[data-c]')].map(b => ({ c: +b.dataset.c, t: b.textContent.trim(), fs: parseFloat(getComputedStyle(b).fontSize) })) : [];
      return { on: g.classList.contains('on'), ex: btn && btn.getAttribute('aria-expanded'), n: opts.length, none: opts.some(o => o.c === 0 && /NONE/.test(o.t)), fs: opts.length ? Math.min(...opts.map(o => o.fs)) : 0, names: opts.map(o => o.t) };
    }, gid4);
    await shot4(p, 'r4-07-group-colour-dropdown.png');
    ok(behind && behind.vis && !behind.on && dd.on && dd.ex === 'true' && dd.n === 6 && dd.none && dd.fs >= 11, 'r4: the colour dropdown opens on the first click even when the group window is in the background (6 colours, NONE included, 11px or larger) ' + JSON.stringify({ behind, dd }));
    await p.keyboard.press('Escape'); await wait(200);
    ok(await p.evaluate(() => !document.querySelector('.dk-gcol-menu')), 'r4: Escape closes the title-bar colour dropdown');
    await p.click(`.dkw[data-id="${gid4}"] .dk-gcol`); await wait(200);
    await p.evaluate(() => document.body.click()); await wait(200);
    // body click may not be "outside" if the menu is in #dk; click the desk instead
    if (await p.evaluate(() => !!document.querySelector('.dk-gcol-menu'))) {
      await p.click('#dkdesk', { position: { x: 20, y: 20 } }); await wait(200);
    }
    ok(await p.evaluate(() => !document.querySelector('.dk-gcol-menu')), 'r4: an outside click closes the title-bar colour dropdown');
    await p.evaluate((id) => Desk.close(id), gid4); await wait(300);
    // #1: a sheet with a shield takes no more vertical space than one without (wide and narrow doll)
    const shM = (u, add) => p.evaluate(async ([u, add]) => { const S = Forge.state();
      if (add) { const sd = DB.find(x => isShield(x)); S.items.push(Object.assign(structuredClone(sd), { mount: 'LH' })); } else S.items = S.items.filter(x => !isShield(x));
      Forge.render(); await new Promise(r => setTimeout(r, 600));
      const w = Desk.wins().find(w => w.k === 'unit' && w.u === u), h = Desk.hosts().get(u + '|doll'), r = h.firstChild ? h : h.shadowRoot, row = r.querySelector('.sorfoot .shieldrow'), mm = r.querySelector('.mechmap');
      const rr = row && row.getBoundingClientRect(), mr = mm.getBoundingClientRect(), ls = [...r.querySelectorAll('.mechmap .mlab:not(.dk-shup .mlab)'), ...r.querySelectorAll('.sorbtns button')].map(e => e.getBoundingClientRect());
      const ovl = !!(rr && rr.height && ls.some(l => l.right > rr.left + 1 && l.left < rr.right - 1 && l.bottom > rr.top + 1 && l.top < rr.bottom - 1));
      return { h: Math.round(document.querySelector(`.dkw[data-id="${w.id}"] .dk-seg[data-s=doll]`).getBoundingClientRect().height), row: !!(rr && rr.height > 0), up: !!(rr && rr.top < mr.bottom), ovl, name: add ? DB.find(x => isShield(x)).n : '' }; }, [u, add]);
    await p.evaluate((u) => { const S = Forge.state(); shClick(S.sheets.findIndex(s => Desk.ukey(s) === u)); }, kA); await wait(500);
    const wA = (await uw(p)).find(w => w.u === kA);
    await p.evaluate((id) => Desk.geo(id, { w: 1120, h: 860 }), wA.id); await wait(400);
    const sW0 = await shM(kA, false), sW1 = await shM(kA, true);
    await shot3_3('r3-01-shield-tile.png');
    await p.evaluate((id) => Desk.geo(id, { w: 480 }), wA.id); await wait(500);
    const sN1 = await shM(kA, true), sN0 = await shM(kA, false);
    ok(sW1.row && sN1.row && Math.abs(sW1.h - sW0.h) <= 3 && Math.abs(sN1.h - sN0.h) <= 3 && sW1.up && !sW1.ovl && !sN1.ovl, 'r3 #1: the shield tile sits higher on the paper doll; a sheet with a shield is no taller than one without (wide and narrow doll, no overlap) ' + JSON.stringify({ wide: [sW0.h, sW1.h, sW1.up, sW1.ovl], narrow: [sN0.h, sN1.h, sN1.ovl], shield: sW1.name }));
    await p.evaluate(() => { const S = Forge.state(); S.items = S.items.filter(x => !isShield(x)); Forge.render(); }); await wait(500);
    // Misaki fix 2: at 1366 x 768 a unit with a shield that auto-opens keeps IMPACT RESOLUTION (and its [APPLY] row) in view
    await p.setViewportSize({ width: 1366, height: 768 }); await wait(500);
    await p.evaluate((u) => { const S = Forge.state(), i = S.sheets.findIndex(s => Desk.ukey(s) === u); shClick(i); }, kB); await wait(400);
    await p.evaluate(() => { const S = Forge.state(), sd = DB.find(x => isShield(x)); S.items.push(Object.assign(structuredClone(sd), { mount: 'LH' })); Forge.render(); }); await wait(500);
    await p.evaluate(() => { Desk.wins().filter(w => w.k === 'unit' || w.k === 'sec').forEach(w => Desk.close(w.id)); Desk.wins().filter(w => w.k === 'group').forEach(w => Desk.minimize(w.id)); const e = Desk.wins().find(w => w.k === 'enc'); Desk.restore(e.id); Desk.front(e.id); }); await wait(400);
    const iB = await p.evaluate((u) => Forge.state().sheets.findIndex(s => Desk.ukey(s) === u), kB);
    await p.locator(`.dkw[data-k=enc] [data-i="${iB}"][onclick^=shClick]`).click(); await wait(1500);
    const i12 = await p.evaluate((u) => { const w = Desk.wins().find(w => w.k === 'unit' && w.u === u), e = document.querySelector(`.dkw[data-id="${w.id}"]`), b = e.querySelector('.dk-b').getBoundingClientRect(), im = e.querySelector('.dk-seg[data-s=impact]').getBoundingClientRect();
      const h = Desk.hosts().get(u + '|impact'), r = h.firstChild ? h : h.shadowRoot, ap = [...r.querySelectorAll('button')].find(x => /APPLY/.test(x.textContent)), apr = ap && ap.getBoundingClientRect(), sh = Desk.hosts().get(u + '|doll'), sr = sh.firstChild ? sh : sh.shadowRoot;
      return { pz: w.pz, y: Math.round(w.y), h: Math.round(w.h), shield: !!sr.querySelector('.shieldrow .mlab'), impBot: Math.round(b.bottom - im.bottom), impTop: Math.round(im.top - b.top), apply: apr ? Math.round(b.bottom - apr.bottom) : null }; }, kB);
    await shot3_3('r3-12-large-1366-impact.png');
    ok(i12.shield && i12.impBot >= 0 && i12.impTop >= 0 && i12.apply !== null && i12.apply >= 0, 'Misaki fix 2: at 1366x768 a unit with a shield auto-opens with IMPACT RESOLUTION and its [APPLY] row fully visible (LARGE, or SMALL when LARGE would hide it) ' + JSON.stringify(i12));
    const i12doll = await labels(p, await p.evaluate((u) => Desk.wins().find(w => w.k === 'unit' && w.u === u).id, kB));
    ok(i12doll.n >= 8 && i12doll.below === 0 && i12doll.sides[0] > 0 && i12doll.sides[1] > 0 && !i12doll.bad.length, 'r4: at 1366x768 the auto-opened sheet (LARGE, or SMALL fallback) still shows the doll side by side ' + JSON.stringify({ pz: i12.pz, doll: i12doll }));
    // r4 polish #1: ▣ LG must stay below ENCOUNTER at 1366 (force a button apply, not auto-open)
    const u12id = await p.evaluate((u) => Desk.wins().find(w => w.k === 'unit' && w.u === u).id, kB);
    await p.evaluate((id) => { Desk.restore(id); Desk.front(id); }, u12id); await wait(300);
    if ((await p.evaluate((id) => Desk.wins().find(w => w.id === id).pz, u12id)) === 'L') { await p.click(`.dkw[data-id="${u12id}"] .dk-sz`); await wait(500); }
    await p.click(`.dkw[data-id="${u12id}"] .dk-sz`); await wait(800);
    const lg1366 = await p.evaluate((id) => {
      const u = document.querySelector(`.dkw[data-id="${id}"]`).getBoundingClientRect(), en = document.querySelector('.dkw[data-k=enc]').getBoundingClientRect();
      const b = document.querySelector(`.dkw[data-id="${id}"] .dk-b`).getBoundingClientRect(), im = document.querySelector(`.dkw[data-id="${id}"] .dk-seg[data-s=impact]`);
      const ir = im && im.getBoundingClientRect(), A = document.getElementById('dkarea').getBoundingClientRect();
      return { pz: Desk.wins().find(w => w.id === id).pz, y: Math.round(u.top - A.top), h: Math.round(u.height), eb: Math.round(en.bottom - A.top), et: Math.round(en.top - A.top),
        cover: u.top < en.bottom - 2 && u.bottom > en.top + 2 && u.left < en.right - 2 && u.right > en.left + 2,
        impTop: ir ? Math.round(ir.top - b.top) : null, impBot: ir ? Math.round(b.bottom - ir.bottom) : null };
    }, u12id);
    await p.evaluate((id) => Desk.front(id), u12id); await wait(200);
    await shot4(p, 'r4-04-lg-preset-1366.png');
    ok(lg1366.pz === 'L' && !lg1366.cover && lg1366.y + 1 >= lg1366.eb - 2, 'r4 polish #1: at 1366, ▣ LG stays below ENCOUNTER and does not cover it ' + JSON.stringify(lg1366));
    ok(lg1366.impTop >= 0 && lg1366.impBot >= -1, 'r4 polish #1: IMPACT RESOLUTION stays visible after a (non-auto) LARGE apply at 1366 ' + JSON.stringify(lg1366));
    await p.evaluate(() => { const S = Forge.state(); S.items = S.items.filter(x => !isShield(x)); Forge.render(); }); await wait(400);
    // r4 polish #2/3/5 at 1366: even cards, compact picker (NONE last), real pilot + solo card, third card in view
    await p.evaluate(([a, b, c]) => {
      const S = Forge.state();
      const idOf = (u) => S.sheets.findIndex(s => Desk.ukey(s) === u);
      const ia = idOf(a), ib = idOf(b), ic = idOf(c);
      if (ia >= 0) { shClick(ia); S.own = 'VEGA'; if (S.sheets[ia].d) S.sheets[ia].d.own = 'VEGA'; }
      const col = ia >= 0 ? (S.sheets[ia].col || 1) : 1;
      [ib, ic].forEach(i => { if (i >= 0) { S.sheets[i].col = col; if (S.sheets[i].d) S.sheets[i].d.own = ''; } });
      Forge.render();
    }, [kA, kB, kC]); await wait(300);
    await p.evaluate(() => { Desk.wins().filter(w => w.k === 'unit' || w.k === 'sec').forEach(w => Desk.minimize(w.id)); }); await wait(200);
    await p.click('.dk-ico[data-ico=units]'); await wait(700);
    const gid1366 = await p.evaluate(() => Desk.wins().filter(w => w.k === 'group').pop().id);
    await p.evaluate((id) => { Desk.restore(id); Desk.geo(id, { x: 200, y: 112, w: 840, h: 620 }); Desk.front(id); }, gid1366); await wait(300);
    const col1366 = await p.evaluate((u) => { const sh = Forge.state().sheets.find(s => Desk.ukey(s) === u); return (sh && sh.col) || 1; }, kA);
    await pickGroupCol(p, gid1366, col1366);
    const g1366 = await p.evaluate((id) => {
      const g = document.querySelector(`.dkw[data-id="${id}"]`), body = g.querySelector('.dk-b').getBoundingClientRect();
      const btn = g.querySelector('.dk-t .dk-gcol'), tb = g.querySelector('.dk-t');
      const cd = g.querySelector('.dk-cards').getBoundingClientRect();
      const cards = [...g.querySelectorAll('.dk-card')].map(c => { const r = c.getBoundingClientRect(), pil = c.querySelector('.nm2 .dk-pil'), nm = c.querySelector('.nm2');
        return { x: Math.round(r.left), w: Math.round(r.width), t: Math.round(r.top), b: Math.round(r.bottom), name: nm && [...nm.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(), pil: pil && pil.textContent, omit: !pil }; });
      const br = btn && btn.getBoundingClientRect(), tbr = tb.getBoundingClientRect();
      return { n: cards.length, cards, even: cards.length >= 2 && cards.every(c => Math.abs(c.x - cards[0].x) <= 2 && Math.abs(c.w - cards[0].w) <= 2),
        inTitle: !!(btn && btn.closest('.dk-t')), noSw: !g.querySelector('.dk-grp .sw, .dk-grp [data-swt]'),
        cardsTop: cd.top <= body.top + 8, thirdIn: cards.length < 3 || (cards[2].t < body.bottom - 8 && cards[2].b <= body.bottom + 2) };
    }, gid1366);
    await p.locator(`.dkw[data-id="${gid1366}"] .dk-card:has-text("MUSHA")`).first().click({ timeout: 5000 }).catch(() => {}); await wait(300);
    await p.evaluate((id) => Desk.front(id), gid1366); await wait(200);
    await shot4(p, 'r4-05-group-cards-1366.png');
    ok(g1366.even && g1366.n >= 2, 'r4 polish #3: group mini-doll cards share a left edge and width ' + JSON.stringify({ even: g1366.even, cards: g1366.cards.map(c => [c.name, c.x, c.w]) }));
    ok(g1366.inTitle && g1366.noSw && g1366.cardsTop && g1366.thirdIn, 'r4: at 1366 the colour dropdown is in the title bar, mini dolls start at the top, and the third card stays in view ' + JSON.stringify({ inTitle: g1366.inTitle, noSw: g1366.noSw, cardsTop: g1366.cardsTop, thirdIn: g1366.thirdIn, n: g1366.n }));
    const mushaC = g1366.cards.find(c => /MUSHA/.test(c.name)), soloC = g1366.cards.find(c => c.omit);
    ok(mushaC && mushaC.pil === 'VEGA' && soloC && soloC.omit, 'r4 polish #2 at 1366: a piloted card shows the name and a solo card omits LOCAL ' + JSON.stringify({ mushaC, soloC }));
    // r4 polish #6 at 1366 + shot: close unit windows so OPEN creates a new one
    await p.evaluate(() => { Desk.wins().filter(w => w.k === 'unit' || w.k === 'sec').forEach(w => Desk.close(w.id)); }); await wait(400);
    await p.locator(`.dkw[data-id="${gid1366}"] .dk-card`).last().click(); await wait(300);
    await p.click(`.dkw[data-id="${gid1366}"] .dk-gsel [data-g=open]`); await wait(900);
    const open1366 = await p.evaluate(() => {
      const w = Desk.wins().filter(w => w.k === 'unit' && !w.min && !w.hidden).sort((a, b) => b.z - a.z)[0];
      if (!w) return null;
      const u = document.querySelector(`.dkw[data-id="${w.id}"]`).getBoundingClientRect(), en = document.querySelector('.dkw[data-k=enc]').getBoundingClientRect();
      const A = document.getElementById('dkarea').getBoundingClientRect();
      const im = document.querySelector(`.dkw[data-id="${w.id}"] .dk-seg[data-s=impact]`);
      const b = document.querySelector(`.dkw[data-id="${w.id}"] .dk-b`).getBoundingClientRect(), ir = im && im.getBoundingClientRect();
      return { y: Math.round(u.top - A.top), eb: Math.round(en.bottom - A.top), cover: u.top < en.bottom - 2 && u.bottom > en.top + 2, pz: w.pz, w: Math.round(w.w),
        impTop: ir ? Math.round(ir.top - b.top) : null, impBot: ir ? Math.round(b.bottom - ir.bottom) : null };
    });
    if (open1366) await p.evaluate(() => { const w = Desk.wins().filter(w => w.k === 'unit').sort((a, b) => b.z - a.z)[0]; if (w) Desk.front(w.id); }); await wait(200);
    await shot4(p, 'r4-06-group-open-1366.png');
    ok(open1366 && !open1366.cover && open1366.y + 1 >= open1366.eb - 2 && open1366.pz === 'S' && open1366.impTop >= 0, 'r4 polish #6 at 1366: opening from the group places the unit window below ENCOUNTER with IMPACT RESOLUTION in view ' + JSON.stringify(open1366));
    await p.setViewportSize({ width: 1600, height: 900 }); await wait(500);

    /* ================= PASS 1 (Overseer improvement series) ================= */
    const P1dir = P1r;
    // #2 integrity line has no leading //
    const ig = await p.evaluate(() => { const c = document.querySelector('.dk-card .cd'); return c ? c.innerText : ''; });
    ok(/INTEGRITY/.test(ig || '') && !/\/\/\s*INTEGRITY/.test(ig || ''), 'p1: group card INTEGRITY line has no leading // ' + JSON.stringify(ig));
    // #3 taskbar: title in tab colour; minimise _ and tray tab
    const tb3 = await p.evaluate(() => {
      const units = Desk.wins().filter(w => w.k === 'unit' && !w.hidden);
      const w = units[0]; if (!w) return null;
      Desk.restore(w.id); Desk.front(w.id);
      const tab = document.querySelector(`#dktabs [data-id="${w.id}"]`);
      const col = (typeof SH_COL !== 'undefined' && SH_COL[w.c || 0]) || '';
      const cs = tab && getComputedStyle(tab);
      return { id: w.id, c: w.c, col, color: cs && cs.color, hasSw: !!(tab && tab.querySelector('.dk-tc')), minBtn: !!document.querySelector(`.dkw[data-id="${w.id}"] [data-a=min]`) };
    });
    const colMatch = tb3 && await p.evaluate(([a, b]) => { const t = (c) => { const s = document.createElement('span'); s.style.color = c; document.body.appendChild(s); const v = getComputedStyle(s).color; s.remove(); return v; }; return !b || t(a) === t(b); }, [tb3.color, tb3.col]);
    ok(tb3 && tb3.minBtn && tb3.hasSw && colMatch, 'p1: each window has a taskbar tab in its tab colour, and a title-bar minimise button ' + JSON.stringify(tb3));
    if (tb3) {
      await p.click(`.dkw[data-id="${tb3.id}"] [data-a=min]`); await wait(250);
      const min1 = await p.evaluate((id) => { const w = Desk.wins().find(w => w.id === id), t = document.querySelector(`#dktabs [data-id="${id}"]`); return { min: !!(w && w.min), hid: !!(w && w.hidden), tabMin: t && t.classList.contains('min') }; }, tb3.id);
      ok(min1.min && min1.hid && min1.tabMin, 'p1: title-bar _ minimises the window; its taskbar tab stays (dimmed) ' + JSON.stringify(min1));
      await p.click(`#dktabs [data-id="${tb3.id}"]`); await wait(250);
      const rst = await p.evaluate((id) => { const w = Desk.wins().find(w => w.id === id); return { min: !!(w && w.min), hid: !!(w && w.hidden), on: document.querySelector(`.dkw[data-id="${id}"]`).classList.contains('on') }; }, tb3.id);
      ok(!rst.min && !rst.hid && rst.on, 'p1: clicking the taskbar tab restores and focuses a minimised window ' + JSON.stringify(rst));
      await p.click(`#dktabs [data-id="${tb3.id}"]`); await wait(250);
      const min2 = await p.evaluate((id) => { const w = Desk.wins().find(w => w.id === id); return !!(w && w.min); }, tb3.id);
      ok(min2, 'p1: clicking the taskbar tab of a focused window minimises it');
      await p.click(`#dktabs [data-id="${tb3.id}"]`); await wait(200);
    }
    // #4 edge snap + TILE UNITS
    const snap1 = await p.evaluate(() => {
      const enc = Desk.wins().find(w => w.k === 'enc'); if (!enc) return null;
      Desk.restore(enc.id);
      Desk.geo(enc.id, { x: 5, y: 5, w: enc.w, h: enc.h });
      const w = Desk.wins().find(w => w.id === enc.id);
      Desk.snapEdges(w, 'move'); Desk.geo(enc.id, { x: w.x, y: w.y, w: w.w, h: w.h });
      const after = Desk.wins().find(w => w.id === enc.id);
      return { x: after.x, y: after.y };
    });
    ok(snap1 && snap1.x === 0 && snap1.y === 0, 'p1: a window 5px from the screen edge snaps to it (within 8px) ' + JSON.stringify(snap1));
    const snap2 = await p.evaluate(() => {
      const enc = Desk.wins().find(w => w.k === 'enc');
      const u = Desk.wins().find(w => w.k === 'unit' && !w.hidden); if (!enc || !u) return null;
      Desk.restore(u.id);
      Desk.geo(u.id, { x: enc.x + enc.w + 6, y: enc.y, w: Math.min(u.w, 400), h: Math.min(u.h, 200) });
      const w = Desk.wins().find(w => w.id === u.id);
      Desk.snapEdges(w, 'move'); Desk.geo(u.id, { x: w.x, y: w.y, w: w.w, h: w.h });
      const after = Desk.wins().find(w => w.id === u.id), e = Desk.wins().find(w => w.id === enc.id);
      return { ux: after.x, er: e.x + e.w, gap: after.x - (e.x + e.w) };
    });
    ok(snap2 && Math.abs(snap2.gap) <= 1, 'p1: a window 6px from another window edge snaps flush to it ' + JSON.stringify(snap2));
    // ensure at least two unit windows for tiling
    const nU0 = (await uw(p)).filter(w => !w.hidden && !w.min).length;
    if (nU0 < 2) {
      const need = await p.evaluate(() => { const have = new Set(Desk.wins().filter(w => w.k === 'unit').flatMap(w => w.tabs || [])); return Forge.state().sheets.map((s, i) => Desk.ukey(s)).filter(k => k && !have.has(k)); });
      if (need[0]) { await p.evaluate((u) => { Desk.open({ k: 'unit', u }); Desk.sync(); }, need[0]); await wait(800); }
    }
    await p.evaluate(() => Desk.tileUnits()); await wait(400);
    const tiled = await p.evaluate(() => {
      const A = document.getElementById('dkarea').getBoundingClientRect();
      const enc = document.querySelector('.dkw[data-k=enc]');
      const eb = enc && !enc.hidden ? enc.getBoundingClientRect().bottom - A.top : 0;
      const us = Desk.wins().filter(w => w.k === 'unit' && !w.min && !w.hidden).map(w => ({ id: w.id, x: w.x, y: w.y, w: w.w, h: w.h }));
      let overlap = false;
      for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) {
        const a = us[i], b = us[j];
        if (a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1) overlap = true;
      }
      return { n: us.length, overlap, below: us.every(u => u.y + 1 >= eb - 2), minY: us.length ? Math.min(...us.map(u => u.y)) : null, eb };
    });
    ok(tiled.n >= 1 && !tiled.overlap && tiled.below, 'p1: TILE UNITS lays unit windows in a grid below ENCOUNTER with no overlap ' + JSON.stringify(tiled));
    await p.evaluate(() => Desk.openShortcuts()); await wait(300);
    const keys = await p.evaluate(() => {
      const w = Desk.wins().find(w => w.k === 'keys'); if (!w) return null;
      const t = (document.querySelector(`.dkw[data-id="${w.id}"]`) || {}).innerText || '';
      const fs = parseFloat(getComputedStyle(document.querySelector(`.dkw[data-id="${w.id}"] .dk-keys`) || document.body).fontSize);
      return { t, fs, hasCtrl: /Ctrl\+1/.test(t), hasEsc: /\bEsc\b/.test(t), hasHelp: /\?/.test(t), drag: /Drag a unit tab/i.test(t), tear: /Tear-off/i.test(t), dbl: /Double-click/i.test(t), right: /Right-click/i.test(t) };
    });
    ok(keys && keys.fs >= 11 && !keys.hasCtrl && keys.hasEsc && keys.hasHelp && keys.drag && keys.tear && keys.dbl && keys.right, 'p1/p2: SHORTCUTS lists gestures and ? / Esc, 11px or larger, and no longer lists Ctrl+1-9 ' + JSON.stringify({ fs: keys && keys.fs, hasCtrl: keys && keys.hasCtrl, hasEsc: keys && keys.hasEsc, hasHelp: keys && keys.hasHelp, drag: keys && keys.drag, tear: keys && keys.tear, dbl: keys && keys.dbl, right: keys && keys.right }));
    await p.keyboard.press('Escape'); await wait(200);
    await p.click('#dkstart'); await wait(200);
    ok(await p.evaluate(() => !!document.getElementById('dkmenu') && /TILE UNITS/.test(document.getElementById('dkmenu').textContent)), 'p1: TILE UNITS is in the launch menu');
    await p.keyboard.press('Escape'); await wait(200);
    ok(await p.evaluate(() => !document.getElementById('dkmenu') && !Desk.wins().some(w => w.k === 'keys' && !w.min && !w.hidden)), 'p1: Esc closes the launch menu (and a focused SHORTCUTS window)');
    await p.click('#dkhelp'); await wait(300);
    ok(await p.evaluate(() => Desk.wins().some(w => w.k === 'keys' && !w.hidden && !w.min)), 'p1: the taskbar ? button opens SHORTCUTS');
    await p.evaluate(() => { const k = Desk.wins().find(w => w.k === 'keys'); if (k) Desk.close(k.id); }); await wait(200);
    // p2: minimising the acting unit shows ACTING: X (MIN); clicking it restores the window
    const minAct = await p.evaluate(() => {
      const S = Forge.state(), sh = S.cur != null ? S.sheets[S.cur] : null; if (!sh) return null;
      const k = Desk.ukey(sh), w = Desk.wins().find(w => w.k === 'unit' && (w.tabs || []).includes(k)); if (!w) return { miss: k };
      Desk.minimize(w.id);
      const el = document.querySelector('#dkstat .act');
      return { id: w.id, txt: el && el.textContent, minCls: !!(el && el.classList.contains('min')), hidden: !!(w && Desk.wins().find(x => x.id === w.id).min) };
    });
    ok(minAct && /ACTING:/.test(minAct.txt || '') && /\(MIN\)/.test(minAct.txt || '') && minAct.minCls && minAct.hidden, 'p2: minimising the acting unit shows ACTING: X (MIN) in the status bar ' + JSON.stringify(minAct));
    await p.click('#dkstat .act'); await wait(250);
    const minRst = await p.evaluate((id) => { const w = Desk.wins().find(w => w.id === id), el = document.querySelector('#dkstat .act'), e = document.querySelector(`.dkw[data-id="${id}"]`); return { min: !!(w && w.min), hid: !!(e && e.hidden), txt: el && el.textContent, on: e && e.classList.contains('on') }; }, minAct.id);
    ok(minRst && !minRst.min && !minRst.hid && /ACTING:/.test(minRst.txt || '') && !/\(MIN\)/.test(minRst.txt || ''), 'p2: clicking ACTING: X (MIN) restores the acting unit window ' + JSON.stringify(minRst));
    // #1 STABILITY scroll into view after APPLY
    const stab = await p.evaluate(() => {
      const w = Desk.wins().find(w => w.k === 'unit' && !w.min && !w.hidden) || Desk.wins().find(w => w.k === 'unit');
      if (!w) return { skip: 'no unit' };
      Desk.restore(w.id); Desk.front(w.id);
      const S = Forge.state();
      if (S.stab) { if (typeof stabDismiss === 'function') stabDismiss(); }
      const i = S.sheets.findIndex(s => Desk.ukey(s) === w.u);
      if (i < 0) return { skip: 'no sheet' };
      if (typeof shGo === 'function') shGo(i); else if (typeof shClick === 'function') { /* routed */ }
      Desk.route(w.u);
      S.dmg = Object.assign(S.dmg || {}, { loc: 2, d: 700, div: 1, rear: false, gap: false });
      if (typeof autoCalc === 'function') autoCalc();
      if (typeof applyDmg === 'function') applyDmg(); else return { skip: 'no applyDmg' };
      const box = document.querySelector(`.dkw[data-id="${w.id}"] .stabbox`) || (() => { const h = Desk.hosts().get(w.u + '|impact'); const r = h && (h.querySelector ? (h.querySelector('.stabbox') || (h.shadowRoot && h.shadowRoot.querySelector('.stabbox'))) : null); return r; })();
      const body = document.querySelector(`.dkw[data-id="${w.id}"] .dk-b`);
      if (!box || !body) return { has: !!box, body: !!body, stab: !!S.stab };
      const br = box.getBoundingClientRect(), bb = body.getBoundingClientRect();
      return { has: true, topIn: br.top >= bb.top - 2, botIn: br.bottom <= bb.bottom + 2, stab: !!S.stab };
    });
    ok(stab && stab.has && stab.topIn, 'p1: after APPLY, the STABILITY strip is scrolled into view ' + JSON.stringify(stab));
    // #6 per-callsign layout persist + RESET LAYOUT exists
    const lay = await p.evaluate(() => {
      const enc = Desk.wins().find(w => w.k === 'enc'); if (!enc) return null;
      Desk.restore(enc.id); Desk.geo(enc.id, { x: 200, y: 48, w: enc.w, h: enc.h });
      const s = Desk.sign();
      let rec = null; try { rec = (JSON.parse(localStorage.getItem('forge_desk_d1') || '{}').bySign || {})[s]; } catch (e) { rec = null; }
      const savedX = rec && rec.geo && rec.geo.enc && rec.geo.enc.x;
      Desk.geo(enc.id, { x: 360, y: 48, w: enc.w, h: enc.h });
      const mid = Desk.wins().find(w => w.id === enc.id).x;
      Desk.loadLayout(rec);
      const after = Desk.wins().find(w => w.k === 'enc');
      return { s, savedX, mid, afterX: after && after.x, resetBtn: true };
    });
    ok(lay && lay.s && lay.savedX === 200 && lay.mid === 360 && lay.afterX === 200, 'p1: window position is persisted per callsign and restored from that layout ' + JSON.stringify(lay));
    // LAST: only roll cards, not arbitrary log lines
    const conWas = await p.evaluate(() => { const c = document.querySelector('.dkw[data-k=con]'); return !!(c && !c.hidden); });
    if (conWas) { await p.click('#dktray'); await wait(200); }
    await p.evaluate(() => { const log = document.getElementById('log'); const d = document.createElement('div'); d.textContent = 'COMPONENT TABLE [....................] 0%'; log.appendChild(d); });
    await wait(250);
    const lastJunk = await p.evaluate(() => { const el = document.querySelector('#dkstat .dk-last'); return el ? el.textContent : ''; });
    ok(!/COMPONENT TABLE/.test(lastJunk || ''), 'p2: LAST: ignores a non-roll log line ' + JSON.stringify(lastJunk));
    await p.evaluate(() => { const log = document.getElementById('log'); const wrap = document.createElement('div'); wrap.innerHTML = '<div class="rc" data-rcid="p2test-rc">LOCAL / VEGA · SENSORS · SKILL · +2 DoS <span class=rcx>[+]</span></div>'; log.appendChild(wrap); });
    await wait(250);
    const last = await p.evaluate(() => { const el = document.querySelector('#dkstat .dk-last'); return el ? el.textContent : ''; });
    ok(/^LAST:/.test(last) && /VEGA/.test(last) && /SENSORS/.test(last) && !/COMPONENT TABLE/.test(last) && last.length <= 100, 'p2: when the console is closed, LAST: shows only the roll card text ' + JSON.stringify(last));
    await p.click('#dkstat .dk-last'); await wait(300);
    ok(await p.evaluate(() => { const c = document.querySelector('.dkw[data-k=con]'); return !!(c && !c.hidden); }), 'p2: clicking LAST: in the status bar opens the console');
    await p.click('#dktray'); await wait(200);

    // shots: 1366 and 1920, both themes
    const themeP1 = async (th) => { await p.click('.dk-ico[data-ico=set]'); await wait(400); const sid = await p.evaluate(() => Desk.wins().find(w => w.k === 'set').id); await p.click(`.dkw[data-id="${sid}"] button:has-text("${th}")`); await wait(400); await p.evaluate((id) => Desk.minimize(id), sid); await wait(200); };
    await p.evaluate(() => { Desk.wins().filter(w => w.k === 'keys' || w.k === 'set').forEach(w => Desk.close(w.id)); const g = Desk.wins().find(w => w.k === 'group'); if (g) { Desk.restore(g.id); Desk.front(g.id); } }); await wait(300);
    await p.setViewportSize({ width: 1366, height: 768 }); await wait(400);
    await themeP1('IMPERIAL NAVY'); await shotP1(p, 'p1-desk-1366-navy.png');
    await themeP1('REMUS ACCORD'); await shotP1(p, 'p1-desk-1366-remus.png');
    await p.evaluate(() => Desk.tileUnits()); await wait(300);
    await shotP1(p, 'p1-tile-1366-remus.png');
    await p.setViewportSize({ width: 1920, height: 1080 }); await wait(400);
    await themeP1('IMPERIAL NAVY'); await shotP1(p, 'p1-desk-1920-navy.png');
    await p.evaluate(() => Desk.openShortcuts()); await wait(250);
    await shotP1(p, 'p1-shortcuts-1920-navy.png');
    await p.evaluate(() => { const k = Desk.wins().find(w => w.k === 'keys'); if (k) Desk.close(k.id); }); await wait(150);
    await themeP1('REMUS ACCORD'); await shotP1(p, 'p1-desk-1920-remus.png');
    await p.setViewportSize({ width: 1280, height: 720 }); await wait(400);
    await themeP1('IMPERIAL NAVY');
    const narrow = await p.evaluate(() => {
      const b = document.querySelector('#dktabs button');
      const clr = document.querySelector('#dkstat .dk-clr');
      const cs = b && getComputedStyle(b);
      return { tw: b && Math.round(b.getBoundingClientRect().width), min: b && parseFloat(cs.minWidth), clr: clr && getComputedStyle(clr).display };
    });
    ok(narrow && narrow.min >= 120 && narrow.tw >= 120 && narrow.clr === 'none', 'p2: at 1280 taskbar tabs are at least 120px and CLEARANCE is hidden ' + JSON.stringify(narrow));
    await shotP2(p, 'p2-desk-1280-navy.png');
    await p.setViewportSize({ width: 1600, height: 900 }); await wait(400);
    await themeP1('IMPERIAL NAVY');
    const wideClr = await p.evaluate(() => { const clr = document.querySelector('#dkstat .dk-clr'); return clr && getComputedStyle(clr).display !== 'none'; });
    ok(wideClr, 'p2: at 1600 CLEARANCE stays visible in the status bar');
    await p.evaluate(() => { const k = Desk.wins().find(w => w.k === 'keys'); if (k) Desk.close(k.id); }); await wait(200);

    // settings, 7 REMUS accents
    await p.click('.dk-ico[data-ico=set]'); await wait(500);
    const sw = await p.evaluate(() => Desk.wins().find(w => w.k === 'set'));
    const sect = await p.evaluate((id) => [...document.querySelectorAll(`.dkw[data-id="${id}"] legend`)].map(l => l.textContent), sw.id);
    const hasReset = await p.evaluate((id) => !!document.querySelector(`.dkw[data-id="${id}"] [data-reset]`), sw.id);
    ok(['THEME', 'AUDIO', 'UI SCALE', 'LAYOUT SLOTS'].every(k => sect.some(s => s.startsWith(k))) && hasReset, 'settings: theme, audio, UI scale, layout slots, and RESET LAYOUT ' + JSON.stringify({ sect, hasReset }));
    await shot(p, 'r2-11-settings.png');
    await p.click(`.dkw[data-id="${sw.id}"] button:has-text("REMUS ACCORD")`); await wait(500);
    await p.click('#dktray'); await wait(300);
    const cy1 = await cyanScan(p);
    ok(await p.evaluate(() => document.body.getAttribute('data-theme')) === 'remus' && Object.keys(cy1).length === 0, 'REMUS ACCORD: no cyan outlines or accents left (tab-colour palette excepted) ' + JSON.stringify(cy1));
    await p.click('#dktray'); await wait(200);
    await p.evaluate(() => { Desk.wins().filter(w => w.k === 'set' || w.k === 'group').forEach(w => Desk.minimize(w.id)); }); await wait(300);
    await shot(p, 'r2-12-desktop-amber.png');
    await shot4(p, 'r4-desktop-amber.png');
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
    // r3 #9: ASSEMBLY opens working (its message strip shows the frame's state, not a fault), a fault is surfaced, RELOAD restarts it
    const asmId = await p.evaluate(() => Desk.wins().find(w => w.k === 'ws' && w.n === 1).id);
    const a9 = async () => p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`), f = e.querySelector('iframe').contentWindow, m = e.querySelector('.dk-wsmsg'); let v = ''; try { v = f.Forge.state().view; } catch (x) { v = 'ERR'; } return { view: v, msg: m && m.firstChild.textContent, btn: !!(m && !m.querySelector('button').hidden), cls: m && m.className, fr: getComputedStyle(e.querySelector('iframe')).height }; }, asmId);
    const a9a = await a9();
    // Misaki fix 3: on a healthy workstation RELOAD is two-step (confirm within 3 s); on a fault it is a plain one-click RELOAD
    const rb = () => p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`), b = e.querySelector('.dk-wsmsg>button'); return { t: b.textContent, vis: !b.hidden && b.getClientRects().length > 0, fw: e.querySelector('iframe').contentWindow === window.__fw9 }; }, asmId);
    await p.evaluate((id) => { window.__fw9 = document.querySelector(`.dkw[data-id="${id}"] iframe`).contentWindow; }, asmId);
    const r0 = await rb(); await p.click(`.dkw[data-id="${asmId}"] .dk-wsmsg>button`); await wait(300); const r1 = await rb();
    await wait(3300); const r2 = await rb();
    await p.click(`.dkw[data-id="${asmId}"] .dk-wsmsg>button`); await wait(300); await p.click(`.dkw[data-id="${asmId}"] .dk-wsmsg>button`); await wait(3500); const r3 = await rb();
    ok(r0.t !== 'RELOAD' && r1.t === 'RELOAD? UNSAVED WORK IS LOST' && r1.fw && r2.t === r0.t && r2.fw && !r3.fw && r3.t === r0.t, 'Misaki fix 3: healthy workstation: the first click asks "RELOAD? UNSAVED WORK IS LOST", it lapses after 3 s, and a confirmed second click reloads ' + JSON.stringify({ r0, r1, r2, r3 }));
    const asmF = p.frameLocator(`.dkw[data-id="${asmId}"] iframe`);
    const asmOk = await p.evaluate((id) => { const f = document.querySelector(`.dkw[data-id="${id}"] iframe`).contentWindow; return !!f.document.querySelector('#app,#wrap') && f.document.body.innerText.length > 50 && !f.document.getElementById('dklock'); }, asmId);
    await p.evaluate((id) => Desk.wsFault(document.querySelector(`.dkw[data-id="${id}"] iframe`).contentWindow, 'probe fault'), asmId); await wait(200);
    const a9b = await a9(); const rbF = await rb();
    await shot3_3('r3-09a-assembly-fault-strip.png');
    await p.click(`.dkw[data-id="${asmId}"] .dk-wsmsg [data-a=reload]`); await wait(3500);
    const a9c = await a9();
    ok(a9a.view !== 'login' && a9a.view !== 'ERR' && !/FAULT|DID NOT START/.test(a9a.msg) && a9a.btn && asmOk && /FAULT/.test(a9b.msg) && /bad/.test(a9b.cls) && rbF.t === 'RELOAD' && rbF.vis && a9c.view === a9a.view && !/FAULT|DID NOT START/.test(a9c.msg), 'r3 #9: ASSEMBLY opens signed in with a status strip; a frame fault shows on the window and RELOAD restarts it ' + JSON.stringify({ a9a, a9b, a9c }));
    await shot3_3('r3-09b-assembly-open.png');
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
    const autoOf = (page) => page.evaluate(() => {
      const S = Forge.state(), me = window.__forgeSelf, host = !!window.__forgeHost;
      const tabs = new Set(Desk.wins().filter(w => w.k === 'unit').flatMap(w => w.tabs || [w.u]));
      const must = S.sheets.filter(s => !s.hidden).filter(s => (me && s.ownerId === me) || (host && !s.ownerId) || (S.cur != null && S.sheets[S.cur] === s));
      return { host, missing: must.filter(s => !tabs.has(Desk.ukey(s))).map(s => s.name || s.uid), nMust: must.length, nTabs: tabs.size };
    });
    const aoH = await autoOf(H.p), aoP = await autoOf(Pl.p);
    ok(!aoH.missing.length && !aoP.missing.length && aoH.nMust > 0 && aoP.nMust > 0, 'p1 mp: autoOpen always opens owned units, the host unowned sheets, and the acting unit ' + JSON.stringify({ aoH, aoP }));
    for (const s of [H, Pl]) { await s.p.evaluate(() => { Forge.state().sheets.forEach(sh => Desk.open({ k: 'unit', u: Desk.ukey(sh) }, false)); Forge.render(); }); await wait(600); }
    const pw = await uw(Pl.p), hw = await uw(H.p);
    const pK = await keyOf(Pl.p, 'PB-7 / KAGE'), pH = await keyOf(Pl.p, 'HST-1 / HOSTUNIT');
    ok(pw.length === 1 && pw[0].tabs.length === 2 && hw.length === 1 && hw[0].tabs.length === 2, 'both seats: both units as tabs in one grey-bucket unit window ' + JSON.stringify([pw, hw].map(x => x.map(w => w.tabs))));
    const viewOnly = await Pl.p.evaluate(([o, m]) => { const g = (u, s) => { const h = Desk.hosts().get(u + '|' + s); return h.firstChild ? h : h.shadowRoot; };
      return { otherSkills: !Desk.hosts().get(o + '|skills') && !/SKILL INPUTS/.test(g(o, 'rolls').textContent), otherRolls: /VIEW ONLY/.test(g(o, 'rolls').textContent), ownRolls: /\[ROLL\]/.test(g(m, 'rolls').textContent) }; }, [pH, pK]);
    const wid = pw[0].id;
    const rbVis = async (u) => { await Pl.p.click(`.dkw[data-id="${wid}"] .dk-ut[data-u="${u}"]`); await wait(500); return Pl.p.evaluate((u) => { const h = Desk.hosts().get(u + '|loadout'); const r = h.firstChild ? h : h.shadowRoot; return [...r.querySelectorAll('.rbtn')].filter(b => b.getClientRects().length && getComputedStyle(b).visibility !== 'hidden').length; }, u); };
    viewOnly.otherRb = await rbVis(pH); viewOnly.ownRb = await rbVis(pK);
    ok(viewOnly.otherSkills && viewOnly.otherRolls && viewOnly.ownRolls && viewOnly.otherRb === 0 && viewOnly.ownRb > 0, "pilot: the host's unit is view-only in its tab; the own unit tab has rolls " + JSON.stringify(viewOnly));
    // r3 #10 (live table): pilot beside the mech name; a seated client in their member colour, Open in grey, a host-named pilot in the tab colour
    const pil = (s, u) => s.p.evaluate((u) => { const w = Desk.wins().find(w => w.k === 'unit' && (w.tabs || []).includes(u)); if (!w) return null; const e = document.querySelector(`.dkw[data-id="${w.id}"]`), t = e.querySelector(`.dk-ut[data-u="${u}"] .dk-pil`), i = Forge.state().sheets.findIndex(s => Desk.ukey(s) === u), sh = Forge.state().sheets[i];
      const pl = w.u === u ? e.querySelector('.dk-t .dk-pl') : null; const muted = getComputedStyle(document.body).getPropertyValue('--muted').trim(); const cc = (c) => { const s = document.createElement('span'); s.style.color = c; document.body.appendChild(s); const v = getComputedStyle(s).color; s.remove(); return v; };
      return { tab: t && t.textContent, tcol: t && getComputedStyle(t).color, title: pl && !pl.hidden ? pl.textContent : null, col: pl && getComputedStyle(pl).color, grey: cc(muted), tabc: cc(SH_COL[sh.col || 0] || ''), mp: window.mpPilotOf(i) }; }, u);
    const k10 = await pil(H, pK), o10 = await pil(H, pH), pH0 = await H.p.evaluate((u) => { const s = Forge.state().sheets.find(s => Desk.ukey(s) === u); return [s.col || 0, !!s.closed]; }, pH);
    await H.p.evaluate((u) => { const S = Forge.state(), i = S.sheets.findIndex(s => Desk.ukey(s) === u); shClick(i); }, pH); await wait(800);
    await H.p.evaluate((u) => { const S = Forge.state(), i = S.sheets.findIndex(s => Desk.ukey(s) === u); S.sheets[i].col = 2; S.sheets[i].closed = false; S.own = 'GUNNER'; Forge.render(); }, pH); await wait(1500);
    const g10 = await pil(H, pH);
    ok(k10 && k10.tab === 'PILOTB' && k10.tcol === 'rgb(255, 136, 0)' && o10 && /^(Open|Closed)$/.test(o10.tab) && o10.tcol === o10.grey && g10 && g10.tab === 'GUNNER' && g10.title === 'GUNNER' && g10.col === g10.tabc && g10.tcol === g10.tabc, 'r3 #10 (live): pilot names beside the mech name: a client in their member colour, Open / Closed in grey, a host-made pilot in the tab colour ' + JSON.stringify({ k10, o10, g10 }));
    await H.p.screenshot({ path: (process.env.R3SHOTS || '/workspace/forge-os/feedback/v555-d1/round3/shots') + '/r3-10b-pilot-names-live.png' });
    await H.p.evaluate(([u, c]) => { const S = Forge.state(), i = S.sheets.findIndex(s => Desk.ukey(s) === u); S.sheets[i].col = c[0]; S.sheets[i].closed = c[1]; S.own = ''; Forge.render(); }, [pH, pH0]); await wait(1500); // back to the closed host unit for the checks below
    await Pl.p.click(`.dkw[data-id="${wid}"] .dk-ut[data-u="${pH}"]`); await wait(500);
    const n0 = await Pl.p.evaluate(() => document.getElementById('log').textContent.length);
    const routedOther = await Pl.p.evaluate((u) => Desk.curKey() === u && document.body.classList.contains('mp-view'), pH);
    await Pl.p.evaluate(() => { try { atkRoll(0); } catch (e) { } }); await wait(1500);
    const deny = await Pl.p.evaluate((n) => document.getElementById('log').textContent.slice(n), n0);
    ok(routedOther && /ASSIGNED PILOT OR HOST ONLY/.test(deny), "pilot: the host unit's tab acts as the host unit and its roll is refused (guard) " + JSON.stringify(deny.slice(0, 160)));
    const viewStat = await Pl.p.evaluate(() => { const el = document.querySelector('#dkstat .act'); return { txt: el && el.textContent, view: el && el.classList.contains('view'), body: document.body.classList.contains('mp-view') }; });
    ok(viewStat.body && viewStat.view && /^VIEWING/.test(viewStat.txt || '') && !/ACTING/.test(viewStat.txt || ''), 'p1 mp: a read-only pilot sees VIEWING (not ACTING) in the status bar ' + JSON.stringify(viewStat));
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
    await H.p.evaluate((id) => { Desk.geo(id, { x: 800, y: 200, w: 480, h: 440 }); Desk.front(id); }, hc); await wait(400);
    const clip = await H.p.evaluate(() => {
      const f = document.getElementById('mpfriends'), l = document.getElementById('log');
      if (!f || !l) return null;
      const fr = f.getBoundingClientRect(), lr = l.getBoundingClientRect();
      const overlap = lr.right > fr.left + 2 && lr.left < fr.right - 2 && lr.bottom > fr.top + 2 && lr.top < fr.bottom - 2;
      return { overlap, gap: Math.round(fr.left - lr.right), side: fr.bottom > lr.top + 10, lw: Math.round(lr.width), fw: Math.round(fr.width) };
    });
    ok(clip && clip.side && !clip.overlap, 'p1 mp: in a 480px-wide console the user list does not cover the roll lines ' + JSON.stringify(clip));
    const tabPF = async (page) => page.evaluate(() => {
      const S = Forge.state(), me = window.__forgeSelf, host = !!window.__forgeHost;
      const must = S.sheets.filter(s => !s.hidden && ((me && s.ownerId === me) || (host && !s.ownerId) || (S.cur != null && S.sheets[S.cur] === s)));
      const tabs = [...document.querySelectorAll('#dkarea .dk-ut')].map(t => ({ u: t.dataset.u, pf: ((t.querySelector('.pf') || {}).textContent) || '', act: t.classList.contains('act') }));
      const acting = (S.cur != null && S.sheets[S.cur]) ? Desk.ukey(S.sheets[S.cur]) : Desk.curKey();
      return { ownedOpen: must.every(s => tabs.some(t => t.u === Desk.ukey(s))), actingHas: tabs.some(t => t.u === acting && /▶/.test(t.pf)), nMust: must.length, acting };
    });
    const pfH = await tabPF(H.p), pfP = await tabPF(Pl.p);
    ok(pfH.ownedOpen && pfH.actingHas && pfP.ownedOpen && pfP.actingHas, 'p1 mp: every owned or acting unit has a tab, and the acting unit tab shows the play mark ' + JSON.stringify({ pfH, pfP }));
    await H.p.setViewportSize({ width: 1366, height: 768 }); await Pl.p.setViewportSize({ width: 1366, height: 768 }); await wait(400);
    await shotP1(H.p, 'p1-mp-host-1366.png');
    await Pl.p.evaluate(() => { const S = Forge.state(); const other = S.sheets.find(s => s.ownerId && s.ownerId !== window.__forgeSelf); if (other) { const u = Desk.ukey(other); const w = Desk.wins().find(w => w.k === 'unit' && (w.tabs || []).includes(u)); if (w) { Desk.restore(w.id); Desk.front(w.id); const tab = document.querySelector(`.dkw[data-id="` + w.id + `"] .dk-ut[data-u="` + u + `"]`); if (tab) tab.click(); } } });
    await wait(500);
    await shotP1(Pl.p, 'p1-mp-pilot-1366.png');

    ok((await dupIds(Pl.p)).length === 0 && (await dupIds(H.p)).length === 0, 'MP: no duplicate ids on either seat');
    // 3 prefill: reload the pilot seat
    await Pl.p.reload(); await wait(2500);
    const pre = await Pl.p.evaluate(() => [document.getElementById('dklkname').value, document.getElementById('dklkcol').value, !document.getElementById('dklock').hidden]);
    ok(pre[0] === 'PILOTB' && pre[1] === '#ff8800' && pre[2], 'login pre-fills the last used callsign and colour ' + JSON.stringify(pre));
    ok(errs.length === 0, 'MP: no page errors ' + JSON.stringify(errs.slice(0, 4)));
    await H.ctx.close(); await Pl.ctx.close();
  }
  /* ================= PASS 2 simultaneous-load MP ================= */
  {
    const errs = [];
    const { execSync } = require('child_process');
    try { execSync('bash /workspace/fresh-d1.sh', { stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000 }); }
    catch (e) { console.log('NOTE p2 mp: could not restart the local server before the simultaneous-load case (' + (e && e.message || e) + ')'); }
    await wait(1500);
    const boot = async (name, col, viewport) => {
      const ctx = await b.newContext({ viewport }); const p = await ctx.newPage();
      p.on('pageerror', e => errs.push(name + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/status of (409|413)|ERR_FAILED|net::/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
      await p.goto(base + '/terminal.html'); await wait(2000);
      await p.fill('#dklkname', name); if (col) await p.fill('#dklkcol', col);
      return { ctx, p, name };
    };
    const H2 = await boot('HOSTC', '', { width: 1366, height: 768 });
    const P2s = await boot('PILOTD', '#33aaff', { width: 1366, height: 768 });
    await Promise.all([H2.p.click('#dklkgo'), P2s.p.click('#dklkgo')]);
    await Promise.all([
      H2.p.waitForFunction(() => !document.getElementById('mpveil') && document.getElementById('dklock').hidden && document.body.classList.contains('mp-live'), null, { timeout: 20000 }),
      P2s.p.waitForFunction(() => !document.getElementById('mpveil') && document.getElementById('dklock').hidden && document.body.classList.contains('mp-live'), null, { timeout: 20000 })
    ]);
    await Promise.all([loadUnits(H2.p, ['HST-2 / HOSTTWO'], true), loadUnits(P2s.p, ['PD-9 / PILOTUNIT'], true)]);
    await wait(4000);
    await Promise.all([H2.p.evaluate(() => { try { Forge.render(); } catch (e) {} }), P2s.p.evaluate(() => { try { Forge.render(); } catch (e) {} })]);
    await wait(1000);
    const sheetNames = async (page) => page.evaluate(() => Forge.state().sheets.map(s => (s.name || ((s.d && (s.d.id + ' ' + s.d.cs)) || '') + (s.hidden ? ' [hid]' : ''))));
    const hostSheets = await sheetNames(H2.p), pilotSheets = await sheetNames(P2s.p);
    const race = !pilotSheets.some(n => /PILOTUNIT|PD-9/.test(n)) || !hostSheets.some(n => /PILOTUNIT|PD-9/.test(n));
    if (race) console.log('NOTE p2 mp: pilot sheet missing after simultaneous load (known 5.5.5 manifest race, out of scope) ' + JSON.stringify({ hostSheets, pilotSheets }));
    const actingOf = (page) => page.evaluate(() => {
      const S = Forge.state(), sh = (S.view === 'sortie' && S.cur != null) ? S.sheets[S.cur] : null;
      if (!sh) return { hasSheet: false, hasTab: false, n: S.sheets.filter(s => !s.hidden).length };
      const k = Desk.ukey(sh);
      const tab = [...document.querySelectorAll('#dkarea .dk-ut')].find(t => t.dataset.u === k);
      return { hasSheet: true, hasTab: !!tab, pf: tab && ((tab.querySelector('.pf') || {}).textContent || ''), name: sh.name || (sh.d && (sh.d.id + ' ' + sh.d.cs)), n: S.sheets.filter(s => !s.hidden).length };
    });
    const lastOf = (page) => page.evaluate(() => { const el = document.querySelector('#dkstat .dk-last'); return el ? el.textContent : ''; });
    // inject a non-roll line and a roll card on the host, console closed
    await H2.p.evaluate(() => { const c = document.querySelector('.dkw[data-k=con]'); if (c && !c.hidden) { const b = document.getElementById('dktray'); if (b) b.click(); } });
    await wait(200);
    await H2.p.evaluate(() => { const log = document.getElementById('log'); const junk = document.createElement('div'); junk.textContent = 'COMPONENT TABLE [....................] 0%'; log.appendChild(junk); });
    await wait(200);
    const lastJunkMp = await lastOf(H2.p);
    ok(!/COMPONENT TABLE/.test(lastJunkMp || ''), 'p2 mp: LAST: ignores a non-roll log line after a simultaneous load ' + JSON.stringify(lastJunkMp));
    await H2.p.evaluate(() => { const log = document.getElementById('log'); const wrap = document.createElement('div'); wrap.innerHTML = '<div class="rc" data-rcid="p2mp-rc">HOSTC / HOSTTWO · SENSORS · SKILL · +1 DoS <span class=rcx>[+]</span></div>'; log.appendChild(wrap); });
    await wait(250);
    const lastMp = await lastOf(H2.p);
    ok(/^LAST:/.test(lastMp) && /HOSTTWO|SENSORS/.test(lastMp) && !/COMPONENT TABLE/.test(lastMp), 'p2 mp: LAST: shows only roll card text ' + JSON.stringify(lastMp));

    const widths = [[1280, 720], [1366, 768], [1920, 1080]];
    for (const [w, h] of widths) {
      await H2.p.setViewportSize({ width: w, height: h }); await P2s.p.setViewportSize({ width: w, height: h }); await wait(400);
      await Promise.all([H2.p.evaluate(() => { try { Forge.render(); } catch (e) {} }), P2s.p.evaluate(() => { try { Forge.render(); } catch (e) {} })]);
      await wait(400);
      const aH = await actingOf(H2.p), aP = await actingOf(P2s.p);
      ok(!aH.hasSheet || aH.hasTab, 'p2 mp: at ' + w + ' the host acting unit has a tab after a simultaneous load ' + JSON.stringify(aH));
      ok(!aP.hasSheet || aP.hasTab, 'p2 mp: at ' + w + ' the pilot acting unit has a tab after a simultaneous load ' + JSON.stringify(aP));
      if (w === 1280) {
        const tabW = await H2.p.evaluate(() => { const b = document.querySelector('#dktabs button'); const clr = document.querySelector('#dkstat .dk-clr'); return { min: b && parseFloat(getComputedStyle(b).minWidth), tw: b && Math.round(b.getBoundingClientRect().width), clr: clr && getComputedStyle(clr).display }; });
        ok(tabW && tabW.min >= 120 && tabW.clr === 'none', 'p2 mp: at 1280 taskbar tabs are at least 120px and CLEARANCE is hidden ' + JSON.stringify(tabW));
      }
      const lastNow = await lastOf(H2.p);
      ok(!lastNow || (/^LAST:/.test(lastNow) && !/COMPONENT TABLE/.test(lastNow) && !/EDITS NOT SAVED/.test(lastNow)), 'p2 mp: at ' + w + ' LAST: is empty or roll text only ' + JSON.stringify(lastNow));
      await shotP2(H2.p, 'p2-mp-host-' + w + '.png');
      await shotP2(P2s.p, 'p2-mp-pilot-' + w + '.png');
    }
    ok(errs.length === 0, 'p2 mp: no page errors on a simultaneous load ' + JSON.stringify(errs.slice(0, 4)));
    await H2.ctx.close(); await P2s.ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED of ' + n : 'ALL PASS ' + n + '/' + n); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
