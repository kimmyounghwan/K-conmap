# -*- coding: utf-8 -*-
"""도로공사 시행 허가 신청서 — 새로 만든 서식 (2026-11-17 G744 · 소장님 「그럼 이제 서식 10개만 만들자. 못 만든 서식...」 — 도로법 4종 첫째)
   → ① 공사시행 구간 길이(시점 ~ 종점 킬로미터) · 공사시행 기간 일수 · 수수료(공사비의 1/1,000 — 서식 글) · 처리 기한(15일 — 민원처리법 제19조②) ·
     착수 · 준공 때 할 일 · 아직 안 적은 칸
   · 신청서 한 쪽(도로법 시행규칙 [별지 제11호서식] 칸 차례 그대로 — 접수 띠 · 신청인 · 신청내용 · 신청 문구 · 첨부서류 · 수수료).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G744/구조.md — 바깥 90 ~ 1101 · 이름 칸 216 · 신청인 751 · 신청내용 625 · 첨부 216 · 858).

근거(국가법령정보센터 · 2026-11-17 · 원문 /home/claude/g10/notes/G744/p1.txt(글층 해시 797e2ff27dd4c808) · 조문 G744/근거.md — 세 번 같은 해시):
  · 도로법 [시행 2026. 9. 18.] 제36조 — ① 도로관리청이 아닌 자의 도로공사 시행은 미리 도로관리청의 허가 ② 허가를 받은 자는 공사착수 사실 신고 · 준공하면 준공검사
  · 도로법 시행령 [시행 2026. 9. 18.] 제34조 — ① 허가신청서 + 사업계획서 · 설계도서 ② 허가 내용 공고 ③ 착수하였을 때 5일 이내 신고 · 준공하면 지체 없이 준공검사
  · 도로법 시행규칙 [시행 2026. 9. 18.] 제13조 — ① 별지 제11호서식 ③ 착수 신고 별지 제12호 · 준공검사 신청 별지 제13호
  · 「민원 처리에 관한 법률」 제19조② — 처리기간 15일: 받은 날을 1일로 토 · 일 · 공휴일 빼고 15번째 근무일(민원기한.py)
■ 원문 그대로: 서식 머리 «■ 도로법 시행규칙 [별지 제11호서식]»(개정 표시 없음) · 수수료 글 · «킬로미터» · «일간».
■ 짐작 안 함: 수수료는 서식 글(공사비의 1/1,000 또는 조례 금액) 그대로 셈만 — 조례 금액은 도로관리청 확인 · 구간 길이는 적은 두 값의 차 ·
  일간은 첫날과 끝날을 넣어 셈(○일부터 ○일까지)."""
import datetime
import math

import sgw as g
from fb import F, I
from sgw import L
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUB, SUBC, FR, FRR, FRC, NB, _ymd, _yo
import 민원기한 as MW

SLUG = "doro-gongsa-heoga"
TITLE = "도로공사 시행 허가 신청서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "도로공사 시행 허가 신청서(도로법 시행규칙 별지 제11호서식) — 빈 서식 (원문 칸 차례 그대로 · 한 쪽)"),
        (4, "도로공사 시행 허가 신청서 — 작성 예시 (구간 · 기간 · 일수가 ① 장에서)"),
        (3, "① 구간 길이 · 공사 일수 · 수수료 · 처리 기한 — 작성 예시 (가상의 현장)")]
