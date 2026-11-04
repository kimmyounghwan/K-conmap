/* ✍️ G361 (2026-10-21) 서식 «종이에 바로 쓰기» — 엑셀 칸 그대로 · 자동 계산 · 그림 PDF
 *   소장님: 「사이트에서 작업이 가능하게 해야 해. 그래야 계속 사람들이 오니까. 이게 내 밥 줄」
 *          「서식도 사이트에서… 값 없이… 작업하려면 다시 사이트 찾게」 → 고르심 «빈 틀만 엑셀»
 *          「불편하지 않게 · 간편하게 · 되도록 자동으로 — 서식 받아서 하는 것보다 사이트에서 하는 게 더 간편해야」
 *          「pdf로 해도 엑셀로 전환 가능하지 않아??」 → 고르심 «그림 PDF»
 *   ■ 종이 = 엑셀 서식과 같은 칸(tools/forms2/격자.py → /forms/g/{slug}.json) · 수식 = 엑셀 수식 그대로(lib/엑셀셈.js)
 *     → 칸을 누르면 아래 «쓰는 칸» 이 뜨고, 쓰는 대로 합계 · 금액 · 날짜가 저절로 바뀝니다.
 *   ■ 저절로: 공사명 · 회사 · 발주기관 · 현장대리인 … 한 번 쓰면 다른 서식에도 먼저 채움(kcm.서식공통 — 블록 서식과 같이 씀) ·
 *     작성일 · 서명일은 오늘 · 쓰던 것은 이 기기에 저절로 남음(서버로 안 감).
 *   ■ PDF · 인쇄 = 종이를 그림으로(글자 층 없음 → 변환 프로그램으로 엑셀이 안 나옴). 화면 인쇄(Ctrl+P)도 같은 그림.
 *   ■ 숨은 누적: |서식격자|열기 · |서식격자|PDF · |서식격자|인쇄 · |서식격자|예시 · |서식격자|저장 (PDF 는 받은 수 /forms/w/{slug}.pdf 에도 1)
 *
 * 📷 G492 (2026-11-01) 사진 칸 — 소장님 「사진 대지도 도구화 해줘. 내 컴퓨터에서 사진 불러 와서.. 편하게 .. 이용자 입장에서」
 *   ■ 사진 칸 = 쓰는 칸인데 그 열 머리글에 «사진» 이 있고 높이가 25pt 넘는 빈 칸(공사 사진대지 «사진 (붙이는 칸)» 3칸). 종이에 «사진 넣기 — 칸을 누르면…» 안내.
 *   ■ 칸을 누르면 아래 쓰는 칸에 «📷 사진 고르기»(여러 장을 고르면 그 칸부터 아래 사진 칸으로 차례로) · «📸 찍기»(폰 카메라) · «⟳ 돌리기» · «✕ 빼기».
 *     종이에 사진 파일을 끌어다 놓아도 됩니다(놓은 칸부터 · 사진 칸이 아니면 빈 사진 칸부터).
 *   ■ 사진은 lib/사진정리.js 사진열기(EXIF 방향대로 세움 · 긴 쪽 2000 · JPEG)로 읽고, 찍은 날(EXIF)이 있으면 같은 줄 «촬영일» 칸이 비었을 때 채웁니다.
 *   ■ 화면 · PDF · 인쇄 모두 같은 그림(격자그림.js 쪽그리기 사진칸) · 사진은 서버로 안 가고 이 브라우저(IndexedDB · lib/격자사진.js)에 남습니다 — 쓰던 것(cur) · 💾 저장한 것(id).
 *   ■ «✍ 예시 채우기» 는 사진 칸에도 가상 사진(lib/사진예시.js) · «🧹 빈칸으로» 는 사진도 뺌 · «복사해 새로» 는 사진 없이(새 날 사진).
 *   ■ 숨은 누적: |서식격자|사진 (사진을 넣을 때 1)
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { 사진열기, 사진돌리기 } from '../lib/사진정리.js'
import { 사진남기기, 사진꺼내기, 사진지우기, 그림으로 } from '../lib/격자사진.js'
import { 책만들기, 자리글, 일련, 날짜로, 오늘일련 } from '../lib/엑셀셈.js'
import { 꼴 } from '../lib/엑셀꼴.js'
import { 판짜기, 쪽그리기, 칸찾기, 칸상자, 칸쪽, 칸이름 } from '../lib/격자그림.js'
import { PDF만들기, 캔버스JPEG, 파일주기 } from '../lib/그림PDF.js'
import { 받음, 세기 } from '../lib/받은수.jsx'
import 안내 from '../data/서식쓰기안내.json'   // prerender.py 도 같은 글(크롤러 · 사람이 보는 글이 같게)

const V = (typeof window !== 'undefined' && typeof window.__KCM_BUILD__ === 'string' && window.__KCM_BUILD__) || '0'   // 🩹 G511 — 도장은 HTML 에서(lib/data.js 와 같음)
const 쓴열쇠 = 'kcm.격자'
const 공통열쇠 = 'kcm.서식공통'
const 읽기 = (k, 없으면) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? 없으면 : v } catch (e) { return 없으면 } }
const 쓰기 = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch (e) { return false } }
const 오늘글 = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
/* 📸 찍기는 폰(카메라 있는 기기)에서만 — 소장님 「찍기는 왜 있지?」(PC 엔 쓸 일 없음) */
const 폰기기 = () => { try { return navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) } catch (e) { return false } }

