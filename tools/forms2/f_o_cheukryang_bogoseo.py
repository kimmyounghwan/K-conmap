# -*- coding: utf-8 -*-
"""시공측량 보고서 — 원본 틀(표지 · 제출문 · 목차 · 제1장 과업의 개요(목적 · 위치 · 범위 · 기간) · 제2장 조사 및 측량(현장조사 · 측량조사 ·
조사장비 · 기준점성과표 · 시공측량점의 조서) · 제3장 측량현황도(성과표 · 도면))을 새로 만든 것.
■ 원본의 위치도 · 근경/원경 사진 · 도면은 실제 현장이라 쓰지 않고 붙이는 칸으로 둠.
■ 좌표계: 원본 «Bessel 중부원점» 은 옛 측지계라 목록에서 고르게 함(세계측지계 GRS80 중부 · 서부 · 동부 · 동해 원점 / 옛 Bessel).
■ 수식: 과업기간 일수 · 제출문 과업명 · 성과표 점간 거리 = √(ΔX² + ΔY²) · 고저차 ΔZ · 경사(%) · 누가거리 · 점 개수."""
import datetime

import docw as d
from fb import F, I

SLUG = "o-cheukryang-bogoseo"
TITLE = "시공측량 보고서"
WHERE = "orig"
PREV = [(4, "과업의 개요 — 빈 서식"), (13, "과업의 개요 — 작성 예시"), (17, "성과표 — 작성 예시")]
PAGES = 9
NSHEETS = 4
MULTI = True
SHORT = ("시공측량 보고서(제출문 · 과업의 개요 · 조사 및 측량 · 기준점 성과표 · 시공측량점의 조서 · 성과표). 성과표에 좌표를 적으면 "
         "점간 거리 · 고저차 · 경사 · 누가거리를 셈해 줍니다.")
NOTE = "위치도 · 근경/원경 사진 · 도면 칸에는 현장 자료를 붙여 넣으세요. 좌표계는 목록에서 고릅니다(세계측지계가 기본)."

D = datetime.date
W = [7.6] * 12
PC = 12
L = {"kind": "label"}
H = {"kind": "head"}
FR = {"kind": "free"}
DATUM = ["세계측지계(GRS80) 중부원점", "세계측지계(GRS80) 서부원점", "세계측지계(GRS80) 동부원점", "세계측지계(GRS80) 동해원점", "Bessel(옛 측지계) 중부원점"]
NPTS = 32
EXP = [(453210.125, 198450.310, 25.431, "(1) 콘크리트 포장"), (453228.402, 198462.118, 25.388, ",,"), (453246.870, 198474.005, 25.352, ",,"),
       (453265.214, 198485.940, 25.301, ",,"), (453283.655, 198497.702, 25.266, "(2) 콘크리트 포장"), (453302.011, 198509.588, 25.214, ",,"),
       (453320.478, 198521.395, 25.187, "날개벽 시점"), (453322.901, 198525.190, 25.190, "날개벽 종점"), (453340.550, 198533.884, 25.142, "수로암거"),
       (453359.012, 198545.623, 25.096, ",,")]


def _pg(bk, ex, lg, fit=0):
    return bk.page(lg, W, ex=ex, fit_height=fit, sheetname=lg if not ex else "예시-" + lg, margins=(0.7, 0.7, 0.7, 0.7))


def cover(bk, ex):
    p = _pg(bk, ex, "표지", fit=1)
    p.gap(60)
    p.row([(PC, I("과업명", ex="가나지구 배수로 정비공사", blank="공 사 명", fmt='"[ "@" ]"', align="center", size=15), {"border": False})], h=32)
    p.gap(30)
    p.row([(PC, "시 공 측 량 보 고 서", {"kind": "title", "size": 28})], h=64)
    p.gap(170)
    p.row([(PC, I("작성월", ex=D(2026, 3, 1), fmt='yyyy". "mm"."', blank="20    .    .", align="center", size=14), {"border": False})], h=30)
    p.gap(230)
    p.row([(PC, I("측량사", ex="예시측량(주)", blank="(측량 회사)", align="center", size=16, bold=True), {"border": False})], h=40)
    p.end_print()
    p.after_note(["공사명(과업명) · 작성 연월 · 측량 회사를 한 번만 적으면 뒤 장에 저절로 들어갑니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 좌표)."])
    return p


