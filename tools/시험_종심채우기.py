# -*- coding: utf-8 -*-
"""🧪 G806 종심 «지난 1년» 채우기 — tools/종심채우기.py (조달청은 부르지 않음 · 가짜 응답)
   ① 후보읽기 — 누적 CSV · 3년 파일에서 지난 1년 · 95억 이상만 · 새것부터 · 같은 공고는 기초금액 있는 CSV 줄 · 3년 파일 차수
   ② 채우기 — 저장소 공고(낙찰방법 있음)는 공고를 안 물음 · 모르면 공고번호로 물음(inqryDiv 2) · 가장 뒤 차수 · 기초금액 모르면 bsis_one ·
      순위가 그 차수에 없으면 000 으로 한 번 더 · 종심넣기 로 한 줄(업체 이름 · 사업자번호 · 공사명 안 실음)
   ③ 적격심사 → «아님»(다시 안 물음) · 공고 없음 → 3일 뒤 다시 · 세 번이면 그만 · 통신 실패 → 표시 안 함 · 하루 몫 끝 → 멈춤(표시 안 함)
   ④ 건수 · 시간 예산 · 저장(_채움 줄)
   돌리기: python tools/시험_종심채우기.py"""
import csv, io, json, os, sys, tempfile, zipfile
from datetime import datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools"))
import collect as C
import kcm_rules as R
import 종심채우기 as J

n = bad = 0


def ok(이름, c, got=None):
    global n, bad
    n += 1
    if not c:
        bad += 1
    print(("  ✓ " if c else "  ✗ ") + 이름 + ("" if c else " = " + json.dumps(got, ensure_ascii=False, default=str)[:500]))


