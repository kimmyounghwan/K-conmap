# -*- coding: utf-8 -*-
"""🔁 G540 입찰공고정보서비스 «새 판(02)» 대비 시험 — collect.py · fast.py (2026-11-05)

  python tools/시험_입찰공고02.py

  2026-11-03 조달청이 공공데이터포털 «조달청_나라장터 입찰공고정보서비스»(15129394)를 새 판으로 바꿈:
    새 주소 …/ad/BidPublicInfoService02/<오퍼레이션>02 · 포털 메일 «운영계정 신청자인 경우 별도의 재신청이 필요»
  ① 주소 바꾸기 — 우리가 쓰는 옛 판 오퍼레이션이 모두 새 판 명세(2026-11-05 포털 목록)에 있음 · 되돌리기 · 다른 서비스는 그대로
  ② «판 문제» 가르기 — 401 · 403 · 404 · 410 · 응답코드 12 · 20 · 21 · 30~33 만(5xx · 03 · 10 · 11 · 22 · 점검 웹페이지는 아님)
  ③ 옛 판 정상 — 옛 판만 부름(지금과 같음)
  ④ 옛 판이 없어지면(404) 새 판으로 한 번 → 받으면 이번 회차 남은 입찰공고도 새 판 · 낙찰정보는 그대로 · 수집상태에 적힘
  ⑤ 일시 오류(503) · 자료 없음(03) · 점검 웹페이지로는 판을 안 바꿈
  ⑥ 응답코드 30 · XML «NO_OPENAPI_SERVICE» 도 판 문제로 봄
  ⑦ 두 판 다 막히면 빈 결과 · 까닭 그대로 · 다른 판 다시 부르기는 회차에 한 번
  ⑧ 다른 판의 하루 몫 끝(22) → 입찰공고만 멈춤(QUOTA_OUT 안 켜짐 · 개찰 호출은 그대로)
  ⑨ 먼저 쓰는 판의 하루 몫 끝 → 예전처럼 회차 멈춤(QUOTA_OUT)
  ⑩ BID_PREFER_02 = True(재신청 뒤) → 새 판 먼저 · 막히면 옛 판
  ⑪ 새 판 확인(bid02_probe · bid02_check) — 꼴 다섯 · 전역 값 안 건드림 · 수집상태 줄
  ⑫ 빠른 수집(fast.py api) — 같은 규칙 · 다른 판 한도는 Quota 가 아니라 ApiError(빠른 수집 사슬이 안 멈춤)
  ⑬ 키가 로그 · 까닭 · 수집상태 어디에도 안 남음
가상 응답만 씀(조달청 · 저장소 안 부름 · 수집상태는 임시 폴더에).
"""
import contextlib
import io
import json
import os
import re
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import requests  # noqa: E402
import collect as C  # noqa: E402
import fast as F  # noqa: E402

OUT = sys.__stdout__
bad = 0
n = 0


def ok(이름, c, got=None):
    global bad, n
    n += 1
    if not c:
        bad += 1
    OUT.write(("  ✓ " if c else "  ✗ ") + 이름 + ("" if c or got is None else " = " + repr(got)[:300]) + "\n")


def 머리(글):
    OUT.write(글 + "\n")


KEY = "가상키-G540-비밀-7Qx"
BASE = C.BASE
# 2026-11-05 공공데이터포털 15129394 명세(swagger) 의 오퍼레이션 — 새 판(02)
SPEC02 = set("""getBidPblancListInfoCnstwkPPSSrch02 getBidPblancSubsiCnsttyIndstrytyListInfo02 getBidPblancListInfoServc02
getBidPblancListInfoFrgcpt02 getBidPblancListInfoThng02 getBidPblancListInfoCnstwkBsisAmount02 getBidPblancListBidPrceCalclAInfo02
getBidPblancListInfoFrgcptPPSSrch02 getBidPblancListInfoThngPPSSrch02 getBidPblancListInfoThngBsisAmount02
getBidPblancListInfoServcBsisAmount02 getBidPblancListInfoChgHstryThng02 getBidPblancListInfoChgHstryCnstwk02
getBidPblancListInfoChgHstryServc02 getBidPblancListInfoLicenseLimit02 getBidPblancListInfoPrtcptPsblRgn02
getBidPblancListInfoThngPurchsObjPrdct02 getBidPblancListInfoServcPurchsObjPrdct02 getBidPblancListInfoFrgcptPurchsObjPrdct02
getBidPblancListInfoEorderAtchFileInfo02 getBidPblancListInfoEtc02 getBidPblancListPPIFnlRfpIssAtchFileInfo02
getBidPblancListEvaluationIndstrytyMfrcInfo02 getBidPblancJntcontrctDutyRgnListInfo02 getBidPblancListInfoCnstwk02
getBidPblancListInfoEtcPPSSrch02 getBidPblancIncntvRgnListInfo02 getBidPblancListInfoAtchFileInfo02
getBidPblancListInfoServcPPSSrch02""".split())


class R:
    def __init__(self, status=200, text=""):
        self.status_code = status
        self.text = text
        self.content = text.encode("utf-8")

    def json(self):
        return json.loads(self.text)


def 자료(rows=1, total=None):
    return R(200, json.dumps({"response": {"header": {"resultCode": "00", "resultMsg": "정상"},
                                          "body": {"items": [{"bidNtceNo": "R26BK0000%04d" % i, "bidNtceOrd": "000",
                                                              "bidNtceNm": "가상 공사 %d" % i} for i in range(rows)],
                                                   "totalCount": total if total is not None else rows}}}, ensure_ascii=False))


