# Builds out/server/room.server.ts from the project original (FORGE-OS-sortie-app/src/lib/forge/room.server.ts).
# Never edits the original. Minimal server half of the R1-R9 fixes plus simple shared undo.
import sys
SRC='/workspace/forge-os/from-grok/FORGE-OS-sortie-app/src/lib/forge/room.server.ts'
DST='/workspace/forge-os/out/server/room.server.ts'
t=open(SRC,encoding='utf-8').read()
def rep(old,new,count=1):
    global t
    n=t.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n}): {old[:90]!r}')
    t=t.replace(old,new)

rep(''' * The host token on the room lets that browser reclaim host after a long absence.
 */''',''' * The host token on the room lets that browser reclaim host after a long absence.
 *
 * FORGE-OS 5.1 server half (see SERVER-CONTRACT.md). Minimal and backward compatible:
 * every new field is optional, so 5.0.x clients keep working.
 *  - R7: log HTML is tokenised and rebuilt from an allow-list; unterminated or malformed
 *    tags become text instead of reaching other seats' innerHTML
 *  - write rights: whole-telemetry `states` only from the host or the sheet owner; sheet
 *    order and console clear are host-only; clear keeps the rolls and stores a marker
 *  - retries are idempotent: an impact with an `id`, or a log line whose `nonce` is
 *    already in the feed, applies once
 *  - impact- and log-only pushes are additive and land on any revision (no 409 loop, R4)
 *  - simple shared undo: an impact may carry {id, kind, of, pop}; pop removes the undo
 *    entry it reverses; the server stamps the acting seat on every new undo entry; sacInc
 *    may be negative so an undo can hand back plating uses; only the host, the owner or
 *    the seat that made an entry may pop it
 *  - seats: entering with the callsign of an offline seat re-takes that seat (ownership and
 *    host kept); a full table frees player seats away 30 min that own no unit
 */''')

# ---------------- schemas ----------------
rep('''const impactSchema = z.object({
  uid: UID,''','''const EVID = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);

const impactSchema = z.object({
  id: EVID.optional(),
  kind: z.enum(["hit", "undo"]).optional(),
  of: EVID.nullable().optional(),
  pop: z.number().int().min(0).max(1).optional(),
  uid: UID,''')
rep('''  sacInc: z.number().int().min(0).max(5).default(0),''','''  sacInc: z.number().int().min(-5).max(5).default(0),''')
rep('''      l: z.string().max(200),
      t: z.string().max(40_000),''','''      l: z.string().max(200),
      id: EVID.nullable().optional(),
      by: z.string().max(64).nullable().optional(),
      t: z.string().max(40_000),''')

rep('''const PEER_CAP = 8;
const ONLINE_MS = 5_000;
const ROLL_CAP = 200;''','''const PEER_CAP = 8;
const ONLINE_MS = 5_000;
const ROLL_CAP = 200;
/** A full table may free player seats that have been away this long and own no unit. */
const STALE_SEAT_MS = 30 * 60_000;
/** Impact ids remembered for retry dedupe. */
const SEEN_CAP = 400;
/** Optional capabilities, so a client can tell this server from a 5.0 one. */
const FEATURES = ["pop", "ev"];''')
rep('''type Snapshot = { sheets: SheetSnap[]; rolls: RollRec[]; rollSeq: number; clearSeq: number };''','''type Snapshot = {
  sheets: SheetSnap[];
  rolls: RollRec[];
  rollSeq: number;
  clearSeq: number;
  /** Rolls with seq <= clearMark were cleared by the host; they are kept but no longer sent. */
  clearMark?: number;
  /** Recently applied impact ids (retry dedupe). */
  seen?: string[];
};''')
rep('''  return {
    sheets: Array.isArray(o.sheets) ? o.sheets.filter((s) => s && typeof s.uid === "string") : [],
    rolls: Array.isArray(o.rolls) ? o.rolls : [],
    rollSeq: Number(o.rollSeq) || 0,
    clearSeq: Number(o.clearSeq) || 0,
  };''','''  return {
    sheets: Array.isArray(o.sheets) ? o.sheets.filter((s) => s && typeof s.uid === "string") : [],
    rolls: Array.isArray(o.rolls) ? o.rolls : [],
    rollSeq: Number(o.rollSeq) || 0,
    clearSeq: Number(o.clearSeq) || 0,
    clearMark: Number(o.clearMark) || 0,
    seen: Array.isArray(o.seen) ? o.seen.filter((x) => typeof x === "string").slice(-SEEN_CAP) : [],
  };''')

