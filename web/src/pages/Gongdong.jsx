/**
 * 🤝 공동도급 마당 /gongdong (G341 · 2026-10-20)
 *
 * 소장님 「공동도급도 하나의 페이지로 만들고 싶고」 · 「연락처 넣어도 돼, 이메일도」 · 「다 만들어봐」 ·
 *        「이용자 입장에서 편하게… 간편하게.. 그러면서 다 되게」 · 「돈 벌이 될 수 있는 방향으로」 ·
 *        「그냥, 자유롭게 연결될 수 있는 장을 마련하는 걸로 해보자..우선은 아낌없이 줘 보자...나중에 나에게 이익이 되어야 하는데」
 *
 * ■ 건설맵은 «도구 + 연결» 만 — 가운데서 짝을 맺어 주지 않습니다(담합 의심 · 분쟁 책임 · 경쟁사 정보를 쥐는 자리가 되지 않게).
 * ■ 한 화면
 *   위   🏢 우리 회사(이 브라우저에만 — 글 쓸 때 채워짐) · 📖 사용법(접힘)
 *   칸   🟢 우리 지역 의무 · 🟠 공동이면 됨 · 🤝 공동 가능 · ⭐ 담음 · 🙋 구성원 글 · 🏢 업체 명부
 *   공고를 누르면 주소 ?no= — 공동 조건(공동칸.jsx 그대로) · 협정 마감 띠 · 이 공고 글(쓰기 · 연락) · 🧮 지분 짜기 · 바로투찰 · 분석실 · 나라장터
 *   PC(1000px 넘게) 목록 | 고른 공고 두 칸 · 좁으면 고르면 목록을 접고 «◀ 목록» 으로.
 * ■ 판정은 lib/공동.js(공동판정) · 셈은 lib/공동판.js · 글은 lib/공동판저장.js — 여기는 그리기만.
 * ■ 💬 글마다 답글(대화 · 공동글.jsx) · 🔔 내 글에 새 답글이 오면 왼쪽 맨 위에(이 브라우저가 본 수와 견줌 · kcm.jv.seen).
 * ■ 숨은 누적: |공동|새답글봄 · |공동|보임 · |공동|고름 · |공동|칸:{칸} · |공동|글쓰기 · |공동|명함 · |공동|목록으로 · |공동|찾기 · |공동|바로투찰 · |공동|분석실 · |공동|나라장터 · |공동|담기
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getBidIndex, indexRows, getOverview } from '../lib/data.js'
import { quickBid, P50_FALLBACK } from '../lib/bidmath.js'
import { REGIONS, won, wonShort } from '../lib/fmt.js'
import { 세기 } from '../lib/받은수.jsx'
import { loadLicCodes } from '../lib/lic.js'
import { loadBasket, toggleBasket } from '../lib/basket.js'
import { load우리지역, save우리지역, 공동재료 } from '../lib/공동.js'
import { 칸of, 협정남음, 글끝, 명부끝, 공고별수, 명함읽기, 명함쓰기, 때, 내글읽기, 본수읽기, 새답글 } from '../lib/공동판.js'
import { 글받기, 답글수 } from '../lib/공동판저장.js'
import { 공동딱지, 공동칸 } from '../공동칸.jsx'
import 공동판짜기 from '../공동판짜기.jsx'
import { 글카드, 글쓰기 } from '../공동글.jsx'
import 공동설명 from '../공동설명.jsx'
import { NaeyeokStrip } from '../components.jsx'

const 시도들 = REGIONS.filter((x) => x !== '전국')
const 칸들 = [
  { k: '의무', t: '🟢 우리 지역 의무' },
  { k: '공동이면', t: '🟠 공동이면 됨' },
  { k: '가능', t: '🤝 공동 가능' },
  { k: '담음', t: '⭐ 담음' },
  { k: '글', t: '🙋 구성원 글' },
  { k: '명부', t: '🏢 업체 명부' },
]
const 남은말 = (ms) => {
  if (ms == null) return ''
  if (ms <= 0) return '마감됨'
  const 일 = Math.floor(ms / 86400000)
  return 일 >= 1 ? `D-${일}` : `${Math.max(1, Math.round(ms / 3600000))}시간 남음`
}
/** 이 공고에 아직 협정할 수 있나 — 협정 마감(없으면 입찰 마감)이 안 지났나 */
const 열림 = (r, 지금) => { const m = 협정남음(r, 지금); return m != null ? m > 0 : 때(r.close) > 지금 }

