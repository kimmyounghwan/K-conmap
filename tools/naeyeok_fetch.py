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
# ⚠️ 2026-09-15 네 번째 발견 — 목록 파일이 **두 개** 였습니다.
#    collect.py 가 이렇게 나눠 씁니다(그 파일의 export_naeyeok 설명 그대로):
#      naeyeok.json      단가가 «들어 있는» 갈래 — 설계내역서 227 · 단가산출서 31  ← 우리가 찾던 것
#      naeyeok-all.json  나머지              — 공내역서 1,886 · 그 밖의 1,415 · 물량 705 · 수량 26
#    그동안 all 쪽만 읽어서, 정작 알짜인 258건을 **한 건도 건드리지 않았습니다.**
#    (naeyeok-all.json 의 kinds 에 설계내역서 227 이 적혀 있는데 줄에는 없어서
#     「메타 숫자만 남은 것」 이라고 잘못 짚었던 그 258건이 바로 이 파일에 있었습니다.)
SRCS = [os.path.join(ROOT, "web", "public", "data", "naeyeok.json"),
        os.path.join(ROOT, "web", "public", "data", "naeyeok-all.json")]
SRC  = SRCS[1]          # 있는지 확인할 때만 씁니다
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

# ⚠️ 2026-09-15 두 번째 발견 — 이름 겨냥(TARGET)으로 208건 받아 **단가 있음 29건(14%)**.
#    4% 에서 올랐지만, 단가가 든 29건을 들여다보니 갈래가 **둘로 뚜렷**했습니다:
#      ① 파일 이름이 군더더기 없이 「산출내역서」
#      ② **「단가계약」·「연간단가」 공사** ← 단가 자체가 입찰 대상이라 기준단가를 공개할 수밖에 없습니다.
#         그래서 «공내역서» 인데도 단가가 들어 있습니다.
#    → 공고 **이름**까지 같이 봅니다(파일 이름만으로는 «단가계약» 이 안 잡히는 건이 많습니다).
PRICE = re.compile(r"단가\s*계약|연간\s*단가|단가\s*입찰|단가\s*공사|\(단가\)|산출내역서")
#    반대로 이 이름들은 단가가 없는 게 거의 확실합니다(공고 단계에서 발주처가 단가를 비워 줍니다).
SKIP = re.compile(r"물량|수량\s*산출")

# 종류로 나눌 때 쓰는 몫 (--mode spread)
QUOTA = {"그 밖의 내역서": 40, "공내역서": 30, "물량내역서": 20, "수량산출서": 10}

SAFE = re.compile(r'[\\/:*?"<>|\r\n\t]')


def safe(s, n=80):
    return SAFE.sub("_", str(s or "")).strip()[:n] or "이름없음"


def load_rows():
    """두 목록을 합쳐 읽습니다. url 이 같으면 한 번만."""
    out, seen = [], set()
    for src in SRCS:
        if not os.path.exists(src):
            continue
        d = json.load(io.open(src, encoding="utf-8"))
        f = d["f"]
        for r in d["r"]:
            row = dict(zip(f, r))
            u = row.get("url")
            if not u or u in seen:
                continue
            seen.add(u)
            out.append(row)
    return out


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


# ── 여기부터 새 has_price ───────────────────────────────────────────────
# ⚠️ 2026-09-15 세 번째 발견 — 받아 둔 254건을 **다시 훑어** 보고 알았습니다.
#    앞 판은 시트를 앞에서 네 장만 보고, 그중 첫 장에 「단가」 칸이 있는데 비어 있으면
#    그 자리에서 «없음» 으로 접었습니다. 그런데 조달청 내역서는 거의 다
#      표지 → 총괄 → 공종별집계 → **내역서** → **일위대가** → **자재단가**
#    순서라, 단가가 든 시트는 대개 **뒤쪽**에 있습니다. 앞 장만 보고 접은 셈입니다.
#    시트를 끝까지(14장) 보게 고쳤더니 **같은 파일 254건에서 29건 → 74건** 이 되었습니다.
#    (내려받기 한 건도 더 하지 않았습니다.)
#  · 시트 이름도 함께 봅니다. 「공사설정」·「INITIAL」 같은 프로그램 설정 시트에도
#    9칸짜리 숫자가 들어 있어 «단가» 로 잘못 세던 것을 걸러 냅니다.
GOOD_SHEET = re.compile(r"일위|대가|내역|단가|자재|중기|노임|집계|원가|공종")
BAD_SHEET  = re.compile(r"공사설정|INITIAL|설정|기준|표지|목차|설명|서식|양식")
HDR_UP     = re.compile(r"단가")
HDR_NOT    = re.compile(r"단가산출|산출단가")


