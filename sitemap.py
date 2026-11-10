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
LIMIT = int(os.environ.get("SITEMAP_AGENCIES", "20000"))   # 🔎 G640 (11-10 소장님 「최대한 늘려」) 800 → 20,000 — 이름 목록 전부(agency/names.json) · prerender AG_BAKE_MAX 와 같게
CORP = int(os.environ.get("SITEMAP_CORPS", "20000"))     # 업체도 천천히 — 처음엔 300곳 → 2026-09-30 1,000곳 → 🏢 G343 20,000(낙찰 3건 이상 전부 · PRERENDER_CORP 와 같게)
#   (소장님 「업체 실적페이지 … 필요한 것 지금 작업해줘」 — 페이지마다 투찰률 칸 · 순위 기록 · 상대 · 성적표 신청을 더한 뒤 올림.
#    서치콘솔에서 색인 비율을 보고 3,000(=PRERENDER_CORP)까지 한 단계씩. PRERENDER_CORP 보다 크면 안 됨)
NOTICE = int(os.environ.get("SITEMAP_NOTICES", "1000"))  # 공고·개찰. 매일 570건씩 느니 천천히 — 🔎 G621 (11-09 소장님 «우선 검색이 되게») 500 → 1,000 (PRERENDER_NOTICE 8,000 보다 작게)
MIN_ROWS = int(os.environ.get("AGENCY_INDEX_MIN", "3"))  # 🔎 G640 15 → 3 — 개찰 3건 미만 기관은 넣지 않음(prerender 가 그 장에 noindex · 같은 값)
MIN_CORP = 3                                             # 낙찰 3건 미만 업체는 넣지 않음 (🏢 G343 8 → 3 · build_json CORP_TOP_MIN 과 같게)

