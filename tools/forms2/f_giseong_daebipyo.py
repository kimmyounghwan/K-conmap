# -*- coding: utf-8 -*-
"""기성대비표 — 공종별 계약금액 · 전회까지 누계 · 금회 · 누계 · 기성률 · 잔여."""
import datetime

from fb import F, I

SLUG = "giseong-daebipyo"
TITLE = "기성대비표"
WHERE = "forms"
PREV = [(1, "빈 서식"), (2, "작성 예시")]
SHORT = "공종별로 계약금액 대비 기성·잔여를 한 장에 비교합니다. 누계·기성률·잔여가 수식으로 계산됩니다."

W = [5, 24, 15, 15, 15, 15, 9.5, 15, 13]
N = 16
EX_ROWS = [
    ("토공", 118_450_000, 96_200_000, 22_250_000, ""),
    ("배수공", 356_820_000, 142_700_000, 98_450_000, ""),
    ("구조물공", 142_300_000, 35_600_000, 41_280_000, ""),
    ("포장공", 88_760_000, None, None, "10월 착수 예정"),
    ("부대공", 41_230_000, None, 6_150_000, ""),
    ("제경비", 128_113_000, 38_430_000, 26_280_000, "간접비·관리비·이윤"),
    ("부가가치세", 87_568_000, 31_293_000, 19_441_000, ""),
]


def draw(bk, ex):
    p = bk.page("기성대비표" if not ex else "작성 예시", W, ex=ex, landscape=True, fit_height=1)
    p.gap(4)
    p.title("기 성 대 비 표", h=36)
    p.gap(4)
    L = {"kind": "label"}
    p.row([(2, "공 사 명", L), (7, I("공사명", ex="가나지구 배수로 정비공사"))], h=22)
    p.row([(2, "발 주 기 관", L), (3, I("발주기관", ex="가나시 건설과")),
           (2, "작 성 일 자", L), (2, I("작성일", ex=datetime.date(2026, 9, 29), fmt="ymd", align="center"))], h=22)
    p.row([(2, "계 약 금 액", L), (3, I("계약금액", ex=963_241_000, fmt="won")),
           (2, "기 성 회 차", L), (2, I("회차", ex="제3회", align="center"))], h=22)
    p.row([(2, "공        기", L), (3, I("공기", ex="2026. 3. 9. ~ 2026. 12. 31.", align="center")),
           (2, "기성 기준일", L), (2, I("기준일", ex=datetime.date(2026, 9, 25), fmt="ymd", align="center"))], h=22)
    p.gap(8)
    H = {"kind": "head"}
    p.row([(1, "번호", H), (1, "공    종", H), (1, "계약금액", H), (1, "전회까지 누계", H), (1, "금회 기성", H),
           (1, "누계 기성", H), (1, "기성률", H), (1, "잔여금액", H), (1, "비  고", H)], h=24)
    first = p.r
    for i in range(N):
        r = p.r
        e = EX_ROWS[i] if i < len(EX_ROWS) else (None, None, None, None, None)
        p.row([(1, F(f"번호#{i+1}", f'=IF(B{r}="","",COUNTA(B${first}:B{r}))', align="center")),
               (1, I(f"공종#{i+1}", ex=e[0])),
               (1, I(f"계약#{i+1}", ex=e[1], fmt="won")),
               (1, I(f"전회#{i+1}", ex=e[2], fmt="won")),
               (1, I(f"금회#{i+1}", ex=e[3], fmt="won")),
               (1, F(f"누계#{i+1}", f"=D{r}+E{r}", fmt="won")),
               (1, F(f"률#{i+1}", f'=IF(N(C{r})=0,"",F{r}/C{r})', fmt="pct", align="right")),
               (1, F(f"잔여#{i+1}", f'=IF(C{r}="","",C{r}-F{r})', fmt="won")),
               (1, I(f"비고#{i+1}", ex=e[4] or None, size=8.5))], h=20)
    last = p.r - 1
    S = {"kind": "sum"}
    r = p.r
    p.row([(2, "합        계", S),
           (1, F("합계약", f"=SUM(C{first}:C{last})", fmt="won", bold=True)),
           (1, F("합전회", f"=SUM(D{first}:D{last})", fmt="won", bold=True)),
           (1, F("합금회", f"=SUM(E{first}:E{last})", fmt="won", bold=True)),
           (1, F("합누계", f"=SUM(F{first}:F{last})", fmt="won", bold=True)),
           (1, F("합률", f'=IF(N(C{r})=0,"",F{r}/C{r})', fmt="pct", bold=True, align="right")),
           (1, F("합잔여", f'=IF(N(C{r})=0,"",C{r}-F{r})', fmt="won", bold=True)),
           (1, "", {})], h=22)
    p.row([(2, "금회 기성률", S), (1, F("금회률", f'=IF(N(C{r})=0,"",E{r}/C{r})', fmt="pct", align="right")),
           (6, F("대조", '=IF(N({계약금액})=0,"",IF({계약금액}={합계약},"※ 공종 합계가 계약금액과 같습니다.",'
                        '"⚠ 공종 합계가 계약금액과 "&TEXT(ABS({계약금액}-{합계약}),"#,##0")&"원 다릅니다 — 공종 금액을 확인하세요."))',
                 align="left", size=9), {"border": False})], h=20)
    p.date_line("서명일", ex=datetime.date(2026, 9, 29))
    p.sign_block([("현장대리인", "현장대리인", "김철수"), ("감독(감리)", "감독", "박감독")], lab_span=2, val_span=2, left=4)
    p.end_print()
    p.after_note([
        "하늘색 칸 = 자동 계산 칸(누계·기성률·잔여·합계). 공종·계약금액·전회까지 누계·금회 기성만 적으세요.",
        "다음 회차: 이 시트를 복사한 뒤 «전회까지 누계» 칸에 이번 «누계 기성» 값을 옮겨 적고 «금회 기성» 을 새로 적습니다.",
        "잔여금액이 빨간 음수로 나오면 계약금액보다 기성이 많은 것 — 설계변경을 먼저 해야 합니다.",
        "발주기관이 정한 서식이 있으면 그 서식을 쓰세요.",
    ] if not ex else ["이 시트는 작성 예시입니다(가상의 공사). 실제로는 앞 시트에 적으세요."])
    return p


def expect(inp):
    e = {}
    tc = tp = tn = tf = 0
    cnt = 0
    for i in range(1, N + 1):
        c = inp.get(f"계약#{i}") or 0
        d = inp.get(f"전회#{i}") or 0
        g = inp.get(f"금회#{i}") or 0
        name = inp.get(f"공종#{i}")
        if name:
            cnt += 1
            e[f"번호#{i}"] = cnt
        else:
            e[f"번호#{i}"] = ""
        f = d + g
        e[f"누계#{i}"] = f
        e[f"률#{i}"] = (f / c) if c else ""
        e[f"잔여#{i}"] = (c - f) if inp.get(f"계약#{i}") is not None else ""
        tc += c; tp += d; tn += g; tf += f
    e.update({"합계약": tc, "합전회": tp, "합금회": tn, "합누계": tf,
              "합률": tf / tc if tc else "", "합잔여": tc - tf if tc else "", "금회률": tn / tc if tc else ""})
    k = inp.get("계약금액") or 0
    e["대조"] = "" if not k else ("※ 공종 합계가 계약금액과 같습니다." if k == tc else
                                 f"⚠ 공종 합계가 계약금액과 {abs(k - tc):,}원 다릅니다 — 공종 금액을 확인하세요.")
    return e
