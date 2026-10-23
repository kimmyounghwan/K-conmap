/**
 * 🚶 둘러보기 사람 — 게임 캐릭터 모델(VRM · glTF 2.0 바이너리)을 읽어 걷게 함 (G390 · 2026-10-23)
 *
 * 소장님: 「진짜 사람처럼 해줘」 · 「예쁘고, 늘씬하고, 게임처럼」 — 코드로 짠 꼴(lib/사람3d.js) 대신 게임 캐릭터 모델 파일.
 *   쓰는 모델: VRoid Studio 샘플 가운데 CC0(저작권 포기 · 제한 없음)인 것만 — AvatarSample_D · E · F · G(픽시브 VRoid 도움말 «Do VRoid Studio's sample models come with conditions of use?»).
 *   A · B · C 는 따로 조건이 있어 안 씀.
 * ■ three.js 없이(bim3d 와 같은 까닭) — GLB 읽기 · 뼈대(노드 · 스킨) · 걷기 자세(사람 뼈 이름 humanoid 로) · CPU 스킨(꼭짓점마다 뼈 4개).
 * ■ 좌표: 모델(glTF, Y 위) → 우리(+x 앞 · +y 왼쪽 · +z 위 · m) — 왼쪽 · 위는 뼈 자리로 알아냄(VRM 0.x 는 −Z, 1.0 은 +Z 를 봄 — 둘 다 됨) · 발바닥 = 0.
 * ■ 걷기(φ): 엉덩이 오르내림 · 허벅지 앞뒤 · 무릎 굽힘 · 발목 수평 · 팔(T 자세면 내림) 앞뒤 · 가슴 살짝 비틂 · 머리는 앞을 봄.
 * ■ 그림: 부분(재질)마다 {위, 노, uv, 색인, 그림, 색, 알파} — bim3d set사람 의 «부분» 꼴(그림 있는 사람).
 * ■ 👁 눈 깜빡임: blink 표정 꼴(사이트에 싣는 파일은 tools/vrm_싣기.py 로 blink 만 남김) — 사람자세 {감음}.
 * ■ 🎮 사이트 캐릭터 넷(소장님 「여자만 하자」 · 넷 다): public/jeoksan/char/{d,e,f,g}.vrm — 고를 때 받음(캐릭터받기 · 한 번 받으면 이 화면을 여는 동안 기억).
 */

