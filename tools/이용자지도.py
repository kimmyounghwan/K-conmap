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

  👁 화면 조회수 (G119 · 2026-10-02) — 소장님: 「다른 것들도 꼼꼼히 점검해서 누적으로 카운트 해서 올려줘. 그리고 카운트 되게 해주고」
      같은 회차에서 30분마다 한 번: 애널리틱스 runReport(2026-09-15 ~ 오늘 · 페이지 경로별 조회수) → fresh/pv = {at, from, p: {화면열쇠: 조회수}}
      화면열쇠는 web/src/lib/받은수.jsx 의 화면열쇠() 와 «똑같이»(앞 두 마디 — forms·tools·cad·jeoksan·naeyeok·change, 그 밖은 한 마디).
      ⚠️ 한쪽만 고치지 말 것 — 시험(tools/시험_이용자지도.py)이 두 쪽을 같은 주소들로 대 봅니다.
      도구 · 적산 · 내역서 · 서식 카드의 «조회 N» 이 이것을 읽습니다. 지도와 따로 실패합니다(조회수가 안 돼도 지도는 그대로).
  👁 화면마다 · 공고마다 (G121 · 2026-10-02) — 소장님: 「공고 클릭 수도 조회 클릭수 보이게 … 사이트 내 모든 것에」 → 「공고, 모든 화면 — 누적으로 해줘」
      같은 애널리틱스 줄로 두 가지를 더 만듭니다(한 번에 PATCH fresh):
      · fresh/pvp = {전체열쇠: 조회수} — 화면 하나하나(주소 전체 · 사이트 화면 꼴만 · 현장 링크는 /tools/tuipbi 까지) — 화면 위 «👁 이 화면 조회 N»
      · fresh/nv = {공고번호 앞 8자: {공고번호: 조회수}} — /notice/{공고번호} 조회(공고 화면 + 목록에서 펼친 것 — 화면이 애널리틱스에
        같은 주소로 page_view 를 보냄) — 공고 카드 «👁 N». 목록은 보이는 공고의 묶음(앞 8자)만 받습니다.
      전체열쇠 · 공고번호는 web/src/lib/조회수.js 와 «똑같이». 시험(tools/시험_이용자지도.py)이 두 쪽을 대 봅니다.
"""
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import unquote

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


# ── 👁 화면 조회수 (G119) ─────────────────────────────────────────
조회시작 = "2026-09-15"          # 애널리틱스 측정 ID 를 고친 날 — 받은수_시작.json 과 같은 시작
조회틈 = 30 * 60                 # 30분마다 한 번(지도는 10분마다)
두마디 = {"forms", "tools", "cad", "jeoksan", "naeyeok", "change"}
_열쇠바꿈 = str.maketrans({"#": "_", "$": "_", "[": "_", "]": "_"})
열쇠모양 = re.compile(r"^\|(?:[a-z0-9-]+(?:\|[A-Za-z0-9,_-]+)?)?$")


def 열쇠꼴(s):
    """받은수.jsx 열쇠꼴 — «.»→«,» · «/»→«|» · «# $ [ ]»→«_»"""
    return s.replace(".", ",").replace("/", "|").translate(_열쇠바꿈)


def 화면열쇠(path):
    """받은수.jsx 화면열쇠 와 같게 — «/tools/tuipbi/v/현장/링크» → «|tools|tuipbi» · «/corp/이름» → «|corp» · «/» → «|»"""
    p = str(path or "/").split("?")[0].split("#")[0]
    마디 = [x for x in p.split("/") if x]
    if not 마디:
        return "|"
    둘 = 마디[:2] if 마디[0] in 두마디 else 마디[:1]
    try:
        k = "|".join(unquote(x, errors="strict") for x in 둘)
    except Exception:
        k = "|".join(둘)
    return 열쇠꼴("|" + k)[:80]


def 우리주소(host):
    h = (host or "").strip().lower()
    return bool(h) and h != "(not set)" and h != "localhost" and not h.startswith("127.") and not h.startswith("192.168.") and not h.endswith(".localhost")


def 조회묶기(rows):
    """애널리틱스 줄들([hostName, pagePath] · [screenPageViews]) → {화면열쇠: 조회수}"""
    out = {}
    for row in rows or []:
        d = [x.get("value", "") for x in row.get("dimensionValues") or []]
        m = [x.get("value", "0") for x in row.get("metricValues") or []]
        if len(d) < 2 or not 우리주소(d[0]) or not str(d[1]).startswith("/"):
            continue
        try:
            n = int(float(m[0]))
        except Exception:
            n = 0
        if n <= 0:
            continue
        k = 화면열쇠(d[1])
        if not 열쇠모양.match(k):            # 사이트 화면 꼴만(첫 마디 영문 소문자) — 아무 주소나 쳐 넣은 것은 공개 숫자에 안 남김
            continue
        out[k] = out.get(k, 0) + n
    return out


