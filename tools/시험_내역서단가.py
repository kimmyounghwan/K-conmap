# -*- coding: utf-8 -*-
"""🧪 내역서 «단가 줄» 뽑기 · 보관 기록 — G374 (2026-10-22) · python tools/시험_내역서단가.py
   가상 내역서 세 벌을 openpyxl 로 만들어(공사명 · 기관 · 사람 이름 모두 가상) collect.py 의 뽑는 길을 그대로 돌립니다. 인터넷 · 실제 파일 안 씀.

   A 조달청 표준 꼴 — 공종별내역서(두 줄 머리 «재료비/단가») · 단가대비표(재료비 [조달 · 물가 · 조사] 적용단가 | 노무비 | 경비 [시설] 적용단가)
     · 공종별집계표(공종 합계 «식» — 안 뽑음) · 일위대가(같은 줄 되풀이 — 한 번만) · 표지
   B 한 줄 머리 — 품명|규격|단위|단가|금액 · «1. 토공» 같은 공종 머리(식) · 공사설정 시트의 단가 칸(안 뽑음) · 값이 큰 진짜 품목(대) 은 남김
   C 시트 스무 장 뒤 본문 — 시방서 20장 → 설계내역서(계 단가가 맨 앞: 계 · 노무 · 재료 · 경비) · 자재조서(조서지만 뽑음) · 총괄표(안 뽑음)
   + 보관 기록: 상한으로 내린 것의 결과가 남는가 · 기록이 지워진 것 되살리기 · 다시 받을 것 고르기 · 정정 공고 겹침 하나로
"""
import os
import sys
import json
import shutil
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import collect  # noqa: E402
from openpyxl import Workbook  # noqa: E402

통과 = 실패 = 0


def 봄(무엇, ok, 값=None):
    global 통과, 실패
    if ok:
        통과 += 1
        print("  ✓", 무엇)
    else:
        실패 += 1
        print("  ✗", 무엇, "" if 값 is None else str(값)[:400])


곳 = tempfile.mkdtemp(prefix="시험내역서_")


def 만들기(이름, 시트들):
    wb = Workbook()
    wb.remove(wb.active)
    for 제목, 줄들 in 시트들:
        ws = wb.create_sheet(제목)
        for r in 줄들:
            ws.append(list(r))
    p = os.path.join(곳, 이름)
    wb.save(p)
    return p


def 찾기(got, 품명, 규격=None):
    return [r for r in got if r[0] == 품명 and (규격 is None or r[1] == 규격)]


