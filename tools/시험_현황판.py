# -*- coding: utf-8 -*-
"""🗺 G756 공사 현황판 자료 시험 — 현황판.py (2026-11-17)
  ① 곳 표: 한국지도.json 161곳 · 광역 8 한 곳
  ② 자리: 공사현장 → 기관 → 공고명 · 같은 이름 다른 시도(고성 · 광주) · 긴 이름 먼저(남양주 · 양주) · 전남광주 통합 표기
  ③ 단계: 마감 전 = 입찰 중 · 마감 14일 안 · 1순위 없음 = 개찰 대기 · 개찰 30일 안 1순위 = 곧 착공 · 취소 뺌 · 1순위가 이김 · 오래된 것 뺌
     · 면허 코드 = collect.lic_codes(공고 탭 «내 면허» 와 같은 코드)
  ④ 싣지 않는 것: 담당자 이름 · 전화 · 사업자번호 · 대표 이름
  ⑤ 파일: sum.json(셈 · 새 · 큰) · {시도}.json(줄 차례) · 다시 굽으면 옛 파일 지움
돌리기: python tools/시험_현황판.py"""
import os, sys, json, shutil, tempfile
from datetime import datetime, timedelta, timezone
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import 현황판 as H   # noqa: E402

KST = timezone(timedelta(hours=9))
n = bad = 0


def ok(m, c, more=""):
    global n, bad
    n += 1
    if not c:
        bad += 1
    print(("  ✓ " if c else "  ✗ ") + m + ("" if c else f" = {more}"))


바탕 = json.load(open(os.path.join(ROOT, "web", "src", "data", "한국지도.json"), encoding="utf-8"))
표, 한곳 = H.곳표만들기(바탕)
곳 = {g["k"]: g for g in 바탕["곳"]}
이름k = lambda d, n_: next((g["k"] for g in 바탕["곳"] if g["d"] == d and g["n"] == n_), None)   # noqa: E731

print("① 곳 표")
ok("161곳 · 광역(서울 · 부산 · 대구 · 인천 · 광주 · 대전 · 울산 · 세종) 8 한 곳", len(바탕["곳"]) == 161 and len(한곳) == 8, (len(바탕["곳"]), 한곳))
ok("시도마다 긴 이름 먼저(경기: 남양주가 양주보다 앞)", [x[0] for x in 표["경기"]].index("남양주") < [x[0] for x in 표["경기"]].index("양주"))

print("② 자리 찾기")
고성경남, 고성강원 = 이름k("경남", "고성군"), 이름k("강원", "고성군")
ok("경남 고성군 · 강원 고성군은 다른 곳", 고성경남 and 고성강원 and 고성경남 != 고성강원, (고성경남, 고성강원))
ok("공사현장 «경상남도 고성군» → 경남 고성군", H.자리찾기({"site": "경상남도 고성군"}, "경남", 표, 한곳) == 고성경남)
ok("공사현장 «강원특별자치도 고성군» → 강원 고성군", H.자리찾기({"site": "강원특별자치도 고성군"}, "강원", 표, 한곳) == 고성강원)
ok("«전남광주통합특별시 해남» → 해남군", H.자리찾기({"site": "전남광주통합특별시 해남"}, "전남", 표, 한곳) == 이름k("전남", "해남군"))
ok("현장 없으면 기관 «전라남도 나주시» → 나주시", H.자리찾기({"site": "", "inst": "전라남도 나주시"}, "전남", 표, 한곳) == 이름k("전남", "나주시"))
ok("기관도 없으면 공고명 «강진 ○○ 정비공사» → 강진군", H.자리찾기({"inst": "한국농어촌공사", "name": "강진 화방지구 정비공사"}, "전남", 표, 한곳) == 이름k("전남", "강진군"))
ok("경기 «광주시» 는 경기 광주시(광주광역시 아님)", H.자리찾기({"site": "경기도 광주시"}, "경기", 표, 한곳) == 이름k("경기", "광주시"))
ok("광주광역시는 시도만 알면 한 곳(29)", H.자리찾기({"site": "광주광역시 북구"}, "광주", 표, 한곳) == "29")
ok("«남양주» 는 양주시가 아니라 남양주시", H.자리찾기({"inst": "경기도 남양주시"}, "경기", 표, 한곳) == 이름k("경기", "남양주시"))
ok("시 · 군을 못 찾으면 ''(시도만)", H.자리찾기({"site": "경기도", "inst": "경기도교육청", "name": "학교 공사"}, "경기", 표, 한곳) == "")
ok("시도를 모르면 ''", H.자리찾기({"site": "전라남도 나주시"}, "", 표, 한곳) == "")

