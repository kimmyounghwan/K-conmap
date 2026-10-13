"""🏞 BIM 물량 «토목 + 건물 한꺼번에» 예시 도면 — 모두 «지어낸» 가상 현장입니다(남의 도면 아님). (G225 · 2026-10-10)
   python tools/BIM_토목예시.py [폴더]   (ezdxf 필요 · 기본 폴더 = web/public/jeoksan)

   만드는 것 (토목 도면 좌표 단위 m · 머리 단위는 일부러 «mm» — 실제 도면들처럼 / 구조물 일반도는 1:1 mm)
     BIM예시_측량도면.dxf     측량 좌표(가상 TM) · 측량점 격자(높이 든 점 + 번호 · 표고) · 수로 · 길 · 지번 · TBM
     BIM예시_계획평면도.dxf   도면 좌표(−12° 돌리고 옮김) · 수로 중심선 · 측점 NO. · 지번 · 배수장 평면(작게 그대로)
     BIM예시_종횡단면도.dxf   종평면도 1장 + 횡단면도 9장(단면 26개 · 20 m 간격)
                              NO.0~9 U형 수로 2.0×1.2 · NO.10~13 박스(도로 밑) 2.4×2.0(안 1.8×1.4) · NO.14~25 U형 2.4×1.5
     BIM예시_배수장일반도.dxf 평면도(겹선 벽 · 방 셋 · 펌프 원) + 단면 A-A · B-B(EL 글자 · G.L)
     BIM예시_관리동평면도.dxf 🏢 G228 건축 평면만(부재 일람표 없음) — 1층 평면도 · 지붕층 평면도 · 층 높이표(FL+400 · FL+5,000)
                              계획평면도에도 같은 관리동 겹선 · 방 이름(전기실 · 발전기실 · 사무실 · 화장실)을 그려 둠 → 그 자리에 놓이는지 시험
     BIM예시_흙막이도.dxf     🧱 G229 가설 흙막이(H-PILE + 토류판) 평면도 1단 · 2단 + 전개도 + 규격 글자(H-298x201x9/14 · H-300x300x10/15)
   골조 건물은 BIM_예시_3층.dxf(tools/BIM_예시도면.py)를 같이 넣습니다.
   시험: node tools/시험_BIM물량.mjs ⑧
"""
import ezdxf, math, os, sys, random

random.seed(11)
E0, N0 = 251200.0, 283400.0          # 가상 측량 좌표(TM 꼴)
PTS = [(0, 0), (180, 30), (330, 95), (470, 190)]
SEG = [math.dist(PTS[i], PTS[i + 1]) for i in range(3)]
LEN = sum(SEG)
G = 20.0                              # 측점 간격


def 수로점(s):
    """측점 s(m) → (x, y), (ux, uy)"""
    s = max(0.0, min(LEN, s))
    for i in range(3):
        if s <= SEG[i] or i == 2:
            k = min(1.0, s / SEG[i])
            a, b = PTS[i], PTS[i + 1]
            return (a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k), ((b[0] - a[0]) / SEG[i], (b[1] - a[1]) / SEG[i])
        s -= SEG[i]


def 땅높이(x, y):
    return 3.2 + 0.004 * x - 0.002 * y + 0.35 * math.sin(x / 37.0) * math.cos(y / 29.0)


def 계획고(s):
    """수로 바닥(구조물 아래) 높이 — 고른 기울기"""
    return 1.55 + 0.0042 * s


def 단면꼴(k):
    """측점 번호 → 콘크리트 모양 [(바깥 줄), (구멍 줄)?] (o, z) m · z 는 바닥 기준 0"""
    if 10 <= k <= 13:                 # 박스(도로 밑)
        W, Hh, t = 2.4, 2.0, 0.3
        return [[(-W / 2, 0), (W / 2, 0), (W / 2, Hh), (-W / 2, Hh)], [(-W / 2 + t, t), (-W / 2 + t, Hh - t), (W / 2 - t, Hh - t), (W / 2 - t, t)]]
    if k >= 14:
        W, Hh, t = 2.4, 1.5, 0.25
    else:
        W, Hh, t = 2.0, 1.2, 0.2
    return [[(-W / 2, 0), (W / 2, 0), (W / 2, Hh), (W / 2 - t, Hh), (W / 2 - t, t), (-W / 2 + t, t), (-W / 2 + t, Hh), (-W / 2, Hh)]]


def 새도면():
    d = ezdxf.new('R2018')
    d.header['$INSUNITS'] = 4
    for ly, c in [('CL', 1), ('수로', 5), ('도로', 8), ('지번', 3), ('측점', 2), ('PointPnt', 6), ('PointNum', 7), ('PointElev', 7), ('기준점', 1),
                  ('FORM', 7), ('GROUND', 3), ('계획선', 5), ('TICK', 1), ('dt1', 7), ('STATION', 2), ('테이블', 7), ('구조물', 4), ('배수장', 4), ('관리동', 6), ('가시설', 1)]:
        if ly not in d.layers:
            d.layers.add(ly, color=c)
    return d, d.modelspace()


