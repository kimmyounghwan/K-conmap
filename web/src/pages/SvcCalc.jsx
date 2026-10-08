/* 💰 용역 · 물품 바로투찰 — /svc/calc · /goods/calc (G194d · 2026-10-08)
 *
 * 소장님: 「물품이나 용역은 계산 방법이 다르다고 했잖아 그럼 공사처럼 설명을 해줘야지? 왜 이런지??
 *          그리고 바로입찰 버튼 이런게 있어야 클릭을 하지???」 → 「만들어 줘」
 *
 * ■ 들어오는 길 ① 공고 카드의 «💰 바로투찰» 단추(그 공고 값이 주소에 실려 옴) ② 아래 탭 «바로투찰»(용역 · 물품 방) → 직접 넣기 + 셀 수 있는 마감 전 공고
 * ■ 셈은 lib/용역셈.js(공사 lib/bidmath.js 와 같은 식) — 이 화면은 «보여 주기» 만
 * ■ 권장 금액은 «참고» · 투찰 금액은 직접 고름(분위 단추 · 내 금액 넣기) — 소장님 「권장금액 참고 하라고 적어」
 * ■ «왜 공사와 다른가요?» 를 늘 펼쳐 둠(공사 바로투찰처럼 까닭을 적음)
 * ■ 숨은 누적: |용역|바로투찰(열기) · |용역|바로투찰복사 · |용역|바로투찰분위 · |용역|바로투찰직접 — 물품은 |물품|…
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getOverview } from '../lib/data.js'
import { won, wonShort, pct, dateTime, dday } from '../lib/fmt.js'
import { 세기 } from '../lib/받은수.jsx'
import { 셈까닭, 셈가능, 까닭말, 기준사정률, 재료, 참고금액, 분위들, 분위금액, 내금액, 하한표, 계산주소, 주소공고, 실측최소 } from '../lib/용역셈.js'

const 종류표 = {
  svc: { 이름: '용역', ic: '📐', slug: 'svc', kind: 'serv', 셈: '|용역|' },
  goods: { 이름: '물품', ic: '📦', slug: 'goods', kind: 'thng', 셈: '|물품|' },
}
const 숫 = (s) => Number(String(s || '').replace(/[^0-9.]/g, '')) || 0
const 쉼표 = (n) => (n > 0 ? Math.round(n).toLocaleString('ko-KR') : '')
const 확률 = (p) => (p == null ? '-' : `${Math.round(p * 100)}%`)
/* 분위 단추 금액 — «1.2억» 처럼 뭉개지면 여섯 단추가 다 같아 보임 → 만 원까지 (예: 1억 1,679만) */
const 만원 = (n) => {
  const m = Math.floor((Number(n) || 0) / 10000)
  const 억 = Math.floor(m / 10000), 나머 = m % 10000
  return 억 > 0 ? `${억}억${나머 ? ` ${나머.toLocaleString('ko-KR')}만` : ''}` : `${나머.toLocaleString('ko-KR')}만`
}

function 큰금액({ amt }) {
  const s = Math.round(amt).toLocaleString('ko-KR')
  return (
    <div className="amt">
      {[...s].map((c, i) => (c === ',' ? <span key={i} className="sep">,</span> : <span key={i} className="dg">{c}</span>))}
      <span className="won">원</span>
    </div>
  )
}

