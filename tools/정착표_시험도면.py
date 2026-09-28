"""정착·이음 길이표 시험 도면 — python tools/정착표_시험도면.py (ezdxf 필요) → tools/시험자료/정착표_*.dxf
   K-건설맵이 그린 «가상» 표입니다(실제 현장·남의 도면 아님). 값은 KDS 14 20 52 기본식을 50mm 로 올린 것 — 모양 시험용.
   시험: node tools/시험_정착표읽기.mjs   (2026-09-28)
   a 가로(지름=열 머리) · 합친 칸 이름 · fck 열 · 선 있음
   b 세로(지름=줄) · 두 단 머리(인장정착 일반/상부 · 인장이음 A급/B급 · 압축이음) · 제목 속 fck
   c 가로 · 안쪽 선 없음(바깥 테두리만) · 이름이 합친 칸 가운데
   d 가로 소표 두 단(fck=24 · fck=27 이 머리 줄 왼쪽) · m 단위(0.47) · 40d 꼴 섞임
   e 가로 · 칸마다 네모(닫힌 폴리선)로 그린 표 + 바로 왼쪽에 붙은 다른 표(슬래브 일람표 «HD10@250») — 이웃 글자가 안 섞이는지
"""
import os, math
import ezdxf
from ezdxf.enums import TextEntityAlignment as A

여기 = os.path.dirname(os.path.abspath(__file__))
D = ['D10', 'D13', 'D16', 'D19', 'D22', 'D25']
db = {'D10': 9.53, 'D13': 12.7, 'D16': 15.9, 'D19': 19.1, 'D22': 22.2, 'D25': 25.4}
up50 = lambda v: int(math.ceil(v / 50 - 1e-9) * 50)
def ld(d, fck, fy=400): return up50(max(0.6 * db[d] * fy / math.sqrt(fck), 300))
def lap(d, fck): return up50(max(1.3 * 0.6 * db[d] * 400 / math.sqrt(fck), 300))
def comp(d, fck): return up50(max(0.25 * db[d] * 400 / math.sqrt(fck), 0.043 * db[d] * 400, 200))
def hook(d, fck): return up50(max(0.24 * db[d] * 400 / math.sqrt(fck), 8 * db[d], 150))
def cl(d): return up50(max(0.072 * 400 * db[d], 300))


def 새():
    doc = ezdxf.new('R2010', setup=True)
    doc.header['$INSUNITS'] = 4
    doc.layers.add('S-TABLE', color=7)
    doc.layers.add('S-TEXT', color=2)
    doc.styles.add('KOR', font='malgun.ttf')
    return doc, doc.modelspace()


def txt(m, s, x, y, h=100):
    t = m.add_text(s, dxfattribs={'layer': 'S-TEXT', 'height': h, 'style': 'KOR'})
    t.set_placement((x, y), align=A.MIDDLE_CENTER)


def ln(m, a, b):
    m.add_line(a, b, dxfattribs={'layer': 'S-TABLE'})


def 저장(doc, 이름):
    p = os.path.join(여기, '시험자료', 이름)
    doc.saveas(p)
    print(p)


# a — 가로 · 합친 칸 · fck 열 · 선
doc, m = 새()
x0, y0, W0, W1, CW, RH = 0, 0, 1800, 700, 700, 300
cols = [x0 + W0 + W1 + CW * i + CW / 2 for i in range(len(D))]
rows = [('인장 정착', 24, ld), ('인장 정착', 27, ld), ('인장 이음 (B급)', 24, lap), ('인장 이음 (B급)', 27, lap), ('압축 정착', None, comp), ('표준갈고리 정착', 24, hook), ('표준갈고리 정착', 27, hook)]
top = y0
txt(m, '■ 철근의 정착 및 이음 길이표 (SD400, 단위 mm)', x0 + 2400, top + 450, 150)
H = RH * (len(rows) + 1)
right = x0 + W0 + W1 + CW * len(D)
for i in range(len(rows) + 2):
    y = top - RH * i
    # 합친 칸: 같은 이름 사이 선은 이름 칸에서 끊김
    if 0 < i < len(rows) + 1 and i > 1 and rows[i - 1][0] == rows[i - 2][0]:
        ln(m, (x0 + W0, y), (right, y))
    else:
        ln(m, (x0, y), (right, y))
