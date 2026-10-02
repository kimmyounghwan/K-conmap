"""도면 PDF 만들기(/tools/dxfpdf) «도곽(박스) 찾기» 시험 도면 — python tools/도곽_시험도면.py <폴더>  (ezdxf 필요)
   🛠 G118 (2026-10-02) 소장님 「캐드내에서 박스로 여러 도면이 있는데, 박스별로 한장씩 pdf로 나와야 하는데, 한꺼번에 나온다고」
   모두 «지어낸» 네모·선입니다(남의 도면 아님). 시험: node tools/시험_도곽찾기.mjs
"""
import ezdxf, random, sys, os
random.seed(1)
S=100; FW,FH=420*S,297*S
def base():
    d=ezdxf.new('R2018'); d.header['$INSUNITS']=4; return d, d.modelspace()
def stuff(m, ox, oy, w, h, n=80):
    for _ in range(n):
        x=ox+random.uniform(0.1,0.9)*w; y=oy+random.uniform(0.1,0.9)*h
        m.add_line((x,y),(x+random.uniform(-0.1,0.1)*w, y+random.uniform(-0.1,0.1)*h))
def rect(m, x0,y0,w,h, **kw): m.add_lwpolyline([(x0,y0),(x0+w,y0),(x0+w,y0+h),(x0,y0+h)], close=True, dxfattribs=kw)
def lines4(m,x0,y0,w,h):
    m.add_line((x0,y0),(x0+w,y0)); m.add_line((x0+w,y0),(x0+w,y0+h)); m.add_line((x0+w,y0+h),(x0,y0+h)); m.add_line((x0,y0+h),(x0,y0))
cases={}
# a) 3 A3 polyline frames
d,m=base()
for i in range(3): rect(m,i*(FW+20*S),0,FW,FH); stuff(m,i*(FW+20*S),0,FW,FH)
cases['a_폴리선도곽3']=d
# b) 3 frames as block INSERT
d,m=base(); b=d.blocks.new('TB'); b.add_lwpolyline([(0,0),(420,0),(420,297),(0,297)],close=True); b.add_line((300,0),(300,40))
for i in range(3): m.add_blockref('TB',(i*(FW+20*S),0),dxfattribs={'xscale':S,'yscale':S}); stuff(m,i*(FW+20*S),0,FW,FH)
cases['b_블록도곽3']=d
# c) 3 frames + outer big box around all (ratio in range)
d,m=base()
for i in range(3): rect(m,i*(FW+20*S),0,FW,FH); stuff(m,i*(FW+20*S),0,FW,FH)
W=3*FW+40*S; rect(m,-50*S,-300*S,W+100*S,(W+100*S)/1.414)
cases['c_바깥큰네모']=d
# d) boxes with non-A ratio (e.g., 1:1.6 , 1:1.25)
d,m=base()
for i,(w,h) in enumerate([(500*S,312*S),(400*S,320*S),(450*S,300*S)]): rect(m,i*600*S,0,w,h); stuff(m,i*600*S,0,w,h)
cases['d_비율다른박스']=d
# e) frames as 4 lines in busy drawing (many long axis lines)
d,m=base()
for i in range(3):
    ox=i*(FW+20*S); lines4(m,ox,0,FW,FH)
    for k in range(800):
        y=random.uniform(0.05,0.95)*FH; m.add_line((ox+0.05*FW,y),(ox+0.6*FW,y))
        x=ox+random.uniform(0.05,0.95)*FW; m.add_line((x,0.05*FH),(x,0.5*FH))
cases['e_선도곽_선많음']=d
# f) frame polyline with extra collinear vertices (6 pts)
d,m=base()
for i in range(3):
    ox=i*(FW+20*S); m.add_lwpolyline([(ox,0),(ox+FW/2,0),(ox+FW,0),(ox+FW,FH),(ox+FW/2,FH),(ox,FH)],close=True); stuff(m,ox,0,FW,FH)
