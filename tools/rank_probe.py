# -*- coding: utf-8 -*-
"""3년치 개찰에 «투찰 순위»가 남아 있는지 시험합니다. (2026-09-15)

왜 필요한가
  · 우리가 가진 3년치 아카이브(bid_data_3years.zip · extra_*.csv)에는
    «1순위업체» 한 곳만 들어 있습니다. 2등 이하가 아예 없습니다.
  · 조달청은 공고번호로 물으면 투찰업체를 전부 줍니다(최근 개찰에서 확인).
    그런데 **몇 년 전 공고에도 주는지는 모릅니다.**
  · 이 스크립트는 분기마다 몇 건씩 골라 물어보고, 어느 시점까지 순위가
    남아 있는지 표로 보여 줍니다. 받은 자료는 저장하지 않습니다 — 시험만 합니다.

쓰는 법
  python tools\\rank_probe.py            (분기마다 5건)
  python tools\\rank_probe.py --per 3    (분기마다 3건)
"""
import argparse
import collections
import csv
import io
import json
import os
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
URL = ("http://apis.data.go.kr/1230000/as/ScsbidInfoService/"
       "getOpengResultListInfoOpengCompt")


def api_key():
    k = os.environ.get("G2B_API_KEY", "").strip()
    if not k:
        p = os.path.join(ROOT, ".env")
        if os.path.exists(p):
            for ln in io.open(p, encoding="utf-8"):
                if ln.strip().startswith("G2B_API_KEY="):
                    k = ln.split("=", 1)[1].strip()
                    break
    if not k:
        raise SystemExit("❌ G2B_API_KEY 가 없습니다 (.env 확인)")
    return urllib.parse.unquote(k)


def rows_3years():
    """아카이브를 훑어 (분기, 공고번호, 차수, 날짜) 를 흘려보냅니다."""
    z = os.path.join(DATA, "bid_data_3years.zip")
    if os.path.exists(z):
        with zipfile.ZipFile(z) as zf:
            for nm in zf.namelist():
                if not nm.lower().endswith(".csv"):
                    continue
                with zf.open(nm) as fh:
                    for r in csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig")):
                        yield r
    for fn in sorted(os.listdir(DATA)):
        if fn.startswith("extra_") and fn.endswith(".csv"):
            for r in csv.DictReader(io.open(os.path.join(DATA, fn), encoding="utf-8-sig")):
                yield r


def quarter(dt):
    m = re.match(r"(\d{4})-(\d{2})", str(dt or ""))
    if not m:
        return None
    y, mm = m.group(1), int(m.group(2))
    return "%s Q%d" % (y, (mm - 1) // 3 + 1)


def ask(key, no, ord_, ctx):
    q = urllib.parse.urlencode({"serviceKey": key, "pageNo": 1, "numOfRows": 60,
                                "type": "json", "bidNtceNo": no,
                                "bidNtceOrd": ord_})
    with urllib.request.urlopen(URL + "?" + q, timeout=15, context=ctx) as r:
        j = json.loads(r.read().decode("utf-8", "replace"))
    body = (j.get("response") or {}).get("body") or {}
    head = (j.get("response") or {}).get("header") or {}
    items = body.get("items") or []
    if isinstance(items, dict):
        items = items.get("item") or []
    if isinstance(items, dict):
        items = [items]
    return head.get("resultCode"), head.get("resultMsg"), body.get("totalCount"), items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per", type=int, default=5, help="분기마다 몇 건을 물어볼지")
    ap.add_argument("--sleep", type=float, default=0.6)
    ap.add_argument("--ords", type=int, default=4, help="공고차수를 몇 가지까지 바꿔 볼지")
    a = ap.parse_args()

    key = api_key()
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    # ── 분기마다 앞에서 --per 건씩만 모읍니다 (전수를 읽지 않으려고) ──
    pick = collections.OrderedDict()
    seen = 0
    for r in rows_3years():
        seen += 1
        dt = (r.get("날짜") or "")[:10]
        q = quarter(dt)
        no = (r.get("공고번호") or "").strip()
        if not q or not no:
            continue
        got = pick.setdefault(q, [])
        if len(got) < a.per:
            got.append((no, (r.get("공고차수") or "").strip() or "000", dt))
    print("아카이브 줄 %s · 분기 %d개" % (format(seen, ","), len(pick)))
    print()

    hdr = "%-9s %6s %6s %6s %6s   %s" % ("분기", "물음", "순위옴", "빈응답", "실패", "받은 줄(중앙)")
    print(hdr)
    print("-" * len(hdr))
    tot = collections.Counter()
    for q in sorted(pick):
        ok = empty = bad = 0
        counts = []
        msg = ""
        for no, ord_, dt in pick[q]:
            # ⚠️ 아카이브에는 «공고차수» 가 비어 있는 줄이 많습니다.
            #    차수가 틀리면 조달청은 오류가 아니라 «빈 응답» 을 줍니다.
            #    그래서 000 이 비면 001·002·003 까지 바꿔 가며 물어봅니다.
            tries = [ord_]
            for alt in ("000", "001", "002", "003"):
                if alt not in tries:
                    tries.append(alt)
            hit = None
            err = None
            for t in tries[:a.ords]:
                try:
                    code, m, total, items = ask(key, no, t, ctx)
                    if items:
                        hit = (t, items)
                        break
                    msg = msg or str(m or code or "")[:30]
                except Exception as e:
                    err = "%s: %s" % (type(e).__name__, str(e)[:40])
                time.sleep(a.sleep)
            if hit:
                ok += 1
                counts.append(len(hit[1]))
                if hit[0] != ord_:
                    tot["차수바꿔성공"] += 1
            elif err:
                bad += 1
                msg = msg or err
            else:
                empty += 1
        counts.sort()
        mid = counts[len(counts) // 2] if counts else 0
        tot["물음"] += len(pick[q]); tot["순위"] += ok
        tot["빈"] += empty; tot["실패"] += bad
        print("%-9s %6d %6d %6d %6d   %s %s"
              % (q, len(pick[q]), ok, empty, bad, mid or "-", ("· " + msg) if msg else ""))

    print()
    print("합계 — 물음 %s · 순위 옴 %s · 빈 응답 %s · 실패 %s  (그 중 차수 바꿔 성공 %s)"
          % (format(tot["물음"], ","), format(tot["순위"], ","),
             format(tot["빈"], ","), format(tot["실패"], ","),
             format(tot["차수바꿔성공"], ",")))
    print()
    if tot["순위"] == 0:
        print("→ 3년치 순위는 **받을 수 없습니다.** 오늘부터 쌓는 수밖에 없습니다.")
    elif tot["순위"] >= tot["물음"] * 0.8:
        print("→ 3년치 순위를 **받을 수 있습니다.** 위 표에서 «순위옴» 이 0 인 분기가 한계선입니다.")
    else:
        print("→ 일부만 옵니다. 위 표에서 어느 분기부터 끊기는지 보십시오.")


if __name__ == "__main__":
    main()
