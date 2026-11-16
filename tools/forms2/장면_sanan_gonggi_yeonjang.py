# -*- coding: utf-8 -*-
"""G703 공사기간 연장 요청서(산업안전보건법) 장면 — python3 tools/forms2/장면시험.py sanan-gonggi-yeonjang --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(도급인 · 불가항력) · 도급인(발주자 책임 · 도급인 책임 ⚠) · 관계수급인(불가항력 · 도급인 책임 · 발주자 책임 ⚠) · 요청인 · 사유 빈칸 ·
   끝난 날(없음 · 없음 + 이어짐) · 이어짐(예 · 관계수급인 · 빈칸) · 끝난 날이 준공일 뒤(아니요 · 빈칸) · 제출일(당일 · 딱 10일 · 11일 · 토요일 끝 → 월요일 ·
   화요일 · 일요일 끝 → 월요일 · 화요일 · 빠름 · 없음) · 연장 일수(없음 · 소수 · 음수) · 준공일 없음 · 착공일 없음 · 역순 · 사유 기간 역순 · 시작일 없음 ·
   받는 이 빈칸 · 요청서 빈칸 여럿 · 공사금액 글 · 처리(관계수급인 제출일 없음)"""
import copy
import datetime

import f_sanan_gonggi_yeonjang as m

D = datetime.date
DOG, GWAN = m.YC
BUL, BAL, DOGC = m.SY
NO, YES = m.IJ


def S(ex=None, s=None):
    """ex = 셈 값 바꿈 · s = 요청서 값 바꿈(EX_S 통째로 — 나머지는 처음 값)"""
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
    "도급인_발주자책임": S(dict(사유=BAL)),
    "도급인_도급인책임": S(dict(사유=DOGC)),
    "관계수급인_불가항력": S(dict(요청인=GWAN, 받는이="가나건설(주) 대표이사")),
    "관계수급인_도급인책임": S(dict(요청인=GWAN, 사유=DOGC)),
    "관계수급인_발주자책임": S(dict(요청인=GWAN, 사유=BAL)),
    "요청인빈칸": S(dict(요청인=None)),
    "사유빈칸": S(dict(사유=None)),
    "관계수급인_사유빈칸": S(dict(요청인=GWAN, 사유=None)),
    "둘다빈칸": S(dict(요청인=None, 사유=None)),
    "끝난날없음": S(dict(사유끝=None)),
    "끝난날없음_이어짐": S(dict(사유끝=None, 이어짐=YES)),
    "이어짐_예": S(dict(이어짐=YES)),
    "이어짐_관계수급인": S(dict(이어짐=YES, 요청인=GWAN)),
    "이어짐_요청인빈칸_준공없음": S(dict(이어짐=YES, 요청인=None, 준공일=None)),
    "이어짐빈칸": S(dict(이어짐=None)),
    "준공뒤_아니요": S(dict(사유끝=D(2028, 1, 10)), s=dict(제출일=D(2028, 1, 14))),
    "준공뒤_빈칸": S(dict(사유끝=D(2028, 1, 10), 이어짐=None), s=dict(제출일=D(2028, 1, 14))),
    "준공뒤_예": S(dict(사유끝=D(2028, 1, 10), 이어짐=YES), s=dict(제출일=D(2028, 1, 20))),
    "제출_당일": S(s=dict(제출일=D(2027, 8, 8))),
    "제출_딱10일": S(s=dict(제출일=D(2027, 8, 18))),
    "제출_11일": S(s=dict(제출일=D(2027, 8, 19))),
    "토요일끝_월요일": S(dict(사유끝=D(2027, 8, 11)), s=dict(제출일=D(2027, 8, 23))),
    "토요일끝_일요일": S(dict(사유끝=D(2027, 8, 11)), s=dict(제출일=D(2027, 8, 22))),
    "토요일끝_화요일": S(dict(사유끝=D(2027, 8, 11)), s=dict(제출일=D(2027, 8, 24))),
    "일요일끝_월요일": S(dict(사유끝=D(2027, 8, 12)), s=dict(제출일=D(2027, 8, 23))),
    "일요일끝_화요일": S(dict(사유끝=D(2027, 8, 12)), s=dict(제출일=D(2027, 8, 24))),
    "제출_빠름": S(s=dict(제출일=D(2027, 8, 1))),
    "제출일없음": S(s=dict(제출일=None)),
    "제출일없음_관계수급인": S(dict(요청인=GWAN), s=dict(제출일=None)),
    "연장없음": S(dict(연장일수=None)),
    "연장_소수": S(dict(연장일수=10.7)),
    "연장_음수": S(dict(연장일수=-5)),
    "준공없음": S(dict(준공일=None)),
    "착공없음": S(dict(착공일=None)),
    "준공_착공역순": S(dict(착공일=D(2028, 3, 1))),
    "착공준공없음": S(dict(착공일=None, 준공일=None)),
    "사유기간역순": S(dict(사유시작=D(2027, 8, 20))),
    "사유시작없음": S(dict(사유시작=None)),
    "받는이빈칸": S(dict(받는이=None)),
    "요청서빈칸여럿": S(s=dict(업체명=None, 공사명=None, 대표자=None, 연장사유=None, 전화번호=None)),
    "공사금액글": S(s=dict(계약금액="84억 5천만원")),
    "긴받는이": S(dict(받는이="가나시 다라구 도시개발공사 건설사업본부장")),
}


def show(exp):
    a, b = exp["셈"], exp["요청서"]
    return (f"| {str(a.get('판정'))[:14]} | {str(a.get('기한'))[:20]} | {str(a.get('제출확인'))[:16]} | {str(a.get('통지'))[:14]} "
            f"| {str(a.get('연장확인'))[:18]} | {str(b.get('변경기간표시'))[:24]}")
