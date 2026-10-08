# -*- coding: utf-8 -*-
"""📐 용역 · 📦 물품 수집 — 공고 · 1순위 (G194 · 2026-10-07)

소장님: 「용역, 물품 다 한다면 무료 가능해. 지금 공사 어느 정도 해 놨으니, 그 방식 그대로 하면 되고」
        「그럼, 용역 먼저 설계 해 보고 가상 인터넷에 띄어줘」
        「공사 공고, 1순위, 용역 …, 물품 … 이렇게 되어야 하는데」 → 「전체적인 화면을 … 가상 인터넷에 띄우고 본 다음 얘기하자」
설계: docs/용역_설계_261007.md

■ 무엇을 하나
  collect.py(공사)의 함수를 그대로 빌려 «용역» · «물품» 을 받습니다 — 종류마다 조달청 오퍼레이션 셋:
                용역(serv)                               물품(thng)
     개찰 목록   getOpengResultListInfoServc             getOpengResultListInfoThng       → 1순위 (row_first)
     공고 목록   getBidPblancListInfoServc               getBidPblancListInfoThng         → 공고 (row_live)
     기초금액    getBidPblancListInfoServcBsisAmount     getBidPblancListInfoThngBsisAmount → 기초금액 · 예가 범위(하루 묶음)
     (입찰공고정보서비스 · 낙찰정보서비스 — 둘 다 운영계정 · 하루 최대 10만 건, 2026-10-07 포털에서 확인)
  저장  data/store/{svc|goods}_first.json · _live.json   (공사 저장소와 같은 캐시 폴더 — 회차 사이에 남음)
  화면  web/public/data/board/{svc|goods}-first.json · -first-{serv|thng}-{n}.json · -idx.json
        web/public/data/board/{svc|goods}-live.json  · -live-{serv|thng}-{n}.json  · -idx.json
        ⚠️ 이름이 공사(first · live)와 달라서 collect.py 의 export_board 가 덮거나 지우지 않습니다.
        화면은 공사와 같은 useBoard(묶음 500 · 색인)로 읽습니다 — pages/SvcBoard.jsx(용역 · 물품 같이).

■ 조달청 하루 몫(공사와 같은 몫을 나눠 씀)
  · 종류마다 지난 수집에서 2시간이 안 지났으면 화면 파일만 다시 굽고 끝냅니다(호출 0번).
  · 회차마다 최근 --days 일(기본 2) + 아직 못 받은 날 --catchup 일(기본 7)씩 메워 7주를 채웁니다.
  · 조달청이 «하루 몫 끝» · 연결 안 됨 · 시간 예산(NET_BUDGET_S) 끝이면 그 회차는 그만 — collect.fetch 의 차단기를 그대로 씁니다.
  · 기초금액은 «덤» — 못 받아도 그날을 «못 받음» 으로 치지 않습니다(목록 둘만 받으면 그날은 끝).

■ 이번 판에 안 하는 것: 바로투찰 셈 · 권장 금액 · 순위 30곳 · 면허 칩 · 빠른 수집 · 3년치 분석(설계 3장).

쓰는 법:
  python svc.py                       # 정기(용역 · 물품 둘 다 · 2시간 지났을 때만 조달청)
  python svc.py --kind serv           # 용역만 (thng = 물품만)
  python svc.py --days 7              # 미리보기 — 최근 7일 바로 받기(간격 무시)
  python svc.py --exportonly          # 조달청 안 부르고 저장소로 화면 파일만 다시 굽기
"""
import argparse
import io
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
import collect as C   # noqa: E402  — 공사 수집의 함수 · 주소 · 차단기를 그대로 씁니다

KINDS = {
    "serv": {"slug": "svc", "label": "용역",
             "first": C.ENDPOINTS[("first", "serv")],
             "live": C.ENDPOINTS[("live", "serv")],
             "bsis": C.BSIS["serv"]},
    "thng": {"slug": "goods", "label": "물품",
             "first": f"{C.BASE}/as/ScsbidInfoService/getOpengResultListInfoThng",
             "live": f"{C.BASE}/ad/BidPublicInfoService/getBidPblancListInfoThng",
             "bsis": f"{C.BASE}/ad/BidPublicInfoService/getBidPblancListInfoThngBsisAmount"},
}
GAP_H = 2.0                                              # 이 시간 안에는 조달청을 다시 안 부름
SHOW_DAYS = C.SHOW_DAYS                                  # 7주
KEEP_DAYS = C.KEEP_DAYS                                  # 10주 보관
CHUNK = C.BOARD_CHUNK
RANK_CHUNK = C.BOARD_RANK_CHUNK
RANK_KEYS = C.BOARD_RANK_KEYS


