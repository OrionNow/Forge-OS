# FORGE-OS Desktop M2 proposal: "Modular Cockpit" (round 2)

**Author:** Hikari (Catalog Ideator), for the Overseer. **Status:** proposal, design only. **Target build:** v5.5.1-D2, built in `/workspace/forge-os/out-v5.5.1-D2/` on top of v5.5.1-D1 (desktop M1, `out-desktop-m1/desk.js`).
**Review status (final):** Misaki **8/10 B+ PASS** · Ryuji **signed off** (round 2, plus the final edits below).
> **⚠ Overseer approval needed:** D2 needs a ~5-line, display-only patch to `mp-bridge.js` (`paintFriends()` host branch + `Desk.ownsBar()` guard, §4). It has no sync impact.

**Files:**
- `mockup.html`: self-contained and interactive. Presets are `?preset=def`, `trio` and `table`.
- `shots/`: 1920×1080 and 1366×768 for each preset.
- Smoke test: `work/m2-mock-check.js`.

**Scope:** the shell only. No game mechanics, stat fields, sync traffic or view-logic changes. `R()` stays the single renderer, and **`S` is never mutated for display**.
**Mockup data:** MSH-01 is the M1 sample mech. The other mechs and all loadouts are placeholders built from core-catalog frame lines.

