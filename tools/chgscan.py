# -*- coding: utf-8 -*-
"""
tools/chgscan.py — 계약정보(getCntrctInfoListCnstwk) 로 «설계변경이 실제로 보이는지» 재봅니다.
(2026-09-05)

chgprobe.py 로 자료가 오는 것까지 확인했습니다. 이 도구는 그 다음 질문에 답합니다.

  1) 날짜로 훑으려면 어떤 이름을 써야 하나  ← 짐작하지 않고 다 두드려 봅니다
  2) inqryDiv 가 무엇을 가르는가            ← 1·2·3·4 를 다 넣어 봅니다
  3) 변경계약이 실제로 몇 %나 되는가        ← 세어 봅니다
  4) 금액이 얼마나 늘어나는가 · 공기가 며칠 늘어나는가
  5) 공고번호(ntceNo)로 우리 자료와 이어붙일 수 있는가  ← 이게 되면 기관별 분석이 됩니다

쓰는 법:  python tools\chgscan.py
          python tools\chgscan.py --days 30      (기본 30일)
결과:     web/public/data/diag_chgscan.json  (+ 화면 요약)

⚠️ 결과를 보기 전에는 아무것도 «된다/안 된다» 고 말하지 않습니다.
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

URL = "https://apis.data.go.kr/1230000/ao/CntrctInfoService/getCntrctInfoListCnstwk"

# 날짜 칸 이름 후보 — 조달청은 오퍼레이션마다 다릅니다. 다 두드려 보고 되는 것을 씁니다.
DATE_KEYS = [
    ("inqryBgnDate", "inqryEndDate", "%Y%m%d"),
    ("inqryBgnDt", "inqryEndDt", "%Y%m%d%H%M"),
    ("cntrctCnclsBgnDate", "cntrctCnclsEndDate", "%Y%m%d"),
    ("bgnDate", "endDate", "%Y%m%d"),
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


def call(key, params):
    p = {"serviceKey": key, "type": "json", "numOfRows": "100", "pageNo": "1"}
    p.update(params)
    try:
        r = requests.get(URL, params=p, timeout=30, verify=False,
                         headers={"User-Agent": "Mozilla/5.0"})
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"
    if r.status_code != 200:
        return None, "HTTP %d %s" % (r.status_code, " ".join(r.text.split())[:120])
    try:
        j = r.json()
    except Exception:
        return None, "json 아님: " + " ".join(r.text.split())[:120]
    body = ((j or {}).get("response", {}) or {}).get("body", {}) or {}
    items = body.get("items")
    if isinstance(items, dict):
        items = items.get("item")
    if isinstance(items, dict):
        items = [items]
    if not isinstance(items, list):
        items = []
    return {"total": body.get("totalCount"), "rows": items}, ""


def num(v):
    try:
        return float(re.sub(r"[^0-9.\-]", "", str(v or "")) or 0)
    except Exception:
        return 0.0


def days_of(txt):
    """cntrctPrd 예: «금차 60일, 총공사 90일» → (60, 90). 못 읽으면 (None, None)."""
    if not txt:
        return None, None
    n = re.findall(r"(\d+)\s*일", str(txt))
    if len(n) >= 2:
        return int(n[0]), int(n[1])
    if len(n) == 1:
        return int(n[0]), int(n[0])
    return None, None


def store_notices():
    """우리 저장소의 공고번호 — ntceNo 로 이어붙일 수 있는지 재기 위해."""
    got = set()
    for name in ("first.json", "live.json"):
        p = os.path.join(STORE, name)
        if not os.path.exists(p):
            continue
        try:
            with io.open(p, encoding="utf-8") as f:
                d = json.load(f)
        except Exception:
            continue
        rows = d if isinstance(d, list) else (d.get("rows") or d.get("con") or [])
        if isinstance(d, dict) and not rows:
            for v in d.values():
                if isinstance(v, list):
                    rows = v
                    break
        for r in rows if isinstance(rows, list) else []:
            if isinstance(r, dict):
                for k in ("no", "bidNtceNo", "bno", "ntceNo"):
                    if r.get(k):
                        got.add(str(r[k]).strip())
                        break
    return got


def main():
    days = 30
    if "--days" in sys.argv:
        try:
            days = int(sys.argv[sys.argv.index("--days") + 1])
        except Exception:
            pass
    key = key_of()
    diag = {"확인시각": dt.datetime.now().strftime("%Y-%m-%d %H:%M"), "기간(일)": days}
    end = dt.date.today()
    bgn = end - dt.timedelta(days=days)

    # ── 1. 날짜 칸 이름 찾기 ─────────────────────────────────────
    print("1) 날짜로 훑는 이름을 찾습니다")
    picked = None
    tried = {}
    for a, b, fmt in DATE_KEYS:
        pr = {"inqryDiv": "1", a: bgn.strftime(fmt), b: end.strftime(fmt), "numOfRows": "5"}
        got, err = call(key, pr)
        n = len(got["rows"]) if got else 0
        tot = got["total"] if got else None
        tried["%s/%s" % (a, b)] = {"오류": err, "받은건수": n, "totalCount": tot}
        mark = "✅" if n else ("△" if not err else "❌")
        print("   %s %-34s %s" % (mark, a, err or ("%d건 (총 %s)" % (n, tot))))
        if n and picked is None:
            picked = (a, b, fmt)
    diag["날짜칸_시도"] = tried
    if not picked:
        print("\n⛔ 날짜로 훑는 이름을 못 찾았습니다. diag 를 보고 후보를 늘리세요.")
        diag["결론"] = "날짜칸 못 찾음"
        save(diag)
        return
    a, b, fmt = picked
    print("   → «%s / %s» 을 씁니다\n" % (a, b))
    diag["쓰는_날짜칸"] = [a, b, fmt]

    # ── 2. inqryDiv 가 무엇을 가르는가 ────────────────────────────
    print("2) inqryDiv 가 무엇을 가르는지 봅니다")
    divs = {}
    for d in ("1", "2", "3", "4"):
        pr = {"inqryDiv": d, a: bgn.strftime(fmt), b: end.strftime(fmt), "numOfRows": "5"}
        got, err = call(key, pr)
        if got and got["rows"]:
            one = got["rows"][0]
            divs[d] = {"총건수": got["total"],
                       "첫줄_chgDt": one.get("chgDt", ""),
                       "첫줄_cntrctDate": one.get("cntrctDate", "")}
            print("   %s → 총 %s건 · 첫줄 chgDt=«%s»" % (d, got["total"], one.get("chgDt", "")))
        else:
            divs[d] = {"오류": err or "0건"}
            print("   %s → %s" % (d, err or "0건"))
    diag["inqryDiv"] = divs
    print("")

    # ── 3. 실제로 훑어서 세기 ─────────────────────────────────────
    print("3) %s ~ %s 공사계약을 훑습니다" % (bgn, end))
    rows, page = [], 1
    while page <= 20:
        pr = {"inqryDiv": "1", a: bgn.strftime(fmt), b: end.strftime(fmt),
              "numOfRows": "100", "pageNo": str(page)}
        got, err = call(key, pr)
        if err:
            print("   %d쪽에서 멈춤: %s" % (page, err))
            diag["훑기_중단"] = {"쪽": page, "이유": err}
            break
        rows.extend(got["rows"])
        if len(got["rows"]) < 100:
            break
        page += 1
    print("   받은 계약 %d건 (%d쪽)" % (len(rows), page))
    diag["받은건수"] = len(rows)
    if not rows:
        diag["결론"] = "0건"
        save(diag)
        return

    # ── 4. 변경계약을 세고 재기 ──────────────────────────────────
    n_chg_dt = 0        # chgDt 가 채워진 것
    n_amt_diff = 0      # 금차 ≠ 총액
    ups, dnodays = [], []
    uniq = {}
    for r in rows:
        if str(r.get("chgDt") or "").strip():
            n_chg_dt += 1
        tot, tht = num(r.get("totCntrctAmt")), num(r.get("thtmCntrctAmt"))
        if tot > 0 and tht > 0 and abs(tot - tht) > 1:
            n_amt_diff += 1
            ups.append((tot - tht) / tht * 100.0)
        d1, d2 = days_of(r.get("cntrctPrd"))
        if d1 and d2 and d2 > d1:
            dnodays.append(d2 - d1)
        u = str(r.get("untyCntrctNo") or "").strip()
        if u:
            uniq[u] = uniq.get(u, 0) + 1

    def med(xs):
        if not xs:
            return None
        s = sorted(xs)
        return round(s[len(s) // 2], 3)

    many = sum(1 for v in uniq.values() if v > 1)
    diag["세어본것"] = {
        "chgDt 채워진 것": n_chg_dt,
        "금차≠총액": n_amt_diff,
        "증가율%_중앙": med(ups),
        "증가율%_최대": round(max(ups), 2) if ups else None,
        "공기연장일_중앙": med(dnodays),
        "공기연장_건수": len(dnodays),
        "통합계약번호_중복(같은 계약 여러 줄)": many,
        "통합계약번호_가짓수": len(uniq),
    }
    print("   · chgDt 채워진 것       %d건" % n_chg_dt)
    print("   · 금차금액 ≠ 총계약금액  %d건 (증가율 중앙 %s%%)" % (n_amt_diff, med(ups)))
    print("   · 공기가 늘어난 것      %d건 (중앙 %s일)" % (len(dnodays), med(dnodays)))
    print("   · 같은 통합계약번호가 여러 줄  %d건 / %d가지" % (many, len(uniq)))

    # ── 5. 우리 자료와 이어붙일 수 있나 ──────────────────────────
    mine = store_notices()
    if mine:
        have = [r for r in rows if str(r.get("ntceNo") or "").strip()]
        hit = [r for r in have if str(r["ntceNo"]).strip() in mine]
        pct = round(len(hit) / len(have) * 100.0, 1) if have else 0.0
        diag["이어붙이기"] = {"ntceNo 있는 계약": len(have), "우리 자료에 있는 것": len(hit),
                          "비율%": pct, "우리 공고번호 수": len(mine)}
        print("   · 공고번호로 우리 자료와 만나는 것  %d/%d (%s%%)" % (len(hit), len(have), pct))
    else:
        diag["이어붙이기"] = {"오류": "data/store 를 못 읽었습니다"}
        print("   · data/store 를 못 읽어 이어붙이기는 못 쟀습니다")

    diag["예시"] = rows[:3]
    save(diag)


def save(diag):
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    p = os.path.join(OUT, "diag_chgscan.json")
    with io.open(p, "w", encoding="utf-8") as f:
        json.dump(diag, f, ensure_ascii=False, indent=1)
    print("\n결과 → %s" % p)


if __name__ == "__main__":
    main()
