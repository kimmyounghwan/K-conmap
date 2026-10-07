/**
 * 💰 금액 고르기 — 이 금액대 지난 개찰로 본 «그 자리에 넣었다면» 성적 (G185 · 2026-10-07)
 *
 * 소장님: 「이용자들이 금액을 선택해서 최종낙찰금액을 보게 하는 거지」 · 「권장투찰금액하고 낙찰금액하고...비교해보고 ...최종확률」
 *         「선택하도록 해야지. 설명만 하고… 단정적으로 하면 안돼」 · 「비용 고려 해서 만들어 줘」
 * ■ 고르는 것은 이용자 — 줄을 누르면 위 투찰 금액이 그 금액으로 바뀝니다(분위표에 있는 자리는 그 분위 · 없는 자리는 «직접» 투찰률로).
 *   설명은 사실만(«넣지 마십시오 · 하십시오» 같은 글 없음).
 * ■ 소장님 「저런식을 금액제시해서 자세히 만들어 줘 · 비용안들어 가게」 → 20~95분위를 5분위마다 + 권장 — 줄마다 투찰 금액 · 1순위 · 실격(같은 gm.json · 더 받는 것 없음).
 * ■ 숫자는 매일 자동 갱신 때 구운 /data/kb/gm.json(수 KB · lib/금액대성적.js) — 이 칸이 화면에 들어올 때 한 번 받음.
 * ■ 숨은 누적: |금액고르기|보임 · |금액고르기|고름 · |금액고르기|직접
 */
import { Component, useEffect, useRef, useState } from 'react'
import { breakEvenSj, limitAmount, shownBid } from '../lib/bidmath.js'
import { 금액대of, 금액대들, 자리성적, 넓게, 분위z } from '../lib/금액대성적.js'
import { 세기 } from '../lib/받은수.jsx'
import { won } from '../lib/fmt.js'

let 표약속 = null
function 표받기() {
  if (!표약속) {
    표약속 = fetch('/data/kb/gm.json')
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .catch((e) => { 표약속 = null; throw e })
  }
  return 표약속
}
function 보이면(ref, 켜짐) {
  const [보임, set보임] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!켜짐 || !el || 보임) return undefined
    if (typeof IntersectionObserver === 'undefined') { set보임(true); return undefined }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { set보임(true); io.disconnect() } }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, 보임, 켜짐])
  return 보임
}
class 지킴 extends Component {
  constructor(p) { super(p); this.state = { 오류: false } }
  static getDerivedStateFromError() { return { 오류: true } }
  componentDidCatch() { try { 세기('|금액고르기|멈춤') } catch (e) { /* 없음 */ } }
  render() { return this.state.오류 ? null : this.props.children }
}

const 퍼 = (k, n) => (n > 0 ? `${(k / n * 100).toFixed(1)}%` : '-')

const 분위들 = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]
/**
 * props: base · llr · aval · p50(바로투찰 가운데 사정률 sjMid) · sd(그 공고 σ) · aKnown · 지금금액(main) · 지금(pickRate)
 *        고르기(k) — 'rec' · 'qNN' · 'own' / 직접(투찰률) — 분위표에 없는 자리를 «직접» 으로
 *        q후보: { qNN: { rate, 금액 } } · 권장: { rate, 금액 } | null — 바로투찰이 실제로 쓰는 금액 그대로
 */
