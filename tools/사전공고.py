# -*- coding: utf-8 -*-
"""
📣 사전공고 수집 — 발주계획 · 사전규격 (공사) — 2026-10-05
   소장님: 「1부터 3까지 같이」 중 ③ — «수집 쪽을 따로 만들어 자동 실행으로 확인한 뒤 화면을 붙이는 쪽»

  ■ 무엇을 받나 (공공데이터포털 · 조달청 · 둘 다 자동승인 · 개발계정 하루 1,000번)
      · 조달청_나라장터 사전규격정보서비스 (data.go.kr 15129437)
          HrcspSsstndrdInfoService/getPublicPrcureThngInfoCnstwk  — 사전규격 «공사» 목록 (등록일시로 조회)
      · 조달청_나라장터 발주계획현황서비스 (data.go.kr 15129462)
          OrderPlanSttusService/getOrderPlanSttusListCnstwk        — 발주계획 «공사» (등록일시로 조회)
      입찰공고가 뜨기 «전» 의 소식입니다 — 어느 기관이 어떤 공사를 언제쯤 낼지.
  ■ 이번 판은 «받아서 쌓기 + 무엇이 오는지 확인» 까지입니다. 화면은 항목 이름을 실제 응답으로 확인한 뒤 붙입니다.
      data/pre/사전규격.json · data/pre/발주계획.json  ({at, from, n, fields, ok, r: {열쇠: 항목 원본}})
      data/pre/진단.json  — 어느 주소 · 어느 조건이 됐는지, 항목 이름, 하루별 건수
  ■ 열쇠(G2B_API_KEY) 는 환경 변수로만 받고, 화면 · 로그 · 파일 어디에도 찍지 않습니다.
      ⚠️ requests 의 오류 글에는 «열쇠가 든 주소» 가 그대로 들어 있습니다 — 오류는 «종류 이름» 만 찍습니다.
  ■ 빠른 수집(fast.py) · 본 수집(collect.py) 과 따로 돕니다. 그쪽 파일을 읽지도 고치지도 않습니다.
  ■ 활용신청이 안 된 열쇠면 포털이 «등록되지 않은 서비스키» 로 답합니다 → 진단에 «활용신청 필요» 로 적고 끝냅니다.

  python tools/사전공고.py --days 7            (지난 7일 등록분)
  python tools/사전공고.py --days 2 --dry      (받기만 · 파일 안 씀)
"""
import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

KST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "pre")
BASE = "http://apis.data.go.kr/1230000"
KEEP_DAYS = 45          # 쌓아 두는 기간(등록일 기준)
ROWS = 999
TIMEOUT = 40

# 주소 후보 — 새 나라장터(2025) 는 /ao/ 아래로 옮겼습니다. 혹시 몰라 옛 주소도 한 번 봅니다(된 것을 진단에 적음).
SVC = {
    "사전규격": {
        "op": "getPublicPrcureThngInfoCnstwk",
        "paths": ["ao/HrcspSsstndrdInfoService", "HrcspSsstndrdInfoService"],
        "keys": ["bfSpecRgstNo", "bfspecrgstno"],
    },
    "발주계획": {
        "op": "getOrderPlanSttusListCnstwk",
        "paths": ["ao/OrderPlanSttusService", "OrderPlanSttusService"],
        "keys": ["orderPlanUntyNo", "orderplanuntyno", "bsnsDivNm"],
    },
}

CALLS = 0
CALL_CAP = 200          # 한 회차 최대 호출 (하루 1,000 중 · 하루 두 회차) — 넉넉히 남깁니다
SWEEP_MONTHS = 6        # 📋 발주계획 «달 훑기» — 지난 6달 동안 등록된 계획 중 앞으로 발주될 것 (하루 한 번)
AHEAD_MONTHS = 6        #    앞으로 몇 달 치 발주를 볼지


def log(*a):
    print(*a, flush=True)


def key_or_exit():
    k = os.environ.get("G2B_API_KEY", "").strip()
    if not k:
        log("❌ G2B_API_KEY 가 없습니다 (저장소 Secrets).")
        sys.exit(2)
    return k


