/**
 * /jeoksan/golgo — 🏗 골조 수량산출 · 도면에서 찍어 재기 (2026-09-26)
 *
 * 소장님: 「이 방식을 이용해서 수량 산출서 만드는 프로그램 만들어 줘. 잰 치수 빼고」
 *         → 「사이트에, 모두 무료」 · 「수량산출서에 필요한 모든 것」
 *
 * ■ 흐름: ① 개요(동·층·기준값·산출 옵션) → ② 배근표(부재 기호마다) → ③ 주자료(골조산출양식 칸 그대로 · 동마다)
 *         → unit(수평·수직 묶음) → ④ 결과(산출서·집계(층·동·공구·유형·구획)·분석·당초 대비·검산 · 엑셀 · 인쇄)
 * ■ 2026-09-27 「빠진 기능까지 다」: 동(여러 동·공구·유형·연면적·Typical 같은 동·동 복사·동마다 층) · 층 복사(기호 옮김)·중간층 ·
 *   배근 기호 연속 표기(1-RG1)·적용 동 · 철근 넣는 꼴 5가지 · 부재 종류(헌치·캔틸레버·트랙·다각·데크·파라펫·헌치 기초…) ·
 *   Dry Area(양식 밖 표) · 산출 옵션(40D) · 규격별 할증 · 층 둘레 → S-EDGE · unit · 구획(양식 밖 칸) · 연면적 분석 · 당초 대비
 * ⚠️ 저장 모양이 바뀌었습니다(공사.주자료 → 공사.동[…].주자료). 옛 저장은 lib 의 정리() 로 옮겨 읽습니다 — 지우지 마십시오.
 * ■ «잰 치수 빼기»: 표의 칸을 누르고 도면을 누르면 값이 들어갑니다.
 *     선·호·폴리선 → 길이(여러 번 누르면 합) · 치수선 → 치수 값 · 글자 → 기호 · 닫힌 선 안 → 면적
 *     QT 칸에서 글자(예: C1)를 누르면 «지금 보이는 화면 안» 같은 글자 수를 셉니다.
 *   줄마다 «어디서 찍었나» 를 남겨, 칸을 다시 누르면 그 선이 노랗게 빛납니다(검산).
 * ■ 도면·자료는 이 브라우저 안에만 있습니다(적은 것: localStorage · 도면: IndexedDB). 서버로 가지 않습니다.
 * ■ 셈: lib/골조.js (시험: node tools/시험_골조.mjs) · 도면 읽기: lib/골조도면.js · 그리기: lib/골조그림.js
 * ■ 예시 도면 web/public/jeoksan/골조_예시.dxf 는 K-건설맵이 그린 «가상» 구조평면도입니다(tools/골조_예시도면.py).
 * ■ ⚡ 2026-09-27 밤 «도면 넣으면 자동» (lib/골조자동.js) — 소장님: 「적산에서 왜 골조 물량을 찍어야 된다고 했지?.
 *   도면만 주면 스스로 물량을 내는 거잖아」 「물량은 자동으로 뽑아서 엑셀로 다운 받을 수 있게 해줘」
 *   구조평면도 + 부재 일람표를 넣으면(여러 장·끌어 놓기도) 배근표·주자료·층을 스스로 채우고 ④ 결과로 — 찍기는 고칠 때만.
 *   🧪 예시도 자동 예시(골조자동_예시.dxf — tools/골조자동_예시도면.py 로 그린 가상 2층 라멘조)로 바꿈. 예시공사() 는 시험이 씀
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 셈, 새공사, 새동, 정리, 양식, 양식차례, 배근칸, 배근고르기, 정착표, 규격들, 기준값, 옵션이름, 층복사, 층범위, 비교, 엑셀 } from '../lib/골조.js'
import { 품은도형, 도형글자, 종류, 종류이름 } from '../lib/골조도면.js'
import { use도면, 도면판, 도면상태줄, 도면읽어오기, 큰파일, 오류글 } from '../도면판.jsx'
import { 단위배율 } from '../lib/골조도면.js'
import { 골조읽기, 개수글 } from '../lib/골조자동.js'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { askAfter } from '../AskComment'
import { use화면상태 } from '../lib/길기록.js'

import { 단위보기, 단위풀이 } from '../lib/단위.js'
const 저장열쇠 = 'kcm.golgo.v1'
const 도면열쇠 = '골조도면'
const 자동예시 = ['/jeoksan/골조자동_예시.dxf', '골조자동_예시.dxf (가상 2층 라멘조 구조도)']

/* 칸마다 «도면에서 무엇을 받나» */
const 길이칸 = new Set(['길이', '좌단', '우단', 'S', '높이', '내림', 'FT', '단변', '장변', '하부', '상부', '단부', '폭', '하단참', '상단참', '줄기초', 'MAT단변', 'MAT장변', '형틀공제', '단부공제', '가로', '세로', '춤', '지름', '두께', '헌치높이', '헌치길이', '끝춤', '한변', '윗가로', '윗세로'])
const 기호도칸 = new Set(['좌단', '우단', 'S', 'FT', '상부', '하부'])
const 글자칸 = new Set(['층', '열', '기호', '연결', '주근', '대근단부', '대근중앙', '늑근단부', '늑근중앙', '부근', '단변하부', '단변상부', '장변하부', '장변상부', '수직', '수평', '배력근', '하부가로', '하부세로', '상부가로', '상부세로', '가로근', '세로근', '사선근', '종류', '배근', '상부꼴', '동', '부재', '상부추가', '하부추가', '보조늑근', '지지근', '데크', '단부보강', '상부보강', '단부전단', '참주근', '참배력근', '_구획'])
const 면적칸 = new Set(['개구부', '면적'])
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
    if (!p || !p.배근 || !(p.주자료 || Array.isArray(p.동))) return null
    const 빈 = 새공사()
    const 기0 = p.기준 || {}
    const q = { ...빈, ...p, 기준: { ...빈.기준, ...기0, 피복: { ...빈.기준.피복, ...(기0.피복 || {}) }, 할증: { ...빈.기준.할증, ...(기0.할증 || {}) }, 옵션: { ...빈.기준.옵션, ...(기0.옵션 || {}) }, 할증규격: { ...(기0.할증규격 || {}) } }, 배근: { ...빈.배근, ...p.배근 } }
    if (!Array.isArray(p.동) || !p.동.length) delete q.동     // 옛 모양(주자료 하나) → 정리() 가 동[0] 으로 옮김
    return 정리(q)
  } catch (e) { return null }
}

