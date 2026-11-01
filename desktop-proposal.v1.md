# FORGE-OS: "Workstation" desktop shell (PROPOSAL ONLY)
Based on `out/terminal.html` v5.1.0 and `out/mp-bridge.js` v15. Desktop only.
- **What changes:** the shell and navigation only.
- **What stays:** every view function keeps its logic and its output. No new game systems.

## 0. What the code allows (grounding)
- **`R()` is the single renderer.** It writes into fixed containers:
  - `#who`: the clearance header.
  - `#bar`: the EP bar or `sheetTabs()`.
  - `#sh`: `sheet()`, `welcomePanel()`, or the research panes.
  - `#tb` and `#out` inside `#con`: the view body.
    - `sortieView()` (which includes `pilotView()`, `stabBox()`, `heatBox()`, the damage box and the HUD).
    - `catalogView()`/`list()`, `intelView()`, and the login, password and `mpw` screens.
  - The console `#cb`: `#conhead` and `#log`, plus the `CE//FORGE>` input `#CI`.
  - `#mpfriends`: the roster, injected by `ensureChrome()`/`paintFriends()` in the bridge.
- **There is one global state `S` with one current sheet.**
  - `shSave()`/`shApply()` swap the current sheet in and out of `S`.
  - `S.view` is one mode (login → chassis/main/catalog/sortie/intel/…).
  - `mpEditor()` is a mode switch: it benches the sortie sheets, then edits a frame in `main`/`chassis`.
- **⇒ The safe design: windows *host* the existing containers.** The view code isn't moved into windows. `R()` keeps writing the same IDs, and the shell only moves those DOM nodes into window bodies once at boot. There's no rewrite and no second renderer.
- **⇒ A second sheet side by side can't be a second live editor.** That would need two `S` objects. It becomes a *mirror* window (see §2).

## 1. Concept: ISB Field Workstation R+D-117
- **In-world framing.** This isn't a generic OS. The screen is a **cleared terminal session on an Imperial database workstation**.
- **Top strip: the clearance header** (the current `#who`, plus the session line). It reads `CORE EMPIRE // SCIENCE CORPS R+D // FORGE-OS v5.1.0 // TL8`, then `CLEARANCE: IMPERIAL TALONS`, the session stamp, `[AUDIO]`, `[THEME]`, `[LOGOUT]` and the link readout `#sync` (`[LINK OK]` / `[LINK ERR // RE-AUTH]`).
- **Left rail: the MODULE BAY.**
  - It's a vertical "directory" of the modules this clearance may load, shown as slots:
    - `[01] FRAME ASSEMBLY`
    - `[02] COMPONENT REGISTRY`
    - `[03] SORTIE TELEMETRY`
    - `[04] PILOT DOSSIER`
    - `[05] OPERATOR CONSOLE`
    - `[06] TABLE ROSTER`
    - `[07] MANIFEST INTAKE`
  - Slots the role can't use show `[NO CLEARANCE]`, which uses the existing role logic for its wording.
  - Minimized windows "dock" in their slot, with a status pip in the pinned colours: `●` ok, `▲` warn, `✕` crit.
- **Windows are "modules"**, titled `MOD-03 // SORTIE TELEMETRY // MSH-01 / MUSHA TEST`, with corner brackets.
  - Loading a module plays a 1-line crawl: `MOUNTING MODULE 03 … OK`, skipped under reduced motion.
- **Boot.** The existing `seqFor()` boot sequence runs once per session (as in 5.1) inside a full-screen `KERNEL` window. That window then "unmounts" and the default layout appears.

## 2. Window model

| Window (module) | Hosts | Kind | Open in views |
|---|---|---|---|
| SORTIE TELEMETRY | `#con` body (`#tb` + `#out`) when `S.view` is `sortie` or `intel` | singleton, **primary** | sortie, intel |
| FRAME ASSEMBLY / REGISTRY | the same `#con` body in `main`/`chassis`/`catalog`/`catalogEdit` | singleton; the title follows `S.view` | build and catalogue views |
| FRAME SHEET | `#sh` (`sheet()`/`realSheet()`, research panes) | singleton | all after login |
| UNIT TABS / EP BUS | `#bar` (`sheetTabs()` or `bar()`) | docked into the SHEET/TELEMETRY title strip | as today |
| OPERATOR CONSOLE | `#cb` (`#conhead`, `#log`, `#CI`) | singleton, always present (collapsible, never closable) | all |
| TABLE ROSTER | `#mpfriends` | singleton, live table only (collapsible, not closable while linked) | when `MP.linked` |
| UNIT MIRROR | a read-only render of another sheet | **multi-instance** (max 3) | sortie |
| ACCESS ROUTER | login, pw, researchPw, mpw screens | modal singleton | before clearance |

