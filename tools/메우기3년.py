# -*- coding: utf-8 -*-
"""📊 3년치 «떨어진 기록» 메우기 (2026-09-18)

소장님: 「3년 동안 낙찰이 없는 업체도 되는 거지?」 · 「계속 받고 있는 거 아니었어?」

■ 왜 필요한가
  투찰업체 «전부» 가 있는 자료는 2026-07-14 부터입니다. first.json 이 70일만 두기 때문에,
  2026-09-15 에 영구 보관함(ranks3y)을 만들 때 살아 있던 것이 70일치뿐이었습니다.
  3년 파일(bid_data_3years)에는 **1순위만** 적혀 있습니다 —
  118,847줄 중 두 곳 이상 든 줄이 64줄(0.1%). 그래서 «넣었는데 떨어진» 기록이 없습니다.

■ 2026-09-18 실측 — 조달청은 «옛 공고번호» 로도 개찰 순위를 줍니다
      2022-11-14 ✅ 5곳 · 2023-06-01 ✅ 2곳 · 2024-01-10 ✅ 18곳 · 2025-01-08 ✅ 2곳
  → 가지고 있는 공고번호로 하나씩 물어보면 3년치를 메울 수 있습니다.

■ 어떻게 도나
  · 새것부터 («오늘에 가까운 것» 이 성적표에 제일 쓸모 있습니다) 차례로 물어봅니다.
  · 어디까지 했는지 _메우기.json 에 남겨 다음 회차가 이어받습니다.
  · 하루 몫(트래픽)이 끝나거나 시간 예산을 넘기면 «조용히» 멈춥니다 —
    회차마다 남는 만큼만 받으므로 사이트 갱신을 늦추지 않습니다.

⚠️ 한 개찰에서 «낮은 30곳» 만 담습니다 (collect.py 의 RANK_KEEP).
   참가업체가 중앙 64곳이라 그 아래는 안 담깁니다. 낙찰은 하한선 언저리에서 갈리니
   승부처는 다 들어오지만, «한참 높게 써서 떨어진» 기록은 안 남습니다.
   더 깊이 담으려면 --깊이 로 올리십시오 (파일이 그만큼 커집니다).

    python tools/메우기3년.py              한 회차 몫(기본 800건)
    python tools/메우기3년.py --건수 3000   더 많이
    python tools/메우기3년.py --깊이 100    한 개찰에서 100곳까지
"""
import argparse
import csv
import datetime
import io
import json
import os
import sys
import time
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import collect as C                                            # noqa: E402
import ranks3y                                                 # noqa: E402

ZIP = os.path.join(ROOT, "data", "bid_data_3years.zip")
진행길 = os.path.join(ROOT, "data", "store", "ranks3y", "_메우기.json")


def 지문():
    """3년 파일이 바뀌면 차례를 처음부터 다시 셉니다."""
    try:
        s = os.stat(ZIP)
        return "%d-%d" % (s.st_size, int(s.st_mtime))
    except OSError:
        return ""


def 진행읽기():
    try:
        with io.open(진행길, encoding="utf-8") as f:
            d = json.load(f)
        if d.get("바탕") == 지문():
            return d
    except Exception:
        pass
    return {"바탕": 지문(), "자리": 0, "받은건": 0, "빈건": 0, "담은줄": 0}


