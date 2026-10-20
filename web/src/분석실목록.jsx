/**
 * 📊 입찰 분석실 — 왼쪽 «공고 목록» (G340 · 2026-10-20)
 *
 * ■ 칸 셋: ⚡ 내 공고(내 면허 · 지역 — 공고 탭 · 바로투찰 «오늘 넣을 것» 과 같은 값 · 같은 거르기 함수) · ⭐ 담은 공고 · ⏰ 마감 임박(전체)
 *   검색어를 치면 칸과 상관없이 공고명 · 기관 · 공고번호로 찾습니다.
 * ■ 자료는 바로투찰이 받는 공고 목록(bidindex) 그대로 — 새로 받는 것 없음(면허 칩 이름만 board/live.json 2KB)
 * ■ 누르면 onPick(공고번호) — 분석실 화면이 주소(?no=)를 바꿔 오른쪽 계산 · 가운데 분석이 그 공고로 바뀝니다.
 * ■ 숨은 누적: |분석실|칸:내 · |분석실|칸:담음 · |분석실|칸:마감 · |분석실|찾기 · |분석실|조건
 */
import { useEffect, useMemo, useState } from 'react'
import { getBoardMeta } from './lib/data.js'
import { wonShort, dateTime, dday, REGIONS, inRegion } from './lib/fmt.js'
import { canBid, nowStamp, stamp14, isReady } from './lib/bidmath.js'
import { loadLicCodes, saveLicCodes, loadLicNone, loadRegion, saveRegion, licList, licHit, licShort } from './lib/lic.js'
import { loadBasket } from './lib/basket.js'
import { load우리지역 } from './lib/공동.js'
import { 공동딱지 } from './공동칸.jsx'
import { 세기 } from './lib/받은수.jsx'

const 칸열쇠 = 'kcm_bsr_tab'
const 칸읽기 = () => { try { return localStorage.getItem(칸열쇠) || '' } catch (e) { return '' } }

function use조건() {
  const 읽기 = () => ({ lics: loadLicCodes(), none: loadLicNone(), region: loadRegion(), bag: loadBasket() })
  const [v, setV] = useState(읽기)
  useEffect(() => {
    const 다시 = () => setV(읽기())
    window.addEventListener('kcm-cond', 다시)
    window.addEventListener('storage', 다시)
    window.addEventListener('focus', 다시)
    window.addEventListener('kcm-basket', 다시)
    return () => {
      window.removeEventListener('kcm-cond', 다시); window.removeEventListener('storage', 다시)
      window.removeEventListener('focus', 다시); window.removeEventListener('kcm-basket', 다시)
    }
  }, [])
  return [v, () => setV(읽기())]
}

