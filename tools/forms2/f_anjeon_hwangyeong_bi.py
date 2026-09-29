# -*- coding: utf-8 -*-
"""안전·환경보전비 사용계획서 한 벌(4장) — 현장에서 쓰던 서식의 틀
(① 산업안전보건관리비 사용계획서 ② 항목별 세부 사용계획 ③ 환경보전비 사용계획서 ④ 환경보전비 세부 사용계획) 그대로 새로 만든 것.

■ 세부 사용계획(②④)에 품명·수량·단가만 적으면 금액·소계·합계 → 사용계획서(①③)의 항목별 계획금액·비율·합계가 저절로 채워집니다.
■ ③ 머리(업체명·공사명·소재지·대표자·금액·기간·발주자)와 날인란은 ①에서 끌어옵니다.
■ 고친 것(틀리면 안 되는 곳):
   · 안전관리비 사용 항목을 현행 고시(「건설업 산업안전보건관리비 계상 및 사용기준」)의 아홉 가지로 — 원본은 옛 여덟 가지(본사 사용비 등)
   · 환경보전비 근거를 옛 «건설기술관리법 시행규칙 제28조» → «건설기술 진흥법 시행규칙 제61조제2항»(2026. 6. 11. 시행본에서 확인:
     환경오염 방지시설을 처음 설치하기 전까지 사용계획을 발주자에게 제출)
   · 원본 «잔액» 칸은 계상액에서 위 항목까지 쓴 뒤 남는 돈(누적)으로 계산되게 함
"""
import datetime

from fb import F, I

SLUG = "anjeon-hwangyeong-bi"
TITLE = "안전·환경보전비 사용계획서"
WHERE = "forms"
PREV = [(1, "안전관리비 사용계획서 — 빈 서식"), (5, "안전관리비 사용계획서 — 작성 예시"), (6, "항목별 세부 사용계획 — 작성 예시"),
        (7, "환경보전비 사용계획서 — 작성 예시")]
SHORT = "산업안전보건관리비·환경보전비 사용계획서와 항목별 세부 사용계획 네 장이 한 파일입니다. 세부 품목만 적으면 금액·소계·계획금액·비율이 저절로 채워집니다."
NOTE_REPLACE = {
    "🏗 **현장에서 실제로 쓰던 서식입니다** — 내용만 지우고 틀은 원본 그대로 두었습니다.":
        "🏗 **현장에서 실제로 쓰던 서식의 틀**(네 장 · 칸 · 차례 · 날인란)을 그대로 두고 새로 만들었습니다 — 세부 품목만 적으면 금액·소계·계획금액·비율이 저절로 채워집니다. 안전관리비 항목은 현행 고시의 아홉 가지로 맞췄습니다.",
}
MULTI = True

D = datetime.date
WON = '#,##0;[Red]-#,##0;""'
PCT = '0.0%;[Red]-0.0%;""'
WP = [11, 7, 15, 13, 16, 15, 14]
WD = [16, 22, 8, 7, 12, 14, 10]

SAN = ["1. 안전관리자·보건관리자의 임금 등", "2. 안전시설비 등", "3. 보호구 등", "4. 안전보건진단비 등", "5. 안전보건교육비 등",
       "6. 근로자 건강장해예방비 등", "7. 건설재해예방전문지도기관 기술지도비", "8. 본사 전담조직 근로자 임금 등",
       "9. 위험성평가 등에 따른 소요비용"]
