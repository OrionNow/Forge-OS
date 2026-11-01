import sys,pathlib
ROOT=pathlib.Path('/workspace/forge-os')
s=(ROOT/'out-v5.3/mp-bridge.js').read_text()
def rep(a,b,n=1):
    global s
    c=s.count(a)
    if c!=n: sys.exit(f'BRIDGE PATCH FAIL ({c}): {a[:80]!r}')
    s=s.replace(a,b)
rep("v19 (FORGE-OS 5.3.1): card updates accepted only from the card's author (server actorId); default seat colors. */",
    "v19 (FORGE-OS 5.3.1): card updates accepted only from the card's author (server actorId); default seat colors.\n   v20 (FORGE-OS 5.4): full owner names on every tab; the host types a tab owner (synced in the sheet data, auto-assigned\n   when that callsign takes a seat); roster toggle moved to the top bar; UNDO lives beside SAVE STATE. */")
# frame ID only for tab titles
rep('''    const model = S.cs && String(S.cs).trim() && String(S.cs).trim() !== "PENDING" ? String(S.cs).trim() : "";
    const frame = S.ch && S.ch[0] ? String(S.ch[0]).trim() : "";
    return (model || frame || "").slice(0, 28);''','''    const fid = [S.id, S.cs].map((x) => String(x == null ? "" : x).trim()).filter((x) => x && x !== "PENDING").join(" ");
    const frame = S.ch && S.ch[0] ? String(S.ch[0]).trim() : "";
    return (fid || frame || "").slice(0, 28);''')
# owner text: full name on every tab; host click opens an inline owner box
rep('''      const role = sh.closed ? (on ? "Closed" : "C") : who ? (on ? who : (who.trim().charAt(0) || "?").toUpperCase()) : "";
      const roleCol = owner ? memberColor(owner) : "var(--muted)";''','''      const own = !owner && !sh.closed ? ownOf(sh, i) : "";
      const role = sh.closed ? "Closed" : who || own;
      const roleCol = owner ? memberColor(owner) : "var(--muted)";
      const ownEd = MP.role === "host" && MP.ownEdit === sh.uid;''')
rep('''            ? `<span class="stx asg" data-assign="1" data-act=assign data-label="Assign pilot…" style="color:${roleCol}" title="Assign this unit to a seat, or mark it closed" onpointerdown="mpAssign(event,'${sh.uid}')" onmousedown="event.stopPropagation()" onclick="event.stopPropagation();event.preventDefault()">[${esc(role || "+")}]</span>`''','''            ? (ownEd
              ? `<span class="stx asg" data-assign="1" data-act=assign data-label="Assign pilot…"><input id=shown maxlength=28 aria-label="Owner name" value="${esc(role)}" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" onblur="mpOwnSet('${sh.uid}',null)" onkeydown="event.stopPropagation();if(event.key=='Enter'){event.preventDefault();mpOwnSet('${sh.uid}',this.value)}if(event.key=='Escape'){event.preventDefault();mpOwnSet('${sh.uid}',null)}"></span>`
              : `<span class="stx asg${own ? " own" : ""}" data-assign="1" data-act=assign data-label="Assign pilot…" style="color:${roleCol}" title="Click to type an owner name (a seat with that callsign gets the unit). Right-click the tab > Assign pilot… to pick a seat." onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" onclick="event.stopPropagation();event.preventDefault();mpOwnEdit('${sh.uid}')">[${esc(role || "+")}]</span>`)''')
