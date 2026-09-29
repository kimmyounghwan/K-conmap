# -*- coding: utf-8 -*-
"""안전 · 품질관리비 사용내역서 — 원본 틀(표지 · 품질관리비 사용내역서 · 항목별 사용내역서 · 사진대지 · 안전관리비 사용내역서 · 항목별 사용내역서 ·
사진대지 · 노임명세서)을 새로 만든 것.
■ 원본의 «신분증 및 통장사본» 시트는 뺌(개인정보 — 따로 붙임). 노임명세서의 주민등록번호 칸은 틀로만 두고 작성 예시에도 적지 않음.
■ 원본의 «안전관리내역»(옛 산업안전보건관리비 8항목 표)은 사용내역서 항목(건설기술 진흥법 시행규칙 제60조 7항목)과 맞지 않아
  «항목별 사용내역서» 하나로 합침 — 항목 이름을 적으면 사용내역서 금회 금액으로 저절로 모임.
■ 수식: 사용 월 → 제목 · 날짜(그 달 말일) · 금회 = 항목별 사용내역서에서 항목 이름으로 모음(SUMIF) · 누계 · 사용률(누계 ÷ 계상액) ·
        세부 합계와 금회 합계가 다르면 안내(항목 이름 오타) · 노임명세서 공수 합 · 노무비 · 소득세(일급 15만원 넘는 분 × 2.7%, 1천원 미만 안 뗌) ·
        지방소득세 · 국민연금/건강/장기요양(8일 이상) · 고용보험 · 지급액."""
import datetime

from fb import F, I

SLUG = "o-anjeon-pumjil-bi"
TITLE = "안전·품질관리비 사용내역서"
WHERE = "orig"
PREV = [(2, "품질관리비 사용내역서 — 빈 서식"), (13, "품질관리비 사용내역서 — 작성 예시"), (18, "안전관리비 사용내역서 — 작성 예시"), (22, "노임명세서 — 작성 예시")]
PAGES = 11
NSHEETS = 9
MULTI = True
SHORT = ("품질관리비 · 안전관리비 사용내역서 한 벌(표지 · 사용내역서 · 항목별 사용내역서 · 사진대지 · 노임명세서). 항목별 내역을 적으면 "
         "사용내역서의 금회 · 누계 · 사용률이 저절로 채워지고, 노임명세서는 공제(소득세 · 4대보험)까지 셈합니다.")
NOTE = "항목별 사용내역서의 «항목» 은 사용내역서 항목 이름과 똑같이 적어야 모입니다(다르면 안내가 뜹니다). 노임 공제율(노란 칸)은 2026년 기준입니다."

D = datetime.date
W = [7.6] * 12
PC = 12
L = {"kind": "label"}
H = {"kind": "head"}
FR = {"kind": "free"}
S = {"kind": "sum"}
WON = '#,##0;[Red]-#,##0;""'
Q_ITEMS = ["1. 품질시험비", "2. 품질관리활동비"]
A_ITEMS = ["1. 안전관리계획서 작성비 및 검토비", "2. 영 제100조제1항제1호 및 제3호에 따른 안전점검 비용",
           "3. 발파 · 굴착 등의 건설공사로 인한 주변 건축물 등의 피해방지 대책 비용", "4. 공사장 주변의 통행안전 및 교통소통을 위한 안전시설의 설치 및 유지관리 비용",
           "5. 안전모니터링 장치의 설치 · 운용 비용", "6. 공사 시행 중 구조적 안전성 확보 비용",
           "7. 무선설비 및 무선통신을 이용한 건설공사 현장의 안전관리체계 구축 · 운용 비용"]
NIT = 8
NDET = 22
Q_PREV = [10_898_010, 0]
A_PREV = [3_000_000, 17_500_000, 13_144_386, 16_031_818, 0, 0, 0]
Q_DET = [("1. 품질시험비", D(2026, 3, 9), "H-BEAM 품질검사", "300×300×10×15", 1, "식", 270_000), ("1. 품질시험비", D(2026, 3, 12), "SHEET PILE 품질검사", "400×150×13", 1, "식", 200_000),
         ("1. 품질시험비", D(2026, 3, 20), "레미콘 압축강도 시험", "25-24-150", 6, "회", 45_000), ("2. 품질관리활동비", D(2026, 3, 25), "시험기구 검 · 교정", "슬럼프 · 공기량", 1, "식", 180_000)]
