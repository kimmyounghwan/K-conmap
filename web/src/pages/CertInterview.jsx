import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import DATA from '../data/cert.json'
import IV from '../data/interview.json'
import { Blocks, guideMd as md } from './Guide.jsx'
import { ShareBtn } from './CorpPage.jsx'
import NotFound from './NotFound.jsx'

/**
 * 🎤 /cert/{종목}/interview — 기술사 면접 준비 (G631 · 2026-11-10)
 *
 * 소장님: 「내 컴퓨터에 기술사 서브노트 있으면 찾아서 이것도 건설맵에 올려줘. 다르게 고쳐서」 · 「이것도, 자격증 탭에 추가해서....정리해줘. 고쳐서 올려줘.」
 *  · 받은 서브노트는 «어떤 질문이 나오나» 목록으로만 — 답은 건설맵이 새로 씀 · 개인 경력(이력카드 · 본인소개)은 싣지 않음 · 품셈 숫자 안 실음
 *  · 글은 web/src/data/interview.json 한 곳(prerender.py 가 같은 글을 구움 — /tmp/g10/g631/make_interview.py 로 만듦)
 *  · 분야 칩 · 찾기 · 🎲 아무 질문(연습) · ✓ 외웠음(이 브라우저에만 · localStorage kcm.면접.{종목}) · 외운 것 빼고 보기
 */

const 열쇠 = (s) => `kcm.면접.${s}`
function 외움읽기(s) {
  try { const v = JSON.parse(localStorage.getItem(열쇠(s)) || '[]'); return new Set(Array.isArray(v) ? v.filter((x) => Number.isFinite(x)) : []) } catch (e) { return new Set() }
}
const 낱 = (s) => String(s || '').replace(/\s+/g, '').toLowerCase()

export default function CertInterview() {
  const { slug } = useParams()
  const x = (DATA.items || []).find((y) => y.slug === slug) || null
  const d = (DATA.deep || {})[slug]
  const iv = IV[slug]
  const [분야, set분야] = useState('')
  const [찾기, set찾기] = useState('')
  const [외움, set외움] = useState(() => 외움읽기(slug))
  const [외운것빼기, set외운것빼기] = useState(false)
  const [열린, set열린] = useState(() => new Set())
  const 처음 = useRef(true)
  useEffect(() => {
    if (처음.current) { 처음.current = false; return }
    try { localStorage.setItem(열쇠(slug), JSON.stringify([...외움])) } catch (e) { /* 사생활 창 — 이 창에서만 */ }
  }, [slug, 외움])

  const 보임 = useMemo(() => {
    if (!iv) return []
    const k = 낱(찾기)
    return iv.qs.filter((y) => (!분야 || y.k === 분야) && (!외운것빼기 || !외움.has(y.id))
      && (!k || 낱(y.q).includes(k) || y.a.some((t) => 낱(t).includes(k))))
  }, [iv, 분야, 찾기, 외운것빼기, 외움])

  if (!x || !d || !iv) return <NotFound />
  const 분야이름 = Object.fromEntries(iv.fields.map((f) => [f.k, f]))
  const 펼침 = (id, 열기) => set열린((o) => { const n = new Set(o); if (열기 ?? !n.has(id)) n.add(id); else n.delete(id); return n })
  const 아무거나 = () => {
    if (!보임.length) return
    const y = 보임[Math.floor(Math.random() * 보임.length)]
    set열린(new Set([y.id]))
    setTimeout(() => { const el = document.getElementById('iq-' + y.id); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' }) }, 30)
  }
  const 외움바꿈 = (id) => set외움((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <>
      <div className="btn-row" style={{ paddingTop: 14, marginBottom: 10 }}><Link className="btn sm line" to={`/cert/${slug}`}>← {x.n}</Link><ShareBtn /></div>
      <div className="card">
        <h1 className="cert-h1">{iv.h1}</h1>
        <p className="cp" style={{ marginTop: 6 }}>{md(iv.lead)}</p>
      </div>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 8px' }}>🧭 면접은 이렇게 준비합니다</div>
        <Blocks blocks={iv.how} />
      </div>
      <div className="card iv-tools">
        <div className="chips wrap">
          <button type="button" className={'chip' + (!분야 ? ' on' : '')} onClick={() => set분야('')}>전체 {iv.qs.length}</button>
          {iv.fields.map((f) => (
            <button type="button" key={f.k} className={'chip' + (분야 === f.k ? ' on' : '')} onClick={() => set분야(f.k)}>
              {f.ic} {f.n} {iv.qs.filter((y) => y.k === f.k).length}</button>
          ))}
        </div>
        <input className="cert-q" value={찾기} onChange={(e) => set찾기(e.target.value)} inputMode="search" enterKeyHint="search"
          placeholder="찾기 — 히빙 · 매스콘크리트 · 설계변경 …" aria-label="면접 질문 찾기" />
        <div className="iv-row">
          <button type="button" className="btn sm" onClick={아무거나} disabled={!보임.length}>🎲 아무 질문 하나</button>
          <button type="button" className={'chip' + (외운것빼기 ? ' on' : '')} onClick={() => set외운것빼기((v) => !v)}>외운 것 빼고 보기</button>
          <span className="iv-cnt">✓ 외움 {외움.size} / {iv.qs.length}</span>
        </div>
      </div>
      <div className="card iv-list">
        <div className="sec-title" style={{ margin: '0 0 4px' }}>📋 질문 {보임.length}개{분야 ? ` — ${분야이름[분야].ic} ${분야이름[분야].n}` : ''}</div>
        {!보임.length && <p className="cp">{찾기 ? `«${찾기}» 에 맞는 질문이 없습니다.` : '보일 질문이 없습니다.'}</p>}
        {보임.map((y) => (
          <details className="iv-q" id={'iq-' + y.id} key={y.id} open={열린.has(y.id)}
            onToggle={(e) => { const o = e.currentTarget.open; if (o !== 열린.has(y.id)) 펼침(y.id, o) }}>
            <summary><span className="iv-n">{y.id}</span><span className="iv-t">{y.q}</span>{외움.has(y.id) && <span className="iv-ok">✓</span>}</summary>
            <div className="iv-body">
              <div className="iv-k">{분야이름[y.k].ic} {분야이름[y.k].n}</div>
              <ul className="flist">{y.a.map((t, j) => <li key={j}>{md(t)}</li>)}</ul>
              {y.tip && <div className="iv-tip">💡 {y.tip}</div>}
              {y.s && (
                <div className="csrc"><span className="csrc-h">근거</span>
                  {y.s.map(([nm, url], j) => <a key={j} href={url} target="_blank" rel="noopener nofollow">{nm} ↗</a>)}</div>
              )}
              <button type="button" className={'btn sm ' + (외움.has(y.id) ? 'ghost' : 'line')} onClick={() => 외움바꿈(y.id)}>
                {외움.has(y.id) ? '✓ 외웠음 — 다시 볼 것으로' : '✓ 외웠음'}</button>
            </div>
          </details>
        ))}
      </div>
      <div className="note sm" style={{ marginTop: 10 }}>답은 건설맵이 법령 · 기준을 확인해 새로 쓴 «답 요령»입니다(받은 노트 문장을 옮기지 않음). 법령 확인: {IV.확인.법령}. 기준 숫자는 개정되므로 국가건설기준센터 원문으로 다시 확인하세요.</div>
    </>
  )
}
