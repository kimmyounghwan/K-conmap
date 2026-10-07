/**
 * 🎯 확보 예가 — 작은 자료 굽기 (G184 · 2026-10-07)
 *   node tools/확보예가굽기.mjs <개찰 자료 first.json> <싣는 폴더 web/dist/data> [overview.json]
 *
 * 소장님: 「비용이 왜 이렇게 들어가지? 무료로 할 수 있는 방법 없어?」 → 「해. 1, 2번으로 무료로 만들어 줘」
 *   깃허브 자동 갱신(update.yml «성적표용 개찰 자료 싣기» 다음)에서 돕니다 — 깃허브 쪽은 무료.
 *   ① kb/mini.json   바로투찰 «확보 예가 미리 보기» 용 작은 자료(lib/확보예가자료.js 미니만들기)
 *   ② kb/c/{0~999}.json 업체 페이지용 — 사업자번호마다 투찰자리(성적표와 같은 셈) 결과를 줄인 것
 *   ③ kb/gm.json     💰 G185 바로투찰 «금액 고르기» 용 — 금액대마다 사정률 자리별 실격 · 1순위 건수(lib/금액대성적.js · 수 KB)
 *   셈은 화면과 같은 lib(투찰자리.js)를 그대로 부릅니다 — 같은 식을 두 번 적지 않습니다.
 *   실패해도 배포는 계속됩니다(continue-on-error) — 그때 화면은 «자료를 받지 못했습니다» 를 띄웁니다.
 */
import fs from 'fs'
import path from 'path'
import { 투찰자리 } from '../web/src/lib/투찰자리.js'
import { P50_FALLBACK } from '../web/src/lib/bidmath.js'
import { 미니만들기, 업체조각, 업체요약 } from '../web/src/lib/확보예가자료.js'
import { 성적만들기 } from '../web/src/lib/금액대성적.js'   /* 💰 G185 금액대별 «이 자리에 넣었다면» */

const [원본, 싣는곳, 개요] = process.argv.slice(2)
if (!원본 || !싣는곳) { console.error('쓰는 법: node tools/확보예가굽기.mjs <first.json> <web/dist/data> [overview.json]'); process.exit(2) }
const 처음 = Date.now()
const 자료 = JSON.parse(fs.readFileSync(원본, 'utf8'))
const rows = Object.values((자료 && 자료.con) || {})
let p50 = P50_FALLBACK
try { const v = JSON.parse(fs.readFileSync(개요 || path.join(싣는곳, 'overview.json'), 'utf8'))?.sjq?.p50; if (v) p50 = Number(v) } catch (e) { /* 없으면 대체값 */ }

const 폴더 = path.join(싣는곳, 'kb')
const 조각폴더 = path.join(폴더, 'c')
fs.mkdirSync(조각폴더, { recursive: true })

/* ① 작은 자료 */
const 미니 = 미니만들기(rows)
fs.writeFileSync(path.join(폴더, 'mini.json'), JSON.stringify(미니))

/* ② 업체마다 — 그 업체가 든 개찰만 모아 투찰자리(한 번 훑기) */
const 묶음 = new Map()
for (const r of rows) {
  for (const c of r.corps || []) {
    const b = c && c.length > 3 && c[3] ? String(c[3]) : ''
    if (!b) continue
    let L = 묶음.get(b)
    if (!L) { L = []; 묶음.set(b, L) }
    if (L[L.length - 1] !== r) L.push(r)
  }
}
const 조각 = new Map()
let 업체 = 0
for (const [b, L] of 묶음) {
  if (L.length < 3) continue
  let t = null
  try { t = 투찰자리(b, L, p50) } catch (e) { t = null }
  if (!t) continue
  const n = 업체조각(b)
  let o = 조각.get(n)
  if (!o) { o = {}; 조각.set(n, o) }
  o[b] = 업체요약(t)
  업체++
}
let 합 = 0
for (let n = 0; n < 1000; n++) {
  const txt = JSON.stringify({ p50, 업체: 조각.get(n) || {} })
  합 += txt.length
  fs.writeFileSync(path.join(조각폴더, `${n}.json`), txt)
}
/* ③ 금액대별 자리 성적 */
const 성적 = 성적만들기(rows, p50)
fs.writeFileSync(path.join(폴더, 'gm.json'), JSON.stringify(성적))
const 미니글 = fs.statSync(path.join(폴더, 'mini.json')).size
console.log(`확보 예가 굽기 — 개찰 ${rows.length} · 작은 자료 ${미니.r.length}줄 ${(미니글 / 1e6).toFixed(2)}MB · 업체 ${업체}곳 · 조각 1000개 ${(합 / 1e6).toFixed(2)}MB · 금액대 성적 ${성적.b.reduce((p, c) => p + c.n, 0)}건 ${(fs.statSync(path.join(폴더, 'gm.json')).size / 1e3).toFixed(1)}KB · p50 ${p50} · ${((Date.now() - 처음) / 1000).toFixed(1)}초`)
