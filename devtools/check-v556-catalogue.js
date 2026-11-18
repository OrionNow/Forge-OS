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
  const vis = () => p.evaluate(() => [...document.querySelectorAll('.lt-card')].filter(e => !e.hidden && e.offsetParent).map(e => ({ i: +e.dataset.i, c: e.dataset.c, sub: e.dataset.sub })));
  let v = await vis();
  const nA = await p.evaluate(() => DB.filter(x => x.c === 'A').length);
  ok(v.length === nA && v.every(x => x.c === 'A'), `ARMAMENT tab shows all ${nA} armament records and only those`, v.length);
  ok(await p.evaluate(() => { const c = document.querySelector('.lt-card:not([hidden])'); return c.querySelectorAll('.lt-ks .lt-k').length >= 1 && /EP/.test(c.querySelector('.ep').textContent) && c.getBoundingClientRect().height < 90; }), 'grid cards are compact: name, EP and key stats');
  ok(await p.evaluate(() => getComputedStyle(document.getElementById('ltgrid')).gridTemplateColumns.split(' ').length >= 2), 'cards are laid out as a multi-column grid');
  // 2) chips = real subtypes of the tab
  const chips = await p.evaluate(() => ({ ui: [...document.querySelectorAll('.lt-chiprow:not([hidden]) .lt-chip')].map(b => b.dataset.sub).filter(Boolean), data: [...new Set(DB.filter(x => x.c === 'A').map(x => subtypeKey(subtypeOf(x) || 'UNSPECIFIED')))] }));
  ok(JSON.stringify(chips.ui.slice().sort()) === JSON.stringify(chips.data.slice().sort()), 'ARMAMENT chips are its real subtypes ' + chips.ui.join(','), chips);
  await p.locator('.lt-chiprow:not([hidden]) .lt-chip[data-sub="MELEE"]').click();
  v = await vis();
  const nMel = await p.evaluate(() => DB.filter(x => x.c === 'A' && subtypeKey(subtypeOf(x)) === 'MELEE').length);
  ok(v.length === nMel && v.every(x => x.sub === 'MELEE'), `MELEE chip filters to its ${nMel} records`, v);
  ok(await p.evaluate(() => document.querySelector('.lt-chip[data-sub="MELEE"]').classList.contains('on')), 'active chip is highlighted');
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
  await p.locator('#catq').fill('HEAT');
  v = await vis();
  const cats = [...new Set(v.map(x => x.c))];
  const expect = await p.evaluate(() => DB.filter(x => 'ADU'.includes(x.c) && ltText(x).includes('HEAT')).length);
  ok(cats.length >= 2 && v.length === expect, `search "HEAT" lists ${v.length} matches from ${cats.join('/')}`, { cats, n: v.length, expect });
  ok(await p.evaluate(() => [...document.querySelectorAll('.lt-cat')].filter(e => !e.hidden).length) === cats.length, 'search results are grouped under category headers');
  ok(await p.evaluate(() => { const c = document.querySelector('.lt-card:not([hidden]) .lt-cc'); return c && getComputedStyle(c).display !== 'none' && /\[(ARMAMENT|DEFENSIVE SYSTEMS|UTILITY)\]/.test(c.textContent); }), 'each search result card is labelled with its category');
  ok(/MATCHES \/\/ ALL CATEGORIES/.test(await p.locator('#catn').textContent()), 'match counter says the search covers all categories');
  await p.locator('.lt-card:not([hidden])').first().click();
  await p.screenshot({ path: shots + '/v556-02-search-all-categories.png' });
  await p.locator('#catq').press('Escape');
  ok((await vis()).length === nA && await p.evaluate(() => [...document.querySelectorAll('.lt-cat')].every(e => e.hidden)), 'Escape clears the search and returns to the tab');
  // 4) detail pane
  const cheapA = () => p.evaluate(() => DB.map((x, j) => [x, j]).filter(([x]) => x.c === 'A' && !TIER[x.n]).sort((a, b) => a[0].e - b[0].e).map(a => a[1]));
  const [pick, kb] = await cheapA();
  const n0 = await p.evaluate(() => S.items.length);
  await p.locator(`.lt-card[data-i="${pick}"]`).click();
  const pane = await p.evaluate(i => { const x = DB[i], t = document.getElementById('ltpane').innerText; return { pick: S.catPick, sel: document.querySelector('.lt-card.sel')?.dataset.i, name: t.includes(x.n), stats: t.includes(fmt(x.s, 0).split(' | ')[0]), role: t.includes(x.r), add: !!document.querySelector('#ltpane .lt-add'), items: S.items.length }; }, pick);
  ok(pane.pick === pick && +pane.sel === pick && pane.name && pane.stats && pane.role && pane.add, 'clicking a card shows its full record in the right-hand detail pane with ADD', pane);
  ok(pane.items === n0, 'selecting a card does not install it');
  ok(await p.evaluate(() => { const g = document.getElementById('ltgrid').getBoundingClientRect(), d = document.getElementById('ltpane').getBoundingClientRect(); return d.left >= g.right - 1; }), 'detail pane sits to the right of the grid');
  await p.screenshot({ path: shots + '/v556-03-detail-pane.png' });
  // 5) ADD uses the existing install path
  await p.evaluate(() => { window.__inst = 0; const o = window.inst; window.inst = function (...a) { window.__inst++; return o.apply(this, a); }; });
  await p.locator('#ltpane .lt-add').click();
  const add = await p.evaluate(i => { const x = variant(i, null), y = S.items[S.items.length - 1]; return { n: S.items.length, same: !!y && y.n === x.n && y.e === x.e && y.s === x.s && y.c === x.c, inst: window.__inst, sel: S.sel, msg: (document.getElementById('log') || document.body).innerText.includes('LOADOUT ENTRY COMMITTED') }; }, pick);
  ok(add.n === n0 + 1 && add.same && add.inst === 1 && add.sel === null, 'ADD installs the selected record through inst() exactly once', add);
  ok(await p.evaluate(() => document.getElementById('ltpane').innerText.includes('NOW ')), 'detail pane stays on the record after ADD');
  // keyboard Enter on a card still installs directly (unchanged)
  await p.locator(`.lt-card[data-i="${kb}"]`).focus(); await p.keyboard.press('Enter');
  ok(await p.evaluate(() => S.items.length) === n0 + 2, 'Enter on a focused card installs it, as before');
  await p.locator(`.lt-card[data-i="${kb}"]`).dblclick();
  ok(await p.evaluate(() => S.items.length) === n0 + 3, 'double-click installs once (armament stacks, as before)');
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
  ok(await p.evaluate(() => { const L = listGroups('A').flatMap(g => g.items), c = [...document.querySelectorAll('.lt-card[data-c="A"]')]; return c.every((e, k) => +e.dataset.i === L[k] && e.querySelector('.v').textContent === '[' + (k + 1) + ']'); }), 'card numbers match the numbered-selection order');
  ok(!errs.length, 'no page errors', errs);
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
