# -*- coding: utf-8 -*-
"""건축물 해체 변경허가 신청서 · 변경신고서 — 새로 만든 서식 (2026-11-18 G764 · 소장님 「…만들지 못한 서식도 10개 만들어 줘」 — 둘째)
   → ① 변경허가냐 변경신고냐(시행규칙 제12조의3제1항 1 ~ 4호 — 당초 허가 · 신고 × 변경 뒤 대상) · 바꾸는 사항이 영 제21조의2제1항 여섯 가지인지
     (아니면 착공 변경신고 · 일괄 변경신고) · 해체계획서 첨부 · 석면 · 가스 → 신청서 √ · 처리 기한(7일 — 심의를 거치면 그 날부터 · 민원처리법 제19조②) ·
     아직 안 적은 칸 · 다음 할 일(변경허가서 · 변경신고 확인증)
   · 신청서 앞쪽(건축물관리법 시행규칙 [별지 제6호의5서식] <개정 2024. 1. 3.> 칸 차례 그대로) · 뒤쪽(유의사항 · 처리절차 원문 그대로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G764/구조.md — 앞 바깥 120 ~ 1122 · 이름 칸 245 · 성명 | 생년월일 673 · 송달 360 · 602 · 505 ·
     허가번호 | 허가일 · 변경 전 | 후 662 · 연면적 | 건축물 수 462 · 석면 · 가스 356 · 959 · 접수 띠 407 · 602 · 750 · 첨부 253 · 861 /
     뒤 이름 칸 245 · 처리절차 상자 254-358 · 397-507 · 546-661 · 706-834 · 872-965 · 1003-1102).

근거(국가법령정보센터 · 2026-11-18 · 원문 /home/claude/g10/notes/G764/원문_대조용.txt(읽는 차례 해시 앞 90dca0d12917eabc · 뒤 f12743408d9b19cc) · 조문 G764/근거.md — 세 번):
  · 건축물관리법 [시행 2025. 6. 4.] 제30조의3 ① 허가 · 신고한 사항 중 대통령령으로 정하는 사항을 바꾸려면 변경허가 · 변경신고(해체계획서 변경은 제30조③ ~ ⑦ · ⑨ 준용)
      ② 착공신고 사항 변경신고 ③ 그 밖은 완료신고 때 일괄 변경신고
  · 시행령 [시행 2026. 9. 22.] 제21조의2 ① 1. 해체공법 2. 해체작업의 순서 3. 해체하는 부분 및 면적 4. 해체장비의 종류 5. 석면 함유 여부 6. 현장 안전관리대책
      ② 석면 통보 ③ 가스시설 통보 ④ 국토안전관리원 검토 의뢰 ⑤ 착공 변경신고 사항(착공 예정일 30일 이상 · 해체작업자 등)
  · 시행규칙 [시행 2025. 6. 2.] 제12조의3 ① 1. 당초 허가 → 변경허가 2. 당초 신고 → 변경신고 3. 허가였으나 신고 대상이 되면 변경신고 4. 신고였으나 허가 대상이 되면 변경허가
      ② 별지 제6호의5서식 + 변경사항이 반영된 해체계획서 ③ 별지 제6호의6서식 ④ 별지 제6호의7서식 ⑤ 1. 변경허가서 · 변경신고 확인증 별지 제6호의8서식
  · 「민원 처리에 관한 법률」 제19조② — 처리기간 7일: 받은 날(심의를 거치면 그 날)을 1일로 토 · 일 · 공휴일 빼고 7번째 근무일(민원기한.py)
■ 원문 그대로: 앞쪽 머리 · 제목 둘([ ] 변경허가 신청서 · [ ] 변경신고서) · 처리기간 글 · 문구 · 첨부서류 · 근거규정 / 뒤쪽 유의사항 1 ~ 9 · 처리절차 두 줄.
■ 짐작 안 함: 변경 뒤 허가 대상인지 신고 대상인지는 이용자가 고름(법 제30조제1항 · 조례 판정은 «건축물 해체 허가신청서 · 해체 신고서» 서식 ① 장)."""
import datetime

import sgw as g
from fb import F, I
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUB, SUBC, FR, FRR, FRC, NB, _ymd, _yo
from sgw import L
import 민원기한 as MW

SLUG = "haeche-byeongyeong"
TITLE = "건축물 해체 변경허가 신청서 · 변경신고서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
# 쪽: 빈 1 셈 · 2 앞쪽 · 3 뒤쪽 / 예시 4 ~ 6
PREV = [(2, "건축물 해체 변경허가 신청서 · 변경신고서(건축물관리법 시행규칙 별지 제6호의5서식 앞쪽) — 빈 서식 (원문 칸 차례 그대로)"),
        (5, "건축물 해체 변경허가 신청서 — 작성 예시 (변경허가 · 변경신고 √ · 송달 · 해체계획서 · 석면 · 가스가 ① 장에서 저절로)"),
        (4, "① 변경허가냐 변경신고냐 · 바꾸는 사항 · 해체계획서 · 처리 기한 — 작성 예시 (가상의 근린생활시설 해체)"),
        (3, "뒤쪽 — 유의사항 · 처리절차 (원문 그대로)")]
