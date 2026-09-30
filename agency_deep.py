# -*- coding: utf-8 -*-
"""🏛 발주기관 정밀 보고서 — 숫자 뽑기 (2026-09-28)

소장님: 「발주기관 분석도 좀 더 세세하게 할 수 없을까? 업체 자가 진단 처럼
         PDF 견본을 보여주고 신청하게 하는 거지」
        「3년치 자료가 있을텐데」 · 「자가진단하고 같은 형태로 가자」

■ 무엇을 만드나
    web/public/data/agency_deep/{묶음}.json   기관마다 «보고서 한 벌의 숫자»
    web/public/data/agency_deep/meta.json     전국 기준값 · 자료 기간
  묶음 번호는 agency/names.json 의 것과 **같습니다** (기관 화면이 이미 아는 번호).
  종이는 브라우저(web/src/lib/기관보고서종이.js)가 그립니다. 여기서는 숫자만 뽑습니다.
  ⚠️ 이용자 화면은 이 파일을 읽지 않습니다. 운영자 화면(/report/agency)만 읽습니다.
     업체 성적표의 first_full.json 과 같은 자리입니다.

■ 자료 셋 — 섞지 않습니다. 칸마다 «어느 자료 · 어느 기간» 을 같이 적습니다.
  ① 3년치 낙찰(1순위)   build_json.load_all() 의 df — 투찰률·금액·날짜·1순위 업체
  ② 순위 전부           data/store/ranks3y/*.csv.gz (3년치 — 메우는 중)
                        + data/store/first.json · data/seed/first.json.gz (최근, 30위까지)
                        공고번호로 ① 과 이어 기관을 찾습니다.
  ③ 기초금액이 실린 줄   ① 가운데 최근분 — 사정률·창(A값)·참가업체수

■ 한계 (종이에도 적습니다)
  · ② 는 개찰마다 «순위 30위까지» 만 담습니다. 참가가 그보다 많으면 나머지는 안 보입니다.
  · ③ 은 2026-04 이후에만 있습니다. 그 앞 3년치 파일에는 기초금액 칸이 없습니다.

    python agency_deep.py            (build_json 이 부릅니다 — 따로 돌릴 일은 없습니다)
"""
import csv
import gzip
import io
import json
import math
import os
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

MIN_WIN = 20          # 3년치 낙찰이 이보다 적으면 만들지 않습니다 (통계가 안 됩니다)
TOPN = 10             # 업체 목록 길이
CASES = 12            # 최근 낙찰 사례
NAME_CUT = 40

BANDS = [             # 금액대 — «예정가격» 기준 (3년치 파일에 기초금액이 없어서입니다)
    ("1억 미만", 0, 1e8),
    ("1~2억", 1e8, 2e8),
    ("2~5억", 2e8, 5e8),
    ("5~10억", 5e8, 10e8),
    ("10억 이상", 10e8, float("inf")),
]
NP_BINS = [("혼자", 1, 1), ("2~9곳", 2, 9), ("10~29곳", 10, 29),
           ("30~99곳", 30, 99), ("100~299곳", 100, 299), ("300곳 이상", 300, 10 ** 9)]
GAP_BINS = [("0.01%p 미만", 0, 0.01), ("0.01~0.05%p", 0.01, 0.05),
            ("0.05~0.1%p", 0.05, 0.1), ("0.1~0.3%p", 0.1, 0.3), ("0.3%p 이상", 0.3, 1e9)]
CLOSE_PP = 0.05       # «근소차» — 1·2위가 이 안에서 갈린 개찰


# ── 잔셈 ────────────────────────────────────────────────────────
def _num(v):
    try:
        f = float(str(v).replace(",", "").replace("%", "").strip())
        return None if math.isnan(f) else f
    except Exception:
        return None


def _med(a):
    s = sorted(a)
    n = len(s)
    if not n:
        return None
    h = n // 2
    return s[h] if n % 2 else (s[h - 1] + s[h]) / 2


def _medi(a):
    """정수 가운데값 (참가업체수·순위) — 짝수 개면 반올림"""
    m = _med(a)
    return None if m is None else int(round(m))