# ── A 조달청 표준 꼴 ─────────────────────────────────────────────
A = 만들기("A_가상_표준.xlsx", [
    ("표지", [("가상 마을길 정비공사",), ("설계내역서",)]),
    ("공종별집계표", [
        ("공종", "규격", "단위", "금액"),
        ("01  가상 마을길 정비공사", "", "", 150000000),
        ("0101  01.토공", "", "", 90000000),
        ("가. 공사비", "", "식", 150000000),
    ]),
    ("공종별내역서", [
        ("[ 가상 마을길 정비공사 ]",),
        ("공  종  명", "규격", "단위", "수량", "재  료  비", None, "노  무  비", None, "경    비", None, "합    계", None, "비고"),
        (None, None, None, None, "단  가", "금  액", "단  가", "금  액", "단  가", "금  액", "단  가", "금  액", None),
        ("1. 토공", "", "식", 1, 0, 0, 0, 0, 0, 0, 0, 0, None),
        ("터파기", "토사, 0.7㎥ 굴착기", "㎥", 120, 0, 0, 1500, 180000, 900, 108000, 2400, 288000, None),
        ("되메우기", "토사", "㎥", 80, 0, 0, 2000, 160000, 600, 48000, 2600, 208000, None),
        ("레미콘", "25-24-150", "㎥", 30, 90000, 2700000, 0, 0, 0, 0, 90000, 2700000, None),
        ("소계", "", "", None, None, 2700000, None, 340000, None, 156000, None, 3196000, None),
    ]),
    ("단가대비표", [
        ("1. 단 가 대 비 표",),
        ("코  드", "품      명", "규격", "단위", "재  료  비", None, None, None, None, None, None, None, None, None, None,
         "노 무 비", "경    비", None, None, None, None, None, "번  호"),
        (None, None, None, None, "조달단가", "PAGE", "물가자료", "PAGE", "물가정보", "PAGE", "유통물가", "PAGE", "조사가격", "PAGE", "적용단가",
         None, "시설단가", "물가자료", "물가정보", "조사가격1", "조사가격2", "적용단가", None),
        ("X1", "잔토처리", "토사", "㎡", 0, None, 0, None, 0, None, 196, "표준시장단가", 0, None, 196, 361, 247, 0, 0, 0, 0, 247, "자재 6"),
        ("X2", "공사현수막", "900*1800㎜", "EA", 0, None, 0, None, 0, None, 0, None, 70000, None, 70000, 0, 0, 0, 0, 0, 0, 0, "자재 1"),
        ("X3", "굴착기(무한궤도)", "0.7㎥", "대", 0, None, 0, None, 0, None, 0, None, 0, None, 0, 0, 0, 0, 0, 0, 0, 115116, "자재 2"),
        ("X4", "품질관리활동비", "초급품질관리기술인", "인", 0, None, 0, None, 0, None, 0, None, 0, None, 0, 167155, 167155, 0, 0, 0, 0, 167155, "노임 13"),
        ("X5", "코너후레싱", "0.5T", "M", 0, None, 0, None, 0, None, 0, None, 8000, None, 8000, 8000, 0, 0, 0, 0, 0, 0, "자재 55"),
    ]),
    ("일위대가", [
        ("품명", "규격", "단위", "재료비단가", "노무비단가", "경비단가", "계단가"),
        ("거푸집", "합판 3회", "㎡", 8000, 20000, 500, 28500),
        ("거푸집", "합판 3회", "㎡", 8000, 20000, 500, 28500),
        ("거푸집", "합판 3회", "㎡", 8000, 20000, 500, 28500),
        ("철근가공조립", "보통", "ton", 0, 650000, 12000, 662000),
    ]),
])
print("A 조달청 표준 꼴")
g = collect.xlsx_price_rows(A)
봄("A 열림", isinstance(g, list), g)
봄("터파기 = 합계 단가 2,400(재료 0 + 노무 1,500 + 경비 900 — 두 번 안 셈)", [r[3] for r in 찾기(g, "터파기")] == [2400.0], 찾기(g, "터파기"))
봄("레미콘 = 90,000", [r[3] for r in 찾기(g, "레미콘")] == [90000.0], 찾기(g, "레미콘"))
봄("소계 · «1. 토공»(식) 은 품목 아님", not 찾기(g, "소계") and not 찾기(g, "1. 토공"))
봄("단가대비표 잔토처리 = 196 + 361 + 247 = 804", [r[3] for r in 찾기(g, "잔토처리")] == [804.0], 찾기(g, "잔토처리"))
봄("단가대비표 현수막 = 적용단가 70,000(조사가격 70,000 은 안 더함)", [r[3] for r in 찾기(g, "공사현수막")] == [70000.0], 찾기(g, "공사현수막"))
봄("단가대비표 굴착기 = 경비 적용단가 115,116", [r[3] for r in 찾기(g, "굴착기(무한궤도)")] == [115116.0], 찾기(g, "굴착기(무한궤도)"))
봄("노임 품목은 노무비 · 경비 두 칸에 같은 노임 → 한 번: 품질관리활동비 167,155", [r[3] for r in 찾기(g, "품질관리활동비")] == [167155.0], 찾기(g, "품질관리활동비"))
봄("자재 품목 재료 8,000 + 노무 8,000 은 진짜 합 16,000", [r[3] for r in 찾기(g, "코너후레싱")] == [16000.0], 찾기(g, "코너후레싱"))
봄("공종별집계표(공종 합계)는 안 뽑음", not [r for r in g if r[4] == "공종별집계표"], [r for r in g if r[4] == "공종별집계표"])
봄("일위대가 같은 줄 세 번 → 한 번", len(찾기(g, "거푸집")) == 1 and 찾기(g, "거푸집")[0][3] == 28500.0, 찾기(g, "거푸집"))
봄("철근가공조립 = 계단가 662,000", [r[3] for r in 찾기(g, "철근가공조립")] == [662000.0], 찾기(g, "철근가공조립"))
봄("표지는 안 봄", not [r for r in g if r[4] == "표지"])
봄("A «단가 있음»", collect.xlsx_has_price(A) is True)