def names(kind):
    s = KINDS[kind]["slug"]
    return {"first": f"{s}-first", "live": f"{s}-live"}   # 화면 파일 이름(공사와 겹치지 않게)


def store_path(kind, which):
    return os.path.join(C.STORE, f"{KINDS[kind]['slug']}_{which}.json")


def load(kind, which):
    """{"rows": {공고번호: 줄}, "days": {YYYYMMDD: 받은 시각}, "_lastrun": iso}"""
    try:
        with io.open(store_path(kind, which), encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d, dict) and isinstance(d.get("rows"), dict):
            d.setdefault("days", {})
            return d
    except Exception:
        pass
    return {"rows": {}, "days": {}}


def save(kind, which, d):
    os.makedirs(C.STORE, exist_ok=True)
    p = store_path(kind, which)
    tmp = p + ".tmp"
    with io.open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, p)


def days_wanted(today, days, catchup, done):
    """최근 days 일은 늘 다시 받고, 그보다 앞의 7주 안에서 아직 못 받은 날을 catchup 개까지."""
    recent = [today - timedelta(days=i) for i in range(days)]
    older = []
    for i in range(days, SHOW_DAYS):
        if len(older) >= catchup:          # 🩹 시험에서 잡음 — 넣고 나서 세면 catchup=0 에도 하루가 더 붙음
            break
        d = today - timedelta(days=i)
        if d.strftime("%Y%m%d") not in done:
            older.append(d)
    return recent + older


def keep_fields(dst, src, fields):
    for f in fields:
        if dst.get(f) in (None, "", 0, []) and src.get(f) not in (None, "", 0, []):
            dst[f] = src[f]


def bsis_day(key, day, kind):
    """하루치 기초금액 {공고번호: {...}} — 999건이 넘으면 다음 쪽도(물품은 하루가 많음)."""
    out = {}
    rows, _why = C.fetch_paged(KINDS[kind]["bsis"], key, day, label=f"{KINDS[kind]['label']} 기초금액 {day:%m-%d}")
    for it in rows:
        no = str(C.pick(it, "bidNtceNo") or "").strip()
        r = C.bsis_row(it)
        if no and r:
            r.update(C.extra_amounts(it))
            out[no] = r
    return out


def collect_day(key, day, first, live, sleep, kind="serv"):
    """하루치 — 목록 둘(개찰 · 공고)을 받으면 True (빈 날이어도 True · 실패한 날은 False 라 다음 회차가 다시 받음)."""
    K = KINDS[kind]
    ok = True
    ds = day.strftime("%m-%d")
    rows, why = C.fetch_paged(K["first"], key, day, label=f"{K['label']} 개찰 {ds}")
    if why:
        ok = False
    for item in rows:
        r = C.row_first(item)
        if r:
            prev = first["rows"].get(r["no"]) or {}
            keep_fields(r, prev, ("base", "lo", "hi", "aval", "llr", "est", "site", "rgn", "ind"))
            first["rows"][r["no"]] = r
    time.sleep(sleep)
    rows, why = C.fetch_paged(K["live"], key, day, label=f"{K['label']} 공고 {ds}")
    if why:
        ok = False
    for item in rows:
        r = C.row_live(item)
        if r:
            prev = live["rows"].get(r["no"]) or {}
            keep_fields(r, prev, ("base", "lo", "hi", "aval"))
            live["rows"][r["no"]] = r
    time.sleep(sleep)
    ok = ok and not (C.NET_DOWN or C.QUOTA_OUT)
    # 기초금액은 «공고» 날짜로 묶여 옵니다 — 받은 것은 공고 · 개찰 둘 다에 채웁니다(같은 공고번호면 같은 값). 덤이라 실패해도 ok 그대로.
    bm = bsis_day(key, day, kind)
    for no, b in bm.items():
        for st in (live, first):
            row = st["rows"].get(no)
            if row is None:
                continue
            for f, v in b.items():
                if v not in (None, "", 0) and not row.get(f):
                    row[f] = v
    return ok