KST = C.KST
지금 = datetime(2026, 11, 20, 21, 0, tzinfo=KST)
d = tempfile.mkdtemp()
# ── 가짜 누적 CSV(새 꼴) · 3년 파일(옛 꼴) ──
머리 = ["공고번호", "날짜", "발주기관", "공고명", "1순위업체", "사업자번호", "대표자", "투찰금액", "투찰률", "기초금액", "A값", "A값적용", "예가하한", "예가상한", "참가업체수"]
줄들 = [
    ["R26BK00000001", "2026-10-05", "조달청 가상지방조달청", "가상 공사 하나", "가상건설(주)", "1234567890", "홍길동", "9500000000", "86.5", "11000000000", "", "", "", "", "120"],
    ["R26BK00000002", "2026-09-01", "가상시청", "가상 공사 둘", "나라건설(주)", "1234567891", "홍길서", "12000000000", "88.0", "", "", "", "", "", "80"],   # 기초 없음 · 예정 136억
    ["R26BK00000003", "2026-08-01", "가상군청", "작은 공사", "작은건설", "1234567892", "홍길남", "900000000", "88.0", "1000000000", "", "", "", "", "30"],    # 10억 — 후보 아님
    ["R25BK00000004", "2025-10-01", "가상도청", "옛 공사", "옛건설", "1234567893", "홍길북", "20000000000", "88.0", "23000000000", "", "", "", "", "50"],  # 1년 넘음
]
with io.open(os.path.join(d, "extra_2026-10.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f); w.writerow(머리); w.writerows(줄들)
zp = os.path.join(d, "bid_data_3years.zip")
with zipfile.ZipFile(zp, "w") as z:
    s = io.StringIO(); w = csv.writer(s)
    w.writerow(["1순위업체", "공고명", "공고번호", "날짜", "발주기관", "전체업체", "투찰금액", "투찰률", "공고차수"])
    w.writerow(["삼건설", "옛 큰 공사", "R26BK00000005", "2026-02-10 11:00:00", "가상공단", "", "15,000,000,000원", "87.2%", "1"])
    w.writerow(["사건설", "같은 공고", "R26BK00000001", "2026-10-05 11:00:00", "조달청 가상지방조달청", "", "9,500,000,000원", "86.5%", "0"])
    w.writerow(["오건설", "작은", "R26BK00000006", "2026-03-01 11:00:00", "가상구청", "", "500,000,000원", "88%", ""])
    z.writestr("bid_data_3years.csv", "﻿" + s.getvalue())

print("① 후보읽기")
후보 = J.후보읽기("2026-11-20", extra=os.path.join(d, "extra_*.csv"), zip_path=zp)
번호 = [c["no"] for c in 후보]
ok("지난 1년 · 95억 이상만 · 새것부터(10-05 · 09-01 · 02-10)", 번호 == ["R26BK00000001", "R26BK00000002", "R26BK00000005"], 번호)
ok("같은 공고는 누적 CSV 줄(기초금액 110억)", 후보[0]["base"] == 11_000_000_000 and 후보[0]["inst"].startswith("조달청"), 후보[0])
ok("기초금액 없는 줄은 1순위 금액 ÷ 투찰률(136억)로 고름 · base 없음", 후보[1]["base"] is None, 후보[1])
ok("3년 파일 줄 — 차수 001 · 날짜 16자", 후보[2]["ord"] == "001" and 후보[2]["d"] == "2026-02-10 11:00", 후보[2])

print("② 채우기 — 가짜 조달청")
예정 = 12_000_000_000
금액들 = [10_200_000_000 + k * 7_000_000 for k in range(30)]
순위목록 = [{"prcbdrNm": f"가상업체{i:02d}", "bidprcAmt": str(a), "bidprcrt": f"{a * 100 / 예정:.3f}", "opengRank": str(i + 1),
          "prcbdrBizno": f"{2000000000 + i}", "prcbdrCeoNm": "대표", "drwtNo1": "1", "drwtNo2": "2"} for i, a in enumerate(금액들)]
부른것 = []
공고응답 = {
    "R26BK00000002": [{"bidNtceNo": "R26BK00000002", "bidNtceOrd": "000", "sucsfbidMthdNm": "종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준",
                       "presmptPrce": "12500000000", "bidNtceDt": "2026-08-01 10:00:00", "ntceInsttNm": "가상시청", "bidNtceNm": "가상 공사 둘", "mainCnsttyNm": "토목공사업"},
                      {"bidNtceNo": "R26BK00000002", "bidNtceOrd": "001", "sucsfbidMthdNm": "종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준",
                       "presmptPrce": "12500000000", "bidNtceDt": "2026-08-03 10:00:00", "ntceInsttNm": "가상시청", "bidNtceNm": "가상 공사 둘(정정)", "mainCnsttyNm": "토목공사업"}],
    "R26BK00000005": [{"bidNtceNo": "R26BK00000005", "bidNtceOrd": "001", "sucsfbidMthdNm": "적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사",
                       "presmptPrce": "14000000000", "bidNtceDt": "2026-01-10 10:00:00", "ntceInsttNm": "가상공단"}],
}
상태 = {"공고실패": set(), "순위차수": {}}


def 가짜fetch(url, key, day=None, extra=None, label="", why=None, _flip=False):
    no = (extra or {}).get("bidNtceNo")
    부른것.append(("공고" if "BidPublicInfoService" in url else "기타", no, dict(extra or {})))
    if no in 상태["공고실패"]:
        if why is not None:
            why.update({"net": "ReadTimeout"})
        return []
    return list(공고응답.get(no, []))


def 가짜순위(key, no, ord_="000", 전체=None):
    부른것.append(("순위", no, ord_))
    if 상태["순위차수"].get(no, ord_) != ord_:
        return [], 0, [], [0] * 15
    if 전체 is not None:
        전체.extend((int(it["bidprcAmt"]), float(it["bidprcrt"])) for it in 순위목록)
    return [[it["prcbdrNm"], int(it["bidprcAmt"])] for it in 순위목록][:30], len(순위목록), [], [0] * 15


C.fetch = 가짜fetch
C.openg_ranks = 가짜순위
C.bsis_one = lambda key, no, kind: (부른것.append(("기초", no, kind)) or {"base": 13_200_000_000})
J.C = C
live = {"con": {"R26BK00000001": {"no": "R26BK00000001", "swin": "종합심사낙찰제(공사)-간이형", "est": 10_100_000_000, "dt": "2026-09-10 10:00:00",
                                  "inst": "조달청 가상지방조달청", "main": "건축공사업", "site": "가상도"}}}
first = {"con": {"R26BK00000001": {"no": "R26BK00000001", "ord": "000", "dt": "2026-10-05 11:00:00", "inst": "조달청 가상지방조달청", "base": "11000000000"}}}
상태["순위차수"]["R26BK00000002"] = "000"      # 001(가장 뒤 차수)엔 순위 없음 → 000 으로 다시
js = {"con": {}}
st = J.채우기("가짜키", js, 후보, live, first, 건수=10, 쉼=0, now=지금)
공고물음 = [x for x in 부른것 if x[0] == "공고"]
ok("저장소 공고(낙찰방법 있음)는 공고를 안 물음 · 모르는 둘만 물음(inqryDiv 2 · 공고번호)", [x[1] for x in 공고물음] == ["R26BK00000002", "R26BK00000005"]
   and all(x[2].get("inqryDiv") == "2" for x in 공고물음), 공고물음)
ok("넣음 2(001 · 002) · 아님 1(적격심사 005)", st["넣음"] == 2 and st["아님"] == 1 and set(js["con"]) == {"R26BK00000001", "R26BK00000002"}, st)
줄1, 줄2 = js["con"]["R26BK00000001"], js["con"]["R26BK00000002"]
ok("001 — 기초금액은 저장소 · 개찰일시 · 균형가격 = kcm_rules.균형가격", 줄1["base"] == 11_000_000_000 and 줄1["dt"] == "2026-10-05 11:00"
   and 줄1["bal"] == R.균형가격(금액들, 예정, True)["bal"] and 줄1["kind"] == "간이형" and 줄1["pt"] == 60, 줄1)
ok("002 — 기초금액 모름 → bsis_one(132억) · 순위는 001 에 없어 000 으로 · 공고일 08-03(가장 뒤 차수)", 줄2["base"] == 13_200_000_000 and 줄2["ord"] == "000"
   and 줄2["nt"] == "2026-08-03" and ("기초", "R26BK00000002", "con") in 부른것 and ("순위", "R26BK00000002", "001") in 부른것, 줄2)
ok("지방 공고 08-03 → 같은 금액 묶음 기준일(예규 08-25) 전 → 안 묶음(sm 0)", 줄2["sm"] == 0, 줄2)
글 = json.dumps(js, ensure_ascii=False)
사업자들 = {f"{2000000000 + i}" for i in range(30)}
값들 = {str(v) for 줄 in js["con"].values() for v in 줄.values()}
ok("업체 이름 · 사업자번호 · 공사명 안 실음", not any(w in 글 for w in ("가상업체", "가상 공사", "정정", "대표")) and not (사업자들 & 값들), 글[:300])
ok("적격심사 → x «아님»", js["x"].get("R26BK00000005", [None])[0] == "아님", js.get("x"))

print("③ 다시 묻기 · 표시")
부른것.clear()
st2 = J.채우기("가짜키", js, 후보, live, first, 건수=10, 쉼=0, now=지금)
ok("다음 회차 — 넣은 것 · «아님» 은 다시 안 물음(부름 0)", st2["봄"] == 0 and not 부른것, [st2, 부른것])
후보2 = [{"no": "R26BK00000007", "ord": "", "d": "2026-07-01", "inst": "가상시청", "base": 15_000_000_000}]
js2 = {"con": {}}
st3 = J.채우기("가짜키", js2, 후보2, {}, {}, 건수=5, 쉼=0, now=지금)
ok("공고 응답 없음(자료 없음) → «공고없음» 1번", js2["x"]["R26BK00000007"][:2] == ["공고없음", 1] and st3["없음"] == 1, js2)
st4 = J.채우기("가짜키", js2, 후보2, {}, {}, 건수=5, 쉼=0, now=datetime(2026, 11, 22, 9, 0, tzinfo=KST))
ok("이틀 뒤엔 안 물음(3일 뒤 다시)", st4["봄"] == 0, st4)
J.채우기("가짜키", js2, 후보2, {}, {}, 건수=5, 쉼=0, now=datetime(2026, 11, 23, 22, 0, tzinfo=KST))
J.채우기("가짜키", js2, 후보2, {}, {}, 건수=5, 쉼=0, now=datetime(2026, 11, 27, 9, 0, tzinfo=KST))
st5 = J.채우기("가짜키", js2, 후보2, {}, {}, 건수=5, 쉼=0, now=datetime(2026, 12, 9, 9, 0, tzinfo=KST))
ok("세 번 없으면 그만", js2["x"]["R26BK00000007"][1] == 3 and st5["봄"] == 0, [js2["x"], st5])
상태["공고실패"].add("R26BK00000008")
js3 = {"con": {}}
st6 = J.채우기("가짜키", js3, [{"no": "R26BK00000008", "ord": "", "d": "2026-07-02", "inst": "", "base": None}], {}, {}, 건수=5, 쉼=0, now=지금)
ok("통신 실패 → 표시 안 함(다음 회차에 다시)", not js3.get("x") and st6["봄"] == 1, [js3, st6])
C.QUOTA_OUT = True
js4 = {"con": {}}
st7 = J.채우기("가짜키", js4, 후보, live, first, 건수=10, 쉼=0, now=지금)
ok("하루 몫 끝 → 바로 멈춤 · 표시 안 함", st7["봄"] == 0 and not js4["con"] and not js4.get("x"), [st7, js4])
C.QUOTA_OUT = False

print("④ 건수 · 저장")
js5 = {"con": {}}
st8 = J.채우기("가짜키", js5, 후보, live, first, 건수=1, 쉼=0, now=지금)
ok("건수 1 → 한 건만", st8["봄"] == 1 and len(js5["con"]) == 1, st8)
C.JONGSIM = os.path.join(d, "jongsim.json")
js5["_채움"] = dict(st8, t="2026-11-20 21:00", 모두=len(js5["con"]))
ok("저장 → 다시 읽으면 같음(x · _채움 칸 그대로)", C.save_jongsim(js5) and C.load_jongsim()["_채움"]["봄"] == 1 and C.load_jongsim()["con"] == js5["con"])

print(f"\n{'✗' if bad else '✓'} 시험_종심채우기 {n - bad}/{n}")
sys.exit(1 if bad else 0)
