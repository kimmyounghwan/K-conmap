# -*- coding: utf-8 -*-
"""G709 작업중지명령 해제신청서 장면 — python3 tools/forms2/장면시험.py jakeop-jungji-haeje --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(일부 · 의견 들음) · 전부 · 의견 안 들음 · 의견 안 고름 · 신청일 없음(범위 있음 · 없음) · 금요일 신청(→ 화요일) · 토요일 신청 · 달 끝 · 해 끝 · 빈칸 여럿"""
import copy
import datetime

import f_jakeop_jungji_haeje as m

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
    "전부": S(dict(범위="전부")),
    "의견안들음": S(dict(의견="아니오")),
    "의견안고름": S(dict(의견=None)),
    "신청일없음": S(s=dict(제출일=None)),
    "신청일없음_범위없음": S(dict(범위=None), s=dict(제출일=None)),
    "금요일신청": S(s=dict(제출일=D(2027, 3, 12))),
    "토요일신청": S(s=dict(제출일=D(2027, 3, 13))),
    "달끝": S(s=dict(제출일=D(2027, 2, 26))),
    "해끝": S(s=dict(제출일=D(2027, 12, 30))),
    "빈칸여럿": S(dict(범위=None), s=dict(개선사항=None, **{"성명#1": None, "성명#2": None, "성명#3": None})),
}


def show(exp):
    a = exp["셈"]
    return f"| {str(a.get('기한'))[:44]} | {str(a.get('의견확인'))[:14]} | {str(a.get('빈칸'))[:30]}"
