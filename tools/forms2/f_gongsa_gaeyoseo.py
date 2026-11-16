# -*- coding: utf-8 -*-
"""공사 개요서 — 새로 만든 서식 (2026-11-16 G713 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 착공일 · 준공일(→ 개요서 «공사기간» 저절로) · 유해위험방지계획서 제출 기한(규칙 제42조제3항 — 착공 전날까지 공단에 2부) ·
     공사개요 표의 최고높이 · 굴착깊이 최대값(영 제42조제3항 제1호가목 31m · 제6호 10m 대조) · 함께 붙일 서류(규칙 별표 10 제1호) · 아직 안 적은 칸
   · 개요서(산업안전보건법 시행규칙 [별지 제101호서식] 칸 차례 그대로 — 세로 한 쪽).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1121.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G713_공사개요서_원문.txt — 글층 해시 같음 확인):
  · 산업안전보건법 시행규칙 [시행 2026. 8. 1.] 제42조제3항(건설공사 유해위험방지계획서 별지 제17호서식 + 별표 10 서류 · 착공 전날까지 공단에 2부 —
    착공 = 대상 시설물 · 구조물 공사 시작, 대지 정리 · 가설사무소 설치 등 준비기간은 착공 아님) · [별표 10] <개정 2021. 11. 19.> 제1호 가~바(가. 공사 개요서 별지 제101호서식)
  · 시행령 제42조제3항(제1호가목 지상높이 31m 이상 · 제6호 깊이 10m 이상 굴착 — G708 과 같은 조문)
■ 짐작 안 함: 공사개요 표의 «최고높이»를 지상높이로 보고 31m 와 견줌(글로 밝힘) · 연면적 · 지간 · 터널 · 댐 등 다른 기준은 이 서식에 없어 «따로 봄» 글로만 ·
  원문 공사개요 · 그 밖의 특수구조물 칸은 줄 사이 가로선 없음(원문 그대로) · «주요 공법» · «폴리우레탄 폼 및 주요 마감재 사용 현황» 은 원문 세로줄이 이어지나
  글을 이어 적도록 한 칸으로 합침(뒤 안내에 밝힘)."""
import datetime

import sgw as g
from fb import F, I, text_lines

SLUG = "gongsa-gaeyoseo"
TITLE = "공사 개요서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "공사 개요서(산업안전보건법 시행규칙 별지 제101호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "공사 개요서 — 작성 예시 (공사기간이 ① 장에서 저절로)"),
        (3, "① 공사기간 · 유해위험방지계획서 제출 기한 · 최고높이 · 굴착깊이 — 작성 예시")]
