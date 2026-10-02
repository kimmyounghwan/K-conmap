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
M.requests.post, M.requests.get, M.requests.put = 가짜post, 가짜get, 가짜put
M.토큰 = lambda sa: "tok"
ctx = {"sa": {}}
M.한번(ctx)
봄("조회수가 고장 나도 지도는 넣음", [u for u, _ in 보낸] == [M.DB + "/fresh/map.json"], [u for u, _ in 보낸])
봄("조회수 고장 — 10분 뒤 다시", 0 < M.조회틈 - (__import__("time").time() - ctx["pv_t"]) <= 10 * 60 + 1)
def 가짜post2(url, **k):
    if "runReport" in url and "Realtime" not in url:
        import json as _j
        b = _j.loads(k["data"])
        봄("조회수 요청 — 2026-09-15 ~ today · hostName·pagePath · screenPageViews",
          b["dateRanges"] == [{"startDate": "2026-09-15", "endDate": "today"}] and [d["name"] for d in b["dimensions"]] == ["hostName", "pagePath"] and b["metrics"] == [{"name": "screenPageViews"}])
        return 답(200, {"rows": [줄("k-conmap.com", "/tools/rebar-weight", 8), 줄("k-conmap.com", "/jeoksan/fill", 45)]})
    return 가짜post(url, **k)
M.requests.post = 가짜post2
보낸.clear(); ctx = {"sa": {}}
M.한번(ctx)
import json as _j
pv = [_j.loads(d.decode("utf-8")) for u, d in 보낸 if u.endswith("/fresh/pv.json")]
봄("조회수 넣음 — fresh/pv = {at, from, p}", len(pv) == 1 and pv[0]["p"] == {"|tools|rebar-weight": 8, "|jeoksan|fill": 45} and pv[0]["from"] == "2026-09-15" and isinstance(pv[0]["at"], int), pv[:1])
봄("지도도 넣음", any(u.endswith("/fresh/map.json") for u, _ in 보낸))
보낸.clear()
M.한번(ctx)
봄("30분 안 다음 회차 — 조회수는 안 넣음(지도만)", [u for u, _ in 보낸] == [M.DB + "/fresh/map.json"], [u for u, _ in 보낸])

print("✓ 모두 맞음" if not 틀림 else f"✗ {틀림}개 틀림")
sys.exit(1 if 틀림 else 0)
