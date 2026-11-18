# -*- coding: utf-8 -*-
"""도로점용공사(원상회복공사) 준공확인 신청서 — 새로 만든 서식 (2026-11-18 G763 · 소장님 「…만들지 못한 서식도 10개 만들어 줘」 — 첫째)
   → ① 무엇을 마쳤나(도로점용공사 · 원상회복공사) · 주요지하매설물을 설치했나 → 준공도면 제출 · 붙일 서류 ·
     허가 → 준공 → 신청 날짜 차례 · 처리 기한(7일 — 민원처리법 제19조②) · 아직 안 적은 칸 · 다음 할 일
   · 신청서 한 쪽(도로법 시행규칙 [별지 제32호서식] <개정 2026. 9. 15.> 칸 차례 그대로 — 접수 띠 · 신청인 · 도로의 종류 · 노선명 ·
     점용의 장소 | 점용면적 · 점용물의 구조 · 허가연월일 | 준공연월일 · 공사내용 · 신청 문구 · 신청인(시행자) · 도로관리청 귀하 ·
     신청인 제출서류 | 수수료 없음 · 처리절차 상자 다섯).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G763/구조.md — 바깥 120 ~ 1122 · 신청인 칸 227 · 성명 | 생년월일 758 · 장소 | 면적 629 ·
     접수 띠 370 · 869 · 제출서류 227 · 994 · 처리절차 상자 135-271 · 340-476 · 545-681 · 750-886 · 955-1091).

근거(국가법령정보센터 · 2026-11-18 · 원문 /home/claude/g10/notes/G763/원문_대조용.txt(글층 해시 82db07d9cbe7ab46 · 420자) · 조문 G763/근거.md — 세 번 같은 해시):
  · 도로법 [시행 2026. 9. 18.] 제62조② — 도로의 굴착이나 토지의 형질변경이 따르는 공사를 목적으로 도로점용허가를 받은 자는 공사를 마치면
      도로관리청의 준공확인을 받아야 함 · 대통령령으로 정하는 주요지하매설물을 설치하는 공사를 마치면 준공도면을 도로관리청에 제출
  · 도로법 제73조 — ① 점용허가 기간이 끝났거나 취소되면 원상회복 ② 허가 없이 점용한 자에게 원상회복 명령 ③ 원상회복에 제62조제2항 준용
  · 도로법 시행규칙 [시행 2026. 9. 18.] 제30조 — 별지 제32호서식 준공확인 신청서 + 설계도면 · 지하시설물도(공간정보관리법 시행령 별표 1 제1호) → 도로관리청
  · 「민원 처리에 관한 법률」 제19조② — 처리기간 7일: 받은 날을 1일로 토 · 일 · 공휴일 빼고 7번째 근무일(민원기한.py · G739 세 번)
■ 원문 그대로: 머리 «■ 도로법 시행규칙 [별지 제32호서식] <개정 2026. 9. 15.>» · 처리기간 7일 · 수수료 없음 · 처리절차 상자 다섯(화살표는 그림대로 «➔»).
■ 짐작 안 함: 신청 기한(법은 «마치면» 만 — 날 수 없음) · 어떤 매설물이 주요지하매설물인지(대통령령 — 이용자가 «설치함» 을 고름)."""
import datetime

import sgw as g
from fb import F, I
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUB, SUBC, FR, FRR, FRC, NB, _ymd, _yo
from sgw import L
import 민원기한 as MW

SLUG = "doro-jeomyong-jungong"
TITLE = "도로점용공사(원상회복공사) 준공확인 신청서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "도로점용공사(원상회복공사) 준공확인 신청서(도로법 시행규칙 별지 제32호서식) — 빈 서식 (원문 칸 차례 그대로 · 한 쪽)"),
        (4, "도로점용공사(원상회복공사) 준공확인 신청서 — 작성 예시 (도로의 종류 · 허가 · 준공 연월일이 ① 장에서)"),
        (3, "① 무엇을 마쳤나 · 붙일 서류 · 날짜 차례 · 처리 기한(7일) — 작성 예시 (가상의 현장)")]
