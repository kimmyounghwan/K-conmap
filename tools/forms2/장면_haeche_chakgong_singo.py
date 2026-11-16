# -*- coding: utf-8 -*-
"""G697 건축물 해체공사 착공신고서 장면 — python3 tools/forms2/장면시험.py haeche-chakgong-singo --site (TZ=Asia/Seoul 로 — 사이트 TODAY 는 한국 날짜)
   빈칸 · 신고한 건축물(대상 아님) · 허가 고르기 전 · 하도급 없음 · 허가번호 없음 · 앞쪽 빈칸 여럿 · 동 없음 · 부속만 · 높이 빠짐 · 동 셋 ·
   기간(준공 없음 · 역순) · 신고일 → 착공(신고일 없음 · 둘 다 없음 · 착공 없음 · 앞섬 · 0일 · 7일 · 8일) · 완료신고 기한 지남 ·
   석면(다 없음 · 덜 고름 · 빈칸 · 여섯 다 있음)"""
import copy
import datetime

import f_haeche_chakgong_singo as m

D = datetime.date
HEO, SIN = m.HS
ASB_NO = dict(석면천장재="없음", 석면바닥재="없음", 석면지붕재="없음", 석면보온재="없음", 석면단열재="없음", 석면그밖="없음")
ASB_NONE = {k: None for k in ASB_NO}


def S(ex=None, s=None, d=None):
    """ex = 셈 값 바꿈 · s = 신고서 값 바꿈(EX_S 통째로 — 나머지는 처음 값) · d = 뒤쪽 동별 개요"""
    out = {"EX": dict(ex or {})}
    if s is not None:
        es = copy.deepcopy(m.EX_S)
        es.update(s)
        out["EX_S"] = es
    if d is not None:
        out["EX_D"] = d
    return out


BLANK = {k: None for k in m.EX}
BLANK_S = {k: None for k in m.EX_S}
SMALL = [("주", "단독주택", 2, 0, 7.5, 95.0, 160.0, "조적조", "해당 없음")]
THREE = [("주", "사무소", 3, 1, 11.99, 200.0, 499.99, "철근콘크리트조", "해당 없음"),
         ("주", "공장", 1, 0, 9.0, 600.0, 600.0, "철골조", "나목"),
         ("부속", "창고", 1, None, 3.0, 20.0, 20.0, "경량철골조", "해당 없음")]

SCENES = {
    "빈칸": S(BLANK, BLANK_S, []),
    "신고한건축물": S(dict(허가신고=SIN)),
    "허가고르기전": S(dict(허가신고=None)),
    "하도급없음": S(s=dict(하수급인=None, 하수급인번호=None)),
    "허가번호없음": S(s=dict(허가번호=None)),
    "앞쪽빈칸여럿": S(s=dict(위치=None, 성명=None, 시공회사=None, 감리성명=None, 관리인성명=None), d=[]),
    "동없음_예정일없음": S(dict(착공예정=None, 준공예정=None), d=[]),
    "부속만": S(d=[("부속", "창고", 1, 0, 3.5, 30.0, 30.0, "경량철골조", "해당 없음")]),
    "높이빠짐": S(d=[("주", "단독주택", 2, 0, None, 95.0, 160.0, "조적조", "해당 없음")]),
    "동셋": S(d=THREE),
    "작은동": S(d=SMALL),
    "준공없음": S(dict(준공예정=None)),
    "기간역순": S(dict(착공예정=D(2027, 1, 10), 준공예정=D(2026, 12, 20))),
    "신고일없음": S(s=dict(신고일=None)),
    "신고일착공둘다없음": S(dict(착공예정=None), s=dict(신고일=None)),
    "착공없음": S(dict(착공예정=None)),
    "착공앞섬": S(dict(착공예정=D(2026, 12, 1)), s=dict(신고일=D(2026, 12, 3))),
    "착공0일": S(dict(착공예정=D(2026, 12, 3)), s=dict(신고일=D(2026, 12, 3))),
    "착공7일": S(dict(착공예정=D(2026, 12, 10)), s=dict(신고일=D(2026, 12, 3))),
    "착공8일": S(dict(착공예정=D(2026, 12, 11)), s=dict(신고일=D(2026, 12, 3))),
    "완료기한지남": S(dict(착공예정=D(2026, 6, 1), 준공예정=D(2026, 8, 1)), s=dict(신고일=D(2026, 5, 20))),
    "해넘김윤년": S(dict(착공예정=D(2027, 12, 20), 준공예정=D(2028, 2, 1)), s=dict(신고일=D(2027, 12, 1))),
    "석면다없음": S(dict(**ASB_NO)),
    "석면덜고름": S(dict(**{**ASB_NO, "석면지붕재": None})),
    "석면빈칸": S(dict(**ASB_NONE)),
    "석면여섯": S(dict(**{k: "있음" for k in ASB_NO})),
}


def show(exp):
    a, b = exp["셈"], exp["신고서"]
    return (f"| {str(a.get('대상'))[:16]} | {str(a.get('신고착공'))[:22]} | {str(a.get('석면확인'))[:12]} | {str(a.get('빈칸'))[:24]} "
            f"| {str(a.get('완료기한'))[:18]} | {b.get('연면적표시')}")