MULTI = True
SHORT = ("공사 개요서(산업안전보건법 시행규칙 별지 제101호서식 — 유해위험방지계획서 첨부) — 착공일 · 준공일을 적으면 «공사기간»과 제출 기한(착공 전날)이, "
         "공사개요 표를 적으면 최고높이 · 굴착깊이(31m · 10m 기준)가 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
WON = '#,##0"원";;""'
NUM = '0.0#;;""'
INT = '#,##0;;""'
YOIL = "일월화수목금토"
NR = 6
NS = 3

GH_A = "유해위험방지계획서(별지 제17호서식)에 이 개요서를 붙여 착공 전날 "
GH_B = "까지 안전보건공단에 2부(규칙 제42조제3항) — 착공은 대상 시설물 · 구조물 공사를 시작하는 날(대지 정리 · 가설사무소 설치 등 준비기간은 착공 아님)"
GH_SAT = " · ⚠ 토요일이라 그 전 평일에 내면 안전합니다"
GH_SUN = " · ⚠ 일요일이라 그 전 평일에 내면 안전합니다"
GH_BAD = " · ⚠ 준공일이 착공일보다 앞섭니다"
GH_NEED = "⚠ 착공일을 적으면 제출 기한(착공 전날)을 셉니다"
PJ_A = "최고높이 최대 "
PJ_B = "m · 굴착깊이 최대 "
PJ_C = "m"
PJ_H = " · ⚠ 31m 이상 — 유해위험방지계획서 제출 대상(영 제42조제3항제1호가목 · 지상높이 기준)"
PJ_D = " · ⚠ 굴착 10m 이상 — 제출 대상(같은 항 제6호)"
PJ_N = " · 높이 31m · 굴착 10m 아래 — 연면적 · 지간 · 터널 · 댐 등 다른 기준은 따로 봅니다"
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {"착공일": D(2027, 3, 3), "준공일": D(2028, 8, 31)}
EX_S = {"상호": "가나건설(주)", "전화번호": "000-000-0000", "대표자": "이가람", "본사소재지": "가나시 다라구 바사로 12",
        "공사명": "가나시 복합문화센터 신축공사", "현장소장": "정민호", "현장소재지": "가나시 마바구 사아동 45", "계약금액": 18500000000,
        "발주자": "가나시", "발주자전화": "000-000-0000", "설계자": "다라건축사사무소", "설계자전화": "000-000-0000",
        "감리자": "마바건축사사무소", "감리자전화": "000-000-0000",
        "구조물#1": "본관동(문화 · 집회시설)", "구조#1": "RC조", "개소#1": 1, "지하#1": 2, "지상#1": 9, "깊이#1": 11.5, "높이#1": 38.2,
        "구조물#2": "주차동", "구조#2": "SRC조", "개소#2": 1, "지하#2": 1, "지상#2": 3, "깊이#2": 6, "높이#2": 14.5,
        "특수구조#1": "흙막이(CIP)", "특수개소#1": 1, "특수깊이#1": 11.5, "특수비고#1": "지하 2층 굴착",
        "주요공법": "흙막이: CIP + 어스앵커 · 골조: 알루미늄폼 · 데크플레이트 · 양중: 타워크레인 2대",
        "마감재": "외벽 단열: 경질 폴리우레탄폼(준불연) · 지붕: 샌드위치패널(글라스울)"}
HEAD = "■ 산업안전보건법 시행규칙 [별지 제101호서식]"
PAPER = "210㎜×297㎜[일반용지 60g/㎡(재활용품)]"
ATT = ("※ 유해위험방지계획서에 함께 붙이는 서류(규칙 별표 10 제1호): 가. 공사 개요서(이 서식) 나. 공사현장의 주변 현황 및 주변과의 관계를 나타내는 도면"
       "(매설물 현황 포함) 다. 전체 공정표 라. 산업안전보건관리비 사용계획서(별지 제102호서식) 마. 안전관리 조직표 바. 재해 발생 위험 시 연락 및 대피방법 "
       "— 작업 공사 종류별 유해위험방지계획은 별표 10 제2호.")


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


GX = Gx(120, 1121)


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


LB = {"kind": "label", "size": 9.5}
LT = {"kind": "free", "size": 8.5, "align": "left"}
NB = {"border": False}
CT = {"kind": "ctext", "size": 9}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


SD, ED = "{착공일}", "{준공일}"
DUE = f"({SD}-1)"
HS = [f"{{개요서!높이#{i}}}" for i in range(1, NR + 1)] + [f"{{개요서!특수높이#{j}}}" for j in range(1, NS + 1)]
DS = [f"{{개요서!깊이#{i}}}" for i in range(1, NR + 1)] + [f"{{개요서!특수깊이#{j}}}" for j in range(1, NS + 1)]
MH = "MAX(" + ",".join(HS) + ")"
MD = "MAX(" + ",".join(DS) + ")"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  공사 개요서 — 공사기간 · 제출 기한 · 최고높이 · 굴착깊이 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 공사 개요서는 건설공사 유해위험방지계획서(별지 제17호서식)에 붙이는 첫 서류입니다(산업안전보건법 시행규칙 제42조제3항 · 별표 10 제1호가목). "
              "계획서는 착공 전날까지 안전보건공단에 2부를 냅니다.")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  공사기간 · 제출 기한 (규칙 제42조제3항)", need=26 * 4 + 10)
    p.row([(3, "착공일", g.L), (5, I("착공일", ex=EX["착공일"] if ex else None, fmt=DT, align="center", size=9)),
           (4, "대상 시설물 · 구조물 공사를 시작하는 날", s7)], h=24)
    p.row([(3, "준공일", g.L), (5, I("준공일", ex=EX["준공일"] if ex else None, fmt=DT, align="center", size=9)), (4, "", s7)], h=24)
    f = (f'=IF(N({SD})=0,IF(N({ED})>0,"{GH_NEED}",""),"{GH_A}"&' + _ymdf(DUE) + '&"("&' + _yo(DUE) + f'&")"&"{GH_B}"'
         f'&IF(WEEKDAY({DUE})=7,"{GH_SAT}",IF(WEEKDAY({DUE})=1,"{GH_SUN}",""))'
         f'&IF(AND(N({ED})>0,N({ED})<N({SD})),"{GH_BAD}",""))')
    p.row([(3, "제출 기한", g.L), (9, F("기한", f, align="left", size=8.5))], h=58)
    g.sec(p, "㉯  최고높이 · 굴착깊이 (공사개요 표 · 영 제42조제3항)", need=26 * 2 + 10)
    pj = (f'=IF(AND({MH}=0,{MD}=0),"","{PJ_A}"&{MH}&"{PJ_B}"&{MD}&"{PJ_C}"&IF({MH}>=31,"{PJ_H}","")&IF({MD}>=10,"{PJ_D}","")'
          f'&IF(AND({MH}<31,{MD}<10),"{PJ_N}",""))')
    p.row([(3, "높이 · 굴착", g.L), (9, F("판정", pj, align="left", size=8.5))], h=46)
    g.note(p, ATT)
    g.sec(p, "㉰  아직 안 적은 칸", need=26 * 2 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({개요서!상호}="",{개요서!공사명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=40)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 개요서의 «공사기간» 은 여기 착공일 · 준공일로 채워집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


BIN = [("회사명", '{개요서!상호}=""'), ("대표자", '{개요서!대표자}=""'), ("본사 소재지", '{개요서!본사소재지}=""'), ("현장명", '{개요서!공사명}=""'),
       ("현장 소재지", '{개요서!현장소재지}=""'), ("공사기간(① 장)", f'OR(N({SD})=0,N({ED})=0)'), ("공사금액", 'N({개요서!계약금액})=0'),
       ("발주자", '{개요서!발주자}=""'), ("공사개요(대상구조물)", "AND(" + ",".join(f'{{개요서!구조물#{i}}}=""' for i in range(1, NR + 1)) + ")"),
       ("주요 공법", '{개요서!주요공법}=""')]


# ── 개요서 ──────────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "개요서", fit=1, widths=WP)
    X1, X2 = 120, 1121
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(X1, X2, "공사 개요서", {"kind": "free", "size": 16, "bold": True, "align": "center"})], h=36)
    # 건설업체
    r = prow(p, [(X1, 287, "건설업체", dict(LB, rs=3)), (287, 380, "회사명", LT), (380, 787, inp("상호", ex, align="left"), NB),
                 (787, 880, "전화번호", LT), (880, X2, inp("전화번호", ex, align="left"), NB)], h=21)
    _bd(p, r, r, 287, 787)
    _bd(p, r, r, 787, X2)
    r = prow(p, [(287, 380, "대표자", LT), (380, X2, inp("대표자", ex, align="left"), NB)], h=21)
    _bd(p, r, r, 287, X2)
    r = prow(p, [(287, 400, "본사 소재지", LT), (400, X2, inp("본사소재지", ex, align="left"), NB)], h=21)
    _bd(p, r, r, 287, X2)
    p.gap(3)
    # 현장
    r = prow(p, [(X1, 287, "현장", dict(LB, rs=3)), (287, 380, "현장명", LT), (380, 787, inp("공사명", ex, align="left"), NB),
                 (787, 880, "현장소장", LT), (880, X2, inp("현장소장", ex, align="left"), NB)], h=21)
    _bd(p, r, r, 287, 787)
    _bd(p, r, r, 787, X2)
    r = prow(p, [(287, 400, "현장 소재지", LT), (400, X2, inp("현장소재지", ex, align="left"), NB)], h=21)
    _bd(p, r, r, 287, X2)
    kg = ('=IF(AND(N({셈!착공일})=0,N({셈!준공일})=0),"",IF(N({셈!착공일})=0,"",' + _ymdf("{셈!착공일}") + ')&" ~ "&'
          'IF(N({셈!준공일})=0,"",' + _ymdf("{셈!준공일}") + '))')
    r = prow(p, [(287, 380, "공사기간", LT), (380, 787, F("공사기간", kg, align="left", size=8.5), NB),
                 (787, 880, "공사금액", LT), (880, X2, inp("계약금액", ex, fmt=WON, align="left"), NB)], h=21)
    _bd(p, r, r, 287, 787)
    _bd(p, r, r, 787, X2)
    p.gap(3)
    # 발주자 · 설계자 · 감리자
    for lab, k in (("발주자", "발주자"), ("설계자", "설계자"), ("감리자", "감리자")):
        r = prow(p, [(X1, 287, lab, LB), (287, 350, "성명", LT), (350, 787, inp(k, ex, align="left"), NB),
                     (787, 880, "전화번호", LT), (880, X2, inp(f"{k}전화", ex, align="left"), NB)], h=21)
        _bd(p, r, r, 287, 787)
        _bd(p, r, r, 787, X2)
    p.gap(3)
    # 공사개요 표 — 머리 두 줄 + 적는 줄(원문처럼 줄 사이 가로선 없음)
    COLS = [(287, 505), (505, 599), (599, 698), (698, 771), (771, 844), (844, 940), (940, 1037), (1037, X2)]
    prow(p, [(X1, 287, "공사개요", dict(LB, rs=2 + NR)), (287, 505, "대상구조물", dict(CT, rs=2)), (505, 599, "구조", dict(CT, rs=2)),
             (599, 698, "개소", dict(CT, rs=2)), (698, 844, "층수", CT), (844, 940, "굴착깊이\n(m)", dict(CT, rs=2, size=8.5)),
             (940, 1037, "최고높이\n(m)", dict(CT, rs=2, size=8.5)), (1037, X2, "비고", dict(CT, rs=2))], h=18)
    prow(p, [(698, 771, "지하", CT), (771, 844, "지상", CT)], h=18)
    keys = ["구조물", "구조", "개소", "지하", "지상", "깊이", "높이", "비고"]
    fm = [None, None, INT, INT, INT, NUM, NUM, None]
    r0 = p.r
    for i in range(1, NR + 1):
        items = []
        for (x1, x2), k, f_ in zip(COLS, keys, fm):
            kw = {"fmt": f_} if f_ else {}
            al = "left" if k in ("구조물", "구조", "비고") else "center"
            items.append((x1, x2, inp(f"{k}#{i}", ex, align=al, size=7.5 if k == "구조" else 8, **kw), NB))
        prow(p, items, h=20)
    for x1, x2 in COLS:
        _bd(p, r0, p.r - 1, x1, x2)
    # 그 밖의 특수구조물 개요 — 대상구조물 칸까지 이름 · 나머지 칸은 원문처럼 이어짐
    skeys = ["특수구조", "특수개소", "특수지하", "특수지상", "특수깊이", "특수높이", "특수비고"]
    r0 = p.r
    for j in range(1, NS + 1):
        items = [(X1, 505, "그 밖의 특수구조물 개요", dict(CT, rs=NS, size=9.5))] if j == 1 else []
        for (x1, x2), k, f_ in zip(COLS[1:], skeys, fm[1:]):
            kw = {"fmt": f_} if f_ else {}
            al = "left" if k in ("특수구조", "특수비고") else "center"
            items.append((x1, x2, inp(f"{k}#{j}", ex, align=al, size=8, **kw), NB))
        prow(p, items, h=26)
    for x1, x2 in COLS[1:]:
        _bd(p, r0, p.r - 1, x1, x2)
    prow(p, [(X1, 505, "주요 공법", dict(CT, size=9.5)), (505, X2, inp("주요공법", ex, align="left", size=8.5), {"valign": "top"})], h=72)
    prow(p, [(X1, 505, "폴리우레탄 폼 및\n주요 마감재 사용 현황", dict(CT, size=9)), (505, X2, inp("마감재", ex, align="left", size=8.5), {})], h=30)
    p.gap(4)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["«공사기간» 은 ① 장 착공일 · 준공일로 채워집니다. «주요 공법» · «폴리우레탄 폼 및 주요 마감재 사용 현황» 은 원문 세로줄이 이어지는 자리지만 "
                  "글을 이어 적도록 한 칸으로 합쳤습니다."]
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


