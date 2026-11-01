import re
src=[l for l in open('../catalog-additions-pass5.txt').read().split('\n') if l.strip()]
D={l.split('|')[1]:l.split('|') for l in src}
def setf(n,i,v): D[n][i]=v
def stats(n,old,new):
  s=D[n][3]; assert old in s,(n,old); D[n][3]=s.replace(old,new)
# Skyfall: Ryuji full re-score fix
stats('SKYFALL CAPACITOR RAILGUN','RNG:250/900 AMMO:3(1) HEAT:+4/shot','RNG:200/750 AMMO:3(1) SPARE:0 HEAT:+3/shot')
stats('SKYFALL CAPACITOR RAILGUN',' NOTE:20+_penetrating_to_mounting_arm_disables_it','')
# Icarus wings: +3/activation, burn cap removed
stats('ICARUS OVERDRIVE WINGS','HEAT:+4/activation','HEAT:+3/activation')
setf('ICARUS OVERDRIVE WINGS',7,'Hydrazine-boosted, limited by heat')
# Kitsune +1/turn
stats('KITSUNE MIRAGE FIELD','HEAT:+3/turn_active','HEAT:+1/turn_active')
# Afterburner +1
stats('ICARUS AFTERBURNER STACK','HEAT:+2/turn_at_full_MOVE','HEAT:+1/turn_at_full_MOVE')
# Purge valve EP 2
setf('OLEUM PURGE VALVE',2,'2')
out=['|'.join(D[l.split('|')[1]]) for l in src]
changed=[a!=b for a,b in zip(src,out)]
# validate
errs=[]
for l in out:
  f=l.split('|')
  if len(f)!=13: errs.append(f[1]+' fields')
  if re.search(r'[`<>]',l): errs.append(f[1]+' unsafe')
  for t in f[3].split(' '):
    if not re.fullmatch(r'[^:\s]+:\S+',t): errs.append(f[1]+' token '+t)
  r=re.search(r'RNG:(\d+)/(\d+)',f[3])
  if r and int(r.group(2))>750: errs.append(f[1]+' RNG')
print('errs',errs,'changed',sum(changed))
open('pass5-rev.txt','w').write('\n'.join(out)+'\n')
import pickle; pickle.dump((src,out,changed),open('pass5.pkl','wb'))
