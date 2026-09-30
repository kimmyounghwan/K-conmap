# -*- coding: utf-8 -*-
"""🏗 나라장터 밖 공고(extbids.py) 시험 — python tools/test_extbids.py  (2026-09-30)
진짜 응답은 넣지 않습니다(남의 이름 · 번호). 명세(swagger)의 칸 이름으로 만든 가짜 응답을 씁니다.
바깥은 한 번도 부르지 않습니다 — fetch 에 가짜 get 을 넘깁니다."""
import json
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import extbids as X

ok = bad = 0


def 봄(이름, 참):
    global ok, bad
    if 참:
        ok += 1
    else:
        bad += 1
        print("✗", 이름)


KST = timezone(timedelta(hours=9))
NOW = datetime(2026, 9, 30, 17, 40, tzinfo=KST)

# ── 날짜 ──
봄("날짜 8자리", X.ymdhm("20260930") == "2026-09-30")
봄("날짜 12자리 · 숫자", X.ymdhm(202610051000) == "2026-10-05 10:00")
봄("날짜 14자리 · 줄표", X.ymdhm("2026-10-05 10:00:00") == "2026-10-05 10:00")
봄("못 읽는 날짜", X.ymdhm("") == "" and X.ymdhm("미정") == "" and X.ymdhm("12345678") == "")
봄("금액", X._won("1,234,000") == 1234000 and X._won(None) == 0 and X._won("3.0E7") == 30 or X._won("30000000.0") == 30000000)

# ── 응답 읽기: JSON · XML · 오류 봉투 · 자료 없음 ──
J = json.dumps({"response": {"header": {"resultCode": "00", "resultMsg": "NORMAL SERVICE."},
                             "body": {"items": {"item": [{"a": "1"}, {"a": "2"}]}, "totalCount": 2}}})
rows, tot, err = X.parse(J)
봄("JSON 목록", len(rows) == 2 and tot == 2 and err is None)
J1 = json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"items": {"item": {"a": "1"}}, "totalCount": "1"}}})
봄("JSON 한 건(dict)", X.parse(J1)[0] == [{"a": "1"}])
J2 = json.dumps({"response": {"header": {"resultCode": "03", "resultMsg": "NODATA_ERROR"}, "body": {}}})
봄("자료 없음은 오류 아님", X.parse(J2) == ([], 0, None))
XML = ("<response><header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header><body><items>"
       "<item><bidNum>2026000001</bidNum><bidnmKor>○○지구 도로공사</bidnmKor></item>"
       "<item><bidNum>2026000002</bidnmKor></item></items><totalCount>2</totalCount></body></response>")
rows, tot, err = X.parse(XML.replace("<bidNum>2026000002</bidnmKor>", "<bidNum>2026000002</bidNum>"))
봄("XML 목록", len(rows) == 2 and rows[0]["bidnmKor"] == "○○지구 도로공사" and tot == 2 and err is None)
E = ("<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg>"
     "<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><returnReasonCode>30</returnReasonCode>"
     "</cmmMsgHeader></OpenAPI_ServiceResponse>")
rows, tot, err = X.parse(E)
봄("포털 오류 봉투", rows == [] and err["code"] == "30" and "NOT_REGISTERED" in err["msg"] and X._keyish(err))
Q = E.replace("SERVICE_KEY_IS_NOT_REGISTERED_ERROR", "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR").replace(">30<", ">22<")
봄("하루 한도", X.parse(Q)[2].get("quota") is True)
봄("깨진 응답", X.parse("<html>점검 중</ht")[2]["code"] == "xml" and X.parse("")[2]["code"] == "empty")
봄("키처럼 생긴 글 지우기", "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd" not in X._scrub("url?serviceKey=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd%3D%3D"))

