# 도면 PDF 만들기(/tools/dxfpdf) 예시 도면을 만듭니다 — 저장소 맨 위에서: python tools/예시도면_pdf.py  (ezdxf 필요)
# 🧪 도면 PDF 만들기 예시 도면 — 전부 «지어낸» 건물입니다 (남의 공사 도면 아님)
import ezdxf, math
from ezdxf.enums import TextEntityAlignment
doc = ezdxf.new('R2018', setup=True)          # setup: 선 종류·글꼴·치수 유형 기본
doc.header['$INSUNITS'] = 4
doc.header['$LTSCALE'] = 500
msp = doc.modelspace()
L = doc.layers
for nm, c, lt in [('A-GRID', 1, 'CENTER'), ('A-WALL', 4, 'Continuous'), ('A-HATCH', 8, 'Continuous'), ('A-COL', 6, 'Continuous'),
                  ('A-DOOR', 2, 'Continuous'), ('A-WIN', 3, 'Continuous'), ('A-TEXT', 7, 'Continuous'), ('A-DIM', 1, 'Continuous'),
                  ('A-HID', 3, 'HIDDEN'), ('A-FRAME', 7, 'Continuous'), ('A-FURN', 9, 'Continuous'), ('A-EARTH', 8, 'Continuous')]:
    L.add(nm, color=c, linetype=lt)
ds = doc.dimstyles.get('EZDXF')
ds.dxf.dimscale = 100; ds.dxf.dimtxt = 2.5; ds.dxf.dimasz = 2.0; ds.dxf.dimexe = 1.5; ds.dxf.dimexo = 1.5
ds.dxf.dimclrd = 1; ds.dxf.dimclre = 1; ds.dxf.dimclrt = 7; ds.dxf.dimdec = 0; ds.dxf.dimlfac = 1
S = 100                      # 1:100
FW, FH = 420 * S, 297 * S    # A3 도곽

def frame(ox, title, no, scale='1/100'):
    msp.add_lwpolyline([(ox, 0), (ox + FW, 0), (ox + FW, FH), (ox, FH)], close=True, dxfattribs={'layer': 'A-FRAME', 'color': 7})
    m = 10 * S
    msp.add_lwpolyline([(ox + m, m / 2), (ox + FW - m / 2, m / 2), (ox + FW - m / 2, FH - m / 2), (ox + m, FH - m / 2)], close=True,
                       dxfattribs={'layer': 'A-FRAME', 'color': 6, 'const_width': 0.6 * S})
    # 표제란
    x0, x1 = ox + FW - m / 2 - 95 * S, ox + FW - m / 2
    y0 = m / 2
    rows = [0, 10, 18, 26, 34, 50]
    for r in rows[1:]:
        msp.add_line((x0, y0 + r * S), (x1, y0 + r * S), dxfattribs={'layer': 'A-FRAME', 'color': 3})
    msp.add_line((x0, y0), (x0, y0 + 50 * S), dxfattribs={'layer': 'A-FRAME', 'color': 3})
    msp.add_line((x0 + 22 * S, y0), (x0 + 22 * S, y0 + 34 * S), dxfattribs={'layer': 'A-FRAME', 'color': 3})
    def t(x, y, s, h, al=TextEntityAlignment.MIDDLE_LEFT, c=7):
        msp.add_text(s, height=h * S, dxfattribs={'layer': 'A-TEXT', 'color': c}).set_placement((x, y), align=al)
    t(x0 + 2 * S, y0 + 5 * S, '도면번호', 2.2, c=3); t(x0 + 25 * S, y0 + 5 * S, no, 3.5)
    t(x0 + 2 * S, y0 + 14 * S, '축    척', 2.2, c=3); t(x0 + 25 * S, y0 + 14 * S, f'{scale}  (A3)', 3)
    t(x0 + 2 * S, y0 + 22 * S, '날    짜', 2.2, c=3); t(x0 + 25 * S, y0 + 22 * S, '2026. 09.', 3)
    t(x0 + 2 * S, y0 + 30 * S, '도 면 명', 2.2, c=3); t(x0 + 25 * S, y0 + 30 * S, title, 3.5)
    mt = msp.add_mtext('예시 도면 — 가상의 건물\\PK-건설맵 도면 PDF 만들기 시험용', dxfattribs={'layer': 'A-TEXT', 'color': 2, 'char_height': 2.4 * S, 'width': 90 * S})
    mt.set_location((x0 + 47.5 * S, y0 + 42 * S), attachment_point=5)

