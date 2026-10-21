# -*- coding: utf-8 -*-
"""
⚡ 도면 물량 자동(/jeoksan/auto) «다른 예시 세 벌» 시험 도면 — K-건설맵이 지어낸 «가상» 도면 (2026-10-21)
    python3 tools/자동적산_시험도면.py  →  tools/시험자료/자동적산_A.dxf · _B.dxf · _C.dxf · _C_내역.xlsx · 자동적산_답.json

사이트에 딸린 예시(토목_예시 · 마감_예시)와 «다른» 도면 버릇으로:
  A 토목(m · 두 장 — 횡단면도 + 평면도) : 측점 간격이 고르지 않음(0+052.500) · 표를 한 줄 목록으로 · 철근 재료표 길이(mm)·총길이(m) 섞임 · D 규격 ·
               호(ARC)·볼록(bulge) 섞인 관로 · 현황(기존) 레이어 · 위치도(0.1배 사본)
  B 건축(mm) : 실 6개(ㄱ자 아닌 모따기 방 포함) · 실내재료마감표(화장실 둘을 한 줄로) · 창호일람표 수량이 평면과 다른 것 하나 · SD(유리문)
  C 조경(mm) : 원 · 반원 끝 포장 · 돌린 블록 · 묶음 블록(수목군 안의 이팝나무) · 부품 블록(보안등 안의 등기구) · MINSERT(볼라드 2×3) ·
               범례 블록(수목 기호 — 물량 아님) · 위치도(0.05배) · 수량표 + 가상 내역서(빈 수량 칸)
답(자동적산_답.json)은 이 파일이 «만든 값» 으로 손셈한 것 — 시험(tools/시험_자동적산.mjs)이 사이트 셈과 맞춰 봄.
도면을 다시 읽어 따로 잰 값은 tools/자동적산_답셈.py(ezdxf · shapely)가 맞춰 봅니다.
"""
import json
import math
import os
import ezdxf
from ezdxf.enums import TextEntityAlignment
from openpyxl import Workbook

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '시험자료')
os.makedirs(OUT, exist_ok=True)
답 = {}
KG = {'D10': 0.560, 'D13': 0.995, 'D16': 1.56, 'D19': 2.25, 'D22': 3.04, 'D25': 3.98, 'D29': 5.04, 'D32': 6.23}


def 새도면(단위):
    doc = ezdxf.new('R2010', setup=True)
    doc.header['$INSUNITS'] = 단위
    doc.header['$MEASUREMENT'] = 1
    return doc


# ═══════════════════════════════════════════════ A 토목 (m)
doc = 새도면(6)
msp = doc.modelspace()
for n in ['C-글자', 'C-표', 'C-단면', '우수관-계획', 'L형측구', '경계석', '아스콘포장', '기존-우수관', 'C-맨홀', 'C-빗물받이', 'C-가로등', 'C-도곽']:
    doc.layers.add(n)
H = 0.3


def T(m, s, x, y, h=H, layer='C-글자', align=None, rot=0):
    t = m.add_text(s, dxfattribs={'height': h, 'layer': layer, 'style': 'Standard', 'rotation': rot})
    if align:
        t.set_placement((x, y), align=align)
    else:
        t.dxf.insert = (x, y)
    return t


