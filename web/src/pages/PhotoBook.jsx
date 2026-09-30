/**
 * /tools/photo — 📷 사진대지 · 🧾 영수증 정리 (2026-09-30)
 *
 * 소장님: imgsheet(사진대지 · 영수증 — AI 정리 · PDF 만 무료, 엑셀 · 한글 · 워드는 유료 · 로그인) 캡처 3장
 *         → 「아이디어 더 해서 만들어줘. 프로그램으로」
 *
 * ■ 우리 것은 — 가입 없음 · 전부 무료(PDF · 엑셀 · 한글 · 워드) · 사진이 서버로 안 감(브라우저 안) · AI 대신 규칙(값 0원)
 *   사진대지: 찍은 차례 자동 · 날짜 바뀌면 새 쪽 · 흐림/거의 같은/어두운 사진 표시 · 파일 이름 → 내용 · 현장 문구 모음 ·
 *             아래로 같게 · 전·후 비교 · 결재란 · 1~8장 · 세로/가로 · 칸 채우기 · 용량 고르기 · 이어하기(이 브라우저)
 *   영수증:   스캔(사진 · PDF) 한 장에 여러 장이면 저절로 나눔(틀리면 끌어서 고침) · 사용처로 과목 추천 ·
 *             지출결의서(과목별 · 한글 금액) · 지출명세서 · 증빙자료(번호 맞춤) · 엑셀은 수식이 살아 있음
 * ■ 셈 · 쓰기: lib/사진정리.js · 영수증.js · 영수증읽기.js · 쪽문서.js(쪽 모형) · 쪽pdf · 쪽엑셀 · 쪽한글 · 쪽워드 · 작업보관.js
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askAfter } from '../AskComment'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import {
  기본설정 as 사진기본, 항목꼴들, 한쪽에들, 문구모음, 용량들, 사진대지쪽들, 사진열기, 사진돌리기, 그림준비,
  정렬하기, 표시하기, 칸값,
} from '../lib/사진정리.js'
import { 기본설정 as 영수증기본, 과목들, 과목추천, 금액읽기, 쉼표, 날짜고르기, 모으기, 영수증쪽들, 한글금액, 영수증수식시트들 } from '../lib/영수증.js'
import { 글맞춤 } from '../lib/쪽문서.js'
import * as 보관 from '../lib/작업보관.js'

const 사진꼴 = /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i
const 영수증꼴 = /\.(jpe?g|png|webp|gif|bmp|heic|heif|pdf)$/i
const 숨 = () => new Promise((r) => setTimeout(r, 0))
const 오늘 = () => { const d = new Date(Date.now() + 9 * 3600e3); return d.toISOString().slice(0, 10).replace(/-/g, '.') }
const 파일이름 = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40)

/* 화면을 옮겨 다녀와도 그대로(이 탭) — 창을 닫았다 열면 작업보관(IndexedDB)에서 */
const 기억 = { 탭: '사진', 사진: null, 영수증: null }

/* ── 작업본 → 화면 주소(한 번만 만듦) ── */
const 주소표 = new WeakMap()
function 그림주소(바이트) {
  if (!바이트) return ''
  let u = 주소표.get(바이트)
  if (!u) { u = URL.createObjectURL(new Blob([바이트], { type: 'image/jpeg' })); 주소표.set(바이트, u) }
  return u
}

function 저장하기(이름, 바이트, 타입) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(new Blob([바이트], { type: 타입 }))
  a.href = url; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
