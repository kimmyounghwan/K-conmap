# -*- coding: utf-8 -*-
"""기술지도계약서 — 새로 만든 서식 (2026-11-16 G714 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 발주자 유형 [√] · 기술지도 구분 [√] · 공사기간(착공 · 준공 → 계약서 «공사기간») · 계약기간(→ «계약기간») · 기술지도 횟수(→ «총( )회») ·
     기술지도계약 대상 판정(영 제59조제1항 — 공사금액 1억원 이상 120억원(토목공사업 150억원) 미만 또는 건축허가 대상 · 단서 제외 넷) ·
     체결 기한(영 제59조제2항 — 착공일 전날까지) · 아직 안 적은 칸
   · 계약서(산업안전보건법 시행규칙 [별지 제104호서식] <개정 2023. 9. 27.> 칸 차례 그대로 — 세로 한 쪽 · 서명 칸 이름은 위 칸에서).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1120.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G714_기술지도계약서_원문.txt — 글층 해시 같음 확인):
  · 산업안전보건법 시행령 [시행 2026. 8. 1.] 제59조(기술지도계약 체결 대상 건설공사 및 체결 시기) ① 공사금액 1억원 이상 120억원(건산법 시행령 별표 1
    토목공사업 공사 150억원) 미만 · 건축법 제11조 건축허가 대상 공사 — 단서: 1. 공사기간 1개월 미만 2. 섬 지역(제주 제외) 3. 안전관리자 자격자 전담 선임
    4. 유해위험방지계획서 제출 공사 ② 착공일의 전날까지 체결
■ 짐작 안 함: 공사금액은 적은 그대로 견줌(부가세 포함 여부 등은 글로 알리지 않음) · 단서 제외는 고르는 칸(공사기간 1개월 미만도 날짜로 셈하지 않음) ·
  기술지도 대가 · 횟수는 계약에서 정한 값을 적음(별표 18 기준은 글로만)."""
import datetime

import sgw as g
from fb import F, I, text_lines

SLUG = "gisul-jido-gyeyakseo"
TITLE = "기술지도계약서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "기술지도계약서(산업안전보건법 시행규칙 별지 제104호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "기술지도계약서 — 작성 예시 (유형 · 구분 [√] 와 공사기간 · 계약기간 · 횟수가 ① 장에서 저절로)"),
        (3, "① 기술지도계약 대상 판정 · 체결 기한(착공일 전날) — 작성 예시")]