def 진행쓰기(d):
    d["갱신"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    os.makedirs(os.path.dirname(진행길), exist_ok=True)
    with io.open(진행길, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)


def 공고목록():
    """3년 파일에서 (공고번호, 차수, 날짜) 를 «새것부터» 뽑습니다.

    이미 보관함에 있는 달(2026-07 뒤)은 건너뜁니다 — 두 번 물어볼 까닭이 없습니다.
    3년이 지난 달도 건너뜁니다 — 어차피 ranks3y.trim() 이 버립니다.
    """
    오늘 = datetime.date.today()
    가장옛 = (오늘 - datetime.timedelta(days=ranks3y.KEEP_DAYS)).strftime("%Y-%m-%d")
    있는달 = set(ranks3y.months())
    out = []
    with zipfile.ZipFile(ZIP) as z:
        이름 = z.namelist()[0]
        with z.open(이름) as f:
            r = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig", errors="replace"))
            for row in r:
                no = (row.get("공고번호") or "").strip()
                날 = (row.get("날짜") or "")[:10]
                if not no or len(날) < 10:
                    continue
                if 날 < 가장옛:
                    continue                       # 3년 넘은 것 — 담아도 버려집니다
                if 날[:7] in 있는달:
                    continue                       # 이미 보관함에 있는 달
                out.append((no, (row.get("공고차수") or "000") or "000", 날))
    out.sort(key=lambda x: x[2], reverse=True)     # 새것부터
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--건수", type=int, default=800, help="이번에 물어볼 개찰 수")
    ap.add_argument("--깊이", type=int, default=0, help="한 개찰에서 담을 곳 수 (0=기본 30)")
    ap.add_argument("--쉼", type=float, default=0.35, help="한 건 사이 쉬는 시간(초)")
    ap.add_argument("--시간예산", type=int, default=0, help="이 초를 넘기면 멈춤 (0=안 봄)")
    a = ap.parse_args()

    C.load_env()
    key = C.api_key()
    if a.깊이:
        C.RANK_KEEP = a.깊이

    목록 = 공고목록()
    진행 = 진행읽기()
    자리 = min(진행["자리"], len(목록))
    남음 = len(목록) - 자리
    print("메울 개찰 : %s건 (이미 끝낸 것 %s건 · 남은 것 %s건)"
          % (format(len(목록), ","), format(자리, ","), format(남음, ",")))
    if not 남음:
        print("✅ 다 메웠습니다.")
        return
    print("이번 회차 : %s건 · 한 개찰에서 %d곳까지"
          % (format(min(a.건수, 남음), ","), C.RANK_KEEP))

    t0 = time.time()
    받음 = 빈것 = 줄 = 0
    for k in range(자리, min(자리 + a.건수, len(목록))):
        no, ordn, 날 = 목록[k]
        if C.QUOTA_OUT or C.NET_DOWN:
            print("  · 하루 몫이 끝났거나 통신이 막혔습니다 — 여기까지 하고 멈춥니다.")
            break
        if a.시간예산 and (time.time() - t0) > a.시간예산:
            print("  · 시간 예산(%d초)을 다 썼습니다 — 여기까지 하고 멈춥니다." % a.시간예산)
            break
        try:
            cs, 전체, _사다리, _drw = C.openg_ranks(key, no, ordn)
        except Exception as e:
            print("  ! %s — %s" % (no, str(e)[:70]))
            cs, 전체 = [], 0
        자리 = k + 1
        time.sleep(a.쉼)
        if not cs:
            빈것 += 1
            continue
        받음 += 1
        줄 += ranks3y.put(no, 날, 전체, cs)
        if 받음 % 200 == 0:
            ranks3y.flush()
            진행쓰기({**진행, "자리": 자리,
                    "받은건": 진행["받은건"] + 받음, "빈건": 진행["빈건"] + 빈것,
                    "담은줄": 진행["담은줄"] + 줄})
            print("    · %s건 받는 중... (줄 %s)" % (format(받음, ","), format(줄, ",")))

    ranks3y.flush()
    진행 = {**진행, "자리": 자리, "받은건": 진행["받은건"] + 받음,
           "빈건": 진행["빈건"] + 빈것, "담은줄": 진행["담은줄"] + 줄}
    진행쓰기(진행)
    걸린 = time.time() - t0
    print()
    print("이번 회차 — 받음 %s건 · 빈 것 %s건 · 담은 줄 %s (%.0f초)"
          % (format(받음, ","), format(빈것, ","), format(줄, ","), 걸린))
    print("모두 — 끝낸 개찰 %s / %s건 · 담은 줄 %s"
          % (format(진행["자리"], ","), format(len(목록), ","), format(진행["담은줄"], ",")))
    남 = len(목록) - 진행["자리"]
    if 남 and 받음:
        회차 = (남 + a.건수 - 1) // a.건수
        print("남은 %s건 — 이만큼씩이면 %s회차 더 돌면 끝납니다." % (format(남, ","), format(회차, ",")))


if __name__ == "__main__":
    main()
