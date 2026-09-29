# -*- coding: utf-8 -*-
"""아스콘 포장 작업계획서 — 원본 틀(공사명 · 작업일 · 작업 책임자 · 일자별 작업구간/장비·인원 투입계획/비고 · 작업순서 · 포장 단면도 · 전경 사진 +
시공순서도 한 장)을 새로 만든 것.
■ 단면도·시공순서도 그림은 원본 그대로(소장님: 「설명에 필요한 사진은 그대로 쓸 것」).
■ 수식: 작업일 요일·일수 · 일자 칸(첫날 · 다음날) · 날마다 아스콘 물량(t) = 포장거리 × 폭 × 두께 × 밀도(노란 칸 2.35) ·
        덤프 대수 = 물량 ÷ 1대 적재(노란 칸 15t) · 비고 «(당일 포장거리 …m) 기층 …t» · 단면 두께 합계."""
import datetime
import os

from fb import F, I

SLUG = "o-ascon-jageop"
TITLE = "아스콘 포장 작업계획서"
WHERE = "orig"
PREV = [(1, "계획서 — 빈 서식"), (4, "계획서 — 작성 예시"), (3, "시공순서도(원본 그림)")]
PAGES = 3
NSHEETS = 2
MULTI = True
SHORT = ("아스콘 포장 작업계획서(일자별 장비·인원 투입계획 · 작업순서 · 단면도 · 시공순서도). 포장거리·폭·두께를 적으면 "
         "아스콘 물량(t)과 덤프 대수를 셈해 비고에 적어 줍니다.")
NOTE = "노란 칸(아스콘 밀도 2.35t/㎥ · 덤프 1대 적재 15t)은 현장에 맞게 고치세요. 단면도·시공순서도 그림은 원본 그대로입니다."

D = datetime.date
IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img", SLUG)
W = [12, 22, 18, 24, 22]
N = 5
L = {"kind": "label"}
HD = {"kind": "head"}
FR = {"kind": "free"}
WKD = 'CHOOSE(WEEKDAY({d}),"일","월","화","수","목","금","토")'
KO = "월화수목금토일"
EQ1 = ["스키로더, 콤비 3.5ton", "디스트리뷰터 1.0ton", "포장공 3인"]
EQ2 = ["덤프 15ton 2대", "백호 0.6㎥ 3대", "신호수 2명", "보통인부 4명"]
STEPS = ["가포장 보조기층 걷어내기(T=200) : B/H 0.6㎥, D/T 15ton", "보조기층 다짐 : 1ton 롤러", "프라임 코팅 살포 : 디스트리뷰터 1.0ton",
         "기층 포설 및 다짐(기층 T=150) : 스키로더, 콤비 3.5ton", "추후 가포장 임시 도장(임시포장)"]
LAYERS = [("표층", 50), ("택 코팅", None), ("기층", 150), ("프라임 코팅", None), ("보조기층", 300)]
EXD = [("JG-400-011 ~ JG-400-001", 700, 1.2, 150), ("SGP-100-01 NO.4 ~ NO.34", 700, 1.2, 150)]


def _img(p, name, c1, c2, r1, r2, pad=6):
    with open(os.path.join(IMG, name), "rb") as f:
        p.place_image(f.read(), c1, c2, r1, r2, pad=pad)


