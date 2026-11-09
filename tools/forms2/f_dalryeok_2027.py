# -*- coding: utf-8 -*-
"""2027 달력 — 새로 만든 서식 (2026-11-09 G620 · 소장님 「이거 시작하자」(18:14) · 「쓸만한 서식만」 · 「꼭 검색 되게」 ·
   「달력에 클로드가 아이디어 좀 더해서」 · 「달력 어플도 참고하고, 웹에 있는 달력도 참고해서 가장 유용하게」(19:0x))
   ① 연간 — 12달 한 장 · 공휴일 · 대체공휴일 빨강 · 토요일 파랑 · 3일 이상 연휴 칸 색 · 달마다 근무일
   ② 근무일 — 공사 기간(착공 ~ 준공) 근무일(주 5일 · 주 6일) 저절로 · 현장 쉬는 날 6칸 더 빼기 · 달마다 근무일 · 공휴일 표(셈에 씀)
   ③ 연휴 · 기한 — 3일 이상 연휴 10번 · 연차 꿀팁(연차 1 ~ 4일로 길게) · 기한 셈(민법 기간 셈 — 끝날이 토 · 공휴일이면 다음 평일) · 날짜 더하기 · 두 날 사이
   ④ 1월 ~ 12월 — 주차(1 ~ 53주) · 날마다 음력 · 손없는 날 · 24절기 · 잡절 · 안전점검의 날 · 일정 칸(사이트에서 적고 저장 · 이어쓰기 · PDF)
   참고한 것(19:1x): 앱 한음달(음력 · 절기 · 손없는 날) · 빨간달력(모든 날 음력 · 연간 빨간 날) · 웹 month2k(날마다 음력 · 손없는 날 · 절기 · 복날) ·
   devcomma 달력(연휴 칸 색 · 달 요약 · 날짜 셈 · D-day) — 우리만: 근무일 셈 · 현장 쉬는 날 · 기한 셈 · 연차 꿀팁 · 주차 · 일정 저장 · 그림 PDF.

근거(세 번 — 메모 /tmp/g10/g620/근거_2027달력.md):
  · 공휴일 — 「관공서의 공휴일에 관한 규정」 [시행 2026. 5. 11.] [대통령령 제36290호, 2026. 4. 30., 일부개정] 제2조 · 제3조(대체공휴일 — 현충일 · 1월 1일 빼고) /
    한국천문연구원 2027 달력자료(V1.0a) / 우주항공청 2027 월력요항 → 주 5일 휴일 119일 · 3일 이상 연휴 10번 — 아래 _점검() 이 날짜로 다시 셈(틀리면 안 만들어짐).
  · 24절기 · 음력(정미년 · 윤달 없음) · 잡절 — 한국천문연구원 · DateDB · month2k(세 곳 같음). 손없는 날 = 음력 9 · 10 · 19 · 20 · 29 · 30일(앱 · 웹 같음 · 음력에서 셈).
  · 기한 셈 — 민법 [시행 2026. 3. 17.] 제157조(초일 불산입 · 0시부터면 산입) · 제159조(말일 종료) · 제160조(주 · 월 · 연은 역 — 해당일 전일 · 없으면 그 달 말일) ·
    제161조(말일이 토요일 · 공휴일이면 익일) — 법제처 조문 · 전문 · korea.legal 세 번. 익일도 쉬는 날이면 그다음 평일(해설 · 같은 조를 다시 씀).
  · 안전점검의 날(매월 4일) · 방재의 날(5. 25.) — 재난안전법 시행령 제73조의6 ① · 국민안전의 날(4. 16.) — 재난안전법 제66조의7 ① (법제처 전문).
■ 짐작 안 함: 위 근거와 같은 것만. 임시공휴일(정부 수시 지정)은 아직 없음 → «현장 쉬는 날 더» 칸에 이용자가 적음. 2028년 공휴일은 셈에 없음(넘어가면 알림).
"""
import calendar
import datetime

from openpyxl.styles import Border, PatternFill

import sgw as g
from fb import F, I, LINE

SLUG = "dalryeok-2027"
TITLE = "2027 달력"
WHERE = "forms"
MULTI = True
Y = 2027
D = datetime.date
DAY = datetime.timedelta(days=1)
# 쪽: 빈 1 연간 · 2 근무일 · 3 연휴 · 기한 · 4 ~ 15 = 1월 ~ 12월 / 예시 16 ~ 30 (같은 차례)
PREV = [(1, "2027 연간 달력 — 공휴일 · 대체공휴일 빨강 · 토요일 파랑 · 3일 이상 연휴 칸 색 · 달마다 근무일"),
        (5, "2월 — 설 연휴 · 대체공휴일 · 주차 · 날마다 음력 · 손없는 날 · 절기 · 일정 칸 — 빈 서식"),
        (17, "근무일 셈 — 작성 예시 (가상의 공사 기간 3/2 ~ 8/31 · 여름휴가 사흘)"),
        (18, "연휴 · 연차 꿀팁 · 기한 셈 — 작성 예시 (끝날이 설 연휴면 2/10 로)"),
        (27, "9월 — 작성 예시 (추석 연휴 · 가상의 현장 일정)")]
SHORT = ("2027 달력(연간 + 1월 ~ 12월) — 노동절 · 제헌절 공휴일과 대체공휴일 7번(2026 개정)까지 넣은 공휴일 빨강 · 토요일 파랑 · 날마다 음력 · "
         "손없는 날 · 24절기 · 주차. 공사 기간(착공 ~ 준공)을 적으면 근무일(주 5일 · 주 6일)이 저절로 나오고, 연차 꿀팁 · 3일 이상 연휴 10번 · "
         "기한 셈(끝날이 토요일 · 공휴일이면 다음 평일)까지. 날마다 칸에 일정을 적어 저장 · PDF 로.")
NOTE_REPLACE = None

RED, BLUE, INK, GREY = "DC2626", "2563EB", "111827", "6B7280"
WK = "일월화수목금토"
H = {"kind": "head"}
SHADE = PatternFill("solid", fgColor="FDE2E2")      # 3일 이상 연휴 칸
OUTM = PatternFill("solid", fgColor="F3F4F6")       # 달 밖 칸
SRC = ("※ 공휴일 — 「관공서의 공휴일에 관한 규정」(2026. 4. 30. 개정 · 노동절 · 제헌절 공휴일) · 우주항공청 2027년 월력요항 / "
       "24절기 · 음력 — 한국천문연구원 달력자료")

