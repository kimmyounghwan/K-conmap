# -*- coding: utf-8 -*-
"""민원기한 — 기관이 처리하는 기간(«신청서를 받은 날부터 N일 이내에 … 내주어야» · 서식 «처리기간 N일»)의 끝날
   (2026-11-17 G741 · 공사감리자 지정 신청서를 만들다 찾음 — (임시)사용승인 신청서도 같은 셈)

근거(국가법령정보센터 · 세 번 — 조문 주소 · 전체 쪽 · 조문 주소 같은 해시 59e982fc1c138bb0):
  「민원 처리에 관한 법률」 [시행 2022. 7. 12.] [법률 제18748호, 2022. 1. 11., 타법개정] 제19조(처리기간의 계산)
   ② 민원의 처리기간을 6일 이상으로 정한 경우에는 «일» 단위로 계산하고 첫날을 산입하되, 공휴일과 토요일은 산입하지 아니한다.
   (① 5일 이하는 «시간» 단위(1일 = 8시간) — 여기서 안 씀 · ③ 주 · 월 · 연은 첫날 산입 + 민법 제159조 ~ 제161조)
  → 신청인이 지키는 기한(«날부터 N일 이내에 신고하여야»)은 민법(첫날 빼고 · 끝날이 토 · 공휴일이면 다음 날 — 기간셈.py · 각 서식)이고,
    기관이 처리하는 기간은 이 셈 — 받은 날을 1일로 넣고 토 · 일 · 공휴일은 빼고 센 N번째 근무일(받은 날이 쉬는 날이면 그날은 안 셈).
  공휴일 — 「관공서의 공휴일에 관한 규정」(일요일 · 국경일 · 설 · 추석 · 대체공휴일 · 노동절 · 제헌절 …) 중 평일에 든 날:
   2026. 10. 10. ~ 2027. 12. 31. (2026. 12. 25. + f_dalryeok_2027.HOL 의 평일 15일 — 시험_민원기한.py 가 같은지 봄).
   그 밖의 날은 토 · 일요일만 빼고 셈 → ⚠ 글로 알림. 임시공휴일(정부가 따로 정하는 날)은 없음.

엑셀 식(사이트 셈 · 리브레오피스 같음): 숨은 줄 셋 — 평일 공휴일 표(2줄) · 되풀이 칸(1줄)
   E(0) = 받은날 + N − 1 · E(k+1) = 받은날 + N − 1 + 쉬는 날 수(받은날 ~ E(k))  → 고정점 = 끝날(아래에서 올라가 넘지 않음)
   쉬는 날 수(a ~ b) = 날 수 − 평일 수 + 평일 공휴일 수(COUNTIFS) · 평일 수 = 닫힌 꼴(INT · MOD · WEEKDAY(,2))
   되풀이 횟수는 시험이 모든 날 · N 에서 고정점에 닿는지 봄(모자라면 ❌).
"""
import datetime

D = datetime.date
ONE = datetime.timedelta(days=1)

셈첫날, 셈끝날 = D(2026, 10, 10), D(2027, 12, 31)
평일공휴 = [D(2026, 12, 25),
           D(2027, 1, 1), D(2027, 2, 8), D(2027, 2, 9), D(2027, 3, 1), D(2027, 5, 3), D(2027, 5, 5), D(2027, 5, 13), D(2027, 7, 19),
           D(2027, 8, 16), D(2027, 9, 14), D(2027, 9, 15), D(2027, 9, 16), D(2027, 10, 4), D(2027, 10, 11), D(2027, 12, 27)]
_휴 = set(평일공휴)
되풀이 = 8
# 숨은 표 한 줄에 넣는 날 수(서식 셈 장 12칸)
_줄칸 = 12


def 쉬는날(d):
    return d.weekday() >= 5 or d in _휴


def 처리끝(d, n):
    """받은 날 d 를 1일로(쉬는 날이면 안 셈) 토 · 일 · 공휴일 빼고 센 n 번째 근무일"""
    k, x = 0, d
    while True:
        if not 쉬는날(x):
            k += 1
            if k == n:
                return x
        x += ONE


def 다덮음(d, e):
    """공휴일 표가 받은 날 ~ 끝날을 다 덮는가(아니면 토 · 일요일만 뺀 셈)"""
    return 셈첫날 <= d and e <= 셈끝날


