/**
 * /jeoksan/golgo — 🏗 골조 수량산출 · 도면에서 찍어 재기 (2026-09-26)
 *
 * 소장님: 「이 방식을 이용해서 수량 산출서 만드는 프로그램 만들어 줘. 잰 치수 빼고」
 *         → 「사이트에, 모두 무료」 · 「수량산출서에 필요한 모든 것」
 *
 * ■ 흐름: ① 개요(층·기준값) → ② 배근표(부재 기호마다) → ③ 주자료(골조산출양식 칸 그대로)
 *         → ④ 결과(산출서·집계·검산 · 엑셀 · 인쇄)
 * ■ «잰 치수 빼기»: 표의 칸을 누르고 도면을 누르면 값이 들어갑니다.
 *     선·호·폴리선 → 길이(여러 번 누르면 합) · 치수선 → 치수 값 · 글자 → 기호 · 닫힌 선 안 → 면적
 *     QT 칸에서 글자(예: C1)를 누르면 «지금 보이는 화면 안» 같은 글자 수를 셉니다.
 *   줄마다 «어디서 찍었나» 를 남겨, 칸을 다시 누르면 그 선이 노랗게 빛납니다(검산).
 * ■ 도면·자료는 이 브라우저 안에만 있습니다(적은 것: localStorage · 도면: IndexedDB). 서버로 가지 않습니다.
 * ■ 셈: lib/골조.js (시험: node tools/시험_골조.mjs) · 도면 읽기: lib/골조도면.js · 그리기: lib/골조그림.js
 * ■ 예시 도면 web/public/jeoksan/골조_예시.dxf 는 K-건설맵이 그린 «가상» 구조평면도입니다(tools/골조_예시도면.py).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 셈, 새공사, 예시공사, 양식, 양식차례, 배근칸, 정착표, 규격들, 기준값, 엑셀 } from '../lib/골조.js'
import { 찾기판, 가까운도형, 품은도형, 도형글자, 단위배율, 종류, 종류이름 } from '../lib/골조도면.js'
import { 길만들기, 그리기, 전체보기, 조각표만들기, 가까운점 } from '../lib/골조그림.js'
import { loadFont, FONT } from '../lib/plotview.js'
import * as 기억 from '../lib/기억자료.js'
import { askAfter } from '../AskComment'

const 저장열쇠 = 'kcm.golgo.v1'
const 도면열쇠 = '골조도면'
const 예시도면 = '/jeoksan/골조_예시.dxf'
const 큰파일 = 200 * 1024 * 1024

/* 칸마다 «도면에서 무엇을 받나» */
const 길이칸 = new Set(['길이', '좌단', '우단', 'S', '높이', '내림', 'FT', '단변', '장변', '하부', '상부', '단부', '폭', '하단참', '상단참', '줄기초', 'MAT단변', 'MAT장변', '형틀공제', '단부공제', '가로', '세로', '춤', '지름', '두께'])
const 기호도칸 = new Set(['좌단', '우단', 'S', 'FT', '상부', '하부'])
const 글자칸 = new Set(['층', '열', '기호', '연결', '주근', '대근단부', '대근중앙', '늑근단부', '늑근중앙', '부근', '단변하부', '단변상부', '장변하부', '장변상부', '수직', '수평', '배력근', '하부가로', '하부세로', '상부가로', '상부세로', '가로근', '세로근', '사선근', '종류', '배근', '상부꼴', '동', '부재'])
const 면적칸 = new Set(['개구부'])
const 개수칸 = new Set(['QT', '단수'])
function 칸종류(key, 판) {
  if (판 === '배' && key === '상부') return '글자'
  if (판 === '배' && key === '하부') return '글자'
  if (개수칸.has(key)) return '개수'
  if (면적칸.has(key)) return '면적'
  if (길이칸.has(key)) return '길이'
  if (글자칸.has(key)) return '글자'
  return ''
}
const 도움 = {
  길이: '선·호·폴리선을 누르면 길이, 치수선을 누르면 그 치수 값이 들어갑니다. 여러 번 누르면 더합니다(다시 누르면 뺌).',
  면적: '닫힌 선(폴리선·해치·원)의 안쪽이나 테두리를 누르면 면적(m²)이 들어갑니다. 여러 번 누르면 더합니다.',
  개수: '글자(예: C1)를 누르면 «지금 화면에 보이는» 같은 글자 수를 셉니다. 선을 누르면 누른 개수를 셉니다.',
  글자: '도면의 글자를 누르면 그 글자가 들어갑니다.',
}

const 쉼 = (n, d = 0) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n || 0)
const 깔끔 = (v) => { const r = Math.round(v * 10) / 10; return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : String(r) }

function 불러오기() {
  try {
    const t = localStorage.getItem(저장열쇠)
    if (!t) return null
    const p = JSON.parse(t)
    if (!p || !p.주자료 || !p.배근) return null
    const 빈 = 새공사()
    return { ...빈, ...p, 기준: { ...빈.기준, ...(p.기준 || {}) }, 배근: { ...빈.배근, ...p.배근 }, 주자료: { ...빈.주자료, ...p.주자료 } }
  } catch (e) { return null }
}

function 오류글(k, more) {
  if (k === 'bindxf') return '바이너리 DXF 입니다. 캐드에서 DXF 로 저장할 때 «ASCII» 를 골라 주십시오.'
  if (k === 'notdxf' || k === 'notdwg') return 'DXF·DWG 도면 파일이 아닌 것 같습니다.'
  if (k === 'empty') return '도면에 읽을 것이 없습니다 — 모델 공간이 비었거나 레이어가 모두 꺼져 있습니다.'
  if (k === 'big') return '파일이 너무 큽니다(200MB 까지).'
  if (k === 'mem') return '도면이 너무 커서 이 기기의 기억 공간이 모자랍니다. PC 에서 열어 주십시오.'
  return '도면을 읽지 못했습니다' + (more ? ' (' + more + ')' : '') + '. 캐드에서 DXF(ASCII)로 다시 저장해 보십시오.'
}

