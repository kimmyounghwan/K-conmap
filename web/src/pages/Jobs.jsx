import { useEffect, useMemo, useState } from 'react'
import { ref, get, set, push, update, query, orderByKey, limitToLast } from 'firebase/database'
import { db, ensureAnon } from '../firebase.js'
import { Empty, Skeleton } from '../components.jsx'
import { num, REGIONS, inRegion } from '../lib/fmt.js'
import { getJobs } from '../lib/data.js'

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

/** 비밀번호는 절대 그대로 저장하지 않는다. 글 아이디를 소금으로 섞어 해시만 남긴다. */
async function pinHash(id, pin) {
  const buf = new TextEncoder().encode(`${id}:${pin}`)
  const d = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export default function Jobs() {
  const [posts, setPosts] = useState(null)
  const [type, setType] = useState('전체')
  const [region, setRegion] = useState('전국')
  const [trade, setTrade] = useState('전체')
  const [writing, setWriting] = useState(false)
  const [err, setErr] = useState('')
  const [mine, setMine] = useState(loadMine)
  /* ★ 워크넷 건설 채용 — 2026-09-03.
     한국고용정보원 OpenAPI 로 받은 «목록»입니다(크롤링 아님). 제목·조건·링크만 보여주고
     지원·문의는 워크넷에서 합니다. 이 탭을 열 때만 jobs.json 을 받습니다. */
  const [src, setSrc] = useState('worknet')     // 'worknet' | 'ours'
  const [wn, setWn] = useState(undefined)       // undefined=아직, null=없음, {f,r}=있음
  useEffect(() => {
    getJobs().then((d) => setWn(d && Array.isArray(d.r) && d.r.length ? d : null))
             .catch(() => setWn(null))
  }, [])
  // 워크넷 자료가 없으면 직접 올린 글을 먼저 보여줍니다
  useEffect(() => { if (wn === null) setSrc('ours') }, [wn])

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

  useEffect(() => { load() }, [])

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
        🤝 K-구인구직 <span className="count">· 현장 사람 구하고 찾기</span>
      </div>

      {/* 출처 고르기 — 워크넷(공공) 과 직접 올린 글은 신뢰 근거가 달라서 섞지 않고 나란히 둡니다 */}
      <div className="seg" style={{ marginBottom: 10 }}>
        <button className={src === 'worknet' ? 'on' : ''} onClick={() => setSrc('worknet')}>
          🏛 워크넷 건설 채용{wn ? ` ${num(wn.r.length)}` : ''}
        </button>
        <button className={src === 'ours' ? 'on' : ''} onClick={() => setSrc('ours')}>
          ✏️ 직접 올린 글{posts ? ` ${num(posts.length)}` : ''}
        </button>
      </div>

      {src === 'worknet' ? (
        <WorknetList data={wn} region={region} setRegion={setRegion} />
      ) : (
      <>
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

      </>
      )}

      {src === 'ours' && (
      <div className="note" style={{ marginTop: 14 }}>
        로그인 없이 누구나 올릴 수 있습니다. 올릴 때 정한 <b>4자리 숫자</b>가 있어야 글을 지울 수 있으니 꼭 기억해두세요.<br />
        연락처는 그대로 공개되니 개인 휴대폰보다 업무용 번호를 권합니다. 허위·광고성 글은 예고 없이 삭제될 수 있습니다.
      </div>
      )}
    </>
  )
}

/* ── 워크넷 건설 채용 목록 ──────────────────────────────────────
   ⚠️ 본문은 없습니다. 있어도 안 보여줍니다. 제목·회사·지역·급여·조건·마감 + 워크넷 링크.
   ⚠️ 링크는 워크넷이 준 주소(wantedInfoUrl) 그대로. 손으로 만들지 않습니다.
   ⚠️ 출처를 항상 적습니다 — «워크넷(한국고용정보원)». */
const JPAGE = 20
function WorknetList({ data, region, setRegion }) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [q, region])

  const rows = useMemo(() => {
    if (!data) return []
    const f = data.f
    const ix = Object.fromEntries(f.map((k, i) => [k, i]))
    const s = q.trim()
    return data.r
      .map((a) => ({ id: a[ix.id], title: a[ix.title], co: a[ix.co], ind: a[ix.ind], reg: a[ix.reg],
                     sal: a[ix.sal], salTp: a[ix.salTp], career: a[ix.career], edu: a[ix.edu],
                     empTp: a[ix.empTp], regDt: a[ix.regDt], closeDt: a[ix.closeDt],
                     url: a[ix.url], murl: a[ix.murl] }))
      .filter((r) => inRegion({ inst: r.reg, name: '' }, region))   // 공고와 같은 지역 규칙(별칭 포함)
      .filter((r) => !s || (r.title || '').includes(s) || (r.co || '').includes(s) || (r.ind || '').includes(s))
  }, [data, q, region])

  if (data === undefined) return <Skeleton n={4} />
  if (data === null) {
    return (
      <Empty icon="🏛">
        워크넷 채용 자료가 아직 없습니다.<br />
        <span style={{ fontSize: 12 }}>수집이 돌면 여기에 건설 관련 채용이 올라옵니다.</span>
      </Empty>
    )
  }
  const pages = Math.max(1, Math.ceil(rows.length / JPAGE))
  const view = rows.slice((page - 1) * JPAGE, page * JPAGE)
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent)

  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="채용 제목 · 회사 · 업종 검색" style={{ marginBottom: 10 }} />
      <div className="chips">
        {REGIONS.map((r) => (
          <button key={r} className={'chip' + (region === r ? ' on' : '')} onClick={() => setRegion(r)}>{r}</button>
        ))}
      </div>

      <div className="sec-title">
        건설 채용 <span className="count">{num(rows.length)}건 · 출처 워크넷(한국고용정보원) · {data.built}</span>
      </div>

      {view.length === 0 ? (
        <Empty icon="🔎">조건에 맞는 채용이 없습니다.<br />지역을 넓히거나 검색어를 지워보세요.</Empty>
      ) : view.map((r) => {
        const link = (isMobile && r.murl) ? r.murl : r.url
        return (
          <div className="notice" key={r.id}>
            <h3>{r.title}</h3>
            <div className="meta">
              <span className="inst">{r.co}</span>
              {r.reg && <><span>·</span><span>{r.reg}</span></>}
              {r.ind && <span className="badge n">{r.ind}</span>}
              {r.career && <span className="badge n">{r.career}</span>}
              {r.empTp && <span className="badge n">{r.empTp}</span>}
              {r.closeDt && <span className="badge b">마감 {r.closeDt.slice(5)}</span>}
            </div>
            <div className="foot">
              <span className="badge g">{r.salTp || '급여'}</span>
              <span className="amt">{r.sal || '워크넷에서 확인'}</span>
              <span style={{ flex: 1 }} />
              {link && (
                <a className="btn ghost sm" href={link} target="_blank" rel="noreferrer">
                  워크넷에서 보기 →
                </a>
              )}
            </div>
          </div>
        )
      })}

      {pages > 1 && (
        <div className="pager">
          <button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</button>
          <span className="pg">{page} / {pages}</span>
          <button className="btn ghost sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>다음</button>
        </div>
      )}

      <div className="note" style={{ marginTop: 14 }}>
        이 목록은 <b>워크넷(한국고용정보원) 공개 API</b>로 받은 건설 관련 채용입니다. 여기서는 제목과 조건만 보여주며,
        상세 내용·지원·문의는 <b>워크넷에서</b> 하시면 됩니다. 마감된 공고는 자동으로 빠집니다.
      </div>
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