print("③ 단계 · ④ 싣지 않는 것")
지금 = datetime(2026, 11, 17, 12, 0, tzinfo=KST)
live = {
    "A": {"no": "A", "name": "나주 도로 공사", "inst": "전라남도 나주시", "site": "전라남도 나주시", "close": "2026-11-20 10:00:00", "openg": "2026-11-20 11:00:00",
          "dt": "2026-11-10 09:00:00", "base": 150000000, "budget": 160000000, "est": 140000000, "lic": ["토목공사업/0001"], "kind": "등록공고", "ofcl": "홍길동", "tel": "061-000-0000"},
    "B": {"no": "B", "name": "무안 배수 공사", "inst": "전라남도 무안군", "site": "전라남도 무안군", "close": "2026-11-10 10:00:00", "openg": "2026-11-10 11:00:00",
          "dt": "2026-11-01 09:00:00", "budget": 90000000, "lic": [], "kind": "등록공고"},
    "C": {"no": "C", "name": "오래된 공사", "inst": "전라남도 영광군", "site": "전라남도 영광군", "close": "2026-10-01 10:00:00", "dt": "2026-09-20 09:00:00", "kind": "등록공고"},
    "D": {"no": "D", "name": "취소된 공사", "inst": "전라남도 목포시", "site": "전라남도 목포시", "close": "2026-11-30 10:00:00", "dt": "2026-11-15 09:00:00", "kind": "취소공고"},
    "E": {"no": "E", "name": "경남 고성 공사", "inst": "고성군산림조합", "site": "경상남도 고성군", "close": "2026-11-12 10:00:00", "openg": "2026-11-12 11:00:00",
          "dt": "2026-11-05 09:00:00", "base": 3000000000, "lic": ["전기공사업/0037"], "kind": "등록공고"},
}
first = {
    "E": {"no": "E", "name": "경남 고성 공사", "inst": "고성군산림조합", "dt": "2026-11-12 11:00:00", "win": "(주)고성건설", "amt": 2700000000, "rate": 87.745, "np": 120,
          "bno": "1234567890", "ceo": "김대표", "tel": "055-000-0000", "corps": [["(주)고성건설", 1, 2, "123", "김대표"]]},
    "F": {"no": "F", "name": "오래된 개찰", "inst": "경상남도 진주시", "dt": "2026-09-01 11:00:00", "win": "x", "amt": 1},
}


def 시도(r, book=None):
    s = str(r.get("site") or r.get("inst") or "")
    return "전남" if s.startswith("전라남도") else "경남" if s.startswith("경상남도") or "고성" in s else ""


합, by = H.만들기(live, first, 바탕, 지금, sido_of=시도)
모두 = {x[0]: x for xs in by.values() for x in xs}
ok("A 마감 전 → 입찰 중(0)", 모두.get("A") and 모두["A"][2] == 0, 모두.get("A"))
ok("B 마감 7일 지남 · 1순위 없음 → 개찰 대기(1)", 모두.get("B") and 모두["B"][2] == 1, 모두.get("B"))
ok("C 마감 47일 지남 → 뺌 · D 취소 → 뺌 · F 개찰 77일 → 뺌", "C" not in 모두 and "D" not in 모두 and "F" not in 모두, list(모두))
ok("E 1순위 있음 → 곧 착공(2) · 1순위 금액 · 투찰률 · 참가 · 공고 줄의 현장 · 면허 이어 씀",
   모두.get("E") and 모두["E"][2] == 2 and 모두["E"][5] == 2700000000 and 모두["E"][8] == "(주)고성건설" and 모두["E"][9] == 87.745 and 모두["E"][10] == 120
   and 모두["E"][13] == "경상남도 고성군" and 모두["E"][11] == ["0037"], 모두.get("E"))
ok("E 공고일은 공고 줄 dt(1순위 dt 아님)", 모두["E"][14] == "2026-11-05 09:00", 모두["E"][14])
ok("A 금액 = 기초금액(base) · 기초 칸", 모두["A"][5] == 150000000 and 모두["A"][15] == 150000000)
ok("B 기초금액 없으면 배정예산(budget)", 모두["B"][5] == 90000000 and 모두["B"][15] is None, 모두["B"])
ok("자리: A 나주시 · B 무안군 · E 경남 고성군", 모두["A"][1] == 이름k("전남", "나주시") and 모두["B"][1] == 이름k("전남", "무안군") and 모두["E"][1] == 고성경남)
글 = json.dumps([합, by], ensure_ascii=False)
ok("담당자 이름 · 전화 · 사업자번호 · 대표 이름이 없음", all(x not in 글 for x in ("홍길동", "061-000-0000", "1234567890", "김대표", "055-000-0000")))
# 면허 코드 — 공고 탭 «내 면허»(collect.lic_pairs → meta.con.lics) 와 같은 가름이어야 «🪪 내 면허만» 이 맞음
면허들 = [["토목공사업/0001"], [" 전기공사업 / 0037 ", "건축공사업/0002"], ["기타공사"], "실내건축공사업/4993", [], None, ["", "/0005"], ["철근ㆍ콘크리트공사업/4994", "a/b/0003"]]
ok("면허 — 빈칸 떼기 · «/» 없으면 이름이 곧 코드 · 글 하나 · 빈 것",
   [H.면허(x)[0] for x in 면허들] == [["0001"], ["0037", "0002"], ["기타공사"], ["4993"], [], [], ["0005"], ["4994", "0003"]],
   [H.면허(x)[0] for x in 면허들])