export default function Golgo() {
  const [공사, set공사] = useState(() => 불러오기() || 새공사())
  const [탭, set탭] = useState(() => (불러오기() ? '주' : '개요'))
  const [표, set표] = useState('보')
  const [배표, set배표] = useState('보')
  const [선택, set선택] = useState(null)          // {판:'주'|'배', 표, i, key}
  const [모델, set모델] = useState(null)
  const [도면이름, set도면이름] = useState('')
  const [도면상태, set도면상태] = useState({ k: 'idle' })
  const [끈층, set끈층] = useState(() => new Set())
  const [단위, set단위] = useState(null)          // {k, 글}
  const [두점, set두점] = useState(null)          // null | [] | [[x,y]]
  const [알림, set알림] = useState('')
  const [예시묻기, set예시묻기] = useState(false)
  const [지울까, set지울까] = useState(false)
  const [층보기, set층보기] = useState(false)
  const [보는중, set보는중] = useState(null)       // 마우스 올린 도형
  const 파일칸 = useRef(null)
  const 일꾼 = useRef(null)

  /* 저장 */
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(저장열쇠, JSON.stringify(공사)) } catch (e) { /* 가득 참·사생활 모드 */ } }, 400)
    return () => clearTimeout(t)
  }, [공사])
  useEffect(() => () => { if (일꾼.current) 일꾼.current.terminate() }, [])

  /* 지난번 도면 */
  useEffect(() => {
    let 끝 = false
    기억.꺼내기(도면열쇠).then((d) => { if (!끝 && d && d.buf && !모델) 도면열기(d.buf, d.name, false) }).catch(() => {})
    return () => { 끝 = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const 결과 = useMemo(() => { try { return 셈(공사) } catch (e) { return { 줄: [], 경고: [{ 글: '셈하다 멈췄습니다: ' + e.message }], 집계: { 합: [], 층부재: [] }, 기: 공사.기준 } } }, [공사])

  /* ── 도면 열기 ── */
  const 도면열기 = useCallback(async (buf, name, 기억할 = true) => {
    set도면상태({ k: 'busy', msg: '도면 읽는 중', p: 0 })
    const 머리 = String.fromCharCode(...new Uint8Array(buf.slice(0, 6)))
    let dxf = buf
    if (/^AC10\d\d/.test(머리)) {
      set도면상태({ k: 'busy', msg: 'DWG → DXF 바꾸는 중 (큰 도면은 30초~1분)', p: 0.1 })
      try {
        dxf = await new Promise((되면, 탈) => {
          const w = new Worker(new URL('../lib/dwgdxf.worker.js', import.meta.url), { type: 'module' })
          w.onmessage = (ev) => {
            const d = ev.data || {}
            if (d.type === 'prog') set도면상태({ k: 'busy', msg: 'DWG → DXF: ' + (d.msg || ''), p: d.p || 0 })
            if (d.type === 'done') { w.terminate(); 되면(d.dxf) }
            if (d.type === 'err') { w.terminate(); 탈(new Error(d.kind === 'mem' ? 'mem' : (d.msg || d.kind))) }
          }
          w.onerror = (e) => { w.terminate(); 탈(new Error(e.message || 'DWG 바꾸기 실패')) }
          w.postMessage({ type: 'conv', buf, name }, [buf])
        })
      } catch (e) { set도면상태({ k: 'err', 글: 오류글(e.message === 'mem' ? 'mem' : 'fail', e.message) }); return }
    }
    const 사본 = 기억할 ? dxf.slice(0) : null
    if (일꾼.current) 일꾼.current.terminate()
    const w = new Worker(new URL('../lib/골조도면.worker.js', import.meta.url), { type: 'module' })
    일꾼.current = w
    w.onmessage = (ev) => {
      const d = ev.data || {}
      if (d.type === 'prog') set도면상태({ k: 'busy', msg: '도면 읽는 중', p: d.p })
      if (d.type === 'err') { set도면상태({ k: 'err', 글: 오류글(d.kind, d.msg) }); w.terminate() }
      if (d.type === 'done') {
        const M = d.model
        M.판 = 찾기판(M)
        M.조각표 = 조각표만들기(M)
        set모델(M)
        set도면이름(name)
        set단위(단위배율(M.units, M.box))
        set끈층(new Set(M.layers.map((L, i) => (L.hide ? i : -1)).filter((i) => i >= 0)))
        set도면상태({ k: 'ok' })
        w.terminate()
        if (사본) 기억.넣기(도면열쇠, { name, buf: 사본 }).catch(() => {})
      }
    }
    w.onerror = (e) => set도면상태({ k: 'err', 글: 오류글('fail', e.message) })
    w.postMessage({ type: 'read', buf: dxf }, [dxf])
  }, [])

  const 파일받기 = async (files) => {
    const f = files && files[0]
    if (!f) return
    if (f.size > 큰파일) { set도면상태({ k: 'err', 글: 오류글('big') }); return }
    도면열기(await f.arrayBuffer(), f.name)
  }

  const 예시열기 = async () => {
    set예시묻기(false)
    set공사(예시공사())
    set탭('주'); set표('보'); set선택(null)
    try {
      const r = await fetch(예시도면)
      if (!r.ok) throw new Error(r.status)
      도면열기(await r.arrayBuffer(), '골조_예시.dxf (가상 구조평면도)')
    } catch (e) { set도면상태({ k: 'err', 글: '예시 도면을 받지 못했습니다 (' + e.message + ')' }) }
  }
  const 비었나 = !Object.values(공사.주자료).some((a) => a.length) && !Object.values(공사.배근).some((a) => a.length)

  /* ── 표 고치기 ── */
  const 줄들 = (판, 이름) => (판 === '주' ? 공사.주자료[이름] : 공사.배근[이름]) || []
  const 줄고치기 = (판, 이름, i, 고칠) => set공사((P) => {
    const 새 = { ...P, [판 === '주' ? '주자료' : '배근']: { ...(판 === '주' ? P.주자료 : P.배근) } }
    const 목록 = [...(새[판 === '주' ? '주자료' : '배근'][이름] || [])]
    목록[i] = 고칠({ ...(목록[i] || {}) })
    새[판 === '주' ? '주자료' : '배근'][이름] = 목록
    return 새
  })
  const 칸쓰기 = (판, 이름, i, key, v, 찍음) => 줄고치기(판, 이름, i, (r) => {
    r[key] = v
    const 찍 = { ...(r._찍음 || {}) }
    if (찍음 === undefined) delete 찍[key]
    else 찍[key] = 찍음
    r._찍음 = 찍
    if (찍음) r._도면 = 도면이름
    return r
  })
  const 줄더하기 = (판, 이름, 복사) => set공사((P) => {
    const 곳 = 판 === '주' ? '주자료' : '배근'
    const 목록 = [...(P[곳][이름] || [])]
    const 앞 = 목록[목록.length - 1]
    let r = {}
    if (복사 && 앞) {
      r = { ...앞, _찍음: {} }
      if (판 === '주') { if ('열' in r) r.열 = ''; for (const k of ['길이', '단변', '장변', '개구부', '줄기초', 'MAT단변', 'MAT장변', '가로', '세로']) if (k in r) r[k] = '' }
    } else if (판 === '주' && 앞) r = { 층: 앞.층 }
    목록.push(r)
    return { ...P, [곳]: { ...P[곳], [이름]: 목록 } }
  })
  const 줄빼기 = (판, 이름, i) => {
    set공사((P) => {
      const 곳 = 판 === '주' ? '주자료' : '배근'
      const 목록 = [...(P[곳][이름] || [])]
      목록.splice(i, 1)
      return { ...P, [곳]: { ...P[곳], [이름]: 목록 } }
    })
    set선택(null)
  }

  /* ── 찍기 ── */
  const 선택값 = 선택 ? (줄들(선택.판, 선택.표)[선택.i] || {}) : null
  const 선택찍음 = 선택값 && 선택값._찍음 ? (선택값._찍음[선택.key] || []) : []
  const 선택종류 = 선택 ? 칸종류(선택.key, 선택.판) : ''
  const 같은도면 = 선택값 && (!선택값._도면 || 선택값._도면 === 도면이름)

  const 찍었다 = useCallback((e, x, y, 보기) => {
    if (!모델) return
    if (!선택) { set알림('먼저 아래 표에서 채울 칸을 누르십시오.'); return }
    const kind = 칸종류(선택.key, 선택.판)
    if (!kind) { set알림('이 칸은 도면에서 받지 않습니다 — 직접 적어 주십시오.'); return }
    const k = (단위 && 단위.k) || 1
    const E = 모델.E
    const 지금 = [...선택찍음].filter((it) => it && typeof it === 'object')
    const 넣기 = (목록, 값) => { 칸쓰기(선택.판, 선택.표, 선택.i, 선택.key, 값, 목록); set알림('') }
    if (e < 0 && kind !== '면적') { set알림('그 자리에는 누를 것이 없습니다 — 선·치수·글자 위를 누르십시오.'); return }
    if (kind === '글자') {
      const t = 도형글자(모델, e)
      if (!t) { set알림('글자를 눌러 주십시오 (누른 것: ' + 종류이름[E.t[e]] + ')'); return }
      넣기([{ e, v: t }], t)
      return
    }
    if (kind === '면적') {
      let id = e
      if (id < 0 || !(E.area[id] > 0)) id = 품은도형(모델, x, y, 끈층)
      if (id < 0) { set알림('닫힌 선(폴리선·해치·원)의 안쪽을 눌러 주십시오.'); return }
      const 있음 = 지금.findIndex((it) => it.e === id)
      const 새 = 있음 >= 0 ? 지금.filter((_, j) => j !== 있음) : 지금.concat([{ e: id, v: E.area[id] * k * k / 1e6 }])
      const 합 = 새.reduce((s, it) => s + it.v, 0)
      넣기(새, 새.length ? String(Math.round(합 * 1000) / 1000) : '')
      return
    }
    if (kind === '개수') {
      if (E.t[e] === 종류.글자) {
        const t = 도형글자(모델, e)
        const T = 모델.T
        const [vx0, vy0, vx1, vy1] = 보기
        let n = 0
        for (let i = 0; i < T.s.length; i++) {
          if (T.s[i] !== t) continue
          if (끈층.has(E.ly[T.e[i]])) continue
          if (T.x[i] < vx0 || T.x[i] > vx1 || T.y[i] < vy0 || T.y[i] > vy1) continue
          n++
        }
        넣기([{ e, v: n, 글: t }], String(n))
        set알림('화면 안의 «' + t + '» 글자 ' + n + '개를 셌습니다. (화면을 옮기고 다시 누르면 다시 셉니다)')
        return
      }
      const 있음 = 지금.findIndex((it) => it.e === e)
      const 새 = 있음 >= 0 ? 지금.filter((_, j) => j !== 있음) : 지금.filter((it) => !it.글).concat([{ e, v: 1 }])
      넣기(새, 새.length ? String(새.length) : '')
      return
    }
    // 길이
    let v = NaN
    if (E.t[e] === 종류.치수) {
      v = E.val[e]
      if (k !== 1 && v < 200) v *= k                      // m 로 그린 도면의 치수가 m 로 적혔으면
    } else if (E.t[e] === 종류.글자) {
      const t = 도형글자(모델, e)
      const n = parseFloat(t.replace(/,/g, ''))
      if (/^\s*-?[\d,.]+\s*$/.test(t) && Number.isFinite(n)) v = n
      else if (기호도칸.has(선택.key)) { 넣기([{ e, v: t }], t); return }
      else { set알림('숫자 글자나 선·치수를 눌러 주십시오 (누른 글자: «' + t + '»)'); return }
    } else v = E.len[e] * k
    if (!Number.isFinite(v)) { set알림('그 도형은 길이를 잴 수 없습니다 (' + 종류이름[E.t[e]] + ')'); return }
    const 있음 = 지금.findIndex((it) => it.e === e)
    const 새 = 있음 >= 0 ? 지금.filter((_, j) => j !== 있음) : 지금.filter((it) => typeof it.v === 'number').concat([{ e, v }])
    const 합 = 새.reduce((s, it) => s + it.v, 0)
    넣기(새, 새.length ? 깔끔(합) : '')
  }, [모델, 선택, 선택찍음, 단위, 끈층, 도면이름])  // eslint-disable-line react-hooks/exhaustive-deps

  const 두점찍었다 = useCallback((p) => {
    if (!선택 || 칸종류(선택.key, 선택.판) !== '길이') { set알림('길이 칸을 먼저 누르십시오.'); set두점(null); return }
    const k = (단위 && 단위.k) || 1
    if (!두점 || !두점.length) { set두점([p]); set알림('두 번째 점을 누르십시오.'); return }
    const a = 두점[0]
    const d = Math.hypot(p[0] - a[0], p[1] - a[1]) * k
    const 지금 = [...선택찍음].filter((it) => it && typeof it.v === 'number')
    const 새 = 지금.concat([{ e: -1, v: d, 점: [a, p] }])
    칸쓰기(선택.판, 선택.표, 선택.i, 선택.key, 깔끔(새.reduce((s, it) => s + it.v, 0)), 새)
    set두점(null)
    set알림('두 점 사이 ' + 깔끔(d) + ' mm 를 더했습니다.')
  }, [선택, 선택찍음, 두점, 단위])  // eslint-disable-line react-hooks/exhaustive-deps

  const 강조 = useMemo(() => {
    const out = []
    if (선택찍음.length && 같은도면) out.push({ ids: 선택찍음.map((it) => it.e).filter((e) => e >= 0), color: '#facc15', w: 3.5 })
    if (보는중 !== null && 보는중 >= 0) out.push({ ids: [보는중], color: '#38bdf8', w: 2.5 })
    return out
  }, [선택찍음, 같은도면, 보는중])

  const 셀 = (판, 이름, i, key) => ({
    on: !!(선택 && 선택.판 === 판 && 선택.표 === 이름 && 선택.i === i && 선택.key === key),
    누름: () => { set선택({ 판, 표: 이름, i, key }); set두점(null); set알림('') },
  })

  const 기준고치기 = (고칠) => set공사((P) => ({ ...P, 기준: 고칠({ ...P.기준 }) }))

  /* ── 엑셀 · 인쇄 ── */
  const [받는중, set받는중] = useState(false)
  const 엑셀받기 = async () => {
    set받는중(true)
    try {
      const { writeWorkbook, ST } = await import('../lib/qtoxlsx.js')
      const bytes = 엑셀(공사, 결과, writeWorkbook, ST)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      a.download = '골조수량산출서_' + (공사.이름 || '현장').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30) + '.xlsx'
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 60000)
      askAfter('jeoksan')
    } finally { set받는중(false) }
  }

  const 표이름 = { 보: '1. 보', 보강: '보강', 기둥: '2. 기둥', 슬라브: '3. 슬라브', 옹벽: '4. 옹벽', 계단: '5. 계단', 기초: '6. 기초', 보강근: '보강근' }
  const 합 = (항목) => 결과.집계.합.filter((x) => x.항목 === 항목).reduce((s, x) => s + x.산출, 0)

  return (
    <div className="wrap gg">
      <div className="card no-print">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🏗 골조 수량산출 <span className="count">· 도면에서 찍어 재기</span></h1>
        <div className="note sm">
          <b>치수를 손으로 옮겨 적지 않습니다.</b> 표의 칸을 누르고 <b>도면의 선·치수·글자를 누르면</b> 값이 들어갑니다.
          배근표와 주자료(골조산출양식 칸 그대로)로 <b>콘크리트 · 거푸집 · 철근</b>까지 층별·부재별로 셉니다.
        </div>
        <div className="pdfsafe">🔒 <b>도면은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 읽고 셉니다 · 회원가입 없음 · 무료</div>
        <div className="btn-row gg-top">
          <button type="button" className="btn sm" onClick={() => 파일칸.current?.click()}>📂 도면 열기 (DXF·DWG)</button>
          <button type="button" className="btn line sm" onClick={() => (비었나 ? 예시열기() : set예시묻기(true))}>🧪 예시로 해 보기</button>
          <button type="button" className="btn ghost sm" onClick={() => set탭('결과')}>📊 결과 보기</button>
          {!비었나 && <button type="button" className="btn ghost sm" onClick={() => set지울까(true)}>🗑 새로 시작</button>}
        </div>
        {지울까 && (
          <div className="gg-ask">
            적은 것(배근표·주자료·개요)을 모두 지우고 새로 시작할까요? 도면은 그대로 둡니다.
            <button type="button" className="btn sm" onClick={() => { set공사(새공사()); set지울까(false); set탭('개요'); set선택(null) }}>예, 지우기</button>
            <button type="button" className="btn ghost sm" onClick={() => set지울까(false)}>아니오</button>
          </div>
        )}
        {예시묻기 && (
          <div className="gg-ask">
            지금 적은 것을 지우고 예시(가상 구조평면도)를 불러올까요?
            <button type="button" className="btn sm" onClick={예시열기}>예, 불러오기</button>
            <button type="button" className="btn ghost sm" onClick={() => set예시묻기(false)}>아니오</button>
          </div>
        )}
        <input ref={파일칸} type="file" accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1}
               onChange={(e) => { 파일받기(e.target.files); e.target.value = '' }} />
        {도면상태.k === 'busy' && (
          <div className="dx3-bar" aria-live="polite"><div className="dx3-bar-in" style={{ width: Math.round((도면상태.p || 0) * 100) + '%' }} /><span>{도면상태.msg} …</span></div>
        )}
        {도면상태.k === 'err' && <div className="dx3-err">{도면상태.글}</div>}
      </div>

      <div className="tp-tabs no-print" role="tablist">
        {[['개요', '① 개요'], ['배', '② 배근표'], ['주', '③ 주자료'], ['결과', '④ 결과']].map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'tp-tab' + (탭 === k ? ' on' : '')} onClick={() => { set탭(k); set선택(null) }}>{t}</button>
        ))}
      </div>

      {(탭 === '주' || 탭 === '배') && (
        <도면판 모델={모델} 이름={도면이름} 끈층={끈층} set끈층={set끈층} 강조={강조} 단위={단위} set단위={set단위}
          찍었다={찍었다} 두점={두점} set두점={set두점} 두점찍었다={두점찍었다} set보는중={set보는중}
          선택={선택} 선택종류={선택종류} 알림={알림} 열기={() => 파일칸.current?.click()} 층보기={층보기} set층보기={set층보기} />
      )}

      {탭 === '개요' && <개요 공사={공사} set공사={set공사} 기준고치기={기준고치기} />}

      {탭 === '배' && (
        <div className="card no-print">
          <div className="tp-subtabs">
            {Object.keys(배근칸).map((k) => (
              <button key={k} type="button" className={'chip' + (배표 === k ? ' on' : '')} onClick={() => { set배표(k); set선택(null) }}>
                {k} <span className="gg-n">{(공사.배근[k] || []).length}</span></button>
            ))}
          </div>
          <p className="muted gg-hint">부재 기호마다 한 줄. 구조도면의 <b>부재 일람표(보 리스트·기둥 리스트…)</b>를 옮겨 적습니다 — 크기 칸은 도면의 치수를, 철근 칸은 도면의 글자(예: 4-HD22, HD10@150)를 눌러도 됩니다. 크기는 <b>mm</b>.</p>
          <편집표 판="배" 이름={배표} 칸들={배근칸[배표].map(([h, key, 보기]) => [h, key, 보기])} 줄={줄들('배', 배표)}
            셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} />
        </div>
      )}

      {탭 === '주' && (
        <div className="card no-print">
          <div className="tp-subtabs">
            {양식차례.map(([k]) => (
              <button key={k} type="button" className={'chip' + (표 === k ? ' on' : '')} onClick={() => { set표(k); set선택(null) }}>
                {표이름[k]} <span className="gg-n">{(공사.주자료[k] || []).length}</span></button>
            ))}
          </div>
          <주자료도움 표={표} />
          <편집표 판="주" 이름={표} 칸들={양식[표].map(([h, key]) => [h, key, ''])} 줄={줄들('주', 표)}
            셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 경고={결과.경고.filter((w) => w.곳 && w.곳.표 === 표)} />
        </div>
      )}

      {탭 === '결과' && (
        <결과판 공사={공사} 결과={결과} 합={합} 엑셀받기={엑셀받기} 받는중={받는중} 가기={(곳) => { if (곳) { set탭('주'); set표(곳.표); set선택(null) } }} />
      )}

      <div className="card no-print">
        <div className="detail-h">알아 두실 것</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.85 }}>
          <li><b>층</b>: n층 = n층의 기둥·벽·계단 + 그 위 바닥(보·슬라브). 맨 아래 바닥·기초는 <b>FT</b> 층입니다.</li>
          <li><b>보 길이·슬라브 단변/장변은 «기둥·보 가운데(통심)» 까지</b> — 보는 좌단·우단(기둥·보 기호나 mm)을 빼서 안목으로 셉니다.</li>
          <li><b>정착·이음 길이</b>는 KDS 14 20 52 기본식으로 채워 두었습니다. 도면 «일반구조사항» 표가 있으면 ① 개요에서 그 값으로 고치십시오 — 그것이 맞습니다.</li>
          <li>할증(이형철근 3% · 레미콘 1%)은 집계에서 따로 보여 드립니다. 산출서의 수량에는 넣지 않습니다.</li>
          <li><b>도면은 사람이 읽습니다.</b> 무엇을 누를지는 사람이 정하고, 프로그램은 누른 것의 값만 정확히 옮깁니다. 결과의 <b>검산</b>을 꼭 보십시오.</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <Link className="btn ghost sm" to="/jeoksan/run">🧮 수량산출서 만들기 (재료표 방식)</Link>
          <Link className="btn ghost sm" to="/tools/dwgdxf">🔁 DWG → DXF</Link>
          <Link className="btn ghost sm" to="/tools/dxfpdf">📄 도면 PDF</Link>
          <Link className="btn ghost sm" to="/tools">🧰 도구 모두</Link>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────── 주자료 칸 설명 */
