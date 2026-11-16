# -*- coding: utf-8 -*-
"""건설분쟁조정신청서 — 새로 만든 서식 (2026-11-16 G729 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 분쟁 종류(법 제69조제3항 각 호 · 시행령 제65조 — 조정 대상 글 · 제외 사항) · 처리 기한(법 제74조 — 받은 날부터 60일 · 연장 60일 범위) ·
     조정안 수락 기한(법 제78조제2항 — 받은 날부터 15일) · 수수료(시행규칙 별표 5 제3호 5만원) · 붙일 서류 · 아직 안 적은 칸
   · 신청서(건설산업기본법 시행규칙 [별지 제27호서식] <개정 2014.2.6> 칸 차례 그대로 — 칸 안 위쪽 작은 이름 · 굵은 선 · 접수 띠 · 첨부서류 ·
     처리절차 상자 · 세로 한 쪽).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — 쪽 x 91~1092 · 이름 칸 91~197 · 가운데 739 ·
   접수 띠 341 · 739 · 첨부 214 · 873 · 처리절차 상자 91~259 · 303~473 · 512~670 · 712~876 · 921~1092. 화살표는 원문 글층 «è»(글꼴 화살표) 대신 그림처럼 «➔».

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G729_건설분쟁조정신청서_원문.txt — 글층 해시 같음 확인):
  · 건설산업기본법 [시행 2025. 11. 27.] 제69조③(조정 대상 분쟁 1 ~ 6호) · 제72조(상대방 통지 · 참여) · 제73조(거부 · 소 제기 때 중지) ·
    제74조(받은 날부터 60일 · 60일 범위 연장) · 제78조(15일 이내 수락 통보 · 조정서 = 재판상 화해) · 제78조의2(시효중단) · 제79조(비용 부담)
  · 시행령 [시행 2026. 6. 23.] 제65조(6호 분쟁 1 ~ 4) · 제66조(서면 신청)
  · 시행규칙 [시행 2026. 1. 2.] 제35조(① 별지 제27호서식 ② 붙일 서류) · 제38조①(수수료 별표 5) · 별표 5 <개정 2021. 8. 31.> 3. 5만원
■ 원문 그대로: 아래 «210mm×297mm[백상지80g/㎡ 또는 중질지80g/㎡]» · 첨부 «심사ㆍ조정» · «영업소소재지» · 별표 5 원문 표기 «건설업분쟁조종».
■ 짐작 안 함: 60일 · 15일 끝날이 토 · 일요일이어도 날을 늘려 셈하지 않음(수락 통보는 «그 전 평일에 내면 안전» 글로만) · 조정 대상은 고른
  종류의 법 글만 보여 줌(국가계약법 · 하도급법 적용 여부는 셈하지 않음)."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L

SLUG = "bunjaeng-jojeong"
TITLE = "건설분쟁조정신청서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "건설분쟁조정신청서(건설산업기본법 시행규칙 별지 제27호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "건설분쟁조정신청서 — 작성 예시 (신청인 · 피신청인 · 조정을 받고자 하는 사항 · 분쟁 개요)"),
        (3, "① 분쟁 종류 · 처리 기한 60일 · 조정안 수락 15일 · 수수료 — 작성 예시")]
MULTI = True
SHORT = ("건설분쟁조정신청서(건설산업기본법 시행규칙 별지 제27호서식) — 분쟁 종류를 고르면 조정 대상 법 글이, 신청일을 적으면 "
         "위원회 처리 기한(60일)이, 조정안을 받은 날을 적으면 수락 통보 기한(15일)이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'

KINDS = ["1호 설계·시공·감리 등 책임", "2호 발주자와 수급인", "3호 수급인과 하수급인", "4호 수급인과 제3자", "5호 도급 당사자와 보증인",
         "6호 자재·건설기계 대금", "6호 건설업 양도", "6호 하자담보책임", "6호 손해배상책임"]
KT = ["✓ 조정 대상 — 설계, 시공, 감리 등 건설공사에 관계한 자 사이의 책임에 관한 분쟁(법 제69조제3항제1호)",
      "✓ 조정 대상 — 발주자와 수급인 사이의 건설공사에 관한 분쟁(법 제69조제3항제2호) · ⚠ 「국가를 당사자로 하는 계약에 관한 법률」 및 "
      "「지방자치단체를 당사자로 하는 계약에 관한 법률」의 해석과 관련된 분쟁은 제외",
      "✓ 조정 대상 — 수급인과 하수급인 사이의 건설공사 하도급에 관한 분쟁(법 제69조제3항제3호) · ⚠ 「하도급거래 공정화에 관한 법률」을 "
      "적용받는 사항은 제외",
      "✓ 조정 대상 — 수급인과 제3자 사이의 시공상 책임 등에 관한 분쟁(법 제69조제3항제4호)",
      "✓ 조정 대상 — 건설공사 도급계약의 당사자와 보증인 사이의 보증책임에 관한 분쟁(법 제69조제3항제5호)",
      "✓ 조정 대상 — 수급인 또는 하수급인과 제3자 간의 자재의 대금 및 건설기계사용대금에 관한 분쟁(법 제69조제3항제6호 · 시행령 제65조제1호)",
      "✓ 조정 대상 — 건설업의 양도에 관한 분쟁(법 제69조제3항제6호 · 시행령 제65조제2호)",
      "✓ 조정 대상 — 법 제28조에 따른 수급인의 하자담보책임에 관한 분쟁(법 제69조제3항제6호 · 시행령 제65조제3호)",
      "✓ 조정 대상 — 법 제44조에 따른 건설사업자의 손해배상책임에 관한 분쟁(법 제69조제3항제6호 · 시행령 제65조제4호)"]
GEOBU = ("※ 위원회는 분쟁의 성질상 조정이 부적합하거나 부정한 목적의 신청이면 조정을 거부할 수 있고(사유 통보), 당사자 어느 한쪽이 "
         "소(訴)를 제기하면 조정을 중지함(법 제73조제1항 · 제3항)")
CH_A = "위원회는 신청을 받은 날부터 60일 이내에 조정안 작성(법 제74조제1항 · 첫날 빼고 셈 — 민법 제157조) — 받은 날 "
CH_N = "(신청서의 신청일로 셈)"
CH_B = " → "
CH_C = "까지 · 연장되면(위원회 의결 · 60일 범위 — 사유 통보) 늦어도 "
CH_D = "까지"
SR_A = "조정안을 받은 날부터 15일 이내에 수락 여부를 위원회에 통보(법 제78조제2항 · 첫날 빼고 셈) — 받은 날 "
SR_B = " → 늦어도 "
SR_C = "까지"
SR_SAT = " — 토요일이니 그 전 평일에 내면 안전"
SR_SUN = " — 일요일이니 그 전 평일에 내면 안전"
HYO = ("※ 위원회는 신청 내용을 상대방에게 알리고 상대방은 조정에 참여해야 함(법 제72조) · 조정 신청은 시효를 중단시킴(취하 · 거부 · 중지되면 "
       "아님 — 제78조의2제1항) · 합의하거나 조정안을 수락하면 조정서를 작성하고, 조정서는 재판상 화해와 같은 효력(제78조제3항 · 제4항)")
SUSU = "5만원 — 시행규칙 제38조제1항 · 별표 5 제3호(원문 표기 «건설업분쟁조종»)"
BIYONG = ("분쟁 조정을 위한 감정 · 진단 · 시험 비용은 신청인이 부담(당사자 사이에 약정이 있으면 약정대로 — 법 제79조제1항) · 위원회가 "
          "필요하면 미리 내게 할 수 있음(제79조제2항)")
SEORYU = ("붙일 서류(시행규칙 제35조제2항) — 1. 당사자 간의 교섭경위서(분쟁발생 시부터 신청 시까지의 일정별 교섭내용과 그 입증자료) · "
          "2. 그 밖에 분쟁조정신청사건의 심사 · 조정에 참고가 될 수 있는 객관적인 자료")
BIN_OK = "✓ 신청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {"분쟁종류": KINDS[1], "접수일": None, "조정안일": D(2027, 7, 1)}
EX_S = {"대표자": "김가나", "생년월일": "000000-0000000", "상호": "가나건설(주)", "전화번호": "000-0000-0000",
        "신청주소": "가나도 가나시 건설로 1",
        "피성명": "박다라", "피상호": "다라개발(주)", "피전화": "000-000-0000", "피업종": "부동산 개발업", "피사업자번호": "000-00-00000",
        "피소재지": "가나도 다라시 개발로 2",
        "조정사항": "설계변경으로 늘어난 공사비 1억 2,000만원의 지급",
        "분쟁개요": "2027. 2. 발주자의 설계변경 지시로 공사비가 늘었으나, 네 차례 협의(3. 8. · 3. 22. · 4. 5. · 4. 19.)에서 금액 차이로 "
                    "합의하지 못함(교섭경위서 붙임)",
        "신청일": D(2027, 5, 3)}
HEAD = "■ 건설산업기본법 시행규칙 [별지 제27호서식] <개정 2014.2.6>"
STATEMENT = "  「건설산업기본법」 제69조제3항 및 같은 법 시행령 제66조에 따라 건설분쟁 조정을 신청합니다."
ATTACH = ("1. 당사자 간의 교섭경위서(분쟁발생 시부터 신청 시까지의 당사자 간 일정별 교섭내용과 그 입증자료를 말합니다)\n"
          "2. 기타 분쟁조정신청사건의 심사ㆍ조정에 참고가 될 수 있는 객관적인 자료")
PAPER = "210mm×297mm[백상지80g/㎡ 또는 중질지80g/㎡]"


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


GX = Gx(91, 1092)
X1, X2 = 91, 1092
XL = 197                     # 신청인 · 피신청인 이름 칸 오른쪽 세로줄
XM = 739                     # 가운데 세로줄


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


SUBN = {"kind": "free", "size": 8.5, "align": "left", "valign": "top"}
BOXN = {"kind": "free", "size": 9, "align": "left", "valign": "top"}
GL = {"kind": "cfree", "size": 10}
NB = {"border": False}
FB = {"kind": "free", "size": 8}


def inp(k, ex, **kw):
    kw.setdefault("size", 9)
    kw.setdefault("align", "left")
    return I(k, ex=_e(ex, k), **kw)


B0 = "IF(N({접수일})>0,{접수일},{신청서!신청일})"
B60, B120 = f"({B0}+60)", f"({B0}+120)"
SD, SDUE = "{조정안일}", "({조정안일}+15)"


def _kind_f():
    f = '""'
    for k, t in reversed(list(zip(KINDS, KT))):
        f = 'IF({분쟁종류}="' + k + '","' + t + '",' + f + ')'
    return "=" + f


BIN = [("신청인 성명(대표자)", '{신청서!대표자}=""'), ("신청인 생년월일(법인등록번호)", '{신청서!생년월일}=""'),
       ("신청인 전화번호", '{신청서!전화번호}=""'), ("신청인 주소", '{신청서!신청주소}=""'),
       ("피신청인 성명(대표자)", '{신청서!피성명}=""'), ("피신청인 영업소 소재지", '{신청서!피소재지}=""'),
       ("조정을 받고자 하는 사항", '{신청서!조정사항}=""'), ("분쟁 사유 · 교섭경과 개요", '{신청서!분쟁개요}=""'),
       ("분쟁 종류(① 장)", '{분쟁종류}=""')]


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  건설분쟁 조정 — 분쟁 종류 · 처리 기한 · 수수료 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 건설업 및 건설용역업에 관한 분쟁은 국토교통부 건설분쟁 조정위원회에 서면(전자문서 포함)으로 조정을 신청합니다"
              "(건설산업기본법 제69조 · 시행령 제66조 · 시행규칙 제35조).")
    s7 = {"kind": "text", "size": 7}
    sz = {"kind": "text", "size": 7.5}
    g.sec(p, "㉮  분쟁 종류 (법 제69조제3항 · 시행령 제65조)", need=24 + 46 + 40 + 10)
    p.row([(3, "분쟁 종류", L), (5, I("분쟁종류", ex=_ex(ex, "분쟁종류"), dv=",".join(KINDS), align="left", size=9)),
           (4, "목록에서 고르면 아래에 조정 대상 법 글이 나옵니다", s7)], h=24)
    p.row([(3, "조정 대상", L), (9, F("대상", _kind_f(), align="left", size=8.5))], h=46)
    p.row([(3, "", L), (9, GEOBU, sz)])
    g.sec(p, "㉯  처리 기한 · 조정안 수락 (법 제74조 · 제78조)", need=24 * 2 + 58 + 46 * 2 + 10)
    p.row([(3, "위원회 접수일", L), (5, I("접수일", ex=_ex(ex, "접수일"), fmt=DT, align="center", size=9)),
           (4, "위원회가 신청을 받은 날 — 비우면 신청서의 신청일로 셈", s7)], h=24)
    f = ('=IF(AND(N({접수일})=0,N({신청서!신청일})=0),"","' + CH_A + '"&' + _ymdf(B0) + '&IF(N({접수일})>0,"","' + CH_N + '")'
         + '&"' + CH_B + '"&' + _ymdf(B60) + '&"("&' + _yo(B60) + '&")' + CH_C + '"&' + _ymdf(B120) + '&"("&' + _yo(B120)
         + '&")' + CH_D + '")')
    p.row([(3, "처리 기한", L), (9, F("처리기한", f, align="left", size=8.5))], h=58)
    p.row([(3, "조정안 받은 날", L), (5, I("조정안일", ex=_ex(ex, "조정안일"), fmt=DT, align="center", size=9)),
           (4, "위원회가 제시한 조정안을 받은 날", s7)], h=24)
    f = ('=IF(N({조정안일})=0,"","' + SR_A + '"&' + _ymdf(SD) + '&"' + SR_B + '"&' + _ymdf(SDUE) + '&"("&' + _yo(SDUE) + '&")' + SR_C + '"'
         + '&IF(WEEKDAY(' + SDUE + ')=7,"' + SR_SAT + '",IF(WEEKDAY(' + SDUE + ')=1,"' + SR_SUN + '","")))')
    p.row([(3, "수락 통보 기한", L), (9, F("수락기한", f, align="left", size=8.5))], h=46)
    p.row([(3, "", L), (9, HYO, sz)])
    g.sec(p, "㉰  수수료 · 비용 · 붙일 서류 · 아직 안 적은 칸", need=24 + 46 * 3 + 10)
    p.row([(3, "수수료", L), (9, SUSU, sz)], h=24)
    p.row([(3, "감정 등 비용", L), (9, BIYONG, sz)])
    p.row([(3, "붙일 서류", L), (9, SEORYU, sz)])
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({신청서!대표자}="",{신청서!피성명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst
                 + ',4,300)))', align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 분쟁 종류는 목록에서 고릅니다. 위원회 접수일을 비우면 신청서의 신청일로 셈합니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


# ── 신청서 ──────────────────────────────────────────────────────────────
def form(bk, ex):
    from openpyxl.styles import PatternFill, Side
    p = g.pg(bk, ex, "신청서", fit=1, widths=WP)
    med = Side(style="medium", color="000000")
    gry = Side(style="thin", color="ACACAC")
    gyl = Side(style="thin", color="A4A4A4")
    mid = Side(style="thin", color="747474")
    wht = Side(style="thin", color="FFFFFF")
    dkl = Side(style="medium", color="666666")
    btm = Side(style="thin", color="666666")
    gray = PatternFill("solid", fgColor="BBBBBB")
    band = {"kind": "free", "size": 8, "align": "left", "valign": "top", "fill": gray}
    prow(p, [(X1, X2, HEAD, {"kind": "free", "size": 8})], h=14)
    p.gap(4)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 16, "bold": True, "align": "center"})], h=34)
    p.gap(8)
    rj = prow(p, [(X1, 341, "접수번호", band), (341, 739, "접수일자", band), (739, 860, "처리기간", band), (860, X2, "60일", band)], h=24)
    _bd(p, rj, rj, X1, 341, top=False, bot=False, left=False, side=wht)       # 세로줄은 오른쪽 칸의 왼쪽 테에도(합친 칸 오른쪽 테만으로는 안 그려짐)
    _bd(p, rj, rj, 341, 739, top=False, bot=False, side=wht)
    _bd(p, rj, rj, 739, 860, top=False, bot=False, right=False, side=wht)
    p.gap(11)

    def pair(lab1, k1, lab2, k2, h2=17):
        """칸 안 위쪽 작은 이름 둘(가운데 세로줄) + 아래 적는 칸 둘"""
        ra = prow(p, [(XL, XM, lab1, SUBN), (XM, X2, lab2, SUBN)], h=14)
        rb = prow(p, [(XL, XM, inp(k1, ex), NB), (XM, X2, inp(k2, ex), NB)], h=h2)
        _bd(p, ra, rb, XL, XM, top=False, bot=False, left=False, side=mid)
        _bd(p, ra, rb, XM, X2, top=False, bot=False, right=False, side=mid)
        return rb

    def one(lab, k, h2=17):
        prow(p, [(XL, X2, lab, SUBN)], h=14)
        return prow(p, [(XL, X2, inp(k, ex, wrap=True), NB)], h=h2)

    def line(r):
        _bd(p, r, r, XL, X2, top=False, left=False, right=False, side=gry)

    # 신청인
    g1 = p.r
    prow(p, [(X1, XL, "신청인", dict(GL, rs=6)), (XL, XM, "성명(대표자)", SUBN), (XM, X2, "생년월일(법인등록번호)", SUBN)], h=14)
    ra = prow(p, [(XL, XM, inp("대표자", ex), NB), (XM, X2, inp("생년월일", ex), NB)], h=17)
    _bd(p, g1, ra, XL, XM, top=False, bot=False, left=False, side=mid)
    _bd(p, g1, ra, XM, X2, top=False, bot=False, right=False, side=mid)
    line(ra)
    line(pair("상호(법인명)", "상호", "전화번호", "전화번호"))
    last = one("주소", "신청주소")
    _bd(p, g1, last, X1, XL, top=False, bot=False, left=False, side=gyl)
    _bd(p, g1, last, XL, X2, top=False, bot=False, right=False, side=gyl)
    _bd(p, g1, g1, X1, X2, bot=False, left=False, right=False, side=med)
    _bd(p, last, last, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(11)
    # 피신청인
    g2 = p.r
    prow(p, [(X1, XL, "피신청인", dict(GL, rs=8)), (XL, X2, "성명(대표자)", SUBN)], h=14)
    ra = prow(p, [(XL, X2, inp("피성명", ex), NB)], h=17)
    line(ra)
    line(pair("상호(법인명)", "피상호", "전화번호", "피전화"))
    line(pair("업종", "피업종", "사업자등록번호", "피사업자번호", h2=19))
    last = one("영업소소재지", "피소재지")
    _bd(p, g2, last, X1, XL, top=False, bot=False, left=False, side=gyl)
    _bd(p, g2, last, XL, X2, top=False, bot=False, right=False, side=gyl)
    _bd(p, g2, g2, X1, X2, bot=False, left=False, right=False, side=med)
    _bd(p, last, last, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(7)
    # 조정을 받고자 하는 사항 · 분쟁 개요
    r1 = prow(p, [(X1, X2, "조정을 받고자 하는 사항", BOXN)], h=15)
    r2 = prow(p, [(X1, X2, inp("조정사항", ex, wrap=True), NB)], h=30)
    _bd(p, r1, r2, X1, X2, left=False, right=False)
    r1 = prow(p, [(X1, X2, "분쟁이 발생하게 된 사유와 당사자 간 교섭경과의 개요", BOXN)], h=15)
    r2 = prow(p, [(X1, X2, inp("분쟁개요", ex, wrap=True), NB)], h=30)
    _bd(p, r1, r2, X1, X2, top=False, left=False, right=False)
    p.gap(8)
    n = text_lines(STATEMENT, sum(WP) * 10.0 / 9.5)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 9.5})], h=max(30, n * 9.5 * 1.45 + 4))
    p.gap(8)
    prow(p, [(X1, X2, inp("신청일", ex, blank="년          월          일", fmt="date", align="right", size=9.5), NB)], h=20)
    p.gap(8)
    sinf = '=IF(AND({상호}="",{대표자}=""),"",IF({상호}="",{대표자},IF({대표자}="",{상호},{상호}&" "&{대표자})))'
    prow(p, [(X1, 500, "", FB), (500, 600, "신청인", {"kind": "free", "size": 9.5, "align": "center"}),
             (600, 930, F("신청인표시", sinf, align="center", size=8.5), NB),
             (930, X2, "(서명 또는 인)", {"kind": "free", "size": 8, "align": "right"})], h=22)
    p.gap(10)
    prow(p, [(X1, 335, "국토교통부장관", {"kind": "free", "size": 11.5, "bold": True, "align": "right"}),
             (335, 440, "귀하", {"kind": "free", "size": 9.5, "align": "center"}), (440, X2, "", FB)], h=24)
    p.gap(6)
    r = prow(p, [(X1, X2, "", FB)], h=4)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=dkl)
    p.gap(30)
    a, b = GX.cols(214, 873)
    na_ = text_lines(ATTACH, sum(WP[a - 1:b]) * 10.0 / 8)
    ra = prow(p, [(X1, 214, "첨부서류", {"kind": "free", "size": 8.5, "align": "center"}),
                  (214, 873, ATTACH, {"kind": "free", "size": 8, "valign": "center"}),
                  (873, X2, "수수료\n별표 5제3호의 수수료", {"kind": "free", "size": 8.5, "align": "center"})], h=max(52, na_ * 8 * 1.45 + 12))
    _bd(p, ra, ra, X1, X2, left=False, right=False)
    _bd(p, ra, ra, X1, 214, top=False, bot=False, left=False)
    _bd(p, ra, ra, 873, X2, top=False, bot=False, right=False)
    p.gap(6)
    rp = prow(p, [(X1, X2, "처 리 절 차", {"kind": "free", "size": 9, "bold": True, "align": "center", "fill": gray})], h=16)
    _bd(p, rp, rp, X1, X2, bot=False, left=False, right=False, side=med)
    p.gap(7)
    E = [(91, 259), (303, 473), (512, 670), (712, 876), (921, 1092)]
    steps = ["신청서 작성", "접 수", "분쟁조정 신청의\n통지(상대방)", "조사 및 의견청취", "조정전 합의 또는\n조정"]
    who = ["신청인"] + ["처 리 기 관\n(분쟁조정위원회)"] * 4
    bx = {"kind": "ctext", "size": 8}
    arr = {"kind": "cfree", "size": 9}
    items = []
    for j, (x1, x2) in enumerate(E):
        items.append((x1, x2, steps[j], bx))
        if j < 4:
            items.append((x2, E[j + 1][0], "➔", arr))
    prow(p, items, h=30)
    items = []
    for j, (x1, x2) in enumerate(E):
        items.append((x1, x2, who[j], {"kind": "cfree", "size": 7.5}))
        if j < 4:
            items.append((x2, E[j + 1][0], "", FB))
    prow(p, items, h=28)
    r = prow(p, [(X1, X2, "", FB)], h=8)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=btm)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 7, "align": "right"})], h=14)
    p.end_print()
    p.after_note(["신청일은 오늘 날짜로 먼저 들어갑니다. 신청인 칸에는 공통 정보(상호 · 대표자 · 전화번호)가 있으면 먼저 들어갑니다. "
                  "분쟁 종류 · 처리 기한 · 수수료는 ① 장에서 봅니다."]
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


YO = "월화수목금토일"


def expect(pages):
    sm, sg = pages["셈"], pages["신청서"]
    a, b = {}, {}
    k = sm.get("분쟁종류")
    a["대상"] = KT[KINDS.index(k)] if k in KINDS else ""
    jd, sd = _d(sm.get("접수일")), _d(sg.get("신청일"))
    base = jd or sd
    if not base:
        a["처리기한"] = ""
    else:
        d60, d120 = base + datetime.timedelta(days=60), base + datetime.timedelta(days=120)
        a["처리기한"] = (f"{CH_A}{_ymd(base)}{'' if jd else CH_N}{CH_B}{_ymd(d60)}({YO[d60.weekday()]}){CH_C}"
                        f"{_ymd(d120)}({YO[d120.weekday()]}){CH_D}")
    qd = _d(sm.get("조정안일"))
    if not qd:
        a["수락기한"] = ""
    else:
        due = qd + datetime.timedelta(days=15)
        t = f"{SR_A}{_ymd(qd)}{SR_B}{_ymd(due)}({YO[due.weekday()]}){SR_C}"
        t += SR_SAT if due.weekday() == 5 else (SR_SUN if due.weekday() == 6 else "")
        a["수락기한"] = t
    if not sg.get("대표자") and not sg.get("피성명"):
        a["빈칸"] = ""
    else:
        mc = {"신청인 성명(대표자)": not sg.get("대표자"), "신청인 생년월일(법인등록번호)": not sg.get("생년월일"),
              "신청인 전화번호": not sg.get("전화번호"), "신청인 주소": not sg.get("신청주소"),
              "피신청인 성명(대표자)": not sg.get("피성명"), "피신청인 영업소 소재지": not sg.get("피소재지"),
              "조정을 받고자 하는 사항": not sg.get("조정사항"), "분쟁 사유 · 교섭경과 개요": not sg.get("분쟁개요"),
              "분쟁 종류(① 장)": not k}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    sh, dp = sg.get("상호") or "", sg.get("대표자") or ""
    b["신청인표시"] = "" if not (sh or dp) else (dp if not sh else (sh if not dp else f"{sh} {dp}"))
    return {"셈": a, "신청서": b}


for _t in KT + [GEOBU, CH_A, CH_N, CH_B, CH_C, CH_D, SR_A, SR_B, SR_C, SR_SAT, SR_SUN, BIN_OK, BIN_A]:
    assert len(_t) < 255 and '"' not in _t, _t[:40]
assert len(",".join(KINDS)) < 250
