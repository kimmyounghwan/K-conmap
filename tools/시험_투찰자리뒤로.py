# -*- coding: utf-8 -*-
"""🎯 G624 바로투찰 금액 «뒤로 재보기» — 지난 개찰에 «바로투찰 금액을 넣었다면» 1순위 · 실격이 몇 %였나.

    python tools/시험_투찰자리뒤로.py            ← 옛 규칙 vs 지금 규칙(+ 예상 100곳+ → 95분위) · 나빠지면 exit 1
    python tools/시험_투찰자리뒤로.py --all      ← 다른 사이트 방식(끝자리 · 범위별 가운데 · 더 낮게)까지

소장님(11-09): 「투찰금액을 더 정교하게 다듬을 수는 없어?」 · 「다른 입찰사이트 참고해서...해줘.」 · 「시험도 해줘」 → 표 → 「적용해줘」

■ 자료: data/extra_*.csv(나라장터 개찰 1순위 — A값 · 예가범위 · 참가업체수가 있는 2026-08 뒤 공사)
■ 금액: 사이트 lib/bidmath.js 와 같은 길 — 사정률(p50 + z·σ) → 하한금액 올림(권장은 × 1.003) → 투찰률 소수 셋째 자리 올림 → 금액
■ 판정: 예정가격 = 1순위 금액 ÷ 1순위 투찰률 → 하한 = (예정가격 − A) × 하한율 + A(올림)
        내 금액 < 하한 → 실격 · 하한 ≤ 내 금액 < 1순위 금액 → 1순위 자리
■ 하한율: 추정가격(기초금액 ÷ 1.1) 규모 기준(89.745 · 88.745 · 87.495) — 1순위가 그 아래인 공고(하한율이 다른 공고)는 뺌
■ 예상 참가: 그날보다 «앞선» 개찰만 보고 같은 기관+금액대 → 같은 기관 → 같은 금액대의 참가업체수 중앙(사이트는 면허부터 봄 — 비슷한 맞힘)
⚠️ 숫자는 자료가 쌓이면 조금씩 바뀝니다. 규칙(AUTO_RULE)을 바꿀 때는 이것을 다시 돌려 표를 보고 정하십시오.
"""
import glob
import math
import os
import sys
from collections import defaultdict

import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P50 = 99.896
SINCE = "2026-08-01"


def jround(x):           # JS Math.round
    return np.floor(x + 0.5)


def load():
    fs = sorted(glob.glob(os.path.join(ROOT, "data", "extra_*.csv")))
    d = pd.concat([pd.read_csv(f, dtype={"공고번호": str, "사업자번호": str}) for f in fs], ignore_index=True)
    d = d.drop_duplicates("공고번호", keep="last")
    d["dt"] = pd.to_datetime(d["날짜"], errors="coerce")
    for c in ["투찰금액", "투찰률", "기초금액", "A값", "예가하한", "예가상한", "참가업체수"]:
        d[c] = pd.to_numeric(d[c], errors="coerce")
    d = d[(d["dt"] >= SINCE) & (d["기초금액"] > 0) & (d["투찰금액"] > 0) & (d["투찰률"] > 80) & (d["투찰률"] < 100)
          & d["예가하한"].notna() & d["예가상한"].notna() & (d["참가업체수"] >= 2)].copy()
    nm = d["공고명"].fillna("")
    d = d[~nm.str.contains("용역|관리|설계|감리|조사|측량|진단|컨설팅|청소|경비|위탁|여행|체험|급식|운영|교육|행사|홍보|보험|임차|렌탈|구매|물품|제조|납품")].copy()
    d["base"] = d["기초금액"].astype(float)
    d["W"] = d["투찰금액"].astype(float)
    d["A"] = np.where(d["A값적용"].astype(str).str.upper().eq("N"), 0.0, d["A값"].fillna(0).astype(float))
    d["Y"] = d["W"] / (d["투찰률"] / 100)
    est = d["base"] / 1.1
    d["llr"] = np.where(est >= 100e8, np.nan, np.where(est >= 50e8, 87.495, np.where(est >= 10e8, 88.745, 89.745)))
    d = d[d["llr"].notna()].copy()
    w = d["예가상한"] - d["예가하한"]
    d["sd"] = np.sqrt((w * w / 12) * (1 / 4) * (11 / 14))
    d["rng"] = np.where(w <= 4.01, 2, 3)
    d["N"] = d["참가업체수"]
    rw = (d["W"] - d["A"]) / (d["Y"] - d["A"]) * 100
    d = d[rw >= d["llr"] - 0.01].copy()                                         # 하한율이 규모 기준과 다른 공고는 뺌
    lim = np.ceil((d["Y"] - d["A"]) * (d["llr"] / 100) + d["A"])
    d["lim"] = np.minimum(lim, d["W"])                                          # 투찰률 소수 셋째 자리 반올림 탓 — 1순위는 하한 이상
    return d.sort_values("dt").reset_index(drop=True)


