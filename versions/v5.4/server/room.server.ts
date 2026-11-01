/**
 * Sortie-link relay. The database holds the encounter so a closed browser
 * does not end the table. Member tokens are the capability — there are no accounts.
 * The host token on the room lets that browser reclaim host after a long absence.
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
 *
 * FORGE-OS 5.2 (seat integrity, the "one player's sheet keeps resetting" report):
 *  - entering with a callsign that is online right now is refused (409) instead of creating a
 *    second seat with the same name that owns nothing
 *  - re-taking by callsign prefers the seat that owns a unit, then the most recently seen
 *  - `resume` with a seat token issued to a different callsign is refused (403), so a shared
 *    browser no longer renames and takes over another pilot's seat
 *  - `leave` marks the seat offline at once, so the same callsign can re-take it immediately
 */
import { randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";

const CODE = z
  .string()
  .trim()
  .transform((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, ""))
  .pipe(z.string().regex(/^[A-Z0-9]{4,8}$/));

const TOKEN = z.string().regex(/^[a-f0-9]{32,64}$/);
const MEMBER = z.string().regex(/^[a-f0-9]{8,64}$/);
const UID = z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/);

const callsignSchema = z
  .string()
  .trim()
  .min(1)
  .max(16)
  .regex(/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,15}$/, "use letters, digits, spaces, . _ -");

const EVID = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);

const impactSchema = z.object({
  id: EVID.optional(),
  kind: z.enum(["hit", "undo"]).optional(),
  of: EVID.nullable().optional(),
  pop: z.number().int().min(0).max(1).optional(),
  uid: UID,
  loc: z.number().int().min(0).max(64),
  delta: z.number().finite().min(-1_000_000).max(1_000_000),
  floor: z.number().finite().min(-1_000_000).max(1_000_000),
  sacInc: z.number().int().min(-5).max(5).default(0),
  undo: z
    .object({
      l: z.string().max(200),
      id: EVID.nullable().optional(),
      by: z.string().max(64).nullable().optional(),
      t: z.string().max(40_000),
      s: z.string().max(20_000).nullable(),
    })
    .nullable()
    .optional(),
  stab: z.unknown().optional().nullable(),
});

const restSchema = z.object({
  uid: UID,
  rest: z.record(z.string(), z.unknown()),
});

const stateSchema = z.object({
  uid: UID,
  tel: z.unknown().nullable(),
  undo: z.array(z.unknown()).max(40).default([]),
  stab: z.unknown().nullable().optional(),
});

const metaItem = z.object({
  uid: UID,
  name: z.string().max(28).default(""),
  col: z.number().int().min(0).max(8).default(0),
  hidden: z.boolean().default(false),
  closed: z.boolean().default(false),
  ownerId: z.string().max(64).nullable().default(null),
});

const upsertSchema = metaItem.extend({
  d: z.unknown().nullable().default(null),
});

const paintSchema = z.object({
  uid: UID,
  col: z.number().int().min(0).max(8),
});

// v5.3: structured console data (roll cards and chat). Plain strings only; clients render them with textContent/esc.
const cardSchema = z.object({
  k: z.enum(["roll", "chat"]),
  id: z.string().regex(/^rc[a-z0-9]{1,20}$/).optional(),
  t: z.string().max(500).optional(),
  f: z.string().max(80).optional(),
  a: z.string().max(160).optional(),
  r: z.string().max(80).optional(),
  o: z.enum(["ok", "bad", "warn", "dim"]).optional(),
  d: z.array(z.string().max(300)).max(40).optional(),
  up: z.boolean().optional(),
});
export type LogCard = z.infer<typeof cardSchema>;

const logSchema = z.object({
  nonce: z.string().min(4).max(40),
  uid: UID.nullable().optional(),
  tone: z.enum(["ok", "bad", "warn", "dim"]).default("dim"),
  html: z.string().max(8000),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  rc: cardSchema.optional(),
});

