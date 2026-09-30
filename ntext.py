# -*- coding: utf-8 -*-
"""ntext.py — 📄 공고문 전문 (2026-09-30)

소장님: 입찰나라에서 가져올 것 «공고 화면에 공고문 전문 · 투찰제한 · 입찰 일정»
        「편리성, 기능성 유지하면서」 · 「핸드폰에서도 편리하게 사용가능해야 해. 건설맵은」

■ 무엇을 하나
    마감 전 공고의 첨부 가운데 «공고문» 한 개(hwpx · hwp · pdf)를 받아 **글만** 뽑아 둡니다.
    화면은 공고 카드 · 공고 화면에서 «📄 공고문 전문 보기» 를 눌렀을 때만 그 한 건을 받습니다(몇 KB).
    나라장터에 로그인하지 않아도, 파일을 열 프로그램이 없는 폰에서도 공고문을 읽을 수 있게.

■ ⚠️ 숫자는 여기서 뽑지 않습니다
    입찰나라는 공고문 글에서 A값 · 순공사비를 뽑아 보여 주다 틀렸습니다(2026-09-30 직접 봄 —
    A값 353,931,667 을 703,017,388 로, 산업안전보건관리비를 «순공사비» 로).
    금액 · 하한율 · 일정은 계속 조달청 칸 그대로 씁니다. 전문은 «읽을거리» 로만 둡니다.

■ 어디에 두나 (내역서 파일과 같은 방식 — collect.py fetch_naeyeok_files 설명 참고)
    받은 글  data/store/ntext/{공고번호}.json   ← 회차 사이에 넘어가는 것은 data/store 뿐(Actions cache)
    기록     data/store/ntext_book.json         ← 몇 번 해 봤나 · 왜 못 했나 (다섯 번 해 보고 그만)
    내보냄   web/public/data/ntext/{공고번호}.json ← 지금 공고 목록(7주)에 있는 것만. 목록에서 빠지면 지웁니다.

■ 공고문 고르기
    이름에 «공고» 가 들어간 첨부 중 hwpx → hwp → pdf 차례(같은 공고문을 hwpx 와 pdf 로 둘 다 올리는 곳이 많습니다 —
    hwpx 가 글이 가장 깨끗합니다). 내역 · 도면 · 시방 · 설명서가 들어간 이름은 뺍니다.
    실측(저장소 7,070건 · 첨부 있는 공고): «공고» 가 든 첨부가 있는 공고 5,980건(85%) · hwpx 2,531 · hwp 1,677 · pdf 1,642.

■ 글 뽑기 — 바깥 프로그램 없이
    hwpx  zip 안 Contents/section*.xml 의 <hp:t> 글 · 문단(<hp:p>)마다 줄바꿈
    hwp   OLE(olefile) · FileHeader 의 압축 · 암호 · 배포용 표시 → BodyText/Section* 을 풀어(zlib) PARA_TEXT(67) 레코드의 글
          ⚠️ 배포용 · 암호 문서는 본문이 잠겨 있어 건너뜁니다(«잠긴 문서» 로 적어 둠 · 다시 안 봄)
    pdf   pdfminer.six (없으면 건너뜀)
"""
import io
import json
import os
import re
import time
import zipfile
import zlib
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(ROOT, "data", "store")
NTEXT_DIR = os.path.join(STORE, "ntext")
NTEXT_BOOK = os.path.join(STORE, "ntext_book.json")
PUB_DIR = os.path.join(ROOT, "web", "public", "data", "ntext")

NTEXT_FETCH = int(os.environ.get("NTEXT_FETCH", "120"))          # 한 회차에 새로 받는 개수
NTEXT_BUDGET_S = int(os.environ.get("NTEXT_BUDGET_S", "180"))    # 한 회차에 쓰는 시간(초)
NTEXT_TIMEOUT_S = int(os.environ.get("NTEXT_TIMEOUT_S", "25"))
NTEXT_MAXBYTES = int(os.environ.get("NTEXT_MAXBYTES", str(15 * 1024 * 1024)))
NTEXT_PDF_MAXBYTES = int(os.environ.get("NTEXT_PDF_MAXBYTES", str(6 * 1024 * 1024)))   # 공고문 PDF 는 보통 1MB 안
NTEXT_MAXCHARS = int(os.environ.get("NTEXT_MAXCHARS", "40000"))  # 이보다 길면 자릅니다(화면에 «뒷부분 생략»)
NTEXT_MINCHARS = 200                                              # 이보다 짧으면 글을 못 뽑은 것으로 봅니다
NTEXT_KEEP_DAYS = int(os.environ.get("NTEXT_KEEP_DAYS", "60"))

UA = {"User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                     "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"),
      "Referer": "https://www.g2b.go.kr/", "Accept": "*/*"}

