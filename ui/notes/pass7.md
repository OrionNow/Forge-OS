# FORGE-OS: UI/UX Pass 7: calm defaults, motion, themes and the link readout
Desktop only.

## 7.1 Audio muted by default, boot once per session
- **Audio.** It is muted until it's turned on (`localStorage.forgeAudio`), and the header reads `[AUDIO: MUTED]`. This also removes the AudioContext autoplay warnings.
- **Boot.** `seqFor()` plays the full boot sequence once per browser session (`sessionStorage.forgeBooted`). After that it shows a single `KERNEL ONLINE // WARM START` line.

## 7.2 Reduced motion and animation caps
- **Under `prefers-reduced-motion`.** `crawl()` and `hvAnim()` skip, the crit pulse is replaced by an outline, and transitions are turned off.
- **Crit loops.** Crit animations stop after 3 cycles (`animation-iteration-count:3`) instead of looping.

## 7.3 Theme consistency (AA)
- **Muted and label colours** that failed AA were raised:

  | Element | Old | New |
  |---|---|---|
  | navy muted | `#678` (4.33) | `#8a9aa6` (6.89) |
  | talon/admin label | `#aa2a2a` (2.92) | `#e46a6a` |
  | talon/admin fg | `#bf3f3f` | `#e05a5a` |
  | talon/admin muted | `#786767` | `#a39494` |
  | sci/research label | `#a14fc5` (4.22) | `#b98ae0` |
  | sci/research muted | `#75677e` | `#9a8aa6` |
  | remus muted | `#7a7258` | `#a39a7c` |
  | crow muted | `#567` | `#8fa38c` |
  | `.sp` | — | `#8a9aa6` |
- **Status colours.** These are pinned per 4.4, including inside `.mechmap[data-tt]`.

## 7.4 Link readout and HOST AWAY
- **States.** `syncState()`/`syncText()` show `[LINK OK]`, `[LINK LAG nms]` (RTT > 600ms), `[OFFLINE · n QUEUED]`, `[CONFLICT // RESYNCED]`, `[RESYNC · n QUEUED]`, `[LINK ERR // RE-AUTH]` plus a button, and `[LOCAL]`.
- **HOST AWAY.** `[HOST AWAY]` comes from `hostOnline`.
- **Where it shows.** The state appears in the header and in the HUD's ISB LINK cell. `markSync()` only updates when the state changes, and each change except lag is announced politely.

## 7.5 Wide-screen layout (≥1700px)
- **Layout.** `#rt` becomes a grid with the sheet and console side by side, and `#wrap` is capped at 1880px.
- **Below 1700px** the layout is unchanged. It is CSS only.

**Dropped for scope:** the command palette, dossier compare, turn tracker, SUMMARY view, log filter chips, FX and scanline toggles, `focus` presence, per-field patches with a CONFLICT card, rads auto-accrual, and all mobile items. See CHANGELOG.md.
