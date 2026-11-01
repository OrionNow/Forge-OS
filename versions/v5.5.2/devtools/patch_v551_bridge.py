import sys,pathlib
ROOT=pathlib.Path('/workspace/forge-os')
s=(ROOT/'out-v5.5/mp-bridge.js').read_text()
def rep(a,b,n=1):
    global s
    c=s.count(a)
    if c!=n: sys.exit(f'BRIDGE PATCH FAIL ({c}): {a[:80]!r}')
    s=s.replace(a,b)
rep("the USERS list opens inside the operator console. */","the USERS list opens inside the operator console.\n   v22 (FORGE-OS 5.5.1): chat lines that arrive without their chat card (rc stripped) still render as chat in the\n   sender colour (the old fallback tinted only the name and left the text in the grey .dim tone); roster LINK header removed. */")
rep("  window.mpCanMenu = function (uid) {","  window.mpViewOnly = function () { return locked(); };\n\n  window.mpCanMenu = function (uid) {")
rep('''      const who = `<span style="color:${actorColor(r.actor, r.color)}">${esc(r.actor)}</span> <span class=dim>//</span> <span style="color:${unitColor(r.uid)}">${esc(r.unit)}</span> `;''','''      // v5.5.1: a chat line whose card was stripped on the way (older server, proxy) is plain escaped text with no
      // unit and the dim tone. Render it as chat so the text keeps the sender colour instead of the grey .dim span.
      if (!r.rc && !r.uid && safeTone(r.tone) === "dim" && typeof chatShow === "function" && !/[<>]/.test(String(r.html || ""))) {
        const ta = document.createElement("textarea");
        ta.innerHTML = String(r.html || "");
        chatShow(String(r.actor || "?"), actorColor(r.actor, r.color, r.actorId), ta.value);
        continue;
      }
      const who = `<span style="color:${actorColor(r.actor, r.color, r.actorId)}">${esc(r.actor)}</span> <span class=dim>//</span> <span style="color:${unitColor(r.uid)}">${esc(r.unit)}</span> `;''')
rep('''const html = `<div class=mph><span>LINK ${sync}</span></div>${MP.seatsOpen''','''const html = `${MP.seatsOpen''')
(ROOT/'out-v5.5.1/mp-bridge.js').write_text(s); print('bridge v22 patched')
