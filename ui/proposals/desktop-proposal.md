# FORGE-OS: "Workstation" desktop shell, v2 (PROPOSAL ONLY)
- **Basis:** `out/terminal.html` v5.1.0 and `out/mp-bridge.js` v15. Desktop only.
- **What changes:** the shell and navigation only.
- **What stays:** every view function keeps its logic and its output. No new game systems.
- **Previous version:** `desktop-proposal.v1.md`, scored 7.5/10.
- **Scope:** MVP plus a trimmed P2. Unit Mirrors, the KERNEL boot window, the mount crawl and the wide/ultrawide layouts are **cut**.

## Changes from v1
- **Titles:** the unit name comes first and module numbers are gone from the strip (`MUSHA TEST // SORTIE TELEMETRY`). Titles are at `--fs-l` or larger.
- **Brackets:** `.panel.primary` (heavy brackets) is fixed on TELEMETRY. Focus shows only as a brighter title strip plus `aria-current`.
- **Buttons:** `[–]` collapse, `[_]` minimize, `[□]` maximize, `[✕]` close. Every chrome button has a `title` and an `aria-label`.
- **Pilot default:** the SHEET is **collapsed** (title strip visible), not minimized.
- **Stacking:** there is an explicit z-index scheme, and `#mpveil` sits above every window (§3.3).
- **Cuts:** Unit Mirrors (P3), the KERNEL window, the mount crawl and the wide/ultrawide layouts (P4).
- **Kept:** half-snapping, the ACCESS ROUTER modal and the BENCH retitle.
- **Plan:** about 5–6 days, sequenced **after** the A0 bridge/server fixes (§8).

## 0. What the code allows (grounding)
- **`R()` is the single renderer.** It writes into fixed containers:
  - `#who`: the clearance header.
  - `#bar`: the EP bar or `sheetTabs()`.
  - `#sh`: `sheet()`, `welcomePanel()`, or the research panes.
  - `#tb` and `#out` inside `#con`: the view body.
    - `sortieView()` (which includes `pilotView()`, `stabBox()`, `heatBox()`, the damage box and the HUD).
    - `catalogView()`/`list()`, `intelView()`, and the login, password and `mpw` screens.
  - The console `#cb`: `#conhead` and `#log`, plus the `CE//FORGE>` input `#CI`.
  - `#mpfriends`: the roster, injected by the bridge's `ensureChrome()`/`paintFriends()`.
- **There is one global state `S` with one current sheet.**
  - `S.view` is one mode.
  - `mpEditor()` is a mode switch: it benches the sortie sheets, then edits a frame.
- **⇒ Windows host the existing containers.** The shell moves those DOM nodes into window bodies once at boot. `R()` keeps writing the same IDs, so there's no rewrite and no second renderer.
- **⇒ Every window is a singleton.** There's one live sheet editor, as today. Viewing another unit still means switching the sheet tab (`shGo()`).

## 1. Concept: ISB Field Workstation R+D-117
- **In-world framing.** This isn't a generic OS. The screen is a cleared terminal session on an Imperial database workstation.
- **Clearance header** (the top strip, which is the current `#who` plus the session line). It reads `CORE EMPIRE // SCIENCE CORPS R+D // FORGE-OS v5.1.0 // TL8`, then `CLEARANCE: IMPERIAL TALONS`, the session stamp, the link readout `#sync`, `[AUDIO]`, `[THEME]` and `(L)OGOUT`.
- **MODULE BAY** (the left rail). It's a "directory" of the modules this clearance may load:
  - FRAME ASSEMBLY
  - COMPONENT REGISTRY
  - SORTIE TELEMETRY
  - FRAME SHEET
  - OPERATOR CONSOLE
  - TABLE ROSTER
  - MANIFEST INTAKE
- **Bay slot states:**
  - Modules the role can't use show `[NO CLEARANCE]`. The wording comes from the existing role logic.
  - Minimized windows dock in their slot with a status mark in the pinned colours: `●` ok, `▲` damaged/warn, `✕` crit.
- **Module numbers** appear only in the bay, never in window titles.
- **Boot.** The existing `seqFor()` sequence is **unchanged**: it runs once per session in the current full-page form, then the desktop appears.

## 2. Window model (all singletons)

| Window | Hosts | Rules |
|---|---|---|
| SORTIE TELEMETRY | `#con` body when `S.view` is `sortie` or `intel` | **primary**: always carries `.panel.primary` brackets; can't be closed (it is the view) |
| FRAME ASSEMBLY / COMPONENT REGISTRY | the same `#con` body in `main`/`chassis`/`catalog`/`catalogEdit` | the same window; its title follows `S.view` |
| FRAME SHEET | `#sh` | all views after login |
| OPERATOR CONSOLE | `#cb` (`#conhead`, `#log`, `#CI`) | always present; can be collapsed, can't be closed |
| TABLE ROSTER | `#mpfriends` | when `MP.linked`; can be collapsed, can't be closed while linked |
| ACCESS ROUTER | the login, `pw`, `researchPw` and `mpw` screens | **modal** dialog before clearance |

