# -*- coding: utf-8 -*-
"""G716 소방시설공사 기록부 장면 — python3 tools/forms2/장면시험.py sobang-gongsa-girokbu --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(2줄) · 15줄 꽉 · 공사업체명만 · 기록만(공사업체명 없음)"""
import copy

import f_sobang_gongsa_girokbu as m


def S(r=None, s=None):
    out = {}
    if r is not None:
        out["EX_R"] = r
    if s is not None:
        es = copy.deepcopy(m.EX_S)
        es.update(s)
        out["EX_S"] = es
    return out


R15 = [dict(m.EX_R[i % 2], 대상명=f"대상{i + 1}") for i in range(15)]

SCENES = {
    "빈칸": S([], {"상호": None}),
    "예시": S(),
    "15줄꽉": S(R15),
    "공사업체명만": S([]),
    "기록만": S(None, {"상호": None}),
}


def show(exp):
    a = exp["셈"]
    return f"| {a.get('합계')} | {a.get('빈칸')}"
