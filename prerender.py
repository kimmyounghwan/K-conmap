# -*- coding: utf-8 -*-
"""
prerender.py — 주소마다 «진짜 HTML 파일» 을 굽습니다.  (2026-09-04)

■ 왜 만들었나 — 실측으로 확인한 사고
    이 사이트는 React 한 장짜리(SPA)라, 어떤 주소를 요청해도 서버가
    **똑같은 2,161바이트 빈 껍데기**를 돌려주고 있었습니다.

        홈                      2,161 B · 제목 「K-건설맵 — 바로투찰…」 · 본문 없음
        /agency/경상북도 경주시   2,161 B · 제목 똑같음            · 본문 없음

    · 구글에는 «제목·설명·본문이 전부 같은 페이지» 308개로 보입니다.
      서치콘솔의 «발견됨 — 색인 안 됨» 이 정확히 이 증상입니다.
    · 네이버는 자바스크립트를 거의 돌리지 않습니다. 건설 소장님들이 쓰는 게
      네이버인데, 네이버에게 이 사이트는 **빈 페이지**였습니다.
    · 카톡으로 링크를 보내도 미리보기가 전부 같습니다.

    → 빌드가 끝난 dist 안에 주소별 HTML 을 굽습니다. 제목·설명·본문이 주소마다
      다릅니다. 사람이 열면 React 가 그 자리를 덮어써 지금과 똑같이 보이고,
      크롤러는 글자를 봅니다.

■ Firebase 가 이걸 실제로 주는 근거
    firebase.json 의 rewrites(`**` → /index.html)는 **일치하는 파일이 없을 때만**
    적용됩니다. dist/agency/경주시.html 이 있으면 그 파일이 먼저 나갑니다.
    cleanUrls:true 라 `.html` 을 뗀 주소로 서비스됩니다.
    ⚠️ 이건 배포 뒤 브라우저로 직접 확인할 것 — 문서만 믿지 않습니다.

■ 쓰는 법
    python prerender.py            (web/dist 가 이미 빌드돼 있어야 합니다)
    npm run build 다음에 돌립니다. run_all.py 와 Actions 가 자동으로 부릅니다.

■ 안 하는 것
    · 없는 자료를 지어내지 않습니다. 값이 없으면 그 줄을 아예 안 씁니다.
    · 화면에 안 보이는 글자를 숨겨 넣지 않습니다(클로킹). 여기 적는 요약은
      React 가 그리는 내용과 같은 것이고, 잠깐 보였다가 교체될 뿐입니다.
"""
import html
import json
import os
import sys
from urllib.parse import quote

from ogcard import OgMaker
import daily as dailymod
import indexnow

# ⚠️ 업체명 정규화는 build_json.norm_corp «하나»만 씁니다.
#    여기에 다시 적으면 /corp/ 주소가 조용히 어긋납니다 (CLAUDE.md 5장).
try:
    from build_json import norm_corp
except Exception:                      # pandas 가 없는 환경에서도 HTML 은 구워져야 합니다
    def norm_corp(s):
        import re as _re
        return _re.sub(r"\s+", "", str(s)).strip()

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "web", "dist")
DATA = os.path.join(ROOT, "web", "public", "data")
STORE = os.path.join(ROOT, "data", "store")
SITE = "https://k-conmap.com"

# 몇 곳까지 구울지. 파일 하나가 3KB 안팎이라 3,000곳이면 약 9MB 입니다.
# ⚠️ 늘리기 전에 Firebase Hosting «출시 저장용량»(보관 10개) 을 확인하세요.
N_AGENCY = int(os.environ.get("PRERENDER_AGENCY", "300"))
N_CORP = int(os.environ.get("PRERENDER_CORP", "3000"))
# 공고·개찰 한 건마다 한 장. 최신부터 굽습니다.
# ⚠️ 배포 1벌이 그만큼 무거워집니다(장당 4~5KB). Firebase «출시 저장용량»(보관 10개)을
#    확인하면서 올릴 것. 8,000장이면 약 +35MB 입니다.
N_NOTICE = int(os.environ.get("PRERENDER_NOTICE", "8000"))
N_DAILY = int(os.environ.get("PRERENDER_DAILY", "45"))    # 「어제의 개찰 성적표」 며칠치

# ── 카톡·네이버 미리보기 그림 (og:image) ───────────────────────────
# 장당 16ms 라 «몇 장을 굽느냐» 가 그대로 배포 시간이 됩니다 (하루 21번 돕니다).
# 그래서 «실제로 공유되는 것» 만 굽습니다 — 7주 지난 개찰을 카톡에 붙이는 사람은 없습니다.
# 안 구운 페이지는 기본 카드(/og/default.png)를 씁니다.
OG_NOTICE = int(os.environ.get("OG_NOTICE", "2000"))    # 최신부터. 2,000 ≈ 32초 · 32MB
OG_AGENCY = int(os.environ.get("OG_AGENCY", "300"))
OG_CORP = int(os.environ.get("OG_CORP", "600"))
FONT = os.path.join(ROOT, "assets", "KcmKR-Bold.otf")

# 파일 이름으로 쓸 수 없는 글자가 든 이름은 건너뜁니다.
# (윈도우에서도 빌드가 돌아야 합니다 — 소장님 PC 의 run_all.py)
BAD = set('\\/:*?"<>|')


def esc(x):
    return html.escape(str(x), quote=True)


def enc_path(path):
    """'/agency/경상북도 안동시' → '/agency/%EA%B2%BD...%20...' (canonical·og:url 용)"""
    return "/".join(quote(seg, safe="") for seg in path.split("/"))


def load(rel):
    p = os.path.join(DATA, rel)
    if not os.path.exists(p):
        return None
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"  ! {rel} 읽기 실패 ({type(e).__name__}: {e})")
        return None


def pct(v, d=2):
    return f"{float(v):.{d}f}%" if isinstance(v, (int, float)) else None


def num(v):
    return f"{int(v):,}" if isinstance(v, (int, float)) else None


def won_short(v):
    try:
        v = float(v)
    except Exception:
        return None
    if v >= 1e8:
        return f"{v / 1e8:.1f}억"
    if v >= 1e4:
        return f"{v / 1e4:,.0f}만"
    return f"{v:,.0f}원"


def date_full(s):
    s = "".join(ch for ch in str(s or "") if ch.isdigit())
    return f"{s[0:4]}-{s[4:6]}-{s[6:8]}" if len(s) >= 8 else None


# ── 껍데기 HTML 을 한 번 읽어 «갈아 끼울 자리» 를 찾아 둡니다 ──────────
def read_shell():
    p = os.path.join(DIST, "index.html")
    if not os.path.exists(p):
        print("⛔ web/dist/index.html 이 없습니다 — 먼저 npm run build 를 하세요.")
        sys.exit(2)
    with open(p, encoding="utf-8") as f:
        s = f.read()
    # (2026-09-06) 홈(index.html)에도 본문을 굽게 되면서, prerender 를 두 번 돌리면
    #    «이미 구운 것» 을 껍데기로 읽습니다. 그러면 <div id="root"></div> 가 없어
    #    본문이 **조용히** 빠집니다. 조용히 틀리느니 멈춥니다.
    if '<div id="root"></div>' not in s:
        print("[STOP] web/dist/index.html 이 이미 구워진 것 같습니다 - npm run build 를 다시 하세요.")
        sys.exit(2)
    return s


# 크롤러가 «어디로 갈지» — 미리 구운 HTML 에는 하단 탭이 없습니다(React 가 그립니다).
# 그래서 크롤러가 개찰 페이지에 내려앉으면 갈 곳이 한 곳도 없었습니다(실측: 링크 1개).
# 사람에게는 React 가 마운트되면서 사라지고 진짜 탭바가 대신 그려집니다.
SITENAV = [("/", "바로투찰"), ("/first", "1순위 개찰"), ("/live", "입찰 공고"),
           ("/forms", "건설 서식"), ("/change", "설계변경"),
           ("/analysis", "낙찰 분석"), ("/daily", "개찰 성적표"),
           ("/guide", "입찰 알아보기")]


def nav_html(here=""):
    out = ['<div class="card" style="margin-top:10px"><div class="sec-title" '
           'style="margin:0 0 6px">K-건설맵 둘러보기</div><div class="navrow">']
    for u, name in SITENAV:
        if u == here:
            out.append(f'<span class="navi on">{esc(name)}</span>')
        else:
            out.append(f'<a class="navi" href="{esc(u)}">{esc(name)}</a>')
    out.append("</div></div>")
    return "".join(out)


def link_card(title, items, note=None):
    """items = [(주소, 왼쪽글, 오른쪽글)] - 주소가 없는 줄은 아예 뺍니다.

    ★ 왜 만들었나 (2026-09-06 실측)
      서치콘솔: 색인 1장 · 「발견됨 - 현재 색인이 생성되지 않음」 1,145장.
      «발견됨» 은 «크롤링됨» 이 아닙니다 - 구글이 사이트맵으로 주소를 알기만 하고
      **한 번도 받아 가지 않았다** 는 뜻입니다. 크롤링 통계는 90일 동안 32회,
      그나마 97%가 «새로고침»(=이미 아는 페이지 다시 받기) 이었습니다.
      그런데 그 «이미 아는 페이지» 인 홈의 미리 구운 HTML 에는 **링크가 0개**였습니다.
      구글이 유일하게 받아 가는 문서가 막다른 길이었던 것입니다.
      -> 홈·탭에 «구워 둔 주소로 가는 링크» 를 답니다. 사이트맵은 «있다» 는 알림일 뿐,
        크롤러는 링크를 타고 안쪽으로 들어갑니다.
    """
    items = [(u, a, b) for u, a, b in items if u and a]
    if not items:
        return ""
    out = [f'<div class="card"><div class="sec-title" style="margin:0 0 6px">{esc(title)}</div>']
    if note:
        out.append('<div style="font-size:12px;color:var(--muted);margin:0 0 8px;'
                   f'line-height:1.6">{esc(note)}</div>')
    for u, a, b in items:
        right = f'<span class="r">{esc(b)}</span>' if b else ""
        out.append(f'<div class="row"><div class="grow">'
                   f'<a class="t" href="{esc(u)}">{esc(a)}</a></div>{right}</div>')
    out.append("</div>")
    return "".join(out)


def lead_card(h1, paras):
    """제목 한 줄 + 문단 몇 개. 없는 것은 지어내지 않습니다."""
    out = [f'<div class="card"><h1 style="font-size:19px;font-weight:800;'
           f'margin:0;line-height:1.4">{h1}</h1>']
    for t in paras:
        if t:
            out.append('<p style="font-size:13.5px;line-height:1.75;margin:10px 0 0">'
                       + t + "</p>")
    out.append("</div>")
    return "".join(out)


def shell_meta(shell):
    """껍데기(web/index.html)에 적힌 제목·설명을 그대로 씁니다 - 두 벌로 적지 않으려고."""
    t, d = "K-건설맵", ""
    i, j = shell.find("<title>"), shell.find("</title>")
    if i >= 0 and j > i:
        t = shell[i + 7:j].strip()
    mark = '<meta name="description" content="'
    k = shell.find(mark)
    if k >= 0:
        s = k + len(mark)
        d = shell[s:shell.find('"', s)].strip()
    return t, d


