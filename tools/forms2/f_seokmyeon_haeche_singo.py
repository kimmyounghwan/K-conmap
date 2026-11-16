# -*- coding: utf-8 -*-
"""석면해체ㆍ제거작업 신고서 — 새로 만든 서식 (2026-11-16 G712 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 구분 [√](건축물 · 설비 / 유치원 또는 학교 · 정비사업 · 기타 — 뒤쪽 유의사항 1~3) · 해체하는 자(업자 · 스스로 → 붙일 서류 4) ·
     해체기간(시작 · 끝 → 신고서 «해체기간» 저절로) · 신고 기한(규칙 제181조제1항 — 작업 시작 7일 전까지) · 작업근로자 수(7줄 넘으면 별첨) · 아직 안 적은 칸
   · 신고서(산업안전보건법 시행규칙 [별지 제77호서식] <개정 2023. 9. 27.> 앞쪽 · 뒤쪽 칸 차례 그대로 — 세로 두 쪽).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752 둘) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — 앞쪽 x 120~1121 · 뒤쪽 x 120~1122.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G712_석면해체신고_원문.txt — 글층 해시 같음 확인):
  · 산업안전보건법 [시행 2026. 10. 27.] 제122조(석면의 해체ㆍ제거) ① 석면해체ㆍ제거업자로 하여금 해체ㆍ제거(단서 — 스스로) ③ 작업 전에 신고 · 서류 보존
  · 시행규칙 [시행 2026. 8. 1.] 제181조(석면해체ㆍ제거작업 신고 절차 등) ① 작업 시작 7일 전까지 별지 제77호서식 + 1. 공사계약서 사본 2. 작업계획서
    3. 석면조사결과서 · 스스로 하려는 자는 영 제94조제2항 등록 인력 · 시설 · 장비 증명서류 ② 변경(종류 감소 · 면적 축소 제외) — 지체 없이 별지 제78호서식
    ③ 받은 날부터 7일 이내 별지 제79호서식 신고(변경) 증명서
■ 짐작 안 함: «7일 전까지» = 시작일에서 달력 날 7일을 뺀 날(그날까지) · 그날이 토 · 일요일이면 «그 전 평일에 내면 안전» 글로만 알림 ·
  원문 유의사항 4의 «시행규칙 제186조» 는 원문 그대로 둠(지금 제186조는 작업환경측정 대상 — 고치지 않음) · 면적 칸은 단위가 셋(㎡ · ㎥ · m)이라 글로 적음 ·
  처리절차 화살표는 원문 글층 «‣» 대신 그림처럼 «▶»."""
import datetime

import sgw as g
from fb import F, I, text_lines

SLUG = "seokmyeon-haeche-singo"
TITLE = "석면해체ㆍ제거작업 신고서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "석면해체ㆍ제거작업 신고서(산업안전보건법 시행규칙 별지 제77호서식 앞쪽) — 빈 서식 (원문 칸 차례 그대로)"),
        (5, "석면해체ㆍ제거작업 신고서 — 작성 예시 (구분 [√] 와 해체기간이 ① 장에서 저절로)"),
        (4, "① 구분 · 해체기간 · 신고 기한(작업 시작 7일 전) · 붙일 서류 — 작성 예시"),
        (3, "뒤쪽 — 첨부서류 · 유의사항 · 공지사항 · 처리절차 (원문 그대로)")]