/* ── 4×4 행렬(열 우선 · glTF 와 같음) ── */
const 단위 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
function 곱4(a, b) { const r = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) r[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3]; return r }
function trs(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z
  return [(1 - 2 * (yy + zz)) * s[0], 2 * (xy + wz) * s[0], 2 * (xz - wy) * s[0], 0,
    2 * (xy - wz) * s[1], (1 - 2 * (xx + zz)) * s[1], 2 * (yz + wx) * s[1], 0,
    2 * (xz + wy) * s[2], 2 * (yz - wx) * s[2], (1 - 2 * (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1]
}
const 점에 = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]
/** 축 a(단위) · 각 θ 돌림 3×3(열 우선 9칸) */
function 돌림(a, θ) {
  const [x, y, z] = a, c = Math.cos(θ), s = Math.sin(θ), t = 1 - c
  return [t * x * x + c, t * x * y + s * z, t * x * z - s * y, t * x * y - s * z, t * y * y + c, t * y * z + s * x, t * x * z + s * y, t * y * z - s * x, t * z * z + c]
}
function 곱3(a, b) { const r = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[j * 3 + i] = a[i] * b[j * 3] + a[3 + i] * b[j * 3 + 1] + a[6 + i] * b[j * 3 + 2]; return r }
const 돌점 = (R, v) => [R[0] * v[0] + R[3] * v[1] + R[6] * v[2], R[1] * v[0] + R[4] * v[1] + R[7] * v[2], R[2] * v[0] + R[5] * v[1] + R[8] * v[2]]
const 빼 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const 단 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const 외 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const 내 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const 뼈단위 = [1, 0, 0, 0, 1, 0, 0, 0, 1]

/* ── GLB 읽기 ── */
const 칸수 = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }
const 꼴 = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }
const 나눔 = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }
export function GLB나누기(buf) {
  const dv = new DataView(buf)
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('GLB 가 아닙니다')
  let off = 12, json = null, bin = null
  while (off < buf.byteLength) {
    const len = dv.getUint32(off, true), kind = dv.getUint32(off + 4, true)
    const body = buf.slice(off + 8, off + 8 + len)
    if (kind === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(body))
    else if (kind === 0x004e4942) bin = body
    off += 8 + len
  }
  if (!json) throw new Error('GLB 에 JSON 이 없습니다')
  return { json, bin }
}
function 읽개(json, bin) {
  return (i, 실수 = false) => {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView], T = 꼴[a.componentType], n = 칸수[a.type]
    const 크 = T.BYTES_PER_ELEMENT, 걸음 = bv.byteStride || 크 * n, 시작 = (bv.byteOffset || 0) + (a.byteOffset || 0)
    const out = 실수 || a.normalized ? new Float32Array(a.count * n) : new T(a.count * n)
    const dv = new DataView(bin)
    const 읽 = { 5120: (o) => dv.getInt8(o), 5121: (o) => dv.getUint8(o), 5122: (o) => dv.getInt16(o, true), 5123: (o) => dv.getUint16(o, true), 5125: (o) => dv.getUint32(o, true), 5126: (o) => dv.getFloat32(o, true) }[a.componentType]
    if (!읽) throw new Error('모르는 칸 꼴 ' + a.componentType)
    const k = a.normalized && 나눔[a.componentType] ? 1 / 나눔[a.componentType] : 1
    for (let e = 0; e < a.count; e++) for (let c = 0; c < n; c++) out[e * n + c] = 읽(시작 + e * 걸음 + c * 크) * k
    return out
  }
}

/** 사람 뼈 이름(VRM 0.x · 1.0) → 노드 번호 */
function 사람뼈(json) {
  const m = {}
  const v0 = json.extensions && json.extensions.VRM && json.extensions.VRM.humanoid
  if (v0 && Array.isArray(v0.humanBones)) for (const b of v0.humanBones) if (b && b.bone && Number.isInteger(b.node)) m[b.bone] = b.node
  const v1 = json.extensions && json.extensions.VRMC_vrm && json.extensions.VRMC_vrm.humanoid
  if (v1 && v1.humanBones) for (const [k, b] of Object.entries(v1.humanBones)) if (b && Number.isInteger(b.node)) m[k] = b.node
  return m
}

/**
 * VRM · GLB 를 읽음(그림은 비동기 — 바탕 그림 이미지)
 * @param {ArrayBuffer} buf
 * @param {(blob: Blob) => Promise<any>} 그림읽기 — 브라우저: createImageBitmap · 시험: null(그림 없이)
 */
