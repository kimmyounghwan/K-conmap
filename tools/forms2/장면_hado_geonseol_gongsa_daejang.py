# -*- coding: utf-8 -*-
"""G707 하도급 건설공사대장 장면 — python3 tools/forms2/장면시험.py hado-geonseol-gongsa-daejang --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(9억 6천만원 · 재하도급 1건) · 통보(4천만원 미만 · 딱 4천만원 · 원도급 1억원 미만 · 원도급 모름 · 계약일 없음 · 기한 토 · 일요일 → 월요일) ·
   지급보증서(받음 · 안 받음 · 직불합의 · 1천만원 이하 · 딱 1천만원 넘음 · 계약일 없음 · 안 고름) · 공동도급(합 다름 · 같음) · 재하도급 기한 토요일 ·
   대금 없음 · 빈칸 여럿 · 공사명만"""
import copy
import datetime

import f_hado_geonseol_gongsa_daejang as m

D = datetime.date


def S(ex=None, e1=None, e2=None):
    """ex = 셈 값 바꿈 · e1 = 1쪽 값 바꿈(EX_1 통째로) · e2 = 2쪽 값 바꿈(EX_2 통째로)"""
    out = {"EX": dict(ex or {})}
    if e1 is not None:
        es = copy.deepcopy(m.EX_1)
        es.update(e1)
        out["EX_1"] = es
    if e2 is not None:
        es = copy.deepcopy(m.EX_2)
        es.update(e2)
        out["EX_2"] = es
    return out


BLANK = {k: None for k in m.EX}
BLANK_1 = {k: None for k in m.EX_1}
BLANK_2 = {k: None for k in m.EX_2}
NO = m.GJ[1]

SCENES = {
    "빈칸": S(BLANK, BLANK_1, BLANK_2),
    "예시": S(),
    "4천만원미만": S(e1=dict(계약금액=39999999)),
    "딱4천만원": S(e1=dict(계약금액=40000000)),
    "원도급1억미만": S(dict(원도급1억=m.WD[1])),
    "원도급모름": S(dict(원도급1억=None)),
    "계약일없음": S(e1=dict(계약일=None)),
    "기한토요일": S(e1=dict(계약일=D(2026, 12, 10))),
    "기한일요일": S(e1=dict(계약일=D(2026, 12, 11))),
    "보증서_안받음": S(dict(보증서수령=NO)),
    "보증서_직불합의": S(dict(보증서수령=NO, 직불합의=m.GJ[0])),
    "보증서_1천만원이하": S(dict(보증서수령=NO), e1=dict(계약금액=10000000)),
    "보증서_1천만원넘음": S(dict(보증서수령=NO), e1=dict(계약금액=10000001)),
    "보증서_계약일없음": S(dict(보증서수령=NO), e1=dict(계약일=None)),
    "보증서_안고름": S(dict(보증서수령=None)),
    "공동도급_합다름": S(dict(도급방법=m.DG[1]), e1={"업체금액#1": 600000000, "업체상호#2": "차카건설(주)", "업체금액#2": 300000000}),
    "공동도급_합같음": S(dict(도급방법=m.DG[2]), e1={"업체금액#1": 600000000, "업체상호#2": "차카건설(주)", "업체금액#2": 360000000}),
    "재하도급기한_토요일": S(e2={"재체결일#1": D(2026, 12, 10)}),
    "재하도급둘": S(e2={"재상호#2": "타파설비", "재체결일#2": D(2027, 3, 6)}),
    "대금없음": S(e1={"현금#1": None, "현금#2": None}),
    "어음기타": S(e1={"어음#1": 12000000, "기타#2": 3000000}),
    "빈칸여럿": S(dict(보증서수령=None, 도급방법=m.DG[0]), e1=dict(공사명=None, 수급인상호=None)),
    "공사명만": S(BLANK, dict(BLANK_1, 공사명="가나시 다목적체육관 신축공사 중 토공사"), BLANK_2),
}


def show(exp):
    a = exp["셈"]
    return (f"| {str(a.get('통보'))[:12]} | {str(a.get('기한'))[13:30]} | {str(a.get('보증'))[:22]} | {str(a.get('업체합'))[:16]} "
            f"| {str(a.get('재기한#1'))[-30:-18]}")
