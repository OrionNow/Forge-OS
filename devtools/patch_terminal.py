# Builds out/terminal.html from the DEPLOYED terminal (FORGE-OS-sortie-app/public/terminal.html, v5.0.1).
# Never edits the original. (/workspace/forge-os/terminal.html is a saved v5.0.2 page snapshot, not a source.)
import sys,re
SRC='/workspace/forge-os/from-grok/FORGE-OS-sortie-app/public/terminal.html'; DST='/workspace/forge-os/out/terminal.html'
t=open(SRC,encoding='utf-8').read()
def rep(old,new,count=1):
    global t
    n=t.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n} matches, want {count}): {old[:90]!r}')
    t=t.replace(old,new)

# ---------- version ----------
rep("const APP_VERSION='5.0.1';","const APP_VERSION='5.1.0';")
rep('title="Open the changelog">5.0.1</span>','title="Open the changelog">5.1.0</span>')
rep("const CHANGELOG=[\n","const CHANGELOG=[\n{v:'5.1.0',items:['Readability and status: JetBrains Mono with symbol fallbacks, one amber for DMG/WARN and one red for CRIT in every theme (AA contrast), text cues next to colour, segmented gauges that keep the exact numbers.','Sortie readout: the telemetry header is a compact HUD (status, integrity, heat, link state). A new crit gives a short red edge pulse once (outline only under reduced motion).','Section headers are keyboard-operable and show CRIT/OFFLINE badges when collapsed. Paper-doll locations are keyboard-operable.','Catalogue: sticky search box, press / to focus it.','Console: timestamps; an undone action is struck through and the UNDO line stays.','Audio is muted until you turn it on (remembered). The boot sequence plays once per browser session.','Pilot RADS (GURPS B435): one number on the pilot record with +/- buttons, a band tag and a log line, plus one-click Oleum Vis sortie and Purge Valve doses when those parts are fitted.','BRITTLE frames (MUSHA): the token is kept and shown as a tag; below half Core HP the frame loses the listed SR automatically. Colon-form frame statlines in manifests are read correctly.','Live table: remote console lines are sanitised, unsent edits survive polls and conflicts, undo no longer discards queued hits, link states and [RE-AUTH] after the table closes, backoff and slower polling in background tabs, no seat is taken on the login screen, and only the host can clear the shared console.']},\n")

# ---------- catalogue additions (catalog team, pass 5) ----------
add=[l.strip() for l in open('/workspace/forge-os/catalog-additions-pass5.txt',encoding='utf-8') if l.strip()]
for l in add:
    if '`' in l or '${' in l: sys.exit('unsafe catalogue line')
    name=l.split('|')[1]
    if ('|'+name+'|') in t: sys.exit('duplicate catalogue record '+name)
add=[l+('|0' if l.count('|')==12 else '') for l in add]
rep("`;\nlet DB=","\n"+"\n".join(add)+"`;\nlet DB=")

# ---------- markup ----------
rep('<body class=""><div id="wrap">','<body><div id=sr class=sr-only aria-live=polite></div><div id=sra class=sr-only aria-live=assertive></div><div id=hudfx aria-hidden=true></div><div id="wrap">')
rep('title="Toggle terminal audio feedback">[AUDIO: ON]</button>','title="Toggle terminal audio feedback (muted by default)">[AUDIO: MUTED]</button>')
rep('<div id="log" onclick=','<div id="log" role="log" aria-live="off" aria-label="operator console log" onclick=')

# ---------- CSS ----------
CSS=open('/workspace/forge-os/devtools/v51.css',encoding='utf-8').read()
rep('</style></head>',CSS+'\n</style></head>')

# ---------- JS edits in place ----------
# NOTE: tokens are commentary; they must not make a catalogue frame look 'alternate'
rep("const statsDiffer=normManifestValue(ch.stat)!==normManifestValue(baseCh[1])","const statsDiffer=normManifestValue(String(ch.stat).replace(/ NOTE:\\S+/g,''))!==normManifestValue(String(baseCh[1]).replace(/ NOTE:\\S+/g,''))")
# BRITTLE survives the catalogue -> CH statline (it was dropped by toStatline)
rep("function toStatline(st){const g=k=>{const t=(st||'').split(' ').find(q=>q.startsWith(k+':'));return t?t.slice(k.length+1):'-'};return'ST/HP'+g('ST/HP')+' DR'+g('DR')+' MOVE'+g('MOVE')+' SM'+g('SM')+' HND/SR'+g('HND')+'/'+g('SR')}",
    "function toStatline(st){const g=k=>{const t=(st||'').split(' ').find(q=>q.startsWith(k+':'));return t?t.slice(k.length+1):'-'},br=g('BRITTLE');return'ST/HP'+g('ST/HP')+' DR'+g('DR')+' MOVE'+g('MOVE')+' SM'+g('SM')+' HND/SR'+g('HND')+'/'+g('SR')+(br!=='-'?' BRITTLE:'+br:'')}")