function 주자료도움({ 표 }) {
  const t = {
    보: <>한 줄 = 보 한 칸(스팬). <b>길이</b>는 통심 사이, <b>좌단·우단</b>은 받치는 기둥·보 기호(또는 뺄 mm). <b>열</b>: 이어진 보의 처음 줄에 열 이름(예: Y1), 끝 줄에 <b>E</b> — 그 사이는 주근이 이어지는 것으로, 처음·끝만 정착합니다. <b>S-THK</b> 비우면 층의 슬라브 두께.</>,
    기둥: <>한 줄 = 같은 기둥 몇 개(<b>QT</b>). <b>높이</b> 비우면 층고. <b>연결기둥</b>: 위층 기둥 기호(이음) · A/R(최상층 정착). <b>F-THK</b>: 기초 두께(주근이 기초로 들어감). <b>내림</b>: 맨 아래층에서 기초 위까지 더 내려가는 높이.</>,
    슬라브: <>한 줄 = 같은 판 몇 개. <b>단변·장변</b>은 보 가운데(통심)까지. <b>정착</b>: 그 방향 철근이 정착하는 변의 수(0·1·2). 개구부 면적(m²)은 콘크리트만 뺍니다.</>,
    옹벽: <><b>길이</b>는 가운데까지, <b>높이</b> 비우면 층고. <b>상부</b>: 위의 보 기호나 뺄 mm. <b>단부</b>: 양 끝에서 뺄 길이 합. <b>X정착</b>: 수평근 정착 변 수. <b>상부이음</b>: 1·2(이음 수) · A(정착) · A1·A2 · R. <b>OPEN</b>: 「900x2100」(개수는 *2). 두 번째 <b>F</b>를 비우면 한 면만.</>,
    계단: <>한 층 = 되돌림 계단(두 번 꺾어 오름)으로 셉니다. <b>단수</b>: 한 쪽 단수 · <b>계단길이</b>: 한 쪽 수평 길이 · <b>계단폭</b>: 한 쪽 폭 · <b>참</b>: 하단·상단(하나만 적으면 둘 다 같게).</>,
    기초: <>배근표의 종류(독립·줄·MAT)에 따라 씁니다. 줄기초는 <b>줄기초 길이</b>, MAT 은 <b>단변·장변</b>. <b>형틀공제</b>: 붙은 기초와 맞닿은 길이. <b>추가(%)</b>: 슬라브 두께×기초 면적×%.</>,
    보강: <><b>부재</b>에 「B-콘크리트」「S-거푸집」「W-D13」처럼 적고(앞 글자 B 보·C 기둥·S 슬라브·W 벽·T 계단·F 기초), <b>산출식</b>은 m 단위 식(철근은 길이 m).</>,
    보강근: <>개구부 보강근. 배근표 «보강근» 의 기호와 개구부 <b>가로·세로</b>(mm).</>,
  }[표]
  return <p className="muted gg-hint">{t}</p>
}

