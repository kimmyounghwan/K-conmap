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
import io
import os
import re
import csv
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

KEEP_DAYS = 70      # 파일로 보관하는 기간 (10주 — 여유를 두고 보관)
SHOW_DAYS = 49      # 사이트에 싣는 기간 (7주)
MAX_ROWS = 300      # first.json / live.json 에 싣는 건수 (첫 화면·옛 사이트용)
BOARD_CHUNK = 500   # 한 달치를 나눠 담는 묶음 크기

# 2026-08-31 — 용역을 빼고 «공사»만 다룹니다.
#   3년치 482,630건 중 용역이 363,783건(75%)이라, 빼면 사이트가 크게 가벼워집니다.
#   되돌리려면 여기에 "serv" 를 다시 넣기만 하면 됩니다. 원본 파일은 지우지 않았습니다.
KINDS = ("con",)

# 3년치 원본과 같은 모양으로 계속 쌓이는 누적 파일.
# build_json.py 가 data/extra_*.csv 를 자동으로 함께 읽으므로,
# 이 파일만 자라면 «3년치 분석»이 저절로 최신 상태를 유지한다.
# (store/*.json 은 45일이면 잘리므로 분석용 이력은 여기에 남긴다)
# 달마다 파일을 나눕니다.
#   자동화(GitHub)가 매일 이 파일을 저장소에 올리는데, 한 덩어리로 두면
#   14MB 파일이 매일 통째로 다시 올라가 저장소가 금방 무거워집니다.
#   달별로 쪼개면 이번 달 것(1~2MB)만 바뀝니다.
#   build_json.py 는 data/extra_*.csv 를 전부 읽으므로 그대로 동작합니다.
ARCHIVE_DIR = os.path.join(ROOT, "data")


def archive_path(ym):
    return os.path.join(ARCHIVE_DIR, f"extra_{ym}.csv")
ARCH_COLS = ["공고번호", "날짜", "발주기관", "공고명",
             "1순위업체", "투찰금액", "투찰률", "기초금액"]

BASE = "http://apis.data.go.kr/1230000"
ENDPOINTS = {
    ("first", "con"):  f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwk",
    ("first", "serv"): f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoServc",
    ("live",  "con"):  f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwk",
    ("live",  "serv"): f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoServc",
}

# 기초금액(예정가격 산정의 기준이 되는 금액). 공고 목록에는 안 들어있고 별도 오퍼레이션이다.
BSIS = {
    "con":  f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwkBsisAmount",
    "serv": f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoServcBsisAmount",
}
BSIS_ONE_CAP = 150   # 목록조회로 못 채운 건은 공고번호로 개별조회 (하루 호출량 방어)


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


def fetch(url, key, day=None, extra=None, label=""):
    """조달청 공통 호출.
    예전에 기초금액이 '계속 실패'했던 건 대부분 조용히 삼켜서 원인이 안 보였기 때문이다.
    그래서 여기서는 HTTP 코드 / resultCode / 본문 앞머리를 반드시 찍는다."""
    params = {
        "serviceKey": key, "numOfRows": "999", "pageNo": "1",
        "inqryDiv": "1", "type": "json",
    }
    if day is not None:
        d = day.strftime("%Y%m%d")
        params["inqryBgnDt"] = d + "0000"
        params["inqryEndDt"] = d + "2359"
    if extra:
        params.update(extra)
    tag = label or url.rsplit("/", 1)[-1]
    try:
        r = requests.get(url, params=params, timeout=25, verify=False,
                         headers={"User-Agent": "Mozilla/5.0"})
    except Exception as e:
        print(f"    ! {tag} 통신 실패 ({type(e).__name__})")
        return []
    if r.status_code != 200:
        print(f"    ! {tag} HTTP {r.status_code}")
        return []
    try:
        j = r.json()
    except Exception:
        head = " ".join(r.text.split())[:180]
        print(f"    ! {tag} JSON 아님 → {head}")
        return []
    resp = j.get("response", {}) if isinstance(j, dict) else {}
    head = resp.get("header", {}) or {}
    code = str(head.get("resultCode", "")).strip()
    if code and code not in ("00", "0"):
        print(f"    ! {tag} 응답코드 {code} · {head.get('resultMsg', '')}")
        return []
    items = (resp.get("body", {}) or {}).get("items", [])
    if isinstance(items, dict):
        items = items.get("item", [items])
    if isinstance(items, str):
        return []
    return items or []


