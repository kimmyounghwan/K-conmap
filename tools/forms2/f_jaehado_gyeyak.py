# -*- coding: utf-8 -*-
"""건설공사의 재하도급 계약통보서 — 새로 만든 서식 (2026-11-16 G726 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 재하도급률(B/A) · 재하도급 공사기간 점검 · 사회보험료 반영금액(노무비 × 요율, 원 미만 버림) · 통보 기한(영 제32조제1항 — 계약한 날부터
     30일 이내 · 첫날 빼고 셈 민법 제157조) · 감리자 통보 간주(제2항) · 통보 안 하는 경우(법 제29조제6항 단서) · 붙일 서류 · 아직 안 적은 칸
   · 통보서(건설산업기본법 시행규칙 [별지 제23호의3서식] <개정 2021.8.27.> 칸 차례 그대로 — 세로 한 쪽 · 왼쪽 · 오른쪽 테 없음(원문 그대로)).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — 표 x 120~1118
   (세로줄 276 · 513 · 700 · 839 · 978 · 첨부 242 / 굵은 가로줄 211 · 1269).

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G726_재하도급계약통보_원문.txt — 글층 해시 같음 확인):
  · 건설산업기본법 [시행 2025. 11. 27.] 제29조 ⑥ 하도급(제3항 단서에 따라 다시 하도급하는 것 포함)한 건설사업자는 대통령령으로 정하는 바에 따라
    발주자에게 통보 — 단서 1. 제2항 단서 · 제3항제1호 · 제5항 단서에 따라 발주자가 서면 승낙 2. 사전승인 조건이면 통보 안 함
  · 시행령 [시행 2026. 6. 23.] 제32조(① 하도급계약을 체결하거나 다시 하도급하는 것을 승낙한 날부터 30일 이내 · 변경 · 해제도 같음
    ② 감리자가 있는 공사는 기한 안에 감리자에게 통보하면 발주자에게 통보한 것으로 봄)
  · 시행규칙 [시행 2026. 1. 2.] 제26조(① 재하도급계약의 통보는 별지 제23호의3서식(건설산업종합정보망 통보 포함) ② 붙일 서류 1~6)
■ 원문 그대로: ⑭ «산재재해보상보험» · 첨부 2 «공사량(규모)·공사단가» · 첨부 4 «증빙서류» · 아래 «210mm×297mm[일반용지 60g/㎡(재활용품)]».
■ 짐작 안 함: 30일째가 토 · 일요일이어도 날을 늘려 셈하지 않음(«그 전 평일에 내면 안전» 글로만) · 재하도급률은 셈만 하고 82% 같은 판정은 안 함
  (영 제34조는 «하도급계약금액» 대상 — 재하도급에 그대로 쓴다는 글이 없음) · 요율은 빈 서식에 미리 넣지 않음(해마다 바뀜 — 내역서 요율을 적음)."""
import datetime
from decimal import ROUND_HALF_UP, Decimal

import sgw as g
from fb import TR, F, I, text_lines
from sgw import L

SLUG = "jaehado-gyeyak"
TITLE = "건설공사의 재하도급 계약통보서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "건설공사의 재하도급 계약통보서(건설산업기본법 시행규칙 별지 제23호의3서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "건설공사의 재하도급 계약통보서 — 작성 예시 (⑪ 금액 · 재하도급률 · ⑫ 공사기간 · ⑬~⑱ 사회보험료가 ① 장에서 저절로)"),
        (3, "① 재하도급률 · 공사기간 · 사회보험료 · 통보 기한 30일 — 작성 예시")]
