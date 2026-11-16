# -*- coding: utf-8 -*-
"""소방공사 감리계획서 — 새로 만든 서식 (2026-11-16 G721 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 감리 구분(영 별표 3 — 상주 · 일반 → 1쪽 [√]) · 소방시설 공사기간 · 감리기간(→ 1쪽) · 소방시설마다 공사 시작 · 끝(→ 3 · 4쪽 공정 칸에 «(3/2)↔ · ↔ · ↔(5/31)» 저절로) ·
     날짜를 다시 볼 시설 · 아직 안 적은 칸
   · 계획서(소방시설공사업법 시행규칙 [별지 제22호서식] <개정 2016. 1. 27.> 1 ~ 4쪽 칸 차례 그대로 — 1쪽 개요 · 상주감리 배치 10줄 / 2쪽 일반감리 배치 19줄 ·
     현장방문 · 기재요령 / 3 · 4쪽 공정 및 감리일정(설치대상 소방시설 30가지 + 빈 줄 · 날짜 7칸)).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752 넷) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1117.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G721_소방감리계획서_원문.txt — 네 쪽 글층 해시 같음 확인):
  · 소방시설공사업법 시행규칙 [시행 2026. 10. 20.] 제15조제1항제3호(공사감리자 지정신고서에 별지 제22호서식의 소방공사감리계획서 1부를 붙임)
  · 시행령 [시행 2026. 7. 1.] 제9조 · [별표 3] <개정 2026. 3. 17.>(상주 공사감리 1. 연면적 3만㎡ 이상(아파트 제외) 2. 지하층 포함 16층 이상 · 500세대 이상 아파트 /
    일반 공사감리 = 상주 아닌 것)
■ 원문 그대로: 3 · 4쪽 날짜 칸의 점선은 «...» 글로(일정이 있는 칸은 ↔) · 작성요령(↔ ( ) 표시)은 글 그대로 — 공정 칸은 ① 장 날짜로 «(시작)↔ · ↔ · ↔(끝)» 을 저절로 씀.
■ 짐작 안 함: 3쪽 머리 날짜 7칸은 적은 날부터 다음 칸 날짜 전날까지를 한 칸으로 봄(마지막 칸 · 다음 칸이 빈 칸은 끝 없음) · 감리 구분 판정은 1쪽 «연면적» ·
  지하 + 지상 층수 · 세대수로 셈(여러 동이면 소방본부 · 소방서에 확인 — 글로 알림)."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L

SLUG = "sobang-gamri-gyehoek"
TITLE = "소방공사 감리계획서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "소방공사 감리계획서(소방시설공사업법 시행규칙 별지 제22호서식) 1쪽 — 빈 서식 (원문 칸 차례 그대로)"),
        (7, "소방공사 감리계획서 1쪽 — 작성 예시 (감리구분 [√] · 공사기간 · 감리기간이 ① 장에서 저절로)"),
        (9, "소방공사 감리계획서 3쪽 공정 및 감리일정 — 작성 예시 (① 장의 시작 · 끝 날짜로 «↔» 가 저절로)"),
        (6, "① 감리 구분 · 기간 · 소방시설별 공사 시작 · 끝 — 작성 예시")]
# PDF 쪽 = 빈(셈 1 · 1쪽 2 · 2쪽 3 · 3쪽 4 · 4쪽 5) → 예시(셈 6 · 1쪽 7 · 2쪽 8 · 3쪽 9 · 4쪽 10) — 미리보기 그림을 시험 전에 보고 고침(8 · 10 · 7 → 7 · 9 · 6)
MULTI = True
SHORT = ("소방공사 감리계획서(소방시설공사업법 시행규칙 별지 제22호서식) — 아파트 여부 · 기간 · 소방시설별 공사 시작 · 끝 날짜를 적으면 상주 · 일반 감리 [√] 와 "
         "공사기간 · 감리기간이 채워지고, 3 · 4쪽 공정 및 감리일정 칸에 «(시작)↔ · ↔ · ↔(끝)» 이 저절로 그려집니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
AREA = '#,##0.00;;""'
APT = ["아파트", "아파트 아님"]
GB = ["상주감리", "일반감리"]
NS1, NS2 = 10, 19          # 상주 · 일반 감리원 배치 줄
NC7 = 7                    # 공정 날짜 칸
FAC3 = ["소화기구", "자동소화장치", "옥내소화전설비", "스프링클러설비등", "물분무등소화설비", "옥외소화전설비", "단독경보형감지기", "비상경보설비", "시각경보기",
        "자동화재탐지설비", "비상방송설비", "자동화재속보설비", "통합감시시설", "누전경보기", "가스누설경보기", "피난기구", "인명구조기구", "유도등", "비상조명등",
        "휴대용비상조명등", "상수도소화용수설비", "소화수조ㆍ저수조, 그 밖의 소화용수설비"]
FAC4 = ["제연설비", "연결송수관설비", "연결살수설비", "비상콘센트설비", "무선통신보조설비", "연소방지설비", "피난시설, 방화구획 및 방화시설", "방염물품 사용 및 실내장식물 불연화"]
NB4 = 11                   # 4쪽 빈 줄
FAC = FAC3 + FAC4

PJ_SJ = "상주감리 — 영 별표 3 "
PJ_IB = "일반감리 — 상주 공사감리 대상이 아님(영 별표 3)"
PJ_1 = "제1호(아파트 아닌 연면적 3만㎡ 이상)"
PJ_2 = "제2호(지하층 포함 16층 이상 · 500세대 이상 아파트)"
PJ_Q = "⚠ 아파트인지 고르면 상주 · 일반이 나옵니다"
PJ_N = "※ 판정은 1쪽 «연면적» · 지하 + 지상 층수 · 세대수로 셈 — 여러 동이면 소방본부 · 소방서에 확인"
GK_REV = "⚠ 끝이 시작보다 앞섬"
GK_A, GK_B = "✓ ", "일"
IL_OK = "✓ 적은 시설의 날짜가 모두 맞습니다"
IL_A = "⚠ 날짜를 다시 볼 시설(끝이 시작보다 앞섬 · 한쪽만 적음): "
IL_HD = "⚠ 3쪽 머리 «연 월 일» 첫 칸을 적어야 공정 칸에 ↔ 가 그려집니다"
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
KB = "     년     월     일부터"
KE = "     년     월     일까지"
YMD0 = "연  월  일"            # 칸넘침점검 — 7.5pt 한 줄(넷째 칸이 조금 좁음)
DOT = "..."              # 원문 3 · 4쪽 날짜 칸 점선(글층 «.» 셋) — 일정이 없는 칸
HEAD = "■ 소방시설공사업법 시행규칙 [별지 제22호서식] <개정 2016. 1. 27.>"
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"
GIJAE = ("감리대상 특정소방대상물 및 소방시설: 동일 구내에 둘 이상의 특정소방대상물이 있는 경우 감리할 특정소방대상물 및 소방시설명을 정확히 적고, "
         '기계분야 소방시설 중 부대전기시설물을 전기분야 소방공사감리업자가 감리하는 경우 해당 시설명 뒤에 "(부대전기시설)"을 표기하여야 합니다.')
JAKSEONG = '작성요령: 공사 및 감리일정은 해당 연월일에 "↔"(   )(   ) 표시하되, "(   )"안에는 시작과 휴무 또는 끝나는 날짜를 적으십시오.'   # 원문 곧은 따옴표 그대로

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"아파트": APT[1], "세대수": None, "착공일": D(2027, 3, 2), "준공일": D(2027, 9, 30), "감리시작": D(2027, 3, 2), "감리끝": D(2027, 10, 15)}
EX_IL = {"소화기구": (D(2027, 8, 2), D(2027, 8, 20)), "옥내소화전설비": (D(2027, 3, 15), D(2027, 6, 30)),
         "스프링클러설비등": (D(2027, 3, 15), D(2027, 7, 31)), "자동화재탐지설비": (D(2027, 5, 3), D(2027, 8, 13)),
         "비상방송설비": (D(2027, 6, 1), D(2027, 8, 13)), "유도등": (D(2027, 7, 1), D(2027, 8, 20)),
         "제연설비": (D(2027, 6, 1), D(2027, 8, 31)), "연결송수관설비": (D(2027, 4, 1), D(2027, 7, 30))}
for _k, _nm in enumerate(FAC, 1):
    _se = EX_IL.get(_nm)
    EX[f"시작#{_k}"] = _se[0] if _se else None
    EX[f"끝#{_k}"] = _se[1] if _se else None
EX_S = {"대상명칭": "가나타워(가칭)", "용도구분": "업무시설", "대상소재지": "가나도 다라시 마바동 123-4", "대상전화": "000-000-0000",
        "지하": 3, "지상": 20, "연면적": 32500, "바닥면적": 1620, "동수": 1,
        "발주자": "가나개발(주)", "관계인주소": "가나도 다라시 바사로 12", "관계인전화": "000-000-0000",
        "소방시설종류": "소화기구 · 옥내소화전설비 · 스프링클러설비 · 자동화재탐지설비 · 비상방송설비 · 유도등 · 제연설비 · 연결송수관설비",
        "감리상호": "마바소방(주)", "감리등록번호": "0000-00", "감리대표": "서다온", "감리업종": "전문 소방공사감리업", "감리소재지": "가나도 마바시 공단로 21",
        "감리전화": "000-000-0000",
        "상호": "다라소방(주)", "등록번호": "0000-00", "대표자": "최지훈", "업종": "전문 소방시설공사업", "소재지": "가나도 다라시 사아로 7",
        "전화번호": "000-000-0000",
        "상주성명#1": "정민호", "상주분야#1": "기계 · 전기 / 특급", "상주구분#1": "책임감리원", "상주담당#1": "소방시설 전체",
        "상주기간#1": "2027. 3. 2. ~ 2027. 10. 15.",
        "상주성명#2": "한소영", "상주분야#2": "전기 / 초급", "상주구분#2": "보조감리원", "상주담당#2": "자동화재탐지설비 · 비상방송설비 · 유도등",
        "상주기간#2": "2027. 5. 3. ~ 2027. 8. 31.",
        "방문": 1}
for _c, _d in enumerate((D(2027, 3, 1), D(2027, 4, 1), D(2027, 5, 1), D(2027, 6, 1), D(2027, 7, 1), D(2027, 8, 1), D(2027, 9, 1)), 1):
    EX_S[f"일정#{_c}"] = _d


def _ex(ex, k):
    return EX.get(k) if ex else None


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(120, 1117)
X1, X2 = 120, 1117
DX = [329, 441, 554, 667, 779, 892, 1004, 1117]     # 3 · 4쪽 날짜 7칸 경계


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


def _bd(p, r1, r2, x1, x2, top=True, bot=True, left=True, right=True, side=None, bside=None):
    from openpyxl.styles import Border
    from fb import LINE
    sd = side or LINE
    bs = bside or sd
    c1, c2 = GX.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            p.ws.cell(row=r, column=c).border = Border(left=sd if (left and c == c1) else None, right=sd if (right and c == c2) else None,
                                                       top=sd if (top and r == r1) else None, bottom=bs if (bot and r == r2) else None)


LB = {"kind": "label", "size": 9}
LT = {"kind": "free", "size": 8, "align": "left"}
LC = {"kind": "free", "size": 8.5, "align": "center"}
NB = {"border": False}
CT = {"kind": "ctext", "size": 8.5}
F8 = {"kind": "free", "size": 8, "align": "center"}
FB = {"kind": "free", "size": 8}
TL = {"kind": "free", "size": 7.5, "align": "right"}
TR = {"kind": "free", "size": 7.5}
SM = {"kind": "free", "size": 7, "align": "right", "valign": "bottom"}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


FL = "(N({1쪽!지하})+N({1쪽!지상}))"
SJ1 = 'AND({아파트}="' + APT[1] + '",N({1쪽!연면적})>=30000)'
SJ2 = 'AND({아파트}="' + APT[0] + '",' + FL + '>=16,N({세대수})>=500)'
HD = [f"{{3쪽!일정#{c}}}" for c in range(1, NC7 + 1)]


def _gantt(k, c):
    """공정 칸 하나 — 시설 k(셈 시작#k · 끝#k) · 날짜 칸 c(3쪽 머리 일정#c ~ 다음 칸 전날)"""
    s, e, dc = f"{{셈!시작#{k}}}", f"{{셈!끝#{k}}}", HD[c - 1]
    endc = "2958465" if c == NC7 else f"IF(N({HD[c]})=0,2958465,{HD[c]}-1)"
    return (f'=IF(OR(N({s})=0,N({e})=0,N({dc})=0,{e}<{s}),"{DOT}",IF(OR({s}>{endc},{e}<{dc}),"{DOT}",'
            f'IF(AND({s}>={dc},{s}<={endc}),"("&MONTH({s})&"/"&DAY({s})&")","")&"↔"&IF(AND({e}>={dc},{e}<={endc}),"("&MONTH({e})&"/"&DAY({e})&")","")))')


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  소방공사 감리계획서 — 감리 구분 · 기간 · 공정 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 공사감리자 지정신고서에 이 감리계획서 1부를 붙입니다(소방시설공사업법 시행규칙 제15조제1항제3호). "
              "여기서 정한 감리구분 [√] · 공사기간 · 감리기간 · 공정 칸의 ↔ 가 계획서에 들어갑니다.")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  감리 구분 — 상주 · 일반 (영 별표 3)", need=24 * 4 + 10)
    p.row([(3, "아파트인가", L), (4, I("아파트", ex=_ex(ex, "아파트"), dv=",".join(APT), align="center", size=8.5)),
           (5, "연면적 · 층수는 1쪽 «구조» 칸에서 읽음", s7)], h=22)
    p.row([(3, "세대수(아파트)", L), (4, I("세대수", ex=_ex(ex, "세대수"), fmt='#,##0"세대";;""', align="center", size=9)), (5, "아파트만 적음", s7)], h=22)
    pj = f'=IF({{아파트}}="",IF(N({{1쪽!연면적}})>0,"{PJ_Q}",""),IF(OR({SJ1},{SJ2}),"{PJ_SJ}"&IF({SJ1},"{PJ_1}","{PJ_2}"),"{PJ_IB}"))'
    p.row([(3, "판    정", L), (9, F("판정", pj, align="left", size=8.5, bold=True))], h=26)
    p.row([(3, "", L), (9, PJ_N, s7)])
    g.sec(p, "㉯  소방시설 공사기간 · 감리기간 (→ 1쪽)", need=28 * 2 + 10)
    p.row([(3, "공사 착공 · 준공", L), (3, I("착공일", ex=_ex(ex, "착공일"), fmt=DT, align="center", size=8.5)), (1, "~", {"kind": "ctext"}),
           (3, I("준공일", ex=_ex(ex, "준공일"), fmt=DT, align="center", size=8.5)),
           (2, F("공사일수", '=IF(OR(N({착공일})=0,N({준공일})=0),"",IF({착공일}>{준공일},"' + GK_REV + '","' + GK_A + '"&({준공일}-{착공일}+1)&"' + GK_B + '"))',
                 align="left", size=7.5))], h=28)
    p.row([(3, "감리 시작 · 끝", L), (3, I("감리시작", ex=_ex(ex, "감리시작"), fmt=DT, align="center", size=8.5)), (1, "~", {"kind": "ctext"}),
           (3, I("감리끝", ex=_ex(ex, "감리끝"), fmt=DT, align="center", size=8.5)),
           (2, F("감리일수", '=IF(OR(N({감리시작})=0,N({감리끝})=0),"",IF({감리시작}>{감리끝},"' + GK_REV + '","' + GK_A + '"&({감리끝}-{감리시작}+1)&"' + GK_B + '"))',
                 align="left", size=7.5))], h=28)
    g.sec(p, "㉰  소방시설별 공사 시작 · 끝 (→ 3 · 4쪽 공정 칸 ↔ — 3쪽 머리 «연 월 일» 7칸을 먼저 적음)", need=17 * 16 + 10)
    n = len(FAC)
    half = (n + 1) // 2
    sz = {"kind": "text", "size": 6.5}
    for j in range(half):
        cells = []
        for k in (j + 1, j + 1 + half):
            if k <= n:
                cells += [(2, FAC[k - 1], sz), (2, I(f"시작#{k}", ex=_ex(ex, f"시작#{k}"), fmt=DT, align="center", size=7)),
                          (2, I(f"끝#{k}", ex=_ex(ex, f"끝#{k}"), fmt=DT, align="center", size=7))]
            else:
                cells += [(6, "", g.FR)]
        p.row(cells, h=17)
    chk = "&".join(f'IF(OR(AND(N({{시작#{k}}})>0,N({{끝#{k}}})>0,{{끝#{k}}}<{{시작#{k}}}),AND(N({{시작#{k}}})>0,N({{끝#{k}}})=0),'
                   f'AND(N({{시작#{k}}})=0,N({{끝#{k}}})>0))," · {FAC[k - 1]}","")' for k in range(1, n + 1))
    anyd = "OR(" + ",".join(f"N({{시작#{k}}})>0,N({{끝#{k}}})>0" for k in range(1, n + 1)) + ")"
    p.row([(3, "날짜 점검", L),
           (9, F("일정점검", f'=IF(NOT({anyd}),"",IF(({chk})="",IF(N({HD[0]})=0,"{IL_HD}","{IL_OK}"),"{IL_A}"&MID({chk},4,300)))',
                 align="left", size=8))], h=34)
    g.sec(p, "㉱  아직 안 적은 칸", need=40 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {nm}","")' for nm, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({1쪽!대상명칭}="",{1쪽!감리상호}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=40)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 공정 칸은 3쪽 머리 날짜 7칸과 여기 시작 · 끝 날짜로 그려집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호 — 아파트 아닌 연면적 32,500㎡ 업무시설)."])
    return p