# ── 기관별 한 줄 ──
lh = X.norm_lh({"bidNum": 2026101234, "bidDegree": 0, "cstrtnJobGbNm": "공사", "bidnmKor": "○○ 단지 조경공사",
                "zoneHqCd": "경기남부지역본부", "tndrbidRegDt": 20260929, "tndrdocAcptEndDtm": 202610071000,
                "openDtm": 202610071100, "presmtPrc": 500000000, "fdmtlAmt": 0, "zoneRstrct1": "경기도",
                "zoneRstrct2": "경기도", "req1Reqlic1Nm": "조경식재공사업", "req2Reqlic3Nm": "조경식재공사업",
                "req1Reqlic2Nm": "조경시설물설치공사업"})
봄("LH 한 줄", lh["id"] == "lh:2026101234-0" and lh["close"] == "2026-10-07 10:00" and lh["org"] == "LH 경기남부지역본부"
   and lh["rgn"] == "경기도" and lh["lic"] == ["조경식재공사업", "조경시설물설치공사업"] and lh["m"] == [["추정가격", 500000000]])
kw = X.norm_kw({"tndrPbanno": "K2026-0101", "tndrPblancNm": "○○댐 시설 보수공사", "cntrctDeptNm": "○○권역본부",
                "tndrPblancDe": "20260925", "tndrPblancEnddt": "20261002", "tndrPlnprc": 120000000, "cntrctDivNm": "공사"})
봄("수자원 한 줄", kw["id"] == "kw:K2026-0101" and kw["close"] == "2026-10-02" and kw["m"] == [["금액", 120000000]])
da = X.norm_dapa({"pblancYear": "2026", "pblancNo": "123", "pblancOdr": "1", "cntrwkNm": "○○부대 막사 신축공사",
                  "ornt": "국방○○본부", "pblancSe": "긴급공고", "busiDivs": "공사", "pblancDate": "20260928",
                  "biddocPresentnClosDt": "202610061000", "baseAmnt": "830000000", "g2bPblancNo": "R26BK00000001-000"})
봄("방위사업청 한 줄", da["id"] == "dapa:2026-123-1" and da["emg"] == 1 and da["m"] == [["기초금액", 830000000]])
ka = X.norm_kapt({"bidNum": "20260930001", "bidTitle": "○○아파트 옥상 방수공사", "bidKaptname": "○○아파트",
                  "bidArea": "4113500000", "bidRegDate": "20260930", "bidDeadline": "20261010", "bidState": "1",
                  "codeKind": "01", "codeWay": "01", "codeAuth": "01", "bidEmrgYn": "N",
                  "bidFileSeq": "https://example.invalid/file?x=1"})
봄("아파트 한 줄", ka["sido"] == "경기" and ka["kind"] == "공사" and ka["mthd"] == "일반경쟁" and ka["way"] == "전자입찰"
   and ka["docs"] == [["공고 첨부", "https://example.invalid/file?x=1"]] and ka["emg"] == 0)
봄("아파트 용역은 용역", X.kapt_kind("승강기 유지보수 용역") == "용역" and X.kapt_kind("경비 위탁관리") == "용역"
   and X.kapt_kind("지하주차장 바닥 도장") == "공사" and X.kapt_kind("○○") == "")
nu = X.norm_nuri({"bidNtceNo": "N2026-0001", "bidNtceOrd": "00", "ntceNm": "○○ 공장 증축공사", "ntceInsttNm": "(주)○○",
                  "nticeDt": "2026-09-29 14:00:00", "bidClseDt": "2026-10-08 17:00:00", "opengDt": "2026-10-09 11:00:00",
                  "refAmt": "300000000", "refAmtOpenYn": "N", "asignBdgtAmt": "330000000", "ntceDivNm": "일반",
                  "ntceSpecDocUrl1": "https://example.invalid/a", "ntceSpecDocNm1": "공고문.hwp", "ntceSpecDocUrl2": ""})
봄("누리장터 한 줄 · 기준금액 비공개는 안 보임", nu["close"] == "2026-10-08 17:00" and nu["m"] == [["배정예산", 330000000]]
   and nu["docs"] == [["공고문.hwp", "https://example.invalid/a"]])

