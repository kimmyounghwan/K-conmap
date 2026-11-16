# -*- coding: utf-8 -*-
"""G722 소방공사감리원 배치통보서 장면 — python3 tools/forms2/장면시험.py sobang-gamri-baechi --site (TZ=Asia/Seoul 로)
   빈칸 · 예시 · 기한 토요일 · 기한 일요일 · 통보일 늦음 · 통보일 = 기한 · 통보일 없음 · 배치일 없음 · 감리기간 거꾸로 · 빈칸 여럿"""
import copy
import datetime

import f_sobang_gamri_baechi as m

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
    "기한토요일": S(dict(배치일=D(2027, 3, 6))),
    "기한일요일": S(dict(배치일=D(2027, 3, 7)), s=dict(제출일=D(2027, 3, 12))),
    "통보일늦음": S(s=dict(제출일=D(2027, 3, 10))),
    "통보일기한날": S(s=dict(제출일=D(2027, 3, 9))),
    "통보일없음": S(s=dict(제출일=None)),
    "배치일없음": S(dict(배치일=None)),
    "감리기간거꾸로": S(dict(감리시작=D(2028, 9, 1), 감리끝=D(2027, 3, 2))),
    "빈칸여럿": S(dict(감리끝=None), s={"대상소재지": None, "감리원분야#1": None, "감리업자": None}),
}


def show(exp):
    a, b = exp["셈"], exp["통보서"]
    return f"| {str(a.get('기한'))[-34:]} | {a.get('기간')} | {str(a.get('빈칸'))[:40]} | {b.get('감리기간')}"
