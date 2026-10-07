/* ══════════════════════════════════════════════════════════════
   🪪 마이컨맵 — /my (만들기 · 내 작업대) · /@{주소} (내 마이컨맵 공개 페이지) (G188 · 2026-10-07)

   소장님: 「검색에 걸리게 해줘. 그리고, 만들기 단추를 주고, 만들기를 클릭하면, 자기가 원하는 것을 꾸미게 …
           다른 사이트 참고해서, 상큼하게」 → 「우선 만들어 줘. 컨맵에 띄우지는 말고」
   ■ /my       «＋ 만들기»(3단계: 나는 누구 → 이름 · 주소 · 비밀번호 → 테마) · 이 기기의 내 페이지 · 🧰 내 작업대(이 기기에만)
   ■ /@{주소}  공개 페이지(누구나) · 주인 브라우저면 «✏️ 꾸미기» — 블록 쌓기 · 옆에 폰 미리보기(PC) / 꾸미기 · 미리보기 탭(폰)
   ■ 셈 · 저장 · 규칙은 lib/마이컨맵.js 한 곳. 검색 등록 조건은 mypages.py 와 «같은 규칙».
   ■ 숨은 누적: |마이|홈 · 만들기 · 만듦 · 열기 · 저장 · 공개보기 · 전화 · 문자 · 톡 · 바로가기 · 이어하기 · 신고
   ══════════════════════════════════════════════════════════════ */
import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import NotFound from './NotFound.jsx'
import * as M from '../lib/마이컨맵.js'
import { 쓴곳읽기, 고정읽기, 그일들, 단축읽기, 단축쓰기, 단축최대 } from '../lib/마이쓴곳.js'
import { use화면상태 } from '../lib/길기록.js'
import { 세기 } from '../lib/받은수.jsx'
import { 가림 } from '../lib/가림.js'
import * as 명함 from '../lib/명함그림.js'   /* 🪪 명함 이미지 — 캔버스 · QR 은 열 때만 받음 */
import { 업체조각자료 } from '../tools/확보예가.jsx'   /* 📊 실적 칸 — 업체 조각(kb/c) 하나 · 바로투찰과 같은 파일 */   /* 글 속 전화 · 메일은 가림 — 구운 페이지(mypages.py)와 같은 규칙(클로킹 아님) · 번호는 «연락하기» 칸으로 */
import TOOLS from '../data/tools.json'
import FORMS from '../data/forms.json'

/* ── 주소 → 이름 · 아이콘 (도구 목록 · 서식 목록 그대로) ── */
const 곳표 = (() => {
  const m = new Map()
  for (const g of TOOLS.pages || []) for (const it of g.items || []) m.set(it.to, { i: it.icon, n: String(it.t).split(' — ')[0] })
  for (const t of TOOLS.tools || []) m.set(`/tools/${t.slug}`, { i: t.icon || '🧮', n: String(t.title).split(' — ')[0] })
  for (const f of FORMS.forms || []) m.set(`/forms/${f.slug}`, { i: f.icon || '📄', n: String(f.title) })
  for (const [p, i, n] of [['/tools', '🧰', '도구 모음'], ['/forms', '📄', '서식'], ['/naeyeok', '📑', '내역서'], ['/naeyeok/hado', '🤝', '하도급 내역서 만들기'],
    ['/jeoksan', '🧮', '적산'], ['/guide', '📘', '입찰 알아보기']]) if (!m.has(p)) m.set(p, { i, n })
  return m
})()
for (const [p, i, n] of [['/', '💰', '바로투찰'], ['/calc', '💰', '바로투찰'], ['/first', '🏆', '1순위 개찰'], ['/live', '📋', '입찰 공고'], ['/qna', '💬', '맵톡'], ['/jobs', '💼', '구인구직'], ['/analysis', '🔍', '분석'], ['/my', '🪪', '마이컨맵']]) if (!곳표.has(p)) 곳표.set(p, { i, n })
for (const g of 그일들) 곳표.set(g.p, { i: g.i, n: g.n })
export const 곳이름 = (p) => 곳표.get(p) || 곳표.get(String(p).split('#')[0]) || { i: '🔗', n: p }
/* 도구 블록에 고를 수 있는 것 — 도구 목록(사이트에서 바로 쓰는 것) + 계산기 */
const 고를곳 = [...곳표.keys()].filter((p) => /^\/(tools|jeoksan|change|naeyeok|safety|pdf|cad|lic)/.test(p))

const 시각 = (t) => { if (!t) return ''; const d = new Date(t); return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const 한번 = new Set()
const 한번세기 = (k) => { if (!한번.has(k)) { 한번.add(k); 세기(k) } }

/* 화면 하나가 깨져도 사이트 전체가 하얘지지 않게 */
class 지킴 extends Component {
  constructor(p) { super(p); this.state = { 틀: null } }
  static getDerivedStateFromError(e) { return { 틀: e } }
  render() {
    if (this.state.틀) return <div className="card"><p className="cp">이 화면을 그리다 멈췄습니다. 새로고침해 주십시오.</p></div>
    return this.props.children
  }
}

/* 검색엔진에 «이 페이지는 넣지 마십시오»(덜 찬 페이지 · 없는 주소 · /my) — 떠날 때 되돌림 */
function useNoindex(켬) {
  useEffect(() => {
    if (!켬) return undefined
    let m = document.querySelector('meta[name="robots"]')
    const 전 = m ? m.getAttribute('content') : null
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'robots'); document.head.appendChild(m) }
    m.setAttribute('content', 'noindex')
    return () => { if (전 == null) m.remove(); else m.setAttribute('content', 전) }
  }, [켬])
}

/* ════════════════ 공개 화면(그리기만) ════════════════ */
function 연락칸({ b, 미리 }) {
  const [보임, set보임] = useState(false)
  const 문자 = b.문자 && b.전화
  return (
    <div className="mc-contact">
      {b.전화 && (보임 || 미리
        ? <a className="mc-pill mc-pill-a" href={`tel:${b.전화.replace(/-/g, '')}`} onClick={() => { if (!미리) 세기('|마이|전화') }}>📞 {b.전화} 걸기</a>
        : <button type="button" className="mc-pill mc-pill-a" onClick={() => { set보임(true); 세기('|마이|전화') }}>📞 전화 걸기 <small>(누르면 번호가 보입니다)</small></button>)}
      {문자 && (보임 || 미리
        ? <a className="mc-pill" href={`sms:${b.전화.replace(/-/g, '')}`} onClick={() => { if (!미리) 세기('|마이|문자') }}>💬 문자 보내기</a>
        : <button type="button" className="mc-pill" onClick={() => { set보임(true); 세기('|마이|문자') }}>💬 문자 보내기</button>)}
      {b.톡 && <a className="mc-pill mc-pill-k" href={b.톡} target="_blank" rel="noopener noreferrer nofollow" onClick={() => { if (!미리) 세기('|마이|톡') }}>🗨 카카오톡으로 묻기</a>}
      {b.시간 && <div className="mc-small">🕘 연락 받는 시간 · {b.시간}</div>}
    </div>
  )
}

