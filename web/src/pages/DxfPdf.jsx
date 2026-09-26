/**
 * /tools/dxfpdf — 📄 도면 PDF 만들기 · DXF → PDF (2026-09-26)
 *
 * 소장님: 「캐드 파일 dwg 이것을 pdf로 변환해주는 프로그램 만들기 … 도구 만들어서 사이트에 게시해야 하니까」
 *         「캐드 도면 dxf로 주면 가능하지 않아? pdf로」 · 「dxf로 올리면 돼지...이렇게 프로그램 만들어 줘」
 *
 * ■ 도면(.dxf)을 «이 브라우저 안에서만» 읽어 PDF 로 찍습니다. 서버 없음 → 파일이 어디로도 안 갑니다.
 * ■ 도곽(√2 비율의 큰 네모)을 스스로 찾아 «도곽마다 한 장» 으로 찍습니다. 못 찾으면 전체 한 장 · 직접 잡기.
 * ■ 흑백(색마다 굵기 — CTB 처럼) / 컬러 · 선 종류(점선) · 해치 무늬 · 글자(KCM Gothic = 나눔고딕 서브셋) · XCLIP
 * ■ 읽기·그리기: lib/dxfplot.js → (미리보기) lib/plotview.js · (PDF) lib/plotpdf.js — 일꾼 lib/dxfpdf.worker.js
 * ■ DWG 는 아직 못 읽습니다 — 캐드에서 DXF 로 저장해 올리시라고 안내합니다 (2단계에서 DWG 읽기를 붙일 자리).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { drawPage, drawThumb, loadFont } from '../lib/plotview.js'
import { PAPER, pageGeom } from '../lib/plotstyle.js'

/* 🧪 예시 — 제가 그린 «가상의 사무소 건물» 도곽 2장(A3 · 1:100): 평면도(통심선 점선·벽 해치·치수·문)와
   벽체 단면 상세(흙·잡석·콘크리트 해치·단열재 굵은 선). 남의 도면이 아닙니다 — 만든 스크립트는 CLAUDE.md 참고 */
const 예시 = { 파일: 'ex-drawing-pdf.dxf', 글: '가상 사무소 건물 — 평면도 + 벽체 단면 상세 (A3 도곽 2장) — 흑백으로 찍어 봅니다' }
const 큰파일 = 250 * 1024 * 1024
const 쉼 = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0))
const MB = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB')

function 오류글(k, more) {
  if (k === 'dwg') return <>DWG 는 아직 바로 못 읽습니다. 캐드에서 <b>「다른 이름으로 저장」 → 파일 형식 「DXF」</b>로 저장해 올려 주십시오 (어느 판이든 됩니다).
    캐드가 없으시면 무료 변환 프로그램(예: ODA File Converter)으로 DXF 로 바꿀 수 있습니다.</>
  if (k === 'bindxf') return <>바이너리 DXF 입니다. 캐드에서 DXF 로 저장할 때 <b>「ASCII」</b> 형식을 골라 주십시오.</>
  if (k === 'notdxf') return <>DXF 도면 파일이 아닌 것 같습니다. 캐드에서 DXF 로 저장한 파일을 올려 주십시오.</>
  if (k === 'empty') return <>도면에 찍을 것이 없습니다 — 모델 공간이 비어 있거나 모든 레이어가 꺼져(얼려져) 있습니다. 배치(종이 공간)에만 그린 도면은 아직 못 찍습니다.</>
  if (k === 'big') return <>파일이 너무 큽니다(250MB 까지). 캐드에서 필요 없는 레이어·외부참조를 지우고 다시 저장해 주십시오.</>
  if (k === 'pdffail') return <>PDF 를 만들지 못했습니다{more ? ` (${more})` : ''}. 장 수를 줄이거나 «글자 넣기» 를 끄고 다시 해 보십시오.</>
  return <>도면을 읽지 못했습니다{more ? ` (${more})` : ''}. 캐드에서 DXF(ASCII)로 다시 저장해 보십시오.</>
}

