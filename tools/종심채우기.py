# -*- coding: utf-8 -*-
"""🏛 G806 (2026-11-20) 종심제 · 종합평가 «지난 1년» 균형가격 채우기 — 바로투찰 종심제 기획 ③

소장님 11-20 「보내고, 바로투질 작업해줘」(기획 «다섯가지 다 하자» — ③ 지난 개찰로 맞춰 보기 재료)

■ 왜
  G804 는 «이제 받는 개찰» 과 저장소(70일) 안 개찰만 균형가격을 셉니다. 맞춰 보기(④ · 성적 «80% 범위 적중 75% 이상»)를 하려면
  지난 1년치 종심 개찰이 더 있어야 합니다.

■ 어떻게(조달청을 부르는 수 — 한 공고에 1 ~ 3번)
  ① 누적 CSV(data/extra_*.csv · data/bid_data_3years.zip)에서 지난 1년 «큰 개찰»(기초금액 또는 1순위 금액 ÷ 투찰률 = 예정가격 95억 이상) 공고번호를 새것부터
     (추정가격 100억 + 부가세 ≈ 110억 — 국가 종심(간이형 100억부터) · 지방 종합평가(300억부터) 아래는 종심이 아님)
  ② 낙찰방법을 모르면 공고번호로 공고를 물음(입찰공고 목록 · inqryDiv 2 — 저장소 공고에 있으면 안 물음) → 종심 · 종합평가가 아니면 «아님» 표시(다시 안 물음)
  ③ 기초금액을 모르면 공고번호로 물음(bsis_one)
  ④ 개찰 순위(업체 «모두» 의 금액)를 받아 collect.종심넣기 → data/seed/jongsim.json (워크플로 다음 단계 «누적 자료 저장소에 반영» 이 커밋)
  · 받지 못한 것(공고 · 순위 없음)은 3일 뒤 다시 · 세 번이면 그만 — jongsim.json 의 "x" 칸(공고번호 → [까닭, 횟수, 날])
  · 통신 · 하루 몫 · 시간 예산에 걸리면 표시하지 않고 멈춤(다음 회차가 이어받음)
  ⚠️ 업체 이름 · 사업자번호 · 공사명은 jongsim.json 에 안 실음(종심넣기 그대로).
  🎲 G817 (11-21 소장님 「만들 수 있는 건 다 만들어」 ① 모의 개찰) — 채우기 뒤 남는 시간에 «업체 금액(a) 없는 종심 줄» 의 순위를 다시 받아 금액만 더함(금액채우기 ·
     새것부터 · --금액건수(기본 30) · 받지 못한 것은 "xa" 칸에 3일 뒤 다시 · 세 번이면 그만 · 균형가격 · 다른 칸은 그대로).

    python tools/종심채우기.py                       한 회차 몫(기본 60건)
    python tools/종심채우기.py --건수 80 --시간예산 240
"""
import argparse
import csv
import glob
import io
import os
import re
import sys
import time
import zipfile
from datetime import datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import collect as C                                            # noqa: E402
import kcm_rules as R                                          # noqa: E402

ZIP = os.path.join(ROOT, "data", "bid_data_3years.zip")
EXTRA = os.path.join(ROOT, "data", "extra_*.csv")
최소금액 = 9_500_000_000      # 예정가격(또는 기초금액) 95억 이상만 후보
다시날 = 3                    # 받지 못한 것은 3일 뒤 다시
다시최대 = 3                  # 세 번이면 그만


def _수(v):
    s = re.sub(r"[^0-9.]", "", str(v or ""))
    try:
        return float(s) if s else 0.0
    except ValueError:
        return 0.0


def _예정(금액, 율):
    a, t = _수(금액), _수(율)
    return a * 100.0 / t if a > 0 and 50.0 <= t <= 150.0 else 0.0


def 후보읽기(오늘, 일수=365, 최소=최소금액, extra=EXTRA, zip_path=ZIP):
    """지난 일수 안 큰 개찰 → [{"no", "ord", "d", "inst", "base"}] 새것부터(같은 공고는 기초금액이 있는 누적 CSV 줄을 앞세움)"""
    부터 = (datetime.strptime(오늘, "%Y-%m-%d") - timedelta(days=일수)).strftime("%Y-%m-%d")
    out = {}
    for p in sorted(glob.glob(extra)):
        try:
            with io.open(p, encoding="utf-8-sig") as f:
                for r in csv.DictReader(f):
                    no = (r.get("공고번호") or "").strip()
                    d = (r.get("날짜") or "").strip()
                    if not no or d[:10] < 부터:
                        continue
                    base = int(_수(r.get("기초금액")))
                    if max(base, _예정(r.get("투찰금액"), r.get("투찰률"))) < 최소:
                        continue
                    out[no] = {"no": no, "ord": "", "d": d[:16], "inst": (r.get("발주기관") or "").strip(), "base": base or None}
        except Exception as e:
            print("  ! %s 읽기 실패 (%s)" % (os.path.basename(p), type(e).__name__))
    try:
        with zipfile.ZipFile(zip_path) as z:
            with z.open(z.namelist()[0]) as f:
                for r in csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig", errors="replace")):
                    no = (r.get("공고번호") or "").strip()
                    d = (r.get("날짜") or "").strip()
                    if not no or d[:10] < 부터 or no in out:
                        continue
                    if _예정(r.get("투찰금액"), r.get("투찰률")) < 최소:
                        continue
                    o = re.sub(r"[^0-9]", "", str(r.get("공고차수") or ""))
                    out[no] = {"no": no, "ord": o.zfill(3) if o else "", "d": d[:16], "inst": (r.get("발주기관") or "").strip(), "base": None}
    except Exception as e:
        print("  ! 3년 파일 읽기 실패 (%s)" % type(e).__name__)
    return sorted(out.values(), key=lambda c: (c["d"], c["no"]), reverse=True)