const 가린번호 = (d) => (String(d || '').length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-***${d.slice(8)}` : '')
const 배글 = (v) => (v == null || !isFinite(v) ? '-' : `${v >= 10 ? Math.round(v) : (Math.round(v * 10) / 10).toFixed(1)}배`)
/** 📊 실적 자동 — 사업자번호 → K-건설맵 개찰 기록(넣은 개찰 · 1순위 · 확보 예가 · 최근 5) · 번호는 가운데 가림 */
function 실적칸({ biz }) {
  const [t, setT] = useState(undefined)
  useEffect(() => {
    let 끝 = false
    setT(undefined)
    업체조각자료(biz).then((j) => { if (!끝) setT((j && j.업체 && j.업체[biz]) || null) }).catch(() => { if (!끝) setT(null) })
    return () => { 끝 = true }
  }, [biz])
  const 번 = 가린번호(biz)
  if (t === undefined) return <div className="mc-small">개찰 기록을 받는 중…</div>
  if (!t) return <div className="mc-small">사업자번호 {번} — 사이트에 실린 최근 개찰에서 아직 셀 수 있는 기록이 없습니다.</div>
  const 확배 = t.평균합 > 0 ? t.확보합 / t.평균합 : null
  const 줄 = (t.최근 || []).slice(-5).reverse()
  return (
    <>
      <div className="mc-stats">
        <div><span>넣은 개찰</span><b>{t.잰개찰}건</b></div>
        <div><span>1순위</span><b>{t.실제1순위 ?? '-'}건</b></div>
        <div><span>확보 예가</span><b>{확배 == null ? '-' : `평균의 ${배글(확배)}`}</b></div>
      </div>
      {줄.length > 0 && (
        <div className="mc-recent">
          {줄.map((x) => <div key={x.no + x.dt}><span>{String(x.dt).slice(5).replace('-', '.')}</span><b>{x.name}</b><em>{x.rank === 1 ? '🏆 ' : ''}{x.rank}/{x.n}</em></div>)}
        </div>
      )}
      <div className="mc-small" style={{ marginTop: 6 }}>K-건설맵에 실린 최근 개찰(개찰마다 금액 낮은 30곳까지)로 매일 다시 셉니다 · 사업자번호 {번}(입력한 번호의 공개 개찰 기록)</div>
    </>
  )
}

function 블록그림({ b, 종류, 미리 }) {
  const 정 = M.블록들[b.t]
  const 이름 = b.t === '면허' && 종류 === '사람' ? '자격 · 면허' : 정.이름
  let 안 = null
  if (b.t === '소개') 안 = <div className="mc-text">{가림(b.글)}</div>
  if (b.t === '면허') {
    안 = (
      <div className="mc-chips">
        {(b.면허 || []).map((x) => <span key={'m' + x} className="mc-chip mc-chip-a">{x}</span>)}
        {(b.자격 || []).map((x) => <span key={'q' + x} className="mc-chip">{x}</span>)}
      </div>
    )
  }
  if (b.t === '지역') {
    안 = (
      <>
        {(b.시도 || []).length > 0 && <div className="mc-chips">{b.시도.map((x) => <span key={x} className="mc-chip mc-chip-a">📍 {x}</span>)}</div>}
        {b.글 && <div className="mc-small" style={{ marginTop: 6 }}>{b.글}</div>}
      </>
    )
  }
  if (b.t === '연락') 안 = <연락칸 b={b} 미리={미리} />
  if (b.t === '구인') {
    안 = (
      <>
        {b.갈래 && <span className={'mc-badge' + (b.갈래 === '구함' ? ' on' : '')}>{b.갈래 === '구함' ? '🙋 사람 구함' : '🔎 일 찾음'}</span>}
        <div className="mc-text">{가림(b.글)}</div>
        <Link className="mc-more" to="/jobs">K-건설맵 구인구직 더 보기 →</Link>
      </>
    )
  }
  if (b.t === '실적') 안 = <실적칸 biz={b.사업자} />
  if (b.t === '소식') {
    안 = <div className="mc-news">{(b.글들 || []).map((x, k) => <div key={x.d + k}><span>{x.d.slice(2).replace(/-/g, '.')}</span><p>{가림(x.글)}</p></div>)}</div>
  }
  if (b.t === '도구') {
    안 = (
      <div className="mc-links">
        {(b.곳 || []).map((p) => { const g = 곳이름(p); return <Link key={p} className="mc-link" to={p}><span>{g.i}</span>{g.n}<em>→</em></Link> })}
      </div>
    )
  }
  return (
    <section className="mc-block">
      <h2 className="mc-bh"><span aria-hidden="true">{정.아이콘}</span> {이름}</h2>
      {안}
    </section>
  )
}

/** 페이지 그림 — 공개 화면 · 꾸미기 미리보기가 같이 씀(두 벌로 그리지 않음) */
export function 페이지그림({ d, a, 미리 }) {
  const 종 = M.종류들[d.종류] || M.종류들.업체
  const 블록 = (d.블록 || []).filter(M.채움)
  const 면허 = (d.블록 || []).find((b) => b.t === '면허')
  const 지역 = (d.블록 || []).find((b) => b.t === '지역')
  const 칩 = [...((면허 && 면허.면허) || []).slice(0, 3), ...((지역 && 지역.시도) || []).slice(0, 2).map((x) => '📍 ' + x)]
  const 첫글자 = (String(d.이름 || '').trim()[0] || 종.아이콘)
  return (
    <article className={'mc-page mc-th-' + M.테마of(d.테마).k}>
      <header className="mc-cover">
        <div className="mc-ava" aria-hidden="true">{첫글자}</div>
        <div className="mc-kind">{종.아이콘} {종.이름}</div>
        <h1 className="mc-name">{d.이름 || '이름을 적어 주세요'}</h1>
        {d.한줄 && <p className="mc-line">{d.한줄}</p>}
        {칩.length > 0 && <div className="mc-chips mc-chips-c">{칩.map((x) => <span key={x} className="mc-chip mc-chip-w">{x}</span>)}</div>}
      </header>
      {블록.length
        ? 블록.map((b, i) => <블록그림 key={b.t + i} b={b} 종류={d.종류} 미리={미리} />)
        : <section className="mc-block mc-empty">아직 채운 칸이 없습니다.</section>}
      <footer className="mc-foot">🪪 K-건설맵 마이컨맵{a ? <> · <b>@{a}</b></> : null}</footer>
    </article>
  )
}

/* ════════════════ 꾸미기 ════════════════ */
function 칸글({ 이름, 값, 바꿈, 최대, 줄, 보기, 도움 }) {
  return (
    <label className="mc-f">
      <span className="mc-fl">{이름}</span>
      {줄
        ? <textarea className="inp" rows={줄} maxLength={최대} value={값 || ''} placeholder={보기} onChange={(e) => 바꿈(e.target.value)} />
        : <input className="inp" maxLength={최대} value={값 || ''} placeholder={보기} onChange={(e) => 바꿈(e.target.value)} />}
      {도움 && <span className="mc-fh">{도움}</span>}
    </label>
  )
}
function 칩고르기({ 목록, 고른, 바꿈, 최대 }) {
  const 켬 = new Set(고른 || [])
  return (
    <div className="mc-chips">
      {목록.map((x) => (
        <button type="button" key={x} className={'mc-chip mc-tog' + (켬.has(x) ? ' on' : '')} aria-pressed={켬.has(x)}
          onClick={() => { const n = new Set(켬); if (n.has(x)) n.delete(x); else if (!최대 || n.size < 최대) n.add(x); 바꿈(목록.filter((y) => n.has(y))) }}>{x}</button>
      ))}
    </div>
  )
}
function 낱말더하기({ 고른, 바꿈, 보기, 최대 }) {
  const [글, set글] = useState('')
  const 넣기 = () => { const t = 글.trim().slice(0, M.한도.낱말); if (!t) return; if (!(고른 || []).includes(t) && (고른 || []).length < 최대) 바꿈([...(고른 || []), t]); set글('') }
  return (
    <div>
      <div className="mc-row">
        <input className="inp" value={글} placeholder={보기} maxLength={M.한도.낱말} onChange={(e) => set글(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); 넣기() } }} />
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={넣기}>더하기</button>
      </div>
      {(고른 || []).length > 0 && (
        <div className="mc-chips" style={{ marginTop: 6 }}>
          {고른.map((x) => <button type="button" key={x} className="mc-chip on mc-x" onClick={() => 바꿈(고른.filter((y) => y !== x))} aria-label={`${x} 빼기`}>{x} ✕</button>)}
        </div>
      )}
    </div>
  )
}

function 소식고침({ b, 고 }) {
  const [새, set새] = useState('')
  const 오늘 = (() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}` })()
  const L = b.글들 || []
  return (
    <>
      <칸글 이름="새 소식(300자)" 값={새} 바꿈={set새} 최대={M.한도.소식} 줄={3} 보기="예) 10월 둘째 주 순천 배수로 공사 시작 · 철근공 2명 더 구합니다" />
      <button type="button" className="btn line sm" style={{ width: 'auto', alignSelf: 'flex-start' }} disabled={!새.trim()}
        onClick={() => { 고('글들', [{ d: 오늘, 글: 새.trim() }, ...L].slice(0, 10)); set새('') }}>＋ 소식 올리기(맨 위에)</button>
      {L.length > 0 && (
        <div className="mc-news">
          {L.map((x, k) => <div key={x.d + k}><span>{x.d.slice(2).replace(/-/g, '.')}</span><p>{x.글}</p><button type="button" className="mc-flag" onClick={() => 고('글들', L.filter((_, j) => j !== k))} aria-label="이 소식 빼기">🗑</button></div>)}
        </div>
      )}
      <p className="mc-fh">10개까지 · 새 소식이 맨 위에 · 저장을 눌러야 페이지에 올라갑니다. 소식이 이어지면 검색에도 «살아 있는 페이지» 로 보입니다.</p>
    </>
  )
}
function 블록고침({ b, 종류, 바꿈 }) {
  const 고 = (k, v) => 바꿈({ ...b, [k]: v })
  if (b.t === '소개') {
    const n = String(b.글 || '').trim().length
    return <칸글 이름="소개 글" 값={b.글} 바꿈={(v) => 고('글', v)} 최대={M.한도.소개} 줄={6}
      보기={종류 === '사람' ? '하는 일 · 경력 · 해 본 공사 종류 · 잘하는 것' : 종류 === '장비' ? '가진 장비 · 기사 포함 여부 · 다니는 지역 · 일 받는 방식' : '하는 공사 · 강점 · 해 본 공사 종류 · 일하는 방식'}
      도움={`${n}자 · 검색 등록은 ${M.소개글자}자부터${n < M.소개글자 ? ` (${M.소개글자 - n}자 더)` : ' ✓'}`} />
  }
  if (b.t === '면허') {
    return (
      <>
        <div className="mc-fl">{종류 === '사람' ? '면허(있으면)' : '건설업 면허'}</div>
        <칩고르기 목록={M.면허목록} 고른={b.면허} 바꿈={(v) => 고('면허', v)} 최대={M.한도.면허} />
        <div className="mc-fl" style={{ marginTop: 10 }}>자격 · 기술</div>
        <낱말더하기 고른={b.자격} 바꿈={(v) => 고('자격', v)} 최대={M.한도.자격} 보기="예) 토목기사 · 건설안전기사 · 굴삭기운전기능사" />
      </>
    )
  }
  if (b.t === '지역') {
    return (
      <>
        <칩고르기 목록={M.시도들} 고른={b.시도} 바꿈={(v) => 고('시도', v)} />
        <칸글 이름="시 · 군(적고 싶으면)" 값={b.글} 바꿈={(v) => 고('글', v)} 최대={M.한도.지역글} 보기="예) 광양 · 순천 · 여수 · 고흥" />
      </>
    )
  }
  if (b.t === '연락') {
    return (
      <>
        <칸글 이름="전화번호" 값={b.전화} 바꿈={(v) => 고('전화', v)} 최대={20} 보기="010-0000-0000"
          도움="번호는 검색엔진이 읽는 글에는 안 실립니다 — 보는 분이 «전화 걸기» 를 눌러야 보입니다. 내 번호만 넣어 주십시오." />
        <label className="mc-check"><input type="checkbox" checked={!!b.문자} onChange={(e) => 고('문자', e.target.checked)} /> 같은 번호로 문자도 받기</label>
        <칸글 이름="카카오톡 오픈채팅 · 채널 주소" 값={b.톡} 바꿈={(v) => 고('톡', v)} 최대={M.한도.톡} 보기="open.kakao.com/o/… 또는 pf.kakao.com/…"
          도움={b.톡 && !M.톡정리(b.톡) ? '⚠️ open.kakao.com 또는 pf.kakao.com 주소만 됩니다' : '번호를 드러내지 않고 연락받는 길입니다'} />
        <칸글 이름="연락 받는 시간(적고 싶으면)" 값={b.시간} 바꿈={(v) => 고('시간', v)} 최대={M.한도.시간} 보기="예) 평일 7시~18시" />
      </>
    )
  }
  if (b.t === '구인') {
    return (
      <>
        <div className="mc-chips">
          {[['구함', '🙋 사람 구함'], ['찾음', '🔎 일 찾음']].map(([k, t]) => (
            <button type="button" key={k} className={'mc-chip mc-tog' + (b.갈래 === k ? ' on' : '')} aria-pressed={b.갈래 === k} onClick={() => 고('갈래', b.갈래 === k ? '' : k)}>{t}</button>
          ))}
        </div>
        <칸글 이름="내용" 값={b.글} 바꿈={(v) => 고('글', v)} 최대={M.한도.구인} 줄={4} 보기="예) 철근공 2명 · 10월 중순부터 한 달 · 광양 현장" />
      </>
    )
  }
  if (b.t === '실적') {
    const d = String(b.사업자 || '')
    return (
      <>
        <칸글 이름="내 사업자번호(10자리)" 값={d.length > 5 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : d} 바꿈={(v) => 고('사업자', v.replace(/[^0-9]/g, '').slice(0, 10))} 최대={12} 보기="000-00-00000"
          도움="넣으면 K-건설맵 개찰 기록(넣은 개찰 · 1순위 · 확보 예가 · 최근 5건)이 저절로 붙습니다. 페이지에는 가운데를 가린 번호로 보입니다. 내 회사 번호만 넣어 주십시오." />
        {d.length === 10 && <div className="mc-mini-rec"><실적칸 biz={d} /></div>}
      </>
    )
  }
  if (b.t === '소식') return <소식고침 b={b} 고={고} />
  if (b.t === '도구') {
    const 쓴 = [...고정읽기(), ...쓴곳읽기().map((x) => x.p)].filter((p, i, a) => a.indexOf(p) === i)
    const 켬 = new Set(b.곳 || [])
    const 바꾸기 = (p) => { const n = [...(b.곳 || [])]; const i = n.indexOf(p); if (i >= 0) n.splice(i, 1); else if (n.length < M.한도.곳) n.push(p); 고('곳', n) }
    return (
      <>
        <div className="mc-fh" style={{ marginBottom: 6 }}>보는 분께 «이것 써 보세요» 하고 권할 K-건설맵 도구 · 서식</div>
        {쓴.length > 0 && (
          <>
            <div className="mc-fl">내가 자주 쓴 것</div>
            <div className="mc-chips">{쓴.slice(0, 12).map((p) => <button type="button" key={p} className={'mc-chip mc-tog' + (켬.has(p) ? ' on' : '')} onClick={() => 바꾸기(p)}>{곳이름(p).i} {곳이름(p).n}</button>)}</div>
          </>
        )}
        <label className="mc-f" style={{ marginTop: 8 }}>
          <span className="mc-fl">목록에서 더하기</span>
          <select className="inp" value="" onChange={(e) => { if (e.target.value) 바꾸기(e.target.value) }}>
            <option value="">— 도구 · 계산기 고르기 —</option>
            {고를곳.filter((p) => !켬.has(p)).map((p) => <option key={p} value={p}>{곳이름(p).i} {곳이름(p).n}</option>)}
          </select>
        </label>
        {(b.곳 || []).length > 0 && <div className="mc-chips" style={{ marginTop: 6 }}>{b.곳.map((p) => <button type="button" key={p} className="mc-chip on mc-x" onClick={() => 바꾸기(p)}>{곳이름(p).n} ✕</button>)}</div>}
      </>
    )
  }
  return null
}

