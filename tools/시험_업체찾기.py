# -*- coding: utf-8 -*-
"""🏢 업체 찾기 — build_json.corp_find_rows · build_corp_find 시험 (2026-10-20 · G343)
     python3 tools/시험_업체찾기.py
   자료는 모두 지어낸 것(«가상○○건설» · 사업자번호 «1000000001» …). 구성원 장부와 같은 꼴
   {사업자번호: {n 이름, l {면허: 날짜}, r {시도: 날짜}, s {"시도 시군": 날짜}}, __ln__ {면허: 이름}}."""
import json
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import build_json as BJ  # noqa: E402

ok = bad = 0


def 봄(what, cond, more=""):
    global ok, bad
    if cond:
        ok += 1
        print("  ✓", what)
    else:
        bad += 1
        print("  ✗", what, more)


KST = timezone(timedelta(hours=9))
NOW = datetime(2026, 10, 20, 12, 0, tzinfo=KST)
D = lambda days: (NOW - timedelta(days=days)).strftime("%Y%m%d")   # noqa: E731

pl = {
    "__ln__": {"0001": "토목공사업", "4989": "토목건축공사업", "0037": "포장공사업"},
    # 한 법인뿐인 이름 · 낙찰 12 · 전남 여수 · 토목 · 포장
    "1000000001": {"n": "(주)가상바다건설", "l": {"0001": D(10), "0037": D(40)}, "r": {"전남": D(10)}, "s": {"전남 여수시": D(10)}},
    # 같은 이름에 법인 둘 — 이 법인 기록(이름#번호) 3건만
    "1000000002": {"n": "가상동명건설", "l": {"0001": D(5)}, "r": {"전남": D(5), "광주": D(30)}, "s": {"광주 광산구": D(30)}},
    # 낙찰 없음 · 반년 넘게 안 넣음 → 아래로
    "1000000003": {"n": "가상산들건설", "l": {"4989": D(200), "0001_4989": D(200)}, "r": {"전남": D(200)}, "s": {}},
    # 1년 넘게 안 넣음 → 빠짐
    "1000000004": {"n": "가상옛날건설", "l": {"0001": D(400)}, "r": {"전남": D(400)}, "s": {}},
    # 지역 근거 없음 → 빠짐
    "1000000005": {"n": "가상전국건설", "l": {"0001": D(3)}, "r": {}, "s": {}},
    # 내려 달라고 한 업체 → 빠짐
    "1000000006": {"n": "가상숨김건설", "l": {"0001": D(3)}, "r": {"전남": D(3)}, "s": {}},
    # 모르는 시도 이름 → 그 줄만 빠짐
    "1000000007": {"n": "가상해외건설", "l": {"0001": D(3)}, "r": {"외국": D(3)}, "s": {}},
}
agg = {
    "가상바다건설": {"n": 12, "bzn": 1},
    "가상동명건설": {"n": 30, "bzn": 2},
    "가상동명건설#1000000002": {"n": 3, "bzn": 1},
}
hide = {"가상숨김건설"}
# 🏢 법인만 연락처 — 법인(가운데 81) · 개인(가운데 00)
pl["1238100008"] = {"n": "가상법인건설(주)", "l": {"0001": D(2)}, "r": {"전남": D(2)}, "s": {"전남 순천시": D(2)},
                    "c": ["김가상", D(2)], "t": ["061-000-0000", D(2)], "a": ["전남 순천시 가상로 1", D(2)]}
pl["1230000009"] = {"n": "가상개인건설", "l": {"0001": D(2)}, "r": {"전남": D(2)}, "s": {},
                    "c": ["이가상", D(2)], "t": ["010-0000-0000", D(2)], "a": ["전남 가상군 가상리", D(2)]}