# 측량점 — 현장 둘레 격자(흔들림) · 수로 둘레는 촘촘히
측량점 = []
n = 0
for gx in range(-40, 541, 28):
    for gy in range(-70, 271, 26):
        x, y = gx + random.uniform(-6, 6), gy + random.uniform(-6, 6)
        # 수로에서 너무 먼 점은 뺌(현장 둘레만)
        best = min(math.hypot(x - 수로점(s)[0][0], y - 수로점(s)[0][1]) for s in range(0, int(LEN) + 1, 10))
        if best > 80:
            continue
        n += 1
        측량점.append((str(n), x, y, round(땅높이(x, y), 3)))
지번 = [('201-1답', 40, 45), ('201-2답', 120, 60), ('202답', 210, 85), ('203-4전', 290, 140), ('204구', 380, 175), ('205답', 430, 120), ('206-2전', 250, 20), ('207답', 90, -40)]
TBM = ('TBM-1', 260, 70, 4.512)

# 배수장 — 끝점 너머(수로 방향으로) 가운데 · 평면(mm) 그림을 이 자리로 돌려 놓음
(_ex, _ey), (_ux, _uy) = 수로점(LEN)
배수장가운데 = (_ex + _ux * 16.0, _ey + _uy * 16.0)
배수장각 = math.atan2(_uy, _ux)


def 배수장선():
    """배수장 평면 선(mm · 가운데 0) — 바깥 24 × 14 m · 벽 600 · 칸막이 400 · 방 셋(펌프실 둘 + 전기실) · 들어오는 물길 6 × 4 m"""
    L = []
    def 네모(x0, y0, x1, y1):
        L.extend([((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))])
    # 바깥 · 안쪽 면
    네모(-12000, -7000, 12000, 7000)
    # 방 셋 — 안쪽 면(벽 600 · 칸막이 400)
    네모(-11400, -6400, -3800, 6400)       # 펌프실 1
    네모(-3400, -6400, 4200, 6400)         # 펌프실 2
    네모(4600, -6400, 11400, 6400)         # 전기실
    # 들어오는 물길(왼쪽) — 벽 400 · 안 폭 3,200
    L.extend([((-18000, -2000), (-12000, -2000)), ((-18000, 2000), (-12000, 2000)), ((-18000, -1600), (-12000, -1600)), ((-18000, 1600), (-12000, 1600)),
              ((-18000, -2000), (-18000, -1600)), ((-18000, 1600), (-18000, 2000))])
    return L


def 배수장기계():
    C = []
    for cx in (-7600, 400):
        C.append(((cx, 0), 1500))
    return C


# 🏢 관리동(가상) — 바깥 22 × 10 m + 현관 3 × 2 m(아래로 튀어나옴) · 바깥벽 200 · 칸막이 150 · 방 넷 (mm · 왼쪽 아래 0)
관리동바깥 = [(0, 0), (16000, 0), (16000, -2000), (19000, -2000), (19000, 0), (22000, 0), (22000, 10000), (0, 10000)]
관리동안 = [(200, 200), (16200, 200), (16200, -1800), (18800, -1800), (18800, 200), (21800, 200), (21800, 9800), (200, 9800)]
관리동칸 = [((7925, 200), (7925, 9800)), ((8075, 200), (8075, 9800)), ((14925, 200), (14925, 9800)), ((15075, 200), (15075, 9800)),
          ((15075, 4425), (21800, 4425)), ((15075, 4575), (21800, 4575))]
관리동방 = [('전기실', 4000, 5000), ('발전기실', 11500, 5000), ('사무실', 18400, 7200), ('화장실', 18400, 2400)]
관리동가운데 = (11000, 4000)


def 관리동선():
    """관리동 1층 선(mm · 바깥 · 안 테두리 · 칸막이 겹선) — 가운데 0"""
    L = []
    for 줄 in (관리동바깥, 관리동안):
        for i in range(len(줄)):
            L.append((줄[i], 줄[(i + 1) % len(줄)]))
    L.extend(관리동칸)
    cx, cy = 관리동가운데
    return [((a[0] - cx, a[1] - cy), (b[0] - cx, b[1] - cy)) for a, b in L]


def 관리동정답():
    def 넓(r):
        return abs(sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r)))) / 2 / 1e6
    칸 = (9600 * 150 * 2 + (21800 - 15075) * 150) / 1e6
    return {'바닥': round(넓(관리동바깥), 3), '벽': round(넓(관리동바깥) - 넓(관리동안) + 칸, 3)}