def _not_registered(text):
    t = str(text or "").upper()
    return ("SERVICE_KEY_IS_NOT_REGISTERED" in t or "SERVICE KEY IS NOT REGISTERED" in t
            or "등록되지 않은 서비스" in str(text or "") or "UNREGISTERED" in t)


def _quota(text):
    t = str(text or "").upper()
    return "LIMITED_NUMBER_OF_SERVICE_REQUESTS" in t or "EXCEEDS" in t or "트래픽" in str(text or "")


def call(url, key, params):
    """→ (상태, items, total, 말)
       상태: ok · empty · noreg(활용신청 필요) · quota · http · code · json · net · cap"""
    global CALLS
    if CALLS >= CALL_CAP:
        return "cap", [], 0, f"한 회차 상한 {CALL_CAP}번"
    CALLS += 1
    p = {"serviceKey": key, "numOfRows": str(ROWS), "pageNo": "1", "type": "json"}
    p.update(params)
    try:
        r = requests.get(url, params=p, timeout=TIMEOUT, verify=False, headers={"User-Agent": "Mozilla/5.0"})
    except Exception as e:                       # ⚠️ str(e) 에 열쇠가 든 주소가 있습니다 — 종류만
        return "net", [], 0, type(e).__name__
    body = r.text or ""
    head = " ".join(body.split())[:200]
    if _not_registered(body):
        return "noreg", [], 0, "등록되지 않은 서비스키(활용신청 필요)"
    if _quota(body):
        return "quota", [], 0, "일일 트래픽 초과"
    if r.status_code != 200:
        return "http", [], 0, f"HTTP {r.status_code} · {head[:120]}"
    try:
        j = r.json()
    except Exception:
        return "json", [], 0, "JSON 아님 · " + head[:120]
    # ⚠️ 2026-10-05 — 새 나라장터는 필수값이 빠지면 HTTP 200 에 {"nkoneps.com.response.ResponseError": {"header": {"resultCode": "08"}}}
    #    로 답합니다. «response» 가 없다고 «빈 응답» 으로 보면 «정상 0건» 이 됩니다(발주계획 첫 회차가 그랬음).
    if isinstance(j, dict) and "response" not in j:
        for k, v in j.items():
            if "error" in str(k).lower() and isinstance(v, dict):
                eh = v.get("header", {}) or {}
                return "code", [], 0, f"오류 응답 {eh.get('resultCode', '')} · {str(eh.get('resultMsg', ''))[:100]}"
        return "json", [], 0, "모르는 모양 · " + head[:120]
    resp = j.get("response", {}) if isinstance(j, dict) else {}
    h = resp.get("header", {}) or {}
    code = str(h.get("resultCode", "")).strip()
    if code and code not in ("00", "0"):
        msg = str(h.get("resultMsg", ""))
        if _not_registered(msg):
            return "noreg", [], 0, msg[:120]
        return "code", [], 0, f"응답코드 {code} · {msg[:120]}"
    b = resp.get("body", {}) or {}
    items = b.get("items", [])
    if isinstance(items, dict):
        items = items.get("item", [items])
    if not isinstance(items, list):
        items = []
    try:
        total = int(b.get("totalCount") or 0)
    except Exception:
        total = len(items)
    return ("ok" if items else "empty"), [x for x in items if isinstance(x, dict)], total, ""


# 조회 조건 후보 — 문서상 «inqryDiv=1(등록일시) + inqryBgnDt/inqryEndDt(YYYYMMDDHHMM)».
#   ⚠️ 발주계획은 «발주년월(orderBgnYm · orderEndYm)» 이 필수입니다 — 빠지면 오류 응답(08).
#      등록일로 하루씩 받되 발주년월은 앞뒤 1년 남짓을 넉넉히 둡니다(그 사이 발주 예정인 것 전부).
def _ym(day, dd):
    return (day + timedelta(days=dd)).strftime("%Y%m")