cases['f_꼭짓점더있는폴리선']=d
# g) A3 frames arranged vertically / 2 rows
d,m=base()
for i in range(4): ox=(i%2)*(FW+20*S); oy=-(i//2)*(FH+20*S); rect(m,ox,oy,FW,FH); stuff(m,ox,oy,FW,FH)
cases['g_두줄4장']=d
# h) frames drawn with line segments broken (top line in 2 pieces)
d,m=base()
for i in range(3):
    ox=i*(FW+20*S); m.add_line((ox,0),(ox+FW,0)); m.add_line((ox+FW,0),(ox+FW,FH)); m.add_line((ox+FW,FH),(ox+FW*0.6,FH)); m.add_line((ox+FW*0.6,FH),(ox,FH)); m.add_line((ox,FH),(ox,0)); stuff(m,ox,0,FW,FH)
cases['h_끊긴선도곽']=d
# i) different sizes A1 + A3 mix
d,m=base()
rect(m,0,0,841*S,594*S); stuff(m,0,0,841*S,594*S,200)
rect(m,900*S,0,FW,FH); stuff(m,900*S,0,FW,FH)
rect(m,900*S+FW+20*S,0,FW,FH); stuff(m,900*S+FW+20*S,0,FW,FH)
cases['i_A1과A3섞임']=d
# j) 1:1 scale frames in mm (no scale), A3 size 420x297 at scale 1 with many A3 frames (10)
d,m=base()
for i in range(10): ox=(i%5)*450; oy=-(i//5)*320; rect(m,ox,oy,420,297); stuff(m,ox,oy,420,297,40)
cases['j_1대1_10장']=d

# ── 잘못 나누면 안 되는 것 · 더 다른 버릇
random.seed(2)
모음 = cases
cases = {}
S=100; FW,FH=420*S,297*S
def base():
    d=ezdxf.new('R2018'); d.header['$INSUNITS']=4; return d, d.modelspace()
def stuff(m, ox, oy, w, h, n=80):
    for _ in range(n):
        x=ox+random.uniform(0.1,0.9)*w; y=oy+random.uniform(0.1,0.9)*h
        m.add_line((x,y),(x+random.uniform(-0.1,0.1)*w, y+random.uniform(-0.1,0.1)*h))
def rect(m, x0,y0,w,h, **kw): m.add_lwpolyline([(x0,y0),(x0+w,y0),(x0+w,y0+h),(x0,y0+h)], close=True, dxfattribs=kw)
cases={}
# n1 single sheet: frame + inner border + title table + rooms
d,m=base(); rect(m,0,0,FW,FH); rect(m,10*S,5*S,FW-15*S,FH-10*S)
for r in range(5): rect(m,FW-100*S, 5*S+r*8*S, 95*S, 8*S)
for i in range(4):
    for j in range(3): rect(m,30*S+i*60*S, 40*S+j*70*S, 55*S, 65*S)
stuff(m,0,0,FW,FH,300)
cases['n1_한장_안쪽테두리_방']=d
# n2 floor plan no frame, rooms
d,m=base()
for i in range(5):
    for j in range(4): rect(m,i*6000, j*5000, 5800, 4800)
stuff(m,0,0,30000,20000,300)
cases['n2_도곽없는평면']=d
# n3 sheet with frame (no inner border) containing two √2 detail boxes covering most
d,m=base(); rect(m,0,0,FW,FH)
rect(m,10*S,60*S,190*S,135*S); stuff(m,10*S,60*S,190*S,135*S,200)
rect(m,215*S,60*S,190*S,135*S); stuff(m,215*S,60*S,190*S,135*S,200)
for r in range(3): rect(m,FW-100*S, 5*S+r*8*S, 95*S, 8*S)
cases['n3_한장안상세박스둘']=d
# k wide polyline frames
d,m=base()
for i in range(3):
    ox=i*(FW+20*S); m.add_lwpolyline([(ox,0),(ox+FW,0),(ox+FW,FH),(ox,FH)],close=True,dxfattribs={'const_width':0.7*S}); stuff(m,ox,0,FW,FH)
cases['k_굵은폴리선도곽3']=d
# n8 two big rooms side by side, no frame (generic false positive?)
d,m=base(); rect(m,0,0,10000,8000); rect(m,10000,0,9000,8000); stuff(m,0,0,19000,8000,300)
cases['n8_큰방둘']=d
# n6 3 frames (blocks w/ thick inner border) inside an outer box drawn by lines
d,m=base(); b=d.blocks.new('TB'); b.add_lwpolyline([(0,0),(420,0),(420,297),(0,297)],close=True); b.add_lwpolyline([(10,5),(415,5),(415,292),(10,292)],close=True,dxfattribs={'const_width':0.7})
for i in range(3): m.add_blockref('TB',(i*(FW+20*S),0),dxfattribs={'xscale':S,'yscale':S}); stuff(m,i*(FW+20*S),0,FW,FH)
W=3*FW+40*S; X0,Y0=-30*S,-30*S; X1,Y1=W+30*S,FH+30*S
for a,b2 in [((X0,Y0),(X1,Y0)),((X1,Y0),(X1,Y1)),((X1,Y1),(X0,Y1)),((X0,Y1),(X0,Y0))]: m.add_line(a,b2)
cases['n6_블록도곽_선둘레']=d
# big busy: 6 sheets each 3000 lines
d,m=base()
for i in range(6):
    ox=(i%3)*(FW+20*S); oy=-(i//3)*(FH+20*S); rect(m,ox,oy,FW,FH); stuff(m,ox,oy,FW,FH,1500)
cases['p_큰도면6장']=d

cases.update(모음)
out = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(out, exist_ok=True)
for k, d in cases.items(): d.saveas(os.path.join(out, k + '.dxf'))
print(len(cases))