MULTI = True
SHORT = ("건설공사의 재하도급 계약통보서(건설산업기본법 시행규칙 별지 제23호의3서식) — 금액을 적으면 재하도급률(B/A)이, 노무비와 요율을 적으면 "
         "사회보험료 반영금액이, 계약일을 적으면 30일 이내 통보 기한이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
WON = '#,##0"원";;""'

BR_A, BR_B = "재하도급률 ", "% — B ÷ A × 100(소수 둘째 자리 반올림) · 통보서 ⑪ 칸에 들어감"
BR_Q = "⚠ 재하도급 금액(B)이 하도급액(A)보다 큽니다 — 재하도급률 "
GG_A, GG_B = "✓ 착공(예정) ", " ~ 준공(예정) "
GG_REV = "⚠ 준공(예정)일이 착공(예정)일보다 앞섭니다"
GH_A = "계약한 날부터 30일 이내 통보(영 제32조제1항 · 첫날 빼고 셈 — 민법 제157조) — 계약일 "
GH_B = " → 늦어도 "
GH_C = "까지"
GH_SAT = " — 토요일이니 그 전 평일에 내면 안전"
GH_SUN = " — 일요일이니 그 전 평일에 내면 안전"
GH_OK = " · ✓ 통보일이 기한 안"
GH_LATE = " · ⚠ 통보일이 기한을 넘김"
GAMRI = "※ 감리자가 있는 공사는 기한 안에 감리자에게 통보하면 발주자에게 통보한 것으로 봄(영 제32조제2항) · 재하도급 계약을 변경 · 해제한 때에도 30일 이내(제1항 후단)"
MYEONJE = ("※ 발주자가 재하도급을 서면으로 승낙한 경우(법 제29조제3항제1호) 등은 통보하지 않음(법 제29조제6항 단서) · "
           "건설산업종합정보망을 이용한 통보도 됨(규칙 제26조제1항)")
SEORYU = ("붙일 서류(서식 첨부서류란 · 규칙 제26조제2항) — 1. 재하도급계약서 사본 · 2. 공사내역서 · 3. 예정공정표 · "
          "4. 재하도급대금지급보증서 교부의무가 면제되면 그 증빙서류 · 5. 현장설명서(실시한 경우) · 6. 공동도급이면 협정서 사본")
SAHOE = ("반영금액 = 직접노무비(또는 노무비) × 반영요율, 원 미만 버림. ⑰ 노인장기요양보험료는 원가계산에서 건강보험료 × 요율이므로 "
         "노무비 칸에 ⑯ 반영금액(건강보험료)을 적으면 그대로 셈됩니다. 보험료를 일괄 부담하면 부담방법은 «일괄»만 고릅니다(서식 아래 *).")
BIN_OK = "✓ 통보서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ⑬~⑱ — (서식 칸 이름 · ① 장 이름 · 부담방법 [ ]일괄 [ ]개별 칸이 있는지)
INS = [("⑬  고용보험", "⑬ 고용보험", True), ("⑭  산재재해보상보험", "⑭ 산재보험", True), ("⑮  국민연금보험", "⑮ 국민연금", False),
       ("⑯  국민건강보험", "⑯ 건강보험", False), ("⑰  노인장기요양보험", "⑰ 노인장기요양", False), ("⑱  퇴직공제부금", "⑱ 퇴직공제부금", True)]
NI = len(INS)
CHOICE = [i for i, (_, _, c) in enumerate(INS, 1) if c]

EX = {"하도급액": 262000000, "재하도급액": 230000000, "재착공": D(2027, 6, 1), "재준공": D(2027, 9, 30), "계약일": D(2027, 5, 17),
      "노무비#1": 93890000, "요율#1": 0.0101, "부담#1": "일괄",
      "노무비#2": 93890000, "요율#2": 0.0356, "부담#2": "일괄",
      "노무비#3": 82000000, "요율#3": 0.0475,
      "노무비#4": 82000000, "요율#4": 0.03595,
      "노무비#5": 2947900, "요율#5": 0.1314,
      "노무비#6": 82000000, "요율#6": 0.023, "부담#6": "개별"}
EX_S = {"공사명": "가나시 하수관로 정비공사", "수급상호": "다라건설(주) 대표 최지훈", "수급소재지": "가나도 다라시 사아로 7",
        "하수급상호": "마바토건(주) 대표 서다온", "하수급소재지": "가나도 마바시 공단로 21",
        "재하도급사유": "특허 공법(합성보) 전문 시공 필요 — 수급인 서면 승낙",
        "재하수급상호": "사아특수공법(주) 대표 문가온", "재하수급업종": "철근 · 콘크리트공사업 / 0000-00", "재하수급소재지": "가나도 사아시 하하로 8",
        "공종": "교량 상부 합성보 제작 · 설치", "재하도급내용": "합성보(L=30m) 12본 제작 · 운반 · 설치", "제출일": D(2027, 5, 31), "발주자": "가나시장"}
HEAD = "■ 건설산업기본법 시행규칙 [별지 제23호의3서식] <개정 2021. 8. 27.>"
STATEMENT = "「건설산업기본법」 제29조제6항에 따라 건설공사의 재하도급 계약내용을 통보합니다."
NOTE_STAR = "* ⑬~⑱에서 보험료를 일괄 부담할 경우에는 부담방법 중 일괄란에만 표시합니다."
ATTACH = ("1. 재하도급계약서(변경계약서를 포함하고, 특수조건이 있는 경우 특수조건을 포함합니다) 사본 1부\n"
          "2. 공사량(규모)·공사단가 및 공사금액 등이 분명하게 적힌 공사내역서\n"
          "3. 예정공정표\n"
          "4. 재하도급대금지급보증서 교부의무가 면제되는 경우에는 그 증빙서류\n"
          "5. 현장설명서(현장설명을 실시한 경우만 해당합니다)\n"
          "6. 공동도급인 경우 공동수급체 구성원 간에 체결한 협정서 사본. 다만, 별지 제17호서식의 건설공사대장에 해당 협정서의 내용을 "
          "첨부한 경우는 제외합니다.")
PAPER = "210mm×297mm[일반용지 60g/㎡(재활용품)]"


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


def box(p, r1, r2, x1, x2):
    """칸 테 — 원문처럼 표 맨 왼쪽(x 120) · 맨 오른쪽(x 1118) 세로줄은 긋지 않음"""
    _bd(p, r1, r2, x1, x2, left=(x1 != X1), right=(x2 != X2))


LB = {"kind": "label", "size": 9, "border": False}
LT = {"kind": "free", "size": 9, "align": "left"}
LC = {"kind": "free", "size": 8.5, "align": "center"}
NB = {"border": False}
FB = {"kind": "free", "size": 8}


def inp(k, ex, **kw):
    kw.setdefault("size", 9)
    return I(k, ex=_e(ex, k), **kw)


A, B, S0, E0, KD, QD = "{하도급액}", "{재하도급액}", "{재착공}", "{재준공}", "{계약일}", "{통보서!제출일}"
DUE = f"({KD}+30)"
RATIO = f"ROUND({B}/{A}*100,2)"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  재하도급 계약 — 재하도급률 · 사회보험료 · 통보 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 하도급받은 공사의 일부를 다시 하도급한 건설사업자(하수급인)는 재하도급 계약을 맺은 날부터 30일 이내에 발주자에게 통보합니다"
              "(건설산업기본법 제29조제6항 · 시행령 제32조제1항).")
    s7 = {"kind": "text", "size": 7}
    sz = {"kind": "text", "size": 7.5}
    g.sec(p, "㉮  ⑪ 재하도급 금액 · 재하도급률", need=24 * 3 + 10)
    p.row([(3, "하도급액(재하도급 부분)(A)", dict(L, size=8.5)), (5, I("하도급액", ex=_ex(ex, "하도급액"), fmt=WON, align="right", size=9)),
           (4, "하도급받은 금액 중 다시 하도급하는 부분의 금액", s7)], h=24)
    p.row([(3, "재하도급(예정) 금액(B)", dict(L, size=8.5)), (5, I("재하도급액", ex=_ex(ex, "재하도급액"), fmt=WON, align="right", size=9)),
           (4, "재하수급인과 맺은(맺을) 금액", s7)], h=24)
    br = (f'=IF(OR(N({A})=0,N({B})=0),"",IF({B}>{A},"{BR_Q}"&{RATIO}&"%","{BR_A}"&{RATIO}&"{BR_B}"))')
    p.row([(3, "재하도급률(B/A)", dict(L, size=8.5)), (9, F("비율", br, align="left", size=8.5, bold=True))], h=24)
    g.sec(p, "㉯  ⑫ 재하도급 공사기간", need=24 * 3 + 10)
    p.row([(3, "착공(예정)", L), (5, I("재착공", ex=_ex(ex, "재착공"), fmt=DT, align="center", size=9)), (4, "재하도급 공사를 시작하는 날", s7)], h=22)
    p.row([(3, "준공(예정)", L), (5, I("재준공", ex=_ex(ex, "재준공"), fmt=DT, align="center", size=9)), (4, "재하도급 공사를 마치는 날", s7)], h=22)
    gg = (f'=IF(OR(N({S0})=0,N({E0})=0),"",IF({E0}<{S0},"{GG_REV}","{GG_A}"&' + _ymdf(S0) + f'&"{GG_B}"&' + _ymdf(E0) + '))')
    p.row([(3, "기간 점검", L), (9, F("기간", gg, align="left", size=8.5))], h=24)
    g.sec(p, "㉰  ⑬~⑱ 사회보험료 — 반영금액 = 노무비 × 요율(원 미만 버림)", need=22 * (NI + 2) + 50)
    p.row([(3, "보험", L), (3, "직접노무비 또는 노무비", dict(L, size=8.5)), (2, "반영요율", L), (2, "반영금액", L), (2, "부담방법", L)], h=22)
    for i, (_, nm, ch) in enumerate(INS, 1):
        bs, rt = f"{{노무비#{i}}}", f"{{요율#{i}}}"
        last = ((2, I(f"부담#{i}", ex=_ex(ex, f"부담#{i}"), dv="일괄,개별", align="center", size=9)) if ch
                else (2, "—", {"kind": "ctext", "size": 9}))
        p.row([(3, nm, dict(L, size=8.5)),
               (3, I(f"노무비#{i}", ex=_ex(ex, f"노무비#{i}"), fmt=WON, align="right", size=9)),
               (2, I(f"요율#{i}", ex=_ex(ex, f"요율#{i}"), fmt="rate", rate=True, align="center", size=9)),
               (2, F(f"반영#{i}", f'=IF(OR(N({bs})=0,N({rt})=0),"",{TR(bs + "*" + rt)})', fmt=WON, align="right", size=9)),
               last], h=22)
    tot = "+".join(f"N({{반영#{i}}})" for i in range(1, NI + 1))
    p.row([(3, "반영금액 합계", L), (5, "", {"kind": "text"}), (2, F("반영합", "=" + tot, fmt=WON, align="right", size=9, bold=True)), (2, "", {"kind": "text"})],
          h=22)
    p.row([(12, SAHOE, sz)])
    g.sec(p, "㉱  통보 기한 (영 제32조)", need=26 * 3 + 10)
    p.row([(3, "재하도급 계약일", L), (5, I("계약일", ex=_ex(ex, "계약일"), fmt=DT, align="center", size=9)), (4, "재하수급인과 계약을 맺은 날", s7)], h=24)
    f = (f'=IF(N({KD})=0,"","{GH_A}"&' + _ymdf(KD) + f'&"{GH_B}"&' + _ymdf(DUE) + '&"("&' + _yo(DUE) + f'&")"&"{GH_C}"'
         f'&IF(WEEKDAY({DUE})=7,"{GH_SAT}",IF(WEEKDAY({DUE})=1,"{GH_SUN}",""))'
         f'&IF(N({QD})=0,"",IF(N({QD})<=N({DUE}),"{GH_OK}","{GH_LATE}")))')
    p.row([(3, "통보 기한", L), (9, F("기한", f, align="left", size=8.5))], h=46)
    p.row([(3, "", L), (9, GAMRI, sz)])
    p.row([(3, "", L), (9, MYEONJE, sz)])
    g.sec(p, "㉲  붙일 서류 · 아직 안 적은 칸", need=46 * 2 + 10)
    p.row([(3, "붙일 서류", L), (9, SEORYU, sz)])
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({통보서!공사명}="",{통보서!하수급상호}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 통보서 ⑪ 금액 · 재하도급률, ⑫ 공사기간, ⑬~⑱ 사회보험료는 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


BIN = [("① 공사명", '{통보서!공사명}=""'), ("② 수급인 상호 및 대표자", '{통보서!수급상호}=""'), ("④ 하수급인 상호 및 대표자", '{통보서!하수급상호}=""'),
       ("⑥ 재하도급 사유", '{통보서!재하도급사유}=""'), ("⑦ 재하수급인 상호 및 대표자", '{통보서!재하수급상호}=""'),
       ("⑧ 업종 및 등록번호", '{통보서!재하수급업종}=""'), ("⑩ 공종", '{통보서!공종}=""'), ("⑪ 재하도급 내용", '{통보서!재하도급내용}=""'),
       ("⑪ 금액(① 장)", f'OR(N({A})=0,N({B})=0)'), ("⑫ 공사기간(① 장)", f'OR(N({S0})=0,N({E0})=0)'), ("재하도급 계약일(① 장)", f'N({KD})=0')]


# ── 통보서 ──────────────────────────────────────────────────────────────
def form(bk, ex):
    from openpyxl.styles import Side
    p = g.pg(bk, ex, "통보서", fit=1, widths=WP)
    thick = Side(style="medium", color="000000")
    prow(p, [(X1, X2, HEAD, {"kind": "free", "size": 8})], h=14)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center"})], h=36)
    r0 = prow(p, [(X1, 276, "", FB), (276, 513, "①  공사명", LT), (513, X2, inp("공사명", ex, align="left"), NB)], h=20)
    box(p, r0, r0, X1, 513)
    box(p, r0, r0, 513, X2)
    groups = [("수급인", [("②  상호 및 대표자", "수급상호", 21), ("③  영업소 소재지", "수급소재지", 20.5)]),
              ("하수급인", [("④  상호 및 대표자", "하수급상호", 20.5), ("⑤  영업소 소재지", "하수급소재지", 20.5), ("⑥  재하도급 사유", "재하도급사유", 20.5)]),
              ("재하수급인", [("⑦  상호 및 대표자", "재하수급상호", 20.5), ("⑧  업종 및 등록번호", "재하수급업종", 20.5), ("⑨  영업소 소재지", "재하수급소재지", 21)])]
    for lab, rows in groups:
        rr = []
        for j, (t, k, h) in enumerate(rows):
            its = ([(X1, 276, lab, dict(LB, rs=len(rows)))] if j == 0 else []) + [(276, 513, t, LT), (513, X2, inp(k, ex, align="left", size=8.5), NB)]
            r = prow(p, its, h=h)
            box(p, r, r, 276, 513)
            box(p, r, r, 513, X2)
            rr.append(r)
        box(p, rr[0], rr[-1], X1, 276)
    # 재하도급 내용 — ⑩ · ⑪(4줄) · ⑫(2줄) · 사회보험료 머리 · ⑬~⑱ · * 줄
    nrow = 1 + 4 + 2 + 1 + sum(2 if c else 1 for _, _, c in INS) + 1
    s1 = prow(p, [(X1, 276, "재하도급\n내용", dict(LB, rs=nrow)), (276, 513, "⑩  공종", LT), (513, X2, inp("공종", ex, align="left", size=8.5), NB)], h=20)
    box(p, s1, s1, 276, 513)
    box(p, s1, s1, 513, X2)
    won = 'IF(N({{셈!{k}}})=0,"",TEXT({{셈!{k}}},"#,##0")&"원")'
    s2 = prow(p, [(276, 513, "⑪  재하도급 내용", dict(LT, rs=4)),
                  (513, X2, F("하도급액표시", '="하도급액(재하도급 부분)(A): "&' + won.format(k="하도급액"), align="left", size=8.5), NB)], h=17.5)
    prow(p, [(513, X2, F("재하도급표시", '="재하도급(예정) 금액(B): "&' + won.format(k="재하도급액"), align="left", size=8.5), NB)], h=17.5)
    prow(p, [(513, X2, F("비율표시", '="재하도급률(B/A): "&IF(OR(N({셈!하도급액})=0,N({셈!재하도급액})=0),"",ROUND({셈!재하도급액}/{셈!하도급액}*100,2)&"%")',
                         align="left", size=8.5), NB)], h=17.5)
    prow(p, [(513, 650, "재하도급 내용:", dict(LT, size=8.5)), (650, X2, inp("재하도급내용", ex, align="left", size=8.5), NB)], h=18)
    box(p, s2, s2 + 3, 276, 513)
    box(p, s2, s2 + 3, 513, X2)
    ymd = '"{t}: "&IF(N({{셈!{k}}})=0,"",YEAR({{셈!{k}}})&". "&MONTH({{셈!{k}}})&". "&DAY({{셈!{k}}})&".")'
    s3 = prow(p, [(276, 513, "⑫  재하도급 공사기간", dict(LT, rs=2)),
                  (513, X2, F("착공표시", "=" + ymd.format(t="착공(예정)", k="재착공"), align="left", size=8.5), NB)], h=17.5)
    prow(p, [(513, X2, F("준공표시", "=" + ymd.format(t="준공(예정)", k="재준공"), align="left", size=8.5), NB)], h=17.5)
    box(p, s3, s3 + 1, 276, 513)
    box(p, s3, s3 + 1, 513, X2)
    hd = prow(p, [(276, 513, "사회보험료", dict(LC, size=9)), (513, 700, "직접노무비 또는\n노무비", LC), (700, 839, "반영\n요율", LC),
                  (839, 978, "반영금액", LC), (978, X2, "부담방법", LC)], h=32)
    for x1, x2 in ((276, 513), (513, 700), (700, 839), (839, 978), (978, X2)):
        box(p, hd, hd, x1, x2)
    for i, (lab, _, ch) in enumerate(INS, 1):
        rs = 2 if ch else 1
        nm = F(f"노무비표시#{i}", "=" + won.format(k=f"노무비#{i}"), align="right", size=8.5)
        rt = F(f"요율표시#{i}", f'=IF(N({{셈!요율#{i}}})=0,"",{{셈!요율#{i}}})', fmt="rate", align="center", size=8.5)
        am = F(f"반영표시#{i}", "=" + won.format(k=f"반영#{i}"), align="right", size=8.5)
        last = (F(f"부담일괄#{i}", f'=IF({{셈!부담#{i}}}="일괄","[√] 일괄","[   ] 일괄")', align="center", size=8.5) if ch else "")
        ra = prow(p, [(276, 513, lab, dict(LT, rs=rs)), (513, 700, nm, dict(NB, rs=rs)), (700, 839, rt, dict(NB, rs=rs)), (839, 978, am, dict(NB, rs=rs)),
                      (978, X2, last, NB if ch else FB)], h=17.5 if ch else 18)
        if ch:
            prow(p, [(978, X2, F(f"부담개별#{i}", f'=IF({{셈!부담#{i}}}="개별","[√] 개별","[   ] 개별")', align="center", size=8.5), NB)], h=17.5)
        for x1, x2 in ((276, 513), (513, 700), (700, 839), (839, 978), (978, X2)):
            box(p, ra, ra + rs - 1, x1, x2)
    rn = prow(p, [(276, X2, NOTE_STAR, {"kind": "free", "size": 8})], h=17)
    box(p, rn, rn, 276, X2)
    box(p, s1, rn, X1, 276)
    _bd(p, r0, r0, X1, X2, bot=False, left=False, right=False, side=thick)
    p.gap(4)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 9.5, "indent": 2})], h=20)
    p.gap(8)
    prow(p, [(X1, X2, inp("제출일", ex, blank="년          월          일", fmt="date", align="right", size=9.5), NB)], h=20)
    p.gap(12)
    prow(p, [(X1, 592, "", FB), (592, 673, "하수급인", {"kind": "free", "size": 9.5, "align": "center"}),
             (673, 978, F("하수급인표시", '=IF({하수급상호}="","",{하수급상호})', align="center", size=8.5), NB),
             (978, X2, "(서명 또는 인)", {"kind": "free", "size": 8, "align": "right"})], h=22)
    p.gap(12)
    prow(p, [(X1, 300, inp("발주자", ex, align="right", size=11, bold=True), NB), (300, 380, "귀하", {"kind": "free", "size": 12, "bold": True})], h=22)
    r = prow(p, [(X1, X2, "", FB)], h=4)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=thick)
    p.gap(14)
    a, b = GX.cols(242, X2)
    na_ = text_lines(ATTACH, sum(WP[a - 1:b]) * 10.0 / 8)
    ra = prow(p, [(X1, 242, "첨부서류", {"kind": "free", "size": 8.5, "align": "center"}),
                  (242, X2, ATTACH, {"kind": "free", "size": 8, "valign": "center"})], h=max(84, na_ * 8 * 1.45 + 10))
    box(p, ra, ra, X1, 242)
    box(p, ra, ra, 242, X2)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 7, "align": "right"})], h=14)
    p.end_print()
    p.after_note(["⑪ 금액 · 재하도급률, ⑫ 공사기간, ⑬~⑱ 사회보험료는 ① 장에서 들어옵니다. 하수급인 칸에는 ④ 상호 및 대표자가 들어갑니다. "
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
    """엑셀 ROUND(x, 2) 를 글로 — 끝 0 없음(87.79 · 20 · 18.4)"""
    v = float(Decimal(repr(x)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    return str(int(v)) if v.is_integer() else (f"{v:.2f}".rstrip("0").rstrip("."))


def _won(v):
    """엑셀 TEXT(x,"#,##0")&"원" — 반올림(절반 올림)"""
    if not v:
        return ""
    return f"{int(Decimal(repr(v)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)):,}원"


def expect(pages):
    sm, sg = pages["셈"], pages["통보서"]
    a, b = {}, {}
    av, bv = _n(sm.get("하도급액")), _n(sm.get("재하도급액"))
    if not (av and bv):
        a["비율"] = ""
    elif bv > av:
        a["비율"] = BR_Q + _r2(bv / av * 100) + "%"
    else:
        a["비율"] = BR_A + _r2(bv / av * 100) + BR_B
    s, e = _d(sm.get("재착공")), _d(sm.get("재준공"))
    if not (s and e):
        a["기간"] = ""
    elif e < s:
        a["기간"] = GG_REV
    else:
        a["기간"] = GG_A + _ymd(s) + GG_B + _ymd(e)
    tot = 0
    for i in range(1, NI + 1):
        bs, rt = _n(sm.get(f"노무비#{i}")), _n(sm.get(f"요율#{i}"))
        v = int(Decimal(repr(round(bs * rt, 6))).to_integral_value(rounding="ROUND_FLOOR")) if (bs and rt) else ""
        a[f"반영#{i}"] = v
        tot += v or 0
        b[f"노무비표시#{i}"] = _won(bs)
        b[f"요율표시#{i}"] = rt if rt else ""
        b[f"반영표시#{i}"] = _won(v) if v != "" else ""
    a["반영합"] = tot
    for i in CHOICE:
        mth = sm.get(f"부담#{i}")
        b[f"부담일괄#{i}"] = "[√] 일괄" if mth == "일괄" else "[   ] 일괄"
        b[f"부담개별#{i}"] = "[√] 개별" if mth == "개별" else "[   ] 개별"
    kd, qd = _d(sm.get("계약일")), _d(sg.get("제출일"))
    if not kd:
        a["기한"] = ""
    else:
        due = kd + datetime.timedelta(days=30)
        t = f"{GH_A}{_ymd(kd)}{GH_B}{_ymd(due)}({YO[due.weekday()]}){GH_C}"
        t += GH_SAT if due.weekday() == 5 else (GH_SUN if due.weekday() == 6 else "")
        if qd:
            t += GH_OK if qd <= due else GH_LATE
        a["기한"] = t
    if not sg.get("공사명") and not sg.get("하수급상호"):
        a["빈칸"] = ""
    else:
        mc = {"① 공사명": not sg.get("공사명"), "② 수급인 상호 및 대표자": not sg.get("수급상호"), "④ 하수급인 상호 및 대표자": not sg.get("하수급상호"),
              "⑥ 재하도급 사유": not sg.get("재하도급사유"), "⑦ 재하수급인 상호 및 대표자": not sg.get("재하수급상호"),
              "⑧ 업종 및 등록번호": not sg.get("재하수급업종"), "⑩ 공종": not sg.get("공종"), "⑪ 재하도급 내용": not sg.get("재하도급내용"),
              "⑪ 금액(① 장)": not (av and bv), "⑫ 공사기간(① 장)": not (s and e), "재하도급 계약일(① 장)": not kd}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    b["하도급액표시"] = "하도급액(재하도급 부분)(A): " + _won(av)
    b["재하도급표시"] = "재하도급(예정) 금액(B): " + _won(bv)
    b["비율표시"] = "재하도급률(B/A): " + ((_r2(bv / av * 100) + "%") if (av and bv) else "")
    b["착공표시"] = "착공(예정): " + (_ymd(s) if s else "")
    b["준공표시"] = "준공(예정): " + (_ymd(e) if e else "")
    b["하수급인표시"] = sg.get("하수급상호") or ""
    return {"셈": a, "통보서": b}


for _t in (BR_A, BR_B, BR_Q, GG_A, GG_B, GG_REV, GH_A, GH_B, GH_C, GH_SAT, GH_SUN, GH_OK, GH_LATE, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
