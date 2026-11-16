# -*- coding: utf-8 -*-
"""G728 타워크레인 대여계약 통보서 장면 — python3 tools/forms2/장면시험.py tower-daeyeo-tongbo --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(85% · 예정가격 79.33%) · 딱 82% · 82% 바로 아래 · 82.14% · 예정가격 64% 미달 · 예정가격 없음 · B>A · 기한 토 · 일요일 ·
   통보 늦음 · 기한 날 통보 · 통보일 없음 · 계약일 없음 · 도급액 없음 · 빈칸 여럿"""
import copy
import datetime

import f_tower_daeyeo_tongbo as m

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
    "딱82": S(dict(부분금액=100000000, 대여금액=82000000)),
    "82바로아래": S(dict(부분금액=100000000, 대여금액=81999999)),
    "82넘음소수": S(dict(부분금액=420000000, 대여금액=344999999)),
    "예정64미달": S(dict(예정가격=600000000)),
    "예정없음": S(dict(예정가격=None)),
    "B가큼": S(dict(부분금액=100000000, 대여금액=150000000)),
    "기한토요일": S(dict(대여계약일=D(2027, 4, 15)), s=dict(제출일=D(2027, 4, 20))),
    "기한일요일": S(dict(대여계약일=D(2027, 4, 16)), s=dict(제출일=D(2027, 4, 20))),
    "통보늦음": S(s=dict(제출일=D(2027, 5, 13))),
    "기한날통보": S(s=dict(제출일=D(2027, 5, 12))),
    "통보일없음": S(s=dict(제출일=None)),
    "계약일없음": S(dict(대여계약일=None)),
    "도급액없음": S(dict(계약금액=None)),
    "빈칸여럿": S(dict(대여금액=None), s=dict(임대사업자번호=None, 임차업종=None)),
}


def show(exp):
    a, b = exp["셈"], exp["통보서"]
    return (f"| {str(a.get('대여율'))[:20]} | {str(a.get('예정대비'))[:20]} | {str(a.get('기한'))[-30:]} | {str(a.get('빈칸'))[:30]} | "
            f"{b.get('대여율표시')}")
