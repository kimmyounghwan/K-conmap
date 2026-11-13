# -*- coding: utf-8 -*-
"""
publish.py — 다시 만든 서식을 사이트 자리에 놓습니다 (run.py 로 굽고 두 번 검증한 «뒤에» 돌립니다).

  python3 publish.py wonga chakgong …

하는 일
  ① 빈 틀 엑셀(수식 · 작성 예시 없이 — G361) → web/public/forms/{slug}.xlsx  (원본 틀은 web/public/forms/orig/{slug}.xlsx)
     + 사이트 «종이에 바로 쓰기» JSON → web/public/forms/g/{slug}.json (격자.py — 수식은 사이트가 풂)
  ② 미리보기 그림 → web/public/forms/v2/{slug}-{n}.webp  (서식마다 PREV = [(PDF쪽, 설명), …])
  ③ 일반 서식은 인쇄용 PDF(빈 서식만) → web/public/forms/v2/{slug}.pdf
  ⑤ 서식 목록 카드용 작은 그림 → web/public/forms/v2/t/{slug}.webp (thumbs.py)
  ④ forms.json / forms_orig.json 의 그 서식 칸을 고침(prev · prevcap · pdf · gen/re · kb · 쪽수 …)
     forms.json 의 short 가 바뀌면 forms-min.json 도 다시 씁니다(설계변경·내역서 탭이 읽음).
⚠️ 그림·PDF 이름에 v2 를 붙인 까닭: /forms/** 는 브라우저가 1시간 붙잡습니다 — 옛 미리보기가 남지 않게.
"""
import importlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from run import build, render  # noqa: E402
import 격자  # noqa: E402  ✍️ G361

PUB = os.path.join(ROOT, "web", "public", "forms")
DATA = os.path.join(ROOT, "web", "src", "data")
OUT = "/tmp/g10/f2/pub"


def _load(fn):
    return json.loads(open(os.path.join(DATA, fn), "rb").read().decode("utf-8"))


def _save(fn, d):
    """🩹 G668 — 있던 파일의 줄바꿈(CRLF · LF)을 그대로 따름: 클라우드 저장소는 LF(→ 늘 CRLF 로 쓰면 파일 통째로 바뀐 것으로 보였음 · forms.json 7만 줄) · PC(autocrlf)는 CRLF"""
    p = os.path.join(DATA, fn)
    crlf = True
    if os.path.exists(p):
        head = open(p, "rb").read(4096)
        crlf = b"\r\n" in head
    s = json.dumps(d, ensure_ascii=False, indent=1)
    if crlf:
        s = s.replace("\n", "\r\n")
    open(p, "wb").write(s.encode("utf-8"))


def _webp(pdf, page, dst):
    from PIL import Image
    tmp = tempfile.mkdtemp()
    subprocess.run(["pdftoppm", "-f", str(page), "-l", str(page), "-scale-to", "990", "-png", pdf, os.path.join(tmp, "p")], check=True)
    png = [f for f in os.listdir(tmp) if f.endswith(".png")][0]
    im = Image.open(os.path.join(tmp, png)).convert("RGB")
    im.save(dst, "WEBP", quality=82, method=6)
    shutil.rmtree(tmp)
    return im.size


def _print_pdf(xlsx, blank_names, dst):
    """빈 서식 시트만 남긴 사본 → PDF"""
    import openpyxl
    tmp = tempfile.mkdtemp()
    wb = openpyxl.load_workbook(xlsx)
    for ws in list(wb.worksheets):
        if ws.title not in blank_names:
            wb.remove(ws)
    p = os.path.join(tmp, os.path.basename(dst)[:-4] + ".xlsx")
    wb.save(p)
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", tmp, p], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    shutil.copy(p[:-5] + ".pdf", dst)
    shutil.rmtree(tmp)


def _그림pdf(pdf, dst, dpi=150):
    """📄 G668 새 서식(XLSX = False) — 인쇄용 PDF 를 그림으로(글자 층 없음 · 변환 프로그램으로 엑셀이 안 나옴 · 소장님 11-13 «pdf 만 변환 안되게»)"""
    from PIL import Image
    tmp = tempfile.mkdtemp()
    subprocess.run(["pdftoppm", "-r", str(dpi), "-jpeg", "-jpegopt", "quality=88", pdf, os.path.join(tmp, "p")], check=True)
    ims = [Image.open(os.path.join(tmp, f)).convert("RGB") for f in sorted(os.listdir(tmp)) if f.endswith(".jpg")]
    ims[0].save(dst, "PDF", resolution=dpi, save_all=True, append_images=ims[1:])
    shutil.rmtree(tmp)


def _pages(pdf):
    out = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout
    return int([l for l in out.splitlines() if l.startswith("Pages:")][0].split()[1])


