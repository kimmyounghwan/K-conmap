# -*- coding: utf-8 -*-
"""장비 관리(임대료 · 수금 · 미수금) — 원본 틀(장비관리 · 거래내역원장 · 장비임대료수금원장 · 기사명등록 · 거래처등록 · 경비사용 및 장비관리비 메모 ·
청구서)을 새로 만든 것 (2026-09-29).
■ 원본은 매크로 단추(가나다순 정렬 · 청구서 인쇄)와 열 전체 참조(G:G) · 띄어쓰기 맞추기에 기대던 프로그램 — 새 파일은 매크로 없이 수식만:
  · 거래내역 · 수금원장의 기사명 · 거래처는 등록 시트 목록에서 고르기(띄어쓰기 틀릴 일 없음)
  · 금액 = 시간 × 단가(단가를 비우면 기사명등록의 시간당 단가)
  · 장비관리(업체별 · 기사별) = 등록 목록을 따라 임대료 · 기수급금(유류대 포함) · 미수급금 · 비율을 SUMIF 로 모음
  · 거래내역의 «수금 / 미수금» 표시 = 그 거래처의 이 줄까지 누계 ≤ 기수급금(유류대 포함)이면 수금 — 원본은 거래처와 상관없이 전체 누계로 비교해 틀렸음
  · 청구서 = 거래처(와 기간)를 고르면 그 거래처의 거래내역이 저절로 채워짐(INDEX/MATCH) — 원본의 매크로 대신
■ 원본 장비관리의 «장비임대율분석 − 기수급금율» 같은 뜻 없는 칸(S9 = O9 − Q9)은 수금률 · 미수율로 바로잡음. 청구서 날짜는 TODAY() 대신 작성일 칸.
■ 기사별 현황의 «거래은행 구좌번호» 칸은 뺌(개인 계좌번호) — 비고로."""
import datetime

from openpyxl.worksheet.datavalidation import DataValidation

import docw as d
from fb import F, I

SLUG = "o-jangbi-gwanri"
TITLE = "장비관리 프로그램(임대료·수금)"
WHERE = "orig"
PREV = [(13, "장비관리(업체별 · 기사별 현황) — 작성 예시"), (14, "거래내역원장 — 작성 예시"), (24, "청구서 — 작성 예시"),
        (18, "장비임대료 수금원장 — 작성 예시")]
PAGES = 12
NSHEETS = 7
MULTI = True
SHORT = ("건설장비 임대 · 운영 장부 — 거래내역(시간 × 단가)과 수금을 적으면 업체별 · 기사별 임대료 · 기수급금(유류대 포함) · 미수급금 · 수금률이 모이고, "
         "거래처를 고르면 청구서가 저절로 채워집니다. 매크로 없이 수식만 씁니다.")
NOTE = "기사명 · 거래처는 등록 시트에 먼저 적고 목록에서 고르세요(원본의 «띄어쓰기를 똑같이» 문제를 없앴습니다). 기사 계좌번호 칸은 뺐습니다."

D = datetime.date
L = {"kind": "label"}
H = {"kind": "head"}
FR = {"kind": "free"}
S = {"kind": "sum"}
NB = {"border": False}
WON = '#,##0;[Red]-#,##0;""'
WON0 = '#,##0;[Red]-#,##0;0'
NK, NC, NT, NS, NE, NB_ = 15, 15, 100, 50, 40, 30

KISA = [("김기사", "굴삭기 06W", "예시-01", 65_000, "000-0000-0001"), ("이기사", "굴삭기 03W", "예시-02", 55_000, "000-0000-0002"),
        ("박기사", "덤프트럭 15t", "예시-03", 50_000, "000-0000-0003")]
GEORAE = [("가나건설(주)", "가나지구 배수로 정비", "김가나", "000-000-0001", "000-000-0101", "가나시 가나로 1", "000-00-00001"),
          ("다라토건(주)", "다라지구 도로 확장", "이다라", "000-000-0002", "", "다라시 다라로 2", "000-00-00002"),
          ("마바산업(주)", "마바 물류창고 부지", "박마바", "000-000-0003", "", "마바시 마바로 3", "000-00-00003")]
# (년, 월, 일, 기사, 장비, 거래처, 시간, 단가(비우면 등록 단가), 유류대, 현장, 비고)
TR = [(2026, 8, 3, "김기사", "굴삭기 06W", "가나건설(주)", 8, None, 0, "가나지구 배수로 정비", ""),
      (2026, 8, 4, "김기사", "굴삭기 06W", "가나건설(주)", 8, None, 0, "가나지구 배수로 정비", ""),
      (2026, 8, 5, "이기사", "굴삭기 03W", "다라토건(주)", 6, None, 0, "다라지구 도로 확장", ""),
      (2026, 8, 6, "박기사", "덤프트럭 15t", "가나건설(주)", 9, None, 120_000, "가나지구 배수로 정비", "유류 거래처 부담"),
      (2026, 8, 10, "김기사", "굴삭기 06W", "마바산업(주)", 8, 70_000, 0, "마바 물류창고 부지", "야간 단가"),
      (2026, 8, 11, "이기사", "굴삭기 03W", "다라토건(주)", 8, None, 0, "다라지구 도로 확장", ""),
      (2026, 9, 1, "김기사", "굴삭기 06W", "가나건설(주)", 7, None, 0, "가나지구 배수로 정비", ""),
      (2026, 9, 2, "박기사", "덤프트럭 15t", "다라토건(주)", 8, None, 0, "다라지구 도로 확장", "")]
