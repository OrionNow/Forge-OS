# Desktop M2 ("Modular Cockpit", v5.5.1-D2): Ryuji review, round 1
**Checked against:** `out-desktop-m1/` (`desk.js`, `mp-bridge.js` and `terminal.html` from v5.5.1-D1, the newest copies), plus the spec, the mockup and four screenshots.

## Verdict: **SIGN OFF AFTER MUST-FIXES**
The concept is sound and the build order (taskbar → windows → roster → harvest → dolls) is right. The spec adds no game mechanics: one live `S`, slots stay local, the cupholder stays local.

Two areas would break at the table as written:
- the panel harvest timing;
- the mirror/live semantics.

Both are fixable without changing the design.

## Findings by question
1. **Live vs mirror.**
   - One live `S` with cached mirrors is the right model.
   - **Desync is by design.** A mirror is a snapshot, refreshed only when that sheet was last live. That's acceptable if it's clearly labelled.
   - **Edits on a mirror** are blocked through `inert`. Edits are never routed to another sheet, which is correct.
   - **Two problems:**
     - "Focusing a mirror makes it LIVE" means a click, F6 or a chip click silently runs `shGo()`. That changes `S.cur`, re-renders, plays audio, and in multiplayer re-attributes rolls and impacts (`curUid()`, mp-bridge l.1061/1105/1545).
     - In the screenshots, panels linked to a mirror (Impact, Rolls) look fully live.
2. **Tear-off by harvest.**
   - Listeners are safe: the terminal binds every listener on `document` and uses inline `onclick`.
   - **Timing breaks it.** `R()` → `anim()` → `play()` is **async** whenever the view, tab or selection changes (terminal l.1335-1336). A harvest in the synchronous `R` wrapper would run *before* `#out` is written, so the panels go stale and the new content lands in the hidden `#con`.
   - M1 is safe because it moves persistent containers by id (`#bar`, `#con`, `#sh`, `#cb`). M2 moves inner nodes that `R()` recreates every time.
   - **Mirror caches would duplicate ids** that live inside the views (`sitsum`, `tiers`, `tgtile`, `tgnote`…). `getElementById` would then hit whichever copy comes first in the DOM.
3. **Layout JSON.**
   - Fractions, clamping, a stable mech key and v1 migration are good.
   - **Version clash:** M1's `D()` (desk.js l.69) **resets `UI.desk` whenever `v !== 1`**. Opening a D1 or classic-fallback build in the same browser would wipe every M2 slot.
   - No validation is specified for unknown `k`/`t`, duplicate ids or panels, missing hosts, `seq`, or a future `v`.
   - The mech key "`fidJoin` **or** sheet name" is ambiguous, and names can collide.
4. **mp-bridge "one line".**
   - The parent swap is one line, but `paintFriends()` (l.1710-1727) also sets `box.style.top` from `#conhead` and toggles `.users` on the host. The `#mpfriends` CSS also assumes it sits inside `#cb`. Realistically it's 3-5 lines plus CSS.
   - It's display-only and touches no sync paths, so **multiplayer sync is unaffected**.
5. **Game data and mechanics:** none changed, with one exception. The optional P2 `withSheet()` sandbox would call `shApply()` on the live `S` (which writes state) and touch `S.uiHP`. That is a state-corruption and wrong-sheet-sync risk.
6. **Table usability.**
   - The taskbar beats the M1 rail, and the slots are a good fit for solo/table play.
   - The 8-window default at 1366×768 is dense:
     - titles truncate ("ICARUS SKIRM…");
     - three chips read "MSH-01…" and can't be told apart;
     - LIVE/MIRROR is a small glyph in a title bar that also carries a per-mech accent colour.

## Must-fixes
1. **Harvest timing:** run the harvest from a `MutationObserver` on `#out` and `#sh` (or hook the end of `anim()`/`play()`), not only after `R()`.
2. **Harvest hygiene:**
   - On every harvest, empty each panel's `.pb` and then *move* the fresh nodes; never clone live nodes.
   - Persistent id containers (`#bar`, `#cb`, `#mpfriends`) are moved once, never copied.
3. **Mirror cache:** strip every `id`, `for`, `name` and `on*` attribute from cached HTML, and mount it `inert`, so live `getElementById` lookups can't hit a mirror.
4. **Explicit promotion:**
   - Focus never changes `S.cur`. Add a `◆ MAKE LIVE` button (or double-click the title strip) that calls `shGo()`.
   - FOLLOW windows track the LIVE doll, not the last focused one.
5. **Visible mirror state:**
   - Every mirror-bound panel (dolls and LINKED/FOLLOW panels alike) gets a dim/hatched body.
   - It shows a `◇ MIRROR · hh:mm · MAKE LIVE TO EDIT` bar, with visibly disabled controls.
   - The LIVE window gets a distinct frame, not just a title glyph.
6. **Single-instance rule:**
   - Each harvested panel type has exactly one live host.
   - Any other panel of that type, or any panel bound to a non-live mech, shows the mirror cache.
   - The cache covers every mech-bound type (sheet panels too). A sheet never yet live shows `NOT YET VIEWED`.
7. **Storage key:** store M2 under a new `UI.desk2` (v2) and migrate read-only from `UI.desk` v1. That way M1 builds can't wipe M2 data, and M2 can't break M1.
8. **`sanitize(layout)` on every load and slot load:**
   - drop unknown `k`/`t`;
   - de-duplicate window and panel ids, and single-instance panels;
   - recompute `seq`;
   - guarantee at least one doll window and one console window;
   - clamp z below 1000;
   - on corrupt JSON or `v > 2`: load DEF, toast, and leave the stored blob untouched.
9. **Mech key:** use the sheet `uid` (already used by mp-bridge), with `fidJoin(d.id,d.cs)` as the solo fallback. Drop "or sheet name".
10. **Roster bridge change:** spec it as a host-aware branch that skips the `top` and `.users` logic when hosted, plus roster-window CSS. Label it "~4 lines, display-only, no sync impact" for the Overseer.
11. **CLASSIC / `hostOut`:** after returning the M1 containers, clear every panel and call `R()`, so classic mode isn't missing harvested nodes.
12. **Remove P2 `withSheet()`** from this milestone. Mirrors stay cache-only, so `S` is never mutated for display.

## Nice-to-haves (optional)
1. Make chip labels show type plus mech plus state (`◆MSH·DOLL`, `◇ICR·IMP`), so identical "MSH-01…" chips can be told apart at 1366.
2. **Hotkey collisions:**
   - Alt+1..9 switches browser tabs on Linux Chrome and Firefox.
   - F6 cycles browser panes.
   - Prefer Ctrl+Alt+digit and an in-app window cycle key.
3. Ship a lean "table" preset (live doll, impact, console, users: 4-5 windows) next to the 8-window default.