A_DET = [("2. 영 제100조제1항제1호 및 제3호에 따른 안전점검 비용", D(2026, 3, 16), "정기안전점검(1차)", "", 1, "식", 3_500_000),
         ("4. 공사장 주변의 통행안전 및 교통소통을 위한 안전시설의 설치 및 유지관리 비용", D(2026, 3, 5), "PE 방호벽", "1200×900×600", 20, "EA", 38_000),
         ("4. 공사장 주변의 통행안전 및 교통소통을 위한 안전시설의 설치 및 유지관리 비용", D(2026, 3, 5), "교통안내 표지판", "1800×900", 4, "EA", 95_000),
         ("4. 공사장 주변의 통행안전 및 교통소통을 위한 안전시설의 설치 및 유지관리 비용", D(2026, 3, 10), "신호수 인건비", "노임명세서", 1, "식", None),
         ("3. 발파 · 굴착 등의 건설공사로 인한 주변 건축물 등의 피해방지 대책 비용", D(2026, 3, 18), "인접 건물 균열 계측", "", 1, "식", 650_000)]
WK = [("김신호", "신호수", [1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1], 170_000),
      ("이안내", "신호수", [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], 160_000)]


def _pg(bk, ex, lg, fit=1, land=False):
    return bk.page(lg, W if not land else LW, ex=ex, fit_height=fit, landscape=land, sheetname=lg if not ex else "예시-" + lg,
                   margins=(0.55, 0.55, 0.55, 0.55))


def _ym(ref):
    return f'IF(N({ref})=0,"",YEAR({ref})&"년 "&TEXT_MM)'.replace("TEXT_MM", f'IF(MONTH({ref})<10,"0","")&MONTH({ref})&"월"')


def cover(bk, ex, kind):
    lg = "표지(품질)" if kind == "q" else "표지(안전)"
    p = _pg(bk, ex, lg)
    p.gap(120)
    p.row([(PC, F(f"표지공사명", '=IF({품질관리비!공사명}="","",{품질관리비!공사명})', align="center", size=16, bold=True), {"border": False})], h=40)
    p.gap(40)
    p.row([(PC, "품질관리비 사용내역서" if kind == "q" else "안전관리비 사용내역서", {"kind": "title", "size": 26})], h=60)
    p.gap(60)
    p.row([(PC, F("표지월", '=IF(N({품질관리비!사용월})=0,"20    년    월분",' + _ym('{품질관리비!사용월}') + '&"분")', align="center", size=14),
            {"border": False})], h=30)
    p.gap(230)
    p.row([(PC, F("표지업체", '=IF({품질관리비!업체}="","",{품질관리비!업체})', align="center", size=16, bold=True), {"border": False})], h=40)
    p.end_print()
    p.after_note(["공사명 · 사용 월 · 업체는 «품질관리비» 시트에 한 번만 적으면 표지들에 저절로 들어갑니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사)."])
    return p