export default function Gongdong() {
  const [sp, setSp] = useSearchParams()
  const no = (sp.get('no') || '').trim().toUpperCase()
  const [idx, setIdx] = useState(undefined)
  const [ov, setOv] = useState(null)
  const [글들, set글들] = useState(null)        // 전체(아직 안 끝난 것)
  const [글탈, set글탈] = useState(false)
  const [다시, set다시] = useState(0)
  const [칸, set칸Raw] = useState(() => { try { return sessionStorage.getItem('kcm.jv.tab') || '' } catch (e) { return '' } })
  const [찾기, set찾기] = useState('')
  const [설명, set설명] = useState(false)
  const [우리지역, set우리지역Raw] = useState(load우리지역)
  const [바구니, set바구니] = useState(loadBasket)
  const [명함, set명함] = useState(명함읽기)
  const [명함열림, set명함열림] = useState(false)
  const [쓰기, set쓰기] = useState(null)         // '구함' | '참여' | '명부' | null
  const [명부지역, set명부지역] = useState('')
  const [답수표, set답수표] = useState({})        // 💬 글 키 → 답글 수
  const [본, set본] = useState(본수읽기)          // 🔔 내 글 답글을 어디까지 봤나
  const [펼칠글, set펼칠글] = useState('')        // 🔔 에서 누른 글 — 답글을 펼쳐 둠
  const 지금 = useMemo(() => Date.now(), [다시, idx])   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { getBidIndex().then((v) => setIdx(v || null)).catch(() => setIdx(null)) }, [])
  useEffect(() => { getOverview().then(setOv).catch(() => {}) }, [])
  useEffect(() => { 세기('|공동|보임'); document.title = '공동도급 마당 — 공동도급 공고 · 구성원 구함 · 업체 명부 | K-건설맵' }, [])
  useEffect(() => { set명함(명함읽기()) }, [다시])    /* 글을 올리면 «우리 회사» 로 기억한 것이 바뀜 — 맨 위 단추 · 지분 짜기가 따라오게 */
  useEffect(() => {
    let 살아 = true
    set글탈(false)
    글받기().then((v) => { if (살아) set글들(v) }).catch(() => { if (살아) { set글들([]); set글탈(true) } })
    return () => { 살아 = false }
  }, [다시])

  /* 💬 답글 수 — 내 글 먼저 · 그다음 최근 글(모두 40개까지 · 가벼운 읽기) */
  useEffect(() => {
    if (!글들 || !글들.length) return
    const 내 = new Set(내글읽기())
    const 키들 = [...글들.filter((p) => 내.has(p.id)), ...글들.filter((p) => !내.has(p.id))].map((p) => p.id).slice(0, 40)
    let 살아 = true
    답글수(키들).then((v) => { if (살아) set답수표((o) => ({ ...o, ...v })) }).catch(() => {})
    return () => { 살아 = false }
  }, [글들])
  const 내글들 = useMemo(() => { const 내 = new Set(내글읽기()); return (글들 || []).filter((p) => 내.has(p.id)) }, [글들])
  const 새것 = useMemo(() => 새답글(내글들.map((p) => p.id), 답수표, 본), [내글들, 답수표, 본])
  const 본바뀜 = () => set본(본수읽기())
  const 나 = useMemo(() => ({ 지역: 우리지역, 면허: loadLicCodes() }), [우리지역])
  const rows = useMemo(() => (idx ? indexRows(idx) : []), [idx])
  const 공동줄 = useMemo(() => rows
    .map((r) => ({ r, k: 칸of(r, 나), m: 협정남음(r, 지금) }))
    .filter((x) => x.k && 열림(x.r, 지금))
    .sort((a, b) => (a.m ?? (때(a.r.close) - 지금)) - (b.m ?? (때(b.r.close) - 지금))), [rows, 나, 지금])
  const 셈 = useMemo(() => ({
    의무: 공동줄.filter((x) => x.k === '의무').length,
    공동이면: 공동줄.filter((x) => x.k === '공동이면').length,
    가능: 공동줄.length,
    담음: 공동줄.filter((x) => 바구니.includes(String(x.r.no))).length,
    글: (글들 || []).filter((p) => p.kind !== '명부').length,
    명부: (글들 || []).filter((p) => p.kind === '명부').length,
  }), [공동줄, 바구니, 글들])
  /* 처음 칸 — 우리 지역이 있으면 «의무»(있을 때) · 없으면 «공동 가능» */
  const 지금칸 = 칸 || (우리지역 && 셈.의무 ? '의무' : '가능')
  const 칸고름 = (k) => { set칸Raw(k); try { sessionStorage.setItem('kcm.jv.tab', k) } catch (e) { /* 없음 */ } 세기('|공동|칸:' + k) }
  const 수표 = useMemo(() => 공고별수(글들), [글들])

  const q = 찾기.trim()
  const 보일줄 = useMemo(() => {
    let L = 공동줄
    if (지금칸 === '의무') L = L.filter((x) => x.k === '의무')
    else if (지금칸 === '공동이면') L = L.filter((x) => x.k === '공동이면')
    else if (지금칸 === '담음') L = L.filter((x) => 바구니.includes(String(x.r.no)))
    if (q) L = L.filter((x) => `${x.r.name} ${x.r.inst} ${x.r.no}`.includes(q))
    return L.slice(0, 200)
  }, [공동줄, 지금칸, 바구니, q])
  const 글보일 = useMemo(() => {
    let L = (글들 || []).filter((p) => (지금칸 === '명부' ? p.kind === '명부' : p.kind !== '명부'))
    if (지금칸 === '명부' && 명부지역) L = L.filter((p) => p.rgn === 명부지역)
    if (q) L = L.filter((p) => `${p.co} ${p.lic || ''} ${p.want || ''} ${p.name || ''} ${p.body || ''}`.includes(q))
    return L
  }, [글들, 지금칸, 명부지역, q])

  const 고른 = useMemo(() => (no ? rows.find((r) => String(r.no).toUpperCase() === no) || null : null), [rows, no])
  const 고르기 = (n) => {
    if (!n) return
    setSp({ no: String(n) }); set쓰기(null); 세기('|공동|고름')
    try { if (window.innerWidth < 1000) window.scrollTo(0, 0) } catch (e) { /* 없음 */ }
  }
  const 목록으로 = () => { setSp({}); set쓰기(null); 세기('|공동|목록으로'); try { window.scrollTo(0, 0) } catch (e) { /* 없음 */ } }
  const set우리지역 = (v) => { set우리지역Raw(v); save우리지역(v) }

  return (
    <div className={'gd-room' + (no ? ' picked' : '')}>
      <div className="gd-top">
        <div className="bsr-title">
          <h1>🤝 공동도급 마당</h1>
          <span className="muted">공동도급 되는 공고 · 구성원 구함 · 업체 명부 — 업체끼리 바로 연락합니다</span>
        </div>
        <div className="bsr-tools">
          {no && <button type="button" className="bsr-back" onClick={목록으로}>◀ 목록</button>}
          {/* 🔎 G343 업체 찾기 — 소장님 「연결이 되어야 하잖아.. 이용자가 편하게」 · 우리 회사 지역을 골라 둔 채 */}
          <Link className="bsr-tool" to={'/corp' + (명함.rgn ? '?r=' + encodeURIComponent(명함.rgn) : '')} onClick={() => 세기('|업체찾기|마당에서')}>🔎 업체 찾기</Link>
          <button type="button" className={'bsr-tool' + (명함열림 ? ' on' : '')} onClick={() => set명함열림(!명함열림)}>🏢 우리 회사{명함.co ? ` · ${명함.co}` : ''}</button>
          <button type="button" className={'bsr-tool' + (설명 ? ' on' : '')} aria-expanded={설명}
            onClick={() => { if (!설명) 세기('|공동|설명열기'); set설명(!설명) }}>📖 사용법</button>
        </div>
        {설명 && <공동설명 닫기={() => set설명(false)} />}
        {명함열림 && <명함칸 명함={명함} 우리지역={우리지역}
          저장={(v) => { 명함쓰기(v); set명함(v); if (v.rgn) set우리지역(v.rgn); set명함열림(false); 세기('|공동|명함') }} 닫기={() => set명함열림(false)} />}
      </div>

      <aside className="gd-left" aria-label="공동도급 공고 · 글">
        {새것.length > 0 && (
          <div className="gd-bell" role="status">
            <b>🔔 내 글에 새 답글 {새것.reduce((n, x) => n + x.새, 0)}개</b>
            {새것.map(({ 키, 새 }) => {
              const p = 내글들.find((x) => x.id === 키)
              if (!p) return null
              return (
                <button key={키} type="button" className="gd-bell1" onClick={() => {
                  set펼칠글(키); 세기('|공동|새답글봄')
                  if (p.no) 고르기(p.no); else 칸고름('명부')
                }}>{p.name || '🏢 업체 명부'} — 새 답글 {새} ›</button>
              )
            })}
          </div>
        )}
        <div className="gd-tabs" role="tablist">
          {칸들.map((x) => (
            <button key={x.k} type="button" role="tab" aria-selected={지금칸 === x.k} className={지금칸 === x.k ? 'on' : ''} onClick={() => 칸고름(x.k)}>
              {x.t}<em>{(x.k === '글' || x.k === '명부') && 글들 === null ? '' : 셈[x.k] || 0}</em>
            </button>
          ))}
        </div>
        <input className="inp gd-q" value={찾기} placeholder={지금칸 === '글' || 지금칸 === '명부' ? '회사 · 면허 · 공고명' : '공고명 · 기관 · 공고번호'}
          onChange={(e) => set찾기(e.target.value)} onBlur={() => { if (q) 세기('|공동|찾기') }} />

        {(지금칸 === '의무' || 지금칸 === '공동이면') && !우리지역 && (
          <div className="gd-need">🏢 우리 회사 지역을 고르면 {지금칸 === '의무' ? '우리 지역이 의무 지역인 공고' : '우리가 공동으로만 넣을 수 있는 공고'}를 가려 드립니다.
            <div className="chips wrap">{시도들.map((x) => <button key={x} type="button" className="chip" onClick={() => set우리지역(x)}>{x}</button>)}</div>
          </div>
        )}

        {(지금칸 === '글' || 지금칸 === '명부') ? (
          <div className="gd-posts">
            {지금칸 === '명부' && (
              <div className="gd-row">
                <select className="inp" value={명부지역} onChange={(e) => set명부지역(e.target.value)} aria-label="명부 지역">
                  <option value="">모든 지역</option>{시도들.map((x) => <option key={x}>{x}</option>)}
                </select>
                <button type="button" className="btn sm" onClick={() => { set쓰기('명부'); 세기('|공동|글쓰기') }}>＋ 우리 회사 명부에 올리기</button>
              </div>
            )}
            {쓰기 === '명부' && <글쓰기 처음종류="명부" 끝={명부끝()} 닫기={() => set쓰기(null)} 다됨={() => { set쓰기(null); set다시((n) => n + 1) }} />}
            {글들 === null && <div className="muted sm">글을 받는 중…</div>}
            {글탈 && <div className="gd-need">글을 받지 못했습니다. <button type="button" className="lnk" onClick={() => set다시((n) => n + 1)}>다시 받기</button></div>}
            {글들 !== null && !글탈 && 글보일.length === 0 && (
              <div className="gd-empty">{지금칸 === '명부'
                ? '아직 명부에 올린 업체가 없습니다 — 처음 올리시면 공동도급을 찾는 업체가 바로 연락할 수 있습니다.'
                : '아직 올라온 구성원 글이 없습니다 — 공고를 고르고 «🙋 구성원 구함» 글을 올려 보세요.'}</div>
            )}
            {글보일.map((p) => <글카드 key={p.id} p={p} 공고보기={p.no ? 고르기 : null} 바뀜={() => set다시((n) => n + 1)} 답수={답수표[p.id]} 펼침={펼칠글 === p.id} 본바뀜={본바뀜} />)}
          </div>
        ) : (
          <div className="gd-items">
            {idx === undefined && <div className="muted sm">공고를 받는 중…</div>}
            {idx === null && <div className="gd-need">공고 목록을 받지 못했습니다. 잠시 뒤 다시 열어 주세요.</div>}
            {idx && 보일줄.length === 0 && (
              <div className="gd-empty">{지금칸 === '담음' ? '⭐ 담은 공고 중 공동도급이 되는 것이 없습니다 — 공고를 고르고 «☆ 담기» 를 누르세요.'
                : (지금칸 === '의무' || 지금칸 === '공동이면') && !우리지역 ? '' : '지금 이 칸에 맞는 공고가 없습니다.'}</div>
            )}
            {보일줄.map(({ r, m }) => {
              const 수 = 수표[r.no]
              return (
                <button key={r.no} type="button" className={'gd-item' + (String(r.no).toUpperCase() === no ? ' on' : '')} onClick={() => 고르기(r.no)}>
                  <span className="t">{r.name}</span>
                  <span className="d">{r.inst} · <b>{wonShort(r.base || r.budget || 0)}</b>{r.sido ? ` · ${r.sido}` : ''}</span>
                  <span className="e">
                    <공동딱지 r={r} 나={나} />
                    {m != null && <span className={'badge ' + (m < 86400000 ? 'r' : 'n')}>협정 {남은말(m)}</span>}
                    {수 && (수.구함 + 수.참여) > 0 && <span className="badge g">🙋 {수.구함} · 🤝 {수.참여}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </aside>

      <section className="gd-main" aria-label="고른 공고">
        {no && 고른 ? (
          <공고칸 r={고른} 나={나} p50={ov?.sjq?.p50 ?? P50_FALLBACK} 명함={명함} 바구니={바구니}
            담기={() => { set바구니(toggleBasket(고른.no)); 세기('|공동|담기') }} 쓰기={쓰기} set쓰기={set쓰기} 글바뀜={() => set다시((n) => n + 1)} 다시={다시}
            답수표={답수표} set답수표={set답수표} 펼칠글={펼칠글} 본바뀜={본바뀜} />
        ) : no && idx ? (
          <div className="gd-empty">이 공고({no})는 지금 목록에 없습니다 — 마감됐거나 번호가 다릅니다. <button type="button" className="lnk" onClick={목록으로}>목록으로</button></div>
        ) : (
          <div className="bsr-box bsr-empty gd-intro">
            <div className="bsr-h">🤝 공고를 고르면 여기에 나옵니다</div>
            <ul>
              <li><b>공동 조건</b> — 방식(공동이행 · 분담이행) · 지역의무 지역 · 지분 · 협정서 마감</li>
              <li><b>이 공고 글</b> — 🙋 구성원 구함 · 🤝 같이 하고 싶음 · 📞 바로 연락</li>
              <li><b>🧮 지분 짜기</b> — 구성원 수 · 최소 지분 · 지역의무 지분 · 각자 몫 · 시평액 합산</li>
              <li><b>같이 넣을 수 있는 회사</b> — 이 공고 면허로 실제 투찰한 회사</li>
            </ul>
            <p className="muted">글은 회원가입 없이 올립니다. 전화 · 이메일은 공개되고, 협정 마감이 지나면 내려갑니다.</p>
          </div>
        )}
      </section>
    </div>
  )
}

/* ── 🏢 우리 회사(명함) — 이 브라우저에만 ── */
function 명함칸({ 명함, 우리지역, 저장, 닫기 }) {
  const [f, setF] = useState(() => ({ co: 명함.co || '', rgn: 명함.rgn || 우리지역 || '', lic: 명함.lic || '', who: 명함.who || '', sipy: 명함.sipy || '', tel: 명함.tel || '', email: 명함.email || '' }))
  const 칸 = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))
  return (
    <div className="gd-me card">
      <div className="gd-h">🏢 우리 회사 <span className="muted sm">— 이 브라우저에만 저장 · 글 쓸 때 저절로 채워짐 · 서버로 가지 않음</span>
        <button type="button" className="lnk" onClick={닫기}>닫기 ✕</button></div>
      <div className="gd-form">
        <label>회사 이름<input className="inp" value={f.co} maxLength={40} onChange={칸('co')} placeholder="예: ○○건설(주)" /></label>
        <label>지역(본점)<select className="inp" value={f.rgn} onChange={칸('rgn')}><option value="">고르기</option>{시도들.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>면허(업종)<input className="inp" value={f.lic} maxLength={80} onChange={칸('lic')} placeholder="예: 토목공사업" /></label>
        <label>담당자<input className="inp" value={f.who} maxLength={20} onChange={칸('who')} placeholder="예: 공무과장 (선택)" /></label>
        <label>시평액(억)<input className="inp" inputMode="decimal" value={f.sipy} onChange={(e) => setF((v) => ({ ...v, sipy: e.target.value.replace(/[^0-9.]/g, '').slice(0, 8) }))} placeholder="예: 85" /></label>
        <label>전화<input className="inp" inputMode="tel" value={f.tel} maxLength={20} onChange={칸('tel')} placeholder="010-0000-0000" /></label>
        <label>이메일<input className="inp" inputMode="email" value={f.email} maxLength={60} onChange={칸('email')} placeholder="name@company.co.kr" /></label>
      </div>
      <div className="gd-row"><button type="button" className="btn sm" onClick={() => 저장({ ...f, co: f.co.trim(), lic: f.lic.trim(), who: f.who.trim(), tel: f.tel.trim(), email: f.email.trim() })}>저장</button>
        <span className="muted sm">지역을 고르면 «우리 지역 의무 · 공동이면 됨» 칸이 그 지역으로 가려집니다(공고 탭과 같은 값).</span></div>
    </div>
  )
}

/* ── 고른 공고 ── */
function 공고칸({ r, 나, p50, 명함, 바구니, 담기, 쓰기, set쓰기, 글바뀜, 다시, 답수표 = {}, set답수표 = () => {}, 펼칠글 = '', 본바뀜 = () => {} }) {
  const [이글, set이글] = useState(null)
  const [탈, set탈] = useState(false)
  const [짜기, set짜기] = useState(false)
  const 지금 = Date.now()
  const 재 = 공동재료(r) || {}
  const 남 = 협정남음(r, 지금)
  const 끝 = 글끝(r, 지금)
  const 열린 = 열림(r, 지금)
  const qb = quickBid(r, p50)
  const 담김 = 바구니.includes(String(r.no))
  useEffect(() => {
    let 살아 = true
    set이글(null); set탈(false)
    글받기({ no: r.no }).then((v) => {
      if (!살아) return
      set이글(v)
      답글수(v.map((p) => p.id)).then((n) => { if (살아) set답수표((o) => ({ ...o, ...n })) }).catch(() => {})
    }).catch(() => { if (살아) { set이글([]); set탈(true) } })
    return () => { 살아 = false }
  }, [r.no, 다시])
  return (
    <div className="gd-detail">
      <div className="gd-dh">
        <h2>{r.name}</h2>
        <div className="muted">{r.inst} · 기초 {won(r.base || 0)}{r.close ? ` · 입찰 마감 ${String(r.close).slice(0, 16)}` : ''}</div>
      </div>
      {재.협정마감 && (
        <div className={'gd-agr' + (남 != null && 남 < 86400000 ? ' hot' : '') + (남 != null && 남 <= 0 ? ' past' : '')}>
          ⏰ 공동수급 협정서 마감 <b>{String(재.협정마감).slice(0, 16)}</b> {남 != null ? `(${남은말(남)})` : ''}
          <span className="muted sm"> — 입찰참가 신청 때 협정서를 함께 냅니다</span>
        </div>
      )}
      <div className="gd-row gd-acts">
        <button type="button" className={'btn ghost sm' + (담김 ? ' on' : '')} onClick={담기}>{담김 ? '★ 담음' : '☆ 담기'}</button>
        <Link className="btn ghost sm" to={`/?no=${encodeURIComponent(r.no)}`} onClick={() => 세기('|공동|바로투찰')}>💰 바로투찰 금액</Link>
        <Link className="btn ghost sm" to={`/bunseok?no=${encodeURIComponent(r.no)}`} onClick={() => 세기('|공동|분석실')}>📊 분석실</Link>
        {r.url && <a className="btn ghost sm" href={r.url} target="_blank" rel="noreferrer" onClick={() => 세기('|공동|나라장터')}>나라장터 공고 ↗</a>}
      </div>

      <div className="gd-sec">
        <div className="gd-h">🙋 이 공고 글 {이글 ? <em>{이글.length}</em> : null}
          {열린 && !쓰기 && (
            <span className="gd-sp">
              <button type="button" className="btn sm" onClick={() => { set쓰기('구함'); 세기('|공동|글쓰기') }}>✏️ 이 공고에 글 쓰기 — 구성원 구함 · 참여</button>
            </span>
          )}
        </div>
        {!열린 && <div className="gd-need">협정 마감이 지나 이 공고에는 글을 쓸 수 없습니다.</div>}
        {쓰기 && 쓰기 !== '명부' && 열린 && <글쓰기 처음종류={쓰기} r={r} 끝={끝} 닫기={() => set쓰기(null)} 다됨={() => { set쓰기(null); 글바뀜() }} />}
        {이글 === null && <div className="muted sm">글을 받는 중…</div>}
        {탈 && <div className="gd-need">글을 받지 못했습니다. 잠시 뒤 다시 열어 주세요.</div>}
        {이글 && !탈 && 이글.length === 0 && !쓰기 && 열린 && <div className="gd-empty">아직 이 공고 글이 없습니다 — 처음 올리시면 이 공고를 보는 업체가 바로 연락할 수 있습니다.</div>}
        {(이글 || []).map((p) => <글카드 key={p.id} p={p} 바뀜={글바뀜} 답수={답수표[p.id]} 펼침={펼칠글 === p.id} 본바뀜={본바뀜} />)}
      </div>

      <공동칸 r={r} 나={나} 맵톡={false} />

      <div className="gd-sec">
        {!짜기 ? (
          <button type="button" className="btn ghost gd-open" onClick={() => set짜기(true)}>🧮 지분 짜기 열기 — 구성원 · 지분 · 각자 몫 · 시평액 합산</button>
        ) : (
          <>
            <공동판짜기 r={r} 권장금액={qb ? qb.amt : 0} 명함={명함} />
            <button type="button" className="lnk sm" onClick={() => set짜기(false)}>지분 짜기 접기 ▲</button>
          </>
        )}
      </div>
      <NaeyeokStrip tone="bid" />
    </div>
  )
}
