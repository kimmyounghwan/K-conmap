# -*- coding: utf-8 -*-
"""G719 소방시설 부분완공검사신청서 장면 — python3 tools/forms2/장면시험.py sobang-bubun-wangong --site (TZ=Asia/Seoul 로)
   빈칸 · 감리(예시 · 없음 · 없음+도서 바뀜 · 도서 빈칸 · 고르기 전) · 날짜(착공신고일 없음 · 완공일 없음 · 역순 · 둘 다 없음) ·
   신청일(없음 · 빠름 · 같은 날) · 공사 종류(증설 · 그 밖 · 빈칸) · 신청서 빈칸 여럿 · 신청인(상호만 · 대표자만) · 큰 면적"""
import copy
import datetime

import f_sobang_bubun_wangong as m

D = datetime.date
GY, GN = m.GM


def S(ex=None, s=None):
    """ex = 셈 값 바꿈 · s = 신청서 값 바꿈(EX_S 통째로 — 나머지는 처음 값)"""
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
    "감리_예시": S(),
    "감리없음": S(dict(감리=GN)),
    "감리없음_도서바뀜": S(dict(감리=GN, 도서변경=m.DS[0])),
    "감리없음_도서빈칸": S(dict(감리=GN, 도서변경=None)),
    "감리고르기전": S(dict(감리=None)),
    "착공신고일없음": S(dict(착공신고일=None)),
    "완공일없음": S(dict(완공일=None)),
    "날짜역순": S(dict(착공신고일=D(2027, 10, 10), 완공일=D(2027, 9, 30))),
    "날짜둘다없음": S(dict(착공신고일=None, 완공일=None)),
    "신청일없음": S(s=dict(신청일=None)),
    "신청일빠름": S(s=dict(신청일=D(2027, 9, 20))),
    "완공일신청": S(s=dict(신청일=D(2027, 9, 30))),
    "증설": S(dict(공사종류="증설")),
    "그밖의공사": S(dict(공사종류="그 밖의 공사")),
    "공사종류빈칸": S(dict(공사종류=None)),
    "앞쪽빈칸여럿": S(s=dict(등록번호=None, 대상소재지=None, 부분층동=None, 소방시설종류=None, 기술자성명=None)),
    "신청인_상호만": S(s=dict(대표자=None)),
    "신청인_대표만": S(s=dict(상호=None)),
    "큰면적": S(s=dict(지하=7, 지상=68, 연면적=325410.75, 바닥면적=12540.5, 동수=12)),
}


def show(exp):
    a, b = exp["셈"], exp["신청서"]
    return (f"| {str(a.get('첨부'))[:14]} | {str(a.get('날짜확인'))[:18]} | {str(a.get('신청확인'))[:16]} "
            f"| {str(a.get('빈칸'))[:30]} | {b.get('공사종류표시')[:12]} | {b.get('신청인표시')}")
