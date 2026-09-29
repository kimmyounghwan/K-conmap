# -*- coding: utf-8 -*-
"""검측체크리스트(SHEET PILE) — 원본 틀(공종 CODE · 위치 · 공종 · 공사량 · 검사항목 · 검사기준 · 합격/불합격 · 조치사항 · 점검/검측 서명, 두 장)을 새로 만든 것.
■ 원본 첫 장은 번호가 8 → 10 으로 9 가 빠져 있어 1~10 으로 다시 매겼습니다(항목 글은 그대로).
■ 합격·불합격 칸은 목록에서 ○ 를 고릅니다.
■ 수식: 합격 · 불합격 · 미확인 건수와 종합 · 한 항목에 둘 다 표시 · 불합격인데 조치사항이 빈 것 · 검측일이 점검일보다 빠른 것 안내."""
import datetime

from fb import F, I

SLUG = "o-geomcheuk-sheetpile"
TITLE = "검측체크리스트(SHEET PILE)"
WHERE = "orig"
PREV = [(1, "첫째 장 — 빈 서식"), (3, "첫째 장 — 작성 예시")]
PAGES = 2
NSHEETS = 2
MULTI = True
SHORT = ("강널말뚝(SHEET PILE) 검측 체크리스트 두 장입니다. 합격·불합격을 ○ 로 고르면 건수와 종합이 저절로 나오고, "
         "불합격인데 조치사항이 비었거나 한 항목에 둘 다 표시했으면 알려 줍니다.")
NOTE = "합격·불합격 칸은 목록에서 ○ 를 고르세요. 원본 첫 장의 빠진 번호(9)는 1~10 으로 다시 매겼습니다."

D = datetime.date
W = [5, 31, 16, 8, 8, 15, 6]
N = 7
L = {"kind": "label"}
HD = {"kind": "head"}
P1 = [("SHEET PILE의 규격확인 및 손상여부(단면 손실 포함)는 점검 하였는가.", "육안검사"),
      ("타입장비는 현장에 적합한가.", ""),
      ("SHEET PILE 근입 깊이는 적정한가.", "설계도면\n구조계산서\n참조"),
      ("SHEET PILE의 수직도는 적정한가.", "1/200이하"),
      ("SHEET PILE 설치시에 인접지반 및 시설물에 피해는 주지않는가.", "육안검사"),
      ("GUIDE BEAM의 규격 및 설치 상태는 설계도면과 일치하는가.", "설계도면\n참조"),
      ("줄파기의 되메우기시에 양질의 토사 사용 여부의 확인.", "육안검사"),
      ("연결부의 이음 상태는 양호한가.", "육안검사"),
      ("근입된 SHEET PILE의 위치 및 선형은 적정한가.", "설계도면\n참조"),
      ("SHEET PILE 이음부의 용접 및 설치상태는 양호한가.", "설계도면\n참조")]
P2 = [("SHEET PILE의 규격확인 및 손상여부(단면 손실 포함)는 점검 하였는가.", "설계도면 참조\n육안검사"),
      ("연결부재의 규격 및 손상 여부는 사전에 확인하였는가.", "육안검사"),
      ("Bolt 및 Nut의 규격 및 타공 간격은 적합한가.", "M22*80(HTB F10T)\nC.T.C 1,000"),
      ("SHEET PILE 근입깊이는 적정한가.", "설계도면\n구조계산서\n참조"),
      ("SHEET PILE의 수직도는 적정한가.", "1/200이하"),
      ("SHEET PILE 설치시 기시공된 전면부 SHEET PILE, 인접지반, 시설물에 피해는 주지 않는가.", "육안검사")]
PAGES_DEF = [("검측1", P1), ("검측2", P2)]
EX_HEAD = {"검측1": ("T-03-02", "STA.0+120 ~ 0+200 좌측", "가시설공(SHEET PILE 타입)", "SP-Ⅲ L=10.5m 82매"),
           "검측2": ("T-03-03", "STA.0+120 ~ 0+200 좌측", "가시설공(SHEET PILE 연결)", "SP-Ⅲ 82매 · HTB 164개")}
EX_FAIL = {"검측1": {4: "재타입 후 수직도 1/250 확인(5/8)"}, "검측2": {}}
EX_DATE = {"검측1": (D(2026, 5, 7), D(2026, 5, 8)), "검측2": (D(2026, 5, 12), D(2026, 5, 12))}


