# -*- coding: utf-8 -*-
"""일요일·공휴일작업 안전작업계획서 — 원본 틀(붙임 1 · 현장 정보 · 위험작업 □ · 입회 관리자 명단 · 작업내용/안전대책 · 서명)을 새로 만든 것.
■ □ 칸은 목록에서 ■ 를 고르면 됩니다.
■ 수식: 작업일 요일 · 평일이면 확인 안내 · 체크한 위험작업 수(고위험 따로) · 위험작업이 있는데 입회자가 비면 안내 ·
        확인자(현장소장) 이름은 명단에서 따라옴."""
import datetime

from fb import F, I

SLUG = "o-hyuil-jageop"
TITLE = "일요일·공휴일작업 안전작업계획서"
WHERE = "orig"
PREV = [(1, "빈 서식"), (2, "작성 예시")]
PAGES = 1
NSHEETS = 1
SHORT = ("일요일·공휴일에 작업할 때 내는 안전작업계획서입니다. 위험작업을 □/■ 로 고르면 건수(고위험 따로)를 세고, "
         "입회 관리자가 비어 있거나 작업일이 평일이면 알려 줍니다.")
NOTE = "□ 칸은 목록에서 ■ 를 고르세요. 확인자(현장소장) 이름은 입회 관리자 명단에서 저절로 들어갑니다."

D = datetime.date
W = [9, 8, 12, 12, 10, 11, 7, 13]
N = 8
L = {"kind": "label"}
HD = {"kind": "head"}
RISK = [("타워크레인 설치・조립・해체작업", True), ("건설용리프트 설치・조립・해체작업", True),
        ("굴착기・고소작업대・이동식크레인 사용작업", True), ("굴착작업(깊이 2미터 이상)", False), ("건물 등 해체작업", False)]
RISK_EX = {3, 4}
ROLES = ["현장소장", "안전관리자", "협력사 현장소장", "관리감독자"]
ROLE_EX = {"현장소장": ("홍길동", "010-0000-0001"), "안전관리자": ("김철수", "010-0000-0002"),
           "협력사 현장소장": ("이영희", "010-0000-0003"), "관리감독자": ("박민수", "010-0000-0004")}
WKD = 'CHOOSE(WEEKDAY({d}),"일","월","화","수","목","금","토")'
KO = "월화수목금토일"
TXT_JOB = "○ STA.0+260 ~ 0+340 배수로 터파기(깊이 2.5m)\n○ PC 암거 거치 6개\n○ 되메우기 L=40m"
TXT_SAFE = ("○ 굴착면 기울기 1:0.5 유지 · 작업 전 흙막이 상태 확인\n○ 굴착기 작업반경 출입 금지 · 신호수 1명 배치\n"
            "○ 암거 매달기 전 줄걸이 용구 점검\n○ 작업 전 TBM · 음주 여부 확인")


