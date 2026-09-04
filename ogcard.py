# -*- coding: utf-8 -*-
"""
ogcard.py — 카톡·네이버·구글 미리보기에 뜨는 «그림 카드» 를 굽습니다. (2026-09-04)

왜 만들었나
  실측: 사이트 전체에 og:image 가 **하나도 없었습니다.** 제목·설명은 어제 작업으로
  주소마다 달라졌는데, 카톡에 링크를 붙이면 그림 없는 회색 칸만 떴습니다.
  한국에서 링크가 퍼지는 곳은 단톡방입니다. 그림이 없으면 아무도 안 누릅니다.
  공고명·낙찰률·업체명이 박힌 카드면 «투찰한 업체들이 서로» 퍼 나릅니다.

⚠️ 속도와 크기를 실측하고 정한 방식입니다 (1200×630 한 장 기준)
      RGB → MEDIANCUT quantize   106 ms · 14.7 KB
      P모드 직접 그리기(계단)      14 ms ·  9.4 KB   ← 글자가 거칩니다
      **고정 팔레트 quantize**     16 ms · 15.9 KB   ← 이걸 씁니다 (부드럽고 충분히 빠름)
  하루 21번 도는 배포라 «장당 몇 ms» 가 그대로 21배가 됩니다. 100ms 짜리는 못 씁니다.

⚠️ 폰트는 저장소에 넣어 둔 `assets/KcmKR-Bold.otf` 입니다 (Noto Sans CJK KR 부분폰트, 1.8MB).
  GitHub 러너에 한글 폰트가 있다는 보장이 없고, **워크플로는 손으로만 고칠 수 있는 파일**이라
  «apt 로 폰트 설치» 를 요구하는 설계를 피했습니다 (CLAUDE.md).
  폰트나 Pillow 가 없으면 조용히 «안 만듦» 으로 떨어집니다 — 깨진 그림을 내보내지 않습니다.
"""

import os

W, H = 1200, 630
PAD = 72

BG = (15, 32, 63)
FG = {
    "white": (255, 255, 255),
    "muted": (150, 175, 210),
    "light": (210, 220, 235),
    "green": (90, 200, 140),
    "blue": (86, 160, 255),
    "amber": (255, 176, 92),
    "dim": (116, 142, 178),
}


def _lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


