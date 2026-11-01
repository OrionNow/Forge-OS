/**
 * Sortie-link relay. The database holds the encounter so a closed browser
 * does not end the table. Member tokens are the capability — there are no accounts.
 * The host token on the room lets that browser reclaim host after a long absence.
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

const impactSchema = z.object({
  uid: UID,
  loc: z.number().int().min(0).max(64),
  delta: z.number().finite().min(-1_000_000).max(1_000_000),
  floor: z.number().finite().min(-1_000_000).max(1_000_000),
  sacInc: z.number().int().min(0).max(5).default(0),
  undo: z
    .object({
      l: z.string().max(200),
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

const logSchema = z.object({
  nonce: z.string().min(4).max(40),
  uid: UID.nullable().optional(),
  tone: z.enum(["ok", "bad", "warn", "dim"]).default("dim"),
  html: z.string().max(8000),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
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
};

type Snapshot = { sheets: SheetSnap[]; rolls: RollRec[]; rollSeq: number; clearSeq: number };

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
  };
}

function blobOk(value: unknown, limit: number): boolean {
  try {
    return JSON.stringify(value).length <= limit;
  } catch {
    return false;
  }
}

function sanitizeHtml(s: string): string {
  return s.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (m, tag: string) => {
    const t = tag.toLowerCase();
    if (t !== "b" && t !== "span" && t !== "br") return "";
    if (m.startsWith("</")) return `</${t}>`;
    if (t === "br") return "<br>";
    const cls = /class\s*=\s*"?([a-zA-Z0-9 _-]*)"?/.exec(m);
    const allow =
      cls &&
      cls[1]!.split(/\s+/).every((c) =>
        /^(rl-roll|rl-tgt|rl-m|n-sl|n-st|n-rc|n-hd|ok|bad|warn|dim|roll-detail|roll-total)$/.test(c),
      );
    return allow ? `<${t} class="${cls![1]}">` : `<${t}>`;
  });
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
  const rolls = snap.rolls.filter((r) => host || !r.uid || visible.has(r.uid));
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

function applyImpact(sheet: SheetSnap, imp: z.infer<typeof impactSchema>) {
  const d = { ...(sheet.d ?? {}) } as Record<string, unknown>;
  const tel = d.tel;
  if (!tel || typeof tel !== "object" || !Array.isArray((tel as { hp?: unknown }).hp)) return;
  const hp = (tel as { hp: number[]; sac?: number[] }).hp;
  if (imp.loc >= hp.length) return;
  const next = { ...(tel as object) } as { hp: number[]; sac?: number[]; heat?: number; keep?: number[] };
  next.hp = hp.slice();
  next.hp[imp.loc] = Math.max(imp.floor, Number(next.hp[imp.loc]) + imp.delta);
  const sac = Array.isArray(next.sac) ? next.sac.slice() : [];
  if (imp.sacInc) sac[imp.loc] = (Number(sac[imp.loc]) || 0) + imp.sacInc;
  next.sac = sac;
  d.tel = next;
  const undo = Array.isArray(d.undo) ? [...(d.undo as unknown[])] : [];
  if (imp.undo) undo.push(imp.undo);
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
  applyOrder(snap, msg.order, member);

  for (const rest of msg.rests) {
    const sheet = snap.sheets.find((s) => s.uid === rest.uid);
    if (!sheet || !canWrite(sheet, member)) continue;
    applyRest(sheet, rest.rest);
  }
  for (const state of msg.states) {
    const sheet = snap.sheets.find((s) => s.uid === state.uid);
    if (!sheet) continue;
    if (sheet.hidden && member.role !== "host") continue;
    // Any seat may sync telemetry (undo, and the host/owner's own heat and repair).
    // Loadout, skills and flavor stay on the rest path and remain owner/host only.
    applyState(sheet, state);
  }
  for (const imp of msg.impacts) {
    const sheet = snap.sheets.find((s) => s.uid === imp.uid);
    if (!sheet) continue;
    if (sheet.hidden && member.role !== "host") continue;
    applyImpact(sheet, imp);
  }
  if (msg.clear) {
    snap.clearSeq = (Number(snap.clearSeq) || 0) + 1;
    snap.rolls = [];
  }
  for (const line of msg.logs) {
    const sheet = line.uid ? snap.sheets.find((s) => s.uid === line.uid) : undefined;
    if (line.uid && !sheet) continue;
    if (sheet?.hidden && member.role !== "host") continue;
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
  const members = await loadMembers(sql, code);
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
    if (Number(room.revision) !== msg.baseRevision && (attempt === 0 || structural)) {
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
