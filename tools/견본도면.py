# -*- coding: utf-8 -*-
"""📐 G694 도면 작성대행 «견본» 2장 — 가상 공사(남의 도면 아님) · 그림 PDF(글자 층 없음 — 변환 막기)
   python3 tools/견본도면.py [낼곳=web/public/cn]
   ① 시공상세도 — 가상 ○○지구 배수로 정비공사 · U형 측구(PC 플륨관 400×400) 설치 상세(단면 1/20 · 평면 1/50 · 재료표)
   ② 가설 · 안전시설 배치도 — 같은 가상 현장(작업 구간 · 현장사무실 · 야적장 · 세륜 · 휀스 · 표지판 · 신호수 · CCTV · 소화기 …)
   종이는 A3 가로(420 × 297 mm) · 종이 mm 로 그림(축척은 치수 dimlfac 로) · 옅은 «견본 · K-건설맵» 글 · 표제란 «견본 — 가상 공사»
   재료표 수량은 이 도면 치수로 셈(짐작 없음 — 아래 셈 그대로)."""
import os, sys
import ezdxf
from ezdxf.enums import TextEntityAlignment as TA
from ezdxf.addons.drawing import RenderContext, Frontend
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
from ezdxf.addons.drawing.config import Configuration, BackgroundPolicy, LineweightPolicy
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'web', 'public', 'cn')
os.makedirs(OUT, exist_ok=True)
FONT = 'NotoSansCJK-Regular.ttc'
W, H = 420.0, 297.0
공사명 = '가상 ○○지구 배수로 정비공사'


def 새도면():
    doc = ezdxf.new('R2018', setup=True)
    doc.header['$INSUNITS'] = 4
    doc.styles.add('KR', font=FONT)
    for nm, c, lt in [('틀', 7, 'Continuous'), ('글', 7, 'Continuous'), ('외형', 7, 'Continuous'), ('치수', 1, 'Continuous'),
                      ('해치', 8, 'Continuous'), ('중심', 1, 'CENTER'), ('주석', 5, 'Continuous'), ('흙', 8, 'Continuous'),
                      ('도로', 8, 'Continuous'), ('휀스', 3, 'Continuous'), ('시설', 7, 'Continuous'), ('표지', 1, 'Continuous'),
                      ('견본', 9, 'Continuous')]:
        doc.layers.add(nm, color=c, linetype=lt)
    ds = doc.dimstyles.get('EZDXF')
    ds.dxf.dimtxsty = 'KR'; ds.dxf.dimtxt = 2.2; ds.dxf.dimasz = 1.8; ds.dxf.dimexe = 1.2; ds.dxf.dimexo = 1.0
    ds.dxf.dimclrd = 1; ds.dxf.dimclre = 1; ds.dxf.dimclrt = 7; ds.dxf.dimdec = 0; ds.dxf.dimgap = 0.8
    return doc, doc.modelspace()


def 글(msp, x, y, s, h=3.0, al=TA.MIDDLE_LEFT, c=None, 층='글', 각=0):
    a = {'layer': 층, 'style': 'KR', 'rotation': 각}
    if c is not None:
        a['color'] = c
    msp.add_text(s, height=h, dxfattribs=a).set_placement((x, y), align=al)


def 선(msp, pts, 층='외형', 닫음=False, c=None, 굵기=None, lt=None):
    a = {'layer': 층}
    if c is not None:
        a['color'] = c
    if 굵기 is not None:
        a['lineweight'] = 굵기
    if lt:
        a['linetype'] = lt
    msp.add_lwpolyline(pts, close=닫음, dxfattribs=a)


def 네모(msp, x, y, w, h, **k):
    선(msp, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)], 닫음=True, **k)


def 해치(msp, pts, 무늬='ANSI31', 크기=1.0, c=8, 각=0.0):
    h = msp.add_hatch(color=c, dxfattribs={'layer': '해치'})
    h.set_pattern_fill(무늬, scale=크기, angle=각)
    h.paths.add_polyline_path(pts, is_closed=True)


