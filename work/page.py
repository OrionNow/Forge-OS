import re,sys
def page(f,ln):
  L=open(f,encoding='utf-8',errors='replace').read().split('\n')
  for i in range(ln-1,min(len(L),ln+400)):
    s=L[i].strip()
    m=re.fullmatch(r'(\d{2,3})\s+[A-Z][A-Z ,&-]+',s) or re.fullmatch(r'[A-Z][A-Z ,&-]+?\s+(\d{2,3})',s) or re.fullmatch(r'PYRAMID MAGAZINE\s+(\d+)\s+.*',s)
    if m: return m.group(1)
for a in sys.argv[2:]: print(a,page(sys.argv[1],int(a)))