# (2026-09-06) /calc 를 뺐습니다. 라우터에서 «/» 와 같은 화면(BaroBid)이라
#    서버가 돌려주는 문서가 홈과 **바이트까지 같습니다**(실측 2,853B · canonical 도 «/»).
#    사이트맵에 내면 구글이 «대표 페이지가 따로 있는 중복» 으로 세기만 합니다.
STATIC = [("/", "1.0", "hourly"), ("/first", "0.9", "hourly"), ("/live", "0.9", "hourly"),
          # 📐📦 G194 (2026-10-07) 용역 · 물품 — 라우트(main.jsx) · prerender TABS · firebase.json 과 넷이 같이
          ("/svc", "0.8", "daily"), ("/svc/first", "0.8", "daily"), ("/goods", "0.7", "daily"), ("/goods/first", "0.7", "daily"),
          # 🔎 G640 (2026-11-10) 용역 · 물품 바로투찰 · 광고 · 제휴 안내 — 구운 장 · 찾기엔 있는데 사이트맵에서 빠져 있었음
          ("/svc/calc", "0.7", "weekly"), ("/goods/calc", "0.6", "weekly"), ("/ad", "0.4", "monthly"),
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
          ("/jeoksan/golgo", "0.8", "monthly"),   # 🏗 2026-09-26 골조 수량산출 — 라우트·prerender 와 셋이 같이
          ("/jeoksan/magam", "0.8", "monthly"),   # 🧱 2026-09-27 마감 수량산출
          ("/jeoksan/auto", "0.8", "monthly"),    # ⚡ 2026-09-27 도면 물량 자동
          ("/jeoksan/model", "0.8", "monthly"),   # 🧱 2026-10-23 G386 골조 모델(세우면 물량) — 라우트 · prerender 와 같이
          ("/jeoksan/bim", "0.8", "monthly"),     # 🔎 G510 (2026-11-02) BIM 물량 — 구운 장 · 찾기 · IndexNow 엔 있는데 사이트맵에만 빠져 있었음(점검 스크립트로 찾음)
          ("/safety", "0.9", "monthly"),
          ("/shareone", "0.8", "monthly"),
          # 🔎 G341 (2026-10-20) 소장님 「지금 만드는거 다 페이지 넣었지? … 검색되게」 — prerender TABS · firebase.json 과 셋이 같이
          ("/bunseok", "0.9", "daily"), ("/gongdong", "0.8", "daily"),
          ("/ext", "0.8", "daily"), ("/pre", "0.8", "daily"),
          ("/naeyeok/hado", "0.8", "monthly"), ("/first/hado-gyeonjeok", "0.8", "monthly"), ("/change/gisung", "0.8", "monthly"),
          ("/corp", "0.8", "daily")]   # 🏢 G343 업체 찾기

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
    names_path = os.path.join(DATA, "agency", "names.json")   # 🔎 G640 이름 목록 전부(5,106곳 · 11-10) — 없으면 top.json(앞 300)
    n_ag = 0
    _ag_src = names_path if os.path.exists(names_path) else top_path
    if os.path.exists(_ag_src):
        with open(_ag_src, encoding="utf-8") as f:
            top = sorted((r for r in json.load(f) if isinstance(r, list) and len(r) >= 3), key=lambda r: -(r[1] or 0))
        _seen = set()
        for name, cnt, _chunk in (r[:3] for r in top):
            # prerender.py safe() 와 같은 거르기 — 못 구운 이름을 사이트맵에 내지 않음(빈 껍데기 soft 404)
            if not name or name in _seen or (set(name) & set('\\/:*?"<>|')) or len(name.encode("utf-8")) >= 180:
                continue
            _seen.add(name)
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
    # 🏁 G504 낙찰 서류 한 벌 — prerender.py 가 굽습니다(forms/hanbeol.html)
    urls.append(f'  <url><loc>{SITE}/forms/hanbeol</loc><lastmod>{today}</lastmod>'
                f'<changefreq>monthly</changefreq><priority>0.6</priority></url>')
    n_fm += 1

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
                   "/change/twoline", "/change/work", "/change/won"]
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

    # ── 📚 G625 자격증 — prerender.py 가 cert.json 으로 굽는 쪽(첫 화면 · 등급 셈 · 깊은 글)과 같게 ──
    n_ct = 0
    try:
        CERT_JSON = os.path.join(ROOT, "web", "src", "data", "cert.json")
        with io.open(CERT_JSON, encoding="utf-8") as f:
            cd = json.load(f) or {}
        if cd.get("items"):
            for u in (["/cert", "/cert/grade"] + [f"/cert/{s}" for s in (cd.get("deep") or {})]
                      + [f"/cert/{s}/quiz" for s, t in (cd.get("deep") or {}).items() if t.get("quiz")]   # 📝 G628 예상문제 쪽
                      + [f"/cert/{s}/interview" for s, t in (cd.get("deep") or {}).items() if t.get("interview")]):   # 🎤 G631 면접 준비
                urls.append(f'  <url><loc>{SITE}{u}</loc>'
                            f'<lastmod>{_mtime(CERT_JSON, today)}</lastmod>'
                            f'<changefreq>monthly</changefreq><priority>0.7</priority></url>')
                n_ct += 1
    except Exception as e:
        print(f"  · 자격증 자료를 못 읽었습니다 ({type(e).__name__})")

    # ── 건설 도구 ────────────────────────────────
    n_tl = 0
    try:
        with io.open(TOOLS_JSON, encoding="utf-8") as f:
            ttools = (json.load(f) or {}).get("tools") or []
        wc = ["/tools/wonclick"] if os.path.exists(WONCLICK_JSON) else []     # prerender.py 가 구울 때만
        # 📦 2026-09-25 — 도면 3D 보기 (prerender.py 가 늘 굽습니다)
        for u in ["/tools"] + [f'/tools/{t["slug"]}' for t in ttools] + wc + ["/tools/dxf3d", "/tools/earthcheck", "/tools/dxfpdf", "/tools/dwgdxf", "/tools/sajincad", "/tools/tuipbi", "/tools/nomubi", "/tools/singo", "/tools/toejik", "/tools/boheomryo", "/tools/boheom-jeongsan", "/tools/haemada", "/tools/gyeonjeok", "/tools/sonik", "/tools/jimyeong", "/tools/sanan", "/tools/ilbo", "/tools/ilyong-boheom", "/tools/ilyong-guide", "/tools/ilyong-silup", "/tools/sanjae-hyueop", "/tools/juhyu", "/tools/ilyong-toejikgeum", "/tools/equip", "/tools/risk", "/tools/photo", "/tools/photo-live", "/tools/sigong", "/tools/anjeon", "/tools/jungcheo", "/tools/safecard", "/tools/colorplan", "/tools/cadfix", "/tools/hado-docs"]:
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

    # ── 💬 사랑방 글 — 글마다 한 장 (2026-09-29, 소장님 「다 페이지 달아 줘」) ──
    #    prerender.py 가 «같은 목록» 을 굽습니다 — qnapages.py 가 처음 읽은 것을 30분 남겨 두어 둘이 같은 글을 봅니다.
    #    lastmod = 글 · 고친 때 · 마지막 답글 중 늦은 날. 지운 글은 목록에서 빠집니다.
    n_qa = 0
    try:
        import qnapages
        for p in qnapages.posts(qnapages.snapshot()):
            urls.append(f'  <url><loc>{SITE}/qna/{p["id"]}</loc>'
                        f'<lastmod>{qnapages.ymd(p["mod"]) or today}</lastmod>'
                        f'<changefreq>weekly</changefreq><priority>0.5</priority></url>')
            n_qa += 1
    except Exception as e:
        print(f"  · 사랑방 글 주소를 못 넣었습니다({type(e).__name__}: {e}) — 넘어갑니다")

    # ── 🪪 G188 마이컨맵 — 검색 등록 칸을 다 채운 페이지만 (mypages.py · prerender.py 와 같은 목록 · 30분 남겨 둠) ──
    n_my = 0
    try:
        import mypages, qnapages
        for x in mypages.pages(mypages.snapshot()):
            urls.append(f'  <url><loc>{mypages.사이트맵주소(x["a"])}</loc>'
                        f'<lastmod>{qnapages.ymd(x["mod"]) or today}</lastmod>'
                        f'<changefreq>weekly</changefreq><priority>0.5</priority></url>')
            n_my += 1
    except Exception as e:
        print(f"  · 마이컨맵 주소를 못 넣었습니다({type(e).__name__}: {e}) — 넘어갑니다")

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
        if "/qna/" in u:                  # 💬 사랑방 글은 따로 한 벌 — «팔릴 페이지»(main) 한 벌을 묽게 하지 않게
            return "qna"
        if f"<loc>{SITE}/@" in u:          # 🪪 G188 마이컨맵 — 따로 한 벌
            return "my"
        if "/corp/" in u or "/agency/" in u:
            return "corp"
        if "/notice/" in u or "/daily" in u:
            return "bid"
        return "main"

    통 = {"main": [], "bid": [], "corp": [], "qna": [], "my": []}
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
                     ("sitemap-corp.xml", "corp"), ("sitemap-qna.xml", "qna"), ("sitemap-my.xml", "my")]:
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
          f" + 알아보기 {n_gd} + 자격증 {n_ct} + 도구 {n_tl} + 캐드 {n_cd} + 사랑방 {n_qa} = {len(urls)}개")
    print("     sitemap.xml (목차) → " + " · ".join(f"{이름} {수:,}장" for 이름, 수 in 낸것))
    print(f"     {p}")
    write_rss(rows.values())   # 📰 G629 네이버 «RSS 제출» 용 새 글 목록(web/public/rss.xml)


