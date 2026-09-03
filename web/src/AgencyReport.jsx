import { Bars, Months, Tile } from './components.jsx'
import { agencySummary } from './lib/engines.js'
import { won, wonShort, pct, num, dateFull } from './lib/fmt.js'

/** 발주기관 한 곳의 분석 리포트 — 분석 탭과 /agency/:name 상세에서 함께 씀 */
import { SpotBlock, OpenNotices, instMatch } from './Spot.jsx'

export default function AgencyReport({ name, a }) {
  if (!a) return null
  const sum = agencySummary(a)
  const h1 = [...(a.h1 || [])].sort((x, y) => y[1] - x[1]).slice(0, 8)
  const years = Object.entries(a.y || {})

  return (
    <>
      {/* ★ 2026-09-03 — «통계» 앞에 «자리» 부터. 이 기관에서 이길 수 있나. */}
      <SpotBlock spot={a.spot} who="이 기관" />

      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.3px', wordBreak: 'keep-all' }}>{name}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
          {a.kind} · 누적 {num(a.n)}건 분석
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.7, marginTop: 10, marginBottom: 0, wordBreak: 'keep-all' }}>
          이 기관의 낙찰 투찰률은 평균 <b>{pct(sum.avg, 2)}</b>이고, 가장 자주 나온 구간은{' '}
          <b>{sum.best}%대</b>로 전체의 {sum.share}%를 차지합니다. 투찰률이 모이는 폭은{' '}
          <b>{sum.tight}</b>고, 낙찰 업체 분포는 <b>{sum.monoTxt}</b>입니다.
          {sum.peak ? <> 발주는 <b>{sum.peak}월</b>에 가장 몰립니다.</> : null}
        </p>
      </div>

      <div className="tiles c4" style={{ marginBottom: 10 }}>
        <Tile k="평균 투찰률" v={pct(sum.avg, 2)} small />
        <Tile k="최다 구간" v={sum.best + '%'} small />
        <Tile k="표준편차" v={sum.std?.toFixed(2) ?? '-'} small />
        <Tile k="독식률" v={pct(a.mono, 0)} small />
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 10px' }}>🔥 투찰률 히트맵 <span className="count">0.1% 단위</span></div>
        <Bars rows={h1} />
        <div className="note" style={{ marginTop: 10 }}>
          최저 {pct(a.s?.min, 2)} · 최고 {pct(a.s?.max, 2)} · 중앙값 {pct(a.s?.med, 2)}
        </div>
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 10px' }}>🏢 낙찰 업체 분포 <span className="count">상위 {(a.corps || []).length}곳</span></div>
        {(a.corps || []).map(([c, v], i) => (
          <div className="row" key={c + i}>
            <span className="badge n">{i + 1}</span>
            <div className="grow"><div className="t">{c}</div></div>
            <span className="r">{num(v)}건</span>
          </div>
        ))}
        {a.mono >= 40 && (
          <div className="note" style={{ marginTop: 10, color: 'var(--warn)' }}>
            ⚠️ 상위 1개 업체가 {pct(a.mono, 1)}를 가져갔습니다. 진입 난도가 높은 기관입니다.
          </div>
        )}
      </div>

      {a.m && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 10px' }}>📅 월별 발주 패턴</div>
          <Months data={a.m} />
          {years.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {years.map(([y, v]) => (
                <span key={y} className="badge n">{y}년 {num(v)}건</span>
              ))}
            </div>
          )}
        </div>
      )}

      {a.amt && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 10px' }}>💰 낙찰 금액대</div>
          <div className="tiles c4">
            <Tile k="평균" v={wonShort(a.amt.avg)} small />
            <Tile k="중앙값" v={wonShort(a.amt.med)} small />
            <Tile k="최소" v={wonShort(a.amt.min)} small />
            <Tile k="최대" v={wonShort(a.amt.max)} small />
          </div>
        </div>
      )}

      {(a.cases || []).length > 0 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>🗂 최근 낙찰 사례</div>
          {a.cases.map((c, i) => (
            <div className="row" key={i}>
              <div className="grow">
                <div className="t" style={{ whiteSpace: 'normal' }}>{c[0]}</div>
                <div className="d">{dateFull(c[1])} · {c[2]}</div>
              </div>
              <span className="r">{c[3] != null ? pct(c[3], 3) : '-'}<br />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{wonShort(c[4])}</span>
              </span>
            </div>
          ))}
        </div>
      )}
          {/* ★ 분석에서 끝내지 않습니다 — 이 기관의 마감 전 공고와 원클릭 금액 */}
      <OpenNotices title={`${name} 마감 전 공고`} match={instMatch(name)} />
</>
  )
}