# ① 횡단면 — 측점 6개, 간격 20 · 20 · 12.5 · 7.5 · 20 (고르지 않음). 표는 «이름 값» 한 줄씩
칸들 = ['깎기 토사', '깎기 풍화암', '쌓기 노체', '쌓기 노상', '표토 제거', '떼붙임(길이)']
단면 = [
    ('STA.0+000.000', 0.0, 31.20, 30.50, [8.40, 1.20, 0.00, 0.80, 2.10, 5.60]),
    ('STA.0+020.000', 20.0, 31.65, 30.70, [11.25, 2.60, 0.00, 1.05, 2.35, 6.10]),
    ('STA.0+040.000', 40.0, 30.80, 30.90, [3.10, 0.00, 2.45, 1.40, 2.50, 6.80]),
    ('STA.0+052.500', 52.5, 30.10, 31.03, [0.00, 0.00, 9.80, 1.75, 2.70, 7.40]),
    ('STA.0+060.000', 60.0, 30.35, 31.10, [0.65, 0.00, 6.20, 1.60, 2.65, 7.15]),
    ('STA.0+080.000', 80.0, 31.05, 31.30, [5.30, 0.40, 0.90, 1.10, 2.40, 6.30]),
]
for k, (sta, ch, 지반, 계획, v) in enumerate(단면):
    oy = -k * 9.0
    msp.add_lwpolyline([(-20, oy - 3), (-12, oy - 2.4), (-4, oy - 3.2)], dxfattribs={'layer': 'C-단면'})
    T(msp, '측  점', 1.0, oy)
    T(msp, sta, 4.0, oy)
    T(msp, '지반고', 1.0, oy - 0.7)
    T(msp, format(지반, '.3f'), 8.2, oy - 0.7, align=TextEntityAlignment.RIGHT)
    T(msp, '계획고', 1.0, oy - 1.4)
    T(msp, format(계획, '.3f'), 8.2, oy - 1.4, align=TextEntityAlignment.RIGHT)
    for j, 이름 in enumerate(칸들):
        yy = oy - 2.1 - j * 0.7
        T(msp, 이름, 1.0, yy)
        if v[j]:
            T(msp, format(v[j], '.2f'), 8.2, yy, align=TextEntityAlignment.RIGHT)
    msp.add_lwpolyline([(0.6, oy + 0.6), (8.6, oy + 0.6), (8.6, oy - 6.2), (0.6, oy - 6.2)], close=True, dxfattribs={'layer': 'C-표'})
토공 = {}
for j, 이름 in enumerate(칸들):
    s = 0.0
    for a, b in zip(단면, 단면[1:]):
        s += (a[4][j] + b[4][j]) / 2 * (b[1] - a[1])
    토공[이름.replace(' ', '')] = round(s, 6)
# ② 철근 재료표 — 길이(mm) · 총길이(m) · 무게(kg) (머리 단위가 섞임)
bx, by = 30.0, 2.0
T(msp, '철 근 재 료 표', bx + 5, by, h=0.5)
머리 = [('기호', 0), ('직경', 2.0), ('길이', 4.0), ('개수', 6.4), ('총길이', 8.4), ('단위중량', 10.8), ('총중량', 13.4)]
for s, x in 머리:
    T(msp, s, bx + x, by - 1.2)
for s, x in [('(mm)', 4.0), ('(m)', 8.4), ('(kg/m)', 10.8), ('(kg)', 13.4)]:
    T(msp, s, bx + x, by - 1.8)
철근 = [('S1', 'D13', 2350, 24), ('S2', '〃', 1800, 36), ('S3', 'D16', 4120, 18), ('S4', 'D19', 5600, 12), ('S5', '〃', 3250, 10), ('S6', 'D25', 6000, 8), ('S7', 'D10', 950, 60)]
행 = []
앞 = ''
for 기호, d, L, n in 철근:
    dd = 앞 if d == '〃' else d
    앞 = dd
    총 = L * n / 1000
    행.append((기호, d, str(L), str(n), format(총, '.3f'), format(KG[dd], '.3f'), format(총 * KG[dd], '.1f')))
for r, row in enumerate(행):
    yy = by - 2.6 - r * 0.6
    for j, s in enumerate(row):
        T(msp, s, bx + 머리[j][1], yy)
T(msp, '합    계', bx, by - 2.6 - len(행) * 0.6)
msp.add_lwpolyline([(bx - 0.3, by - 0.8), (bx + 15.4, by - 0.8), (bx + 15.4, by - 2.6 - (len(행) + 1) * 0.6), (bx - 0.3, by - 2.6 - (len(행) + 1) * 0.6)], close=True, dxfattribs={'layer': 'C-표'})
철 = {}
앞 = ''
for 기호, d, L, n in 철근:
    dd = 앞 if d == '〃' else d
    앞 = dd
    a = 철.setdefault(dd, {'m': 0.0, 'kg': 0.0})
    a['m'] += L * n / 1000
    a['kg'] += L * n / 1000 * KG[dd]