by, ln = BJ.corp_find_rows(agg, pl, hide, now=NOW)
전남 = by.get("전남") or []
이름들 = [r[0] for r in 전남]
봄("전남 — 넣어 본 업체(1년 넘은 · 지역 근거 없는 · 숨김 · 모르는 시도 뺌)", [x for x in 이름들 if x not in ("가상법인건설(주)", "가상개인건설")] == ["(주)가상바다건설", "가상동명건설", "가상산들건설"] and len(이름들) == 5, 이름들)
봄("줄 꼴 — [상호, 페이지키, 낙찰, 시군, [면허…], 최근, 번호, 대표] · 개인(가운데 00)은 번호 · 대표 빈칸", 전남 and 전남[0] == ["(주)가상바다건설", "가상바다건설", 12, "여수시", ["0001", "0037"], D(10), "", ""], 전남[:1])
법줄 = next(r for r in 전남 if r[0] == "가상법인건설(주)"); 개줄 = next(r for r in 전남 if r[0] == "가상개인건설")
봄("🏢 법인 — 사업자번호 · 대표 실음", 법줄[6] == "1238100008" and 법줄[7] == "김가상", 법줄)
봄("🏢 개인사업자 — 대표가 장부에 있어도 번호 · 대표 안 실음", 개줄[6] == "" and 개줄[7] == "", 개줄)
con = BJ.corp_con_rows(pl, hide)
봄("🏢 연락처 조각 — 법인만 {앞3: {번호: [전화, 주소]}} · 개인 휴대폰 · 주소 안 실음", con == {"123": {"1238100008": ["061-000-0000", "전남 순천시 가상로 1"]}}, con)
봄("법인번호 — 81 · 86 · 87 · 88 · 85 법인 / 01 · 00 개인", all(BJ.법인번호(x) for x in ("1238100001", "1238600001", "123-87-00001", "1238800001", "1238500001")) and not any(BJ.법인번호(x) for x in ("1230100001", "1230000001", "123")))
봄("같은 이름 법인 둘 — 이 법인 기록 3건만(이름 합계 30 을 안 붙임)", 전남[1][2] == 3 and 전남[1][1] == "가상동명건설", 전남[1])
산들 = next(r for r in 전남 if r[0] == "가상산들건설")
봄("낙찰 없는 업체 — 페이지키 '' · 낙찰 0 · 면허 묶음(0001_4989)은 칩에 안 넣음", 산들[1] == "" and 산들[2] == 0 and 산들[4] == ["4989"], 산들)
봄("반년 넘게 안 넣은 업체는 맨 아래(낙찰 많은 차례보다 먼저 «최근»)", 이름들.index("가상산들건설") == len(이름들) - 1, 이름들)
봄("광주 — 같은 법인이 광주에도(광산구)", [r[0] for r in by.get("광주", [])] == ["가상동명건설"] and by["광주"][0][3] == "광산구", by.get("광주"))
봄("모르는 시도 · 외국은 파일 없음", "외국" not in by and set(by) == {"전남", "광주"}, list(by))
봄("면허 이름 — 쓴 코드만", ln == {"0001": "토목공사업", "0037": "포장공사업", "4989": "토목건축공사업"}, ln)
봄("개인사업자 번호(1000000…) · 휴대폰은 어디에도 없음", all(not any("1000000" in str(x) or "010-" in str(x) for x in r) for rs in by.values() for r in rs))
봄("장부가 없으면 빈 것(고장 안 남)", BJ.corp_find_rows(agg, {}, hide, now=NOW) == ({}, {}) and BJ.corp_find_rows(agg, None) == ({}, {}))

# 파일 쓰기 — 💸 조각(처음 _top · 면허 l/ · 시군 s/) — 한 지역을 통째로 받지 않게
with tempfile.TemporaryDirectory() as d:
    old = BJ.OUT
    BJ.OUT = d
    try:
        n = BJ.build_corp_find(agg, pl, hide)
        J = lambda *p: json.load(open(os.path.join(d, "corp", "find", *p), encoding="utf-8"))   # noqa: E731
        t = J("전남", "_top.json")
        con파일 = J("..", "con", "123.json")
        봄("파일 corp/con/123.json — 법인 연락처만", con파일 == {"1238100008": ["061-000-0000", "전남 순천시 가상로 1"]}, con파일)
        봄("_top — n · ln · lc(면허별 수) · sc(시군별 수) · rows", t["n"] == len(t["rows"]) == 5 and t["lc"].get("0001") == 4 and t["sc"] == {"여수시": 1, "순천시": 1}
           and set(t["ln"]) == {"0001", "0037", "4989"} and t["rows"][0][0] == "(주)가상바다건설", t)
        l1 = J("전남", "l", "0001.json")
        봄("면허 조각 l/0001 — 토목 근거 업체만", [r[0] for r in l1["rows"] if r[0] not in ("가상법인건설(주)", "가상개인건설")] == ["(주)가상바다건설", "가상동명건설"] and l1["n"] == 4, l1)
        s1 = J("전남", "s", "여수시.json")
        봄("시군 조각 s/여수시 — 여수 업체만", [r[0] for r in s1["rows"]] == ["(주)가상바다건설"], s1)
        봄("면허 묶음(0001_4989)은 조각을 안 만듦", not os.path.exists(os.path.join(d, "corp", "find", "전남", "l", "0001_4989.json")))
        li = J("_list.json")
        봄("_list — 시·도별 업체 수(REGIONS 차례)", list(li["n"].items()) == [("광주", 1), ("전남", 5)], li)
        봄("쓴 크기를 돌려줌", n > 0)
        old_top, old_max = BJ.CORP_FIND_TOP, BJ.CORP_FIND_MAX
        BJ.CORP_FIND_TOP, BJ.CORP_FIND_MAX = 1, 1
        try:
            BJ.build_corp_find(agg, pl, hide)
            t2, l2 = J("전남", "_top.json"), J("전남", "l", "0001.json")
            봄("한도 — _top 1줄 · 조각 1줄 · n 은 전체 수", len(t2["rows"]) == 1 and t2["n"] == 5 and len(l2["rows"]) == 1 and l2["n"] == 4, [t2["n"], l2])
        finally:
            BJ.CORP_FIND_TOP, BJ.CORP_FIND_MAX = old_top, old_max
    finally:
        BJ.OUT = old

print(f"\n업체 찾기 {ok}/{ok + bad}")
sys.exit(1 if bad else 0)
