/**
 * 📚 G483 넣은 도면 쌓기 — 작업 화면 «📐 도면 넣기(골조 · 토목 함께)» (2026-10-31)
 *
 * 소장님: 「도면을 넣고, 다시 또 도면을 넣으면 먼저 넣었던 도면이 사라지고, 방금 넣은 도면만 남아있어. 왜 이러는 거지?
 *          예전에 이 문제를 말했던 것 같은데 고쳐지지 않은 것 같아 … 도면함에 계속 도면이 있어야 하는 거 아니야?
 *          그래야. 체크를 표시할 수 있지? 그 부분만 볼 수 있는 거잖아」
 *   까닭: BIM 물량(G438)에는 «넣은 도면은 도면함에 더해짐 · 같은 이름은 새 것 · ✕ 빼기 · 🗑 비우기 · 이 브라우저에 남김» 을 넣었는데,
 *         작업 화면(G397 함께넣기 · pages/Model.jsx)은 넣을 때마다 «이번에 넣은 파일만» 읽어 토목 결과 · 골조 모델을 통째로 바꿨음.
 *   → BIM 과 같은 가게(lib/도면함.js 함가게 — 이름만 «kcm-ws-dwgbox»)에 넣은 원본(DWG · DXF · 측량 엑셀 · CSV)을 쌓아 두고,
 *     새로 넣으면 «쌓인 것 + 새 것» 을 한꺼번에 다시 읽음(골조 층 · 토목 자리 맞춤이 도면끼리 서로 보고 정하기 때문 — 도면 3D G101 과 같은 길).
 *   · 같은 이름을 다시 넣으면 새 것으로 바꿈(고친 도면) · 도면함 ✕ 로 한 장 빼기 · 🗑 로 모두 비우기 · 예시는 안 쌓음
 *   · 서버로 안 올라감(이 브라우저 안) · 합이 아주 크면(큰한도) 이 탭에만 둠(새로고침하면 다시 넣어야 — 알림에 말함)
 */
import { 함가게 } from './도면함.js'

const 가게 = 함가게('kcm-ws-dwgbox')
export const 큰한도 = 400 * 1024 * 1024
let 메모 = null                    // [{ 이름, buf }] — 이 탭

const 열쇠 = (n) => String(n || '').trim().toLowerCase()
/** 도면 줄기 — lib/토목작업.js 도면줄기와 같은 셈(확장자 · «이름 · 노선글» 뒤 뺌) */
export const 줄기 = (n) => String(n || '').split(' · ')[0].replace(/\.(dxf|dwg)$/i, '').trim()
export const 크기 = (파일) => (파일 || []).reduce((n, f) => n + ((f.buf && f.buf.byteLength) || 0), 0)

/** 이 브라우저에 쌓인 도면 — [{이름, buf}] (넣은 차례 · 없으면 []) */
export async function 쌓인것() {
  if (메모) return 메모
  const 목록 = await 가게.함목록()
  const 들 = []
  for (const x of 목록) {
    const buf = await 가게.함몸(x.키)
    if (buf && buf.byteLength) 들.push({ 이름: x.이름, buf })
  }
  메모 = 들
  return 메모
}

/** 앞 + 새 — 같은 이름(대소문자 무시)은 새 것으로 바꾸고 새 것은 뒤에 */
export function 합치기(앞, 새) {
  const 새이름 = new Set((새 || []).map((f) => 열쇠(f.이름)))
  return [...(앞 || []).filter((f) => !새이름.has(열쇠(f.이름))), ...(새 || [])]
}

/** 줄기(도면함 한 줄)에 해당하는 원본 빼기 — DWG 를 DXF 로 바꾼 이름(«x.dxf»)도 같은 줄기 */
export function 빼기(파일, 뺄줄기) {
  const 뺄 = new Set((Array.isArray(뺄줄기) ? 뺄줄기 : [뺄줄기]).map((z) => 줄기(z).toLowerCase()))
  return (파일 || []).filter((f) => !뺄.has(줄기(f.이름).toLowerCase()))
}

/**
 * 쌓기 — 다 읽은 뒤에만 부름(읽다 틀리면 앞 것 그대로). 파일 = 이제 도면함에 있을 «모두» · 새것 = 이번에 넣은 이름들(그것만 몸을 다시 씀)
 * 돌려줌: true = 이 브라우저에 남김 · false = 이 탭에만(너무 큼 · 저장소 막힘)
 */
export async function 쌓기(파일, 새것 = []) {
  메모 = 파일 || []
  const 있는 = await 가게.함목록()
  const 남길 = new Set(메모.map((f) => 열쇠(f.이름)))
  for (const x of 있는) if (!남길.has(x.키)) await 가게.함빼기(x.키)
  if (크기(메모) > 큰한도) { await 가게.함비우기(); return false }
  const 있는키 = new Set(있는.map((x) => x.키))
  const 새 = new Set((새것 || []).map(열쇠))
  let 됨 = true, 차례 = 0
  for (const f of 메모) {
    const k = 열쇠(f.이름)
    차례++
    if (있는키.has(k) && !새.has(k)) { 됨 = (await 가게.함고치기({ 키: k, 이름: f.이름, 크기: f.buf.byteLength, 때: Date.now(), 차례 })) && 됨; continue }
    됨 = (await 가게.함넣기({ 키: k, 이름: f.이름, 크기: f.buf.byteLength, 때: Date.now(), 차례 }, f.buf)) && 됨
  }
  return 됨
}

/** 모두 비우기(🗑) */
export async function 비우기() {
  메모 = []
  await 가게.함비우기()
}

/** 시험용 — 이 탭 메모 잊기(다음 쌓인것() 은 브라우저 저장소에서 다시 읽음 = 새로고침과 같음) */
export function _메모잊기() { 메모 = null }
