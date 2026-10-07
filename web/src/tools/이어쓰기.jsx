/**
 * 🔗 이어 쓰기 칸 — 프로그램 위에 붙는 한 줄 (2026-10-02 · G113)
 *
 * 소장님: 「자기가 한 번 쓰면 기록이 되는 거잖아. 이어서 쓸 수 있는 방법은 없어? 있어야 해」
 *         「프로그램으로 쓰는 것은 다 찾아서 그렇게 해줘 … 실수 하면 안 되고, 설명까지 넣어 주고」
 *
 * 쓰는 법 (프로그램 화면에서)
 *   <이어쓰기 ns="sn" 이름="산안비 계상기" 파일="산안비" st={st} setSt={setSt} 읽기={읽기} 쓰기={쓰기} />
 *   · st · setSt  — 화면 상태(지금처럼 localStorage 한 덩이)
 *   · 읽기 · 쓰기 — 그 프로그램의 lib 함수. 서버 것을 받으면 쓰기(받은 것) → setSt(읽기()) (프로그램이 모양을 고르게)
 *
 * ■ 고치면 2.5초 뒤 저절로 올립니다(잠가서). 다른 기기가 고친 것은 화면을 다시 볼 때(창 전환 · 새로고침) 받습니다.
 * ■ 둘 다 고쳤으면 덮어쓰지 않고 «고르기» 를 띄웁니다. 바뀌기 전 모습은 한 벌 보관(되돌리기 · 파일로 받기).
 * ■ 창(alert · confirm)을 띄우지 않습니다 — 끊기 · 불러오기는 «한 번 더 누르기».
 * ■ 셈 · 서버: lib/이어쓰기.js
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 이어손잡이, 연결읽기, 연결쓰기, 이어할일, 이어파일글, 이어파일읽기, 앞모습읽기, 앞모습두기, 기기이름 } from '../lib/이어쓰기.js'
import { 막힘 } from '../lib/장부.js'
import { 코드보기, 코드정리 } from '../lib/tuipbi.js'

const 두자 = (n) => String(n).padStart(2, '0')
const 시각 = (t) => { if (!t) return ''; const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${두자(d.getHours())}:${두자(d.getMinutes())}` }
const 오늘글 = () => { const d = new Date(); return `${d.getFullYear()}-${두자(d.getMonth() + 1)}-${두자(d.getDate())}` }
/* 📊 몇 명이 쓰나만(애널리틱스) — 코드 · 내용은 안 보냄 */
const 셈 = (일, ns) => { try { if (window.gtag) window.gtag('event', 'bk_' + 일, { ns }) } catch (e) { /* 광고차단기 */ } }
/* 🔗 공유 주소 ?bk=코드 — 받은 사람이 열면 «코드로 열기» 에 코드가 채워져 있음 */
const 주소코드 = () => { try { return 코드정리(new URLSearchParams(window.location.search).get('bk') || '') } catch (e) { return '' } }

