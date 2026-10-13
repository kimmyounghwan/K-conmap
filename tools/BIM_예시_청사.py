"""BIM 물량 예시 도면 ② — python tools/BIM_예시_청사.py [저장할 곳] (ezdxf 필요)
   K-건설맵이 지어낸 «가상» 지하 1층 · 지상 2층 청사 구조도 한 벌입니다. 실제 현장 · 남의 도면이 아닙니다. (2026-10-13 · G284)
   3층 예시(BIM_예시도면.py)보다 실제 도면 버릇을 더 넣었습니다 —
   ① 층 머리 붙은 부재 이름(1G1 · 2G1 · RG1 …) ② 지하 둘레 옹벽 RW1(1층 구조평면도에 그림 = 지하 1층 → 1층)
   ③ 한쪽 끝이 빈 벽 W1(벽 끝 단부 보강근 4-HD13) ④ 일람표에 크기가 빈 보 2B1(→ 🤖 같은 몸 «1B1» 크기로 채움)
   ⑤ «180mm» 처럼 단위가 붙은 두께 ⑥ 층 높이 지하1층 FL-4,200 · 칸 넓이 7.2 · 7.2 · 7.2 m / 6.6 · 5.4 m
   화면: /jeoksan/bim «🏛 가상 청사(지하 1층)» · 시험: node tools/시험_BIM물량.mjs
"""
import sys, os, math
import ezdxf
from ezdxf.enums import TextEntityAlignment as A

출력 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'public', 'jeoksan', 'BIM예시_청사.dxf')

doc = ezdxf.new('R2010', setup=True)
doc.header['$INSUNITS'] = 4
msp = doc.modelspace()
for name, col in [('S-GRID', 1), ('S-COLU', 7), ('S-BEAM', 3), ('S-BEAM-TXT', 2), ('S-SLAB-TXT', 4), ('S-WALL', 5),
                  ('S-FOOT', 6), ('S-DIMS', 8), ('S-TITLE', 7), ('S-TABLE', 7), ('S-TABLE-TXT', 7)]:
    doc.layers.add(name, color=col)
doc.styles.add('KOR', font='malgun.ttf')


def txt(s, x, y, h=250, layer='S-BEAM-TXT', align=A.MIDDLE_CENTER, rot=0):
    t = msp.add_text(s, dxfattribs={'layer': layer, 'height': h, 'style': 'KOR', 'rotation': rot})
    t.set_placement((x, y), align=align)


def line(a, b, layer):
    msp.add_line(a, b, dxfattribs={'layer': layer})


def rect(cx, cy, w, h, layer):
    msp.add_lwpolyline([(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)], close=True, dxfattribs={'layer': layer})


X = [0, 7200, 14400, 21600]
Y = [0, 6600, 12000]
GX, GY = X[-1], Y[-1]


