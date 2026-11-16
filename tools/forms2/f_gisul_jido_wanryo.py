# -*- coding: utf-8 -*-
"""기술지도 완료증명서 — 새로 만든 서식 (2026-11-16 G715 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 발주자 유형 [√] · 기술지도 구분 [√] · 공사기간 · 계약기간 · 계약 횟수(→ «총( )회») · 실시일자 12칸(→ 증명서 «00월/00일») ·
     실시 횟수와 계약 횟수 견줌 · 계약기간 밖 실시일 · 날짜 차례 점검 · 아직 안 적은 칸
   · 증명서(산업안전보건법 시행규칙 [별지 제105호서식] <개정 2023. 9. 27.> 칸 차례 그대로 — 세로 한 쪽 · 서명 칸 이름은 위 칸에서).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1125.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G715_기술지도완료증명서_원문.txt — 글층 해시 같음 확인):
  · 산업안전보건법 제73조(건설공사의 산업재해 예방 지도) · 시행령 제59조 · 제60조(지도 기준 — 별표 18) · 원문 문구 «시행규칙 제89조의2제2항에 따라 … 증명»
■ 짐작 안 함: 기술지도 횟수 기준(별표 18)은 셈하지 않고 «계약 횟수» 와만 견줌 · 실시일자 칸은 원문처럼 12칸(넘으면 별지 — 글로 알림)."""
import datetime

import sgw as g
from fb import F, I, text_lines

SLUG = "gisul-jido-wanryo"
TITLE = "기술지도 완료증명서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "기술지도 완료증명서(산업안전보건법 시행규칙 별지 제105호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "기술지도 완료증명서 — 작성 예시 (유형 · 구분 [√] 와 기간 · 횟수 · 실시일자가 ① 장에서 저절로)"),
        (3, "① 실시 횟수 · 계약기간 · 날짜 차례 점검 — 작성 예시")]
