/**
 * 📈 /tools/esc — 물가변동 ESC(품목조정률) 산출서 (G657 · 2026-11-12)
 *
 * 소장님 11-12: 「건설맵에 물가변동 있지? 이걸 견본으로 해서 만들 수 있어? 이 엑셀 파일은 저장해 놓고 …
 *               물론 막아 놔....예시는 볼 수 있게 하고」 → 기획 보시고 «이대로 시작»
 * ■ 셈: lib/물가ESC.js — 소장님 견본(1회 ESC 엑셀 23장)의 수식을 그대로 옮김(견본 숫자와 1원도 안 틀림 · 비공개 견본 시험은 저장소 밖)
 *       엑셀: lib/물가ESC엑셀.js(견본 시트 차례 · 수식 살아 있음) · 읽기: lib/물가ESC읽기.js(견본 꼴 · 건설맵 꼴 · .xls 도)
 * ■ 🔒 씀 = 소장님 브라우저(lib/운영자.js) · 열쇠말(lib/gate.js). 그 밖의 분은 🧪 예시(지어낸 공사)를 «보기만» — 넣기 · 받기 · 빈 틀 없음(G650).
 *      예시는 미리 셈해 «값만» 남긴 data/물가ESC_예시화면.js — 이용자 브라우저에는 셈 엔진 · 엑셀 짓기 · 수식이 가지 않음.
 *      «씀» 이어도 예시를 보는 동안에는 받기 🔒(예시로는 아무것도 받지 못함 · G650).
 * ■ 쓴 횟수(소장님만): |물가ESC|예시 · |물가ESC|넣기 · |물가ESC|받기 · |물가ESC|빈틀 · |물가ESC|잠금 · |물가ESC|예시잠금 · |물가ESC|열쇠
 * ■ 넣은 엑셀은 이 브라우저 안에서만 읽고 어디에도 남기지 않습니다(새로고침하면 지워짐).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import 잠금문의 from '../잠금문의.jsx'   // 📄 G669 잠근 도구 «문의»
import { isOpen, tryOpen } from '../lib/gate.js'
import { use보기만 } from '../lib/보기만.js'   // 🧪 G679 예시는 보기만(Ctrl+P 안내 한 줄 · 예시 판 복사 막음)
import { 나운영자 } from '../lib/운영자.js'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import 금액입력 from '../금액입력.jsx'

const 숫 = (n, d = 0) => (n === null || n === undefined || n === '' || !Number.isFinite(Number(n)) ? '' : Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d }))
const 원 = (n) => 숫(Math.round(Number(n) || 0))
const 퍼 = (x, d = 2) => (x === null || x === undefined || !Number.isFinite(Number(x)) ? '' : (Number(x) * 100).toFixed(d) + '%')
const 숨 = () => new Promise((r) => setTimeout(r, 30))
const 수읽기 = (v) => { const n = Number(String(v ?? '').replace(/[,\s원%]/g, '')); return Number.isFinite(n) ? n : 0 }
const 요율키 = [['산재', '산재보험료'], ['고용', '고용보험료'], ['건강', '건강보험료'], ['연금', '연금보험료'], ['노인', '노인장기요양보험료'], ['퇴직', '퇴직공제부금비'], ['산안비', '산업안전보건관리비']]
const 탭들 = [['금액', '조정금액'], ['조정', '조정율 산출표'], ['품목', '품목별 등락폭'], ['적용', '적용대가'], ['공정', '공종별 공정'], ['선금', '선금 공제']]
const 넣었나 = (o, k) => o && Object.prototype.hasOwnProperty.call(o, k)

/** 화면에서 고친 칸(날짜 · 선금 · 요율 …)을 읽은 입력 위에 얹음 */
function 고친입력(입, 고) {
  if (!고 || !Object.keys(고).length) return 입
  const o = { ...입, 선금: { ...(입.선금 || {}) }, 원가율: { ...(입.원가율 || {}) }, 요율: { ...(입.요율 || {}) } }
  for (const k of ['입찰일', '계약일', '직전조정일', '조정기준일', '기타공제', '기성금액']) if (넣었나(고, k)) o[k] = 고[k]
  for (const k of ['지급일', '선금', '금차계약', '금차제외']) if (넣었나(고.선금, k)) o.선금[k] = 고.선금[k]
  if (넣었나(고.원가율, '산안배수')) o.원가율.산안배수 = 고.원가율.산안배수
  for (const [k] of 요율키) if (고.요율 && 고.요율[k]) o.요율[k] = { ...(o.요율[k] || {}), ...고.요율[k] }
  return o
}