def 기초자료(rows=1, total=None, a값=True):
    """🩹 G565 기초금액 응답 꼴 — a값=True 면 옛 판처럼 A값 칸(sftyMngcst · bidPrceCalclAYn …)이 실려 옴"""
    def 줄(i):
        d = {"bidNtceNo": "R26BK0000%04d" % i, "bidNtceOrd": "000", "bssamt": "300000000"}
        if a값:
            d.update({"sftyMngcst": "1200000", "npnInsrprm": "800000", "bidPrceCalclAYn": "Y", "bssAmtPurcnstcst": "250000000"})
        return d
    return R(200, json.dumps({"response": {"header": {"resultCode": "00", "resultMsg": "정상"},
                                          "body": {"items": [줄(i) for i in range(rows)],
                                                   "totalCount": total if total is not None else rows}}}, ensure_ascii=False))


def 코드(c, m):
    return R(200, json.dumps({"response": {"header": {"resultCode": c, "resultMsg": m}}}))


XML_없음 = R(200, "<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg><returnAuthMsg>NO_OPENAPI_SERVICE_ERROR"
                 "</returnAuthMsg><returnReasonCode>12</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>")
XML_한도 = R(200, "<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg><returnAuthMsg>"
                 "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR</returnAuthMsg><returnReasonCode>22</returnReasonCode>"
                 "</cmmMsgHeader></OpenAPI_ServiceResponse>")
점검 = R(200, '<!DOCTYPE html><html><head><title>조달청 시스템 점검 안내</title></head><body>시스템 점검</body></html>')
막힘403 = R(403, '{ "OpenAPI_ServiceResponse": { "cmmMsgHeader": { "errMsg": "SERVICE_KEY_IS_NOT_REGISTERED_ERROR" } } }')

부른 = []          # (주소, params)
규칙 = {"f": None}


def 가짜get(url, params=None, **kw):
    부른.append((url, dict(params or {})))
    return 규칙["f"](url, params or {})


requests.get = 가짜get           # collect · fast 가 같은 requests 를 씀
C.time.sleep = lambda s: None
로그 = io.StringIO()


def 처음(f):
    C.NET_FAILS = C.NET_FAILS_CONN = C.NET_FAILS_ALL = C.NET_HTML = C.HTML_STREAK = 0
    C.NET_DOWN = C.QUOTA_OUT = C.NET_RECOVERED = C.FLIP_TRIED = False
    C.BASE_FLIP, C.SCHEME_NOTE, C.HTML_HINT = None, "", ""
    C.BID_PREFER_02 = False
    C.BID_ALT = C.BID_ALT_TRIED = C.BID_QUOTA = False
    C.BID_NOTE = C.BID02_STATE = ""
    C.BID_GOT.update({"02": 0, "옛": 0})
    C.NET_T0 = time.time()
    F.BID.update({"alt": False, "tried": False, "quota": False})
    부른.clear()
    규칙["f"] = f


def 판(u):
    return "02" if "/ad/BidPublicInfoService02/" in u else ("옛" if "/ad/BidPublicInfoService/" in u else "딴")


OLD_LIVE = C.ENDPOINTS[("live", "con")]
OLD_BSIS = C.BSIS["con"]
OPENG = C.ENDPOINTS[("first", "con")]
NEW_LIVE = BASE + "/ad/BidPublicInfoService02/getBidPblancListInfoCnstwk02"

