# -*- coding: utf-8 -*-
"""🧪 G652 (2026-11-11) 자격증 «📄 기출문제» 칸 — 자료 · 구운 쪽 시험   python tools/시험_기출칸.py

소장님 「자격증 기출문제 연결 안되게 많아. 그리고 예상문제도 없고」 → 「클로드가 한 것 처럼 하자」(기획 ①)
① cert.json items[].gq — 기술사 19 = 기출 · 공개 37 · 예시 6 · 없음 21(11-11 큐넷 자료실 확인 · tools/자격증만들기/기출칸.py) · 값은 셋 중 하나
② 짝 예상문제(qzRef) — 제 예상문제가 없는 산업기사 셋만 · 가리키는 종목에 예상문제 있음
③ /cert «📝 기출문제는?» 글 — 공공누리 제1유형(140회) · 저작권 · 큐넷 · 43종목
④ 구운 쪽(prerender cert_gq_html · cert_item) — 83종목 모두 칸 하나 · 링크 = 큐넷 자료실(기출 1203 · 공개 · 예시 1204)을 종목 이름으로 찾은 쪽 · 새 창 · 없음 글
⑤ 화면(Cert.jsx 기출글)과 구운 쪽(CERT_GQ) 글이 같음 · 화면 링크 주소 꼴이 같음
"""
import importlib.util
import io
import json
import os
import re
import sys
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
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


d = json.loads(rd("web/src/data/cert.json"))
items = d["items"]
deep = d["deep"]
gq = {x["n"]: x.get("gq") for x in items}
from collections import Counter
c = Counter(v or "없음" for v in gq.values())
ok("① gq 수 — 기출 19 · 공개 37 · 예시 6 · 없음 21 (83종목)", dict(c) == {"기출": 19, "공개": 37, "예시": 6, "없음": 21} and len(items) == 83, dict(c))
ok("① 기술사는 모두 «기출» · «기출» 은 기술사만", all((x.get("gq") == "기출") == (x["lv"] == "기술사") for x in items), [x["n"] for x in items if (x.get("gq") == "기출") != (x["lv"] == "기술사")])
ok("① gq 값은 기출 · 공개 · 예시 셋 중 하나(없으면 칸 없음)", all(x.get("gq") in (None, "기출", "공개", "예시") for x in items))
ok("① 확인 날 gqAt = 2026-11-11 · 확인 메모에 11-11 자료실 확인", d.get("gqAt") == "2026-11-11" and "큐넷 자료실 «기출문제(기술사)» · «공개문제» 를 종목 이름 83개로 찾아 확인" in d["확인"]["메모"])
없음 = [x["n"] for x in items if not x.get("gq")]
ok("① 없음 21 — 토목기사 · 건축기사 · 건설안전기사 · 토목산업기사 · 건축산업기사 · 건설안전산업기사 들어 있음",
   all(k in 없음 for k in ("토목기사", "건축기사", "건설안전기사", "토목산업기사", "건축산업기사", "건설안전산업기사")), 없음)
짝 = {x["slug"]: x["qzRef"] for x in items if x.get("qzRef")}
ok("② 짝 예상문제 — 건축산업기사 → 건축기사 · 건설안전산업기사 → 건설안전기사 · 토목산업기사 → 토목기사 셋만",
   {k: v["s"] for k, v in 짝.items()} == {"geonchuk-saneopgisa": "geonchuk-gisa", "geonseol-anjeon-saneopgisa": "geonseol-anjeon-gisa", "tomok-saneopgisa": "tomok-gisa"}, 짝)
ok("② 짝이 가리키는 종목엔 예상문제가 있고 · 짝을 단 종목엔 제 예상문제가 없음 · 설명 글 있음",
   all(deep[v["s"]].get("quiz") and not deep[k].get("quiz") and len(v.get("d") or "") > 8 for k, v in 짝.items()))
gt = json.dumps(d.get("gichul"), ensure_ascii=False)
ok("③ /cert 기출 글 — 공공누리 제1유형 · 제140회 · 저작권 · 큐넷 · 43종목 · 옮겨 싣지 않고", all(k in gt for k in ("공공누리 제1유형", "제140회", "저작권", "큐넷", "43종목", "옮겨 싣지 않고")), gt[:200])

