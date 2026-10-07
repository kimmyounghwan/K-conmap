# -*- coding: utf-8 -*-
"""품질시험ㆍ검사실적 보고서 — 건설공사 사업관리방식 검토기준 및 업무수행지침 [별지 제18호 서식] 원본 틀 그대로 (G177 · 2026-10-07)

소장님: 「위 서식 만들자」(카페 질문 «품질서류» 9번 실적보고) → 법제처 원본(PDF) 칸 그대로.
■ 지침: 공사감독자 · 건설사업관리기술인은 시공자로부터 매월 말(또는 기성부분 검사 · 예비준공검사 신청 때)
  품질시험ㆍ검사실적을 종합한 이 보고서를 받아 확인합니다.
■ 칸(원본 차례 그대로): 공종 · 시험ㆍ검사 종목 · 계획시험ㆍ검사회수 / 전월까지 · 금월 · 누계 시험ㆍ검사회수(각 실시 · 합격 · 불합격 · 재시험).
  원본 12줄 그대로 · A4 가로.
■ 수식: 누계 = 전월까지 + 금월(둘 다 비면 빈칸). 인쇄 밖 합계 줄 · 진척률(누계 실시 ÷ 계획) · 맞춰 보기(합격 + 불합격 ≠ 실시 · 누계 실시 > 계획)."""
from fb import F, I

SLUG = "o-pumjil-siljeok"
TITLE = "품질시험ㆍ검사실적 보고서"
WHERE = "orig"
PREV = [(1, "빈 서식"), (2, "작성 예시")]
PAGES = 1
NSHEETS = 1
SHORT = ("품질시험ㆍ검사실적 보고서 — 건설공사 사업관리방식 검토기준 및 업무수행지침 [별지 제18호 서식] 원본 틀 그대로(A4 가로). "
         "전월까지 · 금월 횟수를 적으면 누계가 저절로 더해지고, 진척률과 안 맞는 줄을 알려 줍니다.")
NOTE = ("법제처 원본 서식(업무수행지침 별지 제18호) 칸 그대로입니다. 매월 말(또는 기성 · 예비준공 검사 신청 때) "
        "공사감독자 · 건설사업관리기술인에게 냅니다. 다음 달에는 이번 «누계»를 «전월까지»에 옮겨 적으면 됩니다.")

ROWS = 12
K4 = ("실시", "합격", "불합격", "재시험")
#     공종 종목 계획 | 전월까지 4 | 금월 4 | 누계 4
W = [11, 19, 8.4] + [6.9] * 12
N = len(W)
H = {"kind": "head", "size": 9}
EX = [("토공", "성토 다짐도\n(현장밀도)", 40, (20, 19, 1, 1), (4, 4, 0, 0)),
      ("토공", "흙의 다짐시험(실내)", 4, (2, 2, 0, 0), (1, 1, 0, 0)),
      ("포장공", "보조기층 다짐도", 12, (4, 4, 0, 0), (2, 2, 0, 0)),
      ("구조물공", "레미콘 슬럼프 · 공기량\n· 염화물", 30, (14, 14, 0, 0), (4, 4, 0, 0)),
      ("구조물공", "레미콘 압축강도", 30, (12, 12, 0, 0), (3, 3, 0, 0)),
      ("구조물공", "철근 인장 · 굽힘", 3, (2, 2, 0, 0), None),
      ("배수공", "PE관 외관 · 치수", 6, (3, 3, 0, 0), (1, 1, 0, 0))]


