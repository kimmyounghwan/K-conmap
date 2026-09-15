# -*- coding: utf-8 -*-
"""naeyeok_fetch.py — 조달청 내역서 첨부를 «소장님 PC 에» 모읍니다. (2026-09-15)

소장님: 「내역서를 한 곳에 모으자. 조달청 자료 중에 단가가 있는 자료를 1년치 누적으로.」

    python tools\naeyeok_fetch.py --n 100          ← 먼저 «시험 100건»
    python tools\naeyeok_fetch.py --n 500 --all    ← 수율을 보고 나서 본격 수집

■ 왜 먼저 100건인가
   4,290건을 다 받아 놓고 «쓸 게 없네» 가 되면 시간이 아깝습니다.
   종류별로 골고루 받아서 **단가가 실제로 든 파일이 몇 %인지** 부터 잽니다.

■ 어디에 모이나
   <나노_건설맵 코드 등>/내역서모음/<종류>/<공고번호>_<파일이름>
   이미 받은 파일은 건너뜁니다(이어받기). 다시 돌려도 안전합니다.

■ ⚠️ 천천히 받습니다
   기본 2.5초 간격입니다. 몰아서 받으면 조달청이 막습니다. 줄이지 마세요.
   이건 소장님이 입찰 참가자로서 받을 수 있는 공개 첨부파일이고,
   받는 곳도 소장님 PC 입니다. 그래도 남의 서버라 예의는 지킵니다.

■ ⚠️ 클라우드에서는 못 돕니다
   조달청은 클로드 쪽 통로에서 막혀 있습니다. **소장님 PC 에서만** 돕니다.
   그래서 «7_내역서모으기.bat» 로 만들어 뒀습니다.
"""
import argparse
import io
import json
import os
import random
import re
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, "web", "public", "data", "naeyeok-all.json")
BOX  = os.path.join(os.path.dirname(ROOT), "내역서모음")
LOG  = os.path.join(BOX, "_수집기록.json")
RPT  = os.path.join(BOX, "_수집보고.md")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/140.0 Safari/537.36")

# ⚠️ 2026-09-15 고침 — 처음엔 «종류»(kind)로 몫을 나눴는데 헛돌았습니다.
#    자료 4,032건의 실제 종류는 공내역서 1,886 / 그 밖의 1,415 / 물량 705 / 수량 26 뿐이고
#    «설계내역서·단가산출서» 는 목록에 아예 없었습니다(집계 메타에만 있던 숫자였습니다).
#    시험 50건에서 단가가 든 건 2건(4%)뿐이었고, 그 둘은 파일 **이름**이 「산출내역서」 「관급」 이었습니다.
#    → 종류 대신 **파일 이름**으로 겨냥합니다.
TARGET = re.compile(r"산출\s*내역|설계\s*내역|예산\s*내역|도급예산|관급|단가|원가\s*계산|일위\s*대가")
#    반대로 이 이름들은 단가가 없는 게 거의 확실합니다(공고 단계에서 발주처가 단가를 비워 줍니다).
SKIP = re.compile(r"물량|수량\s*산출")

# 종류로 나눌 때 쓰는 몫 (--mode spread)
QUOTA = {"그 밖의 내역서": 40, "공내역서": 30, "물량내역서": 20, "수량산출서": 10}

SAFE = re.compile(r'[\\/:*?"<>|\r\n\t]')


def safe(s, n=80):
    return SAFE.sub("_", str(s or "")).strip()[:n] or "이름없음"


def load_rows():
    d = json.load(io.open(SRC, encoding="utf-8"))
    f = d["f"]
    return [dict(zip(f, r)) for r in d["r"]]


def load_log():
    try:
        return json.load(io.open(LOG, encoding="utf-8"))
    except Exception:
        return {}


def save_log(v):
    os.makedirs(BOX, exist_ok=True)
    io.open(LOG, "w", encoding="utf-8").write(json.dumps(v, ensure_ascii=False, indent=1))


def real_kind(head):
    """확장자를 믿지 않습니다. 앞머리 몇 글자로 진짜 형식을 봅니다.
       (조달청에는 .xls 인데 실제로는 xlsx 인 파일이 흔합니다)"""
    if head[:4] == b"PK\x03\x04":
        return "zip계열"            # xlsx · zip
    if head[:8] == b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
        return "ole계열"            # 옛 xls · 옛 hwp · doc
    if head[:4] == b"%PDF":
        return "pdf"
    if head[:16].startswith(b"HWP Document"):
        return "hwp"
    if head[:5].lower() in (b"<html", b"<!doc"):
        return "html(오류쪽)"
    return "모름"


