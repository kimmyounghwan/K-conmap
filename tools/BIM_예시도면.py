"""BIM 물량 예시 도면 만들기 — python tools/BIM_예시도면.py [저장할 곳] (ezdxf 필요)
   K-건설맵이 그린 «가상» 3층 라멘조 구조도 한 벌입니다. 실제 현장·남의 도면이 아닙니다. (2026-10-10 · G225)
   ① 2층 · 3층 · 지붕층 구조평면도 ② 기초 평면도 ③ 부재 일람표(보·기둥·슬래브·기초·벽체) ④ 층 높이 표
   골조 자동 예시(골조자동_예시도면.py)와 같은 버릇으로 그리되 — 칸 넓이가 서로 다르고(6.0 · 7.2 · 6.0 m / 6.0 · 7.5 m),
   3층 기둥은 크기가 작아지고(C1 600 → C2 500), 지붕 슬래브 두께가 다르고(150 → 180), 층고가 4.2 · 3.6 · 3.6 m 입니다.
   화면: /jeoksan/bim «🏢 예시» · 시험: node tools/시험_BIM물량.mjs (손으로 적은 답과 맞춤)
"""
import sys, os, math
import ezdxf
from ezdxf.enums import TextEntityAlignment as A

출력 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'public', 'jeoksan', 'BIM_예시_3층.dxf')
# 시험용 SPLIT=폴더 — 평면마다 따로 된 파일(자리도 제각각 · 지붕층은 통심 기호 없음 · 기초는 원래 없음) → 층 맞춤(통심 · 기둥 겹치기) 시험
나눔 = os.environ.get('SPLIT', '')


def 새도면():
    global doc, msp
    doc = ezdxf.new('R2010', setup=True)
    doc.header['$INSUNITS'] = 4
    msp = doc.modelspace()
    for name, col in [('S-GRID', 1), ('S-COLU', 7), ('S-BEAM', 3), ('S-BEAM-TXT', 2), ('S-SLAB-TXT', 4), ('S-WALL', 5),
                      ('S-FOOT', 6), ('S-DIMS', 8), ('S-TITLE', 7), ('S-TABLE', 7), ('S-TABLE-TXT', 7)]:
        doc.layers.add(name, color=col)
    doc.styles.add('KOR', font='malgun.ttf')


새도면()


def txt(s, x, y, h=250, layer='S-BEAM-TXT', align=A.MIDDLE_CENTER, rot=0):
    t = msp.add_text(s, dxfattribs={'layer': layer, 'height': h, 'style': 'KOR', 'rotation': rot})
    t.set_placement((x, y), align=align)


def line(a, b, layer):
    msp.add_line(a, b, dxfattribs={'layer': layer})


def rect(cx, cy, w, h, layer):
    msp.add_lwpolyline([(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)], close=True, dxfattribs={'layer': layer})


X = [0, 6000, 13200, 19200]
Y = [0, 6000, 13500]
GX, GY = X[-1], Y[-1]


