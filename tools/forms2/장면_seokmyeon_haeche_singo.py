# -*- coding: utf-8 -*-
"""G712 석면해체ㆍ제거작업 신고서 장면 — python3 tools/forms2/장면시험.py seokmyeon-haeche-singo --site (TZ=Asia/Seoul 로)
   빈칸 · 예시 · 설비 + 학교 · 정비사업 · 스스로(서류 4) · 기한 토요일 · 일요일 · 신고일 늦음 · 딱 기한 · 끝날이 앞섬 · 시작일만 · 끝날만 ·
   근로자 7명(다 참) · 근로자 없음 · 달 넘김 · 해 넘김 · 빈칸 여럿"""
import copy
import datetime

import f_seokmyeon_haeche_singo as m

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
W7 = {}
for _i in range(1, 8):
    W7.update({f"성명#{_i}": f"근로자{_i}", f"생년월일#{_i}": "1980. 1. 1.", f"주소#{_i}": "가나시 다라구", f"전화#{_i}": "010-0000-0000"})
W0 = {}
for _i in range(1, 5):
    W0.update({f"성명#{_i}": None, f"생년월일#{_i}": None, f"주소#{_i}": None, f"전화#{_i}": None})

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "예시": S(),
    "설비_학교": S(dict(대상=m.DS[1], 종류=m.DK[0])),
    "정비사업": S(dict(종류=m.DK[1])),
    "스스로": S(dict(주체=m.JC[1])),
    "기한_토요일": S(dict(시작일=D(2027, 3, 13))),
    "기한_일요일": S(dict(시작일=D(2027, 3, 14))),
    "신고일늦음": S(s=dict(제출일=D(2027, 3, 10))),
    "딱기한": S(s=dict(제출일=D(2027, 3, 8))),
    "끝날앞섬": S(dict(끝날=D(2027, 3, 1))),
    "시작일만": S(dict(끝날=None)),
    "끝날만": S(dict(시작일=None)),
    "근로자7": S(s=W7),
    "근로자없음": S(s=W0),
    "달넘김": S(dict(시작일=D(2027, 3, 3), 끝날=D(2027, 3, 20)), s=dict(제출일=D(2027, 2, 20))),
    "해넘김": S(dict(시작일=D(2028, 1, 5), 끝날=D(2028, 1, 31)), s=dict(제출일=D(2027, 12, 30))),
    "빈칸여럿": S(dict(대상=None), s=dict(노동부등록=None, 해체사유=None, 책임자성명=None)),
}


def show(exp):
    a = exp["셈"]
    return f"| {str(a.get('기한'))[:60]} | {str(a.get('근로자'))[:20]} | {str(a.get('빈칸'))[:24]}"