def 치수(msp, p1, p2, base, 축척, 각=0):
    d = msp.add_linear_dim(base=base, p1=p1, p2=p2, angle=각, dimstyle='EZDXF',
                           override={'dimlfac': 축척, 'dimtxsty': 'KR', 'dimclrd': 1, 'dimclre': 1}, dxfattribs={'layer': '치수'})
    d.render()


def 틀(msp, 도면명, 번호, 축척글):
    네모(msp, 0, 0, W, H, 층='틀')
    네모(msp, 10, 7, W - 17, H - 14, 층='틀', 굵기=70)
    x0, x1, y0 = W - 7 - 120, W - 7, 7          # 표제란(오른쪽 아래 · 120 × 60)
    for r in (9, 18, 27, 36, 48):
        선(msp, [(x0, y0 + r), (x1, y0 + r)], 층='틀', 굵기=35)
    선(msp, [(x0, y0), (x0, y0 + 60)], 층='틀', 굵기=50)
    선(msp, [(x0, y0 + 60), (x1, y0 + 60)], 층='틀', 굵기=50)
    선(msp, [(x0 + 24, y0), (x0 + 24, y0 + 36)], 층='틀', 굵기=25)
    for i, (이름, 값) in enumerate([('도면번호', 번호), ('축    척', 축척글 + '  (A3)'), ('날    짜', '2026. 11.'), ('도 면 명', 도면명)]):
        글(msp, x0 + 2.5, y0 + 4.5 + 9 * i, 이름, 2.4, c=8)
        글(msp, x0 + 27, y0 + 4.5 + 9 * i, 값, 3.0 if i < 3 else 3.1)
    글(msp, x0 + 60, y0 + 42, 공사명 + '  (견본)', 3.2, al=TA.MIDDLE_CENTER)
    글(msp, x0 + 60, y0 + 54, 'K-건설맵 도면 작성대행 견본 — 가상 공사 · 실제 시공용 아님', 2.5, al=TA.MIDDLE_CENTER, c=5)


def 물결(msp):
    """옅은 «견본 · K-건설맵» 글 — 종이 가득 비스듬히(아주 옅은 회색 254)"""
    for gx in range(5):
        for gy in range(4):
            글(msp, 40 + gx * 88, 38 + gy * 70, '견본 · K-건설맵', 8.0, al=TA.MIDDLE_CENTER, c=254, 층='견본', 각=24)


def 그림PDF(doc, 이름, dpi=200):
    fig = plt.figure(figsize=(W / 25.4, H / 25.4))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_axis_off()
    cfg = Configuration(background_policy=BackgroundPolicy.WHITE, lineweight_policy=LineweightPolicy.ABSOLUTE, lineweight_scaling=1.0, min_lineweight=0.18)
    Frontend(RenderContext(doc), MatplotlibBackend(ax), config=cfg).draw_layout(doc.modelspace(), finalize=True)
    ax.set_aspect('auto'); ax.set_xlim(0, W); ax.set_ylim(0, H)     # 종이(A3) 그대로 — finalize 가 잡은 범위를 덮어씀
    fig.set_size_inches(W / 25.4, H / 25.4)                         # finalize 가 그림 크기를 줄여 놓음(1513 px 로 나왔음) — A3 그대로
    png = os.path.join(OUT, f'{이름}.png')
    fig.savefig(png, dpi=dpi, facecolor='white')
    plt.close(fig)
    im = Image.open(png).convert('RGB')
    pdf = os.path.join(OUT, f'{이름}.pdf')
    im.save(pdf, 'PDF', resolution=dpi, quality=85)     # 그림만(글자 층 없음) · A3 200 dpi
    작 = im.copy(); 작.thumbnail((900, 900))
    작.save(os.path.join(OUT, f'{이름}_작게.webp'), 'WEBP', quality=82)
    os.remove(png)
    return pdf


