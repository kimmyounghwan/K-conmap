# -*- coding: utf-8 -*-
"""소방공사감리원 배치통보서 — 새로 만든 서식 (2026-11-16 G722 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 통보 기한(규칙 제17조제1항 — 감리원 배치일부터 7일 이내 · 첫날 빼고 셈 민법 제157조 → 배치일 + 7일 · 요일) · 통보일 확인 ·
     감리원의 감리기간(→ «년 월 일부터 년 월 일까지») · 바뀌면 별지 제25호서식 · 아직 안 적은 칸
   · 통보서(소방시설공사업법 시행규칙 [별지 제24호서식] <개정 2025. 1. 23.> 앞쪽 · 뒤쪽 칸 차례 그대로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752 둘) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1122.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G722_소방감리원배치통보_원문.txt — 글층 해시 같음 확인):
  · 소방시설공사업법 시행규칙 [시행 2026. 10. 20.] 제17조제1항(감리업자는 법 제18조제2항에 따라 감리원을 배치하면 별지 제24호서식 배치통보서 ·
    바뀌면 별지 제25호서식 배치변경통보서에 서류(1. 가 감리원 등급 증명 · 나 감리계약서 사본)를 붙여 감리원 배치일부터 7일 이내에 소방본부장 · 소방서장에게 알림)
  · 민법 제157조(기간의 초일은 산입하지 아니한다)
■ 짐작 안 함: 7일째가 토 · 일요일 · 공휴일이어도 날을 늘려 셈하지 않음(«그 전 평일에 내면 안전» 글로만) · 뒤쪽 글층 «시ž도» 는 글자 깨짐 — 그림대로 «시ㆍ도»."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L

SLUG = "sobang-gamri-baechi"
TITLE = "소방공사감리원 배치통보서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "소방공사감리원 배치통보서(소방시설공사업법 시행규칙 별지 제24호서식) — 빈 서식 앞쪽 (원문 칸 차례 그대로)"),
        (5, "소방공사감리원 배치통보서 — 작성 예시 (감리원의 감리기간이 ① 장에서 저절로)"),
        (4, "① 통보 기한 · 감리기간 — 작성 예시"),
        (3, "소방공사감리원 배치통보서 뒤쪽 — 처리절차 (원문 그대로)")]
MULTI = True
SHORT = ("소방공사감리원 배치통보서(소방시설공사업법 시행규칙 별지 제24호서식) — 감리원 배치일을 적으면 통보 기한(배치일부터 7일 이내)과 요일이 나오고, "
         "감리원의 감리기간이 통보서에 저절로 들어갑니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
AREA = '#,##0.00;;""'
NG = 2

GH_A = "배치일부터 7일 이내 통보(규칙 제17조제1항 · 첫날 빼고 셈 — 민법 제157조) — 배치일 "
GH_B = " → 늦어도 "
GH_C = "까지"
GH_SAT = " — 토요일이니 그 전 평일에 내면 안전"
GH_SUN = " — 일요일이니 그 전 평일에 내면 안전"
GH_OK = " · ✓ 통보일이 기한 안"
GH_LATE = " · ⚠ 통보일이 기한을 넘김"
GK_REV = "⚠ 감리 끝날이 시작일보다 앞섭니다"
GK_A, GK_B = "✓ 감리기간 ", "일"
BG = "※ 배치한 감리원이 바뀌면 별지 제25호서식 배치변경통보서에 바뀐 감리원 · 바뀌기 전 감리원의 등급 증명 서류를 붙여 7일 이내에 알림(규칙 제17조제1항)"
BIN_OK = "✓ 통보서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
KB = "     년     월     일부터"
KE = "     년     월     일까지"

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"배치일": D(2027, 3, 2), "감리시작": D(2027, 3, 2), "감리끝": D(2028, 8, 31)}
EX_S = {"대상명칭": "가나타워(가칭)", "용도구분": "업무시설", "대상소재지": "가나도 다라시 마바동 123-4", "대상전화": "000-000-0000",
        "지하": 3, "지상": 20, "연면적": 32500, "바닥면적": 1620, "동수": 1, "대지면적": 4800, "연면적2": 32500, "건축면적": 1700,
        "발주자": "가나개발(주)", "생년월일": None, "관계인주소": "가나도 다라시 바사로 12", "관계인전화": "000-000-0000",
        "감리원#1": "정민호", "감리원분야#1": "기계 · 전기 / 특급", "감리원구분#1": "책임감리원",
        "감리원#2": "한소영", "감리원분야#2": "전기 / 초급", "감리원구분#2": "보조감리원",
        "감리대상시설": "옥내소화전설비 · 스프링클러설비 · 자동화재탐지설비 · 비상방송설비 · 제연설비 · 연결송수관설비 · 비상콘센트설비",
        "제출일": D(2027, 3, 5), "감리업자": "마바소방(주) 대표 서다온", "감리원서명": "정민호", "수신": "다라소방서장  귀하"}
HEAD = "■ 소방시설공사업법 시행규칙 [별지 제24호서식] <개정 2025. 1. 23.>"
STATEMENT = "「소방시설공사업법 시행규칙」 제17조제1항에 따라 감리원 배치를 통보합니다."
SUSIN = "소방본부장/소방서장  귀하"
ATTACH = ("1. 「소방시설공사업법 시행규칙」 별표 4의2 제3호나목에 따른 감리원의 등급을 증명하는 서류\n"
          "2. 소방공사감리 계약서 사본 1부")
PAPER = "210mm×297mm[백상지 80g/㎡ 또는 중질지 80g/㎡]"


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
SM = {"kind": "free", "size": 7, "align": "right"}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


BD, QD = "{배치일}", "{통보서!제출일}"
DUE = f"({BD}+7)"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  소방공사감리원 배치통보 — 기한 · 감리기간 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 소방공사감리업자는 감리원을 감리현장에 배치하면 배치일부터 7일 이내에 소방본부장 · 소방서장에게 알립니다"
              "(소방시설공사업법 시행규칙 제17조제1항). 여기서 정한 감리원의 감리기간이 통보서에 들어갑니다.")
    s7 = {"kind": "text", "size": 7}
    sz = {"kind": "text", "size": 7.5}
    g.sec(p, "㉮  통보 기한 (규칙 제17조제1항)", need=26 * 2 + 10)
    p.row([(3, "감리원 배치일", L), (5, I("배치일", ex=_ex(ex, "배치일"), fmt=DT, align="center", size=9)), (4, "감리현장에 감리원을 배치한 날", s7)], h=24)
    f = (f'=IF(N({BD})=0,"","{GH_A}"&' + _ymdf(BD) + f'&"{GH_B}"&' + _ymdf(DUE) + '&"("&' + _yo(DUE) + f'&")"&"{GH_C}"'
         f'&IF(WEEKDAY({DUE})=7,"{GH_SAT}",IF(WEEKDAY({DUE})=1,"{GH_SUN}",""))'
         f'&IF(N({QD})=0,"",IF(N({QD})<=N({DUE}),"{GH_OK}","{GH_LATE}")))')
    p.row([(3, "통보 기한", L), (9, F("기한", f, align="left", size=8.5))], h=46)
    g.sec(p, "㉯  감리원의 감리기간 (→ 통보서)", need=24 * 3 + 10)
    for k, lab in (("감리시작", "감리 시작일"), ("감리끝", "감리 끝날")):
        p.row([(3, lab, L), (5, I(k, ex=_ex(ex, k), fmt=DT, align="center", size=9)), (4, "", s7)], h=22)
    p.row([(3, "감리기간", L),
           (9, F("기간", '=IF(OR(N({감리시작})=0,N({감리끝})=0),"",IF({감리시작}>{감리끝},"' + GK_REV + '","' + GK_A + '"&({감리끝}-{감리시작}+1)&"' + GK_B + '"))',
                 align="left", size=8.5))], h=22)
    g.sec(p, "㉰  바뀌면", need=26 + 10)
    p.row([(3, "변경", L), (9, BG, sz)])
    g.sec(p, "㉱  아직 안 적은 칸", need=46 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({통보서!대상명칭}="",{통보서!감리원#1}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 통보서의 «감리원의 감리기간» 은 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호)."])
    return p


BIN = [("대상 상호(명칭)", '{통보서!대상명칭}=""'), ("대상 소재지", '{통보서!대상소재지}=""'), ("관계인 성명", '{통보서!발주자}=""'),
       ("감리원 성명", '{통보서!감리원#1}=""'), ("감리원 분야/등급", '{통보서!감리원분야#1}=""'), ("감리대상 소방시설 종류", '{통보서!감리대상시설}=""'),
       ("감리기간(① 장)", 'OR(N({감리시작})=0,N({감리끝})=0)'), ("배치일(① 장)", 'N({배치일})=0'), ("소방공사감리업자", '{통보서!감리업자}=""')]


def _two(p, top, bot, h1, h2):
    ra = prow(p, top, h=h1)
    rb = prow(p, bot, h=h2)
    return ra, rb


def _addr(p, ex, lab, key, tel, h=19.5):
    ra, rb = _two(p, [(252, 330, lab, LT), (330, X2, inp(key, ex, align="left"), NB)],
                  [(252, 790, "", FB), (790, 990, "(전화번호 :", TL), (990, 1100, inp(tel, ex, align="center", size=8), NB), (1100, X2, ")", TR)], h, h)
    _bd(p, ra, rb, 252, X2)
    return ra, rb


# ── 통보서(앞쪽) ─────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "통보서", fit=1, widths=WP)
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center"})], h=30)
    prow(p, [(X1, X2, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=12)
    prow(p, [(X1, 453, "접수번호", GR), (453, 786, "접수일자", GR), (786, X2, "처리기간    즉시", GR)], h=20)
    p.gap(3)
    # 특정소방대상물
    r1 = prow(p, [(X1, 252, "특정소방\n대상물", dict(LB, rs=5)), (252, 360, "상호(명칭)", LT), (360, 786, inp("대상명칭", ex, align="left"), NB),
                  (786, 880, "용도 구분", LT), (880, X2, inp("용도구분", ex, align="left"), NB)], h=24.5)
    _bd(p, r1, r1, 252, 786)
    _bd(p, r1, r1, 786, X2)
    _addr(p, ex, "소재지", "대상소재지", "대상전화")
    n0 = {"fmt": '0;;""', "align": "center", "size": 8.5, "wrap": "shrink"}
    na = {"fmt": AREA, "align": "right", "size": 8.5, "wrap": "shrink"}
    # 🩹 미리보기에서 «지하» · «㎡,» 가 줄바꿈 → 칸 넓힘(시험 전 그림 보기에서 찾음)
    r4 = prow(p, [(252, 330, "구  조", LT), (330, 345, "", FB), (345, 392, "지하", F8), (392, 440, inp("지하", ex, **n0), NB), (440, 472, "층,", FB),
                  (472, 512, "지상", F8), (512, 560, inp("지상", ex, **n0), NB), (560, 592, "층,", FB), (592, 645, "연면적", F8),
                  (645, 750, inp("연면적", ex, **na), NB), (750, 786, "㎡,", FB), (786, 862, "바닥면적", F8), (862, 960, inp("바닥면적", ex, **na), NB),
                  (960, 992, "㎡,", FB), (992, 1035, inp("동수", ex, **n0), NB), (1035, 1082, "개동", FB), (1082, X2, "", FB)], h=24.5)
    _bd(p, r4, r4, 252, X2)
    r5 = prow(p, [(252, 330, "대지면적", LT), (330, 500, inp("대지면적", ex, **na), NB), (500, 545, "㎡", FB), (545, 625, "연면적", LT),
                  (625, 770, inp("연면적2", ex, **na), NB), (770, 815, "㎡", FB), (815, 900, "건축면적", LT), (900, 1040, inp("건축면적", ex, **na), NB),
                  (1040, X2, "㎡", FB)], h=24.5)
    _bd(p, r5, r5, 252, X2)
    _bd(p, r1, r5, X1, 252)
    p.gap(3)
    # 관계인
    a1 = prow(p, [(X1, 252, "관계인", dict(LB, rs=5)), (252, 786, "성명(기관 또는 법인명)", LT), (786, X2, "생년월일", LT)], h=13)
    a2 = prow(p, [(252, 786, inp("발주자", ex, align="left", size=9), NB), (786, X2, inp("생년월일", ex, align="left"), NB)], h=14)
    a3 = prow(p, [(252, 786, "(서명 또는 인)", SM), (786, X2, "(외국인등록번호)", {"kind": "free", "size": 7.5})], h=13)
    _bd(p, a1, a3, 252, 786)
    _bd(p, a1, a3, 786, X2)
    _addr(p, ex, "주소", "관계인주소", "관계인전화")
    _bd(p, a1, a3 + 2, X1, 252)
    p.gap(3)
    # 소방공사감리원
    c1 = prow(p, [(X1, 252, "소방공사\n감리원", dict(LB, rs=1 + NG)), (252, 501, "성        명", CT), (501, 810, "분야/등급", CT), (810, X2, "감리원 구분", CT)], h=21.5)
    for k in range(1, NG + 1):
        prow(p, [(252, 501, inp(f"감리원#{k}", ex, align="center"), {}), (501, 810, inp(f"감리원분야#{k}", ex, align="center"), {}),
                 (810, X2, inp(f"감리원구분#{k}", ex, align="center"), {})], h=21.5)
    _bd(p, c1, c1 + NG, X1, 252)
    kk = ('=IF(N({셈!감리시작})=0,"' + KB + '",' + _ymdf("{셈!감리시작}") + '&"부터")&"          "&'
          'IF(N({셈!감리끝})=0,"' + KE + '",' + _ymdf("{셈!감리끝}") + '&"까지")')
    prow(p, [(X1, 252, "감리원의\n감리기간", LB), (252, X2, F("감리기간", kk, align="center", size=9.5), {})], h=34)
    prow(p, [(X1, 252, "감리대상\n소방시설\n종      류", LB), (252, X2, inp("감리대상시설", ex, align="left", size=9), {"valign": "top"})], h=95)
    p.gap(6)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 9.5})], h=24)
    prow(p, [(X1, X2, inp("제출일", ex, blank="년          월          일", fmt="date", align="right", size=9), NB)], h=30)
    prow(p, [(X1, 340, "", g.FR), (340, 520, "소방공사감리업자", {"kind": "free", "size": 9.5, "align": "center"}),
             (520, 960, inp("감리업자", ex, align="center", size=8.5), NB), (960, X2, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=28)
    prow(p, [(X1, 340, "", g.FR), (340, 520, "소방공사감리원", {"kind": "free", "size": 9.5, "align": "center"}),
             (520, 960, inp("감리원서명", ex, align="center", size=8.5), NB), (960, X2, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=28)
    prow(p, [(X1, X2, inp("수신", ex, blank=SUSIN, size=12, bold=True, align="left"), {"border": False, "indent": 1})], h=30)
    from openpyxl.styles import Side
    med = Side(style="medium", color="000000")
    r = prow(p, [(X1, X2, "", FB)], h=4)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(26)
    a, b = GX.cols(242, 992)
    na_ = text_lines(ATTACH, sum(WP[a - 1:b]) * 10.0 / 8)
    prow(p, [(X1, 242, "첨부서류", {"kind": "label", "size": 8.5}), (242, 992, ATTACH, {"kind": "text", "size": 8, "valign": "center"}),
             (992, X2, "수수료\n\n없  음", {"kind": "ctext", "size": 8.5})], h=max(38, na_ * 8 * 1.45 + 12))
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=14)
    p.end_print()
    p.after_note(["«감리원의 감리기간» 은 ① 장에서 들어옵니다. 관계인 성명은 공통 정보(발주자)에서 들어옵니다."]
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
    prow(p, [(X1, 673, "", fr), (673, 991, "▼", arr), (991, X2, "", fr)], h=95)
    prow(p, [(X1, 673, "", fr), (673, 991, "신고서류 확인 및 시스템 입력\n(소방기술자 인정자에게 통보)", box), (991, X2, "", fr)], h=36)
    prow(p, [(X1, 673, "", fr), (673, 991, "▼", arr), (991, X2, "", fr)], h=85)
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


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


YO = "월화수목금토일"


def expect(pages):
    sm, sg = pages["셈"], pages["통보서"]
    a, b = {}, {}
    bd, qd = _d(sm.get("배치일")), _d(sg.get("제출일"))
    if not bd:
        a["기한"] = ""
    else:
        due = bd + datetime.timedelta(days=7)
        t = f"{GH_A}{_ymd(bd)}{GH_B}{_ymd(due)}({YO[due.weekday()]}){GH_C}"
        t += GH_SAT if due.weekday() == 5 else (GH_SUN if due.weekday() == 6 else "")
        if qd:
            t += GH_OK if qd <= due else GH_LATE
        a["기한"] = t
    gs, ge = _d(sm.get("감리시작")), _d(sm.get("감리끝"))
    a["기간"] = "" if not (gs and ge) else (GK_REV if gs > ge else f"{GK_A}{(ge - gs).days + 1}{GK_B}")
    if not sg.get("대상명칭") and not sg.get("감리원#1"):
        a["빈칸"] = ""
    else:
        mc = {"대상 상호(명칭)": not sg.get("대상명칭"), "대상 소재지": not sg.get("대상소재지"), "관계인 성명": not sg.get("발주자"),
              "감리원 성명": not sg.get("감리원#1"), "감리원 분야/등급": not sg.get("감리원분야#1"), "감리대상 소방시설 종류": not sg.get("감리대상시설"),
              "감리기간(① 장)": not (gs and ge), "배치일(① 장)": not bd, "소방공사감리업자": not sg.get("감리업자")}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    b["감리기간"] = ((_ymd(gs) + "부터") if gs else KB) + "          " + ((_ymd(ge) + "까지") if ge else KE)
    return {"셈": a, "통보서": b}


for _t in (GH_A, GH_B, GH_C, GH_SAT, GH_SUN, GH_OK, GH_LATE, GK_REV, GK_A, GK_B, BIN_OK, BIN_A, KB, KE):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
