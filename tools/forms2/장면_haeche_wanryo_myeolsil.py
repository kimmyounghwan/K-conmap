# -*- coding: utf-8 -*-
"""G698 건축물 해체공사 완료신고서 · 멸실 신고서 장면 — python3 tools/forms2/장면시험.py haeche-wanryo-myeolsil --site (TZ=Asia/Seoul 로)
   빈칸 · 허가 · 신고 · 멸실(해체 없이) · 범위(전체 · 일부 · 빈칸) · 서류 고름(허가인데 멸실 · 멸실인데 완료) · 기준일(없음 → 끝날로 미리 · 둘 다 없음 · 지남 · 윤년) ·
   기간(끝 없음 · 역순) · 석면(다 없음 · 덜 고름 · 있음 · 빈칸) · 하수(반대 · 빈칸) · 앞쪽 빈칸 여럿 · 동(멸실 섞임 · 셋 · 없음)"""
import copy
import datetime

import f_haeche_wanryo_myeolsil as m

D = datetime.date
HEO, SIN, MYEOL = m.GB
ALL, PART = m.BW
ASB_NO = {"석면" + k: "없음" for k, _ in m.ASB}
ASB_NONE = {"석면" + k: None for k, _ in m.ASB}


def S(ex=None, s=None, d=None):
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
MIX = [("주", "사무소", 3, 1, 11.99, 200.0, 499.99, "철근콘크리트조", "멸실"),
       ("주", "공장", 1, 0, 9.0, 600.0, 600.0, "철골조", "멸실 아님"),
       ("부속", "창고", 1, None, 3.0, 20.0, 20.0, "경량철골조", None)]

SCENES = {
    "빈칸": S(BLANK, BLANK_S, []),
    "허가_예시": S(),
    "신고": S(dict(구분=SIN)),
    "신고_감리없음": S(dict(구분=SIN), s=dict(감리성명=None, 감리상호=None, 감리자격번호=None, 감리주소=None, 감리전화=None, 감리신고번호=None)),
    "허가_감리없음": S(s=dict(감리성명=None)),
    "멸실_해체없이": S(dict(구분=MYEOL, 범위=None, 해체시작=None, 해체끝=None, 기준일=D(2026, 11, 2)),
                   s=dict(시공성명=None, 상호=None, 면허번호=None, 시공주소=None, 시공전화=None, 감리성명=None)),
    "멸실_기준일없음": S(dict(구분=MYEOL, 범위=None, 해체시작=None, 해체끝=None, 기준일=None)),
    "일부해체": S(dict(범위=PART), d=MIX),
    "범위빈칸": S(dict(범위=None)),
    "허가인데_멸실서류": S(dict(서류="멸실 신고서")),
    "멸실인데_완료서류": S(dict(구분=MYEOL, 서류="해체공사 완료신고서")),
    "구분빈칸_서류만": S(dict(구분=None, 서류="해체공사 완료신고서")),
    "기준일없음_미리": S(dict(기준일=None)),
    "기준일끝날없음": S(dict(기준일=None, 해체끝=None)),
    "기한지남": S(dict(기준일=D(2026, 9, 1), 해체시작=D(2026, 6, 1), 해체끝=D(2026, 8, 20))),
    "윤년": S(dict(기준일=D(2028, 2, 10), 해체시작=D(2027, 12, 1), 해체끝=D(2028, 2, 1))),
    "기간역순": S(dict(해체시작=D(2027, 2, 3), 해체끝=D(2026, 12, 14))),
    "끝없음": S(dict(해체끝=None)),
    "석면다있음": S(dict(**{k: "있음" for k in ASB_NO})),
    "석면하나": S(dict(**{**ASB_NO, "석면지붕재": "있음"})),
    "석면덜고름": S(dict(**{**ASB_NO, "석면기타": None})),
    "석면빈칸": S(dict(**ASB_NONE)),
    "하수반대": S(dict(하수="철거하지 않음")),
    "하수빈칸": S(dict(하수=None)),
    "앞쪽빈칸여럿": S(s=dict(위치=None, 성명=None, 사유=None, 상호=None, 감리성명=None), d=[]),
    "동셋멸실섞임": S(d=MIX),
}


def show(exp):
    a, b = exp["셈"], exp["신고서"]
    return (f"| {str(a.get('판정'))[:14]} | 낼 {a.get('낼')} | {str(a.get('멸실'))[:14]} | {str(a.get('기한'))[:20]} | {str(a.get('빈칸'))[:22]} "
            f"| {b.get('제목1').strip()[:5]} {b.get('제목2').strip()[:5]}")
