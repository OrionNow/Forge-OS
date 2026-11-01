# FORGE-OS: UI/UX Pass 3 of 5 (based on terminal.html v5.0.1)

## Where the real file differs from passes 1 and 2
- **Fonts:** only `Consolas,"Courier New",monospace` (line 7). JetBrains Mono isn't loaded anywhere, and `#mpfriends` hardcodes `12px Consolas` in `#mpstyle`.
- **Modes:** the role skins are `body.admin` (OVERSEER) and `body.research` (RESEARCH STAFF), toggled in `R()`. There are also 5 header themes on `body[data-theme]` (navy, `sci`, `remus`, `crow`, `talon`) from `cycleTheme()`/`THEMES`, plus a separate paper-doll tint per sheet tab (`.mechmap[data-tt]` from `SH_COL`/`SH_TH`). **Talon is red**, the same hue as crit.
- **A status palette already exists:** `--c-ok --c-dmg --c-crit --c-dis --c-err --c-ovr` (line 142), `STT_COL`, and text tags from `statTag()` (`[OK] [DMG] [CRIT] [DIS] [ERR] [OVR]`). Pass 2's `--ok/--warn/--crit` should map onto these vars rather than add new ones. Bug: `--c-ok` is `var(--hpok,var(--ac))`, so it changes with the theme.
- **Gauges aren't segmented.** `.hpbar/.hpfill` (animated by `animateHpBars()`) already shows the exact `v/m HP` in `.hv`. `.heatbar` has its own `.hbt` "HEAT h/cap" text and hatching for `.dz` and `.full`. The EP bar `bar()` hardcodes `#fd5/#f65` inline.
- **Damage isn't box tracks.** Each location is a numeric HP pool. Hits are resolved in `.damagebox` (DMG/DIV/REAR/GAP), which calls `applyDmg()`. Box rows like `■■■□□` don't fit large HP values, so the pass 2 "ledger" becomes a **hit ledger** (a list of events), not boxes.
- **Undo is local and destructive.** `pushUndo(l)` saves a full JSON snapshot of `S.tel` (capped at 40). `undoLast()` pops it and restores the snapshot. It's only reachable through the `undo` console command in `exec()`. There's no button.
- **The log is a display only.** `say()` → `MQ` → `type()` writes into `#log`, trimmed to `LOGCAP=160`. Lines have no timestamp or actor, `heartbeat()` mixes in chatter (`.hbln`), and `clearLog()` wipes everything.
- **Sync isn't in this file.** There's no WebSocket or peer code. Multiplayer lives in the external `mp-bridge.js?v=14` and `forge-hook.js?v=6`, which weren't provided. In-file pieces: `#mpfriends` sidebar (`.mprow`, `.host`, `.dark`, `.onl`), `#mpassign`, `#mptint`, the `mpw` callsign view with `mpAuth()` and `forge_mp_callsign`, and `body.mp-linked{padding-left:210px}`, which has **no mobile breakpoint**. "ISB LINK `[||||]`" (`.lnk`) in `sortieView()` is decoration only.
- **Sections aren't `<details>`.** They use `shHead(k,t,x)`/`shTog(k)`/`shOpen(k)`, which save state to `UI.sh` (`forge_ui_v1`). They're clickable divs, so they don't work from the keyboard. `<details>` is only used in the catalog editor (`details.cesec`).
- **A boot sequence and audio already exist.** `seqFor(first)`, `bar_()`, and the typing effect from `crawl()`/`type()` play at startup, can be skipped with any key or mouse press, and `bootJingle()` plays a jingle. Audio starts **on** (`audioMuted=false`) and the setting isn't saved.
- **Corner brackets are on every `.panel`** (8 gradients, line 98).
- **Accessibility:** there is no `aria-live` anywhere. Only `#toast` has `role=status`. Paper-doll zones are `<g class=mz onclick>` and `div.mlab onclick`, which can't be reached by keyboard.
- **Global keydown (line 1227)** sends every printable key to the console `#CI`. A `/` shortcut has to be handled before that.
- **Glyphs in use today:** only `▲ ▼` (`\u25b2/\u25bc` in `tgtNoteInner()` chips) and `·`. Everything else in the UI is ASCII brackets (`[APPLY]`, `[-]`, `[ OK ]`).

