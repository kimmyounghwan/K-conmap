# -*- coding: utf-8 -*-
"""일괄적용사업장의 (고용보험, 산재보험) (사업 개시, 사업 종료) 신고서 — 새로 만든 서식 (2026-11-18 G773 · 소장님 「…만들지 못한 서식도 10개 만들어 줘」 — 일곱째 · 4대보험 3)
   → ① 셈: 신고(사업 개시 / 사업 종료) · 보험(고용 · 산재 — 종료 신고는 고용보험만 법 제11조③ → 제목 산재 √ 저절로 뺌) · 무엇을 개시(건설공사 · 벌목작업 · 지점 등) ·
     누가 내나(일괄적용 사업주 — 건설사업자는 공사마다) · 낼 곳(관할 지사 · 유의사항 2 · 처리기간 1일) · 개시일 → 신고 기한(개시일을 첫날로 14일째 · 14일 안에 끝나면
     끝나는 날의 전날 · 법 제11조③) / 종료일 → 종료일을 첫날로 14일째 · 신고일 확인 · 날짜 차례 · 총공사금액(계약금액 + 재료 시가환산액) · 공동도급 √ · 낼 서류(종류마다) ·
     적을 칸(종류마다) · 아직 안 적은 칸 · 다음 할 일
   · 신고서 앞쪽(고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행규칙 [별지 제10호서식] <개정 2024. 7. 1.> 칸 차례 그대로 — 제목 √ 넷 · 접수 띠 ·
     일괄적용 사업 · 건설공사 개시 · 벌목작업 개시 · 지점 · 지사 · 공장 등 개시 · 사업 종료 · 신고 문구 · 서명 · 귀하 · 제출서류 · 담당직원 확인사항 · 행정정보 공동이용 동의서) ·
     뒤쪽(유의사항 1 · 2 · 작성방법 1 ~ 4 원문 그대로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G773/구조.md — 바깥 120 ~ 1115 · 이름 칸 245 · 접수 띠 459 · 794 · 건설 459 · 649 · 745 · 739 · 821 · 벌목 663 · 제출 상자 267 · 994).
   🩹 G771 에서 배운 것: 좁은 이름 칸은 들여쓰기 대신 앞 빈칸 둘 · wrap="shrink"(사이트 종이는 들여쓰기를 양쪽에 둠) · 좁은 값 칸도 shrink.

근거(국가법령정보센터 · 2026-11-18 · 원문 /home/claude/g10/notes/G773/원문_대조용.txt · 조문 G773/근거.md — 세 번):
  · 법 제11조③(일괄적용사업의 사업주는 각각의 사업 개시일 · 종료일(종료 신고는 고용보험만)부터 각각 14일 이내 · 14일 이내에 끝나는 사업은 끝나는 날의 전날까지)
  · 법 제8조① · 시행령 제6조①(건설업 — 일괄적용) · 시행규칙 [시행 2026. 7. 1.] 제8조①(별지 제10호서식 · 도급계약서 사본(건설공사 개시) · 벌목작업 허가서 사본(벌목작업 개시) ·
      사업자등록증명은 공단이 확인)
  · 근로복지공단 가입절차 안내(11-18): 일괄적용 뒤 시공하는 원도급 공사는 현장 관할 지사로 «사업개시신고서»만 · 14일 이내(14일 이내 종료 시 종료일 전일까지)
  · 서식 유의사항 1(같은 사업종류만 — 건설업 밖은 별도 성립신고서) · 2(건설공사 · 벌목작업 · 지점 등을 관할하는 지역본부(지사)로)
■ 원문 그대로: 머리 · 제목 · 칸 이름 · 신고 문구 · 귀하 · 제출서류 · 확인사항 · 동의서 · 뒤쪽 전부.
■ 날 수 셈 — 개시일 · 종료일을 첫날로(14일째 = +13 · 늦지 않게 하루 일찍 · G771 · lib/보험료셈.js 와 같은 셈) · 토 · 일요일이면 월요일.
■ 짐작 안 함: 일괄적용 사업 관리번호 · 개시번호(공단이 준 번호) · 공제가입번호 · 공휴일(글로만) · 지점 등 개시의 사업종류가 일괄적용과 같은지(유의사항 1 — 글)."""
import datetime

import sgw as g
from fb import F, I
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, FRR, FRC, NB, _ymd
from sgw import L

SLUG = "ilgwal-saeop-gaesi"
TITLE = "일괄적용사업장 사업 개시 · 종료 신고서(고용 · 산재)"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "일괄적용사업장의 사업 개시 · 종료 신고서(보험료징수법 시행규칙 별지 제10호서식) — 빈 서식 앞쪽 (원문 칸 차례 그대로)"),
        (5, "일괄적용사업장의 사업 개시 신고서 — 작성 예시 (제목 √ · 건설공사 개시 · 총공사금액 · 공사기간이 ① 장에서)"),
        (3, "뒤쪽 — 유의사항 · 작성방법 (원문 그대로)"),
        (4, "① 개시 · 종료 · 보험 · 무엇을 개시 · 14일 기한 · 총공사금액 · 낼 서류 — 작성 예시 (가상의 공사)")]