def pick(item, *names):
    """조달청 응답은 문서와 필드 대소문자가 다를 때가 있다 (bssamt vs bssAmt).
    이름을 소문자로 눕혀서 찾는다 — 기초금액이 늘 비어 보이던 진짜 원인."""
    if not isinstance(item, dict):
        return None
    low = {str(k).lower(): v for k, v in item.items()}
    for n in names:
        v = low.get(n.lower())
        if v not in (None, "", "-", "0"):
            return v
    return None


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


def to_f(v):
    try:
        return round(float(str(v).replace("%", "").strip()), 3)
    except Exception:
        return None


def bsis_row(it):
    """기초금액 응답 한 줄 → 화면에 쓸 형태.
    base 예정가격 기준금액 / lo,hi 예가범위(%) / a,b 낙찰하한율 참고용"""
    base = to_int(pick(it, "bssamt", "bssAmt", "bsisAmt", "BssAmt", "basisAmt"))
    if not base:
        return None
    return {
        "base": base,
        "lo": to_f(pick(it, "rsrvtnPrceRngBgnRate", "rsrvtnPrceRngBgnRt")),
        "hi": to_f(pick(it, "rsrvtnPrceRngEndRate", "rsrvtnPrceRngEndRt")),
    }


def bsis_by_day(key, day, kind):
    """하루치 기초금액을 통째로 받아 {공고번호: {...}} 로."""
    out = {}
    for it in fetch(BSIS[kind], key, day, None,
                    label=f"기초금액 {kind} {day:%m-%d}"):
        no = str(pick(it, "bidNtceNo") or "").strip()
        r = bsis_row(it)
        if no and r:
            out[no] = r
    return out