def 그리기_현장(m, T, 측량=False, 측량점수=10 ** 6, h=1.0, 배수장=False):
    n = 80
    cl = [T(*수로점(i / n * LEN)[0]) for i in range(n + 1)]
    m.add_lwpolyline(cl, dxfattribs={'layer': 'CL'})
    for off, ly in [(-1.3, '수로'), (1.3, '수로'), (-12, '도로'), (-18, '도로'), (14, '도로')]:
        pts = []
        for i in range(n + 1):
            (x, y), (ux, uy) = 수로점(i / n * LEN)
            pts.append(T(x - uy * off, y + ux * off))
        m.add_lwpolyline(pts, dxfattribs={'layer': ly})
    for gx in range(-20, 500, 80):
        m.add_line(T(gx, -60), T(gx + 40, 230), dxfattribs={'layer': '지번'})
    for s, x, y in 지번:
        m.add_text(s, height=h * 1.5, dxfattribs={'layer': '지번', 'insert': T(x, y)})
    k = 0
    while k * G <= LEN + 1e-6:
        (x, y), (ux, uy) = 수로점(k * G)
        m.add_line(T(x - uy * 3, y + ux * 3), T(x + uy * 3, y - ux * 3), dxfattribs={'layer': '측점'})
        m.add_text(f'NO.{k}', height=h, dxfattribs={'layer': '측점', 'insert': T(x - uy * 5, y + ux * 5)})
        k += 1
    for name, x, y, z in 측량점[:측량점수]:
        X, Y = T(x, y)
        if 측량:
            m.add_point((X, Y, z), dxfattribs={'layer': 'PointPnt'})
        m.add_text(name, height=0.3 if 측량 else 0.6, dxfattribs={'layer': 'PointNum', 'insert': (X + 0.3, Y + 0.3)})
        m.add_text(f'{z:.3f}', height=0.3 if 측량 else 0.6, dxfattribs={'layer': 'PointElev', 'insert': (X + 0.3, Y - 0.5)})
    s, x, y, z = TBM
    X, Y = T(x, y)
    m.add_text(s, height=h, dxfattribs={'layer': '기준점', 'insert': (X + 1, Y + 1)})
    m.add_circle((X, Y), 0.8, dxfattribs={'layer': '기준점'})
    if 배수장:
        ca, sa = math.cos(배수장각), math.sin(배수장각)
        cx, cy = 배수장가운데
        P = lambda p: T(cx + (p[0] * ca - p[1] * sa) / 1000.0, cy + (p[0] * sa + p[1] * ca) / 1000.0)
        for a, b in 배수장선():
            m.add_line(P(a), P(b), dxfattribs={'layer': '배수장'})
        # 🧱 G230 가시설(흙막이) 선 — 배수장 둘레 27 × 18 m(흙막이도와 같은 자리)
        for a, b in (((-13500, -9000), (13500, -9000)), ((13500, -9000), (13500, 9000)), ((13500, 9000), (-13500, 9000)), ((-13500, 9000), (-13500, -9000))):
            m.add_line(P(a), P(b), dxfattribs={'layer': '가시설'})
        m.add_text('가시설(H-PILE + 토류판)', height=h * 0.6, dxfattribs={'layer': '가시설', 'insert': P((-13000, 9600))})
        # 🏢 관리동 — 배수장 왼쪽(진행 방향) 28 m · 같은 방향 · 방 이름 글자
        qx, qy = cx - sa * 28.0 - ca * 4.0, cy + ca * 28.0 - sa * 4.0
        Q = lambda p: T(qx + (p[0] * ca - p[1] * sa) / 1000.0, qy + (p[0] * sa + p[1] * ca) / 1000.0)
        for a, b in 관리동선():
            m.add_line(Q(a), Q(b), dxfattribs={'layer': '관리동'})
        gx, gy = 관리동가운데
        for 이름, x, y in 관리동방:
            m.add_text(이름, height=h * 0.6, dxfattribs={'layer': '관리동', 'insert': Q((x - gx - 600, y - gy))})


