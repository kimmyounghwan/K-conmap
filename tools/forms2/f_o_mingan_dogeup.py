# -*- coding: utf-8 -*-
"""민간건설공사 표준도급계약서 — 국토교통부고시 제2026-34호(2026. 1. 16. 일부개정) [별표] 를 새로 만든 것.

■ 옛 원본 틀 파일은 다른 곳(비즈폼)에서 만든 파일이라 파일 속성에 그 회사의 저작권 표시가 있었고,
  일반조건 글도 옛 판(제2조 설계서 정의 · 제12조 제목·제4항 등)이었으며 금액 칸이 #NAME 오류였습니다.
  → 국가법령정보센터 원문(행정규칙 별표)을 한 조씩 옮겨 새로 짰습니다. 고시(행정규칙)는 저작권법 제7조로 보호받지 않는 저작물.
  옮긴 글은 조마다 글자(한글·숫자)를 원문과 대조해 42개 조 모두 같음을 확인(tools/forms2/data/mingan_2026.dat).
■ 수식: 계약금액·노무비·계약보증금·선금·하자보수보증금 → «일금 ○○원정» 한글 금액 · 부가가치세 = 계약금액 − 공급가액(계약금액 ÷ 1.1, 원 단위 반올림) ·
        보증금·선금 = 계약금액 × 율(노란 칸) · 하자보수보증금 = 공종별 계약금액 × 율 · 공종별 금액 합 ≠ 계약금액이면 빨간 경고 ·
        원자재 연동 기준 비율이 100분의 10 을 넘으면 경고 · 물가변동 적용기준 ■/□ 표시 · 공사 일수.
■ 원문 계약서의 «동시행령 제84제1항» 은 «제84조제1항» 으로 적음(건설산업기본법 시행령 제84조)."""
import datetime
import os

from fb import F, I

import docw as d

SLUG = "o-mingan-dogeup"
TITLE = "민간건설공사 표준도급계약서"
WHERE = "orig"
PREV = [(1, "계약서 — 빈 서식"), (2, "일반조건 첫 쪽 (고시 원문)"), (12, "계약서 — 작성 예시")]
PAGES = 11
NSHEETS = 2
SHORT = ("민간건설공사 표준도급계약서(국토교통부고시 2026. 1. 16. 개정판)와 일반조건 42개 조 — 계약금액·보증금·선금·하자보수보증금이 "
         "한글 금액으로 저절로 적히고, 공종별 금액 합이 안 맞으면 알려 줍니다.")
NOTE = ("국토교통부고시 제2026-34호(2026. 1. 16.) 원문으로 새로 만들었습니다. 일반조건은 원문 그대로이고, "
        "계약서 칸의 금액은 한글로 저절로 적힙니다. 노란 칸(보증금·선금 율)은 당사자가 합의한 값으로 고쳐 씁니다.")
MULTI = True

D = datetime.date
W = [7.6] * 12
PC = 12
WON = '"₩"#,##0;[Red]-"₩"#,##0;""'
HANGUL = '[DBNum4][$-412]"일금 "General"원정";;""'
PCT = '0.0#"%";;""'
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "mingan_2026.dat")
L = {"kind": "label", "align": "left", "indent": 1}
FR = {"kind": "free"}
H = {"kind": "head"}

HAJA = [("토목(배수로)", 2_400_000_000, 3, "5년"), ("조경", 280_000_000, 3, "2년"), (None, None, None, None)]


def _won_line(p, no, lab, key, exv, tail=None):
    """«n. 항목 : 일금 ○원정» — 왼쪽 숫자 칸 + 오른쪽 한글 금액"""
    cells = [(3, f"{no}. {lab}", L), (3, I(key, ex=exv, fmt=WON)),
             (4 if tail else 6, F(key + "한글", f'=IF(N({{{key}}})=0,"",{{{key}}})', fmt=HANGUL, align="left", size=9.5))]
    if tail:
        cells.append((2, tail, {"kind": "text", "size": 8.5}))
    p.row(cells, h=24)


