// FORGE-OS 5.3 console data checks. Usage: node server-api-test-v53.mjs http://localhost:8080
const base = (process.argv[2] || "http://localhost:8080") + "/api/forge";
const call = async (b) => { const r = await fetch(base, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return { status: r.status, body: await r.json() }; };
let fails = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const tag = Date.now().toString(36).slice(-5).toUpperCase();
const E = await call({ op: "enter", callsign: "C" + tag });
if (E.status !== 200) { console.log("FAIL enter: " + E.status + " " + JSON.stringify(E.body) + " (run on a fresh dev server; the table holds a limited number of seats)"); process.exit(1); }
const A = E.body;
const T = { code: "TABLE", token: A.token };
let s = (await call({ op: "poll", ...T, since: -1 })).body;
const chat = { nonce: "n" + tag + "a", uid: null, tone: "dim", html: "&lt;b&gt;hi", rc: { k: "chat", t: "<b>hi</b>" } };
const card = { nonce: "n" + tag + "b", uid: null, tone: "ok", html: "GUN :: 3 HITS", rc: { k: "roll", id: "rcab12", f: "MSH-01 / X", a: "GUN", r: "3 HITS", o: "ok", d: ["3d6 [1, 2, 3] = 6 vs SL 12"], up: false } };
let r = await call({ op: "push", ...T, baseRevision: s.revision, logs: [chat, card] });
ok(r.status === 200, "push chat + roll card: " + r.status + " " + JSON.stringify(r.body.error || ""));
const rolls = (r.body.rolls || (r.body.snapshot && r.body.snapshot.rolls) || []);
const gc = rolls.find((x) => x.nonce === chat.nonce), gr = rolls.find((x) => x.nonce === card.nonce);
ok(gc && gc.rc && gc.rc.k === "chat" && gc.rc.t === "<b>hi</b>" && gc.actor === "C" + tag, "chat comes back as data with the server-side callsign");
ok(gr && gr.rc && gr.rc.id === "rcab12" && gr.rc.d.length === 1, "roll card comes back as structured data");
s = (await call({ op: "poll", ...T, since: -1 })).body;
r = await call({ op: "push", ...T, baseRevision: s.revision, logs: [{ nonce: "n" + tag + "c", tone: "dim", html: "x", rc: { k: "roll", id: "bad id\"><img>", a: "x" } }] });
ok(r.status === 400, "card with a malformed id refused: " + r.status);
r = await call({ op: "push", ...T, baseRevision: s.revision, logs: [{ nonce: "n" + tag + "d", tone: "dim", html: "x", rc: { k: "chat", t: "y".repeat(501) } }] });
ok(r.status === 400, "chat over 500 chars refused: " + r.status);
console.log(fails ? fails + " FAILED" : "ALL PASS"); process.exit(fails ? 1 : 0);