MULTI = True
SHORT = ("건축물 해체 변경허가 신청서 · 변경신고서(건축물관리법 시행규칙 별지 제6호의5서식) — 해체허가 · 신고한 뒤 해체공법 · 순서 · 부분 · 장비 · 석면 · "
         "안전관리대책을 바꿀 때 냅니다. 당초 허가 · 신고와 변경 뒤 대상을 고르면 변경허가인지 변경신고인지(시행규칙 제12조의3) · 신청서 √ 가, "
         "신청일을 적으면 처리 기한(7일)이 저절로 나옵니다. 뒤쪽 유의사항 · 처리절차 원문 그대로.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
DANGCHO = ["해체허가를 받음", "해체신고를 함"]
DWI = ["그대로(같은 대상)", "신고 대상이 됨", "허가 대상이 됨"]
YA = "예,아니오"
SONG = ["동의함", "동의하지 않음"]
GAS = ["철거 및 안전조치 완료", "철거 및 안전조치 예정", "해당 없음"]
SIM = ["거치지 않음", "거침"]
PLAN = ["해당", "미해당"]
# 영 제21조의2제1항 — (열쇠, 글)
SAHANG = [("공법", "해체공법"), ("순서", "해체작업의 순서"), ("부분", "해체하는 부분 및 면적"), ("장비", "해체장비의 종류"),
          ("석면", "해체 대상 건축물의 석면 함유 여부"), ("안전", "해체공사 현장의 안전관리대책")]
# 석면 함유재 — 원문 자리: 1줄 천장재 | 바닥재 · 2줄 지붕재 | 파이프보온재 · 3줄 천장단열재 | 그 밖의 사항
ASB = [("천장재", "천장재(아스칼텍스, 아미텍스 등)"), ("바닥재", "바닥재(아스타일 등)"), ("지붕재", "지붕재(슬레이트 등)"),
       ("보온재", "파이프보온재(석면포)"), ("단열재", "천장단열재(석면포)"), ("그밖", "그 밖의 사항")]

# 판정 글(셈 · 파이썬 같은 글)
NAE_H1 = "변경허가 신청서 — 당초 해체허가를 받았음(시행규칙 제12조의3제1항제1호)"
NAE_S2 = "변경신고서 — 당초 해체신고를 했음(시행규칙 제12조의3제1항제2호)"
NAE_S3 = "변경신고서 — 당초 허가였지만 바꾼 뒤 신고 대상이 됨(시행규칙 제12조의3제1항제3호)"
NAE_H4 = "변경허가 신청서 — 당초 신고였지만 바꾼 뒤 허가 대상이 됨(시행규칙 제12조의3제1항제4호)"
SA_NONE = ("⚠ 영 제21조의2제1항 여섯 가지가 아니면 이 서식이 아닐 수 있습니다 — 착공 예정일(30일 이상) · 해체작업자 · 하수급인 · 현장관리인 · "
           "건설기술자는 착공 변경신고(별지 제6호의6서식), 그 밖의 것은 완료신고 때 일괄 변경신고(별지 제6호의7서식)(법 제30조의3제2항 · 제3항)")
SA_A = "바꾸는 사항(영 제21조의2제1항): "
PLAN_Y = "해당 — 변경사항이 반영된 해체계획서를 붙임(시행규칙 제12조의3제2항 · 서식 첨부서류)"
PLAN_N = "미해당 — 해체계획서 첨부 없음(서식: 해체계획서가 변경된 경우에만 첨부)"
AS_TELL = " · 석면 함유 여부를 바꾸면 허가권자가 확인해 관계 기관에 알림(영 제21조의2제2항)"
CH_A = "까지 — 받은 날을 1일로 토 · 일 · 공휴일 빼고 7일(처리기간 · 민원처리법 제19조②)"
CH_SIM = "까지 — 건축위원회 심의를 거친 날을 1일로 토 · 일 · 공휴일 빼고 7일(서식 처리기간 · 민원처리법 제19조②)"
SIM_NEED = "⚠ 심의를 거치면 심의를 거친 날을 적습니다"
NEXT_H = "변경허가서(별지 제6호의8서식)를 받으면 바뀐 해체계획서대로 해체 · 끝나면 완료신고(별지 제10호서식)"
NEXT_S = "변경신고 확인증(별지 제6호의8서식)을 받으면 바뀐 해체계획서대로 해체 · 끝나면 완료신고(별지 제10호서식)"
BIN_OK = "✓ 신청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# 앞쪽 · 뒤쪽 원문 글
HEAD = "■ 건축물관리법 시행규칙 [별지 제6호의5서식] <개정 2024. 1. 3.>"
CHEOM = "「건축물관리법」 제30조제4항에 따라 작성하거나 같은 조 제5항에 따라 검토받은\n해체계획서(해체계획서가 변경된 경우에만 첨부합니다)"
GEUN_L = "「건축물관리법」\n제30조의3제1항"
GEUN = ("관리자는 제30조제1항 또는 제2항에 따라 허가를 받았거나 신고한 사항 중 해체계획서와 다른 해체공법을 적용하는 등 대통령령으로 정하는 사항을 "
        "변경하려면 국토교통부령으로 정하는 바에 따라 허가권자의 변경허가를 받거나 허가권자에게 변경신고를 하여야 한다. 이 경우 해체계획서의 변경 등에 관한 "
        "사항은 제30조제3항부터 제7항까지 및 제9항을 준용한다.")
YU_L = "「건축물관리법」\n제51조제1항제14\n호ㆍ제15호, 제\n51조의2제3호,\n제52조제10호,\n제54조제2항제8\n호ㆍ9호 및 제54\n조제3항제3호"
YU = ["1. 변경허가를 받지 않거나 거짓 또는 그 밖의 부정한 방법으로 변경허가를 받고 건축물을 해체하다가 공중의 위험을 발생하게 한 경우에는 10년 이하의 징역 "
      "또는 1억원 이하의 벌금에 처합니다.",
      "2. 변경신고를 하지 않거나 거짓 또는 그 밖의 부정한 방법으로 변경신고를 하고 건축물을 해체하다가 공중의 위험을 발생하게 한 경우에는 10년 이하의 징역 "
      "또는 1억원 이하의 벌금에 처합니다.",
      "3. 변경허가를 받지 않거나 거짓 또는 그 밖의 부정한 방법으로 변경허가를 받고 해체작업을 실시한 경우에는 2년 이하의 징역 또는 2천만원 이하의 벌금에 처합니다.",
      "4. 변경신고를 하지 않거나 거짓 또는 그 밖의 부정한 방법으로 변경신고를 하고 해체작업을 실시한 경우에는 1년 이하의 징역 또는 1천만원 이하의 벌금에 처합니다.",
      "5. 변경신고를 하지 않거나 거짓 또는 그 밖의 부정한 방법으로 변경신고를 한 경우에는 500만원 이하의 과태료를 부과합니다.",
      "6. 전문가(건축사 또는 기술사)가 작성(검토)하지 않은 해체계획서를 허가권자에게 제출한 경우에는 1천만원 이하의 과태료를 부과합니다.",
      "7. 석면이 함유된 건축물을 해체하는 경우에는 「산업안전보건법」 등 관계 법령에 적합하게 석면을 먼저 제거ㆍ처리한 후 건축물을 해체해야 합니다.",
      "8. 건축물 해체 과정에서 굴착공사를 하려는 자는 굴착공사를 하기 전에 「고압가스 안전관리법」 제23조의3제1항, 「도시가스사업법」 제30조의3제1항 및 "
      "「액화석유가스의 안전관리 및 사업법」 제49조의3제1항에 따라 해당 건축물 부지의 지하에 가스배관이 묻혀 있는지를 「도시가스사업법」 제30조의2에 따른 "
      "굴착공사정보지원센터에 확인을 요청해야 합니다.",
      "9. 도시가스배관 또는 도시가스사용시설이 설치된 건축물을 해체하려는 자는 「도시가스사업법」 제28조의3제2항에 따라 안전조치를 해야 합니다."]
CJ_H = "변경허가의 경우\n(당초 해체 허가를\n받은 경우 및 당초\n해체신고를 하였으\n나 변경으로 인하\n여 해체공사가 허\n가대상으로 되는\n경우)"
CJ_S = "변경신고의 경우\n(당초 해체 신고를\n한 경우 및 당초 해\n체허가를 받았으나\n변경으로 인하여\n해체공사가 신고대\n상으로 되는 경우)"
STEP_H = ["변경허가\n신청서 작성", "접 수", "검 토", "건축 심의 또는\n전문가 검토 등", "변경허가서\n작성", "변경허가서\n발급"]
STEP_S = ["변경신고서\n작성", "접 수", "검 토", "(필요시)\n건축 심의 또는\n전문가 검토 등", "변경신고\n확인증\n작성", "변경신고\n확인증\n발급"]
BUSEO = "특별자치시ㆍ특별자치도, 시ㆍ군ㆍ자치구 건축물 해체허가(신고) 부서"
ANJEON = "※「건축물관리법」 제30조제8항에 해당하는 경우에는 해체계획서에 대한 국토안전관리원의 검토 실시"

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"당초": "해체허가를 받음", "변경뒤": "그대로(같은 대상)", "공법": "예", "순서": "예", "부분": "아니오", "장비": "예", "석면": "아니오", "안전": "아니오",
      "계획서": "해당", "송달": "동의함",
      "석면천장재": "없음", "석면바닥재": "없음", "석면지붕재": "있음", "석면보온재": "없음", "석면단열재": "없음", "석면그밖": "없음",
      "가스": "철거 및 안전조치 완료", "가스예정": None, "가스사업자": "가나도시가스(주)", "가스연락처": "0000-0000",
      "연면적": 1250.0, "주동": 1, "부속동": 1, "신청일": D(2027, 1, 11), "심의": "거치지 않음", "심의일": None}
