# -*- coding: utf-8 -*-
"""안전관리자ㆍ보건관리자ㆍ산업보건의 선임 등 보고서(건설업) — 새로 만든 서식 (2026-11-16 G708 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 유해위험방지계획서 대상 판정(영 제42조제3항 — 높이 31m · 연면적 3만㎡ · 5천㎡ 시설 · 냉동ㆍ냉장 창고 설비 · 단열 · 지간 50m · 터널 · 댐 · 굴착 10m → 보고서 [√] 저절로) ·
     발주자 유형 [√] · 보고 기한(영 제16조제6항 · 제20조제3항 · 제29조제3항 — 선임 · 위탁 · 위촉한 날부터 14일) · 아직 안 적은 칸
   · 보고서(산업안전보건법 시행규칙 [별지 제3호서식] <개정 2025. 4. 29.> 칸 차례 그대로 — 세로 한 쪽).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1126 (메모 /home/claude/g10/notes/G708_칸자리.md).

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G708_선임보고서_원문.txt — 글층 해시 같음 확인):
  · 산업안전보건법 시행령 [시행 2026. 8. 1.] 제16조제6항(안전관리자 선임 · 위탁 → 14일) · 제20조제3항(보건관리자 — 제16조제3항~제7항 준용) ·
    제29조제3항(산업보건의 선임 · 위촉 → 14일) · 제42조제3항(유해위험방지계획서 제출 대상 건설공사)
  · 시행규칙 [시행 2026. 8. 1.] 제11조제1항 · 제23조제1항(별지 제3호서식 — 관할 지방고용노동관서의 장에게) · 해임 · 해촉은 별지 제3호의2서식(제11조제2항 · 제23조제2항)
■ 짐작 안 함: «14일 이내» 첫날 빼고(민법 제157조) · 끝날이 토 · 일요일이면 월요일(민법 제161조 — 공휴일은 글로만) ·
  대상 판정은 영 제42조제3항 각 호 글 그대로(5천㎡ 시설 용도는 고르게 · 댐 · 터널 · 냉동창고 설비 · 단열은 예/아니오)."""
import datetime

import sgw as g
from fb import F, I, text_lines

SLUG = "anjeon-seonim-bogo"
TITLE = "안전관리자ㆍ보건관리자ㆍ산업보건의 선임 등 보고서(건설업)"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "선임 등 보고서(건설업 · 산업안전보건법 시행규칙 별지 제3호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "선임 등 보고서 — 작성 예시 (대상 분류 [√] 와 발주자 유형이 ① 장에서 저절로)"),
        (3, "① 유해위험방지계획서 대상 판정 · 보고 기한 14일 — 작성 예시")]