# ── 공휴일(관공서의 공휴일에 관한 규정 · 2027 월력요항) ──────────────
HOL = {D(Y, 1, 1): "신정", D(Y, 2, 6): "설날 연휴", D(Y, 2, 7): "설날", D(Y, 2, 8): "설날 연휴", D(Y, 2, 9): "대체공휴일",
       D(Y, 3, 1): "3·1절", D(Y, 5, 1): "노동절", D(Y, 5, 3): "대체공휴일", D(Y, 5, 5): "어린이날", D(Y, 5, 13): "부처님 오신 날",
       D(Y, 6, 6): "현충일", D(Y, 7, 17): "제헌절", D(Y, 7, 19): "대체공휴일", D(Y, 8, 15): "광복절", D(Y, 8, 16): "대체공휴일",
       D(Y, 9, 14): "추석 연휴", D(Y, 9, 15): "추석", D(Y, 9, 16): "추석 연휴", D(Y, 10, 3): "개천절", D(Y, 10, 4): "대체공휴일",
       D(Y, 10, 9): "한글날", D(Y, 10, 11): "대체공휴일", D(Y, 12, 25): "기독탄신일(성탄절)", D(Y, 12, 27): "대체공휴일"}
# 24절기(KASI · DateDB · month2k)
SOL = {D(Y, 1, 5): "소한", D(Y, 1, 20): "대한", D(Y, 2, 4): "입춘", D(Y, 2, 19): "우수", D(Y, 3, 6): "경칩", D(Y, 3, 21): "춘분",
       D(Y, 4, 5): "청명", D(Y, 4, 20): "곡우", D(Y, 5, 6): "입하", D(Y, 5, 21): "소만", D(Y, 6, 6): "망종", D(Y, 6, 21): "하지",
       D(Y, 7, 7): "소서", D(Y, 7, 23): "대서", D(Y, 8, 8): "입추", D(Y, 8, 23): "처서", D(Y, 9, 8): "백로", D(Y, 9, 23): "추분",
       D(Y, 10, 8): "한로", D(Y, 10, 24): "상강", D(Y, 11, 8): "입동", D(Y, 11, 22): "소설", D(Y, 12, 7): "대설", D(Y, 12, 22): "동지"}
# 잡절(KASI)
JAP = {D(Y, 2, 21): "정월대보름", D(Y, 4, 6): "한식", D(Y, 6, 9): "단오", D(Y, 8, 8): "칠석",
       D(Y, 7, 20): "초복", D(Y, 7, 30): "중복", D(Y, 8, 9): "말복"}
# 안전의 날(재난안전법 제66조의7 · 시행령 제73조의6) — 매월 4일 안전점검의 날 · 4. 16. 국민안전의 날 · 5. 25. 방재의 날
KIN = {D(Y, m, 4): "안전점검의 날" for m in range(1, 13)}
KIN.update({D(Y, 4, 16): "국민안전의 날", D(Y, 5, 25): "방재의 날"})
# 음력 달 첫날(양력) — 2026 병오년 12월 1일 = 1/8(대) · 2027 정미년(윤달 없음) 1월 ~ 12월
LUN = [(12, D(Y, 1, 8)), (1, D(Y, 2, 7)), (2, D(Y, 3, 8)), (3, D(Y, 4, 7)), (4, D(Y, 5, 6)), (5, D(Y, 6, 5)), (6, D(Y, 7, 4)),
       (7, D(Y, 8, 2)), (8, D(Y, 9, 1)), (9, D(Y, 9, 30)), (10, D(Y, 10, 29)), (11, D(Y, 11, 28)), (12, D(Y, 12, 28))]
LUN0 = (11, D(Y - 1, 12, 9))          # 병오년 11월 1일(대 · 30일) — 1/1 ~ 1/7 이 이 달
SON = (9, 10, 19, 20, 29, 30)         # 손없는 날(음력 날)
# 월력요항(확인 3)과 같은지 _점검() 이 날짜로 다시 셈
LONG_SRC = ["1/1~1/3", "2/6~2/9", "2/27~3/1", "5/1~5/3", "7/17~7/19", "8/14~8/16", "9/14~9/16", "10/2~10/4", "10/9~10/11", "12/25~12/27"]


def wk(d):
    return WK[(d.weekday() + 1) % 7]


def 쉼(d):
    return d.weekday() == 6 or d in HOL


def 쉼5(d):
    return d.weekday() >= 5 or d in HOL


def 해날():
    return [D(Y, 1, 1) + i * DAY for i in range(365 + calendar.isleap(Y))]


def 음(d):
    """양력 → (음력 달, 날)"""
    m, s = LUN0
    for lm, ls in LUN:
        if ls <= d:
            m, s = lm, ls
    return m, (d - s).days + 1


def 연휴들():
    """주 5일 · 3일 이상 이어 쉬는 날 — [(첫날, 끝날)]"""
    out, run = [], []
    for d in 해날() + [D(Y + 1, 1, 1)]:
        if d.year == Y and 쉼5(d):
            run.append(d)
            continue
        if len(run) >= 3:
            out.append((run[0], run[-1]))
        run = []
    return out


def 연차꿀팁(maxk=4):
    """쉬는 덩이(토 · 일 · 공휴일) 사이 평일에 연차를 내면 이어지는 쉼 — 공휴일이 든 것만 · 더 나은 것에 가려지는 것은 뺌.
    돌려줌: [(연차 낼 날들, 첫날, 끝날)] — 끝날은 2028. 1. 2.(일)까지 볼 수 있음(그 앞 토 · 일)."""
    days = 해날() + [D(Y + 1, 1, 1), D(Y + 1, 1, 2)]      # 2028. 1. 1.(토) · 2.(일)
    off = lambda d: d.weekday() >= 5 or d in HOL          # noqa: E731
    runs, cur = [], []
    for d in days:
        if off(d):
            cur.append(d)
        elif cur:
            runs.append((cur[0], cur[-1]))
            cur = []
    if cur:
        runs.append((cur[0], cur[-1]))
    opts = []
    for i in range(len(runs)):
        for j in range(i + 1, len(runs)):
            a, b = runs[i][0], runs[j][1]
            span = [a + k * DAY for k in range((b - a).days + 1)]
            gaps = [d for d in span if not off(d)]
            if len(gaps) > maxk:
                break
            if any(d in HOL for d in span):
                opts.append((gaps, a, b))

    def over(x, y):
        return not (x[2] < y[1] or y[2] < x[1])

    keep = []
    for o in opts:
        k, n = len(o[0]), (o[2] - o[1]).days + 1
        bad = False
        for q in opts:
            if q is o or not over(o, q):
                continue
            k2, n2 = len(q[0]), (q[2] - q[1]).days + 1
            if k2 <= k and n2 >= n and (k2 < k or n2 > n or q[1] > o[1]):     # 같은 값이면 늦게 시작하는 것 하나만
                bad = True
                break
        if not bad:
            keep.append(o)
    return sorted(keep, key=lambda o: (o[1], len(o[0])))