class OgMaker:
    """dist 안에 og/*.png 를 굽습니다. available 이 False 면 아무것도 안 만듭니다."""

    def __init__(self, dist, font_path, fmt):
        # ⚠️ fmt 는 prerender.py 의 서식 함수를 «그대로 받아» 씁니다 (won_short·pct·num).
        #    여기에 다시 적으면 화면·HTML·그림이 서로 다른 금액을 쓰게 됩니다
        #    (CLAUDE.md — 같은 규칙을 두 번 적지 않는다).
        self.dist = dist
        self.fmt = fmt
        self.available = False
        try:
            from PIL import Image, ImageDraw, ImageFont
        except Exception:
            print("  · Pillow 가 없어 미리보기 그림은 건너뜁니다 (pip install pillow)")
            return
        if not os.path.exists(font_path):
            print(f"  · 폰트가 없어 미리보기 그림은 건너뜁니다 ({font_path})")
            return
        self._Image, self._Draw = Image, ImageDraw
        try:
            self.f_big = ImageFont.truetype(font_path, 84)
            self.f_ttl = ImageFont.truetype(font_path, 56)
            self.f_ttl_s = ImageFont.truetype(font_path, 44)
            self.f_sub = ImageFont.truetype(font_path, 34)
            self.f_sm = ImageFont.truetype(font_path, 30)
        except Exception as e:
            print(f"  · 폰트를 못 읽었습니다 — 미리보기 그림 건너뜀 ({e})")
            return

        # 고정 팔레트: 배경 ↔ 각 전경색 사이 8단계. 글자 가장자리(안티에일리어싱)가 여기 들어갑니다.
        pal = []
        for c in [BG] + list(FG.values()):
            for k in range(8):
                pal.extend(_lerp(BG, c, k / 7.0))
        pal = pal[:768] + [0] * (768 - min(768, len(pal)))
        self._pal = Image.new("P", (1, 1))
        self._pal.putpalette(pal)
        self.available = True
        self.made = 0
        self.bad = 0

    # ── 그리기 도구 ───────────────────────────────────────────────
    def _wrap(self, draw, text, font, width, lines):
        """글자를 재서 줄을 나눕니다. 다 못 담으면 마지막 줄 끝에 … 를 붙입니다."""
        text = str(text)
        out, cur, used = [], "", 0
        for idx, ch in enumerate(text):
            if draw.textlength(cur + ch, font=font) > width and cur:
                out.append(cur)
                cur = ch
                if len(out) >= lines:
                    used = idx
                    break
            else:
                cur += ch
            used = idx + 1
        if len(out) < lines and cur:
            out.append(cur)
        if used < len(text) and out:      # 남은 글자가 있다 → 잘렸다고 밝힙니다
            last = out[-1]
            while last and draw.textlength(last + "…", font=font) > width:
                last = last[:-1]
            out[-1] = last + "…"
        return out or [""]

    def _card(self, path, title, sub, big, big_color, foot, badge=None):
        """⚠️ 자리는 «위에서부터 쌓아» 정합니다. 좌표를 손으로 박으면 제목이 두 줄일 때
           아래 칸을 덮습니다 — 실제로 배지가 제목 위로 올라탔습니다(2026-09-04).
           마지막에 _fits() 가 «칸 밖으로 나갔나» 를 좌표로 확인합니다."""
        Image, ImageDraw = self._Image, self._Draw
        im = Image.new("RGB", (W, H), BG)
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, W, 12], fill=FG["blue"])
        inner = W - PAD * 2
        boxes = []

        y = 46
        if badge:                       # 제목 «위»에 둡니다. 옆에 두면 긴 제목과 겹칩니다.
            bw = d.textlength(badge, font=self.f_sm)
            d.rounded_rectangle([PAD, y, PAD + bw + 30, y + 48], 12,
                                fill=_lerp(BG, FG["blue"], 0.30))
            d.text((PAD + 15, y + 6), badge, font=self.f_sm, fill=FG["white"])
            boxes.append((PAD, y, PAD + bw + 30, y + 48))
            y += 66

        lines = self._wrap(d, title, self.f_ttl, inner, 2)
        for ln in lines:
            d.text((PAD, y), ln, font=self.f_ttl, fill=FG["white"])
            boxes.append((PAD, y, PAD + d.textlength(ln, font=self.f_ttl), y + 66))
            y += 72
        if sub:
            t = self._wrap(d, sub, self.f_sub, inner, 1)[0]
            d.text((PAD, y + 2), t, font=self.f_sub, fill=FG["muted"])
            boxes.append((PAD, y + 2, PAD + d.textlength(t, font=self.f_sub), y + 46))
            y += 52

        y = max(y + 34, 344)            # 큰 숫자는 아래쪽에 고정 — 카드마다 눈이 같은 곳을 봅니다
        if big:
            t = self._wrap(d, str(big), self.f_big, inner, 1)[0]
            d.text((PAD, y), t, font=self.f_big, fill=FG.get(big_color, FG["green"]))
            boxes.append((PAD, y, PAD + d.textlength(t, font=self.f_big), y + 100))
            y += 112
        if foot:
            t = self._wrap(d, foot, self.f_sub, inner, 1)[0]
            d.text((PAD, y), t, font=self.f_sub, fill=FG["light"])
            boxes.append((PAD, y, PAD + d.textlength(t, font=self.f_sub), y + 44))

        brand_y = H - 74
        d.text((PAD, brand_y), "K-건설맵 · k-conmap.com", font=self.f_sm, fill=FG["dim"])
        self._fits(path, boxes, brand_y)

        p = os.path.join(self.dist, *path.split("/"))
        os.makedirs(os.path.dirname(p), exist_ok=True)
        im.quantize(palette=self._pal, dither=Image.Dither.NONE).save(p, optimize=False)
        self.made += 1
        return "/" + path

    def _fits(self, path, boxes, brand_y):
        """칸 밖으로 나갔거나 서로 겹쳤으면 «몇 장에서 났는지» 세어 둡니다.
           스크린샷을 눈으로 보는 것은 확인이 아닙니다 — 두 번 놓친 적이 있습니다."""
        bad = None
        for i, (x0, y0, x1, y1) in enumerate(boxes):
            if x1 > W - PAD + 1 or y1 > brand_y - 4 or y0 < 12:
                bad = f"칸 밖 ({int(x0)},{int(y0)})–({int(x1)},{int(y1)})"
            for x2, y2, x3, y3 in boxes[i + 1:]:
                if x0 < x3 and x2 < x1 and y0 < y3 - 6 and y2 < y1 - 6:
                    bad = f"겹침 ({int(x0)},{int(y0)}) ↔ ({int(x2)},{int(y2)})"
        if bad:
            self.bad += 1
            if self.bad <= 3:
                print(f"  ⚠️ 미리보기 그림 배치 이상 — {path} · {bad}")

    # ── 카드 종류 ─────────────────────────────────────────────────
    def default(self):
        """어느 페이지에도 그림이 없을 때 쓰는 기본 카드. 하나만 만듭니다."""
        if not self.available:
            return None
        return self._card("og/default.png",
                          "공공 입찰, 얼마에 넣어야 하나",
                          "조달청 나라장터 공사 공고·개찰 결과 · 회원가입 없이 무료",
                          "바로투찰", "green",
                          "기초금액이 실린 공고는 권장 투찰금액이 바로 나옵니다")

    def tab(self, slug, title, sub, big, foot):
        """탭 페이지(1순위·공고·분석·구인구직) — 사이트 자체를 카톡에 붙일 때 뜨는 카드."""
        if not self.available:
            return None
        return self._card(f"og/tab/{slug}.png", title, sub, big, "green", foot)

    def notice(self, r):
        if not self.available:
            return None
        no = str(r.get("no") or "")
        nm = str(r.get("name") or no)
        inst = str(r.get("inst") or "")
        ws, pc, nu = self.fmt["won_short"], self.fmt["pct"], self.fmt["num"]
        win, rate = r.get("win"), r.get("rate")
        if win:   # 개찰이 끝난 건 — 사람들이 퍼 나르는 건 «얼마에 갔나» 입니다
            sub = " · ".join(x for x in (inst, (self.fmt["date_full"](r.get("dt")) or ""),
                                         (f"참가 {nu(r.get('np'))}곳" if r.get("np") else "")) if x)
            big = pc(rate, 3) or "개찰 완료"
            foot = " · ".join(x for x in (f"낙찰 {win}",
                                          (f"낙찰금액 {ws(r.get('sAmt') or r.get('amt'))}"
                                           if (r.get("sAmt") or r.get("amt")) else ""),
                                          (f"기초금액 {ws(r.get('base'))}" if r.get("base") else "")) if x)
            badge, color = "개찰 결과", "green"
        else:     # 마감 전 — 퍼가는 이유는 «이거 넣어볼까» 입니다
            sub = " · ".join(x for x in (inst,
                                         (f"마감 {self.fmt['date_full'](r.get('close'))}"
                                          if r.get("close") else "")) if x)
            big = ws(r.get("base")) or ws(r.get("budget")) or "기초금액 미공개"
            foot = "기초금액 · 권장 투찰금액을 바로 봅니다" if r.get("base") else "마감 전 입찰 공고"
            badge, color = "마감 전", "blue"
        return self._card(f"og/notice/{no}.png", nm, sub, big, color, foot, badge)

    def agency(self, name, a):
        if not self.available:
            return None
        pc, nu = self.fmt["pct"], self.fmt["num"]
        n, avg = nu(a.get("n")), pc((a.get("s") or {}).get("avg"))
        return self._card(f"og/agency/{name}.png", name,
                          "발주기관 낙찰 분석 · 3년치 개찰 기록",
                          avg or (f"{n}건" if n else "발주기관"), "green",
                          " · ".join(x for x in (("평균 투찰률" if avg else ""),
                                                 (f"3년간 개찰 {n}건" if n else "")) if x),
                          "발주기관")

    def corp(self, key, c):
        if not self.available:
            return None
        pc, nu = self.fmt["pct"], self.fmt["num"]
        nm = str(c.get("name") or key)
        n, avg = nu(c.get("n")), pc((c.get("s") or {}).get("avg"))
        return self._card(f"og/corp/{key}.png", nm,
                          "낙찰 실적 · 3년치 개찰 기록",
                          (f"{n}건" if n else "낙찰 실적"), "green",
                          (f"평균 투찰률 {avg}" if avg else "지역·기관별 낙찰 분포"),
                          "업체")