export default function 분석실목록({ rows, 고른번호, onPick, 다시읽기 = 0 }) {
  const [조건, 조건다시] = use조건()
  useEffect(() => { 조건다시() }, [다시읽기])   // eslint-disable-line react-hooks/exhaustive-deps
  const 설정함 = 조건.lics.length > 0 || 조건.region !== '전국'
  const [칸, set칸] = useState(() => 칸읽기() || (설정함 ? '내' : '마감'))
  const [q, setQ] = useState('')
  const [조건판, set조건판] = useState(false)
  const [meta, setMeta] = useState(null)
  const now = useMemo(() => nowStamp(), [rows])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (조건판 && !meta) getBoardMeta('live').then((m) => setMeta(m || {})).catch(() => setMeta({})) }, [조건판, meta])

  const 칸고름 = (k) => { set칸(k); try { localStorage.setItem(칸열쇠, k) } catch (e) { /* 없음 */ } 세기('|분석실|칸:' + k) }
  const 나 = { 지역: load우리지역(), 면허: 조건.lics }

  const 목록 = useMemo(() => {
    if (!rows?.length) return []
    const s = q.trim()
    const up = s.toUpperCase()
    const 열림 = rows.filter((r) => canBid(r, now) || String(r.no) === 고른번호)
    let L
    if (s.length >= 2) {
      L = rows.filter((r) => (r.name || '').includes(s) || (r.inst || '').includes(s) || String(r.no || '').toUpperCase().includes(up))
    } else if (칸 === '담음') {
      const 담 = new Set(조건.bag.map(String))
      L = rows.filter((r) => 담.has(String(r.no)))
    } else if (칸 === '내') {
      if (!설정함) return []
      L = 열림.filter((r) => inRegion(r, 조건.region) && (!조건.lics.length || licHit(r.lic, 조건.lics, 조건.none)))
    } else {
      L = 열림
    }
    return L.slice().sort((a, b) => stamp14(a.close).localeCompare(stamp14(b.close))).slice(0, 200)
  }, [rows, q, 칸, 조건, 설정함, now, 고른번호])

  const 면허칩 = useMemo(() => licList(meta?.con).slice(0, 40), [meta])
  const 면허토글 = (code) => {
    const c = String(code)
    const v = 조건.lics.includes(c) ? 조건.lics.filter((x) => x !== c) : [...조건.lics, c]
    saveLicCodes(v); 세기('|분석실|조건')
  }

  return (
    <div className="bsr-listbox">
      <div className="bsr-search">
        <span>🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="공고명 · 기관 · 공고번호"
          onBlur={() => { if (q.trim().length >= 2) 세기('|분석실|찾기') }} aria-label="공고 찾기" />
        {q && <button type="button" className="x" onClick={() => setQ('')} aria-label="지우기">×</button>}
      </div>
      {q.trim().length < 2 && (
        <div className="bsr-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={칸 === '내'} className={칸 === '내' ? 'on' : ''} onClick={() => 칸고름('내')}>⚡ 내 공고</button>
          <button type="button" role="tab" aria-selected={칸 === '담음'} className={칸 === '담음' ? 'on' : ''} onClick={() => 칸고름('담음')}>⭐ 담음 {조건.bag.length ? 조건.bag.length : ''}</button>
          <button type="button" role="tab" aria-selected={칸 === '마감'} className={칸 === '마감' ? 'on' : ''} onClick={() => 칸고름('마감')}>⏰ 마감 임박</button>
        </div>
      )}
      {q.trim().length < 2 && 칸 === '내' && (
        <div className="bsr-cond">
          {설정함
            ? <span>{조건.lics.length ? `면허 ${조건.lics.length}개` : '면허 전체'} · {조건.region}</span>
            : <span>면허 · 지역을 고르면 내 공고만 모입니다</span>}
          <button type="button" className="lnk" onClick={() => set조건판(!조건판)}>{조건판 ? '접기 ▲' : (설정함 ? '바꾸기 ▼' : '고르기 ▼')}</button>
        </div>
      )}
      {조건판 && q.trim().length < 2 && 칸 === '내' && (
        <div className="bsr-condbox">
          <label>지역
            <select value={조건.region} onChange={(e) => { saveRegion(e.target.value); 세기('|분석실|조건') }}>
              {REGIONS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <div className="chips wrap">
            {meta === null ? <span className="muted">면허 목록을 받는 중…</span> : 면허칩.map(([code, name]) => (
              <button key={code} type="button" className={'chip' + (조건.lics.includes(String(code)) ? ' on' : '')} onClick={() => 면허토글(code)}>{licShort(name)}</button>
            ))}
          </div>
          <div className="note sm">이 브라우저에만 저장됩니다 — 공고 탭 · 바로투찰 «오늘 넣을 것» 과 같은 값입니다.</div>
        </div>
      )}
      <div className="bsr-items">
        {rows === undefined || rows === null ? <div className="skel" style={{ height: 120 }} /> : null}
        {rows && !목록.length && (
          <div className="note sm">
            {q.trim().length >= 2 ? '찾는 공고가 없습니다(마감 전 공사 공고).'
              : 칸 === '담음' ? '⭐ 담은 공고가 없습니다 — 오른쪽 계산에서 «☆ 담기» 를 누르면 여기에 모입니다.'
                : 칸 === '내' && !설정함 ? '위 «고르기» 에서 면허 · 지역을 고르세요.'
                  : '마감 전 공고가 없습니다.'}
          </div>
        )}
        {목록.map((r) => {
          const d = dday(r.close)
          const on = String(r.no) === 고른번호
          return (
            <button key={r.no} type="button" className={'bsr-item' + (on ? ' on' : '') + (isReady(r) ? '' : ' dim')} onClick={() => onPick(String(r.no))}>
              <span className="t">{r.name}</span>
              <span className="d">
                {r.inst}{r.base > 0 ? <> · <b>{wonShort(r.base)}</b></> : <> · 기초 미공개</>}
                {r.enp > 0 ? <> · 예상 {r.enp}곳</> : null}
              </span>
              <span className="e">
                {d && <span className={'badge ' + d.tone}>{d.text}</span>}
                <span className="muted">{dateTime(r.close)}</span>
                <공동딱지 r={r} 나={나} />
              </span>
            </button>
          )
        })}
        {목록.length >= 200 && <div className="note sm">앞 200건만 보입니다 — 검색으로 좁혀 보세요.</div>}
      </div>
    </div>
  )
}
