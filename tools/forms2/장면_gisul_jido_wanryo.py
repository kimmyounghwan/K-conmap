# -*- coding: utf-8 -*-
"""G715 기술지도 완료증명서 장면 — python3 tools/forms2/장면시험.py gisul-jido-wanryo --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(12회 · 계약 12회) · 실시 적음 · 실시 많음 · 계약 15회(12칸 넘음) · 계약기간 앞 · 뒤 날짜 · 차례 뒤바뀜 · 둘 다 · 계약기간 없음 ·
   한 달 한 자리(9월 · 10월 넘김 · 0 붙임) · 실시일 없음 · 빈칸 여럿"""
import copy
import datetime

import f_gisul_jido_wanryo as m

D = datetime.date


def S(ex=None, s=None):
    out = {"EX": dict(ex or {})}
    if s is not None:
        es = copy.deepcopy(m.EX_S)
        es.update(s)
        out["EX_S"] = es
    return out


BLANK = {k: None for k in m.EX}
BLANK_S = {k: None for k in m.EX_S}
NO_DATES = {f"실시#{k}": None for k in range(1, 13)}

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "예시": S(),
    "실시적음": S({"실시#11": None, "실시#12": None}),
    "실시많음": S({"횟수": 10}),
    "계약15회": S({"횟수": 15}),
    "계약기간앞": S({"실시#1": D(2027, 2, 28)}),
    "계약기간뒤": S({"실시#12": D(2027, 9, 7)}),
    "차례뒤바뀜": S({"실시#5": D(2027, 4, 1)}),
    "둘다": S({"실시#1": D(2027, 3, 1), "실시#6": D(2027, 5, 1)}),
    "계약기간없음": S({"계약시작": None, "계약끝": None, "실시#1": D(2026, 12, 1)}),
    "두자리달": S({"계약끝": D(2027, 12, 31), "실시#12": D(2027, 10, 5), "실시#11": D(2027, 9, 9)}),
    "실시일없음": S(NO_DATES),
    "빈칸여럿": S({"유형": None, "횟수": None}, s={"대가": None, "기관명칭": None}),
}


def show(exp):
    a = exp["셈"]
    return f"| {str(a.get('실시'))[:40]} | {str(a.get('범위'))[:30]} | {str(a.get('차례'))[:30]} | {str(a.get('빈칸'))[:20]}"
