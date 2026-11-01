import re,json,math,sys
from collections import Counter
sys.path.insert(0,'.')
from items2 import I
def line(x): return '|'.join([x['cat'],x['name'],str(x['ep']),x['stats'],x['cls'],x['mass'],x['label'],x['lv'],x['role'],x['flavor'],str(x['th']),str(x['tl']),str(x['exp'])])
L=[line(x) for x in I]
# ---------- validation ----------
h=open('../terminal.html').read()
raw=re.search(r'const RAW=`(.*?)`;',h,re.S).group(1)
base=[l.split('|')[1].strip().upper() for l in raw.split('\n') if l]
p5=[l.split('|')[1].strip().upper() for l in open('../catalog-additions-pass5.txt').read().split('\n') if l.strip()]
errs=[]
names=[x['name'].upper() for x in I]
if len(I)!=50: errs.append('count %d'%len(I))
for n,c in Counter(names).items():
  if c>1: errs.append('dup name '+n)
FT=['ST/HP','DR','MOVE','SM','HND','SR']
for x,l in zip(I,L):
  f=l.split('|'); n=x['name']
  if len(f)!=13: errs.append(f'{n}: {len(f)} fields')
  if f[0] not in 'ADUFTRG' or len(f[0])!=1: errs.append(n+': bad CAT')
  if not re.fullmatch(r'-?\d+',f[2]): errs.append(n+': EP not int')
  if '`' in l: errs.append(n+': backtick')
  if re.search(r'[<>\r\n]',l): errs.append(n+': < > or newline')
  if any(not v for v in f): errs.append(n+': empty field')
  toks=f[3].split(' ')
  for t in toks:
    if not re.fullmatch(r'[^:\s]+:\S+',t): errs.append(f'{n}: bad token {t}')
    if ',' in t: errs.append(f'{n}: comma in token {t}')
  if n.upper() in base: errs.append(n+': collides with baseline')
  if n.upper() in p5: errs.append(n+': collides with pass5')
  if f[0]=='F':
    for k in FT:
      if not any(t.startswith(k+':') for t in toks): errs.append(f'{n}: frame missing {k}')
    for t in toks:
      lab=t.split(':')[0]
      if lab not in FT and any(lab.startswith(k) for k in FT): errs.append(f'{n}: frame extra token {lab} starts with a frame token')
  if f[0] in 'FTRG' and f[5]!='[DATA_NOT_FOUND]': errs.append(n+': chassis MASS must be [DATA_NOT_FOUND]')
  if f[11] not in ('8','10'): errs.append(n+': TL')
  exp_tl={'Empire':'8','Rebel':'8','Reman':'10'}[x['fac']]
  if f[11]!=exp_tl: errs.append(n+': TL vs faction')
  # divisor rule
  for m in re.finditer(r'DMG:(\d+)d(?:x(\d+))?\((\d+)\)',f[3]):
    N,M,D=int(m.group(1)),int(m.group(2) or 1),int(m.group(3))
    if D==5 and x['fac']!='Reman': errs.append(n+': (5) outside Reman')
    if x['fac']!='Reman' and D not in (3,4): errs.append(n+': divisor not 3/4')
    avg=N*3.5*M
    a=re.search(r'AVG:([\d.]+)(?:\(([\d.]+)\))?',f[3])
    if not a: errs.append(n+': no AVG'); continue
    if abs(float(a.group(1))-avg)>0.01: errs.append(f'{n}: AVG {a.group(1)} != {avg}')
    rof=re.search(r'ROF:(\w+)',f[3]).group(1)
    if rof.isdigit() and int(rof)>1:
      if not a.group(2) or abs(float(a.group(2))-avg*int(rof))>0.01: errs.append(f'{n}: burst AVG wrong')
  # range scale
  r=re.search(r'RNG:(\d+)/(\d+)',f[3])
  if r and int(r.group(2))>750: errs.append(n+': RNG above lower scale')
  # v2 lean-scope checks
  if f[0]=='A' and 'AMMO:' in f[3] and 'SPARE:' not in f[3]: errs.append(n+': AMMO without explicit SPARE')
  if f[0]=='A':
    grp=f[4].split('//')[0].strip()
    if grp not in ('BALLISTIC','ROCKET/MISSILE','MELEE','BEAM'): errs.append(n+': weapon class '+grp+' outside the set Linked FC/Zanshin cover')
  if re.search(r'(^| )(USES|RAD|BULK|RUGGED|FRAGILE|AIRTIME|SPINUP|VOLLEY|SKIRT|BREACH|BRITTLE):',f[3]): errs.append(n+': counter/status token not handled by the sheet')
  if re.search(r'ACC-RANGED|torso',f[3]): errs.append(n+': unparsed token (ACC-RANGED/torso)')
  if f[0] in 'DU' and re.search(r'(^| )DR:\+\d+(?!\d*%)',f[3]): errs.append(n+': flat DR on D/U is not live')
  if f[0]!='G' and re.search(r'(^| )ACC-',f[3]): errs.append(n+': ACC-* outside the G slot')
  if f[0]=='D' and re.search(r'(^| )HP:\d',f[3]) and 'SHIELD' not in n.upper(): errs.append(n+': has shield HP but no SHIELD in name (isShield)')
  if f[0]=='R':
    v=re.search(r'VENT:(\d+)',f[3])
    if not v or not 1<=int(v.group(1))<=3: errs.append(n+': VENT must be 1-3 (lower is better)')
  for t in toks:
    m=re.match(r'HEAT:\+(\d+)',t)
    if m and int(m.group(1))>4: errs.append(n+': heat cost above +4 ('+t+')')
  if 'tiers' in x:
    for tr in x['tiers']:
      if not isinstance(tr[0],int) or len(tr)!=5: errs.append(n+': tier shape')
      for t in tr[1].split(' '):
        if not re.fullmatch(r'[^:\s]+:\S+',t): errs.append(f'{n}: tier bad token {t}')
      if any(re.search(r'[`|<>\r\n]',str(v)) for v in tr): errs.append(n+': tier unsafe char')
    if x['tiers'][0][0]!=x['ep']: errs.append(n+': tier1 EP != line EP')
fc=Counter(x['fac'] for x in I); cc=Counter(x['cat'] for x in I)
ol=[x['name'] for x in I if 'OLEUM' in (x['name']+x['stats']).upper()]
tiered=[x['name'] for x in I if 'tiers' in x]
print('VALIDATION:', 'PASS' if not errs else 'FAIL'); [print(' -',e) for e in errs]
print('faction',dict(fc)); print('cat',dict(cc)); print('oleum',ol); print('tiered',tiered)
print('fxc',Counter((x['fac'],x['cat']) for x in I))
TIER={x['name']:x['tiers'] for x in I if 'tiers' in x}
tier_js=',\n'.join(json.dumps(k)+':'+json.dumps(v,ensure_ascii=False) for k,v in TIER.items())
# ---------- write raw ----------
open('../concepts-batch2-raw.txt','w').write('\n'.join(L)+'\n')
json.dump({'errs':errs,'fc':fc,'cc':cc},open('val.json','w'),default=dict)
open('tier.js','w').write(tier_js)
import pickle; pickle.dump((L,tier_js,errs,fc,cc),open('out.pkl','wb'))