def 건너뜀(x, 오늘):
    """jongsim.json "x" 한 칸 [까닭, 횟수, 날] — 다시 안 물을 것이면 True"""
    if not isinstance(x, list) or not x:
        return False
    if x[0] == "아님":
        return True
    n = int(x[1]) if len(x) > 1 and str(x[1]).isdigit() else 1
    if n >= 다시최대:
        return True
    날 = str(x[2]) if len(x) > 2 else ""
    try:
        return (datetime.strptime(오늘, "%Y-%m-%d") - datetime.strptime(날, "%Y-%m-%d")).days < 다시날
    except ValueError:
        return False


def 표시(js, no, 까닭, 오늘, 칸="x"):
    x = js.setdefault(칸, {})
    전 = x.get(no)
    n = (int(전[1]) if isinstance(전, list) and len(전) > 1 and str(전[1]).isdigit() else 0) + 1
    x[no] = [까닭, 1 if 까닭 == "아님" else n, 오늘]


def _멈춤():
    return C.QUOTA_OUT or C.NET_DOWN


def _공고(key, no):
    """공고번호로 공고(차수마다 한 줄) → (가장 뒤 차수 줄 또는 None, 실패 까닭 또는 "")"""
    why = {}
    items = C.fetch(C.ENDPOINTS[("live", "con")], key, None, {"inqryDiv": "2", "bidNtceNo": no}, label="종심 공고 %s" % no, why=why)
    rows = [r for r in (C.row_live(it) for it in (items or [])) if r]
    if rows:
        return max(rows, key=lambda r: str(r.get("ord") or "").zfill(3)), ""
    if C.BID_QUOTA or _멈춤():
        return None, "멈춤"
    if why and str(why.get("code", "")).lstrip("0") != "3":
        return None, "실패"          # 통신 · HTTP · 응답 오류(03 자료 없음 말고) — 표시하지 않고 다음 회차
    return None, "없음"


def 채우기(key, js, 후보, live=None, first=None, 건수=60, 시간예산=0, 쉼=0.35, now=None):
    now = now or datetime.now(C.KST)
    오늘 = now.strftime("%Y-%m-%d")
    con = js.setdefault("con", {})
    x = js.setdefault("x", {})
    lv = (live or {}).get("con") or {}
    fs = (first or {}).get("con") or {}
    남 = [c for c in 후보 if c["no"] not in con and not 건너뜀(x.get(c["no"]), 오늘)]
    t0 = time.time()
    st = {"후보": len(후보), "남은": len(남), "봄": 0, "넣음": 0, "아님": 0, "없음": 0, "부름": 0}
    for c in 남[:max(0, 건수)]:
        if _멈춤():
            print("  · 하루 몫이 끝났거나 통신이 막혔습니다 — 여기까지 하고 멈춥니다.")
            break
        if 시간예산 and time.time() - t0 > 시간예산:
            print("  · 시간 예산(%d초)을 다 썼습니다 — 여기까지 하고 멈춥니다." % 시간예산)
            break
        no = c["no"]
        st["봄"] += 1
        fr = fs.get(no) or {}
        src = dict(lv.get(no) or {})
        if not src.get("swin"):
            got, 까닭 = _공고(key, no)
            st["부름"] += 1
            time.sleep(쉼)
            if 까닭 == "멈춤":
                break
            if 까닭 == "실패":
                continue
            if not got:
                표시(js, no, "공고없음", 오늘)
                st["없음"] += 1
                continue
            src = got
        if not R.종심갈래(src.get("swin"), src.get("est")):
            표시(js, no, "아님", 오늘)
            st["아님"] += 1
            continue
        base = C.to_int(c.get("base") or fr.get("base") or src.get("base"))
        if not base:
            b = C.bsis_one(key, no, "con") or {}
            st["부름"] += 1
            time.sleep(쉼)
            base = C.to_int(b.get("base"))
        ords = []
        for o in (fr.get("ord"), src.get("ord"), c.get("ord"), "000"):
            o = re.sub(r"[^0-9]", "", str(o or ""))
            if o and o.zfill(3) not in ords:
                ords.append(o.zfill(3))
        전체, 쓴차수 = [], ords[0]
        for o in ords[:2]:
            if _멈춤():
                break
            쓴차수 = o
            C.openg_ranks(key, no, o, 전체=전체)
            st["부름"] += 1
            time.sleep(쉼)
            if 전체:
                break
        if _멈춤() and not 전체:
            break
        r = {"no": no, "ord": 쓴차수, "dt": fr.get("dt") or c.get("d") or "", "inst": fr.get("inst") or c.get("inst") or src.get("inst") or "",
             "base": base or None}
        if C.종심넣기(js, r, {"con": {no: src}}, 전체, now=now):
            st["넣음"] += 1
            x.pop(no, None)
        else:
            표시(js, no, "순위없음", 오늘)
            st["없음"] += 1
    st["초"] = int(time.time() - t0)
    return st


