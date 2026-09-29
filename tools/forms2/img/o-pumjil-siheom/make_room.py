# -*- coding: utf-8 -*-
"""시험실 배치 평면도 «작성 예시» — 가상의 시험실(3.0m × 9.0m)을 PIL 로 그린 것. python3 make_room.py → example_room.png"""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
F = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
W, H = 1400, 620
im = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(im)
f1, f2, f3 = ImageFont.truetype(F, 26), ImageFont.truetype(F, 21), ImageFont.truetype(F, 18)
x0, y0, x1, y1 = 140, 110, 1260, 470          # 9.0m × 3.0m (가로로 눕힘)
d.rectangle([x0, y0, x1, y1], outline=(17, 24, 39), width=8)
# 문(오른쪽 아래) — 벽을 끊고 여닫이 호
d.line([(1100, y1), (1190, y1)], fill="white", width=10)
d.arc([1100 - 90, y1 - 90, 1190, y1 + 90], 270, 360, fill=(107, 114, 128), width=3)
d.line([(1100, y1), (1100, y1 - 90)], fill=(107, 114, 128), width=4)
d.text((1115, y1 + 18), "출입문", font=f3, fill=(55, 65, 81))
# 공시체 양생수조
d.rectangle([x0 + 20, y0 + 20, x0 + 330, y0 + 150], fill=(191, 219, 254), outline=(37, 99, 235), width=4)
d.text((x0 + 70, y0 + 70), "공시체 양생수조", font=f2, fill=(30, 64, 175))
# 시험기구(압축강도 시험기 등)
d.rectangle([x0 + 20, y1 - 150, x0 + 330, y1 - 20], fill=(254, 243, 199), outline=(217, 119, 6), width=4)
d.text((x0 + 45, y1 - 110), "시험기구", font=f2, fill=(146, 64, 14))
d.text((x0 + 45, y1 - 80), "(압축강도 시험기 등)", font=f3, fill=(146, 64, 14))
# 시료 보관대
d.rectangle([x0 + 520, y0 + 20, x0 + 800, y0 + 110], fill=(220, 252, 231), outline=(22, 163, 74), width=4)
d.text((x0 + 580, y0 + 50), "시료 보관대", font=f2, fill=(21, 128, 61))
# 시험기구 선반
d.rectangle([x0 + 520, y1 - 110, x0 + 800, y1 - 20], fill=(254, 243, 199), outline=(217, 119, 6), width=4)
d.text((x0 + 585, y1 - 78), "시험기구", font=f2, fill=(146, 64, 14))
# 치수선
d.line([(x0, y0 - 45), (x1, y0 - 45)], fill=(220, 38, 38), width=2)
for x in (x0, x1):
    d.line([(x, y0 - 58), (x, y0 - 32)], fill=(220, 38, 38), width=2)
d.text(((x0 + x1) // 2 - 30, y0 - 85), "9.0 m", font=f1, fill=(220, 38, 38))
d.line([(x0 - 50, y0), (x0 - 50, y1)], fill=(220, 38, 38), width=2)
for y in (y0, y1):
    d.line([(x0 - 63, y), (x0 - 37, y)], fill=(220, 38, 38), width=2)
d.text((x0 - 125, (y0 + y1) // 2 - 14), "3.0 m", font=f1, fill=(220, 38, 38))
d.text((x0, y1 + 70), "면적 3.0 m × 9.0 m = 27.0 ㎡   ※ 가상의 시험실을 그린 예시입니다.", font=f3, fill=(75, 85, 99))
im.save(os.path.join(HERE, "example_room.png"), optimize=True)
print("ok")
