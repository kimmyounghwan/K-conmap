# -*- coding: utf-8 -*-
"""📊 업체 입찰 성적표 — 숫자 뽑기 (2026-09-15)

「요청한 업체에만 3년 입찰 분석 PDF 를 드린다」는 상품의 **엔진**입니다.
여기서는 숫자만 뽑고, 종이(PDF)는 따로 만듭니다.

    python tools\\report_data.py --bno 1234567890 > 성적표.json
    python tools\\report_data.py --pick          (자료가 제일 많은 업체를 골라 줍니다)

어디서 읽나
  · data/store/first.json      최근 개찰 (순위·기초금액·A값·사다리가 다 있음)
  · data/store/ranks3y/*.csv.gz 3년치 순위 (쌓이는 대로 — 아직 비어 있을 수 있음)

⚠️ 업체는 **사업자번호**로 찾습니다. 이름으로 찾으면 동명 업체와 섞입니다
   (실측: 같은 이름에 사업자번호가 다른 업체 1,846가지).
"""
import argparse
import collections
import io
import json
import os
import datetime
import statistics
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools"))
import bidmath as B                                            # noqa: E402

STORE = os.path.join(ROOT, "data", "store")


def load_first():
    with io.open(os.path.join(STORE, "first.json"), encoding="utf-8") as f:
        return list(json.load(f).get("con", {}).values())


def p50_now():
    """전국 사정률 중앙값 — 있으면 써서 «그날의 기준» 에 가깝게 맞춥니다."""
    p = os.path.join(ROOT, "web", "public", "data", "overview.json")
    try:
        with io.open(p, encoding="utf-8") as f:
            v = ((json.load(f).get("sjq") or {}).get("p50"))
        return float(v) if v else B.P50_DEFAULT
    except Exception:
        return B.P50_DEFAULT


def my_line(row, bno):
    """이 개찰에서 우리 줄을 찾습니다. 없으면 None.
       돌려주는 것: (등수, 이름, 금액, 투찰률)"""
    for i, c in enumerate(row.get("corps") or [], 1):
        if len(c) > 3 and c[3] and c[3] == bno:
            return i, c[0], int(c[1] or 0), (float(c[2]) if c[2] else None)
    return None


def one(row, bno, p50):
    """개찰 한 건을 채점합니다."""
    mine = my_line(row, bno)
    if not mine:
        return None
    rank, nm, amt, rate = mine
    cs = row.get("corps") or []
    win_amt = int(cs[0][1] or 0) if cs else 0
    win_rate = float(cs[0][2]) if cs and cs[0][2] else None
    out = {
        "no": row.get("no"), "dt": row.get("dt"), "name": row.get("name"),
        "inst": row.get("inst"), "est": row.get("est"), "base": row.get("base"),
        "n": row.get("nrank") or len(cs), "rank": rank, "name_used": nm,
        "amt": amt, "rate": rate, "win_amt": win_amt, "win_rate": win_rate,
        "baro": None,
    }
    base = row.get("base") or 0
    llr = row.get("llr") or 0
    a = row.get("aval") or 0
    a_known = str(row.get("ayn") or "").upper() == "Y"
    if base and llr and win_amt and win_rate:
        sc = B.score(base, a, a_known, llr, win_amt, win_rate, p50,
                     row.get("lo") or -3, row.get("hi") or 3,
                     row.get("ptot") or 15, row.get("pdrw") or 4)
        if sc:
            br = B.rank_bracket(row.get("rq"), sc["our"], sc["limit"], sc["beat"])
            out["limit"] = sc["limit"]
            out["yeje"] = sc["yeje"]
            out["llr"] = llr
            out["a_known"] = a_known
            out["aval"] = a
            if sc["yeje"]:
                # 조달청 투찰률과 같은 잣대 (A값을 빼지 않고 예정가격으로 나눕니다)
                out["my_rate"] = round(amt / sc["yeje"] * 100, 3)
                out["lim_rate"] = round(sc["limit"] / sc["yeje"] * 100, 3)
                out["win_gap_pp"] = round((win_amt - sc["limit"]) / sc["yeje"] * 100, 3)
            # 내 금액이 낙찰선보다 몇 %p 위였나 — «습관» 을 보는 잣대
            if sc["yeje"]:
                out["over_pp"] = round((amt - sc["limit"]) / sc["yeje"] * 100, 3)
                out["my_dq"] = amt < sc["limit"]
            # ── 이 금액은 «몇 분위» 에 건 것인가 ─────────────────────
            #  낙찰하한금액 식을 사정률(sj) 에 대해 거꾸로 풀면, 이 금액이 겨우
            #  살아남는 사정률 sj* 가 나옵니다. 실제 사정률이 sj* 보다 «낮게»
            #  나오면 하한선이 내려와 살고, 높게 나오면 죽습니다.
            #    한도금액 = (기초 × sj/100 − A) × 낙찰하한율/100 + A
            #    → sj* = 100 × [ (금액 − A) × 100/하한율 + A ] / 기초
            #  그래서 «살아남을 확률» = 사정률이 sj* 이하로 나올 확률 = Φ((sj*−p50)/σ).
            #  이것이 그대로 «분위» 입니다. 바로투찰은 A값을 알 때 75분위에 겁니다.
            #  ⚠️ bidmath 의 «75분위» 는 «사정률을 몇 분위로 가정하나» 이지
            #     «그 금액이 살아남을 확률» 이 아닙니다. A값을 아는 자리에서는
            #     여유(1.003)가 더 붙어 실제 생존 분위가 86 쯤으로 올라갑니다.
            #     그래서 바로투찰 금액도 «같은 잣대로 되짚어» 나란히 둡니다.
            #     숫자를 손으로 적어 두면 반드시 어디선가 어긋납니다 (CLAUDE.md 8-4).
            sd = B.sigma(row.get("lo") or -3, row.get("hi") or 3,
                         row.get("ptot") or 15, row.get("pdrw") or 4)
            if sd and base and llr:
                def _pct(v):
                    sj = ((v - a) * 100.0 / llr + a) * 100.0 / base
                    return round(statistics.NormalDist(p50, sd).cdf(sj) * 100.0, 1)
                out["my_pct"] = _pct(amt)
                out["baro_pct"] = _pct(sc["our"])
                if win_amt:
                    out["win_pct"] = _pct(win_amt)
            out["baro"] = {
                "amt": sc["our"], "dq": sc["dq"], "beat": sc["beat"],
                "rank_lo": br[0] if br else None,
                "rank_hi": br[1] if br else None,
            }
    return out


