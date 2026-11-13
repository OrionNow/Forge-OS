# FORGE-OS 5.5.5-D1 (desktop UI)

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying** (unchanged from 5.5.5).

5.5.5 with a desktop-style interface, built from the Overseer's D1 spec. It folds in the 5.5.1-D2 desktop work and fixes D2's single-active-sheet problem. Every 5.5.5 rule, security and colour behaviour is kept. Nothing functional was removed. The engine version stays `5.5.5`, so manifests and saves are unchanged; the build label shows `5.5.5-D1`.

## Desktop

- **Windows for every function.** Close, minimise, maximise, drag (title bar) and resize (8 handles). Optional 8 px snap. Windows and taskbar tabs are listed on a thin taskbar: 起動 LAUNCH, one tab per window (active one outlined), status readout and clock, console tray button at the far right.
- **Icons.** Kanji with English captions down the left (戦 ENCOUNTER, 機 UNITS, 装 LOADOUT, 造 ASSEMBLY, 整 SERVICE, 典 CATALOGUE, 監 OVERSEER, 設 SETTINGS). 録 CHANGELOG is at the top right. No console icon.
- **Lock screen on every connect.** Full-screen login on page load and after every logout, solo and live table. It has the welcome crest and crawl, the six clearances, callsign entry and a saved-callsign tile. Rename and saved-name auto-connect are kept.

## Units

- **One UNIT window per unit, all live at once.** Each window opens combined: paper doll and telemetry, impact resolution, skill inputs, rolls and heat, character sheet, loadout. There is no single active sheet, mirror or MAKE LIVE step. Clicking or typing in any unit window acts on that unit directly. The others keep rendering from their own data (live health).
- **Sections.** Each section collapses in place or pops out into its own window. Popped sections stay live and dock back with ⇲.
- **Permissions (live table).** Rolling and editing stay with the host and the unit's assigned pilot, enforced by the 5.5.5 bridge guards ("ASSIGNED PILOT OR HOST ONLY"). Everyone else gets view-only live health: no skills, rolls or loadout roll buttons.
- **UNIT GROUP windows.** Choose a tab colour to get mini paper-doll cards with name and condition. A card opens that unit's window and leaves the group window as it is. Several group windows can be open at once.
- **Auto-open.** Solo opens up to three unit windows. On the live table it opens your own units plus up to two more. Open the rest from the ENCOUNTER tabs or a group card.

## Console, settings, keys

- **GLOBAL CONSOLE.** Tray-style flyout from the ▤ taskbar button, resizable from its top-left corner. Only the button closes it: outside clicks, Escape and typing leave it open. The button lights up on new output while closed. Commands act on the last unit touched.
- **SETTINGS (設).** Theme (all five themes restyle the desktop; IMPERIAL NAVY is teal, REMUS ACCORD is amber), audio, UI scale (80–150%), five saved layout slots (open windows, positions, collapsed and popped sections, unit groups), snap, reset layout, and classic layout.
- **OVERSEER and CATALOGUE EDITOR.** Still need their keys. The key prompt opens inside a themed window, and switching clearance from an encounter asks first.

## Fallback

- `?classic`, or SETTINGS > CLASSIC LAYOUT, gives the exact 5.5.5 page, with a [DESKTOP] button to come back. Desktop only: no phone layout.

## Tests

- New `devtools/check-v555-d1.js`. It covers the lock screen, window chrome, all units live, sections, group windows, the console tray, settings themes and slots, the key-gated editors, and live-table roll permissions across two seats.
- The existing 5.5.5 suites run against this build in classic layout.

## Known limits

- An open native select in a unit window that is not yet the one you are using may close on the first click. The second click works.
- Very narrow unit windows wrap the paper-doll labels. Widen the window or pop out the doll.