- **The sheet tabs** (`sheetTabs()`) and the EP bus (`bar()`) render in `#bar`. That container is docked as a toolbar row under the TELEMETRY/ASSEMBLY title strip.
- **Bench retitle (`mpEditor()`).**
  - While `MP.editing`, the `#con` window is titled `<frame> // FRAME ASSEMBLY // BENCH` and gets an amber `[BENCH // LIVE TABLE PAUSED]` tag on its strip.
  - The roster stays visible.
  - Leaving the bench restores the sortie title.
- **Titles: unit first.**
  - With a unit: `<unit> // <module>`, for example `MUSHA TEST // SORTIE TELEMETRY`. The unit name comes from `shLabel(S.cur)`, or `idline()` when there are no sheets.
  - Without a unit: just the module, for example `OPERATOR CONSOLE` or `TABLE ROSTER // 2 SEATS`.

**Default layouts** (stored as fractions of the desktop area):
- **Host (OVERSEER, or the host of the live table):**
  - TELEMETRY: left, 60% width.
  - SHEET: right, top 55%.
  - CONSOLE: right, bottom.
  - ROSTER: open, docked under the bay.
- **Pilot:**
  - TELEMETRY: left, 62% width.
  - SHEET: right, **collapsed to its title strip** at the top, one click to expand.
  - CONSOLE: fills the rest of the right column.
  - ROSTER: collapsed to its strip.
- **Solo roles (GUEST, MECHANIC, RESEARCH):**
  - ASSEMBLY/REGISTRY on the left, SHEET on the right. This is today's two-panel arrangement.
  - CONSOLE collapsed to its strip.

## 3. Window chrome
### 3.1 Title strip and buttons
- **The strip:** 26px tall. The title uses `--fs-l` (12.5px) at minimum; the mockup uses 13px with 0.04em tracking. It is never smaller than the sheet's label text.
- **Layout:** a status mark (`●`/`▲`/`✕`, from `shStatus()`/`igOf()`) sits before the title, and the buttons sit on the right. Buttons are `--fs-l`, 20px high, with a 28px minimum hit width.

| Button | Action | `title` / `aria-label` | Key |
|---|---|---|---|
| `[–]` (shows `[+]` while collapsed) | collapse to the title strip, or expand | "Collapse window" / "Expand window" | `Alt+K` |
| `[_]` | minimize to the Module Bay | "Minimize to module bay" | `Alt+M` |
| `[□]` | maximize within the desktop, or restore | "Maximize" / "Restore size" | `Alt+Enter` |
| `[✕]` | close; hidden where the window can't be closed | "Close window" | `Alt+X` |

- **Brackets:** the window frame is the existing `.panel` border and light corner brackets. `.panel.primary` (heavy cyan brackets) stays **fixed on TELEMETRY** regardless of focus.
- **Focus:** the focused window shows only a **brighter title strip**: background `--hover`, title text `--cyan`, a 1px cyan rule under the strip. It also gets `aria-current="true"`. Unfocused titles use `--fg` on `#081812`, which stays AA-readable and isn't dimmed below contrast.
- **Crits:** status colours use only the pinned `--c-ok`, `--c-warn`/`--c-dmg` and `--c-crit`, always with a glyph. A crit lights the title mark and, if the window is minimized, the bay mark. The existing 5.1 `hudCrit()` flash is unchanged.

### 3.2 Move, resize, snap
- **Move:** drag the title strip.
- **Resize:** 8 handles (6px). Minimum sizes are TELEMETRY 640×420, SHEET 420×300 and CONSOLE 360×140.
- **Snap:**
  - Edges snap to the desktop edges and to other windows within 12px.
  - **Half-snap:** dragging a title against the left or right edge fills that half. A dashed cyan preview appears first.
  - Double-clicking the title toggles maximize.
- **Implementation:** pointer events; `transform` while dragging, committed to `left`/`top`/`width`/`height` when the pointer is released.

### 3.3 Z-index scheme
- **Today's fixed layers** are `#mpfriends` 40, `#clog` 60, the toast 80, `#hudfx` 90 and `#mpassign`/`#mptint` 500.
- **Finding:** `#mpveil` currently has **no stylesheet rule at all** in v5.1; the bridge just appends a div. The shell CSS must define it.

