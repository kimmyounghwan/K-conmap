# -*- coding: utf-8 -*-
"""G766 건축물 해체 현장 안전점검표 장면 — python3 tools/forms2/장면시험.py haeche-anjeon-jeomgeom --site (TZ=Asia/Seoul)
   빈칸 · 예시(비산 먼지 부적정) · 모두 적정 · 장비를 안 올림(장비 항목 셋 해당 없음 — 골라도 안 셈) · 장비 빈칸(셈) ·
   몇 개 안 고름 · 부적정 여럿 · 고르는 칸 다른 쪽 · 고르는 칸 빈칸 · 종합점검결과 필요 · 빈칸 · 점검일 없음 · 공사기간 거꾸로 · 빈칸 · 앞쪽 빈칸"""
import copy
import datetime

import f_haeche_anjeon_jeomgeom as m

D = datetime.date


def S(ex=None, s=None):
    out = {"EX": dict(ex or {})}
    if s is not None:
        es = copy.deepcopy(m.EX_S)
        es.update(s)
        out["EX_S"] = es
    return out


BLANK = {k: None for k in m.EX}
BLANK_S = {k: None for k in m.EX_S}
ALLOK = {"결과" + k: "적정" for k, *_ in m.ITEMS}
OFF = m.JANGBI[1]

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "예시": S(),
    "모두_적정": S(ALLOK),
    "장비_안올림": S({"장비": OFF}),
    "장비_안올림_장비항목_부적정": S({"장비": OFF, "결과i2": "부적정", "결과k2": "부적정", "결과k5": None}),
    "장비_빈칸": S({"장비": None, "결과k5": "부적정"}),
    "몇개_안고름": S({"결과h4": None, "결과k3": None, "결과a6": None}),
    "장비_안올림_안고름": S({"장비": OFF, "결과i2": None, "결과k2": None, "결과k5": None, "결과j1": None}),
    "부적정_여럿": S({"결과h1": "부적정", "결과i3": "부적정", "결과k6": "부적정", "결과a5": "부적정"}),
    "모두_부적정": S({"결과" + k: "부적정" for k, *_ in m.ITEMS}),
    "고르는칸_다른쪽": S({"허신": "신고", "계약": "미체결", "상주": "비상주", "보고서": "없음"}),
    "고르는칸_빈칸": S({"허신": None, "계약": None, "상주": None, "보고서": None}),
    "종합_필요": S({"긴급": "필요", "보강": "필요", "진단": "필요"}),
    "종합_빈칸": S({"긴급": None, "보강": None, "진단": None}),
    "점검일_없음": S({"점검일": None}),
    "공사기간_거꾸로": S({"시작": D(2027, 5, 31), "끝": D(2027, 3, 2)}),
    "공사기간_하루": S({"시작": D(2027, 3, 2), "끝": D(2027, 3, 2)}),
    "공사기간_빈칸": S({"끝": None}),
    "셈만_앞쪽빈칸": S(s={k: None for k in m.EX_S}),
}


def show(exp):
    a = exp["셈"]
    return (f"| {a.get('적정수')}/{a.get('부적정수')}/{a.get('점검수')} | {str(a.get('부적정'))[:22]} | {str(a.get('안고름'))[:22]}")
