# -*- coding: utf-8 -*-
"""
tools/chgprobe.py — 조달청에 「설계변경(변경계약)」 자료가 오는지 **확인만** 합니다. (2026-09-05)

왜 확인부터 하나
  CLAUDE.md 1번·4번: 응답을 안 보고 «있다/없다» 를 단정해 세 번 틀렸습니다.
  이 파일은 자료를 저장하지 않습니다. 무엇이 오는지만 찍습니다.

두드리는 곳 — 나라장터 **계약정보 서비스**(입찰·개찰과 별개 서비스입니다)
  https://apis.data.go.kr/1230000/CntrctInfoService/{오퍼레이션}
  오퍼레이션 이름은 **모릅니다.** 후보를 두드려 HTTP 400 이면 없는 이름입니다.

⚠️ 이 API 도 data.go.kr 에서 «활용신청» 이 따로 필요할 수 있습니다(자동승인).
   조달청 키(G2B_API_KEY)를 그대로 씁니다.

쓰는 법:  python tools\\chgprobe.py
결과:     web/public/data/diag_change.json
"""

import io
import json
import os
import sys
import time

import requests
import urllib3

urllib3.disable_warnings()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "web", "public", "data")

# ── 2026-09-05 1차 확인 결과 (실측) ────────────────────────────────
#  /1230000/CntrctInfoService/…     → errMsg NO_OPENAPI_SERVICE_ERROR (없는 주소)
#  /1230000/ao/CntrctInfoService/…  → errMsg SERVICE_KEY_IS_NOT_REGISTERED_ERROR
#                                     = **주소는 맞고 키만 승인이 안 된 것**
#  그리고 같은 base 안에서도 오퍼레이션 이름이 틀리면 다시 «없는 서비스(12)» 가 옵니다.
#  → 그래서 아래 두 가지가 구별됩니다:
#      코드 30 = 이름이 맞다 (활용신청만 하면 된다)
#      코드 12 = 이름이 틀리다
BASES = [
    ("계약정보", "https://apis.data.go.kr/1230000/ao/CntrctInfoService"),
]
OPS = [
    # 1차에서 «코드 30»(이름 맞음)이 확인된 것
    "getCntrctInfoListCnstwkPPSSrch",      # 공사 — 조달청 계약 목록 ✔이름 확인
    "getCntrctInfoListCnstwk",             # 공사 ✔이름 확인
    "getCntrctInfoListThngPPSSrch",        # 물품 ✔이름 확인
    # 상세조회 (문서에 «기본조회/상세조회가 오퍼레이션별로 구분» 이라고 되어 있음)
    "getCntrctInfoDtlsCnstwkPPSSrch",
    "getCntrctInfoDtlsCnstwk",
    "getCntrctInfoCnstwkDtls",
    # 변경계약 후보
    "getCntrctInfoListCnstwkCntrctChg",
    "getCntrctInfoListCnstwkChg",
    "getCntrctInfoListChgCnstwk",
    "getCntrctInfoListCnstwkAmndmnt",
    "getCntrctInfoListCnstwkChgCntrct",
]


def key_of():
    env = {}
    p = os.path.join(ROOT, ".env")
    if os.path.exists(p):
        with io.open(p, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    k = env.get("G2B_API_KEY") or os.environ.get("G2B_API_KEY")
    if not k:
        print("⛔ .env 에 G2B_API_KEY 가 없습니다.")
        sys.exit(1)
    return k


def call(url, key, extra):
    params = {"serviceKey": key, "numOfRows": "5", "pageNo": "1",
              "inqryDiv": "1", "type": "json"}
    params.update(extra)
    out = {}
    try:
        r = requests.get(url, params=params, timeout=25, verify=False,
                         headers={"User-Agent": "Mozilla/5.0"})
    except Exception as e:
        return {"error": f"{type(e).__name__}: {e}"}
    out["http"] = r.status_code
    if r.status_code != 200:
        body = " ".join(r.text.split())
        out["body"] = body[:300]
        # 게이트웨이가 주는 이유 코드 — 이게 판정의 핵심입니다
        for tag, name in (("errMsg", "errMsg"), ("returnReasonCode", "reason"),
                          ("returnAuthMsg", "authMsg")):
            k = body.find(f'"{tag}"')
            if k >= 0:
                st = body.find('"', body.find(":", k) ) + 1
                en = body.find('"', st)
                out[name] = body[st:en]
        return out
    try:
        j = r.json()
    except Exception:
        out["json"] = False
        out["body"] = " ".join(r.text.split())[:200]
        return out
    resp = (j or {}).get("response", {}) if isinstance(j, dict) else {}
    head, body = resp.get("header", {}) or {}, resp.get("body", {}) or {}
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
        # 설계변경과 관계있어 보이는 항목만 골라 값을 보여 줍니다
        KEY = ("chg", "Chg", "cntrct", "Cntrct", "amt", "Amt", "ord", "Ord",
               "rsn", "Rsn", "dt", "Dt")
        out["sample"] = {k: str(v)[:48] for k, v in one.items()
                         if any(t in k for t in KEY)}
    return out


def main():
    key = key_of()
    today = time.strftime("%Y%m%d")
    ago = time.strftime("%Y%m%d", time.localtime(time.time() - 30 * 86400))
    print("설계변경(변경계약) 자료가 오는지 확인합니다\n")
    diag = {"확인시각": time.strftime("%Y-%m-%d %H:%M"), "시도": {}}

    for bname, base in BASES:
        for op in OPS:
            url = f"{base}/{op}"
            r = call(url, key, {"inqryBgnDt": ago + "0000",
                                "inqryEndDt": today + "2359"})
            diag["시도"][f"{bname}/{op}"] = r
            reason = r.get("reason") or ""
            if r.get("fields"):
                mark, note = "✅", "자료 옴"
            elif reason == "30":
                mark, note = "🔑", "이름 맞음 — **활용신청만 하면 됩니다**"
            elif reason == "12":
                mark, note = "❌", "그런 이름 없음"
            elif r.get("http") == 200:
                mark, note = "△", f"응답은 옴 (코드 {r.get('resultCode','')})"
            else:
                mark, note = "❌", (r.get("authMsg") or r.get("errMsg") or "실패")
            print(f"  {mark} {op:<36} HTTP {r.get('http')} · {note}")
            time.sleep(0.4)

    ok = [k for k, v in diag["시도"].items() if v.get("fields")]
    if ok:
        k = ok[0]
        print(f"\n  · {k} 의 항목 전체:")
        for f in diag["시도"][k]["fields"]:
            print(f"     {f}")
        print("\n  · 설계변경 관련으로 보이는 값:")
        for a, b in (diag["시도"][k].get("sample") or {}).items():
            print(f"     {a:<28} {b}")
    else:
        keyed = [k for k, v in diag["시도"].items() if v.get("reason") == "30"]
        if keyed:
            print("\n  🔑 주소와 이름은 맞습니다. **키 승인만 남았습니다.**")
            print("     data.go.kr → 「조달청_나라장터 계약정보서비스」 → 활용신청(자동승인)")
            print("     https://www.data.go.kr/data/15129427/openapi.do")
            print("     승인 뒤 이 파일을 다시 돌리면 항목까지 확인됩니다.")
            for k in keyed:
                print(f"       · {k}")
        else:
            print("\n  ⛔ 되는 오퍼레이션이 없습니다. 결과 파일을 보여 주세요.")

    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, "diag_change.json")
    with io.open(p, "w", encoding="utf-8") as f:
        json.dump(diag, f, ensure_ascii=False, indent=1)
    print(f"\n결과 → {p}")


if __name__ == "__main__":
    main()