def plan(bk, ex):
    p = bk.page("계획서", W, ex=ex, fit_height=0, sheetname="계획서" if not ex else "예시-계획서", margins=(0.5, 0.5, 0.45, 0.45))
    p.dv_list("책임", ["현장소장", "공무", "공사팀장"])
    p.row([(N, "아스콘 포장 작업 계획서", {"kind": "title", "size": 18})], h=40)
    p.row([(1, "□ 공 사 명", {"kind": "free", "bold": True}), (4, I("공사명", ex="가나지구 배수로 정비공사"), {"border": False})], h=24)
    p.row([(1, "□ 작 업 일", {"kind": "free", "bold": True}), (1, I("시작일", ex=D(2026, 7, 4), fmt="ymd", align="center")),
           (1, I("끝일", ex=D(2026, 7, 5), fmt="ymd", align="center")),
           (2, F("작업일표시", '=IF(N({시작일})=0,"",YEAR({시작일})&". "&MONTH({시작일})&". "&DAY({시작일})&".("&' + WKD.format(d="{시작일}") + '&")"'
                             '&IF(N({끝일})=0,""," ~ "&MONTH({끝일})&". "&DAY({끝일})&".("&' + WKD.format(d="{끝일}") + '&") · "&({끝일}-{시작일}+1)&"일"))',
                 align="left", size=9.5), {"border": False})], h=24)
    p.row([(1, "□ 작업 책임자", {"kind": "free", "bold": True}), (1, I("책임자", ex="현장소장", blank="현장소장", align="center")),
           (1, I("책임자이름", ex="홍길동", align="center")), (2, "", FR)], h=24)
    p.gap(6)
    p.row([(N, "□ 아스콘포장 작업 및 장비 투입계획", {"kind": "free", "bold": True, "size": 11})], h=22)
    p.row([(1, "일  자", HD), (1, "작 업 구 간", HD), (1, "구  분", HD), (1, "장비 및 인원 투입계획", HD), (1, "비  고", HD)], h=24)
    for day in (1, 2):
        e = EXD[day - 1] if ex else (None,) * 4
        if day == 1:
            fd = '=IF(N({시작일})=0,"",MONTH({시작일})&"월 "&DAY({시작일})&"일"&CHAR(10)&"("&' + WKD.format(d="{시작일}") + '&")")'
        else:
            fd = ('=IF(OR(N({시작일})=0,N({끝일})<={시작일}),"",MONTH({시작일}+1)&"월 "&DAY({시작일}+1)&"일"&CHAR(10)&"("&'
                  + WKD.format(d="{시작일}+1") + '&")")')
        for j, t in enumerate(EQ1 + EQ2):
            cells = []
            if j == 0:
                cells = [(1, F(f"일자#{day}", fd, align="center", size=9.5), {"rs": 7}),
                         (1, I(f"구간#{day}", ex=e[0], align="center", size=9.5), {"rs": 7}),
                         (1, "아스콘포장 장비 및 인원", {"kind": "ctext", "rs": 3, "size": 9.5})]
                ref = (f'=IF(N({{물량#{day}}})=0,"","(당일 포장거리 "&{{거리#{day}}}&"m)"&CHAR(10)&"기층 "&{{물량#{day}}}&"ton"'
                       f'&CHAR(10)&"덤프 "&{{덤프#{day}}}&"대분")')
                cells_tail = [(1, F(f"비고#{day}", ref, align="center", size=9.5), {"rs": 7})]
            elif j == 3:
                cells = [(1, "포장토공 장비 및 인원", {"kind": "ctext", "rs": 4, "size": 9.5})]
                cells_tail = []
            else:
                cells_tail = []
            cells.append((1, I(f"장비#{day}-{j + 1}", ex=t, blank=t, size=9.5)))
            p.row(cells + cells_tail, h=21)
    p.gap(8)
    p.row([(N, "□ 아스콘 물량 · 운반 계산", {"kind": "free", "bold": True, "size": 11})], h=22)
    p.row([(1, "일  자", HD), (1, "포장거리(m) · 폭(m)", HD), (1, "두께(mm)", HD), (1, "아스콘 물량(ton)", HD), (1, "덤프 대수", HD)], h=22)
    for day in (1, 2):
        e = EXD[day - 1] if ex else (None,) * 4
        p.row([(1, f"{day}일째", {"kind": "ctext"}),
               (1, I(f"거리#{day}", ex=e[1], fmt='#,##0" m"', align="center")),
               (1, I(f"두께#{day}", ex=e[3], fmt='0" mm"', align="center")),
               (1, F(f"물량#{day}", f'=IF(OR(N({{거리#{day}}})=0,N({{폭#{day}}})=0,N({{두께#{day}}})=0),"",ROUND({{거리#{day}}}*{{폭#{day}}}*{{두께#{day}}}/1000*{{밀도}},1))',
                     fmt='#,##0.0" ton"', align="center", bold=True)),
               (1, F(f"덤프#{day}", f'=IF(OR({{물량#{day}}}="",N({{적재}})=0),"",ROUNDUP({{물량#{day}}}/{{적재}},0))', fmt='0"대"', align="center", bold=True))], h=22)
        p.row([(1, "", {"kind": "text"}), (1, I(f"폭#{day}", ex=e[2], fmt='0.0#" m (폭)"', align="center", size=9.5)), (3, "", {"kind": "text"})], h=20)
    p.row([(1, "기준값", L), (1, "아스콘 밀도", {"kind": "ctext", "size": 9.5}), (1, I("밀도", blank=2.35, rate=True, fmt='0.00" t/㎥"', align="center")),
           (1, "덤프 1대 적재", {"kind": "ctext", "size": 9.5}), (1, I("적재", blank=15, rate=True, fmt='0" t"', align="center"))], h=22)
    p.gap(8)
    p.row([(N, "□ 아스콘포장 작업순서", {"kind": "free", "bold": True, "size": 11})], h=22)
    for j, t in enumerate(STEPS, 1):
        p.row([(N, I(f"순서#{j}", ex=f" {j}) " + t, blank=f" {j}) " + t, size=9.5), {"border": False})], h=20)
    from openpyxl.worksheet.pagebreak import Break
    p.ws.row_breaks.append(Break(id=p.r - 1))            # 단면도 · 사진은 둘째 쪽
    p.row([(N, "□ 아스콘포장 단면도", {"kind": "free", "bold": True, "size": 11})], h=22)
    r0 = p.r
    for j, (nm, th) in enumerate(LAYERS, 1):
        p.row([(3, "", FR), (1, nm, {"kind": "ctext", "size": 9.5}), (1, I(f"층#{j}", ex=th, blank=th, fmt='"T="0', align="center", size=9.5))], h=22)
    p.row([(3, "", FR), (1, "합  계", {"kind": "sum"}), (1, F("층계", f'=IF(SUM({{층#1}}:{{층#{len(LAYERS)}}})=0,"",SUM({{층#1}}:{{층#{len(LAYERS)}}}))',
                                                          fmt='"T="0', align="center", bold=True))], h=22)
    _img(p, "danmyeon.jpg", 1, 3, r0, p.r - 1)
    p.row([(N, I("단면비고", ex="※ 표층(T=50)은 포장절삭 후 전면포장 예정.", blank="※ 표층(T=50)은 포장절삭 후 전면포장 예정.", size=9.5), {"border": False})], h=22)
    p.gap(14)
    p.row([(N, I("사진제목", ex="보조기층 걷어내기 및 다짐 전경", blank="보조기층 걷어내기 및 다짐 전경", align="center", size=15, bold=True), {"border": False})], h=34)
    r1 = p.r
    for _ in range(16):
        p.gap(20)
    if ex:
        _img(p, "photo.jpg", 1, N, r1, p.r - 1)
    else:
        p.put(r1, 1, N, "(사진을 붙이는 곳)", kind="ctext", size=9, rs=16)
    p.end_print()
    p.after_note(["노란 칸 = 기준값(아스콘 밀도 · 덤프 적재량). 하늘색 칸 = 자동(작업일 · 일자 · 물량 · 덤프 대수 · 비고 · 두께 합계).",
                  "아스콘 물량 = 포장거리 × 폭 × 두께 × 밀도(소수 첫째 자리) · 덤프 대수 = 물량 ÷ 1대 적재(올림). 단면도 그림은 원본 그대로입니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사). 사진은 원본 계획서의 참고 사진입니다."])
    return p