with contextlib.redirect_stdout(로그):
    머리("① 주소 바꾸기")
    src = "".join(open(os.path.join(ROOT, p), encoding="utf-8").read().replace("\r\n", "\n") for p in ("collect.py", "svc.py", "fast.py"))   # PC(Windows)는 CRLF
    # 진단 후보(PROBE_OPS · --probe 때만) 는 뺌 — «입찰가격산식A» 이름은 옛 판에서도 HTTP 400(이름 짐작이 틀림 · data/diag.json) · 수집에 안 씀
    진단 = re.search(r"\nPROBE_OPS = \[.*?\n\]", src, re.S)
    ok("진단 후보 목록(PROBE_OPS)을 찾음", bool(진단))
    진단ops = set(re.findall(r"/ad/BidPublicInfoService/(\w+)", 진단.group(0))) if 진단 else set()
    src = src.replace(진단.group(0), "") if 진단 else src
    옛ops = sorted(set(re.findall(r"/ad/BidPublicInfoService/(\w+)", src)))
    ok("진단에만 있는 것은 «입찰가격산식A» 짐작 하나뿐", 진단ops - set(옛ops) == {"getBidPblancListInfoBidPrceCalclA"}, 진단ops - set(옛ops))
    ok("collect · svc · fast 가 쓰는 옛 판 오퍼레이션 %d개(공사 · 용역 · 물품 목록 · 기초금액 · 면허 · 지역)" % len(옛ops),
       {"getBidPblancListInfoCnstwk", "getBidPblancListInfoServc", "getBidPblancListInfoThng", "getBidPblancListInfoCnstwkBsisAmount",
        "getBidPblancListInfoServcBsisAmount", "getBidPblancListInfoThngBsisAmount", "getBidPblancListInfoLicenseLimit",
        "getBidPblancListInfoPrtcptPsblRgn"} <= set(옛ops), 옛ops)
    없음 = [o for o in 옛ops if C.bid_url(BASE + "/ad/BidPublicInfoService/" + o, True).rsplit("/", 1)[-1] not in SPEC02]
    ok("모두 새 판 명세(2026-11-05 포털 목록 30개)에 그대로 있음", not 없음, 없음)
    ok("옛 판 → 새 판 주소 꼴", C.bid_url(OLD_LIVE, True) == NEW_LIVE, C.bid_url(OLD_LIVE, True))
    ok("새 판 → 옛 판(되돌리기)", C.bid_url(NEW_LIVE, False) == OLD_LIVE, C.bid_url(NEW_LIVE, False))
    ok("두 번 바꿔도 같음(옛 → 새 → 새 · 새 → 옛 → 옛)", C.bid_url(C.bid_url(OLD_LIVE, True), True) == NEW_LIVE
       and C.bid_url(C.bid_url(NEW_LIVE, False), False) == OLD_LIVE)
    ok("모든 옛 판 주소가 되돌리면 제자리", all(C.bid_url(C.bid_url(BASE + "/ad/BidPublicInfoService/" + o, True), False)
                                     == BASE + "/ad/BidPublicInfoService/" + o for o in 옛ops))
    ok("낙찰정보 · 업체정보(…02 로 끝나도) 주소는 그대로",
       C.bid_url(OPENG, True) == OPENG and C.bid_url(C.CORP_INFO_URL, False) == C.CORP_INFO_URL
       and not C.is_bid(OPENG) and not C.is_bid(C.CORP_INFO_URL))
    ok("물음표 뒤(질의 글)는 그대로 둠", C.bid_url(OLD_LIVE + "?a=1", True) == NEW_LIVE + "?a=1")
    기본 = C.BID_PREFER_02
    처음(lambda u, p: 자료())
    C.BID_PREFER_02 = 기본
    ok("기본(지금 · G564 되돌림) = 옛 판 먼저(BID_PREFER_02 False) — 새 판 기초금액에 A값이 안 실려 와서", C.BID_PREFER_02 is False and C.bid_url(OLD_LIVE) == OLD_LIVE and C.bid_url(NEW_LIVE) == OLD_LIVE)
    C.BID_PREFER_02 = False
    ok("False 로 두면 옛 판 먼저(되돌릴 길)", C.bid_url(OLD_LIVE) == OLD_LIVE and C.bid_url(NEW_LIVE) == OLD_LIVE)
    ok("새 판 확인 주소 = …/ad/BidPublicInfoService02/getBidPblancListInfoCnstwk02", C.BID02_PROBE_URL == NEW_LIVE, C.BID02_PROBE_URL)

    머리("② «판 문제» 가르기")
    for 무엇, 값 in [("HTTP 404", dict(status=404)), ("HTTP 403", dict(status=403)), ("HTTP 401", dict(status=401)),
                   ("HTTP 410", dict(status=410)), ("응답코드 12", dict(code="12")), ("응답코드 30", dict(code="30")),
                   ("응답코드 030", dict(code="030")), ("응답코드 20", dict(code="20", msg="SERVICE_ACCESS_DENIED_ERROR")),
                   ("XML 12", dict(text=XML_없음.text)), ("말 SERVICE_KEY_IS_NOT_REGISTERED", dict(text=막힘403.text))]:
        ok("판 문제 맞음 — " + 무엇, C.bid_gone(**값) is True)
    for 무엇, 값 in [("HTTP 500", dict(status=500)), ("HTTP 502", dict(status=502)), ("HTTP 503", dict(status=503)),
                   ("응답코드 03 자료 없음", dict(code="03", msg="NODATA_ERROR")), ("응답코드 10 요청 값", dict(code="10")),
                   ("응답코드 11 필수 값", dict(code="11")), ("응답코드 22 몫 끝", dict(code="22", msg="LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR")),
                   ("XML 22", dict(text=XML_한도.text)), ("403 인데 몫 끝 글", dict(status=403, text="SERVICE_ACCESS_DENIED_TRAFFIC")),
                   ("정상 200", dict())]:
        ok("판 문제 아님 — " + 무엇, C.bid_gone(**값) is False)

    머리("③ 옛 판 정상 — 지금과 같음")
    처음(lambda u, p: 자료(2))
    out = C.fetch(OLD_LIVE, KEY, label="가상 공고")
    ok("옛 판만 부름 · 2줄", len(out) == 2 and [판(u) for u, _ in 부른] == ["옛"], [판(u) for u, _ in 부른])
    ok("판 안 바꿈 · 알림 없음", not C.BID_ALT and not C.BID_ALT_TRIED and C.BID_NOTE == "")

    머리("④ 옛 판이 없어짐(404) → 새 판 한 번 → 이번 회차 남은 것도 새 판")
    처음(lambda u, p: R(404, "API not found") if 판(u) == "옛" else 자료(3))
    w = {}
    out = C.fetch(OLD_LIVE, KEY, label="가상 공고", why=w)
    ok("새 판으로 3줄 받음 · 까닭 비움(받은 날로 셈)", len(out) == 3 and w == {}, (len(out), w))
    ok("부른 차례 옛 → 새 · 새 판 주소는 …02/…Cnstwk02", [판(u) for u, _ in 부른] == ["옛", "02"] and 부른[1][0] == NEW_LIVE, [u for u, _ in 부른])
    ok("같은 질의 값(키 · 날 · 쪽)으로 다시 부름", 부른[0][1] == 부른[1][1])
    부른.clear()
    rows, why = C.fetch_paged(OLD_BSIS, KEY, C.datetime.now(C.KST), label="가상 기초금액")
    ok("다음 입찰공고 호출(기초금액)은 처음부터 새 판 · fetch_paged 까닭 없음", [판(u) for u, _ in 부른] == ["02"]
       and 부른[0][0].endswith("/getBidPblancListInfoCnstwkBsisAmount02") and why == {} and len(rows) == 3, ([u for u, _ in 부른], why))
    부른.clear()
    C.fetch(OPENG, KEY, label="가상 개찰")
    ok("낙찰정보(개찰)는 그대로 옛 주소", [u for u, _ in 부른] == [OPENG])
    ok("알림 글 — «옛 판 이 안 돼(HTTP 404) 새 판(02) 으로»", "옛 판" in C.BID_NOTE and "HTTP 404" in C.BID_NOTE and "새 판(02)" in C.BID_NOTE, C.BID_NOTE)
    ok("판마다 정상 응답 수 — 새 판 2 · 옛 판 0", C.BID_GOT == {"02": 2, "옛": 0}, C.BID_GOT)
    tmp = tempfile.mkdtemp(prefix="g540_")
    C.ROOT = tmp
    C.BID02_STATE = "공사 목록 ✅ (12건) · 지금은 옛 판으로 받음"
    C.write_status({"con": {}})
    md = open(os.path.join(tmp, "docs", "수집상태.md"), encoding="utf-8").read()
    ok("수집상태 «조달청 호출» 줄에 🔁 알림 · «입찰공고 새 판(02)» 줄 + 판마다 응답 수", "| 조달청 호출 | 정상 · 🔁 입찰공고 옛 판" in md
       and "| 입찰공고 새 판(02) | 공사 목록 ✅ (12건) · 지금은 옛 판으로 받음 · 이번 회차 정상 응답 새 판 2 · 옛 판 0 |" in md, md[:700])
    C.BID02_STATE = ""
    C.BID_GOT.update({"02": 0, "옛": 0})
    C.write_status({"con": {}})
    md = open(os.path.join(tmp, "docs", "수집상태.md"), encoding="utf-8").read()
    ok("확인 전 · 응답 0 이면 «—»", "| 입찰공고 새 판(02) | — |" in md)

    머리("⑤ 일시 오류 · 자료 없음 · 점검으로는 판을 안 바꿈")
    for 무엇, 응답 in [("HTTP 503", R(503, "Service Unavailable")), ("응답코드 03 자료 없음", 코드("03", "NODATA_ERROR")),
                     ("응답코드 10 요청 값", 코드("10", "INVALID_REQUEST_PARAMETER_ERROR"))]:
        처음(lambda u, p, r=응답: r)
        w = {}
        out = C.fetch(OLD_LIVE, KEY, label="가상", why=w)
        ok("%s → 옛 판 한 번만 · 빈 결과 · 까닭 남음 · 판 그대로" % 무엇, out == [] and [판(u) for u, _ in 부른] == ["옛"] and w
           and not C.BID_ALT and not C.BID_ALT_TRIED, ([판(u) for u, _ in 부른], w))
    처음(lambda u, p: 점검)
    C.fetch(OLD_LIVE, KEY, label="가상 점검")
    ok("점검 웹페이지 → http/https 다시 부르기(G481)만 · 새 판 안 부름", all(판(u) == "옛" for u, _ in 부른) and not C.BID_ALT_TRIED, [u for u, _ in 부른])

    머리("⑥ 응답코드 30 · XML NO_OPENAPI_SERVICE 도 판 문제")
    처음(lambda u, p: 코드("30", "SERVICE_KEY_IS_NOT_REGISTERED_ERROR") if 판(u) == "옛" else 자료(1))
    ok("응답코드 30 → 새 판 1줄", len(C.fetch(OLD_LIVE, KEY, label="가상")) == 1 and [판(u) for u, _ in 부른] == ["옛", "02"] and C.BID_ALT)
    처음(lambda u, p: XML_없음 if 판(u) == "옛" else 자료(1))
    ok("XML 12 → 새 판 1줄", len(C.fetch(OLD_LIVE, KEY, label="가상")) == 1 and [판(u) for u, _ in 부른] == ["옛", "02"] and C.BID_ALT)

    머리("⑦ 두 판 다 막힘 → 빈 결과 · 까닭 그대로 · 회차에 한 번만")
    처음(lambda u, p: R(404, "API not found"))
    w = {}
    out = C.fetch(OLD_LIVE, KEY, label="가상", why=w)
    ok("빈 결과 · 까닭 = 옛 판 HTTP 404 · 판 그대로", out == [] and w.get("http") == 404 and not C.BID_ALT and C.BID_ALT_TRIED, (w, C.BID_ALT))
    ok("이번엔 옛 → 새 두 번 부름", [판(u) for u, _ in 부른] == ["옛", "02"])
    부른.clear()
    C.fetch(OLD_BSIS, KEY, label="가상 2")
    ok("다음 막힘엔 다른 판을 다시 안 부름(호출이 두 배가 되지 않게)", [판(u) for u, _ in 부른] == ["옛"], [판(u) for u, _ in 부른])
    ok("알림 글 없음(바꿔 받은 것이 없음)", C.BID_NOTE == "")

    머리("⑧ 다른 판의 하루 몫 끝 → 입찰공고만 멈춤")
    처음(lambda u, p: R(404, "API not found") if 판(u) == "옛" else (자료(1) if len(부른) <= 2 else XML_한도))
    ok("처음엔 새 판으로 받음", len(C.fetch(OLD_LIVE, KEY, label="가상 1")) == 1 and C.BID_ALT)
    w = {}
    out = C.fetch(OLD_LIVE, KEY, label="가상 2", why=w)
    ok("새 판 22 → 빈 결과 · QUOTA_OUT 안 켜짐 · BID_QUOTA · 까닭(quota)", out == [] and not C.QUOTA_OUT and C.BID_QUOTA
       and w.get("quota") == "입찰공고", (C.QUOTA_OUT, C.BID_QUOTA, w))
    ok("이미 판을 바꾼 회차라 옛 판으로 다시 안 감(옛 판은 없어진 판)", [판(u) for u, _ in 부른] == ["옛", "02", "02"], [판(u) for u, _ in 부른])
    k = len(부른)
    rows, why = C.fetch_paged(OLD_BSIS, KEY, C.datetime.now(C.KST), label="가상 3")
    ok("그 뒤 입찰공고는 부르지 않음 · fetch_paged 는 «못 받음»", len(부른) == k and rows == [] and why.get("quota") == "입찰공고", (len(부른) - k, why))
    규칙["f"] = lambda u, p: 자료(4)
    ok("개찰(낙찰정보)은 그대로 부름 · 4줄", len(C.fetch(OPENG, KEY, label="가상 개찰")) == 4 and 부른[-1][0] == OPENG)
    ok("알림 글에 «하루 몫 끝»", "하루 몫 끝" in C.BID_NOTE, C.BID_NOTE)

    머리("⑨ 먼저 쓰는 판의 하루 몫 끝 → 예전처럼 회차 멈춤")
    처음(lambda u, p: XML_한도)
    C.fetch(OLD_LIVE, KEY, label="가상")
    ok("QUOTA_OUT 켜짐 · 다른 판 안 부름", C.QUOTA_OUT and [판(u) for u, _ in 부른] == ["옛"] and not C.BID_ALT_TRIED)
    처음(lambda u, p: 코드("22", "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR"))
    C.fetch(OLD_LIVE, KEY, label="가상")
    ok("응답코드 22 도 같음", C.QUOTA_OUT and not C.BID_ALT_TRIED)

    머리("⑩ 재신청 뒤(BID_PREFER_02 True) — 새 판 먼저 · 막히면 옛 판")
    처음(lambda u, p: 자료(1))
    C.BID_PREFER_02 = True
    C.fetch(OLD_LIVE, KEY, label="가상")
    ok("옛 판 주소를 줘도 새 판으로 부름", [u for u, _ in 부른] == [NEW_LIVE], [u for u, _ in 부른])
    처음(lambda u, p: 막힘403 if 판(u) == "02" else 자료(2))
    C.BID_PREFER_02 = True
    ok("새 판 403 → 옛 판 2줄 · 알림 «새 판(02) 이 안 돼 … 옛 판 으로»", len(C.fetch(OLD_LIVE, KEY, label="가상")) == 2
       and [판(u) for u, _ in 부른] == ["02", "옛"] and C.BID_NOTE.startswith("입찰공고 새 판(02) 이 안 돼"), C.BID_NOTE)
    ok("bid02_check 는 따로 안 물음(실제 수집이 곧 시험)", C.bid02_check(KEY).startswith("새 판(02)을 먼저 씁니다") and len(부른) == 2)
    처음(lambda u, p: XML_한도 if 판(u) == "02" else 자료(3))
    C.BID_PREFER_02 = True
    w = {}
    out = C.fetch(OLD_LIVE, KEY, label="가상 몫", why=w)
    ok("새 판이 먼저인데 몫 끝(개발계정 1,000 이어도) → 옛 판으로 3줄 · QUOTA_OUT 안 켜짐 · 까닭 비움",
       len(out) == 3 and [판(u) for u, _ in 부른] == ["02", "옛"] and not C.QUOTA_OUT and not C.BID_QUOTA and w == {} and C.BID_ALT, ([판(u) for u, _ in 부른], w))
    부른.clear()
    C.fetch(OLD_BSIS, KEY, label="가상 몫 2")
    ok("이번 회차 남은 입찰공고는 옛 판 · 알림 «새 판 하루 몫 끝»", [판(u) for u, _ in 부른] == ["옛"] and "새 판 하루 몫 끝" in C.BID_NOTE, C.BID_NOTE)
    처음(lambda u, p: XML_한도 if 판(u) != "딴" else 자료(2))
    C.BID_PREFER_02 = True
    w = {}
    out = C.fetch(OLD_LIVE, KEY, label="가상 둘 다 몫", why=w)
    ok("두 판 다 몫 끝 → 입찰공고만 멈춤(BID_QUOTA) · QUOTA_OUT 안 켜짐 · 까닭 quota", out == [] and C.BID_QUOTA and not C.QUOTA_OUT
       and w.get("quota") == "입찰공고" and [판(u) for u, _ in 부른] == ["02", "옛"], ([판(u) for u, _ in 부른], w, C.QUOTA_OUT))
    ok("개찰은 그대로 받음(2줄)", len(C.fetch(OPENG, KEY, label="가상 개찰")) == 2)
    C.BID_PREFER_02 = False

    머리("⑪ 새 판 확인(bid02_probe · bid02_check)")
    처음(lambda u, p: 자료(1, total=37))
    전 = (C.NET_FAILS, C.NET_DOWN, C.QUOTA_OUT, C.NET_FAILS_ALL, C.BID_ALT)
    ok("정상 → ok · «37건»", C.bid02_probe(KEY) == ("ok", "37건"))
    ok("1줄만(numOfRows 1) · 오늘 날짜 · 새 판 주소", 부른[0][0] == NEW_LIVE and 부른[0][1].get("numOfRows") == "1"
       and 부른[0][1].get("inqryBgnDt", "").endswith("0000") and 부른[0][1].get("type") == "json", 부른[0][1].get("numOfRows"))
    for 무엇, 응답, 꼴 in [("HTTP 403", 막힘403, "막힘"), ("응답코드 30", 코드("30", "SERVICE_KEY_IS_NOT_REGISTERED_ERROR"), "막힘"),
                         ("XML 12", XML_없음, "막힘"), ("응답코드 22", 코드("22", "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR"), "한도"),
                         ("XML 22", XML_한도, "한도"), ("HTTP 500", R(500, "err"), "실패"), ("점검 웹페이지", 점검, "실패"),
                         ("응답코드 03", 코드("03", "NODATA_ERROR"), "ok"),
                         ("응답코드 11 필수 값(면허제한 bidNtceOrd 필수일 때)", 코드("11", "NO_MANDATORY_REQUEST_PARAMETERS_ERROR"), "실패")]:
        규칙["f"] = lambda u, p, r=응답: r
        k2, t2 = C.bid02_probe(KEY)
        ok("%s → %s" % (무엇, 꼴), k2 == 꼴, (k2, t2))

    def 끊김(u, p):
        raise requests.exceptions.ConnectionError("HTTPSConnectionPool(host='apis.data.go.kr') url=...?serviceKey=" + p.get("serviceKey", ""))
    규칙["f"] = 끊김
    k2, t2 = C.bid02_probe(KEY)
    ok("연결 오류 → 실패 · 오류 이름만(주소 · 키 안 남김)", k2 == "실패" and t2 == "ConnectionError", (k2, t2))
    ok("확인은 전역 값(차단기 · 몫 · 판)을 안 건드림", (C.NET_FAILS, C.NET_DOWN, C.QUOTA_OUT, C.NET_FAILS_ALL, C.BID_ALT) == 전)
    # 쪽 크기 — 999줄을 물었는데 전체가 더 많으면서 100줄만 오면 «쪽»
    규칙["f"] = lambda u, p: 자료(int(p.get("numOfRows", "1")) if p.get("numOfRows") != "999" else 100, total=5000)
    k2, t2 = C.bid02_probe(KEY, op="getBidPblancListInfoLicenseLimit02", rows=999, ago=1)
    ok("999줄 물었는데 100줄(전체 5,000) → «쪽» · 쪽넘김 확인", k2 == "쪽" and "100줄" in t2 and "5,000" in t2, (k2, t2))
    ok("면허제한 확인은 어제 하루(ago 1) · 999줄", 부른[-1][1].get("numOfRows") == "999"
       and 부른[-1][1].get("inqryBgnDt") == (C.datetime.now(C.KST) - C.timedelta(days=1)).strftime("%Y%m%d") + "0000", 부른[-1][1].get("inqryBgnDt"))
    규칙["f"] = lambda u, p: 자료(min(int(p.get("numOfRows", "1")), 999), total=5000)
    ok("999줄이 다 오면 ok", C.bid02_probe(KEY, op="getBidPblancListInfoLicenseLimit02", rows=999, ago=1) == ("ok", "5,000건"))
    규칙["f"] = lambda u, p: 자료(3, total=3)
    ok("전체가 999보다 적고 다 오면 ok(주말 등)", C.bid02_probe(KEY, op="getBidPblancListInfoLicenseLimit02", rows=999, ago=1)[0] == "ok")
    부른.clear()
    규칙["f"] = lambda u, p: 막힘403
    s = C.bid02_check(KEY)
    ok("막힘 → 첫 하나만 묻고 멈춤(같은 키라 같은 답) · «재신청 · 활용신청 확인» · «지금은 옛 판으로 받음»",
       s.startswith("공사 목록 ⚠️ 막힘") and "운영계정 재신청" in s and s.endswith("지금은 옛 판으로 받음") and C.BID02_STATE == s and len(부른) == 1, (s, len(부른)))
    부른.clear()
    규칙["f"] = lambda u, p: (기초자료 if "BsisAmount" in u else 자료)(min(int(p.get("numOfRows", "1")), 999), total=1500)
    s = C.bid02_check(KEY)
    ok("4가지 다 됨 → «… 4가지 다 됨(새 판으로 바꿀 수 있음) · 지금은 옛 판으로 받음»", s == "공사 목록 ✅ (1,500건) · 기초금액 ✅ (1,500건) · 면허제한 ✅ (1,500건) · "
       "참가지역 ✅ (1,500건) — 4가지 다 됨(새 판으로 바꿀 수 있음) · 지금은 옛 판으로 받음", s)
    ok("4가지 주소 · 우리가 부르는 꼴 그대로(inqryDiv 1 · 날짜 · json)", [u.rsplit("/", 1)[-1] for u, _ in 부른] == [
        "getBidPblancListInfoCnstwk02", "getBidPblancListInfoCnstwkBsisAmount02", "getBidPblancListInfoLicenseLimit02",
        "getBidPblancListInfoPrtcptPsblRgn02"] and all(q.get("inqryDiv") == "1" and q.get("type") == "json" and q.get("inqryEndDt", "").endswith("2359")
                                                         for _, q in 부른), [u for u, _ in 부른])
    부른.clear()
    규칙["f"] = lambda u, p: 코드("11", "NO_MANDATORY_REQUEST_PARAMETERS_ERROR") if "LicenseLimit" in u else 자료(1, total=7)
    s = C.bid02_check(KEY)
    ok("면허제한만 안 되면 → 그것만 «⚠️ 안 됨 (11 …)» · «4가지 다 됨» 없음 · 4가지 다 물음", "면허제한 ⚠️ 안 됨 (11 NO_MANDATORY" in s
       and "4가지 다 됨" not in s and len(부른) == 4 and "참가지역 ✅" in s, s)
    # 응답 글이 키를 되울려 줘도(주소를 그대로 돌려주는 오류 글) 수집상태 · 알림에 안 남김
    from urllib.parse import quote
    규칙["f"] = lambda u, p: R(403, "Forbidden url=/x?serviceKey=" + quote(KEY, safe="") + " key=" + KEY)
    k2, t2 = C.bid02_probe(KEY)
    ok("되울린 키(그대로 · 주소 꼴) → *** 로 가림", k2 == "막힘" and KEY not in t2 and quote(KEY, safe="") not in t2 and "***" in t2, t2)
    처음(lambda u, p: R(200, "<OpenAPI_ServiceResponse><errMsg>" + KEY + "</errMsg><returnAuthMsg>NO_OPENAPI_SERVICE_ERROR"
                             "</returnAuthMsg><returnReasonCode>12</returnReasonCode></OpenAPI_ServiceResponse>") if 판(u) == "옛" else 자료(1))
    C.fetch(OLD_LIVE, KEY, label="가상 되울림")
    ok("판 바꾼 알림 글(공개 수집상태)에도 키 없음", C.BID_ALT and C.BID_NOTE and KEY not in C.BID_NOTE and "***" in C.BID_NOTE, C.BID_NOTE)
    mains = open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read().replace("\r\n", "\n")   # PC(Windows)는 CRLF
    ok("main 에서 회차마다 한 번 부름(--exportonly 땐 안 부름)", "bid02_check(key)" in mains and "if not NO_NET:\n        try:\n            bid02_check(key)" in mains)

    머리("⑫ 빠른 수집(fast.py api) — 같은 규칙")
    처음(lambda u, p: R(404, "API not found") if 판(u) == "옛" else 자료(2))
    got = F.api(OLD_LIVE, KEY, {"pageNo": "1"})
    ok("옛 판 404 → 새 판 2줄 · 이 실행은 새 판", len(got) == 2 and [판(u) for u, _ in 부른] == ["옛", "02"] and F.BID["alt"])
    부른.clear()
    F.api_paged(C.LIC["con"], KEY, {"inqryBgnDt": "202611050000"}, 3)
    ok("다음(면허제한)은 처음부터 새 판 …LicenseLimit02", [u.rsplit("/", 1)[-1] for u, _ in 부른] == ["getBidPblancListInfoLicenseLimit02"])
    부른.clear()
    F.api(OPENG, KEY, {})
    ok("개찰(낙찰정보)은 그대로", [u for u, _ in 부른] == [OPENG])
    규칙["f"] = lambda u, p: XML_한도 if 판(u) == "02" else 자료(1)
    try:
        F.api(OLD_LIVE, KEY, {})
        r1 = "없음"
    except F.Quota:
        r1 = "Quota"
    except F.ApiError:
        r1 = "ApiError"
    ok("다른 판 몫 끝 → Quota 아니라 ApiError(빠른 수집 사슬 안 멈춤)", r1 == "ApiError" and F.BID["quota"], r1)
    k = len(부른)
    try:
        F.api(OLD_LIVE, KEY, {})
        r2 = "없음"
    except F.ApiError:
        r2 = "ApiError"
    ok("그 뒤 입찰공고는 부르지 않고 ApiError", r2 == "ApiError" and len(부른) == k)
    ok("개찰은 그대로 받음", len(F.api(OPENG, KEY, {})) == 1)
    처음(lambda u, p: XML_한도)
    try:
        F.api(OLD_LIVE, KEY, {})
        r3 = "없음"
    except F.Quota:
        r3 = "Quota"
    ok("먼저 쓰는 판 몫 끝 → 예전처럼 Quota", r3 == "Quota" and not F.BID["tried"])
    처음(lambda u, p: R(503, "busy"))
    try:
        F.api(OLD_LIVE, KEY, {})
        r4 = "없음"
    except F.ApiError as e:
        r4 = "ApiError gone=%s" % e.gone
    ok("503 → ApiError(gone False) · 새 판 안 부름", r4 == "ApiError gone=False" and [판(u) for u, _ in 부른] == ["옛"], r4)
    처음(lambda u, p: R(404, "x"))
    try:
        F.api(OLD_LIVE, KEY, {})
        r5 = "없음"
    except F.ApiError as e:
        r5 = str(e)
    ok("두 판 다 404 → 먼저 쓰는 판의 까닭(HTTP 404) 그대로 · 한 번만", r5 == "HTTP 404" and [판(u) for u, _ in 부른] == ["옛", "02"]
       and not F.BID["alt"] and F.BID["tried"], r5)
    부른.clear()
    try:
        F.api(OLD_LIVE, KEY, {})
    except F.ApiError:
        pass
    ok("다시 막혀도 다른 판은 다시 안 부름", [판(u) for u, _ in 부른] == ["옛"])
    ok("fast.ApiError 는 예전처럼 글 하나로도 만들어짐(데이터베이스 오류 자리)", str(F.ApiError("데이터베이스 HTTP 500")) == "데이터베이스 HTTP 500"
       and F.ApiError("x").gone is False)
    처음(lambda u, p: XML_한도 if 판(u) == "02" else 자료(2))
    C.BID_PREFER_02 = True
    got = F.api(OLD_LIVE, KEY, {})
    ok("새 판이 먼저인데 몫 끝 → 옛 판 2줄 · 이 실행은 옛 판", len(got) == 2 and [판(u) for u, _ in 부른] == ["02", "옛"] and F.BID["alt"] and not F.BID["quota"])
    부른.clear()
    F.api(OLD_LIVE, KEY, {})
    ok("다음 입찰공고는 처음부터 옛 판", [판(u) for u, _ in 부른] == ["옛"])
    처음(lambda u, p: XML_한도 if 판(u) != "딴" else 자료(1))
    C.BID_PREFER_02 = True
    try:
        F.api(OLD_LIVE, KEY, {})
        r6 = "없음"
    except F.Quota:
        r6 = "Quota"
    except F.ApiError:
        r6 = "ApiError"
    ok("두 판 다 몫 끝 → ApiError(Quota 아님 · 사슬 안 멈춤) · 이 실행 입찰공고 멈춤", r6 == "ApiError" and F.BID["quota"], r6)
    ok("개찰은 그대로", len(F.api(OPENG, KEY, {})) == 1)
    C.BID_PREFER_02 = False

