import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  종류표, 종류찾기, 계상, 설계변경, 항목, 한도, 스마트한도, 칸이름, 줄금액, 계획금액, 달셈, 점검,
  읽기, 쓰기, 빈현장, 예시, 새번호, 수, 원, 버림, 고시, 이번달, 오늘,
} from '../lib/sanan.js'
import { use인쇄 } from '../tools/공정인쇄.js'
import 도구설명 from '../tools/도구설명.jsx'
import 이어쓰기 from '../tools/이어쓰기.jsx'
import { 앞모습두기 } from '../lib/이어쓰기.js'

/**
 * 🦺 /tools/sanan — 산업안전보건관리비 계상기 · 사용내역서 (G112 · 2026-10-01)
 *
 * 소장님: 「예스폼에 또 뭐가 있지??? 새로 만들어야 할 서식은?」 → 「1부터 4까지 만들어 보자」 (③)
 * ■ 탭 넷: ① 계상(별표1 · 관급 비교 · 보건관리자 · 설계변경 별표1의3 · 별표3) ② 사용 계획(항목별 계상액 — 제10조 실행예산)
 *          ③ 사용 내역 적기(항목마다 서식의 칸 그대로) ④ 사용내역서(별지 제1호서식 1~10쪽 — 서식 칸 · 차례 그대로)
 * ■ 근거 · 숫자는 lib/sanan.js 머리말(고시 원문 확인). 인쇄(A4 세로) + 📗 값만 엑셀(사용내역서는 서식 칸 그대로 — lib/격자엑셀.js).
 * ■ 저장: 이 브라우저 + 🔗 코드 + 비밀번호로 서버에 잠가 두면 폰·PC 어디서든 이어 씀(tools/이어쓰기.jsx · G113) · 현장 여러 벌 저장. 창(alert · confirm)을 띄우지 않습니다 — 지우기는 한 번 더 누르기.
 */

const 탭들 = [['calc', '① 계상'], ['plan', '② 사용 계획'], ['use', '③ 사용 내역 적기'], ['paper', '④ 사용내역서']]
const 짧은날 = (s) => { const [y, m, d] = String(s || '').split('-'); return y && m && d ? `${y.slice(2)}.${m}.${d}` : '' }
const 달글 = (ym) => (ym ? `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월` : '')
const 숫자만 = (v) => String(v ?? '').replace(/[^\d]/g, '')
const 소수만 = (v) => String(v ?? '').replace(/[^\d.]/g, '')
const 쉼 = (v) => { const s = 숫자만(v); return s ? Number(s).toLocaleString('ko-KR') : '' }
const 율 = (x) => Number(x).toFixed(2)
const 률글 = (x) => (Number.isFinite(x) ? (Math.round(x * 10000) / 100).toFixed(2) + '%' : '—')

/** 단가 × 수량으로 금액이 저절로 나오는 줄인가 (2 · 3 · 9호) */
const 단가셈 = (r) => 수(r.q) > 0 && ((r.i === 2 && 수(r.ul) + 수(r.um) > 0) || ((r.i === 3 || r.i === 9) && 수(r.u) > 0))
/** 칸 입력 종류 */
const 날칸 = new Set(['d', 'e'])
const 숫칸 = new Set(['q', 'u', 'ul', 'um', 'pu', 'pq', 'amt'])

