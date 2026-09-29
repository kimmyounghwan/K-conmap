# -*- coding: utf-8 -*-
"""b_*.py 가 같이 쓰는 도움 — 파이썬 쪽 «따로 계산»(expect) 용 셈과 자주 쓰는 수식 조각."""
import datetime
from decimal import Decimal as Dm, ROUND_FLOOR, ROUND_HALF_UP

D = datetime.date
DAYF = '#,##0"일";[Red]-#,##0"일";""'
PCT3 = "0.000%;[Red]-0.000%;\"\""
YMD = "yyyy. m. d."


def dm(x):
    return Dm(str(x)) if x not in (None, "") else Dm(0)


def tr(*fs):
    """곱한 뒤 원 미만 버림(엑셀 INT(ROUND(x,6)) 과 같음)"""
    v = Dm(1)
    for f in fs:
        v *= dm(f)
    return int(v.quantize(Dm("0.000001"), ROUND_HALF_UP).to_integral_value(ROUND_FLOOR))


def rnd(x, n=0):
    q = Dm(1).scaleb(-n)
    return int(dm(x).quantize(q, ROUND_HALF_UP)) if n == 0 else float(dm(x).quantize(q, ROUND_HALF_UP))


def col(inp, key, n=60):
    """표 열 값 [(줄번호, 값)…] — 빈 칸 뺌"""
    return [(i, inp.get(f"{key}#{i}")) for i in range(1, n + 1) if inp.get(f"{key}#{i}") not in (None, "")]


def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


TRF = "INT(ROUND({x},6))"


def T(x):
    return f"INT(ROUND({x},6))"
