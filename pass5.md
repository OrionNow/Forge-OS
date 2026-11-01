# FORGE-OS: UI/UX Pass 5: readability, structure, and catalog-team data
Desktop only. Everything here refines something that already exists, except the RADS line, which the catalog team asked for.

## 5.1 Typography with symbol fallbacks
- **Font.** JetBrains Mono is bundled (`out/fonts/*.woff2`, OFL), with the stack `"JetBrains Mono",Consolas,"DejaVu Sans Mono","Courier New",monospace`.
- **Glyphs.** A fontTools check shows JetBrains Mono has `▲ ▼ ■ □ ● ○ ✕ × · → ⚠` but not `✖ ✎ ↶ ↺ ◐`. All new cues therefore use only `✕ ▲ ● ○` plus ASCII brackets.
- **Sizes.** Size tokens are `--fs-b 14px`, `--fs-l 12.5`, `--fs-d 11.5` and `--fs-e 15`. The live-table panel inherits the terminal font (it was `12px Consolas` in `ensureChrome()`).

## 5.2 Section headers are real controls, with collapsed-state badges
- **Keyboard.** `shHead()` titles become `.shtl` buttons (`role=button`, `tabindex=0`, `aria-expanded`). Enter and Space toggle them, and focus survives the re-render.
- **Badges.** `shBadge(k)` shows `✕n CRIT` and `▲n DMG` on the CHASSIS header, `✕n OFFLINE` on equipment sections, and `[BRITTLE SR-1]` on the frame. That way a collapsed section still shows the problem.
- **Paper doll.** `.mlab` locations get `role=button` and `aria-pressed`. Enter and Space select a location, and the arrow keys move between locations.

## 5.3 Segmented gauges and a primary-panel frame
- **Gauges.** `.hpbar`, `.gauge` and `.igbar` get a 10-segment overlay. The exact numbers (`.hv`, `EP u/cap`) stay.
- **EP bar.** `bar()` uses `--c-gold/--c-crit/--c-dmg` and adds `▲ HIGH` / `✕ OVER` text.
- **Panel frame.** Heavy corner brackets appear only on the panel that's primary for the current view (`#sh` in sortie/intel, `#con` elsewhere). The other panels drop their background gradient.

## 5.4 BRITTLE (MUSHA): parse correctly, show a tag, apply -1 SR below half HP
- **Parser bugs fixed.** These were found with Misaki's fixture, `tests/musha-brittle.manifest.txt`.
  - `toStatline()` dropped the token. It now appends `BRITTLE:<value>`, so the CH line is `ST/HP165 DR650/325 MOVE10L/20S SM+6 HND/SR+2/2 BRITTLE:-1_SR_below_half_HP`.
  - A colon-form frame line in a manifest (`ST/HP:165 DR:650/325 … SR:2`) broke `chStats()`. `parseManifest()` now normalises it through `toStatline()`.
  - `NOTE:` tokens no longer count as a stats difference. The fixture now reads `frameStatus: match`, which was `alternate` before.
- **Never read as SR.** The only SR readers are `/HND\/SR([+-]?\d+)\/(\d+)/` and `/(?:^| )SR:([+-]?\d+)/`. A naive `/SR[:=]?(-?\d+)/` doesn't match the token either.
- **Effect.**
  - `brittleVal()` reads `S.ch[1]` or the DB line, and `brittleOn()` checks Core HP (Chassis HP for vehicles) below half, in sortie only.
  - `effBase()` and `effStat()` add `SR:-1` while it's active. `baseHP()` uses the unmodified line.
  - The HUD shows `[BRITTLE SR-1 BELOW 1/2 HP]`, which turns amber as `[BRITTLE SR-1 ACTIVE]`.
- **Regression check.** `devtools/check-brittle.js` runs 13 checks, and all pass.

## 5.5 Pilot RADS (GURPS B435), kept simple
- **Storage.** One number, `S.pilot.rad`, added to the `cleanPilot()` whitelist. It is saved in the flight recorder and synced as normal pilot state.
- **Display.** It appears at the top of `pilotView()` as `RADS n [BAND]`. The bands are LOW <100, `▲` ELEVATED 100+, `▲` HIGH 200+, and `✕` SEVERE 400+. These cutoffs are table defaults, and the GM rules the effects.
- **Buttons.**
  - `[-5]` and `[+5]` adjust the dose.
  - `[+RAD/SORTIE]` appears only when `S.core.R.s` has `RAD:n/sortie`.
  - `[+PURGE 50]` appears only when an item has `RAD:+n_pilot`.
  - Shrine-Grade Shielding (`divide_Oleum_Vis_rads_by_5`) divides both one-click doses.
- **Log.** Every change logs `[ -- ] RADS +n :: reason (SHRINE SHIELDING /5) :: PILOT TOTAL n // BAND`.
- **Manual parts.** There is no accrual engine. The +10/+25 heat-zone doses and the 10 rads to pilots within 50m are entered by hand with +/-.