MULTI = True
SHORT = ("기술지도 완료증명서(산업안전보건법 시행규칙 별지 제105호서식) — 실시일자를 적으면 증명서 «00월/00일» 칸이 채워지고, 실시 횟수가 계약 횟수와 "
         "맞는지 · 계약기간 밖 날짜 · 날짜 차례가 저절로 점검됩니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
WON = '#,##0"원";;""'
NS = 12

YT = ["정부", "지방자치단체", "공공기관", "지방공기업", "기타 국가기관", "기업", "개인"]
GB = ["건설공사", "전기 및 정보통신 공사"]
SS_A = "실시 "
SS_B = "회"
SS_C = " / 계약 "
SS_LESS = " · ⚠ 계약 횟수보다 적음"
SS_MORE = " · 계약 횟수보다 많음"
SS_OVER = " · 12회를 넘는 실시일자는 별지에 이어 적음"
JG_OUT = "⚠ 계약기간 밖 실시일:"
JG_ORD = "⚠ 앞 회차보다 빠른 날짜:"
JG_OK1 = "✓ 실시일자가 모두 계약기간 안"
JG_OK2 = "✓ 날짜 차례가 맞음"
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
KB = "     년     월     일부터"
KE = "     년     월     일까지"
DB = "00월/" + "\n" + "00일"

EX = {"유형": YT[1], "구분": GB[0], "착공일": D(2027, 3, 3), "준공일": D(2027, 8, 31), "계약시작": D(2027, 3, 3), "계약끝": D(2027, 8, 31), "횟수": 12,
      "실시#1": D(2027, 3, 10), "실시#2": D(2027, 3, 24), "실시#3": D(2027, 4, 7), "실시#4": D(2027, 4, 21), "실시#5": D(2027, 5, 6),
      "실시#6": D(2027, 5, 19), "실시#7": D(2027, 6, 2), "실시#8": D(2027, 6, 16), "실시#9": D(2027, 6, 30), "실시#10": D(2027, 7, 14),
      "실시#11": D(2027, 7, 28), "실시#12": D(2027, 8, 11)}
EX_S = {"발주자": "가나시", "발주대표": "가나시장", "발주법인번호": "000000-0000000", "발주관리번호": "00000000000", "발주주소": "가나시 다라구 시청로 1",
        "발주연락처": "000-000-0000",
        "공사명": "가나시 마을회관 증축공사", "사업개시번호": "00000000000", "계약금액": 2850000000, "현장책임자": "정민호", "현장연락처": "010-0000-0000",
        "현장소재지": "가나시 마바구 사아동 45",
        "상호": "다라건설(주)", "대표자": "이가람", "사업자등록번호": "000-00-00000", "면허번호": "가나시-00-000", "본사주소": "가나시 다라구 바사로 12",
        "전화번호": "000-000-0000",
        "기관명칭": "마바안전기술(주)", "기관대표": "최지훈", "기관소재지": "가나시 다라구 바사로 77", "지정번호": "제0000-00호", "담당자": "한소영",
        "기관전화": "000-000-0000", "대가": 3080000, "작성일": D(2027, 9, 3)}
HEAD = "■ 산업안전보건법 시행규칙 [별지 제105호서식] <개정 2023. 9. 27.>"
STATEMENT = "「산업안전보건법 시행령」 제60조, 별표 18 및 같은 법 시행규칙 제89조의2제2항에 따라 기술지도를 실시하였음을 증명합니다."
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(120, 1125)


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


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


SI = [f"{{실시#{k}}}" for k in range(1, NS + 1)]
CNT = "(" + "+".join(f"IF(N({s})>0,1,0)" for s in SI) + ")"
CS, CE = "{계약시작}", "{계약끝}"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  기술지도 완료증명서 — 실시 횟수 · 계약기간 · 날짜 차례 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 건설재해예방전문지도기관이 기술지도를 마치면 이 증명서를 발급합니다(산업안전보건법 시행령 제60조 · 별표 18 · 시행규칙 제89조의2제2항 — 원문 문구). "
              "아래 실시일자를 적으면 증명서의 «00월/00일» 칸이 채워집니다.")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  발주자 유형 · 기술지도 구분 (증명서 [√])", need=26 * 3 + 10)
    p.row([(3, "발주자 유형", g.L), (5, I("유형", ex=EX["유형"] if ex else None, dv=",".join(YT), align="center", size=9)),
           (4, "(공공) 정부 · 지방자치단체 · 공공기관 · 지방공기업 · 기타 국가기관 / (민간) 기업 · 개인", s7)], h=26)
    p.row([(3, "기술지도 구분", g.L), (5, I("구분", ex=EX["구분"] if ex else None, dv=",".join(GB), align="center", size=9)), (4, "", s7)], h=26)
    g.sec(p, "㉯  공사기간 · 계약기간 · 계약 횟수", need=26 * 6 + 10)
    for k, lab, note in (("착공일", "착공일", "→ 증명서 «공사기간»"), ("준공일", "준공일", ""), ("계약시작", "계약 시작일", "→ 증명서 «계약기간»"),
                         ("계약끝", "계약 끝날", "")):
        p.row([(3, lab, g.L), (5, I(k, ex=EX[k] if ex else None, fmt=DT, align="center", size=9)), (4, note, s7)], h=24)
    p.row([(3, "계약 횟수", g.L), (5, I("횟수", ex=EX["횟수"] if ex else None, fmt='#,##0"회";;""', align="center", size=9)),
           (4, "→ 증명서 «총(   )회»", s7)], h=24)
    g.sec(p, "㉰  실시일자 (→ 증명서 «00월/00일»)", need=26 * 6 + 10)
    for j in range(1, 7):
        a, b = j, j + 6
        p.row([(2, f"{a}회차", g.L), (4, I(f"실시#{a}", ex=EX[f"실시#{a}"] if ex else None, fmt=DT, align="center", size=9)),
               (2, f"{b}회차", g.L), (4, I(f"실시#{b}", ex=EX[f"실시#{b}"] if ex else None, fmt=DT, align="center", size=9))], h=22)
    ss = (f'=IF(AND({CNT}=0,N({{횟수}})=0),"","{SS_A}"&{CNT}&"{SS_B}"&IF(N({{횟수}})>0,"{SS_C}"&{{횟수}}&"{SS_B}","")'
          f'&IF(AND(N({{횟수}})>0,{CNT}<N({{횟수}})),"{SS_LESS}",IF(AND(N({{횟수}})>0,{CNT}>N({{횟수}})),"{SS_MORE}",""))'
          f'&IF(N({{횟수}})>{NS},"{SS_OVER}",""))')
    p.row([(3, "실시 횟수", g.L), (9, F("실시", ss, align="left", size=8.5))], h=34)
    out = "&".join(f'IF(AND(N({s})>0,OR(AND(N({CS})>0,{s}<{CS}),AND(N({CE})>0,{s}>{CE})))," {k}회차","")' for k, s in enumerate(SI, 1))
    order = "&".join(f'IF(AND(N({SI[k - 1]})>0,N({SI[k - 2]})>0,{SI[k - 1]}<{SI[k - 2]})," {k}회차","")' for k in range(2, NS + 1))
    p.row([(3, "계약기간 안", g.L), (9, F("범위", f'=IF({CNT}=0,"",IF(({out})="","{JG_OK1}","{JG_OUT}"&({out})))', align="left", size=8.5))], h=26)
    p.row([(3, "날짜 차례", g.L), (9, F("차례", f'=IF({CNT}=0,"",IF(({order})="","{JG_OK2}","{JG_ORD}"&({order})))', align="left", size=8.5))], h=26)
    g.sec(p, "㉱  아직 안 적은 칸", need=26 * 2 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({증명서!발주자}="",{증명서!공사명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 증명서의 [√] · «공사기간» · «계약기간» · «총( )회» · 실시일자는 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


BIN = [("발주자 유형", '{유형}=""'), ("발주자 성명 또는 사업자명", '{증명서!발주자}=""'), ("공사명", '{증명서!공사명}=""'),
       ("공사기간(① 장)", "OR(N({착공일})=0,N({준공일})=0)"), ("공사금액", "N({증명서!계약금액})=0"), ("건설업체명", '{증명서!상호}=""'),
       ("지도기관 명칭", '{증명서!기관명칭}=""'), ("기술지도 구분", '{구분}=""'), ("기술지도 대가", "N({증명서!대가})=0"),
       ("계약 횟수(① 장)", "N({횟수})=0"), ("계약기간(① 장)", f"OR(N({CS})=0,N({CE})=0)"), ("실시일자(① 장)", f"{CNT}=0")]


def _pair(x1, xm, x2, lab, k, ex, **kw):
    return [(x1, xm, lab, LT), (xm, x2, inp(k, ex, align="left", **kw), NB)]


def _md(ref):
    return f'IF(MONTH({ref})<10,"0","")&MONTH({ref})&"월/"&CHAR(10)&IF(DAY({ref})<10,"0","")&DAY({ref})&"일"'


# ── 증명서 ──────────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "증명서", fit=1, widths=WP)
    X1, X2 = 120, 1125
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 16, "bold": True, "align": "center"})], h=34)
    # 건설공사발주자 또는 건설공사시공주도총괄ㆍ관리자
    r = prow(p, [(X1, 227, "건설공사\n발주자\n또는 건설\n공사시공주도\n총괄ㆍ관리자", dict(LB, rs=4, size=8.5))]
             + _pair(227, 420, 715, "성명 또는 사업자명", "발주자", ex) + _pair(715, 800, X2, "대표자", "발주대표", ex), h=24)
    _bd(p, r, r, 227, 715)
    _bd(p, r, r, 715, X2)
    r = prow(p, _pair(227, 400, 715, "법인등록번호\n(사업자등록번호)", "발주법인번호", ex) + _pair(715, 850, X2, "사업장관리번호", "발주관리번호", ex), h=26)
    _bd(p, r, r, 227, 715)
    _bd(p, r, r, 715, X2)
    r = prow(p, _pair(227, 290, 715, "주소", "발주주소", ex) + _pair(715, 800, X2, "연락처", "발주연락처", ex), h=24)
    _bd(p, r, r, 227, 715)
    _bd(p, r, r, 715, X2)
    yt = ('="(공공)  "&' + '&"  "&'.join(f'IF({{셈!유형}}="{o}","[√]","[   ]")&"{o}"' for o in YT[:5])
          + '&CHAR(10)&"(민간)  "&' + '&"  "&'.join(f'IF({{셈!유형}}="{o}","[√]","[   ]")&"{o}"' for o in YT[5:]))
    r = prow(p, [(227, 290, "유형", LT), (290, X2, F("유형표시", yt, align="left", size=8), NB)], h=30)
    _bd(p, r, r, 227, X2)
    p.gap(3)
    # 기술지도 위탁 사업장
    r = prow(p, [(X1, 227, "기술지도\n위탁\n사업장", dict(LB, rs=7)), (227, 332, "현장", dict(CT, rs=4, size=9))]
             + _pair(332, 450, 713, "공사명", "공사명", ex) + _pair(713, 840, X2, "사업개시번호", "사업개시번호", ex), h=19)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    kg = ('=IF(AND(N({셈!착공일})=0,N({셈!준공일})=0),"",IF(N({셈!착공일})=0,"",' + _ymdf("{셈!착공일}") + ')&" ~ "&'
          'IF(N({셈!준공일})=0,"",' + _ymdf("{셈!준공일}") + '))')
    r = prow(p, [(332, 420, "공사기간", LT), (420, 713, F("공사기간", kg, align="left", size=8.5), NB)]
             + _pair(713, 800, X2, "공사금액", "계약금액", ex, fmt=WON), h=19)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(332, 450, 713, "현장책임자", "현장책임자", ex) + _pair(713, 800, X2, "연락처", "현장연락처", ex), h=19)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(332, 410, X2, "소재지", "현장소재지", ex), h=19)
    _bd(p, r, r, 332, X2)
    r = prow(p, [(227, 332, "본사", dict(CT, rs=3, size=9))] + _pair(332, 450, 713, "건설업체명", "상호", ex) + _pair(713, 800, X2, "대표자", "대표자", ex), h=19)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(332, 500, 713, "법인등록번호\n(사업자등록번호)", "사업자등록번호", ex) + _pair(713, 840, X2, "건설면허번호", "면허번호", ex), h=27)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(332, 400, 713, "주소", "본사주소", ex) + _pair(713, 800, X2, "연락처", "전화번호", ex), h=19)
    _bd(p, r, r, 332, 713)
    _bd(p, r, r, 713, X2)
    p.gap(3)
    # 건설재해예방전문지도기관
    r = prow(p, [(X1, 227, "건설재해\n예방전문\n지도기관", dict(LB, rs=3))] + _pair(227, 310, 713, "명칭", "기관명칭", ex)
             + _pair(713, 800, X2, "대표자", "기관대표", ex), h=19)
    _bd(p, r, r, 227, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(227, 310, 713, "소재지", "기관소재지", ex) + _pair(713, 860, X2, "지정서 발급번호", "지정번호", ex), h=19)
    _bd(p, r, r, 227, 713)
    _bd(p, r, r, 713, X2)
    r = prow(p, _pair(227, 310, 713, "담당자", "담당자", ex) + _pair(713, 820, X2, "전화번호", "기관전화", ex), h=19)
    _bd(p, r, r, 227, 713)
    _bd(p, r, r, 713, X2)
    p.gap(3)
    # 기술지도 — 구분 · 대가 · 횟수 · 계약기간 · 실시내용(회차 · 실시일자 12칸)
    gb = "=" + '&"   "&'.join(f'IF({{셈!구분}}="{o}","[√]","[   ]")&"{o}"' for o in GB)
    prow(p, [(X1, 227, "기술지도", dict(LB, rs=5)), (227, 399, "기술지도\n구분", dict(CT, bold=True)), (399, X2, F("구분표시", gb, align="center", size=9), {})], h=26)
    hs = '="총(  "&IF(N({셈!횟수})=0,"     ",{셈!횟수})&"  )회"'
    prow(p, [(227, 399, "기술지도\n대가", dict(CT, bold=True)), (399, 715, inp("대가", ex, fmt=WON, blank="원", align="right"), {}),
             (715, 846, "기술지도\n횟수", dict(CT, bold=True)), (846, X2, F("횟수표시", hs, align="center", size=9), {})], h=26)
    kk = ('=IF(N({셈!계약시작})=0,"' + KB + '",' + _ymdf("{셈!계약시작}") + '&"부터")&"          "&'
          'IF(N({셈!계약끝})=0,"' + KE + '",' + _ymdf("{셈!계약끝}") + '&"까지")')
    prow(p, [(227, 399, "계약기간", dict(CT, bold=True)), (399, X2, F("계약기간", kk, align="center", size=9), {})], h=20)
    XS = [399, 459, 520, 580, 641, 701, 762, 822, 883, 943, 1004, 1064, X2]
    items = [(227, 292, "실시\n내용", dict(CT, rs=2, bold=True)), (292, 399, "회차", dict(CT, bold=True))]
    items += [(XS[k], XS[k + 1], str(k + 1), CT) for k in range(NS)]
    prow(p, items, h=16)
    items = [(292, 399, "실시일자", dict(CT, bold=True))]
    for k in range(NS):
        ref = f"{{셈!실시#{k + 1}}}"
        items.append((XS[k], XS[k + 1], F(f"일자#{k + 1}", f'=IF(N({ref})=0,"00월/"&CHAR(10)&"00일",' + _md(ref) + ')', align="center", size=8),
                      {}))
    prow(p, items, h=44)
    p.gap(8)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 9})], h=30)
    p.gap(4)
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
    p.gap(10)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["[√] · «공사기간» · «계약기간» · «총( )회» · 실시일자는 ① 장에서 들어오고, 서명 칸 이름은 위 칸(발주자 · 지도기관)에서 들어옵니다. "
                  "실시가 12회를 넘으면 별지에 이어 적습니다."]
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