def 평면(ox, oy, 기둥, 기둥폭, 보이름, 슬래브, 제목, 벽=False, 기호=True):
    """보이름: (바깥 큰보, 안 큰보, 작은보) · 기둥폭: 이 평면에 그린 기둥 크기(보는 기둥 면에서 끊김) · 기호=False 면 통심 기호(원 · 글자) 없이"""
    G1, G2, B1 = 보이름
    h = 기둥폭 / 2
    for i, x in enumerate(X):
        line((ox + x, oy - 2500), (ox + x, oy + GY + 2500), 'S-GRID')
        if 기호:
            msp.add_circle((ox + x, oy - 3000), 450, dxfattribs={'layer': 'S-GRID'})
            txt('X%d' % (i + 1), ox + x, oy - 3000, 350, 'S-GRID')
            # 위쪽 끝에도 기호(도면마다 버릇) — 같은 줄을 두 번 세지 않는지 시험
            msp.add_circle((ox + x, oy + GY + 3000), 450, dxfattribs={'layer': 'S-GRID'})
            txt('X%d' % (i + 1), ox + x, oy + GY + 3000, 350, 'S-GRID')
    for j, y in enumerate(Y):
        line((ox - 2500, oy + y), (ox + GX + 2500, oy + y), 'S-GRID')
        if 기호:
            msp.add_circle((ox - 3000, oy + y), 450, dxfattribs={'layer': 'S-GRID'})
            txt('Y%d' % (j + 1), ox - 3000, oy + y, 350, 'S-GRID')
    for x in X:
        for y in Y:
            if not os.environ.get('NOCOL'):        # 시험용 NOCOL=1 — 기둥 네모를 안 그림(기호 글자만) → 통심 교점에 세우는지
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
    # 큰보 (가로) — Y2 줄은 안 큰보(G2) · 기둥 면에서 끊김
    for j, y in enumerate(Y):
        nm = G2 if j == 1 else G1
        for i in range(3):
            beam(X[i] + h, y, X[i + 1] - h, y, 폭[nm], nm)
    # 큰보 (세로) — X2 · X3 줄은 G2
    for i, x in enumerate(X):
        nm = G2 if i in (1, 2) else G1
        for j in range(2):
            beam(x, Y[j] + h, x, Y[j + 1] - h, 폭[nm], nm)
    # 작은보 B1 (칸 가운데, 세로) — 큰보 면에서 끊김
    반 = {0: 200, 1: 250, 2: 200}       # Y1 · Y3 = G1 반폭 200 · Y2 = G2 반폭 250
    for i in range(3):
        x = (X[i] + X[i + 1]) / 2
        for j in range(2):
            beam(x, Y[j] + 반[j], x, Y[j + 1] - 반[j + 1], 300, B1)
    # 슬래브 기호 — 칸마다 작은보로 나뉜 두 판
    for i in range(3):
        반칸 = (X[i + 1] - X[i]) / 2
        for j in range(2):
            for k in range(2):
                cx = X[i] + 반칸 / 2 + k * 반칸
                cy = (Y[j] + Y[j + 1]) / 2 + 900
                msp.add_circle((ox + cx, oy + cy), 380, dxfattribs={'layer': 'S-SLAB-TXT'})
                txt(슬래브, ox + cx, oy + cy, 250, 'S-SLAB-TXT')
    # 벽 W1 — X4 줄 Y1~Y2 사이(기둥 면에서 면까지), 두께 200
    if 벽:
        x = X[3]
        line((ox + x - 100, oy + Y[0] + h), (ox + x - 100, oy + Y[1] - h), 'S-WALL')
        line((ox + x + 100, oy + Y[0] + h), (ox + x + 100, oy + Y[1] - h), 'S-WALL')
        txt('W1', ox + x - 700, oy + 2200, 250, 'S-WALL', A.MIDDLE_CENTER, 90)
    for i in range(3):
        d = msp.add_linear_dim(base=(ox, oy - 1500), p1=(ox + X[i], oy), p2=(ox + X[i + 1], oy), dimstyle='Standard',
                               dxfattribs={'layer': 'S-DIMS'}, override={'dimtxt': 250, 'dimasz': 150, 'dimdec': 0})
        d.render()
    txt(제목, ox + GX / 2, oy - 5000, 500, 'S-TITLE')
    txt('S=1/100  (가상 예시 — 실제 현장이 아닙니다)', ox + GX / 2, oy - 5800, 280, 'S-TITLE')


간격 = 28000
# 시험용 JUSIM=파일 — 실제 도면 버릇: 층마다 «주심도»(기둥만 · 세로 통심 기호만) + «구조평면도»(보 · 슬래브 · 벽만 · 기둥 기호 없음)
#   기호 원은 «X» 와 작은 «1» 두 글자 · 통심선 끝에서 9 m 떨어짐(사이에 치수선) · 평면들은 옆으로 60 m 씩, 주심도 줄과 구조평면도 줄은 100 m 떨어짐
주심 = os.environ.get('JUSIM', '')


