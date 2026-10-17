/**
 * /tools/cadfix — 🛠 캐드 버전 · 글꼴 고치기 (2026-10-17)
 *
 * 소장님: 「크몽보다 좋아야 해. 반드시, 대충만들지마」 · 「모든 도구는 사이트 내에서 사용가능하게」 · 「나만 할 수 있게. 단, 예시는 볼 수 있게..」
 *   크몽 «캐드 버전다운 · 폰트 오류 수정» 은 사람이 AutoCAD 로 열어 다시 저장해 줌(한 장 5천 ~ 2만 원 · 반나절).
 *   여기서는 이 브라우저 안에서 바로 — 진단(판 · 글꼴 · 한글 깨짐 · 외부 참조 · 못 옮기는 것)부터 보여 주고 고칩니다.
 *
 * ■ 무엇을
 *   ① 판 바꾸기 — 2018 · 2013 · 2010 · 2007 · 2004 · 2000 · R12 DXF 로 «깨끗하게 다시 쓰기»(lib/캐드다시쓰기.js · 틀 lib/dxf판틀.js)
 *   ② 글꼴 — 없는 글꼴(«?» · 다른 글꼴로 보임)을 맑은 고딕 · 굴림 · 바탕 · SHX(romans + whgtxt)로 · 이름 없는 TTF 채우기 · 글 안 글꼴
 *   ③ 한글 깨짐 — 코드페이지가 한글이 아닌 옛 판(ANSI_1252 …)을 CP949 로 다시 읽어 바로잡음
 *   ④ 모두 보존(글꼴만) — 짝을 하나도 안 버리고 글꼴 · 코드페이지만(배치 여러 장 · 사전까지 그대로 · 판은 그대로)
 * ■ DWG 는 lib/dwg바꾸기.js(LibreDWG) 로 먼저 DXF 로 바꾼 뒤 고칩니다. 내보내기는 DXF(모든 캐드가 엶) — 브라우저에서 DWG 로 쓰는 공개 엔진은 없음.
 * ■ 🔒 씀 = 소장님 브라우저(lib/운영자.js) · 열쇠말(lib/gate.js). 이용자는 🧪 예시 도면 두 장으로 진단 · 고치기 · 미리보기까지(받기는 잠김).
 * ■ 셈: 🧪 예시 본 수(|캐드고침|예시) · 잠긴 단추(|캐드고침|잠금) · 받기(|캐드고침|받기) · 열쇠 · 내 도면(|캐드고침|도면) — 소장님 · 로봇은 안 셈.
 * ■ 무거운 일은 일꾼(lib/캐드고침.worker.js)에서 — 30 MB 도면도 화면이 안 굳음.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isOpen, tryOpen } from '../lib/gate.js'
import { 나운영자 } from '../lib/운영자.js'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 판읽기 } from '../lib/dwgdxf.js'
import { 글꼴판, 판목록, 받을이름 } from '../lib/캐드고침.js'
import { 파일한도, 한도글 } from '../lib/파일한도.js'

const 큰파일 = 파일한도()
const 예시들 = {
  new: { 이름: '🏢 2018 판 · 없는 글꼴(가상 사무실)', 파일: '/tools/files/ex-cadfix-new.dxf', 설정: { 판: 'AC1015', 모두: '' } },
  broken: { 이름: '🈳 한글이 깨지는 옛 도면(가상)', 파일: '/tools/files/ex-cadfix-broken.dxf', 설정: { 판: '', 모두: '' } },
}
const 숨 = () => new Promise((r) => setTimeout(r, 30))
function 저장하기(이름, 바이트, 타입) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(바이트 instanceof Blob ? 바이트 : new Blob([바이트], { type: 타입 }))
  a.href = url; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
const 크기글 = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB')
const 급색 = { 높: 'cfx-hi', 중: 'cfx-mid', 낮: 'cfx-lo', 안내: 'cfx-info' }
const 글꼴고름 = [['', '그대로'], ...Object.entries(글꼴판).map(([k, v]) => [k, v.이름])]
let 번호 = 0
function 오류말(k, e) {
  if (k === 'bindxf') return '바이너리 DXF 는 아직 못 읽습니다 — 캐드에서 «ASCII DXF» 로 저장해 넣어 주십시오'
  if (k === 'notdxf' || k === 'notdwg') return 'DWG · DXF 도면이 아닌 것 같습니다'
  if (k === 'mem') return '이 기기의 메모리가 모자랍니다 — PC 의 크롬 · 엣지에서 해 주십시오'
  if (k === 'readmem' || k === 'fail') return '이 DWG 는 공개 엔진이 읽지 못했습니다 — 캐드에서 «다른 이름으로 저장 → DXF» 로 저장해 넣어 주십시오'
  if (k === 'timeout') return '4분 넘게 멈춰 있어 그만뒀습니다 — 이 도면만 다시 넣어 보십시오'
  return `읽지 못했습니다 — ${(e && e.message) || e}`
}

/* ── 일꾼 하나(차례로) */
let 일꾼 = null
const 기다림 = new Map()
function 일꾼에(메시지, 넘김) {
  if (!일꾼) {
    일꾼 = new Worker(new URL('../lib/캐드고침.worker.js', import.meta.url), { type: 'module' })
    일꾼.onmessage = (ev) => { const d = ev.data || {}; const w = 기다림.get(d.id); if (w) { 기다림.delete(d.id); d.type === 'err' ? w.no(Object.assign(new Error(d.msg || d.kind), { kind: d.kind })) : w.ok(d) } }
    일꾼.onerror = (e) => { for (const [, w] of 기다림) w.no(new Error(e.message || '일꾼 오류')); 기다림.clear(); 일꾼 = null }
  }
  return new Promise((ok, no) => { 기다림.set(메시지.id, { ok, no }); 일꾼.postMessage(메시지, 넘김 || []) })
}

