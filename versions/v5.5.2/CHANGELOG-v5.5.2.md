# FORGE OS 5.5.2 (Experimental)

Upgrade notes for the 5.5.1 experimental project.

## Combat and component controls

- Right-click a paper-doll region, component label, or shield/weapon tile for context actions: **Apply entered damage**, **Repair component**, **Restore plate**, and **Repair all components**. Keyboard menu access is available with Shift+F10 or the Menu key on focused labels/regions. Mutations remain restricted for clients viewing another player's unit.
- Right-click **DMG** for **Force 1 damage roll**. Explicitly forced damage creates a separate damage result, and ignores an empty magazine while still respecting component/weapon interlocks.
- **ATK** is gold while ready. After a successful attack with pending hits, **DMG** becomes gold. Empty magazines leave a disabled red **ATK** control visible.
- **Retreat** clears automatically after a valid active-defense roll. It remains checked if no roll can occur.
- **Rapid Strike** is shortened to **Rapid**, and attack cards retain a distinct **DoS/DoF** result.
- The idle maneuver control reads **All Out / Move+Atk**. Left-click selects **Move and Attack** by default; it is the first choice in the right-click menu.

## Targeter and skills

- Head/Targeting Equipment destruction limits the **combined Targeter plus Aim/Evaluate** modifier to **+1**, including the effective attack SL and displayed targeting breakdown. Negative penalties are preserved.
- **Evaluate** provides +2 / +4 / +6 by default, with +2 preselected.
- Targeter headers are prefixed **TARGETER //** ahead of the weapon accuracy tile.
- Stability checks use the frame **Stability (SR)** modifier, not Handling (HND).
- Skill input focus and caret position are preserved across interface redraws, including synchronization-driven renders. Slowly typing two-digit pilot skill numbers no longer jumps the cursor to the beginning.

## Display, catalog and multiplayer

- Console filter defaults to **Rolls Only**, including player chat messages. The former Data Only filter was retired; toggling off shows all console lines.
- Expanded roll-card descriptions are concatenated into one wrapping detail line. Move+Atk and Rapid Strike modifiers are omitted from compact roll-result summaries while their mechanical effects remain.
- Roll cards display the assigned **mech owner**, not the seat that initiated the roll. Host-entered owner names are grey; closed frames display **Unknown** in grey. Client-assigned owners use their seat color.
- Frame names in CMD rolls use the paper-doll color rather than the pilot color. Roll-card color outlines were removed. Frames with no selected tab-outline color show **grey frame-name text** in both tabs and CMD rolls (including multiplayer), independent of client theme or frame condition.
- Chosen user/seat colors are now stored in the database and survive application server restarts when the database persists. A per-callsign browser backup reapplies the color after a local in-memory table is recreated.
- The CMD terminal minimize control was removed. User-list width reduced from ~210px to ~108px in the command panel.
- Extra-wide windows have a centered fixed maximum width and balanced columns, avoiding shifting panels.
- Catalog editor adds top-level create/export actions, sticky commit controls, quick stat-token buttons, a subtype autocomplete list, and save/cancel controls near tier records.
- Unnecessary **VIEW ONLY // OTHER UNIT** banners were removed; permission protections remain intact.
- Heat buttons have the same rendered height as adjacent Targeter controls.

## Changed files

- `public/terminal.html`
- `public/mp-bridge.js`
- `src/lib/forge/room.server.ts` and mirrored `server/room.server.ts` (persistent client colors)
- `migrations/0003_forge_member_colors.sql` (adds the persistent member color)
- `CHANGELOG-v5.5.2.md`

## Verification

- JavaScript syntax validation: passed for the terminal inline script and multiplayer bridge.
- Headless Chromium UI smoke checks: passed for component menus and repair, forced damage (including dry magazines), attack/damage readiness indicators, maneuver toggles, Evaluate, Stability, Retreat, roll-only filtering, remote roll color, redraw focus, and layout at 1920px. No page-level script errors observed.
- Live multi-client/server end-to-end integration was not exercised in this local test environment. Deploy to a staging table before relying on it in an active session. New persistent-color behavior requires the SQL migration to be applied.

## Run and deploy

- Merge the patch files into the project at the same relative paths. Deploy/build normally; `npm run build` applies the new migration when `DATABASE_URL` is configured. Local PGLite applies it at startup.
- With a persistent PostgreSQL database, seat colors persist across server restarts and seat reconnections. The default in-memory PGLite fallback still resets the entire sortie table on restart; each client's locally saved color is reapplied when they rejoin with the same callsign/browser.
- Rebuild generated deployment output; a live multiplayer staging session is recommended before production deployment.
