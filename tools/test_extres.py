# -*- coding: utf-8 -*-
"""💰 나라장터 밖 개찰(extres.py) 시험 — python tools/test_extres.py  (2026-09-30)
진짜 업체 이름 · 번호는 넣지 않습니다(○○). 명세의 칸 이름으로 만든 가짜 응답 · 가짜 get 만 씁니다."""
import json
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import extbids as E
import extres as R

ok = bad = 0


def 봄(이름, 참):
    global ok, bad
    if 참:
        ok += 1
    else:
        bad += 1
        print("✗", 이름)


NOW = datetime(2026, 9, 30, 21, 0, tzinfo=timezone(timedelta(hours=9)))

# ── LH 업체 줄 → 공고 한 줄 ──
rows = [
    {"bidNum": "2026100001", "bidDegree": "0", "openDtm": "202609291100", "bidnmKor": "○○지구 조경공사", "cstrtnJobGbNm": "공사",
     "fdmtlAmt": "500000000", "expectPrc": "499000000", "designPrc": "520000000", "prcscoreExclusAmt": "20000000",
     "invtgtRate": "87.801", "decTndrAmt": "441000000", "vndrSccfBidStatusNm": ""},
    {"bidNum": "2026100001", "bidDegree": "0", "openDtm": "202609291100", "fdmtlAmt": "500000000", "expectPrc": "499000000",
     "invtgtRate": "87.760", "decTndrAmt": "440800000", "vndrSccfBidStatusNm": ""},
    {"bidNum": "2026100001", "bidDegree": "0", "openDtm": "202609291100", "fdmtlAmt": "500000000", "expectPrc": "499000000",
     "invtgtRate": "87.700", "decTndrAmt": "440500000", "vndrSccfBidStatusNm": "낙찰하한율 미만"},
    {"bidNum": "2026100001", "bidDegree": "0", "openDtm": "202609291100", "fdmtlAmt": "500000000", "expectPrc": "499000000",
     "invtgtRate": "101.2", "decTndrAmt": "505000000", "vndrSccfBidStatusNm": "예가초과"},
]
f = R.lh_fold(rows)
b = f.get("2026100001-0") or {}
봄("LH 공고 한 줄로", len(f) == 1 and b["np"] == 4 and b["d"] == "2026-09-29" and b["kind"] == "공사")
봄("사정률 = 예정가격 ÷ 기초금액", abs(b["sj"] - 99.8) < 1e-9)
봄("1순위 = «미만 · 초과» 가 아닌 가장 낮은 투찰률", b["r1"] == 87.76 and b["a1"] == 440800000 and b["llH"] == 87.76)
봄("하한 아래쪽 = «미만» 가운데 가장 높은", b["llL"] == 87.7)
봄("A값(가격점수제외금액)", b["A"] == 20000000)

# ── 받기 (가짜 get) ──
calls = []


def fake(url, params, timeout):
    op = url.rsplit("/", 1)[-1]
    calls.append((op, dict(params)))
    if op == "getOpenTenderopenList":
        if params["openDtmStart"] == "20260929":
            return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": 4, "items": {"item": rows}}}})
        return json.dumps({"response": {"header": {"resultCode": "03", "resultMsg": "NODATA_ERROR"}, "body": {}}})
    if op == "getFcltyCmpetBidResultList":
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": 2, "items": {"item": [
            {"pblancNo": "UMM0901", "pblancOdr": "1", "cntrwkNo": "2026-1", "cntrwkNm": "○○ 막사 공사", "orntCode": "UMM",
             "opengDate": "20260925", "bidResult": "낙찰"},
            {"pblancNo": "UMM0902", "pblancOdr": "1", "cntrwkNo": "2026-2", "cntrwkNm": "○○ 창고 공사", "orntCode": "UMM",
             "opengDate": "20260926", "bidResult": "유찰"}]}}}})
    if op == "getFcltyCmpetBidResultDetail":
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"items": {"item": {
            "bsisPreparPc": "1000000000", "scsbidLwltRt": "87.745", "asessRtLwlt": "98", "asessRtUplmt": "102"}}}}})
    if op == "getFcltyCmpetBidResultBsicList":
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"items": {"item": [
            {"planPrce": "1001000000", "choiYsno": "Y"}, {"planPrce": "999000000", "choiYsno": "Y"},
            {"planPrce": "1010000000", "choiYsno": "N"}]}}}})
    if op == "getFcltyCmpetBidResultMnufList":
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"items": {"item": [
            {"bidnRank": "1", "bidnRate": "87.801", "tbidAmnt": "878010000"}, {"bidnRank": "2", "bidnRate": "87.9"}]}}}})
    return ""


