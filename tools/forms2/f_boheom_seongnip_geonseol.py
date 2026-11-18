# -*- coding: utf-8 -*-
"""건설업 보험관계 성립신고서 · 보험가입신청서(고용 · 산재) — 새로 만든 서식 (2026-11-18 G771 · 소장님 「…만들지 못한 서식도 10개 만들어 줘」 — 다섯째 · 4대보험 1)
   → ① 무엇을 내나(성립신고 = 당연적용 / 가입신청 = 임의가입 · 고용 · 산재) · 누가 내나(일괄적용이 아닌 공사 — 건설사업자는 사업개시신고서) ·
     언제(착공일을 첫날로 14일째 · 14일 안에 끝나는 공사는 끝나는 날의 전날 · 토 · 일요일이면 월요일) · 신고일 확인 ·
     총공사금액 합계(계약금액 + 재료 시가환산액) · 날짜 차례 · 보험료 신고 · 납부 기한(성립일을 첫날로 70일째 · 70일 안에 끝나는 공사는 끝나는 날의 전날) ·
     하수급인 승인(하도급공사 착공일부터 30일) · 낼 서류 · 담당 직원 확인 서류 · 아직 안 적은 칸 · 다음 할 일(공사기간 변경신고 · 소멸신고 의제)
   · 신청(신고)서 앞쪽(고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행규칙 [별지 제3호서식] <개정 2025. 7. 1.> 칸 차례 그대로 —
     제목 √ 넷 · 접수 띠 · 사업장관리번호 · 산업재해 발생 여부 · 사업주(대표자) · 본사 · 현장(건설공사 및 벌목작업) · 총공사금액 · 신청 문구 · 서명 · 귀하 ·
     개인정보 수집 및 이용 동의서 · 처리 사항) · 뒤쪽(제출서류 · 담당 직원 확인사항 · 수수료 · 행정정보 공동이용 동의서 · 유의사항 1 ~ 7 · 작성방법 1 ~ 7 · 처리절차 원문 그대로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G771/구조.md — 바깥 120 ~ 1090 · 이름 칸 226 · 총공사금액 270 · 432 · 694 · 880 · 업종코드 755 · 925 ·
     접수 띠 306 ~ 339(회색 E5E5E5 · 588) · 굵은 줄 346 · 607 · 921 · 귀하 밑 두 줄 1212 · 1220 · 동의서 밑 굵은 줄 1396 · 처리 사항 1440 ~ 1525).

근거(국가법령정보센터 · 2026-11-18 · 원문 /home/claude/g10/notes/G771/원문_대조용.txt · 조문 G771/근거.md — 세 번):
  · 시행규칙 [시행 2026. 7. 1.] 제3조제1항(보험가입 신청 — 별지 제3호서식 가입신청서 · 공사도급계약서 · 고용 임의가입은 과반수 동의 서류) ·
      제7조제1항(성립신고 — 별지 제3호서식 성립신고서 · 공사도급계약서 사본) · 제7조제8항제2호(사업 기간을 신고했으면 그 종료일 다음 날 소멸신고 의제) ·
      제8조제1항(일괄적용 사업 개시(종료)신고서 = 별지 제10호서식)
  · 법 [시행 2026. 10. 8.] 제7조(성립일 — 당연가입은 사업이 시작된 날 · 가입신청은 접수 다음 날) · 제8조 · 시행령 제6조①(건설업 일괄적용) ·
      제11조①(성립한 날부터 14일 이내 · 단서 1: 14일 이내에 종료되는 사업은 종료되는 날의 전날까지) · 제17조①(개산 — 성립일부터 70일 ·
      70일 이내에 끝나는 사업은 끝나는 날의 전날) · 시행령 제7조③(하수급인 승인 — 하도급공사 착공일부터 30일) · 제9조5호(공사기간 변경 14일)
  · 서식 유의사항 2 · 5(가입 승인 → 접수일 다음 날부터 적용) · 6(하수급인 30일) · 7(일괄적용 대상은 별도 서식)
  · 근로복지공단 가입절차 안내(2026-11-18): 건설사업자(면허 있든 없든 사업자등록 후 건설공사) = 일괄적용 · 사업자등록 없이 건설업을 하는 자 = 개별적용(이 서식)
■ 날 수 셈 — 착공일(성립일)을 첫날로 셉니다(보험관계는 그날 0시부터 성립 · 늦지 않게 하루 일찍 · lib/보험료셈.js 보험료 계산기와 같은 셈):
  14일째 = 착공일 + 13 · 70일째 = 착공일 + 69 · «14 · 70일 안에 끝나는 공사» = 끝날 < 착공일 + 14 · + 70 → 끝나는 날 전날 · 토 · 일요일이면 월요일.
■ 원문 그대로: 머리 · 제목 · 칸 이름 · 신청 문구 · 귀하 · 개인정보 동의서 · 처리 사항 · 뒤쪽 전부.
■ 짐작 안 함: 업종코드 · 사업장관리번호(공단 · 이용자가 적음) · 보험료 금액(노무비율 · 요율은 고시마다 달라 셈 안 함) ·
  기한의 공휴일(토 · 일요일만 다음 월요일로 — 공휴일은 글로만) · 일괄적용 대상인지(누가 내나 글로 안내만)."""
import datetime

import sgw as g
from fb import F, I
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUBC, FR, FRR, FRC, NB, _ymd
from sgw import L

SLUG = "boheom-seongnip-geonseol"
TITLE = "건설업 보험관계 성립신고서 · 보험가입신청서(고용 · 산재)"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "건설업 및 벌목업 보험가입신청서 · 보험관계 성립신고서(보험료징수법 시행규칙 별지 제3호서식) — 빈 서식 앞쪽 (원문 칸 차례 그대로)"),
        (5, "건설업 보험관계 성립신고서 — 작성 예시 (제목 √ · 착공일 · 총공사금액 합계가 ① 장에서)"),
        (3, "뒤쪽 — 제출서류 · 담당 직원 확인사항 · 유의사항 · 작성방법 · 처리절차 (원문 그대로)"),
        (4, "① 무엇을 내나 · 누가 · 14일 기한 · 총공사금액 · 보험료 신고 기한 · 하수급인 — 작성 예시 (가상의 공사)")]