MULTI = True
SHORT = ("도로공사 시행 허가 신청서(도로법 시행규칙 별지 제11호서식) — 도로관리청이 아닌 자가 도로공사를 할 때 냅니다. 시점 · 종점(킬로미터)과 "
         "공사 기간을 적으면 구간 길이 · 일수가, 공사비를 적으면 수수료(1/1,000)가, 신청일을 적으면 처리 기한(15일)이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
KM = '#,##0.000;;""'
WON = '#,##0" 원";;""'
ROADS = ["고속국도", "일반국도", "특별시도", "광역시도", "지방도", "시도", "군도", "구도"]

KM_BAD = "⚠ 종점이 시점보다 앞(작은 값)입니다 — 두 값의 차로 셈"
GI_BAD = "⚠ 끝날이 시작일보다 앞입니다"
FEE_A = "공사비의 1/1,000 = "
FEE_B = " (또는 도로관리청이 속하는 지방자치단체의 조례로 정하는 금액 — 서식 수수료 글 · 도로관리청에 확인)"
CH_A = "까지 — 신청서를 받은 날을 1일로 토 · 일 · 공휴일 빼고 15일(처리기간 · 민원처리법 제19조②)"
NEXT = ("허가 뒤: 도로관리청이 허가 내용 공고(영 제34조제2항) ➔ 공사에 착수하면 5일 이내 착수 신고(별지 제12호서식 · 영 제34조제3항) ➔ "
        "준공하면 지체 없이 준공조서 · 설계도서 · 비용정산서를 붙여 준공검사(별지 제13호서식)")
BIN_OK = "✓ 신청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ── 작성 예시(가상의 땅 · 사람 · 번호) ─────────────────────────────────
EX = {"도로종류": "군도", "시점": 2.35, "종점": 2.6, "시작": D(2027, 3, 15), "끝": D(2027, 5, 31), "공사비": 184_000_000, "신청일": D(2027, 2, 15)}
EX_S = {"성명": "가나건설(주) 대표이사 홍길동", "생년월일": "000000-0000000", "주소": "가나시 다라구 마바로 12", "전화": "000-0000-0000",
        "노선번호": "군도 3호선", "노선명": "다라 ~ 마바", "공사종류": "도로 확장 · 포장(진입로 접속부)", "시행장소": "가나군 다라면 마바리 123-4 일원",
        "목적": "공장 진입로 접속을 위한 도로 확장(가나군 도로 확장 계획과 협의)", "수신": "가나군수"}

HEAD = "■ 도로법 시행규칙 [별지 제11호서식]"
# 수수료 1/1,000 — 반올림 · 버림 없이 «있는 그대로»(원 정수 공사비 ÷ 1,000 은 소수 셋째 자리까지) · 끝 0 은 뗌
#   🩹 11-17: TEXT(x,"#,##0.##") 는 LibreOffice 가 «184,000.» 로 점을 남김(사이트 · 엑셀은 «184,000») → 몫 · 나머지로 따로 씀
_C = "ROUND({공사비},0)"
_R = "MOD(" + _C + ",1000)"
_FEE_TXT = ('TEXT(INT(' + _C + '/1000),"#,##0")&IF(' + _R + '=0,"","."&IF(MOD(' + _C + ',100)=0,TEXT(' + _R + '/100,"0"),'
            'IF(MOD(' + _C + ',10)=0,TEXT(' + _R + '/10,"00"),TEXT(' + _R + ',"000"))))')


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  도로공사 시행 허가 — 구간 · 기간 · 수수료 · 처리 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 도로관리청이 아닌 자가 도로공사를 시행하려면 미리 도로관리청의 허가를 받습니다(도로법 제36조제1항). 여기 적은 값이 신청서의 도로의 종류 · "
              "공사시행 구간 · 기간 · 일수로 들어가고, 수수료 · 처리 기한이 나옵니다.")
    g.sec(p, "㉮  도로 · 공사시행 구간 · 기간", need=26 * 4 + 10)
    p.row([(3, "도로의 종류", L), (3, I("도로종류", ex=_ex(ex, "도로종류"), dv=",".join(ROADS), align="center", size=9)),
           (6, "고속국도 · 일반국도 · 특별시도 · 광역시도 · 지방도 · 시도 · 군도 · 구도", s7)], h=26)
    p.row([(3, "시점(킬로미터)", L), (3, I("시점", ex=_ex(ex, "시점"), fmt=KM, align="center", size=9)),
           (3, "종점(킬로미터)", L), (3, I("종점", ex=_ex(ex, "종점"), fmt=KM, align="center", size=9))], h=26)
    p.row([(3, "구간 길이", L),
           (9, F("구간", '=IF(OR({시점}="",{종점}=""),"",IF({종점}<{시점},"' + KM_BAD + ' · ","")&TEXT(ABS({종점}-{시점}),"0.000")&" 킬로미터")',
                 align="left", size=9))], h=26)
    p.row([(3, "공사 시작일", L), (3, I("시작", ex=_ex(ex, "시작"), fmt=DT, align="center", size=9)),
           (3, "공사 끝날", L), (3, I("끝", ex=_ex(ex, "끝"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "공사시행 일수", L),
           (9, F("일수", '=IF(OR(N({시작})=0,N({끝})=0),"",IF({끝}<{시작},"' + GI_BAD + '",({끝}-{시작}+1)&"일간(첫날 · 끝날 넣어 셈)"))',
                 align="left", size=9))], h=26)
    g.sec(p, "㉯  수수료 · 처리 기한", need=26 * 3 + 10)
    p.row([(3, "공 사 비", L), (3, I("공사비", ex=_ex(ex, "공사비"), fmt=WON, align="right", size=9)),
           (6, "수수료 = 공사비의 1/1,000 또는 조례로 정하는 금액(서식)", s7)], h=26)
    p.row([(3, "수 수 료", L),
           (9, F("수수료", '=IF(N({공사비})=0,"","' + FEE_A + '"&' + _FEE_TXT + '&"원' + FEE_B + '")', align="left", size=8.5))], h=30)
    p.row([(3, "신 청 일", L), (3, I("신청일", ex=_ex(ex, "신청일"), fmt=DT, align="center", size=9)),
           (6, "신청서 끝 날짜로 들어갑니다", s7)], h=26)
    p.row([(3, "처리 기한", L),
           (9, F("처리", '=IF(N({신청일})=0,"",' + _ymd("{처끝}") + '&"("&' + _yo("{처끝}") + '&")' + CH_A + '"&IF(' + MW.덮음식("{신청일}", "{처끝}")
                 + ',"' + MW.밖글 + '",""))', align="left", size=8.5))], h=36)
    g.sec(p, "㉰  아직 안 적은 칸 · 다음 할 일", need=40 + 46 + 10)
    BIN = [("신청인 성명", '{신청서!성명}=""'), ("주소", '{신청서!주소}=""'), ("도로의 종류", '{도로종류}=""'), ("노선번호", '{신청서!노선번호}=""'),
           ("공사의 종류", '{신청서!공사종류}=""'), ("시행장소", '{신청서!시행장소}=""'), ("공사시행 구간", 'OR({시점}="",{종점}="")'),
           ("공사시행 기간", "OR(N({시작})=0,N({끝})=0)"), ("공사의 목적 및 사유", '{신청서!목적}=""'), ("신청일", "N({신청일})=0")]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND({도로종류}="",{신청서!성명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))',
                 align="left", size=8.5))], h=40)
    p.row([(2, "다음 할 일", dict(L, size=8.5)), (10, F("다음", '=IF(AND({도로종류}="",{신청서!성명}=""),"","' + NEXT + '")', align="left", size=8))], h=46)
    MW.넣기(p, "{신청일}", 15, "처")            # 숨은 줄 — 평일 공휴일 표 · 처리기간 되풀이 칸({처끝})
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 시점 · 종점 · 공사 기간 · 공사비 · 신청일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 군도 확장 공사 — 2.350 ~ 2.600 킬로미터)."])
    return p


