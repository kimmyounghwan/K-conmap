# -*- coding: utf-8 -*-
"""소방시설공사현황 표지 — 새로 만든 서식 (2026-11-16 G718 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 공사기간(착공일 · 준공일 → 표지 «년 월 일부터 년 월 일까지» · 일수) · 건축물 규모(지하 · 지상 · 대지 · 건축 · 연면적 → «다.» 한 줄) ·
     소방시설공사업자 · 소방공사감리자 상호와 대표자(→ «업체명(대표자)») · 아직 안 적은 칸
   · 표지(소방시설공사업법 시행규칙 [별지 제16호서식] <개정 2016. 1. 21.> 칸 차례 그대로 — 원문 400mm×600mm 를 A4 세로 한 쪽에).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — 바깥 테 x 120~1118.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G718_소방공사현황표지_원문.txt — 글층 해시 같음 확인):
  · 소방시설공사업법 시행규칙 [시행 2026. 10. 20.] 제12조(착공신고 등) ⑤ 소방본부장 또는 소방서장은 착공신고 또는 변경신고를 받은 경우
    공사업자에게 별지 제16호서식의 소방시설공사현황 표지에 따른 소방시설공사현황의 게시를 요청할 수 있다 · ④ 신고는 2일 이내 처리
■ 짐작 안 함: «마. 소방시설» 여섯 칸은 원문 이름 그대로(원문 «피난설비») · 무엇을 적을지는 설계도서대로(셈하지 않음) ·
  «○○○소방서» 칸에는 «소방서» 앞 이름만 · 원문 바깥 굵은 테는 굵은 선(medium) 하나로."""
import datetime

import sgw as g
from fb import F, I

SLUG = "sobang-gongsa-pyoji"
TITLE = "소방시설공사현황 표지"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "소방시설공사현황 표지(소방시설공사업법 시행규칙 별지 제16호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "소방시설공사현황 표지 — 작성 예시 (공사기간 · 건축물 규모 · 업체명이 ① 장에서 저절로)"),
        (3, "① 공사기간 · 건축물 규모 · 업체 — 작성 예시")]