SU = [(2026, 8, 31, "가나건설(주)", 1_200_000, "김기사", "8월분 일부"), (2026, 8, 31, "다라토건(주)", 770_000, "이기사", "8월분"),
      (2026, 9, 15, "마바산업(주)", 560_000, "김기사", "8월분")]
GY = [(2026, 8, 12, "장비관리비", "굴삭기 06W 엔진오일 교환", 180_000), (2026, 8, 20, "경비", "현장 이동 톨게이트 · 주차", 24_000),
      (2026, 9, 3, "장비관리비", "덤프트럭 타이어 교체(2본)", 640_000)]


def _pg(bk, ex, lg, widths, land=False, fit=0, pc=None):
    return bk.page(lg, widths, ex=ex, fit_height=fit, landscape=land, sheetname=lg if not ex else "예시-" + lg,
                   margins=(0.4, 0.4, 0.5, 0.5), print_cols=pc)


def _rng(p, key, n):
    p.k[f"{key}[]"] = f"{p.k[f'{key}#1']}:{p.k[f'{key}#{n}']}"


# ── 등록 시트 ────────────────────────────────────────────────────────────
def kisa(bk, ex):
    Wk = [5, 12, 14, 10, 11, 14, 14]
    p = _pg(bk, ex, "기사명등록", Wk, fit=1)
    p.row([(7, "기 사 명  등 록", {"kind": "title", "size": 16})], h=32)
    p.row([(7, "여기 적은 기사명이 거래내역 · 수금원장의 목록으로 나옵니다. 시간당 단가는 거래내역에서 단가를 비우면 쓰입니다.", {"kind": "note"})], h=16)
    p.row([(1, "번호", H), (1, "기 사 명", H), (1, "장 비 명", H), (1, "장비번호", H), (1, "시간당 단가", H), (1, "연 락 처", H), (1, "비   고", H)], h=24)
    for i in range(1, NK + 1):
        e = KISA[i - 1] if (ex and i <= len(KISA)) else (None,) * 5
        p.row([(1, i, {"kind": "ctext", "size": 9}), (1, I(f"기사#{i}", ex=e[0], align="center")), (1, I(f"장비#{i}", ex=e[1], size=9.5)),
               (1, I(f"번호#{i}", ex=e[2], align="center", size=9.5)), (1, I(f"단가#{i}", ex=e[3], fmt=WON)), (1, I(f"연락#{i}", ex=e[4], align="center", size=9.5)),
               (1, I(f"기비고#{i}", size=9))], h=21)
    _rng(p, "기사", NK)
    p.k["기사표"] = f"{p.k['기사#1']}:{p.k[f'단가#{NK}']}"
    p.end_print()
    p.after_note(["원본의 «가나다순 정렬» 단추(매크로)는 없앴습니다 — 순서는 상관없습니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 기사 · 번호)."])
    return p


def georaecheo(bk, ex):
    Wc = [5, 14, 16, 9, 12, 12, 18, 13]
    p = _pg(bk, ex, "거래처등록", Wc, fit=1, land=True)
    p.row([(8, "거 래 처  등 록", {"kind": "title", "size": 16})], h=32)
    p.row([(8, "여기 적은 거래처가 거래내역 · 수금원장 · 청구서의 목록과 장비관리(업체별 현황)에 나옵니다.", {"kind": "note"})], h=16)
    p.row([(1, "번호", H), (1, "거 래 처", H), (1, "현 장 명", H), (1, "대 표", H), (1, "연 락 처", H), (1, "팩 스", H), (1, "주    소", H), (1, "사업자등록번호", dict(H, size=9))], h=24)
    for i in range(1, NC + 1):
        e = GEORAE[i - 1] if (ex and i <= len(GEORAE)) else (None,) * 7
        p.row([(1, i, {"kind": "ctext", "size": 9}), (1, I(f"거래처#{i}", ex=e[0])), (1, I(f"현장#{i}", ex=e[1], size=9.5)), (1, I(f"대표#{i}", ex=e[2], align="center")),
               (1, I(f"전화#{i}", ex=e[3], align="center", size=9.5)), (1, I(f"팩스#{i}", ex=e[4] or None, align="center", size=9.5)),
               (1, I(f"주소#{i}", ex=e[5], size=9)), (1, I(f"사업자#{i}", ex=e[6], align="center", size=9))], h=21)
    _rng(p, "거래처", NC)
    p.end_print()
    p.after_note(["원본의 «가나다순 정렬» 단추(매크로)는 없앴습니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 번호)."])
    return p