MULTI = True
SHORT = ("안전관리자ㆍ보건관리자ㆍ산업보건의 선임 등 보고서(건설업 · 산업안전보건법 시행규칙 별지 제3호서식) — 건물 높이 · 연면적 · 굴착 깊이 등을 적으면 "
         "유해위험방지계획서 대상 분류 [√] 가, 선임한 날을 적으면 보고 기한(14일)이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
WON = '#,##0"원";;""'
YOIL = "일월화수목금토"

# ── 고르는 값 ───────────────────────────────────────────────────────────
YT = ["정부", "지방자치단체", "공공기관", "지방공기업", "기타 국가기관", "기업", "개인"]
YN = ["예", "아니오"]
YD = ["문화 및 집회시설(전시장 · 동물원 · 식물원 제외)", "판매시설 · 운수시설(고속철도 역사 · 집배송시설 제외)", "종교시설", "의료시설 중 종합병원",
      "숙박시설 중 관광숙박시설", "지하도상가", "냉동ㆍ냉장 창고시설", "해당 없음"]
JD = ["(전담 [√]   겸임 [   ])", "(전담 [   ]   겸임 [√])"]
JD0 = "(전담 [   ]   겸임 [   ])"
# 보고서 대상 분류 아홉(원문 글 그대로 — 차례도)
CAT = ["지상높이 31미터 이상 건축물 또는 인공구조물 건설 등", "연면적 3만제곱미터 이상인 건축물 건설 등",
       "연면적 5천제곱미터 이상인 문화 및 집회시설 등 건설 등", "연면적 5천제곱미터 이상인 냉동ㆍ냉장 창고시설의 설비공사 및 단열공사",
       "최대 지간 길이 50미터 이상인 다리 건설 등", "터널의 건설등 공사", "다목적댐 등 댐 건설 등", "깊이 10미터 이상인 굴착공사",
       "유해위험 방지계획서 제출 대상 아님"]
CAT_LAW = ["영 제42조제3항제1호가목", "영 제42조제3항제1호나목", "영 제42조제3항제1호다목", "영 제42조제3항제2호", "영 제42조제3항제3호",
           "영 제42조제3항제4호", "영 제42조제3항제5호", "영 제42조제3항제6호"]
SC = ["지상높이 31m 이상", "연면적 3만㎡ 이상", "연면적 5천㎡ 이상 시설", "냉동ㆍ냉장 창고 설비 · 단열", "지간 50m 이상 다리", "터널", "댐", "굴착 깊이 10m 이상"]
PD_Y = "유해위험방지계획서 제출 대상(법 제42조제1항제3호): "
PD_N = "유해위험방지계획서 제출 대상 아님(적은 값으로는 영 제42조제3항 어느 호에도 안 맞음)"
GH_A = " 선임 등 "
GH_B = " → 14일: "
GH_C = "까지 관할 지방고용노동관서의 장에게(첫날 빼고 · 토 · 일요일이면 월요일 · 공휴일이면 그다음 날)"
GH_LAW = {"안전관리자": " — 영 제16조제6항 · 규칙 제11조제1항", "보건관리자": " — 영 제20조제3항(제16조제6항 준용) · 규칙 제11조제1항",
          "산업보건의": " — 영 제29조제3항 · 규칙 제23조제1항"}
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"발주유형": YT[3], "높이": 33.5, "연면적": 12800, "용도": YD[7], "냉동설비": YN[1], "지간": None, "터널": YN[1], "댐": YN[1], "굴착": 8.5}
EX_S = {"사업장명": "가나건설(주)", "본사사업자": "000-00-00000", "대표자": "이가람", "본사전화": "000-000-0000", "본사소재지": "가나시 다라구 바사로 12",
        "현장명": "가나시 다목적체육관 신축공사", "도급인": "가나건설(주)", "현장전화": "000-000-0000",
        "현장소재지": "가나시 다라구 마바동 123-4", "공사기간": "2026. 12. 14. ~ 2027. 12. 31.", "공사금액": 6450000000, "근로자수": 45,
        "발주자": "가나시 도시공사", "발주대표": "서도윤", "발주법인번호": "000000-0000000", "사업장관리번호": "00000000000",
        "발주주소": "가나시 다라구 시청로 1", "발주연락처": "000-000-0000",
        "안전성명": "정민호", "안전생년월일": "1980. 5. 12.", "안전기관명": "가나건설(주)", "안전메일": "anjeon@gana.example", "안전전화": "010-0000-0000",
        "안전자격": "산업안전기사 제00000000000호", "안전경력기관": "다라건설(주) 안전팀", "안전경력기간": "2015. 3. 2. ~ 2026. 11. 30.",
        "안전학교": "가나대학교", "안전학과": "안전공학과", "안전선임일": D(2026, 12, 14), "안전전담": JD[0],
        "보건성명": "한소영", "보건생년월일": "1988. 9. 3.", "보건기관명": "가나건설(주)", "보건메일": "bogeon@gana.example", "보건전화": "010-0000-0000",
        "보건자격": "간호사 면허 제000000호", "보건경력기관#1": "다라병원", "보건경력기간#1": "2012. 3. 2. ~ 2019. 2. 28.",
        "보건경력기관#2": "다라건설(주) 보건팀", "보건경력기간#2": "2019. 3. 4. ~ 2026. 11. 30.", "보건학교": "가나대학교", "보건학과": "간호학과",
        "보건선임일": D(2026, 12, 14), "보건전담": JD[1],
        "보고일": D(2026, 12, 21), "보고인": "이가람"}

