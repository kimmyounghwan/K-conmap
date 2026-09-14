import { useEffect, useMemo, useState } from 'react'
/* ⚠️ 2026-09-08 — firebase 를 «정적으로» 끌어오면 안 됩니다.
   착공현장 탭을 열기만 해도 firebase 청크(390KB · gzip 84KB)를 받습니다.
   → 「💼 구인·구직」 을 실제로 누를 때만 받아옵니다. */
let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}
import { Empty, Skeleton } from '../components.jsx'
import { num, REGIONS, inRegion, wonShort, dateFull } from '../lib/fmt.js'
import { useBoard } from '../lib/useBoard.js'
import Sites from '../Sites.jsx'
import { pinHash } from '../lib/pin.js'
import { loadRegion } from '../lib/lic.js'
import { wnUrl, WN_TRADES, WN_REGION_PAGE } from '../lib/worknet.js'

/* ══════════════════════════════════════════════════════════════
   💼 구인·구직 — 워크넷과 우리 게시판을 «한 화면»에 (2026-09-14)

   소장님: 「구인구직하고 워크넷을 합쳐야지… 따로 두면 안 되지.
            그리고 워크넷을 클릭하면 아무것도 없어… 구인 구직이 없어.
            구인구직을 없애고 워크넷으로 통합해줘. 그 안에서 건설맵에서 구인 구직 할 수 있게.」

   ■ 그래서 갈래를 **둘**로 줄였습니다: 🏗 낙찰 현장 · 💼 구인·구직
     「💼 구인·구직」 한 화면 안에 —
       ① 지역 칩 + 직종 칩 (하나로 **둘 다** 거릅니다)
       ② K-건설맵 구인·구직 글 (회원가입 없이 바로 올림)
       ③ 고용24(워크넷) 채용정보 화면

   ■ ⚠️ 「눌렀는데 아무것도 없다」 를 만들지 말 것 —
     전에는 직종을 고르기 전까지 워크넷 칸이 아예 안 떴습니다. 이제는 **처음부터 떠 있습니다**
     (직종 기본값 「전체」 = 워크넷 검색어 «건설»).

   ■ 직종 목록은 `lib/worknet.js` 의 `WN_TRADES` **하나뿐**입니다.
     글에 저장되는 값이기도 하므로 이름을 바꾸면 옛 글이 안 걸립니다. 늘리는 건 괜찮습니다.

   ■ 워크넷 자료는 **가져오지 않습니다.** 화면을 그대로 불러와 보여 줄 뿐이고,
     누르는 것은 모두 워크넷으로 갑니다. 이유는 lib/worknet.js 머리말 참고.
   ══════════════════════════════════════════════════════════════ */

const TRADES = WN_TRADES.map((t) => t.name)

/* 🏗 사람 구할 현장 을 직종으로 거를 때 쓰는 낱말.
   ⚠️ 여기 «없는» 직종(현장관리·철근·용접·중장비·보통인부·안전관리…)은 **일부러 안 거릅니다.**
      면허는 «공사 종류» 이고, 그 사람들은 어느 현장에나 필요하기 때문입니다.
      억지로 거르면 있는 현장을 숨기게 됩니다. */
const TRADE_RX = {
  토목: /토목|도로|하천|상하수|포장|교량|배수|지반|사면|옹벽|정비/,
  건축: /건축|신축|증축|개축|리모델링|청사|건물|지붕|창호|방수/,
  전기: /전기|조명|수배전|가로등|통신|계장|태양광/,
  설비: /설비|기계|배관|냉난방|공조|소방|펌프|보일러/,
  조경: /조경|녹지|공원|식재|화단|수목/,
}
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

export default function Jobs() {
  /* 🏗 낙찰 현장이 기본입니다 — 글이 0건이어도 매일 570건씩 채워지는 쪽이라
     «빈 게시판» 을 첫 화면으로 보여주지 않기 위해서입니다. */
  const [mode, setMode] = useState('sites')

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        {mode === 'sites' ? '🏗 곧 착공하는 현장' : '💼 건설 구인·구직'}
        <span className="count">{mode === 'sites'
          ? '· 최근 낙찰된 공사와 낙찰업체 연락처 · 사람·장비 구하고 찾기'
          : '· 워크넷 채용정보 + 회원가입 없는 우리 게시판, 한 화면에서'}</span>
      </div>

      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={mode === 'sites' ? 'on' : ''} onClick={() => setMode('sites')}>🏗 낙찰 현장</button>
        <button className={mode === 'work' ? 'on' : ''} onClick={() => setMode('work')}>💼 구인·구직</button>
      </div>

      {mode === 'sites' && <Sites />}
      {mode === 'work' && <WorkBoard onSeeAll={() => setMode('sites')} />}
    </>
  )
}

