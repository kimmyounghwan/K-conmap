# -*- coding: utf-8 -*-
"""건축허가 신청서 장면 — python3 tools/forms2/장면시험.py geonchuk-heoga-sincheong --site (TZ=Asia/Seoul 로)
   빈칸 · 예시 · 공장 3년 · 허가일 윤년(2. 29.) · 허가일 없음 · 건폐율 반올림 · 층별 합계 다름 · 대수선 넷 · 일괄 · 협정 여럿 ·
   주구조 · 주부속 기존 · 허가권자 셋 · 송달 동의하지 않음 · 빈칸 여럿"""
import copy
import datetime

import f_geonchuk_heoga_sincheong as m

D = datetime.date


def S(ex=None, s=None, blank=False):
    out = {"EX": {k: None for k in m.EX} if blank else {}}
    out["EX"].update(ex or {})
    es = {k: None for k in m.EX_S} if blank else copy.deepcopy(m.EX_S)
    es.update(s or {})
    out["EX_S"] = es
    return out


SCENES = {
    "빈칸": S(blank=True),
    "예시": S(),
    "공장3년": S({"공장": "예", "허가일": D(2027, 8, 31)}),
    "허가일윤년": S({"허가일": D(2028, 2, 29)}),
    "허가일없음": S({"허가일": None}),
    "건폐율반올림": S(s={"대지면적": 333.33, "건축면적": 111.115, "연면적용적": 499.995}),
    "층별다름": S(s={"신면적#5": 280.0}),
    "대수선": S({"건축구분": "대수선", "대수선#1": "수선", "대수량#1": 25.5, "대수선#2": "증설", "대수량#2": 4, "대수선#10": "변경",
               "대수선#12": "해체", "대수량#12": 30.25, "대수선#6": "변경"}),
    "일괄협정": S({**{f"일괄#{i}": "√" for i in (2, 5, 9, 15, 23)}, "협정#1": "√", "협정#4": "√"}),
    "주구조기존": S({"기존주부속": "부속 건축물", "기존주구조": "철골조", "신청주구조": "기타", "신청주부속": "부속 건축물"}),
    "허가권자광역": S({"허가권자": m.HG[0]}),
    "허가권자도지사": S({"허가권자": m.HG[2]}),
    "송달안함": S({"송달": "동의하지 않음"}),
    "빈칸여럿": S({"건축구분": None}, {"발주자": None, "대지면적": None, "지번": None, "시공기간": None}),
}


def show(exp):
    a, b = exp["셈"], exp["제1쪽"]
    return f"| {str(a.get('건폐셈'))[:30]} | {str(a.get('착수기한'))[:34]} | {str(a.get('층별셈'))[-14:]} | {b.get('건폐율')} | {str(a.get('빈칸'))[:24]}"
