# -*- coding: utf-8 -*-
"""
tools/corpdir_probe.py — 「전국 건설업체 명부」를 받을 수 있는지 **확인만** 합니다. (2026-09-05)

왜 확인부터 하나
  CLAUDE.md 1번·4번을 세 번 어겼습니다 — 응답 항목을 안 보고 «있다/없다» 를 단정했습니다.
  이번에는 **한 번도 짐작하지 않습니다.** 이 파일은 자료를 저장하지 않고,
  응답에 실제로 무엇이 오는지만 찍어 봅니다. 그걸 보고 나서 수집기를 만듭니다.

무엇을 두드리나 (국토교통부 KISCON · 공공데이터포털)
  https://apis.data.go.kr/1613000/ConAdminInfoSvc1/{오퍼레이션}
  · GongsiReg  = 건설업체등록 공시     ← 문서에 이름이 나와 있는 유일한 것
  · 나머지(등록기준신고·양도·합병·상속·행정처분·폐업)는 **이름을 모릅니다.**
    후보를 여러 개 두드려 보고, HTTP 400 이 나면 «없는 이름» 입니다.

⚠️ 조달청 키와 **다른 API 입니다.** data.go.kr 에서 이 서비스에 «활용신청» 을 따로 해야 합니다
   (자동승인). 승인 뒤 키는 조달청 것과 같은 값이어도 되고, 다르면 .env 에 CONS_API_KEY 로 넣으세요.

쓰는 법 (소장님 PC 에서):
    python tools\\corpdir_probe.py
결과는 화면에 찍히고 web/public/data/diag_corpdir.json 에도 남습니다.
"""

import io
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
import urllib3

urllib3.disable_warnings()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "web", "public", "data")
BASE = "https://apis.data.go.kr/1613000/ConAdminInfoSvc1"

# 문서에 나온 것 하나 + 나머지는 «후보» 입니다. 400 이 나오면 그 이름은 없는 것입니다.
OPS = [
    ("건설업체등록", "GongsiReg"),
    ("등록기준사항신고", "GongsiStd"),
    ("양도신고", "GongsiTrans"),
    ("법인합병신고", "GongsiMerge"),
    ("상속신고", "GongsiInherit"),
    ("행정처분", "GongsiPunish"),
    ("행정처분가처분", "GongsiPunishTemp"),
    ("폐업신고", "GongsiClose"),
]