def 두글기호(cx, cy, 글, 수):
    msp.add_circle((cx, cy), 675, dxfattribs={'layer': 'DIM'})
    txt(글, cx - 164, cy - 183 + 275, 550, 'DIM', A.MIDDLE_CENTER)
    txt(수, cx + 294, cy - 219 + 165, 330, 'DIM', A.MIDDLE_CENTER)


def 먼통심(ox, oy, 세로만=False):
    for i, x in enumerate(X):
        line((ox + x, oy - 1500), (ox + x, oy + GY + 1500), 'S-GRID')
        두글기호(ox + x, oy + GY + 1500 + 9000, 'X', str(i + 1))
        line((ox + x, oy + GY + 1500 + 9000 - 675), (ox + x, oy + GY + 1500 + 9000 - 675 - 321), 'DIM')
    for j, y in enumerate(Y):
        line((ox - 1500, oy + y), (ox + GX + 1500, oy + y), 'S-GRID')
        if not 세로만:
            두글기호(ox - 1500 - 9000, oy + y, 'Y', str(j + 1))


if 주심:
    for k, (층글, 기둥, 기둥폭) in enumerate([('1층', 'C1', 600), ('2층', 'C1', 600), ('3층', 'C2', 500)]):
        ox, oy = k * 60000, 0
        먼통심(ox, oy, 세로만=True)
        for x in X:
            for y in Y:
                rect(ox + x, oy + y, 기둥폭, 기둥폭, 'S-COLU')
                txt(기둥, ox + x + 기둥폭 / 2 + 250, oy + y + 기둥폭 / 2 + 250, 220, 'S-COLU', A.BOTTOM_LEFT)
        txt(층글 + ' 주심도', ox + GX / 2, oy - 5000, 500, 'S-TITLE')
    for k, (층글, 보이름, 슬래브, 기둥폭, 벽) in enumerate([('2층', ('G1', 'G2', 'B1'), 'S1', 600, True), ('3층', ('G1', 'G2', 'B1'), 'S1', 600, True), ('지붕층', ('RG1', 'RG2', 'RB1'), 'RS1', 500, False)]):
        ox, oy = k * 60000, 100000
        먼통심(ox, oy)
        h = 기둥폭 / 2
        G1, G2, B1 = 보이름

        def beam(x0, y0, x1, y1, w, name):
            dx, dy = x1 - x0, y1 - y0
            d = math.hypot(dx, dy)
            nx, ny = -dy / d, dx / d
            for sg in (-1, 1):
                line((ox + x0 + nx * w / 2 * sg, oy + y0 + ny * w / 2 * sg), (ox + x1 + nx * w / 2 * sg, oy + y1 + ny * w / 2 * sg), 'S-BEAM')
            mx, my = (x0 + x1) / 2, (y0 + y1) / 2
            txt(name, ox + mx + nx * (w / 2 + 250), oy + my + ny * (w / 2 + 250), 250, 'S-BEAM-TXT', A.MIDDLE_CENTER, 0 if abs(dy) < 1e-9 else 90)
        for x in X:
            for y in Y:
                rect(ox + x, oy + y, 기둥폭, 기둥폭, 'S-COLU')       # 기둥 네모는 있으나 기호 글자는 없음(주심도에)
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
                beam(x, Y[j] + 반[j], x, Y[j + 1] - 반[j + 1], 300, B1)
        for i in range(3):
            반칸 = (X[i + 1] - X[i]) / 2
            for j in range(2):
                for kk in range(2):
                    cx = X[i] + 반칸 / 2 + kk * 반칸
                    cy = (Y[j] + Y[j + 1]) / 2 + 900
                    msp.add_circle((ox + cx, oy + cy), 380, dxfattribs={'layer': 'S-SLAB-TXT'})
                    txt(슬래브, ox + cx, oy + cy, 250, 'S-SLAB-TXT')
        if 벽:
            x = X[3]
            line((ox + x - 100, oy + Y[0] + h), (ox + x - 100, oy + Y[1] - h), 'S-WALL')
            line((ox + x + 100, oy + Y[0] + h), (ox + x + 100, oy + Y[1] - h), 'S-WALL')
            txt('W1', ox + x - 700, oy + 2200, 250, 'S-WALL', A.MIDDLE_CENTER, 90)
        txt(층글 + ' 구조평면도', ox + GX / 2, oy - 5000, 500, 'S-TITLE')
