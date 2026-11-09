# -*- coding: utf-8 -*-
"""📅 G620 «2027 달력» 생성기 시험 — python3 tools/시험_달력2027.py (인터넷 없음 · 생성기 tools/forms2/f_dalryeok_2027.py 를 켜기만)
소장님 11-09 「이거 시작하자」(2027 달력) · 「꼭 검색 되게」 · 「달력 어플도 참고하고, 웹에 있는 달력도 참고해서 가장 유용하게」.
  ① 공휴일 24 · 대체 7 · 주 5일 휴일 119(일 52 · 토 52 · 평일 공휴일 15) · 3일 이상 연휴 10번 = 월력요항 · 요일이 이름과 맞음
  ② 음력 — 하루씩 이어짐(1일이면 달 바뀜) · 설날 1.1 · 대보름 1.15 · 단오 5.5 · 칠석 7.7 · 추석 8.15 · 음력 날 수 29 · 30 · 손없는 날 = 음력 9 · 10 · 19 · 20 · 29 · 30
  ③ 주차 = 엑셀 WEEKNUM(일요일 시작) · 1 ~ 53 이어짐 · 날 칸 글 길이(달 장 한 줄에 들어감)
  ④ 연차 꿀팁 — 하루씩 다시 셈(연차 날만 평일 · 나머지는 토 · 일 · 공휴일) · 9/11 ~ 9/19(2일) · 10/2 ~ 10/11(4일) · 5/1 ~ 5/5(1일) 들어 있음 · 더 나은 것에 가려진 것 없음
  ⑤ 기한 셈(민법 제157 · 160 · 161조) — 손으로 푼 열두 경우 · 만료일은 토 · 일 · 공휴일이 아님
  ⑥ 근무일 셈 — 이월 · 한 해 · 걸침 · 현장 쉬는 날(이미 공휴일 · 같은 날 · 토 · 일 · 기간 밖)
  ⑦ 화면 글 규칙 — «무료» · «클로드» · «값만» 안 씀 (진짜 이름 검사는 올리기 전 따로 — 이름 목록을 저장소에 안 둠)
"""
import datetime
import importlib.util
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
F2 = os.path.join(HERE, "forms2")

bad = n = 0


def ok(name, cond, got=None):
    global bad, n
    n += 1
    if not cond:
        bad += 1
    print(("  ✓ " if cond else "  ✗ ") + name + ("" if cond or got is None else f" = {got!r}"))