export async function 사람모델읽기(buf, 그림읽기 = null) {
  const { json, bin } = GLB나누기(buf)
  const 읽0 = 읽개(json, bin)
  /* VRoid 는 한 그물의 재질(부분)들이 같은 꼭짓점 칸(accessor)을 함께 씀 → 한 번만 읽고 같은 배열을 나눠 씀(스킨 셈 · GPU 올림도 한 번 — 사람자세 · 사람놓기 · bim3d) */
  const 읽캐시 = new Map()
  const 읽 = (i, 실수 = false) => { const k = i + '|' + (실수 ? 1 : 0); if (!읽캐시.has(k)) 읽캐시.set(k, 읽0(i, 실수)); return 읽캐시.get(k) }
  const 노드 = json.nodes || []
  /* 부모 · 쉬는 자리(월드) */
  const 부모 = new Array(노드.length).fill(-1)
  노드.forEach((n, i) => (n.children || []).forEach((c) => { 부모[c] = i }))
  const 지역 = 노드.map((n) => (n.matrix ? n.matrix.slice() : trs(n.translation, n.rotation, n.scale)))
  const 월드 = new Array(노드.length)
  const 차례 = []
  const 돌기 = (i) => { 월드[i] = 부모[i] >= 0 ? 곱4(월드[부모[i]], 지역[i]) : 지역[i]; 차례.push(i); for (const c of 노드[i].children || []) 돌기(c) }
  const 뿌리들 = (json.scenes && json.scenes[json.scene || 0] && json.scenes[json.scene || 0].nodes) || 노드.map((_, i) => i).filter((i) => 부모[i] < 0)
  for (const r of 뿌리들) 돌기(r)
  for (let i = 0; i < 노드.length; i++) if (!월드[i]) { 월드[i] = 지역[i]; 차례.push(i) }
  const 뼈 = 사람뼈(json)
  if (!(뼈.hips >= 0)) throw new Error('사람 뼈(humanoid)가 없는 모델입니다 — VRM 이어야 합니다')
  const 자리 = (b) => (뼈[b] >= 0 ? [월드[뼈[b]][12], 월드[뼈[b]][13], 월드[뼈[b]][14]] : null)
  /* 모델의 위 · 왼쪽 · 앞(모델 좌표) */
  const 위 = 단(빼(자리('head') || 자리('neck') || 자리('spine'), 자리('hips')))
  const 왼끝 = 자리('leftUpperArm') || 자리('leftUpperLeg'), 오끝 = 자리('rightUpperArm') || 자리('rightUpperLeg')
  let 왼 = 단(빼(왼끝, 오끝)); 왼 = 단(빼(왼, 곱(위, 내(왼, 위))))
  const 앞 = 단(외(왼, 위))
  /* 그림 */
  const 그림들 = []
  if (그림읽기 && json.images) for (const im of json.images) {
    try {
      const bv = json.bufferViews[im.bufferView]
      const blob = new Blob([new Uint8Array(bin, bv.byteOffset || 0, bv.byteLength)], { type: im.mimeType || 'image/png' })
      그림들.push(await 그림읽기(blob))
    } catch (e) { 그림들.push(null) }
  } else if (json.images) for (let i = 0; i < json.images.length; i++) 그림들.push(null)
  const 재질 = (json.materials || []).map((m) => {
    const p = m.pbrMetallicRoughness || {}
    const t = p.baseColorTexture ? json.textures[p.baseColorTexture.index] : null
    return { 그림: t && Number.isInteger(t.source) ? 그림들[t.source] : null, 그림번: t ? t.source : -1, 색: p.baseColorFactor || [1, 1, 1, 1], 알파: m.alphaMode || 'OPAQUE', 자름: m.alphaCutoff ?? 0.5, 양면: !!m.doubleSided, 이름: m.name || '' }
  })
  /* 👁 눈 깜빡임(blink 표정 꼴) — VRM 0.x blendShapeMaster(무게 0~100) · 1.0 expressions(0~1) → 그물마다 [{꼴 번호, 무게}] */
  const 깜 = new Map()
  const 깜더 = (mesh, index, w) => { if (!Number.isInteger(mesh) || !Number.isInteger(index) || !(w > 0)) return; if (!깜.has(mesh)) 깜.set(mesh, []); 깜.get(mesh).push({ index, w }) }
  const g0 = json.extensions && json.extensions.VRM && json.extensions.VRM.blendShapeMaster && json.extensions.VRM.blendShapeMaster.blendShapeGroups
  if (Array.isArray(g0)) for (const g of g0) if (String(g.presetName || '').toLowerCase() === 'blink') for (const b of g.binds || []) 깜더(b.mesh, b.index, (+b.weight || 0) / 100)
  const e1 = json.extensions && json.extensions.VRMC_vrm && json.extensions.VRMC_vrm.expressions && json.extensions.VRMC_vrm.expressions.preset && json.extensions.VRMC_vrm.expressions.preset.blink
  if (e1 && Array.isArray(e1.morphTargetBinds)) for (const b of e1.morphTargetBinds) { const nd = 노드[b.node]; if (nd) 깜더(nd.mesh, b.index, +b.weight || 0) }
  /* 부분(그물 · 재질마다) */
  const 부분 = []
  const 감캐시 = new Map()
  for (const i of 차례) {
    const n = 노드[i]
    if (!Number.isInteger(n.mesh)) continue
    const 스킨 = Number.isInteger(n.skin) ? json.skins[n.skin] : null
    for (const pr of json.meshes[n.mesh].primitives || []) {
      if (pr.mode !== undefined && pr.mode !== 4) continue
      const A = pr.attributes || {}
      if (!Number.isInteger(A.POSITION)) continue
      const 위치 = 읽(A.POSITION, true)
      const 노말 = Number.isInteger(A.NORMAL) ? 읽(A.NORMAL, true) : null
      const uv = Number.isInteger(A.TEXCOORD_0) ? 읽(A.TEXCOORD_0, true) : null
      const 마디 = 스킨 && Number.isInteger(A.JOINTS_0) ? 읽(A.JOINTS_0) : null
      const 무게 = 스킨 && Number.isInteger(A.WEIGHTS_0) ? 읽(A.WEIGHTS_0, true) : null
      let 색인 = Number.isInteger(pr.indices) ? 읽(pr.indices) : null
      if (!색인) { 색인 = new Uint32Array(위치.length / 3); for (let k = 0; k < 색인.length; k++) 색인[k] = k }
      const 재 = Number.isInteger(pr.material) ? 재질[pr.material] : { 그림: null, 색: [0.8, 0.8, 0.8, 1], 알파: 'OPAQUE', 자름: 0.5 }
      const 감키 = n.mesh + '|' + A.POSITION + '|' + (pr.targets || []).map((t) => t.POSITION).join(',')
      let 감음 = 감캐시.has(감키) ? 감캐시.get(감키) : null
      if (!감캐시.has(감키)) {
        for (const { index, w } of 깜.get(n.mesh) || []) {
          const t = pr.targets && pr.targets[index]
          if (!t || !Number.isInteger(t.POSITION)) continue
          const d = 읽(t.POSITION, true)
          if (d.length !== 위치.length) continue
          if (!감음) 감음 = new Float32Array(위치.length)
          for (let k = 0; k < d.length; k++) 감음[k] += w * d[k]
        }
        감캐시.set(감키, 감음)
      }
      부분.push({ 노드: i, 스킨, 위치, 노말, uv, 마디, 무게, 색인: 색인 instanceof Uint32Array ? 색인 : Uint32Array.from(색인), 재, 감음 })
    }
  }
  /* 스킨마다 뼈 마디 → 노드 · 거꿀 묶음 행렬 */
  const 스킨들 = (json.skins || []).map((s) => ({ 마디: s.joints, 거꿀: Number.isInteger(s.inverseBindMatrices) ? 읽(s.inverseBindMatrices, true) : null }))
  부분.forEach((p) => { p.스킨번 = p.스킨 ? json.skins.indexOf(p.스킨) : -1 })
  /* 발바닥 높이(모델 좌표 위 방향 최솟값) · 키 */
  let 낮 = Infinity, 높 = -Infinity
  for (const p of 부분) for (let k = 0; k < p.위치.length; k += 3) { const h = 위[0] * p.위치[k] + 위[1] * p.위치[k + 1] + 위[2] * p.위치[k + 2]; if (h < 낮) 낮 = h; if (h > 높) 높 = h }
  const 이름 = (json.extensions && json.extensions.VRM && json.extensions.VRM.meta && json.extensions.VRM.meta.title) || (json.extensions && json.extensions.VRMC_vrm && json.extensions.VRMC_vrm.meta && json.extensions.VRMC_vrm.meta.name) || ''
  return { 노드수: 노드.length, 부모, 지역, 월드, 차례, 뼈, 축: { 앞, 왼, 위 }, 바닥: 낮, 키: 높 - 낮, 부분, 스킨들, 재질, 이름 }
}
const 곱 = (a, k) => [a[0] * k, a[1] * k, a[2] * k]

