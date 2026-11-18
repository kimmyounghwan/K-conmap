# -*- coding: utf-8 -*-
"""(고용보험, 산재보험) 하수급인 사업주 보험가입 승인신청서 — 새로 만든 서식 (2026-11-18 G772 · 소장님 「…만들지 못한 서식도 10개 만들어 줘」 — 여섯째 · 4대보험 2)
   → ① 셈: 보험(고용 · 산재) · 누가 내나(원수급인) · 하수급인 업종(시행령 제7조② 여섯 — 아니면 승인 대상 아님) · 보험료 납부 인수 서면계약(영 제7조③) ·
     하도급공사 실제 착공일 → 신청 기한(착공일을 첫날로 30일째 · 토 · 일요일이면 월요일) · 날짜 차례 · 신청일 확인 ·
     업무상 재해(착공 후 15일 ~ 신청일 → 불승인 영 제7조④1 · 14일 안 → 보험급여액 징수 대상이면 불승인 ④2) · 승인 판단 ·
     하수급(공사)금액(공사금액 + 재료 시가환산액) · 공사기간 · 낼 서류 둘 · 아직 안 적은 칸 · 다음 할 일
   · 신청서 앞쪽(고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행규칙 [별지 제8호서식] <개정 2021. 12. 31.> 칸 차례 그대로 —
     제목 √ 둘 · 접수 띠 · 원수급인(신청인) 본사 · 원수급 사업 · 하수급인 본사 · 하수급 사업 · 업무상 재해 · 신청 문구 · 서명 · 귀하 · 제출서류 · 처리 사항) ·
     뒤쪽(개인정보 수집 및 이용 동의서(선택) · 유의사항 1 · 2 · 작성방법 1 ~ 6 · 처리절차 원문 그대로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G772/구조.md — 바깥 120 ~ 1117 · 이름 칸 227 · 311 · 가운데 735 · 815 · 903 · 접수 띠 405 · 865 · 제출 상자 256 · 990).
   🩹 G771 에서 배운 것: 사이트 종이(lib/격자그림.js)는 들여쓰기를 양쪽에 둠 → 좁은 이름 칸은 들여쓰기 대신 앞 빈칸 둘 · wrap="shrink"(한 줄) · «(서명 또는 인)» 칸은 넉넉히.

근거(국가법령정보센터 · 2026-11-18 · 원문 /home/claude/g10/notes/G772/원문_대조용.txt · 조문 G772/근거.md — 세 번):
  · 법 제9조①(도급사업 — 원수급인이 사업주 · 공단 승인을 받으면 하수급인) · 제7조5(승인받은 하수급인의 성립일 = 하도급공사의 착공일)
  · 시행령 제7조②(하수급인 여섯 업종 — 건설사업자 · 주택건설사업자 · 전기공사업자 · 정보통신공사업자 · 소방시설업자 · 국가유산수리업자) ·
      ③(원수급인 — 보험료 납부 인계 · 인수 서면계약(전자문서 포함) + 하도급공사 착공일부터 30일 이내 승인 신청) · ④(불승인 — 1 착공 후 15일부터 신청 전 재해 · 2 신청 전 재해로 보험급여액 징수)
  · 시행규칙 [시행 2026. 7. 1.] 제6조①(별지 제8호서식 · 도급계약서 사본 · 보험료 납부 인수 서면계약서 사본) · ②(접수일부터 5일 안에 별지 제9호서식 통지 — 원수급인 · 하수급인 각각)
  · 서식 유의사항 2(여섯 업종만 승인 대상 — 서식은 «문화재수리업자» · 시행령은 2024. 5. 7. 부터 «국가유산수리업자»)
■ 원문 그대로: 머리 · 제목 · 칸 이름 · 신청 문구 · 귀하 · 제출서류 · 처리 사항 · 뒤쪽 전부.
■ 날 수 셈 — 착공일을 첫날로(30일째 = 착공일 + 29 · 늦지 않게 하루 일찍 · G771 · lib/보험료셈.js 와 같은 셈) · 토 · 일요일이면 월요일.
■ 짐작 안 함: 업종코드 · 사업장관리번호(공단이 적음 · 회색) · 업무상 재해 날짜 셈(서식대로 «착공 후 14일 이내 / 15일 ~ 신청일» 을 고름) ·
  보험급여액 징수 대상인지(④2 — 글로 알림) · 늦게 낸 신청의 처리(글로 «기한 안에»)."""
import datetime

import sgw as g
from fb import F, I
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, FRR, FRC, NB, _ymd
from sgw import L

SLUG = "hasugeupin-boheom-seungin"
TITLE = "하수급인 사업주 보험가입 승인신청서(고용 · 산재)"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "하수급인 사업주 보험가입 승인신청서(보험료징수법 시행규칙 별지 제8호서식) — 빈 서식 앞쪽 (원문 칸 차례 그대로)"),
        (5, "하수급인 사업주 보험가입 승인신청서 — 작성 예시 (제목 √ · 공사기간 · 하수급 금액 · 업무상 재해가 ① 장에서)"),
        (3, "뒤쪽 — 개인정보 수집 및 이용 동의서(선택) · 유의사항 · 작성방법 · 처리절차 (원문 그대로)"),
        (4, "① 누가 · 하수급인 업종 · 서면계약 · 30일 기한 · 업무상 재해 · 승인 판단 — 작성 예시 (가상의 공사)")]