MULTI = True
SHORT = ("도로점용공사(원상회복공사) 준공확인 신청서(도로법 시행규칙 별지 제32호서식) — 도로를 굴착하는 점용공사나 원상회복공사를 마치면 "
         "도로관리청의 준공확인을 받습니다. 허가 · 준공 연월일과 신청일을 적으면 날짜 차례와 처리 기한(7일)이, 주요지하매설물을 설치했으면 준공도면 제출이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
ROADS = ["고속국도", "일반국도", "특별시도", "광역시도", "지방도", "시도", "군도", "구도"]
GUBUN = ["도로점용공사", "원상회복공사"]
MAESEOL = ["설치하지 않음", "설치함"]

GU_JEOM = "도로의 굴착 · 토지의 형질변경이 따르는 공사를 목적으로 도로점용허가를 받은 자가 그 공사를 마친 뒤(도로법 제62조제2항)"
GU_WON = "점용허가 기간이 끝나거나 허가가 취소되어(또는 원상회복 명령으로) 도로를 원상회복한 뒤(도로법 제73조제1항 · 제2항 · 제3항)"
SEOLYU = "1. 설계도면  2. 지하시설물도(「공간정보의 구축 및 관리 등에 관한 법률 시행령」 별표 1 제1호) — 시행규칙 제30조"
MAE_YES = "＋ 준공도면 — 주요지하매설물을 설치하는 공사를 마쳤으면 그 준공도면을 도로관리청에 냅니다(도로법 제62조제2항 뒷문장)"
MAE_NO = "주요지하매설물을 설치하지 않았으면 준공도면 제출은 없습니다(설계도면 · 지하시설물도는 냅니다)"
JUN_BAD = "⚠ 준공 연월일이 허가 연월일보다 앞입니다"
SIN_BAD = "⚠ 신청일이 준공 연월일보다 앞입니다 — 공사를 마친 뒤에 신청합니다"
CHA_A = "✓ 허가 → 준공 → 신청 차례가 맞습니다 · 준공 뒤 "
CHA_B = "일에 신청"
CH_A = "까지 — 신청서를 받은 날을 1일로 토 · 일 · 공휴일 빼고 7일(처리기간 · 민원처리법 제19조②)"
FEE = "없음(서식 글)"
NEXT = "도로관리청이 현지조사 및 검토 → 결재 → 결과 통보(서식 처리절차) — 확인 결과를 받으면 보관해 둡니다"
BIN_OK = "✓ 신청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ── 작성 예시(가상의 땅 · 사람 · 번호) ─────────────────────────────────
EX = {"구분": "도로점용공사", "매설": "설치하지 않음", "도로종류": "군도", "허가일": D(2027, 3, 2), "준공일": D(2027, 4, 20), "신청일": D(2027, 4, 22)}
EX_S = {"성명": "가나산업(주) 대표이사 홍길동", "생년월일": "000000-0000000", "주소": "가나시 다라구 마바로 12", "전자우편": "gana@example.com",
        "전화": "000-0000-0000", "휴대": "010-0000-0000", "노선명": "군도 3호선(다라 ~ 마바)", "장소": "가나군 다라면 마바리 123-4 일원(공장 진입로 접속부)",
        "면적": "72.0㎡", "구조": "아스팔트 포장 진입로(L=12m · B=6m) · 콘크리트 측구(U형 300)",
        "공사내용": "진입로 접속부 굴착 · 측구 설치 · 되메우기 · 아스팔트 포장", "수신": "가나군수"}

HEAD = "■ 도로법 시행규칙 [별지 제32호서식] <개정 2026. 9. 15.>"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  준공확인 신청 — 무엇을 마쳤나 · 붙일 서류 · 날짜 · 처리 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 도로를 굴착하는 점용공사나 원상회복공사를 마치면 도로관리청의 준공확인을 받습니다(도로법 제62조제2항 · 제73조제3항 · 시행규칙 제30조). "
              "여기 적은 값이 신청서의 도로의 종류 · 허가 연월일 · 준공 연월일 · 신청일로 들어갑니다.")
    g.sec(p, "㉮  무엇을 마쳤나 · 붙일 서류", need=26 * 2 + 36 * 3 + 10)
    p.row([(3, "마친 공사", L), (3, I("구분", ex=_ex(ex, "구분"), dv=",".join(GUBUN), align="center", size=9)),
           (6, "도로점용공사 · 원상회복공사 — 서식 제목 «도로점용공사(원상회복공사)» 둘 중 하나", s7)], h=26)
    p.row([(3, "언제 내나", L),
           (9, F("때", '=IF({구분}="","",IF({구분}="원상회복공사","' + GU_WON + '","' + GU_JEOM + '"))', align="left", size=8.5))], h=36)
    p.row([(3, "주요지하매설물", L), (3, I("매설", ex=_ex(ex, "매설"), dv=",".join(MAESEOL), align="center", size=9)),
           (6, "대통령령으로 정하는 주요 지하 매설물을 설치하는 공사였나", s7)], h=26)
    p.row([(3, "붙일 서류", L), (9, SEOLYU, {"kind": "text", "size": 8.5})], h=36)
    p.row([(3, "준공도면", L),
           (9, F("도면", '=IF({매설}="","",IF({매설}="설치함","' + MAE_YES + '","' + MAE_NO + '"))', align="left", size=8.5))], h=36)
    g.sec(p, "㉯  도로 · 날짜 · 처리 기한", need=26 * 4 + 36 + 44 + 10)
    p.row([(3, "도로의 종류", L), (3, I("도로종류", ex=_ex(ex, "도로종류"), dv=",".join(ROADS), align="center", size=9)),
           (6, "고속국도 · 일반국도 · 특별시도 · 광역시도 · 지방도 · 시도 · 군도 · 구도", s7)], h=26)
    p.row([(3, "허가 연월일", L), (3, I("허가일", ex=_ex(ex, "허가일"), fmt=DT, align="center", size=9)),
           (3, "준공 연월일", L), (3, I("준공일", ex=_ex(ex, "준공일"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "신 청 일", L), (3, I("신청일", ex=_ex(ex, "신청일"), fmt=DT, align="center", size=9)),
           (6, "신청서 끝 날짜로 들어갑니다", s7)], h=26)
    p.row([(3, "날짜 차례", L),
           (9, F("차례", '=IF(OR(N({허가일})=0,N({준공일})=0),"",IF({준공일}<{허가일},"' + JUN_BAD + '",IF(N({신청일})=0,"",'
                 'IF({신청일}<{준공일},"' + SIN_BAD + '","' + CHA_A + '"&({신청일}-{준공일})&"' + CHA_B + '"))))', align="left", size=8.5))], h=36)
    p.row([(3, "처리 기한", L),
           (9, F("처리", '=IF(N({신청일})=0,"",' + _ymd("{처끝}") + '&"("&' + _yo("{처끝}") + '&")' + CH_A + '"&IF(' + MW.덮음식("{신청일}", "{처끝}")
                 + ',"' + MW.밖글 + '",""))', align="left", size=8.5))], h=44)
    p.row([(3, "수 수 료", L), (9, FEE, {"kind": "text", "size": 8.5})], h=26)
    g.sec(p, "㉰  아직 안 적은 칸 · 다음 할 일", need=40 + 40 + 10)
    BIN = [("신청인 성명", '{신청서!성명}=""'), ("주소", '{신청서!주소}=""'), ("도로의 종류", '{도로종류}=""'), ("노선명", '{신청서!노선명}=""'),
           ("점용의 장소", '{신청서!장소}=""'), ("점용면적", '{신청서!면적}=""'), ("점용물의 구조", '{신청서!구조}=""'),
           ("허가 연월일", "N({허가일})=0"), ("준공 연월일", "N({준공일})=0"), ("공사내용", '{신청서!공사내용}=""'), ("신청일", "N({신청일})=0")]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND({도로종류}="",{신청서!성명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))',
                 align="left", size=8.5))], h=40)
    p.row([(2, "다음 할 일", dict(L, size=8.5)), (10, F("다음", '=IF(AND({도로종류}="",{신청서!성명}=""),"","' + NEXT + '")', align="left", size=8))], h=40)
    MW.넣기(p, "{신청일}", 7, "처")
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 허가 · 준공 연월일과 신청일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공장 진입로 접속부 점용공사 — 2027. 4. 20. 준공)."])
    return p


