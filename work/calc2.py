from calc import cole,baughn
import math
R=[ # name, m, v, core d (m), calibre mm
 ('base 20mm 20x110 HEI/AP',0.13,850,0.020,20),
 ('base 30mm API DU-core (395g @1010, 16mm core)',0.395,1010,0.016,30),
 ('base 45mm AP (1.4kg @900, 24mm core)',1.4,900,0.024,45),
 ('base 90mm HVAP (7.6kg @1020, 45mm core)',7.6,1020,0.045,90),
 ('new 35mm APDS-T (0.55kg @1175, 18mm core)',0.55,1175,0.018,35),
 ('new 40mm AP-T (0.95kg @1000, 20mm core)',0.95,1000,0.020,40),
 ('new 65mm canister slug (0.30kg @750, 22mm)',0.30,750,0.022,22),
 ('new TL10 gauss bolt HD (2.4kg @1700, 28mm)',2.4,1700,0.028,28),
 ('new TL10 bit slug (0.15kg @1600, 12mm)',0.15,1600,0.012,12),
]
for n,m,v,d,c in R:
  p=cole(m,v,d);h,r=baughn(m,v,c)
  print(f'{n}: KE {0.5*m*v*v/1e3:.0f} kJ -> {p:.0f} pts (6dx{p/21:.1f}) | RNG {h:.0f}/{r:.0f} yd /15 = {h/15:.0f}/{r/15:.0f}')
