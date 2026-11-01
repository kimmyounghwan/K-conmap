/**
 * /tools/photo-live — 📡 실시간 사진대지 — 폰에서 찍으면 PC 에 바로 (G493 · 2026-11-01)
 *
 * 소장님: 「현장에서 사진을 찍으면 실시간으로 pc에서 사진대지가 완성된다는 거야?」 → 「이건 실시간으로 되는 것으로 해줘」
 *         「아니, 방금 만든 사진도구 하나. 이번에 만들고 있는 사진도구 실시간 따로 따로」 「이미 만든건 두고... 이용자가 선택해서 사용하게.
 *          그리고, 사용방법은 자세히...필요없는 말은 빼고」
 *
 * ■ 📷 사진대지(/tools/photo · 이 브라우저에서만)는 그대로 두고, 이 화면은 «따로» — 이용자가 고릅니다.
 * ■ 현장 코드 + 비밀번호(lib/장부.js) 로 폰 ↔ PC 를 잇습니다.
 *     pb_doc/{코드}  = 잠근 상태(설정 · 사진 목록 — 바이트는 없음) · r(판)   ← 판이 바뀌면(onValue) 다른 기기가 몇 초 안에 받음
 *     pb_pic/{코드}/{사진id} = 잠근 사진 한 장(1600px JPEG)                 ← 7일 뒤 매일 정리가 지움(기기에는 남음)
 *   사진 · 글은 비밀번호로 잠가 올리므로 서버 · 운영자는 못 봅니다. 셈 · 합치기: lib/사진잇기.js(시험 tools/시험_사진잇기.mjs)
 * ■ 화면 조각(미리보기 · 꾸미기 · 내보내기 · 쪽 만들기)은 PhotoBook.jsx 의 것을 그대로 씁니다 — 두 도구의 결과가 같습니다.
 * ■ 폰이 인터넷이 없으면 못 올린 사진을 기억(⏳)했다가 연결되면 저절로 올립니다.
 * ■ 화면 시험: tools/시험_실시간사진대지화면.mjs (PC · 폰 두 창 — 가짜 서버)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 기본설정 as 사진기본, 문구모음, 사진대지쪽들, 사진열기, 사진돌리기, 그림준비, 정렬하기, 표시하기, 칸값 } from '../lib/사진정리.js'
import { 세기 } from '../lib/받은수.jsx'
import { 코드보기, 코드정리 } from '../lib/tuipbi.js'
import { 목록읽기, 목록기억 } from '../lib/장부.js'
import { 사진잇기손잡이, 창고, 연결읽기, 연결쓰기, 밀린읽기, 밀린쓰기, 올릴사진 } from '../lib/사진잇기.js'
import { 합치기pb, 받을사진, 새사진id, 기기이름, 사진둘날 } from '../lib/사진잇기셈.js'
import { 폰기기, 사진꼴, 숨, 오늘, 파일이름, 그림주소, 저장하기, 형식표, 파일만들기, 미리보기판, 내보내기줄, 꾸미기칸 } from './PhotoBook.jsx'

const NS = 'pb'
const 손 = 사진잇기손잡이(NS)
const 곳 = 창고(NS)
const 빈상태 = () => ({ 설정: { ...사진기본, 제목: '사진대지' }, 차례: '때', 설정때: 0, 목록: [], 지움: {} })
const 시각 = (t) => { if (!t) return ''; const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const 주소코드 = () => { try { return 코드정리(new URLSearchParams(window.location.search).get('c') || '') } catch (e) { return '' } }

/** 받은 사진 바이트 → 목록 칸의 작은 그림(dataURL 360px) */
async function 작은그림만들기(바이트, w, h) {
  try {
    const 원 = await createImageBitmap(new Blob([바이트], { type: 'image/jpeg' }))
    const s = Math.min(1, 360 / Math.max(원.width || w || 1, 원.height || h || 1))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(원.width * s)); c.height = Math.max(1, Math.round(원.height * s))
    c.getContext('2d').drawImage(원, 0, 0, c.width, c.height)
    if (원.close) 원.close()
    return c.toDataURL('image/jpeg', 0.72)
  } catch (e) { return '' }
}
/** 상태에서 서버에 올릴 것만(이 기기만의 표시는 뺌) */
const 올릴상태 = (s) => ({ 설정: s.설정, 차례: s.차례, 설정때: s.설정때 || 0, 지움: s.지움 || {}, 목록: s.목록.map(({ 작업본, 작은그림, ...p }) => p) })

