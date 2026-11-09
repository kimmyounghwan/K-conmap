# -*- coding: utf-8 -*-
"""📚 G625 자격증 자료(web/src/data/cert.json) 시험 — python tools/시험_자격증.py   (update.yml «화면 검사» — 막는 검사)

소장님(11-09): 「탭을 하나 만들어서 … 자격증 설명 … 사이트에 반영하자」 · 「토목, 건축 관련 자격증만」 · 「초급, 중급, 고급., 특급 기술자 수첩」
① 원문 확인 문 — 확인.종목 · 확인.등급 · 확인.경력증 이 모두 True 여야 통과(큐넷 · 법제처 원문 3번 확인 뒤 True) ← 확인 전에 올라가지 않게
② 종목 — 이름 · slug 겹침 없음 · 등급(기술사 · 기능장 · 기사 · 산업기사 · 기능사) · 갈래(토목 · 건축 · 건설안전)만 · slug 는 영문 소문자 · 숫자 · -
③ 깊은 글(deep) — 종목에 있는 slug 만 · 제목 · 설명 · 단락 · 블록 종류(p · warn · ul · steps · table · src · links)
④ 글 — «무료» · «클로드» 없음 · 기출 원문을 옮긴 흔적(«①②③④ 보기 원문» 같은 큐넷 저작권 문구) 없음 · «원문은 큐넷» 안내 있음
⑤ 등급 셈 글 — 등급 경계 표가 lib/등급셈.js 와 같음(설계 · 시공 75 · 65 · 55 · 35 / 건설사업관리 80 · 70 · 60 · 40)
⑥ 사이트맵 · 구운 쪽 · 화면 주소가 같은 파일을 봄(sitemap.py · prerender.py · firebase.json · main.jsx) · G627 IndexNow 에 자격증 쪽(소장님 「검색되게 해줘」)
⑦ 블록 글 칸 — p · warn 은 text · ul · steps · src · links 는 items · table 은 cols + rows(11-09 «x» 로 적어 빈 단락이 될 뻔함 → 막음)
⑧ 종목 수 = 국가기술자격법 시행규칙 [별표 2](2025. 9. 1.) · 큐넷 목록 — 토목 48(14 · 1 · 11 · 9 · 13) · 건축 31(4 · 2 · 3 · 6 · 16) · 건설안전 3
   + 2027. 1. 1. [별표 2의2] 새 종목(건축구조기사)은 «새» 표시 · 없는 종목(철도토목산업기사) 없음
⑨ 큐넷 번호(q · 네 자리) — «새» 빼고 모든 종목 · 겹침 없음
⑩ 기술사 19 종목 모두 깊은 글 · 시험과목 · 응시자격 11줄(시행령 [별표 4의2]) · 등급 셈 링크
⑪ G626(11-10) 기능사 29 종목 모두 깊은 글 — 시험 표 5줄(시험과목 · 필기 · 실기 · 합격 · 2026 시험) · 응시자격 «제한 없음»(시행령 [별표 4의2]) ·
   다음 단계 표(산업기사 1년 · 기술사 7년) · 실기만 종목은 필기 «없음» · 수수료 실기만 · 등급 셈 링크 · 기술사 · 기능사 말고는 아직 깊은 글 없음
"""
import io
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
    print(("  ✓ " if cond else "  ✗ ") + name + ("" if cond or got is None else f" = {str(got)[:300]}"))


def rd(p):
    with io.open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


