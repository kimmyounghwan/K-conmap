/**
 * /jeoksan/magam — 🧱 마감 수량산출 · 방마다 바닥·벽·천장 (2026-09-27)
 *
 * 소장님: 「골조 말고 다른 것도 있지 않았어???」 → 주신 마감 프로그램 설명서의 «방(실) 중심» 방식
 *         고르신 것: 「마감 수량산출」 (사이트에, 모두 무료)
 *
 * ■ 흐름: ① 마감표(마감 기호마다 들어가는 재료) → ② 창호표(창호 재료 식·창호 조합) → ③ 실(방마다 한 줄) → ④ 외벽
 *         → ⑤ 묶음·조합(평형·셀을 동·층 범위·개수로 곱함 · 치환) → ⑥ 결과(산출서·집계·동별·구역별·창호 집계·면적 검산·당초 대비·엑셀·인쇄)
 * ■ 2026-09-27 「빠진 기능까지 다」: 묶음+조합표·면적 검산·치환·창호 산출(W·H·A·L)·창호 조합·계수 식 변수(Q·A·L·H·J·K)·부자재·일괄 바꾸기·구역·당초 대비
 * ■ «잰 치수 빼기»: 실 표의 면적·둘레 칸을 누르고 도면의 «방 안» 을 누르면 면적과 둘레가 한 번에 들어갑니다.
 *     창호 칸에서 창호 글자(WD1 …)를 누르면 하나씩 더해집니다. 실명·층은 글자, 천장고·길이는 치수·선.
 *   도면의 «실내재료마감표»·«창호일람표» 가 있으면 한 번에 채울 수 있습니다(lib/도면자동.js 의 표찾기).
 * ■ 도면·자료는 이 브라우저 안에만 있습니다(적은 것: localStorage · 도면: IndexedDB). 서버로 가지 않습니다.
 * ■ 셈: lib/마감.js (시험: node tools/시험_마감.mjs) · 도면판: ../도면판.jsx · 누른 값: lib/찍기.js
 * ■ 예시 도면 web/public/jeoksan/마감_예시.dxf 는 K-건설맵이 그린 «가상» 평면도입니다(tools/마감_예시도면.py).
 * ■ ⚡ 2026-09-28 «도면 넣으면 자동» (소장님 「되도록 자동으로 물량이 나오게 해줘. 도면 클릭하면 나온다 이러지 말고」)
 *   lib/도면전부.js 마감자동: 방(실 이름 글자를 품은 닫힌 선)마다 면적·둘레·창호를 저절로 · 실내재료마감표·창호일람표가 있으면 기호·천장고·창호표까지
 *   → 곧바로 ⑥ 결과. 누르기는 고칠 때만. 끌어 놓기·🧪 예시도 자동으로.
 * ■ 🔗 2026-09-28 결과 ↔ 도면 오가기(lib/도면오가기.js): ⑥ 결과의 산출서 줄을 누르면 그 방을 찍은 자리가 도면에서 빛나고,
 *   도면을 누르면 그 자리에서 나온 산출서 줄을 칠함 (받은 설명서의 «양방향 링크» 를 «방식만»)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 셈, 새공사, 예시공사, 실칸, 외벽칸, 창호칸, 재료칸, 창호재료칸, 묶음칸, 묶음종류, 조합칸, 치환칸, 창호조합칸, 부위들, 창호풀기, 창호글, 마감표읽기, 창호표읽기, 일괄바꾸기, 비교, 엑셀 } from '../lib/마감.js'
import { 품은도형, 도형글자, 종류 } from '../lib/골조도면.js'
import { 찍기, 두점더하기, 도움글, 수글 } from '../lib/찍기.js'
import { 표찾기 } from '../lib/도면자동.js'
import { 줄자리, 도형상자, 모은상자, 누른줄들 } from '../lib/도면오가기.js'
import { 마감자동 } from '../lib/도면전부.js'
import { use도면, 도면판, 도면상태줄 } from '../도면판.jsx'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { askAfter } from '../AskComment'
import { use화면상태 } from '../lib/길기록.js'

import { 단위보기, 단위풀이 } from '../lib/단위.js'
const 저장열쇠 = 'kcm.magam.v1'
const 도면열쇠 = '마감도면'
const 예시도면 = '/jeoksan/마감_예시.dxf'
const 쉼 = (n, d = 0) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n || 0)

/** 칸마다 도면에서 무엇을 받나 */
function 칸종류(표, key) {
  if (표 === '실') {
    if (key === '면적' || key === '둘레') return '방'
    if (key === '천장고') return '길이'
    if (key === '개수') return '개수'
    if (key === '창호') return '창호'
    if (key === '벽공제') return '면적'
    if (['층', '실명', '바닥', '걸레받이', '벽', '천장', '몰딩', '묶음', '구역', '비고'].includes(key)) return '글자'
  }
  if (표 === '외벽') {
    if (key === '길이' || key === '높이') return '길이'
    if (key === '창호') return '창호'
    if (key === '공제') return '면적'
    if (['층', '부위', '마감', '비고'].includes(key)) return '글자'
  }
  if (표 === '창호') {
    if (key === '폭' || key === '높이') return '길이'
    if (key === '기호' || key === '구분' || key === '비고') return '글자'
  }
  if (표 === '창호조합') {
    if (key === '개수') return '개수'
    if (['동', '층', '기호', '비고'].includes(key)) return '글자'
  }
  if (표 === '묶음') {
    if (key === '전용') return '면적'
    if (key === '이름' || key === '비고') return '글자'
  }
  if (표 === '조합' && ['동', '층', '묶음', '비고'].includes(key)) return '글자'
  return ''
}
const 도움 = {
  ...도움글,
  방: '방(닫힌 선·해치) 안을 누르면 «면적»과 «둘레»가 한 번에 들어갑니다. 다른 방을 또 누르면 더하고, 다시 누르면 뺍니다.',
  창호: '창호 글자(예: WD1·AW1)를 누르면 하나씩 더해집니다(«WD1*2»). 잘못 넣었으면 칸에서 지우십시오.',
}
const 숫자칸 = new Set(['개수', '면적', '둘레', '천장고', '벽공제', '길이', '높이', '공제', '폭', '전용'])
const 탭이름 = { 마감: '① 마감표', 창호: '② 창호표', 실: '③ 실', 외벽: '④ 외벽', 묶음: '⑤ 묶음·조합', 결과: '⑥ 결과' }
const 표탭 = { 조합: '묶음', 치환: '묶음', 묶음: '묶음', 창호조합: '창호' }

function 불러오기() {
  try {
    const t = localStorage.getItem(저장열쇠)
    if (!t) return null
    const p = JSON.parse(t)
    if (!p || !Array.isArray(p.실)) return null
    return { ...새공사(), ...p, 기준: { ...새공사().기준, ...(p.기준 || {}) } }
  } catch (e) { return null }
}

/** 휴대폰 폭 — ④·⑥ 결과에서는 도면을 위에 붙이지 않음(표가 가려지지 않게) */
const 좁은화면 = () => typeof window !== 'undefined' && window.innerWidth < 700

