/**
 * 📆 G463 기성 — 골조 모델에서 회차마다 «끝난 곳»(층 × 구간)을 고르면 그 곳 물량으로 기성 내역서 · 기성 도면
 *   카페 글(받은자료/카페_JH골조플러그인_편한점_1025.png) ② 갈래(거푸집만 등) 고르면 그 갈래만 든 기성 내역서 · ③ 구간별 기성 도면
 *   셈 = lib/골조모델.js 기성셈(구간물량과 같은 몫 규칙 — 칸 합 + 자리 없음 = 모델 전체) · 엑셀은 모델 엑셀에 «기성내역(n회)» · «기성칸» · «기성회차» 시트로
 */
import { useMemo, useRef, useState } from 'react'
import { 기성셈, 기성회차더하기, 기성회차빼기, 기성칸바꾸기, 기성고치기, 기성칸차례, 기성갈래들 } from './lib/골조모델.js'

const 수글 = (n, k = 3) => (Number.isFinite(n) ? n.toLocaleString('ko-KR', { minimumFractionDigits: k, maximumFractionDigits: k }) : '')
const 원글 = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString('ko-KR') : '')
const 층글 = (f) => (f === 'FT' ? 'FT' : f + '층')
const 자 = (u) => (u === 'ton' ? 4 : u === '㎡' ? 2 : 3)
const 오늘 = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }
/** 상태 → 색(3D · 평면 같은 색) */
export const 기성색들 = { 금회: [0.16, 0.48, 0.92], 전회: [0.40, 0.43, 0.48], 뒤: [0.66, 0.52, 0.90], 안함: [0.86, 0.87, 0.89] }
const css = (c) => 'rgb(' + c.map((v) => Math.round(v * 255)).join(',') + ')'
/** 칸 상태 글 — 금회 · 전회 · 뒤(뒤 회차) · 안함 */
export function 칸상태(B, 열쇠) { const n = B.상태.get(열쇠); return n === undefined ? '안함' : n === B.회 ? '금회' : n < B.회 ? '전회' : '뒤' }

