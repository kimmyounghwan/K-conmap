# -*- coding: utf-8 -*-
"""건설공사 기성실적신고서 장면 — python3 tools/forms2/장면시험.py giseong-silijeok-singo --site (TZ=Asia/Seoul 로)
   빈칸 · 예시 · 기한 토요일(2030년 실적 → 2031. 2. 15.) · 기한 일요일(2025년 실적 → 2026. 2. 15.) · 백만원 단위만 · 10조 넘음 ·
   공사종류 건축 · 조경 · 여섯 줄 다 · 실적 연도 없음 · 회사명 · 대표자 없음 · 금액만(코드 없음) · 백만원 미만 줄(칸 비고 버림만)"""
import copy

import f_giseong_silijeok_singo as m


def S(ex=None, s=None, blank=False):
    out = {"EX": {k: None for k in m.EX} if blank else {}}
    out["EX"].update(ex or {})
    es = {k: None for k in m.EX_S} if blank else copy.deepcopy(m.EX_S)
    es.update(s or {})
    out["EX_S"] = es
    return out


R6 = {"계약액#4": 5000000000, "기성액#4": 4999999999, "자재액#4": 1,
      "계약액#5": 70000000, "기성액#5": 70000000, "자재액#5": None,
      "계약액#6": 9999999999999, "기성액#6": 1000000, "자재액#6": 999999}
R6S = {"번호#4": "4", "공사명#4": "자차동", "번호#5": "5", "공사명#5": "카타천", "번호#6": "6", "공사명#6": "파하항"}

SCENES = {
    "빈칸": S(blank=True),
    "예시": S(),
    "기한토요일": S(s={"실적연도": 2030}),
    "기한일요일": S(s={"실적연도": 2025}),
    "백만원단위만": S({"계약액#3": 987000000, "총계약액합": 12345000000}),
    "십조넘음": S({"계약액#1": 12345678000000}),
    "건축": S({"공사종류": m.KINDS[1]}),
    "조경": S({"공사종류": m.KINDS[3]}),
    "여섯줄": S(R6, R6S),
    "연도없음": S(s={"실적연도": None}),
    "회사대표없음": S(s={"회사명": None, "대표자": None}),
    "금액만": S(blank=True, ex={"계약액#1": 1500000000, "기성액#1": 500000000}),
    "백만원미만": S({"계약액#1": 999999, "기성액#1": 500000, "자재액#1": 1, "계약액#2": None, "기성액#2": None, "자재액#2": None,
                  "계약액#3": None, "기성액#3": None, "총계약액합": 999999, "누계기성합": None, "누계자재합": None}),
}


def show(exp):
    a, b = exp["셈"], exp["제1쪽"]
    dig = "".join(b.get(f"계{k}#1") or "·" for k in range(1, 8))
    sub = "".join(b.get(f"소계{k}") or "·" for k in range(1, 8))
    return f"| {str(a.get('기한'))[:34]} | {str(a.get('버림'))[:30]} | {dig} | {sub} | {str(a.get('빈칸'))[:30]}"
