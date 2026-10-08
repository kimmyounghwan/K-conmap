# -*- coding: utf-8 -*-
"""🗺 이용자 지도 시험 — python tools/시험_이용자지도.py (인터넷 · 비밀값 없이)
  합치기(옛 fresh/map + 이번 도시들): 크기 1·2·3 · 오늘 다녀간 곳 더하기 · 날이 바뀌면 새로 · 빈 것은 None"""
import importlib.util, os, sys
from datetime import datetime, timedelta, timezone
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
여기 = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("지도", os.path.join(여기, "이용자지도.py"))
M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
틀림 = 0
def 봄(이름, 참, 더=""):
    global 틀림
    if not 참: 틀림 += 1
    print(("  ✓ " if 참 else "  ✗ ") + 이름 + ((" — " + str(더)) if 더 else ""))
KST = timezone(timedelta(hours=9))
t = datetime(2026, 10, 2, 10, 30, tzinfo=KST)
새 = M.합치기(None, {"Anyang-si": 1, "Seoul": 3, "Gwangju": 7}, t)
봄("크기 1 · 2 · 3", 새["now"] == {"Anyang-si": 1, "Seoul": 2, "Gwangju": 3}, 새["now"])
봄("오늘 날짜 · 오늘 다녀간 곳", 새["day"]["d"] == "2026-10-02" and set(새["day"]["c"]) == {"Anyang-si", "Seoul", "Gwangju"})
두 = M.합치기(새, {"Yeosu-si": 1}, t + timedelta(minutes=10))
봄("다음 회차 — 지금은 그 회차 것만 · 오늘은 더함", 두["now"] == {"Yeosu-si": 1} and set(두["day"]["c"]) == {"Anyang-si", "Seoul", "Gwangju", "Yeosu-si"})
빈 = M.합치기(두, {}, t + timedelta(minutes=20))
봄("아무도 없으면 now 는 None(지움) · 오늘은 그대로", 빈["now"] is None and len(빈["day"]["c"]) == 4)
밤 = M.합치기(두, {"Busan": 1}, datetime(2026, 10, 3, 0, 5, tzinfo=KST))
봄("자정 넘으면 오늘을 새로", 밤["day"] == {"d": "2026-10-03", "c": {"Busan": 1}}, 밤["day"])
봄("at 은 ms", 새["at"] == int(t.timestamp() * 1000))
봄("데이터베이스 열쇠에 못 쓰는 글자(. # $ [ ] /) 바꿈", "St. Louis/x".translate(M.나쁜글자) == "St_ Louis_x")

