# FORGE-OS 5.1.0: change log for this update (passes 1-7)

**Base files (rebased 2026-10-26).**
- The work is built on the **deployed** files in `from-grok/FORGE-OS-sortie-app/public/`: `terminal.html` v5.0.1, `mp-bridge.js` v14 and `forge-hook.js` v6.
- `/workspace/forge-os/terminal.html` (v5.0.2) is a page snapshot saved from a live session. It is not used as a base.
- The two JS files are byte-identical to the deployed ones.

**Differences between the snapshot and the deployed terminal:**
- The snapshot has a baked-in `<style id="mpstyle">`, `<body class="mp-linked">` and a stale `<aside id="mpfriends">` roster (`OVERSEER · you`). These are runtime DOM, not source, and are not carried over. On the deployed page, `ensureChrome()` injects the live-table CSS once.
- `APP_VERSION` is 5.0.2 in the snapshot and 5.0.1 deployed. The snapshot has no 5.0.2 changelog entry.
- The theme label is `IMPERIAL SCIENCE` in the snapshot and `IMPERIAL SCIENCE CORPS` deployed. The deployed label is kept.
- **⚠ The VENT values are swapped on two reactors. Flagged, not changed.**

  | Reactor | Deployed (kept) | Snapshot |
  |---|---|---|
  | LIGHT FISSION CELL | VENT:1 | VENT:3 |
  | HEAVY FUSION CORE | VENT:3 | VENT:1 |

  - The deployed values rise with size and HEAT, which is consistent: Light 7/1, Standard 10/2, Heavy 12/3.
  - These are house items, not in the GURPS PDFs, and there is no changelog note, so this is not clearly a data bug.
  - Venting sheds 1 heat plus 1 per VENT points of margin, so a **lower** VENT vents faster. With the deployed values the heavy core trades cooling for HP and cap. With the snapshot values the Heavy Fusion Core would be better than the Light cell on HP, cap *and* venting. That points to the snapshot as the odd one out, but it isn't proof.
  - The deployed values are kept. Ask the catalog owner which one is intended.

**Legend.**
- ✅ = implemented.
- ◐ = partly implemented (the reason is given).
- ✕ = skipped (the reason is given).
- **[NEW UI]** = adds a control or panel that wasn't there before.

## Passes 1-3 (accepted proposals)

| Item | Status | Where / note |
|---|---|---|
| AA contrast across themes | ✅ | `v51.css` theme overrides (pass 7.3) |
| One warn and one crit colour, with text cues next to colour | ✅ | `--c-*` pinned; `▲`/`✕` cues (pass 4.4) |
| Exact numbers kept with gauges | ✅ | segmented overlays; numbers unchanged (5.3) |
| Clear SYNC states | ✅ | `syncState()`/`syncText()`, HUD `#sync` (7.4) |
| Editing chips / `focus` presence | ✕ | needs a server `focus` echo; dropped for scope |
| Ship status/sync/damage first (A0 before UI) | ✅ | pass 4 |
| Shared undo with a correction line and strike-through | ✅ | 6.1 / 6.2 |
| Conflict resolution for queued edits | ◐ | automatic 3-way merge with one tie rule, plus a logged CONFLICT line and status. The choose-per-field CONFLICT card was dropped for scope |
| Crit/offline badges on collapsed sections | ✅ | `shBadge()` (5.2) |
| Sticky search only in the catalogue, `/` shortcut | ✅ | `catHead()`/`catFilter()` (6.3). **[NEW UI]**: small search box |
| Font check for symbols | ✅ | fontTools check; only `✕ ▲ ● ○` used (5.1) |
| SUMMARY / FULL READOUT view | ✕ | dropped for scope (new view) |
| Accessible paper doll (keyboard, aria) | ✅ | `.mlab` `role=button`, keys (5.2) |
| Live announcements (`#sr` / `#sra`, throttled) | ✅ | 4.4 (screen-reader only, no visible UI) |
| Motion and sound safeguards | ✅ | 7.1 / 7.2 |
| One primary readout (sheet hierarchy) | ✅ | `.panel.primary` brackets (5.3) |
| Mobile `#mpfriends`, touch and small-screen items | ✕ | mobile is out of scope (owner) |

## Pass 4

| Item | Status | Note |
|---|---|---|
| 4.1 R7: sanitize remote HTML (client and server) | ✅ | `cleanHtml()` + `safeTone()`; server tokenizer |
| 4.2 A0 server: write rights, host-only order/clear with a marker, id/nonce dedupe, no gate on additive pushes | ✅ | `out/server/room.server.ts`; no migration |
| 4.3 R1/R2 unsent edits survive polls, 409s and the host replay | ✅ | `dirtyWritable()` + `mergeDirty()` in `applyRemote()` |
| 4.3 R3 undo keeps queued hits | ✅ | inverse impacts |
| 4.3 R4 never drop the queue | ✅ | `MP.stuck` |
| 4.3 R5 frozen revision on the bench | ✅ | |
| 4.3 R6 reconnect, backoff, hidden tab, RE-AUTH, keep ownership on re-auth | ✅ | `[RE-AUTH]` button **[NEW UI]** (a single button in the error state); server reclaims the seat by callsign |
| 4.3 seat leak: no login-screen seat; free stale seats | ✅ | `connectQuiet()`; server prune at the cap |
| 4.3 R9 host-only clear | ✅ | |
| 4.4 one amber / one red, AA verified on navy and talon; `#sra` throttle | ✅ | |
| 4.5 HUD sortie readout plus a subtle crit pulse | ✅ | restyle of the existing `.sorhead`; 0.24s pulse, no shake |
| R8 payload size (undo snapshots) | ✕ | unchanged; needs a server-side event history, which is out of scope |