def page(shell, path, title, desc, body, image=None, jsonld=None):
    """껍데기에서 제목·설명·canonical·og 를 갈아 끼우고 본문 요약을 넣습니다."""
    h = shell
    url = enc_path(path)
    # <title>
    i, j = h.find("<title>"), h.find("</title>")
    if i >= 0 and j > i:
        h = h[:i] + "<title>" + esc(title) + h[j:]
    # description
    k = h.find('<meta name="description" content="')
    if k >= 0:
        s = k + len('<meta name="description" content="')
        e = h.find('"', s)
        h = h[:s] + esc(desc) + h[e:]
    # canonical — ⚠️ 주소는 반드시 퍼센트 인코딩합니다.
    #   「/agency/경상북도 안동시」 처럼 공백·한글이 그대로 들어가면 canonical 이 깨집니다.
    k = h.find('<link rel="canonical" href="')
    if k >= 0:
        st = k + len('<link rel="canonical" href="')
        en = h.find('"', st)
        h = h[:st] + esc(SITE + url) + h[en:]
    # og — 카톡·페북 미리보기가 주소마다 다르게 뜨도록.
    # ⚠️ 껍데기에 이미 og:title / og:description / og:url 이 들어 있습니다.
    #    새로 «추가» 하면 크롤러가 앞엣것을 읽어 전부 홈 제목으로 뜹니다
    #    (실제로 처음에 그렇게 만들었다가 잡았습니다). 그래서 «갈아 끼웁니다».
    for prop, val in (("og:title", title), ("og:description", desc), ("og:url", SITE + url)):
        mark = f'<meta property="{prop}" content="'
        k = h.find(mark)
        if k >= 0:
            st = k + len(mark)
            en = h.find('"', st)
            h = h[:st] + esc(val) + h[en:]
        else:
            h = h.replace("</head>", f'  <meta property="{prop}" content="{esc(val)}" />\n  </head>', 1)
    # og:image — 카톡 미리보기의 «그림». 껍데기(web/index.html)에 기본 카드가 박혀 있고,
    # 그림을 따로 구운 페이지만 여기서 자기 것으로 갈아 끼웁니다.
    if image:
        mark = '<meta property="og:image" content="'
        k = h.find(mark)
        if k >= 0:
            st = k + len(mark)
            en = h.find('"', st)
            h = h[:st] + esc(SITE + enc_path(image)) + h[en:]
        else:
            h = h.replace("</head>",
                          f'  <meta property="og:image" content="{esc(SITE + enc_path(image))}" />\n  </head>', 1)
    if "twitter:card" not in h:
        h = h.replace("</head>",
                      '  <meta name="twitter:card" content="summary_large_image" />\n  </head>', 1)
    # 구조화 데이터 — 구글이 «이 페이지가 무엇인지» 를 글자가 아니라 자료로 읽습니다.
    if jsonld:
        h = h.replace("</head>",
                      '  <script type="application/ld+json">'
                      + json.dumps(jsonld, ensure_ascii=False, separators=(",", ":"))
                      + "</script>\n  </head>", 1)
    # 본문 — React 가 마운트되면 이 자리를 통째로 덮어씁니다
    h = h.replace('<div id="root"></div>',
                  '<div id="root">' + body + nav_html(path) + "</div>", 1)
    return h


