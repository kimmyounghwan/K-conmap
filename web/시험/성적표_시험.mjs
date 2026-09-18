/* ══════════════════════════════════════════════════════════════
   성적표_시험.mjs — 브라우저 성적표가 **파이썬과 같은 답**을 내나 (2026-09-18)

   왜 이렇게 하나
     성적표 계산을 브라우저로 옮겼습니다(web/src/lib/성적표.js).
     옮겨 적은 것이 맞는지는 «눈으로 봐서» 알 수 없습니다. 그래서 원본인
     tools/report_data.py 를 **그 자리에서 돌려** 나온 JSON 과 한 줄씩 기계로 맞춥니다.
     selfcheck 가 bidmath.js ↔ bidmath.py 를 맞추는 것과 같은 방식입니다.

   돌리는 법
       node web/시험/성적표_시험.mjs            (업체는 자료에서 스스로 고릅니다)
       node web/시험/성적표_시험.mjs 1234567890 9876543210
     ⚠️ data/store/first.json 과 파이썬이 있어야 합니다. 둘 다 소장님 컴퓨터에 있습니다.
     ⚠️ 기준 JSON 은 **저장소에 두지 않습니다** — 남의 사업자번호·대표 이름이 들어갑니다.
        돌릴 때마다 임시 자리에 만들고 지웁니다.

   ⚠️ 숫자 맞추기
     · 정수(금액·건수·등수)는 **딱 맞아야** 합니다. 하나라도 어긋나면 ⛔ 입니다.
     · 소수는 파이썬 round() 가 «반올림해서 짝수로» 이고 자바스크립트는 늘 위로
       올립니다. 정규분포 누적분포도 자바스크립트 쪽은 근사식(오차 1.5e-7)입니다.
       그래서 **끝자리 하나 차이는 ⚠️ 로 세고, 그보다 크면 ⛔** 입니다.
   ══════════════════════════════════════════════════════════════ */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = process.env.KCM_ROOT || path.resolve(여기, '..', '..')
const 자료 = process.env.KCM_FIRST || path.join(뿌리, 'data', 'store', 'first.json')
const 파이썬 = process.env.KCM_PY || (process.platform === 'win32' ? 'python' : 'python3')

const lib = process.env.KCM_LIB || path.join(뿌리, 'web', 'src', 'lib', '성적표.js')
const { 성적표, P50_FALLBACK, 업체목록, 업체찾기 } =
  await import('file://' + lib.replace(/\\/g, '/'))

if (!fs.existsSync(자료)) {
  console.log('⛔ 개찰 자료가 없습니다:', 자료)
  console.log('   data/store/first.json 이 있어야 합니다.')
  process.exit(1)
}

const 줄 = Object.values(JSON.parse(fs.readFileSync(자료, 'utf-8')).con || {})
console.log(`개찰 ${줄.length.toLocaleString()}건을 읽었습니다`)

/* 업체 고르기 — 손으로 적어 두면 자료가 바뀔 때 시험이 먼저 썩습니다.
   그래서 «많이 넣은 곳 · 낙찰이 한 건도 없는 곳 · 몇 건뿐인 곳» 을 그때그때 고릅니다. */
function 고르기() {
  const arg = process.argv.slice(2).filter((x) => /^\d{10}$/.test(x))
  if (arg.length) return arg
  const m = new Map()
  for (const r of 줄) {
    const cs = r.corps || []
    for (let i = 0; i < cs.length; i++) {
      const c = cs[i]
      if (!c || c.length <= 3 || !c[3]) continue
      const k = String(c[3])
      const v = m.get(k) || { n: 0, w: 0 }
      v.n += 1
      if (i === 0) v.w += 1
      m.set(k, v)
    }
  }
  const a = [...m.entries()].sort((x, y) => y[1].n - x[1].n)
  const 많이 = a.slice(0, 2).map(([k]) => k)
  const 낙찰없음 = a.filter(([, v]) => v.w === 0).slice(0, 2).map(([k]) => k)
  const 적게 = a.filter(([, v]) => v.n === 5).slice(0, 1).map(([k]) => k)
  return [...new Set([...많이, ...낙찰없음, ...적게])]
}

