"""무게.npz → 손숫자.onnx (BN 접어 넣음 · NCHW · 끝에 softmax) — 입력 x [1,1,32,W] · 출력 p [1,T,14]"""
import sys, numpy as np, onnx
from onnx import helper, TensorProto, numpy_helper
d = np.load(sys.argv[1] if len(sys.argv) > 1 else '/tmp/g10/hw/무게.npz')
P = {k[2:]: d[k] for k in d.files if k.startswith('P_')}; S = {k[2:]: d[k] for k in d.files if k.startswith('S_')}
꼴 = [('c1', 3, 3, (2, 2)), ('c2', 3, 3, (2, 2)), ('c3', 3, 3, None), ('c4', 3, 3, (2, 1)), ('c5', 3, 3, (2, 1)), ('c6', 2, 1, None), ('c7', 1, 3, None), ('c8', 1, 3, None)]
init, nodes = [], []
h = 'x'
for (n, kh, kw, pool) in 꼴:
    w = P[n + 'w']  # HWIO
    g, b, m, v = P[n + 'g'], P[n + 'b'], S[n + 'm'], S[n + 'v']
    k = g / np.sqrt(v + 1e-5)
    W = (w * k).transpose(3, 2, 0, 1).astype(np.float32)  # OIHW
    B = (b - m * k).astype(np.float32)
    init += [numpy_helper.from_array(W, n + '_W'), numpy_helper.from_array(B, n + '_B')]
    pads = [0, 0, 0, 0] if n == 'c6' else [kh // 2, kw // 2, kh // 2, kw // 2]
    nodes.append(helper.make_node('Conv', [h, n + '_W', n + '_B'], [n + '_z'], kernel_shape=[kh, kw], pads=pads))
    nodes.append(helper.make_node('Relu', [n + '_z'], [n + '_r']))
    out = n + '_r'
    if n == 'c8':
        nodes.append(helper.make_node('Add', [out, 'c6_r'], ['c8_a'])); out = 'c8_a'
    if pool:
        nodes.append(helper.make_node('MaxPool', [out], [n + '_p'], kernel_shape=list(pool), strides=list(pool))); out = n + '_p'
    h = out
# (1,C,1,T) → (1,T,C) → MatMul → softmax
nodes.append(helper.make_node('Squeeze', [h, 'ax2'], ['sq']))
init.append(numpy_helper.from_array(np.array([2], np.int64), 'ax2'))
nodes.append(helper.make_node('Transpose', ['sq'], ['tr'], perm=[0, 2, 1]))
init += [numpy_helper.from_array(P['ow'].astype(np.float32), 'OW'), numpy_helper.from_array(P['ob'].astype(np.float32), 'OB')]
nodes.append(helper.make_node('MatMul', ['tr', 'OW'], ['mm']))
nodes.append(helper.make_node('Add', ['mm', 'OB'], ['lg']))
nodes.append(helper.make_node('Softmax', ['lg'], ['p'], axis=2))
g = helper.make_graph(nodes, 'sonsutja', [helper.make_tensor_value_info('x', TensorProto.FLOAT, [1, 1, 32, 'W'])],
                      [helper.make_tensor_value_info('p', TensorProto.FLOAT, [1, 'T', P['ow'].shape[1]])], init)
m = helper.make_model(g, opset_imports=[helper.make_opsetid('', 13)], producer_name='k-conmap')
m.ir_version = 8
onnx.checker.check_model(m)
out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/g10/hw/손숫자.onnx'
onnx.save(m, out)
print('저장', out, sum(t.dims[0] * (np.prod(t.dims[1:]) if len(t.dims) > 1 else 1) for t in init))
