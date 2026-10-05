/* 🎯 이 칸에 누가 넣나 — 바로투찰, 공고를 고르고 금액이 나온 뒤 (2026-10-05)
   ■ 보여 주는 것
     · 한 줄 — 「우리 금액은 사정률 100.43% 까지 버팁니다 → 100.4 칸 · 이 칸 투찰 ○건(○%) · 붐비는 순 ○번째」
     · 칸 막대 — 0.1%p 칸마다 지난 투찰 수(시도 + 같은 면허가 넉넉하면 그 면허). 우리 칸은 파랑.
       막대를 누르거나 ◀ ▶ 로 다른 칸을 고르면, 아래에 그 칸에 가장 많이 넣은 업체(«고정» 표시 포함)를 보여 줍니다.
     · 정직한 한 줄 — 칸마다 1순위가 된 비율은 거의 같다(전국 실측). 붐비는 칸을 피한다고 이기지 않는다.
   ■ 자료는 이 상자가 뜰 때 한 번(몇 KB) — lib/칸누가.js */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 칸받기, 면허고르기, 칸번호, 칸글, 칸풀이, 일순위범위, 그림범위, 날짜 } from './lib/칸누가.js'

const W = 320, H = 96, L = 4, R = 4, T = 14, B = 16

export default function 칸누가({ sj, sido, lic }) {
  const [자료, set자료] = useState(undefined)
  const [면, set면] = useState(null)        // null = 공고 면허(있으면) · '' = 전체
  const 우리 = typeof sj === 'number' && isFinite(sj) ? 칸번호(sj) : null
  const [고른, set고른] = useState(우리)
  useEffect(() => { set고른(우리) }, [우리])
  useEffect(() => {
    let 살아 = true
    set자료(undefined); set면(null)
    칸받기(sido).then((v) => { if (살아) set자료(v || null) }).catch(() => { if (살아) set자료(null) })
    return () => { 살아 = false }
  }, [sido])

  const 공고면허 = useMemo(() => (자료 ? 면허고르기(자료.d, lic) : ''), [자료, lic])
  if (우리 == null) return null
  if (자료 === undefined) return <div className="kan"><div className="kan-h">🎯 이 칸에 누가 넣나</div><div className="skel" style={{ height: 80 }} /></div>
  if (!자료) return null

  const { d, 곳 } = 자료
  const 면허 = 면 == null ? 공고면허 : 면
  const g = d.g[면허] || d.g['']
  const [a, b] = 그림범위(d, g, 고른 ?? 우리)
  const 칸들 = []
  for (let k = a; k <= b; k++) 칸들.push(k)
  const 높 = Math.max(1, ...칸들.map((k) => g.h[k - d.lo] || 0))
  const bw = (W - L - R) / 칸들.length
  const 나 = 칸풀이(d, g, 우리)
  const 이 = 칸풀이(d, g, 고른 ?? 우리)
  const 범 = 일순위범위(d)
  const 밖 = 우리 < d.lo || 우리 >= d.lo + g.h.length
  const 옮기기 = (n) => set고른((v) => Math.min(b, Math.max(a, (v ?? 우리) + n)))

  return (
    <div className="kan">
      <div className="kan-h">
        🎯 이 칸에 누가 넣나
        <span>· {곳}{면허 ? ` · ${면허}` : ''} · 개찰 {g.e.toLocaleString()}건 · 투찰 {g.n.toLocaleString()}
          {d.f ? ` · ${날짜(d.f)}~${날짜(d.t)}` : ''}</span>
      </div>
      <div className="kan-me">
        우리 금액은 사정률 <b>{sj.toFixed(3)}%</b> 까지 버팁니다 → <b className="k">{칸글(우리)} 칸</b>
        {밖 ? <> · 지난 투찰이 거의 없는 자리입니다</>
          : 나.수 > 0
            ? <> · 이 칸 투찰 <b>{나.수.toLocaleString()}건</b>({나.몫.toFixed(1)}%) · 붐비는 순 <b>{나.순위}번째</b></>
            : <> · 이 칸에 넣은 투찰은 없었습니다</>}
      </div>
      {공고면허 && (
        <div className="kan-chips">
          <button type="button" className={면허 === 공고면허 ? 'on' : ''} onClick={() => set면(공고면허)}>{공고면허}</button>
          <button type="button" className={면허 === '' ? 'on' : ''} onClick={() => set면('')}>면허 전체</button>
        </div>
      )}
      <svg className="kan-g" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`칸별 투찰 수 — 우리 칸 ${칸글(우리)}`}>
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} className="base" />
        {칸들.map((k, i) => {
          const v = g.h[k - d.lo] || 0
          const h = ((H - T - B) * v) / 높
          const x = L + i * bw
          const cls = (k === 우리 ? 'me' : 'bar') + (k === 고른 ? ' sel' : '')
          return (
            <g key={k} onClick={() => set고른(k)} className="col">
              <rect x={x} y={0} width={bw} height={H} className="hit" />
              {v > 0 && <rect x={x + 0.6} y={H - B - h} width={Math.max(1, bw - 1.2)} height={h} rx="1.5" className={cls} />}
              {k === 고른 && v > 0 && <text x={x + bw / 2} y={H - B - h - 3} className="vl">{v}</text>}
              {k % 5 === 0 && x > 8 && x < W - 14 && <text x={x} y={H - 4} className="ax">{칸글(k)}</text>}
            </g>
          )
        })}
      </svg>
      <div className="kan-sel">
        <button type="button" onClick={() => 옮기기(-1)} aria-label="왼쪽 칸">◀</button>
        <span>
          <i><b>{칸글(고른 ?? 우리)}~{칸글((고른 ?? 우리) + 1)}%</b> 칸{고른 === 우리 ? ' (우리)' : ''}</i>
          <i>투찰 {이.수.toLocaleString()}건{이.일순위 != null ? ` · 1순위 ${이.일순위}%(전국)` : ''}</i>
        </span>
        <button type="button" onClick={() => 옮기기(1)} aria-label="오른쪽 칸">▶</button>
      </div>
      {이.위.length ? (
        <ol className="kan-top">
          {이.위.map(([nm, n, fx]) => (
            <li key={nm}>
              <Link to={`/corp/${encodeURIComponent(nm)}`}>{nm}</Link>
              <span className="n">{n}번</span>
              {fx ? <em className="fix" title="5번 이상 넣었고 가운데 절반이 0.15%p 안">고정 {Number(fx).toFixed(2)}</em> : null}
            </li>
          ))}
        </ol>
      ) : (
        <div className="kan-none">이 칸에 두 번 넘게 넣은 업체는 없었습니다.</div>
      )}
      <div className="note sm">
        {범 && <>어느 칸에 넣든 1순위가 된 비율은 전국 <b>{범.lo}~{범.hi}%</b>(전체 {범.전체}%)로 비슷했습니다 —
          붐비는 칸을 피한다고 낙찰이 늘지는 않습니다. «누가 같은 칸에 있나» 를 보는 참고입니다. </>}
        칸 = 그 금액이 낙찰하한을 넘으려면 사정률이 이 값 아래로 나와야 하는 경계(0.1%p). 개찰 결과에 실린 투찰(한 개찰 30곳까지)만 셉니다.
        «고정» = 5번 이상 넣었고 가운데 절반이 0.15%p 안에 모인 업체(숫자는 그 업체의 가운데 칸).
      </div>
    </div>
  )
}
