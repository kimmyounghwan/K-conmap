#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
📏 G685d KCMS «실제 캐드» 시험 — 흉내 해석기(tools/시험_캐드고름리습.py)와 «같은 도면» 을 진짜 DXF 로 그려
  소장님 PC 의 AutoCAD 2023(화면 없이 도는 같은 엔진 accoreconsole — 캐드 설정 · 소장님 도면 · 작업 화면 자료 안 건드림)에서
  kcm.lsp 의 KCMS 를 그대로 돌린 csv 를 건설맵 lib(web/src/lib/캐드고름.js)로 읽어 «손셈 답» 과 견줌.
  흉내 해석기가 못 잡는 것(실제 캐드의 entget · write-line 글자 꼴)을 여기서 봄.

  ① 도면 만들기(클라우드 · ezdxf):  python3 tools/시험_캐드고름실제캐드.py --dxf <낼.dxf> --map <낼.json>
  ② 견주기(캐드가 쓴 csv):          python3 tools/시험_캐드고름실제캐드.py --csv <kcms_N.csv> --map <map.json>
  PC 에서 돌리는 bat 꼴은 docs/기록_2026-10.md «G685d» 줄 · 핸들은 DXF 그대로 이어짐(캐드가 바꾸면 «핸들 못 이음» 으로 알림)