def body(bk, ex):
    p = _pg(bk, ex, "본문")
    p.dv_list("좌표계", DATUM)
    nm = '{표지!과업명}'
    p.gap(20)
    p.row([(PC, "제   출   문", {"kind": "title", "size": 20})], h=48)
    p.gap(30)
    p.row([(1, "", FR), (6, I("수신", ex="가나지구 건설사업관리단", blank="건설사업관리단"), {"border": False}), (5, "귀하", FR)], h=26)
    p.gap(12)
    p.row([(1, "", FR), (10, F("제출글", '="  귀 본부와 계약 체결한 「"&IF(OR(' + nm + '="",' + nm + '="공 사 명"),"○○ 공사",' + nm + ')&"」 시공측량의 측량성과를 '
                                        '완료하였기에 본 보고서를 제출합니다."', align="left", ink=False), {"kind": "free", "valign": "top", "size": 11}), (1, "", FR)], h=48)
    p.gap(24)
    p.row([(6, "", FR), (6, F("제출월", '=IF(N({표지!작성월})=0,"20      년      월",YEAR({표지!작성월})&" 년 "&MONTH({표지!작성월})&" 월")', align="center"),
            {"kind": "cfree"})], h=26)
    p.row([(6, "", FR), (6, F("제출사", '=IF(OR({표지!측량사}="",{표지!측량사}="(측량 회사)"),"",{표지!측량사})', align="center", bold=True), {"kind": "cfree"})], h=26)
    p.__dict__.setdefault("_brk", set()).add(p.r)
    p.row([(PC, "목          차", {"kind": "title", "size": 20})], h=48)
    for a, subs in (("제 1 장  과업의 개요", ["1.1 과업 목적", "1.2 과업 위치", "1.3 과업 범위", "1.4 과업 기간"]),
                    ("제 2 장  조사 및 측량", ["2.1 현장조사", "2.2 측량조사", "2.3 조사장비", "2.4 기준점 성과표", "2.5 시공측량점의 조서"]),
                    ("제 3 장  측량현황도", ["3.1 성과표", "3.2 도면"])):
        p.row([(1, "", FR), (10, a, {"kind": "free", "bold": True, "size": 12}), (1, "", FR)], h=28)
        for s in subs:
            p.row([(2, "", FR), (9, s, {"kind": "free", "size": 11}), (1, "", FR)], h=22)
    p.__dict__.setdefault("_brk", set()).add(p.r)
    d.h1(p, "제 1 장  과업의 개요")
    d.h2(p, "1.1 과업 목적")
    p.row([(PC, I("목적", ex="배수로 정비공사의 시공 기준점을 설치하고 현황을 측량하여 정확한 시공과 기성 · 준공 검측의 기준으로 삼기 위함.",
                  blank="시공 기준점을 설치하고 현황을 측량하여 정확한 시공과 검측의 기준으로 삼기 위함.", size=10), {"valign": "top", "border": False})], h=40)
    d.h2(p, "1.2 과업 위치")
    p.row([(1, "", FR), (3, "1) 과업 위치 :", {"kind": "free"}), (8, I("위치", ex="가나시 가나동 일원", blank="○○도 ○○군 ○○리 일원"), {"border": False})], h=22)
    p.row([(1, "", FR), (11, "2) 과업 위치도", {"kind": "free"})], h=22)
    r0 = p.r
    for _ in range(9):
        p.gap(20)
    p.put(r0, 2, 11, "(과업 위치도를 붙이는 곳 — 상세 위치는 표시하지 않아도 됨)", kind="ctext", size=9, rs=9)
    d.h2(p, "1.3 과업 범위")
    d.items(p, ["현장답사 및 자료조사(지장물 조사)", "골조측량(도근측량)", "수준측량(국가기준점에 의한 측량)", "지형 현황측량", "좌표측량"], lead=1)
    d.h2(p, "1.4 과업 기간")
    steps = [("현장답사 및 자료조사", D(2026, 3, 2), D(2026, 3, 4)), ("현황측량 및 자료수령", D(2026, 3, 5), D(2026, 3, 5)),
             ("도면정리 및 보고서 작성", D(2026, 3, 6), D(2026, 3, 13))]
    for j, (t, s, e) in enumerate(steps, 1):
        p.row([(1, f"{j})", {"kind": "free", "align": "right"}), (4, t, FR), (2, I(f"기간시작#{j}", ex=s if ex else None, fmt="ymd", align="center")),
               (1, "~", {"kind": "ctext"}), (2, I(f"기간끝#{j}", ex=e if ex else None, fmt="ymd", align="center")),
               (2, F(f"기간일수#{j}", f'=IF(OR(N({{기간시작#{j}}})=0,N({{기간끝#{j}}})=0),"",{{기간끝#{j}}}-{{기간시작#{j}}}+1)', fmt='"("0"일)"', align="center"))], h=24)
    p.row([(5, "전체 과업 기간", {"kind": "label"}),
           (7, F("전체기간", '=IF(COUNT({기간시작#1},{기간시작#2},{기간시작#3})=0,"",MONTH(MIN({기간시작#1},{기간시작#2},{기간시작#3}))&"/"&DAY(MIN({기간시작#1},{기간시작#2},{기간시작#3}))'
                            '&" ~ "&MONTH(MAX({기간끝#1},{기간끝#2},{기간끝#3}))&"/"&DAY(MAX({기간끝#1},{기간끝#2},{기간끝#3}))&" ("&(MAX({기간끝#1},{기간끝#2},{기간끝#3})'
                            '-MIN({기간시작#1},{기간시작#2},{기간시작#3})+1)&"일)")', align="left", bold=True))], h=24)
    p.__dict__.setdefault("_brk", set()).add(p.r)
    d.h1(p, "제 2 장  조사 및 측량")
    d.h2(p, "2.1 현장조사")
    d.items(p, ["일반사항 : 측량에 앞서 현지답사 및 기준점 확인, 수준점 확인 등 사전에 필요한 사항을 조사하였다.",
                "현장답사 : 측량 대상지를 확인하고 현지 지형을 숙지하여 측량 시행 시 사전 지형을 알 수 있도록 하였으며, 측량 기준점 계획을 세우고 기준점을 확인하였다.",
                "지장물 조사 : 현장 안팎에서 육안으로 확인할 수 있는 지장물을 확인하여 측량 때 빠지지 않도록 하였다."], lead=1)
    d.h2(p, "2.2 측량조사")
    d.items(p, ["일반사항 : 측량은 좌표(X, Y, H) 설정을 위한 골조측량과 지형 현황을 파악하기 위한 지형측량으로 나뉜다.",
                "도근측량 : 기준점을 이용하여 실시하고 현황측량 등에 활용하였으며, 광파기 및 GNSS 를 사용하여 정밀도 높은 측량을 실시하였다.",
                "수준측량 : 기존 통합기준점을 이용하여 대상 지점 범위 안에 도근점을 설치하고 도근점의 표고를 측정하였다.",
                "지형현황측량 : 도근점의 평면좌표 및 표고를 기준으로 대상 지역의 시설 현황과 주변 지형을 상세히 측량하였으며, 건물 · 도로 · 전주 등 지장물과 "
                "포장 · 맨홀 등을 구분하여 도면에 표시하였다."], lead=1)
    p.row([(3, "좌 표 계", L), (9, I("좌표계", ex=DATUM[0], blank=DATUM[0], dv="좌표계", align="left"))], h=24)
    d.h2(p, "2.3 조사장비")
    p.row([(3, "명  칭", H), (3, "제 조 사", H), (2, "모 델 명", H), (1, "수량", H), (3, "비  고", H)], h=24)
    eq = [("GNSS 수신기", "예시측기(주)", "GN-100", "1 set", "기준점 · 도근 · 현황측량"), ("디지털 레벨", "예시측기(주)", "DL-20", "1 set", "수준측량"),
          ("기  타", None, None, None, None)]
    for j, e in enumerate(eq, 1):
        p.row([(3, I(f"장비명#{j}", ex=e[0], blank=e[0] if j < 3 else "기  타", align="center")), (3, I(f"제조사#{j}", ex=e[1] if ex else None, align="center")),
               (2, I(f"모델#{j}", ex=e[2] if ex else None, align="center")), (1, I(f"장비수량#{j}", ex=e[3] if ex else None, align="center")),
               (3, I(f"장비비고#{j}", ex=e[4] if ex else None, size=9))], h=24)
    d.h2(p, "2.4 기준점 성과표")
    p.row([(2, "점의 종류", H), (2, "점의 명칭", H), (2, "소 재 지", H), (2, "X (N)", H), (2, "Y (E)", H), (2, "Z (H)", H)], h=24)
    bex = [("통합기준점", "U가나01", "가나시 가나동", 453102.884, 198390.512, 26.118), ("도근점", "CP.1", "현장 시점", 453198.301, 198441.927, 25.602),
           ("도근점", "CP.2", "현장 종점", 453371.455, 198552.036, 25.071)]
    for j in range(1, 5):
        e = bex[j - 1] if (ex and j <= len(bex)) else (None,) * 6
        p.row([(2, I(f"기준종류#{j}", ex=e[0], align="center")), (2, I(f"기준명#{j}", ex=e[1], align="center")), (2, I(f"기준위치#{j}", ex=e[2], align="center", size=9)),
               (2, I(f"기준X#{j}", ex=e[3], fmt="#,##0.000", align="center")), (2, I(f"기준Y#{j}", ex=e[4], fmt="#,##0.000", align="center")),
               (2, I(f"기준Z#{j}", ex=e[5], fmt="#,##0.000", align="center"))], h=24)
    d.done(p)
    p.after_note(["하늘색 칸 = 자동(제출문 공사명 · 제출 연월 · 회사 · 과업기간 일수). 좌표계는 목록에서 고르세요."] if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 좌표)."])
    return p


