# -*- coding: utf-8 -*-
"""주간 공정회의록 — 원본 틀(표지 한 장 + «주간공정 추진 현황 및 계획» 한 장, 가로)을 새로 만든 것.
■ 표지에 공사명·회의일·회사명을 적으면 둘째 장 머리에 저절로 들어갑니다.
■ 수식: 회의일 → 금주 시작일(그 주 월요일) → «전 주(5/4~5/10) · 금 주 · 내 주» 기간 글자 ·
        누계 대비 = 누계 실적 − 누계 계획 (뒤지면 빨간 글자와 안내)."""
import datetime

from fb import F, I

SLUG = "o-jugan-gongjeong"
TITLE = "주간 공정회의록"
WHERE = "orig"
PREV = [(2, "추진 현황 — 빈 서식"), (4, "추진 현황 — 작성 예시"), (3, "표지 — 작성 예시")]
PAGES = 2
NSHEETS = 2
MULTI = True
SHORT = ("주간 공정회의 자료 표지와 공정률·공사 추진 현황(전주·금주·내주)을 적는 양식입니다. "
         "회의일을 적으면 전주·금주·내주 기간이 저절로 적히고, 누계 대비(실적 − 계획)를 셈해 늦으면 알려 줍니다.")
NOTE = "표지에 공사명·회의일·회사명을 적으면 둘째 장에 저절로 들어갑니다. 주는 월요일부터 셉니다 — 다르면 «금주 시작일» 칸에 날짜를 직접 적으세요."

D = datetime.date
W = [10] + [10.5] * 12
N = 13
WKD = 'CHOOSE(WEEKDAY({d}),"일","월","화","수","목","금","토")'
KO_WD = "월화수목금토일"
P2 = '0.00;[Red]-0.00;0.00'
PD = '+0.00;[Red]-0.00;0.00'
L = {"kind": "label"}
H = {"kind": "head"}
FR = {"kind": "free"}
EX_RATE = [("전체분", 3.10, 2.40, 46.20, 42.85, 49.60, "우천 1일(5/7)"), ("5차분", 6.80, 5.90, 71.50, 72.30, 78.00, None)]
EX_TXT = {
    "계획:전주": "○ 배수로 터파기 STA.0+120 ~ 0+200\n○ PC 암거 거치 12개\n○ 되메우기 L=60m",
    "실적:전주": "○ 배수로 터파기 STA.0+120 ~ 0+180 (우천 1일)\n○ PC 암거 거치 10개\n○ 되메우기 L=45m",
    "계획:금주": "○ 터파기 STA.0+180 ~ 0+260\n○ PC 암거 거치 14개(전주 잔여 2개 포함)\n○ 되메우기 L=80m",
    "실적:금주": "○ 터파기 STA.0+180 ~ 0+220 (5/11 ~ 5/12)\n○ PC 암거 거치 6개",
    "계획:내주": "○ 터파기 STA.0+260 ~ 0+340\n○ PC 암거 거치 12개\n○ 보도블록 포장 자재 반입",
}


def _pg(bk, ex, lg):
    return bk.page(lg, W, ex=ex, fit_height=1, landscape=True, sheetname=lg if not ex else "예시-" + lg,
                   margins=(0.5, 0.5, 0.5, 0.5))


def _line(p, style="medium"):
    from openpyxl.styles import Border, Side
    for c in range(3, 12):
        p.ws.cell(row=p.r - 1, column=c).border = Border(bottom=Side(style=style, color="111827"))