/* ── 💼 구인·구직 — 우리 글 + 워크넷을 한 화면에 ──────────────── */
function WorkBoard({ onSeeAll }) {
  const [posts, setPosts] = useState(null)
  const [err, setErr] = useState('')
  const [mine, setMine] = useState(loadMine)
  const [writing, setWriting] = useState(false)

  const [region, setRegion] = useState(() => { try { return loadRegion() } catch { return '전국' } })
  const [trade, setTrade] = useState('전체')
  const [type, setType] = useState('전체')

  /* 워크넷 화면은 PC 에서만 싣습니다 — 고용24 화면이 PC 용이라
     작은 화면에 우겨넣으면 못 씁니다. 휴대폰은 새 창으로 보냅니다. */
  const [wide, setWide] = useState(() => {
    try { return window.matchMedia('(min-width: 760px)').matches } catch { return true }
  })
  useEffect(() => {
    let mq, on
    try {
      mq = window.matchMedia('(min-width: 760px)')
      on = (e) => setWide(e.matches)
      mq.addEventListener('change', on)
    } catch { /* 아주 옛 브라우저 - 처음 값 그대로 */ }
    return () => { try { if (mq && on) mq.removeEventListener('change', on) } catch { /* noop */ } }
  }, [])

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
  useEffect(() => { load() }, [])   // eslint-disable-line

  const view = useMemo(() => {
    if (!posts) return []
    return posts.filter((p) =>
      (type === '전체' || p.type === type) &&
      (region === '전국' || p.region === region) &&
      (trade === '전체' || p.trade === trade))
  }, [posts, type, region, trade])

  const url = wnUrl(trade, region)
  const wnLog = () => {
    try { if (window.gtag) window.gtag('event', 'worknet_open', { trade, region }) } catch (e) { /* noop */ }
  }

  return (
    <>
      {/* ── 지역·직종: 이 둘이 우리 글과 워크넷을 «같이» 거릅니다 ── */}
      <div className="chips">
        {REGIONS.map((r) => (
          <button key={r} className={'chip' + (region === r ? ' on' : '')}
            onClick={() => setRegion(r)}>{r}</button>
        ))}
      </div>
      <div className="chips wrap">
        {['전체', ...TRADES].map((t) => (
          <button key={t} className={'chip' + (trade === t ? ' on' : '')}
            onClick={() => setTrade(t)}>{t}</button>
        ))}
      </div>

      {/* ── ① 사람 구할 현장 (낙찰 자료 · 하루 570건씩 저절로 찹니다) ── */}
      <HireSites region={region} trade={trade} onSeeAll={onSeeAll} />

      {/* ── ② 우리 게시판 ── */}
      <div className="sec-title" style={{ marginTop: 18 }}>
        ✏️ K-건설맵 구인·구직
        <span className="count">{posts ? `${num(view.length)}건` : ''} · 회원가입 없이 바로 올립니다</span>
        <span style={{ flex: 1 }} />
        {!writing && <button className="btn sm" onClick={() => setWriting(true)}>글 올리기</button>}
      </div>

      <div className="seg" style={{ marginBottom: 10 }}>
        {['전체', ...TYPES].map((t) => (
          <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>{t}</button>
        ))}
      </div>

      {writing && (
        <WriteForm
          region0={region}
          trade0={trade}
          onClose={() => setWriting(false)}
          onDone={(id) => { addMine(id); setMine(loadMine()); setWriting(false); load() }}
        />
      )}

      {err && <div className="note" style={{ color: 'var(--bad)', marginBottom: 10 }}>{err}</div>}

      {posts === null ? <Skeleton n={2} /> : view.length === 0 ? (
        <Empty icon="🪧">
          {region === '전국' && trade === '전체' && type === '전체'
            ? <>아직 올라온 글이 없습니다.<br />첫 글을 올리시면 이 자리 맨 위에 뜹니다.</>
            : <>이 조건에는 올라온 글이 없습니다.<br />아래 워크넷 채용정보를 보시거나, 직접 올려보세요.</>}
        </Empty>
      ) : (
        view.map((p) => (
          <Post key={p.id} p={p} isMine={mine.includes(p.id)} onChanged={load} />
        ))
      )}

      <div className="note" style={{ margin: '8px 0 4px' }}>
        로그인 없이 누구나 올릴 수 있습니다. 올릴 때 정한 <b>4자리 숫자</b>가 있어야 글을 지울 수 있으니 꼭 기억해두세요.
        연락처는 그대로 공개되니 개인 휴대폰보다 업무용 번호를 권합니다. 허위·광고성 글은 예고 없이 삭제될 수 있습니다.
      </div>

      {/* ── ③ 워크넷 ── */}
      <div className="sec-title" style={{ marginTop: 18 }}>
        🔎 고용24(워크넷) 채용정보
        <span className="count">{region} · {trade === '전체' ? '건설 전체' : trade}</span>
        <span style={{ flex: 1 }} />
        <a className="btn ghost sm" style={{ textDecoration: 'none' }}
          href={url} target="_blank" rel="noopener noreferrer" onClick={wnLog}>새 창으로 크게 ↗</a>
      </div>

      {wide ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <iframe
            key={url}
            title={`고용24 채용정보 — ${region} ${trade}`}
            src={url}
            loading="lazy"
            style={{ display: 'block', width: '100%', height: 860, border: 0, background: '#fff' }}
          />
          <div className="note" style={{ padding: '10px 12px', borderTop: '1px solid var(--line)' }}>
            <b>칸 안에서 조금 내리시면 채용 목록이 나옵니다</b> — 고용24 화면이 「검색 조건」부터 열리기 때문입니다.
            시·군까지 좁히시려면 그 안에서 「지역별」을 누르시면 됩니다.<br />
            이 칸은 고용24 화면을 그대로 불러온 것입니다. K-건설맵이 목록을 옮겨 적은 것이 아니며,
            누르시는 것은 모두 워크넷으로 이어집니다. 칸이 비어 보이면 위 「새 창으로 크게」 로 여세요.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="note" style={{ marginBottom: 10 }}>
            워크넷 화면은 PC 용이라 휴대폰 안에 넣으면 보기 어렵습니다. 새 창으로 여세요.
          </div>
          <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <a className="btn" style={{ textDecoration: 'none' }}
              href={url} target="_blank" rel="noopener noreferrer" onClick={wnLog}>
              워크넷에서 {region} {trade === '전체' ? '건설' : trade} 일자리 보기 ↗
            </a>
            <a className="btn ghost" style={{ textDecoration: 'none' }}
              href={WN_REGION_PAGE} target="_blank" rel="noopener noreferrer">지역별로 고르기 ↗</a>
          </div>
        </div>
      )}

      <div className="note" style={{ marginTop: 10 }}>
        워크넷에 공고를 올리려면 <b>사업자등록번호로 기업회원 가입</b>을 해야 하고 승인도 기다려야 합니다.
        급하시면 위 <b>✏️ K-건설맵 구인·구직</b> 에 올리세요 — 바로 올라갑니다.<br />
        자료 출처: <b>고용24(워크넷) · 한국고용정보원</b>.
      </div>
    </>
  )
}

