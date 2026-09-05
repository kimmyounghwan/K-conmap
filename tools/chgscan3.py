# -*- coding: utf-8 -*-
"""
tools/chgscan3.py — 「변경된 계약정보이력조회」 조건 찾기 (2026-09-05)

2차에서 이름을 확정했습니다:
    getCntrctInfoListCnstwkChgHstry  →  HTTP 200 · resultCode=00 «정상» · 0건
「없는 이름」은 코드 12 로 잘립니다. 정상 응답이 왔으니 **이름은 맞습니다.**
0건인 이유는 조건(날짜 칸 이름 · inqryDiv 뜻 · 기간)이 다르기 때문입니다.

이 도구는 짐작하지 않고 **다 대봅니다**:
    날짜 칸 2가지 × inqryDiv 1~5 × 기간 3가지 + 날짜 없이 + 계약번호로
0건일 때도 **응답 원문을 그대로 남깁니다** — 「왜 0건인지」를 보고 정합니다.

곁들여: 1·2차에서 «200 인데 resultCode 가 비어 있던» PPSSrch 두 가지도
        원문을 통째로 남깁니다(응답 모양이 다를 수 있습니다).

쓰는 법:  python tools\chgscan3.py
결과:     web/public/data/diag_chgscan3.json
"""

import io
import json
import os
import re
import sys
import datetime as dt

import requests
import urllib3

urllib3.disable_warnings()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "web", "public", "data")
BASE = "https://apis.data.go.kr/1230000/ao/CntrctInfoService"

OP = "getCntrctInfoListCnstwkChgHstry"          # 2차에서 확정된 이름
OTHERS = ["getCntrctInfoListCnstwkPPSSrch", "getCntrctInfoListThngPPSSrch"]

DATEKEYS = [
    ("inqryBgnDt", "inqryEndDt", "%Y%m%d%H%M"),   # 목록 오퍼레이션이 쓰는 것
    ("inqryBgnDate", "inqryEndDate", "%Y%m%d"),   # 다른 서비스가 쓰는 것
]
WINDOWS = [7, 30, 180]


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


def raw(key, op, extra):
    """응답을 «해석하지 않고» 그대로 돌려줍니다. 0건의 이유는 원문에 있습니다."""
    p = {"serviceKey": key, "type": "json", "numOfRows": "10", "pageNo": "1"}
    p.update(extra)
    try:
        r = requests.get(BASE + "/" + op, params=p, timeout=30, verify=False,
                         headers={"User-Agent": "Mozilla/5.0"})
    except Exception as e:
        return {"error": "%s: %s" % (type(e).__name__, e)}
    txt = " ".join(r.text.split())
    o = {"http": r.status_code, "원문": txt[:700]}
    try:
        j = r.json()
    except Exception:
        return o
    resp = ((j or {}).get("response", {}) or {}) if isinstance(j, dict) else {}
    head, body = resp.get("header", {}) or {}, resp.get("body", {}) or {}
    o["resultCode"] = str(head.get("resultCode", ""))
    o["resultMsg"] = str(head.get("resultMsg", ""))[:150]
    o["totalCount"] = body.get("totalCount")
    it = body.get("items")
    if isinstance(it, dict):
        it = it.get("item")
    if isinstance(it, dict):
        it = [it]
    o["건수"] = len(it) if isinstance(it, list) else 0
    if isinstance(it, list) and it and isinstance(it[0], dict):
        o["항목"] = sorted(it[0].keys())
        o["첫줄"] = {k: str(v)[:60] for k, v in it[0].items()}
        o.pop("원문", None)          # 자료가 왔으면 원문은 필요 없습니다
    return o


def win(days, fmt):
    e = dt.datetime.now()
    b = e - dt.timedelta(days=days)
    return b.strftime(fmt), e.strftime(fmt)


