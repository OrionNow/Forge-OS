#!/usr/bin/env node
// FORGE-OS 5.5.6 LOADOUT TERMINAL catalogue: tabs = real catalogue categories, subtype chips, all-category search,
// grid cards, detail pane, ADD = the existing install path. Usage: node check-v556-catalogue.js [base] [shotdir] (fresh dev server)
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const base = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
const shots = process.argv[3] || '/workspace/forge-os/feedback/v556/shots';
let pass = 0, fail = 0;
const ok = (c, m, e) => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + m + (c || e === undefined ? '' : ' :: ' + JSON.stringify(e).slice(0, 300))); };
(async () => {
  require('fs').mkdirSync(shots, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(base + '/terminal.html');
  await p.locator('[data-ux-row]').first().focus(); await p.keyboard.press('Enter');
  await p.locator('button[onclick="chassisTab(\'Mech\')"]').click();
  await p.locator('.row[onclick^="cfgCh"]').first().click();
  for (const k of ['R', 'T', 'G']) { const a = await p.locator('.row[onclick]').evaluateAll((els, k) => els.find(el => el.getAttribute('onclick').startsWith("cfgAdd('" + k + "'"))?.getAttribute('onclick'), k); await p.evaluate(a => [...document.querySelectorAll('.row[onclick]')].find(e => e.getAttribute('onclick') === a).click(), a); }
  await p.getByRole('button', { name: '[CONFIRM FRAME CONFIGURATION]', exact: true }).click();
  await p.waitForFunction(() => S.view === 'main' && document.getElementById('ltgrid'));
  ok(await p.evaluate(() => APP_VERSION) === '5.5.6', 'APP_VERSION 5.5.6');
  // 1) tabs = the catalogue's real equipment categories
  const tabs = await p.evaluate(() => ({ ui: [...document.querySelectorAll('#tb .tabs button[onclick^="tab("]')].map(b => b.getAttribute('onclick').slice(5, -2)).filter(c => c !== 'ID'), data: [...new Set(DB.map(x => x.c))].filter(c => c in TABS).sort(), labels: [...document.querySelectorAll('#tb .tabs button[onclick^="tab("]')].map(b => b.textContent) }));
  ok(JSON.stringify(tabs.ui.slice().sort()) === JSON.stringify(tabs.data) && tabs.ui.length === 3, 'tabs match the categories present in the catalogue data ' + tabs.ui.join(','), tabs);
  const vis = () => p.evaluate(() => [...document.querySelectorAll('.lt-card')].filter(e => e.offsetParent && !e.classList.contains('lt-dim')).map(e => ({ i: +e.dataset.i, c: e.dataset.c, sub: e.dataset.sub })));
  let v = await vis();
  const nA = await p.evaluate(() => DB.filter(x => x.c === 'A').length);
  ok(v.length === nA && v.every(x => x.c === 'A'), `ARMAMENT tab shows all ${nA} armament records and only those`, v.length);
  ok(await p.evaluate(() => { const c = [...document.querySelectorAll('.lt-card')].find(e => e.offsetParent); return !!c.querySelector('svg.lt-sil path,svg.lt-sil rect') && c.querySelectorAll('.lt-pips i').length === Math.min(10, DB[+c.dataset.i].e) && /^TL\d+$/.test(c.querySelector('.lt-tl6').textContent) && !!c.querySelector('.lt-spine') && /^A-01$/.test(c.querySelector('.lt-pno').textContent) && !!c.querySelector('.nm'); }), 'items show a glyph, A-01, EP power pips, TL hex, spine and full name');
  ok(await p.evaluate(() => JSON.stringify([...document.querySelectorAll('.lt-runner')].map(e => e.dataset.c)) === JSON.stringify(ltCats()) && [...document.querySelectorAll('.lt-runner')].every(e => e.querySelector('.lt-kn').textContent === TABS[e.dataset.c] && e.querySelectorAll('.lt-tl').length >= 1 && e.querySelectorAll('.lt-card').length === DB.filter(x => x.c === e.dataset.c).length)), 'one runner per real category, each with its kit-box name, TL ribbon(s) and all its parts');
  ok(await p.evaluate(() => { const s = ['MELEE', 'BALLISTIC', 'ROCKET/MISSILE', 'BEAM', 'SHIELD', 'ARMOR', 'MOBILITY', 'TARGETING'].map(k => LT_SHAPE(k)); return new Set(s).size === 8 && LT_SHAPE('ZZZ') === 'generic'; }), 'part silhouettes differ by subtype, with a generic fallback');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.lt-runner:not([hidden]) .lt-sprue')).gridTemplateColumns.split(' ').length >= 2), 'parts sit on the runner in a multi-column grid');
  // 2) chips = real subtypes of the tab
  const chips = await p.evaluate(() => ({ ui: [...document.querySelectorAll('.lt-chiprow:not([hidden]) .lt-chip')].map(b => b.dataset.sub).filter(Boolean), data: [...new Set(DB.filter(x => x.c === 'A').map(x => subtypeKey(subtypeOf(x) || 'UNSPECIFIED')))] }));
  ok(JSON.stringify(chips.ui.slice().sort()) === JSON.stringify(chips.data.slice().sort()), 'ARMAMENT chips are its real subtypes ' + chips.ui.join(','), chips);
  await p.locator('.lt-chiprow:not([hidden]) .lt-chip[data-sub="MELEE"]').click();
  v = await vis();
  const nMel = await p.evaluate(() => DB.filter(x => x.c === 'A' && subtypeKey(subtypeOf(x)) === 'MELEE').length);
  ok(v.length === nMel && v.every(x => x.sub === 'MELEE'), `MELEE chip filters to its ${nMel} records`, v);
  ok(await p.evaluate(() => { const d = [...document.querySelectorAll('.lt-runner:not([hidden]) .lt-card.lt-dim')]; return d.length === DB.filter(x => x.c === 'A').length - document.querySelectorAll('.lt-runner:not([hidden]) .lt-card:not(.lt-dim)').length && d.every(e => e.offsetParent && +getComputedStyle(e).opacity < 0.5 && e.tabIndex === -1); }), 'non-matching parts stay on the runner but are dimmed and skipped by Tab');
  ok(await p.evaluate(() => document.querySelector('.lt-chip[data-sub="MELEE"]').classList.contains('on')), 'active chip is highlighted');
  ok(await p.evaluate(() => { const cs = [...document.querySelectorAll('.lt-runner[data-c="A"] .lt-card')], pos = e => { const r = e.getBoundingClientRect(); return r.top * 10000 + r.left; }, on = cs.filter(e => !e.classList.contains('lt-dim')), off = cs.filter(e => e.classList.contains('lt-dim')), mx = Math.max(...on.map(pos)), mn = Math.min(...off.map(pos)), ord = on.map(pos); return mx < mn && ord.every((v, k) => !k || v > ord[k - 1]); }), 'matching parts float to the top of the runner in their original order, dimmed parts below');
  await p.screenshot({ path: shots + '/v556-01-armament-melee-chip.png' });
  await p.locator('.lt-chiprow:not([hidden]) .lt-chip[data-sub=""]').click();
  ok((await vis()).length === nA, 'ALL chip restores the full tab');
  await p.locator('button[onclick="tab(\'D\')"]').click();
  v = await vis();
  ok(v.length === await p.evaluate(() => DB.filter(x => x.c === 'D').length) && v.every(x => x.c === 'D'), 'DEFENSIVE SYSTEMS tab shows only its records');
  ok(await p.evaluate(() => [...document.querySelectorAll('.lt-chiprow')].filter(r => !r.hidden).map(r => r.dataset.c).join()) === 'D', 'only the active tab\'s chip row is shown');
  await p.locator('button[onclick="tab(\'A\')"]').click();
  // 3) search covers every tab
  const dName = await p.evaluate(() => DB.find(x => x.c === 'U').n);
  await p.locator('#catq').fill(dName);
  v = await vis();
  ok(v.some(x => x.c === 'U') && await p.evaluate(() => S.tab) === 'A', `search on the ARMAMENT tab finds the UTILITY record "${dName}"`, v);
  ok(await p.evaluate(() => ['A', 'D'].every(c => { const r = document.querySelector(`.lt-runner[data-c="${c}"]`); return !r.hidden && r.classList.contains('lt-zero') && r.querySelector('.lt-mc').textContent === '0 MATCH' && getComputedStyle(r.querySelector('.lt-sprue')).display === 'none'; })), 'runners with no match collapse to their header showing 0 MATCH');
  await p.locator('#catq').fill('HEAT');
  v = await vis();
  const cats = [...new Set(v.map(x => x.c))];
  const expect = await p.evaluate(() => DB.filter(x => 'ADU'.includes(x.c) && ltText(x).includes('HEAT')).length);
  ok(cats.length >= 2 && v.length === expect, `search "HEAT" lists ${v.length} matches from ${cats.join('/')}`, { cats, n: v.length, expect });
  ok(await p.evaluate(() => [...document.querySelectorAll('.lt-runner')].filter(e => !e.hidden && !e.classList.contains('lt-zero')).length) === cats.length, 'search shows every runner that has a match');
  ok(await p.evaluate(() => [...document.querySelectorAll('.lt-card:not(.lt-dim)')].filter(e => e.offsetParent).every(e => e.closest('.lt-runner').querySelector('.lt-kn').textContent === TABS[e.dataset.c])), 'each match sits on its category runner, labelled by the kit box');
  ok(/MATCHES \/\/ ALL BAYS/.test(await p.locator('#catn').textContent()), 'match counter says the search covers all categories');
  await p.locator('.lt-card:not(.lt-dim):visible').first().click();
  await p.screenshot({ path: shots + '/v556-02-search-all-categories.png' });
  await p.locator('#catq').press('Escape');
  ok((await vis()).length === nA && await p.evaluate(() => [...document.querySelectorAll('.lt-runner')].filter(e => !e.hidden).map(e => e.dataset.c).join() === 'A'), 'Escape clears the search and returns to the tab');
  // 4) detail pane
  const cheapA = () => p.evaluate(() => DB.map((x, j) => [x, j]).filter(([x]) => x.c === 'A' && !TIER[x.n]).sort((a, b) => a[0].e - b[0].e).map(a => a[1]));
  const [pick, kb] = await cheapA();
  const n0 = await p.evaluate(() => S.items.length);
  await p.locator(`.lt-card[data-i="${pick}"]`).click();
  const pane = await p.evaluate(i => { const x = DB[i], t = document.getElementById('ltpane').innerText; return { pick: S.catPick, sel: document.querySelector('.lt-card.sel')?.dataset.i, name: t.includes(x.n), stats: [...document.querySelectorAll('#ltpane .lt-stats dt')].length >= 2 && t.includes(x.s.split(' ')[0].split(':')[1]), role: t.includes(x.r), add: !!document.querySelector('#ltpane .lt-add'), items: S.items.length }; }, pick);
  ok(pane.pick === pick && +pane.sel === pick && pane.name && pane.stats && pane.role && pane.add, 'clicking a card shows its full record in the right-hand detail pane with ADD', pane);
  ok(pane.items === n0, 'selecting a card does not install it');
  ok(await p.evaluate(() => { const g = document.getElementById('ltgrid').getBoundingClientRect(), d = document.getElementById('ltpane').getBoundingClientRect(); return d.left >= g.right - 1; }), 'detail pane sits to the right of the grid');
  await p.screenshot({ path: shots + '/v556-03-detail-pane.png' });
  // 4b) a selection hidden by a chip, a search or a tab change clears the pane (ADD cannot add an unseen record)
  const paneCleared = () => p.evaluate(() => ({ pick: S.catPick, add: !!document.querySelector('#ltpane .lt-add'), sel: document.querySelectorAll('.lt-card.sel').length, ph: /SELECT AN ITEM/.test(document.getElementById('ltpane').innerText) }));
  const isClear = r => r.pick === null && !r.add && r.sel === 0 && r.ph;
  const pickSub = await p.evaluate(i => subtypeKey(subtypeOf(DB[i])), pick);
  const otherSub = await p.evaluate(s => [...document.querySelectorAll('.lt-chiprow:not([hidden]) .lt-chip')].map(b => b.dataset.sub).find(x => x && x !== s), pickSub);
  await p.locator(`.lt-chiprow:not([hidden]) .lt-chip[data-sub="${otherSub}"]`).click();
  let pc = await paneCleared();
  ok(isClear(pc) && await p.evaluate(i => { const e = document.querySelector(`.lt-card[data-i="${i}"]`); return !!e.offsetParent && e.classList.contains('lt-dim'); }, pick), `chip ${otherSub} dimming the selected part clears the manual page and removes ADD`, pc);
  await p.locator('.lt-chiprow:not([hidden]) .lt-chip[data-sub=""]').click();
  await p.locator(`.lt-card[data-i="${pick}"]`).click();
  ok((await paneCleared()).add, 'card re-selected after it is visible again');
  await p.locator('#catq').fill('ZZQX-NO-SUCH-RECORD');
  pc = await paneCleared();
  ok(isClear(pc) && await p.evaluate(() => !document.getElementById('ltnone').hidden), 'a search with no match clears the pane and removes ADD', pc);
  await p.locator('#catq').press('Escape');
  await p.locator(`.lt-card[data-i="${pick}"]`).click();
  await p.locator('button[onclick="tab(\'U\')"]').click();
  pc = await paneCleared();
  ok(isClear(pc), 'changing tab away from the selected card clears the pane', pc);
  await p.locator('button[onclick="tab(\'A\')"]').click();
  await p.locator(`.lt-card[data-i="${pick}"]`).click();
  ok(await p.evaluate(() => S.items.length) === n0, 'none of the hide/clear steps installed anything');
  ok(await p.evaluate(() => document.getElementById('catq').scrollWidth <= document.getElementById('catq').clientWidth + 1 || document.getElementById('catq').placeholder === 'name, class, stat, tag  (/)'), 'search placeholder is the short form');
  // 4c) pass 3 layout: uniform tiles, wide pane, ADD visible (1280 and 1920)
  for (const [w, hh] of [[1280, 800], [1920, 1080]]) {
    await p.setViewportSize({ width: w, height: hh }); await p.waitForTimeout(250);
    await p.locator(`.lt-card[data-i="${pick}"]`).click();
    const L = await p.evaluate(() => { const vis = [...document.querySelectorAll('.lt-card')].filter(e => e.offsetParent && !e.classList.contains('lt-dim')), cs = vis.map(e => e.getBoundingClientRect()), hs = [...new Set(cs.map(r => Math.round(r.height)))], wrap = document.querySelector('.lt-wrap').getBoundingClientRect(), pn = document.getElementById('ltpane').getBoundingClientRect(), a = document.querySelector('#ltpane .lt-add').getBoundingClientRect(), con = document.getElementById('con').getBoundingClientRect(), sh = document.getElementById('sh').getBoundingClientRect();
      const vb = vis.filter(e => /VIBROBLADE/.test(e.querySelector('.nm').textContent)).map(e => { const t = e.querySelector('.lt-top'); return t.scrollWidth <= t.clientWidth + 1 && getComputedStyle(t).textOverflow !== 'ellipsis' && e.scrollHeight <= e.clientHeight + 1 && t.getBoundingClientRect().bottom <= e.getBoundingClientRect().bottom; });
      const clip = vis.filter(e => { const k = e.querySelector('.lt-top'), r = k.getBoundingClientRect(), c = e.getBoundingClientRect(); return k.scrollWidth > k.clientWidth + 1 || r.bottom > c.bottom - 1 || e.scrollHeight > e.clientHeight + 1; }).map(e => e.querySelector('.nm').textContent);
      const hdr = [...document.querySelectorAll('#sh .shh')].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(), t = e.querySelector('.shtl'); return { t: e.textContent.slice(0, 30), ok: t.scrollWidth <= t.clientWidth + 1 && [...e.children].every(c => c.getBoundingClientRect().right <= r.right + 1 && c.getBoundingClientRect().width > 0) }; });
      return { hs, ks: vis.every(e => e.querySelector('.lt-ks') && e.querySelector('.lt-ks').textContent.trim().length > 0), n: vis.length, vb, clip, hdr: hdr.filter(x => !x.ok), nh: hdr.length, cols: getComputedStyle(document.querySelector('.lt-runner:not([hidden]) .lt-sprue')).gridTemplateColumns.split(' ').length, pane: Math.round(pn.width), split: +(con.width / (con.width + sh.width)).toFixed(3), add: a.height > 20 && a.top >= 0 && a.bottom <= innerHeight && a.width >= pn.width - 30 && (() => { const st = document.querySelector('#ltpane .lt-step').getBoundingClientRect(), el = document.elementFromPoint(st.left + 20, st.top + st.height / 2); return !!el && !!el.closest('#ltpane'); })(), tile: Math.round(cs[0].width) + 'x' + Math.round(cs[0].height) }; });
    console.log('LAYOUT ' + w + ' ' + JSON.stringify(L));
    ok(L.hs.length === 1 && L.hs[0] <= 64 && L.ks, `${w}: every part is the same height, <= 64px, with a stat row (${L.tile})`, L);
    ok(L.vb.length >= 3 && L.vb.every(Boolean), `${w}: full VIBROBLADE names visible on up to 2 lines, no ellipsis`, L.vb);
    ok(!L.clip.length, `${w}: every full part name fits inside its part`, L.clip);
    ok(L.cols === (w >= 1600 ? 3 : 2), `${w}: ${L.cols} tile columns`, L.cols);
    ok(w > 1280 || L.pane >= 330, `${w}: detail pane ${L.pane}px (about 340 at 1280)`, L.pane);
    ok(Math.abs(L.split - 0.62) < 0.02, `${w}: builder/FRAME LOADOUT split ${Math.round(L.split * 100)}/${100 - Math.round(L.split * 100)}`, L.split);
    ok(L.nh >= 3 && !L.hdr.length, `${w}: FRAME LOADOUT section headers and counters not clipped (${L.nh})`, L.hdr);
    ok(L.add, `${w}: full-width ADD TO MECH is visible in the pane`, L);
    if (w === 1280) {
      await p.screenshot({ path: shots + '/v556-14-schematic-1280.png' });
      await p.evaluate(() => { S.catPick = null; catFilter(); document.getElementById('ltpane').innerHTML = ltPane(); document.querySelectorAll('.lt-card.sel').forEach(e => e.classList.remove('sel')); });
      await p.locator('#con').evaluate(e => e.scrollTop = 0);
      await p.screenshot({ path: shots + '/v556-13-armory-1280.png' });
    } else {
      await p.locator('#catq').fill('HEAT'); await p.locator('.lt-card:not(.lt-dim):visible').first().click(); await p.waitForTimeout(150);
      await p.screenshot({ path: shots + '/v556-15-search-1920.png' });
      await p.locator('#catq').press('Escape');
    }
  }
  await p.locator(`.lt-card[data-i="${pick}"]`).click();
  // 5) ADD uses the existing install path
  await p.evaluate(() => { window.__inst = 0; const o = window.inst; window.inst = function (...a) { window.__inst++; return o.apply(this, a); }; });
  await p.locator('#ltpane .lt-add').click();
  const add = await p.evaluate(i => { const x = variant(i, null), y = S.items[S.items.length - 1]; return { n: S.items.length, same: !!y && y.n === x.n && y.e === x.e && y.s === x.s && y.c === x.c, inst: window.__inst, sel: S.sel, msg: (document.getElementById('log') || document.body).innerText.includes('LOADOUT ENTRY COMMITTED') }; }, pick);
  ok(add.n === n0 + 1 && add.same && add.inst === 1 && add.sel === null, 'ADD installs the selected record through inst() exactly once', add);
  ok(await p.evaluate(() => document.getElementById('ltpane').innerText.includes('NOW ')), 'detail pane stays on the record after ADD');
  ok(await p.evaluate(i => { const e = document.querySelector(`.lt-card[data-i="${i}"]`); return e.classList.contains('lt-on') && /LINKED/.test(e.querySelector('.lt-link').textContent) && /LINKED/.test(document.querySelector('#ltpane .lt-link').textContent); }, pick), 'the installed item shows a LINKED light on the item and in the pane');
  ok(await p.evaluate(() => window.__ltSnips === 1 && !document.querySelector('.lt-add.lt-charge')), 'reduced motion: no INSTALL charge animation');
  ok(await p.evaluate(() => document.querySelectorAll('#ltpane svg.lt-xpl circle').length >= 2 && /SCHEMATIC/.test(document.querySelector('#ltpane .lt-step').textContent)) && (await p.locator('#ltpane .lt-add').innerText()).startsWith('INSTALL'), 'schematic pane shows callout leader lines and the INSTALL button');
  ok(await p.evaluate(i => { const q = document.getElementById('lttick').textContent; return q.startsWith('QM> ') && q === ltQuip(DB[i]) && q.includes(ltNote(DB[i], parseInt(ltPN(DB[i], i).slice(2), 10))); }, pick), 'quartermaster ticker shows the deterministic quip for the selection');
  ok(await p.evaluate(() => { const ks = Object.keys(LT_NOTES); return ks.every(k => LT_NOTES[k].length === 2 && LT_NOTES[k][0] !== LT_NOTES[k][1]) && DB.filter(x => x.c === 'A').every((x, j) => ltNote(x, j) === ltNote(x, j)) && /QUERY ALL BAYS/.test(document.getElementById('catq').labels[0].textContent) && [...document.querySelectorAll('.lt-runner[data-c="A"] .lt-card')].every(e => { const g = [...e.querySelectorAll('.lt-g i')].map(i => parseFloat(i.style.getPropertyValue('--g'))); return g.length === 2 && g.every(v => v >= 0 && v <= 100); }) && ['DMG', 'RNG'].every(k => [...document.querySelectorAll('.lt-runner[data-c="A"] .lt-g')].some(g => g.querySelector('.l').textContent === k && g.querySelector('i').style.getPropertyValue('--g') === '100%')); }), 'two stat gauges per item, scaled within the category (top item = 100%), plus quip table and QUERY label');
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  // keyboard Enter on a card still installs directly (unchanged)
  await p.locator(`.lt-card[data-i="${kb}"]`).focus(); await p.keyboard.press('Enter');
  ok(await p.evaluate(() => S.items.length) === n0 + 2, 'Enter on a focused card installs it, as before');
  ok(await p.evaluate(() => !!document.querySelector('#ltpane .lt-add.lt-charge')), 'with motion allowed, INSTALL plays its charge-fill');
  ok(await p.evaluate(() => { const a = [...document.querySelectorAll('#ltpane .lt-add')].flatMap(e => e.getAnimations({ subtree: true })); return a.length >= 1 && a.every(x => x.effect.getComputedTiming().endTime < 250); }), 'INSTALL charge animation finishes in under 250ms');
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.locator(`.lt-card[data-i="${kb}"]`).dblclick();
  ok(await p.evaluate(() => S.items.length) === n0 + 3, 'double-click installs once (armament stacks, as before)');
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await p.locator(`.lt-card[data-i="${pick}"]`).click();
  await p.locator('#ltpane .lt-add').click(); await p.locator('#ltpane .lt-add').click();
  ok(await p.evaluate(() => S.items.length) === n0 + 5, 'rapid double INSTALL during the charge installs both (stackable armament)');
  await p.emulateMedia({ reducedMotion: 'reduce' });
  // non-stackable refusal unchanged
  await p.evaluate(() => { S.items = []; R(); });
  const nonA = await p.evaluate(() => (() => { let b = -1; DB.forEach((x, j) => { if (x.c === 'D' && !TIER[x.n] && (b < 0 || x.e < DB[b].e)) b = j; }); return b; })());
  if (nonA >= 0) {
    await p.locator('button[onclick="tab(\'D\')"]').click();
    await p.locator(`.lt-card[data-i="${nonA}"]`).click(); await p.locator('#ltpane .lt-add').click();
    const m1 = await p.evaluate(() => S.items.length);
    await p.locator('#ltpane .lt-add').click();
    ok(await p.evaluate(() => S.items.length) === m1 && /NON-STACKABLE|INSTALL REFUSED/.test(await p.evaluate(() => document.body.innerText)), 'second ADD of a non-stackable record is refused, as before');
  }
  // tiered: ADD opens the existing tier menu, then INSTALL
  const tierI = await p.evaluate(() => DB.findIndex(x => 'ADU'.includes(x.c) && TIER[x.n] && TIER[x.n][0][0] <= cap()));
  if (tierI >= 0) {
    await p.evaluate(i => { S.items = []; tab(DB[i].c); }, tierI);
    await p.locator(`.lt-card[data-i="${tierI}"]`).click(); await p.locator('#ltpane .lt-add').click();
    ok(await p.evaluate(i => S.sel === i && S.tier === null && /SELECT EQUIPMENT TIER/.test(document.getElementById('out').innerText), tierI), 'ADD on a tiered record opens the existing tier menu');
    const m2 = await p.evaluate(() => S.items.length);
    await p.evaluate(i => pickT(i, 0), tierI); await p.evaluate(i => inst(i), tierI);
    ok(await p.evaluate(([i, m2]) => S.items.length === m2 + 1 && S.items[S.items.length - 1].e === TIER[DB[i].n][0][0] && S.sel === null && !!document.getElementById('ltgrid'), [tierI, m2]), 'tier pick + INSTALL adds the tier variant and returns to the grid');
  }
  // numbered selection still follows the listGroups order
  await p.evaluate(() => tab('A'));
  ok(await p.evaluate(() => { const L = listGroups('A').flatMap(g => g.items), c = [...document.querySelectorAll('.lt-card[data-c="A"]')]; return c.every((e, k) => +e.dataset.i === L[k] && e.dataset.pn === 'A-' + String(k + 1).padStart(2, '0')); }), 'card numbers match the numbered-selection order');
  ok(await p.evaluate(() => { S.view = 'login'; R(); const c = getComputedStyle(document.querySelector('main')).gridTemplateColumns.split(' ').map(parseFloat); return !document.body.classList.contains('lt-open') && Math.abs(c[0] - c[1]) < 2; }), 'leaving the builder restores the normal 50/50 split');
  ok(!errs.length, 'no page errors', errs);
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
