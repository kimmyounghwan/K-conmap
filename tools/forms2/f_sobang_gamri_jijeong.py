# -*- coding: utf-8 -*-
"""소방공사감리자 지정신고서 — 새로 만든 서식 (2026-11-16 G720 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 신고 기한(규칙 제15조제1항 — 착공 전까지 · 착공일 전날 · 토 · 일요일 알림) · 신고일 확인 · 처리(법 제17조제4항 — 2일 이내 통지 · ⑤ 간주수리) ·
     감리 구분(영 별표 3 — 아파트 아님 연면적 3만㎡ 이상 / 아파트 지하층 포함 16층 이상 · 500세대 이상 → 상주감리, 그 밖 일반감리 → 신고서 [√]) ·
     감리기간(→ «년 월 일부터 년 월 일까지») · 지정 대상(영 제10조제2항) · 변경 30일(규칙 제15조제2항) · 아직 안 적은 칸
   · 신고서(소방시설공사업법 시행규칙 [별지 제21호서식] <개정 2022. 12. 1.> 앞쪽 · 뒤쪽 칸 차례 그대로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752 둘) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1122.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G720_소방감리자지정신고_원문.txt — 글층 해시 같음 확인):
  · 소방시설공사업법 [시행 2025. 1. 31.] 제17조 ① 관계인은 감리업자를 공사감리자로 지정 ② 지정 · 변경하면 소방본부장 · 소방서장에게 신고
    ④ 받은 날부터 2일 이내에 신고수리 여부 통지 ⑤ 통지 없으면 기간 끝난 날의 다음 날 수리 간주
  · 시행령 [시행 2026. 7. 1.] 제9조 · [별표 3] <개정 2026. 3. 17.>(상주 공사감리 1. 연면적 3만㎡ 이상(아파트 제외) 2. 지하층 포함 16층 이상 · 500세대 이상 아파트 ·
    일반 공사감리 = 상주 아닌 것) · 제10조제2항(지정 대상 소방시설 시공)
  · 시행규칙 [시행 2026. 10. 20.] 제15조 ① 착공 전까지 별지 제21호서식 + 서류 1~4 ② 변경일부터 30일 이내 별지 제23호서식 ③ 2일 이내 처리 · 통보
■ 원문 그대로: 작성요령 «2,» (쉼표 — 원문 글층 · 그림 그대로).
■ 짐작 안 함: «착공 전까지» = 착공일 전날까지로 알림(그날이 토 · 일요일이면 «그 전 평일» 글로만) · 감리 구분 판정은 신고서 «연면적»(작성요령 — 가장 넓거나 높은 것)과
  지하 + 지상 층수 · 세대수로 셈 — 여러 동이면 소방본부 · 소방서에 확인(글로 알림) · 고르지 않으면 [√] 비움."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L

SLUG = "sobang-gamri-jijeong"
TITLE = "소방공사감리자 지정신고서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "소방공사감리자 지정신고서(소방시설공사업법 시행규칙 별지 제21호서식) — 빈 서식 앞쪽 (원문 칸 차례 그대로)"),
        (5, "소방공사감리자 지정신고서 — 작성 예시 (감리기간 · 감리구분 [√] 가 ① 장에서 저절로)"),
        (4, "① 신고 기한 · 감리 구분(상주 · 일반) · 감리기간 — 작성 예시"),
        (3, "소방공사감리자 지정신고서 뒤쪽 — 처리절차 (원문 그대로)")]
MULTI = True
SHORT = ("소방공사감리자 지정신고서(소방시설공사업법 시행규칙 별지 제21호서식) — 착공일 · 감리기간 · 아파트 여부를 적으면 신고 기한(착공 전까지)과 "
         "상주 · 일반 감리 구분(시행령 별표 3)이 나오고 신고서 감리기간 · 감리구분 [√] 가 저절로 채워집니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
AREA = '#,##0.00;;""'
APT = ["아파트", "아파트 아님"]
GB = ["상주감리", "일반감리"]

GH_A = "착공 전까지 신고(규칙 제15조제1항) — 착공일 "
GH_B = " · 늦어도 "
GH_C = "까지"
GH_SAT = " — 토요일이면 그 전 평일에 내면 안전"
GH_SUN = " — 일요일이면 그 전 평일에 내면 안전"
GH_OK = " · ✓ 신고일이 착공 전"
GH_LATE = " · ⚠ 신고일이 착공 전이 아님"
CHEORI = ("처리 — 소방본부장 · 소방서장은 받은 날부터 2일 이내에 신고수리 여부를 신고인에게 통지(법 제17조제4항 · 규칙 제15조제3항) · "
          "그 기간에 통지하지 않으면 기간이 끝난 날의 다음 날에 수리한 것으로 봄(법 제17조제5항)")
PJ_SJ = "상주감리 — 영 별표 3 "
PJ_IB = "일반감리 — 상주 공사감리 대상이 아님(영 별표 3)"
PJ_1 = "제1호(아파트 아닌 연면적 3만㎡ 이상)"
PJ_2 = "제2호(지하층 포함 16층 이상 · 500세대 이상 아파트)"
PJ_Q = "⚠ 아파트인지 고르면 상주 · 일반이 나옵니다"
PJ_N = "※ 판정은 신고서 «연면적»(가장 넓거나 층수가 가장 높은 것 — 작성요령) · 지하 + 지상 층수 · 세대수로 셈 — 여러 동이면 소방본부 · 소방서에 확인"
GK_REV = "⚠ 감리 끝날이 시작일보다 앞섭니다"
GK_A, GK_B = "✓ 감리기간 ", "일"
JD = ("공사감리자 지정 대상(영 제10조제2항) — 옥내소화전설비 · 스프링클러설비등(캐비닛형 간이스프링클러설비 제외) · 물분무등소화설비(호스릴 방식 제외) · "
      "옥외소화전설비 · 자동화재탐지설비 · 화재알림설비 · 비상방송설비 · 통합감시시설 · 소화용수설비 · 소화활동설비(제연 · 연결송수관 · 연결살수 · "
      "비상콘센트 · 무선통신보조 · 연소방지)를 신설 · 개설하거나 일부 구역을 증설할 때")
BG = "※ 공사감리자를 바꾸면 변경일부터 30일 이내에 별지 제23호서식 변경신고서를 냄(법 제17조제2항 후단 · 규칙 제15조제2항)"
BIN_OK = "✓ 신고서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
KB = "     년     월     일부터"
KE = "     년     월     일까지"

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"착공일": D(2027, 3, 2), "감리시작": D(2027, 3, 2), "감리끝": D(2028, 8, 31), "아파트": APT[1], "세대수": None}
EX_S = {"대상명칭": "가나타워(가칭)", "주요용도": "업무시설", "대상소재지": "가나도 다라시 마바동 123-4", "대상전화": "000-000-0000",
        "지하": 3, "지상": 20, "연면적": 32500, "동수": 1, "연면적합계": 32500,
        "발주자": "가나개발(주)", "생년월일": None, "관계인주소": "가나도 다라시 바사로 12", "관계인전화": "000-000-0000",
        "감리상호": "마바소방(주)", "감리등록번호": "0000-00", "감리대표": "서다온", "감리소재지": "가나도 마바시 공단로 21", "감리전화": "000-000-0000",
        "감리원#1": "정민호", "감리원분야#1": "기계 · 전기 / 특급", "감리원구분#1": "책임감리원",
        "감리원#2": "한소영", "감리원분야#2": "전기 / 초급", "감리원구분#2": "보조감리원",
        "감리대상시설": "옥내소화전설비 · 스프링클러설비 · 자동화재탐지설비 · 비상방송설비 · 제연설비 · 연결송수관설비 · 비상콘센트설비",
        "제출일": D(2027, 2, 24), "수신": "다라소방서장  귀하"}
HEAD = "■ 소방시설공사업법 시행규칙 [별지 제21호서식] <개정 2022. 12. 1.>"
GUIDE = "※ [   ]에는 해당되는 곳에 √표를 합니다."
STATEMENT = "「소방시설공사업법」 제17조제2항 및 같은 법 시행규칙 제15조제1항에 따라 소방공사감리자 지정을 신고합니다."
SUSIN = "소방본부장 또는 소방서장  귀하"
ATTACH = ("1. 소방공사감리업 등록증 사본 1부 및 등록수첩 사본 1부\n"
          "2. 해당 소방시설공사를 감리하는 소속 감리원의 감리원 등급을 증명하는 서류 각 1부\n"
          "3. 「소방시설공사업법 시행규칙」 별지 제22호서식의 소방공사감리계획서 1부\n"
          "4. 소방시설설계 계약서 사본(「소방시설 설치 및 관리에 관한 법률 시행규칙」 제3조제2항에 따라 건축허가등의 동의요구서에 소방시설설계 계약서가 "
          "첨부되지 않았거나 첨부된 서류 중 소방시설설계 계약서가 변경된 경우에만 첨부합니다) 1부 및 소방공사감리 계약서 사본 1부")
YORYEONG = ("1. 연면적: 동일 구역 내에 둘 이상의 특정소방대상물이 있는 경우에는 연면적이 가장 넓거나 층수가 가장 높은 것을 기준으로 적으십시오.\n"
            "2, 연면적 합계: 동일 구역 내에 둘 이상의 특정소방대상물이 있는 경우 각각 동의 연면적 합계를 적으십시오.")
PAPER = "210mm×297mm[백상지 80g/㎡ 또는 중질지 80g/㎡]"
NG = 2


def _ex(ex, k):
    return EX[k] if ex else None


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


GX = Gx(120, 1122)
X1, X2 = 120, 1122


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


def _bd(p, r1, r2, x1, x2, top=True, bot=True, left=True, right=True, side=None):
    from openpyxl.styles import Border
    from fb import LINE
    sd = side or LINE
    c1, c2 = GX.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            p.ws.cell(row=r, column=c).border = Border(left=sd if (left and c == c1) else None, right=sd if (right and c == c2) else None,
                                                       top=sd if (top and r == r1) else None, bottom=sd if (bot and r == r2) else None)


LB = {"kind": "label", "size": 9}
LT = {"kind": "free", "size": 8, "align": "left"}
NB = {"border": False}
GR = {"kind": "label", "size": 8, "align": "left"}
CT = {"kind": "ctext", "size": 8.5}
F8 = {"kind": "free", "size": 8, "align": "center"}
FB = {"kind": "free", "size": 8}
TL = {"kind": "free", "size": 7.5, "align": "right"}
TR = {"kind": "free", "size": 7.5}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


SC, QD = "{착공일}", "{신고서!제출일}"
PRE = f"({SC}-1)"
FL = "(N({신고서!지하})+N({신고서!지상}))"
SJ1 = 'AND({아파트}="' + APT[1] + '",N({신고서!연면적})>=30000)'
SJ2 = 'AND({아파트}="' + APT[0] + '",' + FL + '>=16,N({세대수})>=500)'


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  소방공사감리자 지정신고 — 기한 · 감리 구분 · 감리기간 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 관계인은 감리업자를 공사감리자로 지정하면 소방본부장 · 소방서장에게 신고합니다(소방시설공사업법 제17조제2항). "
              "여기서 정한 감리기간 · 감리구분 [√] 가 신고서에 들어갑니다.")
    s7 = {"kind": "text", "size": 7}
    sz = {"kind": "text", "size": 7.5}
    g.sec(p, "㉮  신고 기한 · 처리 (규칙 제15조 · 법 제17조)", need=26 * 3 + 10)
    p.row([(3, "착공일", L), (5, I("착공일", ex=_ex(ex, "착공일"), fmt=DT, align="center", size=9)), (4, "해당 소방시설공사의 착공일", s7)], h=24)
    f = (f'=IF(N({SC})=0,"","{GH_A}"&' + _ymdf(SC) + f'&"{GH_B}"&' + _ymdf(PRE) + '&"("&' + _yo(PRE) + f'&")"&"{GH_C}"'
         f'&IF(WEEKDAY({PRE})=7,"{GH_SAT}",IF(WEEKDAY({PRE})=1,"{GH_SUN}",""))'
         f'&IF(N({QD})=0,"",IF(N({QD})<N({SC}),"{GH_OK}","{GH_LATE}")))')
    p.row([(3, "신고 기한", L), (9, F("기한", f, align="left", size=8.5))], h=46)
    p.row([(3, "처리", L), (9, CHEORI, sz)])
    g.sec(p, "㉯  감리 구분 — 상주 · 일반 (영 별표 3)", need=26 * 4 + 10)
    p.row([(3, "아파트인가", L), (4, I("아파트", ex=_ex(ex, "아파트"), dv=",".join(APT), align="center", size=8.5)),
           (5, "연면적 · 층수는 신고서 «구조» 칸에서 읽음", s7)], h=24)
    p.row([(3, "세대수(아파트)", L), (4, I("세대수", ex=_ex(ex, "세대수"), fmt='#,##0"세대";;""', align="center", size=9)),
           (5, "아파트만 적음", s7)], h=24)
    pj = (f'=IF({{아파트}}="",IF(N({{신고서!연면적}})>0,"{PJ_Q}",""),IF(OR({SJ1},{SJ2}),"{PJ_SJ}"&IF({SJ1},"{PJ_1}","{PJ_2}"),"{PJ_IB}"))')
    p.row([(3, "판    정", L), (9, F("판정", pj, align="left", size=8.5, bold=True))], h=30)
    p.row([(3, "", L), (9, PJ_N, s7)])
    g.sec(p, "㉰  감리기간 (→ 신고서 «소방공사 감리기간»)", need=24 * 3 + 10)
    for k, lab in (("감리시작", "감리 시작일"), ("감리끝", "감리 끝날")):
        p.row([(3, lab, L), (5, I(k, ex=_ex(ex, k), fmt=DT, align="center", size=9)), (4, "", s7)], h=22)
    p.row([(3, "감리기간", L),
           (9, F("기간", '=IF(OR(N({감리시작})=0,N({감리끝})=0),"",IF({감리시작}>{감리끝},"' + GK_REV + '","' + GK_A + '"&({감리끝}-{감리시작}+1)&"' + GK_B + '"))',
                 align="left", size=8.5))], h=22)
    g.sec(p, "㉱  지정 대상 · 변경", need=26 * 2 + 10)
    p.row([(3, "지정 대상", L), (9, JD, {"kind": "text", "size": 7})])
    p.row([(3, "변경", L), (9, BG, sz)])
    g.sec(p, "㉲  아직 안 적은 칸", need=46 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({신고서!대상명칭}="",{신고서!감리상호}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 신고서의 «소방공사 감리기간» · «감리구분 [√]» 은 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호 — 아파트 아닌 연면적 32,500㎡ 업무시설)."])
    return p


BIN = [("대상 상호(명칭)", '{신고서!대상명칭}=""'), ("대상 소재지", '{신고서!대상소재지}=""'), ("연면적", 'N({신고서!연면적})=0'),
       ("관계인 성명", '{신고서!발주자}=""'), ("감리업자 상호", '{신고서!감리상호}=""'), ("감리업자 등록번호", '{신고서!감리등록번호}=""'),
       ("감리원 성명", '{신고서!감리원#1}=""'), ("감리대상 소방시설 종류", '{신고서!감리대상시설}=""'),
       ("감리기간(① 장)", 'OR(N({감리시작})=0,N({감리끝})=0)'), ("감리 구분(① 장 아파트)", '{아파트}=""')]


def _two(p, top, bot, h1, h2):
    ra = prow(p, top, h=h1)
    rb = prow(p, bot, h=h2)
    return ra, rb


def _addr(p, ex, lab, key, tel, x_tel=790):
    """«소재지 · 주소 [적는 칸]» 한 줄 + 오른쪽 아래 «(전화번호 : )»"""
    ra, rb = _two(p, [(252, 330, lab, LT), (330, X2, inp(key, ex, align="left"), NB)],
                  [(252, x_tel, "", FB), (x_tel, 990, "(전화번호 :", TL), (990, 1100, inp(tel, ex, align="center", size=8), NB), (1100, X2, ")", TR)],
                  17.5, 17.5)
    _bd(p, ra, rb, 252, X2)
    return ra, rb


# ── 신고서(앞쪽) ─────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "신고서", fit=1, widths=WP)
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center"})], h=30)
    prow(p, [(X1, 1000, GUIDE, {"kind": "free", "size": 7.5}), (1000, X2, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    prow(p, [(X1, 453, "접수번호", GR), (453, 786, "접수일자", GR), (786, X2, "처리기간    2일", GR)], h=20)
    p.gap(3)
    # 특정소방대상물
    r1 = prow(p, [(X1, 252, "특정소방\n대상물", dict(LB, rs=4)), (252, 360, "상호(명칭)", LT), (360, 786, inp("대상명칭", ex, align="left"), NB),
                  (786, 880, "주요 용도", LT), (880, X2, inp("주요용도", ex, align="left"), NB)], h=19)
    _bd(p, r1, r1, 252, 786)
    _bd(p, r1, r1, 786, X2)
    _addr(p, ex, "소재지", "대상소재지", "대상전화")
    n0 = {"fmt": '0;;""', "align": "center", "size": 8.5, "wrap": "shrink"}
    na = {"fmt": AREA, "align": "right", "size": 8.5, "wrap": "shrink"}
    r4 = prow(p, [(252, 330, "구  조", LT), (330, 395, "", FB), (395, 430, "지하", F8), (430, 470, inp("지하", ex, **n0), NB), (470, 505, "층,", FB),
                  (505, 545, "지상", F8), (545, 585, inp("지상", ex, **n0), NB), (585, 620, "층,", FB), (620, 680, "연면적", F8),
                  (680, 775, inp("연면적", ex, **na), NB), (775, 805, "㎡,", FB), (805, 840, inp("동수", ex, **n0), NB), (840, 885, "개동,", FB),
                  (885, 985, "연면적합계", F8), (985, 1095, inp("연면적합계", ex, **na), NB), (1095, X2, "㎡", FB)], h=28)
    _bd(p, r4, r4, 252, X2)
    _bd(p, r1, r4, X1, 252)
    p.gap(3)
    # 관계인
    a1, a2 = _two(p, [(X1, 252, "관계인", dict(LB, rs=5)), (252, 786, "성명(기관 또는 법인명)", LT), (786, X2, "생년월일", LT)],
                  [(252, 786, inp("발주자", ex, align="left", size=9), NB), (786, X2, inp("생년월일", ex, align="left"), NB)], 13, 14)
    a3 = prow(p, [(252, 786, "", FB), (786, X2, "(외국인등록번호)", {"kind": "free", "size": 7.5})], h=13)
    _bd(p, a1, a3, 252, 786)
    _bd(p, a1, a3, 786, X2)
    _addr(p, ex, "주소", "관계인주소", "관계인전화")
    _bd(p, a1, a3 + 2, X1, 252)
    p.gap(3)
    # 소방공사감리업자
    b1 = prow(p, [(X1, 252, "소방공사\n감리업자", dict(LB, rs=3)), (252, 345, "상호(명칭)", LT), (345, 496, inp("감리상호", ex, align="left", size=8), NB),
                  (496, 605, "등록번호(제", LT), (605, 740, inp("감리등록번호", ex, align="center", size=8), NB), (740, 786, "호)", LT),
                  (786, 850, "대표자", LT), (850, X2, inp("감리대표", ex, align="left"), NB)], h=19)
    for x1, x2 in ((252, 496), (496, 786), (786, X2)):
        _bd(p, b1, b1, x1, x2)
    _addr(p, ex, "소재지", "감리소재지", "감리전화", x_tel=800)
    _bd(p, b1, b1 + 2, X1, 252)
    # 소방공사감리원
    c1 = prow(p, [(X1, 252, "소방공사\n감리원", dict(LB, rs=1 + NG)), (252, 496, "성        명", CT), (496, 786, "분야/등급", CT), (786, X2, "감리원 구분", CT)], h=18)
    for k in range(1, NG + 1):
        prow(p, [(252, 496, inp(f"감리원#{k}", ex, align="center"), {}), (496, 786, inp(f"감리원분야#{k}", ex, align="center"), {}),
                 (786, X2, inp(f"감리원구분#{k}", ex, align="center"), {})], h=18.5)
    _bd(p, c1, c1 + NG, X1, 252)
    # 감리기간
    kk = ('=IF(N({셈!감리시작})=0,"' + KB + '",' + _ymdf("{셈!감리시작}") + '&"부터")&"          "&'
          'IF(N({셈!감리끝})=0,"' + KE + '",' + _ymdf("{셈!감리끝}") + '&"까지")')
    prow(p, [(X1, 252, "소방공사\n감리기간", LB), (252, X2, F("감리기간", kk, align="center", size=9.5), {})], h=34)
    # 감리대상 소방시설 종류 · 감리구분
    ck = {"kind": "text", "size": 9, "align": "left"}
    d1 = prow(p, [(X1, 252, "감리대상\n소방시설\n종      류", dict(LB, rs=3)), (252, 957, inp("감리대상시설", ex, align="left", size=9), {"rs": 3, "valign": "top"}),
                  (957, X2, "감리구분", CT)], h=24)
    prow(p, [(957, X2, F("상주표시", f'=IF(LEFT({{셈!판정}},4)="{GB[0]}","{GB[0]}  [√]","{GB[0]}  [   ]")', align="center", size=9), ck)], h=24.5)
    prow(p, [(957, X2, F("일반표시", f'=IF(LEFT({{셈!판정}},4)="{GB[1]}","{GB[1]}  [√]","{GB[1]}  [   ]")', align="center", size=9), ck)], h=25)
    _bd(p, d1, d1 + 2, 957, X2)
    p.gap(5)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 9.5})], h=36)
    prow(p, [(X1, X2, inp("제출일", ex, blank="년          월          일", fmt="date", align="right", size=9), NB)], h=20)
    prow(p, [(X1, 450, "", g.FR), (450, 560, "신고인", {"kind": "free", "size": 9.5, "align": "center"}),
             (560, 960, F("신고인표시", '=IF({발주자}="","",{발주자})', align="center", size=8.5), NB),
             (960, X2, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=22)
    prow(p, [(X1, X2, inp("수신", ex, blank=SUSIN, size=12, bold=True, align="left"), {"border": False, "indent": 1})], h=26)
    from openpyxl.styles import Side
    med = Side(style="medium", color="000000")
    r = prow(p, [(X1, X2, "", FB)], h=4)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(6)
    a, b = GX.cols(242, 992)
    na_ = text_lines(ATTACH, sum(WP[a - 1:b]) * 10.0 / 7.6)
    prow(p, [(X1, 242, "첨부서류", {"kind": "label", "size": 8.5}), (242, 992, ATTACH, {"kind": "text", "size": 7.6, "valign": "center"}),
             (992, X2, "수수료\n\n없  음", {"kind": "ctext", "size": 8.5})], h=max(60, na_ * 7.6 * 1.45 + 12))
    p.gap(9)
    r = prow(p, [(X1, X2, "", FB)], h=4)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=med)
    prow(p, [(X1, X2, "작성요령", {"kind": "ctext", "size": 9})], h=15)
    ny = text_lines(YORYEONG, sum(WP) * 10.0 / 7.6)
    r = prow(p, [(X1, X2, YORYEONG, {"kind": "text", "size": 7.6, "valign": "top"})], h=ny * 7.6 * 1.45 + 8)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["«소방공사 감리기간» · «감리구분 [√]» 은 ① 장에서 들어옵니다. 관계인 성명은 공통 정보(발주자)에서 들어오고 신고인 칸에도 들어갑니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호)."])
    return p


# ── 뒤쪽(처리절차) ────────────────────────────────────────────────────────
def back(bk, ex):
    p = g.pg(bk, ex, "뒤쪽", fit=1, widths=WP)
    from openpyxl.styles import Side
    med = Side(style="medium", color="000000")
    r = prow(p, [(X1, X2, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(170)
    prow(p, [(X1, X2, "처리절차", {"kind": "head", "size": 9.5})], h=26)
    prow(p, [(X1, X2, "이 신청서는 아래와 같이 처리됩니다.", {"kind": "free", "size": 8.5})], h=24)
    prow(p, [(X1, 564, "신청인", dict(CT, rs=2)), (564, X2, "처리기관", CT)], h=23)
    prow(p, [(564, X2, "시ㆍ도(소방시설 민원 담당 부서)", CT)], h=23.5)
    box = {"kind": "ctext", "size": 8.5}
    arr = {"kind": "cfree", "size": 9}
    fr = {"kind": "free", "size": 6}
    p.gap(18)
    prow(p, [(X1, 216, "", fr), (216, 477, "신청서 작성", box), (477, 673, "▶", arr), (673, 991, "접수", box), (991, X2, "", fr)], h=29)
    prow(p, [(X1, 673, "", fr), (673, 991, "▼", arr), (991, X2, "", fr)], h=100)
    prow(p, [(X1, 673, "", fr), (673, 991, "신고서류 확인 및 시스템 입력", box), (991, X2, "", fr)], h=29)
    prow(p, [(X1, 673, "", fr), (673, 991, "▼", arr), (991, X2, "", fr)], h=90)
    prow(p, [(X1, 216, "", fr), (216, 477, "통보", box), (477, 673, "◀", arr), (673, 991, "기안 및 결재", box), (991, X2, "", fr)], h=30)
    r = prow(p, [(X1, X2, "", fr)], h=36)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False)
    p.end_print()
    p.after_note(["원문 뒤쪽(처리절차) 그대로입니다."] if not ex else ["이 시트는 작성 예시입니다."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)
    back(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


YO = "월화수목금토일"


def expect(pages):
    sm, sg = pages["셈"], pages["신고서"]
    a, b = {}, {}
    sc, qd = _d(sm.get("착공일")), _d(sg.get("제출일"))
    if not sc:
        a["기한"] = ""
    else:
        pre = sc - datetime.timedelta(days=1)
        t = f"{GH_A}{_ymd(sc)}{GH_B}{_ymd(pre)}({YO[pre.weekday()]}){GH_C}"
        t += GH_SAT if pre.weekday() == 5 else (GH_SUN if pre.weekday() == 6 else "")
        if qd:
            t += GH_OK if qd < sc else GH_LATE
        a["기한"] = t
    apt = sm.get("아파트")
    yeon = _n(sg.get("연면적"))
    fl = _n(sg.get("지하")) + _n(sg.get("지상"))
    sd = _n(sm.get("세대수"))
    s1 = apt == APT[1] and yeon >= 30000
    s2 = apt == APT[0] and fl >= 16 and sd >= 500
    if not apt:
        a["판정"] = PJ_Q if yeon > 0 else ""
    elif s1 or s2:
        a["판정"] = PJ_SJ + (PJ_1 if s1 else PJ_2)
    else:
        a["판정"] = PJ_IB
    gs, ge = _d(sm.get("감리시작")), _d(sm.get("감리끝"))
    a["기간"] = "" if not (gs and ge) else (GK_REV if gs > ge else f"{GK_A}{(ge - gs).days + 1}{GK_B}")
    if not sg.get("대상명칭") and not sg.get("감리상호"):
        a["빈칸"] = ""
    else:
        mc = {"대상 상호(명칭)": not sg.get("대상명칭"), "대상 소재지": not sg.get("대상소재지"), "연면적": not yeon,
              "관계인 성명": not sg.get("발주자"), "감리업자 상호": not sg.get("감리상호"), "감리업자 등록번호": not sg.get("감리등록번호"),
              "감리원 성명": not sg.get("감리원#1"), "감리대상 소방시설 종류": not sg.get("감리대상시설"),
              "감리기간(① 장)": not (gs and ge), "감리 구분(① 장 아파트)": not apt}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    pj = a["판정"]
    b["상주표시"] = f"{GB[0]}  [√]" if pj[:4] == GB[0] else f"{GB[0]}  [   ]"
    b["일반표시"] = f"{GB[1]}  [√]" if pj[:4] == GB[1] else f"{GB[1]}  [   ]"
    b["감리기간"] = ((_ymd(gs) + "부터") if gs else KB) + "          " + ((_ymd(ge) + "까지") if ge else KE)
    b["신고인표시"] = sg.get("발주자") or ""
    return {"셈": a, "신고서": b}


for _t in (GH_A, GH_B, GH_C, GH_SAT, GH_SUN, GH_OK, GH_LATE, PJ_SJ, PJ_IB, PJ_1, PJ_2, PJ_Q, GK_REV, GK_A, GK_B, BIN_OK, BIN_A, KB, KE, *APT, *GB):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _dv in (APT, GB):
    assert len(",".join(_dv)) < 255 and not any("," in x for x in _dv), _dv[0]
