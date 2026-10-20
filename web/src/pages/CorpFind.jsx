/**
 * 🏢 업체 찾기 /corp (G343 · 2026-10-20)
 *
 * 소장님 「업체 찾기도 만들자. 페이지 다 넣어서...그리고,,지금 만드는거 다 페이지 넣었지?」 「검색되게」
 *   → 고르심 «둘 다»: ① 상호로 낙찰 실적 찾기 ② 지역 · 면허로 같이 넣을 업체 찾기(공동도급 상대)
 *   · 업체 페이지(/corp/{업체})는 낙찰 3건 넘는 곳까지 구워 검색에 냅니다(prerender · sitemap).
 *
 * ■ 한 화면 둘
 *   ① 🔤 상호로 찾기 — 분석 «업체 자가진단» 의 상자 그대로(Analysis.jsx CorpTab 찾기만) · 3년치 1순위(낙찰) 기록
 *   ② 📍 지역 · 면허로 찾기 — /data/corp/find/{시도}.json (build_json.build_corp_find)
 *      «그 지역 제한 공고에 최근 1년 안에 실제로 넣어 본 업체» · 반년 안 → 낙찰 많은 → 최근 차례 · 40곳씩
 *      시 · 도 칩(처음엔 우리 회사 지역 kcm.myrgn → 고른 지역 kcm_region) · 면허 · 시 · 군 · 상호 거르기
 * ■ 정직하게
 *   · 지역 · 면허는 «넣어 본 공고» 근거 — 본점 소재지 · 등록 업종 그 자체가 아님(화면에 적음 · 키스콘 확인 길).
 *   · 🏢 법인만 사업자번호 · 대표(줄) · 전화 · 주소(«연락처 보기» 를 누를 때 그 조각만) — 소장님 고르심 «법인만 넣기» · 개인사업자는 안 실음.
 *   · 낙찰 수는 그 법인 하나의 기록(같은 이름 다른 법인 합계를 안 붙임).
 * ■ 숨은 누적 |업체찾기|지역:{시도} · |업체찾기|면허 · |업체찾기|시군 · |업체찾기|더보기 · |업체찾기|실적 · |업체찾기|공동도급 · |업체찾기|키스콘 · |업체찾기|상호고름
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getJSON } from '../lib/data.js'
import { REGIONS } from '../lib/fmt.js'
import { loadRegion } from '../lib/lic.js'
import { 세기 } from '../lib/받은수.jsx'
import { CorpTab } from './Analysis.jsx'

const 시도들 = REGIONS.filter((r) => r !== '전국')
const 한번 = 40
const 키스콘 = 'https://www.kiscon.net/'

function 처음지역() {
  try {
    const a = localStorage.getItem('kcm.myrgn') || ''
    if (시도들.includes(a)) return a
  } catch (e) { /* 사생활 창 */ }
  const b = (() => { try { return loadRegion() } catch (e) { return '' } })()
  return 시도들.includes(b) ? b : ''
}
/* 🏢 법인만 사업자번호 · 대표 · 전화 · 주소(소장님 «법인만 넣기») — 번호 꼴 123-45-67890 */
const 번호꼴 = (b) => (/^\d{10}$/.test(String(b || '')) ? `${b.slice(0, 3)}-${b.slice(3, 5)}-${b.slice(5)}` : '')
/* 📞 연락처 — 누를 때 그 업체 번호 앞 3자리 조각만 받음(💸) · corp/con/{앞3}.json = {번호: [전화, 주소]} */
function 연락처칸({ b }) {
  const [v, setV] = useState(undefined)      // undefined 안 누름 · null 받는 중 · [] 없음 · [전화, 주소]
  if (v === undefined) {
    return (
      <button type="button" className="cf-con-b" onClick={() => {
        setV(null); 세기('|업체찾기|연락처')
        getJSON(`/data/corp/con/${b.slice(0, 3)}.json`).then((m) => setV((m && m[b]) || []))
      }}>📞 연락처 보기</button>
    )
  }
  if (v === null) return <span className="cf-con muted">받는 중…</span>
  if (!v.length || (!v[0] && !v[1])) return <span className="cf-con muted">전화 · 주소 자료 없음 — 낙찰받은 법인만 있습니다(키스콘에서 확인)</span>
  return (
    <span className="cf-con">
      {v[0] && <a href={'tel:' + v[0].replace(/[^0-9]/g, '')} onClick={() => 세기('|업체찾기|전화')}>📞 {v[0]}</a>}
      {v[1] && <span className="cf-adr">📍 {v[1]}</span>}
    </span>
  )
}
const 날짧게 = (d) => (/^\d{8}$/.test(String(d || '')) ? `${d.slice(2, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : '')
const 쉼 = (n) => Number(n || 0).toLocaleString('ko-KR')

export default function CorpFind() {
  const [sp, setSp] = useSearchParams()
  const 시도 = 시도들.includes(sp.get('r') || '') ? sp.get('r') : 처음지역()
  const 면허 = sp.get('l') || ''
  const 시군 = sp.get('s') || ''
  const [q, setQ] = useState('')
  const [머리, set머리] = useState(null)        // 💸 {시도}/_top.json {at, n, ln, lc, sc, rows 앞 100} · 못 받음 = false
  const [조각, set조각] = useState(null)        // 💸 면허 l/{코드} · 시군 s/{시군} 조각 {at, n, rows} — 고를 때만 받음
  const [목록, set목록] = useState(null)        // _list.json {n: {시도: 수}}
  const [보일, set보일] = useState(한번)

  const 바꿈 = (k, v, 셀말) => {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v); else n.delete(k)
    if (k === 'r') { n.delete('l'); n.delete('s') }
    setSp(n, { replace: true })
    set보일(한번)
    if (셀말) 세기(셀말)
  }

  /* 💸 소장님 「비용 절감 … 검색 업체만 불러오게 … 비용최소로」 — 한 지역을 통째로 안 받습니다.
     처음엔 그 지역 «앞 100곳»(_top · 몇 KB)만 · 면허를 고르면 그 면허 조각만 · 시 · 군만 고르면 그 시 · 군 조각만(둘 다면 면허 조각에서 시 · 군을 거름). */
  const 길 = (뒤) => `/data/corp/find/${encodeURIComponent(시도)}/${뒤}`
  /* 공고 칸에서 «이 공고 지역 · 면허» 로 왔는데 그 지역에 그 면허로 넣어 본 업체가 없으면 조각을 안 받음(없는 파일) */
  const 면허없음 = !!(면허 && 머리 && 머리.lc && !머리.lc[면허])
  const 조각길 = !시도 || 면허없음 ? '' : 면허 ? 길(`l/${encodeURIComponent(면허)}.json`) : 시군 ? 길(`s/${encodeURIComponent(시군)}.json`) : ''
  useEffect(() => { getJSON('/data/corp/find/_list.json').then((v) => set목록(v || false)) }, [])
  useEffect(() => {
    if (!시도) { set머리(null); return }
    let 살 = true
    set머리(null)
    getJSON(길('_top.json')).then((v) => { if (살) set머리(v && Array.isArray(v.rows) ? v : false) })
    return () => { 살 = false }
  }, [시도])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!조각길) { set조각(null); return }
    let 살 = true
    set조각(null)
    getJSON(조각길).then((v) => { if (살) set조각(v && Array.isArray(v.rows) ? v : false) })
    return () => { 살 = false }
  }, [조각길])
  /* 지금 보는 줄 — 조각을 골랐으면 조각(받는 중이면 null) · 아니면 _top */
  const 자료 = !머리 ? 머리 : 조각길 ? (조각 === null ? null : 조각 === false ? false : 조각) : 머리

  const 면허들 = useMemo(() => {
    if (!머리) return []
    return Object.entries(머리.lc || {}).sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ c, n, 이름: (머리.ln || {})[c] || c }))
  }, [머리])
  const 시군들 = useMemo(() => {
    if (!머리) return []
    return Object.entries(머리.sc || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
  }, [머리])
  const 걸름 = useMemo(() => {
    if (!자료) return []
    const 말 = q.replace(/\s+/g, '').replace(/\(주\)|주식회사|㈜/g, '')
    return 자료.rows.filter((r) => (!면허 || (r[4] || []).includes(면허)) && (!시군 || r[3] === 시군)
      && (!말 || String(r[0]).replace(/\s+/g, '').includes(말)))
  }, [자료, 면허, 시군, q])
  /* 이 조각 전체 수(잘렸으면 «앞 N곳») — 면허 + 시 · 군 둘 다면 면허 조각 안에서 거른 것이라 전체 수를 모름 */
  const 전체 = 자료 && !(면허 && 시군) ? 자료.n : null
  const 잘림 = 자료 && 자료.n > 자료.rows.length

  const ln = (머리 && 머리.ln) || {}
  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        🏢 업체 찾기 <span className="count">· 상호로 낙찰 실적 · 지역 · 면허로 같이 넣을 업체</span>
      </div>

      {/* ① 상호로 */}
      <div className="cf-h">🔤 상호로 찾기 <span className="muted">· 3년치 개찰의 1순위(낙찰) 기록</span></div>
      <CorpTab 찾기만 />

      {/* ② 지역 · 면허로 */}
      <div className="cf-h" style={{ marginTop: 18 }}>📍 지역 · 면허로 찾기 <span className="muted">· 공동도급 같이 넣을 업체</span></div>
      <div className="card cf-box">
        <div className="chips wrap cf-sido" role="group" aria-label="시·도">
          {시도들.map((r) => (
            <button key={r} type="button" className={'chip' + (시도 === r ? ' on' : '')} aria-pressed={시도 === r}
              onClick={() => 바꿈('r', r, '|업체찾기|지역:' + r)}>
              {r}{목록 && 목록.n && 목록.n[r] ? <em className="cf-n">{쉼(목록.n[r])}</em> : null}
            </button>
          ))}
        </div>

        {!시도 && <div className="cf-empty">시 · 도를 고르시면 그 지역 공고에 넣어 본 업체가 나옵니다.</div>}
        {시도 && 머리 === null && <div className="cf-empty muted">불러오는 중…</div>}
        {시도 && 머리 === false && <div className="cf-empty">이 지역 자료를 아직 못 받았습니다. 잠시 뒤 다시 열어 주세요.</div>}

        {시도 && 머리 && (
          <>
            <div className="cf-filt">
              <label className="cf-sel">
                <span>면허</span>
                <select value={면허} onChange={(e) => 바꿈('l', e.target.value, '|업체찾기|면허')}>
                  <option value="">전체</option>
                  {면허들.map((x) => <option key={x.c} value={x.c}>{x.이름} ({쉼(x.n)})</option>)}
                </select>
              </label>
              {시군들.length > 0 && (
                <label className="cf-sel">
                  <span>시 · 군</span>
                  <select value={시군} onChange={(e) => 바꿈('s', e.target.value, '|업체찾기|시군')}>
                    <option value="">전체</option>
                    {시군들.map(([s, n]) => <option key={s} value={s}>{s} ({쉼(n)})</option>)}
                  </select>
                </label>
              )}
              <label className="cf-sel cf-q">
                <span>상호</span>
                <input value={q} onChange={(e) => { setQ(e.target.value); set보일(한번) }} placeholder="이 안에서 거르기" />
              </label>
            </div>
            {면허없음 && (
              <div className="cf-empty">{시도}에는 이 면허로 최근 1년 안에 넣어 본 업체가 없습니다.{' '}
                <button type="button" className="lnk" onClick={() => 바꿈('l', '')}>면허 «전체» 로 보기</button></div>
            )}
            {!면허없음 && 자료 === null && <div className="cf-empty muted">불러오는 중…</div>}
            {!면허없음 && 자료 === false && <div className="cf-empty">이 조건 자료를 아직 못 받았습니다. 잠시 뒤 다시 골라 주세요.</div>}
            {!면허없음 && 자료 && <>
            <div className="cf-sum">
              <b>{시도}{시군 ? ' ' + 시군 : ''}</b>{면허 ? ` · ${ln[면허] || 면허}` : ''} — <b>{쉼(전체 != null && !q.trim() ? 전체 : 걸름.length)}곳</b>
              <span className="muted"> · 반년 안에 넣은 업체 먼저 · 낙찰 많은 차례</span>
              {잘림 && !면허 && !시군 && <span className="cf-more-h"> · 앞 {쉼(자료.rows.length)}곳만 보입니다 — <b>면허나 시 · 군을 고르시면</b> 더 보입니다</span>}
              {잘림 && (면허 || 시군) && <span className="muted"> · 앞 {쉼(자료.rows.length)}곳</span>}
            </div>
            {걸름.length === 0 ? (
              <div className="cf-empty">이 조건에 맞는 업체가 없습니다. 면허 · 시 · 군을 «전체» 로 넓혀 보세요.</div>
            ) : (
              <ol className="cf-list">
                {걸름.slice(0, 보일).map((r, i) => (
                  <li key={r[0] + '|' + i} className="cf-row">
                    <div className="cf-top">
                      <b className="cf-nm">{r[0]}</b>
                      <span className="cf-at">{시도}{r[3] ? ' ' + r[3] : ''}</span>
                    </div>
                    {번호꼴(r[6]) && (
                      <div className="cf-id">
                        <span>{번호꼴(r[6])}</span>{r[7] && <span> · 대표 {r[7]}</span>}
                        <연락처칸 key={r[6]} b={r[6]} />
                      </div>
                    )}
                    {(r[4] || []).length > 0 && (
                      <div className="cf-lic">
                        {r[4].slice(0, 4).map((c) => <span key={c} className={'cf-chip' + (c === 면허 ? ' on' : '')}>{ln[c] || c}</span>)}
                        {r[4].length > 4 && <span className="cf-chip more">+{r[4].length - 4}</span>}
                      </div>
                    )}
                    <div className="cf-meta">
                      <span>{r[2] > 0 ? <>낙찰 <b>{쉼(r[2])}건</b></> : '낙찰 기록 없음'}</span>
                      {날짧게(r[5]) && <span className="muted"> · 최근 투찰 {날짧게(r[5])}</span>}
                      {r[1] && (
                        <Link className="cf-go" to={'/corp/' + encodeURIComponent(r[1])} onClick={() => 세기('|업체찾기|실적')}>실적 보기 →</Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {걸름.length > 보일 && (
              <button type="button" className="btn line cf-more" onClick={() => { set보일((n) => n + 한번); 세기('|업체찾기|더보기') }}>
                더 보기 ({쉼(Math.min(한번, 걸름.length - 보일))}곳 더 · 남은 {쉼(걸름.length - 보일)}곳)
              </button>
            )}
            <div className="note cf-note">
              지역 · 면허는 이 업체가 <b>실제로 넣은 공고</b>(지역 제한 · 면허 제한)로 본 것입니다 — 본점 소재지 · 등록 업종 그 자체는 아닙니다.
              공동도급 지역업체는 공고일 기준 90일 넘게 그 지역에 본점이 있어야 하니,{' '}
              <a href={키스콘} target="_blank" rel="noopener noreferrer" onClick={() => 세기('|업체찾기|키스콘')}>키스콘(건설산업지식정보시스템)</a>에서 꼭 확인하세요.
              자료 {자료.at || ''} 기준 · 최근 1년 안에 넣은 업체만.
            </div>
            </>}
          </>
        )}
      </div>

      {/* 🙅 소장님 「업체에서 연락오면 제외시키겠다는 내용 적고.. 클로드가 문장 만들어서 기재 해줘」 — 받으면 data/seed/corp_hide.json 에 적어 뺌(업체 페이지 · 업체 찾기 둘 다) */}
      <p className="cf-out">
        여기 실린 업체 정보(상호 · 지역 · 면허 · 낙찰 실적 · 법인의 사업자번호 · 대표자 · 전화 · 주소)는 조달청 나라장터가 공개한 개찰 결과 · 낙찰자 정보를 옮긴 것입니다.
        개인사업자는 대표자 · 연락처를 싣지 않습니다.
        우리 회사 정보가 실리는 것을 원하지 않으시면 <a href="/contact.html" onClick={() => 세기('|업체찾기|빼기문의')}>문의</a>나{' '}
        <Link to="/qna" onClick={() => 세기('|업체찾기|빼기맵톡')}>맵톡</Link>으로 알려 주세요. 확인한 뒤 바로 빼 드립니다.
      </p>

      <div className="card cf-jv">
        <div>🤝 <b>같이 넣을 업체를 구하시나요?</b> <span className="muted">공동도급 마당에 글을 올리면 그 지역 업체가 연락합니다.</span></div>
        <Link className="btn primary sm" to="/gongdong" onClick={() => 세기('|업체찾기|공동도급')}>공동도급 마당 →</Link>
      </div>
    </>
  )
}
