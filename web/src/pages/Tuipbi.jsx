/**
 * /tools/tuipbi — 🏗 현장 투입비 (공사일보 간소판) (2026-09-26)
 *
 * 소장님: 「공사일보를 시스템화 하는 거...이건 너무 확장판인듯 하고, 난 투입비만 나오면 돼.
 *          총공사금액 얼마. 현재 투입비 얼마...등...최대한 단순하면서 필요한 기능은 다 있는것...
 *          건설맵에서 등록해서 사용하게 하는 거지...」
 *
 * ■ 현장을 만들면 «현장 코드(9자리) + 비밀번호» 가 생깁니다. 회원가입 없음.
 *   코드와 비밀번호를 아는 사람(현장 직원)은 폰·PC 어디서든 같이 적고 봅니다.
 * ■ 적는 것: 날짜 · 구분(노무·자재·장비·외주·경비·기타) · 내용 · 금액(수량×단가도 됨). 그것뿐입니다.
 * ■ 보는 것: 총공사금액 · 누적 투입비 · 투입률 · 남은 금액 · 공기 경과율과 견줌 · 구분별 · 월별 · 엑셀 · 인쇄
 * ■ 받지 않는 것: 근로자 명단·주민번호·계좌·4대보험 — 참고로 주신 공사일보 서비스에서 뺀 것들입니다.
 * ■ 비용: 파이어베이스 get() 만(실시간 구독 없음). 현장 하나에 한 해 적어도 수백 KB.
 * 셈·엑셀·예시는 lib/tuipbi.js · 규칙은 web/database.rules.json «현장 투입비»
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 구분, 구분이름, 원, 억만, 퍼센트, 코드만들기, 코드보기, 코드정리, 비번해시, 오늘, 요약, 엑셀, 예시현장 } from '../lib/tuipbi.js'

/* firebase 는 이 화면에서 «현장을 열 때만» 받습니다 (사랑방과 같은 방식) */
let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}

const 목록키 = 'kcm-tuipbi-sites'
const 이름키 = 'kcm-tuipbi-by'
const 읽기 = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch (e) { return d } }
const 쓰기 = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { /* 개인 창 등 — 없어도 됩니다 */ } }
const 숫자만 = (s) => Number(String(s || '').replace(/[^0-9.-]/g, '')) || 0
const 쉼표칸 = (s) => { const n = String(s || '').replace(/[^0-9]/g, ''); return n ? 원(Number(n)) : '' }
const 막힘 = (e) => /permission|PERMISSION/.test(String((e && (e.code || e.message)) || e))