def usage(bk, ex, kind):
    q = kind == "q"
    lg = "품질관리비" if q else "안전관리비"
    det = "품질세부" if q else "안전세부"
    p = _pg(bk, ex, lg)
    items = Q_ITEMS if q else A_ITEMS
    prev = Q_PREV if q else A_PREV
    src = (lambda k: "{" + k + "}") if q else (lambda k: "{품질관리비!" + k + "}")
    nm = "품질" if q else "안전"
    p.row([(PC, F("제목", f'="{nm}관리비 사용내역서"&IF(N({src("사용월")})=0,"","("&' + _ym(src("사용월")) + '&")")', align="center", size=17, bold=True),
            {"kind": "title"})], h=40)
    p.gap(6)
    if q:
        p.row([(2, "건설업체명", L), (4, I("업체", ex="예시건설(주)")), (2, "공  사  명", L), (4, I("공사명", ex="가나지구 배수로 정비공사", size=9.5))], h=28)
        p.row([(2, "소  재  지", L), (4, I("소재지", ex="가나시 가나로 10", size=9.5)), (2, "대  표  자", L), (4, I("대표자", ex="김대표"))], h=28)
        p.row([(2, "공 사 금 액", L), (4, I("공사금액", ex=3_024_841_000, fmt='#,##0" 원"')), (2, "공 사 기 간", L),
               (2, I("착공", ex=D(2025, 6, 23), fmt="ymd", align="center", size=9.5)), (2, I("준공", ex=D(2027, 9, 15), fmt="ymd", align="center", size=9.5))], h=28)
        p.row([(2, "발  주  자", L), (4, I("발주자", ex="가나군")), (2, "누계 공정률", L), (4, I("공정률", ex=0.4532, fmt="0.00%", align="center"))], h=28)
        p.row([(2, "사 용 월", L), (4, I("사용월", ex=D(2026, 3, 1), fmt='yyyy"년 "m"월"', align="center")),
               (6, "← 그 달 1일을 적으세요(제목 · 날짜 · 표지가 따라감)", {"kind": "free", "size": 8.5})], h=24)
    else:
        for a, ka, b, kb in (("건설업체명", "업체", "공  사  명", "공사명"), ("소  재  지", "소재지", "대  표  자", "대표자")):
            p.row([(2, a, L), (4, F(f"{ka}표시", f'=IF({{품질관리비!{ka}}}="","",{{품질관리비!{ka}}})', align="left", size=9.5)), (2, b, L),
                   (4, F(f"{kb}표시", f'=IF({{품질관리비!{kb}}}="","",{{품질관리비!{kb}}})', align="left", size=9.5))], h=28)
        p.row([(2, "공 사 금 액", L), (4, F("금액표시", '=IF(N({품질관리비!공사금액})=0,"",{품질관리비!공사금액})', fmt='#,##0" 원"')), (2, "공 사 기 간", L),
               (4, F("기간표시", '=IF(N({품질관리비!착공})=0,"",YEAR({품질관리비!착공})&". "&MONTH({품질관리비!착공})&". "&DAY({품질관리비!착공})&". ~ "'
                                 '&YEAR({품질관리비!준공})&". "&MONTH({품질관리비!준공})&". "&DAY({품질관리비!준공})&".")', align="center", size=9.5))], h=28)
        p.row([(2, "발  주  자", L), (4, F("발주자표시", '=IF({품질관리비!발주자}="","",{품질관리비!발주자})', align="left")), (2, "누계 공정률", L),
               (4, F("공정률표시", '=IF(N({품질관리비!공정률})=0,"",{품질관리비!공정률})', fmt="0.00%", align="center"))], h=28)
    p.row([(2, f"계상된\n{nm}관리비", dict(L, size=9.5)), (4, I("계상액", ex=73_377_060 if q else 142_898_834, fmt='#,##0" 원"')), (2, "사 용 률", L),
           (4, F("사용률", '=IF(OR(N({계상액})=0,N({누계계})=0),"",{누계계}/{계상액})', fmt="0.00%", align="center", bold=True))], h=30)
    p.gap(6)
    p.row([(PC, "사        용        금        액", H)], h=26)
    p.row([(4, "항        목", H), (2, F("전회머리", '="전회 누계금액"&CHAR(10)&IF(N(' + src("사용월") + ')=0,"(전월까지)","("&MONTH(' + src("사용월") + '-1)&"월까지)")',
                                          align="center", size=9), H),
           (2, F("금회머리", '="금회 금액"&CHAR(10)&IF(N(' + src("사용월") + ')=0,"(이번 달)","("&MONTH(' + src("사용월") + ')&"월)")', align="center", size=9), H),
           (2, "누 계 금 액", H), (2, "비   고", H)], h=34)
    for i in range(1, NIT + 1):
        name = items[i - 1] if i <= len(items) else None
        pv = prev[i - 1] if (ex and i <= len(prev)) else None
        p.row([(4, I(f"항목#{i}", ex=name, blank=name, size=8.5 if not q else 9.5)),
               (2, I(f"전회#{i}", ex=pv, fmt=WON)),
               (2, F(f"금회#{i}", f'=IF({{항목#{i}}}="","",SUMIF({{{det}!항목[]}},{{항목#{i}}},{{{det}!금액[]}}))', fmt='#,##0;[Red]-#,##0;0')),
               (2, F(f"누계#{i}", f'=IF({{항목#{i}}}="","",N({{전회#{i}}})+N({{금회#{i}}}))', fmt='#,##0;[Red]-#,##0;0')),
               (2, I(f"사용비고#{i}", size=8.5))], h=34 if not q else 28)
    p.k["전회[]"] = f"{p.k['전회#1']}:{p.k[f'전회#{NIT}']}"
    p.k["금회[]"] = f"{p.k['금회#1']}:{p.k[f'금회#{NIT}']}"
    p.k["누계[]"] = f"{p.k['누계#1']}:{p.k[f'누계#{NIT}']}"
    p.row([(4, "계", S), (2, F("전회계", '=SUM({전회[]})', fmt=WON, bold=True)), (2, F("금회계", '=SUM({금회[]})', fmt=WON, bold=True)),
           (2, F("누계계", '=SUM({누계[]})', fmt=WON, bold=True)), (2, "", S)], h=28)
    p.row([(PC, F("대조", f'=IF(ROUND(SUM({{{det}!금액[]}})-{{금회계}},0)<>0,"⚠ 항목별 사용내역서 합계와 금회 합계가 다릅니다 — 항목 이름이 위 표와 똑같은지 보세요.","")',
                  align="left"), {"kind": "warn"})], h=16)
    p.gap(10)
    p.row([(PC, f"      건설공사 {nm}관리비 계상 및 사용기준에 의거 위와 같이 사용내역을 제출합니다.", {"kind": "free", "size": 11})], h=26)
    p.gap(10)
    p.row([(PC, F("제출일", '=IF(N(' + src("사용월") + ')=0,"20     년      월      일",YEAR(' + src("사용월") + ')&" 년  "&MONTH(' + src("사용월") + ')&" 월  "'
                           '&DAY(DATE(YEAR(' + src("사용월") + '),MONTH(' + src("사용월") + ')+1,0))&" 일")', align="center", size=11), {"kind": "cfree"})], h=26)
    p.gap(16)
    p.row([(3, "", FR), (2, "작 성 자 :", {"kind": "free", "bold": True, "align": "right"}), (2, I("작성자", ex="이공무", align="center"), {"border": False}),
           (2, "현장대리인", {"kind": "free", "bold": True, "align": "right"}), (2, I("현장대리인", ex="홍길동", align="center"), {"border": False}),
           (1, "(인)", {"kind": "cfree", "size": 9})], h=28)
    p.end_print()
    p.after_note([f"하늘색 칸 = 자동. 금회 금액은 «{det}» 시트에서 항목 이름으로 모읍니다 — 전회 누계금액(지난달 표의 누계)만 옮겨 적으세요."] +
                 (["안전관리비 항목은 건설기술 진흥법 시행규칙 제60조의 안전관리비 사용 항목입니다(원본 그대로, 오타만 고침)."] if not q else [])
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 금액)."])
    return p


