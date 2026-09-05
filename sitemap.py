# -*- coding: utf-8 -*-
"""
sitemap.py — 검색엔진에 넘길 주소 목록을 만든다.

주의(사라사에서 배운 것):
  신생 사이트에 URL 수천 개를 한꺼번에 던지면 «발견됨 - 색인 생성 안 됨» 만
  잔뜩 쌓입니다. 크롤 예산이 부족해서입니다.
  그래서 처음에는 데이터가 많은 기관 위주로 LIMIT 개만 싣고,
  색인이 붙는 것을 보면서 LIMIT 을 천천히 올리는 방식을 씁니다.
"""
import io
import os
import json
from datetime import datetime
from urllib.parse import quote

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "web", "public")
DATA = os.path.join(OUT, "data")

# ⚠️ 2026-09-04 — 여기가 **k-conmap.web.app** 이었습니다. 사이트맵은 k-conmap.com 에
#   올라가는데 안의 주소는 web.app 이라, 구글이 «이 위치의 Sitemap 에 쓸 수 없는 URL»
#   이라며 **1,146개를 전부 거부**했습니다(서치콘솔 실측).
#   → 이제 **robots.txt 의 «Sitemap:» 줄**을 대표 주소의 «한 벌»로 삼습니다.
def _site_from_robots():
    try:
        with io.open(os.path.join(OUT, "robots.txt"), encoding="utf-8") as f:
            for line in f:
                if line.lower().startswith("sitemap:"):
                    return line.split(":", 1)[1].strip().rsplit("/", 1)[0]
    except Exception:
        pass
    return ""


_ROBOTS = _site_from_robots()
SITE = (os.environ.get("SITE_URL") or _ROBOTS or "https://k-conmap.com").rstrip("/")
if _ROBOTS and SITE != _ROBOTS:
    print(f"  ⚠️ 사이트맵 주소({SITE})가 robots.txt 가 알리는 주소({_ROBOTS})와 다릅니다 "
          f"— robots.txt 쪽으로 맞춥니다")
    SITE = _ROBOTS
LIMIT = int(os.environ.get("SITEMAP_AGENCIES", "800"))   # 색인 상황 보며 올릴 것
CORP = int(os.environ.get("SITEMAP_CORPS", "300"))       # 업체도 천천히 — 처음엔 300곳만
NOTICE = int(os.environ.get("SITEMAP_NOTICES", "500"))   # 공고·개찰. 매일 570건씩 느니 천천히
MIN_ROWS = 15                                            # 얄팍한 페이지는 아예 넣지 않음
MIN_CORP = 8                                             # 낙찰 8건 미만 업체는 넣지 않음

STATIC = [("/", "1.0", "hourly"), ("/first", "0.9", "hourly"), ("/live", "0.9", "hourly"),
          ("/calc", "0.8", "weekly"), ("/analysis", "0.8", "weekly"),
          ("/jobs", "0.7", "daily"), ("/about", "0.3", "monthly"),
          ("/privacy", "0.2", "yearly"), ("/contact", "0.3", "yearly"),
          ("/daily", "0.8", "daily"), ("/forms", "0.8", "monthly")]

# 건설 서식 — 변하지 않는 자료라 changefreq 는 yearly.
# ⚠️ prerender.py 가 forms.json 의 서식을 «전부» 굽습니다. 그래서 여기서도 전부 냅니다
#    (사이트맵이 미리 구운 것보다 많으면 안 된다는 규칙을 지키려면 같은 파일을 봐야 합니다).
FORMS_JSON = os.path.join(ROOT, "web", "src", "data", "forms.json")
CHANGE_JSON = os.path.join(ROOT, "web", "src", "data", "change.json")

