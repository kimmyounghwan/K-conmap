/**
 * 🛣 K-적산컨맵 작업 화면 «토목» 탭 (G396 · 2026-10-24) — 🔒 작업 화면은 운영자(소장님 브라우저)만
 *
 * 소장님: 「토목도 되는 거지?」 · 「도구도 따로?」 · 「좌표가 있어야 해」 → 같은 작업 화면에 🏢 건축 | 🛣 토목 (따로 안 만듦)
 *   바탕 = 노선(STA) · 실제 좌표(TM X · Y) · 표고(EL) · 측량점 파일 · 좌표계 — 읽기는 BIM 물량 화면과 같은 길(도면 3D 일꾼)
 * ■ 왼쪽: 🧭 토목 길잡이(측량 → 노선 → 종단 → 횡단 → 구조물 → 땅 → 물량) · 📚 도면함(기준 · 맞춤 · 그대로 · 옆 · 높이만)
 * ■ 가운데: 📐 평면(노선 · 측점 눈금 · 측량점 · 구조물 · 도면 선 — 누르면 그 자리 X · Y · EL · STA) · 🧊 3D(배수로 · 흙 · 구조물 · 땅)
 * ■ 오른쪽: 📍 좌표계(경위도 · 지도) · 고른 자리 · 🛣 노선(측점표 STA · X · Y · 지반고 · 계획고 · 땅 EL) · 📏 측점 성과 맞대기 · 📐 토공 합
 * ■ 이 브라우저에만 저장(IndexedDB «kcm.civil.v1») — 예시는 저장 안 함 · 서버로 안 감 · 비용 0
 * ■ 📊 숨은 누적: |토목탭|열기 · 도면넣기 · 예시 · 엑셀 · CSV · 자리 · 좌표계 · 노선 · 3D
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 세기 } from './lib/받은수.jsx'
import { 토목열쇠, 토목자료, 노선목록, 측점표, 측점표CSV, 자리읽기, 땅찾개, 좌표계들, TM경위도, 지도주소, 토목길잡이, 도면함, 측점성과읽기, 측점성과대조, STA글, 못찾음글 } from './lib/토목작업.js'
import { 토목모델, 토목색, 토목비침 } from './lib/BIM토목.js'
import { 부재보기 } from './lib/bim3d.js'
import { 넣기 as 기억넣기, 꺼내기 as 기억꺼내기, 지우기 as 기억지우기 } from './lib/기억자료.js'
import { 파일한도, 멈춤감시, 멈춤글 } from './lib/파일한도.js'

const 예시파일 = ['BIM예시_측량도면.dxf', 'BIM예시_계획평면도.dxf', 'BIM예시_종횡단면도.dxf', 'BIM예시_배수장일반도.dxf']
const 예시성과 = 'BIM예시_측점성과.csv'
const 쉼 = (n, d = 0) => (Number.isFinite(n) ? Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—')
const 높글 = (v) => (Number.isFinite(v) ? (v > 0 ? '+' : '') + v.toFixed(2) : '—')
const 어두움 = () => { try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch (e) { return false } }
const 내려주기 = (blob, 이름) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 60000)
}
let 기억T = null       // 탭을 오가도 남게(같은 창 안)

export default function 토목판({ 전체화면, 나가기, 분야칸 }) {
  const [T, setT0] = useState(기억T)
  const [상태, set상태] = useState(null)              // {k: busy|err|ok, 글}
  const [보기, set보기] = useState('평면')
  const [고른노선, set고른노선] = useState('')
  const [자리, set자리] = useState(null)              // {x, y} mm(일꾼 좌표)
  const [고른부재, set고른부재] = useState(null)
  const 일꾼Ref = useRef(null)
  const 파일Ref = useRef(null)
  const setT = (t) => { 기억T = t; setT0(t) }
  const 센 = useRef(new Set())
  const 한번 = (k) => { if (센.current.has(k)) return; 센.current.add(k); 세기(k) }

  /* 저장된 것 열기(이 브라우저) */
  useEffect(() => {
    세기('|토목탭|열기')
    if (기억T) return
    let 살 = true
    기억꺼내기(토목열쇠).then((t) => { if (살 && t && t.활용) setT(t) }).catch(() => {})
    return () => { 살 = false; if (일꾼Ref.current) { 일꾼Ref.current.terminate(); 일꾼Ref.current = null } }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const 활 = T ? T.활용 : null
  const 땅 = useMemo(() => (활 ? 땅찾개(활) : () => NaN), [활])
  const 노선들 = useMemo(() => (활 ? 노선목록(활) : []), [활])
  const 길 = useMemo(() => 토목길잡이(T), [T])
  const 함 = useMemo(() => (T ? 도면함(T.그룹) : []), [T])
  const 표 = useMemo(() => (활 && 고른노선 ? 측점표(활, 고른노선, { 땅 }) : []), [활, 고른노선, 땅])
  const 대조 = useMemo(() => (활 && T.측점성과 && T.측점성과.length ? 측점성과대조(활, T.측점성과) : []), [활, T])
  const 읽은자리 = useMemo(() => (활 && 자리 ? 자리읽기(활, 자리.x, 자리.y, 땅) : null), [활, 자리, 땅])
  const 계 = T ? 좌표계들.find((c) => c.k === (T.좌표계고름 || T.좌표계.k)) || 좌표계들[0] : 좌표계들[0]
  const 가운데경위 = useMemo(() => {
    if (!활 || !활.실좌표 || !계.원 || !T.틀) return null
    const x = (T.틀[0] + T.틀[2]) / 2, y = (T.틀[1] + T.틀[3]) / 2
    const X = 활.바꿈 ? x / 1000 : y / 1000, Y = 활.바꿈 ? y / 1000 : x / 1000
    return TM경위도(X, Y, 계.원)
  }, [활, 계, T])
  const 토 = useMemo(() => { if (!활) return null; try { return 토목모델(활, T.center, {}) } catch (e) { return { 부재: [], 노선들: [], 구조물들: [], 건물들: [], 합: { 콘크리트: 0, 거푸집: 0, 터파기: 0, 되메우기: 0, 성토: 0, 절토: 0 }, 경고: ['3D 를 세우다 멈췄습니다: ' + e.message], 원점: [0, 0], 땅높이: NaN } } }, [활, T])

  /* ── 읽기 ── */
  const 일꾼돌리기 = (목록, 성과) => new Promise((되면, 탈) => {
    if (일꾼Ref.current) 일꾼Ref.current.terminate()
    let w
    try { w = new Worker(new URL('./lib/dxf3d.worker.js', import.meta.url), { type: 'module' }) } catch (e) { 탈(new Error('토목 읽기를 시작하지 못했습니다')); return }
    일꾼Ref.current = w
    const 감시 = 멈춤감시(() => { if (일꾼Ref.current === w) { w.terminate(); 일꾼Ref.current = null; 탈(new Error(멈춤글)) } })
    w.onmessage = (ev) => {
      const m = ev.data || {}
      if (일꾼Ref.current !== w) { 감시.끝(); return }
      감시.깨움()
      if (m.type === 'prog') set상태({ k: 'busy', 글: (m.msg || '읽는 중') + ' · ' + Math.round((m.p || 0) * 100) + '%' })
      else if (m.type === 'err') { 감시.끝(); w.terminate(); 일꾼Ref.current = null; 탈(new Error(m.kind === 'mem' ? '이 기기의 기억이 모자랍니다 — 다른 창 · 탭을 닫고 다시 넣거나 PC 에서' : (m.msg || m.kind || '읽지 못함'))) }
      else if (m.type === 'done') { 감시.끝(); w.terminate(); 일꾼Ref.current = null; 되면(m.r || {}) }
    }
    w.onerror = (e) => { 감시.끝(); if (일꾼Ref.current === w) { w.terminate(); 일꾼Ref.current = null; 탈(new Error(e.message || '읽지 못함')) } }
    w.postMessage({ files: 목록.map((x) => ({ name: x.이름, blob: new Blob([x.buf]) })), 성과 })
  })
  const 읽기 = async (도면들, 표들, 예시 = false) => {
    set상태({ k: 'busy', 글: '파일 여는 중' })
    try {
      /* 측량점 파일 — 좌표 성과표(점 · X · Y · Z) 는 기준으로 · 측점 성과(위치 · 설계지반고 · 시공 지반고) 는 노선마다 맞대기 */
      let 성과 = null
      const 측점성과 = []
      if (표들.length) {
        const { 성과표읽기 } = await import('./lib/성과표.js')
        for (const f of 표들) {
          try { const r = await 성과표읽기(f.이름, f.buf.slice(0)); if (r && (!성과 || r.점.length > 성과.점.length)) 성과 = { 파일: f.이름, 점: r.점, 북동확실: r.북동확실, 빠진줄: r.빠진줄 } } catch (e) { /* 아래 */ }
          try { for (const g of await 측점성과읽기(f.이름, f.buf.slice(0))) 측점성과.push({ ...g, 파일: f.이름 }) } catch (e) { /* 측점 꼴 아님 */ }
        }
      }
      /* DWG → DXF */
      const 바꾼 = [], 못 = []
      for (const f of 도면들) {
        const 머리 = String.fromCharCode(...new Uint8Array(f.buf.slice(0, 6)))
        if (/^AC10\d\d/.test(머리)) {
          set상태({ k: 'busy', 글: f.이름 + ' — DWG → DXF 바꾸는 중(큰 도면은 30초~1분)' })
          try { const { DWG바꾸기 } = await import('./lib/dwg바꾸기.js'); const r0 = await DWG바꾸기(f.buf, f.이름, (d) => set상태({ k: 'busy', 글: f.이름 + ' — DWG → DXF: ' + (d.msg || '') })); 바꾼.push({ 이름: f.이름.replace(/\.dwg$/i, '.dxf'), buf: r0.dxf }) }
          catch (e) { 못.push(f.이름) }
        } else 바꾼.push(f)
      }
      if (!바꾼.length) throw new Error('읽을 도면이 없습니다' + (못.length ? ' — DWG 를 바꾸지 못함: ' + 못.join(', ') : ''))
      set상태({ k: 'busy', 글: `도면 ${바꾼.length}장${성과 ? ' + 좌표 성과표' : ''} — 좌표로 읽는 중(큰 도면은 몇 분)` })
      const r = await 일꾼돌리기(바꾼, 성과)
      const 활0 = r.활용
      if (!활0 || !((활0.노선 || []).length || (활0.횡단 || []).length || (활0.구조 || []).length || 활0.땅 || (활0.흙막이 || []).length)) throw new Error('토목(노선 · 횡단 · 구조물 · 측량 땅)을 찾지 못했습니다 — ' + 못찾음글(r))
      const 이름 = 예시 ? '가상 배수로(예시)' : (바꾼[0].이름.replace(/\.dxf$/i, '') + (바꾼.length > 1 ? ` 외 ${바꾼.length - 1}장` : ''))
      const t = 토목자료(r, { 이름, 예시, 성과, 측점성과, 좌표글: r.좌표글 || [] })
      setT(t); set자리(null); set고른부재(null)
      set고른노선(t.활용.노선.length ? t.활용.노선[0].이름 : '')
      if (!예시) { set상태({ k: 'busy', 글: '이 브라우저에 저장하는 중(다음에 열어도 남게)' }); try { await 기억넣기(토목열쇠, t) } catch (e) { /* 저장 못 해도 화면은 그대로 */ } }
      set상태(못.length || (r.못읽은 || []).length ? { k: 'err', 글: '읽지 못한 도면: ' + [...못, ...(r.못읽은 || []).map((x) => x.이름)].join(', ') } : null)
      세기(예시 ? '|토목탭|예시' : '|토목탭|도면넣기')
    } catch (e) { set상태({ k: 'err', 글: (e && e.message) || String(e) }) }
  }
  const 파일넣기 = async (files) => {
    const list = [...(files || [])]
    const 도 = list.filter((f) => /\.(dxf|dwg)$/i.test(f.name)), 표 = list.filter((f) => /\.(xlsx?|csv|txt)$/i.test(f.name))
    if (!도.length) { set상태({ k: 'err', 글: 'DXF · DWG 도면을 넣어 주십시오(측량점 파일 엑셀 · CSV 는 도면과 같이).' }); return }
    const 한 = 파일한도(), 큰 = 도.filter((f) => f.size > 한)
    if (큰.length) { set상태({ k: 'err', 글: 큰.map((f) => f.name).join(', ') + ' — 이 기기에서 읽기에 너무 큰 도면입니다' }); return }
    const 읽 = async (f) => ({ 이름: f.name, buf: await f.arrayBuffer() })
    읽기(await Promise.all(도.map(읽)), await Promise.all(표.map(읽)))
  }
  const 예시열기 = async () => {
    set상태({ k: 'busy', 글: '가상 예시 도면 받는 중' })
    try {
      const 받 = async (n) => { const res = await fetch('/jeoksan/' + encodeURIComponent(n)); if (!res.ok) throw new Error(n + ' 받지 못함'); return { 이름: n, buf: await res.arrayBuffer() } }
      const 도 = await Promise.all(예시파일.map(받))
      const 표 = await Promise.all([받(예시성과)])
      await 읽기(도, 표, true)
    } catch (e) { set상태({ k: 'err', 글: (e && e.message) || String(e) }) }
  }
  const 비우기 = async () => {
    if (!window.confirm('토목 탭에 넣은 도면 결과를 이 브라우저에서 지울까요?')) return
    setT(null); set자리(null); set고른노선('')
    try { await 기억지우기(토목열쇠) } catch (e) { /* 없음 */ }
  }
  const 좌표계고르기 = async (k) => {
    if (!T) return
    const t = { ...T, 좌표계고름: k }
    setT(t)
    if (!t.예시) { try { await 기억넣기(토목열쇠, t) } catch (e) { /* 그대로 */ } }
    세기('|토목탭|좌표계')
  }

  /* ── 엑셀 · CSV ── */
  const [받는중, set받는중] = useState(false)
  const 파일이름 = (T && T.이름 ? T.이름 : '토목').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30)
  const 엑셀받기 = async () => {
    if (!T || !토) return
    set받는중(true)
    try {
      const { writeWorkbook, ST } = await import('./lib/qtoxlsx.js')
      const 시 = await import('./lib/토목시트.js')
      const 쓴 = new Set()
      const 표들 = 활.노선.map((L) => ({ 이름: L.이름, 줄: 측점표(활, L.이름, { 땅 }) }))
      const 경 = 가운데경위
      const sheets = [
        ...시.토목시트(토, ST),
        ...시.측점표시트(표들, ST, 쓴),
        ...(대조.length ? [시.대조시트(대조, ST)] : []),
        시.좌표계시트([
          ['좌표', 활.실좌표 ? '실제 측량 좌표(TM · m) — X = 북 · Y = 동' : '도면 좌표(측량 자료가 기준이 아님)'],
          ['좌표계(고름)', 계.이름], ['고른 까닭', T.좌표계.까닭],
          ['현장 가운데 경위도', 경 ? `위도 ${경.위도.toFixed(6)} · 경도 ${경.경도.toFixed(6)}` : '—'],
          ['좌표 성과표', T.성과 ? `${T.성과.파일} · ${T.성과.n}점` : '없음'],
          ['넣은 도면', (T.파일 || []).join(', ')],
          ['측점', '측점(NO) = 노선 간격(도면 측점 글자 사이) · STA = km+m · 지반고 · 계획고 = 종단 표 안에서만(표 밖은 비움) · 땅 면 EL = 측량점 삼각망'],
        ]),
      ]
      내려주기(new Blob([writeWorkbook(sheets)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), '토목_' + 파일이름 + '.xlsx')
      세기('|토목탭|엑셀')
    } catch (e) { set상태({ k: 'err', 글: '엑셀을 만들지 못했습니다 — ' + ((e && e.message) || e) }) } finally { set받는중(false) }
  }
  const CSV받기 = () => {
    if (!고른노선 || !표.length) return
    내려주기(new Blob(['﻿' + 측점표CSV(고른노선, 표)], { type: 'text/csv;charset=utf-8' }), '측점표_' + 고른노선.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30) + '.csv')
    세기('|토목탭|CSV')
  }

  const 바쁨 = !!(상태 && 상태.k === 'busy')
  return (
    <>
      <div className="gmd-ws-top tmk-top">
        {분야칸}
        <span className="gmd-ws-acts">
          <button type="button" className="btn sm gmd-ws-dwg tmk-dwg" onClick={() => 파일Ref.current && 파일Ref.current.click()} disabled={바쁨}>📐 토목 도면 넣기</button>
          <button type="button" className="btn line sm tmk-ex" onClick={예시열기} disabled={바쁨}>🧪 예시</button>
          <button type="button" className="btn line sm tmk-xlsx" onClick={엑셀받기} disabled={!T || 받는중 || 바쁨}>{받는중 ? '…' : '📊 엑셀'}</button>
          <button type="button" className="btn line sm" onClick={비우기} disabled={!T || 바쁨} title="이 브라우저에 저장한 토목 결과 지우기">🗑</button>
          <button type="button" className="btn line sm" onClick={전체화면} title="전체 화면">⛶</button>
          <button type="button" className="btn sm" onClick={나가기}>✕ 나가기</button>
        </span>
        <input ref={파일Ref} className="tmk-in" type="file" accept=".dxf,.dwg,.xlsx,.xls,.csv,.txt" multiple style={{ display: 'none' }} onChange={(e) => { 파일넣기(e.target.files); e.target.value = '' }} />
      </div>
      {상태 && <div className={'gmd-note gmd-ws-note tmk-state' + (상태.k === 'err' ? ' gmd-warnbox' : '')} role="status">{상태.k === 'busy' ? '⏳ ' : '⚠ '}{상태.글}{상태.k !== 'busy' && <button type="button" className="gmd-x" onClick={() => set상태(null)} aria-label="닫기">✕</button>}</div>}
      {T && T.예시 && <div className="gmd-note gmd-ws-note tmk-exnote">가상 예시(배수로 360 m · 배수장 · 측량점 · 측점 성과)입니다 — 실제 현장이 아닙니다. 평면을 누르면 그 자리의 X · Y · EL · STA 가 나옵니다.<button type="button" className="gmd-x" onClick={() => setT(null)} aria-label="닫기">✕</button></div>}
      {!T ? (
        <div className="gmd-ws-page">
          <div className="card tmk-empty">
            <h3 style={{ marginTop: 0 }}>🛣 토목 — 노선(STA) · 실제 좌표(TM X · Y) · 표고(EL)</h3>
            <p className="muted" style={{ lineHeight: 1.75 }}>도면을 한꺼번에 넣으면 측량 자료를 기준으로 실제 좌표에 맞추고, 노선마다 측점(STA) · 좌표 · 지반고 · 계획고 · 땅 면 EL 과 평균단면 토공 · 구조물 물량을 냅니다. 읽기는 BIM 물량 화면과 같습니다.</p>
            <ol className="tmk-need">
              <li><b>측량 자료</b> — GPS · 측량도면(높이 든 측량점) 또는 좌표 성과표(점 · X · Y · Z 엑셀 · CSV) <span className="muted">— 실제 좌표의 기준</span></li>
              <li><b>계획평면도 · 종평면도</b> — 측점 글자(NO.0 · 0+020)와 중심선 <span className="muted">— 노선 · STA</span></li>
              <li><b>종단면도 · 횡단면도</b> — 측점 · 지반고 · 계획고 표 · 단면 <span className="muted">— EL · 토공</span></li>
              <li><b>구조물 일반도</b>(있으면) · <b>측점 성과</b>(시공측량 — 위치 · 설계지반고 · 시공 지반고 엑셀, 있으면)</li>
            </ol>
            <div className="gmd-top">
              <button type="button" className="btn sm" onClick={() => 파일Ref.current && 파일Ref.current.click()} disabled={바쁨}>📐 토목 도면 넣기</button>
              <button type="button" className="btn line sm" onClick={예시열기} disabled={바쁨}>🧪 가상 예시로 해 보기</button>
            </div>
          </div>
        </div>
      ) : (
        <div className={'gmd-ws-body tmk-body view-' + 보기}>
          <aside className="gmd-ws-left tmk-left" aria-label="토목 길잡이 · 도면함">
            <div className="gmd-guide tmk-guide">
              <b>🧭 토목 길잡이</b>
              <ul className="tmk-steps">{길.map((x) => <li key={x.k} className={'tmk-step s-' + (x.상태 === '✓' ? 'ok' : x.상태 === '▶' ? 'now' : x.상태 === '⚠' ? 'need' : 'opt')}><span className="tmk-mark">{x.상태}</span><span><b>{x.이름}</b><small>{x.글}</small></span></li>)}</ul>
            </div>
            <도면함칸 함={함} T={T} />
          </aside>
          <section className="gmd-ws-center tmk-center">
            <div className="gmd-ws-views" role="group" aria-label="보기">
              {[['평면', '📐 평면'], ['3D', '🧊 3D'], ['나란히', '◫ 나란히']].map(([k, t]) => <button key={k} type="button" className={'btn line sm' + (보기 === k ? ' on' : '')} aria-pressed={보기 === k} onClick={() => { set보기(k); if (k !== '평면') 한번('|토목탭|3D') }}>{t}</button>)}
            </div>
            <div className="tmk-views">
              {보기 !== '3D' && <평면칸 T={T} 고른노선={고른노선} 자리={자리} 누름={(x, y) => { set자리({ x, y }); 한번('|토목탭|자리') }} 노선누름={(n) => { set고른노선(n); 한번('|토목탭|노선') }} />}
              {보기 !== '평면' && <삼디칸 T={T} 토={토} set고른부재={set고른부재} />}
            </div>
            {고른노선 && <측점표칸 이름={고른노선} 표={표} CSV받기={CSV받기} />}
          </section>
          <aside className="gmd-ws-right tmk-right" aria-label="좌표 · 노선 · 물량">
            <div className="tmk-card tmk-crs">
              <b>📍 좌표계</b>
              {활.실좌표 ? (
                <>
                  <select value={계.k} onChange={(e) => 좌표계고르기(e.target.value)} aria-label="좌표계">{좌표계들.map((c) => <option key={c.k} value={c.k}>{c.이름}</option>)}</select>
                  <small className="muted">{T.좌표계.까닭}</small>
                  {가운데경위 && <div className="tmk-ll">현장 가운데 위도 {가운데경위.위도.toFixed(5)}° · 경도 {가운데경위.경도.toFixed(5)}° <a href={지도주소(가운데경위.위도, 가운데경위.경도)} target="_blank" rel="noopener noreferrer">🗺 지도에서 보기</a></div>}
                </>
              ) : <small className="muted">{T.좌표계.까닭}</small>}
              {T.성과 && <small>좌표 성과표 {T.성과.파일} · {T.성과.n}점 = 기준</small>}
            </div>
            <자리칸 읽은={읽은자리} 계={계} 실좌표={!!활.실좌표} 노선고르기={(n) => set고른노선(n)} />
            {고른부재 && <div className="tmk-card tmk-pick3d"><b>🧊 {고른부재.이름}</b>{고른부재.크기 && <small>{고른부재.크기}</small>}{고른부재.몫 && <small>{Object.entries(고른부재.몫).filter(([, v]) => Number.isFinite(v) && v).map(([k, v]) => k + ' ' + 쉼(v, 2)).join(' · ')}</small>}</div>}
            <div className="tmk-card tmk-lines">
              <b>🛣 노선 {노선들.length}</b>
              {노선들.length ? (
                <ul>{노선들.map((n) => <li key={n.이름}><button type="button" className={'tmk-line' + (고른노선 === n.이름 ? ' on' : '')} onClick={() => { set고른노선(n.이름); 한번('|토목탭|노선') }}><b>{n.이름}</b><small>{n.시작.측글} ~ {n.끝.측글} · {STA글(n.범위[1]).replace('STA ', '')} · 연장 {쉼(n.연장, 1)} m · 간격 {n.간격} m · 단면 {n.단면수} · 종단 {n.종단줄 ? '✓' : '—'}{n.밖수 ? ` · 평면 노선 밖 ${n.밖수}곳(${STA글(n.끝측).replace('STA ', '')} 까지 늘림)` : ''}</small></button></li>)}</ul>
              ) : <small className="muted">노선이 없습니다 — 측점 글자 · 중심선이 있는 계획평면도를 넣어 주십시오</small>}
              {(T.겹노선 || []).map((x, i) => <small key={i} className="muted">ⓘ {x.이름}: {x.까닭}</small>)}
            </div>
            {대조.length > 0 && <대조칸 대조={대조} />}
            {토 && <토공칸 토={토} />}
          </aside>
        </div>
      )}
    </>
  )
}