def write(rel_path, text):
    """rel_path 예: 'agency/경상북도 경주시.html' (cleanUrls 로 .html 없이 서비스됩니다)"""
    p = os.path.join(DIST, *rel_path.split("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)


def safe(name):
    return name and not (set(name) & BAD) and len(name.encode("utf-8")) < 180


def safe_no(no):
    """공고번호는 영숫자·하이픈만 받습니다 — 파일 이름으로 바로 쓰므로."""
    no = str(no or "").strip()
    return no if no and all(c.isalnum() or c == "-" for c in no) and len(no) <= 40 else None


# ── 본문 요약 만들기 ────────────────────────────────────────────────
def rows_html(title, rows, href=None):
    """rows = [(왼쪽, 오른쪽)] — 값이 없는 줄은 아예 넣지 않습니다.

    href(왼쪽) 이 주소를 돌려주면 그 줄을 링크로 만듭니다.
    ★ 왜 링크가 중요한가 (2026-09-04): 크롤러는 사이트맵보다 «링크를 타고» 다니는 것을
      더 신뢰합니다. 구워 둔 11,000장이 서로 이어져 있어야 안쪽까지 들어옵니다.
    ⚠️ **우리가 실제로 구운 주소에만** 겁니다. 없는 주소로 링크를 걸면
       크롤러가 빈 껍데기를 보고, 그건 색인에 해롭습니다.
    """
    rows = [(a, b) for a, b in rows if a and b]
    if not rows:
        return ""
    out = [f'<div class="card"><div class="sec-title" style="margin:0 0 6px">{esc(title)}</div>']
    for a, b in rows:
        u = href(a) if href else None
        left = (f'<a class="t" href="{esc(u)}">{esc(a)}</a>' if u
                else f'<div class="t">{esc(a)}</div>')
        out.append(f'<div class="row"><div class="grow">{left}</div>'
                   f'<span class="r">{esc(b)}</span></div>')
    out.append("</div>")
    return "".join(out)


class Links:
    """«우리가 구운 주소» 목록. 여기 있는 것에만 링크를 겁니다."""

    def __init__(self):
        self.ag, self.co = set(), set()

    def agency(self, name):
        n = str(name or "").strip()
        return f"/agency/{quote(n, safe='')}" if n in self.ag else None

    def corp(self, name):
        k = norm_corp(str(name or ""))
        return f"/corp/{quote(k, safe='')}" if k in self.co else None


def agency_page(shell, name, a, image=None, L=None):
    n = num(a.get("n"))
    avg = pct((a.get("s") or {}).get("avg"))
    corps = a.get("corps") or []
    cases = a.get("cases") or []
    title = f"{name} 입찰 낙찰 분석" + (f" — 평균 투찰률 {avg}" if avg else "") + " | K-건설맵"
    desc = (f"{name}의 조달청 개찰 기록" + (f" {n}건" if n else "")
            + (f". 평균 투찰률 {avg}" if avg else "")
            + (f", 최다 낙찰 업체 {corps[0][0]}" if corps else "")
            + ". 낙찰률 분포와 최근 낙찰 사례를 무료로 봅니다.")

    lead = [f"<h1 style=\"font-size:19px;font-weight:800;margin:0\">{esc(name)}</h1>"]
    facts = []
    if n:
        facts.append(f"최근 3년 낙찰 <b>{n}건</b>")
    if avg:
        facts.append(f"평균 투찰률 <b>{avg}</b>")
    if a.get("amt", {}).get("avg"):
        v = won_short(a["amt"]["avg"])
        if v:
            facts.append(f"평균 낙찰금액 <b>{v}</b>")
    if facts:
        lead.append('<p style="font-size:13.5px;line-height:1.7;margin:10px 0 0">'
                    + " · ".join(facts) + "</p>")
    body = '<div class="card">' + "".join(lead) + "</div>"
    body += rows_html("🏆 자주 낙찰받은 업체",
                      [(c[0], f"{num(c[1])}건") for c in corps[:5] if len(c) >= 2],
                      href=(L.corp if L else None))
    body += rows_html("🗂 최근 낙찰 사례",
                      [(c[0], pct(c[3], 3) or "-") for c in cases[:5]
                       if len(c) >= 4 and c[0]])
    return page(shell, f"/agency/{name}", title, desc, body, image)


def corp_page(shell, key, c, image=None, L=None):
    name = c.get("name") or key
    n = num(c.get("n"))
    avg = pct((c.get("s") or {}).get("avg"))
    reg = list((c.get("reg") or {}).items())
    inst = c.get("inst") or []
    cases = c.get("cases") or []
    title = f"{name} 낙찰 실적" + (f" — {n}건 · 평균 투찰률 {avg}" if n and avg else "") + " | K-건설맵"
    desc = (f"{name}의 조달청 개찰 낙찰 기록" + (f" {n}건" if n else "")
            + (f". 평균 투찰률 {avg}" if avg else "")
            + (f", 주력 지역 {reg[0][0]}" if reg else "")
            + ". 지역·기관별 낙찰 분포와 최근 낙찰 내역을 무료로 봅니다.")

    lead = [f"<h1 style=\"font-size:19px;font-weight:800;margin:0\">{esc(name)}</h1>"]
    facts = []
    if n:
        facts.append(f"누적 1순위 <b>{n}건</b>")
    if avg:
        facts.append(f"평균 투찰률 <b>{avg}</b>")
    if reg:
        facts.append(f"주력 지역 <b>{esc(reg[0][0])}</b>({reg[0][1]}건)")
    if facts:
        lead.append('<p style="font-size:13.5px;line-height:1.7;margin:10px 0 0">'
                    + " · ".join(facts) + "</p>")
    body = '<div class="card">' + "".join(lead) + "</div>"
    body += rows_html("📍 지역별 낙찰", [(r[0], f"{num(r[1])}건") for r in reg[:5]])
    body += rows_html("🏛 자주 낙찰받은 기관",
                      [(i[0], f"{num(i[1])}건") for i in inst[:5] if len(i) >= 2],
                      href=(L.agency if L else None))
    body += rows_html("🗂 최근 낙찰",
                      [(x[0], date_full(x[1]) or "-") for x in cases[:5]
                       if len(x) >= 2 and x[0]])
    return page(shell, f"/corp/{key}", title, desc, body, image)



# ── 공고·개찰 한 건짜리 페이지 ──────────────────────────────────────
#  ★ 2026-09-04 — 가장 많은 «검색 수요» 가 여기 있습니다.
#     업체 페이지는 «경쟁사를 보는 사람» 이라는 좁은 수요지만,
#     공고 페이지는 그 공고에 투찰한 60~300개 업체 전원이 「결과 어떻게 됐지」를 찾습니다.
#     그리고 개찰이 하루 570건씩 나오므로 페이지가 저절로 늘어납니다.
#
#  ⚠️ 화면(React)이 다시 그리려면 그 공고 한 줄이 필요합니다. 그런데 옛 개찰은
#     브라우저가 받을 수 있는 파일(bidindex·bidresult)에 없습니다.
#     → 그래서 **그 줄을 HTML 안에 같이 넣어 둡니다**(<script type="application/json">).
#       파일을 하나 더 받지 않아도 되고, 목록 색인을 무겁게 만들지도 않습니다.
def load_store(name):
    p = os.path.join(STORE, f"{name}.json")
    if not os.path.exists(p):
        return {}
    try:
        with open(p, encoding="utf-8") as f:
            d = json.load(f)
        out = {}
        for v in d.values():
            if isinstance(v, dict):
                out.update(v)
        return out
    except Exception as e:
        print(f"  ! store/{name}.json 읽기 실패 ({type(e).__name__}: {e})")
        return {}


# ── 공고에 붙은 내역서 (2026-09-06) ─────────────────────────────
#  소장님: 「검색에 떠야해, 각종 서식 및 내역서, 설계변경 자료 등」
#
#  ★ 왜 여기(공고 페이지)가 가장 큰 자리인가
#     /change/naeyeok 은 한 장입니다. 그런데 공고 페이지는 이미 8,000장을 굽습니다.
#     거기에 붙임 파일을 적으면 「○○공사 설계내역서」 로 찾는 사람이 그 장에 닿습니다.
#     새 페이지를 만들지 않고 이미 있는 8,000장을 쓰는 것이라 비용이 0입니다.
#
#  ⚠️ 갈래(설계내역서·공내역서…)는 collect.py 의 naeyeok_kind 가 정합니다.
#     여기서 다시 가르지 않습니다 — 같은 규칙을 두 번 적으면 반드시 어긋납니다.
#     collect.py 가 이미 갈래를 매겨 낸 naeyeok*.json 을 그대로 읽습니다.
def load_naeyeok_by_notice():
    """{공고번호: [{kind,file,url,local,priced}, ...]} — 없으면 빈 dict."""
    out = {}
    for fn in ("naeyeok.json", "naeyeok-all.json"):
        p = os.path.join(ROOT, "web", "public", "data", fn)
        if not os.path.exists(p):
            continue
        try:
            with open(p, encoding="utf-8") as f:
                d = json.load(f) or {}
        except Exception:
            continue
        f_ = d.get("f") or []
        try:
            gi = {k: f_.index(k) for k in ("kind", "file", "url", "no", "local", "priced")}
        except ValueError:
            continue
        for row in d.get("r") or []:
            no = str(row[gi["no"]] or "")
            if not no:
                continue
            out.setdefault(no, []).append({
                "kind": row[gi["kind"]], "file": row[gi["file"]], "url": row[gi["url"]],
                "local": row[gi["local"]], "priced": row[gi["priced"]]})
    return out


def load_naeyeok_meta():
    """(meta, {갈래: [줄, ...]}) — collect.py 가 낸 naeyeok*.json 을 그대로 읽습니다."""
    meta, by = {}, {}
    for fn in ("naeyeok.json", "naeyeok-all.json"):
        p = os.path.join(ROOT, "web", "public", "data", fn)
        if not os.path.exists(p):
            continue
        try:
            with open(p, encoding="utf-8") as f:
                d = json.load(f) or {}
        except Exception:
            continue
        meta = meta or {k: d.get(k) for k in ("all", "kinds", "show", "days", "total")}
        if d.get("all"):
            meta["all"] = dict(meta.get("all") or {}, **d["all"])
        f_ = d.get("f") or []
        try:
            gi = {k: f_.index(k) for k in
                  ("kind", "file", "url", "name", "inst", "dt", "no", "local", "priced")}
        except ValueError:
            continue
        for row in d.get("r") or []:
            by.setdefault(row[gi["kind"]], []).append({k: row[i] for k, i in gi.items()})
    return meta, by


def docs_html(items):
    """공고 페이지의 「📎 붙임 내역서」 칸. 없으면 빈 문자열."""
    if not items:
        return ""
    # 단가가 확인된 것 → 단가 든 갈래 → 나머지 순서
    def rank(x):
        return (0 if x["priced"] == 1 else (1 if x["kind"] in ("설계내역서", "단가산출서") else 2))
    out = ['<div class="card"><div class="sec-title" style="margin:0 0 6px">'
           '📎 이 공고에 붙은 내역서</div>']
    for x in sorted(items, key=rank)[:12]:
        tag = ("<em class=\"dtag ok\">단가 확인됨</em>" if x["priced"] == 1
               else ("<em class=\"dtag no\">열어 보니 단가 없음</em>" if x["priced"] == 0 else ""))
        # 우리가 받아 둔 것은 바로, 아니면 조달청이 준 주소로 (손으로 만들지 않습니다)
        href = x["local"] or x["url"]
        btn = "⬇ 바로 받기" if x["local"] else "⬇ 나라장터에서 받기"
        rel = "" if x["local"] else ' target="_blank" rel="noopener nofollow"'
        out.append('<div class="frow nyrow"><span class="fic">%s</span>'
                   '<div class="grow"><div class="ft">%s %s</div>'
                   '<div class="d">%s</div></div>'
                   '<div class="nybtn"><a class="fdl" href="%s"%s>%s</a></div></div>'
                   % ("💰" if x["priced"] == 1 else "📑", esc(x["file"]), tag,
                      esc(x["kind"]), esc(href), rel, btn))
    out.append('<div class="note sm" style="margin-top:6px">'
               '발주기관이 나라장터 공고에 붙여 공개한 파일입니다. '
               '<a href="/change/naeyeok" style="color:var(--accent);font-weight:700">'
               '내역서 모음 전체 보기 →</a></div></div>')
    return "".join(out)


def notice_page(shell, r, image=None, L=None, docs=None):
    no = r.get("no")
    nm = str(r.get("name") or no)
    inst = str(r.get("inst") or "")
    won = r.get("win")
    rate = r.get("rate")
    base = r.get("base")
    dt = date_full(r.get("dt")) or date_full(r.get("close"))

    if won:   # 개찰 끝난 건
        title = f"{nm} 낙찰 결과" + (f" — {won}" if won else "")
        if isinstance(rate, (int, float)):
            title += f" {rate:.3f}%"
        desc = (f"{inst} {nm} 개찰 결과." + (f" 낙찰 {won}" if won else "")
                + (f", 투찰률 {rate:.3f}%" if isinstance(rate, (int, float)) else "")
                + (f", 낙찰금액 {won_short(r.get('amt'))}" if r.get("amt") else "")
                + " 기초금액·예정가격·참가업체수를 무료로 봅니다.")
    else:     # 아직 마감 전
        title = f"{nm} 입찰 공고"
        if base:
            title += f" — 기초금액 {won_short(base)}"
        desc = (f"{inst} {nm} 나라장터 입찰 공고."
                + (f" 기초금액 {won_short(base)}" if base else "")
                + (f", 마감 {date_full(r.get('close'))}" if r.get("close") else "")
                + ". 권장 투찰금액을 바로 계산해 드립니다.")
    # ★ 붙임 내역서를 제목·설명에 적습니다 (2026-09-06)
    #   「○○공사 설계내역서」 는 실제 검색어입니다. 본문에만 있으면 약합니다.
    dk = []
    for x in (docs or []):
        if x["kind"] not in dk:
            dk.append(x["kind"])
    if dk:
        title += " · " + "·".join(dk[:2])
        desc += (" 이 공고의 " + "·".join(dk[:3]) + " 붙임 파일을 함께 봅니다"
                 + ("(단가 확인됨)." if any(x["priced"] == 1 for x in docs) else "."))
    title += " | K-건설맵"

    lead = [f'<h1 style="font-size:18px;font-weight:800;margin:0;line-height:1.45">{esc(nm)}</h1>']
    sub = " · ".join(x for x in (inst, dt) if x)
    if sub:
        lead.append(f'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">{esc(sub)}</div>')
    body = '<div class="card">' + "".join(lead) + "</div>"

    rows = [("기초금액", won_short(base)), ("추정가격", won_short(r.get("est"))),
            ("A값", won_short(r.get("aval"))),
            ("낙찰하한율", pct(r.get("llr"), 3)),
            ("예가범위", (f"{r.get('lo')}% ~ {r.get('hi')}%"
                       if r.get("lo") is not None and r.get("hi") is not None else None))]
    body += rows_html("📋 공고 조건", rows)
    if won:
        # ★ 낙찰업체·발주기관을 «각자의 페이지»로 잇습니다 (2026-09-04).
        #   개찰 페이지가 11,000장이라, 여기 링크 두 개가 사이트 안쪽으로 가는 길이 됩니다.
        body += rows_html("🏆 개찰 결과", [
            ("낙찰업체", won),
            ("낙찰금액", won_short(r.get("amt"))),
            ("투찰률", pct(rate, 3)),
            ("참가업체수", (f"{num(r.get('np'))}곳" if r.get("np") else None)),
        ], href=(lambda a: (L.corp(won) if (L and a == won) else None)))
    # ⚠️ 링크가 걸리는 기관(우리가 구운 300곳)일 때만 이 칸을 답니다.
    #    안 그러면 「낙찰 분석 보기 →」 라고 써 놓고 눌리지 않는 칸이 됩니다 —
    #    버튼 이름이 실제 동작과 다르면 안 됩니다 (CLAUDE.md 3번).
    if L and inst and L.agency(inst):
        body += rows_html("🏛 발주기관", [(inst, "낙찰 분석 보기 →")], href=L.agency)
    body += docs_html(docs)

    h = page(shell, f"/notice/{no}", title, desc, body, image)
    # 화면이 다시 그릴 때 쓸 원본 한 줄 — 파일을 더 받지 않아도 되도록 같이 넣습니다.
    # ⚠️ 갈래를 매긴 붙임 목록(ndocs)도 같이 넣습니다.
    #    안 넣으면 «크롤러는 내역서를 보는데 사람은 못 보는» 화면이 됩니다.
    #    갈래는 collect.py 가 정한 것을 그대로 옮깁니다 — 여기서 다시 가르지 않습니다.
    if docs:
        r = dict(r, ndocs=docs)
    data = json.dumps(r, ensure_ascii=False).replace("</", "<\\/")
    h = h.replace("</body>",
                  '<script type="application/json" id="ndata">' + data + "</script>\n  </body>", 1)
    return h

# ── 「어제의 개찰 성적표」 ────────────────────────────────────────
def _dtable(title, note, rows, cols):
    """rows = daily.py 의 _row() 배열. cols 는 (이름표, 뽑는 함수) 목록."""
    if not rows:
        return ""
    out = [f'<div class="card"><div class="sec-title" style="margin:0 0 6px">{esc(title)}</div>']
    if note:
        out.append(f'<div class="note sm" style="margin:0 0 8px">{esc(note)}</div>')
    for a in rows:
        no, nm, inst = a[0], a[1], a[2]
        right = " · ".join(x for x in (f(a) for _, f in cols) if x)
        out.append(
            f'<div class="row"><div class="grow">'
            f'<a class="t" href="/notice/{quote(str(no), safe="")}">{esc(nm)}</a>'
            f'<div class="d">{esc(inst)}</div></div>'
            f'<span class="r">{esc(right)}</span></div>')
    out.append("</div>")
    return "".join(out)


def daily_page(shell, dd, image=None, L=None):
    # ⚠️ 「두 건 이상 가져간 곳」의 업체 링크는 **우리가 구운 주소일 때만** 겁니다.
    #    5만 곳 전부에 링크를 걸면 크롤러가 «자바스크립트로만 그려지는 빈 페이지» 를 수만 장 봅니다
    #    (네이버는 자바스크립트를 거의 안 돌립니다). 그래서 여기서 미리 판정해 ddata 에 실어 둡니다.
    dd = dict(dd)
    dd["multi"] = [[w, c, (L.corp(w) if L else None)] for w, c in (dd.get("multi") or [])]
    d = dd["d"]
    ymd = d.replace("-", ".")
    r, np_ = dd.get("r") or {}, dd.get("np") or {}
    med = f"{r['med']:.3f}%" if r.get("med") is not None else ""
    title = (f"{ymd} 개찰 결과 — 공사 {num(dd['n'])}건"
             + (f" · 낙찰률 중앙 {med}" if med else "") + " | K-건설맵")
    desc = (f"{ymd} 조달청 나라장터 공사 개찰 {num(dd['n'])}건 요약."
            + (f" 낙찰률 중앙 {med}" if med else "")
            + (f", 참가업체수 중앙 {num(np_.get('med'))}곳" if np_.get("med") else "")
            + f". 가장 치열했던 공고, 참가 1곳 공고, 금액이 큰 공고를 무료로 봅니다.")

    head = [f'<h1 style="font-size:18px;font-weight:800;margin:0">{esc(ymd)} 개찰 성적표</h1>',
            f'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">'
            f'공사 {num(dd["n"])}건'
            + (f" · 낙찰률 중앙 {med}" if med else "")
            + (f" · 참가 중앙 {num(np_.get('med'))}곳" if np_.get("med") else "")
            + "</div>"]
    body = '<div class="card">' + "".join(head) + "</div>"
    body += rows_html("📊 그날 한눈에", [
        ("개찰 건수", f"{num(dd['n'])}건"),
        ("낙찰률 중앙", med or None),
        ("가장 낮게 / 높게", (f"{r['min']:.3f}% / {r['max']:.3f}%" if r.get("min") is not None else None)),
        ("참가업체수 중앙 / 최다", (f"{num(np_.get('med'))}곳 / {num(np_.get('max'))}곳" if np_.get("med") else None)),
        ("100곳 넘게 붙은 공고", (f"{num(dd['hot'])}건" if dd.get("hot") else None)),
        ("참가 1곳 공고", (f"{num(dd['solo'])}건" if dd.get("solo") else None)),
        ("낙찰금액 합계", won_short(dd.get("sum")) if dd.get("sum") else None),
    ])
    body += _dtable("🔥 가장 치열했던 공고", "참가업체수가 많을수록 1순위는 낙찰하한에 바짝 붙습니다.",
                    dd.get("byNp"), [("np", lambda a: f"{num(a[3])}곳" if a[3] else ""),
                                     ("rate", lambda a: f"{a[4]:.3f}%" if a[4] is not None else "")])
    body += _dtable("💰 금액이 큰 공고", None, dd.get("byAmt"),
                    [("amt", lambda a: won_short(a[6]) or ""),
                     ("rate", lambda a: f"{a[4]:.3f}%" if a[4] is not None else "")])
    body += _dtable("🌲 참가 1곳 — 아무도 안 붙은 자리",
                    "참가 자격(면허·지역)이 좁게 묶인 공고가 대부분입니다. 경쟁이 없으면 하한까지 내릴 이유가 없어 투찰률이 높게 나옵니다.",
                    dd.get("solos"), [("rate", lambda a: f"{a[4]:.3f}%" if a[4] is not None else "")])
    if dd.get("multi"):
        _u = {w: u for w, c, u in dd["multi"] if u}
        body += rows_html("🥇 그날 두 건 이상 가져간 곳",
                          [(w, f"{c}건") for w, c, _ in dd["multi"]],
                          href=lambda a: _u.get(a))

    h = page(shell, f"/daily/{d}", title, desc, body, image)
    data = json.dumps(dd, ensure_ascii=False).replace("</", "<\\/")
    return h.replace("</body>",
                     '<script type="application/json" id="ddata">' + data + "</script>\n  </body>", 1)


def daily_index(shell, days, image=None):
    title = "날짜별 개찰 성적표 — 매일 갱신 | K-건설맵"
    desc = "조달청 나라장터 공사 개찰을 날짜별로 한 장씩 정리합니다. 그날 낙찰률, 가장 치열했던 공고, 참가 1곳 공고를 무료로 봅니다."
    out = ['<div class="card"><h1 style="font-size:18px;font-weight:800;margin:0">날짜별 개찰 성적표</h1>'
           '<div style="font-size:12.5px;color:var(--muted);margin-top:4px">하루 한 장 · 개찰이 올라오는 대로 갱신됩니다</div></div>'
           '<div class="card">']
    for d, n in days:
        out.append(f'<a class="row rowlink" href="/daily/{d}">'
                   f'<div class="grow"><div class="t">{esc(d.replace("-", "."))} 개찰 성적표</div></div>'
                   f'<span class="r">{esc(num(n))}건</span><span class="go">→</span></a>')
    out.append("</div>")
    h = page(shell, "/daily", title, desc, "".join(out), image)
    data = json.dumps([[d, n] for d, n in days], ensure_ascii=False)
    return h.replace("</body>",
                     '<script type="application/json" id="dlist">' + data + "</script>\n  </body>", 1)


# ── 건설 서식 (2026-09-05) ─────────────────────────────────────────
#  왜 굽나: 「착공계 양식」·「기성 청구서 양식」은 꾸준히 검색되는 말입니다.
#  그리고 우리 자료와 달리 **변하지 않습니다** — 한 번 구워 두면 계속 일합니다.
#  ⚠️ 내용은 web/src/data/forms.json 한 곳에만 있습니다(화면·엑셀·여기가 같이 읽습니다).
FORMS_JSON = os.path.join(ROOT, "web", "src", "data", "forms.json")


def load_forms():
    try:
        with open(FORMS_JSON, encoding="utf-8") as f:
            return (json.load(f) or {}).get("forms") or []
    except Exception as e:
        print(f"  · 서식 목록을 못 읽었습니다 ({type(e).__name__}) — 서식 페이지는 건너뜁니다")
        return []


def _sheet_html(sheet):
    """미리보기 — 화면(Forms.jsx)과 «같은 blocks» 를 글자로 폅니다.
       크롤러는 표 안의 글자를 읽습니다. 그림으로 만들면 아무 말도 안 하는 것과 같습니다."""
    out = [f'<div class="fpaper"><h3>{esc(sheet["heading"])}</h3>']
    for b in sheet.get("blocks") or []:
        t = b.get("t")
        if t == "kv":
            out.append("<table class=\"fkv\"><tbody>")
            for row in b["rows"]:
                out.append(f'<tr><th>{esc(row[0])}</th><td></td></tr>')
            out.append("</tbody></table>")
        elif t == "text":
            out.append(f'<p class="ftext">{esc(b["text"])}</p>')
        elif t == "table":
            out.append('<table class="fgrid"><thead><tr>')
            out.extend(f"<th>{esc(c)}</th>" for c in b["cols"])
            out.append("</tr></thead><tbody>")
            for _ in range(min(int(b.get("n") or 1), 3)):
                out.append("<tr>" + "".join("<td></td>" for _ in b["cols"]) + "</tr>")
            out.append("</tbody></table>")
        elif t == "cl":
            for head, body in b["items"]:
                out.append(f'<div class="fcl"><b>{esc(head)}</b>'
                           + (f"<p>{esc(body)}</p>" if body else "") + "</div>")
        elif t == "sign":
            who = " · ".join(b.get("who") or [])
            out.append(f'<div class="fsign"><div class="fdate">년   월   일</div>'
                       f'<div>{esc(who)} (서명 또는 인)</div></div>')
    out.append("</div>")
    return "".join(out)


def forms_index(shell, forms, image=None):
    title = "건설 서식 무료 내려받기 — 착공계·기성청구서·작업일보 | K-건설맵"
    desc = ("현장에서 자주 쓰는 건설 서식 %d가지를 엑셀로 무료 제공합니다. "
            "착공계·현장대리인계·기성검사원·기성금 청구서·준공계·노무비 지급확인서·"
            "실정보고서·작업일보. 회원가입 없음." % len(forms))
    out = ['<div class="card"><h1 style="font-size:18px;font-weight:800;margin:0">건설 서식</h1>'
           f'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">'
           f'현장에서 자주 쓰는 서류 {len(forms)}가지 · 엑셀로 바로 내려받기 · 회원가입 없음</div></div>'
           '<a class="card fbook" href="/change/excel"><span class="fic">📊</span><div class="grow">'
           '<div class="t">설계변경 자동계산 엑셀 <em>· 시트 11장</em></div>'
           '<div class="d">빈 표가 아니라 <b>계산기</b>입니다. 단가 하나를 고치면 내역 · '
           '증감대비표 · 원가계산서까지 다시 계산됩니다.</div></div>'
           '<span class="go">→</span></a>'
           '<div class="card"><div class="fwarn2">발주기관이 정한 서식이 있으면 그 서식을 씁니다. '
           '여기 있는 것은 정해진 서식이 없을 때 쓰는 일반 양식입니다.</div></div>']
    group = {}
    for f in forms:
        group.setdefault(f.get("group") or "기타", []).append(f)
    for g, lst in group.items():
        out.append(f'<div class="card"><div class="sec-title" style="margin:0 0 6px">{esc(g)}</div>')
        for f in lst:
            sub = f' · {esc(f["sub"])}' if f.get("sub") else ""
            out.append(f'<a class="row rowlink" href="/forms/{esc(f["slug"])}">'
                       f'<div class="grow"><div class="t">{esc(f["title"])}{sub}</div>'
                       f'<div class="d">{esc(f.get("short") or "")}</div></div>'
                       f'<span class="go">→</span></a>')
        out.append("</div>")
    ld = {"@context": "https://schema.org", "@type": "ItemList",
          "name": "건설 서식", "numberOfItems": len(forms),
          "itemListElement": [
              {"@type": "ListItem", "position": i + 1, "name": f'{x["title"]} 양식',
               "url": f'{SITE}/forms/{x["slug"]}'}
              for i, x in enumerate(forms)]}
    return page(shell, "/forms", title, desc, "".join(out), image, ld)


def form_page(shell, f, others, image=None):
    title = f'{f["title"]} 양식 무료 내려받기 (엑셀) | K-건설맵'
    desc = f'{f.get("short") or ""} {f.get("when") or ""}'.strip()[:150]
    # 검색하는 말 그대로 한 문장 — 억지로 낱말을 늘어놓지 않고 자연스럽게 씁니다.
    lead = (f'{f["title"]} 양식을 엑셀 파일로 무료로 내려받을 수 있습니다. '
            f'회원가입이 필요 없고, 인쇄해서 바로 쓸 수 있습니다.')
    out = [f'<div class="card"><h1 style="font-size:18px;font-weight:800;margin:0">'
           f'{esc(f["title"])} 양식</h1>'
           f'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">'
           f'{esc(f.get("short") or "")}</div>'
           f'<p style="font-size:12.5px;margin:8px 0 0">{esc(lead)}</p>'
           f'<div class="btn-row" style="margin-top:12px">'
           f'<a class="btn primary" href="/forms/{esc(f["slug"])}.xlsx" download>⬇ 엑셀 내려받기</a>'
           f"</div></div>"]
    if f.get("when"):
        out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">언제 내나</div>'
                   f'<div class="fwhen">{esc(f["when"])}</div></div>')
    if f.get("notes"):
        out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">놓치기 쉬운 것</div><ul class="flist">')
        out.extend(f"<li>{esc(n)}</li>" for n in f["notes"])
        out.append("</ul></div>")
    if f.get("attach"):
        out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">함께 내는 서류</div><ul class="flist tight">')
        out.extend(f"<li>{esc(a)}</li>" for a in f["attach"])
        out.append("</ul></div>")
    out.append('<div class="card"><div class="sec-title" style="margin:0 0 8px">미리보기</div>'
               + _sheet_html(f["sheet"]) + "</div>")
    # 안쪽으로 가는 링크 — 같은 갈래의 다른 서식
    same = [o for o in others if o.get("group") == f.get("group") and o["slug"] != f["slug"]][:5]
    if same:
        out.append(rows_html(f'{f.get("group")} 단계의 다른 서식',
                             [(o["title"], "내려받기 →") for o in same],
                             href=lambda t: next((f'/forms/{o["slug"]}' for o in same
                                                  if o["title"] == t), None)))
    out.append('<div class="card"><div class="fwarn2">이 서식은 K-건설맵이 만든 일반 양식입니다. '
               '계약서·과업지시서에 정해진 서식이 있으면 그것을 쓰세요.</div></div>')
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "K-건설맵", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "건설 서식", "item": SITE + "/forms"},
            {"@type": "ListItem", "position": 3, "name": f'{f["title"]} 양식',
             "item": f'{SITE}/forms/{f["slug"]}'}]},
        {"@type": "CreativeWork", "name": f'{f["title"]} 양식',
         "description": (f.get("short") or "")[:200],
         "inLanguage": "ko", "isAccessibleForFree": True,
         "genre": f.get("group") or "건설 서식",
         "url": f'{SITE}/forms/{f["slug"]}',
         "encodingFormat": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
         "publisher": {"@type": "Organization", "name": "K-건설맵", "url": SITE}}]}
    return page(shell, f'/forms/{f["slug"]}', title, desc, "".join(out), image, ld)


