/**
 * 📈 승률 곡선 — «💰 금액 고르기» 표를 자리마다 그린 것 (G338 · 2026-10-20)
 *
 * 소장님 「바로입찰 업그레이드 방안 줘」 → 고르심 «①·④ 같이» — ① 금액마다 «1순위 될 확률».
 *   (바로잡음: 표에는 이미 5분위마다 1순위 · 실격이 있었음 → 그 표를 곡선으로 + 참가업체수 띠로 나눠 봄)
 * ■ 숫자는 금액 고르기와 같은 /data/kb/gm.json(금액대 × 자리 101칸 · G338 부터 참가 띠 × 101칸도)
 * ■ 그림 두 장이 가로(자리)를 같이 씁니다 — 위 «1순위가 된 비율» · 아래 «실격 비율»(축이 다른 두 값을 한 그림에 겹치지 않음)
 * ■ 1순위는 칸마다 몇 건뿐이라 이웃 ±0.15 자리를 고르게 펴서 그립니다(lib/금액대성적.js 곡선점들). 표는 펴지 않은 값.
 * ■ 곡선을 누르면 그 자리의 금액이 위 투찰 금액이 됩니다(표 줄을 누른 것과 같은 길 — «직접» 투찰률).
 * ■ 숨은 누적: |승률곡선|보임 · |승률곡선|고름 · |승률곡선|띠
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { breakEvenSj, limitAmount, shownBid, normCdf } from '../lib/bidmath.js'
import { 곡선점들, 참가띠들, 참가띠of, 분위z } from '../lib/금액대성적.js'
import { 세기 } from '../lib/받은수.jsx'
import { won } from '../lib/fmt.js'

const 보는자리 = [분위z(5), 분위z(99)]          // 5 ~ 99분위만 그림(그 밖은 표 끝 칸)
const 분위of = (z) => Math.round(normCdf(z) * 100)
const 좋은끝 = (v) => [2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100].find((x) => x >= v) || 100

function 너비재기(ref) {
  const [w, setW] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const 재기 = () => setW(Math.max(260, Math.round(el.getBoundingClientRect().width)))
    재기()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(재기); ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

/**
 * props: 표(gm.json) · 칸(이 금액대 칸) · 금액대이름 · enp(예상 참가 · 모르면 0) · base · llr · aval · p50 · sd · 지금금액 · 직접(rate)
 */