const 형식표 = {
  pdf: ['PDF', 'application/pdf', '.pdf'],
  xlsx: ['엑셀', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
  hwpx: ['한글', 'application/hwp+zip', '.hwpx'],
  docx: ['워드', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
}

/** 쪽 모형들 + 그림들 → 파일 바이트 */
async function 파일만들기(형식, 쪽들, 그림들, 제목, 더시트 = []) {
  if (형식 === 'pdf') { const m = await import('../lib/쪽pdf.js'); return m.쪽들PDF(쪽들, 그림들, { 제목 }) }
  if (형식 === 'xlsx') { const m = await import('../lib/쪽엑셀.js'); return m.엑셀책([...더시트, m.쪽들시트(쪽들, 그림들, 더시트.length ? '인쇄용' : 제목)], 그림들) }
  if (형식 === 'hwpx') { const m = await import('../lib/쪽한글.js'); return m.쪽들한글(쪽들, 그림들, { 제목 }) }
  const m = await import('../lib/쪽워드.js'); return m.쪽들워드(쪽들, 그림들, { 제목 })
}

/* ══════════════════════ 쪽 미리보기 ══════════════════════ */
function 쪽보기({ 쪽, 폭px, 그림찾기, 번호, 전체 }) {
  const 배 = 폭px / 쪽.폭
  const 맞춤들 = useMemo(() => 쪽.칸들.map((k) => (k.글 ? 글맞춤(k.글, k.w, k.h, k.크기 || 9, !!k.굵게) : null)), [쪽])
  return (
    <div className="pb-page" style={{ width: 폭px, height: 쪽.높이 * 배 }} aria-label={`${번호} / ${전체} 쪽`}>
      {쪽.칸들.map((k, i) => {
        const m = 맞춤들[i]
        const 주소 = k.사진 ? 그림찾기(k.사진) : ''
        return (
          <div key={i} className={'pb-r' + (k.테 ? ' t' : '')}
            style={{ left: k.x * 배, top: k.y * 배, width: k.w * 배, height: k.h * 배, background: k.바탕 || undefined,
              justifyContent: k.정렬 === '왼' ? 'flex-start' : k.정렬 === '오' ? 'flex-end' : 'center' }}>
            {주소 && (
              <div className="pb-rimg" style={{ inset: (k.그림여백 ?? 1.2) * 배 }}>
                <img src={주소} alt="" draggable="false" style={{ objectFit: k.맞춤 === '채움' ? 'cover' : 'contain' }} />
              </div>
            )}
            {m && m.줄들.length > 0 && (
              <span style={{ fontSize: m.크기 * 0.3528 * 배, fontWeight: k.굵게 ? 700 : 400, color: k.색 || '#111',
                textAlign: k.정렬 === '왼' ? 'left' : k.정렬 === '오' ? 'right' : 'center', padding: `0 ${0.8 * 배}px` }}>
                {m.줄들.map((줄, j) => <span key={j} className="pb-l">{줄 || ' '}</span>)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function 미리보기판({ 쪽들, 그림찾기, 제목 = '미리보기' }) {
  const 틀 = useRef(null)
  const [폭, set폭] = useState(420)
  const [배율, set배율] = useState(1)
  const [쪽, set쪽] = useState(0)
  useEffect(() => {
    const el = 틀.current
    if (!el) return undefined
    const 재기 = () => set폭(Math.max(240, el.clientWidth - 24))
    재기()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(재기) : null
    if (ro) ro.observe(el); else window.addEventListener('resize', 재기)
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', 재기) }
  }, [])
  useEffect(() => { if (쪽 >= 쪽들.length) set쪽(Math.max(0, 쪽들.length - 1)) }, [쪽들.length, 쪽])
  const 가로 = 쪽들[0] && 쪽들[0].폭 > 쪽들[0].높이
  const 쪽폭 = Math.round(Math.min(폭, 가로 ? 폭 : Math.min(폭, 620)) * 배율)
  return (
    <div className="pb-view" ref={틀}>
      <div className="pb-vbar">
        <b>{제목}</b>
        <span className="grow" />
        <button type="button" className="pb-ib" disabled={쪽 <= 0} onClick={() => set쪽(쪽 - 1)} aria-label="앞 쪽">‹</button>
        <span className="pb-pn">{쪽들.length ? 쪽 + 1 : 0} / {쪽들.length}</span>
        <button type="button" className="pb-ib" disabled={쪽 >= 쪽들.length - 1} onClick={() => set쪽(쪽 + 1)} aria-label="다음 쪽">›</button>
        <button type="button" className="pb-ib" onClick={() => set배율((b) => Math.max(0.6, +(b - 0.2).toFixed(1)))} aria-label="작게">−</button>
        <span className="pb-pn">{Math.round(배율 * 100)}%</span>
        <button type="button" className="pb-ib" onClick={() => set배율((b) => Math.min(2.4, +(b + 0.2).toFixed(1)))} aria-label="크게">+</button>
      </div>
      <div className="pb-vbody">
        {쪽들.length ? <쪽보기 쪽={쪽들[Math.min(쪽, 쪽들.length - 1)]} 폭px={쪽폭} 그림찾기={그림찾기} 번호={쪽 + 1} 전체={쪽들.length} />
          : <div className="pb-empty">사진을 올리면 여기에 A4 로 보입니다</div>}
      </div>
      {쪽들.length > 1 && (
        <div className="pb-strip">
          {쪽들.map((p, i) => (
            <button type="button" key={i} className={'pb-sn' + (i === 쪽 ? ' on' : '')} onClick={() => set쪽(i)}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════ 내보내기 단추 ══════════════════════ */
function 내보내기줄({ 바쁨, 할, 용량, set용량, 수 }) {
  return (
    <div className="pb-out">
      <div className="pb-outs">
        {Object.entries(형식표).map(([k, [이름, , 확장]]) => (
          <button key={k} type="button" className={'pb-fmt f-' + k} disabled={!!바쁨 || !수} onClick={() => 할(k)}>
            <span className="pb-fi">{확장.slice(1).toUpperCase()}</span><b>{이름}</b><span className="pb-free">무료</span>
          </button>
        ))}
      </div>
      <div className="pb-outr">
        <label>사진 용량 <select value={용량} onChange={(e) => set용량(e.target.value)}>
          {용량들.map((v) => <option key={v} value={v}>{v}{v === '가볍게' ? ' (메일 · 나라장터)' : v === '선명하게' ? ' (크게 인쇄)' : ''}</option>)}
        </select></label>
        <button type="button" className="btn ghost sm" disabled={!!바쁨 || !수} onClick={() => 할('print')}>🖨 인쇄</button>
      </div>
      {바쁨 && <div className="pb-busy"><span className="pb-spin" />{바쁨}</div>}
    </div>
  )
}

/* ══════════════════════ 📖 사용 방법 (소장님 「사용방법과 예시도 넣어줘.」) ══════════════════════ */
const 사용글 = {
  사진: {
    차례: [
      ['사진 올리기', '현장 사진을 끌어다 놓거나 눌러서 여러 장을 한 번에 고릅니다. 폴더째 골라도 됩니다. 폰에서는 앨범에서 여러 장을 고르십시오.'],
      ['저절로 정리', '찍은 시각 차례로 늘어섭니다. 흐린 사진 · 거의 같은 사진(연속 촬영) · 어두운 사진에는 표시가 붙습니다 → «표시된 것 빼기».'],
      ['꾸미기', '공사명 · 위치 · 결재란 · 한 쪽에 몇 장 · 칸 구성을 고르면 오른쪽 미리보기가 바로 바뀝니다.'],
      ['내용 적기', '일자는 찍은 날이 저절로 들어갑니다. 내용은 적거나 «문구▾» 에서 고르고, «↓» 를 누르면 아래 사진 모두 같은 글이 됩니다. ↑↓ 차례 · ⟳ 돌리기 · «새 쪽».'],
      ['내려받기', 'PDF · 엑셀 · 한글 · 워드 중 고르십시오. 메일 · 나라장터에 올릴 것은 «사진 용량 › 가볍게».'],
    ],
    팁: [
      '시공 전 · 후 나란히: 두 장씩 짝(1·2번, 3·4번 …) — 차례를 ↑↓ 로 맞추십시오.',
      '파일 이름에 설명이 있으면(「터파기 전경.jpg」) 내용 칸에 저절로 들어갑니다.',
      '아이폰 사진(HEIC)이 안 열리면: 설정 › 카메라 › 포맷 › «호환성 우선».',
      '창을 닫아도 이 브라우저에 남아 이어서 합니다(다른 컴퓨터 · 폰에는 없습니다). 사진은 서버로 가지 않습니다.',
    ],
  },
  영수증: {
    차례: [
      ['영수증 올리기', '영수증 사진이나 스캔한 JPG · PDF 를 올립니다. 한 장에 영수증이 여러 개여도 저절로 나눕니다.'],
      ['나눈 것 확인', '스캔마다 «✂️ 칸 고치기» — 빈 곳을 끌면 새 칸, 칸을 끌면 옮김, 모서리로 크기, ✕ 는 지움.'],
      ['적기', '왼쪽 그림을 누르면 오른쪽에 크게 보면서 적습니다. 일자는 «26.9.3», 금액은 «5만5천» 처럼 적어도 됩니다. 사용처를 적으면 과목을 골라 드립니다.'],
      ['꾸미기', '제목 · 현장명 · 작성자 · 결재란 · 증빙 한 쪽에 몇 장 · 일자 차례.'],
      ['내려받기', '지출결의서(과목별 합계 · 한글 금액) + 지출명세서 + 증빙자료가 한 파일로. 엑셀은 합계 · 과목별 수식이 살아 있습니다.'],
    ],
    팁: [
      '스캔할 때 영수증 사이를 1cm 넘게 띄우면 잘 나뉩니다. 폰으로 찍을 때는 어두운 책상 위에 놓고 찍으면 잘 나뉩니다.',
      '구겨진 영수증은 펴서, 감열지는 빛이 바래기 전에 올려 두십시오.',
      '창을 닫아도 이 브라우저에 남아 이어서 합니다. 영수증은 서버로 가지 않습니다.',
    ],
  },
}
function 사용법({ 종류, 예시, 바쁨, 처음 }) {
  const [열림, set열림] = useState(처음)
  useEffect(() => { if (처음) set열림(true) }, [처음])
  const 글 = 사용글[종류]
  return (
    <div className="card pb-how">
      <div className="pb-howh">
        <button type="button" className="pb-howt" onClick={() => set열림((v) => !v)} aria-expanded={열림}>📖 사용 방법 {열림 ? '▴' : '▾'}</button>
        <span className="grow" />
        <button type="button" className="btn sm pb-ex" onClick={예시} disabled={!!바쁨}>▶ 예시로 해 보기</button>
      </div>
      {열림 && (
        <>
          <ol className="pb-steps">
            {글.차례.map(([t, d], i) => <li key={i}><b>{t}</b> — {d}</li>)}
          </ol>
          <ul className="pb-tips">{글.팁.map((t, i) => <li key={i}>{t}</li>)}</ul>
          <p className="pb-note" style={{ marginTop: 6 }}>«▶ 예시로 해 보기» 를 누르면 {종류 === '사진' ? '예시 사진 8장(흐린 사진 · 거의 같은 사진 하나씩 섞음)' : '영수증 셋이 든 예시 스캔 한 장'}으로 처음부터 끝까지 돌려 봅니다. 예시는 그 자리에서 그린 그림입니다.</p>
        </>
      )}
    </div>
  )
}

/* ══════════════════════ 📷 사진대지 ══════════════════════ */
function 사진대지판() {
  const [s, set] = useState(() => 기억.사진 || { 목록: [], 설정: { ...사진기본 }, 차례: '때', 불러옴: false })
  const [바쁨, set바쁨] = useState('')
  const [알림, set알림] = useState('')
  const [오류, set오류] = useState('')
  const [지난, set지난] = useState(null)       /* 지난번 작업(저장된 것) — 이어서? */
  const 입력 = useRef(null), 폴더 = useRef(null)
  const { 목록, 설정 } = s
  useEffect(() => { 기억.사진 = s }, [s])

  /* 창을 새로 열었을 때 — 저장된 작업이 있으면 묻기 */
  useEffect(() => {
    if (s.불러옴 || s.목록.length) return
    let 끝 = false
    보관.꺼내기('사진문서').then((d) => { if (!끝 && d && d.목록 && d.목록.length) set지난(d) })
    return () => { 끝 = true }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  /* 저절로 저장(글 · 설정 — 그림은 올릴 때 따로) */
  useEffect(() => {
    if (!s.불러옴 && !s.목록.length) return undefined
    const t = setTimeout(() => {
      보관.넣기('사진문서', { 설정: s.설정, 차례: s.차례, 목록: s.목록.map(({ 작업본, 작은그림, ...나머지 }) => 나머지), 때: Date.now() })
    }, 700)
    return () => clearTimeout(t)
  }, [s])

  const 이어하기 = async () => {
    const d = 지난
    set지난(null)
    set바쁨('지난번 작업을 여는 중…')
    const 그림 = await 보관.여럿꺼내기(d.목록.map((p) => 'g:' + p.id))
    const 목 = d.목록.map((p) => ({ ...p, ...(그림.get('g:' + p.id) || {}) })).filter((p) => p.작업본)
    set({ 목록: 목, 설정: { ...사진기본, ...d.설정 }, 차례: d.차례 || '때', 불러옴: true })
    set바쁨('')
    set알림(`지난번 작업(사진 ${목.length}장)을 이어서 합니다.`)
  }
  const 새로 = async (확인 = true) => {
    if (확인 && s.목록.length && !window.confirm(`사진 ${s.목록.length}장과 적은 내용을 모두 지울까요?`)) return
    const ids = (지난 ? 지난.목록 : s.목록).map((p) => 'g:' + p.id)
    await 보관.지우기(['사진문서', ...ids])
    set지난(null)
    set({ 목록: [], 설정: { ...사진기본, 공사명: s.설정.공사명, 위치: s.설정.위치, 결재: s.설정.결재 }, 차례: '때', 불러옴: true })
    set알림('')
  }

  const 설정바꾸기 = (고칠) => set((o) => ({ ...o, 불러옴: true, 설정: { ...o.설정, ...고칠 } }))
  const 사진바꾸기 = (id, 고칠) => set((o) => ({ ...o, 목록: o.목록.map((p) => (p.id === id ? { ...p, ...(typeof 고칠 === 'function' ? 고칠(p) : 고칠) } : p)) }))
  const 값바꾸기 = (id, 칸, v) => 사진바꾸기(id, (p) => ({ 값: { ...p.값, [칸]: v } }))

  const 올리기 = async (fs, 머리 = '') => {
    const 받을 = [...(fs || [])].filter((f) => 사진꼴.test(f.name) || /^image\//.test(f.type))
    if (!받을.length) { set오류('사진 파일(JPG · PNG · WEBP)을 골라 주십시오.'); return }
    set오류(''); set알림('')
    const 새 = []
    const 틀림 = []
    for (let i = 0; i < 받을.length; i++) {
      set바쁨(`사진을 읽는 중… ${i + 1} / ${받을.length}`)
      await 숨()
      try {
        const p = await 사진열기(받을[i])
        새.push(p)
        보관.넣기('g:' + p.id, { 작업본: p.작업본, 작은그림: p.작은그림 })
      } catch (e) { 틀림.push(e.message) }
    }
    set바쁨('')
    set((o) => {
      const 모두 = o.차례 === '그대로' ? [...o.목록, ...새] : 정렬하기([...o.목록, ...새], o.차례)
      return { ...o, 목록: 모두, 불러옴: true }
    })
    const 표 = 표시하기(정렬하기([...s.목록, ...새], s.차례 === '그대로' ? '때' : s.차례))
    const 셈 = (t) => [...표.values()].filter((v) => v.includes(t)).length
    const 흐 = 셈('흐림'), 닮 = 셈('닮음'), 어 = 셈('어둠')
    const 때없음 = 새.filter((p) => !p.때).length
    set알림(`${머리}사진 ${새.length}장을 ${s.차례 === '이름' ? '파일 이름' : s.차례 === '그대로' ? '올린' : '찍은 시각'} 차례로 넣었습니다.`
      + (흐 + 닮 + 어 ? ` 살펴볼 사진 — 흐림 ${흐} · 거의 같음 ${닮} · 어두움 ${어} (사진에 표시했습니다)` : '')
      + (때없음 ? ` · 찍은 날짜가 없는 사진 ${때없음}장은 파일 날짜로 넣었습니다.` : ''))
    if (틀림.length) set오류(틀림.slice(0, 3).join(' / ') + (틀림.length > 3 ? ` 외 ${틀림.length - 3}장` : ''))
  }

  const 예시하기 = async () => {
    if (목록.length && !window.confirm('예시 사진 8장을 지금 사진 뒤에 붙일까요? (나중에 «모두 지우기» 로 지울 수 있습니다)')) return
    set바쁨('예시 사진을 그리는 중…')
    const m = await import('../lib/사진예시.js')
    const 파일들 = await m.예시사진파일들()
    if (!설정.공사명) 설정바꾸기({ 공사명: '○○지구 배수로 정비공사 (예시)', 위치: '○○리 일원', 결재: 설정.결재 && 설정.결재.length ? 설정.결재 : ['담당', '소장'] })
    await 올리기(파일들, '▶ 예시 — ')
  }
  const 표시 = useMemo(() => 표시하기(목록), [목록])
  const 표시된것 = [...표시.keys()]
  const 빼기 = (ids) => {
    const 뺄 = new Set(ids)
    보관.지우기([...뺄].map((id) => 'g:' + id))
    set((o) => ({ ...o, 목록: o.목록.filter((p) => !뺄.has(p.id)) }))
  }
  const 옮기기 = (i, d) => set((o) => {
    const a = [...o.목록]; const j = i + d
    if (j < 0 || j >= a.length) return o
    ;[a[i], a[j]] = [a[j], a[i]]
    return { ...o, 목록: a, 차례: '그대로' }
  })
  const 돌리기 = async (p) => {
    set바쁨('사진을 돌리는 중…')
    try {
      const q = await 사진돌리기(p, 90)
      보관.넣기('g:' + q.id, { 작업본: q.작업본, 작은그림: q.작은그림 })
      사진바꾸기(p.id, { 작업본: q.작업본, 작은그림: q.작은그림, 너비: q.너비, 높이: q.높이 })
    } finally { set바쁨('') }
  }
  const 아래로같게 = (i, 칸) => {
    const v = 칸값(목록[i], 칸, 설정)
    set((o) => ({ ...o, 목록: o.목록.map((p, j) => (j > i ? { ...p, 값: { ...p.값, [칸]: v } } : p)) }))
    set알림(`${i + 2}번부터 끝까지 «${v || '(빈칸)'}» 로 채웠습니다.`)
  }
  const 차례바꾸기 = (v) => set((o) => ({ ...o, 차례: v, 목록: v === '그대로' ? o.목록 : 정렬하기(o.목록, v) }))

  const 결과 = useMemo(() => 사진대지쪽들(목록, 설정), [목록, 설정])
  const 그림찾기 = useMemo(() => { const m = new Map(목록.map((p) => [p.id, p])); return (id) => 그림주소(m.get(id) && m.get(id).작업본) }, [목록])

  const 내보내기 = async (형식) => {
    const 창 = 형식 === 'print' ? window.open('', '_blank') : null
    set오류('')
    try {
      const { 쪽들, 그림요청 } = 사진대지쪽들(목록, 설정)
      const 그림들 = new Map()
      const 찾 = new Map(목록.map((p) => [p.id, p]))
      let n = 0
      for (const [열쇠, r] of 그림요청) {
        n += 1
        set바쁨(`사진을 알맞게 줄이는 중… ${n} / ${그림요청.size}`)
        await 숨()
        그림들.set(열쇠, await 그림준비(찾.get(r.id), r.비율, 설정.용량))
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
      set알림(`✔ ${이름} — ${쪽들.length}쪽 · ${(바이트.length / 1048576).toFixed(1)}MB`)
      try { askAfter('photo') } catch (e) { /* 없음 */ }
    } catch (e) {
      if (창) 창.close()
      set오류(`만들지 못했습니다 — ${e && e.message ? e.message : e}`)
    } finally { set바쁨('') }
  }

  const 결재글 = (설정.결재 || []).join(', ')
  return (
    <div className="pb-grid">
      <div className="pb-left">
        {지난 && (
          <div className="card pb-again">
            <b>💾 지난번 작업이 있습니다</b> — 사진 {지난.목록.length}장{지난.설정 && 지난.설정.공사명 ? ` · ${지난.설정.공사명}` : ''}
            <div className="btn-row"><button type="button" className="btn sm" onClick={이어하기}>이어서 하기</button>
              <button type="button" className="btn ghost sm" onClick={() => 새로(false)}>지우고 새로</button></div>
          </div>
        )}
        <사용법 종류="사진" 예시={예시하기} 바쁨={바쁨} 처음={!목록.length} />
        {/* ① 올리기 */}
        <section className="card pb-step">
          <div className="pb-sh"><span className="pb-no">1</span>사진 올리기 <span className="count">· {목록.length}장</span></div>
          <div className="pb-drop" onClick={() => 입력.current && 입력.current.click()} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') 입력.current && 입력.current.click() }}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); 올리기(e.dataTransfer.files) }}>
            <div className="pb-dropi">⬆</div>
            <b>현장 사진을 여기로 끌어다 놓으세요</b>
            <span className="muted">또는 눌러서 고르기 · 여러 장 한 번에 · JPG · PNG · WEBP</span>
          </div>
          <input ref={입력} type="file" accept="image/*" multiple hidden onChange={(e) => { 올리기(e.target.files); e.target.value = '' }} />
          <input ref={폴더} type="file" webkitdirectory="" directory="" multiple hidden onChange={(e) => { 올리기(e.target.files); e.target.value = '' }} />
          <div className="pb-row">
            <button type="button" className="btn ghost sm" onClick={() => 폴더.current && 폴더.current.click()}>📁 폴더째 고르기</button>
            <label className="pb-lab">차례 <select value={s.차례} onChange={(e) => 차례바꾸기(e.target.value)}>
              <option value="때">찍은 시각 차례</option><option value="이름">파일 이름 차례</option><option value="그대로">올린 차례(손으로)</option>
            </select></label>
            {목록.length > 0 && <button type="button" className="btn ghost sm" onClick={() => 새로(true)}>모두 지우기</button>}
          </div>
          {표시된것.length > 0 && (
            <div className="pb-warn">
              살펴볼 사진 {표시된것.length}장 — 흐림 · 거의 같음(연속 촬영) · 어두움
              <button type="button" className="btn ghost sm" onClick={() => { if (window.confirm(`표시된 사진 ${표시된것.length}장을 뺄까요?`)) 빼기(표시된것) }}>표시된 것 빼기</button>
            </div>
          )}
          <p className="pb-note">🔒 사진은 이 브라우저 안에서만 다룹니다 — 서버로 올라가지 않습니다. 적은 것은 이 브라우저에 저절로 남아 창을 닫았다 열어도 이어서 합니다.</p>
        </section>

        {/* ② 꾸미기 */}
        <section className="card pb-step">
          <div className="pb-sh"><span className="pb-no">2</span>꾸미기 <span className="count">· {설정.한쪽에}장씩 · {설정.용지}</span></div>
          <div className="pb-two">
            <label className="pb-f"><span>제목</span><input value={설정.제목} onChange={(e) => 설정바꾸기({ 제목: e.target.value })} list="pb-titles" /></label>
            <datalist id="pb-titles"><option value="사진대지" /><option value="공사 사진대지" /><option value="검측 사진대지" /><option value="준공 사진대지" /><option value="안전점검 사진대지" /><option value="시공 전·후 사진대지" /></datalist>
            <label className="pb-f"><span>공사명</span><input value={설정.공사명} placeholder="○○지구 배수로 정비공사" onChange={(e) => 설정바꾸기({ 공사명: e.target.value })} /></label>
            <label className="pb-f"><span>위치</span><input value={설정.위치} placeholder="○○리 일원 (비우면 안 나옴)" onChange={(e) => 설정바꾸기({ 위치: e.target.value })} /></label>
            <label className="pb-f"><span>결재란</span><input value={결재글} placeholder="담당, 소장 (비우면 없음)" onChange={(e) => 설정바꾸기({ 결재: e.target.value.split(/[,，·]/).map((x) => x.trim()).filter(Boolean).slice(0, 4) })} /></label>
          </div>
          <div className="pb-seg">
            <span className="pb-segl">용지</span>
            {['세로', '가로'].map((v) => <button key={v} type="button" className={'chip' + (설정.용지 === v ? ' on' : '')} onClick={() => 설정바꾸기({ 용지: v })}>{v === '세로' ? '▯ 세로' : '▭ 가로'}</button>)}
          </div>
          <div className="pb-seg">
            <span className="pb-segl">한 쪽에</span>
            {(설정.비교 ? [1, 2, 3] : 한쪽에들).map((n) => <button key={n} type="button" className={'chip' + (설정.한쪽에 === n ? ' on' : '')} onClick={() => 설정바꾸기({ 한쪽에: n })}>{n}{설정.비교 ? '짝' : '장'}</button>)}
          </div>
          <label className="pb-f"><span>칸 구성</span>
            <select value={설정.항목꼴} onChange={(e) => 설정바꾸기({ 항목꼴: e.target.value, 항목줄: 항목꼴들[e.target.value] })}>
              {Object.keys(항목꼴들).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <div className="pb-names">
            <span className="muted">칸 이름 바꾸기</span>
            {설정.항목줄.flat().map((f) => (
              <input key={f.id} value={f.이름} aria-label="칸 이름" onChange={(e) => 설정바꾸기({ 항목줄: 설정.항목줄.map((줄) => 줄.map((x) => (x.id === f.id ? { ...x, 이름: e.target.value } : x))) })} />
            ))}
          </div>
          <div className="pb-checks">
            <label><input type="checkbox" checked={설정.번호} onChange={(e) => 설정바꾸기({ 번호: e.target.checked })} /> 사진 번호</label>
            <label><input type="checkbox" checked={설정.쪽번호} onChange={(e) => 설정바꾸기({ 쪽번호: e.target.checked })} /> 쪽 번호</label>
            <label><input type="checkbox" checked={설정.날짜쪽} onChange={(e) => 설정바꾸기({ 날짜쪽: e.target.checked })} /> 날짜가 바뀌면 새 쪽</label>
            <label><input type="checkbox" checked={설정.이름을설명} onChange={(e) => 설정바꾸기({ 이름을설명: e.target.checked })} /> 파일 이름을 내용 칸에</label>
            <label><input type="checkbox" checked={설정.맞춤 === '채움'} onChange={(e) => 설정바꾸기({ 맞춤: e.target.checked ? '채움' : '다보임' })} /> 사진을 칸에 꽉 채우기(가장자리 잘림)</label>
            <label><input type="checkbox" checked={설정.비교} onChange={(e) => 설정바꾸기({ 비교: e.target.checked, 한쪽에: e.target.checked ? Math.min(3, 설정.한쪽에) : 설정.한쪽에 })} /> 시공 전·후 나란히(두 장씩 짝)</label>
          </div>
          {설정.비교 && (
            <div className="pb-two">
              <label className="pb-f"><span>왼쪽</span><input value={설정.전이름} onChange={(e) => 설정바꾸기({ 전이름: e.target.value })} /></label>
              <label className="pb-f"><span>오른쪽</span><input value={설정.후이름} onChange={(e) => 설정바꾸기({ 후이름: e.target.value })} /></label>
              <p className="pb-note" style={{ gridColumn: '1 / -1' }}>1·2번, 3·4번 … 이 한 짝입니다. 차례는 ③ 에서 ↑↓ 로 맞추십시오.</p>
            </div>
          )}
        </section>

        {/* ③ 내용 */}
        <section className="card pb-step">
          <div className="pb-sh"><span className="pb-no">3</span>내용 적기 <span className="count">· 일자는 찍은 날이 저절로</span></div>
          {!목록.length && <p className="muted" style={{ margin: 0 }}>사진을 올리면 사진마다 칸이 나옵니다.</p>}
          <div className="pb-list">
            {목록.map((p, i) => {
              const 표 = 표시.get(p.id) || []
              const 칸들 = 설정.항목줄.flat()
              return (
                <div key={p.id} className={'pb-item' + (표.length ? ' flag' : '')}>
                  <div className="pb-thumb">
                    <img src={p.작은그림} alt="" loading="lazy" />
                    <span className="pb-num">{설정.비교 ? `${Math.floor(i / 2) + 1}${i % 2 ? '후' : '전'}` : i + 1}</span>
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
                      <button type="button" onClick={() => 돌리기(p)} title="오른쪽으로 돌리기">⟳</button>
                      <label className="pb-nb" title="이 사진부터 새 쪽"><input type="checkbox" checked={!!p.새쪽} onChange={(e) => 사진바꾸기(p.id, { 새쪽: e.target.checked })} />새 쪽</label>
                      <button type="button" className="pb-del" onClick={() => 빼기([p.id])} title="빼기">✕ 빼기</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ④ 내보내기 */}
        <section className="card pb-step">
          <div className="pb-sh"><span className="pb-no">4</span>내려받기 <span className="count">· {결과.쪽들.length}쪽</span></div>
          <내보내기줄 바쁨={바쁨} 할={내보내기} 용량={설정.용량} set용량={(v) => 설정바꾸기({ 용량: v })} 수={목록.length} />
          {알림 && <div className="cok">{알림}</div>}
          {오류 && <div className="pb-err">{오류}</div>}
        </section>
      </div>
      <div className="pb-right">
        <미리보기판 쪽들={결과.쪽들} 그림찾기={그림찾기} />
      </div>
      <끌어놓기판 길들={[{ 꼴: 사진꼴, 받기: 올리기, 여럿: true }]} 글="사진을 놓으면 사진대지에 들어갑니다" />
    </div>
  )
}

/* ══════════════════════ 🧾 칸 고치기(영수증 나누기 손보기) ══════════════════════ */
function 칸고치기({ 스캔, 닫기, 다됨 }) {
  const [칸들, set칸들] = useState(() => 스캔.칸들.map((k) => ({ ...k })))
  const 판 = useRef(null)
  const 끌기 = useRef(null)
  const [다시중, set다시중] = useState(false)
  const 자리 = (e) => {
    const r = 판.current.getBoundingClientRect()
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }
  }
  const 누름 = (e, 방식, i) => {
    e.preventDefault(); e.stopPropagation()
    const p = 자리(e)
    if (방식 === '새') {
      const id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
      set칸들((a) => [...a, { id, x: p.x, y: p.y, w: 0, h: 0, 돌림: 0, 새: true }])
      끌기.current = { 방식: '새', 시작: p, id }
    } else 끌기.current = { 방식, 시작: p, i, 원: { ...칸들[i] } }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (er) { /* 없음 */ }
  }
  const 움직임 = (e) => {
    const d = 끌기.current
    if (!d) return
    const p = 자리(e)
    set칸들((a) => a.map((k, j) => {
      if (d.방식 === '새') {
        if (k.id !== d.id) return k
        return { ...k, x: Math.min(d.시작.x, p.x), y: Math.min(d.시작.y, p.y), w: Math.abs(p.x - d.시작.x), h: Math.abs(p.y - d.시작.y) }
      }
      if (j !== d.i) return k
      const o = d.원, dx = p.x - d.시작.x, dy = p.y - d.시작.y
      if (d.방식 === '옮김') return { ...k, x: Math.min(1 - o.w, Math.max(0, o.x + dx)), y: Math.min(1 - o.h, Math.max(0, o.y + dy)) }
      let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h
      if (d.방식.includes('왼')) x0 = Math.min(x1 - 0.02, Math.max(0, x0 + dx))
      if (d.방식.includes('오')) x1 = Math.max(x0 + 0.02, Math.min(1, x1 + dx))
      if (d.방식.includes('위')) y0 = Math.min(y1 - 0.02, Math.max(0, y0 + dy))
      if (d.방식.includes('아')) y1 = Math.max(y0 + 0.02, Math.min(1, y1 + dy))
      return { ...k, x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
    }))
  }
  const 뗌 = () => {
    const d = 끌기.current
    끌기.current = null
    if (d && d.방식 === '새') set칸들((a) => a.filter((k) => k.id !== d.id || (k.w > 0.02 && k.h > 0.02)).map((k) => ({ ...k, 새: false })))
  }
  const 자동 = async () => {
    set다시중(true)
    try { const m = await import('../lib/영수증읽기.js'); set칸들(await m.다시나누기(스캔)) } finally { set다시중(false) }
  }
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') 닫기() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [닫기])
  const 비 = 스캔.너비 / 스캔.높이
  return (
    <div className="pb-modal" role="dialog" aria-label="영수증 칸 고치기" onClick={닫기}>
      <div className="pb-mbox" onClick={(e) => e.stopPropagation()}>
        <div className="pb-mh"><b>✂️ 영수증 칸 고치기</b> <span className="muted">· {스캔.이름} · {칸들.length}장</span><span className="grow" /><button type="button" className="pb-ib" onClick={닫기} aria-label="닫기">✕</button></div>
        <p className="pb-note" style={{ margin: '4px 0 8px' }}>빈 곳을 끌면 새 칸 · 칸을 끌면 옮김 · 모서리를 끌면 크기 · ✕ 는 지움. 칸 하나가 영수증 한 장입니다.</p>
        <div className="pb-mwrap">
          <div className="pb-canvas" ref={판} style={{ aspectRatio: `${비}`, width: '100%', maxWidth: `${Math.round(70 * 비 * 10) / 10}vh` }}
            onPointerDown={(e) => 누름(e, '새')} onPointerMove={움직임} onPointerUp={뗌} onPointerCancel={뗌}>
            <img src={그림주소(스캔.작업본)} alt="" draggable="false" />
            {칸들.map((k, i) => (
              <div key={k.id} className="pb-box" style={{ left: `${k.x * 100}%`, top: `${k.y * 100}%`, width: `${k.w * 100}%`, height: `${k.h * 100}%` }}
                onPointerDown={(e) => 누름(e, '옮김', i)}>
                <span className="pb-boxn">{i + 1}</span>
                <button type="button" className="pb-boxx" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); set칸들((a) => a.filter((_, j) => j !== i)) }} aria-label="이 칸 지우기">✕</button>
                {['왼위', '오위', '왼아', '오아'].map((c) => <span key={c} className={'pb-h h-' + c} onPointerDown={(e) => 누름(e, c, i)} />)}
              </div>
            ))}
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button type="button" className="btn ghost sm" onClick={자동} disabled={다시중}>{다시중 ? '찾는 중…' : '🔄 자동으로 다시 찾기'}</button>
          <button type="button" className="btn ghost sm" onClick={() => set칸들([{ id: 'r' + Date.now().toString(36), x: 0, y: 0, w: 1, h: 1, 돌림: 0 }])}>한 장 통째로</button>
          <span className="grow" />
          <button type="button" className="btn ghost sm" onClick={닫기}>그만두기</button>
          <button type="button" className="btn sm" onClick={() => 다됨(칸들.filter((k) => k.w > 0.02 && k.h > 0.02))}>✔ 다 됐습니다</button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════ 🧾 영수증 정리 ══════════════════════ */
const 빈값 = { 일자: '', 사용처: '', 과목: '', 금액: '', 결제: '카드', 사용자: '', 비고: '' }

function 영수증판() {
  const [s, set] = useState(() => 기억.영수증 || { 스캔들: [], 목록: [], 설정: { ...영수증기본, 작성일: 오늘() }, 불러옴: false })
  const [바쁨, set바쁨] = useState('')
  const [알림, set알림] = useState('')
  const [오류, set오류] = useState('')
  const [고친스캔, set고친스캔] = useState(null)
  const [본, set본] = useState('')          /* 크게 보는 영수증 id */
  const [오른쪽, set오른쪽] = useState('크게')
  const [지난, set지난] = useState(null)
  const 입력 = useRef(null)
  const { 스캔들, 목록, 설정 } = s
  useEffect(() => { 기억.영수증 = s }, [s])
  useEffect(() => {
    if (s.불러옴 || s.목록.length) return
    let 끝 = false
    보관.꺼내기('영수증문서').then((d) => { if (!끝 && d && d.목록 && d.목록.length) set지난(d) })
    return () => { 끝 = true }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!s.불러옴 && !s.목록.length) return undefined
    const t = setTimeout(() => {
      보관.넣기('영수증문서', {
        설정: s.설정, 때: Date.now(),
        스캔들: s.스캔들.map(({ 작업본, 작은그림, ...n }) => n), 목록: s.목록.map(({ 작업본, 작은그림, ...n }) => n),
      })
    }, 700)
    return () => clearTimeout(t)
  }, [s])

  const 이어하기 = async () => {
    const d = 지난
    set지난(null)
    set바쁨('지난번 작업을 여는 중…')
    const 그림 = await 보관.여럿꺼내기([...d.스캔들.map((x) => 's:' + x.id), ...d.목록.map((x) => 'r:' + x.id)])
    const 스 = d.스캔들.map((x) => ({ ...x, ...(그림.get('s:' + x.id) || {}) })).filter((x) => x.작업본)
    const 목 = d.목록.map((x) => ({ ...x, ...(그림.get('r:' + x.id) || {}) })).filter((x) => x.작업본)
    set({ 스캔들: 스, 목록: 목, 설정: { ...영수증기본, ...d.설정 }, 불러옴: true })
    set바쁨('')
    set알림(`지난번 작업(영수증 ${목.length}장)을 이어서 합니다.`)
  }
  const 새로 = async (확인 = true) => {
    if (확인 && s.목록.length && !window.confirm(`영수증 ${s.목록.length}장과 적은 내용을 모두 지울까요?`)) return
    const src = 지난 || s
    await 보관.지우기(['영수증문서', ...src.스캔들.map((x) => 's:' + x.id), ...src.목록.map((x) => 'r:' + x.id)])
    set지난(null)
    set({ 스캔들: [], 목록: [], 설정: { ...s.설정 }, 불러옴: true })
    set알림(''); set본('')
  }
  const 설정바꾸기 = (고칠) => set((o) => ({ ...o, 불러옴: true, 설정: { ...o.설정, ...고칠 } }))
  const 값바꾸기 = (id, 고칠) => set((o) => ({ ...o, 목록: o.목록.map((r) => (r.id === id ? { ...r, 값: { ...r.값, ...고칠 } } : r)) }))

  const 올리기 = async (fs, 미리값 = null, 머리 = '') => {
    const 받을 = [...(fs || [])].filter((f) => 영수증꼴.test(f.name) || /^image\//.test(f.type) || f.type === 'application/pdf')
    if (!받을.length) { set오류('영수증 사진이나 스캔 PDF 를 골라 주십시오.'); return }
    set오류(''); set알림('')
    const m = await import('../lib/영수증읽기.js')
    const 새스캔 = [], 새목록 = [], 틀림 = []
    for (let i = 0; i < 받을.length; i++) {
      set바쁨(`읽고 나누는 중… ${i + 1} / ${받을.length}`)
      await 숨()
      try {
        const 스들 = await m.스캔열기(받을[i], (a, b) => set바쁨(`PDF ${a} / ${b}쪽 읽는 중…`))
        for (const 스 of 스들) {
          const 조각 = await m.모두잘라내기(스)
          새스캔.push(스)
          보관.넣기('s:' + 스.id, { 작업본: 스.작업본, 작은그림: 스.작은그림 })
          for (const c of 조각) {
            const 미리 = 미리값 && 미리값[새목록.length]
            const r = { id: c.칸.id, 스캔id: 스.id, 작업본: c.작업본, 너비: c.너비, 높이: c.높이, 작은그림: c.작은그림, 값: { ...빈값, ...(미리 || {}) } }
            새목록.push(r)
            보관.넣기('r:' + r.id, { 작업본: r.작업본, 작은그림: r.작은그림 })
          }
        }
      } catch (e) { 틀림.push(e.message) }
    }
    set바쁨('')
    set((o) => ({ ...o, 스캔들: [...o.스캔들, ...새스캔], 목록: [...o.목록, ...새목록], 불러옴: true }))
    if (새목록.length && !본) set본(새목록[0].id)
    const 여럿 = 새스캔.filter((x) => x.칸들.length > 1).length
    set알림(`${머리}스캔 ${새스캔.length}장 → 영수증 ${새목록.length}장으로 나눴습니다.` + (여럿 ? ` 한 장에 여러 개였던 스캔 ${여럿}장 — 틀리면 «✂️ 칸 고치기» 로 손보십시오.` : ''))
    if (틀림.length) set오류(틀림.slice(0, 3).join(' / '))
  }

  /* 칸 고치기 끝 → 그 스캔의 영수증을 다시 자름(적은 값은 칸 id 로 이어짐) */
  const 칸다됨 = async (스캔, 칸들) => {
    set고친스캔(null)
    set바쁨('다시 자르는 중…')
    try {
      const m = await import('../lib/영수증읽기.js')
      const 새스 = { ...스캔, 칸들 }
      const 조각 = await m.모두잘라내기(새스)
      set((o) => {
        const 옛 = new Map(o.목록.filter((r) => r.스캔id === 스캔.id).map((r) => [r.id, r]))
        const 새것 = 조각.map((c) => {
          const 전 = 옛.get(c.칸.id)
          const r = { id: c.칸.id, 스캔id: 스캔.id, 작업본: c.작업본, 너비: c.너비, 높이: c.높이, 작은그림: c.작은그림, 값: 전 ? 전.값 : { ...빈값 } }
          보관.넣기('r:' + r.id, { 작업본: r.작업본, 작은그림: r.작은그림 })
          return r
        })
        for (const id of 옛.keys()) if (!조각.some((c) => c.칸.id === id)) 보관.지우기('r:' + id)
        const 첫자리 = o.목록.findIndex((r) => r.스캔id === 스캔.id)
        const 남 = o.목록.filter((r) => r.스캔id !== 스캔.id)
        const at = 첫자리 < 0 ? 남.length : Math.min(첫자리, 남.length)
        return { ...o, 스캔들: o.스캔들.map((x) => (x.id === 스캔.id ? 새스 : x)), 목록: [...남.slice(0, at), ...새것, ...남.slice(at)] }
      })
      set알림(`${스캔.이름} — 영수증 ${칸들.length}장`)
    } finally { set바쁨('') }
  }
  const 돌리기 = async (r) => {
    const 스 = 스캔들.find((x) => x.id === r.스캔id)
    if (!스) return
    const 칸들 = 스.칸들.map((k) => (k.id === r.id ? { ...k, 돌림: ((k.돌림 || 0) + 90) % 360 } : k))
    const m = await import('../lib/영수증읽기.js')
    const c = await m.잘라내기(스, 칸들.find((k) => k.id === r.id))
    보관.넣기('r:' + r.id, { 작업본: c.작업본, 작은그림: c.작은그림 })
    set((o) => ({ ...o, 스캔들: o.스캔들.map((x) => (x.id === 스.id ? { ...x, 칸들 } : x)), 목록: o.목록.map((x) => (x.id === r.id ? { ...x, ...c } : x)) }))
  }
  const 빼기 = (id) => {
    보관.지우기('r:' + id)
    set((o) => ({ ...o, 목록: o.목록.filter((r) => r.id !== id), 스캔들: o.스캔들.map((x) => ({ ...x, 칸들: x.칸들.filter((k) => k.id !== id) })) }))
  }
  const 옮기기 = (i, d) => set((o) => {
    const a = [...o.목록]; const j = i + d
    if (j < 0 || j >= a.length) return o
    ;[a[i], a[j]] = [a[j], a[i]]
    return { ...o, 목록: a }
  })

  const 예시하기 = async () => {
    if (목록.length && !window.confirm('예시 영수증 스캔을 지금 목록 뒤에 붙일까요? (나중에 «모두 지우기» 로 지울 수 있습니다)')) return
    set바쁨('예시 스캔을 그리는 중…')
    const m = await import('../lib/사진예시.js')
    const { 파일, 값들 } = await m.예시영수증()
    if (!설정.공사명) 설정바꾸기({ 공사명: '○○지구 배수로 정비공사 (예시)', 작성자: 설정.작성자 || '○○○' })
    await 올리기([파일], 값들, '▶ 예시(값까지 채움) — ')
    set오른쪽('미리')
  }
  const 줄들 = useMemo(() => {
    const a = 목록.map((r) => ({ id: r.id, 그림: r.id, ...r.값, 금액: 금액읽기(r.값.금액) }))
    if (설정.차례 === '일자') a.sort((x, y) => String(x.일자 || '9').localeCompare(String(y.일자 || '9')))
    return a
  }, [목록, 설정.차례])
  const 합 = useMemo(() => 모으기(줄들), [줄들])
  const 결과 = useMemo(() => 영수증쪽들(줄들, 설정), [줄들, 설정])
  const 그림찾기 = useMemo(() => { const m = new Map(목록.map((r) => [r.id, r])); return (id) => 그림주소(m.get(id) && m.get(id).작업본) }, [목록])
  const 보는것 = 목록.find((r) => r.id === 본) || null

  const 내보내기 = async (형식) => {
    const 창 = 형식 === 'print' ? window.open('', '_blank') : null
    set오류('')
    try {
      const 그림들 = new Map()
      for (let i = 0; i < 목록.length; i++) {
        set바쁨(`영수증 그림을 줄이는 중… ${i + 1} / ${목록.length}`)
        if (i % 4 === 0) await 숨()
        그림들.set(목록[i].id, await 그림준비(목록[i], null, 설정.용량 || '보통'))
      }
      const 실 = 형식 === 'print' ? 'pdf' : 형식
      set바쁨(`${형식표[실][0]} 파일을 만드는 중…`)
      await 숨()
      const 제목 = 설정.제목 || '지출결의서'
      let 더시트 = []
      if (실 === 'xlsx') 더시트 = 영수증수식시트들(줄들, 설정)
      const 바이트 = await 파일만들기(실, 결과.쪽들, 그림들, 제목, 더시트)
      const 이름 = `${파일이름([제목, 설정.공사명].filter(Boolean).join('_'))}_${오늘()}${형식표[실][2]}`
      if (형식 === 'print') {
        const url = URL.createObjectURL(new Blob([바이트], { type: 'application/pdf' }))
        if (창) 창.location.href = url; else 저장하기(이름, 바이트, 형식표.pdf[1])
      } else 저장하기(이름, 바이트, 형식표[실][1])
      set알림(`✔ ${이름} — ${결과.쪽들.length}쪽 · ${(바이트.length / 1048576).toFixed(1)}MB`)
      try { askAfter('photo') } catch (e) { /* 없음 */ }
    } catch (e) {
      if (창) 창.close()
      set오류(`만들지 못했습니다 — ${e && e.message ? e.message : e}`)
    } finally { set바쁨('') }
  }

  return (
    <div className="pb-grid">
      <div className="pb-left">
        {지난 && (
          <div className="card pb-again">
            <b>💾 지난번 작업이 있습니다</b> — 영수증 {지난.목록.length}장
            <div className="btn-row"><button type="button" className="btn sm" onClick={이어하기}>이어서 하기</button>
              <button type="button" className="btn ghost sm" onClick={() => 새로(false)}>지우고 새로</button></div>
          </div>
        )}
        <사용법 종류="영수증" 예시={예시하기} 바쁨={바쁨} 처음={!목록.length} />
        <section className="card pb-step">
          <div className="pb-sh"><span className="pb-no">1</span>영수증 올리기 <span className="count">· {목록.length}장</span></div>
          <div className="pb-drop" onClick={() => 입력.current && 입력.current.click()} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') 입력.current && 입력.current.click() }}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); 올리기(e.dataTransfer.files) }}>
            <div className="pb-dropi">🧾</div>
            <b>영수증 사진 · 스캔(PDF)을 여기로</b>
            <span className="muted">한 장에 여러 개를 스캔해도 저절로 나눕니다 · 여러 파일 한 번에</span>
          </div>
          <input ref={입력} type="file" accept="image/*,application/pdf,.pdf" multiple hidden onChange={(e) => { 올리기(e.target.files); e.target.value = '' }} />
          {스캔들.length > 0 && (
            <div className="pb-scans">
              {스캔들.map((x) => (
                <div key={x.id} className="pb-scan">
                  <img src={x.작은그림} alt="" />
                  <div><div className="pb-meta" title={x.이름}>{x.이름}</div><b>{x.칸들.length}장</b></div>
                  <button type="button" className="btn ghost sm" onClick={() => set고친스캔(x)}>✂️ 칸 고치기</button>
                </div>
              ))}
            </div>
          )}
          <div className="pb-row">
            {목록.length > 0 && <button type="button" className="btn ghost sm" onClick={() => 새로(true)}>모두 지우기</button>}
          </div>
          <p className="pb-note">🔒 영수증은 이 브라우저 안에서만 다룹니다 — 서버로 올라가지 않습니다. 적은 것은 이 브라우저에 저절로 남습니다.</p>
        </section>

        <section className="card pb-step">
          <div className="pb-sh"><span className="pb-no">2</span>내용 적기 <span className="count">· 사용처를 적으면 과목을 골라 드립니다</span></div>
          {!목록.length && <p className="muted" style={{ margin: 0 }}>영수증을 올리면 한 장마다 줄이 생깁니다. 왼쪽 그림을 누르면 크게 보면서 적을 수 있습니다.</p>}
          <div className="pb-rlist">
            {목록.map((r, i) => {
              const v = r.값
              const 추천 = !v.과목 && v.사용처 ? 과목추천(v.사용처) : ''
              return (
                <div key={r.id} className={'pb-rrow' + (본 === r.id ? ' on' : '')} onFocus={() => set본(r.id)}>
                  <button type="button" className="pb-rth" onClick={() => { set본(r.id); set오른쪽('크게') }} title="크게 보기">
                    <img src={r.작은그림} alt="" loading="lazy" /><span className="pb-num">{i + 1}</span>
                  </button>
                  <div className="pb-rf">
                    <input className="w-d" value={v.일자} placeholder="2026.09.30" aria-label="일자" onChange={(e) => 값바꾸기(r.id, { 일자: e.target.value })} onBlur={(e) => e.target.value && 값바꾸기(r.id, { 일자: 날짜고르기(e.target.value) })} />
                    <input className="w-s" value={v.사용처} placeholder="사용처(상호)" aria-label="사용처" onChange={(e) => 값바꾸기(r.id, { 사용처: e.target.value })} onBlur={(e) => { const t = 과목추천(e.target.value); if (t && !v.과목) 값바꾸기(r.id, { 과목: t }) }} />
                    <input className="w-m" value={v.금액} placeholder="금액" inputMode="numeric" aria-label="금액" onChange={(e) => 값바꾸기(r.id, { 금액: e.target.value })} onBlur={(e) => { const n = 금액읽기(e.target.value); 값바꾸기(r.id, { 금액: n ? 쉼표(n) : '' }) }} />
                    <select className="w-g" value={v.과목} aria-label="과목" onChange={(e) => 값바꾸기(r.id, { 과목: e.target.value })}>
                      <option value="">{추천 ? `과목(${추천}?)` : '과목'}</option>
                      {과목들.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select className="w-p" value={v.결제} aria-label="결제" onChange={(e) => 값바꾸기(r.id, { 결제: e.target.value })}>
                      {['카드', '현금', '계좌이체', '법인카드', '개인카드'].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input className="w-u" value={v.사용자} placeholder="사용자" aria-label="사용자" onChange={(e) => 값바꾸기(r.id, { 사용자: e.target.value })} />
                    <input className="w-b" value={v.비고} placeholder="비고" aria-label="비고" onChange={(e) => 값바꾸기(r.id, { 비고: e.target.value })} />
                  </div>
                  <div className="pb-racts">
                    <button type="button" onClick={() => 옮기기(i, -1)} disabled={i === 0} title="앞으로">↑</button>
                    <button type="button" onClick={() => 옮기기(i, 1)} disabled={i === 목록.length - 1} title="뒤로">↓</button>
                    <button type="button" onClick={() => 돌리기(r)} title="돌리기">⟳</button>
                    <button type="button" className="pb-del" onClick={() => 빼기(r.id)} title="빼기">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
          {목록.length > 0 && (
            <div className="pb-sum">
              {합.과목별.map((x) => <span key={x.과목}>{x.과목} <b>{쉼표(x.금액)}</b> <i>({x.건수})</i></span>)}
              <span className="pb-tot">합계 <b>{쉼표(합.모두)}원</b> <i>· 금 {한글금액(합.모두)}원정</i></span>
            </div>
          )}
        </section>

        <section className="card pb-step">
          <div className="pb-sh"><span className="pb-no">3</span>꾸미기</div>
          <div className="pb-two">
            <label className="pb-f"><span>제목</span><input value={설정.제목} onChange={(e) => 설정바꾸기({ 제목: e.target.value })} list="pb-rtitles" /></label>
            <datalist id="pb-rtitles"><option value="지출결의서" /><option value="현장경비 정산서" /><option value="경비 지출결의서" /><option value="영수증 정산서" /></datalist>
            <label className="pb-f"><span>현장명</span><input value={설정.공사명} placeholder="○○지구 배수로 정비공사" onChange={(e) => 설정바꾸기({ 공사명: e.target.value })} /></label>
            <label className="pb-f"><span>작성자</span><input value={설정.작성자} onChange={(e) => 설정바꾸기({ 작성자: e.target.value })} /></label>
            <label className="pb-f"><span>작성일</span><input value={설정.작성일} onChange={(e) => 설정바꾸기({ 작성일: e.target.value })} onBlur={(e) => 설정바꾸기({ 작성일: 날짜고르기(e.target.value) })} /></label>
            <label className="pb-f"><span>결재란</span><input value={(설정.결재 || []).join(', ')} placeholder="담당, 소장" onChange={(e) => 설정바꾸기({ 결재: e.target.value.split(/[,，·]/).map((x) => x.trim()).filter(Boolean).slice(0, 4) })} /></label>
            <label className="pb-f"><span>차례</span><select value={설정.차례} onChange={(e) => 설정바꾸기({ 차례: e.target.value })}><option value="올린차례">올린 차례</option><option value="일자">일자 차례</option></select></label>
          </div>
          <div className="pb-seg">
            <span className="pb-segl">증빙 한 쪽에</span>
            {[2, 4, 6, 8].map((n) => <button key={n} type="button" className={'chip' + (설정.증빙한쪽에 === n ? ' on' : '')} onClick={() => 설정바꾸기({ 증빙한쪽에: n })}>{n}장</button>)}
          </div>
          <div className="pb-checks">
            <label><input type="checkbox" checked={설정.결의서} onChange={(e) => 설정바꾸기({ 결의서: e.target.checked })} /> 지출결의서(과목별 합계)</label>
            <label><input type="checkbox" checked={설정.명세} onChange={(e) => 설정바꾸기({ 명세: e.target.checked })} /> 지출명세서(한 줄씩)</label>
            <label><input type="checkbox" checked={설정.증빙} onChange={(e) => 설정바꾸기({ 증빙: e.target.checked })} /> 증빙자료(영수증 붙임 · 번호 맞춤)</label>
          </div>
        </section>

        <section className="card pb-step">
          <div className="pb-sh"><span className="pb-no">4</span>내려받기 <span className="count">· {결과.쪽들.length}쪽{목록.length ? ' · 엑셀은 수식이 살아 있음' : ''}</span></div>
          <내보내기줄 바쁨={바쁨} 할={내보내기} 용량={설정.용량 || '보통'} set용량={(v) => 설정바꾸기({ 용량: v })} 수={목록.length} />
          {알림 && <div className="cok">{알림}</div>}
          {오류 && <div className="pb-err">{오류}</div>}
        </section>
      </div>
      <div className="pb-right">
        <div className="pb-tabs2">
          <button type="button" className={오른쪽 === '크게' ? 'on' : ''} onClick={() => set오른쪽('크게')}>🔍 영수증 크게</button>
          <button type="button" className={오른쪽 === '미리' ? 'on' : ''} onClick={() => set오른쪽('미리')}>📄 미리보기</button>
        </div>
        {오른쪽 === '크게' ? (
          <div className="pb-view pb-big">
            {보는것 ? (
              <>
                <div className="pb-vbar"><b>{목록.indexOf(보는것) + 1}번 영수증</b><span className="grow" />
                  <button type="button" className="pb-ib" onClick={() => { const i = 목록.indexOf(보는것); if (i > 0) set본(목록[i - 1].id) }} aria-label="앞">‹</button>
                  <button type="button" className="pb-ib" onClick={() => { const i = 목록.indexOf(보는것); if (i < 목록.length - 1) set본(목록[i + 1].id) }} aria-label="다음">›</button>
                  <button type="button" className="pb-ib" onClick={() => 돌리기(보는것)} aria-label="돌리기">⟳</button>
                </div>
                <div className="pb-vbody"><img src={그림주소(보는것.작업본)} alt="" /></div>
              </>
            ) : <div className="pb-empty">영수증 줄을 누르면 여기서 크게 보며 적습니다</div>}
          </div>
        ) : <미리보기판 쪽들={결과.쪽들} 그림찾기={그림찾기} />}
      </div>
      {고친스캔 && <칸고치기 스캔={고친스캔} 닫기={() => set고친스캔(null)} 다됨={(칸들) => 칸다됨(고친스캔, 칸들)} />}
      <끌어놓기판 길들={[{ 꼴: 영수증꼴, 받기: 올리기, 여럿: true }]} 글="영수증을 놓으면 나눠서 넣습니다" />
    </div>
  )
}

export default function PhotoBook() {
  const [탭, set탭] = useState(() => 기억.탭 || '사진')
  useEffect(() => { 기억.탭 = 탭 }, [탭])
  return (
    <div className="pb">
      <div className="card pb-head">
        <h1>📷 사진대지 · 🧾 영수증 정리</h1>
        <p>현장 사진은 <b>사진대지</b>로, 영수증은 <b>지출결의서 · 명세서 · 증빙자료</b>로 — <b>PDF · 엑셀 · 한글 · 워드 모두 무료</b>, 가입 없음.
          사진과 영수증은 <b>이 브라우저 밖으로 나가지 않습니다</b>.</p>
        <div className="pb-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={탭 === '사진'} className={탭 === '사진' ? 'on' : ''} onClick={() => set탭('사진')}>📷 사진대지</button>
          <button type="button" role="tab" aria-selected={탭 === '영수증'} className={탭 === '영수증' ? 'on' : ''} onClick={() => set탭('영수증')}>🧾 영수증 정리</button>
          <span className="grow" />
          <Link className="pb-more" to="/pdf">📄 PDF 도구</Link>
          <Link className="pb-more" to="/tools/wonclick">⚡ 공사서류 원클릭</Link>
        </div>
      </div>
      {탭 === '사진' ? <사진대지판 /> : <영수증판 />}
    </div>
  )
}
