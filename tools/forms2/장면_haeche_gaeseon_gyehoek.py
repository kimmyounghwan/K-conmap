# -*- coding: utf-8 -*-
"""G768 건축물 해체작업 개선계획서 장면 — python3 tools/forms2/장면시험.py haeche-gaeseon-gyehoek --site (TZ=Asia/Seoul)
   빈칸 · 예시(시정 요청 이행 · 관리자) · 작업중지 명령 · 해체작업자가 냄 · 내는 사람 빈칸 · 하도급 함(하수급인 적음 · 안 적음) ·
   개선 시작이 요청일보다 앞 · 끝날이 시작일보다 앞 · 하루 · 제출일이 요청일보다 앞 · 날짜 빈칸 · 앞쪽 빈칸 · 빈칸 여럿"""
import copy
import datetime

import f_haeche_gaeseon_gyehoek as m

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

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "예시": S(),
    "작업중지_명령": S({"계기": m.GYE[1]}),
    "해체작업자가_냄": S({"내는사람": "해체작업자"}),
    "내는사람_빈칸": S({"내는사람": None}),
    "하도급_함_적음": S({"하도급": "하도급 함"}, {"하수급성명": "마바해체(주)", "하수급번호": "000-00-00000"}),
    "하도급_함_안적음": S({"하도급": "하도급 함"}),
    "하도급_빈칸": S({"하도급": None}),
    "개선시작_앞": S({"시작": D(2027, 3, 9)}),
    "끝날_앞": S({"끝": D(2027, 3, 10)}),
    "개선_하루": S({"끝": D(2027, 3, 11)}),
    "제출일_앞": S({"제출일": D(2027, 3, 9)}),
    "날짜_빈칸": S({"요청일": None, "시작": None, "끝": None, "제출일": None}),
    "계기_빈칸": S({"계기": None}),
    "셈만_앞쪽빈칸": S(s={k: None for k in m.EX_S}),
    "빈칸여럿": S(s={"허가번호": None, "회사명": None, "시정내용": None, "개선내용": None}),
}


def show(exp):
    a = exp["셈"]
    return f"| {str(a.get('일간'))[:12]} | {str(a.get('차례'))[:16]} | {str(a.get('빈칸'))[:24]}"
