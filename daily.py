# -*- coding: utf-8 -*-
"""
daily.py — 「어제의 개찰 성적표」 한 장. `/daily/{YYYY-MM-DD}` (2026-09-04)

왜 만들었나
  사이트가 «찾아와야 보는 곳» 이라 단톡방에 던질 것이 없었습니다.
  개찰은 하루 570건씩 나옵니다. 날짜마다 한 장을 구우면
  ① 퍼갈 거리가 매일 생기고 ② 검색엔진에는 «매일 새 글이 나오는 곳» 으로 보입니다.

⚠️ 여기 담는 것은 «지나가면 안 변하는 것» 뿐입니다 — 그날 개찰 결과.
  마감 전 공고(오늘 해볼 만한 자리)는 이틀이면 썩습니다. 그건 화면이 살아서 그립니다
  (bidindex + 이미 있는 pickOdds). 같은 규칙을 파이썬에 다시 적지 않습니다.
"""

import statistics


def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _row(r):
    """표 한 줄 — 자리를 아끼려고 배열로 담습니다. 화면(DailyPage)이 같은 순서로 읽습니다.
       ⚠️ 순서를 바꾸면 화면이 엉뚱한 칸을 그립니다. 두 곳을 같이 고칠 것."""
    return [str(r.get("no") or ""), str(r.get("name") or ""), str(r.get("inst") or ""),
            _n(r.get("np")), _n(r.get("rate")), str(r.get("win") or ""),
            _n(r.get("sAmt") or r.get("amt"))]


FIELDS = ["no", "name", "inst", "np", "rate", "win", "amt"]   # 화면과 대조하는 이름표


def dates_of(store_con, keep=45):
    """개찰이 있었던 날짜를 최신순으로. 며칠치를 구울지는 부르는 쪽이 정합니다."""
    seen = {}
    for r in store_con.values():
        d = str(r.get("dt") or "")[:10]
        if len(d) == 10 and d[4] == "-":
            seen[d] = seen.get(d, 0) + 1
    return [d for d, _ in sorted(seen.items(), reverse=True)[:keep]]


def daily_data(store_con, date, top=10):
    """그 날짜의 개찰 요약. HTML 본문과 화면이 «이 하나»를 같이 씁니다."""
    rows = [r for r in store_con.values() if str(r.get("dt") or "")[:10] == date]
    if not rows:
        return None
    rates = sorted(x for x in (_n(r.get("rate")) for r in rows) if x)
    nps = sorted(x for x in (_n(r.get("np")) for r in rows) if x)
    amts = [(r, _n(r.get("sAmt") or r.get("amt")) or 0) for r in rows]

    solo = [r for r in rows if (_n(r.get("np")) or 0) == 1]
    hot = [r for r in rows if (_n(r.get("np")) or 0) >= 100]

    by_np = sorted((r for r in rows if _n(r.get("np"))),
                   key=lambda r: -(_n(r.get("np")) or 0))[:top]
    by_amt = [r for r, a in sorted(amts, key=lambda x: -x[1])[:top] if a > 0]

    # 여러 건 딴 업체 — 「어제 두 건 이상 가져간 곳」
    cnt = {}
    for r in rows:
        w = str(r.get("win") or "").strip()
        if w:
            cnt[w] = cnt.get(w, 0) + 1
    multi = sorted(((w, c) for w, c in cnt.items() if c >= 2), key=lambda x: -x[1])[:8]

    return {
        "d": date,
        "n": len(rows),
        "r": ({"med": round(statistics.median(rates), 3),
               "min": round(rates[0], 3), "max": round(rates[-1], 3)} if rates else None),
        "np": ({"med": int(statistics.median(nps)), "max": int(nps[-1])} if nps else None),
        "solo": len(solo),
        "hot": len(hot),
        "sum": sum(a for _, a in amts),
        "byNp": [_row(r) for r in by_np],
        "byAmt": [_row(r) for r in by_amt],
        "solos": [_row(r) for r in solo[:8]],
        "multi": multi,
    }
