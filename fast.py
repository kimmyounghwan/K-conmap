# -*- coding: utf-8 -*-
"""
fast.py — 공고 · 1순위 «빠른 길» (2026-09-30)

소장님: 「공고하고 1순위 좀 더 빨리 뜨게 안될까?」 → 「오늘 밤에 만들어 줘」 (내일 아침부터)
        「공고 및 1순위만 올라 오고 다른 것은 늦게 뜨다는 거지? 그럼 의미가 없지 않아?」
        → 이용자가 그 순간 보는 칸(공고명 · 기관 · 금액 · 마감 · 면허 · 1순위 업체 · 투찰률 · 참가업체수)은
          빠른 길에도 다 싣습니다. 늦게 오는 것은 조달청이 원래 늦게 내는 것(기초금액 · A값)과
          전체를 모아 셈하는 것(3년치 분석 · 업체 · 기관 페이지)뿐입니다.

■ 왜 따로 도나
    사이트 갱신(update.yml)은 수집 → 집계 → 빌드 → 페이지 굽기 → 배포를 한 바퀴 돌아야 화면에 올라갑니다.
    한 바퀴 35분~1시간 + 깃허브 예약 밀림 → 이용자에게는 1~2시간 늦게 보였습니다.
    → 여기서는 «오늘 새로 나온 공고 · 개찰» 만 10분마다 받아 데이터베이스(RTDB) fresh 칸에 넣습니다.
      화면(lib/fresh.js)이 사이트 목록 위에 얹어 보여 줍니다. 배포를 기다리지 않습니다.

■ «새 것» 을 어떻게 가리나 — 사이트에 «지금 올라가 있는» 첫 묶음(최신 500건)과 대 봅니다
    조달청에서 오늘치를 받고, 사이트 첫 묶음에 없는 공고번호만 남깁니다(첫 묶음보다 오래된 것은 뺍니다).
    다음 정기 배포가 그 공고를 싣는 순간 여기서 저절로 빠집니다 — 두 벌이 겹칠 일이 없습니다.

■ 무엇을 덧붙이나 (조달청 호출 없이)
    · 개찰: 같은 공고번호의 공고 저장소(정기 수집이 캐시에 남긴 것)에서 기초금액 · 예가범위 · A값 · 면허 · 낙찰하한율 …
      (collect.py 의 «공고→개찰 이어붙임» 과 같은 칸)
    · 공고: 면허 제한(조달청 면허제한 목록 — 최근 등록분만 한두 쪽), 예상 참가(enp), 공동도급(jnt), 내역서 표시(dsn), 시도
    · 목록 거르기용 색인 한 줄(_ix) — collect.py export_board 와 «같은 차례» (화면 match 가 그대로 씀)

■ 싣는 모양 — RTDB 는 빈 배열 · null 을 지우고 배열을 객체로 바꿉니다(공동도급 jnt 같은 칸이 깨짐).
    그래서 묶음을 «JSON 글자» 한 덩이로 넣습니다: fresh/rows/{first|live}/{i} = "[…]" (40건씩)
    목록표: fresh/meta/{first|live} = {at, built, n, p, h}   (h = 묶음 지문 — 화면이 바뀐 때만 다시 받게)
    ⚠️ 읽기 규칙: database.rules.json 의 "fresh" (.read true · .write false — 서비스 계정만 씀)

■ 조달청 호출 — 한 번에 개찰 1쪽 + 공고 1~2쪽 + 면허제한 1~3쪽. 10분마다 · 한국시간 05~23시.
    하루 몫을 다 썼다는 답이 오면 그 회차는 그만 부릅니다(정기 수집 몫을 안 먹게).

쓰는 법:  python fast.py --minutes 55 --every 10      (Actions: .github/workflows/fast.yml)
          python fast.py --once --dry                 (한 번만 · 데이터베이스에 안 씀)
"""
import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timedelta

import requests

import collect as C

SITE = (os.environ.get("SITE_URL") or "https://k-conmap.com").rstrip("/")
DB = (os.environ.get("RTDB_URL") or "https://k-conmap-default-rtdb.firebaseio.com").rstrip("/")
SHARD = 40                 # 한 묶음 건수 — 화면이 첫 묶음만 받으면 20~50KB
MAX_ROWS = 400             # 이보다 많으면 최신 것부터 (정기 배포가 곧 따라옵니다)
PAGES = {"first": 2, "live": 3, "lic": 3}
LIC_HOURS = 6              # 면허제한은 «등록 시각» 으로 옵니다 — 최근 몇 시간치만
STOP_FILE = ".fast_stop"   # 있으면 워크플로가 다음 회차를 부르지 않습니다(fast.yml)


class Quota(Exception):
    pass


class ApiError(Exception):
    pass


def now_kst():
    return datetime.now(C.KST)


