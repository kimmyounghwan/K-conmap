# -*- coding: utf-8 -*-
"""extres.py — 🏗 나라장터 밖 공고의 «개찰 결과» 모으기 → 사정률 · 낙찰하한율 · 1순위 투찰률 (2026-09-30)

소장님: 「나라장터 밖 공고에는 바로 입찰 이런게 왜 없어?」 「한꺼번에 다 할 수 없어?」 → «LH · 국방 같이»
    수자원 · 아파트 · 민간은 공고에 기초금액 · 예정가격이 없어 누가 해도 투찰금액을 셈할 수 없습니다.
    LH · 국방(시설)은 공고에 기초금액이 있고, 개찰 결과 API 가 예정가격까지 줍니다 → 바로투찰과 같은 셈이 됩니다.

■ 무엇을 모으나
    LH   B552555/OpenTenderopenList/getOpenTenderopenList  (개찰일 openDtmStart~End · YYYYMMDD)
         한 줄 = 한 업체. 설계가격 · 예정가격 · 기초금액 · 가격점수제외금액(A값) · 업체별 투찰금액 · 예가대비 투찰률 ·
         상태(낙찰하한율 미만 · 미심사 · 예가초과) → 공고마다 한 줄로 접습니다.
    국방 1690000/BidResultInfoService — 시설 경쟁입찰결과 목록 → 상세(기초예비가격 · 사정률 상하한 · 낙찰하한율) ·
         복수예비가격(고른 것 평균 = 예정가격) · 참가업체(1순위 낙찰률 · 참가 수). 하루 100번 한도 → 회차당 몇 건만.
         ⚠️ 활용신청(2026-09-30 소장님 로그인 뒤)이 승인되기 전에는 «등록 안 된 키» 가 옵니다 — 조용히 넘어갑니다.

■ 셈 (공고 한 줄 · 화면에서 바로투찰과 «같은 함수» smartBid 로)
    사정률 = 예정가격 ÷ 기초금액 × 100   → 기관별 가운데값(p50) · 표준편차(sd)
    낙찰하한율 — LH 는 공고에 안 적혀 있어 개찰에서 거꾸로 봅니다: «낙찰하한율 미만» 이 아닌 가장 낮은 투찰률(llH)과
                 «미만» 가운데 가장 높은 투찰률(llL) 사이에 있습니다. 규모(기초금액)별 가운데값을 씁니다.
                 국방은 상세에 낙찰하한율이 적혀 옵니다.
    ⚠️ 모자라면 셈하지 않습니다 — 화면은 «자료 모으는 중 (N건)» 만 보입니다(CLAUDE.md «없는 숫자를 만들지 않는다»).

■ 어디에 두나   data/store/ext_res.json (공고별 한 줄 · 400일) · ext_res_book.json (받은 날 · 호출 수) — Actions cache
■ ⚠️ import 때 아무것도 읽지 않습니다 · 오류는 «종류 이름» 만(주소에 인증키) — extbids.py 와 같은 규칙.
"""
import os
import re
import statistics
import time
from datetime import datetime, timedelta

import extbids as E

RES_STORE = os.path.join(E.STORE, "ext_res.json")
RES_BOOK = os.path.join(E.STORE, "ext_res_book.json")
RES_BUDGET_S = int(os.environ.get("EXT_RES_BUDGET_S", "90"))
RES_KEEP_DAYS = 400

LH_URL = f"{E.B}/B552555/OpenTenderopenList/getOpenTenderopenList"
LH_BACK = 120            # 이만큼 거슬러 올라가 모읍니다(회차마다 조금씩)
LH_OLD_PER_RUN = 2       # 한 회차에 채우는 옛날 날짜 수
LH_ROWS = 1000
LH_PAGES = 12            # 하루 치 쪽 상한(업체 줄이라 많습니다)
LH_CAP = 400             # 하루 호출 상한

D = f"{E.B}/1690000/BidResultInfoService"
DAPA_LIST = f"{D}/getFcltyCmpetBidResultList"
DAPA_DETAIL = f"{D}/getFcltyCmpetBidResultDetail"
DAPA_BSIC = f"{D}/getFcltyCmpetBidResultBsicList"
DAPA_MNUF = f"{D}/getFcltyCmpetBidResultMnufList"
DAPA_BACK = 120
DAPA_PER_RUN = 4         # 한 회차에 자세히 보는 공고 수(한 건에 3번 · 오퍼레이션마다 하루 100번)
DAPA_DAY = 25            # 하루에 자세히 보는 공고 수 상한 → 오퍼레이션마다 하루 25번 + 목록 하루 한두 번