const pushSchema = z.object({
  op: z.literal("push"),
  code: CODE,
  token: TOKEN,
  baseRevision: z.number().int().min(0),
  rollSeq: z.number().int().min(0).default(0),
  impacts: z.array(impactSchema).max(16).default([]),
  rests: z.array(restSchema).max(12).default([]),
  states: z.array(stateSchema).max(12).default([]),
  meta: z.array(metaItem).max(24).nullable().default(null),
  paints: z.array(paintSchema).max(24).default([]),
  order: z.array(UID).max(24).nullable().default(null),
  upserts: z.array(upsertSchema).max(8).default([]),
  drops: z.array(UID).max(8).default([]),
  logs: z.array(logSchema).max(10).default([]),
  clear: z.boolean().optional().default(false),
});

const ROOM = "TABLE";

const createSchema = z.object({ op: z.literal("create"), callsign: callsignSchema });
const enterSchema = z.object({ op: z.literal("enter"), callsign: callsignSchema });
const joinSchema = z.object({ op: z.literal("join"), code: CODE, callsign: callsignSchema });
const tokenSchema = z.object({
  op: z.enum(["resume", "poll", "leave", "end"]),
  code: CODE,
  token: TOKEN,
  since: z.number().int().min(-1).optional(),
  rollSeq: z.number().int().min(0).optional(),
  callsign: z.string().max(16).optional(),
  place: z.string().max(24).optional(),
  seatColor: z
    .object({
      id: z.string().max(64),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .optional(),
});

const postSchema = z.union([createSchema, enterSchema, joinSchema, pushSchema, tokenSchema]);

const PLACES = new Set([
  "Welcome",
  "Frame Assembly",
  "Frame Assembly*",
  "R+D Archive",
  "Service Bay",
  "Sortie",
]);

/** Where each seat is in the terminal. Not stored: the next poll fills it back in. */
const places = new Map<string, string>();
const seatColors = new Map<string, string>();
const PEER_CAP = 8;
const ONLINE_MS = 5_000;
const ROLL_CAP = 200;
/** A full table may free player seats that have been away this long and own no unit. */
const STALE_SEAT_MS = 30 * 60_000;
/** Impact ids remembered for retry dedupe. */
const SEEN_CAP = 400;
/** Optional capabilities, so a client can tell this server from a 5.0 one. */
const FEATURES = ["pop", "ev", "seat2"];

export type SheetSnap = {
  uid: string;
  name: string;
  col: number;
  hidden: boolean;
  ownerId: string | null;
  closed?: boolean;
  rev: number;
  d: Record<string, unknown> | null;
};

export type RollRec = {
  seq: number;
  id: string;
  ts: number;
  actorId: string;
  actor: string;
  uid: string | null;
  unit: string;
  tone: "ok" | "bad" | "warn" | "dim";
  html: string;
  nonce: string;
  color?: string;
  rc?: LogCard;
};

type Snapshot = {
  sheets: SheetSnap[];
  rolls: RollRec[];
  rollSeq: number;
  clearSeq: number;
  /** Rolls with seq <= clearMark were cleared by the host; they are kept but no longer sent. */
  clearMark?: number;
  /** Recently applied impact ids (retry dedupe). */
  seen?: string[];
};

type Member = {
  member_id: string;
  token: string;
  callsign: string;
  role: string;
  last_seen: string | Date;
};

type RoomRow = {
  code: string;
  host_token: string;
  revision: number;
  snapshot: Snapshot | string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function bytes(n: number): string {
  return randomBytes(n).toString("hex");
}

function roomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = randomBytes(5);
  let out = "";
  for (let i = 0; i < 5; i++) out += alphabet[buf[i]! % alphabet.length];
  return out;
}

function sameToken(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function emptySnap(): Snapshot {
  return { sheets: [], rolls: [], rollSeq: 0, clearSeq: 0 };
}

function asSnap(value: unknown): Snapshot {
  let v = value;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return emptySnap();
    }
  }
  if (!v || typeof v !== "object") return emptySnap();
  const o = v as Partial<Snapshot>;
  return {
    sheets: Array.isArray(o.sheets) ? o.sheets.filter((s) => s && typeof s.uid === "string") : [],
    rolls: Array.isArray(o.rolls) ? o.rolls : [],
    rollSeq: Number(o.rollSeq) || 0,
    clearSeq: Number(o.clearSeq) || 0,
    clearMark: Number(o.clearMark) || 0,
    seen: Array.isArray(o.seen) ? o.seen.filter((x) => typeof x === "string").slice(-SEEN_CAP) : [],
  };
}

function blobOk(value: unknown, limit: number): boolean {
  try {
    return JSON.stringify(value).length <= limit;
  } catch {
    return false;
  }
}

const LOG_CLASS =
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

function unitLabel(sheet: SheetSnap): string {
  if (sheet.name && sheet.name.trim()) return sheet.name.trim();
  const d = sheet.d;
  if (d && (d.id || d.cs)) return `${d.id || "--"} / ${d.cs || "--"}`;
  const ch = d?.ch;
  if (Array.isArray(ch) && typeof ch[0] === "string" && ch[0]) return ch[0];
  return "UNIT";
}

function redact(sheet: SheetSnap): SheetSnap {
  if (!sheet.d) return { ...sheet, d: null };
  const d: Record<string, unknown> = { ...sheet.d, pilot: {}, natk: {}, info: null };
  if (Array.isArray(d.items)) {
    d.items = d.items.map((it) => {
      if (!it || typeof it !== "object") return it;
      const copy = { ...(it as Record<string, unknown>) };
      delete copy.f;
      delete copy.r;
      return copy;
    });
  }
  if (d.core && typeof d.core === "object") {
    const core: Record<string, unknown> = {};
    for (const [k, sys] of Object.entries(d.core as Record<string, unknown>)) {
      if (sys && typeof sys === "object") {
        const copy = { ...(sys as Record<string, unknown>) };
        delete copy.f;
        delete copy.r;
        core[k] = copy;
      } else core[k] = sys;
    }
    d.core = core;
  }
  return { ...sheet, d };
}

function seenMs(value: string | Date): number {
  const t = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(t) ? t : 0;
}

function publicMembers(members: Member[]) {
  const now = Date.now();
  return members.map((m) => ({
    id: m.member_id,
    callsign: m.callsign,
    role: m.role === "host" ? "host" : "player",
    online: now - seenMs(m.last_seen) < ONLINE_MS,
    place: places.get(m.member_id) || "Welcome",
    color: seatColors.get(m.member_id) || "",
  }));
}

function present(snap: Snapshot, member: Member) {
  const host = member.role === "host";
  const sheets = snap.sheets
    .filter((s) => host || !s.hidden)
    .map((s) => (host || s.ownerId === member.member_id ? s : redact(s)));
  const visible = new Set(sheets.map((s) => s.uid));
  const mark = Number(snap.clearMark) || 0;
  const rolls = snap.rolls.filter((r) => r.seq > mark && (host || !r.uid || visible.has(r.uid)));
  const roster = snap.sheets
    .filter((s) => host || !s.hidden)
    .map((s) => ({
      uid: s.uid,
      name: unitLabel(s),
      ownerId: s.ownerId,
      hidden: host ? !!s.hidden : false,
    }));
  return {
    snapshot: { sheets, rolls, rollSeq: snap.rollSeq, clearSeq: Number(snap.clearSeq) || 0 },
    roster,
  };
}

function envelope(
  room: { code: string; revision: number },
  snap: Snapshot,
  member: Member,
  members: Member[],
  opts: { includeSnapshot: boolean; rollSince: number },
) {
  const view = present(snap, member);
  const hostOnline = members.some((m) => m.role === "host" && Date.now() - seenMs(m.last_seen) < ONLINE_MS);
  const rolls = view.snapshot.rolls.filter((r) => r.seq > opts.rollSince).slice(-80);
  return {
    ok: true,
    code: room.code,
    revision: Number(room.revision),
    changed: opts.includeSnapshot,
    snapshot: opts.includeSnapshot ? view.snapshot : undefined,
    rolls,
    rollSeq: view.snapshot.rollSeq,
    members: publicMembers(members),
    roster: view.roster,
    hostOnline,
    you: { id: member.member_id, role: member.role === "host" ? "host" : "player", callsign: member.callsign },
    features: FEATURES,
  };
}

async function loadRoom(sql: Sql, code: string): Promise<RoomRow | null> {
  const rows = await sql.query<RoomRow>(
    `select code, host_token, revision, snapshot from forge_rooms where code = $1`,
    [code],
  );
  const row = rows[0];
  if (!row) return null;
  return { ...row, revision: Number(row.revision), snapshot: asSnap(row.snapshot) };
}

async function loadMembers(sql: Sql, code: string): Promise<Member[]> {
  return sql.query<Member>(
    `select member_id, token, callsign, role, last_seen
     from forge_members where room_code = $1 order by role desc, callsign asc`,
    [code],
  );
}

async function touch(sql: Sql, code: string, memberId: string, callsign?: string) {
  if (callsign) {
    await sql.query(
      `update forge_members set last_seen = now(), callsign = $1 where room_code = $2 and member_id = $3`,
      [callsign, code, memberId],
    );
  } else {
    await sql.query(
      `update forge_members set last_seen = now() where room_code = $1 and member_id = $2`,
      [code, memberId],
    );
  }
}

async function memberByToken(sql: Sql, code: string, token: string): Promise<Member | null> {
  const members = await loadMembers(sql, code);
  const found = members.find((m) => sameToken(m.token, token));
  if (found) return found;
  const room = await loadRoom(sql, code);
  if (!room || !sameToken(room.host_token, token)) return null;
  const id = bytes(8);
  await sql.query(
    `insert into forge_members (room_code, member_id, token, callsign, role, last_seen)
     values ($1, $2, $3, 'HOST', 'host', now())
     on conflict (room_code, member_id) do nothing`,
    [code, id, token],
  );
  const again = await loadMembers(sql, code);
  return again.find((m) => sameToken(m.token, token)) ?? null;
}

function normalizeCallsign(raw: string | undefined, fallback: string): string | null {
  if (!raw || !raw.trim()) return fallback;
  const parsed = callsignSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function canWrite(sheet: SheetSnap, member: Member): boolean {
  return member.role === "host" || sheet.ownerId === member.member_id;
}

function applyRest(sheet: SheetSnap, rest: Record<string, unknown>) {
  if (!blobOk(rest, 450_000)) return;
  const prev = sheet.d ?? {};
  const d: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (k === "tel" || k === "undo" || k === "stab" || k === "dmg" || k === "uiHP" || k === "info") continue;
    d[k] = v;
  }
  d.tel = prev.tel ?? null;
  d.undo = prev.undo ?? [];
  d.stab = prev.stab ?? null;
  if ("dmg" in prev) d.dmg = prev.dmg;
  if ("uiHP" in prev) d.uiHP = prev.uiHP;
  if ("info" in prev) d.info = prev.info;
  sheet.d = d;
  sheet.rev += 1;
}

function applyState(sheet: SheetSnap, state: z.infer<typeof stateSchema>) {
  if (!blobOk(state.tel, 200_000) || !blobOk(state.undo, 200_000)) return;
  const d = { ...(sheet.d ?? {}) };
  d.tel = state.tel;
  d.undo = state.undo;
  d.stab = state.stab ?? null;
  sheet.d = d;
  sheet.rev += 1;
}

function undoEntries(sheet: SheetSnap): { id?: unknown; by?: unknown }[] {
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
  const d = { ...(sheet.d ?? {}) } as Record<string, unknown>;
  const tel = d.tel;
  if (!tel || typeof tel !== "object" || !Array.isArray((tel as { hp?: unknown }).hp)) return;
  const hp = (tel as { hp: number[]; sac?: number[] }).hp;
  if (imp.loc >= hp.length) return;
  const next = { ...(tel as object) } as { hp: number[]; sac?: number[]; heat?: number; keep?: number[] };
  next.hp = hp.slice();
  next.hp[imp.loc] = Math.max(imp.floor, Number(next.hp[imp.loc]) + imp.delta);
  const sac = Array.isArray(next.sac) ? next.sac.slice() : [];
  if (imp.sacInc) sac[imp.loc] = Math.max(0, (Number(sac[imp.loc]) || 0) + imp.sacInc);
  next.sac = sac;
  d.tel = next;
  const undo = Array.isArray(d.undo) ? [...(d.undo as unknown[])] : [];
  if (imp.pop) {
    // Shared undo: drop the entry this impact reverses (by id; the newest one for id-less clients).
    const idx = imp.of ? undo.findIndex((u) => !!u && typeof u === "object" && (u as { id?: unknown }).id === imp.of) : -1;
    if (idx >= 0) undo.splice(idx, 1);
    else if (!imp.of) undo.pop();
  }
  if (imp.undo) undo.push({ ...imp.undo, by: member.member_id });
  d.undo = undo.slice(-40);
  if (imp.stab !== undefined) d.stab = imp.stab && blobOk(imp.stab, 4_000) ? imp.stab : null;
  sheet.d = d;
  sheet.rev += 1;
}

function sheetFromUpsert(up: z.infer<typeof upsertSchema>, members: Set<string>): SheetSnap | null {
  if (up.d != null && (typeof up.d !== "object" || !blobOk(up.d, 500_000))) return null;
  return {
    uid: up.uid,
    name: up.name.slice(0, 28),
    col: up.col,
    hidden: up.hidden,
    ownerId: up.ownerId && members.has(up.ownerId) ? up.ownerId : null,
    closed: !!up.closed,
    rev: 1,
    d: (up.d as Record<string, unknown> | null) ?? null,
  };
}

function applyOrder(snap: Snapshot, order: string[] | null | undefined, member: Member) {
  if (!order || order.length < 2) return;
  const unique = new Set(order);
  if (unique.size !== order.length) return;
  if (member.role === "host") {
    if (order.length !== snap.sheets.length || !snap.sheets.every((s) => unique.has(s.uid))) return;
    const by = new Map(snap.sheets.map((s) => [s.uid, s]));
    snap.sheets = order.map((id) => by.get(id)!);
    return;
  }
  const hidden = snap.sheets.filter((s) => s.hidden);
  const visible = snap.sheets.filter((s) => !s.hidden);
  if (order.length !== visible.length || !visible.every((s) => unique.has(s.uid))) return;
  const by = new Map(visible.map((s) => [s.uid, s]));
  snap.sheets = [...order.map((id) => by.get(id)!), ...hidden];
}

function applyPush(snap: Snapshot, msg: z.infer<typeof pushSchema>, member: Member, members: Member[]) {
  const ids = new Set(members.map((m) => m.member_id));
  const dropped = new Set(msg.drops || []);
  if (dropped.size) {
    snap.sheets = snap.sheets.filter((s) => {
      if (!dropped.has(s.uid)) return true;
      if (member.role === "host") return false;
      return s.ownerId !== member.member_id;
    });
  }
  if (msg.meta && member.role === "host") {
    const prior = snap.sheets.slice();
    const next: SheetSnap[] = [];
    for (const m of msg.meta) {
      let sheet = prior.find((s) => s.uid === m.uid);
      if (!sheet) {
        const up = msg.upserts.find((u) => u.uid === m.uid);
        if (!up) continue;
        const made = sheetFromUpsert({ ...up, ...m, d: up.d }, ids);
        if (!made) continue;
        sheet = made;
      } else {
        sheet.name = m.name.slice(0, 28);
        sheet.col = m.col;
        sheet.hidden = m.hidden;
        sheet.closed = !!m.closed;
        sheet.ownerId = m.ownerId && ids.has(m.ownerId) ? m.ownerId : null;
      }
      next.push(sheet);
    }
    const extras = prior.filter(
      (s) => !next.some((n) => n.uid === s.uid) && !dropped.has(s.uid) && !!s.ownerId && s.ownerId !== member.member_id,
    );
    snap.sheets = [...next, ...extras];
  } else if (member.role === "host") {
    for (const up of msg.upserts) {
      if (snap.sheets.some((s) => s.uid === up.uid)) continue;
      const made = sheetFromUpsert(up, ids);
      if (made) snap.sheets.push(made);
    }
  } else if (!snap.sheets.some((s) => s.ownerId === member.member_id)) {
    for (const up of msg.upserts) {
      if (snap.sheets.some((s) => s.uid === up.uid)) continue;
      const made = sheetFromUpsert({ ...up, ownerId: member.member_id, hidden: false }, ids);
      if (!made) continue;
      made.ownerId = member.member_id;
      made.hidden = false;
      snap.sheets.push(made);
      break;
    }
  }

  for (const paint of msg.paints) {
    const sheet = snap.sheets.find((s) => s.uid === paint.uid);
    if (!sheet) continue;
    if (sheet.hidden && member.role !== "host") continue;
    if (member.role !== "host" && sheet.ownerId !== member.member_id) continue;
    sheet.col = paint.col;
  }
  if (member.role === "host") applyOrder(snap, msg.order, member);

  for (const rest of msg.rests) {
    const sheet = snap.sheets.find((s) => s.uid === rest.uid);
    if (!sheet || !canWrite(sheet, member)) continue;
    applyRest(sheet, rest.rest);
  }
  for (const state of msg.states) {
    const sheet = snap.sheets.find((s) => s.uid === state.uid);
    if (!sheet) continue;
    // Whole-telemetry writes replace every hit on the sheet, so only the host or the owner may
    // send them. Other seats change a sheet through additive impacts (damage, shared undo).
    if (!canWrite(sheet, member)) continue;
    applyState(sheet, state);
  }
  const seen = new Set(snap.seen ?? []);
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
    nonces.add(line.nonce);
    const sheet = line.uid ? snap.sheets.find((s) => s.uid === line.uid) : undefined;
    if (line.uid && !sheet) continue;
    if (sheet?.hidden && member.role !== "host") continue;
    // v5.3.1: a roll card id belongs to the seat that first sent it. Another seat reusing the id is dropped
    // (no rewriting someone else's line); the author's update replaces the stored card instead of adding a copy.
    if (line.rc && line.rc.k === "roll" && line.rc.id) {
      const cid = line.rc.id;
      const at = snap.rolls.findIndex((r) => r.rc && r.rc.k === "roll" && r.rc.id === cid);
      if (at >= 0) {
        if (snap.rolls[at].actorId !== member.member_id || !line.rc.up) continue;
        snap.rolls.splice(at, 1);
      }
    }
    snap.rollSeq += 1;
    snap.rolls.push({
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
      ...(line.rc ? { rc: line.rc } : {}),
    });
  }
  if (snap.rolls.length > ROLL_CAP) snap.rolls = snap.rolls.slice(-ROLL_CAP);
}