/**
 * 걷기 자세 → 부분마다 우리 좌표(몸 좌표 · m · 발바닥 0)의 위치 · 노말
 * @param {object} 모 사람모델읽기 결과
 * @param {{걸음: number, 가는중: boolean, 감음?: number}} o 감음 = 눈 감은 정도(0 뜸 ~ 1 감음)
 * @returns {{부분: {위: Float32Array, 노: Float32Array, 부분: object}[], 키: number}}
 */
export function 사람자세(모, o = {}) {
  const φ = o.걸음 || 0, 감 = o.가는중 ? 1 : 0, 눈감 = Math.max(0, Math.min(1, +o.감음 || 0))
  const { 앞, 왼, 위 } = 모.축
  const 뼈 = 모.뼈
  /* 사람 뼈마다 돌림(모델 좌표 · 그 마디 자리에서) */
  const 델 = new Map()
  const 넣 = (b, R) => { if (뼈[b] >= 0) 델.set(뼈[b], 델.has(뼈[b]) ? 곱3(R, 델.get(뼈[b])) : R) }
  const 흔 = 감 * 0.42 * Math.sin(φ)
  /* 팔: T 자세(어깨 → 팔꿈치가 거의 가로)면 내림 */
  for (const [쪽, 이] of [[1, 'left'], [-1, 'right']]) {
    const a = 뼈[이 + 'UpperArm'], b = 뼈[이 + 'LowerArm']
    if (a >= 0 && b >= 0) {
      const d = 단(빼([모.월드[b][12], 모.월드[b][13], 모.월드[b][14]], [모.월드[a][12], 모.월드[a][13], 모.월드[a][14]]))
      const 아래각 = Math.acos(Math.max(-1, Math.min(1, -내(d, 위))))          // 0 = 팔이 아래로 · π/2 = 가로
      const 내릴 = Math.max(0, 아래각 - 0.22)
      넣(이 + 'UpperArm', 곱3(돌림(왼, 쪽 * 흔 * 0.75), 돌림(앞, 쪽 * -내릴)))          // 다리와 엇갈려 흔듦
      넣(이 + 'LowerArm', 돌림(왼, -0.25 - 감 * 0.15))
    }
  }
  /* 다리 */
  for (const [쪽, 이] of [[1, 'left'], [-1, 'right']]) {
    const 상 = 쪽 * 흔
    const 굽 = 감 * Math.max(0, -Math.sin(φ * 쪽 + (쪽 > 0 ? 0.6 : 0.6 + Math.PI))) * 0.75
    넣(이 + 'UpperLeg', 돌림(왼, -상))
    넣(이 + 'LowerLeg', 돌림(왼, 굽))
    넣(이 + 'Foot', 돌림(왼, -(굽) * 0.6 + 상 * 0.25))
  }
  넣('spine', 돌림(위, 감 * 0.06 * Math.sin(φ)))
  넣('chest', 돌림(위, -감 * 0.08 * Math.sin(φ)))
  /* 노드마다 A(쉼 → 새) — 위에서 아래로 */
  const N = 모.노드수
  const D = new Array(N), P = new Array(N)          // D = 쌓인 돌림 · P = 새 마디 자리
  const 출렁 = 감 * 0.022 * Math.abs(Math.sin(φ)) - 감 * 0.01
  for (const i of 모.차례) {
    const 쉼 = [모.월드[i][12], 모.월드[i][13], 모.월드[i][14]]
    const p = 모.부모[i]
    if (p < 0 || !D[p]) { D[i] = 델.get(i) || 뼈단위; P[i] = i === 뼈.hips ? [쉼[0] + 위[0] * 출렁, 쉼[1] + 위[1] * 출렁, 쉼[2] + 위[2] * 출렁] : 쉼; continue }
    const 부쉼 = [모.월드[p][12], 모.월드[p][13], 모.월드[p][14]]
    const v = 돌점(D[p], 빼(쉼, 부쉼))
    P[i] = [P[p][0] + v[0], P[p][1] + v[1], P[p][2] + v[2]]
    if (i === 뼈.hips) P[i] = [P[i][0] + 위[0] * 출렁, P[i][1] + 위[1] * 출렁, P[i][2] + 위[2] * 출렁]
    D[i] = 델.has(i) ? 곱3(D[p], 델.get(i)) : D[p]
  }
  /* 뼈 마디 행렬 = A · 월드쉼 · 거꿀 */
  const A4 = (i) => { const R = D[i], q = P[i], s = [모.월드[i][12], 모.월드[i][13], 모.월드[i][14]]; const t = 빼(q, 돌점(R, s)); return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1] }
  const 스킨행렬 = 모.스킨들.map((s) => s.마디.map((j, k) => { const ibm = s.거꿀 ? Array.from(s.거꿀.subarray(k * 16, k * 16 + 16)) : 단위(); return 곱4(곱4(A4(j), 모.월드[j]), ibm) }))
  /* 모델 좌표 → 우리(앞 · 왼 · 위 · 발바닥 0) */
  const 바 = 모.바닥
  const 바꿈 = (x, y, z) => [앞[0] * x + 앞[1] * y + 앞[2] * z, 왼[0] * x + 왼[1] * y + 왼[2] * z, 위[0] * x + 위[1] * y + 위[2] * z - 바]
  const 바꿈n = (x, y, z) => [앞[0] * x + 앞[1] * y + 앞[2] * z, 왼[0] * x + 왼[1] * y + 왼[2] * z, 위[0] * x + 위[1] * y + 위[2] * z]
  const out = []
  const 셈캐시 = new Map()          // 같은 꼭짓점 칸 · 같은 노드 · 스킨 → 한 번만 셈
  for (const p of 모.부분) {
    const 키 = p.위치, 덧키 = p.노드 + '|' + p.스킨번 + '|' + (p.감음 ? 1 : 0)
    const 앞셈 = 셈캐시.get(키) && 셈캐시.get(키).get(덧키)
    if (앞셈 && 앞셈.감음 === p.감음) { out.push({ 위: 앞셈.위, 노: 앞셈.노, 부분: p }); continue }
    const n = p.위치.length / 3
    const 위out = new Float32Array(n * 3), 노out = new Float32Array(n * 3)
    const Ms = p.스킨번 >= 0 ? 스킨행렬[p.스킨번] : null
    const 노드월드 = A4(p.노드) ? 곱4(A4(p.노드), 모.월드[p.노드]) : 모.월드[p.노드]
    const 깜 = 눈감 > 0 && p.감음 ? p.감음 : null
    for (let v = 0; v < n; v++) {
      let x = p.위치[v * 3], y = p.위치[v * 3 + 1], z = p.위치[v * 3 + 2]
      if (깜) { x += 눈감 * 깜[v * 3]; y += 눈감 * 깜[v * 3 + 1]; z += 눈감 * 깜[v * 3 + 2] }
      const nx = p.노말 ? p.노말[v * 3] : 0, ny = p.노말 ? p.노말[v * 3 + 1] : 0, nz = p.노말 ? p.노말[v * 3 + 2] : 1
      let X = 0, Y = 0, Z = 0, NX = 0, NY = 0, NZ = 0
      if (Ms && p.마디 && p.무게) {
        for (let k = 0; k < 4; k++) {
          const w = p.무게[v * 4 + k]; if (!(w > 0)) continue
          const m = Ms[p.마디[v * 4 + k]]; if (!m) continue
          X += w * (m[0] * x + m[4] * y + m[8] * z + m[12]); Y += w * (m[1] * x + m[5] * y + m[9] * z + m[13]); Z += w * (m[2] * x + m[6] * y + m[10] * z + m[14])
          NX += w * (m[0] * nx + m[4] * ny + m[8] * nz); NY += w * (m[1] * nx + m[5] * ny + m[9] * nz); NZ += w * (m[2] * nx + m[6] * ny + m[10] * nz)
        }
      } else { const m = 노드월드; X = m[0] * x + m[4] * y + m[8] * z + m[12]; Y = m[1] * x + m[5] * y + m[9] * z + m[13]; Z = m[2] * x + m[6] * y + m[10] * z + m[14]; NX = m[0] * nx + m[4] * ny + m[8] * nz; NY = m[1] * nx + m[5] * ny + m[9] * nz; NZ = m[2] * nx + m[6] * ny + m[10] * nz }
      const q = 바꿈(X, Y, Z), r = 바꿈n(NX, NY, NZ), l = Math.hypot(r[0], r[1], r[2]) || 1
      위out[v * 3] = q[0]; 위out[v * 3 + 1] = q[1]; 위out[v * 3 + 2] = q[2]
      노out[v * 3] = r[0] / l; 노out[v * 3 + 1] = r[1] / l; 노out[v * 3 + 2] = r[2] / l
    }
    out.push({ 위: 위out, 노: 노out, 부분: p })
    if (!셈캐시.has(키)) 셈캐시.set(키, new Map())
    셈캐시.get(키).set(덧키, { 위: 위out, 노: 노out, 감음: p.감음 })
  }
  return { 부분: out, 키: 모.키 }
}