/* ── 📚 도면함 ── */
function 도면함칸({ 함, T }) {
  const 쓴 = 함.filter((x) => ['기준', '맞춤', '그대로', '끼움'].includes(x.상태))
  const 높이 = 함.filter((x) => x.상태 === '높이만')
  const 옆 = 함.filter((x) => x.상태 === '옆' || x.상태 === '꺼둠')
  const 줄 = (x, i) => <li key={x.번 + '-' + i} className={'tmk-dw s-' + x.상태}><span className="tmk-kind">{x.종류}</span><span className="tmk-dwn" title={x.파일}>{x.이름}</span><small>{x.글}</small></li>
  return (
    <div className="tmk-box">
      <b>📚 도면함 — 넣은 도면 {(T.파일 || []).length}장</b>
      <small className="muted">좌표에 놓인 것 {쓴.length} · 높이(표)만 {높이.length} · 못 놓음 · 꺼 둠 {옆.length}</small>
      <ul className="tmk-dws">{쓴.map(줄)}</ul>
      {높이.length > 0 && <details><summary>종단 · 상세 · 표 {높이.length}</summary><ul className="tmk-dws">{높이.map(줄)}</ul></details>}
      {옆.length > 0 && <details><summary>못 놓음 · 꺼 둠 {옆.length}</summary><ul className="tmk-dws">{옆.map(줄)}</ul></details>}
      {(T.못읽은 || []).length > 0 && <small className="gmd-warn">읽지 못함: {T.못읽은.map((x) => x.이름).join(', ')}</small>}
    </div>
  )
}

