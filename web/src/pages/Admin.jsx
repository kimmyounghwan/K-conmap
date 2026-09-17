/* 🛠 관리자 — 소장님만 보는 화면. (2026-09-17)
 *
 * 소장님: 「**글이 올라오면 내가 알 수 있는 페이지가 있으면 좋겠어.
 *          그 페이지에서 글을 쓰면 자동으로 답글이 달리면 더 좋고**」
 *         「메일 보고 내가 관리자 페이지에서 클로드랑 답글 달면 되지」
 *
 * ■ 무엇을 하나 — 딱 둘입니다
 *     ① 사랑방 글을 **답 안 단 것부터** 보여 줍니다
 *     ② 그 자리에서 답글을 답니다 — 「K-건설맵 답변」 으로 바로 붙습니다
 *   사랑방에 들어가 글을 찾아 펼칠 필요가 없습니다.
 *
 * ■ 누가 여나 — **운영자 브라우저만** (Qna.jsx 의 OPS).
 *   ⚠️ 이건 «보안» 이 아니라 «문 앞 이름표» 입니다. 화면 안에서 판정하니까요.
 *      진짜로 막는 것은 서버입니다 — database.rules.json 이 op 를 uid 로 막고 있고,
 *      여기서 보이는 자료(qna·qna_a)는 **어차피 누구나 읽을 수 있는 공개 게시판** 입니다.
 *      즉 이 문이 뚫려도 «남의 글 목록» 을 볼 뿐, 표를 달거나 지울 수는 없습니다.
 *
 * ⚠️ 검색엔진에 올리지 않습니다 — noindex, sitemap 에도 안 넣습니다.
 * ⚠️ 새 주소를 만들었으니 web/firebase.json 의 rewrites 에도 넣었습니다 (8절 16).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton, Empty } from '../components.jsx'
import { nickOf } from '../lib/nickname.js'
import { OPS, isOp } from './Qna.jsx'

/* firebase 는 이 화면을 열 때만 받습니다 (사랑방과 같은 방식) */
let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}

const when = (ms) => {
  if (!ms) return ''
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
const 얼마전 = (ms) => {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000))
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function Admin() {
  const [uid, setUid] = useState(undefined)      // undefined=아직 · ''=못 물어봄
  const [베낌, set베낌] = useState(false)
  const [rows, setRows] = useState(null)
  const [ans, setAns] = useState({})
  const [del, setDel] = useState({})

  useEffect(() => {
    document.title = '관리자 · K-건설맵'
    let el = document.head.querySelector('meta[name="robots"]')
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', 'robots'); document.head.appendChild(el) }
    el.setAttribute('content', 'noindex, nofollow')
    return () => { if (el) el.remove() }
  }, [])

  const load = async () => {
    try {
      const { ref, get, query, orderByKey, limitToLast, db, ensureAnon } = await loadFb()
      const u = await ensureAnon()
      setUid((u && u.uid) || '')
      if (!isOp(u && u.uid)) return
      const [a, b, c] = await Promise.all([
        get(query(ref(db, 'qna'), orderByKey(), limitToLast(300))),
        get(ref(db, 'qna_del')),
        get(ref(db, 'qna_a')),
      ])
      setDel(b.val() || {})
      setAns(c.val() || {})
      const v = a.val() || {}
      setRows(Object.entries(v).map(([id, x]) => ({ id, ...x })).reverse())
    } catch (e) {
      setUid('')
      setRows([])
    }
  }
  useEffect(() => { load() }, [])

  const 답수 = (id) => Object.values(ans[id] || {}).filter((x) => x && !x.deleted).length
  const list = useMemo(() => {
    if (!rows) return null
    const 살아있는 = rows.filter((r) => !r.deleted && !del[r.id])
    /* 답 안 단 것 먼저, 그 안에서는 오래된 것 먼저 — «기다린 사람» 부터 */
    const 안단것 = 살아있는.filter((r) => 답수(r.id) === 0).sort((x, y) => (x.at || 0) - (y.at || 0))
    const 단것 = 살아있는.filter((r) => 답수(r.id) > 0)
    return { 안단것, 단것, 전체: 살아있는.length }
  }, [rows, ans, del])

  if (uid === undefined) return <div className="wrap"><Skeleton n={3} /></div>
  if (!isOp(uid)) {
    return (
      <div className="wrap">
        <div className="card">
          <div className="sec-title" style={{ margin: 0 }}>🛠 관리자</div>
          <div className="muted" style={{ marginTop: 8, lineHeight: 1.8, fontSize: 13.5 }}>
            이 화면은 운영자 브라우저에서만 열립니다.
          </div>
          {/* 🔑 2026-09-17 — «이 브라우저 번호» 는 **여기가 제자리입니다.**
              사랑방 「쓰는 법」 에도 한 줄 달았다가 뺐습니다 — 그 번호가 필요한 사람은
              소장님 한 분이고, 그건 운영자 사정입니다 (8절 40).
              ⚠️ 폰에서 긴 번호를 손으로 긁는 건 고역이라 «베끼기» 를 답니다.
              ⚠️ 비밀이 아닙니다 — 익명 로그인은 «원하는 uid 로» 할 수 없으니
                 이 번호를 안다고 그 사람이 될 수 없습니다. */}
          {uid ? (
            <div className="note sm" style={{ marginTop: 10 }}>
              새 기기를 운영자로 넣으시려면 <b>이 번호</b>를 알려 주십시오.<br />
              <code style={{ fontSize: 11.5, wordBreak: 'break-all' }}>{uid}</code>{' '}
              <button className="lnk" onClick={() => {
                try { navigator.clipboard.writeText(uid); set베낌(true); setTimeout(() => set베낌(false), 1500) }
                catch { /* 안 되면 손으로 긁어 가시면 됩니다 */ }
              }}>{베낌 ? '베꼈습니다' : '베끼기'}</button>
            </div>
          ) : (
            <div className="note sm" style={{ marginTop: 10 }}>브라우저 번호를 확인하지 못했습니다.</div>
          )}
          <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
            <Link className="btn line" to="/qna">💬 사랑방으로</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap">
      <div className="card outline">
        <h1 style={{ margin: 0, fontSize: 20 }}>🛠 관리자</h1>
        <div className="muted" style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.75 }}>
          답 안 단 글부터 올려 둡니다. 여기서 단 답글에는{' '}
          <b style={{ color: 'var(--accent, #1a56db)' }}>「K-건설맵 답변」</b> 표가 붙습니다.
        </div>
      </div>

      {list === null && <Skeleton n={4} />}
      {list && list.전체 === 0 && <Empty>아직 글이 없습니다.</Empty>}

      {list && list.안단것.length > 0 && (
        <>
          <div className="sec-title">답을 기다리는 글 <span className="count">{list.안단것.length}건</span></div>
          {list.안단것.map((r) => <글 key={r.id} r={r} ans={ans[r.id] || {}} onDone={load} 급함 />)}
        </>
      )}
      {list && list.단것.length > 0 && (
        <>
          <div className="sec-title" style={{ marginTop: 16 }}>답 단 글 <span className="count">{list.단것.length}건</span></div>
          {list.단것.map((r) => <글 key={r.id} r={r} ans={ans[r.id] || {}} onDone={load} />)}
        </>
      )}

      <div className="note sm" style={{ marginTop: 14 }}>
        이 화면은 검색엔진에 올리지 않습니다. 사랑방 글은 원래 누구나 읽을 수 있으니,
        여기서 새는 것은 없습니다 — 다만 <b>답글에 표를 다는 것</b>은 서버가 브라우저 번호로 막습니다.
      </div>
    </div>
  )
}

