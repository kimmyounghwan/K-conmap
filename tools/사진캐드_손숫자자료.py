# 📷 G287 손글씨 치수 숫자 줄 읽기 — 학습 자료 만들기 (2026-10-14) · 글꼴은 npm @fontsource/* 30종(OFL 25 · Apache-2.0 5)을 /tmp/g10/fonts 에 받아 둠 · MNIST 는 npm mnist 1.1.0(/tmp/g10/ds)
# 쓰기: python3 tools/사진캐드_손숫자자료.py 80000 11 /tmp/g10/hw/학1 (· 12 학2 · test 99 시험) → 사진캐드_손숫자배우기.py 8000 → 사진캐드_손숫자내보내기.py 무게.npz web/public/tools/models/sonsutja-v1.onnx
"""손글씨 · 인쇄 치수 숫자 줄 합성 — 높이 32 × 폭 160 (회색 0~255) · 이름표 = 글자 줄
  python3 자료.py 개수 씨앗 나올파일
글자: 0-9 . , m  (빈칸 = 0 → 1..13)
"""
import sys, json, glob, random, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
N = int(sys.argv[1]); SEED = int(sys.argv[2]); OUT = sys.argv[3]
시험 = len(sys.argv) > 4 and sys.argv[4] == 'test'
R = random.Random(SEED); rng = np.random.default_rng(SEED)
글자 = '0123456789.,m'
H, W = 32, 160
# MNIST — 학습은 앞 85 %, 시험(test)은 뒤 15 %(합성 도면 시험그림과 같은 몫 — 학습에 안 씀)
mn = []
for k in range(10):
    raw = np.array(json.load(open(f'/tmp/g10/ds/package/src/digits/{k}.json'))['data'], dtype=np.float32)
    n = len(raw) // 784
    a = raw[:n * 784].reshape(n, 28, 28) * (255.0 if raw.max() <= 1.0 else 1.0)
    cut = int(n * 0.85)
    mn.append(a[cut:] if 시험 else a[:cut])
손글꼴 = sorted(glob.glob('/tmp/g10/fonts/*.woff'))
인쇄꼴 = ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf']
인쇄꼴 = [f for f in 인쇄꼴 if __import__('os').path.exists(f)]
if 시험:   # 시험엔 학습에 안 쓴 글꼴 몇 개를 따로(글꼴이 바뀌어도 읽는지)
    손글꼴, 남 = 손글꼴[-6:], None
else:
    손글꼴 = 손글꼴[:-6]
꼴캐시 = {}
def 꼴(f, s):
    k = (f, s)
    if k not in 꼴캐시: 꼴캐시[k] = ImageFont.truetype(f, s)
    return 꼴캐시[k]

def 숫자줄():
    r = R.random()
    if r < 0.42:
        v = R.choice([R.randrange(100, 20000, 10), R.randrange(300, 15000, 50), R.randrange(300, 12000, 100), R.randrange(100, 99999)])
        return str(v)
    if r < 0.58:
        v = R.choice([R.randrange(1000, 60000, 100), R.randrange(1000, 30000, 10), R.randrange(1000, 999999)])
        return f'{v:,}'
    if r < 0.78:
        a = R.choice([R.randrange(0, 20), R.randrange(0, 10), 0, 1, 2, 3])
        b = R.choice([str(R.randrange(1, 10)), str(R.randrange(0, 100)).zfill(2), str(R.randrange(1, 10)) + '5'])
        s = f'{a}.{b}'
        return s + ('m' if R.random() < 0.45 else '')
    if r < 0.86:
        return str(R.randrange(1, 100))
    if r < 0.92:
        return str(R.randrange(100, 9999)) + R.choice(['mm', 'm'])
    return str(R.randrange(0, 10))