/* ══════════════════════ 📖 사용 방법 — 자세히 · 필요 없는 말은 빼고 ══════════════════════ */
const 사용차례 = [
  ['PC 에서 현장 만들기', '«현장 만들기» → 현장 이름 · 비밀번호 → 코드 9자리가 나옵니다. 코드와 비밀번호를 적어 두십시오.'],
  ['폰에서 열기', '폰으로 이 주소(k-conmap.com/tools/photo-live)를 열고 «코드로 열기» → 코드 · 비밀번호. PC 의 «📋 코드 · 주소 복사» 를 카톡으로 보내면, 폰에서 그 주소를 눌렀을 때 코드가 채워져 있습니다.'],
  ['폰에서 찍기', '«📸 찍기» → 찍으면 바로 올라갑니다(사진마다 ✓). 앨범의 사진은 «📷 고르기». 일자는 찍은 때가 저절로 들어갑니다.'],
  ['PC 에서 보기 · 적기', '몇 초 안에 오른쪽 미리보기에 들어옵니다. 공사명 · 위치 · 내용을 적거나 차례를 바꾸면 폰에도 그대로 바뀝니다. «↓» 는 아래 사진 모두 같은 글.'],
  ['내려받기', 'PDF · 엑셀 · 한글 · 워드 중 고르거나 🖨 인쇄. 메일 · 나라장터는 «사진 용량 › 가볍게».'],
]
const 사용팁 = [
  '인터넷이 끊기면 폰에 모였다가(⏳) 연결되면 저절로 올라갑니다 — 찍기는 계속하셔도 됩니다.',
  '같은 코드 · 비밀번호로 폰 여러 대가 함께 올릴 수 있습니다. PC 도 여러 대에서 열 수 있습니다.',
  `서버의 사진은 ${사진둘날}일 뒤 지워집니다(각 기기에는 남습니다). 끝난 현장은 «끊기» — 이 기기의 사진은 그대로 있습니다.`,
  '사진은 1600px 로 줄여 올립니다(A4 한 쪽 8장까지 선명). 사진 · 글은 비밀번호로 잠가 올려 운영자도 못 봅니다 → 비밀번호를 잊으면 열 수 없습니다.',
  '이 기기에서만 할 것(폰 ↔ PC 가 필요 없을 때)은 📷 사진대지 도구를 쓰십시오 — 사진이 서버로 가지 않습니다.',
]
function 사용법({ 처음 }) {
  const [열림, set열림] = useState(처음)
  useEffect(() => { if (!처음) set열림(false) }, [처음])   /* 현장을 잇거나 사진이 들어오면 접음 — 찍기 단추가 앞에 */
  return (
    <div className="card pb-how">
      <div className="pb-howh">
        <button type="button" className="pb-howt" onClick={() => set열림((v) => !v)} aria-expanded={열림}>📖 사용 방법 {열림 ? '▴' : '▾'}</button>
        <span className="grow" />
        <Link className="pb-more" to="/tools/photo">📷 이 기기에서만 할 사진대지</Link>
      </div>
      {열림 && (
        <>
          <ol className="pb-steps">{사용차례.map(([t, d], i) => <li key={i}><b>{t}</b> — {d}</li>)}</ol>
          <ul className="pb-tips">{사용팁.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </>
      )}
    </div>
  )
}

/* ══════════════════════ 📡 실시간 사진대지 ══════════════════════ */
export default function PhotoLive() {
  const [상태, set상태] = useState(빈상태)
  const 상태r = useRef(상태); 상태r.current = 상태
  const 그림 = useRef(new Map())                      /* id → {작업본, 작은그림, 너비, 높이, 그림때} */
  const [그림판, set그림판] = useState(0)             /* 그림이 바뀌면 다시 그리게 */
  const [연결, set연결] = useState(() => 연결읽기(NS))
  const 연결r = useRef(연결); 연결r.current = 연결
  const [밀린, set밀린] = useState(() => 밀린읽기(NS))
  const 밀린r = useRef(밀린); 밀린r.current = 밀린
  const [저장, set저장] = useState('off')             /* off ok ing wait lock big */
  const [올리는중, set올리는중] = useState('')          /* 지금 올리는 사진 id */
  const [받는중, set받는중] = useState(0)
  const [마지막, set마지막] = useState(null)
  const [바쁨, set바쁨] = useState('')
  const [알림, set알림] = useState('')
  const [오류, set오류] = useState('')
  const [화면, set화면] = useState('')                /* '' make open made help */
  const [폼, set폼] = useState(() => ({ name: '', pw: '', pw2: '', c: 주소코드() ? 코드보기(주소코드()) : '' }))
  const [복사됨, set복사됨] = useState(false)
  const [한번더, set한번더] = useState('')
  const [연것, set연것] = useState(false)
  const 입력 = useRef(null), 찍기 = useRef(null)
  const 올림중 = useRef(false), 올림또 = useRef(false), 올리는판 = useRef(0), 저장t = useRef(0), 올림t = useRef(0)
  const 폼칸 = (k) => (e) => set폼((f) => ({ ...f, [k]: e.target.value }))
  const { 목록, 설정 } = 상태
  const 폰 = 기기이름() === '폰'          /* 폰 화면(찍기가 앞) · PC 는 끌어놓기 — 터치 되는 PC 도 📸 찍기 단추는 보임 */

  /* ── 이 기기 창고에서 열기 ── */
  useEffect(() => {
    let 끝 = false
    ;(async () => {
      const d = await 곳.상태꺼내기()
      const s = d && d.목록 ? { ...빈상태(), ...d, 설정: { ...사진기본, ...(d.설정 || {}) } } : 빈상태()
      const m = await 곳.사진들꺼내기(s.목록.map((p) => p.id))
      if (끝) return
      그림.current = m; set그림판((n) => n + 1)
      set상태(s); set연것(true)
      if (주소코드().length === 9 && !(연결r.current && 연결r.current.c === 주소코드())) set화면('open')
    })()
    return () => { 끝 = true }
  }, [])

  /* ── 상태가 바뀌면 이 기기에 남김(0.3초 뒤) ── */
  useEffect(() => {
    if (!연것) return undefined
    clearTimeout(저장t.current)
    저장t.current = setTimeout(() => { 곳.상태넣기(올릴상태(상태)) }, 300)
    return () => clearTimeout(저장t.current)
  }, [상태, 연것])
  useEffect(() => { 밀린쓰기(NS, 밀린) }, [밀린])
  useEffect(() => { 연결쓰기(NS, 연결) }, [연결])

  /* ── 서버에 올리기(사진 먼저 · 그다음 상태) ── */
  const 올림 = useCallback(async () => {
    const v = 연결r.current
    if (!v) return
    if (올림중.current) { 올림또.current = true; return }
    const 열쇠 = 손.열쇠(v.c)
    if (!열쇠) { set저장('lock'); return }
    올림중.current = true
    try {
      set저장('ing')
      /* ① 못 올린 사진 */
      for (const id of [...밀린r.current]) {
        const g = 그림.current.get(id)
        const p = 상태r.current.목록.find((x) => x.id === id)
        if (!g || !p) { set밀린((a) => a.filter((x) => x !== id)); continue }
        set올리는중(id)
        let 올릴 = g
        for (const 긴쪽 of [0, 1200, 900]) {   /* 너무 크면(잠근 글 1,450,000 자 넘음 — 아주 자잘한 사진) 1200 · 900 으로 줄여 다시 */
          try {
            if (긴쪽) { const 줄 = await 올릴사진(g.작업본, g.너비, g.높이, 긴쪽, 0.72); 올릴 = { ...g, 작업본: 줄.바이트, 너비: 줄.w, 높이: 줄.h, 그림때: Date.now() }; 그림.current.set(id, 올릴); 곳.사진넣기(id, 올릴); set그림판((n) => n + 1); 고치기((o) => ({ ...o, 목록: o.목록.map((x) => (x.id === id ? { ...x, 너비: 올릴.너비, 높이: 올릴.높이, 그림때: 올릴.그림때 } : x)) })) }
            await 손.사진올리기(v.c, 열쇠, id, { 바이트: 올릴.작업본, w: 올릴.너비, h: 올릴.높이, 때: p.때 || '' })
            set밀린((a) => a.filter((x) => x !== id)); 밀린r.current = 밀린r.current.filter((x) => x !== id)
            break
          } catch (e) {
            if (!(e && e.code === '큼')) throw e
            if (긴쪽 === 900) { set밀린((a) => a.filter((x) => x !== id)); 밀린r.current = 밀린r.current.filter((x) => x !== id); set오류('사진 한 장이 너무 커서 올리지 못했습니다.') }
          }
        }
      }
      set올리는중('')
      /* ② 상태(설정 · 목록 · 지움) — 다른 기기가 먼저 올렸으면 받아서 합친 뒤 다시 */
      if (연결r.current && 연결r.current.d) {
        let 판 = 연결r.current.r || 0
        for (let i = 0; i < 4; i++) {
          try {
            올리는판.current = 판 + 1
            const r = await 손.올리기(v.c, 열쇠, 올릴상태(상태r.current), 판)
            set연결((o) => (o && o.c === v.c ? { ...o, r, d: false } : o))
            set마지막({ at: Date.now(), by: 기기이름() })
            break
          } catch (e) {
            if (e && e.code === '충돌') {
              const 서버 = await 손.받기(v.c, 열쇠)
              if (서버 && 서버.상태) { const 합 = 합치기pb(서버.상태, 상태r.current); 상태r.current = 합; set상태(합); 판 = 서버.r || e.서버판 || 판 + 1; 사진받아오기(합) } else 판 = e.서버판 || 판 + 1
              continue
            }
            if (e && e.code === '큼') { set저장('big'); set오류('사진이 너무 많아 상태를 서버에 올리지 못했습니다 — 내려받은 뒤 «모두 지우기» 로 비워 주십시오.'); return }
            throw e
          }
        }
      }
      set저장('ok')
      set알림((a) => (/올리는 중입니다/.test(a) ? '✓ 올렸습니다 — PC 에서 바로 보입니다.' : a))
    } catch (e) {
      set저장('wait')   /* 인터넷 · 서버 탓 — online · 30초마다 · 창을 다시 볼 때 다시 올림 */
    } finally {
      올림중.current = false; set올리는중('')
      if (올림또.current) { 올림또.current = false; setTimeout(올림, 200) }
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  /** 상태 고치기 → 이 기기 · 0.8초 뒤 서버 */
  const 고치기 = useCallback((fn) => {
    set상태((o) => { const n = fn(o); 상태r.current = n; return n })
    set연결((o) => (o ? { ...o, d: true } : o))
    clearTimeout(올림t.current); 올림t.current = setTimeout(올림, 800)
  }, [올림])

  /* ── 서버에서 받기 ── */
  /* 🩹 G495 (11-01 사이트 시험) — «코드로 열기» 직후엔 연결r 이 아직 비어 있어(set연결 뒤 다시 그리기 전) 사진 받기가 조용히 빠졌음 → 목록은 오는데 그림은 «↓ 받는 중» 그대로.
     → 연(연결 정보)을 바로 넘겨 받고 · 판 지켜보기 효과가 시작될 때 · 30초마다 못 받은 사진이 있으면 다시 받음. 재발 방지: 시험_실시간사진대지화면 ⑥(세 번째 기기 열기) */
  const 받는중r = useRef(false)
  const 사진받아오기 = useCallback(async (s, 연 = null) => {
    const v = 연 || 연결r.current
    if (!v) return
    const 열쇠 = 손.열쇠(v.c)
    if (!열쇠) return
    const 받을 = 받을사진(s.목록, 그림.current).filter((id) => !밀린r.current.includes(id))
    if (!받을.length || 받는중r.current) return
    받는중r.current = true
    set받는중(받을.length)
    let 남 = 받을.length
    for (const id of 받을) {
      try {
        const x = await 손.사진받기(v.c, 열쇠, id)
        if (x && x.바이트) {
          const p = (상태r.current.목록 || []).find((q) => q.id === id)
          const g = { 작업본: x.바이트, 작은그림: await 작은그림만들기(x.바이트, x.w, x.h), 너비: x.w, 높이: x.h, 그림때: (p && p.그림때) || Date.now() }
          그림.current.set(id, g); 곳.사진넣기(id, g); set그림판((n) => n + 1)
        }
      } catch (e) { /* 다음 판에 다시 */ }
      남 -= 1; set받는중(남)
    }
    set받는중(0); 받는중r.current = false
  }, [])

  const 받음 = useCallback(async (판) => {
    const v = 연결r.current
    if (!v || 판 == null || 판 === v.r || 판 === 올리는판.current) return
    const 열쇠 = 손.열쇠(v.c)
    if (!열쇠) { set저장('lock'); return }
    try {
      const 서버 = await 손.받기(v.c, 열쇠)
      if (!서버) return
      if (서버.잠김) { set저장('lock'); return }
      const 합 = 합치기pb(서버.상태, 상태r.current)
      상태r.current = 합; set상태(합)
      set연결((o) => (o && o.c === v.c ? { ...o, r: 서버.r } : o))
      set마지막({ at: 서버.at || Date.now(), by: 서버.by || '' })
      if (!연결r.current || !연결r.current.d) set저장('ok')
      await 사진받아오기(합)
      if (연결r.current && 연결r.current.d) 올림()
    } catch (e) { /* 다음에 */ }
  }, [사진받아오기, 올림])

  /* 🔔 판 지켜보기 · 인터넷 다시 되면 올리기 · 창을 다시 보면 확인 */
  useEffect(() => {
    if (!연결 || !연것) { if (!연결) set저장('off'); return undefined }
    let 끄기 = null, 산 = true
    손.판지켜보기(연결.c, (판) => { if (산) 받음(판) }).then((f) => { if (산) 끄기 = f; else f() }).catch(() => {})
    if (연결.d || 밀린r.current.length) 올림(); else set저장((s) => (s === 'off' ? 'ok' : s))
    사진받아오기(상태r.current, 연결)   /* 🩹 G495 열고 난 직후 · 새로고침 뒤 못 받은 사진 */
    const 온 = () => { if (산) 올림() }
    const 봄 = () => { if (산 && document.visibilityState === 'visible') { 손.판보기(연결.c).then((판) => 받음(판)).catch(() => {}); if (밀린r.current.length || (연결r.current && 연결r.current.d)) 올림() } }
    window.addEventListener('online', 온); document.addEventListener('visibilitychange', 봄)
    const 째 = setInterval(() => { if (밀린r.current.length || (연결r.current && 연결r.current.d)) 올림(); if (연결r.current && 받을사진(상태r.current.목록, 그림.current).length) 사진받아오기(상태r.current) }, 30000)
    return () => { 산 = false; if (끄기) 끄기(); window.removeEventListener('online', 온); document.removeEventListener('visibilitychange', 봄); clearInterval(째) }
  }, [연결 && 연결.c, 연것])  // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 사진 넣기(찍기 · 고르기 · 끌어놓기) ── */
  const 올리기 = async (fs, 어디 = '고르기') => {
    const 받을 = [...(fs || [])].filter((f) => 사진꼴.test(f.name) || /^image\//.test(f.type))
    if (!받을.length) { set오류('사진 파일(JPG · PNG · WEBP)을 골라 주십시오.'); return }
    set오류(''); set알림('')
    const 새 = [], 틀림 = []
    for (let i = 0; i < 받을.length; i++) {
      set바쁨(`사진을 읽는 중… ${i + 1} / ${받을.length}`)
      await 숨()
      try {
        const p = await 사진열기(받을[i])
        const 줄 = await 올릴사진(p.작업본, p.너비, p.높이)
        const id = 새사진id(), now = Date.now()
        const g = { 작업본: 줄.바이트, 작은그림: p.작은그림, 너비: 줄.w, 높이: 줄.h, 그림때: now }
        그림.current.set(id, g); await 곳.사진넣기(id, g)
        새.push({ id, 이름: p.이름, 파일때: p.파일때, 때: p.때, 기종: p.기종, 너비: 줄.w, 높이: 줄.h, 선명: p.선명, 밝기: p.밝기, 지문: p.지문, 값: {}, 새쪽: false, 값때: now, 그림때: now })
      } catch (e) { 틀림.push(e.message) }
    }
    set바쁨(''); set그림판((n) => n + 1)
    if (새.length) {
      const ids = 새.map((p) => p.id)
      set밀린((a) => [...a, ...ids]); 밀린r.current = [...밀린r.current, ...ids]
      고치기((o) => ({ ...o, 목록: o.차례 === '그대로' ? [...o.목록, ...새] : 정렬하기([...o.목록, ...새], o.차례) }))
      세기(`|실시간사진대지|${어디}`)
      set알림(연결r.current ? `사진 ${새.length}장 — 올리는 중입니다.` : `사진 ${새.length}장을 넣었습니다. 폰 ↔ PC 로 보내려면 위에서 «현장 만들기» 또는 «코드로 열기».`)
    }
    if (틀림.length) set오류(틀림.slice(0, 3).join(' / ') + (틀림.length > 3 ? ` 외 ${틀림.length - 3}장` : ''))
  }
  const 표시 = useMemo(() => 표시하기(목록), [목록])
  const 설정바꾸기 = (고칠) => 고치기((o) => ({ ...o, 설정: { ...o.설정, ...고칠 }, 설정때: Date.now() }))
  const 사진바꾸기 = (id, 고칠) => 고치기((o) => ({ ...o, 목록: o.목록.map((p) => (p.id === id ? { ...p, ...(typeof 고칠 === 'function' ? 고칠(p) : 고칠), 값때: Date.now() } : p)) }))
  const 값바꾸기 = (id, 칸, v) => 사진바꾸기(id, (p) => ({ 값: { ...p.값, [칸]: v } }))
  const 아래로같게 = (i, 칸) => {
    const v = 칸값(목록[i], 칸, 설정), now = Date.now()
    고치기((o) => ({ ...o, 목록: o.목록.map((p, j) => (j > i ? { ...p, 값: { ...p.값, [칸]: v }, 값때: now } : p)) }))
    set알림(`${i + 2}번부터 끝까지 «${v || '(빈칸)'}» 로 채웠습니다.`)
  }
  const 옮기기 = (i, d) => 고치기((o) => {
    const a = [...o.목록]; const j = i + d
    if (j < 0 || j >= a.length) return o
    ;[a[i], a[j]] = [a[j], a[i]]
    return { ...o, 목록: a, 차례: '그대로', 설정때: Date.now() }
  })
  const 차례바꾸기 = (v) => 고치기((o) => ({ ...o, 차례: v, 설정때: Date.now(), 목록: v === '그대로' ? o.목록 : 정렬하기(o.목록, v) }))
  const 빼기 = (ids, 확인 = false) => {
    if (확인 && !window.confirm(`사진 ${ids.length}장을 뺄까요? (폰 · PC 모두에서 빠집니다)`)) return
    const 뺄 = new Set(ids), now = Date.now()
    for (const id of ids) 그림.current.delete(id)
    곳.사진지우기(ids); set그림판((n) => n + 1)
    set밀린((a) => a.filter((x) => !뺄.has(x))); 밀린r.current = 밀린r.current.filter((x) => !뺄.has(x))
    고치기((o) => { const 지움 = { ...(o.지움 || {}) }; for (const id of ids) 지움[id] = now; return { ...o, 목록: o.목록.filter((p) => !뺄.has(p.id)), 지움 } })
    const v = 연결r.current
    if (v) for (const id of ids) 손.사진지우기(v.c, id).catch(() => {})
  }
  const 돌리기 = async (p) => {
    const g = 그림.current.get(p.id)
    if (!g) return
    set바쁨('사진을 돌리는 중…')
    try {
      const q = await 사진돌리기({ ...p, 작업본: g.작업본, 너비: g.너비, 높이: g.높이 }, 90)
      const now = Date.now()
      const ng = { 작업본: q.작업본, 작은그림: q.작은그림, 너비: q.너비, 높이: q.높이, 그림때: now }
      그림.current.set(p.id, ng); await 곳.사진넣기(p.id, ng); set그림판((n) => n + 1)
      if (!밀린r.current.includes(p.id)) { set밀린((a) => [...a, p.id]); 밀린r.current = [...밀린r.current, p.id] }
      고치기((o) => ({ ...o, 목록: o.목록.map((x) => (x.id === p.id ? { ...x, 너비: q.너비, 높이: q.높이, 그림때: now } : x)) }))
    } finally { set바쁨('') }
  }
  const 모두지우기 = () => {
    if (!목록.length || !window.confirm(`사진 ${목록.length}장과 적은 내용을 모두 지울까요? (폰 · PC 모두)`)) return
    빼기(목록.map((p) => p.id))
    set알림('')
  }

  /* ── 쪽 · 미리보기 · 내려받기 (PhotoBook 과 같음) ── */
  const 목록그림 = useMemo(() => 목록.map((p) => { const g = 그림.current.get(p.id); return g ? { ...p, 작업본: g.작업본, 작은그림: g.작은그림, 너비: g.너비, 높이: g.높이 } : p }), [목록, 그림판])  // eslint-disable-line react-hooks/exhaustive-deps
  const 결과 = useMemo(() => 사진대지쪽들(목록그림, 설정), [목록그림, 설정])
  const 그림찾기 = useMemo(() => { const m = new Map(목록그림.map((p) => [p.id, p])); return (id) => 그림주소(m.get(id) && m.get(id).작업본) }, [목록그림])
  const 없는수 = 목록그림.filter((p) => !p.작업본).length

  const 내보내기 = async (형식) => {
    const 창 = 형식 === 'print' ? window.open('', '_blank') : null
    set오류('')
    try {
      const 있는 = 목록그림.filter((p) => p.작업본)
      if (!있는.length) throw new Error('아직 받은 사진이 없습니다')
      const { 쪽들, 그림요청 } = 사진대지쪽들(있는, 설정)
      const 그림들 = new Map()
      const 찾 = new Map(있는.map((p) => [p.id, p]))
      let n = 0
      for (const [열쇠, r] of 그림요청) {
        n += 1
        set바쁨(`사진을 알맞게 줄이는 중… ${n} / ${그림요청.size}`)
        await 숨()
        그림들.set(열쇠, await 그림준비(찾.get(r.id), r.비율, 설정.용량, r.보드 || null))
      }
      const 실 = 형식 === 'print' ? 'pdf' : 형식
      set바쁨(`${형식표[실][0]} 파일을 만드는 중…`)
      await 숨()
      const 제목 = 설정.제목 || '사진대지'
      const 바이트 = await 파일만들기(실, 쪽들, 그림들, 제목)
      const 이름 = `${파일이름([제목, 설정.공사명].filter(Boolean).join('_'))}_${오늘()}${형식표[실][2]}`
      if (형식 === 'print') {
        const url = URL.createObjectURL(new Blob([바이트], { type: 'application/pdf' }))
        if (창) 창.location.href = url; else 저장하기(이름, 바이트, 형식표.pdf[1])
      } else 저장하기(이름, 바이트, 형식표[실][1])
      set알림(`✔ ${이름} — ${쪽들.length}쪽 · ${(바이트.length / 1048576).toFixed(1)}MB${없는수 ? ` · 아직 받지 못한 사진 ${없는수}장은 빠짐` : ''}`)
      세기('|실시간사진대지|내려받기')
      try { askAfter('photo') } catch (e) { /* 없음 */ }
    } catch (e) {
      if (창) 창.close()
      set오류(`만들지 못했습니다 — ${e && e.message ? e.message : e}`)
    } finally { set바쁨('') }
  }

  /* ── 현장 코드: 만들기 · 열기 · 끊기 ── */
  const 처음으로 = () => { set화면(''); set오류(''); set한번더(''); set폼((f) => ({ ...f, pw: '', pw2: '' })) }
  const 만들기 = async () => {
    const pw = 폼.pw
    if (pw.length < 6) { set오류('비밀번호는 6자 이상으로 해 주십시오.'); return }
    if (pw !== 폼.pw2) { set오류('비밀번호 두 개가 다릅니다.'); return }
    set바쁨('현장 코드를 만드는 중…'); set오류('')
    try {
      const r = await 손.만들기(폼.name || '사진대지', pw, 올릴상태(상태r.current))
      목록기억(NS, r.코드, r.이름)
      const ids = 상태r.current.목록.map((p) => p.id)
      set밀린(ids); 밀린r.current = ids
      set연결({ c: r.코드, n: r.이름, r: r.r, d: false })
      set화면('made'); set폼((f) => ({ ...f, pw: '', pw2: '' }))
      세기('|실시간사진대지|만들기')
    } catch (e) { set오류('만들지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.') } finally { set바쁨('') }
  }
  const 열기 = async () => {
    const c = 코드정리(폼.c)
    if (c.length !== 9) { set오류('코드 9자리를 넣어 주십시오.'); return }
    if (!폼.pw) { set오류('비밀번호를 넣어 주십시오.'); return }
    set바쁨('현장을 여는 중…'); set오류('')
    try {
      const x = await 손.열기(c, 폼.pw)
      if (x.서버 && x.서버.잠김) throw Object.assign(new Error('비밀번호가 틀립니다'), { code: '비번' })
      목록기억(NS, c, x.이름)
      const 서버상태 = (x.서버 && x.서버.상태) || null
      const 합 = 서버상태 ? 합치기pb(서버상태, 상태r.current) : 상태r.current
      상태r.current = 합; set상태(합)
      const 서버id = new Set(((서버상태 && 서버상태.목록) || []).map((p) => p.id))
      const 내것 = 합.목록.filter((p) => !서버id.has(p.id) && 그림.current.has(p.id)).map((p) => p.id)
      set밀린(내것); 밀린r.current = 내것
      set연결({ c, n: x.이름, r: (x.서버 && x.서버.r) || 0, d: 내것.length > 0 || !서버상태 })
      set화면(''); set폼((f) => ({ ...f, pw: '' }))
      set알림(`«${x.이름 || 코드보기(c)}» 을(를) 열었습니다 — 사진 ${합.목록.length}장.`)
      세기('|실시간사진대지|열기')
      if (서버상태) 사진받아오기(합, { c, r: (x.서버 && x.서버.r) || 0 })   /* 🩹 G495 연결r 이 잡히기 전이라 연결을 바로 넘김 */
    } catch (e) {
      set오류(e && e.code === '비번' ? '비밀번호가 틀립니다.' : /permission|PERMISSION|없음/.test(String(e && (e.code || e.message))) ? '코드 또는 비밀번호가 틀립니다.' : '열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }
  const 비번다시 = async () => {
    const v = 연결r.current
    if (!v) return
    set바쁨('확인 중…')
    try { const raw = await 손.잠금풀기(v.c, 폼.pw); if (!raw) { set오류('비밀번호가 틀립니다.'); return } set오류(''); set저장('ok'); set폼((f) => ({ ...f, pw: '' })); 올림(); 손.판보기(v.c).then((판) => 받음(판)).catch(() => {}) } finally { set바쁨('') }
  }
  const 끊기 = async () => {
    const v = 연결r.current
    if (!v) return
    if (한번더 !== '끊기') { set한번더('끊기'); return }
    set한번더('')
    await 손.끊기(v.c)
    set연결(null); set밀린([]); 밀린r.current = []; set저장('off'); set화면('')
    set알림('이 기기에서 끊었습니다 — 이 기기의 사진 · 적은 것은 그대로 있습니다.')
  }
  const 복사 = async () => {
    const v = 연결r.current
    if (!v) return
    const 주소 = `${window.location.origin}${window.location.pathname}?c=${v.c}`
    const 글 = `K-건설맵 실시간 사진대지${v.n ? ` — ${v.n}` : ''}\n코드 ${코드보기(v.c)}\n${주소}\n(비밀번호는 따로 알려 드립니다)`
    try { await navigator.clipboard.writeText(글); set복사됨(true); setTimeout(() => set복사됨(false), 2500) } catch (e) { set알림(글.replace(/\n/g, ' · ')) }
  }
  const 지난코드 = 목록읽기(NS)

  /* ── 그리기 ── */
  const 못올린 = 밀린.length
  const 상태글 = !연결 ? null : {
    ok: <span className="bk-ok">✅ 폰 · PC 같음{마지막 ? ` · ${시각(마지막.at)}${마지막.by ? ' ' + 마지막.by : ''}` : ''}</span>,
    ing: <span className="bk-ing">⏳ 올리는 중…{못올린 ? ` ${못올린}장` : ''}</span>,
    wait: <span className="bk-warn">📶 인터넷이 안 됩니다 — 이 기기에 모아 두었다가({못올린}장) 연결되면 저절로 올립니다</span>,
    lock: <span className="bk-warn">🔒 이 기기에서 비밀번호를 한 번 더 넣어야 합니다</span>,
    big: <span className="bk-warn">⚠️ 사진이 너무 많아 서버에 못 올립니다</span>,
    off: null,
  }[저장]
  const 사진상태 = (id) => (올리는중 === id ? ['↑ 올리는 중', 'ing'] : 밀린.includes(id) ? ['⏳ 올리기 전', 'wait'] : !그림.current.has(id) ? ['↓ 받는 중', 'ing'] : ['✓', 'ok'])

  return (
    <div className="pb pl">
      <div className="card pb-head">
        <h1>📡 실시간 사진대지 — 폰에서 찍으면 PC 에 바로</h1>
        <p>현장에서 폰으로 찍은 사진이 <b>몇 초 안에 사무실 PC 의 사진대지</b>에 들어갑니다. 현장 코드 + 비밀번호로 폰과 PC 를 잇고,
          사진 · 글은 <b>비밀번호로 잠가 올려</b> 운영자도 못 봅니다. 가입 없음 · PDF · 엑셀 · 한글 · 워드.</p>
      </div>

      {/* 🔗 현장 코드 */}
      <div className="bk no-print" data-ns={NS}>
        <div className="bk-bar">
          {연결
            ? <><b>📡 현장</b><span className="bk-code">{연결.n ? `${연결.n} · ` : ''}코드 {코드보기(연결.c)}</span>{상태글}{받는중 > 0 && <span className="bk-ing">↓ 사진 받는 중 {받는중}장</span>}</>
            : <><b>📡 폰 ↔ PC 잇기</b><span className="muted">지금은 이 기기에만 있습니다 — 현장 코드로 폰과 PC 를 이으십시오</span></>}
          <span className="bk-btns">
            {!연결 && <button type="button" className="btn sm" onClick={() => { 처음으로(); set화면('make') }}>현장 만들기</button>}
            {!연결 && <button type="button" className="btn line sm" onClick={() => { 처음으로(); set화면('open') }}>코드로 열기</button>}
            {연결 && <button type="button" className="btn line sm" onClick={복사}>{복사됨 ? '✓ 복사했습니다' : '📋 코드 · 주소 복사'}</button>}
            {연결 && <button type="button" className="btn ghost sm" onClick={() => { set오류(''); 손.판보기(연결.c).then((판) => { if (판 === (연결r.current && 연결r.current.r)) { set알림('서버와 같습니다.'); 사진받아오기(상태r.current) } else 받음(판) }).catch(() => set오류('받지 못했습니다 — 인터넷을 확인해 주십시오.')); 올림() }} disabled={!!바쁨}>⟳ 새로 받기</button>}
            {연결 && <button type="button" className="btn ghost sm bk-cut" onClick={끊기} disabled={!!바쁨}>{한번더 === '끊기' ? '한 번 더 누르면 끊습니다' : '끊기'}</button>}
          </span>
        </div>
        {바쁨 && <div className="bk-busy">{바쁨}</div>}
        {오류 && <div className="bk-err">{오류}</div>}
        {알림 && <div className="bk-note">{알림} <button type="button" className="bk-x" onClick={() => set알림('')} aria-label="닫기">✕</button></div>}
        {저장 === 'lock' && 연결 && (
          <div className="bk-box">
            <div>🔒 이 기기의 잠금 열쇠가 없습니다(브라우저 저장소를 비웠거나 다른 곳에서 끊음). <b>비밀번호</b>를 한 번 더 넣어 주십시오.</div>
            <div className="bk-row">
              <input className="inp" type="password" placeholder="비밀번호" value={폼.pw} onChange={폼칸('pw')} autoComplete="current-password" />
              <button type="button" className="btn sm" onClick={비번다시} disabled={!!바쁨}>확인</button>
            </div>
          </div>
        )}
        {화면 === 'make' && (
          <div className="bk-box">
            <div><b>현장 만들기</b> — 코드 9자리가 나옵니다. 폰에서 코드 + 비밀번호로 열면 찍은 사진이 이 화면에 바로 들어옵니다.</div>
            <div className="bk-form">
              <label>현장 이름 (잠그지 않음 — 알아볼 만큼만) <input className="inp" value={폼.name} onChange={폼칸('name')} placeholder="○○ 현장 사진대지" maxLength={60} /></label>
              <label>비밀번호 (6자 이상) <input className="inp" type="password" value={폼.pw} onChange={폼칸('pw')} autoComplete="new-password" /></label>
              <label>비밀번호 한 번 더 <input className="inp" type="password" value={폼.pw2} onChange={폼칸('pw2')} autoComplete="new-password" /></label>
            </div>
            <div className="bk-row">
              <button type="button" className="btn sm" onClick={만들기} disabled={!!바쁨}>만들기</button>
              <button type="button" className="btn ghost sm" onClick={처음으로}>그만두기</button>
            </div>
            <div className="muted sm">⚠️ 비밀번호를 잊으면 서버 것은 저희도 열어 드릴 수 없습니다(잠가 두기 때문). 적어 두십시오.</div>
          </div>
        )}
        {화면 === 'made' && 연결 && (
          <div className="bk-box ok">
            <div>✅ 만들었습니다. 폰에서 이 <b>코드</b>와 비밀번호로 여십시오.</div>
            <div className="bk-big">{코드보기(연결.c)}</div>
            <div>폰으로 <b>k-conmap.com/tools/photo-live</b> 를 열고 <b>«코드로 열기»</b> → 코드 + 비밀번호 → <b>«📸 찍기»</b>. «📋 코드 · 주소 복사» 를 카톡으로 보내면 폰에서 누르기만 하면 됩니다(비밀번호는 따로).</div>
            <div className="bk-row">
              <button type="button" className="btn line sm" onClick={복사}>{복사됨 ? '✓ 복사했습니다' : '📋 코드 · 주소 복사 (카톡으로 보내기)'}</button>
              <button type="button" className="btn ghost sm" onClick={() => set화면('')}>닫기</button>
            </div>
          </div>
        )}
        {화면 === 'open' && (
          <div className="bk-box">
            <div><b>코드로 열기</b> — PC(또는 다른 폰)에서 만든 현장 코드와 비밀번호를 넣습니다.</div>
            <div className="bk-form">
              <label>코드 9자리 <input className="inp" value={폼.c} onChange={폼칸('c')} placeholder="ABC-DEF-GHJ" autoCapitalize="characters" inputMode="text" /></label>
              <label>비밀번호 <input className="inp" type="password" value={폼.pw} onChange={폼칸('pw')} autoComplete="current-password" onKeyDown={(e) => { if (e.key === 'Enter') 열기() }} /></label>
            </div>
            {지난코드.length > 0 && (
              <div className="bk-row"><span className="muted sm">이 기기에서 연 현장:</span>
                {지난코드.slice(0, 5).map((x) => <button key={x.c} type="button" className="chip" onClick={() => set폼((f) => ({ ...f, c: 코드보기(x.c) }))}>{x.n || 코드보기(x.c)}</button>)}
              </div>
            )}
            <div className="bk-row">
              <button type="button" className="btn sm" onClick={열기} disabled={!!바쁨}>열기</button>
              <button type="button" className="btn ghost sm" onClick={처음으로}>그만두기</button>
            </div>
            {목록.length > 0 && <div className="muted sm">이 기기에 있는 사진 {목록.length}장도 그 현장에 함께 올라갑니다.</div>}
          </div>
        )}
      </div>

      <div className="pb-grid">
        <div className="pb-left">
          <사용법 처음={!목록.length && !연결} />

          {/* ① 사진 */}
          <section className="card pb-step">
            <div className="pb-sh"><span className="pb-no">1</span>사진 <span className="count">· {목록.length}장{못올린 ? ` · 올리기 전 ${못올린}` : ''}{없는수 ? ` · 받는 중 ${없는수}` : ''}</span></div>
            {폰 ? (
              <div className="pl-shoot">
                <button type="button" className="btn pl-shootb" onClick={() => 찍기.current && 찍기.current.click()} disabled={!!바쁨}>📸 찍기</button>
                <button type="button" className="btn line" onClick={() => 입력.current && 입력.current.click()} disabled={!!바쁨}>📷 앨범에서 고르기</button>
                <p className="pb-note">{연결 ? '찍으면 바로 PC 로 올라갑니다 — 사진마다 ✓ 가 붙습니다.' : '먼저 위에서 «코드로 열기» 를 하면 찍은 사진이 PC 로 갑니다.'}</p>
              </div>
            ) : (
              <div className="pb-drop" onClick={() => 입력.current && 입력.current.click()} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') 입력.current && 입력.current.click() }}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); 올리기(e.dataTransfer.files, '끌어놓기') }}>
                <div className="pb-dropi">📡</div>
                <b>{연결 ? '폰에서 찍은 사진이 여기로 들어옵니다' : '위에서 «현장 만들기» → 폰에서 찍으면 여기로 들어옵니다'}</b>
                <span className="muted">PC 에 있는 사진은 끌어다 놓거나 눌러서 고르기 · JPG · PNG · WEBP</span>
              </div>
            )}
            {!폰 && 폰기기() && <div className="pb-row"><button type="button" className="btn ghost sm" onClick={() => 찍기.current && 찍기.current.click()} title="카메라가 바로 열립니다">📸 찍기</button></div>}
            <input ref={입력} type="file" accept="image/*" multiple hidden onChange={(e) => { const fs = [...e.target.files]; e.target.value = ''; 올리기(fs, '고르기') }} />
            <input ref={찍기} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const fs = [...e.target.files]; e.target.value = ''; 올리기(fs, '찍기') }} />
            <div className="pb-row">
              <label className="pb-lab">차례 <select value={상태.차례} onChange={(e) => 차례바꾸기(e.target.value)}>
                <option value="때">찍은 시각 차례</option><option value="이름">파일 이름 차례</option><option value="그대로">올린 차례(손으로)</option>
              </select></label>
              {목록.length > 0 && <button type="button" className="btn ghost sm" onClick={모두지우기}>모두 지우기</button>}
            </div>
            <p className="pb-note">🔒 사진 · 글은 비밀번호로 잠가 올립니다. 서버의 사진은 {사진둘날}일 뒤 지워지고, 이 기기에는 남습니다.</p>
          </section>

          {/* ② 꾸미기 — PhotoBook 과 같은 칸 */}
          <꾸미기칸 설정={설정} 설정바꾸기={설정바꾸기} 셈머리="|실시간사진대지" />

          {/* ③ 내용 */}
          <section className="card pb-step">
            <div className="pb-sh"><span className="pb-no">3</span>내용 적기 <span className="count">· 일자는 찍은 때가 저절로 · 적으면 폰 · PC 모두 바뀜</span></div>
            {!목록.length && <p className="muted" style={{ margin: 0 }}>사진이 들어오면 사진마다 칸이 나옵니다.</p>}
            <div className="pb-list">
              {목록그림.map((p, i) => {
                const 표 = 표시.get(p.id) || []
                const 칸들 = 설정.항목줄.flat()
                const [상태말, 상태꼴] = 사진상태(p.id)
                return (
                  <div key={p.id} className={'pb-item' + (표.length ? ' flag' : '')}>
                    <div className="pb-thumb">
                      {p.작은그림 ? <img src={p.작은그림} alt="" loading="lazy" /> : <div className="pl-wait">↓</div>}
                      <span className="pb-num">{설정.비교 ? `${Math.floor(i / 2) + 1}${i % 2 ? '후' : '전'}` : i + 1}</span>
                      <span className={'pl-st ' + 상태꼴} title={상태말}>{상태말}</span>
                      {표.length > 0 && <span className="pb-flags">{표.map((t) => <i key={t} className={'fl-' + t}>{t === '닮음' ? '거의 같음' : t === '어둠' ? '어두움' : t}</i>)}</span>}
                    </div>
                    <div className="pb-fields">
                      <div className="pb-meta" title={p.이름}>{p.이름}{p.때 ? ` · ${p.때.slice(5, 16).replace('-', '/')}` : ''}</div>
                      {칸들.map((f) => (
                        <div className="pb-kv" key={f.id}>
                          <span>{f.이름}</span>
                          <input value={칸값(p, f.id, 설정)} onChange={(e) => 값바꾸기(p.id, f.id, e.target.value)} placeholder={f.id === 'd' ? 'YYYY.MM.DD' : ''} />
                          {f.id === 'n' && (
                            <select className="pb-phr" value="" aria-label="현장 문구" onChange={(e) => { if (e.target.value) 값바꾸기(p.id, 'n', e.target.value) }}>
                              <option value="">문구▾</option>
                              {Object.entries(문구모음).map(([g, 것]) => <optgroup key={g} label={g}>{것.map((x) => <option key={x} value={x}>{x}</option>)}</optgroup>)}
                            </select>
                          )}
                          {i < 목록.length - 1 && <button type="button" className="pb-down" title="아래 사진 모두 이 값으로" onClick={() => 아래로같게(i, f.id)}>↓</button>}
                        </div>
                      ))}
                      <div className="pb-acts">
                        <button type="button" onClick={() => 옮기기(i, -1)} disabled={i === 0} title="앞으로">↑</button>
                        <button type="button" onClick={() => 옮기기(i, 1)} disabled={i === 목록.length - 1} title="뒤로">↓</button>
                        <button type="button" onClick={() => 돌리기(p)} disabled={!p.작업본} title="오른쪽으로 돌리기">⟳</button>
                        <label className="pb-nb" title="이 사진부터 새 쪽"><input type="checkbox" checked={!!p.새쪽} onChange={(e) => 사진바꾸기(p.id, { 새쪽: e.target.checked })} />새 쪽</label>
                        <button type="button" className="pb-del" onClick={() => 빼기([p.id])} title="빼기">✕ 빼기</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ④ 내려받기 */}
          <section className="card pb-step">
            <div className="pb-sh"><span className="pb-no">4</span>내려받기 <span className="count">· {결과.쪽들.length}쪽</span></div>
            <내보내기줄 바쁨={바쁨} 할={내보내기} 용량={설정.용량 || '보통'} set용량={(v) => 설정바꾸기({ 용량: v })} 수={목록.length - 없는수} />
            {알림 && !화면 && <div className="cok">{알림}</div>}
            {오류 && <div className="pb-err">{오류}</div>}
          </section>
        </div>
        <div className="pb-right">
          <미리보기판 쪽들={결과.쪽들} 그림찾기={그림찾기} 제목={연결 ? `미리보기 · ${연결.n || 코드보기(연결.c)}` : '미리보기'} />
        </div>
        {!폰 && <끌어놓기판 길들={[{ 꼴: 사진꼴, 받기: (fs) => 올리기(fs, '끌어놓기'), 여럿: true }]} 글="사진을 놓으면 사진대지에 들어갑니다" />}
      </div>
    </div>
  )
}