/* ───────────────────────────── 고치는 표 */
function 편집표({ 판, 이름, 칸들, 줄, 셀, 칸쓰기, 줄더하기, 줄빼기, 경고 }) {
  const 경고줄 = new Map()
  for (const w of 경고 || []) { const a = 경고줄.get(w.곳.i) || []; a.push(w.글); 경고줄.set(w.곳.i, a) }
  const 숫자칸 = (key) => 길이칸.has(key) || 개수칸.has(key) || 면적칸.has(key) || ['추가', 'X정착', '단변정착', '장변정착', 'L정착', 'W정착'].includes(key)
  return (
    <>
      <div className="gg-wrap">
        <table className="gg-t">
          <thead><tr><th>No.</th>{칸들.map(([h, key]) => <th key={key} title={칸종류(key, 판) ? '도면에서 받음: ' + 칸종류(key, 판) : '직접 적음'}>{h.replace(/\s+/g, ' ')}{칸종류(key, 판) ? <i className="gg-pk">●</i> : null}</th>)}<th /></tr></thead>
          <tbody>
            {줄.map((r, i) => (
              <tr key={i} className={경고줄.has(i) ? 'warn' : ''} title={경고줄.has(i) ? 경고줄.get(i).join(' / ') : ''}>
                <td className="gg-no">{i + 1}</td>
                {칸들.map(([, key, 보기]) => {
                  const c = 셀(판, 이름, i, key)
                  const 찍 = r._찍음 && r._찍음[key] && r._찍음[key].length
                  return (
                    <td key={key} className={(c.on ? 'on ' : '') + (찍 ? 'pk ' : '') + (숫자칸(key) ? 'n' : '')}>
                      <input value={r[key] ?? ''} placeholder={보기 || ''} onFocus={c.누름} onClick={c.누름}
                        onChange={(e) => 칸쓰기(판, 이름, i, key, e.target.value, undefined)}
                        inputMode={숫자칸(key) ? 'decimal' : undefined} aria-label={이름 + ' ' + (i + 1) + '번 줄 ' + key} />
                    </td>
                  )
                })}
                <td className="gg-x"><button type="button" title="이 줄 지우기" onClick={() => 줄빼기(판, 이름, i)}>✕</button></td>
              </tr>
            ))}
            {!줄.length && <tr><td colSpan={칸들.length + 2} className="gg-empty">아직 없습니다 — 아래 «＋ 줄» 을 누르십시오.</td></tr>}
          </tbody>
        </table>
      </div>
      {경고 && 경고.length > 0 && <ul className="gg-warns">{경고.slice(0, 12).map((w, k) => <li key={k}>⚠️ {w.곳.i + 1}번 줄 — {w.글}</li>)}</ul>}
      <div className="btn-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn sm" onClick={() => 줄더하기(판, 이름, false)}>＋ 줄</button>
        {줄.length > 0 && <button type="button" className="btn line sm" onClick={() => 줄더하기(판, 이름, true)}>＋ 앞 줄처럼 (기호·조건 복사)</button>}
      </div>
    </>
  )
}