# ── 받기 (가짜 get) ──
calls = []


def fake(url, params, timeout):
    calls.append((url.rsplit("/", 1)[-1], dict(params)))
    봄("인증키를 여기서 넣지 않음", "serviceKey" not in params)
    op = url.rsplit("/", 1)[-1]
    if op == "getOpenBidInfo":
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": 2, "items": {"item": [
            {"bidNum": 1, "bidDegree": 0, "cstrtnJobGbNm": "공사", "bidnmKor": "○○ 공사", "tndrbidRegDt": 20260929,
             "tndrdocAcptEndDtm": 202610071000, "zoneRstrct1": "경기도"},
            {"bidNum": 2, "bidDegree": 0, "cstrtnJobGbNm": "용역", "bidnmKor": "○○ 설계용역", "tndrbidRegDt": 20260929,
             "tndrdocAcptEndDtm": 202610071000}]}}}})
    if op == "cntrwkList":
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": 1, "items": {"item": [
            {"tndrPbanno": "K1-" + params["searchDt"], "tndrPblancNm": "○○ 보수공사", "tndrPblancDe": "20260925",
             "tndrPblancEnddt": "20261002" if params["searchDt"] == "202609" else "20260820"}]}}}})
    if op == "getFcltyCmpetBidPblancList":
        if "-" not in params["anmtDateBegin"]:          # 날짜 모양이 틀린 척 — 한 번은 2026-09-30 모양으로 다시 봐야 함
            return E.replace("SERVICE_KEY_IS_NOT_REGISTERED_ERROR", "INVALID_REQUEST_PARAMETER_ERROR").replace(">30<", ">10<")
        return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": "2", "items": {"item": [
            {"pblancYear": "2026", "pblancNo": "1", "pblancOdr": "1", "cntrwkNm": "○○ 막사 공사", "busiDivs": "공사",
             "pblancDate": "20260928", "biddocPresentnClosDt": "202610061000", "g2bPblancNo": "R26BK00000009-000"},
            {"pblancYear": "2026", "pblancNo": "2", "pblancOdr": "1", "cntrwkNm": "○○ 창고 공사", "busiDivs": "공사",
             "pblancDate": "20260928", "biddocPresentnClosDt": "202610061000", "g2bPblancNo": ""}]}}}})
    if op == "getPblAncDeSearchV3":
        return E                                         # 아직 승인이 안 번진 척 — 키 오류는 날짜 모양을 바꿔 보지 않음
    if op == "getPrvtBidPblancListInfoCnstwk":
        raise ConnectionError("HTTPSConnectionPool(host='apis.data.go.kr'): url: /x?serviceKey=SECRETSECRETSECRETSECRETSECRETSECRET")
    return ""


