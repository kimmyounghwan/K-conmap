/* ══════════════════════════════════════════════════════════════
   장부문.jsx — «코드 + 비밀번호» 장부의 문간 화면들 (2026-09-29)
     새 장부 · 코드로 열기 · 만들었음 · 이 기기에서 연 장부 · 잠금 풀기
   쓰는 곳: 🚜 /tools/equip (EquipBook.jsx) · ⚠️ /tools/risk (RiskBook.jsx)
   저장은 lib/장부.js · 모양은 styles.css «eq-» (두 프로그램이 같이 씀)
   ══════════════════════════════════════════════════════════════ */
import { useState } from 'react'
import { 코드정리, 코드보기 } from '../lib/tuipbi.js'

/** 받침 따라 을/를 — «상호를» · «현장명을» */
export const 을를 = (w) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '을' : '를' }

/** 칸들: [{k, 이름, 힌트?, 필수?, 최대?, 보기?}] — 둘씩 한 줄 */
export function 새장부({ 제목 = '➕ 새 장부', 칸들, 오류, 만들기, 뒤로 }) {
  const [v, setV] = useState(() => Object.fromEntries([...칸들.map((x) => [x.k, '']), ['pw', ''], ['pw2', '']]))
  const 빠짐 = 칸들.find((x) => x.필수 && !String(v[x.k] || '').trim())
  const 틀림 = 빠짐 ? `${빠짐.이름}${을를(빠짐.이름)} 적어 주십시오` : v.pw.length < 6 ? '비밀번호는 6자 이상' : v.pw !== v.pw2 ? '비밀번호 두 칸이 다릅니다' : ''
  const 줄들 = []
  for (let i = 0; i < 칸들.length; i += (칸들[i].넓게 ? 1 : 2)) 줄들.push(칸들[i].넓게 ? [칸들[i]] : 칸들.slice(i, i + 2).filter((x) => !x.넓게))
  return (
    <div className="eq">
      <div className="card">
        <button className="btn ghost sm" onClick={뒤로}>← 처음으로</button>
        <h2 style={{ margin: '10px 0 8px', fontSize: 18 }}>{제목}</h2>
        {줄들.map((줄, i) => (
          <div key={i} className={줄.length > 1 ? 'eq-2' : ''}>
            {줄.map((x) => (
              <div className="field" key={x.k}><label>{x.이름}{x.힌트 ? <span className="hint"> {x.힌트}</span> : null}</label>
                <input value={v[x.k]} maxLength={x.최대 || 40} placeholder={x.보기 || ''} onChange={(e) => setV({ ...v, [x.k]: e.target.value })} /></div>
            ))}
          </div>
        ))}
        <div className="eq-2">
          <div className="field"><label>비밀번호 <span className="hint">6자 이상</span></label><input type="password" value={v.pw} onChange={(e) => setV({ ...v, pw: e.target.value })} /></div>
          <div className="field"><label>한 번 더</label><input type="password" value={v.pw2} onChange={(e) => setV({ ...v, pw2: e.target.value })} /></div>
        </div>
        <p className="note sm">⚠️ 비밀번호는 저희도 모릅니다 — 잊으면 되찾아 드릴 수 없습니다. 적어 두십시오.</p>
        {오류 && <div className="err" style={{ marginBottom: 8 }}>{오류}</div>}
        <button className="btn primary" disabled={!!틀림} onClick={() => 만들기(v)}>{틀림 || '장부 만들기'}</button>
      </div>
    </div>
  )
}

export function 열기칸({ 제목 = '🔑 장부 열기', 코드0, 오류, 열기, 뒤로 }) {
  const [c, setC] = useState(코드보기(코드0 || ''))
  const [pw, setPw] = useState('')
  const cc = 코드정리(c)
  return (
    <div className="eq">
      <div className="card">
        <button className="btn ghost sm" onClick={뒤로}>← 처음으로</button>
        <h2 style={{ margin: '10px 0 8px', fontSize: 18 }}>{제목}</h2>
        <div className="field"><label>장부 코드 <span className="hint">9자리</span></label>
          <input value={c} onChange={(e) => setC(e.target.value)} placeholder="ABC-DEF-GHJ" autoCapitalize="characters" /></div>
        <div className="field"><label>비밀번호</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && cc.length === 9 && pw) 열기(cc, pw) }} /></div>
        {오류 && <div className="err" style={{ marginBottom: 8 }}>{오류}</div>}
        <button className="btn primary" disabled={cc.length !== 9 || !pw} onClick={() => 열기(cc, pw)}>열기</button>
      </div>
    </div>
  )
}