## 1. Features (the Overseer's five)
| # | Feature | Behaviour |
|---|---|---|
| F1 | **Several paper dolls** | `[+ DOLL]` (Ctrl+Alt+N) opens one window per mech. Each window has a mech `<select>`, its own accent (cyan, amber, magenta, lime or violet on the brackets, title and chip) and a title like `MUSHA TEST // PAPER DOLL`.<br>**Exactly one doll is LIVE**, meaning it shows `S.cur`. The live doll has a green inner double frame, a solid `◆ LIVE` tag, and its selector is locked.<br>Every other doll is a **MIRROR**: a read-only cache. It becomes live **only** through its `◆ MAKE LIVE` title button (or the same button in its mirror bar), which calls `shGo(i)`. Focus, clicks, double-clicks, chips and hotkeys never promote.<br>The **sheet tab strip** (`#bar`) sits at the top of the live doll window, and clicking a tab there is the other explicit way to switch the live sheet. |
| F2 | **Module bay as a bottom taskbar** | A 40px bar across the bottom, which replaces the left rail.<br>Launchers: `+ DOLL`, `SHEET`, `CONSOLE`, `USERS`, `PANELS ▴`.<br>Chips read **state · mech · type**, e.g. `◆MSH·DOLL`, `◇ICR·DOLL`, `◆MSH·IMP+SKL+ROLL`, with an accent underline and a glyph (`●` open, `–` collapsed, `_` minimized, `⌖` pinned). Click a chip to focus its window; clicking the focused window's chip minimizes it, and clicking a minimized chip restores it. |
| F3 | **Split windows** | Every window is a **host** of **panels**. Tear a panel off with `⇱`, or by dragging its header out of the window. `⇲` re-docks it to its home host. Dropping a window's title onto another window's title strip docks it there. USERS and the console can't be docked.<br>`PANELS ▴` opens any panel type as its own window. If that type already has a live host, it focuses that host instead. |
| F4 | **Narrower user list** | USERS is its own window: compact (124px, 20px rows), icon rail (40px, colour initials, with a gold `★` on the host) or full (176px, shows each user's place). `◧` cycles them. |
| F5 | **Layout slots** | `[1]`–`[5]` sit on the taskbar. Select a slot, then `SAVE` or `LOAD`; double-clicking a slot loads it. **Ctrl+Alt+1..5** loads and **Ctrl+Alt+Shift+1..5** saves; plain Alt+digit is avoided because the browser uses it for tabs. `DEF` resets to the default and turns into `UNDO` for 8 s. |

Kept QoL: **pin** (locks position and size, z 900+) and a **simple snap** (8px grid plus window edges, with a dot grid shown while dragging). Collapse, minimize and maximize work as in M1.
**Compact rule:** the default layouts don't scroll the page at 1366×768 or at 1920×1080. If a panel gets too small it scrolls inside the panel, and a doll narrower than 215px drops its figure.
**Presets:**
- `def`: 6 windows (two dolls, a LINKED controls window, a LINKED sheet, the console and USERS).
- `trio`: 3 dolls.
- `table`: 4 windows for 1366 at the table: the live doll (doll, bus, impact), LINKED controls (skills, rolls, **armament**, which brings ATK/DMG and the targeter), a narrower console, and the USERS rail.

## 2. Model
- **Window** `{id, k, mech, mode, act, x,y,w,h, z, pin, col, min, max, P:[Panel], r?, acc?}`
  - `k` is one of `doll | sheet | console | roster | float`.
  - **Binding** (`mech`) has two options only:
    - `"@live"` = **⛓ LINKED**: follows the live doll. This is the default for the sheet, the controls window and new panel windows.
    - **One fixed mech key.** Doll windows are always fixed, and a panel torn from a window keeps that window's binding.
- **Panel** `{id, t, home}`. `t` is one of `doll, bus, impact, skills, rolls, arms, frame, log, roster`.
- **Single-instance rule.** For each panel type there is exactly **one live host**: the first panel of that type, in window order, whose window resolves to the live mech. It holds the real nodes. Every other panel of a mech-bound type renders as one of:
  - **COPY** (same type, live mech): the cache plus a bar reading `◇ COPY · LIVE IN <window> [GO]`.
  - **MIRROR** (non-live mech, previously live): the cache plus a bar reading `◇ MIRROR · hh:mm · MAKE LIVE TO EDIT [◆ MAKE LIVE]`.
  - **NOT YET VIEWED** (non-live mech, never live): a placeholder only.
- **Mirror look.** The body is dimmed and desaturated, with a gold diagonal hatch. Every control is `disabled` with a dashed border and a not-allowed cursor, and the body is mounted `inert`.

| t | v5.5.1 source | How it is hosted |
|---|---|---|
| doll | `.sorhead` + the `mechMap(t,L,prev)` block in `#out` | harvested |
| *(tab strip)* | `#bar`: in sortie view, R() writes `sheetTabs()` here (mech switcher, owner names, Assign, right-click menu), and the bridge rewrites it with `mpTabs()` | **not a panel**: moved whole to the top of the live doll window, never copied (§3.2, §4). The taskbar is untouched. |
| bus | the `heatBox()` block from `#out` + the `EP USED` / checksum line from `#sh` | harvested |
| impact | `.damagebox` (+ `stabBox()`) | harvested |
| skills | `.pilot` / `.pg` (`shHead('PG','SKILL INPUTS')`) | harvested |
| rolls | `.pact.nw`, `.pact.pdef` | harvested |
| frame / arms | `#sh` CHASSIS / ARMAMENT sections | harvested from `#sh` |
| log | `#cb` | moved once (as in M1) |
| roster | `#mpfriends` | moved once, via the bridge patch in §4 |

## 3. Harvest (desk.js)
1. **Timing.** `R()` → `anim()` → `play()` is asynchronous whenever the view, tab or selection changes (terminal ~l.1335). So the harvest is driven by a `MutationObserver` on `#out` and `#sh` (`childList`, `subtree`), debounced to one `requestAnimationFrame`. The synchronous `R` wrapper only schedules it.
   - **Script order is fixed:** `terminal.html` → `mp-bridge.js` → `desk.js`. Desk's `R` wrapper is therefore outermost, so it runs after the bridge's post-render (`#bar` tabs, `paintFriends`, `markSync`).
2. **Hygiene.** For each live host: empty its `.pb`, then **move** the freshly rendered nodes into it. Never clone live nodes. `#bar`, `#cb` and `#mpfriends` are persistent containers: they are moved whole and never copied. `#bar` (the sheet tab strip) goes to the top of the live doll window, above its panels. When the live sheet changes it moves to the new live doll, and if that mech has no doll window it moves to the first doll window. It never goes to the taskbar, a mirror or a cache.
3. **Cache.** After a harvest, store `cache[sheetKey][t] = strip(node.outerHTML)` and the time as `seen[sheetKey]`.
   - `strip` removes every `id`, `for`, `name`, `on*`, `data-menu` and `data-item` attribute, adds `disabled` and `tabindex=-1` to form controls, and the result is mounted inside `<div class=mirc inert>`.
   - This way `getElementById` (`sync`, `dmgIn`, `sitsum`, `tiers`, `tgtile`, …) can only ever hit the live copy. `#sync` is updated by mp-bridge ~l.1682.
4. **Focus survival.** Before moving nodes, record the `activeElement` id, value and selection if it sits inside a panel. After the move, refocus the node with the same id and restore its caret. This covers a remote-triggered re-render.
5. **Mirrors are cache-only.** There is no live re-render and no `shApply` for display.

## 4. mp-bridge patch (display only, no sync impact, for the Overseer to approve)
- **`paintFriends()`** (~l.1713-1725): replace the `#cb` mount block with a host-aware branch (about 5 lines). With the patch, the 450ms repaint no longer re-appends the box to `#cb`:
  ```js
  const host = window.Desk && Desk.rosterHost && Desk.rosterHost();
  if (host) { if (box.parentElement !== host) host.appendChild(box); box.style.top = ""; }
  else { /* existing #cb append, .users toggle and top offset, unchanged */ }
  ```
  The `.min` and body-class toggles stay as they are. The roster-window CSS (`#mpfriends` static, full height, plus the rail and compact rules) lives in `desk.js`.
- **`#bar` rewrite** (~l.1082-1085): the bridge keeps writing the sheet tab strip into `#bar` (`mpTabs()`), and terminal `R()` writes `sheetTabs()` there (~l.1280). Desk moves `#bar` whole to the top of the live doll window and never harvests inside it, so neither writer is fought. `Desk.ownsBar()` returns true while desk hosts `#bar`, and the bridge then skips only its `<div class=panel style="margin-top:12px">` wrapper. Terminal's own identical wrapper is neutralised by desk CSS (`.win #bar>.panel{margin:0}`), so `terminal.html` is not edited. Tabs, owners, Assign and the right-click menu stay unchanged.

## 5. Persistence (`forge_ui_v1` → **`UI.desk2`**, per profile, never synced)
- M1's `D()` resets `UI.desk` whenever `v !== 1`, so M2 uses its own key: `UI.desk2 = {v:2, on, L:{solo,table}, slots:{solo:{1..5},table:{…}}}`.
- On the first run, M2 reads `UI.desk` v1 **read-only** and migrates it: `tele` → a live doll window (doll, bus, impact, skills, rolls), `sheet` → a LINKED sheet, `con` → the console. It never writes back to `UI.desk`.
```json
Layout = { "v":2, "snap":true, "grid":8, "seq":21, "top":42, "live":"<sheetKey>", "seen":{"<sheetKey>":"hh:mm"},
  "wins":[{ "id":"w2","k":"doll","mech":"<sheetKey>","acc":0,"mode":"lr","act":0,"x":0.074,"y":0,"w":0.36,"h":0.6,
            "z":12,"pin":false,"col":false,"min":false,"max":false,"P":[{"id":"p3","t":"doll","home":"w2"}] }] }
Slot   = { "v":2, "name":"2 DOLL · 6 WIN", "saved":"ISO-8601", "area":{"w":1908,"h":1032}, "layout":<Layout> }
```
- **Sheet key** = the sheet `uid` (the one mp-bridge already uses), with `fidJoin(d.id,d.cs)` as the solo fallback. It is **never** the name or the index.
- **`sanitize(layout)`** runs on boot and on every slot load:
  - drop unknown `k`/`t`;
  - drop doll windows whose key no longer resolves;
  - relink fixed windows whose key is missing to LINKED;
  - de-duplicate panel types within a window;
  - keep at most one console and one USERS window;
  - **re-number all ids and recompute `seq`**;
  - guarantee at least one doll and exactly one console;
  - clamp geometry to 0..1 with `y + h ≤ 1`, and z below 800 (pinned windows add 900, still under 1000);
  - re-pick `live` if its key is gone.
  The toast reports the counts of dropped and relinked windows. It never falls back to `S.cur` for several dolls.
- **Corrupt JSON or `v > 2`:** load DEF, toast, and **don't write the store** until the Overseer saves or presses DEF. A bad slot is rejected and the layout stays unchanged.
- `place()` caps each window's height to the desktop area and keeps its bottom on screen, so a slot saved at 1920 still fits at 1366.

## 6. Implementation notes for Kaito (against `desk.js`)
1. **Window list.** Generalise `W`/`ORDER` into `wins[]` using `spawn(win)`/`kill(id)`, and keep `focusWin`, z renormalisation, `place`/`commit` and the `R` wrapper. Add `data-k`, `data-id` and `data-m` attributes for the tests.
   - `focusWin` **never** calls `shGo`; only `makeLive(key)` does.
   - Promotion stamps `seen[prev]`, re-runs the harvest and re-targets the LINKED windows.
2. **Taskbar.** Replace `#deskbay` with `<nav id=desktb role=toolbar>`, and change `#deskroot` to a column. Chips replace the bay slots.
3. **CLASSIC / `hostOut`.** Return `#bar`, `#con`, `#sh` and `#cb` to their M1 homes, put `#mpfriends` back into `#cb` (`rosterHost()` then returns null), **empty every panel `.pb`**, disconnect the observer, then call `R()`. `[DESK]` reverses this and re-harvests.
4. **Slots.** Bind the keys through M1's `keys()` handler with the `__deskOwned` guard. Never sync slots.
5. **Tests.** Write `check-desktop-m2.js` (extending M1's). Port the mockup checks: no duplicate ids, no promotion on click, bad and future slots, the focus-kept case, DEF/UNDO and the rail host mark.

**Order:** taskbar → window list, `UI.desk2` and sanitize → roster window and bridge patch → harvest (observer) → multiple dolls (cache, MAKE LIVE) → pin and snap. Each step ships behind `[CLASSIC]`.

## 7. Deferred extras (not in D2)
- The four switchable panel layouts (main+side, stacked, side by side, tabs). D2 uses each preset's fixed per-window layout.
- Full window-edge snapping and half-snap previews.
- A window-cycle hotkey: F6 is taken by the browser, so pick an in-app chord later.
- A FOLLOW-focus binding.
- Per-window opacity.
- A scratch note. **Cut** per Misaki.

## 8. Round 2 changes (review → fix)
**Ryuji**
| # | Fix |
|---|---|
| R1 | Harvest is driven by a `MutationObserver` on `#out`/`#sh` with an rAF debounce; script order is fixed (§3.1). |
| R2 | Each harvest empties the `.pb` first, then moves nodes; `#bar`, `#cb` and `#mpfriends` are moved whole, never cloned (§3.2). |
| R3 | Mirror cache is stripped of `id`/`for`/`name`/`on*`/`data-menu`/`data-item`, uses disabled controls and is mounted inert (§3.3). Checked: no duplicate ids. |
| R4 | Promotion only via `◆ MAKE LIVE`. FOLLOW is gone; LINKED tracks the live doll (§1 F1, §2). Checked: clicks don't promote. |
| R5 | Hatched, dimmed mirror bodies with the `◇ MIRROR · hh:mm · MAKE LIVE TO EDIT` bar; the live doll gets a green double frame (§2). |
| R6 | Single-instance rule: one live host per type, otherwise COPY, MIRROR or NOT YET VIEWED. The default preset no longer puts controls under the mirror (§2). |
| R7 | Layouts live in `UI.desk2`, with read-only migration from v1 (§5). |
| R8 | `sanitize()` on boot and on slot load; corrupt or future data loads DEF without overwriting the store (§5). |
| R9 | Sheet key = `uid`, with `fidJoin` as the fallback; never the name (§5). |
| R10 | Roster change specced as a ~5-line, display-only bridge patch (§4). |
| R11 | CLASSIC empties every panel, then calls `R()` (§6.3). |
| R12 | `withSheet()` removed; mirrors are cache-only (§3.5). |
| Nice | Chips show state·mech·type; hotkeys moved to Ctrl+Alt; lean `table` preset added. |

**Misaki**
| # | Fix |
|---|---|
| M1 | Each panel type exists once, in the live window; mirror-bound panels show a greyed, tagged cache. Checked: 25 of 25 mirror controls are disabled and inert, and clicking them does nothing. |
| M2 | Ids are stripped from caches. Checked: no duplicate ids before or after promotion. |
| M3 | Explicit MAKE LIVE only, read-only mirrors, `◇ MIRROR · hh:mm` stamp. |
| M4 | Bridge patch for `paintFriends`, a `Desk.ownsBar()` guard, `#bar` moved whole, fixed script order (§4, §3.1). |
| M5 | `loadSlot` sanitizes first: missing-mech dolls are dropped, fixed windows relinked, nothing throws, no `S.cur` fallback. Checked. |
| Should-fixes | Bottoms clamped on screen and heights capped; DEF has an 8 s UNDO; the rail shows a host `★`; focus and caret survive a re-render. All checked. |
| Final edits | Table preset gains ARMAMENT (controls window, console narrowed); `#bar` relabelled as the sheet tab strip, moved whole to the live doll window; rail ★ enlarged to 13px; approval callout and review status added to the header. |
| Cuts | CUPHOLDER and opacity removed; binding is LINKED or one fixed mech; snap grid, F6 and layout modes moved to §7 (the mockup keeps a simple snap). |
