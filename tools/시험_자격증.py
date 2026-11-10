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
   다음 단계 표(산업기사 1년 · 기술사 7년) · 실기만 종목은 필기 «없음» · 수수료 실기만 · 등급 셈 링크
⑫ G628(11-10) 기사 깊은 글(토목기사부터) — 시험 표 6줄(필기 과목 · 필기 · 실기 · 합격 · 관련 학과 · 2026 시험) · 응시자격 10줄(시행령 [별표 4의2] 기사 = 큐넷 응시자격별 안내) ·
   자격지수 30 · 등급 셈 링크 · 예상문제(quiz) — 과목 · 틀 · 맛보기(과목마다 하나) · 예상문제 링크 · 길(main.jsx · prerender · sitemap · IndexNow · Crumbs 이름)
⑬ G643(11-10) 소장님 「자격증 마무리」 · 「다른 사이트와 비교해서 자세하고 편하게」 — 82 종목(«새» 빼고) 모두 깊은 글 ·
   산업기사 16 · 기능장 3 꼴(시험 표 6줄 · 응시자격 [별표 4의2] 산업기사 8줄 · 기능장 6줄 · 자격지수 20 · 30 · 산업기사는 «기사» 회차 안내) · 건축구조기사(2027 새) 깊은 글
⑮ G643 만들기(tools/자격증만들기/깊은글_큐넷덧.py)를 다시 돌려도 cert.json · certq 가 똑같음 — 이 34쪽 · 덧은 만들기로만 고침
⑭ G643 큐넷 덧(data/certq/{종목}.json) — 82 종목 모두 · 큐넷 번호 같음 · 📅 일정 표 4칸(회차 · 접수 · 시험 · 발표 — 폰에서 짧게) · 📊 합격률(해 · 응시 · 합격률 0 ~ 100) · 🏅 우대 갈래 합 = 전체 건수 ·
   «구분 | 내용» 표는 모두 kv(폰에서 이름 칸이 갈라지지 않게) ·
   화면(Cert.jsx 덧끼우기 · 차례) · 구운 쪽(prerender certq_insert · 차례 · rate) · 블록 그림(Guide.jsx rate · styles .cr-bar) 이 같은 자료를 봄
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
    ok("⑪ 기능사 29 종목 모두 깊은 글(기사는 ⑫ · 산업기사 · 기능장은 ⑬)", len(기능사) == 29 and all(x["slug"] in deep for x in 기능사), [x["n"] for x in 기능사 if x["slug"] not in deep])
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
    # ⑫ 기사
    기사 = [x for x in 지금 if x["lv"] == "기사" and x["slug"] in deep]
    ELIG기사 = [["산업기사(이상)", "1년 이상"], ["기능사", "3년 이상"], ["같은 · 비슷한 직무분야의 다른 기사(이상)", "바로"],
              ["관련 학과 대학(4년제) 졸업 · 졸업 예정", "바로"], ["관련 학과 3년제 전문대 졸업", "1년 이상"], ["관련 학과 2년제 전문대 졸업", "2년 이상"],
              ["기사 수준 기술훈련과정 이수 · 이수 예정", "바로"], ["산업기사 수준 기술훈련과정 이수", "2년 이상"],
              ["자격 · 학력 없이 실무만", "4년 이상"], ["외국에서 같은 종목 자격", "바로"]]
    def 기사꼴(x):
        t = deep[x["slug"]]
        시 = 표(t, "구분")
        자 = 표(t, "갖춘 것")
        팩 = dict((k, v) for k, v in t.get("facts") or [])
        링크들 = [i[1] for s0 in t["secs"] for b in s0["blocks"] if b.get("t") == "links" for i in b["items"]]
        qz = t.get("quiz")
        return bool(시 and [r[0] for r in 시["rows"]] == ["필기 과목", "필기", "실기", "합격", "관련 학과", "2026 시험"] and dict(시["rows"])["2026 시험"].startswith("정기 기사")
                    and 자 and 자["rows"] == ELIG기사 and 팩.get("건설기술인 자격지수") == "**30**" and "/cert/grade" in 링크들
                    and ((f'/cert/{x["slug"]}/quiz' in 링크들) == bool(qz))
                    and (not qz or (qz.get("과목") and len(qz.get("틀") or []) >= 3 * len(qz["과목"]) and len(qz.get("예시") or []) == len(qz["과목"]))))
    ok("⑫ 기사 깊은 글 — 토목기사 있음 · 시험 표 6줄 · 응시자격 10줄(=[별표 4의2] · 큐넷) · 자격지수 30 · 등급 셈 링크 · 예상문제(과목 · 틀 · 맛보기 · 링크)",
       any(x["n"] == "토목기사" for x in 기사) and all(기사꼴(x) for x in 기사), [x["n"] for x in 기사 if not 기사꼴(x)])
    퀴즈 = [x for x in 지금 if (deep.get(x["slug"]) or {}).get("quiz")]
    lib = rd("web/src/lib/예상문제.js")
    cr = rd("web/src/Crumbs.jsx")
    sm = rd("sitemap.py")
    ok("⑫ 예상문제 길 — main.jsx /cert/:slug/quiz · prerender cert_quiz(cert/{종목}/quiz.html) · sitemap · IndexNow · lib 문제집 · Crumbs 가운데 칸 이름",
       bool(퀴즈) and 'path="/cert/:slug/quiz"' in mj and "def cert_quiz" in pr and 'write(f"cert/{s}/quiz.html"' in pr and '/quiz"' in sm and "/quiz'" in pr
       and all(f"'{x['slug']}':" in lib and f"'/cert/{x['slug']}': '{x['n']}'" in cr for x in 퀴즈), [x["n"] for x in 퀴즈])
    # ⑬ G643 — 모든 종목 깊은 글 · 산업기사 · 기능장 꼴
    ok("⑬ 82 종목(«새» 빼고) 모두 깊은 글 · 건축구조기사(새)도", len(지금) == 82 and all(x["slug"] in deep for x in 지금)
       and any(x["n"] == "건축구조기사" and x["slug"] in deep for x in items), [x["n"] for x in 지금 if x["slug"] not in deep])
    ELIG산업기사 = [["기능사(이상)", "1년 이상"], ["같은 · 비슷한 직무분야의 다른 산업기사(이상)", "바로"],
                ["관련 학과 2년제 · 3년제 전문대 졸업 · 졸업 예정", "바로"], ["관련 학과 대학(4년제) 졸업 · 졸업 예정", "바로"],
                ["산업기사 수준 기술훈련과정 이수 · 이수 예정", "바로"], ["자격 · 학력 없이 실무만", "2년 이상"],
                ["기능경기대회 입상(고용노동부령으로 정한 대회)", "바로"], ["외국에서 같은 종목 자격", "바로"]]
    ELIG기능장 = [["산업기사 또는 기능사 + 기능대학 기능장과정 이수 · 이수 예정", "바로"], ["산업기사(이상)", "5년 이상"], ["기능사", "7년 이상"],
               ["자격 없이 실무만", "9년 이상"], ["같은 · 비슷한 직무분야의 다른 기능장", "바로"], ["외국에서 같은 종목 자격", "바로"]]
    def 중간꼴(x, 회, 엘, 지수):
        t = deep[x["slug"]]
        시 = 표(t, "구분")
        자 = 표(t, "갖춘 것")
        팩 = dict((k, v) for k, v in t.get("facts") or [])
        링크들 = [i[1] for s0 in t["secs"] for b in s0["blocks"] if b.get("t") == "links" for i in b["items"]]
        return bool(시 and [r[0] for r in 시["rows"]] == ["필기 과목", "필기", "실기", "합격", "관련 학과", "2026 시험"] and all(r[1] for r in 시["rows"])
                    and dict(시["rows"])["2026 시험"].startswith(회) and 자 and 자["rows"] == 엘 and 팩.get("건설기술인 자격지수") == 지수 and "/cert/grade" in 링크들
                    and not re.search(r"\.\s—", dict(시["rows"])["실기"]))
    산 = [x for x in 지금 if x["lv"] == "산업기사"]
    틀림 = [x["n"] for x in 산 if not 중간꼴(x, "정기 기사", ELIG산업기사, "**20**") or "산업기사도 «기사» 회차" not in dict(표(deep[x["slug"]], "구분")["rows"])["2026 시험"]]
    ok("⑬ 산업기사 16 종목 — 시험 표 6줄 · 응시자격 8줄(=[별표 4의2] 산업기사) · 자격지수 20 · 등급 셈 링크 · «기사» 회차 안내", len(산) == 16 and not 틀림, 틀림)
    장 = [x for x in 지금 if x["lv"] == "기능장"]
    틀림 = [x["n"] for x in 장 if not 중간꼴(x, "정기 기능장", ELIG기능장, "**30**")]
    ok("⑬ 기능장 3 종목 — 시험 표 6줄 · 응시자격 6줄(=[별표 4의2] 기능장) · 자격지수 30 · 등급 셈 링크", len(장) == 3 and not 틀림, 틀림)
    gj = deep.get(next((x["slug"] for x in items if x["n"] == "건축구조기사"), ""), {})
    ok("⑬ 건축구조기사(2027. 1. 1. 새) — 큐넷 공고 전이라 과목 · 일정 짐작 안 함 · 응시자격 = 기사 공통",
       "2027. 1. 1." in gj.get("sub", "") and "짐작" in gj.get("lead", "") and (표(gj, "갖춘 것") or {}).get("rows") == ELIG기사 and not 표(gj, "구분"))
    # ⑭ 큐넷 덧
    qd = os.path.join(ROOT, "web", "src", "data", "certq")
    파일 = sorted(f[:-5] for f in os.listdir(qd) if f.endswith(".json")) if os.path.isdir(qd) else []
    ok("⑭ certq — «새» 빼고 82 종목 모두 · 남는 파일 없음", 파일 == sorted(x["slug"] for x in 지금), sorted(set(파일) ^ {x["slug"] for x in 지금})[:5])
    틀림 = []
    for x in 지금:
        if x["slug"] not in 파일:
            continue
        with io.open(os.path.join(qd, x["slug"] + ".json"), encoding="utf-8") as f:
            q = json.load(f)
        secs = q.get("secs") or []
        hs = [s0["h"] for s0 in secs]
        if q.get("q") != x["q"] or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", q.get("at", "")) or not hs or not hs[0].startswith("📅 시험 일정"):
            틀림.append((x["n"], "머리"))
            continue
        il = secs[0]["blocks"][0]
        if (il.get("t") != "table" or il.get("cols") != ["회차", "접수", "시험", "발표"] or not il.get("nl") or not il.get("rows")
                or any(len(r) != 4 or not all(r) for r in il["rows"]) or not re.search(r"(필기|실기|면접)$", il["rows"][0][0])):
            틀림.append((x["n"], "일정"))
        if not any("2년간 필기 면제" in b.get("text", "") or "실기만" in b.get("text", "") for b in secs[0]["blocks"]):
            틀림.append((x["n"], "면제 글"))
        for s0 in secs:
            for b in s0["blocks"]:
                if b.get("t") not in ("p", "table", "rate"):
                    틀림.append((x["n"], "블록 " + str(b.get("t"))))
                if b.get("t") == "rate":
                    rr = b.get("rows") or []
                    해 = [r[0] for r in rr]
                    if not rr or len(rr) > 5 or 해 != sorted(해, reverse=True) or not all(2015 <= y <= 2026 for y in 해) or b.get("둘") not in ("실기", "면접"):
                        틀림.append((x["n"], "합격률 해"))
                    for r in rr:
                        if len(r) != 5 or not all(isinstance(v, (int, float)) and v >= 0 for v in r[1:]) or r[2] > 100 or r[4] > 100 or (not r[1] and r[2]) or (not r[3] and r[4]):
                            틀림.append((x["n"], "합격률 값", r))
        for s0 in secs:
            if s0["h"].startswith("🏅"):
                글 = s0["blocks"][0].get("text", "")
                수 = [int(v) for v in re.findall(r"\*\*(\d+)건\*\*", 글)]
                if len(수) < 2 or 수[0] != sum(수[1:]):
                    틀림.append((x["n"], "우대 합", 수))
                tb = [b for b in s0["blocks"] if b.get("t") == "table"]
                if tb and (len(tb[0]["rows"]) > 8 or tb[0]["cols"] != ["법령", "쓰이는 곳"]):
                    틀림.append((x["n"], "우대 표"))
    ok("⑭ certq 꼴 — 큐넷 번호 · 📅 일정 표 4칸(빈칸 없음 · nl) · 필기 면제 2년(제21조) · 합격률(해 내림 · 0 ~ 100 · 응시 0 이면 0) · 🏅 갈래 합 = 전체 · 표 8줄 안", not 틀림, 틀림[:6])
    구분표 = [(s, b0.get("kv")) for s, t in deep.items() for s0 in t["secs"] for b0 in s0["blocks"] if b0.get("t") == "table" and b0.get("cols") == ["구분", "내용"]]
    ok("⑭ «구분 | 내용» 표 82개 모두 kv(첫 칸 줄바꿈 없음 — 화면 Guide.jsx · 구운 쪽 · styles .ctab.ckv)", len(구분표) == 82 and all(k for _s, k in 구분표)
       and "(b.kv ? ' ckv' : '')" in rd("web/src/pages/Guide.jsx") and "(' ckv' if b.get(\"kv\") else '')" in pr and ".ctab.ckv td:first-child" in rd("web/src/styles.css"),
       [s for s, k in 구분표 if not k][:5])
    css0 = rd("web/src/styles.css")
    gx = rd("web/src/pages/Guide.jsx")
    겹침 = [c for c in ("ckv", "cnl") if re.search(r"(?<!\.ctab)\." + c + r"(?![\w-])", css0)]
    ok("⑭ G643 표 꾸밈 이름이 전역 이름과 안 겹침 — .ctab.ckv · .ctab.cnl 만(처음 .kv 로 했다가 전역 .kv 격자와 겹쳐 «📝 시험» 표가 깨짐 → 막음)",
       not 겹침 and not re.search(r"\.ctab\.(?:kv|nl)(?![\w-])", css0) and "' kv'" not in gx and "' nl'" not in gx and "' ckv'" in gx and "' cnl'" in gx, 겹침)
    cj = rd("web/src/pages/Cert.jsx")
    gd = rd("web/src/pages/Guide.jsx")
    css = rd("web/src/styles.css")
    ok("⑭ 화면 · 구운 쪽이 같은 덧을 봄 — Cert.jsx glob(certq) · 덧끼우기 · 차례 / prerender load_certq · certq_insert · 차례 · rate / Guide.jsx rate · styles .cr-bar",
       "import.meta.glob('../data/certq/*.json')" in cj and "export function 덧끼우기" in cj and 'className="cert-toc"' in cj and "덧끼우기(d.secs, 덧)" in cj
       and "def load_certq" in pr and "certq_insert(t.get(\"secs\") or [], load_certq(" in pr and 'class="cert-toc"' in pr and 'elif t == "rate":' in pr
       and "b.t === 'rate'" in gd and ".cr-bar {" in css and ".cert-toc {" in css)
    # ⑮ 만들기 다시 돌려도 같음 — 34쪽 · certq 는 tools/자격증만들기 로만 고침(손으로 고친 것이 다음에 지워지지 않게)
    import shutil
    import subprocess
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        cj = os.path.join(tmp, "cert.json")
        shutil.copy(os.path.join(ROOT, "web", "src", "data", "cert.json"), cj)
        qo = os.path.join(tmp, "certq")
        os.makedirs(qo)
        r = subprocess.run([sys.executable, "-B", os.path.join(ROOT, "tools", "자격증만들기", "깊은글_큐넷덧.py"), cj, qo], capture_output=True, text=True)
        같음 = r.returncode == 0 and rd("web/src/data/cert.json") == io.open(cj, encoding="utf-8").read()
        다른 = [f for f in sorted(os.listdir(qo)) if io.open(os.path.join(qo, f), encoding="utf-8").read() != rd("web/src/data/certq/" + f)]
        ok("⑮ tools/자격증만들기/깊은글_큐넷덧.py 를 다시 돌려도 cert.json · certq 82 파일이 똑같음(손으로 고친 것 없음 · 평균은 분수 반올림 — 파이썬 판마다 같음)",
           같음 and not 다른 and len(os.listdir(qo)) == 82, (r.returncode, r.stderr[-300:], 다른[:3]))
    md = os.path.join(ROOT, "tools", "자격증만들기")
    무시 = []
    try:
        for f in sorted(os.listdir(md)):
            if f == "__pycache__":
                continue
            g = subprocess.run(["git", "-C", ROOT, "check-ignore", "-q", os.path.join("tools", "자격증만들기", f)], capture_output=True)
            if g.returncode == 0:
                무시.append(f)
    except FileNotFoundError:     # git 이 없는 곳 — 건너뜀
        pass
    ok("⑮ 만들기 폴더 파일 중 git 이 무시하는 것 없음(.gitignore *.txt — 처음 qnet_compact.txt 가 안 올라가 다른 곳에서 만들기가 못 돎 → .dat)", not 무시, 무시)
    print(f"\n{'❌' if bad else '✅'} 시험_자격증 {n - bad}/{n}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