# ── 📰 G629 (2026-11-10) RSS «새 글 목록» — 네이버 서치어드바이저 «RSS 제출» 용 ─────────────────
#  소장님 「네이버에서도 검색이 되게 해줘」 — 네이버는 사이트맵(전체 지도)과 함께 RSS(새로 생긴 쪽)를 받아 새 쪽을 더 빨리 모읍니다.
#  새 쪽 알리기는 IndexNow(indexnow.py)가 이미 매 회차 하고 있고, RSS 는 그 «목록판»입니다(서치어드바이저에 한 번 제출하면 네이버가 스스로 읽으러 옴).
#  ⚠️ 구운 쪽만 냅니다 — 공고 · 개찰 최신(prerender 가 최신 8,000 을 구움). 공고 번호 꼴이 아니면 뺌. 글자는 모두 XML 이스케이프.
#  ⚠️ 실패해도 사이트맵 · 빌드를 멈추지 않습니다(main 끝에서 try).  시험: tools/시험_네이버.py
RSS_EACH = int(os.environ.get("RSS_EACH", "100"))     # 개찰결과 · 입찰공고 각각 최신 몇 개
_요일 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
_달 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _rfc822(v):
    """'2026-11-10 09:00:00'(한국 시각) → 'Tue, 10 Nov 2026 09:00:00 +0900' · 못 읽으면 None (요일 · 달 이름은 로케일과 상관없이 영문)"""
    d = "".join(ch for ch in str(v or "") if ch.isdigit())
    if len(d) < 8:
        return None
    try:
        t = datetime(int(d[0:4]), int(d[4:6]), int(d[6:8]), int(d[8:10] or 0), int(d[10:12] or 0), int(d[12:14] or 0))
    except ValueError:
        return None
    return f"{_요일[t.weekday()]}, {t.day:02d} {_달[t.month - 1]} {t.year} {t.hour:02d}:{t.minute:02d}:{t.second:02d} +0900"


