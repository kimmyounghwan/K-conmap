# -*- coding: utf-8 -*-
"""타워크레인 대여계약 통보서 — 새로 만든 서식 (2026-11-16 G728 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 대여율(대여계약금액 ÷ 타워크레인 부분 금액 — 100분의 82 · 예정가격 100분의 64 미달이면 적정성 심사 대상) · 통보 기한(규칙 제34조의5제1항 —
     계약한 날부터 30일 이내 · 첫날 빼고 셈 민법 제157조) · 붙일 서류 · 변경 요구 · 아직 안 적은 칸
   · 통보서(건설산업기본법 시행규칙 [별지 제26호의4서식] <개정 2020.3.2.> 칸 차례 그대로 — 칸 안 위쪽 작은 이름 · 두 줄 구분선 · 붙임서류 ·
     유의사항 · 처리절차 상자 · 세로 한 쪽).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — 쪽 x 120~1124 · 이름 칸 120~246 · 붙임 226 ·
   처리절차 상자 129~312 · 393~576 · 658~841 · 922~1111. 처리절차 화살표는 원문 글층 «è»(글꼴 화살표) 대신 그림처럼 «▶».

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G728_타워크레인대여계약통보_원문.txt — 글층 해시 같음 확인):
  · 건설산업기본법 [시행 2025. 11. 27.] 제68조의4 ① 건설사업자가 타워크레인 대여계약을 맺으면 국토교통부령에 따라 발주자에게 통보
    ② 대여계약금액이 대통령령 비율에 미달하면 발주자가 적정성 심사 ③ 부적정하면 대여업자 · 계약내용 변경 요구 — 정당한 사유 없으면 이행
  · 시행령 [시행 2026. 6. 23.] 제64조의4 ① 1. 수급인의 도급금액 중 타워크레인 대여부분 상당 금액의 100분의 82 미달 2. 발주자 예정가격의 100분의 64 미달
    ③ 변경 요구는 통보받은 날 또는 사유를 안 날부터 30일 이내 서면
  · 시행규칙 [시행 2026. 1. 2.] 제34조의5(① 대여계약을 체결한 날부터 30일 이내 통보(건설산업종합정보망 포함) ② 별지 제26호의4서식 ③ 붙일 서류 1 · 2)
■ 원문 그대로: 유의사항 ① «… 산출한 금액을 말한다.» · ② «… 비율을 말합니다.»(끝맺음 다름 그대로) · 처리절차 «통보서 작성・제출»(U+30FB) ·
  아래 «210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]».
■ 짐작 안 함: 30일째가 토 · 일요일이어도 날을 늘려 셈하지 않음(«그 전 평일에 내면 안전» 글로만) · 대여율은 소수 둘째 자리 아래 버림(INT 로 셈 —
  82% 판정과 보이는 수가 어긋나지 않게)."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L

SLUG = "tower-daeyeo-tongbo"
TITLE = "타워크레인 대여계약 통보서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "타워크레인 대여계약 통보서(건설산업기본법 시행규칙 별지 제26호의4서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "타워크레인 대여계약 통보서 — 작성 예시 (도급액 · 타워크레인 부분 · 대여계약금액 · 대여율이 ① 장에서 저절로)"),
        (3, "① 대여율 100분의 82 · 예정가격 100분의 64 · 통보 기한 30일 — 작성 예시")]
MULTI = True
SHORT = ("타워크레인 대여계약 통보서(건설산업기본법 시행규칙 별지 제26호의4서식) — 타워크레인 부분 금액과 대여계약금액을 적으면 대여율이 "
         "100분의 82(예정가격은 100분의 64)에 미달하는지, 계약일부터 30일 이내 통보 기한이 언제인지 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
WON = '#,##0"원";;""'

DY_A = "대여율 "
DY_OK = "% — 도급금액 중 타워크레인 대여부분 상당 금액의 100분의 82 이상(영 제64조의4제1항제1호)"
DY_NO = "% — 100분의 82 미달: 발주자가 대여계약의 적정성을 심사해야 함(법 제68조의4제2항 · 영 제64조의4제1항제1호)"
YJ_A = "예정가격 대비 "
YJ_OK = "% — 100분의 64 이상(영 제64조의4제1항제2호)"
YJ_NO = "% — 100분의 64 미달: 발주자가 대여계약의 적정성을 심사해야 함(영 제64조의4제1항제2호)"
GH_A = "계약한 날부터 30일 이내 통보(시행규칙 제34조의5제1항 · 첫날 빼고 셈 — 민법 제157조) — 계약일 "
GH_B = " → 늦어도 "
GH_C = "까지"
GH_SAT = " — 토요일이니 그 전 평일에 내면 안전"
GH_SUN = " — 일요일이니 그 전 평일에 내면 안전"
GH_OK = " · ✓ 통보일이 기한 안"
GH_LATE = " · ⚠ 통보일이 기한을 넘김"
BYEON = ("※ 발주자는 심사 결과 적정하지 않으면 대여업자나 대여계약 내용의 변경을 요구하고(통보받은 날 또는 사유를 안 날부터 30일 이내 서면 — "
         "영 제64조의4제3항), 건설사업자는 정당한 사유가 없으면 따라야 함(법 제68조의4제3항) · 건설산업종합정보망으로 통보해도 됨(규칙 제34조의5제1항)")
SEORYU = ("붙일 서류(시행규칙 제34조의5제3항) — 1. 건설기계 임대차 계약서(변경계약서 포함) 사본 · "
          "2. 건설기계 대여대금 지급보증서 교부의무가 면제되면 그 증빙서류")
BIN_OK = "✓ 통보서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {"계약금액": 12500000000, "부분금액": 420000000, "대여금액": 357000000, "예정가격": 450000000, "대여계약일": D(2027, 4, 12)}
EX_S = {"공사명": "가나시 복합청사 신축공사",
        "임대상호": "다라중기(주) 대표 박다라", "임대사업자번호": "000-00-00000", "임대소재지": "가나도 다라시 중기로 5",
        "임차상호": "마바건설(주) 대표 이마바", "임차업종": "건축공사업 / 0000-00", "임차소재지": "가나도 마바시 건설로 3",
        "제출일": D(2027, 4, 20), "발주자": "가나시장"}
HEAD = "■ 건설산업기본법 시행규칙 [별지 제26호의4서식] <개정 2020. 3. 2.>"
STATEMENT = ("  「건설산업기본법」 제68조의4제1항 및 같은 법 시행규칙 제34조의5제1항에 따라 위와 같이 타워크레인 대여계약 내용을 "
             "통보합니다.")
ATTACH = ("1. 건설기계 임대차 계약서(변경계약서를 포함합니다) 사본\n"
          "2. 건설기계 대여대금 지급보증서 교부의무가 면제되는 경우에는 그 증빙서류")
NOTICE = ("① 타워크레인 부분 금액은 임차하려는 타워크레인에 대하여 수급인의 도급금액 산출내역서상의 계약단가를 기준으로 산출한 금액을 "
          "말한다.\n"
          "② 대여율은 대여계약 금액을 타워크레인 부분 금액으로 나눈 비율을 말합니다.")
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"


def _ex(ex, k):
    return EX.get(k) if ex else None


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


GX = Gx(120, 1124)
X1, X2 = 120, 1124
XL = 246                     # 이름 칸 오른쪽 세로줄


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
            b = p.ws.cell(row=r, column=c).border
            p.ws.cell(row=r, column=c).border = Border(left=sd if (left and c == c1) else b.left, right=sd if (right and c == c2) else b.right,
                                                       top=sd if (top and r == r1) else b.top, bottom=sd if (bot and r == r2) else b.bottom)


def box(p, r1, r2, x1, x2, side=None):
    """칸 테 — 원문처럼 맨 왼쪽(x 120) · 맨 오른쪽(x 1124) 세로줄은 긋지 않음"""
    _bd(p, r1, r2, x1, x2, left=(x1 != X1), right=(x2 != X2), side=side)


LB = {"kind": "label", "size": 9, "border": False}
SUBN = {"kind": "free", "size": 8, "align": "left", "valign": "top"}
NB = {"border": False}
FB = {"kind": "free", "size": 8}


def inp(k, ex, **kw):
    kw.setdefault("size", 9)
    return I(k, ex=_e(ex, k), **kw)


A, B, P, KD, QD = "{부분금액}", "{대여금액}", "{예정가격}", "{대여계약일}", "{통보서!제출일}"
DY = f"INT({B}*10000/{A})/100"
YJ = f"INT({B}*10000/{P})/100"
DUE = f"({KD}+30)"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  타워크레인 대여계약 — 대여율 · 통보 기한 · 서류 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 건설사업자가 타워크레인 대여계약을 맺으면 계약한 날부터 30일 이내에 발주자에게 통보합니다"
              "(건설산업기본법 제68조의4제1항 · 시행규칙 제34조의5제1항).")
    s7 = {"kind": "text", "size": 7}
    sz = {"kind": "text", "size": 7.5}
    g.sec(p, "㉮  대여계약 금액 · 대여율 (영 제64조의4)", need=24 * 6 + 10)
    p.row([(3, "도급액", L), (5, I("계약금액", ex=_ex(ex, "계약금액"), fmt=WON, align="right", size=9)), (4, "수급인의 도급금액(공통 정보 «계약금액»)", s7)], h=22)
    p.row([(3, "① 타워크레인 부분(A)", dict(L, size=8.5)), (5, I("부분금액", ex=_ex(ex, "부분금액"), fmt=WON, align="right", size=9)),
           (4, "도급금액 산출내역서 계약단가로 셈한 타워크레인 대여부분 금액", s7)], h=24)
    p.row([(3, "대여계약(예정)금액(B)", dict(L, size=8.5)), (5, I("대여금액", ex=_ex(ex, "대여금액"), fmt=WON, align="right", size=9)),
           (4, "타워크레인 대여업자와 맺은(맺을) 금액", s7)], h=24)
    dy = (f'=IF(OR(N({A})=0,N({B})=0),"",IF({B}*100<{A}*82,"⚠ {DY_A}"&{DY}&"{DY_NO}","✓ {DY_A}"&{DY}&"{DY_OK}"))')
    p.row([(3, "② 대여율(B/A)", dict(L, size=8.5)), (9, F("대여율", dy, align="left", size=8.5, bold=True))], h=34)
    p.row([(3, "발주자 예정가격", dict(L, size=8.5)), (5, I("예정가격", ex=_ex(ex, "예정가격"), fmt=WON, align="right", size=9)),
           (4, "타워크레인 대여부분에 대한 발주자의 예정가격(알면 적음)", s7)], h=24)
    yj = (f'=IF(OR(N({P})=0,N({B})=0),"",IF({B}*100<{P}*64,"⚠ {YJ_A}"&{YJ}&"{YJ_NO}","✓ {YJ_A}"&{YJ}&"{YJ_OK}"))')
    p.row([(3, "예정가격 대비", dict(L, size=8.5)), (9, F("예정대비", yj, align="left", size=8.5))], h=34)
    g.sec(p, "㉯  통보 기한 (시행규칙 제34조의5)", need=26 * 3 + 10)
    p.row([(3, "대여계약 체결일", L), (5, I("대여계약일", ex=_ex(ex, "대여계약일"), fmt=DT, align="center", size=9)), (4, "대여업자와 계약을 맺은 날", s7)], h=24)
    f = (f'=IF(N({KD})=0,"","{GH_A}"&' + _ymdf(KD) + f'&"{GH_B}"&' + _ymdf(DUE) + '&"("&' + _yo(DUE) + f'&")"&"{GH_C}"'
         f'&IF(WEEKDAY({DUE})=7,"{GH_SAT}",IF(WEEKDAY({DUE})=1,"{GH_SUN}",""))'
         f'&IF(N({QD})=0,"",IF(N({QD})<=N({DUE}),"{GH_OK}","{GH_LATE}")))')
    p.row([(3, "통보 기한", L), (9, F("기한", f, align="left", size=8.5))], h=46)
    p.row([(3, "", L), (9, BYEON, sz)])
    g.sec(p, "㉰  붙일 서류 · 아직 안 적은 칸", need=46 * 2 + 10)
    p.row([(3, "붙일 서류", L), (9, SEORYU, sz)])
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({통보서!공사명}="",{통보서!임차상호}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 통보서의 도급액 · ① 타워크레인 부분 · 대여계약(예정)금액 · ② 대여율은 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


BIN = [("공사명", '{통보서!공사명}=""'), ("임대인 상호 및 대표자", '{통보서!임대상호}=""'), ("임대인 사업자등록번호", '{통보서!임대사업자번호}=""'),
       ("임차인 상호 및 대표자", '{통보서!임차상호}=""'), ("임차인 업종 및 등록번호", '{통보서!임차업종}=""'),
       ("① 타워크레인 부분(① 장)", f'N({A})=0'), ("대여계약(예정)금액(① 장)", f'N({B})=0'), ("대여계약 체결일(① 장)", f'N({KD})=0')]


# ── 통보서 ──────────────────────────────────────────────────────────────
def _sub(p, ex, lab, key, h1, h2, right=None):
    """칸 안 위쪽 작은 이름 + 아래 적는 칸(원문처럼 사이 줄 없음)"""
    ra = prow(p, [(XL, X2, lab, SUBN)], h=h1)
    v = right if right is not None else inp(key, ex, align="left", size=9)
    rb = prow(p, [(XL, X2, v, NB)], h=h2)
    box(p, ra, rb, XL, X2)
    return ra, rb


def form(bk, ex):
    from openpyxl.styles import PatternFill, Side
    p = g.pg(bk, ex, "통보서", fit=1, widths=WP)
    med = Side(style="medium", color="000000")
    gray = PatternFill("solid", fgColor="BBBBBB")
    prow(p, [(X1, X2, HEAD, {"kind": "free", "size": 8})], h=14)
    p.gap(4)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 16, "bold": True, "align": "center"})], h=34)
    p.gap(8)
    r0 = prow(p, [(X1, XL, "공사명", dict(LB, kind="free", align="center")), (XL, X2, inp("공사명", ex, align="left", size=9.5), NB)], h=30)
    box(p, r0, r0, X1, XL)
    box(p, r0, r0, XL, X2)
    _bd(p, r0, r0, X1, X2, bot=False, left=False, right=False, side=med)
    # 임대인(건설기계사업자)
    g1 = p.r
    prow(p, [(X1, XL, "임대인\n(건설기계\n사업자)", dict(LB, rs=6)), (XL, X2, "상호 및 대표자", SUBN)], h=13)
    rb = prow(p, [(XL, X2, inp("임대상호", ex, align="left", size=9), NB)], h=23)
    box(p, g1, rb, XL, X2)
    _sub(p, ex, "사업자등록번호", "임대사업자번호", 13, 23)
    _, last = _sub(p, ex, "영업소 소재지", "임대소재지", 13, 23)
    box(p, g1, last, X1, XL)
    _bd(p, last, last, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(4)
    # 임차인(건설사업자)
    g2 = p.r
    prow(p, [(X1, XL, "임차인\n(건설사업\n자)", dict(LB, rs=6)), (XL, X2, "상호 및 대표자", SUBN)], h=13)
    rb = prow(p, [(XL, X2, inp("임차상호", ex, align="left", size=9), NB)], h=19)
    box(p, g2, rb, XL, X2)
    _sub(p, ex, "업종 및 등록번호", "임차업종", 13, 19)
    _, last = _sub(p, ex, "영업소 소재지", "임차소재지", 13, 19)
    box(p, g2, last, X1, XL)
    _bd(p, g2, g2, X1, X2, bot=False, left=False, right=False, side=med)
    _bd(p, last, last, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(4)
    # 대여계약 내용
    won = 'IF(N({{셈!{k}}})=0,"",TEXT({{셈!{k}}},"#,##0")&"원")'
    g3 = p.r
    prow(p, [(X1, XL, "대여계약\n내용", dict(LB, rs=6)), (XL, 450, "도급액", SUBN),
             (450, X2, F("도급액표시", "=" + won.format(k="계약금액"), align="left", size=9), NB)], h=19)
    rb = prow(p, [(XL, 450, "① 타워크레인 부분", dict(SUBN, valign="center", size=8.5)),
                  (450, X2, F("부분표시", "=" + won.format(k="부분금액"), align="left", size=9), NB)], h=19)
    box(p, g3, rb, XL, X2)
    _sub(p, ex, "대여계약(예정)금액", None, 13, 19, right=F("대여금액표시", "=" + won.format(k="대여금액"), align="left", size=9))
    dyf = '=IF(OR(N({셈!부분금액})=0,N({셈!대여금액})=0),"",INT({셈!대여금액}*10000/{셈!부분금액})/100&"%")'
    _, last = _sub(p, ex, "② 대여율", None, 13, 19, right=F("대여율표시", dyf, align="left", size=9))
    box(p, g3, last, X1, XL)
    _bd(p, g3, g3, X1, X2, bot=False, left=False, right=False, side=med)
    p.gap(6)
    n = text_lines(STATEMENT, sum(WP) * 10.0 / 9.5)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 9.5})], h=max(30, n * 9.5 * 1.45 + 4))
    p.gap(6)
    prow(p, [(X1, X2, inp("제출일", ex, blank="년          월          일", fmt="date", align="right", size=9.5), NB)], h=20)
    p.gap(10)
    prow(p, [(X1, 655, "", FB), (655, 714, "수급인", {"kind": "free", "size": 9.5, "align": "center"}),
             (714, 1009, F("수급인표시", '=IF({임차상호}="","",{임차상호})', align="center", size=8.5), NB),
             (1009, X2, "(서명 또는 인)", {"kind": "free", "size": 8, "align": "right"})], h=22)
    p.gap(10)
    prow(p, [(X1, 394, inp("발주자", ex, align="right", size=11, bold=True), NB), (394, 460, "귀하", {"kind": "free", "size": 12, "bold": True})], h=22)
    r = prow(p, [(X1, X2, "", FB)], h=4)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(3)
    a, b = GX.cols(226, X2)
    na_ = text_lines(ATTACH, sum(WP[a - 1:b]) * 10.0 / 8)
    ra = prow(p, [(X1, 226, "붙임서류", {"kind": "free", "size": 8.5, "align": "center"}),
                  (226, X2, ATTACH, {"kind": "free", "size": 8, "valign": "center"})], h=max(46, na_ * 8 * 1.45 + 10))
    box(p, ra, ra, X1, 226)
    box(p, ra, ra, 226, X2)
    p.gap(6)
    rh = prow(p, [(X1, X2, "유의사항", {"kind": "free", "size": 9, "align": "center", "fill": gray})], h=19)
    box(p, rh, rh, X1, X2)
    nn = text_lines(NOTICE, sum(WP) * 10.0 / 7.5)
    rn = prow(p, [(X1, X2, NOTICE, {"kind": "free", "size": 7.5, "valign": "center"})], h=max(48, nn * 7.5 * 1.45 + 10))
    _bd(p, rn, rn, X1, X2, top=False, left=False, right=False)
    p.gap(8)
    rp = prow(p, [(X1, X2, "처리절차", {"kind": "free", "size": 9, "align": "center", "fill": gray})], h=24)
    _bd(p, rp, rp, X1, X2, bot=False, left=False, right=False, side=med)
    p.gap(4)
    E = [(129, 312), (393, 576), (658, 841), (922, 1111)]
    steps = ["통보서 작성・제출", "접  수", "통보내용 확인\n(적정성)", "결  재"]
    who = ["건설사업자", "발주자(담당부서)", "발주자(담당부서)", "발주자(담당부서)"]
    bx = {"kind": "ctext", "size": 8}
    arr = {"kind": "cfree", "size": 9}
    items = [(X1, 129, "", FB)]
    for j, (x1, x2) in enumerate(E):
        items.append((x1, x2, steps[j], bx))
        if j < 3:
            items.append((x2, E[j + 1][0], "▶", arr))
    items.append((1111, X2, "", FB))
    prow(p, items, h=30)
    items = [(X1, 129, "", FB)]
    for j, (x1, x2) in enumerate(E):
        items.append((x1, x2, who[j], {"kind": "cfree", "size": 7.5}))
        if j < 3:
            items.append((x2, E[j + 1][0], "", FB))
    items.append((1111, X2, "", FB))
    rw = prow(p, items, h=18)
    _bd(p, rw, rw, X1, X2, top=False, left=False, right=False)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 7, "align": "right"})], h=14)
    p.end_print()
    p.after_note(["도급액 · ① 타워크레인 부분 · 대여계약(예정)금액 · ② 대여율은 ① 장에서 들어옵니다. 수급인 칸에는 임차인 상호 및 대표자가 들어갑니다. "
                  "«귀하» 앞에는 발주자를 적습니다(공통 정보 «발주자» 에서)."]
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


def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


YO = "월화수목금토일"


def _pct(b, a):
    """엑셀 INT(b*10000/a)/100 을 글로 — 끝 0 없음(85 · 85.1 · 79.33)"""
    v = int(b * 10000 / a) / 100
    return str(int(v)) if float(v).is_integer() else f"{v:.2f}".rstrip("0").rstrip(".")


def _won(v):
    from decimal import ROUND_HALF_UP, Decimal
    if not v:
        return ""
    return f"{int(Decimal(repr(v)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)):,}원"


def expect(pages):
    sm, sg = pages["셈"], pages["통보서"]
    a, b = {}, {}
    av, bv, pv = _n(sm.get("부분금액")), _n(sm.get("대여금액")), _n(sm.get("예정가격"))
    if not (av and bv):
        a["대여율"] = ""
    else:
        a["대여율"] = ("⚠ " + DY_A + _pct(bv, av) + DY_NO) if bv * 100 < av * 82 else ("✓ " + DY_A + _pct(bv, av) + DY_OK)
    if not (pv and bv):
        a["예정대비"] = ""
    else:
        a["예정대비"] = ("⚠ " + YJ_A + _pct(bv, pv) + YJ_NO) if bv * 100 < pv * 64 else ("✓ " + YJ_A + _pct(bv, pv) + YJ_OK)
    kd, qd = _d(sm.get("대여계약일")), _d(sg.get("제출일"))
    if not kd:
        a["기한"] = ""
    else:
        due = kd + datetime.timedelta(days=30)
        t = f"{GH_A}{_ymd(kd)}{GH_B}{_ymd(due)}({YO[due.weekday()]}){GH_C}"
        t += GH_SAT if due.weekday() == 5 else (GH_SUN if due.weekday() == 6 else "")
        if qd:
            t += GH_OK if qd <= due else GH_LATE
        a["기한"] = t
    if not sg.get("공사명") and not sg.get("임차상호"):
        a["빈칸"] = ""
    else:
        mc = {"공사명": not sg.get("공사명"), "임대인 상호 및 대표자": not sg.get("임대상호"), "임대인 사업자등록번호": not sg.get("임대사업자번호"),
              "임차인 상호 및 대표자": not sg.get("임차상호"), "임차인 업종 및 등록번호": not sg.get("임차업종"),
              "① 타워크레인 부분(① 장)": not av, "대여계약(예정)금액(① 장)": not bv, "대여계약 체결일(① 장)": not kd}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    b["도급액표시"] = _won(_n(sm.get("계약금액")))
    b["부분표시"] = _won(av)
    b["대여금액표시"] = _won(bv)
    b["대여율표시"] = (_pct(bv, av) + "%") if (av and bv) else ""
    b["수급인표시"] = sg.get("임차상호") or ""
    return {"셈": a, "통보서": b}


for _t in (DY_A, DY_OK, DY_NO, YJ_A, YJ_OK, YJ_NO, GH_A, GH_B, GH_C, GH_SAT, GH_SUN, GH_OK, GH_LATE, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