# ── 👁 화면 조회수 (G119) ──
# 화면열쇠 — web/src/lib/받은수.jsx 와 같은 답(그쪽 화면열쇠를 같은 주소로 돌려 적어 둔 답 · 바뀌면 둘 다 고칠 것)
주소답 = [
    ("/", "|"), ("", "|"), ("/tools", "|tools"), ("/tools/", "|tools"), ("/tools/rebar-weight", "|tools|rebar-weight"),
    ("/tools/tuipbi/v/abc/def", "|tools|tuipbi"), ("/forms/o-sajindaeji", "|forms|o-sajindaeji"), ("/forms/orig/x", "|forms|orig"),
    ("/corp/국토건설", "|corp"), ("/corp/%EA%B5%AD%ED%86%A0", "|corp"), ("/agency/조달청 서울지방조달청", "|agency"),
    ("/notice/R26BK01726752", "|notice"), ("/qna/-P2vCUv665xH_5zFrBr6", "|qna"), ("/jeoksan/fill", "|jeoksan|fill"), ("/jeoksan", "|jeoksan"),
    ("/naeyeok/ratio", "|naeyeok|ratio"), ("/change/naeyeok/공내역서", "|change|naeyeok"), ("/change/naeyeok/%EA%B3%B5", "|change|naeyeok"),
    ("/cad/kl", "|cad|kl"), ("/daily/2026-09-23", "|daily"), ("/guide/bid-price", "|guide"), ("/없는주소-시험", "|없는주소-시험"),
    ("/a.b/c", "|a,b"), ("/tools/x.y", "|tools|x,y"), ("/tools/a#b", "|tools|a"), ("/tools/a?q=1", "|tools|a"),
    ("/forms/$x[1]", "|forms|_x_1_"), ("/corp/(주)강원랜드", "|corp"), ("//tools//dxf3d//", "|tools|dxf3d"),
]
틀린주소 = [(a, M.화면열쇠(a), b) for a, b in 주소답 if M.화면열쇠(a) != b]
봄("화면열쇠 — 받은수.jsx 와 같은 답 %d가지" % len(주소답), not 틀린주소, 틀린주소[:3])
줄 = lambda h, p, n: {"dimensionValues": [{"value": h}, {"value": p}], "metricValues": [{"value": str(n)}]}
묶음 = M.조회묶기([줄("k-conmap.com", "/tools/rebar-weight", 8), 줄("www.k-conmap.com", "/tools/rebar-weight", 2),
                  줄("k-conmap.com", "/tools/tuipbi/v/현장/링크", 2), 줄("k-conmap.com", "/tools/tuipbi", 25),
                  줄("localhost", "/tools/rebar-weight", 99), 줄("127.0.0.1", "/tools", 99), 줄("(not set)", "/tools", 99),
                  줄("k-conmap.com", "(not set)", 50), 줄("k-conmap.com", "/corp/국토건설", 17), 줄("k-conmap.com", "/corp/대유건설", 13),
                  줄("k-conmap.com", "/", 1574), 줄("k-conmap.com", "/forms/wonga", 0), 줄("k-conmap.com", "/forms/wonga", "x"),
                  줄("k-conmap.com", "/없는주소-시험", 1), 줄("k-conmap.com", "/tools/아무거나", 3), 줄("k-conmap.com", "/Tools/x", 2),
                  줄("k-conmap.com", "/change/naeyeok/공내역서", 4), 줄("k-conmap.com", "/forms/o-sajindaeji", 24), 줄("k-conmap.com", "/tools/x.y", 1)])
봄("조회 묶기 — 같은 화면 더함 · 현장 링크는 화면으로 · 내 컴퓨터(localhost) · 빈 주소 · 0 · 사이트 꼴이 아닌 주소는 뺌",
  묶음 == {"|tools|rebar-weight": 10, "|tools|tuipbi": 27, "|corp": 30, "|": 1574, "|change|naeyeok": 4, "|forms|o-sajindaeji": 24, "|tools|x,y": 1}, 묶음)
# 사이트 카드가 가리키는 화면은 모두 «꼴» 에 맞아야 함(맞지 않으면 그 카드 조회가 늘 0)
import json as _json, re as _re
카드주소 = set()
def _걷기(o):
    if isinstance(o, dict):
        if isinstance(o.get("to"), str) and o["to"].startswith("/"): 카드주소.add(o["to"])
        for v in o.values(): _걷기(v)
    elif isinstance(o, list):
        for v in o: _걷기(v)
_걷기(_json.load(open(os.path.join(여기, "..", "web", "src", "data", "tools.json"), encoding="utf-8")))
for 쪽 in ("Jeoksan.jsx", "Naeyeok.jsx"):
    카드주소 |= set(_re.findall(r"to: '(/[^']+)'", open(os.path.join(여기, "..", "web", "src", "pages", 쪽), encoding="utf-8").read()))
for 이름 in ("forms.json", "forms_orig.json"):
    _d = _json.load(open(os.path.join(여기, "..", "web", "src", "data", 이름), encoding="utf-8"))
    for f in (_d.get("forms") if isinstance(_d, dict) else _d) or []:
        if isinstance(f, dict) and f.get("slug"): 카드주소.add("/forms/" + f["slug"])
안맞음 = sorted(a for a in 카드주소 if not M.열쇠모양.match(M.화면열쇠(a)))
봄("카드 화면 %d곳 — 모두 열쇠 꼴에 맞음" % len(카드주소), len(카드주소) > 150 and not 안맞음, 안맞음[:5])

# 조회수가 안 돼도 지도는 그대로(따로 실패) · 조회수는 10분 뒤 다시 · 되면 30분 뒤
class 답:
    def __init__(s, code, j=None, text=""):
        s.status_code, s._j, s.text = code, j, text
    def json(s):
        return s._j