def 평면(ox, oy, 기둥, 기둥폭, 보이름, 슬래브, 제목, 옹벽=None, 벽=None):
    """보이름: (바깥 큰보, 안 큰보, 작은보) · 옹벽: (이름, 두께) 둘레 · 벽: (이름, 두께) X2 줄 Y1 기둥 면 ~ 4,200(한쪽 끝 빔)"""
    G1, G2, B1 = 보이름
    h = 기둥폭 / 2
    for i, x in enumerate(X):
        line((ox + x, oy - 2500), (ox + x, oy + GY + 2500), 'S-GRID')
        msp.add_circle((ox + x, oy - 3000), 450, dxfattribs={'layer': 'S-GRID'})
        txt('X%d' % (i + 1), ox + x, oy - 3000, 350, 'S-GRID')
    for j, y in enumerate(Y):
        line((ox - 2500, oy + y), (ox + GX + 2500, oy + y), 'S-GRID')
        msp.add_circle((ox - 3000, oy + y), 450, dxfattribs={'layer': 'S-GRID'})
        txt('Y%d' % (j + 1), ox - 3000, oy + y, 350, 'S-GRID')
    for x in X:
        for y in Y:
            rect(ox + x, oy + y, 기둥폭, 기둥폭, 'S-COLU')
            txt(기둥, ox + x + h + 250, oy + y + h + 250, 220, 'S-COLU', A.BOTTOM_LEFT)

    def beam(x0, y0, x1, y1, w, name):
        dx, dy = x1 - x0, y1 - y0
        d = math.hypot(dx, dy)
        nx, ny = -dy / d, dx / d
        for s in (-1, 1):
            line((ox + x0 + nx * w / 2 * s, oy + y0 + ny * w / 2 * s), (ox + x1 + nx * w / 2 * s, oy + y1 + ny * w / 2 * s), 'S-BEAM')
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        rot = 0 if abs(dy) < 1e-9 else 90
        txt(name, ox + mx + nx * (w / 2 + 250), oy + my + ny * (w / 2 + 250), 250, 'S-BEAM-TXT', A.MIDDLE_CENTER, rot)

    폭 = {G1: 400, G2: 500}
    for j, y in enumerate(Y):
        nm = G2 if j == 1 else G1
        for i in range(3):
            beam(X[i] + h, y, X[i + 1] - h, y, 폭[nm], nm)
    for i, x in enumerate(X):
        nm = G2 if i in (1, 2) else G1
        for j in range(2):
            beam(x, Y[j] + h, x, Y[j + 1] - h, 폭[nm], nm)
    반 = {0: 200, 1: 250, 2: 200}
    for i in range(3):
        x = (X[i] + X[i + 1]) / 2
        for j in range(2):
            beam(x, Y[j] + 반[j], x, Y[j + 1] - 반[j + 1], 250, B1)      # 작은보 250(옹벽 300 과 다르게)
    for i in range(3):
        반칸 = (X[i + 1] - X[i]) / 2
        for j in range(2):
            for k in range(2):
                cx = X[i] + 반칸 / 2 + k * 반칸
                cy = (Y[j] + Y[j + 1]) / 2 + 900
                msp.add_circle((ox + cx, oy + cy), 380, dxfattribs={'layer': 'S-SLAB-TXT'})
                txt(슬래브, ox + cx, oy + cy, 250, 'S-SLAB-TXT')
    if 옹벽:
        nm, t = 옹벽
        # 둘레 — 바깥 면 · 안 면을 한 줄로 길게(기둥을 지나감 · 실제 도면 버릇) · 통심 위에 벽 가운데
        for y, sg in ((Y[0], -1), (Y[2], 1)):
            line((ox - t / 2, oy + y + sg * t / 2), (ox + GX + t / 2, oy + y + sg * t / 2), 'S-WALL')
            line((ox + t / 2, oy + y - sg * t / 2), (ox + GX - t / 2, oy + y - sg * t / 2), 'S-WALL')
            for i in range(3):
                txt(nm, ox + (X[i] + X[i + 1]) / 2, oy + y + sg * (t / 2 + 900), 250, 'S-WALL')
        for x, sg in ((X[0], -1), (X[3], 1)):
            line((ox + x + sg * t / 2, oy - t / 2), (ox + x + sg * t / 2, oy + GY + t / 2), 'S-WALL')
            line((ox + x - sg * t / 2, oy + t / 2), (ox + x - sg * t / 2, oy + GY - t / 2), 'S-WALL')
            for j in range(2):
                txt(nm, ox + x + sg * (t / 2 + 900), oy + (Y[j] + Y[j + 1]) / 2, 250, 'S-WALL', A.MIDDLE_CENTER, 90)
    if 벽:
        nm, t = 벽
        x = X[1]
        y0, y1 = Y[0] + h, 4200
        line((ox + x - t / 2, oy + y0), (ox + x - t / 2, oy + y1), 'S-WALL')
        line((ox + x + t / 2, oy + y0), (ox + x + t / 2, oy + y1), 'S-WALL')
        line((ox + x - t / 2, oy + y1), (ox + x + t / 2, oy + y1), 'S-WALL')      # 빈 끝 막음 선
        txt(nm, ox + x + 700, oy + 2400, 250, 'S-WALL', A.MIDDLE_CENTER, 90)
    for i in range(3):
        d = msp.add_linear_dim(base=(ox, oy - 1500), p1=(ox + X[i], oy), p2=(ox + X[i + 1], oy), dimstyle='Standard',
                               dxfattribs={'layer': 'S-DIMS'}, override={'dimtxt': 250, 'dimasz': 150, 'dimdec': 0})
        d.render()
    txt(제목, ox + GX / 2, oy - 5000, 500, 'S-TITLE')
    txt('S=1/100  (가상 예시 — 실제 현장이 아닙니다)', ox + GX / 2, oy - 5800, 280, 'S-TITLE')