EDGES = [3e8, 1e9, 5e9, 1e10]    # 규모(기초금액) 칸 — 3억 · 10억 · 50억 · 100억


def 칸(base):
    for i, e in enumerate(EDGES):
        if base < e:
            return i
    return len(EDGES)


def _f(v):
    try:
        return float(str(v).replace(",", "").strip())
    except Exception:
        return None


# ── LH: 업체 줄 → 공고 한 줄 ─────────────────────────────────────
def lh_fold(rows):
    """개찰 줄(업체마다 한 줄)을 공고마다 한 줄로 접습니다."""
    box = {}
    for r in rows:
        no = E._s(r.get("bidNum"), 40)
        if not no:
            continue
        k = f"{no}-{E._s(r.get('bidDegree'), 6) or '0'}"
        b = box.get(k)
        if b is None:
            b = box[k] = {"no": no, "d": E.ymdhm(r.get("openDtm"))[:10], "nm": E._s(r.get("bidnmKor"), 40),
                          "kind": E._s(r.get("cstrtnJobGbNm"), 10),
                          "base": E._won(r.get("fdmtlAmt")), "exp": E._won(r.get("expectPrc")),
                          "des": E._won(r.get("designPrc")), "A": E._won(r.get("prcscoreExclusAmt")),
                          "np": 0, "_ok": [], "_under": []}
        b["np"] += 1
        rate = _f(r.get("invtgtRate"))
        st = E._s(r.get("vndrSccfBidStatusNm"), 30)
        if not rate or rate <= 0:
            continue
        if "미만" in st:
            b["_under"].append(rate)
        elif "초과" in st:
            continue
        else:
            b["_ok"].append((rate, E._won(r.get("decTndrAmt"))))
    out = {}
    for k, b in box.items():
        ok, under = b.pop("_ok"), b.pop("_under")
        if ok:
            r1 = min(ok)
            b["r1"], b["a1"], b["llH"] = round(r1[0], 4), r1[1], round(r1[0], 4)
        if under:
            b["llL"] = round(max(under), 4)
        if b["base"] > 0 and b["exp"] > 0:
            b["sj"] = round(b["exp"] / b["base"] * 100, 4)
        out[k] = {kk: v for kk, v in b.items() if v not in ("", None, 0) or kk in ("np",)}
    return out


def _day_list(now, book, back, per_run):
    """오늘 · 어제는 늘 · 그보다 옛날은 아직 안 받은 날부터 per_run 개"""
    done = set(book.get("days") or [])
    days = [now.strftime("%Y%m%d"), (now - timedelta(days=1)).strftime("%Y%m%d")]
    old = [(now - timedelta(days=i)).strftime("%Y%m%d") for i in range(2, back + 1)]
    days += [d for d in old if d not in done][:per_run]
    return days


