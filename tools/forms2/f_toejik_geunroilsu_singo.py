# -*- coding: utf-8 -*-
"""피공제자별 근로일수 및 공제부금 납부 신고서(건설근로자 퇴직공제) — 새로 만든 서식 (2026-11-16 G705 · 소장님 「오늘 중으로 다 만들자. 서식」 — 101종 첫 묶음)
   → ① 신고하는 달 · 기한(다음 달 15일 · 규칙 제15조제3항 — 토 · 일요일이면 월요일) · 신고일 확인 · 1일 공제부금(영 제12조제2항 —
     2026. 4. 1. 이후 처음 입찰공고한 공사 8,700원 · 그 전 6,500원 · 직접 적기) · ① 대상 피공제자 수 · ② 근로일수 누계 · ③ 공제부금의 금액(② × 일액) ·
     줄 확인(근로일수 없음 · 그 달 날수 넘음 · 성명 없음 · 등록번호 13자리 · 여권번호) · 근로일수 산정기준(규칙 제15조제5항) · 서류 · 전자카드 · 정정 · 과태료 · 빈칸
   · 신고서(건설근로자법 시행규칙 [별지 제14호서식] <개정 2020. 11. 26.> 앞쪽 · 뒤쪽 칸 차례 그대로 — 가로) + 별지(신고 대상이 많으면 — 뒤쪽 ※ · 20줄).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).

근거(국가법령정보센터 · 고용노동부 · 2026-11-16 · 메모 /home/claude/g10/notes/G705_근로일수신고_근거.md · 원문 글층 G705_근로일수신고_원문.txt):
  · 건설근로자의 고용개선 등에 관한 법률 제13조(근로일수 신고 및 공제부금의 납부) ① · ② · ④ · 제26조제2항제6호 · 제7호(300만원 이하 과태료)
  · 시행령 [시행 2025. 10. 1.] 제12조(공제부금) ① 납부 금액 명시 · 증명 서류 ② 1일 5천원 이상 1만원 이하 — 공제회가 장관 승인으로 정함
  · 시행규칙 [시행 2024. 8. 28.] 제15조 ③ 별지 제14호서식 · 다음 달 15일까지 ④ 전자카드 시스템 ⑤ 근로일수 산정기준 ⑥ 정정신고(별지 제15호서식)
  · 고용노동부 보도자료 2026. 3. 30. — 퇴직공제부금 일액 6,500원 → 8,700원(퇴직공제금 8,200 + 부가금 500) · 2026. 4. 1. 이후 최초로 입찰공고를 하는 건설공사부터
■ 짐작 안 함: 일액은 입찰공고일로만 고름(그 밖은 «직접 적기») · 입찰공고 없이 계약한 공사는 «공제회에 확인» 글로만 · 기한 공휴일은 글로만 ·
  근로연월은 신고하는 달로 채움(«(년 월분)» 서식 — 그 달 근로일수를 적는 신고서)."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import FR, H, L

SLUG = "toejik-geunroilsu-singo"
TITLE = "피공제자별 근로일수 및 공제부금 납부 신고서(퇴직공제)"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "피공제자별 근로일수 및 공제부금 납부 신고서(건설근로자법 시행규칙 별지 제14호서식) — 빈 서식 앞쪽 (원문 칸 차례 그대로 · 가로)"),
        (6, "근로일수 신고서 — 작성 예시 앞쪽 (① ② ③ · 근로연월 · «년 월분» 이 ① 장에서 저절로)"),
        (5, "① 신고하는 달 · 기한 · 1일 공제부금 · 합계 — 작성 예시 (가상의 체육관 신축 · 2027년 3월분 · 8,700원)")]
MULTI = True
SHORT = ("피공제자별 근로일수 및 공제부금 납부 신고서(건설근로자법 시행규칙 별지 제14호서식) — 신고하는 달을 고르면 기한(다음 달 15일)이, 입찰공고일을 적으면 "
         "1일 공제부금(2026. 4. 1. 이후 입찰공고 8,700원 · 그 전 6,500원)이 나오고, 근로자별 근로일수를 적으면 대상 피공제자 수 · 근로일수 누계 · "
         "공제부금의 금액이 신고서에 저절로 들어갑니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
YOIL = "일월화수목금토"
N1, N2 = 3, 20                       # 앞쪽 3줄(원문) · 별지 20줄
NT = N1 + N2
NEW_DAY = D(2026, 4, 1)              # 이날 이후 처음 입찰공고한 공사부터 8,700원(고용노동부 2026. 3. 30.)
NEW_AMT, OLD_AMT = 8700, 6500

# 판정 · 안내 글(셈 · 파이썬 같은 글)
GH_TAIL = "까지 — 다음 달 15일(규칙 제15조제3항) · 토 · 일요일이면 월요일 · 공휴일이면 그다음 날"
SN_NEED = "⚠ 신고서 아래 «년 월 일»(신고일)을 적으면 기한과 견줍니다"
SN_LATE = "⚠ 신고일이 기한을 넘깁니다 — 근로일수를 매월 신고하지 않으면 300만원 이하의 과태료(법 제26조제2항제6호)"
SN_EARLY = "※ 신고일이 신고하는 달의 마지막 날보다 빠릅니다 — 그 달 근로일수를 다 적었는지 확인"
SN_OK = "✓ 기한 안에 냄"
IL_ME = "✓ 직접 적은 1일 공제부금 — 공제회가 알려 준 금액"
IL_NEED = "⚠ 입찰공고일을 적거나 1일 공제부금을 직접 적으면 ③ 공제부금의 금액을 셉니다"
IL_NEW = "8,700원(퇴직공제금 8,200원 + 부가금 500원) — 2026. 4. 1. 이후 처음 입찰공고를 한 공사(고용노동부 2026. 3. 30.)"
IL_OLD = "6,500원(퇴직공제금 6,200원 + 부가금 300원) — 2026. 3. 31. 이전에 입찰공고를 한 공사"
CK_OK_A, CK_OK_B, CK_OK_C = "✓ 피공제자 ", "명 · 근로일수 누계 ", "일 — 줄마다 칸 이상 없음"
CK_A = "⚠ 확인할 줄:"
CK = [" · 근로일수 빈칸 ", " · 그 달 날수보다 많은 근로일수 ", " · 성명 빈칸(근로일수만 있음) ", " · 등록번호 13자리 아님 ", " · 여권번호 빈칸(국적만 있음) "]
BIN_OK = "✓ 신고서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
SANJEONG = ("근로일수 산정기준(규칙 제15조제5항) — 1. 1일에 소정근로시간을 근로했으면 1일 · 소정근로시간보다 적게 일한 날은 근로시간을 합산하여 "
            "1일 소정근로시간에 달하면 1일 · 2. 고용기간 중 실제로 근로한 날을 근로일수로 하되, 약정한 유급휴일이 있으면 그 약정에 따름")
ILAEK = ("※ 공제부금은 1일 5천원 이상 1만원 이하에서 공제회가 고용노동부장관의 승인을 받아 정함(영 제12조제2항) · 2026. 4. 1. 이후 처음 입찰공고를 한 "
         "건설공사부터 8,700원(고용노동부 2026. 3. 30. 보도자료) · 입찰공고 없이 계약한 공사는 적용 금액을 공제회에 확인")
SEORYU = "납부한 공제부금의 금액과 공제부금을 냈다는 것을 증명하는 서류(전자문서 포함 — 규칙 제15조제3항 · 영 제12조제1항)"
JEONJA = ("전자카드를 발급해야 하는 사업주(법 제13조제4항)는 전자카드로 근로일수를 확인할 수 있는 공제회 시스템으로 신고할 수 있음(규칙 제15조제4항) · "
          "신고 사항이 잘못되었으면 지체 없이 정정신고서(별지 제15호서식)를 냄(제6항)")
GWATAE = "근로일수를 매월 신고하지 않거나 공제부금을 내지 않으면 300만원 이하의 과태료(법 제26조제2항제6호 · 제7호)"

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"신고년": 2027, "신고월": 3, "입찰공고일": D(2026, 6, 10), "일액": None}
EX_S = {"공제가입번호": "0000-000000", "상호": "가나건설(주)", "현장명": "가나시 다목적체육관 신축공사", "공정률": 42.5,
        "현장소재지": "가나시 다라구 마바동 123-4", "전화번호": "000-0000-0000", "납부일": D(2027, 4, 12), "금융기관": "가나은행 마바지점",
        "신고일": D(2027, 4, 13), "대표자": "김철수"}
# 성명 · 등록번호 · 근로일수 · 주소 · 전화 · 직종 · 국적 · 여권번호
EX_W = [("김민수", "000000-0000000", 18, "가나시 마바구 사아로 1", "010-0000-0000", "형틀목공", None, None),
        ("이영호", "000000-0000000", 14, "가나시 바사구 아자로 2", "010-0000-0000", "철근공", None, None),
        ("박지훈", "000000-0000000", 20, "가나시 다라구 차카로 3", "010-0000-0000", "콘크리트공", None, None),
        ("최성민", "000000-0000000", 9, "가나시 마바구 타파로 4", "010-0000-0000", "보통인부", None, None),
        ("NGUYEN VAN AN", "000000-0000000", 22, "가나시 다라구 하가로 5", "010-0000-0000", "보통인부", "베트남", "C0000000"),
        ("정민재", "000000-0000000", 16, "가나시 바사구 나다로 6", "010-0000-0000", "전기공", None, None),
        ("한상훈", "000000-0000000", 11, "가나시 마바구 라마로 7", "010-0000-0000", "배관공", None, None)]

STATEMENT = ("「건설근로자의 고용개선 등에 관한 법률」 제13조제1항, 같은 법 시행령 제12조제1항 및 같은 법 시행규칙 제15조제3항ㆍ제4항에 따라 "
             "피공제자별 근로일수 및 공제부금 납부신고서를 제출합니다.")
HOWTO = ["① 해당 월의 총 피공제자(건설근로자) 수를 적습니다.", "② 해당 월의 모든 피공제자의 근로일수의 합을 적습니다.",
         "③ ②근로일수 누계 × 1일의 공제부금 금액을 적습니다.", "④ 해당 월 공제부금을 납부한 날짜와 납부한 금융기관(지점)명을 적습니다.",
         "⑤ 피공제자의 주민등록번호(외국인인 경우에는 외국인등록번호)를 적습니다.", "⑥ 근로한 근로연월을 적습니다(예: 2012년 1월인 경우 2012.01)",
         "⑦ 해당 월에 근로한 근로일수를 적습니다.", "※ 신고 대상 피공제자가 많은 경우에는 별지에 적습니다."]
PAPER = "297mm×210mm(백상지 80g/㎡)"

# 가로 서식 칸(원문 표 세 개의 칸 나눔을 모두 담음 — %)
PCT = [3.1, 6.0, 4.4, 10.5, 4.0, 8.8, 9.5, 2.9, 6.5, 7.7, 10.6, 1.9, 5.7, 4.0, 3.6, 10.8]
W1 = [x * 1.4 for x in PCT]
PC1 = len(W1)


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


def _ex(ex, k):
    return EX[k] if ex else None


def _es(ex, k):
    return EX_S[k] if ex else None


def _ew(ex, i, j):
    return EX_W[i - 1][j] if (ex and i <= len(EX_W)) else None


def _sh(i):
    return "신고서" if i <= N1 else "별지"


def _r(i, k):
    """셈에서 줄 칸 부르기 — {신고서!성명#1} · {별지!성명#4}"""
    return "{" + f"{_sh(i)}!{k}#{i}" + "}"


def _close(p, r):
    from openpyxl.styles import Border
    from fb import LINE
    for c in range(1, p.pc + 1):
        bd = p.ws.cell(row=r, column=c).border
        if any(getattr(bd, k) is not None and getattr(bd, k).style for k in ("left", "right", "top", "bottom")):
            continue
        p.ws.cell(row=r, column=c).border = Border(top=LINE, bottom=LINE, right=LINE if c == p.pc else None)


# 셈 조각
YM_OK = "AND(N({신고년})>0,N({신고월})>0)"
DUE0 = "DATE({신고년},{신고월}+1,15)"
DUE = f"{DUE0}+IF(WEEKDAY({DUE0})=7,2,IF(WEEKDAY({DUE0})=1,1,0))"
END = "DATE({신고년},{신고월}+1,0)"


def _rrn(i):
    s = f'SUBSTITUTE(SUBSTITUTE({_r(i, "주민")},"-","")," ","")'
    return f"AND(LEN({s})>0,LEN({s})<>13)"


CHK = [lambda i: f'AND(LEN({_r(i, "성명")})>0,N({_r(i, "일수")})=0)',
       lambda i: f'AND(N({{말일}})>0,N({_r(i, "일수")})>N({{말일}}))',
       lambda i: f'AND(LEN({_r(i, "성명")})=0,N({_r(i, "일수")})>0)',
       _rrn,
       lambda i: f'AND(LEN({_r(i, "국적")})>0,LEN({_r(i, "여권")})=0)']


def _cnt(fn):
    return "(" + "+".join(f"IF({fn(i)},1,0)" for i in range(1, NT + 1)) + ")"


# ── ① 신고하는 달 · 기한 · 일액 · 합계 ─────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  근로일수 신고 — 기한 · 1일 공제부금 · 합계 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 퇴직공제에 가입한 사업주는 피공제자의 근로일수를 매월 공제회에 신고하고 공제부금을 냅니다(건설근로자법 제13조제1항). "
              "신고서는 다음 달 15일까지 냅니다(시행규칙 제15조제3항). 여기서 고른 달과 1일 공제부금으로 신고서의 «년 월분» · 근로연월 · ① ② ③ 이 저절로 채워집니다.")
    sz = {"kind": "text", "size": 7.5}

    g.sec(p, "㉮  신고하는 달 · 기한 (규칙 제15조제3항)", need=26 * 4 + 10)
    p.row([(3, "신고하는 달", L), (2, I("신고년", ex=_ex(ex, "신고년"), fmt='0"년";;""', align="center")),
           (2, I("신고월", ex=_ex(ex, "신고월"), fmt='0"월";;""', dv="1,2,3,4,5,6,7,8,9,10,11,12", align="center")),
           (2, "이 달 날수", L), (3, F("말일", f'=IF({YM_OK},DAY({END}),"")', fmt='0"일";;""', align="center"))], h=26)
    p.row([(3, "신고 기한", L),
           (9, F("기한", f'=IF({YM_OK},' + _ymdf(DUE) + '&"("&' + _yo(DUE) + f'&")"&"{GH_TAIL}","")', align="left", size=8.5, bold=True))], h=30)
    sd = "{신고서!신고일}"
    p.row([(3, "신고일 확인", L),
           (9, F("신고확인", f'=IF(NOT({YM_OK}),"",IF(N({sd})=0,"{SN_NEED}",IF({sd}>{DUE},"{SN_LATE}",IF({sd}<{END},"{SN_EARLY}","{SN_OK}"))))',
                 align="left", size=8.5))], h=32)

    g.sec(p, "㉯  1일 공제부금 (영 제12조제2항 · 고용노동부 2026. 3. 30.)", need=26 * 4 + 10)
    p.row([(3, "입찰공고일", L), (3, I("입찰공고일", ex=_ex(ex, "입찰공고일"), fmt=DT, align="center")),
           (6, "이 공사를 처음 입찰공고한 날(2026. 4. 1. 이후면 8,700원)", sz)], h=26)
    p.row([(3, "1일 공제부금(직접)", dict(L, size=8.5)), (3, I("일액", ex=_ex(ex, "일액"), fmt='#,##0"원";;""', align="center")),
           (6, "공제회가 알려 준 금액이 따로 있으면 적음(적으면 이 값으로 셈)", sz)], h=26)
    ad = "{입찰공고일}"
    p.row([(3, "적용 일액", L),
           (3, F("적용일액", f'=IF(N({{일액}})>0,{{일액}},IF(N({ad})=0,"",IF({ad}>=DATE(2026,4,1),{NEW_AMT},{OLD_AMT})))', fmt='#,##0"원";;""',
                 align="center", bold=True)),
           (6, F("일액안내", f'=IF(N({{일액}})>0,"{IL_ME}",IF(N({ad})=0,IF(OR({YM_OK},N({{인원}})>0),"{IL_NEED}",""),IF({ad}>=DATE(2026,4,1),"{IL_NEW}","{IL_OLD}")))',
                 align="left", size=7.5))],
          h=34)
    p.row([(3, "", L), (9, ILAEK, {"kind": "text", "size": 7})])

    g.sec(p, "㉰  ① 대상 피공제자 수 · ② 근로일수 누계 · ③ 공제부금의 금액", need=26 * 5 + 10)
    p.row([(3, "① 대상 피공제자 수", dict(L, size=8.5)),
           (3, F("인원", '=COUNTA({신고서!성명[]},{별지!성명[]})', fmt='#,##0"명";;""', align="center", bold=True)),
           (6, "앞쪽 3줄 + 별지 20줄에 성명을 적은 사람 수", sz)], h=26)
    p.row([(3, "② 근로일수 누계", L),
           (3, F("일수합", '=SUM({신고서!일수[]},{별지!일수[]})', fmt='#,##0"일";;""', align="center", bold=True)),
           (6, "줄마다 ⑦ 근로일수의 합", sz)], h=26)
    p.row([(3, "③ 공제부금의 금액", dict(L, size=8.5)),
           (3, F("부금", '=IF(OR(N({일수합})=0,N({적용일액})=0),"",{일수합}*{적용일액})', fmt='#,##0"원";;""', align="center", bold=True)),
           (6, "② 근로일수 누계 × 1일 공제부금(작성방법 ③)", sz)], h=26)
    h7 = {"kind": "head", "size": 7}
    p.row([(3, "줄 확인(줄 수)", dict(L, rs=2, size=8.5)), (2, "근로일수 없음", h7), (2, "날수 넘음", h7), (2, "성명 없음", h7),
           (2, "등록번호 13자리 아님", dict(h7, size=6.5)), (1, "여권 없음", dict(h7, size=6.5))], h=20)
    p.row([(2 if j < 4 else 1, F(f"확인{j + 1}", "=" + _cnt(fn), fmt='0"줄"', align="center", size=8.5)) for j, fn in enumerate(CHK)], h=22)
    cs = [f"{{확인{j + 1}}}" for j in range(5)]
    lst = "&".join(f'IF({c}>0,"{CK[j]}"&{c}&"줄","")' for j, c in enumerate(cs))
    tot = "+".join(cs)
    p.row([(3, "줄 판정", L),
           (9, F("줄확인", f'=IF(AND(N({{인원}})=0,N({{일수합}})=0),"",IF({tot}=0,"{CK_OK_A}"&{{인원}}&"{CK_OK_B}"&{{일수합}}&"{CK_OK_C}",'
                 f'"{CK_A}"&MID({lst},3,300)))', align="left", size=8.5))], h=40)
    p.row([(3, "", L), (9, SANJEONG, {"kind": "text", "size": 7})])

    g.sec(p, "㉱  붙일 서류 · 전자카드 · 정정 · 과태료 · 아직 안 적은 칸", need=26 * 4 + 10)
    p.row([(3, "붙일 서류", L), (9, SEORYU, {"kind": "text", "size": 7.5})], h=26)
    p.row([(3, "전자카드 · 정정", L), (9, JEONJA, {"kind": "text", "size": 7.5})])
    p.row([(3, "과태료", L), (9, GWATAE, {"kind": "text", "size": 7.5})], h=26)
    BIN = [("공제가입번호", '{신고서!공제가입번호}=""'), ("상호 또는 법인 명칭", '{신고서!상호}=""'), ("사업장의 명칭", '{신고서!현장명}=""'),
           ("사업장의 소재지", '{신고서!현장소재지}=""'), ("신고하는 달", f"NOT({YM_OK})"), ("1일 공제부금(입찰공고일)", 'N({적용일액})=0'),
           ("피공제자 성명", 'N({인원})=0'), ("납부일", 'N({신고서!납부일})=0'), ("납부한 금융기관명", '{신고서!금융기관}=""'),
           ("신고인(사업주)", '{신고서!대표자}=""')]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    bl = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", f'=IF(AND(NOT({YM_OK}),N({{인원}})=0,N({{일수합}})=0),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + bl + ',4,300)))',
                 align="left", size=8.5))], h=40)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 근로자는 신고서 앞쪽 3줄에 먼저 적고, 많으면 별지에 이어 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호 — 2027년 3월분 · 7명)."])
    return p