---

## Decisions on the critic's notes

**1. Undo is shared and adds to history instead of deleting it.**
- Replace the snapshot stack with an event list `S.ev=[{id,ts,actor,sheet,loc,kind,field,before,after,undoneBy}]`. `pushUndo()` becomes `emit(kind,field,before,after)`.
- `undoLast()` now **adds an inverse event** instead of restoring a whole snapshot. Restoring a snapshot would overwrite other players' newer edits.
- Log line: `14:03 RAVEN L.ARM +2 UNDO (by HOST) ↺#17`. The original line stays and gets `.ev.undone{text-decoration:line-through;opacity:.7}`.
- Rights: anyone can undo their own events, and the host can undo anyone's. If the field has changed since the event, the undo goes through the conflict flow below.
- Add an `[UNDO]` button next to `#dm_apply` in `.damagebox`, and keep the `undo` console command. The event list lives in shared state, separate from the `#log` DOM, so `clearLog()` and `LOGCAP` don't touch it.

**2. Conflicts from queued offline edits: merge automatically, and prompt only on same-field collisions.**
- **Delta fields** (HP from `applyDmg`/`repairComp`, heat from `heatAdd`/`heatVent`, ammo from `setAmmo`) replay as deltas and add up. Two hits on the same arm both count, with no prompt.
- **Set fields** (name, skill inputs, mounts via `setMount`/`setHardpoint`, loadout) compare the queued `before` with the current server value. If they match, the edit applies silently. If they differ, a CONFLICT card shows `[KEEP MINE] [ACCEPT THEIRS]`.
- **Both players pick KEEP MINE:** the host decides. If no host is online, the last writer by server receive order wins, and both values are logged (`CONFLICT L.ARM MOUNT: RAVEN=AC/5 vs KITE=LRM ⇒ LRM (LWW)`).
- Why: deltas never truly conflict, and prompting for every queued edit would flood players after a reconnect.

**3. Collapsed sections keep their status badges.** Extend `shHead(k,t,x)` with a badge count, for example `crit=locs().filter((_,i)=>statKey(t,i)=='crit').length`, plus disabled weapons via `wDisabled()`:
```css
.shh{display:flex;width:100%;background:var(--panel);border:0;border-bottom:1px solid var(--line);padding:var(--sp1) var(--sp2);text-transform:uppercase;letter-spacing:.1em;font:inherit;color:var(--cyan);text-align:left}
.shh:focus-visible{outline:2px solid var(--cyan);outline-offset:-2px}
.shb{margin-left:var(--sp2);font-weight:bold}.shb.warn{color:var(--c-dmg)}.shb.crit{color:var(--c-crit)}
```
- Render it as `<button class="sec secrow shh" aria-expanded="${shOpen(k)}" aria-controls="sec-${k}">`, with the badge as `<span class="shb crit">✕2 CRIT</span>`. Badges show in both open and collapsed states.
- Rename COMPACT/FULL to **SUMMARY / FULL READOUT**. Keep the existing `[-]`/`[+]` markers.

**4. Sticky search only inside the catalog.** `list()` and `catalogView()` render `<div class=catalog-head><input id=catq placeholder="> SEARCH_" aria-label="search catalogue"></div>`:
```css
#con .catalog-head{position:sticky;top:0;z-index:2;background:var(--bg);padding:var(--sp1) 0;border-bottom:1px dashed var(--line)}
```
- `#con` is already the scroll container (`overflow-y:auto`), so sticky stays inside the catalog panel.
- In the line 1227 handler, add this first: `if(e.key=='/'&&['catalog','catalogEdit','chassis'].includes(S.view)&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();$('catq').focus();return}`.
- In other views, and whenever a field has focus, `/` keeps reaching the console as it does today.

**5. Font check (glyph tables tested with fontTools).**

