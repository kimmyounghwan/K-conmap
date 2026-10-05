"""📦 도면 3D 시험 도면 — 모두 «지어낸» 가상 현장입니다(남의 도면 아님). (2026-10-05)
   python tools/도면3d_시험도면.py <폴더>   (ezdxf 필요)

   만드는 것 (좌표 단위 m · 도면 머리 단위는 일부러 «mm» 로 적음 — 실제 도면들처럼)
     가상_측량도면.dxf      측량 좌표(가상 TM) · 측량점(높이 든 점 + 번호 · 표고 글자) · 수로 · 길 · 지번 · TBM
     가상_계획평면도.dxf    도면 좌표(돌리고 옮김 — 좌표 안 입힘) · 도곽 1장 · 수로 · 길 · 지번 · 측점 NO. · 측량점 몇 개
     가상_종횡단면도.dxf    도곽 3장 — 종평면도(위 평면 칸 · 아래 종단 표: 측점 · 지반고 · 계획고 · 누가거리) · 횡단면도(1/2) · (2/2) — 단면 옆 «S T A .» 표 · 양옆 눈금자
                           횡단은 «측점이 커지는 쪽을 보고» 그림(도면 오른쪽 = 진행 방향 오른쪽)
     가상_측량성과표.csv    점번호 · X(북) · Y(동) · 표고
   시험: node tools/시험_도면3d.mjs
"""
import ezdxf, math, os, sys, random

random.seed(7)
E0, N0 = 251200.0, 283400.0          # 가상 측량 좌표(TM 꼴)


def 수로점(t):
    """수로 중심선 — t(0~1) → (x, y) 현장 좌표(m, 원점 기준)"""
    pts = [(0, 0), (180, 30), (330, 95), (470, 190)]
    L = [math.dist(pts[i], pts[i + 1]) for i in range(3)]
    s = t * sum(L)
    for i in range(3):
        if s <= L[i] or i == 2:
            k = min(1, s / L[i])
            return (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k), (pts[i + 1][0] - pts[i][0]) / L[i], (pts[i + 1][1] - pts[i][1]) / L[i]
        s -= L[i]


def 수로길이():
    pts = [(0, 0), (180, 30), (330, 95), (470, 190)]
    return sum(math.dist(pts[i], pts[i + 1]) for i in range(3))


def 땅높이(x, y):
    return 3.2 + 0.004 * x - 0.002 * y + 0.4 * math.sin(x / 37.0) * math.cos(y / 29.0)


LEN = 수로길이()
# 측량점 — 수로 따라 좌우 · 번호 1~
측량점 = []
for i in range(36):
    t = i / 35
    (x, y), ux, uy = 수로점(t)
    off = (-9 if i % 2 else 9) + random.uniform(-1.5, 1.5)
    px, py = x - uy * off, y + ux * off
    측량점.append((str(i + 1), px, py, round(땅높이(px, py), 3)))
지번 = [('101-1답', 40, 45), ('101-2답', 120, 60), ('102답', 210, 85), ('103-4전', 290, 140), ('104구', 380, 175), ('105답', 430, 120), ('106-2전', 250, 20), ('107답', 90, -40)]
TBM = ('TBM-1', 260, 70, 4.512)


def 새도면():
    d = ezdxf.new('R2018')
    d.header['$INSUNITS'] = 4         # 일부러 mm 로 적음(실제 도면들도 그렇습니다)
    for ly, c in [('CL', 1), ('수로', 5), ('도로', 8), ('지번', 3), ('측점', 2), ('PointPnt', 6), ('PointNum', 7), ('PointElev', 7), ('기준점', 1),
                  ('FORM', 7), ('GROUND', 3), ('계획선', 5), ('TICK', 1), ('dt1', 7), ('STATION', 2), ('테이블', 7), ('구조물', 4)]:
        if ly not in d.layers:
            d.layers.add(ly, color=c)
    return d, d.modelspace()


