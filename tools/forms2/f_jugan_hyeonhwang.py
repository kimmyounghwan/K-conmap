# -*- coding: utf-8 -*-
"""주간 공정 현황보고 — 현장에서 쓰던 서식의 틀(작성일 · 결재(현장 담당·소장 / 감독 감리·감독) · 공사명·업체명 ·
사업기간(1차·2차·총괄) · 공정율(계획·실시) · 주간 공정 10줄 · 기성 현황(도급액·노무비·기성금액 1~4회·잔액) ·
시공·안전·품질 관리 · 현안 사항 · 현장 사진대지 4칸, 가로 한 장) 그대로 새로 만든 것.
얹은 것: 작성일 → «2026년 9월 5주차» · 총괄 사업기간(1·2차 처음~끝) · 공정율 대비(%p, 늦으면 빨강) ·
기성 현황: 노무비 계 = 전회까지 + 금회, 기성금액 계 = 1~4회 합, 잔액(D) = 도급액(변경 있으면 변경) − 노무비 계 − 기성금액 계,
총괄 줄 = 1차 + 2차.
원본에서 지워져 있던 주간 공정 칸 이름은 «금주 계획 · 금주 실적 · 차주 계획 · 비고» 로 채웠습니다(아래 «시공·안전·품질 관리» 칸 이름과 짝)."""
import datetime

from fb import F, I

SLUG = "jugan-hyeonhwang"
TITLE = "주간 공정 현황보고"
WHERE = "forms"
PREV = None
SHORT = "주간 공정 현황보고 — 주간공정·기성현황·시공/안전/품질·현안사항·현장사진대지가 한 장입니다. 주차·총괄 기간·공정율 대비·기성 잔액이 저절로 계산됩니다."
NOTE_REPLACE = {
    "🏗 **현장에서 실제로 쓰던 서식입니다** — 내용만 지우고 틀은 원본 그대로 두었습니다.":
        "🏗 **현장에서 실제로 쓰던 서식의 틀**(결재란 · 주간공정 · 기성현황 · 사진대지)을 그대로 두고 새로 만들었습니다 — 주차·공정율 대비·기성 합계·잔액이 자동입니다.",
}

D = datetime.date
W = [7.5] + [9.3] * 15
WON = '#,##0;[Red]-#,##0;""'
P1 = '0.0%;[Red]-0.0%;""'
WEEK = [("배수공", "PE관 D600 60m 부설", "PE관 55m 부설", "PE관 60m 부설", "우천 1일 쉼", 0.88),
        ("구조물공", "암거 벽체 철근·거푸집", "벽체 철근 완료, 거푸집 80%", "벽체 콘크리트 타설(10/2)", "", 0.62),
        ("토공", "되메우기 STA.0+400~0+460", "되메우기 완료", "되메우기 0+460~0+520", "", 0.90),
        ("부대공", "안전시설 점검·보수", "안전난간 보수", "교통안전시설 정비", "", 0.70)]
MGMT = [("시공: 암거 기초 콘크리트 타설 완료(9/18)", "벽체 철근 검측(9/30)", "벽체 콘크리트 타설·양생", ""),
        ("안전: 추락방지망 설치", "TBM·위험성평가(매일)", "거푸집 동바리 점검", ""),
        ("품질: 레미콘 슬럼프·공기량 시험", "철근 규격·간격 확인", "공시체 7일 강도 확인", ""),
        ("환경: 세륜시설 운영", "살수 하루 2회", "비산먼지 점검", "")]
ISSUE = ["10/2 벽체 타설 예정 — 비가 오면 10/5로 미룸(감독과 협의 완료).",
         "포장 복구 구간 교통처리계획 변경 승인 요청 중(가나시 교통과)."]
PHOTO = ["암거 벽체 철근 조립 (9/28)", "PE관 부설 STA.0+600 (9/25)", "되메우기 다짐 (9/26)", "안전난간 보수 (9/24)"]


