import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import DATA from '../data/cert.json'
import { ShareBtn } from './CorpPage.jsx'
import NotFound from './NotFound.jsx'
import * as Q from '../lib/예상문제.js'

/**
 * 📝 /cert/{종목}/quiz — 예상문제 (G628 · 2026-11-10)
 *
 * 소장님: 「최신기출문제도 해줘. 예상문제도 해주고…」
 *  · 기출 원문은 싣지 않습니다(국가기술자격 시험문제 저작권 = 한국산업인력공단) → 건설맵이 교과서 공식으로 «직접» 만든 계산 문제(lib/예상문제.js)
 *  · 한 문제씩 — 보기를 누르면 바로 채점 · 풀이 · 근거 → «다음» · 끝나면 과목별 점수 · 모의 판정(과목 40 · 평균 60 — 전 과목 다 풀었을 때만)
 *  · 틀린 문제는 이 브라우저에 모아 둡니다(localStorage kcm.예상문제.{종목} · 서버에 안 보냄) → «틀린 문제 다시 풀기»(같은 씨앗 = 같은 문제)
 *  · 차림표(과목 · 틀 이름)는 cert.json deep[종목].quiz — 구운 쪽(prerender.py)도 같은 글(시험_예상문제 ④ 가 lib 와 같은지 봄)
 */

const 번호 = ['①', '②', '③', '④']
const 새씨 = () => Math.floor(Math.random() * 4294967296) >>> 0
const 열쇠 = (s) => `kcm.예상문제.${s}`
function 오답읽기(s) {
  try {
    const v = JSON.parse(localStorage.getItem(열쇠(s)) || '[]')
    return Array.isArray(v) ? v.filter((o) => o && Q.틀of(o.id) && Number.isFinite(Number(o.씨))) : []
  } catch (e) { return [] }
}
function 오답쓰기(s, 줄) {
  try { localStorage.setItem(열쇠(s), JSON.stringify(줄.slice(-60))) } catch (e) { /* 사생활 창 · 저장 막힘 — 이 창에서만 */ }
}
const 같은문제 = (a, b) => a.id === b.id && Number(a.씨) === Number(b.씨)
const 큐넷종목 = (x) => (x && x.q ? `https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=${x.q}` : 'https://www.q-net.or.kr/')

