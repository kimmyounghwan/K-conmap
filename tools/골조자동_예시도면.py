"""골조 자동 예시 도면 만들기 — python tools/골조자동_예시도면.py [변형] (ezdxf 필요)
   K-건설맵이 그린 «가상» 2층 라멘조 구조도 한 벌입니다. 실제 현장·남의 도면이 아닙니다. (2026-09-27)
   ① 2층 구조평면도 ② 지붕층 구조평면도 ③ 기초 평면도 ④ 부재 일람표(보·기둥·슬래브·기초·벽체) ⑤ 층 높이 표
   ⑥ 철근의 정착·이음 길이표 (2026-09-28 — 값은 KDS 기본식이라 읽어도 물량 같음)
   화면: /jeoksan/auto «🏗 골조 예시» · 시험: node tools/시험_골조자동.mjs (손으로 적은 답과 맞춤)

   변형 'b' (시험용 — 다른 도면 버릇): 보 선이 기둥을 뚫고 이어짐 · 글자가 모두 가로 · 평면 기호에 층 표시(2G1) ·
   보 일람표가 «줄마다 한 부재» · 제목이 영문(2F FRAMING PLAN) · 슬래브 기호 동그라미 없음 · 단위 표시 없음
"""
import sys, os, math
import ezdxf
from ezdxf.enums import TextEntityAlignment as A

변형 = sys.argv[1] if len(sys.argv) > 1 else 'a'
B = 변형 == 'b'
doc = ezdxf.new('R2010', setup=True)
doc.header['$INSUNITS'] = 0 if B else 4
msp = doc.modelspace()
for name, col in [('S-GRID', 1), ('S-COLU', 7), ('S-BEAM', 3), ('S-BEAM-TXT', 2), ('S-SLAB-TXT', 4), ('S-WALL', 5),
                  ('S-FOOT', 6), ('S-DIMS', 8), ('S-TITLE', 7), ('S-TABLE', 7), ('S-TABLE-TXT', 7)]:
    doc.layers.add(name, color=col)
doc.styles.add('KOR', font='malgun.ttf')


def txt(s, x, y, h=250, layer='S-BEAM-TXT', align=A.MIDDLE_CENTER, rot=0):
    if B:
        rot = 0
    t = msp.add_text(s, dxfattribs={'layer': layer, 'height': h, 'style': 'KOR', 'rotation': rot})
    t.set_placement((x, y), align=align)


def line(a, b, layer):
    msp.add_line(a, b, dxfattribs={'layer': layer})


def rect(cx, cy, w, h, layer):
    msp.add_lwpolyline([(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)], close=True, dxfattribs={'layer': layer})


X = [0, 7000, 14000, 21000]
Y = [0, 6000, 12000]
C = 600
h = C / 2