def draw(bk, ex):
    p = bk.page("품질시험ㆍ검사실적 보고서", W, ex=ex, landscape=True, fit_height=1,
                sheetname="실적 보고서" if not ex else "작성 예시", margins=(0.45, 0.45, 0.45, 0.45))
    p.row([(N, "[별지 제18호 서식]", {"kind": "free", "size": 9, "bold": True})], h=18)
    p.row([(N, "품질시험ㆍ검사실적 보고서", {"kind": "title", "size": 17})], h=40)
    p.row([(1, "공  종", dict(H, rs=2)), (1, "시험ㆍ검사\n종  목", dict(H, rs=2)), (1, "계획시험\nㆍ\n검사회수", dict(H, rs=2)),
           (4, "전월까지 시험ㆍ검사회수", H), (4, "금월 시험ㆍ검사회수", H), (4, "누계 시험ㆍ검사회수", H)], h=24)
    p.row([(1, x, H) for x in ("실  시", "합  격", "불합격", "재시험") * 3], h=24, start=4)
    first = p.r
    for i in range(1, ROWS + 1):
        e = EX[i - 1] if (ex and i <= len(EX)) else (None, None, None, None, None)
        전 = e[3] or (None,) * 4
        금 = e[4] or (None,) * 4
        cells = [(1, I(f"공종#{i}", ex=e[0], align="center", size=9.5)),
                 (1, I(f"종목#{i}", ex=e[1], align="center", size=8.5)),
                 (1, I(f"계획#{i}", ex=e[2], fmt="#,##0", align="center", size=10))]
        cells += [(1, I(f"전{k}#{i}", ex=전[j], fmt="#,##0", align="center", size=10)) for j, k in enumerate(K4)]
        cells += [(1, I(f"금{k}#{i}", ex=금[j], fmt="#,##0", align="center", size=10)) for j, k in enumerate(K4)]
        cells += [(1, F(f"누{k}#{i}", f'=IF(AND({{전{k}#{i}}}="",{{금{k}#{i}}}=""),"",N({{전{k}#{i}}})+N({{금{k}#{i}}}))',
                        fmt="#,##0", align="center", size=10)) for k in K4]
        p.row(cells, h=30)
    last = p.r - 1
    from openpyxl.formatting.rule import Rule
    from openpyxl.styles import Font
    from openpyxl.styles.differential import DifferentialStyle
    red = DifferentialStyle(font=Font(color="DC2626", bold=True))
    for c0 in ("D", "H", "L"):          # 실시 칸: 합격 + 불합격 ≠ 실시면 빨간 글씨
        c1 = chr(ord(c0) + 1)
        c2 = chr(ord(c0) + 2)
        p.ws.conditional_formatting.add(f"{c0}{first}:{c0}{last}", Rule(type="expression", dxf=red,
                                        formula=[f'AND(ISNUMBER({c0}{first}),COUNT({c1}{first},{c2}{first})>0,N({c1}{first})+N({c2}{first})<>{c0}{first})']))
    p.end_print()
    p.gap(8)
    합 = lambda k: (1, F(f"{k}계", f'=IF(COUNT({{{k}#1}}:{{{k}#{ROWS}}})=0,"",SUM({{{k}#1}}:{{{k}#{ROWS}}}))',
                         fmt="#,##0", align="center", size=10, bold=True))
    p.row([(2, "합계 (인쇄 안 됨)", {"kind": "sum"}), 합("계획")] + [합(f"전{k}") for k in K4] + [합(f"금{k}") for k in K4] + [합(f"누{k}") for k in K4], h=24)
    bad1 = "+".join(f'IF(AND(ISNUMBER({{{a}실시#{i}}}),COUNT({{{a}합격#{i}}},{{{a}불합격#{i}}})>0,'
                    f'N({{{a}합격#{i}}})+N({{{a}불합격#{i}}})<>{{{a}실시#{i}}}),1,0)'
                    for a in ("전", "금", "누") for i in range(1, ROWS + 1))
    bad2 = "+".join(f'IF(AND(ISNUMBER({{계획#{i}}}),ISNUMBER({{누실시#{i}}}),{{누실시#{i}}}>{{계획#{i}}}),1,0)' for i in range(1, ROWS + 1))
    p.row([(3, "합격 + 불합격 ≠ 실시인 칸", {"kind": "label", "size": 9}),
           (1, F("틀린칸", f'=IF(COUNT({{누실시#1}}:{{누실시#{ROWS}}})=0,"",{bad1})', fmt="0", align="center", size=10, bold=True)),
           (3, "누계 실시 > 계획인 줄", {"kind": "label", "size": 9}),
           (1, F("넘친줄", f'=IF(COUNT({{누실시#1}}:{{누실시#{ROWS}}})=0,"",{bad2})', fmt="0", align="center", size=10, bold=True)),
           (3, "진척률(누계 실시 ÷ 계획)", {"kind": "label", "size": 9}),
           (4, F("진척률", '=IF(OR({계획계}="",{누실시계}=""),"",IF({계획계}=0,"",{누실시계}/{계획계}))', fmt="pct1", align="center", size=10, bold=True))], h=24)
    p.row([(3, "맞춰 보기", {"kind": "label", "size": 9}),
           (12, F("맞춰보기", '=IF({틀린칸}="","",IF({틀린칸}+{넘친줄}=0,"✔ 합격 + 불합격 = 실시 · 누계 실시 ≤ 계획",'
                            'IF({틀린칸}>0,"합격 + 불합격 ≠ 실시인 칸 "&{틀린칸}&"곳","")&IF({넘친줄}>0,IF({틀린칸}>0," · ","")&"누계 실시가 계획보다 많은 줄 "&{넘친줄}&"개(계획 보완)","")))',
                 align="left", size=9.5, bold=True))], h=24)
    p.after_note(["하늘색 칸 = 자동(누계 = 전월까지 + 금월 · 합계 · 진척률 · 맞춰 보기 — 합계 아래는 인쇄되지 않음). 실시 칸이 빨간 글씨면 합격 + 불합격이 실시와 다른 칸입니다.",
                  "다음 달에는 이번 «누계» 숫자를 «전월까지»에 옮겨 적고, «금월»만 새로 적으면 됩니다.",
                  "매월 말(또는 기성부분 검사 · 예비준공검사 신청 때) 공사감독자 · 건설사업관리기술인에게 냅니다(업무수행지침)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사)."])
    return p