elif 나눔:
    os.makedirs(나눔, exist_ok=True)
    평면(12345, -6789, 'C1', 600, ('G1', 'G2', 'B1'), 'S1', '2층 구조평면도', 벽=True)
    doc.saveas(os.path.join(나눔, 'S-101_2층.dxf')); 새도면()
    평면(-50000, 3000, 'C1', 600, ('G1', 'G2', 'B1'), 'S1', '3층 구조평면도', 벽=True)
    doc.saveas(os.path.join(나눔, 'S-102_3층.dxf')); 새도면()
    평면(777, 888, 'C2', 500, ('RG1', 'RG2', 'RB1'), 'RS1', '지붕층 구조평면도', 기호=False)
    doc.saveas(os.path.join(나눔, 'S-103_지붕.dxf')); 새도면()
else:
    평면(0, 0, 'C1', 600, ('G1', 'G2', 'B1'), 'S1', '2층 구조평면도', 벽=True)
    평면(0, 간격, 'C1', 600, ('G1', 'G2', 'B1'), 'S1', '3층 구조평면도', 벽=True)
    평면(0, 간격 * 2, 'C2', 500, ('RG1', 'RG2', 'RB1'), 'RS1', '지붕층 구조평면도')

# 기초 평면도 — 독립기초 F1 2600각 × 12
fx0, fy0 = (-3000, 41000) if 나눔 else ((180000, 0) if 주심 else (34000, 0))
for x in X:
    line((fx0 + x, fy0 - 2500), (fx0 + x, fy0 + GY + 2500), 'S-GRID')
for y in Y:
    line((fx0 - 2500, fy0 + y), (fx0 + GX + 2500, fy0 + y), 'S-GRID')
for x in X:
    for y in Y:
        rect(fx0 + x, fy0 + y, 2600, 2600, 'S-FOOT')
        rect(fx0 + x, fy0 + y, 600, 600, 'S-COLU')
        txt('F1', fx0 + x, fy0 + y - 1600, 250, 'S-FOOT')
txt('기초 평면도', fx0 + GX / 2, fy0 - 5000, 500, 'S-TITLE')
if 나눔:
    doc.saveas(os.path.join(나눔, 'S-104_기초.dxf')); 새도면()

# 부재 일람표
tx0, ty0 = (180000, 72000) if 주심 else (34000, 72000)


def 칸(x0, y0, w, hh):
    msp.add_lwpolyline([(x0, y0), (x0 + w, y0), (x0 + w, y0 - hh), (x0, y0 - hh)], close=True, dxfattribs={'layer': 'S-TABLE'})


def 표글(s, x, y, hh=200):
    t = msp.add_text(s, dxfattribs={'layer': 'S-TABLE-TXT', 'height': hh, 'style': 'KOR'})
    t.set_placement((x, y), align=A.MIDDLE_CENTER)


보들 = [('G1', '400X700', ('4-HD22', '4-HD22'), ('3-HD22', '3-HD22'), ('HD10@150', 'HD10@300'), ''),
      ('G2', '500X800', ('5-HD25', '5-HD25'), ('4-HD25', '4-HD25'), ('HD10@150', 'HD10@250'), '2-HD13'),
      ('B1', '300X600', ('3-HD19', '3-HD19'), ('3-HD19', '3-HD19'), ('HD10@200', 'HD10@200'), ''),
      ('RG1', '400X650', ('4-HD22', '4-HD22'), ('3-HD22', '3-HD22'), ('HD10@150', 'HD10@300'), ''),
      ('RG2', '500X750', ('5-HD22', '5-HD22'), ('4-HD22', '4-HD22'), ('HD10@150', 'HD10@250'), '2-HD13'),
      ('RB1', '300X550', ('3-HD19', '3-HD19'), ('3-HD19', '3-HD19'), ('HD10@200', 'HD10@200'), '')]