/* 🌐 공개 범위 고르기 — 소장님 「공개, 비공개 선택할 수 있게 해줘....마이컨맵」 */
function 공개고르기({ 값, 바꿈 }) {
  return (
    <div className="mc-vis" role="radiogroup" aria-label="공개 범위">
      {M.공개들.map((x) => (
        <button type="button" key={x.k} role="radio" aria-checked={값 === x.k} className={'mc-vis-o' + (값 === x.k ? ' on' : '')} onClick={() => 바꿈(x.k)}>
          <b><span aria-hidden="true">{x.아이콘}</span> {x.이름}</b>
          <small>{x.설명}</small>
        </button>
      ))}
    </div>
  )
}

function 검색막대({ d }) {
  const s = M.검색칸(d)
  const 범위 = M.공개of(d.공개)
  if (범위.k !== '공개') {
    return (
      <div className="mc-seo">
        <div className="mc-seo-h">{범위.아이콘} {범위.이름} — 검색에는 내지 않습니다</div>
        <p className="mc-fh">{범위.k === '링크'
          ? '주소를 아는 사람 · 명함 QR 을 찍은 사람만 봅니다. 검색에 내려면 «🌐 공개» 로 바꾸십시오.'
          : '남이 내 주소를 열면 «비공개 페이지» 로만 보입니다. 이 기기와 비밀번호를 넣은 기기에서만 내용이 보입니다.'}</p>
      </div>
    )
  }
  return (
    <div className={'mc-seo' + (s.열림 ? ' ok' : '')}>
      <div className="mc-seo-h">{s.열림 ? '🔎 검색 등록 준비 끝 — 다음 사이트 갱신 때 검색에 냅니다' : `🔎 검색 등록까지 ${s.남은}칸 남음`}</div>
      <div className="mc-seo-bar" aria-hidden="true"><i style={{ width: `${Math.round(((3 - s.남은) / 3) * 100)}%` }} /></div>
      <ul>{s.칸.map((c) => <li key={c.k} className={c.됨 ? 'on' : ''}>{c.됨 ? '✓' : '○'} {c.이름}{!c.됨 && c.목표 > 1 ? <em> · 지금 {c.지금}</em> : null}</li>)}</ul>
      {!s.열림 && <p className="mc-fh">칸을 다 채운 페이지만 검색에 냅니다 — 빈 페이지가 많으면 사이트 전체가 검색에서 밀립니다.</p>}
    </div>
  )
}