export default function Magam() {
  const [공사, set공사] = useState(() => 불러오기() || 새공사())
  /* 🧭 2026-09-27 — 탭 = 뒤로가기 한 칸 (lib/길기록.js) */
  const [처음탭] = useState(() => (불러오기() ? '실' : '마감'))
  const [탭, set탭] = use화면상태('탭', 처음탭)
  const [선택, set선택] = useState(null)        // {표, i, key}
  const 도 = use도면(도면열쇠)
  const { 모델, 끈층, 단위 } = 도
  const [두점, set두점] = useState(null)
  const [알림, set알림] = useState({ 글: '', 좋음: false })
  const [보는중, set보는중] = useState(null)
  const [묻기, set묻기] = useState('')          // '' | '예시' | '지우기'
  const [표채움, set표채움] = useState('')
  const 파일칸 = useRef(null)
  const 자동칸 = useRef(null)
  /* 🔗 결과 ↔ 도면 (2026-09-28) */
  const [짚음, set짚음] = useState(null)      // {표, i}
  const [짚은, set짚은] = useState([])        // '표|i'
  const [가볼, set가볼] = useState(null)
  const [결과알림, set결과알림] = useState(null)
  /* ⚡ 도면 넣으면 자동 (2026-09-28) — 도면이 다 읽히면(모델) 방·표로 공사를 채움 */
  const [자동대기, set자동대기] = useState(null)      // {옛: 그때 열려 있던 모델} — 새 도면이 다 읽히면(모델이 바뀌면) 채움
  const [자동알림, set자동알림] = useState(null)   // {글, warn}
  const [자동묻기, set자동묻기] = useState(null)   // 이미 적은 실이 있으면 바꿀지 여쭘 {R}
  const 자동파일 = (files) => { if (!files || !files.length) return; set자동대기({ 옛: 모델 }); set자동알림(null); 도.파일받기(files) }

  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(저장열쇠, JSON.stringify(공사)) } catch (e) { /* 가득 참 */ } }, 400)
    return () => clearTimeout(t)
  }, [공사])

  const 결과 = useMemo(() => { try { return 셈(공사) } catch (e) { return { 줄: [], 경고: [{ 글: '셈하다 멈췄습니다: ' + e.message }], 집계: { 합: [], 층별: [], 부위별: [], 동별: [], 구역별: [] }, 창호집계: [], 면적검산: [], 기: 공사.기준 } } }, [공사])

  const 예시열기 = async () => {
    set묻기('')
    set공사(예시공사())
    set탭('실'); set선택(null)
    try {
      const r = await fetch(예시도면)
      if (!r.ok) throw new Error(r.status)
      set자동대기({ 옛: 모델, 예시: true }); set자동알림(null)
      도.도면열기(await r.arrayBuffer(), '마감_예시.dxf (가상 평면도)')
    } catch (e) { 도.set도면상태({ k: 'err', 글: '예시 도면을 받지 못했습니다 (' + e.message + ')' }) }
  }
  const 비었나 = !공사.실.length && !공사.마감.length && !공사.창호.length && !(공사.외벽 || []).length && !(공사.조합 || []).length && !(공사.묶음 || []).length

  /* ── 표 고치기 ── */
  const 목록 = (표) => 공사[표] || []
  const 줄고치기 = (표, i, 고칠) => set공사((P) => { const a = [...(P[표] || [])]; a[i] = 고칠({ ...(a[i] || {}) }); return { ...P, [표]: a } })
  const 칸쓰기 = (표, i, key, v, 찍음) => 줄고치기(표, i, (r) => {
    r[key] = v
    const 찍 = { ...(r._찍음 || {}) }
    if (찍음 === undefined) delete 찍[key]; else 찍[key] = 찍음
    r._찍음 = 찍
    if (찍음) r._도면 = 도.도면이름
    return r
  })
  const 줄더하기 = (표, 복사) => set공사((P) => {
    const a = [...(P[표] || [])]
    const 앞 = a[a.length - 1]
    let r = {}
    if (표 === '마감') r = { 기호: '', 부위: '바닥', 이름: '', 재료: [{ 재료: '', 규격: '', 단위: 'm2', 계수: '1' }] }
    else if (복사 && 앞) { r = { ...앞, _찍음: {} }; for (const k of ['면적', '둘레', '실명', '창호', '길이', '기호']) if (k in r) r[k] = '' }
    else if (앞 && 앞.층 !== undefined) r = { 층: 앞.층 }
    a.push(r)
    return { ...P, [표]: a }
  })
  const 줄빼기 = (표, i) => { set공사((P) => { const a = [...(P[표] || [])]; a.splice(i, 1); return { ...P, [표]: a } }); set선택(null) }

  /* ── 찍기 ── */
  const 선택값 = 선택 ? (목록(선택.표)[선택.i] || {}) : null
  const 선택종류 = 선택 ? 칸종류(선택.표, 선택.key) : ''
  const 선택찍음 = 선택값 && 선택값._찍음 ? (선택값._찍음[선택.key] || []) : []
  const 같은도면 = 선택값 && (!선택값._도면 || 선택값._도면 === 도.도면이름)
  const k = (단위 && 단위.k) || 1

  const 찍었다 = (e, x, y, 보기) => {
    if (!모델) return
    if (!선택) { set알림({ 글: '먼저 아래 표에서 채울 칸을 누르십시오.' }); return }
    const kind = 선택종류
    if (kind === '방') {
      let id = e
      if (id < 0 || !(모델.E.area[id] > 0)) id = 품은도형(모델, x, y, 끈층)
      if (id < 0) { set알림({ 글: '방(닫힌 선·해치) 안을 눌러 주십시오. 방이 선 여러 개로 그려져 있으면 면적은 두 점·직접 적기로 넣으십시오.' }); return }
      const 지금 = (선택값._찍음 && 선택값._찍음.면적) || []
      const 있음 = 지금.findIndex((it) => it.e === id)
      const 새 = 있음 >= 0 ? 지금.filter((_, j) => j !== 있음) : 지금.concat([{ e: id, v: 모델.E.area[id] * k * k / 1e6, L: 모델.E.len[id] * k / 1000 }])
      const A = 새.reduce((s, it) => s + it.v, 0)
      const 둘레있음 = 새.every((it) => Number.isFinite(it.L) && it.L > 0)
      const L = 새.reduce((s, it) => s + (it.L || 0), 0)
      줄고치기(선택.표, 선택.i, (r) => {
        r.면적 = 새.length ? 수글(A, 3) : ''
        if (둘레있음) r.둘레 = 새.length ? 수글(L, 3) : ''
        r._찍음 = { ...(r._찍음 || {}), 면적: 새, 둘레: 둘레있음 ? 새 : (r._찍음 || {}).둘레 }
        r._도면 = 도.도면이름
        return r
      })
      set알림({ 글: 새.length ? '면적 ' + 수글(A, 3) + ' m²' + (둘레있음 ? ' · 둘레 ' + 수글(L, 3) + ' m' : ' (해치라 둘레는 못 잽니다 — 선을 누르거나 적으십시오)') + (새.length > 1 ? ' — 방 ' + 새.length + '개를 더했습니다(둘레는 맞닿은 변이 두 번 들어갑니다)' : '') : '뺐습니다.', 좋음: true })
      return
    }
    if (kind === '창호') {
      if (e < 0 || 모델.E.t[e] !== 종류.글자) { set알림({ 글: '창호 글자(WD1·AW1 …)를 눌러 주십시오.' }); return }
      const t = 도형글자(모델, e).trim().toUpperCase()
      if (!t || t.length > 12) { set알림({ 글: '창호 기호 글자를 눌러 주십시오 (누른 글자: «' + t + '»)' }); return }
      const a = 창호풀기(선택값.창호)
      const 있음 = a.find((o) => o.기호 === t)
      if (있음) 있음.n += 1; else a.push({ 기호: t, n: 1 })
      칸쓰기(선택.표, 선택.i, '창호', 창호글(a), 선택찍음.concat([{ e, v: t }]))
      set알림({ 글: '«' + t + '» 하나 더했습니다 → ' + 창호글(a), 좋음: true })
      return
    }
    const r = 찍기(모델, e, x, y, { kind, k, 끈층, 보기, 지금: 선택찍음 })
    if (r.목록 === null) { set알림({ 글: r.알림 }); return }
    칸쓰기(선택.표, 선택.i, 선택.key, r.값, r.목록)
    set알림({ 글: r.알림 || '', 좋음: !!r.알림좋음 })
  }
  const 두점찍었다 = (p) => {
    if (!선택 || 선택종류 !== '길이') { set알림({ 글: '길이 칸(천장고·길이·높이·폭)을 먼저 누르십시오.' }); set두점(null); return }
    if (!두점 || !두점.length) { set두점([p]); set알림({ 글: '두 번째 점을 누르십시오.', 좋음: true }); return }
    const r = 두점더하기(선택찍음, 두점[0], p, k)
    칸쓰기(선택.표, 선택.i, 선택.key, r.값, r.목록)
    set두점(null)
    set알림({ 글: '두 점 사이 ' + r.d.toFixed(3) + ' m 를 더했습니다.', 좋음: true })
  }
  const 강조 = useMemo(() => {
    const o = []
    const ids = 선택찍음.map((it) => it.e).filter((e) => e >= 0)
    if (ids.length && 같은도면) o.push({ ids, color: '#facc15', w: 3.5 })
    if (보는중 !== null && 보는중 >= 0) o.push({ ids: [보는중], color: '#38bdf8', w: 2.5 })
    return o
  }, [선택찍음, 같은도면, 보는중])
  const 오가는표 = ['실', '외벽', '창호', '창호조합', '묶음', '조합']
  const 짚은자리 = useMemo(() => (짚음 ? 줄자리((공사[짚음.표] || [])[짚음.i], 도.도면이름) : null), [짚음, 공사, 도.도면이름])
  const 결과강조 = useMemo(() => {
    const o = []
    if (짚은자리 && 짚은자리.ids.length) o.push({ ids: 짚은자리.ids, color: '#f97316', w: 4 })
    if (보는중 !== null && 보는중 >= 0) o.push({ ids: [보는중], color: '#38bdf8', w: 2.5 })
    return o
  }, [짚은자리, 보는중])
  const 짚기 = (곳) => {
    set짚은([])
    if (!곳 || !공사[곳.표]) { set짚음(null); return }
    set짚음(곳)
    const 줄 = 공사[곳.표][곳.i]
    const 말 = 곳.표 + ' ' + (곳.i + 1) + '번 줄' + (줄 && 줄.실명 ? ' «' + 줄.실명 + '»' : '')
    const 자 = 줄자리(줄, 도.도면이름)
    if (자.없음) { set결과알림({ 글: 말 + (자.딴도면.length ? ' 은(는) «' + 자.딴도면[0] + '» 도면에서 찍었습니다 — 그 도면을 열면 보입니다.' : ' 은(는) 도면에서 찍지 않고 직접 적은 값입니다 — ③ 실에서 면적 칸을 누르고 방 안을 누르면 자리가 남습니다.'), warn: true }); return }
    const r = 모은상자([도형상자(모델, 자.ids), ...자.네모들], 자.점들)
    if (r) set가볼({ r, n: Date.now() })
    set결과알림({ 글: '🔗 ' + 말 + ' — 도면에 주황색으로 보입니다.' })
    if (좁은화면()) setTimeout(() => { const el = document.querySelector('.gg-draw'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 30)   // 휴대폰: 도면이 붙어 있지 않으니 도면으로 올라감
  }
  const 결과찍었다 = useCallback((e, x, y, 보기) => {
    if (!모델) return
    const tol = 보기 ? (보기[2] - 보기[0]) / 200 : 0
    const 표들 = []
    for (const t of 오가는표) (공사[t] || []).forEach((줄, i) => 표들.push({ 열쇠: t + '|' + i, 줄 }))
    let 찾음 = 누른줄들(표들, e, x, y, 도.도면이름, tol)
    // 방 안을 누르면(도형 없음) — 그 방의 닫힌 선을 찍은 줄
    if (!찾음.length) { const id = 품은도형(모델, x, y, 끈층); if (id >= 0) 찾음 = 누른줄들(표들, id, x, y, 도.도면이름, 0) }
    set짚은(찾음); set짚음(null)
    if (!찾음.length) { set결과알림({ 글: '누른 곳에서 나온 산출서 줄이 없습니다 — 방 안이나 찍은 선을 눌러 보십시오.', warn: true }); return }
    const n = 결과.줄.filter((x2) => x2.곳 && 찾음.includes(x2.곳.표 + '|' + x2.곳.i)).length
    set결과알림({ 글: '🔗 누른 곳에서 나온 줄 — ' + 찾음.slice(0, 6).map((k2) => { const [t, i] = k2.split('|'); const 줄 = (공사[t] || [])[+i] || {}; return t + ' ' + (+i + 1) + '번' + (줄.실명 ? '(' + 줄.실명 + ')' : '') }).join(' · ') + (찾음.length > 6 ? ' …' : '') + ' → 산출서 ' + n + '줄을 파랗게 칠했습니다.' })
  }, [모델, 공사, 도.도면이름, 결과, 끈층])  // eslint-disable-line react-hooks/exhaustive-deps

  const 셀 = (표, i, key) => ({
    on: !!(선택 && 선택.표 === 표 && 선택.i === i && 선택.key === key),
    누름: () => { set선택({ 표, i, key }); set두점(null); set알림({ 글: '' }) },
  })

  /* ── 도면의 표로 채우기 ── */
  const 도면표 = useMemo(() => (모델 ? 표찾기(모델) : []), [모델])
  const 읽은마감 = useMemo(() => 마감표읽기(도면표), [도면표])
  const 읽은창호 = useMemo(() => 창호표읽기(도면표), [도면표])
  useEffect(() => {
    if (!자동대기 || !모델 || 모델 === 자동대기.옛) return
    const 예시로 = !!자동대기.예시
    set자동대기(null)
    let R
    try { R = 마감자동(모델, { k: (단위 && 단위.k) || 1, 끈층, 표들: 도면표, 이름: 도.도면이름, 옛: 공사 }) } catch (e) { set자동알림({ 글: '도면에서 방을 읽다 멈췄습니다 (' + e.message + ')', warn: true }); return }
    if (!R.공사) { set자동알림({ 글: '이 도면에서 방(실 이름 글자를 품은 닫힌 선)을 찾지 못했습니다 — ③ 실에서 면적 칸을 누르고 방 안을 누르십시오.', warn: true }); set탭('실'); return }
    if (!예시로 && (공사.실 || []).some((r) => String(r.실명 || '').trim() || String(r.면적 || '').trim())) { set자동묻기({ R }); set자동알림(null); return }
    자동넣기(R)
  }, [자동대기, 모델])   // eslint-disable-line react-hooks/exhaustive-deps
  const 자동넣기 = (R) => {
    set자동묻기(null)
    set공사(R.공사); set선택(null); set짚음(null); set짚은([]); set결과알림(null)
    const m = R.말
    set자동알림({ 글: '⚡ 도면에서 자동으로 채웠습니다 — 방 ' + m.실 + '개(면적·둘레·창호)' + (m.마감표 ? ' · 실내재료마감표 ' + m.마감표 + '줄(맞춘 방 ' + m.맞춘 + ')' : ' · 실내재료마감표 없음') + (m.창호표 ? ' · 창호일람표 ' + m.창호표 + '개' : '') + '.' +
      (m.새마감 ? ' ① 마감표에 새 기호 ' + m.새마감 + '개를 이름만 더했습니다 — 기호마다 재료를 적으면 재료별 수량이 나옵니다.' : '') +
      (!m.마감표 ? ' 방마다 바닥·벽·천장 기호를 ③ 실에 적으면 재료별 수량이 나옵니다.' : '') })
    set탭(m.마감표 ? '결과' : '실')
  }
  useEffect(() => { if (도.도면상태 && 도.도면상태.k === 'err') set자동대기(null) }, [도.도면상태])   // 못 읽은 도면이면 기다림을 거둠
  const 마감표로채우기 = () => {
    let 채움 = 0, 새줄 = 0
    set공사((P) => {
      const 실 = [...P.실]
      for (const m of 읽은마감) {
        const 같은 = 실.findIndex((r) => String(r.실명 || '').replace(/\s/g, '') === m.실명.replace(/\s/g, ''))
        const 넣 = { 바닥: m.바닥, 걸레받이: m.걸레받이, 벽: m.벽, 천장: m.천장, 천장고: m.천장고 }
        if (같은 >= 0) { const r = { ...실[같은] }; for (const [kk, v] of Object.entries(넣)) if (v && !String(r[kk] || '').trim()) { r[kk] = v; 채움++ } 실[같은] = r }
        else { 실.push({ 층: m.층 || '', 실명: m.실명, 개수: '1', ...넣 }); 새줄++ }
      }
      return { ...P, 실 }
    })
    set표채움('실내재료마감표 ' + 읽은마감.length + '줄을 읽어 실 ' + 새줄 + '줄을 더하고 빈 칸 ' + 채움 + '개를 채웠습니다. 면적·둘레는 «⚡ 지금 연 도면으로 다시 자동 채우기» 를 누르면 방마다 저절로 들어갑니다.')
  }
  const 창호표로채우기 = () => {
    let 더 = 0
    set공사((P) => {
      const a = [...P.창호]
      for (const w of 읽은창호) if (!a.some((x) => String(x.기호 || '').toUpperCase() === w.기호)) { a.push({ 기호: w.기호, 구분: w.구분, 폭: w.폭, 높이: w.높이, 비고: w.수량 ? '도면 수량 ' + w.수량 : '' }); 더++ }
      return { ...P, 창호: a }
    })
    set표채움('창호일람표에서 창호 ' + 읽은창호.length + '개를 읽어 ' + 더 + '개를 더했습니다.')
  }

  /* ── 엑셀 ── */
  const [받는중, set받는중] = useState(false)
  const 엑셀받기 = async () => {
    set받는중(true)
    try {
      const { writeWorkbook, ST } = await import('../lib/qtoxlsx.js')
      const bytes = 엑셀(공사, 결과, writeWorkbook, ST)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      a.download = '마감수량산출서_' + (공사.이름 || '현장').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30) + '.xlsx'
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 60000)
      askAfter('jeoksan')
    } finally { set받는중(false) }
  }

  const 안내 = 선택 ? (선택종류
    ? <>👉 <b>{선택.표} {선택.i + 1}번 줄 «{선택.key}»</b> — {도움[선택종류]}{두점 !== null ? ' 📏 두 점 재기: 점 두 개를 누르십시오.' : ''}</>
    : <>«{선택.key}» 칸은 도면에서 받지 않습니다 — 직접 적어 주십시오.</>)
    : <>아래 표에서 채울 칸을 누른 뒤, 도면을 누르십시오. <span className="muted">(끌면 옮기기 · 휠·두 손가락 = 확대)</span></>

  const 바닥합 = 공사.실.reduce((s2, r) => { const A = parseFloat(String(r.면적 || '').replace(/,/g, '')); const n = parseFloat(String(r.개수 || '1')) || 1; return s2 + (A > 0 ? A * n : 0) }, 0)

  return (
    <div className="wrap gg">
      <div className="card no-print">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🧱 마감 수량산출 <span className="count">· 방마다 바닥·벽·천장</span></h1>
        <div className="note sm">
          <b>평면도를 넣으면 저절로</b> — 방마다 <b>면적·둘레·창호</b>가 들어가고, 도면에 <b>실내재료마감표·창호일람표</b>가 있으면 마감 기호·천장고·창호표까지 채워 <b>재료별 수량</b>이 바로 나옵니다.
          누르는 것은 고칠 때만입니다(표의 칸을 누르고 도면을 누름). 마감 기호마다 들어가는 재료는 ① 마감표에 적어 둡니다.
        </div>
        <div className="pdfsafe">🔒 <b>도면은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 읽고 셉니다 · 회원가입 없음 · 무료</div>
        <div className="btn-row gg-top">
          <button type="button" className="btn sm" onClick={() => 자동칸.current?.click()}>⚡ 도면 넣고 자동으로</button>
          <button type="button" className="btn line sm" onClick={() => 파일칸.current?.click()}>📂 도면만 열기 (고칠 때)</button>
          <button type="button" className="btn line sm" onClick={() => (비었나 ? 예시열기() : set묻기('예시'))}>🧪 예시로 해 보기</button>
          <button type="button" className="btn ghost sm" onClick={() => set탭('결과')}>📊 결과 보기</button>
          {!비었나 && <button type="button" className="btn ghost sm" onClick={() => set묻기('지우기')}>🗑 새로 시작</button>}
        </div>
        {묻기 === '지우기' && (
          <div className="gg-ask">적은 것(마감표·창호표·실·외벽·묶음·조합·당초)을 모두 지우고 새로 시작할까요? 도면은 그대로 둡니다.
            <button type="button" className="btn sm" onClick={() => { set공사(새공사()); set묻기(''); set탭('마감'); set선택(null) }}>예, 지우기</button>
            <button type="button" className="btn ghost sm" onClick={() => set묻기('')}>아니오</button></div>
        )}
        {묻기 === '예시' && (
          <div className="gg-ask">지금 적은 것을 지우고 예시(가상 평면도)를 불러올까요?
            <button type="button" className="btn sm" onClick={예시열기}>예, 불러오기</button>
            <button type="button" className="btn ghost sm" onClick={() => set묻기('')}>아니오</button></div>
        )}
        <input ref={파일칸} type="file" accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1}
          onChange={(e) => { 도.파일받기(e.target.files); e.target.value = '' }} />
        <input ref={자동칸} type="file" accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1}
          onChange={(e) => { 자동파일(e.target.files); e.target.value = '' }} />
        {/* 📥 놓으면 ⚡ 자동으로 (2026-09-28) */}
        <끌어놓기판 글="평면도(DXF·DWG)를 놓으면 방마다 면적·둘레·창호가 저절로 들어갑니다" 받기={(fs) => 자동파일(fs)} />
        <도면상태줄 상태={도.도면상태} />
        {자동묻기 && (
          <div className="gg-ask">
            도면에서 방 <b>{자동묻기.R.말.실}개</b>를 읽었습니다. 지금 ③ 실의 {공사.실.length}줄 대신 넣을까요? (① 마감표·② 창호표는 그대로 두고 없는 기호만 더합니다)
            <button type="button" className="btn sm" onClick={() => 자동넣기(자동묻기.R)}>예, 넣기</button>
            <button type="button" className="btn ghost sm" onClick={() => set자동묻기(null)}>아니오</button>
          </div>
        )}
        {자동알림 && <div className={'gg-auto' + (자동알림.warn ? ' warn' : '')}>{자동알림.글} <button type="button" className="chip" onClick={() => set자동알림(null)}>닫기</button></div>}
        {모델 && !자동대기 && <div className="btn-row" style={{ marginTop: 8 }}><button type="button" className="chip" onClick={() => { set자동알림(null); set자동대기({ 옛: null }) }}>⚡ 지금 연 도면으로 다시 자동 채우기</button></div>}
        {모델 && (읽은마감.length > 0 || 읽은창호.length > 0) && (
          <div className="ja-sum">
            📋 도면에서 찾은 표 —{' '}
            {읽은마감.length > 0 && <>실내재료마감표 {읽은마감.length}줄 <button type="button" className="chip" onClick={마감표로채우기}>실 표 채우기</button></>}
            {읽은마감.length > 0 && 읽은창호.length > 0 && ' · '}
            {읽은창호.length > 0 && <>창호일람표 {읽은창호.length}개 <button type="button" className="chip" onClick={창호표로채우기}>창호표 채우기</button></>}
          </div>
        )}
        {표채움 && <div className="gg-say" style={{ marginTop: 8 }}>{표채움}</div>}
      </div>

      <div className="tp-tabs no-print" role="tablist">
        {Object.entries(탭이름).map(([kk, t]) => (
          <button key={kk} type="button" role="tab" aria-selected={탭 === kk} className={'tp-tab' + (탭 === kk ? ' on' : '')} onClick={() => { set탭(kk); set선택(null) }}>{t}
            {kk !== '결과' && <span className="gg-n"> {(공사[kk === '묶음' ? '조합' : kk] || []).length}</span>}</button>
        ))}
      </div>

      {(탭 === '실' || 탭 === '외벽' || 탭 === '창호' || 탭 === '묶음') && (
        <도면판 도={도} 강조={강조} 찍었다={찍었다} 두점={두점} set두점={set두점} 두점찍었다={두점찍었다} set보는중={set보는중}
          알림={알림.글} 알림좋음={알림.좋음} 안내={안내} 열기={() => 파일칸.current?.click()}
          빈글="평면도(방이 닫힌 선으로 그려진 도면)를 여세요. 도면 없이 표에 직접 적어도 됩니다." />
      )}

      {탭 === '마감' && <마감표판 공사={공사} set공사={set공사} 줄더하기={줄더하기} 줄빼기={줄빼기} />}

      {탭 === '창호' && (
        <div className="card no-print">
          <p className="muted gg-hint">창호 기호마다 한 줄 — <b>폭·높이는 m</b>(도면의 치수선을 누르면 m 로 들어갑니다). 구분이 <b>문</b>인 것은 걸레받이에서 폭만큼 뺍니다.</p>
          <편집표 표="창호" 칸들={창호칸} 줄={공사.창호} 셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 경고={결과.경고} />
          <창호재료판 공사={공사} set공사={set공사} />
          <div className="detail-h" style={{ marginTop: 18 }}>창호 조합 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 적을 때만</span></div>
          <p className="muted gg-hint">창호 개수를 <b>동·층 범위·기호·개수</b>로 직접 적습니다(층 「2-15」 = 14개 층). <b>여기에 한 줄이라도 적으면 창호 개수는 이 표로만 셉니다</b> — 실·외벽의 창호 칸은 벽·걸레받이 공제에만 씁니다. 비우면 실·외벽의 창호 칸 × 조합표로 셉니다. 개수 칸을 누르고 도면의 창호 글자를 누르면 화면 안의 같은 글자 수를 셉니다.</p>
          <편집표 표="창호조합" 칸들={창호조합칸} 줄={공사.창호조합 || []} 셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 경고={결과.경고} />
        </div>
      )}

      {탭 === '실' && (
        <div className="card no-print">
          <div className="gg-row" style={{ alignItems: 'flex-end' }}>
            <label className="gg-f">공사 이름<input value={공사.이름 || ''} placeholder="결과에 적힙니다" onChange={(e) => set공사((P) => ({ ...P, 이름: e.target.value }))} /></label>
            <label className="gg-f">기본 천장고 (m)<input value={공사.기준.천장고} inputMode="decimal" onChange={(e) => set공사((P) => ({ ...P, 기준: { ...P.기준, 천장고: e.target.value } }))} /></label>
          </div>
          <p className="muted gg-hint">방마다 한 줄. <b>면적·둘레</b> 칸을 누르고 도면의 <b>방 안</b>을 누르면 둘 다 들어갑니다. 바닥·걸레받이·벽·천장·몰딩에는 ① 마감표의 기호를 적습니다(비우면 그 부위는 안 셈). <b>창호</b>: 「WD1*2 AW1」 — 창호 칸을 누르고 도면의 창호 글자를 누르면 하나씩 더해집니다. 같은 방이 여러 개면 <b>개수</b>.
            <br /><b>묶음</b>: 세대(평형)·셀의 방이면 묶음 이름(예: 84A)을 적고 ⑤ 조합표에서 동·층·개수로 곱합니다 — 묶음을 적은 방은 조합표로만 셉니다. <b>구역</b>: 구역별 집계. <b>변수</b>: 마감표 식에 쓰는 J1~J4·K1~K5 (예: 「J1=0.3 K1=2」).</p>
          <편집표 표="실" 칸들={실칸} 줄={공사.실} 셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 경고={결과.경고} />
        </div>
      )}

      {탭 === '외벽' && (
        <div className="card no-print">
          <p className="muted gg-hint">외벽 마감(도장·타일·석재 등)은 면마다 한 줄 — <b>길이 × 높이 − 창호</b>. 마감에는 ① 마감표의 기호(부위 «외벽»)를 적습니다.</p>
          <편집표 표="외벽" 칸들={외벽칸} 줄={공사.외벽 || []} 셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 경고={결과.경고} />
        </div>
      )}

      {탭 === '묶음' && <묶음판 공사={공사} 결과={결과} 셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} />}

      {탭 === '결과' && 모델 && (
        <도면판 도={도} 강조={결과강조} 찍었다={결과찍었다} set보는중={set보는중} 붙음={!좁은화면()} 가볼곳={가볼} 두점단추={false}
          알림={결과알림 ? 결과알림.글 : ''} 알림좋음={!(결과알림 && 결과알림.warn)} 열기={() => 파일칸.current?.click()}
          안내={<>🔗 <b>산출서 줄을 누르면</b> 도면에서 그 방(찍은 자리)이 <b style={{ color: '#f97316' }}>주황색</b>으로 빛나고, <b>방 안을 누르면</b> 그 방의 산출서 줄이 <b style={{ color: '#2563eb' }}>파랗게</b> 칠해집니다.</>} />
      )}
      {탭 === '결과' && (
        <div className="card gg-print">
          <div className="gg-head">
            <div>
              <div className="detail-h" style={{ margin: 0 }}>마감 수량산출서{공사.이름 ? ' — ' + 공사.이름 : ''}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>K-건설맵 마감 수량산출 · 방(실) 중심 · 산출근거는 m 단위 숫자식</div>
            </div>
            <div className="btn-row no-print" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" disabled={!결과.줄.length || 받는중} onClick={엑셀받기}>{받는중 ? '만드는 중…' : '⬇ 엑셀 받기'}</button>
              <button type="button" className="btn line sm" disabled={!결과.줄.length} onClick={() => window.print()}>🖨 인쇄</button>
            </div>
          </div>
          <div className="gg-tiles">
            <div><span>실</span><b>{공사.실.filter((r) => String(r.실명 || '').trim()).length}</b> 개</div>
            <div><span>바닥 면적 합</span><b>{쉼(바닥합, 2)}</b> ㎡ <small>헤베</small></div>
            <div><span>재료</span><b>{결과.집계.합.length}</b> 가지</div>
            <div className={결과.경고.length ? 'bad' : 'good'}><span>검산</span><b>{결과.경고.length}</b> 건</div>
          </div>
          {결과.경고.length > 0 && (
            <div className="gg-check"><div className="detail-h">⚠️ 검산 — 셈에서 빠졌거나 확인할 것</div>
              <ul>{결과.경고.map((w, kk) => <li key={kk}>{w.곳 ? <button type="button" className="gg-go no-print" onClick={() => { set탭(표탭[w.곳.표] || w.곳.표); set선택(null) }}>{w.곳.표} {w.곳.i + 1}번 줄</button> : null} {w.글}</li>)}</ul></div>
          )}
          {!결과.줄.length && <p className="muted">아직 셀 것이 없습니다 — ① 마감표와 ③ 실을 채우십시오. (🧪 예시로 해 보기를 누르면 채워진 것을 볼 수 있습니다)</p>}
          {결과.줄.length > 0 && <결과표 결과={결과} 공사={공사} set공사={set공사} 짚기={모델 ? 짚기 : null} 짚음열쇠={짚음 ? 짚음.표 + '|' + 짚음.i : ''} 짚은={짚은} />}
        </div>
      )}

      <div className="card no-print">
        <div className="detail-h">알아 두실 것</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.85 }}>
          <li><b>바닥·천장 = 면적</b>, <b>벽 = 둘레 × 천장고 − 창호</b>, <b>걸레받이 = 둘레 − 문 폭</b>, <b>몰딩 = 둘레</b>. 재료 수량은 그 값 × 개수 × 계수입니다.</li>
          <li>공동주택처럼 같은 세대가 되풀이되면 세대 하나의 방만 적고 <b>묶음</b>으로 묶어 ⑤ 조합표에서 <b>동·층 범위·개수</b>로 곱하십시오. 동마다 다른 마감은 <b>치환</b>(F1→F3)으로.</li>
          <li>방은 <b>안목(벽 안쪽)</b> 선이어야 합니다(자동도 안목 닫힌 선을 씀). 벽 가운데선이면 벽 두께만큼 커집니다.</li>
          <li>창호는 방 하나에만 적습니다. 벽 양쪽이 모두 마감이면 양쪽 방에 다 적습니다(양면을 빼야 하므로).</li>
          <li>계수: 몰탈·콘크리트처럼 부피로 사는 것은 두께(m)를, 면적·길이로 사는 것은 1 을 적습니다. 할증은 넣지 않았습니다.</li>
          <li><b>⚡ 자동</b>: 방 이름 글자(사무실·거실…)를 품은 <b>닫힌 선</b>을 방으로 봅니다. 방이 닫힌 선으로 그려져 있지 않으면 그 방만 ③ 실에서 칸을 누르고 방 안을 누릅니다. 결과의 <b>검산</b>을 꼭 보십시오.</li>
          <li><b>⑥ 결과 ↔ 도면</b>: 산출서 줄을 누르면 그 방이 도면에서 빛나고, 방 안을 누르면 그 방의 산출서 줄이 칠해집니다(맞게 읽었는지 확인용).</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <Link className="btn ghost sm" to="/jeoksan/golgo">🏗 골조 수량산출</Link>
          <Link className="btn ghost sm" to="/jeoksan/auto">⚡ 도면 물량 자동</Link>
          <Link className="btn ghost sm" to="/jeoksan/run">🧮 수량산출서 만들기</Link>
          <Link className="btn ghost sm" to="/tools">🧰 도구 모두</Link>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────── 마감표 */
