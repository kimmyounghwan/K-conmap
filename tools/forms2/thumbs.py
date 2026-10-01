# -*- coding: utf-8 -*-
"""thumbs.py — 서식 목록 카드용 작은 그림 (G103 · 2026-10-01, 소장님 「예스폼에 나오는 것처럼 우리도 그렇게」)

  python3 thumbs.py            # 미리보기 그림(prev)이 있는 서식 전부
  python3 thumbs.py 슬러그 …   # 고른 것만 (publish.py 가 끝에 부름)

미리보기 첫 장(빈 서식) web/public/forms/v2/{…}-1.webp → web/public/forms/v2/t/{slug}.webp (가로 260px).
화면(Forms.jsx 썸)은 prev 가 있으면 이 주소를 씁니다 — 그림이 빠지면 check() 가 멈춥니다.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PUB = os.path.join(ROOT, "web", "public")
DATA = os.path.join(ROOT, "web", "src", "data")
W = 260


def forms():
    out = []
    for fn in ("forms.json", "forms_orig.json"):
        d = json.loads(open(os.path.join(DATA, fn), "rb").read().decode("utf-8"))
        out += [f for f in d["forms"] if f.get("prev")]
    return out


def make(f):
    from PIL import Image
    src = os.path.join(PUB, f["prev"][0].lstrip("/"))
    dst = os.path.join(PUB, "forms", "v2", "t", f"{f['slug']}.webp")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src).convert("RGB")
    h = round(im.height * W / im.width)
    im.resize((W, h), Image.LANCZOS).save(dst, "WEBP", quality=72, method=6)
    return dst


def check():
    miss = [f["slug"] for f in forms() if not os.path.exists(os.path.join(PUB, "forms", "v2", "t", f"{f['slug']}.webp"))]
    assert not miss, ("작은 그림이 없는 서식", miss)
    return len(forms())


if __name__ == "__main__":
    want = set(a for a in sys.argv[1:] if not a.startswith("--"))
    n, kb = 0, 0
    for f in forms():
        if want and f["slug"] not in want:
            continue
        p = make(f)
        n += 1
        kb += os.path.getsize(p)
    print(f"작은 그림 {n}장 · {kb // 1024}KB · 빠진 것 없음({check()}가지)")
