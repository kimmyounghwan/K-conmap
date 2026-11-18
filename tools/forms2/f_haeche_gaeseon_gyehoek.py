# -*- coding: utf-8 -*-
"""건축물 해체작업 개선계획서 — 새로 만든 서식 (2026-11-18 G768 · 소장님 「…만들지 못한 서식도 10개 만들어 줘」 — 넷째)
   → ① 왜 내나(감리자의 시정 · 중지 요청을 이행함 / 작업중지 명령을 받음 — 법 제32조제4항) · 내는 사람 · 낼 곳 ·
     요청(명령)일 → 개선 시작 · 끝 날짜 차례 · 개선기간 일수 · 제출일 차례 · 하도급(하수급인란) · 아직 안 적은 칸 · 다음 할 일
   · 계획서 한 쪽(건축물관리법 시행규칙 [별지 제9호서식] <개정 2022. 8. 4.> 칸 차례 그대로 — 건축물해체 허가(신고)번호 · 관리자 · 해체공사 시공자(하수급인) ·
     해체공사 감리자 · 시정 · 중지요청 내용(요청 또는 명령일자 포함) · 개선계획(개선기간 · 개선내용 및 방법) · 제출 문구 · 제출인 · 귀하).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G768/구조.md — 바깥 120 ~ 1108 · 이름 칸 269 · 왼 | 오른 690 · 하수급인 466 · 위 굵은 줄 216 · 아래 굵은 줄 1599 ·
     감리자 밑 · 시정 칸 밑 두 줄(725 · 735 / 873 · 883) · 바탕 회색 없음). 칸 이름(머리글)은 원문처럼 칸 안 왼쪽에 작게 — 글은 그 오른쪽에.

근거(국가법령정보센터 · 2026-11-18 · 원문 /home/claude/g10/notes/G768/원문_대조용.txt · 조문 G768/근거.md — 세 번):
  · 건축물관리법 [시행 2025. 6. 4.] 제32조 — ② 해체공사감리자는 해체작업이 안전하게 수행되기 어려우면 관리자 · 해체작업자에게 시정 또는 중지를 요청
      ③ 요청을 받고도 계속하면 허가권자에게 보고 · 허가권자는 지체 없이 작업중지 명령
      ④ ②의 조치를 요청받고 이행한 경우나 ③ 후단의 작업중지 명령을 받은 이후 해체작업을 다시 하려는 경우 건축물 안전확보에 필요한 개선계획을 허가권자에게 제출하여 승인
  · 시행규칙 [시행 2025. 6. 2.] 제14조 — ② 관리자 또는 해체작업자는 법 제32조제4항에 따라 개선계획을 승인받으려면 별지 제9호서식 해체작업 개선계획서를 허가권자에게 제출
      ③ 허가권자는 보완이 필요하면 보완 요청 · ① 감리자의 시정 · 중지 요청 보고서는 별지 제8호서식
■ 원문 그대로: 머리 «■ 건축물관리법 시행규칙 [별지 제9호서식] <개정 2022. 8. 4.>» · 칸 이름 · ※ 하수급인란 · 제출 문구 · 귀하 · 백상지.
■ 짐작 안 함: 승인 처리기간(서식 · 조문에 없음 — 날짜 셈 안 함) · 개선 내용(이용자가 적음) · 해체작업자 = 해체공사 시공자로 봄(제출인 이름 칸만 — 바꿔 적어도 됨)."""
import datetime

import sgw as g
from fb import F, I
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUB, SUBC, FR, FRR, FRC, NB, _ymd
from sgw import L

SLUG = "haeche-gaeseon-gyehoek"
TITLE = "건축물 해체작업 개선계획서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "건축물 해체작업 개선계획서(건축물관리법 시행규칙 별지 제9호서식) — 빈 서식 (원문 칸 차례 그대로 · 한 쪽)"),
        (4, "건축물 해체작업 개선계획서 — 작성 예시 (요청일자 · 개선기간 · 제출일 · 제출인이 ① 장에서)"),
        (3, "① 왜 내나 · 날짜 차례 · 개선기간 · 하수급인란 — 작성 예시 (가상의 해체 현장)")]
