# -*- coding: utf-8 -*-
"""📞 G517 1순위 연락처 시험 — 조달청 «조달업체 기본정보»로 빈 전화 · 주소 채우기 (2026-11-03)

  python tools/시험_업체연락처.py

  ① 응답 읽기(corp_info_get): 정상 · 본사 먼저 · 다른 사업자번호 줄은 안 씀 · 전화 꼴 · 자료 없음(03) ·
     활용신청 안 됨(30 · 20 · XML 봉투 · HTTP 401/403) · 한도(22) · 웹페이지(점검) · 통신 실패
  ② 채우기(fill_contacts_api): 법인만 · 이미 있는 줄은 안 건드림 · 최신 개찰부터 · 장부(있음 1년 · 없음 30일 · 3년 버림) ·
     회차 상한 · 하루 상한 · 막힘이면 첫 호출에서 멈춤 · 실패 3번이면 멈춤 · 조달청 안 부르는 회차도 장부로는 채움 · tsrc 2
  ③ 빠른 수집(fast.py): 저장소 낙찰자 상세(tsrc 1) → 장부(법인만 · tsrc 2)
  ④ 화면 · 내보내기: bidresult tsrc 를 숫자 그대로 · 화면 글 «조달청 업체 정보» · 수집상태 «1순위 연락처» 줄
  ⑤ 키가 로그 · 장부 · 수집상태 글에 안 남음
가상 자료 · 가짜 응답만 씀(조달청 · 인터넷 안 부름).
"""
import importlib.util
import io
import json
import os
import sys
import tempfile
from contextlib import redirect_stdout
from datetime import datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
spec = importlib.util.spec_from_file_location("collect", os.path.join(ROOT, "collect.py"))
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)
sys.modules["collect"] = C
spec2 = importlib.util.spec_from_file_location("fast", os.path.join(ROOT, "fast.py"))
F = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(F)

bad = 0
KEY = "가짜키-ZZZ-0123456789"


def ok(이름, c, got=None):
    global bad
    if not c:
        bad += 1
    print(("  ✓ " if c else "  ✗ ") + 이름 + ("" if c or got is None else " = " + repr(got)[:300]))


class 응답:
    def __init__(self, body, status=200):
        self.status_code = status
        self.content = body.encode("utf-8") if isinstance(body, str) else body
        self.text = body if isinstance(body, str) else body.decode("utf-8", "replace")


def 제이슨(items, code="00", msg="NORMAL SERVICE."):
    return json.dumps({"response": {"header": {"resultCode": code, "resultMsg": msg},
                                    "body": {"items": items, "totalCount": len(items) if isinstance(items, list) else 1}}},
                      ensure_ascii=False)


def 업체(b, tel="02-123-4567", adrs="서울특별시 가상구 가상로 1", dtl="2층", hq="본사", nm="(주)가상건설"):
    return {"bizno": b, "corpNm": nm, "ceoNm": "가상", "adrs": adrs, "dtlAdrs": dtl, "telNo": tel, "hdoffceDivNm": hq}


def 부름(body, status=200, 기록=None):
    def get(url, params=None, **kw):
        if 기록 is not None:
            기록.append((url, dict(params or {})))
        if isinstance(body, Exception):
            raise body
        return 응답(body(params) if callable(body) else body, status)
    return get


B1, B2, B3, P1 = "1238112345", "2348701234", "3458654321", "1230112345"   # 법인 81 · 87 · 86 / 개인 01

