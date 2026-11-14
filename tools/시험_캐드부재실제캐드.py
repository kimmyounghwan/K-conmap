#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🧱 G686 «캐드 → 골조 모델 부재» 실제 캐드 시험 — 가상 구조 평면(기둥 · 보 · 벽 · 슬라브 · 기초 · 방수)을 진짜 DXF 로 그려
  소장님 PC 의 AutoCAD 2023(화면 없이 도는 같은 엔진 accoreconsole · /isolate — 캐드 설정 · 소장님 도면 안 건드림)에서
  레이어마다 KCMS 를 «적요(«1층 기둥 C1» · «2층 보 G1» …)» 와 함께 돌린 csv 를 tools/시험_캐드부재실제캐드.mjs 가
  건설맵 lib(적요풀기 → 부재넣기 → 부재로세우기 → 모델셈)로 읽어 «같은 도형을 건설맵이 직접 쓴 KCMS 글» 과 같은 모델 · 같은 물량인지 견줌.

  ① 만들기(클라우드 · ezdxf):  python3 tools/시험_캐드부재실제캐드.py <낼 폴더>   → kcmb_test.dxf · kcmb.scr(CP949) · kcmb_map.json
  ② 견주기:                     node tools/시험_캐드부재실제캐드.mjs <캐드가 쓴 csv 폴더> <kcmb_map.json>
  PC 에서 돌리는 꼴 = G686b bat · ps1 와 같음(/isolate · USERPROFILE · APPDATA 를 이 시험 프로세스에만 · 레지스트리 앞뒤 견줌 · 시험 폴더 지움)