첫마디들 = {"agency", "analysis", "cad", "calc", "change", "corp", "daily", "ext", "first", "forms", "guide", "how", "jeoksan", "jobs",
           "lic", "live", "naeyeok", "pdf", "qna", "report", "safety", "shareone", "tools", "about", "privacy", "terms", "contact"}
공고모양 = re.compile(r"^[A-Za-z0-9-]{6,30}$")


def 마디풀기(path):
    p = str(path or "/").split("?")[0].split("#")[0]
    out = []
    for x in [x for x in p.split("/") if x]:
        try:
            out.append(unquote(x, errors="strict"))
        except Exception:
            out.append(x)
    return out


def 전체열쇠(path):
    """화면 하나하나의 열쇠(주소 전체) — 조회수.js 전체열쇠 와 같게. 사이트 화면이 아니면 None (공고는 공고번호로 따로)"""
    m = 마디풀기(path)
    if not m:
        return "|"
    if m[0] not in 첫마디들:
        return None
    if m[0] == "tools" and len(m) >= 2 and m[1] == "tuipbi":
        m = m[:2]                         # 현장 링크(/tools/tuipbi/v/현장/링크)는 비밀 — 화면까지만
    if len(m) > 3 or any(len(x) > 60 or any(ord(c) < 32 or ord(c) == 127 for c in x) for x in m):
        return None
    return 열쇠꼴("|" + "|".join(m))[:120]


def 공고번호(path):
    m = 마디풀기(path)
    return m[1] if len(m) == 2 and m[0] == "notice" and 공고모양.match(m[1]) else None


def 줄들(rows):
    """애널리틱스 줄 → [(주소, 조회수)] — 우리 주소 · 0 넘는 것만"""
    out = []
    for row in rows or []:
        d = [x.get("value", "") for x in row.get("dimensionValues") or []]
        m = [x.get("value", "0") for x in row.get("metricValues") or []]
        if len(d) < 2 or not 우리주소(d[0]) or not str(d[1]).startswith("/"):
            continue
        try:
            n = int(float(m[0]))
        except Exception:
            n = 0
        if n > 0:
            out.append((d[1], n))
    return out


def 화면묶기(rows):
    """→ {전체열쇠: 조회수} (공고 화면은 빼고 — 공고묶기 에)"""
    out = {}
    for path, n in 줄들(rows):
        if 공고번호(path):
            continue
        k = 전체열쇠(path)
        if k:
            out[k] = out.get(k, 0) + n
    return out


def 공고묶기(rows):
    """→ {앞 8자: {공고번호: 조회수}}"""
    out = {}
    for path, n in 줄들(rows):
        no = 공고번호(path)
        if no:
            g = out.setdefault(no[:8], {})
            g[no] = g.get(no, 0) + n
    return out


def 조회수(tok):
    r = requests.post(
        f"https://analyticsdata.googleapis.com/v1beta/properties/{GA_PROPERTY}:runReport",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
        data=json.dumps({"dateRanges": [{"startDate": 조회시작, "endDate": "today"}],
                         "dimensions": [{"name": "hostName"}, {"name": "pagePath"}],
                         "metrics": [{"name": "screenPageViews"}],
                         "limit": 100000}),
        timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"애널리틱스(조회수) HTTP {r.status_code} {r.text[:160]}")
    return r.json().get("rows") or []


def 조회넣기(ctx, dry=False):
    rows = 조회수(ctx["tok"])
    p, pp, nv = 조회묶기(rows), 화면묶기(rows), 공고묶기(rows)
    at = int(지금().timestamp() * 1000)
    새 = {"pv": {"at": at, "from": 조회시작, "p": p or None}, "pvp": pp or None, "nv": nv or None}
    적기(f"  · 조회수 {len(p)}곳 · 합 {sum(p.values()):,} · 화면 {len(pp)} · 공고 {sum(len(g) for g in nv.values())}건")
    if dry:
        return 새
    r = requests.patch(f"{DB}/fresh.json", headers={"Authorization": "Bearer " + ctx["tok"], "Content-Type": "application/json"},
                       data=json.dumps(새, ensure_ascii=False).encode("utf-8"), timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"데이터베이스(조회수) HTTP {r.status_code} {r.text[:120]}")
    return 새


def 한번(ctx, dry=False):
    if not ctx.get("tok") or time.time() - ctx.get("tok_t", 0) > 40 * 60:
        ctx["tok"], ctx["tok_t"] = 토큰(ctx["sa"]), time.time()
    if time.time() - ctx.get("pv_t", 0) >= 조회틈:          # 👁 조회수 — 지도와 따로 실패
        try:
            조회넣기(ctx, dry)
            ctx["pv_t"] = time.time()
        except Exception as e:
            ctx["pv_t"] = time.time() - 조회틈 + 10 * 60    # 10분 뒤 다시
            적기(f"  ! 조회수 못 했습니다 ({type(e).__name__}: {str(e)[:200]})")
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