export default function Sanan() {
  const [st, setSt] = useState(() => 읽기())
  const [저장됨, set저장됨] = useState(true)
  const [탭, set탭] = useState(() => { try { return localStorage.getItem('kcm_sanan_tab') || 'calc' } catch (e) { return 'calc' } })
  const [알림, set알림] = useState('')
  const [묻기, set묻기] = useState('')
  const [고른항목, set고른항목] = useState(1)
  const [모두쪽, set모두쪽] = useState(true)
  const 미리 = useRef(null)
  useEffect(() => { set저장됨(쓰기(st)) }, [st])
  useEffect(() => { document.title = '산업안전보건관리비 계상기 · 사용내역서 | K-건설맵' }, [])
  useEffect(() => { try { localStorage.setItem('kcm_sanan_tab', 탭) } catch (e) { /* */ } }, [탭])
  const c = st.cur
  const 바꿈 = (f) => setSt((s) => ({ ...s, cur: f(s.cur) }))
  const 계칸 = (k, v) => 바꿈((x) => ({ ...x, 계: { ...x.계, [k]: v } }))
  const 정칸 = (k, v) => 바꿈((x) => ({ ...x, 정보: { ...x.정보, [k]: v } }))
  const 조칸 = (k, v) => 바꿈((x) => ({ ...x, 조직: { ...x.조직, [k]: v } }))
  const 변칸 = (k, v) => 바꿈((x) => ({ ...x, 변경: { ...x.변경, [k]: v } }))
  const A = useMemo(() => 계상(c.계), [c.계])
  const 계상액 = 수(c.정보.계상손) > 0 ? 수(c.정보.계상손) : A.금액
  const ym = c.월 || 이번달()
  const P = useMemo(() => 점검(c, ym, 계상액), [c, ym, 계상액])
  const S = P.S
  const 변 = 설계변경(c.변경.전산안비 || A.금액, c.변경.전대상 || A.대상, c.변경.후대상)
  const 쓴항목 = new Set((c.R || []).filter((r) => String(r.d || '').slice(0, 7) === ym).map((r) => r.i))

  const 저장 = () => {
    const 이름 = (c.정보.공사명 || '이름 없는 현장').slice(0, 40)
    setSt((s) => ({ ...s, 모음: [{ id: c.id, 이름, at: Date.now(), data: c }, ...s.모음.filter((x) => x.id !== c.id)].slice(0, 20) }))
    set알림(`«${이름}» 을(를) 이 브라우저에 저장했습니다.`)
  }
  const 불러옴 = (x) => { setSt((s) => ({ ...s, cur: { ...빈현장(), ...x.data } })); set알림(`«${x.이름}» 을(를) 불러왔습니다.`) }

  /* 사용 내역 줄 */
  const 줄더 = (i) => 바꿈((x) => {
    const 기본날 = ym === 이번달() ? 오늘() : `${ym}-01`
    return { ...x, R: [...(x.R || []), { id: 새번호(), i, d: 기본날 }] }
  })
  const 줄칸 = (id, k, v) => 바꿈((x) => ({ ...x, R: x.R.map((r) => (r.id === id ? { ...r, [k]: v } : r)) }))
  const 줄뺌 = (id) => { 바꿈((x) => ({ ...x, R: x.R.filter((r) => r.id !== id) })); set묻기('') }

  const [인쇄중, 인쇄] = use인쇄(`산안비_사용내역서_${ym}`)
  const [계인쇄중, 계인쇄] = use인쇄('산안비_계상')
  const 쪽들 = 항목.filter((h) => 모두쪽 || 쓴항목.has(h.i))

  /* 📗 값만 엑셀 */
  const 계엑셀 = async () => {
    const { 값엑셀받기, 수칸, 굵은칸 } = await import('../lib/값엑셀.js')
    const t = 종류찾기(c.계.종류)
    const rows = [
      ['근거', 고시 + ' 별표1'], ['공사 종류', t.이름], ['대상액 셈', A.방식 === 'total' ? '총공사금액 × 10분의 7 (제4조제1항제3호)' : '재료비(직접 + 간접) + 직접노무비'],
      ['재료비', 수칸(A.재료)], ['직접노무비', 수칸(A.노무)], ['총공사금액', 수칸(A.총액)], ['발주자 제공 재료비 · 완제품', 수칸(A.관급)],
      ['대상액', 수칸(A.대상)], ['적용 구간', A.구간], ['비율(%)', A.율], ['기초액', 수칸(A.기초)],
      ['보건관리자 선임 대상', A.보건 ? `예 ${A.보건까닭 ? '— ' + A.보건까닭 : ''}` : '아니오'],
      [굵은칸('계상액(이상)'), 수칸(A.금액)], ['총공사금액 대비', Number.isFinite(A.총대비) ? 률글(A.총대비) : ''],
    ]
    if (A.관급비교) rows.push(['관급 넣고 셈', 수칸(A.관급비교.넣고.금액)], ['관급 빼고 셈', 수칸(A.관급비교.빼고.금액)], ['빼고 셈 × 1.2', 수칸(A.관급비교.빼고12)], ['고른 값', A.관급비교.고른 === '넣고' ? '넣고 셈(더 작음)' : '빼고 셈 × 1.2(더 작음)'])
    for (const a of A.알림) rows.push(['알림', a])
    const 계획 = 항목.map((h) => [`${h.i}. ${h.이름}`, 수칸(수((c.계획 || {})[h.i])), 계상액 > 0 ? 률글(수((c.계획 || {})[h.i]) / 계상액) : ''])
    계획.push([굵은칸('계'), 수칸(S.합.계획), 계상액 > 0 ? 률글(S.합.계획 / 계상액) : ''])
    const 시트 = [{ name: '계상', head: ['항목', '값'], rows, widths: [28, 60] }, { name: '사용 계획', head: ['항목', '계상액(계획)', '비율'], rows: 계획, widths: [40, 16, 10] }]
    if (변) 시트.push({ name: '설계변경', head: ['항목', '값'], rows: [['변경 전 산안비', 수칸(수(c.변경.전산안비 || A.금액))], ['변경 전 대상액', 수칸(수(c.변경.전대상 || A.대상))], ['변경 후 대상액', 수칸(수(c.변경.후대상))], ['대상액 증감 비율', 률글(변.비율)], ['산안비 증감액', 수칸(변.증감액)], [굵은칸('변경 후 산안비'), 수칸(변.후)]], widths: [24, 20] })
    값엑셀받기(`산안비_계상_${c.정보.공사명 || '공사'}`, 시트, { 주소: '/tools/sanan' })
  }
  const 서식엑셀 = async () => {
    const [{ 종이를격자, 격자책 }, { 바이트받기 }] = await Promise.all([import('../lib/격자엑셀.js'), import('../lib/값엑셀.js')])
    const els = 미리.current ? [...미리.current.querySelectorAll('.rk-paper')] : []
    if (!els.length) { set알림('미리보기를 찾지 못했습니다 — 다시 눌러 주십시오.'); return }
    const 장 = els.map((el, i) => ({ 이름: i === 0 ? '사용내역서' : (el.dataset.name || `${i}쪽`), ...종이를격자(el, 3.7), 가로: false }))
    바이트받기(`산안비_사용내역서_${ym}_${c.정보.공사명 || '공사'}`, 격자책(장))
  }

  const 종이들 = (
    <>
      <총괄쪽 c={c} ym={ym} S={S} 계상액={계상액} />
      {쪽들.map((h) => <항목쪽 key={h.i} h={h} c={c} ym={ym} S={S} />)}
    </>
  )

  return (
    <div className="wrap gj sn">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🦺 산업안전보건관리비 계상기 · 사용내역서</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          공사 종류와 <b>재료비 · 직접노무비</b>(모르면 총공사금액)를 넣으면 고시 별표1로 <b>계상액</b>이 나옵니다.
          관급자재 비교 · 보건관리자 선임 대상 · 설계변경 조정 · 공정률별 사용 기준까지 셉니다.
          쓴 돈을 항목별로 적으면 <b>별지 제1호서식 사용내역서</b>(총괄 + 항목별 9쪽)가 서식 칸 그대로 채워집니다.
        </p>
        <div className="nm-badges">
          <span>근거: {고시}</span>
          <span>회원가입 없음 · 무료</span>
          <span>💾 이 브라우저에 저장 · 🔗 코드로 폰·PC 이어 쓰기 {저장됨 ? '' : <b className="nm-warn">— 지금 저장이 막혀 있습니다(사생활 보호 창 등)</b>}</span>
        </div>
        <이어쓰기 ns="sn" 이름="산안비 계상기" 파일="산안비" st={st} setSt={setSt} 읽기={읽기} 쓰기={쓰기} />
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={저장}>💾 이 현장 저장</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setSt((s) => ({ ...s, cur: 빈현장() })); set알림('새 현장을 시작했습니다.') }}>＋ 새 현장</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { 앞모습두기('sn', st); setSt((s) => ({ ...s, cur: 예시() })); set알림('예시를 채웠습니다 — 지어낸 현장(토목 · 대상액 28.3억 · 석 달 사용)입니다. 전에 적던 것은 «🔗 이어 쓰기 → 💾 백업 · 더 보기 → ↩ 되돌리기» 로 살립니다.') }}>🧪 예시로 해 보기</button>
        </div>
        {알림 && <div className="note sm" role="status" style={{ marginTop: 8 }}>{알림}</div>}
        {st.모음.length > 0 && (
          <div className="gj-saved">
            <div className="fm-ctl-k" style={{ marginBottom: 4 }}>저장한 현장 {st.모음.length}</div>
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

      <div className="eq-tabs" role="tablist">
        {탭들.map(([k, t]) => <button key={k} type="button" role="tab" aria-selected={탭 === k} className={탭 === k ? 'on' : ''} onClick={() => set탭(k)}>{t}</button>)}
      </div>

      {탭 === 'calc' && (
        <>
          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>① 공사 종류 · 대상액</div>
            <div className="fm-ctl-row" role="group" aria-label="공사 종류" style={{ marginTop: 10 }}>
              {종류표.map((t) => <button key={t.k} type="button" className={'fm-chip' + (c.계.종류 === t.k ? ' on' : '')} aria-pressed={c.계.종류 === t.k} onClick={() => 바꿈((x) => ({ ...x, 계: { ...x.계, 종류: t.k, 토목업: null } }))}>{t.이름}</button>)}
            </div>
            <div className="note sm" style={{ marginTop: 6 }}><b>{종류찾기(c.계.종류).이름}</b> — {종류찾기(c.계.종류).예} (별표5). 한 현장에 종류가 둘 이상이면 <b>공사금액이 가장 큰 종류</b>로 셉니다(제4조제4항).</div>
            <div className="fm-ctl-row" role="group" aria-label="대상액 셈" style={{ marginTop: 10 }}>
              <button type="button" className={'fm-chip' + (c.계.방식 !== 'total' ? ' on' : '')} onClick={() => 계칸('방식', 'detail')}>원가계산서가 있음 — 재료비 · 직접노무비</button>
              <button type="button" className={'fm-chip' + (c.계.방식 === 'total' ? ' on' : '')} onClick={() => 계칸('방식', 'total')}>총공사금액만 앎 — × 10분의 7</button>
            </div>
            <div className="gj-form">
              {c.계.방식 !== 'total' && <>
                <label>재료비 (직접 + 간접, 원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.계.재료)} onChange={(e) => 계칸('재료', 숫자만(e.target.value))} placeholder="예: 1,650,000,000" /></label>
                <label>직접노무비 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.계.노무)} onChange={(e) => 계칸('노무', 숫자만(e.target.value))} placeholder="예: 1,180,000,000" /></label>
              </>}
              <label>총공사금액 (원){c.계.방식 === 'total' ? '' : ' — 보건관리자 · 적용 범위 판단용'}<input className="inp gj-num" inputMode="numeric" value={쉼(c.계.총액)} onChange={(e) => 계칸('총액', 숫자만(e.target.value))} placeholder="예: 4,300,000,000" /></label>
              <label>발주자가 주는 재료비 · 완제품 가액 (선택, 원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.계.관급)} onChange={(e) => 계칸('관급', 숫자만(e.target.value))} placeholder="관급자재가 있으면" /></label>
            </div>
            <div className="sn-boh">
              <span className="fm-ctl-k">보건관리자 선임 대상</span>
              <select className="inp" value={c.계.보건손 || ''} onChange={(e) => 계칸('보건손', e.target.value)} aria-label="보건관리자 선임 대상">
                <option value="">저절로 — {A.보건 && !c.계.보건손 ? '대상' : '아님'}</option>
                <option value="y">대상으로 셈</option>
                <option value="n">대상 아님으로 셈</option>
              </select>
              <label className="gj-check"><input type="checkbox" checked={!!c.계.상시600} onChange={(e) => 계칸('상시600', e.target.checked)} /> 상시 근로자 600명 이상</label>
              <label className="gj-check"><input type="checkbox" checked={!!A.토목업} onChange={(e) => 계칸('토목업', e.target.checked)} /> 토목공사업 공사(기준 1천억)</label>
              <span className="muted" style={{ fontSize: 12 }}>시행령 별표5 — 공사금액 800억(토목공사업 1천억) 이상 또는 상시 600명 이상</span>
            </div>
          </div>

          <div className="card sn-res">
            <div className="sn-amt">
              <span>계상액</span>
              <b>{원(A.금액)}원</b>
              <span className="muted">이상</span>
            </div>
            <div className="sn-how">
              대상액 <b>{원(A.대상)}원</b>{A.방식 === 'total' ? ` (총공사금액 ${원(A.총액)} × 7/10)` : ''} × <b>{율(A.율)}%</b>{A.기초 ? <> + 기초액 <b>{원(A.기초)}원</b></> : ''}
              <span className="muted"> — {A.t.이름} · {A.구간}{Number.isFinite(A.총대비) ? ` · 총공사금액의 ${률글(A.총대비)}` : ''}</span>
            </div>
            {A.관급비교 && (
              <div className="tp-scroll">
                <table className="tbl sn-t">
                  <thead><tr><th>관급자재(제4조제1항 단서)</th><th>대상액</th><th>산안비</th></tr></thead>
                  <tbody>
                    <tr className={A.관급비교.고른 === '넣고' ? 'on' : ''}><td>관급 «넣고» 셈</td><td className="r">{원(A.관급비교.넣고.대상액)}</td><td className="r">{원(A.관급비교.넣고.금액)}</td></tr>
                    <tr><td>관급 «빼고» 셈</td><td className="r">{원(A.관급비교.빼고.대상액)}</td><td className="r">{원(A.관급비교.빼고.금액)}</td></tr>
                    <tr className={A.관급비교.고른 !== '넣고' ? 'on' : ''}><td>«빼고» 셈 × 1.2</td><td /><td className="r">{원(A.관급비교.빼고12)}</td></tr>
                  </tbody>
                </table>
                <div className="muted" style={{ fontSize: 12 }}>두 값 가운데 <b>작은 값 이상</b>으로 계상합니다 — 굵은 줄이 고른 값입니다.</div>
              </div>
            )}
            {A.알림.length > 0 && <ul className="sn-al">{A.알림.map((a, i) => <li key={i}>{a}</li>)}</ul>}
            <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={계인쇄}>🖨 계상 내역 인쇄</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={계엑셀}>📗 값만 엑셀</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set탭('plan')}>② 사용 계획 세우기 →</button>
            </div>
          </div>

          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>📋 별표1 계상기준표</div>
            <div className="tp-scroll">
              <table className="tbl sn-t">
                <thead><tr><th>공사 종류</th><th>5억 미만</th><th>5억~50억 비율</th><th>기초액</th><th>50억 이상</th><th>보건관리자 선임 대상</th></tr></thead>
                <tbody>{종류표.map((t) => {
                  const 이줄 = t.k === c.계.종류
                  const 칸 = (key) => (이줄 && ((key === 'h' && A.보건) || (!A.보건 && ((key === 'a' && A.대상 < 5e8) || (key === 'b' && A.대상 >= 5e8 && A.대상 < 5e9) || (key === 'c' && A.대상 >= 5e9))))) ? 'on' : ''
                  return <tr key={t.k} className={이줄 ? 'sel' : ''}><td>{t.이름}</td><td className={'r ' + 칸('a')}>{율(t.a)}%</td><td className={'r ' + 칸('b')}>{율(t.b)}%</td><td className={'r ' + 칸('b')}>{원(t.기초)}원</td><td className={'r ' + 칸('c')}>{율(t.c)}%</td><td className={'r ' + 칸('h')}>{율(t.h)}%</td></tr>
                })}</tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>🔁 설계변경 조정 (별표1의3)</div>
            <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>변경 후 산안비 = 변경 전 산안비 + 변경 전 산안비 × 대상액 증감 비율. 대상액은 <b>설계변경 전 · 후의 도급계약서상 대상액</b>입니다.</p>
            <div className="gj-form">
              <label>변경 전 산안비 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.변경.전산안비)} placeholder={원(A.금액)} onChange={(e) => 변칸('전산안비', 숫자만(e.target.value))} /></label>
              <label>변경 전 대상액 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.변경.전대상)} placeholder={원(A.대상)} onChange={(e) => 변칸('전대상', 숫자만(e.target.value))} /></label>
              <label>변경 후 대상액 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.변경.후대상)} onChange={(e) => 변칸('후대상', 숫자만(e.target.value))} placeholder="변경 계약서의 재료비 + 직접노무비" /></label>
            </div>
            {변 ? (
              <div className="sn-how" style={{ marginTop: 8 }}>
                증감 비율 <b>{(변.비율 * 100).toFixed(2)}%</b> → 증감액 <b>{변.증감액 > 0 ? '+' : ''}{원(변.증감액)}원</b> → 변경 후 산안비 <b>{원(변.후)}원</b>
                {수(c.계.총액) >= 8e10 && <div className="nm-warn" style={{ fontSize: 12.5 }}>공사금액이 800억 원 이상으로 늘었으면 늘어난 대상액으로 <b>다시 계상</b>합니다(제4조제5항 단서).</div>}
              </div>
            ) : <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>변경 후 대상액을 넣으면 셉니다(빈 칸은 위 계상 값을 씁니다).</div>}
          </div>

          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>📈 공정률에 따른 사용 기준 (별표3)</div>
            <div className="tp-scroll">
              <table className="tbl sn-t">
                <thead><tr><th>기성 공정률</th><th>50% 이상 70% 미만</th><th>70% 이상 90% 미만</th><th>90% 이상</th></tr></thead>
                <tbody><tr><td>사용 기준</td><td className="c">50% 이상</td><td className="c">70% 이상</td><td className="c">90% 이상</td></tr>
                  {계상액 > 0 && <tr><td>이 현장 최소 사용액</td><td className="r">{원(버림(계상액 * 0.5))}</td><td className="r">{원(버림(계상액 * 0.7))}</td><td className="r">{원(버림(계상액 * 0.9))}</td></tr>}</tbody>
              </table>
            </div>
            <div className="muted" style={{ fontSize: 12.5 }}>발주자가 공사 특성에 따라 달리 정할 수 있습니다(제7조제3항). 6개월마다 1회 이상 발주자 · 감리자 확인(제9조).</div>
          </div>
        </>
      )}

      {탭 === 'plan' && (
        <div className="card">
          <div className="detail-h" style={{ margin: 0 }}>② 사용 계획 — 항목별 계상액(계획)</div>
          <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 8px' }}>
            공사금액 4천만 원 이상이면 실행예산에 산안비를 <b>계상된 총액 이상</b>으로 따로 편성합니다(제10조). 여기 적은 금액이 사용내역서 항목별 쪽의 «계상액(계획)» 칸에 들어갑니다.
          </p>
          <div className="sn-sumbar">
            <span>계상된 산안비 <b>{원(계상액)}원</b>{수(c.정보.계상손) > 0 && <span className="muted"> (직접 적은 값)</span>}</span>
            <span>계획 합 <b className={S.합.계획 < 계상액 ? 'nm-warn' : ''}>{원(S.합.계획)}원</b></span>
            <span>{S.합.계획 >= 계상액 ? '✓ 총액 이상' : `${원(계상액 - S.합.계획)}원 더 편성`}</span>
          </div>
          <div className="tp-scroll">
            <table className="tbl sn-t sn-plan">
              <thead><tr><th>항목</th><th>계상액(계획)</th><th>비율</th><th className="gj-d">한도 · 쓸 수 있는 것</th></tr></thead>
              <tbody>
                {항목.map((h) => {
                  const v = 수((c.계획 || {})[h.i])
                  const 한 = 한도[h.i]
                  const 넘 = 한 && v > 계상액 * 한.비
                  return (
                    <tr key={h.i}>
                      <td><b>{h.i}. {h.이름}</b><div className="gj-m gj-small">{h.도움}</div></td>
                      <td><input className="inp gj-in gj-num" inputMode="numeric" value={쉼((c.계획 || {})[h.i])} onChange={(e) => 바꿈((x) => ({ ...x, 계획: { ...(x.계획 || {}), [h.i]: 숫자만(e.target.value) } }))} aria-label={`${h.이름} 계상액(계획)`} /></td>
                      <td className={'r nw' + (넘 ? ' nm-warn' : '')}>{계상액 > 0 && v ? 률글(v / 계상액) : ''}</td>
                      <td className="gj-small gj-d">{한 ? <b className={넘 ? 'nm-warn' : ''}>총액의 {한.글} 이내 · </b> : h.i === 2 ? <b>스마트 안전장비는 총액의 {스마트한도.글} 이내 · </b> : null}{h.도움}</td>
                    </tr>
                  )
                })}
                <tr className="sum"><td>계</td><td className="r">{원(S.합.계획)}</td><td className="r">{계상액 > 0 ? 률글(S.합.계획 / 계상액) : ''}</td><td className="gj-d" /></tr>
              </tbody>
            </table>
          </div>
          <div className="note sm" style={{ marginTop: 8 }}>
            쓸 수 없는 것(제7조제2항): 예정가격작성기준의 다른 비용 · 다른 법령의 의무 이행 비용 · 재해예방 외 목적이 있는 시설·장비 · 환경관리 · 민원 · 수방대비 등 다른 목적이 섞인 것.
          </div>
        </div>
      )}

      {탭 === 'use' && (
        <>
          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>③ 사용 내역 적기</div>
            <div className="sn-month">
              <label>달<input className="inp" type="month" value={ym} onChange={(e) => e.target.value && 바꿈((x) => ({ ...x, 월: e.target.value }))} /></label>
              <label>이 달 누계 공정률(%)<input className="inp gj-num" inputMode="decimal" value={(c.률 || {})[ym] ?? ''} onChange={(e) => 바꿈((x) => ({ ...x, 률: { ...(x.률 || {}), [ym]: 소수만(e.target.value) } }))} placeholder="기성 공정률" /></label>
              <span className="muted" style={{ fontSize: 12.5 }}>이 달 사용 <b>{원(S.합.금)}원</b> · 누계 <b>{원(S.합.누)}원</b>{계상액 > 0 ? ` (계상액의 ${률글(S.합.누 / 계상액)})` : ''}</span>
            </div>
            {P.글.length > 0 && <ul className="sn-al">{P.글.map((x, i) => <li key={i} className={x.나쁨 ? 'nm-warn' : ''}>{x.t}</li>)}</ul>}
            <div className="fm-ctl-row" role="group" aria-label="항목" style={{ marginTop: 10 }}>
              {항목.map((h) => {
                const n = (c.R || []).filter((r) => r.i === h.i && String(r.d || '').slice(0, 7) === ym).length
                return <button key={h.i} type="button" className={'fm-chip' + (고른항목 === h.i ? ' on' : '')} onClick={() => set고른항목(h.i)}>{h.i}. {h.짧게}{n ? <span className="n"> {n}</span> : null}</button>
              })}
            </div>
          </div>
          <내역표 h={항목[고른항목 - 1]} c={c} ym={ym} 줄더={줄더} 줄칸={줄칸} 줄뺌={줄뺌} 묻기={묻기} set묻기={set묻기} 조칸={조칸} />
        </>
      )}

      {탭 === 'paper' && (
        <>
          <div className="card">
            <div className="detail-h" style={{ margin: 0 }}>④ 사용내역서 (별지 제1호서식) — 머리 칸</div>
            <div className="gj-form">
              <label>건설업체명<input className="inp" value={c.정보.업체} maxLength={40} onChange={(e) => 정칸('업체', e.target.value)} /></label>
              <label>공사명<input className="inp" value={c.정보.공사명} maxLength={80} onChange={(e) => 정칸('공사명', e.target.value)} /></label>
              <label>소재지<input className="inp" value={c.정보.소재지} maxLength={80} onChange={(e) => 정칸('소재지', e.target.value)} /></label>
              <label>대표자<input className="inp" value={c.정보.대표} maxLength={20} onChange={(e) => 정칸('대표', e.target.value)} /></label>
              <label>공사금액 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.정보.공사금액)} placeholder={c.계.총액 ? 쉼(c.계.총액) : ''} onChange={(e) => 정칸('공사금액', 숫자만(e.target.value))} /></label>
              <label>발주자<input className="inp" value={c.정보.발주자} maxLength={40} onChange={(e) => 정칸('발주자', e.target.value)} /></label>
              <label>착공<input className="inp" type="date" value={c.정보.착공} onChange={(e) => 정칸('착공', e.target.value)} /></label>
              <label>준공<input className="inp" type="date" value={c.정보.준공} onChange={(e) => 정칸('준공', e.target.value)} /></label>
              <label>계상된 산안비 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.정보.계상손)} placeholder={`${원(A.금액)} (① 계상 값)`} onChange={(e) => 정칸('계상손', 숫자만(e.target.value))} /></label>
              <label>작성자 직책<input className="inp" value={c.정보.작성직} maxLength={20} onChange={(e) => 정칸('작성직', e.target.value)} /></label>
              <label>작성자 성명<input className="inp" value={c.정보.작성} maxLength={20} onChange={(e) => 정칸('작성', e.target.value)} /></label>
              <label>확인자 직책<input className="inp" value={c.정보.확인직} maxLength={20} onChange={(e) => 정칸('확인직', e.target.value)} /></label>
              <label>확인자 성명<input className="inp" value={c.정보.확인} maxLength={20} onChange={(e) => 정칸('확인', e.target.value)} /></label>
            </div>
            <div className="sn-month" style={{ marginTop: 10 }}>
              <label>달<input className="inp" type="month" value={ym} onChange={(e) => e.target.value && 바꿈((x) => ({ ...x, 월: e.target.value }))} /></label>
              <label>누계 공정률(%)<input className="inp gj-num" inputMode="decimal" value={(c.률 || {})[ym] ?? ''} onChange={(e) => 바꿈((x) => ({ ...x, 률: { ...(x.률 || {}), [ym]: 소수만(e.target.value) } }))} /></label>
              <label className="gj-check"><input type="checkbox" checked={!모두쪽} onChange={(e) => set모두쪽(!e.target.checked)} /> 이 달에 쓴 항목 쪽만</label>
            </div>
            <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄}>🖨 사용내역서 인쇄 (A4 · {1 + 쪽들.length}쪽)</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={서식엑셀}>📗 엑셀(값만 · 서식 칸 그대로)</button>
            </div>
          </div>
          <div className="rk-preview sn-preview" ref={미리}>{종이들}</div>
        </>
      )}

      <div className="card">
        <p className="cp" style={{ margin: 0, fontSize: 13 }}>
          엑셀 빈 서식은 <Link to="/forms/anjeonbi-naeyeok">산업안전보건관리비 사용내역서</Link> · <Link to="/forms/anjeonbi-gyehoek">사용계획서</Link>,
          원가계산서 전체는 <Link to="/tools/gyeonjeok">공사 견적서 · 원가계산서</Link>, A값(법정경비)은 <Link to="/tools/a-value">A값 계산기</Link>입니다.
          비율 · 금액은 고시 원문(law.go.kr)으로 확인했지만, 발주기관이 따로 정한 기준이 있으면 그것을 따르십시오.
        </p>
      </div>

      <도구설명 k="sanan" />
      {인쇄중 && createPortal(<div id="gp-인쇄">{[<총괄쪽 key="0" c={c} ym={ym} S={S} 계상액={계상액} />, ...쪽들.map((h) => <항목쪽 key={h.i} h={h} c={c} ym={ym} S={S} />)].map((x, i) => <div className="sn-쪽" key={i}>{x}</div>)}</div>, document.body)}
      {계인쇄중 && createPortal(<div id="gp-인쇄"><div className="sn-쪽"><계상종이 c={c} A={A} 변={변} 계상액={계상액} S={S} /></div></div>, document.body)}
    </div>
  )
}

