# -*- coding: utf-8 -*-
"""
bidmath.py — 화면과 **따로** 쓴 계산기 (교차검증용)

⚠️ 이 파일은 화면 코드(BaroBid.jsx)를 옮겨 적은 것이 아닙니다.
   규정과 실측으로 정한 «식»에서 다시 유도해 썼습니다.
   두 구현이 같은 답을 내야 «맞다» 고 말할 수 있습니다.
   한쪽을 고치면 다른 쪽은 그대로 두고 돌려 보세요 — 그게 검증입니다.

식 (2026-09-02 실측으로 확정)
  예정가격      = 기초금액 × 사정률/100
  조달청 투찰률 = 투찰금액 ÷ 예정가격 × 100        (A값을 빼지 않음)
  낙찰하한금액  = ceil((예정가격 − A) × 낙찰하한율/100 + A)
  사정률 표준편차 σ = √( (범위폭²/12) × (1/추첨개수) × ((전체개수−추첨개수)/(전체개수−1)) )
  권장금액      = ceil( 낙찰하한금액(P50 + K·σ) × 여유 )
                  K = 0.674(A값 알면) / 1.63(모르면)
                  여유 = 1.003(A값 알면) / 1.0(모르면)
"""
import math

P50_DEFAULT = 99.896          # 전국 사정률 중앙값 (overview.json 의 sjq.p50)

# 낙찰하한율 — 추정가격 구간별 (지방자치단체 일반공사 적격심사)
BANDS = [(10e8, 89.745), (50e8, 88.745), (100e8, 87.495), (float("inf"), None)]


def r3(x):
    """자바스크립트 Math.round 와 같은 반올림 (0.5 는 위로)"""
    return math.floor(x * 1000 + 0.5) / 1000


def c3(x):
    return math.ceil(x * 1000) / 1000


def sigma(lo, hi, ptot=15, pdrw=4):
    w = (hi or 0) - (lo or 0)
    ptot = ptot or 15
    pdrw = pdrw or 4
    if w <= 0 or pdrw < 1 or ptot <= pdrw:
        return None
    return math.sqrt((w * w / 12) * (1 / pdrw) * ((ptot - pdrw) / (ptot - 1)))


def band_of(est):
    for lim, rate in BANDS:
        if est < lim:
            return rate
    return None


def limit_amount(base, sj, ll, a):
    """낙찰하한금액 — 규정대로 A값을 뺀 뒤 곱하고 다시 더합니다"""
    yeje = base * (sj / 100.0)
    return math.ceil((yeje - a) * (ll / 100.0) + a)


def recommend(base, ll, a, a_known, p50=P50_DEFAULT, lo=-3, hi=3, ptot=15, pdrw=4):
    """바로투찰이 내는 금액. 화면과 같은 답이 나와야 합니다."""
    sd = sigma(lo, hi, ptot, pdrw)
    if not base or not ll or sd is None:
        return None
    k = 0.674 if a_known else 1.63
    margin = 1.003 if a_known else 1.0
    sj = r3(p50 + k * sd)
    amt = math.ceil(limit_amount(base, sj, ll, a) * margin)
    return {"sj": sj, "k": k, "margin": margin, "pctile": 75 if a_known else 95,
            "amt": amt, "sd": sd}


def shown(base, rec_amt, p50=P50_DEFAULT):
    """화면이 실제로 띄우는 «투찰률»과 «금액».
       금액 → 투찰률 → 금액 으로 한 번 돌아가므로 몇 원 올라갑니다(올림)."""
    yeje_mid = base * (p50 / 100.0)
    rate = c3(rec_amt / yeje_mid * 100.0)
    return {"rate": rate, "amt": math.ceil(yeje_mid * rate / 100.0),
            "yeje": math.floor(yeje_mid)}


def score(base, a, a_known, ll, win_amt, win_rate, p50=P50_DEFAULT,
          lo=-3, hi=3, ptot=15, pdrw=4):
    """개찰이 끝난 공고 채점."""
    yeje = round(win_amt / (win_rate / 100.0))
    ro = recommend(base, ll, a, a_known, p50, lo, hi, ptot, pdrw)
    if ro is None:
        return None
    # ★ 2026-09-03 — 채점의 «우리 금액» 은 화면이 실제로 띄우는 금액(shown) 이어야 합니다.
    #   recommend 의 금액을 그대로 쓰면 바로투찰 화면과 몇 원~몇십만 원 어긋납니다
    #   (소장님: 「바로투찰하고 1순위 채점에서 권장투찰가 금액이 달라」).
    m = shown(base, ro["amt"], p50)["amt"]
    l = math.ceil((yeje - a) * (ll / 100.0) + a)
    return {"yeje": yeje, "our": m, "limit": l,
            "sj_real": r3(yeje / base * 100.0) if base else None,
            "dq": m < l, "beat": (m >= l) and (m < win_amt),
            "gap": m - win_amt, "sj_q": ro["sj"], "pctile": ro["pctile"]}


def rank_bracket(ladder, my_amt):
    """순위 사다리로 «몇 위쯤인지» 좁힙니다.
       ladder = [[등수, 금액], ...] 낮은 금액 순."""
    lad = sorted([x for x in (ladder or []) if x and x[0] > 0 and x[1] > 0])
    if not lad:
        return None
    if my_amt < lad[0][1]:
        return (1, 1)
    lo_r, hi_r = None, None
    for i, (r, amt) in enumerate(lad):
        if my_amt >= amt:
            lo_r = r
            hi_r = lad[i + 1][0] if i + 1 < len(lad) else None
    return (lo_r, hi_r)