간격 = 28000
평면(0, 0, 'C1', 600, ('1G1', '1G2', '1B1'), 'S1', '1층 구조평면도', 옹벽=('RW1', 300))
평면(0, 간격, 'C1', 600, ('2G1', '2G2', '2B1'), 'S2', '2층 구조평면도', 벽=('W1', 200))
평면(0, 간격 * 2, 'C2', 500, ('RG1', 'RG2', 'RB1'), 'RS1', '지붕층 구조평면도')

# 기초 평면도 — 독립기초 F1 2800각 × 12 (지하 1층 바닥)
fx0, fy0 = 38000, 0
for x in X:
    line((fx0 + x, fy0 - 2500), (fx0 + x, fy0 + GY + 2500), 'S-GRID')
for y in Y:
    line((fx0 - 2500, fy0 + y), (fx0 + GX + 2500, fy0 + y), 'S-GRID')
for x in X:
    for y in Y:
        rect(fx0 + x, fy0 + y, 2800, 2800, 'S-FOOT')
        rect(fx0 + x, fy0 + y, 600, 600, 'S-COLU')
        txt('F1', fx0 + x, fy0 + y - 1700, 250, 'S-FOOT')
txt('기초 평면도', fx0 + GX / 2, fy0 - 5000, 500, 'S-TITLE')
txt('S=1/100  (가상 예시 — 실제 현장이 아닙니다)', fx0 + GX / 2, fy0 - 5800, 280, 'S-TITLE')

# 부재 일람표
tx0, ty0 = 38000, 76000


def 칸(x0, y0, w, hh):
    msp.add_lwpolyline([(x0, y0), (x0 + w, y0), (x0 + w, y0 - hh), (x0, y0 - hh)], close=True, dxfattribs={'layer': 'S-TABLE'})


def 표글(s, x, y, hh=200):
    if not s:
        return
    t = msp.add_text(s, dxfattribs={'layer': 'S-TABLE-TXT', 'height': hh, 'style': 'KOR'})
    t.set_placement((x, y), align=A.MIDDLE_CENTER)


# 2B1 은 크기 칸을 비움(도면 버릇 — 같은 몸 1B1 과 같은 크기라 안 적음) → 클로드가 «같은 몸» 으로 채움
보들 = [('1G1', '400X700', ('4-HD22', '4-HD22'), ('3-HD22', '3-HD22'), ('HD10@150', 'HD10@300'), ''),
      ('1G2', '500X800', ('5-HD25', '5-HD25'), ('4-HD25', '4-HD25'), ('HD10@150', 'HD10@250'), '2-HD13'),
      ('1B1', '250X600', ('3-HD19', '3-HD19'), ('3-HD19', '3-HD19'), ('HD10@200', 'HD10@200'), ''),
      ('2G1', '400X700', ('4-HD22', '4-HD22'), ('3-HD22', '3-HD22'), ('HD10@150', 'HD10@300'), ''),
      ('2G2', '500X800', ('5-HD22', '5-HD22'), ('4-HD22', '4-HD22'), ('HD10@150', 'HD10@250'), '2-HD13'),
      ('2B1', '', ('3-HD19', '3-HD19'), ('3-HD19', '3-HD19'), ('HD10@200', 'HD10@200'), ''),
      ('RG1', '400X650', ('4-HD22', '4-HD22'), ('3-HD22', '3-HD22'), ('HD10@150', 'HD10@300'), ''),
      ('RG2', '500X750', ('5-HD22', '5-HD22'), ('4-HD22', '4-HD22'), ('HD10@150', 'HD10@250'), '2-HD13'),
      ('RB1', '250X550', ('3-HD19', '3-HD19'), ('3-HD19', '3-HD19'), ('HD10@200', 'HD10@200'), '')]
표글('보 일람표 (BEAM LIST)', tx0 + 14000, ty0 + 800, 450)
줄 = ['B×D', '상부근', '하부근', '늑근', '복부근']
칸(tx0, ty0, 1600, 600); 표글('부호', tx0 + 800, ty0 - 300)
칸(tx0, ty0 - 600, 1600, 600); 표글('위치', tx0 + 800, ty0 - 900)
for r, m in enumerate(줄):
    칸(tx0, ty0 - 1200 - r * 600, 1600, 600)
    표글(m, tx0 + 800, ty0 - 1500 - r * 600)