async function commit(sql: Sql, code: string, base: number, snap: Snapshot): Promise<number | null> {
  const rows = await sql.query<{ revision: number }>(
    `update forge_rooms
       set snapshot = $1::jsonb, revision = revision + 1, updated_at = now()
     where code = $2 and revision = $3
     returning revision`,
    [JSON.stringify(snap), code, base],
  );
  return rows[0] ? Number(rows[0].revision) : null;
}

async function handleCreate(sql: Sql, callsign: string): Promise<Response> {
  for (let i = 0; i < 6; i++) {
    const code = roomCode();
    const token = bytes(24);
    const id = bytes(8);
    const snap = emptySnap();
    const inserted = await sql.query<{ code: string }>(
      `insert into forge_rooms (code, host_token, revision, snapshot)
       values ($1, $2, 0, $3::jsonb)
       on conflict (code) do nothing
       returning code`,
      [code, token, JSON.stringify(snap)],
    );
    if (!inserted.length) continue;
    await sql.query(
      `insert into forge_members (room_code, member_id, token, callsign, role)
       values ($1, $2, $3, $4, 'host')`,
      [code, id, token, callsign],
    );
    const member: Member = {
      member_id: id,
      token,
      callsign,
      role: "host",
      last_seen: new Date(),
    };
    return json({
      ...envelope({ code, revision: 0 }, snap, member, [member], { includeSnapshot: true, rollSince: 0 }),
      token,
    });
  }
  return json({ error: "could not open a sortie code" }, 500);
}

