# -*- coding: utf-8 -*-
"""자재 공급원 승인 현황 — 원본 틀(현장명 · 품명 · 규격 · 공급원 · 승인일 · 비고)을 새로 만든 것.
■ 수식: 번호 자동 · 승인 건수 · 가장 최근 승인일 · 승인일이 비었으면 «미승인» 표시."""
import datetime

from fb import F, I

SLUG = "o-jajae-hyeonhwang"
TITLE = "자재 공급원 승인 현황"
WHERE = "orig"
PREV = [(1, "빈 서식"), (2, "작성 예시")]
PAGES = 1
NSHEETS = 1
SHORT = "승인받은 자재 공급원을 한눈에 정리하는 현황표입니다. 번호·승인 건수·최근 승인일이 저절로 채워지고, 승인일이 빈 줄은 «미승인» 으로 표시됩니다."
NOTE = "품명을 적으면 번호가 붙고, 승인일이 비어 있으면 «미승인» 으로 표시됩니다."

D = datetime.date
W = [6, 18, 20, 18, 12, 8, 14]
N = 7
ROWS = 25
EX = [("PC 암거", "1.5m × 1.5m × 1.0m", "예시콘크리트(주)", D(2026, 4, 6), ""), ("레미콘", "25-24-150", "예시레미콘(주)", D(2026, 3, 30), ""),
      ("철근", "SD400 D10~D25", "예시철강(주)", D(2026, 3, 30), "KS"), ("PE 이중벽관", "D300", "예시관산업(주)", D(2026, 4, 13), ""),
      ("보도블록", "300×300×60", "예시블록(주)", None, "시험성적서 보완 중"), ("아스콘", "WC-1(표층)", "예시아스콘(주)", D(2026, 5, 4), "")]


def draw(bk, ex):
    p = bk.page("현황", W, ex=ex, fit_height=1, sheetname="현황" if not ex else "예시-현황", margins=(0.5, 0.5, 0.5, 0.5))
    p.title("자재 공급원 승인 현황", h=40)
    p.gap(4)
    p.row([(1, "현장명", {"kind": "label"}), (3, I("현장명", ex="가나지구 배수로 정비공사")), (1, "작성일", {"kind": "label"}),
           (2, I("작성일", ex=D(2026, 5, 6), fmt="ymd", align="center"))], h=26)
    p.gap(6)
    H = {"kind": "head"}
    p.row([(1, "번호", H), (1, "품   명", H), (1, "규   격", H), (1, "공 급 원", H), (1, "승 인 일", H), (1, "상태", H), (1, "비   고", H)], h=26)
    for i in range(1, ROWS + 1):
        e = EX[i - 1] if i <= len(EX) else (None,) * 5
        p.row([(1, F(f"번호#{i}", f'=IF({{품명#{i}}}="","",COUNTA({{품명#1}}:{{품명#{i}}}))', align="center")),
               (1, I(f"품명#{i}", ex=e[0])), (1, I(f"규격#{i}", ex=e[1], size=9.5)), (1, I(f"공급원#{i}", ex=e[2], size=9.5)),
               (1, I(f"승인일#{i}", ex=e[3], fmt="ymd", align="center")),
               (1, F(f"상태#{i}", f'=IF({{품명#{i}}}="","",IF(N({{승인일#{i}}})=0,"미승인","승인"))', align="center", size=9)),
               (1, I(f"비고#{i}", ex=e[4] or None, size=9))], h=22)
    from openpyxl.formatting.rule import Rule
    from openpyxl.styles import Font
    from openpyxl.styles.differential import DifferentialStyle
    top = p.k["상태#1"]
    p.ws.conditional_formatting.add(f"{top}:{p.k[f'상태#{ROWS}']}", Rule(type="expression", formula=[f'{top}="미승인"'],
                                    dxf=DifferentialStyle(font=Font(color="DC2626", bold=True))))
    p.k["품명[]"] = f"{p.k['품명#1']}:{p.k[f'품명#{ROWS}']}"
    p.k["승인일[]"] = f"{p.k['승인일#1']}:{p.k[f'승인일#{ROWS}']}"
    S = {"kind": "sum"}
    p.row([(2, "계", S), (2, F("건수", '=IF(COUNTA({품명[]})=0,"","총 "&COUNTA({품명[]})&"건 · 승인 "&COUNT({승인일[]})&"건 · 미승인 "&(COUNTA({품명[]})-COUNT({승인일[]}))&"건")',
                               align="center", bold=True)),
           (2, F("최근승인", '=IF(COUNT({승인일[]})=0,"",MAX({승인일[]}))', fmt='"최근 승인 "yyyy. m. d.', align="center")), (1, "", S)], h=26)
    p.end_print()
    return p


def expect(inp):
    e = {}
    n = ok = 0
    last = None
    for i in range(1, ROWS + 1):
        nm = inp.get(f"품명#{i}")
        if nm:
            n += 1
            e[f"번호#{i}"] = n
            d = inp.get(f"승인일#{i}")
            e[f"상태#{i}"] = "승인" if d else "미승인"
            if d:
                ok += 1
                last = d if last is None or d > last else last
        else:
            e[f"번호#{i}"] = ""
            e[f"상태#{i}"] = ""
    e["건수"] = f"총 {n}건 · 승인 {ok}건 · 미승인 {n - ok}건"
    e["최근승인"] = last
    return e
