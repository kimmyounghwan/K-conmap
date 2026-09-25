/**
 * /tools/dxf3d — 📦 도면 3D 보기 (2026-09-25)
 *
 * 소장님: 「DXF 도면만 넣으면 3D 가 서는 도구 — 프로그램화 해서 도구로 넣자」 · 「3d 도구도 올려줘」
 *         「도구는 되도록 사이트 안에서」
 *
 * ■ 도면(.dxf)을 «이 브라우저 안에서만» 읽어 선을 도면에 적힌 높이(Z) 그대로 세웁니다.
 *   서버가 없습니다 → 파일이 어디로도 안 가고, 동시에 몇 명이 써도 서로 느려지지 않습니다.
 * ■ 읽기는 lib/dxf3d.js (일꾼 lib/dxf3d.worker.js), 그리기는 lib/gl3d.js (WebGL, three.js 없이).
 * ■ ⚠️ 도면을 해석하지 않습니다. 높이가 없는 평면도는 납작하게 나오고, 그렇다고 화면에 적습니다.
 *   못 그린 것(글자·해치·3DSOLID …)은 몇 개인지 세어 보여 줍니다 — 조용히 빼지 않습니다.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fitBox } from '../lib/dxf3d.js'
import { LineView } from '../lib/gl3d.js'

const 큰파일 = 250 * 1024 * 1024

const 쉼 = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0))
const 높이글 = (z) => (Math.abs(z) >= 1000 ? 쉼(z) : (Math.round(z * 100) / 100).toString())

export default function Dxf3d() {
  const cvRef = useRef(null)
  const viewRef = useRef(null)
  const workRef = useRef(null)
  const 파일칸 = useRef(null)
  const [끌림, set끌림] = useState(false)
  const [상태, set상태] = useState({ k: 'idle' })       // idle | busy | done | err
  const [결과, set결과] = useState(null)
  const [켬, set켬] = useState({})
  const [높이배, set높이배] = useState(1)
  const [층찾기, set층찾기] = useState('')
  const [파일이름, set파일이름] = useState('')

  useEffect(() => () => {
    if (viewRef.current) viewRef.current.dispose()
    if (workRef.current) workRef.current.terminate()
  }, [])

  const 읽기 = async (f) => {
    if (!f) return
    set파일이름(f.name)
    set결과(null)
    if (/\.dwg$/i.test(f.name)) { set상태({ k: 'err', msg: 'dwg' }); return }
    if (f.size > 큰파일) { set상태({ k: 'err', msg: 'big' }); return }
    set상태({ k: 'busy', p: 0, msg: '파일 여는 중' })
    const buf = await f.arrayBuffer()
    if (workRef.current) workRef.current.terminate()
    const w = new Worker(new URL('../lib/dxf3d.worker.js', import.meta.url), { type: 'module' })
    workRef.current = w
    w.onmessage = (ev) => {
      const m = ev.data
      if (m.type === 'prog') set상태({ k: 'busy', p: m.p, msg: m.msg })
      else if (m.type === 'err') { set상태({ k: 'err', msg: m.kind, more: m.msg }); w.terminate() }
      else if (m.type === 'done') {
        w.terminate(); workRef.current = null
        보이기(m.r)
      }
    }
    w.onerror = (e) => set상태({ k: 'err', msg: 'fail', more: String(e.message || '') })
    w.postMessage({ buf }, [buf])
  }

  const 보이기 = (r) => {
    const 처음켬 = {}
    for (const l of r.layers) 처음켬[l.name] = !l.off
    if (!r.layers.some((l) => 처음켬[l.name])) for (const l of r.layers) 처음켬[l.name] = true
    set켬(처음켬)
    set높이배(1)
    set결과({
      layers: r.layers.map((l) => ({ name: l.name, rgb: l.rgb, off: l.off, segs: l.segs, pts: l.pts.length / 3, box: l.box, smp: l.smp })),
      stats: r.stats, zr: r.zr, c: r.center,
    })
    set상태({ k: 'done' })
    requestAnimationFrame(() => {
      try {
        if (!viewRef.current) viewRef.current = new LineView(cvRef.current)
        viewRef.current.setZ(1)
        viewRef.current.setLayers(r.layers.map((l) => ({ ...l, off: !처음켬[l.name] })))
        viewRef.current.fit(자리(r.layers, 처음켬), 평평(r.layers, 처음켬) ? 'top' : 'tilt')
      } catch (e) {
        set상태({ k: 'err', msg: 'webgl' })
      }
    })
  }

  const 켠층 = (name, on) => {
    const n = { ...켬, [name]: on }
    set켬(n)
    if (viewRef.current) viewRef.current.setOn(name, on)
  }
  const 모두 = (how) => {
    if (!결과) return
    const n = {}
    for (const l of 결과.layers) n[l.name] = how === 'all' ? true : how === 'none' ? false : !l.off
    set켬(n)
    if (viewRef.current) viewRef.current.setAll((nm) => n[nm])
  }
  const 보기 = (how) => {
    if (!결과 || !viewRef.current) return
    viewRef.current.fit(자리(결과.layers, 켬), how)
  }
  const 높이 = (z) => { set높이배(z); if (viewRef.current) viewRef.current.setZ(z) }
  const 그림받기 = () => {
    if (!viewRef.current) return
    const a = document.createElement('a')
    a.href = viewRef.current.png()
    a.download = (파일이름.replace(/\.dxf$/i, '') || '도면') + '_3D.png'
    a.click()
  }

  const 보이는층 = useMemo(() => {
    if (!결과) return []
    const q = 층찾기.trim().toLowerCase()
    return 결과.layers.filter((l) => !q || l.name.toLowerCase().includes(q))
  }, [결과, 층찾기])

  const 높이범위 = useMemo(() => {
    if (!결과) return null
    let lo = Infinity, hi = -Infinity
    for (const l of 결과.layers) if (켬[l.name] && l.box) { lo = Math.min(lo, l.box[6]); hi = Math.max(hi, l.box[7]) }
    return Number.isFinite(lo) ? [lo + 결과.c[2], hi + 결과.c[2]] : null   // 가운데를 뺀 값이라 되돌립니다
  }, [결과, 켬])
  const 납작 = 높이범위 && 높이범위[1] - 높이범위[0] < 1e-6

  const st = 결과 && 결과.stats
  const 안그림 = st ? Object.entries(st.skipped).filter(([, n]) => n > 0) : []
  const 모름 = st ? Object.entries(st.unknown) : []

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📦 도면 3D 보기 <span className="count">· DXF</span></h1>
        <div className="note sm">
          캐드 도면(<b>.dxf</b>)을 놓으면 선을 <b>도면에 적힌 높이 그대로</b> 세워 돌려 봅니다.
          등고선 · 3D 폴리선 · 3DFACE · 메쉬 · 블록 안의 것까지 읽습니다.
        </div>
        <div className="pdfsafe">
          🔒 <b>파일은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 읽고 그립니다 —
          그래서 여러 분이 한꺼번에 써도 서로 느려지지 않습니다. 회원가입 없음 · 무료.
        </div>
      </div>

      <div className="card">
        <div className={'pdfdrop' + (끌림 ? ' on' : '')}
             onDragOver={(e) => { e.preventDefault(); set끌림(true) }}
             onDragLeave={() => set끌림(false)}
             onDrop={(e) => { e.preventDefault(); set끌림(false); 읽기(e.dataTransfer.files && e.dataTransfer.files[0]) }}>
          <button type="button" className="pdfpick" onClick={() => 파일칸.current?.click()}>📂 DXF 도면 고르기</button>
          <div className="pdfdrop-d">또는 도면 파일을 이곳에 끌어다 놓으세요 · 250MB 까지</div>
        </div>
        <input ref={파일칸} type="file" accept=".dxf,.DXF" className="sr-only" tabIndex={-1}
               onChange={(e) => { 읽기(e.target.files && e.target.files[0]); e.target.value = '' }} />
        {파일이름 && <div className="pdfgot">📎 {파일이름}</div>}

        {상태.k === 'busy' && (
          <div className="dx3-bar" aria-live="polite">
            <div className="dx3-bar-in" style={{ width: Math.round((상태.p || 0) * 100) + '%' }} />
            <span>{상태.msg} … {Math.round((상태.p || 0) * 100)}%</span>
          </div>
        )}
        {상태.k === 'err' && <div className="dx3-err">{오류글(상태.msg, 상태.more)}</div>}
      </div>

      <div className="card dx3-card" style={{ display: 상태.k === 'done' ? 'block' : 'none' }}>
        <div className="dx3-tools">
          <button type="button" className="chip" onClick={() => 보기('tilt')}>↗ 비스듬히</button>
          <button type="button" className="chip" onClick={() => 보기('top')}>⬇ 위에서</button>
          <button type="button" className="chip" onClick={() => 보기('side')}>➡ 옆에서</button>
          <span className="dx3-sep" />
          <span className="dx3-lab">높이</span>
          {[1, 2, 5, 10].map((z) => (
            <button type="button" key={z} className={'chip' + (높이배 === z ? ' on' : '')} onClick={() => 높이(z)}>×{z}</button>
          ))}
          <span className="dx3-sep" />
          <button type="button" className="chip" onClick={그림받기}>🖼 그림 저장</button>
        </div>
        <div className="dx3-stage">
          <canvas ref={cvRef} className="dx3-cv" />
          <div className="dx3-hint">끌기 = 돌리기 · 오른쪽 끌기(Shift+끌기, 두 손가락) = 옮기기 · 휠(벌리기) = 확대</div>
        </div>
        {결과 && (
          <div className="dx3-info">
            선 <b>{쉼(st.segs)}</b>개 · 층 <b>{결과.layers.length}</b>개
            {st.pts > 0 && <> · 점 <b>{쉼(st.pts)}</b>개</>}
            {높이범위 && <> · 켠 층 높이 <b>{높이글(높이범위[0])} ~ {높이글(높이범위[1])}</b></>}
            {st.ver && <> · {st.ver}</>}
          </div>
        )}
        {납작 && (
          <div className="dx3-warn">
            ⚠️ 켠 층의 높이가 <b>모두 같습니다</b> — 이 도면은 평면으로만 그려져 있어 납작하게 보입니다.
            등고선·3D 폴리선·3DFACE 처럼 <b>높이(Z)가 들어간 도면</b>이라야 입체로 섭니다.
            꺼 둔 층(수치지도 등고선 같은 것)에 높이가 있을 수 있으니 아래 층 목록에서 켜 보십시오.
          </div>
        )}
        {st && st.capped && (
          <div className="dx3-warn">
            ⚠️ 선이 너무 많아 <b>앞 {쉼(st.segs)}개까지만</b> 그렸습니다. 캐드에서 필요 없는 층을 지우고 다시 저장하시면 다 보입니다.
          </div>
        )}
        {(안그림.length > 0 || 모름.length > 0 || (st && st.depthCut > 0)) && (
          <div className="dx3-skip">
            그리지 않은 것: {안그림.map(([k, n]) => `${k} ${쉼(n)}`).join(' · ')}
            {모름.length > 0 && <>{안그림.length ? ' · ' : ''}모르는 도형 {모름.map(([k, n]) => `${k} ${쉼(n)}`).join(' · ')}</>}
            {st && st.depthCut > 0 && <> · 너무 깊이 겹친 블록 {쉼(st.depthCut)}</>}
            {(st.skipped['입체(3DSOLID)'] || 0) > 0 && (
              <div style={{ marginTop: 4 }}>입체(3DSOLID)는 속이 암호로 되어 있어 못 읽습니다 — 캐드에서 메쉬(MESHSMOOTH)로 바꿔 저장하시면 보입니다.</div>
            )}
          </div>
        )}
        {결과 && (
          <div className="dx3-layers">
            <div className="dx3-lh">
              <b>층</b> <span className="count">· 켜고 끄기</span>
              <button type="button" className="chip" onClick={() => 모두('draw')}>도면대로</button>
              <button type="button" className="chip" onClick={() => 모두('all')}>모두 켜기</button>
              <button type="button" className="chip" onClick={() => 모두('none')}>모두 끄기</button>
              {결과.layers.length > 12 && (
                <input className="dx3-find" value={층찾기} onChange={(e) => set층찾기(e.target.value)} placeholder="층 이름 찾기" />
              )}
            </div>
            <div className="dx3-list">
              {보이는층.map((l) => (
                <label key={l.name} className={'dx3-row' + (켬[l.name] ? '' : ' off')}>
                  <input type="checkbox" checked={!!켬[l.name]} onChange={(e) => 켠층(l.name, e.target.checked)} />
                  <span className="dx3-sw" style={{ background: `rgb(${l.rgb.join(',')})` }} />
                  <span className="dx3-nm" title={l.name}>{l.name}</span>
                  {l.off && <span className="dx3-tag">도면에서 꺼짐</span>}
                  {l.box && l.box[7] - l.box[6] > 1e-6 && <span className="dx3-tag z">높이 있음</span>}
                  <span className="dx3-n">{쉼(l.segs + l.pts)}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="detail-h">무엇이 서나</div>
        <p className="tl-p">
          도면에 <b>이미 적혀 있는 높이</b>만 씁니다. 수치지도의 <b>등고선</b>(높이를 가진 폴리선)을 켜면 땅 모양이 서고,
          측량 성과의 <b>3D 폴리선·점</b>, 캐드에서 만든 <b>3DFACE·메쉬</b>도 제 높이에 섭니다.
          블록(INSERT)은 크기·회전·배열까지 풀어서 그립니다.
        </p>
        <p className="tl-p">
          ⚠️ <b>도면을 «해석» 하지 않습니다.</b> 평면도·단면도처럼 높이 없이 그린 선은 바닥에 납작하게 그대로 있습니다.
          단면을 측점 자리에 세워 주는 일은 도면마다 그리는 법이 달라 자동으로 하면 틀립니다.
        </p>
      </div>

      <div className="card">
        <div className="detail-h">못 읽는 것</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li><b>DWG</b> — 캐드에서 «다른 이름으로 저장 → DXF» 로 바꿔 주십시오 (어느 판이든 됩니다)</li>
          <li><b>바이너리 DXF</b> — 저장할 때 «ASCII» 로</li>
          <li><b>3DSOLID·면(REGION)</b> — 속이 암호라 못 읽습니다. 메쉬로 바꾸면 보입니다</li>
          <li><b>글자·해치(채우기)·그림</b> — 3D 에서는 오히려 가려서 뺍니다. 몇 개를 뺐는지는 위에 적습니다</li>
        </ul>
      </div>

      <div className="card">
        <div className="navrow">
          <Link className="navi" to="/tools">🧰 다른 도구</Link>
          <Link className="navi" to="/cad">📐 캐드 유틸</Link>
          <Link className="navi" to="/pdf">📄 PDF 도구</Link>
        </div>
      </div>
    </div>
  )
}

/* 켠 층들의 자리 — 점 수로 무게를 달아 1~99% (구석의 튀는 점 몇 개에 화면이 끌려가지 않게) */
function 자리(layers, 켬) { return fitBox(layers, 켬) }
function 평평(layers, 켬) {
  let lo = Infinity, hi = -Infinity
  for (const l of layers) if (켬[l.name] && l.box) { lo = Math.min(lo, l.box[6]); hi = Math.max(hi, l.box[7]) }
  return !(hi - lo > 1e-6)
}

function 오류글(k, more) {
  if (k === 'dwg') return <>DWG 는 이 도구가 못 읽습니다. 캐드에서 <b>다른 이름으로 저장 → DXF</b> 로 바꿔 놓아 주십시오.</>
  if (k === 'bindxf') return <>바이너리 DXF 입니다. 캐드에서 DXF 로 저장할 때 <b>ASCII</b> 를 골라 주십시오.</>
  if (k === 'notdxf') return <>DXF 도면이 아닌 것 같습니다. 확장자가 .dxf 인 캐드 도면을 놓아 주십시오.</>
  if (k === 'big') return <>파일이 250MB 를 넘습니다. 캐드에서 필요 없는 층을 지우고(PURGE) 다시 저장해 주십시오.</>
  if (k === 'webgl') return <>이 브라우저에서 3D(WebGL)를 켤 수 없습니다. 크롬·엣지·사파리 최신판에서 열어 주십시오.</>
  return <>도면을 읽다가 멈췄습니다. {more ? <span className="muted">({more})</span> : null} 다른 판(2013·2018)의 DXF 로 저장해 다시 놓아 주십시오.</>
}
