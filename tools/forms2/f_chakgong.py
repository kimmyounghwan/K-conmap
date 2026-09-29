# -*- coding: utf-8 -*-
"""착공계(착공신고서) — 계약금액 한글 표기 · 공사기간(일수) 자동 · 착공일 앞섬 경고 · 붙임 서류 목록."""
import datetime

from fb import F, I

SLUG = "chakgong"
TITLE = "착공계"
WHERE = "forms"
PREV = [(1, "빈 서식"), (2, "작성 예시")]
SHORT = "공사를 시작할 때 발주기관에 내는 첫 서류입니다. 계약금액 한글 표기·공사기간 일수가 자동으로 들어갑니다."

W = [5, 15, 12, 14, 14, 14, 14]
D = datetime.date
ATTACH = [   # 「공사계약일반조건」 제17조제1항(착공 시 제출 서류) 차례 — 2026-09-29 확인
    "현장기술자(현장대리인) 지정신고서",
    "공사공정예정표",
    "안전·환경 및 품질관리계획서",
    "공정별 인력 및 장비투입계획서",
    "착공 전 현장사진",
    "산재·고용보험 가입증명원",
    "그 밖에 발주기관이 지정한 서류",
]


def draw(bk, ex):
    p = bk.page("착공계" if not ex else "작성 예시", W, ex=ex, fit_height=1)
    L = {"kind": "label"}
    p.gap(6)
    p.title("착  공  계", h=40, sub="(착공신고서)")
    p.gap(10)
    p.row([(2, "공  사  명", L), (5, I("공사명", ex="가나지구 배수로 정비공사"))], h=26)
    p.row([(2, "계 약 번 호", L), (5, I("계약번호", ex="제2026-0312호"))], h=26)
    p.row([(2, "계 약 일 자", L), (5, I("계약일", ex=D(2026, 3, 2), fmt="date"))], h=26)
    p.row([(2, "계 약 금 액", L), (2, I("계약금액", ex=963_241_000, fmt='"₩"#,##0')),
           (3, F("금액한글", "={계약금액}", fmt='[DBNum4][$-412]"(일금 "General"원정)";;""', align="left"))], h=26)
    p.row([(2, "공 사 기 간", L),
           (5, F("공사기간", '=IF(OR({착공일}="",{준공일}=""),"",TEXT({착공일},"yyyy. m. d.")&" ~ "&TEXT({준공일},"yyyy. m. d.")'
                           '&" ("&TEXT({준공일}-{착공일}+1,"#,##0")&"일)")', align="left"))], h=26)
    p.row([(2, "착  공  일", L), (5, I("착공일", ex=D(2026, 3, 9), fmt="date"))], h=26)
    p.row([(2, "준공예정일", L), (5, I("준공일", ex=D(2026, 12, 31), fmt="date"))], h=26)
    p.row([(2, "현 장 위 치", L), (5, I("현장위치", ex="가나시 다라동 123-4 일원"))], h=26)
    p.row([(7, F("경고", '=IF(OR({착공일}="",{계약일}=""),"",IF({착공일}<{계약일},"⚠ 착공일이 계약일보다 앞섭니다 — 날짜를 확인하세요.",'
                        'IF(AND({준공일}<>"",{준공일}<{착공일}),"⚠ 준공예정일이 착공일보다 앞섭니다.","")))', align="left"),
            {"kind": "warn", "border": False})], h=16)
    p.gap(6)
    p.row([(7, F("본문", '="위 공사를 계약조건에 따라 "&IF(ISNUMBER({착공일}),TEXT({착공일},"yyyy년 m월 d일"),"     년     월     일")'
                        '&" 착공하였기에 관계 서류를 붙여 신고합니다."', align="center", ink=False),
            {"kind": "cfree", "border": False})], h=30)
    p.gap(8)
    H = {"kind": "head"}
    p.row([(1, "번호", H), (4, "붙 임 서 류", H), (1, "부수", H), (1, "비 고", H)], h=22)
    for i in range(9):
        name = ATTACH[i] if i < len(ATTACH) else None
        exq = ("1부" if name else None)
        note = {6: "해당 없음"}.get(i)
        p.row([(1, str(i + 1) if name else "", {"kind": "ctext"}), (4, I(f"붙임#{i+1}", blank=name, ex=name)),
               (1, I(f"부수#{i+1}", ex=exq if i != 6 else None, align="center")),
               (1, I(f"비고#{i+1}", ex=note, align="center", size=8.5))], h=21)
    p.gap(10)
    p.date_line("신고일", ex=D(2026, 3, 9))
    p.gap(6)
    p.sign_block([("주소", "주소", "가나시 마바로 45, 2층", ""), ("상호", "상호", "예시건설(주)", ""),
                  ("대표자", "대표자", "홍길동"), ("현장대리인", "현장대리인", "김철수")], lab_span=1, val_span=3, left=2)
    p.gap(10)
    p.row([(7, I("수신", ex="가나시장 귀하", blank="                           귀하", size=13, bold=True, align="left"), {"border": False})], h=26)
    p.end_print()
    p.after_note([
        "하늘색 칸 = 자동 계산 칸(계약금액 한글 표기·공사기간 일수·본문 날짜). 착공일을 계약일보다 앞으로 적으면 빨간 경고가 나옵니다.",
        "붙임 서류는 발주기관·계약 특수조건마다 다릅니다 — 목록을 고쳐 쓰세요.",
        "발주기관이 정한 서식이 있으면 그 서식을 쓰세요.",
    ] if not ex else ["이 시트는 작성 예시입니다(가상의 공사). 실제로는 앞 시트에 적으세요."])
    return p


def expect(inp):
    s, e, c = inp["착공일"], inp["준공일"], inp["계약일"]
    f = lambda d: f"{d.year}. {d.month}. {d.day}."
    return {
        "금액한글": inp["계약금액"],
        "공사기간": f"{f(s)} ~ {f(e)} ({(e - s).days + 1:,}일)",
        "경고": "" if s >= c and e >= s else "?",
        "본문": f"위 공사를 계약조건에 따라 {s.year}년 {s.month}월 {s.day}일 착공하였기에 관계 서류를 붙여 신고합니다.",
    }