SAN_N = [2, 5, 6, 2, 3, 3, 2, 2, 2]
# (품명, 수량, 단위, 단가)
SAN_EX = {
    1: [("유도자·신호수 임금", 24, "인", 150_000)],
    2: [("안전난간", 40, "m", 12_000), ("추락방지망", 1, "식", 1_200_000), ("가설계단", 2, "개소", 850_000), ("안전표지판", 10, "개", 35_000)],
    3: [("안전모", 30, "개", 9_000), ("안전화", 20, "켤레", 38_000), ("안전대", 10, "개", 65_000), ("안전조끼", 30, "개", 8_000),
        ("보안경", 10, "개", 6_000)],
    5: [("교육 교재·자료", 1, "식", 200_000), ("안전교육장 설치", 1, "식", 600_000)],
    6: [("음용수·얼음", 5, "월", 60_000), ("그늘막", 2, "개", 150_000), ("구급함·구급약", 1, "식", 80_000)],
    7: [("재해예방 기술지도", 11, "회", 360_000)],
    9: [("위험성평가 개선 조치", 1, "식", 500_000)],
}
ENV = ["1. 환경관리자 등 인건비 및 각종 업무수당", "2. 환경시설비 등", "3. 환경보전유지비", "4. 환경보전교육비 및 행사비 등"]
ENV_N = [5, 5, 4, 4]
# (품명, 단가, 단위, 수량) — 원본 차례(단가·단위·수량)
ENV_EX = {
    1: [("환경보전 청소 인건비", 150_000, "인", 10), ("세륜시설 운영 인건비", 150_000, "인", 6)],
    2: [("세륜시설 설치·임대", 1_200_000, "식", 1), ("부직포(분진덮개용)", 45_000, "롤", 6), ("분진망", 25_000, "개", 20),
        ("살수차량 임대", 250_000, "회", 4)],
    3: [("청소용구", 150_000, "식", 1), ("쓰레기봉투(100ℓ)", 1_000, "매", 100), ("폐기물 마대", 1_500, "개", 60)],
    4: [("현장 환경교육 음료", 40_000, "회", 5), ("교육 자료 인쇄", 50_000, "식", 1)],
}
HEAD_EX = dict(업체명="예시건설(주)", 공사명="가나지구 배수로 정비공사", 소재지="가나시 마바로 45, 2층", 대표자="홍길동",
               공사금액=963_241_000, 공사기간="2026. 3. 9. ~ 2026. 12. 31. (298일)", 발주자="가나시", 누계공정율=0.0)


def _pg(bk, ex, logical, name, widths):
    return bk.page(logical, widths, ex=ex, fit_height=1, sheetname=name if not ex else "예시-" + name,
                   margins=(0.4, 0.4, 0.45, 0.45))


def _head(p, src):
    """업체명·공사명 … 발주자·누계공정율 네 줄. src=True 면 입력칸, 아니면 ①에서 끌어옴."""
    L = {"kind": "label"}

    def v(k, fmt=None, align=None):
        if src:
            return I(k, ex=HEAD_EX[k], fmt=fmt, align=align)
        return F(k, f'=IF({{안전계획!{k}}}="","",{{안전계획!{k}}})', fmt=fmt, align=align)
    p.row([(2, "건설업체명", L), (2, v("업체명")), (1, "공   사   명", L), (2, v("공사명"))], h=26)
    p.row([(2, "소  재  지", L), (2, v("소재지")), (1, "대  표  자", L), (2, v("대표자"))], h=26)
    p.row([(2, "공 사 금 액", L), (2, v("공사금액", fmt=WON)), (1, "공 사 기 간", L), (2, v("공사기간"))], h=26)
    p.row([(2, "발  주  자", L), (2, v("발주자")), (1, "누계공정율", L), (2, v("누계공정율", fmt='0.0%;;"0.0%"', align="center"))], h=26)


def _foot(p, ex, stmt):
    for t in stmt:
        p.row([(7, t, {"kind": "cfree", "size": 10.5})], h=22)
    p.gap(6)
    p.date_line("제출일", ex=D(2026, 3, 20))
    p.gap(4)
    src = p.logical == "안전계획"
    for lab, k in (("주     소 :", "소재지"), ("상     호 :", "업체명"), ("성     명 :", "대표자")):
        f = f'=IF({{{k}}}="","",{{{k}}})' if src else f'=IF({{안전계획!{k}}}="","",{{안전계획!{k}}})'
        p.row([(3, "", {"kind": "free"}), (1, lab, {"kind": "free", "bold": True, "align": "right"}),
               (2, F("날인:" + k, f, align="left"), {"border": False}),
               (1, "(인)" if k == "대표자" else "", {"kind": "free", "align": "center"})], h=24)