def 관리동평면도(폴더):
    """🏢 1:1 mm — 1층 평면도 · 지붕층 평면도(파라펫 겹선) · 층 높이표 · 통심선 — 부재 일람표 없음(건축 평면만)"""
    d = ezdxf.new('R2018')
    d.header['$INSUNITS'] = 4
    for ly, c in [('A-WALL', 7), ('A-GRID', 1), ('A-TEXT', 7), ('A-FORM', 8), ('A-DOOR', 3)]:
        d.layers.add(ly, color=c)
    m = d.modelspace()
    def 판(ox, 제목, 지붕=False):
        # 도곽
        m.add_lwpolyline([(ox - 8000, -12000), (ox + 30000, -12000), (ox + 30000, 16000), (ox - 8000, 16000)], close=True, dxfattribs={'layer': 'A-FORM'})
        # 통심선
        for x in (0, 8000, 15000, 22000):
            m.add_line((ox + x, -4000), (ox + x, 13000), dxfattribs={'layer': 'A-GRID'})
        for y in (0, 10000):
            m.add_line((ox - 3000, y), (ox + 25000, y), dxfattribs={'layer': 'A-GRID'})
        if 지붕:
            # 지붕 = 바깥 테두리 + 파라펫(150) 겹선
            for 줄 in (관리동바깥, [(150, 150), (16150, 150), (16150, -1850), (18850, -1850), (18850, 150), (21850, 150), (21850, 9850), (150, 9850)]):
                m.add_lwpolyline([(ox + x, y) for x, y in 줄], close=True, dxfattribs={'layer': 'A-WALL'})
            m.add_text('옥상 방수', height=300, dxfattribs={'layer': 'A-TEXT', 'insert': (ox + 9000, 5000)})
        else:
            for 줄 in (관리동바깥, 관리동안):
                m.add_lwpolyline([(ox + x, y) for x, y in 줄], close=True, dxfattribs={'layer': 'A-WALL'})
            for a, b in 관리동칸:
                m.add_line((ox + a[0], a[1]), (ox + b[0], b[1]), dxfattribs={'layer': 'A-WALL'})
            for 이름, x, y in 관리동방:
                m.add_text(' '.join(이름), height=300, dxfattribs={'layer': 'A-TEXT', 'insert': (ox + x - 600, y)})
            m.add_arc((ox + 16300, -1800), 900, 0, 90, dxfattribs={'layer': 'A-DOOR'})
        m.add_text(제목, height=600, dxfattribs={'layer': 'A-TEXT', 'insert': (ox + 7000, -8000)})
    판(0, '1층 평면도')
    판(45000, '지붕층 평면도', 지붕=True)
    # 층 높이표(단면 대신)
    tx = 90000
    m.add_text('층 높이', height=500, dxfattribs={'layer': 'A-TEXT', 'insert': (tx, 9000)})
    for i, (층, 높) in enumerate([('지붕층', 'FL+5,000'), ('1층', 'FL+400')]):
        y = 6000 - i * 3000
        m.add_text(층, height=400, dxfattribs={'layer': 'A-TEXT', 'insert': (tx, y)})
        m.add_text(높, height=300, dxfattribs={'layer': 'A-TEXT', 'insert': (tx, y - 700)})
    m.add_text('가상 관리동(시험용)', height=500, dxfattribs={'layer': 'A-TEXT', 'insert': (0, -11000)})
    d.saveas(os.path.join(폴더, 'BIM예시_관리동평면도.dxf'))


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
    d.saveas(os.path.join(폴더, 'BIM예시_측량도면.dxf'))


def 계획평면도(폴더):
    d, m = 새도면()
    a = math.radians(-12)
    ox, oy = 5000.0, 8000.0
    T = lambda x, y: (ox + x * math.cos(a) - y * math.sin(a), oy + x * math.sin(a) + y * math.cos(a))
    그리기_현장(m, T, 측량=False, 측량점수=14, h=1.5, 배수장=True)
    도곽(m, ox - 160, oy - 260, 841, 594, '가상 배수로 계획평면도', 8)
    d.saveas(os.path.join(폴더, 'BIM예시_계획평면도.dxf'))


