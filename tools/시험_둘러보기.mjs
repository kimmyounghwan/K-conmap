// 🧪 둘러보기(G390 · 2026-10-23) — node tools/시험_둘러보기.mjs
//   ① 사람 셋(하나 · 수아 · 소장) 꼴 — 세모 수 · 키 · 발이 바닥 · 숫자 다 유한 · 노말 길이 1 · 걸으면 꼴이 바뀜 · 놓기(돌림)가 키를 안 바꿈
//   ② 걷기 셈 — 첫자리가 막힌 곳 밖 · 기둥으로 걸어도 뚫지 않음 · 확인 · 자동길이 그 층 슬라브 뺀 부재를 다 품음 · 자동으로 따라가면 다 확인
//   ③ ✂ 부재나누기 — 보 · 벽을 여러 곳 나눠도 콘크리트 · 거푸집 · 철근 합 · 부재별 합이 한 자리도 안 바뀜 · 끝 50 mm 안 · 기둥은 그대로
//   ④ 받침 없는 이음 = 한 줄 — 기둥 없는 통심에서 나뉜 보(선넣기) = 그 통심이 없을 때 한 보와 물량이 같음
//   ⑤ 정돈이 점검사항 · 빠짐을 남김 · 엑셀 «점검사항» 시트
//   ⑥ 🎮 게임 캐릭터(VRM 0.x — 시험용 상자 사람 · −Z 를 봄 · T 자세) 읽기 — 앞 · 왼 · 위 · 키 · 발바닥 0 · 팔 내림 · 걸으면 다리 앞뒤 · 숫자 유한 · 그림 줄이기(tools/vrm_줄이기.py) 뒤에도 읽힘
//   ⑦ 🎮 사이트 캐릭터 넷(public/jeoksan/char — 수아 · 리나 · 하나 · 유나) — 파일 있음 · 4 MB 안 · 조건(누구나 · 상업 · 재배포 · 고침 됨)만 · 키 1.4 ~ 1.8 m · 발바닥 0 · 걸어도 발이 바닥 밑으로 안 감 · 눈 깜빡임 꼴(감으면 눈꺼풀만 움직임)
//   ⑨ 🟨 G392 MAT — FT 에서 MAT 윗면에 섬(막지 않음) · 제안 확인 · 빼기(빨강으로) · 가까운 빨간 곳
//   ⑧ 🖱 누른 곳으로 걷기 — 기둥을 누르면 그 앞(0.9 m 남짓) · 바닥을 누르면 그 점 · 기둥 안을 누르면 밖으로 · 둘레 밖은 둘레 안으로 · 슬라브는 바닥 점 · 따라가면 닿음
import * as L from '../web/src/lib/골조모델.js'
import { 사람몸, 놓기, 사람들 } from '../web/src/lib/사람3d.js'
import { 층판, 첫자리, 걷기, 확인들, 자동길, 자동입력, 자동막힘, 네모거리, 사람반지름, 누른곳길, 가까운빠짐 } from '../web/src/lib/둘러보기.js'

let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '✓' : '✗', m, c ? '' : String(더).slice(0, 400)) }
const 둥 = (v) => Math.round(v * 1000) / 1000

