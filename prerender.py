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
        return f.read()


# 크롤러가 «어디로 갈지» — 미리 구운 HTML 에는 하단 탭이 없습니다(React 가 그립니다).
# 그래서 크롤러가 개찰 페이지에 내려앉으면 갈 곳이 한 곳도 없었습니다(실측: 링크 1개).
# 사람에게는 React 가 마운트되면서 사라지고 진짜 탭바가 대신 그려집니다.
SITENAV = [("/", "바로투찰"), ("/first", "1순위 개찰"), ("/live", "입찰 공고"),
           ("/forms", "건설 서식"), ("/analysis", "낙찰 분석"), ("/daily", "개찰 성적표")]


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


def notice_page(shell, r, image=None, L=None):
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

    h = page(shell, f"/notice/{no}", title, desc, body, image)
    # 화면이 다시 그릴 때 쓸 원본 한 줄 — 파일을 더 받지 않아도 되도록 같이 넣습니다.
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

    for path, title, desc, card in TABS:
        img = og.tab(path.strip("/"), *card)
        write(path.lstrip("/") + ".html", page(shell, path, title, desc, "", img))
        made += 1

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
    for r in order:
        if n_no >= N_NOTICE:
            break
        no = safe_no(r.get("no"))
        if not no:
            continue
        img = og.notice(r) if n_no < OG_NOTICE else None
        write(f"notice/{no}.html", notice_page(shell, r, img, L))
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
        n_q = indexnow.queue(paths, mark=mark)
        print(f"  · IndexNow 다음 회차에 알릴 주소 {n_q:,}개 (새 개찰 {len(fresh):,}건)")
        # 로그를 못 볼 때를 대비해 결과를 사이트에 남깁니다 → /indexnow-status.json
        # (robots.txt 가 /data/ 를 막고 있어 뿌리에 둡니다 — 확인 도구가 못 읽었습니다)
        indexnow.write_report(DIST, sent, {"n": n_q, "새개찰": len(fresh),
                                           "예": paths[:5]})
    except Exception as e:
        print(f"  · IndexNow 목록 만들기 실패 ({type(e).__name__}: {e}) — 넘어갑니다")

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