function 꾸미기({ a, 처음, 저장됨 }) {
  const [d, setD] = useState(처음)
  const [바뀜, set바뀜] = useState(false)
  const [상태, set상태] = useState({ 말: '', 바쁨: false })
  const [열쇠칸, set열쇠칸] = useState(false)
  const [pw, setPw] = useState('')
  const [보기, set보기] = useState('꾸미기')     /* 폰: 꾸미기 · 미리보기 */
  const [더함, set더함] = useState(false)
  const 고 = (v) => { setD((x) => ({ ...x, ...v })); set바뀜(true) }
  const 블록바꿈 = (i, nb) => { setD((x) => ({ ...x, 블록: x.블록.map((b, j) => (j === i ? nb : b)) })); set바뀜(true) }
  const 옮김 = (i, k) => { setD((x) => { const L = [...x.블록]; const j = i + k; if (j < 0 || j >= L.length) return x; [L[i], L[j]] = [L[j], L[i]]; return { ...x, 블록: L } }); set바뀜(true) }
  const 뺌 = (i) => { setD((x) => ({ ...x, 블록: x.블록.filter((_, j) => j !== i) })); set바뀜(true) }
  const 넣음 = (t) => { setD((x) => ({ ...x, 블록: [...x.블록, M.블록정리({ t })] })); set바뀜(true); set더함(false) }
  useEffect(() => {   /* 저장 안 하고 떠나려 하면 묻기(브라우저 기본) */
    if (!바뀜) return undefined
    const f = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', f)
    return () => window.removeEventListener('beforeunload', f)
  }, [바뀜])
  const 저장하기 = async () => {
    set상태({ 말: '저장하는 중…', 바쁨: true })
    try {
      const 새 = await M.저장(a, d)
      setD(새); set바뀜(false); set열쇠칸(false); set상태({ 말: `✅ 저장했습니다 · ${시각(새.upd)}`, 바쁨: false })
      세기('|마이|저장'); 저장됨(새)
    } catch (e) {
      if (e && e.code === '열쇠') { set열쇠칸(true); set상태({ 말: '이 기기에서 고치려면 비밀번호를 한 번 넣어 주십시오.', 바쁨: false }) } else set상태({ 말: '저장하지 못했습니다 — 잠시 뒤 다시 눌러 주십시오.', 바쁨: false })
    }
  }
  const 열쇠넣기 = async () => {
    try { await M.열기(a, pw); setPw(''); await 저장하기() } catch (e) { set상태({ 말: e && e.code === '틀림' ? '비밀번호가 다릅니다.' : '잠시 뒤 다시 해 주십시오.', 바쁨: false }) }
  }
  const 남은블록 = M.블록차례.filter((t) => !d.블록.some((b) => b.t === t))
  return (
    <div className="mc-edit">
      <div className="mc-tabs" role="tablist">
        {['꾸미기', '미리보기'].map((k) => <button type="button" key={k} role="tab" aria-selected={보기 === k} className={보기 === k ? 'on' : ''} onClick={() => set보기(k)}>{k === '꾸미기' ? '✏️ 꾸미기' : '👀 미리보기'}</button>)}
      </div>
      <div className="mc-edit-g">
        <div className={'mc-edit-l' + (보기 === '꾸미기' ? '' : ' mc-hide-m')}>
          <section className="card mc-ec">
            <h3 className="mc-eh">🎨 표지</h3>
            <칸글 이름="이름(상호 · 이름)" 값={d.이름} 바꿈={(v) => 고({ 이름: v })} 최대={M.한도.이름} 보기="예) 대유건설" />
            <칸글 이름="한 줄 소개" 값={d.한줄} 바꿈={(v) => 고({ 한줄: v })} 최대={M.한도.한줄} 보기={(M.종류들[d.종류] || M.종류들.업체).보기} />
            <div className="mc-fl">테마</div>
            <div className="mc-themes">
              {M.테마들.map((t) => (
                <button type="button" key={t.k} className={'mc-sw' + (d.테마 === t.k ? ' on' : '')} style={{ '--sw': t.a }} aria-pressed={d.테마 === t.k} onClick={() => 고({ 테마: t.k })}>
                  <i aria-hidden="true" />{t.이름}
                </button>
              ))}
            </div>
            <div className="mc-fl">공개 범위</div>
            <공개고르기 값={d.공개 || '공개'} 바꿈={(v) => 고({ 공개: v })} />
            <span className="mc-fh">저장을 누르면 바로 바뀝니다 — 언제든 다시 바꿀 수 있습니다.</span>
          </section>
          {d.블록.map((b, i) => (
            <section key={b.t + i} className="card mc-ec">
              <div className="mc-ebh">
                <h3 className="mc-eh">{M.블록들[b.t].아이콘} {b.t === '면허' && d.종류 === '사람' ? '자격 · 면허' : M.블록들[b.t].이름}{M.채움(b) ? <span className="mc-done">채움</span> : null}</h3>
                <div className="mc-ebtn">
                  <button type="button" onClick={() => 옮김(i, -1)} disabled={i === 0} aria-label="위로">▲</button>
                  <button type="button" onClick={() => 옮김(i, 1)} disabled={i === d.블록.length - 1} aria-label="아래로">▼</button>
                  <button type="button" onClick={() => 뺌(i)} aria-label="이 칸 빼기">🗑</button>
                </div>
              </div>
              <블록고침 b={b} 종류={d.종류} 바꿈={(nb) => 블록바꿈(i, nb)} />
            </section>
          ))}
          {남은블록.length > 0 && (더함
            ? (
              <div className="card mc-ec">
                <div className="mc-fl">어떤 칸을 더할까요?</div>
                <div className="mc-addg">
                  {남은블록.map((t) => <button type="button" key={t} className="mc-add" onClick={() => 넣음(t)}><b>{M.블록들[t].아이콘}</b>{M.블록들[t].이름}</button>)}
                </div>
                <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 8 }} onClick={() => set더함(false)}>그만</button>
              </div>
            )
            : <button type="button" className="mc-plus" onClick={() => set더함(true)}>＋ 칸 더하기</button>)}
          <검색막대 d={d} />
        </div>
        <div className={'mc-edit-r' + (보기 === '미리보기' ? '' : ' mc-hide-m')}>
          <div className="mc-phone"><div className="mc-phone-in"><페이지그림 d={M.정리(d)} a={a} 미리 /></div></div>
        </div>
      </div>
      <div className="mc-savebar">
        <span className="mc-savet">{상태.말 || (바뀜 ? '저장 안 한 것이 있습니다' : '고친 것이 없습니다')}</span>
        {열쇠칸 && (
          <span className="mc-row">
            <input className="inp" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" style={{ width: 130 }} />
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={열쇠넣기}>확인</button>
          </span>
        )}
        <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!바뀜 || 상태.바쁨} onClick={저장하기}>💾 저장</button>
      </div>
    </div>
  )
}

/* ════════════════ /@{주소} ════════════════ */
/* 🪪 명함 이미지 — 소장님 「마이컨맵에 이미지 명함만들기 자동으로 생성 가능하지?」 → 「명함은 멋스럽게 해줘.」
   주인에게만 보임 · 이 기기에서 그려 받음(서버 · 비용 0) · 페이지를 고치면 명함도 따라 바뀜 */