def 종횡단면도(폴더):
    d, m = 새도면()
    # ① 종평면도 (1/1000 · 841×594) — 위 평면 칸 · 아래 종단 표
    bx, by = 20000.0, 0.0
    도곽(m, bx, by, 841, 594, '가상 배수로 종평면도', 8)
    px0, py0, pw, ph = bx + 40, by + 330, 760, 230
    m.add_lwpolyline([(px0, py0), (px0 + pw, py0), (px0 + pw, py0 + ph), (px0, py0 + ph)], close=True, dxfattribs={'layer': '테이블'})
    a = math.radians(-20)
    T = lambda x, y: (px0 + 120 + x * math.cos(a) - y * math.sin(a), py0 + 120 + x * math.sin(a) + y * math.cos(a))
    그리기_현장(m, T, 측량=False, 측량점수=20, h=1.5)
    tx, ty = bx + 40, by + 70
    for i, 머리 in enumerate(['측 점', '지 반 고', '계 획 고', '누 가 거 리']):
        m.add_text(머리, height=3.4, dxfattribs={'layer': '테이블', 'insert': (tx, ty + i * 15)})
        m.add_line((tx - 5, ty + i * 15 - 3), (tx + 800, ty + i * 15 - 3), dxfattribs={'layer': '테이블'})
    N = int(LEN // G)
    prof = [(tx + 60 + k * 27, ty + 80 + 10 * 땅높이(*수로점(k * G)[0])) for k in range(N + 1)]
    m.add_lwpolyline(prof, dxfattribs={'layer': 'GROUND'})
    for k in range(N + 1):
        g = round(땅높이(*수로점(k * G)[0]), 2)
        x = tx + 60 + k * 27
        for i, v in enumerate([f'NO.{k}', f'{g:.2f}', f'{계획고(k * G):.2f}', f'{k * G:.2f}']):
            m.add_text(v, height=2.2, dxfattribs={'layer': '테이블', 'insert': (x, ty + i * 15)})
    # ② 횡단면도 (1/100 · 84.1×59.4) — 장마다 단면 셋 · 단면 옆 «S T A .» 표 · 양옆 눈금자
    #    횡단은 «측점이 커지는 쪽을 보고» 그림(도면 오른쪽 = 진행 방향 오른쪽)
    k = 0
    장수 = (N + 1 + 2) // 3
    for 장 in range(장수):
        x0, y0 = 30000.0 + 장 * 95, 0.0
        도곽(m, x0, y0, 84.1, 59.4, f'가상 배수로 횡단면도({장 + 1}/{장수})', 0.9)
        for j in range(3):
            if k > N:
                break
            st = k * G
            (x, y), (ux, uy) = 수로점(st)
            g = round(땅높이(x, y), 2)
            P0 = round(계획고(st), 3)
            cx, ys = x0 + 30, y0 + 9 + j * 16
            Y = lambda z: ys + z
            for v in [0, 2, 4, 6]:
                for rx in (x0 + 6, x0 + 60):
                    m.add_text(str(v), height=0.3, dxfattribs={'layer': 'dt1', 'insert': (rx, Y(v) - 0.15)})
                    m.add_line((rx + 1.0, Y(v)), (rx + 1.6, Y(v)), dxfattribs={'layer': 'dt1'})
            gl = [(cx + o, Y(round(땅높이(x + uy * o, y - ux * o), 3))) for o in range(-18, 19, 2)]
            m.add_lwpolyline(gl, dxfattribs={'layer': 'GROUND'})
            꼴 = 단면꼴(k)
            W = max(p[0] for p in 꼴[0]) * 2
            # 터파기 계획선 — 구조물 바닥 아래 0.1 · 옆 0.5 띄우고 1:0.5 기울기로 땅까지
            바닥 = P0 - 0.1
            hw = W / 2 + 0.5
            깊 = max(0.3, g - 바닥)
            m.add_lwpolyline([(cx - hw - 0.5 * 깊, Y(g)), (cx - hw, Y(바닥)), (cx + hw, Y(바닥)), (cx + hw + 0.5 * 깊, Y(g))], dxfattribs={'layer': '계획선'})
            for ring in 꼴:
                m.add_lwpolyline([(cx + o, Y(P0 + z)) for o, z in ring], close=True, dxfattribs={'layer': '구조물'})
            m.add_line((cx, Y(g) - 0.5), (cx, Y(g) + 0.5), dxfattribs={'layer': 'TICK'})
            m.add_text(f'NO.{k}+000', height=0.4, dxfattribs={'layer': 'STATION', 'insert': (cx - 1.5, ys - 1.6)})
            tx2, ty2 = x0 + 46, ys + 1.0
            m.add_text('S T A .', height=0.3, dxfattribs={'layer': '0', 'insert': (tx2, ty2)})
            m.add_text(f'{k}+0.00', height=0.3, dxfattribs={'layer': '0', 'insert': (tx2 + 2.1, ty2)})   # 측점 표 값(NO 꼴 — 이름표 NO.k+000 과 같은 꼴)
            m.add_text('지 반 고', height=0.3, dxfattribs={'layer': '0', 'insert': (tx2 - 3, ty2 - 0.8)})
            m.add_text(f'{g:.2f}', height=0.3, dxfattribs={'layer': '0', 'insert': (tx2 - 0.1, ty2 - 0.8)})
            m.add_text('계 획 고', height=0.3, dxfattribs={'layer': '0', 'insert': (tx2 + 2.4, ty2 - 0.8)})
            m.add_text(f'{P0:.2f}', height=0.3, dxfattribs={'layer': '0', 'insert': (tx2 + 5.3, ty2 - 0.8)})
            k += 1
    d.saveas(os.path.join(폴더, 'BIM예시_종횡단면도.dxf'))


def 배수장일반도(폴더):
    """1:1 mm — 평면도(아래) · 단면 A-A(위 왼쪽 · 긴 쪽) · 단면 B-B(위 오른쪽 · 짧은 쪽)"""
    d = ezdxf.new('R2018')
    d.header['$INSUNITS'] = 4
    for ly, c in [('토목구조물', 7), ('기계', 3), ('글자', 7), ('중심선', 1), ('치수', 2)]:
        d.layers.add(ly, color=c)
    m = d.modelspace()
    GL, 바닥아래, 바닥위 = 5.0, -1.0, -0.4           # EL(m)
    for a, b in 배수장선():
        m.add_line(a, b, dxfattribs={'layer': '토목구조물'})
    for (cx, cy), r in 배수장기계():
        m.add_circle((cx, cy), r, dxfattribs={'layer': '기계'})
    m.add_text('평면도', height=900, dxfattribs={'layer': '글자', 'insert': (-3000, -10500)})
    # 자르는 선 — A-A(긴 쪽 · y=0) · B-B(짧은 쪽 · x=0)
    m.add_line((-19500, 0), (13500, 0), dxfattribs={'layer': '중심선'})
    m.add_text('A', height=700, dxfattribs={'layer': '글자', 'insert': (-20400, -350)})
    m.add_text('A', height=700, dxfattribs={'layer': '글자', 'insert': (13800, -350)})
    m.add_line((0, -8500), (0, 8500), dxfattribs={'layer': '중심선'})
    m.add_text('B', height=700, dxfattribs={'layer': '글자', 'insert': (-350, -9600)})
    m.add_text('B', height=700, dxfattribs={'layer': '글자', 'insert': (-350, 8900)})
    # 단면 — 도면 y = EL × 1000 + 띄움
    def 단면(x0, y0, 폭들, 이름):
        """폭들: 왼쪽부터 [(벽 시작, 벽 끝)] mm(단면 가로) · 바닥판 · 벽"""
        Y = lambda el: y0 + el * 1000
        xa, xb = 폭들[0][0], 폭들[-1][1]
        m.add_lwpolyline([(x0 + xa, Y(바닥아래)), (x0 + xb, Y(바닥아래)), (x0 + xb, Y(바닥위)), (x0 + xa, Y(바닥위))], close=True, dxfattribs={'layer': '토목구조물'})
        for a, b in 폭들:
            m.add_lwpolyline([(x0 + a, Y(바닥위)), (x0 + b, Y(바닥위)), (x0 + b, Y(GL)), (x0 + a, Y(GL))], close=True, dxfattribs={'layer': '토목구조물'})
        m.add_line((x0 + xa - 3000, Y(GL)), (x0 + xb + 3000, Y(GL)), dxfattribs={'layer': '토목구조물'})
        m.add_text('G.L(+)5.00', height=350, dxfattribs={'layer': '글자', 'insert': (x0 + xb + 600, Y(GL) + 150)})
        m.add_text('EL(-)0.40', height=350, dxfattribs={'layer': '글자', 'insert': (x0 + xb + 600, Y(바닥위) + 150)})
        m.add_text('EL(-)1.00', height=350, dxfattribs={'layer': '글자', 'insert': (x0 + xb + 600, Y(바닥아래) - 500)})
        m.add_text(이름, height=900, dxfattribs={'layer': '글자', 'insert': (x0 - 2500, Y(바닥아래) - 2800)})
    단면(0, 26000, [(-12000, -11400), (-3800, -3400), (4200, 4600), (11400, 12000)], '단면 A-A')
    단면(40000, 26000, [(-7000, -6400), (6400, 7000)], '단면 B-B')
    d.saveas(os.path.join(폴더, 'BIM예시_배수장일반도.dxf'))


def 흙막이도(폴더):
    """🧱 G229 · G230 1:1 mm — 가설 흙막이(H-PILE + 토류판) 평면도 1단 · 2단 + 전개도 + 단면도 + 규격 글자 (지어낸 가상 현장)
       배수장(24 × 14 m)을 둘러싼 굴착 27.0 × 18.0 m(둘레 90 m) · H-PILE C.T.C 1,800 → 50본 · 길이 9.0 m · 굴착 깊이 6.0 m
       토류판 두 줄(80 mm — 가운데 줄 둘레 90.0 m) · 띠장 두 줄(300 mm — 가운데 둘레 87.2 m) · 단마다
       버팀보 4개 × 17.0 m · 사보강 4개 × 3.0 m · 중간말뚝 4본(버팀보 가운데)
       평면에 배수장 벽(«배수장» 층)도 그림 — 계획평면도의 배수장 · 가시설 선과 같은 모양으로 현장 자리에 놓임
       단면도(1:1): 원지반 E.L 20.00 · 1단 19.00 · 2단 16.50 · 굴착 바닥 14.00 · 말뚝 20.00 ~ 11.00 · 중간말뚝 19.00 ~ 11.00(8.0 m)"""
    d = ezdxf.new('R2018')
    d.header['$INSUNITS'] = 4
    for ly, c in [('_측면말뚝', 1), ('_중간말뚝', 6), ('_토류판', 3), ('_띠장', 5), ('_버팀보', 4), ('_사보강재', 2), ('_지시', 7), ('_원지반선', 3), ('_굴착선', 1), ('FORM', 8), ('배수장', 8), ('_지층', 9), ('_치수', 2)]:
        d.layers.add(ly, color=c)
    m = d.modelspace()
    W, H, C = 27000, 18000, 1800

    def 네모(x0, y0, x1, y1, ly):
        m.add_lwpolyline([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], close=True, dxfattribs={'layer': ly})

    def H꼴(cx, cy, h, b, ly):
        # 웨브(세로 h) + 플랜지 둘(가로 b)
        m.add_line((cx, cy - h / 2), (cx, cy + h / 2), dxfattribs={'layer': ly})
        m.add_line((cx - b / 2, cy - h / 2), (cx + b / 2, cy - h / 2), dxfattribs={'layer': ly})
        m.add_line((cx - b / 2, cy + h / 2), (cx + b / 2, cy + h / 2), dxfattribs={'layer': ly})

    def 줄(a, b, ly, 폭):
        # 가운데 줄 a → b 를 폭만큼 두 줄로
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        nx, ny = -dy / L * 폭 / 2, dx / L * 폭 / 2
        m.add_line((a[0] + nx, a[1] + ny), (b[0] + nx, b[1] + ny), dxfattribs={'layer': ly})
        m.add_line((a[0] - nx, a[1] - ny), (b[0] - nx, b[1] - ny), dxfattribs={'layer': ly})

    def 평면(ox, 단):
        네모(ox - 12000, -10000, ox + 38000, 25350, 'FORM')          # 도곽(종이 비율 √2)
        # 배수장 벽(참고 · 흙막이 가운데)
        for a, b in 배수장선():
            m.add_line((ox + W / 2 + a[0], H / 2 + a[1]), (ox + W / 2 + b[0], H / 2 + b[1]), dxfattribs={'layer': '배수장'})
        # 말뚝 — 둘레 1,800 마다(모서리 포함 50본)
        for i in range(W // C):
            H꼴(ox + i * C, 0, 298, 201, '_측면말뚝'); H꼴(ox + W - i * C, H, 298, 201, '_측면말뚝')
        for j in range(H // C):
            H꼴(ox + W, j * C, 298, 201, '_측면말뚝'); H꼴(ox, H - j * C, 298, 201, '_측면말뚝')
        # 토류판 — 가운데 줄 ± 40
        네모(ox + 40, 40, ox + W - 40, H - 40, '_토류판'); 네모(ox - 40, -40, ox + W + 40, H + 40, '_토류판')
        # 띠장 — 안쪽 200 · 500
        네모(ox + 200, 200, ox + W - 200, H - 200, '_띠장'); 네모(ox + 500, 500, ox + W - 500, H - 500, '_띠장')
        # 버팀보 — x = 5.4 · 10.8 · 16.2 · 21.6 m · 띠장 안쪽 줄(y 500 ~ 17,500)
        for x in (5400, 10800, 16200, 21600):
            줄((ox + x, 500), (ox + x, H - 500), '_버팀보', 300)
            H꼴(ox + x, H / 2, 300, 300, '_중간말뚝')
        # 사보강 — 모서리마다 45° 3.0 m
        k = 3000 / math.sqrt(2)
        for (x, y, sx_, sy_) in ((500, 1500, 1, 1), (W - 500, 1500, -1, 1), (500, H - 1500, 1, -1), (W - 500, H - 1500, -1, -1)):
            a = (ox + x, y)
            줄(a, (a[0] + sx_ * k, a[1] - sy_ * k), '_사보강재', 300)
        t = lambda s_, x, y, h=350: m.add_text(s_, height=h, dxfattribs={'layer': '_지시', 'insert': (ox + x, y)})
        t('측면말뚝(H-298x201x9/14) C.T.C 1,800', 1000, -1500)
        t('띠장(H-300x300x10/15)', 1000, 2200)
        t('버팀보(H-300x300x10/15)', 11200, 13000)
        t('사보강(H-300x300x10/15)', 22000, 2500)
        t('중간말뚝(H-300x300x10/15)', 11200, 8000)
        t('굴착 깊이 : G.L (-) 5.50 ~ 6.50m', 1000, -3000)
        t(f'가설 흙막이 평면도({단}단)', 9000, -7500, 700)

    평면(0, 1)
    평면(60000, 2)
    # 전개도 — 둘레를 편 그림(가로 90 m) · 말뚝 세로선(9.0 m) · 원지반선 · 굴착선(6.0 m)
    oy = -30000
    네모(-6000, oy - 62000, 98000, oy + 11500, 'FORM')                # 도곽(종이 비율 √2)
    for i in range((2 * (W + H)) // C):
        x = i * C
        m.add_line((x - 100, oy), (x - 100, oy - 9000), dxfattribs={'layer': '_측면말뚝'})
        m.add_line((x + 100, oy), (x + 100, oy - 9000), dxfattribs={'layer': '_측면말뚝'})
    m.add_line((0, oy), (2 * (W + H), oy), dxfattribs={'layer': '_원지반선'})
    m.add_line((0, oy - 6000), (2 * (W + H), oy - 6000), dxfattribs={'layer': '_굴착선'})
    m.add_text('가설 흙막이 전개도', height=900, dxfattribs={'layer': '_지시', 'insert': (40000, oy - 14000)})
    m.add_text('가상 흙막이(시험용)', height=500, dxfattribs={'layer': '_지시', 'insert': (0, oy - 16000)})
    m.add_text('원지반선', height=350, dxfattribs={'layer': '_지시', 'insert': (2 * (W + H) + 500, oy)})
    m.add_text('굴착선', height=350, dxfattribs={'layer': '_지시', 'insert': (2 * (W + H) + 500, oy - 6000)})
    # 단면도 — 축척 1:1(가로 · 세로 같음) · 원지반 E.L 20.00 · 1단 버팀보 19.00 · 2단 16.50(가운데 10.8 m 만) · 굴착 14.00 · 말뚝 20.00 ~ 11.00 · 중간말뚝 19.00 ~ 11.00
    sx, sy = 10000, -160000                    # 표고 10.00 = sy
    Y = lambda el: sy + (el - 10.0) * 1000
    네모(-6000, sy - 15000, 98000, sy + 58500, 'FORM')
    for x in (sx, sx + W):
        for dx in (-100, 100):
            m.add_line((x + dx, Y(20.0)), (x + dx, Y(11.0)), dxfattribs={'layer': '_측면말뚝'})
    m.add_line((sx - 6000, Y(20.0)), (sx + W + 6000, Y(20.0)), dxfattribs={'layer': '_원지반선'})
    m.add_line((sx, Y(14.0)), (sx + W, Y(14.0)), dxfattribs={'layer': '_굴착선'})
    for el, x0, x1 in ((19.0, sx + 300, sx + W - 300), (16.5, sx + 8100, sx + 18900)):
        for dy in (-150, 150):
            m.add_line((x0, Y(el) + dy), (x1, Y(el) + dy), dxfattribs={'layer': '_버팀보'})
        for x in (sx + 150, sx + W - 450):
            네모(x, Y(el) - 150, x + 300, Y(el) + 150, '_띠장')
    for dx in (-150, 150):
        m.add_line((sx + 13500 + dx, Y(19.0)), (sx + 13500 + dx, Y(11.0)), dxfattribs={'layer': '_중간말뚝'})
    # 지층선 · 시추 기둥(눈금) — 도곽 안 그림이 되게(실제 단면도처럼)
    for el in (18.5, 15.0, 12.0):
        m.add_line((sx - 6000, Y(el)), (sx + W + 6000, Y(el)), dxfattribs={'layer': '_지층'})
    for k in range(24):
        m.add_line((sx - 4000, Y(20.0) - k * 400), (sx - 3600, Y(20.0) - k * 400), dxfattribs={'layer': '_치수'})
    m.add_line((sx - 3800, Y(20.0)), (sx - 3800, Y(10.4)), dxfattribs={'layer': '_치수'})
    tt = lambda s_, x, y, h=350: m.add_text(s_, height=h, dxfattribs={'layer': '_지시', 'insert': (x, y)})
    tt('토 사', sx - 5600, Y(19.2)); tt('풍화토', sx - 5600, Y(16.5)); tt('풍화암', sx - 5600, Y(13.5))
    tt('E.L 20.00', sx - 5000, Y(20.0) + 100)
    tt('E.L = 14.00', sx + 8000, Y(14.0) + 400)
    tt('E.L = 16.50', sx + 20000, Y(16.5) + 450)
    tt('버팀보(H-300x300x10/15)', sx + 3000, Y(19.0) + 600)
    tt('가설 흙막이 단면도', 40000, sy - 8000, 900)
    d.saveas(os.path.join(폴더, 'BIM예시_흙막이도.dxf'))


def 흙막이정답():
    """손 셈 — 강재(kg/m: H-298x201x9/14 65.4 · H-300x300x10/15 94.0) · 토류판 · 길이 · 터파기(가운데 줄 안 27 × 18)"""
    말 = 50 * 9.0
    중 = 4 * 8.0                      # 단면도 중간말뚝 19.00 ~ 11.00
    띠 = ((26.6 + 17.6) * 2 + (26.0 + 17.0) * 2) / 2
    버 = 4 * 17.0
    사 = 4 * 3.0
    t = (말 * 65.4 + (중 + 2 * (띠 + 버 + 사)) * 94.0) / 1000
    return {'말뚝': 50, '말뚝길이': 말, '중간말뚝': 4, '띠장': 띠, '버팀보': 버, '사보강': 사, '강재t': round(t, 4), '토류판': 90.0 * 6.0, '안넓이': 27.0 * 18.0}


def 배수장정답():
    """벽 넓이(평면 · ㎡) · 바닥 넓이 — 시험에서 맞춰 봄"""
    바깥 = 24 * 14
    방 = (7.6 * 12.8) + (7.6 * 12.8) + (6.8 * 12.8)
    물길벽 = 2 * 6 * 0.4            # 물길 안은 열려 있어(물이 들어오는 쪽) 바닥에 안 듦
    return {'바닥': 바깥 + 물길벽, '벽': 바깥 - 방 + 물길벽}


if __name__ == '__main__':
    폴더 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'public', 'jeoksan')
    os.makedirs(폴더, exist_ok=True)
    측량도면(폴더); 계획평면도(폴더); 종횡단면도(폴더); 배수장일반도(폴더); 관리동평면도(폴더); 흙막이도(폴더)
    print('만듦:', 폴더, '· 측량점', len(측량점), '· 단면', int(LEN // G) + 1, '· 길이', round(LEN, 1), '· 배수장 정답', 배수장정답(), '· 관리동 정답', 관리동정답(), '· 흙막이 정답', 흙막이정답())
