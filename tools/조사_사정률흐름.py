import json, collections, math, random, statistics as st
d=json.load(open('/tmp/g10/fm55/data/store/first.json'))['con']
rows=[]
for r in d.values():
    try:
        base=float(r.get('base') or 0); amt=float(r.get('amt') or 0); rate=float(r.get('rate') or 0)
        lo=float(r.get('lo') or 0); hi=float(r.get('hi') or 0)
    except: continue
    if base<=0 or amt<=0 or rate<=0: continue
    ye=amt/(rate/100); s=ye/base*100
    if not (95<s<105): continue
    rows.append((r['inst'], r['dt'], s, lo, hi))
rows.sort(key=lambda x:(x[0],x[1]))
dts=sorted(x[1] for x in rows); print('개찰',len(rows), dts[0][:10], dts[-1][:10])
by=collections.defaultdict(list)
for i,dt,s,lo,hi in rows: by[i].append((dt,s,lo,hi))
# 범위 ±2/±3 비율
print('예가범위', collections.Counter((x[3],x[4]) for x in rows).most_common(4))
# 1) 같은 기관 바로 앞 사정률과 다음 사정률 상관
xs=[];ys=[]
for i,L in by.items():
    for a,b in zip(L,L[1:]): xs.append(a[1]); ys.append(b[1])
def corr(x,y):
    mx,my=st.mean(x),st.mean(y); sx=math.sqrt(sum((a-mx)**2 for a in x)); sy=math.sqrt(sum((b-my)**2 for b in y)); return sum((a-mx)*(b-my) for a,b in zip(x,y))/(sx*sy)
print('앞뒤 쌍',len(xs),'상관',round(corr(xs,ys),4))
# 2) 비드프로식 «최고와 차순» 구간: 그 기관 지난 N건 사정률을 0.5 폭 칸으로 세어 많은 두 칸 → 다음 사정률이 그 두 칸에 들어가나
def bins(v): return math.floor(v/0.5)
overall=collections.Counter(bins(x[2]) for x in rows)
top2_all=[b for b,_ in overall.most_common(2)]
hit=hit_all=n=0; hit_rand=0
rnd=random.Random(1)
for i,L in by.items():
    for k in range(10,len(L)):
        past=[x[1] for x in L[k-30 if k>=30 else 0:k]]
        c=collections.Counter(bins(v) for v in past)
        t2=[b for b,_ in c.most_common(2)]
        nb=bins(L[k][1]); n+=1
        hit+= nb in t2; hit_all+= nb in top2_all
print('뒤 시험(기관 지난 10~30건 이상 있는 공고)',n,'기관 흐름 최고·차순 칸 적중',round(hit/n*100,1),'% · 전체 분포 최고·차순 칸 적중',round(hit_all/n*100,1),'%')
print('전체 분포 칸', [(b*0.5, round(overall[b]/len(rows)*100,1)) for b in sorted(overall)])
# 3) 기관 지난 평균으로 다음 맞히기 오차 vs 전체 평균
e1=[];e2=[]; m_all=st.mean(x[2] for x in rows)
for i,L in by.items():
    for k in range(10,len(L)):
        m=st.mean(x[1] for x in L[max(0,k-30):k]); e1.append(abs(L[k][1]-m)); e2.append(abs(L[k][1]-m_all))
print('평균 절대오차 기관평균',round(st.mean(e1),4),'전체평균',round(st.mean(e2),4), 'n',len(e1))
print('--- 예가범위별')
for rg in [(-3.0,3.0),(-2.0,2.0)]:
    R=[x for x in rows if (x[3],x[4])==rg]
    ov=collections.Counter(bins(x[2]) for x in R); t2=[b for b,_ in ov.most_common(2)]
    B=collections.defaultdict(list)
    for i,dt,s,lo,hi in R: B[i].append(s)
    n=h1=h2=0; xs=[];ys=[]
    for i,L in B.items():
        for a,b in zip(L,L[1:]): xs.append(a); ys.append(b)
        for k in range(10,len(L)):
            c=collections.Counter(bins(v) for v in L[max(0,k-30):k]); tt=[b for b,_ in c.most_common(2)]
            nb=bins(L[k]); n+=1; h1+= nb in tt; h2+= nb in t2
    print(rg,'개찰',len(R),'앞뒤상관',round(corr(xs,ys),4) if len(xs)>2 else '-','시험',n,'기관흐름 적중',round(h1/max(n,1)*100,1),'% · 범위 전체분포 적중',round(h2/max(n,1)*100,1),'%', '전체 최고·차순 칸',[b*0.5 for b in t2])