# ③ 수량표
qx, qy = 30.0, -10.0
T(msp, '주 요 자 재 수 량 표', qx + 3, qy, h=0.5)
qh = [('품    명', 0), ('규    격', 3.6), ('단 위', 7.8), ('수    량', 9.6)]
for s, x in qh:
    T(msp, s, qx + x, qy - 1.2)
수량 = [('레미콘', '25-21-80', 'm3', '12.60'), ('흄관', 'D450', 'm', '131.42'), ('맨홀뚜껑', 'D648', '개', '5'), ('레미콘', '25-21-80', 'm3', '3.40')]
for r, row in enumerate(수량):
    for j, s in enumerate(row):
        T(msp, s, qx + qh[j][1], qy - 2.0 - r * 0.7)
msp.add_lwpolyline([(-25, 6), (50, 6), (50, -60), (-25, -60)], close=True, dxfattribs={'layer': 'C-도곽'})
T(msp, 'K-건설맵 시험 도면 A-1 횡단면도 — 실제 현장이 아닙니다', -23, -59, h=0.5)
doc.saveas(os.path.join(OUT, '자동적산_A_횡단.dxf'))
# ④ 평면(따로 한 장) — 관로(선 + 볼록 호) · 측구(선 + ARC) · 경계석 · 아스콘(닫힌 면) · 현황 · 블록 · 위치도
#    (횡단면도와 한 장에 그리면 측점 줄 때문에 «종·횡단면도» 로 보고 선 길이를 처음엔 꺼 둠 — 그건 맞는 동작)
doc = 새도면(6)
msp = doc.modelspace()
for n in ['C-글자', '우수관-계획', 'L형측구', '경계석', '아스콘포장', '기존-우수관', 'C-맨홀', 'C-빗물받이', 'C-가로등', 'C-도곽']:
    doc.layers.add(n)
# ④ 평면 — 관로(선 + 볼록 호) · 측구(선 + ARC) · 경계석 · 아스콘(닫힌 면) · 현황 · 블록
Y0 = -70.0
msp.add_lwpolyline([(0, Y0, 0, 0, 0), (40, Y0, 0, 0, -math.tan(math.radians(22.5))), (60, Y0 - 20, 0, 0, 0), (60, Y0 - 50, 0, 0, 0)], format='xyseb', dxfattribs={'layer': '우수관-계획'})
msp.add_lwpolyline([(0, Y0 - 10), (30, Y0 - 10)], dxfattribs={'layer': '우수관-계획'})
관로 = 40 + math.pi / 2 * 20 + 30 + 30
msp.add_line((-10, Y0 + 5), (90, Y0 + 5), dxfattribs={'layer': 'L형측구'})
msp.add_line((-10, Y0 - 5), (90, Y0 - 5), dxfattribs={'layer': 'L형측구'})
msp.add_arc((90, Y0), 5, -90, 90, dxfattribs={'layer': 'L형측구'})
측구 = 200 + 5 * math.pi
msp.add_lwpolyline([(-10, Y0 + 8), (90, Y0 + 8)], dxfattribs={'layer': '경계석'})
msp.add_lwpolyline([(0, Y0 - 60), (20, Y0 - 60), (20, Y0 - 65), (45, Y0 - 65)], dxfattribs={'layer': '경계석'})
경계석 = 100 + 50
msp.add_lwpolyline([(-10, Y0 + 5), (70, Y0 + 5), (70, Y0 - 3), (-10, Y0 - 3)], close=True, dxfattribs={'layer': '아스콘포장'})
msp.add_lwpolyline([(0, Y0 - 70), (30, Y0 - 70), (25, Y0 - 80), (5, Y0 - 80)], close=True, dxfattribs={'layer': '아스콘포장'})
아스콘 = 80 * 8 + (30 + 20) / 2 * 10
msp.add_line((0, Y0 + 15), (50, Y0 + 15), dxfattribs={'layer': '기존-우수관'})
mh = doc.blocks.new(name='맨홀(1호)')
mh.add_circle((0, 0), 0.6)
mh.add_circle((0, 0), 0.45)
ib = doc.blocks.new(name='빗물받이')
ib.add_lwpolyline([(-0.25, -0.2), (0.25, -0.2), (0.25, 0.2), (-0.25, 0.2)], close=True)
gl = doc.blocks.new(name='가로등')
gl.add_circle((0, 0), 0.3)
gl.add_line((-0.4, 0), (0.4, 0))
for x in (0, 20, 40, 60, 80):
    msp.add_blockref('맨홀(1호)', (x, Y0 - 25), dxfattribs={'layer': 'C-맨홀'})
