# -*- coding: utf-8 -*-
"""G713 공사 개요서 장면 — python3 tools/forms2/장면시험.py gongsa-gaeyoseo --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(높이 38.2 · 굴착 11.5) · 높이만 넘음 · 굴착만 넘음 · 둘 다 아래 · 딱 31 · 딱 10 · 특수구조물이 가장 깊음 · 기한 토요일 · 일요일 ·
   준공일이 앞섬 · 착공일만 · 준공일만 · 해 넘김 · 빈칸 여럿"""
import copy
import datetime

import f_gongsa_gaeyoseo as m

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
    "높이만넘음": S(s={"깊이#1": 8, "특수깊이#1": 8}),
    "굴착만넘음": S(s={"높이#1": 24.6}),
    "둘다아래": S(s={"높이#1": 24.6, "깊이#1": 7.5, "특수깊이#1": 7.5}),
    "딱31_딱10": S(s={"높이#1": 31, "깊이#1": 10, "특수깊이#1": 9.5}),
    "특수가장깊음": S(s={"깊이#1": 9, "특수깊이#1": 12.25, "특수높이#2": 33.5}),
    "기한_토요일": S(dict(착공일=D(2027, 3, 7))),
    "기한_일요일": S(dict(착공일=D(2027, 3, 8))),
    "준공일앞섬": S(dict(준공일=D(2027, 1, 31))),
    "착공일만": S(dict(준공일=None)),
    "준공일만": S(dict(착공일=None)),
    "해넘김": S(dict(착공일=D(2028, 1, 1), 준공일=D(2029, 6, 30))),
    "빈칸여럿": S(dict(준공일=None), s={"본사소재지": None, "계약금액": None, "주요공법": None}),
}


def show(exp):
    a = exp["셈"]
    return f"| {str(a.get('기한'))[:40]} | {str(a.get('판정'))[:60]} | {str(a.get('빈칸'))[:24]}"
