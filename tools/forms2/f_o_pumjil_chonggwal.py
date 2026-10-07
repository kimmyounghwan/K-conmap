# -*- coding: utf-8 -*-
"""품질검사 성과 총괄표 — 건설기술 진흥법 시행규칙 [별지 제43호서식] 원본 틀 그대로 (G177 · 2026-10-07)

소장님: 「위 서식 만들자」(카페 질문 «품질서류» 1·4번 — 같은 서류) → 법제처 원본(PDF) 칸 그대로.
■ 칸(원본 차례 그대로): 공사명 · 공사기간 · 공정(%) / 공종 · 시험ㆍ검사 종류(재료) · 시험ㆍ검사 횟수(계획 · 실시 · 합격 · 불합격 · 재시험) · 비고
  / 작성일시 · 작성자(소속 · 직위 · 성명). 원본 10줄 그대로.
■ 수식: 인쇄 밖 «합계» 줄(계획 · 실시 · 합격 · 불합격 · 재시험) · 실시율 · 맞춰 보기(합격 + 불합격 ≠ 실시인 줄, 실시 > 계획인 줄 수).
  표 안: 합격 + 불합격 이 실시와 다르면 그 줄 실시 칸이 빨간 글씨.
■ 시행령 제93조 — 건설사업자는 품질검사 성과 총괄표를 작성해 발주청에 냅니다(준공 때 등)."""
import datetime

from fb import F, I

SLUG = "o-pumjil-chonggwal"
TITLE = "품질검사 성과 총괄표"
WHERE = "orig"
PREV = [(1, "빈 서식"), (2, "작성 예시")]
PAGES = 1
NSHEETS = 1
SHORT = ("품질검사 성과 총괄표 — 건설기술 진흥법 시행규칙 [별지 제43호서식] 원본 틀 그대로. 공종 · 시험ㆍ검사 종류마다 계획 · 실시 · 합격 · 불합격 · "
         "재시험 횟수를 적으면 합계 · 실시율이 셈되고, 합격 + 불합격이 실시와 안 맞는 줄을 알려 줍니다.")
NOTE = "법제처 원본 서식(별지 제43호) 칸 그대로입니다. 품질검사 대장(별지 제42호)에 적은 시험을 공종 · 종류별로 모아 적습니다."

D = datetime.date
ROWS = 10
#     공종  종류  계획 실시 합격 불합격 재시험 비고
W = [13, 25, 9.6, 9.6, 9.6, 9.6, 9.6, 11]
N = len(W)
H = {"kind": "head", "size": 9.5}
EX = [("토공", "성토 다짐도(현장밀도)", 40, 24, 23, 1, 1, ""),
      ("토공", "흙의 다짐시험(실내)", 4, 3, 3, 0, 0, ""),
      ("포장공", "보조기층 다짐도", 12, 6, 6, 0, 0, ""),
      ("포장공", "아스팔트 혼합물(밀도 · 함량)", 8, 2, 2, 0, 0, ""),
      ("구조물공", "레미콘 슬럼프 · 공기량 · 염화물", 30, 18, 18, 0, 0, "120㎥마다"),
      ("구조물공", "레미콘 압축강도", 30, 15, 15, 0, 0, ""),
      ("구조물공", "철근 인장 · 굽힘", 3, 2, 2, 0, 0, "외부 의뢰"),
      ("배수공", "PE관 외관 · 치수", 6, 4, 4, 0, 0, "")]