# ── 설계변경 (2026-09-05) ───────────────────────────────────────────
#  「설계변경 절차」·「신규비목 단가」·「물가변동 조정」 은 꾸준히 검색되는 말입니다.
#  ⚠️ 내용은 web/src/data/change.json 한 곳에만 있습니다(화면·여기가 같이 읽습니다).
CHANGE_JSON = os.path.join(ROOT, "web", "src", "data", "change.json")


def load_change():
    """{topics, forms} 를 통째로 돌려줍니다 — 서식 묶음도 함께 그려야 하기 때문입니다."""
    try:
        with open(CHANGE_JSON, encoding="utf-8") as f:
            d = json.load(f) or {}
        return d.get("topics") or [], d.get("forms") or [], d.get("mainbook")
    except Exception as e:
        print(f"  · 설계변경 자료를 못 읽었습니다 ({type(e).__name__}) — 건너뜁니다")
        return [], [], None


def _bold(t):
    """**굵게** 만 처리합니다(화면의 md() 와 같은 규칙)."""
    out, parts = [], str(t).split("**")
    for i, x in enumerate(parts):
        out.append(f"<b>{esc(x)}</b>" if i % 2 else esc(x))
    return "".join(out)


def _blocks_html(blocks):
    out = []
    for b in blocks:
        t = b.get("t")
        if t == "p":
            out.append(f'<p class="cp">{_bold(b["text"])}</p>')
        elif t == "warn":
            out.append(f'<div class="cwarn">⚠️ {_bold(b["text"])}</div>')
        elif t == "ul":
            out.append('<ul class="flist">'
                       + "".join(f"<li>{_bold(x)}</li>" for x in b["items"]) + "</ul>")
        elif t == "steps":
            out.append('<div class="csteps">')
            for h, d in b["items"]:
                out.append(f'<div class="cstep"><b>{esc(h)}</b><span>{_bold(d)}</span></div>')
            out.append("</div>")
        elif t == "table":
            out.append('<div class="fscroll"><table class="ctab"><thead><tr>')
            out.extend(f"<th>{esc(c)}</th>" for c in b["cols"])
            out.append("</tr></thead><tbody>")
            for r in b["rows"]:
                out.append("<tr>" + "".join(f"<td>{_bold(c)}</td>" for c in r) + "</tr>")
            out.append("</tbody></table></div>")
        elif t == "links":
            # 공식 자료는 «링크»로만 연결합니다 — 파일을 우리가 퍼오지 않습니다.
            out.append('<div class="clinks">')
            for it in b["items"]:
                nm, url, note = (list(it) + ["", "", ""])[:3]
                out.append('<a class="clink" href="%s" target="_blank" rel="noopener nofollow">'
                           '<span class="ct">%s</span><span class="cd">%s</span>'
                           '<span class="go">↗</span></a>' % (esc(url), esc(nm), esc(note)))
            out.append("</div>")
    return "".join(out)