async function handleEnter(sql: Sql, callsign: string): Promise<Response> {
  const token = bytes(24);
  const id = bytes(8);
  const inserted = await sql.query<{ code: string }>(
    `insert into forge_rooms (code, host_token, revision, snapshot)
     values ($1, $2, 0, $3::jsonb)
     on conflict (code) do nothing
     returning code`,
    [ROOM, token, JSON.stringify(emptySnap())],
  );
  if (inserted.length) {
    await sql.query(
      `insert into forge_members (room_code, member_id, token, callsign, role)
       values ($1, $2, $3, $4, 'host')`,
      [ROOM, id, token, callsign],
    );
    const member: Member = {
      member_id: id,
      token,
      callsign,
      role: "host",
      last_seen: new Date(),
    };
    return json({
      ...envelope({ code: ROOM, revision: 0 }, emptySnap(), member, [member], { includeSnapshot: true, rollSince: 0 }),
      token,
    });
  }
  return handleJoin(sql, ROOM, callsign);
}

async function handleJoin(sql: Sql, code: string, callsign: string): Promise<Response> {
  const room = await loadRoom(sql, code);
  if (!room) return json({ error: "no sortie under that code" }, 404);
  let members = await loadMembers(sql, code);
  const now = Date.now();
  // Re-authenticating with the callsign of an offline seat takes that seat back, so a pilot
  // whose token was lost keeps their unit (and the host keeps host). Same trust model as the
  // rest of the table: no accounts, the callsign is the table handle.
  const same = members.filter((m) => m.callsign.toUpperCase() === callsign.toUpperCase());
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
  if (members.length >= PEER_CAP) return json({ error: "this sortie is full" }, 403);
  const token = bytes(24);
  const id = bytes(8);
  await sql.query(
    `insert into forge_members (room_code, member_id, token, callsign, role)
     values ($1, $2, $3, $4, 'player')`,
    [code, id, token, callsign],
  );
  const member: Member = {
    member_id: id,
    token,
    callsign,
    role: "player",
    last_seen: new Date(),
  };
  const snap = asSnap(room.snapshot);
  return json({
    ...envelope(room, snap, member, [...members, member], { includeSnapshot: true, rollSince: 0 }),
    token,
  });
}

