# -*- coding: utf-8 -*-
"""G727 하도급 참여제한 확인서 장면 — python3 tools/forms2/장면시험.py hado-chamyeo-jehan --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(제한 중) · 시작 전 · 시작날 · 끝날 · 끝난 뒤 · 거꾸로 · 하루 · 확인한 날 없음 · 끝일 없음 · 법인번호만 · 번호 둘 다 없음 · 빈칸 여럿 · 윤년 2월"""
import copy
import datetime

import f_hado_chamyeo_jehan as m

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
    "시작전": S(dict(점검일=D(2027, 2, 20))),
    "시작날": S(dict(점검일=D(2027, 3, 1))),
    "끝날": S(dict(점검일=D(2027, 8, 31))),
    "끝난뒤": S(dict(점검일=D(2027, 9, 1))),
    "거꾸로": S(dict(제한시작=D(2027, 8, 31), 제한끝=D(2027, 3, 1))),
    "하루": S(dict(제한시작=D(2027, 3, 1), 제한끝=D(2027, 3, 1), 점검일=D(2027, 3, 1))),
    "확인일없음": S(dict(점검일=None)),
    "끝일없음": S(dict(제한끝=None)),
    "법인번호만": S(s=dict(제한사업자번호=None)),
    "번호둘다없음": S(s=dict(제한사업자번호=None, 제한법인번호=None)),
    "빈칸여럿": S(dict(제한끝=None), s=dict(제한주소=None, 제재사유=None)),
    "윤년2월": S(dict(제한시작=D(2028, 2, 1), 제한끝=D(2028, 2, 29), 점검일=D(2028, 2, 29))),
}


def show(exp):
    a, b = exp["셈"], exp["확인서"]
    return f"| {str(a.get('기간'))[:34]} | {str(a.get('상태'))[:30]} | {str(a.get('빈칸'))[:34]} | {b.get('제재기간표시')}"