export default function Esc() {
  const [씀, set씀] = useState(() => isOpen())
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  const [잠금말, set잠금말] = useState('')
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [예시, set예시] = useState(null)
  const [내것, set내것] = useState(null)
  const [보기, set보기] = useState('예시')
  const [고침, set고침] = useState({})
  const [libs, setLibs] = useState(null)
  const 칸 = useRef(null)
  const 결과칸 = useRef(null)
  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (살 && v) set씀(true) }).catch(() => {})
    return () => { 살 = false }
  }, [])
  const 잠김 = (무엇) => { set잠금말(`🔒 ${무엇} K-건설맵에 문의해 주세요(위 «📄 작성대행 · 견적 문의») — 🧪 예시로 어떤 산출서가 나오는지 보실 수 있습니다.`); 세기('|물가ESC|잠금') }
  const 결과로 = () => setTimeout(() => { try { 결과칸.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch { /* 없음 */ } }, 60)

  /* ── 🧪 예시(누구나 · 보기만 · 미리 셈한 값) ── */
  const 예시보기 = async () => {
    set오류(''); set잠금말(''); set바쁨('예시를 불러오는 중입니다…'); await 숨()
    try {
      const { 예시화면 } = await import('../data/물가ESC_예시화면.js')
      set예시(예시화면); set보기('예시'); 결과로()
      세기('|물가ESC|예시')
    } catch (e) { set오류((e && e.message) || '예시를 불러오지 못했습니다') } finally { set바쁨('') }
  }

  /* ── 씀: 엔진 싣기 · 엑셀 넣기 ── */
  const 싣기 = async () => {
    if (libs) return libs
    const [E, X, L] = await Promise.all([import('../lib/물가ESC.js'), import('../lib/물가ESC엑셀.js'), import('../lib/물가ESC읽기.js')])
    const o = { E, X, L }
    setLibs(o)
    return o
  }
  const 받기 = async (files) => {
    if (!씀) { 잠김('ESC 엑셀 넣기는'); return }
    const f = files && files[0]
    if (!f) return
    if (!/\.(xlsx|xlsm|xls)$/i.test(f.name)) { set오류('엑셀 파일(.xlsx · .xls)만 됩니다.'); return }
    set오류(''); set잠금말(''); set바쁨('ESC 엑셀을 읽고 셈하는 중입니다…'); await 숨()
    try {
      const m = await 싣기()
      const r = m.L.ESC읽기(await f.arrayBuffer())
      m.E.ESC셈(r.입력)                       /* 셈이 되는지 먼저(안 되면 아래 catch) */
      set내것({ 파일이름: f.name, ...r }); set고침({}); set보기('내것'); 결과로()
      세기('|물가ESC|넣기')
    } catch (e) { set오류((e && e.message) || '읽지 못했습니다') } finally { set바쁨('') }
  }
  const 입력 = useMemo(() => (내것 ? 고친입력(내것.입력, 고침) : null), [내것, 고침])
  const 내셈 = useMemo(() => {
    if (!libs || !입력) return null
    try { const R = libs.E.ESC셈(입력); return { R, 자료: libs.E.화면자료(입력, R) } } catch (e) { return { 오류: (e && e.message) || '셈하지 못했습니다' } }
  }, [libs, 입력])

  const 파일로 = (bytes, 이름) => {
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const a = document.createElement('a')
    a.href = url; a.download = 이름; document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }
  const 엑셀받기 = () => {
    if (보기 === '예시' || !씀 || !내셈 || !내셈.R) { 세기('|물가ESC|예시잠금'); return false }
    try {
      const 공 = String(입력.이름 || 'ESC').replace(/[\\/:*?"<>|]/g, '').slice(0, 40) || 'ESC'
      파일로(libs.X.ESC엑셀(입력, 내셈.R), `${공}_물가변동ESC.xlsx`)
      세기('|물가ESC|받기')
    } catch (e) { set오류((e && e.message) || '엑셀을 짓지 못했습니다') }
  }
  const 빈틀받기 = async () => {
    if (!씀) { 잠김('빈 틀 받기는'); return }
    set오류(''); set바쁨('빈 틀을 짓는 중입니다…'); await 숨()
    try {
      const m = await 싣기()
      const 입 = { 이름: '', 품목: [] }
      파일로(m.X.ESC엑셀(입, m.E.ESC셈(입), { 빈줄: 60 }), '물가변동ESC_빈틀.xlsx')
      세기('|물가ESC|빈틀')
    } catch (e) { set오류((e && e.message) || '빈 틀을 짓지 못했습니다') } finally { set바쁨('') }
  }

  const 보는것 = 보기 === '내것' && 내셈 && 내셈.자료 ? 내셈.자료 : 보기 === '예시' ? 예시 : null

  return (
    <div className="wrap">
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20, wordBreak: 'keep-all' }}>📈 물가변동 ESC — 품목조정률 산출서</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          내역서 공종마다 <b>입찰일 단가(A) · 계약단가(B) · 조정기준일 단가(C)</b>로 등락폭을 셈하고, 간접노무비 · 4대 보험료 · 산업안전보건관리비 같은
          <b> 법정 요율이 바뀐 몫</b>까지 더해 <b>품목조정률 · 조정금액 · 선금 공제 · 조정 적용금액</b>이 나오는 산출서 한 벌입니다 —
          조정금액 산출 · 조정율 산출표 · 품목별 등락폭 · 적용대가 · 공종별 공정 · 선금 공제.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          실제 물가변동(1회 ESC) 산출서의 수식을 그대로 옮겨 셈합니다 — 끝수 버림 · 올림까지 같습니다.
          엑셀로 받으면 칸마다 수식이 살아 있어 발주처 검토에 그대로 냅니다. 요건(90일 경과 · 3% 증감)도 함께 봅니다.
        </p>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 문의해 주세요</b> — 물가변동 ESC 산출서는 K-건설맵이 직접 작성해 드립니다(견본 먼저 · 최저가). <잠금문의 도구="물가변동 ESC 산출서" 셈="물가ESC" />
            {' '}<button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={예시보기}>🧪 예시 산출서 보기</button>로 어떤 산출서가 나오는지 보실 수 있습니다(보기만).
            {' '}<예시본수 열쇠="|물가ESC|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set잠금말(''); 세기('|물가ESC|열쇠') }
              }}>
                <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
                <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
              </form>
              {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
            </details>
            <div className="esc-ask">
              ESC 산출을 맡기시려면 —{' '}
              <Link to={'/qna?ask=' + encodeURIComponent('물가변동 ESC 산출 문의합니다')}>💬 맵톡에 남기기</Link>{' · '}
              <Link to="/naeyeok#ask">📋 문의함으로 보내기</Link>
            </div>
          </div>
        )}
        {씀 && (
          <div className="esc-mine">
            <b>🔓 씀</b> — ESC 엑셀(견본 꼴 · 이 도구에서 받은 꼴)을 넣으면 셈하고, 견본 꼴이면 그 파일이 낸 값과 견줍니다(검산).
            {' '}<button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={예시보기}>🧪 예시 보기</button>
            {' '}<예시본수 열쇠="|물가ESC|예시" />
          </div>
        )}
        {잠금말 && <div className="cwarn" style={{ marginTop: 8 }}>{잠금말}</div>}
        {바쁨 && <div className="muted" style={{ marginTop: 8 }}>⏳ {바쁨}</div>}
        {오류 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {오류}</div>}
      </div>

      {/* ── ① ESC 엑셀 넣기 ── */}
      <div className="card">
        <div className="sec-title">① ESC 엑셀 넣기 <span className="muted" style={{ fontWeight: 500 }}>(.xlsx · .xls)</span></div>
        {씀 ? (
          <>
            <div className="tldrop" onClick={() => 칸.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); 받기(e.dataTransfer?.files) }}>
              <input ref={칸} type="file" accept=".xlsx,.xlsm,.xls" hidden onChange={(e) => { 받기(e.target.files); e.target.value = '' }} />
              <끌어놓기판 글="ESC 엑셀을 놓으면 읽습니다" 길들={[{ 꼴: /\.(xlsx|xlsm|xls)$/i, 받기: (fs) => 받기(fs) }]} />
              <b>＋ ESC 엑셀을 끌어 놓거나 누르십시오</b>
              <span>견본 꼴(입력 · 2 · 조정율 · 4 · 6 · 12_4 시트) 또는 이 도구에서 받은 엑셀(노란 칸만 읽음)</span>
            </div>
            <div className="esc-row">
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={빈틀받기}>📄 빈 틀 받기</button>
              <span className="muted" style={{ fontSize: 12.5 }}>노란 칸(공종 · 수량 · 단가 A · B · C · 요율 · 선금)을 채워 다시 넣으면 산출서가 나옵니다.</span>
            </div>
          </>
        ) : (
          <div className="tldrop sg-locked" onClick={() => 잠김('ESC 엑셀 넣기는')} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); 잠김('ESC 엑셀 넣기는') }}>
            <b>🔒 ESC 엑셀 넣기는 K-건설맵에 문의해 주세요</b>
            <span>내역서 · 단가(입찰일 · 조정기준일) · 공정률 · 선금을 넣으면 산출서 한 벌이 나옵니다. 지금은 위 🧪 예시로 보십시오.</span>
          </div>
        )}
      </div>

      {/* ── ② 산출서(예시 · 내 것) ── */}
      <div ref={결과칸} />
      {씀 && 예시 && 내것 && (
        <div className="esc-switch">
          <button type="button" className={'btn sm ' + (보기 === '내것' ? '' : 'line')} onClick={() => set보기('내것')}>📄 내 ESC</button>
          <button type="button" className={'btn sm ' + (보기 === '예시' ? '' : 'line')} onClick={() => set보기('예시')}>🧪 예시</button>
        </div>
      )}
      {보기 === '내것' && 내셈 && 내셈.오류 && <div className="card"><div className="cwarn">⚠️ {내셈.오류}</div></div>}
      {보는것 && (
        <산출서 자료={보는것} 예시={보기 === '예시'} 씀={씀}
          머리={보기 === '예시' ? null : { 파일이름: 내것.파일이름, 꼴: 내것.꼴, 읽기경고: 내것.경고, 견본결과: 내것.견본결과 }}
          고침={고침} set고침={set고침} 입력={입력} 엑셀받기={엑셀받기} />
      )}
    </div>
  )
}

