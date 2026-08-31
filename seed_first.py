# -*- coding: utf-8 -*-
"""
seed_first.py — 조달청 수집(collect.py)을 아직 못 돌렸을 때
                3년치 원본의 최근 개찰 건으로 «1순위 현황판»을 미리 채운다.

collect.py 를 한 번이라도 돌리면 first.json 이 최신 데이터로 덮어써지므로
이 스크립트는 그 뒤로는 쓸 일이 없다. (--force 로 강제 실행 가능)

실행:  python seed_first.py
"""
import os
import json
import argparse
from datetime import timedelta

import pandas as pd

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "web", "public", "data")
DAYS = 21        # 원본 마지막 날짜에서 며칠 치를 실을지
MAX_ROWS = 300   # 화면당 최대 건수 (전송량 방어 — collect.py 와 같은 값)
CORPS = 6


def num(v, default=0):
    try:
        return int(float(str(v).replace(",", "").replace("원", "").strip()))
    except Exception:
        return default


def rate(v):
    try:
        f = float(str(v).replace("%", "").strip())
        return round(f, 3) if 0 < f <= 200 else None
    except Exception:
        return None


def rows_from(path):
    if not os.path.exists(path):
        return []
    comp = "zip" if path.endswith(".zip") else None
    df = None
    for enc in ("utf-8-sig", "cp949"):
        try:
            df = pd.read_csv(path, compression=comp, encoding=enc, low_memory=False)
            break
        except Exception:
            continue
    if df is None or df.empty:
        return []

    df["dt"] = pd.to_datetime(df.get("날짜"), errors="coerce")
    df = df.dropna(subset=["dt"])
    if df.empty:
        return []
    df = df[df["dt"] >= df["dt"].max() - timedelta(days=DAYS)]
    df = df.sort_values("dt", ascending=False).head(MAX_ROWS)

    out = []
    for _, r in df.iterrows():
        corps = []
        for c in str(r.get("전체업체", "") or "").split("|")[:CORPS]:
            p = c.split("^")
            if len(p) >= 5 and p[0].strip():
                corps.append([p[0].strip(), num(p[3]), rate(p[4])])
        amt = num(r.get("투찰금액"))
        rt = rate(r.get("투찰률"))
        win = str(r.get("1순위업체", "")).strip()
        out.append({
            "no": str(r.get("공고번호", "")).strip(),
            "name": str(r.get("공고명", "")).strip(),
            "inst": str(r.get("발주기관", "")).strip(),
            "dt": r["dt"].strftime("%Y-%m-%d %H:%M"),
            "win": win, "amt": amt, "rate": rt,
            "corps": corps or [[win, amt, rt]],
        })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true",
                    help="collect.py 로 받은 최신 데이터가 있어도 덮어쓴다")
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    first_path = os.path.join(OUT, "first.json")

    if os.path.exists(first_path) and not args.force:
        try:
            cur = json.load(open(first_path, encoding="utf-8"))
            if cur.get("built") and "3년" not in str(cur.get("built")):
                print("  이미 collect.py 로 받은 최신 데이터가 있습니다 → 건너뜁니다")
                print("  (덮어쓰려면 --force)")
                return
        except Exception:
            pass

    data = {
        "built": "3년치 원본 기준 — collect.py 를 돌리면 최신으로 교체됩니다",
        "con": rows_from(os.path.join(ROOT, "data", "bid_data_3years.zip")),
        "serv": rows_from(os.path.join(ROOT, "data", "service_data_3years.zip")),
    }
    with open(first_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    live_path = os.path.join(OUT, "live.json")
    if not os.path.exists(live_path):
        with open(live_path, "w", encoding="utf-8") as f:
            json.dump({"built": "", "con": [], "serv": []}, f, ensure_ascii=False)

    print(f"  ✅ first.json — 공사 {len(data['con'])}건 / 용역 {len(data['serv'])}건"
          f"  ({os.path.getsize(first_path)/1024:.0f}KB)")


if __name__ == "__main__":
    main()
