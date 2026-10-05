# -*- coding: utf-8 -*-
"""
🧭 G132 시험용 «지어낸» 도면 — 외부참조(XREF) · XCLIP · 귀퉁이 위치도 · 종단 L= 띠 · 횡단 수량표 블록
  python3 tools/외부참조_예시.py  →  tools/시험자료/xref_바탕.dxf · xref_평면1.dxf · xref_평면2.dxf · 종단_예시.dxf · 횡단_예시.dxf
  실제 현장 도면은 저장소에 넣지 않습니다(이름 · 좌표 모두 지어낸 것).

  바탕(외부참조) : TM 같은 좌표(250000, 170000 근처) · INSUNITS = mm(4) 인데 실제는 m (캐드 기본값이 남은 꼴)
     #계획오수라인  — (250000,170050) → (250300,170050) 길이 300
     -L형측구       — 현황 선 길이 300
     블록 «맨홀» 3개(레이어 0-맨홀(오수)) · 블록 «대문» 2개(레이어 대문, 현황)
  평면1 : 바탕을 두 번 넣음 — XCLIP 으로 x 250000~250100 · 250100~250200 (블록 좌표) → 계획오수 100 + 100
          귀퉁이 위치도 = 붙여넣기 블록(A$C…) 0.1배 — 물량에서 빠져야 함
  평면2 : 바탕을 한 번 — XCLIP x 250150~250250 → 평면1 과 50 겹침 → 바탕을 «한 번만» 세면 x 250000~250250 = 250
  종단 : «D200(오수관)/L=60.00M» · «D300(오수관)/L=40.00M» · 맨홀 구간 «1 LINE-001/L=60.00M» «1 LINE-002/L=40.00M»
         짧은 구간은 이름 · L 이 위아래로 엇갈림
  횡단 : 수량표 블록 «SEC-TABL» 속성(측점 · 지반고 · 터파기 · 모래부설 · ASP) — 노선 둘(0+0 에서 새로)
"""
import os
import ezdxf
from ezdxf import xclip

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '시험자료')
os.makedirs(D, exist_ok=True)


def 새(units=4):
    doc = ezdxf.new('R2010')
    doc.header['$INSUNITS'] = units
    return doc


# ── 바탕(외부참조) ──
b = 새()
m = b.modelspace()
for n in ['#계획오수라인', '-L형측구', '0-맨홀(오수)', '대문', 'TEXT']:
    b.layers.add(n)
m.add_lwpolyline([(250000, 170050), (250300, 170050)], dxfattribs={'layer': '#계획오수라인'})
m.add_lwpolyline([(250000, 170060), (250300, 170060)], dxfattribs={'layer': '-L형측구'})
mh = b.blocks.new('맨홀')
mh.add_circle((0, 0), 0.6)
for x in (250020, 250120, 250220):
    m.add_blockref('맨홀', (x, 170050), dxfattribs={'layer': '0-맨홀(오수)'})
dm = b.blocks.new('대문')
dm.add_line((0, 0), (1, 0))
for x in (250030, 250130):
    m.add_blockref('대문', (x, 170070), dxfattribs={'layer': '대문'})
m.add_text('지어낸 바탕도', dxfattribs={'layer': 'TEXT', 'height': 2}).set_placement((250010, 170080))
b.saveas(os.path.join(D, 'xref_바탕.dxf'))


def 평면(이름, 자리들, 위치도=False):
    doc = 새()
    msp = doc.modelspace()
    doc.add_xref_def('xref_바탕.dwg', 'xref_바탕')
    for (ins, x0, x1) in 자리들:
        r = msp.add_blockref('xref_바탕', ins, dxfattribs={'layer': '0'})
        xclip.XClip(r).set_block_clipping_path([(x0, 170000), (x1, 170100)])
    # 도곽
    msp.add_lwpolyline([(249990, 169990), (250410, 169990), (250410, 170287), (249990, 170287)], close=True, dxfattribs={'layer': '테두리'})
    if 위치도:
        # 귀퉁이 위치도 — 붙여넣기 블록(원점 근처 그림)을 0.1배로
        ac = doc.blocks.new('A$C0F1E2D3C')
        ac.add_lwpolyline([(0, 50), (300, 50)], dxfattribs={'layer': '#계획오수라인'})
        ac.add_lwpolyline([(0, 60), (300, 60)], dxfattribs={'layer': '-L형측구'})
        ac.add_text('위치도 글자 WD1', dxfattribs={'layer': 'TEXT', 'height': 20}).set_placement((10, 80))
        msp.add_blockref('A$C0F1E2D3C', (250360, 170250), dxfattribs={'layer': '0', 'xscale': 0.1, 'yscale': 0.1})
    doc.saveas(os.path.join(D, 이름))


# 평면1: 바탕을 그 자리(0,0)에 두 번 · XCLIP 0~100 · 100~200 + 위치도
평면('xref_평면1.dxf', [((0, 0), 250000, 250100), ((0, 0), 250100, 250200)], 위치도=True)
# 평면2: 150~250
평면('xref_평면2.dxf', [((0, 0), 250150, 250250)])

# ── 종단 ──
j = 새()
jm = j.modelspace()
j.layers.add('CR-TEXT')


def 글(s, x, y, h=2.5):
    t = jm.add_text(s, dxfattribs={'layer': 'CR-TEXT', 'height': h})
    t.set_placement((x, y), align=ezdxf.enums.TextEntityAlignment.MIDDLE_CENTER)


# 관경 띠(긴 구간)
글('D200(오수관)', 100, 60); 글('L=60.00M', 100, 57)
글('D300(오수관)', 180, 60); 글('L=40.00M', 180, 57)
# 맨홀 구간 — 짧은 구간은 엇갈림(이름 / L 이 두 줄)
글('1 LINE-001', 100, 50); 글('L=60.00M', 100, 47)
글('1 LINE-002', 170, 50); 글('L=25.00M', 170, 47)
글('1 LINE-003', 185, 44.5); 글('L=15.00M', 185, 41.5)
# 공법
글('OPEN CUT(토사)', 120, 36); 글('L=100.00M', 120, 33)
j.saveas(os.path.join(D, '종단_예시.dxf'))

# ── 횡단(수량표 블록 속성) ──
h = 새()
hm = h.modelspace()
blk = h.blocks.new('SEC-TABL')
태그 = ['측점', '지반고', '터파기(육상)', '모래부설', 'ASP']
for i, t in enumerate(태그):
    blk.add_attdef(t, (0, -i * 3), dxfattribs={'height': 2})
노선 = [
    [('0+0.000', 30.0, 2.0, 0.4, 1.2), ('1+0.000', 30.2, 3.0, 0.4, 1.2), ('1+10.000(전)', 30.3, 4.0, 0.4, 1.2), ('1+10.000(후)', 30.3, 2.0, 0.4, 0.0), ('2+0.000', 30.4, 2.0, 0.4, 0.0)],
    [('0+0.000', 31.0, 1.0, 0.5, 1.0), ('1+0.000', 31.1, 1.0, 0.5, 1.0)],
]
y = 0
for 줄 in 노선:
    for k, r in enumerate(줄):
        ref = hm.add_blockref('SEC-TABL', (k * 50, y))
        ref.add_auto_attribs({t: (v if isinstance(v, str) else f'{v:.2f}') for t, v in zip(태그, r)})
    y -= 100
h.saveas(os.path.join(D, '횡단_예시.dxf'))
print('만듦:', D)
