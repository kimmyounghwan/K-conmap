# -*- coding: utf-8 -*-
"""G717 소방공사 감리일지 장면 — python3 tools/forms2/장면시험.py sobang-gamri-ilji --site (TZ=Asia/Seoul 로)
   빈칸 · 예시 · 밖날짜 · 배치다시 · 감리기간없음 · 기간거꾸로 · 6줄꽉 · 구조소수 · 일부만"""
import copy
import datetime

import f_sobang_gamri_ilji as m

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
FULL = {}
for k in range(1, 7):
    FULL[f"날짜#{k}"] = D(2027, 3, 2) + datetime.timedelta(days=30 * (k - 1))
    FULL[f"사항#{k}"] = f"{k}차 확인 — 옥내소화전 · 스프링클러 배관 수압시험 입회 및 감지기 회로 절연저항 측정 결과 확인(시정 지시 포함)"
    FULL[f"비고#{k}"] = "1건 시정 · 재확인"

SCENES = {
    "빈칸": S(NONE_EX, blank=True),
    "예시": S(),
    "밖날짜": S(None, {"날짜#1": D(2027, 2, 25), "날짜#5": D(2027, 9, 3), "사항#5": "준공 후 보완 확인"}),
    "배치다시": S({"책임시작": D(2027, 4, 1), "책임끝": D(2027, 3, 31), "보조시작": D(2027, 2, 20)}),
    "감리기간없음": S({"감리시작": None, "감리끝": None}),
    "기간거꾸로": S({"감리시작": D(2027, 9, 1), "감리끝": D(2027, 3, 2)}),
    "6줄꽉": S(None, FULL),
    "구조소수": S({"지하": None, "지상": 12, "연면적": 13250.5, "바닥면적": 640.25, "동수": 2}),
    "일부만": S({"책임시작": None, "책임끝": None, "보조시작": None, "보조끝": None}, {"감리상호": "마바소방(주)"}, blank=True),
}


def show(exp):
    a, o = exp["셈"], exp["일지"]
    return f"| {a.get('기간')} | {a.get('날짜점검')} | {a.get('배치점검')} | {a.get('빈칸')} | {o.get('구조')}"