def load_live():
    p = os.path.join(STORE, "live.json")
    try:
        with io.open(p, encoding="utf-8") as f:
            return list(json.load(f).get("con", {}).values())
    except Exception:
        return []


def sido(inst):
    """«충청남도 서천군» → «충청남도». 기관 이름 앞머리가 곧 시·도입니다."""
    t = str(inst or "").split()
    return t[0] if t else ""


def next_five(recs, p50, n=5):
    """마감 전 공고에서 **이 업체가 넣을 만한 자리**를 골라 권장금액까지 붙입니다.

    이것이 리포트를 «지난 일 정리» 에서 «내일 할 일» 로 바꿉니다.
    화면에도 공고는 있지만, «이 회사에 맞는 다섯 건» 으로 좁혀 주지는 않습니다.
    """
    live = load_live()
    if not live or not recs:
        return []
    insts = collections.Counter(x["inst"] for x in recs if x.get("inst"))
    sidos = collections.Counter(sido(x["inst"]) for x in recs if x.get("inst"))
    bases = sorted(x["base"] for x in recs if x.get("base"))
    if not bases:
        return []
    lo_b, hi_b = bases[0] * 0.4, bases[-1] * 2.5
    # ⚠️ 조달청 시각은 한국시간입니다. GitHub·클라우드는 UTC 로 돕니다 —
    #    그냥 now() 를 쓰면 9시간 지난 공고가 «아직 마감 전» 으로 섞입니다(실측).
    KST = datetime.timezone(datetime.timedelta(hours=9))
    now = datetime.datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")
    out = []
    for r in live:
        base, llr = r.get("base") or 0, r.get("llr") or 0
        close = str(r.get("close") or "")
        if not base or not llr or close <= now:
            continue
        if not (lo_b <= base <= hi_b):
            continue
        inst = r.get("inst") or ""
        sc = 0
        if inst in insts:
            sc += 100 + insts[inst]
        elif sido(inst) in sidos:
            sc += 40 + sidos[sido(inst)]
        else:
            continue                      # 연고 없는 자리는 권하지 않습니다
        a = r.get("aval") or 0
        a_known = str(r.get("ayn") or "").upper() == "Y"
        ro = B.recommend(base, llr, a, a_known, p50,
                         r.get("lo") or -3, r.get("hi") or 3,
                         r.get("ptot") or 15, r.get("pdrw") or 4)
        if not ro:
            continue
        sh = B.shown(base, ro["amt"], p50)
        out.append({"no": r.get("no"), "name": r.get("name"), "inst": inst,
                    "close": close, "base": base, "est": r.get("est"),
                    "llr": llr, "a": a, "a_known": a_known,
                    "권장금액": sh["amt"], "권장투찰률": sh["rate"],
                    "url": r.get("url"), "점수": sc,
                    "같은기관": insts.get(inst, 0),
                    "같은지역": sidos.get(sido(inst), 0)})
    out.sort(key=lambda z: (-z["점수"], z["close"]))
    return out[:n]


