"""🧪 G340 (2026-10-20) 입찰 분석실 재료(build_json.build_sjl) — 작은 가상 자료로 굽기 · 모양 · 셈을 대 봄
   python tools/시험_분석실재료.py"""
import os
import sys
import json
import tempfile
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd  # noqa: E402
import build_json as B  # noqa: E402

셈 = [0, 0]


def 봄(뜻, ok, 덧=""):
    셈[0] += 1
    if not ok:
        셈[1] += 1
    print(("✓ " if ok else "✗ ") + 뜻 + (f" — {덧}" if 덧 != "" else ""))


rnd = random.Random(3)
rows = []
for k in range(70):          # 가상 기관 하나 · ±3 70건
    rows.append({"발주기관": "경상북도 가상시", "sj": round(99.9 + rnd.gauss(0, 0.7), 3),
                 "dt": pd.Timestamp("2026-05-01") + pd.Timedelta(days=k), "rate": 90.1, "np": 40 + k,
                 "기초금액": "350,000,000", "예가하한": -3, "예가상한": 3, "1순위업체": f"가상건설{k}", "공고명": f"가상 공사 {k}"})
for k in range(12):          # 둘째 기관 · ±2 · 시도 모름
    rows.append({"발주기관": "가상공단 본부", "sj": round(100 + rnd.gauss(0, 0.5), 3),
                 "dt": pd.Timestamp("2026-06-01") + pd.Timedelta(days=k), "rate": 89.9, "np": None,
                 "기초금액": "1,200,000,000", "예가하한": -2, "예가상한": 2, "1순위업체": "가상", "공고명": "가상"})
df = pd.DataFrame(rows)
with tempfile.TemporaryDirectory() as d:
    B.OUT = d
    w = B.build_sjl(df)
    봄("굽기 — 통 64개 + sjd", w > 0 and len(os.listdir(os.path.join(d, "agency", "sjl"))) == 64)
    b = json.load(open(os.path.join(d, "agency", "sjl", f"{B.sjr_bucket('경상북도 가상시')}.json"), encoding="utf-8"))
    v = b.get("경상북도 가상시")
    봄("기관 — {s: 시도, c: 최신 60건(최신이 앞)}", v and v["s"] == "경북" and len(v["c"]) == 60 and v["c"][0][0] == "260709", json.dumps(v["c"][0], ensure_ascii=False) if v else "")
    봄("줄 — 기초금액은 만원 · 예가범위 3 · 업체 · 공고명", v and v["c"][0][4] == 35000 and v["c"][0][5] == 3 and v["c"][0][6].startswith("가상건설"))
    b2 = json.load(open(os.path.join(d, "agency", "sjl", f"{B.sjr_bucket('가상공단 본부')}.json"), encoding="utf-8"))["가상공단 본부"]
    봄("시도를 이름으로 못 가리면 s = ''", b2["s"] == "" and b2["c"][0][5] == 2 and b2["c"][0][3] is None)
    s = json.load(open(os.path.join(d, "agency", "sjd.json"), encoding="utf-8"))
    봄("sjd — 전국 ±3 칸 합 70 · ±2 12", sum(s["all"]["3"]) == 70 and sum(s["all"]["2"]) == 12, str({k: sum(x) for k, x in s["all"].items()}))
    봄("sjd — 시도 경북 · 금액대(3~4억 = 3번 · 10~15억 = 10번)", sum(s["sido"]["경북"]["3"]) == 70 and sum(s["amt"]["3"]["3"]) == 70 and sum(s["amt"]["10"]["2"]) == 12)
    봄("sjd — 시도 최신 60건 [yymmdd, 사정률, 범위, 기관]", len(s["sr"]["경북"]) == 60 and s["sr"]["경북"][0][2] == 3)
    h = s["hit"]["3"]
    seq = [r["sj"] for r in rows[:70]]
    vals = []
    for i, n in enumerate(s["all"]["3"]):
        vals.extend([B.SJD_LO + i * B.SJD_STEP + B.SJD_STEP / 2] * n)
    vals.sort()
    want = B.sjd_hit([seq], B._top2(vals), vals[len(vals) // 2])
    봄("적중 검사 — n 60(70 − 앞 10) · sjd_hit 그대로", h["n"] == 60 and h["flow2"] == want["flow2"] and h["med"] == want["med"], json.dumps(h, ensure_ascii=False))
    봄("±2 는 앞 10건 쌓인 뒤 2번", s["hit"]["2"]["n"] == 2)
    봄("상관 — ±3 숫자 · ±2 는 11쌍 이상", isinstance(s["corr"]["3"], float) and s["corr"]["2"] is not None)
봄("예가범위 이름", B._sjd_rng(-3, 3) == "3" and B._sjd_rng(-2, 2) == "2" and B._sjd_rng(-3, 0) == "x" and B._sjd_rng(None, None) == "3" and B._sjd_rng(float("nan"), 3) == "3")
봄("금액대 번호 — 화면 금액대of 와 같음(1억 = 0 · 1억 초과 = 1 · 100억 초과 = -1)", B._sjd_amt(1e8) == 0 and B._sjd_amt(1e8 + 1) == 1 and B._sjd_amt(1.2e10) == -1 and B._sjd_amt(0) == -1)
봄("사정률 칸이 없는 자료면 0 · 멈추지 않음", B.build_sjl(pd.DataFrame({"발주기관": ["a"]})) == 0)
print(f"\n{셈[0]}개 중 틀림 {셈[1]}")
sys.exit(1 if 셈[1] else 0)