def key_of():
    """.env 의 CONS_API_KEY → 없으면 G2B_API_KEY(조달청 키) 를 그대로 써 봅니다."""
    env = {}
    p = os.path.join(ROOT, ".env")
    if os.path.exists(p):
        with io.open(p, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    k = env.get("CONS_API_KEY") or env.get("G2B_API_KEY") or os.environ.get("G2B_API_KEY")
    if not k:
        print("⛔ .env 에 CONS_API_KEY(또는 G2B_API_KEY)가 없습니다.")
        sys.exit(1)
    return k


def call(op, key, s_date, e_date, rows=10, page=1):
    """한 번 부르고 «무슨 일이 있었는지» 를 그대로 돌려줍니다."""
    url = f"{BASE}/{op}"
    params = {
        "ServiceKey": key, "pageNo": str(page), "numOfRows": str(rows),
        "sDate": s_date, "eDate": e_date, "_type": "json",
    }
    out = {"url": url, "sDate": s_date, "eDate": e_date}
    try:
        r = requests.get(url, params=params, timeout=25, verify=False,
                         headers={"User-Agent": "Mozilla/5.0"})
    except Exception as e:
        out["error"] = f"{type(e).__name__}: {e}"
        return out
    out["http"] = r.status_code
    if r.status_code != 200:
        out["body"] = " ".join(r.text.split())[:300]
        return out
    try:
        j = r.json()
    except Exception:
        out["json"] = False
        out["body"] = " ".join(r.text.split())[:300]
        return out
    resp = (j or {}).get("response", {}) if isinstance(j, dict) else {}
    head = resp.get("header", {}) or {}
    body = resp.get("body", {}) or {}
    out["resultCode"] = str(head.get("resultCode", ""))
    out["resultMsg"] = str(head.get("resultMsg", ""))[:120]
    out["totalCount"] = body.get("totalCount")
    items = body.get("items")
    if isinstance(items, dict):
        items = items.get("item")
    if isinstance(items, dict):
        items = [items]
    if isinstance(items, list) and items and isinstance(items[0], dict):
        one = items[0]
        out["fields"] = sorted(one.keys())
        # ⚠️ 첫 줄을 통째로 남깁니다 — 항목 «이름»만 보고 뜻을 짐작하면 또 틀립니다.
        #    다만 개인정보로 보이는 값은 가려서 남깁니다.
        MASK = {"ncrGsMaster", "ncrOffTel", "ncrMasterNum"}
        out["sample"] = {k: ("***가림***" if k in MASK else str(v)[:60])
                         for k, v in one.items()}
    else:
        out["fields"] = []
    return out


def main():
    key = key_of()
    print("전국 건설업체 명부 — 받을 수 있는지 확인합니다\n")
    print("⚠️ 이 API 는 조달청과 별개입니다. data.go.kr 에서")
    print("   「국토교통부_키스콘 건설업체정보 서비스」에 활용신청(자동승인)이 되어 있어야 합니다.\n")

    diag = {"확인시각": time.strftime("%Y-%m-%d %H:%M"), "오퍼레이션": {}}

    # ① 오퍼레이션 이름 찾기 — 최근 한 달로 가볍게
    today = time.strftime("%Y%m%d")
    month_ago = time.strftime("%Y%m%d", time.localtime(time.time() - 30 * 86400))
    for label, op in OPS:
        r = call(op, key, month_ago, today, rows=3)
        diag["오퍼레이션"][op] = r
        mark = "✅" if r.get("fields") else ("△" if r.get("http") == 200 else "❌")
        n = r.get("totalCount")
        print(f"  {mark} {label:<14} {op:<18} HTTP {r.get('http')} "
              f"· 코드 {r.get('resultCode','')} · 총 {n if n is not None else '-'} "
              f"· 항목 {len(r.get('fields') or [])}개")
        if r.get("error"):
            print(f"       ! {r['error']}")
        elif r.get("resultMsg") and r.get("resultCode") not in ("00", "0", ""):
            print(f"       ! {r['resultMsg']}")
        time.sleep(0.4)

    # ② 되는 것 하나로 «몇 년치를 훑어야 하나» 를 가늠합니다
    ok = [op for op, r in diag["오퍼레이션"].items() if r.get("fields")]
    if ok:
        op = ok[0]
        print(f"\n  · {op} 로 연도별 건수를 재봅니다 (명부를 만들려면 몇 년을 훑어야 하는지)")
        diag["연도별"] = {}
        for y in range(2020, int(today[:4]) + 1):
            r = call(op, key, f"{y}0101", f"{y}1231", rows=1)
            diag["연도별"][y] = r.get("totalCount")
            print(f"     {y}년  공시 {r.get('totalCount')}건")
            time.sleep(0.4)
        print("\n  · 첫 줄 항목 (개인정보는 가림):")
        for k, v in (diag["오퍼레이션"][op].get("sample") or {}).items():
            print(f"     {k:<22} {v}")
    else:
        print("\n  ⛔ 되는 오퍼레이션이 하나도 없습니다.")
        print("     활용신청이 안 되어 있거나, 오퍼레이션 이름이 다릅니다.")
        print("     아래 결과 파일을 저에게 보여 주시면 이름을 다시 찾겠습니다.")

    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, "diag_corpdir.json")
    with io.open(p, "w", encoding="utf-8") as f:
        json.dump(diag, f, ensure_ascii=False, indent=1)
    print(f"\n결과를 남겼습니다 → {p}")
    print("이 파일 내용을 그대로 붙여 주시면 수집기를 만들겠습니다.")


if __name__ == "__main__":
    main()
