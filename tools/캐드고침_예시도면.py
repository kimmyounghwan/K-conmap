"""캐드 고치기 🧪 예시 도면 두 장(가상) — web/public/tools/files/ex-cadfix-new.dxf · ex-cadfix-broken.dxf  (ezdxf 필요 · 2026-10-17)
   python tools/캐드고침_예시도면.py
   ① ex-cadfix-new.dxf     2018 판 · 없는 글꼴(윤고딕 YGO330.TTF) · 이름 없는 TTF(가족 이름만) · 글 안 글꼴 · 배치(도곽 + 뷰포트)
   ② ex-cadfix-broken.dxf  2000 판 · 글은 CP949(한글)인데 코드페이지가 ANSI_1252 로 적힘 → 다른 캐드에서 한글이 깨져 보임
   모두 지어낸 «가상 사무실» 입니다(실제 회사 · 현장 · 사람 이름 없음).
"""
import os, io, ezdxf
from ezdxf.enums import TextEntityAlignment as TA, MTextEntityAlignment as MA

밖 = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'public', 'tools', 'files')


def 평면(doc, 글꼴본문='본문', 글꼴제목='제목'):
    msp = doc.modelspace()
    for n, c in [('A-벽', 7), ('A-기둥', 8), ('A-문', 3), ('A-창', 4), ('A-글', 2), ('A-치수', 1), ('A-해치', 9), ('A-가구', 6), ('도곽', 7)]:
        if n not in doc.layers:
            doc.layers.add(n, color=c)
    W, H, t = 24000, 14000, 200
    msp.add_lwpolyline([(0, 0), (W, 0), (W, H), (0, H)], close=True, dxfattribs={'layer': 'A-벽'})
    msp.add_lwpolyline([(t, t), (W - t, t), (W - t, H - t), (t, H - t)], close=True, dxfattribs={'layer': 'A-벽'})
    for x in (8000, 16000):
        msp.add_line((x, t), (x, H - t), dxfattribs={'layer': 'A-벽'}); msp.add_line((x + 100, t), (x + 100, H - t), dxfattribs={'layer': 'A-벽'})
    msp.add_line((t, 7000), (8000, 7000), dxfattribs={'layer': 'A-벽'}); msp.add_line((t, 7100), (8000, 7100), dxfattribs={'layer': 'A-벽'})
    for x in (0, 8000, 16000, 24000):
        for y in (0, 7000, 14000):
            h = msp.add_hatch(color=8, dxfattribs={'layer': 'A-기둥'})
            h.paths.add_polyline_path([(x - 300, y - 300), (x + 300, y - 300), (x + 300, y + 300), (x - 300, y + 300)], is_closed=True)
    h = msp.add_hatch(dxfattribs={'layer': 'A-해치'}); h.set_pattern_fill('ANSI31', scale=40)
    h.paths.add_polyline_path([(t, t), (W - t, t), (W - t, 2 * t), (t, 2 * t)], is_closed=True)
    문 = doc.blocks.new('문900')
    문.add_line((0, 0), (900, 0)); 문.add_arc((0, 0), 900, 0, 90); 문.add_line((0, 0), (0, 900))
    문.add_attdef('번호', (300, 300), dxfattribs={'height': 150, 'style': 글꼴본문})
    for i, (x, y, r) in enumerate([(2500, 7000, 0), (10000, t, 90), (18000, t, 90), (5000, 0, 0)]):
        b = msp.add_blockref('문900', (x, y), dxfattribs={'rotation': r, 'layer': 'A-문'})
        b.add_auto_attribs({'번호': f'D{i + 1}'})
    for x0 in (1500, 9500, 17500):
        msp.add_lwpolyline([(x0, H - t), (x0 + 3000, H - t), (x0 + 3000, H - t - 80), (x0, H - t - 80)], close=True, dxfattribs={'layer': 'A-창'})
    책상 = doc.blocks.new('책상')
    책상.add_lwpolyline([(0, 0), (1600, 0), (1600, 800), (0, 800)], close=True); 책상.add_circle((800, 1100), 250)
    for x in range(9000, 15500, 2200):
        for y in range(1500, 12000, 2600):
            msp.add_blockref('책상', (x, y), dxfattribs={'layer': 'A-가구'})
    for 이름, x, y in [('회의실', 4000, 10500), ('대표실', 4000, 3500), ('사무실', 12000, 7000), ('휴게실 · 탕비', 20000, 10500), ('창고', 20000, 3500)]:
        msp.add_text(이름, dxfattribs={'height': 450, 'style': 글꼴제목, 'layer': 'A-글'}).set_placement((x, y), align=TA.MIDDLE_CENTER)
    mt = msp.add_mtext('{\\f굴림체|b0|i0|c129|p49;※ 특기 사항}\\P1. 벽체는 경량 칸막이(두께 100)\\P2. 바닥 마감: 타일 카펫 · 걸레받이 H100\\P3. 이 도면은 «가상 사무실» 예시입니다',
                       dxfattribs={'char_height': 250, 'style': 글꼴본문, 'layer': 'A-글', 'width': 9000})
    mt.set_location((0, -1500), attachment_point=MA.TOP_LEFT)
    for p1, p2, base in [((0, 0), (8000, 0), (0, -700)), ((8000, 0), (16000, 0), (0, -700)), ((16000, 0), (24000, 0), (0, -700))]:
        d = msp.add_linear_dim(base=base, p1=p1, p2=p2, dimstyle='Standard', override={'dimtxt': 250, 'dimasz': 200, 'dimexo': 100, 'dimgap': 80}, dxfattribs={'layer': 'A-치수'}); d.render()
    d = msp.add_linear_dim(base=(-800, 0), p1=(0, 0), p2=(0, H), angle=90, dimstyle='Standard', override={'dimtxt': 250, 'dimasz': 200, 'dimexo': 100, 'dimgap': 80}, dxfattribs={'layer': 'A-치수'}); d.render()
    return msp