- **Why `#con` has one window.** `#con` is one container with one `S.view`. So it is **one window whose title and module number follow the view**. Opening "COMPONENT REGISTRY" from the bay calls the existing navigation (`exec`/`login`/view switch) and doesn't create a second container. Modules that the current view can't show are disabled, with the reason on hover.
- **UNIT MIRROR.** This is the side-by-side answer:
  - It renders `sortieView()` for sheet *j* by doing `shSave()` → `shApply(S.sheets[j].d)` → capture the HTML → `shApply(current)`, all synchronously, with no `R()` and no sync.
  - It is marked `[MIRROR // READ ONLY]` and its inputs are disabled.
  - Clicking `[TAKE CONTROL]` calls the existing `shGo(j)`, so the main telemetry window switches to that unit and the mirror shows the previous one.
  - It is refreshed after each `R()` (debounced to 250ms), and only while it is visible.
  - This keeps a single live editor, so the sheet logic stays untouched.
- **Frame editor (`mpEditor()`).** It stays a mode. While `MP.editing`, the TELEMETRY window retitles to `MOD-01 // FRAME ASSEMBLY // BENCH`, the roster stays visible, and an amber `[BENCH // LIVE TABLE PAUSED]` tag sits on the title strip.

**Default layouts** (a 1600×900 reference; columns scale by ratio):
- **Host (OVERSEER, or the host of the live table):**
  - TELEMETRY: left, 58% width.
  - SHEET: right, top.
  - CONSOLE: right, bottom.
  - ROSTER: docked to the bay, expanded.
  - One UNIT MIRROR slot available.
- **Pilot:**
  - TELEMETRY: left, 62% width.
  - CONSOLE: right, full height.
  - SHEET: minimized into the bay. The pilot mostly uses the paper doll, damage and skills, which live in telemetry.
  - ROSTER: collapsed to a strip.
- **Solo roles (GUEST, MECHANIC, RESEARCH):**
  - The current two-panel arrangement as two windows: ASSEMBLY/REGISTRY and SHEET.
  - CONSOLE collapsed to a 3-line strip.

## 3. Window chrome
- **Title strip** (`.win-t`, 24px, which reuses `--ctl-h`):
  - `MOD-03 // SORTIE TELEMETRY // <unit>`.
  - A status pip, driven by the existing `shStatus()`/`igOf()`.
  - Buttons on the right: `[_]` collapse to the title strip, `[▼]` minimize to the bay, `[□]` maximize within the desktop, `[✕]` close. Close is hidden for the console and for the roster while linked.
- **Frame:**
  - The existing `.panel` border plus corner-bracket backgrounds.
  - The focused window gets `.panel.primary`, the heavy cyan brackets from 5.1. This replaces the "primary panel" rule: **focus = primary**.
  - Unfocused windows dim their title to `--muted`.
- **Status colours** use only the pinned `--c-ok`, `--c-warn`/`--c-dmg` and `--c-crit`, always with a glyph (`●`, `▲`, `✕`).
  - A window whose unit goes critical flashes its title pip once. There is no window shake.
- **Resize.** 8 handles (4 edges and 4 corners, each 6px hit area). There's a per-window minimum (SORTIE 640×420, CONSOLE 360×140, SHEET 420×300).
- **Snapping.**
  - Edges snap to the desktop edges and to other windows within 12px.
  - Dragging a title to the left or right edge snaps to a half.
  - Double-clicking the title toggles maximize.
  - Drag and resize use pointer events, and the geometry is applied with `transform` while dragging.
- **Z-order and focus.**
  - Clicking anywhere in a window raises it: z-index comes from a monotonic counter, renormalised at 1000.
  - The focused window gets `aria-current` and the heavy brackets.
- **Keyboard.** These avoid browser-reserved keys (Ctrl+W, and Alt+digit, which switches tabs on Linux).

  | Key | Action |
  |---|---|
  | `F6` / `Shift+F6` | Cycle window focus (the standard pane-cycling key) |
  | `Alt+C` | Focus the console input `#CI` |
  | `Alt+M` | Minimize the focused window |
  | `Alt+X` | Close it, where it can be closed |
  | `Alt+Enter` | Maximize / restore |
  | `Alt+Arrow` | Move 16px; with Shift, resize |
  | `Esc` on a title strip | Return focus to the window body |