def _plan(bk, ex, which):
    safe = which == "안전"
    lg = "안전계획" if safe else "환경계획"
    p = _pg(bk, ex, lg, "안전관리비 사용계획서" if safe else "환경보전비 사용계획서", WP)
    L = {"kind": "label"}
    H = {"kind": "head"}
    p.gap(4)
    p.title("산업안전보건관리비 사용계획서" if safe else "환경보전비 사용계획서", h=38)
    p.gap(6)
    _head(p, safe)
    det = "안전세부" if safe else "환경세부"
    word = "안전관리비" if safe else "환경보전비"
    p.row([(2, f"계  상  된\n{word}", L), (2, I("계상액", ex=19_134_669 if safe else 6_500_000, fmt=WON)),
           (1, f"사용계획\n{word}", L), (2, F("계획합", f"=IF({{{det}!합계}}=0,\"\",{{{det}!합계}})", fmt=WON))], h=34)
    p.row([(7, F("경고", f'=IF(AND(N({{계상액}})>0,N({{계획합}})>{{계상액}}),"⚠ 사용계획 금액이 계상된 {word}를 넘습니다 — "'
                        f'&TEXT(N({{계획합}})-{{계상액}},"#,##0")&"원 초과","")', align="left"),
            {"kind": "warn", "border": False})], h=16)
    p.row([(7, "계     획     금     액", {"kind": "head", "size": 11})], h=30)
    items = SAN if safe else ENV
    third = "비      율" if safe else "잔      액"
    p.row([(4, "항          목", H), (1, "계 획 금 액", H), (1, third, H), (1, "비      고", H)], h=26)
    r0 = p.r
    nrow = len(items) if safe else 8
    for i in range(1, nrow + 1):
        name = items[i - 1] if i <= len(items) else None
        amt = F(f"계획#{i}", f"=IF(N({{{det}!소계{i}}})=0,\"\",{{{det}!소계{i}}})", fmt=WON) if name else I(f"계획#{i}", fmt=WON)
        if safe:
            third_c = F(f"비율#{i}", f'=IF(OR(N({{계획#{i}}})=0,N({{계상액}})=0),"",{{계획#{i}}}/{{계상액}})', fmt=PCT, align="center")
        else:
            third_c = F(f"잔액#{i}", f'=IF(OR(N({{계상액}})=0,N({{계획#{i}}})=0),"",{{계상액}}-SUM($E${r0}:E{r0 + i - 1}))', fmt=WON)
        p.row([(4, name or I(f"항목#{i}"), {"kind": "text", "indent": 1} if name else {}), (1, amt), (1, third_c),
               (1, I(f"비고#{i}", size=9))], h=26)
    p.k["계획[]"] = f"E{r0}:E{p.r - 1}"
    S = {"kind": "sum"}
    last = (F("합비율", '=IF(OR(N({합계획})=0,N({계상액})=0),"",{합계획}/{계상액})', fmt=PCT, align="center", bold=True) if safe else
            F("합잔액", '=IF(OR(N({계상액})=0,N({합계획})=0),"",{계상액}-{합계획})', fmt=WON, bold=True))
    p.row([(4, "합                    계", S), (1, F("합계획", "=SUM({계획[]})", fmt=WON, bold=True)), (1, last), (1, "", S)], h=28)
    p.gap(10)
    if safe:
        stmt = ["「건설업 산업안전보건관리비 계상 및 사용기준」(고용노동부 고시)에 따라",
                "위와 같이 당 현장의 산업안전보건관리비 사용계획서를 제출합니다."]
    else:
        stmt = ["「건설기술 진흥법 시행규칙」 제61조제2항에 따라 위와 같이 당 현장의",
                "환경보전비 사용계획서를 제출합니다."]
    _foot(p, ex, stmt)
    p.end_print()
    p.after_note([
        "계획금액·비율(잔액)·합계는 뒤 «세부 사용계획» 시트에서 저절로 옵니다 — 세부 시트의 품명·수량·단가만 적으세요.",
        "노란 칸은 없습니다. 계상된 금액은 공사원가계산서(산출내역서)의 금액을 그대로 적습니다.",
    ] if not ex else ["이 시트는 작성 예시입니다(가상의 현장 · 금액). 실제로는 앞의 빈 시트에 적으세요."])
    return p