def draw(bk, ex):
    p = bk.page("계획서", W, ex=ex, fit_height=1, sheetname="계획서" if not ex else "예시-계획서", margins=(0.5, 0.5, 0.45, 0.45))
    p.dv_list("체크", ["□", "■"])
    p.row([(N, "붙임 1", {"kind": "free", "size": 9})], h=16)
    p.title("일요일·공휴일작업 안전작업계획서", h=38)
    p.gap(4)
    p.row([(2, "현 장 명", L), (3, I("현장명", ex="가나지구 배수로 정비공사")), (1, "시 공 사", L), (2, I("시공사", ex="예시건설(주)"))], h=26)
    p.row([(2, "소 재 지", L), (6, I("소재지", ex="가나시 가나동 일원"))], h=26)
    p.row([(2, "전화번호", L), (3, I("전화", ex="02-0000-0000")), (1, "팩스번호", L), (2, I("팩스", ex="02-0000-0001"))], h=26)
    p.row([(2, "공사기간", L), (1, I("착공일", ex=D(2026, 3, 9), fmt="ymd", align="center", size=9.5)),
           (1, "~", {"kind": "ctext"}), (1, I("준공일", ex=D(2027, 6, 30), fmt="ymd", align="center", size=9.5)),
           (1, "공사금액", L), (1, I("공사금액", ex=1843, fmt="int")), (1, "백만원", {"kind": "ctext", "size": 9.5})], h=26)
    r0 = p.r
    for j, (t, hi) in enumerate(RISK, 1):
        cells = [] if j > 1 else [(2, "위험작업", dict(L, rs=len(RISK)))]
        cells += [(1, I(f"위험#{j}", ex="■" if j in RISK_EX else "□", blank="□", dv="체크", align="center", size=11)),
                  (4, t, {"kind": "text", "size": 9.5}),
                  (1, "고위험작업" if hi else "", {"kind": "ctext", "size": 8.5, "bold": True, "ink": "B91C1C" if hi else None})]
        p.row(cells, h=22)
    p.k["위험[]"] = f"{p.k['위험#1']}:{p.k[f'위험#{len(RISK)}']}"
    hi_refs = [f"{{위험#{j}}}" for j, (t, hi) in enumerate(RISK, 1) if hi]
    nh = "(" + "+".join(f'({x}="■")' for x in hi_refs) + ")"
    p.row([(N, F("위험안내", '=IF(COUNTIF({위험[]},"■")=0,"","※ 체크한 위험작업 "&COUNTIF({위험[]},"■")&"건"&IF(' + nh + '>0," (고위험작업 "&' + nh
                 + '&"건)","")&" — 작업내용·안전대책에 작업마다 대책을 적으세요.")', align="left"), {"kind": "warn"})], h=16)
    p.row([(2, "기타작업", L), (6, I("기타작업", ex="배수관 부설 준비(자재 정리)"))], h=26)
    p.row([(2, "작업업체명(공정)", dict(L, size=9.5)), (2, I("작업업체", ex="예시토건(주) (토공)", size=9.5)), (1, "작업일시", L),
           (1, I("작업일", ex=D(2026, 5, 17), fmt="ymd", align="center", size=9.5)),
           (1, F("작업요일", '=IF(N({작업일})=0,"","("&' + WKD.format(d="{작업일}") + '&")")', align="center")),
           (1, I("작업시간", ex="08:00 ~ 17:00", align="center", size=9.5))], h=28)
    p.row([(N, F("작업일안내", '=IF(N({작업일})=0,"",IF(WEEKDAY({작업일},2)<=5,"※ 작업일 "&MONTH({작업일})&"/"&DAY({작업일})&"("&'
                            + WKD.format(d="{작업일}") + '&")은 평일입니다 — 공휴일 작업이 맞는지 확인하세요.",""))', align="left"),
           {"kind": "warn"})], h=16)
    p.row([(2, "주말작업 입회\n관리자 명단", dict(L, rs=len(ROLES) + 1, size=9.5)), (2, "구    분", HD), (2, "성    명", HD), (2, "연 락 처", HD)], h=20)
    for role in ROLES:
        e = ROLE_EX[role] if ex else (None, None)
        p.row([(2, role, {"kind": "ctext", "size": 9.5}), (2, I(f"성명:{role}", ex=e[0], align="center")),
               (2, I(f"연락처:{role}", ex=e[1], align="center", size=9.5))], h=22)
    p.row([(N, F("입회안내", '=IF(COUNTIF({위험[]},"■")=0,"",IF(OR({성명:현장소장}="",{성명:안전관리자}="",{성명:관리감독자}=""),'
                          '"⚠ 위험작업이 있는 날입니다 — 현장소장·안전관리자·관리감독자 입회자를 적으세요.",""))', align="left"),
           {"kind": "warn"})], h=16)
    p.row([(2, "투입장비", L), (6, I("투입장비", ex="굴착기 0.6㎥ 2대 · 덤프트럭 15t 3대 · 카고크레인 5t 1대", size=9.5))], h=28)
    p.row([(2, "사고시\n비상대응체계", dict(L, size=9.5)),
           (6, I("비상대응", ex="사고 발생 → 현장소장(홍길동) 보고 → 119 신고 · 가나병원 응급실(차량 10분) → 본사 안전팀 보고", size=9.5))], h=40)
    p.row([(4, "작 업 내 용", HD), (4, "안 전 대 책", HD)], h=20)
    p.row([(4, I("작업내용", ex=TXT_JOB, blank="(※ 필요시 별지로 작성)", align="left", size=9.5), {"valign": "top"}),
           (4, I("안전대책", ex=TXT_SAFE, blank="(※ 필요시 별지로 작성)", align="left", size=9.5), {"valign": "top"})], h=130)
    p.gap(8)
    p.row([(N, I("작성일", ex=D(2026, 5, 15), fmt="date", blank="20     년      월      일", align="center"), {"border": False})], h=24)
    p.row([(3, "", {"kind": "free"}), (2, "작 성 자 :", {"kind": "free", "bold": True, "align": "right"}),
           (2, I("작성자", ex="김철수", align="center"), {"border": False}), (1, "(서명)", {"kind": "cfree", "size": 9})], h=24)
    p.row([(3, "", {"kind": "free"}), (2, "확인자 : 현장소장", {"kind": "free", "bold": True, "align": "right"}),
           (2, F("확인자", '=IF({성명:현장소장}="","",{성명:현장소장})', align="center"), {"border": False}),
           (1, "(서명)", {"kind": "cfree", "size": 9})], h=24)
    p.end_print()
    p.after_note(["□ 칸은 목록에서 ■ 를 고르세요. 하늘색 칸 = 자동(작업 요일 · 확인자 이름). 빨간 글자는 안내입니다(인쇄해도 나옵니다 — 비우려면 칸을 채우세요)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


def expect(inp):
    chk = [inp.get(f"위험#{j}") == "■" for j in range(1, len(RISK) + 1)]
    n = sum(chk)
    nh = sum(1 for j, (t, hi) in enumerate(RISK) if hi and chk[j])
    d = inp["작업일"]
    wd = KO[d.weekday()]
    e = {"작업요일": f"({wd})",
         "위험안내": "" if n == 0 else f"※ 체크한 위험작업 {n}건" + (f" (고위험작업 {nh}건)" if nh else "") + " — 작업내용·안전대책에 작업마다 대책을 적으세요.",
         "작업일안내": f"※ 작업일 {d.month}/{d.day}({wd})은 평일입니다 — 공휴일 작업이 맞는지 확인하세요." if d.weekday() <= 4 else "",
         "입회안내": "" if n == 0 or all(inp.get(f"성명:{r}") for r in ("현장소장", "안전관리자", "관리감독자"))
         else "⚠ 위험작업이 있는 날입니다 — 현장소장·안전관리자·관리감독자 입회자를 적으세요.",
         "확인자": inp.get("성명:현장소장") or ""}
    return e
