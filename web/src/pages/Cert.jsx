import { useMemo, useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import DATA from '../data/cert.json'
import { Blocks, guideMd as md } from './Guide.jsx'
import { ShareBtn } from './CorpPage.jsx'
import NotFound from './NotFound.jsx'
import * as G from '../lib/등급셈.js'

/**
 * 📚 /cert · /cert/grade · /cert/{종목} — 토목 · 건축 자격증 (G625 · 2026-11-09)
 *
 * 소장님: 「탭을 하나 만들어서 타 사이트에 비해서 체계적으로 정리된 느낌으로 … 자격증 설명 을 추가해서 사이트에 반영하자」 ·
 *         「핸폰에서도 볼 수 있게」 · 「이용자가 최대한 편하게 보게 해 줘」 · 「검색 되게 해줘」 · 「토목, 건축 관련 자격증만」 ·
 *         「초급, 중급, 고급., 특급 기술자 수첩」 · 「1번하고 5번 하자, 그리고 기능사 후 나머지」
 *   ① /cert        자격 지도(토목 · 건축 · 건설안전 × 기술사 → 기능사) · 찾기 · 등급 셈 단추
 *   ② /cert/grade  건설기술인 등급 셈(역량지수 · lib/등급셈.js) · 경력증(경력수첩) 받는 길
 *   ③ /cert/{종목} 깊은 글(기술사부터 하루에 조금씩) — 글은 web/src/data/cert.json 한 곳(prerender.py 가 같은 파일로 굽습니다)
 * ⚠️ 기출문제 원문은 싣지 않습니다(국가기술자격 시험문제 저작권 = 한국산업인력공단 · 큐넷 2026.7.30 공지) — 큐넷 링크 + 직접 만든 문제.
 */

const 종목들 = DATA.items || []
const 깊은 = DATA.deep || {}
export const certBySlug = (s) => 종목들.find((x) => x.slug === s) || null
const 등급순 = DATA.levels || ['기술사', '기능장', '기사', '산업기사', '기능사']
const 큐넷 = 'https://www.q-net.or.kr/'
const 기출 = 'https://www.q-net.or.kr/cst006.do?id=cst00601&code=1203&gSite=Q'

/* 찾기 — 띄어쓰기 · 대소문자 무시 · «및» 빼고(토질및기초 = 토질 기초) */
const 낱 = (s) => String(s || '').replace(/\s+/g, '').replace(/및/g, '').toLowerCase()
function 맞나(x, q) {
  const k = 낱(q)
  if (!k) return true
  return 낱(x.n).includes(k) || 낱(x.lv).includes(k) || (x.k || []).some((w) => 낱(w).includes(k)) || 낱((DATA.groups.find((g) => g.k === x.g) || {}).n).includes(k)
}

/* 큐넷 종목별 상세정보(시험정보 · 일정 · 수수료 · 출제기준) — 번호(jmCd)는 큐넷 종목 목록에서 11-09 옮김 */
export const 큐넷종목 = (x) => (x && x.q ? `https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=${x.q}` : 큐넷)

function Chip({ x }) {
  const deep = !!깊은[x.slug]
  if (deep) return <Link className="cert-chip deep" to={`/cert/${x.slug}`}>{x.n}<span className="cc-go">›</span></Link>
  if (x.새) return <span className="cert-chip">{x.n}<em className="cc-new">{x.새}</em></span>
  /* 깊은 글이 아직 없는 종목 — 큐넷 그 종목 쪽으로(새 창) */
  return <a className="cert-chip" href={큐넷종목(x)} target="_blank" rel="noopener nofollow">{x.n}<span className="cc-ext">↗</span></a>
}

export default function CertIndex() {
  const [sp] = useSearchParams()
  const [q, setQ] = useState(() => sp.get('q') || '')   /* 빠른 찾기 · 바깥 주소(/cert?q=토목기사)에서 그 종목을 찾은 채로 */
  const 보임 = useMemo(() => 종목들.filter((x) => 맞나(x, q)), [q])
  const 등급말 = /특급|고급|중급|초급|등급|역량|경력|수첩|경력증/.test(q)
  return (
    <>
      <div className="card cert-hero">
        <h1 className="cert-h1">📚 토목 · 건축 자격증</h1>
        <p className="cp" style={{ marginTop: 6 }}>
          기능사부터 기술사까지 <b>한 장에</b> — 무슨 시험이 있고, 어떻게 올라가고, 따면 현장에서 몇 급이 되는지.
          기술사 · 기능사는 종목마다 자세히 — 기사 · 산업기사도 차례로 채웁니다.
        </p>
        <input className="cert-q" value={q} onChange={(e) => setQ(e.target.value)} inputMode="search" enterKeyHint="search"
          placeholder="찾기 — 토목기사 · 거푸집 · 측량 · 특급 …" aria-label="자격증 찾기" />
        <div className="cert-top">
          <Link className="cert-big" to="/cert/grade"><b>🎓 내 등급 셈</b><span>초급 · 중급 · 고급 · 특급 — 자격 · 경력 · 학력으로</span></Link>
          <Link className="cert-big" to="/cert/grade#suchup"><b>📘 경력수첩(경력증)</b><span>받는 곳 · 신고 · 등급 올리기</span></Link>
        </div>
      </div>
      {등급말 && (
        <Link className="row rowlink card" to="/cert/grade">
          <span className="fic">🎓</span>
          <div className="grow"><div className="t">건설기술인 등급 셈(초급 · 중급 · 고급 · 특급)</div>
            <div className="d">역량지수 = 자격 + 학력 + 경력 + 교육 — 넣으면 바로</div></div>
          <span className="go">→</span>
        </Link>
      )}
      {DATA.groups.map((g) => {
        const 갈래 = 보임.filter((x) => x.g === g.k)
        if (!갈래.length) return null
        return (
          <div className="card cert-map" key={g.k}>
            <div className="sec-title" style={{ margin: '0 0 6px' }}>{g.ic} {g.n}
              <span className="count" style={{ marginLeft: 6 }}>{g.d}</span></div>
            {등급순.map((lv) => {
              const 줄 = 갈래.filter((x) => x.lv === lv)
              if (!줄.length) return null
              return (
                <div className="cert-lv" key={lv}>
                  <div className="cert-lvn"><b>{lv}</b><span>{(DATA.lvnote || {})[lv] || ''}</span></div>
                  <div className="cert-chips">{줄.map((x) => <Chip x={x} key={x.slug} />)}</div>
                </div>
              )
            })}
          </div>
        )
      })}
      {!보임.length && !등급말 && <div className="card"><p className="cp">«{q}» 에 맞는 종목이 없습니다. 토목 · 건축 · 건설안전 종목만 있습니다.</p></div>}
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>📝 기출문제는?</div>
        <Blocks blocks={DATA.gichul || []} />
        <a className="row rowlink" href={기출} target="_blank" rel="noopener nofollow">
          <span className="fic">🔗</span><div className="grow"><div className="t">큐넷 기출문제(기술사) 자료실</div>
            <div className="d">원문은 큐넷에서 — 한국산업인력공단</div></div><span className="go">↗</span>
        </a>
      </div>
      <div className="note sm" style={{ marginTop: 10 }}>{DATA.note}</div>
    </>
  )
}

/* ── ② 등급 셈 ───────────────────────────────────────────── */
const 기억키 = 'kcm.등급셈'
const 처음 = { 갈래: 'sg', 자격: 'eng', 학력: 'ba', 대학원: '없음', 경력: [{ 년: 3, 책임: 'g' }], 일반교육: 0, 정책교육: 0, 감점: 0 }
function 읽기() {
  try { const v = JSON.parse(localStorage.getItem(기억키) || 'null'); return v && v.경력 ? { ...처음, ...v } : 처음 } catch (e) { return 처음 }
}

export function CertGrade() {
  const [입, set입] = useState(읽기)
  useEffect(() => { try { localStorage.setItem(기억키, JSON.stringify(입)) } catch (e) { /* 없음 */ } }, [입])
  useEffect(() => {
    if (window.location.hash === '#suchup') { const el = document.getElementById('suchup'); if (el) el.scrollIntoView({ block: 'start' }) }
  }, [])
  const r = G.등급셈(입)
  const g = G.갈래of(입.갈래)
  const 바꿈 = (k, v) => set입((o) => ({ ...o, [k]: v }))
  const 경력바꿈 = (i, k, v) => set입((o) => ({ ...o, 경력: o.경력.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }))
  const 색 = { 특급: '#7c3aed', 고급: '#2563eb', 중급: '#059669', 초급: '#d97706' }[r.등급] || '#6b7280'
  const 막대 = [['자격', r.자격, 40], ['학력', r.학력, 20], ['경력', r.경력, 40], ['교육', r.교육, G.확인.교육상한]]
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}><Link className="btn sm line" to="/cert">← 자격증</Link><ShareBtn /></div>
      <div className="card">
        <h1 className="cert-h1">🎓 건설기술인 등급 셈 — 초급 · 중급 · 고급 · 특급</h1>
        <p className="cp" style={{ marginTop: 6 }}>{md(DATA.grade.lead)}</p>
      </div>
      <div className="card grade-in">
        <div className="field"><label>직무 갈래</label>
          <div className="chips wrap">{G.갈래들.map((x) => <button key={x.k} className={'chip' + (입.갈래 === x.k ? ' on' : '')} onClick={() => 바꿈('갈래', x.k)}>{x.이름}</button>)}</div></div>
        <div className="field"><label>자격 <span className="hint">그 직무분야 자격 중 가장 높은 것</span></label>
          <div className="chips wrap">{G.자격들.map((x) => <button key={x.k} className={'chip' + (입.자격 === x.k ? ' on' : '')} onClick={() => 바꿈('자격', x.k)}>{x.이름} {x.점}</button>)}</div></div>
        <div className="field"><label>학력 <span className="hint">관련 학과 기준 · 비전공은 «그 밖»</span></label>
          <div className="chips wrap">{G.학력들.map((x) => <button key={x.k} className={'chip' + (입.학력 === x.k ? ' on' : '')} onClick={() => 바꿈('학력', x.k)}>{x.이름} {x.점}</button>)}</div>
          <div className="chips wrap" style={{ marginTop: 4 }}>{Object.keys(G.대학원).map((k) => <button key={k} className={'chip' + (입.대학원 === k ? ' on' : '')} onClick={() => 바꿈('대학원', k)}>{k === '없음' ? '대학원 없음' : `${k} +${G.대학원[k]}`}</button>)}</div></div>
        <div className="field"><label>경력 <span className="hint">맡은 일마다 한 줄 · 년(0.5 = 6개월)</span></label>
          {입.경력.map((c, i) => (
            <div className="grade-row" key={i}>
              <input inputMode="decimal" value={c.년} onChange={(e) => 경력바꿈(i, '년', e.target.value.replace(/[^0-9.]/g, ''))} aria-label="경력 년" />
              <span>년</span>
              <select value={c.책임} onChange={(e) => 경력바꿈(i, '책임', e.target.value)} aria-label="맡은 일">
                {G.책임들.map((x) => <option key={x.k} value={x.k}>{x.이름} ×{x.계수[g.k]}</option>)}
              </select>
              {입.경력.length > 1 && <button className="grade-x" onClick={() => set입((o) => ({ ...o, 경력: o.경력.filter((_, j) => j !== i) }))} aria-label="이 줄 빼기">✕</button>}
            </div>
          ))}
          <button className="btn sm line" onClick={() => set입((o) => ({ ...o, 경력: [...o.경력, { 년: '', 책임: 'g' }] }))}>＋ 경력 한 줄</button>
        </div>
        <div className="field"><label>교육 <span className="hint">최근 3년 · 35시간마다</span></label>
          <div className="grade-row">
            <input inputMode="numeric" value={입.일반교육 || ''} placeholder="0" onChange={(e) => 바꿈('일반교육', e.target.value.replace(/[^0-9]/g, ''))} aria-label="교육 시간" /><span>시간</span>
            <input inputMode="numeric" value={입.정책교육 || ''} placeholder="0" onChange={(e) => 바꿈('정책교육', e.target.value.replace(/[^0-9]/g, ''))} aria-label="건설정책 역량강화 교육 시간" /><span>시간(정책)</span>
          </div></div>
        <div className="field"><label>그 밖 <span className="hint">해당될 때만 누르기</span></label>
          <div className="chips wrap"><button className={'chip' + (입.다른분야 ? ' on' : '')} onClick={() => 바꿈('다른분야', !입.다른분야)}>일한 분야가 자격 · 학과 분야와 다름</button></div>
          <div className="chips wrap" style={{ marginTop: 4 }}>{G.감점들.map((x) => <button key={x.k} className={'chip' + ((Number(입.감점) || 0) === x.k ? ' on' : '')} onClick={() => 바꿈('감점', x.k)}>{x.k ? `${x.이름} −${x.k}` : '건설사고 감점 없음'}</button>)}</div></div>
      </div>
      <div className="card grade-out" style={{ borderColor: 색 }}>
        <div className="go-top"><span className="go-n">{r.합}</span><span className="go-u">점</span>
          <span className="go-g" style={{ background: 색 }}>{r.등급}</span><span className="go-c">{g.이름}</span></div>
        <div className="go-bars">{막대.map(([n, v, m]) => (
          <div className="go-bar" key={n}><span>{n}</span><i><b style={{ width: `${Math.min(100, (v / m) * 100)}%` }} /></i><em>{Math.round(v * 100) / 100} / {m}</em></div>
        ))}</div>
        {r.다른분야 && <p className="cp" style={{ margin: '8px 0 0' }}>일한 분야가 자격 · 학과 분야와 달라 <b>초급까지</b>만 인정(승급 없음)</p>}
        {r.다음 && (
          <p className="cp" style={{ margin: '8px 0 0' }}>
            <b>{r.다음.등급}</b>까지 <b>{r.다음.모자람}점</b> —
            {r.다음.경력더년 != null ? <> 지금 하는 일로 경력 약 <b>{r.다음.경력더년}년</b> 더(보정 경력 기준)</> : <> 경력만으로는 못 채움(자격 · 학력 · 교육)</>}
          </p>
        )}
        <div className="go-src">보정 경력 {r.보정년}년 · 경력지수 = log(보정 년) ÷ log 40 × 40{r.감점 ? ` · 감점 −${r.감점}(2년 · 한 등급까지)` : ''}</div>
      </div>
      {DATA.grade.secs.map((s, i) => (
        <div className="card" key={i} id={s.id || undefined}>
          <div className="sec-title" style={{ margin: '0 0 8px' }}>{s.h}</div>
          <Blocks blocks={s.blocks} />
        </div>
      ))}
      <div className="note sm" style={{ marginTop: 10 }}>{DATA.grade.note}</div>
    </>
  )
}

