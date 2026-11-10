# -*- coding: utf-8 -*-
"""🔎 G629 네이버 시험 — python tools/시험_네이버.py

소장님(11-10): 「네이버에서도 검색이 되게 해줘」 · 「지금은 하나만 나와. 예전엔 서식 입찰해서 여러개가 떴는데」(네이버 «서브링크» 가 빠짐)
→ RSS(새 글 목록 · sitemap.py rss_xml · write_rss) + 구운 쪽 맨 위 주 메뉴(<nav> — 앱 탭 줄과 같은 9줄)
① 가짜 공고로 — XML 로 읽힘 · 채널(제목 · 주소 · ko · 자기 주소) · 개찰결과 «○○ 개찰결과 — 낙찰 ○○» · 입찰공고 «○○ 입찰공고» · 주소 /notice/{번호} = guid ·
   날짜 RFC 822(+0900 · 요일 · 달 영문) · 최신부터 · & < > 이스케이프 · 제어문자 뺌 · 번호 꼴이 아니거나 이름 · 날짜 없는 것 뺌
② 개수 — 개찰결과 · 입찰공고 각각 최신 each 개(150 + 150 → 100 + 100)
③ 길 — sitemap.main 이 write_rss 를 부름 · web/index.html 에 <link rel="alternate" type="application/rss+xml"> · .gitignore 에 web/public/rss.xml ·
   맨 위 주 메뉴(prerender.py GNB · gnb_html) — 모든 구운 쪽 #root 맨 앞 <nav>(네이버 서브링크는 사이트 메뉴를 읽음 · 원본엔 맨 아래 37줄 목록뿐이었음)
④ 저장소의 실제 공고(data/store 가 있으면) — 읽힘 · 200개 이하 · 모두 /notice/
"""
import email.utils
import importlib.util
import io
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bad, n = 0, 0


def ok(name, cond, got=None):
    global bad, n
    n += 1
    if not cond:
        bad += 1
    print(("  ✓ " if cond else "  ✗ ") + name + ("" if cond or got is None else f" = {str(got)[:400]}"))


def rd(p):
    with io.open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


spec = importlib.util.spec_from_file_location("sitemap_rss", os.path.join(ROOT, "sitemap.py"))
sm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sm)
SITE = "https://k-conmap.com"

print("① 가짜 공고")
rows = [
    {"no": "R26BK00000001", "name": "가상 하천 정비공사 <1차> & 보수\x07", "inst": "가상시", "dt": "2026-11-10 09:30:00", "close": "2026-11-17 10:00:00", "base": "123456789"},
    {"no": "R26BK00000002", "name": "가상 도로 포장공사", "inst": "가상군", "dt": "2026-11-10 10:00:00", "win": "가상건설(주)", "rate": "87.745"},
    {"no": "R26BK00000003-000", "name": "가상 배수로 정비공사", "inst": "가상구", "dt": "2026-11-09 15:00:00", "win": "가상토건", "rate": "x"},
    {"no": "bad/no", "name": "번호 꼴 아님", "dt": "2026-11-10 11:00:00"},
    {"no": "R26BK00000004", "name": "", "dt": "2026-11-10 11:00:00"},
    {"no": "R26BK00000005", "name": "날짜 없음", "dt": ""},
    "문자열 줄",
]
x = sm.rss_xml(rows, now=datetime(2026, 11, 10, 9, 5, 0))
try:
    rt = ET.fromstring(x)
    ch = rt.find("channel")
except ET.ParseError as e:
    rt, ch = None, None
    print("     ", e)
ok("XML 로 읽힘 · rss 2.0", rt is not None and rt.tag == "rss" and rt.get("version") == "2.0")
items = ch.findall("item") if ch is not None else []
atom = ch.find("{http://www.w3.org/2005/Atom}link") if ch is not None else None
ok("채널 — 제목 K-건설맵 · 주소 · ko · lastBuildDate · 자기 주소(atom:link)", ch is not None and ch.findtext("title").startswith("K-건설맵") and ch.findtext("link") == SITE + "/"
   and ch.findtext("language") == "ko" and ch.findtext("lastBuildDate") == "Tue, 10 Nov 2026 09:05:00 +0900" and atom is not None and atom.get("href") == SITE + "/rss.xml")