def log(*a):
    print(now_kst().strftime("%H:%M:%S"), *a, flush=True)


# ── 조달청 ─────────────────────────────────────────────────────────
def api(url, key, params):
    p = {"serviceKey": key, "numOfRows": "999", "pageNo": "1", "inqryDiv": "1", "type": "json"}
    p.update(params)
    r = requests.get(url, params=p, timeout=20, verify=False, headers={"User-Agent": "Mozilla/5.0"})
    if r.status_code != 200:
        raise ApiError(f"HTTP {r.status_code}")
    try:
        j = r.json()
    except Exception:
        head = " ".join(r.text.split())[:180]
        if C._quota_msg(head):
            raise Quota(head)
        raise ApiError("JSON 아님: " + head)
    resp = j.get("response", {}) if isinstance(j, dict) else {}
    hd = resp.get("header", {}) or {}
    code = str(hd.get("resultCode", "")).strip()
    if code and code not in ("00", "0"):
        msg = str(hd.get("resultMsg", ""))
        if code in ("22", "022") or C._quota_msg(msg):
            raise Quota(f"{code} {msg}")
        raise ApiError(f"응답코드 {code} {msg}")
    items = (resp.get("body", {}) or {}).get("items", [])
    if isinstance(items, dict):
        items = items.get("item", [items])
    if isinstance(items, dict):
        items = [items]
    if not isinstance(items, list):
        return []
    return items


def api_paged(url, key, params, pages):
    out = []
    for pg in range(1, pages + 1):
        got = api(url, key, dict(params, pageNo=str(pg)))
        out.extend(got)
        if len(got) < 999:
            break
    return out


def today_range(now):
    d = now.strftime("%Y%m%d")
    return {"inqryBgnDt": d + "0000", "inqryEndDt": d + "2359"}


# ── 사이트에 지금 올라가 있는 것 ────────────────────────────────────
def deployed(name):
    """(목록표, 첫 묶음) — 캐시를 비켜 가려고 주소에 시각을 붙입니다. 못 받으면 (None, None)."""
    t = int(time.time())
    try:
        m = requests.get(f"{SITE}/data/board/{name}.json?t={t}", timeout=20).json()
        p = requests.get(f"{SITE}/data/board/{name}-con-0.json?t={t}", timeout=30).json()
        if not isinstance(p, list):
            return None, None
        return m, p
    except Exception as e:
        nm = "개찰" if name == "first" else "공고"
        log(f"  ! 사이트의 {nm} 첫 묶음을 못 받았습니다 ({type(e).__name__}) — 이번엔 {nm}을 건너뜁니다")
        return None, None


def pick_fresh(rows, part0):
    """사이트 첫 묶음에 없는 줄만 — 첫 묶음보다 오래된 줄은 이미 뒤 묶음에 있으므로 뺍니다."""
    have = {str(r.get("no")) for r in part0 if isinstance(r, dict)}
    ds = [C.dt_digits(r.get("dt")) for r in part0 if isinstance(r, dict) and r.get("dt")]
    oldest = min(ds) if ds else ""
    seen, out = set(), []
    for r in rows:
        no = str(r.get("no") or "")
        if not no or no in have or no in seen:
            continue
        if oldest and C.dt_digits(r.get("dt")) < oldest:
            continue
        seen.add(no)
        out.append(r)
    out.sort(key=lambda r: C.dt_digits(r.get("dt")), reverse=True)
    return out[:MAX_ROWS]


# ── 덧붙이기 (조달청 호출 없음) ─────────────────────────────────────
JOIN = ("llr", "est", "ptot", "pdrw", "base", "lo", "hi", "aval", "ayn", "aparts", "gmtrl", "lic", "site")


def _empty(v):
    return v in (None, "", 0, [])


def enrich_first(rows, live_store, first_store):
    """collect.py 의 «공고→개찰 이어붙임» 과 같은 칸을 공고 저장소에서 옮겨 적습니다."""
    lv = (live_store or {}).get("con") or {}
    fs = (first_store or {}).get("con") or {}
    n = 0
    for r in rows:
        prev = fs.get(r["no"]) or {}
        for f in ("base", "lo", "hi", "lic", "aval", "aparts", "ayn", "gmtrl", "llr", "est", "ptot", "pdrw"):
            if _empty(r.get(f)) and not _empty(prev.get(f)):
                r[f] = prev[f]
        src = lv.get(r["no"])
        if isinstance(src, dict):
            for f in JOIN:
                if _empty(r.get(f)) and not _empty(src.get(f)):
                    r[f] = src[f]
                    n += 1
    return n