보낸 = []
def 가짜post(url, **k):
    if "runRealtimeReport" in url:
        return 답(200, {"rows": [{"dimensionValues": [{"value": "South Korea"}, {"value": "Seoul"}], "metricValues": [{"value": "2"}]}]})
    return 답(500, None, "애널리틱스 고장")
def 가짜get(url, **k):
    return 답(200, None)
def 가짜put(url, **k):
    보낸.append((url, k.get("data")))
    return 답(200, {})
M.requests.post, M.requests.get, M.requests.put, M.requests.patch = 가짜post, 가짜get, 가짜put, 가짜put
M.토큰 = lambda sa: "tok"
ctx = {"sa": {}}
M.한번(ctx)
봄("조회수 · 지역이 고장 나도 지도는 넣음", [u for u, _ in 보낸] == [M.DB + "/fresh/map.json"], [u for u, _ in 보낸])
봄("조회수 고장 — 10분 뒤 다시", 0 < M.조회틈 - (__import__("time").time() - ctx["pv_t"]) <= 10 * 60 + 1)
def 가짜post2(url, **k):
    if "runReport" in url and "Realtime" not in url and "countryId" in k["data"]:
        return 답(200, {"rows": []})          # G144 지역 요청 — 아래에서 따로 시험
    if "runReport" in url and "Realtime" not in url:
        import json as _j
        b = _j.loads(k["data"])
        봄("조회수 요청 — 2026-09-15 ~ today · hostName·pagePath · screenPageViews",
          b["dateRanges"] == [{"startDate": "2026-09-15", "endDate": "today"}] and [d["name"] for d in b["dimensions"]] == ["hostName", "pagePath"] and b["metrics"] == [{"name": "screenPageViews"}])
        return 답(200, {"rows": [줄("k-conmap.com", "/tools/rebar-weight", 8), 줄("k-conmap.com", "/jeoksan/fill", 45),
                                 줄("k-conmap.com", "/notice/R26BK01726752", 10), 줄("k-conmap.com", "/corp/국토건설", 17)]})
    return 가짜post(url, **k)
M.requests.post = 가짜post2
보낸.clear(); ctx = {"sa": {}}
M.한번(ctx)
import json as _j
pa = [_j.loads(d.decode("utf-8")) for u, d in 보낸 if u.endswith("/fresh.json")]
pv = [x["pv"] for x in pa]
봄("조회수 넣음 — PATCH fresh 한 번 · pv = {at, from, p}", len(pv) == 1 and pv[0]["p"] == {"|tools|rebar-weight": 8, "|jeoksan|fill": 45, "|notice": 10, "|corp": 17} and pv[0]["from"] == "2026-09-15" and isinstance(pv[0]["at"], int), pv[:1])
봄("같은 PATCH 에 화면마다(pvp) · 공고마다(nv)", pa and pa[0]["pvp"] == {"|tools|rebar-weight": 8, "|jeoksan|fill": 45, "|corp|국토건설": 17} and pa[0]["nv"] == {"R26BK017": {"R26BK01726752": 10}}, pa[:1])
봄("지도도 넣음", any(u.endswith("/fresh/map.json") for u, _ in 보낸))
보낸.clear()
M.한번(ctx)
봄("30분 안 다음 회차 — 조회수는 안 넣음(지역 · 지도만)", [u for u, _ in 보낸] == [M.DB + "/fresh/reg.json", M.DB + "/fresh/map.json"], [u for u, _ in 보낸])