_EXT_RANK = {".hwpx": 0, ".hwp": 1, ".pdf": 2}
_NOT_NOTICE = re.compile(r"내역|도면|시방|설명서|특수조건|과업|산출|물량|계약서|서약|양식|서식")


# ── 공고문 고르기 ────────────────────────────────────────────────
def pick_doc(docs):
    """[[이름, 주소], …] → (i, 이름, 주소) 또는 None"""
    best = None
    for i, y in enumerate(docs or []):
        if not isinstance(y, (list, tuple)) or len(y) < 2:
            continue
        nm, url = str(y[0] or ""), str(y[1] or "")
        ext = os.path.splitext(nm)[1].lower()
        if not url or ext not in _EXT_RANK or "공고" not in nm or _NOT_NOTICE.search(nm):
            continue
        key = (0 if "공고문" in nm else 1, _EXT_RANK[ext], i)
        if best is None or key < best[0]:
            best = (key, i, nm, url)
    return None if best is None else best[1:]


# ── 글 다듬기 ───────────────────────────────────────────────────
def tidy(t):
    t = re.sub("[\ud800-\udfff]", "", str(t or ""))    # 짝 없는 서로게이트 — 저장이 터집니다(2026-09-30 #655)
    t = t.replace("\r\n", "\n").replace("\r", "\n").replace(" ", " ")
    t = re.sub(r"[\u0000-\u0008\u000b\u000c\u000e-\u001f﻿-]", "", t)   # 제어 · 사용자 정의 글자
    t = re.sub(r"[ \t　]+", " ", t)
    lines = [ln.strip() for ln in t.split("\n")]
    out, blank = [], 0
    for ln in lines:
        if not ln:
            blank += 1
            if blank <= 1:
                out.append("")
            continue
        blank = 0
        out.append(ln)
    return "\n".join(out).strip()


# ── hwpx ────────────────────────────────────────────────────────
def _loc(tag):
    return tag.rsplit("}", 1)[-1]


def _hwpx_lines(el, out):
    """문단은 한 줄, 표는 «행마다 한 줄» (칸은 « | » 로) — 일정표 · 자격표가 폰에서도 읽히게"""
    for ch in el:
        nm = _loc(ch.tag)
        if nm == "p":
            buf = []
            for run in ch:
                if _loc(run.tag) != "run":
                    continue
                for t in run:
                    tn = _loc(t.tag)
                    if tn == "t":
                        buf.append("".join(t.itertext()))
                    elif tn == "tab":
                        buf.append(" ")
                    elif tn == "tbl":
                        if "".join(buf).strip():
                            out.append("".join(buf))
                        buf = []
                        _hwpx_table(t, out)
                    elif tn in ("ctrl", "pic", "linesegarray", "secPr", "line"):
                        continue                   # 머리말 · 꼬리말 · 그림은 뺍니다
                    else:
                        # 글상자(rect · container …) — 제목이 여기 들어 있는 공고문이 많습니다
                        if "".join(buf).strip():
                            out.append("".join(buf))
                        buf = []
                        _hwpx_lines(t, out)
            if "".join(buf).strip():
                out.append("".join(buf))
        elif nm in ("tbl",):
            _hwpx_table(ch, out)
        else:
            _hwpx_lines(ch, out)


def _hwpx_table(tbl, out):
    for tr in tbl:
        if _loc(tr.tag) != "tr":
            continue
        cells = []
        for tc in tr:
            if _loc(tc.tag) != "tc":
                continue
            sub = []
            _hwpx_lines(tc, sub)
            txt = " ".join(x.strip() for x in sub if x.strip())
            if txt:
                cells.append(txt)
        if cells:
            out.append(" | ".join(cells))
    out.append("")


def hwpx_text(body):
    z = zipfile.ZipFile(io.BytesIO(body))
    names = sorted((n for n in z.namelist() if re.match(r"Contents/section\d+\.xml$", n)),
                   key=lambda n: int(re.findall(r"\d+", n)[-1]))
    out = []
    for n in names:
        _hwpx_lines(ET.fromstring(z.read(n)), out)
    return "\n".join(out)


# ── hwp (5.0 OLE) ───────────────────────────────────────────────
class Locked(Exception):
    """배포용 · 암호 문서 — 본문이 잠겨 있습니다"""


_INLINE8 = {1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23}


def _para_text(buf):
    out = []
    i, n = 0, len(buf) // 2
    while i < n:
        c = buf[2 * i] | (buf[2 * i + 1] << 8)
        if c < 32:
            if c in _INLINE8:
                if c == 9:
                    out.append(" ")
                i += 8
                continue
            if c in (10, 13):
                out.append("\n")
            i += 1
            continue
        out.append(chr(c))
        i += 1
    # ⚠️ 2026-09-30 — 한 글자씩 chr() 로 옮기면 BMP 밖 글자(드문 한자 · 이모지)가 «짝 없는 서로게이트» 두 개로 남아
    #    json 저장에서 UnicodeEncodeError 가 났고, 그 한 건 때문에 공고문 전문 전체가 그 회차에 멈췄습니다(#655).
    #    → 짝은 한 글자로 합치고, 짝 없는 것은 �(U+FFFD) 로 바꿉니다.
    return "".join(out).encode("utf-16", "surrogatepass").decode("utf-16", "replace")