def change_book_html(bk, in_page=False):
    """설계변경 통합 엑셀 카드 — 화면(Change.jsx 의 MainBook)과 같은 change.json 을 씁니다."""
    if not bk:
        return ""
    out = ['<div class="card mbook"><div class="mb-top"><span class="mb-ic">📊</span>'
           '<div class="grow"><div class="mb-t">%s</div><div class="mb-s">%s</div></div></div>'
           '%s'
           '<a class="btn primary mb-dl" href="/forms/%s.xlsx">⬇ 엑셀 내려받기 (시트 11장)</a>'
           '<div class="mb-grid">'
           % (esc(bk.get("title") or ""), esc(bk.get("sub") or ""),
              ("" if in_page else '<p class="cp" style="margin-top:8px">%s</p>'
               % _bold(bk.get("lead") or "")), esc(bk.get("file") or ""))]
    for i, pair in enumerate(bk.get("sheets") or [], start=1):
        n, d = (pair + ["", ""])[:2]
        out.append('<div class="mb-cell"><b><span class="mb-no">%d</span>%s</b>'
                   '<span>%s</span></div>' % (i, esc(n), esc(d)))
    out.append('</div><div class="mb-rule"><b>이 파일이 쓰는 단가 기준 '
               '(국가계약법 시행령 제65조)</b><ul>')
    for r in (bk.get("rules") or []):
        out.append("<li>%s</li>" % _bold(r))
    out.append('</ul></div><div class="mb-ok">✔ %s</div></div>' % _bold(bk.get("checked") or ""))
    return "".join(out)


def change_naeyeok_page(shell, image=None):
    """/change/naeyeok — 내역서 모음. (2026-09-05)

    목록 자체는 화면이 JSON 으로 받아 그립니다(4,290개를 HTML 에 박으면 무겁습니다).
    여기서는 «이 페이지가 무엇인지» 를 크롤러가 읽을 글자로 남깁니다.
    """
    title = "공사 내역서 모음 2026 — 설계내역서·공내역서 무료 보기 | K-건설맵"
    desc = ("조달청이 공고에 붙여 공개한 2026년 공사 내역서를 갈래별로 모았습니다. "
            "설계내역서에는 발주처 설계 단가가 들어 있습니다. "
            "미리 받아 둔 것은 나라장터 로그인 없이 바로 내려받습니다.")
    kinds = [("설계내역서", "발주처가 잡은 **설계 단가**가 들어 있습니다. 설계변경 단가를 세울 때 견줍니다."),
             ("단가산출서", "단가를 어떻게 만들었는지 근거가 붙어 있습니다."),
             ("공내역서", "**단가가 비어 있습니다** — 낙찰자가 채워 넣는 서식입니다. 공종과 수량을 봅니다."),
             ("물량내역서", "수량만 적힌 표입니다."),
             ("수량산출서", "수량을 어떻게 뽑았는지 산출식이 있습니다."),
             ("그 밖의 내역서", "위 갈래에 안 들어가는 내역 파일입니다.")]
    out = ['<div class="card"><h1 style="font-size:19px;font-weight:800;margin:0">'
           '공사 내역서 모음 — 2026년</h1>'
           '<p class="cp" style="margin-top:8px">조달청이 공고에 붙여 공개한 <b>내역서</b>를 '
           '갈래별로 모았습니다. <b>설계내역서</b>에는 발주처가 잡은 <b>설계 단가</b>가 들어 있어 '
           '설계변경 단가를 세울 때 견줄 수 있습니다.</p>'
           '<div class="cwarn"><b>⬇ 바로 받기</b>가 붙은 것은 K-건설맵이 미리 받아 둔 파일입니다 — '
           '나라장터 로그인 없이 바로 열립니다. 붙어 있지 않은 것은 <b>나라장터 원문</b>으로 '
           '연결되고, 공고가 내려가면 그 파일도 함께 사라집니다.</div></div>'
           '<div class="card"><div class="sec-title" style="margin:0 0 6px">갈래</div>']
    for nm, d in kinds:
        out.append('<div class="frow"><span class="fic">%s</span><div class="grow">'
                   '<div class="t" style="font-weight:700;font-size:13.5px">%s</div>'
                   '<div style="font-size:12px;color:var(--muted);margin-top:2px;line-height:1.6">%s</div>'
                   '</div></div>' % ("💰" if nm in ("설계내역서", "단가산출서") else "📑",
                                     esc(nm), _bold(d)))
    out.append("</div>")
    out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">함께 보기</div>'
               '<a class="row rowlink" href="/change/unit"><span class="fic">📐</span>'
               '<div class="grow"><div class="t">단가·품셈 기준 (2026년 적용)</div>'
               '<div class="d">신규 비목 단가를 어디서 가져오나</div></div>'
               '<span class="go">→</span></a>'
               '<a class="row rowlink" href="/change/excel"><span class="fic">📊</span>'
               '<div class="grow"><div class="t">설계변경 자동계산 엑셀</div>'
               '<div class="d">내역서를 넣으면 증감이 규정 단가로 자동 계산됩니다</div></div>'
               '<span class="go">→</span></a></div>')
    out.append('<div class="card fwarn"><b>ℹ️ 출처</b><div>'
               '모두 <b>발주기관이 나라장터 공고에 붙여 공개한 문서</b>이고, 줄마다 발주기관과 '
               '공고번호를 함께 적었습니다. 단가는 그 공고 시점의 값이니 '
               '<a href="/change/unit" style="color:var(--accent);font-weight:700">'
               '2026년 품셈·시장단가</a>로 한 번 더 확인하시는 편이 안전합니다. '
               '발주기관에서 <b>내려 달라</b>고 알려 주시면 바로 지웁니다.</div></div>')
    ld = {"@context": "https://schema.org", "@type": "CollectionPage",
          "name": "공사 내역서 모음 2026", "url": f"{SITE}/change/naeyeok",
          "description": desc, "inLanguage": "ko",
          "isPartOf": {"@type": "WebSite", "name": "K-건설맵", "url": SITE}}
    return page(shell, "/change/naeyeok", title, desc,
                "".join(out) + nav_html("/change"), image, ld)


NY_KINDS = [
    ("설계내역서", "발주처가 잡은 **설계 단가**가 들어 있습니다. 설계변경 단가를 세울 때 견줍니다."),
    ("단가산출서", "단가를 어떻게 만들었는지 근거가 붙어 있습니다. 일위대가도 여기 들어갑니다."),
    ("공내역서", "**단가가 비어 있습니다** — 낙찰자가 채워 넣는 서식입니다. 공종과 수량을 봅니다."),
    ("물량내역서", "수량만 적힌 표입니다."),
    ("수량산출서", "수량을 어떻게 뽑았는지 산출식이 있습니다."),
    ("그 밖의 내역서", "위 갈래에 안 들어가는 내역 파일입니다."),
]

# ── IndexNow 에 «한 번만» 알릴 정적 주소 ──────────────────────────
#   새로 만든 화면들입니다. 사이트맵에도 있지만 크롤러가 스스로 올 때까지 기다리지 않습니다.
STATIC_NEW = ["/change", "/change/naeyeok", "/change/excel", "/forms", "/guide"] + [
    "/change/naeyeok/" + quote(_k, safe="") for _k, _d in NY_KINDS]


def change_naeyeok_kind_page(shell, kind, rows, meta, image=None):
    """/change/naeyeok/{갈래} — 갈래마다 한 장. (2026-09-06)

    소장님: 「검색에 떠야해, 각종 서식 및 내역서, 설계변경 자료 등」
    「공내역서 양식」 「단가산출서 예시」 는 실제 검색어인데, 지금은 목록 한 장뿐이라
    그 낱말로 들어올 자리가 없었습니다.

    ⚠️ 여기에 수천 줄을 박지 않습니다 — 내용이 얇은 페이지를 수만 장 만드는 것과 같은
       잘못이 됩니다(CLAUDE.md). 최신 30개만 «진짜 파일 이름» 으로 적고 나머지는 목록으로 보냅니다.
    ⚠️ React 에도 같은 주소의 길이 있어야 합니다. 없으면 사람이 눌러 들어왔을 때
       NotFound 가 noindex 를 걸어 버립니다 (CLAUDE.md soft 404).
    """
    d = dict(NY_KINDS).get(kind, "")
    tot = (meta.get("all") or {}).get(kind, 0)
    title = f"{kind} 모음 — 2026년 공공공사 실제 자료 {num(tot)}건 | K-건설맵"
    desc = (f"조달청 나라장터 공고에 붙어 공개된 {kind} {num(tot)}건을 모았습니다. "
            f"{d.replace('**', '')} 무료로 바로 내려받습니다.")
    out = [f'<div class="card"><h1 style="font-size:19px;font-weight:800;margin:0">'
           f'{esc(kind)} 모음 — 2026년</h1>'
           f'<p class="cp" style="margin-top:8px">{_bold(d)} '
           f'조달청 나라장터 공고에 붙어 공개된 것으로, 지금 <b>{num(tot)}건</b> 있습니다'
           f'(최근 {meta.get("days") or 365}일치를 보관합니다).</p>'
           f'<div class="btn-row" style="margin-top:10px">'
           f'<a class="btn primary" href="/change/naeyeok">📑 내역서 모음 전체 보기</a>'
           f'<a class="btn ghost" href="/change/excel">📊 설계변경 자동계산 엑셀</a></div></div>']
    if rows:
        out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">'
                   '최근에 올라온 것</div>')
        for x in rows[:30]:
            href = x["local"] or x["url"]
            btn = "⬇ 바로 받기" if x["local"] else "⬇ 나라장터"
            rel = "" if x["local"] else ' target="_blank" rel="noopener nofollow"'
            tag = ('<em class="dtag ok">단가 확인됨</em>' if x["priced"] == 1 else "")
            out.append('<div class="frow nyrow"><span class="fic">%s</span>'
                       '<div class="grow"><div class="ft">%s %s</div>'
                       '<div class="d">%s</div>'
                       '<div class="nymeta">%s%s</div></div>'
                       '<div class="nybtn"><a class="fdl" href="%s"%s>%s</a>'
                       '<a class="fdl ghost" href="/notice/%s">공고 →</a></div></div>'
                       % ("💰" if x["priced"] == 1 else "📑", esc(x["file"]), tag,
                          esc(x["name"]), esc(x["inst"]),
                          (" · " + esc(x["dt"])) if x.get("dt") else "",
                          esc(href), rel, btn, quote(str(x["no"]), safe="")))
        out.append('</div>')
    out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">다른 갈래</div>')
    for nm, dd in NY_KINDS:
        if nm == kind:
            continue
        n = (meta.get("all") or {}).get(nm, 0)
        if not n:
            continue
        out.append('<a class="row rowlink" href="/change/naeyeok/%s"><span class="fic">%s</span>'
                   '<div class="grow"><div class="t">%s <em>· %s건</em></div>'
                   '<div class="d">%s</div></div><span class="go">→</span></a>'
                   % (quote(nm, safe=""), "💰" if nm in ("설계내역서", "단가산출서") else "📑",
                      esc(nm), num(n), _bold(dd)))
    out.append('</div>')
    ld = {"@context": "https://schema.org", "@type": "CollectionPage",
          "name": f"{kind} 모음 2026", "url": f"{SITE}/change/naeyeok/{quote(kind, safe='')}",
          "description": desc, "inLanguage": "ko",
          "isPartOf": {"@type": "WebSite", "name": "K-건설맵", "url": SITE}}
    # ⚠️ page() 가 안에서 enc_path() 로 «한 번» 인코딩합니다.
    #    여기서 quote 를 걸어 넘기면 %EC → %25EC 로 **두 번** 인코딩되어
    #    canonical 이 «없는 주소» 를 가리킵니다 → 그 페이지는 영영 색인이 안 됩니다.
    #    (CLAUDE.md 의 checkmath.mjs 한글 폴더 사고와 똑같은 잘못입니다)
    #    기관·업체 페이지처럼 **원본 이름 그대로** 넘깁니다.
    return page(shell, f"/change/naeyeok/{kind}", title, desc,
                "".join(out) + nav_html("/change"), image, ld)


