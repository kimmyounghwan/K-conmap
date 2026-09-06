# -*- coding: utf-8 -*-
"""
selfcheck.py — 화면이 내는 숫자를 «따로 쓴 계산기»와 맞춰 봅니다.

왜 만들었나
  2026-09-02 하루에만 계산이 틀린 곳이 셋 나왔습니다.
    ① 투찰금액 공식 자체가 틀림   ② 채점이 추천과 다른 방식으로 채점
    ③ 「유효 투찰 12곳 중 13위」  ④ A값을 손으로 넣어도 «모름» 처리
  **전부 소장님이 화면을 보고 찾았습니다.** 기계가 먼저 찾아야 합니다.

쓰는 법
    python tools/selfcheck.py              # 계산 검사 (node 만 있으면 됩니다)
    python tools/selfcheck.py --browser    # 화면까지 열어 확인 (Playwright 필요)

⚠️ 2026-09-03 — 처음에는 브라우저로만 검사하게 만들었다가, 소장님 PC 에
   Playwright 가 없어 돌지 않았습니다. 계산을 화면 코드에서 빼
   web/src/lib/bidmath.js 로 옮겼고, 이제 **브라우저 없이** 검사합니다.
   설치할 것이 없습니다.

하는 일
  1. 여러 상황(예가범위 ±2/±3, A값 유무, 하한율 구간, 종합심사,
     채점 실격/1순위/밀림, 순위 사다리 유무)을 시험 자료로 만들어 web/dist/data 에 둡니다
  2. 브라우저로 화면을 열어 숫자를 읽습니다
  3. bidmath.py 로 따로 계산한 값과 한 줄씩 맞춥니다
  4. 어긋나면 그 자리를 찍고 1 로 끝냅니다 (자동화에서 실패로 잡히게)

⚠️ 끝나면 시험 자료를 지웁니다. 진짜 자료를 덮어쓰지 않도록 web/dist 에서만 씁니다.
"""
import argparse
import io
import json
import math
import os
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import bidmath as B                                    # noqa: E402

DIST = os.path.join(ROOT, "web", "dist")
DATA = os.path.join(DIST, "data")
PORT = 8899

# ══════════════════════════════════════════════════════════════
#  ⚠️ 칸 목록을 여기에 «적지» 않습니다 — collect.py 에서 «읽어» 옵니다.
#
#  2026-09-03 에 이 파일이 자기만의 IDX_F 를 들고 있다가, collect.py 에서
#  aparts 를 빼자 검사 도구만 옛 24칸 형식으로 시험 자료를 만들었습니다.
#  결과: 공고 5가지 검사가 «화면 금액 0» 으로 전부 빨갛게. 코드는 멀쩡했는데
#  검사 도구가 틀렸습니다. 제일 나쁜 종류입니다 — 검사를 못 믿게 됩니다.
#  (그날 잡은 «같은 규칙을 두 번 적은» 어긋남의 네 번째였습니다)
#
#  그래서 이제 시험 자료는 이름→값 사전으로 만들고, 칸 순서는 collect.py 의
#  «만드는 쪽» 코드에서 그대로 읽어 배열로 바꿉니다. 사본이 없으면 어긋날 수도 없습니다.
# ══════════════════════════════════════════════════════════════
def _fields_from_collect(anchor):
    """collect.py 에서 '"f": [...]' 칸 목록을 읽습니다. anchor 로 어느 것인지 고릅니다."""
    import re as _re
    c = io.open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read()
    i = c.index(anchor)
    i = c.index("[", i)
    return _re.findall(r'"([a-z]+)"', c[i:c.index("]", i)])


IDX_F = _fields_from_collect('"f": ["no", "name"')       # bidindex.json
RES_F = _fields_from_collect('"f": ["win", "amt"')       # bidresult.json


def _row(fields, d):
    """이름→값 사전을 collect.py 의 칸 순서대로 배열로. 모르는 칸은 빈값."""
    return [d.get(k, "" if k in ("no", "name", "inst", "close", "ayn", "url", "site",
                                  "rgnb", "joint", "mthd", "swin", "rebid", "win",
                                  "dt", "tel", "ceo", "bno", "adr") else 0)
            for k in fields]


def notice(no, name, base, aval, ayn, lo, hi, llr, est, close):
    return _row(IDX_F, {
        "no": no, "name": name, "inst": "검사용 발주기관", "base": base,
        "budget": int(est * 1.1), "close": close, "lo": lo, "hi": hi, "llr": llr,
        "est": est, "lic": ["토목공사업"], "aval": aval, "gmtrl": 0, "ayn": ayn,
        "ptot": 15, "pdrw": 4, "url": "https://www.g2b.go.kr/", "site": "서울특별시",
        "rgnb": "", "joint": "", "mthd": "제한경쟁", "swin": "적격심사", "rebid": "",
    })


