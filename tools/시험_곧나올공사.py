# -*- coding: utf-8 -*-
"""📣 곧 나올 공사 — build_json.build_pre 시험 (2026-10-05 · G135)
     python3 tools/시험_곧나올공사.py
   자료는 모두 지어낸 것(기관 «가상시» · 사업명 «가상 …»). 실제 응답의 칸 이름(G133c 첫 수집에서 확인한 것)과
   같은 이름을 쓰고, 이름이 다른 경우(cnstwkNm · sumOrderAmt …)도 섞어 봅니다."""
import json
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import build_json as BJ  # noqa: E402

ok = bad = 0


def 같음(got, want, what):
    global ok, bad
    if got == want:
        ok += 1
        print("  ✓", what)
    else:
        bad += 1
        print("  ✗", what, "— 나온 값", got, "· 바란 값", want)


KST = timezone(timedelta(hours=9))
now = datetime(2026, 10, 5, 12, 0, tzinfo=KST)
src = tempfile.mkdtemp()
out = tempfile.mkdtemp()
BJ.OUT = out
os.makedirs(out, exist_ok=True)
# 열린 공고(bidindex) — R26BK09990001 은 지금 열려 있음
json.dump({"f": ["no", "name"], "r": [["R26BK09990001", "가상 열린 공고"]]}, open(os.path.join(out, "bidindex.json"), "w", encoding="utf-8"))
plan = {"at": "2026-10-05 07:23", "r": {
    "a": {"bizNm": "가상 소하천 정비공사", "orderInsttNm": "전라남도 가상시", "cnstwkRgnNm": "전라남도 가상시",
          "orderYear": "2026", "orderMnth": "11", "orderContrctAmt": "512000000", "cntrctMthdNm": "일반경쟁",
          "cnsttyDivNm": "토목", "deptNm": "건설과", "ofclNm": "홍길동", "telNo": "061-000-0000",
          "dsgnDocRdngPlceNm": "건설과", "dsgnDocRdngPrdCntnts": "공고 시", "bidNtceNoList": ""},
    "b": {"cnstwkNm": "가상 청사 리모델링", "orderInsttNm": "경기도 가상군", "orderYear": "2026", "orderMnth": "202610",
          "sumOrderAmt": "1,234,000,000", "bidNtceNoList": "R26BK09990001-000"},
    "c": {"bizNm": "지난달 계획", "orderInsttNm": "경기도 가상군", "orderYear": "2026", "orderMnth": "09"},
    "d": {"bizNm": "가상 소하천 정비공사", "orderInsttNm": "전라남도 가상시", "orderYear": "2026", "orderMnth": "11"},   # 같은 계획(기관·이름·월) — 한 줄
    "e": {"bizNm": "가상 가로등 교체", "orderInsttNm": "조달청", "orderYear": "2027", "orderMnth": "06"},             # 6달 넘어 — 뺌
}}
spec = {"at": "2026-10-05 07:23", "r": {
    "s1": {"bfSpecRgstNo": "R26BD00000001", "prdctClsfcNoNm": "가상 도로 포장공사", "orderInsttNm": "전라남도 가상시",
           "rlDminsttNm": "전라남도 가상시", "asignBdgtAmt": "300000000", "rcptDt": "2026-10-02 10:00:00",
           "opninRgstClseDt": "2026-10-08 18:00:00", "ofclNm": "홍길동", "ofclTelNo": "061-111-1111",
           "specDocFileUrl1": "https://www.g2b.go.kr/가상파일1", "specDocFileUrl2": ""},
    "s2": {"bfSpecRgstNo": "R26BD00000002", "prdctClsfcNoNm": "오래된 사전규격", "orderInsttNm": "경기도 가상군",
           "rcptDt": "2026-08-01 10:00:00", "opninRgstClseDt": "2026-08-05 18:00:00"},
}}
json.dump(plan, open(os.path.join(src, "발주계획.json"), "w", encoding="utf-8"), ensure_ascii=False)
json.dump(spec, open(os.path.join(src, "사전규격.json"), "w", encoding="utf-8"), ensure_ascii=False)

print("1) 고르기 · 합치기")
n = BJ.build_pre(src_dir=src, out_dir="pre", now=now)
같음(n, 3, "발주계획 2(지난달 · 6달 넘은 것 빼고 · 같은 계획 한 줄) + 사전규격 1(오래된 것 뺌)")
idx = json.load(open(os.path.join(out, "pre", "idx.json"), encoding="utf-8"))
같음(idx["all"], [3, 1], "전체 3 · 공고 직전(사전규격) 1")
같음(sorted(idx["n"].keys()), ["경기", "전남"], "시도 — 기관 이름으로(전남 · 경기)")
같음(list(idx["o"].values()), ["R26BK09990001"], "열린 공고로 나온 계획 → 공고번호(차수 꼬리 뗌)")

print("2) 줄 내용")
jn = json.load(open(os.path.join(out, "pre", str(BJ.SIDO_KAN.index("전남")) + ".json"), encoding="utf-8"))
rows = [dict(zip(jn["f"], r)) for r in jn["r"]]
같음([r["k"] for r in rows], ["s", "p"], "전남 — 공고 직전(사전규격)이 먼저, 그다음 발주계획")
p = rows[1]
같음([p["ym"], p["amt"], p["how"], p["kind"], p["dept"], p["tel"]], ["202611", 512000000, "일반경쟁", "토목", "건설과", "061-000-0000"], "발주계획 — 월 · 금액 · 계약방법 · 공종 · 부서 · 전화")
같음("홍길동" in json.dumps(jn, ensure_ascii=False), False, "담당자 이름은 싣지 않음")
s = rows[0]
같음([s["due"], s["amt"], s["files"], s["tel"]], ["2026-10-08 18:00", 300000000, ["https://www.g2b.go.kr/가상파일1"], "061-111-1111"], "사전규격 — 의견 마감 · 배정예산 · 규격서 · 전화")
jg = json.load(open(os.path.join(out, "pre", str(BJ.SIDO_KAN.index("경기")) + ".json"), encoding="utf-8"))
g = [dict(zip(jg["f"], r)) for r in jg["r"]]
같음([(r["nm"], r["ym"], r["amt"], r["st"], r["kind"]) for r in g], [("가상 청사 리모델링", "202610", 1234000000, "o", "")],
     "칸 이름이 달라도(cnstwkNm · sumOrderAmt · 202610) 읽음 · 열린 공고 st=o · 공종 칸이 없으면 빈 값(이름으로 짐작 안 함)")

print("3) 기관 화면 묶음")
b = json.load(open(os.path.join(out, "pre", "ag", str(BJ.sjr_bucket("전라남도 가상시")) + ".json"), encoding="utf-8"))
같음(len(b.get("전라남도 가상시", [])), 2, "«전라남도 가상시» 가 낼 공사 2건(계획 1 · 사전규격 1)")

print("4) 수집분 없음")
out2 = tempfile.mkdtemp()
BJ.OUT = out2
n2 = BJ.build_pre(src_dir=tempfile.mkdtemp(), out_dir="pre", now=now)
같음([n2, os.path.exists(os.path.join(out2, "pre", "idx.json"))], [0, True], "빈 파일을 씀(화면은 «아직 모읍니다»)")

print(f"\n{ok} 통과 · {bad} 실패")
sys.exit(1 if bad else 0)
