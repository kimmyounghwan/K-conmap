# -*- coding: utf-8 -*-
"""🗺 이용자 지도 — 애널리틱스 «실시간» 도시 → 데이터베이스 fresh/map (2026-10-02 · G114)

  소장님: 「건설맵 이용자 지도 만들 수 있어? 실시간으로」 「건설맵 사이트에 띄우는 거지 · 다 볼 수 있게」
          「숫자는 나중에 … 지도만 띄우고, 표시가 나오게」 「컴퓨터 꺼져 있어도 계속 되는 거야 해」
          → 사랑방 맨 위에 지도(tools/이용자지도.jsx) · 숫자 없이 점만 · 깃허브가 24시간 10분마다(이용자지도.yml)

  ■ 받는 것: 애널리틱스 Data API runRealtimeReport (속성 552120206 = K-conmap · 2026-10-02 확인)
      나라 · 도시별 활성 사용자, «최근 30분». 지도 점은 대한민국만 · 사람 수에는 해외(로봇 뺌)도 더함(G311 · 2026-10-17).
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


def 실시간전국(tok):
    """지금(30분 안) 대한민국 사용자 수 — 애널리틱스 «실시간» 첫 칸과 같은 셈(도시로 나누지 않음 · 겹침 없음)"""
    r = requests.post(
        f"https://analyticsdata.googleapis.com/v1beta/properties/{GA_PROPERTY}:runRealtimeReport",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
        data=json.dumps({"dimensions": [{"name": "country"}], "metrics": [{"name": "activeUsers"}],
                         "minuteRanges": [{"name": "30분", "startMinutesAgo": 29, "endMinutesAgo": 0}], "limit": 50}),
        timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"애널리틱스(실시간 전국) HTTP {r.status_code} {r.text[:160]}")
    n = 0
    for row in r.json().get("rows") or []:
        d = [x.get("value", "") for x in row.get("dimensionValues") or []]
        m = [x.get("value", "0") for x in row.get("metricValues") or []]
        if d and d[0] == "South Korea":
            try:
                n += int(float(m[0]))
            except Exception:
                pass
    return n


def 합치기(옛, 도시들, 지금시각, 전국=None, 해외=None):
    """옛 fresh/map + 이번 도시들 → 새 fresh/map (인터넷 없이 시험: tools/시험_이용자지도.py)
    G144 — n: 지금(30분 안) 전국 사람 수(소장님 「애널리틱스 처럼 … 실시간으로」) · 못 받았으면 도시 합"""
    오늘 = 지금시각.strftime("%Y-%m-%d")
    옛날 = (옛 or {}).get("day") or {}
    c = dict(옛날.get("c") or {}) if 옛날.get("d") == 오늘 else {}
    for k in 도시들:
        c[k] = 1
    return {"at": int(지금시각.timestamp() * 1000),
            "now": {k: 크기(n) for k, n in 도시들.items()} or None,
            "n": (int(전국) if 전국 is not None else sum(int(v) for v in 도시들.values())) + int(해외 or 0),
            "nf": int(해외) if 해외 is not None else None,
            "day": {"d": 오늘, "c": c or None}}


# ── 🗺 시·도별 사용자 — 9/15부터 누적 · 오늘 (G144 · 2026-10-05) ──────────
#   소장님: 「누적은 9월 15일 부터 … 애널리틱스 처럼 누적으로 서울 몇명, 부산 몇명, 실시간으로 올라가게」 · 「오늘도 카운트 할까?」
#   애널리틱스 «사용자 › 지역» 과 같은 셈 = activeUsers · 지역(region) · 대한민국만. 10분마다(지도와 같이).
#   ⚠️ 애널리틱스 보통 보고서는 실시간보다 늦게(몇십 분~몇 시간) 채워집니다 — 숫자는 그만큼 늦게 올라갑니다.
#   fresh/reg = {at, from, d(오늘 · 한국), kr: {a 누적, t 오늘, y 어제}, r: {지역(영어): {a, t}}}
#   👥 G172 (2026-10-06) 소장님 「일 접속자 공개하는 사이트 많아」 → 「해줘」 — 모든 화면 위 · 바닥에 «오늘 · 어제 · 누적»
#      어제(y)는 전국 요청에만 하나 더(지역 요청은 그대로). 화면은 web/src/lib/조회수.jsx 방문자줄 · lib/이용자지도.js 방문수.
def 지역묶기(rows, 이름들=("a", "t")):
    """[countryId, region, dateRange] · [activeUsers] → {지역: {a, t}} — KR 만 · 0 은 뺌 · (not set) → «notset»"""
    out = {}
    for row in rows or []:
        d = [x.get("value", "") for x in row.get("dimensionValues") or []]
        m = [x.get("value", "0") for x in row.get("metricValues") or []]
        if len(d) < 3 or d[0] != "KR" or d[2] not in 이름들:
            continue
        try:
            n = int(float(m[0]))
        except Exception:
            n = 0
        if n <= 0:
            continue
        k = (d[1] or "").strip()
        k = "notset" if (not k or k.startswith("(")) else k.translate(나쁜글자)[:60]
        g = out.setdefault(k, {})
        g[d[2]] = g.get(d[2], 0) + n
    return out


def 전국묶기(rows):
    """[countryId, dateRange] · [activeUsers] → {a, t, y} — KR 만 (y 어제 — G172)"""
    out = {}
    for row in rows or []:
        d = [x.get("value", "") for x in row.get("dimensionValues") or []]
        m = [x.get("value", "0") for x in row.get("metricValues") or []]
        if len(d) < 2 or d[0] != "KR" or d[1] not in ("a", "t", "y"):
            continue
        try:
            out[d[1]] = out.get(d[1], 0) + int(float(m[0]))
        except Exception:
            pass
    return out


# ── 🌏 해외 · 합계 (G311 · 2026-10-17) ─────────────────────────────
#   소장님: 「에널리틱스 다른 나라도 같이 해줘. 출장 간 사람이 볼 수도 있는 거잖아. 로봇만 아니면 한국이랑 다른 나라도 추가해줘」 · 「건설맵 일별 방문자 합계」
#   로봇 가리기 — 2026-10-14 애널리틱스 오늘 국가별: 한국 224 + 미국 19 · 미국 19명은 참여 세션 0 · 머문 시간 0초(자동 점검 로봇).
#   → 대한민국 밖은 «참여 세션» 이 있는 사람만 셉니다: 나라 · 도시 · 기간 줄마다 min(사용자, 참여 세션) — 참여 세션 0 인 줄(로봇)은 0명.
#     대한민국은 전처럼 애널리틱스 «사용자» 그대로(애널리틱스 화면 숫자와 같게).
#   fresh/reg 에 더함: f = 해외 {a, t, y} · w = 합계(대한민국 + 해외) {a, t, y} — 화면은 w 를 씀(없으면 kr) · 시·도 줄 끝에 «해외».
#   실시간(지금 30분): 대한민국 밖은 «user_engagement»(머문 시간을 보낸 사람) 사건이 있는 사용자만 — fresh/map.n = 대한민국 + 해외 · nf = 해외
def 해외묶기(rows):
    """[countryId, city, dateRange] · [activeUsers, engagedSessions] → {a, t, y} — 대한민국 밖 · 로봇(참여 세션 0)은 뺌"""
    out = {}
    for row in rows or []:
        d = [x.get("value", "") for x in row.get("dimensionValues") or []]
        m = [x.get("value", "0") for x in row.get("metricValues") or []]
        if len(d) < 3 or not d[0] or d[0] == "KR" or d[2] not in ("a", "t", "y"):
            continue
        try:
            사람, 참여 = int(float(m[0])), int(float(m[1] if len(m) > 1 else 0))
        except Exception:
            continue
        n = min(사람, 참여)
        if n > 0:
            out[d[2]] = out.get(d[2], 0) + n
    return {k: out.get(k, 0) for k in ("a", "t", "y")}


# ── 👥 G315 (2026-10-18) 방문자 — 10/19 0시부터 건설맵이 직접 셈(web/src/lib/방문세기.js · 데이터베이스 vis) ──
#   소장님: 「사이트 접속만 하면 세는 걸로 … 동일인은 한 번만」 「12시에 바뀌는 걸로」 「클로드가 세는 걸로 해서 누적도 올라가는 걸로」
#   → 화면 누적 = 애널리틱스 9/15~10/18(바탕 · 여기서 그 날까지만 셈) + 직접 센 수(vis/a). 오늘 · 시·도 오늘도 직접 센 수(vis/d).
#   · 10/19 부터 a(누적)는 «2026-10-18» 까지만 묻습니다 — 10/18 치는 애널리틱스가 늦게 굳으므로 회차마다 다시 물어 맞춤(오르기만 함).
#   · 「리셋할 때는 애널리틱스랑 비교해서」 → 회차마다 어제(한국)를 fresh/vcmp/{어제} = {ga 애널리틱스 어제 사용자, me 건설맵이 센 어제, at} 로 적음
#     (애널리틱스 어제 숫자도 늦게 굳으므로 하루 내내 다시 적음 · 화면에는 소장님 브라우저에만 보임)
#   · 지금(30분 안) · 지도 점도 건설맵이 셈 — 브라우저가 5분마다 vis/on/{번호} = {t 서버 시각, k 곳 번호} · 여기서는 2시간 넘은 것을 회차마다 지움(지금정리)
직접시작날 = "2026-10-19"
바탕끝날 = "2026-10-18"


def 누적끝(때=None):
    """애널리틱스 누적(a)의 끝 날 — 10/19 전에는 'today' · 그 뒤로는 '2026-10-18' 로 멈춤"""
    return "today" if (때 or 지금()).strftime("%Y-%m-%d") < 직접시작날 else 바탕끝날


def 비교넣기(ctx, 새, dry=False):
    """어제(한국) 건설맵이 센 수(vis/d/{어제}/n) · 애널리틱스 어제 사용자(w.y — 없으면 kr.y) → fresh/vcmp/{어제}"""
    어제 = (지금() - timedelta(days=1)).strftime("%Y-%m-%d")
    if 어제 < 직접시작날:
        return None
    tok = ctx["tok"]
    q = requests.get(f"{DB}/vis/d/{어제}/n.json", headers={"Authorization": "Bearer " + tok}, timeout=20)
    if q.status_code != 200:
        raise RuntimeError(f"데이터베이스(방문 읽기) HTTP {q.status_code} {q.text[:120]}")
    me = int(q.json() or 0)
    ga = int(((새.get("w") or 새.get("kr") or {}).get("y")) or 0)
    v = {"ga": ga, "me": me, "at": int(지금().timestamp() * 1000)}
    적기(f"  · 어제({어제}) 건설맵 {me:,} · 애널리틱스 {ga:,}")
    if dry:
        return v
    r = requests.put(f"{DB}/fresh/vcmp/{어제}.json", headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
                     data=json.dumps(v).encode("utf-8"), timeout=20)
    if r.status_code != 200:
        raise RuntimeError(f"데이터베이스(비교) HTTP {r.status_code} {r.text[:120]}")
    return v


def 지금정리(ctx, dry=False):
    """vis/on(지금 30분 안 «여기 있음») 중 2시간 넘은 것을 지움 — 한 번에 500개까지 · 지운 수"""
    tok = ctx["tok"]
    끝 = int(지금().timestamp() * 1000) - 2 * 3600 * 1000
    q = requests.get(f"{DB}/vis/on.json", params={"orderBy": '"t"', "endAt": str(끝), "limitToFirst": "500"},
                     headers={"Authorization": "Bearer " + tok}, timeout=20)
    if q.status_code != 200:
        raise RuntimeError(f"데이터베이스(지금 읽기) HTTP {q.status_code} {q.text[:120]}")
    옛 = [k for k, v in (q.json() or {}).items()
         if isinstance(v, dict) and isinstance(v.get("t"), (int, float)) and v["t"] <= 끝 and re.match(r"^[a-z0-9]{16}$", k)]
    if 옛 and not dry:
        r = requests.patch(f"{DB}/vis/on.json", headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
                           data=json.dumps({k: None for k in 옛}).encode("utf-8"), timeout=20)
        if r.status_code != 200:
            raise RuntimeError(f"데이터베이스(지금 지우기) HTTP {r.status_code} {r.text[:120]}")
    if 옛:
        적기(f"  · 지금(30분) 옛 표시 {len(옛)}개 지움")
    return len(옛)


def 공동정리(ctx, dry=False):
    """🤝 G341 공동도급 마당(jv) — 끝(end: 협정 · 입찰 마감 · 명부 90일)이 지나고 7일 넘은 글을 지움(비밀번호 · 지움 · 신고 · 답글 comments/jv-{키} 도 함께) ·
    한 번에 200개까지 · 지운 수. 화면은 끝이 지나면 바로 안 보여 줍니다(lib/공동판.js 보일글) — 여기는 전화 · 이메일을 오래 두지 않으려는 것."""
    tok = ctx["tok"]
    끝 = int(지금().timestamp() * 1000) - 7 * 86400 * 1000
    q = requests.get(f"{DB}/jv.json", params={"orderBy": '"end"', "endAt": str(끝), "limitToFirst": "200"},
                     headers={"Authorization": "Bearer " + tok}, timeout=20)
    if q.status_code != 200:
        raise RuntimeError(f"데이터베이스(공동 읽기) HTTP {q.status_code} {q.text[:120]}")
    옛 = [k for k, v in (q.json() or {}).items()
         if isinstance(v, dict) and isinstance(v.get("end"), (int, float)) and v["end"] <= 끝 and re.match(r"^[-0-9A-Za-z_]{1,24}$", k)]
    if 옛 and not dry:
        몸 = {f"{칸}/{k}": None for k in 옛 for 칸 in ("jv", "jv_pins", "jv_del", "jv_flag")}
        몸.update({f"{칸}/jv-{k}": None for k in 옛 for 칸 in ("comments", "comment_pins", "comment_del")})   # 💬 그 글의 답글(대화)도
        r = requests.patch(f"{DB}/.json", headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
                           data=json.dumps(몸).encode("utf-8"), timeout=20)
        if r.status_code != 200:
            raise RuntimeError(f"데이터베이스(공동 지우기) HTTP {r.status_code} {r.text[:120]}")
    if 옛:
        적기(f"  · 공동도급 마당 끝난 글 {len(옛)}개 지움")
    return len(옛)


def _해외요청(tok):
    r = requests.post(
        f"https://analyticsdata.googleapis.com/v1beta/properties/{GA_PROPERTY}:runReport",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
        data=json.dumps({"dateRanges": [{"startDate": 조회시작, "endDate": 누적끝(), "name": "a"},
                                        {"startDate": "today", "endDate": "today", "name": "t"},
                                        {"startDate": "yesterday", "endDate": "yesterday", "name": "y"}],
                         "dimensions": [{"name": "countryId"}, {"name": "city"}],
                         "metrics": [{"name": "activeUsers"}, {"name": "engagedSessions"}],
                         "dimensionFilter": {"notExpression": {"filter": {"fieldName": "countryId", "stringFilter": {"value": "KR"}}}},
                         "limit": 10000}),
        timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"애널리틱스(해외) HTTP {r.status_code} {r.text[:160]}")
    return r.json().get("rows") or []


def 합계(kr, f):
    return {k: int((kr or {}).get(k, 0) or 0) + int((f or {}).get(k, 0) or 0) for k in ("a", "t", "y")}


def 실시간해외(tok):
    """지금(30분 안) 대한민국 밖 사람 수 — «user_engagement» 사건을 보낸 사용자만(로봇은 머문 시간이 없어 이 사건이 없음)"""
    r = requests.post(
        f"https://analyticsdata.googleapis.com/v1beta/properties/{GA_PROPERTY}:runRealtimeReport",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
        data=json.dumps({"dimensions": [{"name": "country"}, {"name": "eventName"}], "metrics": [{"name": "activeUsers"}],
                         "minuteRanges": [{"name": "30분", "startMinutesAgo": 29, "endMinutesAgo": 0}],
                         "dimensionFilter": {"filter": {"fieldName": "eventName", "stringFilter": {"value": "user_engagement"}}},
                         "limit": 100}),
        timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"애널리틱스(실시간 해외) HTTP {r.status_code} {r.text[:160]}")
    return 실시간해외묶기(r.json().get("rows") or [])


def 실시간해외묶기(rows):
    n = 0
    for row in rows or []:
        d = [x.get("value", "") for x in row.get("dimensionValues") or []]
        m = [x.get("value", "0") for x in row.get("metricValues") or []]
        if len(d) < 2 or not d[0] or d[0] in ("South Korea", "(not set)") or d[1] != "user_engagement":
            continue
        try:
            n += int(float(m[0]))
        except Exception:
            pass
    return n


def _지역요청(tok, 나눔):
    r = requests.post(
        f"https://analyticsdata.googleapis.com/v1beta/properties/{GA_PROPERTY}:runReport",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
        data=json.dumps({"dateRanges": [{"startDate": 조회시작, "endDate": 누적끝(), "name": "a"},
                                        {"startDate": "today", "endDate": "today", "name": "t"}]
                                       + ([] if 나눔 else [{"startDate": "yesterday", "endDate": "yesterday", "name": "y"}]),
                         "dimensions": [{"name": "countryId"}] + ([{"name": "region"}] if 나눔 else []),
                         "metrics": [{"name": "activeUsers"}],
                         "dimensionFilter": {"filter": {"fieldName": "countryId", "stringFilter": {"value": "KR"}}},
                         "limit": 1000}),
        timeout=60)
    if r.status_code != 200:
        raise RuntimeError(f"애널리틱스(지역) HTTP {r.status_code} {r.text[:160]}")
    return r.json().get("rows") or []


def 지역넣기(ctx, dry=False):
    tok = ctx["tok"]
    r = 지역묶기(_지역요청(tok, True))
    kr = 전국묶기(_지역요청(tok, False))
    try:                                              # 🌏 G311 해외(로봇 뺌) — 못 받아도 대한민국 숫자는 그대로
        f = 해외묶기(_해외요청(tok))
    except Exception as e:
        f = None
        적기(f"  ! 해외 못 했습니다 ({type(e).__name__}: {str(e)[:120]})")
    kr3 = {"a": kr.get("a", 0), "t": kr.get("t", 0), "y": kr.get("y", 0)}
    새 = {"at": int(지금().timestamp() * 1000), "from": 조회시작, "d": 지금().strftime("%Y-%m-%d"),
          "kr": kr3, "r": r or None}
    if 누적끝() != "today":
        새["e"] = 누적끝()                                 # 👥 G315 a 는 이 날까지(그 뒤는 화면이 vis 를 더함)
    if f is not None:
        새["f"] = f
        새["w"] = 합계(kr3, f)
    적기(f"  · 지역 {len(r)}곳 · 전국 누적 {새['kr']['a']:,} · 오늘 {새['kr']['t']:,} · 어제 {새['kr']['y']:,}"
         + (f" · 해외 누적 {f['a']:,} · 오늘 {f['t']:,} · 합계 오늘 {새['w']['t']:,}" if f is not None else ""))
    if dry:
        return 새
    q = requests.put(f"{DB}/fresh/reg.json", headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"},
                     data=json.dumps(새, ensure_ascii=False).encode("utf-8"), timeout=30)
    if q.status_code != 200:
        raise RuntimeError(f"데이터베이스(지역) HTTP {q.status_code} {q.text[:120]}")
    try:                                                  # 👥 G315 어제 비교 — 못 해도 지역 숫자는 그대로
        비교넣기(ctx, 새, dry)
    except Exception as e:
        적기(f"  ! 어제 비교 못 했습니다 ({type(e).__name__}: {str(e)[:120]})")
    try:                                                  # 👥 G315 지금(30분) 옛 표시 지우기
        지금정리(ctx, dry)
    except Exception as e:
        적기(f"  ! 지금 표시 정리 못 했습니다 ({type(e).__name__}: {str(e)[:120]})")
    return 새


# ── 👁 화면 조회수 (G119) ─────────────────────────────────────────
조회시작 = "2026-09-15"          # 애널리틱스 측정 ID 를 고친 날 — 받은수_시작.json 과 같은 시작
# 🔢 G342 (2026-10-20) 소장님 「건설맵이 직접 세는 걸로 하자 … 자정 12시 부터」 — 10/21 0시부터 조회수는 화면이 직접 셈(pv · lib/조회수.jsx).
#   애널리틱스 조회수는 «시작값» 으로만: 그때부터 끝날을 10-20 으로 묶어(오늘 자료가 늦게 차는 만큼 하루 이틀 더 채워짐) fresh/pv · pvp · nv 에 넣습니다.
조회직접 = datetime(2026, 10, 21, 0, 0, tzinfo=KST)
조회끝날 = "2026-10-20"


def 조회끝(때=None):
    """애널리틱스 조회수를 어디까지 셀지 — 10/21 0시 전엔 «today» · 그 뒤엔 2026-10-20"""
    return "today" if (때 or 지금()) < 조회직접 else 조회끝날
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


첫마디들 = {"agency", "analysis", "bunseok", "gongdong", "cad", "calc", "change", "corp", "daily", "ext", "first", "forms", "goods", "guide", "how", "jeoksan", "jobs",
           "lic", "live", "my", "naeyeok", "pdf", "qna", "report", "safety", "shareone", "svc", "tools", "about", "privacy", "terms", "contact"}
# 🔢 G205 (2026-10-08) «my» 더함 — 마이컨맵(/my)도 다른 화면처럼 «👁 이 화면 조회 N»(누적). 공개 페이지 /@주소 는 안 넣음(화면에 안 보이게).
#   ⚠️ web/src/lib/조회수.jsx 첫마디들 과 «똑같이»
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
        data=json.dumps({"dateRanges": [{"startDate": 조회시작, "endDate": 조회끝()}],
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
    새 = {"pv": {"at": at, "from": 조회시작, "to": 조회끝(), "p": p or None}, "pvp": pp or None, "nv": nv or None}
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
    try:                                                  # 🗺 G144 시·도별 누적 · 오늘 — 지도와 따로 실패
        지역넣기(ctx, dry)
    except Exception as e:
        적기(f"  ! 지역 못 했습니다 ({type(e).__name__}: {str(e)[:200]})")
    if time.time() - ctx.get("jv_t", 0) >= 3600:          # 🤝 G341 공동도급 마당 끝난 글 — 한 시간에 한 번 · 지도와 따로 실패
        ctx["jv_t"] = time.time()
        try:
            공동정리(ctx, dry)
        except Exception as e:
            적기(f"  ! 공동도급 글 정리 못 했습니다 ({type(e).__name__}: {str(e)[:200]})")
    도시들 = 실시간(ctx["tok"])
    try:
        전국 = 실시간전국(ctx["tok"])
    except Exception as e:
        전국 = None
        적기(f"  ! 실시간 전국 못 했습니다 ({type(e).__name__}: {str(e)[:120]})")
    try:                                                  # 🌏 G311 지금 해외(로봇 뺌)
        해외 = 실시간해외(ctx["tok"])
    except Exception as e:
        해외 = None
        적기(f"  ! 실시간 해외 못 했습니다 ({type(e).__name__}: {str(e)[:120]})")
    옛 = requests.get(f"{DB}/fresh/map.json", timeout=20).json()
    새 = 합치기(옛, 도시들, 지금(), 전국, 해외)
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