for x in [x0, x0 + W0, x0 + W0 + W1] + [x0 + W0 + W1 + CW * i for i in range(1, len(D) + 1)]:
    ln(m, (x, top), (x, top - H))
txt(m, '구 분', x0 + W0 / 2, top - RH / 2)
txt(m, 'fck', x0 + W0 + W1 / 2, top - RH / 2)
for c, d in zip(cols, D):
    txt(m, 'H' + d, c, top - RH / 2)
i = 0
while i < len(rows):
    j = i
    while j + 1 < len(rows) and rows[j + 1][0] == rows[i][0]:
        j += 1
    ymid = top - RH * (1 + (i + j + 1) / 2)
    txt(m, rows[i][0], x0 + W0 / 2, ymid)
    i = j + 1
for r, (이름, fck, f) in enumerate(rows):
    y = top - RH * (r + 1.5)
    txt(m, str(fck) if fck else '공통', x0 + W0 + W1 / 2, y)
    for c, d in zip(cols, D):
        txt(m, f'{f(d, fck or 24):,}', c, y)
저장(doc, '정착표_a.dxf')

# b — 세로 · 두 단 머리 · 제목 fck
doc, m = 새()
x0, top = 0, 0
cw0, cw, rh = 600, 650, 280
heads = [('인장정착', ['일반', '상부']), ('인장이음', ['A급', 'B급']), ('압축이음', [''])]
subs = []
x = x0 + cw0
for 큰, 작들 in heads:
    for 작 in 작들:
        subs.append((큰, 작, x + cw / 2))
        x += cw
right = x
txt(m, '정착 및 이음길이 (fck=27MPa, SD400)', (x0 + right) / 2, top + 350, 140)
ln(m, (x0, top), (right, top))
ln(m, (x0 + cw0, top - rh), (right, top - rh))
ln(m, (x0, top - 2 * rh), (right, top - 2 * rh))
for k in range(len(D)):
    ln(m, (x0, top - rh * (3 + k)), (right, top - rh * (3 + k)))
bottom = top - rh * (2 + len(D))
ln(m, (x0, top), (x0, bottom)); ln(m, (x0 + cw0, top), (x0 + cw0, bottom))
x = x0 + cw0
for 큰, 작들 in heads:
    x_end = x + cw * len(작들)
    ln(m, (x_end, top), (x_end, bottom))
    for k in range(1, len(작들)):
        ln(m, (x + cw * k, top - rh), (x + cw * k, bottom))
    txt(m, 큰, (x + x_end) / 2, top - (rh / 2 if 작들[0] else rh))
    x = x_end
txt(m, '철근', x0 + cw0 / 2, top - rh)
for 큰, 작, cx in subs:
    if 작:
        txt(m, 작, cx, top - rh * 1.5)
fcl = 27
val = {('인장정착', '일반'): ld, ('인장정착', '상부'): lambda d, f: up50(ld(d, f) * 1.3), ('인장이음', 'A급'): lambda d, f: ld(d, f), ('인장이음', 'B급'): lap, ('압축이음', ''): lambda d, f: cl(d)}
for k, d in enumerate(D):
    y = top - rh * (2.5 + k)
    txt(m, d, x0 + cw0 / 2, y)
    for 큰, 작, cx in subs:
        txt(m, str(val[(큰, 작)](d, fcl)), cx, y)
저장(doc, '정착표_b.dxf')

