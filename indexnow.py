# -*- coding: utf-8 -*-
"""
indexnow.py — 새로 생긴 주소를 검색엔진에 «직접 찔러 넣습니다». (2026-09-04)

사이트맵은 «와서 보세요» 인데 이건 «갔습니다» 입니다.
우리한테 맞는 이유: 개찰이 **하루 570건씩** 새 주소로 늘어납니다.
지금은 크롤러가 스스로 찾아올 때까지 기다립니다.

받는 곳
  · 네이버  https://api.searchadvisor.naver.com/indexnow   ← 2023-07 부터 지원
  · 공용    https://api.indexnow.org/indexnow              ← 빙·얀덱스 등으로 퍼짐
  구글은 IndexNow 를 안 씁니다(사이트맵으로 갑니다).

⚠️ 키는 «비밀»이 아닙니다. 규약이 그렇게 생겼습니다 —
   `https://k-conmap.com/{키}.txt` 를 누구나 열 수 있어야 «이 사이트 주인이 맞다» 가 증명됩니다.
   Firebase 웹 API 키와 같습니다. GitHub 이 «비밀키 유출» 이라 해도 지우면 안 됩니다.

⚠️ **아직 배포 안 된 주소를 알리면 크롤러가 404 를 봅니다.**
   그래서 «이번에 구운 것» 을 바로 보내지 않고 `data/store/indexnow.json` 에 적어 두었다가,
   **다음 회차 시작에** 보냅니다(그때는 이미 배포가 끝나 있습니다).
   이렇게 하면 워크플로(손으로만 고칠 수 있는 파일)를 안 고쳐도 됩니다.

⚠️ 같은 주소를 하루에도 몇 번씩 다시 찌르면 스팸입니다.
   `mark`(마지막으로 본 개찰 시각)보다 **새 것만** 보냅니다.
"""

import json
import os
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(ROOT, "data", "store", "indexnow.json")
PUBLIC = os.path.join(ROOT, "web", "public")

SITE = "https://k-conmap.com"
HOST = "k-conmap.com"
KEY = "0b8718557eddbae7950c312ccc231c6a"
KEY_URL = f"{SITE}/{KEY}.txt"

ENDPOINTS = [
    ("네이버", "https://api.searchadvisor.naver.com/indexnow"),
    ("공용(빙 등)", "https://api.indexnow.org/indexnow"),
]

MAX_URLS = 2000          # 규약 상한은 10,000. 한 회차에 그만큼 새로 생기지 않습니다.
ALWAYS = ["/", "/first", "/live", "/daily"]   # 내용이 계속 바뀌는 자리


def ensure_key_file(dist=None):
    """`{키}.txt` 를 만들어 둡니다.

    ⚠️ **dist 에 직접 쓰는 것이 본체입니다.** prerender 는 `npm run build` «뒤»에 도는데,
       빌드는 그 전에 web/public 을 dist 로 옮깁니다. 그래서 web/public 에만 쓰면
       그 회차 배포에는 안 실립니다 (2026-09-04 에 실제로 그랬습니다).
    ⚠️ 그리고 `.gitignore` 에 `*.txt` 가 있어 이 파일은 git 에 안 올라갑니다.
       (`!web/public/*.txt` 예외를 넣어 뒀지만, 여기서 dist 에 직접 쓰므로 그것에 기대지 않습니다.)
    """
    made = []
    for base in [PUBLIC] + ([dist] if dist else []):
        try:
            os.makedirs(base, exist_ok=True)
            p = os.path.join(base, f"{KEY}.txt")
            with open(p, "w", encoding="utf-8") as f:
                f.write(KEY)
            made.append(p)
        except Exception as e:
            print(f"  · IndexNow 키 파일을 못 만들었습니다 ({base} · {type(e).__name__}: {e})")
    return made


def _load():
    try:
        with open(STATE, encoding="utf-8") as f:
            v = json.load(f)
        return v if isinstance(v, dict) else {}
    except Exception:
        return {}


def _save(v):
    try:
        os.makedirs(os.path.dirname(STATE), exist_ok=True)
        with open(STATE, "w", encoding="utf-8") as f:
            json.dump(v, f, ensure_ascii=False)
    except Exception as e:
        print(f"  · IndexNow 상태 저장 실패 ({type(e).__name__}: {e})")


