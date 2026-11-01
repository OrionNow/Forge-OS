import sys,pathlib
ROOT=pathlib.Path('/workspace/forge-os')
s=(ROOT/'out/mp-bridge.js').read_text()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n} hits): {old[:100]!r}')
    s=s.replace(old,new)
rep("""   only the host clears the shared log (R9); no seat is taken on the login screen. See SERVER-CONTRACT.md. */""",
"""   only the host clears the shared log (R9); no seat is taken on the login screen. See SERVER-CONTRACT.md.
   v16 (FORGE-OS 5.2): tab actions in a context menu (data-act); a console line or name the server would refuse
   no longer blocks every later push; the owner's value wins collisions on their own unit (both sides agree); empty table copies
   never wipe local skills/loadout/heat; seat-mismatch notices; console MP WHOAMI / MP RESYNC / MP RESET-LOCAL. */""")
rep("    lastSt: \"\",\n  };","    lastSt: \"\",\n    badPush: 0,\n    told: new Set(),\n  };")
# names the server caps at 28 chars (zod) must never poison a push
rep("""      name: sh.name || "",
      col: sh.col || 0,
      hidden: !!sh.hidden,
      closed: !!sh.closed,
      ownerId: sh.ownerId || null,
      d: sh.d || null,""","""      name: String(sh.name || "").slice(0, 28),
      col: sh.col || 0,
      hidden: !!sh.hidden,
      closed: !!sh.closed,
      ownerId: sh.ownerId || null,
      d: sh.d || null,""")
rep("""    return { uid: sh.uid, name: sh.name || "", col: sh.col || 0,""","""    return { uid: sh.uid, name: String(sh.name || "").slice(0, 28), col: sh.col || 0,""")
# api(): mark schema/size refusals
rep("""      err.ended = res.status === 404;
      err.rejected = res.status === 403;""","""      err.ended = res.status === 404;
      err.rejected = res.status === 403;
      err.invalid = res.status === 400 || res.status === 413;""")
# console lines: cap below the server's 8000-char limit
rep("""        tone: k === "ok" || k === "bad" || k === "warn" ? k : "dim",
        html: s,
      };""","""        tone: k === "ok" || k === "bad" || k === "warn" ? k : "dim",
        html: capHtml(s),
      };""")
rep("""  function safeTone(k) {""","""  /* the server refuses a push whose console line is over 8000 chars (zod); long multi-hit damage rolls
     could reach that, and the refused push used to be retried forever with every later edit queued behind it */
  function capHtml(h) {
    const s = String(h || "");
    if (s.length <= 7800) return s;
    const box = document.createElement("template");
    box.innerHTML = s;
    const txt = (box.content.textContent || "").replace(/\\s+/g, " ");
    return esc(txt.slice(0, 7000)) + " … [LINE TRUNCATED FOR THE TABLE]";
  }

  function safeTone(k) {""")
# pushOnce: a refused push drops its console lines (the usual offender) instead of blocking the queue
rep("""        return true;
      }
      throw err;
    }
  }

  async function flush() {""","""        return true;
      }
      if (err.invalid) {
        MP.badPush = (MP.badPush || 0) + 1;
        MP.logs = MP.logs.filter((l) => !payload.logs.includes(l));
        if (MP.badPush >= 2) MP.impacts = MP.impacts.filter((i) => !payload.impacts.includes(i));
        noteLocal("[ !! ] LINK REFUSED AN UPDATE :: " + esc(err.message || "invalid") + " :: " + (MP.badPush >= 2 ? "its console lines and queued hits were kept local only" : "its console lines were kept local only") + "; sheet edits are re-sent. Type MP WHOAMI if this repeats.");
        MP.error = "update refused: " + (err.message || "invalid");
        setTimeout(schedule, 50);
        return false;
      }
      throw err;
    }
  }

  async function flush() {""")
rep("""      MP.conflictTries = 0;
      MP.stuck = false;
      applyRemote(res);""","""      MP.conflictTries = 0;
      MP.stuck = false;
      MP.badPush = 0;
      applyRemote(res);""")
