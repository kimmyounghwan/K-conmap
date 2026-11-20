# -*- coding: utf-8 -*-
"""🧪 G804 종심제 셈(파이썬 쪽 — kcm_rules.종심갈래 · 균형가격 · 종심가격점수) — tools/종심셈_표.json 의 손셈 답과 같은지
   돌리기: python tools/시험_종심셈.py   (짝: tools/시험_종심셈.mjs 가 web/src/lib/종심셈.js 를 같은 표로 봄)"""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import kcm_rules as K

표 = json.load(open(os.path.join(ROOT, "tools", "종심셈_표.json"), encoding="utf-8"))
n = bad = 0


def ok(이름, c, got=None):
    global n, bad
    n += 1
    if not c:
        bad += 1
    print(("  ✓ " if c else "  ✗ ") + 이름 + ("" if c else " = " + json.dumps(got, ensure_ascii=False)[:300]))


print("① 균형가격(예규 제8조 · 조달청 제7조)")
for t in 표["균형가격"]:
    r = K.균형가격(t["금액"], t.get("예정"), t.get("같은금액", True))
    기 = t["기대"]
    if 기 is None:
        ok(t["이름"], r is None, r)
    else:
        ok(t["이름"], r is not None and all(r.get(k) == v for k, v in 기.items()), r)

print("② 가격점수([별표 3] · 조달청 [별표 4])")
for t in 표["가격점수"]:
    r = K.종심가격점수(t["투찰"], t["균형"], t["예정"], t["배점"], t.get("A", 1), t.get("B", 1))
    기 = t["기대"]
    ok(t["이름"], (r is None and 기 is None) or (r is not None and 기 is not None and abs(r - 기) < 1e-9), r)

print("③ 갈래 · 배점(조달청 [별표 1-1 ~ 1-5] · 행안부 예규 제3장)")
for t in 표["갈래"]:
    r = K.종심갈래(t["swin"], t["est"])
    기 = t["기대"]
    ok(f"{t['swin'][:40] or '(빈 글)'} · {t['est'] / 1e8:,.0f}억 → {기}", (r is None and 기 is None) or (r is not None and 기 is not None and list(r) == 기), r)

print(f"\n{'✗' if bad else '✓'} 시험_종심셈(파이썬) {n - bad}/{n}")
sys.exit(1 if bad else 0)
