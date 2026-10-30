/**
 * 📑 G464 골조 모델 «내역서 대조 → 설계변경» (2026-10-30 · 적산컨맵 다음 차례 «설계변경 연결»)
 *   내 내역서를 넣으면 골조 줄(레미콘 · 타설 · 철근 · 가공조립 · 거푸집 · 데크)마다 이 모델 물량과 견주고 → 변경 수량 → 설계변경 엑셀
 *   짝 규칙 · 변경 수량 · 엑셀은 lib/골조변경.js · 파일은 이 브라우저 안에서만(IndexedDB «kcm.model.ny.v1» · 예시는 저장 안 함 · 서버로 안 감)
 *   📊 세기(안 보임): |골조모델|내역대조 · |골조모델|내역예시 · |골조모델|변경엑셀 · |골조모델|변경내파일
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import 받기검사판, { 엑셀내려주기 } from './받기검사판.jsx'
import { 넣기 as 기억넣기, 꺼내기 as 기억꺼내기, 지우기 as 기억지우기 } from './lib/기억자료.js'

const 열쇠 = 'kcm.model.ny.v1'
const 빈설정 = () => ({ 짝: {}, 넣기: {}, 값: {} })
const 수글 = (v, d = 3) => (v === null || v === undefined || !Number.isFinite(+v) ? '—' : (+v).toLocaleString('ko-KR', { maximumFractionDigits: d }))
const 원 = (v) => (Number.isFinite(v) ? Math.round(v).toLocaleString('ko-KR') + '원' : '—')
const 판정꼴 = { 같음: ['✓', 'ok'], '도면이 많음': ['▲', 'up'], '도면이 적음': ['▼', 'dn'] }

async function 불러오기() {
  const [변, 대, 채, q, 쓰, 변엑] = await Promise.all([import('./lib/골조변경.js'), import('./lib/내역대조.js'), import('./lib/내역채움.js'), import('./lib/qtoxlsx.js'), import('./lib/엑셀쓰기.js'), import('./lib/변경엑셀쓰기.js')])
  return { ...변, 내역읽기: 대.내역읽기, 셀바꾸기: 채.셀바꾸기, readWorkbook: q.readWorkbook, 값만으로: 쓰.값만으로, 변경엑셀: 변엑.변경엑셀 }
}

export default function 골조변경판({ M, S, 세기 = () => {} }) {
  const [lib, setLib] = useState(null)
  const [재료, set재료] = useState(null)        // { 이름, 원본, 내0, 내, 책, 수식칸, 켠, 예시 }
  const [설정, set설정] = useState(빈설정)
  const [상태, set상태] = useState(null)        // { k: 'err'|'busy', 글 }
  const [검사, set검사] = useState(null)
  const 파일Ref = useRef(null)
  const 예시모델 = /^가상 예시/.test((M && M.이름) || '')

  /* 열기 — 파일 바이트 → 읽기 · 시트 고르기 · 수식 칸 */
  const 열기 = async (원본, 이름, 켤 = null, 처음설정 = null, 예시 = false) => {
    set상태({ k: 'busy', 글: '내역서를 읽는 중…' })
    try {
      const L = lib || await 불러오기()
      if (!lib) setLib(L)
      await new Promise((ok) => setTimeout(ok, 20))
      const 내0 = L.내역읽기(원본, 이름)
      const 내 = L.시트고르기(내0, 켤)
      const xlsx = /\.xls[xm]$/i.test(이름)
      const 책 = /\.(csv|txt|tsv)$/i.test(이름) ? null : L.readWorkbook(원본)
      const 수식칸 = xlsx ? L.수식칸찾기(원본, 내, L.셀바꾸기) : null
      set재료({ 이름, 원본, 내0, 내, 책, 수식칸, 켠: 내.시트들.filter((s) => s.켬).map((s) => s.시트), 예시, xlsx })
      set설정(처음설정 || 빈설정())
      set상태(null); set검사(null)
      return true
    } catch (e) { set상태({ k: 'err', 글: '내역서를 읽지 못했습니다 — ' + ((e && e.message) || e) }); return false }
  }
  const 파일고름 = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (await 열기(new Uint8Array(await f.arrayBuffer()), f.name)) 세기('|골조모델|내역대조')
  }
  const 예시열기 = async () => {
    try {
      const res = await fetch('/jeoksan/' + encodeURIComponent('골조예시_내역서.xlsx'))
      if (!res.ok) throw new Error('예시 내역서를 받지 못함')
      if (await 열기(new Uint8Array(await res.arrayBuffer()), '골조예시_내역서.xlsx', null, null, true)) 세기('|골조모델|내역예시')
    } catch (e) { set상태({ k: 'err', 글: (e && e.message) || String(e) }) }
  }
  const 지우기 = () => { set재료(null); set설정(빈설정()); set검사(null); 기억지우기(열쇠).catch(() => {}) }
  const 시트바꿈 = (시트) => {
    if (!재료) return
    const 켠 = 재료.켠.includes(시트) ? 재료.켠.filter((x) => x !== 시트) : [...재료.켠, 시트]
    if (!켠.length) return
    const 내 = lib.시트고르기(재료.내0, 켠)
    set재료({ ...재료, 내, 켠, 수식칸: 재료.xlsx ? lib.수식칸찾기(재료.원본, 내, lib.셀바꾸기) : null })
  }

  /* 이 브라우저에 기억(예시는 안 함) — 다시 열면 그대로 */
  const 꺼냄 = useRef(false)
  useEffect(() => {
    if (꺼냄.current) return
    꺼냄.current = true
    기억꺼내기(열쇠).then((v) => { if (v && v.원본 && v.이름 && !재료) 열기(new Uint8Array(v.원본), v.이름, v.켠 || null, v.설정 || null) }).catch(() => {})
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!재료 || 재료.예시) return
    const h = setTimeout(() => { 기억넣기(열쇠, { 이름: 재료.이름, 원본: 재료.원본, 켠: 재료.켠, 설정 }).catch(() => {}) }, 400)
    return () => clearTimeout(h)
  }, [재료, 설정])

  const 판 = useMemo(() => {
    if (!lib || !재료 || !S || S.오류) return null
    try { return lib.골조대조(M, S, 재료.내, { ...설정, 수식칸: 재료.수식칸 }) } catch (e) { return { 오류: String((e && e.message) || e) } }
  }, [lib, 재료, 설정, M, S])
  const 기대 = useMemo(() => {
    if (!판 || 판.오류 || !재료 || !재료.책) return null
    try { return lib.변경기대(lib.변경모형(재료.책, 판, 재료.이름)) } catch (e) { return null }
  }, [판, 재료, lib])

  const 넣기바꿈 = (x, v) => set설정((P) => ({ ...P, 넣기: { ...P.넣기, [x.열쇠]: v } }))
  const 값바꿈 = (x, t) => {
    const s = String(t).trim()
    set설정((P) => {
      const 값 = { ...P.값 }
      if (s === '') delete 값[x.열쇠]; else if (Number.isFinite(+s)) 값[x.열쇠] = +s
      return { ...P, 값, 넣기: { ...P.넣기, [x.열쇠]: s !== '' || P.넣기[x.열쇠] } }
    })
  }
  const 짝바꿈 = (x, key) => set설정((P) => {
    const 넣기 = { ...P.넣기 }; delete 넣기[x.열쇠]
    const 값 = { ...P.값 }; delete 값[x.열쇠]
    return { ...P, 짝: { ...P.짝, [x.열쇠]: key }, 넣기, 값 }
  })

  /* ── 받기 ── */
  const 이름바탕 = 재료 ? 재료.이름.replace(/\.[^.]+$/, '') : '내역서'
  const 변경엑셀받기 = async () => {
    if (!판 || 판.오류 || !재료 || !재료.책) return
    set상태({ k: 'busy', 글: '설계변경 엑셀을 만드는 중…' })
    await new Promise((ok) => setTimeout(ok, 20))
    try {
      let 판2 = 판
      if (재료.xlsx) {
        /* 수식 칸(«펌프차 타설 = 레미콘 합») — 내 내역서에 넣어 다시 셈한 값으로(내 내역서와 같은 증감) */
        const 셀 = lib.셀바꾸기(재료.원본, lib.바꿀것(판), { 알림: false, 칠: false })
        판2 = lib.수식반영(판, lib.다시읽은수량(lib.값만으로(셀.bytes).바이트, 판, lib.readWorkbook))
      }
      const 모형 = lib.변경모형(재료.책, 판2, 재료.이름)
      const 바이트 = lib.변경엑셀(lib.변경시트들(모형, 판2))
      const g = lib.변경검사(바이트, lib.변경기대(모형), lib)
      const 이름 = 이름바탕 + '_설계변경(골조).xlsx'
      set검사({ ...g, 바이트, 이름, 꼴: '변경' })
      if (g.통과) { 엑셀내려주기(바이트, 이름); 세기('|골조모델|변경엑셀') }
      set상태(null)
    } catch (e) { set상태({ k: 'err', 글: '설계변경 엑셀을 만들지 못했습니다 — ' + ((e && e.message) || e) }) }
  }
  const 내파일받기 = async () => {
    if (!판 || 판.오류 || !재료 || !재료.xlsx) return
    set상태({ k: 'busy', 글: '내 내역서에 변경 수량을 넣는 중…' })
    await new Promise((ok) => setTimeout(ok, 20))
    try {
      const 셀 = lib.셀바꾸기(재료.원본, lib.바꿀것(판), { 도면: '건설맵 골조 모델(' + ((M && M.이름) || '') + ')' })
      const 검 = await import('./lib/받기전검사.js')
      const g = 검.넣은칸검사(셀.bytes, 셀.됨)
      const 이름 = 이름바탕 + '_변경수량.' + (/\.xlsm$/i.test(재료.이름) ? 'xlsm' : 'xlsx')
      set검사({ ...g, 이름, 꼴: '내파일' })
      if (g.통과) { 엑셀내려주기(셀.bytes, 이름); 세기('|골조모델|변경내파일') }
      set상태(null)
    } catch (e) { set상태({ k: 'err', 글: '내 내역서에 넣지 못했습니다 — ' + ((e && e.message) || e) }) }
  }

  const 짝줄 = 판 && !판.오류 ? 판.줄.filter((x) => x.r.도면) : []
  const 남은줄 = 판 && !판.오류 ? 판.줄.filter((x) => !x.r.도면) : []
  const 넣은 = 짝줄.filter((x) => x.넣음 && x.바뀜)
  const 짝목록 = 판 && !판.오류 ? 판.도면.filter((d) => d.골) : []
  const 시트목록 = 재료 ? 재료.내0.시트들.map((s) => ({ 시트: s.시트, n: lib ? lib.골조줄수(s) : 0 })).filter((s) => s.n > 0) : []

  const 줄그림 = (x) => {
    const n = x.r.내역, [표, 꼴] = 판정꼴[x.판정] || ['—', 'none']
    const 값 = x.사람값 !== null ? x.사람값 : (x.넣음 ? x.변경 : x.제안)
    return (
      <tr key={x.열쇠} className={(x.넣음 && x.바뀜 ? 'in' : '') + (x.큼 ? ' big' : '')}>
        <td className="c">{x.수식칸 ? <span title="수량 칸이 수식 — 받을 때 내역서 식대로 다시 셈">🔗</span> : <input type="checkbox" aria-label={n.줄 + '행 변경에 넣기'} checked={!!x.넣음} disabled={x.제안 === null && x.사람값 === null} onChange={(e) => 넣기바꿈(x, e.target.checked)} />}</td>
        <td className="num muted" title={n.시트}>{n.줄}</td>
        <td className="nm">{n.품명}{n.규격 ? <small> · {n.규격}</small> : null}</td>
        <td>{n.단위}</td>
        <td className="num">{수글(x.당초)}</td>
        <td className="num" title={x.방법 || ''}>{수글(x.모델)}{x.r.할증 ? <small className="muted"> 할증{x.r.할증}%</small> : null}{x.r.덩이 && x.r.덩이.수 > 1 ? <small className="muted"> 덩이</small> : null}</td>
        <td className={'num gmd-cv-' + 꼴}>{x.율 === null ? '' : <>{표} {Math.abs(x.율).toFixed(1)}%</>}{x.큼 ? <b className="gmd-cv-warn" title="30% 넘게 다름 — 짝이 맞는지 · 모델에 빠진 부재가 있는지 먼저 확인"> ⚠</b> : null}{x.믿음 === '약함' ? <small className="muted" title={x.까닭}> 약</small> : null}</td>
        <td className="num">{x.수식칸 ? <small className="muted">내역서 식</small> : <input type="number" step="any" inputMode="decimal" aria-label={n.줄 + '행 변경 수량'} className="gmd-cv-in" value={값 === null || 값 === undefined ? '' : 값} placeholder="—" onChange={(e) => 값바꿈(x, e.target.value)} />}</td>
        <td><select aria-label={n.줄 + '행 건설맵 짝'} value={x.r.도면 ? x.r.도면.key : ''} onChange={(e) => 짝바꿈(x, e.target.value)} title={x.까닭}>
          <option value="">— 짝 없음</option>
          {짝목록.map((d) => <option key={d.key} value={d.key}>{d.품명} {d.규격} · {수글(d.수량, 2)}</option>)}
        </select></td>
      </tr>
    )
  }
  const 머리 = <thead><tr><th>넣기</th><th>줄</th><th>품명 · 규격</th><th>단위</th><th>내역</th><th title="재료 줄(레미콘 · 철근)은 할증 넣은 값 · 타설 · 가공조립은 할증 없이">건설맵</th><th>차이</th><th>변경</th><th title="짝 목록의 숫자는 할증 전">짝</th></tr></thead>

  return (
    <section className="gmd-cv" aria-label="내역서 대조 · 설계변경">
      <h2 className="gmd-h">📑 내역서 대조 → 설계변경 <span className="muted">내 내역서 골조 줄 ↔ 이 모델 물량</span></h2>
      <input ref={파일Ref} type="file" accept=".xlsx,.xlsm,.xls,.csv" hidden onChange={파일고름} />
      {!재료 && (
        <div className="gmd-top">
          <button type="button" className="btn" style={{ width: 'auto' }} onClick={() => 파일Ref.current && 파일Ref.current.click()} disabled={!S || !!S.오류}>📂 내역서 넣기</button>
          {예시모델 && <button type="button" className="btn line" style={{ width: 'auto' }} onClick={예시열기}>🧪 예시 내역서</button>}
          <span className="muted gmd-p">.xlsx · .xls · .csv — 이 브라우저 안에서만 읽습니다.</span>
        </div>
      )}
      {상태 && <p className={상태.k === 'err' ? 'gmd-warn' : 'muted'} role="status">{상태.글}</p>}
      {재료 && 판 && 판.오류 && <p className="gmd-warn">대조하지 못했습니다 — {판.오류}</p>}
      {재료 && 판 && !판.오류 && (<>
        <div className="gmd-cv-file">
          <span>📄 <b>{재료.이름}</b>{재료.예시 ? <small className="muted"> (가상 예시)</small> : null}</span>
          {시트목록.length > 1 && <span className="gmd-cv-sheets">{시트목록.map((s) => <button key={s.시트} type="button" className={'gmd-gs-chip' + (재료.켠.includes(s.시트) ? ' on' : '')} aria-pressed={재료.켠.includes(s.시트)} onClick={() => 시트바꿈(s.시트)} title={'골조 줄 ' + s.n}>{s.시트} <small>{s.n}</small></button>)}</span>}
          <span className="gmd-cv-act"><button type="button" className="gmd-link" onClick={() => 파일Ref.current && 파일Ref.current.click()}>다른 내역서</button> · <button type="button" className="gmd-link" onClick={() => set설정(빈설정())}>처음대로</button> · <button type="button" className="gmd-link" onClick={지우기} aria-label="내역 대조 지우기">✕</button></span>
        </div>
        {판.한눈.length > 0 && <div className="gmd-cv-sum">{판.한눈.map((h) => <span key={h.이름} className={'gmd-cv-chip' + (h.맞음 >= 95 ? ' ok' : h.맞음 >= 85 ? ' mid' : ' low')} title={'내역 ' + 수글(h.내역) + ' · 건설맵 ' + 수글(h.모델) + ' ' + h.단위 + ' (' + h.줄글 + ')'}>{h.이름} <b>{h.맞음.toFixed(1)}%</b></span>)}</div>}
        {짝줄.length ? (
          <div className="gmd-tablewrap"><table className="gmd-table gmd-cv-table">{머리}<tbody>{짝줄.map(줄그림)}</tbody></table></div>
        ) : <p className="muted gmd-p">이 시트에서 모델과 짝이 되는 골조 줄을 못 찾았습니다 — 다른 시트를 켜거나 아래 줄에서 짝을 고르십시오.</p>}
        {남은줄.length > 0 && (
          <details className="gmd-cv-rest">
            <summary>짝 없음 · 다른 동·공종 {남은줄.length}줄 <span className="muted">(짝을 고르면 위로 올라감)</span></summary>
            <div className="gmd-tablewrap"><table className="gmd-table gmd-cv-table">{머리}<tbody>{남은줄.map(줄그림)}</tbody></table></div>
          </details>
        )}
        <p className="gmd-cv-money" role="status">변경에 넣은 줄 <b>{넣은.length}</b>
          {기대 && 기대.당초 > 0 ? <> · 골조 줄 금액 {원(기대.당초)} → <b>{원(기대.변경)}</b> <span className={기대.변경 - 기대.당초 >= 0 ? 'gmd-cv-up' : 'gmd-cv-dn'}>({기대.변경 - 기대.당초 >= 0 ? '+' : '−'}{원(Math.abs(기대.변경 - 기대.당초))})</span></> : 기대 ? <span className="muted"> · 단가가 없는 내역서(수량만)</span> : null}
          {짝줄.some((x) => x.수식칸) ? <small className="muted"> · 🔗 수식 칸은 받을 때 내역서 식대로 셈</small> : null}
        </p>
        <div className="gmd-top gmd-cv-btns">
          <button type="button" className="btn" style={{ width: 'auto' }} onClick={변경엑셀받기} disabled={!재료.책 || (상태 && 상태.k === 'busy')}>📑 설계변경 엑셀(2줄 · 증감대비표)</button>
          {재료.xlsx && <button type="button" className="btn line" style={{ width: 'auto' }} onClick={내파일받기} disabled={!넣은.length || (상태 && 상태.k === 'busy')}>📄 내 내역서에 변경 수량 넣기</button>}
          <Link className="gmd-link" to="/change/work">🧰 설계변경 작업대 →</Link>
        </div>
        <p className="muted gmd-p gmd-cv-note">다르다고 곧 틀린 것은 아닙니다 — 할증 · 셈 기준 · 모델에 없는 부재(무근 · 방수턱 · 파라펫 …)를 확인하고 ☑ 하십시오. 짝이 약한 줄 · 여러 줄 덩이(비율로 나눔) · 30% 넘게 다른 줄은 처음엔 넣지 않습니다.</p>
      </>)}
      <받기검사판 검사={검사} 닫기={() => set검사(null)} 받기={() => { if (!검사 || !검사.바이트) return; 엑셀내려주기(검사.바이트, 검사.이름); 세기(검사.꼴 === '내파일' ? '|골조모델|변경내파일' : '|골조모델|변경엑셀'); set검사({ ...검사, 알고: true }) }} />
    </section>
  )
}