# ── 거래내역원장 ─────────────────────────────────────────────────────────
def georae(bk, ex):
    Wt = [5.5, 4, 4, 9, 11, 13, 6, 9, 11, 9, 16, 10, 8] + [10, 6, 6]
    p = _pg(bk, ex, "거래내역원장", Wt, land=True, pc=13)
    p.row([(13, "거 래 내 역 원 장", {"kind": "title", "size": 16})], h=30)
    p.row([(4, "합   계  (거르기 하면 보이는 줄만)", dict(S, size=9)), (2, "금    액", L),
           (2, F("금액합", '=SUBTOTAL(9,{금액[]})', fmt=WON0, bold=True)), (2, "유 류 대", L), (2, F("유류합", '=SUBTOTAL(9,{유류[]})', fmt=WON0, bold=True)), (1, "", FR)], h=24)
    p.row([(1, "년", H), (1, "월", H), (1, "일", H), (1, "기 사 명", H), (1, "장 비 명", H), (1, "거 래 처", H), (1, "시간", H), (1, "단  가", H), (1, "금    액", H),
           (1, "유 류 대", H), (1, "현 장 명", H), (1, "비  고", H), (1, "수금 여부", dict(H, size=8.5)),
           (1, "날짜(도움)", dict(H, size=8)), (1, "청구", dict(H, size=8)), (1, "순번", dict(H, size=8))], h=24)
    p.ws.print_title_rows = f"{p.r - 1}:{p.r - 1}"
    tk = "{청구서!거래처}"
    for i in range(1, NT + 1):
        e = TR[i - 1] if (ex and i <= len(TR)) else (None,) * 11
        rate = (f'IF(N({{단가#{i}}})>0,{{단가#{i}}},IFERROR(VLOOKUP({{기사#{i}}},{{기사명등록!기사표}},4,0),0))')
        p.row([(1, I(f"년#{i}", ex=e[0], fmt='0;;""', align="center", size=9)), (1, I(f"월#{i}", ex=e[1], fmt='0;;""', align="center", size=9)),
               (1, I(f"일#{i}", ex=e[2], fmt='0;;""', align="center", size=9)), (1, I(f"기사#{i}", ex=e[3], dv="@기사", align="center", size=9.5)),
               (1, I(f"장비#{i}", ex=e[4], size=9)), (1, I(f"거래처#{i}", ex=e[5], dv="@거래처", size=9)),
               (1, I(f"시간#{i}", ex=e[6], fmt='#,##0.#;;""', align="center", size=9.5)), (1, I(f"단가#{i}", ex=e[7], fmt=WON, size=9)),
               (1, F(f"금액#{i}", f'=IF(OR(N({{시간#{i}}})=0,{rate}=0),"",ROUND({{시간#{i}}}*{rate},0))', fmt=WON, size=9.5)),
               (1, I(f"유류#{i}", ex=e[8] or None, fmt=WON, size=9)), (1, I(f"현장#{i}", ex=e[9], size=8.5)), (1, I(f"비고#{i}", ex=e[10] or None, size=8)),
               (1, F(f"상태#{i}", f'=IF(OR({{거래처#{i}}}="",{{금액#{i}}}=""),"",IF(SUMIF({{거래처#1}}:{{거래처#{i}}},{{거래처#{i}}},{{금액#1}}:{{금액#{i}}})'
                                 f'<=SUMIF({{장비임대료수금원장!거래처[]}},{{거래처#{i}}},{{장비임대료수금원장!수금[]}})+SUMIF({{거래처[]}},{{거래처#{i}}},{{유류[]}}),"수금","미수금"))',
                     align="center", size=9)),
               (1, F(f"날짜#{i}", f'=IF(OR(N({{년#{i}}})=0,N({{월#{i}}})=0,N({{일#{i}}})=0),"",DATE({{년#{i}}},{{월#{i}}},{{일#{i}}}))', fmt="yyyy-mm-dd", size=8)),
               (1, F(f"청구#{i}", f'=IF(AND({{거래처#{i}}}<>"",{{거래처#{i}}}={tk},{{금액#{i}}}<>"",OR(N({{청구서!시작}})=0,AND({{날짜#{i}}}<>"",N({{날짜#{i}}})>=N({{청구서!시작}}))),'
                                 f'OR(N({{청구서!끝}})=0,AND({{날짜#{i}}}<>"",N({{날짜#{i}}})<=N({{청구서!끝}})))),1,0)', fmt="0", size=8)),
               (1, F(f"순번#{i}", f'=IF({{청구#{i}}}=1,SUM({{청구#1}}:{{청구#{i}}}),"")', fmt="0", size=8))], h=19)
    for k in ("거래처", "금액", "유류", "기사", "청구", "순번", "년", "월", "일", "장비", "현장", "시간", "비고"):
        _rng(p, k, NT)
    p.end_print()
    p.after_note(["기사명 · 거래처는 칸을 누르면 나오는 목록에서 고르세요(등록 시트). 단가를 비우면 기사명등록의 시간당 단가로 셈합니다.",
                  "수금 여부 = 그 거래처의 이 줄까지 금액 누계가 기수급금(수금원장 합 + 유류대)보다 작거나 같으면 «수금». 오른쪽 회색 세 칸은 청구서를 채우는 도움 칸입니다(지우지 마세요)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 거래)."])
    return p


