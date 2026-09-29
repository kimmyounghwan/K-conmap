# -*- coding: utf-8 -*-
"""발파 위치도 «작성 예시» 그림 — 가상의 현장을 PIL 로 그린 것(실제 현장 도면이 아님).
표지판 두 장(출입금지 · 위험 발파중)만 원본 계획서의 그림을 그대로 씀. python3 make_map.py → example_map.png"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
F = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
if not os.path.exists(F):
    F = "/usr/share/fonts/truetype/nanum/NanumSquareRoundB.ttf"
W, H = 1400, 820
im = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(im)
f1 = ImageFont.truetype(F, 26)
f2 = ImageFont.truetype(F, 20)
f3 = ImageFont.truetype(F, 17)
# 등고선 느낌의 배경선
for k in range(9):
    pts = [(x, 120 + k * 70 + 30 * math.sin((x + k * 80) / 160)) for x in range(0, 1000, 20)]
    d.line(pts, fill=(214, 220, 228), width=2)
# 도로
d.polygon([(0, 690), (1000, 610), (1000, 660), (0, 740)], fill=(203, 213, 225))
d.text((40, 745), "현장 진입도로", font=f2, fill=(71, 85, 105))
# 발파 구역
cx, cy = 560, 330
d.polygon([(470, 260), (660, 250), (690, 400), (500, 420)], fill=(254, 202, 202), outline=(220, 38, 38), width=4)
for k in range(1, 9):              # 천공 자리(점)
    for j in range(1, 6):
        x = 470 + k * 22 + j * 4
        y = 255 + j * 28 + k * 1
        d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(185, 28, 28))
d.rectangle([505, 425, 655, 457], fill="white")
d.text((515, 428), "발 파 구 역", font=f1, fill=(153, 27, 27))
# 경계선(반경)
r = 250
for a in range(0, 360, 6):
    a1, a2 = math.radians(a), math.radians(a + 3)
    d.line([(cx + r * math.cos(a1), cy + r * math.sin(a1)), (cx + r * math.cos(a2), cy + r * math.sin(a2))], fill=(234, 88, 12), width=4)
d.line([(cx + 120 * math.cos(math.radians(-35)), cy + 120 * math.sin(math.radians(-35))), (cx + r * math.cos(math.radians(-35)), cy + r * math.sin(math.radians(-35)))], fill=(234, 88, 12), width=2)
d.text((cx + 90, cy - 150), "경계 반경 R", font=f2, fill=(194, 65, 12))
# 신호수(파란 사람) — 경계선 위 네 곳
def man(x, y):
    d.ellipse([x - 9, y - 40, x + 9, y - 22], fill=(37, 99, 235))
    d.line([(x, y - 22), (x, y + 8)], fill=(37, 99, 235), width=6)
    d.line([(x - 16, y - 12), (x + 16, y - 26)], fill=(37, 99, 235), width=5)
    d.line([(x, y + 8), (x - 10, y + 30)], fill=(37, 99, 235), width=5)
    d.line([(x, y + 8), (x + 10, y + 30)], fill=(37, 99, 235), width=5)
    d.rectangle([x + 14, y - 34, x + 26, y - 22], fill=(220, 38, 38))
for a in (200, 290, 20, 110):
    man(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
# 표지판(원본 그림)
s1 = Image.open(os.path.join(HERE, "sign_churip.jpg")).resize((62, 94))
s2 = Image.open(os.path.join(HERE, "sign_balpa.jpg")).resize((62, 94))
im.paste(s1, (250, 560))
im.paste(s2, (330, 560))
im.paste(s1, (860, 470))
d.line([(290, 655), (290, 690)], fill=(71, 85, 105), width=3)
# 대피 장소
d.rectangle([60, 80, 230, 170], outline=(22, 163, 74), width=4, fill=(220, 252, 231))
d.text((80, 110), "근로자 대피 장소", font=f3, fill=(21, 128, 61))
# 범례
lx, ly = 1030, 120
d.text((lx, 60), "범  례", font=f1, fill=(17, 24, 39))
d.rectangle([lx, ly, lx + 40, ly + 26], fill=(254, 202, 202), outline=(220, 38, 38), width=3)
d.text((lx + 55, ly), "발파 구역(천공 · 장약 · 발파매트)", font=f3, fill=(17, 24, 39))
d.line([(lx, ly + 70), (lx + 40, ly + 70)], fill=(234, 88, 12), width=4)
d.text((lx + 55, ly + 58), "경계선(출입 통제 반경)", font=f3, fill=(17, 24, 39))
man(lx + 20, ly + 140)
d.text((lx + 55, ly + 122), "신호수(무전기 · 적색기)", font=f3, fill=(17, 24, 39))
im.paste(s1.resize((40, 60)), (lx, ly + 180))
im.paste(s2.resize((40, 60)), (lx + 44, ly + 180))
d.text((lx + 95, ly + 200), "접근금지 · 발파중 간판", font=f3, fill=(17, 24, 39))
d.rectangle([lx, ly + 270, lx + 40, ly + 296], outline=(22, 163, 74), width=4, fill=(220, 252, 231))
d.text((lx + 55, ly + 270), "대피 장소", font=f3, fill=(17, 24, 39))
d.text((lx, ly + 340), "※ 가상의 현장을 그린 예시입니다.", font=f3, fill=(107, 114, 128))
d.text((lx, ly + 366), "   실제 도면 위에 같은 방식으로 표시하세요.", font=f3, fill=(107, 114, 128))
d.line([(1010, 40), (1010, 780)], fill=(203, 213, 225), width=2)
im.save(os.path.join(HERE, "example_map.png"), optimize=True)
print("ok", im.size)
