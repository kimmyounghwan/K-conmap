"""🏗 G425 철골 예시 도면 — python tools/철골_예시도면.py (ezdxf 필요) → tools/시험자료/철골_예시.dxf
   K-건설맵이 그린 «가상» 철골 캐노피 한 벌입니다. 실제 현장 · 남의 도면이 아닙니다. (2026-10-26)
   ① 2층 구조평면도 — 철골 선(S-STEEL · 기둥 앞 100 틈) · 이름표 SB1 · SG1 · SC1 · 가새(S-STEEL2) · BRACING · PURLIN 글 · STEEL LIST
   ② 골조입면도-1 — 레벨선(CEN) · «1FL ±0 · 1FL +4,000» · x 방향 보 단면 셋(SB1 · SG1 · SG1 — 마지막 칸 3,200 = 평면 3,000 과 다름) · 밑 콘크리트 +200
   시험: node tools/시험_골조자동.mjs (⑬ G425 철골)
"""
import os
import ezdxf

출력 = os.environ.get('OUT', os.path.join(os.path.dirname(__file__), '시험자료', '철골_예시.dxf'))
doc = ezdxf.new('R2010', setup=True)
doc.header['$INSUNITS'] = 4
msp = doc.modelspace()
for name, col in [('S-STEEL', 3), ('S-STEEL2', 3), ('NAME-기둥', 2), ('NAME-보', 2), ('TEXT', 7), ('S-TABLE', 7), ('CEN', 1), ('CON', 7)]:
    doc.layers.add(name, color=col)


def 선(a, b, ly):
    msp.add_line(a, b, dxfattribs={'layer': ly})


def 글(s, x, y, h=200, ly='TEXT'):
    msp.add_text(s, dxfattribs={'layer': ly, 'height': h}).set_placement((x, y))


# ① 2층 구조평면도 — 통심 x 0 · 3000 / y 0 · 3000 · 6000 (보 선은 기둥 · 보 앞 100 에서 멈춤)
for x in (0, 3000):
    선((x, 100), (x, 2900), 'S-STEEL')
    선((x, 3100), (x, 5900), 'S-STEEL')
for y in (0, 3000, 6000):
    선((100, y), (2900, y), 'S-STEEL')
글('SB1', 1300, 150, 200, 'S-STEEL2')
글('SG1', 1300, 3150, 200, 'S-STEEL2')
글('SG1', 1300, 6150, 200, 'S-STEEL2')
for x, dx in ((0, -650), (3000, -400)):
    글('SG1', x + dx, 1500, 200, 'S-STEEL2')
    글('SG1', x + dx, 4500, 200, 'S-STEEL2')
for x in (0, 3000):
    for y in (3000, 6000):
        글('SC1', x + 400, y - 400, 200, 'NAME-기둥')
선((0, 0), (3000, 3000), 'S-STEEL2')
선((3000, 0), (0, 3000), 'S-STEEL2')
글('ROOF BRACING : Φ16(SS275)', 3600, 1500, 200)
글('PURLIN : LC-100x50x20x3.2 @1,000(SSC275)', 3600, 4500, 200)
글('2층 구조평면도', 0, -2500, 500)
# STEEL LIST
TX, TY = 9000, 6000
글('STEEL LIST', TX, TY, 300)
글('기     호', TX, TY - 800, 200)
글('두 께', TX + 3300, TY - 800, 200)
for i, (기, 규) in enumerate((('SB1(SS275)', 'H-200X100X5.5X8'), ('SG1(SM275)', 'H-300X150X6.5X9'), ('SC1(SM275)', 'H-194X150X6X9'))):
    y = TY - 1300 - i * 500
    글(기, TX, y, 200)
    글(규, TX + 2700, y, 200)
for i in range(5):
    선((TX - 200, TY - 500 - i * 500), (TX + 5500, TY - 500 - i * 500), 'S-TABLE')

# ② 골조입면도-1 — 바닥 ±0 을 y = -20000 에 · 1 : 1
EY = -20000
for v in (0, 4000):
    선((-3000, EY + v), (9000, EY + v), 'CEN')
글('1FL ±0', -4500, EY - 300, 200)
글('1st FL', -4500, EY + 120, 200)
글('1FL +4,000', -4500, EY + 4000 - 300, 200)
글('2nd FL', -4500, EY + 4000 + 120, 200)


def H단면(cx, 위, H, B):
    """H 꼴 닫힌 선(12점)"""
    tf, tw = 9, 6
    x0, x1 = cx - B / 2, cx + B / 2
    y1, y0 = 위, 위 - H
    pts = [(x0, y1), (x1, y1), (x1, y1 - tf), (cx + tw / 2, y1 - tf), (cx + tw / 2, y0 + tf), (x1, y0 + tf), (x1, y0), (x0, y0), (x0, y0 + tf),
           (cx - tw / 2, y0 + tf), (cx - tw / 2, y1 - tf), (x0, y1 - tf)]
    msp.add_lwpolyline(pts, close=True, dxfattribs={'layer': 'S-STEEL'})


for cx, 기, H, B in ((0, 'SB1', 200, 100), (3000, 'SG1', 300, 150), (6200, 'SG1', 300, 150)):
    H단면(cx, EY + 3600, H, B)
    글(기, cx + 400, EY + 3600 - H - 450, 200, 'NAME-보')
선((-500, EY + 200), (7000, EY + 200), 'CON')
선((-500, EY - 300), (7000, EY - 300), 'CON')
글('골조입면도-1', 0, EY - 2500, 500)
doc.saveas(출력)
print(출력)
