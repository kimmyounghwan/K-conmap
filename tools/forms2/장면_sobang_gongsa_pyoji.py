# -*- coding: utf-8 -*-
"""G718 소방시설공사현황 표지 장면 — python3 tools/forms2/장면시험.py sobang-gongsa-pyoji --site (TZ=Asia/Seoul 로)
   빈칸 · 예시 · 거꾸로 · 공사기간없음 · 대표없음 · 상호없음 · 소수면적 · 신고번호없음 · 일부만"""
import copy
import datetime

import f_sobang_gongsa_pyoji as m

D = datetime.date


def S(ex=None, s=None, blank=False):
    out = {}
    if ex is not None:
        out["EX"] = ex
    if s is not None or blank:
        es = {} if blank else copy.deepcopy(m.EX_S)
        es.update(s or {})
        out["EX_S"] = es
    return out


NONE_EX = {k: None for k in m.EX}

SCENES = {
    "빈칸": S(NONE_EX, blank=True),
    "예시": S(),
    "거꾸로": S({"착공일": D(2027, 12, 31), "준공일": D(2027, 3, 2)}),
    "공사기간없음": S({"착공일": None, "준공일": None}),
    "대표없음": S({"대표자": None, "감리대표": None}),
    "상호없음": S({"상호": None, "감리상호": None}),
    "소수면적": S({"지하": None, "대지면적": 2400.75, "건축면적": 1150.5, "연면적": 12500.25}),
    "신고번호없음": S(None, {"신고번호": None, "시도": None, "소방서": None}),
    "일부만": S({k: None for k in ("상호", "대표자", "감리상호", "감리대표", "착공일", "준공일")}, {"공사명": "가나빌딩 신축공사 중 소방시설공사"}, blank=True),
}


def show(exp):
    a, o = exp["셈"], exp["표지"]
    return f"| {a.get('기간')} | {a.get('빈칸')} | {o.get('공사업체')} | {o.get('감리업체')} | {o.get('규모')}"
