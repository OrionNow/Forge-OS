# /api/forge contract (as implemented in `out/server/room.server.ts`, FORGE-OS 5.1)
- **Transport.** POST JSON to `/api/forge`. There is one table, room `TABLE`.
- **Compatibility.** Every addition is optional, and zod strips unknown keys, so 5.0 clients and 5.1 clients both work against either server.
- **Feature detection.** The 5.1 server adds `features: ["pop","ev"]` to every envelope. A 5.0 server sends none, and the bridge falls back for it.

## Ops

| op | body | notes |
|---|---|---|
| `enter` | `{callsign}` | The first seat creates `TABLE` and becomes the host. **5.1:** if a seat with the same callsign (case-insensitive) is **offline** (more than 5s), that seat is re-taken. It keeps the same `you.id`, so ownership and host survive, and gets a new token; the old token is then rejected with 403. A full table (8 seats) first frees player seats that have been away more than 30 min and own no unit. |
| `resume` / `poll` | `{code, token, since, rollSeq, callsign?, place?, seatColor?}` | The snapshot is included when `since !== revision`. |
| `push` | see below | |
| `end` | `{code, token}` | Host only. It deletes the room, and other seats then get **404 = table gone**. |
| `leave` | | Unchanged (a read). |

## Revisions
- One room-wide `revision` (bigint) is advanced by 1 per commit. `sheet.rev` is bumped per write but is informational.
- **Structural pushes** must have `baseRevision === revision`, or they get a 409. Structural means any of `rests`, `states`, `meta`, `upserts`, `drops`, `paints` or `order`.
- **5.1:** pushes that carry only `impacts`, `logs` and/or `clear` are applied on any revision. They are additive.
- **409 body.** `{error:"conflict", ok:true, code, revision, changed:true, snapshot, rolls, rollSeq, members, roster, hostOnline, you, features}`. After 8 commit races you get `409 {error:"link busy, retry"}` with no snapshot; treat it as transient.

## push fields (5.1 additions in bold)

**`impacts[]`**

| Field | Meaning |
|---|---|
| `uid`, `loc`, `delta`, `floor` | target and change |
| `sacInc` | **−5..5; was 0..5** |
| `undo` | `{l, t, s, **id**, **by**}` |
| `stab` | |
| **`id`** | `[A-Za-z0-9_-]{1,40}`; dedupe: the last 400 ids are remembered, so a retry applies once |
| **`kind`** | `"hit"` or `"undo"` |
| **`of`** | id of the undo entry being reversed |
| **`pop`** | 0/1; removes the undo entry `of` (or the newest entry when `of` is absent) |

- **Server-set `by`.** The server sets `undo.by` to the acting member. The client value is ignored.
- **Undo rights.** For `kind:"undo"` or `pop`, the actor must be the host, the sheet owner, or the `by` of entry `of`. Otherwise the impact is skipped.

**Other push fields**
- **`logs[]`** `{nonce, uid?, tone, html, color?}`.
  - A line whose `nonce` is already in the feed is skipped.
  - `html` is rebuilt from an allow-list:
    - tags `b`, `span`, `br`;
    - `class` from `rl-roll rl-tgt rl-m n-sl n-st n-rc n-hd ok bad warn dim roll-detail roll-total`;
    - `data-ev` and `data-undo-of` (`[A-Za-z0-9_-]{1,40}`).
  - Everything else is escaped to text, and open tags are closed. Clients must still treat `html` as untrusted; the 5.1 bridge re-sanitizes it.
- **`states[]`** (whole tel/undo/stab). **5.1: host or owner only.**
- **`rests[]`** host or owner (unchanged).
- **`order`** **host only (5.1).**
- **`clear`** **host only (5.1).** `clearSeq` is incremented and `clearMark = rollSeq`. Rolls are kept, but lines with `seq <= clearMark` are no longer sent. A player's clear is ignored.

## Not implemented (scope)
- **Per-field `patches` with `conflicts[]`.** The client does a 3-way merge on 409 instead.
- **`focus` presence echo.**
- **Server-built event lines.** The client still writes the UNDO line, and the server only sanitizes it.
- **Heat, ammo and repair as impact kinds.** Owner and host send these as `states`. Non-owners can't change them, which was already true for loadout.
- **Event history / payload trimming (R8).**

## Storage
- No migration is needed.
- The new fields `clearMark` and `seen` live inside the `forge_rooms.snapshot` jsonb.
- `forge_members` is unchanged. Seat release uses `delete from forge_members` for stale player seats.