def enp_of(d, min_n=6):
    inst = d["발주기관"].fillna("").values
    band = np.digitize(d["base"].values, [0.5e8, 1e8, 2e8, 3e8, 5e8, 10e8, 30e8])
    days = d["dt"].values.astype("datetime64[D]")
    N = d["N"].values
    H = defaultdict(list)
    out = np.full(len(d), np.nan)
    order = np.argsort(days, kind="stable")
    i = 0
    while i < len(order):
        j = i
        while j < len(order) and days[order[j]] == days[order[i]]:
            j += 1
        for k in order[i:j]:
            for key, mn, last in ((("is", inst[k], band[k]), min_n, 60), (("i", inst[k]), min_n, 60), (("s", band[k]), 30, 300)):
                L = H[key]
                if len(L) >= mn:
                    out[k] = np.median(L[-last:])
                    break
        for k in order[i:j]:
            H[("is", inst[k], band[k])].append(N[k]); H[("i", inst[k])].append(N[k]); H[("s", band[k])].append(N[k])
        i = j
    return out


def amount(d, z, margin=1.0, p50=P50):
    sj = jround((p50 + z * d["sd"].values) * 1000) / 1000
    m = np.ceil(np.ceil((d["base"].values * (sj / 100) - d["A"].values) * (d["llr"].values / 100) + d["A"].values) * margin)
    rate = np.ceil(m / (d["base"].values * (P50 / 100)) * 100 * 1000) / 1000
    return np.ceil(d["base"].values * (P50 / 100) * (rate / 100))


def judge(d, X):
    dq = X < d["lim"].values
    return dq, (~dq) & (X < d["W"].values)


def rule_amount(d, enp, rules):
    """rules: [(조건(enp) → bool, z, 여유)] 앞에서부터 · 아무것도 아니면 권장(0.674 · 1.003)"""
    X = amount(d, 0.674, 1.003)
    done = np.zeros(len(d), bool)
    for cond, z, mg in rules:
        m = cond(enp) & ~done
        if m.any():
            X[m] = amount(d[m], z, mg)
            done |= m
    return X


def line(nm, d, X, X0=None, m=None):
    m = np.ones(len(d), bool) if m is None else m
    dq, w = judge(d, X)
    s = f"{nm:<34} 1순위 {w[m].sum():>5} ({w[m].mean() * 100:5.2f}%) · 실격 {dq[m].mean() * 100:5.2f}%"
    if X0 is not None:
        dq0, w0 = judge(d, X0)
        a, b = (w & ~w0 & m).sum(), (~w & w0 & m).sum()
        s += f" | 짝지어 1순위 +{a}/−{b} (z={(a - b) / math.sqrt(max(a + b, 1)):+.2f})"
    print(s)
    return w[m].mean() * 100, dq[m].mean() * 100


def main():
    d = load()
    enp = np.nan_to_num(enp_of(d), nan=-1)
    print(f"공사 {len(d):,}건 · {d['dt'].min().date()} ~ {d['dt'].max().date()} · 예상 참가 앎 {(enp > 0).mean() * 100:.1f}%")
    small = lambda e: (e > 0) & (e < 10)
    big = lambda e: e >= 100
    X_old = rule_amount(d, enp, [(small, 0.8416, 1.0)])                       # 옛 규칙(11-09 전)
    X_new = rule_amount(d, enp, [(small, 0.8416, 1.0), (big, 1.6449, 1.0)])   # 지금 규칙(bidmath.js AUTO_RULE · collect.py PICK_AUTO)
    w0, q0 = line("옛 규칙(2~9곳 80분위 · 그 밖 권장)", d, X_old)
    w1, q1 = line("지금(+ 예상 100곳+ → 95분위)", d, X_new, X_old)
    m = big(enp)
    print(f"  그중 예상 100곳+ {m.sum():,}건:")
    line("    옛 규칙", d, X_old, None, m)
    line("    지금", d, X_new, X_old, m)
    half = d["dt"].values < np.datetime64("2026-10-01")
    for nm, mm in (("8~9월", half), ("10월~", ~half)):
        line(f"  {nm} 옛 규칙", d, X_old, None, mm)
        line(f"  {nm} 지금", d, X_new, X_old, mm)
    if "--all" in sys.argv:
        print("■ 다른 사이트 방식(참고)")
        for z, nm in ((0.25, "더 낮게(25분위 자리 z 0.25)"), (1.0, "고정 z 1.0")):
            line(nm, d, amount(d, z), X_old)
        S0 = ((X_old - d["A"].values) / (d["llr"].values / 100) + d["A"].values) / d["base"].values * 100
        cell = np.floor(S0 / 0.01 + 1e-9) * 0.01
        Xe = np.ceil((d["base"].values * ((cell + 0.008) / 100) - d["A"].values) * (d["llr"].values / 100) + d["A"].values)
        rate = np.ceil(Xe / (d["base"].values * (P50 / 100)) * 100 * 1000) / 1000
        line("투찰률 끝자리(칸 안 .008)", d, np.ceil(d["base"].values * (P50 / 100) * (rate / 100)), X_old)
    bad = []
    if not (q1 < q0 - 1.0):
        bad.append(f"실격이 1%p 넘게 줄지 않음({q0:.2f} → {q1:.2f})")
    if not (w1 >= w0 * 0.95):
        bad.append(f"1순위가 5% 넘게 줄어듦({w0:.2f} → {w1:.2f})")
    print(("❌ " + " · ".join(bad)) if bad else "✅ 지금 규칙: 1순위 그대로(±5% 안) · 실격 1%p 넘게 줄어듦")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