MULTI = True
SHORT = ("하수급인 사업주 보험가입 승인신청서(고용 · 산재 — 보험료징수법 시행규칙 별지 제8호서식) — 원수급인이 하수급인을 그 하도급공사의 사업주로 인정받으려고 "
         "하도급공사 착공일부터 30일 안에 근로복지공단에 냅니다. 착공일 · 업종 · 서면계약 · 업무상 재해를 적으면 신청 기한 · 승인 판단 · 하수급 금액이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
T = datetime.timedelta
DT = 'yyyy". "m". "d"."'
WON = '#,##0;[Red]-#,##0;""'
MYEONG = '#,##0"명";-#,##0"명";""'
BOHEOM = ["고용 · 산재 둘 다", "고용보험만", "산재보험만"]
UPJONG = ["건설사업자(건설산업기본법)", "주택건설사업자(주택법)", "전기공사업자(전기공사업법)", "정보통신공사업자(정보통신공사업법)",
          "소방시설업자(소방시설공사업법)", "국가유산수리업자(서식: 문화재수리업자)", "그 밖(여섯 업종 아님)"]
GYEYAK = ["맺음", "아직"]
JAEHAE = ["없음", "있음 — 착공 후 14일 이내", "있음 — 착공 후 15일 ~ 신청일"]

WHO_T = ("원수급인(신청인)이 냅니다 — 건설공사가 여러 차례 도급으로 시행되면 원수급인이 보험료를 내는 사업주인데, 근로복지공단의 승인을 받으면 "
         "하수급인이 그 하도급공사의 사업주가 됩니다(법 제9조①)")
WHERE_T = "근로복지공단 지역본부(지사)에 냅니다 — 고용 · 산재보험 토탈서비스(total.comwel.or.kr)로도 신청할 수 있습니다 · 처리기간 5일 · 수수료 없음"
UP_OK = "✓ 승인 대상 업종입니다(시행령 제7조②)"
UP_NO = "✗ 여섯 업종(건설 · 주택건설 · 전기공사 · 정보통신공사 · 소방시설 · 국가유산수리)이 아니면 승인 대상이 아닙니다(유의사항 2)"
GY_OK = "✓ 서면계약(전자문서 포함) 사본을 함께 냅니다"
GY_NO = "⚠ 보험료 납부 인계 · 인수 서면계약(전자문서 포함)을 먼저 맺으세요(시행령 제7조③)"
DUE_T = "까지 — 하도급공사 착공일을 첫날로 30일째(시행령 제7조③ · 토 · 일요일이면 월요일 · 공휴일이면 그다음 날)"
OK_A = "✓ 기한 안 — 기한까지 "
OK_B = "일 남음"
OK_DAY = "✓ 오늘이 기한입니다"
LATE = "⚠ 기한이 지났습니다 — 하도급공사 착공일부터 30일 안에 내야 합니다(시행령 제7조③)"
CHA_BAD1 = "⚠ 실제 착공일이 하도급 계약일보다 앞입니다"
CHA_BAD2 = "⚠ 공사기간 끝이 시작보다 앞입니다"
CHA_BAD3 = "⚠ 신청일이 실제 착공일보다 앞입니다(날짜 확인)"
CHA_OK = "✓ 날짜 차례가 맞습니다(계약 → 착공 → 신청)"
PAN_UP = "✗ 승인 대상이 아닙니다 — 하수급인이 여섯 업종일 때만(시행령 제7조② · 유의사항 2)"
PAN_JAE15 = "✗ 승인되지 않습니다 — 하도급공사 착공 후 15일부터 신청 전까지 업무상 재해가 있었음(시행령 제7조④1)"
PAN_LATE = "⚠ 신청 기한(착공일부터 30일)이 지났습니다 — 기한 안에 내야 합니다(시행령 제7조③)"
PAN_GY = "⚠ 보험료 납부 인계 · 인수 서면계약을 먼저 맺으세요(시행령 제7조③) — 그 사본을 냅니다"
PAN_JAE_Q = "업무상 재해 발생 여부를 고르세요(신청일 현재까지 그 하도급공사에서 · 작성방법 6)"
PAN_JAE14 = ("⚠ 착공 후 14일 안의 재해로 원수급인에게서 보험급여액을 징수해야 하는 경우면 승인되지 않습니다(시행령 제7조④2) — "
             "아니면 승인 요건을 갖췄습니다")
PAN_OK = "✓ 승인 요건을 갖췄습니다 — 승인되면 하수급인이 이 하도급공사의 사업주(보험관계 성립일 = 하도급공사 착공일 · 법 제7조5)"
DOC_T = "① 도급계약서 사본 1부 ② 보험료 납부 인수에 관한 계약서(전자문서로 된 계약서 포함) 사본 1부 — 수수료 없음"
NEXT_T = ("① 공단이 접수일부터 5일 안에 승인 · 불승인을 통지서(별지 제9호서식)로 원수급인과 하수급인에게 알립니다(시행규칙 제6조②) "
          "② 승인되면 하수급인이 그 하도급공사의 보험료를 신고 · 납부(성립일 = 하도급공사 착공일부터 70일 · 법 제17조①) · 근로자 신고도 하수급인이 "
          "③ 불승인이면 원수급인이 그대로 사업주입니다")
BIN_OK = "✓ 신청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
HEAD1 = "■ 고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행규칙"
HEAD2 = "[별지 제8호서식] <개정 2021. 12. 31.>"
TOTAL = "고용 · 산재보험토탈서비스(total.comwel.or.kr)\n에서도  신청할 수 있습니다."
YMD0 = "년      월      일"

# ── 작성 예시(가상의 회사 · 현장 · 사람 · 번호) ──────────────────────────
EX = {"보험": BOHEOM[0], "업종": UPJONG[0], "계약서": "맺음", "재해": "없음", "동의": "동의함",
      "계약일": D(2027, 3, 10), "착공": D(2027, 3, 15), "시작": D(2027, 3, 15), "끝": D(2027, 8, 31), "신청일": D(2027, 3, 29),
      "공사금액": 320_000_000, "재료": 0}
EX_S = {"원상호": "가나건설(주)", "원대표": "홍길동", "원소재지": "가나시 다라구 마바로 12", "원전화": "000-0000-0000", "원팩스": "000-0000-0000",
        "원메일": "gana@example.com", "원수령지": None, "원수취인": None, "원관리번호": "000-00-00000-0", "원현장명": "가나지구 배수로 정비공사",
        "원현장소재지": "가나시 바사구 아자동 일원", "원현장전화": "000-0000-0000",
        "하상호": "다라토건(주)", "하대표": "김철수", "하사업자번호": "000-00-00000", "하법인번호": "000000-0000000", "하소재지": "가나시 마바구 사아로 34",
        "하전화": "000-0000-0000", "하팩스": None, "하메일": "dara@example.com", "하수령지": None, "하수취인": None,
        "하현장명": "가나지구 배수로 정비공사 중 철근콘크리트공사", "면허종류": "철근ㆍ콘크리트공사업", "면허번호": "가나-00-0000", "등록일자": D(2018, 5, 1),
        "하현장소재지": "가나시 바사구 아자동 일원", "하현장전화": "000-0000-0000", "상시": 12, "총피": 15, "대행기관": None}


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def _wk(ref):
    """토 · 일요일이면 월요일로"""
    return f"{ref}+IF(WEEKDAY({ref})=7,2,IF(WEEKDAY({ref})=1,1,0))"


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


DUE0 = "{착공}+29"
DUE = _wk(DUE0)


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  하수급인 사업주 승인 — 업종 · 30일 기한 · 재해 · 승인 판단 (저절로)", {"kind": "h2", "size": 13})], h=30)
    g.note(p, "※ 건설공사를 하도급하면 원수급인이 고용 · 산재보험의 사업주입니다. 원수급인이 하도급공사 착공일부터 30일 안에 이 신청서를 내 승인을 받으면 "
              "하수급인이 그 하도급공사의 사업주가 됩니다. 기한은 착공일을 첫날로 셉니다(늦지 않게). 여기 적은 것이 신청서 제목 √ · 날짜 · 금액 · 재해 칸으로 들어갑니다.")
    g.sec(p, "㉮  무엇을 내나 · 누가 · 어디에 · 승인 대상", need=26 * 3 + 44 * 3 + 52 + 10)
    p.row([(3, "보험", L), (4, I("보험", ex=_ex(ex, "보험"), dv=",".join(BOHEOM), align="center", size=9)),
           (5, "신청서 제목의 [ ]고용보험 · [ ]산재보험 √ 로 들어갑니다", s7)], h=26)
    p.row([(3, "누가 내나", L), (9, WHO_T, {"kind": "text", "size": 7.5})], h=52)
    p.row([(3, "낼 곳", L), (9, WHERE_T, {"kind": "text", "size": 8})], h=36)
    p.row([(3, "하수급인 업종", L), (5, I("업종", ex=_ex(ex, "업종"), dv=",".join(UPJONG), align="center", size=8.5)),
           (4, "시행령 제7조② — 여섯 업종만 승인 대상", s7)], h=26)
    p.row([(3, "업종 확인", L), (9, F("업종확인", '=IF({업종}="","",IF({업종}="' + UPJONG[6] + '","' + UP_NO + '","' + UP_OK + '"))', align="left", size=8.5))], h=44)
    p.row([(3, "서면계약", L), (2, I("계약서", ex=_ex(ex, "계약서"), dv=",".join(GYEYAK), align="center", size=9)),
           (7, F("계약확인", '=IF({계약서}="","",IF({계약서}="아직","' + GY_NO + '","' + GY_OK + '"))', align="left", size=8))], h=44)
    g.sec(p, "㉯  날짜 · 30일 기한 · 신청일", need=26 * 3 + 36 * 3 + 10)
    p.row([(3, "하도급 계약일", L), (3, I("계약일", ex=_ex(ex, "계약일"), fmt=DT, align="center", size=9)),
           (3, "실제 착공일(하도급공사)", dict(L, size=8.5)), (3, I("착공", ex=_ex(ex, "착공"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "공사기간 시작", L), (3, I("시작", ex=_ex(ex, "시작"), fmt=DT, align="center", size=9)),
           (3, "공사기간 끝", L), (3, I("끝", ex=_ex(ex, "끝"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "날짜 차례", L), (9, F("차례", '=IF(OR(N({계약일})=0,N({착공})=0),"",IF({착공}<{계약일},"' + CHA_BAD1 + '",'
                                     'IF(AND(N({시작})>0,N({끝})>0,{끝}<{시작}),"' + CHA_BAD2 + '",IF(AND(N({신청일})>0,{신청일}<{착공}),"' + CHA_BAD3 + '","' + CHA_OK + '"))))',
                                     align="left", size=8.5))], h=36)
    p.row([(3, "신청 기한", L),
           (9, F("기한", '=IF(N({착공})=0,"",' + _ymd(DUE) + '&"(' + '"&' + _yo(DUE) + '&")' + DUE_T + '")', align="left", size=8.5))], h=36)
    p.row([(3, "신청일", L), (3, I("신청일", ex=_ex(ex, "신청일"), fmt=DT, align="center", size=9)),
           (6, "신청서 끝 날짜로 들어갑니다", s7)], h=26)
    p.row([(3, "기한 확인", L),
           (9, F("확인", '=IF(OR(N({착공})=0,N({신청일})=0),"",IF({신청일}>' + DUE + ',"' + LATE + '",IF({신청일}=' + DUE
                 + ',"' + OK_DAY + '","' + OK_A + '"&(' + DUE + '-{신청일})&"' + OK_B + '")))', align="left", size=8.5))], h=36)
    g.sec(p, "㉰  업무상 재해 · 승인 판단", need=26 + 52 + 10)
    p.row([(3, "업무상 재해", L), (5, I("재해", ex=_ex(ex, "재해"), dv=",".join(JAEHAE), align="center", size=8.5)),
           (4, "신청일 현재까지 그 하도급공사에서(작성방법 6)", s7)], h=26)
    pan = ('=IF({업종}="","",IF({업종}="' + UPJONG[6] + '","' + PAN_UP + '",IF({재해}="' + JAEHAE[2] + '","' + PAN_JAE15 + '",'
           'IF(AND(N({착공})>0,N({신청일})>0,{신청일}>' + DUE + '),"' + PAN_LATE + '",IF({계약서}<>"맺음","' + PAN_GY + '",'
           'IF({재해}="","' + PAN_JAE_Q + '",IF({재해}="' + JAEHAE[1] + '","' + PAN_JAE14 + '","' + PAN_OK + '")))))))')
    p.row([(3, "승인 판단", L), (9, F("판단", pan, align="left", size=8.5))], h=52)
    g.sec(p, "㉱  하수급 금액 · 낼 서류 · 아직 안 적은 칸 · 다음 할 일", need=26 * 3 + 44 * 3 + 10)
    p.row([(3, "하도급 공사금액", dict(L, size=8.5)), (3, I("공사금액", ex=_ex(ex, "공사금액"), fmt=WON, align="right", size=9)),
           (3, "재료 시가환산액", dict(L, size=8.5)), (3, I("재료", ex=_ex(ex, "재료"), fmt=WON, align="right", size=9))], h=26)
    p.row([(3, "하수급(공사)금액", dict(L, size=8.5)),
           (3, F("합계", '=IF(AND(N({공사금액})=0,N({재료})=0),"",N({공사금액})+N({재료}))', fmt=WON, align="right", size=9)),
           (6, "재료 시가환산액 포함 — 신청서 하수급(공사)금액 칸으로", s7)], h=26)
    p.row([(3, "개인정보 동의(선택)", dict(L, size=8.5)), (3, I("동의", ex=_ex(ex, "동의"), dv="동의함,동의안함", align="center", size=8.5)),
           (6, "뒤쪽 동의서 √ (선택 — 안 해도 신청은 됩니다)", s7)], h=26)
    p.row([(3, "낼 서류", L), (9, DOC_T, {"kind": "text", "size": 8})], h=36)
    BIN = [("원수급인 상호", '{신청서!원상호}=""'), ("원수급인 대표자", '{신청서!원대표}=""'), ("원수급 현장명", '{신청서!원현장명}=""'),
           ("하수급인 상호", '{신청서!하상호}=""'), ("하수급인 대표자", '{신청서!하대표}=""'), ("하수급인 사업자등록번호", '{신청서!하사업자번호}=""'),
           ("하수급 현장명", '{신청서!하현장명}=""'), ("면허번호", '{신청서!면허번호}=""'), ("하도급 공사금액", "N({공사금액})=0"),
           ("실제 착공일", "N({착공})=0"), ("공사기간", "OR(N({시작})=0,N({끝})=0)"), ("업무상 재해", '{재해}=""'), ("신청일", "N({신청일})=0")]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({업종}="",{신청서!원상호}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))', align="left", size=8.5))], h=44)
    p.row([(3, "다음 할 일", L), (9, F("다음", '=IF(AND({업종}="",{신청서!원상호}=""),"","' + NEXT_T + '")', align="left", size=7.5))], h=52)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 보험 · 업종 · 서면계약 · 착공일 · 신청일 · 업무상 재해를 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 현장 · 사람 · 번호)."])
    return p


# ── 신청서 앞쪽 ─────────────────────────────────────────────────────────
PAX = [120, 227, 256, 311, 390, 405, 430, 506, 575, 735, 780, 800, 815, 865, 903, 990, 1117]
GA = Grid(PAX)


def _ck(cond, text):
    return f'IF({cond},"[√]","[   ]")&"{text}"'


def front(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "신청서", fit=1, widths=GA.w)
    X1, XA, XB, X2 = 120, 227, 311, 1117
    T, G_, M = S["thin"], S["gry"], S["med"]

    def inp(k, **kw):
        kw.setdefault("size", 8.5)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    lab = {"kind": "free", "size": 9, "align": "center", "wrap": True}
    # 좁은 이름 칸 — 들여쓰기 대신 앞 빈칸 둘 · 한 줄(넘치면 글자를 줄임) — G771 에서 배운 것(사이트 종이는 들여쓰기를 양쪽에 둠)
    cap = {"kind": "free", "size": 8.5, "align": "left", "wrap": "shrink"}
    cap8 = dict(cap, size=8)
    cap2 = {"kind": "free", "size": 7.5, "align": "left", "wrap": True}
    gray = dict(cap, fill=S["gray"])
    small = {"kind": "free", "size": 7.5, "align": "left"}
    prow(p, GA, [(X1, 735, HEAD1 + "\n" + HEAD2, dict(small, wrap=True)), (735, X2, TOTAL, dict(small, size=7.5, wrap=True))], h=24)
    p.gap(4)
    bo = "{셈!보험}"
    t1 = F("제목고용", '=' + _ck('AND(' + bo + '<>"",' + bo + '<>"' + BOHEOM[2] + '")', "고용보험"), align="center", size=11.5, bold=True)
    t2 = F("제목산재", '=' + _ck('AND(' + bo + '<>"",' + bo + '<>"' + BOHEOM[1] + '")', "산재보험"), align="center", size=11.5, bold=True)
    prow(p, GA, [(X1, 390, t1, NB), (390, X2, "하수급인 사업주 보험가입 승인신청서", {"kind": "free", "size": 15, "bold": True, "align": "left", "rs": 2})], h=22)
    prow(p, GA, [(X1, 390, t2, NB)], h=22)
    p.gap(6)
    prow(p, GA, [(X1, 990, "※ 뒤쪽의 유의사항 및 작성방법을 읽고 작성하기 바라며, 색상이 어두운 난은 신청인이 적지 않습니다.", {"kind": "free", "size": 7.5, "align": "left"}),
                 (990, X2, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=12)
    band = {"kind": "free", "size": 8, "align": "left", "fill": S["gray"], "valign": "top", "wrap": "shrink"}
    rb = prow(p, GA, [(X1, 405, "  접수번호", band), (405, 865, "  접수일", band), (865, X2, "  처리기간          5일", band)], h=23)
    hline(p, GA, rb, X1, X2, T, below=False)
    hline(p, GA, rb, X1, X2, T)
    vline(p, GA, rb, rb, 405, G_)
    vline(p, GA, rb, rb, 865, G_)
    p.gap(7)
    # 원수급인(신청인)
    a1 = prow(p, GA, [(X1, XA, "원수급인\n(신청인)", dict(lab, rs=6)), (XA, XB, "본사", dict(lab, rs=3)), (XB, 430, "  상호ㆍ법인명칭", cap8), (430, 735, inp("원상호"), NB),
                      (735, 815, "  대 표 자", cap8), (815, X2, inp("원대표"), NB)], h=19)
    a2 = prow(p, GA, [(XB, 390, "  소재지", cap8), (390, X2, inp("원소재지"), NB)], h=20)
    a3 = prow(p, GA, [(XB, 390, "  전화번호", cap8), (390, 735, inp("원전화", size=8, wrap="shrink"), NB), (735, 780, "  팩스", cap8), (780, 903, inp("원팩스", size=7.5, wrap="shrink"), NB),
                      (903, 990, "  전자우편주소", dict(cap8, size=7.5)), (990, X2, inp("원메일", size=7.5, wrap="shrink"), NB)], h=20)
    a4 = prow(p, GA, [(XA, XB, "원수급\n사업", dict(lab, rs=3)), (XB, 430, "  우편물 수령지", cap8), (430, 903, inp("원수령지", size=8), NB),
                      (903, 990, "  수취인", cap8), (990, X2, inp("원수취인", size=8, wrap="shrink"), NB)], h=20)
    a5 = prow(p, GA, [(XB, 430, "  관리번호\n  (사업개시번호)", cap2), (430, 735, inp("원관리번호", align="center"), NB),
                      (735, 815, "  현장명", cap8), (815, X2, inp("원현장명"), NB)], h=20)
    a6 = prow(p, GA, [(XB, 390, "  소재지", cap8), (390, 903, inp("원현장소재지"), NB), (903, 990, "  전화번호", cap8), (990, X2, inp("원현장전화", size=8, wrap="shrink"), NB)], h=21)
    hline(p, GA, a1, X1, X2, M, below=False)
    hline(p, GA, a1, XB, X2, G_)
    hline(p, GA, a2, XB, X2, G_)
    hline(p, GA, a3, XA, X2, G_)
    hline(p, GA, a4, XB, X2, G_)
    hline(p, GA, a5, 506, X2, G_)
    hline(p, GA, a6, X1, X2, M)
    for r, xs in ((a1, (735,)), (a3, (735, 903)), (a4, (903,)), (a6, (903,))):
        for x in xs:
            vline(p, GA, r, r, x, G_)
    vline(p, GA, a1, a6, XA, G_)
    vline(p, GA, a1, a6, XB, G_)
    p.gap(11)
    # 하수급인
    b1 = prow(p, GA, [(X1, XA, "하수급인", dict(lab, rs=16)), (XA, XB, "본사", dict(lab, rs=7)), (XB, 430, "  상호ㆍ법인명칭", cap8), (430, 735, inp("하상호"), NB),
                      (735, 815, "  대 표 자", cap8), (815, X2, inp("하대표"), NB)], h=15)
    b2 = prow(p, GA, [(XB, 430, "  사업자등록번호", cap8), (430, 735, inp("하사업자번호", align="center"), NB), (735, 865, "  법인등록번호", cap8),
                      (865, X2, inp("하법인번호", align="center"), NB)], h=21.5)
    b3 = prow(p, GA, [(XB, 390, "  소재지", cap8), (390, X2, inp("하소재지"), NB)], h=15.5)
    b4 = prow(p, GA, [(XB, 390, "  전화번호", dict(cap8, rs=2)), (390, 735, inp("하전화", size=8), dict(NB, rs=2)),
                      (735, 815, "  팩스", dict(cap8, valign="top")), (815, 903, "  전자우편주소", dict(cap8, size=7.5, rs=2)), (903, X2, inp("하메일", size=7.5, wrap="shrink"), dict(NB, rs=2))], h=8.5)
    b4b = prow(p, GA, [(735, 815, inp("하팩스", size=7.5, wrap="shrink"), NB)], h=9)
    b5 = prow(p, GA, [(XB, 430, "  우편물 수령지", cap8), (430, 815, inp("하수령지", size=8), NB), (815, 903, "  수취인", cap8), (903, X2, inp("하수취인", size=8, wrap="shrink"), NB)], h=15.5)
    b6 = prow(p, GA, [(XB, 430, "  고용보험 업종코드", gray), (430, X2, "", dict(gray))], h=18)
    b7 = prow(p, GA, [(XA, XB, "하수급\n사업", dict(lab, rs=9)), (XB, 430, "  사업장명(현장명)", cap8), (430, X2, inp("하현장명"), NB)], h=12.5)
    b8 = prow(p, GA, [(XB, 430, "  건설업면허관련", cap8), (430, 506, "", NB), (506, 575, "  면허종류", cap8), (575, 735, inp("면허종류", size=8, wrap="shrink"), NB),
                      (735, 800, "  면허번호", cap8), (800, 903, inp("면허번호", size=8, align="center", wrap="shrink"), NB), (903, 990, "  등록일자", cap8),
                      (990, X2, inp("등록일자", fmt=DT, size=8, align="center", wrap="shrink"), NB)], h=17)
    m1 = F("표금액", '=IF(N({셈!합계})=0,"원",TEXT({셈!합계},"#,##0")&" 원")', align="right", size=8.5)
    s0, e0, c0 = "{셈!시작}", "{셈!끝}", "{셈!착공}"
    gi = F("표기간", '=IF(AND(N(' + s0 + ')=0,N(' + e0 + ')=0),"",IF(N(' + s0 + ')>0,' + _ymd(s0) + ',"")&" ~ "&IF(N(' + e0 + ')>0,' + _ymd(e0) + ',""))',
           align="left", size=8, wrap="shrink")
    sc = F("표실착공", '="(실제착공일: "&IF(N(' + c0 + ')=0,"             ",' + _ymd(c0) + ')&" )"', align="right", size=8, wrap="shrink")
    b9 = prow(p, GA, [(XB, 506, "  하수급(공사)금액\n  (재료 시가환산액 포함)", dict(cap2, rs=2)), (506, 735, m1, dict(NB, rs=2)),
                      (735, 815, "  공사기간", cap8), (815, X2, gi, NB)], h=17.5)
    b9b = prow(p, GA, [(735, 815, "", NB), (815, X2, sc, NB)], h=17.5)
    b10 = prow(p, GA, [(XB, 390, "  소재지", cap8), (390, 903, inp("하현장소재지"), NB), (903, 990, "  전화번호", cap8), (990, X2, inp("하현장전화", size=8, wrap="shrink"), NB)], h=18)
    b11 = prow(p, GA, [(XB, 430, "  상시근로자 수", cap8), (430, 735, inp("상시", fmt=MYEONG, align="right"), NB), (735, 865, "  총피보험자 수", cap8),
                       (865, X2, inp("총피", fmt=MYEONG, align="right"), NB)], h=18)
    jh = "{셈!재해}"
    # 원문 이 줄만 전각 괄호 «［ ］» — 그대로(원문대조)
    j1 = F("표재해1", '=IF(' + jh + '="' + JAEHAE[0] + '","［√］","［ ］")&" 없음"', align="left", size=8.5, wrap="shrink")
    j2 = F("표재해2", '=IF(OR(' + jh + '="' + JAEHAE[1] + '",' + jh + '="' + JAEHAE[2] + '"),"［√］","［ ］")&" 있음 (  "&IF(' + jh + '="' + JAEHAE[1]
           + '","［√］","［ ］")&" 착공 후 14일 이내,   "&IF(' + jh + '="' + JAEHAE[2] + '","［√］","［ ］")&" 착공 후 15일∼신청일)"', align="left", size=8, wrap="shrink")
    b12 = prow(p, GA, [(XB, 506, "  업무상 재해\n  발생 여부", dict(cap2, size=8, rs=2)), (506, X2, j1, NB)], h=17.5)
    b12b = prow(p, GA, [(506, X2, j2, NB)], h=17.5)
    b13 = prow(p, GA, [(XB, 506, "  사업장관리번호\n  (사업개시번호)", dict(cap2, fill=S["gray"])), (506, X2, "", dict(gray))], h=24)
    hline(p, GA, b1, X1, X2, M, below=False)
    for r in (b1, b2, b3):
        hline(p, GA, r, XB, X2, G_)
    hline(p, GA, b4b, XB, X2, G_)
    hline(p, GA, b5, XB, X2, G_)
    hline(p, GA, b6, XA, X2, G_)
    for r in (b7, b8):
        hline(p, GA, r, XB, X2, G_)
    hline(p, GA, b9b, XB, X2, G_)
    hline(p, GA, b10, XB, X2, G_)
    hline(p, GA, b11, XB, X2, G_)
    hline(p, GA, b12b, XB, X2, G_)
    hline(p, GA, b13, X1, X2, M)
    for r, xs in ((b1, (735,)), (b2, (735,)), (b8, (735,)), (b10, (903,)), (b11, (735,))):
        for x in xs:
            vline(p, GA, r, r, x, G_)
    vline(p, GA, b4, b4b, 735, G_)
    vline(p, GA, b4, b4b, 815, G_)
    vline(p, GA, b5, b5, 815, G_)
    vline(p, GA, b9, b9b, 735, G_)
    vline(p, GA, b12, b12b, 506, G_)
    vline(p, GA, b1, b13, XA, G_)
    vline(p, GA, b1, b13, XB, G_)
    p.gap(7)
    prow(p, GA, [(X1, X2, "「고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행령」 제7조제3항 및 같은 법\n시행규칙 제6조제1항에 따라 위와 같이 신청합니다.",
                  {"kind": "free", "size": 9.5, "wrap": True})], h=34)
    p.gap(3)
    sd = "{셈!신청일}"
    prow(p, GA, [(X1, X2, F("표신청일", '=IF(N(' + sd + ')=0,"년         월         일",YEAR(' + sd + ')&"년      "&MONTH(' + sd + ')&"월      "&DAY(' + sd + ')&"일")',
                             align="right", size=9), NB)], h=18.5)
    nm = F("표신청인", '=IF({원대표}="","",{원대표})', align="center", size=8.5)
    prow(p, GA, [(X1, 575, "", NB), (575, 815, "신청인(원수급인)", dict(FRC, size=9.5)), (815, 903, nm, NB), (903, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=19)
    dh = F("표대행", '=IF({대행기관}<>"","[√]","[   ]")&" 보험사무대행기관"', align="center", size=9.5)
    prow(p, GA, [(X1, 575, "", NB), (575, 815, dh, NB), (815, 903, inp("대행기관", size=8, align="center", wrap="shrink"), NB),
                 (903, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=19)
    p.gap(4)
    prow(p, GA, [(X1, 575, "  근로복지공단 ○○지역본부(지사)장", {"kind": "free", "size": 13, "bold": True, "align": "left", "wrap": "shrink"}),
                 (575, 735, "귀하", {"kind": "free", "size": 9, "align": "left"}), (735, X2, "", NB)], h=21)
    p.gap(5)
    prow(p, GA, [(X1, X2, "", {"kind": "free", "fill": S["gray"]})], h=2.5)
    p.gap(7)
    tx = {"kind": "free", "size": 8, "align": "left", "wrap": True}
    r = prow(p, GA, [(X1, 256, "신청인\n제출서류", {"kind": "free", "size": 8.5, "align": "center", "wrap": True}),
                     (256, 990, "  1. 도급계약서 사본 1부\n  2. 보험료 납부 인수에 관한 계약서(전자문서로 된 계약서를 포함합니다) 사본 1부", tx),
                     (990, X2, "수수료\n\n없음", {"kind": "free", "size": 8.5, "align": "center", "wrap": True})], h=41)
    hline(p, GA, r, X1, X2, T, below=False)
    hline(p, GA, r, X1, X2, T)
    vline(p, GA, r, r, 256, G_)
    vline(p, GA, r, r, 990, G_)
    p.gap(13)
    prow(p, GA, [(X1, X2, "※ 처리 사항(아래의 난은 신청인이 적지 않습니다)", {"kind": "free", "size": 8.5, "align": "left"})], h=14)
    gc = {"kind": "free", "size": 9, "align": "center", "fill": S["gray"], "wrap": "shrink"}
    d1 = prow(p, GA, [(X1, XB, "결정사항", gc), (XB, 506, "[   ]승인   [   ]불승인", gc), (506, 903, "하수급인 보험관계 성립일(사업 개시일)", gc),
                      (903, X2, "년      월      일", gc)], h=21)
    d2 = prow(p, GA, [(X1, XB, "불승인 사유", gc), (XB, X2, "", gc)], h=21)
    hline(p, GA, d1, X1, X2, T, below=False)
    hline(p, GA, d1, X1, X2, G_)
    hline(p, GA, d2, X1, X2, T)
    for x in (XB, 506, 903):
        vline(p, GA, d1, d1, x, G_)
    vline(p, GA, d2, d2, XB, G_)
    p.gap(2)
    prow(p, GA, [(X1, X2, "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["제목 √ · 하수급 금액 · 공사기간 · 실제착공일 · 업무상 재해 · 신청일은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 현장 · 사람 · 번호)."])
    return p


# ── 뒤쪽(원문 그대로) ────────────────────────────────────────────────────
DONG = "본인은 산업재해보상보험 제도 안내 및 관련 제도개선에 필요한 의견조사 등을 위해 우편 또는 휴대전화 등으로 관련 정보 등을 수신하는 것에 동의합니다."
DONG_L = ["① 개인정보의 수집 및 이용 목적: 관련 제도 홍보자료 제공 및 제도개선에 필요한 의견조사 등",
          "② 수집하는 개인정보의 항목: 신청인 성명, 주소 및 휴대전화번호 등 연락처",
          "③ 개인정보의 수집 및 이용기간: 해당 보험관계의 해지 후 1년",
          "④ 동의 거부 권리 등 안내: 신청인은 개인정보 수집 및 이용에 관하여 동의하지 않을 수 있으며, 이 경우 공단이 제공하는 산재보험 제도 안내 및 관련 정보 "
          "등은 제공받을 수 없습니다."]
YU = ["1. 산재보험 적용사업(장)은 「임금채권보장법」 및 「석면피해구제법」을 당연히 적용받게 됩니다.",
      "2. 하수급인이 「고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률 시행령」 제7조에 따른 건설업자, 주택건설업자, 전기공사업자, 정보통신공사업자, "
      "소방시설업자 및 문화재수리업자에 해당하는 경우에만 승인대상에 해당합니다."]
JAK = ["1. 고용보험, 산재보험 중 신청하려는 난에 \"√\" 표시를 하기 바랍니다.",
       "2. \"원수급인(신청인)\"의 \"본사\"란은 원수급인의 본사사업장 명세와 대표자 성명에 대한 명세를 적습니다.",
       "3. \"원수급인(신청인)\"의 \"원수급사업\"란은 원수급인의 사업장(공사현장) 명칭과 소재지를 적습니다.",
       "4. \"하수급인\"의 \"본사\"란은 하수급인의 본사사업장 명세와 대표자 성명을 적습니다.",
       "5. \"하수급인\"의 \"하수급사업\"란은 하수급인 사업주 승인 신청의 대상이 되는 하수급사업(공사현장)에 대한 명세를 적습니다.",
       "6. \"업무상 재해발생 여부\"란은 신청일 현재까지 하수급인 사업주 인정승인 신청의 대상이 되는 하수급사업(공사현장)에서 업무상 재해가 있었는지 여부를 적습니다."]
STEP = ["신청서 제출", "접수 및 확인", "신청서 처리", "처리결과 통지", "수령"]
BAX = [120, 152, 292, 350, 495, 552, 697, 749, 895, 946, 1092, 1120]
GB = Grid(BAX)


def back(bk, ex):
    from fb import text_lines
    S = _sides()
    p = g.pg(bk, ex, "뒤쪽", fit=1, widths=GB.w)
    X1, X2 = 120, 1120
    T, G_, M = S["thin"], S["gry"], S["med"]
    prow(p, GB, [(X1, X2, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=12)
    prow(p, GB, [(X1, X2, "", {"kind": "free", "fill": S["gray"]})], h=2)
    p.gap(165)          # 원문 그대로 — 동의서는 쪽 가운데부터(위는 빈 자리)
    bandf = {"kind": "free", "size": 10, "align": "center", "fill": S["gray"]}
    r = prow(p, GB, [(X1, X2, "개인정보 수집 및 이용 동의서(선택)", bandf)], h=23)
    hline(p, GB, r, X1, X2, M, below=False)
    hline(p, GB, r, X1, X2, T)
    W = sum(GB.w)
    ht = {"kind": "free", "size": 8.5, "align": "left", "wrap": True, "valign": "top"}
    p.gap(8)
    prow(p, GB, [(X1, X2, DONG, ht)], h=text_lines(DONG, W * 10.0 / 8.5) * 8.5 * 1.6 + 4)
    for t in DONG_L:
        prow(p, GB, [(X1, X2, ("  " + t), dict(ht, size=8))], h=text_lines("  " + t, W * 10.0 / 8) * 8 * 1.6 + 3)
    p.gap(6)
    dg = "{셈!동의}"
    prow(p, GB, [(X1, X2, F("표동의", '="위와 같이 개인정보를 수집ㆍ이용하는데 동의하십니까?   "&' + _ck(dg + '="동의함"', " 동의함") + '&"      "&'
                             + _ck(dg + '="동의안함"', " 동의안함"), align="left", size=8.5), NB)], h=18)
    p.gap(6)
    r = prow(p, GB, [(X1, 697, "", NB), (697, 895, "신청인", {"kind": "free", "size": 9.5, "align": "center"}), (895, 946, "", NB),
                     (946, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=18)
    hline(p, GB, r, X1, X2, T)
    for nm, items, sz, lh in (("유의사항", YU, 8.3, 1.6), ("작성방법", JAK, 8.3, 1.55)):
        p.gap(4)
        r = prow(p, GB, [(X1, X2, nm, bandf)], h=23)
        hline(p, GB, r, X1, X2, M, below=False)
        hline(p, GB, r, X1, X2, T)
        p.gap(3)
        for t in items:
            n = text_lines(t, (W - 2) * 10.0 / sz)
            prow(p, GB, [(X1, X2, "  " + t, {"kind": "free", "size": sz, "align": "left", "wrap": True, "valign": "top"})], h=n * sz * lh + 3)
        p.gap(4)
    r = prow(p, GB, [(X1, X2, "처리절차", bandf)], h=23)
    hline(p, GB, r, X1, X2, M, below=False)
    hline(p, GB, r, X1, X2, T)
    p.gap(7)
    box = {"kind": "free", "size": 8.5, "align": "center", "wrap": True}
    arw = {"kind": "free", "size": 9, "align": "center"}
    cells = [(X1, 152, "", NB), (152, 292, STEP[0], box), (292, 350, "➔", arw), (350, 495, STEP[1], box), (495, 552, "➔", arw), (552, 697, STEP[2], box),
             (697, 749, "➔", arw), (749, 895, STEP[3], box), (895, 946, "➔", arw), (946, 1092, STEP[4], box), (1092, X2, "", NB)]
    r1 = prow(p, GB, cells, h=25)
    for x1, x2 in ((152, 292), (350, 495), (552, 697), (749, 895), (946, 1092)):
        hline(p, GB, r1, x1, x2, G_, below=False)
        hline(p, GB, r1, x1, x2, G_)
        vline(p, GB, r1, r1, x1, G_)
        vline(p, GB, r1, r1, x2, G_)
    sm = {"kind": "free", "size": 8, "align": "center"}
    prow(p, GB, [(X1, 152, "", NB), (152, 292, "신청인", sm), (292, 552, "", NB), (552, 697, "근로복지공단", sm), (697, X2, "", NB)], h=14)
    p.gap(14)
    rr = prow(p, GB, [(X1, X2, "", NB)], h=2)
    hline(p, GB, rr, X1, X2, T)
    p.end_print()
    p.after_note(["뒤쪽은 원문 그대로입니다(보험료징수법 시행규칙 별지 제8호서식)."])
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
    sm, fr = pages["셈"], pages["신청서"]
    a, b = {}, {}
    bo, up, gy, jh = sm.get("보험"), sm.get("업종"), sm.get("계약서"), sm.get("재해")
    gd, sc, st, en, sd = sm.get("계약일"), sm.get("착공"), sm.get("시작"), sm.get("끝"), sm.get("신청일")
    gm, jr = sm.get("공사금액"), sm.get("재료")
    a["업종확인"] = "" if not up else (UP_NO if up == UPJONG[6] else UP_OK)
    a["계약확인"] = "" if not gy else (GY_NO if gy == "아직" else GY_OK)
    if not gd or not sc:
        a["차례"] = ""
    elif sc < gd:
        a["차례"] = CHA_BAD1
    elif st and en and en < st:
        a["차례"] = CHA_BAD2
    elif sd and sd < sc:
        a["차례"] = CHA_BAD3
    else:
        a["차례"] = CHA_OK
    due = _wkp(sc + T(days=29)) if sc else None
    a["기한"] = "" if not sc else f"{_ymdp(due)}({YOIL[due.weekday()]}){DUE_T}"
    if not sc or not sd:
        a["확인"] = ""
    elif sd > due:
        a["확인"] = LATE
    elif sd == due:
        a["확인"] = OK_DAY
    else:
        a["확인"] = f"{OK_A}{(due - sd).days}{OK_B}"
    if not up:
        a["판단"] = ""
    elif up == UPJONG[6]:
        a["판단"] = PAN_UP
    elif jh == JAEHAE[2]:
        a["판단"] = PAN_JAE15
    elif sc and sd and sd > due:
        a["판단"] = PAN_LATE
    elif gy != "맺음":
        a["판단"] = PAN_GY
    elif not jh:
        a["판단"] = PAN_JAE_Q
    elif jh == JAEHAE[1]:
        a["판단"] = PAN_JAE14
    else:
        a["판단"] = PAN_OK
    a["합계"] = "" if not gm and not jr else (gm or 0) + (jr or 0)
    keys = [("원수급인 상호", not fr.get("원상호")), ("원수급인 대표자", not fr.get("원대표")), ("원수급 현장명", not fr.get("원현장명")),
            ("하수급인 상호", not fr.get("하상호")), ("하수급인 대표자", not fr.get("하대표")), ("하수급인 사업자등록번호", not fr.get("하사업자번호")),
            ("하수급 현장명", not fr.get("하현장명")), ("면허번호", not fr.get("면허번호")), ("하도급 공사금액", not gm),
            ("실제 착공일", not sc), ("공사기간", not st or not en), ("업무상 재해", not jh), ("신청일", not sd)]
    if not up and not fr.get("원상호"):
        a["빈칸"] = a["다음"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
        a["다음"] = NEXT_T
    b["제목고용"] = _ckp(bool(bo) and bo != BOHEOM[2], "고용보험")
    b["제목산재"] = _ckp(bool(bo) and bo != BOHEOM[1], "산재보험")
    tot = (gm or 0) + (jr or 0)
    b["표금액"] = f"{tot:,} 원" if (gm or jr) else "원"
    b["표기간"] = "" if not st and not en else (_ymdp(st) if st else "") + " ~ " + (_ymdp(en) if en else "")
    b["표실착공"] = "(실제착공일: " + (_ymdp(sc) if sc else "             ") + " )"
    fk = lambda c, t: ("［√］" if c else "［ ］") + t
    b["표재해1"] = fk(jh == JAEHAE[0], " 없음")
    b["표재해2"] = (fk(jh in (JAEHAE[1], JAEHAE[2]), " 있음 (  ") + fk(jh == JAEHAE[1], " 착공 후 14일 이내,   ")
                  + fk(jh == JAEHAE[2], " 착공 후 15일∼신청일)"))
    b["표신청일"] = "년         월         일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    b["표신청인"] = fr.get("원대표") or ""
    b["표대행"] = _ckp(bool(fr.get("대행기관")), " 보험사무대행기관")
    dg = sm.get("동의")
    c = {"셈": a, "신청서": b, "뒤쪽": {"표동의": "위와 같이 개인정보를 수집ㆍ이용하는데 동의하십니까?   " + _ckp(dg == "동의함", " 동의함") + "      " + _ckp(dg == "동의안함", " 동의안함")}}
    return c
