# -*- coding: utf-8 -*-
"""
⚡ 자동적산 시험 도면의 답을 «도면을 다시 읽어» 따로 잽니다 — ezdxf(호·볼록 그대로) + shapely(면적)
    python3 tools/자동적산_답셈.py   →  자동적산_답.json(만든 값으로 손셈)과 한 자리라도 다르면 알림
사이트 셈(web/src/lib)과는 아무것도 나누지 않습니다.
"""
import json
import math
import os
import sys
import ezdxf
from shapely.geometry import Polygon

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, '시험자료')
답 = json.load(open(os.path.join(D, '자동적산_답.json'), encoding='utf-8'))
배 = {'A': 1.0, 'B': 0.001, 'C': 0.001}       # 도면 단위 → m
틀림 = 0


def 같나(이름, a, b, tol=1e-6):
    global 틀림
    ok = abs(a - b) <= tol * max(1, abs(b))
    print(('✓' if ok else '✗'), 이름, round(a, 6), '=' if ok else '≠', round(b, 6))
    if not ok:
        틀림 += 1


def 길이(e):
    t = e.dxftype()
    if t == 'LINE':
        return math.dist(e.dxf.start, e.dxf.end)
    if t == 'ARC':
        a = (e.dxf.end_angle - e.dxf.start_angle) % 360
        return math.radians(a) * e.dxf.radius
    if t == 'CIRCLE':
        return 2 * math.pi * e.dxf.radius
    if t == 'LWPOLYLINE':
        return sum(L for L, _ in 토막들(e))
    return 0.0


def 토막들(e):
    """폴리선 토막마다 (길이, 활꼴 넓이) — 볼록 b: 중심각 θ = 4·atan|b|, 반지름 r = 현/(2·sin(θ/2)) · 활꼴 = r²/2·(θ − sinθ)"""
    pts = list(e.get_points('xyb'))
    n = len(pts)
    out = []
    for i in range(n if e.closed else n - 1):
        x1, y1, b = pts[i]
        x2, y2, _ = pts[(i + 1) % n]
        c = math.hypot(x2 - x1, y2 - y1)
        if abs(b) < 1e-12:
            out.append((c, 0.0))
            continue
        th = 4 * math.atan(abs(b))
        r = c / (2 * math.sin(th / 2))
        out.append((th * r, math.copysign(r * r / 2 * (th - math.sin(th)), b)))
    return out


def 면적(e):
    t = e.dxftype()
    if t == 'CIRCLE':
        return math.pi * e.dxf.radius ** 2
    if t == 'LWPOLYLINE' and e.closed:
        pts = list(e.get_points('xy'))
        a = sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1])) / 2
        활 = sum(s for _, s in 토막들(e))
        return abs(a + 활) if a >= 0 else abs(a - 활)
    return 0.0


for 벌 in 'ABC':
    doc = ezdxf.readfile(os.path.join(D, '자동적산_' + {'A': 'A_평면'}.get(벌, 벌) + '.dxf'))
    msp = doc.modelspace()
    k = 배[벌]
    for ly, v in 답[벌].get('길이', {}).items():
        s = sum(길이(e) for e in msp.query('LINE ARC LWPOLYLINE[layer=="%s"]' % ly) if e.dxf.layer == ly) * k
        같나(벌 + ' 길이 ' + ly, s, v)
    for ly, v in 답[벌].get('면적', {}).items():
        s = sum(면적(e) for e in msp if e.dxf.layer == ly) * k * k
        같나(벌 + ' 면적 ' + ly, s, v, 1e-6)
    # 블록 개수 — 모형 공간에 바로 넣은 것 + 다른 블록 안에 든 것(그 블록을 넣은 만큼) · 0.5배 미만 사본(위치도) 안은 뺌
    def 세기(블, 배율, 셈):
        for e in 블:
            if e.dxftype() != 'INSERT':
                continue
            s = 배율 * abs(e.dxf.xscale)
            if s < 0.5 or e.dxf.name == '범례':           # 위치도(축소 사본) · 범례 안은 물량 아님
                continue
            n = e.dxf.get('row_count', 1) * e.dxf.get('column_count', 1)   # MINSERT
            셈[e.dxf.name] = 셈.get(e.dxf.name, 0) + n
            if e.dxf.name != '보안등':                       # 보안등 안의 등기구는 부품
                for _ in range(n):
                    세기(doc.blocks[e.dxf.name], s, 셈)
        return 셈
    셈 = 세기(msp, 1.0, {})
    for b, v in 답[벌].get('블록', {}).items():
        같나(벌 + ' 블록 ' + b, 셈.get(b, 0), v)
    if 벌 == 'B':
        for e in msp.query('LWPOLYLINE[layer=="A-실"]'):
            pg = Polygon([(x, y) for x, y in e.get_points('xy')])
            이름 = [t.dxf.text for t in msp.query('TEXT[layer=="A-실명"]') if pg.contains(__import__('shapely.geometry', fromlist=['Point']).Point(t.dxf.insert[0] + 100, t.dxf.insert[1] + 100))]
            if 이름:
                같나('B 실 면적 ' + 이름[0], pg.area * k * k, 답['B']['실'][이름[0]]['면적'])
                같나('B 실 둘레 ' + 이름[0], pg.length * k, 답['B']['실'][이름[0]]['둘레'])
print('따로 잰 값', '모두 같음' if not 틀림 else '틀림 %d' % 틀림)
sys.exit(1 if 틀림 else 0)
