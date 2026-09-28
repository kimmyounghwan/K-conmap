/**
 * /jeoksan/auto — ⚡ 도면 물량 자동 · 도면을 넣으면 모든 물량 → 엑셀 · 내역서와 대조 (2026-09-27)
 *
 * 소장님: 「도면을 주면 수량산출서가 나오게 안돼? 건축이든, 토목이든」
 *         → 고르신 것: 토목 도면 자동 읽기 · 건축 레이어·블록 자동 집계 · 「도면에 나와 있는 모든 물량」
 *         「토목이든, 건축이든. 도면을 주면 관련된 물량을 전부 뽑아주는 걸로 만들어줘. 모두 자동으로..
 *          도면 넣으면 모든 물량이 나오게… 그럼, 내역서 물량이랑 대조해 볼 수 있잖아」 「엑셀로 다운 받을 수 있게도」
 *
 * ■ 2026-09-27 저녁 — «모두 자동» (lib/도면전부.js) + «내역 대조» (lib/내역대조.js)
 *    도면을 넣으면 사람이 고르지 않아도 ① 물량 전부 에 모두 들어갑니다(표·토공·뜻 있는 레이어·블록·기호·실·마감·창호).
 *    빼고 싶은 줄만 체크를 풉니다. 내역서(.xlsx·.csv)를 넣으면 ② 내역 대조 에서 줄마다 짝을 지어 차이를 보여 줍니다.
 *
 * ■ 도면을 열면 바로 셉니다 — 누를 것이 없습니다.
 *    ① 도면에 적힌 표   : 철근 재료표 → 직경별 무게 · 수량표 → 품명별 · 그 밖의 «~표» 는 그대로 옮김 (여러 장 한꺼번에)
 *    ② 횡단면 토공      : 측점마다 적힌 깎기·쌓기 면적 → 평균단면법
 *    ③ 레이어·블록·글자 : 레이어별 선 길이·닫힌 면적 · 블록 개수 · 글자(기호) 개수 — 네모로 범위를 좁힐 수 있음
 *    ④ 수량산출서       : 고른 것을 모아 엑셀(수량 칸은 살아 있는 식) · 인쇄
 * ■ 도면을 «해석» 하지 않습니다 — 도면에 적힌 글자·숫자를 자리대로 옮깁니다. 그래서 늘 «어디서 읽었나» 를 도면 위 네모로 보여 줍니다.
 * ■ 도면은 이 브라우저 안에서만 읽습니다. 서버로 가지 않습니다(DWG 도 브라우저 안에서 DXF 로 바꿔 읽음).
 * ■ 셈: lib/도면자동.js (시험: node tools/시험_도면자동.mjs) · 도면판: ../도면판.jsx
 * ■ 예시 도면 web/public/jeoksan/토목_예시.dxf 는 K-건설맵이 그린 «가상» 도면입니다(tools/토목_예시도면.py).
 * ■ 🏗⚡ 2026-09-27 밤 — 골조 자동(lib/골조자동.js): 구조평면도 + 부재 일람표가 있으면 보·기둥·슬래브·벽·기초의
 *    콘크리트·거푸집·철근을 스스로 셈 → ① 에 줄로 · ② 골조 탭 · 엑셀에 «골조 산출서…» 시트(골조 화면과 같은 양식).
 *    소장님: 「적산에서 왜 골조 물량을 찍어야 된다고 했지?. 도면만 주면 스스로 물량을 내는 거잖아」
 *            「물량은 자동으로 뽑아서 엑셀로 다운 받을 수 있게 해줘」 「도면을 주면 도면에 나와있는 물량은 자동으로 엑셀로 정리되게 해줘」
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 도면읽어오기, 도면판, 도면상태줄, 처음끈층, 큰파일, 오류글 } from '../도면판.jsx'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 단위배율, 도형글자, 종류 } from '../lib/골조도면.js'
import * as 자 from '../lib/도면자동.js'
import * as 전 from '../lib/도면전부.js'
import { 내역읽기, 모으기 as 내역모으기, 대조 as 대조하기, 대조시트, 단위풀기 } from '../lib/내역대조.js'
import { 철근표, 셈 as 골조셈, 엑셀 as 골조엑셀, 기준값 as 골조기준값 } from '../lib/골조.js'
import { 골조보탬, 골조짝, 넣을것, 셀바꾸기, csv바꾸기 } from '../lib/내역채움.js'
import { 내역넘기기 } from '../lib/도면넘김.js'
import { 골조읽기, 골조시트들, 개수글 } from '../lib/골조자동.js'
import { 셈 as 마감셈 } from '../lib/마감.js'
import { askAfter } from '../AskComment'
import { use화면상태 } from '../lib/길기록.js'
import * as 창고 from '../lib/기억자료.js'

import { 단위보기, 단위풀이 } from '../lib/단위.js'
const 예시도면들 = [['/jeoksan/토목_예시.dxf', '토목_예시.dxf (가상 도면)'], ['/jeoksan/마감_예시.dxf', '마감_예시.dxf (가상 평면도)']]
const 예시내역 = '/jeoksan/내역_예시.xlsx'
const 골조예시 = ['/jeoksan/골조자동_예시.dxf', '골조자동_예시.dxf (가상 2층 라멘조 구조도)']
const 골조열쇠 = 'kcm.golgo.v1'
/** 도면마다 «모두 자동» 결과 — 도면·끈 레이어·단위가 바뀌면(새 객체) 다시 셈 */
const 전부캐시 = new WeakMap()
function 전부(f) {
  let r = 전부캐시.get(f)
  if (!r) { r = 전.모두(f.모델, { k: (f.단위 && f.단위.k) || 1, 끈층: f.끈층, 표들: f.표들 }); 전부캐시.set(f, r) }
  return r
}
const 자동키 = (종, 이름) => (종 === '길이' ? '층길이:' + 이름 : 종 === '면적' ? '층면적:' + 이름 : 종 === '블록' ? '블록:' + 이름 : '기호:' + 자.붙임(이름).toUpperCase())
const 판색 = { 같음: 'good', '도면이 많음': 'bad', '도면이 적음': 'bad', '도면에서 못 찾음': 'mid', '내역 수량 없음': 'new' }
const 쉼 = (n, d = 0) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n || 0)
const 종색 = { 철근: '#f59e0b', 수량: '#22c55e', 기타: '#94a3b8' }
const 종이름 = { 철근: '철근 재료표', 수량: '수량표', 기타: '그 밖의 표' }
let 번호 = 0

/* 🧭 2026-09-27 — 「손님 맞을 준비 … 전수조사」: 도면을 넣고 셈을 본 뒤 다른 화면에 갔다 오면 «다 사라졌습니다».
   ① 사이트 안에서 오가면: 이 탭의 메모리에 판을 통째로 둡니다(남은판) → 뒤로 오면 그대로, 다시 읽지 않음.
   ② 새로고침·다음 방문: 넣은 도면 «파일» 과 내역서는 브라우저 창고(IndexedDB), 고른 것·고친 것은 localStorage 에 두고
      도면을 다시 읽습니다(번호 id 도 그대로 — 고친 것이 제자리에 붙게). 서버로는 가지 않습니다.
   ⚠️ 도면 합계가 크면(60MB 넘음) 창고에는 안 넣습니다 — 그때는 사이트 안 오가기(①)만 됩니다. */
let 남은판 = null
const 설정열쇠 = 'kcm.auto.설정.v1'
const 창고한도 = 60 * 1024 * 1024
function 설정읽기() { try { return JSON.parse(localStorage.getItem(설정열쇠) || 'null') || {} } catch (e) { return {} } }

function 준비(모델, 이름) {
  return {
    id: ++번호, 이름, 모델,
    끈층: 처음끈층(모델), 단위: 단위배율(모델.units, 모델.box),
    표들: 자.표찾기(모델),
    노선: 자.노선묶기(자.측점찾기(모델)),
  }
}

