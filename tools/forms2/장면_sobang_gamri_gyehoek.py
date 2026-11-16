# -*- coding: utf-8 -*-
"""G721 소방공사 감리계획서 장면 — python3 tools/forms2/장면시험.py sobang-gamri-gyehoek --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(상주) · 일반 · 아파트 상주 · 아파트 고르기 전 · 머리 날짜 없음 · 머리 3칸만 · 같은 칸 시작·끝 · 끝<시작 · 한쪽만 · 기간 거꾸로 · 빈칸 여럿"""
import copy
import datetime

import f_sobang_gamri_gyehoek as m

D = datetime.date
A, NA = m.APT
K = {nm: k for k, nm in enumerate(m.FAC, 1)}


def S(ex=None, s=None):
    out = {"EX": dict(ex or {})}
    if s is not None:
        es = copy.deepcopy(m.EX_S)
        es.update(s)
        out["EX_S"] = es
    return out


BLANK = {k: None for k in m.EX}
BLANK_S = {k: None for k in m.EX_S}
NOHD = {f"일정#{c}": None for c in range(1, 8)}
HD3 = dict(NOHD, **{"일정#1": D(2027, 3, 1), "일정#2": D(2027, 5, 1), "일정#3": D(2027, 7, 1)})

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "예시": S(),
    "일반_29999": S(s=dict(연면적=29999.99)),
    "아파트상주": S(dict(아파트=A, 세대수=500), s=dict(지하=2, 지상=14)),
    "아파트15층": S(dict(아파트=A, 세대수=900), s=dict(지하=1, 지상=14)),
    "아파트고르기전": S(dict(아파트=None)),
    "머리날짜없음": S(s=NOHD),
    "머리3칸": S(s=HD3),
    "같은칸시작끝": S({f"시작#{K['소화기구']}": D(2027, 8, 2), f"끝#{K['소화기구']}": D(2027, 8, 9)}),
    "끝이앞섬": S({f"시작#{K['유도등']}": D(2027, 8, 20), f"끝#{K['유도등']}": D(2027, 7, 1)}),
    "한쪽만": S({f"시작#{K['피난기구']}": D(2027, 6, 1), f"끝#{K['연결살수설비']}": D(2027, 7, 1)}),
    "기간거꾸로": S(dict(착공일=D(2027, 10, 1), 감리끝=D(2027, 2, 1))),
    "빈칸여럿": S(dict(착공일=None), s={"대상소재지": None, "상호": None, "상주성명#1": None}),
}


def show(exp):
    a, o3 = exp["셈"], exp["3쪽"]
    row = [o3.get(f"공정#{K['스프링클러설비등']}#{c}") for c in range(1, 8)]
    return f"| {str(a.get('판정'))[:16]} | {a.get('공사일수')} | {str(a.get('일정점검'))[:34]} | {str(a.get('빈칸'))[:30]} | {' '.join(row)}"