/* ── 📍 고른 자리 ── */
function 자리칸({ 읽은, 계, 실좌표, 노선고르기 }) {
  if (!읽은) return <div className="tmk-card tmk-spot"><b>📍 고른 자리</b><small className="muted">평면을 누르면 그 자리의 X(북) · Y(동) · 땅 면 EL · 가까운 노선 STA · 지반고 · 계획고가 나옵니다.</small></div>
  const 경 = 실좌표 && 계.원 ? TM경위도(읽은.X, 읽은.Y, 계.원) : null
  return (
    <div className="tmk-card tmk-spot">
      <b>📍 고른 자리</b>
      <table className="tmk-kv"><tbody>
        <tr><th>X(북)</th><td>{쉼(읽은.X, 3)} m</td></tr>
        <tr><th>Y(동)</th><td>{쉼(읽은.Y, 3)} m</td></tr>
        <tr><th>땅 면 EL</th><td>{Number.isFinite(읽은.EL) ? 높글(읽은.EL) + ' m' : '— (측량점 밖)'}</td></tr>
        {경 && <tr><th>경위도</th><td>{경.위도.toFixed(6)}° · {경.경도.toFixed(6)}° <a href={지도주소(경.위도, 경.경도)} target="_blank" rel="noopener noreferrer">🗺</a></td></tr>}
      </tbody></table>
      {읽은.노선.length ? 읽은.노선.map((q) => (
        <div key={q.이름} className="tmk-near">
          <button type="button" className="gmd-link" onClick={() => 노선고르기(q.이름)}>{q.이름}</button>
          <span>{q.측글} · {q.STA}{q.밖 ? ' (노선 밖)' : ''}</span>
          <small>중심에서 {q.옆 >= 0 ? '오른쪽' : '왼쪽'} {쉼(Math.abs(q.옆), 2)} m · 지반고 {높글(q.지반고)} · 계획고 {높글(q.계획고)}</small>
        </div>
      )) : <small className="muted">60 m 안에 노선이 없습니다</small>}
    </div>
  )
}