def 그리기_현장(m, 변환, 측량=False, 측량점수=36, 측점글=True, h=1.0):
    """현장 그림 — 변환(x, y) → 도면 좌표"""
    T = lambda x, y: 변환(x, y)
    n = 60
    cl = [T(*수로점(i / n)[0]) for i in range(n + 1)]
    m.add_lwpolyline(cl, dxfattribs={'layer': 'CL'})
    for off, ly in [(-2.5, '수로'), (2.5, '수로'), (-12, '도로'), (-18, '도로'), (14, '도로')]:
        pts = []
        for i in range(n + 1):
            (x, y), ux, uy = 수로점(i / n)
            pts.append(T(x - uy * off, y + ux * off))
        m.add_lwpolyline(pts, dxfattribs={'layer': ly})
    # 필지 금
    for gx in range(-20, 500, 80):
        m.add_line(T(gx, -60), T(gx + 40, 230), dxfattribs={'layer': '지번'})
    for s, x, y in 지번:
        m.add_text(s, height=h * 1.5, dxfattribs={'layer': '지번', 'insert': T(x, y)})
    if 측점글:
        k = 0
        while k * 20 <= LEN:
            (x, y), ux, uy = 수로점(k * 20 / LEN)
            m.add_line(T(x - uy * 3, y + ux * 3), T(x + uy * 3, y - ux * 3), dxfattribs={'layer': '측점'})
            m.add_text(f'NO.{k}', height=h, dxfattribs={'layer': '측점', 'insert': T(x - uy * 5, y + ux * 5)})
            k += 1
    for name, x, y, z in 측량점[:측량점수]:
        X, Y = T(x, y)
        if 측량:
            m.add_point((X, Y, z), dxfattribs={'layer': 'PointPnt'})
        m.add_text(name, height=0.3 * h / 1.0 if 측량 else 0.6, dxfattribs={'layer': 'PointNum', 'insert': (X + 0.3, Y + 0.3)})
        m.add_text(f'{z:.3f}', height=0.3 if 측량 else 0.6, dxfattribs={'layer': 'PointElev', 'insert': (X + 0.3, Y - 0.5)})
    s, x, y, z = TBM
    X, Y = T(x, y)
    m.add_text(s, height=h, dxfattribs={'layer': '기준점', 'insert': (X + 1, Y + 1)})
    m.add_circle((X, Y), 0.8, dxfattribs={'layer': '기준점'})


def 도곽(m, x0, y0, w, h, 제목, 글높):
    m.add_lwpolyline([(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h)], close=True, dxfattribs={'layer': 'FORM'})
    m.add_lwpolyline([(x0 + w * 0.02, y0 + h * 0.03), (x0 + w * 0.98, y0 + h * 0.03), (x0 + w * 0.98, y0 + h * 0.97), (x0 + w * 0.02, y0 + h * 0.97)], close=True, dxfattribs={'layer': 'FORM'})
    m.add_line((x0 + w * 0.02, y0 + h * 0.09), (x0 + w * 0.98, y0 + h * 0.09), dxfattribs={'layer': 'FORM'})
    m.add_text('도 면 명', height=글높 * 0.5, dxfattribs={'layer': 'FORM', 'insert': (x0 + w * 0.70, y0 + h * 0.05)})
    m.add_text(제목, height=글높, dxfattribs={'layer': 'FORM', 'insert': (x0 + w * 0.76, y0 + h * 0.05)})
    m.add_text('공 사 명', height=글높 * 0.5, dxfattribs={'layer': 'FORM', 'insert': (x0 + w * 0.04, y0 + h * 0.05)})
    m.add_text('가상 배수로 정비(시험용)', height=글높 * 0.5, dxfattribs={'layer': 'FORM', 'insert': (x0 + w * 0.12, y0 + h * 0.05)})


