# -*- coding: utf-8 -*-
"""G724 건설기술인력보유현황표 장면 — python3 tools/forms2/장면시험.py gisul-inryeok-hyeonhwang --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(5명) · 20줄 꽉 · 빠진 칸 · 등급 둘 적음 · 등급 없음 · 중간 줄 비움"""
import copy
import datetime

import f_gisul_inryeok_hyeonhwang as m

D = datetime.date


def S(s=None, blank=False):
    es = {} if blank else copy.deepcopy(m.EX_S)
    es.update(s or {})
    return {"EX_S": es}


FULL = {}
for i in range(1, m.NR + 1):
    FULL.update({f"성명#{i}": f"사람{i}", f"주민#{i}": "000000-0000000", f"입사#{i}": D(2020, 1, i), f"종목#{i}": "토목",
                 f"등급#{i}": m.GRADES[i % 4], f"자격번호#{i}": "00-0-00000", f"취득#{i}": D(2010, 2, i), f"비고#{i}": "현장 배치"})

SCENES = {
    "빈칸": S(blank=True),
    "예시": S(),
    "20줄꽉": S(FULL),
    "빠진칸": S({"자격번호#2": None, "취득#4": None, "입사#5": None}),
    "등급둘": S({"등급#1": "특급(고급 겸)"}),
    "등급없음": S({"등급#3": "기능사"}),
    "중간줄비움": S({"성명#2": None, "주민#2": None}),
}


def show(exp):
    a, b = exp["셈"], exp["현황표"]
    return f"| {a.get('인원')} | {a.get('등급별')} | {str(a.get('빠짐'))[:40]} | {[b.get(f'번호#{i}') for i in range(1, 6)]}"