# ---------------- R7: sanitizer ----------------
i=t.index('function sanitizeHtml(s: string): string {'); j=t.index('\nfunction unitLabel')
t=t[:i]+r'''const LOG_CLASS =
  /^(rl-roll|rl-tgt|rl-m|n-sl|n-st|n-rc|n-hd|ok|bad|warn|dim|roll-detail|roll-total)$/;
const LOG_TAGS = new Set(["b", "span", "br"]);

function escText(s: string): string {
  return s.replace(/&(?![a-zA-Z]{2,8};|#\d{1,6};)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Log lines are HTML that other seats render. Rebuild them instead of filtering: a complete,
 * well-formed b/span/br tag keeps only allow-listed classes and the data-ev / data-undo-of
 * event ids; anything else, including an unterminated `<img src=x onerror=...`, is escaped
 * into text. Open tags are closed at the end so a line cannot swallow the client's markup.
 */
export function sanitizeHtml(s: string): string {
  const re =
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:"[^"<>]*"|'[^'<>]*'|[^\s"'<>=`]+))?)*)\s*\/?>/g;
  const stack: string[] = [];
  let out = "";
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    out += escText(s.slice(last, m.index));
    last = re.lastIndex;
    const tag = m[2]!.toLowerCase();
    if (!LOG_TAGS.has(tag)) continue;
    if (tag === "br") {
      out += "<br>";
      continue;
    }
    if (m[1] === "/") {
      const at = stack.lastIndexOf(tag);
      if (at >= 0) while (stack.length > at) out += `</${stack.pop()}>`;
      continue;
    }
    let attrs = "";
    const ar = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)'|([^\s"'<>=`]+)))?/g;
    const raw = m[3] || "";
    for (let a = ar.exec(raw); a; a = ar.exec(raw)) {
      const name = a[1]!.toLowerCase();
      const val = a[2] ?? a[3] ?? a[4] ?? "";
      if (name === "class") {
        const ok = val.split(/\s+/).filter((c) => c && LOG_CLASS.test(c));
        if (ok.length) attrs += ` class="${ok.join(" ")}"`;
      } else if ((name === "data-ev" || name === "data-undo-of") && /^[A-Za-z0-9_-]{1,40}$/.test(val)) {
        attrs += ` ${name}="${val}"`;
      }
    }
    if (stack.length >= 32) continue;
    out += `<${tag}${attrs}>`;
    stack.push(tag);
  }
  out += escText(s.slice(last));
  while (stack.length) out += `</${stack.pop()}>`;
  return out;
}
'''+t[j:]

# ---------------- envelope: clear marker, features ----------------
rep('''  const rolls = snap.rolls.filter((r) => host || !r.uid || visible.has(r.uid));''','''  const mark = Number(snap.clearMark) || 0;
  const rolls = snap.rolls.filter((r) => r.seq > mark && (host || !r.uid || visible.has(r.uid)));''')
rep('''    you: { id: member.member_id, role: member.role === "host" ? "host" : "player", callsign: member.callsign },
  };''','''    you: { id: member.member_id, role: member.role === "host" ? "host" : "player", callsign: member.callsign },
    features: FEATURES,
  };''')

# ---------------- seats: reclaim by callsign, free stale seats ----------------
rep('''  const members = await loadMembers(sql, code);
  if (members.length >= PEER_CAP) return json({ error: "this sortie is full" }, 403);''','''  let members = await loadMembers(sql, code);
  const now = Date.now();
  // Re-authenticating with the callsign of an offline seat takes that seat back, so a pilot
  // whose token was lost keeps their unit (and the host keeps host). Same trust model as the
  // rest of the table: no accounts, the callsign is the table handle.
  const prior = members.find(
    (m) => m.callsign.toUpperCase() === callsign.toUpperCase() && now - seenMs(m.last_seen) >= ONLINE_MS,
  );
  if (prior) {
    const fresh = bytes(24);
    await sql.query(
      `update forge_members set token = $1, last_seen = now() where room_code = $2 and member_id = $3`,
      [fresh, code, prior.member_id],
    );
    const member: Member = { ...prior, token: fresh, last_seen: new Date() };
    const again = await loadMembers(sql, code);
    return json({
      ...envelope(room, asSnap(room.snapshot), member, again, { includeSnapshot: true, rollSince: 0 }),
      token: fresh,
    });
  }
  if (members.length >= PEER_CAP) {
    const owners = new Set(asSnap(room.snapshot).sheets.map((s) => s.ownerId).filter(Boolean));
    const stale = members.filter(
      (m) => m.role !== "host" && !owners.has(m.member_id) && now - seenMs(m.last_seen) > STALE_SEAT_MS,
    );
    for (const m of stale) {
      await sql.query(`delete from forge_members where room_code = $1 and member_id = $2`, [code, m.member_id]);
      places.delete(m.member_id);
      seatColors.delete(m.member_id);
    }
    if (stale.length) members = await loadMembers(sql, code);
  }
  if (members.length >= PEER_CAP) return json({ error: "this sortie is full" }, 403);''')