def _점검():
    days = 해날()
    off = sum(1 for d in days if 쉼5(d))
    sun = sum(1 for d in days if d.weekday() == 6)
    sat = sum(1 for d in days if d.weekday() == 5)
    ph = sum(1 for d in HOL if d.weekday() < 5)
    assert (off, sun, sat, ph) == (119, 52, 52, 15), (off, sun, sat, ph)
    assert sum(1 for n in HOL.values() if n == "대체공휴일") == 7
    assert [f"{a.month}/{a.day}~{b.month}/{b.day}" for a, b in 연휴들()] == LONG_SRC, 연휴들()
    for (m, a), (_m2, b) in zip([LUN0] + LUN, LUN):
        assert (b - a).days in (29, 30), (m, a, b)
    assert len(SOL) == 24 and len(HOL) == 24
    assert 음(D(Y, 2, 7)) == (1, 1) and 음(D(Y, 9, 15)) == (8, 15) and 음(D(Y, 2, 21)) == (1, 15)      # 설날 · 추석 · 대보름
    assert 음(D(Y, 6, 9)) == (5, 5) and 음(D(Y, 8, 8)) == (7, 7) and 음(D(Y, 1, 7)) == (11, 30)       # 단오 · 칠석 · 병오년 11월 끝


_점검()


def 달셈(m):
    n = calendar.monthrange(Y, m)[1]
    days = [D(Y, m, i) for i in range(1, n + 1)]
    work = sum(1 for d in days if not 쉼5(d))
    satw = sum(1 for d in days if d.weekday() == 5 and d not in HOL)
    son = [d.day for d in days if 음(d)[1] in SON]
    return {"날": n, "근무": work, "근무6": work + satw, "쉼": n - work, "손": son}


def 윗글(d):
    """날 칸 첫 줄 — 공휴일(빨강) · 절기 · 잡절 · 안전의 날(회색)"""
    t = [x for x in (HOL.get(d), SOL.get(d), JAP.get(d), None if d in HOL else KIN.get(d)) if x]     # 공휴일엔 안전점검의 날을 안 적음(칸 넘침 · 쉬는 날)
    return " · ".join(t), (RED if d in HOL else GREY)


def 아랫글(d):
    """날 칸 둘째 줄 — 음력 · 손없는 날"""
    lm, ld = 음(d)
    return f"음 {lm}.{ld}" + (" · 손없는 날" if ld in SON else "")


def 날색(d):
    return RED if 쉼(d) else (BLUE if d.weekday() == 5 else INK)


def 주들(m):
    """일요일 시작 주 — [[날짜 또는 None] × 7] …"""
    lead = (D(Y, m, 1).weekday() + 1) % 7          # 일요일 0
    n = calendar.monthrange(Y, m)[1]
    cells = [None] * lead + [D(Y, m, i) for i in range(1, n + 1)]
    while len(cells) % 7:
        cells.append(None)
    return [cells[i:i + 7] for i in range(0, len(cells), 7)]


def 주차(d):
    """엑셀 WEEKNUM(날짜, 1) — 일요일 시작 · 1월 1일이 든 주가 1주"""
    j1 = D(d.year, 1, 1)
    return ((d - j1).days + (j1.weekday() + 1) % 7) // 7 + 1


def _md(d):
    return f"{d.month}/{d.day}({wk(d)})" if d.year == Y else f"{d.year}. {d.month}. {d.day}.({wk(d)})"


def 공휴글():
    """«2/6(토) ~ 2/8(월) 설날 연휴» 처럼 설 · 추석은 한 덩이로"""
    hs, items, i = sorted(HOL), [], 0
    while i < len(hs):
        d = hs[i]
        if HOL[d] in ("설날 연휴", "추석 연휴") and i + 2 < len(hs) and HOL[hs[i + 2]] == HOL[d]:
            items.append(f"{_md(d)} ~ {_md(hs[i + 2])} {HOL[d]}")
            i += 3
            continue
        items.append(f"{_md(d)} {HOL[d]}")
        i += 1
    return items


def _까닭(a, b):
    names = []
    for x in sorted(HOL):
        if a <= x <= b:
            n = "설" if HOL[x].startswith("설") else ("추석" if HOL[x].startswith("추석") else HOL[x].replace("(성탄절)", ""))
            if n not in names and n != "대체공휴일":
                names.append(n)
    if any(HOL.get(x) == "대체공휴일" for x in HOL if a <= x <= b):
        names.append("대체공휴일")
    return " · ".join(names) if names else "주말"


def _sec(p, t, size=11):
    p.gap(3)
    p.row([(p.pc, t, {"kind": "h2", "size": size})], h=20)


def _rng(p, k, n):
    p.k[f"{k}[]"] = f"{p.k[f'{k}#1']}:{p.k[f'{k}#{n}']}"


def _요식(x):
    return f'IF({x}="","",CHOOSE(WEEKDAY({x}),"일","월","화","수","목","금","토"))'


def _쉬나(x):
    """그날이 토 · 일 · 2027 공휴일인가(근무일 시트 공휴일 표)"""
    return f'OR(WEEKDAY({x})=1,WEEKDAY({x})=7,COUNTIF({{근무일!공휴날L[]}},{x})+COUNTIF({{근무일!공휴날R[]}},{x})>0)'


def _box(ws, r1, r2, c1, c2, fill=None):
    """칸 묶음의 바깥 줄만(안 줄 없앰)"""
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            cell = ws.cell(row=r, column=c)
            cell.border = Border(left=LINE if c == c1 else None, right=LINE if c == c2 else None,
                                 top=LINE if r == r1 else None, bottom=LINE if r == r2 else None)
            if fill is not None:
                cell.fill = fill


# ── ① 연간 ────────────────────────────────────────────────────────────
WA = ([4.2] * 7 + [2.0]) * 3 + [4.2] * 7          # 31 열(달 넷 × 7 + 사이 셋)
NA = len(WA)


def yeongan(bk, ex):
    p = g.pg(bk, ex, "연간", fit=1, land=True, widths=WA)
    longd = {a + k * DAY for a, b in 연휴들() for k in range((b - a).days + 1)}
    p.row([(NA, f"{Y} 달력", {"kind": "title", "size": 20})], h=30)
    p.row([(NA, "정미년(양띠) · 공휴일 · 대체공휴일 빨강 · 토요일 파랑 · 분홍 칸 = 3일 이상 연휴 · 달 아래 = 그 달 근무일(주 5일 · 주 6일)",
            {"kind": "sub", "size": 8.5})], h=14)
    for band in range(3):
        ms = [band * 4 + k + 1 for k in range(4)]
        weeks = {m: 주들(m) for m in ms}

        def strip(fn, ms=ms):
            cells = []
            for k, m in enumerate(ms):
                cells += fn(m)
                if k < 3:
                    cells.append((1, "", {"kind": "free"}))
            return cells

        p.row(strip(lambda m: [(7, f"{m}월", {"kind": "ctext", "size": 11, "bold": True, "border": False})]), h=18)
        p.row(strip(lambda m: [(1, w, {"kind": "head", "size": 8, "border": False, "ink": RED if i == 0 else (BLUE if i == 6 else INK)})
                               for i, w in enumerate(WK)]), h=14)
        for r in range(6):
            def days(m, r=r, weeks=weeks):
                row = weeks[m][r] if r < len(weeks[m]) else [None] * 7
                return [(1, "", {"kind": "cfree", "size": 8.5}) if d is None else
                        (1, d.day, {"kind": "cfree", "size": 8.5, "ink": 날색(d), "bold": 쉼(d), **({"fill": SHADE} if d in longd else {})})
                        for d in row]
            p.row(strip(days), h=14)
        p.row(strip(lambda m: [(7, f"근무일 {달셈(m)['근무']}일 · 주 6일 {달셈(m)['근무6']}일", {"kind": "note", "size": 7, "align": "center"})]), h=13)
        p.gap(3)
    _sec(p, f"공휴일 · 대체공휴일 {len(HOL)}일 (빨강) — 주 5일이면 쉬는 날 119일(일요일 52 · 토요일 52 · 평일 공휴일 15) · 3일 이상 연휴 10번", size=9.5)
    items = 공휴글()
    for part in (items[:7], items[7:14], items[14:]):
        p.row([(NA, "  ·  ".join(part), {"kind": "free", "size": 8, "ink": RED})], h=13)
    p.row([(NA, SRC, {"kind": "note", "size": 7})], h=12)
    g.d.done(p)
    p.after_note(["공사 기간 근무일은 «근무일», 연휴 · 연차 · 기한은 «연휴기한», 날마다 일정은 1월 ~ 12월 시트에 적습니다."] if not ex else
                 ["이 시트는 작성 예시입니다(연간 달력은 빈 서식과 같음)."])
    return p


