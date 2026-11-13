// FORGE-OS v5.5.5-D1 desktop checks (Overseer spec feedback/v555-d1/SPEC.md). Usage: node check-v555-d1.js [base] [shotdir]
// Solo: lock screen, window chrome (open/close/min/max/drag/resize), all units live at once, sections (collapse/pop out/dock),
// unit group window, console tray toggle, settings themes + layout slots, key-gated OVERSEER / CATALOGUE EDITOR windows.
// MP (fresh dev server): lock screen on connect, roll permissions (host or owner only) across unit windows.
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8090';
const shots = process.argv[3] || '/workspace/forge-os/feedback/v555-d1/shots';
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
const units = p => p.evaluate(() => Desk.wins().filter(w => w.k === 'unit'));
async function tile(p, top = 8) { await p.evaluate((top) => { const A = document.getElementById('dkarea'), us = Desk.wins().filter(w => w.k === 'unit'), w = Math.floor(A.clientWidth / us.length); us.forEach((u, i) => Desk.geo(u.id, { x: i * w, y: top, w: w - 4, h: A.clientHeight - top - 4, max: false, min: false })); const e = Desk.wins().find(w => w.k === 'enc'); if (e) Desk.minimize(e.id); }, top); await wait(300); }
const dupIds = p => p.evaluate(() => { const c = {}; document.querySelectorAll('[id]').forEach(e => { c[e.id] = (c[e.id] || 0) + 1; }); return Object.keys(c).filter(k => c[k] > 1); });
const hpOf = (p, nm) => p.evaluate((nm) => { const S = Forge.state(); Forge.save(); const sh = S.sheets.find(s => (s.d && (s.d.id + ' ' + s.d.cs).includes(nm.split(' / ')[0]))); return sh && sh.d.tel.hp.slice(); }, nm);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  /* ================= SOLO ================= */
  {
    const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(base + '/terminal.html'); await wait(2500);
    const lk = await p.evaluate(() => { const l = document.getElementById('dklock'), r = l.getBoundingClientRect(); return { vis: !l.hidden, full: r.width >= innerWidth - 1 && r.height >= innerHeight - 1 && r.left <= 0 && r.top <= 0, r: [r.left, r.top, r.width, r.height, innerWidth, innerHeight], rows: l.querySelectorAll('#con .row').length, crest: !!l.querySelector('.lk-crest .welcome'), desk: !!document.querySelector('#dkdesk'), wrap: getComputedStyle(document.getElementById('wrap')).display }; });
    ok(lk.vis && lk.full && lk.rows === 6 && lk.crest && lk.wrap === 'none', 'lock screen: full-screen on load with crest/crawl and the 6 clearances; classic page hidden ' + JSON.stringify(lk));
    await shot(p, 'd1-01-login-lock-teal.png');
    await p.click('#dklock .row:has-text("IMPERIAL INTELLIGENCE")'); await wait(1500);
    ok(await p.evaluate(() => document.getElementById('dklock').hidden && Desk.wins().some(w => w.k === 'enc' && !w.hidden)), 'login: the desktop appears only after picking a clearance (ENCOUNTER window open)');
    const icons = await p.evaluate(() => [...document.querySelectorAll('#dkicons .dk-ico')].map(b => b.querySelector('b').textContent + ' ' + b.querySelector('span').textContent));
    ok(icons.length >= 5 && icons.every(t => /^[\u3400-\u9fff] [A-Z]+$/.test(t)) && !icons.some(t => /CONSOLE/.test(t)), 'desktop icons: kanji with English labels, no console icon ' + JSON.stringify(icons));
    await loadUnits(p, NAMES, true);
    let us = await units(p);
    ok(us.length === 3, 'three units loaded -> three unit windows open ' + us.length);
    await tile(p);
    const names = await p.evaluate(() => Desk.wins().filter(w => w.k === 'unit').map(w => { const h = Desk.hosts().get(w.u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; const s = r.querySelector('.sorhead .nm'); return s && s.textContent; }));
    ok(names.every((t, i) => t && t.includes(NAMES[i].split(' / ')[1].split(' ')[0])), 'every unit window shows its own unit (rendered live) ' + JSON.stringify(names));
    ok((await dupIds(p)).length === 0, 'no duplicate ids with three units on the desktop ' + JSON.stringify(await dupIds(p)));
    const live1 = await p.evaluate(() => [...Desk.hosts().values()].filter(h => h.firstChild).map(h => h.dataset.u));
    // damage unit A through its own window, then unit C through its window: both stay correct and live
    const [A, B, C] = us;
    const dmg = async (u, loc, v) => { await p.locator(`.dk-sec[data-u="${u.u}"][data-s=doll] .mlab`).nth(loc).click(); await wait(300); await p.locator(`.dk-sec[data-u="${u.u}"][data-s=impact] input[type=number]`).first().fill(String(v)); await wait(200); await p.locator(`.dk-sec[data-u="${u.u}"][data-s=impact] .damage-apply`).click(); await wait(1200); };
    const a0 = await hpOf(p, NAMES[0]), c0 = await hpOf(p, NAMES[2]);
    await dmg(A, 1, 700); const a1 = await hpOf(p, NAMES[0]), c1 = await hpOf(p, NAMES[2]);
    await dmg(C, 2, 720); const a2 = await hpOf(p, NAMES[0]), c2 = await hpOf(p, NAMES[2]);
    ok(JSON.stringify(a1) !== JSON.stringify(a0) && JSON.stringify(c1) === JSON.stringify(c0) && JSON.stringify(c2) !== JSON.stringify(c1) && JSON.stringify(a2) === JSON.stringify(a1), 'all units live: damage through window A hits only A, then window C hits only C, with no switch step ' + JSON.stringify([a0, a1, c1, c2].map(x => x && x.join('/'))));
    const shown = await p.evaluate(() => Desk.wins().filter(w => w.k === 'unit').map(w => { const h = Desk.hosts().get(w.u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; return [...r.querySelectorAll('.mlab')].map(m => (m.textContent.match(/(-?\d+)\/\d+ HP/) || [])[1]).join(','); }));
    ok(shown[0] !== shown[1] && shown[2] !== shown[1] && shown[0] !== shown[2], 'each window shows its own live HP after both hits (A, B untouched, C) ' + JSON.stringify(shown));
    // a change to a unit the user is not touching shows up in its window on the next render (live tracking)
    await p.evaluate(() => { const S = Forge.state(), i = S.sheets.findIndex(s => /ICR-07/.test(s.d.id + ' ' + s.d.cs)); if (i === S.cur) return; S.sheets[i].d.tel.hp[0] = 1; Forge.render(); });
    await wait(400);
    ok(await p.evaluate((u) => { const h = Desk.hosts().get(u + '|doll'); const r = h.firstChild ? h : h.shadowRoot; return /\b1\/\d+ HP/.test(r.textContent); }, B.u), 'an untouched unit window re-renders from its own data (live health tracking)');
    ok(await p.evaluate(() => !document.querySelector('.dkw[data-k=unit] .ltag, .mirc, [data-s=mirror]')) && !(await p.evaluate(() => /MAKE LIVE/.test(document.body.textContent))), 'no single "active" sheet: no LIVE tag, mirror or MAKE LIVE control');
    // skill input in a background window keeps focus and value through renders
    await p.locator(`.dk-sec[data-u="${B.u}"][data-s=skills] input[data-skill=pil]`).fill('15'); await wait(200);
    await p.evaluate(() => Forge.render()); await wait(300);
    const fk = await p.evaluate((u) => { const a = document.activeElement; return [a && a.dataset && a.dataset.skill, a && a.value, a && a.closest('.dk-sec') && a.closest('.dk-sec').dataset.u === u]; }, B.u);
    ok(fk[0] === 'pil' && fk[1] === '15' && fk[2], 'a skill input in a window keeps focus and value through a re-render ' + JSON.stringify(fk));
    // roll from a window -> that unit's roll line
    const rl0 = await p.evaluate(() => document.getElementById('log').textContent.length);
    await p.locator(`.dk-sec[data-u="${C.u}"][data-s=rolls] button:has-text("[ROLL]")`).first().click(); await wait(2500);
    const rl = await p.evaluate(([n, u]) => [Desk.curKey() === u, document.getElementById('log').textContent.slice(n)], [rl0, C.u]);
    ok(rl[0] && /RVN-06/.test(rl[1]) && /SENSORS/.test(rl[1]) && /Do[SF]/.test(rl[1]), 'a [ROLL] in window C rolls for unit C ' + JSON.stringify(rl[1].slice(0, 160)));
    await shot(p, 'd1-02-desktop-units-teal.png');
    // window chrome on a unit window
    const geo = (id) => p.evaluate((id) => { const e = document.querySelector(`.dkw[data-id="${id}"]`), r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), hid: e.hidden, max: e.classList.contains('max') }; }, id);
    await p.evaluate((id) => { Desk.geo(id, { x: 200, y: 60, w: 700, h: 600 }); Desk.front(id); }, B.id); await wait(200);
    const g0 = await geo(B.id), t = await p.locator(`.dkw[data-id="${B.id}"] .dk-t .dk-n`).boundingBox();
    await p.mouse.move(t.x + 40, t.y + 8); await p.mouse.down(); await p.mouse.move(t.x + 140, t.y + 68, { steps: 8 }); await p.mouse.up(); await wait(200);
    const g1 = await geo(B.id);
    ok(Math.abs(g1.x - g0.x - 100) <= 8 && Math.abs(g1.y - g0.y - 60) <= 8, 'drag: the title bar moves the window ' + JSON.stringify([g0, g1]));
    const hs = await p.locator(`.dkw[data-id="${B.id}"] .dk-h[data-d=se]`).boundingBox();
    await p.mouse.move(hs.x + 5, hs.y + 5); await p.mouse.down(); await p.mouse.move(hs.x + 85, hs.y - 75, { steps: 8 }); await p.mouse.up(); await wait(200);
    const g2 = await geo(B.id);
    ok(Math.abs(g2.w - g1.w - 80) <= 8 && Math.abs(g2.h - g1.h + 80) <= 8, 'resize: the corner handle resizes ' + JSON.stringify([g1, g2]));
    const hw = await p.locator(`.dkw[data-id="${B.id}"] .dk-h[data-d=w]`).boundingBox();
    await p.mouse.move(hw.x + 3, hw.y + 40); await p.mouse.down(); await p.mouse.move(hw.x - 37, hw.y + 40, { steps: 6 }); await p.mouse.up(); await wait(200);
    const g3 = await geo(B.id);
    ok(Math.abs(g3.w - g2.w - 40) <= 8 && Math.abs(g3.x - g2.x + 40) <= 8, 'resize: the left edge resizes and moves ' + JSON.stringify([g2, g3]));
    await p.click(`.dkw[data-id="${B.id}"] [data-a=max]`); await wait(200);
    const gm = await geo(B.id), ar = await p.evaluate(() => { const r = document.getElementById('dkarea').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
    ok(gm.max && Math.abs(gm.w - ar.w) <= 2 && Math.abs(gm.h - ar.h) <= 2, 'maximize fills the desktop area ' + JSON.stringify([gm, ar]));
    await p.click(`.dkw[data-id="${B.id}"] [data-a=max]`); await wait(200);
    const gr = await geo(B.id);
    ok(!gr.max && gr.w === g3.w && gr.x === g3.x, 'restore returns the previous geometry ' + JSON.stringify(gr));
    await p.click(`.dkw[data-id="${B.id}"] [data-a=min]`); await wait(200);
    const tb = await p.evaluate((id) => { const t = document.querySelector(`#dktabs [data-id="${id}"]`); return t && t.className; }, B.id);
    ok((await geo(B.id)).hid && /min/.test(tb || ''), 'minimize hides the window; its taskbar tab stays ' + tb);
    await p.click(`#dktabs [data-id="${B.id}"]`); await wait(200);
    const tb2 = await p.evaluate((id) => document.querySelector(`#dktabs [data-id="${id}"]`).className, B.id);
    ok(!(await geo(B.id)).hid && /\bon\b/.test(tb2), 'the taskbar tab restores it and highlights it as active ' + tb2);
    // sections: collapse in place, pop out, dock back
    await p.click(`.dkw[data-id="${B.id}"] .dk-seg[data-s=sheet] [data-a=col]`); await wait(200);
    ok(await p.evaluate((id) => { const s = document.querySelector(`.dkw[data-id="${id}"] .dk-seg[data-s=sheet]`); return s.classList.contains('col') && getComputedStyle(s.querySelector('.dk-sb')).display === 'none'; }, B.id), 'collapse: a section folds in place');
    await p.click(`.dkw[data-id="${B.id}"] .dk-seg[data-s=sheet] [data-a=col]`); await wait(200);
    await p.click(`.dkw[data-id="${B.id}"] .dk-seg[data-s=doll] [data-a=pop]`); await wait(800);
    const pop = await p.evaluate((u) => { const w = Desk.wins().find(w => w.k === 'sec' && w.u === u && w.s === 'doll'); const e = w && document.querySelector(`.dkw[data-id="${w.id}"]`); const h = e && e.querySelector('.dk-sec'); const r = h && (h.firstChild ? h : h.shadowRoot); return { id: w && w.id, has: !!(r && r.querySelector('.mechmap')), title: e && e.querySelector('.dk-n').textContent, ph: !!document.querySelector(`.dkw[data-k=unit] .dk-seg[data-s=doll] .dk-ph`) }; }, B.u);
    ok(pop.id && pop.has && /PAPER DOLL/.test(pop.title) && pop.ph, 'pop out: the paper doll gets its own window; the unit window shows a placeholder ' + JSON.stringify(pop));
    await p.evaluate((id) => Desk.geo(id, { x: 300, y: 120, w: 620, h: 480 }), pop.id); await wait(300);
    // the popped section is live too: damage B through it
    const b0 = await hpOf(p, NAMES[1]);
    await p.locator(`.dkw[data-id="${pop.id}"] .mlab`).nth(3).click(); await wait(200);
    await p.evaluate((id) => Desk.front(id), B.id);
    await p.locator(`.dk-sec[data-u="${B.u}"][data-s=impact] input[type=number]`).first().fill('700'); await p.locator(`.dk-sec[data-u="${B.u}"][data-s=impact] .damage-apply`).click(); await wait(1200);
    ok(JSON.stringify(await hpOf(p, NAMES[1])) !== JSON.stringify(b0), 'the popped-out section stays live (select a part there, APPLY in the unit window)');
    await p.evaluate((id) => Desk.front(id), pop.id); await wait(200);
    await shot(p, 'd1-03-popped-section-teal.png');
    await p.evaluate((id) => Desk.front(id), pop.id); await p.click(`.dkw[data-id="${pop.id}"] [data-a=dock]`); await wait(500);
    ok(await p.evaluate((u) => !Desk.wins().some(w => w.k === 'sec') && !!document.querySelector(`.dkw[data-k=unit] .dk-seg[data-s=doll] .dk-sec[data-u="${u}"]`), B.u), 'dock: the section returns to its unit window');
    // unit group window
    await p.evaluate(() => { const S = Forge.state(); Forge.save(); S.sheets[0].col = 1; S.sheets[1].col = 1; S.sheets[2].col = 3; Forge.render(); });
    await wait(400);
    await p.click('.dk-ico[data-ico=units]'); await wait(600);
    let gw = await p.evaluate(() => Desk.wins().filter(w => w.k === 'group').pop());
    await p.click(`.dkw[data-id="${gw.id}"] .sw button[data-c="1"]`); await wait(400);
    const cards = await p.evaluate((id) => [...document.querySelectorAll(`.dkw[data-id="${id}"] .dk-card`)].map(c => ({ n: c.querySelector('.nm2').textContent, svg: !!c.querySelector('svg'), st: c.querySelector('.cd').textContent })), gw.id);
    ok(cards.length === 2 && cards.every(c => c.svg && /STATUS/.test(c.st)) && cards.some(c => /MUSHA/.test(c.n)) && cards.some(c => /ICARUS/.test(c.n)), 'group window (CYAN): every unit with that tab colour as a mini paper doll card with name and condition ' + JSON.stringify(cards));
    await p.evaluate(() => { const u = Desk.wins().find(w => w.k === 'unit' && /ICR|ICARUS/.test(document.querySelector(`.dkw[data-id="${w.id}"] .dk-n`).textContent)); Desk.close(u.id); }); await wait(400);
    await p.evaluate((id) => Desk.geo(id, { x: 820, y: 30, w: 560, h: 380 }), gw.id); await wait(200);
    await p.locator(`.dkw[data-id="${gw.id}"] .dk-card:has-text("ICARUS")`).click(); await wait(800);
    const after = await p.evaluate((id) => ({ u: Desk.wins().filter(w => w.k === 'unit').map(w => document.querySelector(`.dkw[data-id="${w.id}"] .dk-n`).textContent), cards: document.querySelectorAll(`.dkw[data-id="${id}"] .dk-card`).length, g: Desk.wins().find(w => w.id === id) }), gw.id);
    ok(after.u.some(t => /ICARUS/.test(t)) && after.cards === 2 && after.g && !after.g.hidden && after.g.c === 1, 'clicking a card opens that unit window; the group window stays as it is ' + JSON.stringify(after));
    await p.evaluate((id) => Desk.front(id), gw.id); await wait(200);
    await shot(p, 'd1-04-group-window-teal.png');
    // console tray flyout
    ok(await p.evaluate(() => document.getElementById('dkfly').hidden && document.getElementById('dkfly').contains(document.getElementById('cb'))), 'console: one shared console lives in the tray flyout, closed by default');
    const tr = await p.evaluate(() => { const r = document.getElementById('dktray').getBoundingClientRect(), t = document.getElementById('dktask').getBoundingClientRect(); return t.right - r.right < 8; });
    ok(tr, 'console: its button is at the far right of the taskbar');
    await p.click('#dktray'); await wait(300);
    const o1 = await p.evaluate(() => !document.getElementById('dkfly').hidden);
    await p.mouse.click(700, 500); await p.click('#dkdesk', { position: { x: 30, y: 600 } }); await p.keyboard.press('Escape'); await wait(300);
    const o2 = await p.evaluate(() => !document.getElementById('dkfly').hidden);
    await p.fill('#CI', 'hello table'); await p.keyboard.press('Enter'); await wait(800);
    const o3 = await p.evaluate(() => !document.getElementById('dkfly').hidden);
    await shot(p, 'd1-05-console-flyout-teal.png');
    await p.click('#dktray'); await wait(300);
    const o4 = await p.evaluate(() => document.getElementById('dkfly').hidden);
    ok(o1 && o2 && o3 && o4, 'console: the tray button opens it; outside clicks, Escape and typing do not close it; only the button closes it ' + JSON.stringify([o1, o2, o3, o4]));
    // settings: themes, scale, slots
    await p.click('.dk-ico[data-ico=set]'); await wait(500);
    const sw = await p.evaluate(() => Desk.wins().find(w => w.k === 'set'));
    const sect = await p.evaluate((id) => [...document.querySelectorAll(`.dkw[data-id="${id}"] legend`)].map(l => l.textContent), sw.id);
    ok(['THEME', 'AUDIO', 'UI SCALE', 'LAYOUT SLOTS'].every(k => sect.some(s => s.startsWith(k))), 'settings: theme, audio, UI scale and layout slots ' + JSON.stringify(sect));
    const bg = () => p.evaluate(() => [getComputedStyle(document.getElementById('dkdesk')).backgroundColor, getComputedStyle(document.querySelector('.dkw.on>.dk-t')).backgroundColor, document.body.getAttribute('data-theme')]);
    const teal = await bg();
    await shot(p, 'd1-06-settings-teal.png');
    await p.click(`.dkw[data-id="${sw.id}"] button:has-text("REMUS ACCORD")`); await wait(400);
    const amber = await bg();
    ok(amber[2] === 'remus' && amber[0] !== teal[0] && amber[1] !== teal[1] && /230, 162, 26/.test(amber[1]), 'theme: REMUS ACCORD restyles the desktop (amber; active title bar solid amber) ' + JSON.stringify([teal, amber]));
    const shAmber = await p.evaluate(() => { const h = [...Desk.hosts().values()].find(h => !h.firstChild && h.dataset.s === 'doll'); return h && h.shadowRoot.firstElementChild.getAttribute('data-theme'); });
    ok(shAmber === 'remus', 'theme reaches the background unit windows too ' + shAmber);
    await shot(p, 'd1-07-settings-amber.png');
    await p.evaluate(() => { const u = Desk.wins().filter(w => w.k === 'unit'); const A = document.getElementById('dkarea'); const w = Math.floor(A.clientWidth / u.length); u.forEach((x, i) => Desk.geo(x.id, { x: i * w, y: 8, w: w - 4, h: A.clientHeight - 12 })); Desk.wins().filter(w => w.k === 'group' || w.k === 'set').forEach(w => Desk.minimize(w.id)); Desk.front(u[0].id); });
    await wait(400); await shot(p, 'd1-08-desktop-units-amber.png');
    await p.evaluate(() => { const s = Desk.wins().find(w => w.k === 'set'); Desk.restore(s.id); }); await wait(200);
    await p.click(`.dkw[data-id="${sw.id}"] button:has-text("125%")`); await wait(300);
    const z = await p.evaluate(() => getComputedStyle(document.getElementById('dk')).zoom);
    await p.click(`.dkw[data-id="${sw.id}"] button:has-text("100%")`); await wait(300);
    ok(String(z) === '1.25', 'UI scale zooms the desktop ' + z);
    await p.click(`.dkw[data-id="${sw.id}"] [data-ss="2"]`); await wait(300);
    const nW = await p.evaluate(() => Desk.wins().length);
    await p.evaluate(() => Desk.close(Desk.wins().find(w => w.k === 'group').id)); await wait(300);
    await p.click(`.dkw[data-id="${sw.id}"] [data-sl="2"]`); await wait(800);
    ok(await p.evaluate((n) => Desk.wins().length === n && Desk.wins().some(w => w.k === 'group'), nW), 'layout slot 2: SAVE then LOAD restores the window set');
    const sw2 = await p.evaluate(() => { const s = Desk.wins().find(w => w.k === 'set'); Desk.front(s.id); return s.id; }); await wait(200);
    await p.click(`.dkw[data-id="${sw2}"] button:has-text("IMPERIAL NAVY")`); await wait(300);
    // key-gated editor windows
    await p.click('.dk-ico[data-ico=cat]'); await wait(300);
    ok(await p.evaluate(() => !!document.getElementById('dkmodal')), 'CATALOGUE EDITOR from an encounter asks before switching clearance');
    await p.click('#dkmodal [data-ok]'); await wait(1200);
    const ce = await p.evaluate(() => { const w = Desk.wins().find(w => w.k === 'term'); const e = w && document.querySelector(`.dkw[data-id="${w.id}"]`); return { t: e && e.querySelector('.dk-n').textContent, key: !!(e && e.querySelector('#researchPw')), view: Forge.state().view, lock: !document.getElementById('dklock').hidden }; });
    ok(/CATALOGUE EDITOR \/\/ KEY REQUIRED/.test(ce.t) && ce.key && ce.view === 'researchPw' && !ce.lock, 'CATALOGUE EDITOR window opens on its key prompt ' + JSON.stringify(ce));
    await p.fill('#researchPw', 'WRONG'); await p.keyboard.press('Enter'); await wait(600);
    ok(await p.evaluate(() => Forge.state().view === 'researchPw' && Forge.state().role !== 'RESEARCH STAFF'), 'a wrong key does not open the catalogue editor');
    await shot(p, 'd1-09-catalogue-key-teal.png');
    await p.fill('#researchPw', 'BINAH'); await p.keyboard.press('Enter'); await wait(1500);
    const ce2 = await p.evaluate(() => { const w = Desk.wins().find(w => w.k === 'term'); return { role: Forge.state().role, view: Forge.state().view, t: document.querySelector(`.dkw[data-id="${w.id}"] .dk-n`).textContent, k: document.querySelector(`.dkw[data-id="${w.id}"] .dk-k`).textContent }; });
    ok(ce2.role === 'RESEARCH STAFF' && /catalog/.test(ce2.view) && ce2.k === '典', 'the right key opens the CATALOGUE EDITOR window ' + JSON.stringify(ce2));
    await p.click('.dk-ico[data-ico=ovr]'); await wait(300); await p.click('#dkmodal [data-ok]'); await wait(1200);
    const ov = await p.evaluate(() => { const w = Desk.wins().find(w => w.k === 'term'); const e = document.querySelector(`.dkw[data-id="${w.id}"]`); return { t: e.querySelector('.dk-n').textContent, key: !!e.querySelector('#pw') }; });
    ok(/OVERSEER \/\/ KEY REQUIRED/.test(ov.t) && ov.key, 'OVERSEER window opens on its key prompt ' + JSON.stringify(ov));
    await p.fill('#pw', 'MALKUTH'); await p.keyboard.press('Enter'); await wait(1500);
    ok(await p.evaluate(() => Forge.state().role === 'OVERSEER' && /OVERSEER/.test(document.querySelector('.dkw[data-k=term] .dk-n').textContent)), 'the right key opens the OVERSEER window');
    await shot(p, 'd1-10-overseer-teal.png');
    // logout -> lock screen again
    await p.click('#dkstart'); await p.click('#dkmenu button:has-text("LOGOUT")'); await wait(200); if (await p.evaluate(() => !!document.getElementById('dkmodal'))) await p.click('#dkmodal [data-ok]'); await wait(1200);
    ok(await p.evaluate(() => !document.getElementById('dklock').hidden && Forge.state().view === 'login'), 'logout returns to the lock screen');
    ok(errs.length === 0, 'solo: no page errors ' + JSON.stringify(errs.slice(0, 4)));
    await ctx.close();
  }
  /* ================= MP: lock screen on connect + roll permissions ================= */
  {
    const errs = [];
    const seat = async (name) => {
      const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } }); const p = await ctx.newPage();
      p.on('pageerror', e => errs.push(name + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/status of (409|413)|ERR_FAILED|net::/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
      await p.goto(base + '/terminal.html'); await wait(2000);
      const l0 = await p.evaluate(() => !document.getElementById('dklock').hidden);
      await p.click('#dklock .row:has-text("LIVE DATA INTERCEPT")'); await wait(400);
      const l1 = await p.evaluate(() => !document.getElementById('dklock').hidden && !!document.querySelector('#dklock #mpname'));
      if (name === 'PILOTB') await shot(p, 'd1-11-login-callsign-teal.png');
      await p.fill('#mpname', name); await p.click('#dklock button:has-text("AUTHENTICATE")');
      await p.waitForFunction(() => !document.getElementById('mpveil') && document.getElementById('dklock').hidden, null, { timeout: 15000 });
      ok(l0 && l1, name + ': lock screen on connect with the callsign entry; the desktop appears after authenticating');
      return { ctx, p };
    };
    const H = await seat('HOSTA');
    await loadUnits(H.p, ['HST-1 / HOSTUNIT'], true);
    const Pl = await seat('PILOTB');
    await loadUnits(Pl.p, ['PB-7 / KAGE'], true); await wait(3500);
    await H.p.evaluate(() => Forge.render()); await wait(1500);
    for (const s of [H, Pl]) { await s.p.evaluate(() => { const us = Desk.wins().filter(w => w.k === 'unit'); us.forEach(u => Desk.open({ k: 'unit', u: u.u }, false)); Forge.state().sheets.forEach(sh => Desk.open({ k: 'unit', u: Desk.ukey(sh) }, false)); Forge.render(); }); await wait(600); await tile(s.p); }
    const wn = (p) => p.evaluate(() => Desk.wins().filter(w => w.k === 'unit').map(w => ({ id: w.id, u: w.u, n: document.querySelector(`.dkw[data-id="${w.id}"] .dk-n`).textContent })));
    const pw = await wn(Pl.p), hw = await wn(H.p);
    ok(pw.length === 2 && hw.length === 2, 'both seats see both units in their own windows ' + JSON.stringify([pw.map(x => x.n), hw.map(x => x.n)]));
    const pOwn = pw.find(x => /KAGE/.test(x.n)), pOther = pw.find(x => /HOSTUNIT/.test(x.n));
    const viewOnly = await Pl.p.evaluate(([o, m]) => { const g = (u, s) => { const h = Desk.hosts().get(u + '|' + s); return h.firstChild ? h : h.shadowRoot; };
      const vis = (r) => [...r.querySelectorAll('.rbtn')].filter(b => b.offsetParent !== null).length;
      return { otherSkills: /VIEW ONLY/.test(g(o.u, 'skills').textContent), otherRolls: /VIEW ONLY/.test(g(o.u, 'rolls').textContent), ownRolls: /\[ROLL\]/.test(g(m.u, 'rolls').textContent), otherRb: vis(g(o.u, 'loadout')), ownRb: vis(g(m.u, 'loadout')) }; }, [pOther, pOwn]);
    ok(viewOnly.otherSkills && viewOnly.otherRolls && viewOnly.ownRolls && viewOnly.otherRb === 0 && viewOnly.ownRb > 0, "pilot: the host's unit is view-only (no skills, rolls or loadout roll buttons); the own unit has them " + JSON.stringify(viewOnly));
    // pilot touches the host unit window and tries to roll -> refused; touches own window and rolls -> allowed
    const n0 = await Pl.p.evaluate(() => document.getElementById('log').textContent.length);
    await Pl.p.locator(`.dk-sec[data-u="${pOther.u}"][data-s=doll] .sorhead`).click(); await wait(300);
    const routedOther = await Pl.p.evaluate((u) => Desk.curKey() === u && document.body.classList.contains('mp-view'), pOther.u);
    await Pl.p.evaluate(() => { try { atkRoll(0); } catch (e) { } try { skillRoll && skillRoll('pil'); } catch (e) { } }); await wait(1500);
    const deny = await Pl.p.evaluate((n) => document.getElementById('log').textContent.slice(n), n0);
    ok(routedOther && /ASSIGNED PILOT OR HOST ONLY/.test(deny) && !/HOSTUNIT[^\n]*\[ ROLL \]/.test(deny), "pilot: a roll on the host's unit is refused (guard) " + JSON.stringify(deny.slice(0, 200)));
    const n1 = await Pl.p.evaluate(() => document.getElementById('log').textContent.length);
    await Pl.p.locator(`.dk-sec[data-u="${pOwn.u}"][data-s=rolls] button:has-text("[ROLL]")`).first().click(); await wait(2500);
    const mine = await Pl.p.evaluate((n) => document.getElementById('log').textContent.slice(n), n1);
    ok(/KAGE/.test(mine) && !/ASSIGNED PILOT OR HOST ONLY/.test(mine) && await Pl.p.evaluate((u) => Desk.curKey() === u && !document.body.classList.contains('mp-view'), pOwn.u), 'pilot: a [ROLL] in the own unit window rolls ' + JSON.stringify(mine.slice(0, 160)));
    await shot(Pl.p, 'd1-12-pilot-view-teal.png');
    // host may roll on the pilot's unit (host)
    const hP = hw.find(x => /KAGE/.test(x.n));
    const n2 = await H.p.evaluate(() => document.getElementById('log').textContent.length);
    await H.p.locator(`.dk-sec[data-u="${hP.u}"][data-s=rolls] button:has-text("[ROLL]")`).first().click(); await wait(2500);
    const hr = await H.p.evaluate((n) => document.getElementById('log').textContent.slice(n), n2);
    ok(/KAGE/.test(hr) && !/ASSIGNED PILOT OR HOST ONLY/.test(hr), "host: a roll in the pilot's unit window is allowed " + JSON.stringify(hr.slice(0, 160)));
    // live across seats: host damages pilot unit -> pilot's window updates without touching it
    const pv0 = await Pl.p.evaluate((u) => { const h = Desk.hosts().get(u + '|doll'); return (h.firstChild ? h : h.shadowRoot).textContent.match(/\d+\/\d+ HP/g).join(','); }, pOwn.u);
    await H.p.locator(`.dk-sec[data-u="${hP.u}"][data-s=doll] .mlab`).nth(1).click(); await wait(200);
    await H.p.locator(`.dk-sec[data-u="${hP.u}"][data-s=impact] input[type=number]`).first().fill('700'); await H.p.locator(`.dk-sec[data-u="${hP.u}"][data-s=impact] .damage-apply`).click(); await wait(5000);
    const pv1 = await Pl.p.evaluate((u) => { const h = Desk.hosts().get(u + '|doll'); return (h.firstChild ? h : h.shadowRoot).textContent.match(/\d+\/\d+ HP/g).join(','); }, pOwn.u);
    ok(pv0 !== pv1, 'live table: host damage shows in the pilot\'s unit window ' + JSON.stringify([pv0, pv1]));
    ok((await dupIds(Pl.p)).length === 0 && (await dupIds(H.p)).length === 0, 'MP: no duplicate ids on either seat');
    ok(errs.length === 0, 'MP: no page errors ' + JSON.stringify(errs.slice(0, 4)));
    await H.ctx.close(); await Pl.ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED of ' + n : 'ALL PASS ' + n + '/' + n); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