async function handleRead(
  sql: Sql,
  msg: z.infer<typeof tokenSchema>,
): Promise<Response> {
  const room = await loadRoom(sql, msg.code);
  if (!room) return json({ error: "sortie closed" }, 404);
  const member = await memberByToken(sql, msg.code, msg.token);
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
  const nextName = normalizeCallsign(msg.callsign, member.callsign);
  await touch(sql, msg.code, member.member_id, nextName && nextName !== member.callsign ? nextName : undefined);
  if (nextName) member.callsign = nextName;
  if (msg.place && PLACES.has(msg.place)) places.set(member.member_id, msg.place);
  if (msg.seatColor) {
    const target = msg.seatColor.id;
    if (member.role === "host" || target === member.member_id) seatColors.set(target, msg.seatColor.color);
  }
  const members = await loadMembers(sql, msg.code);
  const snap = asSnap(room.snapshot);
  const since = msg.since ?? -1;
  const rollSince = msg.rollSeq ?? 0;
  return json(
    envelope(room, snap, member, members, {
      includeSnapshot: since !== Number(room.revision),
      rollSince,
    }),
  );
}

async function handleEnd(sql: Sql, code: string, token: string): Promise<Response> {
  const member = await memberByToken(sql, code, token);
  if (!member) return json({ error: "link token rejected" }, 403);
  if (member.role !== "host") return json({ error: "only the host can end the sortie" }, 403);
  await sql.query(`delete from forge_rooms where code = $1`, [code]);
  return json({ ok: true, ended: true });
}