MULTI = True
SHORT = ("건축물 해체작업 개선계획서(건축물관리법 시행규칙 별지 제9호서식) — 해체공사감리자의 시정 · 중지 요청을 이행했거나 작업중지 명령을 받은 뒤 "
         "해체작업을 다시 하려면 개선계획을 허가권자에게 내고 승인을 받습니다. 요청(명령)일 · 개선기간 · 제출일을 적으면 날짜 차례와 일수가 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
GYE = ["시정 · 중지 요청을 받고 이행함", "작업중지 명령을 받음"]
WHO = ["관리자", "해체작업자"]
HADO = ["하도급 안 함", "하도급 함"]

WHY_REQ = ("해체공사감리자의 시정 또는 중지 요청(법 제32조제2항)을 받고 이를 이행한 뒤 해체작업을 다시 하려는 경우 — "
           "건축물 안전확보에 필요한 개선계획을 허가권자에게 내고 승인을 받습니다(법 제32조제4항)")
WHY_CMD = ("감리자의 보고로 허가권자의 작업중지 명령(법 제32조제3항 후단)을 받은 뒤 해체작업을 다시 하려는 경우 — "
           "개선계획을 허가권자에게 내고 승인을 받습니다(법 제32조제4항)")
WHERE_T = "허가권자(특별자치시장 · 특별자치도지사 또는 시장 · 군수 · 구청장)에게 냅니다 — 관리자 또는 해체작업자(시행규칙 제14조제2항)"
GI_BAD = "⚠ 끝날이 시작일보다 앞입니다"
GI_A = "일간(첫날 · 끝날 넣어 셈)"
CHA_BAD = "⚠ 개선 시작일이 요청(명령)일보다 앞입니다"
CHA_A = "✓ 요청(명령) 뒤 "
CHA_B = "일에 개선 시작"
JE_BAD = "⚠ 제출일이 요청(명령)일보다 앞입니다"
JE_B = "일에 제출"
SUB_YES = "하수급인란(성명 · 사업자등록번호 또는 법인등록번호)을 적습니다 — 해체공사를 하도급한 경우에만(서식 ※)"
SUB_NO = "하수급인란은 비워 둡니다 — 해체공사를 하도급한 경우에만 적습니다(서식 ※)"
NEXT = ("허가권자에게 내고 승인을 받은 뒤 해체작업을 다시 합니다(법 제32조제4항) · 보완을 요청받으면 보완해 다시 냅니다(시행규칙 제14조제3항) · "
        "승인 전에는 해체작업을 다시 하지 않습니다")
BIN_OK = "✓ 계획서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
GIGAN0 = "년      월      일  ~      년      월      일 (      일간)"
HEAD = "■ 건축물관리법 시행규칙 [별지 제9호서식] <개정 2022. 8. 4.>"

# ── 작성 예시(가상의 현장 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"계기": GYE[0], "내는사람": "관리자", "하도급": "하도급 안 함", "요청일": D(2027, 3, 10), "시작": D(2027, 3, 11), "끝": D(2027, 3, 13),
      "제출일": D(2027, 3, 11)}