def build(bno, rows, p50):
    recs = [x for x in (one(r, bno, p50) for r in rows) if x]
    recs.sort(key=lambda x: str(x["dt"] or ""), reverse=True)
    if not recs:
        return None
    name = collections.Counter(x["name_used"] for x in recs).most_common(1)[0][0]
    ranks = [x["rank"] for x in recs]
    wins = [x for x in recs if x["rank"] == 1]
    near = [x for x in recs if 2 <= x["rank"] <= 5]
    over = [x["over_pp"] for x in recs if x.get("over_pp") is not None]
    bb = [x for x in recs if x.get("baro")]
    baro_win = [x for x in bb if x["baro"]["beat"]]
    baro_dq = [x for x in bb if x["baro"]["dq"]]
    # 등수를 견줄 수 있는 것만 (실격·범위밖 제외)
    cmp_ = [x for x in bb if not x["baro"]["dq"] and x["baro"]["rank_lo"]]
    better = sum(1 for x in cmp_ if x["baro"]["rank_lo"] < x["rank"])
    worse = sum(1 for x in cmp_ if x["baro"]["rank_lo"] > x["rank"])
    inst = collections.Counter(x["inst"] for x in recs if x["inst"])

    # ── 놓친 자리 ──────────────────────────────────────────────
    #  «조금만 낮췄으면 1순위였던» 자리. 하한선 아래로 쓴 건(실격)은 뺍니다 —
    #  그건 «더 낮게» 가 아니라 «더 높게» 썼어야 하는 자리라 뜻이 반대입니다.
    miss = []
    for x in recs:
        if x["rank"] == 1 or x.get("my_dq") or not x.get("win_amt"):
            continue
        gap = x["amt"] - x["win_amt"]
        if gap <= 0:
            continue
        lim = x.get("limit") or 0
        miss.append({
            "dt": x["dt"], "name": x["name"], "inst": x["inst"], "rank": x["rank"],
            "n": x["n"], "amt": x["amt"], "win": x["win_amt"], "gap": gap,
            "gap_pp": (round(gap / x["yeje"] * 100, 3) if x.get("yeje") else None),
            # 하한선까지 남아 있던 여유 — 이만큼은 더 낮출 수 있었습니다
            "room": (x["amt"] - lim) if lim else None,
            "enough": bool(lim and x["win_amt"] > lim),
        })
    miss.sort(key=lambda z: z["gap"])

    # ── 금액대별 ───────────────────────────────────────────────
    def band_of(v):
        v = v or 0
        return "3억 미만" if v < 3e8 else ("3~10억" if v < 10e8 else "10억 이상")
    bd = collections.defaultdict(lambda: {"투찰": 0, "낙찰": 0, "등수합": 0})
    for x in recs:
        k = band_of(x.get("base") or x.get("amt"))
        bd[k]["투찰"] += 1
        bd[k]["등수합"] += x["rank"]
        if x["rank"] == 1:
            bd[k]["낙찰"] += 1
    band = [{"칸": k, "투찰": v["투찰"], "낙찰": v["낙찰"],
             "평균등수": round(v["등수합"] / v["투찰"], 1)}
            for k, v in sorted(bd.items(), key=lambda z: -z[1]["투찰"])]

    # ── 기관별 «낙찰선이 어디였나» ──────────────────────────────
    #  1순위 금액이 하한선보다 몇 %p 위였는지. 그 기관에서 «얼마에 갈렸는가» 입니다.
    ib = collections.defaultdict(list)
    for x in recs:
        if x.get("limit") and x.get("yeje") and x.get("win_amt"):
            ib[x["inst"]].append(round((x["win_amt"] - x["limit"]) / x["yeje"] * 100, 3))
    inst_band = []
    for k, v in sorted(ib.items(), key=lambda z: -len(z[1])):
        v = sorted(v)
        inst_band.append({"기관": k, "건": len(v), "최저": v[0], "중앙": v[len(v) // 2],
                          "최고": v[-1]})
    inst_band = inst_band[:8]

    # ── ① 실격 해부 ────────────────────────────────────────────
    #  화면은 «실격» 이라고만 씁니다. 여기서는 **왜** 인지를 짚습니다.
    #  하한선보다 얼마나 밑이었나 · 한쪽으로 쏠렸나 · A값이 있는 자리에서만 그런가.
    dq = [x for x in recs if x.get("my_dq")]
    dq_an = None
    if dq:
        short = [round((x["limit"] - x["amt"]) / x["yeje"] * 100, 3)
                 for x in dq if x.get("yeje")]
        a_dq = sum(1 for x in dq if x.get("a_known"))
        a_all = sum(1 for x in recs if x.get("a_known"))
        dq_an = {
            "건": len(dq), "전체": len(recs),
            "모자란pp중앙": statistics.median(short) if short else None,
            "모자란pp최대": max(short) if short else None,
            "A값있는자리": [a_dq, a_all],
            "기관쏠림": collections.Counter(x["inst"] for x in dq).most_common(3),
            "버린돈": sum(x["amt"] for x in dq),
            "목록": [{"dt": x["dt"], "name": x["name"], "inst": x["inst"],
                    "amt": x["amt"], "limit": x.get("limit"),
                    "short": (x["limit"] - x["amt"]) if x.get("limit") else None,
                    "short_pp": (round((x["limit"] - x["amt"]) / x["yeje"] * 100, 3)
                                 if x.get("yeje") else None),
                    "n": x["n"]} for x in dq][:8],
        }

    # ── ② 투찰 습관 역산 ───────────────────────────────────────
    #  «이 회사는 어떤 규칙으로 금액을 정하는가» 를 되짚습니다.
    #  화면은 개찰을 하나씩 보여 줄 뿐, 규칙이 무엇인지는 말해 주지 않습니다.
    hb2 = None
    ov = [x["over_pp"] for x in recs if x.get("over_pp") is not None]
    wg = [x["win_gap_pp"] for x in recs if x.get("win_gap_pp") is not None]
    if len(ov) >= 3:
        hb2 = {
            "잰개찰": len(ov),
            "내자리중앙": round(statistics.median(ov), 3),
            "내자리평균": round(statistics.mean(ov), 3),
            "흔들림": round(statistics.pstdev(ov), 3),
            "낙찰선중앙": round(statistics.median(wg), 3) if wg else None,
            "내투찰률중앙": (round(statistics.median(
                [x["my_rate"] for x in recs if x.get("my_rate")]), 3)
                if any(x.get("my_rate") for x in recs) else None),
            "최저": round(min(ov), 3), "최고": round(max(ov), 3),
        }
        if hb2["낙찰선중앙"] is not None:
            hb2["어긋남"] = round(hb2["내자리중앙"] - hb2["낙찰선중앙"], 3)

    # ── ③ 분위 버릇 ────────────────────────────────────────────
    #  이 회사가 «평소 몇 분위에 거는가». 그리고 그 자리가 실제로 무엇을 낳았나.
    #
    #  ⚠️ 여기서 «분위를 올리세요» 라고만 적으면 반쪽입니다. 3년치 실측(8,406건)은
    #     분위를 어떻게 잡아도 1순위율이 3.5~4.4% 에서 안 움직인다고 말합니다.
    #     움직이는 것은 실격률뿐입니다(14% → 84%).
    #     그래서 낮은 분위는 «더 딸 확률» 을 사는 것이 아니라 «실격» 만 사는 것입니다.
    #     이 문장이 이 칸의 핵심이고, PDF 에도 그렇게 적습니다.
    pcts = [x["my_pct"] for x in recs if x.get("my_pct") is not None]
    band_def = [("30분위 미만", 0, 30), ("30~50분위", 30, 50), ("50~70분위", 50, 70),
                ("70~85분위", 70, 85), ("85분위 이상", 85, 101)]
    qt = None
    if len(pcts) >= 3:
        haves = [x for x in recs if x.get("my_pct") is not None]
        rows_q = []
        for nm_, lo_, hi_ in band_def:
            g = [x for x in haves if lo_ <= x["my_pct"] < hi_]
            if not g:
                continue
            rows_q.append({
                "칸": nm_, "투찰": len(g),
                "실격": sum(1 for x in g if x.get("my_dq")),
                "낙찰": sum(1 for x in g if x["rank"] == 1),
                "평균등수": round(statistics.mean([x["rank"] for x in g]), 1),
            })
        dq_n = sum(1 for x in haves if x.get("my_dq"))
        qt = {
            "잰개찰": len(pcts),
            "중앙": round(statistics.median(pcts), 1),
            "평균": round(statistics.mean(pcts), 1),
            "흔들림": round(statistics.pstdev(pcts), 1) if len(pcts) > 1 else 0.0,
            "최저": round(min(pcts), 1), "최고": round(max(pcts), 1),
            # 모형이 말하는 실격률(100−중앙분위) 과 실제로 난 실격률을 나란히 둡니다.
            # 둘이 크게 어긋나면 그 자체가 읽을거리입니다 (운이 좋았거나 나빴다는 뜻).
            "모형실격률": round(100.0 - statistics.median(pcts), 1),
            "실제실격률": round(dq_n / len(haves) * 100.0, 1),
            "실격": dq_n,
            # 같은 잣대로 되짚은 바로투찰·낙찰자의 자리 (손으로 적은 숫자가 아닙니다)
            "바로투찰중앙": (round(statistics.median(
                [x["baro_pct"] for x in haves if x.get("baro_pct") is not None]), 1)
                if any(x.get("baro_pct") is not None for x in haves) else None),
            "낙찰자중앙": (round(statistics.median(
                [x["win_pct"] for x in haves if x.get("win_pct") is not None]), 1)
                if any(x.get("win_pct") is not None for x in haves) else None),
            "칸별": rows_q,
        }

    # ── ④ 다음에 넣을 자리 ─────────────────────────────────────
    nxt = next_five(recs, p50)

    return {
        "업체": {"이름": name, "사업자번호": bno},
        "요약": {
            "투찰": len(recs), "낙찰": len(wins),
            "낙찰률": round(len(wins) / len(recs) * 100, 1),
            "아깝게진자리": len(near),
            "기간": [recs[-1]["dt"], recs[0]["dt"]],
            "평균참가": round(statistics.mean([x["n"] for x in recs]), 1),
        },
        "등수": {
            "평균": round(statistics.mean(ranks), 1),
            "중앙": statistics.median(ranks),
            "분포": dict(sorted(collections.Counter(
                (1 if r == 1 else 5 if r <= 5 else 10 if r <= 10 else 30)
                for r in ranks).items())),
        },
        "습관요약": {
            "잰개찰": len(over),
            "낙찰선위평균pp": round(statistics.mean(over), 3) if over else None,
            "낙찰선위중앙pp": round(statistics.median(over), 3) if over else None,
            "실격": sum(1 for x in recs if x.get("my_dq")),
        },
        "바로투찰이었다면": {
            "잰개찰": len(bb), "1순위": len(baro_win), "실격": len(baro_dq),
            "등수중앙": (statistics.median([x["baro"]["rank_lo"] for x in cmp_])
                      if cmp_ else None),
            "내등수중앙": statistics.median([x["rank"] for x in cmp_]) if cmp_ else None,
            "내가나은건": worse, "바로투찰이나은건": better,
        },
        "기관": inst.most_common(8),
        "실격해부": dq_an,
        "습관": hb2 or None,
        "분위": qt,
        "다음자리": nxt,
        "놓친자리": miss[:5],
        "금액대": band,
        "기관낙찰선": inst_band,
        "기록": recs[:60],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bno", help="사업자등록번호 10자리")
    ap.add_argument("--pick", action="store_true", help="자료가 제일 많은 업체를 골라 줍니다")
    ap.add_argument("--out", help="쓸 파일 (없으면 화면으로)")
    a = ap.parse_args()

    rows = load_first()
    p50 = p50_now()
    if a.pick or not a.bno:
        c = collections.Counter()
        for r in rows:
            if not r.get("base") or not r.get("llr"):
                continue
            for x in (r.get("corps") or []):
                if len(x) > 3 and x[3]:
                    c[x[3]] += 1
        if not c:
            raise SystemExit("고를 업체가 없습니다")
        for bno, n in c.most_common(5):
            print("  후보 %s — %d건" % (bno, n), file=sys.stderr)
        a.bno = c.most_common(1)[0][0]
        print("→ 고른 업체: %s" % a.bno, file=sys.stderr)

    data = build(a.bno, rows, p50)
    if not data:
        raise SystemExit("그 업체의 투찰 기록이 없습니다: %s" % a.bno)
    data["기준"] = {"사정률중앙값": p50, "만든날": __import__("datetime")
                  .datetime.now().strftime("%Y-%m-%d %H:%M")}
    txt = json.dumps(data, ensure_ascii=False, indent=1)
    if a.out:
        io.open(a.out, "w", encoding="utf-8").write(txt)
        print("썼습니다: %s (%d자)" % (a.out, len(txt)), file=sys.stderr)
    else:
        print(txt)


if __name__ == "__main__":
    main()