# ── 신청서(한 쪽) ───────────────────────────────────────────────────────
PAX = [120, 135, 227, 271, 340, 370, 476, 545, 629, 681, 750, 758, 869, 886, 955, 994, 1091, 1122]
GA = Grid(PAX)


def _dt(key, src):
    """허가 · 준공 연월일 — 원문 «년 월 일» 자리(칸 오른쪽)"""
    return F(key, '=IF(N({' + src + '})=0,"년          월          일",YEAR({' + src + '})&"년      "&MONTH({' + src + '})&"월      "&DAY({' + src + '})&"일")',
             align="right", size=9)


def form(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "신청서", fit=1, widths=GA.w)
    X1, XL, XM, XH, X2 = 120, 227, 758, 629, 1122

    def inp(k, **kw):
        kw.setdefault("size", 9)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    SB = dict(SUB, size=8.5)
    LB = dict(SUB, size=10)                      # 도로의 종류 · 노선명 … (원문은 신청인 칸 글보다 큼)
    prow(p, GA, [(X1, X2, HEAD, {"kind": "free", "size": 7.5})], h=13)
    p.gap(16)
    prow(p, GA, [(X1, X2, TITLE, {"kind": "free", "size": 17, "bold": True, "align": "center"})], h=28)
    p.gap(16)
    band = dict(SUB, fill=S["gray"], size=8.5)
    rb = prow(p, GA, [(X1, 370, "접수번호", band), (370, 869, "접수일", band), (869, 994, "처리기간", band), (994, X2, "7일", band)], h=27)
    for x in (370, 869):
        vline(p, GA, rb, rb, x, S["gry"])
    p.gap(2)
    # 신청인
    a = prow(p, GA, [(X1, XL, "신청인", dict(SUBC, size=10.5, rs=6)), (XL, XM, "성명(법인인 경우에는 그 명칭 및 대표자의 성명)", SB),
                     (XM, X2, "생년월일\n(외국인등록번호 또는 법인등록번호)", dict(SB, wrap=True))], h=25)
    b = prow(p, GA, [(XL, XM, inp("성명"), NB), (XM, X2, inp("생년월일"), NB)], h=13)
    c = prow(p, GA, [(XL, XM, "주소(법인인 경우에는 주된 사무소의 소재지)", SB), (XM, X2, "전자우편", SB)], h=14)
    d = prow(p, GA, [(XL, XM, inp("주소", size=8.5), NB), (XM, X2, inp("전자우편", size=8.5), NB)], h=21)
    e = prow(p, GA, [(XL, X2, "연락처", SB)], h=14)
    f = prow(p, GA, [(XL, 370, "(전화)", dict(FRC, size=8.5)), (370, 681, inp("전화", size=8.5), NB), (681, XM, "(휴대전화)", dict(FRC, size=8.5)),
                     (XM, X2, inp("휴대", size=8.5), NB)], h=24)
    for r in (b, d):
        hline(p, GA, r, XL, X2, S["lgt"])
    vline(p, GA, a, d, XM, S["lgt"])
    vline(p, GA, a, f, XL, S["lgt"])
    hline(p, GA, a, X1, X2, S["gry"], below=False)
    hline(p, GA, f, X1, X2, S["thin"])
    p.gap(3)                                     # 원문 겹줄(가는 줄 548 · 굵은 줄 553 ~ 555)
    # 도로 · 점용 · 날짜 · 공사내용 (줄마다 연한 가로줄 · 장소 | 면적 · 허가 | 준공 은 629)
    r1 = prow(p, GA, [(X1, X2, "도로의 종류", LB)], h=14)
    r2 = prow(p, GA, [(X1, X2, F("표도로", '=IF({셈!도로종류}="","",{셈!도로종류})', align="left", size=9.5), NB)], h=21)
    r3 = prow(p, GA, [(X1, X2, "노선명", LB)], h=14)
    r4 = prow(p, GA, [(X1, X2, inp("노선명", size=9), NB)], h=21)
    r5 = prow(p, GA, [(X1, XH, "점용의 장소", LB), (XH, X2, "점용면적", LB)], h=14)
    r6 = prow(p, GA, [(X1, XH, inp("장소", size=8.5), NB), (XH, X2, inp("면적", size=9), NB)], h=21)
    r7 = prow(p, GA, [(X1, X2, "점용물의 구조", LB)], h=14)
    r8 = prow(p, GA, [(X1, X2, inp("구조", size=8.5), NB)], h=21)
    r9 = prow(p, GA, [(X1, XH, "허가연월일", LB), (XH, X2, "준공연월일", LB)], h=14)
    r10 = prow(p, GA, [(X1, 545, _dt("표허가", "셈!허가일"), NB), (545, XH, "", NB), (XH, 1091, _dt("표준공", "셈!준공일"), NB), (1091, X2, "", NB)], h=21)
    r11 = prow(p, GA, [(X1, X2, "공사내용", LB)], h=14)
    r12 = prow(p, GA, [(X1, X2, inp("공사내용", size=8.5), NB)], h=21)
    for r in (r2, r4, r6, r8, r10):
        hline(p, GA, r, X1, X2, S["lgt"])
    vline(p, GA, r5, r6, XH, S["lgt"])
    vline(p, GA, r9, r10, XH, S["lgt"])
    hline(p, GA, r1, X1, X2, S["med"], below=False)
    hline(p, GA, r12, X1, X2, S["med"])
    p.gap(8)
    prow(p, GA, [(X1, X2, "「도로법」 제62조제2항, 제73조제3항 및 같은 법 시행규칙 제30조에 따라 위와 같이 도로점용공사(원상회복공사)를 완료하였기에 준공확인을 신청합니다.",
                  {"kind": "free", "size": 9.5, "indent": 2, "wrap": True})], h=36)
    p.gap(26)
    prow(p, GA, [(X1, X2, F("신청일표시", '=IF(N({셈!신청일})=0,"년         월         일",YEAR({셈!신청일})&"년      "&MONTH({셈!신청일})&"월      "&DAY({셈!신청일})&"일")',
                             align="right", size=9), NB)], h=20)
    p.gap(10)
    prow(p, GA, [(X1, 545, "", NB), (545, 681, "신청인(시행자)", dict(FRC, size=9.5)), (681, 994, F("신청인표시", '=IF({성명}="","",{성명})', align="center", size=8.5), NB),
                 (994, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=20)
    p.gap(8)
    r = prow(p, GA, [(X1, 476, inp("수신", blank="도로관리청", size=12, bold=True, align="center"), NB), (476, X2, "귀하", dict(FR, size=9.5))], h=24)
    hline(p, GA, r, X1, X2, S["med"])
    p.gap(15)
    tx = {"kind": "free", "size": 8, "align": "left", "wrap": True}
    rs = prow(p, GA, [(X1, XL, "신청인\n제출서류", dict(FRC, size=8, wrap=True)),
                      (XL, 994, "1. 설계도면\n2. 「공간정보의 구축 및 관리 등에 관한 법률 시행령」 별표 1 제1호에 따른 지하시설물도", tx),
                      (994, X2, "수수료\n없음", dict(FRC, size=8, wrap=True))], h=53)
    hline(p, GA, rs, X1, X2, S["gry"], below=False)
    hline(p, GA, rs, X1, X2, S["lgt"])
    for x in (XL, 994):
        vline(p, GA, rs, rs, x, S["gry"])
    p.gap(4)
    rb2 = prow(p, GA, [(X1, X2, "처리절차", {"kind": "free", "size": 9, "align": "center", "fill": S["band"]})], h=27)
    hline(p, GA, rb2, X1, X2, S["thin"], below=False)
    p.gap(7)
    box = {"kind": "free", "size": 8, "align": "center", "wrap": True}
    arw = {"kind": "free", "size": 9, "align": "center"}
    rx = prow(p, GA, [(X1, 135, "", NB), (135, 271, "신청서\n작성", box), (271, 340, "➔", arw), (340, 476, "접수", box), (476, 545, "➔", arw),
                      (545, 681, "현지조사 및\n검토", box), (681, 750, "➔", arw), (750, 886, "결재", box), (886, 955, "➔", arw), (955, 1091, "결과 통보", box),
                      (1091, X2, "", NB)], h=28)
    for x1, x2 in ((135, 271), (340, 476), (545, 681), (750, 886), (955, 1091)):
        hline(p, GA, rx, x1, x2, S["gry"], below=False)
        hline(p, GA, rx, x1, x2, S["gry"])
        vline(p, GA, rx, rx, x1, S["gry"])
        vline(p, GA, rx, rx, x2, S["gry"])
    sm = {"kind": "free", "size": 7.5, "align": "center"}
    r = prow(p, GA, [(X1, 135, "", NB), (135, 271, "신청인", sm), (271, 340, "", NB), (340, 476, "도로관리청", sm), (476, 545, "", NB), (545, 681, "도로관리청", sm),
                     (681, 750, "", NB), (750, 886, "도로관리청", sm), (886, 955, "", NB), (955, 1091, "도로관리청", sm), (1091, X2, "", NB)], h=16)
    p.gap(12)
    r = prow(p, GA, [(X1, X2, "", NB)], h=2)
    hline(p, GA, r, X1, X2, S["lgt"], below=False)
    p.gap(14)
    prow(p, GA, [(X1, X2, "210㎜×297㎜[백상지 80g/㎡(재활용품)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["도로의 종류 · 허가 연월일 · 준공 연월일 · 신청일은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 장소)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
YOIL = "월화수목금토일"


def _ymdp(d):
    return f"{d.year}. {d.month}. {d.day}."


def _dtp(d, blank):
    return blank if not d else f"{d.year}년      {d.month}월      {d.day}일"


def expect(pages):
    sm, fr = pages["셈"], pages["신청서"]
    a, b = {}, {}
    gu, mae, rd = sm.get("구분"), sm.get("매설"), sm.get("도로종류")
    hd, jd, sd = sm.get("허가일"), sm.get("준공일"), sm.get("신청일")
    a["때"] = "" if not gu else (GU_WON if gu == "원상회복공사" else GU_JEOM)
    a["도면"] = "" if not mae else (MAE_YES if mae == "설치함" else MAE_NO)
    if not hd or not jd:
        a["차례"] = ""
    elif jd < hd:
        a["차례"] = JUN_BAD
    elif not sd:
        a["차례"] = ""
    elif sd < jd:
        a["차례"] = SIN_BAD
    else:
        a["차례"] = f"{CHA_A}{(sd - jd).days}{CHA_B}"
    if not sd:
        a["처리"] = ""
    else:
        dd = MW.처리끝(sd, 7)
        a["처리"] = f"{_ymdp(dd)}({YOIL[dd.weekday()]}){CH_A}" + ("" if MW.다덮음(sd, dd) else MW.밖글)
    for k in range(1, MW.되풀이 + 1):
        a["처끝" if k == MW.되풀이 else f"처E{k}"] = "" if not sd else MW.식흉내(sd, 7, k)
    keys = [("신청인 성명", not fr.get("성명")), ("주소", not fr.get("주소")), ("도로의 종류", not rd), ("노선명", not fr.get("노선명")),
            ("점용의 장소", not fr.get("장소")), ("점용면적", not fr.get("면적")), ("점용물의 구조", not fr.get("구조")),
            ("허가 연월일", not hd), ("준공 연월일", not jd), ("공사내용", not fr.get("공사내용")), ("신청일", not sd)]
    if not rd and not fr.get("성명"):
        a["빈칸"] = ""
        a["다음"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
        a["다음"] = NEXT
    b["표도로"] = rd or ""
    b["표허가"] = _dtp(hd, "년          월          일")
    b["표준공"] = _dtp(jd, "년          월          일")
    b["신청일표시"] = "년         월         일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    b["신청인표시"] = fr.get("성명") or ""
    return {"셈": a, "신청서": b}