# ── 👁 화면마다 · 공고마다 (G121) — web/src/lib/조회수.jsx 와 같은 답 ──
전체답 = [["/", "|", None], ["", "|", None], ["/tools", "|tools", None], ["/tools/", "|tools", None], ["/tools/rebar-weight", "|tools|rebar-weight", None], ["/tools/tuipbi/v/abc/def", "|tools|tuipbi", None], ["/tools/tuipbi", "|tools|tuipbi", None], ["/forms/o-sajindaeji", "|forms|o-sajindaeji", None], ["/corp/국토건설", "|corp|국토건설", None], ["/corp/%EA%B5%AD%ED%86%A0", "|corp|국토", None], ["/agency/조달청 서울지방조달청", "|agency|조달청 서울지방조달청", None], ["/notice/R26BK01726752", None, "R26BK01726752"], ["/notice/R26BK01726752/x", None, None], ["/notice/a.b", None, None], ["/qna/-P2vCUv665xH_5zFrBr6", "|qna|-P2vCUv665xH_5zFrBr6", None], ["/jeoksan/fill", "|jeoksan|fill", None], ["/change/naeyeok/공내역서", "|change|naeyeok|공내역서", None], ["/change/naeyeok/%EA%B3%B5", "|change|naeyeok|공", None], ["/cad/kl", "|cad|kl", None], ["/daily/2026-09-23", "|daily|2026-09-23", None], ["/guide/bid-price", "|guide|bid-price", None], ["/없는주소-시험", None, None], ["/admin", None, None], ["/admin/x", None, None], ["/a.b/c", None, None], ["/tools/x.y", "|tools|x,y", None], ["/tools/a#b", "|tools|a", None], ["/tools/a?q=1", "|tools|a", None], ["/tools/%ZZ", "|tools|%ZZ", None], ["/forms/$x[1]", "|forms|_x_1_", None], ["/corp/(주)강원랜드", "|corp|(주)강원랜드", None], ["//tools//dxf3d//", "|tools|dxf3d", None], ["/about", "|about", None], ["/report/make", "|report|make", None], ["/a/b/c/d", None, None], ["/my", "|my", None], ["/my?x=1", "|my", None], ["/@대유", None, None], ["/%40대유", None, None], ["/pre", None, None], ["/corp/가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가", None, None], ["/tools/a/b/c", None, None]]
틀린전체 = [(a, M.전체열쇠(a), M.공고번호(a), b, c) for a, b, c in 전체답 if M.전체열쇠(a) != b or M.공고번호(a) != c]
봄("전체열쇠 · 공고번호 — 조회수.jsx 와 같은 답 %d가지" % len(전체답), not 틀린전체, 틀린전체[:3])
묶 = [줄("k-conmap.com", "/tools/tuipbi/v/현장/링크", 2), 줄("k-conmap.com", "/tools/tuipbi", 25), 줄("k-conmap.com", "/corp/국토건설", 17), 줄("k-conmap.com", "/corp/대유건설", 13),
      줄("k-conmap.com", "/admin", 35), 줄("k-conmap.com", "/notice/R26BK01726752", 10), 줄("k-conmap.com", "/notice/R26BK01737540", 10), 줄("k-conmap.com", "/notice/R26BK01698669", 3),
      줄("localhost", "/corp/국토건설", 99), 줄("k-conmap.com", "/없는주소-시험", 1), 줄("k-conmap.com", "/", 1574)]
봄("화면묶기 — 현장 링크는 /tools/tuipbi 로 · 관리자 · 없는 주소 · 내 컴퓨터 · 공고는 뺌", M.화면묶기(묶) == {"|tools|tuipbi": 27, "|corp|국토건설": 17, "|corp|대유건설": 13, "|": 1574}, M.화면묶기(묶))
봄("공고묶기 — 앞 8자로 묶음", M.공고묶기(묶) == {"R26BK017": {"R26BK01726752": 10, "R26BK01737540": 10}, "R26BK016": {"R26BK01698669": 3}}, M.공고묶기(묶))

# ── 🗺 G144 시·도별 누적 · 오늘 · 지금 전국 ──
봄("지금 전국 n — 받은 값 · 없으면 도시 합", M.합치기(None, {"Seoul": 3, "Busan": 2}, t, 4)["n"] == 4 and M.합치기(None, {"Seoul": 3, "Busan": 2}, t)["n"] == 5)
r3 = lambda c, g, dr, n: {"dimensionValues": [{"value": c}, {"value": g}, {"value": dr}], "metricValues": [{"value": str(n)}]}
지 = M.지역묶기([r3("KR", "Seoul", "a", 120), r3("KR", "Seoul", "t", 7), r3("KR", "Jeollanam-do", "a", 33), r3("KR", "(not set)", "a", 4),
                r3("US", "California", "a", 9), r3("KR", "Busan", "t", 0), r3("KR", "Busan", "a", 15), r3("KR", "St.X", "a", 1), r3("KR", "Daegu", "date_range_0", 5)])