머리("⑭ 🩹 G565 바로투찰 재료 — 새 판 기초금액 A값 칸 · 최근 3일 A값 실린 비율")
처음(lambda u, p: 기초자료(1, total=25, a값=False))
k3, t3 = C.bid02_probe(KEY, op="getBidPblancListInfoCnstwkBsisAmount02")
ok("기초금액은 오는데 A값 칸이 없으면 → «A값» (G540b 때 건수만 보고 바꿈 — G564)", k3 == "A값" and "A값 칸" in t3, (k3, t3))
처음(lambda u, p: 기초자료(1, total=25))
ok("A값 칸이 실려 오면 → ok · «25건»", C.bid02_probe(KEY, op="getBidPblancListInfoCnstwkBsisAmount02") == ("ok", "25건"))
처음(lambda u, p: 자료(1, total=7))
ok("공사 목록 확인은 A값 칸을 안 봄(목록엔 원래 없음)", C.bid02_probe(KEY) == ("ok", "7건"))
처음(lambda u, p: 기초자료(1, total=9, a값=False) if "BsisAmount" in u else 자료(1, total=9))
s4 = C.bid02_check(KEY)
ok("새 판 확인 줄 — «기초금액 ⚠️ A값 칸 없음» · «4가지 다 됨» 안 붙음", "기초금액 ⚠️ A값 칸 없음" in s4 and "4가지 다 됨" not in s4 and "참가지역 ✅" in s4, s4)
지금 = C.datetime(2026, 11, 6, 13, 0, tzinfo=C.KST)
def 공고(i, dt="20261105100000", close="20261112100000", base=300000000, aval=0, ayn="", pc=0):
    return {"no": "R26BK%06d" % i, "dt": dt, "close": close, "base": base, "aval": aval, "ayn": ayn, "pc": pc}
