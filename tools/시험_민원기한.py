# -*- coding: utf-8 -*-
"""시험_민원기한 — 기관 처리기간(«받은 날부터 N일») 끝날이 민원 처리에 관한 법률 제19조② 그대로인지
   (2026-11-17 G741 — 공사감리자 지정 신청서 · (임시)사용승인 신청서의 «처리 기한» 을 달력 날 +7 로 셈하던 것을 찾음 →
    받은 날을 1일로 넣고 토 · 일 · 공휴일 빼고 7번째 근무일)

  python tools/시험_민원기한.py

  ① 엑셀 식 흉내(숨은 공휴일 표 · 고정점 되풀이) = 근무일을 하나씩 센 셈 — 2025 ~ 2028 모든 날 × 6 · 7 · 10 · 14 · 15 · 20 · 30일
  ② 손으로 고른 날(설 · 추석 · 성탄절 · 해 넘김 · 받은 날이 일요일)
  ③ 평일 공휴일 표 = 2027 달력(f_dalryeok_2027.HOL — 법령 · 월력요항 세 번 본 것)의 평일 공휴일 + 2026. 12. 25.
  ④ 되풀이 횟수가 모자라지 않음(30일까지)
"""
import datetime
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "forms2"))
import 민원기한 as M  # noqa: E402

D = datetime.date
ONE = datetime.timedelta(days=1)


def _달력공휴():
    """f_dalryeok_2027.py 의 HOL 날짜(글로 읽음 — openpyxl 없는 PC 파이썬에서도 돌게)"""
    import ast
    tree = ast.parse(open(os.path.join(HERE, "forms2", "f_dalryeok_2027.py"), encoding="utf-8").read())
    Y = hol = None
    for nd in tree.body:
        if isinstance(nd, ast.Assign) and len(nd.targets) == 1 and isinstance(nd.targets[0], ast.Name):
            if nd.targets[0].id == "Y":
                Y = nd.value.value
            if nd.targets[0].id == "HOL":
                hol = nd.value
    out = set()
    for k in hol.keys:
        a = k.args
        y = Y if isinstance(a[0], ast.Name) else a[0].value
        out.add(D(y, a[1].value, a[2].value))
    assert len(out) == 24, len(out)
    return out


def main():
    bad = 0
    # ①
    b1 = n1 = 0
    d = D(2025, 1, 1)
    while d <= D(2028, 12, 31):
        for n in (6, 7, 10, 14, 15, 20, 30):
            n1 += 1
            if M.식흉내(d, n) != M.처리끝(d, n):
                b1 += 1
                if b1 <= 5:
                    print(f"  ✗ {d} {n}일: 식 {M.식흉내(d, n)} ≠ 셈 {M.처리끝(d, n)}")
        d += ONE
    print(f"  {'✓' if not b1 else '❌'} ① 엑셀 식 흉내 = 근무일 셈 — {n1:,}가지 중 틀림 {b1}")
    bad += b1
    # ②
    손 = [((2027, 2, 5), 7, (2027, 2, 17)),    # 금 — 설(2. 6. ~ 2. 9.) 건너 2. 17.
          ((2027, 9, 13), 7, (2027, 9, 24)),   # 월 — 추석(9. 14. ~ 16.) 건너
          ((2027, 2, 7), 7, (2027, 2, 18)),    # 일요일에 받음 — 그날 안 셈 · 설 연휴 끝난 2. 10. 이 1일
          ((2026, 12, 24), 7, (2027, 1, 5)),   # 성탄절 · 신정 건너 해 넘김
          ((2027, 3, 2), 7, (2027, 3, 10)),    # 화 — 쉬는 날은 주말만
          ((2027, 3, 1), 7, (2027, 3, 10)),    # 3·1절(공휴일)에 받음 — 그날 안 셈
          ((2027, 5, 3), 10, (2027, 5, 19)),   # 대체공휴일에 받음(안 셈) · 어린이날 · 부처님 오신 날 건너
          ((2027, 12, 20), 7, (2027, 12, 29))]  # 대체공휴일(12. 27.)
    b2 = 0
    for dd, n, want in 손:
        got = M.처리끝(D(*dd), n)
        if got != D(*want) or M.식흉내(D(*dd), n) != D(*want):
            b2 += 1
            print(f"  ✗ {D(*dd)} 받음 · {n}일 = {got} (바라는 값 {D(*want)})")
    print(f"  {'✓' if not b2 else '❌'} ② 손으로 고른 날 {len(손)}개 중 틀림 {b2}")
    bad += b2
    # ③
    want = {x for x in _달력공휴() if x.weekday() < 5} | {D(2026, 12, 25)}
    want = {x for x in want if M.셈첫날 <= x <= M.셈끝날}
    got = set(M.평일공휴)
    b3 = 0 if got == want and len(M.평일공휴) == len(got) else 1
    if b3:
        print(f"  ✗ 빠짐 {sorted(want - got)} · 더 있음 {sorted(got - want)}")
    if any(x.weekday() >= 5 for x in M.평일공휴):
        b3 += 1
        print("  ✗ 평일공휴 에 토 · 일요일이 들었음(이미 쉬는 날 — 두 번 뺌)")
    print(f"  {'✓' if not b3 else '❌'} ③ 평일 공휴일 표 {len(M.평일공휴)}일 = 2027 달력 평일 공휴일 + 2026. 12. 25.")
    bad += b3
    # ④
    b4, most = 0, 0
    d = M.셈첫날
    while d <= M.셈끝날:
        for n in (6, 7, 10, 14, 15, 20, 30):
            want_e = M.처리끝(d, n)
            k = next((k for k in range(0, M.되풀이 + 1) if M.식흉내(d, n, k) == want_e), None)
            if k is None:
                b4 += 1
            else:
                most = max(most, k)
        d += ONE
    print(f"  {'✓' if not b4 else '❌'} ④ 되풀이 {M.되풀이}번 안에 끝날에 닿음(가장 많이 든 것 {most}번) — 못 닿은 것 {b4}")
    bad += b4
    print(("✅" if not bad else "❌") + f" 시험_민원기한 {'모두 맞음' if not bad else f'틀림 {bad}'}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