## 4. Persistence (local only)
- **Storage.** The layout is stored in the existing `forge_ui_v1` object (`UI`) under `UI.desk`, saved through the existing `uiSave()`.
- **Key.** Keyed by **role profile** (`host`, `pilot`, `solo-guest`, `solo-mech`, `research`, `overseer`), so each role has its own layout:
  `UI.desk = {v:1, host:{wins:{tele:{x,y,w,h,min,max,col,z}, con:{…}}, mirrors:[uid…]}, pilot:{…}}`.
- **Values are viewport-relative fractions**, so a layout survives a resolution change.
- **Off-screen windows** are clamped back onto the desktop when the layout is restored.
- **`[RESET LAYOUT]`** sits in the Module Bay footer and in the console as `layout reset`. It deletes `UI.desk[profile]` and re-applies the defaults.
- **Fallback.** A corrupt or older `UI.desk` falls back to the defaults silently.

## 5. Multiplayer
- **Layouts are never synced.**
  - `UI` is local, and nothing in `UI.desk` goes into `pack()`/`split()` or any bridge payload.
  - Window state is never sent to `/api/forge`.
- **Always visible:**
  - **Status:** the `#sync` readout lives in the clearance header, so it's visible even when every window is minimized.
  - **Roster:** it can be collapsed to a strip but not closed while `MP.linked`, so `[HOST AWAY]` and online pips stay on screen.
  - **Crits:** a remote crit on a unit whose window is minimized lights that unit's bay slot pip `✕`, and `#sra` still announces it.