def _detail(bk, ex, which):
    safe = which == "안전"
    lg = "안전세부" if safe else "환경세부"
    p = _pg(bk, ex, lg, "안전관리비 세부내역" if safe else "환경보전비 세부내역", WD)
    H = {"kind": "head"}
    p.gap(4)
    p.title("항 목 별  세 부 사 용 계 획", h=36, sub="(산업안전보건관리비)" if safe else "(환경보전비)")
    p.gap(4)
    p.row([(5, F("공사명", '=IF({안전계획!공사명}="","",{안전계획!공사명})', align="left", bold=True), {"border": False}),
           (2, "(VAT 별도)", {"kind": "free", "align": "right", "size": 9})], h=22)
    mid = ("수 량", "단 위", "단 가") if safe else ("단 가", "단 위", "수 량")
    p.row([(1, "항     목", {"kind": "head", "rs": 2}), (4, "사   용   내   역", H), (1, "금     액", {"kind": "head", "rs": 2}),
           (1, "비 고", {"kind": "head", "rs": 2})], h=22)
    p.row([(1, "품          명", H), (1, mid[0], H), (1, mid[1], H), (1, mid[2], H)], h=22)
    items, ns, exd = (SAN, SAN_N, SAN_EX) if safe else (ENV, ENV_N, ENV_EX)
    subs = []
    for k, (name, n) in enumerate(zip(items, ns), 1):
        rows = exd.get(k, [])
        r1 = p.r
        for i in range(1, n + 1):
            e = rows[i - 1] if i <= len(rows) else (None, None, None, None)
            if safe:
                pm, q, u, up = e
            else:
                pm, up, u, q = e
            cq = I(f"{k}수량#{i}", ex=q, fmt='#,##0.##;;""', align="center")
            cu = I(f"{k}단위#{i}", ex=u, align="center")
            cp = I(f"{k}단가#{i}", ex=up, fmt=WON)
            cells = [(1, I(f"{k}품명#{i}", ex=pm, size=9.5))] + ([(1, cq), (1, cu), (1, cp)] if safe else [(1, cp), (1, cu), (1, cq)])
            cells += [(1, F(f"{k}금액#{i}", f'=IF(OR(N({{{k}수량#{i}}})=0,N({{{k}단가#{i}}})=0),"",INT(ROUND({{{k}수량#{i}}}*{{{k}단가#{i}}},6)))',
                            fmt=WON)), (1, I(f"{k}비고#{i}", size=9))]
            if i == 1:
                cells = [(1, name, {"kind": "label", "rs": n + 1, "size": 9, "align": "left"})] + cells
            p.row(cells, h=20)
        p.k[f"{k}금액[]"] = f"F{r1}:F{p.r - 1}"
        p.row([(4, "소          계", {"kind": "sum"}), (1, F(f"소계{k}", f"=SUM({{{k}금액[]}})", fmt=WON, bold=True)), (1, "", {"kind": "sum"})], h=20)
        subs.append(f"{{소계{k}}}")
    p.row([(5, "합                    계", {"kind": "sum"}), (1, F("합계", "=" + "+".join(subs), fmt=WON, bold=True)), (1, "", {"kind": "sum"})], h=24)
    plan = "안전계획" if safe else "환경계획"
    p.row([(7, F("대조", f'=IF(OR(N({{{plan}!계상액}})=0,{{합계}}=0),"",IF({{합계}}>{{{plan}!계상액}},'
                        f'"⚠ 계상액보다 "&TEXT({{합계}}-{{{plan}!계상액}},"#,##0")&"원 많습니다.",'
                        f'"계상액 "&TEXT({{{plan}!계상액}},"#,##0")&"원 중 "&TEXT({{{plan}!계상액}}-{{합계}},"#,##0")&"원 남음"))', align="right"),
            {"kind": "note", "border": False})], h=16)
    p.end_print()
    p.after_note(["품명·수량·단위·단가를 적으면 금액(원 미만 버림)·소계·합계가 나오고, 앞 «사용계획서» 의 계획금액으로 넘어갑니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 현장 · 금액)."])
    return p


def draw(bk, ex):
    _plan(bk, ex, "안전")
    _detail(bk, ex, "안전")
    _plan(bk, ex, "환경")
    _detail(bk, ex, "환경")


def expect(pages):
    out = {}
    for which, lg, dl, items, ns in (("안전", "안전계획", "안전세부", SAN, SAN_N), ("환경", "환경계획", "환경세부", ENV, ENV_N)):
        d = pages[dl]
        de = {}
        tot = 0
        for k, n in enumerate(ns, 1):
            sub = 0
            for i in range(1, n + 1):
                q, up = d.get(f"{k}수량#{i}"), d.get(f"{k}단가#{i}")
                if q and up:
                    a = int(round(q * up, 6))
                    de[f"{k}금액#{i}"] = a
                    sub += a
                else:
                    de[f"{k}금액#{i}"] = ""
            de[f"소계{k}"] = sub
            tot += sub
        de["합계"] = tot
        de["공사명"] = pages["안전계획"]["공사명"]
        pl = pages[lg]
        kk = pl["계상액"]
        de["대조"] = f"계상액 {kk:,}원 중 {kk - tot:,}원 남음"
        pe = {"계획합": tot, "경고": ""}
        acc = 0
        for i in range(1, len(items) + 1):
            s = de[f"소계{i}"]
            pe[f"계획#{i}"] = s if s else ""
            if which == "안전":
                pe[f"비율#{i}"] = s / kk if s else ""
            else:
                acc += s
                pe[f"잔액#{i}"] = kk - acc if s else ""
        pe["합계획"] = tot
        if which == "안전":
            pe["합비율"] = tot / kk
        else:
            pe["합잔액"] = kk - tot
            for key in ("업체명", "공사명", "소재지", "대표자", "공사금액", "공사기간", "발주자", "누계공정율"):
                v = pages["안전계획"][key]
                pe[key] = v if v not in (None, "") else ""
        src = pages["안전계획"]
        for k in ("소재지", "업체명", "대표자"):
            pe["날인:" + k] = src[k]
        out[dl] = de
        out[lg] = pe
    return out