function 명함판({ d, a }) {
  const [설, set설] = useState(() => 명함.설정읽기(a))   /* ✏️ 명함에만 쓰는 것 — 이 기기에만 */
  const 꼴 = 명함.꼴들.some((x) => x.k === 설.꼴) ? 설.꼴 : 'clean'
  const [칸, set칸] = useState(undefined)              /* undefined 받는 중 · null 못 받음 */
  const [말, set말] = useState('')
  const [글열림, set글열림] = useState(false)
  const cv = useRef(null)
  const 내 = useMemo(() => 명함.명함내용(d, a, 설), [d, a, 설])
  useEffect(() => { let 끝 = false; 명함.qr칸(내.qr주소).then((x) => { if (!끝) set칸(x) }); return () => { 끝 = true } }, [내.qr주소])
  useEffect(() => { if (cv.current && 칸 !== undefined) 명함.명함그리기(cv.current, 1063, 591, 꼴, 내, 칸) }, [꼴, 내, 칸])
  const 고 = (x) => set설((o) => { const v = { ...o, ...x }; 명함.설정쓰기(a, v); return v })
  const 켬고 = (k) => 고({ 켬: { ...설.켬, [k]: !설.켬[k] } })
  const 바꾼것 = !!(설.이름 || 설.직함 || 설.한줄 || 설.전화 || 설.색 || Object.values(설.켬).some((v) => !v))
  const 이름 = (끝) => `마이컨맵_명함_${a}${끝}.png`
  async function 받기(종류) {
    set말('')
    const c = document.createElement('canvas')
    let b
    if (종류 === 'qr') { 명함.qr만그리기(c, 칸, a); b = await 명함.그림덩이(c) }
    else if (종류 === '인쇄') { 명함.명함그리기(c, 1063, 591, 꼴, 내, 칸); b = await 명함.dpi적기(await 명함.그림덩이(c), 300) }
    else { 명함.명함그리기(c, 1701, 946, 꼴, 내, 칸); b = await 명함.그림덩이(c) }
    if (!b) { set말('그림을 만들지 못했습니다 — 다시 눌러 주십시오.'); return }
    if (종류 === '공유') {
      const 됨 = await 명함.그림공유(b, 이름(''), `${내.이름} — ${내.qr주소}`)
      세기('|마이|명함받기')
      if (!됨) { 명함.내려받기(b, 이름('')); set말('이 기기는 바로 보내기가 안 되어 그림으로 받았습니다 — 사진첩에서 보내 주십시오.') }
      return
    }
    명함.내려받기(b, 종류 === 'qr' ? `마이컨맵_QR_${a}.png` : 이름(종류 === '인쇄' ? '_인쇄용_90x50mm' : ''))
    세기(종류 === 'qr' ? '|마이|QR받기' : '|마이|명함받기')
  }
  const 공유됨 = typeof navigator !== 'undefined' && !!navigator.canShare
  const 페이지색 = M.테마of(d.테마)
  return (
    <div className="card mc-bc">
      <div className="mc-bc-h">
        <b>🪪 명함 이미지</b>
        <span className="muted">내 페이지 내용으로 저절로 만듭니다 — 바탕 · 색 · 글은 명함에만 따로 바꿀 수 있습니다</span>
      </div>
      <div className="mc-bc-row">
        <span className="mc-bc-l">바탕</span>
        <div className="mc-bc-kk" role="radiogroup" aria-label="명함 바탕">
          {명함.꼴들.map((x) => (
            <button key={x.k} type="button" role="radio" aria-checked={꼴 === x.k} className={'mc-bc-k mc-bc-k-' + x.k + (꼴 === x.k ? ' on' : '')} onClick={() => 고({ 꼴: x.k })}>
              <i aria-hidden="true" style={x.k === 'wave' ? { background: `linear-gradient(135deg, ${내.테마.a}, #ffffff)` } : x.k === 'clean' ? { borderLeftColor: 내.테마.a } : undefined} />
              <span>{x.이름}<small>{x.설명}</small></span>
            </button>
          ))}
        </div>
      </div>
      <div className="mc-bc-row">
        <span className="mc-bc-l">색</span>
        <div className="mc-row" role="radiogroup" aria-label="명함 색">
          <button type="button" role="radio" aria-checked={!설.색} className={'mc-sw' + (!설.색 ? ' on' : '')} style={{ '--sw': 페이지색.a }} onClick={() => 고({ 색: '' })}><i aria-hidden="true" />페이지 색</button>
          {M.테마들.filter((t) => t.k !== d.테마).map((t) => (
            <button type="button" key={t.k} role="radio" aria-checked={설.색 === t.k} className={'mc-sw' + (설.색 === t.k ? ' on' : '')} style={{ '--sw': t.a }} onClick={() => 고({ 색: t.k })}><i aria-hidden="true" />{t.이름}</button>
          ))}
          {꼴 === 'ink' && <span className="mc-fh" style={{ flexBasis: '100%' }}>먹금은 먹색 · 금색으로 정해져 있습니다 — 고른 색은 «깔끔 · 물결» 에 들어갑니다.</span>}
        </div>
      </div>
      <div className="mc-bc-view">
        {칸 === undefined && <div className="mc-bc-wait">QR 을 만드는 중…</div>}
        <canvas ref={cv} aria-label={`${내.이름} 명함 미리보기`} />
      </div>
      <div className="mc-bc-row">
        <span className="mc-bc-l">넣을 것</span>
        <div className="mc-chips">
          {[['전화', d.블록 && (d.블록.find((b) => b.t === '연락') || {}).톡 ? '전화 · 카톡' : '전화'], ['지역', '지역'], ['면허', '면허 · 자격'], ['qr', 'QR']].map(([k, t]) => (
            <button type="button" key={k} className={'mc-chip mc-tog' + (설.켬[k] ? ' on' : '')} aria-pressed={!!설.켬[k]} onClick={() => 켬고(k)}>{설.켬[k] ? '✓ ' : ''}{t}</button>
          ))}
        </div>
      </div>
      <div className="mc-bc-edit">
        <button type="button" className="mc-bc-et" aria-expanded={글열림} onClick={() => set글열림(!글열림)}>✏️ 명함 글 고치기 <small>{글열림 ? '접기 ▲' : '이름 · 직함 · 한 줄 · 전화 ▼'}</small></button>
        {글열림 && (
          <div className="mc-bc-ef">
            <칸글 이름="이름(크게)" 값={설.이름} 바꿈={(v) => 고({ 이름: v })} 최대={명함.명함한도.이름} 보기={d.이름} 도움="비우면 페이지 이름 그대로" />
            <칸글 이름="직함 · 담당자" 값={설.직함} 바꿈={(v) => 고({ 직함: v })} 최대={명함.명함한도.직함} 보기="예) 대표 김명환 · 토목 현장소장" />
            <칸글 이름="한 줄 소개" 값={설.한줄} 바꿈={(v) => 고({ 한줄: v })} 최대={명함.명함한도.한줄} 보기={d.한줄 || '예) 철콘 · 토공 전문 — 전남 동부권'} />
            <칸글 이름="명함에 쓸 전화" 값={설.전화} 바꿈={(v) => 고({ 전화: M.전화정리(v) })} 최대={명함.명함한도.전화} 보기={(d.블록 && (d.블록.find((b) => b.t === '연락') || {}).전화) || '010-0000-0000'} 도움="비우면 «연락하기» 칸 번호 그대로" />
          </div>
        )}
      </div>
      <div className="mc-bc-btns">
        {공유됨 && <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={칸 === undefined} onClick={() => 받기('공유')}>📤 카톡 · 문자로 보내기</button>}
        <button type="button" className={'btn sm' + (공유됨 ? ' line' : '')} style={{ width: 'auto' }} disabled={칸 === undefined} onClick={() => 받기('폰')}>📱 폰 · 카톡용 받기</button>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={칸 === undefined} onClick={() => 받기('인쇄')}>🖨 인쇄용 받기 · 90×50mm</button>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!칸} onClick={() => 받기('qr')}>🔳 QR 만 받기</button>
      </div>
      {d.공개 === '나만' && 설.켬.qr && <p className="mc-fh">🔒 지금 «나만 보기» 입니다 — QR 을 찍은 분에게는 «비공개 페이지» 로 보입니다. 명함을 돌리실 때는 «🔗 주소 아는 사람만» 이나 «🌐 공개» 로 바꾸십시오.</p>}
      {말 && <p className="mc-fh" role="status">{말}</p>}
      {칸 === null && <p className="mc-fh">QR 을 만들지 못했습니다(망) — QR 없이 그렸습니다. 새로고침하면 다시 만듭니다.</p>}
      <ul className="mc-bc-note">
        <li>바탕 · 색 · 명함 글은 <b>이 기기에만</b> 저장됩니다 — 페이지는 바뀌지 않고, 서버에도 올라가지 않습니다.
          {바꾼것 && <> <button type="button" className="mc-bc-reset" onClick={() => { 명함.설정지우기(a); set설(명함.설정읽기(a)) }}>↺ 페이지대로 되돌리기</button></>}</li>
        <li>인쇄용은 명함 크기(90×50mm · 300dpi) 그대로입니다. 인쇄소에서 «재단 여백»을 달라고 하면 이 그림을 가운데 두고 둘레를 바탕색으로 채워 달라고 하시면 됩니다.</li>
        <li>QR 을 찍으면 이 페이지(@{a})가 열립니다 — 현장 게시판 · 차량 · 견적서에는 «QR 만 받기»를 붙이십시오.</li>
      </ul>
    </div>
  )
}

