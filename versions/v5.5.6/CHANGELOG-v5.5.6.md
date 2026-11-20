# FORGE-OS 5.5.6

> **DEPLOY FIRST (unchanged from 5.5.5): apply `migrations/0003_forge_member_colors.sql` before deploying this build.** No new migration.

5.5.5 plus the **LOADOUT TERMINAL** catalogue, the redesign the Overseer approved for the equipment catalogue in mech assembly (GUEST / MECHANIC / OVERSEER frame builder). The old view was one long list per tab. UI only: no catalogue data, rules, multiplayer or server changes. Everything else is the same as 5.5.5. Desktop only.

## Catalogue (LOADOUT TERMINAL)

| Part | What it does |
|---|---|
| **Category tabs** | One tab for each equipment category that exists in the catalogue data: `(A)RMAMENT`, `(D)EFENSIVE SYSTEMS`, `(U)TILITY`. The tab list is built from the data, so a category with no records gets no tab, and no categories are invented. Chassis, reactor, thruster and targeting systems are still chosen in the frame configurator, as before. The `(ID) DESIGNATION`, `(C)HANGE CHASSIS` and `(S)AVE` buttons are unchanged. |
| **Filter chips** | A chip row under the search box: `ALL n`, then one chip for each subtype in the tab, from each record's existing subtype field. For example ARMAMENT has BALLISTIC, ROCKET/MISSILE, MELEE, ELECTROMAGNETIC and BEAM; DEFENSIVE has SHIELD, ARMOR, ECM and STRUCTURE; UTILITY has MOBILITY, TARGETING, EW and SUPPORT. Each chip shows its count, and the active chip is highlighted. Each tab remembers its own chip. |
| **Search across all tabs** | Typing in `> SEARCH_` (placeholder `name, class, stat, tag  (/)`, short enough not to clip at 1280 px; `/` focuses it, Escape clears it) searches every category, whichever tab is open. It matches the name, category, class, subtype, model, stats, role and tags. Results are grouped under category headers with counts (`-- ARMAMENT (5)`), and each card shows a `[CATEGORY]` label, so a record in another tab is never hidden. The counter reads `N MATCHES // ALL CATEGORIES`. Clearing the search returns to the tab and chip you had. |
| **Grid cards** | Compact cards in a responsive grid, with the number, name, EP, subtype, `[EXP]`/`[2H]`/`[SHLD]` tags and two key stats from the existing statline. The stats are picked in this order: DMG, RNG, ROF, DR, HP, MOVE, EFFECT, DEF, ACC, then the first non-NOTE stat. The numbers follow the same order as before, so typing a number in the console still adds the same record. |
| **Detail pane** | Clicking a card selects it and opens its full record in a right-hand pane: name, EP, TL and tags, class, all performance data, tiers for tiered items, mass, the ammo/power line, role, hands, tech level, engineering notes, and the EP ledger (NOW / AFTER ADD), with the existing over-limit and non-stackable warnings. The pane is sticky and scrolls on its own. If the selected card is hidden by a chip, a search or a tab change, the pane goes back to its SELECT A CARD state and ADD disappears, so a record you can't see can't be added. Click the card again once it is visible. |
| **ADD** | `[+] ADD TO MECH` in the pane calls the existing `addMech()` → `inst()` path, so behaviour is unchanged. EP budget, non-stackable refusal, armament stacking, utility hardpoints, plating reset, log lines and multiplayer sync all work as in 5.5.5. Tiered items still open the existing tier menu first (`// SELECT TIER`). Enter or double-click on a card also adds it, as a click on a row did before. |

The cards and chips use only the existing theme variables (`--line`, `--cyan`, `--hover`, `--label`), so every colour theme applies. The `[INFO]` row button and the full-screen dossier are no longer reached from the catalogue grid, because the detail pane replaces them. The dossier still opens from the loadout manifest.

### Pass 3 (Overseer: denser tiles, larger preview)