export default function JeoksanAuto() {
  const [처음] = useState(() => 남은판 || { ...설정읽기(), 다시읽기: true })
  const [파일들, set파일들] = useState(() => (남은판 ? 남은판.파일들 : []))
  const [지금, set지금] = useState(처음.지금 || 0)
  const [상태, set상태] = useState({ k: 'idle' })
  /* 🧭 2026-09-27 — 탭 = 뒤로가기 한 칸 (lib/길기록.js) */
  const [탭, set탭] = use화면상태('탭', '산출')
  const [가볼곳, set가볼곳] = useState(null)
  const [알림, set알림] = useState({ 글: '', 좋음: false })
  const [네모잡기, set네모잡기] = useState('')        // '' | '토공' | '세기'
  const [표뺌, set표뺌] = useState(() => new Set(처음.표뺌 || []))   // 산출서에서 뺄 표 key
  const [펼친표, set펼친표] = useState(null)
  const [토공설정, set토공설정] = useState(처음.토공설정 || {})         // `${fid}:${노선}` → {기준i, 네모, 칸:{j:{이름,단위,쓰기}}, 점뺌:[i], 넣기}
  const [고른노선, set고른노선] = useState(처음.고른노선 || 1)
  const [세기네모, set세기네모] = useState(처음.세기네모 || {})         // fid → [x0,y0,x1,y1]
  const [세기고름, set세기고름] = useState(처음.세기고름 || {})         // key → {fid, 종, 이름}
  const [고침, set고침] = useState(처음.고침 || {})                 // 산출서 줄 key → {품명, 규격}
  const [글찾기, set글찾기] = useState('')
  const [받는중, set받는중] = useState(false)
  const [켬고침, set켬고침] = useState(처음.켬고침 || {})             // 물량 줄 key → true/false (사람이 켜고 끈 것)
  const [내역, set내역] = useState(남은판 ? 남은판.내역 : null)               // 내역대조.내역읽기() 결과
  const [짝고침, set짝고침] = useState(처음.짝고침 || {})             // 내역 id → 도면 줄 key | '' (짝 없음)
  const [대조거르기, set대조거르기] = useState(처음.대조거르기 || '모두')
  /* 📥 2026-09-28 — 내역서에 도면 물량 넣기 (lib/내역채움.js) · 빈만: 빈 수량 칸만 · 할증: 재료 줄은 할증 넣은 값 · 약함: 약한 짝도 */
  const [넣기옵션, set넣기옵션] = useState(처음.넣기옵션 || { 빈만: true, 할증: true, 약함: false })
  const [넣은말, set넣은말] = useState(null)
  const 가기 = useNavigate()
  const [딴화면, set딴화면] = useState(처음.딴화면 || { 골조: false, 마감: false })   // 골조·마감 화면에서 적어 둔 것도 넣기
  const [골고침, set골고침] = useState(처음.골고침 || {})             // 골조 자동 — 층 이름 → {층고, 슬라브} (짐작을 고친 것)
  const [골옮김, set골옮김] = useState('')                          // '' | '묻기' | '됨'
  const [골펼침, set골펼침] = useState('')
  const 파일칸 = useRef(null)
  const 내역칸 = useRef(null)
  const 상자들 = useRef(new Map())
  const 원본들 = useRef((남은판 && 남은판.원본들) || new Map())   // id → {이름, buf} | {예시: 주소} — 창고에 넣을 도면 파일

  /* 🧭 ① 메모리 · ② localStorage (고른 것·고친 것) */
  useEffect(() => {
    const 설정 = { 지금, 표뺌: [...표뺌], 토공설정, 고른노선, 세기네모, 세기고름, 고침, 켬고침, 짝고침, 대조거르기, 딴화면, 골고침, 넣기옵션 }
    남은판 = { ...설정, 파일들, 내역, 원본들: 원본들.current }
    const t = setTimeout(() => { try { localStorage.setItem(설정열쇠, JSON.stringify(설정)) } catch (e) { /* 가득 참 */ } }, 400)
    return () => clearTimeout(t)
  }, [지금, 표뺌, 토공설정, 고른노선, 세기네모, 세기고름, 고침, 켬고침, 짝고침, 대조거르기, 딴화면, 골고침, 넣기옵션, 파일들, 내역])
  /* 🧭 ② 창고 — 도면 파일·내역서가 바뀔 때만 */
  const 창고넣기 = (목록, 내역값) => {
    const 도면 = 목록.map((f) => ({ id: f.id, ...(원본들.current.get(f.id) || {}) })).filter((x) => x.buf || x.예시)
    const 크기 = 도면.reduce((n, x) => n + (x.buf ? x.buf.byteLength : 0), 0)
    창고.넣기('auto.판', 크기 > 창고한도 ? { 도면: [], 큼: true } : { 도면 }).catch(() => {})
    if (내역값 !== undefined) 창고.넣기('auto.내역', 내역값).catch(() => {})
  }
  /* 내역서(읽은 것·켠 시트)는 바뀔 때마다 창고에 — 되살리기가 끝난 뒤부터 */
  const 복원끝 = useRef(!처음.다시읽기)
  useEffect(() => {
    if (!복원끝.current) return undefined
    const t = setTimeout(() => { 창고.넣기('auto.내역', 내역).catch(() => {}) }, 500)
    return () => clearTimeout(t)
  }, [내역])
  /* 🧭 ② 새로고침·다음 방문 — 창고에서 도면을 다시 읽습니다 */
  useEffect(() => {
    if (!처음.다시읽기) return undefined
    let 살 = true
    ;(async () => {
      try {
        const 판 = await 창고.꺼내기('auto.판')
        const 내 = await 창고.꺼내기('auto.내역').catch(() => null)
        if (!살) return
        if (내) set내역(내)
        복원끝.current = true
        if (!판 || !판.도면 || !판.도면.length) return
        const 새 = []
        for (const x of 판.도면) {
          if (!살) return
          set상태({ k: 'busy', msg: '앞서 넣은 도면을 다시 여는 중 — ' + (x.이름 || x.예시 || ''), p: 0 })
          let buf = x.buf, 이름 = x.이름
          if (x.예시) { const r = await fetch(x.예시); if (!r.ok) continue; buf = await r.arrayBuffer(); 이름 = x.예시이름 || x.예시 }
          const 사본 = x.buf ? x.buf.slice(0) : null
          const { 모델 } = await 도면읽어오기(buf, 이름.replace(/ \(.*$/, ''), (st) => { if (살) set상태({ k: 'busy', ...st }) })
          const f = 준비(모델, 이름)
          f.id = x.id; if (번호 < x.id) 번호 = x.id
          원본들.current.set(f.id, x.예시 ? { 예시: x.예시, 예시이름: x.예시이름 } : { 이름, buf: 사본 })
          새.push(f)
        }
        if (살 && 새.length) { set파일들(새); set지금((j) => Math.min(j, 새.length - 1)) }
        if (살) set상태({ k: 'ok' })
      } catch (e) { if (살) set상태({ k: 'idle' }) } finally { 복원끝.current = true }
    })()
    return () => { 살 = false }
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  const cur = 파일들[지금] || null
  const 고치기 = (id, 바꿀) => set파일들((P) => P.map((f) => (f.id === id ? { ...f, ...바꿀 } : f)))
  const 도 = useMemo(() => (cur
    ? { 모델: cur.모델, 도면이름: cur.이름, 끈층: cur.끈층, set끈층: (s) => 고치기(cur.id, { 끈층: s }), 단위: cur.단위, set단위: (u) => 고치기(cur.id, { 단위: u }) }
    : { 모델: null, 도면이름: '', 끈층: new Set(), set끈층() {}, 단위: null, set단위() {} }), [cur])

  /* ── 도면 열기 (여러 장) ── */
  const 열기 = async (files) => {
    const list = [...(files || [])]
    const 새 = []
    let 틀림 = ''
    for (const f of list) {
      if (f.size > 큰파일) { 틀림 += f.name + ' — ' + 오류글('big') + ' '; continue }
      set상태({ k: 'busy', msg: f.name + ' 읽는 중', p: 0 })
      try {
        const buf = await f.arrayBuffer()
        const 사본 = buf.byteLength < 창고한도 ? buf.slice(0) : null   /* 읽기가 buf 를 일꾼에게 넘겨 비울 수 있어 먼저 베낍니다 */
        const { 모델 } = await 도면읽어오기(buf, f.name, (s) => set상태({ k: 'busy', msg: f.name + ' — ' + s.msg, p: s.p }))
        const 준 = 준비(모델, f.name)
        if (사본) 원본들.current.set(준.id, { 이름: f.name, buf: 사본 })
        새.push(준)
      } catch (e) {
        틀림 += f.name + ' — ' + 오류글(e.kind || 'fail', e.message) + ' '
      }
    }
    set상태(틀림 ? { k: 'err', 글: 틀림.trim() } : { k: 'ok' })
    if (새.length) {
      const n = 파일들.length
      set파일들((P) => [...P, ...새])
      set지금(n + 새.length - 1)
      창고넣기([...파일들, ...새])
    }
  }
  const 예시열기 = async () => {
    set상태({ k: 'busy', msg: '예시 도면 받는 중', p: 0 })
    try {
      const 새 = []
      for (const [주소, 이름] of 예시도면들) {
        const r = await fetch(주소)
        if (!r.ok) throw new Error(r.status)
        const { 모델 } = await 도면읽어오기(await r.arrayBuffer(), 이름.replace(/ \(.*$/, ''), (st) => set상태({ k: 'busy', ...st }))
        const 준 = 준비(모델, 이름)
        원본들.current.set(준.id, { 예시: 주소, 예시이름: 이름 })
        새.push(준)
      }
      set파일들(새)
      set지금(0)
      const r2 = await fetch(예시내역)
      let 내역값 = null
      if (r2.ok) { const b2 = new Uint8Array(await r2.arrayBuffer()); 내역값 = { ...내역읽기(b2, '내역_예시.xlsx (가상 내역서)'), 원본: b2 }; set내역(내역값); set짝고침({}); set넣은말(null) }
      창고넣기(새)
      set켬고침({})
      set탭('산출')
      set상태({ k: 'ok' })
    } catch (e) { set상태({ k: 'err', 글: '예시를 받지 못했습니다 (' + (e.message || e) + ')' }) }
  }
  /* 🏗 골조 예시 — 가상 2층 라멘조 구조도(평면 3장 + 일람표). 지금 넣은 도면 뒤에 붙입니다 */
  const 골조예시열기 = async () => {
    set상태({ k: 'busy', msg: '골조 예시 도면 받는 중', p: 0 })
    try {
      const r = await fetch(골조예시[0])
      if (!r.ok) throw new Error(r.status)
      const { 모델 } = await 도면읽어오기(await r.arrayBuffer(), 골조예시[1].replace(/ \(.*$/, ''), (st) => set상태({ k: 'busy', ...st }))
      const 준 = 준비(모델, 골조예시[1])
      원본들.current.set(준.id, { 예시: 골조예시[0], 예시이름: 골조예시[1] })
      const 목록 = [...파일들.filter((f) => f.이름 !== 골조예시[1]), 준]
      set파일들(목록); set지금(목록.length - 1); 창고넣기(목록)
      set탭('골조'); set상태({ k: 'ok' })
    } catch (e) { set상태({ k: 'err', 글: '골조 예시를 받지 못했습니다 (' + (e.message || e) + ')' }) }
  }
  const 내역열기 = async (files) => {
    const f = files && files[0]
    if (!f) return
    try {
      const b = new Uint8Array(await f.arrayBuffer())
      const 읽음 = { ...내역읽기(b, f.name), 원본: b }        // 📥 원래 파일 — 물량을 넣어 «그 파일» 로 돌려드릴 때 씀
      set내역(읽음); set짝고침({}); set넣은말(null); set탭('대조')
      set상태({ k: 'ok' })
    } catch (e) { set상태({ k: 'err', 글: f.name + ' — ' + (e.message || e) }) }
  }
  const 빼기 = (id) => {
    set파일들((P) => P.filter((f) => f.id !== id))
    set지금(0)
    상자들.current.delete(id)
    원본들.current.delete(id)
    창고넣기(파일들.filter((f) => f.id !== id))
  }

  /* ── ① 표 ── */
  const 모든표 = useMemo(() => 파일들.flatMap((f) => f.표들.map((t) => ({ ...t, fid: f.id, 도면: f.이름, key: f.id + ':' + t.id }))), [파일들])
  const 철 = useMemo(() => {
    const 줄 = [], 검산 = []
    for (const f of 파일들) {
      const r = 자.철근모으기(f.표들.filter((t) => !표뺌.has(f.id + ':' + t.id)))
      for (const x of r.줄) 줄.push({ ...x, 도면: f.이름 })
      for (const w of r.검산) 검산.push(f.이름 + ' · ' + w)
    }
    const m = new Map()
    for (const x of 줄) { const a = m.get(x.d) || { d: x.d, 규격들: new Set(), 총길이m: 0, kg: 0, 식: [] }; a.규격들.add(x.규격); a.총길이m += x.총길이m; a.kg += x.kg; a.식.push(자.수글(x.총길이m)); m.set(x.d, a) }
    const 합 = [...m.values()].sort((a, b) => parseInt(a.d.slice(1), 10) - parseInt(b.d.slice(1), 10)).map((a) => ({ ...a, 규격들: [...a.규격들].join('·') }))
    return { 줄, 합, 검산 }
  }, [파일들, 표뺌])
  const 량 = useMemo(() => {
    const 줄 = []
    for (const f of 파일들) for (const x of 자.수량모으기(f.표들.filter((t) => !표뺌.has(f.id + ':' + t.id))).줄) 줄.push({ ...x, 도면: f.이름 })
    const m = new Map()
    for (const x of 줄) { const k = x.품명 + '|' + x.규격 + '|' + x.단위; const a = m.get(k) || { 품명: x.품명, 규격: x.규격, 단위: x.단위, 수량: 0, 식: [], 도면: new Set() }; a.수량 += x.수량; a.식.push(자.수글(x.수량)); a.도면.add(x.도면); m.set(k, a) }
    return [...m.values()].map((a) => ({ ...a, 식: a.식.join('+'), 도면: [...a.도면].join(', ') }))
  }, [파일들, 표뺌])

  /* ── ② 토공 ── */
  const 노선들 = cur ? cur.노선 : []
  const 노선 = 노선들.find((g) => g.번호 === 고른노선) || 노선들[0] || null
  const 토공키 = cur && 노선 ? cur.id + ':' + 노선.번호 : ''
  const 토공 = useMemo(() => (cur && 노선 ? 토공셈(cur, 노선, 토공설정[cur.id + ':' + 노선.번호] || {}) : null), [cur, 노선, 토공설정])
  const 토설고치기 = (바꿀) => set토공설정((P) => ({ ...P, [토공키]: { ...(P[토공키] || {}), ...바꿀 } }))

  /* ── ③ 세기 ── */
  const 상자 = (f) => { let b = 상자들.current.get(f.id); if (!b) { b = 자.도형상자(f.모델); 상자들.current.set(f.id, b) } return b }
  const 세기결과 = (f) => 자.세기(f.모델, { 네모: 세기네모[f.id] || null, 끈층: f.끈층, k: (f.단위 && f.단위.k) || 1, 상자: 상자(f) })
  const 세 = useMemo(() => (cur && 탭 === '세기' ? 세기결과(cur) : null), [cur, 탭, 세기네모])  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 골조·마감 화면에서 이 브라우저에 적어 둔 것 (대조용으로 같이 넣을 수 있게) ── */
  const 딴저장 = useMemo(() => {
    const 읽 = (열쇠) => { try { return JSON.parse(localStorage.getItem(열쇠) || 'null') } catch (e) { return null } }
    return { 골조: 읽('kcm.golgo.v1'), 마감: 읽('kcm.magam.v1') }
  }, [탭])  // eslint-disable-line react-hooks/exhaustive-deps
  const 딴줄 = useMemo(() => {
    const out = []
    if (딴화면.골조 && 딴저장.골조) {
      try {
        const R = 골조셈(딴저장.골조)
        const 버림 = ((딴저장.골조.기준 || {}).버림) || 골조기준값().버림
        for (const a of R.집계.합) out.push({ key: 'gg:' + a.항목 + '|' + a.규격 + '|' + a.단위, 골: { 항목: a.항목, 규격: a.규격, 버림: a.항목 === '콘크리트' && a.규격 === 버림 }, 할증수량: a.내역, 할증: a.할증, 구분: '🏗 골조 수량산출 (이 브라우저)', 품명: a.항목, 규격: a.규격, 단위: a.단위, 수량: a.산출, 근거: '골조 화면의 집계 (할증 전)' + (딴저장.골조.이름 ? ' · ' + 딴저장.골조.이름 : ''), 도면: '골조 수량산출' })
      } catch (e) { /* 적어 둔 것이 깨졌으면 넣지 않음 */ }
    }
    if (딴화면.마감 && 딴저장.마감) {
      try {
        const R = 마감셈(딴저장.마감)
        for (const a of R.집계.합) out.push({ key: 'mg:' + a.재료 + '|' + a.규격 + '|' + a.단위, 구분: '🧱 마감 수량산출 (이 브라우저)', 품명: a.재료, 규격: a.규격, 단위: a.단위, 수량: a.수량, 근거: '마감 화면의 집계' + (딴저장.마감.이름 ? ' · ' + 딴저장.마감.이름 : ''), 도면: '마감 수량산출' })
      } catch (e) { /* 넣지 않음 */ }
    }
    return out
  }, [딴화면, 딴저장])

  /* ── 🏗 골조 자동 — 넣은 도면 모두에서(평면과 일람표가 다른 장이어도) ── */
  const 골 = useMemo(() => {
    if (!파일들.length) return null
    try { return 골조읽기(파일들.map((f) => ({ 모델: f.모델, 이름: f.이름, k: (f.단위 && f.단위.k) || 1 }))) } catch (e) { return { 있음: false, 경고: ['골조를 읽다 멈췄습니다: ' + e.message], 근거: [], 읽음: { 배근: {}, 평면: [], 셈: {}, 철골: [] }, 공사: null } }
  }, [파일들])
  const 골공사 = useMemo(() => {
    if (!골 || !골.있음) return null
    return { ...골.공사, 층: 골.공사.층.map((f) => (골고침[f.이름] ? { ...f, ...골고침[f.이름] } : f)) }
  }, [골, 골고침])
  const 골결과 = useMemo(() => { if (!골공사) return null; try { return 골조셈(골공사) } catch (e) { return null } }, [골공사])
  const 골도면 = 골 && 골.있음 ? [...new Set(골.근거.map((g) => (파일들[g.번] || {}).이름).filter(Boolean))].join(', ') : ''
  const 골셈글 = 골 && 골.있음 ? 개수글(골) : ''

  /* ── 물량 전부 (수량산출서) — 모두 자동으로 켜 두고, 사람이 끈 것만 뺌 ── */
  const 산출 = useMemo(() => {
    const 줄 = []
    const 켜 = (key, 기본) => (Object.prototype.hasOwnProperty.call(켬고침, key) ? 켬고침[key] : 기본)
    for (const a of 철.합) {
      const key = '철:' + a.d
      줄.push({ key, 켬: 켜(key, true), 구분: '철근 (도면의 철근 재료표)', 품명: '철근', 규격: a.d + (a.규격들 && a.규격들 !== a.d ? ' (' + a.규격들 + ')' : ''), 단위: 'kg', 수량: a.kg, 식: '(' + a.식.join('+') + ')*' + 철근표[a.d][1], 근거: '총길이 ' + 쉼(a.총길이m, 3) + ' m × ' + 철근표[a.d][1] + ' kg/m (KS D 3504)', 도면: [...new Set(철.줄.filter((x) => x.d === a.d).map((x) => x.도면))].join(', ') })
    }
    for (const a of 량) { const key = '량:' + a.품명 + '|' + a.규격 + '|' + a.단위; 줄.push({ key, 켬: 켜(key, true), 구분: '도면 수량표', 품명: a.품명, 규격: a.규격, 단위: a.단위, 수량: a.수량, 식: a.식, 근거: '도면에 적힌 수량 ' + a.식, 도면: a.도면 }) }
    const 토공들 = []
    for (const f of 파일들) {
      for (const g of f.노선) {
        const k = f.id + ':' + g.번호
        const st = 토공설정[k] || {}
        if (st.넣기 === false) continue
        const r = 토공셈(f, g, st)
        const 쓴칸 = r.칸.map((c, j) => ({ c, j })).filter(({ c }) => c.쓰기)
        if (!쓴칸.length || !r.결과.점.length) continue
        const 이름 = (f.노선.length > 1 ? '노선' + g.번호 + ' ' : '') + r.결과.점[0]?.글 + '~' + r.결과.점[r.결과.점.length - 1]?.글
        토공들.push({ 이름: (파일들.length > 1 ? f.이름.replace(/\.dxf.*$|\.dwg.*$/i, '') + ' ' : '') + '노선' + g.번호, 칸: 쓴칸.map(({ c }) => ({ 이름: c.이름, 단위: c.단위 })), 점: r.결과.점.map((p) => ({ 글: p.글, 측: p.측, 값: 쓴칸.map(({ j }) => p.값[j]) })) })
        for (const [n, { c, j }] of 쓴칸.entries()) {
          const key = '토:' + k + ':' + j
          줄.push({ key, 켬: 켜(key, true), 토공: { t: 토공들.length - 1, j: n }, 구분: '토공 (평균단면법)', 품명: c.이름, 규격: '', 단위: c.단위 === 'm' ? 'm²' : 'm³', 수량: r.결과.합[j], 근거: 이름 + ' · ' + r.결과.구간.length + '구간 (A1+A2)/2×L', 도면: f.이름 })
        }
      }
    }
    for (const f of 파일들) {
      for (const x of 전부(f).항목) {
        const key = 'all:' + f.id + ':' + x.key
        줄.push({ key, 켬: 켜(key, x.켬), 구분: x.구분, 품명: x.품명, 규격: x.규격, 단위: x.단위, 수량: x.수량, 근거: x.근거, 도면: f.이름 })
      }
    }
    if (골결과) {
      for (const a of 골결과.집계.합) {
        const key = 'gz:' + a.항목 + '|' + a.규격 + '|' + a.단위
        const 버림 = ((골공사 && 골공사.기준) || {}).버림 || 골조기준값().버림
        줄.push({ key, 켬: 켜(key, true), 골: { 항목: a.항목, 규격: a.규격, 버림: a.항목 === '콘크리트' && a.규격 === 버림 }, 할증수량: a.내역, 할증: a.할증, 구분: '🏗 골조 (구조평면도·일람표)', 품명: a.항목, 규격: a.규격, 단위: a.단위, 수량: a.산출, 근거: 골셈글 + ' — 할증 전 · «② 골조» 탭에 층별·부재별', 도면: 골도면 })
      }
    }
    for (const x of 딴줄) 줄.push({ ...x, 켬: 켜(x.key, true) })
    const 세기줄 = []
    for (const [key, s] of Object.entries(세기고름)) {
      const f = 파일들.find((x) => x.id === s.fid)
      if (!f) continue
      const R = 세기결과(f)
      let v = NaN, 구분 = '', 단위 = '', 근거 = ''
      const 범위 = 세기네모[f.id] ? '네모 안' : '도면 전체'
      if (s.종 === '길이') { const a = R.층.find((x) => x.이름 === s.이름); v = a ? a.길이m : 0; 구분 = '레이어 선 길이 (고름)'; 단위 = 'm'; 근거 = '레이어 «' + s.이름 + '» 선 ' + (a ? a.선수 : 0) + '개 길이 합 (' + 범위 + ')' }
      if (s.종 === '면적') { const a = R.층.find((x) => x.이름 === s.이름); v = a ? a.면적m2 : 0; 구분 = '레이어 닫힌 면적 (고름)'; 단위 = 'm²'; 근거 = '레이어 «' + s.이름 + '» 닫힌 도형 ' + (a ? a.면수 : 0) + '개 면적 합 (' + 범위 + ')' }
      if (s.종 === '블록') { const a = R.블록.find((x) => x.이름 === s.이름); v = a ? a.수 : 0; 구분 = '블록 개수 (고름)'; 단위 = '개'; 근거 = '블록 «' + s.이름 + '» ' + v + '개 (' + 범위 + ')' }
      if (s.종 === '글자') { const a = R.글.find((x) => x.글 === s.이름); v = a ? a.수 : 0; 구분 = '글자 개수 (고름)'; 단위 = '개'; 근거 = '글자 «' + s.이름 + '» ' + v + '개 (' + 범위 + ')' }
      줄.push({ key: '세:' + key, 켬: true, 구분, 품명: s.이름, 규격: '', 단위, 수량: v, 근거, 도면: f.이름 })
      세기줄.push({ 구분, 이름: s.이름, 단위, 수량: v, 범위, 도면: f.이름 })
    }
    for (const x of 줄) { const g = 고침[x.key]; if (g) { if (g.품명 !== undefined) x.품명 = g.품명; if (g.규격 !== undefined) x.규격 = g.규격 } }
    return { 줄, 켠줄: 줄.filter((x) => x.켬), 토공들, 세기줄 }
  }, [철, 량, 파일들, 토공설정, 세기고름, 세기네모, 고침, 켬고침, 딴줄, 골결과])  // eslint-disable-line react-hooks/exhaustive-deps
  const 켜기 = (key, v) => set켬고침((P) => ({ ...P, [key]: v }))

  /* ── 내역 대조 ── */
  /* 📥 골조는 «뜻» 으로 짝(레미콘 강도 · 철근 지름 · 가공조립 = 철근 전체 · 타설 = 콘크리트 전체 · 부재별 거푸집) — lib/내역채움.js */
  const 골보탬 = useMemo(() => {
    try {
      if (골결과) return 골조보탬(골결과, ((골공사 && 골공사.기준) || {}).버림 || 골조기준값().버림)
      if (딴화면.골조 && 딴저장.골조) return 골조보탬(골조셈(딴저장.골조), ((딴저장.골조.기준 || {}).버림) || 골조기준값().버림)
    } catch (e) { /* 보탬 없이 */ }
    return []
  }, [골결과, 골공사, 딴화면, 딴저장])
  const 대조판 = useMemo(() => {
    if (!내역) return null
    const 기본 = [...산출.켠줄, ...골보탬]
    const { 규칙, 더 } = 골조짝(기본, 내역.줄)
    const 도면 = [...기본, ...더]
    return { 도면, 결과: 대조하기(도면, 내역.줄, 짝고침, 1, 규칙) }
  }, [내역, 산출, 골보탬, 짝고침])
  const 대조 = 대조판 ? 대조판.결과 : null
  const 넣 = useMemo(() => (대조 ? 넣을것(대조, 넣기옵션) : null), [대조, 넣기옵션])
  const 넣맵 = useMemo(() => new Map((넣 ? 넣.바꿀 : []).map((x) => [x.id, x])), [넣])
  const 내역이름 = 내역 ? String(내역.이름 || '내역서.xlsx').replace(/\s*\([^)]*\)\s*$/, '') : ''
  const 내역csv = /\.(csv|txt|tsv)$/i.test(내역이름)
  /** 받은 내역서 «그 파일» 에 수량만 넣은 것 */
  const 넣은파일 = (알림 = true) => {
    if (!내역 || !내역.원본 || !넣 || !넣.바꿀.length) return null
    // 단가 채우기로 보낼 때는 «물량 넣은 곳» 시트를 빼고 보냄 — 그 시트까지 내역으로 읽어 단가를 넣지 않게
    const r = 내역csv ? csv바꾸기(내역.원본, 넣.바꿀) : 셀바꾸기(내역.원본, 넣.바꿀, { 도면: 파일들.map((f) => f.이름).join(', '), 알림 })
    const 이름 = /\.[^.]+$/.test(내역이름) ? 내역이름.replace(/(\.[^.]+)$/, '_물량넣음$1') : 내역이름 + '_물량넣음.xlsx'
    set넣은말({ 됨: r.됨.length, 안됨: r.안됨, 이름 })
    return { ...r, 이름 }
  }
  const 넣은내역받기 = () => {
    try {
      const r = 넣은파일()
      if (!r) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([r.bytes], { type: 내역csv ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      a.download = r.이름
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 60000)
      askAfter('jeoksan')
    } catch (e) { set넣은말({ 오류: String(e.message || e) }) }
  }
  const 단가로 = () => {
    try {
      const r = 넣은파일(false)
      if (!r) return
      내역넘기기({ 이름: r.이름, 바이트: r.bytes })
      가기('/jeoksan/fill')
    } catch (e) { set넣은말({ 오류: String(e.message || e) }) }
  }
  const 대조줄 = 대조 ? 대조.줄.filter((r) => 대조거르기 === '모두' || (대조거르기 === '다름' ? r.도면 && r.판정 !== '같음' : 대조거르기 === '같음' ? r.판정 === '같음' : !r.도면)) : []

  /* ── 실·마감·창호 (지금 도면) ── */
  const 지금전부 = cur ? 전부(cur) : null

  const 엑셀받기 = async () => {
    set받는중(true)
    try {
      const { writeWorkbook, ST } = await import('../lib/qtoxlsx.js')
      const 추가 = []
      if (대조) for (const t of 대조시트(대조, ST)) 추가.push(t)
      for (const f of 파일들) {
        const R = 전부(f)
        const 앞 = 파일들.length > 1 ? f.이름.replace(/\.dxf.*$|\.dwg.*$|\s*\(.*$/i, '') + ' ' : ''
        if (R.실.length) 추가.push({ name: 앞 + '실', head: ['층(짐작)', '실 이름', '면적(m²)', '둘레(m)', '레이어'], rows: R.실.map((r) => [r.층, r.이름, { v: Math.round(r.면적 * 1000) / 1000, st: ST.QTY }, Number.isFinite(r.둘레) ? { v: Math.round(r.둘레 * 1000) / 1000, st: ST.QTY } : '', r.레이어]), widths: [9, 22, 12, 12, 16], freeze: 1 })
        if (R.마감) 추가.push({ name: 앞 + '마감 실별', head: ['층', '실명', '부위', '마감', '재료', '단위', '산출근거', '수량', '비고'], rows: R.마감.결과.줄.filter((x) => x.부위 !== '창호').map((x) => [x.층, x.실명, x.부위, x.기호, x.재료, x.단위, { v: x.식, st: ST.BOX }, { f: 'ROUND(' + x.식 + ',3)', st: ST.QTY }, { v: x.비고, st: ST.GRAY }]), widths: [6, 14, 8, 8, 18, 6, 36, 12, 30], freeze: 1 })
        if (R.마감표.length) 추가.push({ name: 앞 + '실내재료마감표(읽음)', head: ['층', '실명', '바닥', '걸레받이', '벽', '천장', '천장고(m)'], rows: R.마감표.map((m) => [m.층 || '', m.실명, m.바닥, m.걸레받이, m.벽, m.천장, m.천장고 ? +m.천장고 : '']), widths: [9, 18, 34, 22, 34, 34, 10], freeze: 1 })
        if (R.창호.length) 추가.push({ name: 앞 + '창호 대조', head: ['기호', '구분', '폭(m)', '높이(m)', '창호일람표 수량', '평면 기호 개수', '맞음'], rows: R.창호.map((w) => [w.기호, w.구분, +w.폭, +w.높이, w.표수 ?? '', w.도면, w.표수 === null ? '표에 수량 없음' : w.다름 ? '다름' : '같음']), widths: [8, 6, 8, 8, 14, 14, 12], freeze: 1 })
      }
      if (골결과) for (const t of 골조시트들(골공사, 골결과, ST)) 추가.push(t)
      const bytes = 자.자동엑셀({ 줄: 산출.켠줄, 철근줄: 철.줄, 토공들: 산출.토공들, 표들: 모든표, 세기줄: 산출.세기줄, 추가 }, writeWorkbook, ST)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      a.download = (대조 ? '도면물량_내역대조.xlsx' : '도면물량_수량산출서.xlsx')
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 60000)
      askAfter('jeoksan')
    } finally { set받는중(false) }
  }

  /* 🏗 골조만 따로 — 골조 화면의 엑셀과 같은 양식(산출서·집계·층별·배근표·주자료·검산) */
  const 골엑셀받기 = async () => {
    if (!골결과) return
    set받는중(true)
    try {
      const { writeWorkbook, ST } = await import('../lib/qtoxlsx.js')
      const bytes = 골조엑셀(골공사, 골결과, writeWorkbook, ST)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      a.download = '골조_수량산출서(도면 자동).xlsx'
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 60000)
      askAfter('jeoksan')
    } finally { set받는중(false) }
  }
  /* 🏗 골조 화면에서 고치기 — 이 브라우저의 골조 화면(localStorage)에 넣고 그 화면으로. 적어 둔 것이 있으면 먼저 여쭘 */
  const 골옮기기 = (묻지않음) => {
    if (!골공사) return
    let 있음 = false
    try { const t = JSON.parse(localStorage.getItem(골조열쇠) || 'null'); 있음 = !!(t && ((t.동 || []).some((d) => Object.values(d.주자료 || {}).some((a) => a && a.length)) || Object.values(t.주자료 || {}).some((a) => a && a.length))) } catch (e) { 있음 = false }
    if (있음 && !묻지않음) { set골옮김('묻기'); return }
    try {
      if (있음) localStorage.setItem(골조열쇠 + '.전', localStorage.getItem(골조열쇠))
      localStorage.setItem(골조열쇠, JSON.stringify(골공사))
      set골옮김('됨')
    } catch (e) { set골옮김(''); set알림({ 글: '이 브라우저에 넣지 못했습니다(저장 공간이 가득 찼거나 사생활 창).' }) }
  }

  /* ── 도면 위 네모 · 강조 ── */
  const 네모들 = useMemo(() => {
    if (!cur) return []
    if (탭 === '표') return cur.표들.map((t) => ({ r: t.r, color: 종색[t.종류], 글: t.제목, dash: 표뺌.has(cur.id + ':' + t.id) }))
    if (탭 === '토공' && 토공) {
      const out = [{ r: 토공.본.네모, color: '#22c55e', 글: '본 — ' + (cur.모델.T.s[토공.본.측점] || ''), w: 2.5 }]
      const [a, b, c, d] = 토공.본.네모상대
      for (const p of 노선.점) if (p.i !== 토공.본.측점) out.push({ r: [p.x + a, p.y + b, p.x + c, p.y + d], color: '#22c55e', dash: true, w: 1 })
      return out
    }
    if (탭 === '세기' && 세기네모[cur.id]) return [{ r: 세기네모[cur.id], color: '#38bdf8', 글: '범위', w: 2 }]
    if (탭 === '실' && 지금전부) return 지금전부.실.map((r) => ({ r: r.b, color: '#a855f7', 글: r.이름 + ' ' + 쉼(r.면적, 2) + 'm²', w: 1.5 }))
    if (탭 === '골조' && 골 && 골.근거) {
      const 번 = 파일들.indexOf(cur)
      const T = cur.모델.T
      return 골.근거.filter((g) => g.번 === 번).map((g) => {
        const 슬 = /^(R|\d)?[A-Z]?S\d/.test(g.글)
        if (g.상자) return { r: g.상자, color: 슬 ? '#38bdf8' : '#f59e0b', 글: 슬 ? '' : g.글.split(' ')[0], w: 1.5, dash: 슬 }
        const h = T.h[g.i] || 1
        return { r: [T.x[g.i] - h * 0.5, T.y[g.i] - h * 0.5, T.x[g.i] + h * 2.8, T.y[g.i] + h * 1.5], color: '#22c55e', w: 2 }
      })
    }
    return []
  }, [cur, 탭, 토공, 노선, 표뺌, 세기네모, 지금전부, 골, 파일들])
  const 강조 = useMemo(() => {
    if (!cur || 탭 !== '토공' || !토공) return []
    const ids = []
    for (const p of 토공.읽음) for (const i of p.글자) ids.push(cur.모델.T.e[i])
    return [{ ids, color: '#22c55e', w: 2 }]
  }, [cur, 탭, 토공])

  const 찍었다 = (e, x, y) => {
    if (!cur) return
    if (탭 === '실' && 지금전부) {
      const r = 지금전부.실.find((q) => x >= q.b[0] && x <= q.b[2] && y >= q.b[1] && y <= q.b[3])
      set알림(r ? { 글: '«' + r.이름 + '» 면적 ' + 쉼(r.면적, 3) + ' m² · 둘레 ' + (Number.isFinite(r.둘레) ? 쉼(r.둘레, 3) + ' m' : '—'), 좋음: true } : { 글: '보라 네모가 찾은 실입니다. 실 이름 글자를 품은 가장 작은 닫힌 선입니다.', 좋음: true })
      return
    }
    if (탭 === '표') {
      const t = cur.표들.find((q) => x >= q.r[0] && x <= q.r[2] && y >= q.r[1] && y <= q.r[3])
      if (t) { set펼친표(cur.id + ':' + t.id); set알림({ 글: '«' + t.제목 + '» 를 아래에 펼쳤습니다.', 좋음: true }) }
      else set알림({ 글: '표(색 네모) 안을 누르면 아래에 그 표를 펼칩니다.', 좋음: true })
      return
    }
    if (e >= 0 && cur.모델.E.t[e] === 종류.글자) set알림({ 글: '누른 글자: «' + 도형글자(cur.모델, e) + '»', 좋음: true })
  }
  const 네모찍었다 = (r) => {
    if (!cur) return
    if (네모잡기 === '세기') { set세기네모((P) => ({ ...P, [cur.id]: r })); set네모잡기(''); set알림({ 글: '네모 안의 것만 셉니다.', 좋음: true }); return }
    if (네모잡기 === '토공' && 노선) {
      const 안 = 노선.점.filter((p) => p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3])
      if (!안.length) { set알림({ 글: '네모 안에 측점 글자(STA…)가 들어가게 한 측점의 표를 감싸 주십시오.' }); return }
      토설고치기({ 기준i: 안[0].i, 네모: r })
      set네모잡기('')
      set알림({ 글: 안[0].글 + ' 둘레를 본으로 삼았습니다 — 모든 측점에서 같은 자리의 숫자를 읽습니다.', 좋음: true })
    }
  }

  const 안내 = 네모잡기
    ? <>🟦 <b>도면에서 끌어서 네모를 그리십시오</b> (도면 옮기기는 <b>오른쪽 단추로 끌기</b>) — {네모잡기 === '토공' ? '측점 하나의 면적표(측점 글자 포함)를 감싸면 그것을 본으로 삼습니다.' : '그 안의 레이어·블록·글자만 셉니다.'} <button type="button" className="chip" onClick={() => set네모잡기('')}>그만</button></>
    : 탭 === '표' ? <>색 네모가 찾은 표입니다 (<b style={{ color: 종색.철근 }}>철근</b> · <b style={{ color: 종색.수량 }}>수량</b> · <b style={{ color: '#94a3b8' }}>그 밖</b>). 네모 안을 누르면 아래에 펼칩니다.</>
      : 탭 === '토공' ? <>초록 실선 = 본(한 측점의 표), 점선 = 같은 자리를 읽은 측점들, 초록 글자 = 읽은 숫자.</>
        : 탭 === '실' ? <>보라 네모 = 찾은 실(실 이름 글자를 품은 가장 작은 닫힌 선). 누르면 면적·둘레를 알려 드립니다.</>
          : 탭 === '골조' ? <>주황 네모 = 읽은 보 한 칸(안목) · 파란 점선 = 슬래브 한 칸(보 가운데까지) · 초록 = 센 기둥·기초 기호. 끌면 옮기기 · 휠 = 확대.</>
          : <>끌면 옮기기 · 휠·두 손가락 = 확대. 범위를 좁히려면 «네모로 범위» 를 누르십시오.</>

  /** ⑥ 의 체크 — 자동으로 넣은 것이면 켬/끔, 아니면 사람이 고름 */
  const 세칸 = (종, 이름) => {
    if (!cur) return {}
    const ak = 자동키(종, 이름)
    const x = 지금전부 && 지금전부.항목.find((q) => q.key === ak)
    if (x) {
      const key = 'all:' + cur.id + ':' + ak
      const on = Object.prototype.hasOwnProperty.call(켬고침, key) ? 켬고침[key] : x.켬
      return { checked: on, onChange: () => 켜기(key, !on), title: '자동으로 넣은 것 — 끄면 뺍니다' }
    }
    const mk = cur.id + ':' + 종 + ':' + 이름
    return { checked: !!세기고름[mk], onChange: () => 세고르기(set세기고름, mk, { fid: cur.id, 종, 이름 }), title: '체크하면 물량에 넣습니다' }
  }
  const 표수 = 모든표.length
  const 측수 = 파일들.reduce((s, f) => s + f.노선.reduce((t, g) => t + g.점.length, 0), 0)

  return (
    <div className="wrap gg ja">
      <div className="card no-print">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>⚡ 도면 물량 자동 <span className="count">· 도면을 넣으면 모든 물량 · 내역서와 대조</span></h1>
        <div className="note sm">
          <b>도면을 넣기만 하면</b> 누를 것 없이 모든 물량을 뽑습니다 — 토목·건축 모두.
          <b>철근 재료표 · 수량표</b> · 횡단면 <b>깎기·쌓기(평균단면법)</b> · <b>관로·측구·경계석·포장</b>(레이어 이름으로) · <b>맨홀·집수정·가로등·수목</b>(블록) ·
          <b>창호 기호 개수</b> · <b>실(방) 면적</b> · <b>바닥·벽·천장 마감</b>(실내재료마감표가 있으면) ·
          <b>골조 — 보·기둥·슬래브·벽·기초의 콘크리트·거푸집·철근</b>(구조평면도 + 부재 일람표가 있으면).
          <b>내역서(엑셀)</b>를 넣으면 줄마다 도면 물량과 <b>대조</b>해 다른 곳을 찾아 드리고, <b>빈 수량 칸은 도면 물량으로 채워</b> 그 파일 그대로 돌려 드립니다. 전부 <b>엑셀</b>로 받습니다.
        </div>
        <div className="pdfsafe">🔒 <b>도면은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 읽고 셉니다 · 회원가입 없음 · 무료</div>
        <div className="btn-row gg-top">
          <button type="button" className="btn sm" onClick={() => 파일칸.current?.click()}>📂 도면 넣기 (DXF·DWG · 여러 장)</button>
          <button type="button" className="btn sm" onClick={() => 내역칸.current?.click()}>📑 내역서 넣기 (대조 · xlsx·csv)</button>
          <button type="button" className="btn line sm" onClick={예시열기}>🧪 예시로 해 보기</button>
          {산출.켠줄.length > 0 && <button type="button" className="btn ghost sm" disabled={받는중} onClick={엑셀받기}>{받는중 ? '만드는 중…' : '⬇ 엑셀 받기'}</button>}
        </div>
        <input ref={파일칸} type="file" multiple accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1}
          onChange={(e) => { 열기(e.target.files); e.target.value = '' }} />
        <끌어놓기판 글="도면(DXF·DWG)은 도면으로, 내역서(엑셀·CSV)는 대조로 — 여러 장도 됩니다"
          길들={[{ 꼴: /\.(dxf|dwg)$/i, 받기: (fs) => 열기(fs), 여럿: true }, { 꼴: /\.(xlsx|csv)$/i, 받기: (fs) => 내역열기(fs) }]} />
        <input ref={내역칸} type="file" accept=".xlsx,.XLSX,.csv,.CSV" className="sr-only" tabIndex={-1}
          onChange={(e) => { 내역열기(e.target.files); e.target.value = '' }} />
        <도면상태줄 상태={상태} />
        {파일들.length > 0 && (
          <div className="ja-files">
            {파일들.map((f, k) => (
              <span key={f.id} className={'chip' + (k === 지금 ? ' on' : '')}>
                <button type="button" className="ja-fbtn" onClick={() => set지금(k)} title="이 도면 보기">📐 {f.이름}</button>
                <span className="ja-fmeta">표 {f.표들.length} · 측점 {f.노선.reduce((s, g) => s + g.점.length, 0)}</span>
                <button type="button" className="ja-fx" onClick={() => 빼기(f.id)} aria-label={f.이름 + ' 빼기'}>✕</button>
              </span>
            ))}
          </div>
        )}
        {파일들.length > 0 && (
          <div className="ja-sum">이 도면{파일들.length > 1 ? '들' : ''}에서 뽑은 물량 <b>{산출.켠줄.length}줄</b> ·{' '}<b>표 {표수}개</b>
            {표수 > 0 && <> (철근 재료표 {모든표.filter((t) => t.종류 === '철근').length} · 수량표 {모든표.filter((t) => t.종류 === '수량').length} · 그 밖 {모든표.filter((t) => t.종류 === '기타').length})</>}
            {' · '}<b>측점 {측수}개</b> · <b>실 {파일들.reduce((a, f) => a + 전부(f).실.length, 0)}개</b>{cur ? <> · 레이어 {cur.모델.layers.length} · 블록 {new Set(cur.모델.I.map((i) => i.name).filter((n) => !/^\*/.test(n))).size}종</> : null}
            {내역 && <> · 내역서 <b>{내역.줄.length}줄</b></>}
          </div>
        )}
      </div>

      <div className="tp-tabs no-print" role="tablist">
        {[['산출', '① 물량 전부'], ['골조', '② 골조(보·기둥·슬래브)'], ['대조', '③ 내역 대조'], ['표', '④ 도면의 표'], ['토공', '⑤ 토공'], ['세기', '⑥ 레이어·블록·글자'], ['실', '⑦ 실·마감·창호']].map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'tp-tab' + (탭 === k ? ' on' : '')} onClick={() => {
            set탭(k); set네모잡기(''); set알림({ 글: '' })
            // 🏗 골조 탭 — 지금 도면에 읽은 부재가 없으면 가장 많이 읽은 도면(구조평면도)을 보여 줌
            if (k === '골조' && 골 && 골.근거 && 골.근거.length) {
              const 셈 = new Map(); for (const g of 골.근거) 셈.set(g.번, (셈.get(g.번) || 0) + 1)
              if (!셈.get(지금)) { const 첫 = [...셈].sort((a, b) => b[1] - a[1])[0]; if (첫) set지금(첫[0]) }
            }
          }}>{t}</button>
        ))}
      </div>

      {탭 !== '산출' && 탭 !== '대조' && (
        <도면판 도={도} 찍었다={찍었다} 강조={강조} 네모={!!네모잡기} 네모찍었다={네모찍었다} 네모들={네모들} 가볼곳={가볼곳}
          알림={알림.글} 알림좋음={알림.좋음} 안내={안내} 열기={() => 파일칸.current?.click()} 두점단추={false} 붙음={false}
          빈글="수량표·철근 재료표가 있는 도면, 횡단면도, 평면도를 여세요. 여러 장을 한꺼번에 열어도 됩니다." />
      )}

      {탭 === '표' && (
        <div className="card no-print">
          {!파일들.length && <p className="muted">도면을 여시면 «~표» 제목이 붙은 표(철근 재료표 · 수량표 · 재료표 · 집계표 …)를 모두 찾습니다.</p>}
          {파일들.length > 0 && !표수 && <p className="muted">«~표» 제목이 붙은 수량 표를 찾지 못했습니다. 횡단면도라면 ⑤ 토공을, 평면도라면 ⑥ 레이어·블록·글자를 보십시오.</p>}
          {철.합.length > 0 && (
            <div className="gg-sec">
              <div className="detail-h">🔩 철근 — 직경별 (도면의 철근 재료표 {모든표.filter((t) => t.종류 === '철근' && !표뺌.has(t.key)).length}개)</div>
              <div className="gg-wrap"><table className="gg-r">
                <thead><tr><th>규격</th><th>도면 표기</th><th>총길이(m)</th><th>단위무게(kg/m)</th><th>무게(kg)</th><th>무게(ton)</th></tr></thead>
                <tbody>{철.합.map((a) => (
                  <tr key={a.d}><td>{a.d}</td><td>{a.규격들}</td><td className="r">{쉼(a.총길이m, 3)}</td><td className="r">{철근표[a.d][1]}</td><td className="r">{쉼(a.kg, 1)}</td><td className="r"><b>{쉼(a.kg / 1000, 3)}</b></td></tr>
                ))}
                  <tr className="ja-tot"><td colSpan={4}>합계</td><td className="r">{쉼(철.합.reduce((s, a) => s + a.kg, 0), 1)}</td><td className="r"><b>{쉼(철.합.reduce((s, a) => s + a.kg, 0) / 1000, 3)}</b></td></tr>
                </tbody>
              </table></div>
              {철.검산.length > 0 && <ul className="gg-warns">{철.검산.slice(0, 20).map((w, k) => <li key={k}>⚠️ {w}</li>)}</ul>}
              <p className="muted gg-hint">무게는 표에 적힌 «길이×개수(없으면 총길이)» 에 KS D 3504 단위무게를 곱한 값입니다. 표의 소계와 다르면 위에 ⚠️ 로 적습니다. H·HD·SD 표기는 지름 숫자로 맞춥니다.</p>
            </div>
          )}
          {량.length > 0 && (
            <div className="gg-sec">
              <div className="detail-h">📋 수량표 — 품명·규격·단위별</div>
              <div className="gg-wrap"><table className="gg-r">
                <thead><tr><th>품명</th><th>규격</th><th>단위</th><th className="r">수량</th><th>도면</th></tr></thead>
                <tbody>{량.map((a, k) => <tr key={k}><td>{a.품명}</td><td>{a.규격}</td><td className="u">{단위풀이(a.단위)}</td><td className="r"><b>{쉼(a.수량, 3)}</b><span className="단">{단위보기(a.단위)}</span></td><td className="note2">{a.도면}</td></tr>)}</tbody>
              </table></div>
            </div>
          )}
          {표수 > 0 && (
            <div className="gg-sec">
              <div className="detail-h">찾은 표 {표수}개 — 체크한 표만 산출서에 넣습니다 (엑셀에는 모든 표를 그대로 옮깁니다)</div>
              <div className="ja-list">
                {모든표.map((t) => (
                  <div key={t.key} className={'ja-t' + (펼친표 === t.key ? ' open' : '')}>
                    <div className="ja-th">
                      <label className="ja-chk"><input type="checkbox" checked={!표뺌.has(t.key)} disabled={t.종류 === '기타'}
                        onChange={() => set표뺌((P) => { const s = new Set(P); if (s.has(t.key)) s.delete(t.key); else s.add(t.key); return s })} /></label>
                      <b>{t.제목글 || t.제목}</b>
                      <span className="ja-kind" style={{ borderColor: 종색[t.종류], color: 종색[t.종류] }}>{종이름[t.종류]}</span>
                      <span className="muted ja-meta">{t.줄.length}줄 · {t.도면}</span>
                      <button type="button" className="chip" onClick={() => { const k = 파일들.findIndex((f) => f.id === t.fid); set지금(k); set가볼곳({ r: t.r, n: Date.now() }) }}>도면에서 보기</button>
                      <button type="button" className="chip" onClick={() => set펼친표(펼친표 === t.key ? null : t.key)}>{펼친표 === t.key ? '접기' : '펼치기'}</button>
                    </div>
                    {펼친표 === t.key && (
                      <div className="gg-wrap ja-tbl"><table className="gg-r">
                        <thead><tr>{t.머리.map((h, j) => <th key={j} title={t.뜻[j] ? '뜻: ' + t.뜻[j] : ''}>{h || '칸' + (j + 1)}</th>)}</tr></thead>
                        <tbody>{t.줄.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={자.숫자인가(c) ? 'r' : ''}>{c}</td>)}</tr>)}</tbody>
                      </table></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {탭 === '토공' && (
        <div className="card no-print">
          {!cur && <p className="muted">횡단면도를 여시면 측점(STA·NO)마다 적힌 깎기·쌓기 면적을 읽어 평균단면법으로 셉니다.</p>}
          {cur && !노선들.length && <p className="muted">이 도면에서 측점 글자(STA.0+020 · NO.5+10 …)를 찾지 못했습니다. 횡단면도가 맞는지 보십시오.</p>}
          {cur && 노선 && 토공 && (
            <>
              <div className="tp-subtabs">
                {노선들.map((g) => (
                  <button key={g.번호} type="button" className={'chip' + (g.번호 === 노선.번호 ? ' on' : '')} onClick={() => set고른노선(g.번호)}>
                    노선 {g.번호} <span className="gg-n">측점 {g.점.length} · {g.점[0].글.replace(/^STA\.?/i, '')}~{g.점[g.점.length - 1].글.replace(/^STA\.?/i, '')}</span></button>
                ))}
              </div>
              {노선들.length > 1 && <p className="muted gg-hint">측점 글자가 놓인 세로 줄로 노선을 나눴습니다(같은 측점이 두 번 나오면 다른 노선). 노선마다 따로 셉니다.</p>}
              <div className="btn-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                <label className="ja-put"><input type="checkbox" checked={(토공설정[토공키] || {}).넣기 !== false} onChange={(e) => 토설고치기({ 넣기: e.target.checked })} /> 이 노선을 물량에 넣기</label>
                <button type="button" className="chip" onClick={() => set가볼곳({ r: 토공.본.네모, n: Date.now() })}>본 보기</button>
                <button type="button" className={'chip' + (네모잡기 === '토공' ? ' on' : '')} onClick={() => set네모잡기(네모잡기 === '토공' ? '' : '토공')}>🟩 본 네모 다시 잡기</button>
                {(토공설정[토공키] || {}).네모 && <button type="button" className="chip" onClick={() => 토설고치기({ 네모: null, 기준i: null })}>본 짐작으로 되돌리기</button>}
              </div>
              <p className="muted gg-hint">한 측점의 표를 <b>본</b>으로 삼아, 모든 측점에서 <b>같은 자리</b>의 숫자를 읽습니다. 이름은 숫자 왼쪽의 글(과 세로로 쓴 묶음 글)에서 땄습니다 — 고쳐 쓰십시오. 빈 칸은 0 입니다.</p>
              <div className="gg-wrap"><table className="gg-r">
                <thead><tr><th>쓰기</th><th>이름</th><th>단위</th><th>읽은 측점</th><th className="r">합계 수량</th></tr></thead>
                <tbody>{토공.칸.map((c, j) => (
                  <tr key={j} className={c.쓰기 ? '' : 'ja-off'}>
                    <td><input type="checkbox" checked={c.쓰기} onChange={(e) => 토설고치기({ 칸: { ...((토공설정[토공키] || {}).칸 || {}), [j]: { ...(((토공설정[토공키] || {}).칸 || {})[j] || {}), 쓰기: e.target.checked } } })} /></td>
                    <td><input className="ja-in" value={c.이름} onChange={(e) => 토설고치기({ 칸: { ...((토공설정[토공키] || {}).칸 || {}), [j]: { ...(((토공설정[토공키] || {}).칸 || {})[j] || {}), 이름: e.target.value } } })} /></td>
                    <td><select value={c.단위} onChange={(e) => 토설고치기({ 칸: { ...((토공설정[토공키] || {}).칸 || {}), [j]: { ...(((토공설정[토공키] || {}).칸 || {})[j] || {}), 단위: e.target.value } } })}>
                      <option value="㎡">면적 m² → m³</option><option value="m">길이 m → m²</option></select></td>
                    <td className="r">{c.n}</td>
                    <td className="r"><b>{c.쓰기 ? 쉼(토공.결과.합[j], 3) + (c.단위 === 'm' ? ' m²' : ' m³') : '—'}</b></td>
                  </tr>
                ))}</tbody>
              </table></div>
              <div className="detail-h" style={{ marginTop: 12 }}>측점별 읽은 값</div>
              <div className="gg-wrap ja-tbl"><table className="gg-r">
                <thead><tr><th>쓰기</th><th>측점</th><th>거리(m)</th><th>찾음</th>{토공.칸.map((c, j) => (c.쓰기 ? <th key={j}>{c.이름}</th> : null))}<th /></tr></thead>
                <tbody>{토공.읽음.slice().sort((a, b) => a.측 - b.측).map((p) => {
                  const 뺌 = ((토공설정[토공키] || {}).점뺌 || []).includes(p.i)
                  return (
                    <tr key={p.i} className={뺌 ? 'ja-off' : (p.찾음 === 0 ? 'warn' : '')}>
                      <td><input type="checkbox" checked={!뺌} onChange={() => { const a = new Set((토공설정[토공키] || {}).점뺌 || []); if (a.has(p.i)) a.delete(p.i); else a.add(p.i); 토설고치기({ 점뺌: [...a] }) }} /></td>
                      <td>{p.글}</td><td className="r">{쉼(p.측, 3)}</td><td className="r">{p.찾음}</td>
                      {토공.칸.map((c, j) => (c.쓰기 ? <td key={j} className="r">{p.값[j] ? 쉼(p.값[j], 3) : ''}</td> : null))}
                      <td><button type="button" className="chip" onClick={() => { const [a, b, c, d] = 토공.본.네모상대; set가볼곳({ r: [p.x + a, p.y + b, p.x + c, p.y + d], n: Date.now() }) }}>보기</button></td>
                    </tr>
                  )
                })}</tbody>
              </table></div>
              <p className="muted gg-hint">같은 측점이 두 번 있으면 숫자를 더 많이 찾은 쪽을 씁니다. 찾은 칸이 0 인 측점(노란 줄)은 표가 없는 자리(평면도의 측점 표시 등)일 수 있습니다 — 체크를 풀면 뺍니다.</p>
            </>
          )}
        </div>
      )}

      {탭 === '세기' && (
        <div className="card no-print">
          {!cur && <p className="muted">평면도를 여시면 레이어별 선 길이·닫힌 면적, 블록 개수, 글자(기호) 개수를 셉니다.</p>}
          {cur && 세 && (
            <>
              <div className="btn-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                <span className="ja-put">범위: <b>{세기네모[cur.id] ? '네모 안' : '도면 전체'}</b></span>
                <button type="button" className={'chip' + (네모잡기 === '세기' ? ' on' : '')} onClick={() => set네모잡기(네모잡기 === '세기' ? '' : '세기')}>🟦 네모로 범위</button>
                {세기네모[cur.id] && <button type="button" className="chip" onClick={() => set세기네모((P) => { const o = { ...P }; delete o[cur.id]; return o })}>범위 지우기</button>}
                <span className="muted" style={{ fontSize: 12 }}>꺼 둔 레이어는 세지 않습니다 · 단위 {cur.단위 ? cur.단위.글 : ''}</span>
              </div>
              <p className="muted gg-hint">체크한 것이 ① 물량 전부에 들어갑니다. <b>초록 딱지</b>는 이름으로 뜻을 짐작해 <b>저절로 넣은 것</b>(관로·측구·경계석·포장·맨홀·집수정·가로등·수목…)입니다. 뜻을 모르는 레이어는 사람이 고르십시오 — 품명은 ①에서 고쳐 씁니다.</p>
              <div className="detail-h">레이어 ({세.층.length})</div>
              <div className="gg-wrap ja-tbl"><table className="gg-r">
                <thead><tr><th>길이</th><th>면적</th><th>레이어</th><th>선</th><th>길이(m)</th><th>닫힌 도형</th><th>면적(m²)</th><th>글자</th></tr></thead>
                <tbody>{세.층.map((a) => {
                  return (
                    <tr key={a.i}>
                      <td>{a.선수 > 0 && <input type="checkbox" {...세칸('길이', a.이름)} />}</td>
                      <td>{a.면수 > 0 && <input type="checkbox" {...세칸('면적', a.이름)} />}</td>
                      <td>{a.이름}{전.레이어뜻(a.이름) && !전.레이어뜻(a.이름).주석 ? <span className="ja-kind" style={{ marginLeft: 6, borderColor: '#22c55e', color: '#22c55e' }}>{전.레이어뜻(a.이름).품명}</span> : null}</td><td className="r">{a.선수}</td><td className="r">{a.선수 ? 쉼(a.길이m, 3) : ''}</td><td className="r">{a.면수 || ''}</td><td className="r">{a.면수 ? 쉼(a.면적m2, 3) : ''}</td><td className="r">{a.글수 || ''}</td>
                    </tr>
                  )
                })}</tbody>
              </table></div>
              <div className="detail-h" style={{ marginTop: 12 }}>블록 ({세.블록.length}종)</div>
              {!세.블록.length && <p className="muted">블록이 없습니다.</p>}
              {세.블록.length > 0 && <div className="gg-wrap ja-tbl"><table className="gg-r">
                <thead><tr><th>넣기</th><th>블록 이름</th><th>개수</th><th>레이어</th></tr></thead>
                <tbody>{세.블록.map((b) => { const 뜻 = 전.블록뜻(b.이름); return <tr key={b.이름}><td><input type="checkbox" {...세칸('블록', b.이름)} /></td><td>{b.이름}{뜻.주석 ? <span className="muted" style={{ fontSize: 11 }}> (주석으로 봄)</span> : 뜻.품명 && 뜻.품명 !== b.이름 ? <span className="ja-kind" style={{ marginLeft: 6, borderColor: '#22c55e', color: '#22c55e' }}>{뜻.품명}</span> : null}</td><td className="r"><b>{b.수}</b></td><td className="note2">{b.층}</td></tr> })}</tbody>
              </table></div>}
              <div className="detail-h" style={{ marginTop: 12 }}>글자 (기호) 개수</div>
              <input className="ja-search" value={글찾기} placeholder="찾을 글자 (예: WD, C1, 맨홀) — 비우면 두 번 넘게 나온 짧은 글자" onChange={(e) => set글찾기(e.target.value)} />
              <div className="gg-wrap ja-tbl"><table className="gg-r">
                <thead><tr><th>넣기</th><th>글자</th><th>개수</th></tr></thead>
                <tbody>{세.글.filter((g) => (글찾기.trim() ? g.글.toUpperCase().includes(글찾기.trim().toUpperCase()) : (g.수 >= 2 && !g.숫자 && 자.붙임(g.글).length >= 2 && g.글.length <= 12))).slice(0, 300).map((g) => {
                  return <tr key={g.글}><td><input type="checkbox" {...세칸('글자', g.글)} /></td><td>{g.글}</td><td className="r"><b>{g.수}</b></td></tr>
                })}</tbody>
              </table></div>
            </>
          )}
        </div>
      )}

      {탭 === '골조' && (
        <div className="card gg-print">
          <div className="gg-head">
            <div>
              <div className="detail-h" style={{ margin: 0 }}>🏗 골조 — 보·기둥·슬래브·벽·기초 (도면에서 자동)</div>
              <div className="muted" style={{ fontSize: 12.5 }}>구조평면도 + 부재 일람표에서 저절로 셉니다 · 도면: {골도면 || '—'}</div>
            </div>
            <div className="btn-row no-print" style={{ flexWrap: 'wrap' }}>
              {골결과 && <button type="button" className="btn sm" disabled={받는중} onClick={골엑셀받기}>{받는중 ? '만드는 중…' : '⬇ 골조 산출서 엑셀'}</button>}
              {골결과 && <button type="button" className="btn line sm" onClick={() => 골옮기기(false)}>🏗 골조 화면에서 고치기</button>}
              <button type="button" className="btn ghost sm" onClick={골조예시열기}>🧪 골조 예시 (가상 2층)</button>
            </div>
          </div>
          {골옮김 === '묻기' && (
            <div className="ja-gz-ask no-print">
              <b>골조 화면에 전에 적어 둔 것이 있습니다.</b> 도면에서 읽은 것으로 바꿀까요? (전에 적은 것은 이 브라우저에 한 벌 남겨 둡니다)
              <div className="btn-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn sm" onClick={() => 골옮기기(true)}>예, 바꾸기</button>
                <button type="button" className="btn ghost sm" onClick={() => set골옮김('')}>그만</button>
              </div>
            </div>
          )}
          {골옮김 === '됨' && (
            <div className="ja-gz-ok no-print">✅ 골조 화면에 넣었습니다. <Link to="/jeoksan/golgo"><b>🏗 골조 수량산출 열기 ›</b></Link> — 칸을 고치면 물량이 바로 다시 나옵니다(찍기는 고칠 때만).</div>
          )}
          {!파일들.length && <p className="muted"><b>구조평면도</b>(제목: «2층 구조평면도» · «지붕층 구조평면도» · «기초 평면도» · «2F FRAMING PLAN»)와 <b>부재 일람표</b>(보·기둥·슬래브·벽·기초의 크기와 철근)가 있는 도면을 넣으십시오. 여러 장으로 나뉘어 있어도 한꺼번에 넣으면 됩니다. 처음이면 <b>🧪 골조 예시</b>로 먼저 보십시오.</p>}
          {파일들.length > 0 && 골 && !골.있음 && (
            <div className="muted">
              <p>넣은 도면에서 셀 골조 부재를 찾지 못했습니다. 구조평면도(부재 기호 G1·C1·S1 …)와 <b>부재 일람표</b>가 같이 있어야 합니다.</p>
            </div>
          )}
          {골 && 골.경고 && 골.경고.length > 0 && (
            <>
              <ul className="gg-warns">{골.경고.slice(0, 골펼침 === '경고' ? 200 : 6).map((w, k) => <li key={k}>⚠️ {w}</li>)}</ul>
              {골.경고.length > 6 && <button type="button" className="chip no-print" onClick={() => set골펼침(골펼침 === '경고' ? '' : '경고')}>{골펼침 === '경고' ? '▲ 알림 접기' : '▼ 알림 ' + 골.경고.length + '개 모두 보기'}</button>}
            </>
          )}
          {골 && 골.있음 && 골결과 && (
            <>
              <div className="gg-tiles no-print">
                <div><span>콘크리트</span><b>{쉼(골결과.집계.합.filter((a) => a.항목 === '콘크리트').reduce((t, a) => t + a.산출, 0), 2)}</b> m³</div>
                <div><span>거푸집</span><b>{쉼(골결과.집계.합.filter((a) => a.항목 === '거푸집').reduce((t, a) => t + a.산출, 0), 2)}</b> m²</div>
                <div><span>철근</span><b>{쉼(골결과.집계.합.filter((a) => a.항목 === '철근').reduce((t, a) => t + a.산출, 0), 3)}</b> ton</div>
                <div><span>읽은 부재</span><b>{골셈글}</b></div>
              </div>
              <div className="gg-sec">
                <div className="detail-h">읽은 평면 → 층</div>
                <div className="ja-gz-plans">{골.읽음.평면.map((p, k) => <span key={k} className="chip">📐 {p.제목} → <b>{p.층.map((f) => (f === 'FT' ? '기초(FT)' : f + '층')).join('·')}</b> <span className="gg-n">기호 {p.기호수}</span></span>)}</div>
                <p className="muted gg-hint">«2층 구조평면도» 의 보·슬래브와 그 아래 기둥·벽은 <b>1층</b>으로 셉니다(골조 화면과 같은 규칙: n층 = n층 기둥·벽 + 그 위 바닥).</p>
              </div>
              <div className="gg-sec">
                <div className="detail-h">층 — 층고·슬래브 두께 <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>(고치면 바로 다시 셉니다)</span></div>
                <div className="gg-wrap"><table className="gg-r">
                  <thead><tr><th>층</th><th>층고(mm)</th><th>슬래브 두께(mm)</th><th>근거</th></tr></thead>
                  <tbody>{골공사.층.filter((f, i, a) => f.이름 !== 'FT' && i !== a.length - 1).map((f) => (
                    <tr key={f.이름}>
                      <td>{f.이름}층</td>
                      <td><input className="ja-in ja-num" inputMode="numeric" value={f.층고} onChange={(e) => set골고침((P) => ({ ...P, [f.이름]: { ...(P[f.이름] || {}), 층고: +e.target.value.replace(/[^\d]/g, '') || 0 } }))} aria-label={f.이름 + '층 층고'} /></td>
                      <td><input className="ja-in ja-num" inputMode="numeric" value={f.슬라브} onChange={(e) => set골고침((P) => ({ ...P, [f.이름]: { ...(P[f.이름] || {}), 슬라브: +e.target.value.replace(/[^\d]/g, '') || 0 } }))} aria-label={f.이름 + '층 슬래브 두께'} /></td>
                      <td className="note2">{골고침[f.이름] ? '✏️ 고친 값' : 골.읽음.층고짐작.includes(f.이름) ? <span className="ja-badge mid">짐작 3,300 — 고쳐 주세요</span> : '도면의 층 높이 글자(FL)'}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              </div>
              <div className="gg-sec">
                <div className="detail-h">집계 — 콘크리트·거푸집·철근</div>
                <div className="gg-wrap"><table className="gg-r">
                  <thead><tr><th>항목</th><th>규격</th><th>단위</th><th className="r">산출</th><th className="r">할증</th><th className="r">할증 포함</th></tr></thead>
                  <tbody>{골결과.집계.합.map((a) => <tr key={a.항목 + a.규격}><td>{a.항목}</td><td>{a.규격}</td><td className="u">{단위풀이(a.단위)}</td><td className="r"><b>{쉼(a.산출, 3)}</b><span className="단">{단위보기(a.단위)}</span></td><td className="r">{a.할증}%</td><td className="r">{쉼(a.내역, 3)}</td></tr>)}</tbody>
                </table></div>
              </div>
              <div className="gg-sec">
                <div className="detail-h">층별 · 부재별</div>
                <div className="gg-wrap"><table className="gg-r">
                  <thead><tr><th>층</th><th>부재</th><th className="r">콘크리트(m³)</th><th className="r">거푸집(m²)</th><th className="r">철근(ton)</th></tr></thead>
                  <tbody>{(() => {
                    const m = new Map()
                    for (const x of 골결과.집계.층부재) { const k = x.층 + '|' + x.부재; const a = m.get(k) || { 층: x.층, 부재: x.부재, C: 0, F: 0, R: 0 }; if (x.항목 === '콘크리트') a.C += x.수량; else if (x.항목 === '거푸집') a.F += x.수량; else if (x.항목 === '철근') a.R += x.수량; m.set(k, a) }
                    return [...m.values()].map((a) => <tr key={a.층 + a.부재}><td>{a.층}</td><td>{a.부재}</td><td className="r">{쉼(a.C, 3)}</td><td className="r">{쉼(a.F, 3)}</td><td className="r">{쉼(a.R, 3)}</td></tr>)
                  })()}</tbody>
                </table></div>
              </div>
              <div className="gg-sec no-print">
                <button type="button" className="chip" onClick={() => set골펼침(골펼침 === '배근' ? '' : '배근')}>{골펼침 === '배근' ? '▲ 접기' : '▼ 일람표에서 읽은 것(배근표) 보기'}</button>
                <button type="button" className="chip" onClick={() => set골펼침(골펼침 === '주' ? '' : '주')}>{골펼침 === '주' ? '▲ 접기' : '▼ 평면에서 읽은 부재(주자료) 보기'}</button>
                {골펼침 === '배근' && [['보', '보', ['기호', '폭', '춤', '상부', '하부', '늑근단부', '늑근중앙', '부근', '상부추가', '하부추가']], ['기둥', '기둥', ['기호', '가로', '세로', '지름', '주근', '대근단부', '대근중앙']], ['슬라브', '슬래브', ['기호', '두께', '단변상부', '단변하부', '장변상부', '장변하부']], ['벽', '벽', ['기호', '두께', '수직', '수평', '배근']], ['기초', '기초', ['기호', '종류', '가로', '세로', '두께', '하부가로', '하부세로']]].map(([k, 이름, 칸]) => (골공사.배근[k] || []).length > 0 && (
                  <div key={k} className="gg-wrap" style={{ marginTop: 8 }}><table className="gg-r">
                    <thead><tr><th>{이름}</th>{칸.slice(1).map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>{골공사.배근[k].map((r) => <tr key={r.기호}>{칸.map((c) => <td key={c}>{r[c]}</td>)}</tr>)}</tbody>
                  </table></div>
                ))}
                {골펼침 === '주' && [['보', ['층', '열', '기호', '길이', '좌단', '우단', 'QT']], ['기둥', ['층', '기호', 'FT', '연결', 'QT']], ['슬라브', ['층', '기호', '단변', '장변', '단변정착', '장변정착', 'QT']], ['옹벽', ['층', '기호', '길이', 'QT']], ['기초', ['층', '기호', 'QT']]].map(([k, 칸]) => (골공사.동[0].주자료[k] || []).length > 0 && (
                  <div key={k} className="gg-wrap" style={{ marginTop: 8 }}><table className="gg-r">
                    <thead><tr><th colSpan={칸.length} style={{ textAlign: 'left' }}>{k === '옹벽' ? '벽' : k === '슬라브' ? '슬래브' : k} ({골공사.동[0].주자료[k].length}줄)</th></tr><tr>{칸.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>{골공사.동[0].주자료[k].map((r, i) => <tr key={i}>{칸.map((c) => <td key={c}>{r[c]}</td>)}</tr>)}</tbody>
                  </table></div>
                ))}
              </div>
              <p className="muted gg-hint">셈 규칙은 <Link to="/jeoksan/golgo">골조 수량산출</Link>과 같습니다(보 = 폭×(춤−슬래브)×안목 · 옆면 거푸집 · 주근 정착·이음 · 늑근 단부/중앙 · 슬래브 = 보 가운데까지). 엑셀의 수량 칸은 <b>=ROUND(식,3)</b> 이라 엑셀에서 다시 셉니다. 개구부·계단·헌치처럼 평면에 기호로 없는 것은 «골조 화면에서 고치기» 로 더하십시오.</p>
            </>
          )}
        </div>
      )}

      {탭 === '산출' && (
        <div className="card gg-print">
          <div className="gg-head">
            <div>
              <div className="detail-h" style={{ margin: 0 }}>물량 전부 — 수량산출서</div>
              <div className="muted" style={{ fontSize: 12.5 }}>K-건설맵 · 도면에서 저절로 뽑은 물량 · 도면: {파일들.map((f) => f.이름).join(', ') || '없음'}</div>
            </div>
            <div className="btn-row no-print" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" disabled={!산출.켠줄.length || 받는중} onClick={엑셀받기}>{받는중 ? '만드는 중…' : '⬇ 엑셀 받기'}</button>
              <button type="button" className="btn line sm" disabled={!산출.켠줄.length} onClick={() => window.print()}>🖨 인쇄</button>
              <button type="button" className="btn ghost sm" disabled={!산출.켠줄.length} onClick={() => (내역 ? set탭('대조') : 내역칸.current?.click())}>📑 내역서와 대조</button>
            </div>
          </div>
          {!파일들.length && <p className="muted">도면(DXF·DWG)을 넣으십시오. 누를 것 없이 모든 물량이 여기에 모입니다. (🧪 예시로 해 보기 = 가상 토목·건축 도면 두 장 + 가상 내역서)</p>}
          {(딴저장.골조 || 딴저장.마감) && (
            <div className="btn-row no-print" style={{ flexWrap: 'wrap', gap: 10, margin: '6px 0' }}>
              {딴저장.골조 && <label className="ja-put"><input type="checkbox" checked={딴화면.골조} onChange={(e) => set딴화면((P) => ({ ...P, 골조: e.target.checked }))} /> 🏗 <Link to="/jeoksan/golgo">골조 수량산출</Link>에 적어 둔 것도 넣기 (콘크리트·거푸집·철근)</label>}
              {딴저장.마감 && <label className="ja-put"><input type="checkbox" checked={딴화면.마감} onChange={(e) => set딴화면((P) => ({ ...P, 마감: e.target.checked }))} /> 🧱 <Link to="/jeoksan/magam">마감 수량산출</Link>에 적어 둔 것도 넣기</label>}
            </div>
          )}
          {파일들.length > 0 && !산출.줄.length && <p className="muted">이 도면에서 뽑을 물량을 찾지 못했습니다. ⑥ 레이어·블록·글자에서 직접 고를 수 있습니다.</p>}
          {산출.줄.length > 0 && (
            <>
              <div className="gg-tiles no-print">
                <div><span>물량 줄</span><b>{산출.켠줄.length}</b> / {산출.줄.length}</div>
                <div><span>갈래</span><b>{new Set(산출.켠줄.map((x) => x.구분)).size}</b> 가지</div>
                <div><span>도면</span><b>{파일들.length}</b> 장</div>
                <div className={대조 ? (대조.셈.다름 ? 'bad' : 'good') : ''}><span>내역 대조</span>{대조 ? <><b>{대조.셈.다름}</b> 줄 다름</> : <b>—</b>}</div>
              </div>
              <p className="muted gg-hint no-print">체크를 풀면 그 줄은 엑셀·대조에서 빠집니다. 품명·규격은 고쳐 쓸 수 있습니다(대조 짝이 더 잘 맞게). 흐린 줄은 뜻이 확실하지 않아 처음엔 꺼 둔 것입니다.</p>
              <div className="gg-wrap"><table className="gg-r gg-calc">
                <thead><tr><th className="no-print">넣기</th><th>No.</th><th>구분</th><th>품명</th><th>규격</th><th>단위</th><th className="r">수량</th><th>산출근거</th><th>도면</th></tr></thead>
                <tbody>{산출.줄.map((x, i) => (
                  <tr key={x.key} className={x.켬 ? '' : 'ja-off no-print'}>
                    <td className="no-print"><input type="checkbox" checked={x.켬} onChange={() => 켜기(x.key, !x.켬)} aria-label={x.품명 + ' 넣기'} /></td>
                    <td>{i + 1}</td><td>{x.구분}</td>
                    <td><input className="ja-in" value={x.품명} onChange={(e) => set고침((P) => ({ ...P, [x.key]: { ...(P[x.key] || {}), 품명: e.target.value } }))} /></td>
                    <td><input className="ja-in" value={x.규격} onChange={(e) => set고침((P) => ({ ...P, [x.key]: { ...(P[x.key] || {}), 규격: e.target.value } }))} /></td>
                    <td className="u">{단위풀이(x.단위)}</td><td className="r"><b>{쉼(x.수량, 3)}</b><span className="단">{단위보기(x.단위)}</span></td><td className="note2">{x.근거}</td><td className="note2">{x.도면}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </>
          )}
          <p className="muted gg-hint no-print">엑셀에는 산출서(켠 줄) · 철근 재료표(줄마다 길이×개수×단위무게 식) · 토공(측점별 평균단면 식) · 실 · 마감(실별 식) · 창호 대조 · 도면의 표 그대로{내역 ? ' · 내역 대조 · 내역에 없는 도면 물량' : ''} 이 들어갑니다. 수량 칸은 <b>=ROUND(식,3)</b> 이라 엑셀에서 다시 셉니다.</p>
        </div>
      )}

      {탭 === '대조' && (
        <div className="card gg-print">
          <div className="gg-head">
            <div>
              <div className="detail-h" style={{ margin: 0 }}>내역 대조 — 내역서 물량 ↔ 도면 물량</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{내역 ? '내역서: ' + 내역.이름 + ' · 도면: ' + (파일들.map((f) => f.이름).join(', ') || '없음') : '내역서(엑셀)를 넣으면 줄마다 도면 물량과 짝을 지어 봅니다'}</div>
            </div>
            <div className="btn-row no-print" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" onClick={() => 내역칸.current?.click()}>📑 {내역 ? '다른 내역서' : '내역서 넣기'}</button>
              {대조 && <button type="button" className="btn line sm" disabled={받는중} onClick={엑셀받기}>{받는중 ? '만드는 중…' : '⬇ 엑셀 받기'}</button>}
              {대조 && <button type="button" className="btn ghost sm" onClick={() => window.print()}>🖨 인쇄</button>}
            </div>
          </div>
          {!내역 && <p className="muted">«품명 · 규격 · 단위 · 수량» 칸이 있는 내역서(.xlsx · .csv)면 됩니다. 공내역서도 됩니다(단가는 안 봄). 일위대가·단가산출 시트는 처음에 꺼 둡니다. <b>내역서도 이 브라우저 안에서만 읽습니다.</b></p>}
          {내역 && (
            <>
              <div className="tp-subtabs no-print">
                {내역.시트들.map((t, k) => (
                  <button key={t.시트} type="button" className={'chip' + (t.켬 ? ' on' : '')} onClick={() => { set내역(내역모으기({ ...내역, 시트들: 내역.시트들.map((x, j) => (j === k ? { ...x, 켬: !x.켬 } : x)) })); set짝고침({}) }}>
                    {t.켬 ? '✓ ' : ''}{t.시트} <span className="gg-n">{t.줄.length}줄</span></button>
                ))}
              </div>
              {!파일들.length && <p className="muted">도면을 넣으면 짝을 짓습니다.</p>}
              {대조 && (
                <>
                  <div className="gg-tiles">
                    <div className="good"><span>같음 (±1%)</span><b>{대조.셈.같음}</b> 줄</div>
                    <div className={대조.셈.다름 ? 'bad' : ''}><span>다름</span><b>{대조.셈.다름}</b> 줄</div>
                    {대조.셈.빈 > 0 && <div className="new"><span>내역 수량 빈 칸 · 짝 있음</span><b>{대조.셈.빈}</b> 줄</div>}
                    <div><span>도면에서 못 찾음</span><b>{대조.셈.없음}</b> 줄</div>
                    <div><span>내역에 없는 도면 물량</span><b>{대조.셈.도면만}</b> 줄</div>
                  </div>
                  {/* 📥 2026-09-28 — 소장님 「물량, 내역채우는 거 다 자동이 목표야」 → 받은 내역서 «그 파일» 의 수량 칸에 도면 물량을 넣어 돌려드림 */}
                  <div className="ja-fill no-print">
                    <div className="ja-fill-h">📥 내역서에 도면 물량 넣기 <span className="muted">— 받은 파일 그대로, 수량 칸만</span></div>
                    <div className="ja-fill-n">
                      넣을 줄 <b>{넣 ? 넣.셈.넣음 : 0}</b>
                      {넣 && 넣.셈.약함 > 0 && <> · 짝이 약해 안 넣음 <b>{넣.셈.약함}</b></>}
                      {넣 && 넣.셈.있음 > 0 && <> · 수량이 이미 있어 그대로 <b>{넣.셈.있음}</b></>}
                      {넣 && 넣.셈.같음 > 0 && <> · 이미 같음 <b>{넣.셈.같음}</b></>}
                      {넣 && 넣.셈.없음 > 0 && <> · 빈 칸인데 도면에 없음 <b>{넣.셈.없음}</b></>}
                    </div>
                    <div className="ja-fill-o">
                      <label><input type="checkbox" checked={넣기옵션.빈만} onChange={(e) => set넣기옵션((o) => ({ ...o, 빈만: e.target.checked }))} /> 빈 수량 칸만 채우기 <span className="muted">(끄면 도면과 다른 수량도 도면 값으로 바꿈)</span></label>
                      <label><input type="checkbox" checked={넣기옵션.할증} onChange={(e) => set넣기옵션((o) => ({ ...o, 할증: e.target.checked }))} /> 재료 줄(레미콘·철근)은 할증 넣은 값 <span className="muted">(타설·가공조립은 늘 할증 없이)</span></label>
                      <label><input type="checkbox" checked={넣기옵션.약함} onChange={(e) => set넣기옵션((o) => ({ ...o, 약함: e.target.checked }))} /> 짝이 약한 줄도 넣기</label>
                    </div>
                    <div className="btn-row" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                      <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!넣 || !넣.바꿀.length || !내역.원본} onClick={넣은내역받기}>⬇ 물량 넣은 내역서 받기</button>
                      {!내역csv && <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!넣 || !넣.바꿀.length || !내역.원본} onClick={단가로}>📑 이어서 단가까지 채우기 →</button>}
                    </div>
                    {!내역.원본 && <p className="muted" style={{ margin: '6px 0 0' }}>예전에 넣은 내역서라 원래 파일이 없습니다 — 📑 다른 내역서로 한 번 더 넣어 주십시오.</p>}
                    {넣은말 && (넣은말.오류
                      ? <p className="gp-warn" style={{ margin: '6px 0 0' }}>⚠️ {넣은말.오류}</p>
                      : <p className="muted" style={{ margin: '6px 0 0' }}>✅ <b>{넣은말.이름}</b> — {넣은말.됨}줄 넣음{넣은말.안됨.length ? ' · ' + 넣은말.안됨.length + '줄은 안 넣음(' + [...new Set(넣은말.안됨.map((x) => x.까닭))].join(' · ') + ')' : ''}.
                        넣은 칸은 노란 바탕, 맨 뒤 «물량 넣은 곳» 시트에 줄마다 근거가 있습니다. 금액 식은 엑셀을 열 때 다시 셈합니다.</p>)}
                    <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>
                      짝이 <b>확실한</b> 줄만 넣습니다(이름·규격이 같음 · 골조는 레미콘 강도·철근 지름·부재 이름으로). 다른 칸·서식·수식·다른 시트는 건드리지 않습니다. 수량 칸이 수식이면 그대로 둡니다.
                      <b> 이어서 단가까지</b>를 누르면 이 파일로 곧바로 «공내역서 단가 채우기»(시험판)를 돌립니다.
                    </p>
                  </div>
                  <div className="tp-subtabs no-print">
                    {['모두', '다름', '같음', '못 찾음'].map((k) => <button key={k} type="button" className={'chip' + (대조거르기 === k ? ' on' : '')} onClick={() => set대조거르기(k)}>{k}</button>)}
                  </div>
                  <div className="gg-wrap"><table className="gg-r ja-cmp">
                    <thead><tr><th>No.</th><th>내역 품명</th><th>규격</th><th>단위</th><th className="r">내역 수량</th><th>짝 (도면 물량)</th><th className="r">도면 수량</th><th className="r">차이</th><th className="r">차이율</th><th>판정</th></tr></thead>
                    <tbody>{대조줄.map((r) => {
                      const n = r.내역
                      const 같은무리 = 대조판.도면.filter((d) => 단위풀기(d.단위).무리 === 단위풀기(n.단위).무리)
                      const 넣을 = 넣맵.get(n.id)
                      return (
                        <tr key={n.id} className={'ja-j-' + (판색[r.판정] || '')}>
                          <td>{n.id + 1}</td><td>{n.품명}</td><td>{n.규격}</td><td className="u">{단위풀이(n.단위)}</td><td className="r">{n.빈 ? <span className="muted">(빈 칸)</span> : <>{쉼(n.수량, 3)}<span className="단">{단위보기(n.단위)}</span></>}</td>
                          <td className="no-print-sel">
                            <select className="ja-pair" value={r.도면 ? r.도면.key : ''} onChange={(e) => set짝고침((P) => ({ ...P, [n.id]: e.target.value }))} aria-label={n.품명 + ' 짝'}>
                              <option value="">— 짝 없음</option>
                              {r.후보.map((c) => { const d = 대조판.도면.find((q) => q.key === c.key); return d ? <option key={'h' + c.key} value={c.key}>★ {d.품명}{d.규격 ? ' ' + d.규격 : ''} · {쉼(d.수량, 3)} {d.단위}</option> : null })}
                              {같은무리.filter((d) => !r.후보.some((c) => c.key === d.key)).map((d) => <option key={d.key} value={d.key}>{d.품명}{d.규격 ? ' ' + d.규격 : ''} · {쉼(d.수량, 3)} {d.단위}</option>)}
                            </select>
                            {r.도면 && <div className="note2" style={{ fontSize: 11 }}>{r.도면.구분} · {r.도면.근거}</div>}
                            {(r.믿음 || r.까닭) && <div className={'ja-trust ' + (r.믿음 === '확실' ? 'ok' : r.믿음 === '약함' ? 'weak' : '')}>{r.믿음 ? (r.믿음 === '확실' ? '✓ 확실' : '△ 약함') + ' · ' : ''}{r.까닭}</div>}
                          </td>
                          <td className="r">{r.도면 ? <b>{쉼(r.도면수량, 3)}</b> : '—'}{r.할증 ? <div className="note2" style={{ fontSize: 11 }}>할증 {r.할증}% → {쉼(r.할증수량, 3)}</div> : null}</td>
                          <td className="r">{r.도면 ? (r.차이 > 0 ? '+' : '') + 쉼(r.차이, 3) : ''}</td>
                          <td className="r">{r.율 === null || !r.도면 ? '' : (r.율 > 0 ? '+' : '') + r.율.toFixed(1) + '%'}</td>
                          <td><span className={'ja-badge ' + (판색[r.판정] || '')}>{r.판정}</span>{r.고친짝 ? <span className="muted" style={{ fontSize: 11 }}> (고친 짝)</span> : null}
                            {넣을 && <div className="ja-putv">📥 {쉼(넣을.값, 3)} 넣음</div>}</td>
                        </tr>
                      )
                    })}</tbody>
                  </table></div>
                  {대조.남은도면.length > 0 && (
                    <div className="gg-sec">
                      <div className="detail-h">내역에 없는 도면 물량 ({대조.남은도면.length}) — 빠진 물량인지 보십시오</div>
                      <div className="gg-wrap"><table className="gg-r">
                        <thead><tr><th>구분</th><th>품명</th><th>규격</th><th>단위</th><th className="r">도면 수량</th><th>근거</th></tr></thead>
                        <tbody>{대조.남은도면.map((d) => <tr key={d.key}><td>{d.구분}</td><td>{d.품명}</td><td>{d.규격}</td><td className="u">{단위풀이(d.단위)}</td><td className="r">{쉼(d.수량, 3)}<span className="단">{단위보기(d.단위)}</span></td><td className="note2">{d.근거}</td></tr>)}</tbody>
                      </table></div>
                    </div>
                  )}
                  <ul className="tl-p no-print" style={{ paddingLeft: 18, marginTop: 10, lineHeight: 1.8, fontSize: 13 }}>
                    <li><b>짝</b>은 단위 무리(m·m²·m³·개·kg/ton)가 같고 품명·규격이 가장 닮은 도면 물량입니다. ★ 는 닮은 순서. 틀리면 고르십시오 — 엑셀에도 고친 짝이 나갑니다.</li>
                    <li><b>다름 ≠ 틀림</b>: 할증·토량환산·범위(도면 한 장 vs 공사 전체)·구간이 다를 수 있습니다. 도면 근거를 보고 판단하십시오. 철근은 kg ↔ ton 을 바꿔 맞춥니다.</li>
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}

      {탭 === '실' && (
        <div className="card no-print">
          {!cur && <p className="muted">건축 평면도를 넣으면 실 이름 글자(사무실·거실·화장실…)를 품은 닫힌 선을 찾아 실마다 면적·둘레를 잽니다.</p>}
          {cur && 지금전부 && (
            <>
              <div className="detail-h">실(방) {지금전부.실.length}개 — 면적 합 {쉼(지금전부.실.reduce((a, r) => a + r.면적, 0), 2)} m²</div>
              {!지금전부.실.length && <p className="muted">실 이름 글자를 품은 닫힌 선을 찾지 못했습니다. 방이 닫힌 폴리선(안목)으로 그려져 있지 않으면 <Link to="/jeoksan/magam">마감 수량산출</Link>에서 방 안을 눌러 잽니다.</p>}
              {지금전부.실.length > 0 && (
                <div className="gg-wrap ja-tbl"><table className="gg-r">
                  <thead><tr><th>층(짐작)</th><th>실 이름</th><th>면적(m²)</th><th>둘레(m)</th><th>레이어</th><th /></tr></thead>
                  <tbody>{지금전부.실.map((r) => (
                    <tr key={r.e}><td>{r.층}</td><td>{r.이름}</td><td className="r">{쉼(r.면적, 3)}</td><td className="r">{Number.isFinite(r.둘레) ? 쉼(r.둘레, 3) : '—'}</td><td className="note2">{r.레이어}</td>
                      <td><button type="button" className="chip" onClick={() => set가볼곳({ r: r.b, n: Date.now() })}>보기</button></td></tr>
                  ))}</tbody>
                </table></div>
              )}
              <div className="detail-h" style={{ marginTop: 14 }}>마감 — 실내재료마감표 {지금전부.마감표.length ? 지금전부.마감표.length + '줄' : '없음'}</div>
              {!지금전부.마감 && <p className="muted">{지금전부.마감표.length ? (지금전부.실.length ? '실내재료마감표의 실 이름과 이 도면의 실 이름이 맞는 것이 없습니다.' : '실내재료마감표는 읽었습니다(아래). 실 면적이 있는 평면도(방이 닫힌 선)를 같이 넣으면 마감 면적까지 셉니다.') : '이 도면에서 «실내재료마감표» 를 찾지 못했습니다 — 마감 물량은 실 면적만 드립니다.'}</p>}
              {지금전부.마감표.length > 0 && (
                <details className="ja-t" open={!지금전부.마감}>
                  <summary><b>읽은 실내재료마감표 {지금전부.마감표.length}줄</b> <span className="muted" style={{ fontSize: 12 }}>(실마다 바닥·걸레받이·벽·천장 마감 · 천장고)</span></summary>
                  <div className="gg-wrap ja-tbl"><table className="gg-r">
                    <thead><tr><th>층</th><th>실명</th><th>바닥</th><th>걸레받이</th><th>벽</th><th>천장</th><th>천장고</th></tr></thead>
                    <tbody>{지금전부.마감표.map((m, k) => <tr key={k}><td>{m.층}</td><td>{m.실명}</td><td className="note2">{m.바닥}</td><td className="note2">{m.걸레받이}</td><td className="note2">{m.벽}</td><td className="note2">{m.천장}</td><td>{m.천장고}</td></tr>)}</tbody>
                  </table></div>
                </details>
              )}
              {지금전부.마감 && (
                <>
                  <div className="gg-wrap"><table className="gg-r">
                    <thead><tr><th>재료(마감)</th><th>규격</th><th>단위</th><th className="r">수량</th></tr></thead>
                    <tbody>{지금전부.마감.결과.집계.합.filter((a) => a.재료 !== '창호').map((a, k) => <tr key={k}><td>{a.재료}</td><td>{a.규격}</td><td className="u">{단위풀이(a.단위)}</td><td className="r"><b>{쉼(a.수량, 3)}</b><span className="단">{단위보기(a.단위)}</span></td></tr>)}</tbody>
                  </table></div>
                  {지금전부.마감.결과.경고.length > 0 && <ul className="gg-warns">{지금전부.마감.결과.경고.slice(0, 20).map((w, k) => <li key={k}>⚠️ {w.곳 && w.곳.표 === '실' ? (지금전부.마감.공사.실[w.곳.i] || {}).실명 + ' — ' : ''}{w.글}</li>)}</ul>}
                  <p className="muted gg-hint">바닥·천장 = 실 면적 · 벽 = 둘레 × 천장고(마감표) − 방 안의 창호 · 걸레받이 = 둘레 − 문 폭. 실마다의 식은 엑셀 «마감 실별» 시트에 있습니다. 재료를 나눠 적으려면 <Link to="/jeoksan/magam">마감 수량산출</Link>에서.</p>
                </>
              )}
              <div className="detail-h" style={{ marginTop: 14 }}>창호 — 창호일람표 수량 ↔ 평면의 기호 개수</div>
              {!지금전부.창호.length && <p className="muted">«창호일람표» 를 찾지 못했습니다. 평면의 기호 개수는 ⑥ 에 있습니다.</p>}
              {지금전부.창호.length > 0 && (
                <div className="gg-wrap"><table className="gg-r">
                  <thead><tr><th>기호</th><th>구분</th><th>폭×높이(m)</th><th>일람표 수량</th><th>평면 기호</th><th>맞음</th></tr></thead>
                  <tbody>{지금전부.창호.map((w) => <tr key={w.기호} className={w.다름 ? 'warn' : ''}><td>{w.기호}</td><td>{w.구분}</td><td>{w.폭}×{w.높이}</td><td className="r">{w.표수 ?? '—'}</td><td className="r">{w.도면}</td><td>{w.표수 === null ? '—' : w.다름 ? '⚠️ 다름' : '같음'}</td></tr>)}</tbody>
                </table></div>
              )}
            </>
          )}
        </div>
      )}

      <div className="card no-print">
        <div className="detail-h">알아 두실 것</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.85 }}>
          <li><b>모두 자동</b>: 도면을 넣으면 표·토공은 그대로, 레이어·블록은 <b>이름으로 뜻을 짐작</b>해(우수관·측구·경계석·포장·맨홀·집수정·가로등·수목…) 저절로 넣습니다. 치수·글자·도곽·중심선 같은 주석은 뺍니다. 뜻을 모르는 레이어는 ⑥ 에서 고릅니다.</li>
          <li><b>내역 대조</b>: 내역서 줄마다 단위가 같고 이름이 닮은 도면 물량을 짝으로 붙이고 차이를 보입니다. <b>다름</b>이 나온 줄은 도면 근거와 내역을 맞춰 보십시오 — 설계변경 검토의 출발점입니다.
            골조는 이름이 아니라 <b>뜻</b>으로 짝을 짓습니다 — 레미콘은 강도(25-24-150 ↔ 25-24-15), 철근은 지름(HD13·SHD22), 철근가공조립은 철근 전체, 타설은 버림 빼고 콘크리트 전체, 거푸집은 규격·품명에 적힌 부재(슬라브·벽·기초…).</li>
          <li><b>📥 내역서에 물량 넣기</b>: 짝이 <b>확실한</b> 줄만 받은 내역서의 수량 칸에 넣습니다(기본은 빈 칸만). 재료 줄(레미콘·철근)은 골조 할증(철근 3%·콘크리트 1% — 골조 화면에서 고침)을 넣은 값, 타설·가공조립은 할증 없이.
            다른 칸·서식·수식·시트는 그대로이고, 넣은 칸은 노란 바탕 · 맨 뒤 «물량 넣은 곳» 시트에 줄마다 근거가 남습니다. 수량 칸이 수식이면 건드리지 않습니다.</li>
          <li><b>골조 자동</b>: «2층 구조평면도» 처럼 제목이 붙은 구조평면도와 <b>부재 일람표</b>(보·기둥·슬래브·벽·기초의 크기와 철근)가 있으면, 보는 기호 옆의 나란한 두 선을 기둥·걸친 보에서 끊어 한 칸씩, 슬래브는 보 가운데까지, 기둥·기초는 기호 개수로 셉니다. 층고는 «FL+3,600» 같은 글자로 — 없으면 3,300 으로 짐작하니 ② 골조에서 고치십시오. 철골 부재는 빼고 알려 드립니다.</li>
          <li><b>도면에 «적힌» 것을 옮깁니다.</b> 표의 칸·측점의 면적·부재 기호처럼 설계자가 적어 둔 것을 자리대로 읽습니다. 적혀 있지 않은 물량(예: 토목 구조물 콘크리트를 선으로만 그린 것)은 <Link to="/jeoksan/golgo">골조</Link>·<Link to="/jeoksan/magam">마감</Link>·<Link to="/jeoksan/run">수량산출서 만들기</Link>에서 도면을 눌러 잽니다.</li>
          <li><b>표 찾기</b>: 제목이 «~표» 이고 재료·수량·물량·자재·집계·철근·토공·일람·마감 같은 말이 든 표를 찾습니다. 머리(칸 이름) 아래 숫자 줄을 칸마다 옮기고, 〃(같음) 표시는 위 칸 값으로 채웁니다.</li>
          <li><b>토공</b>: 측점 사이 거리 × (앞 단면 + 뒤 단면) ÷ 2. 측점 글자 «STA.0+020»·«NO.5+10»(20m 체인)을 거리로 바꿉니다. 할증·토량환산계수는 넣지 않았습니다.</li>
          <li><b>레이어·블록</b>: 무엇을 뜻하는 선인지는 도면마다 다릅니다. 레이어 이름을 보고 사람이 고릅니다. 블록 안의 선도 그 레이어 길이에 들어갑니다.</li>
          <li><b>검산</b>: 도면의 «도면에서 보기» 로 네모를 꼭 맞춰 보십시오. 표 모양이 흔치 않으면 칸이 밀릴 수 있습니다.</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <Link className="btn ghost sm" to="/jeoksan/golgo">🏗 골조 수량산출</Link>
          <Link className="btn ghost sm" to="/jeoksan/magam">🧱 마감 수량산출</Link>
          <Link className="btn ghost sm" to="/jeoksan/run">🧮 수량산출서 만들기</Link>
          <Link className="btn ghost sm" to="/tools/dwgdxf">🔁 DWG → DXF</Link>
          <Link className="btn ghost sm" to="/tools">🧰 도구 모두</Link>
        </div>
      </div>
    </div>
  )
}

function 세고르기(set, key, v) {
  set((P) => { const o = { ...P }; if (o[key]) delete o[key]; else o[key] = v; return o })
}

/** 한 노선의 토공 — 본(자동 짐작 또는 소장님이 잡은 네모) → 모든 측점 읽기 → 평균단면 */
function 토공셈(f, 노선, st) {
  const M = f.모델
  let s = null
  if (st.기준i !== undefined && st.기준i !== null) s = 노선.점.find((p) => p.i === st.기준i) || null
  if (!s) s = 자.본측점고르기(노선)
  const 네모 = st.네모 || 자.본네모짐작(M, s, 노선.점.filter((q) => Math.abs(q.x - s.x) < 3 * s.h))
  const 본 = 자.본만들기(M, s, 네모, 노선.점)
  const 칸 = 본.칸.map((c, j) => ({ ...c, ...((st.칸 || {})[j] || {}) }))
  const 뺌 = new Set(st.점뺌 || [])
  const 읽음 = 자.본읽기(M, 본, 노선.점).map((p) => ({ ...p, 쓰기: !뺌.has(p.i) }))
  const 결과 = 자.평균단면(읽음, 칸)
  return { 본, 칸, 읽음, 결과 }
}