/* ── 📍 측점표 ── */
function 측점표칸({ 이름, 표, CSV받기 }) {
  return (
    <div className="tmk-card tmk-sta">
      <div className="tmk-stahead"><b>📍 {이름} — 측점표 {표.length}</b><button type="button" className="btn line sm tmk-csv" onClick={CSV받기}>📍 측점표 CSV</button></div>
      <div className="tmk-tablewrap">
        <table className="tmk-table">
          <thead><tr><th>측점</th><th>STA</th><th>X(북)</th><th>Y(동)</th><th>지반고</th><th>계획고</th><th>땅 EL</th></tr></thead>
          <tbody>{표.map((r) => <tr key={r.측} className={(r.단면 ? 'cut' : '') + (r.밖 ? ' out' : '')} title={r.밖 ? '평면 노선 밖 — 노선 끝 방향으로 늘린 자리' : undefined}><td>{r.측글}</td><td>{r.STA.replace('STA ', '')}</td><td>{쉼(r.X, 3)}</td><td>{쉼(r.Y, 3)}</td><td>{높글(r.지반고)}</td><td>{높글(r.계획고)}</td><td>{높글(r.땅EL)}</td></tr>)}</tbody>
        </table>
      </div>
      <small className="muted">지반고 · 계획고 = 종단 표(표 밖은 —) · 땅 EL = 측량점 삼각망 · 굵은 줄 = 횡단 단면 있음 · 흐린 줄 = 평면 노선(측점 글자) 밖 — 노선 끝 방향으로 늘린 자리</small>
    </div>
  )
}