- **Tiles:** every tile is the same size: 54 px tall, 165×54 at 1280 and 190×54 at 1920. They sit in a strict `auto-fill/minmax(150px)` grid. Each tile has its number and name on one line (long names end in an ellipsis; the full name is in the tooltip), an EP badge in the top-right corner, the subtype and tags, and the two key stats on one row. Padding is tighter, and hover and selected states are clearer. A thin left stripe marks the category using theme colours: ARMAMENT `--c-dmg`, DEFENSIVE `--cyan`, UTILITY `--c-good`.
- **Detail pane:** 42% of the catalogue width (248 px at 1280, 284 px at 1920) and larger type. The header is pinned at the top of the pane and holds the name, EP/TL, a full-width **[+] ADD TO MECH** button and the EP ledger. All stats, the tiers and the field record are shown as label/value pairs. The pane still clears when its card is hidden.
- `check-v556-catalogue.js`: 43/43. New checks: uniform tile size, one-line names, pane width ≥ 38% of the catalogue, and ADD visible, all at 1280 and at 1920.

### Pass 4 (Misaki's fixes)

- While the Loadout Builder is open (`body.lt-open`), the builder takes 62% and FRAME LOADOUT 38%. In three-column windows the console keeps at least 300 px. The normal split comes back when the builder closes.
- Tiles are a fixed 66 px tall. Names wrap onto 2 lines with no ellipsis, and the stat row uses smaller type and wraps inside the tile, so nothing is clipped. There are 2 columns below 1600 px and 3 from 1600 px up.
- The detail pane is at least 340 px wide (`minmax(340px,44%)`).
- `check-v556-catalogue.js`: 52/52. New checks, at 1280 and 1920: tile heights match, full VIBROBLADE names, no stat-row clipping, column count, pane width, the 62/38 split, FRAME LOADOUT headers and counters unclipped, and the split restored on exit.

## Version and cache keys

- `APP_VERSION` is 5.5.6. The `<title>`, in-app changelog and `host/package.json` (+ lock) versions are 5.5.6.
- All changes are inline in `terminal.html`. `mp-bridge.js?v=25`, `forge-hook.js?v=8`, `terminal-ui.css` and `terminal-ui.js` are byte-identical to 5.5.5, so no cache key changed.

## Tests (each on a freshly started dev server, `devtools/runall556.sh`)

| Suite | Result |
|---|---|
| **New:** LOADOUT TERMINAL catalogue (`check-v556-catalogue.js`: tabs = data categories, chips = real subtypes and filter correctly, cross-tab search with category headers and labels, detail pane shows the selection, ADD goes through `inst()` once, Enter/double-click add, non-stackable refusal, tier menu, numbering order, the pane clearing when a chip, a non-matching search or a tab change hides the selection, with ADD removed, and no page errors) | 52/52 |
| Page load (`check-v556-pageload.js`) | 4/4 |
| Fix checks (`check-v556-fixes.js`) | 12/12 |
| Solo (`check-v556-solo.js`) | 119/119 |
| BRITTLE (`check-brittle.js`) | 13/13 |
| Two-seat / sync (`check-v556-2seat.js`, `check-v556-sync.js`) | 59/59, 11/11 |
| Misaki MP / three-seat spoof | 8/8, 12/12 |
| API: base / v52 / v53 / v55 | 18/18, 9/11 (the same 2 intended 5.5.3 rename/auto-connect results as 5.5.4 and 5.5.5), 10/10, 7/7 |
| Branch UI (`check-v556-ui.cjs`) / workflows (`check-v556-workflows.cjs`) | 25/25 on rerun (the known "DMG rolls the recorded hit" timing flake also fails about half the time on unmodified 5.5.5), 9/9 |
| Layout (`check-v556-layout.js`, 9 window sizes) | 336/336 |
| Tab / owner colours (`check-v556-tabs.js`) | 63/63 |
| Close-ups (`check-v556-closeup.js`) | 52/52 |

Test adaptations (intended changes only):
- The `check-v556-*` suites are copies of `check-v555-*` with the version changed to 5.5.6. Nothing else changed. The unmodified `check-v555-workflows.cjs` passes its catalogue search and keyboard-install checks on 5.5.6, and stops only at the 5.5.5 version pin.
- `check-v556-catalogue.js` is new.

Screenshots: `feedback/v556/shots/` (MELEE chip, search across all categories, detail pane).