def bsis_one(key, no, kind):
    """공고번호로 한 건만. 목록조회에서 빠진 건을 메운다 (inqryDiv=2)."""
    for it in fetch(BSIS[kind], key, None,
                    {"inqryDiv": "2", "bidNtceNo": no}, label=f"기초금액 {no}"):
        r = bsis_row(it)
        if r:
            return r
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
    corps = parse_corps(item.get("opengCorpInfo", ""), limit=10)
    if not corps:
        return None
    win, amt, rate = corps[0]
    return {
        "no": no,
        # 공고차수 — 나라장터 원문 주소를 정확히 만들려면 필요합니다
        "ord": str(item.get("bidNtceOrd", "") or "").strip(),
        "name": str(item.get("bidNtceNm", "")).strip(),
        "inst": str(item.get("ntceInsttNm", "")).strip(),
        "dt": str(item.get("opengDt", "")).strip(),
        "win": win, "amt": amt, "rate": rate,
        # 낙찰금액·낙찰률은 응답에 있을 때만 채워진다 (없으면 1순위 투찰금액이 곧 낙찰가)
        "sAmt": to_int(pick(item, "sucsfbidAmt", "sucsfbidPrce")) or 0,
        "sRate": to_rate(pick(item, "sucsfbidRate")),
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


def archive(first):
    """이번에 받은 개찰 결과를 달별 누적 CSV 에 덧붙인다. 지우지 않는다."""
    import glob as _glob

    have = set()
    for p in _glob.glob(os.path.join(ARCHIVE_DIR, "extra_*.csv")):
        try:
            with io.open(p, encoding="utf-8-sig", newline="") as f:
                for row in csv.DictReader(f):
                    no = (row.get("공고번호") or "").strip()
                    if no:
                        have.add(no)
        except Exception as e:
            print(f"  ! 누적 CSV 읽기 실패 {os.path.basename(p)} ({type(e).__name__})")

    buckets = {}
    for kind in ("con", "serv"):
        for no, r in first[kind].items():
            if no in have:
                continue
            d = dt_digits(r.get("dt"))
            if len(d) < 8:
                continue
            have.add(no)
            ym = f"{d[0:4]}-{d[4:6]}"
            buckets.setdefault(ym, []).append({
                "공고번호": no,
                "날짜": f"{d[0:4]}-{d[4:6]}-{d[6:8]}",
                "발주기관": r.get("inst", ""),
                "공고명": r.get("name", ""),
                "1순위업체": r.get("win", ""),
                "투찰금액": r.get("amt", 0),
                "투찰률": "" if r.get("rate") is None else r.get("rate"),
                "기초금액": r.get("base", "") or "",
            })

    if not buckets:
        print("  · 누적 CSV — 새로 추가할 건 없음")
        return

    added = 0
    for ym, rows in sorted(buckets.items()):
        p = archive_path(ym)
        fresh = not os.path.exists(p)
        with io.open(p, "a", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=ARCH_COLS)
            if fresh:
                w.writeheader()
            w.writerows(rows)
        added += len(rows)
    months = ", ".join(sorted(buckets))
    print(f"  · 누적 CSV +{added:,}건 ({months}) — 전체 {len(have):,}건")


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

    # 다루지 않기로 한 종류(용역)는 저장소에서도 비웁니다.
    # 안 그러면 안 쓰는 자료가 70일 동안 남아 파일만 무거워집니다.
    for _st in (first, live):
        for _k in list(_st.keys()):
            if _k not in KINDS:
                _st[_k] = {}
    added = {"first": 0, "live": 0}

    n_base = 0
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        ds = day.strftime("%m-%d")
        for kind in KINDS:
            for item in fetch(ENDPOINTS[("first", kind)], key, day,
                              label=f"개찰 {kind} {ds}"):
                r = row_first(item)
                if r:
                    prev = first[kind].get(r["no"]) or {}
                    # 이미 받아둔 기초금액을 덮어쓰지 않는다
                    for f in ("base", "lo", "hi"):
                        if prev.get(f) is not None:
                            r[f] = prev[f]
                    first[kind][r["no"]] = r
                    added["first"] += 1
            time.sleep(args.sleep)
            for item in fetch(ENDPOINTS[("live", kind)], key, day,
                              label=f"공고 {kind} {ds}"):
                r = row_live(item)
                if r:
                    prev = live[kind].get(r["no"]) or {}
                    for f in ("base", "lo", "hi"):
                        if prev.get(f) is not None:
                            r[f] = prev[f]
                    live[kind][r["no"]] = r
                    added["live"] += 1
            time.sleep(args.sleep)

            # ── 기초금액: 하루치를 통째로 받아 두 저장소에 같이 붙인다 ──
            bm = bsis_by_day(key, day, kind)
            for store in (first, live):
                for no, b in bm.items():
                    row = store[kind].get(no)
                    if row is not None and not row.get("base"):
                        row.update(b)
                        n_base += 1
            time.sleep(args.sleep)

        print(f"  {ds}  1순위 {len(first['con']) + len(first['serv']):,}건 "
              f"/ 공고 {len(live['con']) + len(live['serv']):,}건 "
              f"/ 기초금액 {n_base:,}건 누적")

    # ── 화면에 실릴 최근 건 중 기초금액이 빈 것만 공고번호로 개별 보충 ──
    todo = []
    for kind in KINDS:
        for store, fld in ((first, "dt"), (live, "dt")):
            rows = sorted(trim(store[kind], SHOW_DAYS, fld).values(),
                          key=lambda r: dt_digits(r.get(fld)), reverse=True)
            for r in rows[:MAX_ROWS]:
                if not r.get("base"):
                    todo.append((kind, r))
    seen = set()
    uniq = []
    for kind, r in todo:
        k = (kind, r["no"])
        if k not in seen:
            seen.add(k)
            uniq.append((kind, r))
    if uniq:
        print(f"  · 기초금액 개별조회 {min(len(uniq), BSIS_ONE_CAP):,}건 "
              f"(빈 건 {len(uniq):,})")
        for kind, r in uniq[:BSIS_ONE_CAP]:
            b = bsis_one(key, r["no"], kind)
            if b:
                r.update(b)
                n_base += 1
            time.sleep(args.sleep / 2)
    print(f"  · 기초금액 확보 {n_base:,}건")

    # ⚠️ 순서 중요: 잘라내기 전에 누적 CSV 로 먼저 옮긴다
    archive(first)

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
        for kind in ("con", "serv"):   # serv 는 수집하지 않으므로 항상 [] — 형식 유지용
            rows = list(trim(store[kind], SHOW_DAYS, date_field).values())
            rows.sort(key=lambda r: dt_digits(r.get(date_field)), reverse=True)
            # 첫 화면에서 내려받는 파일이라 무겁게 두면 그대로 전송량이 된다
            out[kind] = rows[:MAX_ROWS]
        p = os.path.join(OUT, f"{name}.json")
        with open(p, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(f"  → {name}.json  공사 {len(out['con']):,} / 용역 {len(out['serv']):,}"
              f"  ({os.path.getsize(p)/1024:.0f}KB)")

    def export_board(name, store, date_field):
        """한 달치를 500건씩 나눠 담는다.

        하루에 1순위 570건·공고 600건이 나오므로 300건만 실으면 반나절치도 안 된다.
        그렇다고 한 달치(약 18,000건, 6MB)를 한 파일에 넣으면 휴대폰에서 무겁다.
        그래서 묶음으로 쪼갠다 — 첫 화면은 0번만 받고,
        검색하거나 지역을 고를 때 나머지를 뒤에서 받아온다.
        """
        out_dir = os.path.join(OUT, "board")
        os.makedirs(out_dir, exist_ok=True)
        meta = {"built": built, "chunk": BOARD_CHUNK}
        total = 0
        for kind in ("con", "serv"):   # serv 는 비어 있음 (형식 유지용)
            rows = list(trim(store[kind], SHOW_DAYS, date_field).values())
            rows.sort(key=lambda r: dt_digits(r.get(date_field)), reverse=True)
            parts = [rows[i:i + BOARD_CHUNK]
                     for i in range(0, len(rows), BOARD_CHUNK)] or [[]]
            for i, part in enumerate(parts):
                with open(os.path.join(out_dir, f"{name}-{kind}-{i}.json"),
                          "w", encoding="utf-8") as f:
                    json.dump(part, f, ensure_ascii=False, separators=(",", ":"))
            # 지난번보다 묶음 수가 줄었을 때 남는 옛 파일을 정리한다.
            # (마운트된 폴더는 삭제가 막힐 수 있어, 안 되면 빈 파일로 덮어쓴다)
            i = len(parts)
            while True:
                stale = os.path.join(out_dir, f"{name}-{kind}-{i}.json")
                if not os.path.exists(stale):
                    break
                try:
                    os.remove(stale)
                except Exception:
                    with open(stale, "w", encoding="utf-8") as f:
                        f.write("[]")
                i += 1

            days = sorted({dt_digits(r.get(date_field))[:8] for r in rows if r.get(date_field)})
            meta[kind] = {
                "n": len(rows),
                "parts": len(parts),
                "from": days[0] if days else "",
                "to": days[-1] if days else "",
            }
            total += len(rows)
        with open(os.path.join(out_dir, f"{name}.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))
        size = sum(os.path.getsize(os.path.join(out_dir, x))
                   for x in os.listdir(out_dir) if x.startswith(name + "-"))
        print(f"  → board/{name}  {total:,}건 "
              f"(공사 {meta['con']['parts']}묶음 / 용역 {meta['serv']['parts']}묶음, "
              f"{size/1024/1024:.1f}MB)")


    def export_bidindex(store):
        """«바로투찰» 전용 — 아직 마감되지 않은 공고만 담은 가벼운 목록.

        투찰가를 계산하는 사람은 «앞으로 넣을 공고» 만 찾습니다.
        그런데 board/live-* 를 전부 받으면 4MB 가까이 됩니다.
        그래서 마감 전 공고만, 계산에 꼭 필요한 값만 골라
        배열 형태로 담습니다. (이름표를 빼면 크기가 절반쯤 됩니다)
        """
        # GitHub 서버는 세계표준시로 돕니다. 마감시각은 한국시간이라 KST 로 비교해야 합니다.
        now = datetime.now(KST).strftime("%Y%m%d%H%M%S")
        rows = []
        for r in store["con"].values():
            c = re.sub(r"[^0-9]", "", str(r.get("close") or ""))
            if not c:
                continue
            if c.ljust(14, "0") < now:      # 이미 마감된 공고는 뺀다
                continue
            rows.append([
                r.get("no") or "",
                r.get("name") or "",
                r.get("inst") or "",
                int(r.get("base") or 0),
                int(r.get("budget") or 0),
                r.get("close") or "",
                r.get("lo") if r.get("lo") is not None else -3,
                r.get("hi") if r.get("hi") is not None else 3,
            ])
        rows.sort(key=lambda x: re.sub(r"[^0-9]", "", str(x[5])))
        out = {"built": built,
               "f": ["no", "name", "inst", "base", "budget", "close", "lo", "hi"],
               "r": rows}
        path = os.path.join(OUT, "bidindex.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        have = sum(1 for x in rows if x[3] > 0)
        print(f"  \u2192 bidindex  \ub9c8\uac10\uc804 {len(rows):,}\uac74 "
              f"(\uae30\ucd08\uae08\uc561 \uc788\ub294 \uac83 {have:,}\uac74, "
              f"{os.path.getsize(path)/1024:.0f}KB)")

    print("-" * 52)
    export("first", first, "dt")
    export("live", live, "dt")
    export_board("first", first, "dt")
    export_board("live", live, "dt")
    export_bidindex(live)
    print("✅ 수집 완료")


if __name__ == "__main__":
    main()
