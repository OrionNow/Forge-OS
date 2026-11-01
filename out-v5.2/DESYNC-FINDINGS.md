# Desync investigation: "armament, skills and heat reset for one player, survived a refresh, not reproducible"
I read `mp-bridge.js` (v15) and `room.server.ts` (5.1).
- **Sync path:** every edit or roll calls `R()`, which runs `schedule()`, which runs `buildPush()` (`restoreUnowned()` + diffs against `MP.shadow`). The server's reply goes through `applyRemote()` (`dirtyWritable()` + `mergeDirty()`).
- **Where the sections live:** armament = `d.items` (ammo/mount), skills = `d.pilot`, heat = `d.tel.heat`.
- **What survives a refresh:** the browser keeps no sheet data in localStorage, only the UI layout, audio/theme, callsign and seat token. So a problem that survives a refresh must come from **the stored server copy** or **the seat token → member mapping**.

## Causes, most likely first

1. **The host's copy overwrote the pilot's unit (host won every collision).** Likely. **Fixed.**
   - *Mechanism:*
     - The host may write every sheet, and v5.1 settled same-field collisions with "the host's value wins" on both seats.
     - A host with that pilot's tab open has a dirty local copy of it whenever they roll or adjust on it. Ammo/`pd` in `items` (armament) and `rolls`/`dmgN` are synced fields, and heat is sent as a whole-telemetry `states` write.
     - So any edit the pilot made in the same poll window was replaced by the host's copy and stored.
   - *Fits:* it hits only the player whose tab the host keeps open; it survives a refresh because the stored copy changed; it's timing-dependent, so hard to reproduce.
   - *Fix:* on a unit owned by an online seat, the **owner's value wins**, on the host and on the pilot side alike. The log says `OWNER VALUE KEPT` or `YOUR VALUE KEPT (YOUR UNIT)`.
   - *Test:* `check-v52-mp.js` has the host and the pilot write the same field at the same moment; both seats end on the pilot's value.

2. **Seat / ownership mix-up (a "ghost" seat with the same callsign).** Plausible. **Fixed.**
   - *Mechanism:* re-entering while the old seat was still online (a second tab or device, a lost token, a refresh inside the 5 s online window) created a **second member with the same callsign**. The roster showed two identical names, so the host could assign the unit to the wrong one.
   - *Related routes:*
     - A shared browser's stale token went through `resume`, which **renamed** another pilot's seat.
     - Re-take by callsign picked the first match, which might be the ghost.
   - *Result:* the unit's `ownerId` ≠ this tab's seat. The seat gets a **redacted** copy (`pilot: {}`, item notes stripped), and `restoreUnowned()` silently reverts every local edit on the next push. The server also drops that seat's `rests`/`states` (write rights since v5.1). This survives a refresh because the token maps to the wrong seat.
   - *Fix (server):*
     - An online duplicate callsign is refused (409).
     - Re-take prefers the seat that owns a unit, then the most recently seen.
     - `resume` under a different callsign is refused (403).
     - `leave` frees the seat at once.
   - *Fix (client):*
     - Duplicate names show a seat tag (`PILOTB #3a8a`).
     - New notices: **SEAT MISMATCH** (your callsign's unit belongs to another seat) and **EDITS NOT SAVED** (who owns the unit).
     - `MP RESET-LOCAL` releases the seat and re-enters the callsign, which re-takes the owning seat.

3. **A refused update blocked every later push.** Proven server behaviour; the trigger is rare. **Fixed.**
   - *Mechanism:* the server rejects the **whole push** (400) if one console line is over 8000 chars or a sheet name is over 28 chars. The client re-sent the same payload forever (backoff, LINK ERR), so none of the seat's later skills/loadout/heat edits were stored, and a refresh reverted to the last accepted copy.
   - *Triggers:*
     - A damage line from a very high RoF × many-dice weapon. About 45+ dice at RoF 30, so rare.
     - A host "(COPY)" name over 28 chars.
   - *Fix:*
     - Lines are capped at 7800 chars and names at 28.
     - A refused push drops its console lines (and its queued hits if it is refused again), tells the user, and lets sheet edits through.
   - *Test:* `server-api-test-v52.mjs` checks that an 8100-char line returns 400 and a 7800-char line returns 200.

4. **An empty table copy replaced non-empty local data.** Defensive. **Guarded.**
   - Any path that delivers a copy with empty `pilot`, empty `items` or no heat (a redacted copy, an old or blank stored blob) is now ignored for units this seat owns (or unowned units, for the host).
   - The local values are kept and re-sent, which repairs the stored copy, and a SYNC GUARD line is logged.
   - `MP RESYNC` takes the table copy deliberately.

5. **Found while testing:** after `[RE-AUTH]` / re-entry, an unchanged table never reloaded. The stale fingerprint in `mpReauth()` left the sheet list empty until someone changed something, which could also look like "everything reset". **Fixed:** the fingerprints are cleared on re-auth, and a pilot lands on their own unit.

**Ruled out:**
- **`cleanPilot()` whitelist:** it isn't on the sync path; it's only used for manifest/flight-recorder encoding. It would strip new pilot keys, so `aoa` was added to it.
- **`forge_ui_v1`:** UI state only.
- **`forge_mp_callsign`:** only a prefill and a quiet-reconnect key. Its real effect comes through the seat token, which is cause 2.
- **v5.1 write rights:** they only bite when ownership is wrong, which is cause 2.

**If it recurs:** have the player type `MP WHOAMI`. It shows the seat and id, the current unit's owner, whether edits are saved, the queue size and the last link error.
- **"READ ONLY FOR THIS SEAT" on their own unit** means cause 2: use `MP RESET-LOCAL`, or the host reassigns the unit.
- **A "LINK REFUSED AN UPDATE" line** means cause 3.