def contract(bk, ex):
    p = bk.page("계약서", W, ex=ex, fit_height=1, sheetname="계약서" if not ex else "예시-계약서", margins=(0.5, 0.5, 0.45, 0.45))
    p.gap(4)
    p.title("민간건설공사 표준도급계약서", h=40)
    p.gap(6)
    p.row([(3, "1. 공  사  명", L), (9, I("공사명", ex="가나동 근린생활시설 신축공사"))], h=24)
    p.row([(3, "2. 공 사 장 소", L), (9, I("공사장소", ex="가나시 가나동 123-4 일원"))], h=24)
    p.row([(3, "3. 착공년월일", L), (3, I("착공일", ex=D(2026, 10, 12), fmt="date", align="center")),
           (3, "4. 준공예정년월일", L), (3, I("준공일", ex=D(2027, 6, 30), fmt="date", align="center"))], h=24)
    p.row([(9, "", FR), (3, F("공사일수", '=IF(OR(N({착공일})=0,N({준공일})=0),"",IF({준공일}<{착공일},"⚠ 날짜 확인",{준공일}-{착공일}+1))',
                             fmt='"(공사기간 "#,##0"일)";;""', align="center", size=9), FR)], h=16)
    _won_line(p, 5, "계약금액", "계약금액", 2_680_000_000, "(부가가치세 포함)")
    p.row([(3, "   (노 무 비¹⁾)", L), (3, I("노무비", ex=742_500_000, fmt=WON)),
           (6, F("노무비한글", '=IF(N({노무비})=0,"",{노무비})', fmt=HANGUL, align="left", size=9.5))], h=22)
    p.row([(3, "   (부가가치세)", L),
           (3, F("부가세", '=IF(N({계약금액})=0,"",{계약금액}-ROUND({계약금액}/1.1,0))', fmt=WON)),
           (6, F("부가세한글", '=IF(N({부가세})=0,"",{부가세})', fmt=HANGUL, align="left", size=9.5))], h=22)
    p.row([(PC, "  ¹⁾ 건설산업기본법 제88조제2항, 동시행령 제84조제1항 규정에 의하여 산출한 노임", {"kind": "note"})], h=14)
    p.row([(PC, "  ※ 부가가치세 = 계약금액 − 계약금액 ÷ 1.1 (원 단위 반올림)", {"kind": "note"})], h=14)
    for no, lab, key, rk, rate in ((6, "계약보증금", "보증금", "보증율", 10), (7, "선      금", "선금", "선금율", 30)):
        p.row([(3, f"{no}. {lab}", L), (1, I(rk, ex=rate, fmt=PCT, rate=True, align="center")),
               (2, F(key, f'=IF(OR(N({{계약금액}})=0,N({{{rk}}})=0),"",ROUND({{계약금액}}*{{{rk}}}/100,0))', fmt=WON)),
               (6, F(key + "한글", f'=IF(N({{{key}}})=0,"",{{{key}}})', fmt=HANGUL, align="left", size=9.5))], h=24)
    p.row([(3, "", FR), (2, "(계약체결 후", {"kind": "free", "align": "right", "size": 9.5}), (1, I("선금일", ex=14, fmt='0;;""', align="center")),
           (6, "일 이내 지급)", {"kind": "free", "size": 9.5})], h=20)
    p.row([(3, "8. 기성부분금", L), (1, I("기성월", ex=1, fmt='"( "0" )";;"(    )"', align="center")), (8, "월에 1회", {"kind": "text"})], h=22)
    p.row([(3, "9. 지급자재의 품목 및 수량", L), (9, I("지급자재", ex="없음"))], h=22)
    p.row([(6, "10. 주요 원자재 가격변동에 따른 계약금액 연동을 위한 기준 비율", {**L, "size": 9}),
           (1, I("연동비율", ex=5, fmt=PCT, align="center")),
           (5, F("연동경고", '=IF(N({연동비율})>10,"⚠ 100분의 10 이내의 범위에서 협의","* 100분의 10 이내의 범위에서 협의")', align="left", size=8.5),
            {"kind": "free"})], h=30)
    p.row([(PC, "11. 하자담보책임 (복합공종인 경우 공종별로 구분 기재)", {**L, "kind": "free", "bold": True})], h=20)
    p.row([(3, "공  종", H), (3, "공종별 계약금액", H), (1, "율(%)", H), (3, "하자보수보증금", H), (2, "하자담보책임기간", H)], h=24)
    for i, (g, amt, r, per) in enumerate(HAJA, 1):
        p.row([(3, I(f"공종#{i}", ex=g, align="center")), (3, I(f"공종금액#{i}", ex=amt, fmt=WON)),
               (1, I(f"하자율#{i}", ex=r, fmt=PCT, rate=True, align="center")),
               (3, F(f"하자금#{i}", f'=IF(OR(N({{공종금액#{i}}})=0,N({{하자율#{i}}})=0),"",ROUND({{공종금액#{i}}}*{{하자율#{i}}}/100,0))', fmt=WON)),
               (2, I(f"하자기간#{i}", ex=per, align="center"))], h=22)
    p.k["공종금액[]"] = f"{p.k['공종금액#1']}:{p.k['공종금액#3']}"
    p.row([(PC, F("하자경고", '=IF(OR(SUM({공종금액[]})=0,N({계약금액})=0),"",IF(SUM({공종금액[]})<>{계약금액},'
                             '"⚠ 공종별 계약금액의 합이 계약금액과 다릅니다.",""))', align="left"),
            {"kind": "warn"})], h=16)
    p.row([(3, "12. 지체상금율", L), (4, I("지체상금율", ex="1,000분의 0.5 (1일)", align="center")),
           (5, "* 따로 정하지 않으면 공공공사 계약의 지체상금율(일반조건 제30조④)", {"kind": "note"})], h=24)
    p.row([(3, "13. 대가지급 지연 이자율", L), (4, I("지연이자율", ex="연 12%", align="center")), (5, "", FR)], h=24)
    p.row([(3, "14. 물가변동 적용기준", L), (3, I("물가기준", ex="품목조정률", dv="물가기준", align="center")),
           (6, F("물가표시", '=IF({물가기준}="품목조정률","품목조정률 ■    지수조정률 □",IF({물가기준}="지수조정률","품목조정률 □    지수조정률 ■",'
                             '"품목조정률 □    지수조정률 □"))', align="left"), {"kind": "free"})], h=24)
    p.dv_list("물가기준", ["품목조정률", "지수조정률"])
    p.row([(3, "15. 기타사항", L), (9, I("기타", ex="현장 여건에 따른 세부 사항은 공사계약특수조건에 따름", size=9))], h=28)
    p.gap(6)
    d.para(p, '"도급인"과 "수급인"은 합의에 따라 붙임의 계약문서에 의하여 계약을 체결하고, 신의에 따라 성실히 계약상의 의무를 이행할 것을 확약하며, '
              '이 계약의 증거로서 계약문서를 2통 작성하여 각 1통씩 보관한다.', indent=1, size=10)
    p.row([(2, "붙임서류 :", {"kind": "free", "bold": True}), (10, "1. 민간건설공사 도급계약 일반조건 1부", FR)], h=18)
    p.row([(2, "", FR), (10, "2. 공사계약특수조건 1부", FR)], h=18)
    p.row([(2, "", FR), (10, "3. 설계서 및 산출내역서 1부", FR)], h=18)
    p.gap(4)
    p.row([(PC, I("계약일", ex=D(2026, 10, 5), fmt="date", blank="          년        월        일", align="center"), {"border": False})], h=24)
    p.row([(6, "도  급  인", {"kind": "cfree", "bold": True}), (6, "수  급  인", {"kind": "cfree", "bold": True})], h=20)
    for lab, a, b in (("주소", ("도급주소", "가나시 가나로 10"), ("수급주소", "가나시 마바로 45, 2층")),
                      ("상호", ("도급상호", "예시개발(주)"), ("수급상호", "예시건설(주)"))):
        p.row([(1, lab, {"kind": "cfree", "bold": True}), (5, I(a[0], ex=a[1]), {"border": False}),
               (1, lab, {"kind": "cfree", "bold": True}), (5, I(b[0], ex=b[1]), {"border": False})], h=20)
    p.row([(1, "성명", {"kind": "cfree", "bold": True}), (4, I("도급성명", ex="대표이사 홍길동"), {"border": False}), (1, "(인)", {"kind": "cfree"}),
           (1, "성명", {"kind": "cfree", "bold": True}), (4, I("수급성명", ex="대표이사 김철수"), {"border": False}), (1, "(인)", {"kind": "cfree"})], h=22)
    d.done(p)
    p.after_note(["하늘색 칸 = 자동(한글 금액 · 부가가치세 · 보증금 · 선금 · 하자보수보증금 · 경고). 노란 칸 = 당사자가 합의한 율.",
                  "원문 서식에는 «상호» 줄이 없습니다 — 법인이면 적고, 개인이면 비워 두세요."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람)."])
    return p


def _lines():
    out = []
    for l in open(DATA, encoding="utf-8").read().split("\n"):
        if l.strip() and not l.startswith("#"):
            out.append(l.rstrip())
    return out


def general(bk, ex):
    p = bk.page("일반조건", W, ex=ex, fit_height=0, sheetname="일반조건", margins=(0.5, 0.5, 0.5, 0.5))
    p.row([(PC, "민간건설공사 표준도급계약 일반조건", {"kind": "title", "size": 15})], h=32)
    p.gap(4)
    import re
    from fb import text_lines
    wu_all = sum(W) - 2
    for l in _lines():
        m = re.match(r"^(제\d+조(?:의\d+)?\([^)]*\))\s*(.*)$", l)
        if m:
            head, rest = m.group(1), m.group(2)
            t = head + (" " + rest if rest else "")
            n = text_lines(t, wu_all * 10.0 / 9.5)
            d.keep(p, n * 9.5 * 1.5 + 30)
            p.gap(3)
            p.row([(PC, t, {"kind": "free", "size": 9.5, "valign": "top", "indent": 0})], h=n * 9.5 * 1.5 + 5)
            from openpyxl.cell.rich_text import CellRichText, TextBlock
            from openpyxl.cell.text import InlineFont
            cell = p.ws.cell(row=p.r - 1, column=1)
            parts = [TextBlock(InlineFont(rFont="맑은 고딕", sz=9.5, b=True, color="1F2937"), head)]
            if rest:
                parts.append(TextBlock(InlineFont(rFont="맑은 고딕", sz=9.5, color="1F2937"), " " + rest))
            cell.value = CellRichText(parts)
            continue
        if l.startswith("="):
            p.row([(1, "", FR), (PC - 1, l[1:], {"kind": "free", "size": 9.5, "bold": True})], h=18)
            continue
        if l.startswith(">"):
            t = l[1:]
            n = text_lines(t, (wu_all - 7.6) * 10.0 / 9)
            p.row([(1, "", FR), (PC - 1, t, {"kind": "free", "size": 9, "valign": "top"})], h=n * 9 * 1.5 + 4)
            continue
        lead = 1 if re.match(r"^[①-⑳]", l) else (2 if re.match(r"^\d+\.", l) else 1)
        wu = sum(W[lead - 1:]) - 1
        n = text_lines(l, wu * 10.0 / 9.5)
        cells = [] if lead == 1 else [(lead - 1, "", FR)]
        cells.append((PC - lead + 1, l, {"kind": "free", "size": 9.5, "valign": "top"}))
        p.row(cells, h=n * 9.5 * 1.5 + 4)
    d.done(p)
    p.after_note(["국토교통부고시 제2026-34호(2026. 1. 16. 일부개정) 원문 그대로입니다. 고쳐 쓰지 마시고, 달리 정할 것은 공사계약특수조건에 적으세요."])
    return p


def draw(bk, ex):
    contract(bk, ex)
    if not ex:
        general(bk, ex)


def expect(pages):
    c = pages["계약서"]
    amt = c["계약금액"]
    e = {"공사일수": (c["준공일"] - c["착공일"]).days + 1, "계약금액한글": amt, "노무비한글": c["노무비"]}
    vat = amt - round(amt / 1.1)
    e["부가세"] = vat
    e["부가세한글"] = vat
    for key, rk in (("보증금", "보증율"), ("선금", "선금율")):
        v = round(amt * c[rk] / 100)
        e[key] = v
        e[key + "한글"] = v
    tot = 0
    for i in range(1, 4):
        a, r = c.get(f"공종금액#{i}"), c.get(f"하자율#{i}")
        e[f"하자금#{i}"] = round(a * r / 100) if a and r else ""
        tot += a or 0
    e["하자경고"] = "" if tot == amt else "⚠ 공종별 계약금액의 합이 계약금액과 다릅니다."
    e["연동경고"] = "⚠ 100분의 10 이내의 범위에서 협의" if c["연동비율"] > 10 else "* 100분의 10 이내의 범위에서 협의"
    e["물가표시"] = "품목조정률 ■    지수조정률 □"
    return {"계약서": e}
