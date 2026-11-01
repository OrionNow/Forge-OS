import sys,pathlib
P=pathlib.Path('/workspace/forge-os/out-v5.2/mp-bridge.js'); s=P.read_text()
def rep(a,b):
    global s
    n=s.count(a)
    if n!=1: sys.exit(f'PATCH FAIL ({n}): {a[:90]!r}')
    s=s.replace(a,b)
rep('err.invalid = res.status === 400 || res.status === 413;','err.invalid = res.status === 400 || res.status === 413;\n      err.status = res.status;')
# backoff: neither the 220ms send timer nor the poll loop retries a refused update before MP.holdUntil
rep('''    clearTimeout(MP.kick);
    MP.kick = setTimeout(() => void flush(), 220);''','''    clearTimeout(MP.kick);
    MP.kick = setTimeout(() => { flush().catch((e) => { MP.error = String((e && e.message) || e); }); }, Math.max(220, (MP.holdUntil || 0) - Date.now()));''')
rep('''  async function flush() {
    if (!MP.ready || pushing) {''','''  async function flush(force) {
    if (!force && (MP.holdUntil || 0) > Date.now()) return;
    if (!MP.ready || pushing) {''')
rep('      MP.badPush = 0;\n      applyRemote(res);','      MP.badPush = 0;\n      MP.holdUntil = 0;\n      applyRemote(res);')
i=s.index('      if (err.invalid) {\n        MP.badPush'); j=s.index('      throw err;\n    }\n  }\n\n  async function flush')
s=s[:i]+'''      if (err.invalid) {
        /* v5.2.1: a refused update (400, or 413 = too large) is reported every time, trimmed, and retried with
           backoff (1s, 2s, 4s .. 15s) instead of 32 silent retries in 6s */
        MP.badPush = (MP.badPush || 0) + 1;
        const big = err.status === 413;
        MP.logs = MP.logs.filter((l) => !payload.logs.includes(l));
        let what = "its console lines were kept local only";
        if (big) what = trimLocal(MP.badPush) + "; its console lines were kept local only";
        if (MP.badPush >= 2) { MP.impacts = MP.impacts.filter((i) => !payload.impacts.includes(i)); what += "; its queued hits were dropped (apply them again by hand)"; }
        const wait = Math.min(15000, 1000 * 2 ** (MP.badPush - 1));
        MP.holdUntil = Date.now() + wait;
        if (MP.badPush <= 3 || MP.badPush % 5 === 0)
          noteLocal("[ !! ] LINK REFUSED AN UPDATE" + (big ? " (TOO LARGE)" : "") + " :: " + esc(err.message || "invalid") + " :: " + what + "; retrying in " + Math.round(wait / 1000) + "s. Type MP WHOAMI if this repeats.");
        MP.error = "update refused: " + (err.message || "invalid");
        setTimeout(schedule, wait);
        return false;
      }
'''+s[j:]
# local trim used on 413: undo stacks first, then the import report (the two fields that grow without bound)
rep('''  function noteLocal(m) {''','''  function trimLocal(level) {
    const S = Forge.state();
    try { Forge.save(); } catch (e) {}
    const mine = (S.sheets || []).filter((sh) => sh.d && (MP.role === "host" || sh.ownerId === MP.selfId));
    for (const sh of mine) {
      if (Array.isArray(sh.d.undo) && sh.d.undo.length > 8) sh.d.undo = sh.d.undo.slice(-8);
      if (level >= 2 && sh.d.importReport) sh.d.importReport = null;
    }
    if (Array.isArray(S.undo) && S.undo.length > 8) S.undo = S.undo.slice(-8);
    if (level >= 2 && S.importReport) S.importReport = null;
    return level >= 2 ? "undo history trimmed to 8 steps and the import report dropped" : "undo history trimmed to 8 steps";
  }
  function noteLocal(m) {''')