def expect(inp):
    e = {}
    g = lambda k: inp.get(k)
    for i in range(1, ROWS + 1):
        for k in K4:
            a, b = g(f"전{k}#{i}"), g(f"금{k}#{i}")
            e[f"누{k}#{i}"] = "" if (a is None and b is None) else (a or 0) + (b or 0)
    allv = dict(inp)
    allv.update({k: v for k, v in e.items()})
    tot = {}
    for k in ["계획"] + [f"{a}{x}" for a in ("전", "금", "누") for x in K4]:
        vs = [allv.get(f"{k}#{i}") for i in range(1, ROWS + 1) if allv.get(f"{k}#{i}") not in (None, "")]
        tot[k] = sum(vs) if vs else ""
        e[f"{k}계"] = tot[k]
    e["진척률"] = "" if (tot["계획"] in ("", 0) or tot["누실시"] == "") else tot["누실시"] / tot["계획"]
    b1 = b2 = 0
    for i in range(1, ROWS + 1):
        for a in ("전", "금", "누"):
            s, x, y = allv.get(f"{a}실시#{i}"), allv.get(f"{a}합격#{i}"), allv.get(f"{a}불합격#{i}")
            s = None if s == "" else s
            x = None if x == "" else x
            y = None if y == "" else y
            if s is not None and (x is not None or y is not None) and (x or 0) + (y or 0) != s:
                b1 += 1
        pl, ns = allv.get(f"계획#{i}"), allv.get(f"누실시#{i}")
        if pl is not None and ns not in (None, "") and ns > pl:
            b2 += 1
    if all(allv.get(f"누실시#{i}") in (None, "") for i in range(1, ROWS + 1)):
        e["틀린칸"] = e["넘친줄"] = ""
        e["맞춰보기"] = ""
    elif b1 + b2 == 0:
        e["틀린칸"], e["넘친줄"] = b1, b2
        e["맞춰보기"] = "✔ 합격 + 불합격 = 실시 · 누계 실시 ≤ 계획"
    else:
        e["틀린칸"], e["넘친줄"] = b1, b2
        e["맞춰보기"] = (f"합격 + 불합격 ≠ 실시인 칸 {b1}곳" if b1 else "") + ((" · " if b1 else "") + f"누계 실시가 계획보다 많은 줄 {b2}개(계획 보완)" if b2 else "")
    return e