def lic_recent(key, now):
    """최근 몇 시간 사이 등록된 면허 제한 {공고번호: [제한명…]} — collect.lic_by_day 와 같은 읽기."""
    beg = (now - timedelta(hours=LIC_HOURS)).strftime("%Y%m%d%H%M")
    end = now.strftime("%Y%m%d%H%M")
    items = api_paged(C.LIC["con"], key, {"inqryBgnDt": beg, "inqryEndDt": end}, PAGES["lic"])
    out = {}
    for it in items:
        no = str(C.pick(it, "bidNtceNo") or "").strip()
        div = str(C.pick(it, "bsnsDivNm") or "").strip()
        if div and div != "공사":
            continue
        nm = C.pick(it, "lcnsLmtNm", "licenseLmtNm", "indstrytyNm",
                    "bidprcPsblIndstrytyNm", "lmtNm", "prmsnCorpNm")
        if not no or not nm:
            continue
        cur = out.setdefault(no, [])
        nm = str(nm).strip()
        if nm not in cur:
            cur.append(nm)
    return out


def est_of(r):
    e = int(r.get("est") or 0)
    if e > 0:
        return e
    b = int(r.get("base") or 0)
    return round(b / 1.1) if b > 0 else 0


def finish(name, rows, book, enp_map):
    """화면이 쓰는 모양으로 — 정기 묶음(board)과 같은 칸 + 거르기 색인 한 줄(_ix) + 새 것 표시(_new)."""
    out = []
    for r in rows:
        x = {k: v for k, v in r.items() if k not in C.BOARD_RANK_KEYS or (name == "first" and k == "corps")}
        sido = C.sido_of(r, book)
        codes = C.lic_codes(r)
        if name == "first":
            x["_ix"] = [r.get("name") or "", r.get("inst") or "", r.get("win") or "", codes, sido]
        else:
            if enp_map:
                e = C.enp_of(r, enp_map)
                if e[0]:
                    x["enp"], x["enpn"], x["enpb"] = e[0], e[1], e[2]
            j = C.jnt_of(r)
            if j:
                x["jnt"] = j
            t = C.tag_of(r)          # 🏷 공고 유형 비트 — 정기 색인(export_board)과 같은 칸 · 같은 함수
            if t:
                x["tg"] = t
            x["_ix"] = [r.get("name") or "", r.get("inst") or "", int(r.get("base") or 0),
                        r.get("lo"), r.get("hi"), codes, sido, C.doc_flag(r), est_of(r), j, t]
        x["_new"] = 1
        out.append(x)
    return out


# ── 데이터베이스에 싣기 ─────────────────────────────────────────────
def creds():
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


def token(sa):
    from google.oauth2 import service_account
    import google.auth.transport.requests as gr
    c = service_account.Credentials.from_service_account_info(
        sa, scopes=["https://www.googleapis.com/auth/firebase.database",
                    "https://www.googleapis.com/auth/userinfo.email"])
    c.refresh(gr.Request())
    return c.token


