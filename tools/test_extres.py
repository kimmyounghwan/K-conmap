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
     "invtgtRate": "87.801", "decTndrAmt": "441000000", "vndrSccfBidStatusNm": "", "tndrVndrNm": "○○건설", "taxregno": "0000000000"},
    {"bidNum": "2026100001", "bidDegree": "0", "openDtm": "202609291100", "fdmtlAmt": "500000000", "expectPrc": "499000000",
     "invtgtRate": "87.760", "decTndrAmt": "440800000", "vndrSccfBidStatusNm": "미심사", "tndrVndrNm": "△△종합건설",
     "taxregno": "1111111111"},
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
봄("🏆 LH 1순위 업체 = 가장 낮은 투찰률의 업체(미심사도 유효)", b.get("w") == "△△종합건설" and b.get("ord") == "0")
f2 = R.lh_fold([{"bidNum": "2026100002", "bidDegree": "1", "openDtm": "202609291400", "bidnmKor": "○○ 보수공사",
                 "cstrtnJobGbNm": "공사", "invtgtRate": "80.1", "vndrSccfBidStatusNm": "낙찰하한율 미만", "tndrVndrNm": "○○"}])
봄("🏆 LH 유효 투찰 없음", f2["2026100002-1"].get("st") == "유효 투찰 없음" and "w" not in f2["2026100002-1"])

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
            {"bidnRank": "1", "bidnRate": "87.801", "tbidAmnt": "878010000", "mfkrName": "○○토건", "bznsRgnb": "2222222222",
             "rptrKore": "홍○○"},
            {"bidnRank": "2", "bidnRate": "87.9", "mfkrName": "△△"}]}}}})
    if op == "getPrvtScsbidListSttus":
        its = [] if params["inqryBgnDt"][:8] != "20260929" else [
            {"bsnsDivNm": "공사", "bidNtceNo": "R26BK0001", "bidNtceOrd": "000", "rbidNo": "000", "bidNtceNm": "○○아파트 도장공사",
             "dminsttNm": "○○아파트", "rlOpengDt": "2026-09-29 11:00:00", "prtcptCnum": "7", "sucsfbidAmt": "123000000",
             "sucsfbidRate": "88.1", "bidwinnrNm": "○○도장", "bidwinnrCeoNm": "김○○", "bidwinnrAdrs": "○○시", "bidwinnrTelNo": "000"},
            {"bsnsDivNm": "용역", "bidNtceNo": "R26BK0002", "bidNtceOrd": "000", "bidNtceNm": "○○ 청소용역",
             "rlOpengDt": "2026-09-29 11:00:00", "bidwinnrNm": "○○"}]
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": len(its), "items": its}}})
    if op == "getPrvtOpengResultListInfo":
        its = [] if params["inqryBgnDt"][:8] != "20260929" else [
            {"bidNtceNo": "R26BK0001", "bidNtceOrd": "000", "opengDt": "2026-09-29 11:00:00", "prtcptCnum": "7",
             "progrsDivCdNm": "개찰완료", "opengCorpInfo": "□□^3333333333^이○○^120000000^87.5"},
            {"bidNtceNo": "R26BK0003", "bidNtceOrd": "000", "bidNtceNm": "○○ 방수공사", "opengDt": "2026-09-29 15:00:00",
             "prtcptCnum": "3", "progrsDivCdNm": "유찰", "opengCorpInfo": ""},
            {"bidNtceNo": "R26BK0009", "bidNtceOrd": "000", "bidNtceNm": "○○ 물품", "opengDt": "2026-09-29 15:00:00",
             "progrsDivCdNm": "개찰완료", "opengCorpInfo": "○○^4444444444^박○○^1000^90"}]
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": len(its), "items": its}}})
    if op == "rstList":
        its = [] if params["searchDt"] != "202609" else [
            {"tndrPbanno": "2026-0101", "tndrPblancNm": "○○정수장 보수공사", "cntrctDivNm": "공사", "cardPrcsDt": "20260928",
             "cntrctPrgstsNm": "낙찰", "ctrmthdNm": "제한경쟁", "sucbidrDcsnMthNm": "적격심사", "scsbidAmt": "345000000",
             "entrpsNm": "○○이앤씨", "intnChargerNm": "최○○", "dept": "○○권역본부"},
            {"tndrPbanno": "2026-0102", "tndrPblancNm": "○○ 약품 구매", "cntrctDivNm": "물품", "cardPrcsDt": "20260928"},
            {"tndrPbanno": "2026-0103", "tndrPblancNm": "○○ 공사(공고중)", "cntrctDivNm": "공사", "cardPrcsDt": ""}]
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": len(its), "items": {"item": its}}}})
    if op == "getBidClosDeSearchV3":
        its = [] if params["startDate"] != "20260929" else [
            {"bidNum": "K1", "bidTitle": "○○아파트 옥상 방수공사", "bidKaptname": "○○아파트", "bidArea": "41",
             "codeClassifyType1": "02", "codeClassifyType2": "02", "bidDeadline": "2026-09-29 17:00:00",
             "bidReason": "○○방수 낙찰", "codeSucWay": "03"},
            {"bidNum": "K2", "bidTitle": "○○아파트 도장공사", "bidKaptname": "○○아파트", "bidArea": "11",
             "codeClassifyType1": "02", "codeClassifyType2": "02", "bidDeadline": "2026-09-29 17:00:00",
             "bidReason": "참여업체 부족으로 유찰"},
            {"bidNum": "K3", "bidTitle": "○○아파트 경비용역", "codeClassifyType1": "02", "codeClassifyType2": "03",
             "bidDeadline": "2026-09-29 17:00:00", "bidReason": "○○ 낙찰"},
            {"bidNum": "K4", "bidTitle": "○○아파트 승강기 교체공사", "codeClassifyType1": "02", "codeClassifyType2": "02",
             "bidDeadline": "2026-09-29 17:00:00", "bidReason": ""}]
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": len(its), "items": its}}})
    return ""


