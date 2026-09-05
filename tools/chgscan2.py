# -*- coding: utf-8 -*-
"""
tools/chgscan2.py — 「변경된 계약정보이력조회」 를 찾고, 진짜 설계변경을 셉니다. (2026-09-05)

1차(chgscan.py)에서 알아낸 것 / 틀렸던 것:
  · 날짜 칸은 inqryBgnDt / inqryEndDt (YYYYMMDDHHMM) · inqryDiv 는 1 만 자료가 온다
  · 「금차≠총액 154%」 「공기연장 365일」 은 **설계변경이 아니라 장기계속계약**이었다
    (lngtrmCtnuDivNm=장기 · 금차 190일/총 540일 처럼 «올해분 vs 전체»)
  · ntceNo(공고번호)는 **비어서 온다** → 공고번호로는 우리 자료와 못 잇는다
  · chgDt 는 2,000건 전부 비어 있었다 → 이 오퍼레이션에는 변경 이력이 없다
  · 같은 계약을 묶는 열쇠는 untyCntrctNo 가 아니라 **dcsnCntrctNo / cntrctRefNo** 다

data.go.kr 설명에 「변경된 계약정보이력조회」 가 **있다고 적혀 있다.** 이름만 모른다.
→ ① 이름을 두드려 찾고  ② 찾으면 실제로 세어 본다.

판정: HTTP 400(코드 12) = 그런 이름 없음 · 403(코드 30) = 있는데 신청 안 됨 · 200 = 됨

쓰는 법:  python tools\chgscan2.py
결과:     web/public/data/diag_chgscan2.json
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
STORE = os.path.join(ROOT, "data", "store")
BASE = "https://apis.data.go.kr/1230000/ao/CntrctInfoService"

# ── ① 「변경된 계약정보이력조회」 이름 후보 ──────────────────────────
#    조달청 작명 버릇: get + 대상 + List/Dtls + 업무구분 + 꼬리표
CHG_OPS = [
    "getCntrctInfoListChgHstry", "getCntrctInfoChgHstryList",
    "getCntrctInfoListChgHst", "getCntrctInfoListHstry",
    "getCntrctInfoListCnstwkChgHstry", "getCntrctInfoListCnstwkHstry",
    "getCntrctInfoListCnstwkChgHst", "getCntrctChgHstryListCnstwk",
    "getChgCntrctInfoListCnstwk", "getChgCntrctInfoList",
    "getCntrctInfoListChgCnstwk2", "getCntrctInfoListCnstwkChgInfo",
    "getCntrctInfoChgListCnstwk", "getCntrctInfoHstryListCnstwk",
    "getCntrctInfoListChg", "getCntrctInfoListChangeHstry",
    "getCntrctInfoListAmndmntHstry", "getCntrctInfoListModHstry",
    "getCntrctInfoListCnstwkMod", "getCntrctInfoListCnstwkAmnd",
]
DEL_OPS = [
    "getCntrctInfoListDelts", "getCntrctInfoListDel",
    "getCntrctInfoListDelete", "getCntrctInfoDeltsList",
    "getCntrctInfoListCnstwkDelts",
]
# 1차에서 «HTTP 200 인데 자료 0» 이던 것 — 날짜 칸을 바꿔 다시 두드립니다
RETRY_OPS = ["getCntrctInfoListCnstwkPPSSrch", "getCntrctInfoListThngPPSSrch"]


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


def call(key, op, extra, rows="10", page="1"):
    p = {"serviceKey": key, "type": "json", "numOfRows": rows, "pageNo": page,
         "inqryDiv": "1"}
    p.update(extra)
    try:
        r = requests.get(BASE + "/" + op, params=p, timeout=30, verify=False,
                         headers={"User-Agent": "Mozilla/5.0"})
    except Exception as e:
        return {"error": "%s: %s" % (type(e).__name__, e)}
    o = {"http": r.status_code}
    txt = " ".join(r.text.split())
    if r.status_code != 200:
        o["body"] = txt[:220]
        m = re.search(r'"returnReasonCode"\s*:\s*"(\d+)"', txt)
        o["code"] = m.group(1) if m else ""
        return o
    try:
        j = r.json()
    except Exception:
        o["body"] = txt[:220]
        return o
    resp = ((j or {}).get("response", {}) or {})
    head, body = resp.get("header", {}) or {}, resp.get("body", {}) or {}
    o["resultCode"] = str(head.get("resultCode", ""))
    o["resultMsg"] = str(head.get("resultMsg", ""))[:100]
    o["total"] = body.get("totalCount")
    it = body.get("items")
    if isinstance(it, dict):
        it = it.get("item")
    if isinstance(it, dict):
        it = [it]
    o["rows"] = it if isinstance(it, list) else []
    return o


def win(days):
    e = dt.datetime.now()
    b = e - dt.timedelta(days=days)
    return {"inqryBgnDt": b.strftime("%Y%m%d%H%M"), "inqryEndDt": e.strftime("%Y%m%d%H%M")}


def num(v):
    try:
        return float(re.sub(r"[^0-9.\-]", "", str(v or "")) or 0)
    except Exception:
        return 0.0


def norm(s):
    return re.sub(r"[\s()（）\[\]·,.\-_]", "", str(s or ""))


def main():
    key = key_of()
    diag = {"확인시각": dt.datetime.now().strftime("%Y-%m-%d %H:%M")}
    w = win(30)

    # ── ① 이름 사냥 ───────────────────────────────────────────
    print("① 「변경된 계약정보이력조회」 이름을 찾습니다 (%d가지)" % (len(CHG_OPS) + len(DEL_OPS)))
    found, tried = [], {}
    for op in CHG_OPS + DEL_OPS + RETRY_OPS:
        r = call(key, op, w)
        if r.get("error"):
            mark, note = "…", r["error"][:50]
        elif r.get("http") == 200:
            n = len(r.get("rows") or [])
            if n:
                mark, note = "✅", "자료 옴 (총 %s건)" % r.get("total")
                found.append(op)
            else:
                mark, note = "△", "200 인데 0건 (resultCode=%s %s)" % (
                    r.get("resultCode", ""), r.get("resultMsg", "")[:40])
        elif r.get("code") == "30":
            mark, note = "🔑", "이름 맞음 — 활용신청 필요"
            found.append(op)
        else:
            mark, note = "❌", "없는 이름 (코드 %s)" % r.get("code", "")
        tried[op] = {k: v for k, v in r.items() if k != "rows"}
        tried[op]["판정"] = note
        print("   %s %-38s %s" % (mark, op, note))
    diag["이름사냥"] = tried
    diag["찾은것"] = found
    print("")

    # ── ② 진짜 설계변경 세기 — dcsnCntrctNo 로 묶는다 ─────────────
    print("② 같은 계약이 여러 줄로 오는지 봅니다 (dcsnCntrctNo 로 묶기)")
    rows, page = [], 1
    while page <= 60:
        r = call(key, "getCntrctInfoListCnstwk", w, rows="100", page=str(page))
        got = r.get("rows") or []
        rows.extend(got)
        if len(got) < 100:
            break
        page += 1
    print("   받은 계약 %d건 (%d쪽)" % (len(rows), page))

    by = {}
    for r0 in rows:
        k = (str(r0.get("dcsnCntrctNo") or "").strip()
             or str(r0.get("cntrctRefNo") or "").strip())
        if k:
            by.setdefault(k, []).append(r0)
    multi = {k: v for k, v in by.items() if len(v) > 1}
    print("   묶음 %d가지 · 여러 줄인 것 %d가지" % (len(by), len(multi)))

    # 여러 줄인 묶음에서 «금액이 실제로 달라진 것» 만 고릅니다
    real, samples = [], []
    for k, v in multi.items():
        v2 = sorted(v, key=lambda r0: str(r0.get("cntrctDate") or ""))
        a0, a1 = num(v2[0].get("totCntrctAmt")), num(v2[-1].get("totCntrctAmt"))
        if a0 > 0 and abs(a1 - a0) > 1:
            real.append((a1 - a0) / a0 * 100.0)
            if len(samples) < 5:
                samples.append({"묶음": k, "줄수": len(v2),
                                "공사명": str(v2[0].get("cnstwkNm"))[:40],
                                "처음": a0, "나중": a1,
                                "증감%": round((a1 - a0) / a0 * 100.0, 2),
                                "장기": v2[0].get("lngtrmCtnuDivNm")})
    def med(xs):
        if not xs:
            return None
        s = sorted(xs)
        return round(s[len(s) // 2], 3)
    diag["묶어보기"] = {"받은건수": len(rows), "묶음": len(by), "여러줄": len(multi),
                    "금액이 달라진 묶음": len(real), "증감%_중앙": med(real),
                    "예시": samples}
    print("   금액이 달라진 묶음 %d가지 (증감 중앙 %s%%)" % (len(real), med(real)))
    for s in samples:
        print("     · %s | %s줄 | %s → %s (%s%%) | %s"
              % (s["공사명"], s["줄수"], int(s["처음"]), int(s["나중"]), s["증감%"], s["장기"]))
    print("")

    # ── ③ 우리 자료와 «공사명+기관» 으로 잇기 ────────────────────
    print("③ 공고번호가 비어 오므로 «공사명+기관» 으로 이어붙여 봅니다")
    mine = {}
    p = os.path.join(STORE, "first.json")
    if os.path.exists(p):
        try:
            with io.open(p, encoding="utf-8") as f:
                st = json.load(f)
            for r0 in (st.get("con") or {}).values():
                nm = norm(r0.get("nm") or r0.get("bidNtceNm") or r0.get("name"))
                ins = norm(r0.get("inst") or r0.get("ntceInsttNm") or r0.get("dminsttNm"))
                if nm:
                    mine[(nm, ins)] = r0
                    mine[(nm, "")] = r0
        except Exception as e:
            diag["잇기_오류"] = str(e)[:120]
    hit = 0
    for r0 in rows:
        nm, ins = norm(r0.get("cnstwkNm")), norm(r0.get("cntrctInsttNm"))
        if (nm, ins) in mine or (nm, "") in mine:
            hit += 1
    pct = round(hit / len(rows) * 100.0, 1) if rows else 0.0
    diag["잇기"] = {"우리 개찰 공고 수": len(mine) // 2, "계약 %d건 중 만난 것" % len(rows): hit,
                  "비율%": pct}
    print("   우리 개찰 %d건 중 → 계약 %d건 가운데 %d건이 만납니다 (%s%%)"
          % (len(mine) // 2, len(rows), hit, pct))

    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    q = os.path.join(OUT, "diag_chgscan2.json")
    with io.open(q, "w", encoding="utf-8") as f:
        json.dump(diag, f, ensure_ascii=False, indent=1)
    print("\n결과 → %s" % q)


if __name__ == "__main__":
    main()