표글('보 일람표 (BEAM LIST)', tx0 + 10000, ty0 + 800, 450)
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

# 기둥 일람표 — C1 1F~2F · C2 3F
cy0 = ty0 - 5500
표글('기둥 일람표', tx0 + 3000, cy0 + 800, 450)
for c, m in enumerate(['부호', '층', 'SIZE', '주근', '띠철근(단부)', '띠철근(중앙)']):
    칸(tx0 + c * 1800, cy0, 1800, 600); 표글(m, tx0 + c * 1800 + 900, cy0 - 300)
for r, row in enumerate([['C1', '1F~2F', '600X600', '12-HD22', 'HD10@150', 'HD10@300'], ['C2', '3F', '500X500', '8-HD22', 'HD10@150', 'HD10@300']]):
    for c, v in enumerate(row):
        칸(tx0 + c * 1800, cy0 - 600 - r * 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, cy0 - 900 - r * 600)

# 슬래브 일람표
sy0 = cy0 - 3000
표글('슬래브 일람표', tx0 + 4000, sy0 + 800, 450)
for c, m in enumerate(['부호', '두께', '단변 상부', '단변 하부', '장변 상부', '장변 하부']):
    칸(tx0 + c * 1800, sy0, 1800, 600); 표글(m, tx0 + c * 1800 + 900, sy0 - 300)
for r, (n, t) in enumerate([('S1', '150'), ('RS1', '180')]):
    for c, v in enumerate([n, t, 'HD10@200', 'HD10@200', 'HD10@250', 'HD10@250']):
        칸(tx0 + c * 1800, sy0 - 600 - r * 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, sy0 - 900 - r * 600)

# 기초 일람표
fy1 = sy0 - 3000
표글('기초 일람표', tx0 + 3500, fy1 + 800, 450)
for c, m in enumerate(['부호', '크기', '두께', '하부근(양방향)']):
    칸(tx0 + c * 1800, fy1, 1800, 600); 표글(m, tx0 + c * 1800 + 900, fy1 - 300)
for c, v in enumerate(['F1', '2600X2600', 'D=800', 'HD22@200']):
    칸(tx0 + c * 1800, fy1 - 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, fy1 - 900)

# 벽체 일람표
wy1 = fy1 - 2500
표글('벽체 일람표', tx0 + 3500, wy1 + 800, 450)
for c, m in enumerate(['부호', '두께', '수직근', '수평근', '배근']):
    칸(tx0 + c * 1800, wy1, 1800, 600); 표글(m, tx0 + c * 1800 + 900, wy1 - 300)
for c, v in enumerate(['W1', 'THK200', 'HD13@200', 'HD10@200', '복배근']):
    칸(tx0 + c * 1800, wy1 - 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, wy1 - 900)

# 층 높이
ly0 = wy1 - 2500
표글('층 높이', tx0 + 2000, ly0 + 800, 450)
for r, (a, b) in enumerate([('지붕층', 'FL+11,400'), ('3층', 'FL+7,800'), ('2층', 'FL+4,200'), ('1층', 'FL±0')]):
    칸(tx0, ly0 - r * 600, 1800, 600); 표글(a, tx0 + 900, ly0 - 300 - r * 600)
    칸(tx0 + 1800, ly0 - r * 600, 2200, 600); 표글(b, tx0 + 2900, ly0 - 300 - r * 600)

if 나눔:
    출력 = os.path.join(나눔, 'S-105_일람표.dxf')
if 주심:
    출력 = 주심
doc.saveas(출력)
print('ok', 출력)
