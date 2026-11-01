import re,sys,pathlib
ROOT=pathlib.Path('/workspace/forge-os')
SRC=ROOT/'out/terminal.html'; DST=ROOT/'out-v5.2/terminal.html'
s=SRC.read_text()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n} hits): {old[:90]!r}')
    s=s.replace(old,new)
# version + cache-busting
rep("const APP_VERSION='5.1.0';","const APP_VERSION='5.2.1';")
rep('<script src="forge-hook.js?v=7"></script>','<script src="forge-hook.js?v=8"></script>')
rep('<script src="mp-bridge.js?v=15"></script>','<script src="mp-bridge.js?v=16"></script>')
# 5) Core to-hit +0, no stacking bonus for disabled limbs
rep("const hitMod=n=>{if(isMech()){const t=tel(),L=MECH_LOCS,dead=['Left Arm','Right Arm','Left Leg','Right Leg'].reduce((a,k)=>a+(t&&t.hp[L.indexOf(k)]<=0?1:0),0);if(n=='Core')return -4+dead;if(n=='Crew Cabin')return -8+dead;return 0}return n=='Chassis'?0:0};",
    "const hitMod=n=>{if(isMech()){if(n=='Crew Cabin')return -8;return 0}return 0};/* v5.2: Core +0; disabled arms/legs no longer stack a bonus */")
# 1) solo sheet tabs: actions move into the context menu
rep('''<span class=stx onclick="event.stopPropagation();shEdit(${i})" title="rename">[R]</span><span class=stx onclick="event.stopPropagation();shDup(${i})" title="duplicate this sheet">[D]</span><span class=stx onclick="event.stopPropagation();shClose(${i})" title="close this sheet">[X]</span></span>`''',
    '''<span class=stx data-act=rename data-label="Rename sheet" onclick="event.stopPropagation();shEdit(${i})" title="Rename this sheet">[R]</span><span class=stx data-act=dup data-label="Duplicate sheet" onclick="event.stopPropagation();shDup(${i})" title="Duplicate this sheet into a new tab">[D]</span><span class=stx data-act=close data-label="Close sheet" onclick="event.stopPropagation();shClose(${i})" title="Close this sheet (unsaved sortie state is lost)">[X]</span></span>`''')
rep('''<span class="stab${on?' on':''}" onmousedown=''','''<span class="stab${on?' on':''}" data-i="${i}" tabindex=0 role=button aria-haspopup=menu onmousedown=''')
rep(''':: click again to cycle outline color (also themes the paper doll), drag to reorder':' :: drag to reorder'}">''',''':: click again to cycle outline color (also themes the paper doll), drag to reorder':' :: click to open, drag to reorder'} :: right-click or Shift+F10 for sheet actions">''')
# 2) defense inputs move out of the weapon rows and the PILOTING box into one section by the targeter
rep('''${mel?`<button onclick="parryRoll(${k})"${off}>[PRY]</button>${slSp('def|'+wKey(x))}`:''}</span>`}''','''</span>`}''')
rep('''  return`<span class=rbtn onclick="event.stopPropagation()"><button onclick="blockRoll(${k})"${off}>[BLK]</button>${slSp('def|'+wKey(x))}</span>`}''',
    '''  return`<span class="rbtn dim" title="Block rolls are in the DEFENSE section under the targeter">BLOCK: SEE DEFENSE</span>`}''')
rep('''<div class=pact><button onclick=dodgeRoll()>[DODGE]</button>${sl('dod|pil')}<label class="fxchk rtr" title="Retreat: +3 to Dodge">RETREAT +3<input type=checkbox ${pNum('ret')==1?'checked':''} onchange="togRetreat(this.checked)"><span class=bx></span></label>${isMech()?`<button onclick=turnBlowRoll() title="on success the pilot picks the hit location of the incoming attack">[TURN BLOW]</button>${sl('def|pil')}`:''}</div></div>`''',
    '''<div class=pact><span class=dim title="Dodge, Retreat${isMech()?', Turn Blow':''}, Parry and Block are grouped in the DEFENSE section under the targeter">DEFENSE ROLLS: SEE DEFENSE // ${slTxt('dod|pil')} DODGE</span></div></div>`''')
rep('''if(S.view=='sortie')h+=shHead('TG','--TARGETER',`<span id=sitsum class=dim>${sitSum()}</span>`)+(shOpen('TG')?tgtGrid():'');''',
    '''if(S.view=='sortie')h+=shHead('TG','--TARGETER',`<span id=sitsum class=dim>${sitSum()}</span>`)+(shOpen('TG')?tgtGrid():'')+shHead('DF','--DEFENSE // ALL-OUT ATTACK',`<span id=defsum class=dim>${defSum()}</span>`)+(shOpen('DF')?defGrid():'');''')