def 배치(doc, 글꼴제목='제목'):
    psp = doc.layout('Layout1')
    doc.layouts.rename('Layout1', '도면')
    psp.add_lwpolyline([(10, 10), (410, 10), (410, 287), (10, 287)], close=True, dxfattribs={'layer': '도곽'})
    psp.add_lwpolyline([(300, 10), (410, 10), (410, 50), (300, 50)], close=True, dxfattribs={'layer': '도곽'})
    psp.add_text('가상 사무실 평면도', dxfattribs={'height': 6, 'style': 글꼴제목, 'layer': '도곽'}).set_placement((355, 35), align=TA.MIDDLE_CENTER)
    psp.add_text('축척 1/100 · A3', dxfattribs={'height': 3.5, 'layer': '도곽'}).set_placement((355, 20), align=TA.MIDDLE_CENTER)
    psp.add_viewport(center=(205, 160), size=(380, 230), view_center_point=(12000, 6000), view_height=23000)


def 저장(doc, 이름):
    p = os.path.join(밖, 이름)
    doc.saveas(p, encoding='cp949' if doc.dxfversion < 'AC1021' else 'utf-8')
    print('ok', p, os.path.getsize(p))
    return p


# ① 2018 판 · 없는 글꼴
doc = ezdxf.new('R2018', setup=['linetypes'])
doc.header['$INSUNITS'] = 4
doc.header['$DWGCODEPAGE'] = 'ANSI_949'
doc.styles.add('제목', font='YGO330.TTF')                              # 윤고딕 330 — 없는 PC 가 많음
s = doc.styles.add('본문', font='')                                      # 파일 이름 없이 가족 이름만(DWG 바꾸기에서 흔한 꼴)
s.set_xdata('ACAD', [(1000, '나눔고딕'), (1071, 34)])
평면(doc); 배치(doc)
p = 저장(doc, 'ex-cadfix-new.dxf')
b = open(p, 'rb').read().replace(b'$DWGCODEPAGE\n  3\nANSI_1252\n', b'$DWGCODEPAGE\n  3\nANSI_949\n')
open(p, 'wb').write(b)

# ② 한글 깨지는 옛 도면 — 2000 판 · CP949 글 · 코드페이지는 ANSI_1252
doc = ezdxf.new('R2000', setup=['linetypes'])
doc.header['$INSUNITS'] = 4
doc.header['$DWGCODEPAGE'] = 'ANSI_949'
doc.styles.add('제목', font='romans.shx').dxf.bigfont = 'whgtxt.shx'
doc.styles.add('본문', font='romans.shx').dxf.bigfont = 'whgtxt.shx'
평면(doc); 배치(doc)
p = 저장(doc, 'ex-cadfix-broken.dxf')
b = open(p, 'rb').read()
b = b.replace(b'$DWGCODEPAGE\n  3\nANSI_949\n', b'$DWGCODEPAGE\n  3\nANSI_1252\n')
b = b.replace(b'\\xab', b'\\U+00AB').replace(b'\\xbb', b'\\U+00BB')   # «» 는 CP949 에 없음 — 파이썬이 쓴 «\xab» 를 DXF 꼴 \U+00AB 로
assert b'ANSI_1252' in b
open(p, 'wb').write(b)
print('broken codepage → ANSI_1252')