def _s(x):
    """엑셀 «숫자 & 글» 처럼 — 정수면 소수점 없이"""
    return str(int(x)) if float(x).is_integer() else repr(float(x))


def expect(pages):
    a_in, s_in = pages["셈"], pages["개요서"]
    a, o = {}, {}
    sd, ed = _d(a_in.get("착공일")), _d(a_in.get("준공일"))
    if not sd:
        a["기한"] = GH_NEED if ed else ""
    else:
        due = sd - datetime.timedelta(days=1)
        t = f"{GH_A}{_ymd(due)}({_y(due)}){GH_B}"
        t += GH_SAT if due.weekday() == 5 else (GH_SUN if due.weekday() == 6 else "")
        if ed and ed < sd:
            t += GH_BAD
        a["기한"] = t
    hs = [_n(s_in.get(f"높이#{i}")) for i in range(1, NR + 1)] + [_n(s_in.get(f"특수높이#{j}")) for j in range(1, NS + 1)]
    ds = [_n(s_in.get(f"깊이#{i}")) for i in range(1, NR + 1)] + [_n(s_in.get(f"특수깊이#{j}")) for j in range(1, NS + 1)]
    mh, md = max(hs), max(ds)
    if mh == 0 and md == 0:
        a["판정"] = ""
    else:
        t = f"{PJ_A}{_s(mh)}{PJ_B}{_s(md)}{PJ_C}"
        t += PJ_H if mh >= 31 else ""
        t += PJ_D if md >= 10 else ""
        t += PJ_N if (mh < 31 and md < 10) else ""
        a["판정"] = t
    if not s_in.get("상호") and not s_in.get("공사명"):
        a["빈칸"] = ""
    else:
        mc = {"회사명": not s_in.get("상호"), "대표자": not s_in.get("대표자"), "본사 소재지": not s_in.get("본사소재지"), "현장명": not s_in.get("공사명"),
              "현장 소재지": not s_in.get("현장소재지"), "공사기간(① 장)": not (sd and ed), "공사금액": not _n(s_in.get("계약금액")),
              "발주자": not s_in.get("발주자"), "공사개요(대상구조물)": not any(s_in.get(f"구조물#{i}") for i in range(1, NR + 1)),
              "주요 공법": not s_in.get("주요공법")}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
    o["공사기간"] = "" if not (sd or ed) else ((_ymd(sd) if sd else "") + " ~ " + (_ymd(ed) if ed else ""))
    return {"셈": a, "개요서": o}


for _t in (GH_A, GH_B, GH_SAT, GH_SUN, GH_BAD, GH_NEED, PJ_A, PJ_B, PJ_C, PJ_H, PJ_D, PJ_N, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
