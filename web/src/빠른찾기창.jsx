/**
 * 🔎 빠른 찾기 창 (G404) — 단추(빠른찾기.jsx)를 처음 누를 때만 받는 쪽(첫 화면 무게 그대로)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 목록만들기, 찾기 } from './lib/빠른찾기.js'
import { searchAgency, searchCorp } from './lib/data.js'
import { normCorp } from './lib/fmt.js'
import { 손끝 } from './lib/손끝고르기.js'
import { 세기 } from './lib/받은수.jsx'

let 목록약속 = null
/** 찾기 목록 — 처음 한 번만 만들고 기억(탭은 App 이 넘김) */
function 목록받기(탭) {
  if (!목록약속) {
    목록약속 = Promise.all([
      import('./data/tools.json'), import('./data/forms-min.json'), import('./data/change.json'),
      import('./data/guide.json'), import('./data/cad.json'),
    ]).then(([t, f, c, g, k]) => 목록만들기({ 탭, tools: t.default, forms: f.default, change: c.default, guide: g.default, cad: k.default }))
      .catch(() => { 목록약속 = null; return 목록만들기({ 탭 }) })
  }
  return 목록약속
}

export default function 빠른찾기창({ 탭, 닫기 }) {
  const [q, setQ] = useState('')
  const [목, set목] = useState(null)
  const [고른, set고른] = useState(0)
  const [기관, set기관] = useState([])
  const [업체, set업체] = useState([])
  const 칸 = useRef(null)
  const 늦춤 = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { 목록받기(탭).then(set목) }, [탭])
  useEffect(() => { 칸.current && 칸.current.focus() }, [])
  /* 창이 열린 동안 뒤 화면이 굴러가지 않게 */
  useEffect(() => {
    const 옛 = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 옛 }
  }, [])

  /* 기관 · 업체 — 두 글자부터 · 0.25초 쉼 · 초성만이면 안 찾음 */
  useEffect(() => {
    clearTimeout(늦춤.current)
    const s = q.trim()
    if (s.length < 2 || /^[ㄱ-ㅎ\s]+$/.test(s)) { set기관([]); set업체([]); return undefined }
    let 살 = true
    늦춤.current = setTimeout(() => {
      searchAgency(s).then((r) => { if (살) set기관((r || []).slice(0, 5)) }).catch(() => {})
      const n = normCorp(s)
      if (n.length >= 2) searchCorp(n, false).then((r) => { if (살) set업체((r || []).slice(0, 5)) }).catch(() => {})
      else set업체([])
    }, 250)
    return () => { 살 = false; clearTimeout(늦춤.current) }
  }, [q])

  const 결과 = useMemo(() => {
    const 앞 = 목 ? 찾기(목, q, 30) : []
    const 기 = 기관.map((a) => ({ 갈래: '발주기관', t: a.name, d: `공고 ${Number(a.n || 0).toLocaleString()}건`, to: '/agency/' + encodeURIComponent(a.name), ic: '🏛' }))
    const 업 = 업체.map((c) => {
      const base = String(c.key).split('#')[0]
      return { 갈래: '업체', t: c.nm || c.label, d: [c.reg, `낙찰 ${Number(c.n || 0).toLocaleString()}건`].filter(Boolean).join(' · '), to: '/corp/' + encodeURIComponent(base), ic: '🏢', firm: c.key.includes('#') ? c.key : null }
    })
    /* 도구가 아주 잘 맞으면(제목 앞) 도구 먼저 · 아니면 기관 · 업체를 도구 사이 위쪽에 */
    const 센 = 앞.filter((x) => x.점 >= 60)
    const 나머지 = 앞.filter((x) => x.점 < 60)
    return [...센, ...기, ...업, ...나머지].slice(0, 40)
  }, [목, q, 기관, 업체])

  useEffect(() => { set고른(0) }, [q])

  const 가기 = (x) => {
    if (!x) return
    세기('|빠른찾기|고름')
    닫기()
    if (x.firm) navigate(x.to, { state: { firm: x.firm } })
    else navigate(x.to)
  }
  const 키 = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); 닫기() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); set고른((i) => Math.min(결과.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); set고른((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); 가기(결과[고른]) }
  }
  /* 고른 줄이 보이게 */
  const 목록칸 = useRef(null)
  useEffect(() => {
    const el = 목록칸.current && 목록칸.current.querySelector('.qs-row.on')
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  }, [고른])

  const 빈 = !q.trim()
  return (
    <div className="qs-back" onMouseDown={(e) => { if (e.target === e.currentTarget) 닫기() }} role="dialog" aria-modal="true" aria-label="빠른 찾기">
      <div className="qs-box">
        <div className="qs-head">
          <span className="qs-mag">🔎</span>
          <input ref={칸} className="qs-in" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={키}
            placeholder="도구 · 서식 · 계산기 · 기관 · 업체 · 공고 번호 (예: 거푸집, 노무비, ㄱㅍㅈ)" autoComplete="off" spellCheck={false} />
          <button type="button" className="qs-x" onClick={닫기} aria-label="닫기">✕</button>
        </div>
        <div className="qs-list" ref={목록칸}>
          {빈 && (
            <div className="qs-tip">
              <div>낱말 하나만 쳐도 됩니다 — <b>거푸집</b> · <b>노무비</b> · <b>하도급</b> · <b>기성</b> · <b>위험성평가</b></div>
              <div>초성도 됩니다 — <b>ㄴㅁㅂ</b> → 노무비 · 공고 번호(<b>R26BK…</b>)는 그 공고로 바로</div>
              <div className="qs-key">PC: 어디서나 <kbd>/</kbd> 또는 <kbd>Ctrl</kbd>+<kbd>K</kbd> · <kbd>↑</kbd><kbd>↓</kbd> 고르고 <kbd>Enter</kbd> · <kbd>Esc</kbd> 닫기</div>
            </div>
          )}
          {!빈 && !목 && <div className="qs-tip">목록을 불러오는 중…</div>}
          {!빈 && 목 && !결과.length && <div className="qs-tip">찾은 것이 없습니다 — 다른 낱말로(예: «철근» 대신 «철근 무게»)</div>}
          {결과.map((x, i) => (
            <button key={x.갈래 + x.to + i} type="button" className={'qs-row' + (i === 고른 ? ' on' : '')}
              onMouseEnter={() => set고른(i)} {...손끝(() => 가기(x), '빠른찾기')}>
              <span className="qs-ic">{x.ic || '•'}</span>
              <span className="qs-tx">
                <span className="qs-t">{x.t}</span>
                {x.d && <span className="qs-d">{x.d.length > 90 ? x.d.slice(0, 90) + '…' : x.d}</span>}
              </span>
              <span className="qs-g">{x.갈래}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

