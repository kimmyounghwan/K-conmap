# -*- coding: utf-8 -*-
"""G672 연차 관리대장 장면 24 — python3 tools/forms2/장면시험.py yeoncha-gwanri --site
   1년 미만 단계마다(촉구 전 · 중 · 지정 전 · 촉구 뒤 생긴 휴가 · 끝 무렵) · 윤년(2. 29.) · 말일(1. 31.) 입사 · 4명 이하 · 15시간 미만 · 80% 미만 ·
   25일 한도 · 21년차 · 남은 0 · 틀린 날(촉구 기간 밖 · 10일 넘은 회신 · 기한 지난 통보 · 지정 일수 어긋남) · 기준일이 입사 전 · 입사일 없음 · 딱 1년 · 1년 하루 전"""
import datetime

D = datetime.date

SCENES = {
    '1년미만_촉구전': {'EX': {'입사일': D(2026, 1, 1), '기준일': D(2026, 9, 20), '결근월': 1}, 'EX_USE': [(D(2026, 5, 4), 1, '개인')], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': D(2026, 10, 2), 'EX_HOE': None, 'EX_TONG': None},
    '1년미만_촉구중': {'EX': {'입사일': D(2026, 1, 1), '기준일': D(2026, 10, 5)}, 'EX_USE': [], 'EX_REPLY': [(D(2026, 11, 2), 2)], 'EX_SET': [(D(2026, 12, 7), 7)], 'EX_CHOK': D(2026, 10, 5), 'EX_HOE': D(2026, 10, 13), 'EX_TONG': D(2026, 11, 25)},
    '1년미만_지정전': {'EX': {'입사일': D(2026, 1, 1), '기준일': D(2026, 11, 20)}, 'EX_USE': [(D(2026, 3, 3), 0.5, '반차')], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': D(2026, 10, 12), 'EX_HOE': D(2026, 10, 26), 'EX_TONG': D(2026, 12, 1)},
    '1년미만_단서촉구중': {'EX': {'입사일': D(2026, 1, 1), '기준일': D(2026, 12, 3)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': D(2026, 12, 2), 'EX_HOE': None, 'EX_TONG': None},
    '1년미만_단서지정': {'EX': {'입사일': D(2026, 1, 1), '기준일': D(2026, 12, 15)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '1년미만_끝무렵': {'EX': {'입사일': D(2026, 1, 1), '기준일': D(2026, 12, 28)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '1년미만_단서사이': {'EX': {'입사일': D(2026, 1, 1), '기준일': D(2026, 11, 30)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '윤년입사': {'EX': {'입사일': D(2024, 2, 29), '기준일': D(2026, 3, 1)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '말일입사': {'EX': {'입사일': D(2025, 1, 31), '기준일': D(2025, 2, 28)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '말일입사_하루전': {'EX': {'입사일': D(2025, 1, 31), '기준일': D(2025, 2, 27)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '4명이하': {'EX': {'상시': '4명 이하'}, 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '15시간미만': {'EX': {'주시간': '15시간 미만'}, 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '80미만': {'EX': {'입사일': D(2023, 3, 2), '기준일': D(2025, 5, 1), '출근율': '80% 미만', '개근달': 7}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '25일한도': {'EX': {'입사일': D(2000, 3, 2), '기준일': D(2026, 9, 3)}, 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '21년차': {'EX': {'입사일': D(2005, 3, 2), '기준일': D(2026, 3, 2)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '남은0': {'EX': {'입사일': D(2023, 3, 2), '기준일': D(2026, 9, 3)}, 'EX_USE': [(D(2026, 4, 1), 10, '긴 휴가'), (D(2026, 8, 3), 6, '여름')], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '틀린날들': {'EX': {}, 'EX_REPLY': [(D(2026, 10, 2), 9), (D(2026, 11, 6), 5)], 'EX_SET': [(D(2027, 1, 26), 3)], 'EX_CHOK': D(2026, 9, 15), 'EX_HOE': D(2026, 9, 28), 'EX_TONG': D(2027, 1, 5)},
    '기준이입사전': {'EX': {'입사일': D(2026, 12, 1), '기준일': D(2026, 11, 13)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '입사일없음': {'EX': {'입사일': None}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '촉구전_1년이상': {'EX': {'입사일': D(2023, 3, 2), '기준일': D(2026, 4, 10)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '지정전_1년이상': {'EX': {'입사일': D(2023, 3, 2), '기준일': D(2026, 12, 1)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '지정지남_1년이상': {'EX': {'입사일': D(2023, 3, 2), '기준일': D(2027, 2, 10)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '딱1년': {'EX': {'입사일': D(2025, 9, 3), '기준일': D(2026, 9, 3)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
    '1년하루전': {'EX': {'입사일': D(2025, 9, 3), '기준일': D(2026, 9, 2)}, 'EX_USE': [], 'EX_REPLY': [], 'EX_SET': [], 'EX_CHOK': None, 'EX_HOE': None, 'EX_TONG': None},
}


def show(exp):
    a = exp["관리대장"]
    return f"| 근속 {a.get('근속글')!s:<9} 일수 {a.get('발생일수')!s:<3} 남은 {a.get('남은일수')!s:<4} | {a.get('할일') or a.get('판정')}"