HEAD = "■ 산업안전보건법 시행규칙 [별지 제3호서식] <개정 2025. 4. 29.>"
STATEMENT = ("「산업안전보건법」 제17조제1항ㆍ제18조제1항ㆍ제22조제1항 본문ㆍ제42조, 같은 법 시행령 제16조제6항ㆍ제20조제3항ㆍ제29조제3항ㆍ제42조제3항 및 "
             "같은 법 시행규칙 제11조제1항ㆍ제23조제1항에 따라 위와 같이 보고서를 제출합니다.")
HOW = ["1. 안전관리자(안전관리전문기관) 및 보건관리자(보건관리전문기관)를 선임(업무를 위탁)한 경우 또는 산업보건의를 선임ㆍ위촉한 경우에 해당사항을 작성하시기 바랍니다.",
       "2. 이 건의 민원처리 결과에 대한 만족도 조사 및 관련 제도 개선에 필요한 의견조사를 위해 귀하의 연락처로 전화조사를 실시할 수 있습니다."]
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


def _due(x):
    return f"(({x})+IF(WEEKDAY({x})=7,2,IF(WEEKDAY({x})=1,1,0)))"


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(120, 1126)


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
    """(r1~r2, x1~x2) 를 한 칸처럼 — 바깥선만"""
    from openpyxl.styles import Border
    from fb import LINE
    c1, c2 = GX.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            p.ws.cell(row=r, column=c).border = Border(left=LINE if (left and c == c1) else None, right=LINE if (right and c == c2) else None,
                                                       top=LINE if (top and r == r1) else None, bottom=LINE if (bot and r == r2) else None)


LB = {"kind": "label", "size": 8.5}
LT = {"kind": "free", "size": 7.5, "align": "left"}           # 칸 안 이름(원문: 칸 왼쪽에 작은 이름 · 오른쪽에 적음)
NB = {"border": False}
CT = {"kind": "ctext", "size": 8}


def inp(k, ex, **kw):
    kw.setdefault("size", 8)
    return I(k, ex=_e(ex, k), **kw)


def pair(p, r, x1, xm, x2, lab, k, ex, ls=None, **kw):
    """한 칸 = 이름(x1~xm) + 적는 자리(xm~x2) — 바깥선만 · ls = 이름 글자 크기(긴 이름)"""
    return [(x1, xm, lab, dict(LT, size=ls) if ls else LT), (xm, x2, inp(k, ex, **kw), NB)]


# ── ① 셈 ────────────────────────────────────────────────────────────────
C = {"높이": "N({높이})>=31", "연면적3만": "N({연면적})>=30000",
     "시설": f'AND(N({{연면적}})>=5000,{{용도}}<>"",{{용도}}<>"{YD[7]}")', "냉동": f'{{냉동설비}}="{YN[0]}"', "지간": "N({지간})>=50",
     "터널": f'{{터널}}="{YN[0]}"', "댐": f'{{댐}}="{YN[0]}"', "굴착": "N({굴착})>=10"}