def cover(bk, ex):
    p = _pg(bk, ex, "표지")
    p.gap(66)
    p.gap(6)
    _line(p)
    p.row([(2, "", FR), (9, I("공사명", ex="가나지구 배수로 정비공사", blank="공사명", fmt='"「"@"」"', align="center", size=17, bold=True),
                          {"border": False}), (2, "", FR)], h=42)
    p.row([(2, "", FR), (9, "주간  공정회의  자료", {"kind": "cfree", "size": 22, "bold": True}), (2, "", FR)], h=50)
    p.gap(6)
    _line(p)
    p.gap(120)
    p.row([(3, "", FR), (4, I("회의일", ex=D(2026, 5, 13), blank="20       .       .       ", fmt="ymd", align="right", size=15),
                          {"border": False}),
           (2, F("요일", '=IF(N({회의일})=0,"(      )","("&' + WKD.format(d="{회의일}") + '&")")', align="left", size=15, ink=False),
            {"border": False}), (4, "", FR)], h=34)
    p.gap(70)
    p.row([(2, "", FR), (9, I("회사명", ex="예시건설(주)", blank="회사명", align="center", size=16, bold=True), {"border": False}),
           (2, "", FR)], h=34)
    p.end_print()
    p.after_note(["공사명 · 회의일 · 회사명을 적으면 둘째 장(추진 현황) 머리에 저절로 들어갑니다. «공사명» · «회사명» 자리 글자를 지우고 적으세요."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사)."])
    return p


def _period(tag, a, b):
    s = "{금주시작}"
    return (f'="{tag}"&IF(N({s})=0,"(   /   ~   /   )","("&MONTH({s}+{a})&"/"&DAY({s}+{a})&" ~ "&MONTH({s}+{b})&"/"&DAY({s}+{b})&")")')


def status(bk, ex):
    p = _pg(bk, ex, "추진현황")
    p.row([(N, "주간공정  추진  현황  및  계획", {"kind": "title", "size": 17})], h=36)
    p.row([(2, "▣ 공 사 명 :", {"kind": "free", "bold": True}),
           (7, F("공사명표시", '=IF(OR({표지!공사명}="",{표지!공사명}="공사명"),"",{표지!공사명})', align="left")),
           (2, "회 의 일", {"kind": "free", "bold": True, "align": "right"}),
           (2, F("회의일표시", '=IF(N({표지!회의일})=0,"",YEAR({표지!회의일})&". "&MONTH({표지!회의일})&". "&DAY({표지!회의일})&". ("&'
                   + WKD.format(d="{표지!회의일}") + '&")")', align="center"))], h=24)
    p.row([(2, "▣ 공 정 율", {"kind": "free", "bold": True}), (7, "", FR),
           (2, "금주 시작일(월)", {"kind": "free", "bold": True, "align": "right", "size": 9}),
           (2, F("금주시작", '=IF(N({표지!회의일})=0,"",{표지!회의일}-WEEKDAY({표지!회의일},2)+1)', fmt="ymd", align="center"))], h=24)
    p.row([(1, "구  분", dict(H, rs=2)), (4, "전주 실적(%)", H), (5, "전주까지 누계(%)", H), (2, "금주계획(%)", dict(H, rs=2)),
           (1, "비  고", dict(H, rs=2))], h=22)
    p.row([(2, "계  획", H), (2, "실  적", H), (2, "계  획", H), (2, "실  적", H), (1, "대  비", H)], h=22)
    for i in (1, 2):
        e = EX_RATE[i - 1] if ex else (None,) * 7
        lab = (1, "전 체 분", L) if i == 1 else (1, I("차수명", ex=e[0], blank="   차분", align="center", bold=True))
        cells = [lab, (2, I(f"전주계획#{i}", ex=e[1], fmt=P2, align="center")), (2, I(f"전주실적#{i}", ex=e[2], fmt=P2, align="center")),
                 (2, I(f"누계계획#{i}", ex=e[3], fmt=P2, align="center")), (2, I(f"누계실적#{i}", ex=e[4], fmt=P2, align="center")),
                 (1, F(f"대비#{i}", f'=IF(OR({{누계계획#{i}}}="",{{누계실적#{i}}}=""),"",ROUND({{누계실적#{i}}}-{{누계계획#{i}}},2))',
                       fmt=PD, align="center", bold=True)),
                 (2, I(f"금주계획#{i}", ex=e[5], fmt=P2, align="center"))]
        if i == 1:
            cells.append((1, I("비고", ex=e[6], align="center", size=9), {"rs": 2}))
        p.row(cells, h=24)
    p.row([(N, F("지연안내", '=IF(N({대비#1})<0,"⚠ 전체 누계 실적이 계획보다 "&ABS({대비#1})&"%p 늦습니다 — 만회 대책을 공사추진현황(금주·내주 계획)에 적으세요.","")',
                 align="left"), {"kind": "warn"})], h=17)
    p.row([(N, "▣ 공사추진현황", {"kind": "free", "bold": True})], h=22)
    p.row([(1, "구  분", H), (4, F("전주표시", _period("전  주", -7, -1)), H), (4, F("금주표시", _period("금  주", 0, 6)), H),
           (4, F("내주표시", _period("내  주", 7, 13)), H)], h=22)
    for kind, h in (("계획", 150), ("실적", 112)):
        cells = [(1, "계  획" if kind == "계획" else "실  적", L)]
        for wk in ("전주", "금주", "내주"):
            k = f"{kind}:{wk}"
            cells.append((4, I(k, ex=EX_TXT.get(k) if ex else None, blank="○", align="left", size=9.5), {"valign": "top"}))
        p.row(cells, h=h)
    p.end_print()
    p.after_note(["하늘색 칸 = 자동(공사명 · 회의일 · 금주 시작일 · 기간 · 대비). 주가 월요일에 시작하지 않으면 «금주 시작일» 칸에 날짜를 직접 적으세요.",
                  "대비 = 전주까지 누계 실적 − 누계 계획(%p). 뒤지면 빨간 글자로 나오고 아래에 안내가 뜹니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사)."])
    return p


def draw(bk, ex):
    cover(bk, ex)
    status(bk, ex)


def _g(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return s


def expect(pages):
    cv, st = pages["표지"], pages["추진현황"]
    d = cv["회의일"]
    s = d - datetime.timedelta(days=d.weekday())

    def per(tag, a, b):
        x, y = s + datetime.timedelta(days=a), s + datetime.timedelta(days=b)
        return f"{tag}({x.month}/{x.day} ~ {y.month}/{y.day})"
    wd = KO_WD[d.weekday()]
    e = {"공사명표시": cv["공사명"], "회의일표시": f"{d.year}. {d.month}. {d.day}. ({wd})", "금주시작": s,
         "전주표시": per("전  주", -7, -1), "금주표시": per("금  주", 0, 6), "내주표시": per("내  주", 7, 13)}
    for i in (1, 2):
        e[f"대비#{i}"] = round(st[f"누계실적#{i}"] - st[f"누계계획#{i}"], 2)
    v = e["대비#1"]
    e["지연안내"] = (f"⚠ 전체 누계 실적이 계획보다 {_g(abs(v))}%p 늦습니다 — 만회 대책을 공사추진현황(금주·내주 계획)에 적으세요." if v < 0 else "")
    return {"표지": {"요일": f"({wd})"}, "추진현황": e}
