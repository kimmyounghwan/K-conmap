"""
📷 사진캐드 숫자 읽기 — 작은 합성곱 신경망 학습 (G287 · 2026-10-14)
  python3 tools/사진캐드_숫자학습.py [자료폴더=/tmp/g10/ds]
자료: tools/사진캐드_숫자자료.mjs 가 만든 숫자자료_학습.bin · 숫자자료_시험.bin (785 바이트 = 이름표 + 28×28)
꼴: 합성곱 5×5 ×12 → 2×2 최대 → 합성곱 5×5 ×24 → 2×2 최대 → 384 → 96 → 12  (numpy 만, 무게 약 4만 개)
나옴: web/src/lib/사진캐드_숫자무게.js (base64 Float32 — 화면은 이 도구를 열 때만 받음)
"""
import sys, json, base64, time, os
import numpy as np

폴더 = sys.argv[1] if len(sys.argv) > 1 else '/tmp/g10/ds'
뿌리 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(7)

def 읽기(길):
    d = np.fromfile(길, dtype=np.uint8).reshape(-1, 785)
    return d[:, 1:].reshape(-1, 1, 28, 28).astype(np.float32) / 255.0, d[:, 0].astype(np.int64)

Xtr, ytr = 읽기(f'{폴더}/숫자자료_학습.bin')
Xte, yte = 읽기(f'{폴더}/숫자자료_시험.bin')
print('학습', Xtr.shape, '시험', Xte.shape)

def im2col(x, k):
    N, C, H, W = x.shape
    OH, OW = H - k + 1, W - k + 1
    s = x.strides
    col = np.lib.stride_tricks.as_strided(x, shape=(N, C, k, k, OH, OW), strides=(s[0], s[1], s[2], s[3], s[2], s[3]))
    return col.transpose(0, 4, 5, 1, 2, 3).reshape(N * OH * OW, C * k * k), OH, OW

def col2im(dcol, shape, k, OH, OW):
    N, C, H, W = shape
    dx = np.zeros(shape, dtype=np.float32)
    d = dcol.reshape(N, OH, OW, C, k, k).transpose(0, 3, 4, 5, 1, 2)
    for i in range(k):
        for j in range(k):
            dx[:, :, i:i + OH, j:j + OW] += d[:, :, i, j]
    return dx

def 초기(n_in, n_out):
    return (rng.standard_normal((n_out, n_in)) * np.sqrt(2.0 / n_in)).astype(np.float32)

P = {
    'c1w': 초기(25, 12), 'c1b': np.zeros(12, np.float32),
    'c2w': 초기(300, 24), 'c2b': np.zeros(24, np.float32),
    'f1w': 초기(384, 96), 'f1b': np.zeros(96, np.float32),
    'f2w': 초기(96, 12), 'f2b': np.zeros(12, np.float32),
}

def 앞(x, 학습=False):
    N = x.shape[0]
    c, oh, ow = im2col(x, 5)
    z1 = c @ P['c1w'].T + P['c1b']
    a1 = np.maximum(z1, 0).reshape(N, oh, ow, 12).transpose(0, 3, 1, 2)
    p1 = a1.reshape(N, 12, 12, 2, 12, 2).max(axis=(3, 5))
    c2, oh2, ow2 = im2col(np.ascontiguousarray(p1), 5)
    z2 = c2 @ P['c2w'].T + P['c2b']
    a2 = np.maximum(z2, 0).reshape(N, oh2, ow2, 24).transpose(0, 3, 1, 2)
    p2 = a2.reshape(N, 24, 4, 2, 4, 2).max(axis=(3, 5))
    v = p2.reshape(N, 384)
    h = np.maximum(v @ P['f1w'].T + P['f1b'], 0)
    m = None
    if 학습:
        m = (rng.random(h.shape) > 0.3).astype(np.float32) / 0.7
        h = h * m
    o = h @ P['f2w'].T + P['f2b']
    return o, (x, c, z1, a1, p1, c2, z2, a2, p2, v, h, m)

def 뒤(do, cache):
    x, c, z1, a1, p1, c2, z2, a2, p2, v, h, m = cache
    N = x.shape[0]
    g = {}
    g['f2w'] = do.T @ h; g['f2b'] = do.sum(0)
    dh = do @ P['f2w']
    if m is not None: dh = dh * m
    dh = dh * (h > 0)
    g['f1w'] = dh.T @ v; g['f1b'] = dh.sum(0)
    dv = (dh @ P['f1w']).reshape(N, 24, 4, 4)
    # 최대 줄임 뒤로
    mask2 = (a2 == np.repeat(np.repeat(p2, 2, axis=2), 2, axis=3))
    da2 = mask2 * np.repeat(np.repeat(dv, 2, axis=2), 2, axis=3)
    dz2 = (da2 * (a2 > 0)).transpose(0, 2, 3, 1).reshape(-1, 24)
    g['c2w'] = dz2.T @ c2; g['c2b'] = dz2.sum(0)
    dc2 = dz2 @ P['c2w']
    dp1 = col2im(dc2, p1.shape, 5, 8, 8)
    mask1 = (a1 == np.repeat(np.repeat(p1, 2, axis=2), 2, axis=3))
    da1 = mask1 * np.repeat(np.repeat(dp1, 2, axis=2), 2, axis=3)
    dz1 = (da1 * (a1 > 0)).transpose(0, 2, 3, 1).reshape(-1, 12)
    g['c1w'] = dz1.T @ c; g['c1b'] = dz1.sum(0)
    return g