def draw(bk, ex):
    p = bk.page("품질검사 성과 총괄표", W, ex=ex, fit_height=1, sheetname="성과 총괄표" if not ex else "작성 예시", margins=(0.45, 0.4, 0.45, 0.45))
    p.row([(N, "■ 건설기술 진흥법 시행규칙 [별지 제43호서식]", {"kind": "free", "size": 9})], h=18)
    p.row([(N, "품질검사 성과 총괄표", {"kind": "title", "size": 18})], h=46)
    p.row([(1, "공사명 :", {"kind": "free", "align": "right", "size": 10}),
           (1, I("공사명", ex="가나지구 배수개선사업", size=10), {"border": False}),
           (1, "공사기간 :", {"kind": "free", "align": "right", "size": 10}),
           (2, I("착공일", ex=D(2026, 3, 2), blank="     .     .     .   ~", fmt='yyyy. m. d."   ~"', align="center", size=9.5), {"border": False}),
           (2, I("준공일", ex=D(2027, 2, 26), blank="     .     .     .", fmt="ymd", align="center", size=9.5), {"border": False}),
           (1, I("공정", ex=0.42, blank=None, fmt='"공정 : "0%;;"공정 :      %"', align="center", size=10), {"border": False})], h=24)
    p.gap(4)
    p.row([(1, "공종", dict(H, rs=2)), (1, "시험ㆍ검사 종류(재료)", dict(H, rs=2)), (5, "시험ㆍ검사 횟수", H), (1, "비고", dict(H, rs=2))], h=26)
    p.row([(1, "계획", H), (1, "실시", H), (1, "합격", H), (1, "불합격", H), (1, "재시험", H)], h=24, start=3)
    first = p.r
    for i in range(1, ROWS + 1):
        e = EX[i - 1] if (ex and i <= len(EX)) else (None,) * 8
        p.row([(1, I(f"공종#{i}", ex=e[0], align="center", size=9.5)),
               (1, I(f"종류#{i}", ex=e[1], align="center", size=9)),
               (1, I(f"계획#{i}", ex=e[2], fmt="#,##0", align="center", size=10)),
               (1, I(f"실시#{i}", ex=e[3], fmt="#,##0", align="center", size=10)),
               (1, I(f"합격#{i}", ex=e[4], fmt="#,##0", align="center", size=10)),
               (1, I(f"불합격#{i}", ex=e[5], fmt="#,##0", align="center", size=10)),
               (1, I(f"재시험#{i}", ex=e[6], fmt="#,##0", align="center", size=10)),
               (1, I(f"비고#{i}", ex=e[7] or None, align="center", size=8.5))], h=40)
    last = p.r - 1
    p.gap(6)
    p.row([(2, "", {"kind": "free"}), (1, "작성일시 :", {"kind": "free", "align": "right"}),
           (5, I("작성일", ex=D(2026, 9, 30), blank="          년        월        일", fmt="date", align="center"), {"border": False})], h=24)
    p.row([(2, "", {"kind": "free"}), (1, "작성자 :", {"kind": "free", "align": "right"}),
           (1, "소속 :", {"kind": "free", "align": "right", "size": 9.5}), (2, I("소속", ex="가나건설(주)", align="left", size=9.5), {"border": False}),
           (1, "직위 :", {"kind": "free", "align": "right", "size": 9.5}), (1, I("직위", ex="품질관리자", align="left", size=9.5), {"border": False})], h=24)
    p.row([(3, "", {"kind": "free"}), (1, "성명 :", {"kind": "free", "align": "right", "size": 9.5}),
           (2, I("성명", ex="김품질", align="left", size=9.5), {"border": False}), (2, "(서명 또는 인)", {"kind": "cfree", "size": 9.5})], h=24)
    p.row([(N, "210㎜×297㎜[백상지 80g/㎡(재활용품)]", {"kind": "free", "size": 8, "align": "right"})], h=16)
    from openpyxl.formatting.rule import Rule
    from openpyxl.styles import Font
    from openpyxl.styles.differential import DifferentialStyle
    p.ws.conditional_formatting.add(f"D{first}:D{last}", Rule(type="expression",
                                    formula=[f'AND(ISNUMBER(D{first}),COUNT(E{first},F{first})>0,N(E{first})+N(F{first})<>D{first})'],
                                    dxf=DifferentialStyle(font=Font(color="DC2626", bold=True))))
    p.end_print()
    p.gap(8)
    sums = []
    for k in ("계획", "실시", "합격", "불합격", "재시험"):
        sums.append((1, F(f"{k}계", f'=IF(COUNT({{{k}#1}}:{{{k}#{ROWS}}})=0,"",SUM({{{k}#1}}:{{{k}#{ROWS}}}))', fmt="#,##0", align="center", size=10, bold=True)))
    p.row([(2, "합계 (인쇄 안 됨)", {"kind": "sum"})] + sums +
          [(1, F("실시율", '=IF(OR({계획계}="",{실시계}=""),"",IF({계획계}=0,"",{실시계}/{계획계}))', fmt="pct1", align="center", size=10, bold=True))], h=24)
    bad1 = "+".join(f'IF(AND(ISNUMBER({{실시#{i}}}),COUNT({{합격#{i}}},{{불합격#{i}}})>0,N({{합격#{i}}})+N({{불합격#{i}}})<>{{실시#{i}}}),1,0)' for i in range(1, ROWS + 1))
    bad2 = "+".join(f'IF(AND(ISNUMBER({{계획#{i}}}),ISNUMBER({{실시#{i}}}),{{실시#{i}}}>{{계획#{i}}}),1,0)' for i in range(1, ROWS + 1))
    p.row([(2, "맞춰 보기", {"kind": "label", "size": 9}),
           (6, F("맞춰보기", f'=IF(COUNT({{실시#1}}:{{실시#{ROWS}}})=0,"",IF(({bad1})+({bad2})=0,"✔ 합격 + 불합격 = 실시 · 실시 ≤ 계획",'
                            f'IF(({bad1})>0,"합격 + 불합격 ≠ 실시인 줄 "&({bad1})&"개","")&IF(({bad2})>0,IF(({bad1})>0," · ","")&"실시가 계획보다 많은 줄 "&({bad2})&"개(계획 보완)","")))',
                 align="left", size=9.5, bold=True))], h=24)
    p.after_note(["하늘색 칸 = 자동(합계 · 실시율 · 맞춰 보기 — 인쇄되지 않음). 실시 칸이 빨간 글씨면 합격 + 불합격이 실시와 다른 줄입니다.",
                  "품질검사 대장(별지 제42호)에 적은 시험을 공종 · 종류(재료)별로 세어 적습니다. 재시험은 불합격 뒤 다시 한 횟수입니다.",
                  "공정 칸에는 비율(예: 42%)을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람)."])
    return p