- **Mirrors:**
  - A mirror of a sheet the server redacts (another player's pilot data) shows exactly what `realSheet()` shows today. The mirror adds no data.
  - `MP.applying` re-renders refresh mirrors through the same debounced hook.

## 6. Accessibility
- **Roles.**
  - Windows are `role=region` with `aria-labelledby` set to the title.
  - The ACCESS ROUTER and changelog are `role=dialog` with `aria-modal=true`, and focus is trapped inside them.
  - The bay is a `role=toolbar` of buttons with `aria-pressed` (open) and `aria-describedby` (status).
- **Focus.**
  - Opening a window focuses its first control.
  - Closing or minimizing returns focus to the bay slot.
  - The `R()` wrapper already restores focus for `.shtl`/`.mlab`. The shell adds "last focused element per window".
- **Live regions.** `#sr`/`#sra` stay global. A window opening or closing is announced politely ("Sortie telemetry minimized").
- **Reduced motion.** There are no open/minimize animations, the crawl on mount is skipped, and drag previews stay instant.
- **Keyboard-only use.** Every pointer action (move, resize, snap) has a key equivalent (§3).
- **Contrast.** All chrome uses existing AA-checked tokens.

## 7. Technical approach (vanilla JS, no framework)
- **Size.** About 450–600 lines: one `desk.js` (classic script loaded after the bridge, `?v=1`) plus about 150 lines of CSS in a `desk.css` block.
- **Re-hosting, not rewriting.**
  - At boot, `Desk.mount(id, opts)` creates `<section class="win panel" id="w-tele">` with a title strip and a `.win-b` body.
  - It then **moves the existing node** into the body with `appendChild($('con'))`. The IDs are unchanged, so `R()`, the bridge's `ensureChrome()`/`paintFriends()` and every `$('…')` lookup keep working.
  - `main`/`#rt` become layout-free, and the desktop is `position:relative` with absolutely positioned windows.
- **Re-render hook.**
  - Wrap `R` once with the same pattern as the 5.1 `_R51`. After each render:
    - retitle windows from `S.view`/`idline()`;
    - update status pips;
    - enable or disable bay slots by role;
    - refresh visible mirrors (debounced).
  - The bridge's own `Forge.wrap` calls still work, because they use `window[name]`.
- **Console coexistence.**
  - The existing global keydown (T:1298) redirects printable keys to `#CI` whenever no field has focus. That would steal keys from a focused window.
  - Change: a window-manager capture-phase handler runs first. It handles F6 and Alt+ shortcuts, and when focus is inside a non-console window it marks the event (`e.__deskOwned`).
  - The existing handler gets a one-line guard: `if(e.__deskOwned)return`. Typing on the desktop background or in the console window still goes to `#CI` as today.
- **Performance.**
  - Geometry is changed only through `transform`/`width`/`height` on the window element, with `will-change` while dragging. A `ResizeObserver` on `.win-b` is throttled with `requestAnimationFrame`.
  - `R()` cost is unchanged, because the same innerHTML writes go to the same nodes.
  - A mirror costs one extra `sortieView()` string per refresh, only while visible.
  - Minimized windows get `content-visibility:hidden`, and their DOM is kept, so the bridge's references stay valid.
- **No change** to `S`, `pack()`, the bridge sync, or any view function body.

## 8. Phased plan

| Phase | Scope | Effort |
|---|---|---|
| **MVP** | Shell, clearance header, Module Bay, window chrome (move, resize, collapse, minimize, maximize, z-order, focus = primary), persistence and reset. Re-hosts **4 windows**: TELEMETRY/ASSEMBLY (`#con`), SHEET (`#sh`), CONSOLE (`#cb`), ROSTER (`#mpfriends`). Default layouts per role, keyboard, aria | 3–4 days |
| **P2** | Snapping and half-snap; ACCESS ROUTER as a modal; boot as a KERNEL window; title retitling for `mpEditor()` bench | 1.5–2 days |
| **P3** | UNIT MIRROR (multi-instance, read-only, take control); bay pips for minimized crits | 2 days |
| **P4** | Polish: mount crawl, theme pass across the 5 themes, wide/ultrawide default layouts, a reduced-motion audit, a screen-reader pass | 1–1.5 days |
| **QA** | Two-seat run on the real server (host and pilot), all roles, the 1366–2560px range, and the existing 5.1 regression scripts | 1 day |

**Total:** about 8.5–10.5 days.

**Risks:**
1. **Mirror state swapping.** `shApply()` on a non-current sheet could fire side effects (audio, memo caches). Mitigation: a mirror render guard that mutes `audioEvent`, clears `memo` keys after the swap, and is covered by a regression test.
2. **Code that assumes the fixed `main` grid.** Some views or CSS read `#rt` widths; for example, the paper doll's SVG sizing and sticky `.sorhead.hud`. Mitigation: per-window `container-type:inline-size` and testing each view inside a 640px window.
3. **The console key redirect** fighting window focus. This is handled by the `__deskOwned` guard, which needs a test for every input type.
4. **Bridge injections** (`#mpveil`, `#mpfriends`, `body.mp-linked` padding) assume a page layout. The shell must neutralise `body.mp-linked{padding-left}`, and the veil must stay full screen above the desktop.
5. **Scope creep.** Mirrors are the only multi-instance window, and nothing new is synced.

## 9. Mockup (ASCII)
```
┌ CORE EMPIRE // SCIENCE CORPS R+D // FORGE-OS v5.1.0 // TL8 ── CLEARANCE: IMPERIAL TALONS ── [LINK OK] [AUDIO: MUTED] [THEME] [LOGOUT] ┐
│MODULE BAY  ┌ MOD-03 // SORTIE TELEMETRY // MSH-01 / MUSHA ● [_][▼][□][✕]┐┌ MOD-04 // FRAME SHEET // MUSHA ▲ [_][▼][□][✕] ┐│
│[01] ASSEMB │ STATUS NOMINAL │ INTEGRITY 80% ▲ │ HEAT 4/12 │ LINK OK    ││ CHASSIS  ✕1 CRIT ▲1 DMG  [BRITTLE SR-1]      ││
│[02] REGIST │        ┌──┐            UTILITY [OK]                        ││ ST/HP264 DR650/325 MOVE13L/25S HND/SR+2/1     ││
│[03] TELEM ●│ HEAD   │  │ CORE [DMG] 105/264 HP                         ││ RADS 135 [ELEVATED ▲] [-5][+5]                ││
│[04] SHEET ▲│ R.ARM ─┤  ├─ L.ARM [DIS] -1/132 ✕                         │└───────────────────────────────────────────────┘│
│[05] CONSOLE│        └┬┬┘                                               │┌ MOD-05 // OPERATOR CONSOLE ── [_][▼]          ┐│
│[06] ROSTER │ IMPACT RESOLUTION  DMG [   ] DIV [1] [APPLY]  [UNDO]       ││ 08:36:04 PILOTB // MUSHA :: 2600 dmg …        ││
│  HOSTA ●   └────────────────────────────────────────────────────────────┘│ 08:36:10 [ OK ] UNDO COMPLETE (struck line)   ││
│  PILOTB ●   [MIRROR] MOD-03b // PILOTB UNIT // READ ONLY  [TAKE CONTROL]  │ CE//FORGE> _                                  ││
│[RESET LAYOUT]                                                             └───────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
There is also a static HTML mockup using the real palette: `desktop-mockup.html`, with a screenshot at `desktop-mockup.png`.