export default function 골조기성판({ M, S, setM, 층, 세기, 엑셀받기, 받는중, 기성색, set기성색, 세우기로 }) {
  const g = M.기성
  const 회차 = (g && g.회차) || []
  const B = useMemo(() => (S && !S.오류 ? 기성셈(M, S) : null), [M, S])
  const [도면층, set도면층] = useState(null)
  const [알, set알] = useState('')
  const svgRef = useRef(null)
  if (!M.부재.length) return <div className="card"><p>아직 세운 부재가 없습니다 — 세우기 · 3D 에서 세우거나 «🧪 예시» 로 해 보십시오.</p></div>
  if (!S || S.오류 || !B) return <div className="card"><p className="gmd-warn">셈을 하지 못했습니다 — {S && S.오류}</p></div>
  const 데크있음 = (S.합.데크 || 0) > 0
  const 갈래들 = 기성갈래들.filter(([k]) => k !== '데크' || 데크있음)
  const 구간 = M.구간 || []
  const 열들 = [...구간.map((z) => ({ id: z.id, 이름: z.이름 })), { id: '밖', 이름: 구간.length ? '구간 밖' : '층 전체' }]
  const 층들 = M.층.map((f) => f.이름).filter((f) => [...B.Q.칸.values()].some((c) => c.층 === f))
  const 칸 = (f, z) => B.Q.칸.get(f + '|' + z)
  const 새회차 = () => { setM((P) => 기성회차더하기(P, 오늘())); 세기('|골조모델|기성회차'); set알('') }
  const 끝빼기 = () => {
    if (!회차.length) return
    const 끝 = 회차[회차.length - 1]
    if (끝.칸.length && !window.confirm(끝.회 + '회 기성(칸 ' + 끝.칸.length + '곳)을 뺄까요?')) return
    setM((P) => 기성회차빼기(P))
  }
  const 누름 = (열쇠들) => {
    if (!B.회) { set알('먼저 «＋ 새 회차» 를 누르십시오.'); return }
    const N = 기성칸바꾸기(M, B.회, 열쇠들)
    if (N === M) { set알('앞 회차에 이미 든 칸이라 바꾸지 않았습니다(그 회차를 고르면 바꿀 수 있음).'); return }
    setM(N); set알(''); 세기('|골조모델|기성칸')
  }
  const 고른회차 = 회차.find((r) => r.회 === B.회)
  const 도면f = 도면층 && 층들.includes(도면층) ? 도면층 : (층들.includes(층) ? 층 : 층들[0])
  const 그림받기 = () => {
    const el = svgRef.current
    if (!el) return
    const xml = new XMLSerializer().serializeToString(el)
    const img = new Image()
    const vb = el.viewBox.baseVal
    const W = 1600, H = Math.max(400, Math.round((1600 * vb.height) / Math.max(vb.width, 1)))
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H
      const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H)
      cv.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (M.이름 || '골조모델') + '_기성도면_' + B.회 + '회_' + 층글(도면f) + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000) }, 'image/png')
    }
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
    세기('|골조모델|기성도면')
  }
  return (
    <div className="card gmd-gs" aria-label="기성">
      <div className="gmd-row"><b>📆 기성 — 끝난 곳(층 × 구간)을 고르면 그 곳 물량으로 기성 내역서</b></div>
      <p className="muted gmd-p">회차를 만들고 이번에 끝난 칸을 누릅니다. 칸 물량은 구간별 물량과 같은 규칙(부재가 구간 선에 걸치면 길이 · 넓이로 나눔)이라 칸을 다 더하면 모델 전체와 같습니다.{구간.length ? '' : ' 구간을 긋지 않았으면 층 전체가 한 칸입니다(세우기 · 3D 의 ▭ 구간으로 팀별 · 공구별 칸을 나눌 수 있음).'}</p>
      <div className="gmd-row gmd-gs-rounds" role="tablist" aria-label="기성 회차">
        {회차.map((r) => <button key={r.회} type="button" role="tab" aria-selected={r.회 === B.회} className={'gmd-gs-chip' + (r.회 === B.회 ? ' on' : '')} onClick={() => setM((P) => 기성고치기(P, { 고른: r.회 }))}>{r.회}회{r.날짜 ? ' · ' + r.날짜.slice(5) : ''}</button>)}
        <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={새회차}>＋ 새 회차</button>
        {회차.length > 0 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={끝빼기}>끝 회차 빼기</button>}
      </div>
      {고른회차 && <label className="gmd-kv">{고른회차.회}회 날짜 <input type="date" className="gmd-in" value={고른회차.날짜} onChange={(e) => { const v = e.target.value; setM((P) => 기성고치기(P, { 회차: P.기성.회차.map((r) => (r.회 === 고른회차.회 ? { ...r, 날짜: v } : r)) })) }} /></label>}
      <div className="gmd-gs-kinds" aria-label="갈래 · 단가">
        {갈래들.map(([k, u]) => (
          <span key={k} className="gmd-gs-kind">
            <label className="gmd-kv"><input type="checkbox" checked={!!(g ? g.갈래 : ['콘크리트', '거푸집', '철근']).includes(k)} onChange={(e) => { const 지금 = (g ? g.갈래 : ['콘크리트', '거푸집', '철근']); setM((P) => 기성고치기(P, { 갈래: e.target.checked ? [...지금, k] : 지금.filter((x) => x !== k) })) }} /> {k}</label>
            <input className="gmd-in gmd-gs-price" inputMode="numeric" placeholder={'단가 원/' + u} aria-label={k + ' 단가(원/' + u + ')'} value={g && g.단가[k] ? String(g.단가[k]) : ''} onChange={(e) => { const v = Number(String(e.target.value).replace(/[^\d.]/g, '')); setM((P) => { const 지금 = (P.기성 && P.기성.단가) || {}; const 새 = { ...지금 }; if (v > 0) 새[k] = v; else delete 새[k]; return 기성고치기(P, { 단가: 새 }) }) }} />
          </span>
        ))}
      </div>
      {!회차.length && <p className="gmd-note">«＋ 새 회차» 를 누르면 1회 기성이 생깁니다. 그다음 아래 표에서 이번에 끝난 칸을 누르십시오.</p>}
      {알 && <p className="gmd-note" role="status">{알}</p>}

      <h2 className="gmd-h">끝난 곳 — {B.회 ? B.회 + '회' : '회차 없음'} <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>칸을 누르면 금회에 넣고 · 다시 누르면 뺌 · 층 이름을 누르면 그 층 모두</span></h2>
      <div className="gmd-tablewrap"><table className="gmd-table gmd-gs-grid">
        <thead><tr><th>층</th>{열들.map((z) => <th key={z.id}>{z.이름}</th>)}</tr></thead>
        <tbody>{층들.map((f) => (
          <tr key={f} className={f === 층 ? 'now' : ''}>
            <th><button type="button" className="gmd-link" onClick={() => 누름(열들.map((z) => f + '|' + z.id).filter((k) => B.Q.칸.has(k)))}>{층글(f)}</button></th>
            {열들.map((z) => { const c = 칸(f, z.id); if (!c) return <td key={z.id} className="muted">—</td>; const st = 칸상태(B, c.열쇠); const n = B.상태.get(c.열쇠); return (
              <td key={z.id}><button type="button" className={'gmd-gs-cell ' + st} style={{ borderColor: css(기성색들[st]) }} onClick={() => 누름([c.열쇠])} aria-pressed={st === '금회'} title={층글(f) + ' ' + c.구간이름 + ' — 콘크리트 ' + 수글(c.합.콘크리트) + ' ㎥ · 거푸집 ' + 수글(c.합.거푸집, 2) + ' ㎡ · 철근 ' + 수글(c.합.철근 / 1000, 3) + ' t'}>
                <b>{st === '안함' ? '·' : n + '회'}</b><span>{수글(c.합.콘크리트, 1)} ㎥</span>
              </button></td>) })}
          </tr>))}</tbody>
      </table></div>
      <p className="muted gmd-p gmd-gs-legend"><span style={{ color: css(기성색들.금회) }}>■ 금회</span> · <span style={{ color: css(기성색들.전회) }}>■ 전회</span> · <span style={{ color: css(기성색들.뒤) }}>■ 뒤 회차</span> · <span style={{ color: css(기성색들.안함) }}>■ 안 함</span>
        {set기성색 && <label className="gmd-kv" style={{ marginLeft: 10 }}><input type="checkbox" checked={!!기성색} onChange={(e) => set기성색(e.target.checked)} /> 🧊 3D 도 기성 색</label>}
        {set기성색 && 세우기로 && <button type="button" className="gmd-link" onClick={() => { set기성색(true); 세우기로() }}>3D 로 보기 →</button>}</p>

      <h2 className="gmd-h">기성 내역 — {B.회 ? B.회 + '회' + (B.날짜 ? ' (' + B.날짜 + ')' : '') : '회차 없음'}</h2>
      {!B.줄.length ? <p className="muted">고른 갈래가 없습니다.</p> : (
        <div className="gmd-tablewrap"><table className="gmd-table gmd-gs-table">
          <thead><tr><th>갈래</th><th>부재</th><th>단위</th><th>모델 전체</th><th>전회 누계</th><th>금회</th><th>누계</th><th>잔여</th><th>진도</th><th>금회 금액</th><th>누계 금액</th></tr></thead>
          <tbody>
            {B.줄.map((r, i) => <tr key={i} className={r.자리없음 ? 'muted' : ''}><td>{r.갈래}</td><td>{r.자리없음 ? '자리 없는 물량(덧줄 등)' : r.종류}</td><td>{r.단위}</td><td className="num">{수글(r.전체, 자(r.단위))}</td><td className="num">{수글(r.전회, 자(r.단위))}</td><td className="num"><b>{수글(r.금회, 자(r.단위))}</b></td><td className="num">{수글(r.누계, 자(r.단위))}</td><td className="num">{수글(r.잔여, 자(r.단위))}</td><td className="num">{r.자리없음 ? '' : 수글(r.율 * 100, 1) + '%'}</td><td className="num">{r.단가 ? 원글(r.금회금액) : ''}</td><td className="num">{r.단가 ? 원글(r.누계금액) : ''}</td></tr>)}
            {Object.values(B.합).map((h) => <tr key={'h' + h.갈래} className="sum"><td>{h.갈래} 소계</td><td></td><td>{h.단위}</td><td className="num">{수글(h.전체, 자(h.단위))}</td><td className="num">{수글(h.전회, 자(h.단위))}</td><td className="num"><b>{수글(h.금회, 자(h.단위))}</b></td><td className="num">{수글(h.누계, 자(h.단위))}</td><td className="num">{수글(h.잔여, 자(h.단위))}</td><td className="num">{수글(h.율 * 100, 1)}%</td><td className="num">{B.단가[h.갈래] ? 원글(h.금회금액) : ''}</td><td className="num">{B.단가[h.갈래] ? 원글(h.누계금액) : ''}</td></tr>)}
            {Object.keys(B.단가 || {}).some((k) => B.합[k]) && <tr className="sum"><td>합계</td><td colSpan={8}></td><td className="num"><b>{원글(B.금액.금회)}</b></td><td className="num"><b>{원글(B.금액.누계)}</b></td></tr>}
          </tbody>
        </table></div>
      )}
      <div className="gmd-top">
        <button type="button" className="btn" style={{ width: 'auto' }} onClick={엑셀받기} disabled={!!받는중 || !회차.length}>{받는중 ? '만드는 중…' : '📊 엑셀(기성 시트 함께)'}</button>
        <span className="muted gmd-p">모델 엑셀에 «기성내역({B.회 || 'n'}회)» · «기성칸(층×구간)» · «기성회차» 시트가 들어갑니다 — 받기 전에 한 번 더 셈해 보고 받습니다.</span>
      </div>

      <h2 className="gmd-h">기성 도면</h2>
      <div className="gmd-row gmd-gs-floors">{층들.map((f) => <button key={f} type="button" className={'gmd-gs-chip' + (f === 도면f ? ' on' : '')} onClick={() => set도면층(f)}>{층글(f)}</button>)}
        <button type="button" className="btn line sm" style={{ width: 'auto', marginLeft: 'auto' }} onClick={그림받기} disabled={!B.회}>⬇ 기성 도면(PNG)</button></div>
      <기성평면 M={M} S={S} B={B} 층={도면f} svgRef={svgRef} />
    </div>
  )
}

