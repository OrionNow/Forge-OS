# FORGE-OS: UI/UX Pass 3 (based on terminal.html v5.0.1, mp-bridge.js v14, forge-hook.js v6)

> **Update 2026-10-26.** The risks below were checked against the real server (`src/lib/forge/room.server.ts`). All nine are real. See "Confirmed against the server" at the end. A3 (path patches, the CONFLICT card, the `focus` echo) was dropped from scope. Mobile is out of scope.

## Where the real file differs from passes 1 and 2
- **Fonts:** only `Consolas,"Courier New",monospace` (line 7). JetBrains Mono isn't loaded anywhere, and `#mpfriends` hardcodes `12px Consolas` in `#mpstyle`.
- **Modes:** the role skins are `body.admin` (OVERSEER) and `body.research` (RESEARCH STAFF), toggled in `R()`. There are also 5 header themes on `body[data-theme]` (navy, `sci`, `remus`, `crow`, `talon`) from `cycleTheme()`/`THEMES`, plus a separate paper-doll tint per sheet tab (`.mechmap[data-tt]` from `SH_COL`/`SH_TH`). **Talon is red**, the same hue as crit.
- **A status palette already exists:** `--c-ok --c-dmg --c-crit --c-dis --c-err --c-ovr` (line 142), `STT_COL`, and text tags from `statTag()` (`[OK] [DMG] [CRIT] [DIS] [ERR] [OVR]`). Pass 2's `--ok/--warn/--crit` should map onto these vars rather than add new ones. Bug: `--c-ok` is `var(--hpok,var(--ac))`, so it changes with the theme.
- **Gauges aren't segmented.** `.hpbar/.hpfill` (animated by `animateHpBars()`) already shows the exact `v/m HP` in `.hv`. `.heatbar` has its own `.hbt` "HEAT h/cap" text and hatching for `.dz` and `.full`. The EP bar `bar()` hardcodes `#fd5/#f65` inline.
- **Damage isn't box tracks.** Each location is a numeric HP pool. Hits are resolved in `.damagebox` (DMG/DIV/REAR/GAP), which calls `applyDmg()`. Box rows like `■■■□□` don't fit large HP values, so the pass 2 "ledger" becomes a **hit ledger** (a list of events), not boxes.
- **Undo is shared, but it rolls back the whole snapshot.** `pushUndo(l)` saves a full JSON snapshot of `S.tel` (capped at 40), and `undoLast()` pops it and restores it. In multiplayer, the `undo` stack is part of each sheet's synced state (`split()` in mp-bridge.js). The bridge also lets **anyone** undo on **any** sheet ("DAMAGE AND UNDO STAY OPEN" in `deny()`). Its `undoLast` wrap adds the sheet to `MP.forceState`, and `buildPush()` then pushes the restored *whole* `tel` even for sheets the player doesn't own. The `[UNDO]` button is injected by the bridge's `sortieView` wrap. It isn't in terminal.html.
- **The log is display-only on each client.** `say()` → `MQ` → `type()` writes into `#log` (`LOGCAP=160`). In multiplayer, `Forge.wrapSay` matches "synced" lines by regex (`UNDO |REPAIR|HEAT |DAMAGE |…`). Each one is sent as raw HTML in `MP.logs` with a `nonce`, and the server returns it in a numbered `rolls` feed. `drainRolls()` → `speakRemote()` adds each line with `innerHTML`, prefixed by `rollPrefix()` (callsign // unit). Late joiners skip earlier lines (`catchup = !MP.heard`), so there is no shared history. `clearLog()` and `clear` are wrapped by `broadcastClear()`, which **wipes everyone's console** (`clearSeq`).
- **Sync is HTTP polling, not WebSocket or peer.** `mp-bridge.js` POSTs to `/api/forge` (`api()`) with these operations: `enter`, `resume`, `poll`, `push`. `loop()` runs `flush()` and then `poll()` every **450ms** when online and every **900ms** after an error. Changes use a revision check: `push` sends `baseRevision`, and the server answers **409 + snapshot** if that revision is out of date. The server code isn't in these files. `forge-hook.js` only exposes terminal globals as `window.Forge` (`state`, `save`=`shSave`, `apply`=`shApply`, `render`=`R`, `tel`, `locs`, `wrap`, `wrapSay`, …). The bridge then **monkey-patches** about 35 terminal functions (`R`, `applyDmg`, `undoLast`, `sortieView`, `sheetTabs`, `realSheet`, `out`, and the edit actions through `guard()`). `#mpfriends` is created by the bridge (`paintFriends()`, CSS in `ensureChrome()`). `body.mp-linked{padding-left:210px}` still has **no mobile breakpoint**. The "ISB LINK `[||||]`" (`.lnk`) in `sortieView()` is decoration only. The real link text is `syncHtml()` (`SYNC` / `LINK DOWN` / `LOCAL`), shown in `#who .mpsync` and the `.mph` header.
- **Sections aren't `<details>`.** They use `shHead(k,t,x)`/`shTog(k)`/`shOpen(k)`, which save state to `UI.sh` (`forge_ui_v1`). They're clickable divs, so they don't work from the keyboard. `<details>` is only used in the catalog editor (`details.cesec`).
- **A boot sequence and audio already exist.** `seqFor(first)`, `bar_()`, and the typing effect from `crawl()`/`type()` play at startup, can be skipped with any key or mouse press, and `bootJingle()` plays a jingle. Audio starts **on** (`audioMuted=false`) and the setting isn't saved.
- **Corner brackets are on every `.panel`** (8 gradients, line 98).
- **Accessibility:** there is no `aria-live` anywhere. Only `#toast` has `role=status`. Paper-doll zones are `<g class=mz onclick>` and `div.mlab onclick`, which can't be reached by keyboard.
- **Global keydown (line 1227)** sends every printable key to the console `#CI`. A `/` shortcut has to be handled before that.
- **Glyphs in use today:** only `▲ ▼` (`\u25b2/\u25bc` in `tgtNoteInner()` chips) and `·`. Everything else in the UI is ASCII brackets (`[APPLY]`, `[-]`, `[ OK ]`).

---

## Decisions on the critic's notes

**1. Undo is shared and adds to history instead of deleting it.** *(Decision kept. The real code changes how it's built.)*
- What exists now: one undo stack per sheet that the whole table shares, which anyone can pop. Popping restores a full `tel` snapshot that is pushed through `MP.forceState`. **This can erase another player's later hit** (see risk R3).
- New approach: undo becomes an **inverse impact**. The bridge already sends hits as additive deltas. `applyDmg` wrap → `MP.impacts.push({uid,loc,delta,floor,sacInc,undo,stab})`, and the server merges them.
  - Give every impact an `id` and an `actor`, and echo them back in the `rolls` feed as a structured `ev` (`{id,seq,ts,actor,uid,loc,kind,delta}`).
  - `undoLast()` sends `{kind:'undo',of:id,delta:-orig.delta,sacInc:-orig.sacInc}` through `MP.impacts`. Remove the `MP.forceState.add(uid)` line from the `undoLast` wrap.
- **Extend impacts to the other `tel` changes** that today go through whole-`tel` `states`: `repairComp`/`repairAll` (`hp`), `heatAdd`/`heatVent` (`field:'heat'`), and `setAmmo`/`reloadW` (`field:'ammo'`). After that, none of these edits overwrite each other, and each one can be undone on its own.
- Remove the snapshot arrays from the payload. Today `d.undo` holds up to 40 full `tel` copies, and each impact can carry up to 40KB (`undo.t.slice(0,40000)`).
- Log line: `14:03 RAVEN L.ARM +2 UNDO (by HOST) ↺#17`. The original line is matched by `ev.id` and gets `.ev.undone{text-decoration:line-through;opacity:.7}`.
- Rights: keep the current "anyone can damage and undo" rule (the bridge's `deny()` text promises it). Add a guard: **a player can undo their own events, and the host can undo anyone's**. Undoing an event that a later event depends on (e.g. a repair after the hit) asks for confirmation.
- Shared history: the server keeps the last N `ev` entries. On first poll, `drainRolls()` shows them with `speakRemote(...,silent)` instead of skipping them.
- `broadcastClear()` becomes **local-only for players and table-wide only for the host**. A clear hides lines but never deletes events.

**2. Conflicts from queued edits: merge automatically, and prompt only on same-field collisions.** *(Decision kept. The code changes how it's built.)*
- **What the bridge does today:**
  - The only "queue" is in memory: `MP.impacts` and `MP.logs`, plus whatever local state differs from `MP.shadow`. **It's lost on reload.**
  - On a 409, `pushOnce()` → `applyRemote(err.conflict)` → `rebase(payload)` and retries up to 5 times. `rebase()` only re-applies edits for the **host**. A **player's** pending `rests`/`states` are overwritten by the server snapshot and are **silently lost** (R1).
  - After 5 failed tries, `MP.impacts=[]; MP.logs=[]`, so **queued hits are silently thrown away** (R4).
  - `rests` sends the *entire* non-`tel` blob (`split().rest`: pilot, items, mounts…), and `rebase()` merges it with `Object.assign(sh.d, r.rest)`. So different-field edits by the host and the owner **overwrite each other** (R2).
- **Rule:**
  - *Delta fields* (hp/heat/ammo/plating via impacts) never prompt. The server adds them up, and two hits on one arm both count.
  - *Set fields:* replace `rests` with **path patches** `{uid,path:'pilot.pil',before,after}`, computed by diffing `split(sh.d).rest` against `MP.shadow`. The server applies a patch if `current===before`. Otherwise it returns `conflicts[]` in the 409, and only those produce a CONFLICT card `[KEEP MINE] [ACCEPT THEIRS]`.
  - Only the host and the sheet owner can write a sheet's set fields (`locked()`/`guard()`). So a collision is always **host vs owner**, which makes the tie-break simple.
- **Tie-break when both pick KEEP MINE:** the host's value wins, since the host is always one of the two writers. If `MP.hostOnline` is false, the last write by server receive order wins, and both values are logged (`CONFLICT RAVEN pilot.pil: HOST=12 vs RAVEN=13 ⇒ 13 (LWW)`).
- **Persist the queue:** mirror `MP.impacts` and pending patches to `localStorage` under `forge_mp_q_<selfId>`. Give each entry an `id` so the server can drop duplicates. Never drop entries silently. After the retry limit, keep them and show `[CONFLICT ×n]` or `[OFFLINE · n QUEUED]`.

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

**6. Ship order:** Batch A first. It now starts with **A0, the bridge fixes R1–R6** (the code forced this addition). Then come status colors/gauges, sync, and the damage/hit ledger with undo and conflict, then Batch B (SUMMARY/FULL READOUT and catalog search), then the pass 3 items below. Full order at the end.

---

## Pass 3 improvements

**1. A real link readout and presence instead of decorative `.lnk`, plus a mobile `#mpfriends`.**
- **Sources for each state:** the bridge has no ping and no latency data, so the states are derived from what `loop()` already tracks:
  - `MP.status` can be `"online"`, `"offline"`, `"ended"` (404), or `"rejected"` (403). `MP.error` holds the message.
  - Measure latency as `performance.now()` around `await poll()` and keep a moving average in `MP.rtt`.
  - OK = online with `rtt<600ms`. LAG = online with `rtt≥600ms`, or the first failure. OFFLINE = `"offline"` (still retrying every 900ms), with the count of `MP.impacts` plus pending patches.
  - ERROR = `"ended"` or `"rejected"`. `loop()` stops here and **doesn't reconnect** (R6). CONFLICT = `MP.conflictTries>0` or unresolved `conflicts[]`. Also show HOST AWAY when `!MP.hostOnline`.
- **Where to change it:** extend `syncHtml()` in mp-bridge.js, which is already rendered by `markSync()` into `#who .mpsync` and by `paintFriends()` into the `.mph` header. The bridge's `sortieView` wrap replaces the decorative `<b class=lnk>[||||]</b>` with `<b id=sync data-s=${state} role=status>`. Text states: `[LINK OK]`, `[LINK LAG 820ms]`, `[OFFLINE · 3 QUEUED]`, `[LINK ERR // RE-AUTH]`, `[CONFLICT ×1]`.
- **Presence today:** `members[]` contains `{id,callsign,role,online,place,color}`. `place` comes from `myPlace()` (Sortie, Service Bay, R+D Archive, …) and is sent on each `poll`. Name colors come from `mpTint`/`memberHex`. **There is no editing signal.** `isTyping()` is local only, and `MP.editing` means "off in the frame editor bench" (`mpEditor`), not field focus.
- **Proposed editing signal:**
  - Add `focus:{uid,field}` to the `poll` body (derived from `isTyping()` plus a `data-f` attribute on inputs), and have the server echo it on members.
  - Render it with `.mlab[data-ed]` / `.stab[data-ed]` (`[ED RAVEN]`) in `memberColor()`, and show `[ED]` in the editor's `.mprow`.
  - Warn only. A hard lock already exists at sheet level (`locked()` / `guard()`: only the owner and host can edit), so a field lock only matters between host and owner. Make it a host toggle.
```css
#sync[data-s=ok]{color:var(--c-ok)}#sync[data-s=lag]{color:var(--c-dmg)}#sync[data-s=off],#sync[data-s=err],#sync[data-s=conf]{color:var(--c-crit);animation:none}
.mlab[data-ed]::after,.stab[data-ed]::after{content:" [ED " attr(data-ed) "]";color:var(--ed-tint,var(--cyan));font-size:var(--fs-d)}
.mlab[data-ed]{outline:1px dashed var(--ed-tint,var(--c-warn))}
@media(max-width:900px){body.mp-linked,body.mp-linked.mp-friends-min{padding-left:0}
 #mpfriends,#mpfriends.min{position:sticky;top:0;width:auto;max-height:none;display:flex;align-items:center;gap:8px;overflow-x:auto;border-right:0;border-bottom:1px solid var(--line);padding:2px 8px}
 #mpfriends .mph{margin:0}#mpfriends .mpbody{display:flex;gap:8px}
 #mpfriends .mprow{border:0;padding:0;white-space:nowrap}#mpfriends .mprow>div{display:inline;margin-left:4px}}
```
- **Where the CSS goes:** add it to terminal.html's inline `<style id="mpstyle">`. `ensureChrome()` returns early when `#mpstyle` already exists, so the copy in mp-bridge.js never runs while the inline one is there. **Keep only one copy** so they can't drift apart.
- `paintFriends()` appends the `<aside>` to the end of `<body>`. For a sticky top strip it should be inserted before `#wrap` (`document.body.prepend(box)`).

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
- `applyDmg()`, the undo event, sync changes, and **remote hits arriving through `drainRolls()`** write one summary line: `"Left arm 3 of 20, critical"`.
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
1. **A0 (bridge fixes, before any UI work):** R1, R3, R4 and R5 below. Without them, the new sync and undo UI would display state that's already wrong.
2. **A1:** Pin the `--c-*` status colors, update `bar()`, cap animations at 3 cycles, and add the font stack with `@font-face`. CSS and small markup only.
3. **A2:** Turn heat, repair and ammo changes into impacts, make undo an inverse impact with `ev` ids in the `rolls` feed, and add the struck-through hit ledger. **Needs a server change.**
4. **A3:** `syncHtml()` states plus `MP.rtt`, `#sync` in the sortie header, the persistent queue, path patches with the CONFLICT card, and re-auth after ERROR. **Needs a server change.**
5. **B1:** Accessible `shHead` buttons, badges, and the SUMMARY / FULL READOUT toggle.
6. **B2:** `.catalog-head` search in `list()`/`catalogView()` and the `/` shortcut.
7. **C:** Live regions and paper-doll keyboard support (#2, #3), then the mobile `#mpfriends` and the `focus` presence signal (#1, server echo needed), then motion and audio (#4) and hierarchy (#5).

---

## Multiplayer code: bugs and risks (read from the code; `/api/forge` server not seen)
- **R1. Player edits are lost on 409.** `rebase()` returns early for players (`if (MP.role !== "host") return`). After `applyRemote()` replaces their sheet with the server snapshot, the retried `buildPush()` finds no difference, so their skill, loadout and heat edits disappear without any message.
- **R2. Whole-blob overwrites between host and owner.** `rests` sends all non-`tel` data, and the host's `rebase()` runs `Object.assign(sh.d, r.rest)`. If the host and the owner edit different pilot fields at about the same time, the host's stale copy overwrites the owner's change. `states` sends the whole `tel` in the same way, so a heat change can overwrite a just-merged hit from the owner when there's no 409.
- **R3. Undo from a non-owner overwrites the whole sheet.** The `undoLast` wrap adds to `forceState`, so `buildPush()` sends the restored snapshot `tel` for a sheet the player doesn't own. Any hits that landed after the snapshot, including other players' hits, are reverted.
- **R4. Hits are dropped silently.** After 5 failed 409 retries (`MP.conflictTries > 4`), `MP.impacts=[]` and `MP.logs=[]`.
- **R5. Returning from the frame editor can revert the table.**
  - `mpEditor()` copies the sheets into `MP.bench` and sets `MP.on=false`. During that time, `poll()` keeps advancing `MP.rev` (`!MP.on` branch), but `MP.shadow` stays the same.
  - On return, `S.sheets = bench.sheets` (stale), and the next push sends stale `tel`/`rest` for every sheet the user can write (for the host, that's every sheet) with a *current* `baseRevision`. No 409 fires, so **every hit taken while the editor was open is silently reverted**.
  - Fix: on return, merge the edited sheet into the latest shadow instead of restoring the bench. Likely; worth verifying against the server.
- **R6. The link gets stuck after ERROR.** When `loop()` sees `ended` or `rejected`, it returns without clearing `MP.timer` or `MP.on`. `mpAuth()` then returns at `if (MP.busy || MP.on)`, and `startLink()` won't restart because of `if (!MP.timer)`. Only a reload recovers. There's also no backoff (fixed 900ms) and no `visibilitychange` pause, so hidden tabs keep polling every 450ms.
- **R7. Remote HTML injection.** Log lines travel as raw HTML (`line.html = s`) and other clients render them with `innerHTML` in `speakRemote()`. A member with a modified client could run script on everyone's screen. Fix: send structured `ev` data, render it with `esc()` on the client, or sanitize on the server.
- **R8. Payload size.** Snapshots contain `d.undo` (up to 40 full `tel` JSON copies per sheet) plus the impact `undo` (up to 40KB each, 12 per push), and that runs at a 450ms cadence. Moving to `ev` ids removes most of it.
- **R9. Clear wipes everyone's console.** `broadcastClear()` on any player's `clear` wipes all consoles, which conflicts with append-only history (fixed in decision 1).
- **Minor:**
  - ~~The mp CSS exists twice; `<body class="mp-linked">` is hardcoded.~~ Withdrawn: these came from the saved v5.0.2 page snapshot. The deployed `public/terminal.html` has neither, and `ensureChrome()` injects the CSS once.
  - `connectQuiet()` takes a seat as "USER UNKNOWN" for every visitor, even on the login screen, so everyone shows up in the roster.
  - `report()` posts status to `window.parent`. Any embedding page can read the sync state there for free.


---

## Confirmed against the server (room.server.ts, migrations/0002_forge_rooms.sql)
- **Revisions.** There is one room-wide `revision` (a `bigint` on `forge_rooms`), and each successful commit adds 1 (`update ... where revision = $base`). Each sheet also carries `rev`, which is bumped on every write but not used for gating. Poll returns the snapshot when `since !== revision`.
- **409 shape.** `{error:"conflict", ok, code, revision, changed:true, snapshot, rolls (since rollSeq), rollSeq, members, roster, hostOnline, you}`. The status is 409 on a stale `baseRevision` for **any** push on the first attempt, including impact-only pushes (S:763). A second 409, `{error:"link busy, retry"}` with no snapshot, is sent after 8 commit races.
- **Log feed.** `rolls` are `{seq, id, ts, actorId, actor, uid, unit, tone, html, nonce, color}`, capped at 200, and the envelope sends 80 since `rollSeq`. `html` passes through a regex filter. **There are no ev ids, no `conflicts[]` and no `focus` echo.** zod strips unknown keys, so new client fields are ignored harmlessly.
- **Roles and locks.** The first seat to `enter` room `TABLE` becomes the host. `canWrite` = host or owner, and it applies only to `rests`.
  - **Allowed from any seat:** `states` (whole tel/undo/stab), `impacts` and `logs` on any visible sheet; `order`; `clear`.
  - **Restricted:** `meta` is host-only. A player may upsert one owned sheet. `drops` is limited to owner or host.
- **Seats.** `PEER_CAP 8`. `leave` is a read and never deletes a seat. `connectQuiet()` enters as "USER UNKNOWN" for every visitor, so the table fills up and then returns 403 for good (**R10, new**).
- **R7 proof.** The regex `<\/?([a-zA-Z0-9]+)([^>]*)>` never sees an unterminated tag. `"HIT <img src=x onerror=alert(1) "` comes back unchanged, and the client's closing `</span>` completes the `img` tag.
- **Undo.** `impactSchema.sacInc` is `min(0)`, so an undo that returns plating uses gets a 400 and the bridge resends it forever. There is no way to pop an undo entry.

Fix status: see CHANGELOG.md. Server half: `out/server/room.server.ts`.