def sugeum(bk, ex):
    Ws = [6, 4.5, 4.5, 16, 13, 12, 26]
    p = _pg(bk, ex, "장비임대료수금원장", Ws)
    p.row([(7, "장 비 임 대 료  수 금 원 장", {"kind": "title", "size": 16})], h=30)
    p.row([(3, "합   계", S), (1, "", S), (1, F("수금합", '=SUBTOTAL(9,{수금[]})', fmt=WON0, bold=True)), (2, "", FR)], h=24)
    p.row([(1, "년", H), (1, "월", H), (1, "일", H), (1, "거 래 처", H), (1, "수 금 액", H), (1, "기 사 명", H), (1, "내    용", H)], h=24)
    p.ws.print_title_rows = f"{p.r - 1}:{p.r - 1}"
    for i in range(1, NS + 1):
        e = SU[i - 1] if (ex and i <= len(SU)) else (None,) * 7
        p.row([(1, I(f"년#{i}", ex=e[0], fmt='0;;""', align="center", size=9)), (1, I(f"월#{i}", ex=e[1], fmt='0;;""', align="center", size=9)),
               (1, I(f"일#{i}", ex=e[2], fmt='0;;""', align="center", size=9)), (1, I(f"거래처#{i}", ex=e[3], dv="@거래처", size=9.5)),
               (1, I(f"수금#{i}", ex=e[4], fmt=WON, size=9.5)), (1, I(f"기사#{i}", ex=e[5], dv="@기사", align="center", size=9.5)),
               (1, I(f"내용#{i}", ex=e[6], size=9))], h=19)
    for k in ("거래처", "수금", "기사"):
        _rng(p, k, NS)
    d.done(p)
    p.after_note(["거래처 · 기사명은 목록에서 고르세요. 기사명은 기사별 수금현황에 쓰입니다(모르면 비워도 됨)."] if not ex else ["이 시트는 작성 예시입니다."])
    return p


def gyeongbi(bk, ex):
    We = [6, 4.5, 4.5, 11, 36, 13, 12]
    p = _pg(bk, ex, "경비사용및장비관리비메모", We)
    p.row([(7, "경비 사용 및 장비관리비 메모", {"kind": "title", "size": 16})], h=30)
    p.row([(3, "합   계", S), (2, F("경비합계", '=SUBTOTAL(9,{경금액[]})', fmt=WON0, bold=True)), (2, "", FR)], h=22)
    p.row([(3, "경    비", L), (2, F("경비소계", '=SUMIF({구분[]},"경비",{경금액[]})', fmt=WON0)), (2, "", FR)], h=20)
    p.row([(3, "장비관리비", L), (2, F("관리소계", '=SUMIF({구분[]},"장비관리비",{경금액[]})', fmt=WON0)), (2, "", FR)], h=20)
    p.row([(1, "년", H), (1, "월", H), (1, "일", H), (1, "구  분", H), (1, "내          용", H), (1, "금    액", H), (1, "비  고", H)], h=24)
    p.ws.print_title_rows = f"{p.r - 1}:{p.r - 1}"
    for i in range(1, NE + 1):
        e = GY[i - 1] if (ex and i <= len(GY)) else (None,) * 6
        p.row([(1, I(f"년#{i}", ex=e[0], fmt='0;;""', align="center", size=9)), (1, I(f"월#{i}", ex=e[1], fmt='0;;""', align="center", size=9)),
               (1, I(f"일#{i}", ex=e[2], fmt='0;;""', align="center", size=9)), (1, I(f"구분#{i}", ex=e[3], dv="경비,장비관리비", align="center", size=9)),
               (1, I(f"경내용#{i}", ex=e[4], size=9.5)), (1, I(f"경금액#{i}", ex=e[5], fmt=WON, size=9.5)), (1, I(f"경비고#{i}", size=9))], h=19)
    for k in ("구분", "경금액"):
        _rng(p, k, NE)
    d.done(p)
    p.after_note(["구분은 «경비» 또는 «장비관리비» 에서 고르면 위에 따로 모입니다."] if not ex else ["이 시트는 작성 예시입니다."])
    return p