# c — 가로 · 선은 바깥 테두리만 · 이름은 합친 칸 가운데
doc, m = 새()
rows = [('인장정착', ld), ('인장정착', ld), ('인장이음', lap), ('인장이음', lap), ('인장이음', lap)]
fcks = [24, 30, 24, 27, 30]
x0, top = 0, 0
cols = [1600 + 650 * i for i in range(len(D))]
txt(m, '철근 정착·이음 (mm)', 1800, top + 400, 140)
ln(m, (x0 - 200, top), (cols[-1] + 400, top)); ln(m, (x0 - 200, top - 300 * 6.2), (cols[-1] + 400, top - 300 * 6.2))
ln(m, (x0 - 200, top), (x0 - 200, top - 300 * 6.2)); ln(m, (cols[-1] + 400, top), (cols[-1] + 400, top - 300 * 6.2))
for c, d in zip(cols, D):
    txt(m, d, c, top - 200)
txt(m, 'fck', 1000, top - 200)
txt(m, '인장정착', 300, top - 200 - 300 * 1.5)
txt(m, '인장이음', 300, top - 200 - 300 * 4)
for r, ((이름, f), fck) in enumerate(zip(rows, fcks)):
    y = top - 200 - 300 * (r + 1)
    txt(m, str(fck), 1000, y)
    for c, d in zip(cols, D):
        txt(m, str(f(d, fck)), c, y)
저장(doc, '정착표_c.dxf')

# d — 가로 소표 두 단 · m 단위 · 40d
doc, m = 새()
x0, top = 0, 0
cols = [1500 + 650 * i for i in range(len(D))]
txt(m, '■ 인장정착 및 이음 길이', 1800, top + 400, 140)
for bi, fck in enumerate([24, 27]):
    t0 = top - bi * 1300
    txt(m, 'fck=%d' % fck, 500, t0 - 150)
    for c, d in zip(cols, D):
        txt(m, 'SHD' + d[1:], c, t0 - 150)
    txt(m, '인장정착', 500, t0 - 450)
    txt(m, '인장이음', 500, t0 - 750)
    txt(m, '압축이음', 500, t0 - 1050)
    for c, d in zip(cols, D):
        txt(m, '%.2f' % (ld(d, fck) / 1000), c, t0 - 450)
        txt(m, '%.2f' % (lap(d, fck) / 1000), c, t0 - 750)
        txt(m, '40d', c, t0 - 1050)
저장(doc, '정착표_d.dxf')

# e — 칸마다 네모 · 왼쪽에 이웃 표
doc, m = 새()
def 네모(x0, y0, w, h):
    m.add_lwpolyline([(x0, y0), (x0 + w, y0), (x0 + w, y0 - h), (x0, y0 - h)], close=True, dxfattribs={'layer': 'S-TABLE'})
# 이웃(슬래브 일람표 조각)
for r, (a, b) in enumerate([('장변 상부', '장변 하부'), ('HD10@250', 'HD10@250'), ('HD10@250', 'HD10@250')]):
    for c, v in enumerate([a, b]):
        네모(-4200 + c * 1500, 300 - r * 600 + 300, 1500, 600); txt(m, v, -4200 + c * 1500 + 750, 300 - r * 600, 180)
txt(m, '■ 철근의 정착 및 이음 길이 (fck=24MPa)', 3000, 1100, 300)
x0, top = 0, 600
네모(x0, top, 2600, 600); txt(m, '구 분', 1300, top - 300)
for c, d in enumerate(D):
    네모(2600 + c * 1000, top, 1000, 600); txt(m, 'H' + d, 3100 + c * 1000, top - 300)
for r, (이름, f) in enumerate([('인장 정착', ld), ('인장 이음 (B급)', lap), ('표준갈고리 정착', hook)]):
    y = top - 600 - r * 600
    네모(x0, y, 2600, 600); txt(m, 이름, 1300, y - 300)
    for c, d in enumerate(D):
        네모(2600 + c * 1000, y, 1000, 600); txt(m, '{:,}'.format(f(d, 24)), 3100 + c * 1000, y - 300)
저장(doc, '정착표_e.dxf')
