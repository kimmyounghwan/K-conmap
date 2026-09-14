import { useEffect, useMemo, useState } from 'react'
/* ⚠️ 2026-09-08 — firebase 를 «정적으로» 끌어오면 안 됩니다.
   착공현장 탭을 열기만 해도 firebase 청크(390KB · gzip 84KB)를 받습니다.
   실측: /first 는 js/css 4개, /jobs 는 7개 — 늘어난 것이 전부 firebase 였습니다.
   그런데 이 탭에 들어온 사람 대부분은 «🏗 낙찰 현장» 만 봅니다. 그쪽은 firebase 를
   한 줄도 안 씁니다. Comments.jsx 가 같은 이유로 이미 지연 로딩을 하고 있습니다.
   → «✏️ 구인·구직 글» 을 실제로 누를 때만 받아옵니다. */
let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}
import { Empty, Skeleton } from '../components.jsx'
import { num, REGIONS, inRegion } from '../lib/fmt.js'
import Sites from '../Sites.jsx'
import { pinHash } from '../lib/pin.js'
import { loadRegion } from '../lib/lic.js'
import { wnUrl, WN_CITIES, WN_JOBS, WN_REGION_PAGE } from '../lib/worknet.js'

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
       «직접 올린 글» 은 두 번째 갈래로 남깁니다.
     ★ 2026-09-14 — 워크넷을 「🔎 워크넷」 갈래로 **다시 넣었습니다. 단, 자료는 안 가져옵니다.**
       소장님: 「워크넷 긁어 오고 … 건설맵에도 정확하게 나와야 해」 → 긁어오기는 안 했습니다.
       워크넷 채용정보는 공공누리 «제4유형 - 상업적 이용금지, 변경금지» 이고, 애드센스가 붙는
       우리 사이트에 회사명·직종·급여를 옮겨 싣는 건 그 두 조건에 다 걸립니다.
       대신 **워크넷 화면을 그대로 불러와 보여 주고(iframe), 누르면 워크넷으로 갑니다.**
       소장님: 「워크넷 화면을 건설맵에 띄우고, 워크넷으로 연결되게 하면 되잖아」 → 맞는 말씀이었습니다.
       자료를 받아 «우리 파일에 저장하고 우리 형식으로 다시 그리는» 것이 복제·변경이지,
       보는 사람 브라우저가 워크넷 서버에서 직접 받아 워크넷 화면 그대로 보는 건 링크와 같습니다.
       ✅ 고용24 는 X-Frame-Options 로 안 막습니다(2026-09-14 k-conmap.com 안에서 실제로 떠 보임).
       ⚠️ 나중에 «자료를 직접 싣자» 는 이야기가 다시 나오면, 조건은 둘입니다 —
          ① 고용24 기업회원 전환(사업자등록번호) ② 한국고용정보원 043-870-8556 에서
          «광고가 있는 사이트에 게시해도 되느냐» 허락. 둘 다 없으면 링크까지가 끝입니다. */
  const [mode, setMode] = useState('sites')

  const load = async () => {
    setPosts(null); setErr('')
    try {
      // 화면을 열 때 딱 두 번만 읽는다. 실시간 구독은 쓰지 않는다(요금 방어).
      const { ref, get, query, orderByKey, limitToLast, db } = await loadFb()
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
        {mode === 'sites' ? '🏗 곧 착공하는 현장' : mode === 'posts' ? '✏️ 구인·구직' : '🔎 워크넷 건설 일자리'}
        <span className="count">{mode === 'sites'
          ? '· 최근 낙찰된 공사와 낙찰업체 연락처 · 사람·장비 구하고 찾기'
          : mode === 'posts'
            ? '· 회원가입 없이 바로 올립니다'
            : '· 고용24에 올라온 건설 일자리로 바로 갑니다'}</span>
      </div>

      <div className="seg seg3" style={{ marginBottom: 12 }}>
        <button className={mode === 'sites' ? 'on' : ''} onClick={() => setMode('sites')}>🏗 낙찰 현장</button>
        <button className={mode === 'posts' ? 'on' : ''} onClick={() => setMode('posts')}>✏️ 구인·구직</button>
        <button className={mode === 'wn' ? 'on' : ''} onClick={() => setMode('wn')}>🔎 워크넷</button>
      </div>

      {mode === 'sites' && <Sites />}
      {mode === 'wn' && <Worknet />}

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
      const { ref, update, db, ensureAnon } = await loadFb()
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
      const { ref, set, db, ensureAnon } = await loadFb()
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

      <h3 style={{ marginBottom: p.co ? 2 : 6 }}>{p.title}</h3>

      {p.co && (
        <div style={{ margin: '0 0 6px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)' }}>
          {p.co}
        </div>
      )}

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
    title: '', co: '', pay: '', contact: '', body: '', pin: '',
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
      const { ref, set, push, db, ensureAnon } = await loadFb()
      const user = await ensureAnon()
      const slot = push(ref(db, 'jobs'))     // 키만 먼저 받는다 (해시의 소금으로 씀)
      const id = slot.key
      await set(ref(db, `job_pins/${id}`), await pinHash(id, f.pin))
      await set(slot, {
        type: f.type,
        trade: f.trade,
        region: f.region,
        title: f.title.trim().slice(0, 60),
        co: f.co.trim().slice(0, 40),
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

      <div className="field">
        <label>{f.type === '구인' ? '회사·현장' : '경력·자격'} <span className="hint">— 선택</span></label>
        <input value={f.co} onChange={set_('co')} maxLength={40}
          placeholder={f.type === '구인'
            ? '예: (유)대유건설 · 여수 웅천 아파트 현장'
            : '예: 토목기사·건설안전기사 보유'} />
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

/* ── 🔎 워크넷 건설 일자리 ──────────────────────────────────
   소장님(2026-09-14): 「워크넷 화면을 건설맵에 띄우고, 워크넷으로 연결되게 하면 되잖아」 → 맞습니다.

   ■ 왜 이건 되고 «긁어오기» 는 안 되나 — 성격이 다릅니다.
     긁어오기: 우리가 워크넷 자료를 받아서 **우리 파일에 저장하고 우리 화면 형식으로 다시 그림**.
               → 공공누리 제4유형(상업적 이용금지·변경금지) 에 걸립니다.
     이 칸  : 보는 사람의 브라우저가 **워크넷 서버에서 직접** 받아 워크넷 화면 그대로 보여줌.
               우리는 자료를 갖지도, 고치지도, 저장하지도 않습니다. 워크넷 로고도 그대로 뜹니다.
               → 링크와 같은 성격입니다.
     ✅ 2026-09-14 실제로 확인: 고용24 는 X-Frame-Options 로 막고 있지 않습니다(k-conmap.com 안에서 떴습니다).

   ■ 휴대폰에서는 안 싣습니다. 워크넷 화면이 PC 용이라 작은 화면에 우겨넣으면 못 씁니다 → 새 창으로 보냅니다.
   ■ 애드센스 방어 — 이 칸은 **우리 내용 아래 별도 칸**에 둡니다. 광고와 붙여 놓지 않습니다.
      「남의 화면을 끼워 넣은 페이지」가 «가치 없는 콘텐츠» 로 읽히면 심사에서 손해입니다.
   ■ 언젠가 워크넷이 막으면 칸이 «비어» 보입니다(cross-origin 이라 우리가 감지할 수 없습니다).
      그래서 칸 아래에 «비어 있으면 새 창으로 여세요» 를 항상 적어 둡니다. ────────────────── */
function Worknet() {
  /* 바로투찰·현장 목록에서 이미 고른 지역이 있으면 그것으로 시작합니다.
     광주와 전남은 고용24 에서 하나(전남광주)라 둘 다 «광주·전남» 으로 갑니다. */
  const [city, setCity] = useState(() => {
    try {
      const r = loadRegion()
      if (r === '광주' || r === '전남') return '광주·전남'
      return WN_CITIES.some((c) => c.name === r) ? r : '전국'
    } catch { return '전국' }
  })
  const [job, setJob] = useState(null)          // 고른 직종 {name, kw}
  const [wide, setWide] = useState(() => {
    try { return window.matchMedia('(min-width: 760px)').matches } catch { return true }
  })

  useEffect(() => {
    let mq, on
    try {
      mq = window.matchMedia('(min-width: 760px)')
      on = (e) => setWide(e.matches)
      mq.addEventListener('change', on)
    } catch { /* 아주 옛 브라우저 - 처음 값 그대로 씁니다 */ }
    return () => { try { if (mq && on) mq.removeEventListener('change', on) } catch { /* noop */ } }
  }, [])

  const code = (WN_CITIES.find((c) => c.name === city) || WN_CITIES[0]).code
  const url = job ? wnUrl(job.kw, code) : ''

  const log = (kw, how) => {
    try { if (window.gtag) window.gtag('event', 'worknet_open', { kw, city, how }) } catch (e) { /* noop */ }
  }

  const pick = (j) => {
    if (wide) { setJob(j); log(j.kw, 'embed') }
    else { log(j.kw, 'newtab'); window.open(wnUrl(j.kw, code), '_blank', 'noopener') }
  }

  return (
    <>
      <div className="note" style={{ marginBottom: 12 }}>
        고용노동부 <b>고용24(워크넷)</b> 에 올라온 건설 일자리입니다.
        지역을 고르고 직종을 누르면 {wide ? '아래에 워크넷 화면이 그대로 펼쳐집니다' : '워크넷이 새 창으로 열립니다'}.
        지원·문의는 워크넷에서 하시면 됩니다.
      </div>

      <div className="chips">
        {WN_CITIES.map((c) => (
          <button key={c.name} className={'chip' + (city === c.name ? ' on' : '')}
            onClick={() => setCity(c.name)}>{c.name}</button>
        ))}
      </div>

      <div className="sec-title">
        직종 <span className="count">{city} · 최근 등록순</span>
      </div>

      <div className="chips wrap">
        {WN_JOBS.map((j) => (
          <button key={j.name}
            className={'chip' + (job && job.name === j.name ? ' on' : '')}
            onClick={() => pick(j)}>{j.name}{wide ? '' : ' ↗'}</button>
        ))}
      </div>

      {wide && job && (
        <div className="card" style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            padding: '10px 12px', borderBottom: '1px solid var(--line)',
          }}>
            <b style={{ fontSize: 13.5 }}>고용24(워크넷) 화면</b>
            <span className="badge n">{city}</span>
            <span className="badge n">{job.name}</span>
            <span style={{ flex: 1 }} />
            <a className="btn ghost sm" style={{ textDecoration: 'none' }}
              href={url} target="_blank" rel="noopener noreferrer"
              onClick={() => log(job.kw, 'newtab')}>새 창으로 크게 ↗</a>
            <button className="btn ghost sm" onClick={() => setJob(null)}>닫기</button>
          </div>

          <iframe
            key={url}
            title={`고용24 채용정보 — ${city} ${job.name}`}
            src={url}
            loading="lazy"
            style={{ display: 'block', width: '100%', height: 860, border: 0, background: '#fff' }}
          />

          <div className="note" style={{ padding: '10px 12px', borderTop: '1px solid var(--line)' }}>
            <b>칸 안에서 조금 내리시면 채용 목록이 나옵니다</b> — 고용24 화면이 「검색 조건」부터 열리기 때문입니다.
            넓게 보시려면 위 「새 창으로 크게」 를 쓰세요.<br />
            이 칸은 <b>고용24(워크넷)</b> 화면을 그대로 불러온 것입니다. K-건설맵이 목록을 옮겨 적은 것이 아니며,
            누르시는 것은 모두 워크넷으로 이어집니다. 칸이 비어 보이면 워크넷이 바깥 화면에 싣는 것을 막은 것이니
            위 「새 창으로 크게」 로 여세요.
          </div>
        </div>
      )}

      {!job && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="sec-title" style={{ margin: '0 0 8px' }}>시·군까지 좁히시려면</div>
          <div className="note" style={{ marginBottom: 10 }}>
            위 칩은 <b>시·도</b> 단위입니다. 여수·순천처럼 시·군까지, 또는 급여·경력 조건까지 고르시려면
            아래 화면 안에서 「지역별」을 눌러 고르시면 됩니다. 시·군은 250개가 넘고 코드가 바뀌면
            엉뚱한 결과가 나와서 일부러 안 박아 뒀습니다.
          </div>
          <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <a className="btn ghost sm" style={{ textDecoration: 'none' }}
              href={WN_REGION_PAGE} target="_blank" rel="noopener noreferrer"
              onClick={() => log('지역별', 'newtab')}>지역별로 고르기 ↗</a>
            <a className="btn ghost sm" style={{ textDecoration: 'none' }}
              href={wnUrl('건설', '')} target="_blank" rel="noopener noreferrer"
              onClick={() => log('전국건설', 'newtab')}>전국 건설 일자리 ↗</a>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
        <div className="sec-title" style={{ margin: '0 0 8px' }}>사람을 구하시는 거라면</div>
        <div className="note">
          워크넷에 공고를 올리려면 <b>사업자등록번호로 기업회원 가입</b>을 해야 하고 승인도 기다려야 합니다.
          급하시면 옆의 <b>✏️ 구인·구직</b> 에 올리세요 — 회원가입 없이 바로 올라가고, 지우실 때 쓸
          숫자 네 자리만 정하시면 됩니다.
        </div>
      </div>

      <div className="note" style={{ marginTop: 12 }}>
        자료 출처: <b>고용24(워크넷) · 한국고용정보원</b>.
      </div>
    </>
  )
}