def dim(p1, p2, base, angle=0):
    msp.add_linear_dim(base=base, p1=p1, p2=p2, angle=angle, dimstyle='EZDXF', dxfattribs={'layer': 'A-DIM'}).render()

# ── 1장: 1층 평면도 ─────────────────────────
ox = 0
frame(ox, '1층 평면도', 'A-101')
gx = [ox + 60 * S + i * 6000 for i in range(5)]      # X1~X5 (6m 간격)
gy = [60 * S + j * 6000 for j in range(4)]           # Y1~Y4
for i, x in enumerate(gx):
    msp.add_line((x, gy[0] - 3000), (x, gy[-1] + 3000), dxfattribs={'layer': 'A-GRID'})
    msp.add_circle((x, gy[-1] + 3000 + 600), 600, dxfattribs={'layer': 'A-GRID', 'color': 7, 'linetype': 'Continuous'})
    msp.add_text(f'X{i+1}', height=500, dxfattribs={'layer': 'A-TEXT'}).set_placement((x, gy[-1] + 3600), align=TextEntityAlignment.MIDDLE_CENTER)
for j, y in enumerate(gy):
    msp.add_line((gx[0] - 3000, y), (gx[-1] + 3000, y), dxfattribs={'layer': 'A-GRID'})
    msp.add_circle((gx[0] - 3600, y), 600, dxfattribs={'layer': 'A-GRID', 'color': 7, 'linetype': 'Continuous'})
    msp.add_text(f'Y{j+1}', height=500, dxfattribs={'layer': 'A-TEXT'}).set_placement((gx[0] - 3600, y), align=TextEntityAlignment.MIDDLE_CENTER)
# 벽 (두께 200) + 벽 해치
def wall(a, b, t=200):
    (x1, y1), (x2, y2) = a, b
    dx, dy = x2 - x1, y2 - y1; d = math.hypot(dx, dy); nx, ny = -dy / d * t / 2, dx / d * t / 2
    pts = [(x1 + nx, y1 + ny), (x2 + nx, y2 + ny), (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)]
    msp.add_lwpolyline(pts, close=True, dxfattribs={'layer': 'A-WALL'})
    h = msp.add_hatch(color=8, dxfattribs={'layer': 'A-HATCH'})
    h.set_pattern_fill('ANSI31', scale=12)
    h.paths.add_polyline_path(pts, is_closed=True)
X, Y = gx, gy
for a, b in [((X[0], Y[0]), (X[4], Y[0])), ((X[4], Y[0]), (X[4], Y[3])), ((X[4], Y[3]), (X[0], Y[3])), ((X[0], Y[3]), (X[0], Y[0])),
             ((X[2], Y[0]), (X[2], Y[2])), ((X[0], Y[2]), (X[2], Y[2])), ((X[3], Y[1]), (X[4], Y[1]))]:
    wall(a, b)
# 기둥 (솔리드 해치)
for x in X:
    for y in Y:
        pts = [(x - 300, y - 300), (x + 300, y - 300), (x + 300, y + 300), (x - 300, y + 300)]
        msp.add_lwpolyline(pts, close=True, dxfattribs={'layer': 'A-COL'})
        h = msp.add_hatch(color=252, dxfattribs={'layer': 'A-COL'}); h.set_solid_fill(color=252); h.paths.add_polyline_path(pts, is_closed=True)