function 글({ r, ans, onDone, 급함 }) {
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const 답 = Object.entries(ans).map(([id, x]) => ({ id, ...x }))
    .filter((x) => !x.deleted).sort((p, q) => (p.at || 0) - (q.at || 0))

  const 올리기 = async () => {
    if (b.trim().length < 2) return setMsg('답글을 적어 주세요.')
    setBusy(true); setMsg('')
    try {
      const { ref, set, push, db, ensureAnon } = await loadFb()
      const user = await ensureAnon()
      const op = isOp(user.uid)
      if (!op) { setMsg('이 브라우저는 운영자가 아닙니다.'); setBusy(false); return }
      await set(push(ref(db, `qna_a/${r.id}`)), {
        b: b.trim().slice(0, 2000),
        nick: 'K-건설맵',
        op: true,
        uid: user.uid,
        at: Date.now(),
      })
      setB('')
      onDone()
    } catch (e) {
      /* 서버가 막으면 여기로 옵니다 — 화면 목록과 규칙이 어긋난 경우입니다 */
      setMsg('올리지 못했습니다. 브라우저 번호가 규칙에 들어 있는지 보십시오.')
    } finally { setBusy(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        {급함 && (
          <span className="chip" style={{
            fontSize: 11.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
            background: 'var(--warn-soft, rgba(217,119,6,.12))', color: 'var(--warn, #b45309)',
          }}>답 없음 · {얼마전(r.at)}</span>
        )}
        <b style={{ flex: '1 1 200px', fontSize: 15 }}>{r.t}</b>
        <span className="muted" style={{ fontSize: 12 }}>{r.nick || nickOf(r.uid)} · {when(r.at)}</span>
      </div>
      {r.b && (
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 13.5, marginTop: 8 }}>{r.b}</div>
      )}

      {답.map((a) => (
        <div key={a.id} style={{
          marginTop: 10, padding: '9px 11px', borderRadius: 9,
          background: a.op ? 'var(--accent-soft, rgba(26,86,219,.08))' : 'var(--bg-soft, rgba(0,0,0,.03))',
          border: '1px solid var(--line)',
        }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>
            {a.op
              ? <b style={{ color: 'var(--accent, #1a56db)' }}>K-건설맵 답변</b>
              : <b>{a.nick || '익명'}</b>}
            <span className="muted"> · {when(a.at)}</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 13.5 }}>{a.b}</div>
        </div>
      ))}

      <textarea className="inp" value={b} onChange={(e) => setB(e.target.value)}
        placeholder="답글 — 「K-건설맵 답변」 으로 올라갑니다"
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 80, marginTop: 10 }} maxLength={2000} />
      <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn primary sm" onClick={올리기} disabled={busy || !b.trim()}>
          {busy ? '올리는 중…' : '답글 올리기'}
        </button>
        <a className="btn line sm" href={`/qna`}>사랑방에서 보기 →</a>
        {msg && <span className="muted" style={{ fontSize: 12 }}>{msg}</span>}
      </div>
    </div>
  )
}