export function 만들었음({ 코드, 이름, 열기 }) {
  const [복사, set복사] = useState(false)
  return (
    <div className="eq">
      <div className="card">
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>✅ «{이름}» 장부를 만들었습니다</h2>
        <div className="eq-code">{코드보기(코드)}</div>
        <p className="muted">이 <b>장부 코드</b>와 비밀번호를 적어 두십시오. 다른 기기에서는 이 둘로 엽니다. 이 기기는 다음부터 바로 열립니다.</p>
        <div className="btn-row">
          <button className="btn" onClick={() => navigator.clipboard?.writeText(코드보기(코드)).then(() => set복사(true)).catch(() => {})}>{복사 ? '✓ 복사했습니다' : '📋 코드 복사'}</button>
          <button className="btn primary" onClick={열기}>장부 열기 →</button>
        </div>
      </div>
    </div>
  )
}

export function 연장부목록({ 목록, 고름 }) {
  if (!목록.length) return null
  return (
    <>
      <div className="sec-title" style={{ margin: '14px 0 6px' }}>이 기기에서 연 장부</div>
      {목록.map((x) => (
        <button key={x.c} className="row eq-rowbtn" onClick={() => 고름(x.c)}>
          <div className="grow"><div className="t">{x.n}</div><div className="d">{코드보기(x.c)}</div></div>
          <span className="r">열기 ›</span>
        </button>
      ))}
    </>
  )
}

/** 이 기기에 잠금 열쇠가 없을 때 — 비밀번호 한 번 */
export function 잠금풀칸({ 풀기 }) {
  const [pw, setPw] = useState('')
  const [틀, set틀] = useState(false)
  const 누름 = async () => { set틀(false); if (!(await 풀기(pw))) set틀(true) }
  return (
    <div className="eq-2">
      <div className="field"><label>비밀번호 <span className="hint">이 기기에서 잠금을 풉니다</span></label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && pw) 누름() }} /></div>
      <div className="field"><label>&nbsp;</label><button className="btn" disabled={!pw} onClick={누름}>🔓 잠금 풀기</button>
        {틀 && <div className="err sm">비밀번호가 맞지 않습니다</div>}</div>
    </div>
  )
}

/** 장부 코드 · 잊기 · 장부 지우기 · 휴지통 — 두 프로그램 «장부 정보» 아래쪽 */
export function 코드와휴지통({ 코드, 예시, 정보, 휴지통, 휴지통날, 이름보기, 되살리기, 잊기, 장부지우기 }) {
  const [복사, set복사] = useState(false)
  const 통 = Object.entries(휴지통 || {}).sort((a, b) => (b[1].at || 0) - (a[1].at || 0))
  return (
    <>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>🔑 장부 코드</div>
        <div className="eq-code">{코드보기(코드)}</div>
        <p className="muted" style={{ marginTop: 6 }}>이 코드와 비밀번호를 아는 사람은 누구나 이 장부를 보고 적습니다.</p>
        <div className="btn-row">
          <button className="btn" onClick={() => navigator.clipboard?.writeText(코드보기(코드)).then(() => set복사(true)).catch(() => {})}>{복사 ? '✓ 복사했습니다' : '📋 코드 복사'}</button>
          {!예시 && <button className="btn ghost" onClick={잊기}>이 기기에서 잊기</button>}
          {!예시 && !정보.del && <button className="btn ghost" onClick={() => { if (window.confirm(`이 장부를 지울까요?\n${휴지통날}일 안에는 되살릴 수 있습니다.`)) 장부지우기() }}>🗑 장부 지우기</button>}
        </div>
      </div>
      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>🗑 휴지통 <span className="count">· {휴지통날}일 동안 되살릴 수 있습니다</span></div>
        {!통.length ? <div className="muted">비어 있습니다.</div> : 통.map(([t, x]) => (
          <div className="row" key={t}>
            <div className="grow"><div className="t">{이름보기(x)}</div>
              <div className="d">{new Date(x.at).toLocaleString()} 지움</div></div>
            <button className="btn sm" onClick={() => 되살리기(t)}>되살리기</button>
          </div>
        ))}
      </div>
    </>
  )
}
