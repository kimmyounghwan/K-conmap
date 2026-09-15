# -*- coding: utf-8 -*-
"""📊 3년치 투찰 순위 보관함 (2026-09-15)

왜 따로 두나
  · 조달청이 목록으로 주는 개찰 결과에는 **낙찰자 한 곳만** 들어 있습니다.
    참가업체가 200곳이어도 한 줄입니다. 나머지는 공고번호로 하나씩 물어야 옵니다.
  · 그래서 3년치 아카이브(bid_data_3years.zip · extra_*.csv)에는 1순위뿐입니다.
    낙찰을 못 해 본 업체는 자기 기록을 아예 볼 수 없었습니다.
  · 순위를 받아 쌓되, 개찰 저장소(first.json)에 넣을 수는 없습니다.
    first.json 은 «최근 개찰» 만 들고 있고 저장소에 커밋되는 파일입니다.
    3년치 순위는 720만 줄이라 거기 넣으면 저장소가 터집니다.

소장님 지시 (2026-09-15): 「이것도 3년치만 보관하는 걸로 하자. 순위」
  → 3년이 지난 달은 통째로 버립니다. 그래서 **다 차면 크기가 멈춥니다.**
     하루 들어오는 만큼 하루 버리므로 무한정 쌓이지 않습니다.

자리
    data/store/ranks3y/YYYY-MM.csv.gz   달마다 한 장 (개찰일 기준)
    data/store/ranks3y/_진행.json       달마다 공고 몇 건·줄 몇 개를 받았나

한 줄 (머리글 없음 — 달마다 같은 모양입니다)
    공고번호, 개찰일(YYYYMMDD), 전체투찰수, 순위, 사업자번호, 업체명, 투찰금액, 투찰률

⚠️ 업체를 **이름으로 묶으면 안 됩니다** (2026-09-15 실측).
   투찰 47,485줄에서 «같은 이름인데 사업자번호가 다른» 업체가 **1,846가지** 였습니다
   (「대성건설 주식회사」만 5곳). 반대로 «같은 사업자번호인데 이름이 다른» 경우는 0 —
   조달청은 이름을 일관되게 줍니다. 그러니 **사업자번호가 곧 업체**입니다.
   90%에 사업자번호가 옵니다. 나머지 10%는 이름밖에 없어 성적표에서 «확실하지 않음» 으로 둡니다.

⚠️ 이 폴더는 **저장소에 올리지 않습니다** (.gitignore).
   회차 사이 보관은 GitHub Actions 의 cache(data/store)가 맡습니다.
   커밋하면 매 회차 수십 MB 가 쌓여 저장소가 GB 로 불어납니다.

⚠️ 같은 공고를 두 번 받으면 줄이 겹칩니다. 지우지 않고 **그냥 덧붙입니다** —
   읽을 때 «나중에 온 것» 으로 덮어쓰고, compact() 가 가끔 청소합니다.
   덧붙이기는 실패해도 앞의 자료를 망가뜨리지 않기 때문입니다.
"""

import csv
import datetime as _dt
import gzip
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(ROOT, "data", "store", "ranks3y")
PROG = os.path.join(DIR, "_진행.json")

KEEP_DAYS = 1095          # 3년. 이보다 오래된 달 파일은 버립니다.
HEAD = ["공고번호", "개찰일", "전체투찰수", "순위", "사업자번호", "업체명", "투찰금액", "투찰률"]

_buf = {}                 # {"YYYY-MM": [줄, ...]} — flush() 때 한 번에 씁니다


# ── 날짜 다루기 ────────────────────────────────────────────────
def _ymd(dt):
    """'2026-09-03 15:00:00' · '20260903150000' → '20260903' (못 읽으면 '')"""
    s = re.sub(r"[^0-9]", "", str(dt or ""))
    return s[:8] if len(s) >= 8 else ""


def _ym(ymd):
    return ymd[:4] + "-" + ymd[4:6] if len(ymd) >= 6 else ""


def _path(ym):
    return os.path.join(DIR, ym + ".csv.gz")


# ── 담기 ───────────────────────────────────────────────────────
def put(no, dt, total, corps):
    """개찰 한 건의 순위를 버퍼에 담습니다.

    corps 는 openg_ranks() 가 주는 모양 그대로:
        [[업체명, 투찰금액, 투찰률, 사업자번호, 대표자, 추첨1, 추첨2], ...]
    낮은 금액 순으로 정렬돼 있으므로 자리번호가 곧 순위입니다.

    사업자번호는 **반드시 담습니다** — 이름만으로는 업체를 못 가립니다(위 ⚠️ 참고).
    대표자·추첨번호는 담지 않습니다. 성적표에 쓰는 것은 «누가·몇 위·얼마·몇 %» 뿐입니다.
    """
    ymd = _ymd(dt)
    ym = _ym(ymd)
    if not ym or not no or not corps:
        return 0
    rows = _buf.setdefault(ym, [])
    n = 0
    for i, c in enumerate(corps, 1):
        if not c or not c[0]:
            continue
        bno = re.sub(r"[^0-9]", "", str(c[3] if len(c) > 3 else ""))
        rows.append([str(no), ymd, int(total or len(corps)), i,
                     bno if len(bno) == 10 else "",
                     str(c[0])[:60], int(c[1] or 0),
                     ("%.3f" % float(c[2])) if c[2] else ""])
        n += 1
    return n