/* ── ③ 항목 하나의 입력 표 ─────────────────── */
function 내역표({ h, c, ym, 줄더, 줄칸, 줄뺌, 묻기, set묻기, 조칸 }) {
  const [다보기, set다보기] = useState(false)
  const 줄들 = (c.R || []).filter((r) => r.i === h.i && (다보기 || String(r.d || '').slice(0, 7) === ym || !r.d)).sort((a, b) => String(a.d || '9').localeCompare(String(b.d || '9')))
  const 칸들 = h.칸
  return (
    <div className="card">
      <div className="detail-h" style={{ margin: 0 }}>{h.i}. {h.이름}</div>
      <div className="muted" style={{ fontSize: 12.5, margin: '4px 0 8px' }}>{h.도움}</div>
      {h.i === 8 && (
        <div className="gj-form" style={{ marginBottom: 10 }}>
          <label>시공능력 평가순위<input className="inp" value={c.조직.순위} maxLength={20} onChange={(e) => 조칸('순위', e.target.value)} /></label>
          <label>안전보건 조직명<input className="inp" value={c.조직.조직명} maxLength={30} onChange={(e) => 조칸('조직명', e.target.value)} /></label>
          <label>직책<input className="inp" value={c.조직.직책} maxLength={20} onChange={(e) => 조칸('직책', e.target.value)} /></label>
          <label>인원 수<input className="inp" inputMode="numeric" value={c.조직.인원} maxLength={6} onChange={(e) => 조칸('인원', 숫자만(e.target.value))} /></label>
          <label>산안비 계상총액 (원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.조직.계상총액)} onChange={(e) => 조칸('계상총액', 숫자만(e.target.value))} /></label>
          <label>본사 임금 등 계상액(계획) (원)<input className="inp gj-num" inputMode="numeric" value={쉼(c.조직.본사계획)} onChange={(e) => 조칸('본사계획', 숫자만(e.target.value))} /></label>
        </div>
      )}
      <div className="tp-scroll">
        <table className="tbl gj-rows sn-in">
          <thead><tr>{칸들.map((k) => <th key={k}>{칸이름(h.i, k)}{k === 'e' && h.i === 9 ? ' · 갈래' : ''}</th>)}{h.i === 2 && <th>스마트</th>}<th>금액</th><th /></tr></thead>
          <tbody>
            {줄들.length === 0 && <tr><td colSpan={칸들.length + 3} className="muted c">{달글(ym)}에 적은 것이 없습니다 — «＋ 줄 더하기» 를 누르십시오.</td></tr>}
            {줄들.map((r) => (
              <tr key={r.id}>
                {칸들.map((k) => (
                  <td key={k}>
                    {날칸.has(k)
                      ? <div className="sn-dk"><input className="inp gj-in" type="date" value={r[k] || ''} onChange={(e) => 줄칸(r.id, k, e.target.value)} aria-label={칸이름(h.i, k)} />
                        {k === 'e' && h.i === 9 && <select className="inp gj-in" value={r.ek || 'r'} onChange={(e) => 줄칸(r.id, 'ek', e.target.value)} aria-label="결정 갈래"><option value="r">위험성평가 등</option><option value="n">노사협의 등</option></select>}</div>
                      : k === 'amt' && 단가셈(r)
                        ? <span className="sn-auto" title="단가 × 수량">{원(줄금액(r))}<em>저절로</em></span>
                        : 숫칸.has(k)
                        ? <input className="inp gj-in gj-num" inputMode="numeric" value={k === 'q' || k === 'pq' ? (r[k] ?? '') : 쉼(r[k])} onChange={(e) => 줄칸(r.id, k, k === 'q' || k === 'pq' ? 소수만(e.target.value) : 숫자만(e.target.value))} aria-label={칸이름(h.i, k)}
                          placeholder={k === 'amt' && ((h.i === 2) || h.i === 3 || h.i === 9) ? '또는 단가×수량' : ''} />
                        : <input className={'inp gj-in sn-tx' + (k === 'a' ? ' sn-a' : '')} value={r[k] || ''} maxLength={60} onChange={(e) => 줄칸(r.id, k, e.target.value)} aria-label={칸이름(h.i, k)} />}
                  </td>
                ))}
                {h.i === 2 && <td className="c"><input type="checkbox" checked={!!r.s} onChange={(e) => 줄칸(r.id, 's', e.target.checked)} aria-label="스마트 안전장비" /></td>}
                <td className="r nw"><b>{원(줄금액(r))}</b>{(h.i === 3 || h.i === 9) && 계획금액(r) ? <div className="gj-small">계획 {원(계획금액(r))}</div> : null}</td>
                <td className="nw">{묻기 === r.id
                  ? <><button type="button" className="tp-x nm-warn" onClick={() => 줄뺌(r.id)}>정말</button><button type="button" className="tp-x" onClick={() => set묻기('')}>그대로</button></>
                  : <button type="button" className="tp-x" onClick={() => set묻기(r.id)} aria-label="이 줄 지우기">✕</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 줄더(h.i)}>＋ 줄 더하기</button>
        <label className="gj-check" style={{ fontSize: 12.5 }}><input type="checkbox" checked={다보기} onChange={(e) => set다보기(e.target.checked)} /> 다른 달 것도 보기</label>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>{h.i === 2 ? '단가(노무비 · 자재비)와 수량을 적으면 금액이 저절로 — 금액만 적어도 됩니다. ' : (h.i === 3 || h.i === 9) ? '소요 비용 단가와 수량을 적으면 금액이 저절로 — 금액만 적어도 됩니다. ' : ''}날짜가 든 달의 사용내역서에 들어갑니다.</div>
    </div>
  )
}

/* ── ④ 종이 — 별지 제1호서식 ───────────────────────────────────────────────
 * 세로줄 자리는 고시 별지 PDF(law.go.kr)의 선 좌표(pt)를 그대로 옮겼습니다(2026-10-01 소장님 「항목별사용내역, 세로칸줄이 잘못 됐어」).
 *   xs = 그 쪽의 세로줄 x 좌표 전부(표 머리 · 몸 · 아래 «계» 칸의 줄을 모두 모음) → 칸마다 폭(<col data-w>)이 원본 비율 그대로.
 *   몸(적는 칸)은 원본처럼 가로줄 없이 세로줄만(class nb) · 아래 «계» 칸 = 계상액(계획) · 전월까지 누계(A) · 금월(B) · 누계(A+B).
 *   엑셀도 같은 폭 · 같은 줄(lib/격자엑셀.js 가 data-w · nb 를 읽음). */
const C = ({ cs = 1, rs = 1, cl = '', n, children }) => (
  <td className={'rk-c ' + cl} colSpan={cs} rowSpan={rs} data-n={n === undefined || n === null || n === '' ? undefined : n}>{children}</td>
)
const N = ({ v, cs, cl = '' }) => <C cs={cs} cl={'r ' + cl} n={v || v === 0 ? Math.round(v) : ''}>{v || v === 0 ? 원(v) : ''}</C>
/** 세로줄 좌표 → colgroup (화면은 % 폭, 엑셀은 data-w 글자 폭 — A4 세로 한 장 너비 ≈ 92자) */
function 열(xs) {
  const 전체 = xs[xs.length - 1] - xs[0]
  return <colgroup>{xs.slice(1).map((x, i) => { const w = x - xs[i]; return <col key={i} data-w={Math.round(w / 전체 * 92 * 100) / 100} style={{ width: (w / 전체 * 100).toFixed(3) + '%' }} /> })}</colgroup>
}
const 칸폭 = (xs) => (a, b2) => { const i = xs.indexOf(a), j = xs.indexOf(b2); if (i < 0 || j < 0 || j <= i) throw new Error(`좌표 ${a}~${b2}`); return j - i }

const 총xs = [71, 153, 288, 370, 399, 524]
function 총괄쪽({ c, ym, S, 계상액 }) {
  const I = c.정보
  const 금액 = 수(I.공사금액) || 수(c.계.총액)
  const 률 = (c.률 || {})[ym]
  const k = 칸폭(총xs)
  const [y, m] = ym.split('-')
  const 끝 = new Date(Number(y), Number(m), 0).getDate()
  return (
    <div className="rk-paper port sn-paper sn-frame" data-name="사용내역서">
      <div className="rk-top sm">【별지 제1호서식】</div>
      <div className="rk-bigttl">산업안전보건관리비 사용내역서</div>
      <table className="rk-t">
        {열(총xs)}
        <tbody>
          <tr><C cs={k(71, 153)} cl="hd">건설업체명</C><C cs={k(153, 288)} cl="l">{I.업체}</C><C cs={k(288, 370)} cl="hd">공 사 명</C><C cs={k(370, 524)} cl="l">{I.공사명}</C></tr>
          <tr><C cs={k(71, 153)} cl="hd">소 재 지</C><C cs={k(153, 288)} cl="l">{I.소재지}</C><C cs={k(288, 370)} cl="hd">대 표 자</C><C cs={k(370, 524)} cl="l">{I.대표}</C></tr>
          <tr><C cs={k(71, 153)} cl="hd">공 사 금 액</C><C cs={k(153, 288)} cl="r" n={금액 || ''}>{금액 ? 원(금액) + ' 원' : '원'}</C><C cs={k(288, 370)} cl="hd">공 사 기 간</C><C cs={k(370, 524)}>{짧은날(I.착공)} ～ {짧은날(I.준공)}</C></tr>
          <tr><C cs={k(71, 153)} cl="hd">발 주 자</C><C cs={k(153, 288)} cl="l">{I.발주자}</C><C cs={k(288, 370)} cl="hd">누계공정률</C><C cs={k(370, 524)} cl="r">{률 !== undefined && 률 !== '' ? 률 + ' %' : '%'}</C></tr>
          <tr><C cs={k(71, 153)} cl="hd">계 상 된<br />산업안전보건관리비</C><C cs={k(153, 524)} cl="r" n={계상액 || ''}>{계상액 ? 원(계상액) + ' 원' : '원'}</C></tr>
          <tr><C cs={k(71, 524)} cl="hd">사 용 금 액</C></tr>
          <tr><C cs={k(71, 288)} cl="hd">항 목</C><C cs={k(288, 399)} cl="hd">( {Number(m)} )월 사용금액</C><C cs={k(399, 524)} cl="hd">누계 사용금액</C></tr>
          <tr><C cs={k(71, 288)} cl="hd">계</C><N cs={k(288, 399)} v={S.합.금} cl="b" /><N cs={k(399, 524)} v={S.합.누} cl="b" /></tr>
          {S.줄.map((x) => <tr key={x.i}><C cs={k(71, 288)} cl="l">{x.i}. {x.이름}</C><N cs={k(288, 399)} v={x.금 || ''} /><N cs={k(399, 524)} v={x.누 || ''} /></tr>)}
        </tbody>
      </table>
      <div className="sn-say">「건설업 산업안전보건관리비 계상 및 사용기준」 제10조제1항에 따라 위와 같이 사용내역서를 작성하였습니다.</div>
      <div className="sn-date">{y}년　{Number(m)}월　{끝}일</div>
      <div className="sn-sign">작 성 자　　직책 {I.작성직 || '　　　　'}　　성명 {I.작성 || '　　　　　　'}　　(서명 또는 인)</div>
      <div className="sn-sign">확 인 자　　직책 {I.확인직 || '　　　　'}　　성명 {I.확인 || '　　　　　　'}　　(서명 또는 인)</div>
      <div className="rk-foot"><span className="rk-kc">K-건설맵 · 고시 {고시}</span><span>210㎜×297㎜[일반용지 60g/㎡(재활용품)]</span></div>
    </div>
  )
}

/**
 * 항목별 쪽 — 원본 별지 2~10쪽의 세로줄 좌표(pt)
 *   head: 머리 줄들 [글, x1, x2, rowspan] · body: [열쇠, x1, x2, 꼴(날 · 금 · 수 · 글)] · foot: «계» 칸 [x1, x2] + 넷 [[x1, x2] × 4]
 */
const 쪽틀 = {
  1: { xs: [71, 122, 180, 228, 277, 337, 394, 471, 525],
    head: [[['구 분', 71, 122], ['소 속', 122, 180], ['성 명', 180, 228], ['선임일', 228, 277], ['지급금액', 277, 337], ['지급일', 337, 394], ['지급 내역', 394, 471], ['비 고', 471, 525]]],
    body: [['a', 71, 122], ['b', 122, 180], ['c', 180, 228], ['e', 228, 277, '날'], ['amt', 277, 337, '금'], ['d', 337, 394, '날'], ['p', 394, 471], ['note', 471, 525]],
    foot: [[71, 277], [277, 337], [337, 394], [394, 471], [471, 525]] },
  2: { xs: [68, 131, 174, 214, 255, 297, 340, 382, 435, 487, 522],
    head: [[['구 분', 68, 131, 2], ['사용일', 131, 174, 2], ['단위', 174, 214, 2], ['수량', 214, 255, 2], ['단 가', 255, 382], ['사용금액', 382, 435, 2], ['지급내역', 435, 487, 2], ['비고', 487, 522, 2]],
      [['노무비', 255, 297], ['자재비', 297, 340], ['계', 340, 382]]],
    body: [['a', 68, 131], ['d', 131, 174, '날'], ['c', 174, 214], ['q', 214, 255, '수'], ['ul', 255, 297, '금'], ['um', 297, 340, '금'], ['uu', 340, 382, '금'], ['amt', 382, 435, '금'], ['p', 435, 487], ['note', 487, 522]],
    foot: [[68, 174], [174, 255], [255, 340], [340, 435], [435, 522]] },
  3: { xs: [65, 117, 155, 194, 234, 286, 325, 362, 405, 453, 496, 531],
    head: [[['구 분', 65, 117, 2], ['계 획', 117, 234], ['사용일', 234, 286, 2], ['소요 비용', 286, 405], ['지급내역', 405, 496, 2], ['비고', 496, 531, 2]],
      [['단가', 117, 155], ['수량', 155, 194], ['금액', 194, 234], ['단가', 286, 325], ['수량', 325, 362], ['금액', 362, 405]]],
    body: [['a', 65, 117], ['pu', 117, 155, '금'], ['pq', 155, 194, '수'], ['pa', 194, 234, '금'], ['d', 234, 286, '날'], ['u', 286, 325, '금'], ['q', 325, 362, '수'], ['amt', 362, 405, '금'], ['p', 405, 496], ['note', 496, 531]],
    foot: [[65, 194], [194, 286], [286, 362], [362, 453], [453, 531]] },
  4: { xs: [68, 142, 208, 260, 325, 385, 462, 525],
    head: [[['구 분', 68, 142], ['진단기관\n(검사기관)', 142, 208], ['사용일', 208, 260], ['소요비용', 260, 325], ['지급 내역', 325, 462], ['비 고', 462, 525]]],
    body: [['a', 68, 142], ['b', 142, 208], ['d', 208, 260, '날'], ['amt', 260, 325, '금'], ['p', 325, 462], ['note', 462, 525]],
    foot: [[68, 260], [260, 325], [325, 385], [385, 462], [462, 525]] },
  5: { xs: [71, 148, 222, 294, 368, 465, 522],
    head: [[['교육과목', 71, 148], ['교육주관', 148, 222], ['교육일', 222, 294], ['참가인원', 294, 368], ['소요 경비', 368, 465], ['비 고', 465, 522]]],
    body: [['a', 71, 148], ['b', 148, 222], ['d', 222, 294, '날'], ['q', 294, 368, '수'], ['amt', 368, 465, '금'], ['note', 465, 522]],
    foot: [[71, 222], [222, 294], [294, 368], [368, 465], [465, 522]] },
  6: { xs: [71, 142, 216, 288, 362, 459, 519],
    head: [[['구 분', 71, 142], ['사용일', 142, 216], ['진단병원', 216, 288], ['참가인원', 288, 362], ['소요 경비', 362, 459], ['비 고', 459, 519]]],
    body: [['a', 71, 142], ['d', 142, 216, '날'], ['b', 216, 288], ['q', 288, 362, '수'], ['amt', 362, 459, '금'], ['note', 459, 519]],
    foot: [[71, 216], [216, 288], [288, 362], [362, 459], [459, 519]] },
  7: { xs: [71, 211, 282, 356, 453, 522],
    head: [[['지도항목', 71, 211], ['지도기관', 211, 282], ['점검일', 282, 356], ['소요 경비', 356, 453], ['비 고', 453, 522]]],
    body: [['a', 71, 211], ['b', 211, 282], ['d', 282, 356, '날'], ['amt', 356, 453, '금'], ['note', 453, 522]],
    foot: [[71, 211], [211, 282], [282, 356], [356, 453], [453, 522]] },
  8: { xs: [68, 125, 177, 223, 268, 309, 334, 373, 402, 462, 533],
    head: [[['구 분', 68, 125], ['소속', 125, 177], ['직책', 177, 223], ['성명', 223, 268], ['보직일', 268, 334], ['지급액', 334, 402], ['지급일', 402, 462], ['비 고', 462, 533]]],
    body: [['a', 68, 125], ['b', 125, 177], ['j', 177, 223], ['c', 223, 268], ['e', 268, 334, '날'], ['amt', 334, 402, '금'], ['d', 402, 462, '날'], ['note', 462, 533]],
    foot: [[68, 268], [268, 334], [334, 402], [402, 462], [462, 533]] },
  9: { xs: [74, 119, 158, 196, 228, 260, 296, 337, 368, 399, 436, 456, 496, 531],
    head: [[['품목명', 74, 119, 2], ['결정일', 119, 196], ['계 획', 196, 296], ['사용일', 296, 337, 2], ['소요 비용', 337, 436], ['지급내역', 436, 496, 2], ['비고', 496, 531, 2]],
      [['위험성\n평가등', 119, 158], ['노사\n협의등', 158, 196], ['단가', 196, 228], ['수량', 228, 260], ['금액', 260, 296], ['단가', 337, 368], ['수량', 368, 399], ['금액', 399, 436]]],
    body: [['a', 74, 119], ['er', 119, 158, '날'], ['en', 158, 196, '날'], ['pu', 196, 228, '금'], ['pq', 228, 260, '수'], ['pa', 260, 296, '금'], ['d', 296, 337, '날'], ['u', 337, 368, '금'], ['q', 368, 399, '수'], ['amt', 399, 436, '금'], ['p', 436, 496], ['note', 496, 531]],
    foot: [[74, 260], [260, 337], [337, 399], [399, 456], [456, 531]] },
}
function 칸값(r, k) {
  if (k === 'amt') return 줄금액(r)
  if (k === 'uu') return 수(r.ul) + 수(r.um) || ''
  if (k === 'pa') return 계획금액(r) || ''
  if (k === 'er') return r.ek === 'n' ? '' : r.e
  if (k === 'en') return r.ek === 'n' ? r.e : ''
  return r[k]
}
const 줄글 = (t) => String(t).split('\n').map((x, j) => <span key={j}>{j ? <br /> : null}{x}</span>)
function 항목쪽({ h, c, ym, S }) {
  const 틀 = 쪽틀[h.i]
  const k = 칸폭(틀.xs)
  const x = S.줄[h.i - 1]
  const 줄들 = x.이달
  const 빈 = Math.max(1, (h.i === 8 ? 11 : 26) - 줄들.length)     // 몸 높이 — 원본 별지처럼 쪽의 대부분을 차지(가로줄 없는 빈 줄)
  const 넷 = [h.i === 8 ? (수(c.조직.본사계획) || x.계획 || '') : (x.계획 || ''), x.전 || '', x.금 || '', x.누 || '']
  const [y, m] = ym.split('-')
  return (
    <div className="rk-paper port sn-paper sn-frame" data-name={`${h.i}.${h.짧게}`}>
      <div className="rk-bigttl">항 목 별 사 용 내 역 (　{y} 년　{Number(m)} 월)</div>
      <div className="rk-sec">{h.i}. {h.이름}</div>
      {h.i === 8 && <>
        <div className="rk-sec">□ 조직 현황</div>
        <table className="rk-t">
          {열(틀.xs)}
          <tbody>
            <tr><C cs={k(68, 125)} rs={2} cl="hd">시공능력<br />평가순위</C><C cs={k(125, 373)} cl="hd">안전보건조직 · 인원 현황</C><C cs={k(373, 462)} rs={2} cl="hd">산업안전보건관리비<br />계상총액</C><C cs={k(462, 533)} rs={2} cl="hd">본사 임금 등<br />계상액(계획)</C></tr>
            <tr><C cs={k(125, 223)} cl="hd">조직명</C><C cs={k(223, 309)} cl="hd">직책</C><C cs={k(309, 373)} cl="hd">인원 수</C></tr>
            <tr><C cs={k(68, 125)}>{c.조직.순위}</C><C cs={k(125, 223)}>{c.조직.조직명}</C><C cs={k(223, 309)}>{c.조직.직책}</C><C cs={k(309, 373)} n={c.조직.인원 || ''}>{c.조직.인원}</C><N cs={k(373, 462)} v={수(c.조직.계상총액) || ''} /><N cs={k(462, 533)} v={수(c.조직.본사계획) || ''} /></tr>
            <tr><C cs={k(68, 125)}>{' '}</C><C cs={k(125, 223)}>{' '}</C><C cs={k(223, 309)}>{' '}</C><C cs={k(309, 373)}>{' '}</C><C cs={k(373, 462)}>{' '}</C><C cs={k(462, 533)}>{' '}</C></tr>
          </tbody>
        </table>
        <div className="rk-sec">□ 사용 내역</div>
      </>}
      <table className="rk-t">
        {열(틀.xs)}
        <tbody>
          {틀.head.map((줄, ri) => <tr key={ri}>{줄.map(([t, a, b2, rs], i) => <C key={i} cs={k(a, b2)} rs={rs || 1} cl="hd">{줄글(t)}</C>)}</tr>)}
          {줄들.map((r) => (
            <tr key={r.id}>{틀.body.map(([키, a, b2, 꼴]) => {
              const v = 칸값(r, 키), cs = k(a, b2)
              if (꼴 === '날') return <C key={키} cs={cs} cl="nb sm">{짧은날(v)}</C>
              if (꼴 === '수') return <C key={키} cs={cs} cl="nb r sm">{v === '' || v === undefined || !수(v) ? '' : 수(v).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}</C>
              if (꼴 === '금') return <N key={키} cs={cs} v={v === '' || v === undefined ? '' : 수(v)} cl="nb sm" />
              return <C key={키} cs={cs} cl="nb l sm">{v || ''}</C>
            })}</tr>
          ))}
          {Array.from({ length: 빈 }, (_, i) => <tr key={'e' + i} className="sn-blank">{틀.body.map(([키, a, b2]) => <C key={키} cs={k(a, b2)} cl="nb">{' '}</C>)}</tr>)}
          <tr>
            <C cs={k(틀.foot[0][0], 틀.foot[0][1])} rs={2} cl="hd">계</C>
            {[['계상액', '(계획)'], ['전월까지', '누계(A)'], ['금 월(B)'], ['누계', '(A+B)']].map((t, i) => <C key={i} cs={k(틀.foot[i + 1][0], 틀.foot[i + 1][1])} cl="hd">{t.map((s2, j) => <span key={j}>{j ? <br /> : null}{s2}</span>)}</C>)}
          </tr>
          <tr>{넷.map((v, i) => <N key={i} cs={k(틀.foot[i + 1][0], 틀.foot[i + 1][1])} v={v} />)}</tr>
        </tbody>
      </table>
      <div className="rk-top sm">{h.i === 8 ? '※ 주 : 본사만 사용내역 작성 및 증빙서류 첨부(현장 제외) — 증빙서류(예시): 본사 조직규정, 인사명령서, 계좌이체 내역 등' : h.i === 9 ? '※ 주 : 사용내역은 항목별 사용일자가 빠른 순서로 작성' : '※ 주 : 사용내역은 사용일자가 빠른 순서로 작성'}</div>
    </div>
  )
}

/* ── 계상 내역 한 장 (인쇄) ─────────────────── */
function 계상종이({ c, A, 변, 계상액, S }) {
  return (
    <div className="il-paper sn-calcp">
      <div className="il-title" style={{ textAlign: 'center' }}>산업안전보건관리비 계상 내역</div>
      <table className="il-t il-info"><tbody>
        <tr><th>공 사 명</th><td colSpan={3}>{c.정보.공사명}</td></tr>
        <tr><th>공사 종류</th><td>{A.t.이름}</td><th>근 거</th><td>{고시} 별표1</td></tr>
        <tr><th>대상액</th><td className="r">{원(A.대상)}원</td><th>대상액 셈</th><td>{A.방식 === 'total' ? `총공사금액 ${원(A.총액)} × 7/10` : `재료비 ${원(A.재료)} + 직접노무비 ${원(A.노무)}`}</td></tr>
        <tr><th>적용 구간</th><td>{A.구간}</td><th>비율 · 기초액</th><td>{A.율}%{A.기초 ? ` + ${원(A.기초)}원` : ''}</td></tr>
        {A.관급비교 && <tr><th>관급자재</th><td colSpan={3}>넣고 {원(A.관급비교.넣고.금액)} · 빼고 × 1.2 {원(A.관급비교.빼고12)} → 작은 값</td></tr>}
        <tr><th>계상액(이상)</th><td colSpan={3}><b>{원(A.금액)}원</b>{Number.isFinite(A.총대비) ? ` (총공사금액의 ${률글(A.총대비)})` : ''}</td></tr>
        {변 && <tr><th>설계변경</th><td colSpan={3}>증감 비율 {(변.비율 * 100).toFixed(2)}% · 증감액 {원(변.증감액)}원 → 변경 후 {원(변.후)}원</td></tr>}
      </tbody></table>
      <div className="il-h">사용 계획 (항목별 계상액)</div>
      <table className="il-t"><thead><tr><th>항 목</th><th>계상액(계획)</th><th>비율</th></tr></thead>
        <tbody>{항목.map((h) => { const v = 수((c.계획 || {})[h.i]); return <tr key={h.i}><td className="l">{h.i}. {h.이름}</td><td className="r">{v ? 원(v) : ''}</td><td className="r">{v && 계상액 ? 률글(v / 계상액) : ''}</td></tr> })}
          <tr className="il-sum"><td>계</td><td className="r">{원(S.합.계획)}</td><td className="r">{계상액 ? 률글(S.합.계획 / 계상액) : ''}</td></tr></tbody></table>
      <div className="il-h">공사진척에 따른 사용 기준 (별표3)</div>
      <table className="il-t"><thead><tr><th>기성 공정률</th><th>50~70%</th><th>70~90%</th><th>90% 이상</th></tr></thead>
        <tbody><tr><td>최소 사용</td><td className="r">{원(버림(계상액 * 0.5))}</td><td className="r">{원(버림(계상액 * 0.7))}</td><td className="r">{원(버림(계상액 * 0.9))}</td></tr></tbody></table>
      {A.알림.length > 0 && <div className="il-box small">{A.알림.join('\n')}</div>}
      <div className="il-foot">K-건설맵 산안비 계상기 · 고시 원문으로 확인한 비율 — 발주기관 기준이 따로 있으면 그것을 따르십시오</div>
    </div>
  )
}