def hwp_text(body):
    import olefile
    ole = olefile.OleFileIO(io.BytesIO(body))
    try:
        hdr = ole.openstream("FileHeader").read()
        flags = int.from_bytes(hdr[36:40], "little")
        if flags & 0x02 or flags & 0x04:
            raise Locked("암호" if flags & 0x02 else "배포용")
        packed = bool(flags & 0x01)
        secs = sorted((e for e in ole.listdir() if len(e) == 2 and e[0] == "BodyText"
                       and re.match(r"Section\d+$", e[1])), key=lambda e: int(e[1][7:]))
        parts = []
        for e in secs:
            data = ole.openstream(e).read()
            if packed:
                data = zlib.decompress(data, -15)
            pos, L = 0, len(data)
            while pos + 4 <= L:
                h = int.from_bytes(data[pos:pos + 4], "little")
                tag, size = h & 0x3FF, (h >> 20) & 0xFFF
                pos += 4
                if size == 0xFFF:
                    size = int.from_bytes(data[pos:pos + 4], "little")
                    pos += 4
                if tag == 67:                                  # HWPTAG_PARA_TEXT
                    parts.append(_para_text(data[pos:pos + size]).rstrip("\n"))
                pos += size
        return "\n".join(parts)
    finally:
        ole.close()


# ── pdf ─────────────────────────────────────────────────────────
def pdf_text(body):
    try:
        from pdfminer.high_level import extract_text
    except Exception:
        return None
    # ⚠️ 도면 PDF 는 한 부에 70초가 걸렸습니다(실측 7.7MB) — 공고문은 보통 20쪽 안이라 앞 25쪽만 봅니다
    t = extract_text(io.BytesIO(body), maxpages=25)
    return re.sub(r"\n\s*\n", "\n", t or "")        # 글상자마다 빈 줄이 끼어 폰에서 늘어져 보입니다


def extract(body, ext):
    """(글, 까닭) — 글이 None 이면 까닭에 이유"""
    head = body[:8]
    try:
        if head[:4] == b"PK\x03\x04":
            t = hwpx_text(body)
        elif head[:4] == b"\xd0\xcf\x11\xe0":
            t = hwp_text(body)
        elif body[:17] == b"HWP Document File":
            return None, "옛 한글(3.0) 문서"
        elif head[:5] == b"%PDF-":
            t = pdf_text(body)
            if t is None:
                return None, "pdf 읽는 도구 없음"
        else:
            return None, "공고문 파일이 아님(%s · %d바이트)" % (ext, len(body))
    except Locked as e:
        return None, "잠긴 문서(%s)" % e
    except Exception as e:
        return None, "읽기 실패: %s" % type(e).__name__
    t = tidy(t)
    if len(t) < NTEXT_MINCHARS:
        return None, "글이 거의 없음(%d자 · 그림으로 된 문서일 수 있음)" % len(t)
    cut = len(t) > NTEXT_MAXCHARS
    return (t[:NTEXT_MAXCHARS] if cut else t), ("잘림" if cut else "")


# ── 받기 · 보관 · 내보내기 ──────────────────────────────────────
def _load(p, d):
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return d


def _save(p, v):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(v, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, p)


def _digits(s):
    return re.sub(r"[^0-9]", "", str(s or ""))