def _x(v):
    """XML 글자 — & < > " 이스케이프 · 제어문자 뺌"""
    s = "".join(ch for ch in str(v or "") if ch in "\t\n" or ord(ch) >= 32)
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def rss_xml(rows, now=None, each=None):
    """공고 · 개찰 rows(dict 값들) → RSS 2.0 글. 개찰결과 · 입찰공고 각각 최신 each 개를 날짜 내림차순으로."""
    each = RSS_EACH if each is None else each
    now = now or datetime.now()
    좋은 = [r for r in rows if isinstance(r, dict) and str(r.get("no") or "") and all(c.isalnum() or c == "-" for c in str(r.get("no")))
          and _rfc822(r.get("dt")) and str(r.get("name") or "").strip()]
    결과 = sorted([r for r in 좋은 if r.get("win")], key=lambda r: str(r.get("dt")), reverse=True)[:each]
    공고 = sorted([r for r in 좋은 if not r.get("win")], key=lambda r: str(r.get("dt")), reverse=True)[:each]
    items = []
    for r in sorted(결과 + 공고, key=lambda r: str(r.get("dt")), reverse=True):
        no, nm, inst = str(r["no"]), str(r.get("name")).strip(), str(r.get("inst") or "").strip()
        link = f"{SITE}/notice/{quote(no, safe='')}"
        if r.get("win"):
            title = f"{nm} 개찰결과 — 낙찰 {r.get('win')}"
            try:
                rt = f" · 투찰률 {float(r.get('rate')):.3f}%"
            except (TypeError, ValueError):
                rt = ""
            desc = f"{inst} · 낙찰 {r.get('win')}{rt} — 기초금액 · 예정가격 · 참가업체 순위"
        else:
            title = f"{nm} 입찰공고"
            try:
                bs = f" · 기초금액 {int(float(r.get('base'))):,}원" if r.get("base") else ""
            except (TypeError, ValueError):
                bs = ""
            cl = f" · 마감 {str(r.get('close'))[:16]}" if r.get("close") else ""
            desc = f"{inst}{bs}{cl} — 권장 투찰금액 바로 계산"
        items.append(f"    <item><title>{_x(title)}</title><link>{_x(link)}</link><guid isPermaLink=\"true\">{_x(link)}</guid>"
                     f"<pubDate>{_rfc822(r.get('dt'))}</pubDate><description>{_x(desc)}</description></item>")
    빌드 = f"{_요일[now.weekday()]}, {now.day:02d} {_달[now.month - 1]} {now.year} {now.hour:02d}:{now.minute:02d}:{now.second:02d} +0900"
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n'
            '    <title>K-건설맵 — 공공 입찰 공고 · 개찰결과</title>\n'
            f'    <link>{SITE}/</link>\n'
            f'    <atom:link href="{SITE}/rss.xml" rel="self" type="application/rss+xml" />\n'
            '    <description>나라장터 공사 입찰공고와 개찰결과(1순위 · 낙찰 투찰률)를 날마다 모아 바로 보여 드립니다.</description>\n'
            '    <language>ko</language>\n'
            f'    <lastBuildDate>{빌드}</lastBuildDate>\n'
            + "\n".join(items) + ("\n" if items else "")
            + "  </channel>\n</rss>\n")


def write_rss(rows):
    """web/public/rss.xml — sitemap.py 가 npm run build «앞» 에 돌아 dist 로 같이 실립니다."""
    try:
        x = rss_xml(list(rows))
        p = os.path.join(OUT, "rss.xml")
        with open(p, "w", encoding="utf-8") as f:
            f.write(x)
        print(f"  ✅ RSS(새 글 목록) — {x.count('<item>')}개 → {p}")
    except Exception as e:
        print(f"  · RSS 를 못 만들었습니다 ({type(e).__name__}: {e}) — 사이트맵은 그대로 갑니다")


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