없음 = {"con": {str(i): 공고(i) for i in range(40)}}
g = C.바로투찰재료(없음, 지금)
ok("최근 3일 기초금액 나온 마감 전 40건 · A값 0 → 경고(«A값 실린 공고 0건(0%)» · «💰 바로투찰» · 순공사원가 0건)", g["n"] == 40 and g["A값"] == 0 and "A값 실린 공고 0건(0%)" in g.get("경고", "")
   and "💰 바로투찰" in g["경고"] and "순공사원가 실린 공고 0건" in g["경고"], g)
정상 = {"con": {str(i): 공고(i, aval=(1500000 if i < 39 else 0), ayn=("Y" if i < 39 else ""), pc=(250000000 if i % 2 else 0)) for i in range(40)}}
g2 = C.바로투찰재료(정상, 지금)
ok("40건 중 A값 39 · 순공사원가 20 → 경고 없음", g2 == {"n": 40, "A값": 39, "순공사원가": 20, "날": 3}, g2)
ok("ayn «N»(A값 미적용)도 A값 실린 것으로 셈", C.바로투찰재료({"con": {str(i): 공고(i, ayn="N", pc=1) for i in range(30)}}, 지금)["A값"] == 30)
섞임 = {"con": dict({str(i): 공고(i) for i in range(29)}, **{"old%d" % i: 공고(100 + i, dt="20261020100000") for i in range(50)},
                    **{"shut%d" % i: 공고(200 + i, close="20261106120000") for i in range(50)}, **{"nob%d" % i: 공고(300 + i, base=0) for i in range(50)})}
