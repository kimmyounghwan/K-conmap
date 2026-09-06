import { useEffect, useState } from 'react'
import { ref, get, set, push, query, orderByKey, limitToLast } from 'firebase/database'
import { db, ensureAnon } from './firebase.js'
import { pinHash } from './lib/pin.js'
import { Skeleton } from './components.jsx'

/* ══════════════════════════════════════════════════════════════
   💬 공고·개찰 댓글 (2026-09-06)
   소장님: 「각 공고나 1순위 아래에 댓글을 쓸 수 있게. 대화 창구로.」 「댓글은 접히게 하고, 클릭하면 보이게.」

   ■ 접혀 있습니다 — 「💬 댓글」 을 누를 때만 get() 한 번(limitToLast 50). 카드 20장을 그릴 때 아무것도 안 읽습니다.
     그래서 카드에 «댓글 몇 개» 뱃지는 없습니다 — 그걸 달려면 카드마다 읽어야 해서 과금이 됩니다.
   ■ 공고번호(no) 아래에 답니다. 1순위 카드·공고 카드·/notice 페이지가 같은 번호를 쓰므로 어디서 열어도 같은 댓글입니다.
   ■ 로그인 없음(익명). 지우기는 쓸 때 정한 4자리 숫자로 — 구인구직 글과 같은 방식(lib/pin.js).
   ■ 규칙: database.rules.json 의 comments/{no}/{id} — 500자, 이름 20자, 자기 uid 만 씀.
   ══════════════════════════════════════════════════════════════ */

const LIMIT = 50
const MINE_KEY = 'kcm_my_comments'
const loadMine = () => { try { return JSON.parse(localStorage.getItem(MINE_KEY) || '[]') } catch { return [] } }
const addMine = (id) => { try { localStorage.setItem(MINE_KEY, JSON.stringify([...loadMine(), id].slice(-100))) } catch { /* noop */ } }
const ago = (t) => {
  const m = Math.floor((Date.now() - t) / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}일 전` : new Date(t).toLocaleDateString('ko-KR')
}
const safeNo = (no) => String(no || '').replace(/[.#$\[\]\/]/g, '_').slice(0, 40)

export default function CommentsPanel({ no, title }) {
  const key = safeNo(no)
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  const [body, setBody] = useState('')
  const [by, setBy] = useState(() => { try { return localStorage.getItem('kcm_comment_by') || '' } catch { return '' } })
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [mine, setMine] = useState(loadMine)
  if (!key) return null

  const load = async () => {
    setList(null); setErr('')
    try {
      const [snap, delSnap] = await Promise.all([
        get(query(ref(db, `comments/${key}`), orderByKey(), limitToLast(LIMIT))),
        get(query(ref(db, `comment_del/${key}`), orderByKey(), limitToLast(LIMIT))),
      ])
      const removed = delSnap.val() || {}
      setList(Object.entries(snap.val() || {}).map(([id, v]) => ({ id, ...v }))
        .filter((c) => !c.deleted && !removed[c.id]).sort((a, b) => (a.at || 0) - (b.at || 0)))
    } catch { setErr('댓글을 불러오지 못했습니다.'); setList([]) }
  }
  useEffect(() => { load() }, [key])  // eslint-disable-line

  const submit = async () => {
    setErr('')
    const b = body.trim()
    if (b.length < 1) return setErr('내용을 적어 주세요.')
    if (!/^\d{4}$/.test(pin)) return setErr('지울 때 쓸 4자리 숫자를 정해 주세요.')
    setBusy(true)
    try {
      const u = await ensureAnon()
      const id = push(ref(db, `comments/${key}`)).key
      await set(ref(db, `comment_pins/${key}/${id}`), await pinHash(id, pin))
      await set(ref(db, `comments/${key}/${id}`), { body: b.slice(0, 500), by: by.trim().slice(0, 20), uid: u.uid, at: Date.now() })
      try { localStorage.setItem('kcm_comment_by', by.trim().slice(0, 20)) } catch { /* noop */ }
      addMine(id); setMine(loadMine()); setBody(''); setPin('')
      await load()
    } catch { setErr('댓글을 올리지 못했습니다. 잠시 후 다시 시도해주세요.') }
    finally { setBusy(false) }
  }
  const remove = async (c) => {
    const p = window.prompt('쓸 때 정한 4자리 숫자를 넣으세요')
    if (!p) return
    try {
      await ensureAnon()
      await set(ref(db, `comment_del/${key}/${c.id}`), await pinHash(c.id, p))
      setList((l) => (l || []).filter((x) => x.id !== c.id))
    } catch { setErr('숫자가 다르거나 지울 수 없습니다.') }
  }

  return (
    <div className="cm-box" onClick={(e) => e.stopPropagation()}>
      {title && <div className="hint" style={{ marginBottom: 6 }}>「{title}」 에 대한 이야기 — 로그인 없이 씁니다.</div>}
      {/* ⚠️ 못 불러왔을 때 «아직 댓글이 없습니다» 를 같이 띄우면 안 됩니다 —
          한 상자가 서로 반대말을 하게 됩니다(CLAUDE.md 채점 화면에서 겪은 것과 같은 잘못).
          실측 2026-09-06: 규칙 배포 전이라 읽기가 막혀 두 문장이 함께 떴습니다. */}
      {list === null ? <Skeleton n={2} /> : err && list.length === 0 ? (
        <div className="cm-empty">댓글을 불러오지 못했습니다. 잠시 후 다시 열어 보세요.</div>
      ) : list.length === 0 ? (
        <div className="cm-empty">아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.</div>
      ) : list.map((c) => (
        <div className="cm-item" key={c.id}>
          <div className="cm-h"><b>{c.by || '익명'}</b><span className="muted"> · {ago(c.at)}</span>
            {mine.includes(c.id) && <button className="lnk" onClick={() => remove(c)}>지우기</button>}</div>
          <div className="cm-b">{c.body}</div>
        </div>
      ))}
      <div className="cm-form">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} maxLength={500}
          placeholder="이 공고에 대해 한마디 — 현장 사정, 질문, 정보 나눔" />
        <div className="cm-row">
          <input value={by} onChange={(e) => setBy(e.target.value)} maxLength={20} placeholder="이름·별명 (선택)" />
          <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" maxLength={4} placeholder="지울 때 4자리" />
          <button className="btn sm" disabled={busy} onClick={submit}>{busy ? '올리는 중…' : '올리기'}</button>
        </div>
        {err && !(list && list.length === 0) && <div className="note" style={{ color: 'var(--bad)' }}>{err}</div>}
        <div className="hint">연락처·개인정보는 적지 마세요. 광고·비방은 예고 없이 지울 수 있습니다.</div>
      </div>
    </div>
  )
}