EX_S = {"성명": "예시개발(주) 대표이사 홍길동", "생년월일": "000000-0000000", "주소": "가나시 다라구 마바로 45", "전화": "000-0000-0000",
        "전자우편": "info@example.com", "허가번호": "가나시 다라구 해체허가 제2026-000호", "허가일": "2026. 11. 23.",
        "사유": "인접 도로 보행자 안전을 위해 위층 해체를 소형 장비 · 수작업으로 바꿈(해체계획서 다시 검토받음)",
        "변경전": "0.7㎥급 굴착기 + 압쇄기로 위층부터 차례로 해체", "변경후": "4층 이상은 0.2㎥급 소형 장비 · 수작업, 3층 아래는 압쇄기",
        "위치": "가나시 다라구 마바동 123-4", "수신": "가나시 다라구청장"}


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  해체 변경허가 · 변경신고 — 무엇을 낼까 · 바꾸는 사항 · 처리 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 해체허가를 받았거나 해체신고를 한 뒤 해체공법 등 대통령령으로 정하는 사항을 바꾸려면 변경허가를 받거나 변경신고를 합니다(건축물관리법 제30조의3제1항). "
              "여기 고른 값이 신청서 제목 · 송달 · 해체계획서 변경여부 · 석면 · 가스 √ 와 연면적 · 동 수 · 신청일로 들어갑니다.")
    g.sec(p, "㉮  변경허가냐 변경신고냐 (시행규칙 제12조의3제1항)", need=26 * 2 + 36 + 10)
    p.row([(3, "당초", L), (3, I("당초", ex=_ex(ex, "당초"), dv=",".join(DANGCHO), align="center", size=9)),
           (3, "바꾼 뒤 해체공사", L), (3, I("변경뒤", ex=_ex(ex, "변경뒤"), dv=",".join(DWI), align="center", size=8.5))], h=26)
    p.row([(3, "낼 서식", L),
           (9, F("낼", '=IF({당초}="","",IF({당초}="' + DANGCHO[0] + '",IF({변경뒤}="' + DWI[1] + '","' + NAE_S3 + '","' + NAE_H1 + '"),'
                 'IF({변경뒤}="' + DWI[2] + '","' + NAE_H4 + '","' + NAE_S2 + '")))', align="left", size=8.5))], h=36)
    p.row([(3, "", L), (9, "허가 대상 · 신고 대상(법 제30조제1항 · 조례)은 «건축물 해체 허가신청서 · 해체 신고서» 서식 ① 장에서 볼 수 있습니다.", s7)], h=26)
    g.sec(p, "㉯  바꾸는 사항 (영 제21조의2제1항) · 해체계획서", need=26 * 3 + 56 + 44 + 10)
    for a, b in ((0, 1), (2, 3), (4, 5)):
        (ka, ta), (kb, tb) = SAHANG[a], SAHANG[b]
        p.row([(3, ta, dict(L, size=8.5)), (3, I(ka, ex=_ex(ex, ka), dv=YA, align="center", size=9)),
               (3, tb, dict(L, size=8.5)), (3, I(kb, ex=_ex(ex, kb), dv=YA, align="center", size=9))], h=26)
    cnt = "+".join(f'IF({{{k}}}="예",1,0)' for k, _ in SAHANG)
    lst = "&".join(f'IF({{{k}}}="예"," · {t}","")' for k, t in SAHANG)
    p.row([(3, "바꾸는 사항", L),
           (9, F("사항", '=IF(AND(' + ",".join(f'{{{k}}}=""' for k, _ in SAHANG) + '),"",IF(' + cnt + '=0,"' + SA_NONE + '","' + SA_A + '"&MID(' + lst + ',4,500)'
                 '&IF({석면}="예","' + AS_TELL + '","")))', align="left", size=8.5))], h=56)
    p.row([(3, "해체계획서 변경", L), (3, I("계획서", ex=_ex(ex, "계획서"), dv=",".join(PLAN), align="center", size=9)),
           (6, F("첨부", '=IF({계획서}="","",IF({계획서}="해당","' + PLAN_Y + '","' + PLAN_N + '"))', align="left", size=8))], h=44)
    g.sec(p, "㉰  송달 · 석면 함유재 · 가스시설 · 건축물 현황", need=26 * 8 + 10)
    p.row([(3, "전자우편 송달", L), (3, I("송달", ex=_ex(ex, "송달"), dv=",".join(SONG), align="center", size=9)),
           (6, "「행정절차법」 제14조 — 정보통신망을 이용한 문서 송달 동의", s7)], h=26)
    for a, b in ((0, 1), (2, 3), (4, 5)):
        (ka, ta), (kb, tb) = ASB[a], ASB[b]
        p.row([(3, ta, dict(L, size=7.5)), (3, I("석면" + ka, ex=_ex(ex, "석면" + ka), dv="있음,없음", align="center", size=9)),
               (3, tb, dict(L, size=7.5)), (3, I("석면" + kb, ex=_ex(ex, "석면" + kb), dv="있음,없음", align="center", size=9))], h=26)
    p.row([(3, "가스시설 안전조치", L), (3, I("가스", ex=_ex(ex, "가스"), dv=",".join(GAS), align="center", size=8)),
           (3, "안전조치 예정일", dict(L, size=8.5)), (3, I("가스예정", ex=_ex(ex, "가스예정"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "가스사업자명", L), (3, I("가스사업자", ex=_ex(ex, "가스사업자"), align="center", size=8.5)),
           (3, "가스사업자 연락처", dict(L, size=8.5)), (3, I("가스연락처", ex=_ex(ex, "가스연락처"), align="center", size=9))], h=26)
    p.row([(3, "연면적 합계(㎡)", L), (3, I("연면적", ex=_ex(ex, "연면적"), fmt='#,##0.00;;""', align="right", size=9)),
           (2, "주 건축물(동)", dict(L, size=8)), (1, I("주동", ex=_ex(ex, "주동"), fmt='0;;""', align="center", size=9)),
           (2, "부속 건축물(동)", dict(L, size=8)), (1, I("부속동", ex=_ex(ex, "부속동"), fmt='0;;""', align="center", size=9))], h=26)
    g.sec(p, "㉱  신청일 · 처리 기한", need=26 * 2 + 44 + 10)
    p.row([(3, "신 청 일", L), (3, I("신청일", ex=_ex(ex, "신청일"), fmt=DT, align="center", size=9)),
           (3, "건축위원회 심의", dict(L, size=8.5)), (3, I("심의", ex=_ex(ex, "심의"), dv=",".join(SIM), align="center", size=9))], h=26)
    p.row([(3, "심의를 거친 날", L), (3, I("심의일", ex=_ex(ex, "심의일"), fmt=DT, align="center", size=9)),
           (3, "셈 시작일", dict(L, size=8.5)),
           (3, F("기준", '=IF({심의}="거침",IF(N({심의일})=0,"",{심의일}),IF(N({신청일})=0,"",{신청일}))', fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "처리 기한", L),
           (9, F("처리", '=IF({심의}="거침",IF(N({심의일})=0,"' + SIM_NEED + '",' + _ymd("{처끝}") + '&"("&' + _yo("{처끝}") + '&")' + CH_SIM + '"&IF('
                 + MW.덮음식("{기준}", "{처끝}") + ',"' + MW.밖글 + '","")),IF(N({신청일})=0,"",' + _ymd("{처끝}") + '&"("&' + _yo("{처끝}") + '&")' + CH_A
                 + '"&IF(' + MW.덮음식("{기준}", "{처끝}") + ',"' + MW.밖글 + '","")))', align="left", size=8.5))], h=44)
    g.sec(p, "㉲  아직 안 적은 칸 · 다음 할 일", need=44 + 40 + 10)
    BIN = [("관리자 성명", '{앞쪽!성명}=""'), ("주소", '{앞쪽!주소}=""'), ("허가(신고) 번호", '{앞쪽!허가번호}=""'), ("변경 사유", '{앞쪽!사유}=""'),
           ("변경 전", '{앞쪽!변경전}=""'), ("변경 후", '{앞쪽!변경후}=""'), ("위치", '{앞쪽!위치}=""'), ("연면적 합계", "N({연면적})=0"),
           ("해체계획서 변경여부", '{계획서}=""'), ("신청일", "N({신청일})=0")]
    cnt2 = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst2 = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND({당초}="",{앞쪽!성명}=""),"",IF(' + cnt2 + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst2 + ',4,500)))',
                 align="left", size=8.5))], h=44)
    p.row([(2, "다음 할 일", dict(L, size=8.5)),
           (10, F("다음", '=IF({낼}="","",IF(LEFT({낼},4)="변경허가","' + NEXT_H + '","' + NEXT_S + '"))', align="left", size=8))], h=40)
    MW.넣기(p, "{기준}", 7, "처")
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 당초 허가 · 신고와 바꾼 뒤 대상, 바꾸는 사항, 신청일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 근린생활시설 해체 — 해체공법 · 순서 · 장비를 바꿈)."])
    return p