function 공개안() {
  const { at } = useParams()
  const loc = useLocation()
  const navigate = useNavigate()
  const a = M.주소정리(decodeURIComponent(String(at || '').slice(1)))
  const [d, setD] = useState(undefined)       /* undefined 받는 중 · null 없음 */
  const [숨김, set숨김] = useState(false)
  const [틀, set틀] = useState(false)
  const 주인 = M.내것인가(a)
  const [고침, set고침] = use화면상태('꾸미기', !!(loc.state && loc.state.꾸미기))
  const [신고말, set신고말] = useState('')
  const [복사, set복사] = useState(false)
  const [명함열림, set명함열림] = useState(false)
  useEffect(() => {
    let 끝 = false
    setD(undefined); set틀(false)
    Promise.all([M.불러오기(a), M.신고수(a)])
      .then(([x, n]) => { if (!끝) { setD(x); set숨김(n >= 3) } })
      .catch(() => { if (!끝) { set틀(true); setD(null) } })
    return () => { 끝 = true }
  }, [a])
  const 잠김 = !!(d && d.나만 === true && !d.이름)          /* 🔒 나만 보기 — 이 기기엔 열쇠가 없음 */
  useEffect(() => { if (d && !주인) 한번세기(잠김 ? '|마이|비공개봄' : '|마이|공개보기') }, [d, 주인, 잠김])
  useEffect(() => {
    if (!d) return
    document.title = 잠김 ? '비공개 페이지 | K-건설맵 마이컨맵' : `${d.이름}${d.한줄 ? ' — ' + d.한줄 : ''} | K-건설맵 마이컨맵`
  }, [d, 잠김])
  useNoindex(d === null || 숨김 || 잠김 || (d && !M.검색됨(d)))
  if (d === undefined) return <div className="mc-wrap"><div className="skel" /><div className="skel" /><div className="skel" /></div>
  if (d === null) {
    const 말 = M.주소검사(a)
    return (
      <div className="mc-wrap">
        <div className="card mc-none">
          <h1 className="mc-eh">🪪 @{a}</h1>
          <p className="cp">{틀 ? '페이지를 불러오지 못했습니다 — 잠시 뒤 새로고침해 주십시오.' : '아직 만들어지지 않은 주소입니다.'}</p>
          {!틀 && !말 && <Link className="btn sm" style={{ width: 'auto' }} to="/my" state={{ 주소: a }}>＋ 이 주소로 내 페이지 만들기</Link>}
        </div>
      </div>
    )
  }
  if (잠김) {
    return (
      <div className="mc-wrap">
        <div className="card mc-none">
          <h1 className="mc-eh">🔒 @{a}</h1>
          <p className="cp">주인이 «나만 보기» 로 둔 비공개 페이지입니다.</p>
          {주인
            ? <p className="cp muted">내 페이지라면 이 기기에 비밀번호를 한 번 넣어 주십시오 — <Link to="/my">마이컨맵 → 🔑 다른 기기에서 만든 내 페이지 열기</Link></p>
            : <Link className="btn line sm" style={{ width: 'auto' }} to="/my" onClick={() => 세기('|마이|만들기')}>🪪 나도 마이컨맵 만들기</Link>}
        </div>
      </div>
    )
  }
  if (숨김 && !주인) {
    return <div className="mc-wrap"><div className="card mc-none"><p className="cp">신고가 많이 들어와 잠시 가린 페이지입니다.</p></div></div>
  }
  const 주소복사 = async () => { try { await navigator.clipboard.writeText(M.공개주소(a)); set복사(true); setTimeout(() => set복사(false), 1500) } catch (e) { set복사(false) } }
  return (
    <div className="mc-wrap">
      {주인 && (
        <div className="mc-owner">
          <span className="mc-owner-t">🔑 내 페이지 · <b>@{a}</b> · <span className={'mc-vis-b mc-vis-' + M.공개of(d.공개).k}>{M.공개of(d.공개).아이콘} {M.공개of(d.공개).이름}</span></span>
          <div className="mc-row">
            <button type="button" className={'btn sm' + (고침 ? ' line' : '')} style={{ width: 'auto' }} onClick={() => set고침(!고침)}>{고침 ? '👀 다 꾸몄어요' : '✏️ 꾸미기'}</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={주소복사}>{복사 ? '✅ 복사됨' : '🔗 주소 복사'}</button>
            <button type="button" className={'btn sm' + (명함열림 ? '' : ' line')} style={{ width: 'auto' }} aria-expanded={명함열림} onClick={() => { if (!명함열림) 세기('|마이|명함'); set명함열림(!명함열림) }}>🪪 명함 이미지</button>
            <Link className="btn line sm" style={{ width: 'auto' }} to="/my">🧰 내 작업대</Link>
          </div>
        </div>
      )}
      {주인 && 명함열림 && !고침 && <명함판 d={d} a={a} />}
      {주인 && 고침
        ? <꾸미기 a={a} 처음={d} 저장됨={(x) => setD(x)} />
        : (
          <>
            <페이지그림 d={d} a={a} />
            {주인 && <검색막대 d={d} />}
            <div className="mc-after">
              <Link to="/my" onClick={() => 세기('|마이|만들기')}>🪪 나도 마이컨맵 만들기</Link>
              {!주인 && (신고말
                ? <span className="muted">{신고말}</span>
                : <button type="button" className="mc-flag" onClick={async () => { try { await M.신고(a); set신고말('신고했습니다. 고맙습니다.'); 세기('|마이|신고') } catch (e) { set신고말('이미 신고하셨습니다.') } }}>🚩 신고</button>)}
            </div>
          </>
        )}
      {주인 && !고침 && <p className="mc-fh" style={{ textAlign: 'center' }}>{d.공개 === '나만' ? '🔒 나만 보기 — 다른 분에게는 «비공개 페이지» 로만 보입니다.' : '다른 분에게는 위 «내 페이지» 줄 없이 이 모습 그대로 보입니다.'}</p>}
      {false && navigate}
    </div>
  )
}
export function MyAt() {
  const { at } = useParams()
  if (!String(at || '').startsWith('@') || String(at).length < 3) return <NotFound />
  return <지킴><공개안 /></지킴>
}

/* ════════════════ /my ════════════════ */
function 만들기단계({ 끝, 처음주소 }) {
  const navigate = useNavigate()
  const [단계, set단계, 앞단계로] = use화면상태('마이단계', 1)
  const [종류, set종류] = useState('업체')
  const [이름, set이름] = useState('')
  const [한줄, set한줄] = useState('')
  const [주소, set주소] = useState(처음주소 || '')
  const [주소말, set주소말] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [테마, set테마] = useState('mint')
  const [공개, set공개] = useState('공개')
  const [바쁨, set바쁨] = useState(false)
  const [말, set말] = useState('')
  const a = M.주소정리(주소)
  useEffect(() => {   /* 주소를 쓰면 0.5초 뒤 «쓸 수 있나» */
    const 틀 = M.주소검사(a)
    if (!주소) { set주소말(''); return undefined }
    if (틀) { set주소말('⚠️ ' + 틀); return undefined }
    set주소말('확인하는 중…')
    const t = setTimeout(() => { M.불러오기(a).then((x) => set주소말(x ? '⚠️ 이미 누가 쓰는 주소입니다' : '✅ 쓸 수 있는 주소입니다')).catch(() => set주소말('')) }, 500)
    return () => clearTimeout(t)
  }, [a, 주소])
  const 둘째됨 = 이름.trim().length >= 1 && !M.주소검사(a) && !/⚠️/.test(주소말) && pw.length >= 4 && pw === pw2
  const 만들자 = async () => {
    set바쁨(true); set말('')
    try {
      await M.만들기(a, pw, { ...M.새문서(종류, 이름, 한줄, 테마), 공개 })
      세기('|마이|만듦')
      끝()
      navigate(M.페이지주소(a), { state: { 꾸미기: true } })
    } catch (e) {
      set말(e && e.code === '있음' ? '⚠️ 그 사이에 누가 이 주소를 썼습니다 — 다른 주소로 정해 주십시오.' : '만들지 못했습니다 — 잠시 뒤 다시 해 주십시오.')
      if (e && e.code === '있음') set단계(2)
    } finally { set바쁨(false) }
  }
  const 미리문서 = M.새문서(종류, 이름 || '내 이름', 한줄, 테마)
  return (
    <div className="card mc-wiz">
      <div className="mc-steps" aria-label={`3단계 중 ${단계}단계`}>{[1, 2, 3].map((n) => <i key={n} className={n <= 단계 ? 'on' : ''} />)}</div>
      {단계 === 1 && (
        <>
          <h2 className="mc-eh">① 나는 누구인가요?</h2>
          <div className="mc-kinds">
            {Object.entries(M.종류들).map(([k, v]) => (
              <button type="button" key={k} className={'mc-kindc' + (종류 === k ? ' on' : '')} onClick={() => { set종류(k); set단계(2) }}>
                <b aria-hidden="true">{v.아이콘}</b><span>{v.이름}</span><em>{v.설명}</em>
              </button>
            ))}
          </div>
        </>
      )}
      {단계 === 2 && (
        <>
          <h2 className="mc-eh">② 이름 · 주소 · 비밀번호</h2>
          <칸글 이름="이름(상호 · 이름)" 값={이름} 바꿈={set이름} 최대={M.한도.이름} 보기={종류 === '사람' ? '예) 김OO 소장' : '예) 대유건설'} />
          <칸글 이름="한 줄 소개" 값={한줄} 바꿈={set한줄} 최대={M.한도.한줄} 보기={M.종류들[종류].보기} />
          <label className="mc-f">
            <span className="mc-fl">페이지 주소</span>
            <span className="mc-addr"><em>k-conmap.com/@</em><input className="inp" value={주소} maxLength={24} placeholder="대유건설" onChange={(e) => set주소(e.target.value)} /></span>
            <span className="mc-fh">{주소말 || '한글 · 영문 소문자 · 숫자 · 붙임표(-) 2~20자 — 한 번 정하면 못 바꿉니다'}{a && a !== 주소.trim() ? ` → 주소는 k-conmap.com/@${a}` : ''}</span>
          </label>
          <div className="mc-row mc-pw">
            <label className="mc-f"><span className="mc-fl">비밀번호(4자 이상)</span><input className="inp" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
            <label className="mc-f"><span className="mc-fl">한 번 더</span><input className="inp" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
          </div>
          <p className="mc-fh">🔑 다른 기기에서 고칠 때 이 주소와 비밀번호를 씁니다. 회원가입은 없습니다 — 비밀번호를 잊으면 되찾을 길이 없으니 꼭 적어 두십시오.{pw2 && pw !== pw2 ? ' ⚠️ 두 비밀번호가 다릅니다.' : ''}</p>
          <div className="mc-row">
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 앞단계로(1)}>‹ 앞으로</button>
            <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={!둘째됨} onClick={() => set단계(3)}>다음 ›</button>
          </div>
        </>
      )}
      {단계 === 3 && (
        <>
          <h2 className="mc-eh">③ 테마 · 공개 범위</h2>
          <div className="mc-themes">
            {M.테마들.map((t) => (
              <button type="button" key={t.k} className={'mc-sw' + (테마 === t.k ? ' on' : '')} style={{ '--sw': t.a }} aria-pressed={테마 === t.k} onClick={() => set테마(t.k)}><i aria-hidden="true" />{t.이름}</button>
            ))}
          </div>
          <div className="mc-fl">공개 범위 <span className="mc-fh">— 나중에 «✏️ 꾸미기» 에서 언제든 바꿉니다</span></div>
          <공개고르기 값={공개} 바꿈={set공개} />
          <div className="mc-mini"><페이지그림 d={미리문서} a={a} 미리 /></div>
          {말 && <p className="mc-fh">{말}</p>}
          <div className="mc-row">
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 앞단계로(2)}>‹ 앞으로</button>
            <button type="button" className="btn sm" style={{ width: 'auto' }} disabled={바쁨} onClick={만들자}>{바쁨 ? '만드는 중…' : '🪪 만들고 꾸미러 가기'}</button>
          </div>
        </>
      )}
    </div>
  )
}

