# -*- coding: utf-8 -*-
"""G714 기술지도계약서 장면 — python3 tools/forms2/장면시험.py gisul-jido-gyeyakseo --site (TZ=Asia/Seoul 로)
   빈칸 · 예시 · 토목 149억 · 그 밖 120억(딱 — 대상 아님) · 그 밖 119억 · 딱 1억 · 1억 미만 · 건축허가만 · 둘 다 · 제외(계획서 제출) · 제외(섬) ·
   기한 토요일 · 일요일 · 계약일 늦음 · 착공일 없음 · 횟수 없음 · 빈칸 여럿"""
import copy
import datetime

import f_gisul_jido_gyeyakseo as m

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
NO = m.YN[1]

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "예시": S(),
    "토목149억": S(dict(공종=m.GJ[0], 건축허가=NO), s={"계약금액": 14900000000}),
    "그밖120억딱": S(dict(건축허가=NO), s={"계약금액": 12000000000}),
    "그밖119억": S(dict(건축허가=NO), s={"계약금액": 11900000000}),
    "딱1억": S(dict(건축허가=NO), s={"계약금액": 100000000}),
    "1억미만": S(dict(건축허가=NO), s={"계약금액": 99999999}),
    "건축허가만": S(dict(공종=None), s={"계약금액": None}),
    "둘다_150억넘음": S(dict(공종=m.GJ[0]), s={"계약금액": 16000000000}),
    "제외_계획서": S(dict(제외=m.JW[4])),
    "제외_섬": S(dict(제외=m.JW[2])),
    "기한_토요일": S(dict(착공일=D(2027, 3, 7)), s={"작성일": D(2027, 3, 2)}),
    "기한_일요일": S(dict(착공일=D(2027, 3, 8)), s={"작성일": D(2027, 3, 2)}),
    "계약일늦음": S(s={"작성일": D(2027, 3, 5)}),
    "착공일없음": S(dict(착공일=None)),
    "횟수없음": S(dict(횟수=None)),
    "빈칸여럿": S(dict(유형=None, 계약끝=None), s={"대가": None, "기관명칭": None}),
}


def show(exp):
    a = exp["셈"]
    return f"| {str(a.get('판정'))[:44]} | {str(a.get('기한'))[:40]} | {str(a.get('빈칸'))[:24]}"
