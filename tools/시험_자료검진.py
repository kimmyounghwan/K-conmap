# -*- coding: utf-8 -*-
"""🧪 G218 (2026-10-09) 자료 검진 · 틀린 칸만 지난 좋은판 — 오늘 겪은 사고를 «잡는지» 로 잠급니다.
  돌리기: python tools/시험_자료검진.py   (올리기 bat 이 올리기 전에 돌립니다 — 틀리면 멈춤)
"""
import importlib.util
import json
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("검진", os.path.join(ROOT, "tools", "자료검진.py"))
K = importlib.util.module_from_spec(spec)
spec.loader.exec_module(K)

틀림 = []
셈 = [0]


def 봄(이름, 참, 덧=""):
    셈[0] += 1
    print(("✓ " if 참 else "✗ ") + 이름 + (f" — {덧}" if 덧 else ""))
    if not 참:
        틀림.append(이름)


오늘 = datetime(2026, 10, 9, 19, 0)
기본 = {"달": {"2026-06": [14739, 14739, 6770], "2026-07": [11124, 11122, 4906], "2026-08": [7855, 7847, 1148],
               "2026-09": [6782, 388, 0], "2026-10": [1200, 0, 0]},
        "지역": [21608, 4447], "업체": 69844, "기관": 4960}


def 고침(**kw):
    v = json.loads(json.dumps(기본))
    for k, x in kw.items():
        v[k] = x
    return v


r = K.판정(기본, json.loads(json.dumps(기본)), 오늘)["red"]
봄("정상 — 빨간불 없음", not r["corp"] and not r["agency"], str(r))
# 오늘의 사고 ① — 9월 번호를 통째로 버림
v = 고침(); v["달"]["2026-09"] = [6782, 6782, 6782]
r = K.판정(v, 기본, 오늘)["red"]
봄("사고 ① 9월 번호 통째 버림 → 업체 빨강 · 기관은 초록", bool(r["corp"]) and not r["agency"], r["corp"][0] if r["corp"] else "")
# 지난 달 건수가 줄어듦(읽기 실수로 줄이 빠짐)
v = 고침(); v["달"]["2026-07"] = [5000, 5000, 2000]
r = K.판정(v, 기본, 오늘)["red"]
봄("지난 달 건수 줄어듦 → 업체 · 기관 빨강", bool(r["corp"]) and bool(r["agency"]))
# 같은 달 빈 번호가 늘어남(번호가 다시 빠짐)
v = 고침(); v["달"]["2026-08"] = [7855, 7847, 6000]
r = K.판정(v, 기본, 오늘)["red"]
봄("같은 달 빈 번호 늘어남 → 업체 빨강", bool(r["corp"]) and not r["agency"])
# 빈 달
v = 고침(); v["달"]["2026-08"] = [0, 0, 0]
r = K.판정(v, {}, 오늘)["red"]
봄("3년 창 안 빈 달 → 둘 다 빨강", bool(r["corp"]) and bool(r["agency"]))
# 지역
r = K.판정(고침(지역=[21608, 7000]), 기본, 오늘)["red"]
봄("지역 못 정함 20% → 32%(좋은판 +5%p 넘음) → 업체 빨강", bool(r["corp"]))
r = K.판정(고침(지역=[21608, 5000]), 기본, 오늘)["red"]
봄("지역 못 정함 20% → 23%(작은 흔들림) → 그대로", not r["corp"])
# 수
r = K.판정(고침(업체=50000), 기본, 오늘)["red"]
봄("업체 수 28% 줆 → 업체 빨강 · 기관 초록", bool(r["corp"]) and not r["agency"])
# 이번 달(진행 중)은 줄어도 안 따짐
v = 고침(); v["달"]["2026-10"] = [10, 0, 0]
r = K.판정(v, 기본, 오늘)["red"]
봄("진행 중인 이번 달은 건수로 안 따짐", not r["corp"] and not r["agency"])

# ── 실제로 바꿔 끼우는가 (임시 폴더) ──
with tempfile.TemporaryDirectory() as d:
    data = os.path.join(d, "web", "public", "data")
    store = os.path.join(d, "data", "store")
    for k in ("corp", "agency"):
        os.makedirs(os.path.join(data, k))
        open(os.path.join(data, k, "0.json"), "w").write(f'{{"{k}":"좋은"}}')
    os.makedirs(store)
    now = (datetime.now(timezone.utc) + timedelta(hours=9)).strftime("%Y-%m-%d %H:%M")
    json.dump(dict(기본, at=now), open(os.path.join(store, "검진_재료.json"), "w"))
    out = os.path.join(d, "out.txt")
    g = K.main(root=d, out=out)
    봄("초록 회차 → 좋은판 저장(업체 · 기관)", os.path.exists(os.path.join(store, "좋은판", "corp.tar.gz"))
       and os.path.exists(os.path.join(store, "좋은판", "agency.tar.gz")), str(g["한일"]))
    # 다음 회차: 업체 자료가 틀어짐
    open(os.path.join(data, "corp", "0.json"), "w").write('{"corp":"틀림"}')
    open(os.path.join(data, "agency", "0.json"), "w").write('{"agency":"새것"}')
    v = dict(기본, at=now); v["달"] = dict(기본["달"]); v["달"]["2026-09"] = [6782, 6782, 6782]
    json.dump(v, open(os.path.join(store, "검진_재료.json"), "w"))
    g = K.main(root=d, out=out)
    봄("빨간 칸(업체)만 지난 좋은판으로 바꿔 끼움", open(os.path.join(data, "corp", "0.json")).read() == '{"corp":"좋은"}',
       open(os.path.join(data, "corp", "0.json")).read())
    봄("초록 칸(기관)은 새것 그대로", open(os.path.join(data, "agency", "0.json")).read() == '{"agency":"새것"}')
    o = open(out, encoding="utf-8").read()
    봄("결과를 GITHUB_OUTPUT 에 적음(red=corp)", "red=corp" in o, o.splitlines()[-3] if o else "")
    # 재료가 없으면(build_json 이 못 남김) — 아무것도 안 바꿈
    os.remove(os.path.join(store, "검진_재료.json"))
    open(os.path.join(data, "corp", "0.json"), "w").write('{"corp":"새것2"}')
    g = K.main(root=d, out=out)
    봄("재료 없음 → 검사 못 돎 · 아무것도 안 바꿈", g["broken"] == 1 and open(os.path.join(data, "corp", "0.json")).read() == '{"corp":"새것2"}')

print(f"\n{셈[0]}개 중 틀림 {len(틀림)}")
sys.exit(1 if 틀림 else 0)