def detail(bk, ex, kind):
    q = kind == "q"
    lg = "품질세부" if q else "안전세부"
    src = "{품질관리비!사용월}"
    nm = "품질" if q else "안전"
    p = _pg(bk, ex, lg)
    rows = Q_DET if q else A_DET
    p.row([(PC, F("제목", f'="{nm}관리비 항목별 사용내역서"&IF(N({src})=0,"","("&' + _ym(src) + '&")")', align="center", size=16, bold=True), {"kind": "title"})], h=38)
    p.row([(2, "공 사 명 :", {"kind": "free", "bold": True}), (10, F("공사명표시", '=IF({품질관리비!공사명}="","",{품질관리비!공사명})', align="left"), {"border": False})], h=24)
    p.row([(3, "항        목", H), (1, "사용일자", dict(H, size=9)), (2, "품    목", H), (2, "규    격", H), (1, "수량", H), (1, "단위", H), (1, "단 가", H), (1, "금  액", H)], h=26)
    for i in range(1, NDET + 1):
        e = rows[i - 1] if (ex and i <= len(rows)) else (None,) * 7
        up = e[6]
        if ex and i <= len(rows) and up is None:           # 신호수 인건비 = 노임명세서 지급 전 노무비
            amt = F(f"금액#{i}", '=IF(N({노임명세서!노무비계})=0,"",{노임명세서!노무비계})', fmt=WON, size=9)
        else:
            amt = F(f"금액#{i}", f'=IF(OR(N({{수량#{i}}})=0,N({{단가#{i}}})=0),"",ROUND({{수량#{i}}}*{{단가#{i}}},0))', fmt=WON, size=9)
        p.row([(3, I(f"항목#{i}", ex=e[0], size=7.5)), (1, I(f"일자#{i}", ex=e[1], fmt='m"/"d', align="center", size=9)),
               (2, I(f"품목#{i}", ex=e[2], size=9)), (2, I(f"규격#{i}", ex=e[3] or None, size=8.5)), (1, I(f"수량#{i}", ex=e[4], fmt="#,##0.##", align="center", size=9)),
               (1, I(f"단위#{i}", ex=e[5], align="center", size=9)), (1, I(f"단가#{i}", ex=up, fmt=WON, size=9)), (1, amt)], h=24)
    p.k["항목[]"] = f"{p.k['항목#1']}:{p.k[f'항목#{NDET}']}"
    p.k["금액[]"] = f"{p.k['금액#1']}:{p.k[f'금액#{NDET}']}"
    p.row([(11, "계", S), (1, F("세부계", '=SUM({금액[]})', fmt=WON, bold=True, size=9))], h=26)
    p.row([(PC, f"※ «항목» 은 {nm}관리비 사용내역서의 항목 이름과 똑같이 적으세요(복사해 붙이기 권함). 금액 = 수량 × 단가(원 단위 반올림).", {"kind": "note"})], h=18)
    p.end_print()
    p.after_note(["하늘색 칸 = 금액(자동). 인건비처럼 명세서가 따로 있으면 금액 칸에 직접 적거나 명세서 합계를 끌어오세요."] if not ex else
                 ["이 시트는 작성 예시입니다. «신호수 인건비» 금액은 노임명세서의 노무비 합계를 끌어온 것입니다."])
    return p


