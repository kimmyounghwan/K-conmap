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
            # 내 금액이 낙찰선보다 몇 %p 위였나 — «습관» 을 보는 잣대
            if sc["yeje"]:
                out["over_pp"] = round((amt - sc["limit"]) / sc["yeje"] * 100, 3)
                out["my_dq"] = amt < sc["limit"]
            out["baro"] = {
                "amt": sc["our"], "dq": sc["dq"], "beat": sc["beat"],
                "rank_lo": br[0] if br else None,
                "rank_hi": br[1] if br else None,
            }
    return out


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
    rivals = collections.Counter()
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
        "습관": {
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
        "기록": recs[:40],
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