def points(bk, ex):
    p = _pg(bk, ex, "측량점조서")
    p.dv_list("상태", ["양호", "망실", "훼손", "이설"])
    for k in (1, 2):
        e = {1: ("CP.1", "도근점", D(2026, 3, 5), "이측량", "양호", "현장 시점 좌측 옹벽 위", 453198.301, 198441.927, 25.602),
             2: ("CP.2", "도근점", D(2026, 3, 5), "이측량", "양호", "현장 종점 우측 보도", 453371.455, 198552.036, 25.071)}[k] if ex else (None,) * 9
        if k == 2:
            p.__dict__.setdefault("_brk", set()).add(p.r)
        d.h2(p, "2.5 시공측량점의 조서")
        p.row([(PC, "시 공 측 량 점 의  조 서", {"kind": "title", "size": 15})], h=34)
        p.row([(3, "작 업 명 칭", L), (9, F(f"작업명#{k}", '=IF(OR({표지!과업명}="",{표지!과업명}="공 사 명"),"",{표지!과업명}&" 시공측량")', align="left"))], h=26)
        p.row([(3, "점 의 명 칭", L), (3, I(f"점명#{k}", ex=e[0], align="center")), (3, "점 의 종 류", L), (3, I(f"점종류#{k}", ex=e[1], align="center"))], h=26)
        p.row([(3, "조 사 일 시", L), (3, I(f"조사일#{k}", ex=e[2], fmt="ymd", align="center")), (3, "조 사 자", L), (3, I(f"조사자#{k}", ex=e[3], align="center"))], h=26)
        p.row([(3, "좌 표 원 점", L), (3, F(f"원점#{k}", '=IF({본문!좌표계}="","",{본문!좌표계})', align="center", size=8.5)), (3, "상    태", L),
               (3, I(f"상태#{k}", ex=e[4], dv="상태", align="center"))], h=26)
        p.row([(3, "소 재 지", L), (9, I(f"소재지#{k}", ex=e[5]))], h=26)
        p.row([(3, "성    과", L), (1, "X", {"kind": "ctext"}), (2, I(f"X#{k}", ex=e[6], fmt="#,##0.000", align="center")), (1, "Y", {"kind": "ctext"}),
               (2, I(f"Y#{k}", ex=e[7], fmt="#,##0.000", align="center")), (1, "Z", {"kind": "ctext"}), (2, I(f"Z#{k}", ex=e[8], fmt="#,##0.000", align="center"))], h=26)
        p.row([(6, "근    경", H), (6, "원    경", H)], h=22)
        r0 = p.r
        for _ in range(11):
            p.gap(20)
        p.put(r0, 1, 6, "(근경 사진)", kind="ctext", size=9, rs=11)
        p.put(r0, 7, 12, "(원경 사진)", kind="ctext", size=9, rs=11)
    d.done(p)
    p.after_note(["점을 더 적으려면 한 장(2.5 시공측량점의 조서 ~ 사진)을 복사해 붙이세요. 좌표 원점은 본문의 좌표계를 따라갑니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 점 · 좌표)."])
    return p