ok("면허 이름 — «전기공사업 외 1» · 이름 없으면 코드", H.면허([" 전기공사업 / 0037 ", "건축공사업/0002"])[1] == "전기공사업 외 1" and H.면허(["/0005"])[1] == "0005",
   (H.면허([" 전기공사업 / 0037 ", "건축공사업/0002"])[1], H.면허(["/0005"])[1]))
try:
    import collect as C
except Exception as e:      # collect 가 못 읽히는 곳(requests 같은 패키지 없음) — 위 두 줄이 같은 규칙을 지킴
    C = None
    ok(f"collect 못 읽음({type(e).__name__}) — 건너뜀", True)
if C is not None:
    ok("면허 코드 = collect.lic_codes(공고 탭 면허 칩과 같은 코드)", all(H.면허(x)[0] == C.lic_codes({"lic": x}) for x in 면허들),
       [(H.면허(x)[0], C.lic_codes({"lic": x})) for x in 면허들])
ok("셈: 입찰 중 1 · 개찰 대기 1 · 곧 착공 1 · 전남 [1,1,0,0] · 경남 [0,0,1,0]", 합["n"] == [1, 1, 1] and 합["시도"]["전남"] == [1, 1, 0, 0] and 합["시도"]["경남"] == [0, 0, 1, 0], 합)
ok("곳 셈: 나주 [1,0,0]", 합["곳"].get(이름k("전남", "나주시")) == [1, 0, 0], 합["곳"])
ok("큰 공사: 입찰 중 · 개찰 대기만(곧 착공 E 는 빠짐) · 금액 큰 차례", [x[0] for x in 합["큰"]] == ["A", "B"], [x[0] for x in 합["큰"]])
ok("새 소식: 개찰(E 11-12) · 공고일(A 11-10 · B 11-01) 최근 차례", [x[0] for x in 합["새"]] == ["E", "A", "B"], 합["새"])
ok("시도 줄 차례: 입찰 중 → 개찰 대기 → 곧 착공", [x[0] for x in by["전남"]] == ["A", "B"])

print("⑤ 파일")
tmp = tempfile.mkdtemp(prefix="g756now-")
try:
    store = os.path.join(tmp, "store")
    os.makedirs(store)
    for 이름, d in (("live", live), ("first", first)):
        with open(os.path.join(store, f"{이름}.json"), "w", encoding="utf-8") as f:
            json.dump({"con": d, "serv": {}}, f, ensure_ascii=False)
    out = os.path.join(tmp, "now")
    os.makedirs(out)
    with open(os.path.join(out, "제주.json"), "w", encoding="utf-8") as f:      # 지난 회차 파일 — 지워져야 함
        f.write("{}")
    H.build(out=out, store=store, now=지금, log=lambda *_: None)
    fs = sorted(os.listdir(out))
    ok("sum.json · 전남.json · 경남.json (옛 제주.json 지움)", fs == sorted(["sum.json", "전남.json", "경남.json"]), fs)
    with open(os.path.join(out, "sum.json"), encoding="utf-8") as f:
        s = json.load(f)
    ok("sum.json 칸: at · n · 시도 · 곳 · 새 · 큰", all(k in s for k in ("at", "n", "시도", "곳", "새", "큰")) and s["at"] == "2026-11-17 12:00", list(s))
    with open(os.path.join(out, "전남.json"), encoding="utf-8") as f:
        j = json.load(f)
    ok("전남.json: {at, 시도, 줄} · 줄 16칸", j.get("시도") == "전남" and all(len(x) == 16 for x in j["줄"]), j)
    # 자료가 하나도 없을 때(수집 기록 못 받음) — 빈 sum.json 만(화면은 «고른 조건에 맞는 공사가 없습니다»)
    out2 = os.path.join(tmp, "now2")
    H.build(out=out2, store=os.path.join(tmp, "없는곳"), now=지금, log=lambda *_: None)
    with open(os.path.join(out2, "sum.json"), encoding="utf-8") as f:
        s2 = json.load(f)
    ok("자료 없음 → sum.json 하나 · n [0,0,0]", os.listdir(out2) == ["sum.json"] and s2["n"] == [0, 0, 0] and s2["큰"] == [] and s2["새"] == [], (os.listdir(out2), s2))
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print(f"\n{'❌' if bad else '✅'} 시험_현황판 {n - bad}/{n}")
sys.exit(1 if bad else 0)
