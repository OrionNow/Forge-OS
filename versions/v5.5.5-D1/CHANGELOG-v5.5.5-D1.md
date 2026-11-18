# FORGE-OS 5.5.5-D1 (desktop UI)

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying** (unchanged from 5.5.5).

5.5.5 with a desktop-style interface, built from the Overseer's D1 spec. It folds in the 5.5.1-D2 desktop work and fixes D2's single-active-sheet problem. Every 5.5.5 rule, security and colour behaviour is kept. Nothing functional was removed. The engine version stays `5.5.5`, so manifests and saves are unchanged; the build label shows `5.5.5-D1`.

## Desktop

- **Windows for every function.** Close, minimise, maximise, drag (title bar) and resize (8 handles). Optional 8 px snap. Windows and taskbar tabs are listed on a thin taskbar: 起動 LAUNCH, one tab per window (active one outlined), status readout and clock, console tray button at the far right.
- **Icons.** Kanji with English captions: 戦 ENCOUNTER, 機 UNITS, 造 ASSEMBLY and 整 SERVICE down the left; 設 SETTINGS, 監 OVERSEER, 典 CATALOGUE and 録 CHANGELOG down the top right (round 3). No console icon.
- **Login screen on every connect.** Full-screen login on page load and after every logout. One form: callsign, colour, LOGIN (live table) or WORK OFFLINE (solo). It pre-fills the last used callsign and colour, and has a DESKTOP / CLASSIC layout toggle. There are no clearance rows: login goes straight to the desktop, and every function is reachable from there.
- **Workstation windows (no swapping).** 造 ASSEMBLY, 整 SERVICE, 典 CATALOGUE and 監 OVERSEER each open in their own window with an independent local session. CATALOGUE and OVERSEER still need their keys inside the window. The encounter, your units and your live-table seat are never switched out. Workstation windows close on logout.
- **Icons sit under windows.** Windows can be dragged over the icon column.

## Units

- **Tabbed UNIT windows, all units live.** Units are tabs in unit windows. The first time a unit opens, it goes into the window for its tab colour; that window is created if needed, and units with no colour share a grey window. Changing a unit's colour later does not move it. Drag a tab onto another unit window to move it there. Drop it on the desktop to tear it off into a window of its own. × on a tab closes it, and the last tab closes the window. Each tab is the combined unit view: paper doll and telemetry, impact resolution, rolls // skills // heat (skill inputs collapsed inside it), character sheet, loadout. The active tab is the acting unit. Background tabs keep rendering from their own data, so health stays live, and permissions are unchanged.
- **Narrow paper doll.** When the doll section is under 560 px wide, the doll sits on top and the 8 parts sit under it in two even columns (4 + 4). A unit window at the SMALL preset (620 wide) keeps the wide doll, with labels on both sides.
- **Sections.** Each section collapses in place or pops out into its own window. Popped sections stay live and dock back with ⇲.
- **Permissions (live table).** Rolling and editing stay with the host and the unit's assigned pilot, enforced by the 5.5.5 bridge guards ("ASSIGNED PILOT OR HOST ONLY"). Everyone else gets view-only live health: no skills, rolls or loadout roll buttons.
- **UNIT GROUP windows.** Choose a tab colour to get mini paper-doll cards with name and condition. The cards keep the tab colour but drop the selected-part highlight. The TAB COLOUR selector collapses to the current colour. Clicking a card selects it, and that unit's paper doll and impact resolution open in the group's SELECTED UNIT area: live, with the same roll and edit permissions as anywhere else. [OPEN ↗] or a double-click on a card focuses the unit's tab in its window. A new window opened this way is the SMALL preset (620 wide). Several group windows can be open at once.
- **Auto-open.** Solo opens up to six units as tabs. On the live table it opens your own units plus up to two more. Open the rest from the ENCOUNTER tabs or a group card. The ENCOUNTER window has no sheet search bar.

