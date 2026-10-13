"""깊은 칸(지하수조) 시험 도면 — python tools/깊은칸_시험도면.py (ezdxf 필요) → tools/시험자료/깊은칸_시험.dxf
   K-건설맵이 그린 «가상» 도면입니다(실제 현장 아님). 시험: node tools/시험_깊은칸.mjs  (G273)
   왼쪽: 가로 단면(안 폭 4,000) · 가운데: 세로 단면(안 폭 10,000) — 레벨 글 «GL -3,400» · «GL -7,350»(글은 선 밑 150) · 벽 300 · 바닥판 600
   오른쪽: 평면 — 벽 층(A-WALL) 두 선 300 으로 둘러싼 안 4,000 × 10,000 방 + 가운데 «지하수조» 글 + 안에 장비 상자(A-EQPM — 평면 재기에서 빠져야 함)
   덤: 단면 · 평면에 «지하수조» 와 다른 크기 방(평면 6,000 × 8,000 — 단면 폭과 안 맞아 빠져야 함)
"""
import os
import ezdxf
from ezdxf.enums import TextEntityAlignment as A
여기 = os.path.dirname(os.path.abspath(__file__))
doc = ezdxf.new('R2010', setup=True)
doc.header['$INSUNITS'] = 4
for n in ('S-WALL', 'S-TEXT', 'A-WALL', 'A-EQPM', 'A-TEXT'): doc.layers.add(n)
m = doc.modelspace()
def ln(a, b, ly): m.add_line(a, b, dxfattribs={'layer': ly})
def tx(s, x, y, ly, h=300):
    t = m.add_text(s, dxfattribs={'layer': ly, 'height': h}); t.set_placement((x, y), align=A.MIDDLE_CENTER)
def 단면(cx, w):
    """안 폭 w · 바닥 −7,350 · 천장(지하1층 바닥) −3,400 위 2,000 까지 · 레벨 글은 왼쪽 6 m"""
    yf, top = -7350, -1400
    l, r = cx - w / 2, cx + w / 2
    ln((l, yf), (r, yf), 'S-WALL')                    # 안 바닥
    ln((l - 300, yf - 600), (r + 300, yf - 600), 'S-WALL')    # 바깥 밑
    ln((l, yf), (l, top), 'S-WALL'); ln((r, yf), (r, top), 'S-WALL')    # 안 벽 면
    ln((l - 300, yf - 600), (l - 300, top), 'S-WALL'); ln((r + 300, yf - 600), (r + 300, top), 'S-WALL')
    ln((l, top), (r, top), 'S-WALL')
    for v in (-3400, -7350):
        ln((cx - w / 2 - 7000, v), (cx - w / 2 - 5000, v), 'S-TEXT')
        tx('GL %s' % format(v, ','), cx - w / 2 - 6000, v - 150, 'S-TEXT', 250)
    tx('지하수조', cx, -4500, 'S-TEXT')
단면(0, 4000)
단면(30000, 10000)
# 평면
px, py = 60000, -10000
def 방(x0, y0, a, b, 이름):
    for d in (0, 300):
        ln((x0 - d, y0 - d), (x0 + a + d, y0 - d), 'A-WALL'); ln((x0 + a + d, y0 - d), (x0 + a + d, y0 + b + d), 'A-WALL')
        ln((x0 + a + d, y0 + b + d), (x0 - d, y0 + b + d), 'A-WALL'); ln((x0 - d, y0 + b + d), (x0 - d, y0 - d), 'A-WALL')
    tx(이름, x0 + a / 2, y0 + b / 2, 'A-TEXT')
방(px, py, 4000, 10000, '지하수조')
# 장비 상자(평면 안 — 재기에서 빠져야)
for (a, b) in [((px + 1200, py + 4300), (px + 2800, py + 4300)), ((px + 2800, py + 4300), (px + 2800, py + 5700)), ((px + 2800, py + 5700), (px + 1200, py + 5700)), ((px + 1200, py + 5700), (px + 1200, py + 4300))]:
    ln(a, b, 'A-EQPM')
방(px + 8000, py, 6000, 8000, '지하수조')
p = os.path.join(여기, '시험자료', '깊은칸_시험.dxf'); doc.saveas(p); print(p)