/* ── 📏 측점 성과 맞대기 ── */
function 대조칸({ 대조 }) {
  return (
    <div className="tmk-card tmk-cmp">
      <b>📏 측점 성과 ↔ 도면 종단</b>
      {대조.map((g, i) => (
        <details key={i} className={'tmk-cmpg' + (g.요약.맞음 < g.요약.맞댐 ? ' bad' : '')}>
          <summary>{g.노선글} → {g.노선 || '짝 노선 없음'} · 같음 {g.요약.맞음}/{g.요약.맞댐}{g.요약.부호만 ? ` · ⚠ 부호만 다름 ${g.요약.부호만}` : ''}{Number.isFinite(g.요약.시공최대) ? ` · 시공−설계 최대 ${g.요약.시공최대.toFixed(2)} m` : ''}</summary>
          <table className="tmk-table"><thead><tr><th>위치</th><th>도면</th><th>파일 설계</th><th>차</th><th>시공</th></tr></thead>
            <tbody>{g.줄.map((r, k) => <tr key={k} className={r.부호만 ? 'sign' : Number.isFinite(r.차) && Math.abs(r.차) > 0.005 ? 'diff' : ''}><td>{r.글}</td><td>{높글(r.도면)}</td><td>{높글(r.설계)}</td><td>{r.부호만 ? '부호' : Number.isFinite(r.차) ? r.차.toFixed(2) : '—'}</td><td>{높글(r.시공)}</td></tr>)}</tbody>
          </table>
        </details>
      ))}
      <small className="muted">파일의 설계지반고와 도면 종단 표 지반고를 같은 측점끼리 맞댐 — «부호만 다름» 은 값은 같은데 +/− 가 반대인 줄</small>
    </div>
  )
}

