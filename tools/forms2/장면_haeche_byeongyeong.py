# -*- coding: utf-8 -*-
"""G764 건축물 해체 변경허가 신청서 · 변경신고서 장면 — python3 tools/forms2/장면시험.py haeche-byeongyeong --site (TZ=Asia/Seoul)
   빈칸 · 예시 · 당초 허가 → 신고 대상(3호) · 당초 신고 그대로(2호) · 당초 신고 → 허가 대상(4호) · 당초 허가 → «허가 대상이 됨»(1호) ·
   바꾸는 사항 없음(착공 · 일괄 변경신고 안내) · 석면 함유 여부를 바꿈 · 해체계획서 미해당 · 송달 안 함 · 석면 모두 없음 · 가스 예정 ·
   심의 거침(날 있음 · 없음) · 처리 기한(설 · 표 밖) · 신청일 없음 · 빈칸 여럿"""
import copy
import datetime

import f_haeche_byeongyeong as m

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
NOSA = {k: "아니오" for k, _ in m.SAHANG}
ALLNO = {"석면" + k: "없음" for k, _ in m.ASB}

SCENES = {
    "빈칸": S(BLANK, BLANK_S),
    "예시": S(),                                                              # 1. 11.(월) → 1. 19.(화)
    "허가_신고대상": S({"변경뒤": "신고 대상이 됨"}),
    "신고_그대로": S({"당초": "해체신고를 함"}),
    "신고_허가대상": S({"당초": "해체신고를 함", "변경뒤": "허가 대상이 됨"}),
    "허가_허가대상": S({"변경뒤": "허가 대상이 됨"}),
    "신고_신고대상": S({"당초": "해체신고를 함", "변경뒤": "신고 대상이 됨"}),
    "사항_없음": S(NOSA),
    "석면_바꿈": S({"석면": "예"}),
    "계획서_미해당": S({"계획서": "미해당"}),
    "송달_안함": S({"송달": "동의하지 않음"}),
    "석면_모두없음": S(ALLNO),
    "가스_예정": S({"가스": "철거 및 안전조치 예정", "가스예정": D(2027, 1, 20)}),
    "심의_거침": S({"심의": "거침", "심의일": D(2027, 1, 22)}),
    "심의_날없음": S({"심의": "거침", "심의일": None}),
    "처리_설": S({"신청일": D(2027, 2, 3)}),
    "처리_표밖": S({"신청일": D(2027, 12, 27)}),
    "신청일_없음": S({"신청일": None}),
    "연면적_없음": S({"연면적": None, "주동": None, "부속동": None}),
    "빈칸여럿": S(s={"성명": None, "허가번호": None, "변경후": None, "위치": None}),
    "셈만_앞쪽빈칸": S(s={k: None for k in m.EX_S}),
}


def show(exp):
    a = exp["셈"]
    return (f"| {str(a.get('낼'))[:16]} | {str(a.get('사항'))[:18]} | {str(a.get('첨부'))[:10]} | {str(a.get('처리'))[:18]} | {str(a.get('빈칸'))[:14]}")