def draw(bk, ex):
    p = bk.page("주간 공정 현황보고" if not ex else "작성 예시", W, ex=ex, landscape=True, fit_height=1,
                margins=(0.3, 0.3, 0.35, 0.35))
    L = {"kind": "label"}
    H = {"kind": "head"}
    # 제목 + 결재
    p.row([(11, "주 간 공 정 현 황 보 고", {"kind": "title", "rs": 3, "size": 18}), (1, "결\n재", {"kind": "label", "rs": 3}),
           (2, "현      장", H), (2, "감      독", H)], h=18)
    p.row([(1, "담 당", H), (1, "소 장", H), (1, "감 리", H), (1, "감 독", H)], h=18)
    p.row([(1, "", {"kind": "text"}) for _ in range(4)], h=34)
    p.gap(4)
    p.row([(1, "작 성 일", L), (2, I("작성일", ex=D(2026, 9, 29), fmt="date", align="center")),
           (3, F("주차", '=IF(N({작성일})=0,"",TEXT({작성일},"yyyy년 m월 ")&(INT((DAY({작성일})+WEEKDAY(DATE(YEAR({작성일}),MONTH({작성일}),1),2)-2)/7)+1)&"주차")',
                 align="center", bold=True)),
           (4, "", {"kind": "free"}), (1, "작 성 자", L), (4, I("작성자", ex="김철수", align="center")),
           (1, "(인)", {"kind": "free", "align": "center"})], h=22)
    p.row([(1, "공 사 명", L), (7, I("공사명", ex="가나지구 배수로 정비공사")), (1, "업 체 명", L), (7, I("업체명", ex="예시건설(주)"))], h=22)
    # 사업기간 · 공정율
    rows = [("(1차)", D(2026, 3, 9), D(2026, 12, 31)), ("(2차)", D(2027, 3, 2), D(2027, 10, 31)), ("(총괄)", None, None)]
    rate = [("공 정 율", "계  획", "실  시", "대  비"), ("금  주", 0.021, 0.018), ("누  계", 0.684, 0.669)]
    for k, (tag, s, e) in enumerate(rows):
        cells = []
        if k == 0:
            cells.append((1, "사업기간", {"kind": "label", "rs": 3}))
        cells.append((1, tag, {"kind": "ctext", "size": 9}))
        if k < 2:
            cells += [(2, I(f"시작{k + 1}", ex=s, fmt="ymd", align="center")), (1, "~", {"kind": "ctext"}),
                      (2, I(f"끝{k + 1}", ex=e, fmt="ymd", align="center"))]
        else:
            cells += [(2, F("시작총괄", '=IF(COUNT({시작1},{시작2})=0,"",MIN({시작1},{시작2}))', fmt="ymd", align="center")),
                      (1, "~", {"kind": "ctext"}),
                      (2, F("끝총괄", '=IF(COUNT({끝1},{끝2})=0,"",MAX({끝1},{끝2}))', fmt="ymd", align="center"))]
        cells.append((1, "", {"kind": "free"}))
        rr = rate[k]
        if k == 0:
            cells += [(2, rr[0], L), (2, rr[1], H), (2, rr[2], H), (2, rr[3], H)]
        else:
            key = "금주" if k == 1 else "누계"
            cells += [(2, rr[0], L), (2, I("계획" + key, ex=rr[1], fmt=P1, align="center")),
                      (2, I("실시" + key, ex=rr[2], fmt=P1, align="center")),
                      (2, F("대비" + key, f'=IF(OR({{계획{key}}}="",{{실시{key}}}=""),"",({{실시{key}}}-{{계획{key}}})*100)',
                            fmt='+0.0"%p";[Red]-0.0"%p";0.0"%p"', align="center"))]
        p.row(cells, h=21)
    p.gap(4)
    # 주간 공정
    p.row([(1, "구 분", H), (3, "공        종", H), (3, "금 주  계 획", H), (3, "금 주  실 적", H), (3, "차 주  계 획", H),
           (2, "비    고", H), (1, "공정율", H)], h=22)
    for i in range(1, 11):
        w = WEEK[i - 1] if i <= len(WEEK) else (None,) * 6
        cells = []
        if i == 1:
            cells.append((1, "주간\n공정", {"kind": "label", "rs": 10}))
        cells += [(3, I(f"공종#{i}", ex=w[0], size=9.5)), (3, I(f"금주계획#{i}", ex=w[1], size=9)),
                  (3, I(f"금주실적#{i}", ex=w[2], size=9)), (3, I(f"차주계획#{i}", ex=w[3], size=9)),
                  (2, I(f"비고#{i}", ex=w[4] or None, size=8.5)), (1, I(f"공정율#{i}", ex=w[5], fmt='0%;;""', align="center"))]
        p.row(cells, h=19)
    p.row([(16, "(단위 : 원)", {"kind": "free", "align": "right", "size": 9})], h=16)
    # 기성 현황
    p.row([(1, "기성\n현황", {"kind": "label", "rs": 5}), (1, "구 분", {"kind": "head", "rs": 2}), (2, "도급액 (A)", H),
           (4, "노무비 (B)", H), (5, "기성금액 (C)", H), (3, "잔액 (D=A−B−C)", {"kind": "head", "rs": 2})], h=20)
    p.row([(1, t, {"kind": "head", "size": 9}) for t in ("당초", "변경", "계", "전회까지", "금회", "잔액", "계", "1회", "2회", "3회", "4회")],
          h=18, start=3)
    GS = {1: (963_241_000, 1_011_891_000, 180_000_000, 22_500_000, None, [180_000_000, 210_000_000, 150_000_000, None]),
          2: (878_000_000, None, None, None, None, [None] * 4)}
    for tag, k in (("총 괄", 0), ("1 차", 1), ("2 차", 2)):
        cells = [(1, tag, {"kind": "ctext", "size": 9})]
        if k:
            a0, a1, bp, bn, bj, cs = GS[k]
            cells += [(1, I(f"당초{k}", ex=a0, fmt=WON, size=8.5)), (1, I(f"변경{k}", ex=a1, fmt=WON, size=8.5)),
                      (1, F(f"B계{k}", f'=IF(N({{전회{k}}})+N({{금회{k}}})=0,"",N({{전회{k}}})+N({{금회{k}}}))', fmt=WON, size=8.5)),
                      (1, I(f"전회{k}", ex=bp, fmt=WON, size=8.5)), (1, I(f"금회{k}", ex=bn, fmt=WON, size=8.5)),
                      (1, I(f"B잔액{k}", ex=bj, fmt=WON, size=8.5)),
                      (1, F(f"C계{k}", f'=IF(SUM({{C1_{k}}}:{{C4_{k}}})=0,"",SUM({{C1_{k}}}:{{C4_{k}}}))', fmt=WON, size=8.5))]
            cells += [(1, I(f"C{j + 1}_{k}", ex=cs[j], fmt=WON, size=8.5)) for j in range(4)]
            cells += [(3, F(f"D{k}", f'=IF(N({{당초{k}}})+N({{변경{k}}})=0,"",IF(N({{변경{k}}})>0,{{변경{k}}},{{당초{k}}})-N({{B계{k}}})-N({{C계{k}}}))',
                            fmt=WON, size=8.5))]
        else:
            def s(x):
                return f'=IF(N({{{x}1}})+N({{{x}2}})=0,"",N({{{x}1}})+N({{{x}2}}))'
            cells += [(1, F("당초0", s("당초"), fmt=WON, size=8.5)),
                      (1, F("변경0", '=IF(N({변경1})+N({변경2})=0,"",IF(N({변경1})>0,{변경1},N({당초1}))+IF(N({변경2})>0,{변경2},N({당초2})))',
                            fmt=WON, size=8.5)),
                      (1, F("B계0", s("B계"), fmt=WON, size=8.5)), (1, F("전회0", s("전회"), fmt=WON, size=8.5)),
                      (1, F("금회0", s("금회"), fmt=WON, size=8.5)), (1, F("B잔액0", s("B잔액"), fmt=WON, size=8.5)),
                      (1, F("C계0", s("C계"), fmt=WON, size=8.5))]
            cells += [(1, F(f"C{j + 1}_0", f'=IF(N({{C{j + 1}_1}})+N({{C{j + 1}_2}})=0,"",N({{C{j + 1}_1}})+N({{C{j + 1}_2}}))', fmt=WON, size=8.5))
                      for j in range(4)]
            cells += [(3, F("D0", s("D"), fmt=WON, size=8.5, bold=True))]
        p.row(cells, h=20)
    p.gap(4)
    # 시공·안전·품질 관리
    p.row([(1, "시공·\n안전·\n품질\n관리", {"kind": "label", "rs": 5}), (4, "전 주 까 지", H), (4, "금 주  계 획", H),
           (4, "차 주  계 획", H), (3, "비    고", H)], h=20)
    for i in range(1, 5):
        m = MGMT[i - 1]
        p.row([(4, I(f"전주#{i}", ex=m[0], size=9)), (4, I(f"금주#{i}", ex=m[1], size=9)), (4, I(f"차주#{i}", ex=m[2], size=9)),
               (3, I(f"관리비고#{i}", ex=m[3] or None, size=8.5))], h=19)
    p.gap(4)
    p.row([(1, "현안\n사항", {"kind": "label", "rs": 2}), (15, I("현안#1", ex="1. " + ISSUE[0], size=9.5))], h=20)
    p.row([(15, I("현안#2", ex="2. " + ISSUE[1], size=9.5))], h=20)
    p.gap(4)
    p.row([(1, "현장\n사진\n대지", {"kind": "label", "rs": 2}), (4, "", {"kind": "text"}), (4, "", {"kind": "text"}),
           (4, "", {"kind": "text"}), (3, "", {"kind": "text"})], h=118)
    p.row([(4, I("사진#1", ex=PHOTO[0], align="center", size=9)), (4, I("사진#2", ex=PHOTO[1], align="center", size=9)),
           (4, I("사진#3", ex=PHOTO[2], align="center", size=9)), (3, I("사진#4", ex=PHOTO[3], align="center", size=9))], h=18)
    p.end_print()
    p.after_note([
        "하늘색 칸 = 자동(주차 · 총괄 기간 · 공정율 대비 · 기성 합계·잔액 · 총괄 줄). 사진은 위 네 칸에 붙이고(삽입 → 그림) 아래에 설명을 적습니다.",
        "잔액(D) = 도급액(변경이 있으면 변경, 없으면 당초) − 노무비 계 − 기성금액 계. 도급액·노무비·기성금액 단위는 원입니다.",
    ] if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 금액 · 날짜). 사진 칸은 비워 두었습니다 — 실제 현장 사진을 붙이세요."])
    return p


