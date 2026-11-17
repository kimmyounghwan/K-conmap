# -*- coding: utf-8 -*-
"""G739 착공연기신청서 장면 — python3 tools/forms2/장면시험.py chakgong-yeongi-sincheong --site (TZ=Asia/Seoul 로 — 사이트 TODAY 는 한국 날짜)
   빈칸 · 허가신고만 · 신고 1년 · 공장 3년 · 신고면 공장 안 봄 · 허가일 빠짐 · 착공 빠짐 · 기한 안 · 기한 날과 같음 · 한도 날과 같음 · 1년 넘음 ·
   기한 지남(허가 · 신고) · 기한이 오늘 · 기한이 어제 · 윤년(2024-02-28 공장 → 2027-02-28 · 2028-02-29 끝) · 2월 29일 허가 · 사유 빈칸 · 신청서 빈칸 여럿"""
import copy
import datetime

import f_chakgong_yeongi_sincheong as m

D = datetime.date
TODAY = datetime.date.today()
HS = m.HS


def S(ex=None, s=None):
    """ex = 셈 값 바꿈 · s = 신청서 값 바꿈(EX_S 통째로 — 나머지는 처음 값)"""
    out = {"EX": dict(ex or {})}
    if s is not None:
        es = copy.deepcopy(m.EX_S)
        es.update(s)
        out["EX_S"] = es
    return out


def _d_for_due(due, months):
    """기한 끝날이 due 가 되는 허가(신고)일 — 민법 셈(m._end)으로 찾음"""
    d = due - datetime.timedelta(days=months * 31 + 5)
    while d < due:
        if m._end(d, months) == due:
            return d
        d += datetime.timedelta(days=1)
    raise ValueError(due)


BLANK = {k: None for k in m.EX}
BLANK_S = {k: None for k in m.EX_S}

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "허가신고만": S(dict(BLANK, 허가신고=HS[0]), BLANK_S),
    "예시그대로": S(),
    "신고_1년": S(dict(허가신고=HS[1], 허가일=D(2026, 3, 5), 착공예정=D(2027, 5, 1))),
    "공장_3년": S(dict(공장="예", 허가일=D(2024, 5, 20), 착공예정=D(2027, 8, 1))),
    "신고면_공장안봄": S(dict(허가신고=HS[1], 공장="예", 허가일=D(2026, 3, 5), 착공예정=D(2027, 3, 5))),
    "허가일빠짐": S(dict(허가일=None)),
    "착공빠짐": S(dict(착공예정=None)),
    "기한안": S(dict(착공예정=D(2027, 3, 1))),
    "기한날같음": S(dict(착공예정=D(2027, 3, 10))),
    "한도날같음": S(dict(착공예정=D(2028, 3, 10))),
    "1년넘음": S(dict(착공예정=D(2028, 3, 11))),
    "기한지남_허가": S(dict(허가일=D(2024, 3, 1), 착공예정=D(2026, 12, 1))),
    "기한지남_신고": S(dict(허가신고=HS[1], 허가일=D(2025, 6, 30), 착공예정=D(2027, 1, 4))),
    "기한오늘": S(dict(허가일=_d_for_due(TODAY, 24))),
    "기한어제": S(dict(허가일=_d_for_due(TODAY - datetime.timedelta(days=1), 24))),
    "윤년_공장_끝": S(dict(공장="예", 허가일=D(2024, 2, 28), 착공예정=D(2028, 2, 29))),
    "윤년_공장_넘음": S(dict(공장="예", 허가일=D(2024, 2, 28), 착공예정=D(2028, 3, 1))),
    "2월29일_허가": S(dict(공장="예", 허가일=D(2024, 2, 29), 착공예정=D(2027, 2, 28))),
    "사유빈칸": S(s=dict(연기사유=None)),
    "신청서빈칸여럿": S(s=dict(건축주=None, 대지위치=None, 허가번호=None, 신청일=None, 수신=None)),
}


def show(exp):
    a, b = exp["셈"], exp["신청서"]
    return (f"| {str(a.get('기한'))[:16]} | {str(a.get('한도'))[:14]} | {str(a.get('확인'))[:14]} | {str(a.get('오늘'))[:22]} "
            f"| {str(a.get('사유'))[:10]} | {b.get('허가일표시')} | {b.get('착공표시')}")
