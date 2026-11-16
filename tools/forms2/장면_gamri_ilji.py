# -*- coding: utf-8 -*-
"""G701 공사감리일지 장면 — python3 tools/forms2/장면시험.py gamri-ilji --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(시정 요청 · 따름) · 지적 없음 · 공사중지 요청 · 따르지 않음(기한 남음 · 지남 · 토요일 끝) · 확인 전 · 이행 빈칸 · 시정 기간 끝날 없음 ·
   배치현황(없음 · 빈칸 · 대소문자 아닌 한글 · 감리원 빈칸) · 날짜(없음 · 요일 일곱) · 일지 빈칸 여럿 · 작업사항 없음"""
import copy
import datetime

import f_gamri_ilji as m

D = datetime.date
TODAY = datetime.date.today()


def S(ex=None, s=None, w=None):
    """ex = 셈 값 바꿈 · s = 일지 값 바꿈(EX_S 통째로) · w = 작업사항 줄(EX_W)"""
    out = {"EX": dict(ex or {})}
    if s is not None:
        es = copy.deepcopy(m.EX_S)
        es.update(s)
        out["EX_S"] = es
    if w is not None:
        out["EX_W"] = w
    return out


BLANK = {k: None for k in m.EX}
BLANK_S = {k: None for k in m.EX_S}

SCENES = {
    "빈칸": S(BLANK, BLANK_S, []),
    "예시": S(),
    "지적없음": S(dict(지적=m.JG[0], 시정기한=None, 이행=None)),
    "공사중지요청": S(dict(지적=m.JG[2], 이행=m.IH[2])),
    "따르지않음_남음": S(dict(이행=m.IH[1], 시정기한=TODAY + datetime.timedelta(days=3))),
    "따르지않음_지남": S(dict(이행=m.IH[1], 시정기한=D(2026, 10, 1))),
    "따르지않음_오늘끝": S(dict(이행=m.IH[1], 시정기한=TODAY - datetime.timedelta(days=7))),
    "따르지않음_토요일": S(dict(이행=m.IH[1], 시정기한=D(2027, 3, 13))),
    "확인전": S(dict(이행=m.IH[2])),
    "이행빈칸": S(dict(이행=None)),
    "기한없음_따르지않음": S(dict(이행=m.IH[1], 시정기한=None)),
    "기한없음_따름": S(dict(이행=m.IH[0], 시정기한=None)),
    "지적빈칸": S(dict(지적=None)),
    "배치현황없음": S(dict(배치현황="박서연, 김하늘")),
    "배치현황빈칸": S(dict(배치현황=None)),
    "감리원빈칸": S(s=dict(감리원=None)),
    "날짜없음": S(s=dict(일자=None)),
    "일요일": S(s=dict(일자=D(2027, 3, 14))),
    "월요일": S(s=dict(일자=D(2027, 3, 15))),
    "화요일": S(s=dict(일자=D(2027, 3, 16))),
    "목요일": S(s=dict(일자=D(2027, 3, 11))),
    "금요일": S(s=dict(일자=D(2027, 3, 12))),
    "토요일": S(s=dict(일자=D(2027, 3, 13))),
    "일지빈칸여럿": S(s=dict(일련번호=None, 공사감리자=None, 날씨=None)),
    "작업사항없음": S(w=[]),
    "작업사항여덟": S(w=[("공종" + str(i), "착안" + str(i), "내용" + str(i)) for i in range(1, 9)]),
}


def show(exp):
    a, b = exp["셈"], exp["감리일지"]
    return (f"| {str(a.get('판정'))[:12]} | {str(a.get('보고기한'))[:26]} | {str(a.get('배치확인'))[:14]} | {str(a.get('빈칸'))[:16]} "
            f"| {b.get('요일표시')}")