def body_for(name, rows, built):
    shards = {str(i // SHARD): json.dumps(rows[i:i + SHARD], ensure_ascii=False, separators=(",", ":"))
              for i in range(0, len(rows), SHARD)}
    # h: 묶음 내용의 지문 — 화면은 이것이 바뀔 때만 묶음을 다시 받습니다(10분마다 at 만 바뀌는 회차가 대부분)
    h = hashlib.sha1("".join(shards[k] for k in sorted(shards, key=int)).encode("utf-8")).hexdigest()[:12]
    meta = {"at": int(time.time() * 1000), "built": built or "", "n": len(rows), "p": len(shards), "h": h}
    return {f"fresh/rows/{name}": shards or None, f"fresh/meta/{name}": meta}


def put(tok, body):
    r = requests.patch(f"{DB}/.json", params={"access_token": tok},
                       data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
                       headers={"Content-Type": "application/json"}, timeout=30)
    if r.status_code != 200:
        raise ApiError(f"데이터베이스 HTTP {r.status_code} {r.text[:120]}")


# ── 한 바퀴 ────────────────────────────────────────────────────────
def once(key, ctx, dry=False):
    now = now_kst()
    body, said = {}, []
    # ① 개찰 → 1순위
    m, p0 = deployed("first")
    if p0 is not None:
        try:
            items = api_paged(C.ENDPOINTS[("first", "con")], key, today_range(now), PAGES["first"])
            rows = [r for r in (C.row_first(it) for it in items) if r]
            fr = pick_fresh(rows, p0)
            joined = enrich_first(fr, ctx["live"], ctx["first"])
            body.update(body_for("first", finish("first", fr, ctx["book"], None), (m or {}).get("built")))
            said.append(f"개찰 오늘 {len(rows)}건 중 새 것 {len(fr)}건(이어붙임 {joined}칸)")
        except Quota as e:
            log(f"  ⛔ 조달청 하루 몫을 다 썼습니다 ({e}) — 이번 회차는 그만 부릅니다")
            ctx["quota"] = True
        except Exception as e:
            log(f"  ! 개찰을 못 받았습니다 ({type(e).__name__}: {e}) — 지난 것을 그대로 둡니다")
    # ② 공고
    m, p0 = deployed("live")
    if p0 is not None and not ctx.get("quota"):
        try:
            items = api_paged(C.ENDPOINTS[("live", "con")], key, today_range(now), PAGES["live"])
            rows = [r for r in (C.row_live(it) for it in items) if r]
            fr = pick_fresh(rows, p0)
            lv = (ctx["live"] or {}).get("con") or {}
            for r in fr:
                prev = lv.get(r["no"]) or {}
                for f in ("base", "lo", "hi", "lic", "aval", "ayn"):
                    if _empty(r.get(f)) and not _empty(prev.get(f)):
                        r[f] = prev[f]
            nl = 0
            if any(not r.get("lic") for r in fr):
                try:
                    lm = lic_recent(key, now)
                    for r in fr:
                        if not r.get("lic") and lm.get(r["no"]):
                            r["lic"] = lm[r["no"]][:6]
                            nl += 1
                except Quota:
                    raise
                except Exception as e:
                    log(f"  · 면허제한을 못 받았습니다 ({type(e).__name__}) — 면허 없이 싣습니다")
            body.update(body_for("live", finish("live", fr, ctx["book"], ctx["enp"]), (m or {}).get("built")))
            said.append(f"공고 오늘 {len(rows)}건 중 새 것 {len(fr)}건(면허 {nl})")
        except Quota as e:
            log(f"  ⛔ 조달청 하루 몫을 다 썼습니다 ({e}) — 이번 회차는 그만 부릅니다")
            ctx["quota"] = True
        except Exception as e:
            log(f"  ! 공고를 못 받았습니다 ({type(e).__name__}: {e}) — 지난 것을 그대로 둡니다")
    if not body:
        log("  · 실을 것이 없습니다")
        return body
    size = sum(len(t) for k, v in body.items() if k.startswith("fresh/rows/") and v for t in v.values())
    log(f"  · {' · '.join(said)} · 묶음 {size / 1024:.0f}KB")
    if dry:
        return body
    try:
        if not ctx.get("tok") or time.time() - ctx.get("tok_t", 0) > 40 * 60:
            ctx["tok"], ctx["tok_t"] = token(ctx["sa"]), time.time()
        put(ctx["tok"], body)
        log("  ✅ 데이터베이스에 실었습니다")
    except Exception as e:
        log(f"  ! 데이터베이스에 못 실었습니다 ({type(e).__name__}: {str(e)[:160]})")
    return body


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--minutes", type=int, default=55, help="이만큼 돌고 끝냅니다(다음 회차는 워크플로가 부릅니다)")
    ap.add_argument("--every", type=int, default=10, help="몇 분마다")
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--dry", action="store_true", help="데이터베이스에 안 씁니다")
    a = ap.parse_args()
    C.load_env()
    key = C.api_key()
    sa = creds()
    if not sa and not a.dry:
        raise SystemExit("❌ FIREBASE_SERVICE_ACCOUNT 가 없습니다 — 데이터베이스에 실을 수 없습니다")
    t0 = time.time()
    first, live = C.load_store("first"), C.load_store("live")
    ctx = {"sa": sa, "first": first, "live": live,
           "book": C.region_book(list((live.get("con") or {}).values()) + list((first.get("con") or {}).values())),
           "enp": C.pick_stats(first)[0]}
    log(f"저장소 공고 {len(live.get('con') or {}):,} · 개찰 {len(first.get('con') or {}):,} "
        f"(정기 수집이 캐시에 남긴 것 — 덧붙이기용) · {time.time() - t0:.1f}초")
    end = time.time() + a.minutes * 60
    while True:
        t = time.time()
        log("── 빠른 수집")
        try:
            once(key, ctx, dry=a.dry)
        except Exception as e:                   # 한 바퀴가 넘어져도 다음 바퀴는 돕니다
            log(f"  ! 이번 바퀴 실패 ({type(e).__name__}: {e})")
        if ctx.get("quota"):
            # ⚠️ 워크플로가 이 파일을 보고 «다음 회차» 를 부르지 않습니다 — 안 그러면 1분짜리 회차가
            #    꼬리를 물고 돌며 막힌 조달청을 계속 두드립니다. 매시 예약이 한 번씩만 다시 봅니다.
            with open(STOP_FILE, "w", encoding="utf-8") as f:
                f.write("조달청 하루 몫을 다 썼습니다")
            break
        if a.once:
            break
        nxt = t + a.every * 60
        if nxt > end:
            break
        time.sleep(max(0, nxt - time.time()))
    log("끝")


if __name__ == "__main__":
    sys.exit(main())
