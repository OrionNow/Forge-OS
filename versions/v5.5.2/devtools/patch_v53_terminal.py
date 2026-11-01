import sys,pathlib
ROOT=pathlib.Path('/workspace/forge-os')
s=(ROOT/'out-v5.2/terminal.html').read_text()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n} hits): {old[:90]!r}')
    s=s.replace(old,new)
rep("const APP_VERSION='5.2.1';","const APP_VERSION='5.3.1';")
# --- REVERT fonts: original Consolas stack and sizes (no web font) ---
rep('@font-face{font-family:"JetBrains Mono";src:url(fonts/JetBrainsMono-Regular.woff2) format("woff2");font-weight:400;font-display:swap}\n','')
rep('@font-face{font-family:"JetBrains Mono";src:url(fonts/JetBrainsMono-Bold.woff2) format("woff2");font-weight:700;font-display:swap}\n','')
rep(':root{--font:"JetBrains Mono",Consolas,"DejaVu Sans Mono","Courier New",monospace;--fs-b:14px;--fs-l:12.5px;--fs-d:11.5px;--fs-e:15px;',':root{--font:Consolas,"Courier New",monospace;--fs-b:13px;--fs-l:12px;--fs-d:11px;--fs-e:14px;')
rep('body{font-family:var(--font);font-size:var(--fs-b);line-height:1.5}\n','')
# --- REVERT the HUD sortie header to the original one-line readout (BRITTLE and AOA tags kept) ---
i=s.index('let h=`<div class="sorhead hud"'); j=s.index('</div>`;',i)+len('</div>`;')
s=s[:i]+'let h=`<div class=sorhead><span class=nm>LIVE SORTIE TELEMETRY // ${esc(idline())}</span><span class=dim>${esc(S.ch[0])} :: BASE HP ${mx}${brittleVal()?` <b class="${brittleOn()?\'brtag\':\'dim\'}" title="BRITTLE: ${brittleVal()} SR while Core HP is below half">[BRITTLE ${brittleOn()?\'SR\'+brittleVal()+\' ACTIVE\':\'SR\'+brittleVal()+\' BELOW 1/2 HP\'}]</b>`:\'\'}</span><span>STATUS <b class="${st[1]}">${st[0]}</b></span>${aoaNow()?`<span><b class=aoatag title="All-Out Attack is set: no active defense until you switch it off in the TARGETER">AOA: ${aoaLab(aoaNow())} // NO DEFENSE</b></span>`:\'\'}<span class=dim>INTEGRITY <b>${igOf()}%</b></span><span class=dim>ISB LINK <b class=lnk id=sync data-s=local>[LOCAL]</b></span></div>`;'+s[j:]
# --- top bar on one line: brand / controls / clearance in one flex row; the R+D subtitle and the clock give way first ---
rep('<header><span><b>CORE EMPIRE</b> // SCIENCE CORPS R+D // FORGE-OS v','<header><span class=hbrand title="CORE EMPIRE // SCIENCE CORPS R+D // FORGE-OS"><b>CORE EMPIRE</b>&nbsp;<span class=hsub>// SCIENCE CORPS R+D</span><span class=hb2>&nbsp;// FORGE-OS v')
rep(' // TL8 <button id="muteBtn"',' // TL8</span></span><span class=hctl><button id="muteBtn"')
# --- paper doll full health: theme color, slightly desaturated (distinct from the ok/dmg/crit status colors) ---
rep("STT_COL={ok:'var(--c-ok)'","STT_COL={ok:'var(--c-full)'")
rep(".mlab.st-ok .hv,.mlab.st-ok .hpbar i{color:var(--c-ok)}",".mlab.st-ok .hv,.mlab.st-ok .hpbar i{color:var(--c-full)}")
# --- REMOVE the RAD tracker UI (S.pilot.rad stays in saved data, unused) ---
rep("${radBox()}","")
# --- defense buttons in the PILOTING box (left) ---
i=s.index('<div class=pact><span class=dim title="Dodge, Retreat'); j=s.index('</span></div>',i)+len('</span></div>')
s=s[:i]+'<div class="pact pdef">${defCtl()}</div>'+s[j:]
# --- targeter bound to the active weapon; DEFENSE // AOA section removed (moved to PILOTING / TARGETER) ---
rep("shHead('TG','--TARGETER'","shHead('TG','--TARGETER'+awTitle()")
rep("(shOpen('TG')?tgtGrid():'')","(shOpen('TG')?tgtBody():'')")
rep("+shHead('DF','--DEFENSE // ALL-OUT ATTACK',`<span id=defsum class=dim>${defSum()}</span>`)+(shOpen('DF')?defGrid():'')","")
# --- items: left-click = bind targeter (weapons), right-click = Info + station; no hand dropdown ---
rep('class="drag-row row" draggable="true" onclick="sheetOpen(${i})"','class="drag-row row${rowAw(i)?\' aw\':\'\'}" data-item="${i}" data-menu=item tabindex=0 aria-haspopup=menu ${rowAw(i)?\'aria-current=true\':\'\'} title="${rowTip(i)}" draggable="true" onclick="itemClick(${i})"')
rep("${mountSel(i)}","${mountTag(i)}")
# --- RoF: input max = the bound weapon's ROF (melee 1); TOTAL MOD and the RoF readouts use the clamped value ---
rep('min=1 max=30 value="${esc(S.dmgN??1)}" oninput="S.dmgN=this.value;pilotLive()"','min=1 max=${rofMax()} title="Rate of fire: max ${rofMax()} for this weapon" value="${esc(rofClamp(S.dmgN??1))}" oninput="S.dmgN=rofClamp(this.value);if(this.value!==\'\'&&+this.value!==S.dmgN)this.value=S.dmgN;pilotLive()"')
rep("rofBon(S.dmgN)","rofBon(rofEffNow())",4)
# --- Retreat +1 to Parry/Block/Turn Blow; All-Out Defense +2 ---
rep("if(t=='def')return Math.floor(b/2)+chStats().hnd+mod;","if(t=='def')return Math.floor(b/2)+chStats().hnd+mod+defMods(k);")
rep("+sitDef()+heatDodge();","+sitDef()+heatDodge()+aodBon('dod');")
rep("if(t=='dod'){if(sitDef())p.push('RETREAT '+sg(sitDef()));if(heatDodge())p.push('HEAT '+sg(heatDodge()))}","if(t=='dod'){if(sitDef())p.push('RETREAT '+sg(sitDef()));if(heatDodge())p.push('HEAT '+sg(heatDodge()))}if(t=='def'&&pNum('ret')==1)p.push('RETREAT +1');if((t=='dod'&&aodBon('dod'))||(t=='def'&&aodBon(kindOfK(k))))p.push('ALL-OUT DEFENSE +2');")
rep("if(q[0]=='dod'&&heatDodge())label+=' (HEAT '+sg(heatDodge())+')'","if(q[0]=='dod'&&heatDodge())label+=' (HEAT '+sg(heatDodge())+')';if(q[0]=='def'&&pNum('ret')==1)label+=' (RETREAT +1)';if((q[0]=='dod'&&aodBon('dod'))||(q[0]=='def'&&aodBon(kindOfK(q[1]))))label+=' (ALL-OUT DEFENSE +2)';if((q[0]=='dod'||q[0]=='def')&&aodNow()==5)label+=' (DOUBLE DEFENSE)'")
rep("note('[ -- ] RETREAT '+(on?'ENGAGED :: +3 TO DODGE':'DISENGAGED')","note('[ -- ] RETREAT '+(on?'ENGAGED :: +3 TO DODGE, +1 TO PARRY / BLOCK / TURN BLOW':'DISENGAGED')")
rep("Block rolls are in the DEFENSE section under the targeter","Block: use the DEFENSE button in PILOTING (right-click it to choose the shield)")
rep(">BLOCK: SEE DEFENSE<",">BLOCK: SEE PILOTING<")
# --- ATK binds the targeter to that weapon; All-Out Defense means no attack ---
rep("function atkRoll(k){const w=weapons()[k];if(!w)return reject('[FAIL] ARMAMENT INDEX INVALID :: no weapon exists at that index.');",
    "function atkRoll(k){const w=weapons()[k];if(!w)return reject('[FAIL] ARMAMENT INDEX INVALID :: no weapon exists at that index.');if(aodNow()){audioEvent('fail');return reject('[FAIL] ALL-OUT DEFENSE :: no attack this turn; switch All-Out Defense off in PILOTING first.')}if(awK()!==k)awBind(k);")