/* ── 📐 토공 · 구조물 합 ── */
function 토공칸({ 토 }) {
  const h = 토.합 || {}
  return (
    <div className="tmk-card tmk-sum">
      <b>📐 토공 · 구조물(평균단면 · 개략)</b>
      <table className="tmk-kv"><tbody>
        <tr><th>터파기</th><td>{쉼(h.터파기, 1)} ㎥</td></tr>
        <tr><th>되메우기</th><td>{쉼(h.되메우기, 1)} ㎥</td></tr>
        <tr><th>성토</th><td>{쉼(h.성토, 1)} ㎥</td></tr>
        <tr><th>콘크리트</th><td>{쉼(h.콘크리트, 2)} ㎥</td></tr>
        <tr><th>거푸집</th><td>{쉼(h.거푸집, 1)} ㎡</td></tr>
      </tbody></table>
      {(토.노선들 || []).length > 0 && <ul className="tmk-perline">{토.노선들.map((n, i) => <li key={i}><b>{n.이름}</b> <small>터파기 {쉼(n.합.터파기, 1)} · 되메우기 {쉼(n.합.되메우기, 1)} · 콘크리트 {쉼(n.합.콘크리트, 2)}</small></li>)}</ul>}
      {(토.경고 || []).slice(0, 3).map((w, i) => <small key={i} className="gmd-warn">⚠ {w}</small>)}
    </div>
  )
}

