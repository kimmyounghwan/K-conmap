# -*- coding: utf-8 -*-
"""agency_deep.py(발주기관 정밀 보고서 숫자) 가 제대로 세는지 확인합니다. (2026-09-28)

    python tools\\test_agency_deep.py

진짜 자료를 건드리지 않게 **임시 폴더**와 **지어낸 자료**로만 돕니다.
"""
import gzip
import io
import json
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd                                            # noqa: E402
import agency_deep as AD                                       # noqa: E402

OK = FAIL = 0


def eq(got, want, what):
    global OK, FAIL
    if got == want:
        OK += 1
        print("  ✓ %s" % what)
    else:
        FAIL += 1
        print("  ✗ %s — 나온 값 %r · 바란 값 %r" % (what, got, want))


def 줄(inst, no, dt, rate, amt=50_000_000, win="가건설", bno="1111111111", sj=None, np_=None, mgn=None):
    return {"발주기관": inst, "공고번호": no, "dt": pd.Timestamp(dt), "rate": rate, "amt": amt,
            "1순위업체": win, "bizno": bno, "sj": sj, "np": np_, "mgn": mgn, "공고명": "시험 공사 " + no}


def 전국(n_old=40, n_new=40):
    """하한율 오르기 전 88.4% · 오른 뒤 90.3% — 주마다 30건 넘게"""
    rows = []
    k = 0
    for w in range(n_old):
        for i in range(31):
            k += 1
            rows.append(줄("전국기관%d" % (i % 5), "N%06d" % k,
                          pd.Timestamp("2024-06-03") + pd.Timedelta(days=7 * w + i % 5), 88.4))
    for w in range(n_new):
        for i in range(31):
            k += 1
            rows.append(줄("전국기관%d" % (i % 5), "N%06d" % k,
                          pd.Timestamp("2025-03-10") + pd.Timedelta(days=7 * w + i % 5), 90.3))
    return rows


class 가짜보관함:
    def __init__(self, d):
        self.d = d

    def iter_notices(self):
        for no, v in self.d.items():
            yield no, v