# ── ② 근무일 ───────────────────────────────────────────────────────────
WG = [5.6] * 15
NG = len(WG)
EX_RANGE = (D(Y, 3, 2), D(Y, 8, 31))
EX_MORE = [D(Y, 7, 29), D(Y, 7, 30), D(Y, 7, 31)]       # 가상의 여름휴가 — 목 · 금 · 토
NM = 6
L9 = {"kind": "label", "size": 9}
L8 = {"kind": "label", "size": 8}
L75 = {"kind": "label", "size": 7.5}
NUM = '#,##0'


def 더쉼판식(j):
    d = f"{{더쉼#{j}}}"
    hol = f"COUNTIF({{공휴날L[]}},{d})+COUNTIF({{공휴날R[]}},{d})>0"
    tail = f'IF(WEEKDAY({d})=1,"일요일 · 안 뺌",IF(WEEKDAY({d})=7,"✓ 토요일 · 주 6일만 뺌","✓ 평일 · 뺌"))'
    if j > 1:
        tail = f'IF(OR({",".join(f"{{더쉼#{i}}}={d}" for i in range(1, j))}),"앞 칸과 같은 날",{tail})'
    return (f'=IF(N({d})=0,IF({d}="","","⚠ 날짜로"),IF({{날수}}="","기간을 먼저",IF(OR({d}<{{셈시작}},{d}>{{셈끝}}),"기간 밖",'
            f'IF({hol},"이미 공휴일",{tail}))))')


def _cnt(kind):
    """공휴일 표(왼쪽 · 오른쪽)에서 셈 기간 안 평일 · 토요일 공휴일 수"""
    def one(s):
        base = f'{{공휴날{s}[]}},">="&{{셈시작}},{{공휴날{s}[]}},"<="&{{셈끝}}'
        return f'COUNTIFS({base},{{공휴요{s}[]}},"<>토",{{공휴요{s}[]}},"<>일")' if kind == "평일" else f'COUNTIFS({base},{{공휴요{s}[]}},"토")'
    return one("L") + "+" + one("R")