export default function Tuipbi() {
  const [params, setParams] = useSearchParams()
  const [화면, set화면] = useState('home')             // home | new | open | made | site
  const [코드, set코드] = useState('')
  const [현장, set현장] = useState(null)
  const [줄들, set줄들] = useState([])
  const [예시, set예시] = useState(false)
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [목록, set목록] = useState(() => 읽기(목록키, []))

  useEffect(() => {
    const c = 코드정리(params.get('c'))
    if (c.length === 9) { set코드(c); 열어보기(c) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const 기억 = (c, n) => {
    const v = [{ c, n }, ...목록.filter((x) => x.c !== c)].slice(0, 20)
    set목록(v); 쓰기(목록키, v)
  }
  const 잊기 = (c) => { const v = 목록.filter((x) => x.c !== c); set목록(v); 쓰기(목록키, v) }

  /* 이 브라우저가 이미 열어 본 현장이면 비밀번호 없이 바로 */
  async function 열어보기(c) {
    set오류(''); set바쁨('현장을 여는 중입니다…')
    try {
      const fb = await loadFb()
      await fb.ensureAnon()
      await 불러오기(c)
    } catch (e) {
      if (막힘(e)) { set코드(c); set화면('open') } else set오류('현장을 열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }
  async function 불러오기(c) {
    const fb = await loadFb()
    const [s, r] = await Promise.all([fb.get(fb.ref(fb.db, `cost_sites/${c}`)), fb.get(fb.ref(fb.db, `cost_rows/${c}`))])
    if (!s.exists()) throw Object.assign(new Error('없음'), { code: 'PERMISSION_DENIED' })
    const rows = []
    r.forEach((x) => { rows.push({ id: x.key, ...x.val() }) })
    set예시(false); set코드(c); set현장(s.val()); set줄들(rows); set화면('site')
    기억(c, s.val().name)
    if (params.get('c') !== c) setParams({ c }, { replace: true })
  }
  async function 열기(c, pw) {
    set오류(''); set바쁨('비밀번호를 확인하는 중입니다…')
    try {
      const fb = await loadFb()
      const u = await fb.ensureAnon()
      const h = await 비번해시(c, pw)
      await fb.set(fb.ref(fb.db, `cost_keys/${c}/${u.uid}`), h)
      await 불러오기(c)
    } catch (e) {
      set오류(막힘(e) ? '현장 코드나 비밀번호가 맞지 않습니다.' : '열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }
  async function 만들기(v) {
    set오류(''); set바쁨('현장을 만드는 중입니다…')
    try {
      const fb = await loadFb()
      const u = await fb.ensureAnon()
      let c = '', h = ''
      for (let i = 0; i < 4 && !c; i++) {
        const t = 코드만들기()
        const th = await 비번해시(t, v.pw)
        try { await fb.set(fb.ref(fb.db, `cost_pins/${t}`), th); c = t; h = th } catch (e) { if (!막힘(e)) throw e }
      }
      if (!c) throw new Error('코드')
      await fb.set(fb.ref(fb.db, `cost_keys/${c}/${u.uid}`), h)
      const site = { name: v.name.trim(), total: 숫자만(v.total), at: Date.now() }
      if (숫자만(v.budget) > 0) site.budget = 숫자만(v.budget)
      if (v.start) site.start = v.start
      if (v.end) site.end = v.end
      await fb.set(fb.ref(fb.db, `cost_sites/${c}`), site)
      set코드(c); set현장(site); set줄들([]); set예시(false); set화면('made')
      기억(c, site.name)
      setParams({ c }, { replace: true })
    } catch (e) {
      set오류('현장을 만들지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }
  const 예시보기 = () => {
    const { site, rows } = 예시현장()
    set예시(true); set코드('EXAMPLE00'); set현장(site); set줄들(rows); set화면('site'); set오류('')
  }
  const 나가기 = () => { set현장(null); set줄들([]); set예시(false); set화면('home'); setParams({}, { replace: true }) }

  /* 적기·고치기·지우기 */
  async function 줄저장(row, id) {
    if (예시) {
      if (id) set줄들((v) => v.map((x) => (x.id === id ? { ...row, id } : x)))
      else set줄들((v) => [...v, { ...row, id: 'n' + Date.now() }])
      return true
    }
    try {
      const fb = await loadFb()
      if (id) { await fb.set(fb.ref(fb.db, `cost_rows/${코드}/${id}`), row); set줄들((v) => v.map((x) => (x.id === id ? { ...row, id } : x))) }
      else { const r = fb.push(fb.ref(fb.db, `cost_rows/${코드}`)); await fb.set(r, row); set줄들((v) => [...v, { ...row, id: r.key }]) }
      return true
    } catch (e) { set오류(막힘(e) ? '이 브라우저는 이 현장에 쓸 수 없습니다 — 다시 열어 비밀번호를 넣어 주십시오.' : '저장하지 못했습니다 — 인터넷을 확인해 주십시오.'); return false }
  }
  async function 줄지우기(id) {
    if (예시) { set줄들((v) => v.filter((x) => x.id !== id)); return }
    try { const fb = await loadFb(); await fb.remove(fb.ref(fb.db, `cost_rows/${코드}/${id}`)); set줄들((v) => v.filter((x) => x.id !== id)) }
    catch (e) { set오류('지우지 못했습니다 — 인터넷을 확인해 주십시오.') }
  }
  async function 현장저장(site) {
    if (예시) { set현장(site); return true }
    try { const fb = await loadFb(); await fb.set(fb.ref(fb.db, `cost_sites/${코드}`), site); set현장(site); 기억(코드, site.name); return true }
    catch (e) { set오류('현장 정보를 저장하지 못했습니다.'); return false }
  }
  async function 현장지우기() {
    try {
      const fb = await loadFb()
      await fb.remove(fb.ref(fb.db, `cost_rows/${코드}`))
      await fb.remove(fb.ref(fb.db, `cost_sites/${코드}`))
      잊기(코드); 나가기()
    } catch (e) { set오류('지우지 못했습니다.') }
  }
  const 새로고침 = async () => { if (예시) return; set바쁨('다시 불러오는 중…'); try { await 불러오기(코드) } catch (e) { set오류('불러오지 못했습니다.') } finally { set바쁨('') } }

  return (
    <div className="wrap tp">
      {화면 !== 'site' && (
        <div className="card">
          <h1 className="tl-h1" style={{ marginTop: 0 }}>🏗 현장 투입비 <span className="count">· 공사일보 간소판</span></h1>
          <div className="note sm">
            <b>총공사금액 대비 지금까지 얼마 들었나</b> — 그것만 봅니다. 날짜·구분·내용·금액만 적으면
            누적 투입비 · 투입률 · 남은 금액 · 공기와 견줌 · 구분별 · 월별이 저절로 나오고 엑셀로 받습니다.
          </div>
          <div className="pdfsafe">
            🔑 회원가입 없음 · 무료. 현장을 만들면 <b>현장 코드 + 비밀번호</b>가 생기고, 그걸 아는 사람만 봅니다.
            근로자 명단 · 주민번호 · 계좌는 <b>받지 않습니다</b>.
          </div>
        </div>
      )}
      {바쁨 && <div className="card tp-busy">⏳ {바쁨}</div>}
      {오류 && <div className="card dx3-err">{오류}</div>}

      {화면 === 'home' && (
        <>
          <div className="card">
            <div className="tp-start">
              <button type="button" className="btn" onClick={() => { set오류(''); set화면('new') }}>＋ 새 현장 만들기</button>
              <button type="button" className="btn ghost" onClick={() => { set오류(''); set코드(''); set화면('open') }}>🔑 현장 열기 (코드 + 비밀번호)</button>
            </div>
            <div className="tlx-ex" style={{ marginTop: 10, marginBottom: 0 }}>
              <span className="tlx-exd"><b>🧪 예시로 해 보기</b> — 가상 현장(총공사금액 12억 5천)에 7개월치를 적어 둔 모습입니다. 저장되지 않습니다.</span>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={예시보기}>예시 현장 보기</button>
            </div>
          </div>
          {목록.length > 0 && (
            <div className="card">
              <div className="detail-h">이 기기에서 열어 본 현장</div>
              <div className="tp-mine">
                {목록.map((x) => (
                  <div key={x.c} className="tp-mrow">
                    <button type="button" className="tp-mopen" onClick={() => 열어보기(x.c)}><b>{x.n}</b><span>{코드보기(x.c)}</span></button>
                    <button type="button" className="chip" onClick={() => 잊기(x.c)} title="이 목록에서만 뺍니다 (현장은 그대로)">목록에서 빼기</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Guide />
        </>
      )}
      {화면 === 'new' && <NewSite onDone={만들기} onBack={() => set화면('home')} busy={!!바쁨} />}
      {화면 === 'open' && <OpenSite code0={코드} onOpen={열기} onBack={() => set화면('home')} busy={!!바쁨} />}
      {화면 === 'made' && (
        <div className="card tp-made">
          <div className="detail-h">✅ 현장을 만들었습니다</div>
          <div className="tp-code">{코드보기(코드)}</div>
          <p className="tl-p">이 <b>현장 코드</b>와 정하신 <b>비밀번호</b>를 꼭 적어 두십시오. 현장 사람에게 알려 주면 같이 적을 수 있습니다.
            <br /><span className="muted">비밀번호는 저희도 모릅니다(해시만 둡니다) — 잊으시면 찾아 드릴 수 없습니다. 이 기기에서는 다시 묻지 않습니다.</span></p>
          <ShareLink code={코드} />
          <button type="button" className="btn" onClick={() => set화면('site')}>현장으로 가기 →</button>
        </div>
      )}
      {화면 === 'site' && 현장 && (
        <Site 코드={코드} 현장={현장} 줄들={줄들} 예시={예시}
              줄저장={줄저장} 줄지우기={줄지우기} 현장저장={현장저장} 현장지우기={현장지우기}
              새로고침={새로고침} 나가기={나가기} />
      )}

      <div className="card no-print">
        <div className="navrow">
          <Link className="navi" to="/tools">🧰 다른 도구</Link>
          <Link className="navi" to="/forms">📄 건설 서식</Link>
          <Link className="navi" to="/change">📐 설계변경</Link>
        </div>
      </div>
    </div>
  )
}

function Guide() {
  return (
    <div className="card">
      <div className="detail-h">이렇게 씁니다</div>
      <ol className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
        <li><b>새 현장 만들기</b> — 현장명 · 총공사금액(도급액) · (있으면) 실행예산 · 공사기간 · 비밀번호</li>
        <li>생긴 <b>현장 코드</b>를 현장 사람과 나눕니다. 코드 + 비밀번호로 폰·PC 어디서든 엽니다</li>
        <li>돈이 나갈 때마다 <b>날짜 · 구분 · 내용 · 금액</b>을 적습니다 (인부 5인 × 187,000 처럼 수량×단가도 됩니다)</li>
        <li>누적 투입비 · 투입률 · 남은 금액 · <b>공기 경과율과 견줌</b> · 구분별 · 월별이 저절로 나옵니다. 엑셀로 받고 인쇄합니다</li>
      </ol>
    </div>
  )
}

function ShareLink({ code }) {
  const [복사, set복사] = useState(false)
  const url = `https://k-conmap.com/tools/tuipbi?c=${code}`
  const 복사하기 = async () => { try { await navigator.clipboard.writeText(`K-건설맵 현장 투입비\n현장 코드 ${코드보기(code)}\n${url}\n(비밀번호는 따로 알려 드립니다)`); set복사(true); setTimeout(() => set복사(false), 2000) } catch (e) { /* 막힌 브라우저 */ } }
  return (
    <div className="tp-share">
      <code>{url}</code>
      <button type="button" className="chip" onClick={복사하기}>{복사 ? '✅ 복사했습니다' : '📋 코드·주소 복사'}</button>
    </div>
  )
}

function NewSite({ onDone, onBack, busy }) {
  const [v, setV] = useState({ name: '', total: '', budget: '', start: '', end: '', pw: '', pw2: '' })
  const f = (k) => (e) => setV({ ...v, [k]: k === 'total' || k === 'budget' ? 쉼표칸(e.target.value) : e.target.value })
  const 틀림 = !v.name.trim() ? '현장명을 적어 주십시오'
    : !(숫자만(v.total) > 0) ? '총공사금액을 적어 주십시오'
      : v.pw.length < 6 ? '비밀번호는 6자 이상'
        : v.pw !== v.pw2 ? '비밀번호가 서로 다릅니다'
          : v.start && v.end && v.end <= v.start ? '준공일이 착공일보다 뒤여야 합니다' : ''
  return (
    <div className="card">
      <div className="detail-h">＋ 새 현장 만들기</div>
      <div className="tp-form">
        <label>현장명 <input value={v.name} onChange={f('name')} maxLength={60} placeholder="예: ○○지구 배수개선공사" /></label>
        <label>총공사금액 (도급액, 원) <input value={v.total} onChange={f('total')} inputMode="numeric" placeholder="예: 1,250,000,000" />
          {숫자만(v.total) > 0 && <span className="tp-hint">{억만(숫자만(v.total))} 원</span>}</label>
        <label>실행예산 (선택) <input value={v.budget} onChange={f('budget')} inputMode="numeric" placeholder="있으면 — 실행 대비 투입률도 봅니다" />
          {숫자만(v.budget) > 0 && <span className="tp-hint">{억만(숫자만(v.budget))} 원</span>}</label>
        <div className="tp-two">
          <label>착공일 (선택) <input type="date" value={v.start} onChange={f('start')} /></label>
          <label>준공일 (선택) <input type="date" value={v.end} onChange={f('end')} /></label>
        </div>
        <div className="tp-two">
          <label>비밀번호 (6자 이상) <input type="password" value={v.pw} onChange={f('pw')} autoComplete="new-password" /></label>
          <label>비밀번호 한 번 더 <input type="password" value={v.pw2} onChange={f('pw2')} autoComplete="new-password" /></label>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>공사기간을 넣으면 «공기는 몇 % 지났는데 투입비는 몇 %» 를 견줘 드립니다.</div>
      </div>
      {틀림 && (v.name || v.total || v.pw) && <div className="tp-warn">{틀림}</div>}
      <div className="tp-start" style={{ marginTop: 12 }}>
        <button type="button" className="btn" disabled={!!틀림 || busy} onClick={() => onDone(v)}>현장 만들기</button>
        <button type="button" className="btn ghost" onClick={onBack}>← 돌아가기</button>
      </div>
    </div>
  )
}

function OpenSite({ code0, onOpen, onBack, busy }) {
  const [c, setC] = useState(code0 ? 코드보기(code0) : '')
  const [pw, setPw] = useState('')
  const cc = 코드정리(c)
  return (
    <div className="card">
      <div className="detail-h">🔑 현장 열기</div>
      <div className="tp-form">
        <label>현장 코드 (9자리) <input value={c} onChange={(e) => setC(e.target.value.toUpperCase())} placeholder="예: K7F-3Q9-2MX" maxLength={11} autoCapitalize="characters" /></label>
        <label>비밀번호 <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && cc.length === 9 && pw) onOpen(cc, pw) }} /></label>
      </div>
      <div className="tp-start" style={{ marginTop: 12 }}>
        <button type="button" className="btn" disabled={cc.length !== 9 || !pw || busy} onClick={() => onOpen(cc, pw)}>열기</button>
        <button type="button" className="btn ghost" onClick={onBack}>← 돌아가기</button>
      </div>
    </div>
  )
}

/* ── 현장 화면 ─────────────────────────────── */
function Site({ 코드, 현장, 줄들, 예시, 줄저장, 줄지우기, 현장저장, 현장지우기, 새로고침, 나가기 }) {
  const S = useMemo(() => 요약(현장, 줄들), [현장, 줄들])
  const [고침, set고침] = useState(null)           // 고칠 줄
  const [정보, set정보] = useState(false)
  const [달, set달] = useState('')                 // 목록 거르기
  const [가름, set가름] = useState('')
  const [더, set더] = useState(60)
  const 달들 = useMemo(() => [...new Set(줄들.map((r) => (r.d || '').slice(0, 7)))].filter(Boolean).sort().reverse(), [줄들])
  const 보일줄 = useMemo(() => [...줄들]
    .filter((r) => (!달 || (r.d || '').startsWith(달)) && (!가름 || r.k === 가름))
    .sort((a, b) => (a.d === b.d ? (b.at || 0) - (a.at || 0) : a.d < b.d ? 1 : -1)), [줄들, 달, 가름])
  const 거른합 = 보일줄.reduce((s, r) => s + (Number(r.amt) || 0), 0)
  const 받기 = () => {
    const bytes = 엑셀(현장, 줄들, 예시 ? '' : 코드)
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const a = document.createElement('a')
    a.href = url; a.download = `투입비_${현장.name.replace(/[^0-9A-Za-z가-힣 ()_.-]/g, '').trim().slice(0, 40) || '현장'}_${오늘()}.xlsx`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
  const 차이 = Number.isFinite(S.경과율) && Number.isFinite(S.투입률) ? S.투입률 - S.경과율 : null
  return (
    <>
      {예시 && <div className="card tp-ex no-print">🧪 <b>예시 현장입니다</b> — 이름·금액 모두 지어낸 것이고, 적거나 지워도 저장되지 않습니다. <button type="button" className="chip" onClick={나가기}>처음으로</button></div>}
      <div className="card">
        <div className="tp-head">
          <div>
            <h1 className="tp-name">{현장.name}</h1>
            <div className="tp-sub">
              {!예시 && <>현장 코드 <b>{코드보기(코드)}</b> · </>}
              {현장.start && 현장.end ? <>공사기간 {현장.start} ~ {현장.end}{S.남은날 != null && S.남은날 >= 0 ? ` · 준공까지 ${S.남은날}일` : ''}</> : '공사기간 미입력'}
              {' '}· 적은 것 {원(S.건수)}건
            </div>
          </div>
          <div className="tp-acts no-print">
            <button type="button" className="chip" onClick={받기}>📥 엑셀</button>
            <button type="button" className="chip" onClick={() => window.print()}>🖨 인쇄</button>
            {!예시 && <button type="button" className="chip" onClick={새로고침}>↻ 새로고침</button>}
            <button type="button" className="chip" onClick={() => set정보(!정보)}>✏️ 현장 정보</button>
            <button type="button" className="chip" onClick={나가기}>나가기</button>
          </div>
        </div>
        {정보 && <SiteInfo 현장={현장} 코드={코드} 예시={예시} onSave={async (s) => { if (await 현장저장(s)) set정보(false) }} onDelete={현장지우기} />}

        <div className="tp-tiles">
          <div className="tp-tile"><span>총공사금액</span><b>{억만(현장.total)}</b><i>{원(현장.total)} 원</i></div>
          <div className="tp-tile main"><span>누적 투입비</span><b>{억만(S.누적)}</b><i>{원(S.누적)} 원</i></div>
          <div className="tp-tile"><span>투입률</span><b>{퍼센트(S.투입률)}</b><i>총공사금액 대비</i></div>
          <div className={'tp-tile' + (S.남은 < 0 ? ' bad' : '')}><span>남은 금액</span><b>{억만(S.남은)}</b><i>총공사금액 − 누적</i></div>
        </div>
        <div className="tp-bars">
          <Bar 이름="투입률" v={S.투입률} 글={퍼센트(S.투입률)} cls="in" />
          {Number.isFinite(S.경과율) && <Bar 이름="공기 경과" v={S.경과율} 글={`${퍼센트(S.경과율)}`} cls="time" />}
          {현장.budget > 0 && <Bar 이름="실행 대비" v={S.실행률} 글={`${퍼센트(S.실행률)} · 남은 ${억만(S.실행남은)}`} cls="bud" />}
        </div>
        {차이 !== null && (
          <div className={'tp-say' + (차이 > 0.05 ? ' warn' : '')}>
            {Math.abs(차이) <= 0.05
              ? <>공기는 <b>{퍼센트(S.경과율)}</b> 지났고 투입비는 <b>{퍼센트(S.투입률)}</b> 들었습니다 — 비슷하게 가고 있습니다.</>
              : 차이 > 0
                ? <>⚠️ 투입비가 공기보다 <b>{(차이 * 100).toFixed(1)}%p 빠릅니다</b> (공기 {퍼센트(S.경과율)} · 투입 {퍼센트(S.투입률)}). 남은 공정에 비해 돈이 먼저 나가고 있는지 보십시오.</>
                : <>투입비가 공기보다 <b>{(-차이 * 100).toFixed(1)}%p 느립니다</b> (공기 {퍼센트(S.경과율)} · 투입 {퍼센트(S.투입률)}). 아직 안 적은 지출(외주 기성·자재 대금)이 없는지 보십시오.</>}
          </div>
        )}
        <div className="tp-mini">
          <span>이번 달 <b>{억만(S.이번달)}</b></span>
          <span>오늘 <b>{억만(S.오늘치)}</b></span>
        </div>
      </div>

      <Entry key={고침 ? 고침.id : 'new'} 고침={고침} 예시={예시}
             onSave={async (row) => { const ok = await 줄저장(row, 고침 && 고침.id); if (ok) set고침(null); return ok }}
             onCancel={() => set고침(null)} />

      <div className="card">
        <div className="detail-h">구분별</div>
        <div className="tp-stack">
          {구분.map((c) => S.누적 > 0 && S.구분합[c.k] > 0 && (
            <div key={c.k} style={{ width: (S.구분합[c.k] / S.누적) * 100 + '%', background: c.색 }} title={`${c.이름} ${퍼센트(S.구분합[c.k] / S.누적)}`} />
          ))}
        </div>
        <table className="tbl tp-kt">
          <tbody>
            {구분.map((c) => (
              <tr key={c.k}>
                <td><span className="tp-dot" style={{ background: c.색 }} />{c.이름}</td>
                <td className="r">{원(S.구분합[c.k])} 원</td>
                <td className="r muted">{S.누적 > 0 ? 퍼센트(S.구분합[c.k] / S.누적) : '—'}</td>
                <td className="r muted">{현장.total > 0 ? '총액의 ' + 퍼센트(S.구분합[c.k] / 현장.total) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {S.월별.length > 0 && (
        <div className="card">
          <div className="detail-h">월별</div>
          <div className="tp-scroll">
            <table className="tbl tp-mt">
              <thead><tr><th>월</th>{구분.map((c) => <th key={c.k}>{c.이름}</th>)}<th>월 합계</th><th>누적</th><th>투입률</th></tr></thead>
              <tbody>
                {S.월별.map((m) => (
                  <tr key={m.ym}>
                    <td>{m.ym}</td>
                    {구분.map((c) => <td key={c.k} className="r">{m[c.k] ? 원(m[c.k]) : ''}</td>)}
                    <td className="r"><b>{원(m.합)}</b></td>
                    <td className="r">{원(m.누적)}</td>
                    <td className="r">{퍼센트(m.률)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="tp-lh">
          <div className="detail-h" style={{ margin: 0 }}>적은 것</div>
          <select value={달} onChange={(e) => set달(e.target.value)} className="no-print">
            <option value="">모든 달</option>
            {달들.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={가름} onChange={(e) => set가름(e.target.value)} className="no-print">
            <option value="">모든 구분</option>
            {구분.map((c) => <option key={c.k} value={c.k}>{c.이름}</option>)}
          </select>
          <span className="muted" style={{ fontSize: 13 }}>{원(보일줄.length)}건 · <b>{원(거른합)}</b> 원</span>
        </div>
        {보일줄.length === 0 ? <div className="muted" style={{ padding: '10px 0' }}>아직 적은 것이 없습니다. 위 «적기» 칸에 첫 줄을 적어 보십시오.</div> : (
          <div className="tp-scroll">
            <table className="tbl tp-rt">
              <thead><tr><th>날짜</th><th>구분</th><th>내용</th><th>수량 × 단가</th><th>금액</th><th className="no-print" /></tr></thead>
              <tbody>
                {보일줄.slice(0, 더).map((r) => (
                  <tr key={r.id}>
                    <td className="nw c-d">{r.d}</td>
                    <td className="nw c-k"><span className="tp-dot" style={{ background: (구분.find((c) => c.k === r.k) || {}).색 }} />{구분이름[r.k]}</td>
                    <td className="c-t">{r.t}{r.by ? <span className="muted"> · {r.by}</span> : null}</td>
                    <td className="r muted nw c-q">{r.q != null && r.u != null ? `${원(r.q)} × ${원(r.u)}` : ''}</td>
                    <td className="r nw c-a"><b>{원(r.amt)}</b></td>
                    <td className="nw no-print c-x">
                      <button type="button" className="tp-x" onClick={() => { set고침(r); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>고치기</button>
                      <button type="button" className="tp-x" onClick={() => { if (window.confirm(`${r.d} ${구분이름[r.k]} ${원(r.amt)}원 줄을 지울까요?`)) 줄지우기(r.id) }}>지우기</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {보일줄.length > 더 && <button type="button" className="chip no-print" style={{ marginTop: 8 }} onClick={() => set더(더 + 200)}>더 보기 ({원(보일줄.length - 더)}건 더)</button>}
      </div>
    </>
  )
}

function Bar({ 이름, v, 글, cls }) {
  const w = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0
  return (
    <div className="tp-bar">
      <span className="tp-bl">{이름}</span>
      <div className="tp-bt"><div className={'tp-bf ' + cls + (v > 1 ? ' over' : '')} style={{ width: w * 100 + '%' }} /></div>
      <span className="tp-bv">{글}</span>
    </div>
  )
}

/* 적기 — 날짜 · 구분 · 내용 · 금액(또는 수량 × 단가) */
function Entry({ 고침, onSave, onCancel, 예시 }) {
  const [d, setD] = useState(고침 ? 고침.d : 오늘())
  const [k, setK] = useState(고침 ? 고침.k : 'L')
  const [t, setT] = useState(고침 ? 고침.t || '' : '')
  const [곱, set곱] = useState(!!(고침 && 고침.q != null))
  const [q, setQ] = useState(고침 && 고침.q != null ? String(고침.q) : '')
  const [u, setU] = useState(고침 && 고침.u != null ? 원(고침.u) : '')
  const [amt, setAmt] = useState(고침 ? 원(고침.amt) : '')
  const [by, setBy] = useState(() => (고침 ? 고침.by || '' : 읽기(이름키, '')))
  const [saving, setSaving] = useState(false)
  const 금액 = 곱 ? Math.round((Number(String(q).replace(/[^0-9.]/g, '')) || 0) * 숫자만(u)) : 숫자만(amt)
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(d) && 금액 !== 0 && Math.abs(금액) <= 1e11
  const 저장 = async () => {
    if (!ok || saving) return
    setSaving(true)
    const row = { d, k, amt: 금액, at: Date.now() }
    if (t.trim()) row.t = t.trim().slice(0, 100)
    if (곱) { row.q = Number(String(q).replace(/[^0-9.]/g, '')) || 0; row.u = 숫자만(u) }
    if (by.trim()) { row.by = by.trim().slice(0, 20); 쓰기(이름키, row.by) }
    const done = await onSave(row)
    setSaving(false)
    if (done && !고침) { setT(''); setQ(''); setU(''); setAmt('') }
  }
  return (
    <div className="card no-print tp-entry">
      <div className="detail-h">{고침 ? '✏️ 고치기' : '✍️ 적기'}{예시 && <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · 예시라 저장되지 않습니다</span>}</div>
      <div className="tp-kinds">
        {구분.map((c) => (
          <button type="button" key={c.k} className={'chip' + (k === c.k ? ' on' : '')} onClick={() => setK(c.k)}>
            <span className="tp-dot" style={{ background: c.색 }} />{c.이름}
          </button>
        ))}
      </div>
      <div className="tp-erow">
        <label className="tp-d">날짜 <input type="date" value={d} onChange={(e) => setD(e.target.value)} /></label>
        <label className="tp-t">내용 <input value={t} onChange={(e) => setT(e.target.value)} maxLength={100}
          placeholder={k === 'L' ? '예: 형틀목공 5인' : k === 'M' ? '예: 레미콘 25-24-150 30㎥' : k === 'E' ? '예: 굴착기 0.7㎥ 1일' : k === 'S' ? '예: 방수공사 1회 기성' : '예: 안전용품'} /></label>
      </div>
      <div className="tp-erow">
        <label className="tp-chk"><input type="checkbox" checked={곱} onChange={(e) => set곱(e.target.checked)} /> 수량 × 단가로 적기</label>
        {곱 ? (
          <>
            <label className="tp-n">수량 <input value={q} onChange={(e) => setQ(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="5" /></label>
            <label className="tp-n">단가 <input value={u} onChange={(e) => setU(쉼표칸(e.target.value))} inputMode="numeric" placeholder="187,000" /></label>
            <span className="tp-sum">= <b>{원(금액)}</b> 원</span>
          </>
        ) : (
          <label className="tp-a">금액 (원) <input value={amt} onChange={(e) => setAmt(쉼표칸(e.target.value))} inputMode="numeric" placeholder="예: 935,000"
            onKeyDown={(e) => { if (e.key === 'Enter') 저장() }} />{금액 > 0 && <span className="tp-hint">{억만(금액)} 원</span>}</label>
        )}
        <label className="tp-by">적은 사람 (선택) <input value={by} onChange={(e) => setBy(e.target.value)} maxLength={20} placeholder="예: 공무 김" /></label>
      </div>
      <div className="tp-start">
        <button type="button" className="btn" disabled={!ok || saving} onClick={저장}>{saving ? '저장 중…' : 고침 ? '고친 것 저장' : '적기'}</button>
        {고침 && <button type="button" className="btn ghost" onClick={onCancel}>그만두기</button>}
      </div>
    </div>
  )
}

function SiteInfo({ 현장, 코드, 예시, onSave, onDelete }) {
  const [v, setV] = useState({ name: 현장.name, total: 원(현장.total), budget: 현장.budget ? 원(현장.budget) : '', start: 현장.start || '', end: 현장.end || '' })
  const [지움, set지움] = useState('')
  const f = (k) => (e) => setV({ ...v, [k]: k === 'total' || k === 'budget' ? 쉼표칸(e.target.value) : e.target.value })
  const 저장 = () => {
    const s = { name: v.name.trim() || 현장.name, total: 숫자만(v.total), at: 현장.at || Date.now(), upd: Date.now() }
    if (숫자만(v.budget) > 0) s.budget = 숫자만(v.budget)
    if (v.start) s.start = v.start
    if (v.end) s.end = v.end
    onSave(s)
  }
  return (
    <div className="tp-info no-print">
      <div className="tp-form">
        <label>현장명 <input value={v.name} onChange={f('name')} maxLength={60} /></label>
        <div className="tp-two">
          <label>총공사금액 (원) <input value={v.total} onChange={f('total')} inputMode="numeric" /></label>
          <label>실행예산 (선택) <input value={v.budget} onChange={f('budget')} inputMode="numeric" /></label>
        </div>
        <div className="tp-two">
          <label>착공일 <input type="date" value={v.start} onChange={f('start')} /></label>
          <label>준공일 <input type="date" value={v.end} onChange={f('end')} /></label>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>설계변경으로 도급액이 바뀌면 총공사금액만 고치십시오 — 투입률이 새 금액으로 다시 셈됩니다.</div>
      </div>
      <div className="tp-start" style={{ marginTop: 8 }}>
        <button type="button" className="btn" disabled={!(숫자만(v.total) > 0)} onClick={저장}>저장</button>
      </div>
      {!예시 && (
        <>
          <ShareLink code={코드} />
          <details className="tp-del">
            <summary>현장 지우기</summary>
            <div className="tl-p">적은 것까지 <b>모두 지워지고 되돌릴 수 없습니다</b>. 지우시려면 현장명 «{현장.name}» 을 그대로 적어 주십시오.</div>
            <input value={지움} onChange={(e) => set지움(e.target.value)} placeholder={현장.name} />
            <button type="button" className="btn ghost" disabled={지움 !== 현장.name} onClick={onDelete}>영영 지우기</button>
          </details>
        </>
      )}
    </div>
  )
}