봄("지역묶기 — KR 만 · 누적 a · 오늘 t · (not set)→notset · 0 · 모르는 날짜 이름 뺌 · 열쇠 글자 바꿈",
  지 == {"Seoul": {"a": 120, "t": 7}, "Jeollanam-do": {"a": 33}, "notset": {"a": 4}, "Busan": {"a": 15}, "St_X": {"a": 1}}, 지)
r2 = lambda c, dr, n: {"dimensionValues": [{"value": c}, {"value": dr}], "metricValues": [{"value": str(n)}]}
봄("전국묶기 — KR 누적 · 오늘", M.전국묶기([r2("KR", "a", 170), r2("KR", "t", 9), r2("US", "a", 3)]) == {"a": 170, "t": 9})
봄("전국묶기 — 어제 y (G172)", M.전국묶기([r2("KR", "a", 170), r2("KR", "t", 9), r2("KR", "y", 21), r2("US", "y", 4), r2("KR", "z", 5)]) == {"a": 170, "t": 9, "y": 21})
본몸 = []
def 가짜post3(url, **k):
    if "runRealtimeReport" in url:
        b = _j.loads(k["data"])
        if [d["name"] for d in b["dimensions"]] == ["country"]:
            return 답(200, {"rows": [{"dimensionValues": [{"value": "South Korea"}], "metricValues": [{"value": "3"}]}]})
        return 답(200, {"rows": [{"dimensionValues": [{"value": "South Korea"}, {"value": "Seoul"}], "metricValues": [{"value": "2"}]}]})
    b = _j.loads(k["data"]); 본몸.append(b)
    if [d["name"] for d in b["dimensions"]] == ["countryId", "region"]:
        return 답(200, {"rows": [r3("KR", "Seoul", "a", 120), r3("KR", "Seoul", "t", 7)]})
    if [d["name"] for d in b["dimensions"]] == ["countryId"]:
        return 답(200, {"rows": [r2("KR", "a", 150), r2("KR", "t", 8), r2("KR", "y", 13)]})
    return 답(200, {"rows": []})
M.requests.post = 가짜post3
보낸.clear(); ctx = {"sa": {}, "pv_t": __import__("time").time()}
M.한번(ctx)
reg = [_j.loads(d.decode("utf-8")) for u, d in 보낸 if u.endswith("/fresh/reg.json")]
mp = [_j.loads(d.decode("utf-8")) for u, d in 보낸 if u.endswith("/fresh/map.json")]
지요청 = [b for b in 본몸 if b["dimensions"][0]["name"] == "countryId"]
_at = [{"startDate": "2026-09-15", "endDate": "today", "name": "a"}, {"startDate": "today", "endDate": "today", "name": "t"}]
_y = [{"startDate": "yesterday", "endDate": "yesterday", "name": "y"}]
봄("지역 요청 — 9/15~today(a) · today(t) · activeUsers · KR 거르기 · 전국에만 어제(y · G172)",
  len(지요청) == 2 and all(b["dateRanges"] == (_at if len(b["dimensions"]) == 2 else _at + _y)
                          and b["metrics"] == [{"name": "activeUsers"}] and b["dimensionFilter"]["filter"]["stringFilter"]["value"] == "KR" for b in 지요청)
  and sorted(len(b["dimensions"]) for b in 지요청) == [1, 2], 지요청[:2])
봄("fresh/reg 넣음 — {at, from, d, kr, r}", len(reg) == 1 and reg[0]["kr"] == {"a": 150, "t": 8, "y": 13} and reg[0]["r"] == {"Seoul": {"a": 120, "t": 7}} and reg[0]["from"] == "2026-09-15" and len(reg[0]["d"]) == 10, reg[:1])
봄("fresh/map 에 지금 전국 n = 3", len(mp) == 1 and mp[0]["n"] == 3, mp[:1])
print("✓ 모두 맞음" if not 틀림 else f"✗ {틀림}개 틀림")
sys.exit(1 if 틀림 else 0)