/* ── ③ 종목 깊은 글 ───────────────────────────────────────── */
export function CertItem() {
  const { slug } = useParams()
  const x = certBySlug(slug)
  const d = 깊은[slug]
  if (!x || !d) return <NotFound />
  const 같은 = 종목들.filter((y) => y.g === x.g && y.slug !== x.slug && 깊은[y.slug]).slice(0, 6)
  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}><Link className="btn sm line" to="/cert">← 자격증</Link><ShareBtn /></div>
      <div className="card">
        <h1 className="cert-h1">{d.h1 || x.n}</h1>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{x.lv} · {(DATA.groups.find((g) => g.k === x.g) || {}).n} · {d.sub}</div>
        <p className="cp" style={{ marginTop: 8 }}>{md(d.lead)}</p>
        {d.facts && <div className="cert-facts">{d.facts.map(([k, v], i) => <div key={i}><span>{k}</span><b>{md(v)}</b></div>)}</div>}
      </div>
      {d.secs.map((s, i) => (
        <div className="card" key={i}>
          <div className="sec-title" style={{ margin: '0 0 8px' }}>{s.h}</div>
          <Blocks blocks={s.blocks} />
        </div>
      ))}
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>이어서 볼 것</div>
        <Link className="row rowlink" to="/cert/grade"><span className="fic">🎓</span>
          <div className="grow"><div className="t">이 자격으로 몇 급? — 건설기술인 등급 셈</div></div><span className="go">→</span></Link>
        {같은.map((y) => (
          <Link className="row rowlink" to={`/cert/${y.slug}`} key={y.slug}><span className="fic">📚</span>
            <div className="grow"><div className="t">{y.n}</div></div><span className="go">→</span></Link>
        ))}
        <a className="row rowlink" href={큐넷종목(x)} target="_blank" rel="noopener nofollow"><span className="fic">🔗</span>
          <div className="grow"><div className="t">큐넷 — {x.n} 시험정보</div><div className="d">일정 · 수수료 · 출제기준 원문 · 원서접수</div></div><span className="go">↗</span></a>
      </div>
      <div className="note sm" style={{ marginTop: 10 }}>{DATA.note}</div>
    </>
  )
}