def change_book_page(shell, bk, forms, image=None):
    """/change/excel — 통합 엑셀 «전용 페이지». (2026-09-05)

    왜 따로 굽나: 「설계변경 내역서 엑셀」·「공사원가계산서 양식」 은 실제로 검색되는 말인데,
    그 파일이 설계변경 탭 «안»에만 있으면 검색에서 찾아올 주소가 없었습니다.
    네이버는 자바스크립트를 거의 안 돌리므로, 이 글자가 HTML 에 있어야 읽힙니다.
    """
    if not bk:
        return None
    by = {f["slug"]: f for f in forms}
    title = bk.get("seo_title") or f'{bk["title"]} 무료 내려받기 | K-건설맵'
    desc = (bk.get("seo_desc") or bk.get("lead") or "")[:160]
    xlsx = f'/forms/{bk.get("file")}.xlsx'
    out = [f'<div class="card"><h1 style="font-size:19px;font-weight:800;margin:0">'
           f'{esc(bk.get("h1") or bk["title"])}</h1>'
           f'<p class="cp" style="margin-top:8px">{_bold(bk.get("lead") or "")}</p>'
           f'<div class="btn-row" style="margin-top:10px">'
           f'<a class="btn primary" href="{esc(xlsx)}">⬇ 엑셀 내려받기 (시트 11장)</a>'
           f'<a class="btn ghost" href="/change">설계변경 자료 보기</a></div></div>']
    out.append(change_book_html(bk, in_page=True))

    if bk.get("use"):
        out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">이럴 때 씁니다</div>')
        for pair in bk["use"]:
            h, d = (list(pair) + ["", ""])[:2]
            out.append('<div class="frow"><span class="fic">▸</span><div class="grow">'
                       '<div class="t" style="font-weight:700;font-size:13.5px">%s</div>'
                       '<div style="font-size:12px;color:var(--muted);margin-top:2px;line-height:1.6">%s</div>'
                       '</div></div>' % (esc(h), _bold(d)))
        out.append("</div>")

    if bk.get("faq"):
        out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">자주 묻는 것</div>')
        for pair in bk["faq"]:
            q, a = (list(pair) + ["", ""])[:2]
            out.append('<details class="cfaq" open><summary>%s</summary><div>%s</div></details>'
                       % (esc(q), _bold(a)))
        out.append("</div>")

    if bk.get("related"):
        out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">함께 쓰는 서식</div>')
        for slug in bk["related"]:
            f = by.get(slug)
            if not f:
                continue
            out.append('<div class="frow"><span class="fic">%s</span><div class="grow">'
                       '<a class="ft" href="/forms/%s">%s</a><div class="d">%s</div></div>'
                       '<a class="fdl" href="/forms/%s.xlsx">⬇ 엑셀</a></div>'
                       % (esc(f.get("icon") or "📄"), esc(slug), esc(f["title"]),
                          esc(f.get("short") or ""), esc(slug)))
        out.append('<div style="margin-top:10px"><a class="btn ghost sm" href="/forms">'
                   '건설 서식 105가지 전부 보기 →</a></div></div>')

    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "CreativeWork", "name": bk["title"],
         "description": desc, "url": f"{SITE}/change/excel",
         "encodingFormat": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
         "fileFormat": "xlsx", "isAccessibleForFree": True,
         "inLanguage": "ko",
         "publisher": {"@type": "Organization", "name": "K-건설맵", "url": SITE}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "설계변경", "item": f"{SITE}/change"},
            {"@type": "ListItem", "position": 2, "name": bk["title"],
             "item": f"{SITE}/change/excel"}]},
    ]}
    if bk.get("faq"):
        ld["@graph"].append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a.replace("**", "")}}
            for q, a in [(list(x) + ["", ""])[:2] for x in bk["faq"]]]})
    return page(shell, "/change/excel", title, desc,
                "".join(out) + nav_html("/change"), image, ld)


def change_forms_html(sets, forms):
    """설계변경 서식 묶음 — 화면(Change.jsx 의 ChangeForms)과 «같은 change.json» 을 씁니다.
       크롤러가 이 링크를 따라가야 서식 105장이 발견됩니다."""
    if not sets:
        return ""
    by = {f["slug"]: f for f in forms}
    n = sum(len(g.get("slugs") or []) for g in sets)
    out = ['<div class="card"><div class="sec-title" style="margin:0 0 2px">'
           f'📄 설계변경 서식 <span class="count">{n}가지 · 엑셀 · 무료</span></div>'
           '<div style="font-size:12px;color:var(--muted);margin:0 0 10px">'
           '내려받아 바로 쓰는 엑셀입니다. 회원가입 없습니다.</div>']
    for g in sets:
        out.append('<div class="fset"><div class="fset-h"><b>%s</b><em>%s</em></div>'
                   % (esc(g.get("h") or ""), esc(g.get("why") or "")))
        for slug in (g.get("slugs") or []):
            f = by.get(slug)
            if not f:
                continue
            out.append('<div class="frow"><span class="fic">%s</span><div class="grow">'
                       '<a class="ft" href="/forms/%s">%s</a><div class="d">%s</div></div>'
                       '<a class="fdl" href="/forms/%s.xlsx">⬇ 엑셀</a></div>'
                       % (esc(f.get("icon") or "📄"), esc(slug), esc(f["title"]),
                          esc(f.get("short") or ""), esc(slug)))
        out.append("</div>")
    out.append("</div>")
    return "".join(out)


def change_index(shell, topics, fsets, book, image=None):
    title = "설계변경 — 절차·단가 기준·증감 계산기 | K-건설맵"
    desc = ("공공 공사 설계변경의 절차, 계약금액 조정 단가 기준(증가 물량·신규비목), "
            "물가변동 조정, 공기연장과 간접비를 정리했습니다. 증감 계산기와 서식도 무료입니다.")
    out = ['<div class="card"><h1 style="font-size:18px;font-weight:800;margin:0">설계변경</h1>'
           '<div style="font-size:12.5px;color:var(--muted);margin-top:4px">'
           '절차 · 단가 기준 · 물가변동 · 공기연장 · 서식까지 한자리에</div>'
           '<p class="cp" style="margin-top:8px">설계변경은 «공사를 바꾸는 일»이 아니라 '
           '<b>계약을 바꾸는 일</b>입니다. 순서를 놓치면 시공을 다 해 놓고도 정산이 막힙니다.</p>'
           '<div class="btn-row" style="margin-top:10px">'
           '<a class="btn primary" href="/change/calc">🧮 증감 계산기 열기</a>'
           '<a class="btn ghost" href="/forms">📄 설계변경 서식</a></div></div>'
           '<div class="card"><div class="sec-title" style="margin:0 0 6px">무엇부터 보면 되나</div>']
    for t in topics:
        out.append(f'<a class="row rowlink" href="/change/{esc(t["slug"])}">'
                   f'<div class="grow"><div class="t">{esc(t["title"])} · {esc(t.get("sub") or "")}</div>'
                   f'<div class="d">{esc(t.get("short") or "")}</div></div>'
                   f'<span class="go">→</span></a>')
    out.append("</div>")
    out.append(change_book_html(book))
    # ⚠️ 여기에 링크가 없으면 /change/naeyeok 은 사이트맵으로만 닿는 «외딴 페이지» 가 됩니다.
    #    크롤러는 /change 를 먼저 읽습니다 — 거기서 가는 길이 있어야 합니다.
    out.append('<a class="card fbook" href="/change/naeyeok"><span class="fic">📑</span>'
               '<div class="grow"><div class="t">공사 내역서 모음 <em>· 2026년 · 조달청 공개</em></div>'
               '<div class="d">발주처가 공고에 붙인 <b>설계내역서·공내역서</b>를 갈래별로 모았습니다. '
               '설계내역서에는 <b>설계 단가</b>가 들어 있고, 미리 받아 둔 것은 '
               '<b>나라장터 로그인 없이 바로</b> 받습니다.</div></div>'
               '<span class="go">→</span></a>')
    out.append(change_forms_html(fsets, load_forms()))
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "설계변경 자료",
          "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": t["title"],
                               "url": f'{SITE}/change/{t["slug"]}'}
                              for i, t in enumerate(topics)]}
    return page(shell, "/change", title, desc, "".join(out), image, ld)


def change_topic(shell, t, others, image=None):
    title = f'{t["title"]} — 공공공사 설계변경 | K-건설맵'
    desc = f'{t.get("short") or ""} {t.get("lead") or ""}'.strip()[:150]
    out = [f'<div class="card"><h1 style="font-size:18px;font-weight:800;margin:0">'
           f'{esc(t["title"])}</h1>'
           f'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">{esc(t.get("sub") or "")}</div>'
           f'<p class="cp" style="margin-top:8px">{_bold(t.get("lead") or "")}</p></div>']
    for sec in t.get("secs") or []:
        out.append('<div class="card"><div class="sec-title" style="margin:0 0 8px">'
                   + esc(sec["h"]) + "</div>" + _blocks_html(sec["blocks"]) + "</div>")
    out.append(rows_html("이어서 볼 것",
                         [(o["title"], "보기 →") for o in others],
                         href=lambda x: next((f'/change/{o["slug"]}' for o in others
                                              if o["title"] == x), None)))
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "K-건설맵", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "설계변경", "item": SITE + "/change"},
            {"@type": "ListItem", "position": 3, "name": t["title"],
             "item": f'{SITE}/change/{t["slug"]}'}]},
        {"@type": "Article", "headline": t["title"],
         "description": (t.get("short") or "")[:200], "inLanguage": "ko",
         "url": f'{SITE}/change/{t["slug"]}',
         "publisher": {"@type": "Organization", "name": "K-건설맵", "url": SITE}}]}
    return page(shell, f'/change/{t["slug"]}', title, desc, "".join(out), image, ld)


def change_calc(shell, image=None):
    title = "설계변경 증감 계산기 — 신규비목·낙찰률 | K-건설맵"
    desc = ("설계변경 계약금액 조정을 증가 물량·감소 물량·신규비목으로 나누어 계산합니다. "
            "신규비목은 설계변경 당시 단가에 낙찰률을 곱합니다. 무료·회원가입 없음.")
    out = ['<div class="card"><h1 style="font-size:18px;font-weight:800;margin:0">'
           '설계변경 증감 계산기</h1>'
           '<p class="cp" style="margin-top:8px">계약금액과 예정가격을 넣으면 낙찰률이 나오고, '
           '항목마다 <b>증가·감소·신규비목</b>을 골라 적으면 규정대로 조정액을 계산합니다. '
           '증가 물량은 계약단가, 신규비목은 «설계변경 당시 단가 × 낙찰률»이 적용됩니다.</p></div>'
           '<div class="card"><div class="sec-title" style="margin:0 0 6px">계산 기준</div>'
           + _blocks_html([{"t": "table", "cols": ["구분", "적용 단가"], "rows": [
               ["감소된 물량", "계약단가"],
               ["증가된 물량", "**계약단가** (계약단가 > 예정가격단가면 예정가격단가)"],
               ["신규 비목", "**설계변경 당시 단가 × 낙찰률**"],
               ["발주기관 요구", "협의 · 불성립 시 두 값의 중간"]]}])
           + "</div>"]
    return page(shell, "/change/calc", title, desc, "".join(out), image)



# ── 입찰 알아보기 (2026-09-06) ──────────────────────────────────
#  이 사이트가 «직접 재서» 쓴 글입니다 — 개찰 1만여 건 실측이 근거입니다.
#  ⚠️ 내용은 web/src/data/guide.json 한 곳에만 있습니다(화면·여기가 같이 읽습니다).
#     설계변경(change.json)과 «같은 스키마·같은 블록 종류» 라 _blocks_html 을 그대로 씁니다.
GUIDE_JSON = os.path.join(ROOT, "web", "src", "data", "guide.json")


def load_guide():
    try:
        with open(GUIDE_JSON, encoding="utf-8") as f:
            return (json.load(f) or {}).get("topics") or []
    except Exception as e:
        print(f"  · 입찰 알아보기 자료를 못 읽었습니다 ({type(e).__name__}) — 건너뜁니다")
        return []