/* ───────────────────────────── 도면판 */
function 도면판({ 모델, 이름, 끈층, set끈층, 강조, 단위, set단위, 찍었다, 두점, set두점, 두점찍었다, set보는중, 선택, 선택종류, 알림, 열기, 층보기, set층보기 }) {
  const boxRef = useRef(null)
  const cvRef = useRef(null)
  const view = useRef(null)
  const [크기, set크기] = useState({ w: 800, h: 480 })
  const [글꼴, set글꼴] = useState(false)
  const 길들 = useMemo(() => (모델 ? 길만들기(모델) : null), [모델])
  const 틀 = useRef(0)
  const 누름 = useRef(null)
  const 손가락 = useRef(new Map())
  const [표시, set표시] = useState('')
  const [접힘, set접힘] = useState(false)

  useEffect(() => { loadFont().then(set글꼴) }, [])
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const f = () => { const w = el.clientWidth - (el.clientWidth < 600 ? 16 : 20); const 폰 = w < 600; set크기({ w: Math.max(200, w), h: Math.max(200, Math.min(Math.round(window.innerHeight * (폰 ? 0.3 : 0.42)), 폰 ? 300 : 460)) }) }
    f()
    const ro = new ResizeObserver(f)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  useEffect(() => { if (모델) view.current = 전체보기(모델, 크기.w, 크기.h) }, [모델])  // eslint-disable-line react-hooks/exhaustive-deps

  const 다시 = useCallback(() => {
    cancelAnimationFrame(틀.current)
    틀.current = requestAnimationFrame(() => {
      const cv = cvRef.current
      if (!cv) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (cv.width !== Math.round(크기.w * dpr) || cv.height !== Math.round(크기.h * dpr)) { cv.width = Math.round(크기.w * dpr); cv.height = Math.round(크기.h * dpr) }
      const ctx = cv.getContext('2d')
      if (모델 && !view.current) view.current = 전체보기(모델, 크기.w, 크기.h)
      그리기(ctx, 크기.w, 크기.h, dpr, 모델, 길들 || new Map(), view.current || { s: 1, cx: 0, cy: 0 }, 끈층, 강조, 모델 && 모델.조각표, 글꼴 ? FONT : null)
      if (두점 && 두점.length && view.current) {
        const v = view.current
        const [x, y] = 두점[0]
        ctx.fillStyle = '#f472b6'
        ctx.beginPath(); ctx.arc(크기.w / 2 + (x - v.cx) * v.s, 크기.h / 2 - (y - v.cy) * v.s, 5, 0, Math.PI * 2); ctx.fill()
      }
    })
  }, [모델, 길들, 크기, 끈층, 강조, 글꼴, 두점])
  useEffect(() => { 다시() }, [다시])

  const 도면점 = (ev) => {
    const r = cvRef.current.getBoundingClientRect()
    const v = view.current
    const sx = ev.clientX - r.left, sy = ev.clientY - r.top
    return [v.cx + (sx - 크기.w / 2) / v.s, v.cy - (sy - 크기.h / 2) / v.s, sx, sy]
  }
  const 보이는범위 = () => { const v = view.current; return [v.cx - 크기.w / 2 / v.s, v.cy - 크기.h / 2 / v.s, v.cx + 크기.w / 2 / v.s, v.cy + 크기.h / 2 / v.s] }
  const 확대 = (f, sx = 크기.w / 2, sy = 크기.h / 2) => {
    const v = view.current
    if (!v) return
    const wx = v.cx + (sx - 크기.w / 2) / v.s, wy = v.cy - (sy - 크기.h / 2) / v.s
    const s2 = Math.max(1e-7, Math.min(1e5, v.s * f))
    view.current = { s: s2, cx: wx - (sx - 크기.w / 2) / s2, cy: wy + (sy - 크기.h / 2) / s2 }
    다시()
  }
  const 누른것 = (ev) => {
    if (!모델 || !view.current) return
    const [x, y] = 도면점(ev)
    const tol = 7 / view.current.s
    if (두점 !== null) { 두점찍었다(가까운점(모델, 모델.판, x, y, tol * 1.5)); return }
    const e = 가까운도형(모델, 모델.판, x, y, tol, 끈층)
    찍었다(e, x, y, 보이는범위())
  }
  const 올림 = (ev) => {
    if (!모델 || !view.current || 누름.current) return
    const [x, y] = 도면점(ev)
    const e = 가까운도형(모델, 모델.판, x, y, 7 / view.current.s, 끈층)
    set보는중(e)
    if (e < 0) { set표시(''); return }
    const E = 모델.E, k = (단위 && 단위.k) || 1
    const t = E.t[e]
    let s = 종류이름[t]
    if (t === 종류.치수) s += ' ' + 쉼(E.val[e], 1)
    else if (t === 종류.글자) s += ' «' + 도형글자(모델, e) + '»'
    else if (E.len[e] > 0) s += ' 길이 ' + 쉼(E.len[e] * k, 1) + ' mm'
    if (E.area[e] > 0) s += ' · 면적 ' + 쉼(E.area[e] * k * k / 1e6, 3) + ' m²'
    s += ' · 레이어 ' + 모델.layers[E.ly[e]]?.name
    set표시(s)
  }
  const 내림 = (ev) => {
    if (!모델) return
    cvRef.current.setPointerCapture?.(ev.pointerId)
    손가락.current.set(ev.pointerId, [ev.clientX, ev.clientY])
    누름.current = { x: ev.clientX, y: ev.clientY, v: { ...view.current }, 움직임: false, 두손: 손가락.current.size >= 2 }
  }
  const 움직임 = (ev) => {
    if (!누름.current) { 올림(ev); return }
    const 이전 = 손가락.current.get(ev.pointerId)
    손가락.current.set(ev.pointerId, [ev.clientX, ev.clientY])
    if (손가락.current.size >= 2 && 이전) {
      const pts = [...손가락.current.values()]
      const d1 = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1])
      const other = [...손가락.current.entries()].find(([id]) => id !== ev.pointerId)
      if (other) {
        const d0 = Math.hypot(이전[0] - other[1][0], 이전[1] - other[1][1])
        if (d0 > 0) {
          const r = cvRef.current.getBoundingClientRect()
          확대(d1 / d0, (pts[0][0] + pts[1][0]) / 2 - r.left, (pts[0][1] + pts[1][1]) / 2 - r.top)
        }
      }
      누름.current.움직임 = true
      return
    }
    const dx = ev.clientX - 누름.current.x, dy = ev.clientY - 누름.current.y
    if (!누름.current.움직임 && Math.hypot(dx, dy) < 5) return
    누름.current.움직임 = true
    const v0 = 누름.current.v
    view.current = { ...view.current, cx: v0.cx - dx / v0.s, cy: v0.cy + dy / v0.s }
    다시()
  }
  const 뗌 = (ev) => {
    const n = 누름.current
    손가락.current.delete(ev.pointerId)
    if (손가락.current.size) return
    누름.current = null
    if (n && !n.움직임 && !n.두손) 누른것(ev)
  }
  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const w = (ev) => {
      if (!모델) return
      ev.preventDefault()
      const r = cv.getBoundingClientRect()
      확대(Math.exp(-ev.deltaY * 0.0015), ev.clientX - r.left, ev.clientY - r.top)
    }
    cv.addEventListener('wheel', w, { passive: false })
    return () => cv.removeEventListener('wheel', w)
  })

  const 층목록 = 모델 ? 모델.layers.map((L, i) => ({ ...L, i })) : []
  return (
    <div className={'card gg-draw no-print' + (접힘 ? ' folded' : '')} ref={boxRef}>
      <div className="gg-bar">
        <span className="gg-file">{모델 ? '📐 ' + 이름 : '도면을 여시면 여기에 보입니다'}</span>
        <button type="button" className="chip" onClick={() => set접힘(!접힘)}>{접힘 ? '도면 펴기 ▾' : '도면 접기 ▴'}</button>
        {모델 && !접힘 && (
          <>
            <button type="button" className="chip" onClick={() => { view.current = 전체보기(모델, 크기.w, 크기.h); 다시() }}>전체</button>
            <button type="button" className="chip" onClick={() => 확대(1.6)}>＋</button>
            <button type="button" className="chip" onClick={() => 확대(1 / 1.6)}>－</button>
            <button type="button" className={'chip' + (두점 !== null ? ' on' : '')} onClick={() => set두점(두점 === null ? [] : null)}>📏 두 점</button>
            <button type="button" className={'chip' + (층보기 ? ' on' : '')} onClick={() => set층보기(!층보기)}>레이어 {층목록.length - 끈층.size}/{층목록.length}</button>
            <label className="gg-unit">단위
              <select value={단위 ? 단위.k : 1} onChange={(e) => set단위({ k: +e.target.value, 글: e.target.selectedOptions[0].text })}>
                <option value={1}>mm</option><option value={10}>cm</option><option value={1000}>m</option>
              </select>
            </label>
          </>
        )}
      </div>
      {층보기 && 모델 && (
        <div className="gg-layers">
          {층목록.map((L) => (
            <label key={L.i}><input type="checkbox" checked={!끈층.has(L.i)} onChange={() => { const s = new Set(끈층); if (s.has(L.i)) s.delete(L.i); else s.add(L.i); set끈층(s) }} />
              <i style={{ background: 'rgb(' + L.rgb.join(',') + ')' }} />{L.name}</label>
          ))}
          <button type="button" className="chip" onClick={() => set끈층(new Set())}>모두 켜기</button>
        </div>
      )}
      <div className="gg-cv" style={{ height: 접힘 ? 0 : 크기.h }}>
        <canvas ref={cvRef} style={{ width: 크기.w, height: 크기.h, touchAction: 'none' }}
          onPointerDown={내림} onPointerMove={움직임} onPointerUp={뗌} onPointerCancel={뗌} onPointerLeave={() => { set보는중(null); set표시('') }} />
        {!모델 && (
          <div className="gg-empty-draw">
            <button type="button" className="btn sm" onClick={열기}>📂 도면 열기 (DXF·DWG)</button>
            <div className="muted">구조평면도·일람표가 있는 도면을 여세요. 도면 없이 표에 직접 적어도 됩니다.</div>
          </div>
        )}
        {표시 && <div className="gg-tip">{표시}</div>}
      </div>
      <div className={'gg-say' + (알림 ? ' warn' : '')}>
        {알림 || (선택 ? (선택종류
          ? <>👉 <b>{선택.표} {선택.i + 1}번 줄 «{선택.key}»</b> — {도움[선택종류]} {두점 !== null ? ' 📏 두 점 재기: 점 두 개를 누르십시오.' : ''}</>
          : <>«{선택.key}» 칸은 도면에서 받지 않습니다 — 직접 적어 주십시오.</>)
          : <>아래 표에서 채울 칸을 누른 뒤, 도면을 누르십시오. <span className="muted">(끌면 옮기기 · 휠·두 손가락 = 확대)</span></>)}
      </div>
    </div>
  )
}

