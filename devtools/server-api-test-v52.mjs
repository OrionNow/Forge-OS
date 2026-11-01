// FORGE-OS 5.2 seat-integrity checks. Usage: node server-api-test-v52.mjs http://localhost:8080
const base = (process.argv[2] || "http://localhost:8080") + "/api/forge";
const call = async (b) => { const r = await fetch(base, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return { status: r.status, body: await r.json() }; };
let fails = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tag = Date.now().toString(36).slice(-5).toUpperCase();
const A = (await call({ op: "enter", callsign: "A" + tag })).body;
ok(A.features && A.features.includes("seat2"), "seat2 feature advertised");
const T = { code: "TABLE", token: A.token };
// a player-owned unit
let s = (await call({ op: "poll", ...T, since: -1 })).body;
const uid = "v52unit_" + Date.now();
let r = await call({ op: "push", ...T, baseRevision: s.revision, upserts: [{ uid, name: "V52", col: 0, hidden: false, ownerId: A.you.id, d: { ch: ["X"], pilot: { pil: "12" }, items: [{ n: "GUN" }], tel: { hp: [5], heat: 3 }, undo: [] } }] });
const owned = r.body.snapshot && r.body.snapshot.sheets.find((x) => x.uid === uid);
ok(r.status === 200 && owned, "unit created " + r.status);
// 1) duplicate callsign while online is refused (no second seat)
r = await call({ op: "enter", callsign: "A" + tag });
ok(r.status === 409 && /active/.test(r.body.error || ""), "online duplicate callsign refused: " + r.status + " " + r.body.error);
// 2) resume with a token issued to another callsign is refused (shared browser)
r = await call({ op: "resume", ...T, callsign: "Z" + tag });
ok(r.status === 403, "resume under another callsign refused: " + r.status);
r = await call({ op: "resume", ...T, callsign: "a" + tag });
ok(r.status === 200 && r.body.you.id === A.you.id, "resume with the same callsign (any case) works");
// 3) leave frees the seat at once; re-enter by callsign re-takes the same member (ownership kept)
r = await call({ op: "leave", ...T });
ok(r.status === 200 && r.body.left, "leave ok");
r = await call({ op: "enter", callsign: "A" + tag });
ok(r.status === 200 && r.body.you.id === A.you.id, "re-take after leave keeps the member id: " + (r.body.you && r.body.you.id));
const T2 = { code: "TABLE", token: r.body.token };
const mine = r.body.snapshot.sheets.find((x) => x.uid === uid);
ok(mine && mine.d && mine.d.pilot && mine.d.pilot.pil === "12", "owner gets the full (unredacted) copy back");
// 4) an over-limit console line is refused (the client now caps lines at 7800 chars and drops refused lines)
s = (await call({ op: "poll", ...T2, since: -1 })).body;
r = await call({ op: "push", ...T2, baseRevision: s.revision, logs: [{ nonce: "big" + tag, uid, html: "x".repeat(8100), tone: "dim" }], rests: [{ uid, rest: { ch: ["X"], pilot: { pil: "14" }, items: [{ n: "GUN" }] } }] });
ok(r.status === 400, "8100-char line refuses the whole push (why the client must cap): " + r.status);
r = await call({ op: "push", ...T2, baseRevision: s.revision, logs: [{ nonce: "ok" + tag, uid, html: "x".repeat(7800), tone: "dim" }], rests: [{ uid, rest: { ch: ["X"], pilot: { pil: "14" }, items: [{ n: "GUN" }] } }] });
ok(r.status === 200 && r.body.snapshot.sheets.find((x) => x.uid === uid).d.pilot.pil === "14", "7800-char line + rest lands: " + r.status);
// 5) reclaim prefers the unit-owning seat over a newer same-callsign ghost
// (a ghost can only exist from before 5.2; simulate by renaming another seat via poll)
const G = (await call({ op: "enter", callsign: "G" + tag })).body;
await call({ op: "poll", code: "TABLE", token: G.token, callsign: "B" + tag }); // G renames itself to B…
const B = (await call({ op: "enter", callsign: "Q" + tag })).body;
await call({ op: "poll", code: "TABLE", token: B.token, callsign: "B" + tag }); // …and Q too: two "B" seats
s = (await call({ op: "poll", code: "TABLE", token: G.token, since: -1 })).body;
const uid2 = "v52own_" + Date.now();
r = await call({ op: "push", code: "TABLE", token: G.token, baseRevision: s.revision, upserts: [{ uid: uid2, name: "GOWN", col: 0, hidden: false, ownerId: G.you.id, d: { ch: ["X"], pilot: {}, tel: { hp: [1] }, undo: [] } }] });
await call({ op: "leave", code: "TABLE", token: G.token });
await call({ op: "leave", code: "TABLE", token: B.token });
r = await call({ op: "enter", callsign: "B" + tag });
ok(r.status === 200 && r.body.you.id === G.you.id, "re-take picks the seat that owns a unit (" + (r.body.you && r.body.you.id) + " vs owner " + G.you.id + ")");
console.log(fails ? fails + " FAILED" : "ALL PASS");
process.exit(fails ? 1 : 0);