function 다른기기열기() {
  const navigate = useNavigate()
  const [열림, set열림] = useState(false)
  const [주소, set주소] = useState('')
  const [pw, setPw] = useState('')
  const [말, set말] = useState('')
  if (!열림) return <button type="button" className="mc-linkbtn" onClick={() => set열림(true)}>🔑 다른 기기에서 만든 내 페이지 열기</button>
  const 열자 = async () => {
    const a = M.주소정리(주소)
    set말('여는 중…')
    try { await M.열기(a, pw); 세기('|마이|열기'); navigate(M.페이지주소(a), { state: { 꾸미기: true } }) } catch (e) { set말(e && e.message ? '⚠️ ' + e.message : '잠시 뒤 다시 해 주십시오.') }
  }
  return (
    <div className="card mc-ec">
      <div className="mc-row mc-pw">
        <label className="mc-f"><span className="mc-fl">주소(@ 뒤)</span><input className="inp" value={주소} onChange={(e) => set주소(e.target.value)} /></label>
        <label className="mc-f"><span className="mc-fl">비밀번호</span><input className="inp" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      </div>
      <div className="mc-row"><button type="button" className="btn sm" style={{ width: 'auto' }} onClick={열자}>열기</button><span className="mc-fh">{말}</span></div>
    </div>
  )
}

/* ⚡ 내 단축키 판 — 아이콘을 누르면 그 프로그램 · 그 일로 바로(PC 숫자 1~9) · ✏️ 편집으로 순서 · 빼기 · ＋ 로 더하기 */
function 단축고르기({ 있는, 더함, 닫기 }) {
  const [q, setQ] = useState('')
  const 쓴 = [...고정읽기(), ...쓴곳읽기().map((x) => x.p)].filter((p, k, a) => a.indexOf(p) === k)
  const 서식 = (FORMS.forms || []).map((f) => `/forms/${f.slug}`)
  const 맞 = (p) => !있는.includes(p) && (!q.trim() || 곳이름(p).n.includes(q.trim()))
  const 묶음 = [
    ['⚡ 그 일로 바로', 그일들.map((g) => g.p)],
    ['🕘 내가 자주 쓴 것', 쓴],
    ['🧰 도구 · 계산기', 고를곳],
    ['📄 서식', 서식],
  ]
  return (
    <div className="card mc-ec mc-pick">
      <div className="mc-row" style={{ justifyContent: 'space-between' }}>
        <b>＋ 단축키 더하기</b>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={닫기}>다 했어요</button>
      </div>
      <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="찾기 — 노무비 · 착공계 · 견적 …" aria-label="단축키 찾기" />
      {묶음.map(([h, L]) => {
        const 보 = L.filter(맞).slice(0, q.trim() ? 40 : 12)
        if (!보.length) return null
        return (
          <div key={h}>
            <div className="mc-fl" style={{ margin: '6px 0 4px' }}>{h}</div>
            <div className="mc-chips">{보.map((p) => <button type="button" key={p} className="mc-chip mc-tog" onClick={() => 더함(p)}>{곳이름(p).i} {곳이름(p).n}</button>)}</div>
          </div>
        )
      })}
      <p className="mc-fh">{있는.length}/{단축최대}개 · 이 기기에만 저장됩니다.</p>
    </div>
  )
}
function 단축키판() {
  const navigate = useNavigate()
  const [L, setL] = useState(() => 단축읽기())
  const [편집, set편집] = useState(false)
  const [더하기, set더하기] = useState(false)
  const 바꿈 = (v) => setL(단축쓰기(v))
  useEffect(() => {   /* PC 숫자 1~9 — 글 칸에 쓰는 중이면 안 함 */
    const f = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || 편집) return
      const t = e.target && e.target.tagName
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t) || (e.target && e.target.isContentEditable)) return
      const n = Number(e.key)
      if (n >= 1 && n <= 9 && L[n - 1]) { e.preventDefault(); 세기('|마이|숫자키'); navigate(L[n - 1]) }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [L, 편집, navigate])
  const 옮김 = (k, d) => { const v = [...L]; const j = k + d; if (j < 0 || j >= v.length) return; [v[k], v[j]] = [v[j], v[k]]; 바꿈(v) }
  return (
    <section className="mc-keys">
      <div className="mc-keys-h">
        <h2 className="mc-dh">⚡ 내 단축키 <small>누르면 그 일로 바로 · PC는 숫자 1~9</small></h2>
        <button type="button" className={'btn sm' + (편집 ? '' : ' line')} style={{ width: 'auto' }} onClick={() => { set편집(!편집); set더하기(false) }}>{편집 ? '다 했어요' : '✏️ 편집'}</button>
      </div>
      <div className={'mc-keyg' + (편집 ? ' edit' : '')}>
        {L.map((p, k) => {
          const g = 곳이름(p)
          return (
            <div key={p} className="mc-key">
              {편집
                ? (
                  <div className="mc-key-in">
                    <span className="mc-key-i" aria-hidden="true">{g.i}</span><span className="mc-key-n">{g.n}</span>
                    <div className="mc-key-e">
                      <button type="button" onClick={() => 옮김(k, -1)} disabled={k === 0} aria-label="앞으로">◀</button>
                      <button type="button" onClick={() => 바꿈(L.filter((x) => x !== p))} aria-label="빼기">✕</button>
                      <button type="button" onClick={() => 옮김(k, 1)} disabled={k === L.length - 1} aria-label="뒤로">▶</button>
                    </div>
                  </div>
                )
                : (
                  <Link className="mc-key-in" to={p} onClick={() => 세기('|마이|단축키')}>
                    {k < 9 && <em className="mc-key-k">{k + 1}</em>}
                    <span className="mc-key-i" aria-hidden="true">{g.i}</span><span className="mc-key-n">{g.n}</span>
                  </Link>
                )}
            </div>
          )
        })}
        {L.length < 단축최대 && (
          <div className="mc-key">
            <button type="button" className="mc-key-in mc-key-add" onClick={() => { set더하기(true); set편집(true) }}><span className="mc-key-i">＋</span><span className="mc-key-n">단축키 더하기</span></button>
          </div>
        )}
      </div>
      {더하기 && <단축고르기 있는={L} 더함={(p) => { 바꿈([...L, p]); 세기('|마이|단축키더함') }} 닫기={() => { set더하기(false); set편집(false) }} />}
    </section>
  )
}

function 작업대() {
  const 작업 = useMemo(() => M.하던작업(), [])
  return (
    <section className="mc-desk">
      <h2 className="mc-dh">🧰 내 작업대 <small>이 기기에만 보입니다 · 서버에 안 갑니다</small></h2>
      <div className="card mc-ec">
        <h3 className="mc-eh">✏️ 하던 작업 이어서</h3>
        {작업.length
          ? <div className="mc-tools">{작업.map((w) => <div key={w.곳} className="mc-tool"><Link to={w.곳} onClick={() => 세기('|마이|이어하기')}><span aria-hidden="true">{w.아이콘}</span><b>{w.이름}</b><em>{w.줄}</em></Link></div>)}</div>
          : <p className="cp muted" style={{ margin: 0 }}>이 기기에 남은 작업이 없습니다. 노무비 · 투입비 · 작업일보 같은 도구에 적으면 여기서 바로 이어 갑니다.</p>}
      </div>
      <div className="card mc-ec">
        <h3 className="mc-eh">📋 내 공고</h3>
        <div className="mc-tools">
          <div className="mc-tool"><Link to="/" onClick={() => 세기('|마이|바로가기')}><span aria-hidden="true">⚡</span><b>오늘 넣을 것</b><em>내 면허 · 지역 · 마감 임박 순</em></Link></div>
          <div className="mc-tool"><Link to="/live" onClick={() => 세기('|마이|바로가기')}><span aria-hidden="true">⭐</span><b>공고 · 담은 공고</b><em>담아 두면 1순위가 나올 때 알림</em></Link></div>
        </div>
      </div>
      {/* 💼 G188 — 탭 자리를 마이컨맵에 내준 구인구직(A안) · 화면 · 글 · 주소는 그대로 */}
      <div className="card mc-ec">
        <h3 className="mc-eh">💼 구인 · 구직</h3>
        <div className="mc-tools">
          <div className="mc-tool"><Link to="/jobs" onClick={() => 세기('|마이|구인')}><span aria-hidden="true">💼</span><b>구인구직 보기</b><em>곧 착공하는 낙찰 현장 · 구인 글 · 고용24 채용</em></Link></div>
        </div>
      </div>
    </section>
  )
}

