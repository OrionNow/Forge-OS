import sys,pathlib
ROOT=pathlib.Path('/workspace/forge-os')
s=(ROOT/'out-v5.4/terminal.html').read_text()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n} hits): {old[:90]!r}')
    s=s.replace(old,new)
rep("const APP_VERSION='5.4.0';","const APP_VERSION='5.5.0';")
rep('<script src="mp-bridge.js?v=20"></script>','<script src="mp-bridge.js?v=21"></script>')
rep("const hxBox=()=>","let hxBox=()=>")
# heat split + Parry/Block use SKILL MOD; attacks use the targeter ROLL MOD
rep("mod=(pNum(k.startsWith('w_')?'mod':'smod')||0)+heatX();","mod=t=='atk'?(pNum('mod')||0)+tgHeat():(pNum('smod')||0)+heatX();")
rep("mod=pNum(k.startsWith('w_')?'mod':'smod')||0,hn=","mod=(t=='atk'?pNum('mod'):pNum('smod'))||0,hn=")
rep("if(mod)p.push('MOD '+sg(mod));if(heatX())p.push('HEAT +2');","if(mod)p.push('MOD '+sg(mod));if(t=='atk'?tgHeat():heatX())p.push('HEAT +2');")
rep("mk=q[0]=='atk'?null:pNum(q[1].startsWith('w_')?'mod':'smod');","mk=q[0]=='atk'?null:pNum('smod');")
rep("if(heatX())label+=' (HEAT +2)'","if(q[0]=='atk'?tgHeat():heatX())label+=' (HEAT +2)'")
rep("+(pNum('mod')||0)+rofBon(rofEffNow())+heatX();","+(pNum('mod')||0)+rofBon(rofEffNow())+tgHeat();")
# right-click weapon menu: no targeter entry (left-click only)
rep("if(S.view=='sortie'&&k>=0)items.push({l:awK()===k?'Targeter bound to this weapon':'Open targeter for this weapon',tip:'Bind the targeter and All-Out Attack to '+it.n+' (same as left-click)',run:()=>itemClick(i)});","")
# RoF typing no longer logs a stray BASE SKILL line
rep("""if(this.value!==''&&+this.value!==S.dmgN)this.value=S.dmgN;pilotLive()" onchange="skillNote(this)">""","""if(this.value!==''&&+this.value!==S.dmgN)this.value=S.dmgN;pilotLive()">""")
# IMPACT RESOLUTION: effective DR on line 2 with the repair buttons; no stability threshold indicator
rep("""[APPLY]</button>${repBtns(t)}<span id=dm_eff class=dmeff>""","""[APPLY]</button><div class=dmrow2><span id=dm_eff class=dmeff>""")
rep("""${stabHint(calc)}`:''}</span></div>`;""","""`:''}</span>${repBtns(t)}</div></div>`;""")
rep("${stabHint(c)}","")
# VENT: base heat vented; degrees of success in steps of 1
rep("""<button title="Engineering roll: vents 1 heat plus 1 more for every ${Math.max(1,ventBase())} points of margin; minimum 2 on a success, minimum 1 on a failure" onclick="heatVent()">[VENT /${Math.max(1,ventBase())}]</button>""","""<button title="Engineering roll. Failure: vents ${Math.max(1,ventBase())} (VENT). Success: VENT + 1 per degree of success, minimum ${Math.max(1,ventBase())+1} (VENT + 1)." onclick="heatVent()">[VENT ${Math.max(1,ventBase())}]</button>""")
rep("[/^\\[VENT\\b/,'Vent heat: Engineering roll; at least 1 on a failure, 2 on a success']","[/^\\[VENT\\b/,'Vent heat: Engineering roll; VENT on a failure, VENT + degrees of success (at least VENT + 1) on a success']")
rep("['REACTOR (R)','VENT','VENT:2','Heat vented per vent action. Carried by reactors, or by the frame itself on a non-modular General Chassis.','live'],","['REACTOR (R)','VENT','VENT:2','Base heat vented per vent action: VENT on a failed Engineering roll, VENT + 1 per degree of success (at least VENT + 1) on a success. Carried by reactors, or by the frame itself on a non-modular General Chassis.','live'],")
# DATA ONLY: the audio wrapper on type() dropped the flavour flag (boot/transition lines showed as msg)
rep("const _ty=type;type=function(el,html){","const _ty=type;type=function(el,html,fk){")
rep("return _ty.call(this,el,html)};","return _ty.call(this,el,html,fk)};")
# off-table chat echoes in the user colour (cyan, the header text colour) instead of system green
rep("if(t[0]!=='/'){chatShow('LOCAL','',t);","if(t[0]!=='/'){chatShow('LOCAL','var(--cyan)',t);")
# tab menu tips: data-tip wins (Assign pilot... describes picking a seat)
rep("acts.forEach(a=>items.push({l:a.dataset.label||a.textContent,tip:a.title||a.dataset.label||''","acts.forEach(a=>items.push({l:a.dataset.label||a.textContent,tip:a.dataset.tip||a.title||a.dataset.label||''")
# USERS toggle: top bar -> right end of the OPERATOR CONSOLE header
rep('<header><button id="rosterBtn" class="hros" type="button" hidden onclick="window.mpSeats&&mpSeats()" title="Show or hide the table roster">[USERS]</button>','<header>')
rep('onclick="event.stopPropagation();toggleLF()">[ALL LINES]</button></div>','onclick="event.stopPropagation();toggleLF()">[ALL LINES]</button><button id="rosterBtn" class="hros" type="button" hidden onclick="event.stopPropagation();window.mpSeats&&mpSeats()" title="Show or hide the table roster">[USERS]</button></div>')
rep("'importNotesHidden','hitq','own'];","'importNotesHidden','hitq','own','tgw'];")
rep("const CHANGELOG=[\n","const CHANGELOG=[\n{v:'5.5.0',items:['Targeter: click the weapon again to close it; each weapon keeps its own targeter settings. ACC, Heat and All-Out Attack share one line (descriptions on hover). Separate [HEAT] buttons: SKILL MOD Heat for skills and active defenses, targeter Heat for attacks. Parry and Block use SKILL MOD.','VENT is the base heat vented (VENT on a failure, VENT + degrees of success, at least VENT + 1, on a success). IMPACT RESOLUTION: effective DR on line 2 with REPAIR; no stability threshold.','Table: players can view other units (no rolls or skills) and cannot open their tab menus; chat keeps the sender color on every seat and works off-table; the USERS list opens inside the operator console.']},\n")
css=(ROOT/'devtools/v55.css').read_text(); js=(ROOT/'devtools/v55.js').read_text()
rep("</style></head>",css+"</style></head>")
k=s.rindex("\n</script>"); s=s[:k]+"\n"+js+s[k:]
(ROOT/'out-v5.5/terminal.html').write_text(s); print('v5.5 terminal patched',len(s))
