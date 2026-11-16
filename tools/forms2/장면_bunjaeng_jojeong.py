# -*- coding: utf-8 -*-
"""G729 건설분쟁조정신청서 장면 — python3 tools/forms2/장면시험.py bunjaeng-jojeong --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(2호 · 신청일 2027. 5. 3. · 조정안 7. 1.) · 분쟁 종류 1호 · 3호(하도급법 제외) · 6호 하자 · 6호 손해배상 · 종류 없음 ·
   위원회 접수일 따로 · 신청일 없음 · 둘 다 없음 · 연말 넘김 · 윤년 · 수락 기한 토 · 일요일 · 조정안 없음 · 상호만 · 대표자만 · 빈칸 여럿"""
import copy
import datetime

import f_bunjaeng_jojeong as m

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
    "종류1호": S(dict(분쟁종류=m.KINDS[0])),
    "종류3호": S(dict(분쟁종류=m.KINDS[2])),
    "종류6호하자": S(dict(분쟁종류=m.KINDS[7])),
    "종류6호손해": S(dict(분쟁종류=m.KINDS[8])),
    "종류없음": S(dict(분쟁종류=None)),
    "접수일따로": S(dict(접수일=D(2027, 5, 10))),
    "신청일없음": S(s=dict(신청일=None)),
    "둘다없음": S(dict(접수일=None), s=dict(신청일=None)),
    "연말넘김": S(s=dict(신청일=D(2027, 12, 1))),
    "윤년": S(dict(접수일=D(2028, 1, 15))),
    "수락토요일": S(dict(조정안일=D(2027, 7, 2))),
    "수락일요일": S(dict(조정안일=D(2027, 7, 3))),
    "조정안없음": S(dict(조정안일=None)),
    "상호만": S(s=dict(대표자=None)),
    "대표자만": S(s=dict(상호=None)),
    "빈칸여럿": S(s=dict(생년월일=None, 피소재지=None, 분쟁개요=None)),
}


def show(exp):
    a, b = exp["셈"], exp["신청서"]
    return (f"| {str(a.get('대상'))[:18]} | {str(a.get('처리기한'))[-34:]} | {str(a.get('수락기한'))[-30:]} | {str(a.get('빈칸'))[:26]} | "
            f"{b.get('신청인표시')}")