| glyph | JetBrains Mono | DejaVu Sans Mono | Liberation Mono | IBM Plex Mono |
|---|---|---|---|---|
| ▲ ▼ ■ □ ● ○ | Y | Y | Y | **no** |
| ✖ | no (✕ yes) | Y | no | no |
| ✎ | **no** | Y | no | no |
| ↶ ↺ | **no** | Y | no | Y |
| ◐ | **no** | Y | Y | no |
| ⚠ → · | Y | Y | partial | partial |

- Consolas is proprietary, so I couldn't test it. I wouldn't count on it having ✎, ↶ or ✖.
- **Stack:** `font-family:"JetBrains Mono",Consolas,"DejaVu Sans Mono","Courier New",monospace`, with JetBrains Mono Regular and Bold self-hosted via `@font-face` (`font-display:swap`). Without that it never loads.
- **Remove IBM Plex Mono from the pass 1 stack.** It's missing ▲, ■ and ●.
- Change `#mpfriends` to `font:var(--fs-l)/1.35 inherit`.
- **Glyph swaps:** ✖ → **✕**. ✎ → `[ED]`. ↶ → `[UNDO]`. ◐ is dropped: LAG uses `●` in `--c-dmg` plus the text `LAG`. These ASCII brackets match the existing `[APPLY]`/`[ OK ]` style, which keeps the setting's look.

**6. Ship order:** Batch A first (status colors/gauges, sync, damage/hit ledger with undo and conflict), then Batch B (SUMMARY/FULL READOUT and catalog search), then the pass 3 items below. Full order at the end.

---

## Pass 3 improvements

**1. A real link readout and presence instead of decorative `.lnk`, plus a mobile `#mpfriends`.** Replace `ISB LINK <b class=lnk>[||||]</b>` in `sortieView()`'s `.sorhead` with `<b id=sync class=lnk data-s=ok role=status>`, set by `mp-bridge.js`.
```css
#sync[data-s=ok]{color:var(--c-ok)}#sync[data-s=lag]{color:var(--c-dmg)}#sync[data-s=off],#sync[data-s=err],#sync[data-s=conf]{color:var(--c-crit);animation:none}
.mlab[data-ed]::after,.stab[data-ed]::after{content:" [ED " attr(data-ed) "]";color:var(--ed-tint,var(--cyan));font-size:var(--fs-d)}
.mlab[data-ed]{outline:1px dashed var(--ed-tint,var(--c-warn))}
@media(max-width:900px){body.mp-linked,body.mp-linked.mp-friends-min{padding-left:0}
 #mpfriends{position:sticky;top:0;width:auto;max-height:none;display:flex;gap:6px;overflow-x:auto;border-right:0;border-bottom:1px solid var(--line);padding:2px 8px}
 #mpfriends .mprow{border:0;padding:0;white-space:nowrap}}
```
- Text states: `[LINK OK]`, `[LINK LAG 820ms]`, `[OFFLINE · 3 QUEUED]`, `[LINK ERR]`, `[CONFLICT ×1]`.
- Editing chips use each player's existing `mpTint` color through `--ed-tint`. They only warn (no lock).
- Why: the slot and the setting's look are already there, and the fixed 210px sidebar currently eats a phone screen.

**2. A paper doll that works with the keyboard and screen readers.**
- In `mechMap()`, `vehMap()`, and the `tile()` helper, give every `.mz` and `.mlab`: `tabindex=0 role=button aria-label="${dn(n)} ${v}/${m} HP ${statKey} DR ${armorOf(n)}" aria-pressed="${i===sel}"`.
- One delegated keydown handler on `.mechmap`: Enter/Space calls `selectDamageTarget(i)`, and arrow keys move through `locs()`.
```css
.mz:focus-visible{outline:none;stroke:#ffb400!important;stroke-width:3px!important}
.mlab:focus-visible{outline:2px solid #ffb400;outline-offset:1px}
.mlab.hit[data-by]::before{content:attr(data-by)" ";color:var(--c-crit);font-size:var(--fs-d)}
```
- Hits from another player get `data-by="KITE"` for one `lhit` cycle, so everyone sees who hit what.
- After selection, focus moves to `#dmgIn`, the same field `focusDefault()` already uses.