# 문 (호 + 선) — 벽 선 위에 경첩
for (hx, hy, a0) in [(X[1] + 1200, Y[0], 90), (X[2], Y[1] + 1500, 0), (X[1] + 1200, Y[2], 270)]:
    r = 900
    msp.add_arc((hx, hy), r, a0 - 90 if a0 != 0 else 0, a0 if a0 != 0 else 90, dxfattribs={'layer': 'A-DOOR'})
    ang = math.radians(a0 if a0 != 0 else 90)
    msp.add_line((hx, hy), (hx + r * math.cos(ang), hy + r * math.sin(ang)), dxfattribs={'layer': 'A-DOOR'})
# 창 (삼중선)
for x in [X[0] + 1500, X[3] + 1500]:
    for k in (-60, 0, 60):
        msp.add_line((x, Y[3] + k), (x + 2400, Y[3] + k), dxfattribs={'layer': 'A-WIN'})
# 계단
for k in range(12):
    msp.add_line((X[3] + 400, Y[2] + 200 + k * 280), (X[4] - 400, Y[2] + 200 + k * 280), dxfattribs={'layer': 'A-FURN', 'color': 5})
msp.add_line((X[3] + 400, Y[2] + 200), (X[4] - 400, Y[3] - 200), dxfattribs={'layer': 'A-FURN', 'color': 5})
# 상부 캐노피(숨은선)
msp.add_lwpolyline([(X[1], Y[0] - 2500), (X[3], Y[0] - 2500), (X[3], Y[0]), (X[1], Y[0])], dxfattribs={'layer': 'A-HID'})
# 실 이름 · 면적
for (x, y, nm, a) in [((X[0] + X[1]) / 2, (Y[0] + Y[1]) / 2, '사무실', '72.0㎡'), ((X[2] + X[4]) / 2, (Y[0] + Y[1]) / 2, '회의실', '36.0㎡'),
                      ((X[0] + X[2]) / 2, (Y[2] + Y[3]) / 2, '창고', '36.0㎡'), ((X[2] + X[3]) / 2, (Y[1] + Y[3]) / 2, '복도', '')]:
    msp.add_text(nm, height=450, dxfattribs={'layer': 'A-TEXT', 'color': 7}).set_placement((x, y + 300), align=TextEntityAlignment.MIDDLE_CENTER)
    if a: msp.add_text(a, height=300, dxfattribs={'layer': 'A-TEXT', 'color': 2}).set_placement((x, y - 350), align=TextEntityAlignment.MIDDLE_CENTER)
msp.add_text('캐노피 (상부)', height=300, dxfattribs={'layer': 'A-TEXT', 'color': 3}).set_placement(((X[1] + X[3]) / 2, Y[0] - 1500), align=TextEntityAlignment.MIDDLE_CENTER)
# 치수
for i in range(4): dim((X[i], Y[3]), (X[i + 1], Y[3]), (X[0], Y[3] + 1800))
dim((X[0], Y[3]), (X[4], Y[3]), (X[0], Y[3] + 2600))
for j in range(3): dim((X[4], Y[j]), (X[4], Y[j + 1]), (X[4] + 1800, Y[0]), angle=90)
# 방위표
cx, cy = ox + 360 * S, 250 * S
msp.add_circle((cx, cy), 1500, dxfattribs={'layer': 'A-TEXT', 'color': 7})
h = msp.add_hatch(color=7); h.set_solid_fill(color=7); h.paths.add_polyline_path([(cx, cy + 1500), (cx + 500, cy - 800), (cx, cy - 300)], is_closed=True)
msp.add_text('N', height=600, dxfattribs={'layer': 'A-TEXT'}).set_placement((cx, cy + 2200), align=TextEntityAlignment.MIDDLE_CENTER)
msp.add_text('1층 평면도  S=1/100', height=600, dxfattribs={'layer': 'A-TEXT', 'color': 7}).set_placement((X[0], 25 * S), align=TextEntityAlignment.MIDDLE_LEFT)