def _q(a, p):
    """p 분위 (선형 보간)"""
    s = sorted(a)
    if not s:
        return None
    k = (len(s) - 1) * p
    lo = int(math.floor(k))
    hi = min(lo + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def _r(x, d=3):
    return None if x is None else round(float(x), d)


def _sd(a):
    if len(a) < 2:
        return 0.0
    m = sum(a) / len(a)
    return math.sqrt(sum((x - m) ** 2 for x in a) / (len(a) - 1))


def _bin(v, step):
    """0.1 단위면 89.97 → 89.9. 떠돌이 소수(899.4999…)에 안 걸리게 정수로 셉니다."""
    k = 1.0 / step
    return round(math.floor(v * k + 1e-7) / k, 3)


def _hist(vals, step, lo, hi):
    c = Counter(_bin(v, step) for v in vals if lo <= v < hi)
    return [[k, c[k]] for k in sorted(c)]


def _band(yeje):
    for nm, a, b in BANDS:
        if a <= yeje < b:
            return nm
    return None


def _np_label(n):
    for nm, a, b in NP_BINS:
        if a <= n <= b:
            return nm
    return None


def _gap_label(g):
    for nm, a, b in GAP_BINS:
        if a <= g < b:
            return nm
    return None


def _ymd(s):
    t = "".join(ch for ch in str(s or "") if ch.isdigit())
    return f"{t[:4]}-{t[4:6]}-{t[6:8]}" if len(t) >= 8 else ""


def _no(s):
    return str(s or "").strip()


# ── ② 순위 자료 읽기 ────────────────────────────────────────────
def _first_rows(paths):
    """first.json 들을 합칩니다. 같은 공고는 «순위가 더 많이 실린 것» 이 이깁니다."""
    out = {}
    for p in paths:
        if not os.path.exists(p):
            continue
        try:
            if p.endswith(".gz"):
                with gzip.open(p, "rt", encoding="utf-8") as f:
                    st = json.load(f)
            else:
                with io.open(p, encoding="utf-8") as f:
                    st = json.load(f)
        except Exception as e:
            print(f"  ⚠️ {os.path.basename(p)} 못 읽음: {e}")
            continue
        for no, r in (st.get("con") or {}).items():       # 공사만 — 용역(serv)은 뺍니다
            cs = r.get("corps") or []
            key = _no(r.get("no") or no)
            if key in out and len(out[key].get("corps") or []) >= len(cs):
                continue
            out[key] = r
    return out


def load_ranks(no2inst, first_paths=None, ranks_mod=None, log=print):
    """공고번호 → {"i":기관, "d":날짜, "n":전체수, "r":[[순위,사업자번호,이름,금액,율]], "x":first 줄}

    ⚠️ 기관은 «① 에 있는 공고» 에서만 찾습니다 — ① 에서 용역을 거른 것과 맞추려는 것입니다.
       first.json 의 공고는 기관 이름이 실려 있어 ① 에 없어도 씁니다(최근 며칠치).
    """
    out = {}
    # ▸ 3년치 보관함
    if ranks_mod is None:
        try:
            import ranks3y as ranks_mod                    # noqa: F401
        except Exception:
            ranks_mod = None
    n3 = 0
    if ranks_mod is not None:
        for no, v in ranks_mod.iter_notices():
            key = _no(no)
            inst = no2inst.get(key)
            if not inst or len(v.get("r") or []) < 1:
                continue
            rows = []
            for rk, bno, nm, amt, rate in v["r"]:
                rows.append([int(rk), str(bno or ""), str(nm or ""), int(amt or 0), _num(rate)])
            out[key] = {"i": inst, "d": _ymd(v.get("d")), "n": int(v.get("n") or len(rows)),
                        "r": rows, "x": None}
            n3 += 1
    # ▸ 최근 (first.json) — 보관함보다 칸이 많습니다(면허·기초금액·A값). 있으면 덮어씁니다.
    if first_paths is None:
        first_paths = [os.path.join(ROOT, "data", "seed", "first.json.gz"),
                       os.path.join(ROOT, "data", "store", "first.json")]
    fr = _first_rows(first_paths)
    nf = 0
    for key, r in fr.items():
        cs = r.get("corps") or []
        if len(cs) < 2:                    # 순위를 아직 못 받은 개찰 — 낙찰자 한 곳뿐
            continue
        inst = no2inst.get(key) or str(r.get("inst") or "").strip()
        if not inst:
            continue
        rows = []
        for i, c in enumerate(cs, 1):
            rows.append([i, str(c[3] if len(c) > 3 and c[3] else ""), str(c[0] or ""),
                         int(c[1] or 0), _num(c[2]) if len(c) > 2 else None])
        out[key] = {"i": inst, "d": _ymd(r.get("dt")), "n": int(r.get("nrank") or len(cs)),
                    "r": rows, "x": r}
        nf += 1
    log(f"  순위 자료: 보관함 {n3:,}건 · 최근 {nf:,}건 → 합쳐서 {len(out):,}건")
    return out


# ── 기관 하나 ───────────────────────────────────────────────────
def _gap_of(rows):
    """1·2위 투찰률 차이(%p). 2위 금액이 1위보다 싸면(하한 미달이 끼어든 자리) 재지 않습니다."""
    if len(rows) < 2:
        return None
    a, b = rows[0], rows[1]
    if a[0] != 1 or b[0] != 2 or a[4] is None or b[4] is None:
        return None
    if b[3] < a[3]:
        return None
    g = round(b[4] - a[4], 4)
    return g if 0 <= g < 5 else None


# ── 🚨 낙찰하한율이 오른 날 — 자료로 찾습니다 ─────────────────────
#   2025년에 적격심사 공사 낙찰하한율이 2%p 올랐습니다. 자료에서는 한 주 사이에
#   전국 낙찰 투찰률 가운데값이 88.4% → 90.3% 로 뛰었습니다(실측: 2025-05-12 주).
#   3년치를 한데 섞으면 «88%대와 90%대 두 봉우리» 가 생겨 «가장 많이 난 자리» 가 거짓이 됩니다.
#   그래서 낙찰 투찰률은 «오른 뒤» 만 봅니다. 날짜는 손으로 적지 않고 자료로 찾습니다.
CUT_FALLBACK = "2025-05-12"


def find_cut(df):
    """주마다 전국 낙찰 투찰률 가운데값을 보고, 89.5% 를 넘어 «네 주 내리» 머문 첫 주."""
    import pandas as pd
    d = df[df["rate"].between(80, 100.5) & df["dt"].notna()]
    if not len(d):
        return CUT_FALLBACK
    wk = d.groupby(d["dt"].dt.to_period("W"))["rate"].agg(["median", "count"])
    wk = wk[wk["count"] >= 30]
    rows = list(wk.itertuples())
    for i in range(len(rows) - 3):
        if all(rows[i + j].median >= 89.5 for j in range(4)) and \
           all(r.median < 89.5 for r in rows[max(0, i - 4):i]) and i > 0:
            return rows[i].Index.start_time.strftime("%Y-%m-%d")
    return CUT_FALLBACK


# ── 🚨 모으는 폭이 넓어진 달 — 이것도 자료로 찾습니다 ──────────────────
#   3년치 파일은 전국이 한 달 2,500~2,900건인데, 2026-03 부터(매일 수집분)는 한 달 1만 건이 넘습니다.
#   그대로 «달마다 몇 건» 을 세면 2026년 달이 다섯 배로 부풀어 «3월에 몰린다» 같은 거짓말이 나옵니다.
#   그래서 «달마다» 는 폭이 고른 앞쪽 기간만, «한 해 평균» 으로 셉니다.
def find_dense(df):
    """전국 달별 건수가 그 앞 달들 가운데값의 2.5배를 처음 넘는 달 (YYYY-MM). 없으면 ''."""
    import pandas as pd
    d = df[df["dt"].notna()]
    c = d.groupby(d["dt"].dt.to_period("M")).size()
    ks, vs = list(c.index), list(c.values)
    for i in range(6, len(vs)):
        before = sorted(vs[:i])
        if vs[i] > 2.5 * before[len(before) // 2]:
            return str(ks[i])
    return ""


def month_years(df, dense):
    """폭이 고른 기간에 달(1~12)마다 몇 해가 들어 있나 — «한 해 평균» 의 분모"""
    d = df[df["dt"].notna()]
    ym = set(str(p) for p in d["dt"].dt.to_period("M").unique())
    cnt = [0] * 12
    for x in ym:
        if dense and x >= dense:
            continue
        cnt[int(x[5:7]) - 1] += 1
    return cnt


def one_agency(g, rk, p50, cut=CUT_FALLBACK, dense="", myears=None):
    """g: 이 기관의 ① 줄들(DataFrame) · rk: 이 기관의 ② 개찰들(list) · cut: 하한율 오른 날"""
    import pandas as pd
    out = {}
    cut_ts = pd.Timestamp(cut)
    rates_all = [float(v) for v in g["rate"].tolist() if v is not None and not pd.isna(v) and 80 <= v < 100.5]
    rates = [float(r) for d, r in zip(g["dt"].tolist(), g["rate"].tolist())
             if d is not None and not pd.isna(d) and d >= cut_ts
             and r is not None and not pd.isna(r) and 80 <= r < 100.5]
    old = [float(r) for d, r in zip(g["dt"].tolist(), g["rate"].tolist())
           if d is not None and not pd.isna(d) and d < cut_ts
           and r is not None and not pd.isna(r) and 80 <= r < 100.5]
    # 오른 뒤가 너무 적으면(10건 미만) 할 수 없이 전부를 쓰고, 종이에 그렇다고 적습니다
    섞음 = len(rates) < 10
    if 섞음:
        rates = rates_all
    dts = g["dt"].dropna()
    # ── 낙찰 3년치 ─────────────────────────
    yr = defaultdict(list)
    mo = [0] * 12
    qt = defaultdict(list)
    for d, r in zip(g["dt"].tolist(), g["rate"].tolist()):
        if d is None or pd.isna(d):
            continue
        if not dense or d.strftime("%Y-%m") < dense:
            mo[d.month - 1] += 1
        if r is not None and not pd.isna(r) and 80 <= r < 100.5:
            yr[d.year].append(float(r))
            qt[f"{d.year}-{(d.month - 1) // 3 + 1}"].append(float(r))
    h = _hist(rates, 0.1, 80, 100.5)
    top = sorted(h, key=lambda x: -x[1])[:5]
    out["w"] = {
        "n": int(len(g)), "d0": dts.min().strftime("%Y-%m-%d") if len(dts) else "",
        "d1": dts.max().strftime("%Y-%m-%d") if len(dts) else "",
        "med": _r(_med(rates)), "avg": _r(sum(rates) / len(rates)) if rates else None,
        "sd": _r(_sd(rates)), "q1": _r(_q(rates, 0.25)), "q3": _r(_q(rates, 0.75)),
        "h": h, "top": top,
        # 하한율 오른 뒤(cut~) 만 본 것인지 — nn: 그 건수 · mix: 너무 적어 전부 섞었나 · old: 그 전
        "cut": cut, "nn": len(rates), "mix": 섞음,
        "old": {"n": len(old), "med": _r(_med(old))} if old else None,
        "yr": [[y, len(v), _r(_med(v)), _r(sum(v) / len(v)), _r(_sd(v))] for y, v in sorted(yr.items())],
        # 달마다 «한 해 평균» — 폭이 고른 기간(~dense 앞)만. mn: 그 기간 건수 · mw: 그 기간
        "m": [round(mo[i] / myears[i], 1) if myears and myears[i] else 0 for i in range(12)],
        "mn": sum(mo), "mw": [dts.min().strftime("%Y-%m") if len(dts) else "", dense],
    }
    # ── 참가업체수·1·2위 차이 — 개찰마다 ─────
    np_of = {}      # 공고번호 → 참가업체수 (순위 자료가 먼저, 없으면 ① 의 참가업체수 칸)
    gap_of = {}
    for v in rk:
        if v["n"]:
            np_of[v["no"]] = v["n"]
        gp = _gap_of(v["r"])
        if gp is not None:
            gap_of[v["no"]] = gp
    for no, npv in zip(g["공고번호"].tolist(), g["np"].tolist()):
        k = _no(no)
        if k and k not in np_of and npv is not None and not pd.isna(npv) and npv > 0:
            np_of[k] = int(npv)
    # ── 금액대 ─────────────────────────────
    bands = defaultdict(lambda: {"r": [], "np": [], "sj": [], "gap": []})
    for no, dt, amt, r, sj in zip(g["공고번호"].tolist(), g["dt"].tolist(), g["amt"].tolist(),
                                  g["rate"].tolist(), g["sj"].tolist()):
        if not amt or r is None or pd.isna(r) or not (80 <= r < 100.5):
            continue
        if not 섞음 and (dt is None or pd.isna(dt) or dt < cut_ts):
            continue                       # 금액대 표도 «하한율 오른 뒤» 만
        b = _band(float(amt) / (float(r) / 100.0))
        if not b:
            continue
        k = _no(no)
        bands[b]["r"].append(float(r))
        if k in np_of:
            bands[b]["np"].append(np_of[k])
        if sj is not None and not pd.isna(sj):
            bands[b]["sj"].append(float(sj))
        if k in gap_of:
            bands[b]["gap"].append(gap_of[k])
    out["b"] = [[nm, len(bands[nm]["r"]), _r(_med(bands[nm]["r"])),
                 _medi(bands[nm]["np"]), _r(_med(bands[nm]["sj"])), _r(_med(bands[nm]["gap"]), 4)]
                for nm, _, _ in BANDS if bands[nm]["r"]]
    # ── 사정률 · 창 (③ 최근분) ──────────────
    sjr = [(d, float(s)) for d, s in zip(g["dt"].tolist(), g["sj"].tolist())
           if s is not None and not pd.isna(s)]
    if sjr:
        sv = [s for _, s in sjr]
        ds = [d for d, _ in sjr if d is not None and not pd.isna(d)]
        out["sj"] = {"n": len(sv), "d0": min(ds).strftime("%Y-%m-%d") if ds else "",
                     "d1": max(ds).strftime("%Y-%m-%d") if ds else "",
                     "med": _r(_med(sv)), "avg": _r(sum(sv) / len(sv)), "sd": _r(_sd(sv)),
                     "h": _hist(sv, 0.5, 95, 105.01),
                     "up": sum(1 for s in sv if s > p50)}
    mg = sorted(float(v) for v in g["mgn"].tolist() if v is not None and not pd.isna(v))
    if mg:
        out["mg"] = {"n": len(mg), "med": _r(_med(mg)),
                     "wide": sum(1 for v in mg if v >= 0.3), "tight": sum(1 for v in mg if v < 0.02)}
    # ── 순위 자료 ───────────────────────────
    if rk:
        rk_d = sorted(v["d"] for v in rk if v["d"])
        nps = [v["n"] for v in rk if v["n"]]
        gaps = [gap_of[v["no"]] for v in rk if v["no"] in gap_of]
        crowd = [row[4] for v in rk for row in v["r"] if row[4] is not None and 80 <= row[4] < 100.5]
        npd = Counter(_np_label(n) for n in nps)
        gd = Counter(_gap_label(x) for x in gaps)
        q = defaultdict(lambda: {"np": [], "r": []})
        for v in rk:
            if not v["d"]:
                continue
            y, m = int(v["d"][:4]), int(v["d"][5:7])
            k = f"{y}-{(m - 1) // 3 + 1}"
            if v["n"]:
                q[k]["np"].append(v["n"])
            if v["r"] and v["r"][0][0] == 1 and v["r"][0][4] is not None:
                q[k]["r"].append(v["r"][0][4])
        out["r"] = {
            "n": len(rk), "d0": rk_d[0] if rk_d else "", "d1": rk_d[-1] if rk_d else "",
            "rows": sum(len(v["r"]) for v in rk),
            "np": {"med": _medi(nps), "avg": _r(sum(nps) / len(nps), 1) if nps else None,
                   "max": max(nps) if nps else None,
                   "dist": [[nm, npd.get(nm, 0)] for nm, _, _ in NP_BINS]},
            "gap": {"n": len(gaps), "med": _r(_med(gaps), 4),
                    "close": sum(1 for x in gaps if x < CLOSE_PP),
                    "dist": [[nm, gd.get(nm, 0)] for nm, _, _ in GAP_BINS]},
            "h": _hist(crowd, 0.1, 80, 100.5),
            "q": [[k, len(q[k]["np"]), _medi(q[k]["np"]), _r(_med(q[k]["r"]))] for k in sorted(q)],
        }
        # ── 🔬 2026-09-28 정밀 보고서에만 — 소장님 「신청을 받아서 하는 건 더 정밀해야 해」 ──
        #   npb: 참가가 몇 곳일 때 낙찰선이 어디였나 [칸, 개찰, 낙찰 투찰률 가운데, 1·2위 차 가운데]
        #   dq : 참가자 가운데 «하한 아래(추정)» — 1순위보다 싸게 쓰고도 밀린 투찰.
        #        조달청 순위는 «하한을 넘긴 것 중 낮은 순» 이라 이렇게 가려집니다
        #        (실측: first.json 에서 그런 투찰의 99.7% 가 계산상 하한 아래였습니다).
        #   gw : 1·2위 금액 차이(원) 가운데값
        nb = defaultdict(lambda: {"r": [], "g": []})
        dq_rows = dq_all = 0
        dq_share = []
        gw = []
        for v in rk:
            rows = v["r"]
            w = rows[0] if rows and rows[0][0] == 1 else None
            lab = _np_label(v["n"]) if v["n"] else None
            if lab and w and w[4] is not None:
                nb[lab]["r"].append(w[4])
                if v["no"] in gap_of:
                    nb[lab]["g"].append(gap_of[v["no"]])
            if w and w[3]:
                below = sum(1 for x in rows[1:] if x[3] and x[3] < w[3])
                dq_rows += below
                dq_all += len(rows)
                if len(rows) >= 5:
                    dq_share.append(below / len(rows) * 100)
                s2 = next((x for x in rows if x[0] == 2), None)
                if s2 and s2[3] and s2[3] >= w[3]:
                    gw.append(s2[3] - w[3])
        out["r"]["npb"] = [[nm, len(nb[nm]["r"]), _r(_med(nb[nm]["r"])), _r(_med(nb[nm]["g"]), 4)]
                           for nm, _, _ in NP_BINS if nb[nm]["r"]]
        out["r"]["dq"] = {"rows": dq_all, "below": dq_rows,
                          "share": _r(dq_rows / dq_all * 100, 1) if dq_all else None,
                          "med": _r(_med(dq_share), 1)}
        out["r"]["gw"] = int(_med(gw)) if gw else None
        # ── 자주 오는 업체 ─────────────────
        reg = defaultdict(lambda: {"nm": "", "d": "", "in": 0, "win": 0, "rk": [], "r": []})
        for v in rk:
            for row in v["r"]:
                rank, bno, nm, amt, rate = row
                key = bno or ("~" + nm)
                e = reg[key]
                if v["d"] >= e["d"]:
                    e["nm"], e["d"] = nm, v["d"]
                e["in"] += 1
                e["rk"].append(rank)
                if rank == 1:
                    e["win"] += 1
                if rate is not None:
                    e["r"].append(rate)
        best = sorted(reg.items(), key=lambda kv: (-kv[1]["in"], -kv[1]["win"], kv[1]["nm"]))[:TOPN]
        out["reg"] = [[e["nm"][:NAME_CUT], k if not k.startswith("~") else "", e["in"], e["win"],
                       _med(e["rk"]), _r(_med(e["r"]))] for k, e in best]
        out["regN"] = len(reg)
        # ── 면허(업종) — first.json 에만 있습니다 ──
        lic = defaultdict(lambda: {"n": 0, "np": [], "r": []})
        ld = []
        for v in rk:
            x = v.get("x")
            if not x:
                continue
            ls = x.get("lic") or []
            if not ls:
                continue
            ld.append(v["d"])
            for L in ls[:3]:
                nm = str(L).split("/")[0].strip()[:24]
                if not nm:
                    continue
                lic[nm]["n"] += 1
                if v["n"]:
                    lic[nm]["np"].append(v["n"])
                if v["r"] and v["r"][0][4] is not None:
                    lic[nm]["r"].append(v["r"][0][4])
        if lic:
            ld = sorted(d for d in ld if d)
            rows = sorted(lic.items(), key=lambda kv: -kv[1]["n"])[:8]
            out["lic"] = {"n": len(ld), "d0": ld[0] if ld else "", "d1": ld[-1] if ld else "",
                          "rows": [[nm, e["n"], _medi(e["np"]), _r(_med(e["r"]))] for nm, e in rows]}
    # ── 낙찰 업체 ───────────────────────────
    # ⚠️ 낙찰 업체는 «이름» 으로 셉니다. 3년치 파일 뒤쪽(추가자료)에는 사업자번호 칸이 빈 줄이
    #    많아, 번호로 세면 같은 회사가 «번호 있는 줄» 과 «없는 줄» 로 둘로 갈립니다(실측: 해남군).
    #    한 기관 안에서 같은 이름의 다른 법인이 겹치는 일은 드뭅니다. 번호는 아는 것만 붙여 둡니다.
    wc = Counter()
    wbno = {}
    for nm, bno in zip(g["1순위업체"].tolist(), g["bizno"].tolist()):
        nm = str(nm or "").strip()
        if not nm:
            continue
        wc[nm] += 1
        if bno and nm not in wbno:
            wbno[nm] = str(bno)
    tot = sum(wc.values()) or 1
    wtop = wc.most_common(TOPN)
    out["wins"] = [[k[:NAME_CUT], wbno.get(k, ""), v] for k, v in wtop]
    out["wn"] = len(wc)
    out["top1"] = _r(wtop[0][1] / tot * 100, 1) if wtop else 0
    out["top5"] = _r(sum(v for _, v in wtop[:5]) / tot * 100, 1) if wtop else 0
    # ── 최근 낙찰 사례 ─────────────────────
    rec = g.sort_values("dt", ascending=False).head(CASES)
    out["cases"] = [[
        r["dt"].strftime("%Y-%m-%d") if pd.notna(r["dt"]) else "",
        str(r["공고명"])[:NAME_CUT],
        np_of.get(_no(r["공고번호"])),
        _r(r["rate"]) if r["rate"] is not None and not pd.isna(r["rate"]) else None,
        int(r["amt"] or 0),
        gap_of.get(_no(r["공고번호"])),
    ] for _, r in rec.iterrows()]
    return out


# ── 🏷 이름이 바뀐 기관 — 한 보고서로 묶습니다 ─────────────────────
#   3년 사이에 광역 이름이 바뀌었습니다. 나라장터에는 옛 이름과 새 이름이 «다른 기관» 으로 남습니다.
#   실측: 「전라남도 여수시」(~2026-09) 와 「전남광주통합특별시 여수시」(2026-04~) 가 따로 있어,
#   그대로 두면 3년치 보고서가 둘로 쪼개져 둘 다 얇아집니다(순위 기록은 새 이름에만 붙습니다).
#   ⚠️ 새 이름이 «자료에 실제로 있을 때만» 묶습니다. 없는 이름을 지어내지 않습니다.
#   ⚠️ 도 본청(「전라남도」 한 낱말)과 교육청(이름 꼴이 다름)은 묶지 않습니다.
RENAMES = [("강원도 ", "강원특별자치도 "), ("전라북도 ", "전북특별자치도 "),
           ("전라남도 ", "전남광주통합특별시 "), ("광주광역시 ", "전남광주통합특별시 ")]


def canon_map(names):
    """{옛 이름: 새 이름} — 새 이름이 names 안에 있을 때만"""
    ns = set(names)
    out = {}
    for n in ns:
        for old, new in RENAMES:
            if n.startswith(old) and len(n) > len(old):
                c = new + n[len(old):]
                if c in ns and c != n:
                    out[n] = c
                break
    return out


# ── 모두 ────────────────────────────────────────────────────────
def build(df, out_dir, first_paths=None, ranks_mod=None, log=print):
    """build_json.main() 이 build_agency() «뒤에» 부릅니다 — agency/names.json 이 있어야 묶음을 압니다."""
    import pandas as pd
    names_p = os.path.join(out_dir, "agency", "names.json")
    try:
        with io.open(names_p, encoding="utf-8") as f:
            chunk_of = {r[0]: r[2] for r in json.load(f)}
    except Exception as e:
        log(f"⚠️ 정밀 보고서: agency/names.json 을 못 읽어 건너뜁니다 ({e})")
        return 0
    d = df[df["발주기관"] != ""].copy()
    cm = canon_map(d["발주기관"].unique().tolist())
    d["기관"] = d["발주기관"].map(lambda n: cm.get(n, n))
    olds = defaultdict(list)                  # 새 이름 → [(옛 이름, 건수)]
    _oc = d[d["발주기관"] != d["기관"]].groupby(["기관", "발주기관"]).size()
    for (nw, od), c in _oc.items():
        olds[nw].append([od, int(c)])
    cnt = d.groupby("기관").size()
    keep = set(n for n, c in cnt.items() if c >= MIN_WIN and n in chunk_of)
    no2inst = {}
    for no, inst in zip(d["공고번호"].tolist(), d["기관"].tolist()):
        k = _no(no)
        if k and inst in keep:
            no2inst[k] = inst
    rk_all = load_ranks(no2inst, first_paths, ranks_mod, log)
    by_inst = defaultdict(list)
    for no, v in rk_all.items():
        v["i"] = cm.get(v["i"], v["i"])
        if v["i"] in keep:
            v["no"] = no
            by_inst[v["i"]].append(v)
    cut = find_cut(d)
    dense = find_dense(d)
    myears = month_years(d, dense)
    log(f"  낙찰하한율 오른 날(자료로 찾음): {cut} · 모으는 폭이 넓어진 달: {dense or '없음'}")
    sjs = sorted(float(v) for v in d["sj"].tolist() if v is not None and not pd.isna(v))
    p50 = sjs[len(sjs) // 2] if len(sjs) >= 10 else 99.896
    # 전국 기준값 — «이 기관은 전국보다 …» 를 말하려고
    _cts = pd.Timestamp(cut)
    allr = [float(v) for t, v in zip(d["dt"].tolist(), d["rate"].tolist())
            if v is not None and not pd.isna(v) and 80 <= v < 100.5
            and t is not None and not pd.isna(t) and t >= _cts]
    alln = [v["n"] for v in rk_all.values() if v["n"]]
    allg = [x for x in (_gap_of(v["r"]) for v in rk_all.values()) if x is not None]
    _dqa = _dqb = 0
    for v in rk_all.values():
        rows = v["r"]
        if rows and rows[0][0] == 1 and rows[0][3]:
            _dqb += sum(1 for x in rows[1:] if x[3] and x[3] < rows[0][3])
            _dqa += len(rows)
    rds = sorted(v["d"] for v in rk_all.values() if v["d"])
    meta = {"made": pd.Timestamp.now().strftime("%Y-%m-%d"), "p50": _r(p50),
            "wr": _r(_med(allr)), "np": _medi(alln), "gap": _r(_med(allg), 4),
            "close": _r(sum(1 for x in allg if x < CLOSE_PP) / len(allg) * 100, 1) if allg else None,
            "rd0": rds[0] if rds else "", "rd1": rds[-1] if rds else "", "rn": len(rk_all),
            "min": MIN_WIN, "n": len(keep), "cut": cut, "dense": dense,
            "dq": _r(_dqb / _dqa * 100, 1) if _dqa else None}
    chunks = defaultdict(dict)
    for name, g in d[d["기관"].isin(keep)].groupby("기관", sort=False):
        try:
            one = one_agency(g, by_inst.get(name, []), p50, cut, dense, myears)
            if olds.get(name):
                one["olds"] = sorted(olds[name], key=lambda x: -x[1])
            chunks[chunk_of[name]][name] = one
        except Exception as e:                      # 한 기관이 틀려도 나머지는 만듭니다
            log(f"  ⚠️ {name}: {e}")
    # 옛 이름으로 찾아도 나오게 — 옛 이름 자리에는 «새 이름으로 가라» 는 쪽지만 둡니다
    nal = 0
    for od, nw in cm.items():
        if nw in keep and od in chunk_of:
            chunks[chunk_of[od]][od] = {"=": nw, "c": chunk_of[nw]}
            nal += 1
    meta["alias"] = nal
    base = os.path.join(out_dir, "agency_deep")
    os.makedirs(base, exist_ok=True)
    size = 0
    for ch, obj in chunks.items():
        p = os.path.join(base, f"{ch}.json")
        with open(p, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        size += os.path.getsize(p)
    with open(os.path.join(base, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))
    log(f"  이름이 바뀐 기관 {nal:,}곳을 새 이름 보고서로 묶었습니다")
    log(f"정밀 보고서: 기관 {sum(len(c) for c in chunks.values()):,}곳 · 묶음 {len(chunks)}개 · "
        f"{size / 1024 / 1024:.1f}MB (순위 자료 {meta['rd0']} ~ {meta['rd1']} · {meta['rn']:,}건)")
    return sum(len(c) for c in chunks.values())


if __name__ == "__main__":
    import build_json as BJ
    build(BJ.load_all(), BJ.OUT)
