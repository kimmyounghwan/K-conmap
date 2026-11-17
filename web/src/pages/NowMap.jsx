/**
 * 🗺 G756 건설맵 공사 현황판 — /map · /map/{시도} (2026-11-17)
 *
 * 소장님: 「지도에 공사 현황판 만들어서, 클릭하면 공사 요약이 나오게 하는 걸 만들면.. ?? 아이디어 줘」
 *        → 「건설맵 공사 현황판 만들어 줘.」 · 「아이디어 추가 해서 최대한 이용자 입장에서 편하게 만들어」 · 「맵톡 지도를 활용하면 어때???」
 * ■ 맵톡과 같은 바탕(오로라 · 한국지도 · 핀 · 위 알림 — mt-* 그대로) · 핀 = 시 · 군 공사 수(크기) · 단계(색)
 * ■ 시도를 누르면 그 시도로 크게 + 목록 · 핀을 누르면 그 시 · 군 목록 · 공사를 누르면 요약 카드(공고 보기 · 바로투찰 · 담기 · 공유)
 * ■ 거르기: 단계 · 금액 · 내 면허만(공고 탭과 같은 저장) · 찾기 · 📍 내 지역(공고 탭 · 바로투찰과 같은 저장)
 * ■ 주소에 상태(시도 · 시 · 군 · 단계 · 금액 · 찾기 · 공고) — 카톡으로 보내면 그 자리가 바로 열림 · 뒤로가기
 * ■ 자료: /data/now/sum.json(늘) · /data/now/{시도}.json(그 시도를 고를 때만) — 현황판.py · 비용 0
 * ■ 📊 세기: |현황판|열기 · 시도 · 곳 · 카드 · 공고 · 바로투찰 · 담기 · 공유 · 내지역 · 찾기
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getJSON } from '../lib/data.js'
import { 세기 } from '../lib/받은수.jsx'
import { loadRegion, saveRegion, loadLicCodes } from '../lib/lic.js'
import { inBasket, toggleBasket } from '../lib/basket.js'
import { 짧은이름 } from '../lib/맵톡.js'
import {
  단계표, 시도목록, 금액칸들, 줄풀기, 거르기, 곳수, 핀크기, 큰단계, 보는틀, 디데이, 금액글, 날짧게, 주소읽기, 주소만들기, 공유글, 시도핀들, 수짧게, 핀펴기, 핀줄이기,
} from '../lib/현황판.js'

const 퍼 = (v) => (v * 100).toFixed(3) + '%'
const 언제 = (s) => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/)
  if (!m) return ''
  const t = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+09:00`)
  const 분 = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (분 < 2) return '방금'
  if (분 < 60) return `${분}분 전`
  const 시간 = Math.round(분 / 60)
  return 시간 < 24 ? `${시간}시간 전` : `${Math.round(시간 / 24)}일 전`
}
const 좁은화면 = () => { try { return window.matchMedia('(max-width: 640px)').matches } catch (e) { return false } }

export default function NowMap() {
  const 별 = useParams()['*'] || ''          // /map/* 하나의 길 — /map ↔ /map/전남 을 오가도 화면이 새로 안 뜸(상태 · 받은 자료 그대로)
  const 길시도 = (() => { try { return decodeURIComponent(String(별).split('/')[0]) } catch (e) { return String(별).split('/')[0] } })()
  const loc = useLocation()
  const nav = useNavigate()
  const 처음 = useMemo(() => 주소읽기(loc.search, 길시도), [])   // eslint-disable-line react-hooks/exhaustive-deps
  const [시도, set시도] = useState(처음.시도)
  const [k, setK] = useState(처음.k)
  const [단계, set단계] = useState(() => new Set(처음.단계.length ? 처음.단계 : [0, 1, 2]))
  const [금액, set금액] = useState(처음.금액)
  const [찾기, set찾기] = useState(처음.찾기)
  const [열린, set열린] = useState(처음.no)
  const [내면허만, set내면허만] = useState(false)
  const 내면허 = useMemo(() => loadLicCodes(), [])
  const [내지역, set내지역] = useState(() => loadRegion())
  const [바탕, set바탕] = useState(null)
  const [합, set합] = useState(undefined)          // undefined 받는 중 · null 못 받음
  const [시도자료, set시도자료] = useState({})      // {시도: 줄들 | null}
  const [돌기, set돌기] = useState(0)
  const [알림, set알림] = useState('')
  const [, 다시] = useState(0)
  const 목록 = useRef(null)
  const 좁음 = 좁은화면()
  /* 지도 크기(px) — 시 · 군 핀이 겹치지 않게 벌릴 때 씀(폰 · PC · 창 크기 바뀜) */
  const 지도칸 = useRef(null)
  const [지도크기, set지도크기] = useState([0, 0])
  useLayoutEffect(() => {
    const 재기 = () => {
      const el = 지도칸.current
      if (!el) return
      const r = el.getBoundingClientRect()
      set지도크기((o) => (Math.abs(o[0] - r.width) < 1 && Math.abs(o[1] - r.height) < 1 ? o : [r.width, r.height]))
    }
    재기()
    window.addEventListener('resize', 재기)
    let ro = null
    try { ro = new ResizeObserver(재기); if (지도칸.current) ro.observe(지도칸.current) } catch (e) { /* 옛 브라우저 — resize 만 */ }
    return () => { window.removeEventListener('resize', 재기); if (ro) ro.disconnect() }
  }, [바탕])

  useEffect(() => {
    세기('|현황판|열기')
    let 살 = true
    import('../data/한국지도.json').then((m) => { if (살) set바탕(m.default || m) }).catch(() => {})
    getJSON('/data/now/sum.json').then((v) => { if (살) set합(v && v.n ? v : null) })
    const iv = setInterval(() => set돌기((n) => n + 1), 5200)
    const 재 = () => 다시((n) => n + 1)
    window.addEventListener('resize', 재)
    return () => { 살 = false; clearInterval(iv); window.removeEventListener('resize', 재) }
  }, [])
  /* 시도 자료 — 고른 시도만(한 번 받으면 그 탭에서 다시 안 받음) */
  useEffect(() => {
    if (!시도 || 시도자료[시도] !== undefined) return
    let 살 = true
    getJSON(`/data/now/${encodeURIComponent(시도)}.json`).then((v) => {
      if (!살) return
      set시도자료((o) => ({ ...o, [시도]: v && Array.isArray(v.줄) ? v.줄.map(줄풀기).filter(Boolean) : null }))
    })
    return () => { 살 = false }
  }, [시도])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 주소 — 상태가 바뀌면 주소도 바꿈(공유는 이 주소 그대로).
     시 · 도 · 시 · 군이 바뀌면 기록을 한 칸 쌓음 → 폰 뒤로가기 = 한 단계 위로(시 · 군 → 시 · 도 → 전국 → 들어온 곳).
     단계 · 금액 · 찾기 · 카드 열기는 바꿔 두기만(쌓지 않음 — 글자 칠 때마다 쌓이면 뒤로가기가 안 끝남). */
  const 앞자리 = useRef(`${처음.시도}|${처음.k}`)
  const 되감는중 = useRef(false)
  useEffect(() => {
    const 새 = 주소만들기({ 시도, k, 단계: [...단계], 금액, 찾기: 찾기.trim(), no: 열린 })
    const 자리 = `${시도}|${k}`
    const 쌓기 = 자리 !== 앞자리.current && !되감는중.current
    앞자리.current = 자리
    되감는중.current = false
    if (새 !== loc.pathname + loc.search) nav(새, { replace: !쌓기 })
  }, [시도, k, 단계, 금액, 찾기, 열린])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 뒤로 · 앞으로 · 맨 위 «←» · 길(공사 현황판 › 전남)의 링크 — 주소가 바깥에서 바뀌면 주소대로 상태를 맞춤
     (같은 화면 안이라 화면이 새로 안 뜸 · 위에서 내가 바꾼 주소면 상태와 같아 그냥 지나감) */
  useEffect(() => {
    const u = 주소읽기(loc.search, 길시도)
    const u단계 = u.단계.length ? u.단계 : [0, 1, 2]
    if (u.시도 === 시도 && u.k === k && u.금액 === 금액 && u.찾기 === 찾기.trim() && u.no === 열린 && [...u단계].sort().join() === [...단계].sort().join()) return
    되감는중.current = true
    set시도(u.시도); setK(u.k); set금액(u.금액); set찾기(u.찾기); set열린(u.no); set단계(new Set(u단계))
  }, [loc.key])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 공유 주소로 들어오면 그 카드로 한 번 내려감(시도 목록 · 전국 큰 공사 둘 다) */
  const 내려감 = useRef(false)
  useEffect(() => {
    if (!처음.no || 내려감.current || (시도 ? !시도자료[시도] : !합)) return
    const t = setTimeout(() => {
      const el = document.getElementById('nm-' + 처음.no)
      if (el) { 내려감.current = true; el.scrollIntoView({ block: 'center', behavior: 'smooth' }) }
    }, 300)
    return () => clearTimeout(t)
  }, [시도자료[시도], 합])   // eslint-disable-line react-hooks/exhaustive-deps

  const 곳표 = useMemo(() => { const o = {}; for (const p of (바탕 && 바탕.곳) || []) o[p.k] = p; return o }, [바탕])
  const 곳이름 = (kk) => (곳표[kk] ? 짧은이름(곳표[kk].n) : '')
  const 틀 = useMemo(() => 보는틀(바탕, 시도), [바탕, 시도])
  const 거름 = { 단계, 금액, 면허: 내면허만 ? 내면허 : [], 찾기 }
  const 시도줄 = 시도 ? 시도자료[시도] : undefined
  /* 핀 수 — 시도 자료가 있으면 그 자료로(금액 · 면허 · 찾기까지 거른 수) · 없으면 sum 의 곳 셈(단계만) */
  const 핀수 = useMemo(() => {
    if (시도 && Array.isArray(시도줄)) {
      const o = {}
      for (const r of 거르기(시도줄, { ...거름, k: '' })) if (r.k) o[r.k] = (o[r.k] || 0) + 1
      return o
    }
    return 곳수(합 && 합.곳, 단계)
  }, [합, 시도, 시도줄, 단계, 금액, 내면허만, 찾기])   // eslint-disable-line react-hooks/exhaustive-deps
  const 보이는줄 = useMemo(() => (Array.isArray(시도줄) ? 거르기(시도줄, { ...거름, k }) : []), [시도줄, 단계, 금액, 내면허만, 찾기, k])   // eslint-disable-line react-hooks/exhaustive-deps
  const 큰공사 = useMemo(() => 거르기(((합 && 합.큰) || []).map(줄풀기).filter(Boolean), 거름), [합, 단계, 금액, 내면허만, 찾기])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 시 · 도를 크게 볼 때 그 안 시 · 군 핀 — 겹치면 조금씩 벌림(핀펴기) */
  const 시군핀 = useMemo(() => {
    if (!바탕 || !시도) return []
    const ps = []
    for (const [kk, n] of Object.entries(핀수)) {
      const p = 곳표[kk]
      if (!p || p.d !== 시도) continue
      const x = (p.x - 틀.x) / 틀.w, y = (p.y - 틀.y) / 틀.h
      if (x < 0 || x > 1 || y < 0 || y > 1) continue
      const a = (합 && 합.곳 && 합.곳[kk]) || [0, 0, 0]
      ps.push({ k: kk, n, x, y, d: 핀크기(n, 좁음), 색: (단계표[큰단계(a, 단계)] || 단계표[0]).색, 이름: 짧은이름(p.n) })
    }
    const 작게 = 핀줄이기(ps, 지도크기[0], 지도크기[1])      // 많으면(경기 31 곳 · 폰) 다 같이 조금 작게
    const 자리 = 핀펴기(작게, 지도크기[0], 지도크기[1])
    return 작게.map((q) => ({ ...q, x: 자리[q.k][0], y: 자리[q.k][1] }))
  }, [바탕, 시도, 핀수, 틀, 지도크기, 좁음, 합, 단계, 곳표])
  const 새소식 = (합 && 합.새) || []
  const 지금새 = 새소식.length ? 새소식[돌기 % 새소식.length] : null

  const 단계바꾸기 = (s) => set단계((o) => { const n = new Set(o); if (n.has(s) && n.size > 1) n.delete(s); else n.add(s); return n })
  const 시도고르기 = (d, 어디 = '시도') => {
    set시도(d); setK(''); set열린('')
    if (d) 세기('|현황판|시도')
    if (d && 어디 === '목록') setTimeout(() => 목록.current && 목록.current.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60)
  }
  const 곳고르기 = (kk) => {
    const p = 곳표[kk]
    if (!p) return
    if (p.d !== 시도) set시도(p.d)
    setK(kk === k ? '' : kk); set열린('')
    세기('|현황판|곳')
    setTimeout(() => 목록.current && 목록.current.scrollIntoView({ block: 'start', behavior: 'smooth' }), 80)
  }
  const 내지역으로 = () => {
    if (내지역 && 내지역 !== '전국') { 세기('|현황판|내지역'); 시도고르기(내지역, '목록') }
  }
  const 내지역정하기 = (d) => { saveRegion(d); set내지역(d); 세기('|현황판|내지역'); 시도고르기(d === '전국' ? '' : d, '목록') }
  const 알리기 = (글) => { set알림(글); setTimeout(() => set알림(''), 2200) }
  const 공유 = async (r, 카드시도) => {
    세기('|현황판|공유')
    const d = 카드시도 || 시도            // 전국 큰 공사 카드는 그 공사의 시도로(받는 사람이 그 시도 목록에서 바로 봄)
    const url = `${location.origin}${주소만들기({ 시도: d, k: d ? r.k : '', 단계: [0, 1, 2], 금액: '', 찾기: '', no: r.no })}`
    const 글 = 공유글(r, 곳이름(r.k))
    try {
      if (navigator.share) { await navigator.share({ title: r.이름, text: 글, url }); return }
    } catch (e) { if (e && e.name === 'AbortError') return }
    try { await navigator.clipboard.writeText(`${글}\n${url}`); 알리기('주소를 복사했습니다 — 카톡 · 문자에 붙여 넣으세요') } catch (e) { 알리기('복사하지 못했습니다') }
  }

  const 단계수 = 합 ? 합.n : [0, 0, 0]
  const 제목곳 = k ? `${시도} ${곳이름(k)}` : 시도 || '전국'

  return (
    <div className="nm">
      <section className="mt-hero nm-hero" aria-label="공사 현황판 지도">
        <span className="mt-aur a1" /><span className="mt-aur a2" /><span className="mt-aur a3" />
        <div className="mt-hwrap nm-hwrap">
          <div className="mt-brand nm-brand">
            <small>K-건설맵 · 공사 지도</small>
            <h1>공사 현황판</h1>
            <p>지금 전국에서 나오는 공사 — 시 · 군을 누르면 목록, 공사를 누르면 요약이 나옵니다.</p>
            <div className="nm-st" role="group" aria-label="단계 고르기">
              {단계표.map((t) => (
                <button key={t.s} type="button" className={'nm-stb' + (단계.has(t.s) ? ' on' : '')} aria-pressed={단계.has(t.s)}
                  onClick={() => 단계바꾸기(t.s)} title={t.뜻} style={{ '--c': t.색 }}>
                  <i /> {t.이름} <b>{(단계수[t.s] || 0).toLocaleString('ko-KR')}</b>
                </button>
              ))}
            </div>
            {합 && <div className="nm-at">자료 {날짧게(합.at)} 기준 · 하루 여러 번 새로 고침</div>}
            {/* 지금 보는 곳 · 전국으로 · 목록으로(넓은 화면은 목록이 지도 아래라 안 보임) — 지도 위가 아니라 여기(글 칸이 지도를 가리지 않게) */}
            {시도 && (
              <div className="nm-where">
                <button type="button" className="nm-back" onClick={() => 시도고르기('')}>← 전국 지도</button>
                <b>📍 {시도}{k ? ` ${곳이름(k)}` : ''}</b>
                <button type="button" className="nm-golist" onClick={() => 목록.current && 목록.current.scrollIntoView({ block: 'start', behavior: 'smooth' })}>
                  목록 {Array.isArray(시도줄) ? `${보이는줄.length.toLocaleString('ko-KR')}건 ` : ''}↓
                </button>
              </div>
            )}
          </div>
          {지금새 && (
            <div key={돌기} className="mt-live nm-live" role="status">
              <b style={{ background: (단계표[지금새[2]] || 단계표[0]).색 }} />
              {곳이름(지금새[1]) ? `${곳이름(지금새[1])} · ` : ''}{언제(지금새[4])} {지금새[2] === 2 ? '1순위' : '새 공고'}
              <span className="mt-live-t">«{String(지금새[3] || '').slice(0, 18)}{String(지금새[3] || '').length > 18 ? '…' : ''}»</span>
            </div>
          )}
          <div className="mt-map nm-map" ref={지도칸}>
            {바탕 && (
              <svg viewBox={`${틀.x} ${틀.y} ${틀.w} ${틀.h}`} className="mt-land nm-land" role="img" aria-label={`${시도 || '전국'} 지도 — 시 · 도를 누르면 크게`}>
                {Object.entries(바탕.판).map(([d, p]) => (
                  <path key={d} d={p} className={(시도 && d !== 시도 ? 'dim' : '') + (d === 시도 ? ' on' : '')}
                    onClick={() => 시도고르기(d === 시도 ? '' : d)}><title>{d}</title></path>
                ))}
              </svg>
            )}
            {/* 전국 — 시 · 도 17 핀(이름 · 수) · 누르면 그 시 · 도로 크게 */}
            {바탕 && !시도 && 시도핀들(합, 단계).map((p) => (
              <button key={p.d} type="button" className="nm-pin nm-spin" onClick={() => 시도고르기(p.d)}
                style={{ left: 퍼((p.x - 틀.x) / 틀.w), top: 퍼((p.y - 틀.y) / 틀.h), '--d': ((p.r * 2) / 틀.w * 100).toFixed(2), '--c': (단계표[p.s] || 단계표[0]).색 }}
                aria-label={`${p.d} 공사 ${p.n.toLocaleString('ko-KR')}건 — 누르면 ${p.d} 지도`} title={`${p.d} · ${p.n.toLocaleString('ko-KR')}건`}>
                <b>{좁음 ? 수짧게(p.n) : p.n.toLocaleString('ko-KR')}</b><small>{p.d}</small>
              </button>
            ))}
            {/* 시 · 도 — 그 안 시 · 군 핀(수 · 많은 단계 색) · 누르면 그 시 · 군 목록 */}
            {시군핀.map((q) => (
              <button key={q.k} type="button" className={'nm-pin' + (q.k === k ? ' on' : '')} onClick={() => 곳고르기(q.k)}
                style={{ left: 퍼(q.x), top: 퍼(q.y), width: q.d, height: q.d, marginLeft: -q.d / 2, marginTop: -q.d / 2, '--c': q.색 }}
                aria-label={`${q.이름} 공사 ${q.n}건 보기`} title={`${q.이름} · ${q.n}건`}>
                {q.n > 999 ? '999+' : q.n}
              </button>
            ))}
            {합 === null && <div className="mt-few">자료를 받지 못했습니다 — 잠시 뒤 다시 열어 주세요</div>}
          </div>
        </div>
      </section>

      <div className="nm-bar" ref={목록}>
        <div className="nm-row">
          <label className="nm-sel">
            <span className="sr-only">시 · 도</span>
            <select value={시도} onChange={(e) => 시도고르기(e.target.value, '목록')}>
              <option value="">🇰🇷 전국</option>
              {시도목록.map((d) => <option key={d} value={d}>{d}{합 && 합.시도 && 합.시도[d] ? ` (${(합.시도[d][0] + 합.시도[d][1] + 합.시도[d][2]).toLocaleString('ko-KR')})` : ''}</option>)}
            </select>
          </label>
          {내지역 && 내지역 !== '전국'
            ? <button type="button" className={'nm-chip' + (시도 === 내지역 ? ' on' : '')} onClick={내지역으로}>📍 내 지역 {내지역}</button>
            : (
              <label className="nm-sel nm-mine">
                <span className="sr-only">내 지역 정하기</span>
                <select value="" onChange={(e) => e.target.value && 내지역정하기(e.target.value)}>
                  <option value="">📍 내 지역 정하기</option>
                  {시도목록.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
            )}
          <input className="nm-q" type="search" value={찾기} maxLength={40} placeholder="공사명 · 기관 · 업체 찾기" aria-label="공사명 · 기관 · 업체 찾기"
            onChange={(e) => set찾기(e.target.value)} onBlur={() => 찾기.trim() && 세기('|현황판|찾기')} />
        </div>
        <div className="nm-row">
          {금액칸들.map((c) => (
            <button key={c.k || 'all'} type="button" className={'nm-chip' + (금액 === c.k ? ' on' : '')} aria-pressed={금액 === c.k} onClick={() => set금액(c.k)}>{c.이름}</button>
          ))}
          {내면허.length > 0 && (
            <button type="button" className={'nm-chip' + (내면허만 ? ' on' : '')} aria-pressed={내면허만} onClick={() => set내면허만((v) => !v)}>🪪 내 면허만</button>
          )}
        </div>
      </div>

      <section className="nm-list" aria-live="polite">
        {!시도 && (
          <>
            <h2 className="nm-h">시 · 도를 고르세요 <small>지도 · 아래 이름을 누르면 그 지역 공사</small></h2>
            <div className="nm-sido">
              {시도목록.map((d) => {
                const a = (합 && 합.시도 && 합.시도[d]) || [0, 0, 0, 0]
                const n = [0, 1, 2].reduce((t, s) => t + (단계.has(s) ? a[s] : 0), 0)
                return (
                  <button key={d} type="button" onClick={() => 시도고르기(d, '목록')} className={d === 내지역 ? 'mine' : ''}>
                    <b>{d}</b><span>{n.toLocaleString('ko-KR')}건</span>
                  </button>
                )
              })}
            </div>
            <h2 className="nm-h">전국 큰 공사 <small>입찰 중 · 개찰 대기 — 금액 큰 차례</small></h2>
            {합 === undefined && <div className="muted">불러오는 중…</div>}
            {합 && 큰공사.length === 0 && <div className="muted">고른 조건에 맞는 공사가 없습니다.</div>}
            <ul className="nm-cards">{큰공사.map((r) => <카드 key={r.no} r={r} 곳이름={곳이름} 열림={열린 === r.no} 열기={() => { set열린(열린 === r.no ? '' : r.no); 세기('|현황판|카드') }} 공유={공유} 시도={r.k && 곳표[r.k] ? 곳표[r.k].d : ''} />)}</ul>
          </>
        )}
        {시도 && (
          <>
            <h2 className="nm-h">
              <span>{제목곳} 공사 <b>{Array.isArray(시도줄) ? 보이는줄.length.toLocaleString('ko-KR') : '…'}</b>건</span>
              {k && <button type="button" className="nm-x" onClick={() => setK('')}>{시도} 전체 보기</button>}
            </h2>
            {시도줄 === undefined && <div className="muted">불러오는 중…</div>}
            {시도줄 === null && <div className="muted">자료를 받지 못했습니다 — 잠시 뒤 다시 열어 주세요.</div>}
            {Array.isArray(시도줄) && 보이는줄.length === 0 && <div className="muted">고른 조건에 맞는 공사가 없습니다 — 단계 · 금액을 넓혀 보세요.</div>}
            <ul className="nm-cards">
              {보이는줄.slice(0, 300).map((r) => <카드 key={r.no} r={r} 곳이름={곳이름} 열림={열린 === r.no} 열기={() => { set열린(열린 === r.no ? '' : r.no); 세기('|현황판|카드') }} 공유={공유} 시도={시도} />)}
            </ul>
            {보이는줄.length > 300 && <div className="muted">앞 300건만 보입니다 — 시 · 군을 누르거나 찾기로 좁혀 보세요.</div>}
          </>
        )}
      </section>
      {알림 && <div className="nm-toast" role="status">{알림}</div>}
    </div>
  )
}

