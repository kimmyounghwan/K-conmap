# -*- coding: utf-8 -*-
"""
🧱 마감 수량산출(/jeoksan/magam) 예시 도면 — K-건설맵이 그린 «가상» 평면도 (2026-09-27)
    python tools/마감_예시도면.py  →  web/public/jeoksan/마감_예시.dxf

실제 건물이 아닙니다. 들어 있는 것 (단위 mm):
  방 3개(안목 닫힌 폴리선, 레이어 A-실): 사무실 8000×6000 · 회의실 5000×6000 · 화장실 3000×3000
  실명 글자 · 창호 기호 글자(WD1 ×2 · WD2 · AW1 ×3 · AW2) · 치수선
  실내재료마감표 · 창호일람표 (화면의 «도면의 표로 채우기» 시험용)
시험: node tools/시험_마감.mjs
"""
import os
import ezdxf

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'web', 'public', 'jeoksan', '마감_예시.dxf')

doc = ezdxf.new('R2010', setup=True)
doc.header['$INSUNITS'] = 4          # mm
doc.header['$MEASUREMENT'] = 1
msp = doc.modelspace()
for name, color in [('A-벽', 7), ('A-실', 3), ('A-실명', 2), ('A-창호', 4), ('A-치수', 1), ('A-표', 5), ('A-글자', 7), ('A-도곽', 8)]:
    doc.layers.add(name, color=color)

dst = doc.dimstyles.get('Standard')
dst.dxf.dimtxt = 250
dst.dxf.dimasz = 150
dst.dxf.dimexe = 100
dst.dxf.dimexo = 100
dst.dxf.dimlfac = 1


def T(s, x, y, h=250, layer='A-글자'):
    return msp.add_text(s, dxfattribs={'height': h, 'layer': layer, 'style': 'Standard', 'insert': (x, y)})


def 네모(x0, y0, x1, y1, layer, closed=True):
    return msp.add_lwpolyline([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], dxfattribs={'layer': layer, 'closed': closed})


# ── 방 (안목) ────────────────────────────────────────────────
방 = [('사무실', 0, 0, 8000, 6000), ('회의실', 8200, 0, 13200, 6000), ('화장실', 13400, 0, 16400, 3000)]
for 이름, x0, y0, x1, y1 in 방:
    네모(x0, y0, x1, y1, 'A-실')
    T(이름, (x0 + x1) / 2 - len(이름) * 180, (y0 + y1) / 2, h=350, layer='A-실명')
# 벽 바깥선(두께 200)
네모(-200, -200, 16600, 6200, 'A-벽')

# ── 창호 기호 ────────────────────────────────────────────────
창호 = [('WD1', 7000, 250), ('WD1', 9000, 250), ('WD2', 14000, 2600),
       ('AW1', 1500, 5650), ('AW1', 5000, 5650), ('AW1', 10000, 5650), ('AW2', 15200, 250)]
for 기호, x, y in 창호:
    T(기호, x, y, h=220, layer='A-창호')
    msp.add_circle((x + 330, y + 110), 330, dxfattribs={'layer': 'A-창호'})

# ── 치수 ────────────────────────────────────────────────────
for x0, x1 in [(0, 8000), (8200, 13200), (13400, 16400)]:
    d = msp.add_linear_dim(base=(x0, -1200), p1=(x0, 0), p2=(x1, 0), dimstyle='Standard', dxfattribs={'layer': 'A-치수'})
    d.render()
d = msp.add_linear_dim(base=(-1200, 0), p1=(0, 0), p2=(0, 6000), angle=90, dimstyle='Standard', dxfattribs={'layer': 'A-치수'})
d.render()

T('1층 평면도 (가상)', 5000, 7000, h=450)

# ── 실내재료마감표 ────────────────────────────────────────────
tx, ty = 19000, 6000
T('실 내 재 료 마 감 표', tx + 1800, ty, h=350, layer='A-표')
머리 = [('실  명', 0), ('바  닥', 2200), ('걸레받이', 3900), ('벽', 5900), ('천  장', 7200), ('천장고', 8900)]
for s, x in 머리:
    T(s, tx + x, ty - 900, h=250, layer='A-표')
마감 = [('사무실', 'F1', 'B1', 'W1', 'C1', '2700'), ('회의실', 'F1', 'B1', 'W1', 'C1', '2700'), ('화장실', 'F2', '', 'W2', 'C2', '2400')]
for r, row in enumerate(마감):
    for j, s in enumerate(row):
        if s:
            T(s, tx + 머리[j][1], ty - 1600 - r * 600, h=250, layer='A-표')
네모(tx - 200, ty - 500, tx + 10200, ty - 1600 - 3 * 600, 'A-표')

# ── 창호일람표 ────────────────────────────────────────────────
wx, wy = 19000, 1000
T('창 호 일 람 표', wx + 2000, wy, h=350, layer='A-표')
wh = [('기  호', 0), ('규  격', 1800), ('수  량', 4600), ('비  고', 6200)]
for s, x in wh:
    T(s, wx + x, wy - 900, h=250, layer='A-표')
일람 = [('WD1', '900×2100', '2', '목재문'), ('WD2', '800×2100', '1', 'ABS 도어'), ('AW1', '1800×1500', '3', '알루미늄창'), ('AW2', '600×600', '1', '환기창')]
for r, row in enumerate(일람):
    for j, s in enumerate(row):
        T(s, wx + wh[j][1], wy - 1600 - r * 600, h=250, layer='A-표')
네모(wx - 200, wy - 500, wx + 8400, wy - 1600 - 4 * 600, 'A-표')

네모(-3000, -3500, 30500, 8500, 'A-도곽')
T('K-건설맵 예시 도면 — 실제 건물이 아닙니다', -2800, -3300, h=300)

doc.saveas(OUT)
print('저장:', os.path.abspath(OUT), os.path.getsize(OUT), 'bytes')