def _hdr_cols(get_row, nrow, ncol):
    """머리글 줄에서 «단가» 가 든 칸을 모두 찾습니다. (한 줄에 여러 개일 수 있습니다)"""
    for r in range(nrow):
        cols = []
        row = get_row(r)
        if row is None:
            continue
        for c, v in enumerate(row[:ncol]):
            if v is None:
                continue
            t = re.sub(r"\s+", "", str(v))
            if HDR_UP.search(t) and not HDR_NOT.search(t):
                cols.append(c)
        if cols:
            return cols, r
    return None, None


# ── openpyxl 이 못 여는 파일을 위한 «맨 XML» 읽기 ──────────────────────
# ⚠️ 2026-09-15 — 받아 둔 것 중 12건이 openpyxl 에서 TypeError 로 넘어갔습니다.
#    까닭은 «바깥 파일 연결(externalLinks)» 입니다. 설계사무소가 다른 엑셀을 걸어 둔 채로 올린 것입니다.
#    keep_links=False 도, 그 부분을 떼어 낸 사본도 안 먹혔습니다.
#    → 시트 XML 을 직접 읽습니다. 서식은 못 읽지만 우리는 «글자와 숫자» 만 필요합니다.
_NS  = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
_RNS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'


def _xcol(ref):
    m = re.match(r"([A-Z]+)", ref or "")
    if not m:
        return 0
    n = 0
    for ch in m.group(1):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def _xsheets(path):
    import xml.etree.ElementTree as ET
    import zipfile
    with zipfile.ZipFile(path) as z:
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        rmap = {r.get("Id"): r.get("Target") for r in rels}
        out = []
        for sh in wb.iter(_NS + "sheet"):
            t = rmap.get(sh.get(_RNS + "id"), "")
            if not t:
                continue
            t = t.lstrip("/")
            if not t.startswith("xl/"):
                t = "xl/" + t
            out.append((sh.get("name") or "", t))
        return out


def _xshared(path):
    import xml.etree.ElementTree as ET
    import zipfile
    try:
        with zipfile.ZipFile(path) as z:
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    except Exception:
        return []
    return ["".join(t.text or "" for t in si.iter(_NS + "t")) for si in root.iter(_NS + "si")]


def _xrows(path, target, sst, maxrow=1400):
    """시트 XML 을 훑어 [(줄번호, {칸번호: 값})] 을 돌려줍니다.
       ⚠️ 정규식으로 <row>…</row> 를 짝지어 찾으면 733KB 짜리 시트에서 몇 분씩 걸립니다
          (자기닫음 <row/> 때문에 뒤로 한없이 물러나며 찾습니다). 그래서 XML 훑개를 씁니다."""
    import xml.etree.ElementTree as ET
    import zipfile
    out = []
    with zipfile.ZipFile(path) as z:
        with z.open(target) as fh:
            ri = -1
            for ev, el in ET.iterparse(fh, events=("end",)):
                tag = el.tag.split("}")[-1]
                if tag != "row":
                    continue
                ri += 1
                if ri >= maxrow:
                    el.clear()
                    break
                cells = {}
                for c in el:
                    if c.tag.split("}")[-1] != "c":
                        continue
                    ref = c.get("r") or ""
                    typ = c.get("t")
                    col = _xcol(ref)
                    if typ == "inlineStr":
                        cells[col] = "".join(t.text or "" for t in c.iter()
                                             if t.tag.split("}")[-1] == "t")
                        continue
                    v = None
                    for ch in c:
                        if ch.tag.split("}")[-1] == "v":
                            v = ch.text
                            break
                    if v is None:
                        continue
                    if typ == "s":
                        try:
                            cells[col] = sst[int(v)]
                        except Exception:
                            cells[col] = ""
                    else:
                        try:
                            cells[col] = float(v)
                        except Exception:
                            cells[col] = v
                if cells:
                    out.append((ri, cells))
                el.clear()
    return out