def photos(bk, ex, kind):
    lg = "사진대지(품질)" if kind == "q" else "사진대지(안전)"
    p = _pg(bk, ex, lg, fit=0)
    for pg in (1, 2):
        if pg == 2:
            p.__dict__.setdefault("_brk", set()).add(p.r)
        p.row([(PC, "사  진  대  지", {"kind": "title", "size": 18})], h=36)
        for k in (1, 2, 3):
            n = (pg - 1) * 3 + k
            r0 = p.r
            for _ in range(9):
                p.gap(20)
            p.put(r0, 1, PC, "(사진)", kind="ctext", size=9, rs=9)
            p.row([(2, "항  목", L), (4, I(f"사진항목#{n}")), (1, "일  자", L), (2, I(f"사진일자#{n}", fmt="ymd", align="center")), (1, "금  액", L),
                   (2, I(f"사진금액#{n}", fmt=WON))], h=22)
            p.row([(2, "내  용", L), (10, I(f"사진내용#{n}"))], h=22)
            p.gap(6)
    import docw as d
    d.done(p)
    p.after_note(["사진은 네모 칸 위에 붙여 넣고 크기를 맞추세요."])
    return p


LW = [4, 7, 6] + [3.1] * 16 + [4.4, 8.5, 7.2, 7.2, 7.2, 7.2, 7.2, 8.5, 9]
L_D0 = 4