# colon-form frame lines in a manifest ('ST/HP:165 DR:650/325 ...') are normalised to the compact form chStats() reads
rep(" if(!ch.stat)ch.stat='ST/HP0 DR0/0 MOVE-/- SM+0 HND/SR+0/0';"," if(!ch.stat)ch.stat='ST/HP0 DR0/0 MOVE-/- SM+0 HND/SR+0/0';\n if(/(?:^| )ST\\/HP:/.test(ch.stat))ch.stat=toStatline(ch.stat);")
rep("audioMuted=false","audioMuted=(function(){try{return localStorage.getItem('forgeAudio')!=='1'}catch(e){return true}})()")
rep(" audioMuted=!audioMuted;\n"," audioMuted=!audioMuted;try{localStorage.setItem('forgeAudio',audioMuted?'0':'1')}catch(e){}\n")
# brittle-aware effective stats (HP never depends on SR, so baseHP keeps the unmodified line)
rep("const effBase=()=>S.ch?memo('eb',S.ch[1]+'|'+coreStats().join('|')+'|'+armStats().join('|'),()=>statWith(S.ch[1],coreStats().concat(armStats()))):'',effStat=()=>S.ch?statWith(S.ch[1],coreStats().concat(armStats()),S.view=='sortie'&&S.tel?heatMoveB():0):'';",
    "const effBase0=()=>S.ch?memo('eb',S.ch[1]+'|'+coreStats().join('|')+'|'+armStats().join('|'),()=>statWith(S.ch[1],coreStats().concat(armStats()))):'',effBase=()=>{const e=effBase0();return e&&brittleOn()?statWith(e,['SR:'+brittleVal()]):e},effStat=()=>S.ch?statWith(S.ch[1],coreStats().concat(armStats(),brittleOn()?['SR:'+brittleVal()]:[]),S.view=='sortie'&&S.tel?heatMoveB():0):'';")
rep("baseHP=()=>+(/^ST\\/HP(\\d+)/.exec(effBase())||[0,0])[1]","baseHP=()=>+(/^ST\\/HP(\\d+)/.exec(effBase0())||[0,0])[1]")
# rads persist with the pilot record (flight recorder + live table)
rep("|ret|tsm|fd)$/.test(k)","|ret|tsm|fd|rad)$/.test(k)")
# EP gauge: status vars + text cue
rep("EP<div class=gauge><i style=\"width:${p}%;background:${ov()?'#fd5':p>=100?'#f65':p>=70?'#fd5':'var(--fg)'}\"></i></div>`}",
    "EP${!ov()&&u>cap()?' <b class=bad>\u2715 OVER</b>':!ov()&&p>=70?' <b class=warn>\u25b2 HIGH</b>':''}<div class=gauge><i style=\"width:${p}%;background:${ov()?'var(--c-gold)':p>=100?'var(--c-crit)':p>=70?'var(--c-dmg)':'var(--fg)'}\"></i></div>`}")
# section headers: keyboard + aria + badges
rep("""const shHead=(k,t,x)=>`<div class="sec secrow shh" onclick="shTog('${k}')" title="click to ${shOpen(k)?'collapse':'expand'}"><span><span class=sm>${shOpen(k)?'[-]':'[+]'}</span>${t}</span>${x||''}</div>`;""",
    """const shHead=(k,t,x)=>`<div class="sec secrow shh" onclick="shTog('${k}')" title="click to ${shOpen(k)?'collapse':'expand'}"><span class=shtl data-k="${k}" role=button tabindex=0 aria-expanded="${shOpen(k)}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();shTog('${k}')}"><span class=sm>${shOpen(k)?'[-]':'[+]'}</span>${t}${shBadge(k)}</span>${x||''}</div>`;""")