"""
import json
import os
import sys

T = '\t'
# 가상 구조 평면(실제 현장 아님) — mm · 통심 X 0 · 6000 · Y 0 · 5000
기둥점 = [(0, 0), (6000, 0), (6000, 5000), (0, 5000)]
묶음 = [
    # (레이어, 적요, 도형들) — 도형: ('rect', x0, y0, x1, y1) · ('line', x0, y0, x1, y1) · ('text', x, y, 글)
    ('S-COL', '1층 기둥 C1', [('rect', x - 300, y - 300, x + 300, y + 300) for x, y in 기둥점] + [('text', x, y, 'C1') for x, y in 기둥점]),
    ('S-BEAM', '2층 보 G1', [('line', 300, -200, 5700, -200), ('line', 300, 200, 5700, 200),           # 기둥 면까지 그린 두 선(간격 400 = 폭)
                             ('line', 6000, 300, 6000, 4700), ('line', 0, 5000, 6000, 5000)]),        # 가운데 줄 한 선(폭 = 일람)
    ('S-WALL', '1층 벽 W1', [('line', -100, 300, -100, 4700), ('line', 100, 300, 100, 4700)]),         # 두 선(간격 200 = 두께)
    ('S-SLAB', '2층 슬라브 S1 T150', [('rect', 0, 0, 6000, 5000)]),
    ('S-FDN', '기초 F1', [('rect', x - 1000, y - 1000, x + 1000, y + 1000) for x, y in 기둥점] + [('text', x, y + 500, 'F1') for x, y in 기둥점]),
    ('A-방수', '지붕층 액체방수', [('rect', 0, 0, 6000, 5000)]),
]
연달아 = {'레이어': 'S-COL', '적요': ['연달아 보냄 A', '연달아 보냄 B']}     # 같은 번호(안 받은 것) 시험 — 수량만(부재 말 없음)


def 그리기(낼):
    import ezdxf
    doc = ezdxf.new('R2010', setup=True)
    doc.header['$INSUNITS'] = 4
    msp = doc.modelspace()
    이상 = []
    for 레, 적, 도형들 in 묶음:
        if 레 not in doc.layers:
            doc.layers.add(레)
        줄 = []
        for d in 도형들:
            if d[0] == 'rect':
                _, x0, y0, x1, y1 = d
                e = msp.add_lwpolyline([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], close=True, dxfattribs={'layer': 레})
                줄.append(['LWPOLYLINE', 레, e.dxf.handle, '1', '0', f'{x0},{y0},0;{x1},{y0},0;{x1},{y1},0;{x0},{y1},0', '', '', ''])
            elif d[0] == 'line':
                _, x0, y0, x1, y1 = d
                e = msp.add_line((x0, y0, 0), (x1, y1, 0), dxfattribs={'layer': 레})
                줄.append(['LINE', 레, e.dxf.handle, '0', '0', f'{x0},{y0};{x1},{y1}', '0,0', '', ''])
            else:
                _, x, y, 글 = d
                e = msp.add_text(글, dxfattribs={'layer': 레, 'height': 250, 'insert': (x, y)})
                줄.append(['TEXT', 레, e.dxf.handle, '0', '0', f'{x},{y}', '250', 글, ''])
        이상.append({'레이어': 레, '적요': 적, '글': T.join(['KCMSEL', '1', 'C:\\가상\\kcmb_test.dxf', '4', 적, str(len(줄)), '24.3', 'AutoCAD']) + '\r\n' + '\r\n'.join(T.join(c) for c in 줄) + '\r\n'})
    dxf = os.path.join(낼, 'kcmb_test.dxf')
    doc.saveas(dxf)
    # 스크립트 — 레이어마다: «이전 고름» 을 그 레이어로 만들어 두고(명령 줄 LISP — SELECT 에 ssget "X") → KCMS → _P(이전) · 엔터 → 적요 · 사이에 DELAY
    #   ⚠️ KCMS 의 «객체 선택» 에 LISP 식을 바로 넣으면 «LISP을 재입력할 수 없습니다»(KCMS 가 LISP 명령이라 · G686c 첫 시험에서 멈춤) → 이전(_P)으로 고름
    고름 = lambda 레: f'(command "_.SELECT" (ssget "X" \'((8 . "{레}"))) "")'
    s = ['SECURELOAD', '0', '(load "C:/Users/Public/kcmtest/kcm.lsp")']
    for 레, 적, _ in 묶음:
        s += [고름(레), 'KCMS', '_P', '', 적, 'DELAY', '1500']
    # 같은 번호 — 지금 시각 번호(k · k+1)에 «안 받은 것» 자리를 미리 두고 연달아 두 번 보냄(DELAY 없이) → 리습이 자리를 덮지 않고 다른 번호에 써야 함
    s += ['(setq kk (rem (fix (* 100000 (rem (getvar "DATE") 1))) 500))',
          '(foreach j (list kk (rem (1+ kk) 500)) (setq kf (open (strcat (getenv "USERPROFILE") "\\\\Downloads\\\\K-conmap\\\\kcms_" (itoa j) ".txt") "w")) (write-line "PLACE" kf) (close kf))',
          고름(연달아['레이어']), 'KCMS', '_P', '', 연달아['적요'][0], 'KCMS', '_P', '', 연달아['적요'][1]]
    # 다운로드 자리(리습 kcms-dl — 윈도 «User Shell Folders» 를 캐드가 어떤 꼴로 주는지 · 펼친 자리)도 적음
    s += ['(setq kr (if vl-registry-read (vl-registry-read "HKEY_CURRENT_USER\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Explorer\\\\User Shell Folders" "{374DE290-123F-4565-9164-39C4925E467B}")))',
          '(setq kf (open "C:/Users/Public/kcmtest/after.txt" "w"))',
          '(write-line (strcat "FOLDER=" (if kcms-folder "T" "nil") " KK=" (itoa kk) " VLREG=" (if vl-registry-read "T" "nil")) kf)',
          '(write-line (strcat "REG=" (if (eq (type kr) (quote STR)) kr "nil")) kf)', '(write-line (strcat "DL=" (kcms-dl)) kf)', '(write-line (strcat "D=" kcms-d) kf)',
          '(close kf)', '_.QUIT', '_Y', '']
    with open(os.path.join(낼, 'kcmb.scr'), 'wb') as f:
        f.write('\r\n'.join(s).encode('cp949'))
    with open(os.path.join(낼, 'kcmb_map.json'), 'w', encoding='utf-8') as f:
        json.dump({'묶음': 이상, '연달아': {**연달아, '개수': next(len(d) for 레, _, d in 묶음 if 레 == 연달아['레이어'])}, '자리': 2}, f, ensure_ascii=False, indent=1)
    print('그림:', dxf, '· 묶음', len(이상), '· 스크립트 kcmb.scr(CP949) · 이상 글 kcmb_map.json')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('쓰는 법: python3 tools/시험_캐드부재실제캐드.py <낼 폴더>')
    os.makedirs(sys.argv[1], exist_ok=True)
    그리기(sys.argv[1])
