# -*- coding: utf-8 -*-
"""
probe_api.py — 「기초금액이 안 나온다」의 진짜 원인을 찾는 진단 도구

기초금액 수집이 계속 실패한 이유는 보통 셋 중 하나입니다.
  ① 오퍼레이션을 잘못 고름
     기초금액은 목록 API 가 아니라 전용 오퍼레이션(...BsisAmount)에 있습니다.
  ② inqryDiv 를 안 넣음
     공고번호로 조회하려면 inqryDiv=2 가 필요합니다. 빠뜨리면 빈 응답이 옵니다.
  ③ 필드 이름 대소문자
     응답 키가 bssAmt 가 아니라 bssamt 인 경우가 있습니다.
     이러면 데이터는 왔는데 화면엔 계속 빈칸으로 보입니다.

이 스크립트는 추측하지 않습니다. 여러 조합을 실제로 호출해서
'무엇이 왔는지'를 있는 그대로 보여줍니다.

실행:  python probe_api.py
      python probe_api.py 20260812345      (공고번호 직접 지정)
"""
import os
import re
import sys
import json
import time

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE = "http://apis.data.go.kr/1230000"
HEAD = {"User-Agent": "Mozilla/5.0"}

# 금액처럼 보이는 필드를 찾을 때 쓰는 힌트
MONEY_HINT = re.compile(r"(amt|amount|prce|price|금액|가격)", re.I)


def load_env():
    p = os.path.join(ROOT, ".env")
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def pick_bid_no():
    """수집해 둔 데이터에서 시험용 공고번호를 하나 고른다"""
    for name in ("first", "live"):
        p = os.path.join(ROOT, "data", "store", f"{name}.json")
        if not os.path.exists(p):
            continue
        try:
            d = json.load(open(p, encoding="utf-8"))
            for kind in ("con", "serv"):
                for v in (d.get(kind) or {}).values():
                    no = str(v.get("no", "")).strip()
                    if no:
                        return no, name
        except Exception:
            pass
    return None, None


def call(op, params, key):
    url = f"{BASE}/{op}"
    p = {"serviceKey": key, "type": "json", "numOfRows": "5", "pageNo": "1"}
    p.update(params)
    try:
        r = requests.get(url, params=p, timeout=20, verify=False, headers=HEAD)
    except Exception as e:
        return {"ok": False, "why": f"통신 실패 {type(e).__name__}"}
    if r.status_code != 200:
        return {"ok": False, "why": f"HTTP {r.status_code}", "body": r.text[:160]}
    try:
        j = r.json()
    except Exception:
        return {"ok": False, "why": "JSON 아님(대개 키 오류)", "body": r.text[:220]}

    body = (j.get("response") or {}).get("body") or {}
    head = (j.get("response") or {}).get("header") or {}
    code = head.get("resultCode", "?")
    msg = head.get("resultMsg", "?")
    items = body.get("items", [])
    if isinstance(items, dict):
        items = items.get("item", [items])
    if not isinstance(items, list):
        items = [items] if items else []
    return {"ok": True, "code": code, "msg": msg, "count": len(items),
            "total": body.get("totalCount", "?"),
            "item": items[0] if items else None}


def show(title, res):
    print(f"\n── {title}")
    if not res["ok"]:
        print(f"   ❌ {res['why']}")
        if res.get("body"):
            print(f"      {res['body']}")
        return None
    print(f"   resultCode={res['code']} ({res['msg']}) · totalCount={res['total']} · 받은 건수={res['count']}")
    item = res.get("item")
    if not item:
        print("   ⚠️  응답은 왔지만 항목이 비어 있습니다")
        return None
    money = {k: v for k, v in item.items() if MONEY_HINT.search(k) and str(v).strip() not in ("", "0", "-")}
    if money:
        print("   💰 금액으로 보이는 필드:")
        for k, v in sorted(money.items()):
            print(f"        {k} = {v}")
    else:
        print("   (금액 필드 없음)")
    return item


