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
import sys
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

# (2026-09-06) /calc 를 뺐습니다. 라우터에서 «/» 와 같은 화면(BaroBid)이라
#    서버가 돌려주는 문서가 홈과 **바이트까지 같습니다**(실측 2,853B · canonical 도 «/»).
#    사이트맵에 내면 구글이 «대표 페이지가 따로 있는 중복» 으로 세기만 합니다.
STATIC = [("/", "1.0", "hourly"), ("/first", "0.9", "hourly"), ("/live", "0.9", "hourly"),
          ("/analysis", "0.8", "weekly"),
          ("/jobs", "0.7", "daily"), ("/about", "0.3", "monthly"),
          ("/privacy", "0.2", "yearly"), ("/terms", "0.2", "yearly"), ("/contact", "0.3", "yearly"),
          ("/daily", "0.8", "daily"), ("/forms", "0.8", "monthly"),
          ("/cad", "0.8", "monthly"),
          # 📄 2026-09-18 — PDF 도구. 라우트·prerender 와 «셋이 같이» 있어야 soft 404 가 안 납니다.
          ("/pdf", "0.9", "monthly"),
          ("/naeyeok", "0.9", "monthly"), ("/qna", "0.7", "daily"),
          # 📉 2026-09-18 — 내역서 비율 맞추기. 라우트·prerender 와 «셋이 같이» 있어야 합니다.
          ("/naeyeok/ratio", "0.9", "monthly"),
          ("/how", "0.8", "monthly"),   # ⚠️ /report 는 2026-09-19 에 내렸습니다(주소만 살아 있음)
          # 2026-09-17 — /jeoksan/run 은 잠겼지만 «무엇이 나오는지» 는 누구나 봅니다.
          #   (소장님: 「보여는 주되, 비번을 사용하게 하면 돼지 않아?」) 그래서 다시 냅니다.
          ("/jeoksan", "0.8", "monthly"), ("/jeoksan/run", "0.8", "monthly"),
          ("/safety", "0.9", "monthly"),
          ("/shareone", "0.8", "monthly")]

# 건설 서식 — 변하지 않는 자료라 changefreq 는 yearly.
# ⚠️ prerender.py 가 forms.json 의 서식을 «전부» 굽습니다. 그래서 여기서도 전부 냅니다
#    (사이트맵이 미리 구운 것보다 많으면 안 된다는 규칙을 지키려면 같은 파일을 봐야 합니다).
FORMS_JSON = os.path.join(ROOT, "web", "src", "data", "forms.json")
FORMS_ORIG_JSON = os.path.join(ROOT, "web", "src", "data", "forms_orig.json")   # 현장 실무 서식 (2026-09-24)
# 캐드 유틸 — 서식과 같은 이유로 여기서도 prerender 와 「같은 파일」 을 봅니다.
CAD_JSON = os.path.join(ROOT, "web", "src", "data", "cad.json")
CHANGE_JSON = os.path.join(ROOT, "web", "src", "data", "change.json")
# 입찰 알아보기 — 이 사이트가 직접 잰 실측으로 쓴 글 (2026-09-06)
GUIDE_JSON = os.path.join(ROOT, "web", "src", "data", "guide.json")
# 🧰 건설 도구 — prerender.py 가 tools.json 의 도구를 «전부» 굽습니다 (2026-09-14).
#    그래서 여기서도 같은 파일을 봅니다 — 사이트맵이 구운 것보다 많으면 안 됩니다.
TOOLS_JSON = os.path.join(ROOT, "web", "src", "data", "tools.json")
WONCLICK_JSON = os.path.join(ROOT, "web", "src", "data", "wonclick.json")   # ⚡ 공사서류 원클릭 (2026-09-24)

# 「어제의 개찰 성적표」 — 날짜마다 한 장. 지나가면 안 변하므로 changefreq 는 monthly.
# ⚠️ prerender.py 의 PRERENDER_DAILY 보다 크면 안 됩니다 — 안 구운 주소를 내면
#    크롤러가 다시 빈 껍데기를 봅니다 (업체·공고에서 겪은 것과 같은 함정).
DAILY = int(os.environ.get("SITEMAP_DAILY", "45"))