/* ── 📐 평면(캔버스) — 노선 · 측점 눈금 · 측량점 · 구조물 · 도면 선 · 누르면 자리 ── */
function 평면칸({ T, 고른노선, 자리, 누름, 노선누름 }) {
  const 판 = useRef(null), 틀Ref = useRef(null)
  const 뷰 = useRef(null)                      // { cx, cy (mm 일꾼 좌표), k (px/mm) }
  const 그림 = useRef(0)
  const 활 = T.활용
  const 맞추기 = (b) => {
    const cv = 판.current; if (!cv || !b) return
    const w = cv.clientWidth || 600, h = cv.clientHeight || 400
    const bw = Math.max(1000, b[2] - b[0]), bh = Math.max(1000, b[3] - b[1])
    뷰.current = { cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2, k: Math.min(w / bw, h / bh) * 0.9 }
  }
  const 노선틀 = (이름) => {
    const L = 활.노선.find((x) => x.이름 === 이름); if (!L) return null
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (let i = 0; i < L.줄.length; i += 5) { const x = L.줄[i + 1], y = L.줄[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    const m = Math.max(x1 - x0, y1 - y0) * 0.15 + 5000
    return [x0 - m, y0 - m, x1 + m, y1 + m]
  }
  const 다시 = () => { cancelAnimationFrame(그림.current); 그림.current = requestAnimationFrame(그리기) }
  const 그리기 = () => {
    const cv = 판.current; if (!cv) return
    const dpr = window.devicePixelRatio || 1
    const w = cv.clientWidth, h = cv.clientHeight
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    if (!뷰.current) 맞추기(T.틀)
    const v = 뷰.current
    const c = cv.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    const 어 = 어두움()
    c.fillStyle = 어 ? '#151a21' : '#f7f8fa'; c.fillRect(0, 0, w, h)
    const sx = (x) => w / 2 + (x - v.cx) * v.k, sy = (y) => h / 2 - (y - v.cy) * v.k
    /* 도면 선(바탕) — 원점 기준 Float32 */
    const B = T.바탕, ox = T.원점[0], oy = T.원점[1]
    if (B && B.length) {
      c.strokeStyle = 어 ? 'rgba(160,170,185,.28)' : 'rgba(80,90,105,.22)'; c.lineWidth = 1
      c.beginPath()
      for (let i = 0; i + 3 < B.length; i += 4) { const a = sx(B[i] + ox), b = sy(B[i + 1] + oy), d = sx(B[i + 2] + ox), e = sy(B[i + 3] + oy); if ((a < 0 && d < 0) || (a > w && d > w) || (b < 0 && e < 0) || (b > h && e > h)) continue; c.moveTo(a, b); c.lineTo(d, e) }
      c.stroke()
    }
    /* 측량점 */
    if (활.땅) {
      const P = 활.땅.점; c.fillStyle = 어 ? 'rgba(140,200,120,.55)' : 'rgba(70,140,60,.55)'
      const r = v.k * 1000 > 2 ? 1.6 : 1
      for (let i = 0; i + 2 < P.length; i += 3) { const a = sx(P[i]), b = sy(P[i + 1]); if (a < -2 || a > w + 2 || b < -2 || b > h + 2) continue; c.fillRect(a - r / 2, b - r / 2, r, r) }
    }
    /* 구조물 바닥 */
    c.strokeStyle = 어 ? '#5fd3c8' : '#0d9488'; c.lineWidth = 1.5
    for (const q of 활.구조 || []) {
      if (q.자리 === '옆') continue
      for (const r of q.바닥판 || []) { c.beginPath(); r.forEach(([x, y], i) => (i ? c.lineTo(sx(x), sy(y)) : c.moveTo(sx(x), sy(y)))); c.closePath(); c.stroke() }
    }
    /* 노선 · 측점 눈금 */
    c.font = '11px system-ui, sans-serif'
    for (const L of 활.노선) {
      const on = L.이름 === 고른노선
      c.strokeStyle = on ? '#f97316' : (어 ? '#60a5fa' : '#2563eb'); c.lineWidth = on ? 3 : 2
      c.beginPath()
      for (let i = 0; i < L.줄.length; i += 5) { const a = sx(L.줄[i + 1]), b = sy(L.줄[i + 2]); i ? c.lineTo(a, b) : c.moveTo(a, b) }
      c.stroke()
      const G = L.간격 || 20, 픽 = G * 1000 * v.k
      const 글간 = Math.max(1, Math.ceil(46 / Math.max(픽, 1e-6)))
      const [s0, s1] = L.범위
      let n = 0
      for (let s = Math.ceil((s0 - 1e-6) / G) * G; s <= s1 + 1e-6; s += G, n++) {
        const k = Math.round(s / G)
        const a = L.줄, m = Math.min(a.length / 5 - 1, Math.max(0, Math.round((s - a[0]) / Math.max(1e-9, (a[a.length - 5] - a[0])) * (a.length / 5 - 1))))
        const x = a[m * 5 + 1], y = a[m * 5 + 2], tx = a[m * 5 + 3], ty = a[m * 5 + 4]
        const X = sx(x), Y = sy(y)
        if (X < -20 || X > w + 20 || Y < -20 || Y > h + 20) continue
        const 길 = on ? 7 : 5
        c.beginPath(); c.moveTo(X + ty * 길, Y + tx * 길); c.lineTo(X - ty * 길, Y - tx * 길); c.stroke()
        if (픽 >= 3 && (k % 글간 === 0)) { c.fillStyle = on ? '#c2410c' : (어 ? '#cbd5e1' : '#334155'); c.fillText('NO.' + k, X + ty * 9 + 2, Y + tx * 9 + 4) }
      }
      const a = L.줄
      c.fillStyle = on ? '#c2410c' : (어 ? '#93c5fd' : '#1d4ed8')
      c.font = 'bold 12px system-ui, sans-serif'
      c.fillText(L.이름, sx(a[1]) + 6, sy(a[2]) - 8)
      c.font = '11px system-ui, sans-serif'
    }
    /* 좌표 성과점 */
    for (const p of 활.성과점 || []) {
      const x = 활.바꿈 ? p.N * 1000 : p.E * 1000, y = 활.바꿈 ? p.E * 1000 : p.N * 1000
      const X = sx(x), Y = sy(y)
      c.fillStyle = '#eab308'; c.beginPath(); c.moveTo(X, Y - 7); c.lineTo(X - 6, Y + 5); c.lineTo(X + 6, Y + 5); c.closePath(); c.fill()
      c.fillStyle = 어 ? '#fde68a' : '#854d0e'; c.fillText(p.이름, X + 8, Y + 4)
    }
    /* 고른 자리 */
    if (자리) {
      const X = sx(자리.x), Y = sy(자리.y)
      c.strokeStyle = '#ef4444'; c.lineWidth = 2
      c.beginPath(); c.moveTo(X - 10, Y); c.lineTo(X + 10, Y); c.moveTo(X, Y - 10); c.lineTo(X, Y + 10); c.stroke()
      c.beginPath(); c.arc(X, Y, 5, 0, Math.PI * 2); c.stroke()
    }
    /* 북 · 축척 */
    c.fillStyle = 어 ? '#e2e8f0' : '#0f172a'; c.font = 'bold 12px system-ui, sans-serif'; c.fillText('N ↑', w - 34, 18)
    const 자 = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000].find((m) => m * 1000 * v.k >= 60) || 5000
    c.fillRect(12, h - 14, 자 * 1000 * v.k, 3); c.font = '11px system-ui, sans-serif'; c.fillText(자 + ' m', 12, h - 20)
  }
  useEffect(() => { 뷰.current = null; 다시() }, [T])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (고른노선) { const b = 노선틀(고른노선); if (b) 맞추기(b) } 다시() }, [고른노선])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { 다시() }, [자리])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const cv = 판.current; if (!cv) return undefined
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => 다시()) : null
    if (ro) ro.observe(cv)
    const 손 = new Map()
    let 시작 = null, 움직 = 0, 핀 = null
    const 자리mm = (e) => { const r = cv.getBoundingClientRect(), v = 뷰.current; return { x: v.cx + (e.clientX - r.left - r.width / 2) / v.k, y: v.cy - (e.clientY - r.top - r.height / 2) / v.k } }
    const 아래 = (e) => { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); 손.set(e.pointerId, { x: e.clientX, y: e.clientY }); 시작 = { x: e.clientX, y: e.clientY }; 움직 = 0; if (손.size === 2) { const [a, b] = [...손.values()]; 핀 = { d: Math.hypot(a.x - b.x, a.y - b.y), k: 뷰.current.k } } }
    const 이동 = (e) => {
      if (!손.has(e.pointerId) || !뷰.current) return
      const 앞 = 손.get(e.pointerId); 손.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (손.size === 2 && 핀) { const [a, b] = [...손.values()]; 뷰.current.k = 핀.k * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, 핀.d); 움직 = 99; 다시(); return }
      const dx = e.clientX - 앞.x, dy = e.clientY - 앞.y
      움직 += Math.abs(dx) + Math.abs(dy)
      뷰.current.cx -= dx / 뷰.current.k; 뷰.current.cy += dy / 뷰.current.k
      다시()
    }
    const 위 = (e) => {
      const 하나 = 손.size === 1
      손.delete(e.pointerId); if (손.size < 2) 핀 = null
      if (하나 && 시작 && 움직 < 6 && 뷰.current) {
        const p = 자리mm(e)
        /* 노선 가까이(12 px)면 그 노선도 고름 */
        let 가 = null, 가d = 12 / 뷰.current.k
        for (const L of 활.노선) for (let i = 0; i < L.줄.length; i += 25) { const d = Math.hypot(L.줄[i + 1] - p.x, L.줄[i + 2] - p.y); if (d < 가d) { 가d = d; 가 = L.이름 } }
        누름(p.x, p.y)
        if (가) 노선누름(가)
      }
      시작 = null
    }
    const 바퀴 = (e) => {
      if (!뷰.current) return
      e.preventDefault()
      const r = cv.getBoundingClientRect(), v = 뷰.current
      const mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2
      const 전x = v.cx + mx / v.k, 전y = v.cy - my / v.k
      v.k *= Math.exp(-e.deltaY * 0.0015)
      v.cx = 전x - mx / v.k; v.cy = 전y + my / v.k
      다시()
    }
    cv.addEventListener('pointerdown', 아래); cv.addEventListener('pointermove', 이동); cv.addEventListener('pointerup', 위); cv.addEventListener('pointercancel', 위)
    cv.addEventListener('wheel', 바퀴, { passive: false })
    return () => { if (ro) ro.disconnect(); cv.removeEventListener('pointerdown', 아래); cv.removeEventListener('pointermove', 이동); cv.removeEventListener('pointerup', 위); cv.removeEventListener('pointercancel', 위); cv.removeEventListener('wheel', 바퀴); cancelAnimationFrame(그림.current) }
  }, [T, 고른노선, 자리])  // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tmk-plan" ref={틀Ref}>
      <canvas ref={판} className="tmk-canvas" aria-label="토목 평면 — 누르면 그 자리 좌표 · 끌면 옮김 · 바퀴 · 두 손가락으로 크게" />
      <div className="tmk-planbar">
        <button type="button" className="btn line sm" onClick={() => { 맞추기(T.틀); 다시() }}>⤢ 현장 전체</button>
        {고른노선 && <button type="button" className="btn line sm" onClick={() => { const b = 노선틀(고른노선); if (b) { 맞추기(b); 다시() } }}>🛣 고른 노선</button>}
      </div>
    </div>
  )
}