function 마감표판({ 공사, set공사, 줄더하기, 줄빼기 }) {
  const 고치기 = (i, 고칠) => set공사((P) => { const a = [...P.마감]; a[i] = 고칠({ ...a[i], 재료: [...(a[i].재료 || [])] }); return { ...P, 마감: a } })
  return (
    <div className="card no-print">
      <p className="muted gg-hint">마감 기호(도면의 실내재료마감표·마감 범례의 F1·W1·C1 …)마다 <b>들어가는 재료</b>를 적습니다. 한 기호에 재료를 여러 줄 적을 수 있습니다(예: 바닥 F1 = 몰탈 24mm + 비닐타일). <b>계수</b>: 부피 재료는 두께(m), 면적·길이 재료는 1.
        <br /><b>계수 자리에 식</b>도 됩니다 — <b>Q</b> 부위 수량 · <b>A</b> 방 면적 · <b>L</b> 둘레 · <b>H</b> 천장고 · <b>J1~J4·K1~K5</b> 방마다 적은 변수 (예: 「Q*1.05」「A+J1*L」).
        <b>부자재</b>: <b>주재료</b> 칸에 같은 마감의 재료 이름을 적으면 그 재료 1 단위당 계수만큼 (예: 비닐타일 1 m² 당 접착제 0.3 kg).</p>
      <일괄바꾸기판 공사={공사} set공사={set공사} />
      {!공사.마감.length && <p className="muted">아직 없습니다 — 아래 «＋ 마감 기호» 를 누르십시오.</p>}
      <div className="mg-list">
        {공사.마감.map((m, i) => (
          <div key={i} className="mg-card">
            <div className="mg-head">
              <label className="gg-f">기호<input value={m.기호 || ''} placeholder="F1" onChange={(e) => 고치기(i, (x) => ({ ...x, 기호: e.target.value }))} /></label>
              <label className="gg-f">부위<select value={m.부위 || '바닥'} onChange={(e) => 고치기(i, (x) => ({ ...x, 부위: e.target.value }))}>{부위들.map((b) => <option key={b}>{b}</option>)}</select></label>
              <label className="gg-f wide2">이름<input value={m.이름 || ''} placeholder="비닐타일 마감" onChange={(e) => 고치기(i, (x) => ({ ...x, 이름: e.target.value }))} /></label>
              <button type="button" className="gg-x-btn" title="이 마감 기호 지우기" onClick={() => 줄빼기('마감', i)}>✕</button>
            </div>
            <div className="gg-wrap"><table className="gg-t">
              <thead><tr>{재료칸.map(([h]) => <th key={h}>{h}</th>)}<th /></tr></thead>
              <tbody>{(m.재료 || []).map((r, j) => (
                <tr key={j}>
                  {재료칸.map(([, key, 보기]) => (
                    <td key={key} className={key === '계수' ? 'n' : ''}><input value={r[key] ?? ''} placeholder={key === '주재료' ? '' : 보기}
                      onChange={(e) => 고치기(i, (x) => { x.재료[j] = { ...x.재료[j], [key]: e.target.value }; return x })} aria-label={(m.기호 || '마감') + ' ' + (j + 1) + '번 재료 ' + key} /></td>
                  ))}
                  <td className="gg-x"><button type="button" onClick={() => 고치기(i, (x) => { x.재료.splice(j, 1); return x })}>✕</button></td>
                </tr>
              ))}</tbody>
            </table></div>
            <button type="button" className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => 고치기(i, (x) => { x.재료.push({ 재료: '', 규격: '', 단위: x.부위 === '걸레받이' || x.부위 === '몰딩' ? 'm' : 'm2', 계수: '1' }); return x })}>＋ 재료</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn sm" style={{ marginTop: 10 }} onClick={() => 줄더하기('마감', false)}>＋ 마감 기호</button>
    </div>
  )
}

/* ───────────────────────────── 명칭·규격 일괄 바꾸기 */
function 일괄바꾸기판({ 공사, set공사 }) {
  const [열림, set열림] = useState(false)
  const [칸, set칸] = useState('재료')
  const [찾, set찾] = useState('')
  const [바, set바] = useState('')
  const [말, set말] = useState('')
  if (!열림) return <div className="btn-row" style={{ margin: '0 0 8px' }}><button type="button" className="btn ghost sm" onClick={() => { set열림(true); set말('') }}>🔁 명칭·규격 일괄 바꾸기</button></div>
  const 하기 = () => {
    if (!찾.trim()) { set말('찾을 글자를 적으십시오.'); return }
    const r = 일괄바꾸기(공사, 칸, 찾, 바)
    if (r.수) set공사(r.공사)
    set말(r.수 ? '✓ ' + r.수 + '칸을 바꿨습니다 (마감표·창호 재료).' : '«' + 찾 + '» 가 들어간 ' + 칸 + ' 칸이 없습니다.')
  }
  return (
    <div className="gg-copy">
      <b>🔁 일괄 바꾸기</b>
      <label>칸<select value={칸} onChange={(e) => set칸(e.target.value)}><option>재료</option><option>규격</option></select></label>
      <label>찾을<input value={찾} onChange={(e) => set찾(e.target.value)} placeholder="예: 비닐타일" /></label>
      <label>→ 바꿀<input value={바} onChange={(e) => set바(e.target.value)} placeholder="예: 데코타일" /></label>
      <button type="button" className="btn sm" onClick={하기}>바꾸기</button>
      <button type="button" className="btn ghost sm" onClick={() => set열림(false)}>닫기</button>
      {말 && <div className="gg-copy-say">{말}</div>}
    </div>
  )
}

/* ───────────────────────────── 창호 재료 식 */
function 창호재료판({ 공사, set공사 }) {
  const 고치기 = (i, 고칠) => set공사((P) => { const a = [...P.창호]; a[i] = 고칠({ ...a[i], 재료: [...(a[i].재료 || [])] }); return { ...P, 창호: a } })
  const 있는 = (공사.창호 || []).map((w, i) => [w, i]).filter(([w]) => String(w.기호 || '').trim())
  return (
    <>
      <div className="detail-h" style={{ marginTop: 18 }}>창호 재료 — 창호 하나에 드는 것</div>
      <p className="muted gg-hint">창호마다 재료와 <b>식</b>을 적으면 창호 개수만큼 셉니다. 식: <b>W</b> 폭 · <b>H</b> 높이 · <b>A</b> = W×H · <b>L</b> = 2×(W+H) (m). 예: 유리 「A」 · 코킹 「L」 · 문틀 「2*H+W」. 재료를 안 적어도 창호 개수(개소)는 집계에 나옵니다.</p>
      {!있는.length && <p className="muted">위 창호표에 기호를 먼저 적으십시오.</p>}
      <div className="mg-list">
        {있는.map(([w, i]) => (
          <div key={i} className="mg-card">
            <div className="mg-head"><b>{w.기호}</b> <span className="muted" style={{ fontSize: 12.5 }}>{w.구분 || ''} {w.폭 && w.높이 ? w.폭 + '×' + w.높이 + ' m' : ''}</span></div>
            {(w.재료 || []).length > 0 && (
              <div className="gg-wrap"><table className="gg-t">
                <thead><tr>{창호재료칸.map(([h]) => <th key={h}>{h}</th>)}<th /></tr></thead>
                <tbody>{(w.재료 || []).map((r, j) => (
                  <tr key={j}>
                    {창호재료칸.map(([, key, 보기]) => (
                      <td key={key}><input value={r[key] ?? ''} placeholder={보기} onChange={(e) => 고치기(i, (x) => { x.재료[j] = { ...x.재료[j], [key]: e.target.value }; return x })} aria-label={w.기호 + ' ' + (j + 1) + '번 재료 ' + key} /></td>
                    ))}
                    <td className="gg-x"><button type="button" onClick={() => 고치기(i, (x) => { x.재료.splice(j, 1); return x })}>✕</button></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <button type="button" className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => 고치기(i, (x) => { x.재료.push({ 재료: '', 규격: '', 단위: 'm2', 식: 'A' }); return x })}>＋ 재료</button>
          </div>
        ))}
      </div>
    </>
  )
}

/* ───────────────────────────── 묶음·조합·치환 */
function 묶음판({ 공사, 결과, 셀, 칸쓰기, 줄더하기, 줄빼기 }) {
  const 검 = 결과.면적검산 || []
  return (
    <div className="card no-print">
      <div className="detail-h" style={{ marginTop: 0 }}>묶음 — 평형(세대)·수평셀·수직셀·기타</div>
      <p className="muted gg-hint">같이 되풀이되는 방들의 이름입니다. ③ 실 표의 <b>묶음</b> 칸에 이 이름을 적은 방들이 한 묶음이 됩니다. 평형이면 <b>전용면적</b>을 적어 두면 방 면적 합과 맞는지 검산합니다(2% 넘게 다르면 알림).</p>
      <편집표 표="묶음" 칸들={묶음칸} 줄={공사.묶음 || []} 셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 경고={결과.경고} 고르기={{ 종류: 묶음종류 }} />
      {검.length > 0 && (
        <div className="gg-wrap" style={{ marginTop: 10 }}><table className="gg-r">
          <thead><tr><th>묶음</th><th>종류</th><th>방</th><th>방 면적 합 m²</th><th>전용면적 m²</th><th>차</th></tr></thead>
          <tbody>{검.map((o) => <tr key={o.묶음} className={o.율 !== null && Math.abs(o.율) > 2 ? 'neg' : ''}><td>{o.묶음}</td><td>{o.종류}</td><td className="r">{o.실수}</td><td className="r">{쉼(o.실합, 2)}</td><td className="r">{o.전용 === null ? '—' : 쉼(o.전용, 2)}</td><td className="r">{o.차 === null ? '—' : (o.차 > 0 ? '+' : '') + 쉼(o.차, 2) + ' (' + o.율.toFixed(1) + '%)'}</td></tr>)}</tbody>
        </table></div>
      )}
      <div className="detail-h" style={{ marginTop: 18 }}>조합표 — 어느 동·어느 층에 몇 개</div>
      <p className="muted gg-hint">한 줄 = 묶음 × <b>층 범위</b>(「2-15」 = 14개 층 · 「B2-B1」 · 「1,3,5」) × <b>개수</b>(한 층에 몇 세대). <b>동</b>을 적으면 동별 집계가 나옵니다. <b>치환</b>: 아래 치환표 이름(여럿이면 띄어 적음) — 이 줄에서만 마감·창호 기호를 바꿉니다.</p>
      <편집표 표="조합" 칸들={조합칸} 줄={공사.조합 || []} 셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 경고={결과.경고} />
      <div className="detail-h" style={{ marginTop: 18 }}>치환 — 동·층마다 다른 마감·창호</div>
      <p className="muted gg-hint"><b>바꿈</b>: 「F1→F3, W1→W4, AW1→AW2」 처럼 바꿀 기호 → 새 기호를 쉼표로. 마감 기호(바닥·걸레받이·벽·천장·몰딩)와 창호 기호 모두 됩니다.</p>
      <편집표 표="치환" 칸들={치환칸} 줄={공사.치환 || []} 셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 경고={결과.경고} />
    </div>
  )
}

/* ───────────────────────────── 고치는 표 */
function 편집표({ 표, 칸들, 줄, 셀, 칸쓰기, 줄더하기, 줄빼기, 경고, 고르기 }) {
  const 경고줄 = new Map()
  for (const w of 경고 || []) { if (!w.곳 || w.곳.표 !== 표) continue; const a = 경고줄.get(w.곳.i) || []; a.push(w.글); 경고줄.set(w.곳.i, a) }
  return (
    <>
      <div className="gg-wrap">
        <table className="gg-t">
          <thead><tr><th>No.</th>{칸들.map(([h, key]) => <th key={key} title={칸종류(표, key) ? '도면에서 받음' : '직접 적음'}>{h}{칸종류(표, key) ? <i className="gg-pk">●</i> : null}</th>)}<th /></tr></thead>
          <tbody>
            {줄.map((r, i) => (
              <tr key={i} className={경고줄.has(i) ? 'warn' : ''} title={경고줄.has(i) ? 경고줄.get(i).join(' / ') : ''}>
                <td className="gg-no">{i + 1}</td>
                {칸들.map(([, key, 보기]) => {
                  const c = 셀(표, i, key)
                  const 찍 = r._찍음 && r._찍음[key] && r._찍음[key].length
                  const 고 = 고르기 && 고르기[key]
                  if (고) {
                    return (
                      <td key={key}><select value={r[key] ?? ''} onChange={(e) => 칸쓰기(표, i, key, e.target.value, undefined)} aria-label={표 + ' ' + (i + 1) + '번 줄 ' + key}>
                        <option value="">—</option>{고.map((v) => <option key={v} value={v}>{v}</option>)}
                        {r[key] && !고.includes(r[key]) ? <option value={r[key]}>{r[key]}</option> : null}
                      </select></td>
                    )
                  }
                  return (
                    <td key={key} className={(c.on ? 'on ' : '') + (찍 ? 'pk ' : '') + (숫자칸.has(key) ? 'n' : '') + (['창호', '실명', '바꿈', '변수'].includes(key) ? ' w' : '')}>
                      <input value={r[key] ?? ''} placeholder={보기 || ''} onFocus={c.누름} onClick={c.누름}
                        onChange={(e) => 칸쓰기(표, i, key, e.target.value, undefined)}
                        inputMode={숫자칸.has(key) ? 'decimal' : undefined} aria-label={표 + ' ' + (i + 1) + '번 줄 ' + key} />
                    </td>
                  )
                })}
                <td className="gg-x"><button type="button" title="이 줄 지우기" onClick={() => 줄빼기(표, i)}>✕</button></td>
              </tr>
            ))}
            {!줄.length && <tr><td colSpan={칸들.length + 2} className="gg-empty">아직 없습니다 — 아래 «＋ 줄» 을 누르십시오.</td></tr>}
          </tbody>
        </table>
      </div>
      {경고줄.size > 0 && <ul className="gg-warns">{[...경고줄.entries()].slice(0, 12).map(([i, a]) => <li key={i}>⚠️ {i + 1}번 줄 — {a.join(' / ')}</li>)}</ul>}
      <div className="btn-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn sm" onClick={() => 줄더하기(표, false)}>＋ 줄</button>
        {줄.length > 0 && <button type="button" className="btn line sm" onClick={() => 줄더하기(표, true)}>＋ 앞 줄처럼 (마감 기호 복사)</button>}
      </div>
    </>
  )
}

/* ───────────────────────────── 결과 */
function 모음표({ 목록, 앞 }) {
  return (
    <div className="gg-wrap"><table className="gg-r"><thead><tr>{앞 ? <th>{앞}</th> : null}<th>재료</th><th>규격</th><th>단위</th><th className="r">수량</th></tr></thead>
      <tbody>{목록.map((a, kk) => <tr key={kk}>{앞 ? <td>{a[앞] || '—'}</td> : null}<td>{a.재료}</td><td>{a.규격}</td><td className="u">{단위풀이(a.단위)}</td><td className="r">{앞 ? 쉼(a.수량, 3) : <b>{쉼(a.수량, 3)}</b>}<span className="단">{단위보기(a.단위)}</span></td></tr>)}</tbody></table></div>
  )
}
function 결과표({ 결과, 공사, set공사, 짚기, 짚음열쇠, 짚은 }) {
  const [보기, set보기] = useState('집계')
  /* 🔗 도면을 눌러 찾은 줄 → 산출서로 옮겨 첫 줄을 보여 줌 */
  const 짚은셋 = useMemo(() => new Set(짚은 || []), [짚은])
  const 판Ref = useRef(null)
  useEffect(() => {
    if (!짚은셋.size) return
    set보기('산출서')
    const t = setTimeout(() => { const el = 판Ref.current && 판Ref.current.parentElement && 판Ref.current.parentElement.querySelector('tr.gg-hit'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }) }, 60)
    return () => clearTimeout(t)
  }, [짚은셋])
  const 열쇠 = (곳) => (곳 ? 곳.표 + '|' + 곳.i : '')
  const 집 = 결과.집계
  const 무리 = [...new Set(결과.줄.map((x) => [x.동 || '', x.층 || '', x.실명 || ''].join('|')))]
  const 당초 = 공사.당초 && Array.isArray(공사.당초.합) ? 공사.당초 : null
  const 대비 = useMemo(() => (당초 ? 비교(당초.합, 집.합) : []), [당초, 집.합])
  const 보기들 = ['집계', '층별', '부위별'].concat((집.동별 || []).length ? ['동별'] : [], (집.구역별 || []).length ? ['구역별'] : [], (결과.창호집계 || []).length ? ['창호 집계'] : [], ['당초 대비', '산출서'])
  const 지금 = 보기들.includes(보기) ? 보기 : '집계'
  const 칸 = (kk) => 'gg-sec' + (지금 === kk ? '' : ' gg-hide')
  const 당초저장 = () => {
    const d = new Date()
    const 때 = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
    set공사((P) => ({ ...P, 당초: { 때, 합: 집.합.map((x) => ({ 재료: x.재료, 규격: x.규격, 단위: x.단위, 수량: x.수량 })) } }))
  }
  return (
    <>
      <div className="tp-subtabs no-print" ref={판Ref}>
        {보기들.map((kk) => <button key={kk} type="button" className={'chip' + (지금 === kk ? ' on' : '')} onClick={() => set보기(kk)}>{kk}</button>)}
      </div>
      <div className={칸('집계')}><div className="detail-h">집계 — 재료별</div><모음표 목록={집.합} /></div>
      <div className={칸('층별')}><div className="detail-h">층별</div><모음표 목록={집.층별} 앞="층" /></div>
      <div className={칸('부위별')}><div className="detail-h">부위별</div><모음표 목록={집.부위별} 앞="부위" /></div>
      {(집.동별 || []).length > 0 && <div className={칸('동별')}><div className="detail-h">동별</div><모음표 목록={집.동별} 앞="동" /></div>}
      {(집.구역별 || []).length > 0 && <div className={칸('구역별')}><div className="detail-h">구역별</div><모음표 목록={집.구역별} 앞="구역" /></div>}
      {(결과.창호집계 || []).length > 0 && (
        <div className={칸('창호 집계')}><div className="detail-h">창호 집계</div>
          <div className="gg-wrap"><table className="gg-r"><thead><tr><th>기호</th><th>구분</th><th>규격(mm)</th><th>개수</th></tr></thead>
            <tbody>{결과.창호집계.map((g) => <tr key={g.기호}><td>{g.기호}</td><td>{g.구분}</td><td>{g.규격}</td><td className="r"><b>{쉼(g.개수, 0)}</b></td></tr>)}</tbody></table></div>
        </div>
      )}
      <div className={칸('당초 대비')}>
        <div className="detail-h">당초 대비 (설계변경)</div>
        <p className="muted gg-hint no-print">바꾸기 전 수량을 <b>당초</b>로 남겨 두면, 고친 뒤의 수량과 재료마다 비교합니다(엑셀에도 «당초 대비» 시트).</p>
        <div className="btn-row no-print" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
          <button type="button" className="btn sm" onClick={당초저장}>📌 지금 집계를 당초로 {당초 ? '다시 ' : ''}저장</button>
          {당초 && <button type="button" className="btn ghost sm" onClick={() => set공사((P) => { const q = { ...P }; delete q.당초; return q })}>당초 지우기</button>}
        </div>
        {당초 ? (
          <>
            <p className="muted" style={{ fontSize: 12.5 }}>당초: {당초.때 || ''} 저장</p>
            <div className="gg-wrap"><table className="gg-r"><thead><tr><th>재료</th><th>규격</th><th>단위</th><th className="r">당초</th><th className="r">변경</th><th className="r">증감</th><th className="r">증감률</th></tr></thead>
              <tbody>{대비.map((x, kk) => <tr key={kk} className={x.증감 < -1e-9 ? 'neg' : ''}><td>{x.재료}</td><td>{x.규격}</td><td className="u">{단위풀이(x.단위)}</td><td className="r">{쉼(x.당초, 3)}</td><td className="r">{쉼(x.지금, 3)}</td><td className="r"><b>{(x.증감 > 1e-9 ? '+' : '') + 쉼(x.증감, 3)}</b></td><td className="r">{x.율 === null ? '신규' : (x.율 > 0 ? '+' : '') + x.율.toFixed(1) + '%'}</td></tr>)}</tbody></table></div>
          </>
        ) : <p className="muted">아직 당초가 없습니다.</p>}
      </div>
      {무리.map((s0) => {
        const [동, 층, 실명] = s0.split('|')
        return (
          <div key={s0} className={칸('산출서')}>
            <div className="detail-h">산출서 — {동 ? 동 + ' ' : ''}{층 ? 층 + '층 ' : ''}{실명 || '창호'}{짚기 ? <span className="muted no-print" style={{ fontWeight: 400, fontSize: 12 }}> · 줄을 누르면 도면에서 그 자리</span> : null}</div>
            <div className="gg-wrap"><table className="gg-r gg-calc">
              <thead><tr><th>부위</th><th>마감</th><th>재료</th><th>규격</th><th>산출근거</th><th className="r">수량</th><th>단위</th><th>비고</th></tr></thead>
              <tbody>{결과.줄.filter((x) => (x.동 || '') === 동 && (x.층 || '') === 층 && (x.실명 || '') === 실명).map((x, kk) => (
                <tr key={kk} className={(x.수량 < 0 ? 'neg' : '') + (짚기 ? ' gg-go-row' : '') + (짚은셋.has(열쇠(x.곳)) ? ' gg-hit' : '') + (짚음열쇠 && 짚음열쇠 === 열쇠(x.곳) ? ' gg-pick' : '')}
                  onClick={짚기 ? () => 짚기(x.곳) : undefined} title={짚기 ? '누르면 도면에서 이 줄이 나온 자리를 보여 드립니다' : undefined}><td>{x.부위}</td><td>{x.기호}</td><td>{x.재료}</td><td>{x.규격}</td><td className="expr">{x.식}</td><td className="r">{쉼(x.수량, 3)}</td><td className="u">{단위풀이(x.단위)}</td><td className="note2">{x.비고}</td></tr>
              ))}</tbody>
            </table></div>
          </div>
        )
      })}
    </>
  )
}
