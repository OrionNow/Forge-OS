import re,sys,math
from collections import Counter
sys.path.insert(0,'.')
from items_r20 import I,REPL
def line(x): return '|'.join([x['cat'],x['name'],str(x['ep']),x['stats'],x['cls'],x['mass'],x['label'],x['lv'],x['role'],x['flavor'],str(x['th']),str(x['tl']),str(x['exp'])])
h=open('../../terminal.html').read()
raw=re.search(r'const RAW=`(.*?)`;',h,re.S).group(1)
names=lambda p:[l.split('|')[1].strip().upper() for l in open(p).read().split('\n') if l.strip()]
base=[l.split('|')[1].strip().upper() for l in raw.split('\n') if l]
p5=names('../../catalog-additions-pass5.txt'); b2=names('../../concepts-batch2-raw.txt')
FT=['ST/HP','DR','MOVE','SM','HND','SR']
def check(items,replace_ok=False):
  errs=[]
  for n,c in Counter(x['name'].upper() for x in items).items():
    if c>1: errs.append('dup '+n)
  for x in items:
    l=line(x); f=l.split('|'); n=x['name']; toks=f[3].split(' ')
    if len(f)!=13: errs.append(n+' fields')
    if f[0] not in list('ADUFTRG'): errs.append(n+' CAT')
    if not re.fullmatch(r'-?\d+',f[2]): errs.append(n+' EP')
    if re.search(r'[`<>\r\n"]',l): errs.append(n+' unsafe char (incl. double quote)')
    if any(not v for v in f): errs.append(n+' empty')
    for t in toks:
      if not re.fullmatch(r'[^:\s]+:\S+',t) or ',' in t: errs.append(n+' token '+t)
    for coll,lab in ((base,'baseline'),(p5,'pass5'),(b2,'batch2')):
      if n.upper() in coll: errs.append(n+' collides with '+lab)
    if f[0]=='F':
      for k in FT:
        if not any(t.startswith(k+':') for t in toks): errs.append(n+' frame missing '+k)
      for t in toks:
        lab=t.split(':')[0]
        if lab not in FT and any(lab.startswith(k) for k in FT): errs.append(n+' extra token starts with frame token '+lab)
    if f[0] in 'FTRG' and f[5]!='[DATA_NOT_FOUND]': errs.append(n+' chassis MASS')
    ok_tl={'Empire':('8','9'),'Rebel':('8','9'),'Reman':('10',)}[x['fac']]
    if f[11] not in ok_tl: errs.append(n+' TL vs faction')
    for m in re.finditer(r'DMG:(\d+)d(?:x(\d+))?\((\d+)\)',f[3]):
      N,M,D=int(m.group(1)),int(m.group(2) or 1),int(m.group(3))
      if x['fac']!='Reman' and D not in (3,4): errs.append(n+' divisor')
      if D==5 and x['fac']!='Reman': errs.append(n+' (5) non-Reman')
      if D>5: errs.append(n+' divisor >5')
      avg=N*3.5*M; a=re.search(r'AVG:([\d.]+)(?:\(([\d.]+)\))?',f[3])
      if not a or abs(float(a.group(1))-avg)>0.01: errs.append(n+' AVG')
      rof=re.search(r'ROF:(\w+)',f[3]).group(1)
      if rof.isdigit() and int(rof)>1 and (not a.group(2) or abs(float(a.group(2))-avg*int(rof))>0.01): errs.append(n+' burst AVG')
    r=re.search(r'RNG:(\d+)/(\d+)',f[3])
    if r and int(r.group(2))>750: errs.append(n+' RNG>750')
    if f[0]=='A' and 'AMMO:' in f[3] and 'SPARE:' not in f[3]: errs.append(n+' AMMO w/o SPARE')
    if f[0]=='A' and f[4].split('//')[0].strip() not in ('BALLISTIC','ROCKET/MISSILE','MELEE','BEAM'): errs.append(n+' class')
    if re.search(r'(^| )(USES|RAD|BULK|RUGGED|FRAGILE|AIRTIME|SPINUP|VOLLEY|SKIRT|BREACH|BRITTLE):',f[3]): errs.append(n+' counter token')
    if re.search(r'ACC-RANGED|torso',f[3]): errs.append(n+' torso/ACC-RANGED token')
    if f[0] in 'DU' and re.search(r'(^| )DR:\+\d+(?!\d*%)',f[3]): errs.append(n+' flat DR')
    if f[0]!='G' and re.search(r'(^| )ACC-',f[3]): errs.append(n+' ACC- outside G')
    if f[0]=='D' and re.search(r'(^| )HP:\d',f[3]) and 'SHIELD' not in n.upper(): errs.append(n+' HP not shield')
    if f[0]=='R':
      v=re.search(r'VENT:(\d+)',f[3])
      if not v or not 1<=int(v.group(1))<=3: errs.append(n+' VENT')
    for t in toks:
      m=re.match(r'HEAT:\+(\d+)',t)
      if m and int(m.group(1))>4: errs.append(n+' heat>4')
    if 'MOVE:+' in f[3] and f[0] in 'DU': errs.append(n+' MOVE% on D/U applies permanently')
  return errs
e1=check(I); 
# replacement lines may share nothing with batch2 names either (they replace by new name)
e2=check(REPL)
print('NEW', len(I),'PASS' if not e1 else e1); print('REPL',len(REPL),'PASS' if not e2 else e2)
print(Counter(x['cat'] for x in I), Counter(x['fac'] for x in I))
open('raw_new.txt','w').write('\n'.join(line(x) for x in I)+'\n')
open('raw_repl.txt','w').write('\n'.join(line(x) for x in REPL)+'\n')