def main():
    key = key_of()
    diag = {"확인시각": dt.datetime.now().strftime("%Y-%m-%d %H:%M"), "오퍼레이션": OP}
    hits = []

    # ── ① 날짜칸 × inqryDiv × 기간 ────────────────────────────
    print("① %s — 조건을 다 대봅니다" % OP)
    grid = {}
    for a, b, fmt in DATEKEYS:
        for days in WINDOWS:
            s, e = win(days, fmt)
            for div in ("1", "2", "3", "4", "5"):
                lab = "%s·%d일·div%s" % (a, days, div)
                r = raw(key, OP, {a: s, b: e, "inqryDiv": div})
                grid[lab] = r
                n = r.get("건수", 0)
                if n:
                    hits.append(lab)
                    print("   ✅ %-28s %d건 (총 %s)" % (lab, n, r.get("totalCount")))
                else:
                    why = r.get("resultMsg") or r.get("error") or ("HTTP %s" % r.get("http"))
                    print("   ·  %-28s 0건 · %s" % (lab, str(why)[:52]))
    diag["격자"] = grid

    # ── ② 날짜 없이 / inqryDiv 없이 ───────────────────────────
    print("\n② 조건을 빼고도 불러 봅니다")
    plain = {}
    for lab, ex in (("날짜없음·div1", {"inqryDiv": "1"}),
                    ("날짜없음·div없음", {}),
                    ("div없음·30일", dict([(DATEKEYS[0][0], win(30, DATEKEYS[0][2])[0]),
                                        (DATEKEYS[0][1], win(30, DATEKEYS[0][2])[1])]))):
        r = raw(key, OP, ex)
        plain[lab] = r
        n = r.get("건수", 0)
        print("   %s %-20s %d건 · %s" % ("✅" if n else "· ", lab, n,
                                        str(r.get("resultMsg") or r.get("http"))[:52]))
        if n:
            hits.append(lab)
    diag["조건없이"] = plain

    # ── ③ 계약번호 하나로 콕 집어 ─────────────────────────────
    print("\n③ 계약번호를 넣어 봅니다 (변경이력은 «건별 조회» 일 수 있습니다)")
    # 목록에서 실제 계약번호 하나를 가져옵니다 — 손으로 만들지 않습니다
    s, e = win(30, "%Y%m%d%H%M")
    lst = raw(key, "getCntrctInfoListCnstwk",
              {"inqryBgnDt": s, "inqryEndDt": e, "inqryDiv": "1"})
    one = lst.get("첫줄") or {}
    nums = {k: one.get(k, "") for k in
            ("untyCntrctNo", "cntrctRefNo", "dcsnCntrctNo", "cntrctInsttCd")}
    diag["써본_계약번호"] = nums
    print("   써본 번호: %s" % json.dumps(nums, ensure_ascii=False))
    byno = {}
    for k, v in nums.items():
        if not v:
            continue
        r = raw(key, OP, {k: v, "inqryDiv": "1"})
        byno[k] = r
        n = r.get("건수", 0)
        print("   %s %-16s %d건 · %s" % ("✅" if n else "· ", k, n,
                                        str(r.get("resultMsg") or r.get("http"))[:52]))
        if n:
            hits.append("번호:" + k)
    diag["번호로"] = byno

    # ── ④ PPSSrch 두 가지 원문 남기기 ─────────────────────────
    print("\n④ PPSSrch 두 가지의 응답 원문을 남깁니다")
    oth = {}
    for op in OTHERS:
        r = raw(key, op, {"inqryBgnDt": s, "inqryEndDt": e, "inqryDiv": "1"})
        oth[op] = r
        print("   · %-34s HTTP %s · %d건" % (op, r.get("http"), r.get("건수", 0)))
    diag["PPSSrch"] = oth

    diag["된조건"] = hits
    print("\n" + ("✅ 자료가 온 조건: " + ", ".join(hits) if hits
                 else "⚠️ 아직 자료가 온 조건이 없습니다 — diag 의 «원문» 을 보세요"))

    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    p = os.path.join(OUT, "diag_chgscan3.json")
    with io.open(p, "w", encoding="utf-8") as f:
        json.dump(diag, f, ensure_ascii=False, indent=1)
    print("결과 → %s" % p)


if __name__ == "__main__":
    main()
