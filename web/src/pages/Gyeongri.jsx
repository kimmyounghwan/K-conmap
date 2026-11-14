import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as 경 from '../lib/경리컨맵.js'
import * as 손 from '../lib/sonik.js'
import { 기기열쇠, 잠그기, 풀기 } from '../lib/기기잠금.js'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import 잠금문의 from '../잠금문의.jsx'
import { isOpen, tryOpen } from '../lib/gate.js'
import { use보기만 } from '../lib/보기만.js'
import { 나운영자 } from '../lib/운영자.js'
import { use잠깐말 } from '../lib/잠깐말.js'

/**
 * 🗃 /tools/gyeongri — 경리컨맵 1단계: 회사 전체 한눈에 · 거래처 원장 (2026-11-14)
 *   소장님 「만들고 막아놔, 예시만 보게 해줘」 · 「손익 장부 자료로 (추천)」 — 적기는 현장 손익 장부(/tools/sonik)에서 · 여기는 그 자료를 읽어 보임(두 번 안 적음)
 *   ■ 🔒 씀 = 소장님 브라우저(lib/운영자.js) · 열쇠말(lib/gate.js) — 그 밖의 분은 🧪 예시(손익 장부 예시 — 지어낸 회사 · 현장 · 거래처)를 «보기만»(G679 꼴)
 *   ■ 📊 한눈에: 결제일 기준 그 달 들어온 · 나간 돈 · 아직 받을 돈 · 줄 돈 · 현장마다 기성률 · 손익 · 거래처 남은 돈
 *     🤝 거래처 원장: 날짜 차례 · 청구 · 매입과 결제를 따로 한 줄씩 · 줄마다 남은 돈(끝 = 손익 장부 거래처별) · 거래처 정보(🔐 사업자번호 · 계좌 — 이 기기 열쇠로 잠금)
 *   ■ 셈: lib/경리컨맵.js(시험 tools/시험_경리컨맵.mjs) · 손익 장부 자료(kcm_sonik1)는 읽기만 · 거래처 정보만 'kcm_gyeongri1'
 *   ■ 숨은 셈: |경리|예시 · 잠금 · 열쇠 · |잠금문의|경리(거래처 정보는 소장님만 고치므로 안 셈)
 */