# ── 줄(앞쪽 · 별지 같은 꼴) ──────────────────────────────────────────────
def _head(p):
    hd = {"kind": "head", "size": 8}
    p.row([(1, "연\n번", dict(hd, rs=2)), (2, "피공제자 성명", dict(hd, rs=2)), (2, "⑤ 주민등록번호\n(외국인등록번호)", dict(hd, rs=2)),
           (1, "⑥ 근로연월", dict(hd, rs=2, size=7.5)), (1, "⑦ 근로일수", dict(hd, rs=2, size=7.5)), (3, "주소\n(외국인인 경우 체류지)", dict(hd, rs=2)),
           (1, "전화번호\n(휴대전화번호)", dict(hd, rs=2, size=7)), (2, "직종", dict(hd, rs=2)), (3, "외국인(외국인만 기재)", hd)], h=18)
    p.row([(2, "국적", hd), (1, "여권번호", hd)], h=18)


def _rows(p, ex, a, b, h=21):
    ym = '{셈!신고년}&"."&TEXT({셈!신고월},"00")'
    for i in range(a, b + 1):
        nm = "{" + f"성명#{i}" + "}"
        p.row([(1, F(f"연번#{i}", f'=IF({nm}="","",{i})', fmt='0;;""', align="center", size=8)),
               (2, I(f"성명#{i}", ex=_ew(ex, i, 0), align="center", size=8.5)),
               (2, I(f"주민#{i}", ex=_ew(ex, i, 1), blank="-", align="center", size=8)),
               (1, F(f"연월#{i}", f'=IF(OR({nm}="",N({{셈!신고년}})=0,N({{셈!신고월}})=0),"",{ym})', align="center", size=8)),
               (1, I(f"일수#{i}", ex=_ew(ex, i, 2), fmt='0;;""', align="center", size=8.5)),
               (3, I(f"주소#{i}", ex=_ew(ex, i, 3), size=7.5)),
               (1, I(f"전화#{i}", ex=_ew(ex, i, 4), align="center", size=7)),
               (2, I(f"직종#{i}", ex=_ew(ex, i, 5), align="center", size=8)),
               (2, I(f"국적#{i}", ex=_ew(ex, i, 6), align="center", size=8)),
               (1, I(f"여권#{i}", ex=_ew(ex, i, 7), align="center", size=7.5))], h=h)
    for k in ("성명", "일수"):
        p.k[f"{k}[]"] = f"{p.k[f'{k}#{a}']}:{p.k[f'{k}#{b}']}"


