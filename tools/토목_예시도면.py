# -*- coding: utf-8 -*-
"""
⚡ 도면 물량 자동(/jeoksan/auto) 예시 도면 — K-건설맵이 그린 «가상» 토목 도면 (2026-09-27)
    python tools/토목_예시도면.py  →  web/public/jeoksan/토목_예시.dxf

실제 현장 도면이 아닙니다. 들어 있는 것:
  ① 횡단면 5개(STA.0+000 ~ 0+080, 20m 간격) — 측점마다 깎기·쌓기 면적표
  ② 철근 재료표(기호·직경·길이·개수·총길이·단위무게·총무게, 소계·총계, 〃 표시)
  ③ 주요 자재 수량표(품명·규격·단위·수량)
  ④ 블록(집수정 4개 · 가로등 3개) · 레이어(측구 선 · 관로 폴리선)
시험: node tools/시험_도면자동.mjs 가 이 도면에서 나와야 할 값을 맞춰 봅니다.
"""
import os
import ezdxf
from ezdxf.enums import TextEntityAlignment

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'web', 'public', 'jeoksan', '토목_예시.dxf')

doc = ezdxf.new('R2010', setup=True)
doc.header['$INSUNITS'] = 6          # m
doc.header['$MEASUREMENT'] = 1
msp = doc.modelspace()
for name, color in [('C-단면', 7), ('C-계획', 1), ('C-표', 3), ('C-글자', 7), ('C-측구', 4), ('C-관로', 5), ('C-집수정', 6), ('C-가로등', 2), ('C-도곽', 8)]:
    doc.layers.add(name, color=color)

H = 0.3


def T(s, x, y, h=H, layer='C-글자', align=None):
    t = msp.add_text(s, dxfattribs={'height': h, 'layer': layer, 'style': 'Standard'})
    if align:
        t.set_placement((x, y), align=align)
    else:
        t.dxf.insert = (x, y)
    return t


def 세로(s, x, y, step=0.55):
    for k, ch in enumerate(s):
        T(ch, x, y - k * step)


def 줄(pts, layer, closed=False):
    return msp.add_lwpolyline(pts, dxfattribs={'layer': layer, 'closed': closed})


# ── ① 횡단면 5개 ─────────────────────────────────────────────
# 측점마다 [토사, 리핑암, 발파암, 노체, 노상, 표토제거, 떼붙임(길이)] — 0 은 적지 않음(빈칸)
단면값 = [
    ('STA.0+000.000', 0, 25.30, 25.00, [12.4, 3.1, 0, 0, 1.2, 2.6, 6.4]),
    ('STA.0+020.000', 20, 25.62, 25.20, [15.8, 4.6, 0.8, 0, 1.5, 2.8, 7.1]),
    ('STA.0+040.000', 40, 24.91, 25.40, [6.2, 0, 0, 5.3, 1.8, 3.0, 8.0]),
    ('STA.0+060.000', 60, 24.10, 25.60, [0, 0, 0, 18.6, 2.1, 3.3, 9.2]),
    ('STA.0+080.000', 80, 24.75, 25.80, [2.5, 0, 0, 9.4, 1.9, 3.1, 8.6]),
]
for k, (sta, ch, 지반, 계획, v) in enumerate(단면값):
    oy = -k * 14.0
    # 단면 그림(가상) — 원지반선과 계획선
    줄([(-22, oy - 6 + (지반 - 25) * 0.8), (-16, oy - 5.5), (-10, oy - 6.2 + (지반 - 25)), (-4, oy - 6.8)], 'C-단면')
    줄([(-19, oy - 7.5), (-15, oy - 6), (-9, oy - 6), (-5, oy - 7.5)], 'C-계획')
    T('EL=' + format(계획, '.3f'), -24, oy - 3)
    # 면적표 — 측점 줄이 맨 위, 그 아래로 깎기·쌓기
    T('측    점', 2.0, oy + 0.2)
    T(sta, 4.2, oy)
    T('지  반  고', 9.2, oy + 0.2)
    T(format(지반, '.3f'), 12.4, oy)
    T('계  획  고', 15.2, oy + 0.2)
    T(format(계획, '.3f'), 18.4, oy)
    세로('깎기', 1.3, oy - 1.3)
    세로('쌓기', 8.6, oy - 1.3)
    rows = [('토       사', '노       체', '표토제거'), ('리  핑  암', '노       상', '떼 붙 임(길이)'), ('발  파  암', None, None)]
    for r, (a, b, c) in enumerate(rows):
        yy = oy - 1.0 - r * 1.0
        T(a, 2.0, yy + 0.2)
        if b:
            T(b, 9.2, yy + 0.2)
        if c:
            T(c, 15.2, yy + 0.2)
    자리 = [(0, 6.2), (1, 6.2), (2, 6.2), (0, 13.4), (1, 13.4), (0, 19.8), (1, 19.8)]
    for j, (r, x) in enumerate(자리):
        if v[j]:
            # 오른쪽 맞춤 숫자
            T(format(v[j], '.1f'), x + 0.9, oy - 1.0 - r * 1.0, align=TextEntityAlignment.RIGHT)
    # 표 테두리
    줄([(1.0, oy + 0.8), (21.2, oy + 0.8), (21.2, oy - 3.4), (1.0, oy - 3.4)], 'C-표', closed=True)