# sortie HUD readout + turn tracker
rep("""let h=`<div class=sorhead><span class=nm>LIVE SORTIE TELEMETRY // ${esc(idline())}</span><span class=dim>${esc(S.ch[0])} :: BASE HP ${mx}</span><span>STATUS <b class="${st[1]}">${st[0]}</b></span><span class=dim>INTEGRITY <b>${igOf()}%</b></span><span class=dim>ISB LINK <b class=lnk>[||||]</b></span></div>`;""",
    """const ig=igOf(),igs=ig<34?'crit':ig<67?'warn':'ok',hcp=heatCap(),hz=heatZone();let h=`<div class="sorhead hud" role=group aria-label="sortie readout"><span class="nm hc hc-id">LIVE SORTIE TELEMETRY // ${esc(idline())}</span><span class="dim hc">${esc(S.ch[0])} :: BASE HP ${mx}${brittleVal()?` <b class="${brittleOn()?'brtag':'dim'}" title="BRITTLE: ${brittleVal()} SR while Core HP is below half">[BRITTLE ${brittleOn()?'SR'+brittleVal()+' ACTIVE':'SR'+brittleVal()+' BELOW 1/2 HP'}]</b>`:''}</span><span class=hc>STATUS <b class="${st[1]}">${st[0]}</b></span><span class="dim hc" data-state=${igs}>INTEGRITY <b>${ig}%</b>${igs=='crit'?' <b>\u2715</b>':igs=='warn'?' <b>\u25b2</b>':''}<i class=igbar aria-hidden=true><i style="width:${ig}%"></i></i></span>${hcp?`<span class="dim hc" data-state=${hz==2?'crit':hz==1?'warn':'ok'}>HEAT <b>${heatNow()}/${hcp}</b>${hz==2?' <b>\u2715 REDLINE</b>':hz==1?' <b>\u25b2 DANGER</b>':''}</span>`:''}<span class="dim hc">ISB LINK <b class=lnk id=sync data-s=local>[LOCAL]</b></span></div>`;""")
# radiation readout lives with engineering/heat
rep(" return`<div class=pilot>${shHead('PG'"," return`<div class=pilot>${radBox()}${shHead('PG'")
# catalogue search
rep("function list(){let h='',k2=0;","function list(){let h=catHead(),k2=0;")
rep("<div class=catalog-tabs>${catTabsHTML(c)}</div><div class=sec>-- ${catNames[c]} COMPONENTS (${found})</div>","<div class=catalog-tabs>${catTabsHTML(c)}</div>${catHead()}<div class=sec>-- ${catNames[c]} COMPONENTS (${found})</div>")
# console: timestamps, kinds, undo marks
rep("async function type(el,html){const d=document.createElement('div');d.innerHTML=html;el.appendChild(d);",
    "async function type(el,html){const d=document.createElement('div');d.dataset.k=logKind(html);d.innerHTML='<span class=ts aria-hidden=true>'+logTs()+'</span>'+html;el.appendChild(d);logPost(d);")
rep("d.className='dim hbln';","d.className='dim hbln';d.dataset.k='sys';")
rep("let MQ=[],say=(m,k)=>{S.msg=m||'';","let MQ=[],say=(m,k)=>{m=evTag(m,k);S.msg=m||'';")
rep("u.push({l,t:JSON.stringify(t),s:S.stab?JSON.stringify(S.stab):null});","const id=evId();window.__evOpen={id,at:Date.now()};u.push({l,id,by:window.__forgeSelf||'',t:JSON.stringify(t),s:S.stab?JSON.stringify(S.stab):null});")
rep("say('[ OK ] UNDO COMPLETE :: '+esc(e.l)","markUndone(e.id);say((e.id?'<span data-undo-of=\"'+e.id+'\"></span>':'')+'[ OK ] UNDO COMPLETE :: '+esc(e.l)")
# motion
rep("function crawl(root,fast){return new Promise(res=>{","function crawl(root,fast){return new Promise(res=>{if(reducedMotion()){res();return}")
rep("function hvAnim(){if(busy||document.hidden)return;","function hvAnim(){if(busy||document.hidden||reducedMotion())return;")
rep("\n if(first)return[okl(","\n if(first&&warmBoot())return[okl('FORGE-OS v'+APP_VERSION+' KERNEL ONLINE // WARM START')];\n if(first)return[okl(")
rep("if(final!=null){animateHpBars();shCrawl()}","if(final!=null){animateHpBars();shCrawl();catFilter()}")
rep("o.innerHTML=final;if(sc)sc.scrollTop=st;","o.innerHTML=final;if(sc)sc.scrollTop=st;catFilter();")
# dialog semantics for the changelog
rep("o.id='clog';","o.id='clog';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Changelog');")

# ---------- new JS (appended to the main inline script; function declarations hoist) ----------
JS=open('/workspace/forge-os/devtools/v51.js',encoding='utf-8').read()
last=t.rindex('</script>\n<script src="forge-hook.js')
t=t[:last]+JS+'\n'+t[last:]
rep('<script src="forge-hook.js?v=6"></script>','<script src="forge-hook.js?v=7"></script>')
rep('<script src="mp-bridge.js?v=14"></script>','<script src="mp-bridge.js?v=15"></script>')
rep('<meta charset="utf-8">','<meta charset="utf-8"><link rel="icon" href="data:,">')
open(DST,'w',encoding='utf-8').write(t)
print('ok',len(t))
