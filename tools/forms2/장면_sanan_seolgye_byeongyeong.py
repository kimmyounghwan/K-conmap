# -*- coding: utf-8 -*-
"""G704 건설공사 설계변경 요청서(산업안전보건법) 장면 — python3 tools/forms2/장면시험.py sanan-seolgye-byeongyeong --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(도급인 · 흙막이 지보공 · 토질및기초기술사) · 구분(명령 · 명령 + 전문가 없음 · 관계수급인 · 빈칸) · 설계 포함 발주(제1항 ⚠ · 관계수급인) ·
   가설구조물(비계 31 · 30.9 · 높이 없음 · 일체형 거푸집 · 동바리 5 · 4.99 · 터널 · 흙막이 2 · 1.5 · 동력 · 그 밖 · 빈칸) ·
   전문가(공단 · 건축구조 건축 · 토목 · 흙막이 · 토목구조 토목 · 건축 · 토질 흙막이 · 비계 · 건설기계 동력 · 비계 · 고용됨 · 공사 종류 빈칸 · 가설구조물 빈칸) ·
   받는 이 · 착공일 · 공사기간 빈칸 · 요청서 빈칸 여럿 · 공사금액 글 · 제출일 없음(도급인 · 관계수급인)"""
import copy
import datetime

import f_sanan_seolgye_byeongyeong as m

D = datetime.date
G1, G2, G3 = m.GB
NO_, YES_ = m.SP
BI, IL, DB, TN, HM, DR, ETC = m.GS
GJ_A, GJ_T = m.GJ
GD, GG, TG, TJ, GK = m.JM
NOT_E, EMP = m.GY


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
    "명령": S(dict(구분=G2)),
    "명령_전문가없음": S(dict(구분=G2, 전문가=None, 고용=None, 가설구조물=None, 높이=None), s=dict(검토자=None, 검토소속=None, 검토전화=None)),
    "관계수급인": S(dict(구분=G3, 받는이="가나건설(주) 대표이사")),
    "관계수급인_제출없음": S(dict(구분=G3), s=dict(제출일=None)),
    "도급인_제출없음": S(s=dict(제출일=None)),
    "구분빈칸": S(dict(구분=None)),
    "설계포함_제1항": S(dict(설계포함=YES_)),
    "설계포함_관계수급인": S(dict(설계포함=YES_, 구분=G3)),
    "설계포함_명령": S(dict(설계포함=YES_, 구분=G2)),
    "비계_31": S(dict(가설구조물=BI, 높이=31, 전문가=GG)),
    "비계_30.9": S(dict(가설구조물=BI, 높이=30.9, 전문가=GG)),
    "비계_높이없음": S(dict(가설구조물=BI, 높이=None, 전문가=GG)),
    "일체형거푸집": S(dict(가설구조물=IL, 높이=None, 전문가=GG)),
    "동바리_5": S(dict(가설구조물=DB, 높이=5, 전문가=GG)),
    "동바리_4.99": S(dict(가설구조물=DB, 높이=4.99, 전문가=GG)),
    "터널": S(dict(가설구조물=TN, 높이=None, 공사종류=GJ_T)),
    "흙막이_2": S(dict(가설구조물=HM, 높이=2)),
    "흙막이_1.5": S(dict(가설구조물=HM, 높이=1.5)),
    "동력": S(dict(가설구조물=DR, 높이=None, 전문가=GK)),
    "그밖": S(dict(가설구조물=ETC, 높이=None, 전문가=GD)),
    "가설구조물빈칸": S(dict(가설구조물=None, 높이=None)),
    "공단": S(dict(전문가=GD)),
    "건축구조_건축비계": S(dict(전문가=GG, 가설구조물=BI, 높이=35)),
    "건축구조_토목": S(dict(전문가=GG, 가설구조물=BI, 높이=35, 공사종류=GJ_T)),
    "건축구조_흙막이": S(dict(전문가=GG)),
    "토목구조_토목": S(dict(전문가=TG, 공사종류=GJ_T)),
    "토목구조_건축": S(dict(전문가=TG)),
    "토질_비계": S(dict(전문가=TJ, 가설구조물=BI, 높이=40)),
    "건설기계_동력": S(dict(전문가=GK, 가설구조물=DR, 높이=None)),
    "건설기계_비계": S(dict(전문가=GK, 가설구조물=BI, 높이=40)),
    "고용됨": S(dict(고용=EMP)),
    "고용빈칸": S(dict(고용=None)),
    "공사종류빈칸_건축구조": S(dict(공사종류=None, 전문가=GG)),
    "공사종류빈칸_토질": S(dict(공사종류=None)),
    "가설구조물빈칸_토질": S(dict(가설구조물=None, 높이=None)),
    "가설구조물빈칸_건설기계": S(dict(가설구조물=None, 높이=None, 전문가=GK)),
    "받는이빈칸": S(dict(받는이=None)),
    "착공없음": S(dict(착공일=None)),
    "공사기간빈칸": S(dict(착공일=None, 준공일=None)),
    "요청서빈칸여럿": S(s=dict(업체명=None, 대상공사=None, 검토자=None, 대표자=None, 계약금액=None)),
    "공사금액글": S(s=dict(계약금액="84억 5천만원")),
    "대상만": S(BLANK, dict(BLANK_S, 대상공사="3층 바닥 거푸집 동바리")),
}


def show(exp):
    a, b = exp["셈"], exp["요청서"]
    return (f"| {str(a.get('판정'))[:14]} | {str(a.get('대상'))[:22]} | {str(a.get('전문가확인'))[:22]} | {str(a.get('첨부'))[:10]} "
            f"| {str(a.get('빈칸'))[:16]} | {str(b.get('자격표시'))[:10]}")