/** 기성 도면 — 그 층 부재를 칸 상태 색으로(평면) · 구간 네모 · 이름 */
function 기성평면({ M, S, B, 층, svgRef }) {
  const 부 = useMemo(() => [...S.G.기.values()].filter((g) => g.o.층 === 층), [S, 층])
  const 상 = (g) => { const k = B.Q.어디.get(g.id); return k ? 칸상태(B, k) : '안함' }
  const 점들 = []
  for (const g of 부) {
    if (g.o.종류 === '슬라브') { 점들.push([g.X0, g.Y0], [g.X1, g.Y1]); continue }
    if (Array.isArray(g.판)) { for (const q of g.판) 점들.push([+q[0], +q[1]]); continue }
    if (g.사선) { 점들.push(g.p0, g.p1); continue }
    if (g.o.종류 === '보' || g.o.종류 === '벽') { if (g.축 === 'x') 점들.push([g.s0, g.c], [g.s1, g.c]); else 점들.push([g.c, g.s0], [g.c, g.s1]); continue }
    if (Number.isFinite(g.x)) 점들.push([g.x - (g.a || 0) / 2, g.y - (g.b || 0) / 2], [g.x + (g.a || 0) / 2, g.y + (g.b || 0) / 2])
  }
  for (const z of M.구간 || []) 점들.push([z.판[0], z.판[1]], [z.판[2], z.판[3]])
  if (!점들.length) return <p className="muted">이 층에 부재가 없습니다.</p>
  const xs = 점들.map((p) => p[0]), ys = 점들.map((p) => p[1])
  const X0 = Math.min(...xs), X1 = Math.max(...xs), Y0 = Math.min(...ys), Y1 = Math.max(...ys)
  const 큰 = Math.max(X1 - X0, Y1 - Y0, 1000), 여 = 큰 * 0.06 + 300, 글 = 큰 / 40 + 120
  const vb = (X0 - 여) + ' ' + (-(Y1 + 여 + 글 * 1.6)) + ' ' + (X1 - X0 + 여 * 2) + ' ' + (Y1 - Y0 + 여 * 2 + 글 * 1.6)
  const 색 = (s) => css(기성색들[s])
  const 그림 = (g) => {
    const s = 상(g), c = 색(s)
    if (g.o.종류 === '슬라브') return <rect key={g.id} x={g.X0} y={-g.Y1} width={g.X1 - g.X0} height={g.Y1 - g.Y0} fill={c} fillOpacity={s === '안함' ? 0.25 : 0.32} stroke={c} strokeWidth={큰 / 900} />
    if (Array.isArray(g.판) && g.판.length >= 3) return <polygon key={g.id} points={g.판.map((q) => q[0] + ',' + (-q[1])).join(' ')} fill={c} fillOpacity={0.35} stroke={c} strokeWidth={큰 / 700} />
    if (g.사선) return <line key={g.id} x1={g.p0[0]} y1={-g.p0[1]} x2={g.p1[0]} y2={-g.p1[1]} stroke={c} strokeWidth={Math.max(g.W || g.T || 200, 큰 / 300)} />
    if (g.o.종류 === '보' || g.o.종류 === '벽') { const w = Math.max(g.W || g.T || 200, 큰 / 300); return g.축 === 'x' ? <line key={g.id} x1={g.s0} y1={-g.c} x2={g.s1} y2={-g.c} stroke={c} strokeWidth={w} /> : <line key={g.id} x1={g.c} y1={-g.s0} x2={g.c} y2={-g.s1} stroke={c} strokeWidth={w} /> }
    if (Number.isFinite(g.x)) return <rect key={g.id} x={g.x - (g.a || 400) / 2} y={-(g.y + (g.b || 400) / 2)} width={g.a || 400} height={g.b || 400} fill={c} stroke="#333" strokeWidth={큰 / 1500} />
    return null
  }
  const 차례 = { 슬라브: 0, 기초: 1, 계단: 2, 벽: 3, 보: 4, 기둥: 5 }
  return (
    <div className="gmd-gs-plan">
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={vb} className="gmd-gs-svg" role="img" aria-label={층 + '층 기성 도면'}>
        <rect x={X0 - 여} y={-(Y1 + 여 + 글 * 1.6)} width={X1 - X0 + 여 * 2} height={Y1 - Y0 + 여 * 2 + 글 * 1.6} fill="#fff" />
        <text x={X0 - 여 * 0.6} y={-(Y1 + 여 + 글 * 0.4)} fontSize={글} fill="#222">{층글(층)} 기성 도면 — {B.회 ? B.회 + '회' + (B.날짜 ? ' (' + B.날짜 + ')' : '') : ''} · <tspan fill={색('금회')}>■ 금회</tspan> <tspan fill={색('전회')}>■ 전회</tspan> <tspan fill={색('뒤')}>■ 뒤 회차</tspan> <tspan fill="#9aa0a8">■ 안 함</tspan></text>
        {[...부].sort((a, b) => (차례[a.o.종류] ?? 9) - (차례[b.o.종류] ?? 9)).map(그림)}
        {(M.구간 || []).map((z) => <g key={z.id}><rect x={z.판[0]} y={-z.판[3]} width={z.판[2] - z.판[0]} height={z.판[3] - z.판[1]} fill="none" stroke="#111" strokeDasharray={큰 / 120 + ' ' + 큰 / 200} strokeWidth={큰 / 500} /><text x={z.판[0] + 글 * 0.3} y={-z.판[3] + 글 * 1.1} fontSize={글 * 0.9} fill="#111">▭ {z.이름}</text></g>)}
      </svg>
    </div>
  )
}