def table(bk, ex):
    p = _pg(bk, ex, "성과표")
    d.h1(p, "제 3 장  측량현황도")
    d.h2(p, "3.1 성과표")
    p.row([(1, "점 번 호", H), (2, "X (N)", H), (2, "Y (E)", H), (1, "Z (H)", H), (1, "점간거리\n(m)", dict(H, size=8.5)), (1, "누가거리\n(m)", dict(H, size=8.5)),
           (1, "고저차\n(m)", dict(H, size=8.5)), (1, "경사\n(%)", dict(H, size=8.5)), (2, "비  고", H)], h=30)
    first = p.r
    for i in range(1, NPTS + 1):
        e = EXP[i - 1] if (ex and i <= len(EXP)) else (None,) * 4
        if i == 1:
            dist = '=""'
            dz = '=""'
        else:
            dist = (f'=IF(OR(N({{X#{i}}})=0,N({{Y#{i}}})=0,N({{X#{i - 1}}})=0,N({{Y#{i - 1}}})=0),"",ROUND(SQRT(({{X#{i}}}-{{X#{i - 1}}})^2+({{Y#{i}}}-{{Y#{i - 1}}})^2),3))')
            dz = f'=IF(OR({{Z#{i}}}="",{{Z#{i - 1}}}=""),"",ROUND({{Z#{i}}}-{{Z#{i - 1}}},3))'
        cum = (f'=IF(N({{X#{i}}})=0,"",0)' if i == 1 else f'=IF({{거리#{i}}}="","",N({{누가#{i - 1}}})+{{거리#{i}}})')
        slope = f'=IF(OR({{거리#{i}}}="",{{고저#{i}}}="",N({{거리#{i}}})=0),"",ROUND({{고저#{i}}}/{{거리#{i}}}*100,2))'
        p.row([(1, F(f"번호#{i}", f'=IF(N({{X#{i}}})=0,"","NO."&COUNT({{X#1}}:{{X#{i}}}))', align="center", size=9)),
               (2, I(f"X#{i}", ex=e[0], fmt="#,##0.000", align="center", size=9)), (2, I(f"Y#{i}", ex=e[1], fmt="#,##0.000", align="center", size=9)),
               (1, I(f"Z#{i}", ex=e[2], fmt="0.000", align="center", size=9)),
               (1, F(f"거리#{i}", dist, fmt="0.000", align="center", size=9)), (1, F(f"누가#{i}", cum, fmt="#,##0.000", align="center", size=9)),
               (1, F(f"고저#{i}", dz, fmt='+0.000;-0.000;0.000', align="center", size=9)), (1, F(f"경사#{i}", slope, fmt='+0.00;-0.00;0.00', align="center", size=9)),
               (2, I(f"성과비고#{i}", ex=e[3], size=8.5))], h=17)
    last = p.r - 1
    p.row([(3, "합   계", {"kind": "sum"}), (3, F("점개수", f'=IF(COUNT(B{first}:B{last})=0,"","측점 "&COUNT(B{first}:B{last})&"점")', align="center", bold=True)),
           (2, F("총연장", f'=IF(COUNT(H{first}:H{last})=0,"",MAX(H{first}:H{last}))', fmt='"총 "#,##0.000" m"', align="center", bold=True)), (4, "", {"kind": "sum"})], h=24)
    p.row([(PC, "※ 점간거리 = √(ΔX² + ΔY²) (앞 점과의 수평거리) · 고저차 = 이 점 Z − 앞 점 Z · 경사 = 고저차 ÷ 점간거리 × 100", {"kind": "note"})], h=18)
    p.__dict__.setdefault("_brk", set()).add(p.r)
    d.h2(p, "3.2 도면")
    r0 = p.r
    for _ in range(30):
        p.gap(22)
    p.put(r0, 1, PC, "(측량현황도를 붙이는 곳)", kind="ctext", size=10, rs=30)
    d.done(p)
    p.after_note(["점 번호는 X 를 적으면 저절로 붙습니다(NO.1, NO.2 …). 하늘색 칸 = 자동(점간거리 · 누가거리 · 고저차 · 경사 · 합계)."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 좌표)."])
    return p


def draw(bk, ex):
    cover(bk, ex)
    body(bk, ex)
    points(bk, ex)
    table(bk, ex)


def expect(pages):
    import math
    cv, b, pt, tb = pages["표지"], pages["본문"], pages["측량점조서"], pages["성과표"]
    nm = cv["과업명"]
    s = cv["작성월"]
    out = {"본문": {"제출글": f"  귀 본부와 계약 체결한 「{nm}」 시공측량의 측량성과를 완료하였기에 본 보고서를 제출합니다.",
                  "제출월": f"{s.year} 년 {s.month} 월", "제출사": cv["측량사"]}}
    st = [b.get(f"기간시작#{j}") for j in (1, 2, 3)]
    en = [b.get(f"기간끝#{j}") for j in (1, 2, 3)]
    for j in (1, 2, 3):
        out["본문"][f"기간일수#{j}"] = (en[j - 1] - st[j - 1]).days + 1 if (st[j - 1] and en[j - 1]) else ""
    a, z = min(x for x in st if x), max(x for x in en if x)
    out["본문"]["전체기간"] = f"{a.month}/{a.day} ~ {z.month}/{z.day} ({(z - a).days + 1}일)"
    out["측량점조서"] = {f"작업명#{k}": f"{nm} 시공측량" for k in (1, 2)}
    out["측량점조서"].update({f"원점#{k}": b["좌표계"] for k in (1, 2)})
    e = {}
    n = 0
    cum = 0.0
    last_cum = None
    for i in range(1, NPTS + 1):
        x, y, zz = tb.get(f"X#{i}"), tb.get(f"Y#{i}"), tb.get(f"Z#{i}")
        if x:
            n += 1
            e[f"번호#{i}"] = f"NO.{n}"
        else:
            e[f"번호#{i}"] = ""
        if i == 1:
            e[f"거리#{i}"] = ""
            e[f"고저#{i}"] = ""
            e[f"누가#{i}"] = 0 if x else ""
            e[f"경사#{i}"] = ""
            continue
        px, py, pz = tb.get(f"X#{i - 1}"), tb.get(f"Y#{i - 1}"), tb.get(f"Z#{i - 1}")
        dist = round(math.hypot(x - px, y - py), 3) if (x and y and px and py) else ""
        dz = round(zz - pz, 3) if (zz is not None and pz is not None) else ""
        e[f"거리#{i}"] = dist
        e[f"고저#{i}"] = dz
        if dist == "":
            e[f"누가#{i}"] = ""
        else:
            prev = e[f"누가#{i - 1}"]
            cum = (prev if prev != "" else 0) + dist
            e[f"누가#{i}"] = cum
            last_cum = cum
        e[f"경사#{i}"] = round(dz / dist * 100, 2) if (dist not in ("", 0) and dz != "") else ""
    e["점개수"] = f"측점 {n}점" if n else ""
    e["총연장"] = last_cum if last_cum is not None else ""
    out["성과표"] = e
    out["표지"] = {}
    return out