print("① 응답 읽기")
기록 = []
꼴, 값 = C.corp_info_get(KEY, "123-81-12345", get=부름(제이슨([업체(B1)]), 기록=기록))
ok("정상 → ok · 전화 · 주소(주소 + 상세) · 이름", 꼴 == "ok" and 값 == {"t": "02-123-4567", "a": "서울특별시 가상구 가상로 1 2층", "n": "(주)가상건설"}, (꼴, 값))
u, p = 기록[0]
ok("주소 = …/1230000/ao/UsrInfoService02/getPrcrmntCorpBasicInfo02 · https", u == "https://apis.data.go.kr/1230000/ao/UsrInfoService02/getPrcrmntCorpBasicInfo02", u)
ok("물음 칸 inqryDiv=3 · bizno 숫자만 · type=json", p.get("inqryDiv") == "3" and p.get("bizno") == B1 and p.get("type") == "json" and p.get("serviceKey") == KEY, p)
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨({"item": [업체(B1, tel="031-111-2222", hq="지사"), 업체(B1, tel="02-999-8888", hq="본사")]})))
ok("여러 줄이면 본사 먼저(items.item 꼴도)", 꼴 == "ok" and 값["t"] == "02-999-8888", (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([업체(B2)])))
ok("응답 사업자번호가 다르면 안 씀(none)", 꼴 == "none" and 값 is None, (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨({"item": 업체(B1)})))
ok("items.item 이 하나(dict)여도 읽음", 꼴 == "ok", (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([업체(B1, tel="-", adrs="", dtl="")])))
ok("전화 «-» · 주소 빔 → none", 꼴 == "none", (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([업체(B1, tel="0")])))
ok("전화 «0» 은 버리고 주소만", 꼴 == "ok" and 값["t"] == "" and 값["a"], (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([업체(B1, tel="(02)123-4567 ")])))
ok("전화 괄호 · 빈칸은 떼고 숫자 · 붙임표만", 꼴 == "ok" and 값["t"] == "02123-4567", (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([])))
ok("빈 목록 → none", 꼴 == "none", (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([], code="03", msg="NODATA_ERROR")))
ok("응답코드 03(자료 없음) → none", 꼴 == "none", (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([], code="30", msg="SERVICE_KEY_IS_NOT_REGISTERED_ERROR")))
ok("응답코드 30(키 등록 안 됨) → 막힘", 꼴 == "막힘" and "30" in 값, (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([], code="20", msg="SERVICE_ACCESS_DENIED_ERROR")))
ok("응답코드 20(서비스 접근 거부 = 활용신청 안 됨) → 막힘", 꼴 == "막힘", (꼴, 값))
xml = ("<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg>"
       "<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><returnReasonCode>30</returnReasonCode>"
       "</cmmMsgHeader></OpenAPI_ServiceResponse>")
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(xml))
ok("XML 봉투(returnReasonCode 30) → 막힘", 꼴 == "막힘", (꼴, 값))
for sc in (401, 403):
    꼴, 값 = C.corp_info_get(KEY, B1, get=부름("Unauthorized", status=sc))
    ok("HTTP %d → 막힘" % sc, 꼴 == "막힘", (꼴, 값))