def raw_price(path):
    """맨 XML 로 «단가» 를 찾습니다. (openpyxl 이 넘어졌을 때만)"""
    try:
        shs = _xsheets(path)
        sst = _xshared(path)
    except Exception as e:
        return "못읽음", "맨 XML 도 못 엶: %s" % type(e).__name__
    best, sawcol = None, False
    for name, tgt in shs[:14]:
        if BAD_SHEET.search(name or ""):
            continue
        try:
            rr = _xrows(path, tgt, sst, 700)
        except Exception:
            continue
        cols, hdr = None, None
        for i, (ri, cells) in enumerate(rr[:60]):
            c = [k for k, v in cells.items()
                 if isinstance(v, str) and HDR_UP.search(re.sub(r"\s+", "", v))
                 and not HDR_NOT.search(re.sub(r"\s+", "", v))]
            if c:
                cols, hdr = c, i
                break
        if cols is None:
            continue
        sawcol = True
        got = 0
        for ri, cells in rr[hdr + 1:]:
            for c in cols:
                v = cells.get(c)
                if isinstance(v, float) and v > 0:
                    got += 1
        if got and (best is None or got > best[1]):
            best = (name, got)
    if best:
        return "있음", "%s · 단가 %d칸 (맨 XML)" % (best[0][:14], best[1])
    if sawcol:
        return "없음", "단가칸은 있는데 다 비어 있음 (맨 XML)"
    return "없음", "단가 칸을 못 찾음 (맨 XML)"


def has_price(path, kind):
    """«단가» 가 실제로 들어 있나. (있음 / 없음 / 못읽음, 메모)
       시트를 **끝까지** 봅니다. 하나라도 숫자가 든 단가 칸이 있으면 «있음»."""
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
        wb, last = None, None
        for ro in (True, False):     # read_only 로 TypeError 나는 파일이 있습니다 — 한 번 더
            try:
                wb = load_workbook(path, data_only=True, read_only=ro)
                break
            except Exception as e:
                last = e
        if wb is None:
            return raw_price(path)          # ← openpyxl 이 넘어지면 맨 XML 로
        try:
            best, sawcol = None, False
            for ws in wb.worksheets[:14]:
                title = ws.title or ""
                if BAD_SHEET.search(title):
                    continue
                try:
                    grid = []
                    for i, row in enumerate(ws.iter_rows(max_row=60, max_col=40, values_only=True)):
                        grid.append(row)
                        if i >= 59:
                            break
                    cols, hdr = _hdr_cols(lambda r: grid[r] if r < len(grid) else None, len(grid), 40)
                    if cols is None:
                        continue
                    sawcol = True
                    got = 0
                    for row in ws.iter_rows(min_row=hdr + 2, max_row=hdr + 601, values_only=True):
                        for c in cols:
                            if c < len(row):
                                v = row[c]
                                if isinstance(v, (int, float)) and not isinstance(v, bool) and v > 0:
                                    got += 1
                    if got and (best is None or got > best[1]):
                        best = (title, got, GOOD_SHEET.search(title) is not None)
                    if best and best[1] >= 20 and best[2]:
                        break          # 충분합니다 — 더 볼 것 없습니다
                except Exception:
                    continue
            if best:
                return "있음", "%s · 단가 %d칸" % (best[0][:14], best[1])
            if sawcol:
                return "없음", "단가칸은 있는데 다 비어 있음(공내역서 꼴)"
            return "없음", "단가 칸을 못 찾음"
        finally:
            try: wb.close()
            except Exception: pass

    if kind == "ole계열":
        try:
            import xlrd
        except ImportError:
            return "못읽음", "옛 xls — xlrd 없음 (7_내역서모으기.bat 이 깔아 줍니다)"
        try:
            bk = xlrd.open_workbook(path)
            best, sawcol = None, False
            for sh in bk.sheets()[:14]:
                if BAD_SHEET.search(sh.name or ""):
                    continue
                cols, hdr = _hdr_cols(
                    lambda r: [sh.cell_value(r, c) for c in range(min(40, sh.ncols))],
                    min(60, sh.nrows), 40)
                if cols is None:
                    continue
                sawcol = True
                got = 0
                for rr in range(hdr + 1, min(hdr + 601, sh.nrows)):
                    for c in cols:
                        if c < sh.ncols:
                            v = sh.cell_value(rr, c)
                            if isinstance(v, float) and v > 0:
                                got += 1
                if got and (best is None or got > best[1]):
                    best = (sh.name, got, GOOD_SHEET.search(sh.name or "") is not None)
                if best and best[1] >= 20 and best[2]:
                    break
            if best:
                return "있음", "%s · 단가 %d칸" % (best[0][:14], best[1])
            if sawcol:
                return "없음", "단가칸은 있는데 다 비어 있음(공내역서 꼴)"
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


