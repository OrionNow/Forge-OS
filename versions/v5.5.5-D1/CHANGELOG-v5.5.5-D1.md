# FORGE-OS 5.5.5-D1 (desktop UI)

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying** (unchanged from 5.5.5).

5.5.5 with a desktop-style interface, built from the Overseer's D1 spec. It folds in the 5.5.1-D2 desktop work and fixes D2's single-active-sheet problem. Every 5.5.5 rule, security and colour behaviour is kept. Nothing functional was removed. The engine version stays `5.5.5`, so manifests and saves are unchanged; the build label shows `5.5.5-D1`.

## Desktop

- **Windows for every function.** Close, minimise, maximise, drag (title bar) and resize (8 handles). Optional 8 px snap. Windows and taskbar tabs are listed on a thin taskbar: 起動 LAUNCH, one tab per window (active one outlined), status readout and clock, console tray button at the far right.
- **Icons.** Kanji with English captions down the left (戦 ENCOUNTER, 機 UNITS, 装 LOADOUT, 造 ASSEMBLY, 整 SERVICE, 典 CATALOGUE, 監 OVERSEER, 設 SETTINGS). 録 CHANGELOG is at the top right. No console icon.
- **Login screen on every connect.** Full-screen login on page load and after every logout. One form: callsign, colour, LOGIN (live table) or WORK OFFLINE (solo). It pre-fills the last used callsign and colour, and has a DESKTOP / CLASSIC layout toggle. There are no clearance rows: login goes straight to the desktop, and every function is reachable from there.
- **Workstation windows (no swapping).** 造 ASSEMBLY, 整 SERVICE, 典 CATALOGUE and 監 OVERSEER each open in their own window with an independent local session. CATALOGUE and OVERSEER still need their keys inside the window. The encounter, your units and your live-table seat are never switched out. Workstation windows close on logout.
- **Icons sit under windows.** Windows can be dragged over the icon column.

## Units

- **Tabbed UNIT windows, all units live.** Units are tabs in unit windows. The first time a unit opens, it goes into the window for its tab colour; that window is created if needed, and units with no colour share a grey window. Changing a unit's colour later does not move it. Drag a tab onto another unit window to move it there. Drop it on the desktop to tear it off into a window of its own. × on a tab closes it, and the last tab closes the window. Each tab is the combined unit view: paper doll and telemetry, impact resolution, skill inputs, rolls and heat, character sheet, loadout. The active tab is the acting unit. Background tabs keep rendering from their own data, so health stays live, and permissions are unchanged.
- **Narrow paper doll.** When the doll section is under 560 px wide, the doll sits on top and the 8 parts sit under it in two even columns (4 + 4). A unit window at about 600 x 500 keeps the wide doll, with labels on both sides.
- **Sections.** Each section collapses in place or pops out into its own window. Popped sections stay live and dock back with ⇲.
- **Permissions (live table).** Rolling and editing stay with the host and the unit's assigned pilot, enforced by the 5.5.5 bridge guards ("ASSIGNED PILOT OR HOST ONLY"). Everyone else gets view-only live health: no skills, rolls or loadout roll buttons.
- **UNIT GROUP windows.** Choose a tab colour to get mini paper-doll cards with name and condition. The cards keep the tab colour but drop the selected-part highlight. The TAB COLOUR selector collapses to the current colour. Clicking a card selects it, and that unit's paper doll and impact resolution open in the group's SELECTED UNIT area: live, with the same roll and edit permissions as anywhere else. [OPEN ↗] or a double-click on a card focuses the unit's tab in its window. A new window opened this way is about 600 x 500. Several group windows can be open at once.
- **Auto-open.** Solo opens up to six units as tabs. On the live table it opens your own units plus up to two more. Open the rest from the ENCOUNTER tabs or a group card. The ENCOUNTER window has no sheet search bar.

## Console, settings, keys

- **GLOBAL CONSOLE.** A normal window that you can move and resize. It opens at the bottom right from the ▤ taskbar button, which toggles it. × and _ hide it. Outside clicks, Escape and typing leave it open. The button lights up on new output while hidden. When the window is taller than it is wide, the user list moves to a strip across the top. Commands act on the last unit touched.
- **SETTINGS (設).** Theme (all five themes restyle the desktop; IMPERIAL NAVY is teal, REMUS ACCORD is amber, and every accent follows the theme), audio, UI scale (80–150%), five saved layout slots (open windows, positions, collapsed and popped sections, unit groups), snap, reset layout, and classic layout.
- **OVERSEER and CATALOGUE EDITOR.** Still need their keys, entered inside their own workstation windows.

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
- The existing 5.5.5 suites run against this build in classic layout.

## Known limits

- An open native select in a unit window that is not yet the one you are using may close on the first click. The second click works.