MULTI = True
SHORT = ("건설업 보험관계 성립신고서 · 보험가입신청서(고용 · 산재 — 보험료징수법 시행규칙 별지 제3호서식) — 공사를 시작하면 보험관계가 성립하고, "
         "실제 착공일부터 14일 안에 근로복지공단에 냅니다. 착공일 · 계약금액 · 재료 시가환산액을 적으면 신고 기한 · 총공사금액 합계 · 보험료 신고 · 납부 기한이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
T = datetime.timedelta
DT = 'yyyy". "m". "d"."'
WON = '#,##0;[Red]-#,##0;""'
BOHEOM = ["고용 · 산재 둘 다", "고용보험만", "산재보험만"]
JONG = ["보험관계 성립신고서(당연적용)", "보험가입신청서(임의가입)"]
GUBUN = ["도급", "직영"]
JAEHAE = ["없음", "있음"]
HYEONG = ["법인", "개인"]
HADO = ["하도급 없음", "하도급 있음"]

WHEN_S = ("공사를 시작한 날(보험관계 성립일 = 실제 착공일)부터 14일 안에 근로복지공단에 냅니다 — "
          "14일 안에 끝나는 공사는 끝나는 날의 전날까지(법 제11조① · 서식 유의사항 2)")
WHO_T = ("일괄적용(법 제8조)을 받지 않는 건설공사 — 근로복지공단 안내로는 사업자등록 없이 건설공사를 하는 사람(예: 건축주가 직접 시공)이 냅니다. "
         "사업자등록을 한 건설사업자는 일괄적용이라 공사마다 이 서식 대신 일괄적용 사업 개시신고서(별지 제10호서식)를 냅니다(유의사항 7)")
WHEN_G = ("보험가입신청서는 공단이 승인하면 그 접수일 다음 날부터 적용됩니다(서식 유의사항 5) — "
          "고용보험 임의가입은 근로자 과반수의 동의를 받은 사실을 증명하는 서류를 함께 냅니다")
WHERE_T = "사업장(현장)을 맡은 근로복지공단 지역본부(지사)에 냅니다 — 고용 · 산재보험 토탈서비스(total.comwel.or.kr)로도 신고할 수 있습니다 · 처리기한 5일"
DUE_A = "까지 — 착공일을 첫날로 14일째(토 · 일요일이면 월요일 · 공휴일이면 그다음 날)"
DUE_B = "까지 — 14일 안에 끝나는 공사: 끝나는 날의 전날(법 제11조① · 토 · 일요일이면 월요일)"
OK_A = "✓ 기한 안 — 기한까지 "
OK_B = "일 남음"
OK_DAY = "✓ 오늘이 기한입니다"
LATE = "⚠ 기한이 지났습니다 — 늦으면 관련 법 규정에 따른 불이익이 있을 수 있습니다(서식 유의사항 3) · 바로 내세요"
GA_NOTE = "가입신청은 정해진 기한이 없습니다 — 승인되면 접수일 다음 날부터 적용(서식 유의사항 5)"
CHA_BAD1 = "⚠ 계약서상 착공일이 계약일보다 앞입니다"
CHA_BAD2 = "⚠ 실제 착공일이 계약일보다 앞입니다"
CHA_BAD3 = "⚠ 준공 예정일이 착공일보다 앞입니다"
CHA_OK = "✓ 날짜 차례가 맞습니다(계약 → 착공 → 준공)"
PAY_TAIL = "까지 — 보험료(임금채권부담금 · 석면피해구제분담금 포함) 신고 · 자진납부"
PAY_A = "(연도 중 성립 — 성립일을 첫날로 70일째 · 토 · 일요일이면 월요일)"
PAY_B = "(70일 안에 끝나는 공사 — 끝나는 날의 전날 · 토 · 일요일이면 월요일)"
SUB_YES = ("하수급인을 사업주로 인정받게 하려면 원수급인이 하도급공사의 착공일부터 30일 안에 "
           "하수급인 사업주 보험가입 승인신청서(별지 제8호서식)를 근로복지공단에 냅니다(서식 유의사항 6)")
SUB_NO = "하도급이 없으면 낼 것 없음 — 하도급하면 하도급공사 착공일부터 30일 안에 하수급인 사업주 승인신청(원수급인)"
SUB_JIK = "직영 공사 — 하수급인 승인 해당 없음"
DOC_BASE = "① 공사도급계약서 사본(공사비명세서 포함)"
DOC_IM = " · ② 근로자 과반수의 동의를 받은 사실을 증명하는 서류 1부(고용보험 임의가입 신청인 경우만)"
CHK_GAE = "사업자등록증명 · 주민등록표 초본(개인 — 신분증을 보이면 갈음) · 건축 · 대수선 · 용도변경 허가서 또는 신고필증"
CHK_BUP = "사업자등록증명 · 법인 등기사항증명서 · 건축 · 대수선 · 용도변경 허가서 또는 신고필증"
CHK_TAIL = " — 담당 직원이 확인(행정정보 공동이용에 동의하지 않으면 직접 냄)"
NEXT_S = ("① 보험료 신고 · 자진납부(위 기한) ② 하도급하면 하수급인 사업주 승인신청(30일) ③ 근로자를 쓰면 상용은 피보험자격 취득신고(다음 달 15일까지) · "
          "일용은 근로내용 확인신고서(다음 달 15일까지) ④ 공사기간이 바뀌면 바뀐 날부터 14일 안에 변경신고(시행령 제9조) · "
          "끝나면 신고한 공사기간 종료일 다음 날에 소멸신고를 낸 것으로 봅니다(시행규칙 제7조⑧)")
BIN_OK = "✓ 신고서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
HEAD1 = "■ 고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행규칙"
HEAD2 = "[별지 제3호서식] <개정 2025. 7. 1.>"
TOTAL = "고용 · 산재보험토탈서비스(total.comwel.or.kr)\n에서도  신고할 수 있습니다."
YMD0 = "년      월      일"

# ── 작성 예시(가상의 회사 · 현장 · 사람 · 번호) ──────────────────────────
EX = {"보험": BOHEOM[0], "종류": JONG[0], "구분": "도급", "재해": "없음", "형태": "법인", "하도급": "하도급 있음", "동의": "동의함",
      "계약일": D(2027, 3, 2), "계약착공": D(2027, 3, 8), "실착공": D(2027, 3, 8), "준공예정": D(2027, 10, 29), "신고일": D(2027, 3, 15),
      "계약금액": 850_000_000, "재료": 0, "발주총액": None}
EX_S = {"관리번호": None, "성명": "홍길동", "주민": "000000-0000000", "주소": "가나시 다라구 마바로 12", "전화": "000-0000-0000",
        "메일": "gana@example.com", "휴대": "010-0000-0000", "명칭": "가나건설(주)", "소재지": "가나시 다라구 마바로 12", "본사전화": "000-0000-0000",
        "사업자번호": "000-00-00000", "법인번호": "000000-0000000", "수령지": None, "팩스": "000-0000-0000",
        "현장명": "가나지구 배수로 정비공사", "고용코드": None, "산재코드": None, "현장소재지": "가나시 바사구 아자동 일원", "현장전화": "000-0000-0000",
        "면허번호": "가나-00-0000", "허가번호": None, "재적량": None, "벌목인원": None, "발주자": "가나시장", "발주연락": "000-0000-0000",
        "대행기관": None}


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def _wk(ref):
    """토 · 일요일이면 월요일로"""
    return f"{ref}+IF(WEEKDAY({ref})=7,2,IF(WEEKDAY({ref})=1,1,0))"


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


SHORT14 = "AND(N({준공예정})>0,{준공예정}<{실착공}+14)"
SHORT70 = "AND(N({준공예정})>0,{준공예정}<{실착공}+70)"
DUE0 = "IF(" + SHORT14 + ",{준공예정}-1,{실착공}+13)"
DUE = _wk(DUE0)
PAY0 = "IF(" + SHORT70 + ",{준공예정}-1,{실착공}+69)"
PAY = _wk(PAY0)


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  건설업 보험관계 성립신고 — 언제 · 총공사금액 · 보험료 기한 (저절로)", {"kind": "h2", "size": 13})], h=30)
    g.note(p, "※ 건설공사를 시작하면 고용 · 산재 보험관계가 성립합니다. 성립신고서는 실제 착공일부터 14일 안에 근로복지공단에 냅니다(서식 유의사항 2). "
              "기한은 착공일을 첫날로 셉니다(늦지 않게 — 사이트 보험료 계산기와 같은 셈). 여기 적은 것이 신고서 제목 √ · 날짜 · 금액 칸으로 들어갑니다.")
    g.sec(p, "㉮  무엇을 내나 · 누가 · 언제 · 어디에", need=26 * 3 + 44 * 2 + 52 + 36 + 10)
    p.row([(3, "보험", L), (4, I("보험", ex=_ex(ex, "보험"), dv=",".join(BOHEOM), align="center", size=9)),
           (5, "신고서 제목의 [ ]고용보험 · [ ]산재보험 √ 로 들어갑니다", s7)], h=26)
    p.row([(3, "내는 서식", L), (5, I("종류", ex=_ex(ex, "종류"), dv=",".join(JONG), align="center", size=8.5)),
           (4, "당연적용 = 성립신고서 · 임의가입 = 가입신청서(작성방법 2)", s7)], h=26)
    p.row([(3, "누가 내나", L), (9, WHO_T, {"kind": "text", "size": 7.5})], h=52)
    p.row([(3, "언제 내나", L), (9, F("때", '=IF({종류}="","",IF({종류}="' + JONG[1] + '","' + WHEN_G + '","' + WHEN_S + '"))', align="left", size=8.5))], h=44)
    p.row([(3, "낼 곳", L), (9, WHERE_T, {"kind": "text", "size": 8.5})], h=36)
    p.row([(3, "구분 · 사업 형태", L), (2, I("구분", ex=_ex(ex, "구분"), dv=",".join(GUBUN), align="center", size=9)),
           (2, I("형태", ex=_ex(ex, "형태"), dv=",".join(HYEONG), align="center", size=9)),
           (2, "산업재해 발생", dict(L, size=8.5)), (1, I("재해", ex=_ex(ex, "재해"), dv=",".join(JAEHAE), align="center", size=9)),
           (2, "신고일 현재 그 공사에서", s7)], h=26)
    g.sec(p, "㉯  날짜 · 14일 기한 · 신고일", need=26 * 4 + 36 * 3 + 10)
    p.row([(3, "계약일", L), (3, I("계약일", ex=_ex(ex, "계약일"), fmt=DT, align="center", size=9)),
           (3, "계약서상 착공일", L), (3, I("계약착공", ex=_ex(ex, "계약착공"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "실제 착공일", L), (3, I("실착공", ex=_ex(ex, "실착공"), fmt=DT, align="center", size=9)),
           (3, "준공 예정일", L), (3, I("준공예정", ex=_ex(ex, "준공예정"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "날짜 차례", L), (9, F("차례", '=IF(OR(N({계약일})=0,N({실착공})=0),"",IF(AND(N({계약착공})>0,{계약착공}<{계약일}),"' + CHA_BAD1 + '",'
                                     'IF({실착공}<{계약일},"' + CHA_BAD2 + '",IF(AND(N({준공예정})>0,{준공예정}<{실착공}),"' + CHA_BAD3 + '","' + CHA_OK + '"))))',
                                     align="left", size=8.5))], h=36)
    p.row([(3, "성립신고 기한", L),
           (9, F("기한", '=IF(OR({종류}="' + JONG[1] + '",N({실착공})=0),IF({종류}="' + JONG[1] + '","' + GA_NOTE + '",""),'
                 + _ymd(DUE) + '&"(' + '"&' + _yo(DUE) + '&")"&IF(' + SHORT14 + ',"' + DUE_B + '","' + DUE_A + '"))', align="left", size=8.5))], h=36)
    p.row([(3, "신고일", L), (3, I("신고일", ex=_ex(ex, "신고일"), fmt=DT, align="center", size=9)),
           (6, "신고서 끝 날짜로 들어갑니다", s7)], h=26)
    p.row([(3, "기한 확인", L),
           (9, F("확인", '=IF(OR({종류}="' + JONG[1] + '",N({실착공})=0,N({신고일})=0),"",IF({신고일}>' + DUE + ',"' + LATE + '",IF({신고일}=' + DUE
                 + ',"' + OK_DAY + '","' + OK_A + '"&(' + DUE + '-{신고일})&"' + OK_B + '")))', align="left", size=8.5))], h=36)
    g.sec(p, "㉰  총공사금액 · 보험료 신고 기한", need=26 * 2 + 36 * 2 + 10)
    p.row([(3, "계약금액(부가세 제외)", dict(L, size=8.5)), (3, I("계약금액", ex=_ex(ex, "계약금액"), fmt=WON, align="right", size=9)),
           (3, "재료 시가환산액", dict(L, size=8.5)), (3, I("재료", ex=_ex(ex, "재료"), fmt=WON, align="right", size=9))], h=26)
    p.row([(3, "합계액(총공사금액)", dict(L, size=8.5)),
           (3, F("합계", '=IF(AND(N({계약금액})=0,N({재료})=0),"",N({계약금액})+N({재료}))', fmt=WON, align="right", size=9)),
           (3, "발주공사 총금액(분리발주)", dict(L, size=8)), (3, I("발주총액", ex=_ex(ex, "발주총액"), fmt=WON, align="right", size=9))], h=26)
    p.row([(3, "보험료 신고 · 납부", L),
           (9, F("납부", '=IF(OR({종류}="",N({실착공})=0),"",' + _ymd(PAY) + '&"(' + '"&' + _yo(PAY) + '&")' + PAY_TAIL
                 + '"&IF(' + SHORT70 + ',"' + PAY_B + '","' + PAY_A + '"))', align="left", size=8))], h=44)
    g.sec(p, "㉱  하도급 · 낼 서류 · 아직 안 적은 칸 · 다음 할 일", need=26 + 44 * 5 + 10)
    p.row([(3, "하도급", L), (3, I("하도급", ex=_ex(ex, "하도급"), dv=",".join(HADO), align="center", size=9)),
           (2, "개인정보 동의", dict(L, size=8.5)), (2, I("동의", ex=_ex(ex, "동의"), dv="동의함,동의안함", align="center", size=8.5)),
           (2, "신고서 동의서 √", s7)], h=26)
    p.row([(3, "하수급인 승인", L),
           (9, F("하수급", '=IF({구분}="","",IF({구분}="직영","' + SUB_JIK + '",IF({하도급}="' + HADO[1] + '","' + SUB_YES + '",IF({하도급}="' + HADO[0] + '","' + SUB_NO + '",""))))',
                 align="left", size=8))], h=44)
    p.row([(3, "낼 서류", L),
           (9, F("서류", '=IF({종류}="","","' + DOC_BASE + '"&IF(AND({종류}="' + JONG[1] + '",{보험}<>"' + BOHEOM[2] + '"),"' + DOC_IM + '",""))',
                 align="left", size=8))], h=44)
    p.row([(3, "담당 직원 확인", L),
           (9, F("확인서류", '=IF({형태}="","",IF({형태}="법인","' + CHK_BUP + '","' + CHK_GAE + '")&"' + CHK_TAIL + '")', align="left", size=8))], h=44)
    BIN = [("사업주 성명", '{신고서!성명}=""'), ("사업주 주소", '{신고서!주소}=""'), ("휴대전화", '{신고서!휴대}=""'), ("본사 명칭", '{신고서!명칭}=""'),
           ("사업자등록번호", '{신고서!사업자번호}=""'), ("현장명", '{신고서!현장명}=""'), ("현장 소재지", '{신고서!현장소재지}=""'),
           ("계약일", "N({계약일})=0"), ("실제 착공일", "N({실착공})=0"), ("준공 예정일", "N({준공예정})=0"), ("계약금액", "N({계약금액})=0"),
           ("발주자", '{신고서!발주자}=""'), ("신고일", "N({신고일})=0")]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({종류}="",{신고서!성명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))', align="left", size=8.5))], h=44)
    p.row([(3, "다음 할 일", L), (9, F("다음", '=IF(AND({종류}="",{신고서!성명}=""),"","' + NEXT_S + '")', align="left", size=7.5))], h=52)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 보험 · 내는 서식 · 착공일 · 계약금액 · 신고일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 현장 · 사람 · 번호)."])
    return p


# ── 신청(신고)서 앞쪽 ───────────────────────────────────────────────────
PAX = [120, 226, 270, 300, 432, 540, 588, 694, 755, 880, 925, 960, 1000, 1090]
GA = Grid(PAX)


def _ck(cond, text):
    return f'IF({cond},"[√]","[   ]")&"{text}"'


def front(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "신고서", fit=1, widths=GA.w)
    X1, XL, X2 = 120, 226, 1090
    T, G_, M = S["thin"], S["gry"], S["med"]

    def inp(k, **kw):
        kw.setdefault("size", 8.5)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    lab = {"kind": "free", "size": 9, "align": "center", "wrap": True}
    cap = {"kind": "free", "size": 8.5, "align": "left", "indent": 1}
    # 🩹 좁은 이름 칸(226 ~ 300 주소 · 명칭 · 소재지 · 현장명 / 880 ~ 960 전화번호 · 팩스번호) — 사이트 종이(캔버스 lib/격자그림.js)는 들여쓰기를 양쪽에 두고(ind × 7)
    #    글을 접어서 «소재\n지 · 현장\n명 · 전화번\n호» 로 두 줄 · 위가 잘렸음(시험_글자잘림 · 사이트 종이 캡처) → 들여쓰기 대신 앞 빈칸 둘(옆 칸 이름과 같은 자리) · 한 줄(넘치면 글자를 줄임 wrap="shrink")
    cap8 = {"kind": "free", "size": 8.5, "align": "left", "wrap": "shrink"}
    capt = {"kind": "free", "size": 8, "align": "left", "wrap": "shrink"}
    capc = {"kind": "free", "size": 8.5, "align": "center", "wrap": True}
    small = {"kind": "free", "size": 7.5, "align": "left"}
    prow(p, GA, [(X1, 694, HEAD1 + "\n" + HEAD2, dict(small, wrap=True)), (694, X2, TOTAL, dict(small, size=7.5, wrap=True))], h=24)
    p.gap(6)
    bo, jo = "{셈!보험}", "{셈!종류}"
    t1 = F("제목고용", '=' + _ck('AND(' + bo + '<>"",' + bo + '<>"' + BOHEOM[2] + '")', "고용보험") + '&"   "&' + _ck(jo + '="' + JONG[1] + '"', "보험가입신청서"), align="left", size=12.5, bold=True)
    t2 = F("제목산재", '=' + _ck('AND(' + bo + '<>"",' + bo + '<>"' + BOHEOM[1] + '")', "산재보험") + '&"   "&' + _ck(jo + '="' + JONG[0] + '"', "보험관계 성립신고서"), align="left", size=12.5, bold=True)
    prow(p, GA, [(X1, 540, "건설업 및 벌목업", {"kind": "free", "size": 16, "bold": True, "align": "center", "rs": 2}), (540, X2, t1, NB)], h=24)
    prow(p, GA, [(540, X2, t2, NB)], h=24)
    p.gap(8)
    prow(p, GA, [(X1, X2, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=11)
    band = {"kind": "free", "size": 8, "align": "left", "fill": S["gray"], "valign": "top", "indent": 1}
    rb = prow(p, GA, [(X1, 588, "접수번호", band), (588, 880, "접수일", band), (880, X2, "처리기한: 5일", dict(band, align="right"))], h=17.5)
    hline(p, GA, rb, X1, X2, T, below=False)
    hline(p, GA, rb, X1, X2, T)
    vline(p, GA, rb, rb, 588, G_)
    p.gap(3)
    # 사업장관리번호 · 산업재해 발생 여부
    jh = "{셈!재해}"
    r0 = prow(p, GA, [(X1, 432, "사업장관리번호", capc), (432, 694, inp("관리번호", align="center"), NB),
                      (694, 880, "성립신고일 현재\n산업재해 발생 여부", dict(capc, size=8)),
                      (880, X2, F("재해표", '=' + _ck(jh + '="있음"', "있음") + '&"   "&' + _ck(jh + '="없음"', "없음"), align="center", size=8.5), NB)], h=21)
    hline(p, GA, r0, X1, X2, M, below=False)
    hline(p, GA, r0, X1, X2, T)
    for x in (432, 694, 880):
        vline(p, GA, r0, r0, x, G_)
    # 사업주(대표자)
    a1 = prow(p, GA, [(X1, XL, "사업주\n(대표자)", dict(lab, rs=3)), (XL, 432, "성명", dict(cap, valign="top")), (432, 694, inp("성명"), NB),
                      (694, 880, "주민등록번호\n(외국인등록번호)", dict(cap, size=8, wrap=True)), (880, X2, inp("주민", align="center"), NB)], h=23)
    a2 = prow(p, GA, [(XL, 300, "  주소", cap8), (300, 880, inp("주소"), NB), (880, 960, "  전화번호", capt), (960, X2, inp("전화", size=8), NB)], h=17.5)
    a3 = prow(p, GA, [(XL, 432, "전자우편주소", cap), (432, 694, inp("메일", size=8), NB), (694, 880, "휴대전화번호", cap), (880, X2, inp("휴대", size=8, align="center"), NB)], h=17.5)
    hline(p, GA, a1, XL, X2, T)
    hline(p, GA, a2, XL, X2, T)
    hline(p, GA, a3, X1, X2, T)
    vline(p, GA, a2, a2, 880, G_)
    vline(p, GA, a3, a3, 694, G_)
    # 본사
    hy = "{셈!형태}"
    b1 = prow(p, GA, [(X1, XL, "본사", dict(lab, rs=4)), (XL, 300, "  명칭", cap8), (300, 694, inp("명칭"), NB), (694, 880, "사업 형태", dict(capc, align="right")),
                      (880, X2, F("형태표", '=' + _ck(hy + '="법인"', "법인") + '&"   "&' + _ck(hy + '="개인"', "개인"), align="center", size=8.5), NB)], h=17.5)
    b2 = prow(p, GA, [(XL, 300, "  소재지", cap8), (300, 880, inp("소재지"), NB), (880, 960, "  전화번호", capt), (960, X2, inp("본사전화", size=8), NB)], h=17.5)
    b3 = prow(p, GA, [(XL, 432, "사업자등록번호", cap), (432, 694, inp("사업자번호", align="center"), NB), (694, 880, "법인등록번호", cap),
                      (880, X2, inp("법인번호", align="center"), NB)], h=17.5)
    b4 = prow(p, GA, [(XL, 432, "우편물 수령지", cap), (432, 880, inp("수령지", size=8), NB), (880, 960, "  팩스번호", capt), (960, X2, inp("팩스", size=8), NB)], h=17.5)
    for r in (b1, b2, b3):
        hline(p, GA, r, XL, X2, T)
    vline(p, GA, b1, b1, 694, G_)
    vline(p, GA, b1, b2, 880, G_)
    vline(p, GA, b3, b3, 694, G_)
    hline(p, GA, b4, X1, X2, T)
    p.gap(3)
    # 현장(건설공사 및 벌목작업)
    gb = "{셈!구분}"
    c1 = prow(p, GA, [(X1, XL, "현장\n(건설공사\n및\n벌목작업)", dict(lab, rs=10)), (XL, 300, "  현장명", cap8), (300, 755, inp("현장명"), NB),
                      (755, 925, "고용보험 업종코드", capc), (925, X2, inp("고용코드", align="center"), NB)], h=17.5)
    c2 = prow(p, GA, [(XL, 432, "구분", capc), (432, 755, F("구분표", '=' + _ck(gb + '="도급"', "도급") + '&"     "&' + _ck(gb + '="직영"', "직영"), align="center", size=8.5), NB),
                      (755, 925, "산재보험 업종코드", capc), (925, X2, inp("산재코드", align="center"), NB)], h=17.5)
    c3 = prow(p, GA, [(XL, 300, "  소재지", cap8), (300, 880, inp("현장소재지"), NB), (880, 960, "  전화번호", capt), (960, X2, inp("현장전화", size=8), NB)], h=17.5)

    def ymd(k):
        s = "{셈!" + k + "}"
        return F("표" + k, '=IF(N(' + s + ')=0,"' + YMD0 + '",YEAR(' + s + ')&"년   "&MONTH(' + s + ')&"월   "&DAY(' + s + ')&"일")', align="center", size=8.5)

    c4 = prow(p, GA, [(XL, 432, "건설면허번호", capc), (432, 694, inp("면허번호", align="center"), NB), (694, 880, "계 약 일", capc), (880, X2, ymd("계약일"), NB)], h=17.5)
    c5 = prow(p, GA, [(XL, 432, "건축허가(신고)번호", capc), (432, 694, inp("허가번호", align="center", size=8), NB), (694, 880, "계약서상 착공일", capc),
                      (880, X2, ymd("계약착공"), NB)], h=17.5)
    won = {"kind": "free", "size": 8.5, "align": "right"}
    m1 = F("표계약금액", '=IF(N({셈!계약금액})=0,"원",TEXT({셈!계약금액},"#,##0")&" 원")', align="right", size=8.5)
    m2 = F("표재료", '=IF(N({셈!재료})=0,"원",TEXT({셈!재료},"#,##0")&" 원")', align="right", size=8.5)
    m3 = F("표합계", '=IF(N({셈!합계})=0,"원",TEXT({셈!합계},"#,##0")&" 원")', align="right", size=8.5)
    m4 = F("표발주총액", '=IF(N({셈!발주총액})=0,"원",TEXT({셈!발주총액},"#,##0")&" 원")', align="right", size=8.5)
    c6 = prow(p, GA, [(XL, 270, "총\n공\n사\n금\n액", dict(lab, size=8.5, rs=4)), (270, 432, "계약금액\n(부가세 제외)", dict(capc, size=8)), (432, 694, m1, NB),
                      (694, 880, "실제 착공일", capc), (880, X2, ymd("실착공"), NB)], h=22)
    c7 = prow(p, GA, [(270, 432, "재료 시가환산액", capc), (432, 694, m2, NB), (694, 880, "준공 예정일", capc), (880, X2, ymd("준공예정"), NB)], h=17.5)
    c8 = prow(p, GA, [(270, 432, "합계액", capc), (432, 694, m3, NB), (694, 880, "벌목재적량", capc), (880, 1000, inp("재적량", align="right"), NB),
                      (1000, X2, "㎥", won)], h=17.5)
    c9 = prow(p, GA, [(270, 432, "발주공사 총금액\n(분리발주된 경우)", dict(capc, size=8)), (432, 694, m4, NB), (694, 880, "벌목 상시근로자수", capc),
                      (880, 1000, inp("벌목인원", align="right"), NB), (1000, X2, "명", won)], h=22)
    c10 = prow(p, GA, [(XL, 432, "발주자 성명", capc), (432, 694, inp("발주자", align="center"), NB), (694, 880, "발주자 연락처", capc),
                       (880, X2, inp("발주연락", align="center"), NB)], h=15)
    for r in (c1, c2, c3, c4, c5):
        hline(p, GA, r, XL, X2, T)
    for r in (c6, c7, c8):
        hline(p, GA, r, 270, X2, T)
    hline(p, GA, c9, XL, X2, T)
    hline(p, GA, c1, X1, X2, M, below=False)
    hline(p, GA, c10, X1, X2, M)
    vline(p, GA, c1, c2, 755, G_)
    vline(p, GA, c1, c2, 925, G_)
    vline(p, GA, c2, c2, 432, G_)
    vline(p, GA, c3, c3, 880, G_)
    for x in (432, 694, 880):
        vline(p, GA, c4, c10, x, G_)
    vline(p, GA, c6, c9, 270, G_)
    vline(p, GA, a1, c10, XL, G_)
    p.gap(14)
    prow(p, GA, [(X1, X2, "「고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행규칙」 제3조제1항 또는 제7조제1항에\n따라 위와 같이 신청(신고)합니다.",
                  {"kind": "free", "size": 9.5, "indent": 2, "wrap": True})], h=34)
    p.gap(4)
    sd = "{셈!신고일}"
    prow(p, GA, [(X1, X2, F("표신고일", '=IF(N(' + sd + ')=0,"년         월         일",YEAR(' + sd + ')&"년      "&MONTH(' + sd + ')&"월      "&DAY(' + sd + ')&"일")',
                             align="right", size=9), NB)], h=19)
    nm = F("표신고인", '=IF({성명}="","",{성명})', align="center", size=8.5)
    prow(p, GA, [(X1, 588, "", NB), (588, 880, "신청ㆍ신고인(사업주)", dict(FRC, size=9)), (880, 960, nm, NB), (960, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=18)
    prow(p, GA, [(X1, 588, "", NB), (588, 880, "보험사무대행기관", dict(FRC, size=9)), (880, 960, inp("대행기관", size=8, align="center"), NB),
                 (960, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=18)   # 🩹 «(서명 또는 인)» 칸 90 → 130(사이트 종이에서 두 줄로 접혀 «인)» 아래가 잘렸음)
    p.gap(4)
    r = prow(p, GA, [(X1, X2, "근로복지공단 ○○○○지역본부(지사)장   귀하", {"kind": "free", "size": 12, "bold": True, "align": "left", "indent": 1})], h=20)
    hline(p, GA, r, X1, X2, T)
    p.gap(2)
    r = prow(p, GA, [(X1, X2, "개인정보 수집 및 이용 동의서", {"kind": "free", "size": 9, "bold": True, "align": "center"})], h=15)
    hline(p, GA, r, X1, X2, T, below=False)
    hline(p, GA, r, X1, X2, G_)
    prow(p, GA, [(X1, X2, "  본인은 이 건 민원사무처리에 대한 처리결과 안내, 캠페인(이벤트), 사업홍보물, 고객만족도조사 및 관련 제도개선에 필요한 "
                          "의견조사를 위해 우편, 휴대전화 또는 전자우편 등으로 수신ㆍ참여하는 것에 동의합니다.", {"kind": "free", "size": 7.8, "wrap": True})], h=24)
    prow(p, GA, [(X1, X2, F("표동의일", '=IF(N(' + sd + ')=0,"년         월         일",YEAR(' + sd + ')&"년      "&MONTH(' + sd + ')&"월      "&DAY(' + sd + ')&"일")',
                             align="right", size=8), NB)], h=17.5)
    dg = "{셈!동의}"
    prow(p, GA, [(X1, X2, F("표동의", '="   위와 같이 개인정보를 수집ㆍ이용하는데 동의하십니까?  ("&' + _ck(dg + '="동의함"', " 동의함") + '&"   "&'
                             + _ck(dg + '="동의안함"', " 동의안함") + '&")"', align="left", size=7.8), NB)], h=17)
    r = prow(p, GA, [(X1, 588, "", NB), (588, 880, "신고인(신청인)", dict(FRC, size=8.5)), (880, 960, F("표신고인2", '=IF({성명}="","",{성명})', align="center", size=8), NB),
                     (960, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=17.5)
    hline(p, GA, r, X1, X2, M)
    p.gap(4)
    prow(p, GA, [(X1, X2, "※ 처리 사항(아래 사항은 신청인ㆍ신고인이 적지 않습니다)", {"kind": "free", "size": 8.5, "align": "left"})], h=14)
    d1 = prow(p, GA, [(X1, 270, "가입승인 여부", dict(capc, rs=2)), (270, 432, "[   ]승  인\n[   ]불승인", dict(capc, rs=2)), (432, 694, "보험관계 성립일", dict(capc, rs=2)),
                      (694, 880, "고용보험", capc), (880, X2, YMD0, dict(capc))], h=20)
    d2 = prow(p, GA, [(694, 880, "산재보험", capc), (880, X2, YMD0, dict(capc))], h=20)
    hline(p, GA, d1, X1, X2, T, below=False)
    hline(p, GA, d1, 694, X2, G_)
    hline(p, GA, d2, X1, X2, T)
    for x in (270, 432, 694, 880):
        vline(p, GA, d1, d2, x, G_)
    p.gap(2)
    prow(p, GA, [(X1, X2, "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["제목 √ · 산업재해 · 사업 형태 · 구분 √ · 날짜 · 금액 · 신고일은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 현장 · 사람 · 번호)."])
    return p


# ── 뒤쪽(원문 그대로) ────────────────────────────────────────────────────
JE = ["1. 공사도급계약서 사본(공사비명세서를 포함합니다)",
      "2. 근로자 과반수의 동의를 받은 사실을 증명하는 서류 1부(고용보험 임의적용 가입신청의 경우에만 해당합니다)"]
HW = ["1. 사업자등록증명(주민등록번호 뒷자리가 제외된 사업자등록증명을 말합니다)",
      "2. 주민등록표 초본[신청(고)인이 개인인 경우만 해당합니다]. 다만, 신청(고)인이 직접 신청(고)서를 제출하면서 신분증명서(주민등록증, 운전면허증, "
      "여권을 말합니다)를 제시하는 경우에는 그 신분증명서의 확인으로 주민등록표 초본의 확인을 갈음합니다.",
      "3. 법인 등기사항증명서[신청(고)인이 법인인 경우만 해당합니다]",
      "4. 건축ㆍ대수선ㆍ용도변경 허가서 또는 신고필증(건설업인 경우만 해당합니다)"]
HAENG = ("  본인은 이 건 업무처리와 관련하여 「전자정부법」 제36조제1항에 따른 행정정보의 공동이용을 통하여 위의 담당 직원 확인사항란의 "
         "제1호, 제2호 및 제4호의 행정정보를 확인하는 것에 동의합니다.")
HAENG2 = "  *동의하지 않는 경우에는 신고인이 직접 해당 서류(제4호의 경우에는 그 사본을 말합니다)를 제출해야 합니다."
YU = ["1. 산재보험 적용사업(장)은 「임금채권보장법」 및 「석면피해구제법」(벌목업은 상시근로자가 20명 이상인 경우만 해당합니다)을 당연히 적용받게 됩니다.",
      "2. 위 성립신고서는 보험관계 성립일(공사착공일)부터 14일 이내에 제출해야 하며, 사업주는 3월 말(연도 중에 보험관계가 성립한 경우에는 보험관계 성립일부터 "
      "70일 이내, 기간의 정함이 있는 사업으로서 70일 이내에 끝나는 사업인 경우 공사 종료일 전날까지)까지 고용ㆍ산재보험료(「임금채권보장법」에 따른 부담금 및 "
      "「석면피해구제법」에 따른 분담금 포함)를 신고하고, 이를 자진납부해야 합니다.",
      "3. 위 기간이 경과할 때에는 관련 법 규정에 따른 불이익이 있을 수 있습니다.",
      "4. 보험가입자께서는 사업의 소재지, 가입자 인적사항, 전화번호 등이 변경되거나 사업장이 휴업ㆍ폐업될 경우 우리 공단에 신고해야 합니다.",
      "5. 보험가입을 신청하여 공단이 승인한 경우 그 접수일의 다음 날부터 적용됩니다.",
      "6. 「고용보험 및 산업재해보상보험의 보험료 징수 등에 관한 법률」 제9조제1항 단서에 따라 하수급인을 사업주로 인정받게 하려는 원수급인은 하도급공사의 "
      "착공일부터 30일 이내에 하수급인 사업주 승인신청서를 우리 공단에 제출해야 합니다.",
      "7. 건설업 및 벌목업 중 「고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률」 제8조에 따른 일괄적용 대상 사업의 경우에는 별도의 서식을 이용하여 "
      "근로복지공단에 제출하기 바랍니다."]
JAK = ["1. 고용보험, 산재보험 중 신고(신청)하려는 난에 \"√\" 표시를 하시기 바랍니다.",
       "2. 보험관계 성립신고서란에는 당연적용, 보험가입신청서란에는 임의가입일 경우 \"√\" 표시를 합니다.",
       "3. 휴대전화번호, 전화번호 및 전자우편주소(E-mail)를 꼭 적어주시기 바랍니다.",
       "4. \"성립신고일 현재 산업재해발생 여부\" 란은 제출일 현재 해당 건설공사에서 산업재해가 발생한 경우에는［ ］있음에, 산업재해 발생 사실이 없다면 ［ ］없음에 "
       "\"√\" 로 표시합니다.",
       "5. \"우편물 수령지\" 란은 사업장 소재지와 별도의 주소로 우편물을 받을 경우에만 적습니다.",
       "6. \"건축허가(신고)사항\"에는 건축허가(신고)에 따른 건축공사에 한하여 \"건축허가기관\"과 \"건축허가번호\"를 적습니다.",
       "7. \"벌목 상시근로자수\"에는 보험관계 성립일 현재 사용하는 근로자 수를 적습니다."]
STEP = ["신청(신고)서\n작성", "접수 및 확인", "신청(신고)서\n처리", "처리결과 통지", "수 령"]
BAX = [120, 226, 268, 418, 468, 618, 668, 818, 868, 940, 1018, 1090]
GB = Grid(BAX)


def back(bk, ex):
    from fb import text_lines
    S = _sides()
    p = g.pg(bk, ex, "뒤쪽", fit=1, widths=GB.w)
    X1, XL, X2, XR = 120, 226, 1090, 940
    T, G_, M = S["thin"], S["gry"], S["med"]
    prow(p, GB, [(X1, X2, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=12)
    r0 = prow(p, GB, [(X1, X2, "", NB)], h=2)
    hline(p, GB, r0, X1, X2, M)
    p.gap(52)
    tx = {"kind": "free", "size": 7.6, "align": "left", "wrap": True, "valign": "center", "indent": 1}
    lab = {"kind": "free", "size": 8.5, "align": "center", "wrap": True}
    cols = sum(GB.w[GB.ix[XL]:GB.ix[XR]])
    nj = sum(text_lines(t, cols * 10.0 / 7.6) for t in JE)
    nh = sum(text_lines(t, cols * 10.0 / 7.6) for t in HW)
    a = prow(p, GB, [(X1, XL, "신고(신청)인\n제출서류", lab), (XL, XR, "\n".join(JE), tx), (XR, X2, "수수료\n\n없음", dict(lab, rs=2))], h=nj * 7.6 * 1.42 + 6)
    b = prow(p, GB, [(X1, XL, "담당 직원\n확인사항", lab), (XL, XR, "\n".join(HW), tx)], h=nh * 7.6 * 1.42 + 6)
    hline(p, GB, a, X1, X2, T, below=False)
    hline(p, GB, a, X1, XR, G_)
    hline(p, GB, b, X1, X2, T)
    vline(p, GB, a, b, XL, G_)
    vline(p, GB, a, b, XR, G_)
    bandf = {"kind": "free", "size": 9.5, "align": "center", "fill": S["band"]}
    r = prow(p, GB, [(X1, X2, "행정정보 공동이용 동의서", bandf)], h=16)
    hline(p, GB, r, X1, X2, M, below=False)
    ht = {"kind": "free", "size": 7.8, "align": "left", "wrap": True}
    prow(p, GB, [(X1, X2, HAENG, ht)], h=text_lines(HAENG, sum(GB.w) * 10.0 / 7.8) * 7.8 * 1.42 + 4)
    prow(p, GB, [(X1, X2, HAENG2, ht)], h=13)
    r = prow(p, GB, [(X1, 668, "", NB), (668, 868, "신고(신청)인", dict(FRC, size=8.5)), (868, 940, "", NB), (940, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=15)
    hline(p, GB, r, X1, X2, T)
    for nm, items, sz, lh in (("유의사항", YU, 7.6, 1.55), ("작성방법", JAK, 7.6, 1.42)):
        r = prow(p, GB, [(X1, X2, nm, bandf)], h=16)
        hline(p, GB, r, X1, X2, M, below=False)
        for t in items:
            n = text_lines(t, (sum(GB.w) - 2) * 10.0 / sz)
            prow(p, GB, [(X1, X2, t, {"kind": "free", "size": sz, "align": "left", "wrap": True, "indent": 1, "valign": "top"})], h=n * sz * lh + 3)
        rr = prow(p, GB, [(X1, X2, "", NB)], h=2)
        hline(p, GB, rr, X1, X2, T)
    r = prow(p, GB, [(X1, X2, "처리절차", bandf)], h=16)
    hline(p, GB, r, X1, X2, M, below=False)
    p.gap(5)
    box = {"kind": "free", "size": 8, "align": "center", "wrap": True}
    arw = {"kind": "free", "size": 9, "align": "center"}
    # 상자 자리는 BAX 칸 끝에 맞춤(상자 다섯 · 사이 화살표)
    cells = [(X1, 226, STEP[0], box), (226, 268, "➔", arw), (268, 418, STEP[1], box), (418, 468, "➔", arw), (468, 618, STEP[2], box),
             (618, 668, "➔", arw), (668, 818, STEP[3], box), (818, 868, "➔", arw), (868, 1018, STEP[4], box), (1018, X2, "", NB)]
    r1 = prow(p, GB, cells, h=26)
    for x1, x2 in ((X1, 226), (268, 418), (468, 618), (668, 818), (868, 1018)):
        hline(p, GB, r1, x1, x2, G_, below=False)
        hline(p, GB, r1, x1, x2, G_)
        vline(p, GB, r1, r1, x1, G_)
        vline(p, GB, r1, r1, x2, G_)
    sm = {"kind": "free", "size": 7.6, "align": "center"}
    r2 = prow(p, GB, [(X1, 226, "신청(신고)인", sm), (226, 468, "", NB), (468, 618, "근로복지공단", sm), (618, X2, "", NB)], h=14)
    p.gap(3)
    rr = prow(p, GB, [(X1, X2, "", NB)], h=2)
    hline(p, GB, rr, X1, X2, T)
    p.end_print()
    p.after_note(["뒤쪽은 원문 그대로입니다(보험료징수법 시행규칙 별지 제3호서식)."])
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
    bo, jo, gb, hy, jh, hd = sm.get("보험"), sm.get("종류"), sm.get("구분"), sm.get("형태"), sm.get("재해"), sm.get("하도급")
    gy, gc, sc, jg, sd = sm.get("계약일"), sm.get("계약착공"), sm.get("실착공"), sm.get("준공예정"), sm.get("신고일")
    ga, jr, bal = sm.get("계약금액"), sm.get("재료"), sm.get("발주총액")
    a["때"] = "" if not jo else (WHEN_G if jo == JONG[1] else WHEN_S)
    if not gy or not sc:
        a["차례"] = ""
    elif gc and gc < gy:
        a["차례"] = CHA_BAD1
    elif sc < gy:
        a["차례"] = CHA_BAD2
    elif jg and jg < sc:
        a["차례"] = CHA_BAD3
    else:
        a["차례"] = CHA_OK
    s14 = bool(sc) and bool(jg) and jg < sc + T(days=14)
    due = _wkp(jg - T(days=1) if s14 else sc + T(days=13)) if sc else None
    if jo == JONG[1] or not sc:
        a["기한"] = GA_NOTE if jo == JONG[1] else ""
    else:
        a["기한"] = f"{_ymdp(due)}({YOIL[due.weekday()]})" + (DUE_B if s14 else DUE_A)
    if jo == JONG[1] or not sc or not sd:
        a["확인"] = ""
    elif sd > due:
        a["확인"] = LATE
    elif sd == due:
        a["확인"] = OK_DAY
    else:
        a["확인"] = f"{OK_A}{(due - sd).days}{OK_B}"
    a["합계"] = "" if not ga and not jr else (ga or 0) + (jr or 0)
    if not jo or not sc:
        a["납부"] = ""
    else:
        short = bool(jg) and jg < sc + T(days=70)
        pay = _wkp(jg - T(days=1) if short else sc + T(days=69))
        a["납부"] = f"{_ymdp(pay)}({YOIL[pay.weekday()]}){PAY_TAIL}" + (PAY_B if short else PAY_A)
    if not gb:
        a["하수급"] = ""
    elif gb == "직영":
        a["하수급"] = SUB_JIK
    else:
        a["하수급"] = SUB_YES if hd == HADO[1] else (SUB_NO if hd == HADO[0] else "")
    a["서류"] = "" if not jo else DOC_BASE + (DOC_IM if (jo == JONG[1] and bo != BOHEOM[2]) else "")
    a["확인서류"] = "" if not hy else (CHK_BUP if hy == "법인" else CHK_GAE) + CHK_TAIL
    keys = [("사업주 성명", not fr.get("성명")), ("사업주 주소", not fr.get("주소")), ("휴대전화", not fr.get("휴대")), ("본사 명칭", not fr.get("명칭")),
            ("사업자등록번호", not fr.get("사업자번호")), ("현장명", not fr.get("현장명")), ("현장 소재지", not fr.get("현장소재지")),
            ("계약일", not gy), ("실제 착공일", not sc), ("준공 예정일", not jg), ("계약금액", not ga), ("발주자", not fr.get("발주자")), ("신고일", not sd)]
    if not jo and not fr.get("성명"):
        a["빈칸"] = a["다음"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
        a["다음"] = NEXT_S
    b["제목고용"] = _ckp(bool(bo) and bo != BOHEOM[2], "고용보험") + "   " + _ckp(jo == JONG[1], "보험가입신청서")
    b["제목산재"] = _ckp(bool(bo) and bo != BOHEOM[1], "산재보험") + "   " + _ckp(jo == JONG[0], "보험관계 성립신고서")
    b["재해표"] = _ckp(jh == "있음", "있음") + "   " + _ckp(jh == "없음", "없음")
    b["형태표"] = _ckp(hy == "법인", "법인") + "   " + _ckp(hy == "개인", "개인")
    b["구분표"] = _ckp(gb == "도급", "도급") + "     " + _ckp(gb == "직영", "직영")
    for k, v in (("계약일", gy), ("계약착공", gc), ("실착공", sc), ("준공예정", jg)):
        b["표" + k] = YMD0 if not v else f"{v.year}년   {v.month}월   {v.day}일"

    def won(v):
        return "원" if not v else f"{v:,} 원"
    b["표계약금액"] = won(ga)
    b["표재료"] = won(jr)
    b["표합계"] = won((ga or 0) + (jr or 0)) if (ga or jr) else "원"
    b["표발주총액"] = won(bal)
    b["표신고일"] = "년         월         일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    b["표동의일"] = b["표신고일"]
    b["표신고인"] = b["표신고인2"] = fr.get("성명") or ""
    dg = sm.get("동의")
    b["표동의"] = ("   위와 같이 개인정보를 수집ㆍ이용하는데 동의하십니까?  (" + _ckp(dg == "동의함", " 동의함") + "   " + _ckp(dg == "동의안함", " 동의안함") + ")")
    return {"셈": a, "신고서": b}