with tempfile.TemporaryDirectory() as d:
    R.RES_STORE = os.path.join(d, "s", "res.json")
    R.RES_BOOK = os.path.join(d, "s", "book.json")
    dg = {}
    got = R.fetch("dummy", now=NOW, diag=dg, get=fake)
    st = json.load(open(R.RES_STORE, encoding="utf-8"))
    bk = json.load(open(R.RES_BOOK, encoding="utf-8"))
    lh_days = [p["openDtmStart"] for o, p in calls if o == "getOpenTenderopenList"]
    봄("LH: 오늘 · 어제 + 옛날 두 날", lh_days[:4] == ["20260930", "20260929", "20260928", "20260927"])
    봄("LH: 받은 공고", got["lhr"] == 1 and "2026100001-0" in st["lhr"])
    봄("LH: 옛날 날은 받았다고 적음 · 오늘 · 어제는 안 적음", "20260928" in bk["lhr"]["days"] and "20260930" not in bk["lhr"]["days"])
    봄("국방: 유찰은 건너뜀 · 낙찰은 자세히", got["dapar"] == 1 and "UMM:2026-1:1" in st["dapar"])
    v = st["dapar"]["UMM:2026-1:1"]
    봄("국방: 예정가격 = 고른 예비가격 평균 · 사정률 · 하한율 · 1순위", v["exp"] == 1000000000 and abs(v["sj"] - 100.0) < 1e-9
       and v["ll"] == 87.745 and v["r1"] == 87.801 and v["np"] == 2)
    봄("업체 이름 · 번호는 진단에 안 남김", "tndrVndrNm" not in json.dumps(dg) and "taxregno" not in json.dumps(dg))
    # 다시 돌리면 — 옛날 날은 다음 두 날 · 국방 목록은 하루 한 번
    calls.clear()
    R.fetch("dummy", now=NOW + timedelta(hours=1), diag={}, get=fake)
    lh_days = [p["openDtmStart"] for o, p in calls if o == "getOpenTenderopenList"]
    봄("LH: 다음 회차는 그다음 옛날 날", lh_days[2:4] == ["20260926", "20260925"])
    봄("국방: 목록은 하루 한 번", not any(o == "getFcltyCmpetBidResultList" for o, p in calls))
    # 키 오류 — 조용히 넘어감
    calls.clear()
    R.RES_STORE = os.path.join(d, "s2", "res.json"); R.RES_BOOK = os.path.join(d, "s2", "book.json")
    E_KEY = ("<OpenAPI_ServiceResponse><cmmMsgHeader><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>"
             "<returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>")
    dg2 = {}
    R.fetch("dummy", now=NOW, diag=dg2, get=lambda u, p, t: E_KEY if "BidResultInfoService" in u else fake(u, p, t))
    봄("국방 키 오류 — 목록 한 번만 · 다음 회차에 다시", sum(1 for o, p in calls if o == "getFcltyCmpetBidResultList") <= 1
       and dg2["_extres"]["dapar"]["err"]["code"] == "30")

# ── 셈에 쓸 값 ──
store = {"lhr": {}, "dapar": {}}
for i in range(30):
    store["lhr"][f"x{i}"] = {"kind": "공사", "base": 5e8, "sj": 99.5 + (i % 10) * 0.1, "llH": 87.76, "llL": 87.70, "np": 100 + i}
st = R.stats(store)
봄("LH 사정률 가운데 · 표준편차", st["lh"]["n"] == 30 and abs(st["lh"]["p50"] - 99.95) < 1e-9 and st["lh"]["sd"] > 0)
봄("LH 하한율(규모 칸 3~10억)", st["lh"]["ll"]["1"][0] == 87.73 and st["lh"]["ll"]["1"][1] == 30)
봄("국방 자료 없으면 셈 안 함", st["dapa"]["n"] == 0 and "p50" not in st["dapa"])
store["lhr"]["far"] = {"kind": "공사", "base": 5e8, "sj": 99.9, "llH": 88.5, "llL": 87.0}
봄("하한 위아래가 벌어진 건 하한율 셈에서 뺌", R.stats(store)["lh"]["ll"]["1"][1] == 30)

print(f"\n나라장터 밖 개찰 시험: {ok}가지 맞음" + (f" · {bad}가지 틀림" if bad else ""))
sys.exit(1 if bad else 0)