"""
import importlib.util
import io
import json
import math
import os
import sys

뿌리 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_s = importlib.util.spec_from_file_location('kcms_lisp_test', os.path.join(뿌리, 'tools', '시험_캐드고름리습.py'))
L = importlib.util.module_from_spec(_s)
_s.loader.exec_module(L)


def 값(o, k):
    for x in o:
        if isinstance(x, L.Pair) and x.a == k:
            return x.d
        if isinstance(x, list) and x and x[0] == k:
            return tuple(x[1:])
    return None


def 머리값(o):
    return 값(o, 0), 값(o, 5), 값(o, 8)


def 그리기(dxf_path, map_path):
    import ezdxf
    doc = ezdxf.new('R2010', setup=True)
    doc.header['$INSUNITS'] = 4
    msp = doc.modelspace()
    층 = set()
    for o, _ in L.도면1:
        층.add(머리값(o[1] if isinstance(o, tuple) else o)[2])
    for n in sorted(층):
        if n not in doc.layers:
            doc.layers.add(n)
    b = doc.blocks.new('D1')
    b.add_lwpolyline([(0, 0), (900, 0), (900, 100), (0, 100)], close=True)
    b = doc.blocks.new('W1')
    b.add_line((0, 0), (1200, 0))
    익명 = doc.blocks.new_anonymous_block('U')
    익명.add_circle((0, 0), 200)
    짝 = {}
    for o, _ in L.도면1:
        if isinstance(o, tuple):   # 옛 폴리선(POLYLINE + VERTEX)
            _, 머, vs = o
            종, h, la = 머리값(머)
            꼴 = 값(머, 70) or 0
            점 = [(값(v, 10), 값(v, 42) or 0.0, 값(v, 70) or 0) for v in vs]
            점 = [p for p in 점 if not (p[2] & 16)]   # 스플라인 틀 점은 안 그림(시험 답과 같음 — 그려지지 않는 점)
            if 꼴 & 64:
                e = msp.add_polyface(dxfattribs={'layer': la})
                e.append_face([p[0] for p in 점][:3])
            elif 꼴 & 8:
                e = msp.add_polyline3d([p[0] for p in 점], dxfattribs={'layer': la})
            else:
                e = msp.add_polyline2d([(p[0][0], p[0][1]) for p in 점], close=bool(꼴 & 1), dxfattribs={'layer': la})
            짝[e.dxf.handle] = h
            continue
        종, h, la = 머리값(o)
        a = {'layer': la}
        if 종 == 'LINE':
            e = msp.add_line(값(o, 10), 값(o, 11), dxfattribs=a)
        elif 종 == 'LWPOLYLINE':
            점, 볼 = [], []
            for x in o:
                if isinstance(x, list) and x and x[0] == 10:
                    점.append([x[1], x[2], 0.0, 0.0, 0.0])
                elif isinstance(x, L.Pair) and x.a == 42 and 점:
                    점[-1][4] = x.d
            돌 = 값(o, 210) or (0.0, 0.0, 1.0)
            e = msp.add_lwpolyline([tuple(p) for p in 점], format='xyseb', close=bool((값(o, 70) or 0) & 1),
                                   dxfattribs={**a, 'elevation': 값(o, 38) or 0.0, 'extrusion': 돌})
        elif 종 == 'ARC':
            c = 값(o, 10)
            e = msp.add_arc((c[0], c[1]), 값(o, 40), math.degrees(값(o, 50)), math.degrees(값(o, 51)),
                            dxfattribs={**a, 'extrusion': 값(o, 210) or (0.0, 0.0, 1.0)})
        elif 종 == 'CIRCLE':
            c = 값(o, 10)
            e = msp.add_circle((c[0], c[1]), 값(o, 40), dxfattribs=a)
        elif 종 == 'ELLIPSE':
            e = msp.add_ellipse(값(o, 10), 값(o, 11), 값(o, 40), 값(o, 41), 값(o, 42), dxfattribs=a)
        elif 종 == 'INSERT':
            이름 = 값(o, 2)
            if 이름.startswith('*'):
                이름 = 익명.name
            e = msp.add_blockref(이름, 값(o, 10), dxfattribs=a)
            if (값(o, 70) or 0) > 1 or (값(o, 71) or 0) > 1:
                e.dxf.column_count = 값(o, 70) or 1
                e.dxf.row_count = 값(o, 71) or 1
                e.dxf.column_spacing = 1500.0
                e.dxf.row_spacing = 1500.0
        elif 종 == 'DIMENSION':
            p1, p2 = 값(o, 13), 값(o, 14)
            바꾼 = 값(o, 1) or '<>'
            if ((값(o, 70) or 0) & 7) == 1:      # 정렬 치수(꼴 1) — 괄호 없으면 «& (7 == 1)» 로 읽혀 늘 가로 치수가 됐음(G686 첫 실제 캐드 시험에서 찾음)
                d = msp.add_aligned_dim(p1=(p1[0], p1[1]), p2=(p2[0], p2[1]), distance=500, text=바꾼, dimstyle='EZDXF', dxfattribs=a)
            else:
                d = msp.add_linear_dim(base=(p1[0], max(p1[1], p2[1]) + 500), p1=(p1[0], p1[1]), p2=(p2[0], p2[1]), angle=math.degrees(값(o, 50) or 0.0),
                                       text=바꾼, dimstyle='EZDXF', dxfattribs=a)
            d.render()
            e = d.dimension
            if ((값(o, 70) or 0) & 7) == 1:
                e.dxf.dimtype = 1 | 32          # ezdxf 의 «정렬» 은 그 방향 회전 치수(꼴 0)로 씀 → 오토캐드가 정렬 치수(꼴 1)로 읽게 꼴만 바꿈(그림 · 두 점은 같음)
        elif 종 == 'HATCH':
            e = msp.add_hatch(color=1, dxfattribs=a)
            e.set_pattern_fill('ANSI31', scale=10)
            e.paths.add_polyline_path([(50000, 0), (51000, 0), (51000, 1000), (50000, 1000)], is_closed=True)
        elif 종 == 'SPLINE':
            e = msp.add_spline([(60000, 0), (61000, 1000), (62000, 0), (63000, 500)], dxfattribs=a)
        elif 종 == 'TEXT':
            e = msp.add_text(값(o, 1), dxfattribs={**a, 'insert': 값(o, 10), 'height': 250})
        elif 종 == 'MTEXT':
            글 = ''.join(str(x.d) for x in o if isinstance(x, L.Pair) and x.a in (3, 1))
            e = msp.add_mtext(글, dxfattribs={**a, 'insert': 값(o, 10), 'char_height': 250})
        else:
            raise SystemExit('모르는 종류 ' + str(종))
        짝[e.dxf.handle] = h
    doc.saveas(dxf_path)
    io.open(map_path, 'w', encoding='utf-8').write(json.dumps(짝, ensure_ascii=False, indent=1))
    print(f'도면 {dxf_path} · 객체 {len(짝)} · 핸들 짝 {map_path}')


def 견주기(csv_paths, map_path):
    짝 = json.load(io.open(map_path, encoding='utf-8'))
    결 = L.풀기(csv_paths)
    print('📏 G685d 실제 캐드 KCMS — 머리:', json.dumps(결['머리'], ensure_ascii=False))
    원래 = {x['핸들'] for x in 결['줄']}
    못 = [h for h in 원래 if h not in 짝]
    L.봄(not 못, f'캐드가 쓴 핸들이 DXF 핸들과 이어짐(못 이은 것 {len(못)}){" — " + ",".join(못[:8]) if 못 else ""}')
    for x in 결['줄']:
        x['핸들'] = 짝.get(x['핸들'], x['핸들'])
    고친답 = []
    메모 = (결['머리'][0].get('적요') or '') if 결['머리'] else ''
    for o, 답 in L.도면1:
        if 답 and '적요' in 답 and 메모:
            답 = {**답, '적요': 메모}          # KCMS 에 적요를 넣었으면 줄 적요 = 그 적요(lib 적요글 — 묶음 적요가 먼저)
        고친답.append((o, 답))
    L.견줌(결, 고친답, ' (실제 캐드)')
    검 = 결['검사']
    print('  검사:', json.dumps(검, ensure_ascii=False)[:600])
    print('  합:', json.dumps(결['합'], ensure_ascii=False))
    print('  알림:', json.dumps(결['알림'], ensure_ascii=False)[:800])
    print(f'\n결과: {len(L.됨)} 통과 · {len(L.틀)} 틀림')
    if L.틀:
        for t in L.틀:
            print('  ✗', t)
        sys.exit(1)


if __name__ == '__main__':
    a = sys.argv
    if '--dxf' in a:
        그리기(a[a.index('--dxf') + 1], a[a.index('--map') + 1])
    elif '--csv' in a:
        i = a.index('--csv')
        파일 = []
        for x in a[i + 1:]:
            if x.startswith('--'):
                break
            파일.append(x)
        견주기(파일, a[a.index('--map') + 1])
    else:
        print(__doc__)
