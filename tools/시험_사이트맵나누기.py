# -*- coding: utf-8 -*-
"""🔎 G755 (2026-11-17 소장님 「전부 늘려」) 사이트맵 나누기 시험 — 공고 · 업체가 수만 장이 되어 한 파일 한도(구글 5만 줄 · 50MB)를 넘지 않게
  · 한 파일 줄 수(SITEMAP_PER_FILE)를 넘으면 sitemap-corp.xml(앞) · sitemap-corp-2.xml … 로 나눔 · 목차(sitemap.xml)가 모두 가리킴
  · 지난 회차의 옛 조각(sitemap-corp-9.xml)은 지움 · 업체는 낙찰 1건 이상 전부 · 기관은 개찰 1건 이상 전부
  · 기준 값: build_json CORP_TOP_MIN 1 · prerender N_NOTICE · N_CORP ≥ 사이트맵 값(안 구운 주소 안 냄)
돌리기: python tools/시험_사이트맵나누기.py"""
import os, sys, json, re, shutil, tempfile, importlib, io, contextlib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
os.environ["SITEMAP_PER_FILE"] = "1000"
n = bad = 0


def ok(m, c, more=""):
    global n, bad
    n += 1
    if not c:
        bad += 1
    print(("  ✓ " if c else "  ✗ ") + m + ("" if c else f" = {more}"))


S = importlib.import_module("sitemap")
P = importlib.import_module("prerender")
B = open(os.path.join(ROOT, "build_json.py"), encoding="utf-8").read()
print("① 기준 값")
ok("build_json CORP_TOP_MIN 1 · CORP_TOP 100,000", re.search(r"^CORP_TOP_MIN = 1\b", B, re.M) is not None and re.search(r"^CORP_TOP = 100000\b", B, re.M) is not None)
ok("사이트맵 업체 · 공고 ≤ 굽는 수(안 구운 주소 안 냄)", S.CORP <= P.N_CORP and S.NOTICE <= P.N_NOTICE, (S.CORP, P.N_CORP, S.NOTICE, P.N_NOTICE))
ok("사이트맵 업체 기준 1건 · 기관 기준 1건 = prerender 와 같음", S.MIN_CORP == 1 and S.MIN_ROWS == P.AG_INDEX_MIN == 1, (S.MIN_CORP, S.MIN_ROWS, P.AG_INDEX_MIN))

print("② 나누기 (가짜 자료 · 진짜 web/public 은 안 건드림)")
tmp = tempfile.mkdtemp(prefix="g755sm-")
try:
    os.makedirs(os.path.join(tmp, "data", "corp"))
    os.makedirs(os.path.join(tmp, "data", "agency"))
    top = [[f"시험업체{i:05d}", (i % 5) + 1, i // 200, f"시험업체{i:05d}"] for i in range(2500)]   # 낙찰 1 ~ 5건 섞음
    with open(os.path.join(tmp, "data", "corp", "top.json"), "w", encoding="utf-8") as f:
        json.dump(top, f, ensure_ascii=False)
    with open(os.path.join(tmp, "data", "agency", "names.json"), "w", encoding="utf-8") as f:
        json.dump([["가 기관", 1, 1], ["나 기관", 0, 1], ["다 기관", 7, 2]], f, ensure_ascii=False)
    with open(os.path.join(tmp, "data", "agency", "top.json"), "w", encoding="utf-8") as f:
        json.dump([["다 기관", 7, 2]], f, ensure_ascii=False)
    with open(os.path.join(tmp, "sitemap-corp-9.xml"), "w", encoding="utf-8") as f:
        f.write("옛 조각")
    S.OUT, S.DATA = tmp, os.path.join(tmp, "data")
    with contextlib.redirect_stdout(io.StringIO()):
        S.main()
    files = sorted(fn for fn in os.listdir(tmp) if fn.startswith("sitemap") and fn.endswith(".xml"))
    corpfiles = [fn for fn in files if fn.startswith("sitemap-corp")]
    ok("업체 2,500 + 기관 2 → corp 세 조각(1,000 · 1,000 · 502)", corpfiles == ["sitemap-corp-2.xml", "sitemap-corp-3.xml", "sitemap-corp.xml"], files)
    idx = open(os.path.join(tmp, "sitemap.xml"), encoding="utf-8").read()
    ok("목차가 세 조각을 다 가리킴", all(f"k-conmap.com/{fn}</loc>" in idx for fn in corpfiles), idx[:300])
    ok("옛 조각(sitemap-corp-9.xml) 지움", "sitemap-corp-9.xml" not in files)
    cnt = {fn: open(os.path.join(tmp, fn), encoding="utf-8").read().count("<url>") for fn in corpfiles}
    ok("조각마다 1,000 줄 넘지 않음 · 합 2,502", max(cnt.values()) <= 1000 and sum(cnt.values()) == 2502, cnt)
    allxml = "".join(open(os.path.join(tmp, fn), encoding="utf-8").read() for fn in corpfiles)
    ok("낙찰 1건 업체도 들어감(시험업체00000)", "/corp/%EC%8B%9C%ED%97%98%EC%97%85%EC%B2%B400000<" in allxml)
    ok("기관: 개찰 1건 이상(가 · 다)만 · 0건(나) 빠짐", "/agency/%EA%B0%80%20%EA%B8%B0%EA%B4%80<" in allxml and "/agency/%EB%8B%A4%20%EA%B8%B0%EA%B4%80<" in allxml and "/agency/%EB%82%98%20%EA%B8%B0%EA%B4%80<" not in allxml)
    for fn in files:
        x = open(os.path.join(tmp, fn), encoding="utf-8").read()
        if fn != "sitemap.xml" and not x.lstrip().startswith("<?xml") :
            ok(f"{fn} 이 XML", False, x[:60])
    ok("모든 조각이 XML 머리로 시작", all(open(os.path.join(tmp, fn), encoding="utf-8").read().startswith("<?xml") for fn in files))
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print(f"\n{'❌' if bad else '✅'} 시험_사이트맵나누기 {n - bad}/{n}")
sys.exit(1 if bad else 0)