def page(bk, ex, lg, items):
    p = bk.page(lg, W, ex=ex, fit_height=1, sheetname=lg if not ex else "예시-" + lg, margins=(0.5, 0.5, 0.45, 0.45))
    p.dv_list("○", ["○"])
    p.title("검 측  체 크 리 스 트", h=42)
    p.gap(6)
    e = EX_HEAD[lg] if ex else (None,) * 4
    p.row([(2, "공종 CODE №", L), (1, I("코드", ex=e[0], align="center")), (2, "위치 및 부위", L), (2, I("위치", ex=e[1], size=9))], h=28)
    p.row([(2, "공종(세부공종)", L), (1, I("공종", ex=e[2], size=9)), (2, "공   사   량", L), (2, I("공사량", ex=e[3], size=9))], h=28)
    p.gap(8)
    p.row([(2, "검 사 항 목", dict(HD, rs=2)), (1, "검 사 기 준\n(시방서 또는 도면 등)", dict(HD, rs=2, size=9)), (2, "검 사 결 과", HD),
           (2, "조 치 사 항", dict(HD, rs=2))], h=24)
    p.row([(1, "합 격", HD), (1, "불합격", HD)], h=22)
    n = len(items)
    fail = EX_FAIL[lg] if ex else {}
    for i, (t, std) in enumerate(items, 1):
        ok = fail.get(i) is None
        p.row([(1, f"{i}.", {"kind": "ctext", "size": 9.5}), (1, t, {"kind": "text", "size": 9.5}),
               (1, std, {"kind": "ctext", "size": 9}),
               (1, I(f"합격#{i}", ex="○" if ok else None, dv="○", align="center", size=12)),
               (1, I(f"불합격#{i}", ex=None if ok else "○", dv="○", align="center", size=12)),
               (2, I(f"조치#{i}", ex=fail.get(i), size=9))], h=40 if n > 6 else 52)
    for k in ("합격", "불합격", "조치"):
        p.k[f"{k}[]"] = f"{p.k[k + '#1']}:{p.k[f'{k}#{n}']}"
    p.row([(3, "계", {"kind": "sum"}), (1, F("합격수", '=COUNTIF({합격[]},"○")', fmt='0"건";-0"건";""', align="center", bold=True)),
           (1, F("불합격수", '=COUNTIF({불합격[]},"○")', fmt='0"건";-0"건";""', align="center", bold=True)),
           (2, F("종합", f'=IF({{합격수}}+{{불합격수}}=0,"",IF({{불합격수}}>0,"불합격 "&{{불합격수}}&"건 — 조치 후 재검측",'
                        f'IF({{합격수}}<{n},"미확인 "&({n}-{{합격수}})&"건","전 항목 합격")))', align="center", bold=True, size=9.5))], h=26)
    p.row([(N, F("경고", '=IF(COUNTIFS({합격[]},"○",{불합격[]},"○")>0,"⚠ 한 항목에 합격·불합격을 함께 표시한 곳이 "&COUNTIFS({합격[]},"○",{불합격[]},"○")&"곳 있습니다.",'
                      'IF(COUNTIFS({불합격[]},"○",{조치[]},"")>0,"⚠ 불합격 항목 "&COUNTIFS({불합격[]},"○",{조치[]},"")&"건의 조치사항을 적으세요.",""))', align="left"),
           {"kind": "warn"})], h=17)
    p.gap(6)
    d1, d2 = EX_DATE[lg] if ex else (None, None)
    blank_d = "20     년      월      일"
    p.row([(2, "시공자 점검일자", L), (1, I("점검일", ex=d1, fmt="date", blank=blank_d, align="center", size=9.5)), (2, "점 검 직 원", L),
           (1, I("점검직원", ex="이공무" if ex else None, align="center")), (1, "(인)", {"kind": "ctext", "size": 9})], h=30)
    p.row([(2, "감리원 검측일자", L), (1, I("검측일", ex=d2, fmt="date", blank=blank_d, align="center", size=9.5)), (2, "검측감리원", L),
           (1, I("검측감리원", ex="김감리" if ex else None, align="center")), (1, "(인)", {"kind": "ctext", "size": 9})], h=30)
    p.row([(N, F("일자경고", '=IF(AND(N({점검일})>0,N({검측일})>0,{검측일}<{점검일}),"⚠ 감리원 검측일이 시공자 점검일보다 빠릅니다 — 날짜를 확인하세요.","")',
                 align="left"), {"kind": "warn"})], h=17)
    p.end_print()
    p.after_note(["합격·불합격 칸은 목록에서 ○ 를 고르세요(지우려면 Delete). 하늘색 칸 = 자동(건수 · 종합)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 사람)."])
    return p


def draw(bk, ex):
    for lg, items in PAGES_DEF:
        page(bk, ex, lg, items)


def expect(pages):
    out = {}
    for lg, items in PAGES_DEF:
        inp = pages[lg]
        n = len(items)
        ok = sum(1 for i in range(1, n + 1) if inp.get(f"합격#{i}") == "○")
        ng = sum(1 for i in range(1, n + 1) if inp.get(f"불합격#{i}") == "○")
        both = sum(1 for i in range(1, n + 1) if inp.get(f"합격#{i}") == "○" and inp.get(f"불합격#{i}") == "○")
        nofix = sum(1 for i in range(1, n + 1) if inp.get(f"불합격#{i}") == "○" and not inp.get(f"조치#{i}"))
        if ok + ng == 0:
            tot = ""
        elif ng:
            tot = f"불합격 {ng}건 — 조치 후 재검측"
        elif ok < n:
            tot = f"미확인 {n - ok}건"
        else:
            tot = "전 항목 합격"
        warn = (f"⚠ 한 항목에 합격·불합격을 함께 표시한 곳이 {both}곳 있습니다." if both else
                f"⚠ 불합격 항목 {nofix}건의 조치사항을 적으세요." if nofix else "")
        d1, d2 = inp.get("점검일"), inp.get("검측일")
        out[lg] = {"합격수": ok, "불합격수": ng, "종합": tot, "경고": warn,
                   "일자경고": "⚠ 감리원 검측일이 시공자 점검일보다 빠릅니다 — 날짜를 확인하세요." if (d1 and d2 and d2 < d1) else ""}
    return out
