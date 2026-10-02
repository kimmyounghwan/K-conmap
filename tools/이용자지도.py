# -*- coding: utf-8 -*-
"""🗺 이용자 지도 — 애널리틱스 «실시간» 도시 → 데이터베이스 fresh/map (2026-10-02 · G114)

  소장님: 「건설맵 이용자 지도 만들 수 있어? 실시간으로」 「건설맵 사이트에 띄우는 거지 · 다 볼 수 있게」
          「숫자는 나중에 … 지도만 띄우고, 표시가 나오게」 「컴퓨터 꺼져 있어도 계속 되는 거야 해」
          → 사랑방 맨 위에 지도(tools/이용자지도.jsx) · 숫자 없이 점만 · 깃허브가 24시간 10분마다(이용자지도.yml)

  ■ 받는 것: 애널리틱스 Data API runRealtimeReport (속성 552120206 = K-conmap · 2026-10-02 확인)
      나라 · 도시별 활성 사용자, «최근 30분». 대한민국만 남깁니다.
  ■ 넣는 것: fresh/map = {at, now: {도시: 1~3}, day: {d: 'YYYY-MM-DD'(한국 날짜), c: {도시: 1}}}
      · now — 지금(30분 안) 쓰는 도시. 숫자 대신 크기 1(1명) · 2(2~4명) · 3(5명 이상) — «숫자는 나중에»
      · day — 오늘 다녀간 도시(회차마다 더함 · 날이 바뀌면 새로) — 밤에도 지도가 비지 않게
      · 도시 이름은 애널리틱스가 주는 영어 그대로(Anyang-si · Gwangju …) — 지도 자리 맞추기는 화면이 합니다(한국지도.json)
      · fresh 는 누구나 읽고(규칙 .read true) 아무도 못 씁니다 — 서비스 계정만 씀. freshNotify 함수는 fresh/meta 만 봅니다.
  ■ 사람 · 기기는 없습니다(도시 단위 개수만). 기록(공개 로그)에는 «몇 곳» 만 찍습니다.
  ■ 권한: 서비스 계정(FIREBASE_SERVICE_ACCOUNT)을 애널리틱스 속성에 «뷰어» 로 넣고, 구글 클라우드에서
          «Google Analytics Data API» 를 켜야 합니다(소장님이 한 번). 안 돼 있으면 403 을 찍고 다음 회차에 다시 봅니다.

  python tools/이용자지도.py --minutes 55 --every 10     (한 번만: --once · 넣지 않고 보기만: --dry)
"""
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone

import requests

DB = (os.environ.get("RTDB_URL") or "https://k-conmap-default-rtdb.firebaseio.com").rstrip("/")
GA_PROPERTY = os.environ.get("GA_PROPERTY_ID") or "552120206"
KST = timezone(timedelta(hours=9))
나쁜글자 = str.maketrans({c: "_" for c in ".#$[]/"})

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def 지금():
    return datetime.now(KST)


def 적기(*a):
    print(지금().strftime("%H:%M:%S"), *a, flush=True)


def 계정():
    raw = (os.environ.get("FIREBASE_SERVICE_ACCOUNT") or "").strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        import base64
        try:
            return json.loads(base64.b64decode(raw).decode("utf-8"))
        except Exception:
            return None


def 토큰(sa):
    from google.oauth2 import service_account
    import google.auth.transport.requests as gr
    c = service_account.Credentials.from_service_account_info(
        sa, scopes=["https://www.googleapis.com/auth/analytics.readonly",
                    "https://www.googleapis.com/auth/firebase.database",
                    "https://www.googleapis.com/auth/userinfo.email"])
    c.refresh(gr.Request())
    return c.token


def 크기(n):
    return 3 if n >= 5 else 2 if n >= 2 else 1