# ───────────── ① 시공상세도 — U형 측구(PC 플륨관 400×400) ─────────────
def 시공상세도():
    doc, m = 새도면()
    틀(m, 'U형 측구(PC 플륨관 400×400) 설치 상세도', 'D-01', '1/10 · 1/50')
    물결(m)
    S = 10.0
    k = lambda v: v / S
    ox, oy = 150.0, 140.0           # 단면 가운데 · 쇄석 밑(종이 mm) · 1/10
    플안폭, 플안높이, 벽두께, 바닥두께 = 400, 400, 60, 70
    플밖폭 = 플안폭 + 2 * 벽두께                  # 520
    콘두께, 콘여유 = 100, 90
    콘폭 = 플밖폭 + 2 * 콘여유                    # 700
    쇄두께, 쇄여유 = 150, 100
    쇄폭 = 콘폭 + 2 * 쇄여유                      # 900
    플높이 = 플안높이 + 바닥두께                   # 470
    터깊이 = 쇄두께 + 콘두께 + 플높이              # 720
    경사 = 0.3
    지표y = oy + k(터깊이)
    아래반 = k(쇄폭) / 2
    위반 = 아래반 + k(터깊이) * 경사
    땅끝 = 72.0
    선(m, [(ox - 땅끝, 지표y), (ox - 위반, 지표y)], 층='흙', 굵기=35)
    선(m, [(ox + 위반, 지표y), (ox + 땅끝, 지표y)], 층='흙', 굵기=35)
    선(m, [(ox - 위반, 지표y), (ox - 아래반, oy), (ox + 아래반, oy), (ox + 위반, 지표y)], 층='흙', 굵기=25, lt='DASHED')
    for sgn in (-1, 1):
        해치(m, [(ox + sgn * 위반, 지표y), (ox + sgn * 땅끝, 지표y), (ox + sgn * 땅끝, oy - 10), (ox + sgn * 아래반, oy - 10), (ox + sgn * 아래반, oy)],
             'EARTH', 0.6, c=8, 각=45)
    해치(m, [(ox - 아래반, oy), (ox + 아래반, oy), (ox + 아래반, oy - 10), (ox - 아래반, oy - 10)], 'EARTH', 0.6, c=8, 각=45)
    y1 = oy + k(쇄두께)
    쇄 = [(ox - 아래반, oy), (ox + 아래반, oy), (ox + 아래반, y1), (ox - 아래반, y1)]
    선(m, 쇄, 닫음=True, 굵기=35); 해치(m, 쇄, 'GRAVEL', 0.2, c=8)
    y2 = y1 + k(콘두께)
    콘 = [(ox - k(콘폭) / 2, y1), (ox + k(콘폭) / 2, y1), (ox + k(콘폭) / 2, y2), (ox - k(콘폭) / 2, y2)]
    선(m, 콘, 닫음=True, 굵기=50); 해치(m, 콘, 'AR-CONC', 0.035, c=8)
    a, b = k(플밖폭) / 2, k(플안폭) / 2
    y3 = y2 + k(바닥두께); y4 = y2 + k(플높이)
    U = [(ox - a, y2), (ox + a, y2), (ox + a, y4), (ox + b, y4), (ox + b, y3), (ox - b, y3), (ox - b, y4), (ox - a, y4)]
    선(m, U, 닫음=True, 굵기=70); 해치(m, U, 'ANSI31', 0.6, c=8)
    for sgn in (-1, 1):
        되 = [(ox + sgn * a, y2), (ox + sgn * k(콘폭) / 2, y2), (ox + sgn * k(콘폭) / 2, y1), (ox + sgn * 아래반, y1),
              (ox + sgn * 아래반, oy), (ox + sgn * 위반, 지표y), (ox + sgn * a, 지표y)]
        해치(m, 되, 'DOTS', 0.4, c=8)
    선(m, [(ox, oy - 6), (ox, 지표y + 18)], 층='중심', 굵기=18)
    # 치수(실제 mm)
    치수(m, (ox - 아래반, oy), (ox + 아래반, oy), (ox, oy - 15), S)
    치수(m, (ox - k(콘폭) / 2, y1), (ox + k(콘폭) / 2, y1), (ox, oy - 8), S)
    치수(m, (ox - a, y4), (ox + a, y4), (ox, 지표y + 12), S)
    치수(m, (ox - b, y4), (ox + b, y4), (ox, 지표y + 6), S)
    xr = ox + 위반 + 7
    치수(m, (ox + a, oy), (ox + a, y1), (xr, oy), S, 각=90)
    치수(m, (ox + a, y1), (ox + a, y2), (xr, oy), S, 각=90)
    치수(m, (ox + a, y2), (ox + a, y4), (xr, oy), S, 각=90)
    치수(m, (ox + a, oy), (ox + a, 지표y), (xr + 8, oy), S, 각=90)
    # 부재 말 — 왼쪽에 글 · 지시선
    주석 = [((ox - 아래반 + 2, oy + 3), '쇄석 기초 t=150 (40mm 이하)'), ((ox - k(콘폭) / 2 + 2, y1 + 2.5), '기초 콘크리트 fck=18MPa t=100'),
           ((ox - a + 1.2, y3 + 4), 'PC 플륨관(U형) 400×400 L=2.0m'), ((ox - 위반 - 2, 지표y - 4), '되메우기(양질토 · 다짐 95% 이상)')]
    for i, (p, s) in enumerate(주석):
        ty = oy + 6 + i * 16
        선(m, [p, (ox - 76, ty), (26, ty)], 층='주석', 굵기=18)
        글(m, 26, ty + 2.4, s, 2.6, c=5)
    글(m, 26, 지표y + 34, '단 면 도', 5.0)
    글(m, 26, 지표y + 27.5, 'S = 1 : 10', 2.8, c=8)
    글(m, ox + 아래반 + 4, oy - 22, '※ 터파기 기울기 1 : 0.3', 2.3, c=8)
    # ── 평면(1/50): 플륨관 L=2.0m × 3 · 이음 ──
    P = 50.0
    kk = lambda v: v / P
    px, py = 252.0, 232.0
    길이 = 6000
    선(m, [(px, py), (px + kk(길이), py), (px + kk(길이), py + kk(플밖폭)), (px, py + kk(플밖폭))], 닫음=True, 굵기=50)
    선(m, [(px, py + kk(벽두께)), (px + kk(길이), py + kk(벽두께))], 굵기=25)
    선(m, [(px, py + kk(벽두께 + 플안폭)), (px + kk(길이), py + kk(벽두께 + 플안폭))], 굵기=25)
    for i in (1, 2):
        x = px + kk(2000 * i)
        선(m, [(x, py - 1.5), (x, py + kk(플밖폭) + 1.5)], 층='주석', 굵기=25)
        글(m, x, py + kk(플밖폭) + 4.2, '이음(모르타르 1:2)', 2.2, al=TA.MIDDLE_CENTER, c=5)
    선(m, [(px - 4, py + kk(플밖폭) / 2), (px + kk(길이) + 4, py + kk(플밖폭) / 2)], 층='중심', 굵기=18)
    fx = px + kk(길이) - 26
    yy = py - 21
    선(m, [(fx, yy), (fx + 12, yy)], 층='주석', 굵기=25)
    선(m, [(fx + 12, yy), (fx + 9.5, yy + 1.3)], 층='주석', 굵기=25)
    선(m, [(fx + 12, yy), (fx + 9.5, yy - 1.3)], 층='주석', 굵기=25)
    글(m, fx - 2, yy, '흐름 i = 0.5 %', 2.2, al=TA.MIDDLE_RIGHT, c=5)
    for i in range(3):
        치수(m, (px + kk(2000 * i), py), (px + kk(2000 * (i + 1)), py), (px + kk(1000 + 2000 * i), py - 6), P)
    치수(m, (px, py), (px + kk(길이), py), (px + kk(3000), py - 13), P)
    글(m, px, py + 30, '평 면 도', 5.0)
    글(m, px, py + 23.5, 'S = 1 : 50', 2.8, c=8)
    # ── 재료표(1m 당 — 위 단면 치수로 셈) ──
    쇄량 = 쇄폭 / 1000 * 쇄두께 / 1000
    콘량 = 콘폭 / 1000 * 콘두께 / 1000
    거푸집 = 2 * 콘두께 / 1000
    터파기 = (쇄폭 / 1000 + (쇄폭 / 1000 + 2 * 터깊이 / 1000 * 경사)) / 2 * 터깊이 / 1000
    되메우기 = 터파기 - 쇄량 - 콘량 - (플밖폭 / 1000) * (플높이 / 1000)
    줄들 = [('터파기(토사)', '기울기 1 : 0.3', '㎥', 터파기), ('쇄석 기초', '40mm 이하 · t=150', '㎥', 쇄량), ('기초 콘크리트', 'fck=18MPa · t=100', '㎥', 콘량),
            ('거푸집', '기초 양옆', '㎡', 거푸집), ('PC 플륨관(U형)', '400×400 · L=2.0m', '개', 0.5), ('되메우기', '양질토 · 다짐', '㎥', 되메우기)]
    tx, ty = 252.0, 192.0
    폭들 = [40, 48, 14, 24]
    선(m, [(tx, ty), (tx + sum(폭들), ty)], 층='틀', 굵기=35)
    x = tx
    for w, s in zip(폭들, ['공  종', '규  격', '단위', '수량(1m당)']):
        글(m, x + w / 2, ty - 4.5, s, 2.5, al=TA.MIDDLE_CENTER); x += w
    선(m, [(tx, ty - 9), (tx + sum(폭들), ty - 9)], 층='틀', 굵기=25)
    for i, (a1, a2, a3, a4) in enumerate(줄들):
        yy = ty - 9 - (i + 0.5) * 7.5
        글(m, tx + 2, yy, a1, 2.3); 글(m, tx + 폭들[0] + 2, yy, a2, 2.3)
        글(m, tx + 폭들[0] + 폭들[1] + 폭들[2] / 2, yy, a3, 2.3, al=TA.MIDDLE_CENTER)
        글(m, tx + sum(폭들) - 2, yy, f'{a4:.3f}', 2.3, al=TA.MIDDLE_RIGHT)
    yb = ty - 9 - len(줄들) * 7.5
    선(m, [(tx, yb), (tx + sum(폭들), yb)], 층='틀', 굵기=35)
    x = tx
    for w in [0] + 폭들:
        x += w
        선(m, [(x, ty), (x, yb)], 층='틀', 굵기=18)
    글(m, tx, ty + 5, '재 료 표 (측구 1m 당)', 3.6)
    글(m, tx, yb - 4.5, '※ 수량은 위 단면 치수로 셈(할증 없음) · 플륨관 L=2.0m 한 개 = 0.5개/m', 2.1, c=8)
    # 일반 사항
    gx, gy = 26.0, 88.0
    글(m, gx, gy, '일 반 사 항', 3.6)
    for i, s in enumerate(['1. 기초 쇄석은 20cm 마다 다지고, 기초 콘크리트는 쇄석 위에 바로 친다.',
                           '2. 플륨관 이음은 모르타르(1:2)로 채우고 안쪽 면을 매끈하게 마감한다.',
                           '3. 되메우기는 양옆을 같이 20cm 마다 다져 플륨관이 밀리지 않게 한다.',
                           '4. 흐름 기울기는 0.5 % 이상 — 시공 전 기준점에서 높이를 확인한다.',
                           '5. 이 도면은 견본(가상 공사)이다 — 실제 공사는 현장 설계도서를 따른다.']):
        글(m, gx + 2, gy - 8 - i * 6.5, s, 2.5)
    return 그림PDF(doc, '견본_시공상세도')