/* ① 사람 */
봐(사람들.map((p) => p.키).join() === '하나,수아,소장', '사람 셋 = 하나 · 수아 · 소장')
for (const p of 사람들) {
  const 몸 = 사람몸(p.키, { 옷: 1 })
  const n = 몸.위.length / 9
  let z0 = Infinity, z1 = -Infinity, y0 = Infinity, y1 = -Infinity, 유한 = true, 노 = true
  for (let i = 0; i < 몸.위.length; i += 3) { const z = 몸.위[i + 2], y = 몸.위[i + 1]; if (![몸.위[i], y, z].every(Number.isFinite)) 유한 = false; z0 = Math.min(z0, z); z1 = Math.max(z1, z); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  for (let i = 0; i < 몸.노.length; i += 3) { const l = Math.hypot(몸.노[i], 몸.노[i + 1], 몸.노[i + 2]); if (!(Math.abs(l - 1) < 1e-3)) 노 = false }
  봐(n > 2000 && 몸.색.length === 몸.위.length && 몸.노.length === 몸.위.length, `${p.이름} 세모 ${n}개 · 색 · 노말 수 맞음`)
  봐(유한 && 노, `${p.이름} 숫자 모두 유한 · 노말 길이 1`)
  봐(z0 >= -0.001 && z0 < 0.01 && Math.abs(z1 - 몸.키) < 몸.키 * 0.04, `${p.이름} 발이 바닥(z ${z0.toFixed(3)}) · 키 ${z1.toFixed(2)} ≈ ${몸.키} m`)
  봐(y1 - y0 < 0.75, `${p.이름} 어깨 폭 ${(y1 - y0).toFixed(2)} m`)
  const 걸 = 사람몸(p.키, { 걸음: 1.2, 가는중: true })
  봐(걸.위.length === 몸.위.length && 걸.위.some((v, i) => Math.abs(v - 몸.위[i]) > 0.01), `${p.이름} 걸으면 꼴이 바뀜(세모 수는 같음)`)
  const 놓 = 놓기(몸, 10, -5, 3, 1.1)
  let zz = -Infinity; for (let i = 2; i < 놓.위.length; i += 3) zz = Math.max(zz, 놓.위[i])
  봐(Math.abs(zz - (3 + z1)) < 1e-4 && 놓.위 instanceof Float32Array, `${p.이름} 놓기(돌림 · 옮김) — 키 그대로`)
}

/* ② 걷기 셈 — 가상 예시(2층 라멘조) */
const E = L.예시모델()
const S = L.모델셈(E)
const H = L.층높이(E)
const 판 = 층판(S.덩어리, H, '1')
봐(판.부재.length === E.부재.filter((o) => o.층 === '1').length && 판.막.length > 0, `1층 판 — 부재 ${판.부재.length} · 막힌 것 ${판.막.length}`)
const s0 = 첫자리(판)
봐(판.막.every(({ b }) => 네모거리(s0.x, s0.y, b) >= 사람반지름 - 1e-6), '첫자리가 기둥 · 벽 밖')
{
  /* 기둥 하나를 향해 3초 걸어도 뚫지 않음 */
  const c = 판.막[0].b, cx = (c[0] + c[2]) / 2, cy = (c[1] + c[3]) / 2
  let s = { x: cx - 3, y: cy, 방향: 0 }
  for (let t = 0; t < 180; t++) s = { ...s, ...걷기(s, { 앞: 1 }, 1 / 60, 판) }
  봐(네모거리(s.x, s.y, c) >= 사람반지름 - 1e-6 && s.x < c[0], `기둥으로 걸어도 뚫지 않음(기둥 면에서 ${(네모거리(s.x, s.y, c)).toFixed(3)} m)`)
}
{
  const 길 = 자동길(판, s0)
  const 뺀 = 판.부재.filter((o) => o.종류 !== '슬라브').length
  봐(길.length === 뺀 && new Set(길.map((p) => p.id)).size === 뺀, `자동길 — 슬라브 뺀 부재 ${뺀}곳 모두`)
  let s = { ...s0 }, 본 = new Set(확인들(s, 판)), 초 = 0
  const A = { 길, k: 0, 막: 0 }
  for (let t = 0; t < 60 * 300; t++) {        // 화면과 같은 셈(자동입력 · 자동막힘)
    const 입 = 자동입력(A, s, 1 / 60)
    if (!입) break
    const r = 걷기(s, 입, 1 / 60, 판, 2.6)
    자동막힘(A, r, 1 / 60)
    s = { ...s, ...r }
    for (const id of 확인들(s, 판)) 본.add(id)
    초 = t / 60
  }
  const 선것 = 판.부재.filter((o) => o.종류 !== '슬라브')
  봐(선것.every((o) => 본.has(o.id)) && 초 < 120, `자동 둘러보기 — 1층 기둥 · 보 ${선것.length}곳 모두 확인(${Math.round(초)}초)`, 선것.filter((o) => !본.has(o.id)).map((o) => o.종류 + o.부호).join(' '))
}
const FT판 = 층판(S.덩어리, H, 'FT')
봐(FT판.바닥 <= 0, `FT(기초) 판 — 바닥 ${FT판.바닥} m(기초 밑면 · 터파기 바닥)`)

/* ③ ✂ 부재나누기 — 합이 한 자리도 안 바뀜 */
{
  const 합 = (S0) => JSON.stringify(Object.fromEntries(Object.entries(S0.합).map(([k, v]) => [k, 둥(v)])))
  const g = L.기하(E).기
  let N = E, n = 0
  for (const o of E.부재.filter((x) => x.종류 === '보' || x.종류 === '벽')) {
    const G = g.get(o.id); if (!G) continue
    for (const d of [0.31, 0.77]) { const N2 = L.부재나누기(N, N.부재.find((x) => x.id === o.id) ? o.id : -1, G.s0 + (G.s1 - G.s0) * d); if (N2 !== N) { N = N2; n++ } }
  }
  const S1 = L.모델셈(N)
  봐(n >= 20 && 합(S1) === 합(S), `보 · 벽 ${n}곳 나눔 — 콘크리트 · 거푸집 · 철근 합 그대로 ${합(S1)}`, 합(S))
  let 부 = 0; for (const [, q] of S1.부재별) 부 += q.콘크리트
  봐(Math.abs(부 - S1.합.콘크리트) < 1e-6 && S1.안나눔 === 0, `나눈 뒤 부재별 콘크리트 합 = 전체(${둥(부)})`)
  봐(S1.검사.every((z) => z.좋음) && S1.경고.length === S.경고.length, '나눈 뒤 3D 검사 ✓ · 경고 그대로')
  const 보0 = E.부재.find((x) => x.종류 === '보'), G0 = g.get(보0.id)
  봐(L.부재나누기(E, 보0.id, G0.s0 + 30) === E && L.부재나누기(E, 보0.id, G0.s1 - 10) === E, '끝에서 50 mm 안은 안 나눔')
  봐(L.부재나누기(E, E.부재.find((x) => x.종류 === '기둥').id, 1000) === E, '기둥은 안 나눔')
  const 나뉜 = L.부재나누기(E, 보0.id, (G0.s0 + G0.s1) / 2)
  const 새줄 = 나뉜.통심[G0.축].find((u) => !E.통심[G0.축].some((v) => v.id === u.id))
  봐(!!새줄 && /\+\d+$/.test(새줄.이름), `나눈 자리에 보조 통심 «${새줄 && 새줄.이름}»`)
}

/* ④ 받침 없는 이음 = 한 줄(기둥 없는 통심에서 나뉜 보 = 한 보) */
{
  const 틀 = (가운데) => {
    let M = L.새모델()
    M = { ...M, 통심: { x: 가운데 ? [{ id: 'x1', 이름: 'X1', 자리: 0 }, { id: 'x2', 이름: 'X2', 자리: 4000 }, { id: 'x3', 이름: 'X3', 자리: 9000 }] : [{ id: 'x1', 이름: 'X1', 자리: 0 }, { id: 'x3', 이름: 'X3', 자리: 9000 }], y: [{ id: 'y1', 이름: 'Y1', 자리: 0 }, { id: 'y2', 이름: 'Y2', 자리: 6000 }] } }
    for (const [x, y] of [['x1', 'y1'], ['x3', 'y1'], ['x1', 'y2'], ['x3', 'y2']]) M = L.기둥넣기(M, '1', M.배근.기둥[0].기호, x, y)
    M = L.선넣기(M, '보', '1', M.배근.보[0].기호, ['x1', 'y1'], ['x3', 'y1'])
    M = L.선넣기(M, '벽', '1', M.배근.벽[0].기호, ['x1', 'y2'], ['x3', 'y2'])
    return M
  }
  const A = 틀(true), B = 틀(false)
  봐(A.부재.filter((o) => o.종류 === '보').length === 2 && B.부재.filter((o) => o.종류 === '보').length === 1, '선넣기 — X2(기둥 없음)에서 보가 둘로 · 없으면 하나')
  const SA = L.모델셈(A), SB = L.모델셈(B)
  const 합 = (S0) => JSON.stringify(Object.fromEntries(Object.entries(S0.합).map(([k, v]) => [k, 둥(v)])))
  봐(합(SA) === 합(SB), `기둥 없는 통심에서 나뉜 보 · 벽 = 한 보 · 벽(물량 같음) ${합(SA)}`, 합(SB))
  봐(SA.공사.동[0].주자료.보.length === 1 && SA.공사.동[0].주자료.옹벽.length === 1, '산출서에도 한 줄(보 · 벽)')
}

/* ⑤ 정돈 · 엑셀 */
{
  const M = L.정돈({ ...E, 점검: [{ 층: '1', 종류: '보', 부호: 'G1', 자리: 'X1-Y1', 글: '보 춤 확인', 때: '2026. 10. 23. 21:30', id: 3 }], 빠짐: [{ 종류: '기초', 층: 'FT', 기호: 'MAT1', 까닭: 'MAT', 판: [[0, 0], [1000, 0], [1000, 1000], [0, 1000]], 높: 600 }] })
  봐(M.점검 && M.점검.length === 1 && M.빠짐 && M.빠짐.length === 1, '정돈 — 점검사항 · 빠짐 남김')
  봐(!L.정돈(E).점검 && !L.정돈(E).빠짐, '정돈 — 없으면 칸도 없음(예전 모델 그대로)')
  const 시트 = L.모델시트(M, L.모델셈(M), { QTY: 0 })
  const 점 = 시트.find((x) => x.name === '점검사항')
  봐(!!점 && 점.rows.length === 1 && 점.rows[0][5] === '보 춤 확인', '엑셀 «점검사항» 시트')
}
/* ⑥ 🎮 VRM */
{
  const { 시험VRM } = await import('./시험자료/사람vrm_만들기.mjs')
  const V = await import('../web/src/lib/사람vrm.js')
  const b = 시험VRM()
  const 모 = await V.사람모델읽기(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), null)
  봐(모.축.앞[2] < -0.99 && 모.축.왼[0] < -0.99 && 모.축.위[1] > 0.99, 'VRM 0.x(−Z 를 봄) — 앞 · 왼 · 위를 뼈 자리로 알아냄', JSON.stringify(모.축))
  봐(Math.abs(모.키 - 1.72) < 0.01 && 모.부분.length === 1 && 모.이름 === '시험 상자 사람', `VRM 키 ${모.키.toFixed(2)} m · 부분 · 이름`)
  const 상자 = (자) => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; let 유 = true; for (const p of 자.부분) for (let i = 0; i < p.위.length; i += 3) for (let c = 0; c < 3; c++) { const v = p.위[i + c]; if (!Number.isFinite(v) || !Number.isFinite(p.노[i + c])) 유 = false; mn[c] = Math.min(mn[c], v); mx[c] = Math.max(mx[c], v) } return { mn, mx, 유 } }
  const 서 = 상자(V.사람자세(모, {}))
  봐(서.유 && Math.abs(서.mn[2]) < 0.002 && Math.abs(서.mx[2] - 1.72) < 0.01, `서 있을 때 발바닥 0 · 키 ${서.mx[2].toFixed(2)}`)
  봐(서.mx[1] - 서.mn[1] < 0.8, `T 자세 팔을 내림(폭 ${(서.mx[1] - 서.mn[1]).toFixed(2)} m — 원래 1.64 m)`)
  const 걸 = 상자(V.사람자세(모, { 걸음: 1.4, 가는중: true }))
  봐(걸.유 && 걸.mx[0] - 걸.mn[0] > 서.mx[0] - 서.mn[0] + 0.3, `걸으면 다리 · 팔이 앞뒤로(앞뒤 폭 ${(서.mx[0] - 서.mn[0]).toFixed(2)} → ${(걸.mx[0] - 걸.mn[0]).toFixed(2)} m)`)
  const 놓 = V.사람놓기(V.사람자세(모, {}), 5, 2, 1, Math.PI / 2)
  let z1 = -1e9, y0 = 1e9; for (const p of 놓) for (let i = 0; i < p.위.length; i += 3) { z1 = Math.max(z1, p.위[i + 2]); y0 = Math.min(y0, p.위[i + 1]) }
  봐(Math.abs(z1 - 2.72) < 0.01 && y0 > 1.5, '사람놓기(옮김 · 돌림) — 세상 자리')
  const fs = await import('fs'), os = await import('os'), path = await import('path'), cp = await import('child_process')
  const 들 = path.join(os.tmpdir(), 'kcm_vrm_시험.vrm'), 날 = path.join(os.tmpdir(), 'kcm_vrm_시험_s.vrm')
  fs.writeFileSync(들, b)
  /* 그림 줄이기는 python + PIL 이 있는 곳에서만(Windows 는 python3 이 스토어 바로가기일 수 있어 python · py 도 봄) — 없으면 건너뜀 */
  const 파이 = ['python3', 'python', 'py'].find((c) => { try { cp.execFileSync(c, ['-c', 'import PIL'], { stdio: 'pipe', timeout: 20000 }); return true } catch (e) { return false } })
  if (!파이) console.log('· 그림 줄이기 시험 건너뜀(이 PC 에 python · PIL 없음)')
  else try {
    const url = await import('url')
    cp.execFileSync(파이, [url.fileURLToPath(new URL('./vrm_줄이기.py', import.meta.url)), 들, 날, '64'], { stdio: 'pipe' })
    const b2 = fs.readFileSync(날)
    const 모2 = await V.사람모델읽기(b2.buffer.slice(b2.byteOffset, b2.byteOffset + b2.byteLength), null)
    봐(Math.abs(모2.키 - 모.키) < 1e-6 && 모2.부분[0].위치.length === 모.부분[0].위치.length, '그림 줄인 VRM 도 같게 읽힘(뼈 · 그물 그대로)')
  } catch (e) { 봐(false, '그림 줄이기(tools/vrm_줄이기.py)', e.message) }
}
/* ⑦ 🎮 사이트 캐릭터 넷 */
{
  const fs = await import('fs')
  const V = await import('../web/src/lib/사람vrm.js')
  봐(V.캐릭터들.map((c) => c.키).join() === '수아,리나,하나,유나', '캐릭터 넷 — 수아 · 리나 · 하나 · 유나(여자만 · 남자 뺌)')
  for (const c of V.캐릭터들) {
    const 곳 = new URL('../web/public/jeoksan/char/' + c.파일 + '.vrm', import.meta.url)
    const 있 = fs.existsSync(곳) && fs.existsSync(new URL('../web/public/jeoksan/char/' + c.파일 + '.jpg', import.meta.url))
    if (!있) { 봐(false, `${c.키} 파일(${c.파일}.vrm · .jpg) 없음`); continue }
    const b = fs.readFileSync(곳)
    봐(b.length < 4e6, `${c.키} 파일 ${(b.length / 1e6).toFixed(1)} MB(4 MB 안 — tools/vrm_싣기.py)`)
    const { json } = V.GLB나누기(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
    const meta = (json.extensions.VRM || {}).meta || {}
    const u = String(meta.otherLicenseUrl || '')
    봐(meta.allowedUserName === 'Everyone' && meta.commercialUssageName === 'Allow' && /redistribution=allow/.test(u) && /corporate_commercial_use=allow/.test(u) && /modification=allow/.test(u) && /VRoid/.test(meta.author || ''), `${c.키} 이용 조건 — 누구나 · 상업 · 재배포 · 고침 됨(VRoid 샘플)`, JSON.stringify(meta).slice(0, 300))
    const 모 = await V.사람모델읽기(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), null)
    const 상자 = (자) => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; let 유 = true; for (const p of 자.부분) for (let i = 0; i < p.위.length; i += 3) for (let k = 0; k < 3; k++) { const v = p.위[i + k]; if (!Number.isFinite(v)) 유 = false; mn[k] = Math.min(mn[k], v); mx[k] = Math.max(mx[k], v) } return { mn, mx, 유 } }
    const 서 = 상자(V.사람자세(모, {}))
    봐(서.유 && 모.키 > 1.4 && 모.키 < 1.8 && Math.abs(서.mn[2]) < 0.01 && 서.mx[1] - 서.mn[1] < 0.9, `${c.키} 키 ${모.키.toFixed(2)} m · 발바닥 ${서.mn[2].toFixed(3)} · 폭 ${(서.mx[1] - 서.mn[1]).toFixed(2)} m(팔 내림)`)
    let 낮 = 0
    for (const φ of [0.5, 1.2, 2.0, 2.8, 3.6, 4.4, 5.2]) 낮 = Math.min(낮, 상자(V.사람자세(모, { 걸음: φ, 가는중: true })).mn[2])
    봐(낮 > -0.04, `${c.키} 걸을 때 발이 바닥 밑으로 4 cm 넘게 안 감(가장 낮은 ${낮.toFixed(3)} m)`)
    const 뜸 = V.사람자세(모, {}), 감 = V.사람자세(모, { 감음: 1 })
    let 움 = 0, 움점 = 0, 전 = 0
    for (let k = 0; k < 뜸.부분.length; k++) { const a = 뜸.부분[k].위, z = 감.부분[k].위; 전 += a.length / 3; for (let i = 0; i < a.length; i += 3) { const d = Math.hypot(a[i] - z[i], a[i + 1] - z[i + 1], a[i + 2] - z[i + 2]); if (d > 1e-4) { 움점++; 움 = Math.max(움, d) } } }
    봐(모.부분.some((p) => p.감음) && 움 > 0.002 && 움 < 0.05 && 움점 < 전 * 0.1, `${c.키} 👁 눈 깜빡임 — 감으면 눈 둘레 ${움점}점만(전체 ${전}) · 가장 ${(움 * 1000).toFixed(1)} mm`)
  }
}
/* ⑧ 🖱 누른 곳으로 걷기 */
{
  const 기 = 판.부재.find((o) => o.종류 === '기둥')
  const s1 = { x: 기.b[0] - 4, y: (기.b[1] + 기.b[3]) / 2, 방향: 0 }
  const [p] = 누른곳길(판, s1, null, 기.id)
  const d = 네모거리(p.x, p.y, 기.b)
  봐(p.id === 기.id && d > 0.6 && d < 1.4 && p.x < 기.b[0], `기둥 ${기.부호} 누름 → 사람 쪽 면 앞 ${d.toFixed(2)} m에 섬`)
  const [q] = 누른곳길(판, s1, { x: (기.b[0] + 기.b[2]) / 2, y: (기.b[1] + 기.b[3]) / 2 })
  봐(네모거리(q.x, q.y, 기.b) >= 사람반지름 - 1e-6 && q.id === undefined, '기둥 안 바닥을 누름 → 기둥 밖으로 밀어냄')
  const [r] = 누른곳길(판, s1, { x: 판.둘레[2] + 50, y: 판.둘레[3] + 50 })
  봐(r.x <= 판.둘레[2] + 1e-9 && r.y <= 판.둘레[3] + 1e-9, '둘레 밖을 누름 → 둘레 안으로')
  const 슬 = 판.부재.find((o) => o.종류 === '슬라브')
  const [t] = 누른곳길(판, s1, { x: s1.x + 2, y: s1.y }, 슬 ? 슬.id : -5)
  봐(t && t.id === undefined && Math.abs(t.x - (s1.x + 2)) < 0.5, '슬라브 · 없는 부재를 누름 → 그 바닥 점')
  봐(누른곳길(판, s1, null).length === 0 && 누른곳길(판, s1, { x: NaN, y: 0 }).length === 0, '하늘(점 없음)을 누르면 안 감')
  /* 따라가면 닿음(화면과 같은 셈) */
  let s = { ...s1 }
  const A = { 길: 누른곳길(판, s1, null, 기.id), k: 0, 막: 0, 누름: true }
  let 끝 = false
  for (let k = 0; k < 60 * 20; k++) { const 입 = 자동입력(A, s, 1 / 60); if (!입) { 끝 = true; break } const r2 = 걷기(s, 입, 1 / 60, 판, 2.6); 자동막힘(A, r2, 1 / 60); s = { ...s, ...r2 } }
  봐(끝 && 네모거리(s.x, s.y, 기.b) <= 1.8 && 확인들(s, 판).includes(기.id), `누른 기둥까지 걸어가 닿음(${네모거리(s.x, s.y, 기.b).toFixed(2)} m · 확인)`)
}
/* ⑨ 🟨 MAT */
{
  let M = L.예시모델()
  M = { ...M, 부재: M.부재.filter((o) => o.종류 !== '기초'), 배근: { ...M.배근, 기초: [...M.배근.기초, { 기호: 'MF1', 종류: 'MAT', 두께: 800, 하부가로: 'D22@200', 하부세로: 'D22@200', 상부가로: 'D22@200', 상부세로: 'D22@200' }] } }
  const id = M.다음
  M = { ...M, 다음: id + 1, 부재: [...M.부재, { id, 종류: '기초', 층: 'FT', 부호: 'MF1', 판: [[-1000, -1000], [22000, -1000], [22000, 13000], [-1000, 13000]], 두께: 800, 제안: '도면 외곽선 그대로 · 두께 = 도면 높이 800 mm' }] }
  const S9 = L.모델셈(M), H9 = L.층높이(M)
  const 판9 = 층판(S9.덩어리, H9, 'FT')
  봐(Math.abs(판9.바닥 - (-0.3)) < 1e-6 && !판9.막.some((b) => b.id === id), `FT 에 MAT — MAT 윗면(${판9.바닥} m)에 서고 MAT 은 막지 않음`, JSON.stringify(판9.바닥))
  const 첫 = 첫자리(판9)
  봐(첫.x > 0 && 첫.x < 21 && 첫.y > 0 && 첫.y < 12, `FT 첫자리가 건물 안(MAT 위 · ${첫.x.toFixed(1)}, ${첫.y.toFixed(1)})`)
  const 확 = L.제안확인(M, id, '10/24 00:30')
  봐(!확.부재.find((o) => o.id === id).제안 && 확.부재.find((o) => o.id === id).확인 === '10/24 00:30' && L.모델셈(확).합.콘크리트 === S9.합.콘크리트, '제안 ✓ 이대로 — 제안 글이 걷히고 확인 때 · 물량 그대로')
  봐(L.제안모두확인(M).부재.every((o) => !o.제안), '✓ 모두 이대로')
  const 뺌 = L.제안빼기(M, id)
  봐(!뺌.부재.some((o) => o.id === id) && 뺌.빠짐.length === 1 && 뺌.빠짐[0].판.length === 4 && 뺌.빠짐[0].높 === 800, '✕ 빼기 — 부재를 빼고 그 자리를 빨강(손으로)으로')
  const 빨 = 가까운빠짐({ x: 5, y: 5 }, 뺌.빠짐, 'FT')
  봐(빨 && 빨.k === 0 && 빨.d === 0, '가까운 빨간 곳 — 그 안에 서면 거리 0')
  봐(!가까운빠짐({ x: 60, y: 60 }, 뺌.빠짐, 'FT') && !가까운빠짐({ x: 5, y: 5 }, 뺌.빠짐, '1'), '멀거나 다른 층이면 없음')
  const 철 = L.기초철근넣기(M, 'MF1', 'd19@150')
  const r = 철.배근.기초.find((x) => x.기호 === 'MF1')
  봐(r.하부가로 === 'D19@150' && /D19:26\.667/.test(r.단위철근), `기초 철근 넣기 — D19@150 상 · 하부 양방향 → m²당 ${r.단위철근}`)
}
console.log('⑩ 🪜 G393 계단 — 높은 단은 막고 낮은 첫 단은 밟고 넘음 · 🔧 눈으로 볼 때 내 몸을 안 그림(회색 띠)')
{
  let M = { ...L.새모델(), 층: [{ 이름: 'FT', 층고: 0, 슬라브: 0, 내림: 0 }, { 이름: '1', 층고: 3400, 슬라브: 150 }, { 이름: '2', 층고: 3300, 슬라브: 150 }] }
  M = { ...M, 배근: { ...M.배근, 계단: [{ 기호: 'ST1', 두께: '150', 주근: 'D13@150', 배력근: 'D10@200', 단높이: '170' }] } }
  M = L.계단넣기(M, '1', 'ST1', 'x1', 'y1', 'x2', 'y2')
  const S = L.모델셈(M), H = L.층높이(M)
  const 판 = 층판(S.덩어리, H, '1')
  const 계 = S.덩어리.find((d) => d.종류 === '계단')
  봐(판.막.filter((x) => x.id === 계.id).length > 0 && 판.막.filter((x) => x.id === 계.id).length < 계.조각.length, '계단 조각 일부만 막음(첫 단 몇 개는 넘음) — ' + 판.막.filter((x) => x.id === 계.id).length + ' / ' + 계.조각.length)
  const fs = await import('fs')
  const 판글 = fs.readFileSync(new URL('../web/src/둘러보기판.jsx', import.meta.url), 'utf8')
  봐(/if \(눈Ref\.current\) \{ v\.set사람\(null\)/.test(판글), '🔒 눈으로 볼 때 v.set사람(null) — 머리카락 · 얼굴 조각이 회색 띠로 보이던 것(소장님 10/24) 다시 안 생기게')
  봐(/🟥 손으로/.test(판글) && !/빨간 곳 <b>/.test(판글), '🔒 HUD — 겹침 뺀 🟥 손으로 · 🟨 확인(«빨간 곳 156» 처럼 겹침까지 세지 않음)')
  봐(/화면점\(/.test(판글) && /gwk-bubble/.test(판글) && /🟩/.test(판글) && /구간 전체/.test(판글), '💬 말풍선(화면점) · 🟩 확인 콘크리트 · ▭ 구간 들어서면 알림 — 들어 있음')
  const B3 = await import('../web/src/lib/bim3d.js')
  봐(typeof B3.부재보기.prototype.화면점 === 'function', 'bim3d 화면점(3D → 화면) 있음')
}
console.log(`\n${ok} 통과 · ${bad} 실패`)
if (bad) process.exit(1)