def order(bk, ex):
    Wo = [10] * 12
    p = bk.page("시공순서도", Wo, ex=ex, fit_height=1, landscape=True, sheetname="시공순서도" if not ex else "예시-시공순서도", margins=(0.4, 0.4, 0.45, 0.45))
    p.row([(12, "포 장 시 공 순 서 도", {"kind": "title", "size": 17})], h=32)
    r0 = p.r
    for _ in range(24):
        p.gap(19)
    _img(p, "sunseo.jpg", 1, 12, r0, p.r - 1, pad=4)
    p.end_print()
    p.after_note(["원본 계획서의 시공순서도 그림입니다(참고용)."])
    return p


def draw(bk, ex):
    plan(bk, ex)
    order(bk, ex)


def expect(pages):
    import math
    c = pages["계획서"]
    s, e_ = c["시작일"], c["끝일"]
    wd = lambda d: KO[d.weekday()]
    out = {"작업일표시": f"{s.year}. {s.month}. {s.day}.({wd(s)}) ~ {e_.month}. {e_.day}.({wd(e_)}) · {(e_ - s).days + 1}일",
           "일자#1": f"{s.month}월 {s.day}일\n({wd(s)})"}
    s2 = s + datetime.timedelta(days=1)
    out["일자#2"] = f"{s2.month}월 {s2.day}일\n({wd(s2)})" if e_ > s else ""
    for day in (1, 2):
        q = round(c[f"거리#{day}"] * c[f"폭#{day}"] * c[f"두께#{day}"] / 1000 * c["밀도"] + 1e-9, 1)
        n = math.ceil(q / c["적재"])
        out[f"물량#{day}"] = q
        out[f"덤프#{day}"] = n
        qs = f"{q:g}"
        out[f"비고#{day}"] = f"(당일 포장거리 {c[f'거리#{day}']}m)\n기층 {qs}ton\n덤프 {n}대분"
    out["층계"] = sum(v for k, v in c.items() if k.startswith("층#") and v)
    return {"계획서": out, "시공순서도": {}}