# ── ② 철근 재료표 ─────────────────────────────────────────────
bx, by = 40.0, 2.0
T('철 근 재 료 표', bx + 6, by, h=0.5)
머리 = [('기 호', 0), ('직 경', 2.2), ('길 이', 4.4), ('개 수', 6.6), ('총길이', 8.8), ('단위무게', 11.0), ('총무게', 13.6)]
for s, x in 머리:
    T(s, bx + x, by - 1.2)
for s, x in [('(M)', 4.5), ('(M)', 9.0), ('(KG/M)', 11.0), ('(TON)', 13.7)]:
    T(s, bx + x, by - 1.8)
철근 = [
    ('B1', 'H13', '1.200', '20', '24.000'),
    ('B2', '"', '2.500', '10', '25.000'),
    ('소   계', '', '', '', '49.000', '0.995', '0.049'),
    ('C1', 'H16', '3.100', '12', '37.200'),
    ('C2', '"', '1.850', '8', '14.800'),
    ('소   계', '', '', '', '52.000', '1.560', '0.081'),
    ('W1', 'H22', '4.200', '6', '25.200'),
    ('소   계', '', '', '', '25.200', '3.040', '0.077'),
    ('총   계', '', '', '', '126.200', '', '0.207'),
]
for r, row in enumerate(철근):
    yy = by - 2.6 - r * 0.6
    for j, s in enumerate(row):
        if s:
            T(s, bx + 머리[j][1] + (0.1 if j in (0, 1) else 0), yy)
줄([(bx - 0.3, by - 0.8), (bx + 15.6, by - 0.8), (bx + 15.6, by - 2.6 - 9 * 0.6), (bx - 0.3, by - 2.6 - 9 * 0.6)], 'C-표', closed=True)

# ── ③ 주요 자재 수량표 ────────────────────────────────────────
qx, qy = 40.0, -12.0
T('주 요 자 재 수 량 표', qx + 4, qy, h=0.5)
qh = [('품    명', 0), ('규    격', 3.6), ('단 위', 7.6), ('수    량', 9.4), ('비    고', 12.2)]
for s, x in qh:
    T(s, qx + x, qy - 1.2)
수량 = [
    ('레미콘', '25-24-150', 'm3', '18.40', ''),
    ('거푸집', '합판 3회', 'm2', '64.80', ''),
    ('기초잡석', '', 'm3', '6.20', ''),
    ('PE 이중벽관', 'D300', 'm', '64.50', '관로'),
    ('소    계', '', '', '', ''),
]
for r, row in enumerate(수량):
    yy = qy - 2.0 - r * 0.7
    for j, s in enumerate(row):
        if s:
            T(s, qx + qh[j][1], yy)

# ── ④ 블록 · 레이어 ──────────────────────────────────────────
blk = doc.blocks.new(name='집수정')
blk.add_lwpolyline([(0, 0), (1.2, 0), (1.2, 1.2), (0, 1.2)], close=True)
blk.add_lwpolyline([(0.2, 0.2), (1.0, 0.2), (1.0, 1.0), (0.2, 1.0)], close=True)
blk2 = doc.blocks.new(name='가로등')
blk2.add_circle((0, 0), 0.3)
blk2.add_line((-0.4, 0), (0.4, 0))
for x in (-20, -5, 10, 25):
    msp.add_blockref('집수정', (x, -80), dxfattribs={'layer': 'C-집수정'})
for x in (-15, 5, 25):
    msp.add_blockref('가로등', (x, -84), dxfattribs={'layer': 'C-가로등'})
msp.add_line((-30, -78), (50, -78), dxfattribs={'layer': 'C-측구'})
msp.add_line((-30, -82), (50, -82), dxfattribs={'layer': 'C-측구'})
줄([(-30, -86), (0, -86), (20, -88), (34.5, -88)], 'C-관로')      # 30 + √(400+4) + 14.5
T('평 면 도 (가상)', -8, -75, h=0.6)

# 도곽
줄([(-32, 6), (60, 6), (60, -92), (-32, -92)], 'C-도곽', closed=True)
T('K-건설맵 예시 도면 — 실제 현장 도면이 아닙니다', -30, -91, h=0.5)

doc.saveas(OUT)
print('저장:', os.path.abspath(OUT), os.path.getsize(OUT), 'bytes')