for x in (5, 15, 30, 45, 62, 78):
    msp.add_blockref('빗물받이', (x, Y0 + 6), dxfattribs={'layer': 'C-빗물받이', 'rotation': 90})
for x in (10, 45, 80):
    msp.add_blockref('가로등', (x, Y0 + 12), dxfattribs={'layer': 'C-가로등'})
# 위치도 — 평면을 0.1 배로 줄인 사본(도곽 귀퉁이) : 관로·측구·아스콘이 다시 그려져도 물량이 아님
kp = doc.blocks.new(name='위치도')
kp.add_lwpolyline([(0, Y0), (40, Y0), (60, Y0 - 20), (60, Y0 - 50)], dxfattribs={'layer': '우수관-계획'})
kp.add_line((-10, Y0 + 5), (90, Y0 + 5), dxfattribs={'layer': 'L형측구'})
kp.add_lwpolyline([(-10, Y0 + 5), (70, Y0 + 5), (70, Y0 - 3), (-10, Y0 - 3)], close=True, dxfattribs={'layer': '아스콘포장'})
msp.add_blockref('위치도', (100, -150), dxfattribs={'layer': 'C-도곽', 'xscale': 0.1, 'yscale': 0.1})
T(msp, '평 면 도 (가상)', 20, Y0 + 20, h=0.6)
msp.add_lwpolyline([(-25, -40), (120, -40), (120, -160), (-25, -160)], close=True, dxfattribs={'layer': 'C-도곽'})
T(msp, 'K-건설맵 시험 도면 A-2 평면도 — 실제 현장이 아닙니다', -23, -159, h=0.5)
doc.saveas(os.path.join(OUT, '자동적산_A_평면.dxf'))
답['A'] = {
    '토공': 토공,
    '철근': {d: {'m': round(v['m'], 6), 'kg': round(v['kg'], 6)} for d, v in 철.items()},
    '수량': {'레미콘|m3': 16.0, '흄관|m': 131.42, '맨홀뚜껑|개': 5},
    '길이': {'우수관-계획': 관로, 'L형측구': 측구, '경계석': 경계석},
    '면적': {'아스콘포장': 아스콘},
    '끔': ['기존-우수관'],
    '블록': {'맨홀(1호)': 5, '빗물받이': 6, '가로등': 3},
}

# ═══════════════════════════════════════════════ B 건축 (mm)
doc = 새도면(4)
msp = doc.modelspace()
for n in ['A-벽', 'A-실', 'A-실명', 'A-창호', 'A-표', 'A-글자', 'A-도곽']:
    doc.layers.add(n)


def TB(s, x, y, h=250, layer='A-글자'):
    return msp.add_text(s, dxfattribs={'height': h, 'layer': layer, 'style': 'Standard', 'insert': (x, y)})