def queue(paths, mark=None):
    """다음 회차에 보낼 주소를 적어 둡니다. paths 는 «/notice/xxx» 꼴."""
    st = _load()
    seen, out = set(), []
    for p in list(ALWAYS) + list(paths):
        if p and p not in seen:
            seen.add(p)
            out.append(p)
        if len(out) >= MAX_URLS:
            break
    st["pending"] = out
    if mark:
        st["mark"] = mark
    _save(st)
    return len(out)


def new_since(rows, mark, key="dt"):
    """`mark` 보다 새로 생긴 줄만. mark 가 없으면 (처음 도는 것이므로) 아무것도 안 냅니다 —
       11,000건을 한꺼번에 찔러 넣으면 그게 스팸입니다."""
    top = mark or ""
    fresh = []
    for r in rows:
        v = str(r.get(key) or "")
        if v > top:
            top = v
        if mark and v > mark:
            fresh.append(r)
    return fresh, top


def send(quiet=False):
    """지난 회차에 적어 둔 주소를 보냅니다. 실패해도 배치를 멈추지 않습니다.

    돌려주는 것: {"at", "n", "results":[[받는곳, 코드]], "ok"}
    ⚠️ 이 결과는 **사이트에 남깁니다**(`/data/indexnow.json`). Actions 로그는 로그인해야 보이고
       화면도 잘 안 열립니다(2026-09-04에 실제로 못 봤습니다). diag.json 과 같은 방식으로,
       «지난 회차에 실제로 몇 개를 보냈고 어떤 답이 왔는지» 를 누구나 열어볼 수 있게 둡니다.
    """
    st = _load()
    urls = [u for u in (st.get("pending") or []) if isinstance(u, str)]
    at = time.strftime("%Y-%m-%d %H:%M:%S")
    if not urls:
        return {"at": at, "n": 0, "results": [], "ok": 0, "why": "보낼 주소 없음"}
    body = json.dumps({
        "host": HOST, "key": KEY, "keyLocation": KEY_URL,
        "urlList": [SITE + u if u.startswith("/") else u for u in urls],
    }).encode("utf-8")

    ok, results = 0, []
    for name, url in ENDPOINTS:
        try:
            req = urllib.request.Request(
                url, data=body, method="POST",
                headers={"Content-Type": "application/json; charset=utf-8",
                         "User-Agent": "k-conmap/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                code = resp.status
            print(f"  · IndexNow {name}: HTTP {code} · 주소 {len(urls):,}개")
            results.append([name, code])
            if 200 <= code < 300:
                ok += 1
        except urllib.error.HTTPError as e:
            # 202=받음, 200=OK, 400=형식오류, 403=키 확인 실패, 422=주소가 host 와 안 맞음, 429=너무 잦음
            print(f"  · IndexNow {name}: HTTP {e.code} — {e.reason}")
            results.append([name, e.code, str(e.reason)[:80]])
            if e.code in (200, 202):
                ok += 1
        except Exception as e:
            print(f"  · IndexNow {name}: 못 보냈습니다 ({type(e).__name__}: {e})")
            results.append([name, 0, f"{type(e).__name__}: {e}"[:120]])
        time.sleep(0.3)

    if ok:
        st["pending"] = []
        st["sent_at"] = at
        _save(st)
    elif not quiet:
        print("  · 이번엔 아무 곳도 못 받았습니다 — 목록은 그대로 두고 다음 회차에 다시 보냅니다.")
    return {"at": at, "n": len(urls), "results": results, "ok": ok,
            "sample": urls[:5]}


def write_report(dist, sent, queued):
    """`/data/indexnow.json` — 로그 없이 결과를 확인하는 자리."""
    try:
        d = os.path.join(dist, "data")
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "indexnow.json"), "w", encoding="utf-8") as f:
            json.dump({"보낸것": sent, "다음회차에알릴주소": queued,
                       "키": KEY_URL}, f, ensure_ascii=False, indent=1)
    except Exception as e:
        print(f"  · IndexNow 결과 남기기 실패 ({type(e).__name__}: {e})")


if __name__ == "__main__":
    import sys
    ensure_key_file()
    if "--send" in sys.argv:
        print(json.dumps(send(), ensure_ascii=False, indent=1))
    else:
        st = _load()
        print(f"키 파일 {KEY_URL}")
        print(f"보낼 주소 {len(st.get('pending') or []):,}개 · 마지막 개찰 {st.get('mark') or '(없음)'}"
              f" · 마지막 발송 {st.get('sent_at') or '(없음)'}")