# 「어제의 개찰 성적표」 — 날짜마다 한 장. 지나가면 안 변하므로 changefreq 는 monthly.
# ⚠️ prerender.py 의 PRERENDER_DAILY 보다 크면 안 됩니다 — 안 구운 주소를 내면
#    크롤러가 다시 빈 껍데기를 봅니다 (업체·공고에서 겪은 것과 같은 함정).
DAILY = int(os.environ.get("SITEMAP_DAILY", "45"))


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

    # ── 공고·개찰 ────────────────────────────────────────────────────
    #  ★ 2026-09-04 — 검색 수요가 가장 큰 자리. 그 공고에 투찰한 60~300개 업체가
    #     「결과 어떻게 됐지」를 찾습니다. 개찰이 하루 570건씩 늘어납니다.
    #     ⚠️ prerender.py 가 구운 것만 냅니다(PRERENDER_NOTICE). 최신부터 같은 순서입니다.
    n_no = 0
    store = os.path.join(ROOT, "data", "store")
    rows = {}
    fonly = {}          # 개찰만 — 「성적표」 날짜는 여기서만 셉니다
    for nm in ("live", "first"):
        p2 = os.path.join(store, f"{nm}.json")
        if os.path.exists(p2):
            try:
                with open(p2, encoding="utf-8") as f:
                    for v in json.load(f).values():
                        if isinstance(v, dict):
                            rows.update(v)
                            if nm == "first":
                                fonly.update(v)
            except Exception as e:
                print(f"  ⚠️  store/{nm}.json 읽기 실패 ({type(e).__name__})")
    for r in sorted(rows.values(), key=lambda r: str(r.get("dt") or r.get("close") or ""),
                    reverse=True):
        if n_no >= NOTICE:
            break
        no = str(r.get("no") or "")
        if not no or not all(c.isalnum() or c == "-" for c in no):
            continue
        urls.append(
            f"  <url><loc>{SITE}/notice/{quote(no, safe='')}</loc>"
            f"<lastmod>{today}</lastmod><changefreq>weekly</changefreq>"
            f"<priority>0.5</priority></url>")
        n_no += 1
    if not rows:
        print("  ⚠️  data/store 가 없어 공고 주소는 넣지 않았습니다")

    # ── 날짜별 개찰 성적표 ──
    # ⚠️ prerender.py 는 «개찰(first)» 의 날짜만 굽습니다. 여기서 live 까지 세면
    #    안 구운 주소를 사이트맵에 내게 됩니다 — 크롤러가 다시 빈 껍데기를 봅니다.
    seen = {}
    for r in fonly.values():
        d = str(r.get("dt") or "")[:10]
        if len(d) == 10 and d[4] == "-":
            seen[d] = seen.get(d, 0) + 1
    n_dy = 0
    for d in sorted(seen, reverse=True)[:DAILY]:
        urls.append(f"  <url><loc>{SITE}/daily/{d}</loc><lastmod>{today}</lastmod>"
                    f"<changefreq>monthly</changefreq><priority>0.6</priority></url>")
        n_dy += 1

    # ── 건설 서식 ─────────────────────────────────
    n_fm = 0
    try:
        with io.open(FORMS_JSON, encoding="utf-8") as f:
            for fm in (json.load(f) or {}).get("forms") or []:
                urls.append(f'  <url><loc>{SITE}/forms/{quote(fm["slug"], safe="")}</loc>'
                            f'<lastmod>{today}</lastmod>'
                            f'<changefreq>yearly</changefreq><priority>0.6</priority></url>')
                n_fm += 1
    except Exception as e:
        print(f"  · 서식 목록을 못 읽었습니다 ({type(e).__name__}) — 서식 주소는 건너뜁니다")

    # ── 설계변경 ─────────────────────────────────
    n_cg = 0
    try:
        with io.open(CHANGE_JSON, encoding="utf-8") as f:
            tops = (json.load(f) or {}).get("topics") or []
        for u in ["/change", "/change/calc"] + [f'/change/{t["slug"]}' for t in tops]:
            urls.append(f'  <url><loc>{SITE}{u}</loc><lastmod>{today}</lastmod>'
                        f'<changefreq>monthly</changefreq><priority>0.7</priority></url>')
            n_cg += 1
    except Exception as e:
        print(f"  · 설계변경 자료를 못 읽었습니다 ({type(e).__name__})")

    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(urls) + "\n</urlset>\n")

    # ⚠️ 마지막 관문 — 주소가 하나라도 대표 호스트를 벗어나면 **쓰지 않고 멈춥니다.**
    bad = [u for u in urls if f"<loc>{SITE}/" not in u and f"<loc>{SITE}<" not in u]
    if bad:
        raise SystemExit(f"  ⛔ 사이트맵에 대표 주소({SITE}) 밖의 주소가 {len(bad)}개 "
                         f"있습니다 — 쓰지 않고 멈춥니다.\n     예: {bad[0].strip()[:120]}")

    p = os.path.join(OUT, "sitemap.xml")
    with open(p, "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"  ✅ sitemap.xml — 고정 {len(STATIC)} + 기관 {n_ag} + 업체 {n_co}"
          f" + 공고 {n_no} + 성적표 {n_dy} + 서식 {n_fm} + 설계변경 {n_cg} = {len(urls)}개")
    print(f"     {p}")


if __name__ == "__main__":
    main()
