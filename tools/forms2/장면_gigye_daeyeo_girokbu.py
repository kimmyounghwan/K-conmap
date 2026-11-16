# -*- coding: utf-8 -*-
"""G711 기계등 대여사항 기록부 장면 — python3 tools/forms2/장면시험.py gigye-daeyeo-girokbu --site
   빈칸 · 예시(5줄) · 한 줄 · 25줄 꽉 · 횟수 빈칸 줄 · 사업체 빈칸 · 기록 없이 사업체만"""
import copy
import datetime

import f_gigye_daeyeo_girokbu as m

D = datetime.date
BLANK_S = {k: None for k in m.EX_S}


def S(s=None, r=None):
    out = {"EX": {}}
    if s is not None:
        es = copy.deepcopy(m.EX_S)
        es.update(s)
        out["EX_S"] = es
    if r is not None:
        out["EX_R"] = r
    return out


FULL = [(D(2027, 1, 1) + datetime.timedelta(days=7 * i), f"기계{i + 1}", 2, (i % 3) + 1, "0(0)", None) for i in range(25)]

SCENES = {
    "빈칸": S(BLANK_S, []),
    "예시": S(),
    "한줄": S(r=[(D(2027, 5, 6), "버킷굴착기(0.6㎥)", 6, 2, "0(0)", None)]),
    "25줄꽉": S(r=FULL),
    "횟수빈칸줄": S(r=[(D(2027, 5, 6), "버킷굴착기(0.6㎥)", 6, None, "0(0)", None), (D(2027, 5, 9), "지게차", 4, 3, None, None)]),
    "사업체빈칸": S(dict(사업자등록번호=None, 소재지=None)),
    "기록없이사업체만": S(r=[]),
}


def show(exp):
    a = exp["셈"]
    return f"| {a.get('합계')} | {str(a.get('빈칸'))[:30]}"
