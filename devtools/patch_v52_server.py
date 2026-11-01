import sys,pathlib
ROOT=pathlib.Path('/workspace/forge-os')
s=(ROOT/'out/server/room.server.ts').read_text()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n} hits): {old[:100]!r}')
    s=s.replace(old,new)
rep(""" *  - seats: entering with the callsign of an offline seat re-takes that seat (ownership and
 *    host kept); a full table frees player seats away 30 min that own no unit
 */""",""" *  - seats: entering with the callsign of an offline seat re-takes that seat (ownership and
 *    host kept); a full table frees player seats away 30 min that own no unit
 *
 * FORGE-OS 5.2 (seat integrity, the "one player's sheet keeps resetting" report):
 *  - entering with a callsign that is online right now is refused (409) instead of creating a
 *    second seat with the same name that owns nothing
 *  - re-taking by callsign prefers the seat that owns a unit, then the most recently seen
 *  - `resume` with a seat token issued to a different callsign is refused (403), so a shared
 *    browser no longer renames and takes over another pilot's seat
 *  - `leave` marks the seat offline at once, so the same callsign can re-take it immediately
 */""")
rep("""  const prior = members.find(
    (m) => m.callsign.toUpperCase() === callsign.toUpperCase() && now - seenMs(m.last_seen) >= ONLINE_MS,
  );
  if (prior) {""","""  const same = members.filter((m) => m.callsign.toUpperCase() === callsign.toUpperCase());
  if (same.some((m) => now - seenMs(m.last_seen) < ONLINE_MS)) {
    return json(
      { error: "that callsign is active at the table right now (another tab or device); close it or wait a few seconds" },
      409,
    );
  }
  const owners0 = new Set(asSnap(room.snapshot).sheets.map((s) => s.ownerId).filter(Boolean));
  const prior = same
    .slice()
    .sort(
      (a, b) =>
        Number(owners0.has(b.member_id)) - Number(owners0.has(a.member_id)) ||
        seenMs(b.last_seen) - seenMs(a.last_seen),
    )[0];
  if (prior) {""")
rep("""  const member = await memberByToken(sql, msg.code, msg.token);
  if (!member) return json({ error: "link token rejected" }, 403);
  const nextName = normalizeCallsign(msg.callsign, member.callsign);""","""  const member = await memberByToken(sql, msg.code, msg.token);
  if (!member) return json({ error: "link token rejected" }, 403);
  if (
    msg.op === "resume" &&
    msg.callsign &&
    msg.callsign.trim() &&
    msg.callsign.trim().toUpperCase() !== member.callsign.toUpperCase()
  ) {
    return json({ error: "this seat token belongs to another callsign" }, 403);
  }
  if (msg.op === "leave") {
    await sql.query(
      `update forge_members set last_seen = now() - interval '1 minute' where room_code = $1 and member_id = $2`,
      [msg.code, member.member_id],
    );
    return json({ ok: true, left: true, features: FEATURES });
  }
  const nextName = normalizeCallsign(msg.callsign, member.callsign);""")
rep("""const FEATURES = ["pop", "ev"];""","""const FEATURES = ["pop", "ev", "seat2"];""")
(ROOT/'out-v5.2/server/room.server.ts').write_text(s)
print('server patched')