EX_S = {"허가번호": "가나시 건축과 제2027-0012호", "관리자성명": "가나산업(주) 대표이사 홍길동", "관리자번호": "000-00-00000", "관리자주소": "가나시 다라구 마바로 12",
        "관리자전화": "000-0000-0000", "시공자성명": "김철수", "시공자번호": "000-00-00000", "회사명": "다라건설(주)", "건설업번호": "가나-0000-00",
        "시공자주소": "가나시 다라구 바사로 34", "시공자전화": "000-0000-0000", "하수급성명": None, "하수급번호": None,
        "감리자성명": "이영희", "자격번호": "건축사 제0000호", "사무소명": "마바건축사사무소", "신고번호": "제0000-00호", "사무소주소": "가나시 마바구 아자로 56",
        "감리자전화": "000-0000-0000",
        "시정내용": "4층 슬래브 위 해체잔재물 과다 적치(약 60cm) — 해체공사감리자 시정 요청(즉시 반출 · 40cm 이하로 적치)",
        "개선내용": "① 4층 슬래브 위 잔재물 즉시 반출 · 40cm 이하로 적치(매일 작업 끝에 확인)\n② 잭 서포트 추가 설치(4층 → 3층 · 구조안전성 검토보고서 수량 확인)\n"
                   "③ 해체 재개 전 해체공사감리자 확인 · 작업자 안전교육(TBM)"}


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  해체작업 개선계획 — 왜 내나 · 날짜 차례 · 개선기간 · 하수급인란 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 해체공사감리자의 시정 · 중지 요청을 이행했거나 작업중지 명령을 받은 뒤 해체작업을 다시 하려면 개선계획을 허가권자에게 내고 승인을 받습니다"
              "(건축물관리법 제32조제4항 · 시행규칙 제14조제2항). 여기 적은 날짜가 계획서의 요청일자 · 개선기간 · 제출일로 들어갑니다.")
    g.sec(p, "㉮  왜 내나 · 내는 사람", need=26 * 2 + 36 * 2 + 10)
    p.row([(3, "계기", L), (5, I("계기", ex=_ex(ex, "계기"), dv=",".join(GYE), align="center", size=8.5)),
           (4, "감리자의 시정 · 중지 요청 / 허가권자의 작업중지 명령", s7)], h=26)
    p.row([(3, "언제 내나", L), (9, F("때", '=IF({계기}="","",IF({계기}="' + GYE[1] + '","' + WHY_CMD + '","' + WHY_REQ + '"))', align="left", size=8.5))], h=44)
    p.row([(3, "내는 사람", L), (3, I("내는사람", ex=_ex(ex, "내는사람"), dv=",".join(WHO), align="center", size=9)),
           (6, "계획서 끝 «제출인» 이름 칸으로 들어갑니다(해체작업자 = 해체공사 시공자)", s7)], h=26)
    p.row([(3, "낼 곳", L), (9, WHERE_T, {"kind": "text", "size": 8.5})], h=36)
    g.sec(p, "㉯  요청(명령)일 · 개선기간 · 제출일", need=26 * 3 + 36 * 3 + 10)
    p.row([(3, "요청(명령)일", L), (3, I("요청일", ex=_ex(ex, "요청일"), fmt=DT, align="center", size=9)),
           (6, "시정 · 중지 요청 또는 작업중지 명령을 받은 날 — 계획서 «요청 또는 명령일자» 로 들어갑니다", s7)], h=26)
    p.row([(3, "개선기간", L), (2, I("시작", ex=_ex(ex, "시작"), fmt=DT, align="center", size=8.5)), (1, "~", {"kind": "cfree", "size": 9}),
           (2, I("끝", ex=_ex(ex, "끝"), fmt=DT, align="center", size=8.5)),
           (4, F("일간", '=IF(OR(N({시작})=0,N({끝})=0),"",IF({끝}<{시작},"' + GI_BAD + '",({끝}-{시작}+1)&"' + GI_A + '"))', align="left", size=8.5))], h=26)
    p.row([(3, "날짜 차례", L),
           (9, F("차례", '=IF(OR(N({요청일})=0,N({시작})=0),"",IF({시작}<{요청일},"' + CHA_BAD + '","' + CHA_A + '"&({시작}-{요청일})&"' + CHA_B + '"))',
                 align="left", size=8.5))], h=36)
    p.row([(3, "제 출 일", L), (3, I("제출일", ex=_ex(ex, "제출일"), fmt=DT, align="center", size=9)),
           (6, "계획서 끝 날짜로 들어갑니다", s7)], h=26)
    p.row([(3, "제출일 차례", L),
           (9, F("제출차례", '=IF(OR(N({요청일})=0,N({제출일})=0),"",IF({제출일}<{요청일},"' + JE_BAD + '","' + CHA_A + '"&({제출일}-{요청일})&"' + JE_B + '"))',
                 align="left", size=8.5))], h=36)
    g.sec(p, "㉰  하도급 · 아직 안 적은 칸 · 다음 할 일", need=26 + 36 + 44 + 44 + 10)
    p.row([(3, "해체공사 하도급", L), (3, I("하도급", ex=_ex(ex, "하도급"), dv=",".join(HADO), align="center", size=9)),
           (6, "하도급한 경우에만 하수급인란을 적습니다(서식 ※)", s7)], h=26)
    p.row([(3, "하수급인란", L), (9, F("하수급", '=IF({하도급}="","",IF({하도급}="' + HADO[1] + '","' + SUB_YES + '","' + SUB_NO + '"))', align="left", size=8.5))], h=36)
    BIN = [("허가(신고)번호", '{계획서!허가번호}=""'), ("관리자 성명", '{계획서!관리자성명}=""'), ("관리자 주소", '{계획서!관리자주소}=""'),
           ("시공자 성명", '{계획서!시공자성명}=""'), ("회사명", '{계획서!회사명}=""'), ("감리자 성명", '{계획서!감리자성명}=""'),
           ("하수급인", 'AND({하도급}="' + HADO[1] + '",{계획서!하수급성명}="")'), ("시정 · 중지 내용", '{계획서!시정내용}=""'),
           ("요청(명령)일", "N({요청일})=0"), ("개선기간", "OR(N({시작})=0,N({끝})=0)"), ("개선내용 및 방법", '{계획서!개선내용}=""'), ("제출일", "N({제출일})=0")]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND({계기}="",{계획서!관리자성명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))',
                 align="left", size=8.5))], h=44)
    p.row([(2, "다음 할 일", dict(L, size=8.5)), (10, F("다음", '=IF(AND({계기}="",{계획서!관리자성명}=""),"","' + NEXT + '")', align="left", size=8))], h=44)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 계기 · 요청(명령)일 · 개선기간 · 제출일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 해체 현장 — 슬래브 위 잔재물 과다 적치 시정 요청)."])
    return p