def 확률(o):
    o = o - o.max(1, keepdims=True); e = np.exp(o); return e / e.sum(1, keepdims=True)

def 흔들기(x):
    # 한 칸 안팎 밀기 (MNIST 꼴은 무게중심이 이미 가운데 — 조금만)
    out = np.zeros_like(x)
    for i in range(x.shape[0]):
        dy, dx = rng.integers(-1, 2, 2)
        out[i] = np.roll(np.roll(x[i], dy, axis=1), dx, axis=2)
    return out

def 평가(X, y):
    pr = []
    for i in range(0, len(X), 512):
        o, _ = 앞(X[i:i + 512]); pr.append(확률(o))
    pr = np.concatenate(pr)
    return pr

M = {k: np.zeros_like(v) for k, v in P.items()}
V = {k: np.zeros_like(v) for k, v in P.items()}
b1, b2, eps = 0.9, 0.999, 1e-8
t = 0
배치 = 64
회수 = int(os.environ.get('EPOCHS', '14'))
for 회 in range(회수):
    lr = 1e-3 * (0.5 ** (회 // 5))
    idx = rng.permutation(len(Xtr))
    시작 = time.time(); 손실 = 0
    for s in range(0, len(idx), 배치):
        bi = idx[s:s + 배치]
        xb = 흔들기(Xtr[bi]); yb = ytr[bi]
        o, cache = 앞(xb, 학습=True)
        p = 확률(o)
        손실 += -np.log(p[np.arange(len(yb)), yb] + 1e-9).sum()
        do = p.copy(); do[np.arange(len(yb)), yb] -= 1; do /= len(yb)
        g = 뒤(do, cache)
        t += 1
        for k in P:
            gk = g[k] + 1e-5 * P[k]
            M[k] = b1 * M[k] + (1 - b1) * gk
            V[k] = b2 * V[k] + (1 - b2) * gk * gk
            mh = M[k] / (1 - b1 ** t); vh = V[k] / (1 - b2 ** t)
            P[k] -= (lr * mh / (np.sqrt(vh) + eps)).astype(np.float32)
    pr = 평가(Xte, yte)
    pred = pr.argmax(1)
    acc = (pred == yte).mean()
    숫 = yte < 10
    print(f'{회 + 1}회 손실 {손실 / len(idx):.4f} · 시험 전체 {acc * 100:.2f}% · 숫자만 {(pred[숫] == yte[숫]).mean() * 100:.2f}% · {time.time() - 시작:.0f}초', flush=True)

pr = 평가(Xte, yte); pred = pr.argmax(1)
print('혼동표(줄 = 정답, 칸 = 읽음)')
C = np.zeros((12, 12), int)
for a, b in zip(yte, pred): C[a, b] += 1
for i in range(12): print(i, ' '.join(f'{v:4d}' for v in C[i]))
# 따로: MNIST 뒤 15 % (시험 앞쪽 1505 개 가 MNIST) — 숫자자료 순서: MNIST → 글꼴 → 허쉬 → 다른 → 도형
def b64(a): return base64.b64encode(np.ascontiguousarray(a, dtype=np.float32).tobytes()).decode()
무게 = {
    'c1': {'w': b64(P['c1w']), 'b': b64(P['c1b']), 'n': 12, 'k': 5},
    'c2': {'w': b64(P['c2w']), 'b': b64(P['c2b']), 'n': 24, 'k': 5, 'in': 12},
    'f1': {'w': b64(P['f1w']), 'b': b64(P['f1b']), 'in': 384, 'out': 96},
    'f2': {'w': b64(P['f2w']), 'b': b64(P['f2b']), 'in': 96, 'out': 12},
}
길 = os.environ.get('OUT') or os.path.join(뿌리, 'web', 'src', 'lib', '사진캐드_숫자무게.js')
with open(길, 'w', encoding='utf-8') as f:
    f.write('/* 📷 사진캐드 숫자 읽기 무게 — tools/사진캐드_숫자학습.py 가 만듦(손으로 고치지 말 것) · ')
    f.write(f'시험 전체 {acc * 100:.2f}% · 숫자 {(pred[yte < 10] == yte[yte < 10]).mean() * 100:.2f}% */\n')
    f.write('export default ' + json.dumps(무게) + '\n')
print('씀', 길, os.path.getsize(길), '바이트')
np.save(f'{폴더}/시험확률.npy', pr)
