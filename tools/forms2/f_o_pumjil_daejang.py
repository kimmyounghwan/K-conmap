# -*- coding: utf-8 -*-
"""품질검사 대장 — 건설기술 진흥법 시행규칙 [별지 제42호서식] 원본 틀 그대로 (G177 · 2026-10-07)

소장님: (카페 질문 «품질서류 13가지») 「건설맵에 있어? 서류」 → 없던 넷 「위 서식 만들자」 → 법제처 원본(PDF) 받아 칸 그대로.
■ 칸(원본 차례 그대로): 일련번호 · 연월일 · 시험ㆍ검사 구분 · 재료 · 시험ㆍ검사 종목 · 시험 기준 · 시험 결과 · 시험결과 판정 ·
  시험ㆍ검사자(성명 · 서명) · 건설사업관리기술자 확인(성명 · 서명) · 비고. 원본은 한 쪽 9줄 — 쓰기 좋게 18줄(칸 이름 · 차례는 그대로).
■ 수식: 일련번호(종목을 적은 줄만 1, 2, 3 …) · 인쇄 밖 집계(시험 n건 · 합격 · 불합격).
■ 목록: 시험ㆍ검사 구분(시험 · 검사) · 판정(합격 · 불합격) — 목록 밖 글도 적을 수 있음.
■ CSI(건설공사 안전관리 종합정보망)에는 이 대장 내용(품질관리자 성명 · 서명 · 검사 완료일)을 검사 완료일부터 7일 안에 입력(2025년부터)."""
import datetime

from fb import F, I

SLUG = "o-pumjil-daejang"
TITLE = "품질검사 대장"
WHERE = "orig"
PREV = [(1, "빈 서식"), (2, "작성 예시")]
PAGES = 1
NSHEETS = 1
SHORT = ("품질검사 대장 — 건설기술 진흥법 시행규칙 [별지 제42호서식] 원본 틀 그대로. 시험ㆍ검사 종목을 적으면 일련번호가 저절로 붙고, "
         "판정(합격 · 불합격)을 고르면 시험 건수 · 합격 · 불합격이 셈됩니다.")
NOTE = ("법제처 원본 서식(별지 제42호) 칸 그대로입니다. 2025년부터 이 대장 내용(시험 결과 · 품질관리자 성명 · 서명 · 완료일)은 "
        "검사 완료일부터 7일 안에 CSI(건설공사 안전관리 종합정보망)에도 입력해야 합니다.")

D = datetime.date
ROWS = 18
#     일련 연월일 구분 재료 종목  기준 결과 판정 검사자(성명 서명) 확인(성명 서명) 비고
W = [5.6, 9.2, 6.4, 8.4, 11.6, 10.6, 9.2, 6.4, 6.4, 5.8, 6.6, 5.8, 8.6]
N = len(W)
H = {"kind": "head", "size": 9}
EX = [(D(2026, 4, 8), "시험", "레미콘\n25-24-150", "슬럼프", "150±25mm", "155mm", "합격", "김품질", "박감리", ""),
      (D(2026, 4, 8), "시험", "레미콘\n25-24-150", "공기량", "4.5±1.5%", "4.8%", "합격", "김품질", "박감리", ""),
      (D(2026, 4, 8), "시험", "레미콘\n25-24-150", "염화물량", "0.30kg/㎥ 이하", "0.042kg/㎥", "합격", "김품질", "박감리", ""),
      (D(2026, 4, 10), "시험", "보조기층", "현장밀도\n(다짐도)", "95% 이상", "97.2%", "합격", "김품질", "박감리", ""),
      (D(2026, 4, 15), "검사", "철근 SD400\nD19", "인장강도", "560MPa 이상", "598MPa", "합격", "김품질", "박감리", "외부 의뢰"),
      (D(2026, 5, 6), "시험", "레미콘\n25-24-150", "압축강도(28일)", "24MPa 이상", "26.1MPa", "합격", "김품질", "박감리", "4/8 타설분"),
      (D(2026, 5, 8), "시험", "성토(노체)", "현장밀도\n(다짐도)", "90% 이상", "88.5%", "불합격", "김품질", "박감리", "재다짐 후 재시험"),
      (D(2026, 5, 9), "시험", "성토(노체)", "현장밀도\n(다짐도)", "90% 이상", "92.1%", "합격", "김품질", "박감리", "5/8 재시험")]