def _평일식(a, b):
    """a ~ b(둘 다 넣고) 월 ~ 금 수 — 닫힌 꼴(a ≤ b)"""
    L = f"({b}-{a}+1)"
    s = f"WEEKDAY({a},2)"
    r = f"MOD({L},7)"
    return f"(INT({L}/7)*5+MAX(0,MIN(5,{s}+{r}-1)-{s}+1)+MAX(0,{s}+{r}-8))"


def _쉼식(a, b, H):
    return f"(({b}-{a}+1)-{_평일식(a, b)}+COUNTIFS({H},\">=\"&{a},{H},\"<=\"&{b}))"


def 넣기(p, 받은날, n, pre):
    """쪽 p(12칸 셈 장) 끝에 숨은 줄 셋을 넣고 끝날 칸 이름을 돌려줌 — {pre}끝 (받은날이 비면 "")
       받은날: '{신청일}' 꼴(같은 장 칸 이름) · n: 처리기간 날 수(6 이상) 또는 날 수 칸 '{처일수}'(G747 — 표에서 고른 날 수) ·
       pre: 이름 앞글자(장 안에서 겹치지 않게)"""
    from fb import CL, F          # 셈 장에 넣을 때만(시험은 openpyxl 없이도 돌게)
    if isinstance(n, str):        # 🆕 G747 날 수가 칸에 있을 때(빈칸이면 "")
        nm1, 빈 = f"({n})-1", f"OR(N({받은날})=0,N({n})=0)"
    else:
        assert n >= 6, "5일 이하는 시간 단위(민원처리법 제19조①) — 이 셈 아님"
        nm1, 빈 = f"{n - 1}", f"N({받은날})=0"
    assert p.ncol == _줄칸, p.ncol
    hide = []
    # ① 평일 공휴일 표(값 — 빈 서식에서도 수식 칸이 아님)
    r1 = p.r
    for i in range(0, len(평일공휴), _줄칸):
        part = 평일공휴[i:i + _줄칸]
        cells = [(1, d, {"kind": "free", "fmt": "yyyy-mm-dd", "size": 6}) for d in part]
        if len(part) < _줄칸:
            cells.append((_줄칸 - len(part), "", {"kind": "free", "size": 6}))
        hide.append(p.row(cells, h=10))
    r2 = p.r - 1
    H = f"{pre}휴[]"
    p.k[H] = f"{CL(1)}{r1}:{CL(_줄칸)}{r2}"
    # ② 되풀이 칸
    E = f"({받은날}+{nm1})"
    cells = []
    for k in range(1, 되풀이 + 1):
        f = f'=IF({빈},"",{받은날}+{nm1}+{_쉼식(받은날, E, "{" + H + "}")})'
        key = f"{pre}끝" if k == 되풀이 else f"{pre}E{k}"
        cells.append((1, F(key, f, fmt="yyyy-mm-dd", size=6)))
        E = "{" + key + "}"
    cells.append((_줄칸 - 되풀이, "", {"kind": "free", "size": 6}))
    hide.append(p.row(cells, h=10))
    for r in hide:
        p.ws.row_dimensions[r].hidden = True
    return f"{pre}끝"


def 덮음식(받은날, 끝):
    """공휴일 표 밖이면 참 — 글로 알릴 때"""
    return f"OR({받은날}<DATE({셈첫날.year},{셈첫날.month},{셈첫날.day}),{끝}>DATE({셈끝날.year},{셈끝날.month},{셈끝날.day}))"


밖글 = " ⚠ 공휴일은 2026. 10. 10. ~ 2027. 12. 31. 만 셈 — 그 밖은 토 · 일요일만 뺐습니다(공휴일이 끼면 그만큼 늦어짐)"


