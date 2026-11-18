# -*- coding: utf-8 -*-
"""G772 하수급인 사업주 보험가입 승인신청서 장면 — python3 tools/forms2/장면시험.py hasugeupin-boheom-seungin --site (TZ=Asia/Seoul)
   빈칸 · 예시 · 고용만 · 산재만 · 업종 여섯 아님(✗) · 국가유산수리업자 · 서면계약 아직 · 재해 14일 안(⚠) · 재해 15일 ~(✗ — 다른 것보다 먼저) · 재해 빈칸 ·
   기한 당일 · 기한 지남 · 기한이 토요일(→ 월요일) · 날짜 차례 셋 · 재료 있음 · 대행기관 · 동의안함 · 셈만(앞쪽 빈칸) · 빈칸 여럿
   — 날 수는 착공일을 첫날로(30일째 = +29 · G771 · 보험료 계산기와 같은 셈)"""
import copy
import datetime

import f_hasugeupin_boheom_seungin as m

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
    "고용만": S({"보험": m.BOHEOM[1]}),
    "산재만": S({"보험": m.BOHEOM[2]}),
    "업종_아님": S({"업종": m.UPJONG[6]}),
    "국가유산수리": S({"업종": m.UPJONG[5]}),
    "서면계약_아직": S({"계약서": "아직"}),
    "재해_14일안": S({"재해": m.JAEHAE[1]}),
    "재해_15일부터": S({"재해": m.JAEHAE[2], "계약서": "아직"}),
    "재해_빈칸": S({"재해": None}),
    "기한_당일": S({"신청일": D(2027, 4, 13)}),
    "기한_지남": S({"신청일": D(2027, 4, 14)}),
    "기한_토요일": S({"계약일": D(2027, 3, 1), "착공": D(2027, 3, 5), "시작": D(2027, 3, 5), "신청일": D(2027, 4, 5)}),
    "차례_착공_앞": S({"착공": D(2027, 3, 8)}),
    "차례_기간_거꾸로": S({"끝": D(2027, 3, 1)}),
    "차례_신청_앞": S({"신청일": D(2027, 3, 12)}),
    "재료_있음": S({"재료": 8_500_000}),
    "대행기관": S(s={"대행기관": "가나노무법인"}),
    "동의안함": S({"동의": "동의안함"}),
    "셈만_앞쪽빈칸": S(s={k: None for k in m.EX_S}),
    "빈칸여럿": S({"착공": None, "신청일": None, "재해": None}, {"하대표": None, "면허번호": None, "원현장명": None}),
}


def show(exp):
    a = exp["셈"]
    return f"| {str(a.get('기한'))[:16]} | {str(a.get('확인'))[:14]} | {str(a.get('판단'))[:18]}"