/* ═══════════════ 산출서 화면(예시 · 내 것 같은 꼴) ═══════════════ */
function 산출서({ 자료, 예시, 씀, 머리, 고침, set고침, 입력, 엑셀받기 }) {
  const [탭, set탭] = useState('금액')
  const [받기말, set받기말] = useState('')
  use보기만(!!예시, '물가ESC')   // 🧪 G679 예시 산출서는 보기만(Ctrl+P 안내 한 줄 · 표 복사 막음)
  const 금 = 자료.금액, 날 = 자료.날
  const 감액 = 자료.조정률 < 0
  return (
    <div className={'card esc-card' + (예시 ? ' esc-ex' : '')}>
      {예시 && <div className="esc-printnote">🧪 예시 산출서는 화면에서 보기만 됩니다(인쇄 · 받기 없음).</div>}
      {예시 ? (
        <div className="sec-title">🧪 예시 산출서 — 지어낸 공사 <span className="muted" style={{ fontWeight: 500 }}>(보기만 · 받기 · 인쇄 없음)</span></div>
      ) : (
        <div className="sec-title">📄 내 ESC — {머리.파일이름} <span className="muted" style={{ fontWeight: 500 }}>({머리.꼴} 꼴)</span></div>
      )}
      <div className="esc-name">
        <b>{자료.이름 || '(공사명 없음)'}</b>{자료.기관 ? <span className="muted"> · {자료.기관}</span> : null}
        {예시 && <span className="esc-tag">가상</span>}
      </div>

      <div className="esc-sum">
        <div className="esc-box big">
          <span>품목조정률 (A)</span>
          <b className={감액 ? 'neg' : ''}>{자료.조정률.toFixed(2)}%</b>
          <em>등락 합계 {원(자료.조정.find((x) => x.키 === '합계')?.등락)}원 ÷ 적용대가</em>
        </div>
        <div className="esc-box">
          <span>조정금액 (G) = A × D</span>
          <b>{원(금.G)}원</b>
          <em>천원 미만 버림</em>
        </div>
        <div className="esc-box">
          <span>선금 공제 (F)</span>
          <b>{원(금.F)}원</b>
          <em>선금률 {퍼(자료.선금.선금률)}{감액 ? ' · 감액이라 공제 없음' : ''}</em>
        </div>
        <div className="esc-box big">
          <span>적용금액 = G − F − H</span>
          <b className={감액 ? 'neg' : ''}>{원(금.적용금액)}원</b>
          <em>부가가치세 포함</em>
        </div>
      </div>
      <div className="esc-chips">
        <span className={'esc-chip ' + (자료.요건.경과90 ? 'ok' : 'no')}>{자료.요건.경과90 ? '✓' : '✗'} 경과 {날.경과 ?? '—'}일 {자료.요건.경과90 ? '(90일 이상)' : '(90일 미만)'}</span>
        <span className={'esc-chip ' + (자료.요건.률3 ? 'ok' : 'no')}>{자료.요건.률3 ? '✓' : '✗'} 조정률 {자료.조정률.toFixed(2)}% {자료.요건.률3 ? '(3% 이상)' : '(3% 미만)'}</span>
        {자료.요건.경계 && <span className="esc-chip warn">⚠ 90일 경계 — 날 세기를 발주처 기준으로 다시 확인</span>}
      </div>
      <div className="esc-line muted">
        계약금액(B) {원(금.B)}원 − 적용제외(C) {원(금.C)}원 = 적용대가(D) <b>{원(금.D)}원</b>
        {' · '}예정공정 {퍼(자료.공정.예정)} · 기성 {퍼(자료.공정.기성)} · 제외 {퍼(자료.공정.제외)}
      </div>
      <div className="esc-line muted">
        기준시점 {날.기준일 || '—'}{날.직전조정일 ? '(직전 조정기준일)' : '(계약일)'} → 조정기준일 {날.조정기준일 || '—'} · 입찰일(A 단가) {날.입찰일 || '—'}
      </div>

      {머리 && 머리.견본결과 && <검산 견본={머리.견본결과} 금={금} 조정률={자료.조정률} />}
      {[...(머리?.읽기경고 || []), ...(자료.경고 || [])].length > 0 && (
        <div className="cwarn" style={{ marginTop: 8 }}>
          {[...(머리?.읽기경고 || []), ...(자료.경고 || [])].slice(0, 8).map((w, i) => <div key={i}>⚠️ {w}</div>)}
        </div>
      )}
      {씀 && !예시 && 입력 && <고치기판 입력={입력} 고침={고침} set고침={set고침} />}

      <div className="esc-swipe muted">↔ 표는 옆으로 밀어 보십시오</div>
      <div className="esc-tabs" role="tablist">
        {탭들.map(([k, 이름]) => (
          <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'esc-tab' + (탭 === k ? ' on' : '')} onClick={() => set탭(k)}>{이름}</button>
        ))}
      </div>
      <div className="esc-tbl">
        {탭 === '금액' && <금액표 자료={자료} />}
        {탭 === '조정' && <조정표 자료={자료} />}
        {탭 === '품목' && <품목표 자료={자료} />}
        {탭 === '적용' && <적용표 자료={자료} />}
        {탭 === '공정' && <공정표 자료={자료} />}
        {탭 === '선금' && <선금표 자료={자료} />}
      </div>

      <div className="esc-dl">
        <button type="button" className={'btn sm' + (예시 || !씀 ? ' line' : '')} style={{ width: 'auto' }} onClick={() => set받기말(엑셀받기() === false ? '🔒 예시는 보기만 됩니다 — 받기는 내 ESC 엑셀을 넣은 뒤에 됩니다.' : '')}>
          {예시 || !씀 ? '🔒 ESC 엑셀 받기' : '📗 ESC 엑셀 받기 (견본 시트 차례 · 수식)'}
        </button>
        <span className="muted" style={{ fontSize: 12.5 }}>
          {예시 ? '예시는 보기만 됩니다.' : '입력 · 2 조정금액 · 조정율 · 4 품목 · 5 적용대가 · 6 공정 · 12_4 선금 — 노란 칸을 고치면 엑셀이 다시 셈합니다.'}
        </span>
        {받기말 && <div className="cwarn esc-dl-note">{받기말}</div>}
      </div>
    </div>
  )
}