def join_live_to_first(first, live):
    """공고에만 오는 값(기초금액 · 하한율 · 추정가격 · 지역 · 업종)을 개찰 줄에 이어 붙입니다 — 호출 0번."""
    n = 0
    F = ("base", "llr", "est", "site", "rgn", "ind", "lo", "hi", "pmth", "swin")
    for no, r in first["rows"].items():
        src = live["rows"].get(no)
        if isinstance(src, dict):
            before = sum(1 for f in F if r.get(f))
            # 💰 G194d — 예정가격 결정방법(pmth) · 낙찰방법(swin)도 이어 붙임(용역 · 물품 사정률 실측을 «복수예가» 개찰로만 재려고)
            keep_fields(r, src, ("base", "lo", "hi", "aval", "llr", "est", "site", "rgn", "ind", "pmth", "swin"))
            n += sum(1 for f in F if r.get(f)) - before
    return n


# ── 💰 G194d 용역 · 물품 바로투찰 — «셀 수 있는 공고» 판정 (web/src/lib/용역셈.js 셈가능 과 같은 규칙 · 시험이 둘을 대조)
#   소장님 「물품이나 용역은 계산 방법이 다르다고 했잖아 그럼 공사처럼 설명을 해줘야지? … 바로입찰 버튼 이런게 있어야 클릭을 하지???」 → 「만들어 줘」
#   ① 협상에 의한 계약 — 제안서 점수로 정해짐 → 안 셈   ② 수의시담 — 한 곳과 협의 → 안 셈
#   ③ 예정가격이 «복수예가» 가 아니면(단일예가 · 비예가) 사정률로 못 셈   ④ 낙찰하한율이 공고에 없으면(최저가 · 규격가격 동시 등) 하한이 없음
#   ⑤ 기초금액 공개 전이면 아직   ⑥ 예가 범위(lo · hi)가 없으면 사정률 흔들림을 못 정함
def calc_why(r):
    """셀 수 있으면 "" · 아니면 까닭 열쇠(협상 · 시담 · 예가 · 하한율 · 기초 · 범위)."""
    swin = str(r.get("swin") or "")
    if "협상" in swin:
        return "협상"
    if "시담" in swin:
        return "시담"
    if "복수" not in str(r.get("pmth") or ""):
        return "예가"
    try:
        llr = float(r.get("llr") or 0)
    except Exception:
        llr = 0
    if not (60 <= llr <= 100):
        return "하한율"
    if not (int(r.get("base") or 0) > 0):
        return "기초"
    if r.get("lo") in (None, "") or r.get("hi") in (None, ""):
        return "범위"
    return ""


def sj_stats(rows):
    """용역 · 물품 사정률 실측 — 1순위 투찰금액 ÷ 투찰률 = 예정가격, ÷ 기초금액 = 사정률.
    복수예가 · 2곳 이상 경쟁 · 투찰률 50~100% · 사정률 94~106% 인 개찰만(수의 · 협상 · 잘못 온 값 빼기)."""
    v = []
    for r in rows:
        try:
            base, amt, rate, np_ = int(r.get("base") or 0), float(r.get("amt") or 0), float(r.get("rate") or 0), int(r.get("np") or 0)
        except Exception:
            continue
        if base <= 0 or amt <= 0 or not (50 < rate <= 100) or np_ < 2 or "복수" not in str(r.get("pmth") or ""):
            continue
        sj = amt / (rate / 100.0) / base * 100.0
        if 94 <= sj <= 106:
            v.append(sj)
    if not v:
        return None
    v.sort()
    q = lambda p: round(v[min(len(v) - 1, max(0, int(round(p * (len(v) - 1)))))], 3)
    return {"n": len(v), "p25": q(0.25), "p50": q(0.5), "p75": q(0.75)}


def est_of(r):
    e = int(r.get("est") or 0)
    if e > 0:
        return e
    b = int(r.get("base") or 0)
    return round(b / 1.1) if b > 0 else 0