def guide_index(shell, topics, image=None):
    title = "입찰 알아보기 — 투찰금액·사정률·참가업체수 | K-건설맵"
    desc = ("공공 공사 입찰의 투찰금액이 어떻게 정해지는지, 사정률·낙찰하한율·A값이 무엇인지 "
            "개찰 1만여 건을 직접 재서 정리했습니다. 회원가입 없이 무료입니다.")
    out = ['<div class="card"><h1 style="font-size:18px;font-weight:800;margin:0">'
           '입찰 알아보기</h1>'
           '<div style="font-size:12.5px;color:var(--muted);margin-top:4px">'
           '투찰금액 계산 · 사정률 · 분위 · 참가업체수 · 추첨번호</div>'
           '<p class="cp" style="margin-top:8px">여기 적힌 숫자는 어디서 옮겨 온 것이 아니라 '
           '<b>조달청 나라장터 개찰 결과를 직접 모아 센 것</b>입니다. 표본 건수를 문단마다 '
           '함께 적었습니다 — 표본이 적으면 적다고 씁니다.</p></div>'
           '<div class="card"><div class="sec-title" style="margin:0 0 6px">무엇부터 보면 되나</div>']
    for t in topics:
        out.append(f'<a class="row rowlink" href="/guide/{esc(t["slug"])}">'
                   f'<div class="grow"><div class="t">{esc(t["title"])}</div>'
                   f'<div class="d">{esc(t.get("sub") or t.get("short") or "")}</div></div>'
                   f'<span class="go">→</span></a>')
    out.append("</div>")
    out.append('<div class="card"><div class="sec-title" style="margin:0 0 6px">'
               '읽고 나서 바로 써 보기</div>'
               '<div class="btn-row"><a class="btn primary" href="/">💰 바로투찰 — 권장 금액 내보기</a>'
               '<a class="btn ghost" href="/live">📋 마감 전 공고 보기</a></div></div>')
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "입찰 알아보기",
          "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": t["title"],
                               "url": f'{SITE}/guide/{t["slug"]}'}
                              for i, t in enumerate(topics)]}
    return page(shell, "/guide", title, desc, "".join(out) + nav_html("/guide"), image, ld)


def guide_topic(shell, t, others, image=None):
    # 제목에 이미 «—» 가 있으면 덧붙이지 않습니다 — 「… — 실측 8,424건 — 공공공사 입찰」 처럼
    # 줄표가 두 번 나오면 검색결과에서 읽기 나빠집니다.
    title = (f'{t["title"]} | K-건설맵' if "—" in t["title"]
             else f'{t["title"]} — 공공공사 입찰 | K-건설맵')
    desc = f'{t.get("short") or ""} {t.get("lead") or ""}'.strip()[:150]
    out = [f'<div class="card"><h1 style="font-size:18px;font-weight:800;margin:0">'
           f'{esc(t["title"])}</h1>'
           f'<div style="font-size:12.5px;color:var(--muted);margin-top:4px">'
           f'{esc(t.get("sub") or "")}</div>'
           f'<p class="cp" style="margin-top:8px">{_bold(t.get("lead") or "")}</p></div>']
    for sec in t.get("secs") or []:
        out.append('<div class="card"><div class="sec-title" style="margin:0 0 8px">'
                   + esc(sec["h"]) + "</div>" + _blocks_html(sec["blocks"]) + "</div>")
    out.append(rows_html("이어서 볼 것",
                         [(o["title"], "보기 →") for o in others],
                         href=lambda x: next((f'/guide/{o["slug"]}' for o in others
                                              if o["title"] == x), None)))
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "K-건설맵", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "입찰 알아보기",
             "item": SITE + "/guide"},
            {"@type": "ListItem", "position": 3, "name": t["title"],
             "item": f'{SITE}/guide/{t["slug"]}'}]},
        {"@type": "Article", "headline": t["title"],
         "description": (t.get("short") or "")[:200], "inLanguage": "ko",
         "url": f'{SITE}/guide/{t["slug"]}',
         "publisher": {"@type": "Organization", "name": "K-건설맵", "url": SITE}}]}
    return page(shell, f'/guide/{t["slug"]}', title, desc,
                "".join(out) + nav_html("/guide"), image, ld)


# 탭 페이지 — 지금은 전부 홈과 같은 제목이라 색인에서 서로 잡아먹습니다
TABS = [
    ("/first", "오늘의 1순위 개찰 결과 — 낙찰업체·투찰률 | K-건설맵",
     "조달청 나라장터 개찰 결과를 매일 모아 보여드립니다. 공고별 1순위 낙찰업체, 투찰률, 기초금액, 예정가격을 무료로 확인하세요.",
     ("오늘의 1순위 개찰 결과", "누가 얼마에 땄나 · 매일 갱신", "낙찰업체·투찰률",
      "조달청 나라장터 개찰 결과 · 회원가입 없이 무료")),
    ("/live", "마감 전 공공 입찰 공고 — 기초금액·권장 투찰금액 | K-건설맵",
     "마감 전 나라장터 공사 공고를 지역·면허로 걸러 봅니다. 기초금액이 실린 공고는 카드에서 바로 권장 투찰금액이 나옵니다.",
     ("마감 전 공공 입찰 공고", "지역·면허로 걸러 봅니다", "권장 투찰금액",
      "기초금액이 실린 공고는 카드에서 바로 금액이 나옵니다")),
    ("/analysis", "발주기관·업체 낙찰 분석 — 3년치 개찰 기록 | K-건설맵",
     "발주기관의 낙찰률 성향과 업체별 낙찰 실적을 3년치 개찰 기록으로 분석합니다. 회원가입 없이 무료.",
     ("발주기관·업체 낙찰 분석", "3년치 개찰 기록으로 봅니다", "자가진단",
      "우리 회사가 어디에 강한지 · 그 기관은 어떤 자리인지")),
    ("/jobs", "건설 구인구직 — 현장 인력·장비 | K-건설맵",
     "건설 현장 구인구직 글을 올리고 봅니다. 로그인 없이 무료.",
     ("건설 구인구직", "현장 인력·장비", "무료",
      "로그인 없이 올리고 봅니다")),
]


