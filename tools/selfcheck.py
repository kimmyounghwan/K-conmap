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

IDX_F = ["no", "name", "inst", "base", "budget", "close", "lo", "hi", "llr", "est",
         "lic", "aval", "gmtrl", "ayn", "aparts", "ptot", "pdrw", "url", "site",
         "rgnb", "joint", "mthd", "swin", "rebid"]
RES_F = ["win", "amt", "rate", "np", "base", "dt", "tel", "ceo", "bno", "adr", "tsrc",
         "name", "inst", "aval", "ayn", "amts", "rq", "nrank", "lo", "hi"]


def notice(no, name, base, aval, ayn, lo, hi, llr, est, close):
    return [no, name, "검사용 발주기관", base, int(est * 1.1), close, lo, hi, llr, est,
            ["토목공사업"], aval, 0, ayn, [], 15, 4, "https://www.g2b.go.kr/",
            "서울특별시", "", "", "제한경쟁", "적격심사", ""]


def build_cases():
    """(마감 전 공고, 개찰 공고, 기대값) 을 만듭니다."""
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
        r = B.recommend(base, llr, aval if ayn != "N" else 0, a_known, lo=lo, hi=hi)
        sh = B.shown(base, r["amt"])
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
        sc = B.score(base, a, (ayn == "N") or aval > 0, llr, win, rate, lo=lo, hi=hi)
        res[no] = ["검사건설(주)", win, rate, (ladder[-1][0] if ladder else 0), base, past,
                   "", "", "", "", 0, nm, "검사용 발주기관", aval, ayn,
                   [l[1] for l in (ladder or [])[:12]], ladder or [],
                   (ladder[-1][0] if ladder else 0), lo, hi]
        w = {"no": no, "kind": "score", "name": nm,
             "our": sc["our"], "limit": sc["limit"], "win": win,
             "verdict": "dq" if sc["dq"] else ("win" if sc["beat"] else "lose")}
        if ladder:
            w["bracket"] = B.rank_bracket(ladder, sc["our"])
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", action="store_true", help="검사 전에 npm run build 를 돕니다")
    ap.add_argument("--browser", action="store_true",
                    help="화면까지 열어 확인합니다 (Playwright 가 깔려 있어야 합니다)")
    args = ap.parse_args()

    if args.build:
        print("▶ 빌드 중...")
        subprocess.run(["npm", "run", "build"], cwd=os.path.join(ROOT, "web"), check=True)
    idx, res, want = build_cases()

    # ── ① 계산 검사 (기본) — 브라우저 없이 node 로 바로 돕니다 ──────────
    cf = os.path.join(ROOT, "tools", "_cases.json")
    of = os.path.join(ROOT, "tools", "_math.json")
    cases = []
    for w in want:
        c = {"no": w["no"], "p50": B.P50_DEFAULT}
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

    if not args.browser:
        print("   (화면까지 열어 보려면 --browser 를 붙이세요 · Playwright 필요)")
        return 0

    # ── ② 화면 검사 (선택) — Playwright 가 있을 때만 ────────────────
    if not os.path.exists(os.path.join(DIST, "index.html")):
        print("⛔ web/dist 가 없습니다. --build 를 붙이거나 먼저 빌드하세요.")
        return 2

    idx, res, want = build_cases()
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
                ok_b = (str(lo_r) in txt and (hi_r is None or str(hi_r) in txt))
                print(f'      순위  계산 {lo_r}~{hi_r} · 화면 "{txt[:70]}"')
                if not ok_b:
                    bad.append(nm + " 순위")
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