def has_price(path, kind):
    """«단가» 가 실제로 들어 있나. (있음 / 없음 / 못읽음, 메모)"""
    if kind == "zip계열":
        try:
            import zipfile
            with zipfile.ZipFile(path) as z:
                names = z.namelist()
            if not any(n.startswith("xl/") for n in names):
                return "못읽음", "zip 인데 엑셀이 아님(안에 %d개)" % len(names)
        except Exception as e:
            return "못읽음", "zip 못 엶: %s" % type(e).__name__
        try:
            from openpyxl import load_workbook
        except ImportError:
            return "못읽음", "openpyxl 없음"
        wb = None
        for ro in (True, False):     # ⚠️ read_only 로 TypeError 나는 파일이 있습니다 — 한 번 더 시도
            try:
                wb = load_workbook(path, data_only=True, read_only=ro)
                break
            except Exception as e:
                last = e
        if wb is None:
            return "못읽음", "엑셀 못 엶: %s" % type(last).__name__
        try:
            for ws in wb.worksheets[:4]:
                col, hdr = None, None
                for ri, row in enumerate(ws.iter_rows(max_row=40, max_col=40, values_only=True), 1):
                    for ci, v in enumerate(row):
                        if v is None:
                            continue
                        t = str(v).replace(" ", "")
                        if "단가" in t and "산출" not in t:
                            col, hdr = ci, ri
                            break
                    if col is not None:
                        break
                if col is None:
                    continue
                got = 0
                for row in ws.iter_rows(min_row=hdr + 1, max_row=hdr + 400,
                                        min_col=col + 1, max_col=col + 1, values_only=True):
                    v = row[0]
                    if isinstance(v, (int, float)) and v > 0:
                        got += 1
                        if got >= 3:
                            return "있음", "%s · 단가칸에 숫자 %d+" % (ws.title[:14], got)
                if got:
                    return "있음", "%s · 단가 %d칸" % (ws.title[:14], got)
                return "없음", "%s · 단가칸은 있는데 비어 있음(공내역서 꼴)" % ws.title[:14]
            return "없음", "단가 칸을 못 찾음"
        finally:
            try: wb.close()
            except Exception: pass
    if kind == "ole계열":
        try:
            import xlrd                                   # noqa
        except ImportError:
            return "못읽음", "옛 xls — xlrd 없음"
        try:
            import xlrd
            bk = xlrd.open_workbook(path)
            for sh in bk.sheets()[:4]:
                for r in range(min(40, sh.nrows)):
                    for c in range(min(40, sh.ncols)):
                        t = str(sh.cell_value(r, c)).replace(" ", "")
                        if "단가" in t and "산출" not in t:
                            got = 0
                            for rr in range(r + 1, min(r + 400, sh.nrows)):
                                v = sh.cell_value(rr, c)
                                if isinstance(v, float) and v > 0:
                                    got += 1
                            return ("있음" if got else "없음"), "%s · 단가 %d칸" % (sh.name[:14], got)
            return "없음", "단가 칸을 못 찾음"
        except Exception as e:
            return "못읽음", "xls 못 엶: %s" % type(e).__name__
    return "못읽음", kind