def build_cases(p50=None):
    """(마감 전 공고, 개찰 공고, 기대값) 을 만듭니다.

    p50 을 주면 그 값으로 기대값을 냅니다 — 화면은 overview.json 의 sjq.p50 을 쓰므로,
    dist 에 다른 값이 놓여 있으면 «코드는 멀쩡한데» 검사가 틀립니다."""
    p50 = B.P50_DEFAULT if p50 is None else p50
    from datetime import datetime, timedelta
    now = datetime.now()
    fut = (now + timedelta(days=5)).strftime("%Y-%m-%d %H:%M:%S")
    past = (now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")
    idx, res, want = [], {}, []

    # ── ① 마감 전 공고 — 권장금액이 맞는가 ─────────────────────
    live = [
        ("R26CHK0000101", "±3% · A값 있음", 450_000_000, 22_000_000, "Y", -3, 3, 89.745),
        ("R26CHK0000102", "±2% · A값 있음", 450_000_000, 22_000_000, "Y", -2, 2, 89.745),
        ("R26CHK0000103", "±3% · A값 미적용", 450_000_000, 0, "N", -3, 3, 89.745),
        ("R26CHK0000104", "10~50억 · A값 있음", 2_000_000_000, 120_000_000, "Y", -3, 3, 88.745),
        ("R26CHK0000105", "50~100억 · A값 있음", 7_000_000_000, 400_000_000, "Y", -3, 3, 87.495),
    ]
    for no, nm, base, aval, ayn, lo, hi, llr in live:
        est = round(base / 1.1)
        idx.append(notice(no, nm, base, aval, ayn, lo, hi, llr, est, fut))
        a_known = (ayn == "N") or aval > 0
        r = B.recommend(base, llr, aval if ayn != "N" else 0, a_known, p50, lo=lo, hi=hi)
        sh = B.shown(base, r["amt"], p50)
        want.append({"no": no, "kind": "live", "name": nm,
                     "amt": sh["amt"], "rate": sh["rate"], "sj": r["sj"],
                     "pctile": r["pctile"], "yeje": sh["yeje"],
                     "input": {"base": base, "llr": llr,
                               "a": (aval if ayn != "N" else 0), "aKnown": a_known,
                               "lo": lo, "hi": hi, "ptot": 15, "pdrw": 4,
                               "row": {"base": base, "llr": llr, "aval": aval,
                                       "ayn": ayn, "ptot": 15, "pdrw": 4}}})

    # ── ② 계산을 «거부»해야 하는 공고 ──────────────────────────
    idx.append(notice("R26CHK0000201", "낙찰하한율 없음", 450_000_000, 22_000_000, "Y",
                      -3, 3, None, 409_090_909, fut))
    want.append({"no": "R26CHK0000201", "kind": "nogo", "name": "낙찰하한율 없음",
                 "input": {"base": 450_000_000, "llr": 0, "a": 22_000_000, "aKnown": True,
                           "lo": -3, "hi": 3, "ptot": 15, "pdrw": 4,
                           "row": {"base": 450_000_000, "llr": None, "aval": 22_000_000,
                                   "ayn": "Y", "ptot": 15, "pdrw": 4}}})
    idx.append(notice("R26CHK0000202", "A값 미상", 450_000_000, 0, "", -3, 3,
                      89.745, 409_090_909, fut))
    want.append({"no": "R26CHK0000202", "kind": "nogo", "name": "A값 미상",
                 "input": {"base": 450_000_000, "llr": 89.745, "a": 0, "aKnown": False,
                           "lo": -3, "hi": 3, "ptot": 15, "pdrw": 4,
                           "row": {"base": 450_000_000, "llr": 89.745, "aval": 0,
                                   "ayn": "", "ptot": 15, "pdrw": 4}}})
    idx.append(notice("R26CHK0000203", "기초금액 없음", 0, 0, "", -3, 3, 89.745,
                      409_090_909, fut))
    want.append({"no": "R26CHK0000203", "kind": "nogo", "name": "기초금액 없음",
                 "input": {"base": 0, "llr": 89.745, "a": 0, "aKnown": False,
                           "lo": -3, "hi": 3, "ptot": 15, "pdrw": 4,
                           "row": {"base": 0, "llr": 89.745, "aval": 0,
                                   "ayn": "", "ptot": 15, "pdrw": 4}}})

    # ── ③ 개찰 채점 — 실격 / 1순위 / 밀림 ──────────────────────
    def add_score(no, nm, base, aval, ayn, lo, hi, llr, sj_real, win_off, ladder=None):
        a = 0 if ayn == "N" else aval
        yeje = round(base * sj_real / 100)
        low = math.ceil((yeje - a) * llr / 100 + a)
        win = low + win_off
        rate = round(win / yeje * 100, 3)
        sc = B.score(base, a, (ayn == "N") or aval > 0, llr, win, rate, p50, lo=lo, hi=hi)
        res[no] = _row(RES_F, {
            "win": "검사건설(주)", "amt": win, "rate": rate,
            "np": (ladder[-1][0] if ladder else 0), "base": base, "dt": past,
            "tel": "", "ceo": "", "bno": "", "adr": "", "tsrc": 0,
            "name": nm, "inst": "검사용 발주기관", "aval": aval, "ayn": ayn,
            # 실제 자료는 순위를 못 받았어도 1순위 금액 하나는 amts 에 있습니다.
            # 이게 비어 있으면 「최소 2위」 가 뜨던 자리를 검사가 못 밟습니다.
            "amts": [l[1] for l in (ladder or [])[:12]] or [win], "rq": ladder or [],
            "nrank": (ladder[-1][0] if ladder else 0), "lo": lo, "hi": hi,
            "lic": ["토목공사업"],
            # ★ 공고서의 낙찰하한율 — 채점이 이걸 써야 바로투찰과 같은 금액이 됩니다 (2026-09-03)
            "llr": llr, "est": 0,
        })
        w = {"no": no, "kind": "score", "name": nm,
             "our": sc["our"], "limit": sc["limit"], "win": win,
             "verdict": "dq" if sc["dq"] else ("win" if sc["beat"] else "lose")}
        if ladder or sc["beat"]:
            w["bracket"] = B.rank_bracket(ladder, sc["our"], sc["limit"], sc["beat"])
        w["input"] = {"base": base, "llr": llr, "a": a,
                      "aKnown": (ayn == "N") or aval > 0,
                      "lo": lo, "hi": hi, "ptot": 15, "pdrw": 4,
                      "row": {"base": base, "llr": llr, "aval": aval, "ayn": ayn,
                              "ptot": 15, "pdrw": 4},
                      "score": {"win": win, "rate": rate, "ladder": ladder}}
        want.append(w)

    # 사정률이 낮게 나온 날 → 하한이 내려가 우리 금액이 높아 «밀림»
    add_score("R26CHK0000301", "밀림(사정률 낮음)", 450_000_000, 22_000_000, "Y",
              -3, 3, 89.745, 99.30, 130_000)
    # 사정률이 아주 높게 나온 날 → 하한이 우리 위로 올라가 «실격»
    add_score("R26CHK0000302", "실격(사정률 높음)", 450_000_000, 22_000_000, "Y",
              -3, 3, 89.745, 101.30, 130_000)
    # 1순위가 하한에서 멀리 떠 있는 날 → 우리가 «1순위»
    add_score("R26CHK0000303", "1순위(경쟁 약함)", 450_000_000, 22_000_000, "Y",
              -3, 3, 89.745, 99.90, 40_000_000)
    # 순위 사다리 있는 공고
    lad = [[1, 400_000_000], [2, 400_100_000], [3, 400_200_000], [5, 400_500_000],
           [10, 401_000_000], [20, 402_000_000], [50, 405_000_000],
           [100, 410_000_000], [200, 420_000_000], [500, 450_000_000],
           [851, 500_000_000]]
    add_score("R26CHK0000304", "순위 사다리", 450_000_000, 22_000_000, "Y",
              -3, 3, 89.745, 99.90, 130_000, ladder=lad)
    # ★ 공고서 하한율이 규모 추정(89.745)과 다른 공고 — 실측 2.1% 가 이렇습니다(예: 86.245).
    #   채점이 규모 추정으로 되돌아가면 «우리 금액» 이 3.7% 어긋나 여기서 잡힙니다.
    add_score("R26CHK0000305", "공고서 하한율(86.245)", 450_000_000, 22_000_000, "Y",
              -3, 3, 86.245, 99.90, 130_000)
    return idx, res, want


def write_fixtures(idx, res):
    os.makedirs(DATA, exist_ok=True)
    saved = {}
    for f in ("bidindex.json", "bidresult.json"):
        p = os.path.join(DATA, f)
        saved[f] = open(p, encoding="utf-8").read() if os.path.exists(p) else None
    json.dump({"built": "검사", "f": IDX_F, "r": idx},
              open(os.path.join(DATA, "bidindex.json"), "w", encoding="utf-8"),
              ensure_ascii=False)
    json.dump({"built": "검사", "f": RES_F, "r": res},
              open(os.path.join(DATA, "bidresult.json"), "w", encoding="utf-8"),
              ensure_ascii=False)
    return saved


def restore(saved):
    for f, body in saved.items():
        p = os.path.join(DATA, f)
        if body is None:
            if os.path.exists(p):
                os.remove(p)
        else:
            open(p, "w", encoding="utf-8").write(body)



# ══════════════════════════════════════════════════════════════
#  ★ 등급 대조 — winodds.js(화면) vs build_json.py(시뮬레이션)
#
#  왜 필요한가: 같은 규칙을 두 언어로 두 번 적어 놨습니다.
#  한쪽만 고치면 «공고에서는 A등급인데 시뮬레이션은 C등급으로 빼는»
#  어긋남이 조용히 생깁니다. 화면 숫자가 틀리는 것보다 찾기 어렵습니다.
#  그래서 32가지 조합을 두 쪽에 똑같이 물어봅니다.
# ══════════════════════════════════════════════════════════════
GRADE_ROWS = []
for _b, _bn in ((60_000_000, "1억미만"), (250_000_000, "3억미만"),
                (900_000_000, "3억이상"), (6_000_000_000, "50억")):
    for _lo, _hi, _rn in ((-3.0, 3.0, "±3%"), (-2.0, 2.0, "±2%")):
        for _i, _inn in (("경상북도 경주시", "지자체"), ("한국도로공사", "공사"),
                         ("○○대학교병원", "병원"), ("○○교육지원청", "청")):
            GRADE_ROWS.append({
                "id": f"{_bn}·{_rn}·{_inn}", "base": _b, "est": _b / 1.1,
                "lo": _lo, "hi": _hi, "inst": _i, "name": "산림 임도 정비공사"})


def check_grades():
    """등급을 매기는 두 벌의 코드가 같은 답을 내는지 봅니다."""
    if ROOT not in sys.path:
        sys.path.insert(0, ROOT)
    try:
        import build_json as BJ
    except Exception as e:            # pandas 가 없는 PC 에서도 나머지는 돌게
        print(f"\n(등급 대조 건너뜀 — build_json.py 를 못 불러왔습니다: {e})")
        return []
    inf = os.path.join(ROOT, "tools", "_grade_in.json")
    outf = os.path.join(ROOT, "tools", "_grade_out.json")
    json.dump(GRADE_ROWS, open(inf, "w", encoding="utf-8"), ensure_ascii=False)
    try:
        subprocess.run(["node", os.path.join(ROOT, "tools", "checkgrade.mjs"), inf, outf],
                       check=True)
        js = {g["id"]: g["key"] for g in json.load(open(outf, encoding="utf-8"))}
    finally:
        for f in (inf, outf):
            if os.path.exists(f):
                os.remove(f)
    bad = []
    for r in GRADE_ROWS:
        py = BJ.win_grade(r["base"], r["est"], r["lo"], r["hi"], r["inst"], r["name"])
        if py != js.get(r["id"]):
            bad.append(f'{r["id"]}  화면 {js.get(r["id"])} ≠ 시뮬레이션 {py}')
    print("\n" + "=" * 64)
    print("  등급 대조 — winodds.js(화면) vs build_json.py(시뮬레이션)")
    print("=" * 64)
    if bad:
        print(f"❌ {len(bad)}가지가 어긋납니다 — 한쪽만 고쳤습니다")
        for x in bad[:10]:
            print("   ·", x)
    else:
        n_cd = sum(1 for v in js.values() if v in ("C", "D"))
        print(f"✅ {len(GRADE_ROWS)}가지 조합 전부 같은 등급이었습니다 "
              f"(그 중 C·D 로 «채점 안 함» 이 되는 자리 {n_cd}가지)")
    return bad


# ══════════════════════════════════════════════════════════════
#  ★ bidindex 칸 순서 대조 — collect.py(만드는 쪽) vs BaroBid.jsx(읽는 쪽)
#
#  bidindex.json 은 이름표 없이 «배열»로 담습니다(그래야 절반 크기).
#  대신 칸 순서가 두 파일에 따로 적혀 있어서, 한쪽에서 칸을 하나 빼면
#  그 뒤가 전부 한 칸씩 밀립니다. 화면은 «에러 없이» 엉뚱한 값을 보여줍니다
#  — 기초금액 자리에 예산이 들어가도 그냥 숫자로 보입니다. 제일 무서운 종류입니다.
#  (2026-09-03 aparts 를 빼면서 실제로 이 위험을 만들었습니다)
# ══════════════════════════════════════════════════════════════
def check_bidindex():
    """bidindex 칸 대조 — 2026-09-03 부터는 세 화면이 «이름표(f)» 로 읽습니다(data.js indexRows).
    그래서 자리 번호 대조 대신 ① 만드는 쪽 f 에 화면이 쓰는 이름이 다 있는지, ② 어디서도 자리 번호(a[8])로
    읽지 않는지를 봅니다. 자리 번호 읽기가 다시 생기면 칸 하나 붙일 때 그쪽만 어긋납니다."""
    import re
    cp = os.path.join(ROOT, "collect.py")
    print("\n" + "=" * 64)
    print("  bidindex 칸 대조 — collect.py(만드는 쪽) vs 화면(이름표로 읽는 쪽)")
    print("=" * 64)
    need = ["no", "name", "inst", "base", "budget", "close", "lo", "hi", "llr", "est", "lic",
            "aval", "gmtrl", "ayn", "ptot", "pdrw", "url", "site", "rgnb", "joint", "mthd",
            "swin", "rebid", "enp", "enpn", "dt"]
    try:
        c = io.open(cp, encoding="utf-8").read()
        i = c.index('"f": ["no", "name"')
        i = c.index("[", i)
        f = re.findall(r'"([a-z]+)"', c[i:c.index("]", i)])
    except Exception as e:
        print(f"(건너뜀 — 읽지 못했습니다: {type(e).__name__})")
        return []
    bad = [f"만드는 쪽 f 에 «{k}» 가 없습니다" for k in need if k not in f]
    readers = ["web/src/pages/BaroBid.jsx", "web/src/pages/LiveBoard.jsx", "web/src/Spot.jsx"]
    for rp in readers:
        try:
            src = io.open(os.path.join(ROOT, rp), encoding="utf-8").read()
        except Exception:
            bad.append(f"{rp} 를 읽지 못했습니다"); continue
        if "indexRows(" not in src:
            bad.append(f"{rp} 가 indexRows 로 읽지 않습니다")
        if re.search(r"idx\.r\.map\(\(a\) => \(\{", src):
            bad.append(f"{rp} 에 자리 번호(a[n]) 읽기가 다시 생겼습니다")
    if bad:
        print(f"❌ {len(bad)}군데가 어긋납니다")
        for x in bad[:8]:
            print("   ·", x)
    else:
        print(f"✅ 만드는 쪽 {len(f)}칸에 화면이 쓰는 {len(need)}칸이 다 있고, 세 화면 모두 이름표로 읽습니다")
    return bad



# ══════════════════════════════════════════════════════════════
#  ★ 검색 색인 칸 대조 — collect.py(만드는 쪽) vs 화면(읽는 쪽)
#
#  색인은 이름표 없이 배열로 담습니다. 칸 순서가 두 곳에 따로 적혀 있어서
#  한쪽만 고치면 **검색이 엉뚱한 칸을 뒤집니다 — 에러 없이.**
#  (기관을 검색했는데 낙찰업체를 뒤지는 식. 결과가 그럴듯해서 더 위험합니다)
# ══════════════════════════════════════════════════════════════
def check_daily():
    """「어제의 개찰 성적표」 칸 대조 — daily.py 가 만드는 순서 vs DailyPage 가 읽는 순서.

    자리를 아끼려고 표 한 줄을 배열로 담았습니다. 순서가 어긋나면
    **에러 없이** 기관 자리에 낙찰업체가 그려집니다 — 그럴듯해서 아무도 못 알아챕니다.
    """
    import re
    print("\n" + "=" * 64)
    print("  성적표 칸 대조 — daily.py vs DailyPage.jsx")
    print("=" * 64)
    try:
        d = io.open(os.path.join(ROOT, "daily.py"), encoding="utf-8").read()
        made = re.findall(r'"(\w+)"', re.search(r'^FIELDS = \[([^\]]+)\]', d, re.M).group(1))
        t = io.open(os.path.join(ROOT, "web", "src", "pages", "DailyPage.jsx"),
                    encoding="utf-8").read()
        read = re.findall(r"'(\w+)'", re.search(r'^const F = \[([^\]]+)\]', t, re.M).group(1))
    except Exception as e:
        print(f"(건너뜀 — 읽지 못했습니다: {type(e).__name__}: {e})")
        return []
    if made and made == read:
        print(f"✅ {len(made)}칸 같음 — {', '.join(made)}")
        return []
    print(f"❌ 만드는 쪽 {made}\n         읽는 쪽 {read}")
    return [f"성적표: {made} ≠ {read}"]


def check_boardidx():
    import re
    print("\n" + "=" * 64)
    print("  검색 색인 칸 대조 — collect.py vs FirstBoard·LiveBoard")
    print("=" * 64)
    try:
        c = io.open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read()
        made = {}
        for key in ("first", "live"):
            i = c.index('if name == "first":' if key == "first" else "else:\n                    # 공고:")
            seg = c[i:i + 1200]
            m = re.search(r'fields = \[([^\]]+)\]', seg)
            made[key] = re.findall(r'"(\w+)"', m.group(1)) if m else []
        read = {}
        # ★ 2026-09-06 — 1순위 색인을 읽는 화면이 둘이 됐습니다(1순위 탭 + 구인구직 «곧 착공하는 현장»).
        #   둘 다 같은 순서로 읽어야 합니다. 한 파일이라도 어긋나면 잡습니다.
        for key, paths in (("first", ["web/src/pages/FirstBoard.jsx", "web/src/Sites.jsx"]),
                           ("live", ["web/src/pages/LiveBoard.jsx"])):
            got = []
            for path in paths:
                fp = os.path.join(ROOT, *path.split("/"))
                if not os.path.exists(fp):
                    continue
                t = io.open(fp, encoding="utf-8").read()
                m = re.search(r'const \[([^\]]+)\] = a\b', t)
                cols = [x.strip() for x in m.group(1).split(",")] if m else []
                if got and cols != got:
                    read[key] = cols + ["≠" + path]      # 두 화면이 서로 다르게 읽음 → 아래에서 ❌
                    break
                got = cols
            read.setdefault(key, got)
    except Exception as e:
        print(f"(건너뜀 — 읽지 못했습니다: {type(e).__name__}: {e})")
        return []
    bad = []
    for key in ("first", "live"):
        nm = "1순위" if key == "first" else "공고"
        if made[key] and made[key] == read[key]:
            print(f"✅ {nm}  {len(made[key])}칸 같음 — {', '.join(made[key])}")
        else:
            bad.append(f"{nm}: 만드는 쪽 {made[key]} ≠ 읽는 쪽 {read[key]}")
            print(f"❌ {nm}  만드는 쪽 {made[key]}\n         읽는 쪽 {read[key]}")
    return bad


def check_boardrank():
    """순위 30곳(corps)을 목록 묶음에서 빼낸 것이 실제로 그렇게 됐는지. (2026-09-06)

    두 가지가 조용히 틀어질 수 있습니다:
      ① 묶음에 corps 가 그대로 남아 있으면 — 전송량이 5배로 돌아갑니다. 화면은 멀쩡합니다.
      ② 순위 파일의 «자리»가 목록과 어긋나면 — **다른 공고의 순위**가 그려집니다.
         에러도 안 나고 그럴듯해 보입니다. 그래서 건수와 나누는 크기를 대조합니다.
    """
    import re
    print("\n" + "=" * 64)
    print("  순위 파일 대조 — 묶음에서 빠졌나 · 자리가 맞나")
    print("=" * 64)
    d = os.path.join(ROOT, "web", "public", "data", "board")
    if not os.path.isdir(d):
        print("(건너뜀 — web/public/data/board 가 없습니다)")
        return []
    bad = []
    try:
        c = io.open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read()
        RK = int(re.search(r"BOARD_RANK_CHUNK = (\d+)", c).group(1))
        KEYS = re.search(r"BOARD_RANK_KEYS = \(([^)]+)\)", c).group(1)
        KEYS = re.findall(r'"(\w+)"', KEYS)
    except Exception as e:
        print(f"(건너뜀 — collect.py 를 못 읽었습니다: {type(e).__name__}: {e})")
        return []
    for name in ("first", "live"):
        mp = os.path.join(d, name + ".json")
        if not os.path.exists(mp):
            continue
        meta = json.load(io.open(mp, encoding="utf-8"))
        if meta.get("rankChunk") != RK:
            bad.append(f"{name}: 목록표 rankChunk={meta.get('rankChunk')} ≠ collect.py {RK}")
            print(f"❌ {name}  목록표 rankChunk {meta.get('rankChunk')} ≠ collect.py {RK}")
            continue
        for kind in ("con", "serv"):
            info = meta.get(kind) or {}
            n = int(info.get("n") or 0)
            # ① 묶음에 순위가 남아 있나
            p0 = os.path.join(d, f"{name}-{kind}-0.json")
            if os.path.exists(p0):
                rows = json.load(io.open(p0, encoding="utf-8"))
                left = sorted({k for r in rows if isinstance(r, dict) for k in KEYS if k in r})
                if left:
                    bad.append(f"{name}-{kind}: 묶음에 {left} 가 아직 들어 있습니다")
                    print(f"❌ {name}-{kind}  묶음에 {left} 가 남아 있습니다 — 전송량이 5배로 돌아갑니다")
                    continue
            # ② 순위 파일의 자리
            nr = int(info.get("ranks") or 0)
            if not nr:
                print(f"✅ {name}-{kind}  순위 파일 없음 (corps 가 아예 없는 목록)")
                continue
            tot, short = 0, []
            for k in range(nr):
                fp = os.path.join(d, f"{name}-{kind}-rank-{k}.json")
                if not os.path.exists(fp):
                    short.append(k)
                    continue
                a = json.load(io.open(fp, encoding="utf-8"))
                tot += len(a)
                if k < nr - 1 and len(a) != RK:
                    short.append(k)
            if short:
                bad.append(f"{name}-{kind}: 순위 파일 {short[:5]} 가 없거나 크기가 다릅니다")
                print(f"❌ {name}-{kind}  순위 파일 {short[:5]} 이상")
            elif tot != n:
                bad.append(f"{name}-{kind}: 순위 {tot:,}줄 ≠ 목록 {n:,}줄 — 자리가 밀립니다")
                print(f"❌ {name}-{kind}  순위 {tot:,}줄 ≠ 목록 {n:,}줄")
            else:
                print(f"✅ {name}-{kind}  {n:,}줄 · 순위 파일 {nr}개 · {RK}건씩 — 자리 맞음")
    return bad


def check_naeyeok():
    """내역서 목록의 칸 이름 대조 — collect.py(export_naeyeok) vs Change.jsx(ChangeNaeyeok).

    ⚠️ 이 목록은 이름표(f)로 읽으므로 «자리»가 어긋날 일은 없습니다.
       위험한 것은 **화면이 읽는 이름이 만드는 쪽에 아예 없는** 경우입니다.
       그러면 undefined 가 되어 «단가 확인됨» 뱃지가 조용히 사라지거나
       «바로 받기» 가 영원히 안 뜹니다 — 에러 없이, 화면은 그럴듯하게.
       (2026-09-05 에 local·priced 두 칸을 새로 붙이면서 넣은 검사입니다)
    """
    import re
    print("\n" + "=" * 64)
    print("  내역서 ꪩ록 칸 대조 — collect.py vs Change.jsx")
    print("=" * 64)
    try:
        c = io.open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read()
        i = c.index("def export_naeyeok(")
        # 주의: «앞에서 몇 글자» 로 자르면 함수가 길어질 때 조용히 못 찾습니다
        #       (2026-09-06 에 실제로 그랬습니다). 다음 def 까지를 함수의 끝으로 봅니다.
        j = c.find("\n    def ", i + 10)
        m = re.search(r'fields = \[([^\]]+)\]', c[i:j if j > 0 else len(c)])
        made = re.findall(r'"(\w+)"', m.group(1)) if m else []
        t = io.open(os.path.join(ROOT, "web", "src", "pages", "Change.jsx"),
                    encoding="utf-8").read()
        j = t.index("export function ChangeNaeyeok()")
        seg = t[j:t.index("\n/* ── /change — 허브", j)]
        read = sorted(set(re.findall(r'\br\.(\w+)\b', seg)))
    except Exception as e:
        print(f"(건너뜀 — 읽지 못했습니다: {type(e).__name__}: {e})")
        return []
    miss = [x for x in read if x not in made]
    if not made:
        print("❌ collect.py 의 export_naeyeok 에서 fields 를 못 찾았습니다")
        return ["naeyeok fields 못 찾음"]
    if miss:
        print(f"❌ 화면이 읽는데 만드는 쪽에 없는 칸: {', '.join(miss)}")
        print(f"   만드는 쪽 {len(made)}칸 — {', '.join(made)}")
        return [f"naeyeok 없는 칸 {miss}"]
    print(f"✅ 만드는 쪽 {len(made)}칸에 화면이 읽는 {len(read)}칸이 다 있습니다")
    print(f"   만드는 쪽 — {', '.join(made)}")
    print(f"   읽는 쪽   — {', '.join(read)}")
    return []


def check_naeyeok_files():
    """naeyeok.json 이 «바로 받기» 로 내놓은 파일이 실제로 배포에 들어 있나. (2026-09-06)

    ⚠️ 이 검사가 필요한 이유 — Firebase 는 **없는 파일에 404 를 주지 않습니다.**
       firebase.json 의 catch-all rewrite(`** → /index.html`) 때문에
       `/naeyeok/없는파일.xlsx` 가 **200 + index.html(3KB)** 로 옵니다(실측).
       그러면 사용자는 「⬇ 바로 받기」를 눌러 **엑셀이 아닌 HTML 3KB** 를 저장하게 되고,
       엑셀이 「파일이 손상되었습니다」라고만 말합니다. 아무도 원인을 못 찾습니다.
       상태 코드로는 절대 못 잡으니, **만드는 쪽에서** 짝을 맞춰 두어야 합니다.
    """
    print("\n" + "=" * 64)
    print("  «바로 받기» 파일이 실제로 있나 — naeyeok.json vs 배포 폴더")
    print("=" * 64)
    roots = [os.path.join(ROOT, "web", "dist"), os.path.join(ROOT, "web", "public")]
    roots = [r for r in roots if os.path.isdir(r)]
    if not roots:
        print("(건너뜀 — web/dist 도 web/public 도 없습니다)")
        return []
    miss, n = [], 0
    for fn_ in ("naeyeok.json", "naeyeok-all.json"):
        p = os.path.join(ROOT, "web", "public", "data", fn_)
        if not os.path.exists(p):
            continue
        try:
            with io.open(p, encoding="utf-8") as f:
                d = json.load(f) or {}
        except Exception as e:
            print(f"(건너뜀 — {fn_} 을 읽지 못했습니다: {type(e).__name__})")
            continue
        f_ = d.get("f") or []
        if "local" not in f_:
            continue
        li = f_.index("local")
        for row in d.get("r") or []:
            loc = row[li]
            if not loc:
                continue
            n += 1
            # 주소에는 «크기 도장»(?v=...)이 붙어 있습니다 - 파일을 찾을 땐 떼어냅니다
            rel = loc.split("?", 1)[0].lstrip("/")
            if not any(os.path.exists(os.path.join(r, rel)) for r in roots):
                miss.append(loc)
    if not n:
        print("✅ «바로 받기» 로 내놓은 파일이 아직 없습니다 (받아 둔 것이 0개)")
        return []
    if miss:
        print(f"❌ {len(miss)}개가 목록에는 있는데 배포 폴더에 없습니다 — 누르면 HTML 이 받아집니다")
        for x in miss[:5]:
            print("     " + x)
        return [f"naeyeok 파일 없음 {len(miss)}개"]
    print(f"✅ «바로 받기» {n}개 전부 배포 폴더에 있습니다")
    return []


def check_canonical():
    """미리 구운 모든 페이지의 canonical 이 «이중 인코딩» 되지 않았나. (2026-09-06)

    ⚠️ 왜 이 검사가 필요한가 — 조용히 색인을 죽이는 잘못이기 때문입니다.
       page() 는 안에서 enc_path() 로 주소를 «한 번» 인코딩합니다.
       그런데 호출하는 쪽에서 quote() 를 걸어 넘기면 %EC → %25EC 로 **두 번** 됩니다.
       그러면 canonical 이 «없는 주소» 를 가리키고, 크롤러는 canonical 을 따라가므로
       **그 페이지는 사이트맵에 있어도 영영 색인되지 않습니다.**
       화면은 멀쩡하고 오류도 없어서, 몇 달이 지나도 아무도 못 알아챕니다.
       (2026-09-06 에 /change/naeyeok/{갈래} 6장이 실제로 그랬습니다.
        CLAUDE.md 의 checkmath.mjs 한글 폴더 사고와 같은 잘못입니다)
    """
    import re as _re
    print("\n" + "=" * 64)
    print("  canonical 이중 인코딩 검사 — 미리 구운 페이지 전부")
    print("=" * 64)
    dist = os.path.join(ROOT, "web", "dist")
    if not os.path.isdir(dist):
        print("(건너뜀 — web/dist 가 없습니다. npm run build + prerender.py 를 먼저)")
        return []
    bad, n = [], 0
    for r, _d, fs in os.walk(dist):
        for f in fs:
            if not f.endswith(".html"):
                continue
            p = os.path.join(r, f)
            try:
                with io.open(p, encoding="utf-8") as fh:
                    h = fh.read(4000)
            except Exception:
                continue
            n += 1
            for tag, pat in (("canonical", r'<link rel="canonical" href="([^"]*)"'),
                             ("og:url", r'<meta property="og:url" content="([^"]*)"')):
                m = _re.search(pat, h)
                if m and "%25" in m.group(1):
                    bad.append(os.path.relpath(p, dist) + "  " + tag + "=" + m.group(1)[:90])
    if not n:
        print("(건너뜀 — 구운 페이지가 없습니다)")
        return []
    if bad:
        print(f"❌ {len(bad)}곳이 두 번 인코딩됐습니다 — 그 페이지는 색인이 안 됩니다")
        for x in bad[:6]:
            print("     " + x)
        return [f"canonical 이중 인코딩 {len(bad)}곳"]
    print(f"✅ {n:,}장 전부 정상입니다 (%25 가 든 canonical·og:url 없음)")
    return []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", action="store_true", help="검사 전에 npm run build 를 돕니다")
    ap.add_argument("--browser", action="store_true",
                    help="화면까지 열어 확인합니다 (Playwright 가 깔려 있어야 합니다)")
    args = ap.parse_args()

    if args.build:
        print("▶ 빌드 중...")
        subprocess.run(["npm", "run", "build"], cwd=os.path.join(ROOT, "web"), check=True)
    # ⚠️ 화면은 overview.json 의 sjq.p50 을 쓰고, 검사기는 P50_DEFAULT 를 씁니다.
    #    dist 에 놓인 overview.json 이 다르면 «코드는 멀쩡한데 검사가 틀렸다» 고 나옵니다
    #    (2026-09-04 에 실제로 겪었습니다 — 99.893 vs 99.896, 금액이 12,282원 어긋났습니다).
    #    그래서 dist 에 있는 값을 그대로 씁니다. 같은 값을 두 번 적지 않습니다.
    p50 = B.P50_DEFAULT
    _ov = os.path.join(DATA, "overview.json")
    if os.path.exists(_ov):
        try:
            v = (json.load(open(_ov, encoding="utf-8")).get("sjq") or {}).get("p50")
            if isinstance(v, (int, float)) and 95 < v < 105:
                if abs(v - p50) > 1e-9:
                    print(f"  · overview.json 의 sjq.p50 = {v} 를 씁니다 (기본값 {p50})")
                p50 = v
        except Exception:
            pass
    idx, res, want = build_cases(p50)

    # ── ① 계산 검사 (기본) — 브라우저 없이 node 로 바로 돕니다 ──────────
    cf = os.path.join(ROOT, "tools", "_cases.json")
    of = os.path.join(ROOT, "tools", "_math.json")
    cases = []
    for w in want:
        c = {"no": w["no"], "p50": p50}
        c.update(w.get("input", {}))
        cases.append(c)
    json.dump(cases, open(cf, "w", encoding="utf-8"), ensure_ascii=False)
    try:
        subprocess.run(["node", os.path.join(ROOT, "tools", "checkmath.mjs"), cf, of],
                       check=True)
        math_out = {g["no"]: g for g in json.load(open(of, encoding="utf-8"))}
    finally:
        for f in (cf, of):
            if os.path.exists(f):
                os.remove(f)

    bad = []
    print("\n" + "=" * 64)
    print("  계산 검사 — 화면이 쓰는 bidmath.js vs 따로 쓴 tools/bidmath.py")
    print("=" * 64)
    for w in want:
        g = math_out.get(w["no"], {})
        nm = f'{w["no"]} {w["name"]}'
        if w["kind"] == "live":
            ok_amt = abs((g.get("shownAmt") or 0) - w["amt"]) <= 1
            ok_rate = abs((g.get("rate") or 0) - w["rate"]) < 1e-9
            ok_sj = abs((g.get("sj") or 0) - w["sj"]) < 1e-9
            ok_pct = g.get("pctile") == w["pctile"]
            ok = ok_amt and ok_rate and ok_sj and ok_pct
            print(f'{"✅" if ok else "❌"} {nm}')
            print(f'      금액 계산 {w["amt"]:>15,}  화면코드 {(g.get("shownAmt") or 0):>15,}')
            print(f'      투찰률 {w["rate"]} / {g.get("rate")}   사정률 {w["sj"]} / {g.get("sj")}'
                  f'   분위 {w["pctile"]} / {g.get("pctile")}')
            if abs((g.get("shownAmt") or 0) - w["amt"]) == 1:
                print("      (1원 차 — 소수점 처리 차이. 봐줍니다)")
            # ★ 원클릭(공고 카드) 금액 = 바로투찰 권장금액 — 두 화면이 같은 수를 내야 합니다
            if g.get("quick") is not None:
                ok_q = abs(g["quick"] - w["amt"]) <= 1
                print(f'      원클릭 카드 {g["quick"]:>15,}  {"✅ 같음" if ok_q else "❌ 다름"}')
                if not ok_q:
                    bad.append(nm + " 원클릭")
            if not ok:
                bad.append(nm)
        elif w["kind"] == "nogo":
            ok = (not g.get("ready")) or (w.get("stop"))
            print(f'{"✅" if ok else "❌"} {nm} — 계산 거부 {"함" if ok else "안 함(❌)"}'
                  f'  빠진값 {g.get("missing")}')
            if not ok:
                bad.append(nm + " 거부 안 함")
        else:
            sc = g.get("score") or {}
            ok_our = sc.get("our") == w["our"]
            ok_lim = sc.get("limit") == w["limit"]
            v = "dq" if sc.get("dq") else ("win" if sc.get("beat") else "lose")
            ok_v = v == w["verdict"]
            ok = ok_our and ok_lim and ok_v
            print(f'{"✅" if ok else "❌"} {nm}')
            print(f'      우리 금액 {w["our"]:>15,} / {sc.get("our", 0):>15,}')
            print(f'      낙찰하한 {w["limit"]:>15,} / {sc.get("limit", 0):>15,}')
            print(f'      판정 {w["verdict"]} / {v}')
            if not ok:
                bad.append(nm)
    print("=" * 64)
    if bad:
        print(f"\n⛔ 어긋난 곳 {len(bad)}개")
        for x in bad:
            print("   ·", x)
        return 1
    print(f"\n✅ 계산 {len(want)}가지 전부 «따로 쓴 계산기»와 같았습니다.")

    # ── ①-2 등급 대조 — 화면과 시뮬레이션이 같은 자리를 «채점 안 함» 으로 빼는지 ──
    gbad = check_grades()
    if gbad:
        print(f"\n⛔ 등급 규칙이 두 곳에서 어긋납니다 {len(gbad)}가지")
        return 1

    ibad = check_bidindex()
    if ibad:
        print(f"\n⛔ bidindex 칸이 어긋납니다 — 화면이 조용히 엉뚱한 값을 보여줍니다")
        return 1

    xbad = check_boardidx()
    xbad += check_boardrank()
    xbad += check_naeyeok()
    xbad += check_naeyeok_files()
    xbad += check_canonical()
    if xbad:
        print(f"\n⛔ 검색 색인 칸이 어긋납니다 — 검색이 엉뚱한 칸을 뒤집니다")
        return 1

    dbad = check_daily()
    if dbad:
        print(f"\n⛔ 성적표 칸이 어긋납니다 — 기관 자리에 낙찰업체가 그려집니다")
        return 1

    if not args.browser:
        print("   (화면까지 열어 보려면 --browser 를 붙이세요 · Playwright 필요)")
        return 0

    # ── ② 화면 검사 (선택) — Playwright 가 있을 때만 ────────────────
    if not os.path.exists(os.path.join(DIST, "index.html")):
        print("⛔ web/dist 가 없습니다. --build 를 붙이거나 먼저 빌드하세요.")
        return 2

    idx, res, want = build_cases(p50)
    saved = write_fixtures(idx, res)
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                           cwd=DIST, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    try:
        cf = os.path.join(ROOT, "tools", "_cases.json")
        of = os.path.join(ROOT, "tools", "_screen.json")
        json.dump([{"no": w["no"]} for w in want], open(cf, "w"), ensure_ascii=False)
        subprocess.run(["node", os.path.join(ROOT, "tools", "selfcheck.mjs"),
                        cf, f"http://127.0.0.1:{PORT}", of], check=True)
        got = json.load(open(of, encoding="utf-8"))
    finally:
        srv.terminate()
        restore(saved)
        for f in ("_cases.json", "_screen.json"):
            p = os.path.join(ROOT, "tools", f)
            if os.path.exists(p):
                os.remove(p)

    by = {g["no"]: g for g in got["out"]}
    bad = []          # 화면 검사용 (계산 검사와 따로 셉니다)
    print("\n" + "=" * 64)
    for w in want:
        g = by.get(w["no"], {})
        nm = f'{w["no"]} {w["name"]}'
        if w["kind"] == "live":
            # 화면 금액은 «금액→투찰률→금액» 으로 한 번 돌아가므로
            # 부동소수점 자리에서 1원까지 어긋날 수 있습니다. 그것만 봐줍니다.
            ok_amt = abs(g.get("heroAmtNum", 0) - w["amt"]) <= 1
            ok_rate = f'{w["rate"]}' in g.get("rateLine", "")
            why = g.get("whyLine", "")
            ok_pct = (f'{w["sj"]:.2f}' in why) and (
                ("A값이 확인돼" in why) if w["pctile"] == 75 else ("확인 안 돼" in why))
            mark = "✅" if (ok_amt and ok_rate and ok_pct) else "❌"
            print(f'{mark} {nm}')
            print(f'      금액  계산 {w["amt"]:>15,}  화면 {g.get("heroAmtNum", 0):>15,}')
            print(f'      투찰률 {w["rate"]}  · 사정률 {w["sj"]} ({w["pctile"]}분위) · 화면근거 "{g.get("whyLine","")[:46]}"')
            if abs(g.get("heroAmtNum", 0) - w["amt"]) == 1:
                print("      (금액 1원 차 — 소수점 처리 차이. 봐줍니다)")
            if not (ok_amt and ok_rate and ok_pct):
                bad.append(nm + (" 금액" if not ok_amt else "")
                           + (" 투찰률" if not ok_rate else "")
                           + (" 근거문구" if not ok_pct else ""))
        elif w["kind"] == "nogo":
            ok = g.get("nogo") or g.get("stop")
            print(f'{"✅" if ok else "❌"} {nm} — 계산 거부 {"함" if ok else "안 함(❌)"}')
            if not ok:
                bad.append(nm + " 거부 안 함")
        else:
            nums = g.get("s1Nums") or []
            ok_our = len(nums) > 1 and nums[1] == w["our"]
            ok_lim = len(nums) > 2 and nums[2] == w["limit"]
            ok_v = w["verdict"] in g.get("scored", "")
            mark = "✅" if (ok_our and ok_lim and ok_v) else "❌"
            print(f'{mark} {nm}')
            print(f'      우리 금액 계산 {w["our"]:>15,}  화면 {(nums[1] if len(nums) > 1 else 0):>15,}')
            print(f'      낙찰하한  계산 {w["limit"]:>15,}  화면 {(nums[2] if len(nums) > 2 else 0):>15,}')
            print(f'      판정 {w["verdict"]} · 화면 "{g.get("scored", "")}"')
            if w.get("bracket"):
                lo_r, hi_r = w["bracket"]
                txt = g.get("myrank", "")
                if (lo_r, hi_r) == (1, 1):
                    # ★ 2026-09-03 — 위에는 🏆 1순위, 등수 칸에는 「1순위가 아니었습니다」 가 떴던 자리.
                    #   1위면 «1위» 라고 말하고, «아니었습니다»·«알 수 없습니다» 가 있으면 안 됩니다.
                    ok_b = ("1위" in txt) and ("아니었습니다" not in txt) and ("알 수 없습니다" not in txt)
                else:
                    ok_b = (str(lo_r) in txt and (hi_r is None or str(hi_r) in txt))
                print(f'      순위  계산 {lo_r}~{hi_r} · 화면 "{txt[:70]}"')
                if not ok_b:
                    bad.append(nm + " 순위")
            elif w["verdict"] == "lose":
                # ★ 2026-09-03 — 순위 자료가 없는 «밀림» 은 등수를 말하면 안 됩니다.
                #   「최소 2위」 가 떴던 자리입니다 (소장님: «말이 돼?»).
                #   1순위 한 곳만 알면서 «최소 2위» 는 산술적으로 맞아도 착시입니다.
                import re as _re
                txt = g.get("myrank", "")
                # «우리 등수» 를 주장하는 꼴만 잡습니다: 「최소 N위」, 「넣었으면 N위」, 「N위 ~ M위」.
                # 참고 문장의 「표본에서 20위였습니다」 는 우리 등수가 아니므로 통과입니다.
                bad_words = _re.findall(r"최소\s*[\d,]+위|넣었으면[^.]*?[\d,]+위|[\d,]+위\s*~\s*[\d,]+위", txt)
                ok_no_rank = (not bad_words) and ("등수는 알 수 없습니다" in txt)
                print(f'      등수  {"말하지 않음 ✅" if ok_no_rank else "❌ 등수를 말함"} · 화면 "{txt[:60]}"')
                if not ok_no_rank:
                    bad.append(nm + f" 등수를 말함({bad_words})")
            if not (ok_our and ok_lim and ok_v):
                bad.append(nm + " 채점")
    print("=" * 64)
    if got["errs"]:
        print(f'⛔ 자바스크립트 오류 {len(got["errs"])}건: {got["errs"][:3]}')
        bad.append("자바스크립트 오류")
    if bad:
        print(f"\n⛔ 어긋난 곳 {len(bad)}개")
        for x in bad:
            print("   ·", x)
        return 1
    gbad = check_grades()
    if gbad:
        print(f"\n⛔ 등급 규칙이 두 곳에서 어긋납니다 {len(gbad)}가지")
        return 1
    print(f"\n✅ {len(want)}가지 상황 + 등급 {len(GRADE_ROWS)}가지 전부 «따로 쓴 계산기»와 같았습니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
