import sys,pathlib
ROOT=pathlib.Path('/workspace/forge-os')
s=(ROOT/'out-v5.4/mp-bridge.js').read_text()
def rep(a,b,n=1):
    global s
    c=s.count(a)
    if c!=n: sys.exit(f'BRIDGE PATCH FAIL ({c}): {a[:80]!r}')
    s=s.replace(a,b)
rep("roster toggle moved to the top bar; UNDO lives beside SAVE STATE. */","roster toggle moved to the top bar; UNDO lives beside SAVE STATE.\n   v21 (FORGE-OS 5.5): players view other units read-only (no rolls, skills or tab menu); chat carries the sender color\n   (seat id fallback) and echoes locally off-table; the USERS list opens inside the operator console. */")
# custom owner text uses the tab outline colour
rep('const roleCol = owner ? memberColor(owner) : "var(--muted)";','const roleCol = owner ? memberColor(owner) : own ? "inherit" : "var(--muted)";')
# Assign pilot... menu tip describes picking a seat
rep('data-act=assign data-label="Assign pilot…"','data-act=assign data-label="Assign pilot…" data-tip="Pick a seat to pilot this unit, or mark it closed"',2)
# players: no tab menu on someone else's unit
rep("  window.mpRename = function (uid) {","""  window.mpCanMenu = function (uid) {
    if (!(MP.on && MP.ready) || MP.role === "host") return true;
    const sh = (Forge.state().sheets || []).find((s) => s && s.uid === uid);
    return !!sh && sh.ownerId === MP.selfId;
  };

  window.mpRename = function (uid) {""")
# view-only: other units show their loadout, without rolls or skills
rep('''      if (locked()) {
        return `<div class=nm>CLASSIFIED // OTHER UNIT</div><div class=dim>PAPER DOLL AND IMPACT RESOLUTION ONLY. SKILLS AND THE LOADOUT MANIFEST STAY WITH THE ASSIGNED PILOT.</div>`;
      }
      return prev();''','''      const ro = locked();
      document.body.classList.toggle("mp-view", ro);
      if (ro) return `<div class=dim>VIEW ONLY // OTHER UNIT :: rolls and skills stay with the assigned pilot.</div>` + prev();
      return prev();''')
rep("h = `<div class=dim>OTHER UNIT // PAPER DOLL AND IMPACT RESOLUTION ONLY. SKILLS, WEAPONS AND THE LOADOUT STAY WITH THE ASSIGNED PILOT.</div>` + h;","h = `<div class=dim>VIEW ONLY // OTHER UNIT :: paper doll, loadout and impact resolution. Rolls and skills stay with the assigned pilot.</div>` + h;")
# chat: off-table echo in the user's colour; remote colour by hint, then seat id, then name
rep('if (t && t[0] !== "/" && !pre && MP.on && MP.ready) { sendChat(t); return; }','''if (t && t[0] !== "/" && !pre && MP.on && MP.ready) { sendChat(t); return; }
      if (t && t[0] !== "/" && !pre && typeof chatShow === "function") {
        const me = MP.linked ? meMember() : null;
        chatShow(me ? shownName(me) : (MP.callsign || "LOCAL"), (MP.linked && selfColor()) || "var(--cyan)", t.slice(0, 500));
        return;
      }''')
rep('chatShow(String(r.actor || "?"), actorColor(r.actor, r.color), String(r.rc.t || ""));','chatShow(String(r.actor || "?"), actorColor(r.actor, r.color, r.actorId), String(r.rc.t || ""));')
rep('''  function actorColor(name, hint) {
    const hinted = safeHex(hint);
    if (hinted) return hinted;
    return memberColor(memberByName(name));
  }''','''  function actorColor(name, hint, id) {
    const hinted = safeHex(hint);
    if (hinted) return hinted;
    const byId = id && (MP.members || []).find((x) => x.id === id);
    if (byId) return memberColor(byId);
    const byName = memberByName(name);
    if (byName) return memberColor(byName);
    return id ? defaultTint({ id }) : memberColor(null);
  }''')
rep('''    return memberHex(m) || safeHex(MP.tints && MP.tints[MP.selfId]) || (m ? safeHex(memberColor(m)) : "");''','''    return memberHex(m) || safeHex(MP.tints && MP.tints[MP.selfId]) || (m ? safeHex(memberColor(m)) : "") || (MP.role === "host" ? "#ffb400" : MP.selfId ? defaultTint({ id: MP.selfId }) : "");''')
# USERS list inside the operator console (right side); the log/command area shrinks to fit
rep('''      box.id = "mpfriends";
      document.body.appendChild(box);
    }''','''      box.id = "mpfriends";
    }
    const cbox = document.getElementById("cb");
    if (cbox && box.parentElement !== cbox) cbox.appendChild(box);
    else if (!cbox && !box.parentElement) document.body.appendChild(box);
    if (cbox) {
      cbox.classList.toggle("users", !!MP.seatsOpen);
      const ch = document.getElementById("conhead");
      box.style.top = (ch ? ch.offsetHeight : 24) + "px";
    }''')
rep('''    document.body.classList.remove("mp-live", "mp-linked", "mp-friends-min");
    const box = document.getElementById("mpfriends");
    if (box) box.remove();''','''    document.body.classList.remove("mp-live", "mp-linked", "mp-friends-min", "mp-view");
    const box = document.getElementById("mpfriends");
    if (box) box.remove();
    const cbu = document.getElementById("cb");
    if (cbu) cbu.classList.remove("users");''')
rep("body.mp-linked{padding-left:210px}","body.mp-linked{padding-left:0}")
(ROOT/'out-v5.5/mp-bridge.js').write_text(s); print('bridge v21 patched')