def 평면(ox, oy, 층표, 보이름, 슬래브, 제목, 벽=False):
    """층표: 평면 기호 앞에 붙일 층 표시(변형 b) · 보이름: (바깥 큰보, 안 큰보, 작은보)"""
    G1, G2, B1 = 보이름
    for i, x in enumerate(X):
        line((ox + x, oy - 2500), (ox + x, oy + 14500), 'S-GRID')
        msp.add_circle((ox + x, oy - 3000), 450, dxfattribs={'layer': 'S-GRID'})
        txt('X%d' % (i + 1), ox + x, oy - 3000, 350, 'S-GRID')
    for j, y in enumerate(Y):
        line((ox - 2500, oy + y), (ox + 23500, oy + y), 'S-GRID')
        msp.add_circle((ox - 3000, oy + y), 450, dxfattribs={'layer': 'S-GRID'})
        txt('Y%d' % (j + 1), ox - 3000, oy + y, 350, 'S-GRID')
    for x in X:
        for y in Y:
            rect(ox + x, oy + y, C, C, 'S-COLU')
            txt(층표 + 'C1', ox + x + 550, oy + y + 550, 220, 'S-COLU', A.BOTTOM_LEFT)

    def beam(x0, y0, x1, y1, w, name, 글=True):
        dx, dy = x1 - x0, y1 - y0
        d = math.hypot(dx, dy)
        nx, ny = -dy / d, dx / d
        for s in (-1, 1):
            line((ox + x0 + nx * w / 2 * s, oy + y0 + ny * w / 2 * s), (ox + x1 + nx * w / 2 * s, oy + y1 + ny * w / 2 * s), 'S-BEAM')
        if 글:
            mx, my = (x0 + x1) / 2, (y0 + y1) / 2
            rot = 0 if abs(dy) < 1e-9 else 90
            txt(층표 + name, ox + mx + nx * (w / 2 + 250), oy + my + ny * (w / 2 + 250), 250, 'S-BEAM-TXT', A.MIDDLE_CENTER, rot)

    # 큰보 — a: 기둥 면에서 끊김 · b: 기둥을 뚫고 끝에서 끝까지 한 줄(기호는 칸마다)
    for j, y in enumerate(Y):
        nm, w = (G2, 500) if j == 1 else (G1, 400)
        if B:
            beam(X[0] - h, y, X[3] + h, y, w, nm, 글=False)
            for i in range(3):
                mx = (X[i] + X[i + 1]) / 2
                txt(층표 + nm, ox + mx, oy + y + w / 2 + 250, 250, 'S-BEAM-TXT')
        else:
            for i in range(3):
                beam(X[i] + h, y, X[i + 1] - h, y, w, nm)
    for i, x in enumerate(X):
        nm, w = (G2, 500) if i in (1, 2) else (G1, 400)
        if B:
            beam(x, Y[0] - h, x, Y[2] + h, w, nm, 글=False)
            for j in range(2):
                my = (Y[j] + Y[j + 1]) / 2
                txt(층표 + nm, ox + x - w / 2 - 700, oy + my, 250, 'S-BEAM-TXT')
        else:
            for j in range(2):
                beam(x, Y[j] + h, x, Y[j + 1] - h, w, nm)
    # 작은보 (칸 가운데, 세로) — 큰보 면에서 끊김
    for i in range(3):
        x = (X[i] + X[i + 1]) / 2
        for j in range(2):
            wa = 200 if j == 0 else 250
            wb = 250 if j == 0 else 200
            beam(x, Y[j] + wa, x, Y[j + 1] - wb, 300, B1)
    # 슬래브 기호
    for i in range(3):
        for j in range(2):
            for k in range(2):
                cx = X[i] + 1750 + k * 3500
                cy = (Y[j] + Y[j + 1]) / 2 + 900
                if not B:
                    msp.add_circle((ox + cx, oy + cy), 380, dxfattribs={'layer': 'S-SLAB-TXT'})
                txt(층표 + 슬래브, ox + cx, oy + cy, 250, 'S-SLAB-TXT')
    # 벽 W1 — X4 줄 Y1~Y2 사이(기둥 면에서 면까지), 두께 200
    if 벽:
        x = X[3]
        line((ox + x - 100, oy + Y[0] + h), (ox + x - 100, oy + Y[1] - h), 'S-WALL')
        line((ox + x + 100, oy + Y[0] + h), (ox + x + 100, oy + Y[1] - h), 'S-WALL')
        txt(층표 + 'W1', ox + x - 700, oy + 1800, 250, 'S-WALL', A.MIDDLE_CENTER, 90)
    # 치수 (주석)
    for i in range(3):
        d = msp.add_linear_dim(base=(ox, oy - 1500), p1=(ox + X[i], oy), p2=(ox + X[i + 1], oy), dimstyle='Standard',
                               dxfattribs={'layer': 'S-DIMS'}, override={'dimtxt': 250, 'dimasz': 150, 'dimdec': 0})
        d.render()
    txt(제목, ox + 10500, oy - 5000, 500, 'S-TITLE')
    txt('S=1/100  (가상 예시 — 실제 현장이 아닙니다)', ox + 10500, oy - 5800, 280, 'S-TITLE')


if B:
    평면(0, 0, '2', ('G1', 'G2', 'B1'), 'S1', '2F FRAMING PLAN', 벽=True)
    평면(0, 24000, 'R', ('G1', 'G2', 'B1'), 'S1', 'ROOF FRAMING PLAN')
else:
    평면(0, 0, '', ('G1', 'G2', 'B1'), 'S1', '2층 구조평면도', 벽=True)
    평면(0, 24000, '', ('RG1', 'RG2', 'RB1'), 'RS1', '지붕층 구조평면도')