MULTI = True
SHORT = ("기술지도계약서(산업안전보건법 시행규칙 별지 제104호서식) — 공사금액 · 공종 · 건축허가 여부를 고르면 기술지도계약 대상인지(영 제59조)가, "
         "착공일을 적으면 체결 기한(착공일 전날)이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
WON = '#,##0"원";;""'
YOIL = "일월화수목금토"

YT = ["정부", "지방자치단체", "공공기관", "지방공기업", "기타 국가기관", "기업", "개인"]
GB = ["건설공사", "전기 및 정보통신 공사"]
GJ = ["토목공사업에 속하는 공사", "그 밖의 공사"]
YN = ["예", "아니오"]
JW = ["해당 없음", "공사기간 1개월 미만", "섬 지역(제주 제외)", "안전관리자 자격자 전담 선임", "유해위험방지계획서 제출 공사"]
PD_X_A = "✓ 기술지도계약 대상에서 제외 — "
PD_X_B = "(영 제59조제1항 단서)"
PD_Y_A = "⚠ 기술지도계약 대상(영 제59조제1항) — "
PD_Y_AMT_A = "공사금액 1억원 이상 "
PD_Y_AMT_B = "억원 미만"
PD_Y_PER = "건축법 제11조 건축허가 대상 공사"
PD_N = "✓ 대상 아님 — 공사금액 1억원 미만이거나 기준 이상이고 건축허가 대상도 아님(영 제59조제1항)"
GH_A = "체결 기한: 착공일("
GH_B = ")의 전날 → "
GH_C = "까지(영 제59조제2항)"
GH_SAT = " · ⚠ 토요일이라 그 전 평일에 맺으면 안전합니다"
GH_SUN = " · ⚠ 일요일이라 그 전 평일에 맺으면 안전합니다"
GH_LATE_A = " · ⚠ 계약일("
GH_LATE_B = ")이 기한보다 늦음"
GH_NEED = "⚠ 착공일을 적으면 체결 기한(착공일 전날)을 셉니다"
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {"유형": YT[1], "구분": GB[0], "공종": GJ[1], "건축허가": YN[0], "제외": JW[0], "착공일": D(2027, 3, 3), "준공일": D(2027, 11, 30),
      "계약시작": D(2027, 3, 3), "계약끝": D(2027, 11, 30), "횟수": 18}
EX_S = {"발주자": "가나시", "발주대표": "가나시장", "발주법인번호": "000000-0000000", "발주관리번호": "00000000000", "발주주소": "가나시 다라구 시청로 1",
        "발주연락처": "000-000-0000",
        "공사명": "가나시 마을회관 증축공사", "사업개시번호": "00000000000", "계약금액": 2850000000, "현장책임자": "정민호", "현장연락처": "010-0000-0000",
        "현장소재지": "가나시 마바구 사아동 45",
        "상호": "다라건설(주)", "대표자": "이가람", "사업자등록번호": "000-00-00000", "면허번호": "가나시-00-000", "본사주소": "가나시 다라구 바사로 12",
        "전화번호": "000-000-0000",
        "기관명칭": "마바안전기술(주)", "기관대표": "최지훈", "기관소재지": "가나시 다라구 바사로 77", "지정번호": "제0000-00호", "담당자": "한소영",
        "기관전화": "000-000-0000", "대가": 4620000, "작성일": D(2027, 2, 24)}
HEAD = "■ 산업안전보건법 시행규칙 [별지 제104호서식] <개정 2023. 9. 27.>"
STATEMENT = ("「산업안전보건법」 제73조제1항, 같은 법 시행령 제59조제2항ㆍ제60조, 별표 18 및 같은 법 시행규칙 제89조의2제1항에 따라 기술지도계약을 체결하고 "
             "성실하게 계약사항을 준수하기로 한다.")
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"
KB = "     년     월     일부터"
KE = "     년     월     일까지"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(120, 1120)


def prow(p, items, h):
    r = p.r
    cells = []
    c = 1
    for it in items:
        a, b = GX.cols(it[0], it[1])
        assert b >= a, (p.name, r, it[:2])
        while (r, c) in p.occ:
            c += 1
        assert c == a, f"[{p.name}] {r}행 칸 자리 {c} ≠ {a} (x {it[0]})"
        cells.append((b - a + 1,) + tuple(it[2:]))
        c = b + 1
    return p.row(cells, h=h)


def _bd(p, r1, r2, x1, x2, top=True, bot=True, left=True, right=True):
    from openpyxl.styles import Border
    from fb import LINE
    c1, c2 = GX.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            p.ws.cell(row=r, column=c).border = Border(left=LINE if (left and c == c1) else None, right=LINE if (right and c == c2) else None,
                                                       top=LINE if (top and r == r1) else None, bottom=LINE if (bot and r == r2) else None)


LB = {"kind": "label", "size": 9}
LT = {"kind": "free", "size": 8.5, "align": "left"}
NB = {"border": False}
CT = {"kind": "ctext", "size": 8.5}
FR = {"kind": "free", "size": 9}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


SD, ED, QD = "{착공일}", "{준공일}", "{계약서!작성일}"
DUE = f"({SD}-1)"
AMT = "N({계약서!계약금액})"
LIM = f'IF({{공종}}="{GJ[0]}",15000000000,12000000000)'
AMTOK = f"AND({AMT}>=100000000,{AMT}<{LIM})"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  기술지도계약서 — 대상 판정 · 체결 기한 · [√] (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 공사금액 1억원 이상 120억원(토목공사업에 속하는 공사는 150억원) 미만인 공사와 건축법 제11조에 따른 건축허가 대상 공사는 착공일의 전날까지 "
              "건설재해예방전문지도기관과 기술지도계약을 맺습니다(산업안전보건법 제73조제1항 · 시행령 제59조).")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  발주자 유형 · 기술지도 구분 (계약서 [√])", need=26 * 3 + 10)
    p.row([(3, "발주자 유형", g.L), (5, I("유형", ex=EX["유형"] if ex else None, dv=",".join(YT), align="center", size=9)),
           (4, "(공공) 정부 · 지방자치단체 · 공공기관 · 지방공기업 · 기타 국가기관 / (민간) 기업 · 개인", s7)], h=26)
    p.row([(3, "기술지도 구분", g.L), (5, I("구분", ex=EX["구분"] if ex else None, dv=",".join(GB), align="center", size=9)), (4, "", s7)], h=26)
    g.sec(p, "㉯  기술지도계약 대상 (영 제59조제1항)", need=26 * 4 + 10)
    p.row([(3, "공종", g.L), (5, I("공종", ex=EX["공종"] if ex else None, dv=",".join(GJ), align="center", size=8.5)),
           (4, "건설산업기본법 시행령 별표 1 토목공사업에 속하는 공사는 150억원 미만까지", s7)], h=26)
    p.row([(3, "건축허가 대상", g.L), (5, I("건축허가", ex=EX["건축허가"] if ex else None, dv=",".join(YN), align="center", size=9)),
           (4, "건축법 제11조에 따른 건축허가의 대상이 되는 공사인지", s7)], h=26)
    p.row([(3, "제외 사유", g.L), (5, I("제외", ex=EX["제외"] if ex else None, dv=",".join(JW), align="center", size=8.5)),
           (4, "영 제59조제1항 단서 1~4 — 해당하면 기술지도계약 대상에서 빠짐", s7)], h=26)
    pd = (f'=IF(AND({AMT}=0,{{건축허가}}=""),"",IF(AND({{제외}}<>"",{{제외}}<>"{JW[0]}"),"{PD_X_A}"&{{제외}}&"{PD_X_B}",'
          f'IF(OR({AMTOK},{{건축허가}}="{YN[0]}"),"{PD_Y_A}"&IF({AMTOK},"{PD_Y_AMT_A}"&IF({{공종}}="{GJ[0]}","150","120")&"{PD_Y_AMT_B}","")'
          f'&IF(AND({AMTOK},{{건축허가}}="{YN[0]}")," · ","")&IF({{건축허가}}="{YN[0]}","{PD_Y_PER}",""),"{PD_N}")))')
    p.row([(3, "판정", g.L), (9, F("판정", pd, align="left", size=8.5, bold=True))], h=40)
    g.sec(p, "㉰  공사기간 · 체결 기한 · 계약기간 · 횟수", need=26 * 7 + 10)
    p.row([(3, "착공일", g.L), (5, I("착공일", ex=EX["착공일"] if ex else None, fmt=DT, align="center", size=9)), (4, "→ 계약서 «공사기간»", s7)], h=24)
    p.row([(3, "준공일", g.L), (5, I("준공일", ex=EX["준공일"] if ex else None, fmt=DT, align="center", size=9)), (4, "", s7)], h=24)
    f = (f'=IF(N({SD})=0,IF(OR(N({ED})>0,N({QD})>0),"{GH_NEED}",""),"{GH_A}"&' + _ymdf(SD) + f'&"{GH_B}"&' + _ymdf(DUE) + '&"("&' + _yo(DUE)
         + f'&")"&"{GH_C}"&IF(WEEKDAY({DUE})=7,"{GH_SAT}",IF(WEEKDAY({DUE})=1,"{GH_SUN}",""))'
         f'&IF(AND(N({QD})>0,N({QD})>{DUE}),"{GH_LATE_A}"&' + _ymdf(QD) + f'&"{GH_LATE_B}",""))')
    p.row([(3, "체결 기한", g.L), (9, F("기한", f, align="left", size=8.5))], h=40)
    p.row([(3, "계약 시작일", g.L), (5, I("계약시작", ex=EX["계약시작"] if ex else None, fmt=DT, align="center", size=9)), (4, "→ 계약서 «계약기간»", s7)], h=24)
    p.row([(3, "계약 끝날", g.L), (5, I("계약끝", ex=EX["계약끝"] if ex else None, fmt=DT, align="center", size=9)), (4, "", s7)], h=24)
    p.row([(3, "기술지도 횟수", g.L), (5, I("횟수", ex=EX["횟수"] if ex else None, fmt='#,##0"회";;""', align="center", size=9)),
           (4, "→ 계약서 «총(   )회»", s7)], h=24)
    g.sec(p, "㉱  아직 안 적은 칸", need=26 * 2 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({계약서!발주자}="",{계약서!공사명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 계약서의 [√] · «공사기간» · «계약기간» · «총( )회» 는 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


BIN = [("발주자 유형", '{유형}=""'), ("발주자 성명 또는 사업자명", '{계약서!발주자}=""'), ("공사명", '{계약서!공사명}=""'),
       ("공사기간(① 장)", f'OR(N({SD})=0,N({ED})=0)'), ("공사금액", "N({계약서!계약금액})=0"), ("건설업체명", '{계약서!상호}=""'),
       ("지도기관 명칭", '{계약서!기관명칭}=""'), ("기술지도 구분", '{구분}=""'), ("기술지도 대가", "N({계약서!대가})=0"),
       ("기술지도 횟수(① 장)", "N({횟수})=0"), ("계약기간(① 장)", "OR(N({계약시작})=0,N({계약끝})=0)")]


def _pair(p, x1, xm, x2, lab, k, ex, ls=None, **kw):
    return [(x1, xm, lab, dict(LT, size=ls) if ls else LT), (xm, x2, inp(k, ex, align="left", **kw), NB)]


# ── 계약서 ──────────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "계약서", fit=1, widths=WP)
    X1, X2 = 120, 1120
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 16, "bold": True, "align": "center"})], h=36)
    # 건설공사발주자 또는 건설공사시공주도총괄ㆍ관리자
    r = prow(p, [(X1, 237, "건설공사\n발주자\n또는 건설\n공사시공주도\n총괄ㆍ관리자", dict(LB, rs=4, size=8.5))]
             + _pair(p, 237, 420, 704, "성명 또는 사업자명", "발주자", ex) + _pair(p, 704, 790, X2, "대표자", "발주대표", ex), h=26)
    _bd(p, r, r, 237, 704)
    _bd(p, r, r, 704, X2)
    r = prow(p, _pair(p, 237, 400, 704, "법인등록번호\n(사업자등록번호)", "발주법인번호", ex) + _pair(p, 704, 850, X2, "사업장관리번호", "발주관리번호", ex), h=26)
    _bd(p, r, r, 237, 704)
    _bd(p, r, r, 704, X2)
    r = prow(p, _pair(p, 237, 300, 704, "주소", "발주주소", ex) + _pair(p, 704, 790, X2, "연락처", "발주연락처", ex), h=26)
    _bd(p, r, r, 237, 704)
    _bd(p, r, r, 704, X2)
    yt = ('="(공공)  "&' + '&"  "&'.join(f'IF({{셈!유형}}="{o}","[√]","[   ]")&"{o}"' for o in YT[:5])
          + '&CHAR(10)&"(민간)  "&' + '&"  "&'.join(f'IF({{셈!유형}}="{o}","[√]","[   ]")&"{o}"' for o in YT[5:]))
    r = prow(p, [(237, 300, "유형", LT), (300, X2, F("유형표시", yt, align="left", size=8), NB)], h=30)
    _bd(p, r, r, 237, X2)
    p.gap(3)
    # 기술지도 위탁 사업장 — 현장 4줄 · 본사 3줄
    r = prow(p, [(X1, 239, "기술지도\n위탁\n사업장", dict(LB, rs=7)), (239, 332, "현장", dict(CT, rs=4, size=9))]
             + _pair(p, 332, 450, 713, "공사명", "공사명", ex) + _pair(p, 713, 840, X2, "사업개시번호", "사업개시번호", ex), h=21)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    kg = ('=IF(AND(N({셈!착공일})=0,N({셈!준공일})=0),"",IF(N({셈!착공일})=0,"",' + _ymdf("{셈!착공일}") + ')&" ~ "&'
          'IF(N({셈!준공일})=0,"",' + _ymdf("{셈!준공일}") + '))')
    r = prow(p, [(332, 420, "공사기간", LT), (420, 713, F("공사기간", kg, align="left", size=8.5), NB)]
             + _pair(p, 713, 800, X2, "공사금액", "계약금액", ex, fmt=WON), h=21)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(p, 332, 450, 713, "현장책임자", "현장책임자", ex) + _pair(p, 713, 800, X2, "연락처", "현장연락처", ex), h=21)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(p, 332, 410, X2, "소재지", "현장소재지", ex), h=21)
    _bd(p, r, r, 332, X2)
    r = prow(p, [(239, 332, "본사", dict(CT, rs=3, size=9))] + _pair(p, 332, 450, 713, "건설업체명", "상호", ex)
             + _pair(p, 713, 800, X2, "대표자", "대표자", ex), h=21)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(p, 332, 500, 713, "법인등록번호\n(사업자등록번호)", "사업자등록번호", ex) + _pair(p, 713, 840, X2, "건설면허번호", "면허번호", ex), h=27)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(p, 332, 400, 713, "주소", "본사주소", ex) + _pair(p, 713, 800, X2, "연락처", "전화번호", ex), h=21)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    p.gap(3)
    # 건설재해예방전문지도기관
    r = prow(p, [(X1, 239, "건설재해\n예방전문\n지도기관", dict(LB, rs=3))] + _pair(p, 239, 320, 713, "명칭", "기관명칭", ex)
             + _pair(p, 713, 800, X2, "대표자", "기관대표", ex), h=24)
    _bd(p, r, r, 239, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(p, 239, 320, 713, "소재지", "기관소재지", ex) + _pair(p, 713, 860, X2, "지정서 발급번호", "지정번호", ex), h=24)
    _bd(p, r, r, 239, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(p, 239, 320, 713, "담당자", "담당자", ex) + _pair(p, 713, 820, X2, "전화번호", "기관전화", ex), h=24)
    _bd(p, r, r, 239, 713)
    _bd(p, r, r, 713, X2)
    p.gap(3)
    # 기술지도
    gb = "=" + '&"   "&'.join(f'IF({{셈!구분}}="{o}","[√]","[   ]")&"{o}"' for o in GB)
    prow(p, [(X1, 239, "기술지도", dict(LB, rs=3)), (239, 450, "기술지도\n구분", dict(CT, bold=True)),
             (450, X2, F("구분표시", gb, align="center", size=9), {})], h=24)
    hs = '="총(  "&IF(N({셈!횟수})=0,"     ",{셈!횟수})&"  )회"'
    prow(p, [(239, 450, "기술지도\n대가", dict(CT, bold=True)), (450, 708, inp("대가", ex, fmt=WON, blank="원", align="right"), {}),
             (708, 831, "기술지도\n횟수", dict(CT, bold=True)), (831, X2, F("횟수표시", hs, align="center", size=9), {})], h=24)
    kk = ('=IF(N({셈!계약시작})=0,"' + KB + '",' + _ymdf("{셈!계약시작}") + '&"부터")&"          "&'
          'IF(N({셈!계약끝})=0,"' + KE + '",' + _ymdf("{셈!계약끝}") + '&"까지")')
    prow(p, [(239, 450, "계약기간", dict(CT, bold=True)), (450, X2, F("계약기간", kk, align="center", size=9), {})], h=24)
    p.gap(8)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 9})], h=34)
    p.gap(6)
    prow(p, [(X1, X2, inp("작성일", ex, blank="년          월          일", fmt="date", align="right", size=9), NB)], h=22)
    sg = {"kind": "free", "size": 9}
    sr = {"kind": "free", "size": 7.5, "align": "right"}
    prow(p, [(X1, 240, "", g.FR), (240, 700, "건설공사발주자 또는 건설공사시공주도총괄ㆍ관리자", sg),
             (700, X2, F("서명발주자", '=IF({발주자}="","",{발주자})', align="left", size=9), NB)], h=22)
    prow(p, [(X1, 240, "", g.FR), (240, 700, "사업주 또는 대표자", sg), (700, 960, F("서명발주대표", '=IF({발주대표}="","",{발주대표})', align="left", size=9), NB),
             (960, X2, "(서명 또는 인)", sr)], h=22)
    prow(p, [(X1, 240, "", g.FR), (240, 700, "건설재해예방전문지도기관 명칭", sg),
             (700, X2, F("서명기관", '=IF({기관명칭}="","",{기관명칭})', align="left", size=9), NB)], h=22)
    r = prow(p, [(X1, 240, "", g.FR), (240, 700, "건설재해예방전문지도기관 대표자", sg),
                 (700, 960, F("서명기관대표", '=IF({기관대표}="","",{기관대표})', align="left", size=9), NB), (960, X2, "(서명 또는 인)", sr)], h=22)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False)
    p.gap(14)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["[√] · «공사기간» · «계약기간» · «총( )회» 는 ① 장에서 들어오고, 서명 칸 이름은 위 칸(발주자 · 지도기관)에서 들어옵니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _y(d):
    return YOIL[(d.weekday() + 1) % 7]


def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


def expect(pages):
    a_in, s_in = pages["셈"], pages["계약서"]
    a, o = {}, {}
    amt = _n(s_in.get("계약금액"))
    gj, hg, jw = a_in.get("공종"), a_in.get("건축허가"), a_in.get("제외")
    lim = 15000000000 if gj == GJ[0] else 12000000000
    amtok = 100000000 <= amt < lim
    if amt == 0 and not hg:
        a["판정"] = ""
    elif jw and jw != JW[0]:
        a["판정"] = PD_X_A + jw + PD_X_B
    elif amtok or hg == YN[0]:
        t = PD_Y_A + ((PD_Y_AMT_A + ("150" if gj == GJ[0] else "120") + PD_Y_AMT_B) if amtok else "")
        t += " · " if (amtok and hg == YN[0]) else ""
        t += PD_Y_PER if hg == YN[0] else ""
        a["판정"] = t
    else:
        a["판정"] = PD_N
    sd, ed, qd = _d(a_in.get("착공일")), _d(a_in.get("준공일")), _d(s_in.get("작성일"))
    if not sd:
        a["기한"] = GH_NEED if (ed or qd) else ""
    else:
        due = sd - datetime.timedelta(days=1)
        t = f"{GH_A}{_ymd(sd)}{GH_B}{_ymd(due)}({_y(due)}){GH_C}"
        t += GH_SAT if due.weekday() == 5 else (GH_SUN if due.weekday() == 6 else "")
        if qd and qd > due:
            t += f"{GH_LATE_A}{_ymd(qd)}{GH_LATE_B}"
        a["기한"] = t
    cs, ce, hs = _d(a_in.get("계약시작")), _d(a_in.get("계약끝")), _n(a_in.get("횟수"))
    if not s_in.get("발주자") and not s_in.get("공사명"):
        a["빈칸"] = ""
    else:
        mc = {"발주자 유형": not a_in.get("유형"), "발주자 성명 또는 사업자명": not s_in.get("발주자"), "공사명": not s_in.get("공사명"),
              "공사기간(① 장)": not (sd and ed), "공사금액": amt == 0, "건설업체명": not s_in.get("상호"), "지도기관 명칭": not s_in.get("기관명칭"),
              "기술지도 구분": not a_in.get("구분"), "기술지도 대가": not _n(s_in.get("대가")), "기술지도 횟수(① 장)": hs == 0,
              "계약기간(① 장)": not (cs and ce)}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
    yt = a_in.get("유형")
    o["유형표시"] = ("(공공)  " + "  ".join(("[√]" if yt == x else "[   ]") + x for x in YT[:5]) + "\n(민간)  "
                  + "  ".join(("[√]" if yt == x else "[   ]") + x for x in YT[5:]))
    o["공사기간"] = "" if not (sd or ed) else ((_ymd(sd) if sd else "") + " ~ " + (_ymd(ed) if ed else ""))
    gb = a_in.get("구분")
    o["구분표시"] = "   ".join(("[√]" if gb == x else "[   ]") + x for x in GB)
    o["횟수표시"] = "총(  " + (str(int(hs)) if hs else "     ") + "  )회"
    o["계약기간"] = ((_ymd(cs) + "부터") if cs else KB) + "          " + ((_ymd(ce) + "까지") if ce else KE)
    for k, src in (("서명발주자", "발주자"), ("서명발주대표", "발주대표"), ("서명기관", "기관명칭"), ("서명기관대표", "기관대표")):
        o[k] = s_in.get(src) or ""
    return {"셈": a, "계약서": o}


for _t in (PD_X_A, PD_X_B, PD_Y_A, PD_Y_AMT_A, PD_Y_AMT_B, PD_Y_PER, PD_N, GH_A, GH_B, GH_C, GH_SAT, GH_SUN, GH_LATE_A, GH_LATE_B, GH_NEED, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _t in (*YT, *GB, *GJ, *YN, *JW):
    assert "," not in _t
