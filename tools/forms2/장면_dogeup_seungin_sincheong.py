# -*- coding: utf-8 -*-
"""G710 유해ㆍ위험작업 도급승인 신청서 장면 — python3 tools/forms2/장면시험.py dogeup-seungin-sincheong --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(제59조 작업 · 6개월) · 작업 넷 · 딱 3년(끝날 = 3년 되는 날 전날) · 하루 넘음 · 2월 29일 시작 · 끝날이 앞섬 · 시작일만 · 끝날만 · 작업 없이 날만 · 빈칸 여럿"""
import copy
import datetime

import f_dogeup_seungin_sincheong as m

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
    "도금": S(dict(작업=m.GB[0])),
    "수은납카드뮴": S(dict(작업=m.GB[1])),
    "허가대상물질": S(dict(작업=m.GB[2])),
    "딱3년": S(dict(시작일=D(2027, 3, 2), 끝날=D(2030, 3, 1))),
    "하루넘음": S(dict(시작일=D(2027, 3, 2), 끝날=D(2030, 3, 2))),
    "하루넘음_도금": S(dict(작업=m.GB[0], 시작일=D(2027, 3, 2), 끝날=D(2030, 3, 2))),
    "2월29일시작": S(dict(시작일=D(2028, 2, 29), 끝날=D(2031, 2, 28))),
    "2월29일시작_넘음": S(dict(시작일=D(2028, 2, 29), 끝날=D(2031, 3, 1))),
    "끝날앞섬": S(dict(끝날=D(2027, 2, 1))),
    "시작일만": S(dict(끝날=None)),
    "끝날만": S(dict(시작일=None)),
    "작업없이날만": S(dict(작업=None)),
    "작업만": S(dict(시작일=None, 끝날=None)),
    "빈칸여럿": S(dict(작업=None), s=dict(신청인=None, 작업공정=None)),
}


def show(exp):
    a = exp["셈"]
    return f"| {str(a.get('근거'))[:14]} | {str(a.get('유효'))[:50]} | {str(a.get('빈칸'))[:24]}"