def fetch(url, timeout=40):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "*/*",
        "Referer": "https://www.g2b.go.kr/",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def pick(rows, n, mode):
    """target = 이름으로 겨냥(단가가 있을 것) · spread = 종류별 골고루 · all = 최신순 전부"""
    rows = [r for r in rows if r.get("url")]
    rows.sort(key=lambda r: str(r.get("dt") or ""), reverse=True)
    if mode == "target":
        hit = [r for r in rows
               if TARGET.search(str(r.get("file") or "")) and not SKIP.search(str(r.get("file") or ""))]
        return hit[:n]
    if mode == "all":
        return rows[:n]
    out, cnt = [], {}
    for r in rows:
        k = r.get("kind") or "그 밖의 내역서"
        if cnt.get(k, 0) >= QUOTA.get(k, 0):
            continue
        cnt[k] = cnt.get(k, 0) + 1
        out.append(r)
        if len(out) >= n:
            break
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=100, help="이번에 받을 최대 건수")
    ap.add_argument("--sleep", type=float, default=2.5, help="한 건 받고 쉬는 초 (줄이지 마세요)")
    ap.add_argument("--mode", default="target", choices=["target", "spread", "all"],
                    help="target=이름으로 겨냥(기본) · spread=종류별 골고루 · all=최신순 전부")
    a = ap.parse_args()

    if not os.path.exists(SRC):
        print("[멈춤] 내역서 목록이 없습니다: %s" % SRC); return 1

    rows = load_rows()
    log = load_log()
    todo = [r for r in pick(rows, a.n * 4, a.mode) if r["url"] not in log][:a.n]

    print("내역서 모으기")
    print("  목록      %d건 · 이미 받음 %d건" % (len(rows), len(log)))
    print("  겨냥      %s" % a.mode)
    print("  이번에    %d건 · 간격 %.1f초" % (len(todo), a.sleep))
    print("  모이는 곳 %s" % BOX)
    if not todo:
        print("  더 받을 것이 없습니다."); return 0
    print()

    os.makedirs(BOX, exist_ok=True)
    ok = 0
    for i, r in enumerate(todo, 1):
        kind = r.get("kind") or "그 밖의 내역서"
        d = os.path.join(BOX, safe(kind, 20))
        os.makedirs(d, exist_ok=True)
        fn = "%s_%s" % (safe(r.get("no"), 24), safe(r.get("file"), 70))
        path = os.path.join(d, fn)
        head = "[%3d/%d] %-8s %s" % (i, len(todo), kind[:8], safe(r.get("file"), 46))
        try:
            body = fetch(r["url"])
        except Exception as e:
            print("%s → 실패 %s" % (head, type(e).__name__))
            log[r["url"]] = {"ok": False, "why": type(e).__name__, "kind": kind}
            time.sleep(a.sleep); continue
        if len(body) < 200:
            print("%s → 너무 작음(%dB)" % (head, len(body)))
            log[r["url"]] = {"ok": False, "why": "too_small", "kind": kind}
            time.sleep(a.sleep); continue
        io.open(path, "wb").write(body)
        rk = real_kind(body[:16])
        price, memo = has_price(path, rk)
        ok += 1
        print("%s → %s · %s · 단가 %s (%s)" % (head, "{:,}B".format(len(body)), rk, price, memo))
        log[r["url"]] = {"ok": True, "bytes": len(body), "kind": kind, "real": rk,
                         "price": price, "memo": memo, "path": os.path.relpath(path, BOX),
                         "name": r.get("name"), "inst": r.get("inst"), "dt": r.get("dt")}
        if i % 10 == 0:
            save_log(log)
        time.sleep(a.sleep + random.random())

    save_log(log)
    report(log)
    print()
    print("받은 것 %d건. 보고서: %s" % (ok, RPT))
    return 0


def report(log):
    from collections import Counter
    byk = {}
    real = Counter()
    for v in log.values():
        if not v.get("ok"):
            byk.setdefault(v.get("kind", "?"), Counter())["실패"] += 1
            continue
        byk.setdefault(v.get("kind", "?"), Counter())[v.get("price", "?")] += 1
        real[v.get("real", "?")] += 1
    L = ["# 내역서 모으기 — 수집 보고", "",
         "지금까지 시도 %d건" % len(log), "",
         "## 종류별 «단가가 들었나»", "",
         "| 종류 | 있음 | 없음 | 못읽음 | 실패 | 합 |", "|---|---|---|---|---|---|"]
    for k, c in sorted(byk.items(), key=lambda x: -sum(x[1].values())):
        L.append("| %s | %d | %d | %d | %d | %d |" %
                 (k, c["있음"], c["없음"], c["못읽음"], c["실패"], sum(c.values())))
    L += ["", "## 진짜 파일 형식", ""]
    for k, n in real.most_common():
        L.append("- %s — %d건" % (k, n))
    L += ["", "## 단가가 든 파일 (앞 40건)", ""]
    n = 0
    for v in log.values():
        if v.get("price") == "있음":
            n += 1
            L.append("- `%s` · %s · %s" % (v.get("path"), (v.get("name") or "")[:40], v.get("memo")))
            if n >= 40:
                break
    os.makedirs(BOX, exist_ok=True)
    io.open(RPT, "w", encoding="utf-8").write("\n".join(L))


if __name__ == "__main__":
    sys.exit(main())