VARIANTS_BY = {
    "사전규격": [
        lambda d, day: {"inqryDiv": "1", "inqryBgnDt": d + "0000", "inqryEndDt": d + "2359"},
        lambda d, day: {"inqryBgnDt": d + "0000", "inqryEndDt": d + "2359"},
    ],
    "발주계획": [
        lambda d, day: {"inqryDiv": "1", "inqryBgnDt": d + "0000", "inqryEndDt": d + "2359",
                        "orderBgnYm": _ym(day, -400), "orderEndYm": _ym(day, 400)},
        lambda d, day: {"inqryBgnDt": d + "0000", "inqryEndDt": d + "2359",
                        "orderBgnYm": _ym(day, -400), "orderEndYm": _ym(day, 400)},
        lambda d, day: {"orderBgnYm": _ym(day, -31), "orderEndYm": _ym(day, 95)},
    ],
}
VARIANTS = VARIANTS_BY["사전규격"]      # (옛 이름 — 시험이 씀)


def fetch_day(name, key, day, base_path, diag, vi=0):
    """하루치(등록일시 00:00~23:59) — 999건 넘으면 쪽을 넘깁니다"""
    s = SVC[name]
    url = f"{BASE}/{base_path}/{s['op']}"
    d = day.strftime("%Y%m%d")
    params = VARIANTS_BY[name][vi](d, day)
    out, page = [], 1
    while True:
        params["pageNo"] = str(page)
        st, items, total, msg = call(url, key, params)
        diag["호출"].append({"날": d, "쪽": page, "상태": st, "수": len(items), "전체": total, "말": msg})
        if st not in ("ok", "empty"):
            return st, out, msg
        out += items
        if len(out) >= total or not items or page >= 10:
            return "ok", out, ""
        page += 1
        time.sleep(0.3)


def pick_path(name, key, day, diag):
    """주소 후보 × 조건 후보 중 «정상 응답» 이 오는 첫 짝 → (주소, 조건 번호, 항목, 실패 이유)
       ⚠️ 없는 주소에도 포털이 «등록되지 않은 서비스키» 로 답할 수 있어, 그 말 하나로 멈추지 않고 다 대 봅니다.
          트래픽 초과 · 상한이면 바로 멈춥니다."""
    seen = []
    for bp in SVC[name]["paths"]:
        for vi in range(len(VARIANTS_BY[name])):
            st, items, msg = fetch_day(name, key, day, bp, diag, vi)
            diag["주소시험"].append({"주소": bp + "/" + SVC[name]["op"], "조건": vi + 1, "상태": st, "수": len(items), "말": msg})
            if st == "ok":
                return bp, vi, items, ""
            if st in ("quota", "cap"):
                return None, 0, [], st
            seen.append(st)
            if st in ("noreg", "http", "net"):
                break                      # 주소 자체가 안 됨 — 조건을 바꿔 봐야 같습니다
    return None, 0, [], ("noreg" if seen and all(x == "noreg" for x in seen) else "fail")


def 발주월(it):
    """발주계획 한 줄 → 'YYYYMM' (발주년도 orderYear + 발주월 orderMnth · 모양이 여럿이라 너그럽게) · 모르면 ''"""
    low = {str(k).lower(): v for k, v in it.items()}
    y = str(low.get("orderyear") or low.get("orderyr") or "").strip()
    m = str(low.get("ordermnth") or low.get("ordermonth") or "").strip()
    d = "".join(ch for ch in m if ch.isdigit())
    if len(d) >= 6:
        return d[:6]
    yd = "".join(ch for ch in y if ch.isdigit())
    if len(yd) == 4 and d:
        return yd + d[-2:].zfill(2)
    return ""


def _ym_add(ym, n):
    y, m = int(ym[:4]), int(ym[4:6]) + n
    while m > 12:
        y, m = y + 1, m - 12
    while m < 1:
        y, m = y - 1, m + 12
    return f"{y:04d}{m:02d}"