# ── 신청서(한 쪽) ─────────────────────────────────────────────────────────
# 원문 그림 줄 자리(notes/G744/구조.md): 바깥 90 ~ 1101 · 접수 띠 327 · 821 / 이름 칸 216 / 신청인 751 / 신청내용 625 / 첨부 216 · 858
PAX = [90, 216, 327, 470, 496, 545, 625, 700, 725, 751, 800, 821, 871, 958, 1046, 1060, 1101]
GA = Grid(PAX)


def form(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "신청서", fit=1, widths=GA.w)
    X1, XL, X2 = 90, 216, 1101

    def inp(k, **kw):
        kw.setdefault("size", 9)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    SB = dict(SUB, size=8.5)
    prow(p, GA, [(X1, X2, HEAD, {"kind": "free", "size": 7.5})], h=13)
    p.gap(14)
    prow(p, GA, [(X1, X2, "도로공사 시행 허가 신청서", {"kind": "free", "size": 17, "bold": True, "align": "center"})], h=28)
    p.gap(12)
    band = dict(SUB, fill=S["gray"], size=8)
    rb = prow(p, GA, [(X1, 327, "접수번호", band), (327, 821, "접수일", band), (821, 958, "처리기간", band), (958, X2, "15일", dict(band, valign="center"))], h=23)
    for x in (327, 821):
        vline(p, GA, rb, rb, x, S["gry"])
    p.gap(2)
    # 신청인
    a = prow(p, GA, [(X1, XL, "신청인", dict(SUBC, size=10, rs=4)), (XL, 751, "성명(법인의 경우는 그 명칭 및 대표자 성명)", SB), (751, X2, "생년월일(법인등록번호)", SB)], h=14)
    b = prow(p, GA, [(XL, 751, inp("성명"), NB), (751, X2, inp("생년월일"), NB)], h=34)
    hline(p, GA, b, XL, X2, S["lgt"])
    vline(p, GA, a, b, 751, S["lgt"])
    prow(p, GA, [(XL, X2, "주소(법인의 경우에는 주된 사무소의 소재지)", SB)], h=14)
    c = prow(p, GA, [(XL, 751, inp("주소"), NB), (751, 871, "(전화번호 :", dict(FRR, size=8.5)), (871, 1060, inp("전화", size=8.5), NB),
                     (1060, X2, ")", dict(FR, size=8.5))], h=34)
    vline(p, GA, a, c, XL, S["gry"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, c, X1, X2, S["med"])
    p.gap(3)
    # 신청내용
    a = prow(p, GA, [(X1, XL, "신청내용", dict(SUBC, size=10, rs=10)), (XL, 625, "도로의 종류", SB), (625, X2, "노선번호(노선명)", SB)], h=14)
    b = prow(p, GA, [(XL, 625, F("표도로", '=IF({셈!도로종류}="","",{셈!도로종류})', align="left", size=9), NB),
                     (625, 800, inp("노선번호", size=8.5), NB), (800, 821, "(", dict(FRC, size=9)), (821, 1046, inp("노선명", size=8.5, align="center"), NB),
                     (1046, X2, ")", dict(FR, size=9))], h=34)
    c = prow(p, GA, [(XL, 625, "공사의 종류", SB), (625, X2, "시행장소", SB)], h=14)
    d = prow(p, GA, [(XL, 625, inp("공사종류", size=8.5), NB), (625, X2, inp("시행장소", size=8.5), NB)], h=34)
    e = prow(p, GA, [(XL, X2, "공사시행 구간", SB)], h=14)
    f = prow(p, GA, [(XL, 470, F("표시점", '=IF({셈!시점}="","",{셈!시점})', fmt=KM, align="right", size=9), NB), (470, 545, "부터", dict(FRC, size=9)),
                     (545, 700, F("표종점", '=IF({셈!종점}="","",{셈!종점})', fmt=KM, align="right", size=9), NB), (700, 751, "까지 (", dict(FR, size=9)),
                     (751, 871, F("표길이", '=IF(OR({셈!시점}="",{셈!종점}=""),"",ABS({셈!종점}-{셈!시점}))', fmt=KM, align="right", size=9), NB),
                     (871, X2, "킬로미터)", dict(FR, size=9))], h=34)
    g_ = prow(p, GA, [(XL, X2, "공사시행 기간", SB)], h=14)
    h_ = prow(p, GA, [(XL, 545, F("표시작", '=IF(N({셈!시작})=0,"           년       월       일부터",YEAR({셈!시작})&"년  "&MONTH({셈!시작})&"월  "&DAY({셈!시작})&"일부터")',
                                align="right", size=9), NB),
                      (545, 871, F("표끝", '=IF(N({셈!끝})=0,"           년       월       일까지 (",YEAR({셈!끝})&"년  "&MONTH({셈!끝})&"월  "&DAY({셈!끝})&"일까지 (")',
                                   align="right", size=9), NB),
                      (871, 958, F("표일수", '=IF(OR(N({셈!시작})=0,N({셈!끝})=0,{셈!끝}<{셈!시작}),"",{셈!끝}-{셈!시작}+1)', fmt='#,##0;;""', align="right", size=9), NB),
                      (958, X2, "일간)", dict(FR, size=9))], h=34)
    i_ = prow(p, GA, [(XL, X2, "공사의 목적 및 사유", SB)], h=14)
    j_ = prow(p, GA, [(XL, X2, inp("목적", size=8.5, wrap=True), NB)], h=34)
    for r in (b, d, f, h_):
        hline(p, GA, r, XL, X2, S["lgt"])
    vline(p, GA, a, d, 625, S["lgt"])
    vline(p, GA, a, j_, XL, S["gry"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, j_, X1, X2, S["thin"])
    p.gap(18)
    prow(p, GA, [(X1, X2, "「도로법」 제36조제1항, 같은 법 시행령 제34조제1항 및 같은 법 시행규칙 제13조제1항에 따라 위와 같이 도로공사 시행의 허가를 신청합니다.",
                  {"kind": "free", "size": 9.5, "indent": 2, "wrap": True})], h=34)
    p.gap(6)
    prow(p, GA, [(X1, X2, F("신청일표시", '=IF(N({셈!신청일})=0,"년         월         일",YEAR({셈!신청일})&"년      "&MONTH({셈!신청일})&"월      "&DAY({셈!신청일})&"일")',
                             align="right", size=9), NB)], h=16)
    p.gap(6)
    prow(p, GA, [(X1, 470, "", NB), (470, 625, "신청인", dict(FRC, size=9.5)), (625, 958, F("신청인표시", '=IF({성명}="","",{성명})', align="center", size=8.5), NB),
                 (958, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=18)
    p.gap(6)
    r = prow(p, GA, [(X1, 545, inp("수신", blank="도로관리청", size=12, bold=True, align="center"), NB), (545, X2, "귀하", dict(FR, size=9.5))], h=24)
    hline(p, GA, r, X1, X2, S["med"])
    p.gap(110)                                   # 원문 빈 자리(굵은 줄 아래 ~ 첨부서류 칸)
    ra = prow(p, GA, [(X1, XL, "첨부서류", dict(FRC, size=8.5)), (XL, 821, "1. 사업계획서\n2. 설계도서", dict(FR, size=8.5, wrap=True, indent=1)),
                      (821, X2, "수수료\n공사비의 1/1,000 또는\n도로관리청이 속하는 지방자\n치단체의 조례로 정하는 금액", dict(FRC, size=7.5, wrap=True))], h=50)
    hline(p, GA, ra, X1, X2, S["thin"], below=False)
    hline(p, GA, ra, X1, X2, S["thin"])
    for x in (XL, 821):
        vline(p, GA, ra, ra, x, S["lgt"])
    p.gap(8)
    prow(p, GA, [(X1, X2, "210mm×297mm[백상지 80g/㎡(재활용품)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["도로의 종류 · 구간 · 기간 · 일수 · 신청일은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 장소)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
YOIL = "월화수목금토일"


def _ymdp(d):
    return f"{d.year}. {d.month}. {d.day}."


def _n(v):
    return None if v in (None, "") else float(v)


def _fmt_fee(cost):
    c = int(math.floor(cost + 0.5))            # 엑셀 ROUND(,0) — 반 올림(양수)
    q, r = divmod(c, 1000)
    s = f"{q:,}"
    if r:
        s += "." + (str(r // 100) if r % 100 == 0 else f"{r // 10:02d}" if r % 10 == 0 else f"{r:03d}")
    return s


def expect(pages):
    sm, fr = pages["셈"], pages["신청서"]
    a, b = {}, {}
    s0, s1 = _n(sm.get("시점")), _n(sm.get("종점"))
    a["구간"] = "" if (s0 is None or s1 is None) else (KM_BAD + " · " if s1 < s0 else "") + f"{abs(s1 - s0):.3f} 킬로미터"
    st, en = sm.get("시작"), sm.get("끝")
    a["일수"] = "" if (not st or not en) else (GI_BAD if en < st else f"{(en - st).days + 1}일간(첫날 · 끝날 넣어 셈)")
    cost = _n(sm.get("공사비"))
    a["수수료"] = "" if not cost else f"{FEE_A}{_fmt_fee(cost)}원{FEE_B}"
    sd = sm.get("신청일")
    if not sd:
        a["처리"] = ""
    else:
        dd = MW.처리끝(sd, 15)
        a["처리"] = f"{_ymdp(dd)}({YOIL[dd.weekday()]}){CH_A}" + ("" if MW.다덮음(sd, dd) else MW.밖글)
    for k in range(1, MW.되풀이 + 1):
        a["처끝" if k == MW.되풀이 else f"처E{k}"] = "" if not sd else MW.식흉내(sd, 15, k)
    rd = sm.get("도로종류")
    keys = [("신청인 성명", not fr.get("성명")), ("주소", not fr.get("주소")), ("도로의 종류", not rd), ("노선번호", not fr.get("노선번호")),
            ("공사의 종류", not fr.get("공사종류")), ("시행장소", not fr.get("시행장소")), ("공사시행 구간", s0 is None or s1 is None),
            ("공사시행 기간", not st or not en), ("공사의 목적 및 사유", not fr.get("목적")), ("신청일", not sd)]
    if not rd and not fr.get("성명"):
        a["빈칸"] = ""
        a["다음"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
        a["다음"] = NEXT
    b["표도로"] = rd or ""
    b["표시점"] = s0 if s0 is not None else ""
    b["표종점"] = s1 if s1 is not None else ""
    b["표길이"] = "" if (s0 is None or s1 is None) else abs(s1 - s0)
    b["표시작"] = "           년       월       일부터" if not st else f"{st.year}년  {st.month}월  {st.day}일부터"
    b["표끝"] = "           년       월       일까지 (" if not en else f"{en.year}년  {en.month}월  {en.day}일까지 ("
    b["표일수"] = "" if (not st or not en or en < st) else (en - st).days + 1
    b["신청일표시"] = "년         월         일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    b["신청인표시"] = fr.get("성명") or ""
    return {"셈": a, "신청서": b}
