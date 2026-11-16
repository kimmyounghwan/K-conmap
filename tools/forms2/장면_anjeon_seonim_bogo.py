# -*- coding: utf-8 -*-
"""G708 선임 등 보고서(건설업) 장면 — python3 tools/forms2/장면시험.py anjeon-seonim-bogo --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(높이 33.5m) · 대상 분류(딱 31m · 30.9m · 딱 3만㎡ · 5천㎡ 문화집회 · 4,999㎡ 문화집회 · 5천㎡ 해당 없음 · 냉동 설비 · 지간 딱 50m · 49.9m ·
   터널 · 댐 · 굴착 딱 10m · 9.9m · 여럿 · 대상 아님 · 값 없음) · 발주자 유형 일곱 · 보고 기한(토요일 → 월요일 · 일요일 → 월요일 · 셋 다 · 산업보건의만) · 빈칸 여럿"""
import copy
import datetime

import f_anjeon_seonim_bogo as m

D = datetime.date
NOVAL = {"높이": None, "연면적": None, "용도": None, "냉동설비": None, "지간": None, "터널": None, "댐": None, "굴착": None}
NOT = dict(NOVAL, 높이=12, 연면적=4000, 용도=m.YD[7], 냉동설비=m.YN[1], 터널=m.YN[1], 댐=m.YN[1], 굴착=5)


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
    "딱31m": S(dict(NOT, 높이=31)),
    "30.9m": S(dict(NOT, 높이=30.9)),
    "딱3만㎡": S(dict(NOT, 연면적=30000)),
    "5천㎡문화집회": S(dict(NOT, 연면적=5000, 용도=m.YD[0])),
    "4999㎡문화집회": S(dict(NOT, 연면적=4999, 용도=m.YD[0])),
    "5천㎡해당없음": S(dict(NOT, 연면적=5000, 용도=m.YD[7])),
    "5천㎡지하도상가": S(dict(NOT, 연면적=8000, 용도=m.YD[5])),
    "냉동설비": S(dict(NOT, 냉동설비=m.YN[0])),
    "지간딱50m": S(dict(NOT, 지간=50)),
    "지간49.9m": S(dict(NOT, 지간=49.9)),
    "터널": S(dict(NOT, 터널=m.YN[0])),
    "댐": S(dict(NOT, 댐=m.YN[0])),
    "굴착딱10m": S(dict(NOT, 굴착=10)),
    "굴착9.9m": S(dict(NOT, 굴착=9.9)),
    "여럿": S(dict(NOT, 높이=40, 연면적=35000, 용도=m.YD[1], 굴착=15)),
    "대상아님": S(NOT),
    "값없음": S(NOVAL),
    "유형_정부": S(dict(발주유형=m.YT[0])),
    "유형_기타국가기관": S(dict(발주유형=m.YT[4])),
    "유형_기업": S(dict(발주유형=m.YT[5])),
    "유형_개인": S(dict(발주유형=m.YT[6])),
    "유형없음": S(dict(발주유형=None)),
    "기한_토요일": S(s=dict(안전선임일=D(2026, 12, 12), 보건선임일=None)),
    "기한_일요일": S(s=dict(안전선임일=D(2026, 12, 13), 보건선임일=None)),
    "셋다": S(s=dict(의사성명="윤태경", 의사선임일=D(2026, 12, 15), 의사전담=m.JD[1])),
    "산업보건의만": S(s=dict(안전선임일=None, 보건선임일=None, 의사선임일=D(2027, 1, 4))),
    "빈칸여럿": S(dict(발주유형=None), s=dict(사업장명=None, 공사기간=None, 발주자=None)),
}


def show(exp):
    a = exp["셈"]
    return f"| {str(a.get('판정'))[-40:]} | {str(a.get('기한안전관리자'))[14:40]} | {str(a.get('빈칸'))[:30]}"