export default function 승률곡선({ 표, 칸, 금액대이름, enp, base, llr, aval, p50, sd, 지금금액, 직접 }) {
  const 띠있음 = Array.isArray(표 && 표.p) && 표.p.length === 참가띠들.length
  const 예상띠 = enp > 0 ? 참가띠of(enp) : -1
  const [보기, set보기] = useState(() => (띠있음 && 예상띠 >= 0 && 표.p[예상띠].n >= 150 ? 예상띠 : 'm'))
  const 셌음 = useRef(false)
  useEffect(() => { if (!셌음.current) { 셌음.current = true; 세기('|승률곡선|보임') } }, [])
  const c = 보기 === 'm' ? 칸 : (띠있음 ? 표.p[보기] : null)
  const 점들 = useMemo(() => 곡선점들(표, c).filter((p) => p.z >= 보는자리[0] - 1e-9 && p.z <= 보는자리[1] + 1e-9), [표, c])
  const 판 = useRef(null)
  const W = 너비재기(판)
  const [위, set위] = useState(null)       // 손가락 · 마우스가 가리키는 점 번호
  if (!c || !(c.n > 0) || 점들.length < 2) return null

  const 퍼 = (k) => (k / c.n) * 100
  const 금액of = (z) => {
    const sj = Math.round((p50 + z * sd) * 1000) / 1000
    return shownBid(base, p50, Math.ceil(limitAmount(base, sj, llr, aval)))
  }
  const 왼 = 34, 오른 = 10, H1 = 132, H2 = 54, 틈 = 26, 아래 = 22
  const 안W = W - 왼 - 오른
  const x = (z) => 왼 + ((z - 보는자리[0]) / (보는자리[1] - 보는자리[0])) * 안W
  const 끝1 = 좋은끝(Math.max(...점들.map((p) => 퍼(p.일순))) * 1.15)
  const 위1 = 20                         // 위 그림 제목 자리
  const y1 = (v) => 위1 + H1 - (v / 끝1) * H1
  const top2 = 위1 + H1 + 틈
  const y2 = (v) => top2 + H2 - (v / 100) * H2
  const 높이 = top2 + H2 + 아래
  const 선 = (f, y) => 점들.map((p, i) => `${i ? 'L' : 'M'}${x(p.z).toFixed(1)},${y(f(p)).toFixed(1)}`).join('')
  const 최고 = 점들.reduce((b, p, i) => (p.일순 > 점들[b].일순 ? i : b), 0)
  const 최고점 = 점들[최고]
  const 최고금액 = 금액of(최고점.z)
  const 지금z = (() => { const s = breakEvenSj(base, llr, aval, 지금금액); return s == null || !(sd > 0) ? null : (s - 표.p50) / sd })()
  const 지금i = 지금z == null ? -1 : 점들.reduce((b, p, i) => (Math.abs(p.z - 지금z) < Math.abs(점들[b].z - 지금z) ? i : b), 0)
  const 지금밖 = 지금z != null && (지금z < 보는자리[0] - 0.05 || 지금z > 보는자리[1] + 0.05)
  /* 🩹 G339 (2026-10-20 실제 사이트) «가장 높은 자리» 가 잡음일 때가 많았음 — 참가 30~99곳 3,812건: 7분위 2.7%(실격 93%) vs 다른 자리 1.9~2.4%.
     → 지금 금액 자리(없으면 50분위)와 견줘 «건수로 보아 우연 범위 밖»(2 × 표준오차 넘게 높음)일 때만 가장 높은 자리를 짚고 고르기 단추를 둠.
       아니면 «자리마다 비슷합니다(○~○%)» 라고만 적음 — 잡음을 «여기 넣으면 더 이긴다» 로 내밀지 않음. */
  const 견줌i = 지금i >= 0 && !지금밖 ? 지금i : 점들.reduce((b, p, i) => (Math.abs(p.z) < Math.abs(점들[b].z) ? i : b), 0)
  const pb = 최고점.일순 / c.n, pn = 점들[견줌i].일순 / c.n
  const 뚜렷 = 최고 !== 견줌i && pb - pn > 2 * Math.sqrt((pb * (1 - pb) + pn * (1 - pn)) / c.n)
  const 견줌말 = 지금i >= 0 && !지금밖 ? '지금 금액' : '50분위'
  const 눈금 = (W >= 480 ? [10, 25, 50, 75, 90, 95, 99] : [10, 50, 90, 99]).map((q) => ({ q, z: 분위z(q) }))
  const 가까운 = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let k = 0
    점들.forEach((p, i) => { if (Math.abs(x(p.z) - px) < Math.abs(x(점들[k].z) - px)) k = i })
    return k
  }
  const 고름 = (i) => {
    const sb = 금액of(점들[i].z)
    if (sb && sb.rate) { 직접(sb.rate); 세기('|승률곡선|고름') }
  }
  const 띠고름 = (k) => { set보기(k); set위(null); 세기('|승률곡선|띠') }
  const h = 위 != null ? 점들[위] : null
  const h금액 = h ? 금액of(h.z) : null
  const 이름 = 보기 === 'm' ? `«${금액대이름}» 금액대` : `참가 ${참가띠들[보기][2]}`
  return (
    <div className="wrc">
      <div className="wrc-h">📈 자리별로 그려 보기 — 1순위가 된 비율 · 실격 비율</div>
      {띠있음 && (
        <div className="wrc-chips" role="group" aria-label="무엇으로 볼지">
          <button type="button" className={'wrc-chip' + (보기 === 'm' ? ' on' : '')} aria-pressed={보기 === 'm'} onClick={() => 띠고름('m')}>
            {금액대이름} 금액대 <small>{칸.n.toLocaleString('ko-KR')}건</small></button>
          {참가띠들.map(([, , k], i) => (
            <button key={k} type="button" className={'wrc-chip' + (보기 === i ? ' on' : '')} aria-pressed={보기 === i} onClick={() => 띠고름(i)}>
              참가 {k}{i === 예상띠 ? <b> · 예상</b> : null} <small>{표.p[i].n.toLocaleString('ko-KR')}건</small></button>
          ))}
        </div>
      )}
      <p className="wrc-say">
        {뚜렷 ? (<>
          {이름} 지난 개찰 <b>{c.n.toLocaleString('ko-KR')}건</b>에서 1순위가 가장 많이 나온 자리는
          {' '}<b>{분위of(최고점.z)}분위</b>{최고금액 ? <> (이번 공고 {won(최고금액.amt)})</> : null} — <b>{퍼(최고점.일순).toFixed(1)}%</b> · 그 자리 실격 <b>{퍼(최고점.실격).toFixed(0)}%</b>
          {' '}· {견줌말} 자리({퍼(점들[견줌i].일순).toFixed(1)}%)보다 건수로 보아 뚜렷이 높습니다
        </>) : (<>
          {이름} 지난 개찰 <b>{c.n.toLocaleString('ko-KR')}건</b> — 1순위가 가장 높게 나온 {분위of(최고점.z)}분위({퍼(최고점.일순).toFixed(1)}% · 실격 {퍼(최고점.실격).toFixed(0)}%)와
          {' '}{견줌말} 자리(<b>{퍼(점들[견줌i].일순).toFixed(1)}%</b>)의 차이는 건수로 보면 <b>우연 범위</b>입니다 — 자리를 옮긴다고 더 이긴다고 보기 어렵습니다
        </>)}
        {enp > 0 ? <span className="muted"> · 이 공고 예상 참가 {enp.toLocaleString('ko-KR')}곳</span> : null}
      </p>
      <div className="wrc-box" ref={판}>
        <svg className="wrc-svg" width={W} height={높이} viewBox={`0 0 ${W} ${높이}`} role="img"
          aria-label={`${이름} 자리별 1순위 비율 곡선 — ${뚜렷 ? `가장 높은 자리 ${분위of(최고점.z)}분위 ${퍼(최고점.일순).toFixed(1)}%` : `가장 높은 자리와 ${견줌말} 자리의 차이는 우연 범위`}`}
          onPointerMove={(e) => set위(가까운(e))} onPointerLeave={() => set위(null)} onClick={(e) => { const k = 가까운(e); set위(k); 고름(k) }}>
          {/* 위 그림 — 1순위가 된 비율 */}
          <text className="wrc-t" x={왼} y={12}>1순위가 된 비율</text>
          {[0, 끝1 / 2, 끝1].map((v) => (
            <g key={'g1' + v}>
              <line className="wrc-grid" x1={왼} x2={W - 오른} y1={y1(v)} y2={y1(v)} />
              <text className="wrc-ax" x={왼 - 4} y={y1(v) + 3} textAnchor="end">{v % 1 ? v.toFixed(1) : v}%</text>
            </g>
          ))}
          <path className="wrc-l1" d={선((p) => 퍼(p.일순), y1)} />
          {/* 아래 그림 — 실격 비율 */}
          <text className="wrc-t" x={왼} y={top2 - 6}>실격 비율</text>
          {[0, 50, 100].map((v) => (
            <g key={'g2' + v}>
              <line className="wrc-grid" x1={왼} x2={W - 오른} y1={y2(v)} y2={y2(v)} />
              <text className="wrc-ax" x={왼 - 4} y={y2(v) + 3} textAnchor="end">{v}%</text>
            </g>
          ))}
          <path className="wrc-l2" d={선((p) => 퍼(p.실격), y2)} />
          {/* 가로 — 분위 */}
          {눈금.map(({ q, z }) => (
            <text key={'x' + q} className="wrc-ax" x={x(z)} y={높이 - 6} textAnchor={x(z) > W - 오른 - 22 ? 'end' : 'middle'}>{q}분위</text>
          ))}
          {/* 가장 높은 자리 — 뚜렷할 때만 */}
          {뚜렷 && <line className="wrc-best" x1={x(최고점.z)} x2={x(최고점.z)} y1={y1(퍼(최고점.일순))} y2={y2(0)} />}
          {뚜렷 && <circle className="wrc-dot best" cx={x(최고점.z)} cy={y1(퍼(최고점.일순))} r={5} />}
          {/* 지금 고른 금액 */}
          {지금i >= 0 && !지금밖 && (
            <g>
              <line className="wrc-now" x1={x(점들[지금i].z)} x2={x(점들[지금i].z)} y1={위1} y2={y2(0)} />
              <circle className="wrc-dot now" cx={x(점들[지금i].z)} cy={y1(퍼(점들[지금i].일순))} r={5} />
            </g>
          )}
          {/* 가리키는 자리 */}
          {h && (
            <g>
              <line className="wrc-cross" x1={x(h.z)} x2={x(h.z)} y1={위1} y2={y2(0)} />
              <circle className="wrc-dot hov" cx={x(h.z)} cy={y1(퍼(h.일순))} r={4} />
              <circle className="wrc-dot hov2" cx={x(h.z)} cy={y2(퍼(h.실격))} r={4} />
            </g>
          )}
          <rect x={0} y={0} width={W} height={높이} fill="transparent" />
        </svg>
      </div>
      {/* 가리킨 자리 — 그림을 덮지 않게 그림 아래 한 줄(폰에서 누른 뒤에도 그림이 가려지지 않음) */}
      <div className="wrc-read" aria-live="polite">
        {h ? <><b>{분위of(h.z)}분위</b>{h금액 ? <> · {won(h금액.amt)}</> : null} · 1순위 <b>{퍼(h.일순).toFixed(1)}%</b> · 실격 <b>{퍼(h.실격).toFixed(0)}%</b> <span className="muted">· 누르면 이 금액으로</span></>
          : <span className="muted">그림을 가리키거나 누르면 그 자리의 금액 · 1순위 · 실격이 여기 나옵니다.</span>}
      </div>
      <div className="wrc-key"><span className="wrc-k now" /> 지금 금액{뚜렷 ? <> <span className="wrc-k best" /> 1순위가 가장 많이 나온 자리</> : null}</div>
      <div className="wrc-btns">
        {뚜렷 && 최고금액 && (
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 고름(최고)}>
            1순위가 가장 많이 나온 자리({분위of(최고점.z)}분위 · {won(최고금액.amt)} · 실격 {퍼(최고점.실격).toFixed(0)}%)로 고르기</button>
        )}
        {지금밖 && <span className="muted">지금 금액은 그림 밖(5~99분위 밖) 자리입니다.</span>}
      </div>
      <div className="kb-note muted" style={{ marginTop: 6 }}>
        파란 선 = 그 자리 금액으로 넣었다면 1순위가 된 비율 · 빨간 선 = 낙찰하한 아래(실격)가 된 비율. 칸마다 건수가 적어 1순위는 이웃 ±0.15 자리를 고르게 펴서 그렸습니다(위 표는 펴지 않은 값).
        {보기 !== 'm' ? ' 참가 띠는 금액대를 가리지 않고(100억 이하) 개찰 때 실제 참가업체수로 나눈 것이고, 예상 참가는 지난 개찰의 가운데라 실제와 다를 수 있습니다.' : ''}
        {c.n < 150 ? ' 이 칸은 지난 개찰이 적어 곡선이 흔들립니다.' : ''}
      </div>
    </div>
  )
}