# ── B 한 줄 머리 · 공종 머리 · 공사설정 ─────────────────────────────
B = 만들기("B_가상_한줄.xlsx", [
    ("공사설정", [("항목", "규격", "단위", "단가"), ("고용보험료율", "", "%", 1.15), ("산재보험료율", "", "%", 3.56),
                ("국민연금", "", "%", 4.5), ("건강보험", "", "%", 3.595), ("노인장기요양", "", "%", 13.14), ("안전관리비", "", "%", 2.07)]),
    ("설계내역서", [
        ("품명", "규격", "단위", "수량", "단가", "금액"),
        ("Ⅰ. 건축공사", "", "식", 1, 250000000, 250000000),
        ("1-2.기계설비", "", "", None, 120000000, None),
        ("가. 공사비", "", "식", 1, 300000000, 300000000),
        ("에스컬레이터", "H:9250 30도", "대", 2, 180000000, 360000000),
        ("보도블럭", "200*200*60", "㎡", 400, 23500, 9400000),
        ("경계석", "화강석 150*250", "m", 120, 41000, 4920000),
        ("2.5SQ 전선", "F-CV", "m", 300, 1200, 360000),
        ("안전시설비", "", "식", 1, 1500000, 1500000),
        ("[BP01 소블록]", "", "식", 1, 728902386, 728902386),
        ("조달수수료", "재료비의", "%", 0.5, 109082710, 545413),
    ]),
])
print("B 한 줄 머리")
g = collect.xlsx_price_rows(B)
봄("공사설정 시트(보험료율 «단가» 칸)는 안 뽑음", not [r for r in g if r[4] == "공사설정"], [r for r in g if r[4] == "공사설정"])
봄("«Ⅰ. 건축공사» «1-2.기계설비» «가. 공사비» (식 · 빈 단위) 는 안 뽑음",
   not 찾기(g, "Ⅰ. 건축공사") and not 찾기(g, "1-2.기계설비") and not 찾기(g, "가. 공사비"), [r[0] for r in g])
봄("값이 큰 진짜 품목(에스컬레이터 1억 8천 · 대)은 남김", [r[3] for r in 찾기(g, "에스컬레이터")] == [180000000.0])
봄("보도블럭 23,500 · 경계석 41,000", [r[3] for r in 찾기(g, "보도블럭")] == [23500.0] and [r[3] for r in 찾기(g, "경계석")] == [41000.0])
봄("«2.5SQ 전선»(단위 m)은 숫자로 시작해도 품목", [r[3] for r in 찾기(g, "2.5SQ 전선")] == [1200.0], 찾기(g, "2.5SQ 전선"))
봄("«[BP01 소블록]»(대괄호 묶음 머리 · 식)은 안 뽑음", not 찾기(g, "[BP01 소블록]"))
봄("«조달수수료 · %» 요율 줄은 안 뽑음", not 찾기(g, "조달수수료"))
봄("«안전시설비 1식»(번호 없음)은 품목", [r[3] for r in 찾기(g, "안전시설비")] == [1500000.0])

# ── C 시트 스무 장 뒤 · 계 단가가 맨 앞 · 자재조서 · 총괄표 ───────────
C = 만들기("C_가상_시트많음.xlsx",
           [("시방서%02d" % i, [("가상 시방 문단 %d" % i,), ("품명", "규격", "단위", "단가"), ("문단", "", "", 1)]) for i in range(1, 21)]
           + [("총괄표(전기)", [("명칭", "규격", "단위", "단가"), ("1.소방공사", "", "식", 286974999), ("가상 설계용역", "", "", 286974999)]),
              ("설계내역서", [
                  ("품  명", "규  격", "단위", "수량", "계 단가", "노무비 단가", "재료비 단가", "경비 단가"),
                  ("강제전선관", "16㎜", "M", 168, 2533, 153, 2380, 0),
                  ("흡음텍스 해체", "", "㎡", 65, 6223, 6042, 181, 0),
              ]),
              ("자재조서", [("품명", "규격", "단위", "단가"), ("가상 배수관", "D300", "본", 85000), ("가상 맨홀뚜껑", "D648", "개", 210000)])])