ok("항목 3개(번호 꼴 아님 · 이름 없음 · 날짜 없음 · 문자열은 뺌)", len(items) == 3, [i.findtext("title") for i in items])
t = [i.findtext("title") for i in items]
ok("최신부터 — 10:00 개찰결과 → 09:30 입찰공고 → 어제 개찰결과", t[:1] == ["가상 도로 포장공사 개찰결과 — 낙찰 가상건설(주)"] and t[1] == "가상 하천 정비공사 <1차> & 보수 입찰공고" and t[2].startswith("가상 배수로 정비공사 개찰결과"), t)
ok("& < > 이스케이프 · 제어문자 뺌(원문 글로 되읽힘)", "&lt;1차&gt; &amp; 보수" in x and "\x07" not in x and "<1차>" not in x)
links = [i.findtext("link") for i in items]
ok("주소 = /notice/{번호} = guid(isPermaLink)", links == [SITE + "/notice/R26BK00000002", SITE + "/notice/R26BK00000001", SITE + "/notice/R26BK00000003-000"]
   and all(i.findtext("guid") == i.findtext("link") and i.find("guid").get("isPermaLink") == "true" for i in items), links)
dts = [i.findtext("pubDate") for i in items]
pd = [email.utils.parsedate_to_datetime(d) for d in dts]
ok("날짜 RFC 822 — +0900 · 요일 · 달 영문 · 한국 시각 그대로", dts[0] == "Tue, 10 Nov 2026 10:00:00 +0900" and dts[2] == "Mon, 09 Nov 2026 15:00:00 +0900"
   and all(p.utcoffset() == timedelta(hours=9) for p in pd) and pd == sorted(pd, reverse=True), dts)
ds = [i.findtext("description") for i in items]
ok("설명 — 개찰: 기관 · 낙찰 · 투찰률(숫자 아니면 뺌) / 공고: 기관 · 기초금액 · 마감", ds[0] == "가상군 · 낙찰 가상건설(주) · 투찰률 87.745% — 기초금액 · 예정가격 · 참가업체 순위"
   and ds[1] == "가상시 · 기초금액 123,456,789원 · 마감 2026-11-17 10:00 — 권장 투찰금액 바로 계산" and "투찰률" not in ds[2], ds)
ok("«무료» · «클로드» 없음", not re.search(r"무료|클로드", x))

print("② 개수 — 각각 최신 100")
base = datetime(2026, 11, 10, 9, 0, 0)
many = [{"no": f"R26BK1{k:07d}", "name": f"가상 공사 {k}", "inst": "가상시", "dt": (base - timedelta(minutes=k)).strftime("%Y-%m-%d %H:%M:%S"), "win": "가상건설" if k % 2 else ""} for k in range(300)]
y = sm.rss_xml(many, now=base, each=100)
it2 = ET.fromstring(y).find("channel").findall("item")
결 = [i for i in it2 if "개찰결과" in i.findtext("title")]
ok("150 + 150 → 개찰결과 100 + 입찰공고 100 · 가장 새 것(가상 공사 0 · 1)부터 · 가장 오래된 것(298 · 299)은 빠짐", len(it2) == 200 and len(결) == 100
   and it2[0].findtext("title") == "가상 공사 0 입찰공고" and it2[1].findtext("title").startswith("가상 공사 1 개찰결과") and "가상 공사 299 " not in y and "가상 공사 298 " not in y, len(it2))
ok("기본 개수(RSS_EACH) = 100", sm.RSS_EACH == 100)

print("③ 길")
src = rd("sitemap.py")
ok("sitemap.main 끝에서 write_rss(rows.values()) — 실패해도 사이트맵은 감(try)", re.search(r"\n    write_rss\(rows\.values\(\)\)", src) is not None and "def write_rss" in src and "except Exception as e:" in src.split("def write_rss")[1][:900])
ih = rd("web/index.html")
ok("web/index.html — <link rel=\"alternate\" type=\"application/rss+xml\" … href=\"https://k-conmap.com/rss.xml\">", re.search(r'<link rel="alternate" type="application/rss\+xml" title="[^"]+" href="https://k-conmap\.com/rss\.xml" />', ih) is not None)
ok(".gitignore — web/public/rss.xml(구운 것)", "\nweb/public/rss.xml\n" in rd(".gitignore"))
# 맨 위 주 메뉴(GNB) — 구운 쪽마다 #root 맨 앞에 <nav> · 앱 탭 줄과 같은 차례
import ast
_src = rd("prerender.py")
_m = re.search(r"^GNB = (\[.*?\])\n", _src, re.S | re.M)
GNB = ast.literal_eval(_m.group(1)) if _m else []
기대GNB = ["/", "/first", "/live", "/tools", "/forms", "/naeyeok", "/jeoksan", "/qna", "/cert"]
mj = rd("web/src/main.jsx")
ok("주 메뉴(GNB) 9줄 — 바로투찰 · 1순위 개찰 · 입찰 공고 · 건설 도구 · 건설 서식 · 내역서 · K-적산 · 맵톡 · 자격증(앱 탭 차례) · 모두 있는 화면 길",
   [u for u, _ in GNB] == 기대GNB and [nm for _, nm in GNB] == ["바로투찰", "1순위 개찰", "입찰 공고", "건설 도구", "건설 서식", "내역서", "K-적산", "맵톡", "자격증"]
   and all(u == "/" or f'path="{u}"' in mj for u, _ in GNB), GNB)
