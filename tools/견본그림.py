# -*- coding: utf-8 -*-
"""📄 G818 (2026-11-21) 견본 PDF → 쪽 그림(webp) — 견본을 «새 창(PDF)» 대신 사이트 안 큰 그림으로 보이게(견본보기.jsx · contact.html)

소장님 11-21 「견본보기 서류대행 닫기가 없어 ㅎㅎ」 — 폰 바탕화면 아이콘(앱)으로 열면 견본 PDF 가 앱 화면을 통째로 덮어 돌아올 길이 없었음.
→ 견본은 쪽 그림으로 사이트 안 덮개에 띄우고 위 · 아래 «✕ 닫기». 이 파일은 그 그림을 PDF 에서 다시 굽는 도구(견본 PDF 를 바꾸면 다시 돌림).

    python3 tools/견본그림.py            # web/public 아래 그림을 다시 구움(pdftoppm · Pillow 필요 — 클라우드)

  · 성적표 견본(report-sample.pdf · A4 7쪽) → web/public/sample/report/p1 ~ p7.webp(135dpi · 품질 80)
  · 발주기관 분석 견본(agency-sample.pdf · A4 7쪽) → web/public/sample/agency/p1 ~ p7.webp
  · 도면 작성대행 견본 둘(cn/견본_*.pdf · A3 한 쪽) → web/public/cn/견본_*_크게.webp(145dpi)
"""
import glob
import os
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "web", "public")
할일 = [
    ("report-sample.pdf", os.path.join("sample", "report"), 135, "쪽"),
    ("agency-sample.pdf", os.path.join("sample", "agency"), 135, "쪽"),
    (os.path.join("cn", "견본_시공상세도.pdf"), "cn", 145, "크게"),
    (os.path.join("cn", "견본_가설안전시설배치도.pdf"), "cn", 145, "크게"),
]


def 굽기(pdf, 곳, dpi, 꼴, log=print):
    from PIL import Image
    src = os.path.join(PUB, pdf)
    out = os.path.join(PUB, 곳)
    os.makedirs(out, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        subprocess.run(["pdftoppm", "-r", str(dpi), "-png", src, os.path.join(t, "p")], check=True)
        쪽들 = sorted(glob.glob(os.path.join(t, "p-*.png")), key=lambda p: int(p.rsplit("-", 1)[1][:-4]))
        이름들 = []
        for i, p in enumerate(쪽들, 1):
            이름 = ("p%d.webp" % i) if 꼴 == "쪽" else os.path.basename(pdf)[:-4] + "_크게.webp"
            Image.open(p).convert("RGB").save(os.path.join(out, 이름), "WEBP", quality=80, method=6)
            이름들.append(이름)
    log("📄 %s → %s/%s (%d장)" % (pdf, 곳, ", ".join(이름들), len(이름들)))
    return 이름들


if __name__ == "__main__":
    for pdf, 곳, dpi, 꼴 in 할일:
        굽기(pdf, 곳, dpi, 꼴)
    sys.exit(0)