# ③ 기초 평면도 — 독립기초 F1 2400각 × 12
fx0, fy0 = 32000, 0
for i, x in enumerate(X):
    line((fx0 + x, fy0 - 2500), (fx0 + x, fy0 + 14500), 'S-GRID')
for j, y in enumerate(Y):
    line((fx0 - 2500, fy0 + y), (fx0 + 23500, fy0 + y), 'S-GRID')
for x in X:
    for y in Y:
        rect(fx0 + x, fy0 + y, 2400, 2400, 'S-FOOT')
        rect(fx0 + x, fy0 + y, C, C, 'S-COLU')
        txt('F1', fx0 + x, fy0 + y - 1500, 250, 'S-FOOT')
txt('BASE PLAN' if B else '기초 평면도', fx0 + 10500, fy0 - 5000, 500, 'S-TITLE')

# ④ 부재 일람표
tx0, ty0 = 32000, 40000


def 칸(x0, y0, w, hh):
    msp.add_lwpolyline([(x0, y0), (x0 + w, y0), (x0 + w, y0 - hh), (x0, y0 - hh)], close=True, dxfattribs={'layer': 'S-TABLE'})


def 표글(s, x, y, hh=200):
    t = msp.add_text(s, dxfattribs={'layer': 'S-TABLE-TXT', 'height': hh, 'style': 'KOR'})
    t.set_placement((x, y), align=A.MIDDLE_CENTER)


보들 = [('G1', '400X700', ('4-HD22', '4-HD22'), ('3-HD22', '3-HD22'), ('HD10@150', 'HD10@300'), ''),
      ('G2', '500X750', ('5-HD22', '5-HD22'), ('4-HD22', '4-HD22'), ('HD10@150', 'HD10@250'), '2-HD13'),
      ('B1', '300X600', ('3-HD19', '3-HD19'), ('3-HD19', '3-HD19'), ('HD10@200', 'HD10@200'), '')]
if not B:
    보들 += [('R' + n, s, t, b, st, sk) for (n, s, t, b, st, sk) in 보들]
if B:
    # 줄마다 한 부재: 부호 | B×D | 상부근 | 하부근 | 늑근(단부) | 늑근(중앙) | 복부근
    표글('보 일람표', tx0 + 5000, ty0 + 800, 450)
    머리 = ['부호', 'B×D', '상부근', '하부근', '늑근(단부)', '늑근(중앙)', '복부근']
    for c, m in enumerate(머리):
        칸(tx0 + c * 1600, ty0, 1600, 600)
        표글(m, tx0 + c * 1600 + 800, ty0 - 300)
    for r, (n, s, t, b, st, sk) in enumerate(보들):
        y = ty0 - 600 - r * 600
        for c, v in enumerate([n, s.replace('X', '×'), t[0], b[0], st[0], st[1], sk or '-']):
            칸(tx0 + c * 1600, y, 1600, 600)
            표글(v, tx0 + c * 1600 + 800, y - 300)
else:
    # 부재마다 한 덩이: 맨 위 부호, 그 아래 단부·중앙 두 칸, 줄 머리(왼쪽) B×D · 상부근 · 하부근 · 늑근 · 복부근
    표글('보 일람표 (BEAM LIST)', tx0 + 9000, ty0 + 800, 450)
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

# 기둥 일람표 — 부호 C1, 층 1F~2F
cy0 = ty0 - 5500
표글('기둥 일람표', tx0 + 3000, cy0 + 800, 450)
for c, m in enumerate(['부호', '층', 'SIZE', '주근', '띠철근(단부)', '띠철근(중앙)']):
    칸(tx0 + c * 1800, cy0, 1800, 600); 표글(m, tx0 + c * 1800 + 900, cy0 - 300)
for c, v in enumerate(['C1', '1F~2F', '600X600', '12-HD22', 'HD10@150', 'HD10@300']):
    칸(tx0 + c * 1800, cy0 - 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, cy0 - 900)

# 슬래브 일람표 — 줄마다 한 부재
sy0 = cy0 - 2500
표글('슬래브 일람표', tx0 + 4000, sy0 + 800, 450)
for c, m in enumerate(['부호', '두께', '단변 상부', '단변 하부', '장변 상부', '장변 하부']):
    칸(tx0 + c * 1800, sy0, 1800, 600); 표글(m, tx0 + c * 1800 + 900, sy0 - 300)