const 두자 = (n) => String(n).padStart(2, '0')
const 오늘달 = () => { const t = new Date(); return `${t.getFullYear()}-${두자(t.getMonth() + 1)}` }
const 달옮기기 = (ym, k) => { const t = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + k, 1); return `${t.getFullYear()}-${두자(t.getMonth() + 1)}` }
const 달글 = (ym) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`
const 날글 = (d) => (d ? `${d.slice(2, 4)}.${d.slice(5, 7)}.${d.slice(8, 10)}` : '')
const 갈래색 = { 청구: 'gr-청', 수금: 'gr-수', 매입: 'gr-매', 지급: 'gr-지' }

export default function Gyeongri() {
  const [씀, set씀] = useState(() => isOpen())
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  const [보기, set보기] = useState(() => (isOpen() ? '내것' : ''))
  const [장부, set장부] = useState(() => 손.읽기())
  const [정보, set정보] = useState(() => 경.정보읽기())
  const 예시장부 = useMemo(() => 경.예시(), [])
  const [비밀, set비밀] = useState(() => new Map())
  const [잃음, set잃음] = useState(0)
  const [탭, set탭] = useState('한눈에')
  const [달, set달] = useState('')
  const [고른, set고른] = useState('')
  const [말, set말] = use잠깐말(4500)
  const [잠금말, set잠금말] = useState('')
  const 손댐 = useRef(false)
  const 열쇠 = useRef(null)
  const 차례들 = useRef(new Map())

  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (살 && v) { set씀(true); set보기((b) => b || '내것') } }).catch(() => {})
    /* 손익 장부를 다른 탭 · 창에서 고치면 여기도 바로(같은 기기 저장) */
    const 다시 = () => set장부(손.읽기())
    const 볼때 = () => { if (document.visibilityState === 'visible') 다시() }
    const 저장 = (e) => { if (!e.key || e.key === 손.열쇠) 다시() }
    window.addEventListener('storage', 저장); document.addEventListener('visibilitychange', 볼때); window.addEventListener('focus', 다시)
    return () => { 살 = false; window.removeEventListener('storage', 저장); document.removeEventListener('visibilitychange', 볼때); window.removeEventListener('focus', 다시) }
  }, [])
  /* 씀이면 잠근 칸(사업자번호 · 계좌)을 이 기기 열쇠로 풂 — 못 풀면(사이트 데이터를 지움 · 다른 기기) 그 칸만 다시 적음 */
  useEffect(() => {
    if (!씀) return undefined
    let 살 = true
    ;(async () => {
      const k = await 기기열쇠(경.디비)
      열쇠.current = k
      const m = new Map(); let 못 = 0
      for (const [이름, g] of Object.entries(정보.곳 || {})) { if (!g || !g.x) continue; const v = k ? await 풀기(k, g.x) : null; if (v) m.set(이름, v); else 못++ }
      if (살) { set비밀(m); set잃음(못) }
    })()
    return () => { 살 = false }
  }, [씀])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (손댐.current && 씀 && !경.정보쓰기(정보)) set말('⚠️ 이 브라우저에 저장이 막혀 있습니다(사생활 보호 창 · 저장 공간)') }, [정보, 씀])   // eslint-disable-line react-hooks/exhaustive-deps

  const 예시 = 보기 === '예시'
  use보기만(예시, '경리')   // 🧪 G679 예시는 보기만(Ctrl+P 안내 한 줄 · 예시 판 복사 막음)
  const 읽기만 = !(씀 && 보기 === '내것')
  const 지금 = 예시 ? 예시장부 : 장부
  const 보는달 = 달 || 경.처음달(지금, 오늘달())
  const H = useMemo(() => 경.한눈에(지금, 보는달), [지금, 보는달])
  const 곳들 = useMemo(() => 경.거래처들(지금.R), [지금])
  const 현장이름 = useMemo(() => new Map((지금.현장 || []).map((h) => [h.id, h.n])), [지금])
  const 잠김 = () => { set잠금말('🔒 경리 장부는 K-건설맵에 문의해 주세요(위 «📄 작성대행 · 견적 문의») — 🧪 예시 장부로 어떤 장부인지 보실 수 있습니다(보기만).'); 세기('|경리|잠금') }
  const 예시보기 = () => { set보기('예시'); set탭('한눈에'); set달(''); set고른(''); set잠금말(''); 세기('|경리|예시') }
  const 내것보기 = () => { set보기('내것'); set달(''); set고른(''); set장부(손.읽기()) }

  /* ── 거래처 정보 고치기(씀 · 내 장부만) ── */
  const 정보고침 = (이름, 고칠) => { if (읽기만) return 잠김(); 손댐.current = true; set정보((S0) => ({ ...S0, 곳: { ...(S0.곳 || {}), [이름]: { ...((S0.곳 || {})[이름] || {}), ...고칠 } } })) }
  const 비밀고침 = async (이름, 칸, v) => {
    if (읽기만) return 잠김()
    const 새 = { ...(비밀.get(이름) || {}), [칸]: v }
    set비밀((M) => new Map(M).set(이름, 새))
    const 차례 = (차례들.current.get(이름) || 0) + 1
    차례들.current.set(이름, 차례)
    const k = 열쇠.current || (열쇠.current = await 기기열쇠(경.디비))
    const 빈 = !String(새.사업자 || '').trim() && !String(새.계좌 || '').trim()
    const x = 빈 ? '' : k ? await 잠그기(k, 새) : null
    if (차례들.current.get(이름) !== 차례) return            // 뒤에 친 글이 넣음
    if (x === null) { set말('⚠️ 이 브라우저는 잠가 저장할 수 없어 사업자번호 · 계좌는 화면에만 둡니다(저장 안 함)'); return }
    정보고침(이름, { x })
  }

  /* 돈 칸 — l = 폰에서 칸 앞에 붙는 이름(표 머리 대신 · styles.css «경리컨맵» 폰 줄) · 폰숨 = 값이 없으면(–) 폰에서 그 칸을 안 보임 */
  const 원칸 = (v, l, 폰숨) => <td className={'n' + (v < 0 ? ' gr-neg' : '') + (폰숨 && !v ? ' gr-폰숨' : '')} data-l={l}>{v ? 경.원(v) : '–'}</td>
  const 남은글 = (v) => (v < 0 ? <>{경.원(v)} <small className="gr-앞">미리 받음</small></> : 경.원(v))
  const 비었음 = !예시 && !(장부.R || []).length

  return (
    <div className="wrap gr">
      <h1>🗃 경리컨맵 — 한눈에 · 거래처 원장</h1>
      <p className="muted gr-p">현장 손익 장부에 적은 돈으로 회사 전체를 한눈에 — 그 달 <b>들어온 돈 · 나간 돈</b>, 아직 <b>받을 돈 · 줄 돈</b>, 현장마다 <b>기성률 · 손익</b>, 거래처마다 <b>원장(날짜 차례 · 남은 돈)</b>. 같은 돈을 두 번 적지 않습니다 — 적기는 <Link to="/tools/sonik">현장 손익 장부</Link>에서.</p>

      {!씀 && (
        <div className="sg-lock">
          <b>🔒 문의해 주세요</b> — 경리 장부는 K-건설맵이 직접 작성해 드립니다(견본 먼저 · 최저가). <잠금문의 도구="경리컨맵" 셈="경리" />
          {' '}<button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={예시보기}>🧪 예시 장부 보기</button>로 어떤 장부인지 보실 수 있습니다(보기만).
          {' '}<예시본수 열쇠="|경리|예시" />
          <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
            <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
            <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
              e.preventDefault()
              const ok = await tryOpen(열쇠말)
              set열쇠틀림(!ok)
              if (ok) { set씀(true); 내것보기(); set잠금말(''); 세기('|경리|열쇠') }
            }}>
              <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
              <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
            </form>
            {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
          </details>
        </div>
      )}
      {잠금말 && <div className="cwarn gr-note" role="status">{잠금말}</div>}

      {!씀 && !예시 && (
        <div className="card gr-start">
          <b>이런 장부입니다</b>
          <ul className="muted">
            <li>📊 <b>한눈에</b> — 그 달 들어온 돈 · 나간 돈(결제일 기준) · 아직 받을 돈 · 줄 돈 · 현장마다 기성률 · 손익</li>
            <li>🤝 <b>거래처 원장</b> — 발주처 · 자재 · 장비 · 외주마다 날짜 차례로 청구 · 결제와 줄마다 남은 돈</li>
            <li>✏️ 적기는 <b>현장 손익 장부</b> 하나로 — 같은 돈을 두 번 적지 않음 · 🔐 사업자번호 · 계좌는 이 기기 열쇠로 잠가 둠</li>
          </ul>
        </div>
      )}

      {(씀 || 예시) && (
        <>
          {씀 && 예시 && <div className="note gr-note">🧪 예시 장부를 보는 중(보기만) — <button type="button" className="btn line sm gr-inline" onClick={내것보기}>내 장부로 돌아가기</button></div>}
          {비었음 && <div className="note gr-note">현장 손익 장부에 적은 돈이 없습니다 — <Link to="/tools/sonik">✏️ 현장 손익 장부</Link>에 적으면 여기 저절로 나옵니다. <button type="button" className="btn line sm gr-inline" onClick={예시보기}>🧪 예시 장부 보기</button></div>}
          {잃음 > 0 && !예시 && <div className="cwarn gr-note">🔑 이 기기 열쇠가 바뀌어 거래처 {잃음}곳의 사업자번호 · 계좌를 열 수 없습니다 — 그 두 칸만 다시 적어 주세요(장부 · 금액은 그대로).</div>}
          <div className="gr-row gr-top">
            <div className="tp-tabs gr-tabs" role="tablist">
              {[['한눈에', '📊 한눈에'], ['원장', '🤝 거래처 원장']].map(([k, t]) => (
                <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'tp-tab' + (탭 === k ? ' on' : '')} onClick={() => set탭(k)}>{t}</button>
              ))}
            </div>
            {!예시 && <Link className="btn line sm gr-write" to="/tools/sonik">✏️ 손익 장부에서 적기 ▸</Link>}
          </div>
          {말 && <div className="note gr-note" role="status">{말}</div>}

          <div className={예시 ? 'kcm-예시판 gr-판' : 'gr-판'}>
            {탭 === '한눈에' && (
              <div className="card">
                <div className="gr-row">
                  <b className="gr-co">{지금.co || ''}</b>
                  <span className="gr-달">
                    <button type="button" className="btn line sm" onClick={() => set달(달옮기기(보는달, -1))} aria-label="지난달">‹</button>
                    <b>{달글(보는달)}</b>
                    <button type="button" className="btn line sm" onClick={() => set달(달옮기기(보는달, 1))} aria-label="다음 달">›</button>
                  </span>
                </div>
                <div className="gg-tiles gr-tiles">
                  <div><span>{Number(보는달.slice(5, 7))}월 들어온 돈</span><b>{경.원(H.들어옴)}</b>원</div>
                  <div><span>{Number(보는달.slice(5, 7))}월 나간 돈</span><b>{경.원(H.나감)}</b>원</div>
                  <div className={H.받을 > 0 ? 'mid' : ''}><span>아직 받을 돈</span><b>{경.원(H.받을)}</b>원</div>
                  <div className={H.줄돈 > 0 ? 'bad' : ''}><span>아직 줄 돈</span><b>{경.원(H.줄돈)}</b>원</div>
                </div>
                <p className="muted gr-small">들어온 · 나간 돈 = 그 달 결제일(손익 장부 «결제일 · 결제액») · 받을 · 줄 돈 = 모든 현장 지금까지 · {Number(보는달.slice(5, 7))}월 청구 {경.원(H.청구)}원 · 매입 {경.원(H.매입)}원(공급가)</p>
                <div className="detail-h">현장마다</div>
                <div className="gr-wrap">
                  <table className="gr-t gr-현장">
                    <thead><tr><th>현장</th><th className="n">도급(공급가)</th><th className="n">기성</th><th className="n">기성률</th><th className="n">받을 돈</th><th className="n">줄 돈</th><th className="n">손익(공급가)</th></tr></thead>
                    <tbody>
                      {H.현장들.length === 0 && <tr><td colSpan={7} className="muted">현장이 없습니다</td></tr>}
                      {H.현장들.map(({ h, S }) => { const 률 = 경.기성률(S); return (
                        <tr key={h.id}>
                          <td><b>{h.n || '(이름 없음)'}</b>{h.o ? <span className="muted"> · {h.o}</span> : null}</td>
                          {원칸(S.도급, '도급(공급가)')}{원칸(S.매출.공급, '기성')}<td className="n" data-l="기성률">{률 === null ? '–' : 률 + '%'}</td>
                          {원칸(S.매출.미, '받을 돈')}{원칸(S.매입.미, '줄 돈')}<td className={'n' + (S.손익 < 0 ? ' gr-neg' : '')} data-l="손익(공급가)">{경.원(S.손익)}</td>
                        </tr>) })}
                      {H.밖 && <tr><td className="muted">현장 없는 줄 {H.밖수}개</td><td /><td /><td />{원칸(H.밖.매출.미, '받을 돈')}{원칸(H.밖.매입.미, '줄 돈')}<td className="n" data-l="손익(공급가)">{경.원(H.밖.손익)}</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="detail-h">거래처 남은 돈 — 누르면 원장</div>
                <div className="gr-wrap">
                  <table className="gr-t gr-곳">
                    <thead><tr><th>거래처</th><th>구분</th><th className="n">받을 돈</th><th className="n">줄 돈</th><th>마지막 거래</th></tr></thead>
                    <tbody>
                      {(() => { const 줄 = 곳들.filter((x) => x.받을 || x.줄돈)
                        if (!줄.length) return <tr><td colSpan={5} className="muted">남은 돈이 없습니다</td></tr>
                        return 줄.map((x) => (
                          <tr key={x.이름} className="gr-go" onClick={() => { set고른(x.이름); set탭('원장') }}>
                            <td className="gr-이름"><b>{x.이름}</b></td><td className="muted gr-폰숨">{[x.매출 && '매출처', x.매입 && '매입처'].filter(Boolean).join(' · ')}</td>
                            {원칸(x.받을, '받을 돈', true)}{원칸(x.줄돈, '줄 돈', true)}<td className="muted gr-마지막" data-l="마지막 거래">{날글(x.마지막)}</td>
                          </tr>)) })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {탭 === '원장' && (
              <div className="card">
                <div className="gr-chips">
                  {곳들.map((x) => <button key={x.이름} type="button" className={'chip' + ((고른 || (곳들[0] && 곳들[0].이름)) === x.이름 ? ' on' : '')} onClick={() => set고른(x.이름)}>{x.이름}{x.받을 || x.줄돈 ? ' •' : ''}</button>)}
                </div>
                {(() => {
                  const 이름 = 고른 && 곳들.some((x) => x.이름 === 고른) ? 고른 : 곳들[0] && 곳들[0].이름
                  if (!이름) return <p className="muted">거래처가 없습니다 — 현장 손익 장부에 거래처를 적으면 여기 나옵니다.</p>
                  const 원 = 경.원장(지금.R, 이름)
                  const 끝 = 원[원.length - 1] || { 받을: 0, 줄돈: 0 }
                  const 곳 = 예시 ? 경.예시정보[이름] || {} : ((정보.곳 || {})[이름] || {})
                  const 숨 = 예시 ? 곳 : 비밀.get(이름) || {}
                  const 맞음 = 예시 ? null : 경.사업자맞음(숨.사업자)
                  return (
                    <>
                      {읽기만 ? (
                        <div className="gr-kv"><b>{이름}</b>{곳.대표 && <span>대표 {곳.대표}</span>}{곳.업종 && <span>{곳.업종}</span>}{곳.전화 && <span>{곳.전화}</span>}{숨.사업자 && <span>사업자 {숨.사업자}</span>}{(곳.은행 || 숨.계좌) && <span>{곳.은행} {숨.계좌}</span>}</div>
                      ) : (
                        <details className="gr-info">
                          <summary><b>{이름}</b> <span className="muted">— 거래처 정보{곳.업종 ? ' · ' + 곳.업종 : ''}{곳.전화 ? ' · ' + 곳.전화 : ''}</span></summary>
                          <div className="gr-form">
                            <label>대표<input className="gr-in" value={곳.대표 || ''} onChange={(e) => 정보고침(이름, { 대표: e.target.value })} /></label>
                            <label>업종<input className="gr-in" value={곳.업종 || ''} placeholder="레미콘 · 철근 · 장비 · 외주 …" onChange={(e) => 정보고침(이름, { 업종: e.target.value })} /></label>
                            <label>전화<input className="gr-in" inputMode="tel" value={곳.전화 || ''} onChange={(e) => 정보고침(이름, { 전화: 경.전화꼴(e.target.value) })} /></label>
                            <label>은행<input className="gr-in" value={곳.은행 || ''} onChange={(e) => 정보고침(이름, { 은행: e.target.value })} /></label>
                            <label>사업자등록번호 🔐<input className="gr-in" inputMode="numeric" value={숨.사업자 || ''} placeholder="000-00-00000" onChange={(e) => 비밀고침(이름, '사업자', 경.사업자꼴(e.target.value))} />{맞음 === false && <small className="gr-warn">⚠️ 끝자리 셈이 맞지 않습니다 — 번호를 다시 보십시오</small>}</label>
                            <label>계좌 🔐<input className="gr-in" inputMode="numeric" value={숨.계좌 || ''} onChange={(e) => 비밀고침(이름, '계좌', 경.계좌꼴(e.target.value))} /></label>
                            <p className="muted gr-small">🔐 사업자번호 · 계좌는 이 기기 열쇠로 잠가 저장합니다(서버로 안 보냄 · 비밀번호 안 물음). 이름 · 금액은 손익 장부 그대로.</p>
                          </div>
                        </details>
                      )}
                      <div className="gg-tiles gr-tiles gr-tiles2">
                        <div className={끝.받을 > 0 ? 'mid' : ''}><span>받을 돈 남음</span><b>{남은글(끝.받을)}</b>원</div>
                        <div className={끝.줄돈 > 0 ? 'bad' : ''}><span>줄 돈 남음</span><b>{경.원(끝.줄돈)}</b>원</div>
                      </div>
                      <div className="detail-h">거래처 원장 — 날짜 차례</div>
                      <div className="gr-wrap">
                        <table className="gr-t gr-장">
                          <thead><tr><th>날</th><th>갈래</th><th>현장</th><th>항목 · 적요</th><th className="n">금액</th><th className="n">받을 돈 남음</th><th className="n">줄 돈 남음</th></tr></thead>
                          <tbody>
                            {원.length === 0 && <tr><td colSpan={7} className="muted">이 거래처와 적은 돈이 없습니다(결제액이 없는 선급금 줄만 있으면 여기 안 나옴)</td></tr>}
                            {원.map((e, i) => (
                              <tr key={e.줄 + '|' + e.갈래 + '|' + i}>
                                <td className="gr-날">{날글(e.날)}{e.결제일없음 && <small className="gr-앞" title="결제일이 비어 장부 날짜로 셈"> 결제일 없음</small>}</td>
                                <td className="gr-갈래"><span className={'gr-갈 ' + (갈래색[e.갈래] || '')}>{e.선급 ? '선급' : e.갈래}</span></td>
                                <td className="gr-현">{현장이름.get(e.현장) || '–'}</td>
                                <td className="gr-적">{e.항목 && <span className="muted">[{e.항목}] </span>}{e.적요}</td>
                                <td className="n gr-금"><b>{경.원(e.금액)}</b></td>
                                {(() => { const 받쪽 = e.받을 || e.갈래 === '청구' || e.갈래 === '수금', 줄쪽 = e.줄돈 || e.갈래 === '매입' || e.갈래 === '지급'
                                  return (<>
                                    <td className={'n gr-남' + (e.받을 < 0 ? ' gr-neg' : '') + (받쪽 ? '' : ' gr-폰숨')} data-l="받을 돈 남음">{받쪽 ? 남은글(e.받을) : '–'}</td>
                                    <td className={'n gr-남' + (줄쪽 ? '' : ' gr-폰숨')} data-l="줄 돈 남음">{줄쪽 ? 경.원(e.줄돈) : '–'}</td>
                                  </>) })()}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </>
      )}
      <p className="muted gr-foot">함께 쓰는 곳: <Link to="/tools/sonik">현장 손익 장부</Link> · <Link to="/tools/equip">장비 장부</Link> · <Link to="/tools/nomubi">노무비 계산기</Link> · <Link to="/tools/singo">매달 신고 정리</Link></p>
    </div>
  )
}