def fetch(store, built, now14, no_net=False, diag=None):
    """마감 전 공고의 공고문을 받아 글을 뽑습니다. 반환: 이번에 새로 뽑은 개수"""
    import requests
    os.makedirs(NTEXT_DIR, exist_ok=True)
    book = _load(NTEXT_BOOK, {})
    if no_net:
        if diag is not None:
            diag["ntext"] = {"건너뜀": "--exportonly (바깥을 부르지 않는 회차)"}
        return 0
    want = []
    for r in (store.get("con") or {}).values():
        no = str(r.get("no") or "")
        if not no or _digits(r.get("close")).ljust(14, "0") < now14:
            continue                                       # 마감 지난 공고는 새로 받지 않습니다
        if os.path.exists(os.path.join(NTEXT_DIR, no + ".json")):
            continue
        b0 = book.get(no) or {}
        if b0.get("perm") or int(b0.get("try") or 0) >= 5:
            continue
        d = pick_doc(r.get("docs"))
        if not d:
            continue
        want.append((_digits(r.get("dt")), no, r, d))
    want.sort(reverse=True)                                # 새 공고부터
    t0, new, ok, errs, streak = time.time(), 0, 0, {}, 0
    for _dt, no, r, (i, nm, url) in want:
        if new >= NTEXT_FETCH or time.time() - t0 > NTEXT_BUDGET_S:
            break
        if ok == 0 and streak >= 5:
            break                                          # 나라장터가 안 열리는 회차 — 다음에 다시
        new += 1
        b0 = book.get(no) or {}

        def fail(why, perm=False):
            errs[why.split("(")[0]] = errs.get(why.split("(")[0], 0) + 1
            book[no] = {"why": why, "try": int(b0.get("try") or 0) + 1, "at": built, **({"perm": True} if perm else {})}

        try:
            resp = requests.get(url, timeout=NTEXT_TIMEOUT_S, verify=False, headers=UA)
        except Exception as e:
            streak += 1
            fail("연결 실패: %s" % type(e).__name__)
            continue
        body = resp.content
        if resp.status_code != 200:
            streak += 1
            fail("HTTP %d" % resp.status_code)
            continue
        if len(body) > NTEXT_MAXBYTES or (body[:5] == b"%PDF-" and len(body) > NTEXT_PDF_MAXBYTES):
            fail("너무 큼 %.1fMB" % (len(body) / 1048576), perm=True)   # 도면 · 스캔 PDF — 공고문이 아닙니다
            continue
        t, why = extract(body, os.path.splitext(nm)[1].lower())
        if t is None:
            # 잠긴 문서 · 글 없는 문서는 다시 받아도 같습니다
            fail(why, perm=why.startswith(("잠긴", "글이 거의", "공고문 파일이 아님", "옛 한글")))
            streak = 0
            continue
        # ⚠️ 한 건이 저장에서 터져도 나머지는 계속 — 전에는 여기서 난 오류 하나가 회차 전체(내보내기까지)를 멈췄습니다(#655)
        try:
            _save(os.path.join(NTEXT_DIR, no + ".json"),
                  {"no": no, "f": nm, "t": t, "cut": 1 if why == "잘림" else 0,
                   "dt": str(r.get("dt") or "")[:10], "at": built})
        except Exception as e:
            fail("저장 실패: %s" % type(e).__name__, perm=True)
            continue
        book[no] = {"ok": 1, "at": built}
        ok += 1
        streak = 0
        time.sleep(0.15)
    _save(NTEXT_BOOK, book)
    if diag is not None:
        diag["ntext"] = {"대상": len(want), "이번에 두드린 것": new, "뽑음": ok, "실패 이유": errs,
                         "걸린 초": round(time.time() - t0, 1),
                         "보관": sum(1 for x in os.listdir(NTEXT_DIR) if x.endswith(".json"))}
    print("  → 공고문 전문  이번 %d건 뽑음 (두드림 %d · 대상 %d)%s" % (
        ok, new, len(want), (" · 실패 " + " · ".join("%s %d" % kv for kv in errs.items())) if errs else ""))
    return ok


def publish(store, keep_days=NTEXT_KEEP_DAYS, today=None):
    """지금 목록(store)에 있는 공고의 전문만 web/public/data/ntext 로 내보냅니다. 반환: 내보낸 공고번호 집합"""
    os.makedirs(PUB_DIR, exist_ok=True)
    nos = {str(r.get("no") or "") for r in (store.get("con") or {}).values()}
    have = set()
    if os.path.isdir(NTEXT_DIR):
        cut = None
        if today:
            from datetime import datetime, timedelta
            cut = (datetime.strptime(today, "%Y-%m-%d") - timedelta(days=keep_days)).strftime("%Y-%m-%d")
        for fn in os.listdir(NTEXT_DIR):
            if not fn.endswith(".json"):
                continue
            no = fn[:-5]
            src = os.path.join(NTEXT_DIR, fn)
            if no not in nos:
                d = _load(src, {})
                if cut and (d.get("dt") or "") and d["dt"] < cut:
                    try:
                        os.remove(src)                     # 오래된 것은 저장소에서도 내립니다
                    except Exception:
                        pass
                continue
            dst = os.path.join(PUB_DIR, fn)
            try:
                if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
                    d = _load(src, None)
                    if not d:
                        continue
                    _save(dst, {"f": d.get("f"), "t": d.get("t"), "cut": d.get("cut", 0)})
                have.add(no)
            except Exception:
                pass
    for fn in os.listdir(PUB_DIR):
        if fn.endswith(".json") and fn[:-5] not in have:
            try:
                os.remove(os.path.join(PUB_DIR, fn))
            except Exception:
                pass
    return have


def read_published(no):
    """prerender 가 씁니다 — 내보낸 전문 {f, t, cut} 또는 None"""
    return _load(os.path.join(PUB_DIR, str(no) + ".json"), None)