# ── 장비관리(요약) ───────────────────────────────────────────────────────
def gwanri(bk, ex):
    Wg = [5, 14, 9, 12, 12, 12, 8, 8, 8, 10, 13]
    p = _pg(bk, ex, "장비관리", Wg, fit=1)          # 원본처럼 세로(가로면 두 표가 쪽 높이에 맞춰 너무 작아짐)
    p.row([(11, F("관리제목", '=IF(N({연도})=0,"장 비 관 리","장 비 관 리  "&{연도})', align="center", size=18, bold=True), {"kind": "title"})], h=34)
    p.row([(8, "", FR), (2, "연도(제목용)", {"kind": "free", "align": "right", "size": 9}), (1, I("연도", ex=2026, fmt='0;;""', align="center"))], h=20)
    for part, (src_lg, src_key, n, name_col, pre) in (("업체별 현황", ("거래처등록", "거래처", NC, "거래처", "업")), ("기사별 수금 현황", ("기사명등록", "기사", NK, "기사명", "기"))):
        byk = src_key          # 거래내역 · 수금원장에서 모을 열 이름
        p.gap(6)
        p.row([(11, f"■  {part}", {"kind": "h2", "size": 12})], h=22)
        p.row([(1, "번호", H), (1, name_col, H), (1, "대표" if pre == "업" else "장비번호", H), (1, "장비 임대료", H), (1, "기수급금\n(유류대 포함)", dict(H, size=8.5)),
               (1, "미수급금", H), (1, "임대료\n비율", dict(H, size=8.5)), (1, "수금률", H), (1, "미수율", H), (1, "유 류 대", H), (1, "연 락 처", H)], h=30)
        for i in range(1, n + 1):
            nm = f"{pre}이름#{i}"
            side = (f'=IF({{{src_lg}!거래처#{i}}}="","",{{{src_lg}!대표#{i}}})' if pre == "업" else f'=IF({{{src_lg}!기사#{i}}}="","",{{{src_lg}!번호#{i}}})')
            tel = (f'=IF({{{src_lg}!거래처#{i}}}="","",{{{src_lg}!전화#{i}}})' if pre == "업" else f'=IF({{{src_lg}!기사#{i}}}="","",{{{src_lg}!연락#{i}}})')
            su = (f'SUMIF({{장비임대료수금원장!{byk}[]}},{{{nm}}},{{장비임대료수금원장!수금[]}})')
            p.row([(1, i, {"kind": "ctext", "size": 9}),
                   (1, F(nm, f'=IF({{{src_lg}!{src_key}#{i}}}="","",{{{src_lg}!{src_key}#{i}}})', align="left", size=9.5)),
                   (1, F(f"{pre}옆#{i}", side, align="center", size=9)),
                   (1, F(f"{pre}임대#{i}", f'=IF({{{nm}}}="","",SUMIF({{거래내역원장!{byk}[]}},{{{nm}}},{{거래내역원장!금액[]}}))', fmt=WON0, size=9.5)),
                   (1, F(f"{pre}기수#{i}", f'=IF({{{nm}}}="","",{su}+N({{{pre}유류#{i}}}))', fmt=WON0, size=9.5)),
                   (1, F(f"{pre}미수#{i}", f'=IF({{{nm}}}="","",N({{{pre}임대#{i}}})-N({{{pre}기수#{i}}}))', fmt=WON0, size=9.5)),
                   (1, F(f"{pre}비율#{i}", f'=IF(OR({{{nm}}}="",N({{{pre}임대계}})=0),"",N({{{pre}임대#{i}}})/{{{pre}임대계}})', fmt="0.0%", align="center", size=9)),
                   (1, F(f"{pre}수금률#{i}", f'=IF(OR({{{nm}}}="",N({{{pre}임대#{i}}})=0),"",N({{{pre}기수#{i}}})/{{{pre}임대#{i}}})', fmt="0.0%", align="center", size=9)),
                   (1, F(f"{pre}미수율#{i}", f'=IF(OR({{{nm}}}="",N({{{pre}임대#{i}}})=0),"",N({{{pre}미수#{i}}})/{{{pre}임대#{i}}})', fmt="0.0%", align="center", size=9)),
                   (1, F(f"{pre}유류#{i}", f'=IF({{{nm}}}="","",SUMIF({{거래내역원장!{byk}[]}},{{{nm}}},{{거래내역원장!유류[]}}))', fmt=WON0, size=9)),
                   (1, F(f"{pre}전화#{i}", tel, align="center", size=9))], h=20)
        for k in ("이름", "임대", "기수", "미수", "유류"):
            _rng(p, f"{pre}{k}", n)
        p.row([(3, "총      계", S), (1, F(f"{pre}임대계", f'=SUM({{{pre}임대[]}})', fmt=WON0, bold=True)), (1, F(f"{pre}기수계", f'=SUM({{{pre}기수[]}})', fmt=WON0, bold=True)),
               (1, F(f"{pre}미수계", f'=SUM({{{pre}미수[]}})', fmt=WON0, bold=True)),
               (1, F(f"{pre}비율계", f'=IF(N({{{pre}임대계}})=0,"",1)', fmt="0.0%", align="center", size=9)),
               (1, F(f"{pre}수금률계", f'=IF(N({{{pre}임대계}})=0,"",{{{pre}기수계}}/{{{pre}임대계}})', fmt="0.0%", align="center", bold=True, size=9)),
               (1, F(f"{pre}미수율계", f'=IF(N({{{pre}임대계}})=0,"",{{{pre}미수계}}/{{{pre}임대계}})', fmt="0.0%", align="center", bold=True, size=9)),
               (1, F(f"{pre}유류계", f'=SUM({{{pre}유류[]}})', fmt=WON0, bold=True)), (1, "", S)], h=22)
    p.row([(11, F("관리대조", '=IF(ROUND({업임대계}-SUM({거래내역원장!금액[]}),0)=0,"","⚠ 거래내역 금액 합계와 업체별 임대료 합계가 다릅니다 — 거래처등록에 없는 거래처가 거래내역에 있는지 보세요.")',
                  align="left", size=9), {"kind": "warn"})], h=16)
    p.end_print()
    p.after_note(["노란 칸 없이 모두 자동입니다. 업체 · 기사 목록은 등록 시트를 따라옵니다. 미수급금 = 장비 임대료 − 기수급금(수금 합 + 유류대).",
                  "원본의 «장비임대율분석 − 기수급금율» 처럼 뜻이 없는 칸은 수금률 · 미수율로 바로잡았습니다."] if not ex else ["이 시트는 작성 예시입니다."])
    return p