/* ── 미리보기(고친 도면) */
function 미리보기({ 그림 }) {
  const 판 = useRef(null), 틀 = useRef(null)
  const [폭, set폭] = useState(700)
  const [글꼴, set글꼴] = useState(0)
  useEffect(() => { import('../lib/plotview.js').then((m) => m.loadFont()).then(() => set글꼴((x) => x + 1)).catch(() => {}) }, [])
  useEffect(() => {
    const f = () => { if (틀.current) set폭(Math.max(280, Math.min(900, 틀.current.clientWidth))) }
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f)
  }, [])
  useEffect(() => {
    if (!그림 || !판.current || !그림.box) return
    let 살 = true
    Promise.all([import('../lib/plotview.js'), import('../lib/plotstyle.js')]).then(([v, s]) => {
      if (!살) return
      try { v.drawPage(판.current, 그림, { r: 그림.box, paper: s.PAPER.A3 }, { color: 'color', lw: 'ctb', text: true }, 폭, new Map()) } catch (e) { /* 미리보기 실패는 받기와 무관 */ }
    })
    return () => { 살 = false }
  }, [그림, 폭, 글꼴])
  return <div ref={틀} className="cfx-view">{그림 && 그림.box ? <canvas ref={판} /> : <div className="muted">미리보기를 만들지 못했습니다(받는 파일과는 상관없음).</div>}</div>
}

