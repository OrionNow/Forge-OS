// FORGE-OS 5.5 two-seat check (fresh dev server). 5.2.1 cases (slash commands) + console chat, '/' gating, roll cards. Bug A (hits survive sync), RESET-LOCAL / RESYNC confirm, 413 path, RoF cap.
const { chromium } = require('/workspace/pw/node_modules/playwright-core');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8080';
const shots = process.argv[3] || '/workspace/forge-os/out-v5.5/shots';
const fx = fs.readFileSync('/workspace/forge-os/tests/musha-brittle.manifest.txt', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  const seat = async (name) => {
    const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/status of (409|413)|ERR_FAILED|net::/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
    await p.goto(base + '/terminal.html'); await p.waitForTimeout(1500);
    await p.evaluate(() => login(6)); await p.waitForTimeout(300);
    await p.fill('#mpname', name); await p.evaluate(() => mpAuth());
    await p.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 });
    return { ctx, p };
  };
  const logHas = async (p, re, ms = 9000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (re.test(await p.evaluate(() => document.getElementById('log').textContent))) return true; await wait(300); } return false; };
  const H = await seat('HOSTA');
  await H.p.evaluate(async (fx) => { await loadManifestFile(new File([fx], 'h.txt')); }, fx); await wait(1500);
  const P = await seat('PILOTB');
  await P.p.evaluate(async (fx) => { await loadManifestFile(new File([fx.replace('MSH-01 / MUSHA TEST', 'PB-7 / KAGE')], 'p.txt')); }, fx); await wait(2500);
  // arm the pilot unit: a ranged weapon (ROF 5) and a ROF 1 copy, both held
  const k = await P.p.evaluate(() => {
    const S = Forge.state(); const rng = DB.find(x => x.c == 'A' && hasRng(x) && /ROF:5/.test(x.s) && /AMMO:/.test(x.s) && !x.th);
    const one = Object.assign(structuredClone(rng), { mount: 'LH', s: rng.s.replace(/ROF:\S+/, 'ROF:1') });
    S.items.push(Object.assign(structuredClone(rng), { mount: 'RH' }), one);
    S.pilot = Object.assign({}, S.pilot, { [wKey(rng)]: '14', pil: '14' }); S.dmgN = 5; S.view = 'sortie'; Forge.render();
    const W = weapons(); return [W.findIndex(w => w.mount === 'RH' && hasRng(w)), W.findIndex(w => w.mount === 'LH' && hasRng(w))];
  });
  await wait(2500);
  // Bug A: ATK success, wait for syncs (weapon objects replaced), DMG uses the hits
  const a = await P.p.evaluate((k) => { const W = weapons(); awBind(k, 1); Forge.state().dmgN = 5; W[k].am = 30; const R0 = Math.random; Math.random = () => 0; atkRoll(k); Math.random = R0; return [Forge.state().hitq && Forge.state().hitq[k], W[k]]; }, k[0]);
  await wait(3000);
  const a2 = await P.p.evaluate((k) => { const W = weapons(); const said = []; const _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; rollW(k); say = _s; return { replaced: true, rolls: Forge.state().rolls[k].atk.length, noRec: said.some(m => /NO ATTACK ROLL RECORDED/.test(m)) }; }, k[0]);
  ok(a[0] && a[0].n >= 2 && a2.rolls === a[0].n && !a2.noRec, 'Bug A: ATK success, 3s of sync, DMG rolls the stored hits ' + JSON.stringify([a[0], a2]));
  const hostQ = await H.p.evaluate(() => { const sh = Forge.state().sheets.find(s => s.d && /^PB-7\b/.test(s.d.id)); return sh && sh.d.hitq; });
  ok(hostQ && Object.keys(hostQ).length, 'hit queue is synced sheet state (host copy has it) ' + JSON.stringify(hostQ));
  await wait(2500);
  const used = await P.p.evaluate((k) => { const said = []; const _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; const n0 = (Forge.state().rolls[k] || {}).atk; rollW(k); say = _s; return said.some(m => /NO HITS TO ROLL/.test(m) && /already rolled/.test(m)); }, k[0]);
  ok(used, 'DMG after the hits are used up refuses (after a sync)');
  await P.p.evaluate((k) => { const R0 = Math.random; Math.random = () => 0.999; atkRoll(k); Math.random = R0; }, k[0]);
  await wait(3000);
  const miss = await P.p.evaluate((k) => { const said = []; const _s = say; say = function (m) { said.push(String(m)); return _s.apply(this, arguments) }; rollW(k); say = _s; return said.some(m => /NO HITS TO ROLL/.test(m) && /missed/.test(m)); }, k[0]);
  ok(miss, 'ATK miss, 3s of sync, DMG refuses');
  // RoF cap on the live table: ROF 1 weapon, targeter RoF 5 -> 1 hit, no RoF bonus
  const cap = await P.p.evaluate((k) => { const W = weapons(); W[k].am = 30; const R0 = Math.random; Math.random = () => 0; atkRoll(k); Math.random = R0; return [effRof(W[k]), Forge.state().hitq[k].n]; }, k[1]);
  ok(cap[0] === 1 && cap[1] === 1, 'RoF cap: ROF 1 weapon with targeter RoF 5 -> 1 round, 1 hit ' + JSON.stringify(cap));
  // RESET-LOCAL: edit then reset at once -> edit is sent first, then the command asks for CONFIRM
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '17' }); Forge.render(); exec('/mp reset-local'); });
  ok(await logHas(P.p, /MP RESET-LOCAL CONFIRM/), 'RESET-LOCAL asks for confirmation');
  ok(await P.p.evaluate(() => Forge.state().view) === 'sortie', 'RESET-LOCAL without CONFIRM keeps the seat');
  const hs17 = await H.p.evaluate(() => { const sh = Forge.state().sheets.find(s => s.d && /^PB-7\b/.test(s.d.id)); return sh.d.pilot.pil; });
  ok(hs17 === '17', 'the pending edit was flushed before the prompt (host sees 17): ' + hs17);
  await P.p.evaluate(() => exec('/mp reset-local confirm')); await wait(2500);
  ok(await P.p.evaluate(() => Forge.state().view) === 'mpw', 'RESET-LOCAL CONFIRM releases the seat');
  await P.p.fill('#mpname', 'PILOTB'); await P.p.evaluate(() => mpAuth());
  await P.p.waitForFunction(() => !document.getElementById('mpveil'), null, { timeout: 15000 }); await wait(2500);
  ok(await P.p.evaluate(() => Forge.state().pilot.pil) === '17', 'Piloting 17 survives RESET-LOCAL (was 15 in v5.2.0)');
  // RESYNC: online -> sends first, nothing to drop
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '18' }); Forge.render(); exec('/mp resync'); });
  await wait(3500);
  const rs = [await P.p.evaluate(() => Forge.state().pilot.pil), await H.p.evaluate(() => Forge.state().sheets.find(s => s.d && /^PB-7\b/.test(s.d.id)).d.pilot.pil)];
  ok(rs[0] === '18' && rs[1] === '18', 'RESYNC sends the pending edit first, no data lost ' + JSON.stringify(rs));
  // RESYNC with the link down -> refuses to drop without CONFIRM
  await P.ctx.route('**/api/forge', r => r.abort());
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '19' }); Forge.render(); exec('/mp resync'); });
  ok(await logHas(P.p, /UNSENT: .*MP RESYNC CONFIRM/), 'RESYNC with unsent edits asks for CONFIRM');
  ok(await P.p.evaluate(() => Forge.state().pilot.pil) === '19', 'unconfirmed RESYNC kept the local edit');
  await P.p.evaluate(() => exec('/mp reset-local confirm'));
  ok(await logHas(P.p, /RESET-LOCAL REFUSED :: UNSENT/), 'RESET-LOCAL CONFIRM refuses while edits are unsent (FORCE needed)');
  await P.ctx.unroute('**/api/forge'); await wait(4000);
  const hs19 = await H.p.evaluate(() => Forge.state().sheets.find(s => s.d && /^PB-7\b/.test(s.d.id)).d.pilot.pil);
  ok(hs19 === '19', 'edit sent once the link is back: ' + hs19);
  // 413: an oversized update is reported, trimmed and retried with backoff
  let pushes = 0, big = 0;
  P.p.on('request', r => { if (/api\/forge/.test(r.url()) && /"op":"push"/.test(r.postData() || '')) { pushes++; if ((r.postData() || '').length > 1.5e6) big++; } });
  await P.p.evaluate(() => { const S = Forge.state(); S.importReport = { warnings: ['X'.repeat(1600000)] }; Forge.render(); });
  ok(await logHas(P.p, /LINK REFUSED AN UPDATE \(TOO LARGE\)/), '413 shown as LINK REFUSED AN UPDATE (TOO LARGE)');
  await wait(6000);
  const st = await P.p.evaluate(() => [!!Forge.state().importReport, window.__forgeMP ? 1 : 0]);
  ok(pushes <= 8 && big <= 2, 'backoff: ' + pushes + ' pushes, ' + big + ' oversized in ~8s (was 32 in 6s)');
  ok(!st[0], 'second refusal dropped the oversized import report');
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { pil: '12' }); Forge.render(); }); await wait(3500);
  ok(await H.p.evaluate(() => Forge.state().sheets.find(s => s.d && /^PB-7\b/.test(s.d.id)).d.pilot.pil) === '12', 'link recovers after the trim (next edit lands)');

  // ---- v5.3 console: chat round-trip (color + escaping), '/' gating, roll cards with structured data ----
  const typeIn = async (p, t) => { await p.locator('#CI').focus(); await p.locator('#CI').fill(t); await p.keyboard.press('Enter'); };
  const nasty = 'hello <b>x</b> & <img src=x onerror="window.__x=1">';
  await typeIn(H.p, nasty);
  const got = async (p, re, ms = 9000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await p.evaluate((src) => { const re = new RegExp(src); const c = [...document.querySelectorAll('#log .chat')].reverse().find(x => re.test(x.textContent)); return c ? { txt: c.textContent, col: getComputedStyle(c.querySelector('.chn')).color, html: c.innerHTML } : null; }, re.source); if (v) return v; await wait(300); } return null; };
  const hc = await got(H.p, /^HOSTA.*: hello/), pc = await got(P.p, /^HOSTA.*: hello/);
  const px = await P.p.evaluate(() => ({ x: window.__x, img: !!document.querySelector('#log img, #log .chat b'), fg: getComputedStyle(document.body).color }));
  ok(hc && pc && pc.txt.endsWith(nasty), 'chat round-trip: host line reaches the pilot as text ' + JSON.stringify(pc && pc.txt));
  ok(pc && !px.img && px.x === undefined, 'chat is escaped on the remote seat (no <b>/<img>, no script) ' + JSON.stringify(px));
  ok(pc && hc && pc.col === hc.col && pc.col !== px.fg, "chat shown in the sender's seat color on both seats " + JSON.stringify([hc && hc.col, pc && pc.col]));
  await typeIn(P.p, 'status');
  const hs = await got(H.p, /^PILOTB.*: status$/);
  ok(!!hs, "pilot text without '/' arrives at the host as chat " + JSON.stringify(hs && hs.txt));
  ok(hs && hs.col !== px.fg && hs.col !== hc.col, 'untinted pilot gets a default seat color, distinct from system text and the host ' + JSON.stringify([hs && hs.col, px.fg, hc && hc.col]));
  const nW = await P.p.evaluate(() => document.getElementById('log').textContent.length);
  await typeIn(P.p, '/mp whoami');
  ok(await logHas(P.p, /YOUR UNITS ::/), "'/mp whoami' runs as a command");
  await wait(2500);
  ok(!(await got(H.p, /mp whoami/, 1500)), "'/mp whoami' is not sent as chat");
  const seen = await H.p.evaluate(() => [...document.querySelectorAll('#log .rc')].map(e => e.dataset.rcid));
  await P.p.evaluate((k) => { const W = weapons(); awBind(k, 1); W[k].am = 30; Forge.state().dmgN = 5; const R0 = Math.random; Math.random = () => 0; atkRoll(k); Math.random = R0; }, k[0]);
  const card = async (p, re, ms = 10000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await p.evaluate(([src, seen]) => { const re = new RegExp(src); const els = [...document.querySelectorAll('#log .rc')].filter(x => !seen.includes(x.dataset.rcid) && re.test(x.textContent)); const el = els[els.length - 1]; return el ? { id: el.dataset.rcid, txt: el.textContent, exp: el.getAttribute('aria-expanded') } : null; }, [re.source, seen]); if (v) return v; await wait(300); } return null; };
  const hcard = await card(H.p, /^PILOTB.* \/ PB-7 .* · .* · CRIT SUCCESS · \d+ HITS/);
  ok(!!hcard && hcard.exp === 'false' && !/DMG/.test(hcard.txt), 'host sees the attack as one line: USER / FRAME · WEAPON · N HITS ' + JSON.stringify(hcard));
  if (hcard) {
    await H.p.locator(`#log .rc[data-rcid="${hcard.id}"]`).first().click(); await wait(300);
    const hd = await H.p.evaluate((id) => { const el = document.querySelector(`#log .rc[data-rcid="${id}"]`), d = el.nextElementSibling; return { exp: el.getAttribute('aria-expanded'), det: d && d.classList.contains('rcd') ? d.textContent : '', html: d ? d.innerHTML : '' }; }, hcard.id);
    ok(hd.exp === 'true' && /3d6 \[1, 1, 1\] = 3 vs SL \d+/.test(hd.det) && /DEGREES OF SUCCESS/.test(hd.det) && !/<(img|script|b)\b/i.test(hd.html), 'host expands the remote details from structured data ' + JSON.stringify(hd.det.slice(0, 160)));
    await P.p.evaluate((k) => rollW(k), k[0]);
    const t0 = Date.now(); let up = null;
    while (Date.now() - t0 < 9000) { up = await H.p.evaluate((id) => { const els = document.querySelectorAll(`#log .rc[data-rcid="${id}"]`), d = els[0].nextElementSibling; return { n: els.length, txt: els[0].textContent, det: d ? d.textContent : '' }; }, hcard.id); if (/DMG \d+/.test(up.txt)) break; await wait(300); }
    ok(up && up.n === 1 && /HITS · DMG \d+/.test(up.txt) && /DAMAGE 1\//.test(up.det) && /\[-\]$/.test(up.txt.trim()), 'damage folds into the same line on the host (and its open details) ' + JSON.stringify(up && [up.n, up.txt]));
  }
  await P.p.evaluate(() => { const R0 = Math.random; Math.random = () => 0.5; dodgeRoll(); Math.random = R0; });
  const dc = await card(H.p, /^PILOTB.* · DODGE · [+-]\d+ Do[SF]/);
  ok(!!dc, 'other rolls on the host: User / Mech / Action / DoS-DoF ' + JSON.stringify(dc && dc.txt));
  ok(await H.p.evaluate(() => document.querySelectorAll('#log .ts').length === 0), 'no visible timestamps on the remote log');
  await H.p.evaluate(() => { UI.cs = 1; applyUI(); }); await wait(300);
  await H.p.screenshot({ path: shots + '/v55-mp-console.png', clip: { x: 0, y: 0, width: 1600, height: 1000 } });

  // ---- v5.3.1: roll-line forgery, race on a live table ----
  if (hcard) {
    const before = await P.p.evaluate((id) => document.querySelector(`#log .rc[data-rcid="${id}"]`).textContent, hcard.id);
    await H.p.evaluate((id) => window.mpCard({ id, f: 'PB-7 / KAGE', a: 'FORGED', r: 'FORGED 99 HITS', o: 'bad', d: ['forged'] }, true), hcard.id);
    await wait(4000);
    const after = await P.p.evaluate((id) => [...document.querySelectorAll(`#log .rc[data-rcid="${id}"]`)].map(e => e.textContent), hcard.id);
    const hAfter = await H.p.evaluate((id) => [...document.querySelectorAll(`#log .rc[data-rcid="${id}"]`)].map(e => e.textContent), hcard.id);
    ok(after.length === 1 && after[0] === before && !/FORGED/.test(after.join()) && !/FORGED/.test(hAfter.join()), "another seat cannot rewrite a roll line (server drops it) " + JSON.stringify([after, hAfter]));
    const cl = await H.p.evaluate((id) => { const before = RC.get(id).r; const res = rcRemote({ id, up: true, a: 'X', r: 'FORGED', d: [] }, 'HOSTA', '', 'X', 'someone-else'); return [res, RC.get(id).r === before]; }, hcard.id);
    ok(cl[0] === null && cl[1], 'client also refuses a card update whose server-set author differs');
  }
  const seenR = await H.p.evaluate(() => [...document.querySelectorAll('#log .rc')].map(e => e.dataset.rcid));
  await P.p.evaluate((k) => { const W = weapons(); awBind(k, 1); Forge.state().dmgN = 5; W[k].am = 30; const R0 = Math.random; Math.random = () => 0.15; atkRoll(k); Math.random = R0; }, k[0]);
  await wait(150);
  await P.p.evaluate((k) => rollW(k), k[0]);
  let rc5 = null; { const t0 = Date.now(); while (Date.now() - t0 < 10000) { rc5 = await H.p.evaluate((seen) => [...document.querySelectorAll('#log .rc')].filter(e => !seen.includes(e.dataset.rcid)).map(e => e.textContent), seenR); if (rc5.length && /DMG \d+/.test(rc5[0])) break; await wait(300); } }
  ok(rc5 && rc5.length === 1 && /HITS · DMG \d+/.test(rc5[0]), 'race on a live table: DMG 150ms after ATK -> one line with DMG on the host ' + JSON.stringify(rc5));
  // ---- v5.4 (Overseer feedback pass) ----
  const uids = await H.p.evaluate(() => { const S = Forge.state(); return { pu: S.sheets.find(s => s.d && /^PB-7\b/.test(s.d.id)).uid, hu: S.sheets.find(s => s.d && /^MSH-01\b/.test(s.d.id)).uid }; });
  await H.p.evaluate((hu) => mpGo(hu), uids.hu); await wait(1500);
  const t1 = await H.p.evaluate((u) => { const S = Forge.state(); const i = S.sheets.findIndex(s => s.uid === u); const el = document.querySelector('.stab[data-uid="' + u + '"] .asg'); return { inactive: i !== S.cur, txt: el && el.textContent }; }, uids.pu);
  const t1p = await P.p.evaluate(() => [...document.querySelectorAll('.stab:not(.on) .stx')].map(e => e.textContent).filter(t => /^\[(?![RXHSD]\])/.test(t)));
  ok(t1.inactive && t1.txt === '[PILOTB]' && t1p.every(t => t.length > 3), 'item 1: inactive tabs show the full owner name ' + JSON.stringify({ t1, t1p }));
  await H.p.locator('.stab[data-uid="' + uids.hu + '"] .asg').click(); await wait(500);
  const o1 = await H.p.evaluate(() => ({ input: document.activeElement && document.activeElement.id, menu: !!document.querySelector('#tabmenu button') && getComputedStyle(document.getElementById('tabmenu')).display !== 'none' && /Seat|Closed|PILOTB/i.test(document.getElementById('tabmenu').textContent) }));
  ok(o1.input === 'shown' && !o1.menu, 'item 10: host clicking the owner text opens an inline name box, not the pilot dropdown ' + JSON.stringify(o1));
  await H.p.keyboard.press('Control+A'); await H.p.keyboard.type('<b>Kai</b>'); await H.p.keyboard.press('Enter'); await wait(800);
  const o2 = await H.p.evaluate((hu) => { const S = Forge.state(); const sh = S.sheets.find(s => s.uid === hu); const el = document.querySelector('.stab[data-uid="' + hu + '"] .asg'); return { own: sh.d.own, owner: sh.ownerId, txt: el.textContent, bold: !!el.querySelector('b'), cur: S.own }; }, uids.hu);
  ok(o2.own === '<b>Kai</b>' && !o2.owner && o2.txt === '[<b>Kai</b>]' && !o2.bold, 'item 10: Enter saves a new named owner, escaped ' + JSON.stringify(o2));
  let o3 = null; { const t0 = Date.now(); while (Date.now() - t0 < 12000) { o3 = await P.p.evaluate((hu) => { const el = document.querySelector('.stab[data-uid="' + hu + '"]'); return el ? { txt: [...el.querySelectorAll('.stx')].map(e => e.textContent).join(' '), bold: !!el.querySelector('.stx b') } : null; }, uids.hu); if (o3 && /\[<b>Kai<\/b>\]/.test(o3.txt)) break; await wait(500); } }
  ok(o3 && /\[<b>Kai<\/b>\]/.test(o3.txt) && !o3.bold, 'item 10: the owner name syncs to the other seat (escaped) ' + JSON.stringify(o3));
  await H.p.locator('.stab[data-uid="' + uids.hu + '"] .asg').click(); await wait(400);
  await H.p.keyboard.press('Control+A'); await H.p.keyboard.type('ZZZ'); await H.p.keyboard.press('Escape'); await wait(500);
  const o4 = await H.p.evaluate((hu) => ({ own: Forge.state().sheets.find(s => s.uid === hu).d.own, input: !!document.getElementById('shown') }), uids.hu);
  ok(o4.own === '<b>Kai</b>' && !o4.input, 'item 10: Esc cancels the edit ' + JSON.stringify(o4));
  await H.p.locator('.stab[data-uid="' + uids.hu + '"]').click({ button: 'right' }); await wait(400);
  const o5 = await H.p.evaluate(() => [...document.querySelectorAll('#tabmenu button')].map(b => b.textContent)); await H.p.keyboard.press('Escape'); await wait(200);
  ok(o5.some(t => /Assign pilot/i.test(t)), 'item 10: right-click > Assign pilot still available ' + JSON.stringify(o5));
  // ---- v5.5 (Overseer feedback pass 2) ----
  await H.p.locator('.stab[data-uid="' + uids.hu + '"]').click({ button: 'right' }); await wait(400);
  const tip5 = await H.p.evaluate(() => { const b = [...document.querySelectorAll('#tabmenu button')].find(x => /Assign pilot/.test(x.textContent)); return b && b.title; }); await H.p.keyboard.press('Escape'); await wait(200);
  ok(/seat/i.test(tip5 || '') && !/type an owner/i.test(tip5 || ''), "'Assign pilot…' hover text describes picking a seat " + JSON.stringify(tip5));
  await H.p.evaluate((hu) => { const S = Forge.state(); S.sheets.find(s => s.uid === hu).col = 2; Forge.render(); }, uids.hu); await wait(3000);
  const oc = async (p) => p.evaluate((hu) => { const t = document.querySelector('.stab[data-uid="' + hu + '"]'), a = t && t.querySelector('.asg, .stx[style]'); return t && a ? { tab: getComputedStyle(t).borderTopColor, txt: getComputedStyle(a).color, s: a.textContent } : null; }, uids.hu);
  const ocH = await oc(H.p), ocP = await oc(P.p);
  ok(ocH && ocH.txt === ocH.tab && ocP && ocP.txt === ocP.tab && /Kai/.test(ocP.s), 'custom owner text uses the tab outline colour (host and pilot) ' + JSON.stringify({ ocH, ocP }));
  await P.p.locator('.stab[data-uid="' + uids.hu + '"]').click({ button: 'right' }); await wait(400);
  const rcO = await P.p.evaluate(() => document.querySelectorAll('#tabmenu button').length); await P.p.keyboard.press('Escape'); await wait(200);
  await P.p.locator('.stab[data-uid="' + uids.pu + '"]').click({ button: 'right' }); await wait(400);
  const rcM = await P.p.evaluate(() => document.querySelectorAll('#tabmenu button').length); await P.p.keyboard.press('Escape'); await wait(200);
  ok(rcO === 0 && rcM > 0, "players cannot right-click someone else's tab; their own tab menu still opens " + JSON.stringify([rcO, rcM]));
  await H.p.evaluate(() => { const S = Forge.state(); S.items.push(Object.assign(structuredClone(DB.find(x => x.c == 'A' && hasRng(x) && /AMMO:/.test(x.s) && !x.th)), { mount: 'RH' })); Forge.render(); }); await wait(3500);
  await P.p.evaluate((hu) => mpGo(hu), uids.hu); await wait(3000);
  const vo = await P.p.evaluate(() => { const vis = (e) => e.offsetParent !== null; const items = [...document.querySelectorAll('[data-item]')]; if (items[0]) itemClick(+items[0].dataset.item); return { view: document.body.classList.contains('mp-view'), items: items.length, rbtn: [...document.querySelectorAll('.rbtn')].filter(vis).length, rolls: [...document.querySelectorAll('button[onclick*="Roll("],button[onclick^="rollW"]')].filter(vis).length, skills: [...document.querySelectorAll('input[oninput*="S.pilot"]')].filter(vis).length, pilot: !!document.querySelector('.pilot'), tg: [...document.querySelectorAll('.tgdrop')].filter(vis).length, note: /VIEW ONLY/.test(document.body.textContent) }; });
  ok(vo.view && vo.items > 0 && vo.rbtn === 0 && vo.rolls === 0 && vo.skills === 0 && !vo.pilot && vo.tg === 0 && vo.note, "players can view another unit's loadout without roll buttons, skill inputs or skill buttons " + JSON.stringify(vo));
  { const it = P.p.locator('[data-item]').first(); await it.click({ button: 'right' }); await wait(400);
    const im = await P.p.evaluate(() => [...document.querySelectorAll('#tabmenu button')].map(b => b.textContent)); await P.p.keyboard.press('Escape'); await wait(200);
    ok(im.some(t => /info/i.test(t)), 'right-click Info still works on a viewed unit ' + JSON.stringify(im)); }
  await P.p.evaluate((pu) => mpGo(pu), uids.pu); await wait(2500);
  ok(await P.p.evaluate(() => !document.body.classList.contains('mp-view')), 'back on the own unit: full access');
  await typeIn(P.p, 'pilot colour check');
  const pcol = await got(P.p, /^PILOTB.*: pilot colour check$/), hcol = await got(H.p, /^PILOTB.*: pilot colour check$/);
  const tcol = async (p, re) => p.evaluate((src) => { const c = [...document.querySelectorAll('#log .chat')].reverse().find(x => new RegExp(src).test(x.textContent)); return c && getComputedStyle(c.querySelector('.cht')).color; }, re.source);
  const pt = await tcol(P.p, /pilot colour check$/), ht = await tcol(H.p, /pilot colour check$/), fg = await H.p.evaluate(() => getComputedStyle(document.body).color);
  ok(pcol && hcol && pt === ht && ht !== fg && !/128, 128, 128|102, 119, 136/.test(ht), "remote seat renders the chat text in the sender's colour (not grey) " + JSON.stringify([pt, ht, fg]));
  await H.p.locator('.stab[data-uid="' + uids.hu + '"] .asg').click(); await wait(400);
  await H.p.keyboard.press('Control+A'); await H.p.keyboard.type('pilotb'); await H.p.keyboard.press('Enter'); await wait(800);
  const o6 = await H.p.evaluate((hu) => { const S = Forge.state(); const sh = S.sheets.find(s => s.uid === hu); return { owner: !!sh.ownerId, own: sh.d.own || '', txt: document.querySelector('.stab[data-uid="' + hu + '"] .asg').textContent }; }, uids.hu);
  ok(o6.owner && !o6.own && /PILOTB/.test(o6.txt), 'item 10: typing a seated callsign assigns that seat ' + JSON.stringify(o6));
  await H.p.setViewportSize({ width: 1280, height: 900 }); await wait(800);
  const r1 = await H.p.evaluate(() => { const b = document.getElementById('rosterBtn'), br = document.querySelector('header .hbrand'), hd = document.querySelector('header'); return { vis: !!b && !b.hidden && b.offsetParent !== null, before: !!b && b.closest('#conhead') === document.getElementById('conhead') && !document.querySelector('header #rosterBtn'), tb: (() => { const a = document.getElementById('themeBtn').getBoundingClientRect(), w = document.getElementById('who').getBoundingClientRect(); return Math.round(w.left - a.right); })(), txt: b && b.textContent, oldBtn: !!document.querySelector('#mpfriends .mph button'), h: Math.round(hd.getBoundingClientRect().height), sw: hd.scrollWidth <= hd.clientWidth + 1, box: getComputedStyle(document.getElementById('mpfriends')).display }; });
  await H.p.locator('#rosterBtn').click(); await wait(600);
  const r2 = await H.p.evaluate(() => { const f = document.getElementById('mpfriends'), cb = document.getElementById('cb'), lg = document.getElementById('log').getBoundingClientRect(), fr = f.getBoundingClientRect(); return { txt: document.getElementById('rosterBtn').textContent, box: getComputedStyle(f).display, inCb: f.parentElement === cb, users: cb.classList.contains('users'), fit: fr.width === 0 || (lg.right <= fr.left + 1 && fr.right <= cb.getBoundingClientRect().right + 1) }; });
  await H.p.locator('#rosterBtn').click(); await wait(600);
  const r3 = await H.p.evaluate(() => getComputedStyle(document.getElementById('mpfriends')).display);
  await H.p.setViewportSize({ width: 1600, height: 1000 });
  const op = r1.box === 'none' ? r2 : r1;
  ok(r1.vis && r1.before && !r1.oldBtn && r1.h < 40 && r1.sw && r1.tb >= 4 && r2.txt !== r1.txt && (r1.box === 'none') !== (r2.box === 'none') && r3 === r1.box && r2.inCb && (op === r2 ? r2.users && r2.fit : true), 'USERS toggle at the right of the OPERATOR CONSOLE header; the list opens inside the console and the log shrinks to fit; one-line top bar at 1280px with no THEME/CLEARANCE collision ' + JSON.stringify({ r1, r2, r3 }));
  await P.p.evaluate(() => { const S = Forge.state(); S.pilot = Object.assign({}, S.pilot, { aoa: '1' }); S.view = 'sortie'; Forge.render(); window.scrollTo(0, 0); }); await wait(3000);
  await P.p.screenshot({ path: shots + '/v55-mp-aoa-tag.png', clip: { x: 0, y: 0, width: 1600, height: 560 } });
  ok(errs.length === 0, 'no console errors on any seat ' + JSON.stringify(errs.slice(0, 5)));
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
