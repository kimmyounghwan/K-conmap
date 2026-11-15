# -*- coding: utf-8 -*-
"""📐 G694 (2026-11-16) 도면 작성대행 «견본» 시험 — python tools/시험_견본도면.py (인터넷 · 다른 꾸러미 없이 · PC 올리기에도)
   소장님 11-15 «그렇게 해»(안 ⑦ 가상 현장 도면 견본 2~3장 · 그림 PDF) — 만드는 것은 tools/견본도면.py(ezdxf · matplotlib · 클라우드)
   ① 파일: web/public/cn/견본_시공상세도.pdf · 견본_가설안전시설배치도.pdf + _작게.webp 있음 · %PDF · 그림만(글자 층 /Font 없음 — 엑셀 · 캐드로 안 바뀜) · A3 가로 · 1.2MB 안
   ② 문의 화면(contact.html)이 꼭 이 두 장을 고리로 걸고 그림(작게.webp)을 씀(두 벌 대조) · 도면 작성대행 묶음 아래에만
   ③ 만드는 쪽(tools/견본도면.py) 공사명은 가상(○○지구) · «견본» 표시(옅은 글 · 표제란) · 재료표 수량 = 그린 치수 셈
"""
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
    print(("  ✓ " if cond else "  ✗ ") + name + ("" if cond or got is None else f" = {got}"))


def 읽(p, b=False):
    with open(os.path.join(ROOT, p), 'rb' if b else 'r', **({} if b else {'encoding': 'utf-8'})) as f:
        return f.read()


장들 = ['견본_시공상세도', '견본_가설안전시설배치도']
print('① 파일')
for 장 in 장들:
    pdf = f'web/public/cn/{장}.pdf'
    있음 = os.path.exists(os.path.join(ROOT, pdf))
    ok(f'{pdf} 있음', 있음)
    if not 있음:
        continue
    b = 읽(pdf, True)
    ok(f'{장} — %PDF 머리 · 크기 {len(b):,} B (100KB ~ 1.2MB)', b[:4] == b'%PDF' and 100_000 < len(b) < 1_200_000, len(b))
    ok(f'{장} — 글자 층 없음(/Font 0) · 그림 있음(/Image)', b'/Font' not in b and b'/Image' in b)
    m = re.search(rb'/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]', b)
    w, h = (float(m.group(1)), float(m.group(2))) if m else (0, 0)
    ok(f'{장} — A3 가로({w:.1f} × {h:.1f} pt)', abs(w - 1190.55) < 3 and abs(h - 841.89) < 3, (w, h))
    웹 = f'web/public/cn/{장}_작게.webp'
    ok(f'{웹} 있음 · RIFF/WEBP', os.path.exists(os.path.join(ROOT, 웹)) and 읽(웹, True)[:4] == b'RIFF' and 읽(웹, True)[8:12] == b'WEBP')

print('② 문의 화면')
문 = 읽('web/public/contact.html')
고리 = re.findall(r"\['(견본_[^']+)', '([^']+)', '([^']+)'\]", 문)
ok(f'contact.html 견본 고리 = 파일 두 장 {[g[0] for g in 고리]}', [g[0] for g in 고리] == 장들, 고리)
ok("contact.html — '/cn/' + x[0] + '.pdf' · '_작게.webp' · 새 창 · 도면 작성대행 묶음에서만", "a.href = '/cn/' + x[0] + '.pdf'" in 문 and "'_작게.webp'" in 문 and "a.target = '_blank'" in 문 and "if (g[0] === '도면 작성대행') {" in 문)
ok("contact.html — 숨은 셈 |공사연결|견본-<무엇>", "셈('|공사연결|견본-' + x[2])" in 문)

print('③ 만드는 쪽')
만 = 읽('tools/견본도면.py')
ok("tools/견본도면.py — 공사명은 가상(«가상 ○○지구 배수로 정비공사» 하나 · 진짜 이름은 올리기 전 이름 grep 이 봄 — 공개 저장소라 그 목록은 여기 안 적음)", "공사명 = '가상 ○○지구 배수로 정비공사'" in 만 and 만.count('공사명 = ') == 1)
ok("tools/견본도면.py — «가상 ○○지구» · 옅은 «견본 · K-건설맵» · 표제란 «실제 시공용 아님»", '가상 ○○지구' in 만 and "'견본 · K-건설맵'" in 만 and '실제 시공용 아님' in 만)
ok('tools/견본도면.py — «클로드» · «무료» 말 없음', '클로드' not in 만 and '무료' not in 만)
# 재료표 셈 = 그린 치수(단면): 쇄석 0.9 × 0.15 · 콘크리트 0.7 × 0.1 · 터파기 (0.9 + 1.332)/2 × 0.72 · 되메우기 = 터파기 − 쇄석 − 콘크리트 − 0.52 × 0.47
쇄, 콘 = 0.9 * 0.15, 0.7 * 0.1
터 = (0.9 + (0.9 + 2 * 0.72 * 0.3)) / 2 * 0.72
되 = 터 - 쇄 - 콘 - 0.52 * 0.47
ok(f'재료표 셈(1m 당) 터파기 {터:.3f} · 쇄석 {쇄:.3f} · 콘크리트 {콘:.3f} · 되메우기 {되:.3f}', f'{터:.3f}' == '0.804' and f'{쇄:.3f}' == '0.135' and f'{콘:.3f}' == '0.070' and f'{되:.3f}' == '0.354')
ok('tools/견본도면.py — 단면 치수 그대로(플안폭 400 · 벽 60 · 바닥 70 · 기초 100/90 · 쇄석 150/100 · 기울기 0.3)',
   '플안폭, 플안높이, 벽두께, 바닥두께 = 400, 400, 60, 70' in 만 and '콘두께, 콘여유 = 100, 90' in 만 and '쇄두께, 쇄여유 = 150, 100' in 만 and '경사 = 0.3' in 만)

print(f"\n시험_견본도면 {n - bad}/{n}")
sys.exit(1 if bad else 0)