def main():
    d = json.loads(rd("web/src/data/cert.json"))
    hw = d.get("확인") or {}
    ok("① 원문 확인 — 종목(큐넷) · 등급(법제처 별표 1 · 고시) · 경력증(협회) 모두 True(3번 확인 뒤)", all(hw.get(k) is True for k in ("종목", "등급", "경력증")),
       {k: hw.get(k) for k in ("종목", "등급", "경력증")})
    items = d.get("items") or []
    lv = set(d.get("levels") or [])
    gs = {g["k"] for g in d.get("groups") or []}
    ok("② 등급 다섯 · 갈래 셋(토목 · 건축 · 건설안전)", lv == {"기술사", "기능장", "기사", "산업기사", "기능사"} and gs == {"tomok", "geonchuk", "anjeon"}, (lv, gs))
    ok("② 종목 이름 · slug 겹침 없음", len({x["n"] for x in items}) == len(items) == len({x["slug"] for x in items}), len(items))
    ok("② 종목마다 등급 · 갈래가 정한 것 안", all(x["lv"] in lv and x["g"] in gs for x in items), [x for x in items if x["lv"] not in lv or x["g"] not in gs][:3])
    ok("② slug — 영문 소문자 · 숫자 · - 만", all(re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", x["slug"]) for x in items), [x["slug"] for x in items if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", x["slug"])][:5])
    ok("② 이름이 등급 이름으로 끝남(○○기술사 · ○○기사 …)", all(x["n"].endswith(x["lv"]) for x in items), [x["n"] for x in items if not x["n"].endswith(x["lv"])][:5])
    deep = d.get("deep") or {}
    slugs = {x["slug"] for x in items}
    ok("③ 깊은 글 slug 가 종목에 있음", set(deep) <= slugs, set(deep) - slugs)
    kinds = {"p", "warn", "ul", "steps", "table", "src", "links"}
    ok("③ 깊은 글 — 제목줄(sub) · 첫 글(lead) · 단락 셋 넘게 · 블록 종류", all(t.get("sub") and t.get("lead") and len(t.get("secs") or []) >= 3
                                                                 and all(b.get("t") in kinds for s in t["secs"] for b in s["blocks"]) for t in deep.values()), list(deep))
    txt = json.dumps(d, ensure_ascii=False)
    ok("④ «무료» · «클로드» 없음", not re.search(r"무료|클로드", txt), re.findall(r".{0,20}(?:무료|클로드).{0,20}", txt)[:3])
    ok("④ 기출 원문 안내(저작권 · 큐넷) 있음", "저작권" in txt and "큐넷" in txt)
    ok("④ 기출 원문을 옮긴 흔적 없음(«기출문제 원문:» · «정답:» 꼴)", not re.search(r"기출문제 원문\s*:|정답\s*:\s*[①-④]", txt))
    g = rd("web/src/lib/등급셈.js")
    ok("⑤ 등급 경계 — lib/등급셈.js 설계 · 시공 75 · 65 · 55 · 35 · 건설사업관리 80 · 70 · 60 · 40", "[[75, '특급'], [65, '고급'], [55, '중급'], [35, '초급']]" in g and "[[80, '특급'], [70, '고급'], [60, '중급'], [40, '초급']]" in g)
    rows = next((b["rows"] for s in d["grade"]["secs"] for b in s["blocks"] if b.get("t") == "table" and "등급" in b.get("cols", [""])[0]), [])
    ok("⑤ 등급 셈 글의 경계 표 = lib(특급 75 · 80 · 75 / 초급 35 · 40 · 35)", rows[:1] == [["특급", "75점 이상", "80점 이상", "75점 이상"]] and rows[3][1:] == ["35 ~ 55 미만", "40 ~ 60 미만", "35 ~ 55 미만"], rows)
    ok("⑥ sitemap.py · prerender.py 가 cert.json 을 읽음", "cert.json" in rd("sitemap.py") and "cert.json" in rd("prerender.py"))
    pr = rd("prerender.py")
    ok("⑥ G627 IndexNow(네이버 · 빙) — prerender.py 가 자격증 쪽(cert_urls_for_indexnow)을 «처음 알리는 정적» 에 넣음", "def cert_urls_for_indexnow" in pr
       and re.search(r"_static = .*cert_urls_for_indexnow\(\)", pr) is not None)
    ok("⑥ G627 👁 조회수 — 자격증 쪽(첫마디 cert)이 lib/조회수.jsx · tools/이용자지도.py 첫마디들 둘 다에 있음(«똑같이»)",
       re.search(r"첫마디들 = new Set\(\[[^\]]*'cert'", rd("web/src/lib/조회수.jsx")) is not None and re.search(r'첫마디들 = \{[^}]*"cert"', rd("tools/이용자지도.py")) is not None)
    fj = rd("web/firebase.json")
    ok("⑥ firebase.json — /cert · /cert/** 가 앱으로", '"source": "/cert"' in fj and '"source": "/cert/**"' in fj)
    mj = rd("web/src/main.jsx")
    ok("⑥ main.jsx — /cert · /cert/grade · /cert/:slug 길", all(f'path="{u}"' in mj for u in ("/cert", "/cert/grade", "/cert/:slug")))
    aj = rd("web/src/App.jsx")
    ok("⑥ 탭 — 📚 자격증 있음 · «분석» 탭은 1순위 안(탭 10개 그대로)", "{ to: '/cert', ic: '📚', label: '자격증' }" in aj and "label: '분석'" not in aj
       and len(re.findall(r"^\s*\{ to: '/[^']*', ic: '[^']+', label: '[^']+'", aj, re.M)) == 10, len(re.findall(r"^\s*\{ to: '/[^']*', ic: '[^']+', label: '[^']+'", aj, re.M)))
    # ⑦
    def 블록들():
        for s0 in d["grade"]["secs"]:
            yield from s0["blocks"]
        for t in deep.values():
            for s0 in t["secs"]:
                yield from s0["blocks"]
        yield from d.get("gichul") or []
    틀린 = [b.get("t") for b in 블록들() if (b.get("t") in ("p", "warn") and not b.get("text")) or (b.get("t") in ("ul", "steps", "src", "links") and not b.get("items"))
           or (b.get("t") == "table" and not (b.get("cols") and b.get("rows")))]
    ok("⑦ 블록 글 칸 — p · warn = text · ul · steps · src · links = items · table = cols + rows", not 틀린, 틀린[:5])
    # ⑧
    from collections import Counter
    지금 = [x for x in items if not x.get("새")]
    c = Counter((x["g"], x["lv"]) for x in 지금)
    기대 = {("tomok", "기술사"): 14, ("tomok", "기능장"): 1, ("tomok", "기사"): 11, ("tomok", "산업기사"): 9, ("tomok", "기능사"): 13,
          ("geonchuk", "기술사"): 4, ("geonchuk", "기능장"): 2, ("geonchuk", "기사"): 3, ("geonchuk", "산업기사"): 6, ("geonchuk", "기능사"): 16,
          ("anjeon", "기술사"): 1, ("anjeon", "기사"): 1, ("anjeon", "산업기사"): 1}
    ok("⑧ 종목 수 = [별표 2] · 큐넷 — 토목 48 · 건축 31 · 건설안전 3(갈래 · 등급마다)", dict(c) == 기대, {k: (c.get(k), v) for k, v in 기대.items() if c.get(k) != v})
    ok("⑧ 2027 새 종목 «건축구조기사» 는 «새» 표시 · 별표에 없는 «철도토목산업기사» 는 없음",
       any(x["n"] == "건축구조기사" and x.get("새") for x in items) and not any(x["n"] == "철도토목산업기사" for x in items))
    # ⑨
    qs = [x.get("q") for x in 지금]
    ok("⑨ 큐넷 번호 — «새» 빼고 모두 네 자리 · 겹침 없음", all(q and re.fullmatch(r"\d{4}", q) for q in qs) and len(set(qs)) == len(qs), [x["n"] for x in 지금 if not x.get("q")][:5])
    # ⑩
    기술사 = [x for x in 지금 if x["lv"] == "기술사"]
    ok("⑩ 기술사 19 종목 모두 깊은 글", len(기술사) == 19 and all(x["slug"] in deep for x in 기술사), [x["n"] for x in 기술사 if x["slug"] not in deep])
    def 표(t, 첫):
        return next((b for s0 in t["secs"] for b in s0["blocks"] if b.get("t") == "table" and b["cols"][0] == 첫), None)
    ok("⑩ 깊은 글마다 시험과목 · 필기 · 면접 · 합격 줄 · 응시자격 11줄 · 등급 셈 링크",
       all(표(deep[x["slug"]], "구분") and [r[0] for r in 표(deep[x["slug"]], "구분")["rows"]][:4] == ["시험과목", "필기", "면접", "합격"]
           and 표(deep[x["slug"]], "갖춘 것") and len(표(deep[x["slug"]], "갖춘 것")["rows"]) == 11
           and any(b.get("t") == "links" and any(i[1] == "/cert/grade" for i in b["items"]) for s0 in deep[x["slug"]]["secs"] for b in s0["blocks"]) for x in 기술사))
    # ⑪ 기능사
    기능사 = [x for x in 지금 if x["lv"] == "기능사"]
    ok("⑪ 기능사 29 종목 모두 깊은 글 · 그 밖(기사 · 산업기사 · 기능장)은 아직 없음", len(기능사) == 29 and all(x["slug"] in deep for x in 기능사)
       and all(x["slug"] not in deep for x in 지금 if x["lv"] not in ("기술사", "기능사")), [x["n"] for x in 기능사 if x["slug"] not in deep])
    def 기능사꼴(t):
        시 = 표(t, "구분")
        다 = 표(t, "다음 단계")
        팩 = dict((k, v) for k, v in t.get("facts") or [])
        필없음 = bool(시) and dict(시["rows"]).get("필기") == "없음"
        return bool(시 and [r[0] for r in 시["rows"]] == ["시험과목", "필기", "실기", "합격", "2026 시험"] and dict(시["rows"])["2026 시험"].startswith("정기 기능사")
                    and 다 and 다["rows"] == [["산업기사", "1년 이상"], ["기술사", "7년 이상"]]
                    and 팩.get("응시자격") == "제한 없음" and 팩.get("건설기술인 자격지수") == "**15**" and "제한 없음" in t["lead"]
                    and (팩.get("시험") == "실기만(필기 없음)") == 필없음 and ("필기" not in 팩.get("수수료(2026)", "")) == 필없음
                    and any(b.get("t") == "links" and any(i[1] == "/cert/grade" for i in b["items"]) for s0 in t["secs"] for b in s0["blocks"]))
    틀림 = [x["n"] for x in 기능사 if not 기능사꼴(deep[x["slug"]])]
    ok("⑪ 기능사 깊은 글 꼴 — 시험 표 5줄 · 다음 단계(산업기사 1년 · 기술사 7년) · 제한 없음 · 자격지수 15 · 실기만이면 필기 «없음» · 수수료 실기만", not 틀림, 틀림)
    실기만 = sorted(x["n"] for x in 기능사 if dict(표(deep[x["slug"]], "구분")["rows"]).get("필기") == "없음")
    ok("⑪ 실기만(필기 없음) 17 종목 — 큐넷 그대로(건축 13 · 토목 4 — 거푸집 · 도배 · 미장 · 조적 · 철근 · 타일 · 석공 · 도화 …)", len(실기만) == 17 and "거푸집기능사" in 실기만 and "콘크리트기능사" not in 실기만, 실기만)
    print(f"\n{'❌' if bad else '✅'} 시험_자격증 {n - bad}/{n}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