def geunmu(bk, ex):
    p = g.pg(bk, ex, "근무일", fit=1, widths=WG)
    p.row([(NG, f"{Y} 근무일 · 공휴일", {"kind": "title", "size": 18})], h=34)
    p.row([(NG, "착공 ~ 준공 근무일이 저절로 — 주 5일 · 주 6일 · 노동절 · 제헌절 · 대체공휴일까지",
            {"kind": "sub", "size": 9})], h=16)
    _sec(p, "㉮  기간 근무일 셈 — 시작일 · 끝날을 적으세요 (2027년 안만 셉니다)")
    a, b = EX_RANGE
    p.row([(3, "시작일(착공)", L9), (4, I("착공일", ex=a if ex else None, fmt="ymd", align="center")), (1, "~", {"kind": "ctext"}),
           (3, "끝날(준공)", L9), (4, I("준공일", ex=b if ex else None, fmt="ymd", align="center"))], h=24)
    p.row([(3, "2027년 안 시작", L8),
           (4, F("셈시작", f'=IF({{날수}}="","",MAX({{착공일}},DATE({Y},1,1)))', fmt="ymd", align="center")),
           (1, "~", {"kind": "ctext"}), (3, "2027년 안 끝", L8),
           (4, F("셈끝", f'=IF({{날수}}="","",MIN({{준공일}},DATE({Y},12,31)))', fmt="ymd", align="center"))], h=22)
    p.row([(NG, "현장 쉬는 날 더 — 임시공휴일 · 여름휴가 · 창립일 … 날짜를 적으면 근무일에서 뺍니다", {"kind": "label", "size": 8.5, "align": "left"})], h=18)
    for rr in range(2):
        cells = []
        for k in range(3):
            j = rr * 3 + k + 1
            exv = EX_MORE[j - 1] if ex and j <= len(EX_MORE) else None
            cells += [(2, I(f"더쉼#{j}", ex=exv, fmt="ymd", align="center", size=9)),
                      (3, F(f"더쉼판#{j}", 더쉼판식(j), align="center", size=7.5))]
        p.row(cells, h=22)
    _rng(p, "더쉼판", NM)
    lo, hi = f"MIN({{준공일}},DATE({Y},12,31))", f"MAX({{착공일}},DATE({Y},1,1))"
    p.row([(2, "날 수", L8), (1, F("날수", f'=IF(OR(N({{착공일}})=0,N({{준공일}})=0),"",IF({lo}<{hi},"",{lo}-{hi}+1))', fmt=NUM, align="center")),
           (2, "쉬는 날 · 주 5일", L75), (1, F("쉬는5", '=IF({날수}="","",{날수}-{근무5})', fmt=NUM, align="center")),
           (3, "근무일 · 주 5일", {"kind": "label", "size": 9.5}),
           (2, F("근무5", '=IF({날수}="","",{날수}-{일요}-{토요}-{평휴수}-COUNTIF({더쉼판[]},"✓ 평일*"))', fmt=NUM, align="center", size=11, bold=True)),
           (2, "근무일 · 주 6일", L8),
           (2, F("근무6", '=IF({날수}="","",{근무5}+{토요}-{토휴수}-COUNTIF({더쉼판[]},"✓ 토요일*"))', fmt=NUM, align="center", size=11, bold=True))], h=26)
    p.row([(2, "일요일", L8), (1, F("일요", '=IF({날수}="","",INT((WEEKDAY({셈시작}-1)+{셈끝}-{셈시작})/7))', fmt=NUM, align="center")),
           (2, "토요일", L8), (1, F("토요", '=IF({날수}="","",INT((WEEKDAY({셈시작}-7)+{셈끝}-{셈시작})/7))', fmt=NUM, align="center")),
           (2, "평일 공휴일", L8), (1, F("평휴수", f'=IF({{날수}}="","",{_cnt("평일")})', fmt=NUM, align="center")),
           (2, "토요일 공휴일", L75), (1, F("토휴수", f'=IF({{날수}}="","",{_cnt("토")})', fmt=NUM, align="center")),
           (2, "현장 쉬는 날", L8), (1, F("더쉼수", '=IF({날수}="","",COUNTIF({더쉼판[]},"✓*"))', fmt=NUM, align="center"))], h=22)
    p.row([(NG, F("판정", f'=IF(AND({{착공일}}="",{{준공일}}=""),"※ 시작일(착공) · 끝날(준공)을 적으면 2027년 안 날 수 · 근무일이 나옵니다",'
                         f'IF(OR(N({{착공일}})=0,N({{준공일}})=0),"⚠ 시작일 · 끝날을 둘 다 날짜로 적으세요",'
                         f'IF({{준공일}}<{{착공일}},"⚠ 끝날이 시작일보다 앞입니다",IF({{날수}}="","⚠ 2027년과 겹치는 날이 없습니다",'
                         f'"✓ 2027년 안 "&MONTH({{셈시작}})&"/"&DAY({{셈시작}})&" ~ "&MONTH({{셈끝}})&"/"&DAY({{셈끝}})&" "&{{날수}}&"일 — 근무일 "&{{근무5}}&"일(주 5일) · "'
                         f'&{{근무6}}&"일(주 6일)"&IF({{더쉼수}}>0," · 현장 쉬는 날 뺌(평일 "&COUNTIF({{더쉼판[]}},"✓ 평일*")&" · 토요일 "'
                         f'&COUNTIF({{더쉼판[]}},"✓ 토요일*")&")","")))))',
                  align="left", bold=True, size=10), {"border": False})], h=26)
    p.row([(NG, "※ 주 5일 = 월 ~ 금에서 공휴일 · 대체공휴일 · 현장 쉬는 날을 뺀 날 · 주 6일 = 거기에 쉬지 않는 토요일을 더한 날. "
                "공사 기간이 2026 · 2028년에 걸치면 2027년 안만 셉니다.", {"kind": "note", "size": 8})], h=24)
    # ㉯ 달마다
    _sec(p, "㉯  달마다 근무일 (2027)")
    ss = [달셈(m) for m in range(1, 13)]
    p.row([(2, "", H)] + [(1, f"{m}월", {"kind": "head", "size": 8.5}) for m in range(1, 13)] + [(1, "한 해", {"kind": "head", "size": 8.5})], h=18)
    for lab, k in (("근무일 · 주 5일", "근무"), ("근무일 · 주 6일", "근무6"), ("쉬는 날 · 주 5일", "쉼"), ("날 수", "날")):
        p.row([(2, lab, L75)] + [(1, s[k], {"kind": "ctext", "size": 9}) for s in ss]
              + [(1, sum(s[k] for s in ss), {"kind": "ctext", "size": 9, "bold": True})], h=18)
    # ㉰ 공휴일 표
    _sec(p, f"㉰  공휴일 · 대체공휴일 {len(HOL)}일 — ㉮ 셈 · «연휴기한» 기한 셈에 쓰는 날")
    hd = [(1, "날짜", H), (1, "요일", H), (5, "공   휴   일", H)]
    p.row(hd + [(1, "", {"kind": "free"})] + hd, h=18)
    hs = sorted(HOL)
    n2 = len(hs) // 2
    for i in range(n2):
        cells = []
        for side, j in ((0, i + 1), (1, i + 1 + n2)):
            d = hs[j - 1]
            ink = RED if d.weekday() == 6 else (BLUE if d.weekday() == 5 else INK)
            cells += [(1, F(f"공휴날#{j}", f"=DATE({Y},{d.month},{d.day})", fmt="md", align="center", size=9, ink=False)),
                      (1, F(f"공휴요#{j}", f'=CHOOSE(WEEKDAY({{공휴날#{j}}}),"일","월","화","수","목","금","토")', align="center", size=9, ink=False),
                       {"ink": ink}),
                      (5, HOL[d], {"kind": "text", "size": 9})]
            if side == 0:
                cells.append((1, "", {"kind": "free"}))
        p.row(cells, h=15)
    for s, j1, j2 in (("L", 1, n2), ("R", n2 + 1, 2 * n2)):
        p.k[f"공휴날{s}[]"] = f"{p.k[f'공휴날#{j1}']}:{p.k[f'공휴날#{j2}']}"
        p.k[f"공휴요{s}[]"] = f"{p.k[f'공휴요#{j1}']}:{p.k[f'공휴요#{j2}']}"
    p.row([(NG, "※ 임시공휴일(정부가 따로 정하는 날)은 들어 있지 않습니다 — 정해지면 ㉮ «현장 쉬는 날 더» 에 적으세요.", {"kind": "note", "size": 8})], h=14)
    p.row([(NG, SRC, {"kind": "note", "size": 7})])
    g.d.done(p)
    p.after_note(["노란 칸(시작일 · 끝날 · 현장 쉬는 날)에 쓰면 하늘색 칸(날 수 · 근무일)이 저절로 바뀝니다."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 공사 기간 2027. 3. 2. ~ 8. 31. · 여름휴가 7. 29. ~ 7. 31.)."])
    return p


# ── ③ 연휴 · 기한 ─────────────────────────────────────────────────────
NK = 3
DANWI = "일,주,개월,년"
CHEOT = "빼고,넣고"
EX_GI = [(D(Y, 1, 23), 14, "일", "빼고"), (D(Y, 1, 30), 1, "개월", "빼고"), (D(Y, 7, 14), 1, "개월", "빼고")]
EX_PLUS = (D(Y, 3, 2), 100)
EX_SAI = (D(Y, 3, 2), D(Y, 8, 31))


def 기끝식(j):
    s, n, u, c = f"{{기시#{j}}}", f"{{기수#{j}}}", f"{{기단#{j}}}", f"{{기첫#{j}}}"
    ins = f'IF({c}="넣고",1,0)'
    S = f"({s}+1-{ins})"                                  # 기산일 — 첫날 빼면 다음 날부터(제157조)
    M = f'IF({u}="년",12,1)*{n}'
    mon = f"IF(DAY(EDATE({S},{M}))<DAY({S}),EOMONTH({S},{M}),EDATE({S},{M})-1)"     # 제160조 ② · ③
    # 단위를 비우면 «일»(사이트는 미리 적힌 «일» · «년» 을 «년 월 일» 자리글로 보고 빈 칸으로 셈 — 미리 안 적음)
    return (f'=IF(OR(N({s})=0,N({n})<=0),"",IF(OR({u}="일",{u}=""),{s}+{n}-{ins},IF({u}="주",{s}+7*{n}-{ins},{mon})))')


def 기만식(j):
    e = f"{{기끝#{j}}}"
    chain = "6"
    for k in range(5, -1, -1):
        x = e if k == 0 else f"({e}+{k})"
        chain = f"IF(NOT({_쉬나(x)}),{k},{chain})"
    return f'=IF({e}="","",{e}+{chain})'


def 기설식(j):
    e, m = f"{{기끝#{j}}}", f"{{기만#{j}}}"
    md = lambda x, y: f'MONTH({x})&"/"&DAY({x})&"("&{y}&")"'                         # noqa: E731
    return (f'=IF({e}="","",IF({m}={e},"끝날 "&{md(e, f"{{기끝요#{j}}}")}&" — 평일이라 그대로",'
            f'"끝날 "&{md(e, f"{{기끝요#{j}}}")}&" 쉬는 날(토요일 · 공휴일) → 다음 평일 "&{md(m, f"{{기만요#{j}}}")})'
            f'&IF(OR(YEAR({e})<>{Y},YEAR({m})<>{Y})," · ⚠ 2027년 밖 — 그해 공휴일은 안 셈(토 · 일만)",""))')


def yeonhyu(bk, ex):
    p = g.pg(bk, ex, "연휴기한", fit=1, widths=WG)
    p.row([(NG, f"{Y} 연휴 · 연차 꿀팁 · 기한 셈", {"kind": "title", "size": 18})], h=34)
    p.row([(NG, "연휴 10번 · 연차 꿀팁 · 기한 셈(끝날이 토요일 · 공휴일이면 다음 평일) · 날짜 셈",
            {"kind": "sub", "size": 9})], h=16)
    # ㉮ 연휴
    _sec(p, "㉮  3일 이상 연휴 10번 (주 5일 · 토 · 일 포함)")
    p.row([(1, "", H), (6, "기    간", H), (2, "날 수", H), (6, "까    닭", H)], h=18)
    for i, (a, b) in enumerate(연휴들(), 1):
        p.row([(1, i, {"kind": "ctext", "size": 9}), (6, f"{_md(a)} ~ {_md(b)}", {"kind": "ctext", "size": 9}),
               (2, f"{(b - a).days + 1}일", {"kind": "ctext", "size": 9, "bold": True}), (6, _까닭(a, b), {"kind": "text", "size": 9})], h=15)
    # ㉯ 연차 꿀팁
    _sec(p, "㉯  연차 꿀팁 — 연차를 1 ~ 4일 내면 이렇게 깁니다 (공휴일이 든 때만)")
    p.row([(6, "연차 낼 날", H), (2, "연차", H), (5, "쉬는 기간", H), (2, "쉬는 날", H)], h=18)
    for gaps, a, b in 연차꿀팁():
        gt = (f"{_md(gaps[0])} ~ {_md(gaps[-1])}" if len(gaps) > 2 and (gaps[-1] - gaps[0]).days == len(gaps) - 1
              else " · ".join(_md(x) for x in gaps))
        p.row([(6, gt, {"kind": "text", "size": 8.5}), (2, f"{len(gaps)}일", {"kind": "ctext", "size": 9}),
               (5, f"{_md(a)} ~ {_md(b)}", {"kind": "ctext", "size": 8.5}), (2, f"{(b - a).days + 1}일", {"kind": "ctext", "size": 9, "bold": True})], h=15)
    p.row([(NG, "※ 주 5일 · 공휴일에 쉬는 회사 기준입니다. 회사 휴무 · 연차 규칙(취업규칙)이 다르면 거기에 맞춰 보세요.", {"kind": "note", "size": 8})], h=14)
    # ㉰ 기한 셈
    _sec(p, "㉰  기한 셈 — «○일 이내 · ○개월 안» 끝나는 날 (민법 기간 셈)")
    p.row([(3, "시작일(그 일이 생긴 날)", {"kind": "head", "size": 8}), (1, "기간", H), (1, "단위", H), (2, "첫날", H),
           (3, "끝날(셈)", H), (1, "요일", H), (3, "만료일(넘김)", H), (1, "요일", H)], h=20)
    for j in range(1, NK + 1):
        e = EX_GI[j - 1] if ex else None
        p.row([(3, I(f"기시#{j}", ex=e[0] if e else None, fmt="ymd", align="center", size=9.5)),
               (1, I(f"기수#{j}", ex=e[1] if e else None, fmt="#,##0", align="center", size=9.5)),
               (1, I(f"기단#{j}", ex=e[2] if e else None, dv=DANWI, align="center", size=9)),
               (2, I(f"기첫#{j}", ex=e[3] if e else None, blank="빼고", dv=CHEOT, align="center", size=9)),
               (3, F(f"기끝#{j}", 기끝식(j), fmt="ymd", align="center", size=9.5)),
               (1, F(f"기끝요#{j}", "=" + _요식(f"{{기끝#{j}}}"), align="center", size=9)),
               (3, F(f"기만#{j}", 기만식(j), fmt="ymd", align="center", size=9.5, bold=True)),
               (1, F(f"기만요#{j}", "=" + _요식(f"{{기만#{j}}}"), align="center", size=9, bold=True))], h=22)
        p.row([(NG, F(f"기설#{j}", 기설식(j), align="left", size=8.5), {"border": False})], h=15)
    p.row([(NG, "※ 민법 제157조 — 첫날은 안 셈(그날 0시부터 시작하면 셈 → «넣고») · 제160조 — 주 · 개월 · 년은 달력으로, 끝 달에 같은 날이 없으면 그 달 끝날 · "
                "제161조 — 끝날이 토요일 · 공휴일이면 다음 날(그날도 쉬는 날이면 그다음 평일). 법령 · 계약에 따로 정한 셈이 있으면 그것을 따릅니다. "
                "공휴일은 2027년만 셉니다.", {"kind": "note", "size": 7.5})], h=34)
    # ㉱ 날짜 셈
    _sec(p, "㉱  날짜 셈 — 며칠 뒤 · 두 날 사이")
    p.row([(3, "기준일", H), (2, "더할 날(−는 앞)", {"kind": "head", "size": 8}), (3, "그날", H), (1, "요일", H), (6, "쉬는 날인가", H)], h=18)
    a0, n0 = EX_PLUS
    p.row([(3, I("더기준", ex=a0 if ex else None, fmt="ymd", align="center", size=9.5)),
           (2, I("더일", ex=n0 if ex else None, fmt="#,##0", align="center", size=9.5)),
           (3, F("더날", '=IF(OR(N({더기준})=0,{더일}=""),"",{더기준}+{더일})', fmt="ymd", align="center", size=9.5, bold=True)),
           (1, F("더요", "=" + _요식("{더날}"), align="center", size=9)),
           (6, F("더쉼", f'=IF({{더날}}="","",IF(YEAR({{더날}})<>{Y},IF(OR(WEEKDAY({{더날}})=1,WEEKDAY({{더날}})=7),"쉬는 날(토 · 일)","평일 · 2027년 밖(공휴일은 안 셈)"),'
                        f'IF({_쉬나("{더날}")},"쉬는 날(토 · 일 · 공휴일)","평일")))', align="center", size=9))], h=22)
    p.row([(3, "앞날", H), (3, "뒷날", H), (3, "사이 날 수", H), (3, "첫날까지 넣으면", H), (3, "몇 주 며칠", H)], h=18)
    s0, e0 = EX_SAI
    p.row([(3, I("사앞", ex=s0 if ex else None, fmt="ymd", align="center", size=9.5)),
           (3, I("사뒤", ex=e0 if ex else None, fmt="ymd", align="center", size=9.5)),
           (3, F("사이", '=IF(OR(N({사앞})=0,N({사뒤})=0),"",{사뒤}-{사앞})', fmt=NUM, align="center", size=9.5, bold=True)),
           (3, F("사이넣", '=IF({사이}="","",IF({사이}<0,"⚠ 뒷날이 앞",{사이}+1))', fmt=NUM, align="center", size=9.5)),
           (3, F("사주", '=IF({사이}="","",IF({사이}<0,"",INT({사이}/7)&"주 "&MOD({사이},7)&"일"))', align="center", size=9.5))], h=22)
    p.row([(NG, SRC, {"kind": "note", "size": 7})])
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다 — 기한 셈의 단위(일 · 주 · 개월 · 년 · 비우면 일) · 첫날(빼고 · 넣고)은 고르는 칸입니다."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 날짜 — 통지 1/23 + 14일 · 1/30 + 1개월 · 7/14 + 1개월)."])
    return p