export default function 금액고르기(props) { return <지킴><안 {...props} /></지킴> }
function 안({ base, llr, aval, p50, sd, aKnown, 지금금액, 지금, 고르기, 직접, q후보, 권장 }) {
  const 자리 = useRef(null)
  const 켜짐 = base > 0 && llr > 0 && sd > 0 && p50 > 0
  const 보임 = 보이면(자리, 켜짐)
  const [표, set표] = useState(null)
  const [상태, set상태] = useState('')
  const 셌음 = useRef(false)
  const 받기 = () => { set상태('ing'); 표받기().then((j) => { set표(j); set상태('') }).catch(() => set상태('err')) }
  useEffect(() => {
    if (!보임 || 표) return
    if (!셌음.current) { 셌음.current = true; 세기('|금액고르기|보임') }
    받기()
  }, [보임])   // eslint-disable-line react-hooks/exhaustive-deps
  if (!켜짐) return <div ref={자리} />
  const i = 금액대of(base)
  const 칸 = 표 && i >= 0 ? 표.b[i] : null
  const z = (m) => { const s = breakEvenSj(base, llr, aval, m); return s == null || !표 ? null : (s - 표.p50) / sd }
  /* 줄 — 분위표에 있는 자리는 바로투찰 금액 그대로, 없는 자리는 같은 길(사정률 → 하한 올림 → 투찰률 올림)로 셈 */
  const 줄들 = 분위들.map((q) => {
    const k = `q${q}`
    if (q후보 && q후보[k]) return { k, q, 이름: `${q}분위`, rate: q후보[k].rate, 금액: q후보[k].금액, 표에있음: true }
    const sj = Math.round((p50 + 분위z(q) * sd) * 1000) / 1000
    const sb = shownBid(base, p50, Math.ceil(limitAmount(base, sj, llr, aval)))
    return sb ? { k: `z${q}`, q, 이름: `${q}분위`, rate: sb.rate, 금액: sb.amt, 표에있음: false } : null
  }).filter(Boolean)
  if (권장 && 권장.금액 > 0) {
    /* A값을 몰라 권장 = 95분위처럼 금액이 같은 줄이 있으면 한 줄로(«95분위 · 권장») — 같은 금액이 두 줄로 나오지 않게 */
    const 같은 = 줄들.find((c) => c.금액 === 권장.금액)
    if (같은) Object.assign(같은, { k: 'rec', 권장도: true, rate: 권장.rate, 표에있음: true })
    else 줄들.push({ k: 'rec', 이름: '권장', rate: 권장.rate, 금액: 권장.금액, 표에있음: true })
  }
  줄들.sort((x, y) => x.금액 - y.금액 || (x.k === 'rec' ? 1 : -1))
  const 성적of = (c) => {
    if (!칸) return null
    if (c.k === 'rec' && aKnown && 칸.rec) return { n: 칸.n, 실격: 칸.rec[0], 일순: 칸.rec[1] }   /* 권장은 굽기에서 그대로 센 값 */
    return 자리성적(표, i, z(c.금액))
  }
  const 고른줄 = (c) => (c.k === 'rec' ? 지금 === 'rec' : c.표에있음 ? 지금 === c.k : 지금 === 'own' && 지금금액 === c.금액)
  const 누름 = (c) => {
    if (c.표에있음) 고르기(c.k); else 직접(c.rate)
    세기('|금액고르기|고름')
  }
  const 지금성적 = 칸 && 지금금액 > 0 ? 자리성적(표, i, z(지금금액)) : null
  const 적음 = 칸 && 칸.n < 300
  const 가운데 = 줄들.find((c) => c.q === 50)
  const 가운데성적 = 가운데 ? 성적of(가운데) : null
  return (
    <div className="card gm-card" ref={자리}>
      <div className="sec-title" style={{ margin: '0 0 4px' }}>💰 금액 고르기 — 자리별 투찰 금액과 지난 개찰 성적</div>
      {i < 0 ? (
        <p className="cp muted" style={{ margin: 0 }}>100억이 넘는 공사는 종합심사처럼 «하한 위 가장 낮은 금액이 1순위» 가 아닌 공고가 섞여 있어 이 표로 세지 않습니다.</p>
      ) : !표 ? (
        <p className="cp muted" style={{ margin: 0 }}>{상태 === 'err'
          ? <>지난 개찰 성적을 받지 못했습니다 — <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={받기}>다시</button></>
          : '지난 개찰 성적을 받는 중입니다…'}</p>
      ) : !칸 || !(칸.n > 0) ? (
        <p className="cp muted" style={{ margin: 0 }}>«{금액대들[i][2]}» 금액대는 셀 만한 지난 개찰이 없습니다.</p>
      ) : (
        <>
          <p className="cp muted" style={{ margin: '0 0 8px' }}>
            기초금액 {won(base)} → <b>{금액대들[i][2]}</b> · 지난 개찰 <b>{칸.n.toLocaleString('ko-KR')}건</b>({String(표.기간[0]).slice(5).replace('-', '.')}~{String(표.기간[1]).slice(5).replace('-', '.')}) · 참가 가운데 {칸.np}곳
          </p>
          {지금성적 && (
            <div className="gm-now">지금 고른 금액 <b>{won(지금금액)}</b> — 이 자리에 넣었다면 1순위 <b>{퍼(지금성적.일순, 지금성적.n)}</b> · 실격 <b>{퍼(지금성적.실격, 지금성적.n)}</b>
              {지금성적.밖 ? <span className="muted"> (표 끝 자리로 셈)</span> : null}</div>
          )}
          <div className="tp-scroll">
            <table className="tbl gm-tbl">
              <thead><tr><th className="l">자리</th><th>투찰 금액</th><th>1순위</th><th>실격</th></tr></thead>
              <tbody>
                {줄들.map((c) => {
                  const 성 = 성적of(c)
                  const on = 고른줄(c)
                  return (
                    <tr key={c.k} className={(on ? 'on ' : '') + (c.k === 'rec' ? 'rec ' : '') + (c.q === 50 ? 'mid' : '')} onClick={() => 누름(c)}
                      role="button" tabIndex={0} aria-pressed={on} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); 누름(c) } }}>
                      <td className="l">{c.k === 'rec' ? (c.권장도 ? <>{c.이름} <b>· 권장</b></> : <b>권장</b>) : c.이름}{c.q === 50 ? <small> · 보통 낙찰가 근처</small> : null}</td>
                      <td className="amt">{won(c.금액)}</td>
                      <td>{성 ? 퍼(성.일순, 성.n) : '-'}</td>
                      <td>{성 ? 퍼(성.실격, 성.n) : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="gm-btns">
            <button type="button" className={'btn line sm' + (지금 === 'own' ? ' on' : '')} style={{ width: 'auto' }} onClick={() => { 고르기('own'); 세기('|금액고르기|직접') }}>직접 넣기</button>
            <span className="muted">줄을 누르면 위 투찰 금액이 그 금액으로 바뀝니다.</span>
          </div>
          <ul className="gm-why">
            <li>분위가 낮을수록 금액이 낮고, 사정률이 조금만 높게 나와도 하한 아래(실격)가 됩니다.</li>
            <li>분위가 높을수록 하한 아래가 되는 일은 드물지만, 1순위 금액과의 차이는 벌어집니다.</li>
            <li>50분위 근처가 지난 개찰 1순위 금액이 가운데쯤 나온 자리입니다{aKnown ? ' · 권장은 75분위 근처에 0.3%를 더한 금액입니다' : ' · 권장은 A값을 몰라 95분위 근처 금액입니다(전국 가운데 사정률로 셈 · 위 95분위 줄과 조금 다를 수 있음)'}.</li>
          </ul>
          <div className="kb-note muted" style={{ marginTop: 6 }}>
            숫자는 지난 개찰 {칸.n.toLocaleString('ko-KR')}건에 «그 자리의 금액으로 넣었다면» 을 셈한 것입니다 — 실제 낙찰하한 아래면 실격,
            {' '}하한 이상이면서 실제 1순위 금액보다 낮으면 1순위로 봅니다. 같은 금액대라도 공고마다 하한율 · A값 · 참가 업체가 달라, 이번 공고에서 같은 비율로 나온다는 뜻은 아닙니다.
            {적음 && 가운데성적 ? (() => { const [아, 위] = 넓게(가운데성적.일순, 가운데성적.n); return ` 개찰이 적은 금액대라 1순위 비율이 흔들릴 수 있습니다(예: 50분위 1순위 넓게 보면 ${아.toFixed(1)}~${위.toFixed(1)}%).` })() : ''}
          </div>
        </>
      )}
    </div>
  )
}
