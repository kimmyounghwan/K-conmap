"""골조 수량산출 예시 도면 만들기 — python tools/골조_예시도면.py (ezdxf 필요)
   K-건설맵이 그린 «가상» 구조평면도입니다. 실제 현장·남의 도면이 아닙니다. (2026-09-26)
   화면: /jeoksan/golgo 의 «🧪 예시로 해 보기» · 짝이 되는 자료: lib/골조.js 의 예시공사()
"""
# 골조 수량산출 예시 도면 — «가상» 구조평면도 (실제 현장 아님). K-건설맵이 그린 것.
import ezdxf
from ezdxf.enums import TextEntityAlignment
doc = ezdxf.new('R2010', setup=True)
doc.header['$INSUNITS'] = 4
doc.header['$MEASUREMENT'] = 1
msp = doc.modelspace()
L = doc.layers
for name, col, lt in [('S-GRID', 1, 'CENTER'), ('S-COLU', 7, 'CONTINUOUS'), ('S-BEAM', 3, 'DASHED'), ('S-BEAM-TXT', 2, 'CONTINUOUS'),
                      ('S-SLAB-TXT', 4, 'CONTINUOUS'), ('S-DIMS', 8, 'CONTINUOUS'), ('S-TITLE', 7, 'CONTINUOUS'), ('S-FOOT', 6, 'CONTINUOUS'), ('S-WALL', 5, 'CONTINUOUS')]:
    if name not in L:
        L.add(name, color=col, linetype=lt if lt in doc.linetypes else 'CONTINUOUS')
doc.styles.add('KOR', font='malgun.ttf')
X = [0, 7000, 14000, 21000]
Y = [0, 6000, 12000]
C = 600      # 기둥 600각
def txt(s, x, y, h=250, layer='S-BEAM-TXT', align=TextEntityAlignment.MIDDLE_CENTER, rot=0):
    t = msp.add_text(s, dxfattribs={'layer': layer, 'height': h, 'style': 'KOR', 'rotation': rot})
    t.set_placement((x, y), align=align)
# 통심선
for i, x in enumerate(X):
    msp.add_line((x, -2500), (x, 14500), dxfattribs={'layer': 'S-GRID'})
    msp.add_circle((x, -3000), 450, dxfattribs={'layer': 'S-GRID'})
    txt('X%d' % (i + 1), x, -3000, 350, 'S-GRID')
for j, y in enumerate(Y):
    msp.add_line((-2500, y), (23500, y), dxfattribs={'layer': 'S-GRID'})
    msp.add_circle((-3000, y), 450, dxfattribs={'layer': 'S-GRID'})
    txt('Y%d' % (j + 1), -3000, y, 350, 'S-GRID')
# 기둥 C1 (닫힌 폴리선)
for x in X:
    for y in Y:
        h = C / 2
        msp.add_lwpolyline([(x - h, y - h), (x + h, y - h), (x + h, y + h), (x - h, y + h)], close=True, dxfattribs={'layer': 'S-COLU'})
        msp.add_line((x - h, y - h), (x + h, y + h), dxfattribs={'layer': 'S-COLU'})
        msp.add_line((x - h, y + h), (x + h, y - h), dxfattribs={'layer': 'S-COLU'})
        txt('C1', x + 550, y + 550, 220, 'S-COLU', TextEntityAlignment.BOTTOM_LEFT)
# 큰보 — 가운데 선(보 기호가 붙는 선) + 양옆 선
def beam(x0, y0, x1, y1, w, name):
    import math
    dx, dy = x1 - x0, y1 - y0
    d = math.hypot(dx, dy); nx, ny = -dy / d, dx / d
    for s in (-1, 1):
        msp.add_line((x0 + nx * w / 2 * s, y0 + ny * w / 2 * s), (x1 + nx * w / 2 * s, y1 + ny * w / 2 * s), dxfattribs={'layer': 'S-BEAM'})
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    rot = 0 if abs(dy) < 1e-9 else 90
    txt(name, mx + nx * (w / 2 + 250), my + ny * (w / 2 + 250), 250, 'S-BEAM-TXT', TextEntityAlignment.MIDDLE_CENTER, rot)
h = C / 2
for j, y in enumerate(Y):
    nm, w = ('G2', 500) if j == 1 else ('G1', 400)
    for i in range(3):
        beam(X[i] + h, y, X[i + 1] - h, y, w, nm)
for i, x in enumerate(X):
    nm, w = ('G2', 500) if i in (1, 2) else ('G1', 400)
    for j in range(2):
        beam(x, Y[j] + h, x, Y[j + 1] - h, w, nm)