def expect(inp):
    d = inp["작성일"]
    first = D(d.year, d.month, 1)
    wk = (d.day + first.isoweekday() - 2) // 7 + 1
    e = {"주차": f"{d.year}년 {d.month}월 {wk}주차", "시작총괄": min(inp["시작1"], inp["시작2"]), "끝총괄": max(inp["끝1"], inp["끝2"]),
         "대비금주": (inp["실시금주"] - inp["계획금주"]) * 100, "대비누계": (inp["실시누계"] - inp["계획누계"]) * 100}
    g = lambda k: inp.get(k) or 0
    tot = {}
    for k in (1, 2):
        b = g(f"전회{k}") + g(f"금회{k}")
        c = sum(g(f"C{j}_{k}") for j in range(1, 5))
        a = g(f"변경{k}") or g(f"당초{k}")
        e[f"B계{k}"] = b or ""
        e[f"C계{k}"] = c or ""
        e[f"D{k}"] = a - b - c if (g(f"당초{k}") + g(f"변경{k}")) else ""
        for x, v in (("당초", g(f"당초{k}")), ("B계", b), ("전회", g(f"전회{k}")), ("금회", g(f"금회{k}")), ("B잔액", g(f"B잔액{k}")),
                     ("C계", c), ("D", e[f"D{k}"] or 0)):
            tot[x] = tot.get(x, 0) + v
        for j in range(1, 5):
            tot[f"C{j}_"] = tot.get(f"C{j}_", 0) + g(f"C{j}_{k}")
    for x in ("당초", "B계", "전회", "금회", "B잔액", "C계", "D"):
        e[f"{x}0"] = tot[x] or ""
    for j in range(1, 5):
        e[f"C{j}_0"] = tot[f"C{j}_"] or ""
    has_v = g("변경1") + g("변경2")
    e["변경0"] = ((g("변경1") or g("당초1")) + (g("변경2") or g("당초2"))) if has_v else ""
    return e
