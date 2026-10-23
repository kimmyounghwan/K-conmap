// 🧪 시험용 VRM(0.x) — 상자 사람(뼈마다 상자 · 무게 1) · Y 위 · −Z 를 봄(VRM 0.x) · T 자세 · 2×2 그림 하나
//   node tools/시험자료/사람vrm_만들기.mjs <나갈 파일>
import fs from 'fs'
import zlib from 'zlib'
export function 시험VRM() {
  const 뼈 = [ // [이름, 부모, 자리(월드 · m)]
    ['hips', -1, [0, 0.9, 0]], ['spine', 0, [0, 1.0, 0]], ['chest', 1, [0, 1.15, 0]], ['neck', 2, [0, 1.4, 0]], ['head', 3, [0, 1.5, 0]],
    ['leftUpperLeg', 0, [0.09, 0.86, 0]], ['leftLowerLeg', 5, [0.09, 0.47, 0]], ['leftFoot', 6, [0.09, 0.08, 0]],
    ['rightUpperLeg', 0, [-0.09, 0.86, 0]], ['rightLowerLeg', 8, [-0.09, 0.47, 0]], ['rightFoot', 9, [-0.09, 0.08, 0]],
    ['leftUpperArm', 2, [0.18, 1.36, 0]], ['leftLowerArm', 11, [0.45, 1.36, 0]], ['leftHand', 12, [0.7, 1.36, 0]],
    ['rightUpperArm', 2, [-0.18, 1.36, 0]], ['rightLowerArm', 14, [-0.45, 1.36, 0]], ['rightHand', 15, [-0.7, 1.36, 0]],
  ]
  /* 상자: 뼈 → 다음 뼈(또는 끝) 사이 */
  const 끝 = { head: [0, 1.72, 0], leftFoot: [0.09, 0.0, -0.12], rightFoot: [-0.09, 0.0, -0.12], leftHand: [0.82, 1.36, 0], rightHand: [-0.82, 1.36, 0], hips: [0, 1.0, 0], spine: [0, 1.15, 0], chest: [0, 1.4, 0], neck: [0, 1.5, 0] }
  const 다음 = (i) => 뼈.findIndex((b) => b[1] === i)
  const 위 = [], 노 = [], uv = [], 마 = [], 무 = [], 색 = []
  뼈.forEach(([이름, , a], i) => {
    const j = 다음(i)
    const b = 끝[이름] || (j >= 0 ? 뼈[j][2] : [a[0], a[1] + 0.1, a[2]])
    const lo = [Math.min(a[0], b[0]) - 0.05, Math.min(a[1], b[1]) - (이름.includes('Foot') ? 0 : 0.0), Math.min(a[2], b[2]) - 0.05], hi = [Math.max(a[0], b[0]) + 0.05, Math.max(a[1], b[1]), Math.max(a[2], b[2]) + 0.05]
    const v = [[lo[0], lo[1], lo[2]], [hi[0], lo[1], lo[2]], [hi[0], hi[1], lo[2]], [lo[0], hi[1], lo[2]], [lo[0], lo[1], hi[2]], [hi[0], lo[1], hi[2]], [hi[0], hi[1], hi[2]], [lo[0], hi[1], hi[2]]]
    const 면 = [[0, 3, 2, 1, [0, 0, -1]], [4, 5, 6, 7, [0, 0, 1]], [0, 1, 5, 4, [0, -1, 0]], [2, 3, 7, 6, [0, 1, 0]], [1, 2, 6, 5, [1, 0, 0]], [3, 0, 4, 7, [-1, 0, 0]]]
    for (const [p, q, r, s2, n] of 면) for (const k of [p, q, r, p, r, s2]) { 위.push(...v[k]); 노.push(...n); uv.push(k % 2, (k >> 1) % 2); 마.push(i, 0, 0, 0); 무.push(1, 0, 0, 0) }
  })
  const n = 위.length / 3
  const 바 = []
  const 붙 = (arr, T) => { const b = Buffer.from(new T(arr).buffer); const off = 바.reduce((a, x) => a + x.length, 0); 바.push(b); while (바.reduce((a, x) => a + x.length, 0) % 4) 바.push(Buffer.alloc(1)); return { off, len: b.length } }
  const vP = 붙(위, Float32Array), vN = 붙(노, Float32Array), vU = 붙(uv, Float32Array), vJ = 붙(마, Uint16Array), vW = 붙(무, Float32Array)
  /* 거꿀 묶음 = −자리 옮김 */
  const ibm = []; for (const [, , p] of 뼈) ibm.push(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -p[0], -p[1], -p[2], 1)
  const vI = 붙(ibm, Float32Array)
  /* 4×4 PNG(살색 · 바르게 만든 것) */
  const png = (() => {
    const W = 4, H = 4, raw = Buffer.alloc((W * 4 + 1) * H)
    for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; for (let x = 0; x < W; x++) raw.set([240, 205, 180, 255], y * (W * 4 + 1) + 1 + x * 4) }
    const crc = (b) => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)) } return ~c >>> 0 }
    const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]) }
    const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))])
  })()
  const vT = (() => { const off = 바.reduce((a, x) => a + x.length, 0); 바.push(png); while (바.reduce((a, x) => a + x.length, 0) % 4) 바.push(Buffer.alloc(1)); return { off, len: png.length } })()
  const bin = Buffer.concat(바)
  const bv = [vP, vN, vU, vJ, vW, vI, vT].map((v) => ({ buffer: 0, byteOffset: v.off, byteLength: v.len }))
  const 노드 = 뼈.map(([이름, 부, p]) => { const pp = 부 >= 0 ? 뼈[부][2] : [0, 0, 0]; return { name: 이름, translation: [p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]], children: 뼈.map((b, k) => (b[1] === 뼈.indexOf(뼈.find((x) => x[0] === 이름)) ? k : -1)).filter((k) => k >= 0) } })
  노드.forEach((x) => { if (!x.children.length) delete x.children })
  노드.push({ name: 'Body', mesh: 0, skin: 0 })
  const json = {
    asset: { version: '2.0', generator: 'kcm 시험' },
    scene: 0, scenes: [{ nodes: [0, 노드.length - 1] }],
    nodes: 노드,
    buffers: [{ byteLength: bin.length }],
    bufferViews: bv,
    accessors: [
      { bufferView: 0, componentType: 5126, count: n, type: 'VEC3', min: [-0.9, 0, -0.2], max: [0.9, 1.8, 0.2] },
      { bufferView: 1, componentType: 5126, count: n, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: n, type: 'VEC2' },
      { bufferView: 3, componentType: 5123, count: n, type: 'VEC4' },
      { bufferView: 4, componentType: 5126, count: n, type: 'VEC4' },
      { bufferView: 5, componentType: 5126, count: 뼈.length, type: 'MAT4' },
    ],
    images: [{ bufferView: 6, mimeType: 'image/png' }], textures: [{ source: 0 }],
    materials: [{ name: '살', pbrMetallicRoughness: { baseColorTexture: { index: 0 }, baseColorFactor: [1, 1, 1, 1] } }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2, JOINTS_0: 3, WEIGHTS_0: 4 }, material: 0 }] }],
    skins: [{ joints: 뼈.map((_, i) => i), inverseBindMatrices: 5 }],
    extensions: { VRM: { meta: { title: '시험 상자 사람' }, humanoid: { humanBones: 뼈.map(([이름], i) => ({ bone: 이름, node: i })) } } },
    extensionsUsed: ['VRM'],
  }
  /* VRM 0.x 는 −Z 를 봄 — 위는 +Z 로 만들었으니 180° 돌림(뿌리 hips 에) */
  json.nodes[0].rotation = [0, 1, 0, 0]
  let js = Buffer.from(JSON.stringify(json)); while (js.length % 4) js = Buffer.concat([js, Buffer.from(' ')])
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8)
  const c1 = Buffer.alloc(8); c1.writeUInt32LE(js.length, 0); c1.writeUInt32LE(0x4e4f534a, 4)
  const c2 = Buffer.alloc(8); c2.writeUInt32LE(bin.length, 0); c2.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([head, c1, js, c2, bin])
}
if (process.argv[2]) fs.writeFileSync(process.argv[2], 시험VRM())
