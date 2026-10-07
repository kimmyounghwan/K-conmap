/**
 * 🏗 현장틀 — 프로그램 위 «현장» 줄 + 고른 현장으로 프로그램을 그리기 (G179 · 2026-10-07)
 *
 * 소장님: 「현장별로 나눠서 쓸 수 있게 해줘」 → 「현장별로... 수정할 것 클로드가 봐서 고쳐줘」
 * 노무비 계산기(pages/Nomubi.jsx · G178)와 같은 모양 · 같은 글.
 *
 *   <현장틀 나={현장나눔('ib')} 머리="|작업일보|" 이름읽기={(id) => 현장명}
 *           새로만들기={(새id, 이름, 지금id, 가져옴) => 첫 자료 쓰기} 가져오기글="회사명 가져오기"(없으면 칸 없음)
 *           안={(id, 현장줄, 이름바뀜) => <프로그램 key={id} … />} />
 *
 * ■ 현장을 바꾸면 안={…} 이 key 로 통째로 새로 그려집니다 — 되돌리기 · 이어 쓰기 상태가 다른 현장에 섞이지 않게.
 * ■ 창(alert · confirm)은 띄우지 않습니다 — «한 번 더 누르기».
 * ■ 숨은 누적: {머리}현장추가 · 현장바꿈 · 현장뺌 · 현장되살림 (+ 가져오기를 고르면 {머리}현장가져옴)
 */
import { useEffect, useState } from 'react'
import { 세기 } from '../lib/받은수.jsx'

export default function 현장틀({ 나, 머리, 이름읽기, 새로만들기, 가져오기글, 가져오기처음 = true, 안 }) {
  const [목록, set목록] = useState(() => 나.목록())
  const [, set판] = useState(0)
  const [새칸, set새칸] = useState(null)          // { 이름, 가져옴 }
  const [뺌물음, set뺌물음] = useState(false)
  const [되살릴, set되살릴] = useState('')
  const [알림, set알림] = useState('')
  const cur = 목록.cur
  const 산 = 목록.L.filter((x) => !x.del)
  const 뺀 = 목록.L.filter((x) => x.del)
  const 이름 = (x) => (x ? (String(이름읽기(x.id) || '').trim() || String(x.n || '').trim() || `현장 ${목록.L.indexOf(x) + 1}`) : '')
  const 지금 = 목록.L.find((x) => x.id === cur)
  /* 다른 창에서 현장을 더하거나 빼면 목록만 따라감 — 이 창이 보고 있는 현장은 그대로 */
  useEffect(() => {
    const f = (e) => {
      if (e.key !== 나.목록열쇠) return
      set목록((m) => { const n = 나.목록(); return n.L.some((x) => x.id === m.cur && !x.del) ? { ...n, cur: m.cur } : n })
    }
    window.addEventListener('storage', f)
    return () => window.removeEventListener('storage', f)
  }, [나])
  useEffect(() => { if (!알림) return undefined; const t = setTimeout(() => set알림(''), 12000); return () => clearTimeout(t) }, [알림])
  const 바꿈 = (m, 글) => { 나.목록쓰기(m); set목록(m); set새칸(null); set뺌물음(false); set알림(글 || '') }
  const 고르기 = (id) => {
    if (!id || id === cur) return
    바꿈({ ...목록, cur: id }, '')
    세기(머리 + '현장바꿈')
  }
  const 만들기 = () => {
    if (!새칸) return
    const 이름글 = 새칸.이름.trim()
    const 가져옴 = !!(가져오기글 && 새칸.가져옴)
    const { m, id } = 나.더하기(목록, 이름글)
    새로만들기(id, 이름글, cur, 가져옴)
    바꿈(m, `새 현장 «${이름글 || `현장 ${m.L.length}`}» 을 만들었습니다${가져옴 ? ` — ${가져오기글.replace(/ 가져오기$/, '')}을(를) 가져왔습니다` : ''}.`)
    세기(머리 + '현장추가')
    if (가져옴) 세기(머리 + '현장가져옴')
  }
  const 빼기 = () => {
    const 글 = 이름(지금)
    바꿈(나.빼기(목록, cur), `«${글}» 현장을 목록에서 뺐습니다 — 자료는 남아 있어 아래 «뺀 현장» 에서 되살릴 수 있습니다.`)
    세기(머리 + '현장뺌')
  }
  const 되살리기 = () => {
    const x = 목록.L.find((y) => y.id === 되살릴)
    if (!x) return
    바꿈(나.되살리기(목록, x.id), `«${이름(x)}» 현장을 되살렸습니다.`)
    set되살릴('')
    세기(머리 + '현장되살림')
  }
  const 현장줄 = (
    <div className="nm-sites no-print">
      <div className="nm-sites-row">
        <b className="nm-sites-h">🏗 현장</b>
        <select className="inp nm-site-sel" value={cur} onChange={(e) => 고르기(e.target.value)} aria-label="현장 고르기">
          {산.map((x) => <option key={x.id} value={x.id}>{이름(x)}</option>)}
        </select>
        <span className="muted nm-sites-n">{산.length}곳</span>
        {!새칸 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { set새칸({ 이름: '', 가져옴: !!가져오기처음 }); set뺌물음(false) }}>＋ 새 현장</button>}
        {산.length > 1 && !새칸 && !뺌물음 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set뺌물음(true)}>이 현장 빼기</button>}
      </div>
      {새칸 && (
        <div className="nm-sites-new">
          <input className="inp" value={새칸.이름} maxLength={60} autoFocus placeholder="새 현장 이름 (예: ○○지구 배수로 정비공사)"
            onChange={(e) => set새칸({ ...새칸, 이름: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') 만들기() }} aria-label="새 현장 이름" />
          {가져오기글 && (
            <label className="nm-chk"><input type="checkbox" checked={새칸.가져옴} onChange={(e) => set새칸({ ...새칸, 가져옴: e.target.checked })} />
              <span>«{이름(지금)}» 의 {가져오기글}</span></label>
          )}
          <div className="nm-sites-btns">
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={만들기}>만들기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set새칸(null)}>그만두기</button>
          </div>
        </div>
      )}
      {뺌물음 && (
        <div className="nm-ask nm-sites-ask">«{이름(지금)}» 현장을 목록에서 뺍니다. 자료는 지우지 않고 남겨 두어 되살릴 수 있습니다.
          <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={빼기}>빼기</button>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set뺌물음(false)}>그대로 두기</button>
        </div>
      )}
      {뺀.length > 0 && (
        <div className="nm-sites-del">
          <span className="muted">🗑 뺀 현장 {뺀.length}곳</span>
          <select className="inp nm-site-sel" value={되살릴} onChange={(e) => set되살릴(e.target.value)} aria-label="되살릴 현장">
            <option value="">고르기</option>
            {뺀.map((x) => <option key={x.id} value={x.id}>{이름(x)}</option>)}
          </select>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!되살릴} onClick={되살리기}>되살리기</button>
        </div>
      )}
      {알림 && <div className="nm-sites-msg" role="status">✓ {알림}</div>}
      <div className="nm-sites-note muted">현장마다 따로 저장됩니다. 🔗 이어 쓰기 코드도 현장마다 따로 겁니다.</div>
    </div>
  )
  return 안(cur, 현장줄, () => set판((n) => n + 1))
}