MULTI = True
SHORT = ("석면해체ㆍ제거작업 신고서(산업안전보건법 시행규칙 별지 제77호서식) — 구분을 고르면 [√] 가, 해체 시작일 · 끝날을 적으면 신고서 «해체기간»과 "
         "신고 기한(작업 시작 7일 전까지)이, 해체하는 자를 고르면 붙일 서류가 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
YOIL = "일월화수목금토"

DS = ["건축물", "설비"]
DK = ["유치원 또는 학교", "정비사업", "기타"]
JC = ["석면해체ㆍ제거업자", "스스로(건축물ㆍ설비소유주등)"]
GH_A = "신고 기한: 해체 시작일("
GH_B = ") 7일 전 → "
GH_C = "까지 · 작업 장소 관할 지방고용노동관서(규칙 제181조제1항)"
GH_SAT = " · ⚠ 토요일이라 그 전 평일에 내면 안전합니다"
GH_SUN = " · ⚠ 일요일이라 그 전 평일에 내면 안전합니다"
GH_LATE_A = " · ⚠ 신고일("
GH_LATE_B = ")이 기한보다 늦음 — 작업 시작 7일 전까지 내야 합니다"
GH_BAD = " · ⚠ 해체 끝날이 시작일보다 앞섭니다"
GH_NEED = "⚠ 해체 시작일을 적으면 신고 기한(작업 시작 7일 전까지)을 셉니다"
SR_BASE = "붙일 서류: 1. 공사계약서 사본 · 2. 석면 해체ㆍ제거 작업계획서(석면 흩날림 방지 및 폐기물 처리방법 포함) · 3. 석면조사결과서"
SR_4 = " · 4. 등록에 필요한 인력 · 시설 및 장비를 갖추고 있음을 증명하는 서류(스스로 하는 경우 — 규칙 제181조제1항 · 영 제94조제2항)"
GJ_A = "작업근로자 "
GJ_B = "명"
GJ_FULL = " — 7줄이 다 찼습니다. 더 있으면 별첨하여 냅니다(원문 ※)"
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
NW = 7
MAT = ["분무재(뿜칠재)", "내화피복재", "천장재", "지붕재", "벽재(벽체의 마감재)", "바닥재", "파이프보온재", "단열재", "개스킷", "기타"]

EX = {"대상": DS[0], "종류": DK[2], "주체": JC[0], "시작일": D(2027, 3, 15), "끝날": D(2027, 3, 26)}
EX_S = {"현장소재지": "가나시 다라구 마바로 45", "건축물번호": "0000-0000-0000", "용도": "제2종 근린생활시설", "건물명": "가나빌딩",
        "건축물수": "1동", "구조": "철근콘크리트조", "세대수": "해당 없음", "연면적": "1,850㎡",
        "소유자성명": "가나개발(주)", "소유자전화": "000-000-0000", "소유자주소": "가나시 다라구 바사로 12",
        "상호": "마바환경(주)", "대표자": "서다온", "노동부등록": "제0000-00호", "전화번호": "000-000-0000", "휴대전화": "010-0000-0000",
        "공사명": "가나빌딩 리모델링 공사", "작업장전화": "000-000-0000",
        "해체사유": "리모델링 공사 전 석면 함유 천장재 · 바닥재 · 파이프보온재 해체 · 제거",
        "면적#3": "420㎡", "면적#6": "180㎡", "면적#7": "35m",
        "책임자성명": "한소영", "책임자전화": "010-0000-0000",
        "성명#1": "정민호", "생년월일#1": "1979. 5. 12.", "주소#1": "가나시 다라구 사아로 7", "전화#1": "010-0000-0000",
        "성명#2": "이가람", "생년월일#2": "1985. 9. 3.", "주소#2": "가나시 마바구 자차로 21", "전화#2": "010-0000-0000",
        "성명#3": "최지훈", "생년월일#3": "1990. 1. 27.", "주소#3": "가나시 다라구 카타로 9", "전화#3": "010-0000-0000",
        "성명#4": "박나래", "생년월일#4": "1988. 11. 30.", "주소#4": "가나시 마바구 파하로 15", "전화#4": "010-0000-0000",
        "제출일": D(2027, 3, 2), "신고인": "마바환경(주) 대표 서다온"}
HEAD = "■ 산업안전보건법 시행규칙 [별지 제77호서식] <개정 2023. 9. 27.>"
GUIDE = "※ 유의사항을 읽고 작성하여 주시기 바라며 [   ]에는 √ 표시를 합니다."
NOTE1 = "※ 석면함유자재(물질)의 종류 및 면적의 내용이나 작업근로자가 많을 경우 별첨하여 제출합니다."
STATEMENT = "「산업안전보건법」 제122조제3항 및 같은 법 시행규칙 제181조제1항에 따라 위와 같이 신고합니다."
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"
ATTACH = ("1. 공사계약서 사본 1부\n2. 석면해체ㆍ제거작업 계획서(석면 흩날림 방지 및 폐기물 처리방법을 포함합니다) 1부\n3. 석면조사 결과서 1부\n"
          "4. 「산업안전보건법 시행령」 별표 28에 따른 인력, 시설 및 장비를 갖추고 있음을 증명하는 서류 1부(석면해체ㆍ제거작업을 스스로 하려는 사람만 해당합니다)")
NOTICE = ["1. 「유아교육법」 제2조제2호에 따른 유치원, 「초ㆍ중등교육법」 제2조에 따른 학교 또는 「고등교육법」 제2조에 따른 학교 건축물이나 설비에 대하여 "
          "해체ㆍ제거작업을 수행할 경우에는 유치원 또는 학교에 √ 표시를 합니다.",
          "2. 「도시 및 주거환경정비법」 제2조에 따른 주택재개발사업, 주택재건축사업 등 정비사업으로 인해 건축물이나 설비에 대하여 해체ㆍ제거작업을 수행할 "
          "경우에는 정비사업에 √ 표시를 합니다.",
          "3. 제1호 및 제2호에 해당하지 않는 건축물이나 설비에 대하여 해체ㆍ제거작업을 수행할 경우에는 기타에 √ 표시를 합니다.",
          "4. 현장책임자는 「산업안전보건법 시행규칙」 제186조에 따라 석면해체ㆍ제거업자가 등록한 인력 중 실제로 석면해체ㆍ제거작업 현장을 총괄ㆍ관리하는 "
          "사람으로 적습니다.",
          "5. 해체기간, 석면함유자재(물질)의 종류 및 면적, 현장책임자, 작업근로자가 변경된 경우에는 별지 78호서식의 석면해체ㆍ제거작업 변경 신고서를 "
          "제출해야 합니다. 다만, 석면함유자재(물질)의 종류가 감소하거나 석면함유자재(물질)의 종류별 석면해체ㆍ제거작업 면적이 축소되는 경우에는 변경 "
          "신고서를 제출하지 않습니다."]
GONGJI = "본 민원의 처리결과에 대한 만족도 조사 및 관련 제도 개선에 필요한 의견조사를 위해 신고인의 전화번호(휴대전화)로 전화조사를 실시할 수 있습니다."


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


G1 = Gx(120, 1121)     # 앞쪽
G2 = Gx(120, 1122)     # 뒤쪽


def prow(p, gx, items, h):
    r = p.r
    cells = []
    c = 1
    for it in items:
        a, b = gx.cols(it[0], it[1])
        assert b >= a, (p.name, r, it[:2])
        while (r, c) in p.occ:
            c += 1
        assert c == a, f"[{p.name}] {r}행 칸 자리 {c} ≠ {a} (x {it[0]})"
        cells.append((b - a + 1,) + tuple(it[2:]))
        c = b + 1
    return p.row(cells, h=h)


def _bd(p, gx, r1, r2, x1, x2, top=True, bot=True, left=True, right=True):
    from openpyxl.styles import Border
    from fb import LINE
    c1, c2 = gx.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            p.ws.cell(row=r, column=c).border = Border(left=LINE if (left and c == c1) else None, right=LINE if (right and c == c2) else None,
                                                       top=LINE if (top and r == r1) else None, bottom=LINE if (bot and r == r2) else None)


LB = {"kind": "label", "size": 9}
SUB = {"kind": "text", "size": 7.5, "align": "left", "valign": "top"}
LT = {"kind": "free", "size": 8, "align": "left"}
NB = {"border": False}
GR = {"kind": "label", "size": 8, "align": "left"}
CT = {"kind": "ctext", "size": 8.5}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


SD, ED, QD = "{시작일}", "{끝날}", "{신고서!제출일}"
DUE = f"({SD}-7)"
WCNT = "(" + "+".join(f'IF({{신고서!성명#{i}}}<>"",1,0)' for i in range(1, NW + 1)) + ")"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  석면해체ㆍ제거작업 신고서 — 구분 [√] · 신고 기한 · 붙일 서류 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 석면해체ㆍ제거업자(스스로 하는 건축물ㆍ설비소유주등)는 석면해체ㆍ제거작업 시작 7일 전까지 이 신고서에 서류를 붙여 작업 장소 관할 "
              "지방고용노동관서의 장에게 냅니다(산업안전보건법 제122조제3항 · 시행규칙 제181조제1항). 지방고용노동관서는 받은 날부터 7일 이내에 "
              "신고 증명서(별지 제79호서식)를 발급합니다(같은 조 제3항).")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  구분 · 해체하는 자 (신고서 [√])", need=26 * 4 + 10)
    p.row([(3, "건축물 · 설비", g.L), (5, I("대상", ex=EX["대상"] if ex else None, dv=",".join(DS), align="center", size=9)),
           (4, "해체 · 제거하는 것이 건축물인지 설비인지", s7)], h=26)
    p.row([(3, "유치원 · 학교 등", g.L), (5, I("종류", ex=EX["종류"] if ex else None, dv=",".join(DK), align="center", size=9)),
           (4, "유치원 · 학교 건축물이나 설비 / 재개발 · 재건축 등 정비사업 / 그 밖은 기타(뒤쪽 유의사항 1~3)", s7)], h=26)
    p.row([(3, "해체하는 자", g.L), (5, I("주체", ex=EX["주체"] if ex else None, dv=",".join(JC), align="center", size=8.5)),
           (4, "스스로(건축물ㆍ설비소유주등)이면 4. 인력 · 시설 · 장비 증명서류를 더 붙임(법 제122조제1항 단서)", s7)], h=26)
    g.sec(p, "㉯  해체기간 · 신고 기한 (규칙 제181조제1항 — 작업 시작 7일 전까지)", need=26 * 4 + 10)
    p.row([(3, "해체 시작일", g.L), (5, I("시작일", ex=EX["시작일"] if ex else None, fmt=DT, align="center", size=9)), (4, "", s7)], h=24)
    p.row([(3, "해체 끝날", g.L), (5, I("끝날", ex=EX["끝날"] if ex else None, fmt=DT, align="center", size=9)), (4, "", s7)], h=24)
    need = f'OR({{대상}}<>"",{{종류}}<>"",{{주체}}<>"",N({ED})>0)'
    f = (f'=IF(N({SD})=0,IF({need},"{GH_NEED}",""),"{GH_A}"&' + _ymdf(SD) + f'&"{GH_B}"&' + _ymdf(DUE) + '&"("&' + _yo(DUE) + f'&")"&"{GH_C}"'
         f'&IF(WEEKDAY({DUE})=7,"{GH_SAT}",IF(WEEKDAY({DUE})=1,"{GH_SUN}",""))'
         f'&IF(AND(N({QD})>0,N({QD})>{DUE}),"{GH_LATE_A}"&' + _ymdf(QD) + f'&"{GH_LATE_B}","")'
         f'&IF(AND(N({ED})>0,N({ED})<N({SD})),"{GH_BAD}",""))')
    p.row([(3, "신고 기한", g.L), (9, F("기한", f, align="left", size=8.5))], h=58)
    g.sec(p, "㉰  붙일 서류 · 작업근로자", need=26 * 3 + 10)
    p.row([(3, "붙일 서류", g.L),
           (9, F("서류", f'=IF({{주체}}="","","{SR_BASE}"&IF({{주체}}="{JC[1]}","{SR_4}",""))', align="left", size=8.5))], h=58)
    p.row([(3, "작업근로자", g.L),
           (9, F("근로자", f'=IF({WCNT}=0,"","{GJ_A}"&{WCNT}&"{GJ_B}"&IF({WCNT}={NW},"{GJ_FULL}",""))', align="left", size=8.5))], h=26)
    g.note(p, "※ 해체기간 · 석면함유자재(물질)의 종류 및 면적 · 현장책임자 · 작업근로자가 바뀌면 지체 없이 별지 제78호서식 변경 신고서를 냅니다 — "
              "종류가 줄거나 종류별 면적이 줄어든 경우는 내지 않습니다(규칙 제181조제2항).")
    g.sec(p, "㉱  아직 안 적은 칸", need=26 * 2 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({신고서!상호}="",{신고서!공사명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 신고서의 구분 [√] 와 «해체기간» 은 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


BIN = [("구분(건축물 · 설비)", '{대상}=""'), ("구분(유치원 또는 학교 · 정비사업 · 기타)", '{종류}=""'), ("위치(소재지)", '{신고서!현장소재지}=""'),
       ("소유자 성명", '{신고서!소유자성명}=""'), ("업체명(상호)", '{신고서!상호}=""'), ("고용노동부 등록번호", '{신고서!노동부등록}=""'),
       ("공사현장명", '{신고서!공사명}=""'), ("해체사유", '{신고서!해체사유}=""'), ("해체기간(① 장)", f'OR(N({SD})=0,N({ED})=0)'),
       ("석면함유자재 면적", "AND(" + ",".join(f'{{신고서!면적#{k}}}=""' for k in range(1, len(MAT) + 1)) + ")"),
       ("현장책임자 성명", '{신고서!책임자성명}=""'),
       ("작업근로자", "AND(" + ",".join(f'{{신고서!성명#{i}}}=""' for i in range(1, NW + 1)) + ")"), ("신고인", '{신고서!신고인}=""')]


# ── 신고서(앞쪽) ─────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "신고서", fit=1, widths=WP)
    X1, X2 = 120, 1121
    prow(p, G1, [(X1, X2, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, G1, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center"})], h=30)
    prow(p, G1, [(X1, 1000, GUIDE, {"kind": "free", "size": 7}), (1000, X2, "(앞쪽)", {"kind": "free", "size": 7, "align": "right"})], h=14)
    prow(p, G1, [(X1, 373, "신고번호", GR), (373, 871, "(지방고용노동관서명)              -              호", GR),
                 (871, 960, "처리기간", GR), (960, X2, "7일", GR)], h=24)
    rr = p.r - 1
    _bd(p, G1, rr, rr, 871, X2)                      # 처리기간 · 7일 은 원문처럼 한 칸
    p.gap(3)
    # 구분 — 왼쪽 [√] 두 덩이(① 장에서) + 오른쪽 네 줄(칸 위쪽 이름 + 아래 적는 자리)
    ck = {"kind": "text", "size": 9, "align": "left"}
    tt1 = f'=IF({{셈!대상}}="{DS[0]}","[√]","[   ]")&" {DS[0]}"&CHAR(10)&IF({{셈!대상}}="{DS[1]}","[√]","[   ]")&" {DS[1]}"'
    tt2 = ("=" + "&CHAR(10)&".join(f'IF({{셈!종류}}="{o}","[√]","[   ]")&" {o}"' for o in DK))
    rows4 = [(("위치(소재지)", "현장소재지"), ("건축물등록번호", "건축물번호")), (("용도", "용도"), ("건물명(설비명)", "건물명")),
             (("건축물수", "건축물수"), ("구조", "구조")), (("세대수", "세대수"), ("연면적", "연면적"))]
    for j, ((n1, k1), (n2, k2)) in enumerate(rows4):
        items = []
        if j == 0:
            items.append((X1, 163, "구\n분", dict(LB, rs=8)))
            items.append((163, 373, F("구분대상", tt1, align="left", size=8.5), dict(ck, rs=4, size=8.5)))
        if j == 2:
            items.append((163, 373, F("구분종류", tt2, align="left", size=8), dict(ck, rs=4, size=8)))
        items += [(373, 747, n1, SUB), (747, X2, n2, SUB)]
        ra = prow(p, G1, items, h=11)
        rb = prow(p, G1, [(373, 747, inp(k1, ex, align="left"), NB), (747, X2, inp(k2, ex, align="left"), NB)], h=14)
        _bd(p, G1, ra, rb, 373, 747)
        _bd(p, G1, ra, rb, 747, X2)
    p.gap(3)
    # 소유자
    ra = prow(p, G1, [(X1, 245, "소유자", dict(LB, rs=2)), (245, 300, "성명", LT), (300, 747, inp("소유자성명", ex, align="left"), NB),
                      (747, 850, "전화번호", LT), (850, X2, inp("소유자전화", ex, align="left"), NB)], h=15)
    _bd(p, G1, ra, ra, 245, 747)
    _bd(p, G1, ra, ra, 747, X2)
    rb = prow(p, G1, [(245, 300, "주소", LT), (300, X2, inp("소유자주소", ex, align="left"), NB)], h=15)
    _bd(p, G1, rb, rb, 245, X2)
    p.gap(3)
    # 석면해체ㆍ제거업자
    ra = prow(p, G1, [(X1, 245, "석면\n해체ㆍ제거\n업자", dict(LB, rs=3, size=8.5)), (245, 345, "업체명(상호)", LT), (345, 747, inp("상호", ex, align="left"), NB),
                      (747, 860, "대표자 성명", LT), (860, X2, inp("대표자", ex, align="left"), NB)], h=15)
    _bd(p, G1, ra, ra, 245, 747)
    _bd(p, G1, ra, ra, 747, X2)
    rb = prow(p, G1, [(245, 410, "고용노동부 등록번호", LT), (410, X2, inp("노동부등록", ex, align="left"), NB)], h=15)
    _bd(p, G1, rb, rb, 245, X2)
    rc = prow(p, G1, [(245, 320, "전화번호", LT), (320, 747, inp("전화번호", ex, align="left"), NB), (747, 870, "휴대전화번호", LT),
                      (870, X2, inp("휴대전화", ex, align="left"), NB)], h=15)
    _bd(p, G1, rc, rc, 245, 747)
    _bd(p, G1, rc, rc, 747, X2)
    p.gap(3)
    # 작업장
    r = prow(p, G1, [(X1, 245, "작업장", LB), (245, 505, "공사현장명(공사명ㆍ작업명)", dict(LT, size=7.5)), (505, 747, inp("공사명", ex, align="left", size=8), NB),
                     (747, 840, "전화번호", LT), (840, X2, inp("작업장전화", ex, align="left"), NB)], h=24)
    _bd(p, G1, r, r, 245, 747)
    _bd(p, G1, r, r, 747, X2)
    p.gap(3)
    # 해체 사유 및 기간
    prow(p, G1, [(X1, 245, "해체 사유\n및 기간", dict(LB, rs=2)), (245, 373, "해체사유", CT), (373, X2, inp("해체사유", ex, align="left"), {})], h=19)
    hk = ('=IF(N({셈!시작일})=0,"      년      월      일부터",' + _ymdf("{셈!시작일}") + '&"부터")&"          "&'
          'IF(N({셈!끝날})=0,"      년      월      일까지",' + _ymdf("{셈!끝날}") + '&"까지")')
    prow(p, G1, [(245, 373, "해체기간", CT), (373, X2, F("해체기간", hk, align="center", size=9), {})], h=19)
    p.gap(3)
    # 석면함유자재(물질)의 종류 및 면적
    prow(p, G1, [(X1, 245, "석면함유\n자재(물질)의\n종류 및 면적", dict(LB, rs=len(MAT) + 1)), (245, 535, "종  류", dict(CT, size=9)),
                 (535, X2, "면적(㎡)ㆍ부피(㎥)ㆍ길이(m)", dict(CT, size=9))], h=15)
    for k, nm in enumerate(MAT, 1):
        prow(p, G1, [(245, 535, nm, dict(CT, size=8)), (535, X2, inp(f"면적#{k}", ex, align="center"), {})], h=14.5)
    p.gap(3)
    # 현장책임자
    r = prow(p, G1, [(X1, 245, "현장책임자", LB), (245, 300, "성명", LT), (300, 622, inp("책임자성명", ex, align="left"), NB),
                     (622, 715, "전화번호", LT), (715, X2, inp("책임자전화", ex, align="left"), NB)], h=16)
    _bd(p, G1, r, r, 245, 622)
    _bd(p, G1, r, r, 622, X2)
    # 작업근로자 인적사항
    prow(p, G1, [(X1, 245, "작업근로자\n인적사항", dict(LB, rs=NW + 1)), (245, 435, "성명", CT), (435, 622, "생년월일", CT), (622, 985, "주소", CT),
                 (985, X2, "전화번호", CT)], h=14.5)
    for i in range(1, NW + 1):
        prow(p, G1, [(245, 435, inp(f"성명#{i}", ex, align="center"), {}), (435, 622, inp(f"생년월일#{i}", ex, align="center"), {}),
                     (622, 985, inp(f"주소#{i}", ex, align="left", size=8), {}), (985, X2, inp(f"전화#{i}", ex, align="center", size=8), {})], h=14.5)
    r = prow(p, G1, [(X1, X2, NOTE1, {"kind": "free", "size": 7.5})], h=14)
    _bd(p, G1, r, r, X1, X2, top=False, left=False, right=False)
    p.gap(6)
    prow(p, G1, [(X1, X2, STATEMENT, {"kind": "free", "size": 9})], h=20)
    prow(p, G1, [(X1, X2, inp("제출일", ex, blank="년          월          일", fmt="date", align="right", size=9), NB)], h=20)
    prow(p, G1, [(X1, 520, "", g.FR), (520, 640, "신고인", {"kind": "free", "size": 9, "align": "center"}),
                 (640, 960, inp("신고인", ex, align="center", size=9), NB), (960, X2, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=22)
    r = prow(p, G1, [(X1, X2, "지방고용노동청장(지청장) 귀하", {"kind": "free", "size": 13, "bold": True})], h=26)
    _bd(p, G1, r, r, X1, X2, top=False, left=False, right=False)
    prow(p, G1, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["구분 [√] 와 «해체기간» 은 ① 장에서 들어옵니다. 석면함유자재 면적 칸에는 단위(㎡ · ㎥ · m)를 같이 적습니다. 작업근로자가 많으면 별첨합니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


# ── 뒤쪽(첨부서류 · 유의사항 · 공지사항 · 처리절차) ────────────────────────────
def back(bk, ex):
    p = g.pg(bk, ex, "뒤쪽", fit=1, widths=WP)
    X1, X2 = 120, 1122
    r = prow(p, G2, [(X1, X2, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    _bd(p, G2, r, r, X1, X2, top=False, left=False, right=False)
    p.gap(40)
    a1, a2 = G2.cols(250, 996)
    na = text_lines(ATTACH, (a2 - a1 + 1) * 91.2 / NC * 10 / 8.5)
    prow(p, G2, [(X1, 250, "첨부서류", LB), (250, 996, ATTACH, {"kind": "text", "size": 8.5}), (996, X2, "수수료\n없음", {"kind": "ctext", "size": 8.5})],
         h=na * 12 + 8)
    hd = {"kind": "head", "size": 9}
    prow(p, G2, [(X1, X2, "유의사항", hd)], h=22)
    body = "\n".join(NOTICE)
    nb = text_lines(body, sum(WP) * 10 / 8.5)
    prow(p, G2, [(X1, X2, body, {"kind": "free", "size": 8.5, "valign": "top"})], h=nb * 12.5 + 8)
    prow(p, G2, [(X1, X2, "공지사항", hd)], h=22)
    ng = text_lines(GONGJI, sum(WP) * 10 / 8.5)
    prow(p, G2, [(X1, X2, GONGJI, {"kind": "free", "size": 8.5, "valign": "top"})], h=ng * 12.5 + 8)
    prow(p, G2, [(X1, X2, "처리절차", hd)], h=22)
    box = {"kind": "ctext", "size": 8}
    arr = {"kind": "cfree", "size": 8}
    E = [(135, 253), (305, 423), (475, 593), (645, 762), (814, 932), (984, 1102)]
    steps = ["신고서\n작성", "접  수", "검  토", "결  재", "시행", "증명서 발급"]
    who = ["신고인", "지방고용노동\n청장ㆍ지청장", "지방고용노동\n청장ㆍ지청장,\n한국산업안전\n보건공단", "지방고용노동\n청장ㆍ지청장", "지방고용노동\n청장ㆍ지청장",
           "지방고용노동\n청장ㆍ지청장"]
    items = [(X1, 135, "", g.FR)]
    for j, (a, b) in enumerate(E):
        items.append((a, b, steps[j], box))
        if j < len(E) - 1:
            items.append((b, E[j + 1][0], "▶", arr))
    items.append((1102, X2, "", g.FR))
    prow(p, G2, items, h=32)
    items = [(X1, 135, "", g.FR)]
    for j, (a, b) in enumerate(E):
        items.append((a, b, who[j], {"kind": "cfree", "size": 7}))
        if j < len(E) - 1:
            items.append((b, E[j + 1][0], "", g.FR))
    items.append((1102, X2, "", g.FR))
    r = prow(p, G2, items, h=50)
    _bd(p, G2, r, r, X1, X2, top=False, left=False, right=False)
    prow(p, G2, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["원문 뒤쪽(첨부서류 · 유의사항 · 공지사항 · 처리절차) 그대로입니다."] if not ex else ["이 시트는 작성 예시입니다."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)
    back(bk, ex)


def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _y(d):
    return YOIL[(d.weekday() + 1) % 7]


def expect(pages):
    a_in, s_in = pages["셈"], pages["신고서"]
    a, o = {}, {}
    sd, ed, qd = _d(a_in.get("시작일")), _d(a_in.get("끝날")), _d(s_in.get("제출일"))
    if not sd:
        a["기한"] = GH_NEED if (a_in.get("대상") or a_in.get("종류") or a_in.get("주체") or ed) else ""
    else:
        due = sd - datetime.timedelta(days=7)
        t = f"{GH_A}{_ymd(sd)}{GH_B}{_ymd(due)}({_y(due)}){GH_C}"
        t += GH_SAT if due.weekday() == 5 else (GH_SUN if due.weekday() == 6 else "")
        if qd and qd > due:
            t += f"{GH_LATE_A}{_ymd(qd)}{GH_LATE_B}"
        if ed and ed < sd:
            t += GH_BAD
        a["기한"] = t
    jc = a_in.get("주체")
    a["서류"] = "" if not jc else SR_BASE + (SR_4 if jc == JC[1] else "")
    n = sum(1 for i in range(1, NW + 1) if s_in.get(f"성명#{i}"))
    a["근로자"] = "" if n == 0 else f"{GJ_A}{n}{GJ_B}" + (GJ_FULL if n == NW else "")
    if not s_in.get("상호") and not s_in.get("공사명"):
        a["빈칸"] = ""
    else:
        mc = {"구분(건축물 · 설비)": not a_in.get("대상"), "구분(유치원 또는 학교 · 정비사업 · 기타)": not a_in.get("종류"),
              "위치(소재지)": not s_in.get("현장소재지"), "소유자 성명": not s_in.get("소유자성명"), "업체명(상호)": not s_in.get("상호"),
              "고용노동부 등록번호": not s_in.get("노동부등록"), "공사현장명": not s_in.get("공사명"), "해체사유": not s_in.get("해체사유"),
              "해체기간(① 장)": not (sd and ed), "석면함유자재 면적": not any(s_in.get(f"면적#{k}") for k in range(1, len(MAT) + 1)),
              "현장책임자 성명": not s_in.get("책임자성명"), "작업근로자": n == 0, "신고인": not s_in.get("신고인")}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
    ds, dk = a_in.get("대상"), a_in.get("종류")
    o["구분대상"] = "\n".join(("[√]" if ds == x else "[   ]") + " " + x for x in DS)
    o["구분종류"] = "\n".join(("[√]" if dk == x else "[   ]") + " " + x for x in DK)
    o["해체기간"] = ((_ymd(sd) + "부터") if sd else "      년      월      일부터") + "          " + ((_ymd(ed) + "까지") if ed else "      년      월      일까지")
    return {"셈": a, "신고서": o, "뒤쪽": {}}


for _t in (GH_A, GH_B, GH_C, GH_SAT, GH_SUN, GH_LATE_A, GH_LATE_B, GH_BAD, GH_NEED, SR_BASE, SR_4, GJ_A, GJ_B, GJ_FULL, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _t in (*DS, *DK, *JC):
    assert "," not in _t