def main():
    slugs = [a for a in sys.argv[1:] if not a.startswith("--")]
    forms = _load("forms.json")
    orig = _load("forms_orig.json")
    os.makedirs(os.path.join(PUB, "v2"), exist_ok=True)
    short_changed = False
    for slug in slugs:
        m, bk, path = build(slug, OUT)
        pdf = render(path, OUT)
        blank = [p.name for (st, lg), p in bk.pages.items() if st == "blank"]
        pp = None
        xl = getattr(m, "XLSX", True)        # 📄 G668 새 서식은 False — 빈 틀 엑셀을 주지 않음(소장님 11-13 「빈엑셀 주면 다운 받아서 사용하면 땡 이잖아」)
        if m.WHERE != "orig":
            pp = os.path.join(PUB, "v2", f"{m.SLUG}.pdf")
            _print_pdf(path, blank, pp)
            if not xl:
                글pdf = pp + ".글.pdf"
                shutil.move(pp, 글pdf)
                _그림pdf(글pdf, pp)
                os.remove(글pdf)
        spec_prev = m.PREV
        if spec_prev is None:            # 틀 그대로(gen) 서식 — 빈 서식 쪽수 다음이 작성 예시
            bp = _pages(pp)
            spec_prev = [(1, "빈 서식"), (bp + 1, "작성 예시")]
        prev, cap = [], []
        for i, (pg, c) in enumerate(spec_prev, 1):
            dst = os.path.join(PUB, "v2", f"{m.SLUG}-{i}.webp")
            size = _webp(pdf, pg, dst)
            prev.append(f"/forms/v2/{m.SLUG}-{i}.webp")
            cap.append(c)
            print(f"   그림 {os.path.basename(dst)} {size} {os.path.getsize(dst)//1024}KB — {c}")
        if m.WHERE == "orig":
            dst = os.path.join(PUB, "orig", f"{m.SLUG}.xlsx")
            격자.export(m.SLUG, None, blank_xlsx=True)     # ✍️ G361 사이트 «종이에 바로 쓰기» JSON(/forms/g) + 빈 틀 엑셀(수식 · 작성 예시 없이) — 소장님 고르심 «빈 틀만 엑셀»
            f = next(x for x in orig["forms"] if x["slug"] == m.SLUG)
            f["re"] = True
            f["kb"] = round(os.path.getsize(dst) / 1024)
            f["pages"] = m.PAGES
            f["sheets"] = m.NSHEETS
            f["prev"], f["prevcap"] = prev, cap
            if getattr(m, "SHORT", None):
                f["short"] = m.SHORT
            if getattr(m, "NOTE", None) is not None:
                f["note"] = m.NOTE
        else:
            dst = os.path.join(PUB, f"{m.SLUG}.xlsx")
            if xl:
                격자.export(m.SLUG, None, blank_xlsx=True)     # ✍️ G361 (위와 같음) — 수식 · 작성 예시가 든 엑셀은 사이트에 두지 않음
            else:
                dst, _ = 격자.export(m.SLUG, None, blank_xlsx=False)   # 📄 G668 — 사이트 «종이에 바로 쓰기» JSON 만(엑셀 파일은 안 올림)
                if os.path.exists(os.path.join(PUB, f"{m.SLUG}.xlsx")):
                    os.remove(os.path.join(PUB, f"{m.SLUG}.xlsx"))
            f = next(x for x in forms["forms"] if x["slug"] == m.SLUG)
            f["gen"] = "forms2"
            if xl:
                f.pop("noxlsx", None)
            else:
                f["noxlsx"] = True
            f["prev"], f["prevcap"] = prev, cap
            f["pdf"] = f"/forms/v2/{m.SLUG}.pdf"
            print(f"   인쇄용 PDF {os.path.basename(pp)} {_pages(pp)}쪽 {os.path.getsize(pp)//1024}KB")
            if getattr(m, "SHORT", None) and f.get("short") != m.SHORT:
                f["short"] = m.SHORT
                short_changed = True
            for old, new in (getattr(m, "NOTE_REPLACE", None) or {}).items():
                if old in f["notes"]:
                    f["notes"][f["notes"].index(old)] = new
                else:                    # 이미 바꾼 서식을 다시 올릴 때
                    assert new in f["notes"], (m.SLUG, old)
        print(f"✅ {m.SLUG} → {os.path.relpath(dst, ROOT)} ({os.path.getsize(dst)//1024}KB)")
    _save("forms.json", forms)
    _save("forms_orig.json", orig)
    # 🖼 서식 목록 카드용 작은 그림(G103) — prev 첫 장으로
    import thumbs
    for f in thumbs.forms():
        if f["slug"] in slugs:
            thumbs.make(f)
    thumbs.check()
    # 🔎 G668 — 새 서식(forms-min.json 에 아직 없는 slug)도 다시 씀: short 가 처음부터 같으면 short_changed 가 안 서서
    #    빠른 찾기 · 설계변경 · 내역서 탭에 새 서식이 안 나왔음(시험_빠른찾기 «서식 탭 N가지가 모두 찾기 목록에» 가 잡음)
    try:
        _mini_now = json.loads(open(os.path.join(DATA, "forms-min.json"), "rb").read().decode("utf-8"))
    except Exception:
        _mini_now = {}
    if any(s not in _mini_now for s in slugs if any(f["slug"] == s for f in forms["forms"])):
        short_changed = True
    if short_changed:
        mini = {f["slug"]: [f["title"], f.get("icon", ""), f.get("short", ""), f.get("group", "")] for f in forms["forms"]}
        open(os.path.join(DATA, "forms-min.json"), "w", encoding="utf-8").write(json.dumps(mini, ensure_ascii=False))
        print("   forms-min.json 다시 씀")


if __name__ == "__main__":
    main()