def write_json(path, obj):
    with io.open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


def clear_stale(out_dir, prefix, start):
    i = start
    while True:
        p = os.path.join(out_dir, f"{prefix}{i}.json")
        if not os.path.exists(p):
            break
        try:
            os.remove(p)
        except Exception:
            write_json(p, [])
        i += 1


def export(which, st, built, out_root=None, kind="serv"):
    """한 화면(1순위 · 공고)의 묶음 · 색인 · 목록표를 굽습니다 — collect.export_board 와 같은 모양(useBoard 가 그대로 읽음)."""
    out_dir = os.path.join(out_root or C.OUT, "board")
    os.makedirs(out_dir, exist_ok=True)
    name = names(kind)[which]
    date_field = "dt"
    rows = list(C.trim(st["rows"], SHOW_DAYS, date_field).values())
    rows.sort(key=lambda r: C.dt_digits(r.get(date_field)), reverse=True)

    # 순위 파일(rank)은 굽지 않습니다 — 개찰 목록은 1순위 한 곳만 주고(그건 줄에 win · amt · rate 로 이미 있음),
    # 화면(SvcBoard)도 순위 파일을 안 읽습니다. 시험 자료로 재 보니 1순위 7주치에 198개 파일이 헛으로 생겼습니다.
    n_rank = 0
    clear_stale(out_dir, f"{name}-{kind}-rank-", 0)

    parts = [rows[i:i + CHUNK] for i in range(0, len(rows), CHUNK)] or [[]]
    for i, part in enumerate(parts):
        # 묶음에는 순위(corps · rq · drw)와 대표자 이름(ceo)을 안 싣습니다 — 화면이 안 쓰는 칸 · 사람 이름은 안 내보냄
        slim = [{k: v for k, v in r.items() if k not in RANK_KEYS and k != "ceo"} for r in part]
        write_json(os.path.join(out_dir, f"{name}-{kind}-{i}.json"), slim)
    clear_stale(out_dir, f"{name}-{kind}-", len(parts))

    # 검색 색인 — 줄 차례는 묶음을 이어붙인 것과 «똑같이» (n번째 = n÷500 묶음의 n%500 번째)
    rbook = C.region_book(rows)
    if which == "first":
        fields = ["name", "inst", "win", "sido", "np"]      # np = 참가업체 수(G198c «🏅 2곳 이상 경쟁만» 단추)
        idx = [[r.get("name") or "", r.get("inst") or "", r.get("win") or "", C.sido_of(r, rbook), int(r.get("np") or 0)] for r in rows]
    else:
        fields = ["name", "inst", "sido", "est", "close", "c"]       # c = 💰 바로투찰로 셀 수 있으면 1 (G194d)
        idx = [[r.get("name") or "", r.get("inst") or "", C.sido_of(r, rbook), est_of(r),
                C.dt_digits(r.get("close"))[:12], 0 if calc_why(r) else 1] for r in rows]
    write_json(os.path.join(out_dir, f"{name}-{kind}-idx.json"), {"f": fields, "chunk": CHUNK, "r": idx})

    days = sorted({C.dt_digits(r.get(date_field))[:8] for r in rows if r.get(date_field)})
    rc = {}
    for r in rows:
        for g in (C.sido_of(r, rbook) or "").split(","):
            if g:
                rc[g] = rc.get(g, 0) + 1
    meta = {"built": built, "chunk": CHUNK, "rankChunk": RANK_CHUNK,
            kind: {"n": len(rows), "parts": len(parts), "ranks": n_rank,
                   "from": days[0] if days else "", "to": days[-1] if days else "",
                   "rgns": rc, "norgn": sum(1 for r in rows if not C.sido_of(r, rbook)),
                   "base": sum(1 for r in rows if r.get("base"))}}
    if which == "first":
        sj = sj_stats(rows)
        if sj:
            meta[kind]["sj"] = sj        # 💰 G194d 용역 · 물품 사정률 실측(화면 바로투찰이 30건 넘으면 이 가운데값을 씀)
    else:
        meta[kind]["calc"] = sum(1 for r in rows if not calc_why(r))
    write_json(os.path.join(out_dir, f"{name}.json"), meta)
    size = sum(os.path.getsize(os.path.join(out_dir, x)) for x in os.listdir(out_dir) if x.startswith(name + "-"))
    print(f"  → board/{name}  {len(rows):,}건 · {len(parts)}묶음 · {size / 1024:.0f}KB")
    return meta