g3 = C.바로투찰재료(섞임, 지금)
ok("3일 넘은 공고 · 마감 지난 공고 · 기초금액 없는 공고는 안 셈 → 29건(30 미만) · 경고 없음", g3["n"] == 29 and "경고" not in g3, g3)
ok("수집상태 줄 — 정상이면 숫자 · 경고면 «⚠️» 로 시작", C.재료글(g2) == "최근 3일 기초금액 나온 마감 전 공고 40 · A값 39(97%) · 순공사원가 20(50%)"
   and C.재료글(g).startswith("⚠️ 최근 3일 기초금액") and C.재료글({"n": 0, "날": 3}) == "최근 3일 기초금액 나온 마감 전 공고 없음", C.재료글(g2))
빈줄 = ([공고(i, dt="20261103100000") for i in range(12)] + [공고(100 + i, dt="20261104100000") for i in range(9)]
       + [공고(200 + i, dt="20261102100000", aval=1500000, ayn="Y") for i in range(30)]
       + [공고(300 + i, dt="20261103100000", close="20261106120000") for i in range(20)] + [공고(400 + i, dt="20261020100000") for i in range(20)])
빈 = {"con": {r["no"]: r for r in 빈줄}}     # 저장소는 공고번호가 열쇠(collect.py live["con"] 와 같은 꼴)
ok("A값 빈 공고일 — 11-03(12건)만 · 11-04(9건 · 10 미만) · A값 있는 11-02 · 마감 지난 · 10일 넘은 공고는 안 셈", C.빈A값날(빈, 지금) == ["20261103"], C.빈A값날(빈, 지금))
평소 = {"con": {r["no"]: r for r in [공고(500 + i, dt="20261105100000", aval=(1500000 if i >= 15 else 0)) for i in range(471)]}}
ok("평소처럼 몇 건만 빔(471건 중 15건 · 3%) → 다시 안 부름(회차마다 헛호출 없게) · 비율 10% 넘으면 부름", C.빈A값날(평소, 지금) == []
   and C.빈A값날({"con": {r["no"]: r for r in [공고(900 + i, dt="20261105100000", aval=(1500000 if i >= 50 else 0)) for i in range(471)]}}, 지금) == ["20261105"])
