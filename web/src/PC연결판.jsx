/**
 * 💻 G468 PC 연결 — 작업 화면 위 띠 «💻 PC 연결 켜짐» · «📁 PC 폴더 도면» 고르기 창
 *   프로그램 «K-적산컨맵 연결»(lib/pc연결.js)이 켜져 있을 때만 보임 — 고른 파일은 «📐 도면 넣기» 와 같은 길(함께넣기)로 넣음
 */
import { useEffect, useState } from 'react'
import { pc폴더, pc목록, pc파일, 크기글, 때글 } from './lib/pc연결.js'

export default function PC연결판({ 연, 넣기, 세기, 끄기 }) {
  const [열림, set열림] = useState(false)
  const [폴더, set폴더] = useState([])
  const [번, set번] = useState(0)
  const [목록, set목록] = useState(null)
  const [고른, set고른] = useState(() => new Set())
  const [갈래, set갈래] = useState('도면')
  const [알, set알] = useState('')
  const [하는중, set하는중] = useState('')
  useEffect(() => {
    if (!열림) return
    let 산 = true
    set알('')
    pc폴더(연).then((f) => { if (산) { set폴더(f); if (번 >= f.length) set번(0) } }).catch((e) => 산 && set알('폴더를 읽지 못했습니다 — ' + (e.message || e)))
    return () => { 산 = false }
  }, [열림, 연])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!열림 || !폴더.length) { set목록(null); return }
    let 산 = true
    set목록(null); set고른(new Set())
    pc목록(연, 번).then((l) => 산 && set목록(l)).catch((e) => 산 && set알('목록을 읽지 못했습니다 — ' + (e.message || e)))
    return () => { 산 = false }
  }, [열림, 폴더, 번, 연])
  if (!연) return null
  const 도면 = (x) => /\.(dwg|dxf)$/i.test(x.이름)
  const 보일 = (목록 || []).filter((x) => (갈래 === '도면' ? 도면(x) : !도면(x)))
  const 고른것 = (목록 || []).filter((x) => 고른.has(x.p))
  const 합 = 고른것.reduce((a, x) => a + x.크기, 0)
  const 누름 = (p) => set고른((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n })
  const 모두 = () => set고른((s) => { const n = new Set(s); const 다 = 보일.every((x) => n.has(x.p)); for (const x of 보일) { if (다) n.delete(x.p); else n.add(x.p) } return n })
  const 가져오기 = async () => {
    if (!고른것.length) return
    const 받은 = []
    try {
      for (let i = 0; i < 고른것.length; i++) {
        const x = 고른것[i]
        set하는중('PC 에서 읽는 중 ' + (i + 1) + '/' + 고른것.length + ' — ' + x.이름)
        const r = await pc파일(연, 번, x.p)
        받은.push({ 이름: x.이름, buf: r.buf })
      }
    } catch (e) { set하는중(''); set알('PC 에서 읽지 못했습니다 — ' + (e.message || e) + ' (프로그램이 켜져 있는지 보십시오)'); return }
    set하는중(''); set열림(false)
    세기('|골조모델|PC폴더넣기')
    await 넣기(받은)
  }
  return (
    <>
      <div className="gmd-note gmd-ws-note gmd-pcbar" role="status">
        💻 <b>PC 연결 켜짐</b> <span className="muted">— {연.이름} {연.판} · 폴더 {연.폴더수}곳 · 도면은 이 PC 안에서만 오갑니다</span>
        <button type="button" className="btn sm gmd-pcbtn" style={{ width: 'auto' }} onClick={() => { set열림(true); 세기('|골조모델|PC폴더') }}>📁 PC 폴더 도면</button>
        {끄기 && <button type="button" className="gmd-x" onClick={끄기} aria-label="닫기">✕</button>}
      </div>
      {열림 && (
        <div className="gmd-xlchk" role="dialog" aria-label="PC 폴더 도면" onClick={(e) => { if (e.target === e.currentTarget && !하는중) set열림(false) }}>
          <div className="gmd-xlchk-box gmd-pcbox">
            <b className="gmd-xlchk-h">📁 PC 폴더 도면 — {연.이름}</b>
            {!폴더.length && !알 && <p className="muted gmd-p">정해 둔 폴더가 없습니다 — PC 의 «{연.이름}» 창에서 «＋ 폴더 더하기» 로 도면 폴더를 정하십시오.</p>}
            {폴더.length > 0 && <div className="gmd-row gmd-pc-folders">{폴더.map((f) => <button key={f.번} type="button" className={'gmd-gs-chip' + (f.번 === 번 ? ' on' : '')} onClick={() => set번(f.번)} title={f.길}>📁 {f.이름}</button>)}</div>}
            {목록 && <div className="gmd-row gmd-pc-kinds">
              {[['도면', 'DWG · DXF'], ['엑셀', '일람표 · 엑셀']].map(([k, t]) => <button key={k} type="button" className={'gmd-gs-chip' + (갈래 === k ? ' on' : '')} onClick={() => set갈래(k)}>{t} {(목록 || []).filter((x) => (k === '도면' ? 도면(x) : !도면(x))).length}</button>)}
              {보일.length > 0 && <button type="button" className="gmd-link" onClick={모두}>☑ 모두</button>}
            </div>}
            {폴더.length > 0 && !목록 && !알 && <p className="muted gmd-p">목록 읽는 중…</p>}
            {목록 && (보일.length ? (
              <div className="gmd-pc-list">{보일.map((x) => (
                <label key={x.p} className={'gmd-pc-file' + (고른.has(x.p) ? ' on' : '')}>
                  <input type="checkbox" checked={고른.has(x.p)} onChange={() => 누름(x.p)} />
                  <span className="gmd-pc-name" title={x.p}>{x.p}</span>
                  <span className="muted gmd-pc-meta">{크기글(x.크기)} · {때글(x.때)}</span>
                </label>))}
              </div>) : <p className="muted gmd-p">이 폴더에 {갈래 === '도면' ? 'DWG · DXF' : '엑셀'} 파일이 없습니다.</p>)}
            {알 && <p className="gmd-warn gmd-p">{알}</p>}
            {하는중 && <p className="gmd-note" role="status">⏳ {하는중}</p>}
            <div className="gmd-xlchk-btns">
              <button type="button" className="btn" onClick={가져오기} disabled={!고른것.length || !!하는중}>📐 넣기{고른것.length ? ' — ' + 고른것.length + '장 · ' + 크기글(합) : ''}</button>
              <button type="button" className="btn line" onClick={() => set열림(false)} disabled={!!하는중}>닫기</button>
            </div>
            <small className="muted">«📐 도면 넣기» 와 같습니다 — 구조도면(평면 · 일람표 · 단면)을 함께 고르면 함께 읽어 세웁니다.</small>
          </div>
        </div>
      )}
    </>
  )
}