print("C 시트 많음")
g = collect.xlsx_price_rows(C)
봄("시방서 20장 뒤 설계내역서를 찾음", bool(찾기(g, "강제전선관")), [r[4] for r in g])
봄("계 단가가 맨 앞이면 그것만: 강제전선관 2,533 · 흡음텍스 6,223",
   [r[3] for r in 찾기(g, "강제전선관")] == [2533.0] and [r[3] for r in 찾기(g, "흡음텍스 해체")] == [6223.0], g)
봄("자재조서는 «조서» 여도 뽑음", [r[3] for r in 찾기(g, "가상 배수관")] == [85000.0], [r[4] for r in g])
봄("총괄표는 안 뽑음", not [r for r in g if r[4].startswith("총괄표")], [r for r in g if r[4].startswith("총괄표")])
봄("시방서 문단은 안 뽑음", not 찾기(g, "문단"))

# ── 보관 기록 ─────────────────────────────────────────────────────
print("보관 기록")
V = collect.NAEYEOK_ROWS_VER
v = {"file": "K1_0.xlsx", "n": 500000, "dt": "2026-09-22", "priced": True, "rows": 21, "rv": V, "at": "x"}
d = collect._내림기록(v)
봄("상한으로 내려도 결과(priced · rows · rv · dt)는 남음", d.get("rows") == 21 and d.get("priced") is True and d.get("rv") == V and d.get("dt") == "2026-09-22", d)
봄("내린 것은 file 이 없음(바로 받기 안 붙음) · perm · cap", "file" not in d and d.get("perm") is True and d.get("cap") is True, d)
봄("새 뽑는 법으로 뽑고 내린 것은 다시 안 받음", collect._다시뽑을(d) is False)
봄("옛 뽑는 법(rv 1)으로 뽑고 내린 단가 든 것은 한 번 더 받음", collect._다시뽑을(dict(d, rv=1)) is True)
봄("못 뽑고 내린 것(rows 없음)도 한 번 더 받음", collect._다시뽑을({k: x for k, x in d.items() if k != "rows"}) is True)
봄("단가 없음(priced False)은 다시 안 받음", collect._다시뽑을(dict(d, rv=1, priced=False)) is False)
봄("줄 «내렸음»(-1)은 다시 안 받음", collect._다시뽑을(dict(d, rv=1, rows=-1)) is False)
봄("기간 지나 버린 것(cap 없음)은 다시 안 받음", collect._다시뽑을({"skip": "365일 지남", "perm": True}) is False)

줄곳 = os.path.join(곳, "rows")
os.makedirs(줄곳)
json.dump([["가상", "", "m", 1, "s"]] * 6, open(os.path.join(줄곳, "K2_1.json"), "w", encoding="utf-8"))
json.dump([["가상", "", "m", 1, "s"]] * 3, open(os.path.join(줄곳, "K3_0.json"), "w", encoding="utf-8"))
json.dump([["가상", "", "m", 1, "s"]] * 9, open(os.path.join(줄곳, "K4_0.json"), "w", encoding="utf-8"))
book = {"K2_1": {"skip": "보관 상한(50MB) 초과로 내림"},           # 옛 길로 지워진 기록
        "K3_0": {"skip": "보관 상한(50MB) 초과로 내림"},
        "K4_0": {"file": "K4_0.xlsx", "priced": True, "rows": 9, "rv": V}}   # 멀쩡한 것은 그대로