| Layer | z-index | Notes |
|---|---|---|
| Windows | **10–999** inside `.desk-area` (`isolation:isolate`) | raised windows take `++top`; when the top reaches 999, all windows are renormalised to 10… in their current order |
| Clearance header and Module Bay | 1000 | outside the area, always visible |
| `#hudfx` crit flash | 1100 | `pointer-events:none` |
| Toast | 1200 | |
| `#mpassign` / `#mptint` popovers | 1300 | must float over windows |
| Modals: ACCESS ROUTER, `#clog` changelog | 1500 | with a backdrop |
| **`#mpveil`** | **2000** | `position:fixed; inset:0`; always above every window and modal |

- Because the windows live in an isolated stacking context, nothing a window does can ever cover the veil or the modals.
- `#mpfriends` loses its own `position:fixed; z-index:40` when re-hosted. The shell also neutralises `body.mp-linked{padding-left:210px}`.

### 3.4 Keyboard
These avoid keys the browser reserves (Ctrl+W, and Alt+digit, which switches tabs on Linux).

| Key | Action |
|---|---|
| `F6` / `Shift+F6` | Cycle window focus |
| `Alt+C` | Focus the console input `#CI` |
| `Alt+K` | Collapse |
| `Alt+M` | Minimize |
| `Alt+X` | Close |
| `Alt+Enter` | Maximize |
| `Alt+Arrow` | Move 16px |
| `Alt+Shift+Arrow` | Resize |
| `Alt+Shift+←` / `Alt+Shift+→` | Half-snap |

## 4. Persistence (local only)
- **Storage.** Stored in the existing `forge_ui_v1` object (`UI`) under `UI.desk`, saved through the existing `uiSave()`.
- **Key.** Keyed by role profile: `host`, `pilot`, `guest`, `mechanic`, `research`, `overseer`.
  `UI.desk = {v:2, host:{tele:{x,y,w,h,col,min,max,z}, sheet:{…}, con:{…}, ros:{…}}, pilot:{…}}`.
- **Values are fractions** of the desktop area.
- **On restore,** windows are clamped back on screen, and an unknown or corrupt `v` falls back to the defaults.
- **`[RESET LAYOUT]`** is in the Module Bay footer and also available as the console command `layout reset`. It deletes `UI.desk[profile]` and re-applies the defaults.

## 5. Multiplayer
- **Layouts are never synced.**
  - Nothing in `UI.desk` enters `pack()`/`split()` or any bridge payload.
  - The server never sees window state.
- **Always visible:**
  - **Status:** `#sync` lives in the clearance header.
  - **Roster:** it can be collapsed but not closed while linked.
  - **Veil:** `#mpveil` is above everything (§3.3).
- **Crits:** a remote crit on a minimized window lights its bay mark, and `#sra` still announces it.

## 6. Accessibility
- **Roles.**
  - Windows are `role=region` with `aria-labelledby` set to the title.
  - The focused window has `aria-current="true"`.
  - The ACCESS ROUTER and `#clog` are `role=dialog` with `aria-modal=true`, and focus is trapped inside them.
  - The bay is a `role=toolbar`: its buttons use `aria-pressed` for open and `aria-describedby` for status.
- **Chrome buttons** are real `<button>` elements with a `title` and an `aria-label`. Collapse uses `aria-expanded`.
- **Focus.**
  - Opening a window focuses its first control.
  - Minimizing or closing returns focus to the bay slot.
  - Each window remembers its last focused element. The existing `.shtl`/`.mlab` focus restore in `R()` is kept.
- **Announcements.** These go to `#sr`, politely, for example "Frame sheet collapsed".
- **Reduced motion.** There are no transitions on collapse, minimize or snap, and the snap preview appears instantly.
- **Keyboard-only use.** Every pointer action has a key (§3.4).
- **Contrast.** Only existing AA-checked tokens are used.

## 7. Technical approach (vanilla JS, no framework)
- **Size.** About 400 lines: `desk.js` (a classic script loaded after `mp-bridge.js`) plus about 130 lines of CSS.
- **Mount.**
  - `Desk.mount(id, host, opts)` builds `<section class="win panel">` with the strip and a `.win-b` body.
  - It then calls `appendChild($(host))`. The IDs are unchanged, so `R()`, `ensureChrome()`, `paintFriends()` and every `$()` call keep working.
- **Re-render hook.**
  - Wrap `R` once, the same pattern as 5.1's `_R51`. After each render:
    - retitle the windows (the unit, the view, BENCH);
    - update the marks;
    - gate the bay slots by role;
    - show or hide ROSTER on `MP.linked`;
    - open the ACCESS ROUTER modal when `S.view` is a login or password screen.
  - There are no changes inside any view function.
