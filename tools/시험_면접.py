# -*- coding: utf-8 -*-
"""🎤 G631 기술사 면접 준비(web/src/data/interview.json) 시험 — python tools/시험_면접.py

소장님(11-10): 「내 컴퓨터에 기술사 서브노트 있으면 찾아서 이것도 건설맵에 올려줘. 다르게 고쳐서」 · 「이것도, 자격증 탭에 추가해서....정리해줘. 고쳐서 올려줘.」
① 자료 꼴 — 종목(cert.json 깊은 글이 있는 기술사) · 분야 10(겹침 없음) · 질문 번호 1 ~ N 차례 · 질문마다 분야 · 답 1 ~ 6줄 · 근거는 [이름, 법제처 · 국가건설기준센터 주소]
② cert.json deep[종목].interview.수 = 질문 수 · 화면 길(main.jsx /cert/:slug/interview) · 구운 쪽(prerender cert_interview · cert/{종목}/interview.html) · 사이트맵 · IndexNow · Crumbs 가운데 칸 · 빠른 찾기
③ 글 규칙 — «무료» · «클로드» 없음 · 받은 노트의 개인 경력 흔적(사우디 · Revamping · 수험번호 · 주민등록번호 …) 없음 · 표준품셈 숫자(할증률) 없음 ·
   법령 근거 확인 표시(확인.법령 — 공사계약일반조건 · 건설기술 진흥법 시행령 제101조의2 · 지하안전법 시행령 · 산안 기준규칙 제304조 · 건설산업기본법 시행령 [별표 4])
④ 숫자 · 기준이 원문과 같은지(11-10 법제처 확인 값) — 하자담보 교량 · 터널 · 댐 10년 · 콘크리트 포장 3년 · 아스팔트 2년 · 토공 2년 / 누전차단기 30mA · 0.03초 /
   지하안전평가 20m · 소규모 10m / 가설구조물 비계 31m · 거푸집 · 동바리 5m · 흙막이 2m / 면접 60점 / 설계변경 네 가지 사유
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
    print(("  ✓ " if cond else "  ✗ ") + name + ("" if cond or got is None else f" = {str(got)[:400]}"))


def rd(p):
    with io.open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


iv = json.loads(rd("web/src/data/interview.json"))
cert = json.loads(rd("web/src/data/cert.json"))
종목들 = [k for k in iv if k not in ("at", "확인")]
print("① 자료 꼴")
ok("종목 — 토목시공기술사(깊은 글이 있는 기술사)", 종목들 == ["tomok-sigong-gisulsa"] and all(k in cert["deep"] and next(x for x in cert["items"] if x["slug"] == k)["lv"] == "기술사" for k in 종목들), 종목들)
for k in 종목들:
    t = iv[k]
    fk = [f["k"] for f in t["fields"]]
    qs = t["qs"]
    ok(f"{k} — 분야 10 · 겹침 없음 · 이름 · 아이콘", len(fk) == 10 and len(set(fk)) == 10 and all(f.get("n") and f.get("ic") for f in t["fields"]), fk)
    ok(f"{k} — 질문 {len(qs)}개(100 넘게) · 번호 1 ~ N 차례 · 질문 글 겹침 없음", len(qs) >= 100 and [x["id"] for x in qs] == list(range(1, len(qs) + 1)) and len({x["q"] for x in qs}) == len(qs), len(qs))
    ok(f"{k} — 질문마다 분야 · 답 1 ~ 6줄(빈 줄 없음) · 분야 차례대로", all(x["k"] in fk and 1 <= len(x["a"]) <= 6 and all(isinstance(a, str) and a.strip() for a in x["a"]) for x in qs)
       and [fk.index(x["k"]) for x in qs] == sorted(fk.index(x["k"]) for x in qs), [x["id"] for x in qs if not (x["k"] in fk and 1 <= len(x["a"]) <= 6)][:5])
    srcs = [s for x in qs for s in x.get("s") or []]
    ok(f"{k} — 근거 {len(srcs)}개 = [이름, 법제처 · 국가건설기준센터 주소]", srcs and all(len(s) == 2 and s[0] and re.match(r"https://www\.(law\.go\.kr|kcsc\.re\.kr)/", s[1]) for s in srcs), [s for s in srcs if not re.match(r"https://www\.(law\.go\.kr|kcsc\.re\.kr)/", s[1])][:3])
    ok(f"{k} — 제목 · 설명 · 머리 · 소개 · 준비 차례(블록 p · steps · warn)", t.get("h1") and t.get("title", "").endswith("| K-건설맵") and t.get("desc") and t.get("lead")
       and {b["t"] for b in t["how"]} <= {"p", "steps", "warn", "ul"} and any(b["t"] == "steps" for b in t["how"]))

print("② 길")
mj, pr, sm, cr, qf = rd("web/src/main.jsx"), rd("prerender.py"), rd("sitemap.py"), rd("web/src/Crumbs.jsx"), rd("web/src/lib/빠른찾기.js")
for k in 종목들:
    x = next(y for y in cert["items"] if y["slug"] == k)
    ok(f"cert.json deep[{k}].interview.수 = 질문 수({len(iv[k]['qs'])})", (cert["deep"][k].get("interview") or {}).get("수") == len(iv[k]["qs"]))
    ok(f"Crumbs 가운데 칸 «{x['n']}»", f"'/cert/{k}': '{x['n']}'" in cr)
ok("main.jsx /cert/:slug/interview · CertInterview(lazyPage)", 'path="/cert/:slug/interview"' in mj and "lazyPage(() => import('./pages/CertInterview.jsx'))" in mj)
ok("prerender — cert_interview · cert/{종목}/interview.html · load_interview · IndexNow", "def cert_interview" in pr and 'write(f"cert/{s}/interview.html"' in pr and "def load_interview" in pr and "/interview' for x in" in pr)
ok("sitemap — /cert/{종목}/interview", '/interview"' in sm)
ok("빠른 찾기 — «○○ 면접 준비» · 자격말에 서브노트 · 구술", "면접 준비" in qf and "서브노트|구술" in qf)

print("③ 글 규칙")
글 = json.dumps(iv, ensure_ascii=False)
ok("«무료» · «클로드» 없음", not re.search(r"무료|클로드", 글), re.findall(r".{0,15}(?:무료|클로드).{0,15}", 글)[:3])
흔적 = ["사우디", "Saudi", "Revamping", "Ammonia", "SUNEX", "수험번호", "주민등록번호", "1,629본", "공사과장", "교수님"]
ok("받은 노트의 개인 경력 흔적 없음(" + " · ".join(흔적[:6]) + " …)", not any(w in 글 for w in 흔적), [w for w in 흔적 if w in 글])
ok("표준품셈 숫자(할증률 등) 없음", not re.search(r"할증률|할증 ?\d", 글), re.findall(r".{0,15}할증.{0,15}", 글)[:3])
확인 = iv["확인"]["법령"]
ok("법령 확인 표시 — 공사계약일반조건 · 건설기술 진흥법 시행령 제101조의2 · 지하안전 · 제304조 · [별표 4]", all(w in 확인 for w in ["공사계약일반조건", "제101조의2", "지하안전관리에 관한 특별법 시행령", "제304조", "[별표 4]"]), 확인)

print("④ 숫자 · 기준 = 11-10 원문")
def 답(조각):
    return next((" ".join(x["a"]) for k in 종목들 for x in iv[k]["qs"] if 조각 in x["q"]), "")
하자 = 답("하자담보책임기간")
ok("하자담보 — 1년 ~ 10년 · 교량(50m · 500m) · 터널 · 댐 10년 · 콘크리트 포장 3년 · 아스팔트 2년 · 토공 2년", all(w in 하자 for w in ["1년 ~ 10년", "50m", "500m", "10년", "콘크리트 포장 도로 3년", "아스팔트 포장 도로 2년", "토공 2년"]), 하자[:200])
ok("누전차단기 — 30mA 이하 · 0.03초 이내", "30mA 이하" in 답("누전차단기") and "0.03초 이내" in 답("누전차단기"))
지하 = 답("지하안전평가")
ok("지하안전평가 — 20m 이상 · 터널(산악 · 수저 제외) · 소규모 10m 이상 20m 미만", "20m 이상" in 지하 and "산악터널" in 지하 and "10m 이상 20m 미만" in 지하, 지하[:200])
가설 = 답("관계전문가 구조 확인")
ok("가설구조물 — 비계 31m · 거푸집 · 동바리 5m · 흙막이 2m · 외부작업 10m", all(w in 가설 for w in ["31m", "5m 이상 거푸집 및 동바리", "2m 이상 흙막이", "10m 이상"]), 가설[:200])
ok("면접 합격 60점(시행령 제20조) · 구술형", any("60점 이상" in b.get("text", "") and "제20조" in b.get("text", "") and "구술형" in b.get("text", "") for k in 종목들 for b in iv[k]["how"]))
설변 = 답("설계변경을 할 수 있는 경우")
ok("설계변경 사유 네 가지(불분명 · 누락 · 오류 · 상호 모순 / 현장 상태 / 새 기술 · 공법 / 발주기관 필요)", all(w in 설변 for w in ["불분명", "누락", "오류", "상호 모순", "현장 상태", "새 기술", "발주기관"]), 설변[:200])

print(f"\n{'❌' if bad else '✅'} 시험_면접 {n - bad}/{n}")
sys.exit(1 if bad else 0)