방 = [
    ('사무실1', [(0, 0), (9000, 0), (9000, 6000), (0, 6000)]),
    ('회의실', [(9200, 0), (14200, 0), (14200, 6000), (9200, 6000)]),
    ('화장실(남)', [(14400, 0), (16900, 0), (16900, 2900), (14400, 2900)]),
    ('화장실(여)', [(14400, 3100), (16900, 3100), (16900, 6000), (14400, 6000)]),
    ('복도', [(0, -2000), (16900, -2000), (16900, -200), (0, -200)]),
    ('창고', [(17100, 0), (20100, 0), (20100, 4000), (18600, 6000), (17100, 6000)]),
]


def 넓이둘레(p):
    a = 0.0
    L = 0.0
    for (x1, y1), (x2, y2) in zip(p, p[1:] + p[:1]):
        a += x1 * y2 - x2 * y1
        L += math.hypot(x2 - x1, y2 - y1)
    return abs(a) / 2 / 1e6, L / 1000


실답 = {}
for 이름, p in 방:
    msp.add_lwpolyline(p, close=True, dxfattribs={'layer': 'A-실'})
    xs = [q[0] for q in p]
    ys = [q[1] for q in p]
    TB(이름, (min(xs) + max(xs)) / 2 - len(이름) * 150, (min(ys) + max(ys)) / 2 - 150, h=300, layer='A-실명')
    a, L = 넓이둘레(p)
    실답[이름] = {'면적': round(a, 6), '둘레': round(L, 6)}
msp.add_lwpolyline([(-200, -2200), (20300, -2200), (20300, 4100), (18700, 6200), (-200, 6200)], close=True, dxfattribs={'layer': 'A-벽'})
# 창호 기호 (방 안쪽, 벽 가까이)
창자리 = [('WD1', 8000, 400), ('AW1', 1500, 5400), ('AW1', 5500, 5400),
         ('WD1', 13000, 400), ('AW1', 10000, 5400), ('AW1', 12500, 5400),
         ('WD2', 15000, 300), ('AW2', 15200, 2400),
         ('WD2', 15000, 3400), ('AW2', 15200, 5500),
         ('SD1', 1000, -1700),
         ('WD1', 17500, 400)]
for 기호, x, y in 창자리:
    TB(기호, x, y, h=220, layer='A-창호')
# 실내재료마감표 — 화장실 두 칸을 «화장실» 한 줄로
tx, ty = 23000, 6000
TB('실 내 재 료 마 감 표', tx + 1800, ty, h=350, layer='A-표')
머리 = [('실  명', 0), ('바  닥', 2200), ('걸레받이', 3900), ('벽', 5900), ('천  장', 7200), ('천장고', 8900)]
for s, x in 머리:
    TB(s, tx + x, ty - 900, layer='A-표')
마감 = [('사무실', 'F1', 'B1', 'W1', 'C1', '2700'), ('회의실', 'F1', 'B1', 'W1', 'C1', '2700'), ('화장실', 'F2', '-', 'W2', 'C2', '2400'),
       ('복도', 'F3', 'B2', 'W1', 'C1', '2600'), ('창고', 'F4', 'B1', 'W3', 'C3', '2400')]
for r, row in enumerate(마감):
    for j, s in enumerate(row):
        TB(s, tx + 머리[j][1], ty - 1600 - r * 600, layer='A-표')
msp.add_lwpolyline([(tx - 200, ty - 500), (tx + 10200, ty - 500), (tx + 10200, ty - 1600 - 5 * 600), (tx - 200, ty - 1600 - 5 * 600)], close=True, dxfattribs={'layer': 'A-표'})
wx, wy = 23000, 1000
TB('창 호 일 람 표', wx + 2000, wy, h=350, layer='A-표')
wh = [('기  호', 0), ('규  격', 1800), ('수  량', 4600), ('비  고', 6200)]
for s, x in wh:
    TB(s, wx + x, wy - 900, layer='A-표')
일람 = [('WD1', '900×2100', '3', '목재문'), ('WD2', '800×2100', '2', 'ABS 문'), ('AW1', '1800×1500', '5', '알루미늄창'), ('AW2', '600×600', '2', '환기창'), ('SD1', '1800×2400', '1', '강화유리문')]
for r, row in enumerate(일람):
    for j, s in enumerate(row):
        TB(s, wx + wh[j][1], wy - 1600 - r * 600, layer='A-표')
