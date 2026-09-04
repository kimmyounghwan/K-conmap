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

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "web", "dist")
DATA = os.path.join(ROOT, "web", "public", "data")
SITE = "https://k-conmap.com"

# 몇 곳까지 구울지. 파일 하나가 3KB 안팎이라 3,000곳이면 약 9MB 입니다.
# ⚠️ 늘리기 전에 Firebase Hosting «출시 저장용량»(보관 10개) 을 확인하세요.
N_AGENCY = int(os.environ.get("PRERENDER_AGENCY", "300"))
N_CORP = int(os.environ.get("PRERENDER_CORP", "3000"))

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


def page(shell, path, title, desc, body):
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
    if "twitter:card" not in h:
        h = h.replace("</head>", '  <meta name="twitter:card" content="summary" />\n  </head>', 1)
    # 본문 — React 가 마운트되면 이 자리를 통째로 덮어씁니다
    h = h.replace('<div id="root"></div>',
                  '<div id="root">' + body + "</div>", 1)
    return h


def write(rel_path, text):
    """rel_path 예: 'agency/경상북도 경주시.html' (cleanUrls 로 .html 없이 서비스됩니다)"""
    p = os.path.join(DIST, *rel_path.split("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)


def safe(name):
    return name and not (set(name) & BAD) and len(name.encode("utf-8")) < 180


# ── 본문 요약 만들기 ────────────────────────────────────────────────
def rows_html(title, rows):
    """rows = [(왼쪽, 오른쪽)] — 값이 없는 줄은 아예 넣지 않습니다."""
    rows = [(a, b) for a, b in rows if a and b]
    if not rows:
        return ""
    out = [f'<div class="card"><div class="sec-title" style="margin:0 0 6px">{esc(title)}</div>']
    for a, b in rows:
        out.append(f'<div class="row"><div class="grow"><div class="t">{esc(a)}</div></div>'
                   f'<span class="r">{esc(b)}</span></div>')
    out.append("</div>")
    return "".join(out)


def agency_page(shell, name, a):
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
                      [(c[0], f"{num(c[1])}건") for c in corps[:5] if len(c) >= 2])
    body += rows_html("🗂 최근 낙찰 사례",
                      [(c[0], pct(c[3], 3) or "-") for c in cases[:5]
                       if len(c) >= 4 and c[0]])
    return page(shell, f"/agency/{name}", title, desc, body)


def corp_page(shell, key, c):
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
                      [(i[0], f"{num(i[1])}건") for i in inst[:5] if len(i) >= 2])
    body += rows_html("🗂 최근 낙찰",
                      [(x[0], date_full(x[1]) or "-") for x in cases[:5]
                       if len(x) >= 2 and x[0]])
    return page(shell, f"/corp/{key}", title, desc, body)


# 탭 페이지 — 지금은 전부 홈과 같은 제목이라 색인에서 서로 잡아먹습니다
TABS = [
    ("/first", "오늘의 1순위 개찰 결과 — 낙찰업체·투찰률 | K-건설맵",
     "조달청 나라장터 개찰 결과를 매일 모아 보여드립니다. 공고별 1순위 낙찰업체, 투찰률, 기초금액, 예정가격을 무료로 확인하세요."),
    ("/live", "마감 전 공공 입찰 공고 — 기초금액·권장 투찰금액 | K-건설맵",
     "마감 전 나라장터 공사 공고를 지역·면허로 걸러 봅니다. 기초금액이 실린 공고는 카드에서 바로 권장 투찰금액이 나옵니다."),
    ("/analysis", "발주기관·업체 낙찰 분석 — 3년치 개찰 기록 | K-건설맵",
     "발주기관의 낙찰률 성향과 업체별 낙찰 실적을 3년치 개찰 기록으로 분석합니다. 회원가입 없이 무료."),
    ("/jobs", "건설 구인구직 — 현장 인력·장비 | K-건설맵",
     "건설 현장 구인구직 글을 올리고 봅니다. 로그인 없이 무료."),
]


def main():
    shell = read_shell()
    made = 0

    for path, title, desc in TABS:
        write(path.lstrip("/") + ".html", page(shell, path, title, desc, ""))
        made += 1

    # ── 발주기관 ──
    top = load("agency/top.json") or []
    by_chunk = {}
    for row in top[:N_AGENCY]:
        if len(row) >= 3 and safe(row[0]):
            by_chunk.setdefault(row[2], []).append(row[0])
    for ch, names in sorted(by_chunk.items()):
        dat = load(f"agency/dat/{ch}.json") or {}
        for nm in names:
            a = dat.get(nm)
            if a:
                write(f"agency/{nm}.html", agency_page(shell, nm, a))
                made += 1

    # ── 업체 ──
    ctop = load("corp/top.json") or []
    if not ctop:
        print("  · corp/top.json 이 없습니다 — build_json.py 를 한 번 돌리면 생깁니다")
    by_chunk = {}
    for row in ctop[:N_CORP]:
        if len(row) >= 3 and safe(row[0]):
            by_chunk.setdefault(row[2], []).append(row[0])
    for ch, keys in sorted(by_chunk.items()):
        dat = load(f"corp/dat/{ch}.json") or {}
        for k in keys:
            c = dat.get(k)
            if c:
                write(f"corp/{k}.html", corp_page(shell, k, c))
                made += 1

    print(f"  · 미리 구운 페이지 {made:,}개 (기관 {len(top[:N_AGENCY]):,} · 업체 {len(ctop[:N_CORP]):,} 대상)")


if __name__ == "__main__":
    main()