function 검산({ 견본, 금, 조정률 }) {
  const 줄 = [['조정률', 견본.조정률, 조정률, (v) => (v === null ? '—' : Number(v).toFixed(2) + '%')], ['적용대가(D)', 견본.D, 금.D, 원], ['조정금액(G)', 견본.G, 금.G, 원], ['선금 공제(F)', 견본.F, 금.F, 원], ['적용금액', 견본.적용금액, 금.적용금액, 원]]
  const 다 = 줄.every(([, a, b]) => a === null || Math.abs(Number(a) - Number(b)) < 1e-9)
  return (
    <div className={'esc-check ' + (다 ? 'ok' : 'no')}>
      <b>{다 ? '✓ 검산 — 넣은 엑셀이 낸 값과 같습니다' : '✗ 검산 — 넣은 엑셀이 낸 값과 다른 곳이 있습니다'}</b>
      <div>
        {줄.map(([이름, a, b, f]) => (
          <span key={이름} className={a === null || Math.abs(Number(a) - Number(b)) < 1e-9 ? '' : 'diff'}>{이름} {f(a)}{a === null || Math.abs(Number(a) - Number(b)) < 1e-9 ? ' ✓' : ` → 건설맵 ${f(b)}`}</span>
        ))}
      </div>
    </div>
  )
}