# ── 청구서 ───────────────────────────────────────────────────────────────
def cheonggu(bk, ex):
    Wb = [6, 4.5, 4.5, 16, 20, 7, 12, 10, 12]
    p = _pg(bk, ex, "청구서", Wb, fit=1)
    p.row([(9, "청     구     서", {"kind": "title", "size": 24})], h=48)
    p.gap(6)
    p.row([(2, "작 성 일", L), (2, I("작성일", ex=D(2026, 9, 30), fmt="ymd", align="center")), (1, "", FR), (1, "상 호", L), (3, I("우리상호", ex="예시장비(주)"))], h=24)
    p.row([(2, "거 래 처", L), (2, I("거래처", ex="가나건설(주)", dv="@거래처", align="center", bold=True)), (1, "귀 하", {"kind": "free", "bold": True}),
           (1, "대 표", L), (3, I("우리대표", ex="최사장"))], h=24)
    p.row([(2, "기    간", L), (1, I("시작", fmt="ymd", align="center", size=8.5)), (1, I("끝", fmt="ymd", align="center", size=8.5)), (1, "", FR),
           (1, "T E L", L), (3, I("우리전화", ex="000-0000-0000"))], h=24)
    p.row([(9, "※ 기간을 비우면 그 거래처의 모든 거래를 적습니다. 거래처는 목록에서 고르세요.", {"kind": "note"})], h=15)
    p.gap(4)
    p.row([(2, "청구 금액\n(미수급금)", dict(S, size=9.5)), (3, F("청구액", '=IF({거래처}="","",SUMIF({장비관리!업이름[]},{거래처},{장비관리!업미수[]}))', fmt='"₩ "#,##0;[Red]"₩ "-#,##0;"₩ 0"', bold=True, size=13)),
           (1, "원", {"kind": "free"}), (3, F("청구한글", '=IF(N({청구액})<=0,"",{청구액})', fmt="hangul", align="left", size=9), NB)], h=30)
    p.gap(6)
    p.row([(1, "년", H), (1, "월", H), (1, "일", H), (1, "장 비 명", H), (1, "현 장 명", H), (1, "시간", H), (1, "금    액", H), (1, "유 류 대", H), (1, "비  고", H)], h=24)
    for k in range(1, NB_ + 1):
        m = f'MATCH({k},{{거래내역원장!순번[]}},0)'
        cols = []
        for key, src, fmt, al in (("청년", "년", '0;;""', "center"), ("청월", "월", '0;;""', "center"), ("청일", "일", '0;;""', "center"),
                                  ("청장비", "장비", None, "left"), ("청현장", "현장", None, "left"), ("청시간", "시간", '#,##0.#;;""', "center"),
                                  ("청금액", "금액", WON, None), ("청유류", "유류", WON, None), ("청비고", "비고", None, "left")):
            f = f'=IFERROR(INDEX({{거래내역원장!{src}[]}},{m})&"","")' if fmt is None else f'=IFERROR(N(INDEX({{거래내역원장!{src}[]}},{m})),"")'
            cols.append((1, F(f"{key}#{k}", f, fmt=fmt, align=al, size=8.5 if src in ("현장", "비고") else 9)))
        p.row(cols, h=19)
    for k in ("청금액", "청유류"):
        _rng(p, k, NB_)
    p.row([(6, "합      계 (위 목록)", S), (1, F("청금액계", '=SUM({청금액[]})', fmt=WON0, bold=True)), (1, F("청유류계", '=SUM({청유류[]})', fmt=WON0, bold=True)), (1, "", S)], h=22)
    p.row([(9, F("청넘침", f'=IF(COUNT({{거래내역원장!순번[]}})>{NB_},"⚠ 거래가 {NB_}줄을 넘습니다 — 기간을 나눠 청구서를 두 장으로 만드세요.","")', align="left", size=9), {"kind": "warn"})], h=16)
    p.end_print()
    p.after_note(["거래처(와 기간)를 고르면 거래내역원장에서 그 거래처의 줄이 차례대로 채워집니다(매크로 없음). 청구 금액 = 장비관리의 그 거래처 미수급금(전체 기간).",
                  "원본의 «작성일 = 오늘(TODAY)» 은 열 때마다 바뀌어 작성일 칸으로 바꿨습니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 거래처 · 금액)."])
    return p