function 내려받기(이름, 글) {
  const u = URL.createObjectURL(new Blob([글], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = u; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(u), 4000)
}

/* 🏗 G178 (2026-10-07) 자리 — 이 기기의 연결 · 바뀌기 전 모습을 두는 이름(없으면 ns). 노무비 계산기는 현장마다 다른 자리('nm@{현장}')를 넘겨
   현장마다 코드를 따로 겁니다. 서버 자리(ns_doc/코드)는 ns 그대로 — 코드가 다르니 섞이지 않습니다. */
export default function 이어쓰기({ ns, 자리, 이름, 파일, st, setSt, 읽기, 쓰기 }) {
  const 곳 = 자리 || ns
  const h = useMemo(() => 이어손잡이(ns), [ns])
  const [연결, set연결상태] = useState(() => 연결읽기(곳))
  const 연결r = useRef(연결)
  const set연결 = (v) => { 연결r.current = v; 연결쓰기(곳, v); set연결상태(v) }
  const stR = useRef(st)
  stR.current = st
  const 마지막글 = useRef(연결 && !연결.d ? JSON.stringify(st) : null)
  const 본글 = useRef(JSON.stringify(st))          /* 바로 앞 화면 상태 — 크게 지워지면 그 전 모습을 보관(되돌리기) */
  const 비행 = useRef(false)
  const 다시 = useRef(false)
  const 타이머 = useRef(null)

  const [저장, set저장상태] = useState(연결 ? (연결.d ? 'dirty' : 'ok') : 'off')
  const 저장r = useRef(저장)
  const set저장 = (v) => { 저장r.current = v; set저장상태(v) }
  const [마지막, set마지막] = useState(연결 && 연결.t ? { at: 연결.t } : null)
  const [충돌, set충돌] = useState(null)
  const [화면, set화면] = useState('')          // '' | 'make' | 'open' | 'made' | 'more' | 'help'
  const [폼, set폼] = useState({ name: '', pw: '', pw2: '', c: '' })
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [알림, set알림] = useState('')
  const [한번더, set한번더] = useState('')       // '끊기' | '불러오기' | '되돌리기'
  const [불러온, set불러온] = useState(null)
  const 파일칸 = useRef(null)

  /* ── 서버 것을 화면에 ── */
  function 들이기(x, v, 보관) {
    if (보관 && JSON.stringify(stR.current) !== JSON.stringify(x.상태)) 앞모습두기(곳, stR.current)
    쓰기(x.상태)
    const 새 = 읽기()
    마지막글.current = JSON.stringify(새)
    본글.current = 마지막글.current
    set연결({ ...v, r: x.r, d: false, t: Date.now() })
    set저장('ok'); set충돌(null)
    set마지막({ at: x.at || Date.now(), by: x.by })
    setSt(새)
  }

  async function 받아들이기(보관) {
    const v = 연결r.current
    if (!v) return
    const 열 = h.열쇠(v.c)
    if (!열) { set저장('lock'); return }
    const x = await h.받기(v.c, 열)
    if (!x) { set연결({ ...v, r: 0, d: true }); 올림(); return }
    if (x.잠김) { set저장('lock'); return }
    들이기(x, v, 보관)
    if (!보관) set알림(`${x.by || '다른 기기'}에서 고친 것을 받았습니다${x.at ? ` (${시각(x.at)})` : ''}.`)
  }

  /* ── 올리기 ── */
  function 미루어올림(ms) {
    clearTimeout(타이머.current)
    타이머.current = setTimeout(() => 올림(), ms)
  }
  async function 올림() {
    clearTimeout(타이머.current)
    const v = 연결r.current
    if (!v || 저장r.current === 'conflict' || 저장r.current === 'lock') return
    if (비행.current) { 다시.current = true; return }
    if (!v.d && JSON.stringify(stR.current) === 마지막글.current) {      // 이미 올린 것과 같음 — 판만 올리지 않게
      다시.current = false
      if (저장r.current !== 'ok') set저장('ok')
      return
    }
    const 열 = h.열쇠(v.c)
    if (!열) { set저장('lock'); return }
    비행.current = true
    set저장('ing')
    const 보낼 = stR.current
    const j = JSON.stringify(보낼)
    const 느림 = setTimeout(() => { if (저장r.current === 'ing') set저장('wait') }, 8000)
    try {
      const r = await h.올리기(v.c, 열, 보낼, v.r || 0)
      마지막글.current = j
      const 아직 = JSON.stringify(stR.current) !== j
      set연결({ ...연결r.current, r, d: 아직, t: Date.now() })
      set저장(아직 ? 'dirty' : 'ok')
      set마지막({ at: Date.now(), by: 기기이름() })
      if (아직) 다시.current = true
    } catch (e) {
      if (e && e.code === '충돌') { set충돌({ 서버판: e.서버판 }); set저장('conflict'); set알림('') }
      else if (e && e.code === '큼') set저장('big')
      else if (막힘(e)) set저장('lock')
      else set저장('wait')
    } finally {
      clearTimeout(느림)
      비행.current = false
      if (다시.current && (저장r.current === 'dirty' || 저장r.current === 'ok')) { 다시.current = false; 미루어올림(1500) }
    }
  }

  /* ── 서버와 맞추기(열 때 · 창으로 돌아올 때 · 인터넷이 돌아올 때) ── */
  async function 맞추기() {
    const v = 연결r.current
    if (!v || 비행.current || 저장r.current === 'conflict') return
    const 열 = h.열쇠(v.c)
    if (!열) { set저장('lock'); return }
    let sp
    try { sp = await h.판보기(v.c) } catch (e) { set저장(막힘(e) ? 'lock' : 'wait'); return }
    const 일 = 이어할일(sp, v.r || 0, !!v.d)
    if (일 === '없음') { set연결({ ...v, r: 0, d: true }); 올림() }
    else if (일 === '올림') 올림()
    else if (일 === '받음') { try { await 받아들이기(false) } catch (e) { set저장(막힘(e) ? 'lock' : 'wait') } }
    else if (일 === '충돌') { set충돌({ 서버판: sp }); set저장('conflict'); set알림('') }
    else if (저장r.current !== 'ok') set저장('ok')
  }

  /* 화면 상태가 바뀌면 → «못 올린 고침» 표시 + 2.5초 뒤 올림 */
  useEffect(() => {
    const j = JSON.stringify(st)
    const 앞글 = 본글.current
    본글.current = j
    /* 🗑 크게 지워짐(모두 비우기 · 처음부터 등) — 지우기 전 모습을 한 벌 보관해 «↩ 되돌리기» 로 살림 */
    if (앞글 && 앞글.length > 400 && j.length < 앞글.length * 0.5) {
      try { if (앞모습두기(곳, JSON.parse(앞글))) set알림(`많이 지워졌습니다 — 지우기 전 모습은 보관해 두었습니다(«💾 백업 · 더 보기» → «↩ 되돌리기»).${연결r.current ? ' 코드로 이어 쓰는 중이라 다른 기기에서도 지워집니다.' : ''}`) } catch (e) { /* 없음 */ }
    }
    const v = 연결r.current
    if (!v) return
    if (j === 마지막글.current) return
    if (!v.d) set연결({ ...v, d: true })
    if (저장r.current === 'ok') set저장('dirty')
    미루어올림(2500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st])

  /* 열 때 한 번 · 창으로 돌아올 때 · 인터넷이 돌아올 때 · 못 올렸으면 30초마다 */
  useEffect(() => {
    if (연결r.current) 맞추기()
    const 보임 = () => {
      if (!연결r.current) return
      if (document.visibilityState === 'visible') 맞추기()
      else if (연결r.current.d) 올림()
    }
    const 돌아옴 = () => { if (연결r.current) 맞추기() }
    document.addEventListener('visibilitychange', 보임)
    window.addEventListener('online', 돌아옴)
    const 틈 = setInterval(() => { const v = 연결r.current; if (v && v.d && 저장r.current === 'wait') 맞추기() }, 30000)
    if (!연결r.current && 주소코드().length === 9) { set폼((f) => ({ ...f, c: 코드보기(주소코드()) })); set화면('open') }
    return () => {
      document.removeEventListener('visibilitychange', 보임); window.removeEventListener('online', 돌아옴); clearInterval(틈); clearTimeout(타이머.current)
      if (연결r.current && 연결r.current.d) 올림()      /* 다른 화면으로 옮길 때 못 올린 것이 있으면 바로 올림 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── 단추들 ── */
  const 폼칸 = (k) => (e) => set폼((f) => ({ ...f, [k]: e.target.value }))
  const 처음으로 = () => { set화면(''); set오류(''); set폼({ name: '', pw: '', pw2: '', c: '' }) }

  async function 만들기() {
    const 이름글 = 폼.name.trim() || `${이름} 장부`
    if (폼.pw.length < 6) { set오류('비밀번호는 6자 이상으로 해 주십시오.'); return }
    if (폼.pw !== 폼.pw2) { set오류('비밀번호가 서로 다릅니다.'); return }
    set오류(''); set바쁨('코드를 만들고 지금 쓴 것을 잠가서 올리는 중입니다…')
    try {
      const 보낸 = stR.current
      const x = await h.만들기(이름글, 폼.pw, 보낸)
      const j = JSON.stringify(보낸)
      마지막글.current = j
      const 아직 = JSON.stringify(stR.current) !== j
      set연결({ c: x.코드, n: x.이름, r: x.r, d: 아직, t: Date.now() })
      set저장(아직 ? 'dirty' : 'ok'); set마지막({ at: Date.now(), by: 기기이름() })
      set폼({ name: '', pw: '', pw2: '', c: '' }); set화면('made')
      셈('make', ns)
      if (아직) 미루어올림(1500)
    } catch (e) {
      set오류(e && e.code === '큼' ? '적은 것이 너무 많아 한 번에 올릴 수 없습니다 — «💾 파일로 받기» 로 보관해 주십시오.' : '코드를 만들지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }

  async function 열기() {
    const c = 코드정리(폼.c)
    if (c.length !== 9) { set오류('코드는 9자리입니다 (예: ABC-DEF-GHJ).'); return }
    if (!폼.pw) { set오류('비밀번호를 넣어 주십시오.'); return }
    const 앞 = 연결r.current
    if (앞 && 앞.d) { set오류('아직 서버에 못 올린 고침이 있습니다 — 저장된 뒤에 여시거나, 먼저 «💾 파일로 받기» 로 보관해 주십시오.'); return }
    set오류(''); set바쁨('비밀번호를 확인하고 받는 중입니다…')
    try {
      const x = await h.열기(c, 폼.pw)
      const v = { c, n: x.이름, r: 0, d: false, t: Date.now() }
      if (!x.서버) {
        마지막글.current = null
        set연결({ ...v, d: true }); set저장('dirty'); 미루어올림(500)
        set알림('코드를 열었습니다 — 서버에 아직 적은 것이 없어 이 기기의 것을 올립니다.')
      } else if (x.서버.잠김) {
        set오류('받은 것을 풀지 못했습니다 — 비밀번호를 다시 확인해 주십시오.'); return
      } else {
        const 다름 = JSON.stringify(stR.current) !== JSON.stringify(x.서버.상태)
        들이기(x.서버, v, true)
        set알림(다름 ? '코드의 것을 받았습니다. 이 기기에 있던 것은 따로 보관해 두었습니다(«💾 백업 · 더 보기» → «↩ 되돌리기»).' : '코드의 것을 받았습니다.')
      }
      set폼({ name: '', pw: '', pw2: '', c: '' }); set화면('')
      셈('open', ns)
    } catch (e) {
      set오류(막힘(e) ? '코드나 비밀번호가 맞지 않습니다.' : '열지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }

  async function 비번다시() {
    const v = 연결r.current
    if (!v || !폼.pw) { set오류('비밀번호를 넣어 주십시오.'); return }
    set오류(''); set바쁨('비밀번호를 확인하는 중입니다…')
    try {
      await h.열기(v.c, 폼.pw)
      set폼((f) => ({ ...f, pw: '' }))
      set저장(v.d ? 'dirty' : 'ok')
      await 맞추기()
    } catch (e) {
      set오류(막힘(e) ? '비밀번호가 맞지 않습니다.' : '확인하지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.')
    } finally { set바쁨('') }
  }

  async function 끊기() {
    if (한번더 !== '끊기') { set한번더('끊기'); return }
    set한번더(''); set바쁨('이 기기에서 끊는 중입니다…')
    const v = 연결r.current
    try { await h.끊기(v.c) } catch (e) { /* 그래도 끊음 */ }
    clearTimeout(타이머.current)
    마지막글.current = null
    set연결(null); set저장('off'); set충돌(null); set화면(''); set바쁨('')
    set알림('이 기기에서 끊었습니다 — 적은 것은 이 브라우저에 그대로 있고, 서버 것도 그대로입니다(코드 + 비밀번호로 다시 열 수 있음).')
  }

  async function 그쪽받기() {
    set바쁨('다른 기기에서 고친 것을 받는 중입니다…')
    try { set저장('ing'); await 받아들이기(true); set알림('다른 기기의 것을 받았습니다. 이 기기에서 고친 것은 따로 보관해 두었습니다(«💾 백업 · 더 보기» → «↩ 되돌리기»).') }
    catch (e) { set저장('conflict'); set오류('받지 못했습니다 — 인터넷을 확인하고 다시 해 보십시오.') }
    finally { set바쁨('') }
  }
  function 내것올리기() {
    const v = 연결r.current
    if (!v || !충돌) return
    set연결({ ...v, r: 충돌.서버판 || 0, d: true })
    set충돌(null); set저장('dirty')
    올림()
  }

  const [복사됨, set복사됨] = useState(false)
  async function 복사() {
    const v = 연결r.current
    if (!v) return
    const 주소 = `${window.location.origin}${window.location.pathname}?bk=${v.c}`
    const 글 = `K-건설맵 ${이름} — 이어 쓰기\n코드 ${코드보기(v.c)}\n${주소}\n(비밀번호는 따로 알려 드립니다)`
    try { await navigator.clipboard.writeText(글); set복사됨(true); setTimeout(() => set복사됨(false), 2500) }
    catch (e) { set알림(글.replace(/\n/g, ' · ')) }
  }

  function 파일받기() {
    내려받기(`${파일}_백업_${오늘글()}.json`, 이어파일글(ns, 이름, stR.current))
    set알림('백업 파일을 받았습니다 — 다른 기기에서 «📂 파일 불러오기» 로 되살립니다.')
  }
  function 파일고름(e) {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    const rd = new FileReader()
    rd.onload = () => {
      const x = 이어파일읽기(ns, String(rd.result || ''))
      if (x.오류) { set오류(x.오류); set불러온(null); return }
      set오류(''); set불러온({ ...x, 이름: f.name }); set한번더('불러오기')
    }
    rd.onerror = () => set오류('파일을 읽지 못했습니다.')
    rd.readAsText(f)
  }
  function 불러오기확정() {
    if (!불러온) return
    앞모습두기(곳, stR.current)
    쓰기(불러온.상태)
    setSt(읽기())
    set불러온(null); set한번더('')
    set알림(`«${불러온.이름}» 을(를) 불러왔습니다. 바뀌기 전 것은 따로 보관해 두었습니다(«💾 백업 · 더 보기» → «↩ 되돌리기»).${연결r.current ? ' 곧 서버에도 올립니다.' : ''}`)
  }
  function 되돌리기() {
    const p = 앞모습읽기(곳)
    if (!p || !p.상태) return
    if (한번더 !== '되돌리기') { set한번더('되돌리기'); return }
    set한번더('')
    앞모습두기(곳, stR.current)
    쓰기(p.상태)
    setSt(읽기())
    set알림(`${시각(p.at)} 에 보관한 모습으로 되돌렸습니다. 방금 것도 다시 보관해 두었습니다(한 번 더 «↩ 되돌리기» 면 돌아감).`)
  }

  const 앞 = 앞모습읽기(곳)

  /* ── 그리기 ── */
  const 상태글 = {
    off: null,
    ok: <span className="bk-ok">✅ 서버에 저장됨{마지막 ? ` · ${시각(마지막.at)}${마지막.by ? ' ' + 마지막.by : ''}` : ''}</span>,
    dirty: <span className="bk-ing">✏️ 고친 것 올리기 전</span>,
    ing: <span className="bk-ing">⏳ 서버에 올리는 중…</span>,
    wait: <span className="bk-warn">📶 인터넷이 안 돼 이 브라우저에만 저장됨 — 연결되면 올립니다</span>,
    lock: <span className="bk-warn">🔒 이 기기에서 비밀번호를 한 번 더 넣어야 합니다</span>,
    conflict: <span className="bk-warn">⚠️ 다른 기기에서 먼저 고쳤습니다 — 아래에서 골라 주십시오</span>,
    big: <span className="bk-warn">⚠️ 적은 것이 너무 많아 서버에 못 올립니다 — «💾 파일로 받기» 로 보관해 주십시오</span>,
  }[저장] || null

  return (
    <div className="bk no-print" data-ns={ns}>
      <div className="bk-bar">
        {연결
          ? <><b>🔗 이어 쓰기</b><span className="bk-code">{연결.n ? `${연결.n} · ` : ''}코드 {코드보기(연결.c)}</span>{상태글}</>
          : <><b>🔗 폰·PC 어디서든 이어 쓰기</b><span className="muted">지금은 이 브라우저에만 저장됩니다</span></>}
        <span className="bk-btns">
          {!연결 && <button type="button" className="btn sm" onClick={() => { 처음으로(); set화면('make') }}>코드 만들기</button>}
          {!연결 && <button type="button" className="btn line sm" onClick={() => { 처음으로(); set화면('open') }}>코드로 열기</button>}
          {연결 && <button type="button" className="btn line sm" onClick={() => { set오류(''); 맞추기() }} disabled={!!바쁨}>⟳ 새로 받기</button>}
          <button type="button" className="btn ghost sm" onClick={() => set화면(화면 === 'more' ? '' : 'more')}>💾 백업 · 더 보기</button>
          <button type="button" className="btn ghost sm" onClick={() => set화면(화면 === 'help' ? '' : 'help')}>❓ 설명</button>
        </span>
      </div>

      {바쁨 && <div className="bk-busy">{바쁨}</div>}
      {오류 && <div className="bk-err">{오류}</div>}
      {알림 && <div className="bk-note">{알림} <button type="button" className="bk-x" onClick={() => set알림('')} aria-label="닫기">✕</button></div>}

      {저장 === 'lock' && 연결 && (
        <div className="bk-box">
          <div>🔒 이 기기의 잠금 열쇠가 없습니다(브라우저 저장소를 비웠거나 다른 곳에서 끊음). <b>비밀번호</b>를 한 번 더 넣어 주십시오 — 적은 것은 이 브라우저에 그대로 있습니다.</div>
          <div className="bk-row">
            <input className="inp" type="password" placeholder="비밀번호" value={폼.pw} onChange={폼칸('pw')} autoComplete="current-password" />
            <button type="button" className="btn sm" onClick={비번다시} disabled={!!바쁨}>확인</button>
          </div>
        </div>
      )}

      {저장 === 'conflict' && 연결 && (
        <div className="bk-box warn">
          <div>⚠️ <b>다른 기기(또는 같이 쓰는 분)가 먼저 고쳐 올렸습니다.</b> 덮어쓰지 않고 멈췄습니다. 어느 쪽으로 할지 골라 주십시오.</div>
          <div className="bk-row">
            <button type="button" className="btn sm" onClick={그쪽받기} disabled={!!바쁨}>그쪽 것 받기 (이 기기 것은 보관)</button>
            <button type="button" className="btn line sm" onClick={내것올리기} disabled={!!바쁨}>이 기기 것으로 올리기</button>
            <button type="button" className="btn ghost sm" onClick={파일받기}>💾 이 기기 것 파일로 받기</button>
          </div>
        </div>
      )}

      {화면 === 'make' && (
        <div className="bk-box">
          <div><b>코드 만들기</b> — 지금 이 브라우저에 쓴 것이 <b>비밀번호로 잠겨</b> 서버에 올라갑니다. 다른 기기에서는 코드 + 비밀번호로 엽니다.</div>
          <div className="bk-form">
            <label>장부 이름 (잠그지 않음 — 알아볼 만큼만) <input className="inp" value={폼.name} onChange={폼칸('name')} placeholder={`${이름} 장부`} maxLength={60} /></label>
            <label>비밀번호 (6자 이상) <input className="inp" type="password" value={폼.pw} onChange={폼칸('pw')} autoComplete="new-password" /></label>
            <label>비밀번호 한 번 더 <input className="inp" type="password" value={폼.pw2} onChange={폼칸('pw2')} autoComplete="new-password" /></label>
          </div>
          <div className="bk-row">
            <button type="button" className="btn sm" onClick={만들기} disabled={!!바쁨}>만들기</button>
            <button type="button" className="btn ghost sm" onClick={처음으로}>그만두기</button>
          </div>
          <div className="muted sm">⚠️ 비밀번호를 잊으면 서버 것은 저희도 열어 드릴 수 없습니다(잠가 두기 때문). 적어 두시고, 가끔 «💾 파일로 받기» 로 보관하십시오.</div>
        </div>
      )}

      {화면 === 'made' && 연결 && (
        <div className="bk-box ok">
          <div>✅ 만들었습니다. 이 <b>코드</b>와 비밀번호를 적어 두십시오.</div>
          <div className="bk-big">{코드보기(연결.c)}</div>
          <div>다른 기기(폰 · 사무실 PC)에서 이 화면을 열고 <b>«코드로 열기»</b> → 코드 + 비밀번호 → 이어서 씁니다. 같이 쓸 직원에게도 코드와 비밀번호를 알려 주면 됩니다.</div>
          <div className="bk-row">
            <button type="button" className="btn line sm" onClick={복사}>{복사됨 ? '✓ 복사했습니다' : '📋 코드 · 주소 복사 (카톡으로 보내기)'}</button>
            <button type="button" className="btn ghost sm" onClick={() => set화면('')}>닫기</button>
          </div>
        </div>
      )}

      {화면 === 'open' && (
        <div className="bk-box">
          <div><b>코드로 열기</b> — 다른 기기에서 만든 코드와 비밀번호를 넣으면 그 내용을 받아 이어서 씁니다.</div>
          <div className="bk-form">
            <label>코드 9자리 <input className="inp" value={폼.c} onChange={폼칸('c')} placeholder="ABC-DEF-GHJ" autoCapitalize="characters" /></label>
            <label>비밀번호 <input className="inp" type="password" value={폼.pw} onChange={폼칸('pw')} autoComplete="current-password" /></label>
          </div>
          <div className="bk-row">
            <button type="button" className="btn sm" onClick={열기} disabled={!!바쁨}>열기</button>
            <button type="button" className="btn ghost sm" onClick={처음으로}>그만두기</button>
          </div>
          <div className="muted sm">열면 이 기기의 것은 코드의 것으로 바뀝니다. 이 기기에 있던 것은 따로 한 벌 보관해 두어 «💾 백업 · 더 보기» → «↩ 되돌리기» 를 할 수 있습니다.</div>
        </div>
      )}

      {화면 === 'more' && (
        <div className="bk-box">
          <div className="bk-row">
            <button type="button" className="btn line sm" onClick={파일받기}>💾 파일로 받기</button>
            <button type="button" className="btn line sm" onClick={() => 파일칸.current && 파일칸.current.click()}>📂 파일 불러오기</button>
            <input ref={파일칸} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={파일고름} />
            {앞 && 앞.상태 && <button type="button" className="btn ghost sm" onClick={되돌리기}>{한번더 === '되돌리기' ? `한 번 더 누르면 ${시각(앞.at)} 모습으로` : `↩ 되돌리기 (${시각(앞.at)} 보관)`}</button>}
            {연결 && <button type="button" className="btn ghost sm" onClick={복사}>{복사됨 ? '✓ 복사했습니다' : '📋 코드 · 주소 복사'}</button>}
            {연결 && <button type="button" className="btn ghost sm" onClick={() => { 처음으로(); set화면('open') }}>다른 코드 열기</button>}
            {연결 && <button type="button" className="btn ghost sm bk-cut" onClick={끊기} disabled={!!바쁨}>{한번더 === '끊기' ? '한 번 더 누르면 끊습니다' : '이 기기에서 끊기'}</button>}
          </div>
          {불러온 && (
            <div className="bk-row">
              <span>«{불러온.이름}»{불러온.at ? ` (${시각(불러온.at)} 백업)` : ''} — 불러오면 지금 것은 따로 보관하고 바뀝니다.</span>
              <button type="button" className="btn sm" onClick={불러오기확정}>불러오기</button>
              <button type="button" className="btn ghost sm" onClick={() => { set불러온(null); set한번더('') }}>그만두기</button>
            </div>
          )}
          {연결 && 연결.d && 한번더 === '끊기' && <div className="bk-err">아직 서버에 못 올린 고침이 있습니다 — 끊어도 이 브라우저에는 남지만, 다른 기기에는 안 갑니다.</div>}
          <div className="muted sm">백업 파일은 이 프로그램에 적은 것 전부(JSON)입니다. 인터넷 없이 보관하고, 다른 기기 · 다른 브라우저에서 «📂 파일 불러오기» 로 되살립니다.</div>
        </div>
      )}

      {화면 === 'help' && (
        <div className="bk-box">
          <ul className="bk-help">
            <li><b>처음엔 이 브라우저에만</b> 저장됩니다. 창을 닫았다 열어도 그대로이지만, 다른 기기(폰 ↔ PC)에는 없고 브라우저 기록을 지우면 같이 지워집니다.</li>
            <li><b>«코드 만들기»</b> — 비밀번호를 정하면 9자리 코드가 생기고, 지금까지 쓴 것이 서버에 올라갑니다. 회원가입 없음 · 무료.</li>
            <li><b>다른 기기에서</b> 같은 화면 → «코드로 열기» → 코드 + 비밀번호. 그다음부터는 고치면 몇 초 뒤 저절로 서버에 저장되고, 다른 기기는 화면을 다시 볼 때(새로고침 · 창 전환 · «⟳ 새로 받기») 받아 옵니다.</li>
            <li><b>같이 쓰기</b> — 코드와 비밀번호를 아는 사람(현장 직원)은 같이 보고 씁니다. 두 곳에서 같은 때 고치면 늦게 올린 쪽에 «먼저 고친 것이 있습니다» 가 떠서 고르게 합니다 — 덮어써서 사라지지 않습니다.</li>
            <li><b>잠금</b> — 적은 내용은 비밀번호로 잠근 글자로만 서버에 올라갑니다. 저희(운영자)도 읽을 수 없습니다(잠그지 않는 것은 «장부 이름» 하나). 그래서 <b>비밀번호를 잊으면 서버 것은 되살릴 수 없습니다</b>.</li>
            <li><b>백업 · 되돌리기</b> — 서버 것은 매일 한 번 따로 떠 둡니다(90일 · 되살려야 하면 맵톡에 코드와 함께 남겨 주십시오). 직접 보관하려면 «💾 파일로 받기», 되살릴 땐 «📂 파일 불러오기». 모두 비우기처럼 많이 지우면 지우기 전 모습을 한 벌 보관해 «↩ 되돌리기» 로 살립니다.</li>
            <li><b>직원에게 알려 주기</b> — «📋 코드 · 주소 복사» 를 카톡에 붙여 보내고, 비밀번호는 따로 알려 주십시오. 받은 주소를 열면 코드가 채워져 있습니다.</li>
            <li><b>이 기기에서 끊기</b> — 이 기기만 연결을 풉니다. 이 브라우저에 쓴 것과 서버 것은 그대로입니다.</li>
          </ul>
        </div>
      )}
    </div>
  )
}