# ── 앞쪽 ────────────────────────────────────────────────────────────────
PAX = [120, 245, 253, 356, 360, 407, 462, 505, 602, 662, 673, 728, 750, 861, 959, 1100, 1122]
GA = Grid(PAX)


def _ck(cond, text):
    return f'IF({cond},"[√]","[   ]")&" {text}"'


def front(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "앞쪽", fit=1, widths=GA.w)
    X1, XL, X2 = 120, 245, 1122

    def inp(k, **kw):
        kw.setdefault("size", 9)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    SB = dict(SUB, size=8.5)
    LB = dict(SUBC, size=10)
    prow(p, GA, [(X1, X2, HEAD, {"kind": "free", "size": 7.5})], h=13)
    p.gap(8)
    nae = "{셈!낼}"
    prow(p, GA, [(X1, 662, "건축물 해체", {"kind": "free", "size": 16, "bold": True, "align": "right"}),
                 (662, X2, F("제목1", '=IF(LEFT(' + nae + ',4)="변경허가","[√]","[   ]")&" 변경허가 신청서"', align="left", size=15, bold=True), NB)], h=27)
    prow(p, GA, [(X1, 662, "", NB),
                 (662, X2, F("제목2", '=IF(LEFT(' + nae + ',4)="변경신고","[√]","[   ]")&" 변경신고서"', align="left", size=15, bold=True), NB)], h=27)
    p.gap(8)
    prow(p, GA, [(X1, 959, "※ 색상이 어두운 칸은 신고인이 작성하지 않으며, [ ]에는 해당되는 곳에 √표를 합니다.", {"kind": "free", "size": 7.5}),
                 (959, X2, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=13)
    band = dict(SUB, fill=S["gray"], size=8)
    rb = prow(p, GA, [(X1, 407, "변경허가(신고)번호", band), (407, 602, "접수일자", band), (602, 750, "처리일", band), (750, 861, "처리기간", band),
                      (861, X2, "7일(건축위원회의 심의를 거치는\n경우에는 그 날부터 7일)", dict(band, wrap=True, size=7.5))], h=28)
    for x in (407, 602, 750):
        vline(p, GA, rb, rb, x, S["gry"])
    p.gap(5)
    # 관리자
    a = prow(p, GA, [(X1, XL, "관리자", dict(LB, rs=7)), (XL, 673, "성명(법인명)", SB), (673, X2, "생년월일(사업자등록번호 또는 법인등록번호)", dict(SB, size=8))], h=12)
    b = prow(p, GA, [(XL, 673, inp("성명"), NB), (673, X2, inp("생년월일"), NB)], h=12)
    c = prow(p, GA, [(XL, X2, "주소", SB)], h=13)
    d = prow(p, GA, [(XL, 728, inp("주소", size=8.5), NB), (728, 861, "(전화번호:", dict(FRR, size=8)), (861, 1100, inp("전화", size=8.5, align="center"), NB),
                     (1100, X2, ")", dict(FR, size=8))], h=12)
    gray = dict(FR, size=8.5, fill=S["gray"])
    e1 = prow(p, GA, [(XL, 360, "전자우편\n송달 동의", dict(SUBC, size=9.5, rs=3, wrap=True)),
                      (360, X2, "「행정절차법」 제14조에 따라 정보통신망을 이용한 문서 송달에 동의합니다.", gray)], h=18)
    e2 = prow(p, GA, [(360, 602, F("송달1", "=" + _ck('{셈!송달}="' + SONG[0] + '"', SONG[0]), align="center", size=8.5), NB),
                      (602, X2, F("송달2", "=" + _ck('{셈!송달}="' + SONG[1] + '"', SONG[1]), align="center", size=8.5), NB)], h=23)
    e3 = prow(p, GA, [(360, 505, "전자우편 주소", dict(FRC, size=8.5)), (505, X2, inp("전자우편", blank="@", align="center", size=9), NB)], h=24)
    hline(p, GA, b, XL, X2, S["lgt"])
    vline(p, GA, a, b, 673, S["lgt"])
    hline(p, GA, d, XL, X2, S["thin"])
    for r in (e1, e2):
        hline(p, GA, r, 360, X2, S["lgt"])
    vline(p, GA, e1, e3, 360, S["lgt"])
    vline(p, GA, e2, e2, 602, S["lgt"])
    vline(p, GA, e3, e3, 505, S["lgt"])
    vline(p, GA, a, e3, XL, S["gry"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, e3, X1, X2, S["thin"])
    # 신청내용
    f1 = prow(p, GA, [(X1, XL, "신청내용", dict(LB, rs=7)), (XL, 662, "허가(신고) 번호", SB), (662, X2, "허가(신고)일", SB)], h=13)
    f2 = prow(p, GA, [(XL, 662, inp("허가번호", size=8.5), NB), (662, X2, inp("허가일", size=8.5), NB)], h=14)
    f3 = prow(p, GA, [(XL, X2, "변경 사유", SB)], h=13)
    f4 = prow(p, GA, [(XL, X2, inp("사유", size=8.5), NB)], h=15)
    f5 = prow(p, GA, [(XL, X2, "변경사항", dict(FRC, size=9))], h=17)
    f6 = prow(p, GA, [(XL, 662, "변경 전", SB), (662, X2, "변경 후", SB)], h=13)
    f7 = prow(p, GA, [(XL, 662, inp("변경전", size=8.5), NB), (662, X2, inp("변경후", size=8.5), NB)], h=17)
    for r in (f2, f4, f5):
        hline(p, GA, r, XL, X2, S["lgt"])
    vline(p, GA, f1, f2, 662, S["lgt"])
    vline(p, GA, f6, f7, 662, S["lgt"])
    vline(p, GA, f1, f7, XL, S["gry"])
    hline(p, GA, f7, X1, X2, S["thin"])
    # 해체계획서 변경여부
    pk = "{셈!계획서}"
    g1 = prow(p, GA, [(X1, XL, "해체계획서\n변경여부", dict(LB, size=9.5, wrap=True)),
                      (XL, X2, F("계획표시", '=' + _ck(pk + '="해당"', "해당") + '&"    "&' + _ck(pk + '="미해당"', "미해당"), align="center", size=9), NB)], h=32)
    vline(p, GA, g1, g1, XL, S["gry"])
    hline(p, GA, g1, X1, X2, S["thin"])
    # 건축물 현황
    h1 = prow(p, GA, [(X1, XL, "건축물 현황", dict(LB, rs=5)), (XL, X2, "위치", SB)], h=11)
    h2 = prow(p, GA, [(XL, X2, inp("위치", size=8.5), NB)], h=11)
    h3 = prow(p, GA, [(XL, 462, "연면적 합계", SB), (462, X2, "해체 건축물 수", SB)], h=14)
    h4 = prow(p, GA, [(XL, 462, F("연면적표시", '=IF(N({셈!연면적})=0,"㎡",TEXT({셈!연면적},"#,##0.00")&" ㎡")', align="right", size=9), dict(NB, rs=2)),
                      (462, X2, F("주동표시", '="주 건축물    "&IF(N({셈!주동})=0,"     ",{셈!주동})&" (동)"', align="right", size=7.5), NB)], h=16)
    h5 = prow(p, GA, [(462, X2, F("부속동표시", '="부속 건축물    "&IF(N({셈!부속동})=0,"     ",{셈!부속동})&" (동)"', align="right", size=7.5), NB)], h=16)
    hline(p, GA, h2, XL, X2, S["lgt"])
    vline(p, GA, h3, h5, 462, S["lgt"])
    vline(p, GA, h1, h5, XL, S["gry"])
    hline(p, GA, h5, X1, X2, S["thin"])

    # 석면 · 가스
    def asb(k, t):
        return F("석면표시" + k, '=IF({셈!석면' + k + '}="있음","[√]","[   ]")&" ' + t + '"', align="left", size=7.5)

    allno = "AND(" + ",".join('{셈!석면' + k + '}="없음"' for k, _ in ASB) + ")"
    c8 = dict(SUBC, size=8.5, wrap=True)
    i1 = prow(p, GA, [(X1, 356, "석면 함유재\n존치 여부", dict(c8, rs=3)), (356, 728, asb(*ASB[0]), NB), (728, 959, asb(*ASB[1]), NB),
                      (959, X2, F("석면없음표시", '=IF(' + allno + ',"[√] 해당 없음","[   ] 해당 없음")', align="center", size=8), dict(NB, rs=3))], h=16)
    prow(p, GA, [(356, 728, asb(*ASB[2]), NB), (728, 959, asb(*ASB[3]), NB)], h=16)
    i3 = prow(p, GA, [(356, 728, asb(*ASB[4]), NB), (728, 959, asb(*ASB[5]), NB)], h=16)
    vline(p, GA, i1, i3, 356, S["gry"])
    vline(p, GA, i1, i3, 959, S["lgt"])
    hline(p, GA, i3, X1, X2, S["thin"])
    gk = "{셈!가스}"
    j1 = prow(p, GA, [(X1, 356, "가스시설(가스배관 포함)\n안전조치 여부", dict(c8, size=8, rs=2)),
                      (356, X2, F("가스표시", '=IF(' + gk + '="' + GAS[0] + '","[√]","[   ]")&" 철거 및 안전조치 완료  "&IF(' + gk + '="' + GAS[1] + '","[√]","[   ]")'
                                  '&" 철거 및 안전조치 예정(예정일: "&IF(N({셈!가스예정})=0,"         ",' + _ymd("{셈!가스예정}") + ')&")  "&IF(' + gk + '="' + GAS[2]
                                  + '","[√]","[   ]")&" 해당 없음"', align="left", size=7.2), NB)], h=17)
    j2 = prow(p, GA, [(356, X2, F("가스사업자표시", '="※ 가스사업자명: "&IF({셈!가스사업자}="","                ",{셈!가스사업자})&"      (연락처: "'
                                  '&IF({셈!가스연락처}="","            ",{셈!가스연락처})&"      )"', align="left", size=7.5), NB)], h=17)
    vline(p, GA, j1, j2, 356, S["gry"])
    hline(p, GA, j2, X1, X2, S["thin"])
    p.gap(6)
    prow(p, GA, [(X1, X2, "「건축물관리법」 제30조의3제1항 및 같은 법 시행규칙 제12조의3제1항ㆍ제2항에 따라 위와 같이 건축물 해체\n변경허가 신청서(변경신고서)를 제출합니다.",
                  {"kind": "free", "size": 9, "indent": 2, "wrap": True})], h=32)
    prow(p, GA, [(X1, X2, F("신청일표시", '=IF(N({셈!신청일})=0,"년           월           일",YEAR({셈!신청일})&"년      "&MONTH({셈!신청일})&"월      "&DAY({셈!신청일})&"일")',
                             align="right", size=9), NB)], h=20)
    p.gap(4)
    prow(p, GA, [(X1, 505, "", NB), (505, 662, "신청인(신고인)", dict(FRC, size=9)), (662, 959, F("신청인표시", '=IF({성명}="","",{성명})', align="center", size=8), NB),
                 (959, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=20)
    r = prow(p, GA, [(X1, 959, inp("수신", blank="특별자치시장ㆍ특별자치도지사 또는 시장ㆍ군수ㆍ구청장", size=11, bold=True, align="left"), NB),
                     (959, X2, "귀하", dict(FR, size=9))], h=24)
    p.gap(3)
    r = prow(p, GA, [(X1, X2, "", NB)], h=2)
    hline(p, GA, r, X1, X2, S["med"], below=False)
    p.gap(6)
    rc = prow(p, GA, [(X1, 253, "첨부서류", dict(FRC, size=8.5)), (253, 861, CHEOM, {"kind": "free", "size": 7.5, "align": "left", "wrap": True}),
                      (861, X2, "수수료\n없음", dict(FRC, size=8, wrap=True))], h=32)
    hline(p, GA, rc, X1, X2, S["thin"], below=False)
    hline(p, GA, rc, X1, X2, S["lgt"])
    for x in (253, 861):
        vline(p, GA, rc, rc, x, S["lgt"])
    p.gap(5)
    rg = prow(p, GA, [(X1, X2, "「건축물관리법」 근거규정", {"kind": "free", "size": 9, "align": "center", "fill": S["band"]})], h=24)
    hline(p, GA, rg, X1, X2, S["thin"], below=False)
    rg2 = prow(p, GA, [(X1, 253, GEUN_L, dict(FRC, size=7.5, wrap=True)), (253, X2, GEUN, {"kind": "free", "size": 7.8, "align": "left", "wrap": True})], h=50)
    vline(p, GA, rg2, rg2, 253, S["lgt"])
    hline(p, GA, rg2, X1, X2, S["thin"])
    p.gap(4)
    prow(p, GA, [(X1, X2, "210mm×297mm[백상지(80g/㎡)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["제목 · 송달 · 해체계획서 변경여부 · 석면 · 가스 √ 와 연면적 · 동 수 · 신청일은 ① 장에서 들어옵니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호)."])
    return p


# ── 뒤쪽 (원문 그대로) ──────────────────────────────────────────────────
BAX = [120, 245, 254, 358, 397, 507, 546, 661, 706, 834, 872, 965, 1003, 1102, 1122]
GB = Grid(BAX)


def back(bk, ex):
    from fb import text_lines
    S = _sides()
    p = g.pg(bk, ex, "뒤쪽", fit=1, widths=GB.w)
    X1, XL, X2 = 120, 245, 1122
    prow(p, GB, [(X1, X2, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=15)
    r0 = prow(p, GB, [(X1, X2, "", NB)], h=2)
    hline(p, GB, r0, X1, X2, S["med"])
    p.gap(150)                                   # 원문 빈 자리(굵은 줄 아래 ~ 유의사항 띠)
    rb = prow(p, GB, [(X1, X2, "유의사항", {"kind": "free", "size": 9.5, "align": "center", "fill": S["band"]})], h=23)
    hline(p, GB, rb, X1, X2, S["thin"], below=False)
    tx = {"kind": "free", "size": 7.6, "align": "left", "wrap": True, "valign": "top"}
    cols = sum(GB.w[GB.ix[XL]:GB.ix[X2]])
    first = None
    for k, t in enumerate(YU):
        n = text_lines(t, cols * 10.0 / 7.6)
        cells = ([(X1, XL, YU_L, dict(FRC, size=7.2, wrap=True, rs=len(YU)))] if k == 0 else []) + [(XL, X2, t, dict(tx, valign="top" if n > 1 else "center"))]
        r = prow(p, GB, cells, h=n * 7.6 * 1.45 + 4)
        first = r if first is None else first
    vline(p, GB, first, r, XL, S["lgt"])
    hline(p, GB, r, X1, X2, S["lgt"])
    p.gap(12)
    rb2 = prow(p, GB, [(X1, X2, "처리절차", {"kind": "free", "size": 9.5, "align": "center", "fill": S["band"]})], h=23)
    hline(p, GB, rb2, X1, X2, S["thin"], below=False)
    box = {"kind": "free", "size": 7.6, "align": "center", "wrap": True}
    arw = {"kind": "free", "size": 9, "align": "center"}
    sm = {"kind": "free", "size": 7.6, "align": "center", "wrap": True}
    XB = [(254, 358), (397, 507), (546, 661), (706, 834), (872, 965), (1003, 1102)]
    for nm, steps in ((CJ_H, STEP_H), (CJ_S, STEP_S)):
        p.gap(4)
        cells = [(X1, XL, nm, dict(FRC, size=7.2, wrap=True, rs=3)), (XL, 254, "", NB)]
        for i, (x1, x2) in enumerate(XB):
            cells.append((x1, x2, steps[i], box))
            nx = XB[i + 1][0] if i + 1 < len(XB) else X2
            cells.append((x2, nx, "➔" if i + 1 < len(XB) else "", arw if i + 1 < len(XB) else NB))
        r1 = prow(p, GB, cells, h=44)
        for x1, x2 in XB:
            hline(p, GB, r1, x1, x2, S["gry"], below=False)
            hline(p, GB, r1, x1, x2, S["gry"])
            vline(p, GB, r1, r1, x1, S["gry"])
            vline(p, GB, r1, r1, x2, S["gry"])
        prow(p, GB, [(XL, 254, "", NB), (254, 358, "신청인\n(관리자)", sm), (358, 397, "", NB), (397, 1102, BUSEO, sm), (1102, X2, "", NB)], h=22)
        r3 = prow(p, GB, [(XL, X2, ANJEON, {"kind": "free", "size": 6.8, "align": "center"})], h=15)
        vline(p, GB, r1, r3, XL, S["lgt"])
        hline(p, GB, r3, X1, X2, S["lgt"])
    p.gap(16)
    prow(p, GB, [(X1, X2, "210mm×297mm[백상지(80g/㎡)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["뒤쪽은 원문 그대로입니다(건축물관리법 시행규칙 별지 제6호의5서식)."])
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


def _ckp(c, t):
    return ("[√]" if c else "[   ]") + " " + t


def _nae(sm):
    dc, dw = sm.get("당초"), sm.get("변경뒤")
    if not dc:
        return ""
    if dc == DANGCHO[0]:
        return NAE_S3 if dw == DWI[1] else NAE_H1
    return NAE_H4 if dw == DWI[2] else NAE_S2


def expect(pages):
    sm, fr = pages["셈"], pages["앞쪽"]
    a, b = {}, {}
    nae = _nae(sm)
    a["낼"] = nae
    vals = {k: sm.get(k) for k, _ in SAHANG}
    if all(not v for v in vals.values()):
        a["사항"] = ""
    elif sum(1 for v in vals.values() if v == "예") == 0:
        a["사항"] = SA_NONE
    else:
        a["사항"] = SA_A + " · ".join(t for k, t in SAHANG if vals[k] == "예") + (AS_TELL if vals["석면"] == "예" else "")
    pl = sm.get("계획서")
    a["첨부"] = "" if not pl else (PLAN_Y if pl == "해당" else PLAN_N)
    sd, sim, sid = sm.get("신청일"), sm.get("심의"), sm.get("심의일")
    base = (sid or "") if sim == "거침" else (sd or "")
    a["기준"] = base
    if sim == "거침":
        if not sid:
            a["처리"] = SIM_NEED
        else:
            dd = MW.처리끝(sid, 7)
            a["처리"] = f"{_ymdp(dd)}({'월화수목금토일'[dd.weekday()]}){CH_SIM}" + ("" if MW.다덮음(sid, dd) else MW.밖글)
    elif not sd:
        a["처리"] = ""
    else:
        dd = MW.처리끝(sd, 7)
        a["처리"] = f"{_ymdp(dd)}({'월화수목금토일'[dd.weekday()]}){CH_A}" + ("" if MW.다덮음(sd, dd) else MW.밖글)
    for k in range(1, MW.되풀이 + 1):
        a["처끝" if k == MW.되풀이 else f"처E{k}"] = "" if not base else MW.식흉내(base, 7, k)
    keys = [("관리자 성명", not fr.get("성명")), ("주소", not fr.get("주소")), ("허가(신고) 번호", not fr.get("허가번호")), ("변경 사유", not fr.get("사유")),
            ("변경 전", not fr.get("변경전")), ("변경 후", not fr.get("변경후")), ("위치", not fr.get("위치")), ("연면적 합계", not sm.get("연면적")),
            ("해체계획서 변경여부", not pl), ("신청일", not sd)]
    if not sm.get("당초") and not fr.get("성명"):
        a["빈칸"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
    a["다음"] = "" if not nae else (NEXT_H if nae.startswith("변경허가") else NEXT_S)
    b["제목1"] = _ckp(nae.startswith("변경허가"), "변경허가 신청서")
    b["제목2"] = _ckp(nae.startswith("변경신고"), "변경신고서")
    song = sm.get("송달")
    b["송달1"] = _ckp(song == SONG[0], SONG[0])
    b["송달2"] = _ckp(song == SONG[1], SONG[1])
    b["계획표시"] = _ckp(pl == "해당", "해당") + "    " + _ckp(pl == "미해당", "미해당")
    ar = sm.get("연면적")
    b["연면적표시"] = "㎡" if not ar else f"{ar:,.2f} ㎡"
    jd, bd = sm.get("주동"), sm.get("부속동")
    b["주동표시"] = f"주 건축물    {jd if jd else '     '} (동)"
    b["부속동표시"] = f"부속 건축물    {bd if bd else '     '} (동)"
    for k, t in ASB:
        b["석면표시" + k] = _ckp(sm.get("석면" + k) == "있음", t)
    b["석면없음표시"] = _ckp(all(sm.get("석면" + k) == "없음" for k, _ in ASB), "해당 없음")
    gs, gy = sm.get("가스"), sm.get("가스예정")
    b["가스표시"] = (_ckp(gs == GAS[0], "철거 및 안전조치 완료") + "  " + _ckp(gs == GAS[1], "철거 및 안전조치 예정(예정일: ")
                    + (_ymdp(gy) if gy else "         ") + ")  " + _ckp(gs == GAS[2], "해당 없음"))
    b["가스사업자표시"] = ("※ 가스사업자명: " + (sm.get("가스사업자") or "                ") + "      (연락처: "
                       + (sm.get("가스연락처") or "            ") + "      )")
    b["신청일표시"] = "년           월           일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    b["신청인표시"] = fr.get("성명") or ""
    return {"셈": a, "앞쪽": b}
