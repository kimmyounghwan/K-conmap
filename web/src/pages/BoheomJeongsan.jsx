import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  종류들, 수, 원, 달일수, 빈줄, 빈공사, 고르기, 읽기, 쓰기, 회셈, 공사셈, 붙임들, 다음회, 붙여읽기, 예시, 셋합, 근거, 근거주소,
} from '../lib/보험정산.js'
import { use인쇄 } from '../tools/공정인쇄.js'
import 도구설명 from '../tools/도구설명.jsx'
import 이어쓰기 from '../tools/이어쓰기.jsx'
import { 앞모습두기 } from '../lib/이어쓰기.js'
import { 세기 } from '../lib/받은수.jsx'

/**
 * 🩺 /tools/boheom-jeongsan — 국민건강 · 연금보험료 정산 청구서 (G146 · 2026-10-05)
 *
 * 소장님: 카페 «하청인데 원청에 건강·연금 청구 방법/양식» → 「어떤 서식이 있지?」 → 「사이트에서 쓰고, 다운받게」 → 「해」
 *         「수식을 확실하게 넣을 수 있어?」 → 「그럼, 한 번 이면 끝이잖아 ㅎㅎ」 → 엑셀은 «값만» · 다음 회차는 사이트에서 이어 쓰기
 * ■ 집행기준 제94조③: 일용 = 현장 사업장 납입확인서 금액 · 상용 = 회사 납입확인서 금액 × 투입일 ÷ 그달 일수(일할) — 사업자 부담분만
 * ■ 한 공사에 회차를 쌓음 → 전회까지 · 누계 · 내역서 계상액 대비 남은 금액(제94조②) 저절로
 * ■ 종이(A4 가로) 하나로 인쇄 · 📗 값만 엑셀(lib/격자엑셀.js — 종이 칸 그대로). 셈은 lib/보험정산.js 하나.
 * ■ 저장: 이 브라우저 + 🔗 코드 + 비밀번호(ns 'bj'). 창(alert · confirm) 없음 — 지우기는 한 번 더 누르기.
 * ■ 📊 세기(숫자는 사이트 어디에도 안 보임): |보험정산|인쇄 · |보험정산|엑셀 · |보험정산|예시 · |보험정산|붙여넣기 (받기는 받은수가 저절로)
 */

const 숫자만 = (v) => String(v ?? '').replace(/[^\d]/g, '')
const 쉼 = (v) => { const s = 숫자만(v); return s ? Number(s).toLocaleString('ko-KR') : '' }
const 점날 = (t) => { const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[1]}. ${+m[2]}. ${+m[3]}.` : '' }
const 긴날 = (t) => { const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[1]}년 ${+m[2]}월 ${+m[3]}일` : '　　　　년　　월　　일' }
const 달글 = (ym) => { const m = String(ym || '').match(/^(\d{4})-(\d{2})$/); return m ? `${m[1]}. ${+m[2]}.` : '' }
const 오늘 = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const 바로 = (s) => (s ? <b>{s}</b> : <span className="muted">—</span>)

