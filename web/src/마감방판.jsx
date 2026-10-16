/**
 * 🏠 마감 — 도면에서 찾은 방: 🎯 내역 대조(바닥) · 📐 설계 면적 검산 · 🧊 3D (G298 · 2026-10-16)
 *
 * 소장님: 「순서대로 해줘. 3D 가능하게」 → 「이제까지 만든 도구 이용해서 최대한 차이 없게 만들어 봐」
 * ■ 자동으로 찾은 방(③ 실 줄의 _방 — 길 · 안목 · 벽 중심 · 설계 면적 · 다각형)이 있을 때만 보입니다.
 * ■ 🎯 내역 대조: 계약 내역서(.xlsx)를 넣으면 «바닥 마감» 줄 합과 방 바닥 넓이 합(안목 · 벽 중심)을 무리마다 견줌(lib/마감대조.js).
 *   내역서는 이 브라우저 안에서만 읽습니다(어디로도 안 올라감).
 * ■ 📐 검산: 설계자가 적은 면적(인쇄 안 하는 면적 선 · «35.42 m2» 글)과 벽 중심 넓이를 방마다.
 * ■ 🧊 3D: 층마다 판 제목 자리로 맞춰 쌓음 · 바닥 판(무리 색) + 천장고까지 비친 방 · 누르면 그 방.
 * 📊 세기(안 보임): |마감|방판열기 · |마감|내역대조 · |마감|검산 · |마감|3D · |마감|3D방
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 내역읽기 } from './lib/내역대조.js'
import { 마감대조, 방무리, 단면천장고, 천장고찾기 } from './lib/마감대조.js'
import { 실이름인가, 실키 } from './lib/도면전부.js'
import { 도면읽어오기 } from './도면판.jsx'
import { 층높이찾기 } from './lib/building3d.js'
import { 부재보기 } from './lib/bim3d.js'
import { 세기 } from './lib/받은수.jsx'

const 수 = (v) => { const n = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : 0 }
const 쉼 = (n, d = 0) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n || 0)
const 율글 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? '—' : (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%')
const 율색 = (v) => (v === null || !Number.isFinite(v) ? '' : Math.abs(v) <= 3 ? 'mb-ok' : Math.abs(v) <= 8 ? 'mb-mid' : 'mb-bad')
const 무리색 = { 화장실: [0.40, 0.80, 0.86], 홀복도: [0.96, 0.66, 0.30], 계단: [0.62, 0.64, 0.70], 그밖: [0.45, 0.76, 0.52], 뺌: [0.35, 0.36, 0.40] }
const 무리말 = { 화장실: '화장실', 홀복도: '홀 · 복도', 계단: '계단', 그밖: '그 밖', 뺌: '샤프트 · 승강로' }
const 층차례 = (f) => (/^B(\d+)/i.test(f) ? -Number(String(f).slice(1)) : /^\d+$/.test(f) ? Number(f) : /^(RF|PH)$/i.test(f) ? 90 : 0)
const 어두움 = () => { try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch (e) { return false } }

export default function 마감방판({ 공사, set공사 }) {
  const 방 = useMemo(() => (공사.실 || []).map((r, i) => ({ r, i })).filter((x) => x.r && x.r._방), [공사.실])
  const [열림, set열림] = useState(false)
  const [보기, set보기] = useState('대조')
  const [내역, set내역] = useState(null)
  const [내역말, set내역말] = useState('')
  const 파일칸 = useRef(null)
  const 단면칸 = useRef(null)
  const [단면말, set단면말] = useState('')
  const 합 = useMemo(() => {
    let 안 = 0, 중 = 0, 견 = 0, 차 = 0
    for (const { r } of 방) {
      const n = 수(r.개수) || 1, b = r._방
      if (방무리(r) === null) continue
      안 += 수(r.면적) * n
      중 += 수(b.중심면적 || b.면적선 || r.면적) * n
      const 설 = 수(b.면적선 || b.도면면적), 나 = 수(b.중심면적)
      if (설 > 0 && 나 > 0 && b.면적선) { 견++; 차 += Math.abs(나 - 설) / 설 * 100 }
    }
    return { 안, 중, 견, 평균: 견 ? 차 / 견 : null }
  }, [방])
  const 대조 = useMemo(() => (내역 ? 마감대조(공사.실, 내역, { 창호: 공사.창호, 기본천장고: 공사.기준 && 공사.기준.천장고, 층높이: 공사.층높이 }) : null), [내역, 공사.실, 공사.창호, 공사.기준, 공사.층높이])
  if (!방.length) return null

  const 내역받기 = async (files) => {
    const f = files && files[0]
    if (!f) return
    set내역말('읽는 중…')
    try {
      const 내 = 내역읽기(new Uint8Array(await f.arrayBuffer()), f.name)
      set내역(내); set내역말(f.name); 세기('|마감|내역대조')
    } catch (e) { set내역(null); set내역말('⚠️ ' + e.message) }
  }
  const 열기 = () => { set열림((v) => !v); if (!열림) 세기('|마감|방판열기') }
  /* 📐 G298 ③ 단면도(«CH=2700» 글) → 방마다 천장고 — 비어 있는 칸만 채움 */
  const 단면받기 = async (files) => {
    const f = files && files[0]
    if (!f || !set공사) return
    set단면말('단면도 읽는 중…')
    try {
      const { 모델: S } = await 도면읽어오기(await f.arrayBuffer(), f.name, (d) => set단면말('단면도 — ' + (d.msg || '') + (d.p ? ' ' + Math.round(d.p * 100) + '%' : '')))
      const 표 = 단면천장고(S, (s) => 실이름인가(s), 실키)
      /* 🪜 G299 ③ 단면도의 레벨(«2nd FL / 1FL +4,100») — 층마다 바닥 높이(m) → 계단 챌판(계단 폭 × 위층까지 높이) */
      let 레벨 = null
      try {
        const T = S.T, texts = []
        for (let i = 0; i < T.s.length; i++) texts.push({ s: String(T.s[i] || ''), x: T.x[i], y: T.y[i], h: T.h[i] || 0, ly: '' })
        const h = 층높이찾기([{ 이름: f.name, texts }]).높이 || {}
        const 값 = Object.fromEntries(Object.entries(h).filter(([, v]) => Number.isFinite(+v)).map(([k, v]) => [k, Math.round(+v) / 1000]))
        if (Object.keys(값).length >= 2) 레벨 = 값
      } catch (e) { /* 레벨 없음 */ }
      if (레벨) set공사((P) => ({ ...P, 층높이: 레벨 }))
      if (!표.size) { set단면말(레벨 ? '📐 단면도에서 층 높이(' + Object.entries(레벨).map(([k, v]) => k + ' ' + v).join(' · ') + ' m)만 읽었습니다 — «CH=2700» 같은 천장고 글 곁의 실 이름은 못 찾았습니다' : '⚠️ 이 도면에서 «CH=2700» 같은 천장고 글 곁의 실 이름을 못 찾았습니다'); return }
      /* 단면도에 이름이 없는 방(이름 없는 공간 · 다목적실 …)은 «가장 흔한» 천장고로 봄 — 단면도로 찾은 방들의 벽 길이(둘레 × 개수)가 가장 긴 천장고(벽 넓이에 쓰이므로) · 근거에 적어 고쳐 쓰게 */
      const 셈 = new Map()
      for (const r of 공사.실 || []) {
        if (!r || (r._방 && (r._방.샤프트 || r._방.마감없음))) continue
        const a = String(r.실명 || '').trim() && 천장고찾기(표, r.실명, 실키)
        if (a) 셈.set(a.m, (셈.get(a.m) || 0) + (Math.max(0, +r.둘레 || 0) * Math.max(1, +r.개수 || 1) || 1e-6))
      }
      if (!셈.size) for (const a of 표.values()) 셈.set(a.m, (셈.get(a.m) || 0) + (a.수 || 1))
      const 흔한 = [...셈].sort((x, y) => y[1] - x[1] || y[0] - x[0])[0][0]
      /* 방 하나 → [새 줄, 무엇] — 순수 함수(세기는 지금 실로, 바꾸기는 set공사 안에서) */
      const 고침 = (r) => {
        if (!r || !String(r.실명 || '').trim() || (r._방 && (r._방.샤프트 || r._방.마감없음))) return [r, '']
        const a = 천장고찾기(표, r.실명, 실키)
        if (String(r.천장고 || '').trim()) return [r, a ? '같음' : '']
        if (!a) return [{ ...r, 천장고: String(흔한), _방: { ...(r._방 || {}), 천장고근거: '단면도에 이 실 이름이 없어 가장 흔한 CH ' + 흔한 + ' m(단면도로 찾은 방들의 벽 길이가 가장 긴 천장고)로 봄 — 고쳐 쓰십시오' } }, '흔한']
        return [{ ...r, 천장고: String(a.m), _방: { ...(r._방 || {}), 천장고근거: '단면도 ' + a.이름 + ' CH ' + a.m + ' m' + (a.수 > 1 ? ' (' + a.수 + '곳)' : '') } }, '채움']
      }
      const 무엇 = (공사.실 || []).map((r) => 고침(r)[1])
      const 채움 = 무엇.filter((x) => x === '채움').length, 같음 = 무엇.filter((x) => x === '같음').length, 흔채 = 무엇.filter((x) => x === '흔한').length
      set공사((P) => ({ ...P, 실: (P.실 || []).map((r) => 고침(r)[0]) }))
      세기('|마감|단면천장고')
      set단면말('📐 단면도에서 실 ' + 표.size + '곳의 천장고를 읽어 빈 칸 ' + 채움 + '개를 채웠습니다' + (흔채 ? ' · 단면도에 이름이 없는 ' + 흔채 + '개는 가장 흔한 ' + 흔한 + ' m 로 봄(고쳐 쓰십시오)' : '') + (같음 ? ' · 이미 적힌 ' + 같음 + '개는 그대로' : '') + ' — ' + [...표.values()].slice(0, 8).map((a) => a.이름 + ' ' + a.m).join(' · ') + (표.size > 8 ? ' …' : '') + (레벨 ? ' · 층 높이 ' + Object.entries(레벨).sort((x, y) => x[1] - y[1]).map(([k, v]) => k + ' ' + v).join(' · ') + ' m(계단 챌판에 씀)' : ''))
    } catch (e) { set단면말('⚠️ 단면도를 읽지 못했습니다 — ' + (e && e.message ? e.message : '')) }
  }

  /* 가장 가까운 셈 — 무리마다 안목 · 벽 중심 중 내역에 가까운 것(내역서를 셀 때 쓴 기준을 짐작) */
  const 가까운 = 대조 ? (() => {
    const 무 = 대조.줄.filter((x) => ['화장실', '홀복도', '그밖'].includes(x.무리) && x.내역 > 0)
    if (!무.length) return null
    let 도구 = 0, 내 = 0
    const 고른 = 무.map((x) => { const 안 = Math.abs(x.도구 - x.내역) <= Math.abs(x.중심 - x.내역); 도구 += 안 ? x.도구 : x.중심; 내 += x.내역; return x.이름 + ' ' + (안 ? '안목' : '벽 중심') })
    return { 도구, 내, 율: 내 > 0 ? ((도구 - 내) / 내) * 100 : null, 고른 }
  })() : null

  return (
    <div className="card no-print mb-card">
      <button type="button" className="mb-head" onClick={열기} aria-expanded={열림}>
        <span className="mb-title">🏠 도면에서 찾은 방 <b>{방.length}</b>개</span>
        <span className="mb-sum">바닥 안목 <b>{쉼(합.안, 1)}</b> ㎡ · 벽 중심 <b>{쉼(합.중, 1)}</b> ㎡{합.평균 !== null ? <> · 설계 면적 선 {합.견}곳과 평균 ±{합.평균.toFixed(1)}%</> : null}</span>
        <span className="mb-open">{열림 ? '접기 ▲' : '🎯 내역 대조 · 📐 검산 · 🧊 3D ▼'}</span>
      </button>
      {열림 && (
        <>
          <div className="tp-subtabs" style={{ marginTop: 8 }}>
            {[['대조', '🎯 내역 대조'], ['검산', '📐 설계 면적 검산'], ['3D', '🧊 3D']].map(([k, t]) => (
              <button key={k} type="button" className={'chip' + (보기 === k ? ' on' : '')} onClick={() => { set보기(k); if (k === '검산') 세기('|마감|검산'); if (k === '3D') 세기('|마감|3D') }}>{t}</button>
            ))}
          </div>
          {set공사 && (
            <div className="mb-ch">
              <button type="button" className="btn line sm" onClick={() => 단면칸.current?.click()}>📐 단면도로 천장고 채우기</button>
              <span className="muted">단면도의 «CH=2700» 글 곁 실 이름으로 · 빈 천장고 칸만</span>
              <input ref={단면칸} type="file" accept=".dxf,.DXF,.dwg,.DWG" className="sr-only" tabIndex={-1} onChange={(e) => { 단면받기(e.target.files); e.target.value = '' }} />
              {단면말 && <div className="mb-chsay">{단면말}</div>}
            </div>
          )}
          {보기 === '대조' && (
            <div className="mb-sec">
              <p className="muted gg-hint">계약 내역서(.xlsx)를 넣으면 <b>바닥 마감 줄</b>(타일 · 비닐계타일 · 카펫 · 석재 · 후로링 · 에폭시 …)의 합과 방 바닥 넓이를 견줍니다. 마감표(방마다 재료)가 없어도 됩니다.
                바탕(모르타르 · 방수 · 단열) · 자재 줄 · 외부 바닥은 빼고, 같은 줄이 여러 시트에 있으면 한 번만 셉니다. <b>내역서는 이 브라우저 안에서만 읽습니다.</b></p>
              <div className="btn-row" style={{ flexWrap: 'wrap' }}>
                <button type="button" className="btn sm" onClick={() => 파일칸.current?.click()}>📑 계약 내역서 넣기</button>
                {내역말 && <span className="muted" style={{ fontSize: 12.5, alignSelf: 'center' }}>{내역말}</span>}
              </div>
              <input ref={파일칸} type="file" accept=".xlsx,.XLSX,.csv,.CSV" className="sr-only" tabIndex={-1} onChange={(e) => { 내역받기(e.target.files); e.target.value = '' }} />
              {대조 && (
                <>
                  {가까운 && 가까운.율 !== null && (
                    <div className={'mb-best ' + 율색(가까운.율)}>🎯 가장 가까운 셈 — <b>{쉼(가까운.도구, 1)}</b> ㎡ ↔ 내역 <b>{쉼(가까운.내, 1)}</b> ㎡ (<b>{율글(가까운.율)}</b>)
                      <div className="muted" style={{ fontSize: 12 }}>{가까운.고른.join(' · ')} — 내역서가 방마다 어떤 넓이로 셌는지 짐작한 것입니다.</div></div>
                  )}
                  <div className="gg-wrap"><table className="gg-r mb-t">
                    <thead><tr><th>무리</th><th className="r">안목</th><th className="r">차이</th><th className="r">벽 중심</th><th className="r">차이</th><th className="r">내역</th></tr></thead>
                    <tbody>{대조.줄.map((x) => (
                      <tr key={x.무리} className={x.참고 ? 'mb-ref' : ''}>
                        <td>{x.이름}</td>
                        <td className="r">{쉼(x.도구, 1)}</td><td className={'r ' + 율색(x.차이율)}>{율글(x.차이율)}</td>
                        <td className="r">{x.중심 === null ? '—' : 쉼(x.중심, 1)}</td><td className={'r ' + 율색(x.중심율)}>{x.중심 === null ? '' : 율글(x.중심율)}</td>
                        <td className="r"><b>{쉼(x.내역, 1)}</b></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                  {(() => { const w = 대조.줄.find((x) => x.무리 === '벽'); return w && w.덧 ? (
                    <p className="muted mb-note">🧱 벽(참고) = 둘레 × 천장고 {쉼(w.덧.둘레높이, 1)} − 문 {쉼(w.덧.문, 1)}(도면 문 열림 호 · 높이 2.1 m) − 창 {쉼(w.덧.창, 1)}(내역 창호 목록 넓이 — 도면에 창 크기가 없어서) ㎡
                      {w.덧.기본씀 ? <> · 천장고가 빈 방 {w.덧.기본씀}곳은 기본 {w.덧.기본H} m (📐 단면도로 채우면 더 맞음)</> : null} · 천장(참고) = 방 바닥 넓이 ↔ 내역 천장틀 줄 + 노출 천장 마무리.</p>
                  ) : null })()}
                  {(() => { const c = 대조.줄.find((x) => x.무리 === '계단'); return c && c.덧 ? (
                    <p className="muted mb-note">🪜 계단(참고) = 평면 넓이 {쉼(c.덧.평면, 1)}{c.덧.챌판 > 0 ? <> + 챌판 {쉼(c.덧.챌판, 1)}(계단 폭 = 평면 디딤판 선 · × 위층까지 높이 — 단면도 레벨)</> : null} ㎡
                      {!c.덧.단면 ? <> · 📐 단면도를 넣으면 층 높이로 챌판까지 셉니다</> : null}{c.덧.폭없음 ? <> · 디딤판 선을 못 찾은 계단실 {c.덧.폭없음}곳은 평면 넓이만</> : null}{c.덧.높없음 ? <> · 위층 높이를 모르는 계단실 {c.덧.높없음}곳(맨 위층)은 평면 넓이만</> : null}.</p>
                  ) : null })()}
                  {!대조.바닥줄 && <p className="mb-warn">⚠️ 내역서에서 바닥 마감 줄을 못 찾았습니다 — 시트 이름 · 머리(품명 · 규격 · 단위 · 수량)를 확인하십시오.</p>}
                  <details className="mb-more"><summary>무리마다 든 방 · 내역 줄 보기</summary>
                    {대조.줄.map((x) => (
                      <div key={x.무리} className="mb-grp"><b>{x.이름}</b>
                        <div className="muted">방 {x.방.length}: {x.방.join(', ') || '—'}</div>
                        <div className="muted">내역 {x.내역줄.length}줄: {x.내역줄.map((y) => y.품명 + (y.규격 ? ' (' + y.규격 + ')' : '') + ' ' + 쉼(y.수량, 1)).join(' / ') || '—'}</div>
                      </div>
                    ))}
                    {대조.뺀방.length > 0 && <div className="muted mb-grp">뺀 방(샤프트 · 승강로): {대조.뺀방.join(', ')}</div>}
                    <div className="muted mb-grp">계단(참고): 내역 «계단부» 는 디딤 · 챌판을 펼친 넓이라 계단실 평면 넓이보다 큽니다. 계단실 평면 넓이는 바닥 합에 넣었습니다.</div>
                  </details>
                </>
              )}
            </div>
          )}
          {보기 === '검산' && <검산표 방={방} />}
          {보기 === '3D' && <방3D 방={방} 공사={공사} />}
        </>
      )}
    </div>
  )
}

function 검산표({ 방 }) {
  const 줄 = 방.map(({ r }) => {
    const b = r._방, 설 = 수(b.면적선) || 수(b.도면면적), 중 = 수(b.중심면적)
    return { r, b, 설, 중, 안: 수(r.면적), 율: 설 > 0 && 중 > 0 ? ((중 - 설) / 설) * 100 : null, 선: !!b.면적선 }
  }).filter((x) => x.설 > 0).sort((a, b) => (b.선 - a.선) || Math.abs(a.율 ?? 0) - Math.abs(b.율 ?? 0))     /* 면적 선(믿을 만함) 먼저 · 차이 작은 것부터 */
  const 평 = (l) => { const v = l.filter((x) => x.율 !== null); return v.length ? { n: v.length, 율: v.reduce((a, x) => a + Math.abs(x.율), 0) / v.length } : null }
  const 선평 = 평(줄.filter((x) => x.선)), 글평 = 평(줄.filter((x) => !x.선))
  return (
    <div className="mb-sec">
      <p className="muted gg-hint">설계자가 적은 면적(인쇄 안 하는 <b>면적 선</b> · 방 안의 «35.42 m2» 글)은 보통 <b>벽 중심</b> 넓이입니다. 도구가 찾은 방을 벽 두께 반(120 mm까지)만큼 넓힌 «벽 중심» 과 견줍니다. 마감 수량은 <b>안목</b>(벽 안쪽)으로 셉니다.
        <br />면적 글은 도면이 고쳐지기 전 것일 수 있습니다 — 면적 선(✓)이 더 믿을 만합니다.</p>
      {(선평 || 글평) && <div className="mb-best">{선평 && <>면적 선 <b>{선평.n}</b>곳 — 벽 중심과 평균 <b>±{선평.율.toFixed(1)}%</b></>}{선평 && 글평 ? ' · ' : ''}{글평 && <>면적 글 {글평.n}곳 — 평균 ±{글평.율.toFixed(1)}% <span className="muted">(글은 옛 것일 수 있음)</span></>}</div>}
      {!줄.length ? <p className="muted">설계 면적이 적힌 방이 없습니다.</p> : (
        <div className="gg-wrap"><table className="gg-r mb-t">
          <thead><tr><th>층</th><th>실</th><th className="r">안목</th><th className="r">벽 중심</th><th className="r">설계</th><th className="r">차이</th></tr></thead>
          <tbody>{줄.map((x, k) => (
            <tr key={k}><td>{x.r.층}</td><td>{x.r.실명}</td><td className="r">{쉼(x.안, 2)}</td><td className="r">{x.중 ? 쉼(x.중, 2) : '—'}</td>
              <td className="r">{쉼(x.설, 2)} <span className="muted" style={{ fontSize: 11 }}>{x.선 ? '✓선' : '글'}</span></td><td className={'r ' + 율색(x.율)}>{율글(x.율)}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  )
}

function 방3D({ 방, 공사 }) {
  const 판Ref = useRef(null)
  const 보기Ref = useRef(null)
  const [층고, set층고] = useState('4.0')
  const [고른, set고른] = useState(null)
  const [glErr, setGlErr] = useState('')
  /* 층마다 맞춤점(판 제목 자리 · 없으면 그 층 방들의 왼쪽 아래) */
  const 부재 = useMemo(() => {
    const 맞춤 = new Map()
    for (const { r } of 방) {
      const p = r._방.점
      if (!p || p.length < 3) continue
      const f = r.층 || ''
      if (r._방.닻) { if (!맞춤.has(f)) 맞춤.set(f, { x: r._방.닻[0], y: r._방.닻[1], 닻: true }); continue }
      const a = 맞춤.get(f) || { x: Infinity, y: Infinity }
      if (a.닻) continue
      for (const q of p) { if (q[0] < a.x) a.x = q[0]; if (q[1] < a.y) a.y = q[1] }
      맞춤.set(f, a)
    }
    const H = Math.max(2, Math.min(10, 수(층고) || 4)) * 1000
    const 기본천장 = (수(공사.기준 && 공사.기준.천장고) || 2.7) * 1000
    const out = []
    for (const { r, i } of 방) {
      const b = r._방, p = b.점
      if (!p || p.length < 3) continue
      const k = b.k || 1
      const m = b.닻 ? { x: b.닻[0], y: b.닻[1] } : 맞춤.get(r.층 || '') || { x: 0, y: 0 }     /* 방마다 제 판 제목 자리로(같은 층 판이 둘이어도) */
      const 판 = p.map((q) => [(q[0] - m.x) * k, (q[1] - m.y) * k])
      const z = (층차례(r.층 || '') - 1) * H
      const g = 방무리(r) || '뺌'
      const ch = Math.min(H * 2.2, (수(r.천장고) * 1000) || (b.위뚫림 ? H + 기본천장 : 기본천장))
      out.push({ id: i * 2, 판, z0: z, z1: z + 80, 색: 무리색[g] })
      out.push({ id: i * 2 + 1, 판, z0: z + 80, z1: z + ch, 색: 무리색[g], 비침: 0.16 })
    }
    return out
  }, [방, 층고, 공사.기준])
  useEffect(() => {
    if (!판Ref.current) return
    if (!보기Ref.current) {
      try { 보기Ref.current = new 부재보기(판Ref.current) } catch (e) { setGlErr('이 브라우저는 3D(WebGL)를 그리지 못합니다 — 표는 그대로 쓸 수 있습니다.'); return }
      if (어두움()) { const v0 = 보기Ref.current; v0.bg = [0.086, 0.102, 0.129]; v0.bgT = [0.15, 0.17, 0.21]; v0.bgB = [0.06, 0.07, 0.09]; v0.선색 = [0.03, 0.04, 0.05]; v0.선알 = 0.6 }
    }
    const v = 보기Ref.current
    v.set부재(부재, { 바닥: true, 바닥색: 어두움() ? [0.16, 0.18, 0.22] : [0.88, 0.90, 0.92] })
    v.fit('tilt')
    v.onPick = (id) => { if (id >= 0) { set고른(Math.floor(id / 2)); v.set고름([id]); 세기('|마감|3D방') } else { set고른(null); v.set고름([]) } }
  }, [부재])
  useEffect(() => () => { if (보기Ref.current) { 보기Ref.current.dispose(); 보기Ref.current = null } }, [])
  const r = 고른 !== null ? (공사.실 || [])[고른] : null
  return (
    <div className="mb-sec">
      <div className="btn-row" style={{ flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <label className="gg-f mb-h">층 높이 (m)<input value={층고} inputMode="decimal" onChange={(e) => set층고(e.target.value)} /></label>
        {['tilt', 'top'].map((k) => <button key={k} type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.fit(k)}>{k === 'top' ? '⬇ 위에서' : '↗ 비스듬히'}</button>)}
        <span className="mb-legend">{Object.entries(무리말).map(([g, t]) => <span key={g}><i style={{ background: 'rgb(' + 무리색[g].map((c) => Math.round(c * 255)).join(',') + ')' }} />{t}</span>)}</span>
      </div>
      <div className="bim-canvas mb-canvas">
        {glErr ? <div className="dx3-warn" style={{ margin: 12 }}>{glErr}</div> : <canvas ref={판Ref} />}
        <div className="bim-hint">끌기 = 돌리기 · 오른쪽 끌기(두 손가락) = 옮기기 · 휠(벌리기) = 확대 · <b>바닥을 누르면 그 방</b></div>
      </div>
      {r ? (
        <div className="mb-pick"><b>{r.층 ? r.층 + '층 ' : ''}{r.실명}</b> — 안목 {쉼(수(r.면적), 2)} ㎡{r._방.중심면적 ? ' · 벽 중심 ' + 쉼(수(r._방.중심면적), 2) + ' ㎡' : ''} · 둘레 {쉼(수(r.둘레), 2)} m{r.천장고 ? ' · 천장고 ' + r.천장고 + ' m' : ''}{r.비고 ? <div className="muted" style={{ fontSize: 12 }}>{r.비고}</div> : null}</div>
      ) : <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>층은 판 제목(«1층평면도» 등) 자리로 맞춰 쌓았습니다. 비친 덩어리 높이 = 천장고(비면 기본 천장고 · 위가 뚫린 곳은 두 층).</p>}
    </div>
  )
}