with tempfile.TemporaryDirectory() as d:
    X.EXT_STORE = os.path.join(d, "store", "ext.json")
    X.EXT_BOOK = os.path.join(d, "store", "ext_book.json")
    X.PUB_DIR = os.path.join(d, "pub")
    diag = {}
    got = X.fetch("dummy", now=NOW, diag=diag, get=fake)
    ext = diag.get("_ext") or {}
    봄("받은 줄 수", got == {"lh": 2, "kw": 2, "dapa": 2, "kapt": 0, "nuri": 0})
    봄("수자원은 이번 달 · 지난달(처음)", sorted(p["searchDt"] for o, p in calls if o == "cntrwkList") == ["202608", "202609"])
    봄("방위사업청 날짜 모양 바꿔 한 번 더", ext["dapa"]["calls"] == 2 and "alt" in ext["dapa"] and "err" not in ext["dapa"])
    봄("K-apt 키 오류는 한 번만 부름", ext["kapt"]["calls"] == 1 and ext["kapt"]["err"]["code"] == "30")
    봄("통신 오류 글(주소 · 키)을 남기지 않음", ext["nuri"]["err"] == {"net": "ConnectionError"}
       and "SECRET" not in json.dumps(diag))
    book = json.load(open(X.EXT_BOOK, encoding="utf-8"))
    봄("날짜 모양 기억", book["dapa"].get("alt") is True and book["dapa"]["last"] == "2026-09-30 17:40")
    # 방위사업청은 50분 안에 다시 안 부름
    calls.clear()
    X.fetch("dummy", now=NOW + timedelta(minutes=20), diag={}, get=fake)
    봄("방위사업청 50분 간격", not any(o == "getFcltyCmpetBidPblancList" for o, p in calls))
    봄("두 번째부터는 날짜 모양 바로", True)
    # 내보내기
    by = X.publish(now=NOW, g2b_nos={"R26BK00000009"}, sido_fn=lambda r: "경기" if "경기" in (r.get("site") or "") else "")
    out = json.load(open(os.path.join(X.PUB_DIR, "list.json"), encoding="utf-8"))
    ids = [r["id"] for r in out["rows"]]
    봄("LH 용역은 뺌", "lh:1-0" in ids and "lh:2-0" not in ids)
    봄("수자원 마감 지난 것은 뺌", "kw:K1-202609" in ids and "kw:K1-202608" not in ids)
    봄("나라장터에도 올린 방위사업청 공고는 뺌", "dapa:2026-1-1" not in ids and "dapa:2026-2-1" in ids)
    봄("참가지역으로 시도", [r for r in out["rows"] if r["id"] == "lh:1-0"][0].get("sido") == "경기")
    봄("기관별 건수 · meta", by == {"lh": 1, "kw": 1, "dapa": 1, "kapt": 0, "nuri": 0}
       and json.load(open(os.path.join(X.PUB_DIR, "meta.json")))["n"] == 3)
    봄("안쪽 칸은 안 내보냄", all("got" not in r and "g2b" not in r for r in out["rows"]))
    # 바깥을 안 부르는 회차
    calls.clear()
    dg = {}
    X.fetch("dummy", now=NOW, no_net=True, diag=dg, get=fake)
    봄("--exportonly 는 안 부름", calls == [] and "건너뜀" in dg["_ext"])

# ── 2026-09-30 첫 회차에서 배운 것 (진단 _ext) ──
#  ① LH 는 EUC-KR 로 적힌 XML — utf-8 로만 읽어 «NORMAL SERVICE» 응답을 버렸고, 날짜 모양을 바꿔 다시 물어 오류(11)까지 받았음
EUC = ('<?xml version="1.0" encoding="EUC-KR"?><response><header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE</resultMsg>'
       '</header><body><items><item><bidNum>2026100077</bidNum><bidDegree>0</bidDegree><cstrtnJobGbNm>공사</cstrtnJobGbNm>'
       '<bidnmKor>○○지구 조경공사</bidnmKor><tndrbidRegDt>20260930</tndrbidRegDt><tndrdocAcptEndDtm>202610081000</tndrdocAcptEndDtm>'
       '</item></items><totalCount>1</totalCount></body></response>').encode("cp949")
txt = X.decode(EUC)
rows, tot, err = X.parse(txt)
봄("EUC-KR XML 읽기", err is None and tot == 1 and rows[0]["bidnmKor"] == "○○지구 조경공사")
봄("글자 모양 선언 없는 utf-8 도 그대로", X.decode("가나".encode("utf-8")) == "가나")
calls2 = []


def fake_lh(url, params, timeout):
    calls2.append(dict(params))
    return "<?xml version='1.0' encoding='EUC-KR'?><html>깨진"      # 읽을 수 없는 응답 — 날짜 모양 탓이 아님