BIN = [("대상 상호(명칭)", '{1쪽!대상명칭}=""'), ("대상 소재지", '{1쪽!대상소재지}=""'), ("연면적", 'N({1쪽!연면적})=0'),
       ("관계인 성명", '{1쪽!발주자}=""'), ("감리업자 상호", '{1쪽!감리상호}=""'), ("공사업자 상호", '{1쪽!상호}=""'),
       ("공사기간(① 장)", 'OR(N({착공일})=0,N({준공일})=0)'), ("감리기간(① 장)", 'OR(N({감리시작})=0,N({감리끝})=0)'),
       ("감리 구분(① 장 아파트)", '{아파트}=""'),
       ("감리원 배치(1 · 2쪽)", 'AND({1쪽!상주성명#1}="",{2쪽!일반성명#1}="")')]


def _period(a, b):
    return (f'=IF(AND(N({a})=0,N({b})=0),"",IF(N({a})=0,"",' + _ymdf(a) + f'&"부터")&CHAR(10)&IF(N({b})=0,"",' + _ymdf(b) + '&"까지"))')


def _two(p, top, bot, h1, h2):
    ra = prow(p, top, h=h1)
    rb = prow(p, bot, h=h2)
    return ra, rb


def _firm(p, ex, lab, keys):
    """업체 두 줄 — 상호(기관명) · 등록번호 «제 호» · 대표자(서명 또는 인) / 업종 · 소재지(전화)"""
    sh, dn, dp, up, so, te = keys
    ra, rb = _two(p, [(X1, 253, lab, dict(LB, rs=4)), (253, 386, "상호(기관명)", dict(LC, rs=2)), (386, 571, inp(sh, ex, align="left", size=8), dict(NB, rs=2)),
                      (571, 702, "등록번호", dict(LC, rs=2)), (702, 740, "제", dict(FB, rs=2, align="right")), (740, 820, inp(dn, ex, align="center", size=8), dict(NB, rs=2)),
                      (820, 855, "호", dict(FB, rs=2)), (855, 941, "대표자", dict(LC, rs=2)), (941, X2, inp(dp, ex, align="left"), NB)],
                  [(941, X2, "(서명 또는 인)", SM)], 13, 11)
    for x1, x2 in ((253, 386), (386, 571), (571, 702), (702, 855), (855, 941), (941, X2)):
        _bd(p, ra, rb, x1, x2)
    rc, rd = _two(p, [(253, 386, "업        종", dict(LC, rs=2)), (386, 571, inp(up, ex, align="left", size=7.5), dict(NB, rs=2)),
                      (571, 702, "소  재  지", dict(LC, rs=2)), (702, X2, inp(so, ex, align="left", size=8), NB)],
                  [(702, 990, "(전화 :", TL), (990, 1100, inp(te, ex, align="center", size=7.5), NB), (1100, X2, ")", TR)], 13.5, 13.5)
    for x1, x2 in ((253, 386), (386, 571), (571, 702), (702, X2)):
        _bd(p, rc, rd, x1, x2)
    _bd(p, ra, rd, X1, 253)