spec = importlib.util.spec_from_file_location("prerender", os.path.join(ROOT, "prerender.py"))
pr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pr)
shell = rd("web/index.html")
틀림 = []
for x in items:
    h = pr.cert_gq_html(d, x)
    if x.get("gq"):
        code = "1203" if x["gq"] == "기출" else "1204"
        url = f'https://www.q-net.or.kr/cst006.do?id=cst00601&amp;code={code}&amp;gSite=Q&amp;schType=A&amp;schText={quote(x["n"], safe="")}'
        제목 = {"기출": "📄 기출문제 — 큐넷 문제지", "공개": "📄 실기 공개문제 — 큐넷", "예시": "📄 실기 예시문제 — 큐넷"}[x["gq"]]
        if not (f'href="{url}"' in h and 'target="_blank"' in h and 'rel="noopener nofollow"' in h and 제목 in h and 'class="cert-big gq-go"' in h):
            틀림.append((x["n"], h[:160]))
    else:
        if deep[x["slug"]].get("quiz"):
            want = "위 «📝 예상문제 풀기» 로 연습하세요."
        elif x.get("qzRef"):
            want = f'<a href="/cert/{x["qzRef"]["s"]}/quiz">📝 '
        else:
            want = "예상문제는 차례로 만들고 있습니다."
        if not ('class="gq-none"' in h and "이 종목 문제는 큐넷 자료실(기출 · 공개문제)에 없습니다." in h and want in h and "href=\"https://" not in h):
            틀림.append((x["n"], h[:200]))
ok("④ 구운 칸 83 — 링크(1203 · 1204 · 종목 이름 찾기 · 새 창) · 없음 글(제 예상문제 · 짝 · 차례로)", not 틀림, 틀림[:3])
쪽틀림 = []
for x in items:
    p = pr.cert_item(shell, d, x, deep[x["slug"]])
    body = p.split('<div id="root">', 1)[-1] if '<div id="root">' in p else p
    k = body.count('class="cert-big gq-go"') + body.count('class="gq-none"')
    if k != 1 or pr.cert_gq_html(d, x) not in body:
        쪽틀림.append((x["slug"], k))
ok("④ 구운 쪽(cert_item) 83 — 맨 위 칸 안에 기출 칸 하나씩", not 쪽틀림, 쪽틀림[:5])
cj = rd("web/src/pages/Cert.jsx")
화면글 = dict(re.findall(r"(기출|공개|예시): \['(📄[^']+)', '([^']+)'\]", cj) and [(k, (a, b)) for k, a, b in re.findall(r"(기출|공개|예시): \['(📄[^']+)', '([^']+)'\]", cj)])
ok("⑤ 화면 기출글 = 구운 쪽 CERT_GQ(제목 · 설명 셋)", 화면글 == {k: tuple(v) for k, v in pr.CERT_GQ.items()}, (화면글, pr.CERT_GQ))
ok("⑤ 화면 링크 꼴 = 구운 쪽(cst006 · code 1203/1204 · gSite=Q · schType=A · schText=종목 이름)",
   "https://www.q-net.or.kr/cst006.do?id=cst00601&code=${code}&gSite=Q&schType=A&schText=${encodeURIComponent(이름)}" in cj
   and "큐넷찾기(x.gq === '기출' ? '1203' : '1204', x.n)" in cj)
ok("⑤ 화면 없음 글 = 구운 쪽 없음 글", "이 종목 문제는 큐넷 자료실(기출 · 공개문제)에 없습니다." in cj and "' 위 «📝 예상문제 풀기» 로 연습하세요.'" in cj and "' 예상문제는 차례로 만들고 있습니다.'" in cj)
ok("⑤ 셈 — |자격증기출| · |자격증기출짝| (사이트엔 안 보임)", "셈('|자격증기출|')" in cj and "셈('|자격증기출짝|')" in cj)
print(f"\n{'✗' if bad else '✓'} 시험_기출칸 {n - bad}/{n}")
sys.exit(1 if bad else 0)