async function handlePush(sql: Sql, msg: z.infer<typeof pushSchema>): Promise<Response> {
  const raw = JSON.stringify(msg);
  if (raw.length > 1_500_000) return json({ error: "update too large" }, 413);
  let room = await loadRoom(sql, msg.code);
  if (!room) return json({ error: "sortie closed" }, 404);
  const member = await memberByToken(sql, msg.code, msg.token);
  if (!member) return json({ error: "link token rejected" }, 403);
  await touch(sql, msg.code, member.member_id);

  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt > 0) {
      const again = await loadRoom(sql, msg.code);
      if (!again) return json({ error: "sortie closed" }, 404);
      room = again;
    }
    const structural =
      msg.rests.length +
        msg.states.length +
        (msg.meta ? 1 : 0) +
        msg.upserts.length +
        msg.drops.length +
        msg.paints.length +
        (msg.order ? 1 : 0) >
      0;
    // Impacts are deltas and logs are appends, so a push with only those (and, from the host,
    // a clear) can land on any revision. Whole-blob writes still need a fresh base.
    if (Number(room.revision) !== msg.baseRevision && structural) {
      const members = await loadMembers(sql, msg.code);
      return json(
        {
          error: "conflict",
          ...envelope(room, asSnap(room.snapshot), member, members, {
            includeSnapshot: true,
            rollSince: msg.rollSeq,
          }),
        },
        409,
      );
    }
    const members = await loadMembers(sql, msg.code);
    const snap = asSnap(room.snapshot);
    applyPush(snap, msg, member, members);
    const rev = await commit(sql, msg.code, Number(room.revision), snap);
    if (rev == null) continue;
    const freshMembers = await loadMembers(sql, msg.code);
    return json(
      envelope({ code: room.code, revision: rev }, snap, member, freshMembers, {
        includeSnapshot: true,
        rollSince: msg.rollSeq,
      }),
    );
  }
  return json({ error: "link busy, retry" }, 409);
}

export async function handleForge(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json({ error: issue?.message || "invalid request" }, 400);
  }
  const msg = parsed.data;
  try {
    const sql = await getSql();
    if (msg.op === "create") return await handleCreate(sql, msg.callsign);
    if (msg.op === "enter") return await handleEnter(sql, msg.callsign);
    if (msg.op === "join") return await handleJoin(sql, msg.code, msg.callsign);
    if (msg.op === "end") return await handleEnd(sql, msg.code, msg.token);
    if (msg.op === "leave") return await handleRead(sql, msg);
    if (msg.op === "push") return await handlePush(sql, msg);
    return await handleRead(sql, msg);
  } catch (error) {
    console.error("[forge] room error:", error);
    return json({ error: "sortie link failed" }, 500);
  }
}