def 실시간(tok):
    """{도시(영어): 사람 수} — 대한민국만"""
    r = requests.post(
        f"https://analyticsdata.googleapis.com/v1beta/properties/{GA_PROPERTY}:runRealtimeReport",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
        data=json.dumps({"dimensions": [{"name": "country"}, {"name": "city"}],
                         "metrics": [{"name": "activeUsers"}],
                         "minuteRanges": [{"name": "30분", "startMinutesAgo": 29, "endMinutesAgo": 0}],
                         "limit": 250}),
        timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"애널리틱스 HTTP {r.status_code} {r.text[:160]}")
    out = {}
    for row in r.json().get("rows") or []:
        d = [x.get("value", "") for x in row.get("dimensionValues") or []]
        m = [x.get("value", "0") for x in row.get("metricValues") or []]
        if len(d) < 2 or d[0] != "South Korea":
            continue
        city = (d[1] or "").strip().translate(나쁜글자)[:60]
        if not city or city.startswith("("):            # (not set)
            continue
        try:
            n = int(float(m[0]))
        except Exception:
            n = 0
        if n > 0:
            out[city] = out.get(city, 0) + n
    return out


def 합치기(옛, 도시들, 지금시각):
    """옛 fresh/map + 이번 도시들 → 새 fresh/map (인터넷 없이 시험: tools/시험_이용자지도.py)"""
    오늘 = 지금시각.strftime("%Y-%m-%d")
    옛날 = (옛 or {}).get("day") or {}
    c = dict(옛날.get("c") or {}) if 옛날.get("d") == 오늘 else {}
    for k in 도시들:
        c[k] = 1
    return {"at": int(지금시각.timestamp() * 1000),
            "now": {k: 크기(n) for k, n in 도시들.items()} or None,
            "day": {"d": 오늘, "c": c or None}}


def 한번(ctx, dry=False):
    if not ctx.get("tok") or time.time() - ctx.get("tok_t", 0) > 40 * 60:
        ctx["tok"], ctx["tok_t"] = 토큰(ctx["sa"]), time.time()
    도시들 = 실시간(ctx["tok"])
    옛 = requests.get(f"{DB}/fresh/map.json", timeout=20).json()
    새 = 합치기(옛, 도시들, 지금())
    적기(f"  · 지금 {len(도시들)}곳 · 오늘 {len((새['day'] or {}).get('c') or {})}곳")
    if dry:
        return 새
    r = requests.put(f"{DB}/fresh/map.json", headers={"Authorization": "Bearer " + ctx["tok"], "Content-Type": "application/json"},
                     data=json.dumps(새, ensure_ascii=False).encode("utf-8"), timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"데이터베이스 HTTP {r.status_code} {r.text[:120]}")
    return 새


def main():
    a = sys.argv[1:]
    값 = lambda k, d: float(a[a.index(k) + 1]) if k in a and a.index(k) + 1 < len(a) else d
    분, 틈 = 값("--minutes", 55), 값("--every", 10)
    sa = 계정()
    if not sa:
        적기("[멈춤] FIREBASE_SERVICE_ACCOUNT 가 없습니다.")
        sys.exit(1)
    ctx = {"sa": sa}
    t0 = time.time()
    실패 = 0
    while True:
        try:
            한번(ctx, dry="--dry" in a)
            실패 = 0
        except Exception as e:
            실패 += 1
            적기(f"  ! 못 했습니다 ({type(e).__name__}: {str(e)[:200]})")
            if "403" in str(e) or 실패 >= 6:
                적기("  ⛔ " + ("권한이 없습니다(서비스 계정 «뷰어» · Data API 켜기)" if "403" in str(e) else "여섯 번 연달아 못 했습니다") + " — 이번 회차는 그만합니다.")
                open(".map_stop", "w").write("권한 없음" if "403" in str(e) else "연달아 실패")
                break
        if "--once" in a or time.time() - t0 + 틈 * 60 > 분 * 60:
            break
        time.sleep(틈 * 60)


if __name__ == "__main__":
    main()
