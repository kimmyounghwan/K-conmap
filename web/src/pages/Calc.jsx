import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAgency, similarZone } from '../lib/data.js'
import { bidCalculator, bidScore } from '../lib/engines.js'
import { AgencyPicker, MoneyInput, Bars, Tile, Empty } from '../components.jsx'
import { won, pct, num } from '../lib/fmt.js'

export default function Calc() {
  const [sp, setSp] = useSearchParams()
  const mode = sp.get('m') === 'score' ? 'score' : 'calc'
  const setMode = (m) => setSp(m === 'score' ? { m: 'score' } : {}, { replace: true })

  const [agencyName, setAgencyName] = useState('')
  const [agency, setAgency] = useState(null)
  const [loading, setLoading] = useState(false)
  const [base, setBase] = useState(0)
  const [notice, setNotice] = useState('')
  const [myRate, setMyRate] = useState('')
  const [similar, setSimilar] = useState(null)

  const pick = async ({ name, chunk }) => {
    setAgencyName(name); setLoading(true); setAgency(null)
    const a = await getAgency(name, chunk)
    setAgency(a); setLoading(false)
  }

  // 공고명이 바뀌면 유사공고 구간을 다시 찾는다 (낙찰스코어 3번 항목)
  useEffect(() => {
    const t = setTimeout(() => {
      const s = notice.trim()
      if (s.length < 2) { setSimilar(null); return }
      similarZone(s).then(setSimilar)
    }, 350)
    return () => clearTimeout(t)
  }, [notice])

  const calc = mode === 'calc' && agency && base > 0 ? bidCalculator(agency, base) : null
  const score = mode === 'score' && agency && myRate
    ? bidScore({ agency, myRate: Number(myRate), basePrice: base, similar })
    : null

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        🧮 투찰 계산 <span className="count">· 발주기관 3년 패턴 기반</span>
      </div>

      <div className="seg">
        <button className={mode === 'calc' ? 'on' : ''} onClick={() => setMode('calc')}>투찰가 계산기</button>
        <button className={mode === 'score' ? 'on' : ''} onClick={() => setMode('score')}>낙찰스코어</button>
      </div>

      <div className="card">
        <AgencyPicker value={agencyName} onPick={pick} />

        <div className="field">
          <label>기초금액 <span className="hint">— 공고서의 기초금액</span></label>
          <MoneyInput value={base} onChange={setBase} />
        </div>

        {mode === 'score' && (
          <>
            <div className="field">
              <label>공고명 <span className="hint">— 유사공고 비교에 씁니다 (선택)</span></label>
              <input value={notice} onChange={(e) => setNotice(e.target.value)}
                placeholder="예: ○○로 도로포장 정비공사" />
            </div>
            <div className="field">
              <label>내 투찰률 (%)</label>
              <input inputMode="decimal" value={myRate}
                onChange={(e) => setMyRate(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="예: 87.745" />
            </div>
          </>
        )}
      </div>

      {loading && <div className="skel" style={{ height: 120 }} />}

      {agency && (
        <div className="tiles c4" style={{ marginBottom: 10 }}>
          <Tile k="표본" v={num(agency.n)} small />
          <Tile k="평균" v={pct(agency.s?.avg, 2)} small />
          <Tile k="편차" v={agency.s?.std?.toFixed(2) ?? '-'} small />
          <Tile k="독식률" v={pct(agency.mono, 0)} small />
        </div>
      )}

      {/* ── 투찰가 계산기 ────────────────── */}
      {mode === 'calc' && (
        !agency ? (
          <Empty icon="🏛️">발주기관을 먼저 선택하세요.<br />3년치 낙찰 패턴에서 최다 투찰 구간을 찾아드립니다.</Empty>
        ) : !base ? (
          <Empty icon="💰">기초금액을 입력하면 추천 투찰가를 계산합니다.</Empty>
        ) : !calc ? (
          <Empty icon="📉">이 기관은 분석할 투찰률 데이터가 부족합니다.</Empty>
        ) : (
          <>
            <div className="result">
              <div className="k">추천 투찰가 · 최다발생 구간 {calc.bestRate}%</div>
              <div className="v">{won(calc.recommended)}</div>
              <div className="sub">
                표본 {num(calc.total)}건 중 이 구간이 {pct(calc.share, 1)} 차지
              </div>
            </div>

            <div className="tiles c2" style={{ marginBottom: 10 }}>
              <Tile k={`평균 투찰률 ${pct(calc.avgRate, 2)}`} v={won(calc.avgPrice)} small />
              <Tile k={`중앙값 ${pct(calc.medRate, 2)}`} v={won(calc.medPrice)} small />
            </div>

            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 10px' }}>0.1% 단위 최다 구간</div>
              <Bars rows={calc.top} />
            </div>

            {calc.zoom && (
              <div className="card">
                <div className="sec-title" style={{ margin: '0 0 4px' }}>
                  🔬 0.01% 돋보기 <span className="count">· {calc.zoom.lower}~{calc.zoom.upper}% 안</span>
                </div>
                <div className="result" style={{ margin: '8px 0 12px' }}>
                  <div className="k">정밀 추천 {calc.zoom.best}%</div>
                  <div className="v">{won(calc.zoom.price)}</div>
                  <div className="sub">이 구간 표본 {num(calc.zoom.total)}건</div>
                </div>
                <Bars rows={calc.zoom.rows} />
              </div>
            )}

            <div className="note">
              추천값은 과거 낙찰 데이터의 최빈 구간일 뿐 낙찰을 보장하지 않습니다.
              표본이 적은 기관일수록 편차가 큽니다.
            </div>
          </>
        )
      )}

      {/* ── 낙찰스코어 ───────────────────── */}
      {mode === 'score' && (
        !agency ? (
          <Empty icon="🏛️">발주기관을 선택하고 내 투찰률을 입력하세요.</Empty>
        ) : !myRate ? (
          <Empty icon="✍️">내 투찰률을 입력하면 100점 만점으로 채점합니다.</Empty>
        ) : !score ? (
          <Empty icon="📉">이 기관은 채점에 필요한 데이터가 부족합니다.</Empty>
        ) : (
          <>
            <div className="score-hero" style={{ background: score.bg }}>
              <div className="grade">{score.grade}</div>
              <div className="num">{score.total}점 / 100점</div>
              <div className="lab">{score.label} · 추정 낙찰확률 {score.prob}</div>
            </div>

            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 10px' }}>항목별 점수</div>
              {score.items.map((it) => (
                <div className="score-line" key={it.name}>
                  <span className="n">{it.name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: (it.score / it.max) * 100 + '%' }} />
                  </div>
                  <span className="s">{it.score}/{it.max}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 6px' }}>판단 근거</div>
              <div className="row">
                <div className="grow"><div className="t">기관 최다발생 구간</div>
                  <div className="d">내 투찰률과의 거리 {Math.abs(Number(myRate) - score.bestRate01).toFixed(3)}%p</div></div>
                <span className="r">{score.bestRate01}%</span>
              </div>
              <div className="row">
                <div className="grow"><div className="t">최다 낙찰 업체</div>
                  <div className="d">{score.topCorp}</div></div>
                <span className="r">{pct(score.mono, 1)}</span>
              </div>
              <div className="row">
                <div className="grow"><div className="t">투찰률 표준편차</div>
                  <div className="d">좁을수록 예측이 쉬움</div></div>
                <span className="r">{score.stdRate?.toFixed(3)}</span>
              </div>
              {score.similar ? (
                <div className="row">
                  <div className="grow"><div className="t">유사공고 «{score.similar.word}»</div>
                    <div className="d">표본 {num(score.similar.n)}건 · 최다 {score.similar.zone}%</div></div>
                  <span className="r">{pct(score.similar.avg, 2)}</span>
                </div>
              ) : (
                <div className="row">
                  <div className="grow"><div className="t">유사공고</div>
                    <div className="d">공고명을 입력하면 이 항목이 채점됩니다</div></div>
                  <span className="r">0/20</span>
                </div>
              )}
              {base > 0 && (
                <>
                  <div className="row">
                    <div className="grow"><div className="t">내 투찰금액</div></div>
                    <span className="r">{won(score.myBidPrice)}</span>
                  </div>
                  <div className="row">
                    <div className="grow"><div className="t">핫존 기준 금액</div>
                      <div className="d">차액 {won(Math.abs(score.myBidPrice - score.bestBidPrice))}</div></div>
                    <span className="r">{won(score.bestBidPrice)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 4px' }}>제안</div>
              <ul className="advice">
                {score.advice.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>

            <div className="note">
              낙찰스코어는 과거 데이터의 패턴 일치도를 점수화한 참고 지표입니다.
              실제 낙찰은 예정가격 추첨과 참여업체 구성에 크게 좌우됩니다.
            </div>
          </>
        )
      )}
    </>
  )
}