CK = ["높이", "연면적3만", "시설", "냉동", "지간", "터널", "댐", "굴착"]
ANY = 'OR(N({높이})>0,N({연면적})>0,{용도}<>"",{냉동설비}<>"",N({지간})>0,{터널}<>"",{댐}<>"",N({굴착})>0)'


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  선임 등 보고서 — 유해위험방지계획서 대상 · 보고 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 안전관리자 · 보건관리자를 선임(위탁)하거나 산업보건의를 선임 · 위촉하면 그날부터 14일 이내에 이 보고서를 관할 지방고용노동관서의 장에게 냅니다"
              "(산업안전보건법 시행령 제16조제6항 · 제20조제3항 · 제29조제3항 · 시행규칙 제11조제1항 · 제23조제1항). 해임 · 해촉은 별지 제3호의2서식(해임 등 보고서)입니다.")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  발주자 유형 (보고서 [√])", need=24 * 2 + 10)
    p.row([(3, "유형", g.L), (5, I("발주유형", ex=EX["발주유형"] if ex else None, dv=",".join(YT), align="center", size=8.5)),
           (4, "(공공) 정부 · 지방자치단체 · 공공기관 · 지방공기업 · 기타 국가기관 / (민간) 기업 · 개인", s7)], h=26)
    g.sec(p, "㉯  유해위험방지계획서 대상 분류 (영 제42조제3항 — 보고서 [√] 저절로)", need=24 * 10 + 10)
    rows = [("높이", "지상높이(m)", None, '0.0#;;""', "건축물 또는 인공구조물 — 31m 이상(제1호가목)"),
            ("연면적", "연면적(㎡)", None, '#,##0.##;;""', "3만㎡ 이상 건축물(제1호나목) · 5천㎡ 이상 시설(제1호다목)"),
            ("용도", "5천㎡ 이상 시설 용도", ",".join(YD), None, "제1호다목 1)~7) — 해당 없으면 «해당 없음»"),
            ("냉동설비", "냉동ㆍ냉장 창고 설비 · 단열", ",".join(YN), None, "연면적 5천㎡ 이상 냉동ㆍ냉장 창고시설의 설비공사 및 단열공사(제2호)"),
            ("지간", "다리 최대 지간 길이(m)", None, '0.0#;;""', "다리의 기둥과 기둥의 중심 사이 거리 — 50m 이상(제3호)"),
            ("터널", "터널 건설등", ",".join(YN), None, "터널의 건설등 공사(제4호)"),
            ("댐", "댐 건설등", ",".join(YN), None, "다목적댐 · 발전용댐 · 저수용량 2천만톤 이상 용수 전용 댐 · 지방상수도 전용 댐(제5호)"),
            ("굴착", "굴착 깊이(m)", None, '0.0#;;""', "깊이 10m 이상 굴착공사(제6호)")]
    for k, lab, dv, fmt, note in rows:
        kw = {"dv": dv} if dv else {"fmt": fmt}
        p.row([(3, lab, dict(g.L, size=8)), (5, I(k, ex=EX[k] if ex else None, align="center", size=8.5, **kw)), (4, note, s7)], h=26)
    hits = "&".join(f'IF({C[k]}," · {SC[j]}({CAT_LAW[j][9:]})","")' for j, k in enumerate(CK))
    anyc = "OR(" + ",".join(C[k] for k in CK) + ")"
    p.row([(3, "판정", g.L),
           (9, F("판정", f'=IF(NOT({ANY}),"",IF({anyc},"{PD_Y}"&MID({hits},4,400),"{PD_N}"))', align="left", size=8, bold=True))], h=46)
    g.sec(p, "㉰  보고 기한 (선임 · 위탁 · 위촉한 날부터 14일)", need=26 * 3 + 10)
    for who, k in (("안전관리자", "안전선임일"), ("보건관리자", "보건선임일"), ("산업보건의", "의사선임일")):
        ref = f"{{보고서!{k}}}"
        due = _due(f"{ref}+14")
        p.row([(3, who, g.L),
               (9, F(f"기한{who}", f'=IF(N({ref})=0,"","{who}{GH_A}"&' + _ymdf(ref) + f'&"{GH_B}"&' + _ymdf(due) + '&"("&' + _yo(due)
                     + f'&")"&"{GH_C}{GH_LAW[who]}")', align="left", size=8))], h=44)
    g.sec(p, "㉱  아직 안 적은 칸", need=26 * 2 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({보고서!사업장명}="",{보고서!현장명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=44)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 보고서의 대상 분류 [√] 와 발주자 유형 [√] 는 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


BIN = [("사업장명", '{보고서!사업장명}=""'), ("본사 사업자등록번호", '{보고서!본사사업자}=""'), ("사업주 또는 대표자", '{보고서!대표자}=""'),
       ("현장명", '{보고서!현장명}=""'), ("현장 소재지", '{보고서!현장소재지}=""'), ("공사기간", '{보고서!공사기간}=""'),
       ("대상 분류(① 장)", f"NOT({ANY})"), ("발주자 유형(① 장)", '{발주유형}=""'), ("발주자 성명 또는 사업자명", '{보고서!발주자}=""'),
       ("선임 등 연ㆍ월ㆍ일", 'AND(N({보고서!안전선임일})=0,N({보고서!보건선임일})=0,N({보고서!의사선임일})=0)')]


# ── 보고서 ──────────────────────────────────────────────────────────────
def _box(j):
    """대상 분류 [√] 한 칸 — 칸 참조를 모두 조건(AND) 안에 먼저 두고 [√] · [   ] 글자는 맨 뒤에
       (formulas 파서는 '셈'!칸 → "[ ]" 글자 → '셈'!칸 순서를 못 읽음 · verify2 넘어짐 → 이 꼴로 고정)"""
    return f'=IF(AND({{셈!판정}}<>"",{C[CK[j]].replace("{", "{셈!")}),"[√] ","[   ] ")&"{CAT[j]}"'


def person(p, ex, who, pre, kind, hrows):
    """안전관리자(kind=«세로») · 보건관리자 · 산업보건의(kind=«머리») 한 덩이 — 원문 꼴 그대로"""
    xv = 751 if who != "산업보건의" else 749
    xs = 374 if who != "산업보건의" else 382
    nrow = 8 if kind == "세로" else 9
    r0 = prow(p, [(120, 250, who, dict(LB, rs=nrow, size=9)), (250, 300, "성명", LT), (300, 440, inp(pre + "성명", ex, align="left"), NB),
                  (440, 520, "생년월일", LT), (520, xv, inp(pre + "생년월일", ex, align="left"), NB), (xv, 820, "기관명", LT),
                  (820, 1126, inp(pre + "기관명", ex, align="left"), NB)], h=hrows[0])
    _bd(p, r0, r0, 250, xv)
    _bd(p, r0, r0, xv, 1126)
    mail = "전자우편 주소" if who == "산업보건의" else "전자우편주소"
    r = prow(p, [(250, 360, mail, LT), (360, xv, inp(pre + "메일", ex, align="left"), NB), (xv, 830, "전화번호", LT),
                 (830, 1126, inp(pre + "전화", ex, align="left"), NB)], h=hrows[0])
    _bd(p, r, r, 250, xv)
    _bd(p, r, r, xv, 1126)
    r = prow(p, [(250, 370, "자격/면허번호", LT), (370, 1126, inp(pre + "자격", ex, align="left"), NB)], h=hrows[0])
    _bd(p, r, r, 250, 1126)
    if kind == "세로":
        prow(p, [(250, xs, "경력", dict(CT, rs=2)), (xs, xv, "기관명", CT), (xv, 1126, inp(pre + "경력기관", ex, align="left"))], h=hrows[0])
        prow(p, [(xs, xv, "기간", CT), (xv, 1126, inp(pre + "경력기간", ex, align="left"))], h=hrows[0])
        prow(p, [(250, xs, "학력", dict(CT, rs=2)), (xs, xv, "학교", CT), (xv, 1126, inp(pre + "학교", ex, align="left"))], h=hrows[0])
        prow(p, [(xs, xv, "학과", CT), (xv, 1126, inp(pre + "학과", ex, align="left"))], h=hrows[0])
    else:
        prow(p, [(250, xs, "경력", dict(CT, rs=3)), (xs, xv, "기관명", CT), (xv, 1126, "기간", CT)], h=hrows[0])
        for j in (1, 2):
            prow(p, [(xs, xv, inp(f"{pre}경력기관#{j}", ex, align="center")), (xv, 1126, inp(f"{pre}경력기간#{j}", ex, align="center"))], h=hrows[0])
        prow(p, [(250, xs, "학력", dict(CT, rs=2)), (xs, xv, "학교", CT), (xv, 1126, "학과", CT)], h=hrows[0])
        prow(p, [(xs, xv, inp(pre + "학교", ex, align="center")), (xv, 1126, inp(pre + "학과", ex, align="center"))], h=hrows[0])
    r = prow(p, [(250, 420, "선임 등 연ㆍ월ㆍ일", LT), (420, 820, inp(pre + "선임일", ex, fmt=DT, align="left"), NB),
                 (820, 1126, inp(pre + "전담", ex, blank=JD0, dv=",".join(JD), align="right"), NB)], h=hrows[0])
    _bd(p, r, r, 250, 1126)


def bogo(bk, ex):
    p = g.pg(bk, ex, "보고서", fit=1, widths=WP)
    prow(p, [(120, 1126, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(120, 1126, TITLE, {"kind": "title", "size": 13})], h=24)
    hh = 15
    r = prow(p, [(120, 250, "본사", dict(LB, rs=3, size=9))] + pair(p, 0, 250, 330, 684, "사업장명", "사업장명", ex, align="left")
             + pair(p, 0, 684, 800, 1126, "사업자등록번호", "본사사업자", ex, ls=7.5, align="left"), h=hh)
    _bd(p, r, r, 250, 684)
    _bd(p, r, r, 684, 1126)
    r = prow(p, pair(p, 0, 250, 390, 684, "사업주 또는 대표자", "대표자", ex, ls=7.5, align="left") + pair(p, 0, 684, 760, 1126, "전화번호", "본사전화", ex, align="left"), h=hh)
    _bd(p, r, r, 250, 684)
    _bd(p, r, r, 684, 1126)
    r = prow(p, pair(p, 0, 250, 310, 1126, "소재지", "본사소재지", ex, align="left"), h=hh)
    _bd(p, r, r, 250, 1126)
    # 현장개요
    r = prow(p, [(120, 250, "현장개요", dict(LB, rs=8, size=9))] + pair(p, 0, 250, 410, 684, "현장명(사업개시번호)", "현장명", ex, ls=7, align="left", size=7)
             + pair(p, 0, 684, 985, 1126, "도급인 또는 건설공사시공주도총괄ㆍ관리자", "도급인", ex, ls=6.5, align="left", size=7), h=hh)
    _bd(p, r, r, 250, 684)
    _bd(p, r, r, 684, 1126)
    r = prow(p, pair(p, 0, 250, 330, 684, "전화번호", "현장전화", ex, align="left") + pair(p, 0, 684, 745, 1126, "소재지", "현장소재지", ex, align="left", size=7.5),
             h=hh)
    _bd(p, r, r, 250, 684)
    _bd(p, r, r, 684, 1126)
    r = prow(p, pair(p, 0, 250, 330, 684, "공사기간", "공사기간", ex, align="left", size=7.5)
             + [(684, 870, "공사금액(상시근로자 수)", dict(LT, size=6.5)), (870, 1030, inp("공사금액", ex, fmt=WON, align="right", size=7.5), NB), (1030, 1048, "(", LT),
                (1048, 1092, inp("근로자수", ex, fmt='#,##0;;""', align="center", size=7.5), NB), (1092, 1126, "명)", LT)], h=hh)
    _bd(p, r, r, 250, 684)
    _bd(p, r, r, 684, 1126)
    ck = {"kind": "free", "size": 7.5, "align": "left", "valign": "top", "border": False}
    hs = [28, 28, 16, 16, 16]
    r1 = None
    for j in range(5):
        if j < 4:
            a, b = 2 * j, 2 * j + 1
            items = [(344, 735, F(f"분류#{a + 1}", _box(a),
                                  align="left", size=7.5), ck),
                     (735, 1126, F(f"분류#{b + 1}", _box(b),
                                   align="left", size=7.5), ck)]
        else:
            items = [(344, 1126, F("분류#9", f'=IF({{셈!판정}}="{PD_N}","[√] ","[   ] ")&"{CAT[8]}"', align="left", size=7.5), ck)]
        if j == 0:
            items = [(250, 344, "유해위험\n방지계획서\n대상 분류", dict(CT, rs=5, size=8))] + items
        r = prow(p, items, h=hs[j])
        r1 = r if r1 is None else r1
    _bd(p, r1, r, 344, 1126)
    # 발주자 또는 시공주도 총괄ㆍ관리자
    r = prow(p, [(120, 250, "건설공사\n발주자\n또는\n건설공사\n시공주도\n총괄ㆍ관리자", dict(LB, rs=5, size=8))]
             + pair(p, 0, 250, 410, 682, "성명 또는 사업자명", "발주자", ex, ls=7.5, align="left") + pair(p, 0, 682, 750, 1126, "대표자", "발주대표", ex, align="left"), h=hh)
    _bd(p, r, r, 250, 682)
    _bd(p, r, r, 682, 1126)
    r = prow(p, pair(p, 0, 250, 480, 682, "법인등록번호(사업자등록번호)", "발주법인번호", ex, ls=6.5, align="left", size=7.5)
             + pair(p, 0, 682, 800, 1126, "사업장관리번호", "사업장관리번호", ex, ls=7.5, align="left"), h=hh)
    _bd(p, r, r, 250, 682)
    _bd(p, r, r, 682, 1126)
    r = prow(p, pair(p, 0, 250, 300, 682, "주소", "발주주소", ex, align="left", size=7.5) + pair(p, 0, 682, 750, 1126, "연락처", "발주연락처", ex, align="left"), h=hh)
    _bd(p, r, r, 250, 682)
    _bd(p, r, r, 682, 1126)
    gong = '"(공공)  "&' + '&"  "&'.join(f'IF({{셈!발주유형}}="{o}","[√] ","[   ] ")&"{o}"' for o in YT[:5])
    min_ = '"(민간)  "&' + '&"  "&'.join(f'IF({{셈!발주유형}}="{o}","[√] ","[   ] ")&"{o}"' for o in YT[5:])
    nb = {"kind": "free", "border": False}
    ra = prow(p, [(250, 303, "유형", dict(CT, rs=2)), (303, 1126, F("유형공공", "=" + gong, align="left", size=7.5), nb)], h=16)
    rb = prow(p, [(303, 1126, F("유형민간", "=" + min_, align="left", size=7.5), nb)], h=16)
    _bd(p, ra, rb, 303, 1126)
    prow(p, [(120, 1126, "※ 아래의 안전관리자, 보건관리자, 산업보건의가 2명 이상인 경우에는 별지에 추가로 적습니다.", {"kind": "free", "size": 7.5})], h=13)
    person(p, ex, "안전관리자", "안전", "세로", [hh])
    person(p, ex, "보건관리자", "보건", "머리", [hh])
    person(p, ex, "산업보건의", "의사", "머리", [hh])
    n = text_lines(STATEMENT, sum(WP) * 10.0 / 8.5)
    prow(p, [(120, 1126, STATEMENT, {"kind": "free", "size": 8.5})], h=max(26, n * 8.5 * 1.45 + 4))
    prow(p, [(120, 1126, inp("보고일", ex, blank="년          월          일", fmt="date", align="right", size=8.5), NB)], h=18)
    prow(p, [(120, 640, "", g.FR), (640, 860, "보고인(사업주 또는 대표자)", {"kind": "free", "size": 8.5, "align": "center"}),
             (860, 1010, inp("보고인", ex, align="center", size=8.5), NB), (1010, 1126, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=20)
    prow(p, [(120, 1126, "지방고용노동청장(지청장) 귀하", {"kind": "free", "size": 12, "bold": True})], h=24)
    prow(p, [(120, 1126, "작성방법 및 공지사항", {"kind": "head", "size": 8})], h=15)
    for t in HOW:
        n = text_lines(t, sum(WP) * 10.0 / 7.5)
        prow(p, [(120, 1126, t, {"kind": "text", "size": 7.5})], h=max(15, n * 7.5 * 1.45 + 4))
    prow(p, [(120, 1126, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["대상 분류 [√] 와 발주자 유형은 ① 장에서 정해집니다. 사람이 2명 이상이면 별지에 이어 적습니다(원문 ※)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    bogo(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _isnum(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _n(v):
    return v if _isnum(v) else 0


def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _y(d):
    return YOIL[(d.weekday() + 1) % 7]


def _shift(d):
    return d + datetime.timedelta(days=2 if d.weekday() == 5 else 1 if d.weekday() == 6 else 0)


def _conds(a):
    return {"높이": _n(a.get("높이")) >= 31, "연면적3만": _n(a.get("연면적")) >= 30000,
            "시설": _n(a.get("연면적")) >= 5000 and a.get("용도") not in (None, "", YD[7]), "냉동": a.get("냉동설비") == YN[0],
            "지간": _n(a.get("지간")) >= 50, "터널": a.get("터널") == YN[0], "댐": a.get("댐") == YN[0], "굴착": _n(a.get("굴착")) >= 10}


def expect(pages):
    a_in, s_in = pages["셈"], pages["보고서"]
    a, o = {}, {}
    T = datetime.timedelta
    c = _conds(a_in)
    anyin = (_n(a_in.get("높이")) > 0 or _n(a_in.get("연면적")) > 0 or a_in.get("용도") not in (None, "") or a_in.get("냉동설비") not in (None, "")
             or _n(a_in.get("지간")) > 0 or a_in.get("터널") not in (None, "") or a_in.get("댐") not in (None, "") or _n(a_in.get("굴착")) > 0)
    if not anyin:
        a["판정"] = ""
    elif any(c.values()):
        a["판정"] = PD_Y + ("".join(f" · {SC[j]}({CAT_LAW[j][9:]})" for j, k in enumerate(CK) if c[k]))[3:403]
    else:
        a["판정"] = PD_N
    for who, k in (("안전관리자", "안전선임일"), ("보건관리자", "보건선임일"), ("산업보건의", "의사선임일")):
        d = _d(s_in.get(k))
        if not d:
            a[f"기한{who}"] = ""
        else:
            due = _shift(d + T(days=14))
            a[f"기한{who}"] = f"{who}{GH_A}{_ymd(d)}{GH_B}{_ymd(due)}({_y(due)}){GH_C}{GH_LAW[who]}"
    miss_c = {"사업장명": not s_in.get("사업장명"), "본사 사업자등록번호": not s_in.get("본사사업자"), "사업주 또는 대표자": not s_in.get("대표자"),
              "현장명": not s_in.get("현장명"), "현장 소재지": not s_in.get("현장소재지"), "공사기간": not s_in.get("공사기간"),
              "대상 분류(① 장)": not anyin, "발주자 유형(① 장)": not a_in.get("발주유형"), "발주자 성명 또는 사업자명": not s_in.get("발주자"),
              "선임 등 연ㆍ월ㆍ일": not (_d(s_in.get("안전선임일")) or _d(s_in.get("보건선임일")) or _d(s_in.get("의사선임일")))}
    if not s_in.get("사업장명") and not s_in.get("현장명"):
        a["빈칸"] = ""
    else:
        miss = [n for n, _ in BIN if miss_c[n]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
    pd = a["판정"]
    for j in range(8):
        o[f"분류#{j + 1}"] = ("[   ] " if pd == "" else ("[√] " if c[CK[j]] else "[   ] ")) + CAT[j]
    o["분류#9"] = ("[√] " if pd == PD_N else "[   ] ") + CAT[8]
    yt = a_in.get("발주유형")
    o["유형공공"] = "(공공)  " + "  ".join(("[√] " if yt == x else "[   ] ") + x for x in YT[:5])
    o["유형민간"] = "(민간)  " + "  ".join(("[√] " if yt == x else "[   ] ") + x for x in YT[5:])
    return {"셈": a, "보고서": o}


for _t in (PD_Y, PD_N, GH_A, GH_B, GH_C, *GH_LAW.values(), BIN_OK, BIN_A, *CAT, *SC):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _t in (*YT, *YN, *YD, *JD):
    assert "," not in _t and '"' not in _t, _t
