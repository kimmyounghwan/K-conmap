# -*- coding: utf-8 -*-
"""G705 피공제자별 근로일수 및 공제부금 납부 신고서 장면 — python3 tools/forms2/장면시험.py toejik-geunroilsu-singo --site (TZ=Asia/Seoul 로)
   빈칸 · 예시(8,700원 · 7명 · 별지) · 일액(6,500 · 딱 4월 1일 · 직접 · 입찰공고일 없음) · 기한(12월분 · 토요일 → 월요일 · 일요일 → 월요일) ·
   신고일(딱 기한 · 하루 넘음 · 달 끝 전 · 없음 · 달 끝날) · 날수(2월 30일 · 윤년 2월 29일) · 줄(성명만 · 일수만 · 등록번호 12자리 · 하이픈 없음 · 공백 ·
   여권 없음) · 별지 꽉(23명) · 앞쪽만 · 신고월 없음 · 신고서 빈칸 여럿 · 소수 근로일수"""
import copy
import datetime

import f_toejik_geunroilsu_singo as m

D = datetime.date


def S(ex=None, s=None, w=None):
    """ex = 셈 값 바꿈 · s = 신고서 값 바꿈(EX_S 통째로) · w = 근로자 줄(EX_W 통째로)"""
    out = {"EX": dict(ex or {})}
    if s is not None:
        es = copy.deepcopy(m.EX_S)
        es.update(s)
        out["EX_S"] = es
    if w is not None:
        out["EX_W"] = w
    return out


BLANK = {k: None for k in m.EX}
BLANK_S = {k: None for k in m.EX_S}
W = m.EX_W
R = "000000-0000000"


def P(n, days=10, **kw):
    """사람 n 명(가상) — 이름 · 등록번호 · 일수 · 주소 · 전화 · 직종 · 국적 · 여권"""
    out = []
    for i in range(1, n + 1):
        out.append((f"근로자{i}", R, days, f"가나시 마바구 {i}길", "010-0000-0000", "보통인부", None, None))
    return out


def W2(i, **kw):
    """예시 줄 i(1부터)만 바꿈"""
    w = [list(x) for x in W]
    keys = ["성명", "주민", "일수", "주소", "전화", "직종", "국적", "여권"]
    for k, v in kw.items():
        w[i - 1][keys.index(k)] = v
    return [tuple(x) for x in w]


SCENES = {
    "빈칸": S(BLANK, BLANK_S, []),
    "예시": S(),
    "일액_6500": S(dict(입찰공고일=D(2026, 3, 31))),
    "일액_딱4월1일": S(dict(입찰공고일=D(2026, 4, 1))),
    "일액_직접": S(dict(일액=7000)),
    "일액_직접과공고일": S(dict(일액=6500, 입찰공고일=D(2026, 9, 1))),
    "입찰공고일없음": S(dict(입찰공고일=None)),
    "입찰공고일없음_사람만": S(dict(입찰공고일=None, 신고년=None, 신고월=None)),
    "12월분": S(dict(신고년=2026, 신고월=12), s=dict(신고일=D(2027, 1, 12))),
    "기한_토요일": S(dict(신고년=2027, 신고월=4), s=dict(신고일=D(2027, 5, 17))),
    "기한_토요일_하루넘음": S(dict(신고년=2027, 신고월=4), s=dict(신고일=D(2027, 5, 18))),
    "기한_일요일": S(dict(신고년=2028, 신고월=9), s=dict(신고일=D(2028, 10, 16))),
    "신고일_딱기한": S(s=dict(신고일=D(2027, 4, 15))),
    "신고일_하루넘음": S(s=dict(신고일=D(2027, 4, 16))),
    "신고일_달끝전": S(s=dict(신고일=D(2027, 3, 25))),
    "신고일_달끝날": S(s=dict(신고일=D(2027, 3, 31))),
    "신고일없음": S(s=dict(신고일=None)),
    "2월_30일": S(dict(신고년=2027, 신고월=2), s=dict(신고일=D(2027, 3, 10)), w=W2(1, 일수=30)),
    "윤년2월_29일": S(dict(신고년=2028, 신고월=2), s=dict(신고일=D(2028, 3, 10)), w=W2(1, 일수=29)),
    "윤년2월_30일": S(dict(신고년=2028, 신고월=2), s=dict(신고일=D(2028, 3, 10)), w=W2(2, 일수=30)),
    "성명만": S(w=W2(2, 일수=None)),
    "일수만": S(w=W2(3, 성명=None)),
    "등록번호12자리": S(w=W2(1, 주민="000000-000000")),
    "등록번호하이픈없음": S(w=W2(1, 주민="0000000000000")),
    "등록번호공백": S(w=W2(1, 주민="000000 - 0000000")),
    "여권없음": S(w=W2(5, 여권=None)),
    "여럿틀림": S(w=W2(1, 주민="0000", 일수=None)[:2] + W2(5, 여권=None)[2:]),
    "별지꽉": S(w=P(23, days=12)),
    "앞쪽만": S(w=P(3, days=20)),
    "한명": S(w=P(1, days=7)),
    "신고월없음": S(dict(신고월=None)),
    "신고서빈칸여럿": S(s=dict(공제가입번호=None, 상호=None, 납부일=None, 대표자=None)),
    "소수근로일수": S(w=W2(4, 일수=9.5)),
}


def show(exp):
    a, b = exp["셈"], exp["신고서"]
    return (f"| {str(a.get('기한'))[:18]} | {str(a.get('신고확인'))[:12]} | {str(a.get('적용일액'))[:6]} | {a.get('인원')}명 {a.get('일수합')}일 "
            f"| {str(a.get('부금'))[:10]} | {str(a.get('줄확인'))[:24]} | {b.get('월분표시')}")
