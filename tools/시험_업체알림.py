# -*- coding: utf-8 -*-
"""🔎 G364 업체 장 «바로 알림»(IndexNow) 시험 — 소장님 「검색되게」
    python tools/시험_업체알림.py
① indexnow.take_once("corp") — 회차마다 DRIP 장씩 · 앞(낙찰 많은 업체)부터 · 한 번 알린 장은 다시 안 냄 · 다 내면 0
② prerender.py 가 구운 업체 장을 그 차례로 알릴 주소에 넣는지(글로 확인 — 실제 굽기는 클라우드 굽기 사본에서 98곳으로 확인)
보내지는 않습니다(상태 파일만 임시 폴더).
"""
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import indexnow  # noqa: E402

틀림 = 0


def 봐(c, m):
    global 틀림
    print(('  ✓ ' if c else '  ✗ ') + m)
    if not c:
        틀림 += 1


with tempfile.TemporaryDirectory() as d:
    indexnow.STATE = os.path.join(d, 'indexnow.json')
    길 = [f'/corp/%EA%B0%80%EC%83%81{i}' for i in range(300)]
    낸 = []
    for 회 in range(4):
        out, left = indexnow.take_once('corp', 길, n=120)
        낸.append((len(out), left))
        if 회 == 0:
            봐(out[0] == 길[0] and out[-1] == 길[119], '첫 회차 — 앞(낙찰 많은 업체) 120장')
    봐(낸 == [(120, 180), (120, 60), (60, 0), (0, 0)], '120 · 120 · 60 · 그다음 0 (한 번 알린 장은 다시 안 냄) ' + str(낸))
    out, left = indexnow.take_once('corp', 길 + ['/corp/%EC%83%88'], n=120)
    봐(out == ['/corp/%EC%83%88'] and left == 0, '새로 생긴 업체 장만 다음 회차에')
    out, _ = indexnow.take_once('naeyeok', ['/notice/1'], n=120)
    봐(out == ['/notice/1'], '다른 갈래(내역서) 와 따로 셈')

src = open(os.path.join(ROOT, 'prerender.py'), encoding='utf-8').read()
봐('corp_done.append(k)' in src, 'prerender — 구운 업체 장을 적음')
봐('indexnow.take_once("corp", co_paths)' in src and '+ co_new' in src, 'prerender — 업체 장을 알릴 주소에 더함')
봐('"업체": len(co_new), "업체남은것": co_left' in src, 'prerender — /indexnow-status.json 에 업체 · 업체 남은 것')
print('\n✓ 모두 맞음' if not 틀림 else f'\n✗ {틀림} 틀림')
sys.exit(1 if 틀림 else 0)
