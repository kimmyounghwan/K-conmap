"""계단 시험 도면 — python tools/계단_시험도면.py (ezdxf 필요) → tools/시험자료/계단_시험.dxf
   K-건설맵이 그린 «가상» 도면입니다(실제 현장 아님). 시험: node tools/시험_계단.mjs  (G274)
   왼쪽: «■ 계단 일람표» — ST1 칸(철근 글 (B) · (T) · (T&B) · «3EA-HD13» 끝 보강 · «THK = 160» · 단면 그림 챌판 170 × 10 · 디딤 270) · ST2 칸(«HD16@200» 하나)
         일반사항 꼴 제목 «8.3 계단배근 상세» 곁 «SS9» 는 일람이 아님
   오른쪽: 평면 — 계단판 둘(폭 1,200 · 길이 2,700 · 2,400 · 대각선 하나) · 위 벽 면까지 1,500(중간참) · 아래 벽 면까지 1,000 · 1,300 · «ST1» 글
         개구부(네모 + 대각선 둘 «X») 곁 «SS2» 는 계단판 아님
"""
import os
import ezdxf
from ezdxf.enums import TextEntityAlignment as A
여기 = os.path.dirname(os.path.abspath(__file__))
doc = ezdxf.new('R2010', setup=True)
doc.header['$INSUNITS'] = 4
for n in ('S-TABLE', 'S-TEXT', 'S-STAIR', 'S-BAR', 'S-WALL', 'S-OPEN'): doc.layers.add(n)
m = doc.modelspace()
def ln(a, b, ly): m.add_line(a, b, dxfattribs={'layer': ly})
def tx(s, x, y, ly='S-TEXT', h=90):
    t = m.add_text(s, dxfattribs={'layer': ly, 'height': h}); t.set_placement((x, y), align=A.MIDDLE_LEFT)
# ── 일람표
tx('■ 계단 일람표', 0, 300, h=180)
for x in (0, 10000, 20000): ln((x, 0), (x, -16000), 'S-TABLE')
ln((0, 0), (20000, 0), 'S-TABLE'); ln((0, -800), (20000, -800), 'S-TABLE'); ln((0, -16000), (20000, -16000), 'S-TABLE')
tx('ST1', 4800, -400, h=150)
tx('ST2', 14800, -400, h=150)
for s, x, y in [('HD13@150(B)', 3000, -3000), ('HD13 @200(T)', 3000, -3300), ('HD10@250(T&B)', 6000, -3000), ('HD13@150(T&B)', 8000, -3000), ('HD13@150(T&B)', 8000, -3300),
                ('3EA-HD13(T&B)', 2000, -5000), ('THK = 160', 5000, -9000)]:
    tx(s, x, y)
tx('HD16@200', 14000, -3000)
# ST1 단면 — 계단 꼴 선(챌판 170 × 10 · 디딤 270 × 9) + 밑면 빗선
x, y = 1000, -14000
pts = [(x, y)]
for i in range(10):
    y += 170; pts.append((x, y))
    if i < 9: x += 270; pts.append((x, y))
for a, b in zip(pts, pts[1:]): ln(a, b, 'S-STAIR')
ln((1000 + 190, -14000 - 300), (1000 + 190 + 2430, -14000 - 300 + 1530), 'S-STAIR')
# 일반사항 꼴(번호 붙은 제목) — 일람 아님
tx('8.3 계단배근 상세', 0, -30000, h=180)
tx('SS9', 2000, -30500, h=150)
tx('HD13@200(T)', 2000, -32000)
# ── 평면
ox = 40000
def 판(x0, y0, x1, y1, 대각=1):
    for a, b in [((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))]: ln(a, b, 'S-STAIR' if 대각 == 1 else 'S-OPEN')
    ln((x0, y0), (x1, y1), 'S-STAIR' if 대각 == 1 else 'S-OPEN')
    if 대각 == 2: ln((x0, y1), (x1, y0), 'S-OPEN')
판(ox, 0, ox + 1200, 2700)
판(ox + 1200, 300, ox + 2400, 2700)
ln((ox - 200, 4200), (ox + 2600, 4200), 'S-WALL')          # 위 벽 면(중간참 1,500)
ln((ox - 200, -1000), (ox + 2600, -1000), 'S-WALL')        # 아래 벽 면(왼 1,000 · 오 1,300)
tx('ST1', ox + 400, 1500, h=200)
판(ox + 6000, 0, ox + 7200, 2400, 대각=2)
tx('SS2', ox + 6300, 1200, h=200)
p = os.path.join(여기, '시험자료', '계단_시험.dxf'); doc.saveas(p); print(p)