MULTI = True
SHORT = ("일괄적용사업장의 사업 개시 · 종료 신고서(고용 · 산재 — 보험료징수법 시행규칙 별지 제10호서식) — 일괄적용을 받는 건설사업자는 공사를 시작할 때마다 "
         "개시일부터 14일 안에 현장 관할 근로복지공단에 냅니다(고용보험 종료 신고는 공사기간을 적어 냈으면 끝난 다음 날 낸 것으로 봄). 개시일 · 계약금액을 적으면 신고 기한 · 총공사금액이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
T = datetime.timedelta
DT = 'yyyy". "m". "d"."'
WON = '#,##0;[Red]-#,##0;""'
MYEONG = '#,##0"명";-#,##0"명";""'
SINGO = ["사업 개시", "사업 종료"]
BOHEOM = ["고용 · 산재 둘 다", "고용보험만", "산재보험만"]
JONG = ["건설공사", "벌목작업", "지점 · 지사 · 공장 등"]
GONGDONG = ["비해당", "해당"]

WHO_T = ("일괄적용(법 제8조)을 받는 사업주가 냅니다 — 건설사업자는 원도급 공사를 시작할 때마다 «사업 개시», 고용보험은 공사가 끝나면 «사업 종료»(공사기간을 적어 냈으면 끝난 다음 날 낸 것으로 봄 · 시행규칙 제8조②). "
         "일괄적용이 아니면 이 서식 대신 성립신고서(별지 제3호서식)")
WHERE_T = ("건설공사 · 벌목작업 또는 지점 등을 관할하는 근로복지공단 지역본부(지사)에 냅니다(유의사항 2) — 고용 · 산재보험 토탈서비스(total.comwel.or.kr)로도 · "
           "처리기간 1일")
END_NOTE = "⚠ 사업 종료 신고는 고용보험만 합니다(법 제11조③) — 신고서 제목의 [ ]산재보험 √ 는 저절로 뺐습니다"
END_OK = "✓ 사업 종료 — 고용보험만 신고합니다(법 제11조③)"
START_T = "✓ 사업 개시 — 고용 · 산재 고른 대로 신고합니다"
DUE_A = "까지 — 개시일을 첫날로 14일째(법 제11조③ · 토 · 일요일이면 월요일 · 공휴일이면 그다음 날)"
DUE_B = "까지 — 14일 안에 끝나는 공사: 끝나는 날의 전날(법 제11조③ 단서 · 토 · 일요일이면 월요일)"
DUE_C = "까지 — 종료일을 첫날로 14일째(법 제11조③ · 고용보험 · 토 · 일요일이면 월요일 · 공휴일이면 그다음 날)"
OK_A = "✓ 기한 안 — 기한까지 "
OK_B = "일 남음"
OK_DAY = "✓ 오늘이 기한입니다"
LATE = "⚠ 기한이 지났습니다 — 바로 내세요(법 제11조③ · 14일 안)"
CHA_BAD1 = "⚠ 공사기간 끝이 시작보다 앞입니다"
CHA_BAD2 = "⚠ 개시일(실제 착공일)이 공사기간 시작보다 앞입니다(날짜 확인)"
CHA_BAD3 = "⚠ 신고일이 개시일(종료일)보다 앞입니다(날짜 확인)"
CHA_OK = "✓ 날짜 차례가 맞습니다"
FILL = {JONG[0]: "일괄적용 사업 + 건설공사 개시 칸(공사명 · 총공사금액 · 공사기간 · 현장 · 건축허가 · 공동도급 · 발주자)",
        JONG[1]: "일괄적용 사업 + 벌목작업 개시 칸(벌목 현장명 · 현장 소재지 · 벌목 재적량 · 벌목기간 · 인원 · 발주자명)",
        JONG[2]: "일괄적용 사업 + 지점 · 지사 · 공장 등 개시 칸(명칭 · 소재지 · 사업종류 · 사업 개시일 · 사업자등록번호 · 인원) — 일괄적용과 같은 사업종류만(유의사항 1)"}
FILL_END = "일괄적용 사업 + 사업 종료 칸(개시번호 · 명칭 · 종료일 — 작성방법 4)"
DOC = {JONG[0]: "① 공사도급계약서 사본 1부(건설공사 개시신고의 경우에만) — 수수료 없음",
       JONG[1]: "② 벌목허가서 사본 1부(벌목작업 개시신고의 경우에만) — 수수료 없음",
       JONG[2]: "서식에 적힌 붙일 서류 없음 — 사업자등록증명은 담당 직원이 확인(산재보험 · 동의하지 않으면 사업자등록증 사본을 직접 냄) · 수수료 없음"}
DOC_END = "서식에 적힌 붙일 서류 없음 — 수수료 없음"
NEXT_T = ("① 공사기간을 적어 냈으면 끝난 다음 날 «사업 종료» 신고를 낸 것으로 봅니다(시행규칙 제8조②) · 안 적었으면 종료일부터 14일 안에 고용보험 종료 신고(법 제11조③) "
          "② 근로자를 쓰면 상용은 피보험자격 취득신고 · 일용은 근로내용 확인신고서(다음 달 15일까지) "
          "③ 하도급하면 하수급인 사업주 승인신청(하도급공사 착공일부터 30일 · 별지 제8호서식)")
NEXT_END = ("※ 개시신고 때 공사기간을 적어 냈으면 그 종료일 다음 날 이 종료 신고를 낸 것으로 봅니다(시행규칙 제8조②) · "
            "종료일 뒤로 그 공사의 근로자는 피보험자격 상실신고(사유가 생긴 달의 다음 달 15일까지) · 일용은 근로내용 확인신고서로")
BIN_OK = "✓ 신고서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
HEAD1 = "■ 고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행규칙"
HEAD2 = "[별지 제10호서식] <개정 2024. 7. 1.>"
TOTAL = "고용 · 산재보험토탈서비스(total.comwel.or.kr)\n에서도  신청할 수 있습니다."

# ── 작성 예시(가상의 회사 · 현장 · 사람 · 번호) ──────────────────────────
EX = {"신고": SINGO[0], "보험": BOHEOM[0], "종류": JONG[0], "공동도급": "비해당",
      "개시일": D(2027, 3, 8), "시작": D(2027, 3, 8), "끝": D(2027, 10, 29), "종료일": None, "신고일": D(2027, 3, 15),
      "계약금액": 850_000_000, "재료": 0, "발주총액": None}
EX_S = {"명칭": "가나건설(주)", "대표자": "홍길동", "관리번호": "000-00-00000-0", "전화": "000-0000-0000",
        "공사명": "가나지구 배수로 정비공사", "현장소재지": "가나시 바사구 아자동 일원", "현장전화": "000-0000-0000", "건축허가": None,
        "발주자": "가나시장", "공제번호": "00000000000", "발주자주소": "가나시 다라구 시청로 1", "발주전화": "000-0000-0000",
        "벌목현장": None, "벌목전화": None, "벌목소재지": None, "재적량": None, "벌목기간": None, "벌목인원": None, "벌목발주자": None,
        "지점명": None, "지점전화": None, "지점소재지": None, "사업종류": None, "지점개시일": None, "지점사업자번호": None, "지점인원": None,
        "개시번호": None, "종료명칭": None, "대행기관": None}


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def _wk(ref):
    """토 · 일요일이면 월요일로"""
    return f"{ref}+IF(WEEKDAY({ref})=7,2,IF(WEEKDAY({ref})=1,1,0))"


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


IS_END = '{신고}="' + SINGO[1] + '"'
SHORT14 = "AND(N({끝})>0,{끝}<{개시일}+14)"
DUE0 = "IF(" + IS_END + ",{종료일}+13,IF(" + SHORT14 + ",{끝}-1,{개시일}+13))"
DUE = _wk(DUE0)
BASE = "IF(" + IS_END + ",N({종료일}),N({개시일}))"


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  일괄적용 사업 개시 · 종료 신고 — 14일 기한 · 총공사금액 · 낼 서류 (저절로)", {"kind": "h2", "size": 13})], h=30)
    g.note(p, "※ 일괄적용을 받는 건설사업자는 원도급 공사를 시작할 때마다 개시일부터 14일 안에 «사업 개시» 를 신고하고, 고용보험은 공사가 끝나면 «사업 종료» 도 신고합니다(개시 때 공사기간을 적어 냈으면 끝난 다음 날 낸 것으로 봅니다 · 시행규칙 제8조②). "
              "기한은 개시일 · 종료일을 첫날로 셉니다(늦지 않게). 여기 적은 것이 신고서 제목 √ · 금액 · 날짜 칸으로 들어갑니다.")
    g.sec(p, "㉮  무엇을 · 누가 · 어디에", need=26 * 3 + 44 * 3 + 52 + 10)
    p.row([(3, "신고", L), (3, I("신고", ex=_ex(ex, "신고"), dv=",".join(SINGO), align="center", size=9)),
           (6, "신고서 제목의 [ ]사업 개시 · [ ]사업 종료 √ 로 들어갑니다", s7)], h=26)
    p.row([(3, "보험", L), (3, I("보험", ex=_ex(ex, "보험"), dv=",".join(BOHEOM), align="center", size=9)),
           (6, "신고서 제목의 [ ]고용보험 · [ ]산재보험 √ 로 들어갑니다", s7)], h=26)
    p.row([(3, "보험 확인", L), (9, F("보험확인", '=IF(OR({신고}="",{보험}=""),"",IF(' + IS_END + ',IF({보험}="' + BOHEOM[1] + '","' + END_OK + '","'
                                     + END_NOTE + '"),"' + START_T + '"))', align="left", size=8.5))], h=44)
    p.row([(3, "무엇을 개시", L), (4, I("종류", ex=_ex(ex, "종류"), dv=",".join(JONG), align="center", size=9)),
           (5, "사업 개시일 때 — 건설공사 · 벌목작업 · 지점 등", s7)], h=26)
    p.row([(3, "누가 내나", L), (9, WHO_T, {"kind": "text", "size": 7.5})], h=52)
    p.row([(3, "낼 곳", L), (9, WHERE_T, {"kind": "text", "size": 8})], h=44)
    p.row([(3, "적을 칸", L), (9, F("적을칸", '=IF({신고}="","",IF(' + IS_END + ',"' + FILL_END + '",IF({종류}="","",IF({종류}="' + JONG[0] + '","' + FILL[JONG[0]]
                                    + '",IF({종류}="' + JONG[1] + '","' + FILL[JONG[1]] + '","' + FILL[JONG[2]] + '")))))', align="left", size=8))], h=44)
    g.sec(p, "㉯  날짜 · 14일 기한 · 신고일", need=26 * 4 + 36 * 3 + 10)
    p.row([(3, "개시일(실제 착공일)", dict(L, size=8.5)), (3, I("개시일", ex=_ex(ex, "개시일"), fmt=DT, align="center", size=9)),
           (3, "종료일(사업 종료 때)", dict(L, size=8.5)), (3, I("종료일", ex=_ex(ex, "종료일"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "공사기간 시작", L), (3, I("시작", ex=_ex(ex, "시작"), fmt=DT, align="center", size=9)),
           (3, "공사기간 끝", L), (3, I("끝", ex=_ex(ex, "끝"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "날짜 차례", L), (9, F("차례", '=IF(' + BASE + '=0,"",IF(AND(N({시작})>0,N({끝})>0,{끝}<{시작}),"' + CHA_BAD1 + '",'
                                     'IF(AND(NOT(' + IS_END + '),N({시작})>0,{개시일}<{시작}),"' + CHA_BAD2 + '",IF(AND(N({신고일})>0,{신고일}<' + BASE + '),"' + CHA_BAD3
                                     + '","' + CHA_OK + '"))))', align="left", size=8.5))], h=36)
    p.row([(3, "신고 기한", L),
           (9, F("기한", '=IF(OR({신고}="",' + BASE + '=0),"",' + _ymd(DUE) + '&"(' + '"&' + _yo(DUE) + '&")"&IF(' + IS_END + ',"' + DUE_C + '",IF(' + SHORT14
                 + ',"' + DUE_B + '","' + DUE_A + '")))', align="left", size=8.5))], h=36)
    p.row([(3, "신고일", L), (3, I("신고일", ex=_ex(ex, "신고일"), fmt=DT, align="center", size=9)),
           (6, "신고서 끝 날짜로 들어갑니다", s7)], h=26)
    p.row([(3, "기한 확인", L),
           (9, F("확인", '=IF(OR({신고}="",' + BASE + '=0,N({신고일})=0),"",IF({신고일}>' + DUE + ',"' + LATE + '",IF({신고일}=' + DUE
                 + ',"' + OK_DAY + '","' + OK_A + '"&(' + DUE + '-{신고일})&"' + OK_B + '")))', align="left", size=8.5))], h=36)
    g.sec(p, "㉰  총공사금액 · 공동도급(건설공사 개시)", need=26 * 3 + 10)
    p.row([(3, "계약금액(부가세 제외)", dict(L, size=8.5)), (3, I("계약금액", ex=_ex(ex, "계약금액"), fmt=WON, align="right", size=9)),
           (3, "재료 시가환산액", dict(L, size=8.5)), (3, I("재료", ex=_ex(ex, "재료"), fmt=WON, align="right", size=9))], h=26)
    p.row([(3, "총공사금액(합계)", dict(L, size=8.5)),
           (3, F("합계", '=IF(AND(N({계약금액})=0,N({재료})=0),"",N({계약금액})+N({재료}))', fmt=WON, align="right", size=9)),
           (3, "발주공사 총금액(분리발주)", dict(L, size=8)), (3, I("발주총액", ex=_ex(ex, "발주총액"), fmt=WON, align="right", size=9))], h=26)
    p.row([(3, "공동도급공사", L), (2, I("공동도급", ex=_ex(ex, "공동도급"), dv=",".join(GONGDONG), align="center", size=9)),
           (7, "신고서 공동도급공사 [ ]해당 · [ ]비해당 √ 로 들어갑니다", s7)], h=26)
    g.sec(p, "㉱  낼 서류 · 아직 안 적은 칸 · 다음 할 일", need=44 * 3 + 52 + 10)
    p.row([(3, "낼 서류", L), (9, F("서류", '=IF({신고}="","",IF(' + IS_END + ',"' + DOC_END + '",IF({종류}="","",IF({종류}="' + JONG[0] + '","' + DOC[JONG[0]]
                                    + '",IF({종류}="' + JONG[1] + '","' + DOC[JONG[1]] + '","' + DOC[JONG[2]] + '")))))', align="left", size=8))], h=44)
    BIN = [("명칭", '{신고서!명칭}=""'), ("대표자", '{신고서!대표자}=""'), ("일괄적용 사업 관리번호", '{신고서!관리번호}=""'),
           ("공사명", 'AND(NOT(' + IS_END + '),{종류}="' + JONG[0] + '",{신고서!공사명}="")'),
           ("총공사금액", 'AND(NOT(' + IS_END + '),{종류}="' + JONG[0] + '",N({계약금액})=0)'),
           ("공사기간", 'AND(NOT(' + IS_END + '),{종류}="' + JONG[0] + '",OR(N({시작})=0,N({끝})=0))'),
           ("현장 소재지", 'AND(NOT(' + IS_END + '),{종류}="' + JONG[0] + '",{신고서!현장소재지}="")'),
           ("발주자명", 'AND(NOT(' + IS_END + '),{종류}="' + JONG[0] + '",{신고서!발주자}="")'),
           ("개시번호", 'AND(' + IS_END + ',{신고서!개시번호}="")'), ("종료일", 'AND(' + IS_END + ',N({종료일})=0)'),
           ("개시일", 'AND(NOT(' + IS_END + '),N({개시일})=0)'), ("신고일", "N({신고일})=0")]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({신고}="",{신고서!명칭}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))', align="left", size=8.5))], h=44)
    p.row([(3, "다음 할 일", L), (9, F("다음", '=IF(AND({신고}="",{신고서!명칭}=""),"",IF(' + IS_END + ',"' + NEXT_END + '","' + NEXT_T + '"))', align="left", size=7.5))], h=52)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 신고 · 보험 · 무엇을 개시 · 개시일(종료일) · 신고일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 현장 · 사람 · 번호)."])
    return p


# ── 신고서 앞쪽 ─────────────────────────────────────────────────────────
PAX = [120, 245, 267, 330, 360, 459, 649, 663, 739, 745, 794, 821, 880, 994, 1115]
GA = Grid(PAX)


def _ck(cond, text):
    return f'IF({cond},"[√]","[   ]")&"{text}"'


def front(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "신고서", fit=1, widths=GA.w)
    X1, XA, X2 = 120, 245, 1115
    T, G_, M = S["thin"], S["gry"], S["med"]

    def inp(k, **kw):
        kw.setdefault("size", 8.5)
        kw.setdefault("align", "left")
        kw.setdefault("wrap", "shrink")
        return I(k, ex=_e(ex, k), **kw)

    lab = {"kind": "free", "size": 9, "align": "center", "wrap": True}
    cap8 = {"kind": "free", "size": 8, "align": "left", "wrap": "shrink"}
    cap2 = {"kind": "free", "size": 7.5, "align": "left", "wrap": True}
    small = {"kind": "free", "size": 7.5, "align": "left"}
    prow(p, GA, [(X1, 745, HEAD1 + "\n" + HEAD2, dict(small, wrap=True)), (745, X2, TOTAL, dict(small, size=7.5, wrap=True))], h=24)
    p.gap(4)
    bo, sg = "{셈!보험}", "{셈!신고}"
    big = {"kind": "free", "size": 15, "bold": True, "align": "center", "rs": 2}
    ck = {"align": "left", "size": 11, "bold": True}
    t1 = F("제목고용", '=' + _ck('AND(' + bo + '<>"",' + bo + '<>"' + BOHEOM[2] + '")', "고용보험"), **ck)
    t2 = F("제목산재", '=' + _ck('AND(' + bo + '<>"",' + bo + '<>"' + BOHEOM[1] + '",' + sg + '<>"' + SINGO[1] + '")', "산재보험"), **ck)
    t3 = F("제목개시", '=' + _ck(sg + '="' + SINGO[0] + '"', "사업 개시"), **ck)
    t4 = F("제목종료", '=' + _ck(sg + '="' + SINGO[1] + '"', "사업 종료"), **ck)
    prow(p, GA, [(X1, 459, "일괄적용사업장의", big), (459, 663, t1, NB), (663, 880, t2, NB), (880, X2, "신고서", big)], h=21.5)
    prow(p, GA, [(459, 663, t3, NB), (663, 880, t4, NB)], h=21.5)
    p.gap(6)
    prow(p, GA, [(X1, 994, "※ 뒤쪽의 유의사항과 작성방법을 읽고 작성하기 바라며, [   ]에는 해당되는 곳에 \"√\" 표를 합니다.", {"kind": "free", "size": 7.5, "align": "left"}),
                 (994, X2, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=12)
    band = {"kind": "free", "size": 8, "align": "left", "fill": S["gray"], "valign": "top", "wrap": "shrink"}
    rb = prow(p, GA, [(X1, 459, "  접수번호", band), (459, 794, "  접수일", band), (794, X2, "  처리기간 1일", band)], h=16)
    hline(p, GA, rb, X1, X2, T, below=False)
    hline(p, GA, rb, X1, X2, T)
    vline(p, GA, rb, rb, 459, G_)
    vline(p, GA, rb, rb, 794, G_)
    p.gap(4)
    # 일괄적용 사업
    a1 = prow(p, GA, [(X1, XA, "일괄적용\n사업", dict(lab, rs=2)), (XA, 330, "  명칭", cap8), (330, 794, inp("명칭"), NB), (794, 880, "  대표자", cap8),
                      (880, X2, inp("대표자"), NB)], h=17.5)
    a2 = prow(p, GA, [(XA, 459, "  일괄적용 사업 관리번호", cap8), (459, 794, inp("관리번호", align="center"), NB), (794, 880, "  전화번호", cap8),
                      (880, X2, inp("전화", size=8), NB)], h=17.5)
    hline(p, GA, a1, X1, X2, M, below=False)
    hline(p, GA, a1, XA, X2, G_)
    hline(p, GA, a2, X1, X2, T)
    vline(p, GA, a1, a2, XA, G_)
    vline(p, GA, a1, a2, 794, G_)
    p.gap(4)
    # 건설공사 개시
    m1 = F("표합계", '=IF(N({셈!합계})=0,"원",TEXT({셈!합계},"#,##0")&" 원")', align="right", size=8.5)
    m2 = F("표발주총액", '=IF(N({셈!발주총액})=0,"원",TEXT({셈!발주총액},"#,##0")&" 원")', align="right", size=8.5)
    s0, e0 = "{셈!시작}", "{셈!끝}"
    gi = F("표기간", '=IF(AND(N(' + s0 + ')=0,N(' + e0 + ')=0),"",IF(N(' + s0 + ')>0,' + _ymd(s0) + ',"")&" ~ "&IF(N(' + e0 + ')>0,' + _ymd(e0) + ',""))',
           align="left", size=8.5, wrap="shrink")
    gd = "{셈!공동도급}"
    gg = F("표공동", '="  공동도급공사      "&IF(' + gd + '="해당","[√]","[   ]")&"해당     "&IF(' + gd + '="비해당","[√]","[   ]")&"비해당"', align="left", size=8.5, wrap="shrink")
    c1 = prow(p, GA, [(X1, XA, "건설공사\n개시", dict(lab, rs=7)), (XA, 330, "  공사명", cap8), (330, X2, inp("공사명"), NB)], h=17.5)
    c2 = prow(p, GA, [(XA, 459, "  총공사금액\n  (재료 시가환산액 포함)", cap2), (459, 649, m1, NB), (649, 821, "  발주공사총금액\n  (분리발주된 경우)", cap2),
                      (821, X2, m2, NB)], h=26)
    c3 = prow(p, GA, [(XA, 330, "  공사기간", cap8), (330, X2, gi, NB)], h=17.5)
    c4 = prow(p, GA, [(XA, 360, "  현장 소재지", cap8), (360, 745, inp("현장소재지"), NB), (745, 880, "  현장 전화번호", cap8), (880, X2, inp("현장전화", size=8), NB)], h=17.5)
    c5 = prow(p, GA, [(XA, 360, "  건축허가사항", cap8), (360, 649, inp("건축허가", size=8), NB), (649, X2, gg, NB)], h=17.5)
    c6 = prow(p, GA, [(XA, 330, "  발주자명", cap8), (330, 649, inp("발주자"), NB), (649, 794, "  공제가입번호", cap8), (794, X2, inp("공제번호", align="center"), NB)], h=17.5)
    c7 = prow(p, GA, [(XA, 360, "  발주자 주소", cap8), (360, 739, inp("발주자주소", size=8), NB), (739, 821, "  전화번호", cap8), (821, X2, inp("발주전화", size=8), NB)], h=17.5)
    hline(p, GA, c1, X1, X2, M, below=False)
    for r in (c1, c2, c3, c4, c5, c6):
        hline(p, GA, r, XA, X2, G_)
    hline(p, GA, c7, X1, X2, T)
    vline(p, GA, c2, c2, 459, G_)
    vline(p, GA, c2, c2, 649, G_)
    vline(p, GA, c2, c2, 821, G_)
    vline(p, GA, c4, c4, 745, G_)
    vline(p, GA, c5, c6, 649, G_)
    vline(p, GA, c7, c7, 739, G_)
    vline(p, GA, c1, c7, XA, G_)
    p.gap(5)
    # 벌목작업 개시
    d1 = prow(p, GA, [(X1, XA, "벌목작업\n개시", dict(lab, rs=4)), (XA, 360, "  벌목 현장명", cap8), (360, 663, inp("벌목현장"), NB), (663, 745, "  전화번호", cap8),
                      (745, X2, inp("벌목전화", size=8), NB)], h=17.5)
    d2 = prow(p, GA, [(XA, 360, "  현장 소재지", cap8), (360, X2, inp("벌목소재지"), NB)], h=17.5)
    d3 = prow(p, GA, [(XA, 360, "  벌목 재적량", cap8), (360, 663, inp("재적량", size=8), NB), (663, 745, "  벌목기간", cap8), (745, X2, inp("벌목기간", size=8), NB)], h=17.5)
    d4 = prow(p, GA, [(XA, 330, "  인원", cap8), (330, 663, inp("벌목인원", fmt=MYEONG, align="right"), NB), (663, 745, "  발주자명", cap8), (745, X2, inp("벌목발주자"), NB)], h=17.5)
    hline(p, GA, d1, X1, X2, M, below=False)
    for r in (d1, d2, d3):
        hline(p, GA, r, XA, X2, G_)
    hline(p, GA, d4, X1, X2, T)
    for r in (d1, d3, d4):
        vline(p, GA, r, r, 663, G_)
    vline(p, GA, d1, d4, XA, G_)
    p.gap(5)
    # 지점 · 지사 · 공장 등 개시
    e1 = prow(p, GA, [(X1, XA, "지점⋅지사\n⋅공장 등\n개시", dict(lab, size=8.5, rs=4)), (XA, 459, "  지점ㆍ지사ㆍ공장명", cap8), (459, 794, inp("지점명"), NB),
                      (794, 880, "  전화번호", cap8), (880, X2, inp("지점전화", size=8), NB)], h=17.5)
    e2 = prow(p, GA, [(XA, 330, "  소재지", cap8), (330, X2, inp("지점소재지"), NB)], h=17.5)
    e3 = prow(p, GA, [(XA, 330, "  사업종류", cap8), (330, 794, inp("사업종류"), NB), (794, 880, "  사업 개시일", cap8),
                      (880, X2, inp("지점개시일", fmt=DT, size=8, align="center"), NB)], h=17.5)
    e4 = prow(p, GA, [(XA, 459, "  사업자등록번호", cap8), (459, 794, inp("지점사업자번호", align="center"), NB), (794, 880, "  인원", cap8),
                      (880, X2, inp("지점인원", fmt=MYEONG, align="right"), NB)], h=17.5)
    hline(p, GA, e1, X1, X2, M, below=False)
    for r in (e1, e2, e3):
        hline(p, GA, r, XA, X2, G_)
    hline(p, GA, e4, X1, X2, T)
    for r in (e1, e3, e4):
        vline(p, GA, r, r, 794, G_)
    vline(p, GA, e1, e4, XA, G_)
    p.gap(4)
    # 사업 종료
    ed = "{셈!종료일}"
    jy = F("표종료일", '=IF(N(' + ed + ')=0,"",' + _ymd(ed) + ')', align="left", size=8.5)
    f1 = prow(p, GA, [(X1, XA, "사업\n종료", dict(lab, rs=3)), (XA, 330, "  개시번호", cap8), (330, X2, inp("개시번호", align="left"), NB)], h=17.5)
    f2 = prow(p, GA, [(XA, 330, "  명칭", cap8), (330, X2, inp("종료명칭"), NB)], h=17.5)
    f3 = prow(p, GA, [(XA, 330, "  종료일", cap8), (330, X2, jy, NB)], h=17.5)
    hline(p, GA, f1, X1, X2, M, below=False)
    for r in (f1, f2):
        hline(p, GA, r, XA, X2, G_)
    hline(p, GA, f3, X1, X2, T)
    vline(p, GA, f1, f3, XA, G_)
    p.gap(6)
    prow(p, GA, [(X1, X2, "「고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률」 제11조제3항 및 같은 법 시행규칙 제8조에 따라\n위와 같이 신고합니다.",
                  {"kind": "free", "size": 9.5, "wrap": True})], h=32)
    sd = "{셈!신고일}"
    prow(p, GA, [(X1, X2, F("표신고일", '=IF(N(' + sd + ')=0,"년         월         일",YEAR(' + sd + ')&"년      "&MONTH(' + sd + ')&"월      "&DAY(' + sd + ')&"일")',
                             align="right", size=9), NB)], h=18.5)
    nm = F("표신고인", '=IF({대표자}="","",{대표자})', align="center", size=8.5)
    prow(p, GA, [(X1, 459, "", NB), (459, 745, "신고인(사업주)", dict(FRC, size=9.5)), (745, 880, nm, NB), (880, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=18)
    dh = F("표대행", '=IF({대행기관}<>"","[√]","[   ]")&" 보험사무대행기관"', align="center", size=9.5)
    prow(p, GA, [(X1, 459, "", NB), (459, 745, dh, NB), (745, 880, inp("대행기관", size=8, align="center"), NB),
                 (880, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=19)
    p.gap(30)
    prow(p, GA, [(X1, 663, "        근로복지공단 ○○지역본부(지사)장", {"kind": "free", "size": 13, "align": "left", "wrap": "shrink"}),
                 (663, 794, "귀하", {"kind": "free", "size": 9, "align": "left"}), (794, X2, "", NB)], h=21)
    p.gap(3)
    prow(p, GA, [(X1, X2, "", {"kind": "free", "fill": S["gray"]})], h=2.5)
    p.gap(2)
    tx = {"kind": "free", "size": 7.8, "align": "left", "wrap": True}
    lb = {"kind": "free", "size": 8.5, "align": "center", "wrap": True}
    r1 = prow(p, GA, [(X1, 267, "신고인 제출서류", lb), (267, 994, "1. 공사도급계약서 사본 1부(건설공사 개시신고의 경우에만 제출합니다)\n"
                                                         "2. 벌목허가서 사본 1부(벌목작업 개시신고의 경우에만 제출합니다)", tx),
                      (994, X2, "수수료\n\n없음", dict(lb, rs=2))], h=23)
    r2 = prow(p, GA, [(X1, 267, "담당직원 확인사항", lb), (267, 994, "사업자등록증명(주민등록번호 뒷자리가 제외된 사업자등록증명을 말하며, 산재보험과 관련하여 건설공사 "
                                                           "및 벌목작업 외의 사업 개시신고의 경우만 해당합니다)", tx)], h=23)
    hline(p, GA, r1, X1, X2, T, below=False)
    hline(p, GA, r1, X1, 994, G_)
    hline(p, GA, r2, X1, X2, T)
    vline(p, GA, r1, r2, 267, G_)
    vline(p, GA, r1, r2, 994, G_)
    p.gap(4)
    r = prow(p, GA, [(X1, X2, "행정정보 공동이용 동의서", {"kind": "free", "size": 10, "align": "center", "fill": S["gray"]})], h=15)
    hline(p, GA, r, X1, X2, T, below=False)
    hline(p, GA, r, X1, X2, T)
    prow(p, GA, [(X1, X2, "본인은 이 건 업무처리와 관련하여 「전자정부법」 제36조제1항에 따른 행정정보의 공동이용을 통하여 담당 직원이 위의 담당 직원 확인사항을 "
                          "확인하는 것에 동의합니다.", {"kind": "free", "size": 8, "wrap": True})], h=28)
    prow(p, GA, [(X1, X2, "  * 동의하지 않는 경우에는 신청인이 직접 사업자등록증 사본을 제출해야 합니다.", {"kind": "free", "size": 7.8, "align": "left"})], h=14)
    r = prow(p, GA, [(X1, 459, "", NB), (459, 745, "신청인(위임한 사람)", dict(FRC, size=9.5)), (745, 880, "", NB),
                     (880, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=15)
    hline(p, GA, r, X1, X2, T)
    prow(p, GA, [(X1, X2, "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["제목 √ · 총공사금액 · 공사기간 · 공동도급 · 종료일 · 신고일은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 현장 · 사람 · 번호)."])
    return p


# ── 뒤쪽(원문 그대로) ────────────────────────────────────────────────────
YU = ["1. 사업개시신고는 일괄적용을 받는 사업과 동일한 사업종류에 대해서만 할 수 있습니다. 예를 들어, 건설업으로 일괄적용받은 경우. 건설업 외의 사업에 대해서는 "
      "사업개시신고서를 제출할 수 없으므로 별도의 성립신고서를 제출해야 합니다.",
      "2. 사업개시신고서 및 사업종료신고서는 건설공사, 벌목작업 또는 일반사업의 지점 등을 관할하는 지역본부(지사)로 제출해야 합니다."]
JAK = ["1. \"일괄적용사업\"란은 일괄적용사업(본사)의 명세를 적습니다.",
       "2. \"건설공사\"란은 건설업에서 착공하는 건설현장 단위의 개시 명세를 적습니다.",
       "3. \"건축허가(신고)사항\"에는 건축허가(신고)에 따른 건축공사에 한하여 \"건축허가기관\"과 \"건축허가번호\"를 적습니다.",
       "4. \"사업종료\"란은 개시신고한 사업장이 종료되는 경우 그 사실을 적습니다."]
BAX = [120, 1115]
GB = Grid(BAX)


def back(bk, ex):
    from fb import text_lines
    S = _sides()
    p = g.pg(bk, ex, "뒤쪽", fit=1, widths=GB.w)
    X1, X2 = 120, 1115
    T, M = S["thin"], S["med"]
    prow(p, GB, [(X1, X2, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=12)
    r0 = prow(p, GB, [(X1, X2, "", NB)], h=2)
    hline(p, GB, r0, X1, X2, M)
    p.gap(400)          # 원문 그대로 — 유의사항은 쪽 아래쪽부터(위는 빈 자리)
    W = sum(GB.w)
    bandf = {"kind": "free", "size": 10, "align": "center", "fill": S["gray"]}
    for nm, items, sz, lh in (("유의사항", YU, 8.5, 1.6), ("작성방법", JAK, 8.5, 1.6)):
        r = prow(p, GB, [(X1, X2, nm, bandf)], h=20)
        hline(p, GB, r, X1, X2, M, below=False)
        hline(p, GB, r, X1, X2, T)
        p.gap(6)
        for t in items:
            n = text_lines(t, (W - 2) * 10.0 / sz)
            prow(p, GB, [(X1, X2, "  " + t, {"kind": "free", "size": sz, "align": "left", "wrap": True, "valign": "top"})], h=n * sz * lh + 4)
        p.gap(10)
    rr = prow(p, GB, [(X1, X2, "", NB)], h=2)
    hline(p, GB, rr, X1, X2, T)
    prow(p, GB, [(X1, X2, "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["뒤쪽은 원문 그대로입니다(보험료징수법 시행규칙 별지 제10호서식)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    front(bk, ex)
    back(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
YOIL = "월화수목금토일"


def _ymdp(d):
    return f"{d.year}. {d.month}. {d.day}."


def _wkp(d):
    return d + T(days=2 if d.weekday() == 5 else 1 if d.weekday() == 6 else 0)


def _ckp(c, t):
    return ("[√]" if c else "[   ]") + t


def expect(pages):
    sm, fr = pages["셈"], pages["신고서"]
    a, b = {}, {}
    sg, bo, jo, gd = sm.get("신고"), sm.get("보험"), sm.get("종류"), sm.get("공동도급")
    gs, ed, st, en, sd = sm.get("개시일"), sm.get("종료일"), sm.get("시작"), sm.get("끝"), sm.get("신고일")
    ga, jr = sm.get("계약금액"), sm.get("재료")
    end = sg == SINGO[1]
    if not sg or not bo:
        a["보험확인"] = ""
    elif end:
        a["보험확인"] = END_OK if bo == BOHEOM[1] else END_NOTE
    else:
        a["보험확인"] = START_T
    if not sg:
        a["적을칸"] = ""
    elif end:
        a["적을칸"] = FILL_END
    else:
        a["적을칸"] = "" if not jo else FILL[jo]
    base = ed if end else gs
    if not base:
        a["차례"] = ""
    elif st and en and en < st:
        a["차례"] = CHA_BAD1
    elif not end and st and gs < st:
        a["차례"] = CHA_BAD2
    elif sd and sd < base:
        a["차례"] = CHA_BAD3
    else:
        a["차례"] = CHA_OK
    s14 = (not end) and bool(gs) and bool(en) and en < gs + T(days=14)
    due = None
    if base:
        due = _wkp(ed + T(days=13)) if end else _wkp(en - T(days=1) if s14 else gs + T(days=13))
    if not sg or not base:
        a["기한"] = ""
    else:
        a["기한"] = f"{_ymdp(due)}({YOIL[due.weekday()]})" + (DUE_C if end else (DUE_B if s14 else DUE_A))
    if not sg or not base or not sd:
        a["확인"] = ""
    elif sd > due:
        a["확인"] = LATE
    elif sd == due:
        a["확인"] = OK_DAY
    else:
        a["확인"] = f"{OK_A}{(due - sd).days}{OK_B}"
    a["합계"] = "" if not ga and not jr else (ga or 0) + (jr or 0)
    if not sg:
        a["서류"] = ""
    elif end:
        a["서류"] = DOC_END
    else:
        a["서류"] = "" if not jo else DOC[jo]
    keys = [("명칭", not fr.get("명칭")), ("대표자", not fr.get("대표자")), ("일괄적용 사업 관리번호", not fr.get("관리번호")),
            ("공사명", (not end) and jo == JONG[0] and not fr.get("공사명")), ("총공사금액", (not end) and jo == JONG[0] and not ga),
            ("공사기간", (not end) and jo == JONG[0] and (not st or not en)), ("현장 소재지", (not end) and jo == JONG[0] and not fr.get("현장소재지")),
            ("발주자명", (not end) and jo == JONG[0] and not fr.get("발주자")), ("개시번호", end and not fr.get("개시번호")), ("종료일", end and not ed),
            ("개시일", (not end) and not gs), ("신고일", not sd)]
    if not sg and not fr.get("명칭"):
        a["빈칸"] = a["다음"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
        a["다음"] = NEXT_END if end else NEXT_T
    b["제목고용"] = _ckp(bool(bo) and bo != BOHEOM[2], "고용보험")
    b["제목산재"] = _ckp(bool(bo) and bo != BOHEOM[1] and sg != SINGO[1], "산재보험")
    b["제목개시"] = _ckp(sg == SINGO[0], "사업 개시")
    b["제목종료"] = _ckp(sg == SINGO[1], "사업 종료")
    tot = (ga or 0) + (jr or 0)
    b["표합계"] = f"{tot:,} 원" if (ga or jr) else "원"
    bal = sm.get("발주총액")
    b["표발주총액"] = f"{bal:,} 원" if bal else "원"
    b["표기간"] = "" if not st and not en else (_ymdp(st) if st else "") + " ~ " + (_ymdp(en) if en else "")
    b["표공동"] = "  공동도급공사      " + ("[√]" if gd == "해당" else "[   ]") + "해당     " + ("[√]" if gd == "비해당" else "[   ]") + "비해당"
    b["표종료일"] = "" if not ed else _ymdp(ed)
    b["표신고일"] = "년         월         일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    b["표신고인"] = fr.get("대표자") or ""
    b["표대행"] = _ckp(bool(fr.get("대행기관")), " 보험사무대행기관")
    return {"셈": a, "신고서": b}