# owner wins collisions on their own unit (host side)
rep("""    const keepMine = MP.role === "host" || !MP.hostOnline;
    for (const m of dirty) {
      const sh = (sheets || []).find((s) => s.uid === m.uid);
      const b = byBase.get(m.uid);
      if (!sh || !sh.d || !b) continue;
      const B = split(b.d), M = split(m.d), T = split(sh.d);
      const hits = [];
      const pick = (c) => { hits.push(c); return keepMine ? c.mine : c.theirs; };""","""    const keepMine0 = MP.role === "host" || !MP.hostOnline;
    for (const m of dirty) {
      const sh = (sheets || []).find((s) => s.uid === m.uid);
      const b = byBase.get(m.uid);
      if (!sh || !sh.d || !b) continue;
      /* v5.2: on a unit owned by another seat that is online, that pilot's value wins (skills, loadout, heat);
         the host used to win here, so a host with the pilot's tab open could overwrite the pilot's edits */
      const ownerOn = MP.role === "host" && b.ownerId && b.ownerId !== MP.selfId && (MP.members || []).some((x) => x.id === b.ownerId && x.online);
      const keepMine = (keepMine0 && !ownerOn) || b.ownerId === MP.selfId;
      const B = split(b.d), M = split(m.d), T = split(sh.d);
      const hits = [];
      const pick = (c) => { hits.push(Object.assign(c, { owner: ownerOn, mineUnit: MP.role !== "host" && b.ownerId === MP.selfId })); return keepMine ? c.mine : c.theirs; };""")
rep("""      const rule = MP.role === "host" ? "HOST VALUE KEPT" :""","""      const rule = c.owner ? "OWNER VALUE KEPT" : c.mineUnit ? "YOUR VALUE KEPT (YOUR UNIT)" : MP.role === "host" ? "HOST VALUE KEPT" :""")
# applyRemote: empty-copy guard + seat-mismatch notice
rep("""      S.sheets = JSON.parse(JSON.stringify(merged));
      if (dirty.length) { try { mergeDirty(S.sheets, baseShadow, dirty); } catch (e) { console.error("[forge] merge", e); } }""","""      S.sheets = JSON.parse(JSON.stringify(merged));
      if (dirty.length) { try { mergeDirty(S.sheets, baseShadow, dirty); } catch (e) { console.error("[forge] merge", e); } }
      try { keepNonEmpty(S.sheets, localBy); } catch (e) { console.error("[forge] guard", e); }""")
rep("""    drainRolls(view.rolls || []);
    paintFriends();
    if (sameSheets && (sameMem || isTyping())) return;""","""    drainRolls(view.rolls || []);
    paintFriends();
    try { seatCheck(incoming); } catch (e) { /* advisory only */ }
    if (sameSheets && (sameMem || isTyping())) return;""")
rep("""  function isTyping() {""","""  /* v5.2 guard: never let an empty table copy wipe non-empty local skills, loadout or heat on a unit this seat
     writes. The local values are kept (and re-sent by the next push, which repairs the stored copy). */
  function emptyObj(v) { return !v || typeof v !== "object" || !Object.keys(v).some((k) => v[k] !== "" && v[k] != null); }
  function keepNonEmpty(sheets, localBy) {
    for (const sh of sheets || []) {
      if (!sh || !sh.d) continue;
      /* only units this seat owns (or unowned units, for the host): the owner's own deliberate clear is local */
      if (!(sh.ownerId === MP.selfId || (MP.role === "host" && !sh.ownerId))) continue;
      const loc = localBy.get(sh.uid);
      if (!loc || !loc.d) continue;
      const kept = [];
      if (emptyObj(sh.d.pilot) && !emptyObj(loc.d.pilot)) { sh.d.pilot = JSON.parse(JSON.stringify(loc.d.pilot)); kept.push("skills"); }
      if ((!Array.isArray(sh.d.items) || !sh.d.items.length) && Array.isArray(loc.d.items) && loc.d.items.length) { sh.d.items = JSON.parse(JSON.stringify(loc.d.items)); kept.push("loadout"); }
      if (loc.d.tel && (!sh.d.tel || sh.d.tel.heat == null) && loc.d.tel.heat != null) {
        if (!sh.d.tel) sh.d.tel = JSON.parse(JSON.stringify(loc.d.tel));
        else sh.d.tel.heat = loc.d.tel.heat;
        kept.push("heat");
      }
      if (kept.length) tellOnce("guard:" + sh.uid + kept.join(), "[ !! ] SYNC GUARD :: the table copy of " + esc(sh.name || "this unit") + " arrived with empty " + kept.join(", ") + "; your local values were kept and will be re-sent. Type MP RESYNC to take the table copy instead.");
    }
  }
  function tellOnce(key, m) { if (MP.told.has(key)) return; MP.told.add(key); noteLocal(m); }
  function seatTag(id) { return id ? "#" + String(id).slice(0, 4) : "#----"; }
  /* a pilot who re-entered while their old seat was still online (second tab, lost token, shared browser) got a
     second seat with the same callsign; their unit stayed with the old seat, so every edit was discarded */
  function seatCheck(incoming) {
    if (MP.role === "host" || !MP.selfId) return;
    const mine = (incoming || []).some((s) => s.ownerId === MP.selfId);
    if (mine) return;
    const me = String(MP.callsign || "").toUpperCase();
    const twin = (MP.members || []).find((m) => m.id !== MP.selfId && String(m.callsign || "").toUpperCase() === me);
    if (!twin) return;
    const unit = (incoming || []).find((s) => s.ownerId === twin.id);
    if (!unit) return;
    tellOnce("twin:" + twin.id, "[ !! ] SEAT MISMATCH :: " + esc(unit.name || "a unit") + " belongs to an older seat with your callsign (" + seatTag(twin.id) + "); this tab is seat " + seatTag(MP.selfId) + ", so your edits there cannot be saved. Type MP RESET-LOCAL to release this seat and reclaim it, or ask the host to assign the unit to you.");
  }

  function isTyping() {""")