def 손점(크기, 쉼):
    """손으로 찍은 점 · 쉼표"""
    s = max(3, int(크기 * R.uniform(0.18, 0.3)))
    im = Image.new('L', (s + 4, (s * 2 if 쉼 else s) + 4), 0)
    d = ImageDraw.Draw(im)
    if 쉼:
        d.line([(s // 2 + 2, 2), (s // 2 + 2 - R.randint(0, 2), s * 2)], fill=255, width=max(2, s // 2))
    else:
        d.ellipse([2, 2, s + 1, s + 1], fill=255)
    return np.array(im, dtype=np.float32), (0.82 if not 쉼 else 0.95)

def mnist글(ch, 크기, 굵):
    """MNIST 숫자 하나 → 잉크 판(0~255) · 바닥선 높이"""
    a = mn[int(ch)][R.randrange(len(mn[int(ch)]))]
    ys, xs = np.nonzero(a > 30)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray(a.astype(np.uint8))
    h = int(크기 * R.uniform(0.9, 1.1)); w = max(2, int(im.width * h / im.height * R.uniform(0.85, 1.15)))
    im = im.resize((w, h), Image.BILINEAR)
    return np.array(im, dtype=np.float32), 1.0

def 그리기(줄, 크기):
    """글자 줄 → 잉크 판(위는 0, 잉크 255) — 글자마다 손글씨 MNIST 또는 글꼴"""
    방식 = R.random()
    if 방식 < 0.45 and all(c in '0123456789.,m' for c in 줄):
        조각 = []
        글꼴 = R.choice(손글꼴)
        for c in 줄:
            if c.isdigit(): 조각.append(mnist글(c, 크기, 1))
            elif c in '.,': 조각.append(손점(크기, c == ','))
            else:
                F = 꼴(글꼴, int(크기 * 1.3)); bb = F.getbbox(c); im = Image.new('L', (bb[2] + 4, int(크기 * 1.6)), 0); ImageDraw.Draw(im).text((2, 0), c, font=F, fill=255)
                a = np.array(im, dtype=np.float32); ys, xs = np.nonzero(a > 40)
                if len(ys): a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
                a = np.array(Image.fromarray(a.astype(np.uint8)).resize((max(2, int(a.shape[1] * 크기 * 0.6 / max(1, a.shape[0]))), int(크기 * 0.6))), dtype=np.float32)
                조각.append((a, 1.0))
        사이 = [R.randint(-1, max(1, int(크기 * 0.25))) for _ in 조각]
        Wd = sum(a.shape[1] for a, _ in 조각) + sum(사이) + 8
        Hd = int(크기 * 1.5) + 8
        판 = np.zeros((Hd, max(8, Wd)), np.float32)
        x = 4; 바닥 = int(크기 * 1.2) + 4
        for (a, 높), g in zip(조각, 사이):
            h, w = a.shape
            y = 바닥 - int(h * (1 if 높 >= 1 else 1)) + R.randint(-max(1, int(크기 * 0.06)), max(1, int(크기 * 0.06)))
            if 높 < 1: y = 바닥 - h + R.randint(-1, 1)
            y = max(0, min(Hd - h, y)); x2 = max(0, min(판.shape[1] - w, x))
            판[y:y + h, x2:x2 + w] = np.maximum(판[y:y + h, x2:x2 + w], a)
            x += w + g
        return 판
    F = 꼴(R.choice(인쇄꼴) if R.random() < 0.18 else R.choice(손글꼴), int(크기 * 1.35))
    bb = F.getbbox(줄)
    im = Image.new('L', (bb[2] + 10, bb[3] + 10), 0)
    d = ImageDraw.Draw(im)
    if R.random() < 0.5:
        d.text((5, 5), 줄, font=F, fill=255)
    else:   # 글자 사이를 흔들며 하나씩
        x = 5
        for c in 줄:
            d.text((x, 5 + R.randint(-1, 1)), c, font=F, fill=255)
            x += F.getbbox(c)[2] + R.randint(-1, 3)
        im = im.crop((0, 0, max(x + 6, 10), im.height))
    return np.array(im, dtype=np.float32)

def 아닌글():
    """숫자가 아닌 글(방 이름 · 설명) — 이름표 비움"""
    낱 = ''.join(R.choice('ABCDEFGHIJKLMNOPRSTUVWYabcdeghiknoprstuvwy') for _ in range(R.randint(2, 7)))
    F = 꼴(R.choice(손글꼴 + 인쇄꼴), R.randint(22, 34))
    bb = F.getbbox(낱); im = Image.new('L', (bb[2] + 10, bb[3] + 10), 0); ImageDraw.Draw(im).text((5, 5), 낱, font=F, fill=255)
    return np.array(im, dtype=np.float32)

def 한장():
    아님 = R.random() < 0.08
    줄 = '' if 아님 else 숫자줄()
    크기 = R.randint(22, 34)
    판 = 아닌글() if 아님 else 그리기(줄, 크기)
    ys, xs = np.nonzero(판 > 40)
    if len(ys) == 0: return None
    판 = 판[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray(np.clip(판, 0, 255).astype(np.uint8))
    # 기울임 · 돌림
    sh = R.uniform(-0.35, 0.35)
    if abs(sh) > 0.02:
        w, h = im.size; 더 = int(abs(sh) * h) + 2
        im = im.transform((w + 더, h), Image.AFFINE, (1, sh, -더 if sh > 0 else 0, 0, 1, 0), Image.BILINEAR)
    if R.random() < 0.6: im = im.rotate(R.uniform(-4, 4), Image.BILINEAR, expand=True)
    # 굵기
    r = R.random()
    if r < 0.25: im = im.filter(ImageFilter.MaxFilter(3))
    elif r < 0.35: im = im.filter(ImageFilter.MinFilter(3)) if min(im.size) > 12 else im
    # 크기 맞춤: 글 높이 = 칸의 55 ~ 82 %
    a = np.array(im, dtype=np.float32); ys, xs = np.nonzero(a > 40)
    if len(ys) == 0: return None
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    th = H * R.uniform(0.5, 0.8); s = th / a.shape[0]
    tw = a.shape[1] * s * R.uniform(0.85, 1.15)
    여 = R.uniform(0.04, 0.2) * H   # 앞뒤 여백(글 찾기 상자는 글보다 조금 넓음)
    if tw + 2 * 여 > W - 2:
        k = (W - 2 - 2 * 여) / tw; tw *= k; th *= k
    tw = max(4, int(tw)); th = max(4, int(th))
    a = np.array(Image.fromarray(a.astype(np.uint8)).resize((tw, th), Image.BILINEAR), dtype=np.float32) / 255.0
    # 전체 폭: 대개 글 + 여백(나머지는 오른쪽 하얗게 — 실제 읽기도 160 에 못 미치면 오른쪽을 채움)
    전체 = min(W, int(tw + 2 * 여 + R.uniform(0, 6)))
    잉 = np.zeros((H, W), np.float32)
    y0 = int((H - th) / 2 + R.uniform(-0.12, 0.12) * H); y0 = max(0, min(H - th, y0))
    x0 = int(여 + R.uniform(-2, 2)); x0 = max(0, min(전체 - tw, x0)) if 전체 > tw else 0
    잉[y0:y0 + th, x0:x0 + tw] = np.maximum(잉[y0:y0 + th, x0:x0 + tw], a[:, :min(tw, W - x0)])
    # 치수선 · 보조선 · 모눈 · 이웃 글자 조각
    선 = np.zeros((H, W), np.float32)
    lw = R.choice([1, 1, 1, 2, 2, 3])
    if R.random() < 0.55:   # 글 아래(또는 위) 치수선
        아래 = R.random() < 0.8
        y = (y0 + th + R.randint(1, 6)) if 아래 else (y0 - R.randint(1, 6) - lw)
        if 0 <= y < H - lw:
            xa = 0 if R.random() < 0.7 else R.randint(0, 20); xb = 전체 if R.random() < 0.7 else 전체 - R.randint(0, 20)
            선[y:y + lw, xa:xb] = 1
            for _ in range(R.randint(0, 2)):   # 눈금 · 점 · 빗금
                x = R.choice([R.randint(0, 6), R.randint(max(0, 전체 - 8), max(1, 전체 - 1))])
                if R.random() < 0.5: 선[max(0, y - 4):min(H, y + 5), x:x + lw] = 1
                else:
                    for t in range(-4, 5):
                        yy, xx = y + t, x + t
                        if 0 <= yy < H and 0 <= xx < W: 선[yy, xx:xx + lw] = 1
    if R.random() < 0.08:   # 글을 지나는 선
        y = R.randint(y0, y0 + th - 1); 선[y:y + lw, :전체] = 1
    if R.random() < 0.3:    # 옆 보조선(세로)
        for x in R.sample([R.randint(0, 3), R.randint(max(0, 전체 - 4), max(1, 전체 - 1))], R.randint(1, 2)):
            선[:, x:x + lw] = 1
    if R.random() < 0.15:   # 흐린 모눈
        g = R.randint(8, 20); o = R.randint(0, g)
        선[o::g, :] = np.maximum(선[o::g, :], R.uniform(0.2, 0.5)); 선[:, o::g] = np.maximum(선[:, o::g], R.uniform(0.2, 0.5))
    잉 = np.maximum(잉, 선 * R.uniform(0.5, 1.0))
    # 종이 · 잉크 밝기 · 흐림 · 잡음
    bg = R.uniform(170, 255); ink = R.uniform(0, min(130, bg - 50))
    img = bg - (bg - ink) * 잉
    gx = np.linspace(-1, 1, W)[None, :] * R.uniform(-20, 20) + np.linspace(-1, 1, H)[:, None] * R.uniform(-15, 15)
    img = img + gx
    img[:, 전체:] = 255 if not 시험 or True else img[:, 전체:]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    if R.random() < 0.5: im = im.filter(ImageFilter.GaussianBlur(R.uniform(0.3, 1.2)))
    if R.random() < 0.3:   # 낮은 해상도
        k = R.uniform(0.35, 0.7); im = im.resize((max(8, int(W * k)), max(8, int(H * k))), Image.BILINEAR).resize((W, H), Image.BILINEAR)
    a = np.array(im, dtype=np.float32) + rng.normal(0, R.uniform(0, 10), (H, W))
    a[:, 전체:] = 255
    return np.clip(a, 0, 255).astype(np.uint8), 줄

X = np.zeros((N, H, W), np.uint8); Y = []
i = 0
while i < N:
    r = 한장()
    if r is None: continue
    X[i] = r[0]; Y.append(r[1]); i += 1
np.save(OUT + '_x.npy', X); json.dump(Y, open(OUT + '_y.json', 'w'))
print('만듦', N, OUT)
