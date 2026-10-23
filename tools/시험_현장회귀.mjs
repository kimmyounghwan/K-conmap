/**
 * 🧭 G387 실제 현장 도면 회귀 — BIM 물량 화면(/jeoksan/bim)과 같은 길로 셈해 기록한 값과 견줌 (2026-10-23)
 *   SITE_A=<DXF 폴더> SITE_B=<DXF 폴더> SITE_G=<DXF 폴더> node --max-old-space-size=12000 tools/시험_현장회귀.mjs
 *   실제 도면은 저장소에 넣지 않음 — 소장님 PC «현장별 자료» 의 DWG 를 DXF 로 바꾼 폴더를 환경 변수로 줌(없는 현장은 건너뜀)
 *   기대값 tools/시험자료/현장회귀.json(현장 이름 대신 A · B · G) — 도면 근거로 고쳐 값이 바뀌면 까닭을 CLAUDE.md · 기록에 적고 JSON 도 고침
 *   길: 도면읽기끝까지 → 참조끼우기 → 플랜트다듬기(골조읽기) → 층고바꾸기 → 모델만들기 → 플랜트모델 → 겹친것빼기 → 셈방법입히기(도면) → 셈
 *   📐 G389 + 작업 화면 «도면 넣기» 길(도면에서모델 → 모델셈) — 부재 종류별 콘크리트 · 옮긴 부재 수 · 못 옮긴 수(«모델» 칸)
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
import { 도면에서모델, 평면가져오기, 도면함목록 } from '../web/src/lib/도면모델.js'
import { 모델셈 } from '../web/src/lib/골조모델.js'

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
  const 공사 = 셈방법입히기(겹친것빼기(공사0, 모델), '도면')
  const S = 셈(공사)
  const 합 = {}
  for (const x of S.줄) { const 항 = /거푸집/.test(x.항목) ? '거푸집' : x.항목; 합[항] = (합[항] || 0) + x.수량 }
  /* 📐 G389 작업 화면 «도면 넣기» — 좌표대로 골조 모델로 옮겨 셈 */
  const 변 = 도면에서모델(모델, { 공사 })
  const G = 모델셈(변.M)
  const 종 = {}
  for (const x of G.R.줄) if (x.항목 === '콘크리트' && !/버림/.test(x.비고 || '')) 종[x.부재] = (종[x.부재] || 0) + x.수량
  /* 📚 G391 도면함 — 평면을 하나씩(아래층부터) 가져와도 한꺼번에와 같아야 함(실제 현장: 평면마다 따로 세우면 다른 평면 받침을 못 맞춰 달라졌음 → 한꺼번에 세운 모델에서 꺼내 옴) */
  const 차 = 변.M.층.map((f) => f.이름)
  const 키들 = 도면함목록(R, 모델, 변.M, 변.못옮김).sort((a, b) => 차.indexOf((a.층 || [])[0]) - 차.indexOf((b.층 || [])[0])).map((p) => p.키)     // 작업 화면 도면함과 같은 목록
  const 전체 = { ...변.M, 빠짐: 변.못옮김.filter((x) => Array.isArray(x.판)).map((x) => ({ 종류: x.종류, 층: x.층, 기호: x.기호, 까닭: x.까닭, 판: x.판, 높: x.높, 키: x.키 })) }   // 화면(Model.jsx)과 같음
  let Mb = { ...변.M, 부재: [], 빠짐: [] }
  for (const k of 키들) Mb = 평면가져오기(Mb, 전체, new Set([k])).M
  const 둥 = (H) => JSON.stringify(Object.fromEntries(Object.entries(H).map(([k, x]) => [k, Math.round(x * 1e6) / 1e6])))
  const 하나씩 = { 같음: Mb.부재.length === 변.M.부재.length && 둥(모델셈(Mb).합) === 둥(G.합) && Mb.빠짐.length === 전체.빠짐.length, 부재: Mb.부재.length, 평면: 키들.length, 빨강: Mb.빠짐.length + ' / ' + 전체.빠짐.length }
  return { 합, 파일: 파일.length, 부재: 모델.부재.length, 모델: { 종, 옮김: 변.옮김, 못옮김: 변.못옮김.length, 하나씩 } }
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
  if (v.모델) {
    ok(`작업 화면 옮김 ${v.모델.옮김} · 못옮김 ${v.모델.못옮김}`, r.모델.옮김 === v.모델.옮김 && r.모델.못옮김 === v.모델.못옮김, [r.모델.옮김, r.모델.못옮김])
    for (const [종, 값] of Object.entries(v.모델.종)) ok(`작업 화면 ${종} 콘크리트 ${값}`, Math.abs((r.모델.종[종] || 0) - 값) < 0.01, +(r.모델.종[종] || 0).toFixed(3))
    ok(`📚 도면함 — 평면 ${r.모델.하나씩.평면}장 하나씩 가져와도 한꺼번에와 같음(부재 ${r.모델.하나씩.부재} · 빨강 ${r.모델.하나씩.빨강})`, r.모델.하나씩.같음, r.모델.하나씩)
  } else console.log('  · 작업 화면 값(기록용):', JSON.stringify({ 옮김: r.모델.옮김, 못옮김: r.모델.못옮김, 종: Object.fromEntries(Object.entries(r.모델.종).map(([k, x]) => [k, +x.toFixed(3)])) }))
}
console.log(!본 ? '\n(본 현장 없음 — 환경 변수로 폴더를 주세요)' : bad ? `\n✗ ${bad} 틀림` : '\n✓ 모두 맞음')
if (bad) process.exit(1)