/* ── 🏗 사람 구할 현장 — 낙찰 자료를 «구인» 으로 읽는다 ────────────
   소장님: 「건설맵에 구인 구직을 띄우는 거야. 한 개 한 개씩…」

   워크넷 공고는 한 개씩 옮겨 그릴 수 없습니다(제4유형 · 기업회원 전용 API).
   그런데 **한 개씩 그려도 되는 자료가 이미 있습니다** — 조달청 낙찰 자료입니다.
   낙찰 = 곧 착공 = 곧 사람·장비가 필요하다. 하루 570건씩 저절로 찹니다.
   그래서 여기서는 «공사» 가 아니라 **«사람 구할 회사»** 를 앞에 세웁니다
   (같은 자료를 공사 중심으로 보는 화면은 🏗 낙찰 현장 갈래에 그대로 있습니다).

   ⚠️ 연락처는 조달청 나라장터가 공개하는 낙찰자 정보입니다. 개찰 직후엔 44%,
      2주 지나면 약 90% 가 찹니다. 없으면 «아직 없음» 이라고 적습니다 — 조용히 비우지 않습니다.
   ⚠️ 착공 시기는 공사마다 다릅니다. «곧» 이라고만 적고 날짜를 지어내지 않습니다.
   ────────────────────────────────────────────────────────── */
