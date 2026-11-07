# -*- coding: utf-8 -*-
"""⚖ G581(2026-11-07) 마감된 공고 채점도 공고 화면과 같은 A값 — 수집 쪽(collect.py) 시험.

  소장님 「나머지도 고쳐 줘」(G578 · G579 · G580 뒤 남은 것):
  ① 마감된(개찰) 100억 넘는 적격심사 공고 — G578(11-07) 앞에 마감돼 A값에 표준시장단가가 빠진 채 남은 줄(1순위 7주치 54건)
     → 개별조회가 개찰 7주치에서 «smk 없음 · 100억 넘음 · 하한율 있음» 줄을 한 번 다시 물어 A값 · smk 를 바로잡음(맨 앞 · 3시간 안에 물은 것은 차례대로)
  ② 마감된 A값 적용 공고인데 A값이 없는 줄(az 없음) — A값 0원인지 한 번 물음
  ③ bidresult(최근 7일 개찰 · 채점 자료) 맨 뒤에 az · smk — 화면 채점이 «A 0원» 을 알고 «표준시장단가 모름» 을 막게
  돌리기: python tools/시험_마감채점.py   (올리기 bat 이 올리기 전에 돌립니다 — 틀리면 멈춤)
"""
import io
import os
import re
import sys
import textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
틀림 = []
셈 = [0]


def 봄(이름, 참, 덧=""):
    셈[0] += 1
    print(("✓ " if 참 else "✗ ") + 이름 + (f" — {덧}" if 덧 else ""))
    if not 참:
        틀림.append(이름)


src = io.open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read().replace("\r\n", "\n")
i0 = src.index("def pick(item, *names):")
i1 = src.index("# ─────────────────────────────────────────────────────────────\n#  누락 방지 두 가지")
ns = {}
exec(compile(src[i0:i1], "collect.py(일부)", "exec"), ns)
표준대상 = ns["표준대상"]
to_f = ns["to_f"] if "to_f" in ns else None
if to_f is None:
    k = src.index("def to_f(v):")
    exec(compile(src[k:src.index("\n\n\n", k)], "collect.py(to_f)", "exec"), ns)
    to_f = ns["to_f"]

# ① · ② 개찰 7주치 고르기 — 블록을 그대로 꺼내 가상 줄에 돌려 봄
k0 = src.index("        # ⚖ G581 개찰 7주치 전체에서")
k1 = src.index("    seen = set()\n    uniq = []", k0)
블록 = textwrap.dedent(src[k0:k1])
봄("① 블록이 «for r in rows:»(MAX_ROWS 로 자르지 않음 — 7주치 전체)", 블록.lstrip().splitlines()[1].startswith("for r in rows:"), 블록.splitlines()[1])


def 고르기(줄들):
    env = {"rows": 줄들, "todo": [], "kind": "con", "앞": set(), "표준대상": 표준대상, "to_f": to_f,
           "todo_why": {"개찰 표준시장단가": 0, "개찰 A값 0원 확인": 0}}
    exec(compile(블록, "G581 블록", "exec"), env)
    return env


줄 = lambda **k: dict({"no": "R00TEST58100", "base": 22500000000, "est": 20200000000, "llr": 81.995, "aval": 1380000000, "ayn": "Y"}, **k)
e = 고르기([줄(no="A1"), 줄(no="A2", smk="Y"), 줄(no="A3", smk="N"), 줄(no="A4", llr=None), 줄(no="A5", est=5e9, base=5.5e9),
           줄(no="A6", kind="취소공고"), 줄(no="A7", base=0)])
고른 = [r["no"] for _, r in e["todo"]]
봄("① 100억 넘고 하한율 있고 smk 없는 줄만(A1) — smk Y · N · 하한율 없음(종합심사) · 100억 아래 · 취소 · 기초 없음은 안 고름", 고른 == ["A1"], repr(고른))
봄("① 고른 줄은 «앞»(맨 앞에 물음) · 까닭 «개찰 표준시장단가» 1", e["앞"] == {("con", "A1")} and e["todo_why"]["개찰 표준시장단가"] == 1, repr((e["앞"], e["todo_why"])))
e = 고르기([줄(no="B1", est=3e8, base=3.3e8, aval=None), 줄(no="B2", est=3e8, base=3.3e8, aval=0, az=1),
           줄(no="B3", est=3e8, base=3.3e8, aval=None, az=0), 줄(no="B4", est=3e8, base=3.3e8, aval=None, ayn="N"),
           줄(no="B5", est=3e8, base=3.3e8, aval=5000000)])