# ── 그리기 · 검산 ──────────────────────────────────────────────────────
ORDER = ["장비관리", "거래내역원장", "장비임대료수금원장", "기사명등록", "거래처등록", "경비사용및장비관리비메모", "청구서"]


def _abs(a):
    col = "".join(c for c in a if c.isalpha())
    row = "".join(c for c in a if c.isdigit())
    return f"${col}${row}"


def draw(bk, ex):
    kisa(bk, ex)
    georaecheo(bk, ex)
    georae(bk, ex)
    sugeum(bk, ex)
    gyeongbi(bk, ex)
    gwanri(bk, ex)
    cheonggu(bk, ex)
    st = "ex" if ex else "blank"
    lists = {}
    for key, lg, k in (("@기사", "기사명등록", "기사"), ("@거래처", "거래처등록", "거래처")):
        src = bk.pages[(st, lg)]
        a, b = src.k[f"{k}#1"], src.k[f"{k}#{NK if k == '기사' else NC}"]
        lists[key] = f"'{src.name}'!{_abs(a)}:{_abs(b)}"
    for (s2, lg), p in bk.pages.items():
        if s2 != st:
            continue
        for key in [k for k in p.dvs if k.startswith("@")]:
            cells = p.dvs.pop(key)
            dv = DataValidation(type="list", formula1=lists[key], allow_blank=True, showDropDown=False)
            dv.error = "등록 시트에 있는 이름을 고르세요"
            dv.showErrorMessage = False          # 목록에 없는 이름도 적을 수는 있게(경고 없이) — 등록부터 하도록 안내만
            p.ws.add_data_validation(dv)
            for c in cells:
                dv.add(c)
    wb = bk.wb
    if ex:
        blanks = [s for s in wb._sheets if not s.title.startswith("예시-")]
        wb._sheets = [wb[n] for n in ORDER] + [wb["예시-" + n] for n in ORDER]
    else:
        wb._sheets = [wb[n] for n in ORDER] + [s for s in wb._sheets if s.title not in ORDER]