# --- console addendum: '/' commands + chat, compact roll cards, no timestamps, no CLEAR/COPY buttons, no hint ---
rep("say(`[ ROLL ] ${esc(label)} :: 3d6 [${r.join(', ')}] = <b class=rl-roll>${tot}</b> vs <b class=rl-tgt>SL ${nSL(sl)}</b> :: ${res.replace(/^(SUCCESS by \\d+|FAILURE by \\d+)/,m=>'<b class=rl-m>'+m+'</b>')} <button type=button class=cpy title=\"copy this roll line\" onclick=\"copyLine(this)\">[CPY]</button>`,ok?'ok':'bad');R()}","rollCard53(label,spec,r,tot,sl,ok,marg,res);R()}")
rep("dv=+m[3],cnt=dmgCount(w,c,k)","dv=+m[3],cid=((S.hitq||{})[k]||{}).c,cnt=dmgCount(w,c,k)")
rep("say('[ ROLL ] DAMAGE'+(DMGWHY?' ('+DMGWHY+')':'')+' :: '+ln.join('<br>'),'dim');R()}","dmgCard53(w,cid,n,mult,sb,atk,DMGWHY);R()}")
rep("d.innerHTML='<span class=ts aria-hidden=true>'+logTs()+'</span>'+html;","d.dataset.ts=logTs();d.innerHTML=html;")
rep('<span class="conbtns"><button type="button" onclick="copyLog()" title="Copy the whole console log">[COPY LOG]</button><button type="button" onclick="clearLog()" title="Clear the console log">[CLEAR]</button></span>','')
rep("say('INPUT :: UP/DOWN = command history | TAB = complete a command | L or EXIT = close session | CLEAR = clear the log | BACK = return','dim')","say('INPUT :: commands start with / (for example /help, /undo, /roll 1 x2, /mp whoami, /mp reset-local confirm) | text without / is a chat message to the table | UP/DOWN = history | TAB = complete | /L or /EXIT = close session | /CLEAR = clear the log (host only on a live table) | /BACK = return','dim')")
rep("function helpTel(){return['ISB CONSOLE // AVAILABLE COMMANDS','STATUS | SCAN = integrity report','TARGETS | TARGET n or name | NEXT | PREV','REPAIR [n | ALL] | WEAPONS | PILOT | INFO n','ROLL n [x] = damage roll for weapon n; x repeats | UNDO = revert the last change','SYNC = verify recorder | PING = test link | THEME | CLEAR','S = compile current sortie state | LOAD = import another frame | 0 = close session'].join('<br>')}",
 "function helpTel(){return['ISB CONSOLE // COMMANDS START WITH / (text without / is table chat)','/STATUS | /SCAN = integrity report','/TARGETS | /TARGET n or name | /NEXT | /PREV','/REPAIR [n | ALL] | /WEAPONS | /PILOT | /INFO n','/ROLL n [x] = damage roll for weapon n; x repeats | /UNDO = revert the last change','/SYNC = verify recorder | /PING = test link | /THEME | /CLEAR (host only on a live table)','/MP WHOAMI | /MP RESYNC | /MP RESET-LOCAL (both ask for CONFIRM)','/S = compile current sortie state | /LOAD = import another frame | /0 = close session'].join('<br>')}")