/* 📖 마이컨맵 쓰는 법 — 소장님 「설명 자세히 넣어줘. 의견은 적극반영한다는 말과 함께」
   「자기만의 주소를 갖는다는 것과 명함....그리고, 건설맵 이용 편의성 등...이런것도 설명에 넣어줘」 */
const 설명들 = [
  ['🏷', '나만의 주소 — k-conmap.com/@내주소',
    '업체 이름이나 내 이름으로 주소를 하나 정합니다(예: k-conmap.com/@대유건설). 홈페이지를 따로 만들지 않아도 이 주소 하나가 내 소개 페이지가 됩니다. 견적서 · 문자 · 카톡 프로필에 주소만 붙이면 하는 일 · 면허 · 일하는 지역 · 연락 방법을 한 번에 보여 드릴 수 있습니다. 주소는 먼저 정한 분의 것이고, 한 번 정하면 내 것으로 남습니다.'],
  ['🪪', '명함 이미지 — 저절로 만들어집니다',
    '페이지에 적은 내용으로 명함 그림을 바로 만듭니다. 깔끔 · 물결 · 먹금 세 가지 바탕에 색을 고르고, 직함 · 명함에 쓸 전화번호를 따로 넣을 수 있습니다. 폰 · 카톡용, 인쇄용(90×50mm · 인쇄소에 그대로), QR 만 받기가 있습니다. 명함의 QR 을 찍으면 내 페이지가 열립니다.'],
  ['⚡', '내 단축키 — 건설맵을 내 손에 맞게',
    '자주 쓰는 도구 · 서식을 단축키판에 올려 두면 누르는 즉시 그 일로 갑니다 — 바로투찰 기초금액 칸, 노무비 이 달 지급명세서, 착공계 · 준공계 서식처럼 «하려는 자리» 까지 바로 데려갑니다. PC 에서는 숫자 1~9 로도 엽니다. 처음에는 자주 쓴 것으로 저절로 채워지고, ✏️ 편집으로 차례를 바꾸거나 뺍니다. 폰 바탕화면 아이콘을 길게 누르면 마이컨맵 · 바로투찰 · 노무비 · 서식으로 바로 가는 메뉴도 뜹니다.'],
  ['🧰', '내 작업대 — 하던 일을 이어서',
    '노무비 · 투입비 · 작업일보 · 견적서 같은 도구에 적어 둔 것을 한곳에 모아 바로 이어 갑니다. 오늘 넣을 공고 · 담은 공고, 💼 구인 · 구직(곧 착공하는 낙찰 현장 · 구인 글 · 고용24 채용)도 여기서 들어갑니다. 작업대에 보이는 것은 이 기기에만 있고 서버로 보내지 않습니다.'],
  ['🧱', '꾸미기 — 블록을 쌓듯이',
    '소개 · 면허/자격 · 일하는 지역 · 연락하기 · 개찰 실적 · 소식 · 구인/구직 · 함께 쓰는 도구 칸을 골라 넣고 ▲▼ 로 차례를 바꿉니다. 사업자번호를 넣으면 K-건설맵에 실린 최근 개찰 기록(넣은 개찰 · 1순위 · 확보 예가)이 저절로 붙고, 소식 칸에는 «이번 주 순천 현장 시작» 같은 짧은 글을 10개까지 올립니다. 테마 색은 6가지, 폰 미리보기를 보면서 고칩니다.'],
  ['🌐', '공개 범위 — 내가 정합니다',
    '🌐 공개: 누구나 보고, 칸을 다 채우면 검색에도 나옵니다. 🔗 주소 아는 사람만: 검색에는 안 나오고 명함 QR · 링크로 연 분만 봅니다. 🔒 나만 보기: 남이 열면 «비공개 페이지» 로만 보이고, 내용은 서버에서도 남이 읽지 못하게 따로 둡니다. 언제든 «✏️ 꾸미기» 에서 바꿉니다.'],
  ['🔎', '검색에 나오려면',
    '«🌐 공개» 로 두고 한 줄 소개 · 소개 글 100자 · 채운 칸 3개를 채우면 다음 사이트 갱신 때 검색에 냅니다. 꾸미기 화면 아래 막대가 몇 칸 남았는지 알려 드립니다. 덜 채운 페이지는 검색에 내지 않습니다 — 빈 페이지가 많으면 사이트 전체가 검색에서 밀리기 때문입니다(링크로는 그대로 열립니다).'],
  ['📞', '연락처는 안전하게',
    '전화번호 · 카톡 주소는 페이지 글에 그대로 적히지 않고, 보는 분이 «전화 걸기 · 문자 · 카카오톡» 단추를 눌러야 나옵니다. 소개 · 소식 글 속에 적은 전화 · 메일은 가려서 보여 드립니다. 광고 업자가 번호를 긁어 가기 어렵게 한 것입니다. 이상한 페이지는 🚩 신고가 3건 모이면 가려집니다.'],
  ['🔐', '가입 없이 — 주소와 비밀번호 하나',
    '회원가입 · 이메일 없이 주소와 비밀번호(4자 이상)만 정하면 만들어집니다. 다른 기기(PC ↔ 폰)에서는 이 화면의 «🔑 다른 기기에서 만든 내 페이지 열기» 에 주소 · 비밀번호를 넣으면 이어서 고칩니다. 비밀번호는 잊지 않게 적어 두십시오.'],
  ['💰', '비용 — 모두 무료',
    '만들기 · 꾸미기 · 명함 이미지 · 단축키 · 작업대 모두 무료입니다. 명함 그림은 내 기기에서 바로 그려서 받으므로 따로 드는 것이 없습니다.'],
]
function 마이설명() {
  return (
    <section className="card mc-guide" aria-labelledby="mc-guide-h">
      <h2 className="mc-dh" id="mc-guide-h">📖 마이컨맵 — 이렇게 씁니다</h2>
      <p className="cp muted" style={{ margin: '0 0 10px' }}>건설하는 분 한 분 한 분이 «내 주소 · 내 명함 · 내 단축키» 를 갖고, K-건설맵을 내 손에 맞게 쓰는 곳입니다.</p>
      <div className="mc-guide-g">
        {설명들.map(([i, h, p]) => (
          <div key={h} className="mc-guide-i">
            <h3><span aria-hidden="true">{i}</span> {h}</h3>
            <p>{p}</p>
          </div>
        ))}
      </div>
      <div className="mc-guide-end">
        <b>🙏 의견은 적극 반영하겠습니다</b>
        <p>마이컨맵은 이제 막 문을 열었습니다. 써 보시고 불편한 점, 더 있었으면 하는 칸 · 기능을 맵톡에 한 줄 남겨 주십시오. 남겨 주신 의견은 적극 반영해 다음 판에 넣겠습니다.</p>
        <Link className="btn sm" style={{ width: 'auto' }} to="/qna#go-mt-say" onClick={() => 세기('|마이|의견')}>💬 맵톡에 의견 남기기</Link>
      </div>
    </section>
  )
}

function 마이홈() {
  const loc = useLocation()
  const [내것, set내것] = useState(() => M.내주소들())
  const [만드는중, set만드는중] = use화면상태('마이만들기', !!(loc.state && loc.state.주소))
  useEffect(() => { document.title = '마이컨맵 만들기 · 내 작업대 | K-건설맵'; 한번세기('|마이|홈') }, [])
  useNoindex(true)
  return (
    <div className="mc-wrap">
      <단축키판 />
      <section className={'mc-hero' + (내것.length ? ' sm' : '')}>
        <div className="mc-hero-t">🪪 마이컨맵</div>
        <h1 className="mc-hero-h">나만의 마이컨맵,<br />1분이면 만듭니다</h1>
        <p className="mc-hero-p">업체 · 현장 사람 · 장비 — 하는 일과 면허 · 지역 · 연락처를 한 장에. 다 채우면 검색에도 나옵니다.</p>
        {!만드는중 && <button type="button" className="mc-cta" onClick={() => { set만드는중(true); 세기('|마이|만들기') }}>＋ 만들기</button>}
      </section>
      {만드는중 && <만들기단계 처음주소={(loc.state && loc.state.주소) || ''} 끝={() => set내것(M.내주소들())} />}
      {!내것.length && !만드는중 && <마이설명 />}
      {내것.length > 0 && (
        <section className="mc-mine">
          <h2 className="mc-dh">🔑 이 기기의 내 페이지</h2>
          <div className="mc-tools">
            {내것.map((x) => (
              <div key={x.a} className="mc-tool">
                <Link to={M.페이지주소(x.a)}><span aria-hidden="true">🪪</span><b>{x.n || x.a}</b><em>@{x.a}</em></Link>
                <button type="button" title="이 기기에서 잊기(페이지는 남음)" aria-label="이 기기에서 잊기" onClick={() => set내것(M.내주소잊기(x.a))}>✕</button>
              </div>
            ))}
          </div>
        </section>
      )}
      <다른기기열기 />
      <작업대 />
      {(내것.length > 0 || 만드는중) && <마이설명 />}
    </div>
  )
}

export default function MyConmap() {
  return <지킴><마이홈 /></지킴>
}
