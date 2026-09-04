# -*- coding: utf-8 -*-
"""
sitemap.py — 검색엔진에 넘길 주소 목록을 만든다.

주의(사라사에서 배운 것):
  신생 사이트에 URL 수천 개를 한꺼번에 던지면 «발견됨 - 색인 생성 안 됨» 만
  잔뜩 쌓입니다. 크롤 예산이 부족해서입니다.
  그래서 처음에는 데이터가 많은 기관 위주로 LIMIT 개만 싣고,
  색인이 붙는 것을 보면서 LIMIT 을 천천히 올리는 방식을 씁니다.
"""
import os
import json
from datetime import datetime
from urllib.parse import quote

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "web", "public")
DATA = os.path.join(OUT, "data")

SITE = os.environ.get("SITE_URL", "https://k-conmap.web.app").rstrip("/")
LIMIT = int(os.environ.get("SITEMAP_AGENCIES", "800"))   # 색인 상황 보며 올릴 것
CORP = int(os.environ.get("SITEMAP_CORPS", "300"))       # 업체도 천천히 — 처음엔 300곳만
MIN_ROWS = 15                                            # 얄팍한 페이지는 아예 넣지 않음
MIN_CORP = 8                                             # 낙찰 8건 미만 업체는 넣지 않음

STATIC = [("/", "1.0", "hourly"), ("/first", "0.9", "hourly"), ("/live", "0.9", "hourly"),
          ("/calc", "0.8", "weekly"), ("/analysis", "0.8", "weekly"),
          ("/jobs", "0.7", "daily"), ("/about", "0.3", "monthly"),
          ("/privacy", "0.2", "yearly"), ("/contact", "0.3", "yearly")]


def main():
    today = datetime.now().strftime("%Y-%m-%d")
    urls = [f"  <url><loc>{SITE}{p}</loc><lastmod>{today}</lastmod>"
            f"<changefreq>{cf}</changefreq><priority>{pr}</priority></url>"
            for p, pr, cf in STATIC]

    top_path = os.path.join(DATA, "agency", "top.json")
    n_ag = 0
    if os.path.exists(top_path):
        with open(top_path, encoding="utf-8") as f:
            top = json.load(f)
        for name, cnt, _chunk in top:
            if cnt < MIN_ROWS or n_ag >= LIMIT:
                continue
            urls.append(
                f"  <url><loc>{SITE}/agency/{quote(name, safe='')}</loc>"
                f"<lastmod>{today}</lastmod><changefreq>weekly</changefreq>"
                f"<priority>0.6</priority></url>")
            n_ag += 1
    else:
        print("  ⚠️  agency/top.json 이 없습니다 — build_json.py 를 먼저 돌리세요")

    # ── 업체 ────────────────────────────────────────────────────────
    #  ★ 2026-09-04 — 「○○건설 낙찰 실적」 을 찾는 사람이 들어올 문입니다.
    #    ⚠️ 여기 낸 주소는 prerender.py 가 «진짜 HTML» 로 구워 둔 것이어야 합니다.
    #       안 구우면 크롤러에게 전부 같은 빈 껍데기로 보여 색인이 안 붙습니다
    #       (2026-09-04 에 실측으로 확인한 사고). 그래서 SITEMAP_CORPS 는
    #       PRERENDER_CORP 보다 크면 안 됩니다.
    ctop_path = os.path.join(DATA, "corp", "top.json")
    n_co = 0
    if os.path.exists(ctop_path):
        with open(ctop_path, encoding="utf-8") as f:
            ctop = json.load(f)
        for row in ctop:
            key, cnt = row[0], row[1]
            if cnt < MIN_CORP or n_co >= CORP:
                continue
            urls.append(
                f"  <url><loc>{SITE}/corp/{quote(key, safe='')}</loc>"
                f"<lastmod>{today}</lastmod><changefreq>weekly</changefreq>"
                f"<priority>0.5</priority></url>")
            n_co += 1
    else:
        print("  ⚠️  corp/top.json 이 없습니다 — build_json.py 를 먼저 돌리세요")

    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(urls) + "\n</urlset>\n")

    p = os.path.join(OUT, "sitemap.xml")
    with open(p, "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"  ✅ sitemap.xml — 고정 {len(STATIC)} + 기관 {n_ag} + 업체 {n_co} = {len(urls)}개")
    print(f"     {p}")


if __name__ == "__main__":
    main()
