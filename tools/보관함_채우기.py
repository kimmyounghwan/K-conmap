# -*- coding: utf-8 -*-
"""📊 3년치 순위 보관함 채우기 — 소장님 PC 전용 (2026-09-16)

소장님(2026-09-16): 「자료는 내 컴퓨터에 두는 걸로 하자. 적산 자료를 그렇게 한 것처럼」
                    「내가 클로드에게 부탁하면 클로드가 만들어 주면 되잖아」

■ 무엇을 하나
    data/seed/first.json.gz 에 들어 있는 «개찰 순위 30곳» 을
    data/store/ranks3y/YYYY-MM.csv.gz 에 옮겨 담습니다.

■ 왜 이게 되나 — 자료가 이미 여기 있습니다
    씨앗(data/seed)은 저장소가 날아갔을 때 쓰는 복구용인데, 그 안에
    개찰 저장소가 통째로 들어 있습니다. 순위(corps)까지 같이요.
    씨앗은 주 1회 다시 구워 저장소에 커밋되므로 «2_받고올리기.bat» 를 돌릴 때마다
    소장님 PC 로 따라 내려옵니다. 조달청을 부르지 않고, 인터넷도 안 씁니다.

■ 왜 저장소에 안 올리나
    data/store/ranks3y/ 는 .gitignore 에 있습니다. 여기서 만든 것은
    **소장님 컴퓨터 밖으로 안 나갑니다.** 사이트에도 안 올라갑니다.
    업체 성적표는 「1순위를 못 해 본 업체」가 보이는 자료라,
    사이트에 두면 물어볼 이유가 없어집니다 — 그래서 여기에만 둡니다.
    (내역서모음을 PC 안에만 두는 것과 같은 방침입니다)

■ 언제 돌리나
    **한 달에 한 번이면 넉넉합니다.** 개찰 저장소가 70일치를 들고 있고
    씨앗이 주 1회 갱신되므로, 두 달에 한 번까지는 빠지는 날이 없습니다.
    그보다 오래 두면 그사이 개찰이 영영 빠집니다.

■ 두 번 돌려도 안전합니다
    이미 담은 공고번호는 건너뜁니다. 몇 번을 돌려도 줄이 겹치지 않습니다.

    쓰는 법:  9_보관함채우기.bat 를 더블클릭
    또는:     python tools/보관함_채우기.py
"""

import csv
import gzip
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
import ranks3y                                    # noqa: E402

SEED = os.path.join(HERE, "data", "seed", "first.json.gz")
STORE = os.path.join(HERE, "data", "store", "first.json")
BATCH = 2000


def load(path):
    """개찰 저장소 한 벌을 읽습니다. 못 읽으면 None."""
    try:
        if path.endswith(".gz"):
            with gzip.open(path, "rt", encoding="utf-8") as f:
                return json.load(f)
        with io.open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print("  · %s 를 못 읽었습니다 (%s)" % (os.path.basename(path), type(e).__name__))
        return None


def already():
    """보관함에 이미 든 공고번호. 파일을 한 번 훑습니다."""
    seen = set()
    for ym in ranks3y.months():
        try:
            with gzip.open(ranks3y._path(ym), "rt", encoding="utf-8", newline="") as f:
                for row in csv.reader(f):
                    if row:
                        seen.add(row[0])
        except Exception as e:
            print("  ! %s 를 읽다 멈췄습니다 (%s) — 그 달은 건너뜁니다"
                  % (ym, type(e).__name__))
    return seen


def main():
    print("📊 3년치 순위 보관함 채우기")
    print("   전:", ranks3y.summary())

    seen = already()
    print("   이미 든 공고 %s건" % format(len(seen), ","))

    rows_in = notices = 0
    for path in (SEED, STORE):
        if not os.path.exists(path):
            continue
        st = load(path)
        if not st:
            continue
        got = 0
        for kind in ("con", "serv"):
            for no, r in (st.get(kind) or {}).items():
                if no in seen:
                    continue
                cs = r.get("corps") or []
                if len(cs) < 2:
                    continue                      # 순위가 없는 줄은 담을 것이 없습니다
                n = ranks3y.put(no, r.get("dt"), r.get("nrank") or len(cs), cs)
                if not n:
                    continue                      # 개찰일을 못 읽은 줄
                seen.add(no)
                rows_in += n
                notices += 1
                got += 1
                if notices % BATCH == 0:
                    ranks3y.flush()
                    print("     · %s건 담는 중..." % format(notices, ","))
        print("   %s 에서 %s건" % (os.path.basename(path), format(got, ",")))

    if notices:
        ranks3y.flush()
    gone = ranks3y.trim()
    if gone:
        print("   3년 지난 달 버림:", ", ".join(gone))

    print("   새로 담음: 공고 %s건 · %s줄" % (format(notices, ","), format(rows_in, ",")))
    print("   후:", ranks3y.summary())
    print("   자리:", os.path.join("data", "store", "ranks3y"))
    print("   ⚠️ 이 폴더는 저장소에도 사이트에도 안 올라갑니다 — 이 컴퓨터 안에만 있습니다.")


if __name__ == "__main__":
    main()
