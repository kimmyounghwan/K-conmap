/**
 * 🧭 G387 실제 현장 도면 회귀 — BIM 물량 화면(/jeoksan/bim)과 같은 길로 셈해 기록한 값과 견줌 (2026-10-23)
 *   SITE_A=<DXF 폴더> SITE_B=<DXF 폴더> SITE_G=<DXF 폴더> SITE_P=<DXF 폴더> node --max-old-space-size=12000 tools/시험_현장회귀.mjs
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
import { 골조읽기, 같음입히기 } from '../web/src/lib/골조자동.js'
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
export function 현장셈(폴더, 거름 = '', 같음 = null) {
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
  /* 🪜 G393 계단 — 도면 셈(BIM) 계단 줄 합 · 작업 화면 계단 합 */
  const 계합 = (줄) => { const m = { 콘크리트: 0, 거푸집: 0, 철근: 0 }; for (const x of 줄) if (x.부재 === '계단') { const k = /거푸집/.test(x.항목) ? '거푸집' : x.항목; if (k in m) m[k] += x.수량 } return m }
  const 계도 = 계합(S.줄)
  const 기철 = (줄) => 줄.filter((x) => x.부재 === '기초' && x.항목 === '철근').reduce((a, x) => a + x.수량, 0)
  const 합 = {}
  for (const x of S.줄) { const 항 = /거푸집/.test(x.항목) ? '거푸집' : x.항목; 합[항] = (합[항] || 0) + x.수량 }
  /* 📌 G406 사람이 «같은 부재» 로 정한 것(소장님 결정) — 같음입히기 뒤 셈(화면 BIM 물량에서 «같음» 단추를 누른 것과 같은 길) */
  let 같음셈 = null
  if (같음) {
    const R2 = 같음입히기(R, 같음)
    const S2 = 셈(셈방법입히기(겹친것빼기(층고바꾸기(R2.공사, {}, R2.읽음 && R2.읽음.높이), 모델), '도면'))
    const 합2 = {}
    for (const x of S2.줄) { const 항 = /거푸집/.test(x.항목) ? '거푸집' : x.항목; 합2[항] = (합2[항] || 0) + x.수량 }
    같음셈 = { 합: 합2, 배근: R2.공사.배근, 경고: R2.경고 || [] }
  }
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
  const 계모 = 계합(G.R.줄)
  return { 합, 같음셈, 배근: 공사.배근, 경고: R.경고 || [], 파일: 파일.length, 부재: 모델.부재.length, 모델: { 종, 옮김: 변.옮김, 못옮김: 변.못옮김.length, 하나씩, 계도, 계모, 계단수: 변.M.부재.filter((o) => o.종류 === '계단').length, 기철도: 기철(S.줄), 기철모: 기철(G.R.줄), 철모: G.합.철근 } }
}
for (const [키, v] of Object.entries(기대)) {
  const 변수 = 'SITE_' + 키.slice(-1)
  const 폴더 = process.env[변수]
  if (!폴더 || !fs.existsSync(폴더)) { console.log(`■ ${키} — 폴더 없음(환경 변수 ${변수}) · 건너뜀`); continue }
  본++
  console.log(`■ ${키} (${v.말})`)
  const r = 현장셈(폴더, v.거름, v.같음 ? v.같음.정함 : null)
  ok(`도면 ${v.파일}장`, r.파일 === v.파일, r.파일)
  for (const [항, 값] of Object.entries(v.합)) ok(`${항} ${값}`, Math.abs((r.합[항] || 0) - 값) < 0.01, +(r.합[항] || 0).toFixed(3))
  /* 🧭 G405 도면 근거 잠금 — 배근표 줄의 칸 값(도면 어디서 읽었는지 «근거») · ❓ 도면에 없음(짐작 안 함) */
  for (const [종, 기호, 칸, 값, 근거] of v.배근 || []) {
    const z = (r.배근[종] || []).find((x) => x.기호 === 기호)
    const got = z ? (칸 === '없음' ? (z._없음 || []).join(' · ') : String(z[칸] ?? '')) : '(줄 없음)'
    ok(`📐 ${종} ${기호} ${칸} = «${값}» — ${근거}`, got === 값, got)
  }
  /* 📌 G406 사람 결정(같은 부재) 뒤 값 — 결정 없으면 ❓(위 값) · 결정하면 그 일람표 줄 값 */
  if (v.같음) {
    const g = r.같음셈
    for (const [항, 값] of Object.entries(v.같음.합)) ok(`📌 ${v.같음.말} → ${항} ${값}`, Math.abs((g.합[항] || 0) - 값) < 0.01, +(g.합[항] || 0).toFixed(3))
    for (const [종, 기호, 칸, 값] of v.같음.배근 || []) { const z = (g.배근[종] || []).find((x) => x.기호 === 기호); const got = z ? String(z[칸] ?? '') : '(줄 없음)'; ok(`📌 ${종} ${기호} ${칸} = «${값}»`, 칸 === '만든' ? new RegExp(값).test(got) : got === 값, got) }
    ok('📌 알림 «사람이 같은 부재로 본 것» · ❓ 알림에서 그 기호 빠짐', g.경고.some((w) => /^📌 사람이 같은 부재로 본 것/.test(w)) && !g.경고.some((w) => /^❓ 도면에 없음/.test(w) && Object.keys(v.같음.정함).some((k) => new RegExp('[(·] ' + k.split('|')[1] + ' ').test(' ' + w.replace('(', '( ')))), g.경고.filter((w) => /❓|📌/.test(w)))
  }
  for (const [re, 말, 없] of v.경고 || []) ok(`알림 ${말}`, 없 ? !r.경고.some((w) => new RegExp(re).test(w)) : r.경고.some((w) => new RegExp(re).test(w)), r.경고.filter((w) => /❓|📐|🤖/.test(w)).map((w) => w.slice(0, 120)))
  if (v.모델) {
    ok(`작업 화면 옮김 ${v.모델.옮김} · 못옮김 ${v.모델.못옮김}`, r.모델.옮김 === v.모델.옮김 && r.모델.못옮김 === v.모델.못옮김, [r.모델.옮김, r.모델.못옮김])
    for (const [종, 값] of Object.entries(v.모델.종)) ok(`작업 화면 ${종} 콘크리트 ${값}`, Math.abs((r.모델.종[종] || 0) - 값) < 0.01, +(r.모델.종[종] || 0).toFixed(3))
    ok(`📚 도면함 — 평면 ${r.모델.하나씩.평면}장 하나씩 가져와도 한꺼번에와 같음(부재 ${r.모델.하나씩.부재} · 빨강 ${r.모델.하나씩.빨강})`, r.모델.하나씩.같음, r.모델.하나씩)
    /* 🪜 G393 계단 — 건설맵이 먼저 세운 계단 물량 = 도면 셈(콘크리트 · 거푸집 · 철근) · 🔧 기초 철근(MAT 추가 보강근 덧줄 · 도면 정착표) */
    if (v.모델.계단 !== undefined) {
      const 같 = (a, b) => Math.abs(a - b) < 0.01
      ok(`🪜 작업 화면 계단 ${v.모델.계단}곳 — 콘크리트 · 거푸집 · 철근 = 도면 셈(${r.모델.계도.콘크리트.toFixed(3)} ㎥ · ${r.모델.계도.거푸집.toFixed(3)} ㎡ · ${(r.모델.계도.철근 / 1000).toFixed(3)} t)`, r.모델.계단수 === v.모델.계단 && 같(r.모델.계모.콘크리트, r.모델.계도.콘크리트) && 같(r.모델.계모.거푸집, r.모델.계도.거푸집) && 같(r.모델.계모.철근, r.모델.계도.철근), [r.모델.계단수, r.모델.계모, r.모델.계도])
    }
    if (v.모델.기초철근 !== undefined) ok(`🔧 작업 화면 기초 철근 ${v.모델.기초철근} t(도면 셈 ${(r.모델.기철도 / 1000).toFixed(3)} t) · 철근 합 ${v.모델.철근} t`, Math.abs(r.모델.기철모 / 1000 - v.모델.기초철근) < 0.001 && Math.abs(r.모델.철모 / 1000 - v.모델.철근) < 0.001, [r.모델.기철모 / 1000, r.모델.철모 / 1000])
  } else console.log('  · 작업 화면 값(기록용):', JSON.stringify({ 옮김: r.모델.옮김, 못옮김: r.모델.못옮김, 종: Object.fromEntries(Object.entries(r.모델.종).map(([k, x]) => [k, +x.toFixed(3)])) }))
}
console.log(!본 ? '\n(본 현장 없음 — 환경 변수로 폴더를 주세요)' : bad ? `\n✗ ${bad} 틀림` : '\n✓ 모두 맞음')
if (bad) process.exit(1)
