# -*- coding: utf-8 -*-
"""G725 재하도급 승낙통보서 장면 — python3 tools/forms2/장면시험.py jaehado-seungnak --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(18.4%) · 딱 20% · 20.01% · B>A · 기한 토 · 일요일 · 통보 늦음 · 통보일 없음 · 승낙일 없음 · 빈칸 여럿"""
import copy
import datetime

import f_jaehado_seungnak as m

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

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "예시": S(),
    "딱20": S(dict(하도급액=1000000000, 재하도급액=200000000)),
    "20넘음": S(dict(하도급액=1000000000, 재하도급액=200100000)),
    "B가큼": S(dict(하도급액=100000000, 재하도급액=150000000)),
    "소수비중": S(dict(하도급액=1300000000, 재하도급액=240100000)),
    "기한토요일": S(dict(승낙일=D(2027, 5, 15)), s=dict(제출일=D(2027, 6, 1))),
    "기한일요일": S(dict(승낙일=D(2027, 5, 16))),
    "통보늦음": S(s=dict(제출일=D(2027, 6, 15))),
    "통보일없음": S(s=dict(제출일=None)),
    "승낙일없음": S(dict(승낙일=None)),
    "빈칸여럿": S(dict(재하도급액=None), s=dict(승낙사유=None, 재하수급업종=None, 공종=None)),
}


def show(exp):
    a, b = exp["셈"], exp["통보서"]
    return f"| {str(a.get('비중'))[:28]} | {str(a.get('기한'))[-30:]} | {str(a.get('빈칸'))[:36]} | {b.get('비중표시')}"