# ══════════════════════════════════════════════════════════════════
#  🆕 G745 (11-17 도로공사 착수 신고서) — 신청인이 지키는 «…한 날부터 n일 이내» 끝날(기관 처리기간 셈과 다름)
#   민법 제157조(첫날 빼고 — d + n) · 제161조(끝날이 토요일 · 공휴일이면 그다음 날 — 일요일도 공휴일) · G674 · G728 세 번 본 조문.
#   공휴일 표는 위와 같음(표 밖은 토 · 일요일만 → 덮음식 · 밖글로 알림).
#   엑셀 식: 숨은 줄 — 평일 공휴일 표 + 미룸 칸 이월되풀이 개(E1 = d + n · 다음 칸 = 앞 칸이 쉬는 날이면 하루 뒤)
#   잇단 쉬는 날은 표 안에서 가장 긴 것 4일(2027. 2. 6. ~ 9. 설) — 시험_민원기한 ⑤ 가 모든 날에서 닿는지 봄.
# ══════════════════════════════════════════════════════════════════
이월되풀이 = 6


def 이월끝(d, n):
    """«d 날부터 n일 이내» 끝날 — 첫날 빼고 d + n · 끝날이 토 · 일 · 공휴일(표 안)이면 그다음 근무일"""
    e = d + datetime.timedelta(days=n)
    while 쉬는날(e):
        e += ONE
    return e


def 넣기_이월(p, 날, n, pre):
    """쪽 p(12칸 셈 장) 끝에 숨은 줄(공휴일 표 · 미룸 칸)을 넣고 끝날 칸 이름 {pre}끝 을 돌려줌(날이 비면 "")
       날: '{착수일}' 꼴 · n: 날 수(1 이상) · pre: 이름 앞글자(장 안에서 겹치지 않게)"""
    from fb import CL, F
    assert n >= 1
    assert p.ncol == _줄칸, p.ncol
    hide = []
    r1 = p.r
    for i in range(0, len(평일공휴), _줄칸):
        part = 평일공휴[i:i + _줄칸]
        cells = [(1, d, {"kind": "free", "fmt": "yyyy-mm-dd", "size": 6}) for d in part]
        if len(part) < _줄칸:
            cells.append((_줄칸 - len(part), "", {"kind": "free", "size": 6}))
        hide.append(p.row(cells, h=10))
    r2 = p.r - 1
    H = "{" + f"{pre}휴[]" + "}"
    p.k[f"{pre}휴[]"] = f"{CL(1)}{r1}:{CL(_줄칸)}{r2}"
    cells, prev = [], None
    for k in range(1, 이월되풀이 + 1):
        if prev is None:
            f = f'=IF(N({날})=0,"",{날}+{n})'
        else:
            f = (f'=IF(N({prev})=0,"",IF(OR(WEEKDAY({prev},2)>5,COUNTIFS({H},">="&{prev},{H},"<="&{prev})>0),'
                 f'{prev}+1,{prev}))')
        key = f"{pre}끝" if k == 이월되풀이 else f"{pre}E{k}"
        cells.append((1, F(key, f, fmt="yyyy-mm-dd", size=6)))
        prev = "{" + key + "}"
    cells.append((_줄칸 - 이월되풀이, "", {"kind": "free", "size": 6}))
    hide.append(p.row(cells, h=10))
    for r in hide:
        p.ws.row_dimensions[r].hidden = True
    return f"{pre}끝"


def 이월흉내(d, n, 되풀=이월되풀이):
    """넣기_이월() 의 숨은 식과 같은 셈 — 칸마다 값(시험 · expect 용) [E1, E2, …]"""
    out = [d + datetime.timedelta(days=n)]
    for _ in range(되풀 - 1):
        e = out[-1]
        out.append(e + ONE if (e.weekday() >= 5 or e in _휴) else e)
    return out


# ── 파이썬으로 엑셀 식 흉내(시험용) ─────────────────────────────────────
def 식흉내(d, n, 되풀=되풀이):
    """넣기() 의 숨은 식과 같은 셈(평일 공휴일 표 · 고정점 되풀이) — 시험이 처리끝 과 대조"""
    def 평일(a, b):
        L = (b - a).days + 1
        s = a.isoweekday()
        r = L % 7
        return (L // 7) * 5 + max(0, min(5, s + r - 1) - s + 1) + max(0, s + r - 8)

    def 쉼(a, b):
        return ((b - a).days + 1) - 평일(a, b) + sum(1 for h in 평일공휴 if a <= h <= b)
    e = d + datetime.timedelta(days=n - 1)
    for _ in range(되풀):
        e = d + datetime.timedelta(days=n - 1 + 쉼(d, e))
    return e
