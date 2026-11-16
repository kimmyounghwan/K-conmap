# -*- coding: utf-8 -*-
"""공사기간 연장 요청서(산업안전보건법) — 새로 만든 서식 (2026-11-16 G703 · 소장님 「오늘 중으로 다 만들자. 서식」 — 101종 첫 묶음)
   → ① 누가 · 누구에게(법 제70조 — 건설공사도급인 → 건설공사발주자 · 관계수급인 → 건설공사도급인 · 규칙 제87조제1항 · 제2항) ·
     늦어진 사유(제70조제1항제1호 불가항력 · 제2호 발주자 책임 · 제2항 도급인 책임) · 연장 일수 → 변경 공사기간 ·
     제출 기한(사유가 끝난 날부터 10일이 되는 날까지 · 단서 계약기간 만료 전 통지) · 받은 쪽 처리(규칙 제87조제3항 ~ 제5항) ·
     과태료(법 제175조제4항제3호) · 아직 안 적은 칸
   · 요청서(산업안전보건법 시행규칙 [별지 제35호서식] 칸 차례 그대로 — 한 쪽 서식).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).

근거(국가법령정보센터 · 2026-11-16 · 메모 /home/claude/g10/notes/G703_공기연장_근거.md · 원문 글층 G703_공기연장_원문.txt):
  · 산업안전보건법 [시행 2026. 10. 27.] 제2조제9호(관계수급인) · 제10호(건설공사발주자) · 제69조제1항(건설공사도급인 뜻) ·
    제70조(건설공사 기간의 연장) ① 1호 · 2호 ② ③ · 제175조제4항제3호(제70조제1항 · 제2항 후단 — 1천만원 이하 과태료)
  · 시행규칙 [시행 2026. 8. 1.] 제87조(공사기간 연장 요청 등) ① 별지 제35호서식 + 첨부 1 · 2 · 단서(만료 전 통지) ② ③ ④ ⑤
■ 짐작 안 함: «10일이 되는 날» · «30일 이내» · «10일 이내» 는 첫날 빼고 셈(민법 제157조) — 기한 끝날이 토요일 · 일요일이면 그다음 월요일까지 기한 안,
  공휴일은 글로만 알림(민법 제161조) · 변경 공사기간 = 지금 준공일 + 연장 일수(정수) · 받은 쪽 기한은 «제출일에 받으면» 으로 셈(글에 밝힘)."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import FR, L

SLUG = "sanan-gonggi-yeonjang"
TITLE = "공사기간 연장 요청서(산업안전보건법)"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "공사기간 연장 요청서(산업안전보건법 시행규칙 별지 제35호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "공사기간 연장 요청서 — 작성 예시 (연장 일수 · 변경 공사기간 · 공사기간이 ① 장에서 저절로)"),
        (3, "① 누가 · 누구에게 · 제출 기한 · 변경 공사기간 — 작성 예시 (가상의 체육관 신축 · 집중호우 · 폭염)")]
MULTI = True
SHORT = ("공사기간 연장 요청서(산업안전보건법 시행규칙 별지 제35호서식) — 요청인과 늦어진 사유를 고르면 누구에게 내는지와 근거 조항(법 제70조)이, "
         "사유가 끝난 날을 적으면 제출 기한(10일이 되는 날 · 규칙 제87조)이 나오고, 연장 일수를 적으면 변경 공사기간이 요청서에 저절로 들어갑니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
WON = '#,##0"원";;""'
DAYS = '#,##0"일";;""'
YOIL = "일월화수목금토"

YC = ["건설공사도급인", "관계수급인"]
SY = ["불가항력(악천후 · 지진 · 화재 등)", "발주자 책임 — 착공 지연 · 시공 중단", "도급인 책임 — 착공 지연 · 시공 중단"]
IJ = ["아니요 — 계약기간 안에 끝남", "예 — 계약기간 만료 뒤에도 이어질 듯"]

# 판정 · 안내 글(셈 · 파이썬 같은 글)
PJ_A = "건설공사발주자에게 냄(규칙 제87조제1항) — "
PJ_B = "건설공사도급인에게 냄(규칙 제87조제2항) — "
PJ_A1 = "법 제70조제1항제1호(불가항력) · 발주자는 특별한 사유가 없으면 공사기간을 연장해야 함"
PJ_A2 = "법 제70조제1항제2호(발주자 책임으로 착공 지연 · 시공 중단) · 발주자는 특별한 사유가 없으면 공사기간을 연장해야 함"
PJ_B1 = "법 제70조제2항(제1항제1호 불가항력) · 도급인은 특별한 사유가 없으면 공사기간을 연장하거나 발주자에게 연장을 요청해야 함"
PJ_B3 = "법 제70조제2항(도급인 책임으로 착공 지연 · 시공 중단) · 도급인은 특별한 사유가 없으면 공사기간을 연장하거나 발주자에게 연장을 요청해야 함"
PJ_Q = "늦어진 사유를 고르면 근거 조항이 나옵니다"
PJ_A3 = "⚠ 건설공사도급인 자신에게 책임이 있는 사유는 법 제70조제1항의 연장 사유가 아님(제1호 불가항력 · 제2호 발주자 책임만)"
PJ_B2 = ("⚠ 관계수급인이 요청하는 사유는 불가항력(제1항제1호)과 건설공사도급인 책임(법 제70조제2항) — 발주자 책임이면 건설공사도급인이 "
         "발주자에게 요청(제1항제2호)")
PJ_NEED = "⚠ 요청인을 고르면 받는 이와 근거 조항이 나옵니다"
YH_NEED_N = "⚠ 연장 일수를 적으면 변경 공사기간을 셉니다"
YH_NEED_J = "⚠ 지금 준공일을 적으면 변경 공사기간을 셉니다"
YH_REV = "⚠ 준공일이 착공일보다 빠릅니다"
YH_OK = "일 연장 · 요청서 «연장 일수 · 변경 공사기간» 에 들어감"
SG_REV = "⚠ 사유가 끝난 날이 시작일보다 빠릅니다"
SG_A, SG_B = "사유가 이어진 날 ", "일(시작일 · 끝난 날 모두 셈) — 연장 일수의 산정 근거는 첨부서류 2로 붙임(규칙 제87조제1항제2호)"
GH_NEED = "⚠ 사유가 끝난 날을 적으면 제출 기한을 셉니다 — 사유가 끝난 날부터 10일이 되는 날까지(규칙 제87조)"
GH_A, GH_B = "사유가 끝난 날(", ")부터 10일이 되는 날: "
GH_C = "까지(규칙 제87조) · 이날이 토요일 · 공휴일이면 그다음 날(민법 제161조)"
TJ_B = "에게 공사기간 연장을 요청할 예정임을 통지하고, 사유가 끝난 날부터 10일이 되는 날까지 요청(규칙 제87조제1항 · 제2항 단서)"
TJ_LATE = ("⚠ 사유가 끝난 날이 준공일보다 뒤입니다 — 사유가 계약기간 만료 뒤에도 이어지면 만료 전에 연장 요청 예정임을 통지(규칙 제87조 단서) · "
           "«예» 를 고릅니다")
TJ_OK = "✓ 사유가 계약기간 안에 끝남 — 사유가 끝난 날부터 10일이 되는 날까지 요청"
JC_NEED = "⚠ 요청서 아래 «년 월 일»(제출일)을 적으면 기한과 견줍니다"
JC_EARLY = "※ 제출일이 사유가 끝난 날보다 빠릅니다 — 규칙 제87조는 사유가 끝난 날부터 10일이 되는 날까지 요청하도록 정함"
JC_OK0 = "✓ 기한 안 — 사유가 끝난 날에 냄"
JC_OK_A, JC_OK_B = "✓ 기한 안 — 사유가 끝난 날부터 ", "일째"
JC_WK_A, JC_WK_B = "✓ 기한 안 — 기한 끝날이 토 · 일요일이라 그다음 월요일(", ")까지(민법 제161조)"
JC_LATE_A, JC_LATE_B = "⚠ 제출일이 기한(", ")을 넘깁니다 — 끝날이 토요일 · 공휴일이면 그다음 날까지(민법 제161조)"
CR_A = "건설공사발주자는 요청을 받은 날부터 30일 이내에 공사기간 연장 조치(규칙 제87조제4항)"
CR_A2 = " · 남은 공사기간 안에 마칠 수 있다고 인정하면 그 사유와 증명 서류를 붙여 도급인에게 통보(같은 항 단서)"
CR_B = "건설공사도급인은 요청을 받은 날부터 30일 이내에 공사기간 연장 조치를 하거나 10일 이내에 발주자에게 연장 요청(규칙 제87조제3항)"
CR_B2 = " · 발주자의 결과를 통보받은 날부터 5일 이내에 관계수급인에게 결과 통보(제5항)"
CR_SUB = " — 제출일에 받으면 "
BIN_OK = "✓ 요청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
DOGEUP = ("건설공사도급인 = 발주자로부터 해당 건설공사를 처음 도급받은 수급인 또는 시공을 주도하여 총괄 · 관리하는 자(법 제69조제1항) · "
          "관계수급인 = 여러 단계 도급에서 각 단계별로 도급받은 사업주 전부(법 제2조제9호)")
BULGA = ("불가항력 = 태풍 · 홍수 · 폭염 · 한파 등 악천후, 전쟁 · 사변, 지진, 화재, 전염병, 폭동, 그 밖에 계약 당사자가 통제할 수 없는 사태(법 제70조제1항제1호)")
ATTACH_S = ("1. 공사기간 연장 요청 사유 및 그에 따른 공사 지연사실을 증명할 수 있는 서류 · 2. 공사기간 연장 요청 기간 산정 근거 및 공사 지연에 따른 "
            "공정 관리 변경에 관한 서류(규칙 제87조제1항 각 호 — 관계수급인도 같음 제2항)")
GWATAE = ("건설공사발주자가 법 제70조제1항을, 건설공사도급인이 같은 조 제2항 후단(연장하거나 발주자에게 요청)을 위반하면 1천만원 이하의 과태료"
          "(법 제175조제4항제3호)")

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"요청인": YC[0], "사유": SY[0], "받는이": "가나시 도시공사 사장", "착공일": D(2026, 12, 14), "준공일": D(2027, 12, 31), "연장일수": 18,
      "사유시작": D(2027, 7, 14), "사유끝": D(2027, 8, 8), "이어짐": IJ[0]}
EX_S = {"업체명": "가나건설(주)", "공사명": "가나시 다목적체육관 신축공사", "전화번호": "000-0000-0000", "팩스번호": "000-0000-0000",
        "현장소재지": "가나시 다라구 마바동 123-4", "계약금액": 8450000000, "발주자": "가나시 도시공사",
        "연장사유": ("2027. 7. 14. ~ 8. 8. 집중호우(12일)와 폭염 특보(6일)로 옥외 작업을 하지 못한 18일 — 작업일보 · 기상청 관측자료 붙임(첨부서류 1). "
                 "철골 세우기 · 지붕 공정이 뒤로 밀려 변경 공정표를 붙임(첨부서류 2)."),
        "제출일": D(2027, 8, 12), "대표자": "김철수"}

ATTACH = ("1. 공사기간 연장 요청 사유 및 공사 지연 사실 증빙 서류\n"
          "2. 공사기간 연장 요청 기간 산정 근거 및 공사 지연에 따른 공정 관리 변경에 관한 서류")
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"


def _ymdf(ref):
    """날짜 → «2027. 8. 12.» — TEXT 날짜 대신(두 번째 계산기 버릇 · G670)"""
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


def _ex(ex, k):
    return EX[k] if ex else None


def _es(ex, k):
    return EX_S[k] if ex else None


EXT = "INT(N({연장일수}))"              # 연장 일수(정수)
EXT_S = "INT(N({셈!연장일수}))"


# ── ① 누가 · 누구에게 · 언제까지 · 변경 공사기간 ─────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  공사기간 연장 요청 — 누가 · 언제까지 · 변경 공사기간 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 건설공사발주자는 불가항력이나 발주자 책임으로 공사가 늦어져 건설공사도급인이 산업재해 예방을 위하여 공사기간 연장을 요청하면 "
              "특별한 사유가 없으면 공사기간을 연장해야 합니다(산업안전보건법 제70조제1항). 여기서 적은 값이 요청서의 공사기간 · 연장 일수 · "
              "변경 공사기간과 «귀하» 앞 이름으로 들어갑니다.")
    sz = {"kind": "text", "size": 7.5}
    s7 = {"kind": "text", "size": 7}

    g.sec(p, "㉮  누가 · 누구에게 · 늦어진 사유 (법 제70조 · 규칙 제87조)", need=26 * 6 + 10)
    p.row([(3, "요청인", L), (4, I("요청인", ex=_ex(ex, "요청인"), dv=",".join(YC), align="center", size=8.5)),
           (5, "요청서를 내는 쪽", sz)], h=26)
    p.row([(3, "", L), (9, DOGEUP, {"kind": "text", "size": 7})])
    p.row([(3, "늦어진 사유", L), (5, I("사유", ex=_ex(ex, "사유"), dv=",".join(SY), align="center", size=8)),
           (4, "착공이 늦어지거나 시공이 중단된 까닭", s7)], h=26)
    p.row([(3, "", L), (9, BULGA, {"kind": "text", "size": 7})])
    yc0, yc1 = f'{{요청인}}="{YC[0]}"', f'{{요청인}}="{YC[1]}"'
    p.row([(3, "판    정", L),
           (9, F("판정", f'=IF({{요청인}}="",IF({{사유}}="","","{PJ_NEED}"),IF({yc0},IF({{사유}}="{SY[2]}","{PJ_A3}","{PJ_A}"&'
                 f'IF({{사유}}="{SY[0]}","{PJ_A1}",IF({{사유}}="{SY[1]}","{PJ_A2}","{PJ_Q}"))),'
                 f'IF({{사유}}="{SY[1]}","{PJ_B2}","{PJ_B}"&IF({{사유}}="{SY[0]}","{PJ_B1}",IF({{사유}}="{SY[2]}","{PJ_B3}","{PJ_Q}")))))',
                 align="left", size=8.5, bold=True))], h=46)
    p.row([(3, "받는 이(이름)", L), (5, I("받는이", ex=_ex(ex, "받는이"), size=8.5)),
           (4, "요청서 «귀하» 앞에 들어감 — 도급인이 내면 발주자, 관계수급인이 내면 도급인", s7)], h=30)

    g.sec(p, "㉯  공사기간 · 연장 일수 · 변경 공사기간 (요청서 «공사기간 연장 요청사항»)", need=26 * 5 + 10)
    p.row([(3, "지금 공사기간", L), (3, I("착공일", ex=_ex(ex, "착공일"), fmt=DT, align="center")), (1, "~", {"kind": "ctext"}),
           (3, I("준공일", ex=_ex(ex, "준공일"), fmt=DT, align="center")), (2, "착공일 ~ 준공일", s7)], h=26)
    p.row([(3, "연장 일수", L), (2, I("연장일수", ex=_ex(ex, "연장일수"), fmt=DAYS, align="center")),
           (7, "요청하는 날 수 — 산정 근거는 첨부서류 2(규칙 제87조제1항제2호)", s7)], h=26)
    s, e = "{착공일}", "{준공일}"
    ne = f"{e}+{EXT}"
    p.row([(3, "변경 공사기간", L),
           (9, F("연장확인", f'=IF({EXT}<=0,IF(N({e})=0,"","{YH_NEED_N}"),IF(N({e})=0,"{YH_NEED_J}",IF(AND(N({s})>0,{e}<{s}),"{YH_REV}",'
                 f'"준공일 "&' + _ymdf(e) + '&" → "&' + _ymdf(ne) + '&"("&' + _yo(ne) + f'&") · "&TEXT({EXT},"#,##0")&"{YH_OK}")))',
                 align="left", size=8.5, bold=True))], h=32)
    p.row([(3, "사유 시작 · 끝난 날", dict(L, size=8.5)), (3, I("사유시작", ex=_ex(ex, "사유시작"), fmt=DT, align="center")),
           (1, "~", {"kind": "ctext"}), (3, I("사유끝", ex=_ex(ex, "사유끝"), fmt=DT, align="center")), (2, "악천후 · 중단 기간", s7)], h=26)
    a, b = "{사유시작}", "{사유끝}"
    p.row([(3, "사유 기간", L),
           (9, F("사유기간", f'=IF(OR(N({a})=0,N({b})=0),"",IF({b}<{a},"{SG_REV}","{SG_A}"&TEXT({b}-{a}+1,"#,##0")&"{SG_B}"))',
                 align="left", size=8.5))], h=32)

    g.sec(p, "㉰  언제까지 내나 (규칙 제87조제1항 · 제2항)", need=26 * 4 + 10)
    p.row([(3, "만료 뒤에도 이어지나", dict(L, size=8.5)), (5, I("이어짐", ex=_ex(ex, "이어짐"), dv=",".join(IJ), align="center", size=8)),
           (4, "사유가 계약기간(준공일) 뒤에도 이어질 것 같은가", s7)], h=26)
    due = f"{b}+10"
    p.row([(3, "제출 기한", L),
           (9, F("기한", f'=IF(N({b})=0,IF(OR({{요청인}}<>"",{{사유}}<>"",{{이어짐}}<>""),"{GH_NEED}",""),'
                 f'"{GH_A}"&' + _ymdf(b) + f'&"{GH_B}"&' + _ymdf(due) + '&"("&' + _yo(due) + f'&")"&"{GH_C}")',
                 align="left", size=8.5, bold=True))], h=40)
    who = f'IF({yc1},"건설공사도급인",IF({yc0},"건설공사발주자","받는 이"))'
    p.row([(3, "만료 전 통지", L),
           (9, F("통지", f'=IF({{이어짐}}="{IJ[1]}","계약기간 만료"&IF(N({e})>0,"(준공일 "&' + _ymdf(e) + '&")","")&" 전에 "&' + who
                 + f'&"{TJ_B}",IF(AND(N({b})>0,N({e})>0,{b}>{e}),"{TJ_LATE}",IF({{이어짐}}="{IJ[0]}","{TJ_OK}","")))',
                 align="left", size=8.5))], h=44)
    sub = "{요청서!제출일}"
    due2 = f"{due}+IF(WEEKDAY({due})=7,2,IF(WEEKDAY({due})=1,1,0))"
    p.row([(3, "제출일 확인", L),
           (9, F("제출확인", f'=IF(N({b})=0,"",IF(N({sub})=0,"{JC_NEED}",IF({sub}<{b},"{JC_EARLY}",IF({sub}={b},"{JC_OK0}",'
                 f'IF({sub}<={due},"{JC_OK_A}"&TEXT({sub}-{b},"#,##0")&"{JC_OK_B}",IF({sub}<={due2},"{JC_WK_A}"&' + _ymdf(due2) + f'&"{JC_WK_B}",'
                 f'"{JC_LATE_A}"&' + _ymdf(due) + '&"("&' + _yo(due) + f'&")"&"{JC_LATE_B}"))))))', align="left", size=8.5))], h=34)

    g.sec(p, "㉱  받은 쪽 처리 · 붙일 서류 · 과태료 · 아직 안 적은 칸", need=26 * 4 + 10)
    p30, p10 = f"{sub}+30", f"{sub}+10"
    p.row([(3, "받은 쪽 처리", L),
           (9, F("처리", f'=IF({yc0},"{CR_A}"&IF(N({sub})>0,"{CR_SUB}"&' + _ymdf(p30) + '&"("&' + _yo(p30) + f'&")까지","")&"{CR_A2}",'
                 f'IF({yc1},"{CR_B}"&IF(N({sub})>0,"{CR_SUB}"&"연장 조치 "&' + _ymdf(p30) + '&" · 발주자에게 요청 "&' + _ymdf(p10)
                 + f'&"까지","")&"{CR_B2}",""))', align="left", size=8))], h=54)
    p.row([(3, "붙일 서류", L), (9, ATTACH_S, {"kind": "text", "size": 7.5})])
    p.row([(3, "과태료", L), (9, GWATAE, {"kind": "text", "size": 7.5})])
    BIN = [("건설업체명", '{요청서!업체명}=""'), ("공사명", '{요청서!공사명}=""'), ("전화번호", '{요청서!전화번호}=""'),
           ("소재지", '{요청서!현장소재지}=""'), ("공사금액", 'N({요청서!계약금액})=0'), ("공사기간(착공일 · 준공일)", 'OR(N({착공일})=0,N({준공일})=0)'),
           ("발주자", '{요청서!발주자}=""'), ("연장 일수", f'{EXT}<=0'), ("공사기간 연장사유", '{요청서!연장사유}=""'),
           ("제출자(사업주 또는 대표자)", '{요청서!대표자}=""'), ("받는 이", '{받는이}=""')]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", f'=IF(AND({{요청인}}="",{{사유}}="",{EXT}<=0,{{요청서!연장사유}}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A
                 + '"&MID(' + lst + ',4,300)))', align="left", size=8.5))], h=40)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 요청서 아래 «년 월 일»(제출일)을 적으면 제출 기한과 견줍니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호 — 집중호우 · 폭염으로 옥외 작업을 못 한 18일을 연장 요청)."])
    return p


# ── 요청서 (별지 제35호서식 — 한 쪽) ─────────────────────────────────────
W2 = [12.5] + [78.7 / 23] * 23      # 원문 왼칸(건설현장 개요 …) 14% + 잔칸 23
PC2 = len(W2)


def yocheong(bk, ex):
    p = g.pg(bk, ex, "요청서", fit=1, widths=W2)
    lab = {"kind": "label", "size": 9}
    l8 = {"kind": "label", "size": 8.5}
    p.row([(16, "■ 산업안전보건법 시행규칙 [별지 제35호서식]", {"kind": "note", "size": 7.5}), (8, "", FR)], h=16)
    p.title("공사기간 연장 요청서", h=40)
    p.gap(3)
    # 건설현장 개요
    p.row([(1, "건설현장\n개요", dict(lab, rs=5)), (3, "건설업체명", l8), (9, I("업체명", ex=_es(ex, "업체명"), size=9)),
           (3, "공사명", l8), (8, I("공사명", ex=_es(ex, "공사명"), size=8.5))], h=30)
    p.row([(3, "전화번호", l8), (9, I("전화번호", ex=_es(ex, "전화번호"), align="center", size=9)),
           (3, "팩스번호", l8), (8, I("팩스번호", ex=_es(ex, "팩스번호"), align="center", size=9))], h=28)
    p.row([(3, "소재지", l8), (20, I("현장소재지", ex=_es(ex, "현장소재지"), size=9))], h=28)
    gs, ge = "{셈!착공일}", "{셈!준공일}"
    p.row([(3, "공사금액", l8), (9, I("계약금액", ex=_es(ex, "계약금액"), fmt=WON, align="right", size=9)),
           (3, "공사기간", l8),
           (8, F("공사기간표시", f'=IF(AND(N({gs})=0,N({ge})=0),"",IF(N({gs})=0,"",' + _ymdf(gs) + ')&" ~"&CHAR(10)&IF(N(' + ge + ')=0,"",'
                 + _ymdf(ge) + '))', align="center", size=8.5))], h=32)
    p.row([(3, "발주자", l8), (20, I("발주자", ex=_es(ex, "발주자"), size=9))], h=28)
    p.gap(3)
    # 공사기간 연장 요청사항
    p.row([(1, "공사기간\n연장\n요청사항", dict(lab, rs=2)), (4, "연장 일수", l8),
           (19, F("연장일수표시", f'=IF({EXT_S}<=0,"",{EXT_S})', fmt=DAYS, align="left", size=9.5))], h=32)
    p.row([(4, "변경 공사기간", l8),
           (19, F("변경기간표시", f'=IF(OR(N({ge})=0,{EXT_S}<=0),"",IF(N({gs})=0,"~ ",' + _ymdf(gs) + '&" ~ ")&'
                  + _ymdf(f"{ge}+{EXT_S}") + ')', align="left", size=9.5))], h=32)
    p.gap(3)
    p.row([(1, "공사기간\n연장사유", lab), (23, I("연장사유", ex=_es(ex, "연장사유"), size=9), {"valign": "top"})], h=166)
    p.gap(8)
    p.row([(PC2, "「산업안전보건법」 제70조 및 같은 법 시행규칙 제87조제1항 또는 제2항에 따라 공사기간 연장 요청서를 제출합니다.",
            {"kind": "free", "size": 9.5})], h=34)
    p.row([(PC2, I("제출일", ex=_es(ex, "제출일"), blank="년          월          일", fmt="date", align="right"), {"border": False, "indent": 2})], h=24)
    p.row([(7, "", FR), (8, "제출자(사업주 또는 대표자)", {"kind": "free", "align": "center", "size": 9.5}),
           (6, I("대표자", ex=_es(ex, "대표자"), align="center", size=9.5), {"border": False}),
           (3, "(서명 또는 인)", {"kind": "free", "align": "center", "size": 7.5})], h=28)
    p.row([(6, F("수신표시", '=IF({셈!받는이}="","",{셈!받는이})', align="right", size=10.5, bold=True), {"border": False}),
           (2, "귀 하", {"kind": "free", "align": "center", "size": 10.5, "bold": True}), (16, "", FR)], h=38)
    p.gap(6)
    n = text_lines(ATTACH, sum(W2[1:20]) * 10.0 / 7.6)
    p.row([(1, "첨부서류", {"kind": "label", "size": 8.5}), (19, ATTACH, {"kind": "text", "size": 7.6, "valign": "center"}),
           (4, "수수료\n\n없  음", {"kind": "ctext", "size": 8.5})], h=max(40, n * 7.6 * 1.45 + 12))
    p.row([(PC2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=14)
    p.end_print()
    p.after_note(["공사기간 · 연장 일수 · 변경 공사기간과 «귀하» 앞 이름은 ① 장에서 저절로 들어옵니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    yocheong(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _isnum(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _y(d):
    return YOIL[(d.weekday() + 1) % 7]


def _ext(v):
    import math
    return int(math.floor(v)) if _isnum(v) else 0


def expect(pages):
    sm, ys = pages["셈"], pages["요청서"]
    a, b = {}, {}
    T = datetime.timedelta
    yc, sy = sm.get("요청인"), sm.get("사유")
    if not yc:
        a["판정"] = "" if not sy else PJ_NEED
    elif yc == YC[0]:
        a["판정"] = PJ_A3 if sy == SY[2] else PJ_A + (PJ_A1 if sy == SY[0] else PJ_A2 if sy == SY[1] else PJ_Q)
    else:
        a["판정"] = PJ_B2 if sy == SY[1] else PJ_B + (PJ_B1 if sy == SY[0] else PJ_B3 if sy == SY[2] else PJ_Q)
    s, e = _d(sm.get("착공일")), _d(sm.get("준공일"))
    x = _ext(sm.get("연장일수"))
    if x <= 0:
        a["연장확인"] = "" if not e else YH_NEED_N
    elif not e:
        a["연장확인"] = YH_NEED_J
    elif s and e < s:
        a["연장확인"] = YH_REV
    else:
        ne = e + T(days=x)
        a["연장확인"] = f"준공일 {_ymd(e)} → {_ymd(ne)}({_y(ne)}) · {x:,}{YH_OK}"
    st, en = _d(sm.get("사유시작")), _d(sm.get("사유끝"))
    a["사유기간"] = "" if (not st or not en) else (SG_REV if en < st else f"{SG_A}{(en - st).days + 1:,}{SG_B}")
    ij = sm.get("이어짐")
    if not en:
        a["기한"] = GH_NEED if (yc or sy or ij) else ""
    else:
        du = en + T(days=10)
        a["기한"] = f"{GH_A}{_ymd(en)}{GH_B}{_ymd(du)}({_y(du)}){GH_C}"
    who = "건설공사도급인" if yc == YC[1] else "건설공사발주자" if yc == YC[0] else "받는 이"
    if ij == IJ[1]:
        a["통지"] = "계약기간 만료" + (f"(준공일 {_ymd(e)})" if e else "") + " 전에 " + who + TJ_B
    elif en and e and en > e:
        a["통지"] = TJ_LATE
    else:
        a["통지"] = TJ_OK if ij == IJ[0] else ""
    sd = _d(ys.get("제출일"))
    if not en:
        a["제출확인"] = ""
    elif not sd:
        a["제출확인"] = JC_NEED
    else:
        du = en + T(days=10)
        du2 = du + T(days=2 if du.weekday() == 5 else 1 if du.weekday() == 6 else 0)
        if sd < en:
            a["제출확인"] = JC_EARLY
        elif sd == en:
            a["제출확인"] = JC_OK0
        elif sd <= du:
            a["제출확인"] = f"{JC_OK_A}{(sd - en).days:,}{JC_OK_B}"
        elif sd <= du2:
            a["제출확인"] = f"{JC_WK_A}{_ymd(du2)}{JC_WK_B}"
        else:
            a["제출확인"] = f"{JC_LATE_A}{_ymd(du)}({_y(du)}){JC_LATE_B}"
    if yc == YC[0]:
        p30 = sd + T(days=30) if sd else None
        a["처리"] = CR_A + (f"{CR_SUB}{_ymd(p30)}({_y(p30)})까지" if sd else "") + CR_A2
    elif yc == YC[1]:
        a["처리"] = CR_B + (f"{CR_SUB}연장 조치 {_ymd(sd + T(days=30))} · 발주자에게 요청 {_ymd(sd + T(days=10))}까지" if sd else "") + CR_B2
    else:
        a["처리"] = ""
    if not yc and not sy and x <= 0 and not ys.get("연장사유"):
        a["빈칸"] = ""
    else:
        miss = [n for n, ok in (("건설업체명", not ys.get("업체명")), ("공사명", not ys.get("공사명")), ("전화번호", not ys.get("전화번호")),
                                ("소재지", not ys.get("현장소재지")), ("공사금액", not (_isnum(ys.get("계약금액")) and ys.get("계약금액") != 0)),
                                ("공사기간(착공일 · 준공일)", not s or not e), ("발주자", not ys.get("발주자")), ("연장 일수", x <= 0),
                                ("공사기간 연장사유", not ys.get("연장사유")), ("제출자(사업주 또는 대표자)", not ys.get("대표자")),
                                ("받는 이", not sm.get("받는이"))) if ok]
        a["빈칸"] = BIN_OK if not miss else BIN_A + (" · ".join(miss))[:300]
    if not s and not e:
        b["공사기간표시"] = ""
    else:
        b["공사기간표시"] = (_ymd(s) if s else "") + " ~\n" + (_ymd(e) if e else "")
    b["연장일수표시"] = x if x > 0 else ""
    if not e or x <= 0:
        b["변경기간표시"] = ""
    else:
        b["변경기간표시"] = ("~ " if not s else _ymd(s) + " ~ ") + _ymd(e + T(days=x))
    b["수신표시"] = sm.get("받는이") or ""
    return {"셈": a, "요청서": b}


# 엑셀 수식 안 글(따옴표 안)은 255자까지 — 넘으면 엑셀이 파일을 못 엶
for _t in (PJ_A, PJ_B, PJ_A1, PJ_A2, PJ_B1, PJ_B3, PJ_Q, PJ_A3, PJ_B2, PJ_NEED, YH_NEED_N, YH_NEED_J, YH_REV, YH_OK, SG_REV, SG_A, SG_B,
           GH_NEED, GH_A, GH_B, GH_C, TJ_B, TJ_LATE, TJ_OK, JC_NEED, JC_EARLY, JC_OK0, JC_OK_A, JC_OK_B, JC_WK_A, JC_WK_B, JC_LATE_A, JC_LATE_B,
           CR_A, CR_A2, CR_B, CR_B2, CR_SUB, BIN_OK, BIN_A, *YC, *SY, *IJ):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _dv in (YC, SY, IJ):
    assert len(",".join(_dv)) < 255 and not any("," in x for x in _dv), _dv[0]
