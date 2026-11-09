# -*- coding: utf-8 -*-
"""🔎 G621 공고 · 개찰 페이지 제목 = 사람들이 치는 말 시험 — python3 tools/시험_공고제목.py (인터넷 · 조달청 호출 없음)
소장님 11-09 19:0x 「입찰에서 이용자를 늘릴려면?」 → 「우선 검색이 되게 해줘」.
  · 개찰 끝난 공고 → «○○공사 개찰결과 — 낙찰 ○○ 87.745%» (전엔 «낙찰 결과») · 마감 전 → «○○공사 입찰공고 — 기초금액 …» (전엔 «입찰 공고»)
  · 미리 구운 제목(prerender.notice_page)과 화면 제목(NoticePage.jsx)이 같은 꼴이어야 함(검색엔진은 둘 다 봄)
  · 사이트맵 공고 수(sitemap.NOTICE) ≤ 미리 굽는 공고 수(prerender.N_NOTICE) — 안 구운 주소를 내면 크롤러가 빈 껍데기를 봄(CLAUDE.md 검색 · 색인)
도는 곳: update.yml «화면 검사»(막는 검사) · 손으로도.
⚠️ 시험은 main() 안에만 — tools/checkwf.py 가 «켜기만»(import) 할 때 시험이 돌거나 sys.exit 로 끝나면 안 됩니다.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

bad = n = 0
SHELL = ('<html><head><title>K-건설맵</title><meta name="description" content="x" />'
         '<link rel="canonical" href="https://k-conmap.com/" /></head><body><div id="root"></div></body></html>')


def ok(name, cond, got=None):
    global bad, n
    n += 1
    if not cond:
        bad += 1
    print(("  ✓ " if cond else "  ✗ ") + name + ("" if cond or got is None else f" = {got!r}"))


def _title(h):
    m = re.search(r"<title>([^<]*)</title>", h)
    return m.group(1) if m else ""


def _desc(h):
    m = re.search(r'<meta name="description" content="([^"]*)"', h)
    return m.group(1) if m else ""


def main():
    os.chdir(ROOT)
    import prerender as P
    import sitemap as S

    print("① 개찰 끝난 공고 — «개찰결과» 가 제목 맨 앞 말")
    won = {"no": "R26BK00000001", "name": "가상 시험 도로 정비공사", "inst": "가상시", "dt": "2026-11-09 11:00:00",
           "win": "가상건설(주)", "rate": 87.745, "amt": 123456000, "base": 140000000}
    h = P.notice_page(SHELL, won)
    t, d = _title(h), _desc(h)
    ok("제목 «… 개찰결과 — 낙찰 가상건설(주) 87.745%»", t.startswith("가상 시험 도로 정비공사 개찰결과 — 낙찰 가상건설(주) 87.745%"), t)
    ok("제목 끝 « | K-건설맵»", t.endswith(" | K-건설맵"), t)
    ok("설명에 «개찰결과 · 1순위» · 낙찰 · 투찰률", "개찰결과 · 1순위" in d and "낙찰 가상건설(주)" in d and "투찰률 87.745%" in d, d)
    ok("새 설명에 «무료» 안 씀", "무료" not in d, d)

    print("② 마감 전 공고 — «입찰공고»")
    live = {"no": "R26BK00000002", "name": "가상 시험 배수로 공사", "inst": "가상군", "dt": "2026-11-09 10:00:00",
            "close": "2026-11-16 10:00:00", "base": 98000000}
    h2 = P.notice_page(SHELL, live)
    t2, d2 = _title(h2), _desc(h2)
    ok("제목 «… 입찰공고 — 기초금액 …»", t2.startswith("가상 시험 배수로 공사 입찰공고 — 기초금액 "), t2)
    ok("설명 «나라장터 입찰공고»", "나라장터 입찰공고" in d2, d2)
    ok("옛 말(«낙찰 결과» · «입찰 공고») 안 남음", "낙찰 결과" not in t + t2 and "입찰 공고" not in t + t2, (t, t2))

    print("③ 화면(NoticePage.jsx) 제목도 같은 꼴")
    src = open(os.path.join(ROOT, "web", "src", "pages", "NoticePage.jsx"), encoding="utf-8").read()
    ok("«${nm} 개찰결과 — 낙찰 ${r.win}»", "${nm} 개찰결과 — 낙찰 ${r.win}" in src)
    ok("«${nm} 입찰공고»", "${nm} 입찰공고${r?.base" in src)
    ok("옛 꼴 없음", "낙찰 결과 —" not in src and "${nm} 입찰 공고" not in src)

    print("④ 사이트맵 공고 수")
    ok("sitemap.NOTICE 1,000 (11-09 500 → 1,000)", S.NOTICE == 1000 or os.environ.get("SITEMAP_NOTICES"), S.NOTICE)
    ok("사이트맵 공고 ≤ 미리 굽는 공고(안 구운 주소 안 냄)", S.NOTICE <= P.N_NOTICE, (S.NOTICE, P.N_NOTICE))

    print(f"\n{'✗' if bad else '✓'} 시험_공고제목 {n - bad}/{n}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