def _mtime(path, fallback):
    """파일이 바뀐 날. 없으면 fallback."""
    try:
        return datetime.fromtimestamp(os.path.getmtime(path)).strftime("%Y-%m-%d")
    except Exception:
        return fallback


def _day(v, fallback=None):
    """'2026-09-04 15:00:00' · '20260904' -> '2026-09-04'"""
    d = "".join(ch for ch in str(v or "") if ch.isdigit())
    return f"{d[0:4]}-{d[4:6]}-{d[6:8]}" if len(d) >= 8 else fallback


def main():
    today = datetime.now().strftime("%Y-%m-%d")
    # ★ 2026-09-06 - lastmod 가 1,276개 **전부 오늘** 이었습니다(실측).
    #   하루 21번 굽는 사이트라 모든 주소가 매번 «오늘 바뀌었다» 고 말합니다.
    #   구글은 이런 lastmod 를 «믿을 수 없는 신호» 로 보고 통째로 무시합니다.
    #   -> 실제로 바뀐 날을 씁니다. 기관·업체 페이지는 집계(build_json)를 다시 돌려야
    #     내용이 바뀌므로 overview.json 의 built 날짜가 정확합니다.
    _built = today
    try:
        with io.open(os.path.join(DATA, "overview.json"), encoding="utf-8") as f:
            _built = _day(json.load(f).get("built"), today) or today
    except Exception:
        pass
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
                f"<lastmod>{_built}</lastmod><changefreq>weekly</changefreq>"
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
                f"<lastmod>{_built}</lastmod><changefreq>weekly</changefreq>"
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
    # ★ 2026-09-06 — 「내역서가 붙은 공고」를 앞세웁니다.
    #   소장님: 「내역서 검색은 경쟁률이 별로 없잖아. 반드시 검색되게 만들어야 해」
    #   「○○공사 설계내역서」 는 경쟁이 옅은 검색어인데, 그 말이 들어간 페이지는
    #   붙임이 있는 공고뿐입니다. 최신순으로만 내면 그 페이지들이 뒤로 밀립니다.
    #   ⚠️ 없는 것을 내면 안 되므로, collect.py 가 낸 목록에 실제로 있는 공고만 봅니다.
    ny_no = set()
    for fn_ in ("naeyeok.json", "naeyeok-all.json"):
        p3 = os.path.join(DATA, fn_)
        if not os.path.exists(p3):
            continue
        try:
            with open(p3, encoding="utf-8") as f:
                d3 = json.load(f) or {}
            i3 = (d3.get("f") or []).index("no")
            for row in d3.get("r") or []:
                ny_no.add(str(row[i3]))
        except Exception:
            pass
    if ny_no:
        print(f"  · 내역서가 붙은 공고 {len(ny_no):,}건을 사이트맵 앞쪽에 둡니다")

    def _rank(r):
        # 내역서가 붙은 것 먼저, 그 안에서 최신부터
        return (0 if str(r.get("no") or "") in ny_no else 1,
                [-ord(c) for c in str(r.get("dt") or r.get("close") or "")])

    for r in sorted(rows.values(), key=_rank):
        if n_no >= NOTICE:
            break
        no = str(r.get("no") or "")
        if not no or not all(c.isalnum() or c == "-" for c in no):
            continue
        # 개찰이 끝난 공고는 그 뒤로 안 바뀝니다 - 개찰일을 그대로 씁니다.
        # 마감 전 공고는 기초금액·A값이 늦게 채워지므로 오늘로 둡니다.
        _lm = (_day(r.get("dt"), today) if r.get("win") else today)
        urls.append(
            f"  <url><loc>{SITE}/notice/{quote(no, safe='')}</loc>"
            f"<lastmod>{_lm}</lastmod>"
            f"<changefreq>{'yearly' if r.get('win') else 'daily'}</changefreq>"
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
        # 그 날의 개찰만 담긴 장이라, 지나간 날짜는 다시 안 바뀝니다.
        urls.append(f"  <url><loc>{SITE}/daily/{d}</loc>"
                    f"<lastmod>{today if d >= today else d}</lastmod>"
                    f"<changefreq>{'daily' if d >= today else 'yearly'}</changefreq>"
                    f"<priority>0.6</priority></url>")
        n_dy += 1

    # ── 캐드 유틸 ─────────────────────────────────
    n_cd = 0
    try:
        with io.open(CAD_JSON, encoding="utf-8") as f:
            for c in (json.load(f) or {}).get("cmds") or []:
                urls.append(f'  <url><loc>{SITE}/cad/{quote(c["slug"], safe="")}</loc>'
                            f'<lastmod>{_mtime(CAD_JSON, today)}</lastmod>'
                            f'<changefreq>monthly</changefreq><priority>0.6</priority></url>')
                n_cd += 1
    except Exception as e:
        print(f"  · 캐드 명령 목록을 못 읽었습니다 ({type(e).__name__}) — 건너뜁니다")

    # ── 건설 서식 ─────────────────────────────────
    n_fm = 0
    try:
        with io.open(FORMS_JSON, encoding="utf-8") as f:
            for fm in (json.load(f) or {}).get("forms") or []:
                urls.append(f'  <url><loc>{SITE}/forms/{quote(fm["slug"], safe="")}</loc>'
                            f'<lastmod>{_mtime(FORMS_JSON, today)}</lastmod>'
                            f'<changefreq>yearly</changefreq><priority>0.6</priority></url>')
                n_fm += 1
    except Exception as e:
        print(f"  · 서식 목록을 못 읽었습니다 ({type(e).__name__}) — 서식 주소는 건너뜁니다")
    # 현장 실무 서식 — prerender.py 가 전부 굽습니다
    try:
        with io.open(FORMS_ORIG_JSON, encoding="utf-8") as f:
            for fm in (json.load(f) or {}).get("forms") or []:
                urls.append(f'  <url><loc>{SITE}/forms/{quote(fm["slug"], safe="")}</loc>'
                            f'<lastmod>{_mtime(FORMS_ORIG_JSON, today)}</lastmod>'
                            f'<changefreq>yearly</changefreq><priority>0.6</priority></url>')
                n_fm += 1
    except Exception as e:
        print(f"  · 현장 실무 서식 목록을 못 읽었습니다 ({type(e).__name__}) — 건너뜁니다")

    # ── 설계변경 ─────────────────────────────────
    n_cg = 0
    try:
        with io.open(CHANGE_JSON, encoding="utf-8") as f:
            tops = (json.load(f) or {}).get("topics") or []
        # /change/excel — 통합 엑셀 전용 페이지. 「설계변경 내역서 엑셀」 검색을 받는 자리입니다.
        # 내역서 갈래마다 한 장 — 「공내역서 양식」 같은 낱말로 들어올 자리 (2026-09-06)
        # ⚠️ prerender.py 가 «자료가 있는 갈래만» 굽습니다. 여기서도 자료를 보고 냅니다 —
        #    안 구운 주소를 사이트맵에 내면 크롤러가 빈 껍데기를 봅니다 (실제 사고).
        ny = []
        try:
            with open(os.path.join(ROOT, "web", "public", "data", "naeyeok.json"),
                      encoding="utf-8") as f:
                ny = [k for k, n in ((json.load(f) or {}).get("all") or {}).items() if n]
        except Exception:
            ny = []
        for u in (["/change", "/change/excel", "/change/naeyeok", "/change/calc",
                   "/change/twoline"]
                  + [f"/change/naeyeok/{quote(k, safe='')}" for k in ny]
                  + [f'/change/{t["slug"]}' for t in tops]):
            urls.append(f'  <url><loc>{SITE}{u}</loc>'
                        f'<lastmod>{_mtime(CHANGE_JSON, today)}</lastmod>'
                        f'<changefreq>monthly</changefreq><priority>0.7</priority></url>')
            n_cg += 1
    except Exception as e:
        print(f"  · 설계변경 자료를 못 읽었습니다 ({type(e).__name__})")

    # ── 입찰 알아보기 ────────────────────────────
    #   ⚠️ prerender.py 가 guide.json 의 글을 «전부» 굽습니다 — 그래서 여기서도 같은 파일을 봅니다.
    n_gd = 0
    try:
        with io.open(GUIDE_JSON, encoding="utf-8") as f:
            gtops = (json.load(f) or {}).get("topics") or []
        for u in ["/guide"] + [f'/guide/{t["slug"]}' for t in gtops]:
            urls.append(f'  <url><loc>{SITE}{u}</loc>'
                        f'<lastmod>{_mtime(GUIDE_JSON, today)}</lastmod>'
                        f'<changefreq>monthly</changefreq><priority>0.7</priority></url>')
            n_gd += 1
    except Exception as e:
        print(f"  · 입찰 알아보기 자료를 못 읽었습니다 ({type(e).__name__})")

    # ── 건설 도구 ────────────────────────────────
    n_tl = 0
    try:
        with io.open(TOOLS_JSON, encoding="utf-8") as f:
            ttools = (json.load(f) or {}).get("tools") or []
        wc = ["/tools/wonclick"] if os.path.exists(WONCLICK_JSON) else []     # prerender.py 가 구울 때만
        # 📦 2026-09-25 — 도면 3D 보기 (prerender.py 가 늘 굽습니다)
        for u in ["/tools"] + [f'/tools/{t["slug"]}' for t in ttools] + wc + ["/tools/dxf3d", "/tools/dxfpdf", "/tools/dwgdxf", "/tools/tuipbi"]:
            urls.append(f'  <url><loc>{SITE}{u}</loc>'
                        f'<lastmod>{_mtime(TOOLS_JSON, today)}</lastmod>'
                        f'<changefreq>monthly</changefreq><priority>0.7</priority></url>')
            n_tl += 1
    except Exception as e:
        print(f"  · 도구 자료를 못 읽었습니다 ({type(e).__name__})")

    # ── 🪪 면허별 경쟁도 ──────────────────────────
    #    ⚠️ licstat.json 이 있을 때만 냅니다 — prerender.py 도 같은 파일이 있어야 굽습니다.
    #       안 구운 주소를 사이트맵에 내면 크롤러가 빈 껍데기를 봅니다(2026-09-04 교훈).
    n_lc = 0
    _lp = os.path.join(ROOT, "web", "public", "data", "licstat.json")
    if os.path.exists(_lp):
        urls.append(f'  <url><loc>{SITE}/lic</loc>'
                    f'<lastmod>{_mtime(_lp, today)}</lastmod>'
                    f'<changefreq>weekly</changefreq><priority>0.7</priority></url>')
        n_lc = 1

    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(urls) + "\n</urlset>\n")

    # ⚠️ 마지막 관문 — 주소가 하나라도 대표 호스트를 벗어나면 **쓰지 않고 멈춥니다.**
    bad = [u for u in urls if f"<loc>{SITE}/" not in u and f"<loc>{SITE}<" not in u]
    if bad:
        raise SystemExit(f"  ⛔ 사이트맵에 대표 주소({SITE}) 밖의 주소가 {len(bad)}개 "
                         f"있습니다 — 쓰지 않고 멈춥니다.\n     예: {bad[0].strip()[:120]}")

    # ══════════════════════════════════════════════════════════════
    # 🚦 2026-09-19 — 사이트맵을 «셋으로» 나눕니다 (서치콘솔 실측)
    #
    #   낸 것 1,360장 · 색인된 것 77장(5.7%)
    #   나머지 1,289장이 「발견됨 — 현재 색인이 생성되지 않음」 이었습니다.
    #   = 구글이 주소는 아는데 **읽으러 오지도 않았다**는 뜻입니다.
    #   새 도메인이 천 장 넘게 한 덩어리로 내밀면 구글이 «다 읽을 값어치가 있나» 하고 미룹니다.
    #   공고 한 건·업체 한 곳짜리 자동 생성 페이지가 대부분이라 더 그렇습니다.
    #
    #   → 팔릴 페이지(서식·도구·설계변경·알아보기)를 «작은 한 벌» 로 따로 냅니다.
    #     구글은 사이트맵 단위로 크롤 몫을 나누므로, 작은 쪽이 먼저 먹힙니다.
    #     sitemap.xml 은 셋을 가리키는 «목차»(sitemapindex)로 바뀝니다 —
    #     서치콘솔에 이미 낸 주소가 그대로라 다시 제출하지 않아도 자식들이 따라 들어갑니다.
    #
    #   ⚠️ 나누는 기준은 «주소» 하나로만 봅니다. 위쪽 모으는 코드는 건드리지 않습니다 —
    #      손대면 셈이 어긋납니다(줄마다 어느 통에 넣을지 적으면 새 갈래가 늘 때 또 빠집니다).
    # ══════════════════════════════════════════════════════════════
    def _갈래(u):
        if "/corp/" in u or "/agency/" in u:
            return "corp"
        if "/notice/" in u or "/daily" in u:
            return "bid"
        return "main"

    통 = {"main": [], "bid": [], "corp": []}
    for u in urls:
        통[_갈래(u)].append(u)

    def _쓰기(이름, 줄들):
        x = ('<?xml version="1.0" encoding="UTF-8"?>\n'
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
             + "\n".join(줄들) + "\n</urlset>\n")
        q = os.path.join(OUT, 이름)
        with open(q, "w", encoding="utf-8") as f:
            f.write(x)
        return q

    낸것 = []
    for 이름, 열쇠 in [("sitemap-main.xml", "main"), ("sitemap-bid.xml", "bid"),
                     ("sitemap-corp.xml", "corp")]:
        if 통[열쇠]:                      # 빈 사이트맵은 내지 않습니다 (빈 urlset 은 오류로 잡힙니다)
            _쓰기(이름, 통[열쇠])
            낸것.append((이름, len(통[열쇠])))

    목차 = ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "\n".join(f"  <sitemap><loc>{SITE}/{이름}</loc>"
                         f"<lastmod>{today}</lastmod></sitemap>" for 이름, _ in 낸것)
            + "\n</sitemapindex>\n")
    p = os.path.join(OUT, "sitemap.xml")
    with open(p, "w", encoding="utf-8") as f:
        f.write(목차)

    print(f"  ✅ 사이트맵 — 고정 {len(STATIC)} + 면허 {n_lc} + 기관 {n_ag} + 업체 {n_co}"
          f" + 공고 {n_no} + 성적표 {n_dy} + 서식 {n_fm} + 설계변경 {n_cg}"
          f" + 알아보기 {n_gd} + 도구 {n_tl} + 캐드 {n_cd} = {len(urls)}개")
    print("     sitemap.xml (목차) → " + " · ".join(f"{이름} {수:,}장" for 이름, 수 in 낸것))
    print(f"     {p}")


def stamp_cad_lisp():
    """캐드 유틸 리습에 「오늘 + 30일」 유효기간을 찍습니다.

    ⚠️ 왜 여기서 부르나 — npm run build 「바로 앞」에 도는 단계가 여기뿐입니다.
       (워크플로는 원격 도구로 못 고치는 보호 파일이라 그쪽에 줄을 넣을 수 없습니다)
       build 가 web/public 을 dist 로 옮기므로 반드시 그 전에 찍혀야 합니다.
    ⚠️ 실패해도 사이트맵·빌드를 멈추지 않습니다. 기한이 안 걸릴 뿐입니다.
    """
    try:
        sys.path.insert(0, os.path.join(ROOT, "tools"))
        import stamp_lisp
        stamp_lisp.main()
    except Exception as e:
        print(f"  · 캐드 유틸 유효기간을 못 찍었습니다 ({type(e).__name__}) — 그대로 갑니다")


if __name__ == "__main__":
    main()
    stamp_cad_lisp()