msp.add_lwpolyline([(wx - 200, wy - 500), (wx + 8400, wy - 500), (wx + 8400, wy - 1600 - 5 * 600), (wx - 200, wy - 1600 - 5 * 600)], close=True, dxfattribs={'layer': 'A-표'})
TB('1층 평면도 (가상)', 6000, 7000, h=450)
msp.add_lwpolyline([(-3000, -6000), (34500, -6000), (34500, 8500), (-3000, 8500)], close=True, dxfattribs={'layer': 'A-도곽'})
TB('K-건설맵 시험 도면 B — 실제 건물이 아닙니다', -2800, -5800, h=300)
doc.saveas(os.path.join(OUT, '자동적산_B.dxf'))
창표 = {'WD1': (0.9, 2.1, '문'), 'WD2': (0.8, 2.1, '문'), 'AW1': (1.8, 1.5, '창'), 'AW2': (0.6, 0.6, '창'), 'SD1': (1.8, 2.4, '문')}
방창 = {'사무실1': ['WD1', 'AW1', 'AW1'], '회의실': ['WD1', 'AW1', 'AW1'], '화장실(남)': ['WD2', 'AW2'], '화장실(여)': ['WD2', 'AW2'], '복도': ['SD1'], '창고': ['WD1']}
표줄 = {'사무실1': 마감[0], '회의실': 마감[1], '화장실(남)': 마감[2], '화장실(여)': 마감[2], '복도': 마감[3], '창고': 마감[4]}
마감답 = {}


def 더(k, v):
    마감답[k] = round(마감답.get(k, 0) + v, 6)


for 이름, r in 표줄.items():
    a, L = 실답[이름]['면적'], 실답[이름]['둘레']
    _, 바닥, 걸레, 벽, 천장, 고 = r
    h = int(고) / 1000
    창면 = sum(창표[c][0] * 창표[c][1] for c in 방창[이름])
    문폭 = sum(창표[c][0] for c in 방창[이름] if 창표[c][2] == '문')
    더('바닥 마감 ' + 바닥 + '|m2', a)
    더('천장 마감 ' + 천장 + '|m2', a)
    더('벽 마감 ' + 벽 + '|m2', L * h - 창면)
    if 걸레 != '-':
        더('걸레받이 마감 ' + 걸레 + '|m', L - 문폭)
답['B'] = {
    '실': 실답, '실합': round(sum(v['면적'] for v in 실답.values()), 6), '마감': 마감답,
    '창호': {'WD1': [3, 3], 'WD2': [2, 2], 'AW1': [5, 4], 'AW2': [2, 2], 'SD1': [1, 1]},   # [창호일람표 수량, 평면 기호 개수]
}

# ═══════════════════════════════════════════════ C 조경 (mm)
doc = 새도면(4)
msp = doc.modelspace()
for n in ['L-잔디', 'L-투수블록포장', 'L-경계석', 'L-울타리', 'L-수목', 'L-시설물', 'L-글자', 'L-표', 'L-도곽']:
    doc.layers.add(n)


def TC(s, x, y, h=300, layer='L-글자'):
    return msp.add_text(s, dxfattribs={'height': h, 'layer': layer, 'style': 'Standard', 'insert': (x, y)})