export default function CadFix() {
  /* 🔒 씀 */
  const [씀, set씀] = useState(() => isOpen())
  const [잠금말, set잠금말] = useState('')
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (살 && v) set씀(true) }).catch(() => {})
    return () => { 살 = false }
  }, [])
  useEffect(() => { document.title = '캐드 버전 · 글꼴 고치기 — 옛 캐드에서 열리게 · 한글 «?» 고치기 | K-건설맵' }, [])
  const 잠김 = (무엇) => { set잠금말(`🔒 ${무엇} 지금 준비 중입니다 — 🧪 예시 도면으로 진단 · 고치기 · 미리보기를 해 보실 수 있습니다.`); 세기('|캐드고침|잠금') }

  /* 파일 목록 */
  const [목록, set목록] = useState([])     // { id, 이름, 크기, 상태: '읽는중'|'진단'|'고치는중'|'끝'|'실패', msg, 진, 결과, 오류, 예시, 글꼴별 }
  const 목록Ref = useRef([])
  const 바꿈 = (id, 더) => { 목록Ref.current = 목록Ref.current.map((x) => (x.id === id ? { ...x, ...더 } : x)); set목록(목록Ref.current) }
  const [고른, set고른] = useState(null)
  const 파일칸 = useRef(null)
  const [오류, set오류] = useState('')

  /* 설정(모든 파일 같이) */
  const [설정, set설정] = useState({ 방식: '다시', 판: '', 모두: '', 글안: '그대로', 한글: '자동' })
  const 설 = (k, v) => set설정((s) => ({ ...s, [k]: v }))

  const 넣기 = async (bufs, 예시 = null) => {
    set오류('')
    const 새것 = bufs.map(({ 이름, buf, 크기 }) => ({ id: ++번호, 이름, 크기, 상태: '읽는중', msg: '여는 중', 예시, 글꼴별: {}, _buf: buf }))
    목록Ref.current = 예시 ? 새것 : [...목록Ref.current.filter((x) => !x.예시), ...새것]
    set목록(목록Ref.current)
    if (새것[0]) set고른(새것[0].id)
    for (const x of 새것) {
      try {
        let buf = x._buf
        const 머리 = 판읽기(new Uint8Array(buf.slice(0, 6)))
        if (머리.dwg) {
          바꿈(x.id, { msg: `DWG(${머리.판} 판) → DXF 바꾸는 중` })
          const { DWG바꾸기 } = await import('../lib/dwg바꾸기.js')
          const r = await DWG바꾸기(buf, x.이름, (m) => 바꿈(x.id, { msg: m.msg }))
          buf = r.dxf
        }
        바꿈(x.id, { msg: '진단 중' })
        const d = await 일꾼에({ type: '읽기', id: x.id, buf }, [buf])
        /* 문제 있는 글꼴은 바꿀 글꼴을 미리 골라 둠(권함) — 2026-10-17 AutoCAD 2023 시험: 없는 글꼴 · 이름 없는 TTF · 큰글꼴 없는 SHX 는 한글이 «???» */
        const 권함 = {}
        for (const f of d.진.글꼴) if (f.권함) 권함[f.키] = f.권함
        바꿈(x.id, { 상태: '진단', 진: d.진, msg: '', dwg: 머리.dwg ? 머리.판 : '', 글꼴별: 권함, _buf: null })
      } catch (e) {
        const k = e && e.kind
        바꿈(x.id, { 상태: '실패', 오류: 오류말(k, e) })
      }
    }
  }
  const 파일받기 = async (files) => {
    const fs = [...(files || [])]
    if (!fs.length) return
    if (!씀) { 잠김('내 도면 넣기는'); return }
    const 큰 = fs.find((f) => f.size > 큰파일)
    if (큰) { set오류(한도글()); return }
    세기('|캐드고침|도면')
    await 넣기(await Promise.all(fs.map(async (f) => ({ 이름: f.name, 크기: f.size, buf: await f.arrayBuffer() }))))
  }
  const 예시열기 = async (키) => {
    const x = 예시들[키]
    set잠금말('')
    if (!씀) 세기('|캐드고침|예시')
    try {
      const r = await fetch(x.파일)
      if (!r.ok) throw new Error('예시 도면을 받지 못했습니다')
      const buf = await r.arrayBuffer()
      set설정((s) => ({ ...s, ...x.설정, 방식: '다시', 글안: '그대로', 한글: '자동' }))
      await 넣기([{ 이름: x.파일.split('/').pop(), 크기: buf.byteLength, buf }], 키)
    } catch (e) { set오류(e.message || String(e)) }
  }

  /* 고치기 — 차례로 */
  const [도는중, set도는중] = useState(false)
  const 고치기 = async (ids) => {
    if (도는중) return
    set도는중(true)
    try {
      for (const id of ids) {
        const x = 목록Ref.current.find((y) => y.id === id)
        if (!x || !x.진) continue
        바꿈(id, { 상태: '고치는중', msg: '고치는 중' }); await 숨()
        try {
          const d = await 일꾼에({ type: '고치기', id, 설정: { ...설정, 글꼴: x.글꼴별 }, 미리: id === 고른 || ids.length === 1 })
          바꿈(id, { 상태: '끝', msg: '', 결과: { buf: d.buf, 판: d.판, 판이름: d.판이름, 알림: d.알림, 셈: d.셈, 그림: d.그림, 설정: { ...설정 } } })
        } catch (e) { 바꿈(id, { 상태: '실패', 오류: e.kind === 'gone' ? '넣은 파일이 너무 많아 이 파일을 비웠습니다 — 다시 넣어 주십시오' : `고치지 못했습니다 — ${e.message || e}` }) }
      }
    } finally { set도는중(false) }
  }
  /* 설정이 바뀌면 결과는 다시 */
  useEffect(() => { 목록Ref.current = 목록Ref.current.map((x) => (x.상태 === '끝' ? { ...x, 상태: '진단', 결과: null } : x)); set목록(목록Ref.current) }, [설정])

  const 받기 = async (x) => {
    if (!씀) { 잠김('고친 도면 받기는'); return }
    if (!x.결과) return
    저장하기(받을이름(x.이름, x.결과.판이름, x.결과.설정.방식), x.결과.buf, 'application/dxf')
    세기('|캐드고침|받기')
  }
  const 모두받기 = async () => {
    if (!씀) { 잠김('고친 도면 받기는'); return }
    const 된것 = 목록.filter((x) => x.결과)
    if (!된것.length) return
    if (된것.length === 1) { 받기(된것[0]); return }
    const { zipSync } = await import('fflate')
    const 묶음 = {}
    for (const x of 된것) {
      let n = 받을이름(x.이름, x.결과.판이름, x.결과.설정.방식), i = 2
      while (묶음[n]) n = n.replace(/\.dxf$/i, `(${i++}).dxf`)
      묶음[n] = [new Uint8Array(x.결과.buf), { level: 6 }]
    }
    저장하기(`캐드고침_${된것.length}장.zip`, zipSync(묶음), 'application/zip')
    세기('|캐드고침|받기')
  }
  const 빼기 = (id) => { 목록Ref.current = 목록Ref.current.filter((x) => x.id !== id); set목록(목록Ref.current); 일꾼에({ type: '버림', id }).catch(() => {}); if (고른 === id) set고른(null) }

  const 지금 = 목록.find((x) => x.id === 고른) || 목록[0] || null
  const 진 = 지금 && 지금.진
  const 쓴글꼴 = useMemo(() => (진 ? 진.글꼴.filter((f) => f.글수 > 0 || f.이상.length === 0).sort((a, b) => b.글수 - a.글수) : []), [진])
  const 안쓴글꼴 = 진 ? 진.글꼴.filter((f) => !쓴글꼴.includes(f)) : []
  const 판바꿈 = 설정.판 && 진 && 설정.판 !== 진.판
  const 보존막힘 = 설정.방식 === '그대로' && 판바꿈
  const 예시중 = !!(지금 && 지금.예시)
  const 진단끝 = 목록.filter((x) => x.진).length

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🛠 캐드 버전 · 글꼴 고치기</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          «도면이 안 열려요» · «글자가 <b>?</b> 로 나와요» · «한글이 깨져요» — 도면(<b>DWG · DXF</b>)을 넣으면 먼저 <b>무엇이 문제인지 진단</b>하고,
          <b> 옛 캐드에서 열리는 판(2018 ~ R12)</b>으로 다시 쓰고 · 없는 글꼴을 <b>맑은 고딕 · 굴림 · SHX</b> 로 바꾸고 · 깨진 한글을 바로잡습니다. 여러 장을 한 번에 해도 됩니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          받는 꼴은 <b>DXF</b>(AutoCAD · 캐디안 · 지스타캐드 · ZWCAD 모두 엶) — DWG 가 필요하면 캐드에서 열어 «다른 이름으로 저장» 하시면 됩니다.
          도면은 이 브라우저 안에서만 읽습니다 — 어디에도 올라가지 않습니다.
        </p>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 지금은 준비 중입니다</b> — 내 도면 넣기 · 받기는 곧 엽니다. 지금은 🧪 예시 도면 두 장으로 진단 · 고치기 · 미리보기를 해 보실 수 있습니다.
            {' '}<예시본수 열쇠="|캐드고침|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set잠금말(''); 세기('|캐드고침|열쇠') }
              }}>
                <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
                <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
              </form>
              {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
            </details>
          </div>
        )}
        <div className="cpl-open">
          {Object.entries(예시들).map(([키, x]) => (
            <button key={키} type="button" className={'btn line sm' + (지금 && 지금.예시 === 키 ? ' on' : '')} style={{ width: 'auto' }} onClick={() => 예시열기(키)}>🧪 {x.이름}</button>
          ))}
          <button type="button" className={'btn sm' + (씀 ? '' : ' sg-lockbtn')} style={{ width: 'auto' }} onClick={() => (씀 ? 파일칸.current && 파일칸.current.click() : 잠김('내 도면 넣기는'))}>
            {씀 ? '📂 내 도면 넣기 (DWG · DXF · 여러 장)' : '🔒 내 도면 넣기'}
          </button>
          <input ref={파일칸} type="file" multiple accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1} onChange={(e) => { 파일받기(e.target.files); e.target.value = '' }} />
        </div>
        {씀 && <끌어놓기판 글="도면(DWG · DXF)을 놓으면 진단합니다 — 여러 장도 됩니다" 여럿 받기={(fs) => 파일받기(fs)} />}
        {잠금말 && <div className="cwarn" style={{ marginTop: 8 }}>{잠금말}</div>}
        {오류 && <div className="cwarn" style={{ marginTop: 8 }}>{오류}</div>}
      </div>

      {목록.length > 0 && (
        <div className="card">
          <h2 className="cfx-h2">📋 넣은 도면 {목록.length}장</h2>
          <div className="cfx-files">
            {목록.map((x) => (
              <div key={x.id} className={'cfx-file' + (지금 && 지금.id === x.id ? ' on' : '')} role="button" tabIndex={0} onClick={() => set고른(x.id)} onKeyDown={(e) => { if (e.key === 'Enter') set고른(x.id) }}>
                <div className="cfx-fn">{x.이름}</div>
                <div className="cfx-fm">
                  {크기글(x.크기)}{x.dwg ? ` · DWG ${x.dwg}` : ''}{x.진 ? ` · ${x.진.판이름} 판` : ''}
                  {x.진 && x.진.문제.filter((p) => p.급 === '높' || p.급 === '중').length > 0 && <span className="cfx-badge cfx-mid">문제 {x.진.문제.filter((p) => p.급 === '높' || p.급 === '중').length}</span>}
                  {x.상태 === '끝' && <span className="cfx-badge cfx-ok">✓ {x.결과.판이름}</span>}
                </div>
                {(x.상태 === '읽는중' || x.상태 === '고치는중') && <div className="muted cfx-fm">⏳ {x.msg}</div>}
                {x.상태 === '실패' && x.오류 && <div className="cwarn cfx-fm">{x.오류}</div>}
                {!x.예시 && x.상태 !== '읽는중' && x.상태 !== '고치는중' && <button type="button" className="cfx-x" aria-label="빼기" onClick={(e) => { e.stopPropagation(); 빼기(x.id) }}>✕</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {진 && (
        <div className="card">
          <h2 className="cfx-h2">🩺 진단 — {지금.이름}</h2>
          <div className="cfx-facts">
            <div><span>판</span><b>{진.판이름}</b></div>
            <div><span>한글</span><b>{진.깨짐 && 진.깨짐.의심 ? '깨짐 의심' : 진.인코딩 === 'utf-8' ? 'UTF-8' : 진.코드페이지 || '—'}</b></div>
            <div><span>도형</span><b>{Object.values(진.도형수).reduce((s, n) => s + n, 0).toLocaleString('ko-KR')}</b></div>
            <div><span>블록</span><b>{진.블록수.toLocaleString('ko-KR')}</b></div>
            <div><span>층</span><b>{진.층.수}</b></div>
            <div><span>글꼴</span><b>{진.글꼴.length}</b></div>
          </div>
          {진.문제.length ? (
            <ul className="cfx-probs">
              {진.문제.map((p, i) => <li key={i} className={급색[p.급]}><b>{p.급 === '높' ? '꼭 고칠 것' : p.급 === '중' ? '고치면 좋음' : '알아 둘 것'}</b> {p.글}</li>)}
            </ul>
          ) : <div className="cfx-good">✓ 눈에 띄는 문제가 없습니다 — 판만 바꾸시려면 아래에서 고르십시오.</div>}

          <h3 className="cfx-h3">🔤 글꼴 ({쓴글꼴.length}{안쓴글꼴.length ? ` · 안 쓰는 것 ${안쓴글꼴.length}` : ''})</h3>
          {진.글꼴.some((f) => f.권함) && <div className="muted" style={{ fontSize: 13, margin: '0 0 6px' }}>✓ 다른 PC 에서 «?» 로 보일 글꼴 {진.글꼴.filter((f) => f.권함).length}개는 바꿀 글꼴을 골라 두었습니다(같은 글꼴이 윈도우에 있으면 그 글꼴 · 없으면 맑은 고딕 · SHX 는 romans + whgtxt). 그대로 두시려면 «그대로» 를 고르십시오.</div>}
          <div className="cfx-fonts">
            <div className="cfx-fh"><span>글꼴 이름(스타일)</span><span>지금 글꼴 파일</span><span>쓰는 글</span><span>이 글꼴만 바꾸기</span></div>
            {[...쓴글꼴, ...안쓴글꼴].map((f) => (
              <div key={f.이름} className={'cfx-fr' + (f.글수 ? '' : ' cfx-unused')}>
                <span className="cfx-fname">{f.이름 || '(이름 없음)'}</span>
                <span className={f.이상.length ? 'cfx-bad' : 'cfx-okt'}>{f.파일 || '(비어 있음)'}{f.큰 ? ` + ${f.큰}` : ''}{f.이상.length ? ` — ${f.이상.join(' · ')}` : ' ✓'}</span>
                <span>{f.글수.toLocaleString('ko-KR')}</span>
                <select value={(지금.글꼴별 || {})[f.키] ?? ''} onChange={(e) => 바꿈(지금.id, { 글꼴별: { ...지금.글꼴별, [f.키]: e.target.value }, 상태: 지금.상태 === '끝' ? '진단' : 지금.상태, 결과: 지금.상태 === '끝' ? null : 지금.결과 })} aria-label={`${f.이름} 글꼴`}>
                  <option value="">모두 바꾸기 따름</option>
                  <option value="그대로">그대로</option>
                  {글꼴고름.filter(([k]) => k).map(([k, n]) => <option key={k} value={k}>{n}{f.권함 === k ? ' ✓ 권함' : ''}</option>)}
                </select>
              </div>
            ))}
          </div>
          {진.글안글꼴.length > 0 && <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>글 안에 박힌 글꼴: {진.글안글꼴.map((x) => `${x.이름}(${x.수})`).join(' · ')}</div>}
        </div>
      )}

      {진단끝 > 0 && (
        <div className="card">
          <h2 className="cfx-h2">⚙️ 어떻게 고칠까요{진단끝 > 1 ? ` — ${진단끝}장 모두 같이` : ''}</h2>
          <Row2 이름="판(버전)">
            <select value={설정.판} onChange={(e) => 설('판', e.target.value)}>
              <option value="">원래 판 그대로{진 ? ` (${진.판이름})` : ''}</option>
              {판목록.map((x) => <option key={x.판} value={x.판}>{x.이름} — {x.설명}</option>)}
            </select>
          </Row2>
          <Row2 이름="글꼴 모두 바꾸기">
            <select value={설정.모두} onChange={(e) => 설('모두', e.target.value)}>
              {글꼴고름.map(([k, n]) => <option key={k} value={k}>{k ? n : '바꾸지 않음(없는 TTF 이름만 채움)'}</option>)}
            </select>
          </Row2>
          <Row2 이름="글 안에 박힌 글꼴">
            <select value={설정.글안} onChange={(e) => 설('글안', e.target.value)}>
              <option value="그대로">그대로</option>
              <option value="바꿈">맑은 고딕으로 바꿈</option>
              <option value="지움">지움(스타일 글꼴을 따름)</option>
            </select>
          </Row2>
          <Row2 이름="한글 깨짐">
            <select value={설정.한글} onChange={(e) => 설('한글', e.target.value)}>
              <option value="자동">깨짐이 보이면 고침(자동)</option>
              <option value="949">언제나 한글(CP949)로 다시 읽음</option>
              <option value="그대로">그대로</option>
            </select>
          </Row2>
          <Row2 이름="방식">
            <div className="cfx-radio">
              <label><input type="radio" checked={설정.방식 === '다시'} onChange={() => 설('방식', '다시')} /> <b>깨끗하게 다시 쓰기</b> — 판을 바꿀 수 있음 · 다른 프로그램 찌꺼기 없이(지금 배치 하나 · 블록 · 치수 · 해치 · 잘라 보이기 그대로)</label>
              <label><input type="radio" checked={설정.방식 === '그대로'} onChange={() => 설('방식', '그대로')} /> <b>모두 보존(글꼴만)</b> — 아무것도 버리지 않고 글꼴 · 한글만(배치 여러 장 · 그림 · OLE 까지 · 판은 그대로)</label>
            </div>
          </Row2>
          {보존막힘 && <div className="cwarn">«모두 보존» 은 판을 바꾸지 않습니다 — 판을 바꾸시려면 «깨끗하게 다시 쓰기» 를 고르십시오.</div>}
          {설정.판 === 'AC1009' && <div className="muted" style={{ fontSize: 13 }}>R12 는 가벼운 폴리선 · 여러 줄 글 · 해치 · 타원 · 스플라인이 없던 판입니다 — 모양이 같게 바꿔 씁니다(해치는 선 · 채움 블록, 치수는 모양 블록). 굴림 · 돋움 · 바탕 · 궁서(묶음 글꼴)와 흔치 않은 TTF 는 R12 가 못 읽어 맑은 고딕으로 씁니다.</div>}
          <div className="cfx-go">
            <button type="button" className="btn" style={{ width: 'auto' }} disabled={도는중 || 보존막힘} onClick={() => 고치기(목록.filter((x) => x.진).map((x) => x.id))}>
              {도는중 ? '⏳ 고치는 중…' : `🛠 고치기${진단끝 > 1 ? ` (${진단끝}장)` : ''}`}
            </button>
            {목록.some((x) => x.결과) && (
              <button type="button" className={'btn line' + (씀 ? '' : ' sg-lockbtn')} style={{ width: 'auto' }} onClick={모두받기}>
                {씀 ? `⬇ 받기${목록.filter((x) => x.결과).length > 1 ? ` (ZIP ${목록.filter((x) => x.결과).length}장)` : ' (DXF)'}` : '🔒 받기'}
              </button>
            )}
          </div>
        </div>
      )}

      {지금 && 지금.결과 && (
        <div className="card">
          <h2 className="cfx-h2">✅ 고친 도면 — {받을이름(지금.이름, 지금.결과.판이름, 지금.결과.설정.방식)}</h2>
          <div className="cfx-facts">
            <div><span>판</span><b>{진.판이름} → {지금.결과.판이름}</b></div>
            <div><span>크기</span><b>{크기글(지금.결과.buf.byteLength)}</b></div>
            {지금.결과.셈 && 지금.결과.셈.모델 !== undefined && <div><span>모델 도형</span><b>{지금.결과.셈.모델.toLocaleString('ko-KR')}</b></div>}
            {지금.결과.셈 && 지금.결과.셈.블록 !== undefined && <div><span>블록</span><b>{지금.결과.셈.블록.toLocaleString('ko-KR')}</b></div>}
            {지금.결과.셈 && 지금.결과.셈.종이 ? <div><span>배치 도형</span><b>{지금.결과.셈.종이}</b></div> : null}
          </div>
          {지금.결과.알림.length > 0 && (
            <ul className="cfx-probs">
              {지금.결과.알림.map((a, i) => <li key={i} className={급색[a.급] || 'cfx-info'}>{a.글}</li>)}
            </ul>
          )}
          {지금.결과.그림 ? <미리보기 그림={지금.결과.그림} /> : <div className="muted">이 도면을 고르고 «고치기» 를 누르면 미리보기가 나옵니다.</div>}
          <div className="cfx-go">
            <button type="button" className={'btn' + (씀 ? '' : ' sg-lockbtn')} style={{ width: 'auto' }} onClick={() => 받기(지금)}>{씀 ? '⬇ 이 도면 받기 (DXF)' : '🔒 받기'}</button>
            {예시중 && !씀 && <span className="muted" style={{ fontSize: 13 }}>🧪 예시는 미리보기까지 — 받기는 곧 엽니다.</span>}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="cfx-h2">❓ 언제 쓰나요</h2>
        <ul className="cfx-help">
          <li><b>«이 파일은 새 버전으로 만들어져 열 수 없습니다»</b> — 협력업체 · 발주처의 캐드가 옛 판일 때 → 판을 2007 · 2004 · 2000 으로.</li>
          <li><b>글자가 «?» · □ 로 나옴</b> — 만든 PC 에만 있는 글꼴(윤고딕 · HY 글꼴 · 이름 없는 TTF) → 맑은 고딕(윈도우에 늘 있음) 또는 SHX 로.</li>
          <li><b>한글이 «ÇÑ±Û» 처럼 깨짐</b> — 옛 판 도면의 코드페이지가 한글이 아님 → 한글(CP949)로 다시 읽어 바로잡음.</li>
          <li><b>CNC · 레이저 · 측량 · 옛 프로그램</b> — R12 DXF 만 읽는 곳 → R12(해치 · 여러 줄 글도 모양 그대로 선 · 글로).</li>
        </ul>
        <p className="muted" style={{ fontSize: 13, margin: '6px 0 0' }}>
          DWG 는 공개 엔진(LibreDWG)으로 먼저 DXF 로 바꿉니다 — 바꾸기만 하실 때는 <Link to="/tools/dwgdxf">DWG → DXF 바꾸기</Link>,
          PDF 로 뽑으실 때는 <Link to="/tools/dxfpdf">도면 PDF 만들기</Link>.
        </p>
      </div>
    </>
  )
}

function Row2({ 이름, children }) {
  return (
    <div className="cfx-row">
      <div className="cfx-rl">{이름}</div>
      <div className="cfx-rv">{children}</div>
    </div>
  )
}