def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


def expect(pages):
    a_in, s_in = pages["셈"], pages["증명서"]
    a, o = {}, {}
    ds = [_d(a_in.get(f"실시#{k}")) for k in range(1, NS + 1)]
    n = sum(1 for d in ds if d)
    hs = int(_n(a_in.get("횟수")))
    if n == 0 and hs == 0:
        a["실시"] = ""
    else:
        t = f"{SS_A}{n}{SS_B}" + (f"{SS_C}{hs}{SS_B}" if hs else "")
        if hs and n < hs:
            t += SS_LESS
        elif hs and n > hs:
            t += SS_MORE
        if hs > NS:
            t += SS_OVER
        a["실시"] = t
    cs, ce = _d(a_in.get("계약시작")), _d(a_in.get("계약끝"))
    out = "".join(f" {k}회차" for k, d in enumerate(ds, 1) if d and ((cs and d < cs) or (ce and d > ce)))
    order = "".join(f" {k}회차" for k in range(2, NS + 1) if ds[k - 1] and ds[k - 2] and ds[k - 1] < ds[k - 2])
    a["범위"] = "" if n == 0 else (JG_OK1 if not out else JG_OUT + out)
    a["차례"] = "" if n == 0 else (JG_OK2 if not order else JG_ORD + order)
    sd, ed = _d(a_in.get("착공일")), _d(a_in.get("준공일"))
    if not s_in.get("발주자") and not s_in.get("공사명"):
        a["빈칸"] = ""
    else:
        mc = {"발주자 유형": not a_in.get("유형"), "발주자 성명 또는 사업자명": not s_in.get("발주자"), "공사명": not s_in.get("공사명"),
              "공사기간(① 장)": not (sd and ed), "공사금액": not _n(s_in.get("계약금액")), "건설업체명": not s_in.get("상호"),
              "지도기관 명칭": not s_in.get("기관명칭"), "기술지도 구분": not a_in.get("구분"), "기술지도 대가": not _n(s_in.get("대가")),
              "계약 횟수(① 장)": hs == 0, "계약기간(① 장)": not (cs and ce), "실시일자(① 장)": n == 0}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
    yt = a_in.get("유형")
    o["유형표시"] = ("(공공)  " + "  ".join(("[√]" if yt == x else "[   ]") + x for x in YT[:5]) + "\n(민간)  "
                  + "  ".join(("[√]" if yt == x else "[   ]") + x for x in YT[5:]))
    o["공사기간"] = "" if not (sd or ed) else ((_ymd(sd) if sd else "") + " ~ " + (_ymd(ed) if ed else ""))
    gb = a_in.get("구분")
    o["구분표시"] = "   ".join(("[√]" if gb == x else "[   ]") + x for x in GB)
    o["횟수표시"] = "총(  " + (str(hs) if hs else "     ") + "  )회"
    o["계약기간"] = ((_ymd(cs) + "부터") if cs else KB) + "          " + ((_ymd(ce) + "까지") if ce else KE)
    for k, d in enumerate(ds, 1):
        o[f"일자#{k}"] = DB if not d else f"{d.month:02d}월/\n{d.day:02d}일"
    for k, src in (("서명발주자", "발주자"), ("서명발주대표", "발주대표"), ("서명기관", "기관명칭"), ("서명기관대표", "기관대표")):
        o[k] = s_in.get(src) or ""
    return {"셈": a, "증명서": o}


for _t in (SS_A, SS_B, SS_C, SS_LESS, SS_MORE, SS_OVER, JG_OUT, JG_ORD, JG_OK1, JG_OK2, BIN_OK, BIN_A, KB, KE):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _t in (*YT, *GB):
    assert "," not in _t
