# -*- coding: utf-8 -*-
"""
collect.py — 조달청 나라장터에서 최근 공고·개찰 결과를 받아온다.

기존 auto_collector.py 와 다른 점
  · Firebase 에 쓰지 않는다. 파일로 떨군다 → 읽기/쓰기 과금 0
  · 받은 것을 data/store/ 에 누적 보관하고,
    사이트에는 최근 것만 잘라서 web/public/data/ 로 내보낸다
  · API 키를 코드에 박지 않고 .env 에서 읽는다

실행
  python collect.py              최근 3일 (평소 운영)
  python collect.py --days 10    최근 10일
  python collect.py --backfill 90  90일치 몰아서 채우기 (최초 1회)
"""
import os
import re
import json
import time
import argparse
import urllib.parse
from datetime import datetime, timedelta, timezone

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ROOT = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(ROOT, "data", "store")
OUT = os.path.join(ROOT, "web", "public", "data")
KST = timezone(timedelta(hours=9))

KEEP_DAYS = 45      # 파일로 보관하는 기간
SHOW_DAYS = 30      # 사이트에 싣는 기간
MAX_ROWS = 300      # 사이트에 싣는 최대 건수 (전송량 방어)

BASE = "http://apis.data.go.kr/1230000"
ENDPOINTS = {
    ("first", "con"):  f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwk",
    ("first", "serv"): f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoServc",
    ("live",  "con"):  f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwk",
    ("live",  "serv"): f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoServc",
}


