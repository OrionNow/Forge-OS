/* FORGE-OS desktop shell, milestone 1 (on v5.5.1). Classic script loaded after mp-bridge.js.
   Hosts the existing containers (#bar + #con, #sh, #cb) in draggable windows. R() keeps writing the same IDs:
   no view logic changes, nothing here is synced (layout lives in forge_ui_v1 under UI.desk). */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const css = `
body.desk{overflow:hidden}
body.desk #wrap{max-width:none;height:100vh;box-sizing:border-box;display:flex;flex-direction:column;padding:6px 8px}
body.desk #wrap>main{display:none}
#deskroot{display:none}
body.desk #deskroot{display:flex;flex:1;min-height:0;gap:8px;margin-top:6px}
#deskbay{width:150px;flex:none;border:1px solid var(--line);padding:8px 6px;display:flex;flex-direction:column;gap:4px;font-size:var(--fs-l,12.5px);z-index:1000;background:var(--bg)}
#deskbay .bayt{color:var(--cyan);letter-spacing:.04em;margin-bottom:4px}
#deskbay button{all:unset;white-space:nowrap;cursor:pointer;display:flex;justify-content:space-between;gap:4px;padding:3px 5px;border:1px solid transparent;color:var(--fg)}
#deskbay button[aria-pressed=true]{border-color:var(--line);color:var(--cyan)}
#deskbay button:hover,#deskbay button:focus-visible{background:var(--hover,#0c2a22);outline:1px solid var(--cyan)}
#deskbay .bayf{margin-top:auto;display:flex;flex-direction:column;gap:4px}
#deskbay .bayf button{justify-content:center;border-color:var(--line)}
#deskarea{position:relative;flex:1;min-width:0;isolation:isolate;overflow:hidden}
.win{position:absolute;display:flex;flex-direction:column;box-sizing:border-box;border:1px solid var(--line);background:var(--bg);min-width:300px;min-height:28px;resize:both;overflow:hidden;padding:0}
.win.primary{border-color:var(--cyan)}
.win.col{height:28px!important;min-height:28px;resize:none}
.win.col>.win-b{display:none}
.win.min{display:none}
.win.max{left:0!important;top:0!important;width:100%!important;height:100%!important;resize:none}
.win-t{flex:none;height:26px;display:flex;align-items:center;gap:6px;padding:0 4px 0 8px;background:#081812;color:var(--fg);font-size:13px;letter-spacing:.04em;cursor:move;user-select:none;border-bottom:1px solid var(--line)}
.win.focus>.win-t{background:var(--hover,#0c2a22);color:var(--cyan);border-bottom-color:var(--cyan)}
.win-t .wt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.win-t button{all:unset;cursor:pointer;min-width:28px;height:20px;text-align:center;font-size:var(--fs-l,12.5px);color:var(--fg);border:1px solid var(--line)}
.win-t button:hover,.win-t button:focus-visible{color:var(--cyan);border-color:var(--cyan)}
.win-b{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.win-b>#bar{flex:none;padding:4px 6px 0}
.win-b>#con,.win-b>#sh{flex:1;min-height:0;overflow-y:auto;border:0;margin:0}
.win-b>#cb{flex:1;min-height:0;display:flex;flex-direction:column;border:0;margin:0}
.win-b>#cb #log{flex:1;height:auto;min-height:40px}
.win-b>#cb.cs0 #log{flex:1}
body.desk .win-b>#con{container-type:inline-size}
.win.drag{will-change:transform;opacity:.92}
body.desk #mpveil{position:fixed;inset:0;z-index:2000}
body.desk #toast{z-index:1200}
body.desk #hudfx{z-index:1100}
body.desk #mpassign,body.desk #mptint{z-index:1300}
body.desk #clog{z-index:1500}
@media (prefers-reduced-motion:reduce){.win,.win *{transition:none!important}}`;
  const st = document.createElement("style"); st.id = "deskcss"; st.textContent = css; document.head.appendChild(st);

  const W = {
    tele: { mod: () => modName(), host: ["bar", "con"], primary: true, close: false, min: [560, 300] },
    sheet: { mod: () => "FRAME SHEET", host: ["sh"], close: true, min: [380, 200] },
    con: { mod: () => "OPERATOR CONSOLE", host: ["cb"], close: false, min: [340, 120] },
  };
  const ORDER = ["tele", "sheet", "con"];
  const DEF = { tele: { x: 0, y: 0, w: 0.6, h: 1 }, sheet: { x: 0.605, y: 0, w: 0.395, h: 0.6 }, con: { x: 0.605, y: 0.61, w: 0.395, h: 0.39 } };
  const home = {}; // original parent/next sibling per hosted node, for the classic toggle
  let area, bay, top = 10, built = false;

  function modName() {
    const v = (typeof S !== "undefined" && S.view) || "";
    if (v === "sortie" || v === "intel") return "SORTIE TELEMETRY";
    if (v === "catalog" || v === "catalogEdit") return "COMPONENT REGISTRY";
    if (v === "main" || v === "chassis") return "FRAME ASSEMBLY";
    return "ACCESS ROUTER";
  }
  function unitName() {
    try { if (S.sheets && S.sheets.length && S.sheets[S.cur]) return shLabel(S.cur); if (S.ch && typeof idline === "function") return idline(); } catch (e) {}
    return "";
  }
  function D() { if (!UI.desk || typeof UI.desk !== "object" || UI.desk.v !== 1) UI.desk = { v: 1, on: true, L: {} }; if (!UI.desk.L || typeof UI.desk.L !== "object") UI.desk.L = {}; return UI.desk; }
  const prof = () => (document.body.classList.contains("mp-linked") ? "table" : "solo");
  function lay() { const d = D(), p = prof(); if (!d.L[p] || typeof d.L[p] !== "object") d.L[p] = {}; return d.L[p]; }
  function save() { try { uiSave(); } catch (e) {} }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function build() {
    if (built) return; built = true;
    const root = document.createElement("div"); root.id = "deskroot";
    root.innerHTML = `<nav id=deskbay role=toolbar aria-label="Module bay"><div class=bayt>MODULE BAY //</div></nav><div id=deskarea></div>`;
    const wrap = $("wrap"); wrap.appendChild(root);
    bay = $("deskbay"); area = $("deskarea");
    ORDER.forEach((k) => {
      const w = document.createElement("section");
      w.className = "win panel" + (W[k].primary ? " primary" : ""); w.id = "win-" + k; w.dataset.w = k;
      w.setAttribute("role", "region"); w.setAttribute("aria-labelledby", "wt-" + k);
      w.innerHTML = `<div class=win-t><span class=wt id="wt-${k}"></span><button type=button data-a=col title="Collapse window" aria-label="Collapse window" aria-expanded=true>[–]</button><button type=button data-a=min title="Minimize to module bay" aria-label="Minimize to module bay">[_]</button><button type=button data-a=max title="Maximize" aria-label="Maximize">[□]</button>${W[k].close ? '<button type=button data-a=close title="Close window" aria-label="Close window">[✕]</button>' : ""}</div><div class=win-b></div>`;
      area.appendChild(w);
      const b = document.createElement("button"); b.type = "button"; b.dataset.w = k; b.id = "bay-" + k;
      b.onclick = () => bayClick(k); bay.appendChild(b);
      w.addEventListener("pointerdown", () => focusWin(k), true);
      w.querySelector(".win-t").addEventListener("pointerdown", (e) => dragStart(e, k));
      w.querySelector(".win-t").addEventListener("dblclick", (e) => { if (!e.target.closest("button")) act(k, "max"); });
      w.querySelectorAll(".win-t button").forEach((x) => x.addEventListener("click", (e) => { e.stopPropagation(); act(k, x.dataset.a); }));
      w.addEventListener("pointerup", () => sizeCommit(k));
    });
    const f = document.createElement("div"); f.className = "bayf";
    f.innerHTML = `<button type=button id=deskReset title="Put every window back to its default place">[RESET LAYOUT]</button><button type=button id=deskClassic title="Switch to the classic two-panel layout (the desktop comes back from [DESK] in the header)">[CLASSIC LAYOUT]</button>`;
    bay.appendChild(f);
    $("deskReset").onclick = reset; $("deskClassic").onclick = () => setOn(false);
    // header toggle (works in both layouts)
    const hc = document.querySelector("header .hctl");
    if (hc && !$("deskBtn")) { const t = document.createElement("button"); t.id = "deskBtn"; t.type = "button"; t.className = "audio-btn"; t.onclick = () => setOn(!D().on); hc.insertBefore(t, hc.firstChild); hc.insertBefore(document.createTextNode(" "), t.nextSibling); }
    window.addEventListener("resize", () => { if (D().on) placeAll(); });
    document.addEventListener("keydown", keys, true);
  }

  function hostIn() {
    ORDER.forEach((k) => { const b = $("win-" + k).querySelector(".win-b"); W[k].host.forEach((id) => { const n = $(id); if (!n) return; if (!home[id]) home[id] = { p: n.parentNode, nx: n.nextSibling }; b.appendChild(n); }); });
  }
  function hostOut() {
    ["bar", "con", "sh", "cb"].forEach((id) => { const n = $(id), h = home[id]; if (!n || !h) return; if (h.nx && h.nx.parentNode === h.p) h.p.insertBefore(n, h.nx); else h.p.appendChild(n); });
  }
  function setOn(on) {
    D().on = !!on; save();
    if (on) { hostIn(); document.body.classList.add("desk"); placeAll(); } else { hostOut(); document.body.classList.remove("desk"); }
    paint(); say(on ? "Desktop layout" : "Classic layout");
  }
  function say(m) { const s = $("sr"); if (s) s.textContent = m; }

  function geo(k) { const L = lay()[k], d = DEF[k]; const g = Object.assign({}, d, L && typeof L === "object" ? L : {}); ["x", "y", "w", "h"].forEach((q) => { if (!Number.isFinite(+g[q])) g[q] = d[q]; }); return g; }
  function place(k) {
    const w = $("win-" + k), g = geo(k), A = area.getBoundingClientRect(), [mw, mh] = W[k].min;
    const ww = clamp(Math.round(g.w * A.width), Math.min(mw, A.width), A.width), hh = clamp(Math.round(g.h * A.height), Math.min(mh, A.height), A.height);
    w.style.width = ww + "px"; w.style.height = hh + "px";
    w.style.left = clamp(Math.round(g.x * A.width), 0, Math.max(0, A.width - ww)) + "px"; w.style.top = clamp(Math.round(g.y * A.height), 0, Math.max(0, A.height - 28)) + "px";
    w.classList.toggle("col", !!g.col); w.classList.toggle("min", !!g.min); w.classList.toggle("max", !!g.max);
    if (g.z) { w.style.zIndex = g.z; top = Math.max(top, g.z); }
  }
  function placeAll() { if (!area) return; ORDER.forEach(place); paint(); }
  function setG(k, o) { const L = lay(); L[k] = Object.assign({}, geo(k), L[k] || {}, o); save(); }
  function commit(k) {
    const w = $("win-" + k), A = area.getBoundingClientRect(); if (!A.width || !A.height) return;
    const r = (n) => Math.round(n * 1000) / 1000;
    setG(k, { x: r(w.offsetLeft / A.width), y: r(w.offsetTop / A.height), w: r(w.offsetWidth / A.width), h: r(w.offsetHeight / A.height) });
  }
  function sizeCommit(k) { const w = $("win-" + k); if (w.classList.contains("col") || w.classList.contains("max")) return; const g = geo(k), A = area.getBoundingClientRect(); if (Math.abs(g.w * A.width - w.offsetWidth) > 2 || Math.abs(g.h * A.height - w.offsetHeight) > 2) commit(k); }

  function focusWin(k) {
    ORDER.forEach((q) => { const w = $("win-" + q); const on = q === k; w.classList.toggle("focus", on); if (on) w.setAttribute("aria-current", "true"); else w.removeAttribute("aria-current"); });
    const w = $("win-" + k); if (+w.style.zIndex !== top) { top++; if (top > 999) { top = 10; ORDER.map((q) => $("win-" + q)).sort((a, b) => (+a.style.zIndex || 0) - (+b.style.zIndex || 0)).forEach((x) => { x.style.zIndex = ++top; }); } else w.style.zIndex = top; const L = lay(); L[k] = Object.assign(L[k] || {}, { z: +w.style.zIndex }); }
  }
  function act(k, a) {
    const g = geo(k);
    if (a === "col") setG(k, { col: !g.col });
    else if (a === "min" || a === "close") setG(k, { min: true });
    else if (a === "max") setG(k, { max: !g.max, col: false });
    place(k); paint();
    if (a === "min" || a === "close") { const b = $("bay-" + k); if (b) b.focus(); }
    say(W[k].mod() + (a === "col" ? (geo(k).col ? " collapsed" : " expanded") : a === "max" ? (geo(k).max ? " maximized" : " restored") : " minimized"));
  }
  function bayClick(k) { const g = geo(k); if (g.min || g.col) { setG(k, { min: false, col: false }); place(k); } focusWin(k); paint(); }
  function reset() { delete D().L[prof()]; save(); placeAll(); say("Layout reset"); }

  let drag = null;
  function dragStart(e, k) {
    if (e.button !== 0 || e.target.closest("button")) return;
    const w = $("win-" + k); if (w.classList.contains("max")) return;
    drag = { k, w, x0: e.clientX, y0: e.clientY, l: w.offsetLeft, t: w.offsetTop }; w.classList.add("drag");
    w.querySelector(".win-t").setPointerCapture(e.pointerId);
    const mv = (ev) => { if (!drag) return; drag.dx = ev.clientX - drag.x0; drag.dy = ev.clientY - drag.y0; w.style.transform = `translate(${drag.dx}px,${drag.dy}px)`; };
    const up = () => {
      const t = w.querySelector(".win-t"); t.removeEventListener("pointermove", mv); t.removeEventListener("pointerup", up); t.removeEventListener("pointercancel", up);
      if (!drag) return; const A = area.getBoundingClientRect();
      let L = drag.l + (drag.dx || 0), T = drag.t + (drag.dy || 0);
      const S12 = 12; L = L < S12 ? 0 : L + w.offsetWidth > A.width - S12 ? A.width - w.offsetWidth : L; T = T < S12 ? 0 : T;
      w.style.transform = ""; w.classList.remove("drag");
      w.style.left = clamp(L, 0, Math.max(0, A.width - w.offsetWidth)) + "px"; w.style.top = clamp(T, 0, Math.max(0, A.height - 28)) + "px";
      if (drag.dx || drag.dy) commit(k); drag = null;
    };
    const t = w.querySelector(".win-t"); t.addEventListener("pointermove", mv); t.addEventListener("pointerup", up); t.addEventListener("pointercancel", up);
  }

  function keys(e) {
    if (!D().on) return;
    if (e.key === "F6") { e.preventDefault(); const vis = ORDER.filter((k) => !geo(k).min), cur = vis.findIndex((k) => $("win-" + k).classList.contains("focus")); const n = vis[(cur + (e.shiftKey ? vis.length - 1 : 1)) % vis.length]; if (n) { focusWin(n); const f = $("win-" + n).querySelector(".win-b button,.win-b input,.win-b [tabindex]"); if (f) f.focus(); } return; }
    if (e.altKey && !e.ctrlKey && (e.key === "c" || e.key === "C")) { e.preventDefault(); if (geo("con").min || geo("con").col) bayClick("con"); focusWin("con"); const ci = $("CI"); if (ci) ci.focus(); }
  }

  function paint() {
    const on = D().on, b = $("deskBtn");
    if (b) { b.textContent = on ? "[CLASSIC]" : "[DESK]"; b.title = on ? "Switch to the classic two-panel layout" : "Switch to the desktop layout (windows)"; b.setAttribute("aria-pressed", on ? "true" : "false"); }
    if (!built || !on) return;
    const u = unitName();
    ORDER.forEach((k) => {
      const t = $("wt-" + k), m = W[k].mod(), g = geo(k), w = $("win-" + k);
      let bench = k === "tele" && window.MP && window.MP.editing;
      const title = (k !== "con" && u ? u + " // " : "") + m + (bench ? " // BENCH" : "");
      if (t && t.textContent !== title) t.textContent = title;
      const cb = w.querySelector('[data-a=col]'); cb.textContent = g.col ? "[+]" : "[–]"; cb.title = cb.ariaLabel = g.col ? "Expand window" : "Collapse window"; cb.setAttribute("aria-expanded", g.col ? "false" : "true");
      const mb = w.querySelector('[data-a=max]'); mb.title = mb.ariaLabel = g.max ? "Restore size" : "Maximize";
      const bb = $("bay-" + k); if (bb) { bb.innerHTML = `<span>${m.replace("SORTIE TELEMETRY", "TELEMETRY").replace("COMPONENT ", "").replace("FRAME ASSEMBLY", "ASSEMBLY").replace("OPERATOR ", "").replace("FRAME ", "").replace("ACCESS ROUTER", "ACCESS")}</span><span aria-hidden=true>${g.min ? "_" : g.col ? "–" : "●"}</span>`; bb.setAttribute("aria-pressed", g.min ? "false" : "true"); bb.title = (g.min ? "Open " : "Focus ") + m; }
    });
  }

  // re-render hook: retitle, keep the hosts in place
  const _Rdesk = R;
  R = function () { const r = _Rdesk.apply(this, arguments); try { if (D().on && built) { hostIn(); paint(); } } catch (e) {} return r; };
  window.Desk = { on: () => !!D().on, set: setOn, reset, geo, act, focus: focusWin, place: placeAll };
  function boot() { build(); if (D().on) setOn(true); else paint(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
