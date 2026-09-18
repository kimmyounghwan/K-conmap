# -*- coding: utf-8 -*-
"""🔎 «옛 공고도 투찰업체 목록을 주는가» — 딱 한 번 물어보는 시험 (2026-09-18)

소장님: 「3년 동안 낙찰이 없는 업체도 되는 거지?」 · 「계속 받고 있는 거 아니었어?」

지금 사정
  · 투찰업체 «전부» 가 있는 자료는 2026-07-14 부터입니다 (first.json 이 70일만 두기 때문).
  · 3년 파일(bid_data_3years)은 **1순위만** 적혀 있습니다 — 118,847줄 중 두 곳 이상 든 줄이 64줄.
  · 그래서 옛날에 «넣었지만 떨어진» 기록은 지금 없습니다.

이 시험이 답하는 것
  조달청이 **옛 공고번호로도 개찰 순위(투찰업체 목록)를 주는가.**
  준다면 3년치를 메울 수 있습니다. 안 주면 앞으로 쌓는 수밖에 없습니다.

  호출은 해마다 한 번씩, 많아야 열 번입니다. 하루 몫을 거의 안 씁니다.
"""
import sys, os, io, csv, zipfile, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import collect as C                                            # noqa: E402


def main():
    C.load_env()
    key = C.api_key()                    # 값은 쓰기만 하고 찍지 않습니다
    z = zipfile.ZipFile(os.path.join(ROOT, "data", "bid_data_3years.zip"))
    표본 = {}
    with z.open("bid_data_3years.csv") as f:
        r = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig", errors="replace"))
        for row in r:
            해 = (row.get("날짜") or "")[:4]
            if 해 and 해 not in 표본 and row.get("공고번호"):
                표본[해] = (row["공고번호"], (row.get("공고차수") or "000") or "000",
                          row.get("날짜"), row.get("1순위업체"))
    print("시험할 해 :", ", ".join(sorted(표본)))
    print()
    준곳 = 안준곳 = 0
    for 해 in sorted(표본):
        no, ordn, dt, win = 표본[해]
        try:
            items = C.fetch(C.OPENG_RANK, key,
                            extra={"bidNtceNo": no, "bidNtceOrd": str(ordn or "000") or "000"},
                            label="옛자료 %s" % 해)
        except SystemExit as e:
            print("  %s  → 멈춤: %s" % (해, e)); break
        except Exception as e:
            print("  %s  → 오류: %s" % (해, str(e)[:100])); continue
        n = len(items or [])
        if n > 1:
            준곳 += 1
            print("  %s  %s (%s)  → ✅ 투찰업체 %d곳 줍니다" % (해, dt[:10], no, n))
        else:
            안준곳 += 1
            print("  %s  %s (%s)  → ✕ %d곳 (1순위 %s)" % (해, dt[:10], no, n, (win or "")[:14]))

    print()
    print("=" * 56)
    if 준곳:
        print("  ✅ 옛 공고도 투찰업체 목록을 줍니다 (%d해 성공 / %d해 실패)" % (준곳, 안준곳))
        print("     → 3년치를 메울 수 있습니다. 공고번호 118,847개를 나눠서 물어보면 됩니다.")
        print("     ⚠️ 하루 호출 한도가 있으니 며칠에 걸쳐 나눠 받아야 합니다.")
    else:
        print("  ✕ 옛 공고는 투찰업체 목록을 주지 않습니다.")
        print("     → 메울 수 없습니다. 2026-07-14 부터 앞으로 쌓이는 것만 씁니다.")
    print("=" * 56)


if __name__ == "__main__":
    main()