export default function SvcCalc({ kind = 'svc' }) {
  const T = 종류표[kind] || 종류표.svc
  const { search } = useLocation()
  const 공고 = useMemo(() => 주소공고(search), [search])
  const [sj, setSj] = useState(null)          // 이 종류 사정률 실측
  const [공사p50, set공사p50] = useState(null)
  const [목록, set목록] = useState(null)       // 직접 넣기 화면 — 셀 수 있는 마감 전 공고
  const [고른, set고른] = useState(null)       // 분위
  const [내, set내] = useState('')
  const [복사됨, set복사됨] = useState(false)
  /* 직접 넣기 */
  const [기초, set기초] = useState('')
  const [하한, set하한] = useState('')
  const [범위, set범위] = useState(2)
  const [A, setA] = useState('')
  const 직접셈 = useRef(false)
  const 직접쓰기 = (f) => (e) => { f(e.target.value); if (!직접셈.current) { 직접셈.current = true; 세기(T.셈 + '바로투찰직접') } }

  useEffect(() => { 세기(T.셈 + '바로투찰') }, [T.셈])
  useEffect(() => {
    let 살 = true
    fetch(`/data/board/${T.slug}-first.json`).then((r) => (r.ok ? r.json() : null)).then((m) => { if (살) setSj(m && m[T.kind] ? m[T.kind].sj || null : null) }).catch(() => {})
    getOverview().then((ov) => { if (살) set공사p50(ov?.sjq?.p50 || null) }).catch(() => {})
    return () => { 살 = false }
  }, [T.slug, T.kind])
  useEffect(() => {
    if (공고) return undefined
    let 살 = true
    fetch(`/data/board/${T.slug}-live-${T.kind}-0.json`).then((r) => (r.ok ? r.json() : [])).then((rows) => {
      if (!살) return
      const 지금 = Date.now()
      const 열림 = (r) => { const d = String(r.close || '').replace(/[^0-9]/g, ''); if (d.length < 12) return false; return new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(8, 10)}:${d.slice(10, 12)}:00+09:00`).getTime() > 지금 }
      set목록((rows || []).filter((r) => 셈가능(r) && 열림(r)).sort((a, b) => String(a.close).localeCompare(String(b.close))).slice(0, 12))
    }).catch(() => set목록([]))
    return () => { 살 = false }
  }, [공고, T.slug, T.kind])

  const 기준 = 기준사정률(sj, 공사p50)
  const 직접 = !공고
  const r = 공고 || (숫(기초) > 0 && 숫(하한) > 0
    ? { base: 숫(기초), llr: 숫(하한), lo: -범위, hi: 범위, aval: 숫(A), ayn: 숫(A) > 0 ? 'Y' : 'N', pmth: '복수예가', swin: '' } : null)
  const 까닭 = 공고 ? 셈까닭(공고) : ''
  const m = r && !까닭 ? 재료(r, 기준.p50) : null
  const 참고 = 참고금액(m)
  const 분위 = 고른 ? 분위금액(m, 고른) : null
  const 내것 = 내금액(m, 숫(내))
  const 표 = 하한표(m)
  const 보일금액 = 분위 ? 분위.amt : 참고 ? 참고.amt : 0
  const 마감 = 공고 ? dday(공고.close) : null

  const 복사 = async () => {
    try { await navigator.clipboard.writeText(String(보일금액)); set복사됨(true); setTimeout(() => set복사됨(false), 1600); 세기(T.셈 + '바로투찰복사') } catch (e) { /* 막힌 브라우저 */ }
  }

  return (
    <>
      <div className="sec-title" style={{ marginTop: 6 }}>
        {T.ic} {T.이름} 바로투찰
        <span className="count">· 조달청이 공고에 적어 준 하한율 · 예가 범위로 셉니다</span>
      </div>

      {공고 && (
        <div className="card sc-head">
          <b className="sc-name">{공고.name || '(공고명 없음)'}</b>
          <div className="muted sc-sub">
            {공고.inst}{공고.close ? ` · 마감 ${dateTime(공고.close)}` : ''}
            {마감 && <span className={'badge ' + 마감.tone} style={{ marginLeft: 6 }}>{마감.text}</span>}
          </div>
          <div className="sc-links">
            <Link className="btn ghost sm" to={`/${kind}`}>← {T.이름} 공고</Link>
            {공고.url && /^https?:\/\//.test(공고.url) && <a className="btn ghost sm" href={공고.url} target="_blank" rel="noreferrer">나라장터 원문 →</a>}
          </div>
        </div>
      )}

      {직접 && (
        <div className="card sc-input">
          {/* 🩹 G198 소장님 「뒤로가기 버튼이 없어?」 — 공고 없이 연 계산기(아래 탭 · 주소로 바로)에도 그 방 공고로 가는 단추 */}
          <div className="sc-links" style={{ marginBottom: 8 }}><Link className="btn ghost sm" to={`/${kind}`}>← {T.이름} 공고</Link></div>
          <b>숫자를 넣으면 바로 셉니다</b>
          <div className="note sm" style={{ margin: '4px 0 8px' }}>공고문의 기초금액 · 낙찰하한율 · 예가 범위를 넣으십시오. 아래 «셀 수 있는 마감 전 공고» 를 누르면 저절로 채워집니다.</div>
          <label className="sc-f">기초금액 (원)
            <input inputMode="numeric" placeholder="예: 181,818,181" value={쉼표(숫(기초)) || 기초} onChange={직접쓰기(set기초)} />
          </label>
          <label className="sc-f">낙찰하한율 (%)
            <input inputMode="decimal" placeholder="예: 87.745" value={하한} onChange={직접쓰기(set하한)} />
          </label>
          <div className="sc-f">예가 범위
            <div className="sc-chips">
              {[2, 3].map((x) => <button key={x} type="button" className={'chip' + (범위 === x ? ' on' : '')} onClick={() => set범위(x)}>±{x}%</button>)}
            </div>
          </div>
          <label className="sc-f">A값 (원 · 없으면 비워 두기)
            <input inputMode="numeric" placeholder="대부분의 용역 · 물품 공고는 없음" value={쉼표(숫(A)) || A} onChange={(e) => setA(e.target.value)} />
          </label>
        </div>
      )}

      {공고 && 까닭 && (
        <div className="card sc-no">
          <b>이 공고는 바로투찰로 셀 수 없습니다</b>
          <p className="note sm" style={{ margin: '6px 0 0' }}>{(까닭말[까닭] || {}).길게}</p>
        </div>
      )}

      {m && 참고 && (
        <div className="hero sc-hero">
          <div className="sjline">
            <span className="lab">{분위 ? `${분위.q}분위로 고른 금액` : '참고 금액(권장)'}</span>
            <span className="val">사정률 {(분위 ? 분위.sj : 참고.sj).toFixed(3)}%</span>
          </div>
          <큰금액 amt={보일금액} />
          <div className="sub">사정률이 {(분위 ? 분위.sj : 참고.sj).toFixed(3)}% 이하로 나오면 하한을 넘깁니다 · 넘길 확률 약 <b>{확률(분위 ? 분위.통과 : 참고.통과)}</b></div>
          <div className="range">기초금액 대비 {pct((보일금액 / m.base) * 100, 3)}</div>
          <div className="hbtns">
            <button type="button" className="cbtn" onClick={복사}>{복사됨 ? '✅ 복사했습니다' : '금액 복사'}</button>
            {고른 && <button type="button" className="cbtn ghost" onClick={() => set고른(null)}>참고 금액으로</button>}
          </div>
          <div className="sc-ref">권장 금액도 참고입니다 — 투찰 금액은 아래에서 직접 골라 주십시오.</div>
        </div>
      )}

      {m && (
        <>
          <div className="card">
            <b>🎚 직접 고르기 — 분위</b>
            <div className="note sm" style={{ margin: '4px 0 8px' }}>분위가 높을수록 하한을 넘길 확률이 높고(실격이 적고), 금액은 올라갑니다.</div>
            <div className="sc-q">
              {분위들.map((q) => {
                const x = 분위금액(m, q)
                return (
                  <button key={q} type="button" className={'sc-qb' + (고른 === q ? ' on' : '')} onClick={() => { set고른(q); 세기(T.셈 + '바로투찰분위') }}>
                    <b>{q}분위</b><span>{만원(x.amt)}</span><i>넘길 확률 {확률(x.통과)}</i>
                  </button>
                )
              })}
            </div>
            <label className="sc-f" style={{ marginTop: 10 }}>내 금액 넣어 보기 (원)
              <input inputMode="numeric" placeholder="넣으면 넘길 확률이 나옵니다" value={쉼표(숫(내)) || 내} onChange={(e) => set내(e.target.value)} />
            </label>
            {내것 && (
              <div className={'sc-mine ' + (내것.통과 >= 0.5 ? 'ok' : 'warn')}>
                사정률이 <b>{내것.sj.toFixed(3)}%</b> 이하로 나오면 하한을 넘깁니다 · 넘길 확률 약 <b>{확률(내것.통과)}</b>
              </div>
            )}
          </div>

          <div className="card">
            <b>📋 사정률이 이렇게 나오면 — 하한금액</b>
            <table className="sc-tbl">
              <thead><tr><th>분위</th><th>사정률</th><th>하한금액</th></tr></thead>
              <tbody>
                {표.map((x) => (
                  <tr key={x.q} className={보일금액 >= x.low ? 'ok' : ''}>
                    <td>{x.q}</td><td>{x.sj.toFixed(3)}%</td><td>{won(x.low)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="note sm" style={{ marginTop: 6 }}>색칠된 줄은 위 금액이 하한을 넘기는 자리입니다.</div>
          </div>

          <div className="card sc-mat">
            <b>🧾 셈에 쓴 값</b>
            <div className="kv2">
              <div><span>기초금액</span><b>{won(m.base)}</b></div>
              <div><span>낙찰하한율</span><b>{pct(m.llRate, 3)}</b></div>
              <div><span>예가 범위</span><b>{m.lo}% ~ +{m.hi}%</b></div>
              <div><span>예비가격</span><b>{m.ptot}개 중 {m.pdrw}개 추첨</b></div>
              <div><span>A값</span><b>{m.aVal > 0 ? won(m.aVal) : m.aKnown ? '없음' : '공고에 없음 → 0 · 95분위로 넉넉히'}</b></div>
              <div><span>사정률 가운데값</span><b>{m.p50.toFixed(3)}% {기준.출처 === '실측' ? `(${T.이름} 실측 ${기준.n.toLocaleString()}건)` : `(공사 실측 빌림 · ${T.이름} 실측 ${기준.n}건 쌓이는 중)`}</b></div>
            </div>
          </div>
        </>
      )}

      <details className="card sc-why" open>
        <summary><b>❓ 왜 공사와 다른가요?</b></summary>
        <ol>
          <li><b>낙찰하한율이 공고마다 다릅니다.</b> 공사는 금액대별 표로 정해져 있지만, {T.이름}은 공고마다 따로 적혀 옵니다
            (예: 88% · 87.745% · 90% · 86.745%). 그래서 표로 짐작하지 않고 <b>조달청이 그 공고에 적어 준 값</b>을 그대로 씁니다.</li>
          <li><b>가격으로 정하지 않는 공고가 많습니다.</b> «협상에 의한 계약» 은 제안서 점수로, «수의시담» 은 한 곳과 협의로 정해집니다 —
            이런 공고에는 바로투찰 단추가 없습니다.</li>
          <li><b>예정가격 정하는 법도 섞여 있습니다.</b> 15개 예비가격 중 4개를 뽑는 «복수예가» 공고만 사정률로 셉니다(단일예가 · 비예가는 안 셈).</li>
          <li><b>사정률 가운데값(예정가격이 기초금액의 몇 %로 나오나)</b> — 공사는 개찰 1만여 건 실측이 있고, {T.이름}은 실측을 모으는 중입니다.
            {T.이름} 실측이 {실측최소}건을 넘으면 그 값으로 바뀝니다(지금 {기준.n.toLocaleString()}건).</li>
          <li>셈 식은 공사와 같습니다 — <b>낙찰하한 = (예정가격 − A값) × 하한율 + A값</b>, 예정가격 = 기초금액 × 사정률.</li>
        </ol>
        <div className="note sm">이 금액은 지난 자료로 본 참고값입니다. 공고문(하한율 · A값 · 예가 범위)을 한 번 더 확인하시고, 투찰 금액은 직접 정하십시오.</div>
      </details>

      {직접 && (
        <div className="card">
          <b>💰 셀 수 있는 마감 전 {T.이름} 공고</b>
          <div className="note sm" style={{ margin: '4px 0 8px' }}>복수예가 · 하한율 · 기초금액이 다 있는 공고만(마감 가까운 차례).</div>
          {목록 == null ? <div className="muted">불러오는 중…</div> : 목록.length === 0 ? <div className="muted">지금은 셀 수 있는 마감 전 공고가 없습니다 — {T.이름} 공고에서 기초금액이 공개되면 생깁니다.</div> : (
            <div className="sc-list">
              {목록.map((x) => (
                <Link key={x.no + (x.ord || '')} className="sc-item" to={계산주소(kind, x)} onClick={() => { set고른(null); set내('') }}>
                  <b>{x.name}</b>
                  <span className="muted">{x.inst} · 기초 {wonShort(x.base)} · 하한율 {pct(x.llr, 3)} · 마감 {dateTime(x.close)}</span>
                </Link>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8 }}><Link className="btn ghost sm" to={`/${kind}`}>{T.이름} 공고 전체 보기 →</Link></div>
        </div>
      )}
    </>
  )
}