for k, (n, s, t, b, st, sk) in enumerate(보들):
    x0 = tx0 + 1600 + k * 3000
    칸(x0, ty0, 3000, 600); 표글(n, x0 + 1500, ty0 - 300, 250)
    for c, 곳 in enumerate(['단부', '중앙']):
        xc = x0 + c * 1500
        칸(xc, ty0 - 600, 1500, 600); 표글(곳, xc + 750, ty0 - 900)
        for r, v in enumerate([s, t[c], b[c], st[c], sk or '-']):
            칸(xc, ty0 - 1200 - r * 600, 1500, 600)
            표글(v, xc + 750, ty0 - 1500 - r * 600)

# 기둥 일람표 — C1 지하1층 ~ 1층 · C2 2층
cy0 = ty0 - 5500
표글('기둥 일람표', tx0 + 3000, cy0 + 800, 450)
for c, m in enumerate(['부호', '층', 'SIZE', '주근', '띠철근(단부)', '띠철근(중앙)']):
    칸(tx0 + c * 1800, cy0, 1800, 600); 표글(m, tx0 + c * 1800 + 900, cy0 - 300)
for r, row in enumerate([['C1', 'B1~1F', '600X600', '12-HD22', 'HD10@150', 'HD10@300'], ['C2', '2F', '500X500', '8-HD22', 'HD10@150', 'HD10@300']]):
    for c, v in enumerate(row):
        칸(tx0 + c * 1800, cy0 - 600 - r * 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, cy0 - 900 - r * 600)

# 슬래브 일람표 — 지붕 두께는 «180mm»(단위 붙음)
sy0 = cy0 - 3000
표글('슬래브 일람표', tx0 + 4000, sy0 + 800, 450)
for c, m in enumerate(['부호', '두께', '단변 상부', '단변 하부', '장변 상부', '장변 하부']):
    칸(tx0 + c * 1800, sy0, 1800, 600); 표글(m, tx0 + c * 1800 + 900, sy0 - 300)
for r, (n, t, a, b) in enumerate([('S1', '200', 'HD13@200', 'HD13@200'), ('S2', '150', 'HD10@200', 'HD10@200'), ('RS1', '180mm', 'HD10@200', 'HD10@200')]):
    for c, v in enumerate([n, t, a, b, 'HD10@250', 'HD10@250']):
        칸(tx0 + c * 1800, sy0 - 600 - r * 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, sy0 - 900 - r * 600)

# 기초 일람표
fy1 = sy0 - 3600
표글('기초 일람표', tx0 + 3500, fy1 + 800, 450)
for c, m in enumerate(['부호', '크기', '두께', '하부근(양방향)']):
    칸(tx0 + c * 1800, fy1, 1800, 600); 표글(m, tx0 + c * 1800 + 900, fy1 - 300)
for c, v in enumerate(['F1', '2800X2800', 'D=900', 'HD22@200']):
    칸(tx0 + c * 1800, fy1 - 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, fy1 - 900)

# 벽체 일람표 — 옹벽 RW1 · 벽 W1(끝 단부 보강근)
wy1 = fy1 - 2500
표글('벽체 일람표', tx0 + 4500, wy1 + 800, 450)
for c, m in enumerate(['부호', '두께', '수직근', '수평근', '배근', '단부 보강근']):
    칸(tx0 + c * 1800, wy1, 1800, 600); 표글(m, tx0 + c * 1800 + 900, wy1 - 300)
for r, row in enumerate([['RW1', 'THK300', 'HD13@200', 'HD13@200', '복배근', '-'], ['W1', 'THK200', 'HD10@200', 'HD10@200', '복배근', '4-HD13']]):
    for c, v in enumerate(row):
        칸(tx0 + c * 1800, wy1 - 600 - r * 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, wy1 - 900 - r * 600)

# 층 높이
ly0 = wy1 - 3000
표글('층 높이', tx0 + 2000, ly0 + 800, 450)
for r, (a, b) in enumerate([('지붕층', 'FL+8,100'), ('2층', 'FL+4,200'), ('1층', 'FL±0'), ('지하1층', 'FL-4,200')]):
    칸(tx0, ly0 - r * 600, 1800, 600); 표글(a, tx0 + 900, ly0 - 300 - r * 600)
    칸(tx0 + 1800, ly0 - r * 600, 2200, 600); 표글(b, tx0 + 2900, ly0 - 300 - r * 600)

doc.saveas(출력)
print('ok', 출력)