# ── ④ 달마다 ───────────────────────────────────────────────────────────
WM = [2.4] + [3.6, 15.0] * 7
NMC = len(WM)       # 15
EXM = {1: {5: "시무식", 14: "정기 안전교육", 25: "기성 청구", 29: "월간 공정회의"},
       2: {3: "자재 발주", 10: "설 연휴 뒤 현장 점검", 25: "기성 청구"},
       3: {2: "착공(가상의 공사)", 4: "작업계획서 확인", 16: "품질시험", 25: "기성 청구"},
       4: {5: "정기 안전교육", 16: "국민안전의 날 행사", 26: "기성 청구"},
       5: {4: "우기 대비 점검", 12: "협력업체 회의", 25: "기성 청구"},
       6: {4: "장마 대비 배수로 점검", 16: "품질시험", 25: "기성 청구"},
       7: {1: "하반기 공정 점검", 15: "폭염 대비 휴게시간 점검", 26: "기성 청구", 29: "여름휴가(~31일)"},
       8: {4: "안전 일제점검", 18: "준공 서류 준비", 31: "준공(가상의 공사)"},
       9: {3: "추석 전 현장 정리", 13: "연휴 전 안전점검", 17: "연휴 뒤 작업 다시 시작", 27: "기성 청구"},
       10: {5: "안전 일제점검", 14: "동절기 공사 계획", 26: "기성 청구"},
       11: {4: "안전 일제점검", 16: "동절기 대비 점검", 25: "기성 청구"},
       12: {6: "안전 일제점검", 15: "한 해 서류 정리", 30: "종무식"}}