export default function Golgo() {
  const [공사, set공사] = useState(() => 불러오기() || 새공사())
  /* 🧭 2026-09-27 — 탭을 바꾸면 기록이 한 칸 쌓입니다 → 휴대폰 뒤로가기 = 앞 탭 (예전엔 도구 밖으로 나갔습니다) */
  const [처음탭] = useState(() => (불러오기() ? '주' : '개요'))
  const [탭, set탭] = use화면상태('탭', 처음탭)
  const [표, set표] = useState('보')
  const [배표, set배표] = useState('보')
  const [동i, set동i] = useState(0)
  const [유k, set유k] = useState(0)
  const [선택, set선택] = useState(null)          // {판:'주'|'배'|'유', 표, i, key}
  /* 도면은 도면판.jsx 가 쥡니다 (골조·치수표·마감·자동이 같이 씀) */
  const 도 = use도면(도면열쇠)
  const { 모델, 도면이름, 끈층, 단위, 도면열기, 파일받기 } = 도
  const [두점, set두점] = useState(null)          // null | [] | [[x,y]]
  const [알림, set알림] = useState('')
  const [예시묻기, set예시묻기] = useState(false)
  const [지울까, set지울까] = useState(false)
  const [보는중, set보는중] = useState(null)       // 마우스 올린 도형
  const 파일칸 = useRef(null)
  const 자동칸 = useRef(null)
  const [자동, set자동] = useState(null)           // ⚡ 도면에서 읽은 것 {R, 도면:[{이름, buf}], 묻기} — 적은 것이 있으면 바꿀지 여쭘
  const [자동상태, set자동상태] = useState({ k: 'idle' })

  /* 저장 */
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(저장열쇠, JSON.stringify(공사)) } catch (e) { /* 가득 참·사생활 모드 */ } }, 400)
    return () => clearTimeout(t)
  }, [공사])

  const 결과 = useMemo(() => { try { return 셈(공사) } catch (e) { return { 줄: [], 경고: [{ 글: '셈하다 멈췄습니다: ' + e.message }], 집계: { 합: [], 층부재: [], 층들: [], 동들: [], 층별: [], 동별: [], 층동: [], 공구별: [], 유형별: [], 구획별: [], 분석: [] }, 기: 공사.기준 } } }, [공사])

  const 동k = Math.max(0, Math.min(동i, 공사.동.length - 1))
  const 지금동 = 공사.동[동k]
  const 동이름 = (d, k) => (d && String(d.이름 || '').trim()) || (공사.동.length > 1 ? (k + 1) + '번째 동' : '')
  const 유닛 = 공사.유닛 || []
  const 유kk = Math.max(0, Math.min(유k, 유닛.length - 1))

  /* ⚡ 도면 넣으면 자동 — 넣은 도면(여러 장)을 모두 읽어 배근표·주자료·층을 채웁니다 */
  const 자동읽기 = async (목록, 묻지않음 = false) => {
    const 도면들 = [], 남김 = []
    let 틀림 = ''
    for (const { 이름, buf } of 목록) {
      set자동상태({ k: 'busy', msg: 이름 + ' 읽는 중', p: 0 })
      try {
        const 사본 = buf.slice(0)
        const { 모델: M } = await 도면읽어오기(buf, 이름, (st) => set자동상태({ k: 'busy', msg: 이름 + ' — ' + st.msg, p: st.p }))
        도면들.push({ 모델: M, 이름, k: 단위배율(M.units, M.box).k || 1 })
        남김.push({ 이름, buf: 사본 })
      } catch (e) { 틀림 += 이름 + ' — ' + 오류글(e.kind || 'fail', e.message) + ' ' }
    }
    if (!도면들.length) { set자동상태({ k: 'err', 글: 틀림.trim() || '도면을 읽지 못했습니다' }); return }
    let R
    try { R = 골조읽기(도면들) } catch (e) { set자동상태({ k: 'err', 글: '도면에서 골조를 읽다 멈췄습니다 (' + e.message + ')' }); return }
    set자동상태(틀림 ? { k: 'err', 글: 틀림.trim() } : { k: 'ok' })
    // 부재를 가장 많이 읽은 도면을 도면판에 엽니다(고칠 때 누를 수 있게)
    const 셈 = new Map()
    for (const g of R.근거) 셈.set(g.번, (셈.get(g.번) || 0) + 1)
    const 첫 = [...셈].sort((a, b) => b[1] - a[1])[0]
    const 열 = 남김[첫 ? 첫[0] : 0]
    if (!R.있음) {
      if (열) 도면열기(열.buf, 열.이름)
      set자동({ R, 없음: true })
      if (!['주', '배', '유'].includes(탭)) set탭('주')
      return
    }
    const 판 = { R, 열 }
    if (!비었나 && !묻지않음) { set자동({ ...판, 묻기: true }); return }
    자동넣기(판)
  }
  const 자동넣기 = (판) => {
    const { R, 열 } = 판
    set공사((P) => ({ ...R.공사, 기준: P.기준 || R.공사.기준 }))       // 기준값(fck·피복·할증…)은 적어 둔 것 그대로
    set자동({ R, 됨: true })
    set탭('결과'); set표('보'); set선택(null); set동i(0)
    if (열) 도면열기(열.buf, 열.이름)
  }
  const 자동파일 = async (files) => {
    const list = [...(files || [])].filter((f) => /\.(dxf|dwg)$/i.test(f.name))
    if (!list.length) return
    const 큰 = list.filter((f) => f.size > 큰파일)
    if (큰.length) { set자동상태({ k: 'err', 글: 큰.map((f) => f.name).join(', ') + ' — ' + 오류글('big') }); return }
    자동읽기(await Promise.all(list.map(async (f) => ({ 이름: f.name, buf: await f.arrayBuffer() }))))
  }
  const 예시열기 = async () => {
    set예시묻기(false)
    try {
      set자동상태({ k: 'busy', msg: '예시 도면 받는 중', p: 0 })
      const r = await fetch(자동예시[0])
      if (!r.ok) throw new Error(r.status)
      await 자동읽기([{ 이름: 자동예시[1], buf: await r.arrayBuffer() }], true)
    } catch (e) { set자동상태({ k: 'err', 글: '예시 도면을 받지 못했습니다 (' + e.message + ')' }) }
  }
  const 비었나 = !공사.동.some((d) => Object.values(d.주자료 || {}).some((a) => a && a.length)) && !Object.values(공사.배근).some((a) => a.length) && !유닛.length

  /* ── 표 고치기 (판: 주 = 지금 동의 주자료 · 배 = 배근표 · 유 = unit 의 줄) ── */
  const 줄들 = (판, 이름) => (판 === '주' ? (지금동.주자료 || {})[이름] : 판 === '유' ? (유닛[이름] || {}).줄 : 공사.배근[이름]) || []
  const 목록바꾸기 = (판, 이름, f) => set공사((P) => {
    if (판 === '주') {
      const 동 = [...P.동]
      const d = { ...동[동k] }
      d.주자료 = { ...d.주자료, [이름]: f([...((d.주자료 || {})[이름] || [])]) }
      동[동k] = d
      return { ...P, 동 }
    }
    if (판 === '유') {
      const 유 = [...(P.유닛 || [])]
      if (!유[이름]) return P
      유[이름] = { ...유[이름], 줄: f([...(유[이름].줄 || [])]) }
      return { ...P, 유닛: 유 }
    }
    return { ...P, 배근: { ...P.배근, [이름]: f([...(P.배근[이름] || [])]) } }
  })
  const 줄고치기 = (판, 이름, i, 고칠) => 목록바꾸기(판, 이름, (L) => { L[i] = 고칠({ ...(L[i] || {}) }); return L })
  const 칸쓰기 = (판, 이름, i, key, v, 찍음) => 줄고치기(판, 이름, i, (r) => {
    r[key] = v
    const 찍 = { ...(r._찍음 || {}) }
    if (찍음 === undefined) delete 찍[key]
    else 찍[key] = 찍음
    r._찍음 = 찍
    if (찍음) r._도면 = 도면이름
    return r
  })
  const 줄더하기 = (판, 이름, 복사) => 목록바꾸기(판, 이름, (L) => {
    const 앞 = L[L.length - 1]
    let r = {}
    if (복사 && 앞) {
      r = { ...앞, _찍음: {} }
      if (판 !== '배') { if ('열' in r) r.열 = ''; for (const k of ['길이', '단변', '장변', '개구부', '줄기초', 'MAT단변', 'MAT장변', '가로', '세로']) if (k in r) r[k] = '' }
    } else if (판 !== '배' && 앞) r = { 층: 앞.층 }
    L.push(r)
    return L
  })
  const 줄빼기 = (판, 이름, i) => {
    목록바꾸기(판, 이름, (L) => { L.splice(i, 1); return L })
    set선택(null)
  }
  const 표글 = (판, 이름) => (판 === '유' ? 'unit ' + ((유닛[이름] || {}).이름 || '') : 판 === '배' ? '배근표 ' + 이름 : 이름)

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
  }, [모델, 선택, 선택찍음, 단위, 끈층, 도면이름, 동k])  // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [선택, 선택찍음, 두점, 단위, 동k])  // eslint-disable-line react-hooks/exhaustive-deps

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

  const 표이름 = { 보: '1. 보', 보강: '보강', 기둥: '2. 기둥', 슬라브: '3. 슬라브', 옹벽: '4. 옹벽', 계단: '5. 계단', 기초: '6. 기초', 보강근: '보강근', 드라이에리어: 'DRY AREA*' }
  const 동으로 = (k) => { set동i(k); set선택(null) }
  const 합 = (항목) => 결과.집계.합.filter((x) => x.항목 === 항목).reduce((s, x) => s + x.산출, 0)

  return (
    <div className="wrap gg">
      <div className="card no-print">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🏗 골조 수량산출 <span className="count">· 도면을 넣으면 자동</span></h1>
        <div className="note sm">
          <b>구조평면도 + 부재 일람표를 넣으면 저절로</b> 배근표·주자료(골조산출양식 칸 그대로)를 채워 <b>콘크리트 · 거푸집 · 철근</b>을 층별·부재별로 셉니다 → <b>엑셀</b>.
          고칠 곳만 표의 칸을 누르고 <b>도면의 선·치수·글자를 누르면</b> 값이 바뀝니다(치수를 손으로 옮겨 적지 않습니다).
        </div>
        <div className="pdfsafe">🔒 <b>도면은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 읽고 셉니다 · 회원가입 없음 · 무료</div>
        <div className="btn-row gg-top">
          <button type="button" className="btn sm" onClick={() => 자동칸.current?.click()}>⚡ 도면 넣고 자동으로 (여러 장)</button>
          <button type="button" className="btn line sm" onClick={() => 파일칸.current?.click()}>📂 도면만 열기 (찍기)</button>
          <button type="button" className="btn line sm" onClick={() => (비었나 ? 예시열기() : set예시묻기(true))}>🧪 예시로 해 보기</button>
          <button type="button" className="btn ghost sm" onClick={() => set탭('결과')}>📊 결과 보기</button>
          {!비었나 && <button type="button" className="btn ghost sm" onClick={() => set지울까(true)}>🗑 새로 시작</button>}
        </div>
        {지울까 && (
          <div className="gg-ask">
            적은 것(동·배근표·주자료·unit·개요·당초)을 모두 지우고 새로 시작할까요? 도면은 그대로 둡니다.
            <button type="button" className="btn sm" onClick={() => { set공사(새공사()); set지울까(false); set탭('개요'); set선택(null); set동i(0); set유k(0) }}>예, 지우기</button>
            <button type="button" className="btn ghost sm" onClick={() => set지울까(false)}>아니오</button>
          </div>
        )}
        {예시묻기 && (
          <div className="gg-ask">
            지금 적은 것을 지우고 예시(가상 2층 구조도 — 도면에서 자동)를 불러올까요?
            <button type="button" className="btn sm" onClick={예시열기}>예, 불러오기</button>
            <button type="button" className="btn ghost sm" onClick={() => set예시묻기(false)}>아니오</button>
          </div>
        )}
        <input ref={파일칸} type="file" accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1}
               onChange={(e) => { 파일받기(e.target.files); e.target.value = '' }} />
        <input ref={자동칸} type="file" multiple accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1}
               onChange={(e) => { 자동파일(e.target.files); e.target.value = '' }} />
        {/* 📥 놓으면 ⚡ 자동으로 — 셀 부재가 없으면(일람표 없음) 도면만 열고 도면이 보이는 탭(③ 주자료)으로 */}
        <끌어놓기판 글="도면(DXF·DWG)을 놓으면 자동으로 셉니다 — 구조평면도·일람표 여러 장도 한꺼번에" 여럿 받기={(fs) => 자동파일(fs)} />
        <도면상태줄 상태={자동상태.k !== 'idle' && 자동상태.k !== 'ok' ? 자동상태 : 도.도면상태} />
        {자동 && 자동.묻기 && (
          <div className="gg-ask">
            도면에서 <b>{개수글(자동.R)}</b> 을 읽었습니다. 지금 적은 것 대신 넣을까요? (기준값은 그대로 둡니다)
            <button type="button" className="btn sm" onClick={() => 자동넣기(자동)}>예, 넣기</button>
            <button type="button" className="btn ghost sm" onClick={() => set자동(null)}>아니오</button>
          </div>
        )}
        {자동 && (자동.됨 || 자동.없음) && (
          <div className={'gg-auto' + (자동.없음 ? ' warn' : '')}>
            {자동.됨 ? <>⚡ <b>도면에서 자동으로 채웠습니다</b> — {개수글(자동.R)}
              {자동.R.읽음.평면.length > 0 && <> · 평면 {자동.R.읽음.평면.map((p) => p.제목 + '→' + p.층.map((f) => (f === 'FT' ? 'FT' : f + '층')).join('·')).join(', ')}</>}.
              {자동.R.읽음.층고짐작.length > 0 && <> <b>층고를 못 찾아 3,300 으로 짐작한 층({자동.R.읽음.층고짐작.join('·')})</b>은 ① 개요에서 고쳐 주세요.</>}</>
              : <>⚡ 이 도면에서는 <b>자동으로 셀 부재를 찾지 못해 도면만 열었습니다</b>. 칸을 누르고 도면을 눌러 채우십시오.</>}
            {자동.R.경고.length > 0 && <ul className="gg-warns">{자동.R.경고.slice(0, 12).map((w, k) => <li key={k}>⚠️ {w}</li>)}</ul>}
            <button type="button" className="chip" onClick={() => set자동(null)}>닫기</button>
          </div>
        )}
      </div>

      <div className="tp-tabs no-print" role="tablist">
        {[['개요', '① 개요'], ['배', '② 배근표'], ['주', '③ 주자료'], ['유', 'unit'], ['결과', '④ 결과']].map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'tp-tab' + (탭 === k ? ' on' : '')} onClick={() => { set탭(k); set선택(null) }}>{t}</button>
        ))}
      </div>

      {(탭 === '주' || 탭 === '배' || 탭 === '유') && (
        <도면판 도={도} 강조={강조} 찍었다={찍었다} 두점={두점} set두점={set두점} 두점찍었다={두점찍었다} set보는중={set보는중}
          알림={알림} 열기={() => 파일칸.current?.click()} 빈글="구조평면도·일람표가 있는 도면을 여세요. 도면 없이 표에 직접 적어도 됩니다."
          안내={선택 ? (선택종류
            ? <>👉 <b>{표글(선택.판, 선택.표)} {선택.i + 1}번 줄 «{선택.key === '_구획' ? '구획' : 선택.key}»</b> — {도움[선택종류]} {두점 !== null ? ' 📏 두 점 재기: 점 두 개를 누르십시오.' : ''}</>
            : <>«{선택.key}» 칸은 도면에서 받지 않습니다 — 직접 적어 주십시오.</>)
            : <>아래 표에서 채울 칸을 누른 뒤, 도면을 누르십시오. <span className="muted">(끌면 옮기기 · 휠·두 손가락 = 확대)</span></>} />
      )}

      {탭 === '개요' && <개요 공사={공사} set공사={set공사} 기준고치기={기준고치기} 동k={동k} 동으로={동으로} />}

      {탭 === '배' && (
        <div className="card no-print">
          <div className="tp-subtabs">
            {Object.keys(배근칸).map((k) => (
              <button key={k} type="button" className={'chip' + (배표 === k ? ' on' : '')} onClick={() => { set배표(k); set선택(null) }}>
                {k} <span className="gg-n">{(공사.배근[k] || []).length}</span></button>
            ))}
          </div>
          <p className="muted gg-hint">부재 기호마다 한 줄. 구조도면의 <b>부재 일람표(보 리스트·기둥 리스트…)</b>를 옮겨 적습니다 — 크기 칸은 도면의 치수를, 철근 칸은 도면의 글자(예: 4-HD22, HD10@150)를 눌러도 됩니다. 크기는 <b>mm</b>.</p>
          <p className="muted gg-hint">철근 칸은 다섯 꼴을 씁니다: <b>D10@200</b> · <b>D10+D13@200</b>(격배근) · <b>4-D13</b> · <b>4-D13@200</b>(4본씩 200 간격) · <b>D10@1000x1000 L)600</b>(지지근) — 끝에 <b>L)2000</b> 을 붙이면 한 본 길이를 정합니다.
            기호를 <b>1-RG1</b> 처럼 적으면 1층~R층의 G1(2G1·3G1…)에 모두 씁니다(따로 적은 기호가 먼저). <b>적용 동</b>을 적으면 그 동에만, 비우면 모든 동(공통 type).</p>
          <편집표 판="배" 이름={배표} 칸들={배근칸[배표].map(([h, key, 보기]) => [h, key, 보기])} 줄={줄들('배', 배표)}
            셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 고르기={배근고르기[배표]} />
        </div>
      )}

      {탭 === '주' && (
        <div className="card no-print">
          {공사.동.length > 1 && (
            <div className="tp-subtabs gg-dongs" aria-label="동 고르기">
              {공사.동.map((d, k) => (
                <button key={k} type="button" className={'chip' + (k === 동k ? ' on' : '')} onClick={() => 동으로(k)}>
                  🏢 {동이름(d, k)}{String(d.같은동 || '').trim() ? <span className="gg-n">= {d.같은동}</span> : null}</button>
              ))}
              <button type="button" className="chip" onClick={() => set탭('개요')}>＋ 동 고치기</button>
            </div>
          )}
          {String(지금동.같은동 || '').trim() ? (
            <div className="gg-ask">
              🏢 <b>{동이름(지금동, 동k)}</b> 은(는) <b>«{지금동.같은동}» 과 같은 동(Typical)</b> 입니다 — 주자료를 따로 적지 않고 그 동의 것을 그대로 셉니다.
              {공사.동.findIndex((d) => String(d.이름 || '').trim() === String(지금동.같은동).trim()) >= 0 &&
                <button type="button" className="btn sm" onClick={() => 동으로(공사.동.findIndex((d) => String(d.이름 || '').trim() === String(지금동.같은동).trim()))}>«{지금동.같은동}» 주자료 보기</button>}
            </div>
          ) : (
            <>
              <div className="tp-subtabs">
                {양식차례.map(([k]) => (
                  <button key={k} type="button" className={'chip' + (표 === k ? ' on' : '')} onClick={() => { set표(k); set선택(null) }}>
                    {표이름[k]} <span className="gg-n">{((지금동.주자료 || {})[k] || []).length}</span></button>
                ))}
              </div>
              <주자료도움 표={표} />
              <층복사판 공사={공사} set공사={set공사} 동k={동k} 표={표} 표이름={표이름} />
              <편집표 판="주" 이름={표} 칸들={양식[표].map(([h, key]) => [h, key, '']).concat([['구획*', '_구획', '']])} 줄={줄들('주', 표)}
                셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} 경고={결과.경고.filter((w) => w.곳 && w.곳.표 === 표 && (w.곳.동 ?? 0) === 동k)} />
              <p className="muted gg-hint">* 표시 칸·표는 골조산출양식에 없는 것(양식 밖)입니다. <b>구획</b>: 그 줄을 적은 구획(예: A구역·1공구 지하)으로 따로 모읍니다(결과 «구획별»). 비우면 구획 없음.</p>
            </>
          )}
        </div>
      )}

      {탭 === '유' && (
        <div className="card no-print">
          <p className="muted gg-hint"><b>unit</b> = 자주 되풀이되는 줄 묶음. 주자료의 <b>기호</b> 칸에 unit 이름(예: U1)을, <b>QT</b> 에 몇 벌인지 적으면 이 줄들이 그만큼 들어갑니다(<b>수평 unit</b>).
            unit 줄의 기호를 <b>+C1</b> 처럼 적으면 그 층의 기호(2층이면 2C1)로 바뀌고, 높이 <b>H</b> 는 그 층의 층고 — 층마다 같은 unit 을 쓰는 <b>수직 unit</b> 입니다. 층을 비우면 unit 을 부른 줄의 층.</p>
          <div className="tp-subtabs">
            {유닛.map((u, k) => (
              <button key={k} type="button" className={'chip' + (k === 유kk ? ' on' : '')} onClick={() => { set유k(k); set선택(null) }}>
                {u.이름 || '(이름 없음)'} <span className="gg-n">{u.부재} {(u.줄 || []).length}</span></button>
            ))}
            <button type="button" className="chip" onClick={() => { set공사((P) => ({ ...P, 유닛: [...(P.유닛 || []), { 이름: 'U' + ((P.유닛 || []).length + 1), 부재: '기둥', 줄: [{}] }] })); set유k(유닛.length); set선택(null) }}>＋ unit</button>
          </div>
          {유닛[유kk] ? (
            <>
              <div className="gg-row" style={{ margin: '8px 0' }}>
                <label className="gg-f">unit 이름<input value={유닛[유kk].이름 || ''} onChange={(e) => set공사((P) => { const 유 = [...P.유닛]; 유[유kk] = { ...유[유kk], 이름: e.target.value }; return { ...P, 유닛: 유 } })} /></label>
                <label className="gg-f">부재
                  <select value={유닛[유kk].부재 || '기둥'} onChange={(e) => { const v = e.target.value; set공사((P) => { const 유 = [...P.유닛]; 유[유kk] = { ...유[유kk], 부재: v }; return { ...P, 유닛: 유 } }); set선택(null) }}>
                    {['보', '기둥', '슬라브', '옹벽', '계단', '기초'].map((k) => <option key={k} value={k}>{k}</option>)}
                  </select></label>
                <button type="button" className="gg-x-btn" onClick={() => { set공사((P) => ({ ...P, 유닛: P.유닛.filter((_, j) => j !== 유kk) })); set유k(0); set선택(null) }}>✕ 이 unit 지우기</button>
              </div>
              <편집표 판="유" 이름={유kk} 칸들={(양식[유닛[유kk].부재 || '기둥'] || []).map(([h, key]) => [h, key, ''])} 줄={줄들('유', 유kk)}
                셀={셀} 칸쓰기={칸쓰기} 줄더하기={줄더하기} 줄빼기={줄빼기} />
            </>
          ) : <p className="muted">아직 unit 이 없습니다 — «＋ unit» 을 누르십시오. (unit 없이도 셈은 됩니다)</p>}
        </div>
      )}

      {탭 === '결과' && (
        <결과판 공사={공사} set공사={set공사} 결과={결과} 합={합} 엑셀받기={엑셀받기} 받는중={받는중} 가기={(곳) => {
          if (!곳) return
          set선택(null)
          if (곳.표 === '동' || 곳.표 === '층') { set탭('개요'); return }
          if (곳.동 !== undefined) set동i(곳.동)
          set탭('주'); set표(곳.표)
        }} />
      )}

      <div className="card no-print">
        <div className="detail-h">알아 두실 것</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.85 }}>
          <li><b>층</b>: n층 = n층의 기둥·벽·계단 + 그 위 바닥(보·슬라브). 맨 아래 바닥·기초는 <b>FT</b> 층입니다.</li>
          <li><b>보 길이·슬라브 단변/장변은 «기둥·보 가운데(통심)» 까지</b> — 보는 좌단·우단(기둥·보 기호나 mm)을 빼서 안목으로 셉니다.</li>
          <li><b>정착·이음 길이</b>는 KDS 14 20 52 기본식으로 채워 두었습니다. 도면 «일반구조사항» 표가 있으면 ① 개요에서 그 값으로 고치십시오 — 그것이 맞습니다.</li>
          <li>할증(이형철근 3% · 레미콘 1%)은 집계에서 따로 보여 드립니다. 산출서의 수량에는 넣지 않습니다.</li>
          <li><b>동이 여럿</b>이면 ① 개요의 동 표에 더하고, ③ 주자료 위의 동 단추로 옮겨 가며 적습니다. 똑같은 동은 «같은 동» 으로 한 번만 적습니다. 결과에 동별·층별 동별·공구별·유형별 집계가 나옵니다.</li>
          <li><b>기준층</b>은 한 층만 적고 «📋 층 복사» 로 여러 층에 붙이십시오 — 2G1 은 3G1·4G1… 로 기호의 층 표시도 옮겨 붙습니다.</li>
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
    드라이에리어: <>⚠️ <b>골조산출양식에 없는 표</b>(양식 밖)입니다. 기호는 배근표 <b>«벽»</b> 의 것. <b>길이·높이</b>: 바깥 벽 · <b>폭</b>: 건물 벽 바깥에서 바깥 벽 바깥까지(바닥판 폭) · <b>간벽수</b>: 사이 벽 수.
      첫 <b>F</b>(비우면 기본 거푸집) = 바깥 벽 안쪽 + 간벽 두 면, 두 번째 <b>F</b>(적을 때만) = 바깥 벽 바깥쪽.</>,
  }[표]
  return <p className="muted gg-hint">{t}</p>
}