def main():
    shell = read_shell()
    made = 0

    # ── IndexNow ── 지난 회차에 구워서 «이미 배포된» 주소를 검색엔진에 알립니다.
    #   ⚠️ 이번에 굽는 것을 지금 보내면 아직 배포 전이라 크롤러가 404 를 봅니다.
    #      그래서 «한 회차 뒤에» 보냅니다 (워크플로를 안 고치려는 설계이기도 합니다).
    indexnow.ensure_key_file(DIST)
    sent = None
    try:
        sent = indexnow.send(quiet=True)
    except Exception as e:
        print(f"  · IndexNow 건너뜀 ({type(e).__name__}: {e})")
    og = OgMaker(DIST, FONT, {"won_short": won_short, "pct": pct,
                              "num": num, "date_full": date_full})
    og.default()

    # 탭·홈은 **맨 끝** 에서 굽습니다 - 그 안에 걸 링크가 «실제로 구운 주소» 인지
    #    알려면 기관·업체·공고를 다 구운 뒤여야 하기 때문입니다.
    #    (그림은 여기서 미리 만들어 둡니다 - 자료와 상관없습니다)
    tab_img = {path: og.tab(path.strip("/"), *card) for path, _t, _d, card in TABS}

    # ── 건설 서식 ── 변하지 않는 자료라 매 회차 다시 구워도 부담이 없습니다(13장).
    forms = load_forms()
    if forms:
        write("forms.html", forms_index(shell, forms,
              og.tab("forms", "건설 서식", "착공계·기성청구서·작업일보",
                     f"{len(forms)}가지", "엑셀로 바로 내려받기 · 회원가입 없음")
              if og.available else None))
        made += 1
        for f in forms:
            img = (og.tab(f'forms-{f["slug"]}', f["title"],
                          f.get("sub") or "건설 서식", "엑셀",
                          (f.get("short") or "")[:44])
                   if og.available else None)
            write(f'forms/{f["slug"]}.html', form_page(shell, f, forms, img))
            made += 1
        print(f"  · 건설 서식 페이지 {len(forms) + 1:,}개 (/forms/)")

    # ── 설계변경 ──
    topics, fsets, book = load_change()
    if topics:
        write("change.html", change_index(shell, topics, fsets, book,
              og.tab("change", "설계변경", "절차 · 단가 기준 · 물가변동",
                     f"{len(topics)}가지", "증감 계산기 · 서식까지 무료")
              if og.available else None))
        bp = change_book_page(shell, book, load_forms(),
                              og.tab("change-excel", "설계변경 자동계산 엑셀",
                                     "시트 11장 · 수식 전부 연결", "무료",
                                     "단가 하나 바꾸면 조정금액까지 다시 계산") if og.available else None)
        if bp:
            write("change/excel.html", bp)
        write("change/naeyeok.html", change_naeyeok_page(shell,
              og.tab("change-naeyeok", "공사 내역서 모음", "설계내역서 · 공내역서 · 2026년",
                     "무료", "조달청 공개 자료 · 나라장터 원문으로 연결")
              if og.available else None))
        # 갈래마다 한 장 — 「공내역서 양식」 같은 낱말로 들어올 자리 (2026-09-06)
        _nym, _nyr = load_naeyeok_meta()
        for _k, _ in NY_KINDS:
            if not (_nym.get("all") or {}).get(_k):
                continue
            write("change/naeyeok/%s.html" % _k,
                  change_naeyeok_kind_page(shell, _k, _nyr.get(_k) or [], _nym,
                                           og.tab("ny-" + _k, _k + " 모음",
                                                  "2026년 · 조달청 공개", "무료",
                                                  "공공공사 실제 자료")
                                           if og.available else None))
            made += 1
        write("change/calc.html", change_calc(shell,
              og.tab("change-calc", "설계변경 증감 계산기", "증가·감소·신규비목",
                     "무료", "신규비목은 설계변경 당시 단가 × 낙찰률")
              if og.available else None))
        made += 2
        for t in topics:
            others = [o for o in topics if o["slug"] != t["slug"]][:4]
            img = (og.tab(f'change-{t["slug"]}', t["title"], t.get("sub") or "설계변경",
                          "설계변경", (t.get("short") or "")[:44]) if og.available else None)
            write(f'change/{t["slug"]}.html', change_topic(shell, t, others, img))
            made += 1
        print(f"  · 설계변경 페이지 {len(topics) + 2:,}개 (/change/)")

    # ── 입찰 알아보기 ──
    gtopics = load_guide()
    if gtopics:
        write("guide.html", guide_index(shell, gtopics,
              og.tab("guide", "입찰 알아보기", "투찰금액 · 사정률 · 참가업체수",
                     f"{len(gtopics)}편", "개찰 1만여 건 실측")
              if og.available else None))
        made += 1
        for t in gtopics:
            others = [o for o in gtopics if o["slug"] != t["slug"]][:4]
            img = (og.tab(f'guide-{t["slug"]}', t["title"], t.get("sub") or "입찰 알아보기",
                          "실측", (t.get("short") or "")[:44]) if og.available else None)
            write(f'guide/{t["slug"]}.html', guide_topic(shell, t, others, img))
            made += 1
        print(f"  · 입찰 알아보기 페이지 {len(gtopics) + 1:,}개 (/guide/)")

    # ★ 링크 목록을 «굽기 전에» 만듭니다 — 없는 주소로 링크를 걸지 않기 위해서입니다.
    L = Links()

    # ── 발주기관 ──
    top = load("agency/top.json") or []
    by_chunk = {}
    for row in top[:N_AGENCY]:
        if len(row) >= 3 and safe(row[0]):
            by_chunk.setdefault(row[2], []).append(row[0])
            L.ag.add(row[0])
    n_ag = 0
    for ch, names in sorted(by_chunk.items()):
        dat = load(f"agency/dat/{ch}.json") or {}
        for nm in names:
            a = dat.get(nm)
            if a:
                img = og.agency(nm, a) if n_ag < OG_AGENCY else None
                n_ag += img is not None
                write(f"agency/{nm}.html", agency_page(shell, nm, a, img, L))
                made += 1

    # ── 업체 ──
    ctop = load("corp/top.json") or []
    if not ctop:
        print("  · corp/top.json 이 없습니다 — build_json.py 를 한 번 돌리면 생깁니다")
    by_chunk = {}
    for row in ctop[:N_CORP]:
        if len(row) >= 3 and safe(row[0]):
            by_chunk.setdefault(row[2], []).append(row[0])
            L.co.add(row[0])
    n_co = 0
    for ch, keys in sorted(by_chunk.items()):
        dat = load(f"corp/dat/{ch}.json") or {}
        for k in keys:
            c = dat.get(k)
            if c:
                img = og.corp(k, c) if n_co < OG_CORP else None
                n_co += img is not None
                write(f"corp/{k}.html", corp_page(shell, k, c, img, L))
                made += 1

    # ── 「어제의 개찰 성적표」 ── (공고 페이지보다 먼저: first 를 여기서 한 번 읽습니다)
    live = load_store("live")
    first = load_store("first")
    n_dy = 0
    days = []
    for d in dailymod.dates_of(first, N_DAILY):
        dd = dailymod.daily_data(first, d)
        if not dd:
            continue
        days.append((d, dd["n"]))
        img = og.daily(dd) if og.available else None
        write(f"daily/{d}.html", daily_page(shell, dd, img, L))
        n_dy += 1
        made += 1
    if days:
        write("daily.html", daily_index(shell, days,
                                        og.tab("daily", "날짜별 개찰 성적표",
                                               "하루 한 장 · 개찰이 올라오는 대로",
                                               f"{days[0][0].replace('-', '.')}",
                                               f"가장 최근 개찰 {num(days[0][1])}건") if og.available else None))
        made += 1

    # ── 공고·개찰 ──
    merged = dict(live)
    merged.update(first)          # 개찰이 이겼습니다(결과가 더 풍부)
    order = sorted(merged.values(),
                   key=lambda r: str(r.get("dt") or r.get("close") or ""), reverse=True)
    n_no = 0
    baked = []
    nydocs = load_naeyeok_by_notice()      # 공고번호 → 붙임 내역서 (collect.py 가 갈래를 매긴 것)
    if nydocs:
        print(f"  · 붙임 내역서가 있는 공고 {len(nydocs):,}건 — 공고 페이지에 함께 적습니다")
    for r in order:
        if n_no >= N_NOTICE:
            break
        no = safe_no(r.get("no"))
        if not no:
            continue
        img = og.notice(r) if n_no < OG_NOTICE else None
        write(f"notice/{no}.html",
              notice_page(shell, r, img, L, nydocs.get(str(r.get("no") or ""))))
        baked.append(r)
        n_no += 1
        made += 1
    if not order:
        print("  · data/store 가 없어 공고 페이지는 건너뜁니다 (collect.py 를 한 번 돌리면 생깁니다)")

    # 새로 생긴 주소만 다음 회차에 알립니다 (같은 주소를 하루에도 몇 번씩 찌르면 스팸입니다).
    try:
        _st = indexnow._load()
        fresh, mark = indexnow.new_since(baked, _st.get("mark"))
        paths = [f"/daily/{d}" for d, _ in days[:2]]
        paths += [f"/notice/{quote(str(r.get('no')), safe='')}" for r in fresh]
        # ⚠️ 2026-09-06 — 여기가 비어서 **내역서 페이지가 한 장도 안 나갔습니다.**
        #    new_since 는 «새 개찰» 만 봅니다. 새로 만든 정적 페이지와,
        #    이미 있던 공고인데 «내역서가 붙어 내용이 새로 생긴 것» 은 차례가 안 옵니다.
        #    실측 /indexnow-status.json: 한 회차에 보낸 주소가 6개뿐이었습니다.
        #    ⚠️ 2026-09-06 저녁 — 글 5편의 «각 글 주소» 가 빠져 있었습니다.
        #       STATIC_NEW 에는 목록(/guide)만 있었습니다. 목록 한 장만 알리면
        #       빙·네이버는 그 안의 글 5편을 «스스로 찾아올 때까지» 기다립니다.
        #       사이트맵에는 있으니 언젠가 오지만, IndexNow 는 «지금 보라» 고 찌르는 것이라
        #       알릴 주소에 안 넣으면 그 값어치를 못 씁니다. 글마다 넣습니다.
        _static = STATIC_NEW + [f'/guide/{t["slug"]}' for t in load_guide()]
        st_new, _ = indexnow.take_once("static", _static, n=len(_static))
        ny_paths = [f"/notice/{safe_no(r.get('no'))}" for r in baked
                    if str(r.get("no") or "") in nydocs and safe_no(r.get("no"))]
        ny_new, ny_left = indexnow.take_once("naeyeok", ny_paths)
        paths += st_new + ny_new
        n_q = indexnow.queue(paths, mark=mark)
        print(f"  · IndexNow 다음 회차에 알릴 주소 {n_q:,}개 "
              f"(새 개찰 {len(fresh):,} · 처음 알리는 정적 {len(st_new):,} · "
              f"내역서 {len(ny_new):,} · 내역서 남은 것 {ny_left:,})")
        # 로그를 못 볼 때를 대비해 결과를 사이트에 남깁니다 → /indexnow-status.json
        # (robots.txt 가 /data/ 를 막고 있어 뿌리에 둡니다 — 확인 도구가 못 읽었습니다)
        indexnow.write_report(DIST, sent, {"n": n_q, "새개찰": len(fresh),
                                           "처음알리는정적": len(st_new),
                                           "내역서": len(ny_new),
                                           "내역서남은것": ny_left,
                                           "예": paths[:5]})
    except Exception as e:
        print(f"  · IndexNow 목록 만들기 실패 ({type(e).__name__}: {e}) — 넘어갑니다")

    # -- 홈 · 탭 -- 여기서 거는 링크는 «방금 구운 주소» 뿐입니다.
    ov = load("overview.json") or {}
    ag_rows = [(L.agency(r[0]), r[0], f"{num(r[1])}건")
               for r in (top or [])[:N_AGENCY] if len(r) >= 2 and safe(r[0])]
    co_rows = [(L.corp(r[0]), (r[3] if len(r) >= 4 else r[0]), f"{num(r[1])}건")
               for r in (ctop or [])[:N_CORP] if len(r) >= 2 and safe(r[0])]
    done_rows, open_rows = [], []
    for r in baked:
        no = safe_no(r.get("no"))
        if not no:
            continue
        u = "/notice/" + quote(no, safe="")
        nm = str(r.get("name") or no)
        if r.get("win"):
            if len(done_rows) < 24:
                done_rows.append((u, nm, pct(r.get("rate"), 3) or date_full(r.get("dt")) or ""))
        elif len(open_rows) < 24:
            open_rows.append((u, nm, won_short(r.get("base")) or date_full(r.get("close")) or ""))
    day_rows = [(f"/daily/{d}", f"{d} 개찰 결과", f"{num(c)}건") for d, c in days[:12]]
    gd_rows = [(f'/guide/{t["slug"]}', t["title"], "실측") for t in (gtopics or [])]
    ch_rows = [(f'/change/{t["slug"]}', t["title"], "") for t in (topics or [])[:8]]
    fm_rows = [(f'/forms/{f["slug"]}', f["title"], "엑셀") for f in (forms or [])[:10]]

    c_done = link_card("🏆 최근 개찰 결과", done_rows[:12],
                       "누가 얼마에 땄는지 - 낙찰업체·투찰률·기초금액을 공고마다 한 장으로 봅니다.")
    c_open = link_card("📋 마감 전 입찰 공고", open_rows[:12],
                       "기초금액이 실린 공고는 권장 투찰금액을 바로 냅니다.")
    c_ag = link_card("🏛 낙찰 기록이 많은 발주기관", ag_rows[:20])
    c_co = link_card("🏢 낙찰 실적이 많은 업체", co_rows[:20])
    c_day = link_card("📅 날짜별 개찰 성적표", day_rows)
    c_gd = link_card("📚 입찰 알아보기", gd_rows)
    c_ch = link_card("🧾 설계변경", ch_rows)
    c_fm = link_card("📄 건설 서식 내려받기", fm_rows)

    span = ""
    if ov.get("from") and ov.get("to"):
        span = f'({esc(ov["from"])} ~ {esc(ov["to"])})'
    p1 = []
    if ov.get("rows"):
        p1.append(f'조달청 나라장터 공사 개찰 <b>{num(ov["rows"])}건</b>{span}을 모았습니다.')
    if ov.get("agencies") and ov.get("corps"):
        p1.append(f'발주기관 <b>{num(ov["agencies"])}곳</b> · 업체 '
                  f'<b>{num(ov["corps"])}곳</b> 의 낙찰 기록을 회원가입 없이 무료로 봅니다.')
    home = lead_card("K-건설맵 - 공공공사 입찰 투찰금액 계산",
                     [" ".join(p1) or None,
                      "공고를 고르면 기초금액·추정가격·A값·낙찰하한율이 자동으로 채워지고, "
                      "권장 투찰금액이 바로 나옵니다. 사정률은 투찰 뒤에 추첨으로 정해지므로 "
                      "«실격이냐»는 미리 단정하지 않고 확률로 적습니다."])
    home += c_done + c_open + c_ag + c_co + c_day + c_gd + c_ch + c_fm
    h_title, h_desc = shell_meta(shell)
    write("index.html", page(shell, "/", h_title, h_desc, home))
    made += 1

    tab_body = {
        "/first": (lead_card("오늘의 1순위 개찰 결과",
                             ["조달청이 공개한 개찰 결과를 모아 공고마다 한 장으로 정리합니다. "
                              "낙찰업체·투찰률·기초금액·예정가격·참가업체수를 함께 봅니다."])
                   + c_done + c_day + c_ag),
        "/live": (lead_card("마감 전 공공 입찰 공고",
                            ["마감 전 나라장터 공사 공고를 지역·면허로 걸러 봅니다. "
                             "기초금액이 실린 공고는 카드에서 바로 권장 투찰금액이 나옵니다."])
                  + c_open + c_ag),
        "/analysis": (lead_card("발주기관 · 업체 낙찰 분석",
                                ["발주기관이 어떤 자리인지(투찰률 분포·경쟁 강도)와 "
                                 "업체가 어디에 강한지를 3년치 개찰 기록으로 봅니다."])
                      + c_ag + c_co),
        "/jobs": lead_card("건설 구인구직",
                           ["건설 현장 인력·장비 구인구직 글을 로그인 없이 올리고 봅니다."]),
    }
    for path, title, desc, _card in TABS:
        write(path.lstrip("/") + ".html",
              page(shell, path, title, desc, tab_body.get(path, ""), tab_img.get(path)))
        made += 1
    _nl = home.count('<a class="t"')
    print(f"  · 홈 본문 링크 {_nl:,}개 (기관 {len(ag_rows[:20])} · 업체 {len(co_rows[:20])} "
          f"· 개찰 {len(done_rows[:12])} · 공고 {len(open_rows[:12])})")
    if _nl < 20:
        print("  [!] 홈 링크가 20개도 안 됩니다 - 크롤러가 안쪽으로 들어갈 길이 좁습니다.")

    print(f"  · 공고·개찰 페이지 {n_no:,}개 (저장소 {len(merged):,}건 중)")
    print(f"  · 개찰 성적표 {n_dy:,}일치 (/daily/)")
    print(f"  · 미리 구운 페이지 {made:,}개 (기관 {len(top[:N_AGENCY]):,} · 업체 {len(ctop[:N_CORP]):,} 대상)")
    if og.available:
        print(f"  · 카톡 미리보기 그림 {og.made:,}장 "
              f"(공고 {min(n_no, OG_NOTICE):,} · 기관 {n_ag:,} · 업체 {n_co:,} · 기본 1)")
        print("    나머지 페이지는 기본 카드(/og/default.png)를 씁니다 — 늘리려면 OG_NOTICE 를 올리세요.")
        if og.bad:
            print(f"  ⚠️ 그 중 {og.bad:,}장은 글자가 칸을 벗어났습니다 — ogcard.py 의 자리를 고쳐야 합니다.")


if __name__ == "__main__":
    main()