def item_key(name, it):
    low = {str(k).lower(): v for k, v in it.items()}
    if name == "발주계획":
        for k in ("orderplanuntyno", "orderplanno", "orderplansno", "planno", "bsnsno"):
            if low.get(k) not in (None, ""):
                return str(low[k])
        # 번호 칸을 모르면 «기관 · 사업명 · 발주월» 로 — 금액 · 바뀐 날이 달라져도 같은 계획은 한 줄로
        org = low.get("orderinsttnm") or low.get("dminsttnm") or low.get("totlmnginsttnm") or ""
        nm = low.get("biznm") or low.get("cnstwknm") or low.get("prdctclsfcnonm") or ""
        if org or nm:
            return "c:" + hashlib.md5(f"{org}|{nm}|{발주월(it)}".encode("utf-8")).hexdigest()[:16]
    for k in SVC[name]["keys"]:
        v = low.get(k.lower())
        if v not in (None, ""):
            if name == "발주계획" and k == "bsnsDivNm":
                break
            return str(v)
    # 열쇠 항목을 모르면 내용으로 — 같은 줄이 두 번 쌓이지 않게
    return "h:" + hashlib.md5(json.dumps(it, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:16]


def load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f) or {}
    except Exception:
        return {}


def run(days, dry=False):
    key = key_or_exit()
    now = datetime.now(KST)
    today = now.date()
    diag_all = {"at": now.strftime("%Y-%m-%d %H:%M"), "days": days}
    os.makedirs(OUT, exist_ok=True)
    for name in SVC:
        diag = {"주소시험": [], "호출": []}
        t0 = time.time()
        # 첫날(오늘)로 주소를 고르고, 나머지 날은 그 주소로
        bp, vi, items0, why = pick_path(name, key, datetime.combine(today, datetime.min.time()), diag)
        got = list(items0)
        state = "ok"
        if bp is None:
            state = why
        else:
            for i in range(1, days):
                d = today - timedelta(days=i)
                st, items, msg = fetch_day(name, key, datetime.combine(d, datetime.min.time()), bp, diag, vi)
                if st not in ("ok", "empty"):
                    state = st
                    if st in ("noreg", "quota", "cap"):
                        break
                got += items
                time.sleep(0.3)
        # 📋 발주계획 «달 훑기» — 하루씩 받는 것은 «최근 등록» 뿐이라, 몇 달 전에 올라온 계획(예: 연초 계획의 11월 발주)이 빠집니다.
        #    하루 한 번(아침 회차 · 또는 오늘 아직 안 했으면) 지난 SWEEP_MONTHS 달의 등록분을 달 단위로 받되,
        #    발주년월은 이번 달 ~ AHEAD_MONTHS 달 뒤만 묻습니다(앞으로 나올 것만). 달 단위 조회가 거절되면 그만두고 진단에 적습니다.
        sweep = {"했나": False}
        prev = load(os.path.join(OUT, f"{name}.json"))
        if name == "발주계획" and bp and state == "ok" and (prev.get("sweep") != today.isoformat()):
            this_ym = today.strftime("%Y%m")
            n_sw, why_sw = 0, ""
            for mb in range(SWEEP_MONTHS):
                first = (today.replace(day=1) - timedelta(days=1)).replace(day=1) if mb else today.replace(day=1)
                for _ in range(mb - 1):
                    first = (first - timedelta(days=1)).replace(day=1)
                last = (first.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
                if last > today:
                    last = today
                p = {"inqryDiv": "1", "inqryBgnDt": first.strftime("%Y%m%d") + "0000", "inqryEndDt": last.strftime("%Y%m%d") + "2359",
                     "orderBgnYm": this_ym, "orderEndYm": _ym_add(this_ym, AHEAD_MONTHS)}
                url = f"{BASE}/{bp}/{SVC[name]['op']}"
                pg = 1
                while True:
                    p["pageNo"] = str(pg)
                    st, items, total, msg = call(url, key, dict(p))
                    diag["호출"].append({"날": first.strftime("%Y%m") + "(달)", "쪽": pg, "상태": st, "수": len(items), "전체": total, "말": msg})
                    if st not in ("ok", "empty"):
                        why_sw = f"{first.strftime('%Y%m')} {st} {msg}"[:120]
                        break
                    got += items
                    n_sw += len(items)
                    if not items or pg * ROWS >= total or pg >= 10:
                        break
                    pg += 1
                    time.sleep(0.3)
                if why_sw:
                    break
                time.sleep(0.3)
            sweep = {"했나": not why_sw, "건": n_sw, "말": why_sw}
            diag["주소시험"].append({"주소": bp + "/" + SVC[name]["op"], "조건": "달훑기", "상태": "ok" if not why_sw else "멈춤",
                                 "수": n_sw, "말": why_sw or f"지난 {SWEEP_MONTHS}달 등록 · 발주 {this_ym}~{_ym_add(this_ym, AHEAD_MONTHS)}"})
        # 등록일로 7일을 다 봐도 0건이면 «발주년월만» 조건으로 한 번 더(조건 뜻이 문서와 다를 때 대비)
        if bp and not got and len(VARIANTS_BY[name]) > 1 and state == "ok":
            lv = len(VARIANTS_BY[name]) - 1
            if lv != vi:
                st2, items2, msg2 = fetch_day(name, key, datetime.combine(today, datetime.min.time()), bp, diag, lv)
                diag["주소시험"].append({"주소": bp + "/" + SVC[name]["op"], "조건": lv + 1, "상태": st2, "수": len(items2), "말": msg2 or "등록일 7일 0건이라 발주년월만으로"})
                if st2 == "ok" and items2:
                    got, vi = items2, lv
        fields = sorted({k for it in got for k in it.keys()})
        path = os.path.join(OUT, f"{name}.json")
        old = load(path)
        r = dict(old.get("r") or {})
        for it in got:
            r[item_key(name, it)] = it
        # 오래된 것 버리기 — 등록일시 항목(rgstDt · rcptDt …)이 있으면 그것으로
        cut = (today - timedelta(days=KEEP_DAYS)).strftime("%Y-%m-%d")

        def 날(it):
            for k in ("rgstDt", "rcptDt", "chgDt", "nticeDt", "rgstDate"):
                v = it.get(k)
                if v:
                    return str(v)[:10]
            return ""
        if name == "발주계획":
            # 계획은 «언제 발주하나» 로 남깁니다 — 지난달보다 앞선 발주월은 버리고, 발주월을 모르는 줄만 등록일로
            ym_cut = _ym_add(today.strftime("%Y%m"), -1)
            r = {k: v for k, v in r.items() if ((발주월(v) >= ym_cut) if 발주월(v) else (not 날(v) or 날(v) >= cut))}
        else:
            r = {k: v for k, v in r.items() if not 날(v) or 날(v) >= cut}
        res = {"at": now.strftime("%Y-%m-%d %H:%M"), "path": bp, "cond": (vi + 1) if bp else None, "state": state,
               "n": len(r), "new": len(got), "fields": fields, "r": r,
               "sweep": today.isoformat() if sweep.get("했나") else prev.get("sweep")}
        per_day = {}
        for c in diag["호출"]:
            if c["상태"] in ("ok", "empty"):
                per_day[c["날"]] = per_day.get(c["날"], 0) + c["수"]
        월분포 = {}
        for v in r.values():
            ym = 발주월(v) if name == "발주계획" else str(v.get("rgstDt") or v.get("rcptDt") or "")[:7].replace("-", "")
            월분포[ym or "?"] = 월분포.get(ym or "?", 0) + 1
        견본 = {}
        if got:
            one = got[0]
            for k in sorted(one.keys()):
                if k.lower() in ("ofclnm",):          # 담당자 이름은 찍지 않음
                    continue
                v = str(one.get(k) or "")
                if v:
                    견본[k] = v[:40]
        diag_all[name] = {"주소": bp, "조건": (vi + 1) if bp else None, "상태": state, "받은": len(got), "쌓인": len(r),
                          "월분포": dict(sorted(월분포.items())[-14:]), "견본": 견본, "달훑기": sweep,
                          "하루별": dict(sorted(per_day.items())), "항목": fields,
                          "주소시험": diag["주소시험"], "호출수": len(diag["호출"]),
                          "초": round(time.time() - t0, 1)}
        # 로그 — 항목 이름과 건수(내용 전체는 찍지 않음)
        log(f"\n■ {name} — 주소 {bp or '(안 됨)'} · 상태 {state} · 이번에 {len(got):,}건 · 쌓인 {len(r):,}건")
        for t in diag["주소시험"]:
            log(f"   주소 시험 {t['주소']} · 조건 {t['조건']}: {t['상태']} {t['수']}건 {t['말']}")
        if per_day:
            log("   하루별: " + " · ".join(f"{k[4:6]}.{k[6:]} {v}" for k, v in sorted(per_day.items())))
        if fields:
            log(f"   항목 {len(fields)}개: " + ", ".join(fields))
        if state == "noreg":
            log("   ⚠️ 이 열쇠로 이 서비스를 쓸 수 없습니다 — 공공데이터포털에서 «활용신청» 을 해야 합니다(자동승인).")
        if not dry:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(res, f, ensure_ascii=False, separators=(",", ":"))
    diag_all["호출"] = CALLS
    if not dry:
        with open(os.path.join(OUT, "진단.json"), "w", encoding="utf-8") as f:
            json.dump(diag_all, f, ensure_ascii=False, indent=1)
    # 깃허브 요약(있으면) — 사람이 Actions 화면에서 바로 보게
    sm = os.environ.get("GITHUB_STEP_SUMMARY")
    if sm:
        try:
            with open(sm, "a", encoding="utf-8") as f:
                f.write(f"### 📣 사전공고 수집 {diag_all['at']} (지난 {days}일 · 호출 {CALLS}번)\n\n")
                f.write("| 서비스 | 주소 | 상태 | 이번에 | 쌓인 |\n|---|---|---|---:|---:|\n")
                for name in SVC:
                    x = diag_all[name]
                    f.write(f"| {name} | {x['주소'] or '—'} | {x['상태']} | {x['받은']:,} | {x['쌓인']:,} |\n")
                for name in SVC:
                    x = diag_all[name]
                    if x["항목"]:
                        f.write(f"\n**{name} 항목**: {', '.join(x['항목'])}\n")
        except Exception:
            pass
    # 📌 깃허브 «주석(annotation)» 으로도 한 줄씩 — 로그는 로그인해야 보이지만 주석은 누구나 API 로 읽습니다
    #    (클라우드에서 회차 결과를 확인하려고 · 2026-10-05). 열쇠는 들어가지 않습니다.
    if os.environ.get("GITHUB_ACTIONS"):
        for name in SVC:
            x = diag_all[name]
            시험 = " / ".join(f"{t['주소'].split('/')[0]}·조건{t['조건']}={t['상태']}{(':' + t['말'][:60]) if t['말'] else ''}"
                            for t in x["주소시험"])[:600]
            lv = "notice" if x["상태"] == "ok" else "warning"
            log(f"::{lv} title=사전공고 {name}::상태 {x['상태']} · 주소 {x['주소'] or '없음'} · 조건 {x['조건'] or '-'} · "
                f"이번 {x['받은']}건 · 쌓인 {x['쌓인']}건 · 달훑기 {x.get('달훑기')} · 시험 {시험}")
            if x["항목"]:
                log(f"::notice title=사전공고 {name} 항목 {len(x['항목'])}개::{', '.join(x['항목'])}")
            if x.get("월분포"):
                log(f"::notice title=사전공고 {name} 월별::" + " · ".join(f"{k} {v}" for k, v in x["월분포"].items()))
            if x.get("견본"):
                log(f"::notice title=사전공고 {name} 견본 한 줄::" + json.dumps(x["견본"], ensure_ascii=False)[:3000])
    bad = [n for n in SVC if diag_all[n]["상태"] not in ("ok",)]
    return 0 if len(bad) < len(SVC) else 1


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=7)
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args()
    try:
        rc = run(max(1, min(a.days, 31)), a.dry)
    except SystemExit:
        raise
    except Exception as e:                       # 뜻밖의 오류도 주석으로 — 열쇠는 지워서
        k = os.environ.get("G2B_API_KEY", "")
        m = f"{type(e).__name__}: {e}"
        if k:
            m = m.replace(k, "***")
        import traceback
        tb = traceback.format_exc().replace(k, "***") if k else traceback.format_exc()
        log(tb)
        if os.environ.get("GITHUB_ACTIONS"):
            last = [ln.strip() for ln in tb.strip().splitlines() if ln.strip().startswith("File ")][-1:]
            log(f"::error title=사전공고 오류::{m[:300]} · {(last[0] if last else '')[:200]}")
        rc = 3
    sys.exit(rc)