def 측량도면(폴더):
    d, m = 새도면()
    그리기_현장(m, lambda x, y: (E0 + x, N0 + y), 측량=True, h=1.0)
    d.saveas(os.path.join(폴더, '가상_측량도면.dxf'))


def 계획평면도(폴더):
    d, m = 새도면()
    a = math.radians(-12)
    ox, oy = 5000.0, 8000.0          # 좌표 안 입힌 도면 좌표
    T = lambda x, y: (ox + x * math.cos(a) - y * math.sin(a), oy + x * math.sin(a) + y * math.cos(a))
    그리기_현장(m, T, 측량=False, 측량점수=12, h=1.5)
    # 도곽(1/1000 A1 · 841×594) — 그림을 둘러쌈
    도곽(m, ox - 160, oy - 260, 841, 594, '가상 배수로 계획평면도', 8)
    d.saveas(os.path.join(폴더, '가상_계획평면도.dxf'))
    return T


def 종횡단면도(폴더):
    d, m = 새도면()
    # ① 종평면도 박스(1/1000 · 841×594) — 위 평면 칸(수로가 가로가 되게 돌림), 아래 종단 표
    bx, by = 20000.0, 0.0
    도곽(m, bx, by, 841, 594, '가상 배수로 종평면도', 8)
    px0, py0, pw, ph = bx + 40, by + 330, 760, 230
    m.add_lwpolyline([(px0, py0), (px0 + pw, py0), (px0 + pw, py0 + ph), (px0, py0 + ph)], close=True, dxfattribs={'layer': '테이블'})
    a = math.radians(-20)
    T = lambda x, y: (px0 + 120 + x * math.cos(a) - y * math.sin(a), py0 + 120 + x * math.sin(a) + y * math.cos(a))
    그리기_현장(m, T, 측량=False, 측량점수=20, h=1.5)
    # 아래 종단 — 표 머리 + 지반선
    tx, ty = bx + 40, by + 70
    for i, 머리 in enumerate(['측 점', '지 반 고', '계 획 고', '누 가 거 리']):
        m.add_text(머리, height=3.4, dxfattribs={'layer': '테이블', 'insert': (tx, ty + i * 15)})
        m.add_line((tx - 5, ty + i * 15 - 3), (tx + 740, ty + i * 15 - 3), dxfattribs={'layer': '테이블'})
    prof = [(tx + 60 + k * 30, ty + 80 + 10 * 땅높이(*수로점(min(1, k * 20 / LEN))[0])) for k in range(int(LEN // 20) + 1)]
    m.add_lwpolyline(prof, dxfattribs={'layer': 'GROUND'})
    # 종단 표 값 — 측점 · 지반고 · 계획고 · 누가거리 (칸마다 같은 x)
    for k in range(int(LEN // 20) + 1):
        g = round(땅높이(*수로점(min(1, k * 20 / LEN))[0]), 2)
        x = tx + 60 + k * 30
        for i, v in enumerate([f'NO.{k}', f'{g:.2f}', f'{g - 1.6:.2f}', f'{k * 20:.2f}']):
            m.add_text(v, height=2.5, dxfattribs={'layer': '테이블', 'insert': (x, ty + i * 15)})
    # ② 횡단면도 박스 2장(1/100 · 84.1×59.4) — 단면 셋씩, 단면 옆에 «S T A .» 표, 양옆 눈금자
    k = 0
    for 장 in range(2):
        x0, y0 = 30000.0 + 장 * 95, 0.0
        도곽(m, x0, y0, 84.1, 59.4, f'가상 배수로 횡단면도({장 + 1}/2)', 0.9)
        for j in range(3):
            st = k * 20
            (x, y), ux, uy = 수로점(min(1, st / LEN))
            g = round(땅높이(x, y), 2)
            plan = round(g - 1.6, 2)
            cx, ys = x0 + 30, y0 + 9 + j * 16       # 표고 0 이 도면 y = ys (1 m = 1)
            Y = lambda z: ys + z
            for v in [0, 2, 4, 6]:                 # 눈금자 — 글자 가운데가 눈금
                for rx in (x0 + 6, x0 + 60):
                    m.add_text(str(v), height=0.3, dxfattribs={'layer': 'dt1', 'insert': (rx, Y(v) - 0.15)})
                    m.add_line((rx + 1.0, Y(v)), (rx + 1.6, Y(v)), dxfattribs={'layer': 'dt1'})
            # 도면 오른쪽(+o) = 측점이 커지는 쪽을 보고 오른쪽(진행 방향 (ux, uy) 의 오른쪽 = (uy, -ux)) — 실제 횡단면도와 같게
            gl = [(cx + o, Y(round(땅높이(x + uy * o, y - ux * o), 3))) for o in range(-18, 19, 2)]
            m.add_lwpolyline(gl, dxfattribs={'layer': 'GROUND'})
            m.add_lwpolyline([(cx - 3, Y(g)), (cx - 1.5, Y(plan)), (cx + 1.5, Y(plan)), (cx + 3, Y(g))], dxfattribs={'layer': '계획선'})
            # U형 수로(구조물) — 터파기 바닥에 앉힘: 바깥 2.0 × 1.2 · 안 1.6 × 1.0 (구조물 0.8 ㎡ + 물길 1.6 ㎡)
            P0 = plan
            m.add_lwpolyline([(cx - 1, Y(P0)), (cx + 1, Y(P0)), (cx + 1, Y(P0 + 1.2)), (cx + 0.8, Y(P0 + 1.2)), (cx + 0.8, Y(P0 + 0.2)),
                              (cx - 0.8, Y(P0 + 0.2)), (cx - 0.8, Y(P0 + 1.2)), (cx - 1, Y(P0 + 1.2))], close=True, dxfattribs={'layer': '구조물'})
            m.add_line((cx, Y(g) - 0.5), (cx, Y(g) + 0.5), dxfattribs={'layer': 'TICK'})
            m.add_text(f'NO.{k}+000', height=0.4, dxfattribs={'layer': 'STATION', 'insert': (cx - 1.5, ys - 1.6)})
            tx, ty = x0 + 46, ys + 1.0
            m.add_text('S T A .', height=0.3, dxfattribs={'layer': '0', 'insert': (tx, ty)})
            m.add_text(f'{k}+0.00', height=0.3, dxfattribs={'layer': '0', 'insert': (tx + 2.1, ty)})
            m.add_text('지 반 고', height=0.3, dxfattribs={'layer': '0', 'insert': (tx - 3, ty - 0.8)})
            m.add_text(f'{g:.2f}', height=0.3, dxfattribs={'layer': '0', 'insert': (tx - 0.1, ty - 0.8)})
            m.add_text('계 획 고', height=0.3, dxfattribs={'layer': '0', 'insert': (tx + 2.4, ty - 0.8)})
            m.add_text(f'{plan:.2f}', height=0.3, dxfattribs={'layer': '0', 'insert': (tx + 5.3, ty - 0.8)})
            k += 1
    d.saveas(os.path.join(폴더, '가상_종횡단면도.dxf'))


def 성과표(폴더):
    with open(os.path.join(폴더, '가상_측량성과표.csv'), 'w', encoding='utf-8') as f:
        f.write('점번호,X,Y,표고\n')
        for name, x, y, z in 측량점:
            f.write(f'{name},{N0 + y:.3f},{E0 + x:.3f},{z:.3f}\n')    # 측량 관례: X = 북, Y = 동


if __name__ == '__main__':
    폴더 = sys.argv[1] if len(sys.argv) > 1 else '.'
    os.makedirs(폴더, exist_ok=True)
    측량도면(폴더); 계획평면도(폴더); 종횡단면도(폴더); 성과표(폴더)
    print('만듦:', 폴더)