# ── 신고서 앞쪽 (별지 제14호서식 — 가로) ─────────────────────────────────
def singo(bk, ex):
    p = g.pg(bk, ex, "신고서", fit=1, land=True, widths=W1)
    lab = {"kind": "label", "size": 8.5}
    fr = {"kind": "free", "size": 8.5}
    p.row([(11, "■ 건설근로자의 고용개선 등에 관한 법률 시행규칙 [별지 제14호서식] <개정 2020. 11. 26.>", {"kind": "note", "size": 7.5}), (5, "", FR)], h=16)
    p.row([(5, F("월분표시", '=IF(OR(N({셈!신고년})=0,N({셈!신고월})=0),"(        년        월분)","( "&{셈!신고년}&"년  "&{셈!신고월}&"월분)")',
                 align="right", size=12.5, bold=True), {"kind": "free", "border": False}),
           (11, "피공제자별 근로일수 및 공제부금 납부 신고서", {"kind": "title", "size": 16.5, "align": "left"})], h=34)
    p.row([(16, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=13)
    # 신고인(사업주)
    p.row([(2, "신고인\n\n(사업주)", dict(lab, rs=3, size=9)), (2, "공제가입번호", lab), (5, I("공제가입번호", ex=_es(ex, "공제가입번호"), align="center", size=9)),
           (3, "상호 또는 법인 명칭", lab), (4, I("상호", ex=_es(ex, "상호"), size=9))], h=24)
    p.row([(2, "사업장의 명칭", lab), (5, I("현장명", ex=_es(ex, "현장명"), size=8.5)),
           (3, "공정률(%)", lab), (4, I("공정률", ex=_es(ex, "공정률"), fmt="General", align="center", size=9))], h=24)
    _close(p, p.row([(2, "사업장의 소재지", lab), (8, I("현장소재지", ex=_es(ex, "현장소재지"), size=9)),
                     (1, "(전화번호 :", dict(fr, size=7.5, align="right")), (2, I("전화번호", ex=_es(ex, "전화번호"), align="center", size=8)),
                     (1, ")", dict(fr, size=8))], h=24))
    # 1. 공제부금 납부신고
    p.row([(16, "1. 공제부금 납부신고", dict(fr, size=9))], h=20)
    hd = {"kind": "head", "size": 8.5}
    p.row([(4, "① 대상 피공제자 수(명)", dict(hd, rs=2)), (4, "② 근로일수 누계(일)", dict(hd, rs=2)), (3, "③ 공제부금의 금액(원)", dict(hd, rs=2)),
           (5, "④ 공제부금 납부", hd)], h=18)
    p.row([(3, "납부일", hd), (2, "납부한 금융기관명", hd)], h=18)
    p.row([(4, F("인원표시", '=IF(N({셈!인원})=0,"",{셈!인원})', fmt='#,##0;;""', align="center", size=10)),
           (4, F("일수표시", '=IF(N({셈!일수합})=0,"",{셈!일수합})', fmt='#,##0;;""', align="center", size=10)),
           (3, F("부금표시", '=IF(N({셈!부금})=0,"",{셈!부금})', fmt='#,##0;;""', align="center", size=10)),
           (3, I("납부일", ex=_es(ex, "납부일"), fmt=DT, align="center", size=9)),
           (2, I("금융기관", ex=_es(ex, "금융기관"), align="center", size=8))], h=26)
    # 2. 근로일수 신고
    p.row([(16, "2. 근로일수 신고", dict(fr, size=9))], h=20)
    _head(p)
    _rows(p, ex, 1, N1)
    p.gap(4)
    n = text_lines(STATEMENT, sum(W1) * 10.0 / 9.5)
    p.row([(16, STATEMENT, {"kind": "free", "size": 9.5})], h=max(30, n * 9.5 * 1.45 + 4))
    p.row([(16, I("신고일", ex=_es(ex, "신고일"), blank="년            월            일", fmt="date", align="center"), {"border": False})], h=20)
    p.row([(10, "", FR), (2, "신고인(사업주)", {"kind": "free", "size": 9, "align": "center"}),
           (3, I("대표자", ex=_es(ex, "대표자"), align="center", size=9.5), {"border": False}),
           (1, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=22)
    p.row([(4, "건설근로자공제회", {"kind": "free", "size": 13, "bold": True, "align": "right"}), (1, "귀중", {"kind": "free", "size": 9}),
           (11, "", FR)], h=26)
    p.gap(3)
    p.row([(3, "첨부서류", {"kind": "label", "size": 8.5}),
           (12, "납부한 공제부금의 금액과 공제부금을 냈다는 것을 증명하는 서류", {"kind": "text", "size": 8.5}),
           (1, "수수료 없음", {"kind": "ctext", "size": 8})], h=24)
    p.row([(16, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["«년 월분» · ① ② ③ · 근로연월 · 연번은 ① 장과 줄에서 저절로 들어옵니다. 근로자가 많으면 별지에 이어 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


# ── 뒤쪽 (작성방법 · 처리절차) ─────────────────────────────────────────
def dwi(bk, ex):
    p = g.pg(bk, ex, "뒤쪽", fit=1, land=True, widths=W1)
    hd = {"kind": "head", "size": 9.5}
    box = {"kind": "ctext", "size": 8.5}
    arr = {"kind": "cfree", "size": 9}
    p.row([(16, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    p.gap(10)
    p.row([(8, "작성방법", hd), (8, "처리절차", hd)], h=22)
    howto = "\n\n".join(HOWTO)
    p.row([(8, howto, {"kind": "text", "size": 8.5, "valign": "top", "rs": 8}), (8, "이 신고서는 아래와 같이 처리됩니다.", {"kind": "free", "size": 9.5})], h=26)
    p.row([(3, "신고인", {"kind": "label", "size": 8.5, "rs": 2}), (5, "처리기관", {"kind": "label", "size": 8.5})], h=20)
    p.row([(5, "건설근로자공제회", {"kind": "label", "size": 8.5})], h=20)
    p.row([(1, "", FR), (2, "신고서 작성", box), (1, "▶", arr), (3, "접수", box), (1, "", FR)], h=30)
    p.row([(4, "", FR), (3, "▼", arr), (1, "", FR)], h=18)
    p.row([(4, "", FR), (3, "확인ㆍ검토", box), (1, "", FR)], h=30)
    p.row([(4, "", FR), (3, "▼", arr), (1, "", FR)], h=18)
    p.row([(4, "", FR), (3, "전산입력", box), (1, "", FR)], h=30)
    p.end_print()
    p.after_note(["원문 뒤쪽(작성방법 · 처리절차) 그대로입니다."] if not ex else ["이 시트는 작성 예시입니다."])
    return p


# ── 별지 (근로일수 신고 — 앞쪽에 이어서) ─────────────────────────────────
def byeolji(bk, ex):
    p = g.pg(bk, ex, "별지", fit=1, land=True, widths=W1)
    p.row([(16, "■ [별지 제14호서식] 피공제자별 근로일수 및 공제부금 납부 신고서 — 별지(신고 대상 피공제자가 많은 경우 · 뒤쪽 작성방법 ※)",
            {"kind": "note", "size": 7.5})], h=16)
    p.row([(5, F("별지월분", '=IF(OR(N({셈!신고년})=0,N({셈!신고월})=0),"(        년        월분)","( "&{셈!신고년}&"년  "&{셈!신고월}&"월분)")',
                 align="right", size=11.5, bold=True), {"kind": "free", "border": False}),
           (11, F("별지머리", '="2. 근로일수 신고(앞쪽에 이어서)"&IF({신고서!상호}="",""," — "&{신고서!상호})&IF({신고서!현장명}="",""," · "&{신고서!현장명})',
                  align="left", size=11, bold=True), {"kind": "free", "border": False})], h=28)
    _head(p)
    _rows(p, ex, N1 + 1, NT, h=20)
    p.row([(16, "※ 앞쪽 «1. 공제부금 납부신고» ① ② ③ 에는 이 별지의 사람과 근로일수도 함께 들어갑니다.", {"kind": "free", "size": 7.5})], h=14)
    p.end_print()
    p.after_note(["앞쪽 3줄을 넘는 근로자를 적습니다. 연번 · 근로연월은 저절로 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    singo(bk, ex)
    dwi(bk, ex)
    byeolji(bk, ex)


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


def _len(v):
    return 0 if v is None else len(str(v))


def expect(pages):
    sm, sg, bj = pages["셈"], pages["신고서"], pages["별지"]
    a, s, b = {}, {}, {}
    T = datetime.timedelta
    yy, mm = _n(sm.get("신고년")), _n(sm.get("신고월"))
    ok = yy > 0 and mm > 0
    due = end = None
    if ok:
        y2, m2 = (yy + 1, 1) if mm == 12 else (yy, mm + 1)
        end = D(y2, m2, 1) - T(days=1)
        d0 = D(y2, m2, 15)
        due = d0 + T(days=2 if d0.weekday() == 5 else 1 if d0.weekday() == 6 else 0)
    a["말일"] = end.day if ok else ""
    a["기한"] = f"{_ymd(due)}({_y(due)}){GH_TAIL}" if ok else ""
    sd = _d(sg.get("신고일"))
    if not ok:
        a["신고확인"] = ""
    elif not sd:
        a["신고확인"] = SN_NEED
    elif sd > due:
        a["신고확인"] = SN_LATE
    elif sd < end:
        a["신고확인"] = SN_EARLY
    else:
        a["신고확인"] = SN_OK
    n_names = sum(1 for i in range(1, NT + 1) if (sg if i <= N1 else bj).get(f"성명#{i}") not in (None, ""))
    il, ad = _n(sm.get("일액")), _d(sm.get("입찰공고일"))
    amt = il if il > 0 else ((NEW_AMT if ad >= NEW_DAY else OLD_AMT) if ad else "")
    a["적용일액"] = amt
    a["일액안내"] = IL_ME if il > 0 else ((IL_NEED if (ok or n_names > 0) else "") if not ad else (IL_NEW if ad >= NEW_DAY else IL_OLD))
    rows = []
    for i in range(1, NT + 1):
        pg = sg if i <= N1 else bj
        rows.append({k: pg.get(f"{k}#{i}") for k in ("성명", "주민", "일수", "국적", "여권")})
    names = [r["성명"] for r in rows if r["성명"] not in (None, "")]
    a["인원"] = len(names)
    tot = sum(_n(r["일수"]) for r in rows)
    a["일수합"] = tot
    a["부금"] = tot * amt if (tot and amt) else ""
    md = end.day if ok else 0

    def rrn_bad(v):
        t = str(v or "").replace("-", "").replace(" ", "")
        return 0 < len(t) != 13

    c = [sum(1 for r in rows if _len(r["성명"]) > 0 and _n(r["일수"]) == 0),
         sum(1 for r in rows if md > 0 and _n(r["일수"]) > md),
         sum(1 for r in rows if _len(r["성명"]) == 0 and _n(r["일수"]) > 0),
         sum(1 for r in rows if rrn_bad(r["주민"])),
         sum(1 for r in rows if _len(r["국적"]) > 0 and _len(r["여권"]) == 0)]
    nn = len(names)
    for j in range(5):
        a[f"확인{j + 1}"] = c[j]
    if not nn and not tot:
        a["줄확인"] = ""
    elif sum(c) == 0:
        a["줄확인"] = f"{CK_OK_A}{nn}{CK_OK_B}{_fmt_g(tot)}{CK_OK_C}"
    else:
        a["줄확인"] = CK_A + ("".join(f"{CK[j]}{c[j]}줄" for j in range(5) if c[j] > 0))[2:302]
    if not ok and not nn and not tot:
        a["빈칸"] = ""
    else:
        miss = [n for n, m in (("공제가입번호", not sg.get("공제가입번호")), ("상호 또는 법인 명칭", not sg.get("상호")), ("사업장의 명칭", not sg.get("현장명")),
                               ("사업장의 소재지", not sg.get("현장소재지")), ("신고하는 달", not ok), ("1일 공제부금(입찰공고일)", not amt),
                               ("피공제자 성명", not nn), ("납부일", not _d(sg.get("납부일"))), ("납부한 금융기관명", not sg.get("금융기관")),
                               ("신고인(사업주)", not sg.get("대표자"))) if m]
        a["빈칸"] = BIN_OK if not miss else BIN_A + (" · ".join(miss))[:300]
    mon = f"( {yy}년  {mm}월분)" if ok else "(        년        월분)"
    s["월분표시"] = mon
    s["인원표시"] = nn if nn else ""
    s["일수표시"] = tot if tot else ""
    s["부금표시"] = tot * amt if (tot and amt) else ""
    b["별지월분"] = mon
    b["별지머리"] = ("2. 근로일수 신고(앞쪽에 이어서)" + (" — " + sg.get("상호") if sg.get("상호") else "")
                  + (" · " + sg.get("현장명") if sg.get("현장명") else ""))
    for i in range(1, NT + 1):
        out = s if i <= N1 else b
        r = rows[i - 1]
        has = r["성명"] not in (None, "")
        out[f"연번#{i}"] = i if has else ""
        out[f"연월#{i}"] = f"{yy}.{mm:02d}" if (has and ok) else ""
    return {"셈": a, "신고서": s, "별지": b}


def _fmt_g(v):
    """엑셀 «&» 로 수를 글로 붙일 때 꼴(정수면 소수점 없이)"""
    return str(int(v)) if float(v).is_integer() else str(v)


# 엑셀 수식 안 글(따옴표 안)은 255자까지 — 넘으면 엑셀이 파일을 못 엶
for _t in (GH_TAIL, SN_NEED, SN_LATE, SN_EARLY, SN_OK, IL_ME, IL_NEED, IL_NEW, IL_OLD, CK_OK_A, CK_OK_B, CK_OK_C, CK_A, *CK, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
assert abs(sum(PCT) - 100) < 1e-6