def main():
    print("1) 하한율 오른 날을 자료로 찾기")
    df = pd.DataFrame(전국())
    eq(AD.find_cut(df), "2025-03-10", "오른 첫 주의 월요일")
    eq(AD.find_cut(df[df["rate"] < 89]), AD.CUT_FALLBACK, "오른 흔적이 없으면 기본값")

    print("2) 모으는 폭이 넓어진 달")
    rows = []
    for m in range(1, 13):
        for i in range(100 if m < 10 else 600):
            rows.append(줄("x", "D%02d%04d" % (m, i), "2025-%02d-10" % m, 90.0))
    dd = pd.DataFrame(rows)
    eq(AD.find_dense(dd), "2025-10", "건수가 여섯 배로 뛴 달")
    my = AD.month_years(dd, "2025-10")
    eq((my[0], my[9]), (1, 0), "넓어진 뒤의 달은 분모에서 빠짐")

    print("3) 이름이 바뀐 기관 묶기")
    cm = AD.canon_map(["전라남도 여수시", "전남광주통합특별시 여수시", "전라남도",
                       "전라남도 곡성군", "강원도 춘천시", "강원특별자치도 춘천시"])
    eq(cm.get("전라남도 여수시"), "전남광주통합특별시 여수시", "옛 이름 → 새 이름")
    eq("전라남도" in cm, False, "도 본청(한 낱말)은 안 묶음")
    eq("전라남도 곡성군" in cm, False, "새 이름이 자료에 없으면 안 묶음")
    eq(cm.get("강원도 춘천시"), "강원특별자치도 춘천시", "강원도도 묶음")

    print("4) 1·2위 차이")
    eq(AD._gap_of([[1, "", "", 1000, 90.10], [2, "", "", 1001, 90.13]]), 0.03, "0.03%p")
    eq(AD._gap_of([[1, "", "", 1000, 90.10], [2, "", "", 990, 89.2]]), None, "2위가 더 싸면(하한 미달 끼어듦) 안 잼")
    eq(AD._gap_of([[1, "", "", 1000, 90.10]]), None, "한 곳뿐이면 안 잼")

    print("5) 한 벌 만들기 — 끝에서 끝까지")
    tmp = tempfile.mkdtemp(prefix="agdeep_")
    try:
        base = 전국()
        A = "전남광주통합특별시 여수시"
        O = "전라남도 여수시"
        # 옛 이름: 하한율 오르기 전 25건(88.3%) · 새 이름: 오른 뒤 30건(90.2~90.4%)
        for i in range(25):
            base.append(줄(O, "O%03d" % i, pd.Timestamp("2024-07-01") + pd.Timedelta(days=i), 88.3,
                           win="옛업체(주)", bno=""))
        for i in range(30):
            base.append(줄(A, "A%03d" % i, pd.Timestamp("2025-06-02") + pd.Timedelta(days=i),
                           90.2 + (i % 3) / 10 + 0.01, win="새건설 주식회사" if i % 2 else "옛업체(주)",
                           sj=100.1 if i < 10 else None, np_=40 if i < 5 else None, mgn=0.01 if i < 8 else None))
        df = pd.DataFrame(base)
        os.makedirs(os.path.join(tmp, "agency"))
        names = [[A, 30, 3], [O, 25, 7]] + [["전국기관%d" % i, 999, 1] for i in range(5)]
        with io.open(os.path.join(tmp, "agency", "names.json"), "w", encoding="utf-8") as f:
            json.dump(names, f, ensure_ascii=False)
        # 순위 보관함: 새 이름 공고 3건 · 옛 이름 공고 1건 · 모르는 공고 1건
        rk = {
            "A000": {"d": "20250602", "n": 999, "r": [[1, "2222222222", "새건설 주식회사", 1000, "90.21"],
                                                     [2, "3333333333", "다른건설", 1001, "90.25"]]},
            "A001": {"d": "20250603", "n": 12, "r": [[1, "3333333333", "다른건설", 1000, "90.31"],
                                                    [2, "2222222222", "새건설 주식회사", 1004, "90.71"]]},
            "O000": {"d": "20240701", "n": 5, "r": [[1, "4444444444", "옛업체(주)", 1000, "88.31"],
                                                   [2, "3333333333", "다른건설", 1002, "88.33"]]},
            "ZZZ": {"d": "20250601", "n": 3, "r": [[1, "5", "모름", 1, "90"]]},
        }
        # first.json(최근) 한 벌 — 면허가 실려 있습니다
        fj = {"con": {"A002": {"no": "A002", "inst": A, "dt": "2025-06-04 10:00:00", "nrank": 7,
                               "lic": ["토목공사업/0001"],
                               "corps": [["다른건설", 1000, 90.40, "3333333333"],
                                         ["새건설 주식회사", 1003, 90.43, "2222222222"]]}},
              "serv": {"S1": {"no": "S1", "inst": A, "dt": "2025-06-05", "corps": [["용역", 1, 90, ""], ["b", 2, 91, ""]]}}}
        fp = os.path.join(tmp, "first.json.gz")
        with gzip.open(fp, "wt", encoding="utf-8") as f:
            json.dump(fj, f, ensure_ascii=False)
        n = AD.build(df, tmp, first_paths=[fp], ranks_mod=가짜보관함(rk), log=lambda *_: None)
        with io.open(os.path.join(tmp, "agency_deep", "3.json"), encoding="utf-8") as f:
            ch3 = json.load(f)
        with io.open(os.path.join(tmp, "agency_deep", "7.json"), encoding="utf-8") as f:
            ch7 = json.load(f)
        with io.open(os.path.join(tmp, "agency_deep", "meta.json"), encoding="utf-8") as f:
            meta = json.load(f)
        d = ch3[A]
        eq(n >= 1, True, "기관이 만들어짐")
        eq(ch7[O], {"=": A, "c": 3}, "옛 이름 자리에는 새 이름 쪽지")
        eq(d["olds"], [[O, 25]], "옛 이름 기록 25건을 함께 셈")
        eq(d["w"]["n"], 55, "낙찰 3년치 = 옛 25 + 새 30")
        eq(d["w"]["cut"], meta["cut"], "하한율 오른 날이 meta 와 같음")
        eq(d["w"]["nn"], 30, "투찰률은 오른 뒤 30건만")
        eq(d["w"]["mix"], False, "섞지 않음")
        eq(d["w"]["old"]["n"], 25, "오르기 전 25건은 따로")
        eq(88 < d["w"]["old"]["med"] < 89, True, "오르기 전 가운데값 88%대")
        eq(90 < d["w"]["med"] < 90.5, True, "오른 뒤 가운데값 90%대")
        eq(sum(b[1] for b in d["b"]), 30, "금액대 표도 오른 뒤만")
        eq(d["r"]["n"], 4, "순위 기록 = 보관함 3(옛 이름 포함) + 최근 1 (모르는 공고·용역 뺌)")
        eq(d["r"]["np"]["max"], 999, "참가 999 그대로")
        eq(d["r"]["gap"]["n"], 4, "1·2위 차이 4건")
        eq(d["reg"][0][0] in ("다른건설", "새건설 주식회사"), True, "자주 오는 업체 맨 위")
        eq([x for x in d["reg"] if x[0] == "다른건설"][0][2:4], [4, 2], "다른건설: 4번 들어와 2번 낙찰")
        eq(d["lic"]["rows"][0][0], "토목공사업", "면허는 최근분(first.json)에서")
        eq(d["sj"]["n"], 10, "사정률 10건")
        eq(d["mg"]["n"], 8, "창 8건")
        eq(d["wins"][0][0], "옛업체(주)", "낙찰 많이 한 곳 — 이름으로 셈(번호 없는 줄도)")
        eq(d["wins"][0][2], 40, "옛업체: 옛 25 + 새 15")
        eq(len(d["w"]["m"]), 12, "달마다 12칸")
        eq(set(meta) >= {"cut", "dense", "p50", "wr", "np", "gap", "alias", "rn"}, True, "meta 칸")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print("\n%d 통과 · %d 실패" % (OK, FAIL))
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
