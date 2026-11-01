// Exercises the FORGE-OS 5.1 server copy over HTTP. Usage: node server-api-test.mjs http://localhost:8080
const base = (process.argv[2] || "http://localhost:8080") + "/api/forge";
const call = async (b) => { const r = await fetch(base, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return { status: r.status, body: await r.json() }; };
let fails = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const tag = Date.now().toString(36).slice(-5).toUpperCase();
const host = (await call({ op: "enter", callsign: "H" + tag })).body;
const pl = (await call({ op: "enter", callsign: "P" + tag })).body;
const other = (await call({ op: "enter", callsign: "O" + tag })).body;
const iAmHost = host.you.role === "host";
console.log("first seat role:", host.you.role, "(tests that need the host are skipped when an earlier seat holds it)");
ok(Array.isArray(host.features) && host.features.includes("pop"), "features advertised");
const H = { code: "TABLE", token: host.token }, P = { code: "TABLE", token: pl.token }, O = { code: "TABLE", token: other.token };
const uid = "apitest_" + Date.now();
// the player creates their own unit (players may upsert one owned sheet)
let s = (await call({ op: "poll", ...P, since: -1 })).body;
let r = await call({ op: "push", ...P, baseRevision: s.revision, upserts: [{ uid, name: "API UNIT", col: 0, hidden: false, ownerId: pl.you.id, d: { ch: ["X"], id: "A", cs: "B", pilot: { rad: "0" }, tel: { hp: [10, 10], sac: [1, 0] }, undo: [] } }] });
ok(r.status === 200 && r.body.snapshot.sheets.some((x) => x.uid === uid), "player upsert " + r.status);
const rev0 = r.body.revision;
const sheetOf = (res) => res.body.snapshot.sheets.find((x) => x.uid === uid);
// R7
r = await call({ op: "push", ...O, baseRevision: 0, logs: [
  { nonce: "x1" + tag, uid, html: "HIT <img src=x onerror=alert(1) ", tone: "bad" },
  { nonce: "x2" + tag, uid, html: '<span class="ok evil" data-ev="e1" onclick="x()">OK</span><script>bad()</script><svg onload=1>', tone: "ok" },
  { nonce: "x3" + tag, uid, html: "<b>open <span class=warn>never closed", tone: "warn" }] });
const lines = r.body.rolls.filter((x) => String(x.nonce).endsWith(tag)).map((x) => x.html);
ok(lines.length === 3 && !/<img|<script|<svg|onclick=/.test(lines.join(" ")) && lines[0].includes("&lt;img"), "sanitizer: " + JSON.stringify(lines));
ok(/<\/span><\/b>$/.test(lines[2]), "unclosed tags are closed");
ok(/data-ev="e1"/.test(lines[1]), "event id attribute kept");
// nonce dedupe
r = await call({ op: "push", ...O, baseRevision: 0, logs: [{ nonce: "x1" + tag, uid, html: "dup", tone: "dim" }] });
ok(r.body.rolls.filter((x) => x.nonce === "x1" + tag).length <= 1 && !r.body.rolls.some((x) => x.html === "dup"), "log retry with the same nonce is ignored");
// stale impact-only push lands; id dedupe
const hit = { id: "h1" + tag, kind: "hit", uid, loc: 0, delta: -3, floor: 0, undo: { l: "HIT", id: "h1" + tag, t: "{}", s: null } };
r = await call({ op: "push", ...O, baseRevision: rev0, impacts: [hit] });
ok(r.status === 200 && sheetOf(r).d.tel.hp[0] === 7, "stale impact-only push accepted (" + r.status + ")");
ok(sheetOf(r).d.undo.at(-1).by === other.you.id, "server stamps the acting seat on the undo entry");
r = await call({ op: "push", ...O, baseRevision: 0, impacts: [hit] });
ok(sheetOf(r).d.tel.hp[0] === 7, "retried impact id applies once");
// states: non-owner rejected, owner accepted
r = await call({ op: "push", ...O, baseRevision: r.body.revision, states: [{ uid, tel: { hp: [1, 1], sac: [0, 0] }, undo: [] }] });
ok(sheetOf(r).d.tel.hp[0] === 7, "non-owner whole-tel state ignored");
// undo rights: a third seat may not pop someone else's entry; the acting seat may
const third = (await call({ op: "enter", callsign: "T" + tag })).body; const T = { code: "TABLE", token: third.token };
r = await call({ op: "push", ...T, baseRevision: 0, impacts: [{ id: "u0" + tag, kind: "undo", of: "h1" + tag, pop: 1, uid, loc: 0, delta: 3, floor: 0 }] });
ok(sheetOf(r).d.tel.hp[0] === 7 && sheetOf(r).d.undo.some((u) => u.id === "h1" + tag), "unrelated seat cannot undo");
r = await call({ op: "push", ...O, baseRevision: 0, impacts: [{ id: "u1" + tag, kind: "undo", of: "h1" + tag, pop: 1, uid, loc: 0, delta: 3, floor: 0, sacInc: -1 }] });
ok(sheetOf(r).d.tel.hp[0] === 10 && !sheetOf(r).d.undo.some((u) => u.id === "h1" + tag) && sheetOf(r).d.tel.sac[0] === 0, "acting seat undo: pop + negative sacInc");
// order is host-only
const before = r.body.snapshot.sheets.map((x) => x.uid).join("|");
r = await call({ op: "push", ...P, baseRevision: r.body.revision, order: r.body.snapshot.sheets.map((x) => x.uid).reverse() });
ok(r.body.snapshot.sheets.length < 2 || r.body.snapshot.sheets.map((x) => x.uid).join("|") === before, "player reorder ignored");
// clear is host-only and keeps a marker
const seq0 = r.body.rollSeq;
r = await call({ op: "push", ...P, baseRevision: 0, clear: true });
ok(r.body.snapshot.clearSeq === (s.snapshot.clearSeq || 0) && r.body.rolls.length > 0, "player clear ignored");
// structural push on a stale base still 409s with a snapshot
r = await call({ op: "push", ...P, baseRevision: 0, rests: [{ uid, rest: { ch: ["X"] } }] });
ok(r.status === 409 && r.body.error === "conflict" && r.body.snapshot && typeof r.body.revision === "number", "stale whole-rest push: 409 + snapshot + revision");
// re-auth by callsign keeps the seat (needs the seat to be offline: wait out ONLINE_MS)
await new Promise((res) => setTimeout(res, 5200));
r = await call({ op: "enter", callsign: "P" + tag });
ok(r.body.you && r.body.you.id === pl.you.id && r.body.token !== pl.token, "offline callsign re-auth keeps member id (ownership)");
const oldTok = await call({ op: "poll", ...P, since: 0 });
ok(oldTok.status === 403, "old token rejected after re-auth");
// old 5.0 impact shape still accepted
const P2 = { code: "TABLE", token: r.body.token };
r = await call({ op: "push", ...P2, baseRevision: r.body.revision, impacts: [{ uid, loc: 1, delta: -1, floor: 0 }] });
ok(r.status === 200 && sheetOf(r).d.tel.hp[1] === 9, "5.0 impact shape accepted");
await call({ op: "push", ...P2, baseRevision: r.body.revision, drops: [uid] });
console.log(fails ? fails + " FAILED" : "ALL PASS");
process.exit(fails ? 1 : 0);