def _bae(p, ex, pre, n, lab1, lab2, hh, h):
    """감리원 배치계획 표 — 머리 + n 줄"""
    r0 = prow(p, [(X1, 200, lab1, dict(LB, rs=n + 1, size=8.5)), (200, 253, lab2, dict(LB, rs=n + 1, size=8.5)), (253, 351, "성    명", CT),
                  (351, 512, "분야/등급", CT), (512, 643, "감리원구분", CT), (643, 959, "담당소방시설", CT), (959, X2, "배치기간", CT)], h=hh)
    for k in range(1, n + 1):
        prow(p, [(253, 351, inp(f"{pre}성명#{k}", ex, align="center", size=8), {}), (351, 512, inp(f"{pre}분야#{k}", ex, align="center", size=7.5), {}),
                 (512, 643, inp(f"{pre}구분#{k}", ex, align="center", size=7.5), {}), (643, 959, inp(f"{pre}담당#{k}", ex, align="left", size=7.5), {}),
                 (959, X2, inp(f"{pre}기간#{k}", ex, align="center", size=6.5), {})], h=h)
    return r0


# ── 1쪽 ────────────────────────────────────────────────────────────────
def page1(bk, ex):
    p = g.pg(bk, ex, "1쪽", fit=1, widths=WP)
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(X1, X2, "(1쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=12)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center", "border": True})], h=29)
    # 특정소방대상물
    r1 = prow(p, [(X1, 253, "특정소방\n대 상 물", dict(LB, rs=4)), (253, 386, "상호(명칭)", LC), (386, 702, inp("대상명칭", ex, align="left"), NB),
                  (702, 855, "용도구분", LC), (855, X2, inp("용도구분", ex, align="left"), NB)], h=29)
    for x1, x2 in ((253, 386), (386, 702), (702, 855), (855, X2)):
        _bd(p, r1, r1, x1, x2)
    ra, rb = _two(p, [(253, 386, "소  재  지", dict(LC, rs=2)), (386, X2, inp("대상소재지", ex, align="left"), NB)],
                  [(386, 990, "(전화 :", TL), (990, 1100, inp("대상전화", ex, align="center", size=7.5), NB), (1100, X2, ")", TR)], 13.5, 13.5)
    _bd(p, ra, rb, 253, 386)
    _bd(p, ra, rb, 386, X2)
    n0 = {"fmt": '0;;""', "align": "center", "size": 8.5, "wrap": "shrink"}
    na = {"fmt": AREA, "align": "right", "size": 8.5, "wrap": "shrink"}
    # 🩹 미리보기에서 «지하 · 지상 · ㎡,» 가 줄바꿈 → 칸 넓힘(시험 전 그림 보기에서 찾음)
    r4 = prow(p, [(253, 386, "구        조", LC), (386, 437, "지하", dict(F8, align="right")), (437, 477, inp("지하", ex, **n0), NB), (477, 509, "층,", FB),
                  (509, 554, "지상", F8), (554, 594, inp("지상", ex, **n0), NB), (594, 626, "층,", FB), (626, 680, "연면적", F8),
                  (680, 770, inp("연면적", ex, **na), NB), (770, 804, "㎡,", FB), (804, 876, "바닥면적", F8), (876, 960, inp("바닥면적", ex, **na), NB),
                  (960, 994, "㎡,", FB), (994, 1035, inp("동수", ex, **n0), NB), (1035, 1080, "개동", FB), (1080, X2, "", FB)], h=27)
    _bd(p, r4, r4, 253, 386)
    _bd(p, r4, r4, 386, X2)
    _bd(p, r1, r4, X1, 253)
    # 관계인
    c1 = prow(p, [(X1, 253, "관 계 인", dict(LB, rs=3)), (253, 386, "성명(기관\n또는 법인명)", dict(LC, size=7.5)), (386, X2, inp("발주자", ex, align="left"), NB)], h=28)
    _bd(p, c1, c1, 253, 386)
    _bd(p, c1, c1, 386, X2)
    ca, cb = _two(p, [(253, 386, "주        소", dict(LC, rs=2)), (386, X2, inp("관계인주소", ex, align="left"), NB)],
                  [(386, 990, "(전화 :", TL), (990, 1100, inp("관계인전화", ex, align="center", size=7.5), NB), (1100, X2, ")", TR)], 13.5, 13.5)
    _bd(p, ca, cb, 253, 386)
    _bd(p, ca, cb, 386, X2)
    _bd(p, c1, cb, X1, 253)
    # 소방시설의 종류 · 감리구분
    ck = {"kind": "free", "size": 8.5, "align": "left"}
    d1 = prow(p, [(X1, 253, "소방시설의\n종      류", dict(LB, rs=2)), (253, 855, inp("소방시설종류", ex, align="left", size=8.5), {"rs": 2, "valign": "top"}),
                  (855, 941, "감  리\n구  분", dict(LC, rs=2)),
                  (941, X2, F("상주표시", f'=IF(LEFT({{셈!판정}},4)="{GB[0]}","[√] {GB[0]}","[   ] {GB[0]}")', align="left", size=8.5), ck)], h=31.5)
    prow(p, [(941, X2, F("일반표시", f'=IF(LEFT({{셈!판정}},4)="{GB[1]}","[√] {GB[1]}","[   ] {GB[1]}")', align="left", size=8.5), ck)], h=31.5)
    _bd(p, d1, d1 + 1, 855, 941)
    _bd(p, d1, d1 + 1, 941, X2)
    _firm(p, ex, "소방공사\n감리업자", ("감리상호", "감리등록번호", "감리대표", "감리업종", "감리소재지", "감리전화"))
    _firm(p, ex, "소방시설\n공사업자", ("상호", "등록번호", "대표자", "업종", "소재지", "전화번호"))
    gk = _period("{셈!착공일}", "{셈!준공일}")       # 원문 1쪽 빈칸(«년 월 일» 글 없음) — 둘 다 비면 빈칸
    kk = _period("{셈!감리시작}", "{셈!감리끝}")
    prow(p, [(X1, 386, "소방시설 공사기간", LB), (386, 702, F("공사기간", gk, align="center", size=8.5), {}), (702, 855, "감리기간", LC),
             (855, X2, F("감리기간", kk, align="center", size=8.5), {})], h=32)
    _bae(p, ex, "상주", NS1, "소방\n공사\n감리원\n배치\n계획", "상\n\n주\n\n감\n\n리", 30, 29)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["감리구분 [√] · 공사기간 · 감리기간은 ① 장에서 들어옵니다. 소방시설공사업자 칸은 공통 정보(상호 · 대표자 · 전화번호)에서 들어옵니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호)."])
    return p


