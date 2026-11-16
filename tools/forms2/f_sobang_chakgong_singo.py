# -*- coding: utf-8 -*-
"""소방시설공사 착공(변경)신고서 — 새로 만든 서식 (2026-11-16 G699 · 소장님 「오늘 중으로 다 만들자. 서식」 — 101종 첫 묶음)
   → ① 무엇을 내나(착공신고 — 착공 전까지 · 변경신고 — 중요한 사항이 바뀐 날부터 30일 이내) · 착공신고 대상(영 제4조 — 신설 · 증설 · 개설 · 이전 · 정비 ·
     위험물 제조소등 · 다중이용업소 빠짐) · 착공일 · 완공예정일 날 수 · 신고 기한 · 신고일 확인 · 처리 2일 · 분리도급(법 제21조제2항 · 영 제11조의2) ·
     공사대금 지급보증(법 제21조의4 · 영 제11조의5 · 제11조의6) · 도급구분 · 하도급 · 붙일 서류(규칙 제12조제1항 · 제3항) · 아직 안 적은 칸 · 처분
   · 신고서(소방시설공사업법 시행규칙 [별지 제14호서식] <개정 2026. 10. 20.> 앞쪽 칸 차례 그대로) · 뒤쪽(작성방법 · 첨부서류 · 처분기준 · 처리절차 원문 그대로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).

근거(국가법령정보센터 · 2026-11-16 · 메모 /home/claude/g10/notes/G699_소방착공_근거.md · 원문 글층 G699_소방착공_원문.txt):
  · 소방시설공사업법 [시행 2025. 1. 31.] 제13조 ① 착공신고 ② 중요한 사항 변경신고 · 그 밖의 변경은 완공검사 신청서류 · 감리 결과보고서에 넣어 보고 ③ 2일 이내 신고수리 여부 통지
    ④ 통지 없으면 기간이 끝난 날의 다음 날 수리 간주 · 제9조제1항제12호 · 제40조제1항제1호 · 제21조제2항(분리도급) · 제21조의4(공사대금 지급보증)
  · 시행령 [시행 2026. 7. 1.] 제4조(착공신고 대상 · 단서 — 제조소등 · 다중이용업소 빠짐) · 제11조의2(분리 도급의 예외) · 제11조의5(공공기관) · 제11조의6(1천만원 미만 · 3개월 이내)
  · 시행규칙 [시행 2026. 10. 20.] 제12조 ① 착공 전까지 + 서류 1~5 ② 중요한 사항(시공자 · 소방시설의 종류 · 소방기술자) ③ 변경일부터 30일 이내 · 바뀐 서류만 ④ 2일 이내 처리 ⑤ 현황 표지
■ 짐작 안 함: «30일 이내» 는 첫날 빼고(민법 제157조) 셈 — 끝날이 토요일 · 공휴일이면 그다음 날(민법 제161조)은 글로 알림 · «3개월 이내» 는 착공일부터(민법 제160조 — 같은 날짜
  전날, 그 달에 그날이 없으면 그 달 끝날) · 지급보증 √ 칸은 고른 대로만(어느 칸인지 단정 안 함) · 2일 처리는 날짜로 셈하지 않음(근무시간 셈)."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import FR, H, L

SLUG = "sobang-chakgong-singo"
TITLE = "소방시설공사 착공(변경)신고서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "소방시설공사 착공(변경)신고서(소방시설공사업법 시행규칙 별지 제14호서식 앞쪽) — 빈 서식 (원문 칸 차례 그대로)"),
        (5, "소방시설공사 착공(변경)신고서 — 작성 예시 (도급형태 · 지급보증 · 도급구분 · 공사종류 √ 와 착공일 · 완공예정일 · 도급금액이 ① 장에서 저절로)"),
        (4, "① 착공신고 · 변경신고 — 대상 · 기한 · 분리도급 · 지급보증 · 붙일 서류 — 작성 예시 (가상의 업무시설 소방시설 신설)"),
        (6, "뒤쪽 — 작성방법 · 첨부서류 · 처분기준 · 처리절차 (원문 그대로)")]
MULTI = True
SHORT = ("소방시설공사 착공(변경)신고서(소방시설공사업법 시행규칙 별지 제14호서식) — 착공신고 · 변경신고와 공사종류를 고르고 착공일을 적으면 착공신고 대상(영 제4조)과 "
         "신고 기한(착공 전까지 · 변경은 30일), 분리도급 · 공사대금 지급보증 확인, 붙일 서류가 저절로 나오고 도급형태 · 지급보증 · 도급구분 · 공사종류 · 변경내용 √ 가 "
         "신고서에 들어갑니다. 뒤쪽 작성방법 · 첨부서류 · 처분기준 · 처리절차 원문 그대로.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
YOIL = "일월화수목금토"
MONEY = '#,##0" 원";;""'
AREA = '#,##0.00" ㎡";;""'

GJ = ["착공신고", "변경신고"]
JS = ["일반 특정소방대상물", "위험물 제조소등", "다중이용업소"]
GS = ["신설", "증설", "개설", "이전", "정비", "그 밖의 공사"]
BB = ["바뀜", "안 바뀜"]
DH = ["분리도급", "분리도급 예외"]
YE = ["제1호 재난으로 긴급히 착공하는 공사", "제2호 국방 · 국가안보 기밀 공사", "제3호 영 제4조 착공신고 대상이 아닌 공사",
      "제4호 연면적 1천㎡ 이하 비상경보설비 공사", "제5호 대안 · 일괄 · 기술제안 입찰 공사", "제5호의2 국가첨단전략기술 시설 공사",
      "제6호 국가유산수리 · 재개발 · 재건축 등(소방청장 인정)"]
BJ = ["민간", "국가 · 지방자치단체 · 공공기관"]
JB = ["계약이행 미보증", "공사대금 지급보증 또는 담보 제공", "공사대금 지급보증 예외"]
DG = ["원도급", "하도급"]
HD = ["하도급 없음", "공사 일부를 하도급함"]
BK = ("변경시공자", "변경소방시설", "변경기술자")      # 셈 «바뀐 사항» 열쇠(차례 = 서식 변경내용 차례)

# 판정 · 안내 글(셈 · 파이썬 같은 글)
DS_X = "⚠ 위험물 제조소등 · 다중이용업소에서의 소방시설공사는 착공신고 대상에서 빠짐(영 제4조 단서)"
DS_1 = ("신설 — 옥내소화전 · 스프링클러설비등 · 물분무등소화설비 · 옥외소화전 · 소화용수 · 제연 · 연결송수관 · 연결살수 · 연소방지설비, 비상경보 · "
        "자동화재탐지 · 화재알림 · 비상방송 · 비상콘센트 · 무선통신보조설비를 새로 설치하면 대상(영 제4조제1호 · 겸용 설비를 다른 업종 공사업자가 하는 경우 등은 빠짐)")
DS_2 = ("증설 — 옥내 · 옥외소화전설비, 스프링클러설비등 · 물분무등소화설비의 방호 · 방수구역, 자동화재탐지 · 화재알림설비의 경계구역, 제연구역, 송수구역, "
        "살수구역, 비상콘센트설비의 전용회로를 늘리면 대상(영 제4조제2호)")
DS_3 = ("개설 · 이전 · 정비 — 수신반 · 소화펌프 · 동력제어반 · 감시제어반의 전부 또는 일부면 대상(영 제4조제3호) · 고장 · 파손으로 작동시킬 수 없어 "
        "긴급히 교체 · 보수하면 신고하지 않을 수 있음")
DS_4 = "그 밖의 공사 — 영 제4조 각 호(신설 · 증설 · 개설 · 이전 · 정비)에 드는 공사인지 확인합니다"
PJ_C = "착공신고 — 공사업자가 착공 전까지 소방본부장 · 소방서장에게(법 제13조제1항 · 규칙 제12조제1항)"
PJ_B = ("변경신고 — 중요한 사항(시공자 · 설치되는 소방시설의 종류 · 책임시공 및 기술관리 소방기술자)이 바뀐 날부터 30일 이내"
        "(법 제13조제2항 · 규칙 제12조제2항 · 제3항)")
PJ_N = ("⚠ 중요한 사항이 바뀌지 않았으면 변경신고 대상이 아님 — 그 밖의 변경은 완공검사 신청서류나 공사감리 결과보고서에 넣어 보고"
        "(법 제13조제2항 후단)")
PJ_Q = "변경신고 — 바뀐 사항(시공자 · 소방시설 종류 · 소방기술자)을 고릅니다"
GAP_NEED = "⚠ 신고서 아래 «년 월 일»(신고일)과 착공일을 적으면 날 수를 셉니다"
GAP_LATE = "⚠ 신고일이 착공일보다 늦습니다 — 착공신고는 착공 전까지(규칙 제12조제1항)"
GAP_SAME = "⚠ 신고일과 착공일이 같은 날 — 공사를 시작하기 전에 신고합니다(규칙 제12조제1항 «착공 전까지»)"
GAP_IN_A, GAP_IN_B = "⚠ 신고일부터 착공일까지 ", "일 — 신고수리 여부 통지 기간(받은 날부터 2일 · 법 제13조제3항) 안에 착공일이 듭니다"
GAP_OK_A, GAP_OK_B = "✓ 신고일부터 착공일까지 ", "일 — 착공 전 신고"
BG_NEED = "⚠ 신고서 아래 «년 월 일»(신고일)과 변경일을 적으면 기한 안인지 봅니다"
BG_EARLY = "⚠ 신고일이 변경일보다 빠릅니다 — 날짜를 확인합니다"
BG_LATE = "⚠ 신고일이 기한(변경일부터 30일)을 넘깁니다 — 끝날이 토요일 · 공휴일이면 그다음 날까지(민법 제161조)"
BG_OK0 = "✓ 30일 안 — 변경일 당일 신고"
BG_OK_A, BG_OK_B = "✓ 30일 안 — 변경일 다음 날부터 ", "일째"
BR_OK = "✓ 다른 업종 공사와 분리하여 도급(법 제21조제2항 본문) — 신고서 «분리도급» 에 √"
BR_Q = "⚠ 분리도급 예외는 영 제11조의2 각 호에 해당해야 합니다 — 사유를 고릅니다"
BR_X = "✓ 분리도급 예외(법 제21조제2항 단서) — 영 제11조의2"
BO_SM = ("✓ 도급금액 1천만원 미만 — 계약이행 보증 · 공사대금 지급보증 · 담보 제공 · 보험료 지급을 안 할 수 있음(법 제21조의4제2항 · 영 제11조의6제1호)")
BO_SH_A = "✓ 공사기간 3개월 이내(착공일부터 "
BO_SH_B = "까지) — 계약이행 보증 · 공사대금 지급보증 · 담보 제공 · 보험료 지급을 안 할 수 있음(법 제21조의4제2항 · 영 제11조의6제2호)"
BO_PUB = ("공공 발주(국가 · 지방자치단체 · 공기업 · 준정부기관 · 지방공사 · 지방공단) — 법 제21조의4제1항의 발주자 공사대금 지급보증 의무는 "
          "이들 외의 자가 발주한 공사에 적용(영 제11조의5)")
BO_PRI = ("민간 발주 — 수급인이 계약이행을 보증하면 발주자도 공사대금 지급을 보증하거나 담보를 제공(어려우면 이행보증을 받은 날부터 30일 이내에 "
          "보험료 · 공제료 지급) — 법 제21조의4제1항")
AT_C1 = "1. 공사업자의 소방시설공사업 등록증 · 등록수첩 사본 · 2. 소방기술자 기술등급 증명 서류 사본 · 3. 소방시설공사 계약서 사본 · 4. 설계도서 1부"
AT_C4A = "(영 제4조제3호 공사 — 안 붙여도 됨)"
AT_C4B = "(건축허가등 동의요구서에 붙인 설계도서가 안 바뀌었으면 안 붙여도 됨)"
AT_C5 = " · 5. 하도급통지서(별지 제31호서식) 사본 · 하도급대금 지급보증서 사본(보증이 필요 없거나 적합하지 않다고 인정되면 그 증빙 서류)"
AT_B0 = "바뀐 사항의 서류만(규칙 제12조제3항) — "
AT_BS = " / 시공자: 새 공사업자의 1번 등록증 · 등록수첩 사본 · 3번 계약서 사본"
AT_BF = " / 소방시설 종류: 4번 설계도서"
AT_BG = " / 소방기술자: 2번 기술등급 증명 서류 사본"
BIN_OK = "✓ 앞쪽 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
SURI = ("소방본부장 · 소방서장은 받은 날부터 2일 이내에 신고수리 여부를 신고인에게 통지(법 제13조제3항) — 그 기간에 수리 여부나 처리기간 연장을 통지하지 "
        "않으면 기간이 끝난 날의 다음 날 수리한 것으로 봄(같은 조 제4항) · 소방시설공사현황 표지(별지 제16호서식) 게시를 요청할 수 있음(규칙 제12조제5항)")
CHEOBUN = "신고를 하지 않거나 거짓으로 하면 등록취소 또는 6개월 이내의 시정 · 영업정지(법 제9조제1항제12호) · 200만원 이하 과태료(법 제40조제1항제1호)"
GONGDONG = "※ 「전자정부법」 제36조제1항의 행정정보 공동이용으로 확인할 수 있는 서류는 그 확인으로 첨부를 갈음할 수 있음(규칙 제12조제1항 단서)"

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"종류": GJ[0], "장소": JS[0], "공사종류": GS[0], "변경시공자": None, "변경소방시설": None, "변경기술자": None,
      "소방착공": D(2026, 12, 14), "소방완공": D(2027, 4, 30), "변경일": None,
      "도급형태": DH[0], "예외사유": None, "발주구분": BJ[0], "도급금액": 186000000, "지급보증": JB[1], "도급구분": DG[0], "하도급": HD[0]}
EX_S = {"대상명칭": "가나타워(가칭)", "용도": "업무시설", "대상소재지": "가나시 다라구 마바동 123-4", "대상전화": "000-0000-0000",
        "지하": 2, "지상": 9, "동수": 1, "대지면적": 1250.0, "연면적": 8960.5, "바닥면적": 995.6, "건축면적": 1020.0,
        "전체소방시설": "소화기구, 옥내소화전설비, 스프링클러설비, 자동화재탐지설비, 비상방송설비, 유도등, 연결송수관설비, 제연설비",
        "관계인": "예시개발(주) 대표이사 홍길동", "관계인주소": "가나시 라마구 바사로 12", "관계인전화": "000-0000-0000",
        "상호": "가나소방(주)", "등록번호": "가나-전문-0000", "대표자": "김철수", "업자소재지": "가나시 마바구 사아로 7", "전화번호": "000-0000-0000",
        "시공소방시설": "옥내소화전설비, 스프링클러설비, 자동화재탐지설비, 비상방송설비, 연결송수관설비, 제연설비",
        "기술자성명": "정민호", "수첩번호": "0000-000000", "분야등급": "기계 · 전기 / 고급",
        "전상호": None, "후상호": None, "전등록번호": None, "후등록번호": None, "전대표자": None, "후대표자": None,
        "전소재지": None, "전전화": None, "후소재지": None, "후전화": None, "정산금액": None, "후도급금액": None,
        "전종류": None, "후종류": None, "전기술자": None, "전수첩": None, "후기술자": None, "후수첩": None, "전분야": None, "후분야": None,
        "전배치시작": None, "전배치끝": None, "후배치시작": None, "후배치끝": None,
        "신고일": D(2026, 12, 3), "수신": "가나소방서장  귀하"}

# 뒤쪽 원문(작성방법 · 첨부서류 · 처분기준 · 처리절차) — 원문 글 그대로
HOWTO = ("시공자 변경사항 신고 시 ‘정산금액’은 변경 전 시공자가 관계인에 대하여 정산받은 금액을 기재하고, ‘도급금액’은 변경 후 시공자가 받을 금액에 대하여 "
         "기재합니다.")
ATTACH = ("1. 공사업자의 소방시설공사업 등록증 사본 1부 및 등록수첩 사본 1부\n"
          "2. 해당 소방시설공사의 책임시공 및 기술관리를 하는 기술인력의 기술등급을 증명하는 서류 사본 1부\n"
          "3. 소방시설공사 계약서 사본 1부\n"
          "4. 설계도서 1부. 다만, 「소방시설공사업법 시행령」 제4조제3호에 해당하는 소방시설공사인 경우 또는 「소방시설 설치 및 관리에 관한 법률 시행규칙」 "
          "제3조제2항에 따라 건축허가등의 동의요구서에 첨부된 설계도서가 변경되지 않은 경우에는 첨부하지 않을 수 있습니다.\n"
          "5. 소방시설공사를 하도급하는 경우 다음 각 목의 서류\n"
          "  가. 「소방시설공사업법 시행규칙」 제20조제1항 및 별지 제31호서식에 따른 소방시설공사등의 하도급통지서 사본 1부\n"
          "  나. 하도급대금 지급에 관한 다음의 어느 하나에 해당하는 서류\n"
          "    1) 「하도급거래 공정화에 관한 법률」 제13조의2에 따라 공사대금 지급을 보증한 경우에는 하도급대금 지급보증서 사본 1부\n"
          "    2) 「하도급거래 공정화에 관한 법률」 제13조의2제1항 각 호 외의 부분 단서 및 같은 법 시행령 제8조제1항에 따라 보증이 필요하지 않거나 보증이 "
          "적합하지 않다고 인정되는 경우에는 이를 증빙하는 서류 사본 1부\n"
          "\n"
          "※ 변경신고인은 변경된 사항의 서류만을 첨부합니다.")
CHEOBUN_WON = ("공사업자는 착공신고 및 착공변경신고를 소방본부장이나 소방서장에게 신고하여야 하며, 신고를 하지 아니하거나 거짓으로 신고한 경우 "
               "「소방시설공사업법」 제9조제12호 및 제40조제1항제1호에 따라 등록을 취소하거나 6개월 이내의 영업정지, 200만원 이하의 과태료가 부과됩니다.")
STEP = ["접수", "검토", "결재", "결과통보"]
PAPER = "210mm×297mm[백상지80g/㎡ 또는 중질지80g/㎡]"
SUSIN = "소방본부장/소방서장  귀하"


def _ymdf(ref):
    """날짜 → «2027. 3. 10.» — TEXT 날짜 대신(두 번째 계산기 버릇 · G670)"""
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


def _ex(ex, k):
    return EX[k] if ex else None


def _es(ex, k):
    return EX_S[k] if ex else None


def _close(p, r):
    """표 안 «free» 칸(«(전화번호:» · «)» · «층,» · «(서명 또는 인)» …)에 위 · 아래 선 — 줄 끝 칸은 오른선도(표 테두리가 끊기지 않게 · 원문처럼 한 칸으로 보이게)"""
    from openpyxl.styles import Border
    from fb import LINE
    for c in range(1, p.pc + 1):
        bd = p.ws.cell(row=r, column=c).border
        if any(getattr(bd, k) is not None and getattr(bd, k).style for k in ("left", "right", "top", "bottom")):
            continue
        p.ws.cell(row=r, column=c).border = Border(top=LINE, bottom=LINE, right=LINE if c == p.pc else None)


def _box(v, opts, sep="   "):
    """서식 √ 줄 — «분리도급 [√]   분리도급 예외 [   ]» (원문 이름 뒤 [ ])"""
    return sep.join(f'{name} [√]' if v == key else f'{name} [   ]' for key, name in opts)


def _box_f(ref, opts, sep="   "):
    return '=' + ('&"' + sep + '"&').join(f'"{name} "&IF({ref}="{key}","[√]","[   ]")' for key, name in opts)


O_DH = [(DH[0], "분리도급"), (DH[1], "분리도급 예외")]
O_JB = [(JB[0], "계약이행미보증"), (JB[1], "공사대금지급보증 또는 담보제공"), (JB[2], "공사대금지급보증 예외")]
O_DG = [(DG[0], "원도급"), (DG[1], "하도급")]
O_GS = [(k, k) for k in GS]

CNT_Y = "+".join(f'IF({{{k}}}="{BB[0]}",1,0)' for k in BK)
CNT_N = "+".join(f'IF({{{k}}}="{BB[1]}",1,0)' for k in BK)
HAS_HD = f'OR({{도급구분}}="{DG[1]}",{{하도급}}="{HD[1]}")'
END3 = 'IF(DAY(EDATE({소방착공},3))<DAY({소방착공}),EOMONTH({소방착공},3),EDATE({소방착공},3)-1)'     # 민법 제160조 ② · ③


# ── ① 무엇을 내나 · 기한 · 도급 · 지급보증 · 서류 ─────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  소방시설공사 착공신고 · 변경신고 — 대상 · 기한 · 도급 · 지급보증 · 서류 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 소방시설공사업자는 착공 전까지 소방본부장 · 소방서장에게 착공신고를 하고(소방시설공사업법 제13조제1항 · 시행규칙 제12조제1항), 시공자 · "
              "설치되는 소방시설의 종류 · 책임시공 및 기술관리 소방기술자가 바뀌면 바뀐 날부터 30일 이내에 변경신고를 합니다(같은 법 제13조제2항 · 규칙 제12조제3항). "
              "여기서 고른 값이 신고서의 도급형태 · 지급보증 · 도급구분 · 공사종류 · 변경내용 √ 와 착공일 · 완공예정일 · 도급금액으로 들어갑니다.")
    sz = {"kind": "text", "size": 7.5}
    s7 = {"kind": "text", "size": 7}

    g.sec(p, "㉮  무엇을 내나 · 착공신고 대상 (법 제13조 · 영 제4조)", need=26 * 6 + 10)
    p.row([(3, "신고 종류", L), (4, I("종류", ex=_ex(ex, "종류"), dv=",".join(GJ), align="center", size=8.5)),
           (5, "처음 착공 전이면 착공신고 · 신고한 뒤 중요한 사항이 바뀌면 변경신고", s7)], h=26)
    p.row([(3, "공사 장소", L), (4, I("장소", ex=_ex(ex, "장소"), dv=",".join(JS), align="center", size=8)),
           (5, "위험물 제조소등 · 다중이용업소에서의 소방시설공사는 착공신고 대상이 아님", s7)], h=26)
    p.row([(3, "공사종류", L), (4, I("공사종류", ex=_ex(ex, "공사종류"), dv=",".join(GS), align="center", size=8.5)),
           (5, "신고서 «공사종류» 에 √", sz)], h=26)
    p.row([(3, "착공신고 대상", L),
           (9, F("대상", f'=IF(OR({{장소}}="{JS[1]}",{{장소}}="{JS[2]}"),"{DS_X}",IF({{공사종류}}="","",IF({{공사종류}}="{GS[0]}","{DS_1}",'
                         f'IF({{공사종류}}="{GS[1]}","{DS_2}",IF({{공사종류}}="{GS[5]}","{DS_4}","{DS_3}")))))', align="left", size=7.5))], h=58)
    small = {"kind": "label", "size": 7}
    p.row([(3, "바뀐 사항(변경신고)", L), (1, "시공자", small), (2, I(BK[0], ex=_ex(ex, BK[0]), dv=",".join(BB), align="center", size=8)),
           (1, "소방시설\n종류", small), (2, I(BK[1], ex=_ex(ex, BK[1]), dv=",".join(BB), align="center", size=8)),
           (1, "소방\n기술자", small), (2, I(BK[2], ex=_ex(ex, BK[2]), dv=",".join(BB), align="center", size=8))], h=28)
    p.row([(3, "판    정", L),
           (9, F("판정", f'=IF({{종류}}="","",IF({{종류}}="{GJ[0]}","{PJ_C}",IF({CNT_Y}>0,"{PJ_B}",IF({CNT_N}=3,"{PJ_N}","{PJ_Q}"))))',
                 align="left", size=8.5, bold=True))], h=40)

    g.sec(p, "㉯  착공일 · 신고 기한 · 신고일 (규칙 제12조 · 법 제13조제3항)", need=26 * 6 + 40)
    p.row([(3, "착공일 ~ 완공예정일", L), (3, I("소방착공", ex=_ex(ex, "소방착공"), fmt=DT, align="center")), (1, "~", {"kind": "ctext"}),
           (3, I("소방완공", ex=_ex(ex, "소방완공"), fmt=DT, align="center")),
           (2, F("공사일수", '=IF(OR(N({소방착공})=0,N({소방완공})=0),"",{소방완공}-{소방착공}+1)', fmt='#,##0"일";;""', align="center", bold=True))], h=26)
    p.row([(3, "기간 확인", L),
           (9, F("기간확인", '=IF(N({소방착공})=0,"",IF(N({소방완공})=0,"⚠ 완공예정일을 적습니다",IF({소방완공}<{소방착공},"⚠ 완공예정일이 착공일보다 빠릅니다",'
                 '"✓ 날 수는 첫날 · 끝날 포함 · 신고서 «착공일 · 완공예정일» 에 들어감")))', align="left", size=8.5))], h=24)
    p.row([(3, "변경일", L), (3, I("변경일", ex=_ex(ex, "변경일"), fmt=DT, align="center")),
           (6, "변경신고만 — 시공자 · 소방시설 종류 · 소방기술자가 바뀐 날", s7)], h=26)
    ck, bd = "{소방착공}", "{변경일}+30"
    p.row([(3, "신고 기한", L),
           (9, F("기한", f'=IF({{종류}}="{GJ[0]}",IF(N({ck})=0,"","착공 전까지 — 착공일 "&' + _ymdf(ck) + '&"("&' + _yo(ck) + '&") · "&'
                 f'IF({ck}<TODAY(),"⚠ 착공일이 지났습니다",IF({ck}=TODAY(),"⚠ 오늘이 착공일입니다","오늘부터 착공일까지 "&TEXT({ck}-TODAY(),"#,##0")&"일"))),'
                 f'IF({{종류}}="{GJ[1]}",IF(N({{변경일}})=0,"",' + _ymdf(bd) + '&"("&' + _yo(bd) + '&")까지 — 변경일부터 30일 · "&'
                 f'IF({bd}<TODAY(),"⚠ 지났습니다","오늘부터 "&TEXT({bd}-TODAY(),"#,##0")&"일 남음")&" · 이날이 토요일 · 공휴일이면 그다음 날(민법 제161조)"),""))',
                 align="left", size=8.5, bold=True))], h=40)
    sg, bj = "{신고서!신고일}", "{변경일}"
    p.row([(3, "신고일 확인", L),
           (9, F("신고확인", f'=IF({{종류}}="{GJ[0]}",IF(AND(N({sg})=0,N({ck})=0),"",IF(OR(N({sg})=0,N({ck})=0),"{GAP_NEED}",IF({ck}<{sg},"{GAP_LATE}",'
                 f'IF({ck}={sg},"{GAP_SAME}",IF({ck}-{sg}<=2,"{GAP_IN_A}"&({ck}-{sg})&"{GAP_IN_B}","{GAP_OK_A}"&({ck}-{sg})&"{GAP_OK_B}"))))),'
                 f'IF({{종류}}="{GJ[1]}",IF(AND(N({sg})=0,N({bj})=0),"",IF(OR(N({sg})=0,N({bj})=0),"{BG_NEED}",IF({sg}<{bj},"{BG_EARLY}",'
                 f'IF({sg}-{bj}>30,"{BG_LATE}",IF({sg}={bj},"{BG_OK0}","{BG_OK_A}"&({sg}-{bj})&"{BG_OK_B}"))))),""))', align="left", size=8.5))], h=40)
    p.row([(3, "처리 · 수리", L), (9, SURI, {"kind": "text", "size": 7.5})])

    g.sec(p, "㉰  도급형태 · 공사대금 지급보증 (신고서 «관계인» 칸 √)", need=26 * 6 + 10)
    p.row([(3, "도급형태", L), (4, I("도급형태", ex=_ex(ex, "도급형태"), dv=",".join(DH), align="center", size=8.5)),
           (5, "다른 업종 공사와 따로 도급했나(법 제21조제2항)", sz)], h=26)
    p.row([(3, "분리도급 예외 사유", L), (9, I("예외사유", ex=_ex(ex, "예외사유"), dv=",".join(YE), align="left", size=8))], h=26)
    p.row([(3, "분리도급 확인", L),
           (9, F("분리확인", f'=IF({{도급형태}}="","",IF({{도급형태}}="{DH[0]}","{BR_OK}",IF({{예외사유}}="","{BR_Q}","{BR_X}"&{{예외사유}})))',
                 align="left", size=8.5))], h=30)
    p.row([(3, "발주자 · 도급금액", L), (4, I("발주구분", ex=_ex(ex, "발주구분"), dv=",".join(BJ), align="center", size=8)),
           (5, I("도급금액", ex=_ex(ex, "도급금액"), fmt=MONEY, align="right"))], h=26)
    p.row([(3, "지급보증", L), (5, I("지급보증", ex=_ex(ex, "지급보증"), dv=",".join(JB), align="center", size=8)),
           (4, "신고서 «지급보증» 에 √", sz)], h=26)
    small_ = f'AND(N({{도급금액}})>0,{{도급금액}}<10000000)'
    short_ = f'IF(OR(N({{소방착공}})=0,N({{소방완공}})=0),FALSE,AND({{소방완공}}>={{소방착공}},{{소방완공}}<={END3}))'
    p.row([(3, "지급보증 확인", L),
           (9, F("보증확인", f'=IF({small_},"{BO_SM}",IF({short_},"{BO_SH_A}"&' + _ymdf(END3) + f'&"{BO_SH_B}",'
                 f'IF({{발주구분}}="{BJ[1]}","{BO_PUB}",IF({{발주구분}}="{BJ[0]}","{BO_PRI}",""))))', align="left", size=8))], h=40)

    g.sec(p, "㉱  도급구분 · 하도급 · 붙일 서류 (규칙 제12조제1항 · 제3항)", need=26 * 4 + 10)
    p.row([(3, "도급구분", L), (3, I("도급구분", ex=_ex(ex, "도급구분"), dv=",".join(DG), align="center", size=8.5)),
           (2, "하도급", L), (4, I("하도급", ex=_ex(ex, "하도급"), dv=",".join(HD), align="center", size=8))], h=26)
    p.row([(3, "붙일 서류", L),
           (9, F("첨부", f'=IF({{종류}}="{GJ[0]}","{AT_C1}"&IF(OR({{공사종류}}="{GS[2]}",{{공사종류}}="{GS[3]}",{{공사종류}}="{GS[4]}"),"{AT_C4A}","{AT_C4B}")'
                 f'&IF({HAS_HD},"{AT_C5}",""),IF({{종류}}="{GJ[1]}",IF({CNT_Y}=0,"","{AT_B0}"&MID(IF({{{BK[0]}}}="{BB[0]}","{AT_BS}","")'
                 f'&IF({{{BK[1]}}}="{BB[0]}","{AT_BF}","")&IF({{{BK[2]}}}="{BB[0]}","{AT_BG}",""),4,300)),""))', align="left", size=8))], h=66)
    p.row([(3, "", L), (9, GONGDONG, {"kind": "text", "size": 7})])

    g.sec(p, "㉲  아직 안 적은 칸 · 신고하지 않으면", need=26 * 3 + 10)
    BIN = [("대상물 상호(명칭)", '{신고서!대상명칭}=""'), ("대상물 소재지", '{신고서!대상소재지}=""'), ("관계인 성명", '{신고서!관계인}=""'),
           ("도급금액", 'N({도급금액})=0'), ("공사업자 상호", '{신고서!상호}=""'), ("등록번호", '{신고서!등록번호}=""'), ("대표자", '{신고서!대표자}=""'),
           ("착공일", 'N({소방착공})=0'), ("완공예정일", 'N({소방완공})=0'), ("공사종류", '{공사종류}=""'), ("시공 소방시설", '{신고서!시공소방시설}=""'),
           ("소방기술자 성명", '{신고서!기술자성명}=""'), ("도급형태", '{도급형태}=""'), ("지급보증", '{지급보증}=""'), ("도급구분", '{도급구분}=""'),
           ("변경 후 상호", f'AND({{종류}}="{GJ[1]}",{{{BK[0]}}}="{BB[0]}",{{신고서!후상호}}="")'),
           ("변경 후 소방시설 종류", f'AND({{종류}}="{GJ[1]}",{{{BK[1]}}}="{BB[0]}",{{신고서!후종류}}="")'),
           ("변경 후 소방기술자 성명", f'AND({{종류}}="{GJ[1]}",{{{BK[2]}}}="{BB[0]}",{{신고서!후기술자}}="")')]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF({종류}="","",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))', align="left", size=8.5))], h=52)
    p.row([(3, "신고하지 않으면", L), (9, CHEOBUN, {"kind": "text", "size": 8})])
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 신고서 아래 «년 월 일»(신고일)을 적으면 착공일 · 변경 기한과 견줍니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호 — 9층 업무시설에 스프링클러설비 등을 새로 설치하는 경우)."])
    return p


# ── 신고서 (별지 제14호서식 앞쪽) ─────────────────────────────────────
W2 = [15.6] + [75.6 / 23] * 23      # 원문 왼칸(특정소방대상물 · 관계인 …) 17% + 잔칸 23
PC2 = len(W2)


def singo(bk, ex):
    p = g.pg(bk, ex, "신고서", fit=1, widths=W2)
    lab = {"kind": "label", "size": 9}
    l7 = {"kind": "label", "size": 7.5}
    gray = {"kind": "label", "size": 7.5, "align": "left"}
    tel = {"kind": "free", "size": 7.5, "align": "right"}
    clo = {"kind": "free", "size": 8}
    p.row([(16, "■ 소방시설공사업법 시행규칙 [별지 제14호서식] <개정 2026. 10. 20.>", {"kind": "note", "size": 7.5}), (8, "", FR)], h=16)
    p.title("소방시설공사 착공(변경)신고서", h=34)
    p.row([(20, "※ [   ]에는 해당되는 곳에 √표를 합니다.", {"kind": "free", "size": 7.5}),
           (4, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=15)
    p.row([(6, "접수번호", gray), (9, "접수일", gray), (9, "처리기간      2일", gray)], h=22)
    p.gap(3)
    # 특정소방대상물
    p.row([(1, "특정소방\n대 상 물", dict(lab, rs=5)), (3, "상호(명칭)", l7), (12, I("대상명칭", ex=_es(ex, "대상명칭"), size=9)),
           (3, "용도 구분", l7), (5, I("용도", ex=_es(ex, "용도"), align="center", size=8.5))], h=26)
    _close(p, p.row([(3, "소재지", l7), (12, I("대상소재지", ex=_es(ex, "대상소재지"), size=9)), (3, "(전화번호:", tel),
           (4, I("대상전화", ex=_es(ex, "대상전화"), align="center", size=8)), (1, ")", clo)], h=26))
    _close(p, p.row([(3, "구조", l7), (1, "지하", {"kind": "free", "size": 8.5, "align": "right"}),
           (2, I("지하", ex=_es(ex, "지하"), fmt='0;;""', align="center", size=9)), (2, "층,   지상", {"kind": "free", "size": 8.5}),
           (2, I("지상", ex=_es(ex, "지상"), fmt='0;;""', align="center", size=9)), (1, "층,", {"kind": "free", "size": 8.5}),
           (2, I("동수", ex=_es(ex, "동수"), fmt='0;;""', align="center", size=9)), (2, "개동", {"kind": "free", "size": 8.5}), (8, "", FR)], h=26))
    p.row([(3, "대지면적", l7), (3, I("대지면적", ex=_es(ex, "대지면적"), fmt=AREA, blank="㎡,", align="right", size=8)),
           (2, "연면적", l7), (3, I("연면적", ex=_es(ex, "연면적"), fmt=AREA, blank="㎡,", align="right", size=8)),
           (3, "바닥면적", l7), (3, I("바닥면적", ex=_es(ex, "바닥면적"), fmt=AREA, blank="㎡,", align="right", size=8)),
           (3, "건축면적", l7), (3, I("건축면적", ex=_es(ex, "건축면적"), fmt=AREA, blank="㎡", align="right", size=8))], h=26)
    p.row([(3, "전체 소방시설", l7), (20, I("전체소방시설", ex=_es(ex, "전체소방시설"), size=8))], h=30)
    p.gap(3)
    # 관계인
    _close(p, p.row([(1, "관 계 인", dict(lab, rs=4)), (3, "성명(기관\n또는 법인명)", dict(l7, size=7)), (15, I("관계인", ex=_es(ex, "관계인"), size=9)),
           (5, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "center"})], h=28))
    _close(p, p.row([(3, "주소", l7), (12, I("관계인주소", ex=_es(ex, "관계인주소"), size=9)), (3, "(전화번호:", tel),
           (4, I("관계인전화", ex=_es(ex, "관계인전화"), align="center", size=8)), (1, ")", clo)], h=26))
    p.row([(3, "도급금액", l7),
           (5, F("도급금액표시", '=IF(N({셈!도급금액})=0,"",{셈!도급금액})', fmt=MONEY, align="right", size=8.5)),
           (4, "도급형태", l7), (11, F("도급형태표시", _box_f("{셈!도급형태}", O_DH), align="center", size=8.5))], h=26)
    p.row([(3, "지급보증", l7), (20, F("지급보증표시", _box_f("{셈!지급보증}", O_JB, sep="  "), align="center", size=7.2))], h=26)
    p.gap(3)
    # 소방시설공사업자
    p.row([(1, "소방시설\n공사업자", dict(lab, rs=5)), (3, "상호(명칭)", l7), (5, I("상호", ex=_es(ex, "상호"), align="center", size=8.5)),
           (3, "등록번호", l7), (4, I("등록번호", ex=_es(ex, "등록번호"), align="center", size=8.5)),
           (2, "대표자", l7), (6, I("대표자", ex=_es(ex, "대표자"), align="center", size=9))], h=26)
    _close(p, p.row([(3, "소재지", l7), (12, I("업자소재지", ex=_es(ex, "업자소재지"), size=9)), (3, "(전화번호:", tel),
           (4, I("전화번호", ex=_es(ex, "전화번호"), align="center", size=8)), (1, ")", clo)], h=26))
    p.row([(3, "도급구분", l7), (7, F("도급구분표시", _box_f("{셈!도급구분}", O_DG, sep="  "), align="center", size=8)),
           (2, "착공일", l7), (4, F("착공일표시", '=IF(N({셈!소방착공})=0,"",{셈!소방착공})', fmt=DT, align="center", size=8)),
           (3, "완공예정일", l7), (4, F("완공일표시", '=IF(N({셈!소방완공})=0,"",{셈!소방완공})', fmt=DT, align="center", size=8))], h=26)
    p.row([(3, "공사종류", l7), (20, F("공사종류표시", _box_f("{셈!공사종류}", O_GS, sep="  "), align="center", size=8))], h=26)
    p.row([(3, "시공 소방시설", l7), (20, I("시공소방시설", ex=_es(ex, "시공소방시설"), size=8))], h=30)
    p.gap(3)
    # 책임시공 및 기술관리 소방기술자
    p.row([(1, "책임시공 및 기술\n관리 소방기술자", dict(lab, size=7.5)), (2, "성명", l7), (5, I("기술자성명", ex=_es(ex, "기술자성명"), align="center", size=9)),
           (3, "수첩번호", l7), (5, I("수첩번호", ex=_es(ex, "수첩번호"), align="center", size=8.5)),
           (3, "분야/등급", l7), (5, I("분야등급", ex=_es(ex, "분야등급"), align="center", size=8))], h=28)
    p.gap(3)
    # 변경내용
    hd = dict(H, size=8.5)
    p.row([(1, "변경내용", lab), (3, "구분", hd), (10, "변경 전", hd), (10, "변경 후", hd)], h=22)
    p.row([(1, F("변경시공자표시", f'="시공자"&IF({{셈!{BK[0]}}}="{BB[0]}","[√]","[   ]")', align="center", size=9), dict(lab, rs=6)),
           (3, "상호", l7), (10, I("전상호", ex=_es(ex, "전상호"), align="center", size=8.5)), (10, I("후상호", ex=_es(ex, "후상호"), align="center", size=8.5))], h=22)
    p.row([(3, "등록번호", l7), (10, I("전등록번호", ex=_es(ex, "전등록번호"), align="center", size=8.5)),
           (10, I("후등록번호", ex=_es(ex, "후등록번호"), align="center", size=8.5))], h=22)
    p.row([(3, "대표자", l7), (10, I("전대표자", ex=_es(ex, "전대표자"), align="center", size=8.5)),
           (10, I("후대표자", ex=_es(ex, "후대표자"), align="center", size=8.5))], h=22)
    p.row([(3, "소재지", dict(l7, rs=2)), (10, I("전소재지", ex=_es(ex, "전소재지"), size=8)), (10, I("후소재지", ex=_es(ex, "후소재지"), size=8))], h=20)
    _close(p, p.row([(4, "(전화번호:", dict(tel, size=7)), (5, I("전전화", ex=_es(ex, "전전화"), align="center", size=7.5)), (1, ")", dict(clo, size=7.5)),
           (4, "(전화번호:", dict(tel, size=7)), (5, I("후전화", ex=_es(ex, "후전화"), align="center", size=7.5)), (1, ")", dict(clo, size=7.5))], h=18))
    p.row([(3, "정산금액", l7), (10, I("정산금액", ex=_es(ex, "정산금액"), fmt=MONEY, blank="원", align="right", size=8.5)),
           (3, "도급금액", l7), (7, I("후도급금액", ex=_es(ex, "후도급금액"), fmt=MONEY, blank="원", align="right", size=8.5))], h=22)
    p.row([(1, F("변경소방시설표시", f'="설치되는"&CHAR(10)&"소방시설"&IF({{셈!{BK[1]}}}="{BB[0]}","[√]","[   ]")', align="center", size=8.5), lab),
           (3, "종류", l7), (10, I("전종류", ex=_es(ex, "전종류"), size=8)), (10, I("후종류", ex=_es(ex, "후종류"), size=8))], h=32)
    _close(p, p.row([(1, F("변경기술자표시", f'="책임시공 및"&CHAR(10)&"기술관리"&CHAR(10)&"소방기술자"&IF({{셈!{BK[2]}}}="{BB[0]}","[√]","[   ]")',
                 align="center", size=8.5), dict(lab, rs=3)),
           (3, "성명", l7), (3, I("전기술자", ex=_es(ex, "전기술자"), align="center", size=8.5)), (3, "(수첩번호:", dict(tel, size=6.5)),
           (3, I("전수첩", ex=_es(ex, "전수첩"), align="center", size=7)), (1, ")", dict(clo, size=7)),
           (3, I("후기술자", ex=_es(ex, "후기술자"), align="center", size=8.5)), (3, "(수첩번호:", dict(tel, size=6.5)),
           (3, I("후수첩", ex=_es(ex, "후수첩"), align="center", size=7)), (1, ")", dict(clo, size=7))], h=24))
    p.row([(3, "분야/등급", l7), (10, I("전분야", ex=_es(ex, "전분야"), align="center", size=8.5)),
           (10, I("후분야", ex=_es(ex, "후분야"), align="center", size=8.5))], h=22)
    p.row([(3, "배치기간", l7), (4, I("전배치시작", ex=_es(ex, "전배치시작"), fmt=DT, align="center", size=7.5)), (2, "∼", {"kind": "ctext", "size": 8}),
           (4, I("전배치끝", ex=_es(ex, "전배치끝"), fmt=DT, align="center", size=7.5)),
           (4, I("후배치시작", ex=_es(ex, "후배치시작"), fmt=DT, align="center", size=7.5)), (2, "∼", {"kind": "ctext", "size": 8}),
           (4, I("후배치끝", ex=_es(ex, "후배치끝"), fmt=DT, align="center", size=7.5))], h=24)
    p.gap(8)
    p.row([(PC2, "「소방시설공사업법」 제13조 및 같은 법 시행규칙 제12조에 따라 소방시설공사 착공(변경) 내용을 신고합니다.",
            {"kind": "free", "size": 9.5})], h=30)
    p.row([(PC2, I("신고일", ex=_es(ex, "신고일"), blank="년          월          일", fmt="date", align="right"), {"border": False, "indent": 2})], h=22)
    p.row([(9, "", FR), (3, "신고인", {"kind": "free", "align": "center", "size": 9.5}),
           (8, F("신고인표시", '=IF(AND({대표자}="",{상호}=""),"",IF({대표자}="",{상호},IF({상호}="","대표 "&{대표자},{상호}&" 대표 "&{대표자})))', align="center", size=8.5), {"border": False}),
           (4, "(서명 또는 인)", {"kind": "free", "align": "center", "size": 7.5})], h=24)
    p.row([(PC2, I("수신", ex=_es(ex, "수신"), blank=SUSIN, size=12, bold=True, align="left"), {"border": False, "indent": 1})], h=28)
    p.row([(PC2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["도급금액 · 도급형태 · 지급보증 · 도급구분 · 착공일 · 완공예정일 · 공사종류 · 변경내용 √ 는 ① 장에서 저절로 들어옵니다. 신고인 칸에는 "
                  "공사업자 상호 · 대표자가 들어갑니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호)."])
    return p


# ── 뒤쪽 (작성방법 · 첨부서류 · 처분기준 · 처리절차 원문 그대로) ─────────────
W3 = W2
PC3 = len(W3)


def dwi(bk, ex):
    p = g.pg(bk, ex, "뒤쪽", fit=1, widths=W3)
    p.row([(PC3, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=15)
    p.gap(10)
    p.row([(PC3, "작성방법", dict(H, size=9.5))], h=22)
    n = text_lines(HOWTO, sum(W3) * 10.0 / 8)
    p.row([(PC3, HOWTO, {"kind": "text", "size": 8, "valign": "center"})], h=n * 8 * 1.5 + 12)
    p.gap(10)
    n = text_lines(ATTACH, sum(W3[2:19]) * 10.0 / 7.6)
    p.row([(2, "첨부서류", {"kind": "label", "size": 8.5}), (17, ATTACH, {"kind": "text", "size": 7.6, "valign": "center"}),
           (5, "수수료\n없 음", {"kind": "ctext", "size": 8.5})], h=n * 7.6 * 1.42 + 12)
    p.gap(10)
    p.row([(PC3, "처분기준", dict(H, size=9.5))], h=22)
    n = text_lines(CHEOBUN_WON, sum(W3) * 10.0 / 8)
    p.row([(PC3, CHEOBUN_WON, {"kind": "text", "size": 8, "valign": "center"})], h=n * 8 * 1.5 + 12)
    p.gap(10)
    p.row([(PC3, "처리절차", dict(H, size=9.5))], h=22)
    p.row([(2, "신고인", {"kind": "ctext", "size": 8.5}), (22, "소방본부장 또는 소방서장", {"kind": "ctext", "size": 8.5})], h=24)
    box = {"kind": "ctext", "size": 8.5}
    arr = {"kind": "cfree", "size": 8}
    cells = [(2, "신고", box)]
    for i, s in enumerate(STEP):
        cells.append((1, "▶", arr))
        cells.append((6 if i == len(STEP) - 1 else 4, s, box))
    p.row(cells, h=36)
    p.gap(4)
    p.row([(PC3, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["아래 글은 원문 그대로입니다(2026. 10. 20. 개정 서식 — 처분기준의 «제9조제12호» 도 서식에 적힌 대로이고, ① 장은 법 제9조제1항제12호로 적습니다)."]
                 if not ex else ["이 시트는 작성 예시입니다(뒤쪽은 원문 글만 — 적을 칸 없음)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    singo(bk, ex)
    dwi(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _isnum(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _isdate(v):
    return isinstance(v, (datetime.date, datetime.datetime))


def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _end3(s):
    """착공일부터 3개월 — 민법 제160조 ② 같은 날짜 전날 · ③ 그 달에 그날이 없으면 그 달 끝날"""
    y, m = s.year + (s.month + 2) // 12, (s.month + 2) % 12 + 1
    import calendar
    last = calendar.monthrange(y, m)[1]
    if s.day > last:
        return datetime.date(y, m, last)
    return datetime.date(y, m, s.day) - datetime.timedelta(days=1)


def expect(pages):
    sm, sg = pages["셈"], pages["신고서"]
    a, b = {}, {}
    gj, js, gs = sm.get("종류"), sm.get("장소"), sm.get("공사종류")
    if js in (JS[1], JS[2]):
        a["대상"] = DS_X
    elif not gs:
        a["대상"] = ""
    else:
        a["대상"] = DS_1 if gs == GS[0] else DS_2 if gs == GS[1] else DS_4 if gs == GS[5] else DS_3
    ny = sum(1 for k in BK if sm.get(k) == BB[0])
    nn = sum(1 for k in BK if sm.get(k) == BB[1])
    if not gj:
        a["판정"] = ""
    elif gj == GJ[0]:
        a["판정"] = PJ_C
    else:
        a["판정"] = PJ_B if ny > 0 else PJ_N if nn == 3 else PJ_Q
    s, e = _d(sm.get("소방착공")), _d(sm.get("소방완공"))
    a["공사일수"] = "" if not (s and e) else (e - s).days + 1
    if not s:
        a["기간확인"] = ""
    elif not e:
        a["기간확인"] = "⚠ 완공예정일을 적습니다"
    elif e < s:
        a["기간확인"] = "⚠ 완공예정일이 착공일보다 빠릅니다"
    else:
        a["기간확인"] = "✓ 날 수는 첫날 · 끝날 포함 · 신고서 «착공일 · 완공예정일» 에 들어감"
    today = datetime.date.today()
    bj = _d(sm.get("변경일"))
    if gj == GJ[0]:
        if not s:
            a["기한"] = ""
        else:
            tail = ("⚠ 착공일이 지났습니다" if s < today else "⚠ 오늘이 착공일입니다" if s == today else f"오늘부터 착공일까지 {(s - today).days:,}일")
            a["기한"] = f"착공 전까지 — 착공일 {_ymd(s)}({YOIL[(s.weekday() + 1) % 7]}) · {tail}"
    elif gj == GJ[1]:
        if not bj:
            a["기한"] = ""
        else:
            dd = bj + datetime.timedelta(days=30)
            tail = "⚠ 지났습니다" if dd < today else f"오늘부터 {(dd - today).days:,}일 남음"
            a["기한"] = f"{_ymd(dd)}({YOIL[(dd.weekday() + 1) % 7]})까지 — 변경일부터 30일 · {tail} · 이날이 토요일 · 공휴일이면 그다음 날(민법 제161조)"
    else:
        a["기한"] = ""
    sd = _d(sg.get("신고일"))
    if gj == GJ[0]:
        if not sd and not s:
            a["신고확인"] = ""
        elif not sd or not s:
            a["신고확인"] = GAP_NEED
        elif s < sd:
            a["신고확인"] = GAP_LATE
        elif s == sd:
            a["신고확인"] = GAP_SAME
        elif (s - sd).days <= 2:
            a["신고확인"] = GAP_IN_A + str((s - sd).days) + GAP_IN_B
        else:
            a["신고확인"] = GAP_OK_A + str((s - sd).days) + GAP_OK_B
    elif gj == GJ[1]:
        if not sd and not bj:
            a["신고확인"] = ""
        elif not sd or not bj:
            a["신고확인"] = BG_NEED
        elif sd < bj:
            a["신고확인"] = BG_EARLY
        elif (sd - bj).days > 30:
            a["신고확인"] = BG_LATE
        elif sd == bj:
            a["신고확인"] = BG_OK0
        else:
            a["신고확인"] = BG_OK_A + str((sd - bj).days) + BG_OK_B
    else:
        a["신고확인"] = ""
    dh, ye = sm.get("도급형태"), sm.get("예외사유")
    a["분리확인"] = "" if not dh else (BR_OK if dh == DH[0] else (BR_Q if not ye else BR_X + ye))
    amt = sm.get("도급금액")
    small = _isnum(amt) and 0 < amt < 10000000
    short = bool(s and e and s <= e <= _end3(s))
    bjg = sm.get("발주구분")
    if small:
        a["보증확인"] = BO_SM
    elif short:
        a["보증확인"] = BO_SH_A + _ymd(_end3(s)) + BO_SH_B
    elif bjg == BJ[1]:
        a["보증확인"] = BO_PUB
    elif bjg == BJ[0]:
        a["보증확인"] = BO_PRI
    else:
        a["보증확인"] = ""
    hd = sm.get("도급구분") == DG[1] or sm.get("하도급") == HD[1]
    if gj == GJ[0]:
        a["첨부"] = AT_C1 + (AT_C4A if gs in (GS[2], GS[3], GS[4]) else AT_C4B) + (AT_C5 if hd else "")
    elif gj == GJ[1]:
        parts = (AT_BS if sm.get(BK[0]) == BB[0] else "") + (AT_BF if sm.get(BK[1]) == BB[0] else "") + (AT_BG if sm.get(BK[2]) == BB[0] else "")
        a["첨부"] = "" if ny == 0 else AT_B0 + parts[3:3 + 300]
    else:
        a["첨부"] = ""
    if not gj:
        a["빈칸"] = ""
    else:
        chg = gj == GJ[1]
        miss = [n for n, ok in (("대상물 상호(명칭)", not sg.get("대상명칭")), ("대상물 소재지", not sg.get("대상소재지")), ("관계인 성명", not sg.get("관계인")),
                                ("도급금액", not (_isnum(amt) and amt != 0)), ("공사업자 상호", not sg.get("상호")), ("등록번호", not sg.get("등록번호")),
                                ("대표자", not sg.get("대표자")), ("착공일", not s), ("완공예정일", not e), ("공사종류", not gs),
                                ("시공 소방시설", not sg.get("시공소방시설")), ("소방기술자 성명", not sg.get("기술자성명")), ("도급형태", not dh),
                                ("지급보증", not sm.get("지급보증")), ("도급구분", not sm.get("도급구분")),
                                ("변경 후 상호", chg and sm.get(BK[0]) == BB[0] and not sg.get("후상호")),
                                ("변경 후 소방시설 종류", chg and sm.get(BK[1]) == BB[0] and not sg.get("후종류")),
                                ("변경 후 소방기술자 성명", chg and sm.get(BK[2]) == BB[0] and not sg.get("후기술자"))) if ok]
        a["빈칸"] = BIN_OK if not miss else BIN_A + (" · ".join(miss))[:300]
    # 신고서
    b["도급금액표시"] = amt if (_isnum(amt) and amt != 0) else ""
    b["도급형태표시"] = _box(dh, O_DH)
    b["지급보증표시"] = _box(sm.get("지급보증"), O_JB, sep="  ")
    b["도급구분표시"] = _box(sm.get("도급구분"), O_DG, sep="  ")
    b["착공일표시"] = s if s else ""
    b["완공일표시"] = e if e else ""
    b["공사종류표시"] = _box(gs, O_GS, sep="  ")
    b["변경시공자표시"] = "시공자" + ("[√]" if sm.get(BK[0]) == BB[0] else "[   ]")
    b["변경소방시설표시"] = "설치되는\n소방시설" + ("[√]" if sm.get(BK[1]) == BB[0] else "[   ]")
    b["변경기술자표시"] = "책임시공 및\n기술관리\n소방기술자" + ("[√]" if sm.get(BK[2]) == BB[0] else "[   ]")
    sang, dae = sg.get("상호") or "", sg.get("대표자") or ""
    b["신고인표시"] = sang if not dae else ("대표 " + dae if not sang else sang + " 대표 " + dae)
    return {"셈": a, "신고서": b, "뒤쪽": {}}


# 엑셀 수식 안 글(따옴표 안)은 255자까지 — 넘으면 엑셀이 파일을 못 엶
for _t in (DS_X, DS_1, DS_2, DS_3, DS_4, PJ_C, PJ_B, PJ_N, PJ_Q, GAP_NEED, GAP_LATE, GAP_SAME, GAP_IN_A, GAP_IN_B, GAP_OK_A, GAP_OK_B,
           BG_NEED, BG_EARLY, BG_LATE, BG_OK0, BG_OK_A, BG_OK_B, BR_OK, BR_Q, BR_X, BO_SM, BO_SH_A, BO_SH_B, BO_PUB, BO_PRI,
           AT_C1, AT_C4A, AT_C4B, AT_C5, AT_B0, AT_BS, AT_BF, AT_BG, BIN_OK, BIN_A, *GJ, *JS, *GS, *BB, *DH, *YE, *BJ, *JB, *DG, *HD):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _dv in (GJ, JS, GS, BB, DH, YE, BJ, JB, DG, HD):
    assert len(",".join(_dv)) < 255 and not any("," in x for x in _dv), _dv[0]