/* ── 🧊 3D ── */
function 삼디칸({ T, 토, set고른부재 }) {
  const 판 = useRef(null), 보기 = useRef(null)
  const [glErr, setGlErr] = useState('')
  const 바탕 = useMemo(() => {
    if (!T.바탕 || !T.바탕.length || !토) return null
    const a = T.바탕, o = 토.원점 || [0, 0], dx = T.원점[0] - o[0], dy = T.원점[1] - o[1]
    const 깔 = Number.isFinite(토.땅높이) ? 토.땅높이 : 0
    const f = new Float32Array(a.length / 4 * 6)
    for (let i = 0, j = 0; i + 3 < a.length; i += 4, j += 6) { f[j] = a[i] + dx; f[j + 1] = a[i + 1] + dy; f[j + 2] = 깔; f[j + 3] = a[i + 2] + dx; f[j + 4] = a[i + 3] + dy; f[j + 5] = 깔 }
    return f
  }, [T, 토])
  useEffect(() => {
    if (!판.current || !토) return
    if (!보기.current) {
      try { 보기.current = new 부재보기(판.current) } catch (e) { setGlErr('이 브라우저는 3D(WebGL)를 그리지 못합니다 — 평면 · 측점표 · 엑셀은 그대로 쓸 수 있습니다.'); return }
      if (어두움()) { const v0 = 보기.current; v0.bg = [0.086, 0.102, 0.129]; v0.bgT = [0.15, 0.17, 0.21]; v0.bgB = [0.06, 0.07, 0.09]; v0.선색 = [0.03, 0.04, 0.05]; v0.선알 = 0.6 }
    }
    const v = 보기.current
    v.set부재(토.부재.filter((o) => o.종류 !== '터파기' && o.종류 !== '성토').map((o) => ({ id: o.id, 면: o.면, 선: o.선, 색: o.색 || 토목색[o.종류], 비침: 토목비침[o.종류] || 0 })), { 바닥: false })
    v.set배경(바탕, 어두움() ? [0.62, 0.66, 0.72] : [0.36, 0.40, 0.46], 어두움() ? 0.18 : 0.16)
    v.fit('tilt')
    v.onPick = (id) => { const o = id >= 0 ? 토.부재.find((u) => u.id === id) : null; set고른부재(o ? { 이름: o.이름, 크기: o.크기, 몫: o.몫 } : null); v.set고름(o ? [o.id] : []) }
  }, [토, 바탕])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (보기.current) { 보기.current.dispose(); 보기.current = null } }, [])
  return (
    <div className="tmk-3d">
      {glErr ? <div className="gmd-note gmd-warnbox">{glErr}</div> : <canvas ref={판} className="tmk-canvas3d" aria-label="토목 3D — 배수로 · 구조물 · 땅" />}
      <div className="tmk-planbar"><button type="button" className="btn line sm" onClick={() => 보기.current && 보기.current.fit('tilt')}>⤢ 전체</button><button type="button" className="btn line sm" onClick={() => 보기.current && 보기.current.fit('top')}>⬒ 위에서</button></div>
    </div>
  )
}