# restoreUnowned: say why an edit was reverted
rep("""      if (sh.d && dmg) sh.d.dmg = dmg;
      patched = patched || sh.uid === cur;""","""      if (sh.d && dmg) sh.d.dmg = dmg;
      if (sh.uid === cur) {
        const owner = (MP.members || []).find((m) => m.id === prev.ownerId);
        tellOnce("unowned:" + sh.uid, "[ !! ] EDITS NOT SAVED :: " + esc(prev.name || "this unit") + " is assigned to " + esc(owner ? shownName(owner) + " " + seatTag(owner.id) : prev.ownerId ? "seat " + seatTag(prev.ownerId) : "nobody") + "; this tab is " + esc(MP.callsign) + " " + seatTag(MP.selfId) + ". Ask the host to assign it to you, or type MP WHOAMI.");
      }
      patched = patched || sh.uid === cur;""")
# console commands
rep("""    Forge.wrap("exec", (prev) => function (raw) {
      const c = String(raw || "").trim().toLowerCase();""","""    Forge.wrap("exec", (prev) => function (raw) {
      const c = String(raw || "").trim().toLowerCase();
      if (/^mp( |$)/.test(c) && MP.linked) { mpCommand(c.slice(2).trim()); return; }""")
rep("""  let installed = false;""","""  function mpLine(m, k) { MP.applying = true; try { Forge.say(m, k || "dim"); } finally { MP.applying = false; } }
  function mpCommand(sub) {
    const S = Forge.state();
    const me = (MP.members || []).find((m) => m.id === MP.selfId);
    if (sub === "whoami" || sub === "diag" || sub === "") {
      const sh = S.sheets && S.sheets[S.cur];
      const owner = sh ? (MP.members || []).find((m) => m.id === sh.ownerId) : null;
      const writable = !!sh && (MP.role === "host" || sh.ownerId === MP.selfId);
      const mine = (S.sheets || []).filter((s) => s.ownerId === MP.selfId).map((s, i) => esc(s.name || "UNIT " + (i + 1)));
      mpLine("[ -- ] SEAT :: " + esc(MP.callsign) + " " + seatTag(MP.selfId) + " // " + MP.role.toUpperCase() + (me ? "" : " // NOT IN ROSTER") + " // LINK " + esc(MP.status) + " // REV " + MP.rev + " // QUEUE " + MP.impacts.length + " HIT(S), " + MP.logs.length + " LINE(S)" + (MP.error ? " // LAST ERROR " + esc(MP.error) : ""), "ok");
      mpLine("[ -- ] CURRENT UNIT :: " + (sh ? esc(sh.name || "UNIT") + " // OWNER " + (owner ? esc(shownName(owner)) + " " + seatTag(owner.id) : sh.ownerId ? "UNKNOWN SEAT " + seatTag(sh.ownerId) : "NONE") + " // " + (writable ? "YOUR EDITS ARE SAVED" : "READ ONLY FOR THIS SEAT") : "none"), writable ? "ok" : "warn");
      mpLine("[ -- ] YOUR UNITS :: " + (mine.length ? mine.join(", ") : "none") + " // MP RESYNC = take the table copy // MP RESET-LOCAL = release this seat and re-enter your callsign", "dim");
      Forge.render();
      return;
    }
    if (sub === "resync") {
      MP.shadow = [];
      MP.sheetFp = "";
      MP.forceState.clear();
      MP.rev = -1;
      MP.badPush = 0;
      MP.told.clear();
      mpLine("[ -- ] RESYNC :: local unsent sheet edits dropped; loading the table copy", "warn");
      Forge.render();
      MP.rev = -1;
      void loop();
      return;
    }
    if (sub === "reset-local" || sub === "reset") {
      const token = MP.token, code = MP.code;
      MP.impacts = [];
      MP.logs = [];
      MP.forceState.clear();
      MP.drops = [];
      MP.dropped = new Set();
      MP.popped = new Set();
      MP.told.clear();
      const done = () => window.mpReauth();
      if (token) api({ op: "leave", code: code || "TABLE", token }).then(done, done);
      else done();
      return;
    }
    mpLine("[ -- ] MP COMMANDS :: MP WHOAMI (seat and unit ownership) // MP RESYNC (take the table copy) // MP RESET-LOCAL (release this seat, clear cached link state, re-enter your callsign)", "dim");
    Forge.render();
  }

  let installed = false;""")
