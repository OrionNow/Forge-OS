# FORGE-OS desktop shell, milestone 1 (on v5.5.1)

This is the first feedback-ready step of `desktop-proposal.md` (the MVP phase). The game logic, the view functions and the sync are unchanged. The shell is one classic script, `desk.js` (with its CSS inline), loaded after `mp-bridge.js`. The only edit to `terminal.html` is the one `<script>` tag.

## Done
- **Desktop shell** (on by default): the clearance header on top, a **MODULE BAY** rail on the left, and a desktop area holding three windows:
  - **SORTIE TELEMETRY** (also FRAME ASSEMBLY / COMPONENT REGISTRY / ACCESS ROUTER; the title follows `S.view`, with `// BENCH` while `mpEditor()` benches the table). It hosts `#bar` (sheet tabs / EP bus) and `#con`. It's the primary window, with cyan brackets.
  - **FRAME SHEET** hosts `#sh`.
  - **OPERATOR CONSOLE** hosts `#cb`: log, input and the USERS roster panel.
- **Re-hosting, not rewriting.** The existing DOM nodes move into the window bodies, and `R()` keeps writing the same IDs. A single `R` wrapper retitles the windows (unit name first, e.g. `MSH-01 MUSHA TEST // SORTIE TELEMETRY`) and refreshes the bay.
- **Window chrome.** Drag the title strip to move a window; it snaps to the desktop edges within 12px. Resize from the corner. `[–]/[+]` collapses to the strip, `[_]` minimizes to the bay, `[□]` maximizes or restores (double-clicking the title does the same), and `[✕]` closes the sheet window. Clicking a window raises it (z 10–999 inside an isolated stacking context, renormalised at the top end), and the focused window gets a bright title strip and `aria-current`. Every chrome button has a `title` and an `aria-label`, and collapse sets `aria-expanded`.
- **Module bay:** one slot per window (`●` open, `–` collapsed, `_` minimized). Clicking a slot restores and focuses the window. The footer has `[RESET LAYOUT]` and `[CLASSIC LAYOUT]`.
- **Classic toggle.** `[CLASSIC]` / `[DESK]` sits in the header (and the bay has `[CLASSIC LAYOUT]`). It puts every container back exactly where v5.5.1 had it, and the choice persists.
- **Persistence.** Layouts are stored in `forge_ui_v1` under `UI.desk` as fractions of the desktop area, per profile (`solo` / `table`), and clamped back on screen when restored. They're never synced.
- **Layers:** `#mpveil` is defined at z 2000, above every window. The toast is at 1200, `#hudfx` at 1100, the `#mpassign`/`#mptint` popovers at 1300 and `#clog` at 1500.
- **Keys:** `F6` / `Shift+F6` cycle window focus; `Alt+C` focuses the console input (restoring the console window if needed).
- The desktop keeps the retro terminal look and the theme variables: chrome uses `--line`, `--cyan`, `--fg`, `--bg` and `--hover`.

## Tests
- All v5.5.1 suites pass against this build with the desktop on and **no selector changes**: solo 119/119, two-seat 59/59, two-seat sync 11/11, API 10 + 18 + 11 + 7 (fresh dev server), brittle 13/13, race repro OK.
- New `devtools/check-desktop-m1.js`: 14/14. It covers hosting, titles, the default layout, dragging and its saved position, collapse / minimize / bay restore, maximize, Alt+C plus the console working in its window, persistence across reload, the classic toggle and its persistence, `[DESK]` back, reset, the one-line header and view retitling.
- Screenshots: `shots/desk-m1-default.png`, `shots/desk-m1-moved-collapsed.png`, `shots/desk-m1-registry.png`.

## Left for the next milestones
- **M2 (rest of the MVP):**
  - 8 resize handles with per-window minimum sizes (M1 uses the native corner grip and min-width / min-height only).
  - Role-based default layouts (host / pilot with the collapsed sheet / solo roles with the console collapsed) and `[NO CLEARANCE]` bay states.
  - A separate **TABLE ROSTER** window (it stays inside the console in M1).
  - Status marks (`●`/`▲`/`✕`) from `shStatus()`/`igOf()` on titles and bay slots, plus crit lighting of minimized slots.
  - The `Alt+K`/`M`/`X`/`Enter`/`Arrow` chords with the `__deskOwned` guard, remembered focus per window, and the `layout reset` console command.
- **M3 (trimmed P2):**
  - Snapping to other windows and half-snap with the dashed preview.
  - The **ACCESS ROUTER** modal for the login / pw / researchPw / mpw screens.
  - The amber `[BENCH // LIVE TABLE PAUSED]` strip tag.
- **QA:**
  - 1366–1920px passes, all roles, a two-seat host / pilot run focused on the shell.
  - Keyboard-only and screen-reader passes.
  - Narrow-window checks for the sticky HUD and the paper doll (`container-type` is set on the main window, but the per-view minimum-size review is still to do).
