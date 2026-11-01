# Builds out/server/room.server.ts from the project original. Never edits the original.
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
 * FORGE-OS 5.1 server half (see SERVER-CONTRACT.md). Every addition is optional on
 * the wire, so 5.0.x clients keep working unchanged:
 *  - log HTML is tokenised, not regex-stripped: unterminated tags can no longer
 *    smuggle markup to other seats (R7, server half)
 *  - impacts may carry {id, kind, of, pop}; pop removes the undo entry it reverses
 *    (event-log undo, R3), and undo entries are stamped with the acting seat
 *  - push may carry per-field `patches` {uid, path, base, value}; stale patches come
 *    back in `conflicts[]` instead of overwriting (R1/R2); host wins ties, and while the
 *    host is offline the last writer wins (both values are logged)
 *  - impact-, log- and patch-only pushes are applied on a stale baseRevision instead of
 *    409ing (they are additive or individually checked), which ends the R4 drop loop
 *  - poll may carry `focus` {uid, field}; members echo it as presence
 *  - envelopes advertise `features` so clients can detect all of the above
 *  - a full table frees seats that have been offline a long time and own no unit
 */''')

# ---- schemas ----
rep('''const impactSchema = z.object({
  uid: UID,''','''const EVID = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);

const impactSchema = z.object({
  id: EVID.optional(),
  kind: z.enum(["hit", "undo", "heat", "ammo"]).optional(),
  of: EVID.nullable().optional(),
  pop: z.number().int().min(0).max(1).optional(),
  uid: UID,''')
rep('''      l: z.string().max(200),
      t: z.string().max(40_000),''','''      l: z.string().max(200),
      id: EVID.nullable().optional(),
      by: z.string().max(64).nullable().optional(),
      t: z.string().max(40_000),''')
rep('''const metaItem = z.object({''','''const PATH = z
  .string()
  .max(120)
  .regex(/^[A-Za-z0-9_]{1,40}(\\.[A-Za-z0-9_]{1,40}){0,5}$/);

const patchSchema = z.object({
  uid: UID,
  path: PATH,
  base: z.unknown().optional(),
  value: z.unknown().optional(),
});

const metaItem = z.object({''')
rep('''  logs: z.array(logSchema).max(10).default([]),
  clear: z.boolean().optional().default(false),
});''','''  logs: z.array(logSchema).max(10).default([]),
  patches: z.array(patchSchema).max(64).default([]),
  clear: z.boolean().optional().default(false),
});''')
rep('''  seatColor: z
    .object({
      id: z.string().max(64),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .optional(),
});''','''  seatColor: z
    .object({
      id: z.string().max(64),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .optional(),
  focus: z
    .object({ uid: UID, field: z.string().max(24) })
    .nullable()
    .optional(),
});''')

# ---- presence + seat housekeeping ----
rep('''const seatColors = new Map<string, string>();
const PEER_CAP = 8;
const ONLINE_MS = 5_000;
const ROLL_CAP = 200;''','''const seatColors = new Map<string, string>();
/** What each seat is typing into right now ({uid, field}). Not stored. */
const focuses = new Map<string, { uid: string; field: string; at: number }>();
const PEER_CAP = 8;
const ONLINE_MS = 5_000;
const ROLL_CAP = 200;
const FOCUS_MS = 6_000;
/** A full table may free player seats that have been away this long and own no unit. */
const STALE_SEAT_MS = 30 * 60_000;
const FEATURES = ["patches", "conflicts", "pop", "ev", "focus", "stale-push"] as const;
/** Fields a patch may never touch: telemetry rides impacts/states; ui-only fields are local. */
const PATCH_DENY = new Set(["tel", "undo", "stab", "dmg", "uiHP", "info", "__proto__", "prototype", "constructor"]);

export type Conflict = {
  uid: string;
  path: string;
  base: unknown;
  mine: unknown;
  theirs: unknown;
  by: string;
  resolved: "host" | "lww" | null;
};''')
rep('''  html: string;
  nonce: string;
  color?: string;
};''','''  html: string;
  nonce: string;
  color?: string;
  /** Event id of the action this line describes (from data-ev), when the client sent one. */
  ev?: string;
  /** Event id this line reverses (from data-undo-of). */
  undoOf?: string;
};''')

# ---- sanitizer: tokenise instead of regex-stripping ----
i=t.index('function sanitizeHtml(s: string): string {'); j=t.index('\nfunction unitLabel')
t=t[:i]+r'''const LOG_CLASS =
  /^(rl-roll|rl-tgt|rl-m|n-sl|n-st|n-rc|n-hd|ok|bad|warn|dim|roll-detail|roll-total|ts|ev|undone|crit|dmg|rad|turn)$/;
const LOG_TAGS = new Set(["b", "span", "br", "i", "small"]);

function escText(s: string): string {
  return s.replace(/&(?![a-zA-Z]{2,8};|#\d{1,6};)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Log lines are HTML other seats will render. Rebuild them from scratch: allowed tags
 * keep only allow-listed attributes, everything else (including unterminated or
 * malformed tags such as `<img src=x onerror=... `) is escaped into text.
 */
export function sanitizeHtml(s: string): string {
  let out = "";
  let open = 0;
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:"[^"<>]*"|'[^'<>]*'|[^\s"'<>=`]+))?)*)\s*\/?>/g;
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    out += escText(s.slice(last, m.index));
    last = re.lastIndex;
    const close = m[1] === "/";
    const tag = m[2]!.toLowerCase();
    if (!LOG_TAGS.has(tag)) continue;
    if (tag === "br") {
      out += "<br>";
      continue;
    }
    if (close) {
      if (open > 0) {
        out += `</${tag}>`;
        open -= 1;
      }
      continue;
    }
    let attrs = "";
    const ar = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)'|([^\s"'<>=`]+)))?/g;
    for (let a = ar.exec(m[3] || ""); a; a = ar.exec(m[3] || "")) {
      const name = a[1]!.toLowerCase();
      const val = a[2] ?? a[3] ?? a[4] ?? "";
      if (name === "class") {
        const ok = val.split(/\s+/).filter((c) => c && LOG_CLASS.test(c));
        if (ok.length) attrs += ` class="${ok.join(" ")}"`;
      } else if ((name === "data-ev" || name === "data-undo-of") && /^[A-Za-z0-9_-]{1,40}$/.test(val)) {
        attrs += ` ${name}="${val}"`;
      }
    }
    out += `<${tag}${attrs}>`;
    open += 1;
  }
  out += escText(s.slice(last));
  while (open-- > 0) out += "</span>";
  return out;
}

function evOf(html: string, attr: "data-ev" | "data-undo-of"): string | undefined {
  const m = new RegExp(`${attr}="([A-Za-z0-9_-]{1,40})"`).exec(html);
  return m ? m[1] : undefined;
}
'''+t[j:]
# unclosed-tag closer must close the right tag: track a stack instead
t=t.replace('''  let open = 0;
  const re = /<''','''  const stack: string[] = [];
  const re = /<''')
t=t.replace('''    if (close) {
      if (open > 0) {
        out += `</${tag}>`;
        open -= 1;
      }
      continue;
    }''','''    if (close) {
      const at = stack.lastIndexOf(tag);
      if (at >= 0) {
        while (stack.length > at) out += `</${stack.pop()}>`;
      }
      continue;
    }''')
t=t.replace('''    out += `<${tag}${attrs}>`;
    open += 1;
  }
  out += escText(s.slice(last));
  while (open-- > 0) out += "</span>";
  return out;''','''    out += `<${tag}${attrs}>`;
    stack.push(tag);
    if (stack.length > 32) return escText(s);
  }
  out += escText(s.slice(last));
  while (stack.length) out += `</${stack.pop()}>`;
  return out;''')

# ---- members: presence echo, scoped to what the viewer may see ----
rep('''function publicMembers(members: Member[]) {
  const now = Date.now();
  return members.map((m) => ({
    id: m.member_id,
    callsign: m.callsign,
    role: m.role === "host" ? "host" : "player",
    online: now - seenMs(m.last_seen) < ONLINE_MS,
    place: places.get(m.member_id) || "Welcome",
    color: seatColors.get(m.member_id) || "",
  }));
}''','''function publicMembers(members: Member[], visible?: Set<string>) {
  const now = Date.now();
  return members.map((m) => {
    const online = now - seenMs(m.last_seen) < ONLINE_MS;
    const f = focuses.get(m.member_id);
    const focus = online && f && now - f.at < FOCUS_MS && (!visible || visible.has(f.uid)) ? { uid: f.uid, field: f.field } : null;
    return {
      id: m.member_id,
      callsign: m.callsign,
      role: m.role === "host" ? "host" : "player",
      online,
      place: places.get(m.member_id) || "Welcome",
      color: seatColors.get(m.member_id) || "",
      focus,
    };
  });
}''')
rep('''  opts: { includeSnapshot: boolean; rollSince: number },
) {''','''  opts: { includeSnapshot: boolean; rollSince: number; conflicts?: Conflict[] },
) {''')
rep('''    members: publicMembers(members),
    roster: view.roster,
    hostOnline,
    you: { id: member.member_id, role: member.role === "host" ? "host" : "player", callsign: member.callsign },
  };''','''    members: publicMembers(members, new Set(view.snapshot.sheets.map((s) => s.uid))),
    roster: view.roster,
    hostOnline,
    you: { id: member.member_id, role: member.role === "host" ? "host" : "player", callsign: member.callsign },
    features: FEATURES,
    conflicts: opts.conflicts ?? [],
  };''')

# ---- seat cap: free long-gone player seats that own nothing ----
rep('''  const members = await loadMembers(sql, code);
  if (members.length >= PEER_CAP) return json({ error: "this sortie is full" }, 403);''','''  let members = await loadMembers(sql, code);
  if (members.length >= PEER_CAP) {
    const owners = new Set(asSnap(room.snapshot).sheets.map((s) => s.ownerId).filter(Boolean));
    const now = Date.now();
    const stale = members.filter(
      (m) => m.role !== "host" && !owners.has(m.member_id) && now - seenMs(m.last_seen) > STALE_SEAT_MS,
    );
    for (const m of stale) {
      await sql.query(`delete from forge_members where room_code = $1 and member_id = $2`, [code, m.member_id]);
      places.delete(m.member_id);
      seatColors.delete(m.member_id);
      focuses.delete(m.member_id);
    }
    if (stale.length) members = await loadMembers(sql, code);
  }
  if (members.length >= PEER_CAP) return json({ error: "this sortie is full" }, 403);''')

# ---- read: focus + seat colour only for real seats ----
rep('''  if (msg.seatColor) {
    const target = msg.seatColor.id;
    if (member.role === "host" || target === member.member_id) seatColors.set(target, msg.seatColor.color);
  }
  const members = await loadMembers(sql, msg.code);''','''  const members = await loadMembers(sql, msg.code);
  if (msg.seatColor) {
    const target = msg.seatColor.id;
    const real = members.some((m) => m.member_id === target);
    if (real && (member.role === "host" || target === member.member_id)) seatColors.set(target, msg.seatColor.color);
  }
  if (msg.focus === null) focuses.delete(member.member_id);
  else if (msg.focus) focuses.set(member.member_id, { uid: msg.focus.uid, field: msg.focus.field.replace(/[^A-Za-z0-9 _.-]/g, ""), at: Date.now() });''')

# ---- impacts: stamp the actor, pop reversed entries ----
rep('''function applyImpact(sheet: SheetSnap, imp: z.infer<typeof impactSchema>) {''','''function applyImpact(sheet: SheetSnap, imp: z.infer<typeof impactSchema>, member?: Member) {''')
rep('''  const undo = Array.isArray(d.undo) ? [...(d.undo as unknown[])] : [];
  if (imp.undo) undo.push(imp.undo);
  d.undo = undo.slice(-40);''','''  let undo = Array.isArray(d.undo) ? [...(d.undo as unknown[])] : [];
  if (imp.pop) {
    // Event-log undo: remove the entry this impact reverses (by id), else the newest one.
    // Several inverse impacts of one undo share `of`; only the first finds the entry.
    const idx = imp.of
      ? undo.findIndex((u) => !!u && typeof u === "object" && (u as { id?: unknown }).id === imp.of)
      : -1;
    if (idx >= 0) undo.splice(idx, 1);
    else if (!imp.of) undo.pop();
  }
  if (imp.undo) undo.push(member ? { ...imp.undo, by: member.member_id } : imp.undo);
  undo = undo.slice(-40);
  d.undo = undo;''')
rep('''    applyImpact(sheet, imp);''','''    applyImpact(sheet, imp, member);''')

# ---- patches with conflicts ----
rep('''function sheetFromUpsert(''','''function stableJson(v: unknown): string {
  if (v === undefined) return "u";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableJson).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableJson(o[k])}`)
    .join(",")}}`;
}

function readPath(root: Record<string, unknown> | null, parts: string[]): unknown {
  let o: unknown = root;
  for (const p of parts) {
    if (!o || typeof o !== "object" || !Object.prototype.hasOwnProperty.call(o, p)) return undefined;
    o = (o as Record<string, unknown>)[p];
  }
  return o;
}

function writePath(root: Record<string, unknown>, parts: string[], value: unknown) {
  let o = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!;
    const next = o[k];
    o[k] = next && typeof next === "object" && !Array.isArray(next) ? { ...(next as Record<string, unknown>) } : {};
    o = o[k] as Record<string, unknown>;
  }
  const leaf = parts[parts.length - 1]!;
  if (value === undefined) delete o[leaf];
  else o[leaf] = value;
}

/**
 * Per-field writes. A patch applies when the field still holds the value the writer
 * started from. Otherwise: the host wins; with the host offline the last writer wins;
 * a player against a live host gets the conflict back and the table value stays.
 */
function applyPatches(
  snap: Snapshot,
  patches: z.infer<typeof patchSchema>[],
  member: Member,
  hostOnline: boolean,
): Conflict[] {
  const out: Conflict[] = [];
  const touched = new Set<SheetSnap>();
  for (const p of patches) {
    const sheet = snap.sheets.find((s) => s.uid === p.uid);
    if (!sheet || !canWrite(sheet, member)) continue;
    const parts = p.path.split(".");
    if (parts.some((k) => PATCH_DENY.has(k))) continue;
    if (!blobOk(p.value ?? null, 200_000)) continue;
    const d = { ...(sheet.d ?? {}) } as Record<string, unknown>;
    const theirs = readPath(d, parts);
    const fresh = stableJson(theirs) === stableJson(p.base) || stableJson(theirs) === stableJson(p.value);
    let resolved: Conflict["resolved"] = null;
    if (!fresh) {
      if (member.role === "host") resolved = "host";
      else if (!hostOnline) resolved = "lww";
      out.push({ uid: p.uid, path: p.path, base: p.base ?? null, mine: p.value ?? null, theirs: theirs ?? null, by: member.member_id, resolved });
      if (!resolved) continue;
    }
    writePath(d, parts, p.value);
    sheet.d = d;
    touched.add(sheet);
  }
  for (const s of touched) s.rev += 1;
  return out;
}

function sheetFromUpsert(''')
rep('''function applyPush(snap: Snapshot, msg: z.infer<typeof pushSchema>, member: Member, members: Member[]) {
  const ids = new Set(members.map((m) => m.member_id));''','''function applyPush(
  snap: Snapshot,
  msg: z.infer<typeof pushSchema>,
  member: Member,
  members: Member[],
): Conflict[] {
  const ids = new Set(members.map((m) => m.member_id));''')
rep('''  for (const state of msg.states) {''','''  const hostOnline = members.some((m) => m.role === "host" && Date.now() - seenMs(m.last_seen) < ONLINE_MS);
  const conflicts = applyPatches(snap, msg.patches, member, hostOnline);
  for (const c of conflicts) {
    snap.rollSeq += 1;
    const sheet = snap.sheets.find((s) => s.uid === c.uid);
    const val = (v: unknown) => sanitizeHtml(String(stableJson(v)).slice(0, 40));
    snap.rolls.push({
      seq: snap.rollSeq,
      id: bytes(8),
      ts: Date.now(),
      actorId: member.member_id,
      actor: member.callsign,
      uid: c.uid,
      unit: sheet ? unitLabel(sheet) : "SORTIE",
      tone: "warn",
      html: `[ -- ] CONFLICT ${sanitizeHtml(c.path)} :: TABLE=${val(c.theirs)} vs ${sanitizeHtml(member.callsign)}=${val(c.mine)} =&gt; ${
        c.resolved === "host" ? "HOST VALUE KEPT" : c.resolved === "lww" ? "LAST WRITE (HOST OFFLINE)" : "TABLE VALUE KEPT, PENDING"
      }`,
      nonce: "cf" + bytes(6),
      color: "",
    });
  }
  for (const state of msg.states) {''')
rep('''    snap.rolls.push({
      seq: snap.rollSeq,
      id: bytes(8),
      ts: Date.now(),
      actorId: member.member_id,
      actor: member.callsign,
      uid: sheet?.uid ?? null,
      unit: sheet ? unitLabel(sheet) : "SORTIE",
      tone: line.tone,
      html: sanitizeHtml(line.html),
      nonce: line.nonce,
      color: line.color && /^#[0-9a-fA-F]{6}$/.test(line.color) ? line.color : "",
    });
  }
  if (snap.rolls.length > ROLL_CAP) snap.rolls = snap.rolls.slice(-ROLL_CAP);
}''','''    const html = sanitizeHtml(line.html);
    const ev = evOf(html, "data-ev");
    const undoOf = evOf(html, "data-undo-of");
    snap.rolls.push({
      seq: snap.rollSeq,
      id: bytes(8),
      ts: Date.now(),
      actorId: member.member_id,
      actor: member.callsign,
      uid: sheet?.uid ?? null,
      unit: sheet ? unitLabel(sheet) : "SORTIE",
      tone: line.tone,
      html,
      nonce: line.nonce,
      color: line.color && /^#[0-9a-fA-F]{6}$/.test(line.color) ? line.color : "",
      ...(ev ? { ev } : {}),
      ...(undoOf ? { undoOf } : {}),
    });
  }
  if (snap.rolls.length > ROLL_CAP) snap.rolls = snap.rolls.slice(-ROLL_CAP);
  return conflicts;
}''')

# ---- push: additive pushes no longer bounce on a stale base ----
rep('''    if (Number(room.revision) !== msg.baseRevision && (attempt === 0 || structural)) {''','''    // Impacts are deltas, logs are appends and patches carry their own base, so a push
    // with only those can land on any revision. Whole-blob writes still need a fresh base.
    if (Number(room.revision) !== msg.baseRevision && structural) {''')
rep('''    const snap = asSnap(room.snapshot);
    applyPush(snap, msg, member, members);
    const rev = await commit(sql, msg.code, Number(room.revision), snap);
    if (rev == null) continue;
    const freshMembers = await loadMembers(sql, msg.code);
    return json(
      envelope({ code: room.code, revision: rev }, snap, member, freshMembers, {
        includeSnapshot: true,
        rollSince: msg.rollSeq,
      }),
    );''','''    const snap = asSnap(room.snapshot);
    const conflicts = applyPush(snap, msg, member, members);
    const rev = await commit(sql, msg.code, Number(room.revision), snap);
    if (rev == null) continue;
    const freshMembers = await loadMembers(sql, msg.code);
    return json(
      envelope({ code: room.code, revision: rev }, snap, member, freshMembers, {
        includeSnapshot: true,
        rollSince: msg.rollSeq,
        conflicts,
      }),
    );''')
open(DST,'w',encoding='utf-8').write(t)
print('ok',len(t))