# ── 2쪽 ────────────────────────────────────────────────────────────────
def page2(bk, ex):
    p = g.pg(bk, ex, "2쪽", fit=1, widths=WP)
    prow(p, [(X1, X2, "(2쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    _bae(p, ex, "일반", NS2, "소방\n공사\n감리원\n배치\n계획", "일\n\n\n반\n\n\n감\n\n\n리", 29, 29)
    r = prow(p, [(X1, 253, "현장방문\n감리계획", dict(LB, size=8.5)), (253, 685, "감  리  원", LC), (685, 935, "현장 방문     주", {"kind": "free", "size": 8.5, "align": "right"}),
                 (935, 1000, inp("방문", ex, fmt='0;;""', align="center", size=9), NB), (1000, X2, "회 이상", FB)], h=34)
    _bd(p, r, r, 253, 685)
    _bd(p, r, r, 685, X2)
    ng = text_lines(GIJAE, sum(WP) * 10.0 / 8)
    r = prow(p, [(X1, X2, "기재요령\n" + GIJAE, {"kind": "text", "size": 8, "valign": "top"})], h=max(60, (ng + 1) * 8 * 1.45 + 10))
    _bd(p, r, r, X1, X2)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["일반감리 감리원은 여기 2쪽에, 상주감리 감리원은 1쪽에 적습니다."] if not ex else ["이 시트는 작성 예시입니다."])
    return p


# ── 3 · 4쪽 공정 및 감리일정 ─────────────────────────────────────────────
def _sched(bk, ex, name, names, k0, blanks, tail):
    p = g.pg(bk, ex, name, fit=1, widths=WP)
    prow(p, [(X1, X2, f"({name})", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    prow(p, [(X1, X2, "소방시설의 공정 및 감리일정", {"kind": "ctext", "size": 11, "bold": True})], h=27)
    head = [(X1, 329, "설치대상\n소방시설의 종류", dict(CT, rs=2)), (329, X2, "공사 및 감리일정", CT)]
    prow(p, head, h=16)
    cells = []
    for c in range(1, NC7 + 1):
        if name == "3쪽":
            cells.append((DX[c - 1], DX[c], inp(f"일정#{c}", ex, blank=YMD0, fmt=DT, align="center", size=7.5), {}))
        else:
            cells.append((DX[c - 1], DX[c], F(f"머리#{c}", f'=IF(N({{3쪽!일정#{c}}})=0,"{YMD0}",{{3쪽!일정#{c}}})', fmt=DT, align="center", size=7.5), {}))
    prow(p, cells, h=20)
    rh = 26.7 if name == "3쪽" else 27.6
    for j, nm in enumerate(names):
        k = k0 + j
        its = [(X1, 329, nm, {"kind": "text", "size": 8 if len(nm) < 14 else 7})]
        for c in range(1, NC7 + 1):
            its.append((DX[c - 1], DX[c], F(f"공정#{k}#{c}", _gantt(k, c), align="center", size=6.5), {"border": False}))
        r = prow(p, its, h=rh)
        for c in range(1, NC7 + 1):
            _bd(p, r, r, DX[c - 1], DX[c])          # 하늘색 칠 없이 가는 테만(공정 칸이 많아 칠하면 표가 어두움)
    for _ in range(blanks):
        its = [(X1, 329, "", {"kind": "text", "size": 8})]
        for c in range(1, NC7 + 1):
            its.append((DX[c - 1], DX[c], DOT, {"kind": "ctext", "size": 6.5}))
        prow(p, its, h=rh)
    if tail == "빈칸":
        its = [(X1, 329, "", {"kind": "text", "size": 8})] + [(DX[c - 1], DX[c], "", {"kind": "text", "size": 6.5}) for c in range(1, NC7 + 1)]
        prow(p, its, h=56)
    else:
        nj = text_lines(JAKSEONG, sum(WP) * 10.0 / 8)
        prow(p, [(X1, X2, JAKSEONG, {"kind": "text", "size": 8, "valign": "top"})], h=max(55, nj * 8 * 1.45 + 10))
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["공정 칸은 3쪽 머리 날짜 7칸과 ① 장 시작 · 끝 날짜로 저절로 그려집니다 — «(시작 월/일)↔ · ↔ · ↔(끝 월/일)»."]
                 if not ex else ["이 시트는 작성 예시입니다."])
    return p


def _bd_top(p, r, x1, x2):
    """공정 칸 위 테(가는 선)만 더함 — 점선 아래 테는 그대로"""
    from openpyxl.styles import Border
    from fb import LINE
    c1, c2 = GX.cols(x1, x2)
    for c in range(c1, c2 + 1):
        b = p.ws.cell(row=r, column=c).border
        p.ws.cell(row=r, column=c).border = Border(left=b.left, right=b.right, top=LINE, bottom=b.bottom)


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    page1(bk, ex)
    page2(bk, ex)
    _sched(bk, ex, "3쪽", FAC3, 1, 0, "빈칸")
    _sched(bk, ex, "4쪽", FAC4, len(FAC3) + 1, NB4, "작성요령")


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _days(a, b):
    if not (a and b):
        return ""
    return GK_REV if a > b else f"{GK_A}{(b - a).days + 1}{GK_B}"


def expect(pages):
    sm, p1, p2, p3 = pages["셈"], pages["1쪽"], pages["2쪽"], pages["3쪽"]
    a, o1, o3, o4 = {}, {}, {}, {}
    apt = sm.get("아파트")
    yeon = _n(p1.get("연면적"))
    fl = _n(p1.get("지하")) + _n(p1.get("지상"))
    sd = _n(sm.get("세대수"))
    s1 = apt == APT[1] and yeon >= 30000
    s2 = apt == APT[0] and fl >= 16 and sd >= 500
    a["판정"] = (PJ_Q if yeon > 0 else "") if not apt else (PJ_SJ + (PJ_1 if s1 else PJ_2) if (s1 or s2) else PJ_IB)
    st, jg = _d(sm.get("착공일")), _d(sm.get("준공일"))
    gs, ge = _d(sm.get("감리시작")), _d(sm.get("감리끝"))
    a["공사일수"] = _days(st, jg)
    a["감리일수"] = _days(gs, ge)
    n = len(FAC)
    se = [(_d(sm.get(f"시작#{k}")), _d(sm.get(f"끝#{k}"))) for k in range(1, n + 1)]
    hd = [_d(p3.get(f"일정#{c}")) for c in range(1, NC7 + 1)]
    if not any(s or e for s, e in se):
        a["일정점검"] = ""
    else:
        bad = "".join(f" · {FAC[k]}" for k, (s, e) in enumerate(se) if (s and e and e < s) or (s and not e) or (e and not s))
        a["일정점검"] = (IL_HD if not hd[0] else IL_OK) if not bad else IL_A + bad[3:3 + 300]
    if not p1.get("대상명칭") and not p1.get("감리상호"):
        a["빈칸"] = ""
    else:
        mc = {"대상 상호(명칭)": not p1.get("대상명칭"), "대상 소재지": not p1.get("대상소재지"), "연면적": not yeon, "관계인 성명": not p1.get("발주자"),
              "감리업자 상호": not p1.get("감리상호"), "공사업자 상호": not p1.get("상호"), "공사기간(① 장)": not (st and jg),
              "감리기간(① 장)": not (gs and ge), "감리 구분(① 장 아파트)": not apt,
              "감리원 배치(1 · 2쪽)": not p1.get("상주성명#1") and not p2.get("일반성명#1")}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    pj = a["판정"]
    o1["상주표시"] = f"[√] {GB[0]}" if pj[:4] == GB[0] else f"[   ] {GB[0]}"
    o1["일반표시"] = f"[√] {GB[1]}" if pj[:4] == GB[1] else f"[   ] {GB[1]}"
    o1["공사기간"] = "" if not (st or jg) else ((_ymd(st) + "부터") if st else "") + "\n" + ((_ymd(jg) + "까지") if jg else "")
    o1["감리기간"] = "" if not (gs or ge) else ((_ymd(gs) + "부터") if gs else "") + "\n" + ((_ymd(ge) + "까지") if ge else "")
    BIG = D(9999, 12, 31)
    for k in range(1, n + 1):
        s, e = se[k - 1]
        for c in range(1, NC7 + 1):
            dc = hd[c - 1]
            v = DOT
            if s and e and dc and not (e < s):
                endc = BIG if c == NC7 or not hd[c] else hd[c] - datetime.timedelta(days=1)
                if not (s > endc or e < dc):
                    v = (f"({s.month}/{s.day})" if dc <= s <= endc else "") + "↔" + (f"({e.month}/{e.day})" if dc <= e <= endc else "")
            (o3 if k <= len(FAC3) else o4)[f"공정#{k}#{c}"] = v
    for c in range(1, NC7 + 1):
        o4[f"머리#{c}"] = hd[c - 1] if hd[c - 1] else YMD0
    return {"셈": a, "1쪽": o1, "3쪽": o3, "4쪽": o4}


for _t in (PJ_SJ, PJ_IB, PJ_1, PJ_2, PJ_Q, GK_REV, GK_A, GK_B, IL_OK, IL_A, IL_HD, BIN_OK, BIN_A, KB, KE, YMD0, *APT, *GB, *FAC):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _dv in (APT, GB):
    assert len(",".join(_dv)) < 255 and not any("," in x for x in _dv), _dv[0]