def draw(bk, ex):
    p = bk.page("품질검사 대장", W, ex=ex, fit_height=1, sheetname="품질검사 대장" if not ex else "작성 예시", margins=(0.4, 0.35, 0.45, 0.45))
    p.dv_list("구분", ["시험", "검사"])
    p.dv_list("판정", ["합격", "불합격"])
    p.row([(N, "■ 건설기술 진흥법 시행규칙 [별지 제42호서식]", {"kind": "free", "size": 9})], h=18)
    p.row([(N, "품질검사 대장", {"kind": "title", "size": 18, "border": True})], h=46)
    p.row([(1, "일련\n번호", dict(H, rs=2)), (1, "연월일", dict(H, rs=2)), (1, "시험ㆍ\n검사\n구분", dict(H, rs=2)), (1, "재료", dict(H, rs=2)),
           (1, "시험ㆍ검사\n종목", dict(H, rs=2)), (1, "시험\n기준", dict(H, rs=2)), (1, "시험\n결과", dict(H, rs=2)),
           (1, "시험\n결과\n판정", dict(H, rs=2)), (2, "시험ㆍ검사자", H), (2, "건설사업관리\n기술자 확인", H), (1, "비고", dict(H, rs=2))], h=30)
    p.row([(1, "성명", H), (1, "서명", H), (1, "성명", H), (1, "서명", H)], h=20, start=9)
    first = p.r
    for i in range(1, ROWS + 1):
        e = EX[i - 1] if (ex and i <= len(EX)) else (None,) * 10
        p.row([(1, F(f"번호#{i}", f'=IF({{종목#{i}}}="","",COUNTIF({{종목#1}}:{{종목#{i}}},"?*"))', align="center", size=9)),
               (1, I(f"일자#{i}", ex=e[0], fmt="ymd", align="center", size=9)),
               (1, I(f"구분#{i}", ex=e[1], align="center", size=9, dv="구분")),
               (1, I(f"재료#{i}", ex=e[2], align="center", size=8.5)),
               (1, I(f"종목#{i}", ex=e[3], align="center", size=9)),
               (1, I(f"기준#{i}", ex=e[4], align="center", size=8.5)),
               (1, I(f"결과#{i}", ex=e[5], align="center", size=8.5)),
               (1, I(f"판정#{i}", ex=e[6], align="center", size=9, dv="판정")),
               (1, I(f"검사자#{i}", ex=e[7], align="center", size=9)), (1, "", {"kind": "text"}),
               (1, I(f"확인자#{i}", ex=e[8], align="center", size=9)), (1, "", {"kind": "text"}),
               (1, I(f"비고#{i}", ex=e[9] or None, align="center", size=8))], h=31)
    last = p.r - 1
    p.row([(N, "210㎜×297㎜[백상지 80g/㎡(재활용품)]", {"kind": "free", "size": 8, "align": "right"})], h=16)
    from openpyxl.formatting.rule import Rule
    from openpyxl.styles import Font
    from openpyxl.styles.differential import DifferentialStyle
    p.ws.conditional_formatting.add(f"H{first}:H{last}", Rule(type="expression", formula=[f'H{first}="불합격"'],
                                    dxf=DifferentialStyle(font=Font(color="DC2626", bold=True))))
    p.end_print()
    p.gap(8)
    rng = lambda k: f"{{{k}#1}}:{{{k}#{ROWS}}}"
    p.row([(4, "집계 (인쇄 안 됨)", {"kind": "label", "size": 9}),
           (9, F("집계", f'=IF(COUNTIF({rng("종목")},"?*")=0,"","시험ㆍ검사 "&COUNTIF({rng("종목")},"?*")&"건 · 합격 "&COUNTIF({rng("판정")},"합격")'
                         f'&" · 불합격 "&COUNTIF({rng("판정")},"불합격")&IF(COUNTIF({rng("종목")},"?*")-COUNTIF({rng("판정")},"합격")-COUNTIF({rng("판정")},"불합격")>0,'
                         f'" · 판정 안 적음 "&(COUNTIF({rng("종목")},"?*")-COUNTIF({rng("판정")},"합격")-COUNTIF({rng("판정")},"불합격")),""))',
                 align="left", size=9.5, bold=True))], h=22)
    p.after_note(["하늘색 칸 = 자동(일련번호 · 집계). 시험ㆍ검사 종목을 적은 줄만 차례로 번호가 붙습니다.",
                  "구분(시험 · 검사) · 판정(합격 · 불합격)은 칸을 누르면 목록이 나옵니다. 불합격은 빨간 글씨 — 재시험 결과는 다음 줄에 적고 비고에 «○/○ 재시험».",
                  "줄이 모자라면 줄을 복사해 아래에 붙이세요(번호 · 집계는 범위만 늘리면 됩니다).",
                  "2025년부터 이 대장 내용(시험 결과 · 품질관리자 성명 · 서명 · 검사 완료일)과 확인 사진을 검사 완료일부터 7일 안에 CSI 에 입력합니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 사람)."])
    return p


def expect(inp):
    e = {}
    n = 0
    ok = bad = 0
    for i in range(1, ROWS + 1):
        k = inp.get(f"종목#{i}")
        if k:
            n += 1
            e[f"번호#{i}"] = n
        else:
            e[f"번호#{i}"] = ""
        j = inp.get(f"판정#{i}")
        ok += j == "합격"
        bad += j == "불합격"
    if n == 0:
        e["집계"] = ""
    else:
        rest = n - ok - bad
        e["집계"] = f"시험ㆍ검사 {n}건 · 합격 {ok} · 불합격 {bad}" + (f" · 판정 안 적음 {rest}" if rest > 0 else "")
    return e
