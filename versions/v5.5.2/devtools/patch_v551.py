import sys,pathlib
ROOT=pathlib.Path('/workspace/forge-os')
s=(ROOT/'out-v5.5/terminal.html').read_text()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n} hits): {old[:90]!r}')
    s=s.replace(old,new)
rep("const APP_VERSION='5.5.0';","const APP_VERSION='5.5.1';")
rep('<script src="mp-bridge.js?v=21"></script>','<script src="mp-bridge.js?v=22"></script>')
# GURPS B348 crits on effective skill; labels CRITICAL HIT / CRITICAL FAIL; crits decide success
rep("const _isCrit=(tot,sl)=>tot<=4||(tot==5&&sl>=15)||(tot==6&&sl>=16)?'CRIT SUCCESS':(tot==18||(tot==17&&sl<=15)||tot-sl>=10)?'CRIT FAIL':'';",
    "const _isCrit=(tot,sl)=>tot<=4||(tot==5&&sl>=15)||(tot==6&&sl>=16)?'CRITICAL HIT':(tot==18||(tot==17&&sl<=15)||tot-sl>=10)?'CRITICAL FAIL':'';")
rep("ok=tot<=4||(tot<=sl&&tot<=16),","ok=_isCrit(tot,sl)==='CRITICAL HIT'||(_isCrit(tot,sl)!=='CRITICAL FAIL'&&tot<=sl&&tot<=16),")
# weapon highlight clears when the targeter is closed
rep("const rowAw=i=>S.view=='sortie'&&awK()>=0&&weapons().indexOf(S.items[i])===awK();","const rowAw=i=>S.view=='sortie'&&awK()>=0&&!tgClosed()&&weapons().indexOf(S.items[i])===awK();")
# melee Evaluate in the attack SL, breakdown and TOTAL MOD
rep("if(pNum('acc')==1)x+=accOf(w)}return x}","if(pNum('acc')==1)x+=accOf(w);x+=evBon(w)}return x}")
rep("if(pNum('acc')==1&&accOf(w))p.push('ACC '+sg(accOf(w)))}","if(pNum('acc')==1&&accOf(w))p.push('ACC '+sg(accOf(w)));if(evBon(w))p.push('EVALUATE +'+evBon(w))}")
rep("+(pNum('mod')||0)+rofBon(rofEffNow())+tgHeat();","+(pNum('mod')||0)+rofBon(rofEffNow())+tgHeat()+evBon(awW());")
rep("const CHANGELOG=[\n","const CHANGELOG=[\n{v:'5.5.1',items:['Targeter header is the accuracy tile (always shown, +0 included); melee gets [EVALUATE +1] (right-click +1/+2/+3) and [RAPID STRIKE -6] (right-click -6/-3, RoF 2). Move and Attack is in the All-Out Attack menu (ranged -2, melee -4 max 9, Dodge/Block only). Closing the targeter clears the weapon highlight. A roll with a Heat toggle on adds +1 heat and switches that Heat off.','Rolls label CRITICAL HIT / CRITICAL FAIL (GURPS B348 on effective skill). The console stays pinned to the newest line when a roll line grows.','Table: remote chat text keeps the sender colour; viewers see All-Out Attack update live; the roster drops its LINK header.']},\n")

# v5.5.1 items 11-12: Move and Attack (B365) and Rapid Strike (B370)
rep("x+=evBon(w)}return x}","x+=evBon(w)+mnaPen(w)+rsPen(w);if(mnaOn()&&!hasRng(w))x=Math.min(9,x)}return x}")
rep("if(evBon(w))p.push('EVALUATE +'+evBon(w))}","if(evBon(w))p.push('EVALUATE +'+evBon(w));if(mnaPen(w))p.push('MOVE+ATK '+mnaPen(w)+(hasRng(w)?'':' (skill max 9)'));if(rsPen(w))p.push('RAPID STRIKE '+rsPen(w))}")
rep("+tgHeat()+evBon(awW());","+tgHeat()+evBon(awW())+mnaPen(awW())+rsPen(awW());")
rep("effRof=w=>w&&hasRng(w)?Math.max(1,Math.min(30,Math.floor(+S.dmgN||1),wRof(w))):1;","effRof=w=>w&&hasRng(w)?Math.max(1,Math.min(30,Math.floor(+S.dmgN||1),wRof(w))):w&&rsOn(w)?Math.max(1,Math.min(2,Math.floor(+S.dmgN||1))):1;")
rep("const rofMax=()=>{const w=awW();return !w?30:hasRng(w)?Math.min(30,wRof(w)):1};","const rofMax=()=>{const w=awW();return !w?30:hasRng(w)?Math.min(30,wRof(w)):rsOn(w)?2:1};")
rep("if(aoaHit(w))ex.push('AOA +'+aoaHit(w));","if(aoaHit(w))ex.push('AOA +'+aoaHit(w));if(mnaPen(w))ex.push('MOVE+ATK '+mnaPen(w));if(rsPen(w))ex.push('RAPID STRIKE '+rsPen(w));")
rep("const ord=['ROF','RNG','COV','SIZ','TGT','ACC','AOA','MOD'];","const ord=['ROF','RNG','COV','SIZ','TGT','ACC','AOA','MOV','RAP','MOD'];")
rep("a=w?wName(w):parts.slice(1).join(' ');","a=(w?wName(w):parts.slice(1).join(' '))+(w&&mnaOn()?' \\u00b7 MOVE+ATK':'')+(w&&rsOn(w)?' \\u00b7 RAPID STRIKE '+rsPen(w):'');")
rep("|aoa|aoal|dft|dfw|hx)$/","|aoa|aoal|dft|dfw|hx|thx|evl|evn|mna|rs|rsn)$/")
rep("${aoaNow()?`<span><b class=aoatag","${mnaOn()?`<span><b class=aoatag title=\"Move and Attack: ranged -2, melee -4 (skill max 9); Dodge or Block only\">MOVE+ATK // DODGE/BLOCK ONLY</b></span>`:''}${aoaNow()?`<span><b class=aoatag")
css=(ROOT/'devtools/v551.css').read_text(); js=(ROOT/'devtools/v551.js').read_text()
rep("</style></head>",css+"</style></head>")
k=s.rindex("\n</script>"); s=s[:k]+"\n"+js+s[k:]
(ROOT/'out-v5.5.1/terminal.html').write_text(s); print('v5.5.1 terminal patched',len(s))