def flush():
    """버퍼를 달 파일에 덧붙입니다. 돌려주는 것: (달 수, 줄 수)"""
    if not _buf:
        return 0, 0
    os.makedirs(DIR, exist_ok=True)
    months = lines = 0
    for ym in sorted(_buf):
        rows = _buf[ym]
        if not rows:
            continue
        # gzip 은 «이어 붙인 덩어리» 를 그대로 읽습니다. 그래서 덧붙이기가 됩니다.
        with gzip.open(_path(ym), "at", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerows(rows)
        months += 1
        lines += len(rows)
    _buf.clear()
    _save_prog()
    return months, lines


# ── 읽기 ───────────────────────────────────────────────────────
def months():
    """가지고 있는 달 목록 (오래된 것부터)"""
    if not os.path.isdir(DIR):
        return []
    return sorted(fn[:-7] for fn in os.listdir(DIR) if fn.endswith(".csv.gz"))


def read_month(ym):
    """한 달을 {공고번호: {"d":개찰일, "n":전체수, "r":[[순위,사업자번호,업체명,금액,율],...]}} 로.

    같은 공고가 두 번 있으면 **나중 것** 이 이깁니다 (덧붙이기라 뒤가 새 자료입니다).
    """
    p = _path(ym)
    out = {}
    if not os.path.exists(p):
        return out
    with gzip.open(p, "rt", encoding="utf-8", newline="") as f:
        for row in csv.reader(f):
            if len(row) < 8 or row[0] == "공고번호":
                continue
            no, ymd, total, rank, bno, nm, amt, rate = row[:8]
            try:
                rank_i = int(rank)
                amt_i = int(amt or 0)
            except ValueError:
                continue
            # 한 공고의 줄은 «순위 1번부터» 이어서 들어갑니다. 그래서 1번을 다시 만나면
            # «같은 공고를 새로 받아 덧붙인 것» 입니다 — 앞의 묶음을 버리고 새로 담습니다.
            if rank_i == 1 or no not in out:
                out[no] = {"d": ymd, "n": int(total or 0), "r": []}
            out[no]["r"].append([rank_i, bno, nm, amt_i, rate])
    for v in out.values():
        v["r"].sort(key=lambda x: x[0])
    return out


def iter_notices(since_ymd=None):
    """가진 달을 오래된 것부터 훑어 (공고번호, 자료) 를 하나씩 내줍니다.
       한 달씩만 메모리에 올리므로 3년치라도 안전합니다."""
    for ym in months():
        if since_ymd and ym < _ym(since_ymd):
            continue
        for no, v in read_month(ym).items():
            yield no, v


# ── 치우기 ─────────────────────────────────────────────────────
def trim(keep_days=KEEP_DAYS, today=None):
    """3년이 지난 달 파일을 버립니다. 돌려주는 것: 버린 달 목록"""
    t = today or _dt.date.today()
    cut = (t - _dt.timedelta(days=keep_days)).strftime("%Y-%m")
    gone = []
    for ym in months():
        if ym < cut:
            try:
                os.remove(_path(ym))
                gone.append(ym)
            except OSError:
                pass
    if gone:
        _save_prog()
    return gone


def compact(ym):
    """한 달을 다시 써서 겹친 줄을 걷어냅니다. 돌려주는 것: (전, 후) 줄 수"""
    data = read_month(ym)
    if not data:
        return 0, 0
    before = 0
    p = _path(ym)
    with gzip.open(p, "rt", encoding="utf-8", newline="") as f:
        for _ in f:
            before += 1
    tmp = p + ".tmp"
    after = 0
    with gzip.open(tmp, "wt", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        for no, v in sorted(data.items()):
            for rank, bno, nm, amt, rate in v["r"]:
                w.writerow([no, v["d"], v["n"], rank, bno, nm, amt, rate])
                after += 1
    os.replace(tmp, p)
    _save_prog()
    return before, after


# ── 진행표 ─────────────────────────────────────────────────────
def _save_prog():
    try:
        os.makedirs(DIR, exist_ok=True)
        info = {}
        for ym in months():
            n = 0
            with gzip.open(_path(ym), "rt", encoding="utf-8", newline="") as f:
                for _ in f:
                    n += 1
            info[ym] = {"줄": n, "크기KB": round(os.path.getsize(_path(ym)) / 1024)}
        with io.open(PROG, "w", encoding="utf-8") as f:
            json.dump({"갱신": _dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
                       "보관": "%d일(3년)" % KEEP_DAYS, "달": info},
                      f, ensure_ascii=False, indent=1)
    except Exception:
        pass


def summary():
    """사람이 읽는 한 줄 — 회차 끝에 찍습니다."""
    ms = months()
    if not ms:
        return "순위 보관함: 아직 비어 있습니다"
    lines = size = 0
    for ym in ms:
        size += os.path.getsize(_path(ym))
        with gzip.open(_path(ym), "rt", encoding="utf-8", newline="") as f:
            for _ in f:
                lines += 1
    return ("순위 보관함: %s달 · %s줄 · %.1fMB (%s ~ %s)"
            % (format(len(ms), ","), format(lines, ","), size / 1048576,
               ms[0], ms[-1]))


if __name__ == "__main__":
    print(summary())
    for ym in months():
        print(" ", ym, os.path.getsize(_path(ym)) // 1024, "KB")
