/**
 * 🧭 G387 실제 현장 도면 회귀 — BIM 물량 화면(/jeoksan/bim)과 같은 길로 셈해 기록한 값과 견줌 (2026-10-23)
 *   SITE_A=<DXF 폴더> SITE_B=<DXF 폴더> SITE_G=<DXF 폴더> node --max-old-space-size=12000 tools/시험_현장회귀.mjs
 *   실제 도면은 저장소에 넣지 않음 — 소장님 PC «현장별 자료» 의 DWG 를 DXF 로 바꾼 폴더를 환경 변수로 줌(없는 현장은 건너뜀)
 *   기대값 tools/시험자료/현장회귀.json(현장 이름 대신 A · B · G) — 도면 근거로 고쳐 값이 바뀌면 까닭을 CLAUDE.md · 기록에 적고 JSON 도 고침
 *   길: 도면읽기끝까지 → 참조끼우기 → 플랜트다듬기(골조읽기) → 층고바꾸기 → 모델만들기 → 플랜트모델 → 겹친것빼기 → 셈방법입히기(도면) → 셈
 */
import fs from 'fs'
import path from 'path'
import { decodeBytes } from '../web/src/lib/dxf3d.js'
import { 도면읽기끝까지 } from '../web/src/lib/끝까지읽기.js'
import { 단위배율 } from '../web/src/lib/골조도면.js'
import { 골조읽기 } from '../web/src/lib/골조자동.js'
import { 플랜트다듬기, 플랜트모델 } from '../web/src/lib/플랜트기초.js'
import { 셈방법입히기 } from '../web/src/lib/셈방법.js'
import { 셈 } from '../web/src/lib/골조.js'
import { 모델만들기, 층고바꾸기, 겹친것빼기 } from '../web/src/lib/BIM모델.js'
import { 참조끼우기 } from '../web/src/lib/골조끼움.js'

const 기대 = JSON.parse(fs.readFileSync(new URL('./시험자료/현장회귀.json', import.meta.url), 'utf8'))
let bad = 0, 본 = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }
export function 현장셈(폴더, 거름 = '') {
  const 파일 = fs.readdirSync(폴더).filter((f) => /\.dxf$/i.test(f) && (!거름 || new RegExp(거름).test(f))).sort()
  let 들 = 파일.map((f) => {
    const b = fs.readFileSync(path.join(폴더, f))
    const M = 도면읽기끝까지(decodeBytes(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)), () => {})
    return { 모델: M, 이름: f.replace(/\.dxf$/i, '.dwg'), k: 단위배율(M.units, M.box, M.ox, M.oy).k || 1 }
  })
  try { 들 = 참조끼우기(들).들 } catch (e) { /* 끼우기 실패 — 따로 읽은 그대로(화면과 같음) */ }
  const R = 플랜트다듬기(들, 골조읽기(들))
  const 공사0 = 층고바꾸기(R.공사, {}, R.읽음 && R.읽음.높이)
  const 모델 = 플랜트모델(모델만들기(들, R, { 높이: {} }), R)
  const S = 셈(셈방법입히기(겹친것빼기(공사0, 모델), '도면'))
  const 합 = {}
  for (const x of S.줄) { const 항 = /거푸집/.test(x.항목) ? '거푸집' : x.항목; 합[항] = (합[항] || 0) + x.수량 }
  return { 합, 파일: 파일.length, 부재: 모델.부재.length }
}
for (const [키, v] of Object.entries(기대)) {
  const 변수 = 'SITE_' + 키.slice(-1)
  const 폴더 = process.env[변수]
  if (!폴더 || !fs.existsSync(폴더)) { console.log(`■ ${키} — 폴더 없음(환경 변수 ${변수}) · 건너뜀`); continue }
  본++
  console.log(`■ ${키} (${v.말})`)
  const r = 현장셈(폴더, v.거름)
  ok(`도면 ${v.파일}장`, r.파일 === v.파일, r.파일)
  for (const [항, 값] of Object.entries(v.합)) ok(`${항} ${값}`, Math.abs((r.합[항] || 0) - 값) < 0.01, +(r.합[항] || 0).toFixed(3))
}
console.log(!본 ? '\n(본 현장 없음 — 환경 변수로 폴더를 주세요)' : bad ? `\n✗ ${bad} 틀림` : '\n✓ 모두 맞음')
if (bad) process.exit(1)