# tab context menu hooks (mpTabs)
rep("""        ? `<span class=stx title="Rename" onclick=""","""        ? `<span class=stx data-act=rename data-label="Rename unit" title="Rename this unit" onclick=""")
rep("""`<span class="stx asg" data-assign="1" style="color:${roleCol}" title="Assign" ""","""`<span class="stx asg" data-assign="1" data-act=assign data-label="Assign pilot…" style="color:${roleCol}" title="Assign this unit to a seat, or mark it closed" """)
rep("""        ? `<span class=stx title="Delete" onclick=""","""        ? `<span class=stx data-act=close data-label="Delete unit" title="Delete this unit from the sortie" onclick=""")
rep("""`<span class=stx title="${held ? "Deploy to the sortie" : "Hold"}" onclick=""","""`<span class=stx data-act=hold data-label="${held ? "Deploy to the sortie" : "Move to the holding bay"}" title="${held ? "Deploy this unit to the sortie (pilots see it)" : "Hold this unit back (pilots do not see it)"}" onclick=""")
rep("""<span class=stx title="Duplicate" onclick=""","""<span class=stx data-act=dup data-label="Duplicate unit" title="Duplicate this unit into a new tab" onclick=""")
rep("""      const hint = on && canPaint(sh) ? "Click again to cycle this color. Drag the tab to reorder." : "Drag the tab to reorder.";""",
    """      const hint = (on && canPaint(sh) ? "Click again to cycle this color. Drag the tab to reorder." : "Click to open. Drag the tab to reorder.") + (owner ? " Pilot: " + shownName(owner) + "." : "") + " Right-click or Shift+F10 for unit actions.";""")
rep("""      return `<span class="stab${on ? " on" : ""}" data-uid="${esc(sh.uid)}"${style}""","""      return `<span class="stab${on ? " on" : ""}" data-uid="${esc(sh.uid)}" tabindex=0 role=button aria-haspopup=menu${style}""")
# roster: duplicate callsigns get a seat tag; tooltips
rep("""    if (!n || n.toUpperCase() === "USER UNKNOWN") return "user unknown";
    return n;""","""    if (!n || n.toUpperCase() === "USER UNKNOWN") return "user unknown";
    const twins = (MP.members || []).filter((x) => String(x.callsign || "").trim().toUpperCase() === n.toUpperCase()).length;
    return twins > 1 ? n + " " + seatTag(m.id) : n;""")
rep("""    const click = canTint ? ` onclick="mpTint(event,'${m.id}')"` : "";""","""    const click = canTint ? ` onclick="mpTint(event,'${m.id}')" title="Change this seat's color (seat ${seatTag(m.id)})"` : ` title="Seat ${seatTag(m.id)}"`;""")
rep("""<button type=button onclick="mpSeats()" title="${MP.seatsOpen ? "Collapse" : "Expand"}">""","""<button type=button onclick="mpSeats()" title="${MP.seatsOpen ? "Collapse the table roster" : "Expand the table roster"}">""")
rep('''      let i = prevUid ? S.sheets.findIndex((s) => s.uid === prevUid) : -1;
      if (i < 0) i = S.sheets.findIndex((s) => !s.hidden);''','''      let i = prevUid ? S.sheets.findIndex((s) => s.uid === prevUid) : -1;
      if (i < 0 && MP.role !== "host") i = S.sheets.findIndex((s) => !s.hidden && s.ownerId === MP.selfId);
      if (i < 0) i = S.sheets.findIndex((s) => !s.hidden);''')
rep('''    MP.rev = -1;
    MP.shadow = [];
    MP.confAt = 0;
    document.body.classList.remove("mp-live", "mp-linked", "mp-friends-min");''','''    MP.rev = -1;
    MP.shadow = [];
    MP.sheetFp = "";
    MP.memFp = "";
    MP.confAt = 0;
    document.body.classList.remove("mp-live", "mp-linked", "mp-friends-min");''')
(ROOT/'out-v5.2/mp-bridge.js').write_text(s)
h=(ROOT/'out/forge-hook.js').read_text()
h=h.replace("v7 (FORGE-OS 5.1): adds Forge.version, Forge.ui() and Forge.announce(); otherwise unchanged.","v8 (FORGE-OS 5.2): version bump only (cache key); v7 added Forge.version, Forge.ui() and Forge.announce().").replace("version: 7,","version: 8,")
assert "version: 8," in h
(ROOT/'out-v5.2/forge-hook.js').write_text(h)
print('bridge patched')