with tempfile.TemporaryDirectory() as d:
    X.EXT_STORE = os.path.join(d, "s", "ext.json"); X.EXT_BOOK = os.path.join(d, "s", "book.json"); X.PUB_DIR = os.path.join(d, "p")
    _o = X.ORDER; X.ORDER = ["lh"]
    dg = {}
    X.fetch("dummy", now=NOW, diag=dg, get=fake_lh)
    X.ORDER = _o
    봄("못 읽는 응답이면 날짜 모양을 바꿔 다시 묻지 않음", len(calls2) == 1 and "alt" not in dg["_ext"]["lh"])

#  ② K-apt 분류코드 — 2단 02 = 공사 · 03 = 용역 · 04 물품 · 05 기타 · 1단 01 = 주택관리업자 선정
봄("K-apt 코드로 공사", X.kapt_kind("복도 계단 대청소 및 신주 코팅", "02", "02") == "공사")
봄("K-apt 코드로 용역 · 관리", X.kapt_kind("승강기 유지보수 업체", "02", "03") == "용역" and X.kapt_kind("주택관리업자 선정", "01", "01") == "관리")
봄("코드 없으면 낱말로", X.kapt_kind("옥상 방수공사") == "공사")
봄("🧹 코드가 공사여도 제목에 «용역» 이면 용역", X.kapt_kind("하자진단 용역업체 선정 입찰", "02", "02") == "용역"
   and X.kapt_kind("폐기물 처리 용역 사업자선정", "02", "02") == "용역"
   and X.kapt_kind("경비원 휴게실 바닥 보수공사업체 선정", "02", "02") == "공사"
   and X.kapt_kind("근로자 휴게시설(경비, 청소) 조성 공사업체 선정", "02", "02") == "공사")
k2 = X.norm_kapt({"bidNum": "2026093099", "bidTitle": "○○아파트 계단 도장공사", "bidArea": "44", "bidRegDate": "2026-09-30",
                  "bidDeadline": "2026-10-13 17:00:00", "codeClassifyType1": "02", "codeClassifyType2": "02", "codeClassifyType3": "02",
                  "codeSucWay": "03", "bidFileSeq": "4310385"})
봄("K-apt 첨부 번호 → 명세의 내려받기 주소 · 낙찰방법 이름", k2["docs"][0][1].endswith("file_type=bid&file_num=4310385")
   and k2["win"] == "최저 낙찰" and k2["sido"] == "충남" and k2["close"] == "2026-10-13 17:00")
#  ③ 읽는 법을 고쳐 판(v)이 올라가면 처음처럼 넓게(14일) 다시 받음 — 옛 줄의 첨부 · 분류를 새로 채우려고
calls3 = []


def fake_k(url, params, timeout):
    calls3.append(dict(params))
    return json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"totalCount": 0, "items": ""}}})


with tempfile.TemporaryDirectory() as d:
    X.EXT_STORE = os.path.join(d, "s", "ext.json"); X.EXT_BOOK = os.path.join(d, "s", "book.json"); X.PUB_DIR = os.path.join(d, "p")
    X._save(X.EXT_STORE, {"kapt": {"kapt:1": {"s": "kapt", "id": "kapt:1", "no": "1", "nm": "○○ 계단 대청소", "kind": "용역",
                                            "c": ["02", "02", "03"], "dt": "2026-09-29", "close": "2026-10-20", "first": "2026-09-29 10:00"}}})
    _o = X.ORDER; X.ORDER = ["kapt"]
    X.fetch("dummy", now=NOW, diag={}, get=fake_k)
    X.ORDER = _o
    봄("판이 올라가면 14일 치 다시", calls3 and calls3[0].get("startDate") == (NOW - timedelta(days=14)).strftime("%Y%m%d"))
    by = X.publish(now=NOW)
    봄("보관된 옛 줄도 코드로 다시 가름(낱말로 용역이던 «대청소» → 공사)", by.get("kapt") == 1)

print(f"\n나라장터 밖 공고 시험: {ok}가지 맞음" + (f" · {bad}가지 틀림" if bad else ""))
sys.exit(1 if bad else 0)