msp.add_lwpolyline([(0, 0), (12000, 0), (12000, 5000), (0, 5000)], close=True, dxfattribs={'layer': 'L-잔디'})
msp.add_circle((18000, 2500), 2000, dxfattribs={'layer': 'L-잔디'})
잔디 = 60 + math.pi * 4
# 투수블록: 10m×4m 네모 + 오른쪽 끝 반원(반지름 2m) — 볼록(bulge) 1
msp.add_lwpolyline([(0, -8000, 0, 0, 0), (10000, -8000, 0, 0, 1), (10000, -4000, 0, 0, 0), (0, -4000, 0, 0, 0)], format='xyseb', close=True, dxfattribs={'layer': 'L-투수블록포장'})
투수 = 40 + math.pi * 4 / 2
msp.add_lwpolyline([(0, -9000), (20000, -9000)], dxfattribs={'layer': 'L-경계석'})
msp.add_arc((23000, -9000), 3000, 0, 180, dxfattribs={'layer': 'L-경계석'})
경계 = 20 + 3 * math.pi
for (x1, y1, x2, y2) in [(-2000, -12000, 13000, -12000), (13000, -12000, 13000, 3000), (13000, 3000, -2000, 3000), (-2000, 3000, -2000, -12000)]:
    msp.add_line((x1 - 30000, y1), (x2 - 30000, y2), dxfattribs={'layer': 'L-울타리'})
울타리 = 60
so = doc.blocks.new(name='소나무')
so.add_circle((0, 0), 1500)
so.add_line((-1500, 0), (1500, 0))
ip = doc.blocks.new(name='이팝나무')
ip.add_circle((0, 0), 1200)
ip.add_line((0, -1200), (0, 1200))
bd = doc.blocks.new(name='볼라드')
bd.add_circle((0, 0), 100)
bc = doc.blocks.new(name='벤치')
bc.add_lwpolyline([(-900, -250), (900, -250), (900, 250), (-900, 250)], close=True)
군 = doc.blocks.new(name='수목군A')            # 이팝나무 셋을 묶은 블록 — 두 번 넣음
for x in (0, 2500, 5000):
    군.add_blockref('이팝나무', (x, 0))
for k, (x, y) in enumerate([(1000, 6500), (4000, 6500), (7000, 6500), (10000, 6500), (13000, 6500), (16000, 6500), (19000, 6500)]):
    msp.add_blockref('소나무', (x, y), dxfattribs={'layer': 'L-수목', 'rotation': k * 25, 'xscale': 1.2 if k % 2 else 1.0, 'yscale': 1.2 if k % 2 else 1.0})
for x in (2000, 6000, 10000, 14000, 18000):
    msp.add_blockref('이팝나무', (x, -2000), dxfattribs={'layer': 'L-수목'})
msp.add_blockref('수목군A', (25000, 0), dxfattribs={'layer': 'L-수목'})
msp.add_blockref('수목군A', (25000, -5000), dxfattribs={'layer': 'L-수목', 'rotation': 90})
for x in (12500, 13500, 14500, 15500):
    msp.add_blockref('볼라드', (x, -6000), dxfattribs={'layer': 'L-시설물'})
for x in (3000, 7000):
    msp.add_blockref('벤치', (x, -10500), dxfattribs={'layer': 'L-시설물'})
# MINSERT — 볼라드 2줄 × 3칸 = 6 (한 번 넣었지만 6개)
msp.add_blockref('볼라드', (20000, -11000), dxfattribs={'layer': 'L-시설물'}).grid(size=(2, 3), spacing=(800, 1000))
# 등 머리 하나만 품은 보안등 — 보안등만 셈(등기구는 부품)
dg = doc.blocks.new(name='등기구')
dg.add_circle((0, 0), 150)
an = doc.blocks.new(name='보안등')
an.add_line((0, 0), (0, 600))
an.add_blockref('등기구', (0, 600))
for x in (-5000, 0, 5000):
    msp.add_blockref('보안등', (x, -14000), dxfattribs={'layer': 'L-시설물'})