# ── 계획서(한 쪽) ───────────────────────────────────────────────────────
PAX = [120, 269, 466, 580, 690, 780, 900, 1085, 1108]
GA = Grid(PAX)


def form(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "계획서", fit=1, widths=GA.w)
    X1, XL, XM, X2 = 120, 269, 690, 1108
    T, G_ = S["thin"], S["gry"]

    def inp(k, **kw):
        kw.setdefault("size", 8.5)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    cap = {"kind": "free", "size": 8, "align": "left", "indent": 1}
    capS = {"kind": "free", "size": 7.5, "align": "left", "indent": 1}
    lab = {"kind": "free", "size": 9.5, "align": "center", "wrap": True}
    tel = {"kind": "free", "size": 8, "align": "left"}
    prow(p, GA, [(X1, X2, HEAD, {"kind": "free", "size": 7.5})], h=13)
    p.gap(12)
    prow(p, GA, [(X1, X2, TITLE, {"kind": "free", "size": 17, "bold": True, "align": "center"})], h=28)
    p.gap(10)
    # 칸 이름은 원문처럼 칸 안 위 왼쪽(머리 줄) · 글은 그 밑 줄 — 줄 높이(pt) = 원문 줄(px) × 0.48 가까이
    # 건축물 해체 · 허가(신고) 번호
    r1 = prow(p, GA, [(X1, XL, "건축물 해체", dict(lab, rs=2)), (XL, X2, "허가(신고) 번호", cap)], h=12)
    r1b = prow(p, GA, [(XL, X2, inp("허가번호"), dict(NB, indent=1))], h=13)
    hline(p, GA, r1, X1, X2, S["med"], below=False)
    hline(p, GA, r1b, X1, X2, T)
    # 관리자 — 성명(법인명) | 생년월일(…) · 주소 … (전화번호: )
    a1 = prow(p, GA, [(X1, XL, "관리자", dict(lab, rs=4)), (XL, XM, "성명(법인명)", cap), (XM, X2, "생년월일(사업자등록번호 또는 법인등록번호)", cap)], h=11)
    a2 = prow(p, GA, [(XL, XM, inp("관리자성명"), dict(NB, indent=1)), (XM, X2, inp("관리자번호"), dict(NB, indent=1))], h=11)
    a3 = prow(p, GA, [(XL, X2, "주소", cap)], h=11)
    a4 = prow(p, GA, [(XL, 780, inp("관리자주소"), dict(NB, indent=1)), (780, 900, "(전화번호:", tel), (900, 1085, inp("관리자전화", size=8), NB), (1085, X2, ")", tel)], h=14)
    vline(p, GA, a1, a2, XM, G_)
    hline(p, GA, a4, X1, X2, T)
    # 해체공사 시공자(※ 하수급인란) — 성명 | 사업자등록번호 · 회사명 | 건설업등록번호 · 주소 … (전화번호: ) · 하수급인 | 성명(법인명) | 사업자등록번호
    b1 = prow(p, GA, [(X1, XL, "해체공사\n시공자\n\n※ 하수급인란은\n해체공사를\n하도급한 경우\n에만 작성", dict(lab, size=8.5, rs=8)),
                      (XL, XM, "성명", cap), (XM, X2, "사업자등록번호 또는 법인등록번호", cap)], h=12)
    b2 = prow(p, GA, [(XL, XM, inp("시공자성명"), dict(NB, indent=1)), (XM, X2, inp("시공자번호"), dict(NB, indent=1))], h=15)
    b3 = prow(p, GA, [(XL, XM, "회사명", cap), (XM, X2, "건설업등록번호", cap)], h=10)
    b4 = prow(p, GA, [(XL, XM, inp("회사명"), dict(NB, indent=1)), (XM, X2, inp("건설업번호"), dict(NB, indent=1))], h=12)
    b5 = prow(p, GA, [(XL, X2, "주  소", cap)], h=12)
    b6 = prow(p, GA, [(XL, 780, inp("시공자주소"), dict(NB, indent=1)), (780, 900, "(전화번호:", tel), (900, 1085, inp("시공자전화", size=8), NB), (1085, X2, ")", tel)], h=20)
    b7 = prow(p, GA, [(XL, 466, "하수급인", dict(cap, rs=2, valign="top")), (466, XM, "성명(법인명)", cap), (XM, X2, "사업자등록번호 또는 법인등록번호", cap)], h=12)
    b8 = prow(p, GA, [(466, XM, inp("하수급성명", size=8), dict(NB, indent=1)), (XM, X2, inp("하수급번호"), dict(NB, indent=1))], h=18)
    for r in (b2, b4, b6):
        hline(p, GA, r, XL, X2, G_)
    vline(p, GA, b1, b4, XM, G_)
    for x in (466, XM):
        vline(p, GA, b7, b8, x, G_)
    hline(p, GA, b8, X1, X2, T)
    # 해체공사 감리자 — 성명 | 자격번호 · 사무소명 | 신고번호 · 사무소 주소 … (전화번호: )
    c1 = prow(p, GA, [(X1, XL, "해체공사\n감리자", dict(lab, rs=6)), (XL, XM, "성명", capS), (XM, X2, "자격번호", capS)], h=9)
    c2 = prow(p, GA, [(XL, XM, inp("감리자성명"), dict(NB, indent=1)), (XM, X2, inp("자격번호"), dict(NB, indent=1))], h=11)
    c3 = prow(p, GA, [(XL, XM, "사무소명", capS), (XM, X2, "신고번호", capS)], h=9)
    c4 = prow(p, GA, [(XL, XM, inp("사무소명"), dict(NB, indent=1)), (XM, X2, inp("신고번호"), dict(NB, indent=1))], h=11)
    c5 = prow(p, GA, [(XL, X2, "사무소 주소", cap)], h=11)
    c6 = prow(p, GA, [(XL, 780, inp("사무소주소"), dict(NB, indent=1)), (780, 900, "(전화번호:", tel), (900, 1085, inp("감리자전화", size=8), NB), (1085, X2, ")", tel)], h=15)
    for r in (c2, c4):
        hline(p, GA, r, XL, X2, G_)
    vline(p, GA, c1, c4, XM, G_)
    vline(p, GA, r1, c6, XL, G_)
    hline(p, GA, c6, X1, X2, T)
    p.gap(4)                                      # 원문 두 줄(725 · 735)
    # 시정 · 중지요청의 내용(요청 또는 명령일자 포함)
    d1 = prow(p, GA, [(X1, X2, "시정ㆍ중지요청의 내용 또는 작업중지명령의 내용(요청 또는 명령일자 포함)", dict(cap, size=8.5))], h=15)
    d2 = prow(p, GA, [(X1, X2, F("표요청", '=IF(N({셈!요청일})=0,"","(요청 또는 명령일자: "&' + _ymd("{셈!요청일}") + '&")")', align="left", size=8.5), dict(NB, indent=1))], h=18)
    d3 = prow(p, GA, [(X1, X2, inp("시정내용"), dict(NB, indent=1, valign="top"))], h=33)
    hline(p, GA, d1, X1, X2, T, below=False)
    hline(p, GA, d3, X1, X2, T)
    p.gap(4)                                      # 원문 두 줄(873 · 883)
    # 개선계획
    s0, s1 = "{셈!시작}", "{셈!끝}"
    gigan = F("표기간", '=IF(OR(N(' + s0 + ')=0,N(' + s1 + ')=0),"' + GIGAN0 + '",YEAR(' + s0 + ')&"년 "&MONTH(' + s0 + ')&"월 "&DAY(' + s0 + ')&"일  ~  "&YEAR(' + s1
              + ')&"년 "&MONTH(' + s1 + ')&"월 "&DAY(' + s1 + ')&"일 ("&IF(' + s1 + '<' + s0 + ',"   ",' + s1 + '-' + s0 + '+1)&"일간)")', align="center", size=9)
    e1 = prow(p, GA, [(X1, XL, "개선\n계획", dict(lab, size=10, rs=4)), (XL, X2, "개선기간", cap)], h=14)
    e2 = prow(p, GA, [(XL, X2, gigan, NB)], h=24)
    e3 = prow(p, GA, [(XL, X2, "개선내용 및 방법(개선한 순서별로 작성)", cap)], h=14)
    e4 = prow(p, GA, [(XL, X2, inp("개선내용", size=8.5, align="left"), dict(NB, indent=1, valign="top"))], h=162)
    hline(p, GA, e1, X1, X2, T, below=False)
    hline(p, GA, e2, XL, X2, G_)
    vline(p, GA, e1, e4, XL, G_)
    hline(p, GA, e4, X1, X2, T)
    p.gap(4)
    prow(p, GA, [(X1, X2, "「건축물관리법」 제32조제4항 및 같은 법 시행규칙 제14조제2항에 따라 해체작업 개선계획서를 제출합니다.",
                  {"kind": "free", "size": 9.5, "indent": 1, "wrap": True})], h=32)
    p.gap(12)
    prow(p, GA, [(X1, X2, F("표제출일", '=IF(N({셈!제출일})=0,"년         월         일",YEAR({셈!제출일})&"년      "&MONTH({셈!제출일})&"월      "&DAY({셈!제출일})&"일")',
                             align="right", size=9), NB)], h=20)
    p.gap(14)
    who = F("표제출인", '=IF({셈!내는사람}="관리자",IF({관리자성명}="","",{관리자성명}),IF({셈!내는사람}="해체작업자",IF({시공자성명}="","",{시공자성명}),""))',
            align="center", size=8.5)
    prow(p, GA, [(X1, 466, "", NB), (466, 580, "제출인", dict(FRC, size=9.5)), (580, 900, who, NB), (900, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=20)
    p.gap(12)
    r = prow(p, GA, [(X1, X2, "특별자치시장ㆍ특별자치도지사 또는 시장ㆍ군수ㆍ구청장   귀하", {"kind": "free", "size": 10.5, "bold": True, "align": "left", "indent": 2})], h=22)
    hline(p, GA, r, X1, X2, S["med"])
    p.gap(2)
    prow(p, GA, [(X1, X2, "210mm×297mm[백상지(80g/㎡)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["요청(명령)일자 · 개선기간 · 제출일 · 제출인 이름은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _ymdp(d):
    return f"{d.year}. {d.month}. {d.day}."


def expect(pages):
    sm, fr = pages["셈"], pages["계획서"]
    a, b = {}, {}
    gy, who, hado = sm.get("계기"), sm.get("내는사람"), sm.get("하도급")
    rq, s0, s1, je = sm.get("요청일"), sm.get("시작"), sm.get("끝"), sm.get("제출일")
    a["때"] = "" if not gy else (WHY_CMD if gy == GYE[1] else WHY_REQ)
    a["일간"] = "" if (not s0 or not s1) else (GI_BAD if s1 < s0 else f"{(s1 - s0).days + 1}{GI_A}")
    a["차례"] = "" if (not rq or not s0) else (CHA_BAD if s0 < rq else f"{CHA_A}{(s0 - rq).days}{CHA_B}")
    a["제출차례"] = "" if (not rq or not je) else (JE_BAD if je < rq else f"{CHA_A}{(je - rq).days}{JE_B}")
    a["하수급"] = "" if not hado else (SUB_YES if hado == HADO[1] else SUB_NO)
    keys = [("허가(신고)번호", not fr.get("허가번호")), ("관리자 성명", not fr.get("관리자성명")), ("관리자 주소", not fr.get("관리자주소")),
            ("시공자 성명", not fr.get("시공자성명")), ("회사명", not fr.get("회사명")), ("감리자 성명", not fr.get("감리자성명")),
            ("하수급인", hado == HADO[1] and not fr.get("하수급성명")), ("시정 · 중지 내용", not fr.get("시정내용")),
            ("요청(명령)일", not rq), ("개선기간", not s0 or not s1), ("개선내용 및 방법", not fr.get("개선내용")), ("제출일", not je)]
    if not gy and not fr.get("관리자성명"):
        a["빈칸"] = a["다음"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
        a["다음"] = NEXT
    b["표요청"] = "" if not rq else f"(요청 또는 명령일자: {_ymdp(rq)})"
    if not s0 or not s1:
        b["표기간"] = GIGAN0
    else:
        b["표기간"] = (f"{s0.year}년 {s0.month}월 {s0.day}일  ~  {s1.year}년 {s1.month}월 {s1.day}일 ("
                     + ("   " if s1 < s0 else str((s1 - s0).days + 1)) + "일간)")
    b["표제출일"] = "년         월         일" if not je else f"{je.year}년      {je.month}월      {je.day}일"
    b["표제출인"] = (fr.get("관리자성명") or "") if who == "관리자" else ((fr.get("시공자성명") or "") if who == "해체작업자" else "")
    return {"셈": a, "계획서": b}