# 3) All-Out Attack (Determined) feeds the attack SL, its breakdown and the attack log line; the pilot record keeps it
rep("x+=sitAtk()+sizeMod()+tgtBonus(w);if(pNum('acc')==1)x+=accOf(w)}return x}","x+=sitAtk()+sizeMod()+tgtBonus(w)+aoaHit(w);if(pNum('acc')==1)x+=accOf(w)}return x}")
rep("const tb=tgtBonus(w);if(tb)p.push('TGT '+sg(tb));if(pNum('acc')==1&&accOf(w))p.push('ACC '+sg(accOf(w)))}","const tb=tgtBonus(w);if(tb)p.push('TGT '+sg(tb));if(aoaHit(w))p.push('AOA '+sg(aoaHit(w)));if(pNum('acc')==1&&accOf(w))p.push('ACC '+sg(accOf(w)))}")
rep("if(pNum('acc')==1&&accOf(w))ex.push('ACC +'+accOf(w));\n const ord=['ROF','RNG','COV','SIZ','TGT','ACC','MOD'];","if(pNum('acc')==1&&accOf(w))ex.push('ACC +'+accOf(w));if(aoaHit(w))ex.push('AOA +'+aoaHit(w));\n const ord=['ROF','RNG','COV','SIZ','TGT','ACC','AOA','MOD'];")
rep("|tsm|fd|rad)$/.test(k)","|tsm|fd|rad|aoa)$/.test(k)")
rep('''function sitSum(){return`<span title="range/speed + cover + size + RoF bonus + roll mod">TOTAL MOD <b class=n-gd>${sg(tgtTotal())}</b></span>`}''',
    '''function sitSum(){const a=aoaNow()==1;return`<span title="range/speed + cover + size + RoF bonus + roll mod${a?' + All-Out Attack (Determined): +4 melee / +1 ranged, per weapon':''}">TOTAL MOD <b class=n-gd>${sg(tgtTotal())}</b>${a?' <b class=warn>AOA +4 MELEE / +1 RANGED</b>':''}</span>`}''')
rep("const ab=document.getElementById('accbon');","const dfs=document.getElementById('defsum');if(dfs)dfs.innerHTML=defSum();const ab=document.getElementById('accbon');")
# 6) attack roll records hits = 1 + degrees of success (Recoil), capped at the rounds fired; [DMG] rolls that many
rep("use=Math.min(want,am.cur);w.am=am.cur-use;w.pd=1;","use=Math.min(want,am.cur);w.am=am.cur-use;w.pd=1;HITCAP.set(w,use);")
rep("skillRoll('ATTACK :: '+w.n+(ex.length?' ('+ex.join(', ')+')':'')+ammoTag,'atk|'+wKey(w)+'|'+k,null,rclOf(w),'RECOIL')}",
    "skillRoll('ATTACK :: '+w.n+(ex.length?' ('+ex.join(', ')+')':'')+ammoTag,'atk|'+wKey(w)+'|'+k,hitWin(w,k),rclOf(w),'RECOIL',null,hitFail(w,k))}")
rep(" const n=+m[1],mult=+m[2]||1,dv=+m[3],cnt=Math.max(1,Math.min(30,Math.floor(+(c??S.dmgN??1))||1)),atk=[];\n for(let j=0;j<cnt;j++){const rolls=Array.from({length:n},()=>1+Math.floor(Math.random()*6)),sum=rolls.reduce((a,b)=>a+b,0);atk.push({rolls,sum,total:sum*mult})}",
    " const n=+m[1],mult=+m[2]||1,dv=+m[3],cnt=dmgCount(w,c,k),sb=aoaDmg(w,n),atk=[];if(!cnt){w.pd=0;audioEvent('fail');return reject('[FAIL] NO HITS TO ROLL :: '+DMGWHY)}\n for(let j=0;j<cnt;j++){const rolls=Array.from({length:n},()=>1+Math.floor(Math.random()*6)),sum=rolls.reduce((a,b)=>a+b,0);atk.push({rolls,sum,total:(sum+sb)*mult})}")
rep("= [${a.rolls.join(', ')}] = ${a.sum} : </span>","= [${a.rolls.join(', ')}] = ${a.sum}${sb?' +'+sb+' STRONG':''} : </span>")
rep("say('[ ROLL ] DAMAGE :: '+ln.join('<br>'),'dim');R()}","say('[ ROLL ] DAMAGE'+(DMGWHY?' ('+DMGWHY+')':'')+' :: '+ln.join('<br>'),'dim');R()}")
# 7) vent floor: at least 1 heat on a failed roll, at least 2 on a success
rep("amt=1+(ds||0);pushUndo('VENT HEAT');t.heat=Math.max(0,b-amt);return'VENTED '+Math.min(amt,b)+' HEAT (1 FOR SUCCESS + '+(ds||0)+' FOR DEGREES OF '+step+')",
    "amt=Math.max(2,1+(ds||0));pushUndo('VENT HEAT');t.heat=Math.max(0,b-amt);return'VENTED '+Math.min(amt,b)+' HEAT (1 FOR SUCCESS + '+(ds||0)+' FOR DEGREES OF '+step+', MINIMUM 2)")
