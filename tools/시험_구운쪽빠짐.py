# -*- coding: utf-8 -*-
"""🔎 G640 (2026-11-10) 화면마다 «검색용 구운 쪽 · 사이트맵» 이 있나 — python tools/시험_구운쪽빠짐.py

소장님: 「건설맵에 잇는 모든 건 페이지 만들고, 검색되게 해줘」
  → main.jsx 의 고정 길(:값 없는 것)은 모두 ① prerender.py 가 굽고(구운 쪽 = 구글 · 네이버가 읽는 글) ② sitemap.py 가 냄 —
    아니면 아래 «뺌» 에 까닭과 함께. 새 화면을 만들고 구운 쪽 · 사이트맵을 빠뜨리면 여기서 막힘(재발 막기).
  · /tools/{slug} 는 tools.json 의 도구면 두 파일이 저절로 냄(그 목록으로 셈).
  · 사이트 안 🔎 찾기 쪽은 tools/시험_빠른찾기.mjs 가 봄(같은 꼴).
  ⚠️ 11-10 점검에서 빠져 있던 것: 용역 바로투찰(/svc/calc) · 물품 바로투찰(/goods/calc) 구운 쪽 · 사이트맵, 광고 · 제휴 안내(/ad) 사이트맵.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bad, n = 0, 0


def ok(name, cond, got=None):
    global bad, n
    n += 1
    if not cond:
        bad += 1
    print(("  ✓ " if cond else "  ✗ ") + name + ("" if cond or got is None else f" = {got}"))


def 읽(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


# 일부러 검색에 안 내는 길 — 까닭을 꼭 적음
뺌 = {
    "/calc": "바로투찰(/)과 같은 화면",
    "/svc/live": "용역 공고(/svc)와 같은 화면",
    "/goods/live": "물품 공고(/goods)와 같은 화면",
    "/report": "/ 로 넘김(2026-09-19 내림)",
    "/report/make": "소장님만(성적표 만들기)",
    "/report/agency": "소장님만(기관 보고서)",
    "/admin": "관리자",
    "/jeoksan/lab": "소장님 실험실(열쇠말)",
    "/tools/tuipbi/v": "업체가 받은 링크로만 여는 화면",
    "/jeoksan/fill": "시험판 · 사이트 전체 하루 10건 한도 — 화면이 noindex(JeoksanFill.jsx · 2026-09-23 · 09-27)",
    "/my": "내 기기 자료만 보이는 개인 화면 — noindex(공개 명함 /@이름 은 sitemap-my 로 냄)",
}

main = 읽("web/src/main.jsx")
pr = 읽("prerender.py")
sm = 읽("sitemap.py")
T = json.loads(읽("web/src/data/tools.json"))
도구 = {"/tools/" + t["slug"] for t in (T.get("tools") or [])}

길 = sorted({p for p in re.findall(r'<Route\s+path="([^"]+)"', main) if ":" not in p and p != "*"})
print(f"① main.jsx 고정 길 {len(길)}곳")
ok("고정 길이 80곳 넘게 읽힘", len(길) >= 80, len(길))

있다 = lambda 글, p: (f'"{p}"' in 글) or (f"'{p}'" in 글)
빠진구움, 빠진맵 = [], []
for p in 길:
    if p in 뺌:
        continue
    if p in 도구:
        continue   # tools.json 도구 — prerender · sitemap 이 같은 목록으로 냄
    if not 있다(pr, p):
        빠진구움.append(p)
    if not 있다(sm, p) and ("{SITE}" + p + "<") not in sm and p != "/":   # f"{SITE}/lic</loc>" 꼴로 내는 것도 셈
        빠진맵.append(p)
ok("② 모든 고정 길이 prerender.py 에(구운 쪽) — 아니면 «뺌» 에 까닭", not 빠진구움, 빠진구움)
ok("③ 모든 고정 길이 sitemap.py 에(사이트맵) — 아니면 «뺌» 에 까닭", not 빠진맵, 빠진맵)
남은뺌 = [p for p in 뺌 if p not in 길]
ok("④ «뺌» 에 이제 없는 길이 남지 않음", not 남은뺌, 남은뺌)
# ⑤ G640 이 넣은 것 — 구운 쪽 TABS · 사이트맵 STATIC · IndexNow STATIC_NEW 셋 다
for p in ("/svc/calc", "/goods/calc"):
    ok(f"⑤ {p} — TABS(제목 · 설명) · tab_body(본문) · 사이트맵 · IndexNow",
       re.search(r'\(\s*"' + re.escape(p) + r'",\s*"[^"]+\| K-건설맵"', pr) is not None
       and f'"{p}": lead_card(' in pr and f'("{p}", "' in sm
       and re.search(r"STATIC_NEW = \[[^\]]*\"" + re.escape(p) + '"', pr, re.S) is not None)
ok('⑤ /ad — 사이트맵에', '("/ad", "' in sm)
# ⑥ 새 글에 «무료» 를 쓰지 않음(소장님 2026-10-24) — G640 이 넣은 줄
g640 = [l for l in (pr + sm).splitlines() if "G640" in l or "/svc/calc" in l or "/goods/calc" in l]
ok("⑥ G640 이 넣은 글에 «무료» 없음", not any("무료" in l for l in g640))

# ⑦ G640 소장님 「최대한 늘려」 — 발주기관 장: 이름 목록 전부 · 3건 미만은 굽되 noindex · 사이트맵은 3건 이상만
print("⑦ 발주기관 장 늘리기(가짜 자료)")
sys.path.insert(0, ROOT)
import importlib
import shutil
import tempfile
P = importlib.import_module("prerender")
목록 = [["가 기관", 5, 1], ["나/기관", 9, 2], ["다 기관", 2, 3], ["가 기관", 5, 1], ["라 기관", 100, 4], ["마 기관", 3, 4]]
rows = P.agency_rows(목록, [["탑기관", 300, 7]])
ok("agency_rows — 건수 많은 차례 · 같은 이름 한 번 · 파일 이름 못 쓰는 이름(/) 뺌",
   [r[0] for r in rows] == ["라 기관", "가 기관", "마 기관", "다 기관"], rows)
ok("agency_rows — names.json 이 없으면 top.json(앞 300)", P.agency_rows([], [["탑기관", 300, 7]]) == [("탑기관", 300, 7)])
h = P.noindex_html("<html><head><title>t</title></head><body>b</body></html>")
ok("noindex_html — 머리에 robots noindex 한 줄 · 본문 그대로", h.count('name="robots" content="noindex"') == 1 and "<body>b</body>" in h)
ok("검색에 내는 기준 3건(AGENCY_INDEX_MIN) · 굽는 최대 2만(PRERENDER_AGENCY_ALL)", P.AG_INDEX_MIN == 3 and P.AG_BAKE_MAX >= 6000, [P.AG_INDEX_MIN, P.AG_BAKE_MAX])
pr_src = 읽("prerender.py")
ok("굽기 — 3건 미만은 noindex_html · 이상은 ag_done(IndexNow «agency» 회차마다)",
   "if ag_cnt.get(nm, 0) < AG_INDEX_MIN:" in pr_src and 'indexnow.take_once("agency", ag_paths)' in pr_src and 'ag_list = agency_rows(load("agency/names.json") or [], top)' in pr_src)
# 사이트맵 — 가짜 data 로 sitemap.main() 을 돌려 /agency/ 주소를 셈(진짜 web/public 은 건드리지 않음)
tmp = tempfile.mkdtemp(prefix="g640sm-")
try:
    os.makedirs(os.path.join(tmp, "data", "agency"))
    with open(os.path.join(tmp, "data", "agency", "names.json"), "w", encoding="utf-8") as f:
        json.dump(목록, f, ensure_ascii=False)
    with open(os.path.join(tmp, "data", "agency", "top.json"), "w", encoding="utf-8") as f:
        json.dump([["라 기관", 100, 4]], f, ensure_ascii=False)
    import io, contextlib
    S = importlib.import_module("sitemap")
    S.OUT, S.DATA = tmp, os.path.join(tmp, "data")
    with contextlib.redirect_stdout(io.StringIO()):
        S.main()
    xml = ""
    for fn in os.listdir(tmp):
        if fn.startswith("sitemap") and fn.endswith(".xml"):
            xml += open(os.path.join(tmp, fn), encoding="utf-8").read()
    from urllib.parse import unquote
    ag = sorted(unquote(u) for u in re.findall(r"<loc>[^<]*/agency/([^<]+)</loc>", xml))
    ok("사이트맵 — names.json 전부에서 3건 이상만(라 · 가 · 마) · 2건(다) · 못 쓰는 이름(나/) 빠짐 · 겹침 없음",
       ag == sorted(["라 기관", "가 기관", "마 기관"]), ag)
    ok("사이트맵 — 용역 · 물품 바로투찰 · 광고 안내 주소", all(f"k-conmap.com{p}</loc>" in xml for p in ("/svc/calc", "/goods/calc", "/ad")))
finally:
    shutil.rmtree(tmp, ignore_errors=True)

print(f"\n{'✅' if not bad else '❌'} 시험_구운쪽빠짐 {n - bad}/{n}")
sys.exit(1 if bad else 0)