## Pass 5

| Item | Status | Note |
|---|---|---|
| 5.1 typography / bundled font | ✅ | `out/fonts/` (OFL) |
| 5.2 keyboard section headers and badges | ✅ | |
| 5.3 segmented gauges, EP text cues, primary frame | ✅ | |
| 5.4 BRITTLE: parser fixes, tag, auto -1 SR below half Core HP | ✅ | `devtools/check-brittle.js`: 13/13 pass. The tag is **[NEW UI]** (text in the HUD) |
| 5.5 RADS: number, +/-, band tag, log, `+RAD/SORTIE`, `+PURGE 50` | ✅ | **[NEW UI]**: one line at the top of `pilotView()`. There is no accrual engine. The heat-zone +10/+25 and the 50m 10-rad dose are entered by hand. Undo does not cover rads. A non-owner sees the unit's pilot record redacted by the server, including rads, by design |

## Pass 6

| Item | Status | Note |
|---|---|---|
| 6.1 simple shared undo (id/kind/of/pop, server-stamped actor, negative sacInc, rights) | ✅ | verified over the real server |
| 6.2 timestamps and struck-through undone lines | ✅ | |
| 6.2 log filter chips | ✕ | dropped for scope (new UI) |
| 6.3 catalogue search | ✅ | **[NEW UI]** (see passes 1-3) |
| 6.4 late joiners see the last 30 lines; host-only clear | ✅ | |
| Command palette (Ctrl+K), dossier compare, turn tracker | ✕ | dropped for scope (new systems) |

## Pass 7

| Item | Status | Note |
|---|---|---|
| 7.1 audio muted by default; boot once per session | ✅ | |
| 7.2 reduced motion, 3-cycle crit cap | ✅ | |
| 7.3 theme AA fixes | ✅ | |
| 7.4 link readout, HOST AWAY | ✅ | uses the existing `hostOnline` |
| 7.5 wide-screen layout ≥1700px | ✅ | CSS only |
| FX and scanline toggle buttons | ✕ | dropped (new header controls); reduced motion covers the need |

## Catalogue team additions (`catalog-additions-pass5.txt`)
- **Heat revisions not applied.** `pass5-heat-revisions.md` (a draft that appeared while this pass was running) proposes heat and EP changes to 5 of the 14 lines. It is marked as a draft for Overseer, so the original `catalog-additions-pass5.txt` lines were used. Re-running `devtools/patch_terminal.py` after the source file is updated will pick up the revisions.
- **Catalogue lines.** All 14 lines are appended to `RAW`. An `|0` sd field was added where a line had 13 fields. The patcher checks for backticks, `${` and duplicate names.
- **Radiation (B435).** See 5.5. The band cutoffs (100/200/400) are table defaults, chosen to keep the UI simple. They are placeholders for the GM, not B435 effect thresholds.
- **BRITTLE.** See 5.4.

## Version and cache busting
- `APP_VERSION` and the header both read 5.1.0. There is an in-app changelog entry for 5.1.0.
- `forge-hook.js?v=7` (adds `Forge.version`, `Forge.ui()` and `Forge.announce()`).
- `mp-bridge.js?v=15`.
- `<link rel=icon href="data:,">` stops the favicon 404.

## Validation (2026-10-26)
- **Syntax.**
  - `node --check` passes on `out/mp-bridge.js`, `out/forge-hook.js` and the extracted inline script of `out/terminal.html`.
  - `tsc --noEmit` on a copy of the project with `out/server/room.server.ts` passes with 0 errors.
  - eslint reports 0 errors. Its one warning (`MEMBER` unused) was already there.
- **`devtools/server-api-test.mjs`** runs against the real dev server (`npm run dev`, PGlite): 18/18 pass. It covers the R7 payloads, nonce and id dedupe, stale impact-only pushes, the state write lock, undo rights, pop with negative sacInc, the order/clear locks, the 409 shape, callsign re-auth and the 5.0 impact shape.
- **`devtools/check-brittle.js`**: 13/13 pass.
- **Headless Chrome (playwright-core).**
  - Solo flow: login, catalogue search, sortie HUD, rads, crit pulse, undo strike-through, reduced motion, themes and wide screen. 0 console errors, and 0 API calls on the login screen.
  - Two-seat flow on the real server:
    - A pilot hits the host's unit and undoes it; the host sees both changes.
    - The XSS line is inert, and the pilot's clear stays local.
    - When the table ends, the pilot gets `[LINK ERR // RE-AUTH]`, and re-auth works.
    - The only console errors are the expected 404s after the table was deliberately ended.
- **Screenshots** are in `out/shots/`.