def main():
    sys.path.insert(0, F2)
    os.chdir(F2)
    spec = importlib.util.spec_from_file_location("dal", os.path.join(F2, "f_dalryeok_2027.py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    D, DAY, Y = datetime.date, datetime.timedelta(days=1), 2027
    days = [D(Y, 1, 1) + i * DAY for i in range(365)]

    print("① 공휴일 · 연휴")
    ok("공휴일 24 · 대체공휴일 7", len(m.HOL) == 24 and sum(v == "대체공휴일" for v in m.HOL.values()) == 7)
    ok("주 5일 휴일 119 · 근무일 246", sum(m.쉼5(d) for d in days) == 119 and sum(not m.쉼5(d) for d in days) == 246)
    ok("평일 공휴일 15 · 토요일 공휴일 5 · 일요일 공휴일 4", (sum(d.weekday() < 5 for d in m.HOL), sum(d.weekday() == 5 for d in m.HOL), sum(d.weekday() == 6 for d in m.HOL)) == (15, 5, 4))
    ok("3일 이상 연휴 10번 = 월력요항", [f"{a.month}/{a.day}~{b.month}/{b.day}" for a, b in m.연휴들()] == m.LONG_SRC)
    대체 = [d for d, v in m.HOL.items() if v == "대체공휴일"]
    ok("대체공휴일은 모두 평일 · 앞날(1 ~ 3일 전)이 토 · 일 · 공휴일", all(d.weekday() < 5 and m.쉼5(d - DAY) for d in 대체), 대체)
    ok("현충일(6/6 일)은 대체 없음 · 6/7(월) 근무일", m.HOL.get(D(Y, 6, 6)) == "현충일" and not m.쉼5(D(Y, 6, 7)))
    ok("달마다 근무일 합 246 · 주 6일 293 · 날 365", sum(m.달셈(k)["근무"] for k in range(1, 13)) == 246 and sum(m.달셈(k)["근무6"] for k in range(1, 13)) == 293
       and sum(m.달셈(k)["날"] for k in range(1, 13)) == 365)

    print("② 음력 · 손없는 날")
    prev, 이어짐 = m.음(D(Y, 1, 1)), True
    for d in days[1:]:
        cur = m.음(d)
        if cur[1] != 1 and cur != (prev[0], prev[1] + 1):
            이어짐 = False
            print("    끊김", d, prev, cur)
        if cur[1] == 1 and not (prev[1] in (29, 30)):
            이어짐 = False
            print("    짧은 달", d, prev, cur)
        prev = cur
    ok("음력이 하루씩 이어짐 · 달 끝은 29 · 30일", 이어짐)
    ok("설날 1.1 · 대보름 1.15 · 단오 5.5 · 칠석 7.7 · 추석 8.15 · 1/1 = 병오년 11.24",
       (m.음(D(Y, 2, 7)), m.음(D(Y, 2, 21)), m.음(D(Y, 6, 9)), m.음(D(Y, 8, 8)), m.음(D(Y, 9, 15)), m.음(D(Y, 1, 1))) == ((1, 1), (1, 15), (5, 5), (7, 7), (8, 15), (11, 24)))
    손 = [d for d in days if m.음(d)[1] in m.SON]
    따로 = set()                              # 음력 달마다 따로 셈(달 첫날 + 8 · 9 · 18 · 19 · 28 · (30일 달이면) 29)
    starts = [m.LUN0[1]] + [x for _, x in m.LUN] + [D(Y + 1, 1, 27)]       # 정미년 12월은 대(30일) — 다음 달 첫날 2028. 1. 27.
    for a, b in zip(starts, starts[1:]):
        for k in (8, 9, 18, 19, 28, 29):
            x = a + k * DAY
            if x < b and x.year == Y:
                따로.add(x)
    ok(f"손없는 날 = 음력 9 · 10 · 19 · 20 · 29 · 30 — 달마다 따로 센 것과 같음({len(손)}일)", set(손) == 따로, sorted(set(손) ^ 따로))
    ok("2월 손없는 날 5 · 6 · 15 · 16 · 25 · 26일", m.달셈(2)["손"] == [5, 6, 15, 16, 25, 26], m.달셈(2)["손"])
    ok("날 칸 둘째 줄 «음 1.1» · «음 12.30 · 손없는 날»", m.아랫글(D(Y, 2, 7)) == "음 1.1" and m.아랫글(D(Y, 2, 6)) == "음 12.30 · 손없는 날")

    print("③ 주차 · 날 칸 글")
    ok("주차 = WEEKNUM(일요일 시작): 1/1 1주 · 1/3 2주 · 12/31 53주", (m.주차(D(Y, 1, 1)), m.주차(D(Y, 1, 3)), m.주차(D(Y, 12, 31))) == (1, 2, 53))
    ws = [m.주차(next(d for d in w if d)) for k in range(1, 13) for w in m.주들(k)]
    ok("달 장의 주차가 1 ~ 53 이어짐(달이 바뀌는 주는 두 번)", sorted(set(ws)) == list(range(1, 54)), sorted(set(ws))[:5])
    긴 = max((len(m.윗글(d)[0]), d) for d in days)
    ok("날 칸 첫 줄 글 12자 안(가장 긴 «입춘 · 안전점검의 날» 이 달 장 그림에서 한 줄 — 11-09 확인)", 긴[0] <= 12, 긴)
    ok("4일마다 안전점검의 날(공휴일인 10/4 는 안 적음) · 4/16 국민안전의 날 · 5/25 방재의 날",
       all(("안전점검의 날" in m.윗글(D(Y, k, 4))[0]) == (D(Y, k, 4) not in m.HOL) for k in range(1, 13)) and m.윗글(D(Y, 10, 4))[0] == "대체공휴일" and
       m.윗글(D(Y, 4, 16))[0] == "국민안전의 날" and m.윗글(D(Y, 5, 25))[0] == "방재의 날")

    print("④ 연차 꿀팁")
    tips = m.연차꿀팁()
    다시 = all(all((not (d.weekday() >= 5 or d in m.HOL)) == (d in gaps) for d in (a + i * DAY for i in range((b - a).days + 1))) for gaps, a, b in tips)
    ok("하루씩 다시 셈 — 연차 날만 평일 · 나머지 쉬는 날", 다시)
    have = {(a, b, len(g)) for g, a, b in tips}
    ok("추석 9/11 ~ 9/19(연차 2) · 개천절 · 한글날 10/2 ~ 10/11(연차 4) · 노동절 · 어린이날 5/1 ~ 5/5(연차 1) · 설 2/6 ~ 2/14(연차 3)",
       {(D(Y, 9, 11), D(Y, 9, 19), 2), (D(Y, 10, 2), D(Y, 10, 11), 4), (D(Y, 5, 1), D(Y, 5, 5), 1), (D(Y, 2, 6), D(Y, 2, 14), 3)} <= have, sorted(have))
    가림 = [(a, b) for g, a, b in tips for g2, a2, b2 in tips if (a, b) != (a2, b2) and not (b < a2 or b2 < a)
            and len(g2) <= len(g) and (b2 - a2) >= (b - a) and (len(g2) < len(g) or (b2 - a2) > (b - a))]
    ok("더 나은 것(연차 적고 · 길게)에 가려진 것 없음 · 연차 1 ~ 4일", not 가림 and all(1 <= len(g) <= 4 for g, _, _ in tips), 가림)

    print("⑤ 기한 셈 — 손으로 푼 열두 경우")
    cases = [((D(Y, 1, 23), 14, "일", "빼고"), (D(Y, 2, 6), D(Y, 2, 10))),      # 설 연휴 · 대체까지 넘김
             ((D(Y, 1, 30), 1, "개월", "빼고"), (D(Y, 2, 28), D(Y, 3, 2))),     # 2/31 없음 → 2월 끝(일) → 3·1절 → 3/2
             ((D(Y, 7, 14), 1, "개월", "빼고"), (D(Y, 8, 14), D(Y, 8, 17))),    # 토 → 광복절 → 대체 → 8/17
             ((D(Y, 3, 1), 10, "일", "넣고"), (D(Y, 3, 10), D(Y, 3, 10))),      # 0시부터 — 첫날 셈
             ((D(Y, 4, 30), 2, "주", "빼고"), (D(Y, 5, 14), D(Y, 5, 14))),
             ((D(Y, 3, 30), 1, "개월", "빼고"), (D(Y, 4, 30), D(Y, 4, 30))),    # 기산 3/31 → 4/31 없음 → 4/30
             ((D(Y, 2, 28), 1, "년", "빼고"), (D(Y + 1, 2, 29), D(Y + 1, 2, 29))),  # 기산 3/1 → 2028. 3. 1. 전날(윤년)
             ((D(Y, 12, 30), 2, "일", "빼고"), (D(Y + 1, 1, 1), D(Y + 1, 1, 3))),   # 2028. 1. 1.(토) → 3일(월)
             ((D(Y, 9, 10), 3, "일", "빼고"), (D(Y, 9, 13), D(Y, 9, 13))),
             ((D(Y, 9, 10), 4, "일", "빼고"), (D(Y, 9, 14), D(Y, 9, 17))),      # 추석 연휴 사흘 넘김
             ((D(Y, 10, 1), 1, "주", "넣고"), (D(Y, 10, 7), D(Y, 10, 7))),
             ((D(Y, 1, 14), 1, "개월", None), (D(Y, 2, 14), D(Y, 2, 15)))]     # 첫날 비우면 빼고 · 2/14(일) → 2/15
    for (s, k, u, c), want in cases:
        got = m.기한(s, k, u, c)
        ok(f"{s} + {k}{u}({c or '비움'}) → 끝날 {want[0]} · 만료 {want[1]}", got == want, got)
    ok("만료일은 늘 평일(토 · 일 · 2027 공휴일 아님)", all(not (m.기한(*c)[1].weekday() >= 5 or m.기한(*c)[1] in m.HOL) for c, _ in cases))
    ok("단위 비우면 일 · 기간 0 · 빈 시작일 → 없음", m.기한(D(Y, 1, 23), 14, None, "빼고") == (D(Y, 2, 6), D(Y, 2, 10)) and m.기한(D(Y, 1, 23), 0, "일", "빼고") == (None, None)
       and m.기한(None, 3, "일", "빼고") == (None, None))

    print("⑥ 근무일 셈")
    r = m.셈(D(Y, 1, 1), D(Y, 12, 31), [])
    ok("한 해 — 365 · 246 · 293 · 쉬는 날 119", (r["날수"], r["근무5"], r["근무6"], r["쉬는5"]) == (365, 246, 293, 119), r)
    r = m.셈(D(Y - 1, 12, 1), D(Y, 1, 31), [])
    ok("2026. 12. 1. ~ 2027. 1. 31. → 1월만(31 · 20)", (r["셈시작"], r["날수"], r["근무5"]) == (D(Y, 1, 1), 31, 20), r)
    r = m.셈(D(Y, 5, 1), D(Y, 5, 31), [D(Y, 5, 5), D(Y, 5, 9), D(Y, 6, 2), D(Y, 5, 14), D(Y, 5, 14), D(Y, 5, 15)])
    st = [r[f"더쉼판#{j}"] for j in range(1, 7)]
    ok("현장 쉬는 날 여섯 — 이미 공휴일 · 일요일 · 기간 밖 · 평일 · 같은 날 · 토요일", st == ["이미 공휴일", "일요일 · 안 뺌", "기간 밖", "✓ 평일 · 뺌", "앞 칸과 같은 날", "✓ 토요일 · 주 6일만 뺌"], st)
    ok("→ 5월 근무일 18 − 1 = 17 · 주 6일 22 − 2 = 20", (r["근무5"], r["근무6"], r["더쉼수"]) == (m.달셈(5)["근무"] - 1, m.달셈(5)["근무6"] - 2, 2), r)
    ok("끝날이 앞 · 2027 밖 · 하나만", m.셈(D(Y, 5, 1), D(Y, 4, 1), [])["판정"] == "⚠ 끝날이 시작일보다 앞입니다" and
       m.셈(D(Y + 1, 1, 5), D(Y + 1, 6, 30), [])["판정"] == "⚠ 2027년과 겹치는 날이 없습니다" and m.셈(D(Y, 1, 5), None, [])["판정"] == "⚠ 시작일 · 끝날을 둘 다 날짜로 적으세요")

    print("⑦ 화면 글 규칙")
    src = open(os.path.join(F2, "f_dalryeok_2027.py"), encoding="utf-8").read()
    body = "\n".join(l for l in src.splitlines() if not l.lstrip().startswith("#") and "«무료» 안 씀" not in l)
    ok("«무료» 안 씀(주석 빼고)", "무료" not in re.sub(r'"""[\s\S]*?"""', "", body))
    ok("«클로드» · «값만» · «수식 없음» 안 씀", not re.search(r"클로드|값만|수식 없음", re.sub(r'"""[\s\S]*?"""', "", body)))
    print(f"\n{'✗' if bad else '✓'} 시험_달력2027 {n - bad}/{n}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