def 금액채우기(key, js, 건수=30, 시간예산=0, 쉼=0.35, now=None):
    """🎲 G817 업체 금액("a") 없는 종심 줄 — 새것부터 순위를 다시 받아 C.금액넣기(금액만 · 균형가격은 그대로) · 못 받으면 "xa" 에 표시(3일 뒤 · 세 번이면 그만)"""
    now = now or datetime.now(C.KST)
    오늘 = now.strftime("%Y-%m-%d")
    xa = js.setdefault("xa", {})
    남 = sorted((r for r in (js.get("con") or {}).values() if isinstance(r, dict) and r.get("no") and "a" not in r and not 건너뜀(xa.get(r["no"]), 오늘)),
               key=lambda r: str(r.get("dt") or ""), reverse=True)
    t0 = time.time()
    st = {"남은": len(남), "봄": 0, "넣음": 0, "없음": 0, "부름": 0}
    for r in 남[:max(0, 건수)]:
        if _멈춤():
            break
        if 시간예산 and time.time() - t0 > 시간예산:
            break
        no = r["no"]
        st["봄"] += 1
        전체 = []
        C.openg_ranks(key, no, re.sub(r"[^0-9]", "", str(r.get("ord") or "000")).zfill(3), 전체=전체)
        st["부름"] += 1
        time.sleep(쉼)
        if _멈춤() and not 전체:
            break
        if C.금액넣기(js, no, 전체):
            st["넣음"] += 1
            xa.pop(no, None)
        else:
            표시(js, no, "순위없음", 오늘, 칸="xa")
            st["없음"] += 1
    st["초"] = int(time.time() - t0)
    return st


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--건수", type=int, default=60, help="이번 회차에 볼 공고 수")
    ap.add_argument("--시간예산", type=int, default=240, help="이 초를 넘기면 멈춤 (0=안 봄)")
    ap.add_argument("--쉼", type=float, default=0.35, help="한 번 부른 뒤 쉬는 시간(초)")
    ap.add_argument("--금액건수", type=int, default=30, help="🎲 G817 업체 금액(모의 개찰 재료)을 다시 받을 종심 줄 수")
    a = ap.parse_args()

    js = C.load_jongsim()
    if js is None:
        print("⛔ data/seed/jongsim.json 이 깨져 있어 이번 회차는 건너뜁니다(덮지 않음).")
        return
    C.load_env()
    key = C.api_key()
    now = datetime.now(C.KST)
    후보 = 후보읽기(now.strftime("%Y-%m-%d"))
    live, first = C.load_store("live"), C.load_store("first")
    st = 채우기(key, js, 후보, live, first, 건수=a.건수, 시간예산=a.시간예산, 쉼=a.쉼, now=now)
    js["_채움"] = dict(st, t=now.strftime("%Y-%m-%d %H:%M"), 모두=len(js.get("con") or {}))
    try:   # 🎲 G817 남는 시간에 업체 금액(모의 개찰 재료) — 실패해도 채운 것은 저장
        남시간 = max(0, a.시간예산 - st.get("초", 0)) if a.시간예산 else 0
        if not _멈춤() and (not a.시간예산 or 남시간 > 20):
            sa = 금액채우기(key, js, 건수=a.금액건수, 시간예산=남시간, 쉼=a.쉼, now=now)
            js["_금액"] = dict(sa, t=now.strftime("%Y-%m-%d %H:%M"), 있음=sum(1 for r in (js.get("con") or {}).values() if isinstance(r, dict) and "a" in r))
            print("🎲 종심 업체 금액(모의 개찰 재료) — 남은 %s · 이번 %s건 봄 · 넣음 %s · 없음 %s · 있음 %s줄"
                  % (sa["남은"], sa["봄"], sa["넣음"], sa["없음"], js["_금액"]["있음"]))
    except Exception as e:   # noqa: BLE001
        print("  ! 🎲 종심 업체 금액 채우기 실패 (%s: %s) — 넘어갑니다" % (type(e).__name__, e))
    C.save_jongsim(js)
    print("🏛 종심 지난 1년 채우기 — 후보 %s · 남은 %s · 이번 %s건 봄(부름 %s) · 넣음 %s · 아님 %s · 없음 %s · %s초 · 모두 %s줄"
          % tuple(format(v, ",") for v in (st["후보"], st["남은"], st["봄"], st["부름"], st["넣음"], st["아님"], st["없음"], st["초"],
                                         len(js.get("con") or {}))))


if __name__ == "__main__":
    main()