_줄1 = "'<div id=\"root\">' + gnb_html(path) + body + nav_html(path) + \"</div>\""
_줄2 = "'<div id=\"root\">' + gnb_html(\"\") + body + nav_html(\"\") + \"</div>\""
ok("page() · not_found_page() — #root 맨 앞에 gnb_html · 그 뒤 본문 · 맨 아래 둘러보기(nav_html)", _줄1 in _src and _줄2 in _src, (_줄1 in _src, _줄2 in _src))
try:
    sys.path.insert(0, ROOT)   # prerender.py 가 ogcard · dailymod 같은 옆 파일을 불러옴
    _spec = importlib.util.spec_from_file_location("prerender_gnb", os.path.join(ROOT, "prerender.py"))
    pr = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(pr)
    _shell = ('<!doctype html><html><head><title>K-건설맵</title><meta name="description" content="x" />'
              '<link rel="canonical" href="https://k-conmap.com/" /></head><body><div id="root"></div></body></html>')
    _h = pr.page(_shell, "/forms", "건설 서식 | K-건설맵", "설명", "<p>본문</p>")
    _r = _h[_h.index('<div id="root">') + len('<div id="root">'):]
    _nf = pr.not_found_page(_shell)
    ok("구운 쪽(가짜 껍데기) — <nav class=\"pre-gnb\" aria-label=\"K-건설맵 주 메뉴\"> 가 맨 앞 · 지금 쪽(/forms)만 aria-current · 링크 9 · 본문 · 둘러보기 차례 · 404 장도 같은 메뉴",
       _r.startswith('<nav class="pre-gnb" aria-label="K-건설맵 주 메뉴"><a href="/">바로투찰</a>') and _r.count('aria-current="page"') == 1
       and '<a href="/forms" aria-current="page">건설 서식</a>' in _r and _r.split("</nav>")[0].count("<a ") == 9
       and _r.index("</nav>") < _r.index("<p>본문</p>") < _r.index("K-건설맵 둘러보기") and '<nav class="pre-gnb"' in _nf, _r[:300])
except Exception as e:
    ok(f"prerender.py 불러 구운 쪽 만들어 보기({type(e).__name__}: {e})", False)
ok("styles.css — .pre-gnb(잠깐 보이는 동안 한 줄 메뉴 꼴)", ".pre-gnb {" in rd("web/src/styles.css"))

print("④ 저장소의 실제 공고")
rows2 = {}
for nm in ("live", "first"):
    p = os.path.join(ROOT, "data", "store", f"{nm}.json")
    if os.path.exists(p):
        with io.open(p, encoding="utf-8") as f:
            for v in json.load(f).values():
                if isinstance(v, dict):
                    rows2.update(v)
if rows2:
    z = sm.rss_xml(rows2.values())
    try:
        it3 = ET.fromstring(z).find("channel").findall("item")
    except ET.ParseError as e:
        it3 = None
        print("     ", e)
    ok(f"실제 공고 {len(rows2):,}건 → XML 로 읽힘 · 200개 이하 · 모두 /notice/ · 날짜 RFC 822", it3 is not None and 0 < len(it3) <= 200
       and all(i.findtext("link").startswith(SITE + "/notice/") and email.utils.parsedate_to_datetime(i.findtext("pubDate")) for i in it3), None if it3 is None else len(it3))
else:
    ok("실제 공고 — (data/store 없음 · 건너뜀)", True)

print(f"\n{'❌' if bad else '✅'} 시험_네이버 {n - bad}/{n}")
sys.exit(1 if bad else 0)
