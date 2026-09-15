# -*- coding: utf-8 -*-
"""ranks3y.py 가 제대로 담고·읽고·버리는지 확인합니다. (2026-09-15)

    python tools\\test_ranks3y.py

진짜 자료를 건드리지 않게 **임시 폴더**에서만 돕니다.
"""
import datetime as dt
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import ranks3y as R                                            # noqa: E402

OK = FAIL = 0


def eq(got, want, what):
    global OK, FAIL
    if got == want:
        OK += 1
        print("  ✓ %s" % what)
    else:
        FAIL += 1
        print("  ✗ %s — 나온 값 %r · 바란 값 %r" % (what, got, want))


def corps(n, base=1000, bno=True):
    """[[업체명, 금액, 율, 사업자번호, 대표], ...] — 낮은 금액 순"""
    return [["업체%02d" % i, base + i, 90.0 + i / 100.0,
             ("10000000%02d" % i) if bno else "", "김%02d" % i]
            for i in range(1, n + 1)]


def main():
    tmp = tempfile.mkdtemp(prefix="ranks3y_")
    R.DIR = os.path.join(tmp, "ranks3y")
    R.PROG = os.path.join(R.DIR, "_진행.json")
    try:
        print("1) 담고 쓰기")
        eq(R.put("A001", "2026-09-03 15:00:00", 231, corps(3)), 3, "3줄 담김")
        eq(R.put("A002", "20260903150000", 5, corps(2)), 2, "날짜가 숫자여도 담김")
        eq(R.put("B001", "2026-08-20", 9, corps(4)), 4, "다른 달도 담김")
        eq(R.put("X", "", 1, corps(2)), 0, "날짜 없으면 안 담김")
        eq(R.put("Y", "2026-09-01", 1, []), 0, "순위가 비면 안 담김")
        eq(R.flush(), (2, 9), "달 2장 · 9줄 썼음")
        eq(R.months(), ["2026-08", "2026-09"], "달 목록")

        print("2) 읽기")
        m = R.read_month("2026-09")
        eq(sorted(m), ["A001", "A002"], "9월에 공고 2건")
        eq(m["A001"]["n"], 231, "전체 투찰수 231")
        eq([x[0] for x in m["A001"]["r"]], [1, 2, 3], "순위 1·2·3")
        eq(m["A001"]["r"][0][2], "업체01", "1순위 이름")
        eq(m["A001"]["r"][0][1], "1000000001", "1순위 사업자번호")
        eq(m["A001"]["r"][2][3], 1003, "3순위 금액")
        # 사업자번호가 없는 자료도 받아 줍니다 (조달청이 10%쯤 비워서 줍니다)
        eq(R.put("NOBNO", "2026-09-04", 2, corps(2, bno=False)), 2, "번호 없어도 담김")
        R.flush()
        eq(R.read_month("2026-09")["NOBNO"]["r"][0][1], "", "번호 자리는 비어 있음")

        print("3) 같은 공고를 다시 받으면 «나중 것» 이 이김")
        R.put("A001", "2026-09-03", 240, corps(5, base=2000))
        R.flush()
        m = R.read_month("2026-09")
        eq(len(m["A001"]["r"]), 5, "5줄로 바뀜")
        eq(m["A001"]["n"], 240, "전체 투찰수도 새 값")
        eq(m["A001"]["r"][0][3], 2001, "금액도 새 값")

        print("4) 청소(compact) — 겹친 줄 걷어내기")
        before, after = R.compact("2026-09")
        eq((before, after), (12, 9), "12줄 → 9줄")
        m = R.read_month("2026-09")
        eq(len(m["A001"]["r"]), 5, "청소 뒤에도 5줄")
        eq(len(m["A002"]["r"]), 2, "다른 공고는 그대로")

        print("5) 3년 지난 달 버리기")
        R.put("OLD1", "2021-01-05", 3, corps(3))
        R.flush()
        eq("2021-01" in R.months(), True, "옛 달이 생김")
        gone = R.trim(today=dt.date(2026, 9, 15))
        eq(gone, ["2021-01"], "옛 달만 버림")
        eq(R.months(), ["2026-08", "2026-09"], "남은 달")

        print("6) 3년 경계 — 딱 3년 전 달은 남는다")
        R.put("EDGE", "2023-10-02", 2, corps(2))
        R.flush()
        gone = R.trim(today=dt.date(2026, 9, 15))    # 기준 2023-09
        eq(gone, [], "2023-10 은 안 버림")
        eq("2023-10" in R.months(), True, "그대로 있음")

        print("7) 모두 훑기")
        eq(sorted(no for no, _ in R.iter_notices()),
           ["A001", "A002", "B001", "EDGE", "NOBNO"], "가진 공고 전부")

        print("8) 진행표·요약")
        eq(os.path.exists(R.PROG), True, "_진행.json 있음")
        print("  ·", R.summary())
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print()
    print("맞은 것 %d · 틀린 것 %d" % (OK, FAIL))
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
