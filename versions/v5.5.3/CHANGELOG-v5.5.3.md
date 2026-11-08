# FORGE-OS 5.5.3

Visual and usability update based on 5.5.2. The existing terminal aesthetic, themes, semantic status colors and game calculations are retained.

## Encounter tracking

- Common roll and active-defense controls appear above skill-input setup, reducing scrolling during play.
- Incoming damage has an explicit TARGET selector and ACTIONS menu alongside the existing paper-doll selection, damage calculator and undo flow.
- Small ▾ buttons make equipment, maneuver, defense, Evaluate, Rapid and damage-roll alternatives reachable by ordinary click or touch. Existing context-menu and keyboard access still work.
- The active sheet has a visible SHEET ACTIONS menu. A name/owner filter appears when an encounter contains more than three sheets.
- Shared-table ownership and read-only protections remain enforced by the existing handlers.

## Builder, navigation and presentation

- Clearer panel surfaces, section hierarchy, selected rows and tabs, and focus outlines preserve the square-edged research-terminal style.
- Scanlines are subtler. DISPLAY adds remembered Compact/Roomy spacing and Terminal/Reduced effects options; system reduced-motion preferences remain respected.
- Builder and access-router choices support Tab, Enter and Space. The version link is keyboard accessible, and focus is preserved through relevant redraws.
- HELP explains the current task, including the distinction between `/` commands and ordinary chat.
- The centered two-column desktop layout is capped at 1440px. Narrow headers wrap, pilot fields fit their panel, and small screens can switch between Workspace, Loadout and Console.
- On phone widths, component labels become readable target tiles under the interactive paper doll.
- The release and exported manifest version are 5.5.3.

## Packaging and compatibility

- `terminal-ui.css` and `terminal-ui.js` remain editable sources and are embedded into the release `terminal.html`, preserving the UI in standalone catalogue HTML exports. Regenerate them with `devtools/embed-v553-ui.cjs` after editing.
- The patch overlay carries the existing hook, 5.5.2 multiplayer bridge, server and `0003_forge_member_colors.sql` migration for installation onto the full base project.
- Host overlay files update package metadata and the iframe cache key to 5.5.3, and carry the repaired dependency lockfile.
- No new combat rules, sheet schema or database migration is introduced by this UI pass. Existing manifest import/export and persistent seat-color behavior continue.
- A complete runnable archive accompanies the repository patch, with a repaired dependency lockfile for reproducible installation. See [installation and controls](README.md).

## Verification record

Recorded checks at this revision (Chromium; disposable local sessions):

- **Gameplay and UI:** 25 focused browser regression checks passed, covering attack/damage readiness, ammunition, forced damage, repairs/undo, targeting, maneuvers, retreat, caret preservation, menus and keyboard access.
- **End-to-end workflows:** 19 additional browser checks passed for keyboard frame assembly, equipment installation, designation/export, reopening an exported HTML package, sheet filtering, and pane navigation at 390px and 320px.
- **Multiplayer:** a real-server, two-client test confirmed a pilot skill edit reached the host; viewing another unit stayed read-only with editing menus and skill fields unavailable. Mobile pane switching also passed in that context.
- **Host application:** production build and TypeScript checking passed; the separate TypeScript test run passed **59 tests**.
- **Inherited template suite:** **17 failures** were reproduced unchanged against the pristine base project. The overall inherited template suite is therefore not reported as passing.

These results describe the exercised paths, rather than a complete campaign playtest. The bridge and server behavior are carried forward from 5.5.2; the UI tests exercise their integration with the revised controls.
