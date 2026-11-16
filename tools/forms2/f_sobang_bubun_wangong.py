# -*- coding: utf-8 -*-
"""소방시설 부분완공검사신청서 — 새로 만든 서식 (2026-11-16 G719 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 부분완공검사(법 제14조제2항 — 일부분을 마치고 전체 준공 전에 부분적으로 쓸 때) · 설계도서 첨부(규칙 제13조제1항 괄호 — 감리업자 결과 통보 ·
     착공 · 변경신고 뒤 안 바뀜이면 안 붙임) · 착공신고일 · 완공일 · 신청일 확인 · 공사 종류 [√] · 처리(증명서 별지 제20호서식) · 아직 안 적은 칸
   · 신청서(소방시설공사업법 시행규칙 [별지 제18호서식] <개정 2025. 1. 23.> 칸 차례 그대로 — 한 쪽 · 칸 안 위쪽 이름표).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1120.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G719_소방부분완공검사_원문.txt — 글층 해시 같음 확인):
  · 소방시설공사업법 [시행 2025. 1. 31.] 제14조 ② 부분완공검사(일부분을 마치고 전체 준공 전에 부분적으로 사용할 필요 — 신청할 수 있음 ·
    소방본부장 · 소방서장은 그 일부분의 공사가 완공되었는지 확인) ③ 부분완공검사증명서 발급 ① 전체는 완공검사(감리자 지정이면 결과보고서로 갈음)
  · 시행규칙 [시행 2026. 10. 20.] 제13조 ① 별지 제18호서식 + 설계도서 1부(괄호 — 착공 · 변경신고 뒤 안 바뀜 · 감리업자 결과 통보면 빼고) ·
    단서 행정정보 공동이용 ② 부분완공검사증명서(별지 제20호서식)
■ 짐작 안 함: 부분완공검사 신청 기한은 법에 없음 — 셈 장은 «마친 뒤» 차례만 봄(신청일 < 완공일 ⚠) · 현장확인 대상(영 제5조)은 전체 완공검사 쪽이라 넣지 않음."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L

SLUG = "sobang-bubun-wangong"
TITLE = "소방시설 부분완공검사신청서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "소방시설 부분완공검사신청서(소방시설공사업법 시행규칙 별지 제18호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "소방시설 부분완공검사신청서 — 작성 예시 (공사 종류 √ 와 착공신고일 · 완공일이 ① 장에서 저절로)"),
        (3, "① 부분완공검사 · 설계도서 · 날짜 — 작성 예시")]
MULTI = True
SHORT = ("소방시설 부분완공검사신청서(소방시설공사업법 시행규칙 별지 제18호서식) — 감리자 지정 · 설계도서 변경 여부를 고르면 설계도서를 붙이는지 나오고, "
         "공사 종류 √ 와 착공신고일 · 완공일이 신청서에 들어가며 신청일이 완공일 뒤인지 저절로 점검됩니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
AREA = '#,##0.00;;""'

GM = ["감리자 지정됨", "감리자 없음"]
DS = ["착공 · 변경신고 뒤 바뀜", "안 바뀜"]
GS = ["신설", "증설", "개설", "이전", "정비", "그 밖의 공사"]

BUBUN = ("부분완공검사 — 소방대상물 일부분의 소방시설공사를 마치고, 전체 시설이 준공되기 전에 부분적으로 사용할 필요가 있으면 그 일부분에 대하여 "
         "신청할 수 있음 · 소방본부장 · 소방서장은 그 일부분의 공사가 완공되었는지 확인(소방시설공사업법 제14조제2항)")
JEONCHE = "※ 전체 소방시설공사를 완공하면 완공검사를 받음 — 공사감리자가 지정되어 있으면 공사감리 결과보고서로 갈음(법 제14조제1항 · 별지 제17호서식)"
DT_NEED1 = "⚠ 착공신고일을 적습니다 — 착공신고(법 제13조)를 한 날"
DT_NEED2 = "⚠ 완공일(그 일부분의 공사를 마친 날)을 적습니다"
DT_REV = "⚠ 완공일이 착공신고일보다 빠릅니다"
DT_OK_A, DT_OK_B = "✓ 착공신고일부터 완공일까지 ", "일 · 신청서 «착공신고일 · 완공일» 에 들어감"
SN_NEED = "⚠ 신청서 아래 «년 월 일»(신청일)을 적으면 완공일과 견줍니다"
SN_EARLY = "⚠ 신청일이 완공일보다 빠릅니다 — 부분완공검사는 그 일부분의 소방시설공사를 마친 뒤 신청(법 제14조제2항 «마친 경우»)"
SN_OK0 = "✓ 완공일에 신청"
SN_OK_A, SN_OK_B = "✓ 마친 뒤 신청 — 완공일부터 ", "일"
AT_G = "설계도서 안 붙임 — 감리업자가 공사감리 결과를 통보하는 경우(규칙 제13조제1항 괄호 · 법 제20조)"
AT_N = "설계도서 안 붙임 — 착공신고 · 변경신고 뒤 설계도서가 바뀌지 않음(규칙 제13조제1항 괄호)"
AT_Y = "설계도서 1부 붙임(규칙 제13조제1항) — 착공신고 · 변경신고 뒤 바뀐 설계도서"
GONGDONG = "※ 「전자정부법」 제36조제1항의 행정정보 공동이용으로 확인할 수 있는 서류는 그 확인으로 첨부를 갈음할 수 있음(규칙 제13조제1항 단서)"
CHEORI = ("처리기간 3일(서식) — 소방본부장 · 소방서장은 현장 확인 결과나 감리 결과보고서를 검토해 법령과 화재안전기준에 적합하면 "
          "부분완공검사증명서(별지 제20호서식)를 공사업자에게 발급(법 제14조제3항 · 규칙 제13조제2항)")
BIN_OK = "✓ 신청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"감리": GM[0], "착공신고일": D(2027, 3, 5), "완공일": D(2027, 9, 30), "공사종류": GS[0], "도서변경": DS[1]}
EX_S = {"상호": "다라소방(주)", "등록번호": "2027-0000", "대표자": "최지훈", "소재지": "가나도 다라시 사아로 7", "전화번호": "000-000-0000",
        "대상명칭": "가나타워(가칭)", "주요용도": "업무시설 · 근린생활시설", "대상소재지": "가나도 다라시 마바동 123-4", "대상전화": "000-000-0000",
        "지하": 2, "지상": 15, "연면적": 18500, "바닥면적": 1250, "동수": 1, "부분층동": "지하 2층 ~ 지상 5층(근린생활시설 부분)",
        "소방시설종류": "소화기구, 옥내소화전설비, 스프링클러설비, 자동화재탐지설비, 비상방송설비, 유도등, 비상조명등",
        "기술자성명": "한도윤", "분야등급": "기계 · 전기 / 고급", "신청일": D(2027, 10, 4), "수신": "다라소방서장  귀하"}
HEAD = "■ 소방시설공사업법 시행규칙 [별지 제18호서식] <개정 2025. 1. 23.>"
GUIDE = "※ [   ]에는 해당되는 곳에 √표를 합니다."
STATEMENT = "「소방시설공사업법」 제14조제2항 및 같은 법 시행규칙 제13조제1항에 따라 소방시설의 부분완공검사를 신청합니다."
ATTACH = ("설계도서 1부(「소방시설공사업법」 제13조제1항에 따른 착공신고 또는 같은 조 제2항에 따른 변경신고 이후 설계도서가 변경되지 않거나, "
          "법 제20조에 따라 공사감리 결과를 통보하는 경우에는 제외합니다)")
SUSIN = "소방본부장/소방서장  귀하"


def _ex(ex, k):
    return EX[k] if ex else None


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _gs_box(v):
    return "    ".join(("[√] " if v == k else "[   ] ") + k for k in GS)


def _gs_f(ref):
    return "=" + '&"    "&'.join(f'IF({ref}="{k}","[√] ","[   ] ")&"{k}"' for k in GS)


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
X1, X2 = 120, 1120


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
SUB = {"kind": "text", "size": 7.5, "align": "left", "valign": "top"}
NB = {"border": False}
GR = {"kind": "label", "size": 8, "align": "left"}
F8 = {"kind": "free", "size": 8, "align": "center"}
FB = {"kind": "free", "size": 8}
TL = {"kind": "free", "size": 7.5, "align": "right"}
TR = {"kind": "free", "size": 7.5}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  부분완공검사 — 설계도서 · 날짜 · 공사 종류 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ " + BUBUN)
    sz = {"kind": "text", "size": 7.5}
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  설계도서 붙이나 (규칙 제13조제1항)", need=26 * 4 + 10)
    p.row([(3, "공사감리자", L), (4, I("감리", ex=_ex(ex, "감리"), dv=",".join(GM), align="center", size=8.5)),
           (5, "소방공사감리자가 지정되어 있나(법 제17조제1항)", sz)], h=26)
    p.row([(3, "설계도서", L), (4, I("도서변경", ex=_ex(ex, "도서변경"), dv=",".join(DS), align="center", size=8)),
           (5, "착공신고 · 변경신고 때 낸 설계도서가 그 뒤 바뀌었나", s7)], h=26)
    p.row([(3, "붙일 서류", L),
           (9, F("첨부", f'=IF({{감리}}="{GM[0]}","{AT_G}",IF({{도서변경}}="{DS[1]}","{AT_N}",IF({{도서변경}}="{DS[0]}","{AT_Y}","")))',
                 align="left", size=8.5))], h=34)
    p.row([(3, "", L), (9, GONGDONG, {"kind": "text", "size": 7})])
    g.sec(p, "㉯  착공신고일 · 완공일 · 신청일 (법 제13조 · 제14조제2항)", need=26 * 4 + 10)
    p.row([(3, "착공신고일 · 완공일", L), (3, I("착공신고일", ex=_ex(ex, "착공신고일"), fmt=DT, align="center")), (1, "~", {"kind": "ctext"}),
           (3, I("완공일", ex=_ex(ex, "완공일"), fmt=DT, align="center")), (2, "", g.FR)], h=26)
    a, b = "{착공신고일}", "{완공일}"
    p.row([(3, "날짜 확인", L),
           (9, F("날짜확인", f'=IF(N({a})=0,IF(N({b})=0,"","{DT_NEED1}"),IF(N({b})=0,"{DT_NEED2}",IF({b}<{a},"{DT_REV}",'
                 f'"{DT_OK_A}"&TEXT({b}-{a},"#,##0")&"{DT_OK_B}")))', align="left", size=8.5))], h=28)
    sn = "{신청서!신청일}"
    p.row([(3, "신청일 확인", L),
           (9, F("신청확인", f'=IF(N({b})=0,"",IF(N({sn})=0,"{SN_NEED}",IF({sn}<{b},"{SN_EARLY}",IF({sn}={b},"{SN_OK0}",'
                 f'"{SN_OK_A}"&TEXT({sn}-{b},"#,##0")&"{SN_OK_B}"))))', align="left", size=8.5))], h=34)
    g.sec(p, "㉰  공사 종류 · 처리", need=26 * 3 + 10)
    p.row([(3, "공사 종류", L), (4, I("공사종류", ex=_ex(ex, "공사종류"), dv=",".join(GS), align="center", size=8.5)),
           (5, "신청서 «공사 종류» 에 √", sz)], h=26)
    p.row([(3, "처리", L), (9, CHEORI, {"kind": "text", "size": 7.5})])
    p.row([(3, "전체 완공", L), (9, JEONCHE, {"kind": "text", "size": 7.5})])
    g.sec(p, "㉱  아직 안 적은 칸", need=26 * 2 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({신청서!상호}="",{신청서!대상명칭}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 신청서의 공사 종류 √ 와 착공신고일 · 완공일은 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호 — 15층 업무시설 중 지하 2층 ~ 지상 5층을 먼저 씀)."])
    return p


BIN = [("신청인 상호(명칭)", '{신청서!상호}=""'), ("등록번호", '{신청서!등록번호}=""'), ("대표자", '{신청서!대표자}=""'),
       ("대상 상호(명칭)", '{신청서!대상명칭}=""'), ("대상 소재지", '{신청서!대상소재지}=""'), ("부분완공 층 또는 동", '{신청서!부분층동}=""'),
       ("소방시설의 종류", '{신청서!소방시설종류}=""'), ("소방기술자 성명", '{신청서!기술자성명}=""'), ("공사 종류", '{공사종류}=""'),
       ("착공신고일", 'N({착공신고일})=0'), ("완공일", 'N({완공일})=0')]


def _cell2(p, top, val, h1, h2):
    """칸 안 위쪽 이름표 + 아래 적는 자리 — top/val = [(x1, x2, 글 또는 칸, 꼴)] · 묶음마다 바깥 테는 뒤에서"""
    ra = prow(p, top, h=h1)
    rb = prow(p, val, h=h2)
    return ra, rb


# ── 신청서 (별지 제18호서식 — 한 쪽) ─────────────────────────────────────
def sincheong(bk, ex):
    p = g.pg(bk, ex, "신청서", fit=1, widths=WP)
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center"})], h=34)
    prow(p, [(X1, X2, GUIDE, {"kind": "free", "size": 7.5})], h=14)
    prow(p, [(X1, 425, "접수번호", GR), (425, 870, "접수일자", GR), (870, X2, "처리기간    3일", GR)], h=26)
    p.gap(3)
    # 신청인
    ra, rb = _cell2(p, [(X1, 252, "신 청 인", dict(LB, rs=4)), (252, 496, "상호(명칭)", SUB), (496, 590, "등록번호", SUB),
                        (590, 630, "(제", dict(SUB, align="right")), (630, 735, inp("등록번호", ex, align="center", size=8), NB),
                        (735, 771, "호)", SUB), (771, X2, "대표자", SUB)],
                    [(252, 496, inp("상호", ex, align="left"), NB), (496, 771, "", FB), (771, X2, inp("대표자", ex, align="left"), NB)], 13, 22.5)
    for x1, x2 in ((252, 496), (496, 771), (771, X2)):
        _bd(p, ra, rb, x1, x2)
    rc, rd = _cell2(p, [(252, X2, "소재지", SUB)],
                    [(252, 770, inp("소재지", ex, align="left"), NB), (770, 990, "(전화번호 :", TL), (990, 1100, inp("전화번호", ex, align="center", size=8), NB),
                     (1100, X2, ")", TR)], 13, 22.5)
    _bd(p, rc, rd, 252, X2)
    _bd(p, ra, rd, X1, 252)
    p.gap(3)
    # 부분완공검사 대상 특정소방대상물
    r1, r2 = _cell2(p, [(X1, 252, "부분완공\n검사대상\n특정소방\n대상물", dict(LB, rs=8)), (252, 771, "상호(명칭)", SUB), (771, X2, "주요 용도", SUB)],
                    [(252, 771, inp("대상명칭", ex, align="left"), NB), (771, X2, inp("주요용도", ex, align="left"), NB)], 13, 25)
    _bd(p, r1, r2, 252, 771)
    _bd(p, r1, r2, 771, X2)
    r3, r4 = _cell2(p, [(252, X2, "소재지", SUB)],
                    [(252, 760, inp("대상소재지", ex, align="left"), NB), (760, 990, "(전화번호 :", TL), (990, 1100, inp("대상전화", ex, align="center", size=8), NB),
                     (1100, X2, ")", TR)], 13, 25)
    _bd(p, r3, r4, 252, X2)
    n0 = {"fmt": '0;;""', "align": "center", "size": 8.5, "wrap": "shrink"}      # 좁은 칸 숫자 — 줄여 넣기(### 막기)
    na = {"fmt": AREA, "align": "right", "size": 8.5, "wrap": "shrink"}
    r5, r6 = _cell2(p, [(252, X2, "구        조", SUB)],
                    [(252, 300, "", FB), (300, 335, "지하", F8), (335, 380, inp("지하", ex, **n0), NB), (380, 415, "층,", FB), (415, 455, "지상", F8),
                     (455, 500, inp("지상", ex, **n0), NB), (500, 535, "층,", FB), (535, 590, "연면적", F8), (590, 690, inp("연면적", ex, **na), NB),
                     (690, 720, "㎡,", FB), (720, 800, "바닥면적", F8), (800, 900, inp("바닥면적", ex, **na), NB), (900, 930, "㎡,", FB),
                     (930, 965, inp("동수", ex, **n0), NB), (965, 1010, "개동", FB), (1010, X2, "", FB)], 13, 24.5)
    _bd(p, r5, r6, 252, X2)
    r7, r8 = _cell2(p, [(252, X2, "부분완공을 받으려는 층 또는 동", SUB)], [(252, X2, inp("부분층동", ex, align="left"), NB)], 13, 25)
    _bd(p, r7, r8, 252, X2)
    _bd(p, r1, r8, X1, 252)
    p.gap(3)
    # 소방시설의 종류 · 책임시공 및 기술관리 소방기술자
    prow(p, [(X1, 252, "소방시설의\n종      류", LB), (252, X2, inp("소방시설종류", ex, align="left", size=9), {"valign": "top"})], h=92)
    s1, s2 = _cell2(p, [(X1, 252, "책임시공\n및 기술관리\n소방기술자", dict(LB, rs=2, size=8.5)), (252, 771, "성명", SUB), (771, X2, "분야/등급", SUB)],
                    [(252, 771, inp("기술자성명", ex, align="left", size=9), NB), (771, X2, inp("분야등급", ex, align="left"), NB)], 13, 46)
    _bd(p, s1, s2, 252, 771)
    _bd(p, s1, s2, 771, X2)
    _bd(p, s1, s2, X1, 252)
    p.gap(3)
    prow(p, [(X1, 252, "공사종류", LB), (252, X2, F("공사종류표시", _gs_f("{셈!공사종류}"), align="left", size=8.5), {})], h=37)
    p.gap(3)
    c1, c2 = _cell2(p, [(X1, 252, "착공신고일", dict(LB, rs=2)), (252, 771, "", dict(SUB)), (771, X2, "완공일", SUB)],
                    [(252, 771, F("착공신고일표시", '=IF(N({셈!착공신고일})=0,"",{셈!착공신고일})', fmt=DT, align="center", size=9), NB),
                     (771, X2, F("완공일표시", '=IF(N({셈!완공일})=0,"",{셈!완공일})', fmt=DT, align="center", size=9), NB)], 13, 26)
    _bd(p, c1, c2, 252, 771)
    _bd(p, c1, c2, 771, X2)
    _bd(p, c1, c2, X1, 252)
    p.gap(8)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 9.5})], h=34)
    prow(p, [(X1, X2, inp("신청일", ex, blank="년          월          일", fmt="date", align="right", size=9), NB)], h=24)
    prow(p, [(X1, 520, "", g.FR), (520, 640, "신청인", {"kind": "free", "size": 9.5, "align": "center"}),
             (640, 960, F("신청인표시", '=IF(AND({대표자}="",{상호}=""),"",IF({대표자}="",{상호},IF({상호}="","대표 "&{대표자},{상호}&" 대표 "&{대표자})))',
                          align="center", size=8.5), NB),
             (960, X2, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=26)
    prow(p, [(X1, X2, inp("수신", ex, blank=SUSIN, size=12, bold=True, align="left"), {"border": False, "indent": 1})], h=30)
    from openpyxl.styles import Side
    r = prow(p, [(X1, X2, "", FB)], h=6)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=Side(style="medium", color="000000"))
    p.gap(4)
    n = text_lines(ATTACH, sum(WP[GX.cols(242, 992)[0] - 1:GX.cols(242, 992)[1]]) * 10.0 / 7.6)
    prow(p, [(X1, 242, "첨부서류", {"kind": "label", "size": 8.5}), (242, 992, ATTACH, {"kind": "text", "size": 7.6, "valign": "center"}),
             (992, X2, "수수료\n\n없  음", {"kind": "ctext", "size": 8.5})], h=max(40, n * 7.6 * 1.45 + 12))
    p.end_print()
    p.after_note(["공사 종류 √ 와 착공신고일 · 완공일은 ① 장에서 저절로 들어옵니다. 신청인 칸에는 상호 · 대표자가 들어갑니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    sincheong(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def expect(pages):
    sm, sg = pages["셈"], pages["신청서"]
    a, b = {}, {}
    gm = sm.get("감리")
    ds = sm.get("도서변경")
    a["첨부"] = AT_G if gm == GM[0] else (AT_N if ds == DS[1] else AT_Y if ds == DS[0] else "")
    s, e = _d(sm.get("착공신고일")), _d(sm.get("완공일"))
    if not s:
        a["날짜확인"] = "" if not e else DT_NEED1
    elif not e:
        a["날짜확인"] = DT_NEED2
    elif e < s:
        a["날짜확인"] = DT_REV
    else:
        a["날짜확인"] = f"{DT_OK_A}{(e - s).days:,}{DT_OK_B}"
    sd = _d(sg.get("신청일"))
    if not e:
        a["신청확인"] = ""
    elif not sd:
        a["신청확인"] = SN_NEED
    elif sd < e:
        a["신청확인"] = SN_EARLY
    elif sd == e:
        a["신청확인"] = SN_OK0
    else:
        a["신청확인"] = f"{SN_OK_A}{(sd - e).days:,}{SN_OK_B}"
    gs = sm.get("공사종류")
    if not sg.get("상호") and not sg.get("대상명칭"):
        a["빈칸"] = ""
    else:
        mc = {"신청인 상호(명칭)": not sg.get("상호"), "등록번호": not sg.get("등록번호"), "대표자": not sg.get("대표자"),
              "대상 상호(명칭)": not sg.get("대상명칭"), "대상 소재지": not sg.get("대상소재지"), "부분완공 층 또는 동": not sg.get("부분층동"),
              "소방시설의 종류": not sg.get("소방시설종류"), "소방기술자 성명": not sg.get("기술자성명"), "공사 종류": not gs,
              "착공신고일": not s, "완공일": not e}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    b["공사종류표시"] = _gs_box(gs)
    b["착공신고일표시"] = s if s else ""
    b["완공일표시"] = e if e else ""
    sang, dae = sg.get("상호") or "", sg.get("대표자") or ""
    b["신청인표시"] = "" if not (sang or dae) else (sang if not dae else ("대표 " + dae if not sang else sang + " 대표 " + dae))
    return {"셈": a, "신청서": b}


# 엑셀 수식 안 글(따옴표 안)은 255자까지 — 넘으면 엑셀이 파일을 못 엶
for _t in (DT_NEED1, DT_NEED2, DT_REV, DT_OK_A, DT_OK_B, SN_NEED, SN_EARLY, SN_OK0, SN_OK_A, SN_OK_B, AT_G, AT_N, AT_Y, BIN_OK, BIN_A, *GM, *DS, *GS):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _dv in (GM, DS, GS):
    assert len(",".join(_dv)) < 255 and not any("," in x for x in _dv), _dv[0]