n = collect._줄기록되살림(book, 줄곳, {"K2_1": "2026-09-22", "K3_0": "2026-09-20"})
봄("지워진 기록 2부 되살림 · 멀쩡한 것은 안 건드림", n == 2 and book["K4_0"] == {"file": "K4_0.xlsx", "priced": True, "rows": 9, "rv": V}, book)
봄("되살린 것: 줄 수 · 날짜 · 옛 뽑는 법(rv 1)", book["K2_1"].get("rows") == 6 and book["K2_1"].get("dt") == "2026-09-22" and book["K2_1"].get("rv") == 1, book["K2_1"])
봄("되살린 6줄짜리는 단가 있음 → 한 번 더 받음 · 3줄짜리는 단가 없음 → 안 받음",
   collect._다시뽑을(book["K2_1"]) is True and book["K3_0"].get("priced") is False and collect._다시뽑을(book["K3_0"]) is False, book)
봄("두 번 돌려도 그대로(이미 되살린 것은 안 셈)", collect._줄기록되살림(book, 줄곳, {}) == 0)

# 정정 공고 겹침
print("목록 겹침")
옛 = ["설계내역서", "가상.xlsx", "u1", "가상 공사", "가상군", "2026-10-12", "R26BK0000001", "", "/naeyeok/a.xlsx", 1, 30, "R26BK0000001_0"]
새 = ["설계내역서", "가상.xlsx", "u2", "가상 공사", "가상군", "2026-10-16", "R26BK0000001", "", "", -1, 0, ""]
봄("새 것에 단가 줄 · 파일이 없으면 옛 것이 낫다", collect._더나은줄(옛, 새) is True and collect._더나은줄(새, 옛) is False)
봄("둘 다 같으면 바꾸지 않음(최신 그대로)", collect._더나은줄(list(새), list(새)) is False)

# ── 회차 흉내 — collect.py main() 안의 fetch_naeyeok_files 를 그대로 꺼내 가짜 나라장터로 돌립니다 ─────────
print("회차 흉내(받기 → 뽑기 → 상한으로 내리기)")
import ast  # noqa: E402
import io  # noqa: E402
import textwrap  # noqa: E402

원문 = open(collect.__file__, encoding="utf-8").read()
나무 = ast.parse(원문)
main_ = [n for n in 나무.body if isinstance(n, ast.FunctionDef) and n.name == "main"][0]
fn_ = [n for n in ast.walk(main_) if isinstance(n, ast.FunctionDef) and n.name == "fetch_naeyeok_files"][0]
몸 = textwrap.dedent("\n".join(원문.splitlines()[fn_.lineno - 1:fn_.end_lineno]))
st = os.path.join(곳, "store")
os.makedirs(st)


def 가상엑셀(i):
    b = 만들기("g%d.xlsx" % i, [("공종별내역서", [("품명", "규격", "단위", "수량", "단가", "금액")]
                                + [("가상 품목 %d-%d" % (i, k), "규격 %d" % k, "m", 10, 1000 * i + k, 10000 * i) for k in range(8)])])
    return open(b, "rb").read()


몸통 = {"https://g2b.invalid/%d" % i: 가상엑셀(i) for i in range(1, 7)}
두드림 = []


class 가짜응답:
    def __init__(self, body, code=200):
        self.content, self.status_code = body, code


class 가짜requests:
    @staticmethod
    def get(url, **kw):
        두드림.append(url)
        return 가짜응답(몸통[url]) if url in 몸통 else 가짜응답(b"no", 500)


한부 = max(len(x) for x in 몸통.values())
판 = dict(vars(collect))
판.update(NAEYEOK_DIR=os.path.join(st, "naeyeok"), NAEYEOK_ROWS_DIR=os.path.join(st, "naeyeok_rows"),
         NAEYEOK_BOOK=os.path.join(st, "naeyeok_files.json"), NAEYEOK_KEEP_MB=(3.5 * 한부) / 1024 / 1024,
         NAEYEOK_FETCH=100, NAEYEOK_BUDGET_S=60, NAEYEOK_ROWS_BUDGET_S=60, NAEYEOK_KEEP_DAYS=36500,
         NO_NET=False, DIAG={}, requests=가짜requests, built="r1")
판["time"] = type("T", (), {"time": staticmethod(__import__("time").time), "sleep": staticmethod(lambda s: None)})
exec(compile(몸, "fetch_naeyeok_files", "exec"), 판)
가게 = {"con": {"R26BK900000%d" % i: {"no": "R26BK900000%d" % i, "dt": "2026-10-%02d" % i,
                                      "docs": [["가상 설계내역서 %d.xlsx" % i, "https://g2b.invalid/%d" % i]]} for i in range(1, 7)}}