/* 씀 — 날짜 · 선금 · 요율 고치기(고치면 바로 다시 셈) */
function 고치기판({ 입력, 고침, set고침 }) {
  const 날칸 = (k, 이름) => (
    <label className="esc-f"><span>{이름}</span>
      <input type="date" value={입력[k] || ''} onChange={(e) => set고침({ ...고침, [k]: e.target.value })} /></label>
  )
  const 수칸 = (값, 바꿈, 이름, 끝 = '원') => (
    <label className="esc-f"><span>{이름}</span>
      {끝 === '원'
        ? <금액입력 value={String(Math.round(Number(값) || 0))} onValue={(n) => 바꿈(n || 0)} 줄={false} />
        : <input inputMode="decimal" value={값 === undefined || 값 === null ? '' : String(값)} onChange={(e) => 바꿈(e.target.value === '' ? 0 : 수읽기(e.target.value))} />}
      {끝 && <i>{끝}</i>}</label>
  )
  const 선 = (k) => (v) => set고침({ ...고침, 선금: { ...(고침.선금 || {}), [k]: v } })
  return (
    <details className="esc-edit">
      <summary>✏️ 날짜 · 선금 · 요율 고치기 <span className="muted">(고치면 바로 다시 셈 · 엑셀에도 들어감)</span></summary>
      <div className="esc-fs">
        {날칸('입찰일', '입찰일 (A 단가)')}{날칸('계약일', '계약일')}{날칸('직전조정일', '직전 조정기준일')}{날칸('조정기준일', '조정기준일 (C 단가)')}
      </div>
      <div className="esc-fs">
        <label className="esc-f"><span>선금 지급일</span><input type="date" value={입력.선금?.지급일 || ''} onChange={(e) => 선('지급일')(e.target.value)} /></label>
        {수칸(입력.선금?.선금, 선('선금'), '선금')}{수칸(입력.선금?.금차계약, 선('금차계약'), '금차분 계약금액')}{수칸(입력.선금?.금차제외, 선('금차제외'), '금차분 제외금액')}
        {수칸(입력.기타공제, (v) => set고침({ ...고침, 기타공제: v }), '기타 공제(H)')}{수칸(입력.기성금액, (v) => set고침({ ...고침, 기성금액: v }), '받은 기성금액')}
        {수칸(입력.원가율?.산안배수 ?? 1.2, (v) => set고침({ ...고침, 원가율: { 산안배수: v } }), '산안비 곱', '배')}
      </div>
      <div className="esc-fs">
        {요율키.map(([k, 이름]) => {
          const y = (입력.요율 && 입력.요율[k]) || {}
          const 바 = (w) => (v) => set고침({ ...고침, 요율: { ...(고침.요율 || {}), [k]: { ...((고침.요율 || {})[k] || {}), [w]: v } } })
          return (
            <div key={k} className="esc-rate"><span>{이름}</span>
              {수칸(y.기준 ?? '', 바('기준'), '기준', '%')}{수칸(y.비교 ?? '', 바('비교'), '비교', '%')}
            </div>
          )
        })}
      </div>
      <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set고침({})}>↺ 넣은 엑셀 값으로</button>
    </details>
  )
}

