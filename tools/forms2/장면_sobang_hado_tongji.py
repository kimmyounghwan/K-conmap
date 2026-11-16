# -*- coding: utf-8 -*-
"""G723 소방시설공사등의 하도급통지서 장면 — python3 tools/forms2/장면시험.py sobang-hado-tongji --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(시공) · 설계 · 감리 · 방염 · 구분 빈칸 · 통지일 늦음 · 통지일 = 착수일 · 통지일 없음 · 착수일 없음 · 통보인(상호만 · 대표만) · 빈칸 여럿"""
import copy
import datetime

import f_sobang_hado_tongji as m

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
    "설계": S(dict(구분="설계")),
    "감리": S(dict(구분="감리")),
    "방염": S(dict(구분="방염")),
    "구분빈칸": S(dict(구분=None)),
    "통지일늦음": S(s=dict(제출일=D(2027, 5, 10))),
    "통지일같은날": S(s=dict(제출일=D(2027, 5, 3))),
    "통지일없음": S(s=dict(제출일=None)),
    "착수일없음": S(dict(착수일=None)),
    "통보인_상호만": S(s=dict(대표자=None)),
    "통보인_대표만": S(s=dict(상호=None)),
    "빈칸여럿": S(s=dict(하도등록번호=None, 하도내용=None, 기술자성명=None)),
}


def show(exp):
    a, b = exp["셈"], exp["통지서"]
    return f"| {str(a.get('판정'))[:14]} | {str(a.get('시기'))[-22:]} | {str(a.get('빈칸'))[:40]} | {b.get('통보인표시')}"