def load_env():
    """.env 를 읽어 환경변수로 (python-dotenv 없이도 동작)"""
    p = os.path.join(ROOT, ".env")
    if not os.path.exists(p):
        return
    with open(p, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def api_key():
    k = os.environ.get("G2B_API_KEY", "").strip()
    if not k:
        raise SystemExit(
            "❌ G2B_API_KEY 가 없습니다.\n"
            "   .env 파일을 만들고 아래 한 줄을 넣어주세요:\n"
            "   G2B_API_KEY=발급받은_디코딩_키")
    return urllib.parse.unquote(k)


def fetch(url, key, day, extra=None):
    d = day.strftime("%Y%m%d")
    params = {
        "serviceKey": key, "numOfRows": "999", "pageNo": "1", "inqryDiv": "1",
        "inqryBgnDt": d + "0000", "inqryEndDt": d + "2359", "type": "json",
    }
    if extra:
        params.update(extra)
    try:
        r = requests.get(url, params=params, timeout=25, verify=False,
                         headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code != 200:
            return []
        items = r.json().get("response", {}).get("body", {}).get("items", [])
    except Exception as e:
        print(f"    ! {d} 통신 실패 ({type(e).__name__}) — 건너뜀")
        return []
    if isinstance(items, dict):
        items = items.get("item", [items])
    return items or []


def to_int(v):
    try:
        return int(float(str(v).replace(",", "").strip()))
    except Exception:
        return 0


def to_rate(v):
    try:
        f = float(str(v).replace("%", "").strip())
        return round(f, 3) if 0 < f <= 200 else None
    except Exception:
        return None


def parse_corps(raw, limit=6):
    """'업체명^사업자번호^대표^금액^투찰률|업체명^...' → [[이름, 금액, 투찰률], ...]"""
    out = []
    for chunk in str(raw or "").split("|")[:limit]:
        p = chunk.split("^")
        if len(p) >= 5 and p[0].strip():
            out.append([p[0].strip(), to_int(p[3]), to_rate(p[4])])
    return out


def row_first(item):
    no = str(item.get("bidNtceNo", "")).strip()
    if not no:
        return None
    corps = parse_corps(item.get("opengCorpInfo", ""))
    if not corps:
        return None
    win, amt, rate = corps[0]
    return {
        "no": no,
        "name": str(item.get("bidNtceNm", "")).strip(),
        "inst": str(item.get("ntceInsttNm", "")).strip(),
        "dt": str(item.get("opengDt", "")).strip(),
        "win": win, "amt": amt, "rate": rate,
        "corps": corps,
    }


def row_live(item):
    no = str(item.get("bidNtceNo", "")).strip()
    if not no:
        return None
    url = str(item.get("bidNtceDtlUrl", "") or "").replace(":8081", "").replace(":8101", "")
    return {
        "no": no,
        "name": str(item.get("bidNtceNm", "")).strip(),
        "inst": str(item.get("ntceInsttNm", "")).strip(),
        "dt": str(item.get("bidNtceDt", "")).strip(),
        "budget": to_int(item.get("bdgtAmt", 0) or item.get("presmptPrce", 0)),
        "close": str(item.get("bidClseDt", "") or "").strip(),
        "url": url or "https://www.g2b.go.kr/index.jsp",
    }


def load_store(name):
    p = os.path.join(STORE, f"{name}.json")
    if not os.path.exists(p):
        return {"con": {}, "serv": {}}
    try:
        with open(p, encoding="utf-8") as f:
            d = json.load(f)
        return {"con": d.get("con", {}), "serv": d.get("serv", {})}
    except Exception:
        return {"con": {}, "serv": {}}


def save_store(name, data):
    os.makedirs(STORE, exist_ok=True)
    with open(os.path.join(STORE, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


def dt_digits(v):
    return re.sub(r"[^0-9]", "", str(v or ""))[:12]


def trim(bucket, days, date_field):
    """오래된 건 버린다 — 안 버리면 파일이 해마다 조용히 무거워진다"""
    cut = (datetime.now(KST) - timedelta(days=days)).strftime("%Y%m%d%H%M")
    return {k: v for k, v in bucket.items() if (dt_digits(v.get(date_field)) or "999") >= cut}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=3)
    ap.add_argument("--backfill", type=int, default=0)
    ap.add_argument("--sleep", type=float, default=0.6)
    args = ap.parse_args()

    load_env()
    key = api_key()
    days = args.backfill or args.days
    today = datetime.now(KST)

    print("=" * 52)
    print(f"  조달청 수집 — 최근 {days}일")
    print("=" * 52)

    first = load_store("first")
    live = load_store("live")
    added = {"first": 0, "live": 0}

    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        ds = day.strftime("%m-%d")
        got = []
        for kind in ("con", "serv"):
            for item in fetch(ENDPOINTS[("first", kind)], key, day):
                r = row_first(item)
                if r:
                    first[kind][r["no"]] = r
                    added["first"] += 1
            time.sleep(args.sleep)
            for item in fetch(ENDPOINTS[("live", kind)], key, day):
                r = row_live(item)
                if r:
                    live[kind][r["no"]] = r
                    added["live"] += 1
            time.sleep(args.sleep)
            got.append(f"{kind}")
        print(f"  {ds}  1순위 {len(first['con']) + len(first['serv']):,}건 / 공고 {len(live['con']) + len(live['serv']):,}건 누적")

    for kind in ("con", "serv"):
        first[kind] = trim(first[kind], KEEP_DAYS, "dt")
        live[kind] = trim(live[kind], KEEP_DAYS, "dt")

    save_store("first", first)
    save_store("live", live)

    # 사이트용으로 최근분만 잘라서 내보낸다
    os.makedirs(OUT, exist_ok=True)
    built = datetime.now(KST).strftime("%Y-%m-%d %H:%M")

    def export(name, store, date_field):
        out = {"built": built}
        for kind in ("con", "serv"):
            rows = list(trim(store[kind], SHOW_DAYS, date_field).values())
            rows.sort(key=lambda r: dt_digits(r.get(date_field)), reverse=True)
            # 첫 화면에서 내려받는 파일이라 무겁게 두면 그대로 전송량이 된다
            out[kind] = rows[:MAX_ROWS]
        p = os.path.join(OUT, f"{name}.json")
        with open(p, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(f"  → {name}.json  공사 {len(out['con']):,} / 용역 {len(out['serv']):,}"
              f"  ({os.path.getsize(p)/1024:.0f}KB)")

    print("-" * 52)
    export("first", first, "dt")
    export("live", live, "dt")
    print("✅ 수집 완료")


if __name__ == "__main__":
    main()