## Console, settings, keys

- **GLOBAL CONSOLE.** A normal window that you can move and resize. It opens at the bottom right from the ▤ taskbar button, which toggles it. × and _ hide it. Outside clicks, Escape and typing leave it open. The button lights up on new output while hidden. When the window is taller than it is wide, the user list moves to a strip across the top. Commands act on the last unit touched.
- **SETTINGS (設).** Theme (all five themes restyle the desktop; IMPERIAL NAVY is teal, REMUS ACCORD is amber, and every accent follows the theme), audio, UI scale (80–150%), five saved layout slots (open windows, positions, collapsed and popped sections, unit groups), snap, reset layout, and classic layout.
- **OVERSEER and CATALOGUE EDITOR.** Still need their keys, entered inside their own workstation windows.

## Clarity fixes (review pass)

- **Acting unit.** The unit that console commands and engine actions use (the last one touched) has a filled tab with a ▶ prefix, in whichever window it is in. The status bar shows ACTING: <unit>. Each window's active tab is still outlined.
- **Console tray button.** If the console is open but covered, the button brings it to the front. It only closes the console when the console is already on top.
- **Cascade.** New unit windows step down 56 px, so the window behind keeps its title bar and tab strip visible.
- **Back from the group.** A unit tab whose sections are shown in a group window has a ◀ IN UNIT GROUP // <COLOUR> — click to bring back button (highlight border) in their place. It does the same as [OPEN ↗].
- **Larger chrome text.** Title bars are 22 px and 11 px. Titles, status badges, swatches, card condition lines and the taskbar are 12 px. Section bars and icon captions are 11 px. Card condition lines wrap inside their cards.
- **Off-screen clamp.** At least 160 x 40 px of a window always stays on the desktop.
- **Tear-off marker.** Dragging a unit tab over the empty desktop shows a dashed DROP: NEW WINDOW outline (DROP: MOVE WINDOW HERE for a window's only tab). It clears on drop or when the drag ends.

## Fallback

- `?classic`, the login screen's CLASSIC toggle, or SETTINGS > CLASSIC LAYOUT gives the exact 5.5.5 page, with a [DESKTOP] button to come back. Desktop only: no phone layout.

## Tests

- New `devtools/check-v555-d1.js`. It covers:
  - the login form and its pre-fill, and the classic toggle there and back
  - icons under windows, and window chrome
  - tabbed unit windows: colour routing on first open, no move on a colour change, tab drag and tear-off, live background tabs
  - the 4 + 4 narrow doll, and sections
  - group windows: the collapsible selector, mini dolls (no highlight, tab colour kept), the SELECTED UNIT area, [OPEN ↗] and double-click, the ref2 size
  - the console window, including the tall user strip
  - settings, slots and REMUS accents
  - workstation windows and their keys
  - live-table permissions across tabs and the group area
  - the clarity fixes: acting tab and status, tray front-or-close, cascade step, the back-from-group button, off-screen clamp, tear-off marker, and chrome text overflow
- The existing 5.5.5 suites run against this build in classic layout.

## Round 3 (Overseer feedback, round3/NOTES.md)

1. **Shield tile.** The shield tile now rides up onto the paper doll, in its empty bottom-left corner. A sheet with a shield is no taller than one without, with the wide doll and with the 4 + 4 narrow doll.
2. **Unit group window.** The mini-doll tiles form a vertical sidebar on the right, and the selected unit's doll and impact resolution sit beside them. The default group window is wider (840 px).
3. **Starting height.** A unit window opened from a group starts taller (the SMALL preset, 600 wide), so IMPACT RESOLUTION is fully visible when it opens. A new tabbed unit window opens at the LARGE preset, keeping its cascade step.
4. **LOADOUT** is gone from the desktop icons and the launch menu. The loadout section inside unit windows is unchanged.
5. **Skill inputs** are now part of the ROLLS // SKILLS // HEAT section, not a section of their own. They start collapsed in play; opening them is remembered.
6. **Size preset button.** On a unit window's title bar, the ▣ LG / ▭ SM button left of the status badge (NOMINAL and so on) cycles the preset sizes:
   - LARGE: the full sheet, sized so the left panel is exactly the window height with skill inputs collapsed
   - SMALL: doll-focused, 600 wide, down to IMPACT RESOLUTION
   On a screen too short for the whole left panel, LARGE uses the full desktop height.
7. **Encounter tile right-click.** The menu now starts with "Open sheet window (LARGE)" (renamed in the review fixes), which opens or focuses the unit's tab at the LARGE preset.
8. **OVERSEER and CATALOGUE** moved from the launch menu to the top-right icon column, under SETTINGS: 設 SETTINGS, 監 OVERSEER, 典 CATALOGUE, 録 CHANGELOG. Both still need their keys.
9. **ASSEMBLY.** The failure could not be reproduced here, in solo, on the live table, or across theme, scale, logout and reopen. The likeliest causes were fixed:
   - Stale cached scripts: the `desk.js` and `mp-bridge.js` cache keys were never bumped across rounds, so a browser could pair a new desktop with an old bridge. Both are bumped now.
   - Silent failures: a workstation's own console is hidden, so its messages and errors were invisible. Every workstation window (ASSEMBLY, SERVICE, CATALOGUE, OVERSEER) now has a status strip under it. The strip shows the workstation's last message; a script error or failed sign-in shows as WORKSTATION FAULT; a workstation that never starts shows DID NOT START.
   - RELOAD on the strip restarts the workstation with a fresh local session (one click on a fault; confirm twice when healthy).
   If it still breaks, the strip's text is the detail needed to fix it.
10. **Pilot name.** Unit windows show the pilot or owner next to the mech name, on the tab and in the title bar:
    - a seated client: their member colour
    - a pilot the host typed in: the tab colour
    - Open, Closed, Unknown, or LOCAL in solo: grey

UI SCALE is unchanged. Tests: the D1 suite adds checks for all ten items; the earlier skill-input and ref2-size checks were updated for items 3, 5 and 6.

## Round 3 review fixes (Misaki)

1. **Readable pilot name.** On a focused title bar and on the acting tab, the pilot name now sits on the page background with a little padding, and its `//` takes the name's colour. Before, grey `// LOCAL` on amber was 1.3:1 on REMUS ACCORD.
2. **IMPACT RESOLUTION on smaller screens.** A window that opens automatically uses the SMALL preset when LARGE would push IMPACT RESOLUTION off-screen (for example 1366 x 768 with a shield). LARGE is also 4 px taller, so the [APPLY] row is never cut off.
3. **Workstation RELOAD.** The strip shows a one-click RELOAD only on a fault or DID NOT START. On a healthy workstation it is a small ↻: the first click asks "RELOAD? UNSAVED WORK IS LOST", and it reloads only if clicked again within 3 seconds.
4. **Size button** reads ▣ LG / ▭ SM. The tooltip is unchanged.
5. **Pilot name** is 11 px, and the unit tab's tooltip adds `// PILOT: <name>`.
6. **11 px minimum** for the remaining small chrome text:
   - group colour picker and its buttons
   - the current-colour label
   - SELECTED UNIT buttons
   - the workstation strip button
   - settings legends and notes
   - login labels and layout buttons

   The encounter tile menu item is now **Open sheet window (LARGE)**.


## Round 4 (Overseer feedback, Nov 18)

1. **Side-by-side doll at the default sizes.** LARGE is 1120 wide (was 1000) so the left column is just wide enough for the paper doll's part labels to sit on both sides of the doll, not stacked 4 + 4 underneath. A unit window opened from a group, and the SMALL preset, are 620 wide (was 600) so the same layout holds even when a classic scrollbar takes a little width. Auto-open still falls back to SMALL when LARGE would hide IMPACT RESOLUTION (for example at 1366 x 768).
2. **Group colour dropdown.** The group window's tab-colour control is a dropdown in the title bar: a small swatch, the colour name, and ▾, styled like the other title-bar buttons, at 12 px. Click it (including the first click when the window is in the background) to open a list of colours, NONE included. A pick, an outside click, or Escape closes it, and the list is keyboard-friendly (arrows, Home, End, Enter, Esc). The mini-doll cards start at the top of the right-hand sidebar. (This replaces the earlier sidebar ▾ TAB COLOUR picker.)
3. **Pilot name on group cards.** Each mini paper-doll card shows the pilot name after the mech name, in the same colour rules as the unit window (11 px, tooltip `// PILOT: <name>`). It is omitted when there is no pilot, and a long name ellipsizes so it stays inside the card.

### Review polish (Misaki)

1. **▣ LG no longer covers ENCOUNTER.** The size button uses the same ENCOUNTER floor as a new window, and only lifts as far as needed to keep IMPACT RESOLUTION in view. Auto-open still falls back to SMALL when LARGE would hide it.
2. **Solo cards omit LOCAL.** Mini-doll cards show a pilot only when it is a real name, not the grey LOCAL / Open / Closed label (that still appears on the unit window's title bar and tab).
3. **Even mini-doll cards.** Cards in the group sidebar all have the same width and left edge.
4. **Card status.** STATUS and INTEGRITY sit on two lines, so `//` is not left wrapping on its own.
5. **Colour dropdown, not a sidebar picker.** The Overseer moved the selector into the title-bar dropdown (see Round 4 item 2), so the mini dolls start at the top of the sidebar and the third card stays in view at 1366. Shot: `r4-07-group-colour-dropdown.png`.
6. **Open from group.** A new unit window opened from a group starts just below ENCOUNTER, not over it at y=40.
7. **Tab pilot name** can be up to 140 px (was 110) before it ellipsizes.

## Pass 1 (Overseer improvement series, Nov 18)

1. **STABILITY strip.** After APPLY, when a STABILITY CHECK first appears, the desktop scrolls it into view (`scrollIntoView`, `block: "nearest"`).
2. **Card INTEGRITY.** The integrity line on a group mini-doll card no longer has a leading `//`.
3. **Taskbar colour.** Each open window (except the console, which keeps the ▤ tray button) has a taskbar tab whose title is in that window's tab colour. Clicking a tab focuses the window, or minimises it if it is already focused. Minimised windows restore from the tab. The title-bar `_` button was already there.
4. **Edge snap and TILE UNITS.** Dragging a window near a screen edge or another window's edge snaps it within 8 px (the 8 px grid snap in Settings is unchanged). 起動 LAUNCH → TILE UNITS lays open unit windows out in a grid below ENCOUNTER, with no overlap.
5. **Keyboard and SHORTCUTS.** Ctrl+1…9 sets the acting unit in tab order. Esc closes menus (and the SHORTCUTS window if it is focused). `?` or the taskbar `?` button opens a SHORTCUTS window listing keys and mouse gestures (tab drag, tear-off, double-click, right-click, and the rest).
6. **Per-callsign layout.** Window positions, sizes and minimised state are saved in localStorage for the current callsign and restored on login. SETTINGS already had RESET LAYOUT; it now also clears that callsign's saved layout.

Live-table fixes from the 8fc06ae audit (host + pilot):

7. **autoOpen.** Own units, the host's unowned sheets, and the acting unit always get a window. The open cap applies only to the rest. A sheet is marked seen only when it actually opens, so a later pass can still pick up a missed acting unit.
8. **Console roll lines.** In the 480 px-wide (side-list) console, `#log`, `#pr` and `#hint` keep a 112 px right margin so the user list no longer covers the roll text. The tall top-strip layout is unchanged.
9. **STABILITY button.** A newly appeared `[ROLL STABILITY]` button (or its `.stabbox`) is scrolled into view once, guarded by `dataset.seen`.
10. **LAST roll.** When the console is closed, a new roll line is shown in the status bar as `LAST: …` (90 characters, about 8 seconds) and is clickable to open the console.
11. **VIEWING.** A read-only pilot sees `VIEWING` (dimmer) in the status bar instead of `ACTING`.

## Pass 2 (Overseer improvement series, Nov 18)

1. **LAST is rolls only.** The status-bar `LAST:` line now reads only console roll cards (`[data-rcid]`). Other log lines, and anything added before desktop login completes, are ignored.
2. **Acting unit tab.** After `autoOpen()`, `renderUnits` always opens a window for the acting unit if it does not already have one, even if that sheet was previously marked seen. This covers a two-seat load within about a second.
3. **Package folder permissions.** The deployable zip now stores directories as mode 0755 (and files as 0644) so a normal user can extract it without `chmod`.
4. **Ctrl+1…9 removed.** The shortcut and its SHORTCUTS-window line are gone. The SHORTCUTS window and the taskbar `?` button stay.
5. **ACTING (MIN).** Minimising the acting unit's window no longer drops it from the unit order. The status bar shows `ACTING: X (MIN)` (or `VIEWING: X (MIN)`), and clicking that label restores the window.
6. **Narrow taskbar.** CLEARANCE is wrapped in `.dk-clr` and hidden at viewport widths of 1366 px or less. Taskbar tabs have a 120 px minimum width.

## Pass 3 (Overseer improvement series, Nov 18)

1. **LAST after the fill.** The log observer only lights the tray dot. `LAST:` is hooked after `logPost` has filled the roll card, reading the card's source text (`rcSum` / `RC`) so a live roll is not caught half-typed. It shows only when the login lock is hidden, the console is closed, and more than 2 seconds have passed since login (`loginAt` is set only when the lock hides, not on later renders). History replay (`data-replay` on catch-up lines from the bridge, and the 2-second login window) does not show `LAST:`. Clicking `LAST:` still opens the console.
2. **Taskbar unit name.** A unit window's taskbar tab is `機` plus the unit name (and `//` colour when it has one). The window title bar keeps the long `UNITS // …` form.
3. **Targeter in view.** After the targeter renders, `.tgdrop` is scrolled into view (`block: "nearest"`), the same way as the STABILITY strip.

## Pass 4 (Overseer improvement series, Nov 18)

1. **LAST on damage.** A `[DMG]` update rewrites the existing ATK card through `rcRefresh`, not `logPost`. The desk now hooks `rcRefresh` the same way as `logPost`, so `LAST:` updates from the filled card (still skipping history replay, and only when the lock is hidden, the console is closed, and more than 2 seconds have passed since login).
2. **Result first.** `LAST:` leads with the outcome (`1 HIT · +2 DoS`, then the weapon, then the caller if it is not `LOCAL`) so the result fits in the status bar. The span's `title` holds the full card text.
3. **Clear on open.** Opening the operator console repaints the status bar so `LAST:` disappears.

## Pass 5 (Overseer improvement series, Nov 18)

1. **STABILITY LAST.** A STABILITY CHECK card is long, and the DoS was last, so it was cut off. `LAST:` now leads with the DoS, then `STABILITY`, then the location (for example `LAST: +3 DoS · STABILITY · RIGHT ARM (100 > 41.5)`).
2. **Seen rolls stay gone.** Opening the console clears `lastRoll` / `lastRollFull` / `lastRollUntil` and the expiry timer, so closing the console within 8 seconds does not bring a roll that was already seen back into the status bar.

## Known limits

- An open native select in a unit window that is not yet the one you are using may close on the first click. The second click works.
- A 5.5.5 bridge/server manifest race can still drop a pilot's sheet when both seats load at the same time. That is out of scope for this desktop pass.
