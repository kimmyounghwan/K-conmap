# -*- coding: utf-8 -*-
"""G700 소방시설공사 완공검사신청서 장면 — python3 tools/forms2/장면시험.py sobang-wangong-singcheong --site (TZ=Asia/Seoul 로)
   빈칸 · 감리(예시 · 없음 · 없음+도서 바뀜 · 도서 빈칸) · 현장확인(제1호 · 넷 다 · 아님 · 1만㎡ 딱 · 9,999.99㎡ · 11층 · 10층 · 아파트 · 아파트 빈칸 · 덜 고름 ·
   다 빈칸 · 가스탱크) · 날짜(착공신고일 없음 · 완공일 없음 · 역순 · 둘 다 없음) · 신청일(없음 · 빠름 · 같은 날) · 공사 종류(증설 · 그 밖 · 빈칸) ·
   신청서 빈칸 여럿 · 신청인(상호만 · 대표자만)"""
import copy
import datetime

import f_sobang_wangong_singcheong as m

D = datetime.date
GY, GN = m.GM
Y, N = m.YN


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
NO4 = dict(현장용도=N, 현장설비=m.SP[1], 아파트=m.APT[1], 가스탱크=N)

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "감리_예시": S(),
    "감리없음": S(dict(감리=GN)),
    "감리없음_도서바뀜": S(dict(감리=GN, 도서변경=m.DS[0])),
    "감리없음_도서빈칸": S(dict(감리=GN, 도서변경=None)),
    "감리고르기전": S(dict(감리=None)),
    "현장_용도": S(dict(NO4, 현장용도=Y)),
    "현장_넷다": S(dict(현장용도=Y, 현장설비=m.SP[0], 아파트=m.APT[1], 가스탱크=Y), s=dict(연면적=12000.0, 지상=15)),
    "현장_아님": S(NO4),
    "현장_1만딱": S(NO4, s=dict(연면적=10000.0)),
    "현장_9999": S(NO4, s=dict(연면적=9999.99)),
    "현장_11층": S(NO4, s=dict(지상=11)),
    "현장_10층": S(NO4, s=dict(지상=10)),
    "현장_아파트": S(dict(NO4, 아파트=m.APT[0]), s=dict(연면적=30000.0, 지상=25)),
    "현장_아파트빈칸": S(dict(NO4, 아파트=None), s=dict(연면적=20000.0)),
    "현장_덜고름": S(dict(현장용도=None, 현장설비=m.SP[1], 아파트=None, 가스탱크=None)),
    "현장_다빈칸": S(dict(현장용도=None, 현장설비=None, 아파트=None, 가스탱크=None)),
    "현장_가스탱크": S(dict(NO4, 가스탱크=Y)),
    "착공신고일없음": S(dict(착공신고일=None)),
    "완공일없음": S(dict(완공일=None)),
    "날짜역순": S(dict(착공신고일=D(2027, 5, 10), 완공일=D(2027, 4, 30))),
    "날짜둘다없음": S(dict(착공신고일=None, 완공일=None)),
    "신청일없음": S(s=dict(신청일=None)),
    "신청일빠름": S(s=dict(신청일=D(2027, 4, 20))),
    "완공일신청": S(s=dict(신청일=D(2027, 4, 30))),
    "증설": S(dict(공사종류="증설")),
    "그밖의공사": S(dict(공사종류="그 밖의 공사")),
    "공사종류빈칸": S(dict(공사종류=None)),
    "앞쪽빈칸여럿": S(s=dict(상호=None, 등록번호=None, 장소명칭=None, 소방시설종류=None, 기술자성명=None)),
    "신청인_상호만": S(s=dict(대표자=None)),
    "신청인_대표만": S(s=dict(상호=None)),
}


def show(exp):
    a, b = exp["셈"], exp["신청서"]
    return (f"| {str(a.get('판정'))[:10]} | {str(a.get('현장확인'))[:22]} | {str(a.get('날짜확인'))[:16]} | {str(a.get('신청확인'))[:14]} "
            f"| {str(a.get('첨부'))[:12]} | {str(a.get('빈칸'))[:16]} | {b.get('공사종류표시')[:10]}")
