"""손글씨 치수 숫자 줄 읽기 — 작은 합성곱 + CTC (JAX · CPU)
  python3 배우기.py 걸음수 [이어서.npz]
"""
import sys, json, time, math, os
import numpy as np
import jax, jax.numpy as jnp, optax
글자 = '0123456789.,m'
K = len(글자) + 1
H, W = 32, 160
걸음 = int(sys.argv[1]) if len(sys.argv) > 1 else 6000
def 읽기(이름):
    X = np.load(이름 + '_x.npy'); Y = json.load(open(이름 + '_y.json')); return X, Y
Xs, Ys = [], []
for n in (os.environ.get('DATA') or '학1,학2').split(','):
    if os.path.exists(f'/tmp/g10/hw/{n}_x.npy'):
        x, y = 읽기(f'/tmp/g10/hw/{n}'); Xs.append(x); Ys += y
X = np.concatenate(Xs); Y = Ys
Xt, Yt = 읽기('/tmp/g10/hw/시험')
print('학습', X.shape, '시험', Xt.shape, flush=True)
L = 12
def 이름표(ys):
    lab = np.zeros((len(ys), L), np.int32); pad = np.ones((len(ys), L), np.float32)
    for i, s in enumerate(ys):
        for j, c in enumerate(s[:L]): lab[i, j] = 글자.index(c) + 1; pad[i, j] = 0
    return lab, pad
꼴 = [  # (이름, 커널 h, w, 들어감, 나감, 풀링)
    ('c1', 3, 3, 1, 24, (2, 2)), ('c2', 3, 3, 24, 48, (2, 2)), ('c3', 3, 3, 48, 80, None), ('c4', 3, 3, 80, 80, (2, 1)),
    ('c5', 3, 3, 80, 112, (2, 1)), ('c6', 2, 1, 112, 160, None), ('c7', 1, 3, 160, 160, None), ('c8', 1, 3, 160, 160, None)]
def 초기(key):
    P, S = {}, {}
    for (n, kh, kw, ci, co, _) in 꼴:
        key, k1 = jax.random.split(key)
        P[n + 'w'] = jax.random.normal(k1, (kh, kw, ci, co)) * math.sqrt(2.0 / (kh * kw * ci))
        P[n + 'g'] = jnp.ones(co); P[n + 'b'] = jnp.zeros(co)
        S[n + 'm'] = jnp.zeros(co); S[n + 'v'] = jnp.ones(co)
    key, k1 = jax.random.split(key)
    P['ow'] = jax.random.normal(k1, (160, K)) * math.sqrt(1.0 / 160); P['ob'] = jnp.zeros(K)
    return P, S
def 앞(P, S, x, 학습):
    새S = {}
    h = x
    for (n, kh, kw, ci, co, pool) in 꼴:
        pad = 'SAME' if n != 'c6' else 'VALID'
        z = jax.lax.conv_general_dilated(h, P[n + 'w'], (1, 1), pad, dimension_numbers=('NHWC', 'HWIO', 'NHWC'))
        if 학습:
            m = z.mean(axis=(0, 1, 2)); v = z.var(axis=(0, 1, 2))
            새S[n + 'm'] = 0.99 * S[n + 'm'] + 0.01 * m; 새S[n + 'v'] = 0.99 * S[n + 'v'] + 0.01 * v
        else:
            m, v = S[n + 'm'], S[n + 'v']; 새S[n + 'm'] = m; 새S[n + 'v'] = v
        z = (z - m) / jnp.sqrt(v + 1e-5) * P[n + 'g'] + P[n + 'b']
        z = jax.nn.relu(z)
        if n == 'c8': z = z + 잔   # 이어 붙임(c6 → c8)
        if n == 'c6': 잔 = z
        if pool: z = jax.lax.reduce_window(z, -jnp.inf, jax.lax.max, (1, pool[0], pool[1], 1), (1, pool[0], pool[1], 1), 'VALID')
        h = z
    h = h[:, 0]   # (N, T, 160)
    return h @ P['ow'] + P['ob'], 새S
def 손실(P, S, x, lab, pad):
    lg, 새S = 앞(P, S, x, True)
    lp = jnp.zeros(lg.shape[:2])
    l = optax.ctc_loss(lg, lp, lab, pad, blank_id=0)
    return l.mean(), 새S
sch = optax.warmup_cosine_decay_schedule(0, 2e-3, 300, 걸음, 2e-5)
opt = optax.chain(optax.clip_by_global_norm(5.0), optax.adamw(sch, weight_decay=1e-4))
@jax.jit
def 한걸음(P, S, O, x, lab, pad):
    (l, 새S), g = jax.value_and_grad(손실, has_aux=True)(P, S, x, lab, pad)
    u, O = opt.update(g, O, P)
    return optax.apply_updates(P, u), 새S, O, l
@jax.jit
def 보기(P, S, x):
    lg, _ = 앞(P, S, x, False)
    return jax.nn.softmax(lg, -1)
def 풀이(pr):
    k = pr.argmax(-1); s = ''; 앞k = 0
    for t in k:
        if t != 0 and t != 앞k: s += 글자[t - 1]
        앞k = t
    return s
def 맞음(P, S, X_, Y_, n=2000):
    ok = 0
    for i in range(0, n, 250):
        x = jnp.asarray((X_[i:i + 250, :, :, None].astype(np.float32) / 255 - 0.5) / 0.5)
        pr = np.asarray(보기(P, S, x))
        for j in range(len(pr)): ok += 풀이(pr[j]) == Y_[i + j]
    return ok / n
P, S = 초기(jax.random.PRNGKey(0)); O = opt.init(P)
if len(sys.argv) > 2:
    d = np.load(sys.argv[2], allow_pickle=True); P = {k[2:]: jnp.asarray(d[k]) for k in d.files if k.startswith('P_')}; S = {k[2:]: jnp.asarray(d[k]) for k in d.files if k.startswith('S_')}; O = opt.init(P)
rng = np.random.default_rng(1)
B = 64; t0 = time.time(); 합 = 0
for st in range(1, 걸음 + 1):
    idx = rng.integers(0, len(X), B)
    x = (X[idx, :, :, None].astype(np.float32) / 255 - 0.5) / 0.5
    lab, pad = 이름표([Y[i] for i in idx])
    P, S, O, l = 한걸음(P, S, O, jnp.asarray(x), jnp.asarray(lab), jnp.asarray(pad))
    합 += float(l)
    if st % 200 == 0:
        print(f'걸음 {st} 손실 {합 / 200:.3f} {time.time() - t0:.0f}초', flush=True); 합 = 0
    if st % 2000 == 0 or st == 걸음:
        print(f'  시험 통째 맞음 {맞음(P, S, Xt, Yt):.3f} · 학습 {맞음(P, S, X, Y, 1000):.3f}', flush=True)
        np.savez('/tmp/g10/hw/무게.npz', **{'P_' + k: np.asarray(v) for k, v in P.items()}, **{'S_' + k: np.asarray(v) for k, v in S.items()})
print('끝', flush=True)