# ---------------- impacts: dedupe, undo rights, pop, actor stamp ----------------
rep('''function applyImpact(sheet: SheetSnap, imp: z.infer<typeof impactSchema>) {
  const d = { ...(sheet.d ?? {}) } as Record<string, unknown>;''','''function undoEntries(sheet: SheetSnap): { id?: unknown; by?: unknown }[] {
  const u = sheet.d?.undo;
  return Array.isArray(u) ? (u as { id?: unknown; by?: unknown }[]).filter((e) => !!e && typeof e === "object") : [];
}

/** Who may reverse an action: the host, the sheet owner, or the seat that made it. */
function mayUndo(sheet: SheetSnap, imp: z.infer<typeof impactSchema>, member: Member): boolean {
  if (canWrite(sheet, member)) return true;
  if (!imp.of) return false;
  const entry = undoEntries(sheet).find((e) => e.id === imp.of);
  return !!entry && entry.by === member.member_id;
}

function applyImpact(sheet: SheetSnap, imp: z.infer<typeof impactSchema>, member: Member) {
  const d = { ...(sheet.d ?? {}) } as Record<string, unknown>;''')
rep('''  if (imp.sacInc) sac[imp.loc] = (Number(sac[imp.loc]) || 0) + imp.sacInc;''','''  if (imp.sacInc) sac[imp.loc] = Math.max(0, (Number(sac[imp.loc]) || 0) + imp.sacInc);''')
rep('''  const undo = Array.isArray(d.undo) ? [...(d.undo as unknown[])] : [];
  if (imp.undo) undo.push(imp.undo);
  d.undo = undo.slice(-40);''','''  const undo = Array.isArray(d.undo) ? [...(d.undo as unknown[])] : [];
  if (imp.pop) {
    // Shared undo: drop the entry this impact reverses (by id; the newest one for id-less clients).
    const idx = imp.of ? undo.findIndex((u) => !!u && typeof u === "object" && (u as { id?: unknown }).id === imp.of) : -1;
    if (idx >= 0) undo.splice(idx, 1);
    else if (!imp.of) undo.pop();
  }
  if (imp.undo) undo.push({ ...imp.undo, by: member.member_id });
  d.undo = undo.slice(-40);''')
rep('''  for (const imp of msg.impacts) {
    const sheet = snap.sheets.find((s) => s.uid === imp.uid);
    if (!sheet) continue;
    if (sheet.hidden && member.role !== "host") continue;
    applyImpact(sheet, imp);
  }
  if (msg.clear) {
    snap.clearSeq = (Number(snap.clearSeq) || 0) + 1;
    snap.rolls = [];
  }
  for (const line of msg.logs) {''','''  const seen = new Set(snap.seen ?? []);
  for (const imp of msg.impacts) {
    const sheet = snap.sheets.find((s) => s.uid === imp.uid);
    if (!sheet) continue;
    if (sheet.hidden && member.role !== "host") continue;
    if (imp.id) {
      if (seen.has(imp.id)) continue; // a retried push must not land a hit twice
      seen.add(imp.id);
    }
    if ((imp.kind === "undo" || imp.pop) && !mayUndo(sheet, imp, member)) continue;
    applyImpact(sheet, imp, member);
  }
  snap.seen = [...seen].slice(-SEEN_CAP);
  if (msg.clear && member.role === "host") {
    // Keep the history (audit, late joiners of a later sortie); stop sending what came before.
    snap.clearSeq = (Number(snap.clearSeq) || 0) + 1;
    snap.clearMark = snap.rollSeq;
  }
  const nonces = new Set(snap.rolls.slice(-ROLL_CAP).map((r) => r.nonce));
  for (const line of msg.logs) {
    if (nonces.has(line.nonce)) continue;
    nonces.add(line.nonce);''')

# ---------------- write rights ----------------
rep('''  for (const state of msg.states) {
    const sheet = snap.sheets.find((s) => s.uid === state.uid);
    if (!sheet) continue;
    if (sheet.hidden && member.role !== "host") continue;
    // Any seat may sync telemetry (undo, and the host/owner's own heat and repair).
    // Loadout, skills and flavor stay on the rest path and remain owner/host only.
    applyState(sheet, state);
  }''','''  for (const state of msg.states) {
    const sheet = snap.sheets.find((s) => s.uid === state.uid);
    if (!sheet) continue;
    // Whole-telemetry writes replace every hit on the sheet, so only the host or the owner may
    // send them. Other seats change a sheet through additive impacts (damage, shared undo).
    if (!canWrite(sheet, member)) continue;
    applyState(sheet, state);
  }''')
rep('''  applyOrder(snap, msg.order, member);''','''  if (member.role === "host") applyOrder(snap, msg.order, member);''')

# ---------------- push: additive pushes are not revision-gated ----------------
rep('''    if (Number(room.revision) !== msg.baseRevision && (attempt === 0 || structural)) {''','''    // Impacts are deltas and logs are appends, so a push with only those (and, from the host,
    // a clear) can land on any revision. Whole-blob writes still need a fresh base.
    if (Number(room.revision) !== msg.baseRevision && structural) {''')
rep('''    applyImpact(sheet, imp, member);''','''    applyImpact(sheet, imp, member);''')
open(DST,'w',encoding='utf-8').write(t)
print('ok',len(t))