for r, n in enumerate(['S1'] + ([] if B else ['RS1'])):
    for c, v in enumerate([n, '150', 'HD10@200', 'HD10@200', 'HD10@250', 'HD10@250']):
        칸(tx0 + c * 1800, sy0 - 600 - r * 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, sy0 - 900 - r * 600)

# 기초 일람표
fy1 = sy0 - 3000
표글('기초 일람표', tx0 + 3500, fy1 + 800, 450)
for c, m in enumerate(['부호', '크기', '두께', '하부근(양방향)']):
    칸(tx0 + c * 1800, fy1, 1800, 600); 표글(m, tx0 + c * 1800 + 900, fy1 - 300)
for c, v in enumerate(['F1', '2400X2400', 'D=700', 'HD19@200']):
    칸(tx0 + c * 1800, fy1 - 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, fy1 - 900)

# 벽체 일람표
wy1 = fy1 - 2500
표글('벽체 일람표', tx0 + 3500, wy1 + 800, 450)
for c, m in enumerate(['부호', '두께', '수직근', '수평근', '배근']):
    칸(tx0 + c * 1800, wy1, 1800, 600); 표글(m, tx0 + c * 1800 + 900, wy1 - 300)
for c, v in enumerate(['W1', 'THK200', 'HD13@200', 'HD10@200', '복배근']):
    칸(tx0 + c * 1800, wy1 - 600, 1800, 600); 표글(v, tx0 + c * 1800 + 900, wy1 - 900)

# ⑤ 층 높이
ly0 = wy1 - 2500
표글('층 높이', tx0 + 2000, ly0 + 800, 450)
for r, (a, b) in enumerate([('지붕층' if not B else 'RF', 'FL+6,900'), ('2층' if not B else '2F', 'FL+3,600'), ('1층' if not B else '1F', 'FL±0')]):
    칸(tx0, ly0 - r * 600, 1800, 600); 표글(a, tx0 + 900, ly0 - 300 - r * 600)
    칸(tx0 + 1800, ly0 - r * 600, 2200, 600); 표글(b, tx0 + 2900, ly0 - 300 - r * 600)

# ⑥ 일반구조사항 — 철근의 정착·이음 길이표 (2026-09-28, 변형 a 만)
#    값은 lib/골조.js 정착표(24, 400) 와 같은 KDS 14 20 52 기본식(10mm 올림) — 읽어도 물량이 바뀌지 않게(시험의 답 그대로)
if not B:
    import math
    지름 = [('D10', 9.53), ('D13', 12.7), ('D16', 15.9), ('D19', 19.1), ('D22', 22.2), ('D25', 25.4)]
    up10 = lambda v: int(math.ceil(v / 10 - 1e-9) * 10)
    ldf = lambda d: max(0.6 * d * 400 / math.sqrt(24), 300)
    줄들 = [('인장 정착', lambda d: up10(ldf(d))), ('인장 이음 (B급)', lambda d: up10(max(ldf(d) * 1.3, 300))),
          ('압축 이음', lambda d: up10(max(0.072 * 400 * d, 300))), ('표준갈고리 정착', lambda d: up10(max(0.24 * d * 400 / math.sqrt(24), 8 * d, 150)))]
    jx0, jy0 = tx0 + 13000, cy0 - 3000
    표글('■ 철근의 정착 및 이음 길이 (SD400 · fck=24MPa · 단위 mm)', jx0 + 4300, jy0 + 800, 350)
    칸(jx0, jy0, 2600, 600); 표글('구 분', jx0 + 1300, jy0 - 300)
    for c, (n, _) in enumerate(지름):
        칸(jx0 + 2600 + c * 1000, jy0, 1000, 600); 표글('H' + n, jx0 + 3100 + c * 1000, jy0 - 300)
    for r, (이름, f) in enumerate(줄들):
        y = jy0 - 600 - r * 600
        칸(jx0, y, 2600, 600); 표글(이름, jx0 + 1300, y - 300)
        for c, (n, d) in enumerate(지름):
            칸(jx0 + 2600 + c * 1000, y, 1000, 600); 표글('{:,}'.format(f(d)), jx0 + 3100 + c * 1000, y - 300)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'public', 'jeoksan', '골조자동_예시.dxf') if not B else sys.argv[2]
doc.saveas(out)
print('ok', out)