rep("step,'VENT',null,()=>'VENT FAILED :: NO HEAT SHED')}","step,'VENT',null,()=>{const t=tel(),b=heatNow();pushUndo('VENT HEAT');t.heat=Math.max(0,b-1);return'VENT FAILED :: MINIMUM 1 HEAT SHED :: HEAT '+t.heat+'/'+heatCap()})}")
# in-app changelog
rep("const CHANGELOG=[\n","const CHANGELOG=[\n{v:'5.2.0',items:['Sheet tabs: right-click a tab (or focus it and press Shift+F10 / the Menu key) for its actions with full labels: rename, duplicate, close, hold/deploy, assign. Escape closes the menu.','DEFENSE // ALL-OUT ATTACK: Dodge (with Retreat), Turn Blow, Parry and Block are grouped in one section under the targeter. All-Out Attack is one choice per turn (Determined, Double, Feint, Strong, Long, Suppression Fire at RoF 5+); Determined feeds the attack SL, Strong adds to melee damage, and any option shows NO ACTIVE DEFENSE.','Attacks: a hit now records 1 + degrees of success (margin / Recoil), capped at the rounds fired; [DMG] rolls that many damage rolls.','Core to-hit is +0, and disabled arms or legs no longer add a bonus.','Vent: at least 1 heat on a failed roll and at least 2 on a success.','More hover tooltips on buttons. Live table: a seat that cannot write to its unit is told so; console MP WHOAMI, MP RESYNC and MP RESET-LOCAL.']},\n")

rep('mp-bridge.js?v=16','mp-bridge.js?v=17')
# v5.2.1: pending hits are sheet state (synced, survives refresh)
rep("const FK=['ch','items','tel','id','cs','dmg','rolls','uiHP','pilot','natk','info','dmgN','core','undo','stab','importReport','importNotesHidden'];",
    "const FK=['ch','items','tel','id','cs','dmg','rolls','uiHP','pilot','natk','info','dmgN','core','undo','stab','importReport','importNotesHidden','hitq'];")
# v5.2.1 Bug B: effective RoF = min(targeter RoF, weapon ROF) for rounds, hits and the RoF to-hit bonus
rep("const want=hasRng(w)?Math.max(1,Math.min(30,Math.floor(+S.dmgN||1))):1","const want=effRof(w)")
rep("if(hasRng(w))x+=rngPen(effRng())+rofBon(S.dmgN);","if(hasRng(w))x+=rngPen(effRng())+rofBon(effRof(w));")
rep("if(hasRng(w)){const rp=rngPen(effRng()),rb=rofBon(S.dmgN);","if(hasRng(w)){const rp=rngPen(effRng()),rb=rofBon(effRof(w));")
rep("if(hasRng(w)&&rofBon(S.dmgN))ex.push('ROF +'+rofBon(S.dmgN));","if(hasRng(w)&&rofBon(effRof(w)))ex.push('ROF +'+rofBon(effRof(w))+(effRof(w)<Math.floor(+S.dmgN||1)?' (WEAPON ROF '+wRof(w)+')':''));")
# v5.2.1: VENT tooltip states the current rule
rep('<button title="Engineering roll: a success vents 1 heat, plus 1 more for every ${Math.max(1,ventBase())} points of margin" onclick="heatVent()">',
    '<button title="Engineering roll: vents 1 heat plus 1 more for every ${Math.max(1,ventBase())} points of margin; minimum 2 on a success, minimum 1 on a failure" onclick="heatVent()">')
# v5.2.1: active All-Out Attack shown in the sortie readout
rep('<span class=hc>STATUS <b class="${st[1]}">${st[0]}</b></span>','<span class=hc>STATUS <b class="${st[1]}">${st[0]}</b></span>${aoaNow()?`<span class=hc><b class=aoatag title="All-Out Attack is set: no active defense until you set NONE in DEFENSE // ALL-OUT ATTACK">AOA: ${AOA[aoaNow()][1]} // NO DEFENSE</b></span>`:\'\'}')
rep("const CHANGELOG=[\n","const CHANGELOG=[\n{v:'5.2.1',items:['Fixes: the hit count from an attack is kept with the sheet, so a live-table sync or a refresh no longer loses it; [DMG] refuses after a miss and after the hits are rolled.','The targeter RoF is capped at the weapon ROF for rounds, hits and the RoF to-hit bonus.','Melee-only All-Out Attack options are greyed out without a held melee weapon; the active choice shows in the sortie readout.','MP RESET-LOCAL and MP RESYNC send pending changes first and ask for confirmation; an oversized update is reported, trimmed and retried with backoff. VENT tooltip corrected.']},\n")
# CSS + JS blocks
css=(ROOT/'devtools/v52.css').read_text()
rep('</style></head>',css+'</style></head>')
js=(ROOT/'devtools/v52.js').read_text()
rep("applyPrefs();try{afterRender(null)}catch(e){}\n\n</script>","applyPrefs();try{afterRender(null)}catch(e){}\n"+js+"\n</script>")
DST.write_text(s)
print('terminal patched', len(s))
