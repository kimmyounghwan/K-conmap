# -*- coding: utf-8 -*-
"""재하도급 승낙통보서 — 새로 만든 서식 (2026-11-16 G725 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 재하도급 비중(B/A — 규칙 제25조의7 «하도급받은 전체 공사금액 중 100분의 20 이내») · 통보 기한(영 제32조제1항 — 승낙한 날부터 30일 이내 ·
     첫날 빼고 셈 민법 제157조) · 감리자 통보 간주(제2항) · 붙일 서류(규칙 제26조제3항) · 아직 안 적은 칸
   · 통보서(건설산업기본법 시행규칙 [별지 제23호의2서식] <개정 2020.10.7.> 칸 차례 그대로 — 세로 한 쪽 · 바깥 굵은 테).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — 바깥 테 x 149~1084.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G725_재하도급승낙통보_원문.txt — 글층 해시 같음 확인):
  · 건설산업기본법 [시행 2025. 11. 27.] 제29조 ③ 하수급인은 다시 하도급할 수 없음 — 단서 2. 전문공사 일부를 가. 국토교통부령 요건 · 나. 수급인의 서면 승낙 ·
    ⑥ 다시 하도급하는 것을 승낙한 자는 발주자에게 통보
  · 시행령 [시행 2026. 6. 23.] 제32조(① 승낙한 날부터 30일 이내 · 변경 · 해제도 같음 ② 감리자에게 기한 안에 통보하면 발주자에게 통보한 것으로 봄)
  · 시행규칙 [시행 2026. 1. 2.] 제25조의7(100분의 20 이내 + 1호 발주자 서면승낙 · 2호 가 보증서 또는 직접지급 합의 · 나 연대지급 합의) ·
    제26조(① 재하도급 승낙의 통보는 별지 제23호의2서식 ③ 붙일 서류 1. 재하도급계약서 사본 2. 보증서 · 합의서 사본 3. 합의서 사본)
■ 원문 그대로: 첨부서류 2의 «공사대급»(오기) · «방법․절차» · 아래 «210㎜×297㎜(일반용지 60g/㎡(재활용품))».
■ 짐작 안 함: 30일째가 토 · 일요일이어도 날을 늘려 셈하지 않음(«그 전 평일에 내면 안전» 글로만) · 요건 1호 가~마 해당 여부는 고르게 하지 않고 글로만."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L

SLUG = "jaehado-seungnak"
TITLE = "재하도급 승낙통보서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "재하도급 승낙통보서(건설산업기본법 시행규칙 별지 제23호의2서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "재하도급 승낙통보서 — 작성 예시 (하도급액 · 재하도급 금액 · 비중이 ① 장에서 저절로)"),
        (3, "① 재하도급 비중 20% · 통보 기한 30일 · 서류 — 작성 예시")]
MULTI = True
SHORT = ("재하도급 승낙통보서(건설산업기본법 시행규칙 별지 제23호의2서식) — 하도급액과 재하도급 금액을 적으면 비중(B/A)이 100분의 20 이내인지, "
         "승낙일부터 30일 이내 통보 기한이 언제인지 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
WON = '#,##0"원";;""'

BJ_OK_A, BJ_OK_B = "✓ 재하도급 비중 ", "% — 하도급받은 전체 공사금액의 100분의 20 이내(규칙 제25조의7)"
BJ_NO_A, BJ_NO_B = "⚠ 재하도급 비중 ", "% — 100분의 20을 넘음: 다시 하도급할 수 있는 경우가 아님(규칙 제25조의7)"
BJ_Q = "⚠ 재하도급 금액(B)이 하도급액(A)보다 큽니다"
GH_A = "승낙한 날부터 30일 이내 통보(영 제32조제1항 · 첫날 빼고 셈 — 민법 제157조) — 승낙일 "
GH_B = " → 늦어도 "
GH_C = "까지"
GH_SAT = " — 토요일이니 그 전 평일에 내면 안전"
GH_SUN = " — 일요일이니 그 전 평일에 내면 안전"
GH_OK = " · ✓ 통보일이 기한 안"
GH_LATE = " · ⚠ 통보일이 기한을 넘김"
GAMRI = "※ 감리자가 있는 공사는 기한 안에 감리자에게 통보하면 발주자에게 통보한 것으로 봄(영 제32조제2항) · 승낙을 변경 · 해제한 때에도 30일 이내(제1항 후단)"
YOGEON = ("요건(규칙 제25조의7) — 하도급받은 전체 공사금액의 100분의 20 이내 + 1. 발주자의 서면승낙(신기술 · 특허 공법 · 상근 전문인력이 필요한 건설기계 공사 등) "
          "+ 2. 가. 하수급인의 공사대금 보증서 또는 수급인 직접지급 합의 · 나. 건설기계대여대금 · 부품대금 · 임금 연대지급 합의")
SEORYU = "붙일 서류(규칙 제26조제3항) — 1. 재하도급계약서(변경계약서 포함) 사본 · 2. 보증서 사본 또는 합의서 사본 · 3. 합의서 사본"
BIN_OK = "✓ 통보서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {"하도급액": 1250000000, "재하도급액": 230000000, "승낙일": D(2027, 5, 10)}
EX_S = {"공사명": "가나시 하수관로 정비공사", "수급상호": "다라건설(주) 대표 최지훈", "수급소재지": "가나도 다라시 사아로 7",
        "승낙사유": "특허권이 설정된 공법(합성보)을 적용하는 공사 — 발주자 서면승낙(규칙 제25조의7제1호)",
        "하수급상호": "마바토건(주) 대표 서다온", "하수급소재지": "가나도 마바시 공단로 21",
        "재하수급상호": "사아특수공법(주) 대표 문가온", "재하수급업종": "철근 · 콘크리트공사업 / 0000-00", "재하수급소재지": "가나도 사아시 하하로 8",
        "공종": "교량 상부 합성보 제작 · 설치", "제출일": D(2027, 5, 24), "발주자": "가나시장"}
HEAD = "[별지 제23호의2서식] <개정 2020.10.7.>"
STATEMENT = "「건설산업기본법」 제29조제6항에 따라 재하도급 승낙을 통보합니다."
ATTACH = ("1. 재하도급계약서(변경계약서를 포함합니다) 사본 1부\n"
          "2. 하수급인이 공사대급을 보증하는 보증서 사본 또는 수급인이 공사대금을 직접 지급한다는 뜻과 그 지급의 방법․절차에 관하여 수급인, 하수급인 및 "
          "하수급인으로부터 다시 하도급받는 건설사업자가 합의한 합의서 사본\n"
          "3. 다시 하도급받는 공사와 관련된 건설기계 대여대금, 건설공사용 부품대금 또는 근로자의 임금을 하수급인이 연대하여 지급할 책임을 진다는 내용으로 "
          "하수급인과 하수급인으로부터 다시 하도급받는 건설사업자가 합의한 합의서 사본")
PAPER = "210㎜×297㎜(일반용지 60g/㎡(재활용품))"


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


GX = Gx(149, 1084)
X1, X2 = 149, 1084


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


LB = {"kind": "label", "size": 9}
LT = {"kind": "free", "size": 9, "align": "left"}
NB = {"border": False}


def inp(k, ex, **kw):
    kw.setdefault("size", 9)
    return I(k, ex=_e(ex, k), **kw)


A, B, SD, QD = "{하도급액}", "{재하도급액}", "{승낙일}", "{통보서!제출일}"
DUE = f"({SD}+30)"
RATIO = f"ROUND({B}/{A}*100,2)"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  재하도급 승낙 — 비중 · 통보 기한 · 서류 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 하수급인이 다시 하도급하는 것을 승낙한 수급인은 승낙한 날부터 30일 이내에 발주자에게 통보합니다(건설산업기본법 제29조제6항 · 시행령 제32조제1항).")
    s7 = {"kind": "text", "size": 7}
    sz = {"kind": "text", "size": 7.5}
    g.sec(p, "㉮  재하도급 비중 (규칙 제25조의7 — 100분의 20 이내)", need=24 * 3 + 10)
    p.row([(3, "하도급액(A)", L), (5, I("하도급액", ex=_ex(ex, "하도급액"), fmt=WON, align="right", size=9)), (4, "하수급인이 하도급받은 전체 공사금액", s7)], h=22)
    p.row([(3, "재하도급 금액(B)", L), (5, I("재하도급액", ex=_ex(ex, "재하도급액"), fmt=WON, align="right", size=9)), (4, "다시 하도급하는 부분의 금액", s7)], h=22)
    bj = (f'=IF(OR(N({A})=0,N({B})=0),"",IF({B}>{A},"{BJ_Q}",IF({RATIO}<=20,"{BJ_OK_A}"&{RATIO}&"{BJ_OK_B}","{BJ_NO_A}"&{RATIO}&"{BJ_NO_B}")))')
    p.row([(3, "비중(B/A)", L), (9, F("비중", bj, align="left", size=8.5, bold=True))], h=34)
    p.row([(3, "요건", L), (9, YOGEON, {"kind": "text", "size": 7})])
    g.sec(p, "㉯  통보 기한 (영 제32조)", need=26 * 3 + 10)
    p.row([(3, "재하도급 승낙일", L), (5, I("승낙일", ex=_ex(ex, "승낙일"), fmt=DT, align="center", size=9)), (4, "수급인이 서면으로 승낙한 날", s7)], h=24)
    f = (f'=IF(N({SD})=0,"","{GH_A}"&' + _ymdf(SD) + f'&"{GH_B}"&' + _ymdf(DUE) + '&"("&' + _yo(DUE) + f'&")"&"{GH_C}"'
         f'&IF(WEEKDAY({DUE})=7,"{GH_SAT}",IF(WEEKDAY({DUE})=1,"{GH_SUN}",""))'
         f'&IF(N({QD})=0,"",IF(N({QD})<=N({DUE}),"{GH_OK}","{GH_LATE}")))')
    p.row([(3, "통보 기한", L), (9, F("기한", f, align="left", size=8.5))], h=46)
    p.row([(3, "", L), (9, GAMRI, sz)])
    g.sec(p, "㉰  붙일 서류 · 아직 안 적은 칸", need=46 * 2 + 10)
    p.row([(3, "붙일 서류", L), (9, SEORYU, sz)])
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({통보서!공사명}="",{통보서!수급상호}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 통보서 ⑪ 칸의 하도급액 · 재하도급 금액 · 비중은 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


BIN = [("① 공사명", '{통보서!공사명}=""'), ("② 수급인 상호 및 대표자", '{통보서!수급상호}=""'), ("④ 재하도급 승낙사유", '{통보서!승낙사유}=""'),
       ("⑤ 하수급인", '{통보서!하수급상호}=""'), ("⑦ 재하수급인", '{통보서!재하수급상호}=""'), ("⑧ 업종 및 등록번호", '{통보서!재하수급업종}=""'),
       ("⑩ 공종", '{통보서!공종}=""'), ("하도급액 · 재하도급 금액(① 장)", f'OR(N({A})=0,N({B})=0)'), ("승낙일(① 장)", f'N({SD})=0')]


# ── 통보서 ──────────────────────────────────────────────────────────────
def form(bk, ex):
    from openpyxl.styles import Side
    p = g.pg(bk, ex, "통보서", fit=1, widths=WP)
    thick = Side(style="medium", color="000000")
    prow(p, [(X1, X2, HEAD, {"kind": "free", "size": 8.5})], h=14)
    rt = prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center"})], h=26)
    r0 = prow(p, [(X1, 575, "①  공사명", LT), (575, X2, inp("공사명", ex, align="left"), {})], h=23)
    _bd(p, r0, r0, X1, X2, top=True, bot=True, left=False, right=False)
    groups = [("수급인", [("②  상호 및 대표자", "수급상호", 24), ("③  영업소 소재지", "수급소재지", 23.5), ("④  재하도급 승낙사유", "승낙사유", 21)]),
              ("하수급인", [("⑤  상호 및 대표자", "하수급상호", 24), ("⑥  영업소 소재지", "하수급소재지", 24)]),
              ("재하수급인", [("⑦  상호 및 대표자", "재하수급상호", 24), ("⑧  업종 및 등록번호", "재하수급업종", 24), ("⑨  영업소 소재지", "재하수급소재지", 24)]),
              ]
    for lab, rows in groups:
        rr = []
        for j, (t, k, h) in enumerate(rows):
            its = ([(X1, 315, lab, dict(LB, rs=len(rows)))] if j == 0 else []) + [(315, 575, t, LT), (575, X2, inp(k, ex, align="left", size=8.5), {})]
            rr.append(prow(p, its, h=h))
        _bd(p, rr[0], rr[-1], X1, 315)
    s1 = prow(p, [(X1, 315, "재하도급내용", dict(LB, rs=4)), (315, 575, "⑩  공종", LT), (575, X2, inp("공종", ex, align="left", size=8.5), {})], h=24)
    won = 'IF(N({{셈!{k}}})=0,"",TEXT({{셈!{k}}},"#,##0")&"원")'
    s2 = prow(p, [(315, 575, "⑪  재하도급내용(비중)", dict(LT, rs=3)),
                  (575, X2, F("하도급액표시", '="하도급액(A): "&' + won.format(k="하도급액"), align="left", size=8.5), NB)], h=20)
    prow(p, [(575, X2, F("재하도급표시", '="하도급액 중 재하도급부분 금액(B): "&' + won.format(k="재하도급액"), align="left", size=8.5), NB)], h=19)
    prow(p, [(575, X2, F("비중표시", '="재하도급부분 비중(B/A): "&IF(OR(N({셈!하도급액})=0,N({셈!재하도급액})=0),"",ROUND({셈!재하도급액}/{셈!하도급액}*100,2)&"%")',
                         align="left", size=8.5), NB)], h=20)
    _bd(p, s2, s2 + 2, 575, X2)
    _bd(p, s1, s2 + 2, X1, 315)
    p.gap(14)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 10, "align": "center"})], h=24)
    p.gap(14)
    prow(p, [(X1, X2, inp("제출일", ex, blank="년          월          일", fmt="date", align="center", size=10), NB)], h=24)
    p.gap(14)
    prow(p, [(X1, 560, "", g.FR), (560, 660, "수급인", {"kind": "free", "size": 10, "align": "center"}),
             (660, 900, F("수급인표시", '=IF({수급상호}="","",{수급상호})', align="center", size=8.5), NB), (900, X2, "(서명 또는 인)", {"kind": "free", "size": 8})], h=24)
    p.gap(14)
    prow(p, [(X1, 455, inp("발주자", ex, align="right", size=11, bold=True), NB), (455, 540, "귀하", {"kind": "free", "size": 12, "bold": True})], h=24)
    p.gap(6)
    rh = prow(p, [(X1, X2, "첨부서류", {"kind": "free", "size": 9.5, "align": "center"})], h=18)
    _bd(p, rh, rh, X1, X2, left=False, right=False)
    na_ = text_lines(ATTACH, sum(WP) * 10.0 / 8.5)
    ra = prow(p, [(X1, X2, ATTACH, {"kind": "text", "size": 8.5, "valign": "top"})], h=max(110, na_ * 8.5 * 1.45 + 12))
    _bd(p, ra, ra, X1, X2, top=False, bot=False, left=False, right=False)
    _bd(p, rt, ra, X1, X2, side=thick)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    p.end_print()
    p.after_note(["⑪ 칸의 하도급액 · 재하도급 금액 · 비중은 ① 장에서 들어옵니다. 수급인 칸에는 ② 상호 및 대표자가 들어갑니다. "
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


def _r2(x):
    """엑셀 ROUND(x, 2) 를 글로 — 끝 0 없음(18.4 · 20 · 18.47)"""
    v = float(f"{x + (1e-12 if x >= 0 else -1e-12):.2f}")
    return str(int(v)) if v.is_integer() else (f"{v:.2f}".rstrip("0").rstrip("."))


def _won(v):
    return f"{int(v):,}원" if v else ""


def expect(pages):
    sm, sg = pages["셈"], pages["통보서"]
    a, b = {}, {}
    av, bv = _n(sm.get("하도급액")), _n(sm.get("재하도급액"))
    if not (av and bv):
        a["비중"] = ""
    elif bv > av:
        a["비중"] = BJ_Q
    else:
        r = _r2(bv / av * 100)
        a["비중"] = (BJ_OK_A + r + BJ_OK_B) if float(r) <= 20 else (BJ_NO_A + r + BJ_NO_B)
    sd, qd = _d(sm.get("승낙일")), _d(sg.get("제출일"))
    if not sd:
        a["기한"] = ""
    else:
        due = sd + datetime.timedelta(days=30)
        t = f"{GH_A}{_ymd(sd)}{GH_B}{_ymd(due)}({YO[due.weekday()]}){GH_C}"
        t += GH_SAT if due.weekday() == 5 else (GH_SUN if due.weekday() == 6 else "")
        if qd:
            t += GH_OK if qd <= due else GH_LATE
        a["기한"] = t
    if not sg.get("공사명") and not sg.get("수급상호"):
        a["빈칸"] = ""
    else:
        mc = {"① 공사명": not sg.get("공사명"), "② 수급인 상호 및 대표자": not sg.get("수급상호"), "④ 재하도급 승낙사유": not sg.get("승낙사유"),
              "⑤ 하수급인": not sg.get("하수급상호"), "⑦ 재하수급인": not sg.get("재하수급상호"), "⑧ 업종 및 등록번호": not sg.get("재하수급업종"),
              "⑩ 공종": not sg.get("공종"), "하도급액 · 재하도급 금액(① 장)": not (av and bv), "승낙일(① 장)": not sd}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    b["하도급액표시"] = "하도급액(A): " + _won(av)
    b["재하도급표시"] = "하도급액 중 재하도급부분 금액(B): " + _won(bv)
    b["비중표시"] = "재하도급부분 비중(B/A): " + ((_r2(bv / av * 100) + "%") if (av and bv) else "")
    b["수급인표시"] = sg.get("수급상호") or ""
    return {"셈": a, "통보서": b}


for _t in (BJ_OK_A, BJ_OK_B, BJ_NO_A, BJ_NO_B, BJ_Q, GH_A, GH_B, GH_C, GH_SAT, GH_SUN, GH_OK, GH_LATE, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