i=s.find('function tabComplete(');j=s.find('\nfunction',i+5);body=s[i:j]
body=body.replace("const v=CI.value,l=v.toLowerCase();","const sl=CI.value.startsWith('/'),v=sl?CI.value.slice(1):CI.value,l=v.toLowerCase();",1).replace("CI.value=","CI.value=(sl?'/':'')+")
s=s[:i]+body+s[j:]
rep("console command ROLL n x","console command /ROLL n x")
rep("force a count with ROLL n x","force a count with /ROLL n x")
rep("enter TARGETS","enter /TARGETS",2)
rep("(type TARGETS for the list)","(type /TARGETS for the list)")
rep('<script src="mp-bridge.js?v=17"></script>','<script src="mp-bridge.js?v=19"></script>')

# --- v5.3.1: an attack is one line (no 'PILOT ATTACK' / 'ROLL x' echoes); keep defense/AoD/AoA choices in the manifest ---
rep("audioEvent('dice');S.echo='PILOT '+label.split(' :: ')[0];","audioEvent('dice');if(S.echo==null)S.echo='';")
rep("w.pd=0;S.echo='ROLL '+w.n+(cnt>1?' x'+cnt:'');audioEvent('dice');","w.pd=0;if(S.echo==null)S.echo='';audioEvent('dice');")
rep("|tsm|fd|rad|aoa)$/.test(k)","|tsm|fd|rad|aoa|aoal|aod|aodl|dft|dfw)$/.test(k)")
# --- in-app changelog ---
rep("const CHANGELOG=[\n","const CHANGELOG=[\n{v:'5.3.1',items:['Roll lines can only be updated by the seat that rolled them. An attack is one line (no extra echoes). Every seat has a default chat color. DMG right after ATK always lands on the attack line.','DEFENSE, ALL-OUT DEFENSE and ALL-OUT ATTACK show a \u25be (right-click for the type). Two copies of one weapon show their station; binding a stowed copy warns.','Exported manifests keep the defense type, All-Out Defense and the last All-Out Attack type. Long chat words wrap.']},\n{v:'5.3.0',items:['Reverted the v5.1 font and the HUD sortie header: original Consolas stack and sizes, one-line readout. Full-health paper doll back to the theme color (slightly desaturated).','Removed the RAD tracker from the pilot box.','Items: right-click for Info and the hand/station (the dropdown is gone). Left-click a weapon to open its targeter and All-Out Attack; the targeter RoF max is that weapon\\'s ROF.','All-Out Attack is one button in the targeter (right-click for the type, only types valid for the weapon). DEFENSE and ALL-OUT DEFENSE buttons are in PILOTING (right-click for the type). Retreat gives +1 to Parry, Block and Turn Blow.','Console: commands start with / (for example /undo, /mp whoami); anything else is chat to the table in your seat color. Each roll is one line (user / frame / action / result) that expands on click or Enter. No timestamps, no CLEAR/COPY LOG buttons, no hint text under the command line.']},\n")
css=(ROOT/'devtools/v53.css').read_text(); js=(ROOT/'devtools/v53.js').read_text()
rep("</style></head>",css+"</style></head>")
k=s.rindex("\n</script>"); s=s[:k]+"\n"+js+s[k:]
(ROOT/'out-v5.3/terminal.html').write_text(s); print('v5.3 terminal patched',len(s))
