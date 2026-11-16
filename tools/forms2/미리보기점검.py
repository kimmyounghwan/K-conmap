# -*- coding: utf-8 -*-
"""미리보기점검.py <슬러그> … — publish 뒤 미리보기 그림(PREV 쪽)과 설명이 맞는지 봅니다 (2026-11-16 · G708~G711 설명 ↔ 그림 어긋남에서 만듦)
   publish.py 가 만든 /tmp/g10/f2/pub/_pdf/<슬러그>.pdf 의 쪽 글(pdftotext)로 가립니다.
     · 빈 쪽 = 머리글 «← 이 1행을 지우고 쓰셔도 됩니다» · 예시 쪽 = 머리글 «작성 예시»
     · 셈 쪽 = 머리글 다음 글이 «①» 로 시작
   설명에 «작성 예시» 가 있으면 예시 쪽이어야 하고, 없으면 빈 쪽 · 설명이 «①» 로 시작하면 셈 쪽, 아니면 셈 쪽이 아니어야 함.
   클라우드 전용(publish 뒤) — PC 올리기 꾸러미 시험에는 넣지 않음."""
import importlib
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
PDF = "/tmp/g10/f2/pub/_pdf"
BRAND = "K-건설맵|k-conmap.com건설서식"
BLANK = "←이1행을지우고쓰셔도됩니다"
EXM = "작성예시(가상의현장)"


def page_text(pdf, i):
    t = subprocess.run(["pdftotext", "-f", str(i), "-l", str(i), pdf, "-"], capture_output=True, text=True).stdout
    return "".join(t.split())


def kind(t):
    ex = EXM in t[:80] or (BLANK not in t[:80] and "작성예시" in t[:80])
    rest = t
    for h in (BRAND, BLANK, EXM):
        if rest.startswith(h):
            rest = rest[len(h):]
    rest = rest.lstrip("|")
    return ("예시" if ex else "빈"), rest.startswith("①")


def main():
    import registry
    bad = 0
    for slug in [a for a in sys.argv[1:] if not a.startswith("--")]:
        m = registry.get(slug)
        pdf = os.path.join(PDF, f"{m.SLUG}.pdf")
        if not os.path.exists(pdf):
            print(f"❌ {slug}: PDF 없음(publish 먼저)"); bad += 1; continue
        if not getattr(m, "PREV", None):
            print(f"· {slug}: PREV 없음(넘김)"); continue
        out = []
        for j, (pg, cap) in enumerate(m.PREV, 1):
            st, sem = kind(page_text(pdf, pg))
            want_ex = "작성 예시" in cap
            want_sem = cap.lstrip().startswith("①")
            ok = (st == "예시") == want_ex and sem == want_sem
            if not ok:
                bad += 1
            out.append(f"{'✓' if ok else '✗'}{j}({pg}쪽 {st}{' 셈' if sem else ''})")
        print(f"{'✅' if all(o.startswith('✓') for o in out) else '❌'} {slug}: " + " · ".join(out))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