def run_kind(kind, a, today, now):
    K = KINDS[kind]
    first, live = load(kind, "first"), load(kind, "live")
    gap = None
    if first.get("_lastrun"):
        try:
            gap = (now - datetime.fromisoformat(first["_lastrun"])).total_seconds() / 3600.0
        except Exception:
            gap = None
    print(f"  ── {K['label']}({kind})")
    call = not a.exportonly and (a.days > 0 or gap is None or gap >= GAP_H)
    if not call:
        why = "--exportonly" if a.exportonly else f"지난 수집 {gap:.1f}시간 전(< {GAP_H:.0f}시간)"
        print(f"  · 조달청 안 부름 — {why}. 화면 파일만 다시 굽습니다.")
    elif C.NET_DOWN or C.QUOTA_OUT:
        print("  · 조달청 차단기가 이미 내려가 있음(하루 몫 · 연결 · 시간) — 이번 회차는 화면 파일만")
    else:
        C.load_env()
        key = C.api_key()
        done = first.get("days") or {}
        scan = days_wanted(today, a.days or 2, 0 if a.days else a.catchup, done)
        print(f"  · 받을 날: {len(scan)}일 ({', '.join(d.strftime('%m-%d') for d in scan)})")
        got = 0
        for d in scan:
            if C.NET_DOWN or C.QUOTA_OUT:
                print("  · 조달청 차단기(하루 몫 · 연결 · 시간) — 이번 회차는 여기까지")
                break
            if collect_day(key, d, first, live, a.sleep, kind):
                done[d.strftime("%Y%m%d")] = now.isoformat(timespec="seconds")
                got += 1
        first["days"] = {k: v for k, v in done.items()
                         if k >= (today - timedelta(days=KEEP_DAYS)).strftime("%Y%m%d")}
        first["_lastrun"] = now.isoformat(timespec="seconds")
        print(f"  · 받은 날 {got}/{len(scan)}")

    j = join_live_to_first(first, live)
    if j:
        print(f"  · 공고 → 개찰 이어붙임 {j:,}칸")
    first["rows"] = C.trim(first["rows"], KEEP_DAYS, "dt")
    live["rows"] = C.trim(live["rows"], KEEP_DAYS, "dt")
    if not a.exportonly:
        save(kind, "first", first)
        save(kind, "live", live)
    built = datetime.now(C.KST).strftime("%Y-%m-%d %H:%M")
    m1 = export("first", first, built, a.out, kind)
    m2 = export("live", live, built, a.out, kind)
    print(f"  ✓ {K['label']} 1순위 {m1[kind]['n']:,}건 · 공고 {m2[kind]['n']:,}건 (기초금액 있는 공고 {m2[kind]['base']:,})")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--kind", default="all", choices=["all", "serv", "thng"], help="serv = 용역 · thng = 물품 · all = 둘 다")
    ap.add_argument("--days", type=int, default=0, help="최근 며칠을 바로 받을지(주면 2시간 간격을 무시)")
    ap.add_argument("--catchup", type=int, default=7, help="7주 안에서 아직 못 받은 날을 회차마다 몇 날 메울지")
    ap.add_argument("--sleep", type=float, default=0.5)
    ap.add_argument("--exportonly", action="store_true", help="조달청을 안 부르고 화면 파일만 다시 굽기")
    ap.add_argument("--out", default=None, help="화면 파일을 둘 곳(시험용 · 기본 web/public/data)")
    a = ap.parse_args(argv)

    now = datetime.now(timezone.utc)
    today = datetime.now(C.KST)
    print("=" * 52)
    print("  📐 용역 · 📦 물품 수집 (G194)")
    print("=" * 52)
    for kind in (["serv", "thng"] if a.kind == "all" else [a.kind]):
        run_kind(kind, a, today, now)
    return 0


if __name__ == "__main__":
    sys.exit(main())