# ── 2장: 단면 상세도 ─────────────────────────
ox = FW
frame(ox, '벽체 단면 상세도', 'A-501', '1/40')
S2 = 20
bx, by = ox + 110 * S, 120 * S
K5 = 2.5                     # 상세를 1:100 도곽에 2.5배로 그림 = 1:40
def P(x, y): return (bx + x * K5, by + y * K5)
def rect(x0, y0, w, h, layer, color=None):
    pts = [P(x0, y0), P(x0 + w, y0), P(x0 + w, y0 + h), P(x0, y0 + h)]
    msp.add_lwpolyline(pts, close=True, dxfattribs={'layer': layer, **({'color': color} if color else {})})
    return pts
earth = rect(-2000, -3000, 9000, 2400, 'A-EARTH')
h = msp.add_hatch(color=8, dxfattribs={'layer': 'A-EARTH'}); h.set_pattern_fill('EARTH', scale=150); h.paths.add_polyline_path(earth, is_closed=True)
grav = rect(-200, -600, 2400, 300, 'A-EARTH')
h = msp.add_hatch(color=8); h.set_pattern_fill('GRAVEL', scale=100); h.paths.add_polyline_path(grav, is_closed=True)
ftg = rect(0, -300, 2000, 600, 'A-WALL')
h = msp.add_hatch(color=8); h.set_pattern_fill('AR-CONC', scale=5); h.paths.add_polyline_path(ftg, is_closed=True)
wl = rect(800, 300, 300, 3300, 'A-WALL')
h = msp.add_hatch(color=8); h.set_pattern_fill('AR-CONC', scale=5); h.paths.add_polyline_path(wl, is_closed=True)
sl = rect(1100, 3300, 4500, 300, 'A-WALL')
h = msp.add_hatch(color=8); h.set_pattern_fill('ANSI31', scale=60); h.paths.add_polyline_path(sl, is_closed=True)
msp.add_lwpolyline([P(1150, 300), P(1150, 3300)], dxfattribs={'layer': 'A-WALL', 'color': 2, 'const_width': 100 * K5})
msp.add_line(P(760, 300), P(760, 3600), dxfattribs={'layer': 'A-HID'})
for (y, t_) in [(300, 'FL ±0'), (3600, 'FL +3,300'), (-600, '기초 저면 -900')]:
    msp.add_line(P(-1500, y), P(600, y), dxfattribs={'layer': 'A-DIM', 'color': 1})
    msp.add_text(t_, height=60 * K5, dxfattribs={'layer': 'A-TEXT', 'color': 7}).set_placement(P(-1500, y + 30), align=TextEntityAlignment.BOTTOM_LEFT)
for (y, t_) in [(2000, 'THK 100 압출법 단열재'), (1200, 'THK 300 철근콘크리트 벽'), (0, 'THK 600 기초 (fck 24MPa)'), (-450, '잡석 다짐 THK 300')]:
    msp.add_line(P(950, y), P(2800, y + 400), dxfattribs={'layer': 'A-DIM', 'color': 1})
    msp.add_text(t_, height=55 * K5, dxfattribs={'layer': 'A-TEXT', 'color': 7}).set_placement(P(2850, y + 400), align=TextEntityAlignment.MIDDLE_LEFT)
ds2 = doc.dimstyles.duplicate_entry('EZDXF', 'D20'); ds2.dxf.dimscale = 100; ds2.dxf.dimlfac = 1 / K5
for (p1, p2, base, ang) in [((800, 300), (1100, 300), (0, 4200), 0), ((0, -300), (2000, -300), (0, -1200), 0),
                             ((800, 300), (800, 3600), (-1000, 0), 90)]:
    msp.add_linear_dim(base=P(*base), p1=P(*p1), p2=P(*p2), angle=ang, dimstyle='D20', dxfattribs={'layer': 'A-DIM'}).render()
msp.add_text('벽체 단면 상세도  S=1/40', height=600, dxfattribs={'layer': 'A-TEXT', 'color': 7}).set_placement((ox + 60 * S, 25 * S), align=TextEntityAlignment.MIDDLE_LEFT)
doc.saveas('web/public/tools/files/ex-drawing-pdf.dxf')
print('ok')