export default function DxfPdf() {
  const workRef = useRef(null)
  const 파일칸 = useRef(null)
  const cvRef = useRef(null)
  const boxRef = useRef(null)
  const cacheRef = useRef([])
  const [끌림, set끌림] = useState(false)
  const [상태, set상태] = useState({ k: 'idle' })
  const [모델, set모델] = useState(null)
  const [파일이름, set파일이름] = useState('')
  const [예시글, set예시글] = useState('')
  const [범위, set범위] = useState('frames')          // frames | all | mine
  const [고른, set고른] = useState([])                // 도곽 번호 → 넣음
  const [종이, set종이] = useState('A3')
  const [색, set색] = useState('mono')
  const [굵기, set굵기] = useState('ctb')
  const [글자, set글자] = useState(true)
  const [보는장, set보는장] = useState(0)
  const [내범위, set내범위] = useState([])
  const [끄는중, set끄는중] = useState(null)          // 직접 잡기: {x0,y0,x1,y1} (화면 px) — 그리기용
  const 끌기 = useRef(null)                             // 같은 값(마우스 떼는 순간 최신값이 필요해서 ref)
  const [폭, set폭] = useState(800)
  const [글꼴, set글꼴] = useState(false)
  const [결과, set결과] = useState(null)              // {url, size, name, pages}

  useEffect(() => () => { if (workRef.current) workRef.current.terminate() }, [])
  useEffect(() => { loadFont().then(set글꼴) }, [])
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const f = () => set폭(Math.max(260, Math.min(1100, el.clientWidth - (el.clientWidth < 616 ? 16 : 28))))
    f()
    const ro = new ResizeObserver(f)
    ro.observe(el)
    return () => ro.disconnect()
  }, [모델])
  useEffect(() => () => { if (결과 && 결과.url) URL.revokeObjectURL(결과.url) }, [결과])

  const opt = useMemo(() => ({ color: 색, lw: 굵기, text: 글자 }), [색, 굵기, 글자])
  const 종이mm = (fr) => {
    if (종이 === '원래' && fr && fr.g) return PAPER[fr.g.paper] || PAPER.A3
    return PAPER[종이] || PAPER.A3
  }
  const 장들 = useMemo(() => {
    if (!모델) return []
    if (범위 === 'frames' && 모델.frames.length) {
      return 모델.frames.map((fr, i) => ({ i, r: [fr.x0, fr.y0, fr.x1, fr.y1], paper: 종이mm(fr), fr })).filter((p) => 고른[p.i])
    }
    if (범위 === 'mine') return 내범위.map((r, i) => ({ i, r, paper: 종이mm(null) }))
    return [{ i: 0, r: 모델.box, paper: 종이mm(null) }]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [모델, 범위, 고른, 종이, 내범위])
  const 전체장 = useMemo(() => (모델 ? { r: 모델.box, paper: 종이mm(null) } : null), [모델, 종이])  // eslint-disable-line react-hooks/exhaustive-deps

  /* 미리보기 그리기 */
  const 보는것 = 범위 === 'mine' ? 전체장 : 장들[Math.min(보는장, Math.max(0, 장들.length - 1))]
  useEffect(() => {
    if (!모델 || !보는것 || !cvRef.current) return
    const id = requestAnimationFrame(() => {
      try { drawPage(cvRef.current, 모델, 보는것, opt, 폭, cacheRef.current) } catch (e) { /* 미리보기 실패는 PDF 와 무관 */ }
    })
    return () => cancelAnimationFrame(id)
  }, [모델, 보는것, opt, 폭, 글꼴])

  const 읽기 = async (list, 예시로 = false) => {
    const f = [...(list || [])][0]
    if (!f) return
    if (!예시로) set예시글('')
    set파일이름(f.name)
    set모델(null); set결과(null); set내범위([]); set보는장(0)
    cacheRef.current = []
    if (/\.dwg$/i.test(f.name)) { set상태({ k: 'err', msg: 'dwg' }); return }
    if (f.size > 큰파일) { set상태({ k: 'err', msg: 'big' }); return }
    set상태({ k: 'busy', p: 0, msg: '파일 여는 중' })
    const buf = await f.arrayBuffer()
    if (workRef.current) workRef.current.terminate()
    const w = new Worker(new URL('../lib/dxfpdf.worker.js', import.meta.url), { type: 'module' })
    workRef.current = w
    w.onmessage = (ev) => {
      const m = ev.data
      if (m.type === 'prog') set상태({ k: 'busy', p: m.p, msg: m.msg })
      else if (m.type === 'pprog') set상태({ k: 'pdf', p: m.p, msg: m.msg })
      else if (m.type === 'err') set상태({ k: 'err', msg: m.kind, more: m.msg })
      else if (m.type === 'model') {
        const md = m.model
        set모델(md)
        set고른(md.frames.map(() => true))
        set범위(md.frames.length ? 'frames' : 'all')
        /* 종이: 도면에 저장된 출력 종이(모형 배치)가 A 판이면 그것, 아니면 A3 */
        let 기본 = 'A3'
        if (md.paper) {
          const big = Math.max(...md.paper)
          for (const [k, v] of Object.entries(PAPER)) if (Math.abs(v[0] - big) < 6) 기본 = k
        }
        set종이(기본)
        set상태({ k: 'done' })
      } else if (m.type === 'pdf') {
        const blob = new Blob([m.bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const name = (f.name || '도면').replace(/\.dxf$/i, '') + '.pdf'
        set결과({ url, size: blob.size, name, pages: m.pages || 0, nText: m.nText })
        set상태({ k: 'done' })
        const a = document.createElement('a')
        a.href = url; a.download = name
        document.body.appendChild(a); a.click(); a.remove()
      }
    }
    w.onerror = (e) => set상태({ k: 'err', msg: 'fail', more: String(e.message || '') })
    w.postMessage({ type: 'parse', buf }, [buf])
  }

  const 예시하기 = async () => {
    set예시글(예시.글)
    set상태({ k: 'busy', p: 0, msg: '예시 도면 받는 중' })
    try {
      const res = await fetch('/tools/files/' + 예시.파일)
      if (!res.ok) throw new Error()
      await 읽기([new File([await res.blob()], 예시.파일)], true)
    } catch (e) { set상태({ k: 'err', msg: 'fail', more: '예시 도면을 받지 못했습니다 — 잠시 뒤 다시 눌러 주십시오' }) }
  }

  const 만들기 = () => {
    if (!workRef.current || !장들.length) return
    set결과(null)
    set상태({ k: 'pdf', p: 0, msg: 'PDF 만드는 중' })
    workRef.current.postMessage({
      type: 'pdf', pages: 장들.map((p) => ({ r: p.r, paper: p.paper })), opt,
      title: (파일이름 || '도면').replace(/\.dxf$/i, ''),
    })
  }

  /* 직접 잡기 — 전체 그림 위에서 끌어 네모를 그립니다 */
  const 화면좌표 = (e) => {
    const rc = cvRef.current.getBoundingClientRect()
    return [e.clientX - rc.left, e.clientY - rc.top]
  }
  const 전체G = useMemo(() => (전체장 ? pageGeom(전체장.r, 전체장.paper, 5) : null), [전체장])
  const 도면좌표 = ([px, py]) => {
    if (!전체G) return null
    const G = 전체G, k = 폭 / G.W
    return [G.x0 + (px / k - G.ox) / G.s, G.y0 + ((G.H - py / k) - G.oy) / G.s]
  }
  const 누름 = (e) => {
    if (범위 !== 'mine') return
    const p = 화면좌표(e)
    끌기.current = { x0: p[0], y0: p[1], x1: p[0], y1: p[1] }
    set끄는중(끌기.current)
  }
  const 움직임 = (e) => {
    if (!끌기.current) return
    const p = 화면좌표(e)
    끌기.current = { ...끌기.current, x1: p[0], y1: p[1] }
    set끄는중(끌기.current)
  }
  const 뗌 = (e) => {
    const d = 끌기.current
    끌기.current = null
    set끄는중(null)
    if (!d) return
    if (e && e.clientX !== undefined) { const p = 화면좌표(e); d.x1 = p[0]; d.y1 = p[1] }
    if (Math.abs(d.x1 - d.x0) < 8 || Math.abs(d.y1 - d.y0) < 8) return
    const a = 도면좌표([d.x0, d.y0]), b = 도면좌표([d.x1, d.y1])
    if (!a || !b) return
    set내범위((v) => [...v, [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]])
  }
  /* 잡은 범위를 화면 위에 네모로 */
  const 네모들 = useMemo(() => {
    if (범위 !== 'mine' || !전체G) return []
    const G = 전체G, k = 폭 / G.W
    return 내범위.map((r) => {
      const x0 = ((r[0] - G.x0) * G.s + G.ox) * k, x1 = ((r[2] - G.x0) * G.s + G.ox) * k
      const y0 = (G.H - ((r[3] - G.y0) * G.s + G.oy)) * k, y1 = (G.H - ((r[1] - G.y0) * G.s + G.oy)) * k
      return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 }
    })
  }, [내범위, 범위, 전체G, 폭])

  const st = 모델 && 모델.stats
  const 안그림 = st ? Object.entries(st.skipped).filter(([k, n]) => n > 0 && k !== '배치(종이) 공간') : []
  const 종이축척 = (p) => {
    if (!p || !p.fr || !p.fr.g) return null
    const G = pageGeom(p.r, p.paper, 5)
    const mm = { 1: 25.4, 2: 304.8, 4: 1, 5: 10, 6: 1000 }[모델.units] || 1
    const s = mm / (G.s * 25.4 / 72)                  // 도면 mm 몇 개가 종이 1mm 인가
    return `원래 ${p.fr.g.paper} · 1:${쉼(p.fr.g.scale)} → 이 종이에서 약 1:${쉼(Math.round(s))}`
  }

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📄 도면 PDF 만들기 <span className="count">· DXF → PDF</span></h1>
        <div className="note sm">
          캐드 도면(<b>.dxf</b>)을 놓으면 <b>도곽을 스스로 찾아 한 장씩</b> PDF 로 찍습니다.
          흑백(색마다 굵기) · 컬러 · 점선 · 해치 무늬 · 한글 글자까지. 선은 확대해도 깨지지 않고, 글자는 PDF 에서 찾기가 됩니다.
        </div>
        <div className="pdfsafe">
          🔒 <b>파일은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 읽고 PDF 를 만듭니다. 회원가입 없음 · 무료.
        </div>
      </div>

      <div className="card">
        <div className={'pdfdrop' + (끌림 ? ' on' : '')}
             onDragOver={(e) => { e.preventDefault(); set끌림(true) }}
             onDragLeave={() => set끌림(false)}
             onDrop={(e) => { e.preventDefault(); set끌림(false); 읽기(e.dataTransfer.files) }}>
          <button type="button" className="pdfpick" onClick={() => 파일칸.current?.click()}>📂 DXF 도면 고르기</button>
          <div className="pdfdrop-d">또는 도면 파일을 이곳에 끌어다 놓으세요 · 250MB 까지 · DWG 는 캐드에서 DXF 로 저장해 주십시오</div>
        </div>
        <input ref={파일칸} type="file" accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1}
               onChange={(e) => { 읽기(e.target.files); e.target.value = '' }} />
        <div className="tlx-ex" style={{ marginTop: 10, marginBottom: 0 }}>
          <span className="tlx-exd"><b>🧪 예시로 해 보기</b> — 도면이 없으시면 눌러 보십시오:</span>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={예시하기}>🏢 가상 건물 도면 2장</button>
        </div>
        {파일이름 && <div className="pdfgot">📎 {파일이름}{예시글 && <span className="muted"> — 예시: {예시글}</span>}</div>}
        {(상태.k === 'busy' || 상태.k === 'pdf') && (
          <div className="dx3-bar" aria-live="polite">
            <div className="dx3-bar-in" style={{ width: Math.round((상태.p || 0) * 100) + '%' }} />
            <span>{상태.msg} … {Math.round((상태.p || 0) * 100)}%</span>
          </div>
        )}
        {상태.k === 'err' && <div className="dx3-err">{오류글(상태.msg, 상태.more)}</div>}
      </div>

      {모델 && (
        <div className="card">
          <div className="dp-sum">
            {모델.frames.length
              ? <>🗂 도곽 <b>{모델.frames.length}</b>장을 찾았습니다{모델.frames[0].g ? <> · <b>{모델.frames[0].g.paper}</b> 종이에 <b>1:{쉼(모델.frames[0].g.scale)}</b> 로 그린 도면으로 보입니다</> : null}</>
              : <>🗂 도곽(√2 비율의 테두리 네모)을 못 찾았습니다 — <b>도면 전체를 한 장</b>으로 찍거나, <b>직접 잡기</b>로 범위를 정하십시오</>}
          </div>
          <div className="dp-opts">
            <div className="dp-opt">
              <span className="dp-lab">범위</span>
              {모델.frames.length > 0 && <button type="button" className={'chip' + (범위 === 'frames' ? ' on' : '')} onClick={() => { set범위('frames'); set보는장(0) }}>도곽마다 한 장</button>}
              <button type="button" className={'chip' + (범위 === 'all' ? ' on' : '')} onClick={() => { set범위('all'); set보는장(0) }}>전체 한 장</button>
              <button type="button" className={'chip' + (범위 === 'mine' ? ' on' : '')} onClick={() => set범위('mine')}>✏️ 직접 잡기</button>
            </div>
            <div className="dp-opt">
              <span className="dp-lab">종이</span>
              {모델.frames.some((f) => f.g) && <button type="button" className={'chip' + (종이 === '원래' ? ' on' : '')} onClick={() => set종이('원래')}>도곽 크기 그대로</button>}
              {['A4', 'A3', 'A2', 'A1', 'A0'].map((k) => (
                <button type="button" key={k} className={'chip' + (종이 === k ? ' on' : '')} onClick={() => set종이(k)}>{k}</button>
              ))}
            </div>
            <div className="dp-opt">
              <span className="dp-lab">색</span>
              <button type="button" className={'chip' + (색 === 'mono' ? ' on' : '')} onClick={() => set색('mono')}>흑백</button>
              <button type="button" className={'chip' + (색 === 'color' ? ' on' : '')} onClick={() => set색('color')}>컬러</button>
              <span className="dp-lab" style={{ marginLeft: 8 }}>굵기</span>
              <button type="button" className={'chip' + (굵기 === 'ctb' ? ' on' : '')} onClick={() => set굵기('ctb')} title="빨강 0.13 · 노랑 0.18 · 초록 0.25 · 하늘 0.30 · 파랑 0.35 · 자홍 0.40 · 흰 0.30 · 회색 0.09 mm">색마다(CTB)</button>
              <button type="button" className={'chip' + (굵기 === 'thin' ? ' on' : '')} onClick={() => set굵기('thin')}>모두 가늘게</button>
              <button type="button" className={'chip' + (굵기 === 'object' ? ' on' : '')} onClick={() => set굵기('object')}>도면에 적힌 굵기</button>
              <label className="dp-chk"><input type="checkbox" checked={글자} onChange={(e) => set글자(e.target.checked)} /> 글자 넣기</label>
            </div>
          </div>

          {범위 === 'frames' && 모델.frames.length > 1 && (
            <FrameList 모델={모델} 고른={고른} set고른={set고른} 보는장={보는장} set보는장={set보는장} 장들={장들} />
          )}
          {범위 === 'mine' && (
            <div className="dp-mine">
              ✏️ 아래 그림 위에서 <b>끌어서 네모</b>를 그리면 그 범위가 한 장이 됩니다 (여러 개 가능).
              {내범위.length > 0 && <> 지금 <b>{내범위.length}</b>장 · <button type="button" className="chip" onClick={() => set내범위([])}>다 지우기</button>
                <button type="button" className="chip" onClick={() => set내범위((v) => v.slice(0, -1))}>마지막 것 지우기</button></>}
            </div>
          )}

          <div className="dp-stage" ref={boxRef}>
            <div className="dp-paper" style={{ width: 폭 }}
                 onMouseDown={누름} onMouseMove={움직임} onMouseUp={뗌} onMouseLeave={() => { 끌기.current = null; set끄는중(null) }}
                 onTouchStart={(e) => 누름(e.touches[0])} onTouchMove={(e) => { if (끌기.current) 움직임(e.touches[0]) }} onTouchEnd={() => 뗌()}>
              <canvas ref={cvRef} className={'dp-cv' + (범위 === 'mine' ? ' pick' : '')} />
              {네모들.map((b, i) => <div key={i} className="dp-rect" style={b}><span>{i + 1}</span></div>)}
              {끄는중 && <div className="dp-rect now" style={{ left: Math.min(끄는중.x0, 끄는중.x1), top: Math.min(끄는중.y0, 끄는중.y1), width: Math.abs(끄는중.x1 - 끄는중.x0), height: Math.abs(끄는중.y1 - 끄는중.y0) }} />}
            </div>
          </div>
          {범위 !== 'mine' && 장들.length > 1 && (
            <div className="dp-nav">
              <button type="button" className="chip" disabled={보는장 <= 0} onClick={() => set보는장((v) => Math.max(0, v - 1))}>‹ 앞 장</button>
              <span><b>{Math.min(보는장, 장들.length - 1) + 1}</b> / {장들.length} 장</span>
              <button type="button" className="chip" disabled={보는장 >= 장들.length - 1} onClick={() => set보는장((v) => Math.min(장들.length - 1, v + 1))}>다음 장 ›</button>
            </div>
          )}
          {보는것 && 범위 !== 'mine' && 종이축척(보는것) && <div className="dp-scale">{종이축척(보는것)}</div>}
          {!글꼴 && 글자 && <div className="dp-scale">글꼴을 받는 중이라 미리보기 글자가 잠시 다르게 보일 수 있습니다 (PDF 는 같은 글꼴로 찍힙니다)</div>}

          <div className="dp-go">
            <button type="button" className="btn" disabled={!장들.length || 상태.k === 'pdf' || 상태.k === 'busy'} onClick={만들기}>
              📄 PDF 만들기 ({장들.length}장{장들[0] ? ` · ${종이 === '원래' ? '도곽 크기' : 종이}` : ''} · {색 === 'mono' ? '흑백' : '컬러'})
            </button>
            {결과 && (
              <div className="dp-done">
                ✅ 만들었습니다 — <b>{결과.name}</b> ({MB(결과.size)}) ·{' '}
                <a href={결과.url} download={결과.name}>다시 받기</a> · <a href={결과.url} target="_blank" rel="noreferrer">새 창에서 보기</a>
              </div>
            )}
          </div>

          {(안그림.length > 0 || (st && (st.capped || st.hatchCut > 0 || st.hidden > 0))) && (
            <div className="dx3-skip">
              {st.hidden > 0 && <>꺼진·얼린·«출력 안 함» 레이어 도형 {쉼(st.hidden)}개는 도면 설정대로 뺐습니다. </>}
              {안그림.length > 0 && <>못 찍은 것: {안그림.map(([k, n]) => `${k} ${쉼(n)}`).join(' · ')}. </>}
              {st.hatchCut > 0 && <>너무 촘촘한 해치 {쉼(st.hatchCut)}개는 테두리만 찍었습니다. </>}
              {st.capped && <b>도면이 너무 커서 앞부분만 읽었습니다 — 캐드에서 필요 없는 레이어를 지우고 다시 저장해 주십시오.</b>}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="detail-h">이렇게 찍습니다</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li><b>도곽 찾기</b> — 가로:세로가 √2(A·B 판)인 큰 네모를 도곽으로 봅니다. 바깥 재단선 안에 안쪽 테두리가 또 있으면 바깥 것으로. 크기로 원래 종이와 축척(예: A1 · 1:100)을 짐작합니다</li>
          <li><b>굵기</b> — 우리나라 도면은 대부분 <b>색마다 굵기</b>로 출력합니다(CTB). 빨강 0.13 · 노랑 0.18 · 초록 0.25 · 하늘 0.30 · 파랑 0.35 · 자홍 0.40 · 흰 0.30 · 회색 0.09 mm</li>
          <li><b>흑백</b> — 회색(8·9·250~254번)은 회색 그대로, 나머지는 검정</li>
          <li><b>점선·해치</b> — 도면의 선 종류와 해치 무늬를 그대로 풀어서 찍습니다. 외부참조 자르기(XCLIP)도 지킵니다</li>
          <li><b>글자</b> — 캐드 전용 글꼴(SHX)은 브라우저에 없어 <b>KCM Gothic</b>(나눔고딕 바탕 · <a href="/fonts/OFL.txt" target="_blank" rel="noreferrer">OFL</a>)으로 찍습니다. 모양이 조금 다를 수 있습니다</li>
        </ul>
      </div>
      <div className="card">
        <div className="detail-h">아직 못 하는 것</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li><b>DWG</b> — 캐드에서 «다른 이름으로 저장 → DXF» 로 바꿔 올려 주십시오. DWG 바로 읽기는 다음에 붙입니다</li>
          <li><b>배치(종이 공간)</b> — 모델 공간에 그린 도면만 찍습니다. 배치 탭에만 있는 도면은 아직</li>
          <li><b>그림(IMAGE) · OLE · 표(ACAD_TABLE) · 다중 지시선(MLEADER)</b> — 빠집니다. 몇 개가 빠졌는지 위에 적습니다</li>
        </ul>
      </div>

      <div className="card">
        <div className="navrow">
          <Link className="navi" to="/tools">🧰 다른 도구</Link>
          <Link className="navi" to="/tools/dxf3d">📦 도면 3D 보기</Link>
          <Link className="navi" to="/pdf">📄 PDF 도구</Link>
          <Link className="navi" to="/cad">📐 캐드 유틸</Link>
        </div>
      </div>
    </div>
  )
}

/* 도곽 목록 — 작은 그림 + 넣기/빼기 */
function FrameList({ 모델, 고른, set고른, 보는장, set보는장, 장들 }) {
  const refs = useRef([])
  useEffect(() => {
    let i = 0
    let stop = false
    const next = () => {
      if (stop || i >= 모델.frames.length) return
      const fr = 모델.frames[i]
      const c = refs.current[i]
      if (c) drawThumb(c, 모델, [fr.x0, fr.y0, fr.x1, fr.y1], 150)
      i++
      setTimeout(next, 0)
    }
    next()
    return () => { stop = true }
  }, [모델])
  const n = 고른.filter(Boolean).length
  return (
    <div className="dp-frames">
      <div className="dp-fh">
        <b>도곽 {n}</b> / {모델.frames.length} 장 넣음
        <button type="button" className="chip" onClick={() => set고른(모델.frames.map(() => true))}>모두</button>
        <button type="button" className="chip" onClick={() => set고른(모델.frames.map(() => false))}>모두 빼기</button>
      </div>
      <div className="dp-flist">
        {모델.frames.map((fr, i) => {
          const at = 장들.findIndex((p) => p.i === i)
          return (
            <div key={i} className={'dp-f' + (고른[i] ? '' : ' off') + (at >= 0 && at === 보는장 ? ' now' : '')}>
              <canvas ref={(el) => { refs.current[i] = el }} onClick={() => { if (at >= 0) set보는장(at) }} />
              <label><input type="checkbox" checked={!!고른[i]} onChange={(e) => set고른((v) => { const x = [...v]; x[i] = e.target.checked; return x })} /> {i + 1}번</label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