TOP, FOOT = 20 + 30 + 14 + 18, 14 + 14 + 14 + 12
AVAIL = 524 - TOP - FOOT          # 가로 A4 한 쪽 — 머리 · 꼬리를 뺀 주 칸 높이


def dal(bk, ex, m):
    p = g.pg(bk, ex, f"{m}월", fit=1, land=True, widths=WM)
    p.row([(NMC, f"{Y}년  {m}월", {"kind": "title", "size": 20})], h=30)
    p.row([(NMC, "공휴일 · 대체공휴일 빨강 · 토요일 파랑 · 날마다 음력 · 손없는 날(이사 · 입주) · 24절기 · 주차 — 날 칸 아래에 일정을 적으세요",
            {"kind": "sub", "size": 8.5})], h=14)
    p.row([(1, "주", {"kind": "head", "size": 8})] + [(2, w, {"kind": "head", "size": 10, "ink": RED if i == 0 else (BLUE if i == 6 else INK)})
                                                      for i, w in enumerate(WK)], h=18)
    exm = EXM.get(m, {}) if ex else {}
    ws = 주들(m)
    hm = round(AVAIL / len(ws) - 13 - 11, 1)
    for wkk in ws:
        r0 = p.r
        first = next(d for d in wkk if d)
        cells = [(1, 주차(first), {"kind": "ctext", "size": 7.5, "ink": GREY, "rs": 3})]
        for d in wkk:
            if d is None:
                cells += [(1, "", {"kind": "text", "rs": 2}), (1, "", {"kind": "text"})]
            else:
                t, c = 윗글(d)
                cells += [(1, d.day, {"kind": "ctext", "size": 12, "bold": True, "ink": 날색(d), "rs": 2, "valign": "top"}),
                          (1, t, {"kind": "text", "size": 7.5, "ink": c, "align": "right"})]
        p.row(cells, h=13)
        cells = []
        for d in wkk:
            cells.append((1, "", {"kind": "text"}) if d is None else (1, 아랫글(d), {"kind": "text", "size": 7, "ink": GREY, "align": "right"}))
        p.row(cells, h=11)
        cells = []
        for d in wkk:
            cells.append((2, "", {"kind": "text"}) if d is None else
                         (2, I(f"일정#{d.day}", ex=exm.get(d.day), size=8.5, align="left"), {"valign": "top"}))
        p.row(cells, h=hm)
        # 날 칸 하나 = 바깥 줄만(안 줄 없앰) · 달 밖은 옅은 회색
        _box(p.ws, r0, r0 + 2, 1, 1)
        for k, d in enumerate(wkk):
            c1 = 2 + 2 * k
            _box(p.ws, r0, r0 + 2, c1, c1 + 1, None if d else OUTM)
    hs = [d for d in sorted(HOL) if d.month == m]
    s = 달셈(m)
    p.row([(NMC, "공휴일 — " + ("  ·  ".join(f"{d.day}일({wk(d)}) {HOL[d]}" for d in hs) if hs else "없음"),
            {"kind": "free", "size": 8.5, "ink": RED if hs else INK})], h=14)
    p.row([(NMC, f"근무일 — 주 5일 {s['근무']}일 · 주 6일 {s['근무6']}일  ·  쉬는 날(주 5일) {s['쉼']}일  ·  이 달 {s['날']}일  ·  안전점검의 날 4일",
            {"kind": "free", "size": 8.5})], h=14)
    p.row([(NMC, "손없는 날(음력 9 · 10 · 19 · 20 · 29 · 30일) — " + " · ".join(f"{x}일" for x in s["손"]), {"kind": "free", "size": 8.5, "ink": GREY})], h=14)
    p.row([(NMC, SRC, {"kind": "note", "size": 7})], h=12)
    g.d.done(p)
    p.after_note(["날 칸 아래에 일정을 적으면 이 기기에 저장됩니다 — 다시 열면 이어서."] if not ex else ["이 시트는 작성 예시입니다(가상의 현장 일정)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    yeongan(bk, ex)
    geunmu(bk, ex)
    yeonhyu(bk, ex)
    for m in range(1, 13):
        dal(bk, ex, m)


# ── 파이썬으로 따로 셈(하루씩 세어 봄 — 수식과 다른 길) ─────────────────
def 셈(a, b, more):
    out = {"날수": "", "셈시작": "", "셈끝": "", "일요": "", "토요": "", "평휴수": "", "토휴수": "", "근무5": "", "근무6": "", "쉬는5": "", "더쉼수": ""}
    isd = isinstance(a, D) and isinstance(b, D)
    s, e = (max(a, D(Y, 1, 1)), min(b, D(Y, 12, 31))) if isd else (None, None)
    ok = isd and s <= e
    st = []
    for j in range(1, NM + 1):
        d = more[j - 1] if j <= len(more) else None
        if d is None:
            st.append("")
        elif not isinstance(d, D):
            st.append("⚠ 날짜로")
        elif not ok:
            st.append("기간을 먼저")
        elif d < s or d > e:
            st.append("기간 밖")
        elif d in HOL:
            st.append("이미 공휴일")
        elif d in more[:j - 1]:
            st.append("앞 칸과 같은 날")
        elif d.weekday() == 6:
            st.append("일요일 · 안 뺌")
        elif d.weekday() == 5:
            st.append("✓ 토요일 · 주 6일만 뺌")
        else:
            st.append("✓ 평일 · 뺌")
        out[f"더쉼판#{j}"] = st[-1]
    if not a and not b:
        out["판정"] = "※ 시작일(착공) · 끝날(준공)을 적으면 2027년 안 날 수 · 근무일이 나옵니다"
        return out
    if not isd:
        out["판정"] = "⚠ 시작일 · 끝날을 둘 다 날짜로 적으세요"
        return out
    if b < a:
        out["판정"] = "⚠ 끝날이 시작일보다 앞입니다"
        return out
    if not ok:
        out["판정"] = "⚠ 2027년과 겹치는 날이 없습니다"
        return out
    days = [s + i * DAY for i in range((e - s).days + 1)]
    xw = [more[j] for j in range(len(more)) if st[j].startswith("✓ 평일")]
    xs = [more[j] for j in range(len(more)) if st[j].startswith("✓ 토요일")]
    w5 = [d for d in days if not 쉼5(d) and d not in xw]
    w6 = [d for d in days if d.weekday() != 6 and d not in HOL and d not in xw and d not in xs]
    out.update({"날수": len(days), "셈시작": s, "셈끝": e,
                "일요": sum(1 for d in days if d.weekday() == 6), "토요": sum(1 for d in days if d.weekday() == 5),
                "평휴수": sum(1 for d in days if d in HOL and d.weekday() < 5), "토휴수": sum(1 for d in days if d in HOL and d.weekday() == 5),
                "근무5": len(w5), "근무6": len(w6), "쉬는5": len(days) - len(w5), "더쉼수": len(xw) + len(xs)})
    out["판정"] = (f"✓ 2027년 안 {s.month}/{s.day} ~ {e.month}/{e.day} {len(days)}일 — 근무일 {len(w5)}일(주 5일) · {len(w6)}일(주 6일)"
                 + (f" · 현장 쉬는 날 뺌(평일 {len(xw)} · 토요일 {len(xs)})" if xw or xs else ""))
    return out


def _edate(d, n):
    y, m = divmod(d.month - 1 + n, 12)
    y, m = d.year + y, m + 1
    return D(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def 기한(s, n, u, c):
    """민법 제157조 · 제160조 · 제161조 — (끝날, 만료일)"""
    if not isinstance(s, D) or not n or n <= 0:
        return None, None
    u = u or "일"
    ins = 1 if c == "넣고" else 0
    if u == "일":
        e = s + (n - ins) * DAY
    elif u == "주":
        e = s + (7 * n - ins) * DAY
    else:
        S = s + (1 - ins) * DAY
        M = (12 if u == "년" else 1) * n
        t = _edate(S, M)
        e = D(t.year, t.month, calendar.monthrange(t.year, t.month)[1]) if t.day < S.day else t - DAY
    x = e
    while x.weekday() >= 5 or x in HOL:
        x += DAY
    return e, x


def expect(pages):
    gp = pages["근무일"]
    more = [gp.get(f"더쉼#{j}") for j in range(1, NM + 1)]
    out = 셈(gp.get("착공일"), gp.get("준공일"), more)
    for j, d in enumerate(sorted(HOL), 1):
        out[f"공휴날#{j}"] = d
        out[f"공휴요#{j}"] = wk(d)
    yp = pages["연휴기한"]
    o2 = {}
    for j in range(1, NK + 1):
        e, x = 기한(yp.get(f"기시#{j}"), yp.get(f"기수#{j}"), yp.get(f"기단#{j}"), yp.get(f"기첫#{j}"))
        if e is None:
            o2.update({f"기끝#{j}": "", f"기끝요#{j}": "", f"기만#{j}": "", f"기만요#{j}": "", f"기설#{j}": ""})
            continue
        o2.update({f"기끝#{j}": e, f"기끝요#{j}": wk(e), f"기만#{j}": x, f"기만요#{j}": wk(x)})
        t = (f"끝날 {e.month}/{e.day}({wk(e)}) — 평일이라 그대로" if x == e else
             f"끝날 {e.month}/{e.day}({wk(e)}) 쉬는 날(토요일 · 공휴일) → 다음 평일 {x.month}/{x.day}({wk(x)})")
        if e.year != Y or x.year != Y:
            t += " · ⚠ 2027년 밖 — 그해 공휴일은 안 셈(토 · 일만)"
        o2[f"기설#{j}"] = t
    a0, n0 = yp.get("더기준"), yp.get("더일")
    if isinstance(a0, D) and n0 is not None:
        x = a0 + n0 * DAY
        o2.update({"더날": x, "더요": wk(x),
                   "더쉼": ("쉬는 날(토 · 일 · 공휴일)" if 쉼5(x) else "평일") if x.year == Y else
                   ("쉬는 날(토 · 일)" if x.weekday() >= 5 else "평일 · 2027년 밖(공휴일은 안 셈)")})
    else:
        o2.update({"더날": "", "더요": "", "더쉼": ""})
    s0, e0 = yp.get("사앞"), yp.get("사뒤")
    if isinstance(s0, D) and isinstance(e0, D):
        n = (e0 - s0).days
        o2.update({"사이": n, "사이넣": "⚠ 뒷날이 앞" if n < 0 else n + 1, "사주": "" if n < 0 else f"{n // 7}주 {n % 7}일"})
    else:
        o2.update({"사이": "", "사이넣": "", "사주": ""})
    return {"근무일": out, "연휴기한": o2}
