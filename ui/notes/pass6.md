# FORGE-OS: UI/UX Pass 6: shared undo, the console ledger, and the catalogue
Desktop only.

## 6.1 Simple shared undo (A2, minimal server)
- **Undo entries.** `pushUndo()` stamps each entry with `{id, by}`. The server overwrites `by` with the acting seat.
- **Impacts.** Each impact carries `{id, kind:"hit"}`. An undo sends inverse impacts `{id, kind:"undo", of, pop}`, and the server pops the entry whose id matches `of`. `sacInc` may be negative, which ends the old forever-400 resend.
- **Rights.** The host, the owner, or the seat that made the entry may undo it. Both the bridge and the server enforce this, and a denied undo says who can undo it.
- **Verified.** Over the real server, a pilot hits the host's MUSHA (Left Arm 83 → -83) and undoes it. The host sees 83, the undo stack is empty, and the hit line is struck through.
- **Old servers.** A 5.0 server without the `pop` feature still gets the safe client path: queued hits are kept, and the whole-tel write happens only on writable sheets.

## 6.2 Console ledger: timestamps and struck-through undone lines
- **Timestamps and line kinds.** `type()` adds a muted `HH:MM:SS` (`.ts`, aria-hidden) to every line and tags it with `data-k` (hit/roll/rad/sys/msg).
- **Undo marks.**
  - `evTag()` wraps lines said within 1.5s of a `pushUndo()` in `<span data-ev>`.
  - `undoLast()` prefixes its line with `<span data-undo-of>`.
  - `markUndone()` strikes through the original line. The UNDO line stays, because the log is append-only.
  - This works for remote lines too, because the server sanitizer keeps both attributes.
- **No filter chips.** They were dropped as new UI surface.

## 6.3 Catalogue search, sticky, catalogue only
- **Search box.** `catHead()` sits at the top of `list()` and after the tabs in `catalogView()`. It is a `role=search` input that is sticky inside `#con` only.
- **Filtering.** It filters `.row` by every term, hides empty `.sec` and `.catalog-subtype` headers, and shows a live `n MATCHES` count. Escape clears it.
- **Shortcut.** `/` focuses the box, including from an empty `CE//FORGE>` prompt.
- **Re-renders.** The filter is re-applied after the crawl animation and in the no-change render path.

## 6.4 Late joiners and a shared clear
- **Late joiners.** On the first poll, the last 30 lines of the table log are shown silently, without the typing animation. Before, a late joiner saw an empty console. The server already sends 80.
- **Clear.** Only the host clears the shared log (4.2/4.3). A pilot's clear stays on their own screen.
