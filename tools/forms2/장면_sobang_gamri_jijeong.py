# -*- coding: utf-8 -*-
"""G720 소방공사감리자 지정신고서 장면 — python3 tools/forms2/장면시험.py sobang-gamri-jijeong --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(상주 제1호) · 일반(2만9,999㎡) · 3만 딱 · 아파트 상주(16층 · 500세대) · 아파트 15층 · 499세대 · 아파트 고르기 전 · 월요일 착공(전날 일요일) ·
   일요일 착공(전날 토요일) · 신고일 늦음 · 신고일 없음 · 감리기간 거꾸로 · 빈칸 여럿"""
import copy
import datetime

import f_sobang_gamri_jijeong as m

D = datetime.date
A, NA = m.APT


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
    "일반_29999": S(s=dict(연면적=29999.99)),
    "상주_3만딱": S(s=dict(연면적=30000)),
    "아파트상주": S(dict(아파트=A, 세대수=500), s=dict(지하=2, 지상=14, 연면적=60000)),
    "아파트15층": S(dict(아파트=A, 세대수=800), s=dict(지하=1, 지상=14)),
    "아파트499세대": S(dict(아파트=A, 세대수=499), s=dict(지하=3, 지상=25)),
    "아파트고르기전": S(dict(아파트=None)),
    "월요일착공": S(dict(착공일=D(2027, 3, 8)), s=dict(제출일=D(2027, 3, 5))),
    "일요일착공": S(dict(착공일=D(2027, 3, 7)), s=dict(제출일=D(2027, 3, 5))),
    "신고일늦음": S(s=dict(제출일=D(2027, 3, 2))),
    "신고일없음": S(s=dict(제출일=None)),
    "감리기간거꾸로": S(dict(감리시작=D(2028, 9, 1), 감리끝=D(2027, 3, 2))),
    "빈칸여럿": S(dict(감리시작=None), s=dict(대상소재지=None, 감리등록번호=None, 감리대상시설=None, **{"감리원#1": None})),
}


def show(exp):
    a, b = exp["셈"], exp["신고서"]
    return (f"| {str(a.get('기한'))[-28:]} | {str(a.get('판정'))[:22]} | {a.get('기간')} | {str(a.get('빈칸'))[:40]} "
            f"| {b.get('상주표시')} / {b.get('일반표시')}")