**3. Live announcements and focus fixes.**
- Add `<div id=sr class=sr-only aria-live=polite></div><div id=sra class=sr-only aria-live=assertive></div>`.
- `applyDmg()`, the undo event, and sync changes write one summary line: `"Left arm 3 of 20, critical"`.
- CRIT, a new CONFLICT, and stability checks from `stabBox()` go to `#sra`. Everything else goes to the polite region.
- `#log` gets `role=log aria-live=off`. Its typed-out `crawl()` text would otherwise be read letter by letter.
```css
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
```
- `#clog` (changelog) gets `role=dialog aria-modal=true`, and Escape closes it via `openLog()`.
- The line 1227 handler skips its jump to the console when `#clog` is open or the CONFLICT card is open.

**4. Motion and sound safeguards (refining what's already there).**
- **Audio off by default and saved:** `audioMuted=UI.audio!==1`. `toggleMute()` calls `uiSave()`. The button starts as `[AUDIO: OFF]`.
- **Boot sequence:** `seqFor(first)` plays the full sequence once per session (`sessionStorage.forgeBooted`). Later loads get a single line, `FORGE-OS vX KERNEL ONLINE`. Show `[ANY KEY TO SKIP]` in `#hint` while `busy`.
- **Reduced motion:** when `noMotion()` is true, `crawl()` resolves instantly (set `skip=1`) and `hvAnim()` returns early.
- **Close the CSS gaps the line 96 and 131 rules miss:**
```css
@media(prefers-reduced-motion:reduce){.blink,.hpbar i,.heatbar i,.lockbox .hpbar i{animation:none!important;transition:none!important}}
.stt-crit,.mz.zs-crit{animation-iteration-count:3}
```
- Why: the crit pulse and blink run forever today. Three cycles meets the pass 2 note, and the `[CRIT]` text from `statTag()` still carries the meaning after the pulse stops.

**5. Sheet hierarchy: one main readout, pinned status colors.**
```css
.panel{background-image:none}.panel.primary{background-image:/* the existing 8-gradient brackets from line 98 */}
:root,body[data-theme],.mechmap[data-tt]{--c-ok:#3fdc7f;--c-dmg:#ff9a1f;--c-crit:#ff3b3b}
.sorhead{position:sticky;top:0;z-index:3;background:var(--bg);padding:var(--sp1) 0;border-bottom:1px solid var(--line);font-size:var(--fs-e)}
.sorhead b{font-size:var(--fs-e)}
```
- Mark `#sh` in sortie view, plus the `.sorhead` and doll block, as `.panel.primary`. Remove the brackets from `#con`, `#cb`, and the `#bar` wrappers.
- In `bar()`, replace the inline `#fd5/#f65` with `var(--c-dmg)/var(--c-crit)` and add a text cue: `EQUIPMENT LOAD 41/40 EP ✕ OVER`.
- `--hpok` can still tint the doll's fill, but the `[OK]` text uses the pinned `--c-ok`.
- Why: pinned colors keep the red Talon theme from being confused with crit. A sticky STATUS/INTEGRITY line keeps the readout visible while you scroll the loadout.

---

## Implementation order
1. **A1:** Pin the `--c-*` status colors, update `bar()`, cap animations at 3 cycles, and add the font stack with `@font-face`. This only touches CSS and small markup, so it's low risk.
2. **A2:** Replace `pushUndo`/`undoLast` with the `S.ev` event model and add the `[UNDO]` button and hit-ledger rendering.
3. **A3:** Sync: `#sync` states, the queue, the delta-vs-set merge, and the CONFLICT card. This **needs `mp-bridge.js` and `forge-hook.js`**.
4. **B1:** Accessible `shHead` buttons, badges, and the SUMMARY / FULL READOUT toggle.
5. **B2:** `.catalog-head` search in `list()`/`catalogView()` and the `/` shortcut.
6. **C:** Live regions and paper-doll keyboard support (#2, #3), then the mobile `#mpfriends` and presence (#1), then motion and audio (#4) and hierarchy (#5).