/* 한 번 쓰면 다른 서식에도 — 칸 이름(열쇠)으로 알아봄. 앞 셋은 블록 서식(서식작성.jsx)과 같은 열쇠 */
const 공통칸 = [
  ['현장', /^(공사명|현장명|공사건명|원도급공사명|공사명칭|건명)$/],
  ['회사', /^(회사명|업체명|시공사|상호|시공자|소속회사|회사)$/],
  ['작성', /^(작성자)$/],
  ['발주', /^(발주기관|발주처|발주자|발주청)$/],
  ['계약번호', /^(계약번호)$/],
  ['계약금액', /^(계약금액)$/],
  ['공기', /^(공기|공사기간|계약기간)$/],
  ['착공', /^(착공일|착공일자|착공)$/],
  ['준공', /^(준공일|준공예정일|준공일자)$/],
  ['위치', /^(현장위치|공사장소|공사위치|현장주소|현장소재지)$/],
  ['대표', /^(대표자|대표이사)$/],
  ['대리인', /^(현장대리인|현장소장|현장책임자)$/],
  ['연락처', /^(연락처|전화번호)$/],
  ['사업자', /^(사업자등록번호|사업자번호)$/],
]
const 오늘칸 = /^(작성일|작성일자|일자|날짜|서명일\d*|제출일|신청일|보고일|보고일자|작성연월일|점검일|점검일자|교육일|교육일자|회의일|회의일자)$/   // 오늘 날짜로 먼저(고쳐 쓰면 그대로)
const 열쇠이름 = (k) => String(k || '').replace(/^t\d+\./, '').replace(/\s+/g, '')
const 공통이름 = (k) => { const s = 열쇠이름(k); if (/#\d+$/.test(s)) return null; const x = 공통칸.find(([, re]) => re.test(s)); return x ? x[0] : null }

const 날꼴인가 = (nf) => !!nf && /[yd]|m+[^"]*d/i.test(String(nf).replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '')) && !/^\s*h/.test(nf)
const 수꼴인가 = (nf) => !!nf && !날꼴인가(nf) && /[0#]/.test(String(nf).replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, ''))
const 퍼센트꼴 = (nf) => !!nf && /%/.test(String(nf).replace(/"[^"]*"/g, ''))
const 날짜글로 = (s) => { const d = 날짜로(s); return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` }

/** 쓴 글 → 칸 값(엑셀처럼: 날짜 칸은 날짜 · 수 칸은 수 · % 칸은 ÷100) */
function 값읽기(t, x) {
  const nf = x[8]
  const s = String(t ?? '')
  if (s.trim() === '') return null
  if (날꼴인가(nf)) {
    const m = /^(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})/.exec(s.trim())
    if (m) return 일련(+m[1], +m[2], +m[3])
    const m2 = /^(\d{1,2})\s*[-./월]\s*(\d{1,2})/.exec(s.trim())
    if (m2) return 일련(new Date().getFullYear(), +m2[1], +m2[2])
    return s
  }
  const n = s.replace(/[,\s원₩]/g, '')
  if (/^[+-]?(\d+\.?\d*|\.\d+)%?$/.test(n) && (수꼴인가(nf) || !nf || typeof x[6] === 'number')) {
    let v = Number(n.replace('%', ''))
    if (n.endsWith('%') || 퍼센트꼴(nf)) v = v / 100
    return v
  }
  return s
}
/** 칸 값 → 쓰는 칸 글 */
function 값글(v, x) {
  if (v === null || v === undefined) return ''
  const nf = x[8]
  if (typeof v === 'number' && 날꼴인가(nf)) return 날짜글로(v)
  if (typeof v === 'number' && 퍼센트꼴(nf)) return String(Number((v * 100).toPrecision(12)))
  if (typeof v === 'number') return String(Number(v.toPrecision(15)))
  return String(v)
}

export default function 격자작성({ slug, title, 빈틀 }) {
  const [doc, setDoc] = useState(null)
  const [못받음, set못받음] = useState(false)
  useEffect(() => {
    let 살 = true
    fetch(`/forms/g/${slug}.json?v=${V}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (살) setDoc(d) }).catch(() => { if (살) set못받음(true) })
    return () => { 살 = false }
  }, [slug])
  if (못받음) return <div className="card muted" id="작성">작성 칸을 받지 못했습니다 — 인터넷을 확인하고 새로고침 해 주세요.</div>
  if (!doc) return <div className="card muted" id="작성">✍️ 종이를 펴는 중…</div>
  return <종이작성 doc={doc} slug={slug} title={title} 빈틀={빈틀} />
}

function 종이작성({ doc, slug, title, 빈틀 }) {
  const 책 = useMemo(() => { const b = 책만들기(doc); b.꼴 = 꼴; return b }, [doc])
  useEffect(() => { window.__격자 = { 책, doc }; return () => { if (window.__격자 && window.__격자.책 === 책) delete window.__격자 } }, [책, doc])   // 시험(tools/시험_서식종이.mjs)이 셈 값을 읽음
  const 판들 = useMemo(() => doc.sheets.map((s) => 판짜기(s)), [doc])
  const 쓸칸 = useMemo(() => {
    const out = []
    doc.sheets.forEach((s, si) => { for (const x of s.cells) if ((x[5] === 1 || x[5] === 3) && x[1] <= s.pc) out.push({ si, x }) })
    out.sort((a, b) => a.si - b.si || a.x[0] - b.x[0] || a.x[1] - b.x[1])
    return out
  }, [doc])
  const [판번, set판번] = useState(0)
  const [고른, set고른] = useState(null)       // 쓸칸 차례
  /* 📷 G492 사진 칸 — 열 머리글(위로 올라가며 처음 만나는 글 있는 칸)에 «사진» · 높이 25pt 넘는 빈 쓰는 칸 */
  const 덮는칸들 = useMemo(() => doc.sheets.map((sh) => { const m = new Map(); for (const x of sh.cells) for (let i = x[0]; i < x[0] + x[2]; i++) for (let j = x[1]; j < x[1] + x[3]; j++) m.set(i * 16384 + j, x); return m }), [doc])
  const 사진칸표 = useMemo(() => {
    const out = new Map()      // 칸 → 머리글(📐 G529 예시 그림 고르기에 씀 · .has 는 Set 과 같음)
    doc.sheets.forEach((sh, si) => {
      const 판 = 판들[si], 덮 = 덮는칸들[si]
      for (const x of sh.cells) {
        if (x[5] !== 1 || x[1] > sh.pc || Array.isArray(x[9]) || (x[6] !== null && x[6] !== undefined && x[6] !== '' && !자리글({ v: x[6], nf: x[8] }))) continue
        if (판.Y[x[0] + x[2] - 1] - 판.Y[x[0] - 1] < 25) continue
        let 머리 = null
        for (let r = x[0] - 1; r >= 1; r--) { const y = 덮.get(r * 16384 + x[1]); if (!y || y === x) continue; if (y[5] === 1 || y[5] === 3) continue; const t = String(y[6] ?? '').trim(); if (t) { 머리 = t; break } }
        if (머리 && /사진/.test(머리)) out.set(x, 머리)
      }
    })
    return out
  }, [doc, 판들, 덮는칸들])
  const 사진칸인가 = useCallback((si, x) => 사진칸표.has(x), [사진칸표])
  const 사진칸들 = useMemo(() => 쓸칸.map((q, i) => ({ ...q, i })).filter((q) => 사진칸표.has(q.x)), [쓸칸, 사진칸표])
  const 사진들 = useRef(new Map())            // 'si|r,c' → { 그림, 바이트, w, h, 때 }
  const [사진판, set사진판] = useState(0)
  const 사진키 = (si, x) => `${si}|${x[0]},${x[1]}`
  const [사진중, set사진중] = useState('')
  const 사진파일칸 = useRef(null), 찍기칸 = useRef(null)
  const 고른R = useRef(null)                   // 빨리 칠 때 앞 칸에 쓰지 않게(상태보다 먼저 바뀜)
  const 고를때 = useRef(false)
  const [글, set글] = useState('')
  const [저장들, set저장들] = useState(() => { const a = (읽기(쓴열쇠, {})[slug] || {}).saved; return Array.isArray(a) ? a : [] })
  const [목록, set목록] = useState(false)
  const [말, set말] = useState('')
  /* 「자세히 설명해줘. 이용자가 알게」 — 전엔 처음 온 기기에서 펴 두었는데(접기 전까지 늘 펴짐), 열 줄 설명이 종이를 화면 아래로 밀어
     소장님 「사이트에서 쓰게 되어 있어야 하는데 … 어디서 작성하는 거지?」(10/22) → 늘 접어 둠 · 종이가 바로 보이게(G369) */
  const [안내열림, set안내열림] = useState(false)
  const 안내토글 = (열림) => set안내열림(열림)
  /* 🏷 G369 소장님 「건설맵 주소를 제거할 수 있게 해줘야 하잖아」 — 맨 위 «K-건설맵 | k-conmap.com» 줄을 넣고 뺌(화면 · 인쇄 · PDF) · 이 기기에 기억(모든 서식) */
  const [건설맵, set건설맵] = useState(() => { try { return localStorage.getItem('kcm.격자건설맵') !== '0' } catch (e) { return true } })
  const 건설맵바꿈 = (on) => { set건설맵(on); try { localStorage.setItem('kcm.격자건설맵', on ? '1' : '0') } catch (e) { /* */ } 세기(on ? '|서식격자|건설맵넣기' : '|서식격자|건설맵빼기') }
  const [확대, set확대] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 700 ? 1.5 : 1))   // 폰은 처음부터 크게(옆으로 밀어 봄)
  const [폭, set폭] = useState(0)
  const [인쇄할, set인쇄할] = useState(() => doc.sheets.map(() => true))
  const [쪽고름, set쪽고름] = useState('')        // PDF · 인쇄할 쪽(«1-3, 7») — 비우면 전부
  /* 큰 서식(검측 300항목 470쪽)은 화면 가까운 쪽만 그림(나머지는 크기만 — 기억 아낌) */
  const [보임, set보임] = useState(() => new Set(['0-0', '0-1', '0-2', '1-0']))
  const 감싸개 = useRef(null)
  const 캔버스들 = useRef(new Map())
  const 그림들 = useRef(new Map())
  const 셌다 = useRef(false)
  const 칸글자 = useRef(null)

  /* 처음: 쓰던 것 → 없으면 공통 칸 · 오늘 날짜 */
  useEffect(() => {
    const 내것 = 읽기(쓴열쇠, {})[slug] || {}
    if (내것.cur && Object.keys(내것.cur).length) { 책.들여오기(내것.cur); set판번((n) => n + 1); return }
    const n = 공통채우기(true)
    if (n) set말(`✨ 공사명 · 회사 등 ${n}칸을 지난번 쓴 값으로 채웠습니다 — 다르면 고치세요`)
    set판번((x) => x + 1)
  }, [책])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!셌다.current) { 셌다.current = true; 세기('|서식격자|열기') } }, [])
  /* 📷 쓰던 사진 — 이 브라우저에서 */
  useEffect(() => {
    let 살 = true
    if (!사진칸들.length) return undefined
    사진꺼내기(slug, 'cur').then(async (들) => {
      for (const p of 들) { if (!살) return; try { 사진들.current.set(p.칸, { 그림: await 그림으로(p.바이트), 바이트: p.바이트, w: p.w, h: p.h, 때: p.때 }) } catch (e) { /* 깨진 것은 뺌 */ } }
      if (살 && 들.length) { set사진판((n) => n + 1); set판번((n) => n + 1) }
    })
    return () => { 살 = false }
  }, [slug])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 📷 사진이 바뀌면 0.6초 뒤 남김 */
  useEffect(() => {
    if (!사진판) return undefined
    const t = setTimeout(() => { 사진남기기(slug, 'cur', 사진들.current) }, 600)
    return () => clearTimeout(t)
  }, [사진판, slug])
  useEffect(() => { if (!말) return undefined; const t = setTimeout(() => set말(''), 4500); return () => clearTimeout(t) }, [말])

  function 공통채우기(오늘도) {
    const 공통 = 읽기(공통열쇠, {})
    let n = 0
    doc.sheets.forEach((s, si) => {
      for (const x of s.cells) {
        if (!(x[5] === 1 || x[5] === 3) || x[1] > s.pc) continue
        const key = (s.keys || {})[`${열이름(x[1])}${x[0]}`]
        const c = 공통이름(key)
        /* 🏁 G499 공통 값은 «쳐 넣은 것» 과 같은 길(값읽기)로 — 계약금액 «222,498,175» · 착공일 «2026-11-10» 이 글이 아니라 숫자 · 날짜로 들어가 셈(한글 금액 · 공기)이 됨 */
        if (c && 공통[c] && 책.입력값(si, x[0], x[1]) === undefined && 자리글({ v: x[6], nf: x[8] })) { const 값 = 값읽기(String(공통[c]), x); 책.넣기(si, x[0], x[1], 값 === null ? 공통[c] : 값); n++ }
        else if (오늘도 && 오늘칸.test(열쇠이름(key)) && 날꼴인가(x[8]) && 책.입력값(si, x[0], x[1]) === undefined) 책.넣기(si, x[0], x[1], 오늘일련())
        else if (오늘도 && 열쇠이름(key) === '요일' && x[5] === 1 && 책.입력값(si, x[0], x[1]) === undefined) 책.넣기(si, x[0], x[1], '일월화수목금토'[new Date(Date.now() + 9 * 3600e3).getUTCDay()])
      }
    })
    return n
  }
  const 열이름 = (c) => { let s = ''; while (c) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26) } return s }

  /* 쓰던 것 저절로 — 0.6초 뒤 */
  useEffect(() => {
    if (!판번) return undefined
    const t = setTimeout(() => { const 전체 = 읽기(쓴열쇠, {}); 전체[slug] = { cur: 책.내보내기(), saved: 저장들 }; 쓰기(쓴열쇠, 전체) }, 600)
    return () => clearTimeout(t)
  }, [판번, 저장들, slug, 책])

  /* 폭 재기 */
  useLayoutEffect(() => {
    const el = 감싸개.current
    if (!el) return undefined
    const 재기 = () => set폭(el.clientWidth)
    재기()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(재기) : null
    if (ro) ro.observe(el)
    window.addEventListener('resize', 재기)
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', 재기) }
  }, [])
  /* 사진 · 글꼴 */
  useEffect(() => {
    for (const s of doc.sheets) for (const im of s.img || []) {
      if (그림들.current.has(im[4])) continue
      const img = new Image()
      img.onload = () => set판번((n) => n + 1)
      img.src = `/forms/g/i/${im[4]}?v=${V}`
      그림들.current.set(im[4], img)
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => set판번((n) => n + 1))
  }, [doc])

  const 고른칸 = 고른 !== null ? 쓸칸[고른] : null
  /* 폰: 쓰는 칸은 아래 탭(두 줄) 바로 위 — 탭 높이를 재서 */
  const [아래, set아래] = useState(0)
  useEffect(() => {
    if (고른 === null) return undefined
    const 재기 = () => { const t = document.querySelector('.tabbar'); const r = t && getComputedStyle(t).display !== 'none' ? t.getBoundingClientRect() : null; set아래(r ? Math.max(0, window.innerHeight - r.top) : 0) }
    재기()
    window.addEventListener('resize', 재기)
    return () => window.removeEventListener('resize', 재기)
  }, [고른 !== null])   // eslint-disable-line react-hooks/exhaustive-deps
  const 쪽폭 = (판) => Math.max(200, Math.min(폭 || 800, 판.W > 700 ? 1100 : 820) * 확대)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { set보임(null); return undefined }
    const io = new IntersectionObserver((ents) => {
      set보임((old) => { const n = new Set(old || []); let 바뀜 = false; for (const e of ents) { const k = e.target.dataset.k; if (e.isIntersecting && !n.has(k)) { n.add(k); 바뀜 = true } else if (!e.isIntersecting && n.has(k)) { n.delete(k); 바뀜 = true } } return 바뀜 ? n : old })
    }, { rootMargin: '900px 0px' })
    for (const cv of 캔버스들.current.values()) io.observe(cv)
    return () => io.disconnect()
  }, [doc, 확대])
  /* 그리기 */
  useLayoutEffect(() => {
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    doc.sheets.forEach((sheet, si) => {
      const 판 = 판들[si]
      판.쪽.forEach((_, pi) => {
        const cv = 캔버스들.current.get(`${si}-${pi}`)
        if (!cv) return
        const cssW = 쪽폭(판)
        cv.style.width = cssW + 'px'
        cv.style.height = (cssW * 판.H / 판.W) + 'px'
        if (보임 && !보임.has(`${si}-${pi}`)) { if (cv.width > 1) { cv.width = 1; cv.height = 1 } return }
        const k = (cssW / 판.W) * dpr
        const W = Math.round(판.W * k), H = Math.round(판.H * k)
        if (cv.width !== W) cv.width = W
        if (cv.height !== H) cv.height = H
        const ctx = cv.getContext('2d')
        쪽그리기(ctx, { sheet, si, 판, 쪽번호: pi, k, 책, doc, 화면: true, 고른칸: 고른칸 && 고른칸.si === si ? 고른칸.x[0] + ',' + 고른칸.x[1] : null, 그림들: 그림들.current, 건설맵빼기: !건설맵, 사진칸: 사진들.current, 사진칸인가 })
      })
    })
  })

  /* 칸 고르기 */
  const 고르기 = useCallback((i) => {
    if (i === null || i < 0 || i >= 쓸칸.length) { 고른R.current = null; set고른(null); return }
    const { si, x } = 쓸칸[i]
    고른R.current = i
    고를때.current = true
    set고른(i)
    const iv = 책.입력값(si, x[0], x[1])
    const 수식값 = iv !== null && typeof iv === 'object' && typeof iv.f === 'string'
    const v = 수식값 ? null : iv !== undefined ? iv : x[5] === 3 ? null : 자리글({ v: x[6], nf: x[8] }) ? null : x[6]
    set글(값글(v, x))
    // 보이게
    const 판 = 판들[si]
    const pi = 칸쪽(판, x[0])
    const cv = 캔버스들.current.get(`${si}-${pi}`)
    if (cv) {
      const 상자 = 칸상자(판, pi, x)
      const rect = cv.getBoundingClientRect()
      const 비 = rect.width / 판.W
      const y = rect.top + 상자.y * 비, h = 상자.h * 비
      const 아래막 = 240
      if (y < 70 || y + h > window.innerHeight - 아래막) window.scrollBy({ top: y - Math.max(90, (window.innerHeight - 아래막) / 2), behavior: 'smooth' })
      // 크게 본 종이(옆으로 밀림)는 그 칸이 가운데 오게
      const 감 = 감싸개.current
      if (감 && 감.scrollWidth > 감.clientWidth + 2) {
        const wr = 감.getBoundingClientRect()
        const x = rect.left + 상자.x * 비 - wr.left + 감.scrollLeft
        const w = 상자.w * 비
        if (x < 감.scrollLeft + 8 || x + w > 감.scrollLeft + 감.clientWidth - 8) 감.scrollTo({ left: Math.max(0, x + w / 2 - 감.clientWidth / 2), behavior: 'smooth' })
      }
    }
  }, [쓸칸, 책, 판들])
  /* 칸을 옮기면 그 자리에서 바로(그려진 다음 · 칠 글자보다 먼저) 쓰는 칸에 커서 · 앞 글 고름 — 30ms 뒤에 고르면 그 사이 친 글자가 지워졌음 */
  useLayoutEffect(() => {
    if (!고를때.current) return
    고를때.current = false
    const el = 칸글자.current
    if (el) { el.focus({ preventScroll: true }); if (el.select && el.type !== 'date') el.select() }
  }, [고른])

  const 누름 = (si, pi, e) => {
    const cv = e.currentTarget
    const rect = cv.getBoundingClientRect()
    const 판 = 판들[si]
    const xp = (e.clientX - rect.left) / rect.width * 판.W
    const yp = (e.clientY - rect.top) / rect.height * 판.H
    const x = 칸찾기(doc.sheets[si], 판, pi, xp, yp)
    if (!x) { 고르기(null); return }
    if (x[5] === 1 || x[5] === 3) {
      const i = 쓸칸.findIndex((q) => q.si === si && q.x === x)
      if (i >= 0) 고르기(i)
    } else if (x[5] === 2) set말('🧮 자동 계산 칸입니다 — 다른 칸을 채우면 저절로 바뀝니다')
    else 고르기(null)
  }

  const 넣기 = (t) => {
    set글(t)
    const 지금 = 고른R.current !== null ? 쓸칸[고른R.current] : null
    if (!지금) return
    const { si, x } = 지금
    const v = 값읽기(t, x)
    책.넣기(si, x[0], x[1], v === null ? null : v)
    const key = (doc.sheets[si].keys || {})[`${열이름(x[1])}${x[0]}`]
    const c = 공통이름(key)
    if (c) { const 공통 = 읽기(공통열쇠, {}); if (v === null) delete 공통[c]; else 공통[c] = String(typeof v === 'number' && 날꼴인가(x[8]) ? 날짜글로(v) : t).slice(0, 80); 쓰기(공통열쇠, 공통) }
    set판번((n) => n + 1)
  }
  const 처음값 = () => {
    const 지금 = 고른R.current !== null ? 쓸칸[고른R.current] : null
    if (!지금) return
    const { si, x } = 지금
    책.넣기(si, x[0], x[1], undefined)
    set글(값글(x[5] === 3 ? null : 자리글({ v: x[6], nf: x[8] }) ? null : x[6], x))
    set판번((n) => n + 1)
  }

  /* ── 📷 사진 칸 ── */
  /** 파일들을 쓸칸 차례 i(사진 칸)부터 아래 사진 칸으로 차례로 */
  const 사진넣기 = async (파일들, 시작i) => {
    const 목록 = [...(파일들 || [])].filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(f.name))
    if (!목록.length) { set말('사진 파일(JPG · PNG)만 넣을 수 있습니다'); return }
    let k = 사진칸들.findIndex((q) => q.i === 시작i)
    if (k < 0) k = 사진칸들.findIndex((q) => !사진들.current.has(사진키(q.si, q.x)))
    if (k < 0) k = 0
    let n = 0, 날 = 0, 틀림 = ''
    set사진중(`사진 ${목록.length}장 읽는 중…`)
    for (const f of 목록) {
      const q = 사진칸들[k]
      if (!q) break
      try {
        const p = await 사진열기(f)
        const 그림 = await 그림으로(p.작업본)
        사진들.current.set(사진키(q.si, q.x), { 그림, 바이트: p.작업본, w: p.너비, h: p.높이, 때: p.때 })
        n++
        /* 같은 줄의 «촬영일» 날짜 칸이 비었으면 찍은 날로 */
        if (p.때) {
          const sh = doc.sheets[q.si]
          for (const y of sh.cells) {
            if (y[0] !== q.x[0] || y === q.x || y[5] !== 1 || !날꼴인가(y[8]) || y[1] > sh.pc) continue
            if (책.입력값(q.si, y[0], y[1]) !== undefined) continue
            const v = 값읽기(p.때.slice(0, 10), y)
            if (v !== null) { 책.넣기(q.si, y[0], y[1], v); 날++ }
          }
        }
      } catch (e) { 틀림 += (e && e.message ? e.message : f.name) + ' ' }
      k++
      set판번((x) => x + 1)
    }
    set사진중('')
    if (n) { 세기('|서식격자|사진'); set사진판((x) => x + 1) }
    set판번((x) => x + 1)
    const 남 = 목록.length - n
    set말((n ? `📷 사진 ${n}장을 넣었습니다` + (날 ? ` · 촬영일 ${날}칸은 찍은 날로` : '') : '') + (틀림 ? ` · 못 넣음: ${틀림.trim().slice(0, 120)}` : '') + (!틀림 && 남 > 0 ? ` · 빈 사진 칸이 모자라 ${남}장은 넣지 못했습니다` : ''))
  }
  const 사진빼기 = () => {
    const 지금 = 고른R.current !== null ? 쓸칸[고른R.current] : null
    if (!지금) return
    사진들.current.delete(사진키(지금.si, 지금.x))
    set사진판((x) => x + 1); set판번((x) => x + 1)
  }
  const 사진돌림 = async () => {
    const 지금 = 고른R.current !== null ? 쓸칸[고른R.current] : null
    if (!지금) return
    const key = 사진키(지금.si, 지금.x), p = 사진들.current.get(key)
    if (!p) return
    try {
      const r = await 사진돌리기({ 작업본: p.바이트, 너비: p.w, 높이: p.h }, 90)
      사진들.current.set(key, { ...p, 그림: await 그림으로(r.작업본), 바이트: r.작업본, w: r.너비, h: r.높이 })
      set사진판((x) => x + 1); set판번((x) => x + 1)
    } catch (e) { set말('사진을 돌리지 못했습니다') }
  }
  const 사진모두빼기 = () => { 사진들.current.clear(); 사진지우기(slug, 'cur'); set사진판((x) => x + 1) }
  /** 종이에 끌어다 놓기 — 놓은 칸(사진 칸)부터 · 아니면 빈 사진 칸부터 */
  const 놓기 = (e) => {
    if (!사진칸들.length) return
    const 파일들 = e.dataTransfer && e.dataTransfer.files
    if (!파일들 || !파일들.length) return
    e.preventDefault()
    let 시작 = -1
    const cv = e.target && e.target.closest ? e.target.closest('canvas.gx-page') : null
    if (cv && cv.dataset.k) {
      const [si, pi] = cv.dataset.k.split('-').map(Number)
      const rect = cv.getBoundingClientRect(), 판 = 판들[si]
      const x = 칸찾기(doc.sheets[si], 판, pi, (e.clientX - rect.left) / rect.width * 판.W, (e.clientY - rect.top) / rect.height * 판.H)
      if (x && 사진칸표.has(x)) 시작 = 쓸칸.findIndex((q) => q.si === si && q.x === x)
    }
    사진넣기(파일들, 시작)
  }

  /* ── 인쇄 · PDF ── */
  const 인쇄판 = useRef(null)
  const 쪽목록전부 = () => { const out = []; doc.sheets.forEach((s, si) => { if (!인쇄할[si]) return; 판들[si].쪽.forEach((_, pi) => out.push([si, pi])) }); return out }
  /** «1-3, 7» → 고른 쪽만(인쇄할 시트를 이어 센 번호) · 비우면 전부 · 못 읽으면 null */
  const 쪽목록 = () => {
    const 전부 = 쪽목록전부()
    const t = 쪽고름.replace(/\s+/g, '')
    if (!t) return 전부
    const 고름 = new Set()
    for (const 조각 of t.split(/[,，]/)) {
      const m = /^(\d+)(?:[-~](\d+))?$/.exec(조각)
      if (!m) return null
      const a = +m[1], b = m[2] ? +m[2] : a
      for (let i = Math.min(a, b); i <= Math.max(a, b) && i <= 전부.length; i++) if (i >= 1) 고름.add(i - 1)
    }
    return 전부.filter((_, i) => 고름.has(i))
  }
  const 많음 = 60
  const 쪽찍기 = (si, pi, k) => {
    const 판 = 판들[si]
    const cv = document.createElement('canvas')
    cv.width = Math.round(판.W * k); cv.height = Math.round(판.H * k)
    쪽그리기(cv.getContext('2d'), { sheet: doc.sheets[si], si, 판, 쪽번호: pi, k, 책, doc, 화면: false, 그림들: 그림들.current, 건설맵빼기: !건설맵, 사진칸: 사진들.current })
    return cv
  }
  const 인쇄채우기 = useCallback(() => {
    const box = 인쇄판.current
    if (!box) return
    box.innerHTML = ''
    let 목록 = 쪽목록() || 쪽목록전부()
    if (목록.length > 40 && !쪽고름.trim()) {        // Ctrl+P 로 큰 서식 전부 — 화면 가까운 쪽만(기억이 모자라 멈추지 않게)
      const 가까 = 목록.filter(([si, pi]) => !보임 || 보임.has(`${si}-${pi}`))
      목록 = 가까.length ? 가까.slice(0, 20) : 목록.slice(0, 20)
    }
    const k = 목록.length > 20 ? 1.6 : 목록.length > 8 ? 2 : 2.4
    for (const [si, pi] of 목록) {
      const 판 = 판들[si]
      const wrap = document.createElement('div')
      wrap.className = 'gx-p ' + (판.W > 700 ? 'land' : 'port')
      const cv = 쪽찍기(si, pi, k)
      /* 🩹 크롬은 캔버스에 쓴 글(fillText)을 인쇄 PDF 에 «글자» 로 남깁니다(시험에서 pdftotext 로 잡음) → 픽셀만 다른 캔버스로 옮겨 붙임 = 그림 */
      const 그림 = document.createElement('canvas')
      그림.width = cv.width; 그림.height = cv.height
      그림.getContext('2d').putImageData(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height), 0, 0)
      cv.width = cv.height = 1
      wrap.appendChild(그림)
      box.appendChild(wrap)
    }
  })    // eslint-disable-line react-hooks/exhaustive-deps
  const 인쇄비우기 = () => { if (인쇄판.current) 인쇄판.current.innerHTML = '' }
  useEffect(() => {
    document.body.classList.add('gx-쪽')
    const 앞 = () => 인쇄채우기()
    const 뒤 = () => setTimeout(인쇄비우기, 300)
    window.addEventListener('beforeprint', 앞)
    window.addEventListener('afterprint', 뒤)
    return () => { document.body.classList.remove('gx-쪽'); window.removeEventListener('beforeprint', 앞); window.removeEventListener('afterprint', 뒤) }
  }, [인쇄채우기])
  const 파일이름 = () => {
    const 공통 = 읽기(공통열쇠, {})
    const 현장 = String(공통.현장 || '').replace(/[\\/:*?"<>|]/g, '').slice(0, 30)
    return `${title}${현장 ? '_' + 현장 : ''}_${오늘글()}`
  }
  const 인쇄 = () => {
    const 목록 = 쪽목록()
    if (!목록) { set말('쪽 칸은 «1-3, 7» 처럼 적어 주세요'); return }
    if (목록.length > 많음) { set말(`쪽이 많습니다(${목록.length}쪽) — 위 «쪽» 칸에 인쇄할 쪽을 적어 주세요(예: 1-10)`); return }
    세기('|서식격자|인쇄')
    인쇄채우기()
    const 옛 = document.title
    document.title = 파일이름()
    setTimeout(() => { try { window.print() } catch (e) { /* */ } document.title = 옛 }, 120)
  }
  const [PDF중, setPDF중] = useState(false)
  const PDF = async () => {
    if (PDF중) return
    setPDF중(true)
    세기('|서식격자|PDF'); 받음(`/forms/w/${slug}.pdf`)
    try {
      const 목록 = 쪽목록()
      if (!목록) { set말('쪽 칸은 «1-3, 7» 처럼 적어 주세요'); setPDF중(false); return }
      if (!목록.length) { set말('PDF 로 만들 쪽이 없습니다 — 시트 ☑ 나 쪽 칸을 보세요'); setPDF중(false); return }
      if (목록.length > 많음) { set말(`쪽이 많습니다(${목록.length}쪽) — 위 «쪽» 칸에 PDF 로 만들 쪽을 적어 주세요(예: 1-10)`); setPDF중(false); return }
      const k = 목록.length > 10 ? 2 : 2.4
      const 쪽들 = []
      for (const [si, pi] of 목록) {
        await new Promise((r) => setTimeout(r, 0))
        const cv = 쪽찍기(si, pi, k)
        쪽들.push({ jpg: 캔버스JPEG(cv, 0.88), px: [cv.width, cv.height], pt: [판들[si].W, 판들[si].H] })
        cv.width = cv.height = 1
      }
      파일주기(PDF만들기(쪽들, title), 파일이름() + '.pdf')
      set말(`📄 PDF ${쪽들.length}쪽을 만들었습니다 — 내려받은 파일을 여세요`)
    } catch (e) {
      set말('PDF 를 만들지 못했습니다 — «🖨 인쇄» 에서 PDF로 저장을 고르세요')
    }
    setPDF중(false)
  }

  /* ── 저장 · 예시 · 비우기 ── */
  const 저장 = () => {
    const 공통 = 읽기(공통열쇠, {})
    const 이름 = String(공통.현장 || title).slice(0, 30) + ' · ' + new Date(Date.now() + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ')
    const id = Date.now().toString(36)
    const 새 = [{ id, nm: 이름, at: Date.now(), v: 책.내보내기(), p: 사진들.current.size || 0 }, ...저장들].slice(0, 30)
    if (사진들.current.size) 사진남기기(slug, id, 사진들.current)
    set저장들(새); 세기('|서식격자|저장')
    set말(`💾 «${이름}» 으로 저장했습니다 — 이 기기에만 남습니다`)
  }
  const 불러오기 = (x) => {
    책.들여오기(x.v); set목록(false); 고르기(null); set판번((n) => n + 1); set말(`📂 «${x.nm}» 을 불러왔습니다`)
    if (사진칸들.length) { 사진들.current.clear(); set사진판((n) => n + 1); 사진꺼내기(slug, x.id).then(async (들) => { for (const p of 들) { try { 사진들.current.set(p.칸, { 그림: await 그림으로(p.바이트), 바이트: p.바이트, w: p.w, h: p.h, 때: p.때 }) } catch (e) { /* */ } } set사진판((n) => n + 1); set판번((n) => n + 1) }) }
  }
  /* «전일» 칸 — 엑셀에선 INDIRECT("'"&전날시트&"'!H"&ROW()) 로 어제 시트의 같은 줄을 끌어옴(작업일보) → 사이트에선 «복사해 새로» 때 어제 값으로 */
  const 전일칸 = useMemo(() => {
    const out = []
    doc.sheets.forEach((s, si) => { for (const c of s.cells) { const m = c[5] === 3 && c[7] && /INDIRECT\("'"&\$?[A-Z]+\$?\d+&"'!\$?([A-Z]+)\$?"&ROW\(\)\)/.exec(c[7]); if (m) out.push({ si, r: c[0], c: c[1], 열: m[1] }) } })
    return out
  }, [doc])
  const 복사새로 = (x) => {
    책.들여오기(x.v)
    let 전 = 0
    if (전일칸.length) {
      const 어제 = 전일칸.map((q) => { let col = 0; for (const ch of q.열) col = col * 26 + ch.charCodeAt(0) - 64; return 책.값(q.si, q.r, col) })
      /* 어제 «금일» 은 비움 — 누계 칸 수식이 같은 줄에서 전일 말고 더하는 입력칸(작업일보 G 열)을 찾아서(그대로 두면 두 번 셈) */
      const 금일 = []
      for (const q of 전일칸) {
        let col = 0; for (const ch of q.열) col = col * 26 + ch.charCodeAt(0) - 64
        const 누 = 책.칸(q.si, q.r, col)
        if (!누 || !누.f) continue
        for (const m of 누.f.matchAll(/\$?([A-Z]{1,3})\$?(\d+)/g)) {
          if (+m[2] !== q.r) continue
          let c2 = 0; for (const ch of m[1]) c2 = c2 * 26 + ch.charCodeAt(0) - 64
          const x = 책.칸(q.si, q.r, c2)
          if (c2 !== q.c && x && x.k === 1) 금일.push([q.si, q.r, c2])
        }
      }
      전일칸.forEach((q, i) => { const v = 어제[i]; 책.넣기(q.si, q.r, q.c, typeof v === 'number' && v !== 0 ? v : null); if (typeof v === 'number' && v) 전++ })
      for (const [si, r, c] of 금일) 책.넣기(si, r, c, null)
    }
    doc.sheets.forEach((s, si) => { for (const c of s.cells) { const key = (s.keys || {})[`${열이름(c[1])}${c[0]}`]; if (오늘칸.test(열쇠이름(key)) && 날꼴인가(c[8])) 책.넣기(si, c[0], c[1], 오늘일련()); else if (열쇠이름(key) === '요일' && c[5] === 1) 책.넣기(si, c[0], c[1], '일월화수목금토'[new Date(Date.now() + 9 * 3600e3).getUTCDay()]) } })
    사진모두빼기()
    set목록(false); set판번((n) => n + 1)
    set말(전 ? `📄 날짜는 오늘로 · 전일 ${전}칸은 «${x.nm}» 의 누계로 채우고 금일은 비웠습니다 — 오늘 한 일(금일)만 적으세요` : '📄 날짜만 오늘로 바꿔 새로 씁니다 — 고칠 곳만 고치세요')
  }
  const 지우기 = (x) => { set저장들(저장들.filter((y) => y.id !== x.id)); if (x.p) 사진지우기(slug, x.id) }
  const 예시 = async () => {
    책.들여오기(doc.ex || {})
    세기('|서식격자|예시'); 고르기(null); set판번((n) => n + 1)
    set말('✍ 가상의 현장으로 채운 작성 예시입니다 — 고쳐 쓰시거나 «🧹 빈칸으로» 를 누르세요')
    if (사진칸들.length) {
      try {
        const { 예시사진파일들, 예시그림파일, 그림종류 } = await import('../lib/사진예시.js')
        /* 📐 G529 칸 머리글이 위치도 · 방음 배치 도면이면 그에 맞는 예시 그림 — 현장 사진(관 부설 등)을 도면 칸에 넣지 않게.
           나머지 칸은 전처럼 공사 전 전경 · 관 부설 · 콘크리트 타설 = 착공 전 · 시공 중 · 준공 꼴(가상 그림). 사진넣기 는 칸 차례로 넣으므로 칸마다 한 장씩 차례로 고름 */
        const 종류들 = 사진칸들.map((q) => 그림종류(사진칸표.get(q.x)))
        const 들 = 종류들.some((t) => !t) ? await 예시사진파일들() : []
        const 현장 = [들[0], 들[3], 들[6]].filter(Boolean)
        const 고름 = []
        for (const t of 종류들) {
          const f = t ? await 예시그림파일(t) : 현장.shift()
          if (!f) break
          고름.push(f)
        }
        사진들.current.clear()
        if (고름.length) await 사진넣기(고름, 사진칸들[0].i)
      } catch (e) { /* 예시 사진은 못 그려도 글 예시는 그대로 */ }
    }
  }
  const 비우기 = () => { 책.모두지우기(); 공통채우기(true); 고르기(null); 사진모두빼기(); set판번((n) => n + 1); set말('🧹 빈 서식으로 돌렸습니다(공사명 · 회사 등은 남김)') }
  const 예시있음 = doc.ex && Object.keys(doc.ex).length > 0

  /* 쓰는 칸 */
  const 칸 = 고른칸 ? 고른칸.x : null
  const 칸시트 = 고른칸 ? doc.sheets[고른칸.si] : null
  const 칸말 = 칸 ? 칸이름(칸시트, 판들[고른칸.si], 칸) : ''
  const 날짜칸 = 칸 && 날꼴인가(칸[8])
  const 수칸 = 칸 && !날짜칸 && (수꼴인가(칸[8]) || typeof 칸[6] === 'number')
  const 고름말 = 칸 && Array.isArray(칸[9]) ? 칸[9] : null
  const 긴칸 = 칸 && !날짜칸 && !수칸 && !고름말 && ((doc.st[칸[4]] || {}).w || 칸[2] > 1)
  const 사진칸 = !!(칸 && 사진칸표.has(칸))
  const 든사진 = 사진칸 ? 사진들.current.get(사진키(고른칸.si, 칸)) : null
  const 미리 = 칸 ? (() => { const v = 책.값(고른칸.si, 칸[0], 칸[1]); return v === null || v === undefined || v === '' ? '' : 꼴(v, 칸[8]).t })() : ''
  const 키 = (e) => {
    const i = 고른R.current
    if (e.key === 'Escape') { 고르기(null); return }
    if (e.key === 'Tab') { e.preventDefault(); 고르기(i + (e.shiftKey ? -1 : 1)); return }
    if (e.key === 'Enter' && !(긴칸 && (e.altKey || e.shiftKey))) { e.preventDefault(); 고르기(i + 1 < 쓸칸.length ? i + 1 : null) }
  }
  const 계산칸수 = useMemo(() => doc.sheets.reduce((a, s) => a + s.cells.filter((x) => x[5] === 2 && x[1] <= s.pc).length, 0), [doc])
  const 쪽수 = 판들.reduce((a, p) => a + p.쪽.length, 0)

  return (
    <div className="card gx" id="작성">
      <div className="fw-top">
        <div className="sec-title" style={{ margin: 0 }}>✍️ 종이에 바로 쓰기 — 자동 계산 · PDF</div>
        <div className="fw-sub muted sm">
          종이의 <b>칸을 누르고</b> 쓰세요{계산칸수 ? <> · 합계 · 금액 등 <b>{계산칸수}칸은 저절로 계산</b>됩니다</> : null}. 다 쓰면 <b>📄 PDF 저장</b> 또는 <b>🖨 인쇄</b>.
          쓴 것은 이 기기에만 남습니다(서버로 안 갑니다).
        </div>
      </div>
      <div className="fw-bar">
        <button type="button" className="btn primary" onClick={PDF} disabled={PDF중}>{PDF중 ? 'PDF 만드는 중…' : '📄 PDF 저장'}</button>
        <button type="button" className="btn ghost" onClick={인쇄}>🖨 인쇄</button>
        <button type="button" className="btn ghost" onClick={저장}>💾 저장</button>
        <button type="button" className={'btn ghost' + (목록 ? ' on' : '')} onClick={() => set목록(!목록)} aria-expanded={목록}>📂 저장한 것 {저장들.length}</button>
        {예시있음 && <button type="button" className="btn ghost" onClick={예시}>✍ 예시 채우기</button>}
        <button type="button" className="btn ghost" onClick={비우기}>🧹 빈칸으로</button>
        <label className="gx-brand" title="종이 맨 위 «K-건설맵 | k-conmap.com 건설 서식» 줄 — 끄면 화면 · 인쇄 · PDF 에서 빠집니다">
          <input type="checkbox" checked={건설맵} onChange={(e) => 건설맵바꿈(e.target.checked)} /> 맨 위 건설맵 주소 넣기
        </label>
        {쪽수 > 10 && (
          <label className="gx-range">쪽 <input className="inp" value={쪽고름} onChange={(e) => set쪽고름(e.target.value.replace(/[^\d,\-~ ，]/g, ''))} placeholder={`전부 ${쪽수}쪽 · 예: 1-3, 7`} aria-label="PDF · 인쇄할 쪽" inputMode="numeric" /></label>
        )}
        <span className="gx-zoom">
          <button type="button" className="btn ghost" aria-label="작게" onClick={() => set확대((z) => Math.max(1, Math.round((z - 0.25) * 4) / 4))} disabled={확대 <= 1}>－</button>
          <button type="button" className="btn ghost" aria-label="크게" onClick={() => set확대((z) => Math.min(2.5, Math.round((z + 0.25) * 4) / 4))}>＋</button>
        </span>
      </div>
      <details className="gx-how" open={안내열림} onToggle={(e) => { if (e.currentTarget.open !== 안내열림) 안내토글(e.currentTarget.open) }}>
        <summary><b>{안내.제목}</b> <span className="muted">— {안내.한줄}</span></summary>
        <ol>
          {안내.차례.map(([머리, 글]) => <li key={머리}><b>{머리}</b> — {글}</li>)}
        </ol>
      </details>
      {말 && <div className="fw-say" role="status">{말}</div>}
      {목록 && (
        <div className="fw-list">
          {!저장들.length && <div className="muted sm">저장한 것이 없습니다 — 다 쓰고 «💾 저장» 을 누르면 여러 벌을 남겨 둘 수 있습니다.</div>}
          {저장들.map((x) => (
            <div key={x.id} className="fw-li">
              <span className="nm">{x.nm}</span>
              <button type="button" className="tp-x" onClick={() => 불러오기(x)}>불러오기</button>
              <button type="button" className="tp-x" onClick={() => 복사새로(x)}>복사해 새로</button>
              <button type="button" className="tp-x" onClick={() => 지우기(x)}>지움</button>
            </div>
          ))}
        </div>
      )}
      {doc.sheets.length > 1 && (
        <div className="gx-sheets" role="group" aria-label="시트">
          {doc.sheets.map((s, si) => (
            <label key={si} className={'gx-sh' + (인쇄할[si] ? ' on' : '')}>
              <input type="checkbox" checked={인쇄할[si]} onChange={(e) => set인쇄할((a) => a.map((v, j) => (j === si ? e.target.checked : v)))} />
              <a href={`#gx-s${si}`} onClick={(e) => { e.preventDefault(); const el = document.getElementById(`gx-s${si}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{s.name}</a>
            </label>
          ))}
          <span className="muted sm">☑ = PDF · 인쇄에 넣음</span>
        </div>
      )}
      <div className={'gx-wrap' + (확대 > 1 ? ' zoomed' : '')} ref={감싸개} onDragOver={(e) => { if (사진칸들.length && e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files')) e.preventDefault() }} onDrop={놓기}>
        {doc.sheets.map((s, si) => (
          <div key={si} id={`gx-s${si}`} className={'gx-sheet' + (인쇄할[si] ? '' : ' off')}>
            {doc.sheets.length > 1 && <div className="gx-sname">{si + 1}. {s.name} <span className="muted">· {판들[si].쪽.length}쪽</span></div>}
            {판들[si].쪽.map((_, pi) => (
              <canvas key={pi} className="gx-page" role="img" aria-label={`${s.name} ${pi + 1}쪽 — 칸을 눌러 쓰세요`}
                data-k={`${si}-${pi}`}
                ref={(el) => { if (el) 캔버스들.current.set(`${si}-${pi}`, el); else 캔버스들.current.delete(`${si}-${pi}`) }}
                onClick={(e) => 누름(si, pi, e)} onContextMenu={(e) => e.preventDefault()} />
            ))}
          </div>
        ))}
      </div>
      <div className="muted sm" style={{ marginTop: 8 }}>
        A4 {쪽수}쪽 · 옅은 파란 칸 = 쓰는 칸 · 하늘색 칸 = 자동 계산 · PDF 는 종이 그림으로 만듭니다(엑셀 변환 프로그램으로 바뀌지 않음).
        {빈틀 && <> 손으로 쓸 <a href={빈틀} download onClick={() => 세기('|서식격자|빈틀')}>빈 틀 엑셀</a>(계산 없음)도 있습니다.</>}
      </div>
      {칸 && (
        <div className="gx-ed" role="dialog" aria-label="칸 쓰기" style={아래 ? { bottom: 아래 } : undefined}>
          <div className="gx-ed-h">
            <b className="gx-ed-n">{칸말}</b>
            {미리 && 수칸 && <span className="gx-ed-p">→ {미리}</span>}
            <span className="gx-ed-i muted">{고른 + 1} / {쓸칸.length}</span>
            <button type="button" className="gx-ed-x" aria-label="닫기" onClick={() => 고르기(null)}>✕</button>
          </div>
          {고름말 && (
            <div className="gx-ed-ch">
              {고름말.map((w) => <button key={w} type="button" className={'gx-chip' + (글 === w ? ' on' : '')} onClick={() => { 넣기(w); 고르기(고른 + 1 < 쓸칸.length ? 고른 + 1 : null) }}>{w}</button>)}
            </div>
          )}
          {사진칸 ? (
            <div className="gx-ed-ph">
              {든사진 ? <img className="gx-ed-th" src={URL.createObjectURL(new Blob([든사진.바이트], { type: 'image/jpeg' }))} alt="넣은 사진" onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} /> : <div className="gx-ed-th gx-ed-th0">사진 없음</div>}
              <div className="gx-ed-phb">
                <button type="button" className="btn primary" onClick={() => 사진파일칸.current && 사진파일칸.current.click()} disabled={!!사진중}>{사진중 || '📷 사진 고르기'}</button>
                {폰기기() && <button type="button" className="btn ghost" onClick={() => 찍기칸.current && 찍기칸.current.click()} disabled={!!사진중} title="카메라가 바로 열립니다">📸 찍기</button>}
                {든사진 && <button type="button" className="btn ghost" onClick={사진돌림} disabled={!!사진중}>⟳ 돌리기</button>}
                {든사진 && <button type="button" className="btn ghost" onClick={사진빼기} disabled={!!사진중}>✕ 빼기</button>}
                <input ref={사진파일칸} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} onChange={(e) => { const f = [...(e.target.files || [])]; e.target.value = ''; 사진넣기(f, 고른R.current) }} />
                <input ref={찍기칸} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => { const f = [...(e.target.files || [])]; e.target.value = ''; 사진넣기(f, 고른R.current) }} />
              </div>
              <div className="muted sm gx-ed-phs">여러 장을 고르면 이 칸부터 아래 사진 칸으로 차례로 들어갑니다 · 종이에 끌어다 놓아도 됩니다 · 찍은 날(EXIF)이 있으면 촬영일도 채웁니다 · 사진은 서버로 가지 않습니다{든사진 && 든사진.때 ? <> · 찍은 때 {든사진.때}</> : null}</div>
            </div>
          ) : (
          <div className="gx-ed-r">
            {날짜칸 ? (
              <>
                <input ref={칸글자} className="fw-in" type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(글) ? 글 : ''} onChange={(e) => 넣기(e.target.value)} onKeyDown={키} aria-label={칸말} />
                <button type="button" className="btn ghost" onClick={() => 넣기(오늘글())}>오늘</button>
              </>
            ) : 긴칸 ? (
              <textarea ref={칸글자} className="fw-in" rows={2} value={글} onChange={(e) => 넣기(e.target.value)} onKeyDown={키} aria-label={칸말} placeholder={폭 >= 900 ? '여기에 쓰세요 (줄바꿈: Alt+Enter)' : '여기에 쓰세요'} />
            ) : (
              <input ref={칸글자} className="fw-in" inputMode={수칸 ? 'decimal' : 'text'} value={글} onChange={(e) => 넣기(e.target.value)} onKeyDown={키} aria-label={칸말} placeholder={수칸 ? (퍼센트꼴(칸[8]) ? '예: 3.5 (%)' : '숫자만') : '여기에 쓰세요'} />
            )}
          </div>
          )}
          <div className="gx-ed-b">
            <button type="button" className="btn ghost" onClick={() => 고르기(고른 - 1)} disabled={고른 <= 0}>◀ 앞 칸</button>
            {!사진칸 && <button type="button" className="btn ghost" onClick={() => 넣기('')}>지움</button>}
            {(칸[5] === 3 || (칸[6] !== null && 칸[6] !== undefined && !자리글({ v: 칸[6], nf: 칸[8] }))) && <button type="button" className="btn ghost" onClick={처음값}>처음 값</button>}
            <button type="button" className="btn primary" onClick={() => 고르기(고른 + 1 < 쓸칸.length ? 고른 + 1 : null)}>다음 칸 ▶</button>
          </div>
        </div>
      )}
      {createPortal(<div id="gx-인쇄" ref={인쇄판} aria-hidden="true" />, document.body)}
    </div>
  )
}