with tempfile.TemporaryDirectory() as d:
    R.RES_STORE = os.path.join(d, "s", "res.json")
    R.RES_BOOK = os.path.join(d, "s", "book.json")
    E.EXT_STORE = os.path.join(d, "s", "ext.json")
    E.PUB_DIR = os.path.join(d, "pub")
    # 공고 보관함 — 누리장터 «공사» 공고(개찰결과는 이 번호만 씀) · LH 공고(본부 · 지역)
    E._save(E.EXT_STORE, {
        "nuri": {"nuri:R26BK0003-000": {"s": "nuri", "id": "nuri:R26BK0003-000", "no": "R26BK0003", "ord": "000",
                                        "nm": "○○ 방수공사", "org": "○○아파트", "sido": "경기"}},
        "lh": {"lh:2026100001-0": {"s": "lh", "id": "lh:2026100001-0", "no": "2026100001", "ord": "0",
                                   "nm": "○○지구 조경공사", "org": "LH 경기남부", "rgn": "경기도"}},
        "kw": {"kw:2026-0101": {"s": "kw", "id": "kw:2026-0101", "no": "2026-0101", "nm": "○○정수장 보수공사",
                                "org": "수자원 ○○", "sido": "충북"}}})
    dg = {}
    got = R.fetch("dummy", now=NOW, diag=dg, get=fake)
    st = json.load(open(R.RES_STORE, encoding="utf-8"))
    bk = json.load(open(R.RES_BOOK, encoding="utf-8"))
    lh_days = [p["openDtmStart"] for o, p in calls if o == "getOpenTenderopenList"]
    봄("LH: 오늘 · 어제 + 옛날 세 날", lh_days[:5] == ["20260930", "20260929", "20260928", "20260927", "20260926"])
    봄("LH: 받은 공고", got["lhr"] == 1 and "2026100001-0" in st["lhr"])
    봄("LH: 옛날 날은 받았다고 적음 · 오늘 · 어제는 안 적음", "20260928" in bk["lhr"]["days"] and "20260930" not in bk["lhr"]["days"])
    봄("국방: 유찰은 목록만으로 한 줄 · 낙찰은 자세히", got["dapar"] == 2 and "UMM:2026-1:1" in st["dapar"]
       and st["dapar"]["UMM:2026-2:1"].get("st") == "유찰" and "base" not in st["dapar"]["UMM:2026-2:1"])
    봄("국방: 유찰은 자세히 부르지 않음", sum(1 for o, p in calls if o == "getFcltyCmpetBidResultDetail") == 1)
    v = st["dapar"]["UMM:2026-1:1"]
    봄("국방: 예정가격 = 고른 예비가격 평균 · 사정률 · 하한율 · 1순위", v["exp"] == 1000000000 and abs(v["sj"] - 100.0) < 1e-9
       and v["ll"] == 87.745 and v["r1"] == 87.801 and v["np"] == 2)
    봄("🏆 국방 1순위 업체(낙찰업체명 없으면 참가 1순위) · 상태", v.get("w") == "○○토건" and v.get("st") == "낙찰")
    봄("업체 이름 · 번호는 진단에 안 남김", all(x not in json.dumps(dg, ensure_ascii=False) for x in
       ("○○건설", "△△종합건설", "○○토건", "○○도장", "○○이앤씨", "□□", "0000000000", "1111111111", "3333333333",
        "김○○", "최○○", "○○방수")))
    # 🏆 민간
    nb = st["nurir"]
    봄("🏆 민간: 낙찰 목록은 공사만", "R26BK0001-000" in nb and "R26BK0002-000" not in nb)
    봄("🏆 민간: 낙찰 값(최종) — 개찰결과가 덮지 않음", nb["R26BK0001-000"]["w"] == "○○도장" and nb["R26BK0001-000"]["a1"] == 123000000
       and nb["R26BK0001-000"]["st"] == "낙찰" and nb["R26BK0001-000"]["np"] == 7)
    봄("🏆 민간: 개찰결과는 받아 둔 공사 공고만(유찰)", nb.get("R26BK0003-000", {}).get("st") == "유찰"
       and "R26BK0009-000" not in nb)
    봄("🏆 민간: 대표자 · 주소 · 전화 · 사업자번호는 안 둠", all(x not in json.dumps(st, ensure_ascii=False)
       for x in ("김○○", "이○○", "3333333333", "bidwinnrAdrs", "○○시")))
    # 🏆 수자원
    kb = st["kwr"]
    봄("🏆 수자원: 공사 · 개찰일 있는 것만", list(kb) == ["kw:2026-0101"])
    봄("🏆 수자원: 낙찰자 · 금액 · 상태 · 담당자 이름은 안 둠", kb["kw:2026-0101"]["w"] == "○○이앤씨"
       and kb["kw:2026-0101"]["a1"] == 345000000 and kb["kw:2026-0101"]["d"] == "2026-09-28" and "최○○" not in json.dumps(kb, ensure_ascii=False))
    봄("🏆 수자원: 이번 달 · (처음이면) 지난달", [p["searchDt"] for o, p in calls if o == "rstList"] == ["202609", "202608"])
    # 🏆 아파트
    ab = st["kaptr"]
    봄("🏆 아파트: 공사 · 사유 있는 것만", sorted(ab) == ["kapt:K1", "kapt:K2"])
    봄("🏆 아파트: 사유 → 낙찰 · 유찰", ab["kapt:K1"]["st"] == "낙찰" and ab["kapt:K2"]["st"] == "유찰"
       and ab["kapt:K1"]["sido"] == "경기" and ab["kapt:K1"]["d"] == "2026-09-29")
    kd = [p["startDate"] for o, p in calls if o == "getBidClosDeSearchV3"]
    봄("🏆 아파트: 어제 마감은 늘 + 돌아가며 둘", kd == ["20260929", "20260928", "20260927"])
    봄("🏆 아파트: 사유 글은 진단에 안 남기고 낱말 수만", dg["_extres"]["kaptr"]["words"] == {"낙찰": 2, "유찰": 1}
       and "○○방수" not in json.dumps(dg, ensure_ascii=False))
    # 🏆 1순위 파일
    by = R.publish_first(now=NOW, sido_fn=lambda x: "경기" if "경기" in (x.get("site", "") + x.get("inst", "")) else "")
    fj = json.load(open(os.path.join(E.PUB_DIR, "first.json"), encoding="utf-8"))
    ids = {r["id"]: r for r in fj["rows"]}
    봄("🏆 1순위 파일: 다섯 곳", by == {"lh": 1, "kw": 1, "dapa": 2, "kapt": 2, "nuri": 2})
    lh1 = ids.get("lh:2026100001-0") or {}
    봄("🏆 1순위 파일: LH 는 공고에서 본부 · 지역", lh1.get("org") == "LH 경기남부" and lh1.get("sido") == "경기"
       and lh1.get("w") == "△△종합건설" and lh1.get("a") == 440800000 and lh1.get("r") == 87.76)
    봄("🏆 1순위 파일: id 모양", "kw:2026-0101" in ids and "kapt:K1" in ids and "nuri:R26BK0001-000" in ids
       and "dapa:UMM:2026-1:1" in ids)
    봄("🏆 1순위 파일: 새 개찰이 위", fj["rows"][0]["d"] >= fj["rows"][-1]["d"])
    봄("🏆 1순위 파일: 민간 유찰 줄은 공고의 지역", ids["nuri:R26BK0003-000"].get("sido") == "경기")
    봄("🏆 1순위 파일: 셈 재료 안 샘(_ok · llH)", "llH" not in json.dumps(fj) and "_ok" not in json.dumps(fj))
    mj = json.load(open(os.path.join(E.PUB_DIR, "meta.json"), encoding="utf-8"))
    봄("🏆 meta.json 에 1순위 건수", mj.get("first") == 8)
    # 30일보다 옛 개찰은 안 내보냄
    st2 = {"kwr": {"kw:old": {"no": "old", "d": "2026-08-01", "nm": "○○ 공사", "kind": "공사"}}}
    봄("🏆 1순위 파일: 30일 안만", R.publish_first(now=NOW, store=st2, ext={}) == {"lh": 0, "kw": 0, "dapa": 0, "kapt": 0, "nuri": 0})
    # 다시 돌리면 — 옛날 날은 다음 두 날 · 국방 목록은 하루 한 번
    calls.clear()
    R.fetch("dummy", now=NOW + timedelta(hours=1), diag={}, get=fake)
    lh_days = [p["openDtmStart"] for o, p in calls if o == "getOpenTenderopenList"]
    봄("LH: 다음 회차는 그다음 옛날 날", lh_days[2:5] == ["20260925", "20260924", "20260923"])
    kd = [p["startDate"] for o, p in calls if o == "getBidClosDeSearchV3"]
    봄("🏆 아파트: 다음 회차는 다음 두 날", kd == ["20260929", "20260926", "20260925"])
    봄("🏆 수자원: 두 시간 안에는 다시 안 부름", not any(o == "rstList" for o, p in calls))
    calls.clear()
    R.fetch("dummy", now=NOW + timedelta(hours=2), diag={}, get=fake)
    봄("🏆 수자원: 두 시간 지나면 이번 달만(처음이 아니고 달 초도 아님)", [p["searchDt"] for o, p in calls if o == "rstList"] == ["202609"])
    봄("🏆 민간: 다음 회차는 옛날 날이 넘어감", "20260928" not in [p["inqryBgnDt"][:8] for o, p in calls if o == "getPrvtScsbidListSttus"])
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

# ── 🏆 G84 때 받은 날은(업체 이름 없이) 최근 35일만 다시 받음 ──
with tempfile.TemporaryDirectory() as d:
    R.RES_STORE = os.path.join(d, "res.json")
    R.RES_BOOK = os.path.join(d, "book.json")
    E.EXT_STORE = os.path.join(d, "ext.json")
    E._save(R.RES_BOOK, {"lhr": {"days": ["20260501", "20260920", "20260928"]}})
    calls.clear()
    R.fetch("dummy", now=NOW, diag={}, get=fake)
    bk = json.load(open(R.RES_BOOK, encoding="utf-8"))
    봄("🏆 LH: 옛 판(업체 이름 없음)의 최근 날은 다시", "20260920" not in bk["lhr"]["days"][:1] and "20260501" in bk["lhr"]["days"]
       and bk["lhr"]["wv"] == 1 and [p["openDtmStart"] for o, p in calls if o == "getOpenTenderopenList"][2] == "20260928")

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