export default function BoheomJeongsan() {
  const [st, setSt] = useState(() => 읽기())
  const [저장됨, set저장됨] = useState(true)
  const [알림, set알림] = useState('')
  const [묻기, set묻기] = useState('')
  const [붙글, set붙글] = useState('')
  const 미리 = useRef(null)
  const [폭, set폭] = useState(0)
  const [크게, set크게] = useState(false)
  useEffect(() => {
    const el = 미리.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => set폭(el.clientWidth))
    ro.observe(el); set폭(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  /* 📱 폰 — 종이(1080px)를 칸에 맞춰 한눈에(누르면 크게 · 옆으로 밀기) */
  const 좁음 = 폭 > 0 && 폭 - 22 < 1120
  const 맞춤 = 좁음 && !크게 ? Math.max(0.3, (폭 - 22) / 1120) : 1
  useEffect(() => { set저장됨(쓰기(st)) }, [st])
  useEffect(() => { document.title = '국민건강 · 연금보험료 정산 청구서 | K-건설맵' }, [])

  const c = st.cur
  const 바꿈 = (f) => setSt((s) => ({ ...s, cur: 고르기(f(s.cur)) }))
  const 칸 = (k, v) => 바꿈((x) => ({ ...x, [k]: v }))
  const 셋칸 = (무엇, k, v) => 바꿈((x) => ({ ...x, [무엇]: { ...x[무엇], [k]: v } }))
  const S = useMemo(() => 공사셈(c), [c])
  const 회 = S.회
  const 회칸 = (k, v) => 바꿈((x) => ({ ...x, 회들: x.회들.map((r) => (r.id === 회.id ? { ...r, [k]: v } : r)) }))
  const 줄칸 = (id, k, v) => 바꿈((x) => ({ ...x, 회들: x.회들.map((r) => (r.id === 회.id ? { ...r, 줄: r.줄.map((z) => (z.id === id ? { ...z, [k]: v } : z)) } : r)) }))
  const 줄더 = (k) => {
    const 앞 = 회.줄[회.줄.length - 1]
    const m = (앞 && 앞.m) || (회.시작 ? 회.시작.slice(0, 7) : '')
    바꿈((x) => ({ ...x, 회들: x.회들.map((r) => (r.id === 회.id ? { ...r, 줄: [...r.줄, 빈줄(k, { m })] } : r)) }))
  }
  const 줄뺌 = (id) => 바꿈((x) => ({ ...x, 회들: x.회들.map((r) => (r.id === 회.id ? { ...r, 줄: r.줄.filter((z) => z.id !== id) } : r)) }))
  const 회고름 = (id) => { 바꿈((x) => ({ ...x, 지금: id })); set묻기(''); set알림('') }
  const 회더 = () => {
    const 새 = 다음회(c)
    바꿈((x) => ({ ...x, 회들: [...x.회들, 새], 지금: 새.id }))
    set알림(`제${새.n}회를 만들었습니다 — 앞 회차의 사람 줄을 그대로 가져왔습니다(달은 다음 달 · 금액 · 투입일은 비움). 앞 회차 청구액은 «전회까지» 에 저절로 들어갑니다.`)
  }
  const 회뺌 = () => {
    if (c.회들.length < 2) return
    앞모습두기('bj', st)
    바꿈((x) => { const 남 = x.회들.filter((r) => r.id !== 회.id); return { ...x, 회들: 남, 지금: 남[남.length - 1].id } })
    set묻기(''); set알림(`제${회.n}회를 지웠습니다. 되살리려면 «🔗 이어 쓰기 → 💾 백업 · 더 보기 → ↩ 되돌리기».`)
  }
  const 저장 = () => {
    const 이름 = (c.공사명 || '이름 없는 공사').slice(0, 40)
    setSt((s) => ({ ...s, 모음: [{ id: c.id, 이름, at: Date.now(), data: c }, ...s.모음.filter((x) => x.id !== c.id)].slice(0, 20) }))
    set알림(`«${이름}» 을(를) 이 브라우저에 저장했습니다.`)
  }
  const 불러옴 = (x) => { setSt((s) => ({ ...s, cur: 고르기(x.data) })); set알림(`«${x.이름}» 을(를) 불러왔습니다.`) }
  const 붙이기 = () => {
    const { 줄, 못읽음 } = 붙여읽기(붙글)
    if (!줄.length) { set알림('읽은 줄이 없습니다 — 엑셀에서 «구분 · 성명 · 해당 월 · 투입일 · 그달 일수 · 건강 · 장기요양 · 국민연금 · 비고» 차례로 칸을 골라 복사해 붙여 넣으십시오.'); return }
    바꿈((x) => ({ ...x, 회들: x.회들.map((r) => (r.id === 회.id ? { ...r, 줄: [...r.줄.filter((z) => !(z.n === '' && z.h === '' && z.y === '' && z.p === '')), ...줄] } : r)) }))
    set붙글(''); 세기('|보험정산|붙여넣기')
    set알림(`${줄.length}줄을 넣었습니다${못읽음 ? ` (못 읽은 줄 ${못읽음})` : ''}. 확인서 금액 · 투입일이 맞는지 한 번 보십시오.`)
  }

  const [인쇄중, 인쇄] = use인쇄(`보험료_정산_청구서_제${회.n}회${c.공사명 ? '_' + c.공사명 : ''}`)
  const 엑셀 = async () => {
    const [{ 종이를격자, 격자책 }, { 바이트받기 }] = await Promise.all([import('../lib/격자엑셀.js'), import('../lib/값엑셀.js')])
    const el = 미리.current ? 미리.current.querySelector('.rk-paper') : null
    if (!el) { set알림('미리보기를 찾지 못했습니다 — 다시 눌러 주십시오.'); return }
    바이트받기(`보험료_정산_청구서_제${회.n}회_${c.공사명 || '공사'}`, 격자책([{ 이름: `제${회.n}회 청구서`, ...종이를격자(el), 가로: true }]))
    세기('|보험정산|엑셀')
  }
  const 알림들 = S.이번.줄.flatMap((x, i) => x.알림.map((a) => `${i + 1}번 줄 — ${a}`))
  const 빈줄수 = S.이번.줄.filter((x) => x.빈).length

  return (
    <div className="wrap gj bj">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🩺 국민건강 · 연금보험료 정산 청구서 — 사업자 부담분 · 일할 저절로</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          하수급인이 원청에 <b>건강 · 장기요양 · 연금보험료(사업자 부담분)</b>를 청구할 때 쓰는 청구서입니다.
          공단 <b>납부확인서 금액</b>을 옮겨 적으면 현장 앞으로 고지된 것(일용 · 현장 전입 소장)은 그대로, 회사 앞으로 고지된 상용은 <b>투입일만큼 일할</b>해 청구액이 나오고,
          회차를 쌓으면 <b>전회까지 · 누계 · 내역서 계상액 대비 남은 금액</b>이 저절로 셈됩니다.
        </p>
        <div className="nm-badges">
          <span>근거: <a href={근거주소} target="_blank" rel="noopener">{근거}</a></span>
          <span>회원가입 없음 · 무료</span>
          <span>💾 이 브라우저에 저장 · 🔗 코드로 폰·PC 이어 쓰기 {저장됨 ? '' : <b className="nm-warn">— 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>
        </div>
        <이어쓰기 ns="bj" 이름="보험료 정산 청구서" 파일="보험료정산" st={st} setSt={setSt} 읽기={읽기} 쓰기={쓰기} />
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={저장}>💾 이 공사 저장</button>
          {묻기 === 'new'
            ? <><button type="button" className="btn line sm nm-warn" style={{ width: 'auto' }} onClick={() => { 앞모습두기('bj', st); setSt((s) => { const n = 빈공사(); n.지금 = n.회들[0].id; return { ...s, cur: n } }); set묻기(''); set알림('새 공사를 시작했습니다. 전에 적던 것은 «💾 이 공사 저장» 목록 또는 «🔗 이어 쓰기 → ↩ 되돌리기» 로 살립니다.') }}>정말 새로 시작</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('')}>그대로</button></>
            : <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('new')}>＋ 새 공사</button>}
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { 앞모습두기('bj', st); setSt((s) => ({ ...s, cur: 고르기(예시()) })); 세기('|보험정산|예시'); set알림('예시를 채웠습니다 — 지어낸 공사 · 업체 · 사람(○○)입니다. 제1회(8월)는 «전회까지» 로 들어가고 제2회(9월)가 청구서로 나옵니다.') }}>🧪 예시로 해 보기</button>
        </div>
        {알림 && <div className="note sm" role="status" style={{ marginTop: 8 }}>{알림}</div>}
        {st.모음.length > 0 && (
          <div className="gj-saved">
            <div className="fm-ctl-k" style={{ marginBottom: 4 }}>저장한 공사 {st.모음.length}</div>
            {st.모음.map((x) => (
              <div className="gj-saved-r" key={x.id}>
                <button type="button" className="tp-x" onClick={() => 불러옴(x)}>{x.이름}</button>
                <span className="muted">{new Date(x.at).toLocaleDateString('ko-KR')}</span>
                {묻기 === 'm' + x.id
                  ? <><button type="button" className="tp-x nm-warn" onClick={() => { setSt((s) => ({ ...s, 모음: s.모음.filter((y) => y.id !== x.id) })); set묻기('') }}>정말 지우기</button><button type="button" className="tp-x" onClick={() => set묻기('')}>그대로</button></>
                  : <button type="button" className="tp-x" onClick={() => set묻기('m' + x.id)}>지우기</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ① 공사 */}
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>① 공사 · 청구인</div>
        <div className="gj-form">
          <label>공사명<input className="inp" value={c.공사명} onChange={(e) => 칸('공사명', e.target.value)} placeholder="하도급 계약서의 공사명" /></label>
          <label>청구인(하수급인) 상호<input className="inp" value={c.청구인} onChange={(e) => 칸('청구인', e.target.value)} placeholder="예: ○○건설(주)" /></label>
          <label>대표자<input className="inp" value={c.대표} onChange={(e) => 칸('대표', e.target.value)} /></label>
          <label>받는 곳(원도급사)<input className="inp" value={c.받는곳} onChange={(e) => 칸('받는곳', e.target.value)} placeholder="예: ○○종합건설(주)" /></label>
        </div>
        <div className="fm-ctl-k" style={{ marginTop: 12 }}>납부확인서 금액을 어떻게 적나요?</div>
        <div className="fm-ctl-row" role="group" aria-label="확인서 금액 기준" style={{ marginTop: 6 }}>
          <button type="button" className={'fm-chip' + (c.기준 !== 'emp' ? ' on' : '')} aria-pressed={c.기준 !== 'emp'} onClick={() => 칸('기준', 'sum')}>확인서 금액 그대로(근로자 + 사업주 합) — 사업자 부담분 = ½</button>
          <button type="button" className={'fm-chip' + (c.기준 === 'emp' ? ' on' : '')} aria-pressed={c.기준 === 'emp'} onClick={() => 칸('기준', 'emp')}>사업주 몫만 적음</button>
        </div>
        <details className="bj-more" open={S.계있음 || 셋합({ h: 수(c.앞.h), y: 수(c.앞.y), p: 수(c.앞.p) }) > 0 ? true : undefined}>
          <summary>내역서 계상액 · 이 프로그램 쓰기 전 받은 금액 (선택)</summary>
          <div className="note sm" style={{ marginTop: 6 }}>
            정산은 내역서(하도급 산출내역서)에 계상된 보험료 <b>범위 안에서</b> 합니다(제94조②). 계상액을 넣으면 누계 · 남은 금액을 보고, 넘으면 알려 드립니다.
          </div>
          <div className="tp-scroll">
            <table className="tbl bj-set">
              <thead><tr><th>구분</th>{종류들.map(({ k, 긴이름 }) => <th key={k}>{긴이름}</th>)}</tr></thead>
              <tbody>
                <tr><td>내역서 계상액</td>{종류들.map(({ k, 긴이름 }) => <td key={k}><input className="inp gj-num" inputMode="numeric" aria-label={`${긴이름} 계상액`} value={쉼(c.계상[k])} onChange={(e) => 셋칸('계상', k, 숫자만(e.target.value))} /></td>)}</tr>
                <tr><td>이 프로그램 쓰기 전 청구 · 받은 금액</td>{종류들.map(({ k, 긴이름 }) => <td key={k}><input className="inp gj-num" inputMode="numeric" aria-label={`${긴이름} 앞서 받은 금액`} value={쉼(c.앞[k])} onChange={(e) => 셋칸('앞', k, 숫자만(e.target.value))} /></td>)}</tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {/* ② 회차 · 줄 */}
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>② 청구 회차 · 보험료 줄</div>
        <div className="fm-ctl-row" role="tablist" aria-label="회차" style={{ marginTop: 10 }}>
          {[...c.회들].sort((a, b) => a.n - b.n).map((r) => (
            <button key={r.id} type="button" role="tab" aria-selected={r.id === 회.id} className={'fm-chip' + (r.id === 회.id ? ' on' : '')} onClick={() => 회고름(r.id)}>
              제{r.n}회{r.시작 ? ` · ${달글(r.시작.slice(0, 7))}` : ''}
            </button>
          ))}
          <button type="button" className="fm-chip" onClick={회더}>＋ 다음 회차</button>
        </div>
        <div className="gj-form">
          <label>회차<input className="inp gj-num" inputMode="numeric" value={회.n} onChange={(e) => 회칸('n', Math.max(1, Number(숫자만(e.target.value)) || 1))} /></label>
          <label>청구 기간 — 처음<input className="inp" type="date" value={회.시작} onChange={(e) => 회칸('시작', e.target.value)} /></label>
          <label>청구 기간 — 끝<input className="inp" type="date" value={회.끝} onChange={(e) => 회칸('끝', e.target.value)} /></label>
          <label>작성일<span className="bj-inline"><input className="inp" type="date" value={회.작성} onChange={(e) => 회칸('작성', e.target.value)} />{!회.작성 && <button type="button" className="tp-x" onClick={() => 회칸('작성', 오늘())}>오늘</button>}</span></label>
        </div>

        <div className="bj-rows">
          {회.줄.length === 0 && <div className="muted" style={{ padding: '10px 2px' }}>아직 줄이 없습니다 — 아래 «＋ 현장 고지 줄» · «＋ 회사 고지 줄» 을 누르거나 엑셀에서 붙여 넣으십시오.</div>}
          {S.이번.줄.map((x, i) => {
            const r = x.r
            const 상용 = r.k !== '일용'
            const 자동일수 = 달일수(r.m)
            return (
              <div className="bj-row" key={r.id}>
                <div className="bj-row-h">
                  <b className="bj-no">{i + 1}</b>
                  <div className="fm-ctl-row" role="group" aria-label="구분">
                    <button type="button" className={'fm-chip' + (!상용 ? ' on' : '')} aria-pressed={!상용} onClick={() => 줄칸(r.id, 'k', '일용')}>현장 고지</button>
                    <button type="button" className={'fm-chip' + (상용 ? ' on' : '')} aria-pressed={상용} onClick={() => 줄칸(r.id, 'k', '상용')}>회사 고지 · 일할</button>
                  </div>
                  <span className="bj-sum">{x.빈 ? <span className="muted">확인서 금액을 넣으십시오</span> : <>청구 <b>{원(x.합)}</b>원{상용 && x.비율 > 0 && x.비율 < 1 ? <span className="muted"> ({x.분자}/{x.분모}일)</span> : ''}</>}</span>
                  <button type="button" className="tp-x" aria-label={`${i + 1}번 줄 지우기`} onClick={() => 줄뺌(r.id)}>✕</button>
                </div>
                <div className="bj-f">
                  <label className="bj-w2">{상용 ? '성명 (직책)' : '성명 · 내용'}<input className="inp" value={r.n} onChange={(e) => 줄칸(r.id, 'n', e.target.value)} placeholder={상용 ? '예: 이○○ (공무)' : '예: 일용 근로자 6명 · 김○○ 소장(현장 전입)'} /></label>
                  <label>해당 월<input className="inp" type="month" value={r.m} onChange={(e) => 줄칸(r.id, 'm', e.target.value)} /></label>
                  {상용 && <>
                    <label>현장 투입일<input className="inp gj-num" inputMode="numeric" value={r.d} onChange={(e) => 줄칸(r.id, 'd', 숫자만(e.target.value))} placeholder="일" /></label>
                    <label>그달 일수<input className="inp gj-num" inputMode="numeric" value={r.t} onChange={(e) => 줄칸(r.id, 't', 숫자만(e.target.value))} placeholder={자동일수 ? `${자동일수} (달력)` : '일'} /></label>
                  </>}
                  {종류들.map(({ k, 이름 }) => (
                    <label key={k}>{이름} — 확인서<input className="inp gj-num" inputMode="numeric" value={쉼(r[k])} onChange={(e) => 줄칸(r.id, k, 숫자만(e.target.value))} placeholder="원" />
                      {!x.빈 && <span className="bj-to">→ {원(x.청[k])}</span>}
                    </label>
                  ))}
                  <label className="bj-w2">비고<input className="inp" value={r.x} onChange={(e) => 줄칸(r.id, 'x', e.target.value)} /></label>
                </div>
              </div>
            )
          })}
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => 줄더('일용')}>＋ 현장 고지 줄 (일용 · 현장 전입 소장)</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 줄더('상용')}>＋ 회사 고지 줄 (상용 · 투입일 일할)</button>
          {c.회들.length > 1 && (묻기 === 'del'
            ? <><button type="button" className="btn line sm nm-warn" style={{ width: 'auto' }} onClick={회뺌}>정말 제{회.n}회 지우기</button><button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('')}>그대로</button></>
            : <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set묻기('del')}>이 회차 지우기</button>)}
        </div>
        <details className="bj-more">
          <summary>📋 엑셀에서 붙여 넣기</summary>
          <div className="note sm" style={{ marginTop: 6 }}>엑셀에서 <b>구분 · 성명(내용) · 해당 월 · 투입일 · 그달 일수 · 건강 · 장기요양 · 국민연금 · 비고</b> 차례의 칸을 골라 복사(Ctrl+C)한 뒤 아래에 붙여 넣으십시오. 구분 칸에 «현장» 또는 «일용» 이 있으면 현장 고지, 아니면 회사 고지 · 일할로 읽습니다.</div>
          <textarea className="inp bj-paste" rows={4} value={붙글} onChange={(e) => set붙글(e.target.value)} placeholder={'현장\t김○○ 소장(현장 전입)\t2026-09\t\t\t429500\t56380\t603600\n회사\t이○○ (공무)\t2026-09\t12\t30\t238200\t31260\t351000'} />
          <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 6 }} onClick={붙이기} disabled={!붙글.trim()}>이 회차에 넣기</button>
        </details>
        <div className="note sm" style={{ marginTop: 10 }}>
          <b>현장 고지</b> — 현장(사업장) 앞으로 나온 확인서 금액을 그대로 정산합니다. 일용근로자, 그리고 <b>소장을 현장으로 전입시켜 현장 앞으로 고지</b>받은 경우가 여기입니다(제94조③ 1호 · 2호 단서).<br />
          <b>회사 고지 · 일할</b> — 회사 앞으로 나온 확인서 금액(상용 · 직접노무비 대상)을 <b>현장 투입일 ÷ 그달 일수</b>로 나눕니다(제94조③ 2호). 어느 쪽이든 <b>사업자 부담분(확인서 금액의 2분의 1)</b>만 청구하고 원 미만은 버립니다.
        </div>
      </div>

      {/* ③ 결과 · 청구서 */}
      <div className="card sn-res">
        <div className="sn-amt">
          <span>제{회.n}회 청구액</span>
          <b>{원(S.이번.합)}원</b>
          <span className="muted">건강 {원(S.이번.청.h)} · 요양 {원(S.이번.청.y)} · 연금 {원(S.이번.청.p)}</span>
        </div>
        <div className="sn-how">
          전회까지 {바로(원(셋합(S.전)) + '원')} · 누계 {바로(원(셋합(S.누)) + '원')}
          {S.계있음 && <> · 계상액 {바로(원(셋합(S.계)) + '원')} · 남은 금액 {바로(원(셋합(S.남)) + '원')}</>}
        </div>
        {(S.넘음.length > 0 || 알림들.length > 0 || 빈줄수 > 0) && (
          <ul className="sn-al">
            {S.넘음.map((n) => <li key={n}>⚠️ {n} 누계가 내역서 계상액을 넘습니다 — 계상액 범위 안에서만 정산됩니다(제94조②).</li>)}
            {빈줄수 > 0 && <li>확인서 금액이 비어 있는 줄이 {빈줄수}개 있습니다(청구서에는 0원으로 나옵니다).</li>}
            {알림들.slice(0, 8).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { 세기('|보험정산|인쇄'); 인쇄() }}>🖨 청구서 인쇄 (A4 가로)</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={엑셀}>📗 엑셀 받기(값만)</button>
        </div>
        {좁음 && <button type="button" className="tp-x" style={{ marginTop: 8 }} onClick={() => set크게((v) => !v)}>{크게 ? '🔎 한눈에 보기' : '🔍 크게 보기 (옆으로 밀어 보기)'}</button>}
        <div className="rk-preview bj-preview" ref={미리}><div style={맞춤 < 1 ? { zoom: 맞춤 } : undefined}><청구종이 c={c} S={S} /></div></div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          법으로 정한 청구 서식은 없습니다(예규에 별지 서식 없음). 원청이 정한 양식이 있으면 그 양식에 이 금액을 옮겨 적으십시오. 4대보험 가입 여부는 <Link to="/tools/ilyong-boheom">일용직 4대보험 판단기</Link>, 고용 · 산재는 <Link to="/tools/boheomryo">고용 · 산재 보험료 계산기</Link>입니다.
        </div>
      </div>

      <도구설명 k="jeongsan" />
      {인쇄중 && createPortal(<div id="gp-인쇄"><div className="rk-쪽 land"><청구종이 c={c} S={S} /></div></div>, document.body)}
    </div>
  )
}

/* ── 청구서 종이(A4 가로) — 화면 미리보기 · 인쇄 · 엑셀(lib/격자엑셀.js 가 이 표를 칸 그대로 옮김) ──
 * 열넷: 번호 · 구분 · 성명·내용 · 해당 월 · 투입일 · 그달 일수 · 확인서(건강 · 요양 · 연금) · 청구액(건강 · 요양 · 연금 · 합계) · 비고
 * 위 · 아래 표도 같은 열넷(colSpan)이라 엑셀 칸 폭이 하나로 맞습니다. */
const 폭들 = [4.5, 7.5, 16.5, 8.5, 6.5, 6.5, 10.5, 9.5, 10.5, 10.5, 9.5, 10.5, 12, 12]
const 열 = () => { const 합 = 폭들.reduce((a, b) => a + b, 0); return <colgroup>{폭들.map((w, i) => <col key={i} data-w={w} style={{ width: (w / 합 * 100).toFixed(3) + '%' }} />)}</colgroup> }
const C = ({ cs = 1, rs = 1, cl = '', n, children }) => (
  <td className={'rk-c ' + cl} colSpan={cs} rowSpan={rs} data-n={n === undefined || n === null || n === '' ? undefined : n}>{children}</td>
)
const N = ({ v, cs, cl = '', 빈 }) => (빈 ? <C cs={cs} cl={'r ' + cl} /> : <C cs={cs} cl={'r ' + cl} n={Math.round(v || 0)}>{원(v)}</C>)

export function 청구종이({ c, S }) {
  const 회 = S.회
  const 이 = S.이번
  const 붙 = 붙임들(이)
  const 기간 = 회.시작 || 회.끝 ? `${점날(회.시작) || '　　.　.　.'} ～ ${점날(회.끝) || '　　.　.　.'}` : ''
  const 한도 = S.계있음 || 셋합(S.전) > 0
  return (
    <div className="rk-paper land bj-paper sn-frame" data-name={`제${회.n}회 청구서`}>
      <div className="rk-bigttl">국민건강 · 연금보험료 정산 청구서</div>
      <table className="rk-t">
        {열()}
        <tbody>
          <tr><C cs={3} cl="hd">공 사 명</C><C cs={6} cl="l">{c.공사명}</C><C cs={2} cl="hd">청 구 회 차</C><C cs={3}>제 {회.n} 회 기성</C></tr>
          <tr><C cs={3} cl="hd">청 구 기 간</C><C cs={6}>{기간}</C><C cs={2} cl="hd">청 구 금 액</C><C cs={3} cl="r b" n={이.합}>{원(이.합)} 원</C></tr>
          <tr><C cs={3} cl="hd">청구인(하수급인)</C><C cs={6} cl="l">{c.청구인}</C><C cs={2} cl="hd">대 표 자</C><C cs={3}>{c.대표}</C></tr>
        </tbody>
      </table>
      <div className="rk-sec">1. 보험료 정산 내역 (사업자 부담분)</div>
      <table className="rk-t">
        {열()}
        <tbody>
          <tr>
            <C rs={2} cl="hd">번호</C><C rs={2} cl="hd">구분</C><C rs={2} cl="hd">성명 · 내용</C><C rs={2} cl="hd">해당 월</C><C rs={2} cl="hd">투입일</C><C rs={2} cl="hd">그달<br />일수</C>
            <C cs={3} cl="hd">납부확인서 금액{c.기준 === 'emp' ? ' (사업주 몫)' : ' (근로자 + 사업주)'}</C><C cs={4} cl="hd">청구액 (사업자 부담분)</C><C rs={2} cl="hd">비 고</C>
          </tr>
          <tr>{종류들.map(({ k, 이름 }) => <C key={'a' + k} cl="hd">{이름}</C>)}{종류들.map(({ k, 이름 }) => <C key={'b' + k} cl="hd">{이름}</C>)}<C cl="hd">합 계</C></tr>
          {이.줄.length === 0 && <tr><C cs={14}>(적은 줄이 없습니다)</C></tr>}
          {이.줄.map((x, i) => {
            const r = x.r
            const 상용 = r.k !== '일용'
            return (
              <tr key={r.id}>
                <C>{i + 1}</C><C cl="sm">{상용 ? '회사 고지\n(일할)' : '현장 고지'}</C><C cl="l">{r.n}</C><C>{달글(r.m)}</C>
                {상용 ? <C cl="r" n={x.분자 || ''}>{x.분자 || ''}</C> : <C>—</C>}
                {상용 ? <C cl="r" n={x.분모 || ''}>{x.분모 || ''}</C> : <C>—</C>}
                {종류들.map(({ k }) => <N key={'a' + k} v={수(r[k])} 빈={!수(r[k])} />)}
                {종류들.map(({ k }) => <N key={'b' + k} v={x.청[k]} 빈={x.빈} />)}
                <N v={x.합} 빈={x.빈} cl="b" />
                <C cl="l sm">{r.x}</C>
              </tr>
            )
          })}
          <tr>
            <C cs={6} cl="hd">합　　계</C>
            {종류들.map(({ k }) => <N key={'a' + k} v={이.확인[k]} cl="b" />)}
            {종류들.map(({ k }) => <N key={'b' + k} v={이.청[k]} cl="b" />)}
            <N v={이.합} cl="b" />
            <C />
          </tr>
        </tbody>
      </table>
      {한도 && <>
        <div className="rk-sec">2. 정산 누계{S.계있음 ? ' (내역서 계상액 범위 — 집행기준 제94조제2항)' : ''}</div>
        <table className="rk-t">
          {열()}
          <tbody>
            <tr><C cs={3} cl="hd">구 분</C><C cs={2} cl="hd">내역서 계상액</C><C cs={2} cl="hd">전회까지 청구</C><C cs={2} cl="hd">이번 청구</C><C cs={2} cl="hd">누 계</C><C cs={3} cl="hd">남은 금액</C></tr>
            {종류들.map(({ k, 긴이름 }) => (
              <tr key={k}>
                <C cs={3} cl="l">{긴이름}</C>
                <N cs={2} v={S.계[k]} 빈={!S.계[k]} /><N cs={2} v={S.전[k]} /><N cs={2} v={이.청[k]} /><N cs={2} v={S.누[k]} />
                <N cs={3} v={S.남[k]} 빈={!S.계[k]} cl={S.계[k] && S.남[k] < 0 ? 'red' : ''} />
              </tr>
            ))}
            <tr>
              <C cs={3} cl="hd">계</C>
              <N cs={2} v={셋합(S.계)} 빈={!S.계있음} cl="b" /><N cs={2} v={셋합(S.전)} cl="b" /><N cs={2} v={이.합} cl="b" /><N cs={2} v={셋합(S.누)} cl="b" />
              <N cs={3} v={셋합(S.남)} 빈={!S.계있음} cl="b" />
            </tr>
          </tbody>
        </table>
      </>}
      <div className="rk-box bj-box">
        <div>■ 정산 기준 — {근거}제3항 · 사업자 부담분만 청구합니다.</div>
        <div>· 현장 고지(일용근로자 · 현장 단위로 따로 납부한 상용근로자): 해당 사업장(현장) 단위로 기재된 납부확인서의 납부금액으로 정산</div>
        <div>· 회사 고지(상용근로자 · 직접노무비 대상): 소속 회사 납부확인서 금액을 현장 투입일만큼 일할 정산 = 사업자 부담분 × 투입일 ÷ 그달 일수 (원 미만 버림)</div>
        {c.기준 !== 'emp' && <div>· 납부확인서 금액은 근로자 + 사업주 부담분의 합이므로 사업자 부담분은 그 2분의 1</div>}
      </div>
      <div className="rk-box bj-box">{붙.map((b, i) => <div key={i}>{i ? '　　　' : '붙임　'}{i + 1}. {b} 1부.</div>)}</div>
      <div className="sn-say">위와 같이 국민건강보험료 등(사업자 부담분)의 정산을 청구합니다.</div>
      <div className="sn-date">{긴날(회.작성)}</div>
      <div className="sn-sign">청구인(하수급인)　　상호 {c.청구인 || '　　　　　　　　'}　　대표자 {c.대표 || '　　　　　　'}　　(인)</div>
      <div className="bj-to-line">{c.받는곳 || '　　　　　　　　　　'}　귀하</div>
      <div className="rk-foot"><span /><span className="rk-kc">K-건설맵 k-conmap.com/tools/boheom-jeongsan</span></div>
    </div>
  )
}