# MP RESYNC / RESET-LOCAL: send first (wait for the ack), then confirm
rep('''  function mpCommand(sub) {''','''  function pendingInfo() {
    let edits = 0;
    try { edits = dirtyWritable(localSheets()).length; } catch (e) { edits = 0; }
    const forced = MP.forceState ? MP.forceState.size : 0;
    const n = MP.impacts.length + MP.logs.length + edits + forced;
    const txt = MP.impacts.length + " HIT(S), " + MP.logs.length + " LINE(S), " + (edits + forced) + " UNIT EDIT(S)";
    return { n, txt };
  }
  async function flushNow() {
    clearTimeout(MP.kick);
    for (let i = 0; i < 6 && pendingInfo().n; i++) {
      if (pushing) { await new Promise((r) => setTimeout(r, 150)); continue; }
      try { await flush(true); } catch (e) { MP.error = String((e && e.message) || e); break; }
      if (!MP.ready) break;
    }
    return pendingInfo();
  }
  async function mpCommand(sub) {''')
i=s.index('    if (sub === "resync") {'); j=s.index('    mpLine("[ -- ] MP COMMANDS ::')
s=s[:i]+'''    if (/^(resync|reset-local|reset)( confirm| force)?$/.test(sub)) {
      const reset = !/^resync/.test(sub), word = reset ? "RESET-LOCAL" : "RESYNC";
      const confirm = / confirm$/.test(sub), force = / force$/.test(sub);
      mpLine("[ -- ] " + word + " :: sending pending changes first...", "dim");
      Forge.render();
      const p = await flushNow();
      const left = p.n ? "UNSENT: " + p.txt + " could not be sent (link " + esc(MP.status) + (MP.error ? ", " + esc(MP.error) : "") + ")" : "all changes sent and acknowledged";
      if (!reset && !p.n && !confirm && !force) { doResync(); return; }
      if (!confirm && !force) {
        mpLine("[ !! ] " + word + " :: " + left + ". Type MP " + word + " CONFIRM to " + (reset ? "release this seat and re-enter your callsign" : "drop them and load the table copy") + ".", p.n ? "bad" : "warn");
        Forge.render();
        return;
      }
      if (p.n && !force && reset) {
        mpLine("[ !! ] " + word + " REFUSED :: " + left + ". Wait for LINK ONLINE and try again, or type MP RESET-LOCAL FORCE to discard them.", "bad");
        Forge.render();
        return;
      }
      if (reset) doReset(); else doResync(p.n);
      return;
    }
'''+s[j:]
rep('''  let installed = false;''','''  function doResync(dropped) {
    MP.shadow = [];
    MP.sheetFp = "";
    MP.forceState.clear();
    MP.rev = -1;
    MP.badPush = 0;
    MP.holdUntil = 0;
    MP.told.clear();
    mpLine("[ -- ] RESYNC :: " + (dropped ? "unsent sheet edits dropped; " : "") + "loading the table copy", "warn");
    Forge.render();
    void loop();
  }
  function doReset() {
    const token = MP.token, code = MP.code;
    MP.impacts = [];
    MP.logs = [];
    MP.forceState.clear();
    MP.drops = [];
    MP.dropped = new Set();
    MP.popped = new Set();
    MP.told.clear();
    MP.holdUntil = 0;
    const done = () => window.mpReauth();
    if (token) api({ op: "leave", code: code || "TABLE", token }).then(done, done);
    else done();
  }

  let installed = false;''')
rep('MP RESYNC (take the table copy) // MP RESET-LOCAL (release this seat, clear cached link state, re-enter your callsign)','MP RESYNC (send pending changes, then take the table copy) // MP RESET-LOCAL (send pending changes, then release this seat and re-enter your callsign; asks for CONFIRM)')
s=s.replace('/* mp-bridge.js v16','/* mp-bridge.js v17 (5.2.1)',1)
P.write_text(s); print('bridge 5.2.1 patched')
