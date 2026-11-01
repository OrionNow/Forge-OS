# FORGE-OS: UI/UX Pass 4: A0 fixes first, then the status layer
Base: deployed `public/terminal.html` v5.0.1, `mp-bridge.js` v14, `forge-hook.js` v6, `src/lib/forge/room.server.ts`. Desktop only. Scope rule: fixes and polish come before new features.

## 4.1 R7: remote console HTML can't run script (fixed first)
- **Problem.**
  - The server's regex filter (`sanitizeHtml`, S:241) only matches complete tags, so `PWN <img src=x onerror=...` passes through.
  - The bridge then sets `innerHTML` on two paths: `speakRemote()` → `type()`, and the silent path. Its own `</span>` closes the `img` tag.
- **Client fix.**
  - `drainRolls()` now passes `r.html` through `cleanHtml()`. That parses into an inert `<template>`, keeps only `span/b/i/u/em/strong/small/br/div/sup/sub`, and keeps only these attributes: `class` (`^[\w -]{0,80}$`), `data-ev`/`data-undo-of`, `title`, and `style` when it's `color:#hex` or `color:var(--x)`. Every other element is replaced with its text.
  - `safeTone()` limits `r.tone` to ok/bad/warn/dim. Actor and unit names already went through `esc()`.
- **Server fix.**
  - `sanitizeHtml()` is now a tokenizer.
  - A tag is kept only if it is complete and well formed, from `b`, `span`, `br`.
  - `class` keeps the existing allow-list. `data-ev` and `data-undo-of` are allowed.
  - Everything else is escaped to text, and open tags are closed at the end of the line.
- **Verified.**
  - Over the real server, the line reaches the host as visible text, with `window.__pwn` unset and no `<img>` in `#log` (`devtools/server-api-test.mjs`, `/workspace/pw/mp.js`).

## 4.2 A0, server half: write rights, idempotent retries, no 409 loop
- **Whole-telemetry writes.** `states` are accepted only from the host or the owner (`canWrite`). Before, any seat could overwrite any sheet's HP. Other seats still change a unit through additive `impacts`, which keeps the "damage box for everyone" rule from SETUP.txt.
- **Host-only actions.**
  - `order` is host-only.
  - `clear` is host-only. It stores `clearMark` instead of deleting rolls, and the envelope stops sending lines at or before the mark.
- **Retry dedupe.**
  - Impacts carry an `id`. The server keeps the last 400 ids in the snapshot (`seen`), so a retried push can't land a hit twice.
  - A log line whose `nonce` is already in the feed is skipped.
- **No revision gate for additive pushes.** Impact-only and log-only pushes are no longer revision-gated (S:763 `attempt===0||structural` → `structural`). This ends the R4 drop loop at the source.
- **No migration needed.** Everything new lives in the `snapshot` jsonb.

## 4.3 A0, client half: R1 / R3 / R4 / R5 / R6, seats, R9
- **R1/R2. Unsent edits survive.**
  - `applyRemote()` takes a snapshot of the writable sheets that differ from `MP.shadow` before it overwrites anything. It then runs `mergeDirty()`, a 3-way merge against the old shadow:
    - Untouched fields take the table value.
    - Numeric `tel` adds both sides' deltas.
    - `undo` stacks are unioned by id.
  - This covers polls that land inside the 220ms `schedule()` delay, the 409 path and the host replay.
  - One tie rule, applied in this order:
    - The host's value wins.
    - While the host is offline, the last writer wins.
    - A player whose value collides with a live host keeps the table value. A console line shows both values (`[ -- ] CONFLICT unit path :: TABLE=… vs YOU=… => …`).
  - `[CONFLICT // RESYNCED]` shows for 6 seconds.
- **R3. Undo no longer discards queued hits.** It sends additive inverse impacts (`kind:"undo", of, pop`), using sac deltas and stab where those changed. The owner or host still forces a state write when heat, ammo or other `tel` fields changed. The queued impacts land first.
- **R4. Nothing is dropped.** The queue is kept after more than 4 conflicts (`MP.stuck`, shown as `[RESYNC · n QUEUED]`).
- **R5. Return from the frame editor.** `MP.rev` is frozen while the bench is open (`!MP.on && !MP.editing`), so the return push gets a 409 and merges.
- **R6. Reconnecting.**
  - `loop()` clears `MP.timer`, guards against re-entry, tracks RTT and backs off on failure (900ms → 15s).
  - Polling slows to 4s in a hidden tab and resumes on `visibilitychange`.
  - A 404 (table gone) or 403 shows `[LINK ERR // RE-AUTH]` with a `[RE-AUTH]` button (`mpReauth()` resets the link and opens the callsign screen).
  - Server: entering with the callsign of an **offline** seat takes that seat back (same member id, so ownership and host survive).
- **Seat leak (R10).**
  - `connectQuiet()` only resumes a saved token plus callsign. It never `enter`s as "USER UNKNOWN", so the login screen makes no API calls (verified: 0).
  - Server: when the table is full, player seats that have been away 30 minutes and own no unit are released.
- **R9.** A player's `clear` only clears their own screen and says so. Only the host clears the shared log.

## 4.4 One amber, one red, AA everywhere, and a throttled `#sra`
- **Colours.**
  - `--c-dmg` and `--c-warn` are the same value, `#ffa726`.
  - Contrast for that amber: 10.26:1 on navy `#050a08`, 10.42:1 on talon `#0a0505`, 7.62:1 on talon hover.
  - `--c-crit` is `#ff4d4d`: 6.10:1 navy, 6.19:1 talon, 4.53:1 talon hover. `--c-ok` is `#3fdc7f`.
  - These are pinned for every theme and skin. Talon `--fg` goes from `#bf3f3f` (3.86) to `#e05a5a` (5.57).
- **Screen-reader regions.**
  - A polite region `#sr` and an assertive region `#sra`.
  - Remote hits within 1 second are combined ("PILOTB: 3 hits").
  - Only the first crit or disabled state per location per sheet goes to `#sra`.

## 4.5 HUD sortie readout with a subtle crit reaction
- **HUD.** `sortieView()`'s `.sorhead` becomes `.sorhead.hud`, a sticky grid. It holds the ID, frame/base HP with the BRITTLE tag, STATUS, INTEGRITY (`▲`/`✕` cue plus a segmented `.igbar`), HEAT (`▲ DANGER`/`✕ REDLINE`) and the ISB LINK state (`#sync`). The cell text wraps instead of being cut off.
- **Crit reaction.**
  - When `critScan()` finds a fresh crit, `hudCrit()` runs one 0.24s red edge pulse at low opacity and a 0.7s outline on the readout. It can fire at most once every 2.5s.
  - There is no shake and no glitch.
  - Under `prefers-reduced-motion` only the outline shows.