function HireSites({ region, trade, onSeeAll }) {
  const rx = TRADE_RX[trade] || null

  const match = useMemo(() => {
    if (region === '전국' && !rx) return null
    return (a) => {
      /* ⚠️ 칸 순서는 collect.py export_board 와 같아야 합니다 — 1순위·낙찰현장 탭과 동일 */
      const [name, inst, win, lic, sido] = a
      if (region !== '전국' && !inRegion({ name, inst, sido }, region)) return false
      if (rx && !rx.test(String(name) + ' ' + String(lic || ''))) return false
      return true
    }
  }, [region, rx])

  const { rows: all, pageRows, pageReady, total, loading } =
    useBoard('first', 'con', { match, page: 1, perPage: 24 })

  /* 연락처 있는 곳을 앞으로 — 구인 관점에서는 «전화가 되는 곳» 이 먼저입니다 */
  const view = useMemo(() => {
    const src = (pageRows != null ? pageRows : all).slice(0, 24)
    return [...src.filter((r) => r.tel), ...src.filter((r) => !r.tel)].slice(0, 6)
  }, [pageRows, all])

  const cnt = total != null ? total : all.length

  return (
    <>
      <div className="sec-title" style={{ marginTop: 16 }}>
        🏗 사람 구할 현장
        <span className="count">
          · {region}{rx ? ` · ${trade}` : ''} · 최근 낙찰 {cnt != null ? `${num(cnt)}건` : '세는 중…'}
        </span>
        <span style={{ flex: 1 }} />
        {onSeeAll && <button className="btn ghost sm" onClick={onSeeAll}>전체 보기 →</button>}
      </div>

      <div className="note" style={{ marginBottom: 10 }}>
        <b>낙찰 = 곧 착공 = 곧 사람·장비가 필요한 현장.</b> 방금 공사를 딴 회사와 연락처입니다.
        {!rx && trade !== '전체' && <> 「{trade}」는 어느 현장에나 필요한 자리라 공사 종류로 거르지 않았습니다.</>}
      </div>

      {loading || !pageReady ? <Skeleton n={3} /> : view.length === 0 ? (
        <Empty icon="🏗">이 조건에 맞는 최근 낙찰이 없습니다.<br />지역을 넓혀 보세요.</Empty>
      ) : view.map((r) => (
        <div className="notice site" key={r.no || r.name}>
          <div className="meta" style={{ marginBottom: 6 }}>
            <span className="badge b">구인 가능</span>
            {r.amt > 0 && <span className="badge n">{wonShort(r.amt)}</span>}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5 }}>낙찰 {dateFull(r.dt)}</span>
          </div>

          <h3 style={{ marginBottom: 2 }}>{r.win || '낙찰업체 아직 없음'}</h3>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '0 0 2px', wordBreak: 'keep-all' }}>
            {r.name}
          </div>
          {r.ceo && <div style={{ fontSize: 12, color: 'var(--muted)' }}>대표 {r.ceo}</div>}

          <div className="site-contact">
            {r.tel
              ? <a className="tel" href={'tel:' + String(r.tel).replace(/[^0-9+]/g, '')}>📞 {r.tel}</a>
              : <span className="muted" title="조달청 낙찰자 정보는 개찰 뒤 며칠에 걸쳐 채워집니다">📞 연락처 아직 없음</span>}
            {r.adr && <span className="adr">📍 {r.adr}</span>}
          </div>
        </div>
      ))}

      <div className="note" style={{ marginTop: 4 }}>
        출처: 조달청 나라장터 낙찰자 정보(업체명·대표자·전화·주소). 연락처는 개찰 뒤 며칠에 걸쳐 채워집니다.
        착공 시기는 공사마다 다르니 <b>연락 전에 확인</b>하세요.
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
function WriteForm({ onClose, onDone, region0, trade0 }) {
  /* 위에서 고른 지역·직종을 그대로 채워 둡니다 — 두 번 고르게 하지 않습니다 */
  const [f, setF] = useState({
    type: '구인',
    trade: trade0 && trade0 !== '전체' ? trade0 : '현장관리',
    region: region0 && region0 !== '전국' ? region0 : '전남',
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