책 = lambda: json.load(open(판["NAEYEOK_BOOK"], encoding="utf-8"))  # noqa: E731

판["fetch_naeyeok_files"](가게)
b1 = 책()
봄("1회차: 여섯 부를 받음", len(두드림) == 6, 두드림)
남은 = sorted(k for k, v in b1.items() if v.get("file"))
내린 = sorted(k for k, v in b1.items() if v.get("cap"))
봄("상한(세 부 반)에 걸려 오래된 셋을 내림 · 새것 셋은 남음", 남은 == ["R26BK9000004_0", "R26BK9000005_0", "R26BK9000006_0"] and 내린 == ["R26BK9000001_0", "R26BK9000002_0", "R26BK9000003_0"], b1)
봄("내린 것도 결과가 남음(단가 있음 · 8줄 · 새 뽑는 법 · 날짜)",
   all(b1[k].get("priced") is True and b1[k].get("rows") == 8 and b1[k].get("rv") == V and b1[k].get("dt") for k in 내린), {k: b1[k] for k in 내린})
봄("뽑은 줄 파일은 여섯 부 모두 있음", sorted(os.listdir(판["NAEYEOK_ROWS_DIR"])) == ["R26BK900000%d_0.json" % i for i in range(1, 7)])
줄1 = json.load(open(os.path.join(판["NAEYEOK_ROWS_DIR"], "R26BK9000001_0.json"), encoding="utf-8"))
봄("줄 파일 값 = 가상 품목 1-0 · 1,000", 줄1[0][:4] == ["가상 품목 1-0", "규격 0", "m", 1000.0], 줄1[0])

두드림.clear()
판["built"] = "r2"
판["fetch_naeyeok_files"](가게)
b2 = 책()
봄("2회차: 내린 것을 다시 받지 않음(헛수고 없음)", 두드림 == [], 두드림)
봄("2회차: 기록 그대로", all(b2[k] == b1[k] for k in 내린), {k: b2[k] for k in 내린})

# 옛 길로 기록이 지워진 것(전에 실제로 그랬음) — 줄 파일만 남음
b2["R26BK9000001_0"] = {"skip": "보관 상한(50MB) 초과로 내림"}
b2["R26BK9000002_0"] = {"skip": "보관 상한(50MB) 초과로 내림"}
json.dump(b2, open(판["NAEYEOK_BOOK"], "w", encoding="utf-8"), ensure_ascii=False)
두드림.clear()
판["built"] = "r3"
판["fetch_naeyeok_files"](가게)
b3 = 책()
봄("3회차: 지워진 둘은 되살려 한 번 더 받음(새 뽑는 법으로 다시 뽑으려고)", sorted(두드림) == ["https://g2b.invalid/1", "https://g2b.invalid/2"], 두드림)
봄("3회차: 다시 뽑아 새 뽑는 법 · 8줄 · 다시 내림", all(b3[k].get("rv") == V and b3[k].get("rows") == 8 and b3[k].get("cap") and not b3[k].get("file")
                                            for k in ("R26BK9000001_0", "R26BK9000002_0")), {k: b3[k] for k in ("R26BK9000001_0", "R26BK9000002_0")})
봄("3회차: 새것 셋은 그대로 남음", sorted(k for k, v in b3.items() if v.get("file")) == 남은)
두드림.clear()
판["built"] = "r4"
판["fetch_naeyeok_files"](가게)
봄("4회차: 또 받지 않음(끝없이 받고 내리지 않음)", 두드림 == [], 두드림)
진단 = 판["DIAG"].get("naeyeok_fetch") or {}
봄("진단에 «줄 기록 되살림» 칸", "줄 기록 되살림" in 진단, 진단)

shutil.rmtree(곳, ignore_errors=True)
print("\n%s 내역서 단가 시험 %d개 중 %d 맞음 · %d 틀림" % ("❌" if 실패 else "✅", 통과 + 실패, 통과, 실패))
sys.exit(1 if 실패 else 0)
