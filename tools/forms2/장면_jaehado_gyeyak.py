# -*- coding: utf-8 -*-
"""G726 건설공사의 재하도급 계약통보서 장면 — python3 tools/forms2/장면시험.py jaehado-gyeyak --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(87.79%) · B>A · 소수 비율 · A=B · 기간 거꾸로 · 하루 공사 · 기한 토 · 일요일 · 통보 늦음 · 기한 날 통보 · 통보일 없음 · 계약일 없음 ·
   보험 일부만 · 부동소수 요율 · 부담방법 바꿈 · 빈칸 여럿"""
import copy
import datetime

import f_jaehado_gyeyak as m

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
    "B가큼": S(dict(하도급액=100000000, 재하도급액=150000000)),
    "소수비율": S(dict(하도급액=270000000, 재하도급액=236111111)),
    "A와B같음": S(dict(하도급액=230000000, 재하도급액=230000000)),
    "기간거꾸로": S(dict(재착공=D(2027, 9, 30), 재준공=D(2027, 6, 1))),
    "하루공사": S(dict(재착공=D(2027, 6, 1), 재준공=D(2027, 6, 1))),
    "기한토요일": S(dict(계약일=D(2027, 5, 20)), s=dict(제출일=D(2027, 6, 1))),
    "기한일요일": S(dict(계약일=D(2027, 5, 21)), s=dict(제출일=D(2027, 6, 1))),
    "통보늦음": S(s=dict(제출일=D(2027, 6, 17))),
    "기한날통보": S(s=dict(제출일=D(2027, 6, 16))),
    "통보일없음": S(s=dict(제출일=None)),
    "계약일없음": S(dict(계약일=None)),
    "보험일부": S({"노무비#3": None, "요율#5": None, "부담#1": None}),
    "부동소수": S({"노무비#2": 100000000, "요율#2": 0.0356, "노무비#4": 70000000, "요율#4": 0.03595, "노무비#1": 12345679}),
    "부담바꿈": S({"부담#1": "개별", "부담#2": "개별", "부담#6": "일괄"}),
    "빈칸여럿": S(dict(재하도급액=None, 재준공=None), s=dict(재하도급사유=None, 공종=None, 재하도급내용=None)),
}


def show(exp):
    a, b = exp["셈"], exp["통보서"]
    return (f"| {str(a.get('비율'))[:24]} | {str(a.get('기간'))[:22]} | {a.get('반영합')} | {str(a.get('기한'))[-30:]} | "
            f"{str(a.get('빈칸'))[:30]} | {b.get('부담일괄#1')}/{b.get('부담개별#1')}")