export default function CertQuiz() {
  const { slug } = useParams()
  const x = (DATA.items || []).find((y) => y.slug === slug) || null
  const d = (DATA.deep || {})[slug]
  const 집 = Q.문제집[slug]
  const [과목, set과목] = useState(null)        /* null = 과목 전체 */
  const [몇, set몇] = useState(12)
  const [판, set판] = useState(null)            /* { 문제들, 고른[], 다시 } — null 이면 고르는 화면 */
  const [i, setI] = useState(0)
  const [오답, set오답] = useState(() => 오답읽기(slug))
  const [비움, set비움] = useState(false)
  const 카드 = useRef(null)
  const 아래 = useRef(null)
  const 처음 = useRef(true)

  useEffect(() => { if (처음.current) { 처음.current = false; return } 오답쓰기(slug, 오답) }, [slug, 오답])
  useEffect(() => { if (판 && 카드.current) 카드.current.scrollIntoView({ block: 'start' }) }, [판, i])

  const 과수 = (집 && 집.과목.length) || 6   /* 🏛 G645 — 토목 6 · 건축 5(전체는 과목 수의 1 · 2 · 5배) */
  const 수들 = 과목 ? [5, 10, 20] : [과수, 과수 * 2, 과수 * 5]
  const 지금몇 = 수들.includes(몇) ? 몇 : 수들[1]
  const 문제들 = 판 ? 판.문제들 : []
  const N = 문제들.length
  const 끝 = 판 && i >= N
  const q = 판 && !끝 ? 문제들[i] : null
  const 고른 = q ? 판.고른[i] : null

  function 시작() {
    const 들 = Q.시험지(slug, 과목 ? [과목] : null, 지금몇, 새씨())
    set판({ 문제들: 들, 고른: 들.map(() => null), 다시: false })
    setI(0)
  }
  function 다시풀기(목록) {
    const 들 = 목록.map((o) => Q.문제(o.id, o.씨)).filter(Boolean)
    if (!들.length) return
    set판({ 문제들: 들, 고른: 들.map(() => null), 다시: true })
    setI(0)
  }
  function 고름(k) {
    if (!q || 고른 != null) return
    set판((p) => ({ ...p, 고른: p.고른.map((v, j) => (j === i ? k : v)) }))
    const 표 = { id: q.id, 씨: q.씨 }
    if (k !== q.답) set오답((o) => (o.some((z) => 같은문제(z, 표)) ? o : [...o, { ...표, t: Date.now() }]))
    else set오답((o) => o.filter((z) => !같은문제(z, 표)))
  }
  const 다음 = () => setI((v) => v + 1)
  /* 고르면 풀이 · «다음» 단추가 보이게(폰은 보기 아래가 화면 밖일 때가 많음) */
  useEffect(() => { if (고른 != null && 아래.current && 아래.current.scrollIntoView) 아래.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [고른, i])

  /* PC — 숫자 1 ~ 4 로 고르고 Enter 로 다음 */
  useEffect(() => {
    if (!판) return undefined
    const f = (e) => {
      const tag = String((e.target && e.target.tagName) || '').toLowerCase()
      if (e.ctrlKey || e.metaKey || e.altKey || tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (q && 고른 == null && /^[1-4]$/.test(e.key)) { e.preventDefault(); 고름(Number(e.key) - 1) }
      else if (q && 고른 != null && e.key === 'Enter' && tag !== 'button' && tag !== 'a') { e.preventDefault(); 다음() }   /* 단추에 있으면 단추가 스스로 눌림(두 번 넘김 막음) */
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  })

  if (!x || !d || !d.quiz || !집) return <NotFound />
  const 틀목 = d.quiz.틀 || []
  const 맞은수 = 판 ? 판.고른.filter((v, j) => v != null && v === 문제들[j].답).length : 0
  const 푼수 = 판 ? 판.고른.filter((v) => v != null).length : 0

  /* ── 결과 ── */
  if (끝) {
    const r = Q.채점(slug, 문제들.map((z, j) => ({ 과목: z.과목, 맞음: 판.고른[j] === z.답 })))
    const 틀린 = 문제들.filter((z, j) => 판.고른[j] !== z.답).map((z) => ({ id: z.id, 씨: z.씨 }))
    const 판정 = !판.다시 && r.전과목
    const 색 = 판정 ? (r.합격 ? 'var(--good)' : 'var(--bad)') : 'var(--accent)'
    const 낙과목 = r.줄.filter((z) => z.점수 < r.기준.과목).map((z) => z.과목)
    return (
      <>
        <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}><Link className="btn sm line" to={`/cert/${slug}`}>← {x.n}</Link><ShareBtn /></div>
        <div className="card grade-out qz-out" style={{ borderColor: 색 }} ref={카드}>
          <div className="go-top"><span className="go-n">{r.평균}</span><span className="go-u">점(과목 평균) · {판.다시 ? `틀린 문제 ${N}개` : `${N}문제`} 중 {맞은수} 맞음</span>
            {판정 && <span className="go-g" style={{ background: 색 }}>{r.합격 ? '모의 합격' : '모의 불합격'}</span>}</div>
          <div className="qz-res">{r.줄.map((z) => (
            <div key={z.과목}><span>{z.과목}</span><em>{z.점수}점 ({z.맞음}/{z.문제})</em>
              <i><b className={z.점수 < r.기준.과목 ? 'low' : ''} style={{ width: `${Math.max(2, z.점수)}%` }} /></i></div>
          ))}</div>
          <p className="cp" style={{ margin: '10px 0 0' }}>
            {판정
              ? (r.합격 ? <>과목마다 {r.기준.과목}점 이상 · 평균 {r.기준.평균}점 이상 — <b>필기 합격선</b>입니다.</>
                : 낙과목.length ? <><b>{낙과목.join(' · ')}</b> 과락({r.기준.과목}점 아래) — 과목마다 {r.기준.과목}점 이상이어야 합니다.</>
                  : <>평균이 {r.기준.평균}점 아래입니다 — 평균 {r.기준.평균}점 이상이어야 합니다.</>)
              : 판.다시 ? <>틀린 문제를 다시 풀었습니다. 맞힌 문제는 «틀린 문제» 에서 빠집니다.</>
                : <>한 과목만 풀었습니다 — 과락({r.기준.과목}점 아래)인지 보세요. 모의 판정은 {집.과목.length}과목 전체로 풀 때 나옵니다.</>}
            {판정 && N < 과수 * 5 && <> 문제가 적으면 점수가 크게 흔들립니다 — {과수 * 5}문제로 풀어 보세요.</>}
          </p>
        </div>
        <div className="qz-btns">
          {틀린.length > 0 && <button className="btn" onClick={() => 다시풀기(틀린)}>↺ 틀린 {틀린.length}문제 다시</button>}
          <button className={'btn' + (틀린.length ? ' line' : '')} onClick={() => 시작()}>🔄 새 문제(숫자가 바뀜)</button>
          <button className="btn ghost" onClick={() => set판(null)}>과목 · 문제 수 바꾸기</button>
        </div>
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 4px' }}>📋 푼 문제 다시 보기</div>
          {문제들.map((z, j) => {
            const 맞 = 판.고른[j] === z.답
            return (
              <details className="qz-rv" key={j}>
                <summary><span className={맞 ? 'qz-o' : 'qz-x'}>{맞 ? '⭕' : '❌'}</span> {j + 1}. {z.이름}<em>{z.과목}</em></summary>
                <p className="qz-q sm">{z.문}</p>
                <div className="qz-ans">정답 {번호[z.답]} <b>{z.보기[z.답]}</b>{!맞 && 판.고른[j] != null && <> · 고른 것 {번호[판.고른[j]]} {z.보기[판.고른[j]]}</>}</div>
                <ol className="qz-steps">{z.해설.map((h, k) => <li key={k}>{h}</li>)}</ol>
                <div className="qz-src">근거 — {z.근거}</div>
              </details>
            )
          })}
        </div>
        <div className="note sm" style={{ marginTop: 10 }}>건설맵이 직접 만든 연습 문제입니다(기출 원문 아님). 점수 · 판정은 연습용이며, 실제 시험 기준 · 일정은 큐넷 원문을 따릅니다.</div>
      </>
    )
  }

  /* ── 한 문제 ── */
  if (q) {
    return (
      <>
        <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}><Link className="btn sm line" to={`/cert/${slug}`}>← {x.n}</Link><ShareBtn /></div>
        <div className="card qz" ref={카드}>
          <div className="qz-top"><span className="qz-n">{i + 1} / {N}</span><span>{q.과목}</span><span className="qz-score">맞음 {맞은수} / {푼수}</span></div>
          <div className="qz-prog"><b style={{ width: `${(i / N) * 100}%` }} /></div>
          <div className="qz-name">{판.다시 ? '↺ 틀린 문제 · ' : ''}{q.이름}</div>
          <p className="qz-q">{q.문}</p>
          <div className="qz-opts" role="group" aria-label="보기">
            {q.보기.map((t, k) => {
              const 표 = 고른 == null ? '' : k === q.답 ? ' ok' : k === 고른 ? ' no' : ' dim'
              return (
                <button key={k} type="button" className={'qz-opt' + 표} disabled={고른 != null} onClick={() => 고름(k)}>
                  <span className="qz-k">{번호[k]}</span><span className="qz-t">{t}</span>
                  {고른 != null && k === q.답 && <span className="qz-mk">⭕</span>}
                  {고른 != null && k === 고른 && k !== q.답 && <span className="qz-mk">❌</span>}
                </button>
              )
            })}
          </div>
          {고른 != null && (
            <div className={'qz-exp ' + (고른 === q.답 ? 'ok' : 'no')}>
              <b>{고른 === q.답 ? '⭕ 맞았습니다' : `❌ 정답은 ${번호[q.답]} ${q.보기[q.답]}`}</b>
              <ol className="qz-steps">{q.해설.map((h, k) => <li key={k}>{h}</li>)}</ol>
              <div className="qz-src">근거 — {q.근거}</div>
            </div>
          )}
          <div className="qz-nav" ref={아래}>
            <button type="button" className="btn ghost sm" onClick={() => set판(null)}>그만 풀기</button>
            {고른 != null && <button type="button" className="btn qz-next" onClick={다음}>{i + 1 < N ? '다음 문제 →' : '결과 보기 →'}</button>}
          </div>
        </div>
      </>
    )
  }

  /* ── 고르는 화면 ── */
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}><Link className="btn sm line" to={`/cert/${slug}`}>← {x.n}</Link><ShareBtn /></div>
      <div className="card">
        <h1 className="cert-h1">{d.quiz.h1 || `📝 ${x.n} 예상문제`}</h1>
        <p className="cp" style={{ marginTop: 6 }}>건설맵이 교과서 공식으로 <b>직접 만든</b> 계산 문제 {틀목.length}가지입니다(기출 원문 아님). <b>풀 때마다 숫자가 바뀌고</b>, 보기를 누르면 바로 채점 · 풀이 · 근거가 나옵니다.</p>
      </div>
      <div className="card">
        <div className="field"><label>과목</label>
          <div className="chips wrap">
            <button type="button" className={'chip' + (!과목 ? ' on' : '')} onClick={() => set과목(null)}>{집.과목.length}과목 전체</button>
            {집.과목.map((과) => <button type="button" key={과} className={'chip' + (과목 === 과 ? ' on' : '')} onClick={() => set과목(과)}>{과}</button>)}
          </div></div>
        <div className="field"><label>문제 수 <span className="hint">{과목 ? '이 과목만' : `${집.과목.length}과목 고르게`}</span></label>
          <div className="chips wrap">{수들.map((k) => <button type="button" key={k} className={'chip' + (지금몇 === k ? ' on' : '')} onClick={() => set몇(k)}>{k}문제</button>)}</div></div>
        <button type="button" className="btn qz-start" onClick={() => 시작()}>▶ 풀기 시작 — {과목 || `${집.과목.length}과목 전체`} {지금몇}문제</button>
        {오답.length > 0 && (
          <div className="qz-wrong">
            <button type="button" className="btn line" onClick={() => 다시풀기(오답)}>↺ 틀린 문제 다시 풀기 ({오답.length})</button>
            <button type="button" className="qz-clear" onClick={() => { if (비움) { set오답([]); set비움(false) } else set비움(true) }}>{비움 ? '한 번 더 누르면 비웁니다' : '틀린 문제 비우기'}</button>
          </div>
        )}
        <div className="go-src">틀린 문제는 이 브라우저에만 모아 둡니다(다른 폰 · PC 에는 없음).</div>
      </div>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 4px' }}>📋 들어 있는 문제 — {틀목.length}가지</div>
        {집.과목.map((과) => (
          <div className="qz-types" key={과}><b>{과}</b><span>{틀목.filter((t) => t.과목 === 과).map((t) => t.이름).join(' · ')}</span></div>
        ))}
      </div>
      {(d.quiz.예시 || []).length > 0 && (   /* 👀 맛보기 — cert.json 에 적힌 과목마다 한 문제(구운 쪽에도 같은 글 · 시험_예상문제 ④) */
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 4px' }}>👀 맛보기 — 과목마다 한 문제</div>
          {d.quiz.예시.map((z, j) => (
            <details className="qz-rv" key={j}>
              <summary>{j + 1}. {z.이름}<em>{z.과목}</em></summary>
              <p className="qz-q sm">{z.문}</p>
              <ol className="qz-ex">{z.보기.map((t, k) => <li key={k}><span className="qz-k">{번호[k]}</span> {t}</li>)}</ol>
              <div className="qz-ans">정답 {번호[z.답]} <b>{z.보기[z.답]}</b></div>
              <ol className="qz-steps">{z.해설.map((h, k) => <li key={k}>{h}</li>)}</ol>
              <div className="qz-src">근거 — {z.근거}</div>
            </details>
          ))}
          <div className="go-src">위 «풀기 시작» 으로 풀면 숫자가 바뀐 새 문제가 나옵니다.</div>
        </div>
      )}
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>📎 기출문제 원문은?</div>
        <p className="cp" style={{ margin: 0 }}>국가기술자격 시험문제의 저작권은 한국산업인력공단에 있어 옮겨 싣지 않습니다. 시험 일정 · 출제기준 원문은 큐넷에서 보세요.</p>
        <a className="row rowlink" href={큐넷종목(x)} target="_blank" rel="noopener nofollow"><span className="fic">🔗</span>
          <div className="grow"><div className="t">큐넷 — {x.n} 시험정보</div><div className="d">일정 · 수수료 · 출제기준 원문 · 원서접수</div></div><span className="go">↗</span></a>
      </div>
      <div className="note sm" style={{ marginTop: 10 }}>필기 합격 기준 — 과목마다 40점 이상 · 전 과목 평균 60점 이상(국가기술자격법 시행령 제20조). 이 쪽의 점수 · 판정은 연습용입니다.</div>
    </>
  )
}