/* ───────────────────────────── 개요 */
function 개요({ 공사, set공사, 기준고치기 }) {
  const 기 = 공사.기준
  const 층고치기 = (i, key, v) => set공사((P) => { const 층 = [...P.층]; 층[i] = { ...층[i], [key]: key === '이름' ? v : v }; return { ...P, 층 } })
  const 층더하기 = () => set공사((P) => ({ ...P, 층: [...P.층, { 이름: '', 층고: 3300, 슬라브: 150 }] }))
  const 층빼기 = (i) => set공사((P) => ({ ...P, 층: P.층.filter((_, j) => j !== i) }))
  const 강도바꿈 = (key, v) => 기준고치기((b) => { b[key] = v; const fck = +b.fck, fy = +b.fy; if (fck > 0 && fy > 0) b.정착 = 정착표(fck, fy); return b })
  const 정고치기 = (d, key, v) => 기준고치기((b) => ({ ...b, 정착: { ...b.정착, [d]: { ...b.정착[d], [key]: +v || 0 } } }))
  const 기본값 = 기준값()
  return (
    <div className="card no-print">
      <div className="gg-row">
        <label className="gg-f wide">공사 이름<input value={공사.이름 || ''} placeholder="예: ○○동 신축공사 (결과에 적힙니다)" onChange={(e) => set공사((P) => ({ ...P, 이름: e.target.value }))} /></label>
      </div>
      <div className="detail-h" style={{ marginTop: 14 }}>층 — 아래에서 위로 (층고·슬라브 두께 mm)</div>
      <p className="muted gg-hint">n층 줄의 슬라브 두께 = n층에서 치는 «그 위 바닥» 의 두께. 기둥·벽 높이·보 춤에서 뺍니다. 맨 아래 바닥·기초는 FT.</p>
      <div className="gg-wrap">
        <table className="gg-t"><thead><tr><th>층</th><th>층고</th><th>슬라브 두께</th><th /></tr></thead>
          <tbody>
            {공사.층.map((f, i) => (
              <tr key={i}>
                <td><input value={f.이름} onChange={(e) => 층고치기(i, '이름', e.target.value)} /></td>
                <td className="n"><input value={f.층고} inputMode="decimal" onChange={(e) => 층고치기(i, '층고', e.target.value)} /></td>
                <td className="n"><input value={f.슬라브} inputMode="decimal" onChange={(e) => 층고치기(i, '슬라브', e.target.value)} /></td>
                <td className="gg-x"><button type="button" onClick={() => 층빼기(i)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn sm" style={{ marginTop: 8 }} onClick={층더하기}>＋ 층</button>

      <div className="detail-h" style={{ marginTop: 18 }}>기준값 — 고쳐 쓰는 칸</div>
      <div className="gg-grid">
        <label className="gg-f">콘크리트 fck (MPa)<input value={기.fck} inputMode="decimal" onChange={(e) => 강도바꿈('fck', e.target.value)} /></label>
        <label className="gg-f">철근 fy (MPa)<input value={기.fy} inputMode="decimal" onChange={(e) => 강도바꿈('fy', e.target.value)} /></label>
        <label className="gg-f">기본 콘크리트<input value={기.콘크리트} onChange={(e) => 기준고치기((b) => ({ ...b, 콘크리트: e.target.value }))} /></label>
        <label className="gg-f">기본 거푸집<input value={기.거푸집} onChange={(e) => 기준고치기((b) => ({ ...b, 거푸집: e.target.value }))} /></label>
        <label className="gg-f">정척 (mm)<input value={기.정척} inputMode="decimal" onChange={(e) => 기준고치기((b) => ({ ...b, 정척: +e.target.value || 0 }))} /></label>
        <label className="gg-f">늑근·대근 갈고리 (d 배)<input value={기.갈고리} inputMode="decimal" onChange={(e) => 기준고치기((b) => ({ ...b, 갈고리: +e.target.value || 0 }))} /></label>
        <label className="gg-f">기둥 주근 기초 속 꺾음 (d 배)<input value={기.기초갈고리} inputMode="decimal" onChange={(e) => 기준고치기((b) => ({ ...b, 기초갈고리: +e.target.value || 0 }))} /></label>
        <label className="gg-f">수량 소수 자리<input value={기.자리} inputMode="numeric" onChange={(e) => 기준고치기((b) => ({ ...b, 자리: +e.target.value || 0 }))} /></label>
      </div>
      <div className="detail-h" style={{ marginTop: 12 }}>피복 두께 (mm)</div>
      <div className="gg-grid">
        {Object.keys(기본값.피복).map((k) => (
          <label key={k} className="gg-f">{k}<input value={(기.피복 || {})[k] ?? ''} inputMode="decimal" onChange={(e) => 기준고치기((b) => ({ ...b, 피복: { ...b.피복, [k]: +e.target.value || 0 } }))} /></label>
        ))}
      </div>
      <p className="muted gg-hint">기본값: KDS 14 20 50 — 흙에 접하지 않는 보·기둥 40, 슬래브·벽 20, 흙에 묻힌 기초 75.</p>
      <div className="detail-h" style={{ marginTop: 12 }}>할증 (%) — 집계에서 따로 보임</div>
      <div className="gg-grid">
        {Object.keys(기본값.할증).map((k) => (
          <label key={k} className="gg-f">{k}<input value={(기.할증 || {})[k] ?? ''} inputMode="decimal" onChange={(e) => 기준고치기((b) => ({ ...b, 할증: { ...b.할증, [k]: +e.target.value || 0 } }))} /></label>
        ))}
      </div>
      <p className="muted gg-hint">기본값: 건설공사 표준품셈의 재료 할증 — 이형철근 3%, 레미콘(철근구조물) 1%.</p>
      <div className="detail-h" style={{ marginTop: 12 }}>정착·이음 길이 (mm)</div>
      <p className="muted gg-hint">fck·fy 를 바꾸면 KDS 14 20 52 기본식으로 다시 채웁니다(인장 정착 0.6·d·fy/√fck, 상부 ×1.3, 인장 이음 B급 ×1.3, 압축 이음 0.072·fy·d). <b>도면 일반구조사항에 표가 있으면 그 값으로 고치십시오.</b></p>
      <div className="gg-wrap">
        <table className="gg-t"><thead><tr><th>규격</th><th>인장 정착</th><th>상부 정착</th><th>압축 정착</th><th>인장 이음</th><th>압축 이음</th></tr></thead>
          <tbody>
            {규격들.slice(0, 9).map((d) => (
              <tr key={d}><td>{d}</td>
                {['인장정착', '상부정착', '압축정착', '인장이음', '압축이음'].map((k) => (
                  <td key={k} className="n"><input value={((기.정착 || {})[d] || {})[k] ?? ''} inputMode="numeric" onChange={(e) => 정고치기(d, k, e.target.value)} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn ghost sm" onClick={() => 기준고치기((b) => ({ ...b, 정착: 정착표(+b.fck || 24, +b.fy || 400) }))}>정착·이음 표 기본식으로 다시</button>
      </div>
    </div>
  )
}

/* ───────────────────────────── 결과 */
function 결과판({ 공사, 결과, 합, 엑셀받기, 받는중, 가기 }) {
  const [보기, set보기] = useState('집계')
  const 부재들 = [...new Set(결과.줄.map((x) => x.부재))]
  return (
    <div className="card gg-print">
      <div className="gg-head">
        <div>
          <div className="detail-h" style={{ margin: 0 }}>골조 수량산출서{공사.이름 ? ' — ' + 공사.이름 : ''}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>K-건설맵 골조 수량산출 · 산출근거는 m 단위 숫자식 · 할증은 집계에만</div>
        </div>
        <div className="btn-row no-print" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" disabled={!결과.줄.length || 받는중} onClick={엑셀받기}>{받는중 ? '만드는 중…' : '⬇ 엑셀 받기'}</button>
          <button type="button" className="btn line sm" disabled={!결과.줄.length} onClick={() => window.print()}>🖨 인쇄</button>
        </div>
      </div>
      <div className="gg-tiles">
        <div><span>콘크리트</span><b>{쉼(합('콘크리트'), 2)}</b> m³</div>
        <div><span>거푸집</span><b>{쉼(합('거푸집'), 2)}</b> m²</div>
        <div><span>철근</span><b>{쉼(합('철근'), 3)}</b> ton</div>
        <div className={결과.경고.length ? 'bad' : 'good'}><span>검산</span><b>{결과.경고.length}</b> 건</div>
      </div>
      {결과.경고.length > 0 && (
        <div className="gg-check">
          <div className="detail-h">⚠️ 검산 — 셈에서 빠졌거나 확인할 것</div>
          <ul>{결과.경고.map((w, k) => <li key={k}>{w.곳 ? <button type="button" className="gg-go no-print" onClick={() => 가기(w.곳)}>{w.곳.표} {w.곳.i + 1}번 줄</button> : null} {w.글}</li>)}</ul>
        </div>
      )}
      <div className="tp-subtabs no-print">
        {['집계', '층별 부재별', '산출서'].map((k) => <button key={k} type="button" className={'chip' + (보기 === k ? ' on' : '')} onClick={() => set보기(k)}>{k}</button>)}
      </div>
      {!결과.줄.length && <p className="muted">아직 셀 것이 없습니다 — ② 배근표와 ③ 주자료를 채우십시오. (🧪 예시로 해 보기를 누르면 채워진 것을 볼 수 있습니다)</p>}
      {결과.줄.length > 0 && (
        <div className={'gg-sec' + (보기 === '집계' ? '' : ' gg-hide')}>
          <div className="detail-h">집계</div>
          <div className="gg-wrap"><table className="gg-r">
            <thead><tr><th>항목</th><th>규격</th><th>단위</th><th>산출수량</th><th>할증</th><th>할증 포함</th></tr></thead>
            <tbody>{결과.집계.합.map((x, k) => (
              <tr key={k}><td>{x.항목}</td><td>{x.규격}</td><td>{x.단위}</td><td className="r">{쉼(x.산출, 3)}</td><td className="r">{x.할증}%</td><td className="r"><b>{쉼(x.내역, 3)}</b></td></tr>
            ))}</tbody>
          </table></div>
        </div>
      )}
      {결과.줄.length > 0 && (
        <div className={'gg-sec' + (보기 === '층별 부재별' ? '' : ' gg-hide')}><div className="detail-h">층별 부재별</div><div className="gg-wrap"><table className="gg-r">
          <thead><tr><th>층</th><th>부재</th><th>항목</th><th>규격</th><th>단위</th><th>수량</th></tr></thead>
          <tbody>{결과.집계.층부재.map((x, k) => (
            <tr key={k}><td>{x.층}</td><td>{x.부재}</td><td>{x.항목}</td><td>{x.규격}</td><td>{x.단위}</td><td className="r">{쉼(x.수량, 3)}</td></tr>
          ))}</tbody>
        </table></div></div>
      )}
      {부재들.map((부재) => (
        <div key={부재} className={'gg-sec' + (보기 === '산출서' ? '' : ' gg-hide')}>
          <div className="detail-h">산출서 — {부재}</div>
          <div className="gg-wrap"><table className="gg-r gg-calc">
            <thead><tr><th>층</th><th>기호</th><th>항목</th><th>규격</th><th>산출근거</th><th>수량</th><th>단위</th><th>비고</th></tr></thead>
            <tbody>{결과.줄.filter((x) => x.부재 === 부재).map((x, k) => (
              <tr key={k} className={x.수량 < 0 ? 'neg' : ''}><td>{x.층}</td><td>{x.기호}</td><td>{x.항목}</td><td>{x.규격}</td><td className="expr">{x.식}</td><td className="r">{쉼(x.수량, 3)}</td><td>{x.단위}</td><td className="note2">{x.비고}</td></tr>
            ))}</tbody>
          </table></div>
        </div>
      ))}
    </div>
  )
}