const 칸 = fs.mkdtempSync(path.join(os.tmpdir(), 'kcm성적표'))
let 틀림 = 0, 흔들림 = 0, 잰것 = 0
const 흔든자리 = []
const 수인가 = (v) => typeof v === 'number' && isFinite(v)

function 맞대보기(a, b, 길) {
  잰것 += 1
  if (a === b) return
  if (a == null && b == null) return
  if (수인가(a) && 수인가(b)) {
    const d = Math.abs(a - b)
    if (d === 0) return
    if (Number.isInteger(a) && Number.isInteger(b)) {
      틀림 += 1; console.log(`  ⛔ ${길}  파이썬 ${a} ≠ 자바 ${b}`)
      return
    }
    if (d <= 0.1100001) { 흔들림 += 1; 흔든자리.push(`${길} ${a}/${b}`); return }
    틀림 += 1; console.log(`  ⛔ ${길}  파이썬 ${a} ≠ 자바 ${b} (차 ${d})`)
    return
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      틀림 += 1; console.log(`  ⛔ ${길}  칸 수가 다릅니다 ${a.length} ≠ ${b.length}`)
      return
    }
    a.forEach((v, i) => 맞대보기(v, b[i], `${길}[${i}]`))
    return
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) 맞대보기(a[k], b[k], `${길}.${k}`)
    return
  }
  틀림 += 1
  console.log(`  ⛔ ${길}  파이썬 ${JSON.stringify(a)} ≠ 자바 ${JSON.stringify(b)}`)
}

try {
  const 업체들 = 고르기()
  if (!업체들.length) { console.log('⛔ 고를 업체가 없습니다'); process.exit(1) }
  for (const bno of 업체들) {
    const out = path.join(칸, bno + '.json')
    try {
      execFileSync(파이썬, [path.join(뿌리, 'tools', 'report_data.py'), '--bno', bno, '--out', out],
                   { cwd: 뿌리, stdio: ['ignore', 'ignore', 'pipe'] })
    } catch (e) {
      console.log(`⛔ ${bno} — 파이썬이 돌지 않았습니다: ${String(e.stderr || e.message).slice(0, 200)}`)
      틀림 += 1
      continue
    }
    const 기준 = JSON.parse(fs.readFileSync(out, 'utf-8'))
    const p50 = 기준.기준?.사정률중앙값 ?? P50_FALLBACK
    const t0 = Date.now()
    const 낸것 = 성적표(bno, 줄, p50, [])      // 다음자리(마감 전 공고)는 그때그때 달라 뺍니다
    const 걸린 = Date.now() - t0
    if (!낸것) { 틀림 += 1; console.log(`⛔ ${bno} — 자바 쪽이 아무것도 못 냈습니다`); continue }
    const 전 = 틀림
    for (const k of Object.keys(기준)) {
      if (k === '기준' || k === '다음자리') continue   // 만든 시각·마감 전 공고는 그때그때 다릅니다
      맞대보기(기준[k], 낸것[k], k)
    }
    console.log(`${틀림 === 전 ? '✅' : '⛔'} ${기준.업체.이름} — 투찰 ${기준.요약.투찰}건 · ${걸린}ms`)
  }

  /* 업체 찾기도 굴려 봅니다 — 목록이 비면 화면이 아무것도 못 합니다 */
  const 목록 = 업체목록(줄)
  const 찾음 = 업체찾기(목록, 업체들[0])
  if (!찾음.length || 찾음[0].bno !== 업체들[0]) {
    틀림 += 1; console.log('⛔ 업체찾기 — 사업자번호로 못 찾습니다')
  } else {
    console.log(`✅ 업체찾기 — 업체 ${목록.length.toLocaleString()}곳 색인 · 사업자번호로 바로 찾습니다`)
  }
} finally {
  try { fs.rmSync(칸, { recursive: true, force: true }) } catch { /* 지우지 못해도 그만 */ }
}

console.log(`\n잰 것 ${잰것.toLocaleString()}자리 · 어긋남 ${틀림} · 끝자리 흔들림 ${흔들림}`)
if (흔든자리.length) console.log('  ⚠️ ' + 흔든자리.slice(0, 12).join(' · ') + (흔든자리.length > 12 ? ' …' : ''))
if (틀림) { console.log('⛔ 파이썬과 답이 다릅니다'); process.exit(1) }
console.log('✅ 파이썬(tools/report_data.py)과 같은 답입니다')