/* ── 표들 ── */
function 금액표({ 자료 }) {
  const 금 = 자료.금액, 선 = 자료.선금
  const 줄 = [
    ['① 물가변동 대상공사의 계약금액 (B)', 원(금.B), '도급계약서 (장기계속공사는 총공사 부기금액)', 1],
    ['② 물가변동 적용제외 계약금액 (C)', 원(금.C), '조정기준일 현재 공정률 감안'],
    ['　예정공정률', 퍼(자료.공정.예정), '예정공정표'], ['　실행공정률', 퍼(자료.공정.실행), '지연 · 실행 공정'],
    ['　기성공정률', 퍼(자료.공정.기성), '조정신청일 전에 받은 기성'], ['　제외공정률', 퍼(자료.공정.제외), 'MAX(예정 · 실행 · 기성) + P/S'],
    ['③ 물가변동 적용대가 (D)', 원(금.D), 'D = B − C', 1],
    ['④ 물가변동 조정율 (A)', 자료.조정률.toFixed(2) + '%', '품목조정률 산출표', 1],
    ['⑤ 등락 대상 조정금액 (G)', 원(금.G), 'G = A × D (천원 미만 버림)', 1],
    ['⑥ 선금 공제금액 (F)', 원(금.F), '③ × A × 선금률 (천원 올림)', 1],
    ['　(가) 선금 지급일', 선.지급일 || '—', ''], ['　(나) 선금', 원(선.선금), ''], ['　(다) 선금률 (E)', 퍼(선.선금률), '선금 ÷ 금차분 계약금액'],
    ['⑦ 기타 공제금액 (H)', 원(금.H), ''],
    ['⑧ 물가변동 조정 적용금액', 원(금.적용금액), 'G − F − H (부가가치세 포함)', 1],
    ['경과기간', (자료.날.경과 ?? '—') + '일', '조정기준일 − 기준시점 − 1 (견본 꼴)'],
  ]
  return (
    <table className="tbl esc-t esc-w2">
      <thead><tr><th>구 분</th><th>내 용</th><th>비 고</th></tr></thead>
      <tbody>{줄.map(([a, b, c, 굵]) => <tr key={a} className={굵 ? 'b' : ''}><td>{a}</td><td>{b}</td><td className="note">{c}</td></tr>)}</tbody>
    </table>
  )
}
function 조정표({ 자료 }) {
  const 율 = (v) => (v === null || v === undefined ? '' : 숫(v, 7))
  return (
    <table className="tbl esc-t">
      <thead><tr><th>비 목</th><th>계약 요율 (C)</th><th>기준시점 (D)</th><th>비교시점 (E)</th><th>변경 요율 C×E÷D</th><th>적용대가</th><th>등락폭</th><th>구성비</th><th>등락율</th></tr></thead>
      <tbody>
        {자료.조정.map((x) => (
          <tr key={x.키} className={x.굵 ? 'b' : ''}>
            <td>{x.구분 ? <small className="grp">{x.구분}</small> : null}{x.비목}</td>
            <td>{x.계약 === null ? '' : 율(x.계약) + '%'}</td><td>{율(x.기준)}</td><td>{율(x.비교)}</td><td>{x.변경 === null ? '' : 숫(x.변경, 4)}</td>
            <td>{원(x.적용대가)}</td><td className={x.등락 < 0 ? 'neg' : ''}>{원(x.등락)}</td><td>{퍼(x.구성비)}</td><td>{x.등락율 === null ? '' : Number(x.등락율).toFixed(4)}</td>
          </tr>
        ))}
        <tr className="b hl"><td>물가변동 조정율</td><td colSpan={5} className="note">등락 합계(천원 반올림) ÷ 적용대가 × 100 · 소수 셋째 자리부터 버림</td><td>{자료.조정률.toFixed(2)}%</td><td></td><td></td></tr>
      </tbody>
    </table>
  )
}
function 품목표({ 자료 }) {
  const 셋 = (a, d = 0) => [0, 1, 2].map((i) => <td key={i}>{a && a[i] !== null && a[i] !== undefined ? (d ? Number(a[i]).toFixed(d) : 숫(a[i])) : ''}</td>)
  return (
    <table className="tbl esc-t esc-wide">
      <thead>
        <tr><th rowSpan={2}>공 종 · 규 격</th><th rowSpan={2}>단위</th><th rowSpan={2}>적용 수량</th><th colSpan={3}>입찰일 단가 (A)</th><th colSpan={3}>계약단가 (B)</th><th colSpan={3}>조정기준일 단가 (C)</th>
          <th colSpan={3}>등락률 (D)</th><th colSpan={3}>등락폭 단가 (E)</th><th colSpan={4}>등락폭 금액 (F) = E × 수량</th></tr>
        <tr>{[0, 1, 2, 3, 4, 5].map((g) => ['노무', '재료', '경비'].map((n) => <th key={g + n}>{n}</th>))}<th>합계</th></tr>
      </thead>
      <tbody>
        {자료.품목.map((x, i) => (x.머리 ? (
          <tr key={i} className="grp-row"><td colSpan={22}>{x.공종}</td></tr>
        ) : (
          <tr key={i}>
            <td className="nm">{x.공종}{x.규격 ? <small> {x.규격}</small> : null}{x.사급 ? <small className="tag">사급</small> : null}</td>
            <td>{x.단위}</td><td>{숫(x.수량, 4)}</td>{셋(x.A)}{셋(x.B)}{셋(x.C)}{셋(x.D, 4)}{셋(x.E)}{셋(x.F)}<td className="b">{원(x.합)}</td>
          </tr>
        )))}
        <tr className="b hl"><td colSpan={18}>합 계 (재료비 · 직접노무비 · 산출경비 등락)</td><td>{원(자료.품목합.노)}</td><td>{원(자료.품목합.재)}</td><td>{원(자료.품목합.경)}</td><td>{원(자료.품목합.합)}</td></tr>
      </tbody>
    </table>
  )
}
function 적용표({ 자료 }) {
  return (
    <table className="tbl esc-t">
      <thead><tr><th>비 목</th><th>도급계약금액 ①</th><th>예정공정</th><th>기성</th><th>적용제외 ②</th><th>물가변동 적용대가 ③=①−②</th></tr></thead>
      <tbody>{자료.적용.map((x) => (
        <tr key={x.키} className={x.굵 ? 'b' : ''}><td>{x.비목}</td><td>{원(x.계약)}</td><td>{원(x.예정)}</td><td>{원(x.기성)}</td><td>{원(x.제외)}</td><td>{원(x.적용대가)}</td></tr>
      ))}</tbody>
    </table>
  )
}
function 공정표({ 자료 }) {
  return (
    <table className="tbl esc-t esc-wide">
      <thead><tr><th>공 종 · 규 격</th><th>단위</th><th>계약</th><th>예정</th><th>실행</th><th>빠른 MAX(예정,실행)</th><th>P/S</th><th>기성</th><th>조정 계약−빠른−P/S</th><th>제외 MAX(빠른,기성)+P/S</th><th>적용 계약−제외</th></tr></thead>
      <tbody>{자료.품목.map((x, i) => (x.머리 ? (
        <tr key={i} className="grp-row"><td colSpan={11}>{x.공종}</td></tr>
      ) : (
        <tr key={i}><td className="nm">{x.공종}{x.규격 ? <small> {x.규격}</small> : null}</td><td>{x.단위}</td>
          {['계약', '예정', '실행', '빠른', 'PS', '기성', '수량', '제외', '적용'].map((k) => <td key={k}>{숫(x[k], 4)}</td>)}</tr>
      )))}</tbody>
    </table>
  )
}
function 선금표({ 자료 }) {
  const 선 = 자료.선금
  const 줄 = [
    ['① 도급계약금액 (금차분)', 원(선.금차계약), '금차분 계약금액'], ['② 물가변동 제외금액 (금차분)', 원(선.금차제외), '금차분 제외금액 (P/S 포함)'],
    ['③ 물가변동 적용대가', 원(선.적용), '① − ②'], ['④ 선금', 원(선.선금), '조정기준일 전에 받은 것'],
    ['⑤ 선금률', 퍼(선.선금률), '④ ÷ ① (소수 넷째 자리 반올림)'], ['⑥ 선금 공제금액', 원(선.공제), '③ × 조정률 × ⑤ (천원 올림 · 감액이면 0)'],
  ]
  return (
    <table className="tbl esc-t esc-w2">
      <thead><tr><th>구 분</th><th>금 액</th><th>비 고</th></tr></thead>
      <tbody>{줄.map(([a, b, c]) => <tr key={a} className={/⑥/.test(a) ? 'b' : ''}><td>{a}</td><td>{b}</td><td className="note">{c}</td></tr>)}</tbody>
    </table>
  )
}
