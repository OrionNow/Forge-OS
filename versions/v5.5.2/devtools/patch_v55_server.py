import sys,pathlib
p=pathlib.Path('/workspace/forge-os/out-v5.5/server/room.server.ts');s=pathlib.Path('/workspace/forge-os/out-v5.4/server/room.server.ts').read_text()
def rep(a,b,n=1):
    global s
    c=s.count(a)
    if c!=n: sys.exit(f'SERVER PATCH FAIL ({c}): {a[:80]!r}')
    s=s.replace(a,b)
rep("function applyRest(sheet: SheetSnap, rest: Record<string, unknown>) {","""// v5.5: the unit owner name (d.own) is host-only and capped at 28 characters; writes from other seats keep the stored value
const OWN_MAX = 28;
function ownClean(v: unknown): string {
  return typeof v === "string" ? v.replace(/\\s+/g, " ").trim().slice(0, OWN_MAX).trim() : "";
}
function ownFix(d: Record<string, unknown>, prevOwn: unknown, host: boolean) {
  const v = host ? ownClean(d.own) : ownClean(prevOwn);
  if (v) d.own = v;
  else delete d.own;
}

function applyRest(sheet: SheetSnap, rest: Record<string, unknown>, host = false) {""")
rep("""  if ("info" in prev) d.info = prev.info;
  sheet.d = d;
  sheet.rev += 1;
}""","""  if ("info" in prev) d.info = prev.info;
  ownFix(d, prev.own, host);
  sheet.d = d;
  sheet.rev += 1;
}""")
rep("function sheetFromUpsert(up: z.infer<typeof upsertSchema>, members: Set<string>): SheetSnap | null {\n  if (up.d != null && (typeof up.d !== \"object\" || !blobOk(up.d, 500_000))) return null;\n  return {",
"function sheetFromUpsert(up: z.infer<typeof upsertSchema>, members: Set<string>, host = true): SheetSnap | null {\n  if (up.d != null && (typeof up.d !== \"object\" || !blobOk(up.d, 500_000))) return null;\n  const d0 = up.d && typeof up.d === \"object\" ? { ...(up.d as Record<string, unknown>) } : null;\n  if (d0) ownFix(d0, undefined, host);\n  return {")
rep("    d: (up.d as Record<string, unknown> | null) ?? null,\n  };","    d: d0,\n  };")
rep("const made = sheetFromUpsert({ ...up, ownerId: member.member_id, hidden: false }, ids);","const made = sheetFromUpsert({ ...up, ownerId: member.member_id, hidden: false }, ids, false);")
rep("    applyRest(sheet, rest.rest);","    applyRest(sheet, rest.rest, member.role === \"host\");")
p.write_text(s);print('server patched')