def payroll(bk, ex):
    p = _pg(bk, ex, "노임명세서", land=True)
    N = len(LW)
    p.row([(N, "노  임  명  세  서", {"kind": "title", "size": 18})], h=34)
    p.row([(3, "회 사 명", L), (8, F("노임회사", '=IF({품질관리비!업체}="","",{품질관리비!업체})', align="left")), (2, "기 간", L),
           (6, F("노임기간", '=IF(N({품질관리비!사용월})=0,"",YEAR({품질관리비!사용월})&". "&MONTH({품질관리비!사용월})&". 1. ~ "&MONTH({품질관리비!사용월})&". "'
                              '&DAY(DATE(YEAR({품질관리비!사용월}),MONTH({품질관리비!사용월})+1,0))&".")', align="center")),
           (2, "공 사 명", L), (N - 21, F("노임공사", '=IF({품질관리비!공사명}="","",{품질관리비!공사명})', align="left", size=9))], h=24)
    p.gap(4)
    heads1 = [(1, "NO.", dict(H, rs=2)), (1, "성 명", dict(H, rs=2)), (1, "직 종", dict(H, rs=2))]
    heads1 += [(1, str(dd), dict(H, size=8)) for dd in range(1, 17)]
    heads1 += [(1, "공수", dict(H, rs=2, size=9)), (1, "노 무 비", H), (1, "소득세", H), (1, "국민연금", H), (1, "고용보험", H), (1, "", H), (1, "공제 총액", dict(H, rs=2, size=9)),
               (1, "지 급 액", dict(H, rs=2)), (1, "주민등록번호\n(비고)", dict(H, rs=2, size=8))]
    p.row(heads1, h=18)
    heads2 = [(1, str(dd), dict(H, size=8)) for dd in range(17, 32)] + [(1, "", H)]
    heads2 += [(1, "단  가", H), (1, "지방소득세", dict(H, size=8.5)), (1, "건강보험", H), (1, "장기요양", H), (1, "", H)]
    p.row(heads2, h=18, start=L_D0)
    first = p.r
    NW = 12
    for i in range(1, NW + 1):
        e = WK[i - 1] if (ex and i <= len(WK)) else (None, None, [None] * 31, None)
        r1 = p.r
        cells = [(1, F(f"노임번호#{i}", f'=IF({{성명#{i}}}="","",{i})', align="center", size=9), {"rs": 2}), (1, I(f"성명#{i}", ex=e[0], align="center", size=9), {"rs": 2}),
                 (1, I(f"직종#{i}", ex=e[1], align="center", size=8.5), {"rs": 2})]
        for dd in range(1, 17):
            v = e[2][dd - 1] if e[0] else None
            cells.append((1, I(f"공수#{i}#{dd}", ex=v if v else None, fmt="0.#", align="center", size=8)))
        rng = f"{{공수#{i}#1}}:{{공수#{i}#16}},{{공수#{i}#17}}:{{공수#{i}#31}}"
        cnt = f'(COUNTIF({{공수#{i}#1}}:{{공수#{i}#16}},">0")+COUNTIF({{공수#{i}#17}}:{{공수#{i}#31}},">0"))'
        pay = f"{{노무비#{i}}}"
        cells += [(1, F(f"공수계#{i}", f'=IF(SUM({rng})=0,"",SUM({rng}))', fmt="0.#", align="center", size=9, bold=True), {"rs": 2}),
                  (1, F(f"노무비#{i}", f'=IF(OR(N({{공수계#{i}}})=0,N({{일급#{i}}})=0),"",ROUND({{공수계#{i}}}*{{일급#{i}}},0))', fmt=WON, size=9)),
                  (1, F(f"소득세#{i}", f'=IF({pay}="","",IF(ROUNDDOWN(MAX(0,{{일급#{i}}}-{{비과세}})*{{소득세율}}*{{공수계#{i}}},-1)<1000,0,'
                                     f'ROUNDDOWN(MAX(0,{{일급#{i}}}-{{비과세}})*{{소득세율}}*{{공수계#{i}}},-1)))', fmt=WON, size=8.5)),
                  (1, F(f"연금#{i}", f'=IF({pay}="","",IF({cnt}>={{보험일수}},ROUNDDOWN({pay}*{{연금율}},-1),0))', fmt=WON, size=8.5)),
                  (1, F(f"고용#{i}", f'=IF({pay}="","",ROUNDDOWN({pay}*{{고용율}},-1))', fmt=WON, size=8.5)),
                  (1, "", {"kind": "text"}),
                  (1, F(f"공제#{i}", f'=IF({pay}="","",{{소득세#{i}}}+{{지방세#{i}}}+{{연금#{i}}}+{{건강#{i}}}+{{요양#{i}}}+{{고용#{i}}})', fmt=WON, size=9), {"rs": 2}),
                  (1, F(f"지급#{i}", f'=IF({pay}="","",{pay}-{{공제#{i}}})', fmt=WON, size=9, bold=True), {"rs": 2}),
                  (1, I(f"비고#{i}", size=7.5), {"rs": 2})]
        p.row(cells, h=17)
        cells = []
        for dd in range(17, 32):
            v = e[2][dd - 1] if e[0] else None
            cells.append((1, I(f"공수#{i}#{dd}", ex=v if v else None, fmt="0.#", align="center", size=8)))
        cells.append((1, "", {"kind": "text"}))
        cells += [(1, I(f"일급#{i}", ex=e[3], fmt=WON, size=8.5)),
                  (1, F(f"지방세#{i}", f'=IF({pay}="","",ROUNDDOWN({{소득세#{i}}}*0.1,-1))', fmt=WON, size=8.5)),
                  (1, F(f"건강#{i}", f'=IF({pay}="","",IF({cnt}>={{보험일수}},ROUNDDOWN({pay}*{{건강율}},-1),0))', fmt=WON, size=8.5)),
                  (1, F(f"요양#{i}", f'=IF({pay}="","",ROUNDDOWN({{건강#{i}}}*{{요양비}},-1))', fmt=WON, size=8.5)),
                  (1, "", {"kind": "text"})]
        p.row(cells, h=17, start=L_D0)
    last = p.r - 1
    cols = {"노무비": 21, "공제": 26, "지급": 27}
    from openpyxl.utils import get_column_letter as CLx
    nsum = "+".join(f"N({{노무비#{i}}})" for i in range(1, NW + 1))
    p.row([(3, "합   계", S), (16, "", S), (1, F("공수합", f'=IF(SUM(T{first}:T{last})=0,"",SUM(T{first}:T{last}))', fmt="0.#", align="center", bold=True, size=9)),
           (1, F("노무비계", f'=IF(({nsum})=0,"",{nsum})', fmt=WON, bold=True, size=9)),
           (4, "", S), (1, F("공제계", f'=IF(SUM(Z{first}:Z{last})=0,"",SUM(Z{first}:Z{last}))', fmt=WON, bold=True, size=9)),
           (1, F("지급계", f'=IF(SUM(AA{first}:AA{last})=0,"",SUM(AA{first}:AA{last}))', fmt=WON, bold=True, size=9)), (1, "", S)], h=22)
    p.gap(4)
    p.row([(4, "공제 기준(2026년)", L), (3, "소득세 비과세 일급", {"kind": "text", "size": 8.5}), (2, I("비과세", blank=150_000, rate=True, fmt=WON, size=8.5)),
           (3, "소득세율(6%×45%)", {"kind": "text", "size": 8.5}), (2, I("소득세율", blank=0.027, rate=True, fmt="0.0%", size=8.5)),
           (2, "국민연금", {"kind": "text", "size": 8.5}), (2, I("연금율", blank=0.0475, rate=True, fmt="0.00%", size=8.5)),
           (2, "건강보험", {"kind": "text", "size": 8.5}), (2, I("건강율", blank=0.03595, rate=True, fmt="0.000%", size=8.5)),
           (1, "요양/건강", {"kind": "text", "size": 7.5}), (1, I("요양비", blank=0.1314, rate=True, fmt="0.00%", size=8)),
           (1, "고용", {"kind": "text", "size": 8}), (1, I("고용율", blank=0.009, rate=True, fmt="0.0%", size=8)),
           (1, "8일↑", {"kind": "text", "size": 7.5}), (1, I("보험일수", blank=8, rate=True, fmt='0"일"', size=8))], h=22)
    p.end_print()
    p.after_note(["공수 칸에 1 · 0.5 · 1.5 처럼 적으세요. 노무비 = 공수 합 × 단가(일급). 소득세 = (일급 − 15만원) × 2.7% × 공수(1천원 미만은 안 뗌), 지방소득세 = 소득세의 10%.",
                  "국민연금 · 건강보험 · 장기요양은 이 현장에서 일한 날이 8일 이상인 사람만(1개월 이상 근로 · 다른 현장 합산 · 나이 등은 따로 확인 — 필요하면 칸을 고쳐 쓰세요). 10원 미만 버림.",
                  "주민등록번호 · 계좌는 이 파일에 적지 말고 따로 보관하는 것을 권합니다(개인정보)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 사람 · 금액). 주민등록번호는 예시에도 적지 않습니다."])
    return p