# ⚠️ 2026-09-15 — 받아 둔 254건의 «단가 있음» 비율을 실제로 세어 보고 정한 차례입니다.
#      갈래 설계내역서·단가산출서   … 아직 한 건도 안 받아 봄 (목록에 258건)
#      이름 「산출내역서」          … 42%
#      발주처 한국철도공사 회계통합센터 … 67% (24건 받아 16건)
#      이름 「공내역서」            … 29%
#      이름 「예산내역」            …  0%  ← 받지 않습니다
#      이름 「물량·수량」           …  0%  ← 받지 않습니다
GOLD_KIND = ("설계내역서", "단가산출서")
GOLD_INST = re.compile(r"한국철도공사|국가철도공단|한국도로공사|한국토지주택공사")
GOLD_FILE = re.compile(r"산출\s*내역|설계\s*내역|단가\s*산출|일위\s*대가")


def rank(r):
    """작을수록 먼저 받습니다."""
    kind = r.get("kind") or ""
    fn   = str(r.get("file") or "")
    nm   = str(r.get("name") or "")
    if kind in GOLD_KIND:
        return 0
    if GOLD_FILE.search(fn):
        return 1
    if GOLD_INST.search(str(r.get("inst") or "")):
        return 2
    if PRICE.search(fn + " " + nm):
        return 3
    return 9


def pick(rows, n, mode):
    """best = 수율 높은 차례대로(기본) · target = 이름 겨냥 · spread = 골고루 · all = 최신순"""
    rows = [r for r in rows if r.get("url")]
    rows.sort(key=lambda r: str(r.get("dt") or ""), reverse=True)
    if mode == "best":
        hit = [r for r in rows if rank(r) < 9 and not SKIP.search(str(r.get("file") or ""))]
        hit.sort(key=lambda r: (rank(r), -1 * 0))   # 차례는 rank, 그 안에서는 최신순 유지
        return hit[:n]
    if mode == "price":
        # 파일 이름 + 공고 이름 둘 다 본다
        def txt(r): return "%s %s" % (r.get("file") or "", r.get("name") or "")
        return [r for r in rows if PRICE.search(txt(r))][:n]
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
    ap.add_argument("--mode", default="best",
                    choices=["best", "price", "target", "spread", "all"],
                    help="best=수율 높은 차례대로(기본) · price=단가계약·연간단가 · "
                         "target=단가 낱말이 든 이름 · spread=종류별 골고루 · all=최신순 전부")
    a = ap.parse_args()

    if not os.path.exists(SRC):
        print("[멈춤] 내역서 목록이 없습니다: %s" % SRC); return 1

    rows = load_rows()
    log = load_log()
    # ⚠️ 2026-09-15 — 앞서 «n*4 만 골라 놓고 그 안에서 안 받은 것을 고르게» 해 뒀더니,
    #    514건을 받고 나니 위쪽이 다 채워져 「더 받을 것이 없습니다」 로 멈췄습니다.
    #    차례는 전부 매기고, **안 받은 것만** 추린 뒤에 자릅니다.
    todo = [r for r in pick(rows, 10 ** 6, a.mode) if r["url"] not in log][:a.n]

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