# 작은보 B1 (칸 가운데, 세로)
for i in range(3):
    x = (X[i] + X[i + 1]) / 2
    for j in range(2):
        y0 = Y[j] + (200 if j == 0 else 250)
        y1 = Y[j + 1] - (250 if j == 0 else 200)
        beam(x, y0, x, y1, 300, 'B1')
# 슬라브 기호
for i in range(3):
    for j in range(2):
        for k in range(2):
            cx = X[i] + 1750 + k * 3500
            cy = (Y[j] + Y[j + 1]) / 2
            msp.add_circle((cx, cy), 380, dxfattribs={'layer': 'S-SLAB-TXT'})
            txt('S1', cx, cy, 250, 'S-SLAB-TXT')
# 치수
ds = 'Standard'
for i in range(3):
    d = msp.add_linear_dim(base=(0, -1500), p1=(X[i], 0), p2=(X[i + 1], 0), dimstyle=ds, dxfattribs={'layer': 'S-DIMS'}, override={'dimlfac': 1, 'dimtsz': 0, 'dimtxt': 250, 'dimasz': 150, 'dimexe': 100, 'dimexo': 150, 'dimdec': 0})
    d.render()
d = msp.add_linear_dim(base=(0, -2200), p1=(X[0], 0), p2=(X[3], 0), dimstyle=ds, dxfattribs={'layer': 'S-DIMS'}, override={'dimlfac': 1, 'dimtsz': 0, 'dimtxt': 250, 'dimasz': 150, 'dimdec': 0}); d.render()
for j in range(2):
    d = msp.add_linear_dim(base=(-1500, 0), p1=(0, Y[j]), p2=(0, Y[j + 1]), angle=90, dimstyle=ds, dxfattribs={'layer': 'S-DIMS'}, override={'dimlfac': 1, 'dimtsz': 0, 'dimtxt': 250, 'dimasz': 150, 'dimdec': 0}); d.render()
# 작은보 간격 치수(위쪽)
for i in range(3):
    xm = (X[i] + X[i + 1]) / 2
    for a, b in ((X[i], xm), (xm, X[i + 1])):
        d = msp.add_linear_dim(base=(0, 13300), p1=(a, 12000), p2=(b, 12000), dimstyle=ds, dxfattribs={'layer': 'S-DIMS'}, override={'dimlfac': 1, 'dimtsz': 0, 'dimtxt': 250, 'dimasz': 150, 'dimdec': 0}); d.render()
# 제목
txt('2층 바닥 구조평면도 (가상 예시 — 실제 현장이 아닙니다)   S=1/100', 10500, -5000, 500, 'S-TITLE')
txt('보: G1 400x700 · G2 500x750 · B1 300x600    기둥: C1 600x600    슬라브: S1 t=150', 10500, -5900, 300, 'S-TITLE')
# 기초 평면(오른쪽에 작게) — 독립기초 F1 2400각 하나와 벽 W1 한 줄
fx, fy = 29000, 3000
msp.add_lwpolyline([(fx - 1200, fy - 1200), (fx + 1200, fy - 1200), (fx + 1200, fy + 1200), (fx - 1200, fy + 1200)], close=True, dxfattribs={'layer': 'S-FOOT'})
msp.add_lwpolyline([(fx - 300, fy - 300), (fx + 300, fy - 300), (fx + 300, fy + 300), (fx - 300, fy + 300)], close=True, dxfattribs={'layer': 'S-COLU'})
txt('F1', fx, fy - 1600, 300, 'S-FOOT')
d = msp.add_linear_dim(base=(0, fy + 1800), p1=(fx - 1200, fy + 1200), p2=(fx + 1200, fy + 1200), dimstyle=ds, dxfattribs={'layer': 'S-DIMS'}, override={'dimlfac': 1, 'dimtsz': 0, 'dimtxt': 250, 'dimasz': 150, 'dimdec': 0}); d.render()
wy = 8000
msp.add_line((26000, wy - 100), (32000, wy - 100), dxfattribs={'layer': 'S-WALL'})
msp.add_line((26000, wy + 100), (32000, wy + 100), dxfattribs={'layer': 'S-WALL'})
txt('W1 (t=200)', 29000, wy + 450, 300, 'S-WALL')
d = msp.add_linear_dim(base=(0, wy - 900), p1=(26000, wy - 100), p2=(32000, wy - 100), dimstyle=ds, dxfattribs={'layer': 'S-DIMS'}, override={'dimlfac': 1, 'dimtsz': 0, 'dimtxt': 250, 'dimasz': 150, 'dimdec': 0}); d.render()
txt('기초·벽 (가상 예시)', 29000, -1000, 350, 'S-TITLE')
import os
doc.saveas(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'public', 'jeoksan', '골조_예시.dxf'))
print('ok')