고른 = [r["no"] for _, r in e["todo"]]
봄("② A값 적용(Y)인데 A값 없고 az 없음(B1)만 — az 1 · az 0(이미 물음) · 미적용 N · A값 있음은 안 고름", 고른 == ["B1"], repr(고른))
봄("② A값 0원 확인은 «앞» 이 아님(차례대로) · 까닭 «개찰 A값 0원 확인» 1", e["앞"] == set() and e["todo_why"]["개찰 A값 0원 확인"] == 1, repr(e["todo_why"]))
e = 고르기([줄(no="C1", est=0, base=12000000000), 줄(no="C2", est=0, base=10900000000)])
봄("① 추정가격이 없으면 기초금액 110억 선(화면 bidmath 와 같음)", [r["no"] for _, r in e["todo"]] == ["C1"], repr([r["no"] for _, r in e["todo"]]))
봄("① 기초금액 빈 줄은 전처럼 최근 MAX_ROWS 에서만(위 블록이 따로 · 7주 전체로 안 넓힘)",
   "for r in rows[:MAX_ROWS]:\n            if not r.get(\"base\"):\n                todo.append((kind, r))\n        # ⚖ G581" in src)
봄("① 공고(마감 전) 표준시장단가 줄도 «앞»", 'todo_why["표준시장단가"] += 1\n                앞.add((kind, r["no"]))' in src)

# 정렬 — 앞 줄을 맨 앞(3시간 안에 물어본 것은 차례대로) · 그 밖은 오래 안 물어본 것부터
k = src.index("    cut3 = ")
정렬 = textwrap.dedent(src[k:src.index("    if uniq:", k)])
uniq = [("con", {"no": "X1", "bask": "20261107100000"}), ("con", {"no": "S1", "bask": "20261107120000"}),
        ("con", {"no": "X2"}), ("con", {"no": "S2", "bask": "20261107155000"}), ("con", {"no": "S3"})]
from datetime import datetime, timedelta, timezone  # noqa: E402
KST = timezone(timedelta(hours=9))
env = {"uniq": uniq, "앞": {("con", "S1"), ("con", "S2"), ("con", "S3")}, "datetime": datetime, "timedelta": timedelta, "KST": KST}
exec(compile(정렬.replace('(datetime.now(KST) - timedelta(hours=3))', '(datetime(2026, 11, 7, 16, 0, tzinfo=KST) - timedelta(hours=3))'), "G581 정렬", "exec"), env)
차례 = [r["no"] for _, r in env["uniq"]]
봄("정렬 — 앞(안 물음 S3 · 3시간 넘음 S1) → 그 밖 오래된 차례(X2 · X1) → 3시간 안에 물은 앞(S2)", 차례 == ["S3", "S1", "X2", "X1", "S2"], repr(차례))

# 개별조회 결과 — 응답으로 줄의 A값 · smk 를 바꿈(개찰 줄도 같은 길)
d = src[src.index('b = bsis_one(key, r["no"], kind)'):src.index('b = bsis_one(key, r["no"], kind)') + 1400]
봄("결과 — r.update(b) 로 A값(표준시장단가 포함) · smk 를 바꿈 · A 0원이면 옛 A값 지움 · az 정리", 'r.update(b)' in d and 'r.pop("aval", None)' in d and 'r.pop("az", None)' in d)
봄("줄 글에 새 까닭 둘(개찰 표준시장단가 · 개찰 A값 0원 확인)", "· 개찰 표준시장단가 {todo_why['개찰 표준시장단가']:,} · 개찰 A값 0원 확인 {todo_why['개찰 A값 0원 확인']:,}" in src)

# ③ bidresult 맨 뒤 az · smk
k = src.index('"f": ["win", "amt", "rate"')
f = re.findall(r'"([a-z]+)"', src[src.index("[", k):src.index("]", src.index("[", k))])
봄("③ bidresult 칸 끝 «pc · az · smk»(BaroBid a[27] az · a[28] smk)", f[-3:] == ["pc", "az", "smk"] and len(f) == 29, repr(f[-4:]))
봄("③ 줄 끝도 같은 자리(pc 다음 az 1/0 · smk)", 'int(r.get("pc") or 0),\n                       # ⚖ G581' in src and '1 if r.get("az") == 1 else 0, r.get("smk") or ""]' in src)
baro = io.open(os.path.join(ROOT, "web", "src", "pages", "BaroBid.jsx"), encoding="utf-8").read().replace("\r\n", "\n")
봄("③ 화면 BaroBid — a[27] az · a[28] smk 로 읽음", "az: Number(a[27]) || 0, smk: a[28] || ''," in baro)

print(f"\n{셈[0]}개 중 틀림 {len(틀림)}")
sys.exit(1 if 틀림 else 0)