받은날 = []
옛 = C.bsis_by_day
def 가짜기초(key, day, kind):
    받은날.append(day.strftime("%Y%m%d"))
    return {"R26BK%06d" % i: {"base": 300000000, "aval": 1500000, "ayn": "Y", "aparts": [["산업안전보건관리비", 1500000]], "pc": 250000000} for i in range(12)}
C.bsis_by_day = 가짜기초
try:
    first0 = {"con": {}}
    got = C.backfill_days(KEY, first0, 빈, ["20261103"], sleep=0)
finally:
    C.bsis_by_day = 옛
a0 = 빈["con"]["R26BK000000"]
ok("backfill_days — 그 공고일 하루치만 받고 빈 칸만 채움(A값 · 적용 · 순공사원가) · 있던 기초금액은 그대로", 받은날 == ["20261103"] and got == 12
   and a0["aval"] == 1500000 and a0["ayn"] == "Y" and a0["pc"] == 250000000 and a0["base"] == 300000000 and C.빈A값날(빈, 지금) == [], (받은날, got, a0))
ok("main 에서 소급 보충이 없을 때만 · 차단기 · 몫 끝이면 안 돎", "if not fill_days and not NET_DOWN and not QUOTA_OUT:" in open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read()
   and "빈날 = 빈A값날(live)" in open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read())
ok("수집상태.md 에 «바로투찰 재료» 줄 · health.json 에 재료(write_health)", "| 바로투찰 재료 | %s |" in open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read()
   and 'v["재료"] = 재' in open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read())

머리("⑬ 키가 어디에도 안 남음")
글 = 로그.getvalue()
ok("로그(%d자)에 키 없음" % len(글), KEY not in 글 and "7Qx" not in 글)
ok("알림 · 수집상태 글에 키 없음", KEY not in C.BID_NOTE and KEY not in C.BID02_STATE)
md = open(os.path.join(tmp, "docs", "수집상태.md"), encoding="utf-8").read()
ok("수집상태.md 에 키 없음", KEY not in md)
ok("로그에 판 바꾼 알림이 찍힘(🔁)", "🔁 입찰공고 옛 판 이 안 돼" in 글, 글[:200])

OUT.write(("\n✅ 모두 맞음 %d/%d\n" % (n, n)) if not bad else ("\n❌ 틀림 %d / %d\n" % (bad, n)))
sys.exit(1 if bad else 0)
