import math
def cole(m,v,d):
  KE=0.5*m*v*v; A=math.pi*(d/2)**2
  return math.sqrt(KE**1.04/A**0.314)/13.3926
def baughn(m,v,c_mm):
  h=math.sqrt(m)*v**1.5*2.5/c_mm; r=math.sqrt(h)*120+h; return h,r
def heat_pen(d): return 672*(d/60)**1.9
KE={ # name: m kg, v m/s, penetrator d m, flight caliber mm
 'base 20mm HEI 20x110':(0.13,850,0.020,20),
 'base 30mm APDS (0.30kg core 16mm @1300)':(0.30,1300,0.016,16),
 'base 45mm APDS (1.0kg core 22mm @1100)':(1.0,1100,0.022,22),
 'base 90mm APDS (3.2kg core 38mm @1200)':(3.2,1200,0.038,38),
 'new 35mm APDS (0.38kg core 18mm @1385)':(0.38,1385,0.018,18),
 'new 40mm APDS (0.55kg core 20mm @1300)':(0.55,1300,0.020,20),
 'new scatter slug (0.25kg 20mm @800)':(0.25,800,0.020,20),
 'new gauss bolt TL10 (2.0kg 30mm @2000)':(2.0,2000,0.030,30),
 'new bit slug TL10 (0.12kg 12mm @1800)':(0.12,1800,0.012,12),
}
for k,(m,v,d,c) in KE.items():
  p=cole(m,v,d);h,r=baughn(m,v,c)
  print(f'{k}: KE={0.5*m*v*v/1000:.0f}kJ pts={p:.0f} =6dx{p/21:.1f}  RNG yd {h:.0f}/{r:.0f} -> /20 = {h/20:.0f}/{r/20:.0f}')
for d in [40,60,70,80,105,120]:
  P=heat_pen(d);print(f'HEAT {d}mm: pen={P:.0f} -> dmg@(4)={P/4:.0f} =6dx{P/4/21:.1f}  RNG {1.25*d:.0f}/{6.25*d:.0f}')
for m in [0.3,0.4,0.8,0.9,1.0,1.1,1.8,2.1,3.2]: print('melee mass',m,'dice',round(79+13*math.log(m),1),'EP',round(2.5*math.sqrt(m),2))