# 범례 — 수목 기호를 하나씩 보여 주는 블록(물량 아님)
bl = doc.blocks.new(name='범례')
bl.add_blockref('소나무', (0, 0))
bl.add_blockref('이팝나무', (0, -3000))
bl.add_blockref('볼라드', (0, -6000))
msp.add_blockref('범례', (-25000, 5000), dxfattribs={'layer': 'L-글자'})
kp = doc.blocks.new(name='KEYPLAN')
kp.add_lwpolyline([(0, 0), (12000, 0), (12000, 5000), (0, 5000)], close=True, dxfattribs={'layer': 'L-잔디'})
kp.add_blockref('소나무', (1000, 6500))
kp.add_blockref('소나무', (4000, 6500))
msp.add_blockref('KEYPLAN', (40000, -14000), dxfattribs={'layer': 'L-도곽', 'xscale': 0.05, 'yscale': 0.05})
m = msp.add_mtext('잔디 식재 — 평떼 (가상)', dxfattribs={'layer': 'L-글자', 'char_height': 300})
m.set_location((2000, 1500))
# 조경 수량표
sx, sy = 33000, 8000
TC('조 경 수 량 표', sx + 2500, sy, h=450, layer='L-표')
sh = [('품    명', 0), ('규    격', 3800), ('단 위', 8600), ('수 량', 10400)]
for s, x in sh:
    TC(s, sx + x, sy - 1200, layer='L-표')
조경표 = [('소나무', 'H3.0×W1.5×R15', '주', '7'), ('이팝나무', 'H3.5×B10', '주', '11'), ('잔디', '평떼', 'm2', '72.57'), ('볼라드', 'D200', '개', '10')]
for r, row in enumerate(조경표):
    for j, s in enumerate(row):
        TC(s, sx + sh[j][1], sy - 2000 - r * 700, layer='L-표')
TC('조경 평면도 (가상)', 4000, 9500, h=500)
msp.add_lwpolyline([(-34000, -16000), (46000, -16000), (46000, 11000), (-34000, 11000)], close=True, dxfattribs={'layer': 'L-도곽'})
TC('K-건설맵 시험 도면 C — 실제 현장이 아닙니다', -33500, -15700, h=350)
doc.saveas(os.path.join(OUT, '자동적산_C.dxf'))
답['C'] = {
    '면적': {'L-잔디': 잔디, 'L-투수블록포장': 투수},
    '길이': {'L-경계석': 경계, 'L-울타리': 울타리},
    '블록': {'소나무': 7, '이팝나무': 5 + 2 * 3, '볼라드': 4 + 2 * 3, '벤치': 2, '보안등': 3},
    '안셈': {'등기구': 0},              # 보안등 부품 — 따로 세지 않음
    '묶음끔': ['수목군A'],
    '수량': {'소나무|주': 7, '이팝나무|주': 11, '잔디|m2': 72.57, '볼라드|개': 10},
}

# 가상 내역서 — 빈 수량 칸(잔디 · 이팝나무) · 다른 수량(경계석 30)
wb = Workbook()
ws = wb.active
ws.title = '내역서'
ws['A1'] = '가상 조경 공사 내역서 (시험 — 실제 공사가 아닙니다 · K-건설맵)'
for j, h in enumerate(['번호', '품명', '규격', '단위', '수량', '단가', '금액', '비고'], 1):
    ws.cell(row=3, column=j, value=h)
내 = [('잔디식재', '평떼', 'm2', None, 4800), ('투수블록 포장', '200×100×60', 'm2', 46.3, 32000), ('경계석 설치', '화강석 150×300', 'm', 30, 41000),
     ('소나무', 'H3.0×W1.5×R15', '주', 7, 650000), ('이팝나무', 'H3.5×B10', '주', None, 280000), ('볼라드', 'D200', '개', 10, 160000), ('울타리', 'H1.2', 'm', 60, 52000)]
for i, (a, b, c, d, e) in enumerate(내, 1):
    r = 3 + i
    for j, v in enumerate([i, a, b, c, d, e], 1):
        ws.cell(row=r, column=j, value=v)
    ws.cell(row=r, column=7, value='=ROUND(E%d*F%d,0)' % (r, r))
wb.save(os.path.join(OUT, '자동적산_C_내역.xlsx'))
답['C']['내역'] = {'잔디식재': None, '이팝나무': None, '경계석 설치': 30}

with open(os.path.join(OUT, '자동적산_답.json'), 'w', encoding='utf-8') as f:
    json.dump(답, f, ensure_ascii=False, indent=1)
print('저장: 자동적산_A/B/C.dxf · C_내역.xlsx · 답.json')