def draw(bk, ex):
    usage(bk, ex, "q")        # 공통 정보가 있는 시트를 먼저(다른 시트가 부름)
    cover(bk, ex, "q")
    detail(bk, ex, "q")
    photos(bk, ex, "q")
    cover(bk, ex, "a")
    usage(bk, ex, "a")
    detail(bk, ex, "a")
    photos(bk, ex, "a")
    payroll(bk, ex)
    wb = bk.wb
    order = ["표지(품질)", "품질관리비", "품질세부", "사진대지(품질)", "표지(안전)", "안전관리비", "안전세부", "사진대지(안전)", "노임명세서"]
    names = [n if not ex else "예시-" + n for n in order]
    sheets = [wb[n] for n in names]
    if not ex:
        wb._sheets = sheets + [s for s in wb._sheets if s not in sheets]
    else:
        blanks = [s for s in wb._sheets if not s.title.startswith("예시-")]
        wb._sheets = blanks + sheets + [s for s in wb._sheets if s.title.startswith("예시-") and s not in sheets]


def _fl10(x):
    import math
    return math.floor(x / 10 + 1e-9) * 10


def expect(pages):
    import calendar
    qv, av, qd, ad, pr = (pages[k] for k in ("품질관리비", "안전관리비", "품질세부", "안전세부", "노임명세서"))
    m = qv["사용월"]
    ym = f"{m.year}년 {m.month:02d}월"
    last = calendar.monthrange(m.year, m.month)[1]
    out = {}
    # 노임
    e = {"노임회사": qv["업체"], "노임기간": f"{m.year}. {m.month}. 1. ~ {m.month}. {last}.", "노임공사": qv["공사명"]}
    tot_pay = tot_ded = tot_net = tot_q = 0
    for i in range(1, 13):
        nm = pr.get(f"성명#{i}")
        e[f"노임번호#{i}"] = i if nm else ""
        ds = [pr.get(f"공수#{i}#{dd}") for dd in range(1, 32)]
        q = sum(v for v in ds if v)
        e[f"공수계#{i}"] = q if q else ""
        up = pr.get(f"일급#{i}")
        if not q or not up:
            for k in ("노무비", "소득세", "지방세", "연금", "건강", "요양", "고용", "공제", "지급"):
                e[f"{k}#{i}"] = ""
            continue
        pay = round(q * up)
        it = _fl10(max(0, up - pr["비과세"]) * pr["소득세율"] * q)
        it = 0 if it < 1000 else it
        lt = _fl10(it * 0.1)
        n = sum(1 for v in ds if v and v > 0)
        np_ = _fl10(pay * pr["연금율"]) if n >= pr["보험일수"] else 0
        hi = _fl10(pay * pr["건강율"]) if n >= pr["보험일수"] else 0
        lc = _fl10(hi * pr["요양비"])
        ei = _fl10(pay * pr["고용율"])
        ded = it + lt + np_ + hi + lc + ei
        e.update({f"노무비#{i}": pay, f"소득세#{i}": it, f"지방세#{i}": lt, f"연금#{i}": np_, f"건강#{i}": hi, f"요양#{i}": lc, f"고용#{i}": ei,
                  f"공제#{i}": ded, f"지급#{i}": pay - ded})
        tot_pay += pay
        tot_ded += ded
        tot_net += pay - ded
        tot_q += q
    e["공수합"] = tot_q or ""
    e["노무비계"] = tot_pay or ""
    e["공제계"] = tot_ded or ""
    e["지급계"] = tot_net or ""
    out["노임명세서"] = e
    # 세부
    sums = {}
    for lg, det, nm in (("품질세부", qd, "품질"), ("안전세부", ad, "안전")):
        e = {"제목": f"{nm}관리비 항목별 사용내역서({ym})", "공사명표시": qv["공사명"]}
        s_ = 0
        by = {}
        for i in range(1, NDET + 1):
            a, u = det.get(f"수량#{i}"), det.get(f"단가#{i}")
            if det.get(f"품목#{i}") == "신호수 인건비" and u is None:
                v = tot_pay
            else:
                v = round(a * u) if (a and u) else ""
            e[f"금액#{i}"] = v
            if v != "":
                s_ += v
                by[det.get(f"항목#{i}")] = by.get(det.get(f"항목#{i}"), 0) + v
        e["세부계"] = s_
        sums[lg] = (s_, by)
        out[lg] = e
    for lg, v, det, items in (("품질관리비", qv, "품질세부", Q_ITEMS), ("안전관리비", av, "안전세부", A_ITEMS)):
        nm = lg[:2]
        s_, by = sums[det]
        e = {"제목": f"{nm}관리비 사용내역서({ym})", "전회머리": f"전회 누계금액\n({m.month - 1 if m.month > 1 else 12}월까지)", "금회머리": f"금회 금액\n({m.month}월)"}
        tp = tn = tc = 0
        for i in range(1, NIT + 1):
            it = v.get(f"항목#{i}")
            if not it:
                e[f"금회#{i}"] = ""
                e[f"누계#{i}"] = ""
                continue
            now = by.get(it, 0)
            pv = v.get(f"전회#{i}") or 0
            e[f"금회#{i}"] = now
            e[f"누계#{i}"] = pv + now
            tp += pv
            tn += now
            tc += pv + now
        e.update({"전회계": tp, "금회계": tn, "누계계": tc, "사용률": tc / v["계상액"] if tc else "",
                  "대조": "" if round(s_ - tn) == 0 else "⚠ 항목별 사용내역서 합계와 금회 합계가 다릅니다 — 항목 이름이 위 표와 똑같은지 보세요.",
                  "제출일": f"{m.year} 년  {m.month} 월  {last} 일"})
        if lg == "안전관리비":
            e.update({"업체표시": qv["업체"], "공사명표시": qv["공사명"], "소재지표시": qv["소재지"], "대표자표시": qv["대표자"], "금액표시": qv["공사금액"],
                      "기간표시": f"{qv['착공'].year}. {qv['착공'].month}. {qv['착공'].day}. ~ {qv['준공'].year}. {qv['준공'].month}. {qv['준공'].day}.",
                      "발주자표시": qv["발주자"], "공정률표시": qv["공정률"]})
        out[lg] = e
    for lg in ("표지(품질)", "표지(안전)"):
        out[lg] = {"표지공사명": qv["공사명"], "표지월": ym + "분", "표지업체": qv["업체"]}
    out["사진대지(품질)"] = {}
    out["사진대지(안전)"] = {}
    return out
