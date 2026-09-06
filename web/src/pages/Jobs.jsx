import { useEffect, useMemo, useState } from 'react'
import { ref, get, set, push, update, query, orderByKey, limitToLast } from 'firebase/database'
import { db, ensureAnon } from '../firebase.js'
import { Empty, Skeleton } from '../components.jsx'
import { num, REGIONS, inRegion } from '../lib/fmt.js'
import Sites from '../Sites.jsx'
import { pinHash } from '../lib/pin.js'

const TRADES = ['현장관리', '공무/견적', '토목', '건축', '철근·콘크리트', '설비', '전기',
  '조경', '중장비', '보통인부', '기타']
const TYPES = ['구인', '구직']
const LIMIT = 200          // 한 번에 읽는 최대 글 수 (비용 방어)
const MINE_KEY = 'kcm_my_posts'

const now = () => Date.now()

const ago = (t) => {
  const m = Math.floor((now() - t) / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}일 전`
  return new Date(t).toLocaleDateString('ko-KR')
}

const loadMine = () => { try { return JSON.parse(localStorage.getItem(MINE_KEY) || '[]') } catch { return [] } }
const addMine = (id) => { try { localStorage.setItem(MINE_KEY, JSON.stringify([...loadMine(), id].slice(-50))) } catch { /* noop */ } }

/* pinHash 는 lib/pin.js 로 옮겼습니다 — 이용자 서식·댓글과 같이 씁니다 (2026-09-06) */

export default function Jobs() {
  const [posts, setPosts] = useState(null)
  const [type, setType] = useState('전체')
  const [region, setRegion] = useState('전국')
  const [trade, setTrade] = useState('전체')
  const [writing, setWriting] = useState(false)
  const [err, setErr] = useState('')
  const [mine, setMine] = useState(loadMine)
  /* ★ 2026-09-03 — 「워크넷 건설 채용」과 「자격·훈련」 갈래는 뺐습니다(소장님 결정).
     채용정보 API 는 기업회원 전용이라 개인회원 키로는 0건이었고, 크롤링은 하지 않기로 했습니다.
     ★ 2026-09-06 — 「🏗 곧 착공하는 현장」 을 앞에 둡니다 (Sites.jsx 머리말 참고).
       빈 게시판은 아무도 안 씁니다. 낙찰 자료는 글이 0건이어도 매일 570건씩 채워집니다.
       «직접 올린 글» 은 두 번째 갈래로 남깁니다. */
  const [mode, setMode] = useState('sites')

  const load = async () => {
    setPosts(null); setErr('')
    try {
      // 화면을 열 때 딱 두 번만 읽는다. 실시간 구독은 쓰지 않는다(요금 방어).
      const [snap, delSnap] = await Promise.all([
        get(query(ref(db, 'jobs'), orderByKey(), limitToLast(LIMIT))),
        get(query(ref(db, 'job_del'), orderByKey(), limitToLast(500))),
      ])
      const removed = new Set(Object.keys(delSnap.val() || {}))
      const list = Object.entries(snap.val() || {})
        .map(([id, v]) => ({ id, ...v }))
        .filter((p) => !p.deleted && !removed.has(p.id))
        .sort((a, b) => (b.at || 0) - (a.at || 0))
      setPosts(list)
    } catch {
      setErr('목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      setPosts([])
    }
  }

  /* 글 목록(Firebase 읽기 2번)은 «직접 올린 글» 을 실제로 열 때만 — 현장 목록만 보는 사람에게 과금 0 */
  useEffect(() => { if (mode === 'posts' && posts === null) load() }, [mode])  // eslint-disable-line

  const view = useMemo(() => {
    if (!posts) return []
    return posts.filter((p) =>
      (type === '전체' || p.type === type) &&
      (region === '전국' || p.region === region) &&
      (trade === '전체' || p.trade === trade))
  }, [posts, type, region, trade])

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        🏗 곧 착공하는 현장 <span className="count">· 최근 낙찰된 공사와 낙찰업체 연락처 · 사람·장비 구하고 찾기</span>
      </div>

      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={mode === 'sites' ? 'on' : ''} onClick={() => setMode('sites')}>🏗 낙찰 현장</button>
        <button className={mode === 'posts' ? 'on' : ''} onClick={() => setMode('posts')}>✏️ 구인·구직 글</button>
      </div>

      {mode === 'sites' && <Sites />}

      {mode === 'posts' && (<>
      <div className="seg">
        {['전체', ...TYPES].map((t) => (
          <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>{t}</button>
        ))}
      </div>

      <div className="chips">
        {REGIONS.map((r) => (
          <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => setRegion(r)}>{r}</button>
        ))}
      </div>
      <div className="chips">
        {['전체', ...TRADES].map((t) => (
          <button key={t} className={'chip' + (trade === t ? ' on' : '')} onClick={() => setTrade(t)}>{t}</button>
        ))}
      </div>

      {!writing && (
        <button className="btn" style={{ marginBottom: 12 }} onClick={() => setWriting(true)}>
          ✏️ 글 올리기
        </button>
      )}

      {writing && (
        <WriteForm
          onClose={() => setWriting(false)}
          onDone={(id) => { addMine(id); setMine(loadMine()); setWriting(false); load() }}
        />
      )}

      {err && <div className="note" style={{ color: 'var(--bad)', marginBottom: 10 }}>{err}</div>}

      {posts === null ? <Skeleton n={4} /> : view.length === 0 ? (
        <Empty icon="🪧">
          아직 올라온 글이 없습니다.<br />첫 글을 올려보세요.
        </Empty>
      ) : (
        <>
          <div className="sec-title">
            글 <span className="count">{num(view.length)}건</span>
            <span style={{ flex: 1 }} />
            <button className="btn ghost sm" onClick={load}>새로고침</button>
          </div>
          {view.map((p) => (
            <Post key={p.id} p={p} isMine={mine.includes(p.id)} onChanged={load} />
          ))}
        </>
      )}

      <div className="note" style={{ marginTop: 14 }}>
        로그인 없이 누구나 올릴 수 있습니다. 올릴 때 정한 <b>4자리 숫자</b>가 있어야 글을 지울 수 있으니 꼭 기억해두세요.<br />
        연락처는 그대로 공개되니 개인 휴대폰보다 업무용 번호를 권합니다. 허위·광고성 글은 예고 없이 삭제될 수 있습니다.
      </div>
      </>)}
    </>
  )
}

/* ── 글 카드 ──────────────────────────── */
function Post({ p, isMine, onChanged }) {
  const [openDel, setOpenDel] = useState(false)
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const removeByOwner = async () => {
    setBusy(true); setMsg('')
    try {
      await ensureAnon()
      await update(ref(db, `jobs/${p.id}`), { deleted: true })
      onChanged()
    } catch {
      setMsg('삭제하지 못했습니다. 비밀번호로 시도해보세요.')
      setOpenDel(true)
    } finally { setBusy(false) }
  }

  const removeByPin = async () => {
    if (pin.length !== 4) { setMsg('4자리 숫자를 입력하세요.'); return }
    setBusy(true); setMsg('')
    try {
      await ensureAnon()
      // 해시가 서버에 저장된 값과 같아야만 규칙이 이 쓰기를 허용한다
      await set(ref(db, `job_del/${p.id}`), await pinHash(p.id, pin))
      onChanged()
    } catch {
      setMsg('비밀번호가 맞지 않습니다.')
    } finally { setBusy(false) }
  }

  return (
    <div className="notice" style={{ cursor: 'default' }}>
      <div className="meta" style={{ marginBottom: 6 }}>
        <span className={'badge ' + (p.type === '구인' ? 'b' : 'g')}>{p.type}</span>
        {p.trade && <span className="badge n">{p.trade}</span>}
        {p.region && <span className="badge n">{p.region}</span>}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5 }}>{ago(p.at)}</span>
      </div>

      <h3 style={{ marginBottom: 6 }}>{p.title}</h3>

      {p.body && (
        <p style={{
          margin: '0 0 8px', fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-2)',
          whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
        }}>{p.body}</p>
      )}

      <div className="foot">
        {p.pay && <span className="badge w">{p.pay}</span>}
        <span style={{ flex: 1 }} />
        {p.contact && (
          <a href={`tel:${String(p.contact).replace(/[^0-9+]/g, '')}`}
            style={{ fontWeight: 700, color: 'var(--accent)' }}>📞 {p.contact}</a>
        )}
      </div>

      <div style={{ marginTop: 8, textAlign: 'right' }}>
        {!openDel ? (
          isMine ? (
            <button className="btn ghost sm" disabled={busy} onClick={removeByOwner}>내 글 삭제</button>
          ) : (
            <button className="btn ghost sm" onClick={() => setOpenDel(true)}>삭제</button>
          )
        ) : (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
            {msg && <span style={{ fontSize: 12, color: 'var(--bad)' }}>{msg}</span>}
            <input value={pin} inputMode="numeric" maxLength={4} placeholder="4자리"
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              style={{ width: 84, padding: '7px 10px', fontSize: 13 }} />
            <button className="btn sm" disabled={busy} onClick={removeByPin}>삭제</button>
            <button className="btn ghost sm" onClick={() => { setOpenDel(false); setPin(''); setMsg('') }}>취소</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── 글쓰기 ──────────────────────────── */
function WriteForm({ onClose, onDone }) {
  const [f, setF] = useState({
    type: '구인', trade: '현장관리', region: '전남',
    title: '', pay: '', contact: '', body: '', pin: '',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set_ = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))

  const submit = async () => {
    if (f.title.trim().length < 2) return setMsg('제목을 2자 이상 입력하세요.')
    if (f.contact.trim().length < 4) return setMsg('연락처를 입력하세요.')
    if (f.pin.length !== 4) return setMsg('삭제용 4자리 숫자를 정해주세요.')
    setBusy(true); setMsg('')
    try {
      const user = await ensureAnon()
      const slot = push(ref(db, 'jobs'))     // 키만 먼저 받는다 (해시의 소금으로 씀)
      const id = slot.key
      await set(ref(db, `job_pins/${id}`), await pinHash(id, f.pin))
      await set(slot, {
        type: f.type,
        trade: f.trade,
        region: f.region,
        title: f.title.trim().slice(0, 60),
        pay: f.pay.trim().slice(0, 30),
        contact: f.contact.trim().slice(0, 40),
        body: f.body.trim().slice(0, 1000),
        uid: user.uid,
        at: now(),
        deleted: false,
      })
      onDone(id)
    } catch {
      setMsg('저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <div className="sec-title" style={{ margin: '0 0 10px' }}>✏️ 글 올리기</div>

      <div className="seg" style={{ marginTop: 0 }}>
        {TYPES.map((t) => (
          <button key={t} className={f.type === t ? 'on' : ''}
            onClick={() => setF((v) => ({ ...v, type: t }))}>{t}</button>
        ))}
      </div>

      <div className="field">
        <label>제목</label>
        <input value={f.title} onChange={set_('title')} maxLength={60}
          placeholder={f.type === '구인'
            ? '예: 여수 현장 철근공 3명 구합니다'
            : '예: 토목기사 10년, 전남권 구직합니다'} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>지역</label>
          <select value={f.region} onChange={set_('region')}>
            {REGIONS.filter((r) => r !== '전국').map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>직종</label>
          <select value={f.trade} onChange={set_('trade')}>
            {TRADES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label>조건 <span className="hint">— 일당·월급·기간 등 (선택)</span></label>
        <input value={f.pay} onChange={set_('pay')} maxLength={30} placeholder="예: 일당 22만 / 3개월" />
      </div>

      <div className="field">
        <label>연락처 <span className="hint">— 공개됩니다</span></label>
        <input value={f.contact} onChange={set_('contact')} maxLength={40} placeholder="예: 010-0000-0000" />
      </div>

      <div className="field">
        <label>내용 <span className="hint">— 선택</span></label>
        <textarea value={f.body} onChange={set_('body')} maxLength={1000}
          placeholder="현장 위치, 근무 시간, 우대 사항 등" />
      </div>

      <div className="field">
        <label>삭제용 비밀번호 <span className="hint">— 숫자 4자리, 꼭 기억하세요</span></label>
        <input value={f.pin} inputMode="numeric" maxLength={4}
          onChange={(e) => setF((v) => ({ ...v, pin: e.target.value.replace(/[^0-9]/g, '') }))}
          placeholder="0000" />
      </div>

      {msg && <div className="note" style={{ color: 'var(--bad)', marginBottom: 10 }}>{msg}</div>}

      <div className="btn-row">
        <button className="btn ghost" onClick={onClose}>취소</button>
        <button className="btn" disabled={busy} onClick={submit}>{busy ? '올리는 중…' : '올리기'}</button>
      </div>
    </div>
  )
}