MULTI = True
SHORT = ("소방시설공사현황 표지(소방시설공사업법 시행규칙 별지 제16호서식) — 착공일 · 준공일 · 건축물 규모 · 업체를 적으면 "
         "표지의 공사기간 · 규모 · 업체명(대표자) 줄이 채워지고 아직 안 적은 칸을 알려 줍니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
GE_A = "⚠ 준공일이 착공일보다 앞섭니다"
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
KB = "     년     월     일부터"
KE = "     년     월     일까지"
PH = "○○○"
YG = ("소방본부장 또는 소방서장은 착공신고 · 변경신고를 받으면 공사업자에게 이 표지에 따른 소방시설공사현황 게시를 요청할 수 있습니다"
      "(소방시설공사업법 시행규칙 제12조⑤). 원문 크기 400mm×600mm · 철판 또는 아크릴 · 흰색 바탕에 검정색 글씨.")
SB = [("소화설비", "소화용수설비"), ("경보설비", "소화활동설비"), ("피난설비", "그 밖의 설비")]


def _k(lab):
    """칸 이름(띄어쓰기 뺌) — «그 밖의 설비» → «그밖의설비»"""
    return lab.replace(" ", "")

EX = {"착공일": D(2027, 3, 2), "준공일": D(2027, 12, 31), "지하": 2, "지상": 11, "대지면적": 2400, "건축면적": 1150.5, "연면적": 12500,
      "상호": "다라소방(주)", "대표자": "최지훈", "감리상호": "마바소방(주)", "감리대표": "서다온"}
EX_S = {"시도": "가나도", "소방서": "다라", "신고번호": "2027-0123", "공사명": "가나빌딩 신축공사 중 소방시설공사", "현장소재지": "가나도 다라시 마바로 45",
        "주요용도": "업무시설",
        "소화설비": "소화기구 · 옥내소화전설비 · 스프링클러설비", "소화용수설비": "상수도소화용수설비",
        "경보설비": "자동화재탐지설비 · 비상방송설비", "소화활동설비": "제연설비 · 연결송수관설비 · 비상콘센트설비",
        "피난설비": "피난기구 · 유도등 · 비상조명등", "그밖의설비": "",
        "공사등록번호": "0000-00", "책임시공기술자": "한도윤", "전화번호": "000-000-0000",
        "감리등록번호": "0000-00", "감리원": "정민호", "감리전화": "000-000-0000"}
HEAD = "■ 소방시설공사업법 시행규칙 [별지 제16호서식] <개정 2016. 1. 21.>"
PAPER = "400mm×600mm[철판 또는 아크릴, 흰색 바탕에 검정색 글씨]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _t(x):
    """면적 글자로: 정수면 2,400 · 소수면 1,150.5 (엑셀 TEXT 의 «2,400.» 끝점 피하기 — f_jajae_subulbu._t 와 같은 꼴)"""
    return f'IF({x}=INT({x}),TEXT({x},"#,##0"),TEXT({x},"#,##0.##"))'


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(120, 1118)
X1, X2 = 120, 1118


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


def _bd(p, r1, r2, x1, x2):
    """칸 묶음 바깥 테(가는 선) — 안쪽 칸 테는 지움"""
    from openpyxl.styles import Border
    from fb import LINE
    c1, c2 = GX.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            p.ws.cell(row=r, column=c).border = Border(left=LINE if c == c1 else None, right=LINE if c == c2 else None,
                                                       top=LINE if r == r1 else None, bottom=LINE if r == r2 else None)


def _box(p, r1, r2):
    """표지 바깥 굵은 테 — 가장자리 칸만 바꾸고 안쪽 표 테는 그대로"""
    from openpyxl.styles import Border, Side
    sd = Side(style="medium", color="000000")
    for r in range(r1, r2 + 1):
        for c in range(1, NC + 1):
            if r not in (r1, r2) and c not in (1, NC):
                continue
            b = p.ws.cell(row=r, column=c).border
            p.ws.cell(row=r, column=c).border = Border(left=sd if c == 1 else b.left, right=sd if c == NC else b.right,
                                                       top=sd if r == r1 else b.top, bottom=sd if r == r2 else b.bottom)


T10 = {"kind": "free", "size": 10}
TB = {"kind": "free", "size": 10.5, "bold": True}
CT = {"kind": "ctext", "size": 9.5}
NB = {"border": False}
E0 = {"kind": "free", "size": 6}


def inp(k, ex, **kw):
    kw.setdefault("size", 10)
    return I(k, ex=_e(ex, k), **kw)


GS, GE = "{셈!착공일}", "{셈!준공일}"


def _firm_name(a, b):
    """업체명(대표자) — 상호 (대표자)"""
    return f'=IF(AND({a}="",{b}=""),"",IF({a}="","("&{b}&")",{a}&IF({b}="",""," ("&{b}&")")))'


BIN = [("공사명", '{표지!공사명}=""'), ("소재지", '{표지!현장소재지}=""'),
       ("신고 번호", f'OR({{표지!신고번호}}="",{{표지!신고번호}}="{PH}")'),
       ("소방시설공사업자 상호", '{상호}=""'), ("소방공사감리자 상호", '{감리상호}=""'),
       ("공사기간", "OR(N({착공일})=0,N({준공일})=0)")]


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  소방시설공사현황 표지 — 공사기간 · 건축물 규모 · 업체 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ " + YG)
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  공사기간 (→ 표지 «4. 공사기간»)", need=24 * 3 + 10)
    for k, lab in (("착공일", "착공일"), ("준공일", "준공일")):
        p.row([(3, lab, g.L), (5, I(k, ex=EX[k] if ex else None, fmt=DT, align="center", size=9)), (4, "", s7)], h=22)
    p.row([(3, "공사기간", g.L),
           (9, F("기간", '=IF(OR(N({착공일})=0,N({준공일})=0),"",IF({착공일}>{준공일},"' + GE_A + '","✓ 공사기간 "&({준공일}-{착공일}+1)&"일"))',
                 align="left", size=8.5))], h=22)
    g.sec(p, "㉯  건축물 규모 (→ 표지 «다. 건축물규모»)", need=24 * 5 + 10)
    for k, lab, fmt in (("지하", "지하 층수", '0"층";;""'), ("지상", "지상 층수", '0"층";;""'), ("대지면적", "대지면적(㎡)", '#,##0.00" ㎡";;""'),
                        ("건축면적", "건축면적(㎡)", '#,##0.00" ㎡";;""'), ("연면적", "연면적(㎡)", '#,##0.00" ㎡";;""')):
        p.row([(3, lab, g.L), (5, I(k, ex=EX[k] if ex else None, fmt=fmt, align="center", size=9)), (4, "", s7)], h=22)
    g.sec(p, "㉰  업체 (→ 표지 «업체명(대표자)»)", need=24 * 4 + 10)
    for k, lab in (("상호", "소방시설공사업자 상호"), ("대표자", "공사업자 대표자"), ("감리상호", "소방공사감리자 상호"), ("감리대표", "감리자 대표자")):
        p.row([(3, lab, g.L), (6, I(k, ex=EX[k] if ex else None, align="left", size=9)), (3, "", s7)], h=22)
    g.sec(p, "㉱  아직 안 적은 칸", need=40 + 10)
    c2 = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({표지!공사명}="",{상호}=""),"",IF(' + c2 + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=40)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 표지의 공사기간 · 건축물 규모 · 업체명(대표자)은 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


def _gap(p, h):
    return prow(p, [(X1, X2, "", E0)], h=h)


def _sec(p, txt, h=25):
    return prow(p, [(X1, 138, "", E0), (138, 700, txt, TB), (700, X2, "", E0)], h=h)


def _table(p, ex, rows, x0):
    """표(가는 선) — rows = [(왼 이름, 왼 값, 오른 이름, 오른 값)] · 값은 (key 또는 F)"""
    r0 = None
    for a, va, b, vb in rows:
        r = prow(p, [(X1, x0, "", E0)] + a + va + b + vb + [(1109, X2, "", E0)], h=30)
        r0 = r if r0 is None else r0
    return r0, r


# ── 표지 ────────────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "표지", fit=1, widths=WP)
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7})], h=13)
    rt = _gap(p, 8)
    prow(p, [(X1, 151, "", E0), (151, 240, inp("시도", ex, blank="시ㆍ도", align="left", size=10), NB),
             (240, 330, inp("소방서", ex, blank=PH, align="right", size=10), NB), (330, 410, "소방서", T10),
             (410, 465, "신고", T10), (465, 505, "제", {"kind": "free", "size": 10, "align": "right"}),
             (505, 640, inp("신고번호", ex, blank=PH, align="center", size=10), NB), (640, 680, "호", T10), (680, X2, "", E0)], h=19)
    _gap(p, 10)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 19, "bold": True, "align": "center"})], h=26)
    _gap(p, 34)
    _sec(p, "1.  공사개요")
    for lab, key in (("가.  공사명  :", "공사명"), ("나.  소재지  :", "현장소재지")):
        prow(p, [(X1, 159, "", E0), (159, 330, lab, T10), (330, 1100, inp(key, ex, align="left"), NB), (1100, X2, "", E0)], h=25)
    s = "{셈!"
    gm = ('="지하 "&IF(N(' + s + '지하})=0,"   ",' + s + '지하})&"층/지상 "&IF(N(' + s + '지상})=0,"   ",' + s + '지상})&"층, 대지면적 "&IF(N('
          + s + '대지면적})=0,"      ",' + _t(s + "대지면적}") + ')&"㎡, 건축면적 "&IF(N(' + s + '건축면적})=0,"      ",' + _t(s + "건축면적}")
          + ')&"㎡, 연면적 "&IF(N(' + s + '연면적})=0,"      ",' + _t(s + "연면적}") + ')&"㎡"')
    prow(p, [(X1, 159, "", E0), (159, 350, "다. 건축물규모 :", T10), (350, 1109, F("규모", gm, align="left", size=9), NB), (1109, X2, "", E0)], h=32)   # 칸넘침점검 — 큰 면적이면 두 줄
    prow(p, [(X1, 159, "", E0), (159, 350, "라.  주요용도  :", T10), (350, 1100, inp("주요용도", ex, align="left"), NB), (1100, X2, "", E0)], h=25)
    prow(p, [(X1, 159, "", E0), (159, 700, "마.  소방시설", T10), (700, X2, "", E0)], h=25)
    _gap(p, 8)
    _table(p, ex, [([(200, 358, a, CT)], [(358, 640, inp(_k(a), ex, align="left", size=8.5), {})], [(640, 827, b, CT)],
                    [(827, 1109, inp(_k(b), ex, align="left", size=8.5), {})]) for a, b in SB], 200)
    _gap(p, 34)
    _sec(p, "2.  소방시설공사업자")
    _gap(p, 8)
    _firm_table(p, ex, "공사", "{셈!상호}", "{셈!대표자}", "책임시공기술자", "책임시공기술자", "전화번호")
    _gap(p, 35)
    _sec(p, "3.  소방공사감리자")
    _gap(p, 8)
    _firm_table(p, ex, "감리", "{셈!감리상호}", "{셈!감리대표}", "소방공사감리원", "감리원", "감리전화")
    _gap(p, 35)
    kk = ('=IF(N(' + GS + ')=0,"' + KB + '",' + _ymdf(GS) + '&"부터")&"          "&IF(N(' + GE + ')=0,"' + KE + '",' + _ymdf(GE) + '&"까지")')
    prow(p, [(X1, 138, "", E0), (138, 330, "4.  공사기간  :", TB), (330, 1100, F("공사기간", kk, align="left", size=10), NB), (1100, X2, "", E0)], h=25)
    rb = _gap(p, 28)
    _box(p, rt, rb)
    p.gap(4)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["공사기간 · 건축물 규모 · 업체명(대표자)은 ① 장에서 들어옵니다. «○○○소방서» 칸에는 «소방서» 앞 이름만 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


def _firm_table(p, ex, pre, a, b, lab2, key2, tel):
    ra = prow(p, [(X1, 170, "", E0), (170, 358, "업체명(대표자)", CT), (358, 651, F(f"{pre}업체", _firm_name(a, b), align="left", size=9), {}),
                  (651, 810, "등록번호", CT), (810, 870, "제", {"kind": "free", "size": 9.5, "align": "right"}),
                  (870, 1045, inp(f"{pre}등록번호", ex, align="center", size=9), NB), (1045, 1109, "  호", {"kind": "free", "size": 9.5}),
                  (1109, X2, "", E0)], h=30)
    _bd(p, ra, ra, 810, 1109)
    prow(p, [(X1, 170, "", E0), (170, 358, lab2, CT), (358, 651, inp(key2, ex, align="left", size=9), {}), (651, 810, "전화번호", CT),
             (810, 1109, inp(tel, ex, align="center", size=9), {}), (1109, X2, "", E0)], h=30)


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


def _num(x):
    if float(x).is_integer():
        return f"{int(x):,}"
    return f"{x:,.2f}".rstrip("0").rstrip(".")


def _gen(x):
    return str(int(x)) if float(x).is_integer() else repr(float(x))


def _fn(a, b):
    a, b = a or "", b or ""
    if not a and not b:
        return ""
    if not a:
        return f"({b})"
    return a + ("" if not b else f" ({b})")


def expect(pages):
    a_in, s_in = pages["셈"], pages["표지"]
    a, o = {}, {}
    gs, ge = _d(a_in.get("착공일")), _d(a_in.get("준공일"))
    a["기간"] = "" if not (gs and ge) else (GE_A if gs > ge else f"✓ 공사기간 {(ge - gs).days + 1}일")
    if not s_in.get("공사명") and not a_in.get("상호"):
        a["빈칸"] = ""
    else:
        sh = s_in.get("신고번호")
        mc = {"공사명": not s_in.get("공사명"), "소재지": not s_in.get("현장소재지"), "신고 번호": (not sh) or sh == PH,
              "소방시설공사업자 상호": not a_in.get("상호"), "소방공사감리자 상호": not a_in.get("감리상호"), "공사기간": not (gs and ge)}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    v = {k: _n(a_in.get(k)) for k in ("지하", "지상", "대지면적", "건축면적", "연면적")}
    o["규모"] = ("지하 " + (_gen(v["지하"]) if v["지하"] else "   ") + "층/지상 " + (_gen(v["지상"]) if v["지상"] else "   ") + "층, 대지면적 "
               + (_num(v["대지면적"]) if v["대지면적"] else "      ") + "㎡, 건축면적 " + (_num(v["건축면적"]) if v["건축면적"] else "      ")
               + "㎡, 연면적 " + (_num(v["연면적"]) if v["연면적"] else "      ") + "㎡")
    o["공사업체"] = _fn(a_in.get("상호"), a_in.get("대표자"))
    o["감리업체"] = _fn(a_in.get("감리상호"), a_in.get("감리대표"))
    o["공사기간"] = ((_ymd(gs) + "부터") if gs else KB) + "          " + ((_ymd(ge) + "까지") if ge else KE)
    return {"셈": a, "표지": o}


for _t_ in (GE_A, BIN_OK, BIN_A, KB, KE, PH):
    assert len(_t_) < 255 and '"' not in _t_, _t_[:40]