- **Console coexistence.**
  - The global keydown (T:1298) redirects printable keys to `#CI` whenever no field has focus.
  - A capture-phase shell handler takes F6 and the Alt chords. When focus is inside a non-console window, it sets `e.__deskOwned`.
  - The existing handler gets a one-line guard: `if(e.__deskOwned)return`.
- **Performance.**
  - `R()` cost is unchanged: the same `innerHTML` writes go to the same nodes.
  - Drags use `transform`, with `will-change` set only while dragging.
  - A `ResizeObserver` on `.win-b` is throttled with `requestAnimationFrame`.
  - Minimized windows get `content-visibility:hidden`, and their DOM stays in place so the bridge's node references stay valid.

## 8. Build plan (about 5–6 days)
**Dependency:** this starts **after** the A0 bridge/server fixes, R7 first, which are already built in `out/` v5.1.0:
- R7: the sanitizer;
- R1/R2: the merge;
- R3: undo;
- R4–R6: the link and backoff fixes.

They should be deployed and two-seat verified first. The shell is built on those v5.1.0 files and doesn't touch sync, so it must not be mixed into that release.

| Step | Scope | Days |
|---|---|---|
| 0 | Gate: v5.1.0 (R7 → R1–R6) live and verified on the real server | (done in `out/`; deploy and verify) |
| MVP | Clearance header, Module Bay, chrome (move, resize, collapse, minimize, maximize, close, focus strip), z-index scheme and the veil rule, persistence and reset, keyboard, aria. Re-hosts TELEMETRY/ASSEMBLY, SHEET, CONSOLE and ROSTER. Role defaults, including the collapsed sheet for pilots | 3–3.5 |
| P2 (trimmed) | Edge and half-snap; ACCESS ROUTER modal (login, `pw`, `researchPw`, `mpw`); BENCH retitle for `mpEditor()` | 1–1.5 |
| QA | All roles, a two-seat host/pilot run, 1366–1920px, the 5.1 regression scripts, keyboard-only and screen-reader passes | 1 |

**Risks:**
1. **CSS that assumes the fixed `main` grid**, for example the sticky `.sorhead.hud` and the paper doll's sizing. Mitigation: `container-type:inline-size` per window, and testing each view at the minimum size.
2. **The console key redirect** fighting window focus. Mitigation: the `__deskOwned` guard, tested for each input type.
3. **Bridge layout assumptions:** `body.mp-linked` padding, the unstyled `#mpveil`, and the popovers at 500. Mitigation: the scheme in §3.3.
4. **Scope creep.** All windows are singletons, nothing new is synced, and no view logic changes.

## 9. Mockup (ASCII)
```
┌ CORE EMPIRE // SCIENCE CORPS R+D // FORGE-OS v5.1.0 // TL8 ─ CLEARANCE: IMPERIAL TALONS ─ [● LINK OK] [AUDIO] [THEME] (L)OGOUT ┐
│MODULE BAY ┏ ● MUSHA TEST // SORTIE TELEMETRY  [–][_][□]━━━━━━━━━━━━━━┓┌ ▲ MUSHA TEST // FRAME SHEET    [–][_][□][✕] ┐ │
│01 ASSEMBLY┃ [MUSHA TEST] [KAGE ✕]                     (sheet tabs)   ┃├─────────────────────────────────────────────┤ │
│02 REGISTRY┃ STATUS ▲ DAMAGED │ INTEGRITY 80% │ HEAT 4/12 │ BRITTLE    ┃│ (pilot default: collapsed to this strip)    │ │
│03 TELEM ● ┃ HEAD 40/40     [ FRAME ]   CORE 105/264 [DMG] ▲           ┃└─────────────────────────────────────────────┘ │
│04 SHEET ▲ ┃ L.ARM -1/132 [DIS] ✕       R.ARM 132/132                  ┃┌ ● OPERATOR CONSOLE  (focused: bright strip)  ┐│
│05 CONSOLE ┃ IMPACT  DMG [2600] DIV [1] [APPLY] [UNDO]                  ┃│ 08:36:04 PILOTB // KAGE :: 2600 → L.ARM DIS   ││
│06 ROSTER  ┃ RADS 135 [ELEVATED ▲] [-5] [+5]                            ┃│ CE//FORGE> _                                  ││
│[RESET]    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛└───────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
  ┏━┓ = .panel.primary, fixed on TELEMETRY     focus = brighter title strip + aria-current only
```
There is also a static HTML mockup using the real palette: `desktop-mockup.html`, with a screenshot at `desktop-mockup.png`. It shows the pilot default with the console focused.