def fetch(key, now=None, no_net=False, diag=None, get=None):
    now = now or datetime.now(E.KST)
    store = E._load(RES_STORE, {})
    book = E._load(RES_BOOK, {})
    today = now.strftime("%Y-%m-%d")
    dg = {}
    if no_net or not key:
        if diag is not None:
            diag["_extres"] = {"건너뜀": "바깥을 부르지 않는 회차" if no_net else "인증키 없음"}
        return {}
    if get is None:
        import requests
        try:
            import urllib3
            urllib3.disable_warnings()
        except Exception:
            pass

        def get(url, params, timeout):
            q = dict(params)
            q["serviceKey"] = key
            r = requests.get(url, params=q, timeout=timeout, verify=False, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code != 200:
                raise E._Http(r.status_code, E._scrub(E._s(E.decode(r.content), 160)))
            return E.decode(r.content)
    t0 = time.time()
    got = {}

    def 부름(bk, url, params, rec):
        if bk.get("day") != today:
            bk.update(day=today, calls=0, quota=False)
        if bk.get("quota") or time.time() - t0 > RES_BUDGET_S:
            return None, {"code": "skip"}
        bk["calls"] = int(bk.get("calls") or 0) + 1
        rec["calls"] = rec.get("calls", 0) + 1
        try:
            text = get(url, params, E.EXT_TIMEOUT_S)
        except E._Http as e:
            return None, {"http": e.status, "body": e.body}
        except Exception as e:
            return None, {"net": E._why(e)}
        rows, tot, err = E.parse(text)
        if err and err.get("quota"):
            bk["quota"] = True
        return (rows, tot), err

    # ── LH ──
    bk = book.setdefault("lhr", {})
    rec = dg.setdefault("lhr", {})
    box = store.setdefault("lhr", {})
    n0 = len(box)
    for day in _day_list(now, bk, LH_BACK, LH_OLD_PER_RUN):
        rows_all, ok_day = [], True
        for page in range(1, LH_PAGES + 1):
            if int(bk.get("calls") or 0) >= LH_CAP:
                ok_day = False
                rec["cut"] = "하루 상한"
                break
            res, err = 부름(bk, LH_URL, {"pageNo": str(page), "numOfRows": str(LH_ROWS),
                                         "openDtmStart": day, "openDtmEnd": day}, rec)
            if err:
                ok_day = False
                if err.get("code") != "skip":
                    rec["err"] = err
                break
            rows, tot = res
            if rows and "fields" not in rec:
                rec["fields"] = sorted(rows[0].keys())[:60]
                rec["sample"] = {k: E._s(v, 30) for k, v in list(rows[0].items())[:40]
                                 if k not in ("taxregno", "tndrVndrNm")}   # 업체 이름 · 번호는 진단에 안 남김
            rows_all += rows
            # ⚠️ 한 쪽 줄 수를 포털이 줄여 줄 수도 있어 «받은 줄 수 · 전체 건수» 로 끝을 봅니다
            if not rows or (tot and len(rows_all) >= tot) or (not tot and len(rows) < LH_ROWS):
                break
        else:
            ok_day = False                                  # 쪽 상한에 걸림 — 그날은 다음에 다시
        if rec.get("err") and not rows_all:
            break
        for k, v in lh_fold(rows_all).items():
            box[k] = v
        if ok_day and day < (now - timedelta(days=1)).strftime("%Y%m%d"):
            bk["days"] = sorted(set(bk.get("days") or []) | {day})[-LH_BACK - 10:]
    got["lhr"] = len(box) - n0

    # ── 국방(시설) ──
    bk = book.setdefault("dapar", {})
    rec = dg.setdefault("dapar", {})
    box = store.setdefault("dapar", {})
    n0 = len(box)
    lst = []
    if bk.get("list_at") != today:                          # 목록은 하루 한 번(오퍼레이션마다 하루 100번 한도)
        d0 = (now - timedelta(days=DAPA_BACK if not box else 10)).strftime("%Y%m%d")
        for page in range(1, 4):
            res, err = 부름(bk, DAPA_LIST, {"pageNo": str(page), "numOfRows": "100",
                                            "opengDateBegin": d0, "opengDateEnd": now.strftime("%Y%m%d")}, rec)
            if err:
                if err.get("code") != "skip":
                    rec["err"] = err
                break
            rows, tot = res
            if rows and "fields" not in rec:
                rec["fields"] = sorted(rows[0].keys())[:40]
                rec["sample"] = {k: E._s(v, 30) for k, v in list(rows[0].items())[:30]}
            lst += rows
            if len(rows) < 100 or (tot and page * 100 >= tot):
                break
        pend = []
        for r in lst:
            k = f"{E._s(r.get('orntCode'), 10)}:{E._s(r.get('cntrwkNo'), 30)}:{E._s(r.get('pblancOdr'), 4)}"
            if k in box or "유찰" in str(r.get("bidResult") or ""):
                continue
            pend.append({"k": k, "no": E._s(r.get("pblancNo"), 30), "odr": E._s(r.get("pblancOdr"), 4),
                         "cw": E._s(r.get("cntrwkNo"), 30), "oc": E._s(r.get("orntCode"), 10),
                         # 개찰일자 — 상세는 목록이 준 모양 그대로(odr) · 예비가격 · 참가업체는 숫자 8자리(od)
                         "odr_": E._s(r.get("opengDate") or r.get("opengDt"), 20),
                         "od": re.sub(r"\D", "", str(r.get("opengDate") or r.get("opengDt") or ""))[:8],
                         "nm": E._s(r.get("cntrwkNm"), 40)})
        if lst or not rec.get("err"):
            bk["pending"] = pend[:200]
            bk["list_at"] = today
        bk["dday"], bk["dn"] = today, 0
    done = 0
    for p in list(bk.get("pending") or []):
        if bk.get("dday") != today:
            bk["dday"], bk["dn"] = today, 0
        if done >= DAPA_PER_RUN or int(bk.get("dn") or 0) >= DAPA_DAY:
            break
        bk["dn"] = int(bk.get("dn") or 0) + 1
        base_p = {"cntrwkNo": p["cw"], "orntCode": p["oc"]}
        res, err = 부름(bk, DAPA_DETAIL, dict(base_p, pageNo="1", numOfRows="10", opengDate=p.get("odr_") or p["od"],
                                            pblancNo=p["no"], pblancOdr=p["odr"]), rec)
        if err:
            if err.get("code") != "skip":
                rec["err"] = err
            break
        det = (res[0] or [{}])[0]
        res2, err2 = 부름(bk, DAPA_BSIC, dict(base_p, pageNo="1", numOfRows="30", ntatPlanDate=p["od"]), rec)
        pr = [(_f(x.get("planPrce")) or 0) for x in ((res2 or ([], 0))[0] or [])
              if str(x.get("choiYsno") or "").upper() in ("Y", "1", "예")]
        res3, err3 = 부름(bk, DAPA_MNUF, dict(base_p, pageNo="1", numOfRows="300", ntatPlanDate=p["od"]), rec)
        mn = (res3 or ([], 0))[0] or []
        r1 = [x for x in mn if str(x.get("bidnRank") or "").strip() == "1"]
        base = E._won(det.get("bsisPreparPc"))
        exp = round(sum(pr) / len(pr)) if pr else 0
        v = {"no": p["no"], "d": E.ymdhm(p["od"])[:10], "nm": p["nm"] or E._s(det.get("cntrwkNm"), 40), "kind": "공사",
             "base": base, "exp": exp, "ll": _f(det.get("scsbidLwltRt")),
             "lo": _f(det.get("asessRtLwlt")), "hi": _f(det.get("asessRtUplmt")), "np": len(mn)}
        if base > 0 and exp > 0:
            v["sj"] = round(exp / base * 100, 4)
        if r1:
            v["r1"], v["a1"] = _f(r1[0].get("bidnRate")), E._won(r1[0].get("tbidAmnt"))
        box[p["k"]] = {kk: vv for kk, vv in v.items() if vv not in ("", None, 0) or kk == "np"}
        bk["pending"] = [x for x in bk["pending"] if x["k"] != p["k"]]
        done += 1
    got["dapar"] = len(box) - n0

    # 오래된 것 지우기
    cut = (now - timedelta(days=RES_KEEP_DAYS)).strftime("%Y-%m-%d")
    for src in ("lhr", "dapar"):
        b = store.get(src) or {}
        for k in [k for k, v in b.items() if (v.get("d") or "9") < cut]:
            b.pop(k, None)
    E._save(RES_STORE, store)
    E._save(RES_BOOK, book)
    for s in ("lhr", "dapar"):
        dg.setdefault(s, {})["n"] = len(store.get(s) or {})
    if diag is not None:
        diag["_extres"] = dg
    return got


# ── 셈에 쓸 값 (publish 가 list.json 의 «st» 로 내보냄) ───────────────
def stats(store=None):
    store = store if store is not None else E._load(RES_STORE, {})
    out = {}
    for src, key in (("lh", "lhr"), ("dapa", "dapar")):
        xs = [v for v in (store.get(key) or {}).values() if "공사" in (v.get("kind") or "공사")]
        sj = [v["sj"] for v in xs if 95 <= (v.get("sj") or 0) <= 105]
        s = {"n": len(sj), "edges": EDGES}
        if len(sj) >= 5:
            s["p50"] = round(statistics.median(sj), 3)
            s["sd"] = round(statistics.pstdev(sj), 3)
        # 낙찰하한율 — 규모 칸마다 가운데값
        ll = {}
        for v in xs:
            if not (v.get("base") or 0) > 0:
                continue
            if src == "lh":
                h, lo = v.get("llH"), v.get("llL")
                if not h or (lo and h - lo > 0.3):          # 위 · 아래가 벌어져 있으면 하한을 모름
                    continue
                val = h if not lo else (h + lo) / 2
            else:
                val = v.get("ll")
            if val and 70 < val < 100:
                ll.setdefault(칸(v["base"]), []).append(val)
        s["ll"] = {str(b): [round(statistics.median(a), 3), len(a)] for b, a in ll.items() if len(a) >= 3}
        np_ = [v["np"] for v in xs if v.get("np")]
        if np_:
            s["np"] = int(statistics.median(np_))
        out[src] = s
    return out
