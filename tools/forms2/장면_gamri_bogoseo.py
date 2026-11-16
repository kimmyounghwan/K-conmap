# -*- coding: utf-8 -*-
"""G702 감리보고서 장면 — python3 tools/forms2/장면시험.py gamri-bogoseo --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(중간 · RC · 5층 바닥) · 완료보고 · 구조(철골 · SRC · 조적 · 기타 · 필로티) · 공정 다섯 · 층 없음 · 상주(다중이용 · 1 ~ 4호 · 경계 · 축사 · 이외) ·
   굴착 · 옹벽 · 마감재료 · 지정 · 협력(특수 · 고층 · 굴착 · 필로티 · 설비 1만㎡ · 다 · 없음) · 현장조사(빈칸 · 부적합 · 일치 · 불일치) ·
   조례(건폐율 · 용적률 넘음 · 조경 · 공개공지 모자람 · 조례 없음) · 첨부(품질 · 사진 · 의견) · 빈칸 여럿"""
import copy
import datetime

import f_gamri_bogoseo as m

D = datetime.date
Y, N = m.YN


def S(ex=None, s1=None, **kw):
    out = {"EX": dict(ex or {})}
    if s1 is not None:
        e1 = copy.deepcopy(m.EX_1)
        e1.update(s1)
        out["EX_1"] = e1
    for k, v in kw.items():
        out[k] = v
    return out


BLANK = {k: None for k in m.EX}
BLANK_1 = {k: None for k in m.EX_1}
NO5 = dict(다중이용=N, 특수구조=N, 필로티=N, 고층=N, 연면적=2000.0, 연속5층=N, 아파트=N, 준다중=N, 축사=N, 굴착옹벽=N, 마감재료=N)
ALL_NG = {n: 1 for n, r in enumerate(m.P2, 1) if r[3] == "a"}

SCENES = {
    "빈칸": S(BLANK, BLANK_1, EX_ST={}, EX_CK=[None] * 6, EX_2={}, EX_3={}, EX_T={"안전": None, "기타": None, "종합": None}),
    "예시": S(),
    "완료보고": S(dict(신청구분=m.SG[1], 공정=None, 공정층=None), dict(감리시작=D(2026, 10, 1), 감리끝=D(2027, 9, 30), 완료일자=D(2027, 9, 28))),
    "철골조": S(dict(구조형식=m.GJ[3], 공정=m.GD[1])),
    "SRC": S(dict(구조형식=m.GJ[1])),
    "조적_필로티": S(dict(구조형식=m.GJ[2], 필로티=Y, 공정=m.GD[4])),
    "기타구조": S(dict(구조형식=m.GJ[4], 공정=m.GD[3])),
    "공정_기초": S(dict(공정=m.GD[0])),
    "공정_층없음": S(dict(공정층=None)),
    "공정_빈칸": S(dict(공정=None)),
    "다중이용": S(dict(다중이용=Y)),
    "상주아님": S(NO5),
    "상주_1호딱": S(dict(NO5, 연면적=5000.0)),
    "상주_축사": S(dict(NO5, 연면적=6000.0, 축사=Y)),
    "상주_2호": S(dict(NO5, 연면적=3000.0, 연속5층=Y)),
    "상주_2호모자람": S(dict(NO5, 연면적=2999.99, 연속5층=Y)),
    "상주_아파트": S(dict(NO5, 아파트=Y)),
    "상주_준다중": S(dict(NO5, 준다중=Y)),
    "굴착_상주아님": S(dict(NO5, 굴착옹벽=Y)),
    "굴착_상주": S(dict(굴착옹벽=Y)),
    "마감재료": S(dict(마감재료=Y)),
    "허가권자지정": S(dict(지정=m.JJ[0])),
    "협력_특수": S(dict(특수구조=Y)),
    "협력_고층설비": S(dict(고층=Y, 연면적=12000.0)),
    "협력_다": S(dict(특수구조=Y, 굴착옹벽=Y, 필로티=Y, 연면적=10000.0)),
    "기타건축공사빈칸": S(dict(다중이용=None, 특수구조=None, 필로티=None, 고층=None)),
    "현장_빈칸": S(EX_2={}, EX_3={}),
    "현장_부적합": S(EX_2=ALL_NG, EX_3={13: 1}),
    "현장_일치": S(EX_3={13: 0}),
    "건폐율넘음": S(dict(건폐율=61.5)),
    "용적률넘음": S(dict(용적률=600.01)),
    "조경모자람": S(dict(조경=14.99)),
    "공개공지": S(dict(공개공지=12.5, 공개공지없음=N)),
    "공개공지모자람": S(dict(공개공지=8, 공개공지없음=N)),
    "조례없음": S(dict(건폐율조례=None, 용적률조례=None, 조경조례=None, 공개공지조례=None)),
    "조경해당없음": S(dict(조경=None, 조경조례=None, 조경없음=Y)),
    "첨부_다": S(dict(품질시험=Y, 사진대상=Y, 감리의견=m.IS[0])),
    "첨부_적게": S(dict(품질시험=N, 사진대상=N, 감리의견=m.IS[1])),
    "신청구분빈칸": S(dict(신청구분=None)),
    "빈칸여럿": S(dict(구조형식=None, 지정=None), dict(허가번호=None, 대지위치=None, 건축주=None)),
}


def show(exp):
    a, b = exp["셈"], exp["보고서1"]
    return (f"| {str(a.get('중간때'))[:10]} | {str(a.get('상주'))[:18]} | {str(a.get('협력'))[:14]} | {str(a.get('집계'))[:18]} "
            f"| {str(a.get('조례대조'))[:16]} | {b.get('감리구분표시')[:14]}")