rep('''  window.mpRename = function (uid) {''','''  function ownOf(sh, i) {
    const S = Forge.state();
    const v = i === S.cur ? S.own : sh && sh.d && sh.d.own;
    return String(v || "").slice(0, 28);
  }
  function setOwn(i, v) {
    const S = Forge.state();
    const sh = S.sheets[i];
    if (!sh) return;
    if (i === S.cur) S.own = v;
    sh.d = Object.assign({}, sh.d || {}, { own: v });
  }
  window.mpOwnEdit = function (uid) {
    if (MP.role !== "host") return;
    MP.ownEdit = uid;
    Forge.render();
    setTimeout(() => { const el = document.getElementById("shown"); if (el) { el.focus(); el.select(); } }, 0);
  };
  window.mpOwnSet = function (uid, v) {
    if (MP.ownEdit !== uid) return;
    MP.ownEdit = null;
    const S = Forge.state();
    const i = (S.sheets || []).findIndex((s) => s && s.uid === uid);
    if (v == null || MP.role !== "host" || i < 0) { Forge.render(); return; }
    const name = String(v).replace(/\\s+/g, " ").trim().slice(0, 28);
    const m = name && (MP.members || []).find((x) => String(x.callsign || "").trim().toUpperCase() === name.toUpperCase());
    setOwn(i, m ? "" : name);
    if (m) { window.mpOwner(uid, m.id); return; }
    const sh = S.sheets[i];
    sh.ownerId = null;
    sh.closed = !name;
    Forge.say("[ OK ] UNIT OWNER :: " + esc(name || "Closed") + (name ? " (assigned when that callsign takes a seat)" : ""), "ok");
    Forge.render();
  };
  // host: a typed owner name becomes the seat owner as soon as that callsign is at the table
  setInterval(() => {
    try {
      if (!(MP.on && MP.ready && MP.role === "host")) return;
      const S = Forge.state();
      (S.sheets || []).forEach((sh, i) => {
        if (!sh || sh.ownerId || sh.closed) return;
        const own = ownOf(sh, i).toUpperCase();
        if (!own) return;
        const m = (MP.members || []).find((x) => x.online && String(x.callsign || "").trim().toUpperCase() === own);
        if (m) { setOwn(i, ""); window.mpOwner(sh.uid, m.id); }
      });
    } catch (e) { /* best effort */ }
  }, 2500);

  window.mpRename = function (uid) {''')
# UNDO now sits beside SAVE STATE in the terminal itself
rep('''      h = h.replace("[APPLY]</button>", `[APPLY]</button><button type=button onclick="undoLast()">[UNDO]</button>`);
''','')
rep('''        h = h.replace(/<span class=selbtns>[\\s\\S]*?<\\/span>/, `<span class=selbtns><button type=button onclick="undoLast()">[UNDO]</button></span>`);''','''        h = h.replace(/<span class=selbtns>[\\s\\S]*?<\\/span>/, "");''')
# roster toggle lives in the top bar
rep('''    const html = `<div class=mph><span>LINK ${sync}</span><button type=button onclick="mpSeats()" title="${MP.seatsOpen ? "Collapse the table roster" : "Expand the table roster"}">${MP.seatsOpen ? "[–]" : "[" + members.length + "]"}</button></div>${MP.seatsOpen ? `<div class=mpbody>${rows || `<div class=dim>no seats</div>`}</div>` : ""}`;
    if (box.innerHTML !== html) box.innerHTML = html;''','''    const html = `<div class=mph><span>LINK ${sync}</span></div>${MP.seatsOpen ? `<div class=mpbody>${rows || `<div class=dim>no seats</div>`}</div>` : ""}`;
    if (box.innerHTML !== html) box.innerHTML = html;
    const rb = document.getElementById("rosterBtn");
    if (rb) {
      rb.hidden = false;
      const t = MP.seatsOpen ? "[USERS \u2013]" : "[USERS " + members.length + "]";
      if (rb.textContent !== t) rb.textContent = t;
      rb.title = MP.seatsOpen ? "Collapse the table roster" : "Expand the table roster";
      rb.setAttribute("aria-expanded", MP.seatsOpen ? "true" : "false");
    }''')
rep("#mpfriends.min{width:42px;overflow:hidden}","#mpfriends.min{display:none}")
rep("body.mp-linked.mp-friends-min{padding-left:42px}","body.mp-linked.mp-friends-min{padding-left:0}")
(ROOT/'out-v5.4/mp-bridge.js').write_text(s); print('bridge v20 patched')