# ───────────── ② 가설 · 안전시설 배치도 ─────────────
def 배치도():
    doc, m = 새도면()
    틀(m, '가설 · 안전시설 배치도', 'T-01', '1/500')
    물결(m)
    S = 500.0
    k = lambda v: v * 1000 / S          # 실제 m → 종이 mm(1m = 2mm)
    x0, x1 = 20.0, 290.0                # 도로 그리는 폭(135m)
    ry = 190.0                          # 도로 아래 가장자리
    선(m, [(x0, ry), (x1, ry)], 층='도로', 굵기=35)
    선(m, [(x0, ry + k(7)), (x1, ry + k(7))], 층='도로', 굵기=35)
    선(m, [(x0, ry + k(3.5)), (x1, ry + k(3.5))], 층='도로', 굵기=18, lt='DASHED')
    글(m, 160, ry + k(1.75), '군도 ○○호선(가상) · 폭 7.0m', 2.3, al=TA.MIDDLE_CENTER, c=8)
    # 배수로 정비 구간 L=120m — 도로 위쪽 길가
    sx = 35.0; ex = sx + k(120)
    yb = ry + k(7) + 1.0
    해치(m, [(sx, yb), (ex, yb), (ex, yb + k(1.2)), (sx, yb + k(1.2))], 'ANSI31', 0.35, c=8)
    선(m, [(sx, yb), (ex, yb), (ex, yb + k(1.2)), (sx, yb + k(1.2))], 닫음=True, 굵기=70)
    글(m, (sx + ex) / 2, yb + k(1.2) + 16, '배수로 정비 구간 L = 120m — U형 측구 400×400 (D-01)', 2.8, al=TA.MIDDLE_CENTER, c=5)
    치수(m, (sx, yb + k(1.2)), (ex, yb + k(1.2)), ((sx + ex) / 2, yb + k(1.2) + 8), S / 1000)
    for i, st in enumerate(range(0, 121, 20)):
        x = sx + k(st)
        선(m, [(x, yb - 1.2), (x, yb + k(1.2) + 1.2)], 층='주석', 굵기=18)
        글(m, x, yb + k(1.2) + 2.6, f'No.{i}', 1.9, al=TA.MIDDLE_CENTER, c=8)
    # 기호
    def 기호(x, y, 꼴):
        if 꼴 == '소화기':
            m.add_circle((x, y), 1.5, dxfattribs={'layer': '표지', 'color': 1}); 글(m, x, y, '소', 1.6, al=TA.MIDDLE_CENTER, c=1)
        elif 꼴 == 'CCTV':
            네모(m, x - 1.7, y - 1.1, 3.4, 2.2, 층='표지', c=5); 글(m, x, y, 'C', 1.6, al=TA.MIDDLE_CENTER, c=5)
        elif 꼴 == '표지판':
            선(m, [(x, y + 2.0), (x + 1.8, y - 1.1), (x - 1.8, y - 1.1)], 층='표지', 닫음=True, c=1)
            글(m, x, y - 0.1, '!', 1.6, al=TA.MIDDLE_CENTER, c=1)
        elif 꼴 == '신호수':
            m.add_circle((x, y), 1.6, dxfattribs={'layer': '표지', 'color': 6}); 글(m, x, y, '신', 1.5, al=TA.MIDDLE_CENTER, c=6)
        elif 꼴 == '라바콘':
            선(m, [(x, y + 1.3), (x + 0.9, y - 0.9), (x - 0.9, y - 0.9)], 층='표지', 닫음=True, c=30)
        elif 꼴 == '게시판':
            네모(m, x - 2.2, y - 1.1, 4.4, 2.2, 층='표지', c=3); 글(m, x, y, '게', 1.5, al=TA.MIDDLE_CENTER, c=3)
        elif 꼴 == '경광등':
            m.add_circle((x, y), 1.1, dxfattribs={'layer': '표지', 'color': 2}); m.add_circle((x, y), 0.45, dxfattribs={'layer': '표지', 'color': 2})
    # 도로 쪽 교통 안전
    for i in range(0, 25):
        기호(sx + k(i * 5), ry + k(7) - 1.6, '라바콘')
    기호(sx - 9, ry + k(7) + 4, '표지판'); 기호(ex + 9, ry + k(7) + 4, '표지판')
    기호(sx - 5, ry + k(2.2), '신호수'); 기호(ex + 5, ry + k(2.2), '신호수')
    기호(sx - 3, ry + k(7) + 4, '경광등'); 기호(ex + 3, ry + k(7) + 4, '경광등')
    # 현장 터(가설 시설) — 도로 아래 · 60 × 52m
    tx, ty, tw, th = 45.0, 66.0, k(60), k(52)
    gx1, gx2 = tx + k(22), tx + k(30)                 # 출입구 W=8.0m
    선(m, [(gx1, ty + th), (tx, ty + th), (tx, ty), (tx + tw, ty), (tx + tw, ty + th), (gx2, ty + th)], 층='휀스', 굵기=50)
    def 휀스표(xa, ya, xb, yb_, n):
        for i in range(1, n):
            t = i / n; x = xa + (xb - xa) * t; y = ya + (yb_ - ya) * t
            선(m, [(x - 0.8, y - 0.8), (x + 0.8, y + 0.8)], 층='휀스', 굵기=18)
    휀스표(tx, ty, tx + tw, ty, 24); 휀스표(tx, ty, tx, ty + th, 20); 휀스표(tx + tw, ty, tx + tw, ty + th, 20)
    휀스표(tx, ty + th, gx1, ty + th, 9); 휀스표(gx2, ty + th, tx + tw, ty + th, 12)
    # 진입로(출입구 → 도로)
    선(m, [(gx1, ty + th), (gx1, ry)], 층='시설', 굵기=25); 선(m, [(gx2, ty + th), (gx2, ry)], 층='시설', 굵기=25)
    글(m, (gx1 + gx2) / 2, ty + th + 6, '진입로', 2.0, al=TA.MIDDLE_CENTER, c=8)
    글(m, gx1 - 1.5, ty + th + 3.2, '출입구 W=8.0m', 2.0, al=TA.MIDDLE_RIGHT)
    def 칸(x, y, w, h, 이름, 말=None, 무늬=None):
        if 무늬:
            해치(m, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)], 무늬, 1.4, c=8)
        네모(m, x, y, w, h, 층='시설', 굵기=35)
        글(m, x + w / 2, y + h / 2 + (1.7 if 말 else 0), 이름, 2.4, al=TA.MIDDLE_CENTER)
        if 말:
            글(m, x + w / 2, y + h / 2 - 2.3, 말, 1.8, al=TA.MIDDLE_CENTER, c=8)
    칸(tx + k(3), ty + th - k(12), k(14), k(8), '현장사무실', '컨테이너 3×6m ×2')
    칸(tx + k(3), ty + th - k(22), k(7), k(7), '화장실', '이동식')
    칸(tx + k(11), ty + th - k(22), k(8), k(7), '휴게 · 탈의', '컨테이너')
    칸(tx + k(32), ty + th - k(12), k(12), k(8), '세륜시설', '자동식 · 침전조')
    칸(tx + k(34), ty + k(14), k(22), k(16), '자재 야적장', 'PC 플륨관 · 쇄석', 'ANSI31')
    칸(tx + k(3), ty + k(3), k(16), k(10), '장비 대기장', '굴삭기 0.6㎥')
    칸(tx + k(22), ty + k(3), k(11), k(9), '폐기물 보관', '덮개 · 분류')
    칸(tx + k(46), ty + k(3), k(11), k(8), '흡연구역', '모래통')
    기호(tx + k(18.3), ty + th - k(5), '소화기'); 기호(tx + k(36), ty + k(32), '소화기'); 기호(tx + k(51.5), ty + k(13), '소화기')
    기호(gx1 - 6.5, ty + th - 3, 'CCTV'); 기호(tx + tw - 3.5, ty + k(33), 'CCTV')
    기호(gx2 + 10, ty + th - 3, '게시판')
    # 비상 집결지 · 차량 동선(야적장 → 세륜 → 출입구 → 도로)
    jx, jy = tx + k(53), ty + th - k(6)
    m.add_circle((jx, jy), 4.0, dxfattribs={'layer': '표지', 'color': 3})
    글(m, jx, jy, '집결', 2.0, al=TA.MIDDLE_CENTER, c=3)
    글(m, jx, jy - 6.2, '비상 집결지', 1.9, al=TA.MIDDLE_CENTER, c=8)
    세x = tx + k(38)                                 # 세륜시설 가운데 — 차는 세륜을 지나 나감
    동 = [(tx + k(45), ty + k(30)), (tx + k(45), ty + k(37)), (세x, ty + k(37)), (세x, ty + th - k(2.5)), ((gx1 + gx2) / 2, ty + th - k(2.5)), ((gx1 + gx2) / 2, ry - 1)]
    선(m, 동, 층='주석', 굵기=25, lt='DASHED', c=30)
    ex_, ey_ = 동[-1]
    선(m, [(ex_ - 1.3, ey_ - 2.5), (ex_, ey_), (ex_ + 1.3, ey_ - 2.5)], 층='주석', 굵기=25, c=30)
    # 방위
    nx, ny = 268.0, 262.0
    m.add_circle((nx, ny), 7, dxfattribs={'layer': '주석', 'color': 7})
    선(m, [(nx, ny + 7), (nx - 2.6, ny - 4), (nx, ny - 1.5), (nx + 2.6, ny - 4)], 층='주석', 닫음=True, c=7)
    글(m, nx, ny + 10.5, 'N', 3.2, al=TA.MIDDLE_CENTER)
    글(m, 26, 268, '가설 · 안전시설 배치도', 5.0)
    글(m, 26, 261.5, 'S = 1 : 500', 2.8, c=8)
    # 오른쪽 기둥 — 범례 · 안전 관리
    lx = 300.0
    글(m, lx, 268, '범  례', 3.6)
    범례 = [('휀스', 'EGI 휀스 H=2.0m'), ('소화기', '소화기(ABC 3.3kg)'), ('CCTV', 'CCTV'), ('표지판', '공사 안내 · 우회 표지'),
          ('신호수', '교통 신호수'), ('라바콘', '라바콘 · 안전띠(5m 마다)'), ('경광등', '경광등(야간)'), ('게시판', '안전 게시판 · 비상 연락망'),
          ('동선', '차량 동선(세륜 → 출입구 → 도로)'), ('집결', '비상 집결지')]
    for i, (꼴, 말) in enumerate(범례):
        y = 259 - i * 7.2
        if 꼴 == '휀스':
            선(m, [(lx + 1, y), (lx + 9, y)], 층='휀스', 굵기=50); 선(m, [(lx + 4.2, y - 0.8), (lx + 5.8, y + 0.8)], 층='휀스', 굵기=18)
        elif 꼴 == '동선':
            선(m, [(lx + 1, y), (lx + 9, y)], 층='주석', 굵기=25, lt='DASHED', c=30); 선(m, [(lx + 7.5, y + 1.2), (lx + 9, y), (lx + 7.5, y - 1.2)], 층='주석', 굵기=25, c=30)
        elif 꼴 == '집결':
            m.add_circle((lx + 5, y), 2.0, dxfattribs={'layer': '표지', 'color': 3})
        else:
            기호(lx + 5, y, 꼴)
        글(m, lx + 13, y, 말, 2.5)
    글(m, lx, 180, '안 전 관 리', 3.6)
    for i, s in enumerate(['1. 도로 쪽은 라바콘 · 안전띠로 막고 양 끝에 신호수.',
                           '2. 야간엔 경광등 · 공사 안내 표지는 구간 앞뒤에.',
                           '3. 세륜시설을 거친 차만 도로로(흙 묻은 차 금지).',
                           '4. 소화기는 사무실 · 야적장 · 흡연구역 — 매달 점검.',
                           '5. 견본(가상 공사) — 실제 배치는 현장 여건대로.']):
        글(m, lx + 1, 172 - i * 6.4, s, 2.3)
    # 현장 개요(아래 왼쪽 빈 곳)
    글(m, 26, 50, '현 장 개 요', 3.4)
    for i, s in enumerate(['공 사 명 : 가상 ○○지구 배수로 정비공사(견본)', '공사 구간 : 군도 ○○호선 옆 L = 120m (No.0 ~ No.6)',
                           '가설 터 : 60 × 52m — 휀스 H=2.0m 로 둘러쌈 · 출입구 1곳']):
        글(m, 28, 43 - i * 6, s, 2.3)
    return 그림PDF(doc, '견본_가설안전시설배치도')


if __name__ == '__main__':
    for f in (시공상세도, 배치도):
        p = f()
        print('만듦', p, os.path.getsize(p))