function 카드({ r, 곳이름, 열림, 열기, 공유, 시도 }) {
  const t = 단계표[r.s] || 단계표[0]
  const [담음, set담음] = useState(() => inBasket(r.no))
  const dd = r.s === 0 ? 디데이(r.마감) : ''
  const 곳 = 곳이름(r.k)
  return (
    <li id={'nm-' + r.no} className={'nm-card' + (열림 ? ' open' : '')} style={{ '--c': t.색 }}>
      <button type="button" className="nm-ch" onClick={열기} aria-expanded={열림}>
        <span className="nm-badge">{t.이름}{dd ? ` · ${dd}` : ''}</span>
        <strong>{r.이름}</strong>
        <span className="nm-sub">{[r.기관, [시도, 곳].filter(Boolean).join(' '), 금액글(r.금액)].filter(Boolean).join(' · ')}</span>
        {r.s === 2 && r.일등 && <span className="nm-win">🥇 {r.일등}{r.율 != null ? ` · ${r.율.toFixed(3)}%` : ''}</span>}
      </button>
      {열림 && (
        <div className="nm-body">
          <dl>
            <dt>단계</dt><dd>{t.이름} — {t.뜻}</dd>
            <dt>발주처</dt><dd>{r.기관 || '-'}</dd>
            <dt>현장</dt><dd>{r.현장 || [시도, 곳].filter(Boolean).join(' ') || '-'}</dd>
            {r.s === 2
              ? <><dt>1순위 금액</dt><dd>{r.금액 ? `${r.금액.toLocaleString('ko-KR')}원 (${금액글(r.금액)})` : '-'}</dd></>
              : <><dt>{r.기초 ? '기초금액' : '금액'}</dt><dd>{r.금액 ? `${r.금액.toLocaleString('ko-KR')}원 (${금액글(r.금액)})` : '아직 공개 전'}</dd></>}
            {r.공고일 && <><dt>공고일</dt><dd>{날짧게(r.공고일)}</dd></>}
            {r.마감 && <><dt>입찰 마감</dt><dd>{날짧게(r.마감)}{dd ? ` (${dd})` : ''}</dd></>}
            {r.개찰 && <><dt>개찰</dt><dd>{날짧게(r.개찰)}</dd></>}
            {r.s === 2 && <><dt>1순위</dt><dd>{r.일등 || '-'}{r.율 != null ? ` · 투찰률 ${r.율.toFixed(3)}%` : ''}{r.참가 ? ` · 참가 ${r.참가.toLocaleString('ko-KR')}곳` : ''}</dd></>}
            {r.면허 && <><dt>면허</dt><dd>{r.면허}</dd></>}
          </dl>
          <div className="nm-acts">
            <Link className="btn sm" to={`/notice/${encodeURIComponent(r.no)}`} onClick={() => 세기('|현황판|공고')}>📄 공고 보기</Link>
            {r.s === 0 && <Link className="btn sm" to={`/?no=${encodeURIComponent(r.no)}`} onClick={() => 세기('|현황판|바로투찰')}>💰 바로투찰</Link>}
            {r.s === 0 && (   /* 담기 = «넣을 생각인 공고»(공고 탭 ⭐ 담은 공고 · 바로투찰과 같은 바구니) — 마감 전만 */
              <button type="button" className={'btn line sm' + (담음 ? ' on' : '')} aria-pressed={담음}
                onClick={() => { toggleBasket(r.no); set담음(inBasket(r.no)); 세기('|현황판|담기') }}>{담음 ? '★ 담음' : '☆ 담기'}</button>
            )}
            <button type="button" className="btn line sm" onClick={() => 공유(r, 시도)}>🔗 공유</button>
          </div>
        </div>
      )}
    </li>
  )
}