/* ───────────────────────────── 고치는 표 */
function 편집표({ 판, 이름, 칸들, 줄, 셀, 칸쓰기, 줄더하기, 줄빼기, 경고, 고르기 }) {
  const 경고줄 = new Map()
  for (const w of 경고 || []) { const a = 경고줄.get(w.곳.i) || []; a.push(w.글); 경고줄.set(w.곳.i, a) }
  const 글이름 = 판 === '유' ? 'unit' : 이름
  const 숫자칸 = (key) => 길이칸.has(key) || 개수칸.has(key) || 면적칸.has(key) || ['추가', 'X정착', '단변정착', '장변정착', 'L정착', 'W정착', '간벽', '변수', '대근가로', '대근세로', '둘레'].includes(key)
  return (
    <>
      <div className="gg-wrap">
        <table className="gg-t">
          <thead><tr><th>No.</th>{칸들.map(([h, key]) => <th key={key} title={고르기 && 고르기[key] ? '골라 씀' : 칸종류(key, 판) ? '도면에서 받음: ' + 칸종류(key, 판) : '직접 적음'}>{h.replace(/\s+/g, ' ')}{칸종류(key, 판) ? <i className="gg-pk">●</i> : null}</th>)}<th /></tr></thead>
          <tbody>
            {줄.map((r, i) => (
              <tr key={i} className={경고줄.has(i) ? 'warn' : ''} title={경고줄.has(i) ? 경고줄.get(i).join(' / ') : ''}>
                <td className="gg-no">{i + 1}</td>
                {칸들.map(([, key, 보기]) => {
                  const c = 셀(판, 이름, i, key)
                  const 찍 = r._찍음 && r._찍음[key] && r._찍음[key].length
                  const 고 = 고르기 && 고르기[key]
                  if (고) {
                    return (
                      <td key={key} className={c.on ? 'on' : ''}>
                        <select value={r[key] ?? ''} onFocus={c.누름} onChange={(e) => 칸쓰기(판, 이름, i, key, e.target.value, undefined)} aria-label={글이름 + ' ' + (i + 1) + '번 줄 ' + key}>
                          <option value="">{보기 ? '(' + 보기 + ')' : '—'}</option>
                          {고.map((v) => <option key={v} value={v}>{v}</option>)}
                          {r[key] && !고.includes(r[key]) ? <option value={r[key]}>{r[key]}</option> : null}
                        </select>
                      </td>
                    )
                  }
                  return (
                    <td key={key} className={(c.on ? 'on ' : '') + (찍 ? 'pk ' : '') + (숫자칸(key) ? 'n' : '')}>
                      <input value={r[key] ?? ''} placeholder={보기 || ''} onFocus={c.누름} onClick={c.누름}
                        onChange={(e) => 칸쓰기(판, 이름, i, key, e.target.value, undefined)}
                        inputMode={숫자칸(key) ? 'decimal' : undefined} aria-label={글이름 + ' ' + (i + 1) + '번 줄 ' + key} />
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

/* ───────────────────────────── 층 복사 (기호의 층 표시도 옮김) */
function 층복사판({ 공사, set공사, 동k, 표, 표이름 }) {
  const d = 공사.동[동k]
  const 층목록 = (d.층 && d.층.length ? d.층 : null) || 공사.층
  const [열림, set열림] = useState(false)
  const [원, set원] = useState('')
  const [대상, set대상] = useState('')
  const [모두, set모두] = useState(false)
  const [말, set말] = useState('')
  const 원층 = 원 || (층목록.find((f) => ((d.주자료 || {})[표] || []).some((r) => String(r.층 || '').trim().toUpperCase() === String(f.이름).toUpperCase())) || {}).이름 || ''
  const 표들 = 모두 ? 양식차례.map(([k]) => k) : [표]
  const 하기 = () => {
    const 대 = 층범위(대상, 층목록)
    if (!원층) { set말('복사할 층을 고르십시오.'); return }
    if (!대.length) { set말('붙일 층을 적으십시오 — 예: 3-5 · 3,4,R (층 표에 있는 이름)'); return }
    const r = 층복사(d.주자료 || {}, 표들, 원층, 대, 층목록)
    if (!r.수) { set말('«' + 원층 + '» 층에 복사할 줄이 없습니다.'); return }
    set공사((P) => { const 동 = [...P.동]; 동[동k] = { ...동[동k], 주자료: r.주자료 }; return { ...P, 동 } })
    set말('✓ ' + 원층 + '층 → ' + 대.join('·') + '층, ' + r.수 + '줄 복사 (기호의 층 표시 2G1 → 3G1 처럼 옮김). 되돌리려면 붙은 줄을 지우십시오.')
  }
  if (!열림) return <div className="btn-row" style={{ margin: '4px 0 8px' }}><button type="button" className="btn ghost sm" onClick={() => { set열림(true); set말('') }}>📋 층 복사 (기준층 → 여러 층)</button></div>
  return (
    <div className="gg-copy">
      <b>📋 층 복사</b>
      <label>이 층<select value={원층} onChange={(e) => set원(e.target.value)}>{층목록.map((f) => <option key={f.이름} value={f.이름}>{f.이름}</option>)}</select></label>
      <label>→ 붙일 층<input value={대상} placeholder="예: 3-5 · 3,4,R" onChange={(e) => set대상(e.target.value)} /></label>
      <label className="gg-chk"><input type="checkbox" checked={모두} onChange={(e) => set모두(e.target.checked)} /> 모든 표 (끄면 «{표이름[표]}» 만)</label>
      <button type="button" className="btn sm" onClick={하기}>복사</button>
      <button type="button" className="btn ghost sm" onClick={() => set열림(false)}>닫기</button>
      {말 && <div className="gg-copy-say">{말}</div>}
    </div>
  )
}

/* ───────────────────────────── 개요 */
function 개요({ 공사, set공사, 기준고치기, 동k, 동으로 }) {
  const 기 = 공사.기준
  /* 층 표: 공통(-1) 또는 «층 따로» 인 동 */
  const [층대상, set층대상] = useState(-1)
  const 따로동 = 공사.동.map((d, k) => [d, k]).filter(([d]) => d.층 && d.층.length)
  const 대상 = 층대상 >= 0 && 공사.동[층대상] && 공사.동[층대상].층 ? 층대상 : -1
  const 층들 = 대상 >= 0 ? 공사.동[대상].층 : 공사.층
  const 층바꾸기 = (f) => set공사((P) => {
    if (대상 >= 0) { const 동 = [...P.동]; 동[대상] = { ...동[대상], 층: f([...(동[대상].층 || [])]) }; return { ...P, 동 } }
    return { ...P, 층: f([...P.층]) }
  })
  const 층고치기 = (i, key, v) => 층바꾸기((L) => { L[i] = { ...L[i], [key]: v }; return L })
  const 층더하기 = () => 층바꾸기((L) => [...L, { 이름: '', 층고: 3300, 슬라브: 150 }])
  const 층끼우기 = (i) => 층바꾸기((L) => { L.splice(i + 1, 0, { 이름: String(L[i].이름 || '') + 'A', 층고: L[i].층고, 슬라브: L[i].슬라브 }); return L })
  const 층빼기 = (i) => 층바꾸기((L) => L.filter((_, j) => j !== i))
  const 강도바꿈 = (key, v) => 기준고치기((b) => { b[key] = v; const fck = +b.fck, fy = +b.fy; if (fck > 0 && fy > 0) b.정착 = 정착표(fck, fy); return b })
  const 정고치기 = (d, key, v) => 기준고치기((b) => ({ ...b, 정착: { ...b.정착, [d]: { ...b.정착[d], [key]: +v || 0 } } }))
  const 기본값 = 기준값()

  /* 동 */
  const 동고치기 = (k, key, v) => set공사((P) => {
    const 동 = [...P.동]
    const 옛 = String(동[k].이름 || '').trim()
    동[k] = { ...동[k], [key]: v }
    if (key === '이름' && 옛) for (let j = 0; j < 동.length; j++) if (j !== k && String(동[j].같은동 || '').trim() === 옛) 동[j] = { ...동[j], 같은동: v }
    return { ...P, 동 }
  })
  const 동더하기 = () => set공사((P) => ({ ...P, 동: [...P.동, 새동(String(P.동.length + 1) + '동')] }))
  const 동복사 = (k) => set공사((P) => {
    const 원 = P.동[k]
    const 새 = JSON.parse(JSON.stringify(원))
    새.이름 = (String(원.이름 || '').trim() || '동') + ' 복사'
    return { ...P, 동: [...P.동.slice(0, k + 1), 새, ...P.동.slice(k + 1)] }
  })
  const 동빼기 = (k) => { set공사((P) => ({ ...P, 동: P.동.filter((_, j) => j !== k) })); 동으로(0); set층대상(-1) }
  const 층따로 = (k, on) => { set공사((P) => { const 동 = [...P.동]; 동[k] = { ...동[k], 층: on ? JSON.parse(JSON.stringify(P.층)) : null }; return { ...P, 동 } }); set층대상(on ? k : -1) }

  return (
    <div className="card no-print">
      <div className="gg-row">
        <label className="gg-f wide">공사 이름<input value={공사.이름 || ''} placeholder="예: ○○동 신축공사 (결과에 적힙니다)" onChange={(e) => set공사((P) => ({ ...P, 이름: e.target.value }))} /></label>
      </div>

      <div className="detail-h" style={{ marginTop: 14 }}>동 — 동마다 주자료를 따로 적습니다</div>
      <p className="muted gg-hint">동이 하나면 이름을 비워 두어도 됩니다. <b>같은 동(Typical)</b>: 다른 동과 똑같으면 그 동을 고르십시오 — 주자료를 다시 적지 않고 그 동의 것을 한 번 더 셉니다.
        <b> 공구·유형</b>을 적으면 결과에 공구별·유형별 집계가, <b>연면적</b>을 적으면 연면적 대비 분석이 나옵니다. <b>층 따로</b>: 이 동만 층고·층 수가 다를 때.</p>
      <div className="gg-wrap">
        <table className="gg-t"><thead><tr><th>동 이름</th><th>공구</th><th>유형</th><th>연면적(m²)</th><th>같은 동</th><th>층 따로</th><th>주자료</th><th /><th /></tr></thead>
          <tbody>
            {공사.동.map((d, k) => (
              <tr key={k} className={k === 동k ? 'gg-cur' : ''}>
                <td><input value={d.이름 || ''} placeholder={공사.동.length > 1 ? '예: 101동' : '(하나면 비워도 됨)'} onChange={(e) => 동고치기(k, '이름', e.target.value)} /></td>
                <td><input value={d.공구 || ''} placeholder="예: 1공구" onChange={(e) => 동고치기(k, '공구', e.target.value)} /></td>
                <td><input value={d.유형 || ''} placeholder="예: 판상형" onChange={(e) => 동고치기(k, '유형', e.target.value)} /></td>
                <td className="n"><input value={d.연면적 || ''} inputMode="decimal" onChange={(e) => 동고치기(k, '연면적', e.target.value)} /></td>
                <td><select value={d.같은동 || ''} onChange={(e) => 동고치기(k, '같은동', e.target.value)} aria-label="같은 동">
                  <option value="">— 따로 적음</option>
                  {공사.동.filter((x, j) => j !== k && String(x.이름 || '').trim() && !String(x.같은동 || '').trim()).map((x) => <option key={x.이름} value={String(x.이름).trim()}>= {x.이름}</option>)}
                </select></td>
                <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!(d.층 && d.층.length)} onChange={(e) => 층따로(k, e.target.checked)} aria-label="이 동만 층 따로" /></td>
                <td className="gg-no">{String(d.같은동 || '').trim() ? '=' : Object.values(d.주자료 || {}).reduce((a, L) => a + ((L && L.length) || 0), 0) + '줄'}</td>
                <td><button type="button" className="btn ghost sm" onClick={() => 동복사(k)} title="이 동을 통째로 복사">⧉ 복사</button></td>
                <td className="gg-x">{공사.동.length > 1 && <button type="button" title="이 동 지우기" onClick={() => 동빼기(k)}>✕</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn sm" style={{ marginTop: 8 }} onClick={동더하기}>＋ 동</button>

      <div className="detail-h" style={{ marginTop: 18 }}>층 — 아래에서 위로 (층고·슬라브 두께 mm)</div>
      {따로동.length > 0 && (
        <div className="tp-subtabs">
          <button type="button" className={'chip' + (대상 < 0 ? ' on' : '')} onClick={() => set층대상(-1)}>공통 층</button>
          {따로동.map(([d, k]) => <button key={k} type="button" className={'chip' + (대상 === k ? ' on' : '')} onClick={() => set층대상(k)}>🏢 {String(d.이름 || '').trim() || (k + 1) + '번째 동'} 층</button>)}
        </div>
      )}
      <p className="muted gg-hint">n층 줄의 슬라브 두께 = n층에서 치는 «그 위 바닥» 의 두께. 기둥·벽 높이·보 춤에서 뺍니다. 맨 아래 바닥·기초는 FT. <b>⤵</b> 는 그 아래(위층 쪽)에 중간층(예: 2A)을 끼웁니다.
        <b> 둘레(m)</b>를 적으면 그 층 슬라브 <b>마구리 거푸집(S-EDGE) = 둘레 × 두께</b> 를 셉니다(마구리 칸: 거푸집 이름, 비우면 기본).</p>
      <div className="gg-wrap">
        <table className="gg-t"><thead><tr><th>층</th><th>층고</th><th>슬라브 두께</th><th>둘레(m)</th><th>마구리 거푸집</th><th /><th /></tr></thead>
          <tbody>
            {층들.map((f, i) => (
              <tr key={i}>
                <td><input value={f.이름} onChange={(e) => 층고치기(i, '이름', e.target.value)} /></td>
                <td className="n"><input value={f.층고} inputMode="decimal" onChange={(e) => 층고치기(i, '층고', e.target.value)} /></td>
                <td className="n"><input value={f.슬라브} inputMode="decimal" onChange={(e) => 층고치기(i, '슬라브', e.target.value)} /></td>
                <td className="n"><input value={f.둘레 ?? ''} inputMode="decimal" onChange={(e) => 층고치기(i, '둘레', e.target.value)} /></td>
                <td><input value={f.마구리 ?? ''} placeholder={기.거푸집} onChange={(e) => 층고치기(i, '마구리', e.target.value)} /></td>
                <td className="gg-x"><button type="button" title="이 층 위에 중간층 끼우기" onClick={() => 층끼우기(i)}>⤵</button></td>
                <td className="gg-x"><button type="button" title="이 층 지우기" onClick={() => 층빼기(i)}>✕</button></td>
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
        <label className="gg-f">연면적 전체 (m²)<input value={기.연면적 ?? ''} inputMode="decimal" placeholder="비우면 동 연면적 합" onChange={(e) => 기준고치기((b) => ({ ...b, 연면적: e.target.value }))} /></label>
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
      <p className="muted gg-hint">기본값: 건설공사 표준품셈의 재료 할증 — 이형철근 3%, 레미콘(철근구조물) 1%. 아래 <b>규격별 할증</b>을 적은 철근 규격은 그 값을 씁니다.</p>
      <div className="gg-grid">
        {규격들.slice(0, 9).map((d) => (
          <label key={d} className="gg-f">{d} 할증 %<input value={(기.할증규격 || {})[d] ?? ''} inputMode="decimal" placeholder={String((기.할증 || {}).철근 ?? 3)}
            onChange={(e) => 기준고치기((b) => { const h = { ...(b.할증규격 || {}) }; if (e.target.value.trim() === '') delete h[d]; else h[d] = e.target.value; return { ...b, 할증규격: h } })} /></label>
        ))}
      </div>
      <div className="detail-h" style={{ marginTop: 12 }}>산출 옵션 — 부위별 정착 길이</div>
      <p className="muted gg-hint">비우면 아래 정착·이음 표대로 셉니다. <b>40D</b> 처럼 적으면 철근 지름 × 40(10mm 올림), 숫자만 적으면 그 mm.</p>
      <div className="gg-grid">
        {Object.keys(옵션이름).map((k) => (
          <label key={k} className="gg-f">{옵션이름[k]}<input value={(기.옵션 || {})[k] ?? ''} placeholder="표대로" onChange={(e) => 기준고치기((b) => ({ ...b, 옵션: { ...(b.옵션 || {}), [k]: e.target.value } }))} /></label>
        ))}
      </div>
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
function 모음표({ 줄, 앞 }) {
  return (
    <div className="gg-wrap"><table className="gg-r">
      <thead><tr>{앞.map(([h]) => <th key={h}>{h}</th>)}<th>항목</th><th>규격</th><th>단위</th><th className="r">수량</th></tr></thead>
      <tbody>{줄.map((x, k) => (
        <tr key={k}>{앞.map(([h, key]) => <td key={h}>{x[key] || '—'}</td>)}<td>{x.항목}</td><td>{x.규격}</td><td className="u">{단위풀이(x.단위)}</td><td className="r">{쉼(x.수량, 3)}<span className="단">{단위보기(x.단위)}</span></td></tr>
      ))}</tbody>
    </table></div>
  )
}

function 결과판({ 공사, set공사, 결과, 합, 엑셀받기, 받는중, 가기 }) {
  const [보기, set보기] = useState('집계')
  const 집 = 결과.집계
  const 부재들 = [...new Set(결과.줄.map((x) => x.부재))]
  const 여러동 = (집.동들 || []).length > 1
  const 구획씀 = 결과.줄.some((x) => x.구획)
  const 당초 = 공사.당초 && Array.isArray(공사.당초.합) ? 공사.당초 : null
  const 대비 = useMemo(() => (당초 ? 비교(당초.합, 집.합) : []), [당초, 집.합])
  const 보기들 = ['집계', '층별 부재별', '층별']
    .concat(여러동 ? ['동별', '층별 동별'] : [])
    .concat((집.공구별 || []).length ? ['공구별'] : [], (집.유형별 || []).length ? ['유형별'] : [], (집.구획별 || []).length ? ['구획별'] : [], (집.분석 || []).length ? ['연면적 분석'] : [])
    .concat(['당초 대비', '산출서'])
  const 지금 = 보기들.includes(보기) ? 보기 : '집계'
  const 칸 = (k) => 'gg-sec' + (지금 === k ? '' : ' gg-hide')
  const 당초저장 = () => {
    const 때 = new Date()
    const 글때 = 때.getFullYear() + '-' + String(때.getMonth() + 1).padStart(2, '0') + '-' + String(때.getDate()).padStart(2, '0') + ' ' + String(때.getHours()).padStart(2, '0') + ':' + String(때.getMinutes()).padStart(2, '0')
    set공사((P) => ({ ...P, 당초: { 때: 글때, 합: 집.합.map((x) => ({ 항목: x.항목, 규격: x.규격, 단위: x.단위, 산출: x.산출 })) } }))
  }
  return (
    <div className="card gg-print">
      <div className="gg-head">
        <div>
          <div className="detail-h" style={{ margin: 0 }}>골조 수량산출서{공사.이름 ? ' — ' + 공사.이름 : ''}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>K-건설맵 골조 수량산출 · 산출근거는 m 단위 숫자식 · 할증은 집계에만{여러동 ? ' · ' + 집.동들.length + '개 동' : ''}</div>
        </div>
        <div className="btn-row no-print" style={{ flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" disabled={!결과.줄.length || 받는중} onClick={엑셀받기}>{받는중 ? '만드는 중…' : '⬇ 엑셀 받기'}</button>
          <button type="button" className="btn line sm" disabled={!결과.줄.length} onClick={() => window.print()}>🖨 인쇄</button>
        </div>
      </div>
      <div className="gg-tiles">
        <div><span>콘크리트 (레미콘)</span><b>{쉼(합('콘크리트'), 2)}</b> ㎥ <small>루베</small></div>
        <div><span>거푸집</span><b>{쉼(합('거푸집'), 2)}</b> ㎡ <small>헤베</small></div>
        <div><span>철근</span><b>{쉼(합('철근'), 3)}</b> 톤</div>
        <div className={결과.경고.length ? 'bad' : 'good'}><span>검산</span><b>{결과.경고.length}</b> 건</div>
      </div>
      {결과.경고.length > 0 && (
        <div className="gg-check">
          <div className="detail-h">⚠️ 검산 — 셈에서 빠졌거나 확인할 것</div>
          <ul>{결과.경고.map((w, k) => <li key={k}>{w.곳 ? <button type="button" className="gg-go no-print" onClick={() => 가기(w.곳)}>{w.곳.표 === '동' ? '동 표' : w.곳.표 === '층' ? '층 표' : w.곳.표 + ' ' + (w.곳.i + 1) + '번 줄'}</button> : null} {w.글}</li>)}</ul>
        </div>
      )}
      <div className="tp-subtabs no-print">
        {보기들.map((k) => <button key={k} type="button" className={'chip' + (지금 === k ? ' on' : '')} onClick={() => set보기(k)}>{k}</button>)}
      </div>
      {!결과.줄.length && <p className="muted">아직 셀 것이 없습니다 — ② 배근표와 ③ 주자료를 채우십시오. (🧪 예시로 해 보기를 누르면 채워진 것을 볼 수 있습니다)</p>}
      {결과.줄.length > 0 && (
        <div className={칸('집계')}>
          <div className="detail-h">집계</div>
          <div className="gg-wrap"><table className="gg-r">
            <thead><tr><th>항목</th><th>규격</th><th>단위</th><th className="r">산출수량</th><th className="r">할증</th><th className="r">할증 포함</th></tr></thead>
            <tbody>{집.합.map((x, k) => (
              <tr key={k}><td>{x.항목}</td><td>{x.규격}</td><td className="u">{단위풀이(x.단위)}</td><td className="r">{쉼(x.산출, 3)}<span className="단">{단위보기(x.단위)}</span></td><td className="r">{x.할증}%</td><td className="r"><b>{쉼(x.내역, 3)}</b><span className="단">{단위보기(x.단위)}</span></td></tr>
            ))}</tbody>
          </table></div>
        </div>
      )}
      {결과.줄.length > 0 && (
        <div className={칸('층별 부재별')}><div className="detail-h">층별 부재별</div><div className="gg-wrap"><table className="gg-r">
          <thead><tr><th>층</th><th>부재</th><th>항목</th><th>규격</th><th>단위</th><th className="r">수량</th></tr></thead>
          <tbody>{집.층부재.map((x, k) => (
            <tr key={k}><td>{x.층}</td><td>{x.부재}</td><td>{x.항목}</td><td>{x.규격}</td><td className="u">{단위풀이(x.단위)}</td><td className="r">{쉼(x.수량, 3)}<span className="단">{단위보기(x.단위)}</span></td></tr>
          ))}</tbody>
        </table></div></div>
      )}
      {결과.줄.length > 0 && <div className={칸('층별')}><div className="detail-h">층별 집계</div><모음표 줄={집.층별 || []} 앞={[['층', '층']]} /></div>}
      {여러동 && <div className={칸('동별')}><div className="detail-h">동별 집계</div><모음표 줄={집.동별 || []} 앞={[['동', '동']]} /></div>}
      {여러동 && <div className={칸('층별 동별')}><div className="detail-h">층별 동별 집계</div><모음표 줄={집.층동 || []} 앞={[['층', '층'], ['동', '동']]} /></div>}
      {(집.공구별 || []).length > 0 && <div className={칸('공구별')}><div className="detail-h">공구별 집계</div><모음표 줄={집.공구별} 앞={[['공구', '공구']]} /></div>}
      {(집.유형별 || []).length > 0 && <div className={칸('유형별')}><div className="detail-h">유형별 집계</div><모음표 줄={집.유형별} 앞={[['유형', '유형']]} /></div>}
      {(집.구획별 || []).length > 0 && <div className={칸('구획별')}><div className="detail-h">구획별 집계 <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>(구획 칸은 양식 밖)</span></div><모음표 줄={집.구획별} 앞={[['구획', '구획']]} /></div>}
      {(집.분석 || []).length > 0 && (
        <div className={칸('연면적 분석')}><div className="detail-h">연면적 대비 분석</div><div className="gg-wrap"><table className="gg-r">
          <thead><tr><th>동</th><th className="r">연면적 m²</th><th className="r">콘크리트 m³</th><th className="r">m³/m²</th><th className="r">거푸집 m²</th><th className="r">m²/m²</th><th className="r">철근 ton</th><th className="r">kg/m²</th></tr></thead>
          <tbody>{집.분석.map((a, k) => (
            <tr key={k}><td>{a.동}</td><td className="r">{쉼(a.연면적, 2)}</td><td className="r">{쉼(a.콘크리트, 3)}</td><td className="r"><b>{쉼(a.콘당, 3)}</b></td><td className="r">{쉼(a.거푸집, 3)}</td><td className="r"><b>{쉼(a.틀당, 3)}</b></td><td className="r">{쉼(a.철근kg / 1000, 3)}</td><td className="r"><b>{쉼(a.철당, 1)}</b></td></tr>
          ))}</tbody>
        </table></div></div>
      )}
      <div className={칸('당초 대비')}>
        <div className="detail-h">당초 대비 (설계변경)</div>
        <p className="muted gg-hint no-print">설계변경 전 수량을 <b>당초</b>로 남겨 두면, 고친 뒤의 수량과 규격마다 비교합니다. 당초는 이 브라우저에 공사와 같이 저장되고 엑셀에도 «당초 대비» 시트로 나갑니다.</p>
        <div className="btn-row no-print" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
          <button type="button" className="btn sm" disabled={!결과.줄.length} onClick={당초저장}>📌 지금 집계를 당초로 {당초 ? '다시 ' : ''}저장</button>
          {당초 && <button type="button" className="btn ghost sm" onClick={() => set공사((P) => { const q = { ...P }; delete q.당초; return q })}>당초 지우기</button>}
        </div>
        {당초 ? (
          <>
            <p className="muted" style={{ fontSize: 12.5 }}>당초: {당초.때 || ''} 저장</p>
            <div className="gg-wrap"><table className="gg-r">
              <thead><tr><th>항목</th><th>규격</th><th>단위</th><th className="r">당초</th><th className="r">변경</th><th className="r">증감</th><th className="r">증감률</th></tr></thead>
              <tbody>{대비.map((x, k) => (
                <tr key={k} className={x.증감 < -1e-9 ? 'neg' : ''}><td>{x.항목}</td><td>{x.규격}</td><td className="u">{단위풀이(x.단위)}</td><td className="r">{쉼(x.당초, 3)}</td><td className="r">{쉼(x.지금, 3)}</td><td className="r"><b>{(x.증감 > 1e-9 ? '+' : '') + 쉼(x.증감, 3)}</b></td><td className="r">{x.율 === null ? '신규' : (x.율 > 0 ? '+' : '') + 쉼(x.율, 1) + '%'}</td></tr>
              ))}</tbody>
            </table></div>
          </>
        ) : <p className="muted">아직 당초가 없습니다.</p>}
      </div>
      {부재들.map((부재) => (
        <div key={부재} className={칸('산출서')}>
          <div className="detail-h">산출서 — {부재}</div>
          <div className="gg-wrap"><table className="gg-r gg-calc">
            <thead><tr>{여러동 && <th>동</th>}<th>층</th><th>기호</th><th>항목</th><th>규격</th><th>산출근거</th><th className="r">수량</th><th>단위</th><th>비고</th>{구획씀 && <th>구획</th>}</tr></thead>
            <tbody>{결과.줄.filter((x) => x.부재 === 부재).map((x, k) => (
              <tr key={k} className={x.수량 < 0 ? 'neg' : ''}>{여러동 && <td>{x.동}</td>}<td>{x.층}</td><td>{x.기호}</td><td>{x.항목}</td><td>{x.규격}</td><td className="expr">{x.식}</td><td className="r">{쉼(x.수량, 3)}</td><td className="u">{단위풀이(x.단위)}</td><td className="note2">{x.비고}</td>{구획씀 && <td>{x.구획}</td>}</tr>
            ))}</tbody>
          </table></div>
        </div>
      ))}
    </div>
  )
}