def main():
    load_env()
    key = os.environ.get("G2B_API_KEY", "").strip()
    if not key:
        raise SystemExit("❌ .env 의 G2B_API_KEY 가 비어 있습니다")
    import urllib.parse
    key = urllib.parse.unquote(key)

    bid_no = sys.argv[1] if len(sys.argv) > 1 else None
    src = "직접 지정"
    if not bid_no:
        bid_no, src = pick_bid_no()
    if not bid_no:
        raise SystemExit("❌ 시험할 공고번호를 못 찾았습니다.\n"
                         "   먼저 python collect.py 를 돌리거나,\n"
                         "   python probe_api.py 20260812345 처럼 번호를 넣어주세요.")

    print("=" * 60)
    print(f"  기초금액 진단 — 공고번호 {bid_no}  (출처: {src})")
    print("=" * 60)

    found = {}

    # ① 공사 기초금액 전용 오퍼레이션 — 가장 유력한 정답
    r = call("ad/BidPublicInfoService/getBidPblancListInfoCnstwkBsisAmount",
             {"inqryDiv": "2", "bidNtceNo": bid_no}, key)
    it = show("① 공사 기초금액 전용 (BsisAmount, inqryDiv=2)", r)
    if it:
        found["BsisAmount"] = it

    time.sleep(0.4)

    # ② 같은 오퍼레이션인데 inqryDiv 를 뺀 경우 — 이게 기존 실패 원인인지 확인
    r = call("ad/BidPublicInfoService/getBidPblancListInfoCnstwkBsisAmount",
             {"bidNtceNo": bid_no}, key)
    show("② 같은 오퍼레이션, inqryDiv 없음 (실패 재현용)", r)

    time.sleep(0.4)

    # ③ 공고 세부정보
    r = call("ad/BidPublicInfoService/getBidPblancListInfoCnstwkDtl",
             {"inqryDiv": "2", "bidNtceNo": bid_no, "bidNtceOrd": "00"}, key)
    it = show("③ 공고 세부정보 (Dtl, inqryDiv=2)", r)
    if it:
        found["공고Dtl"] = it

    time.sleep(0.4)

    # ④ 개찰결과 세부정보 — 예정가격·낙찰금액
    r = call("as/ScsbidInfoService/getOpengResultListInfoCnstwkDtl",
             {"inqryDiv": "2", "bidNtceNo": bid_no, "bidNtceOrd": "00"}, key)
    it = show("④ 개찰결과 세부정보 (Dtl, inqryDiv=2)", r)
    if it:
        found["개찰Dtl"] = it

    time.sleep(0.4)

    # ⑤ 낙찰 정보
    r = call("as/ScsbidInfoService/getScsbidListInfoCnstwk",
             {"inqryDiv": "2", "bidNtceNo": bid_no}, key)
    it = show("⑤ 낙찰정보 (ScsbidList, inqryDiv=2)", r)
    if it:
        found["낙찰"] = it

    # ── 결론 ──
    print("\n" + "=" * 60)
    print("  결론")
    print("=" * 60)
    if not found:
        print("  ❌ 어느 것도 데이터를 주지 못했습니다.")
        print("     → 위의 resultCode / resultMsg 를 그대로 알려주세요.")
        print("     자주 나오는 것: 30(등록되지 않은 키) 31(활용기한 만료)")
        print("                    22(요청 초과) 04(HTTP 오류)")
    else:
        print(f"  ✅ 데이터를 받은 경로: {', '.join(found)}")
        print("\n  기초금액으로 쓸 수 있는 필드:")
        hit = False
        for src_name, item in found.items():
            for k, v in item.items():
                if re.search(r"bss|기초", k, re.I) and str(v).strip() not in ("", "0", "-"):
                    print(f"     {src_name}.{k} = {v}")
                    hit = True
        if not hit:
            print("     (없음 — 아래 전체 키 목록에서 찾아야 합니다)")
        print("\n  받은 전체 키 목록:")
        for src_name, item in found.items():
            print(f"     [{src_name}] {', '.join(sorted(item.keys()))}")

    out = os.path.join(ROOT, "_임시", "probe_result.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(found, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n  전체 응답 저장: _임시/probe_result.json")
    print("  → 이 파일이나 위 출력을 그대로 붙여넣어 주세요.")


if __name__ == "__main__":
    main()
