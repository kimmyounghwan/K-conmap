# -*- coding: utf-8 -*-
"""G746 도로점용허가 기간연장 신청서 장면 — python3 tools/forms2/장면시험.py doro-jeomyong-yeonjang --site (TZ=Asia/Seoul)
   빈칸 · 예시 · 재연장(지금 허가 끝날 따로) · 연장 끝날 거꾸로 · 끝난 뒤 신청 · 처리 기한이 끝날보다 늦음 · 처리 기한 = 끝날 ·
   신청하는 곳(고속국도 · 일반국도 · 그 밖) · 처리 기한(설 · 추석 · 표 밖) · 빈칸 여럿"""
import copy
import datetime

import f_doro_jeomyong_yeonjang as m

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
    "예시": S(),                                                           # 3. 2. 신청 → 3. 10. 처리 · 3. 31. 끝 — ✓
    "재연장": S({"지금끝": D(2028, 3, 31), "신청일": D(2028, 3, 2)}),        # 표 밖(2028) — 토 · 일만 · ⚠
    "연장끝_거꾸로": S({"연장끝": D(2027, 3, 1)}),
    "연장끝_같은날": S({"연장끝": D(2027, 3, 31)}),
    "끝난뒤_신청": S({"신청일": D(2027, 4, 1)}),
    "처리_늦음": S({"신청일": D(2027, 3, 25)}),                             # 처리 기한 4. 2. > 3. 31.
    "처리_딱": S({"최초끝": D(2027, 3, 10)}),                               # 처리 기한 3. 10. = 끝날 — ✓(넘지 않음)
    "처리_하루늦음": S({"최초끝": D(2027, 3, 9)}),
    "도로_고속국도": S({"도로종류": "고속국도"}),
    "도로_일반국도": S({"도로종류": "일반국도"}),
    "도로_특별시도": S({"도로종류": "특별시도"}),
    "처리_설": S({"신청일": D(2027, 2, 3), "최초끝": D(2027, 2, 28)}),      # 설 연휴 건너 2. 15.
    "처리_추석": S({"신청일": D(2027, 9, 10), "최초끝": D(2027, 9, 30)}),
    "신청일_없음": S({"신청일": None}),
    "끝날_없음": S({"최초끝": None, "지금끝": None}),
    "빈칸여럿": S(s={"성명": None, "허가번호": None, "장소": None}),
    "셈만_신청서빈칸": S(s={k: None for k in m.EX_S}),
}


def show(exp):
    a = exp["셈"]
    return (f"| {str(a.get('연장'))[:18]} | {str(a.get('처리'))[:16]} | {str(a.get('판정'))[:22]} | {str(a.get('곳'))[:10]} | {str(a.get('빈칸'))[:14]}")
