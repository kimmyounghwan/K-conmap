/**
 * 시험 — 🏁 낙찰 서류 한 벌(web/src/lib/낙찰한벌.js) · G499 (2026-11-01)
 *   node tools/시험_낙찰한벌.mjs   (node_modules 없이 — PC bat 에서도)
 *   ① 차례의 서식(slug)이 forms.json 에 다 있고 이름이 같음 · 도구 주소는 화면 경로(main.jsx)에 있음
 *   ② 주소 ↔ 값 오감 ③ 공통 칸에 넣기(빈 값은 안 건드림) ④ 공통 칸 이름이 종이 서식(격자작성) · 블록 서식(서식작성)이 읽는 이름과 같음
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 한벌차례, 한벌칸, 한벌주소, 주소값, 공통넣기, 공통읽기, 공통열쇠 } from '../web/src/lib/낙찰한벌.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 웹 = path.join(여기, '../web/src')
let 통과 = 0, 실패 = 0
const 확인 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✔', 이름) } else { 실패++; console.log('  ✘', 이름, typeof 더 === 'string' ? 더 : JSON.stringify(더)) } }

console.log('① 차례')
{
  const 서식 = new Map(JSON.parse(fs.readFileSync(path.join(웹, 'data/forms.json'), 'utf8')).forms.map((f) => [f.slug, f.title]))
  const 들 = 한벌차례.flatMap((단) => 단.들)
  const 없음 = 들.filter((x) => x.slug && !서식.has(x.slug)).map((x) => x.slug)
  const 이름다름 = 들.filter((x) => x.slug && 서식.has(x.slug) && 서식.get(x.slug) !== x.t).map((x) => [x.slug, x.t, 서식.get(x.slug)])
  확인(`서식 ${들.filter((x) => x.slug).length}가지가 forms.json 에 다 있음`, !없음.length, 없음)
  확인('이름이 forms.json 과 같음', !이름다름.length, 이름다름)
  const 경로 = fs.readFileSync(path.join(웹, 'main.jsx'), 'utf8')
  const 도구 = 들.filter((x) => x.to).map((x) => x.to)
  확인(`도구 주소 ${도구.length}곳이 화면 경로에 있음(${도구.join(' · ')})`, 도구.every((to) => 경로.includes(`path="${to}"`) || (to === '/tools/after-award' && 경로.includes('path="/tools/:slug"'))), 도구)
  확인('단계 다섯 — 계약 · 착공 · 안전 · 공사 중 · 돈', 한벌차례.map((x) => x.k).join(',') === '계약,착공,안전,공사 중,돈')
  확인('한 벌 화면 경로(/forms/hanbeol)가 /forms/:slug 앞에', 경로.indexOf('path="/forms/hanbeol"') > 0 && 경로.indexOf('path="/forms/hanbeol"') < 경로.indexOf('path="/forms/:slug"'))
}

console.log('② 주소')
{
  const u = 한벌주소({ no: 'R26BK01776922', 이름: '가상 ○○지구 배수로 정비공사', 발주: '가상시', 금액: 222498175 })
  확인('주소 꼴', u.startsWith('/forms/hanbeol?no=R26BK01776922&n='), u)
  const v = 주소값(u.split('?')[1])
  확인('주소 → 값(계약금액은 쉼표)', v.no === 'R26BK01776922' && v.현장 === '가상 ○○지구 배수로 정비공사' && v.발주 === '가상시' && v.계약금액 === '222,498,175', v)
  확인('빈 주소', 한벌주소() === '/forms/hanbeol' && 주소값('').현장 === '')
}

console.log('③ 공통 칸')
{
  const 저장 = { _: { [공통열쇠]: JSON.stringify({ 회사: '가상건설(주)', 작성: '김가상', 현장: '옛 공사' }) }, getItem(k) { return this._[k] ?? null }, setItem(k, v) { this._[k] = String(v) } }
  const n = 공통넣기({ 현장: '가상 배수로 정비공사', 발주: '가상시', 계약금액: '222,498,175', 회사: '', 대리인: '' }, 저장)
  const 공 = 공통읽기(저장)
  확인('넣은 칸 3 · 회사(빈 값)는 지난번 그대로 · 작성 그대로 · 현장은 새 값', n === 3 && 공.현장 === '가상 배수로 정비공사' && 공.발주 === '가상시' && 공.계약금액 === '222,498,175' && 공.회사 === '가상건설(주)' && 공.작성 === '김가상', 공)
}

console.log('④ 공통 칸 이름 = 서식이 읽는 이름')
{
  const 종이 = fs.readFileSync(path.join(웹, 'tools/격자작성.jsx'), 'utf8')
  const 블록 = fs.readFileSync(path.join(웹, 'tools/서식작성.jsx'), 'utf8')
  for (const [k] of 한벌칸) {
    확인(`«${k}» — 종이 서식 공통칸에 있음`, new RegExp(`\\['${k}', /`).test(종이), k)
  }
  for (const k of ['현장', '회사', '발주', '계약금액', '대리인', '위치']) 확인(`«${k}» — 블록 서식 공통칸에도 있음`, new RegExp(`\\['${k}', /`).test(블록), k)
  /* 블록 서식 공통칸 정규식이 흔한 이름표를 알아봄 */
  const 시작 = 블록.indexOf('const 공통칸 = [') + 'const 공통칸 = '.length
  const 끝 = 블록.indexOf('\n]', 시작) + 2
  const 공통칸 = eval('(' + 블록.slice(시작, 끝) + ')')
  const 이름 = (s) => { const x = 공통칸.find(([, re]) => re.test(s)); return x ? x[0] : null }
  확인('이름표 — 공 사 명 → 현장 · 발주기관 → 발주 · 계약금액 → 계약금액 · 현장대리인 → 대리인 · 공사장소 → 위치', 이름('공 사 명') === '현장' && 이름('발주기관') === '발주' && 이름('계 약 금 액') === '계약금액' && 이름('현장대리인') === '대리인' && 이름('공사 장소') === '위치', [이름('공 사 명'), 이름('발주기관'), 이름('계 약 금 액'), 이름('현장대리인'), 이름('공사 장소')])
  확인('엉뚱한 이름표는 안 잡음(작업명 · 발주번호 · 금액)', 이름('작업명') === null && 이름('금액') === null)
}

console.log(실패 ? `✘ ${실패} 틀림 · ${통과} 맞음` : `✔ 모두 맞음(${통과})`)
process.exit(실패 ? 1 : 0)