/** 몸 좌표(부분) → 세상 좌표 — 놓기(사람3d)와 같은 돌림 · 옮김(부분마다 새 배열) */
export function 사람놓기(자세, x, y, z, 방향) {
  const c = Math.cos(방향), s = Math.sin(방향)
  const 한 = new Map()             // 같은 배열은 한 번만 옮김(부분들이 나눠 씀)
  return 자세.부분.map(({ 위, 노, 부분 }) => {
    if (한.has(위)) { const r = 한.get(위); return { 위: r.W, 노: r.N, 부분 } }
    const n = 위.length, W = new Float32Array(n), N = new Float32Array(n)
    for (let i = 0; i < n; i += 3) {
      W[i] = x + 위[i] * c - 위[i + 1] * s; W[i + 1] = y + 위[i] * s + 위[i + 1] * c; W[i + 2] = z + 위[i + 2]
      N[i] = 노[i] * c - 노[i + 1] * s; N[i + 1] = 노[i] * s + 노[i + 1] * c; N[i + 2] = 노[i + 2]
    }
    한.set(위, { W, N })
    return { 위: W, 노: N, 부분 }
  })
}

/* ── 🎮 사이트 캐릭터(VRoid 샘플 D · E · F · G — CC0) · 고를 때 받음 ── */
export const 캐릭터들 = [
  { 키: '수아', 파일: 'f', 말: '짧은 반바지 · 긴 양말' },
  { 키: '리나', 파일: 'g', 말: '분홍 원피스' },
  { 키: '하나', 파일: 'e', 말: '초록 원피스 · 앞치마' },
  { 키: '유나', 파일: 'd', 말: '조끼 · 주름 치마' },
]
const 받은 = new Map()
/** 캐릭터 파일을 받아 읽음(같은 것은 한 번만) — 주소 = /jeoksan/char/<파일>.vrm */
export function 캐릭터받기(키, 그림읽기, 바탕 = '/jeoksan/char/') {
  const c = 캐릭터들.find((x) => x.키 === 키)
  if (!c) return Promise.reject(new Error('없는 캐릭터 ' + 키))
  if (!받은.has(키)) {
    const p = fetch(바탕 + c.파일 + '.vrm').then((r) => { if (!r.ok) throw new Error('캐릭터 파일을 받지 못했습니다(' + r.status + ')'); return r.arrayBuffer() }).then((b) => 사람모델읽기(b, 그림읽기))
    p.catch(() => 받은.delete(키))
    받은.set(키, p)
  }
  return 받은.get(키)
}