def expect(pages):
    kz, cz = pages["기사명등록"], pages["거래처등록"]
    t, s_, e_, b = pages["거래내역원장"], pages["장비임대료수금원장"], pages["경비사용및장비관리비메모"], pages["청구서"]
    z = {lg: {} for lg in pages}
    rate_of = {kz.get(f"기사#{i}"): kz.get(f"단가#{i}") for i in range(1, NK + 1) if kz.get(f"기사#{i}")}
    # 거래내역
    T = []
    for i in range(1, NT + 1):
        g_ = lambda k: t.get(f"{k}#{i}")
        r = g_("단가") or rate_of.get(g_("기사"), 0) or 0
        amt = round(g_("시간") * r) if (g_("시간") and r) else ""
        y, m, dd = g_("년"), g_("월"), g_("일")
        T.append(dict(거래처=g_("거래처") or "", 기사=g_("기사") or "", 금액=amt, 유류=g_("유류") or 0, 날짜=D(y, m, dd) if (y and m and dd) else "",
                      년=y or 0, 월=m or 0, 일=dd or 0, 장비=g_("장비") or "", 현장=g_("현장") or "", 시간=g_("시간") or 0, 비고=g_("비고") or ""))
    S_ = [dict(거래처=s_.get(f"거래처#{i}") or "", 기사=s_.get(f"기사#{i}") or "", 수금=s_.get(f"수금#{i}") or 0) for i in range(1, NS + 1)]
    su_by = lambda key, v: sum(x["수금"] for x in S_ if x[key] == v)
    yu_by = lambda key, v: sum(x["유류"] for x in T if x[key] == v)
    tz = z["거래내역원장"]
    tk, st_, en_ = b.get("거래처") or "", b.get("시작"), b.get("끝")
    run = 0
    for i, x in enumerate(T, 1):
        tz[f"금액#{i}"] = x["금액"]
        if x["거래처"] and x["금액"] != "":
            cum = sum(y["금액"] or 0 for y in T[:i] if y["거래처"] == x["거래처"])
            tz[f"상태#{i}"] = "수금" if cum <= su_by("거래처", x["거래처"]) + yu_by("거래처", x["거래처"]) else "미수금"
        else:
            tz[f"상태#{i}"] = ""
        tz[f"날짜#{i}"] = x["날짜"]
        ok = (x["거래처"] != "" and x["거래처"] == tk and x["금액"] != "" and (not st_ or (x["날짜"] != "" and x["날짜"] >= st_))
              and (not en_ or (x["날짜"] != "" and x["날짜"] <= en_)))
        tz[f"청구#{i}"] = 1 if ok else 0
        if ok:
            run += 1
        tz[f"순번#{i}"] = run if ok else ""
    tz["금액합"] = sum(x["금액"] or 0 for x in T)
    tz["유류합"] = sum(x["유류"] for x in T)
    z["장비임대료수금원장"]["수금합"] = sum(x["수금"] for x in S_)
    ez = z["경비사용및장비관리비메모"]
    rows = [(e_.get(f"구분#{i}"), e_.get(f"경금액#{i}") or 0) for i in range(1, NE + 1)]
    ez["경비합계"] = sum(v for _k, v in rows)
    ez["경비소계"] = sum(v for k, v in rows if k == "경비")
    ez["관리소계"] = sum(v for k, v in rows if k == "장비관리비")
    # 장비관리
    gz = z["장비관리"]
    yr = pages["장비관리"].get("연도")
    gz["관리제목"] = f"장 비 관 리  {yr}" if yr else "장 비 관 리"
    for pre, key, n, src, side, tel in (("업", "거래처", NC, cz, "대표", "전화"), ("기", "기사", NK, kz, "번호", "연락")):
        tot = dict(임대=0, 기수=0, 미수=0, 유류=0)
        rowsv = []
        for i in range(1, n + 1):
            nm = src.get(f"{key}#{i}") or ""
            gz[f"{pre}이름#{i}"] = nm
            gz[f"{pre}옆#{i}"] = (src.get(f"{side}#{i}") or "") if nm else ""
            gz[f"{pre}전화#{i}"] = (src.get(f"{tel}#{i}") or "") if nm else ""
            if not nm:
                for k in ("임대", "유류", "기수", "미수", "비율", "수금률", "미수율"):
                    gz[f"{pre}{k}#{i}"] = ""
                continue
            rent = sum(x["금액"] or 0 for x in T if x[key] == nm)
            yu = yu_by(key, nm)
            gi = su_by(key, nm) + yu
            mi = rent - gi
            gz.update({f"{pre}임대#{i}": rent, f"{pre}유류#{i}": yu, f"{pre}기수#{i}": gi, f"{pre}미수#{i}": mi,
                       f"{pre}수금률#{i}": gi / rent if rent else "", f"{pre}미수율#{i}": mi / rent if rent else ""})
            tot["임대"] += rent
            tot["기수"] += gi
            tot["미수"] += mi
            tot["유류"] += yu
            rowsv.append((i, rent))
        for i in range(1, n + 1):
            if gz[f"{pre}이름#{i}"]:
                gz[f"{pre}비율#{i}"] = gz[f"{pre}임대#{i}"] / tot["임대"] if tot["임대"] else ""
        gz.update({f"{pre}임대계": tot["임대"], f"{pre}기수계": tot["기수"], f"{pre}미수계": tot["미수"], f"{pre}유류계": tot["유류"],
                   f"{pre}비율계": 1 if tot["임대"] else "", f"{pre}수금률계": tot["기수"] / tot["임대"] if tot["임대"] else "",
                   f"{pre}미수율계": tot["미수"] / tot["임대"] if tot["임대"] else ""})
    gz["관리대조"] = "" if round(gz["업임대계"] - tz["금액합"]) == 0 else ("⚠ 거래내역 금액 합계와 업체별 임대료 합계가 다릅니다 — 거래처등록에 없는 거래처가 거래내역에 있는지 보세요.")
    # 청구서
    bz = z["청구서"]
    miss = {gz[f"업이름#{i}"]: gz[f"업미수#{i}"] for i in range(1, NC + 1) if gz[f"업이름#{i}"]}
    bz["청구액"] = sum(v for k, v in miss.items() if k == tk) if tk else ""
    bz["청구한글"] = bz["청구액"] if (bz["청구액"] != "" and bz["청구액"] > 0) else ""
    picked = [x for i, x in enumerate(T, 1) if tz[f"청구#{i}"] == 1]
    for k in range(1, NB_ + 1):
        x = picked[k - 1] if k <= len(picked) else None
        for key, src, num in (("청년", "년", True), ("청월", "월", True), ("청일", "일", True), ("청장비", "장비", False), ("청현장", "현장", False),
                              ("청시간", "시간", True), ("청금액", "금액", True), ("청유류", "유류", True), ("청비고", "비고", False)):
            if x is None:
                bz[f"{key}#{k}"] = ""
            else:
                v = x[src]
                bz[f"{key}#{k}"] = (v if v != "" else 0) if num else ("" if v in (None, "") else str(v))
    bz["청금액계"] = sum(x["금액"] or 0 for x in picked[:NB_])
    bz["청유류계"] = sum(x["유류"] for x in picked[:NB_])
    bz["청넘침"] = f"⚠ 거래가 {NB_}줄을 넘습니다 — 기간을 나눠 청구서를 두 장으로 만드세요." if len(picked) > NB_ else ""
    return z