def expect(inp):
    e = {}
    tot = {}
    for k in ("계획", "실시", "합격", "불합격", "재시험"):
        vs = [inp.get(f"{k}#{i}") for i in range(1, ROWS + 1) if inp.get(f"{k}#{i}") is not None]
        tot[k] = sum(vs) if vs else ""
        e[f"{k}계"] = tot[k]
    e["실시율"] = "" if (tot["계획"] in ("", 0) or tot["실시"] == "") else tot["실시"] / tot["계획"]
    b1 = b2 = 0
    any_s = False
    for i in range(1, ROWS + 1):
        s, a, b, pl = inp.get(f"실시#{i}"), inp.get(f"합격#{i}"), inp.get(f"불합격#{i}"), inp.get(f"계획#{i}")
        if s is not None:
            any_s = True
            if (a is not None or b is not None) and (a or 0) + (b or 0) != s:
                b1 += 1
            if pl is not None and s > pl:
                b2 += 1
    if not any_s:
        e["맞춰보기"] = ""
    elif b1 + b2 == 0:
        e["맞춰보기"] = "✔ 합격 + 불합격 = 실시 · 실시 ≤ 계획"
    else:
        e["맞춰보기"] = (f"합격 + 불합격 ≠ 실시인 줄 {b1}개" if b1 else "") + ((" · " if b1 else "") + f"실시가 계획보다 많은 줄 {b2}개(계획 보완)" if b2 else "")
    return e
