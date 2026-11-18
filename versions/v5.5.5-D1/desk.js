/* FORGE-OS v5.5.5-D1 desktop shell (approved Overseer spec, feedback/v555-d1/SPEC.md).
   Classic script loaded after mp-bridge.js and the 5.5.3 UI script. Game logic, sync and server are unchanged:
   the shell re-hosts the engine's own containers (#bar, #con, #sh, #cb) and renders every open unit itself.
   All units are live: each unit window is rendered on every R() from its own sheet data. The unit the user last
   touched is "routed" (S.cur): its content sits in the light DOM with the real ids, so every engine handler, guard and
   bridge rule works unchanged; every other unit's content sits in a shadow root (same markup, same styles, ids scoped)
   and moves to the light DOM on the first pointer or focus touch. Rolling/editing permissions stay with the engine and
   bridge guards (host or the sheet's owner). Fallback: ?classic or Settings > CLASSIC LAYOUT. */
(function () {
  "use strict";
  const BUILD = "5.5.5-D1";
  const LS = "forge_desk_d1";
  const $ = (id) => document.getElementById(id);
  let P = {};
  try { P = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { P = {}; }
  if (typeof P !== "object" || !P) P = {};
  P.scale = +P.scale || 1; if (P.snap == null) P.snap = true;
  if (!Array.isArray(P.wins)) P.wins = []; if (!P.slots || typeof P.slots !== "object") P.slots = {};
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(P)); } catch (e) { /* private mode */ } };
  const qs = new URLSearchParams(location.search);
  const classic = qs.has("classic") || window.FORGE_CLASSIC === 1 || P.classic === true;
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const wsN = +(qs.get("ws") || 0);
  if (wsN && window.parent !== window) { // a workstation window on the desktop: its own engine, signed in to one function
    window.Desk = { on: false, build: BUILD, ws: wsN };
    document.documentElement.classList.add("dk-ws");
    const st = document.createElement("style"); st.textContent = "html.dk-ws #cb{display:none!important}"; document.head.appendChild(st); // the desktop has one console
    const go = () => { try { if (S.view === "login") login(wsN); } catch (e) { try { parent.Desk.wsFault(window, "sign-in failed: " + (e && e.message || e)); } catch (_) { /* ok */ } } };
    const tell = () => { try { parent.Desk && parent.Desk.wsPing && parent.Desk.wsPing(window); } catch (e) { /* ok */ } };
    if (typeof R === "function") { const _R = R; R = function () { const r = _R.apply(this, arguments); if (S.view === "login") setTimeout(go, 0); tell(); return r; }; }
    window.__dkTheme = (i) => { try { themeIdx = i; applyTheme(); } catch (e) { /* ok */ } };
    /* r3: a workstation fault is shown on its window (with RELOAD) instead of failing silently */
    addEventListener("error", (e) => { try { parent.Desk.wsFault(window, String((e && e.message) || "script error")); } catch (_) { /* ok */ } });
    addEventListener("unhandledrejection", (e) => { try { parent.Desk.wsFault(window, String((e && e.reason && e.reason.message) || e.reason || "rejected")); } catch (_) { /* ok */ } });
    addEventListener("pointerdown", () => { try { parent.Desk.wsFront(window); } catch (e) { /* ok */ } }, true);
    go(); tell();
    return;
  }
  if (classic) { // fallback: the exact v5.5.5 layout, plus one header button back to the desktop
    window.Desk = { on: false, build: BUILD, classic: true };
    const h = document.querySelector("#wrap header .hctl");
    if (h && !qs.has("classic") && window.FORGE_CLASSIC !== 1) {
      const b = document.createElement("button"); b.className = "audio-btn"; b.type = "button"; b.id = "dkBack";
      b.textContent = "[DESKTOP]"; b.title = "Return to the FORGE-OS desktop";
      b.onclick = () => { P.classic = false; save(); location.reload(); };
      h.prepend(b, " ");
    }
    return;
  }

  /* ---------- names ---------- */
  const SEC = [ // unit window sections: key, kanji, English, column
    ["doll", "体", "PAPER DOLL // TELEMETRY", "a"], ["impact", "撃", "IMPACT RESOLUTION", "a"],
    ["rolls", "熱", "ROLLS // SKILLS // HEAT", "a"], // 5.5.5-D1 r3: skill inputs live inside the rolls section (collapsed in play)
    ["sheet", "籍", "CHARACTER SHEET", "b"], ["loadout", "装", "LOADOUT", "b"]];
  const SECN = Object.fromEntries(SEC.map((s) => [s[0], s]));
  const COLN = ["NONE", "CYAN", "VIOLET", "RED", "GOLD", "GREEN"];
  const ICONS = [ // id, kanji, label, title
    ["enc", "戦", "ENCOUNTER", "Encounter: unit tabs, load sheets, sortie state (solo or live table)"],
    ["units", "機", "UNITS", "Unit group: every unit with a chosen tab colour"],
    ["guest", "造", "ASSEMBLY", "Frame assembly: build a new frame"],
    ["mech", "整", "SERVICE", "Service bay: restore and compile frame manifests"],
    // right-hand column, top: SETTINGS, then the key-gated OVERSEER and CATALOGUE (not in the launch menu), then CHANGELOG
    ["set", "設", "SETTINGS", "Settings: theme, audio, UI scale, layout slots", "r"],
    ["ovr", "監", "OVERSEER", "Overseer directorate (key required)", "r", 1],
    ["cat", "典", "CATALOGUE", "Catalogue editor (research key required)", "r", 1]];
  const THEME_HINT = { "": "TEAL", remus: "AMBER" };

  /* ---------- CSS ---------- */
  /* narrow doll: below 560 px the absolute-positioned part labels collide, so the doll goes on top and the part list
     is balanced into two even columns under it (8 parts: 4 + 4, in the doll's own order). Wider keeps the original layout. */
  /* r3: the shield tile rides up into the empty bottom-left corner of the doll, so a shield adds no height */
  const DOLLCSS = '.mechmap>.sorfoot.dk-shup{position:absolute;left:0;bottom:0;margin:0!important;display:block;z-index:1;pointer-events:none}.mechmap>.dk-shup .shieldrow{margin:0;pointer-events:auto}'
    + '@container dkdoll (max-width:559px){.mechmap:not(.vehmap)>.sorfoot.dk-shup{position:relative;left:auto;bottom:auto;grid-row:1;grid-column:1;align-self:end;justify-self:start;max-width:100%}'
    + '.mechmap:not(.vehmap){display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto repeat(4,auto);grid-auto-flow:column;gap:2px 10px;aspect-ratio:auto;max-width:none}'
    + '.mechmap:not(.vehmap)>svg{position:relative;inset:auto;grid-row:1;grid-column:1/-1;width:100%;max-width:440px;height:auto;aspect-ratio:680/330;justify-self:center}'
    + '.mechmap:not(.vehmap) .ld{display:none}'
    + '.mechmap:not(.vehmap)>.mlab{position:relative;left:auto!important;top:auto!important;width:auto!important;min-width:0}}';
  const st = document.createElement("style"); st.id = "dkcss"; st.textContent = "body.dk{overflow:hidden}\nhtml:has(body.dk){scrollbar-gutter:auto;overflow:hidden}\nbody.dk #wrap{display:none!important}\n#dk{position:fixed;inset:0;z-index:1;font-family:var(--font,Consolas,\"Courier New\",monospace);color:var(--dk-fg);\n --dk-bg:color-mix(in srgb,var(--bg) 82%,var(--line));--dk-grid:color-mix(in srgb,var(--line) 22%,transparent);\n --dk-win:color-mix(in srgb,var(--bg) 90%,var(--line));--dk-tb:color-mix(in srgb,var(--bg) 75%,var(--line));\n --dk-on:color-mix(in srgb,var(--line) 70%,var(--bg));--dk-on-fg:var(--cyan);--dk-fg:var(--fg);--dk-hi:var(--cyan);--dk-bd:var(--line)}\nbody:not([data-theme]) #dk{--dk-bg:#0c2325;--dk-grid:rgba(110,210,210,.07);--dk-win:#0a1c1e;--dk-tb:#0e2729;--dk-on:#1c4a4b;--dk-on-fg:#d6ffff;--dk-fg:#a8e8e6;--dk-hi:#7ff;--dk-bd:#2c6f6f}\nbody[data-theme=remus] #dk{--dk-bg:#090704;--dk-grid:rgba(230,160,40,.07);--dk-win:#0c0904;--dk-tb:#171006;--dk-on:#e6a21a;--dk-on-fg:#140d02;--dk-fg:#e3a53c;--dk-hi:#ffd966;--dk-bd:#7a5a1c}\n#dkdesk{position:absolute;inset:0 0 28px 0;background:var(--dk-bg);background-image:linear-gradient(var(--dk-grid) 1px,transparent 1px),linear-gradient(90deg,var(--dk-grid) 1px,transparent 1px);background-size:32px 32px}\n#dkicons{position:absolute;left:8px;top:8px;bottom:8px;width:72px;display:flex;flex-direction:column;gap:6px;z-index:1}\n#dkiconsr{position:absolute;right:8px;top:8px;width:72px;z-index:1;display:flex;flex-direction:column;gap:6px}\n.dk-ico{display:flex;flex-direction:column;align-items:center;gap:2px;width:72px;padding:5px 0;background:none;border:1px solid transparent;color:var(--dk-fg);cursor:pointer;font:inherit;min-height:0;height:auto}\n.dk-ico b{font-size:26px;line-height:30px;font-weight:400;color:var(--dk-hi);text-shadow:0 0 6px color-mix(in srgb,var(--dk-hi) 35%,transparent)}\nbody[data-theme=remus] .dk-ico b{color:var(--dk-fg)}\n.dk-ico span{font-size:11px;letter-spacing:.04em}\n.dk-ico:hover,.dk-ico:focus-visible{border-color:var(--dk-bd);background:color-mix(in srgb,var(--dk-on) 30%,transparent);outline:none}\n#dkarea{position:absolute;inset:0;isolation:isolate;z-index:3;pointer-events:none}\n#dkarea>.dkw{pointer-events:auto}\n.dkw{position:absolute;display:flex;flex-direction:column;min-width:240px;min-height:90px;background:var(--dk-win);border:1px solid var(--dk-bd);box-shadow:0 6px 22px rgba(0,0,0,.45)}\n.dkw[hidden]{display:none}\n.dkw.max{left:0!important;top:0!important;width:100%!important;height:100%!important}\n.dk-t{display:flex;align-items:center;gap:6px;height:22px;flex:0 0 22px;padding:0 2px 0 6px;background:var(--dk-tb);border-bottom:1px solid var(--dk-bd);cursor:move;user-select:none;font-size:11px;letter-spacing:.06em;white-space:nowrap;overflow:hidden;color:color-mix(in srgb,var(--dk-fg) 75%,transparent)}\n.dkw.on>.dk-t{background:var(--dk-on);color:var(--dk-on-fg)}\n.dk-t .dk-k{font-size:12px}.dk-t .dk-n{overflow:hidden;text-overflow:ellipsis;flex:1;font-size:12px}\n.dk-t .dk-sw{width:12px;height:12px;border:1px solid currentColor;flex:0 0 12px}\n.dk-t .dk-st{font-size:12px;line-height:16px;padding:0 4px;border:1px solid currentColor}\n.dkw.on>.dk-t .dk-st{color:inherit}\n.dk-t button{width:20px;height:18px;padding:0;margin:0;border:0;background:none;color:inherit;font:inherit;font-size:11px;line-height:14px;cursor:pointer;min-height:0;box-shadow:none}\n.dk-t button:hover{background:color-mix(in srgb,var(--dk-fg) 22%,transparent)}\n.dk-b{flex:1;overflow:auto;position:relative;container-type:inline-size;padding:6px}\n.dk-h{position:absolute;z-index:3}.dk-h[data-d=n]{top:-3px;left:6px;right:6px;height:6px;cursor:ns-resize}.dk-h[data-d=s]{bottom:-3px;left:6px;right:6px;height:6px;cursor:ns-resize}\n.dk-h[data-d=e]{right:-3px;top:6px;bottom:6px;width:6px;cursor:ew-resize}.dk-h[data-d=w]{left:-3px;top:6px;bottom:6px;width:6px;cursor:ew-resize}\n.dk-h[data-d=ne]{right:-3px;top:-3px;width:10px;height:10px;cursor:nesw-resize}.dk-h[data-d=sw]{left:-3px;bottom:-3px;width:10px;height:10px;cursor:nesw-resize}\n.dk-h[data-d=nw]{left:-3px;top:-3px;width:10px;height:10px;cursor:nwse-resize}.dk-h[data-d=se]{right:-3px;bottom:-3px;width:10px;height:10px;cursor:nwse-resize}\n.dkw.max .dk-h{display:none}\n.dk-unit{display:grid;grid-template-columns:minmax(520px,1.15fr) minmax(360px,1fr);gap:6px;align-items:start}\n@container (max-width:900px){.dk-unit{grid-template-columns:minmax(0,1fr)}}\n.dk-col{display:flex;flex-direction:column;gap:6px;min-width:0}\n.dk-seg{border:1px solid var(--dk-bd);background:color-mix(in srgb,var(--bg) 92%,transparent);min-width:0}\n.dk-sh{display:flex;align-items:center;gap:6px;height:20px;padding:0 4px 0 6px;font-size:11px;letter-spacing:.08em;color:color-mix(in srgb,var(--dk-fg) 80%,transparent);border-bottom:1px solid color-mix(in srgb,var(--dk-bd) 70%,transparent);user-select:none}\n.dk-sh .dk-k{font-size:10px;color:var(--dk-hi)}.dk-sh .dk-n{flex:1}\n.dk-sh button{border:1px solid transparent;background:none;color:inherit;font:inherit;font-size:10px;padding:0 3px;cursor:pointer;min-height:0;height:15px;line-height:13px;box-shadow:none}\n.dk-sh button:hover{border-color:var(--dk-bd)}\n.dk-seg.col>.dk-sb{display:none}.dk-seg.col>.dk-sh{border-bottom:0}\n.dk-sb{padding:6px;min-width:0}\n.dk-sec{display:block;min-width:0}\n.dk-ph{font-size:11px;color:var(--muted);padding:4px 2px}\n.dkw[data-k=sec] .dk-b>.dk-sec{padding:2px}\n#dktask{position:absolute;left:0;right:0;bottom:0;height:28px;display:flex;align-items:center;gap:4px;padding:0 4px;background:color-mix(in srgb,var(--dk-bg) 70%,#000);border-top:1px solid var(--dk-bd);font-size:12px;z-index:50}\n#dktask button{font:inherit;font-size:12px;height:22px;min-height:0;padding:0 8px;background:none;color:var(--dk-fg);border:1px solid color-mix(in srgb,var(--dk-bd) 70%,transparent);cursor:pointer;white-space:nowrap;box-shadow:none}\n#dkstart{letter-spacing:.06em}\n#dktabs{flex:1 1 auto;display:flex;gap:4px;overflow-x:auto;overflow-y:hidden;min-width:0}\n#dktabs button{width:150px;min-width:120px;flex:0 1 150px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;justify-content:flex-start}\n#dktabs button.on{border-color:var(--dk-hi);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dk-hi) 40%,transparent)}\n#dktabs button .dk-tc{display:inline-block;width:8px;height:8px;border:1px solid currentColor;margin-right:5px;vertical-align:1px}\n#dkhelp{width:30px;padding:0!important;font-size:13px!important;letter-spacing:0}\n#dkhelp,#dktray{flex:none}\n#dktabs button.min{opacity:.6}\n#dkstat{display:flex;align-items:center;gap:10px;height:22px;min-width:0;overflow:hidden;flex:0 1 auto;padding:0 8px;border:1px solid color-mix(in srgb,var(--dk-bd) 70%,transparent);white-space:nowrap;color:var(--dk-fg)}\n#dkstat b{font-weight:400;color:var(--dk-hi)}#dkstat .ver{cursor:pointer}\n#dktray{position:relative;width:30px;padding:0!important;font-size:13px!important}\n#dktray.on{border-color:var(--dk-hi)!important;color:var(--dk-hi)!important;background:color-mix(in srgb,var(--dk-on) 45%,transparent)!important}\n#dktray.new::after{content:\"\";position:absolute;top:2px;right:2px;width:5px;height:5px;background:var(--dk-hi)}\n.dkw[data-k=con]>.dk-b{padding:0;overflow:hidden;display:flex;flex-direction:column;container:dkcon/size}\n.dkw[data-k=con]>.dk-b>#cb{flex:1;min-height:0;height:auto!important;max-height:none!important;margin:0!important;display:flex!important;flex-direction:column;border:0;position:static!important;width:auto!important}\n.dkw[data-k=con]>.dk-b>#cb>#log{flex:1;min-height:60px;height:auto!important;max-height:none!important}\n.dkw[data-k=con] #cb.users>#log,.dkw[data-k=con] #cb.users>#pr,.dkw[data-k=con] #cb.users>#hint{margin-right:112px!important}\n@container dkcon (max-aspect-ratio:9/10){\n.dkw[data-k=con] #cb>*{order:2}.dkw[data-k=con] #cb>#conhead{order:0}\n.dkw[data-k=con] #cb>#mpfriends{order:1;position:static;width:auto;max-height:30%;flex:none;padding:4px 0;border:0;border-bottom:1px solid var(--line);overflow-y:auto;overflow-wrap:normal}\n.dkw[data-k=con] #cb>#mpfriends .mpbody{display:flex;flex-wrap:wrap;gap:2px 18px}\n.dkw[data-k=con] #cb>#mpfriends .mprow{display:flex;align-items:baseline;gap:6px;min-width:0;max-width:100%;border:0;padding:2px 0}\n.dkw[data-k=con] #cb>#mpfriends .mprow .mp-place{flex:0 1 auto}\n.dkw[data-k=con] #cb.users #log,.dkw[data-k=con] #cb.users #pr,.dkw[data-k=con] #cb.users #hint{margin-right:0!important}}\nbody.dk #con,body.dk #sh{position:static!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important;width:auto!important;max-width:none!important;margin:0!important}\nbody.dk #bar>.panel{margin-top:0!important}\n.dkw[data-k=enc] .dk-b>#con:has(#out:empty){display:none}\n#dkmenu{position:absolute;left:4px;bottom:32px;min-width:240px;background:var(--dk-win);border:1px solid var(--dk-bd);z-index:70;padding:4px;display:flex;flex-direction:column;box-shadow:0 8px 24px rgba(0,0,0,.5)}\n#dkmenu button{display:flex;gap:8px;align-items:center;text-align:left;font:inherit;font-size:11px;padding:4px 8px;background:none;border:1px solid transparent;color:var(--dk-fg);cursor:pointer;min-height:0;box-shadow:none}\n#dkmenu button b{font-weight:400;color:var(--dk-hi);width:16px}\n#dkmenu button:hover,#dkmenu button:focus-visible{border-color:var(--dk-bd);background:color-mix(in srgb,var(--dk-on) 35%,transparent);outline:none}\n#dkmenu hr{border:0;border-top:1px solid var(--dk-bd);margin:3px 0}\n#dkmodal{position:absolute;inset:0;z-index:80;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}\n#dkmodal>div{min-width:360px;max-width:520px;background:var(--dk-win);border:1px solid var(--dk-bd)}\n#dkmodal .dk-t{cursor:default;background:var(--dk-on);color:var(--dk-on-fg)}\n#dkmodal p{margin:12px;font-size:12px;line-height:1.5}#dkmodal .act{display:flex;gap:8px;justify-content:flex-end;margin:0 12px 12px}\n#dklock{position:absolute;inset:0;z-index:90;background:var(--dk-bg);background-image:radial-gradient(ellipse at 30% 30%,color-mix(in srgb,var(--dk-hi) 9%,transparent),transparent 60%),linear-gradient(var(--dk-grid) 1px,transparent 1px),linear-gradient(90deg,var(--dk-grid) 1px,transparent 1px);background-size:auto,32px 32px,32px 32px;display:flex;overflow:auto}\n#dklock[hidden]{display:none}\n#dklock .lk{margin:auto;display:grid;grid-template-columns:minmax(300px,440px) minmax(440px,660px);gap:32px;padding:32px;align-items:center}\n#dklock .lk-clock{font-size:64px;line-height:1;color:var(--dk-hi);letter-spacing:.02em}\n#dklock .lk-date{font-size:13px;margin:6px 0 22px;color:var(--dk-fg);letter-spacing:.1em}\n#dklock .lk-crest .welcome{margin:0;padding:0;border:0;background:none;text-align:left;align-items:flex-start}\n#dklock .lk-crest .ux-mark{color:var(--dk-hi);margin:0 0 10px}\n#dklock .lk-build{margin-top:18px;font-size:10px;letter-spacing:.12em;color:var(--muted)}\n#dklock .lk-r{border:1px solid var(--dk-bd);background:var(--dk-win);min-width:0}\n#dklock .lk-r>.dk-t{cursor:default;background:var(--dk-on);color:var(--dk-on-fg)}\n.dk-grp .sw{display:none}\n.dk-grp .sw button{font:inherit;font-size:11px;padding:1px 8px;background:none;color:var(--dk-fg);border:1px solid var(--dk-bd);cursor:pointer;min-height:0;height:auto;box-shadow:none}\n.dk-grp .sw button.on{background:var(--dk-on);color:var(--dk-on-fg)}\n.dk-grp .sw i{display:inline-block;width:8px;height:8px;border:1px solid currentColor;margin-right:5px;vertical-align:-1px}\n.dk-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px}\n.dk-card{display:flex;flex-direction:column;align-items:stretch;gap:2px;padding:6px;border:1px solid var(--dk-bd);background:color-mix(in srgb,var(--bg) 90%,transparent);color:var(--fg);font:inherit;font-size:11px;cursor:pointer;text-align:left;min-height:0;height:auto;box-shadow:none}\n.dk-card:hover,.dk-card:focus-visible{border-color:var(--dk-hi);outline:none}\n.dk-card .doll{height:96px;display:flex;justify-content:center}.dk-card .doll svg{height:96px;width:auto;max-width:100%;pointer-events:none}\n.dk-card .doll .ld,.dk-card .doll .dt{display:none}\n.dk-card .nm2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dk-hi);min-width:0}.dk-card .dk-pil{font-style:normal;font-size:11px;letter-spacing:.04em;margin-left:6px}.dk-card .dk-pil::before{content:\"// \";color:inherit}\n.dk-card .cd{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.35}.dk-card{min-width:0;overflow:hidden}\n.dk-set{font-size:12px}.dk-set fieldset{border:1px solid var(--dk-bd);margin:0 0 8px;padding:6px 8px}\n.dk-set legend{font-size:11px;letter-spacing:.12em;color:var(--dk-hi);padding:0 4px}\n.dk-set .row2{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:3px 0}\n.dk-set button{font:inherit;font-size:11px;padding:1px 8px;min-height:0;height:auto}\n.dk-set button.on{background:var(--dk-on);color:var(--dk-on-fg);border-color:var(--dk-hi)}\n.dk-set .slot{display:grid;grid-template-columns:24px 1fr auto auto;gap:6px;align-items:center;font-size:11px;margin:2px 0}\n.dk-set .dim2{color:var(--muted);font-size:11px}\nbody.dk #sheetQuery{display:none!important}\n.dkw[data-k=ws]>.dk-b{padding:0;overflow:hidden}.dkw[data-k=ws] iframe{display:block;width:100%;height:100%;border:0;background:var(--bg)}\n.dkw.dk-drag iframe{pointer-events:none}\n.dk-grp .sw .swt{border-color:transparent;padding:1px 4px}\n.dk-grp .sw .cur{display:inline-flex;align-items:center;gap:0;font-size:11px;color:var(--dk-fg)}\n.dk-card .doll.dk-mini{position:relative;aspect-ratio:auto;max-width:none;width:auto;margin:0;height:96px;display:flex;justify-content:center}\n.dk-card .doll.dk-mini::after{display:none}\n#dklock .lk-f{display:grid;grid-template-columns:auto 1fr;gap:10px 12px;align-items:center;padding:14px 14px 6px;font-size:12px}\n#dklock .lk-f label{letter-spacing:.1em;font-size:11px;color:var(--dk-fg)}\n#dklock .lk-f input[type=text]{font:inherit;font-size:14px;padding:5px 8px;background:var(--dk-bg);color:var(--dk-hi);border:1px solid var(--dk-bd);text-transform:uppercase;min-width:0}\n#dklock .lk-f input[type=text]:focus{outline:1px solid var(--dk-hi);outline-offset:0}\n#dklock .lk-f input[type=color]{width:56px;height:26px;padding:0 2px;background:var(--dk-bg);border:1px solid var(--dk-bd);cursor:pointer}\n#dklock .lk-col{display:flex;align-items:center;gap:10px}#dklock .lk-col span{font-size:11px;color:var(--muted)}\n#dklock .lk-act{grid-column:1/-1;display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:4px}\n#dklock .lk-f button{font:inherit;font-size:12px;padding:5px 12px;min-height:0;height:auto;cursor:pointer;background:none;color:var(--dk-fg);border:1px solid var(--dk-bd);box-shadow:none}\n#dklock .lk-f button.go{color:var(--dk-on-fg);background:var(--dk-on);border-color:var(--dk-hi)}\n#dklock .lk-f button:hover,#dklock .lk-f button:focus-visible{border-color:var(--dk-hi);outline:none}\n#dklock .lk-msg{grid-column:1/-1;min-height:16px;font-size:11px;color:var(--warn,#ffb400)}\n#dklock .lk-lay{display:flex;gap:6px;align-items:center;justify-content:flex-end;padding:8px 14px 12px;border-top:1px solid color-mix(in srgb,var(--dk-bd) 60%,transparent);font-size:10px;letter-spacing:.1em}\n#dklock .lk-lay button{font:inherit;font-size:11px;padding:2px 10px;min-height:0;height:auto;cursor:pointer;background:none;color:var(--dk-fg);border:1px solid var(--dk-bd);box-shadow:none}\n#dklock .lk-lay button.on{background:var(--dk-on);color:var(--dk-on-fg);border-color:var(--dk-hi)}\n.dk-card.on{border-color:var(--dk-hi);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dk-hi) 45%,transparent)}\n.dk-gsel{margin-top:8px;border:1px solid var(--dk-bd);background:color-mix(in srgb,var(--bg) 92%,transparent)}\n.dk-gsel>.dk-sh button{font-size:11px}\n.dk-gsel:not(.has)>.dk-sh button,.dk-gsel.has>[data-g=none]{display:none}\n.dk-gsb{padding:0 6px}.dk-gsb[data-s=doll]{padding-top:6px}.dk-gsb[data-s=impact]{padding-bottom:6px}.dk-gsel [data-g=none]{padding:8px}\n.dk-card .doll.dk-mini>svg{position:static!important;inset:auto;height:96px;width:auto;max-width:100%;transform:none}\n.dk-utabs{display:flex;gap:2px;flex-wrap:wrap;margin:-2px 0 6px;border-bottom:1px solid var(--dk-bd);padding:0 2px}\n.dk-ut{display:inline-flex;align-items:center;gap:6px;max-width:300px;height:22px;padding:0 4px 0 8px;font:inherit;font-size:11px;letter-spacing:.06em;color:color-mix(in srgb,var(--dk-fg) 70%,transparent);background:color-mix(in srgb,var(--bg) 85%,transparent);border:1px solid var(--dk-bd);border-bottom:0;cursor:pointer;box-shadow:none;min-height:0;margin-bottom:-1px}\n.dk-ut span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.dk-ut i{flex:none;width:8px;height:8px;border:1px solid color-mix(in srgb,var(--dk-fg) 40%,transparent)}\n.dk-ut b{font-weight:400;padding:0 3px;opacity:.6}.dk-ut b:hover{opacity:1;color:var(--dk-hi)}\n.dk-ut.on{color:var(--dk-hi);background:var(--bg);border-color:var(--dk-hi);border-bottom:1px solid var(--bg)}\n.dkw.dk-tdrop{outline:2px dashed var(--dk-hi);outline-offset:-2px}\nbody.dk-tdrag .dkw iframe{pointer-events:none}\n.dk-grp .sw button{font-size:12px}.dk-grp .sw i,.dk-grp .cur i{width:12px;height:12px}\n.dk-ut.act,.dk-ut.act:hover{background:var(--dk-on);color:var(--dk-on-fg);border-color:var(--dk-hi)}.dk-ut .pf{font-style:normal}.dk-ut .pf:empty{display:none}\n#dkstat .act b{color:var(--dk-on-fg);background:var(--dk-on);padding:0 4px}\n#dkstat .act.view,#dkstat .act.view b{background:transparent;color:color-mix(in srgb,var(--dk-fg) 70%,transparent);opacity:.9;padding:0}\n#dkstat .dk-last{cursor:pointer;display:inline-flex;white-space:nowrap;color:var(--dk-hi);flex:1 1 auto;min-width:auto;overflow:visible}\n.dk-last{display:inline-flex;white-space:nowrap}\n.dk-lr{flex:none}\n.dk-lx{min-width:0;overflow:hidden;text-overflow:ellipsis}\n#dkstat>span:not(.dk-last){min-width:0;overflow:hidden;text-overflow:ellipsis}\n@media (min-width:1600px){#dkstat .dk-last{max-width:40em}}\n@media (max-width:1599px){#dkstat:has(.dk-last)>span:not(.dk-last):not(.act){display:none}}\n#dkstat .act.min{cursor:pointer}\n@media (max-width:1366px){#dkstat .dk-clr{display:none}#dktabs button{min-width:56px}}\n.dk-back{display:block;width:100%;text-align:left;font:inherit;font-size:12px;letter-spacing:.06em;padding:6px 8px;margin:2px 0;color:var(--dk-hi);background:color-mix(in srgb,var(--dk-hi) 8%,transparent);border:1px solid var(--dk-hi);cursor:pointer;min-height:0;height:auto;box-shadow:none}\n.dk-back:hover,.dk-back:focus-visible{background:color-mix(in srgb,var(--dk-hi) 18%,transparent);outline:none}\n#dktmark{position:absolute;width:320px;height:120px;pointer-events:none;outline:2px dashed var(--dk-hi);outline-offset:-2px;background:color-mix(in srgb,var(--dk-hi) 8%,transparent);color:var(--dk-hi);display:flex;align-items:center;justify-content:center;font-size:12px;letter-spacing:.12em;z-index:5000}\n\n/* 5.5.5-D1 round 3 */\n.dk-t .dk-pl{flex:none;max-width:30%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;letter-spacing:.04em}\n.dk-t .dk-pl::before{content:\"// \";color:inherit}\n.dkw.on>.dk-t .dk-pl,.dk-ut.act .dk-pil{background:var(--bg);padding:0 4px}\n.dk-t .dk-sz{font-size:13px;min-width:24px}\n.dk-t .dk-gcol{width:auto;min-width:20px;padding:0 5px;display:inline-flex;align-items:center;gap:5px;font-size:12px;letter-spacing:.04em;flex:none;max-width:46%;line-height:14px}\n.dk-keys{font-size:12px;letter-spacing:.03em;line-height:1.45;padding:2px 4px}\n.dk-keys .dk-khead{margin:0 0 8px;letter-spacing:.08em;color:var(--dk-hi)}\n.dk-keys ul{margin:0;padding:0 0 0 18px}\n.dk-keys li{margin:0 0 5px}\n.dk-keys b{font-weight:400;color:var(--dk-hi)}\n.dk-t .dk-gcol i{display:block;width:10px;height:10px;border:1px solid currentColor;flex:0 0 10px;box-sizing:border-box}\n.dk-t .dk-gcol span{overflow:hidden;text-overflow:ellipsis}\n.dk-gcol-menu{position:fixed;z-index:80;min-width:148px;border:1px solid var(--dk-bd);background:var(--dk-win);box-shadow:0 6px 22px rgba(0,0,0,.45);padding:2px;display:flex;flex-direction:column;gap:1px;font-family:var(--font,Consolas,\"Courier New\",monospace);color:var(--dk-fg)}\n.dk-gcol-menu button{display:flex;align-items:center;gap:6px;width:100%;font:inherit;font-size:12px;letter-spacing:.04em;text-align:left;padding:3px 8px;background:none;color:var(--dk-fg);border:0;cursor:pointer;min-height:22px;height:auto;box-shadow:none;border-radius:0}\n.dk-gcol-menu button:hover,.dk-gcol-menu button:focus-visible,.dk-gcol-menu button.on{background:var(--dk-on);color:var(--dk-on-fg);outline:none}\n.dk-gcol-menu i{display:block;width:12px;height:12px;border:1px solid currentColor;flex:0 0 12px;box-sizing:border-box}\n.dk-ut .dk-pil{font-style:normal;font-size:11px;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;flex:none}\n.dkw[data-k=group]>.dk-b{overflow:hidden}\n.dk-grp{display:grid;grid-template-columns:minmax(0,1fr) 196px;grid-template-rows:minmax(0,1fr);column-gap:8px;height:100%;min-height:0}\n\n.dk-grp>.dk-cards{grid-column:2;grid-row:1;display:flex;flex-direction:column;gap:6px;overflow-y:auto;overflow-x:hidden;min-height:0;padding:0}\n.dk-grp>.dk-cards>*{flex:none}.dk-grp>.dk-cards>.dk-card{margin:0!important;width:100%;box-sizing:border-box}\n.dk-grp>.dk-gsel{grid-column:1;grid-row:1;margin-top:0;overflow:auto;min-height:0;align-self:stretch;container-type:inline-size}\n.dkw[data-k=ws]>.dk-b{display:flex;flex-direction:column}.dkw[data-k=ws] iframe{flex:1;height:auto;min-height:0}\n.dk-wsmsg{flex:none;display:flex;align-items:center;gap:8px;min-height:22px;padding:2px 6px;border-top:1px solid var(--dk-bd);font-size:11px;letter-spacing:.05em;color:color-mix(in srgb,var(--dk-fg) 75%,transparent);background:color-mix(in srgb,var(--bg) 90%,transparent)}\n.dk-wsmsg>span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.dk-wsmsg>button{font:inherit;font-size:11px;padding:0 6px;background:none;color:var(--dk-fg);border:1px solid var(--dk-bd);cursor:pointer;min-height:0;height:18px;box-shadow:none}\n.dk-wsmsg.warn{color:var(--warn,#d8a03a)}.dk-wsmsg.bad{color:var(--bad,#e05050);border-top-color:currentColor}\n.dk-wsmsg>button.arm{color:var(--bad,#e05050);border-color:currentColor}.dk-wsmsg>button.go{color:inherit;border-color:currentColor}\n"; st.textContent += ".dk-sec[data-s=doll]{container:dkdoll/inline-size}" + DOLLCSS; document.head.appendChild(st);

  /* ---------- shadow styles: the page's own CSS, with body/html selectors mapped onto a mirrored wrapper ---------- */
  let shSheet = null, shSig = "";
  function splitSel(s) { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(" || ch === "[") d++; else if (ch === ")" || ch === "]") d--; if (ch === "," && !d) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out; }
  function mapSel(sel) {
    return splitSel(sel).map((p) => {
      let s = p.trim();
      if (/^:root\b/.test(s)) return s.replace(/^:root/, ":host");
      s = s.replace(/^html(?:[.\[:][^\s>+~]*)?\s*(?:>\s*)?(?=body|$)/, "");
      if (/^html\b/.test(s)) return ":host(.dk-never)";
      if (/^body\b/.test(s)) s = s.replace(/^body/, ".dk-root");
      return s || ":host";
    }).join(",");
  }
  function ruleText(r) {
    if (r instanceof CSSStyleRule) return mapSel(r.selectorText) + "{" + r.style.cssText + "}";
    if (r instanceof CSSMediaRule) return "@media " + r.media.mediaText + "{" + [...r.cssRules].map(ruleText).join("") + "}";
    if (typeof CSSSupportsRule !== "undefined" && r instanceof CSSSupportsRule) return "@supports " + r.conditionText + "{" + [...r.cssRules].map(ruleText).join("") + "}";
    if (typeof CSSFontFaceRule !== "undefined" && r instanceof CSSFontFaceRule) return "";
    if (typeof CSSImportRule !== "undefined" && r instanceof CSSImportRule) return "";
    return r.cssText;
  }
  function shadowSheet() {
    const list = [...document.styleSheets].filter((s) => s.ownerNode && s.ownerNode.id !== "dkcss");
    const sig = list.length + ":" + list.map((s) => { try { return s.cssRules.length; } catch (e) { return 0; } }).join(",") + ":" + (document.documentElement.classList.contains("ux-scaled") ? "z" : "n");
    if (shSheet && sig === shSig) return shSheet;
    let txt = "";
    for (const s of list) { let rs; try { rs = s.cssRules; } catch (e) { continue; } for (const r of rs) { try { txt += ruleText(r) + "\n"; } catch (e) { /* skip */ } } }
    txt += DOLLCSS + ":host([data-s=doll]){container:dkdoll/inline-size}";
    txt += ":host{display:block}.dk-root{display:block;background:none!important;min-height:0!important;margin:0!important;padding:0!important;overflow:visible!important;visibility:visible!important;font-family:inherit}.dk-in{display:block}";
    if (!shSheet) shSheet = new CSSStyleSheet();
    shSheet.replaceSync(txt); shSig = sig; return shSheet;
  }
  function mirrorBody(r, ro) { const b = document.body; const c = "dk-root " + [...b.classList].filter((x) => x !== "dk" && x !== "mp-view").join(" ") + (ro ? " mp-view" : ""); if (r.className !== c) r.className = c; for (const a of ["data-theme", "data-view"]) { const v = b.getAttribute(a); if (v == null) r.removeAttribute(a); else if (r.getAttribute(a) !== v) r.setAttribute(a, v); } }

  /* ---------- DOM ---------- */
  const root = document.createElement("div"); root.id = "dk";
  root.innerHTML = `<div id=dkdesk><div id=dkicons role=toolbar aria-label="Desktop icons"></div><div id=dkiconsr></div><div id=dkarea></div></div>
<div id=dktask><button id=dkstart type=button aria-haspopup=menu title="Launch menu">起動 LAUNCH</button><div id=dktabs role=tablist aria-label="Open windows"></div><div id=dkstat aria-live=off></div><button id=dkhelp type=button title="Keyboard shortcuts and mouse gestures" aria-label="Shortcuts">?</button><button id=dktray type=button aria-pressed=false title="Operator console (chat, rolls, user list). Click again to close." aria-label="Operator console">▤</button></div>
<div id=dklock hidden><div class=lk><div><div class=lk-clock id=dklkc></div><div class=lk-date id=dklkd></div><div class=lk-crest id=dklkcrest></div><div class=lk-build>FORGE-OS v${BUILD} // DESKTOP</div></div><div class=lk-r><div class=dk-t><span class=dk-k>鍵</span><span class=dk-n>LOGIN // IDENTITY</span></div>
<form id=dklkf class=lk-f autocomplete=off><label for=dklkname>CALLSIGN</label><input id=dklkname type=text maxlength=16 spellcheck=false placeholder="1-16 letters or digits">
<label for=dklkcol>COLOUR</label><div class=lk-col><input id=dklkcol type=color value="#5fd7ff"><span>your name colour at the table</span></div>
<div class=lk-act><button type=submit class=go id=dklkgo>LOGIN ▸</button><button type=button id=dklkoff title="Solo encounter without the live table">WORK OFFLINE</button></div><div class=lk-msg id=dklkmsg aria-live=polite></div></form>
<div class=lk-lay><span>LAYOUT</span><button type=button id=dklkdesk class=on aria-pressed=true>DESKTOP</button><button type=button id=dklkclassic aria-pressed=false title="The v5.5.5 single-page layout (reloads the page)">CLASSIC</button></div></div></div></div>
<div id=dkpark hidden></div>`;
  document.body.appendChild(root);
  document.body.classList.add("dk");
  const area = $("dkarea"), park = $("dkpark"), tabsEl = $("dktabs");
  $("dkicons").innerHTML = ICONS.filter((i) => i[4] !== "r").map((i) => `<button class=dk-ico type=button data-ico=${i[0]} title="${esc(i[3])}"><b aria-hidden=true>${i[1]}</b><span>${i[2]}</span></button>`).join("");
  $("dkiconsr").innerHTML = ICONS.filter((i) => i[4] === "r").map((i) => `<button class=dk-ico type=button data-ico=${i[0]} title="${esc(i[3])}"><b aria-hidden=true>${i[1]}</b><span>${i[2]}</span></button>`).join("") + `<button class=dk-ico type=button data-ico=log title="Changelog"><b aria-hidden=true>録</b><span>CHANGELOG</span></button>`;

  /* ---------- helpers ---------- */
  const UKEY = new WeakMap(); let useq = 0;
  function ukey(sh) { if (!sh) return null; if (sh.uid) return "u:" + sh.uid; let k = UKEY.get(sh); if (!k) { k = "l:" + (++useq); UKEY.set(sh, k); } return k; }
  function sheets() { return (typeof S !== "undefined" && Array.isArray(S.sheets)) ? S.sheets : []; }
  function idxOf(k) { const a = sheets(); for (let i = 0; i < a.length; i++) if (ukey(a[i]) === k) return i; return -1; }
  function curKey() { const a = sheets(); return S.cur != null && a[S.cur] ? ukey(a[S.cur]) : null; }
  function vis(sh) { return !!sh && !sh.hidden; }
  function role() { return S.role || ""; }
  const ENCV = ["intel", "sortie"], LOCKV = ["login", "mpw", "deny", "lock"];
  const inEnc = () => role() === "IMPERIAL INTELLIGENCE";
  function toastD(m) { try { toast(m); } catch (e) { /* optional */ } }
  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function safeLabel(i) { try { return shLabel(i); } catch (e) { return "SHEET " + (i + 1); } }

  /* ---------- windows ---------- */
  const W = new Map(); // id -> {w, e, b}
  const GEO = P.geo && typeof P.geo === "object" ? P.geo : (P.geo = {}); // last geometry of the single engine windows
  let zTop = 10, seq = +P.seq || 0;
  const nid = () => "w" + (++seq);
  const findW = (f) => [...W.values()].find(f);
  /* unit windows are tabbed: w.tabs = unit keys, w.u = the active tab (the acting unit), w.c = the colour bucket it was opened for */
  const tabsOf = (w) => w.tabs || (w.u ? [w.u] : []);
  const uwOf = (u) => findW((v) => v.w.k === "unit" && tabsOf(v.w).includes(u));
  const colOf = (u) => { const i = idxOf(u); return i >= 0 ? (sheets()[i].col || 0) : 0; };
  const ICOL = 88; // width of the left and right icon columns
  const PZW = { L: 1120, S: 620 }; // r4: just wide enough for a side-by-side doll (LARGE left column, or SMALL with a classic scrollbar)
  const WSN = { 1: ["造", "FRAME ASSEMBLY"], 2: ["整", "SERVICE BAY"], 3: ["典", "CATALOGUE EDITOR"], 5: ["監", "OVERSEER"] };
  const wsWin = (w) => { const x = W.get(w.id), f = x && x.b.querySelector("iframe"); return f && f.contentWindow; };
  function areaSize() { return { w: area.clientWidth || 1000, h: area.clientHeight || 600 }; }
  function sign() { let n = ""; try { n = (localStorage.getItem("forge_mp_callsign") || "").trim(); } catch (e) { n = ""; }
    if (!n) { const i = $("dklkname"); if (i && i.value) n = i.value.trim(); }
    return /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,15}$/.test(n) && n.toUpperCase() !== "USER UNKNOWN" ? n.toUpperCase() : "LOCAL"; }
  function persist() { P.seq = seq; P.wins = [...W.values()].filter((x) => x.w.k !== "ws" && x.w.k !== "con" && x.w.k !== "keys").map((x) => Object.assign({}, x.w)); W.forEach((x) => { if (["enc", "term", "sheet", "con"].includes(x.w.k)) GEO[x.w.k] = { x: x.w.x, y: x.w.y, w: x.w.w, h: x.w.h, max: !!x.w.max, min: !!x.w.min }; }); const s = sign(); P.bySign = P.bySign && typeof P.bySign === "object" ? P.bySign : {}; P.bySign[s] = { v: 1, wins: P.wins, geo: Object.assign({}, GEO), tray: !!P.tray }; save(); }
  function viewTitle() { return ({ chassis: "FRAME ASSEMBLY", main: "LOADOUT BUILDER", mechanic: "SERVICE BAY", catalog: "CATALOGUE", catalogEdit: "CATALOGUE EDITOR" })[S.view] || "TERMINAL"; }
  function kanjiTitle(w) {
    if (w.k === "enc") return ["戦", "ENCOUNTER" + (S.view === "intel" ? " // IMPORT FRAME" : "")];
    if (w.k === "term") { const v = S.view, r = role(), a = S.authRole;
      if (v === "deny" || v === "lock") return ["禁", "ACCESS DENIED" + (a ? " // " + a : "")];
      if (v === "pw" || r === "OVERSEER") return ["監", "OVERSEER" + (v === "pw" ? " // KEY REQUIRED" : " // " + viewTitle())];
      if (v === "researchPw" || r === "RESEARCH STAFF") return ["典", "CATALOGUE EDITOR" + (v === "researchPw" ? " // KEY REQUIRED" : "")];
      if (r === "MECHANIC") return ["整", "SERVICE BAY" + (v === "main" ? " // LOADOUT BUILDER" : "")];
      return ["造", viewTitle()]; }
    if (w.k === "sheet") return ["装", role() === "RESEARCH STAFF" ? "RECORD // TELEMETRY" : "LOADOUT // FRAME MANIFEST"];
    if (w.k === "unit") { const i = idxOf(w.u), b = w.c == null ? "" : (COLN[w.c] || "NONE") + " // "; return ["機", "UNITS // " + b + (i >= 0 ? safeLabel(i) : "")]; }
    if (w.k === "sec") { const i = idxOf(w.u), s = SECN[w.s] || ["", "?", "?"]; return [s[1], s[2] + " // " + (i >= 0 ? safeLabel(i) : "UNIT")]; }
    if (w.k === "group") return ["隊", "UNIT GROUP // " + (COLN[w.c || 0] || "NONE")];
    if (w.k === "set") return ["設", "SETTINGS"];
    if (w.k === "keys") return ["捷", "SHORTCUTS"];
    if (w.k === "con") return ["通", "OPERATOR CONSOLE"];
    if (w.k === "ws") { const b = WSN[w.n] || ["", "WORKSTATION"]; let v = "", r = "", a = ""; try { const s = wsWin(w).Forge.state(); v = s.view; r = s.role; a = s.authRole; } catch (e) { /* loading */ }
      const key = v === "pw" || v === "researchPw" ? " // KEY REQUIRED" : v === "lock" || v === "deny" ? " // LOCKED" : "";
      const sub = !key && ({ main: "LOADOUT BUILDER", catalogEdit: "RECORD EDITOR" })[v]; return [b[0], b[1] + (key || (sub ? " // " + sub : ""))]; }
    return ["", String(w.k).toUpperCase()];
  }
  function defGeo(k) {
    if (GEO[k]) return Object.assign({}, GEO[k]);
    const A = areaSize(), n = [...W.values()].filter((x) => x.w.k === k).length, o = 26 * (n % 6);
    const L = ICOL, IW = A.w - 2 * L; // windows open clear of the icon columns (they may still be dragged over them)
    const g = { enc: [L, 8, Math.min(900, IW), 96], term: [L, 8, Math.min(900, IW * .6), A.h - 16],
      sheet: [L + Math.min(920, IW * .6 + 8), 8, Math.max(320, IW - Math.min(920, IW * .6 + 8)), A.h - 16],
      unit: [L + 8 + 40 * (n % 6), 112 + 56 * (n % 6), Math.min(PZW.L, IW - 16), A.h - 124 - 56 * (n % 6)], sec: [A.w * .4 + o, 80 + o, 560, 420],
      group: [Math.max(L, A.w - Math.min(860, IW) - o - L), 8 + o, Math.min(840, IW - 8), A.h - 16 - o], set: [A.w / 2 - 270, 40, 540, Math.min(600, A.h - 60)],
      con: [A.w - 484, A.h - 444, 480, 440], keys: [Math.max(L, A.w / 2 - 270), 56, 540, Math.min(520, A.h - 80)], ws: [L + o, 8 + o, Math.min(1120, A.w - 2 * L), A.h - 16 - o] }[k] || [L + 40, 40, 600, 400];
    return { x: Math.round(g[0]), y: Math.round(g[1]), w: Math.round(g[2]), h: Math.round(Math.min(g[3], A.h)) };
  }
  function same(spec) { return (v) => v.w.k === spec.k && (spec.k === "set" || spec.k === "keys" || spec.k === "con" || (spec.k === "ws" && v.w.n === spec.n) || ["enc", "term", "sheet"].includes(spec.k) || (spec.k === "unit" && tabsOf(v.w).includes(spec.u)) || (spec.k === "sec" && v.w.u === spec.u && v.w.s === spec.s)); }
  function open(spec, focus) {
    let x = spec.k === "group" ? null : findW(same(spec));
    if (spec.k === "unit") { // first open goes into the window for the unit's tab colour (no colour = its own grey bucket); later colour changes never move it
      if (x) x.w.u = spec.u;
      else { const c = colOf(spec.u); x = findW((v) => v.w.k === "unit" && v.w.c === c);
        if (x) { x.w.tabs = tabsOf(x.w).concat(spec.u); x.w.u = spec.u; }
        else { const w = Object.assign({ id: nid() }, defGeo("unit"), spec, { tabs: [spec.u], c }); delete w.pz; x = build(w); if (spec.w == null || spec.pz) x.pzPend = spec.pz || "L"; } } // r3: a new unit window opens at a size preset once its sheet has rendered
      paintUnitChrome(x);
    }
    if (!x) { const w = Object.assign({ id: nid() }, defGeo(spec.k), spec); x = build(w); }
    x.w.min = false; x.e.hidden = false;
    if (focus !== false) front(x.w.id);
    if (spec.k === "sec") { const u = uwOf(spec.u); if (u) paintUnitChrome(u); }
    persist(); paintTabs(); return x;
  }
  /* workstation frames (ASSEMBLY, SERVICE, CATALOGUE, OVERSEER): the frame's console is hidden, so its last message, a
     script fault, or a frame that never starts shows on a strip under it, with RELOAD (r3: ASSEMBLY could fail silently) */
  function wsLoad(x) {
    const w = x.w; x.b.replaceChildren(); clearTimeout(x.wsT); x.wsOk = false; x.wsFault = false;
    const f = document.createElement("iframe"); f.title = (WSN[w.n] || ["", "WORKSTATION"])[1]; f.src = "terminal.html?ws=" + w.n + "&r=" + Date.now().toString(36);
    x.b.appendChild(f);
    x.b.insertAdjacentHTML("beforeend", `<div class=dk-wsmsg role=status aria-live=polite><span>STARTING…</span><button type=button data-a=reload hidden></button></div>`); wsBtn(x);
    x.wsT = setTimeout(() => { if (!x.wsOk) wsMsg(x, "DID NOT START // the workstation did not answer; RELOAD to try again", "bad"); }, 12000);
  }
  function wsMsg(x, t, cls) { const m = x.b.querySelector(".dk-wsmsg"); if (!m) return; m.className = "dk-wsmsg" + (cls ? " " + cls : ""); m.firstChild.textContent = t; wsBtn(x); }
  /* RELOAD: one click on a fault or DID NOT START; on a healthy workstation a small ↻ that needs a confirming second click within 3 s */
  function wsBad(x) { const m = x.b.querySelector(".dk-wsmsg"); return !!(m && m.classList.contains("bad")); }
  function wsBtn(x) { const b = x.b.querySelector(".dk-wsmsg>button"); if (!b) return; b.hidden = false;
    if (wsBad(x)) { clearTimeout(x.wsArm); x.wsArm = 0; b.textContent = "RELOAD"; b.className = "go"; b.title = "Reload this workstation (a fresh local session)"; }
    else if (x.wsArm) { b.textContent = "RELOAD? UNSAVED WORK IS LOST"; b.className = "arm"; b.title = "Click again within 3 s to reload; unsaved work in this workstation is lost"; }
    else { b.textContent = "↻"; b.className = ""; b.title = "Reload this workstation (asks to confirm; unsaved work is lost)"; }
    b.setAttribute("aria-label", b.title); }
  function wsReload(x) {
    if (wsBad(x) || x.wsArm) { clearTimeout(x.wsArm); x.wsArm = 0; return wsLoad(x); }
    x.wsArm = setTimeout(() => { x.wsArm = 0; wsBtn(x); }, 3000); wsBtn(x);
  }
  function build(w) {
    const e = el(`<div class=dkw data-id="${w.id}" data-k="${w.k}" role=dialog><div class=dk-t><span class=dk-sw hidden></span><span class=dk-k aria-hidden=true></span><span class=dk-n></span>${w.k === "unit" ? `<span class=dk-pl hidden></span><button type=button class=dk-sz data-a=size></button>` : w.k === "group" ? `<button type=button class=dk-gcol data-a=gcol aria-haspopup=listbox aria-expanded=false></button>` : ""}<span class=dk-st hidden></span>${w.k === "sec" ? `<button type=button data-a=dock title="Dock back into the unit window" aria-label="Dock back">⇲</button>` : ""}<button type=button data-a=min title=Minimize aria-label=Minimize>_</button><button type=button data-a=max title="Maximize / restore" aria-label=Maximize>□</button><button type=button data-a=close title=Close aria-label=Close>×</button></div><div class=dk-b></div>${["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((d) => `<div class=dk-h data-d=${d}></div>`).join("")}</div>`);
    const x = { w, e, b: e.querySelector(".dk-b") };
    W.set(w.id, x); area.appendChild(e); place(x);
    if (w.k === "unit") buildUnit(x);
    if (w.k === "sec") x.b.appendChild(host(w.u, w.s));
    if (w.k === "group") x.b.innerHTML = `<div class=dk-grp></div>`;
    if (w.k === "set") x.b.innerHTML = `<div class=dk-set></div>`;
    if (w.k === "keys") x.b.innerHTML = `<div class=dk-keys></div>`;
    if (w.k === "ws") wsLoad(x);
    const [k, n] = kanjiTitle(w); e.querySelector(".dk-k").textContent = k; e.querySelector(".dk-n").textContent = n;
    if (w.z) zTop = Math.max(zTop, w.z);
    return x;
  }
  function place(x) { const w = x.w, A = areaSize(); w.w = Math.max(240, Math.min(w.w, A.w)); w.h = Math.max(90, Math.min(w.h, A.h)); w.x = Math.max(0, Math.min(w.x, A.w - 160)); w.y = Math.max(0, Math.min(w.y, A.h - 40)); // keep a grabbable piece on screen
    Object.assign(x.e.style, { left: w.x + "px", top: w.y + "px", width: w.w + "px", height: w.h + "px", zIndex: w.z || 10 }); x.e.classList.toggle("max", !!w.max); x.e.hidden = !!w.min;
    const mb = x.e.querySelector("[data-a=max]"); if (mb) { mb.textContent = w.max ? "❐" : "□"; mb.setAttribute("aria-label", w.max ? "Restore" : "Maximize"); } }
  function front(id) { const x = W.get(id); if (!x) return; if (zTop > 900) { [...W.values()].sort((a, b) => (a.w.z || 0) - (b.w.z || 0)).forEach((v, i) => { v.w.z = 10 + i; v.e.style.zIndex = v.w.z; }); zTop = 10 + W.size; }
    x.w.z = ++zTop; x.e.style.zIndex = x.w.z; W.forEach((v) => { v.e.classList.toggle("on", v === x); if (v === x) v.e.setAttribute("aria-current", "true"); else v.e.removeAttribute("aria-current"); }); paintTabs(); }
  function activeId() { let best = null; W.forEach((v) => { if (!v.e.hidden && v.e.style.display !== "none" && (!best || (v.w.z || 0) > (best.w.z || 0))) best = v; }); return best && best.w.id; }
  function detach(x) { for (const n of [...x.b.querySelectorAll("#bar,#con,#sh")]) park.appendChild(n); }
  function close(id, quiet) {
    const x = W.get(id); if (!x) return; const w = x.w;
    if (gcol && gcol.x === x) closeGcol();
    if (w.k === "unit") [...W.values()].filter((v) => v.w.k === "sec" && tabsOf(w).includes(v.w.u)).forEach((v) => close(v.w.id, true));
    detach(x); W.delete(id); x.e.remove();
    if (w.k === "sec") { const u = uwOf(w.u); if (u) paintUnitChrome(u); else HOSTS.delete(w.u + "|" + w.s); }
    if (w.k === "unit") HOSTS.forEach((h, k) => { if (tabsOf(w).some((u) => k.startsWith(u + "|")) && !h.isConnected) HOSTS.delete(k); });
    if (["enc", "term", "sheet"].includes(w.k) && !quiet) closedEngine.add(w.k);
    persist(); if (!quiet) { const a = activeId(); if (a) front(a); else paintTabs(); }
  }
  function minimize(id) { const x = W.get(id); if (!x) return; x.w.min = true; x.e.hidden = true; persist(); const a = activeId(); if (a) front(a); else paintTabs(); try { paintStat(); } catch (e) { /* ok */ } }
  function restore(id) { const x = W.get(id); if (!x) return; x.w.min = false; x.e.hidden = false; front(id); persist(); try { paintStat(); } catch (e) { /* ok */ } }
  function toggleMax(id) { const x = W.get(id); if (!x) return; x.w.max = !x.w.max; place(x); front(id); persist(); }

  /* drag by the title bar, resize from any edge or corner (scale-aware, optional 8px snap) */
  let drag = null;
  area.addEventListener("pointerdown", (e) => {
    const win = e.target.closest(".dkw"); if (!win || !area.contains(win)) return; const x = W.get(win.dataset.id); if (!x) return;
    front(x.w.id);
    const hd = e.target.closest(".dk-h"), tb = e.target.closest(".dk-t");
    if (e.button !== 0 || (!hd && !tb) || e.target.closest("button")) return;
    if (tb && x.w.max) return;
    e.preventDefault();
    drag = { x, d: hd ? hd.dataset.d : "move", sx: e.clientX, sy: e.clientY, g: { x: x.w.x, y: x.w.y, w: x.w.w, h: x.w.h } };
    try { (hd || tb).setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
    area.classList.add("dk-drag"); W.forEach((v) => v.e.classList.add("dk-drag"));
  });
  area.addEventListener("pointermove", (e) => {
    if (!drag) return; const s = P.scale || 1, dx = (e.clientX - drag.sx) / s, dy = (e.clientY - drag.sy) / s, g = drag.g, w = drag.x.w, d = drag.d;
    const sn = (v) => P.snap ? Math.round(v / 8) * 8 : Math.round(v);
    if (d === "move") { w.x = sn(g.x + dx); w.y = sn(g.y + dy); }
    else {
      if (d.includes("e")) w.w = Math.max(240, sn(g.w + dx)); if (d.includes("s")) w.h = Math.max(90, sn(g.h + dy));
      if (d.includes("w")) { const nw = Math.max(240, sn(g.w - dx)); w.x = g.x + g.w - nw; w.w = nw; }
      if (d.includes("n")) { const nh = Math.max(90, sn(g.h - dy)); w.y = g.y + g.h - nh; w.h = nh; }
    }
    snapEdges(w, d);
    place(drag.x);
  });
  const endDrag = () => { W.forEach((v) => v.e.classList.remove("dk-drag")); if (drag) { drag = null; persist(); } };
  area.addEventListener("pointerup", endDrag); area.addEventListener("pointercancel", endDrag);
  area.addEventListener("dblclick", (e) => { const t = e.target.closest(".dk-t"); if (t && !e.target.closest("button")) toggleMax(t.parentNode.dataset.id); });
  area.addEventListener("click", (e) => {
    const b = e.target.closest(".dk-t button,.dk-sh button,.dk-wsmsg button"); if (!b) return; const win = b.closest(".dkw"), id = win && win.dataset.id, x = W.get(id); if (!x) return;
    const a = b.dataset.a;
    if (x.w.k === "con" && (a === "min" || a === "close")) setTray(false);
    else if (a === "size") cyclePreset(x);
    else if (a === "gcol") { if (gcol && gcol.x === x) closeGcol(); else openGcol(x, b); }
    else if (a === "reload" && x.w.k === "ws") wsReload(x);
    else if (a === "min") minimize(id); else if (a === "max") toggleMax(id); else if (a === "close" || a === "dock") close(id);
    else if (a === "col") { const s = b.closest(".dk-seg").dataset.s; x.w.col = x.w.col || {}; x.w.col[s] = !x.w.col[s]; paintUnitChrome(x); persist(); }
    else if (a === "pop") { const s = b.closest(".dk-seg").dataset.s, A = areaSize(); open({ k: "sec", u: x.w.u, s, x: Math.min(x.w.x + 80, A.w - 560), y: Math.min(x.w.y + 50, A.h - 300) }); }
    else if (a === "dockseg") { const s = b.closest(".dk-seg").dataset.s, ex = findW((v) => v.w.k === "sec" && v.w.u === x.w.u && v.w.s === s); if (ex) close(ex.w.id); }
  });

  /* ---------- section hosts: light DOM when the unit is routed, shadow root otherwise ---------- */
  const HOSTS = new Map();
  function host(u, s) {
    const k = u + "|" + s; let h = HOSTS.get(k); if (h) return h;
    h = document.createElement("div"); h.className = "dk-sec"; h.dataset.u = u; h.dataset.s = s;
    const r = h.attachShadow({ mode: "open" }); r.adoptedStyleSheets = [shadowSheet()];
    r.innerHTML = `<div class=dk-root><div class=dk-in></div><slot></slot></div>`;
    HOSTS.set(k, h); return h;
  }
  const shIn = (h) => h.shadowRoot.querySelector(".dk-in");
  function buildUnit(x) {
    const seg = (s) => `<div class=dk-seg data-s="${s[0]}"><div class=dk-sh><span class=dk-k aria-hidden=true>${s[1]}</span><span class=dk-n>${s[2]}</span><button type=button data-a=col aria-expanded=true title="Collapse / expand">[–]</button><button type=button data-a=pop title="Pop out into its own window">⇱</button></div><div class=dk-sb></div></div>`;
    x.b.innerHTML = `<div class=dk-utabs role=tablist aria-label="Units in this window"></div><div class=dk-unit><div class=dk-col>${SEC.filter((s) => s[3] === "a").map(seg).join("")}</div><div class=dk-col>${SEC.filter((s) => s[3] === "b").map(seg).join("")}</div></div>`;
    paintUnitChrome(x);
  }
  function paintUnitTabs(x) {
    const w = x.w, bar = x.b.querySelector(".dk-utabs"); if (!bar) return; const cols = typeof SH_COL !== "undefined" ? SH_COL : [];
    const html = tabsOf(w).map((u) => { const i = idxOf(u), c = i >= 0 ? (sheets()[i].col || 0) : 0, on = u === w.u;
      return `<button type=button class="dk-ut${on ? " on" : ""}" role=tab aria-selected=${on} draggable=true data-u="${esc(u)}" title="${esc(i >= 0 ? safeLabel(i) : u)}${i >= 0 && pilotOf(i).n ? " // PILOT: " + esc(pilotOf(i).n) : ""} // drag to another unit window, or onto the desktop for a window of its own"><i style="background:${cols[c] || "#5f6366"}"></i><em class=pf aria-hidden=true></em><span>${esc(i >= 0 ? safeLabel(i) : "UNIT")}</span>${i >= 0 ? pilotTag(i, "dk-pil") : ""}<b data-ux=1 title="Close this tab" aria-label="Close tab">×</b></button>`; }).join("");
    if (bar.dataset.sig !== html) { bar.innerHTML = html; bar.dataset.sig = html; }
    markActing();
  }
  /* the acting unit (S.cur: what console commands and engine actions use) is marked on its tab and in the status bar */
  function markActing() {
    const ck = curKey();
    document.querySelectorAll("#dkarea .dk-ut").forEach((t) => { const a = t.dataset.u === ck; t.classList.toggle("act", a); const pf = t.querySelector(".pf"); if (pf && pf.textContent !== (a ? "▶ " : "")) pf.textContent = a ? "▶ " : ""; const tt = (a ? "ACTING UNIT // " : "") + t.title.replace(/^ACTING UNIT \/\/ /, ""); if (t.title !== tt) t.title = tt; });
    try { paintStat(); } catch (e) { /* ok */ }
  }
  function setTab(x, u) { if (!tabsOf(x.w).includes(u)) return; x.w.u = u; route(u); persist(); sync(); }
  function dropTab(x, u) { // remove a tab from its window; the last tab closes the window
    [...W.values()].filter((v) => v.w.k === "sec" && v.w.u === u).forEach((v) => close(v.w.id, true));
    const t = tabsOf(x.w).filter((k) => k !== u); if (!t.length) { x.w.tabs = []; close(x.w.id); return; }
    const j = tabsOf(x.w).indexOf(u); x.w.tabs = t; if (x.w.u === u) x.w.u = t[Math.min(j, t.length - 1)];
  }
  function moveTab(fromId, u, toId, at) { // drag a tab into another unit window, or (toId null) onto the desktop: a window of its own there
    const f = W.get(fromId); if (!f || !tabsOf(f.w).includes(u)) return; let t = toId ? W.get(toId) : null;
    if (t === f) return; if (!t && tabsOf(f.w).length === 1) { if (at) { f.w.x = at.x; f.w.y = at.y; place(f); } front(f.w.id); persist(); return; }
    const sc = (f.w.col && Object.assign({}, f.w.col)) || {};
    f.w.tabs = tabsOf(f.w).filter((k) => k !== u); if (f.w.u === u) f.w.u = f.w.tabs[0];
    if (!f.w.tabs.length) { W.delete(f.w.id); f.e.remove(); }
    if (t) { t.w.tabs = tabsOf(t.w).concat(u); t.w.u = u; }
    else { const g = defGeo("unit"); t = build(Object.assign({ id: nid() }, g, at ? { x: at.x, y: at.y } : {}, { k: "unit", u, tabs: [u], c: null, col: sc })); }
    front(t.w.id); route(u); persist(); sync();
  }
  function paintUnitChrome(x) {
    const w = x.w; w.col = w.col || {}; paintUnitTabs(x);
    x.b.querySelectorAll(".dk-seg").forEach((sg) => {
      const s = sg.dataset.s, popped = !!findW((v) => v.w.k === "sec" && v.w.u === w.u && v.w.s === s), inGrp = !popped && groupHolder(w.u, s), sb = sg.querySelector(".dk-sb");
      sg.classList.toggle("col", !!w.col[s]); const cb = sg.querySelector("[data-a=col]"); cb.textContent = w.col[s] ? "[+]" : "[–]"; cb.setAttribute("aria-expanded", String(!w.col[s]));
      const pb = sg.querySelector("[data-a=pop],[data-a=dockseg]");
      if (popped) { pb.dataset.a = "dockseg"; pb.textContent = "⇲"; pb.title = "Dock back into this window"; if (!sb.querySelector(".dk-ph")) sb.innerHTML = `<div class=dk-ph>⇱ POPPED OUT INTO ITS OWN WINDOW // ⇲ docks it back</div>`; }
      else { pb.dataset.a = "pop"; pb.textContent = "⇱"; pb.title = "Pop out into its own window";
        if (inGrp) { const ph = `<button type=button class=dk-back data-gback="${esc(inGrp.w.id)}" title="Bring the section back into this unit window (same as [OPEN ↗] in the group)">◀ IN UNIT GROUP // ${esc(COLN[inGrp.w.c || 0] || "NONE")} — click to bring back</button>`; if (sb.dataset.ph !== ph || !sb.querySelector(".dk-back")) { sb.innerHTML = ph; sb.dataset.ph = ph; } }
        else { const h = host(w.u, s); if (h.parentNode !== sb) sb.replaceChildren(h); } }
    });
  }

  /* ---------- unit rendering: every unit from its own sheet data, through the engine's (and bridge's) own views ---------- */
  const CACHE = new Map();
  function renderUnit(i) {
    const sh = sheets()[i], cur = i === S.cur, kc = S.cur; let keep = null;
    if (!cur) { keep = shSnap(); S.cur = i; let d; try { d = structuredClone(sh.d || {}); } catch (e) { d = JSON.parse(JSON.stringify(sh.d || {})); } shApply(d); }
    try {
      let t = null; try { t = tel(); } catch (e) { t = null; }
      if (!t || !S.ch) return { empty: true, name: safeLabel(i), col: sh.col || 0 };
      const out = S.info != null ? infoView() : sortieView();
      const shh = realSheet(); const ro = document.body.classList.contains("mp-view");
      let st = ["--", "dim"], ig = ""; try { st = frameStatus(); ig = igOf(); } catch (e) { /* empty */ }
      return { out, sh: shh, ro, st, ig, name: safeLabel(i), col: sh.col || 0 };
    } catch (e) { console.error("[desk] render", e); return { empty: true, err: String(e && e.message || e), name: safeLabel(i), col: sh.col || 0 }; }
    finally { if (!cur) { S.cur = kc; shApply(keep); } }
  }
  /* r3 pilot / owner beside the mech name: a seated client in their member colour, a host-made pilot in the tab colour,
     Open / Closed / Unknown / LOCAL in grey (live table: the bridge's mpPilotOf; solo: the sheet's own pilot field) */
  const GREYP = /^(open|closed|unknown|local|unassigned|none|-+)?$/i;
  function pilotOf(i) {
    const sh = sheets()[i]; if (!sh) return { n: "", c: "" };
    try { if (typeof window.mpPilotOf === "function") { const r = window.mpPilotOf(i); if (r && r.n) return r; } } catch (e) { /* ok */ }
    if (sh.closed) return { n: "Closed", c: "var(--muted)", g: 1 };
    let n = ""; try { n = String(((sh.d && sh.d.own) != null ? sh.d.own : (i === S.cur ? S.own : "")) || "").trim(); } catch (e) { /* ok */ }
    if (GREYP.test(n)) return { n: n && !/^-+$/.test(n) ? n.toUpperCase() : "LOCAL", c: "var(--muted)", g: 1 };
    const col = typeof SH_COL !== "undefined" ? SH_COL[sh.col || 0] : ""; return { n, c: col || "var(--muted)" };
  }
  function pilotTag(i, cls) { const p = pilotOf(i); return p.n ? `<em class="${cls}${p.g ? " g" : ""}" style="color:${p.c}" title="Pilot: ${esc(p.n)}">${esc(p.n)}</em>` : ""; }
  /* r3/r4 size presets on the unit title bar: LARGE = the full sheet, sized so the left panel (doll, impact, rolls with skill
     inputs collapsed) is exactly the window height and the doll is side-by-side (1120 wide); SMALL = doll-focused, 620 wide, down to IMPACT RESOLUTION */
  const PZN = { L: ["LARGE", "full sheet"], S: ["SMALL", "doll-focused"] };
  function bottomIn(b, e) { const s = P.scale || 1; return (e.getBoundingClientRect().bottom - b.getBoundingClientRect().top) / s + b.scrollTop; }
  function encFloor() { // keep unit windows below the ENCOUNTER bar (Misaki r4)
    const A = areaSize(), en = findW((v) => v.w.k === "enc");
    if (en && !en.w.min && !en.e.hidden && en.e.style.display !== "none") return Math.min(en.w.y + en.w.h + 8, A.h - 200);
    return 0;
  }
  function applyPreset(x, pz, auto) {
    const w = x.w, A = areaSize(); w.pz = pz; w.max = false; x.e.classList.remove("max");
    w.w = Math.round(pz === "S" ? Math.min(PZW.S, A.w - 16) : Math.min(PZW.L, A.w - 16)); w.x = Math.max(0, Math.min(w.x, A.w - w.w));
    w.h = A.h; place(x); const b = x.b; b.scrollTop = 0;
    const head = x.e.querySelector(".dk-t").offsetHeight * 1, padB = parseFloat(getComputedStyle(b).paddingBottom) || 0, s = P.scale || 1;
    let bot = 0; const imp = b.querySelector(".dk-seg[data-s=impact]") || b.querySelector(".dk-seg[data-s=doll]"), impH = Math.ceil(head + (imp ? bottomIn(b, imp) : 460) + padB + 2);
    if (pz === "S") bot = imp ? bottomIn(b, imp) : 460;
    else { const col = b.querySelector(".dk-col"); bot = col ? bottomIn(b, col) : A.h;
      const h = HOSTS.get(w.u + "|rolls"), pg = h && (h.querySelector(".pilot>.pg,.pg") || shIn(h).querySelector(".pilot>.pg,.pg"));
      if (pg && pg.getClientRects().length) bot -= pg.getBoundingClientRect().height / s; }
    w.h = Math.max(160, Math.min(A.h, Math.ceil(head + bot + padB + (pz === "L" ? 6 : 2)))); // LARGE: +4 so the [APPLY] row is never clipped
    /* stay below the ENCOUNTER window (the size button used to jump to y=0 and cover it on short desktops);
       a new window also keeps its cascade step (the tabs of the window behind stay visible) */
    let floor = encFloor(); floor = Math.max(floor, Math.min(w.y, A.h - 360));
    if (auto && pz === "L" && impH > A.h - floor) return applyPreset(x, "S", auto); // too short for LARGE with IMPACT RESOLUTION showing: open SMALL instead
    const need = Math.min(w.h, impH); // lift only as far as needed to show IMPACT RESOLUTION
    if (w.y + need > A.h) w.y = Math.max(floor, A.h - need);
    w.y = Math.max(w.y, 0); w.h = Math.min(w.h, A.h - w.y);
    place(x); persist(); paintSize(x);
  }
  function cyclePreset(x) { applyPreset(x, x.w.pz === "L" ? "S" : "L"); }
  function paintSize(x) { const b = x.e.querySelector(".dk-sz"); if (!b) return; const c = x.w.pz || "", n = c === "L" ? "S" : "L";
    b.textContent = c === "S" ? "▭ SM" : "▣ LG"; b.dataset.pz = c;
    b.title = `Size preset${c ? ": " + PZN[c][0] + " (" + PZN[c][1] + ")" : ""} // click for ${PZN[n][0]} (${PZN[n][1]})`; b.setAttribute("aria-label", b.title); }
  function splitUnit(r) {
    const o = { doll: [], impact: [], rolls: [], sheet: [], loadout: [] };
    if (r.empty) { o.doll.push(el(`<div class=dk-ph>${r.err ? "RENDER FAULT // " + esc(r.err) : "NO TELEMETRY // load a frame manifest for this unit"}</div>`)); }
    else {
      const T = document.createElement("template"); T.innerHTML = r.out; let past = false;
      for (const n of [...T.content.childNodes]) {
        if (n.nodeType !== 1) { if (n.textContent.trim()) o.impact.push(n); continue; }
        const c = n.classList;
        if (c.contains("pilot")) o.rolls.push(n); // r3: skill inputs (collapsible, collapsed in play) and the roll buttons are one section
        else if (!past && !c.contains("damagebox")) { o.doll.push(n); if (c.contains("sorfoot")) past = true; }
        else { past = true; o.impact.push(n); }
      }
      const T2 = document.createElement("template"); T2.innerHTML = r.sh || ""; let lo = false;
      for (const n of [...T2.content.childNodes]) {
        if (!lo && n.nodeType === 1 && n.classList.contains("shh")) { const k = n.querySelector(".shtl"); if (k && k.dataset.k && k.dataset.k !== "CH") lo = true; }
        (lo ? o.loadout : o.sheet).push(n);
      }
    }
    /* r3: the shield tiles ride up onto the paper doll (its empty bottom-left corner), so a shield adds no height */
    { const mm = o.doll.find((n) => n.classList && n.classList.contains("sorhead") === false && n.querySelector && (n.matches(".mechmap") || n.querySelector(".mechmap")));
      const ft = o.doll.find((n) => n.classList && n.classList.contains("sorfoot")), row = ft && ft.querySelector(":scope>.shieldrow");
      const map = mm && (mm.matches(".mechmap") ? mm : mm.querySelector(".mechmap"));
      if (row && map && row.children.length) { const w = document.createElement("div"); w.className = "sorfoot dk-shup"; w.appendChild(row); map.appendChild(w); } }
    const ro = () => el(`<div class=dk-ph>VIEW ONLY // the host or this unit's assigned pilot rolls and edits here</div>`);
    if (!r.empty) { if (!o.rolls.length) o.rolls.push(ro()); if (!o.impact.length) o.impact.push(el(`<div class=dk-ph>--</div>`)); }
    return o;
  }
  const FQ = "input,select,textarea,button,[tabindex]";
  function fsnap() {
    let a = document.activeElement, h = null;
    if (a && a.classList && a.classList.contains("dk-sec")) { h = a; a = a.shadowRoot.activeElement; } else h = a && a.closest ? a.closest(".dk-sec") : null;
    if (!h || !a) return null; const r = h.shadowRoot.contains(a) ? shIn(h) : h;
    return { k: h.dataset.u + "|" + h.dataset.s, i: [...r.querySelectorAll(FQ)].indexOf(a), skill: a.dataset ? a.dataset.skill : null, sel: typeof a.selectionStart === "number" ? [a.selectionStart, a.selectionEnd] : null };
  }
  function frestore(f) {
    if (!f) return; const ae = document.activeElement;
    if (ae && ae !== document.body && ae.isConnected && !(ae.closest && ae.closest("#dkpark")) && !ae.classList.contains("dk-sec")) return;
    const h = HOSTS.get(f.k); if (!h || !h.isConnected) return; const r = h.firstChild ? h : shIn(h);
    let t = f.skill ? r.querySelector(`[data-skill="${CSS.escape(f.skill)}"]`) : null;
    if (!t && f.i >= 0) t = [...r.querySelectorAll(FQ)][f.i];
    if (!t) return; try { t.focus({ preventScroll: true }); if (f.sel && t.setSelectionRange) t.setSelectionRange(f.sel[0], f.sel[1]); } catch (e) { /* ok */ }
  }
  const seen = new Set();
  function autoOpen() {
    const me = window.__forgeSelf || "", mp = document.body.classList.contains("mp-live");
    const isHost = mp && !!window.__forgeHost;
    const opened = (k) => [...W.values()].some((v) => v.w.k === "unit" && tabsOf(v.w).includes(k));
    const tabN = () => [...W.values()].filter((v) => v.w.k === "unit").reduce((a, v) => a + tabsOf(v.w).length, 0);
    const must = [], rest = [];
    const actingK = (S.cur != null && sheets()[S.cur]) ? ukey(sheets()[S.cur]) : curKey();
    sheets().forEach((sh) => {
      const k = ukey(sh); if (!vis(sh) || !k) return;
      if (opened(k)) { seen.add(k); return; }
      if (seen.has(k)) return;
      const own = !!(mp && me && sh.ownerId === me);
      const hostUnowned = !!(isHost && !sh.ownerId);
      if (own || hostUnowned || k === actingK) must.push(k); else rest.push(k);
    });
    const cap = mp ? 2 : 6;
    const openOne = (k) => { open({ k: "unit", u: k }, false); seen.add(k); };
    must.forEach(openOne);
    rest.forEach((k) => { if (tabN() < cap) openOne(k); });
  }
  function renderUnits(pre) {
    const all = sheets();
    try { if (all.length && S.cur != null && all[S.cur]) shSave(); } catch (e) { /* ok */ }
    autoOpen();
    const c = sheets()[S.cur]; if (c && !uwOf(ukey(c))) open({ k: "unit", u: ukey(c) }, false);
    [...W.values()].forEach((v) => { if (v.w.k === "unit") tabsOf(v.w).filter((u) => idxOf(u) < 0).forEach((u) => dropTab(v, u)); });
    [...W.values()].forEach((v) => { if (v.w.k === "sec" && idxOf(v.w.u) < 0) close(v.w.id, true); });
    const ck = curKey(), need = new Set([...W.values()].filter((v) => v.w.k === "unit" || v.w.k === "sec" || (v.w.k === "group" && v.w.sel)).flatMap((v) => v.w.k === "group" ? [v.w.sel] : v.w.k === "unit" ? tabsOf(v.w) : [v.w.u]));
    const gcols = new Set([...W.values()].filter((v) => v.w.k === "group").map((v) => v.w.c || 0));
    const sheet = shadowSheet(); CACHE.clear();
    all.forEach((sh, i) => {
      const k = ukey(sh); if (!vis(sh) || (!need.has(k) && !gcols.has(sh.col || 0))) return;
      if (i === S.cur && pre && pre.k === k && pre.hp) S.uiHP = pre.hp;
      const r = renderUnit(i); CACHE.set(k, r);
      if (!need.has(k)) return;
      const parts = splitUnit(r), light = k === ck;
      for (const s of SEC) {
        const h = host(k, s[0]); if (h.shadowRoot.adoptedStyleSheets[0] !== sheet) h.shadowRoot.adoptedStyleSheets = [sheet];
        h.dataset.ro = r.ro ? "1" : ""; mirrorBody(h.shadowRoot.firstElementChild, !!r.ro);
        if (light) { shIn(h).replaceChildren(); h.replaceChildren(...parts[s[0]]); }
        else { h.replaceChildren(); shIn(h).replaceChildren(...parts[s[0]]); shIn(h).querySelectorAll(".hpfill[data-target]").forEach((f) => { f.style.width = f.dataset.target + "%"; }); }
      }
    });
    const cr = ck && CACHE.get(ck); if (cr) document.body.classList.toggle("mp-view", !!cr.ro);
    try { animateHpBars(); } catch (e) { /* ok */ }
    try { shCrawl(); } catch (e) { /* ok */ }
  }

  /* route: the touched unit becomes S.cur; nothing re-renders. Its nodes move from its shadow roots to the light DOM
     (light ids), the previous unit's nodes move back. A pointer press defers the node move to the click's capture
     phase (the click path is fixed by then) so moving the pressed node never swallows the click. */
  function settle() {
    mvPend = false; const ck = curKey();
    HOSTS.forEach((h, key) => {
      const mine = !!ck && key.startsWith(ck + "|");
      if (!mine && h.firstChild) shIn(h).replaceChildren(...h.childNodes);
      else if (mine && shIn(h).firstChild) h.replaceChildren(...shIn(h).childNodes);
    });
  }
  let mvPend = false;
  function route(k, later) {
    const i = idxOf(k); if (i < 0 || i === S.cur) { if (!later && mvPend) settle(); return false; }
    const old = curKey();
    /* commit a pending change on the old unit's field before switching, so its handler writes to the right unit */
    const ae = document.activeElement; if (old && ae && ae !== document.body) { const hh = ae.closest && ae.closest(".dk-sec"); if (hh && hh.dataset.u === old) { try { ae.blur(); } catch (e) { /* ok */ } } }
    if (i === S.cur) return false;
    try { shSave(); } catch (e) { /* ok */ }
    S.cur = i; shApply(S.sheets[i].d); S.shEdit = -1;
    if (later) mvPend = true; else settle();
    const r = CACHE.get(k); document.body.classList.toggle("mp-view", !!(r && r.ro)); markActing();
    return true;
  }
  let pdown = false, pend = false;
  document.addEventListener("pointerdown", () => { pdown = true; }, true);
  document.addEventListener("click", () => { if (mvPend) settle(); }, true);
  addEventListener("pointerup", () => setTimeout(() => { if (mvPend) { const t = document.activeElement; settle(); if (t && t.isConnected && document.activeElement !== t) try { t.focus({ preventScroll: true }); } catch (_) { /* ok */ } } }, 0), true);
  function onTouch(e) {
    const path = e.composedPath ? e.composedPath() : [];
    const h = path.find((n) => n && n.classList && n.classList.contains("dk-sec")); if (!h) return;
    const t = path[0];
    if (e.type === "pointerdown") { route(h.dataset.u, true); return; }
    if (pdown && mvPend) return;
    if (route(h.dataset.u) && t && t.isConnected && document.activeElement !== t) { try { t.focus({ preventScroll: true }); } catch (_) { /* ok */ } }
  }
  document.addEventListener("pointerdown", onTouch, true);
  document.addEventListener("focusin", onTouch, true);

  /* ---------- unit group windows ---------- */
  /* A group window shows every unit with its tab colour as a mini paper-doll card. One click selects a card: that unit's
     own PAPER DOLL and IMPACT RESOLUTION sections move into the group's SELECTED UNIT area (live, routed and guarded like
     any unit window; the unit window, if open, shows a placeholder). [OPEN ↗] or a double-click opens the full unit window. */
  const GSEC = ["doll", "impact"];
  function groupHolder(u, s) { // which group window shows this unit's section (a popped-out section window wins)
    if (!GSEC.includes(s) || findW((v) => v.w.k === "sec" && v.w.u === u && v.w.s === s)) return null;
    const open = !!findW((v) => v.w.k === "unit" && v.w.u === u); // opened from the group ([OPEN ↗] / double-click): the full window gets them
    return findW((v) => v.w.k === "group" && v.w.sel === u && !v.w.min && !(v.w.selOut && open)) || null;
  }
  function openFromGroup(x, u) { // full unit window at the doll-wide default (SMALL: 620 wide, labels both sides, shield row)
    if (idxOf(u) < 0) return; x.w.sel = u; x.w.selOut = true; const ex = uwOf(u); if (ex) { ex.w.u = u; restore(ex.w.id); route(u); persist(); sync(); return; } // focus its tab
    const A = areaSize(), n = [...W.values()].filter((v) => v.w.k === "unit").length % 6;
    open({ k: "unit", u, x: Math.max(ICOL, Math.min(x.w.x - (PZW.S + 20), A.w - PZW.S - ICOL)) + 24 * n, y: Math.max(encFloor(), 8) + 24 * n, w: PZW.S, h: 500, pz: "S" }); sync(); // r3/r4: SMALL preset below ENCOUNTER, tall enough for IMPACT RESOLUTION, wide enough for a side-by-side doll
  }
  function miniCard(sh, i, selK) {
    const k = ukey(sh); let r = CACHE.get(k); if (!r && S.view === "sortie") { r = renderUnit(i); CACHE.set(k, r); } if (!r) r = { empty: true, name: safeLabel(i) };
    /* mini doll: the unit's own map wrapper (keeps its tab-colour palette, data-tt), without the selected-part highlight */
    let svg = "", mcls = "", tt = ""; if (!r.empty) { const T = document.createElement("template"); T.innerHTML = r.out; const s = T.content.querySelector(".mechmap svg,.vehmap svg,svg");
      if (s) { const m = s.closest(".mechmap,.vehmap"); if (m) { mcls = [...m.classList].filter((c) => c === "mechmap" || c === "vehmap").join(" "); tt = m.getAttribute("data-tt") || ""; }
        s.querySelectorAll("[onclick],[data-menu],[id]").forEach((n) => { n.removeAttribute("onclick"); n.removeAttribute("data-menu"); n.removeAttribute("id"); });
        s.querySelectorAll(".sel,.ld.on").forEach((n) => { n.classList.remove("sel", "on"); if (n.classList.contains("mz")) { n.style.stroke = "var(--ac,#2ee6e6)"; n.style.strokeWidth = "1.3"; } });
        svg = s.outerHTML; } }
    const st = r.st || ["--", "dim"];
    const p = pilotOf(i), show = !!(p.n && !p.g), pil = show ? `<em class="dk-pil" style="color:${p.c}" title="// PILOT: ${esc(p.n)}">${esc(p.n)}</em>` : "";
    return `<button type=button class="dk-card${k === selK ? " on" : ""}" data-u="${esc(k)}" aria-pressed=${k === selK} title="${esc(r.name)}${show ? " // PILOT: " + esc(p.n) : ""} // click: select, double-click: open the unit window"><span class="doll${mcls ? " dk-mini " + mcls : ""}"${tt ? ` data-tt="${esc(tt)}"` : ""} aria-hidden=true>${svg || "<span class=dim>NO TELEMETRY</span>"}</span><span class=nm2>${esc(r.name)}${pil}</span><span class=cd>STATUS <b class="${esc(st[1])}">${esc(st[0])}</b>${r.ig !== "" && r.ig != null ? `<br><span class=dim>INTEGRITY ${esc(r.ig)}%</span>` : ""}</span></button>`;
  }

  let gcol = null; // title-bar tab-colour dropdown for group windows
  function closeGcol() {
    if (!gcol) return;
    document.removeEventListener("keydown", gcol.onKey, true);
    document.removeEventListener("pointerdown", gcol.onPtr, true);
    if (gcol.menu) gcol.menu.remove();
    if (gcol.btn) { gcol.btn.setAttribute("aria-expanded", "false"); gcol.btn.removeAttribute("aria-controls"); }
    gcol = null;
  }
  function openGcol(x, btn) {
    closeGcol();
    front(x.w.id);
    const cols = typeof SH_COL !== "undefined" ? SH_COL : ["", "#2ee6e6", "#b57bff", "#ff5a5a", "#ffd23a", "#4ade80"];
    const c = x.w.c || 0;
    const menu = el(`<div class=dk-gcol-menu role=listbox id=dkgcol aria-label="Tab colour"></div>`);
    cols.forEach((h, i) => {
      const b = el(`<button type=button role=option data-c=${i} class="${i === c ? "on" : ""}" aria-selected=${i === c}><i style="color:${h || "#5f6366"};background:${h || "transparent"}"></i>${COLN[i] || i}</button>`);
      b.addEventListener("click", (e) => { e.stopPropagation(); x.w.c = i; closeGcol(); persist(); sync(); });
      menu.appendChild(b);
    });
    (document.getElementById("dk") || document.body).appendChild(menu);
    const s = P.scale || 1, r = btn.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight, vw = window.innerWidth / s, vh = window.innerHeight / s;
    let left = r.left / s, top = r.bottom / s + 2;
    if (left + mw > vw - 4) left = Math.max(4, r.right / s - mw);
    if (top + mh > vh - 4) top = Math.max(4, r.top / s - mh - 2);
    Object.assign(menu.style, { left: Math.round(left) + "px", top: Math.round(top) + "px" });
    btn.setAttribute("aria-expanded", "true"); btn.setAttribute("aria-controls", "dkgcol");
    const opts = [...menu.querySelectorAll("button")];
    const focusI = (i) => { opts[(i + opts.length) % opts.length].focus(); };
    const onKey = (e) => {
      if (!gcol) return;
      if (e.key === "Escape") { e.preventDefault(); closeGcol(); btn.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); const i = opts.indexOf(document.activeElement); focusI(i < 0 ? 0 : i + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); const i = opts.indexOf(document.activeElement); focusI(i < 0 ? opts.length - 1 : i - 1); }
      else if (e.key === "Home") { e.preventDefault(); focusI(0); }
      else if (e.key === "End") { e.preventDefault(); focusI(opts.length - 1); }
    };
    const onPtr = (e) => { if (gcol && !e.target.closest(".dk-gcol-menu,.dk-gcol")) closeGcol(); };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPtr, true);
    gcol = { x, menu, btn, onKey, onPtr };
    const cur = menu.querySelector("button.on") || opts[0]; if (cur) cur.focus();
  }
  function paintGroup(x) {
    const c = x.w.c || 0, g = x.b.querySelector(".dk-grp"); if (!g) return;
    if (!g.firstChild) g.innerHTML = `<div class=dk-cards></div><div class=dk-gsel><div class=dk-sh><span class=dk-k aria-hidden=true>選</span><span class=dk-n>SELECTED UNIT</span><button type=button data-g=open title="Open the full unit window">[OPEN ↗]</button><button type=button data-g=clr title="Clear the selection" aria-label="Clear the selection">×</button></div><div class=dk-gsb data-s=doll></div><div class=dk-gsb data-s=impact></div><div class=dk-ph data-g=none>SELECT A UNIT CARD // its paper doll and impact resolution open here; double-click a card or [OPEN ↗] for the full unit window</div></div>`;
    const list = sheets().map((sh, i) => [sh, i]).filter(([sh]) => vis(sh) && (sh.col || 0) === c);
    if (x.w.sel && !list.some(([sh]) => ukey(sh) === x.w.sel)) x.w.sel = null;
    const cardsHtml = list.map(([sh, i]) => miniCard(sh, i, x.w.sel)).join("") || `<div class=dk-ph>NO UNITS WITH THIS TAB COLOUR</div>`;
    const cd = g.querySelector(".dk-cards"); if (cd.dataset.sig !== cardsHtml) { cd.innerHTML = cardsHtml; cd.dataset.sig = cardsHtml; } // unchanged cards stay put (double-click)
    const u = x.w.sel, i = u ? idxOf(u) : -1, gs = g.querySelector(".dk-gsel");
    gs.classList.toggle("has", i >= 0); gs.querySelector(".dk-sh .dk-n").textContent = i >= 0 ? "SELECTED UNIT // " + safeLabel(i) : "SELECTED UNIT";
    gs.querySelectorAll(".dk-gsb").forEach((sb) => {
      const s = sb.dataset.s; if (i < 0) { if (sb.firstChild) sb.replaceChildren(); return; }
      if (groupHolder(u, s) === x) { const h = host(u, s); if (h.parentNode !== sb) sb.replaceChildren(h); }
      else { const why = findW((v) => v.w.k === "sec" && v.w.u === u && v.w.s === s) ? "POPPED OUT INTO ITS OWN WINDOW" : x.w.selOut ? "OPEN IN ITS UNIT WINDOW <button type=button data-g=here title=\"Show it in this group window again\">[SHOW HERE]</button>" : "SHOWN IN ANOTHER UNIT GROUP WINDOW";
        const ph = `<div class=dk-ph>${(SECN[s] || [])[2]} // ${why}</div>`; if (sb.dataset.ph !== ph || !sb.querySelector(".dk-ph")) { sb.innerHTML = ph; sb.dataset.ph = ph; } }
    });
  }
  area.addEventListener("click", (e) => {
    const g = e.target.closest(".dk-grp"); if (!g) return; const x = W.get(g.closest(".dkw").dataset.id); if (!x) return;
    const gb = e.target.closest("button[data-g]"); if (gb) { if (gb.dataset.g === "open") openFromGroup(x, x.w.sel); else { if (gb.dataset.g === "clr") x.w.sel = null; x.w.selOut = false; persist(); sync(); } return; }
    const card = e.target.closest(".dk-card"); if (card && idxOf(card.dataset.u) >= 0 && (x.w.sel !== card.dataset.u || x.w.selOut)) { x.w.sel = card.dataset.u; x.w.selOut = false; persist(); sync(); }
  });
  area.addEventListener("click", (e) => { const b = e.target.closest(".dk-back[data-gback]"); if (!b) return; const g = W.get(b.dataset.gback), x = W.get(b.closest(".dkw").dataset.id); if (g && x) openFromGroup(g, x.w.u); });
  /* unit tabs: click activates (that unit acts), × closes the tab, drag moves it to another unit window or onto the desktop */
  area.addEventListener("click", (e) => { const t = e.target.closest(".dk-ut"); if (!t) return; const x = W.get(t.closest(".dkw").dataset.id); if (!x) return;
    if (e.target.closest("[data-ux]")) { dropTab(x, t.dataset.u); persist(); sync(); return; } setTab(x, t.dataset.u); });
  const TT = "application/x-forge-tab"; let tdrag = null;
  area.addEventListener("dragstart", (e) => { const t = e.target.closest && e.target.closest(".dk-ut"); if (!t) return; tdrag = { from: t.closest(".dkw").dataset.id, u: t.dataset.u }; e.dataTransfer.setData(TT, JSON.stringify(tdrag)); e.dataTransfer.effectAllowed = "move"; document.body.classList.add("dk-tdrag"); });
  document.addEventListener("dragend", () => { tmark(null); tdrag = null; document.body.classList.remove("dk-tdrag"); document.querySelectorAll(".dkw.dk-tdrop").forEach((n) => n.classList.remove("dk-tdrop")); });
  document.addEventListener("dragover", (e) => { if (!tdrag && !(e.dataTransfer && [...e.dataTransfer.types].includes(TT))) return; const w = e.target.closest && e.target.closest(".dkw");
    if (w && w.dataset.k !== "unit") return; if (!w && !(e.target.closest && e.target.closest("#dk"))) return; e.preventDefault(); e.dataTransfer.dropEffect = "move";
    document.querySelectorAll(".dkw.dk-tdrop").forEach((n) => { if (n !== w) n.classList.remove("dk-tdrop"); }); if (w) w.classList.add("dk-tdrop");
    tmark(w ? null : e); });
  function tmark(e) { // dashed marker where a tab dropped on the empty desktop will land
    let m = document.getElementById("dktmark"); if (!e) { if (m) m.remove(); return; }
    if (!m) { m = el(`<div id=dktmark class=dk-tdrop aria-hidden=true></div>`); area.appendChild(m); }
    const r = area.getBoundingClientRect(), z = parseFloat(getComputedStyle(document.getElementById("dk")).zoom) || 1, A = areaSize();
    const x = Math.max(0, Math.min(Math.round(e.clientX / z - r.left / z - 40), A.w - 320)), y = Math.max(0, Math.min(Math.round(e.clientY / z - r.top / z - 10), A.h - 120)); // marker kept fully on screen
    const f = tdrag && W.get(tdrag.from), solo = f && tabsOf(f.w).length === 1, t = solo ? "DROP: MOVE WINDOW HERE" : "DROP: NEW WINDOW";
    m.style.left = x + "px"; m.style.top = y + "px"; if (m.textContent !== t) m.textContent = t;
  }
  document.addEventListener("drop", (e) => { let d = tdrag; try { d = JSON.parse(e.dataTransfer.getData(TT)) || d; } catch (_) { /* ok */ } if (!d) return;
    const w = e.target.closest && e.target.closest(".dkw"); if (w && w.dataset.k !== "unit") return; e.preventDefault(); tmark(null); document.querySelectorAll(".dkw.dk-tdrop").forEach((n) => n.classList.remove("dk-tdrop"));
    const r = area.getBoundingClientRect(), z = parseFloat(getComputedStyle(document.getElementById("dk")).zoom) || 1;
    moveTab(d.from, d.u, w ? w.dataset.id : null, w ? null : { x: Math.round(e.clientX / z - r.left / z - 40), y: Math.round(e.clientY / z - r.top / z - 10) }); });
  area.addEventListener("dblclick", (e) => { const card = e.target.closest(".dk-grp .dk-card"); if (!card) return; const x = W.get(card.closest(".dkw").dataset.id); if (x) openFromGroup(x, card.dataset.u); });

  /* ---------- settings ---------- */
  function paintSettings(x) {
    const s = x.b.querySelector(".dk-set"); if (!s) return; const ti = typeof themeIdx === "number" ? themeIdx : 0;
    const th = (typeof THEMES !== "undefined" ? THEMES : []).map((t, i) => `<button type=button data-th=${i} class="${i === ti ? "on" : ""}" aria-pressed=${i === ti}>${esc(t[1])}${THEME_HINT[t[0]] ? " // " + THEME_HINT[t[0]] : ""}</button>`).join("");
    const muted = typeof audioMuted !== "undefined" ? audioMuted : true;
    const sc = [0.8, 0.9, 1, 1.1, 1.25, 1.5].map((v) => `<button type=button data-sc=${v} class="${Math.abs(v - P.scale) < .01 ? "on" : ""}" aria-pressed=${Math.abs(v - P.scale) < .01}>${Math.round(v * 100)}%</button>`).join("");
    const slots = [1, 2, 3, 4, 5].map((n) => { const o = P.slots[n]; return `<div class=slot><b>${n}</b><span class=dim2>${o ? esc(o.name) : "EMPTY"}</span><button type=button data-ss=${n}>SAVE</button><button type=button data-sl=${n} ${o ? "" : "disabled"}>LOAD</button></div>`; }).join("");
    s.innerHTML = `<fieldset><legend>THEME // RESTYLES THE DESKTOP</legend><div class=row2>${th}</div></fieldset>
<fieldset><legend>AUDIO</legend><div class=row2><button type=button data-au=1 class="${muted ? "" : "on"}" aria-pressed=${!muted}>${muted ? "[AUDIO: MUTED]" : "[AUDIO: ON]"}</button><span class=dim2>terminal audio feedback</span></div></fieldset>
<fieldset><legend>UI SCALE</legend><div class=row2>${sc}</div></fieldset>
<fieldset><legend>LAYOUT SLOTS</legend>${slots}<div class=dim2>A slot keeps every open window: position, size, collapsed and popped-out sections, unit groups.</div></fieldset>
<fieldset><legend>DESKTOP</legend><div class=row2><button type=button data-snap=1 class="${P.snap ? "on" : ""}" aria-pressed=${!!P.snap}>SNAP TO 8PX GRID: ${P.snap ? "ON" : "OFF"}</button><button type=button data-reset=1>RESET LAYOUT</button><button type=button data-classic=1 title="The v5.5.5 single-page layout (reloads the page)">CLASSIC LAYOUT</button></div></fieldset>
<div class=dim2>FORGE-OS v${BUILD} // rules engine v${typeof APP_VERSION !== "undefined" ? APP_VERSION : "?"}</div>`;
  }
  area.addEventListener("click", (e) => {
    const s = e.target.closest(".dk-set"); if (!s) return; const b = e.target.closest("button"); if (!b) return; const x = W.get(s.closest(".dkw").dataset.id);
    if (b.dataset.th != null) { themeIdx = +b.dataset.th; try { localStorage.setItem("forgeTheme", themeIdx); } catch (_) { /* ok */ } applyTheme(); W.forEach((v) => { if (v.w.k === "ws") { try { wsWin(v.w).__dkTheme(themeIdx); } catch (_) { /* loading */ } } }); try { audioEvent("open", true); } catch (_) { /* ok */ } sync(); return; }
    if (b.dataset.au) toggleMute();
    else if (b.dataset.sc) { P.scale = +b.dataset.sc; save(); applyScale(); }
    else if (b.dataset.ss) saveSlot(+b.dataset.ss);
    else if (b.dataset.sl) loadSlot(+b.dataset.sl);
    else if (b.dataset.snap) { P.snap = !P.snap; save(); }
    else if (b.dataset.reset) { resetLayout(); return; }
    else if (b.dataset.classic) { P.classic = true; save(); location.reload(); return; }
    if (x) paintSettings(x);
  });
  function applyScale() { root.style.zoom = P.scale === 1 ? "" : String(P.scale); W.forEach(place); }
  function saveSlot(n) {
    const ws = [...W.values()].filter((v) => v.w.k !== "ws" && v.w.k !== "con").map((v) => JSON.parse(JSON.stringify(v.w))), u = ws.filter((w) => w.k === "unit").length, d = new Date(), p = (x) => String(x).padStart(2, "0");
    P.slots[n] = { v: 1, name: `${ws.length} WIN · ${u} UNIT · ${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`, wins: ws }; save(); toastD("LAYOUT SLOT " + n + " SAVED");
  }
  function loadSlot(n) {
    const o = P.slots[n]; if (!o || o.v !== 1 || !Array.isArray(o.wins)) { toastD("LAYOUT SLOT " + n + " :: EMPTY OR UNREADABLE"); return false; }
    [...W.values()].filter((v) => v.w.k !== "ws" && v.w.k !== "con").forEach((v) => close(v.w.id, true)); closedEngine.clear();
    const ok = (w) => w && typeof w === "object" && ["enc", "term", "sheet", "unit", "sec", "group", "set"].includes(w.k) && ((w.k !== "unit" && w.k !== "sec") || idxOf(w.u) >= 0 || (w.k === "unit" && (w.tabs || []).some((u) => idxOf(u) >= 0))) && (w.k !== "sec" || SECN[w.s]);
    o.wins.filter(ok).sort((a, b) => (a.k === "sec") - (b.k === "sec")).forEach((w) => {
      if (["enc", "term", "sheet"].includes(w.k)) { GEO[w.k] = { x: w.x, y: w.y, w: w.w, h: w.h, max: !!w.max }; return; }
      if (findW(same(w)) && w.k !== "group") return;
      const c = Object.assign({}, w, { id: nid() });
      if (c.k === "unit") { c.tabs = tabsOf(c).filter((u) => idxOf(u) >= 0 && !uwOf(u)); if (!c.tabs.length) return; if (!c.tabs.includes(c.u)) c.u = c.tabs[0]; }
      build(c); });
    W.forEach((v) => { if (v.w.k === "unit") paintUnitChrome(v); });
    persist(); sync(); toastD("LAYOUT SLOT " + n + " LOADED"); return true;
  }
  function resetLayout() { [...W.keys()].forEach((id) => close(id, true)); closedEngine.clear(); for (const k in GEO) delete GEO[k]; seen.clear(); setTray(false); const s = sign(); if (P.bySign) delete P.bySign[s]; P.wins = []; save(); sync(); persist(); }

  /* ---------- the engine's containers: lock screen, ENCOUNTER / terminal windows, LOADOUT window, console flyout ---------- */
  const closedEngine = new Set(); let lastMode = "";
  function engineWanted(k) {
    const v = S.view; if (LOCKV.includes(v)) return false;
    if (k === "enc") return ENCV.includes(v);
    if (k === "term") return !ENCV.includes(v);
    if (k === "sheet") return !ENCV.includes(v) && !!($("sh") && $("sh").textContent.trim());
    return false;
  }
  let loginAt = 0;
  function placeEngine() {
    const v = S.view, locked = LOCKV.includes(v), bar = $("bar"), con = $("con"), sh = $("sh"), cb = $("cb");
    const lk = $("dklock"), was = lk.hidden; lk.hidden = !locked;
    if (lk.hidden && !was) loginAt = Date.now(); else if (!lk.hidden) loginAt = 0;
    const mode = locked ? "lock" : ENCV.includes(v) ? "enc" : "term:" + role() + ":" + (S.authRole || "") + ":" + v;
    if (mode !== lastMode) { closedEngine.clear(); lastMode = mode; }
    if (locked && was) { lockShow(); [...W.values()].filter((v) => v.w.k === "ws").forEach((v) => close(v.w.id, true)); }
    const cw = conWin(); if (cb && cb.parentNode !== cw.b) cw.b.appendChild(cb);
    if (locked) lockMsg();
    for (const k of ["enc", "term", "sheet"]) {
      let x = findW((q) => q.w.k === k);
      if (!engineWanted(k)) { if (x) close(x.w.id, true); continue; }
      if (!x && !closedEngine.has(k)) x = open({ k }, k !== "sheet");
      if (!x) continue;
      if (k === "sheet") { if (sh.parentNode !== x.b) x.b.appendChild(sh); }
      else { if (bar.parentNode !== x.b) x.b.prepend(bar); if (con.parentNode !== x.b) x.b.appendChild(con); }
    }
    if (!con.closest(".dkw") && con.parentNode !== park) park.appendChild(con);
    if (!bar.closest(".dkw") && bar.parentNode !== park) park.appendChild(bar);
    if (!sh.closest(".dkw") && sh.parentNode !== park) park.appendChild(sh);
    if (v === "sortie") { const o = $("out"); if (o && o.firstChild) o.replaceChildren(); if (sh.firstChild) sh.replaceChildren(); }
    W.forEach((x) => { if (x.w.k === "unit" || x.w.k === "sec") x.e.style.display = v === "sortie" ? "" : "none"; });
  }
  // play() can fill #out / #sh after R() returns (animated navigation): keep the sortie sink empty
  /* a re-render between pointerdown and click would swallow the click, so async re-renders wait for the pointer to lift */
  let qsync = 0;
  const queueSync = () => { if (pdown) { pend = true; return; } if (!qsync) qsync = requestAnimationFrame(() => { qsync = 0; sync(); }); };
  const lift = () => { setTimeout(() => { pdown = false; if (pend) { pend = false; queueSync(); } }, 0); };
  addEventListener("pointerup", lift, true); addEventListener("pointercancel", lift, true);
  const sinkObs = new MutationObserver(() => { if (S.view !== "sortie") return; const o = $("out"), sh = $("sh"); if ((o && o.firstChild) || (sh && sh.firstChild)) { if (o) o.replaceChildren(); if (sh) sh.replaceChildren(); queueSync(); } });
  sinkObs.observe($("out"), { childList: true }); sinkObs.observe($("sh"), { childList: true });

  /* ---------- lock screen (page load and every logout) ---------- */
  /* login: callsign and colour (last used pre-filled), then the desktop. No clearance sections: every function is a desktop window. */
  const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,15}$/;
  const colKey = (n) => "forge_mp_color_" + String(n || "").trim().toUpperCase();
  function lastName() { let n = ""; try { n = (localStorage.getItem("forge_mp_callsign") || "").trim(); } catch (e) { n = ""; } return NAME_RE.test(n) && n.toUpperCase() !== "USER UNKNOWN" ? n : ""; }
  function lastColour(n) { let c = ""; try { c = (n && localStorage.getItem(colKey(n))) || P.col || ""; } catch (e) { c = P.col || ""; } return /^#[0-9a-f]{6}$/i.test(c) ? c : "#5fd7ff"; }
  function lockShow() {
    const c = $("dklkcrest");
    try { c.innerHTML = welcomePanel().replace("Select the clearance profile that matches your current duty assignment.", "Enter your callsign to open the desktop."); c.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id")); if (typeof crawl === "function") crawl(c, 1); } catch (e) { c.textContent = "WELCOME TO THE CORE EMPIRE MILITARY DATABASE"; }
    const n = lastName(); $("dklkname").value = n; $("dklkcol").value = lastColour(n); $("dklkmsg").textContent = ""; lkTried = false;
    tickLock(); setTimeout(() => { if (!$("dklock").hidden) { const f = $("dklkname"); f.focus(); f.select(); } }, 0);
  }
  function lockMsg() { if (!lkTried) return; const t = document.createElement("div"); t.innerHTML = S.msg || ""; const m = t.textContent.trim(); if (m && /FAIL|REFUSED|REJECT/i.test(m)) $("dklkmsg").textContent = m; }
  let lkTried = false, wantCol = "";
  $("dklkname").addEventListener("input", (e) => { const n = e.target.value.trim(); let c = ""; try { c = localStorage.getItem(colKey(n)) || ""; } catch (_) { c = ""; } if (/^#[0-9a-f]{6}$/i.test(c)) $("dklkcol").value = c; });
  $("dklkf").addEventListener("submit", (e) => {
    e.preventDefault(); const n = $("dklkname").value.trim(), col = $("dklkcol").value;
    if (!NAME_RE.test(n) || n.toUpperCase() === "USER UNKNOWN") { $("dklkmsg").textContent = "CALLSIGN :: 1-16 characters. Letters, digits, spaces, periods, underscores or hyphens."; return; }
    P.col = col; save(); try { localStorage.setItem(colKey(n), col); } catch (_) { /* ok */ }
    wantCol = col; lkTried = true; $("dklkmsg").textContent = "CONNECTING TO THE LIVE TABLE…";
    if (typeof window.mpAuth === "function") void window.mpAuth(n); else $("dklkmsg").textContent = "LIVE TABLE UNAVAILABLE :: use WORK OFFLINE";
  });
  $("dklkoff").addEventListener("click", () => { lkTried = false; login(4); });
  $("dklkclassic").addEventListener("click", () => { P.classic = true; save(); location.reload(); });
  /* once seated, the colour chosen at login becomes the seat colour (through the bridge's own colour path) */
  function applyLoginColour() {
    if (!wantCol || !document.body.classList.contains("mp-live") || !window.__forgeSelf || typeof window.mpTint !== "function") return;
    const c = wantCol; wantCol = "";
    try { window.mpTint(null, window.__forgeSelf); const b = document.getElementById("mptint"), i = b && b.querySelector("input[type=color]"); if (i) { i.value = c; i.dispatchEvent(new Event("change")); } if (b && b.isConnected) b.remove(); } catch (e) { /* ok */ }
  }
  function tickLock() { if ($("dklock").hidden) return; let t = { d: "", t: "" }; try { t = sectorStamp(); } catch (e) { /* ok */ } $("dklkc").textContent = t.t.slice(0, 5); $("dklkd").textContent = String(t.d).toUpperCase() + " // SECTOR STANDARD TIME"; }

  /* ---------- taskbar ---------- */
  function paintTitles() {
    W.forEach((x) => {
      const [k, n] = kanjiTitle(x.w); x.e.querySelector(".dk-k").textContent = k; x.e.querySelector(".dk-n").textContent = n; x.e.setAttribute("aria-label", n);
      const sw = x.e.querySelector(".dk-sw"), stE = x.e.querySelector(".dk-st");
      if (["unit", "sec", "group"].includes(x.w.k)) { const i = x.w.k === "group" ? -1 : idxOf(x.w.u), col = x.w.k === "group" || (x.w.k === "unit" && x.w.c != null) ? (x.w.c || 0) : (i >= 0 ? sheets()[i].col || 0 : 0), h = (typeof SH_COL !== "undefined" && SH_COL[col]) || "#5f6366";
        if (x.w.k === "group") { sw.hidden = true; const gb = x.e.querySelector(".dk-gcol"); if (gb) { const name = COLN[col] || "NONE"; gb.innerHTML = `<i style="background:${h || "transparent"};color:${h || "#5f6366"}"></i><span>${esc(name)}</span><span aria-hidden=true>▾</span>`; gb.title = "Tab colour " + name + " // click to change"; gb.setAttribute("aria-label", "Tab colour " + name); if (!(gcol && gcol.x === x)) gb.setAttribute("aria-expanded", "false"); } }
        else { sw.hidden = false; sw.style.background = h; sw.style.color = h; sw.title = "Tab colour " + (COLN[col] || col); } }
      if (x.w.k === "unit") { const pl = x.e.querySelector(".dk-pl"), i = idxOf(x.w.u), p = i >= 0 ? pilotOf(i) : null;
        if (pl) { pl.hidden = !(p && p.n); if (p && p.n) { pl.textContent = p.n; pl.style.color = p.c; pl.className = "dk-pl" + (p.g ? " g" : ""); pl.title = "Pilot: " + p.n; } }
        paintSize(x); }
      if (x.w.k === "unit") { const r = CACHE.get(x.w.u); if (r && r.st) { stE.hidden = false; stE.textContent = r.st[0]; stE.className = "dk-st " + r.st[1]; } }
    });
  }
  function winTint(w) {
    let c = null;
    if (w.k === "group" || (w.k === "unit" && w.c != null)) c = w.c || 0;
    else if (w.k === "unit" || w.k === "sec") { const i = idxOf(w.u); c = i >= 0 ? (sheets()[i].col || 0) : 0; }
    const hex = (c != null && typeof SH_COL !== "undefined" && SH_COL[c]) || "";
    return { c, hex };
  }
  function kanjiTab(w) {
    if (w.k === "unit") { const i = idxOf(w.u); return ["機", (i >= 0 ? safeLabel(i) : "UNITS") + (w.c ? " // " + COLN[w.c] : "")]; }
    return kanjiTitle(w);
  }
  function paintTabs() {
    const a = activeId();
    tabsEl.innerHTML = [...W.values()].filter((x) => x.e.style.display !== "none" && x.w.k !== "con").map((x) => {
      const [k, n] = kanjiTab(x.w), t = winTint(x.w), col = t.hex ? ` style="color:${t.hex}"` : "", sw = t.hex ? `<i class=dk-tc style="background:${t.c ? t.hex : "transparent"};color:${t.hex}"></i>` : "";
      return `<button type=button role=tab data-id="${x.w.id}" class="${x.w.id === a ? "on" : ""}${x.w.min ? " min" : ""}" aria-selected=${x.w.id === a} title="${esc(n)}"${col}>${sw}${esc(k)} ${esc(n)}</button>`;
    }).join("");
  }
  tabsEl.addEventListener("click", (e) => { const b = e.target.closest("button[data-id]"); if (!b) return; const id = b.dataset.id, x = W.get(id); if (!x) return; if (x.w.min) restore(id); else if (activeId() === id) minimize(id); else front(id); });
  let lastRoll = "", lastRollWho = "", lastRollDetail = "", lastRollFull = "", lastRollUntil = 0, lastRollTimer = 0;
  function critLast(s) { return String(s || "").replace(/\bCRITICAL\b/g, "CRIT"); }
  function lastRollDisplay(text) {
    const raw = String(text || "").replace(/\s+/g, " ").trim();
    const stripped = raw.replace(/\s*\[\+\]\s*$/, "").trim();
    const seg = stripped.split(" · ").map((s) => s.trim()).filter(Boolean);
    const pack = (res, who, detail) => ({
      res: critLast(res).replace(/\s+/g, " ").trim(),
      who: critLast(who).replace(/\s+/g, " ").trim(),
      detail: critLast(detail).replace(/\s+/g, " ").trim(),
      full: raw
    });
    if (!seg.length) return pack(raw, "", "");
    const who0 = (seg[0].split(" / ")[0] || "").trim();
    const who = who0 === "LOCAL" ? "" : who0;
    const mid = seg.length > 1 ? seg[1] : "";
    const rest = seg.length > 2 ? seg.slice(2).join(" · ") : "";
    if (/STABILITY CHECK/.test(stripped) && seg.length > 3) {
      return pack(seg[seg.length - 1], who, ["STABILITY", seg[seg.length - 2]].filter(Boolean).join(" · "));
    }
    return pack(rest || (!mid ? stripped || raw : ""), who, mid);
  }
  function showLastRoll(text) {
    const v = lastRollDisplay(text);
    if (!v.res && !v.who && !v.detail) return;
    lastRoll = v.res; lastRollWho = v.who; lastRollDetail = v.detail; lastRollFull = v.full;
    lastRollUntil = Date.now() + 8000;
    clearTimeout(lastRollTimer);
    lastRollTimer = setTimeout(() => { lastRoll = ""; lastRollWho = ""; lastRollDetail = ""; lastRollFull = ""; lastRollUntil = 0; try { paintStat(); } catch (e) { /* ok */ } }, 8000);
    try { paintStat(); } catch (e) { /* ok */ }
  }
  function paintStat() {
    let t = { t: "" }; try { t = sectorStamp(); } catch (e) { /* ok */ }
    const r = role() ? (role() === "IMPERIAL INTELLIGENCE" ? "IMPERIAL TALONS" : role()) : (S.authRole ? S.authRole + " // KEY" : "NONE");
    const linked = document.body.classList.contains("mp-linked"), live = document.body.classList.contains("mp-live"), sy = $("sync");
    const isb = live ? (sy ? sy.textContent.replace(/[[\]]/g, "") : "LIVE") : linked ? "LINKED" : "LOCAL";
    let cs = ""; if (linked) { try { cs = localStorage.getItem("forge_mp_callsign") || ""; } catch (e) { cs = ""; } }
    const ai = S.view === "sortie" && S.cur != null && sheets()[S.cur] ? S.cur : -1;
    const viewing = document.body.classList.contains("mp-view");
    const actX = ai >= 0 ? uwOf(ukey(sheets()[ai])) : null, actMin = !!(actX && actX.w.min);
    const actH = ai >= 0 ? `<span class="act${viewing ? " view" : ""}${actMin ? " min" : ""}"${actMin ? ' role=button tabindex=0 title="Restore the acting unit"' : ""}>${viewing ? "VIEWING" : "ACTING"}: <b>${esc(safeLabel(ai))}</b>${actMin ? " (MIN)" : ""}</span>` : "";
    const lastOn = !trayOpen() && (lastRoll || lastRollWho || lastRollDetail) && Date.now() < lastRollUntil;
    const lastH = lastOn ? `<span class=dk-last role=button tabindex=0 title="${esc(lastRollFull || lastRoll)}">LAST: <span class=dk-lr>${esc(lastRoll)}</span>${lastRollWho ? `<b class=dk-lr> · ${esc(lastRollWho)}</b>` : ""}${lastRollDetail ? `<span class=dk-lx> · ${esc(lastRollDetail)}</span>` : ""}</span>` : "";
    const html = `<span class=dk-clr>CLEARANCE <b>${esc(r)}</b></span>${cs ? `<span>CALLSIGN <b>${esc(cs)}</b></span>` : ""}${actH}${lastH}<span>UNITS <b>${sheets().filter(vis).length}</b></span><span>ISB <b>${esc(isb)}</b></span><span class=ver role=button tabindex=0 title="Open the changelog">v${BUILD}</span><span><b>${esc(t.t)}</b></span>`;
    if ($("dkstat").innerHTML !== html) $("dkstat").innerHTML = html;
  }
  $("dkstat").addEventListener("click", (e) => {
    if (e.target.closest(".ver")) openLog();
    else if (e.target.closest(".dk-last")) setTray(true);
    else if (e.target.closest(".act.min")) { const sh = sheets()[S.cur], x = sh && uwOf(ukey(sh)); if (x) restore(x.w.id); }
  });
  /* console: a normal window (drag, resize, maximise). It opens where the tray flyout used to (bottom right);
     the taskbar tray button toggles it, and its own _ and x hide it again. */
  function conWin() { let x = findW((v) => v.w.k === "con"); if (!x) { const w = Object.assign({ id: nid(), k: "con" }, defGeo("con"), { min: true }); x = build(w); x.e.hidden = true; } return x; }
  function setTray(on) {
    const x = conWin(), b = $("dktray"); x.w.min = !on; x.e.hidden = !on;
    if (on) {
      front(x.w.id); b.classList.remove("new"); const lg = $("log"); if (lg) lg.scrollTop = lg.scrollHeight;
      lastRoll = ""; lastRollWho = ""; lastRollDetail = ""; lastRollFull = ""; lastRollUntil = 0; clearTimeout(lastRollTimer);
    } else { const a = activeId(); if (a) front(a); else paintTabs(); }
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); P.tray = on; persist();
    try { paintStat(); } catch (e) { /* ok */ }
  }
  const trayOpen = () => { const x = findW((v) => v.w.k === "con"); return !!x && !x.e.hidden; };
  $("dktray").addEventListener("click", () => { // open but covered: bring it to the front; only an on-top console toggles closed
    if (trayOpen() && activeId() !== conWin().w.id) { front(conWin().w.id); return; } setTray(!trayOpen()); });
  new MutationObserver(() => { if (!trayOpen()) $("dktray").classList.add("new"); }).observe($("log"), { childList: true });
  function rollCardText(el) {
    const id = el && el.dataset && el.dataset.rcid;
    let text = "";
    try {
      const rc = (typeof RC !== "undefined" && RC.get && id) ? RC.get(id) : null;
      if (rc && typeof rcSum === "function") {
        const tmp = document.createElement("div");
        tmp.innerHTML = rcSum(rc) + " [+]";
        text = (tmp.textContent || "").replace(/\s+/g, " ").trim();
      }
    } catch (e) { /* ok */ }
    if (!text) text = ((el && el.textContent) || "").replace(/\s+/g, " ").trim();
    return text;
  }
  function noteLastFromNode(d) {
    if (!d || !d.querySelector) return;
    if (d.dataset && d.dataset.replay) return;
    if (d.closest && d.closest("[data-replay]")) return;
    if (!$("dklock") || !$("dklock").hidden) return;
    if (trayOpen()) return;
    if (!loginAt || Date.now() - loginAt <= 2000) return;
    const rc = d.matches && (d.matches("[data-rcid]") ? d : d.querySelector("[data-rcid]"));
    if (!rc) return;
    const text = rollCardText(rc);
    if (text) showLastRoll(text);
  }
  if (typeof logPost === "function") {
    const _lpLast = logPost;
    logPost = function (d) {
      const out = _lpLast.apply(this, arguments);
      try { noteLastFromNode(d); } catch (e) { /* ok */ }
      return out;
    };
  }
  if (typeof rcRefresh === "function") {
    const _rcLast = rcRefresh;
    rcRefresh = function (id) {
      const out = _rcLast.apply(this, arguments);
      try {
        const el = document.querySelector("#log .rc[data-rcid=\"" + id + "\"]");
        if (el) noteLastFromNode(el);
      } catch (e) { /* ok */ }
      return out;
    };
  }


  /* ---------- pass 1: edge snap, TILE UNITS, shortcuts, acting-unit keys, STABILITY scroll, per-callsign layout ---------- */
  function snapEdges(w, mode) {
    const A = areaSize(), TH = 8;
    const others = [...W.values()].filter((v) => v.w.id !== w.id && !v.w.min && !v.w.max && v.e && !v.e.hidden && v.e.style.display !== "none").map((v) => v.w);
    const xs = [0, A.w], ys = [0, A.h];
    others.forEach((o) => { xs.push(o.x, o.x + o.w); ys.push(o.y, o.y + o.h); });
    const pull = (val, list) => { let best = null, bd = TH + 1; for (const t of list) { const d = Math.abs(val - t); if (d <= TH && d < bd) { bd = d; best = t; } } return best; };
    mode = mode || "move";
    if (mode === "move" || mode.includes("w") || mode.includes("e")) {
      const pl = pull(w.x, xs), pr = pull(w.x + w.w, xs);
      if (mode === "move") {
        if (pl != null && (pr == null || Math.abs(w.x - pl) <= Math.abs(w.x + w.w - pr))) w.x = pl;
        else if (pr != null) w.x = pr - w.w;
      } else {
        if (mode.includes("w") && pl != null) { w.w = Math.max(240, w.w + (w.x - pl)); w.x = pl; }
        else if (mode.includes("e") && pr != null) w.w = Math.max(240, pr - w.x);
      }
    }
    if (mode === "move" || mode.includes("n") || mode.includes("s")) {
      const pt = pull(w.y, ys), pb = pull(w.y + w.h, ys);
      if (mode === "move") {
        if (pt != null && (pb == null || Math.abs(w.y - pt) <= Math.abs(w.y + w.h - pb))) w.y = pt;
        else if (pb != null) w.y = pb - w.h;
      } else {
        if (mode.includes("n") && pt != null) { w.h = Math.max(90, w.h + (w.y - pt)); w.y = pt; }
        else if (mode.includes("s") && pb != null) w.h = Math.max(90, pb - w.y);
      }
    }
    return w;
  }
  function tileUnits() {
    const A = areaSize(), floor = Math.max(encFloor(), 8);
    const units = [...W.values()].filter((v) => v.w.k === "unit" && v.e.style.display !== "none");
    units.forEach((v) => { v.w.min = false; v.e.hidden = false; v.w.max = false; });
    const n = units.length; if (!n) { toastD("TILE UNITS :: NO UNIT WINDOWS OPEN"); return; }
    const gap = 8, left = ICOL, right = A.w - ICOL, top = floor, bot = A.h - 8;
    const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
    const tw = Math.max(240, Math.floor((right - left - gap * (cols - 1)) / cols));
    const th = Math.max(90, Math.floor((bot - top - gap * (rows - 1)) / rows));
    units.sort((a, b) => ((a.w.z || 0) - (b.w.z || 0)) || (a.w.x - b.w.x));
    units.forEach((v, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      v.w.x = left + c * (tw + gap); v.w.y = top + r * (th + gap); v.w.w = tw; v.w.h = th;
      place(v);
    });
    persist(); paintTabs();
  }
  function paintShortcuts(x) {
    const s = x.b.querySelector(".dk-keys"); if (!s) return;
    s.innerHTML = `<div class=dk-khead>SHORTCUTS // KEYS AND GESTURES</div>
<ul>
<li><b>Esc</b> — close the launch menu, colour dropdown, or this window</li>
<li><b>?</b> — open this SHORTCUTS window (also the ? button on the taskbar)</li>
<li><b>Double-click a title bar</b> — maximise or restore the window</li>
<li><b>Double-click a group card</b> — open that unit in a unit window</li>
<li><b>Click a group card</b> — select it (paper doll and IMPACT RESOLUTION in SELECTED UNIT)</li>
<li><b>[OPEN ↗]</b> — open the selected unit's full window</li>
<li><b>Drag a unit tab</b> onto another unit window to move it there</li>
<li><b>Tear-off:</b> drag a unit tab onto the desktop for a window of its own</li>
<li><b>Right-click an ENCOUNTER tab</b> — Open sheet window (LARGE)</li>
<li><b>Taskbar tab</b> — focus that window, or minimise it if it is already focused; a minimised window restores</li>
<li><b>_</b> on the title bar — minimise (restore from the taskbar)</li>
<li><b>□ / ❐</b> — maximise or restore · <b>×</b> — close</li>
<li><b>▣ LG / ▭ SM</b> — size presets on a unit window</li>
<li><b>起動 LAUNCH → TILE UNITS</b> — arrange open unit windows in a grid below ENCOUNTER, no overlap</li>
<li><b>Drag a window</b> near a screen edge or another window's edge to snap within 8 px</li>
</ul>`;
  }
  function openShortcuts() {
    let x = findW((v) => v.w.k === "keys");
    if (x) { restore(x.w.id); paintShortcuts(x); return x; }
    x = open({ k: "keys" }); paintShortcuts(x); return x;
  }
  function unitTabOrder() {
    return [...W.values()].filter((v) => v.w.k === "unit" && v.e.style.display !== "none")
      .sort((a, b) => (a.w.x - b.w.x) || (a.w.y - b.w.y) || ((a.w.z || 0) - (b.w.z || 0)))
      .flatMap((v) => tabsOf(v.w).map((u) => ({ x: v, u })));
  }
  function actUnit(n) {
    const t = unitTabOrder()[n - 1]; if (!t) return false;
    setTab(t.x, t.u); restore(t.x.w.id); route(t.u); return true;
  }
  function inField(el) { return !!(el && el.closest && el.closest("input,textarea,select,[contenteditable=true]")); }
  function closePopups() { closeMenu(); try { closeGcol(); } catch (e) { /* ok */ } const m = $("dkmodal"); if (m) m.remove(); }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closePopups(); const k = findW((v) => v.w.k === "keys" && !v.w.min && !v.e.hidden); if (k && activeId() === k.w.id) close(k.w.id); return; }
    if (inField(e.target)) return;
    if (e.key === "?" || (e.key === "/" && e.shiftKey)) { e.preventDefault(); openShortcuts(); return; }
  }, true);
  const helpBtn = $("dkhelp"); if (helpBtn) helpBtn.addEventListener("click", () => openShortcuts());

  function revealTargeter() {
    const els = [];
    const visit = (root) => { if (root && root.querySelectorAll) root.querySelectorAll(".tgdrop").forEach((el) => els.push(el)); };
    visit(document); HOSTS.forEach((h) => { visit(h); if (h.shadowRoot) visit(h.shadowRoot); try { visit(shIn(h)); } catch (e) { /* ok */ } });
    els.forEach((el) => {
      if (el.dataset.seen) return;
      el.dataset.seen = "1";
      try { el.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) { /* ok */ }
    });
  }
  function revealStab() {
    const els = [];
    const visit = (root) => {
      if (!root || !root.querySelectorAll) return;
      root.querySelectorAll(".stabbox").forEach((el) => els.push(el));
      root.querySelectorAll("button").forEach((b) => { if (/ROLL STABILITY/.test(b.textContent || "")) els.push(b); });
    };
    visit(document); HOSTS.forEach((h) => { visit(h); if (h.shadowRoot) visit(h.shadowRoot); try { visit(shIn(h)); } catch (e) { /* ok */ } });
    const seen = new Set();
    els.forEach((el) => {
      if (el.dataset.seen || seen.has(el)) return;
      seen.add(el); el.dataset.seen = "1";
      try { el.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) { /* ok */ }
    });
  }

  function loadLayoutRec(o) {
    if (!o || o.v !== 1 || !Array.isArray(o.wins)) return false;
    [...W.values()].filter((v) => v.w.k !== "ws" && v.w.k !== "con").forEach((v) => close(v.w.id, true)); closedEngine.clear();
    if (o.geo && typeof o.geo === "object") { for (const k of ["enc", "term", "sheet", "con"]) if (o.geo[k] && typeof o.geo[k].x === "number") GEO[k] = Object.assign({}, o.geo[k]); }
    const ok = (w) => w && typeof w === "object" && ["enc", "term", "sheet", "unit", "sec", "group", "set"].includes(w.k) && ((w.k !== "unit" && w.k !== "sec") || idxOf(w.u) >= 0 || (w.k === "unit" && (w.tabs || []).some((u) => idxOf(u) >= 0))) && (w.k !== "sec" || SECN[w.s]);
    o.wins.filter(ok).sort((a, b) => (a.k === "sec") - (b.k === "sec")).forEach((w) => {
      if (["enc", "term", "sheet"].includes(w.k)) { GEO[w.k] = { x: w.x, y: w.y, w: w.w, h: w.h, max: !!w.max, min: !!w.min }; return; }
      if (findW(same(w)) && w.k !== "group") return;
      const c = Object.assign({}, w, { id: nid() });
      if (c.k === "unit") { c.tabs = tabsOf(c).filter((u) => idxOf(u) >= 0 && !uwOf(u)); if (!c.tabs.length) return; if (!c.tabs.includes(c.u)) c.u = c.tabs[0]; }
      build(c);
    });
    W.forEach((v) => { if (v.w.k === "unit") paintUnitChrome(v); });
    if (o.tray != null) P.tray = !!o.tray;
    persist(); sync();
    o.wins.forEach((w) => { if (w.min && ["enc", "term", "sheet"].includes(w.k)) { const x = findW((v) => v.w.k === w.k); if (x) minimize(x.w.id); } });
    return true;
  }
  let layoutApplied = "";
  function maybeRestoreLayout() {
    if (!$("dklock") || !$("dklock").hidden) return;
    const s = sign();
    if (!s || layoutApplied === s) return;
    const rec = P.bySign && P.bySign[s];
    layoutApplied = s;
    if (rec && rec.v === 1) setTimeout(() => { if (layoutApplied === s) loadLayoutRec(rec); }, 0);
  }
  let lockWasHidden = !!($("dklock") && $("dklock").hidden);
  if ($("dklock")) new MutationObserver(() => {
    const hid = $("dklock").hidden;
    if (hid && !lockWasHidden) { loginAt = Date.now(); maybeRestoreLayout(); }
    else if (!hid) { loginAt = 0; layoutApplied = ""; }
    lockWasHidden = hid;
  }).observe($("dklock"), { attributes: true, attributeFilter: ["hidden"] });
  if ($("dklock") && $("dklock").hidden) maybeRestoreLayout();

  /* ---------- launch menu, icons, clearance switches ---------- */
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openMenu(items, anchor) {
    closeMenu(); menu = document.createElement("div"); menu.id = "dkmenu"; menu.setAttribute("role", "menu");
    items.forEach((it) => { if (it === "-") { menu.appendChild(document.createElement("hr")); return; } const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "menuitem"); b.innerHTML = `<b aria-hidden=true>${it[0]}</b><span>${esc(it[1])}</span>`; b.onclick = () => { closeMenu(); it[2](); }; menu.appendChild(b); });
    root.appendChild(menu);
    if (anchor) { const s = P.scale || 1, r = anchor.getBoundingClientRect(); Object.assign(menu.style, { left: Math.round(r.right / s + 4) + "px", top: Math.round(r.top / s) + "px", bottom: "auto" }); }
    const f = menu.querySelector("button"); if (f) f.focus();
  }
  document.addEventListener("pointerdown", (e) => { if (menu && !menu.contains(e.target) && !e.target.closest("#dkstart,.dk-ico")) closeMenu(); }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu) closeMenu(); });
  $("dkstart").addEventListener("click", () => { if (menu) return closeMenu(); openMenu([...ICONS.filter((i) => !i[5]).map((i) => [i[1], i[2], () => icon(i[0])]), ["録", "CHANGELOG", () => openLog()], ["揃", "TILE UNITS", () => tileUnits()], ["捷", "SHORTCUTS", () => openShortcuts()], "-", ["退", "LOGOUT // LOGIN SCREEN", () => askOut()]]); });
  function modal(title, text, okLabel, fn) {
    const old = $("dkmodal"); if (old) old.remove();
    const m = el(`<div id=dkmodal role=alertdialog aria-modal=true aria-label="${esc(title)}"><div><div class=dk-t><span class=dk-k>警</span><span class=dk-n>${esc(title)}</span></div><p>${text}</p><div class=act><button type=button data-ok=1>${esc(okLabel)}</button><button type=button data-no=1>CANCEL</button></div></div></div>`);
    root.appendChild(m); m.querySelector("[data-no]").focus();
    m.addEventListener("click", (e) => { if (e.target.closest("[data-ok]")) { m.remove(); fn(); } else if (e.target.closest("[data-no]")) m.remove(); });
  }
  const busySession = () => sheets().length > 0 || document.body.classList.contains("mp-live");
  function askOut() { if (busySession() || findW((v) => v.w.k === "ws")) modal("LOGOUT", "End this session and return to the login screen? Unsaved sortie state and open workstations are closed; a live-table seat is released.", "LOGOUT", () => out()); else out(); }
  /* every function is a window: the encounter stays put while ASSEMBLY, SERVICE, CATALOGUE and OVERSEER run in their own
     workstation windows (each its own local session; CATALOGUE and OVERSEER still ask for their key) */
  function openWs(n) { const x = open({ k: "ws", n }); restore(x.w.id); paintTitles(); }
  function icon(id) {
    if (id === "enc") { closedEngine.delete("enc"); sync(); const x = findW((v) => v.w.k === "enc"); if (x) restore(x.w.id); return; }
    if (id === "units") { const used = sheets().filter(vis).map((s) => s.col || 0); open({ k: "group", c: used.length ? used[0] : 0 }); return sync(); }
    if (id === "guest") return openWs(1);
    if (id === "mech") return openWs(2);
    if (id === "cat") return openWs(3);
    if (id === "ovr") return openWs(5);
    if (id === "set") { open({ k: "set" }); return sync(); }
    if (id === "log") return openLog();
  }
  root.addEventListener("click", (e) => { const b = e.target.closest(".dk-ico"); if (b) icon(b.dataset.ico); });

  /* sheet tabs (ENCOUNTER window): a tab opens or raises its unit window; on an open tab the engine's colour cycle stays */
  if (typeof shClick === "function") {
    const _sc = shClick;
    shClick = function (i) {
      const sh = sheets()[i], k = ukey(sh); if (!k || S.shEdit === i) return _sc.apply(this, arguments);
      const x = uwOf(k);
      if (!x) { open({ k: "unit", u: k }); if (i !== S.cur) return shGo(i); return R(); }
      if (x.w.u !== k) { x.w.u = k; restore(x.w.id); persist(); if (i !== S.cur) return shGo(i); return R(); }
      if (x.w.min || activeId() !== x.w.id) { restore(x.w.id); if (i !== S.cur) return shGo(i); return; }
      return _sc.apply(this, arguments);
    };
  }

  /* ---------- after every render ---------- */
  let inSync = false;
  function sync(pre, f) {
    if (inSync) return; inSync = true;
    try {
      placeEngine();
      if (S.view === "sortie") renderUnits(pre); else CACHE.clear();
      W.forEach((x) => { if (x.w.k === "group") paintGroup(x); else if (x.w.k === "set") paintSettings(x); else if (x.w.k === "unit") paintUnitChrome(x); else if (x.w.k === "keys") paintShortcuts(x); });
      paintTitles(); paintTabs(); paintStat(); applyLoginColour(); revealStab(); revealTargeter();
      if (S.view === "sortie") W.forEach((x) => { if (!x.pzPend || x.w.k !== "unit" || x.e.hidden || x.w.min) return; const h = HOSTS.get(x.w.u + "|doll");
        if (h && h.isConnected && (h.firstElementChild || shIn(h).firstElementChild)) { const pz = x.pzPend; x.pzPend = null; applyPreset(x, pz, !x.pzForce); x.pzForce = false; } });
      frestore(f);
    } catch (e) { console.error("[desk] sync", e); } finally { inSync = false; }
  }
  /* r3: skill inputs start collapsed in the desk's rolls section until the user opens them (their choice is then kept) */
  if (typeof shOpen === "function") { const _so = shOpen; shOpen = function (k) { return k === "PG" && !(UI.sh && "PG" in UI.sh) ? false : _so.apply(this, arguments); }; }
  /* r3: right-click an encounter tab -> "Open sheet window (LARGE)" opens (or focuses) its unit window at the LARGE preset */
  function openSheetLarge(i) {
    const sh = sheets()[i]; if (!sh) return; const k = ukey(sh); let x = uwOf(k);
    if (x) { x.w.u = k; restore(x.w.id); } else x = open({ k: "unit", u: k, pz: "L" });
    route(k); if (x.w.col && x.w.col.sheet) x.w.col.sheet = false; x.pzPend = "L"; x.pzForce = true; paintUnitChrome(x); persist(); sync(); // asked for LARGE explicitly: no SMALL fallback, may lift to the top
  }
  if (typeof tabMenuOpen === "function" && typeof ctxOpen === "function") { // the engine's tab menu is built by ctxOpen(anchor, title, items, ...)
    const _to = tabMenuOpen;
    const tabIdx = (t) => t.dataset.uid ? sheets().findIndex((s) => s && s.uid === t.dataset.uid) : +t.dataset.i;
    tabMenuOpen = function (t) {
      const key = t && typeof tabKey === "function" ? tabKey(t) : null, _co = ctxOpen;
      if (!key || !(tabIdx(t) >= 0) || S.view !== "sortie") return _to.apply(this, arguments);
      ctxOpen = function (a, title, items) {
        ctxOpen = _co;
        if (Array.isArray(items)) items.unshift({ l: "Open sheet window (LARGE)", tip: "Open this unit's character sheet in its unit window (LARGE view)", run: () => { const f = tabFind(key); if (f) openSheetLarge(tabIdx(f)); } });
        return _co.apply(this, arguments);
      };
      try { return _to.apply(this, arguments); } finally { ctxOpen = _co; }
    };
  }
  const _R = R;
  R = function () {
    let f = null, pre = null; try { f = fsnap(); const k = curKey(); if (k) pre = { k, hp: S.uiHP ? S.uiHP.slice() : null }; } catch (e) { /* ok */ }
    const r = _R.apply(this, arguments);
    sync(pre, f);
    return r;
  };
  setInterval(() => { paintStat(); tickLock(); }, 1000);
  addEventListener("resize", () => W.forEach(place));
  const bodyObs = new MutationObserver(() => HOSTS.forEach((h) => mirrorBody(h.shadowRoot.firstElementChild, h.dataset.ro === "1")));
  bodyObs.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme", "data-view"] });

  /* boot: per-callsign layouts restore after login (maybeRestoreLayout); scale still applies immediately */
  if (!Array.isArray(P.wins)) P.wins = []; if (!P.bySign || typeof P.bySign !== "object") P.bySign = {};
  applyScale();
  const wsFront = (win) => { const x = findW((v) => v.w.k === "ws" && wsWin(v.w) === win); if (x && activeId() !== x.w.id) front(x.w.id); };
  const wsOf = (win) => findW((v) => v.w.k === "ws" && wsWin(v.w) === win);
  const wsPing = (win) => {
    const x = win && wsOf(win);
    if (x && !x.wsFault) { let st = null; try { st = win.Forge && win.Forge.state ? win.Forge.state() : null; } catch (e) { /* ok */ }
      if (st && st.view && st.view !== "login") { x.wsOk = true; clearTimeout(x.wsT); }
      const t = st ? (st.view === "login" ? "SIGNING IN…" : String(st.msg || "READY").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "READY") : "STARTING…";
      wsMsg(x, t, /REFUSED|FAULT|ERROR|DENIED|INVALID/i.test(t) ? "warn" : ""); }
    paintTitles(); paintTabs();
  };
  const wsFault = (win, m) => { const x = wsOf(win); if (!x) return; x.wsFault = true; clearTimeout(x.wsT); wsMsg(x, "WORKSTATION FAULT // " + String(m).slice(0, 160) + " // RELOAD to restart it", "bad"); };
  window.Desk = { on: true, build: BUILD, open, close, minimize, restore, toggleMax, front, route, sync, saveSlot, loadSlot, resetLayout, setTray, icon,
    wsFront, wsPing, wsFault, conWin, tileUnits, openShortcuts, actUnit, snapEdges, sign, loadLayout: loadLayoutRec,
    wins: () => [...W.values()].map((x) => Object.assign({ hidden: x.e.hidden || x.e.style.display === "none" }, x.w)), curKey, ukey, idxOf, hosts: () => HOSTS,
    geo: (id, g) => { const x = W.get(id); if (!x) return; Object.assign(x.w, g); place(x); persist(); } };
  sync();
})();