xml22 = xml.replace("SERVICE_KEY_IS_NOT_REGISTERED_ERROR", "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR").replace(">30<", ">22<")
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(xml22))
ok("XML 봉투(22 한도) → 한도", 꼴 == "한도", (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([], code="22", msg="LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR")))
ok("응답코드 22 → 한도", 꼴 == "한도", (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름("<!DOCTYPE html><html><head><title>시스템 점검 안내</title></head><body>점검 중입니다</body></html>"))
ok("자료 대신 웹페이지(점검) → 실패(막힘 아님)", 꼴 == "실패" and "웹페이지" in 값, (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(ConnectionError("x")))
ok("통신 오류 → 실패", 꼴 == "실패", (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름("", status=500))
ok("HTTP 500 → 실패", 꼴 == "실패" and "500" in 값, (꼴, 값))
꼴, 값 = C.corp_info_get(KEY, B1, get=부름(제이슨([], code="11", msg="NO_MANDATORY_REQUEST_PARAMETERS_ERROR")))
ok("필수값 빠짐(11) → 실패(멈춰 알림 · 막힘 아님)", 꼴 == "실패" and "11" in 값, (꼴, 값))

print("② 채우기")
NOW = datetime(2026, 11, 3, 10, 0, tzinfo=C.KST)


def 저장소():
    return {"con": {
        "N1": {"no": "N1", "dt": "2026-11-02 11:00:00", "win": "(주)가상일", "bno": B1},
        "N2": {"no": "N2", "dt": "2026-11-01 11:00:00", "win": "가상이(주)", "bno": B2},
        "N3": {"no": "N3", "dt": "2026-10-30 11:00:00", "win": "가상삼 주식회사", "bno": B3},
        "N4": {"no": "N4", "dt": "2026-11-02 15:00:00", "win": "가상개인", "bno": P1},                       # 개인 — 안 물음
        "N5": {"no": "N5", "dt": "2026-11-02 16:00:00", "win": "(주)가상일", "bno": B1},                    # 같은 업체 두 번째 — 한 번만 물음
        "N6": {"no": "N6", "dt": "2026-10-01 11:00:00", "win": "(주)있음", "bno": "5558112345",
               "tel": "051-000-0000", "adr": "부산광역시 가상"},                                            # 이미 있음 — 안 건드림
        "N7": {"no": "N7", "dt": "2026-11-02 09:00:00", "win": "", "bno": "6668112345"},                   # 1순위 없음(유찰 등)
    }}


def 가짜(맵):
    """사업자번호 → 응답 글"""
    return lambda params: 맵.get(params.get("bizno"), 제이슨([]))


with tempfile.TemporaryDirectory() as d:
    L = os.path.join(d, "corp_info.json")
    fs = 저장소()
    기록 = []
    맵 = {B1: 제이슨([업체(B1, tel="02-111-1111")]), B2: 제이슨([업체(B2, tel="031-222-2222")]), B3: 제이슨([])}
    buf = io.StringIO()
    with redirect_stdout(buf):
        res = C.fill_contacts_api(fs, KEY, ledger_path=L, get=부름(가짜(맵), 기록=기록), now=NOW, sleep_s=0)
    로그 = buf.getvalue()
    물은 = [p["bizno"] for _, p in 기록]
    ok("법인만 · 한 업체 한 번 · 최신 개찰부터(N5 16시 B1 → N2 B2 → N3 B3)", 물은 == [B1, B2, B3], 물은)
    c = fs["con"]
    ok("같은 업체 두 공고 다 채움 · tsrc 2", c["N1"].get("tel") == "02-111-1111" and c["N5"].get("tel") == "02-111-1111" and c["N1"].get("tsrc") == 2 and c["N5"].get("tsrc") == 2, (c["N1"], c["N5"]))
    ok("주소도 채움", c["N2"].get("adr") == "서울특별시 가상구 가상로 1 2층" and c["N2"].get("tsrc") == 2, c["N2"])
    ok("등록 정보에 없는 업체는 빈칸 그대로(지어내지 않음)", not c["N3"].get("tel") and not c["N3"].get("adr") and not c["N3"].get("tsrc"), c["N3"])
    ok("개인사업자는 안 물음 · 안 채움(G343 법인만)", not c["N4"].get("tel") and P1 not in 물은, c["N4"])
    ok("이미 있는 연락처는 안 건드림(tsrc 없음)", c["N6"]["tel"] == "051-000-0000" and "tsrc" not in c["N6"], c["N6"])
    ok("1순위 없는 줄은 안 봄", "6668112345" not in 물은)
    ok("돌려줌: 채움 3 · 물음 3 · 찾음 2 · 남음 1 · 정상", res["채움"] == 3 and res["물음"] == 3 and res["찾음"] == 2 and res["남음"] == 1 and res["상태"] == "정상", res)
    led = json.load(open(L, encoding="utf-8"))
    ok("장부: 찾은 것 [전화, 주소, 날, 1] · 없는 것 [.., 0] · 오늘 셈", led["c"][B1] == ["02-111-1111", "서울특별시 가상구 가상로 1 2층", "20261103", 1]
       and led["c"][B3] == ["", "", "20261103", 0] and led["d"] == {"day": "20261103", "n": 3}, led)
    ok("수집상태 글 «정상 … 채운 1순위 3건 · 아직 빈칸(법인) 1건»", "정상" in C.CORP_INFO_NOTE and "채운 1순위 3건" in C.CORP_INFO_NOTE and "아직 빈칸(법인) 1건" in C.CORP_INFO_NOTE, C.CORP_INFO_NOTE)
    ok("키가 로그 · 장부 · 수집상태 글에 없음", KEY not in 로그 and KEY not in open(L, encoding="utf-8").read() and KEY not in C.CORP_INFO_NOTE)

    # 다음 회차 — 장부로 바로 채우고 다시 안 물음
    fs2 = 저장소()
    기록2 = []
    with redirect_stdout(io.StringIO()):
        res2 = C.fill_contacts_api(fs2, KEY, ledger_path=L, get=부름(가짜(맵), 기록=기록2), now=NOW + timedelta(hours=1), sleep_s=0)
    ok("다음 회차: 장부로 채움 · 아무도 다시 안 물음(없음도 30일 안)", res2["채움"] == 3 and not 기록2, (res2, 기록2))
    # 31일 뒤 — 없던 것만 다시 물음
    기록3 = []
    with redirect_stdout(io.StringIO()):
        C.fill_contacts_api(저장소(), KEY, ledger_path=L, get=부름(가짜(맵), 기록=기록3), now=NOW + timedelta(days=31), sleep_s=0)
    ok("31일 뒤: 등록 정보에 없던 업체만 다시 물음", [p["bizno"] for _, p in 기록3] == [B3], 기록3)
    # 366일 뒤 — 찾은 것도 다시 물음(값은 그동안 장부로 채움)
    기록4 = []
    fs4 = 저장소()
    with redirect_stdout(io.StringIO()):
        C.fill_contacts_api(fs4, KEY, ledger_path=L, get=부름(가짜({}), 기록=기록4), now=NOW + timedelta(days=366), sleep_s=0)
    ok("1년 뒤: 찾았던 업체도 다시 물음", sorted(p["bizno"] for _, p in 기록4) == sorted([B1, B2, B3]), 기록4)
    ok("1년 뒤 다시 물어 «없음» 이 와도 그 회차 앞에서 장부 값으로 이미 채움", fs4["con"]["N1"].get("tel") == "02-111-1111", fs4["con"]["N1"])
    # 3년 지난 장부 줄은 버림
    json.dump({"v": 1, "c": {"9998112345": ["02-1", "옛", "20231101", 1], B1: ["02-111-1111", "가", "20261101", 1]}, "d": {}},
              open(L, "w", encoding="utf-8"))
    with redirect_stdout(io.StringIO()):
        C.fill_contacts_api({"con": {}}, KEY, ledger_path=L, get=부름(가짜({})), now=NOW, sleep_s=0)
    led = json.load(open(L, encoding="utf-8"))
    ok("3년 지난 장부 줄 버림 · 최근 것은 남김", "9998112345" not in led["c"] and B1 in led["c"], led["c"])

with tempfile.TemporaryDirectory() as d:
    L = os.path.join(d, "corp_info.json")
    # 막힘 — 첫 호출에서 멈춤
    기록 = []
    with redirect_stdout(io.StringIO()):
        res = C.fill_contacts_api(저장소(), KEY, ledger_path=L, now=NOW, sleep_s=0,
                                  get=부름(제이슨([], code="30", msg="SERVICE_KEY_IS_NOT_REGISTERED_ERROR"), 기록=기록))
    ok("활용신청 안 됨: 한 번만 묻고 멈춤", len(기록) == 1 and res["상태"] == "막힘", (len(기록), res))
    ok("수집상태 글 «활용신청 필요» · 서비스 이름", "활용신청 필요" in C.CORP_INFO_NOTE and "사용자정보 서비스" in C.CORP_INFO_NOTE, C.CORP_INFO_NOTE)
    ok("막힌 업체는 장부에 «없음» 으로 안 적음(승인되면 바로 다시 물음)", B1 not in json.load(open(L, encoding="utf-8"))["c"])
    # 한도 — 멈춤
    기록 = []
    with redirect_stdout(io.StringIO()):
        res = C.fill_contacts_api(저장소(), KEY, ledger_path=L, now=NOW, sleep_s=0,
                                  get=부름(제이슨([], code="22", msg="LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR"), 기록=기록))
    ok("한도(22): 한 번 묻고 멈춤 · 다른 조달청 호출의 QUOTA_OUT 은 안 건드림", len(기록) == 1 and res["상태"] == "한도" and C.QUOTA_OUT is False, (len(기록), res, C.QUOTA_OUT))
    # 실패 3번 — 멈춤
    기록 = []
    with redirect_stdout(io.StringIO()):
        res = C.fill_contacts_api(저장소(), KEY, ledger_path=L, now=NOW, sleep_s=0, get=부름(ConnectionError("x"), 기록=기록))
    ok("통신 실패 3번이면 멈춤", len(기록) == 3 and res["상태"] == "실패", (len(기록), res))
    # 회차 상한
    def 여럿():
        return {"con": {("M%d" % i): {"no": "M%d" % i, "dt": "2026-11-02 %02d:00:00" % (i % 24), "win": "가상", "bno": "%03d81%05d" % (100 + i, i)} for i in range(40)}}
    기록 = []
    with redirect_stdout(io.StringIO()):
        res = C.fill_contacts_api(여럿(), KEY, ledger_path=L, now=NOW, sleep_s=0, run_cap=7, get=부름(lambda p: 제이슨([업체(p["bizno"])]), 기록=기록))
    ok("회차 상한 7 → 7곳만 물음 · 7건 채움", len(기록) == 7 and res["채움"] == 7, (len(기록), res))
    # 하루 상한(이미 오늘 셈이 상한)
    led = json.load(open(L, encoding="utf-8"))
    led["d"] = {"day": "20261103", "n": 5000}
    json.dump(led, open(L, "w", encoding="utf-8"))
    기록 = []
    with redirect_stdout(io.StringIO()):
        res = C.fill_contacts_api(여럿(), KEY, ledger_path=L, now=NOW, sleep_s=0, get=부름(lambda p: 제이슨([업체(p["bizno"])]), 기록=기록))
    ok("하루 상한에 닿으면 안 물음 · 장부로는 채움(7건)", not 기록 and res["상태"] == "하루상한" and res["채움"] == 7, (기록, res))
    # 날이 바뀌면 다시 셈
    기록 = []
    with redirect_stdout(io.StringIO()):
        res = C.fill_contacts_api(여럿(), KEY, ledger_path=L, now=NOW + timedelta(days=1), sleep_s=0, run_cap=3, get=부름(lambda p: 제이슨([업체(p["bizno"])]), 기록=기록))
    ok("다음 날은 셈을 0 부터 — 다시 물음", len(기록) == 3, len(기록))
    # 조달청을 안 부르는 회차(--exportonly · 차단기) — 장부로만
    C.NET_DOWN = True
    기록 = []
    with redirect_stdout(io.StringIO()):
        res = C.fill_contacts_api(여럿(), KEY, ledger_path=L, now=NOW + timedelta(days=1), sleep_s=0, get=부름(lambda p: 제이슨([업체(p["bizno"])]), 기록=기록))
    C.NET_DOWN = False
    ok("차단기 회차: 안 물음 · 장부로 10건 채움 · 상태 건너뜀", not 기록 and res["채움"] == 10 and res["상태"] == "건너뜀", (기록, res))
    # 키 없음
    기록 = []
    with redirect_stdout(io.StringIO()):
        res = C.fill_contacts_api(저장소(), "", ledger_path=L, now=NOW, sleep_s=0, get=부름(lambda p: 제이슨([]), 기록=기록))
    ok("키가 없으면 안 물음", not 기록 and res["상태"] == "건너뜀", res)
    # 장부가 깨져 있어도 죽지 않음
    open(L, "w", encoding="utf-8").write("{깨짐")
    with redirect_stdout(io.StringIO()):
        res = C.fill_contacts_api(저장소(), KEY, ledger_path=L, now=NOW, sleep_s=0, get=부름(가짜({B1: 제이슨([업체(B1)])})))
    ok("깨진 장부 → 새로 시작", res["찾음"] == 1 and json.load(open(L, encoding="utf-8"))["c"][B1][3] == 1, res)

print("③ 빠른 수집(fast.py)")
st = {"con": {"A": {"no": "A", "dt": "2026-10-20 11:00:00", "bno": B1, "tel": "02-777-7777", "adr": "가상 주소"},
              "B": {"no": "B", "dt": "2026-10-25 11:00:00", "bno": B1, "tel": "02-888-8888", "adr": "새 주소"},
              "P": {"no": "P", "dt": "2026-10-25 11:00:00", "bno": P1, "tel": "010-1234-5678", "adr": "개인 주소"}}}
tb = F.contact_book(st)
ok("저장소 장부: 같은 업체는 가장 최근 개찰 값", tb[B1] == ("202610251100", "02-888-8888", "새 주소") or tb[B1][1:] == ("02-888-8888", "새 주소"), tb.get(B1))
rows = [{"no": "X1", "bno": B1}, {"no": "X2", "bno": B2}, {"no": "X3", "bno": P1}, {"no": "X4", "bno": "4448112345", "tel": "02-1"}, {"no": "X5", "bno": "1110112345"}]
ci = {B2: ["031-222-2222", "경기 가상", "20261102", 1], "1110112345": ["02-3", "개인 장부", "20261102", 1]}
n = F.enrich_contacts(rows, tb, ci)
ok("① 낙찰자 상세(tsrc 1)", rows[0].get("tel") == "02-888-8888" and rows[0].get("tsrc") == 1, rows[0])
ok("② 업체 정보 장부(법인 · tsrc 2)", rows[1].get("tel") == "031-222-2222" and rows[1].get("tsrc") == 2, rows[1])
ok("개인은 저장소 낙찰자 상세로만(정기 수집과 같음)", rows[2].get("tel") == "010-1234-5678" and rows[2].get("tsrc") == 1, rows[2])
ok("이미 있는 줄은 그대로 · 장부에 개인이 있어도 안 씀", rows[3]["tel"] == "02-1" and "tsrc" not in rows[3] and not rows[4].get("tel"), (rows[3], rows[4]))
ok("채운 수 3", n == 3, n)
ok("장부 없어도(None) 죽지 않음", F.enrich_contacts([{"no": "Z", "bno": B2}], None, None) == 0)
src_fast = open(os.path.join(ROOT, "fast.py"), encoding="utf-8").read()
ok("fast.py once() 가 새 1순위에 연락처를 붙임(넘어져도 싣기는 그대로)", "nc = enrich_contacts(fr, ctx.get(\"tbook\"), ctx.get(\"cinfo\"))" in src_fast and "연락처 없이 싣습니다" in src_fast)

print("④ 내보내기 · 화면 · 수집상태 · 워크플로")
src = open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read()
ok("bidresult tsrc 는 숫자 그대로(2 가 1 로 뭉개지지 않게)", 'int(r.get("tsrc") or 0),' in src and '1 if r.get("tsrc") else 0' not in src)
ok("main: «다른 공고에서» 다음에 업체 정보로 채움", src.index("fill_contacts(first)") < src.index("fill_contacts_api(first, key)"))
ok("수집상태.md 에 «1순위 연락처» 줄", '"| 1순위 연락처 | %s |" % (CORP_INFO_NOTE or "—")' in src)
nd = open(os.path.join(ROOT, "web", "src", "NoticeDetail.jsx"), encoding="utf-8").read()
bb = open(os.path.join(ROOT, "web", "src", "pages", "BaroBid.jsx"), encoding="utf-8").read()
ok("화면 글: tsrc 2 = «조달청 업체 정보» (1순위 카드 두 곳 · 바로투찰 채점)", nd.count("r.tsrc === 2 ? '조달청 업체 정보' : '다른 공고에서 확인'") == 2 and "res.tsrc === 2 ? '조달청 업체 정보'" in bb)
ok("빈칸 글: 개인사업자 까닭", "개인사업자는 조달청이 낙찰자 정보로 줄 때만 보입니다." in nd)
up = open(os.path.join(ROOT, ".github", "workflows", "update.yml"), encoding="utf-8").read()
fa = open(os.path.join(ROOT, ".github", "workflows", "fast.yml"), encoding="utf-8").read()
ok("update.yml: 장부를 cinfo- 로 따로 보관(lite- path 는 그대로)", "path: data/store/corp_info.json" in up and "key: cinfo-${{ github.run_id }}" in up)
ok("fast.yml: cinfo- 를 읽기만 · 실패해도 계속", "restore-keys: cinfo-" in fa and "path: data/store/corp_info.json" in fa)

print()
print("✓ 모두 맞음" if not bad else "✗ %d개 틀림" % bad)
sys.exit(1 if bad else 0)
