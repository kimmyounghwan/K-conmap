/**
 * /jeoksan/fill — 🔒 공내역서 단가 채우기 (소장님만) · 2026-09-23
 *
 * 소장님: 「웹에서 직접 올리는 것」 · 「애매한 부분은 우리 단가 자료에서 3개나 5개를 보여주고
 *          이용자가 선택」 · 「1차로 채워주고, 2차로 사람이 검증」 · 「나만 쓸 수 있게」
 *
 * ■ 하는 일
 *    ① 공내역서(.xlsx)를 올리면  ② 서버(jeoksanfill 함수)가 PC 의 K-적산 프로그램 «그대로» 단가를 채우고
 *    ③ 애매한 줄은 후보 1~5 를 보여 드립니다  ④ 고르시면 다시 채워 엑셀로 받습니다.
 * ■ 도면 (2026-09-24) — 소장님: 「캐드 파일은 지금 안되는 거야? 같이 드래그 해서 놓으면…」
 *    도면(.dxf)·재료표를 같이 놓으면 «브라우저 안에서» 물량을 세고(lib/도면물량.js = 실험실과 같은 셈),
 *    센 물량만 서버로 보내 공내역서와 맞대 봅니다(도면대조 탭). 공내역서 없이 도면만이면 도면 물량으로 내역서를 만듭니다.
 *    ⚠️ 도면·재료표 파일은 서버로 가지 않습니다. 재료표는 이 브라우저(IndexedDB)가 기억합니다(실험실과 같은 칸).
 *
 * ■ 🔒 소장님만 — 화면은 «문 앞 이름표»(lib/운영자.js) 이고, 진짜 자물쇠는 함수입니다.
 *    함수가 로그인 번호를 확인해 OPS 가 아니면 403 을 돌려줍니다.
 * ■ 공내역서와 채운 결과는 서버에 남지 않습니다. 남는 것은 고르신 «짝» 뿐입니다(다음에 자동으로 붙게).
 * ■ ⚠️ 셈·자료는 여기에 없습니다(공개 저장소에 올리지 않음). 이 화면은 올리고 받는 일만 합니다.
 * ⚠️ 검색엔진에 올리지 않습니다 — noindex, sitemap·prerender 에도 안 넣습니다.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { isOp } from '../lib/운영자.js'

const 함수주소 = import.meta.env.VITE_JEOKSAN_FN
  || 'https://us-central1-k-conmap.cloudfunctions.net/jeoksanfill'

const 지역들 = ['', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주']

const 이름표 = {
  임시: ['임시', '1등 후보로 임시로 채움 — 확인'],
  장부확인: ['장부확인', '지난번 짝으로 채움 — 확인'],
  골라주십시오: ['골라', '후보 중에 골라 주십시오'],
  참고후보: ['참고', '닮은 것이 약합니다 — 참고만'],
  못찾음: ['못찾음', '자료에 없습니다 (견적 품목)'],
  직접넣을줄: ['직접', '1식 금액 — 직접 넣으십시오'],
}

let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const f = await import('../firebase.js')
    _fb = { auth: f.auth, ensureAnon: f.ensureAnon }
  }
  return _fb
}

const won = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n || 0))
const 수 = (n) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 3 }).format(n || 0)

function b64toUrl(b64) {
  const bin = atob(b64)
  const u = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([u], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
}

export default function JeoksanFill() {
  const [uid, setUid] = useState(undefined)
  useEffect(() => {
    document.title = '공내역서 단가 채우기 · K-건설맵'
    let el = document.head.querySelector('meta[name="robots"]')
    if (!el) { el = document.createElement('meta'); el.setAttribute('name', 'robots'); document.head.appendChild(el) }
    el.setAttribute('content', 'noindex, nofollow')
    loadFb().then(({ ensureAnon }) => ensureAnon())
      .then((u) => setUid((u && u.uid) || ''))
      .catch(() => setUid(''))
    return () => { if (el) el.remove() }
  }, [])

  if (uid === undefined) return <div className="wrap"><div className="card muted">여는 중…</div></div>
  const 시험 = import.meta.env.VITE_JEOKSAN_TEST === '1'
  if (!isOp(uid) && !시험) {
    return (
      <div className="wrap">
        <div className="card">
          <div className="sec-title">🔒 공내역서 단가 채우기</div>
          <p className="muted" style={{ margin: 0 }}>소장님 브라우저에서만 쓸 수 있습니다.</p>
        </div>
      </div>
    )
  }
  return <Fill />
}

/* 파일 가리기·도면 세기는 필요할 때만 불러옵니다 (처음 화면을 가볍게) */
let _m = null
const 모듈 = async () => {
  if (!_m) {
    const [g, d, k] = await Promise.all([
      import('../lib/파일가리기.js'), import('../lib/도면물량.js'), import('../lib/기억자료.js')])
    _m = { 가리기: g, 물: d, 기억: k }
  }
  return _m
}
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const 차이글 = (v) => (v === null || v === undefined) ? '' : `${v > 0 ? '+' : ''}${Math.abs(v) < 0.05 ? '0' : v.toFixed(1)}%`

function Fill() {
  const [file, setFile] = useState(null)          /* 공내역서 {name, size, blob, 까닭} — 다시 채울 때 또 보냅니다 */
  const [도면들, set도면들] = useState([])         /* [{name, size, text, n, 꼴}] — 브라우저 안에만 */
  const [재료표, set재료표] = useState(null)       /* {name, buf, 기억} — 브라우저 안에만 */
  const [안내, set안내] = useState([])             /* 방금 놓은 파일마다 무엇으로 봤는지 */
  const [지역, set지역] = useState(() => { try { return localStorage.getItem('kcm_fill_region') || '' } catch { return '' } })
  const [임시채움, set임시채움] = useState(true)
  const [busy, setBusy] = useState('')
  const [초, set초] = useState(0)
  const [err, setErr] = useState('')
  const [res, setRes] = useState(null)            /* 함수가 돌려준 것 */
  const [url, setUrl] = useState('')
  const [고른, set고른] = useState({})            /* {열쇠: 1~5 | 'x'} */
  const [보기, set보기] = useState('확인')
  const [몇, set몇] = useState(40)
  const [끌림, set끌림] = useState(false)
  const inRef = useRef(null)
  const timer = useRef(null)

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  useEffect(() => { try { localStorage.setItem('kcm_fill_region', 지역) } catch { /* */ } }, [지역])

  /* 지난번에 놓은 재료표를 꺼내 옵니다 (실험실과 같은 기억 — 이 브라우저 안에만) */
  useEffect(() => {
    let 살 = true
    모듈().then((m) => m.기억.꺼내기('재료표')).then((재) => {
      if (살 && 재 && 재.바이트) set재료표((o) => o || { name: 재.name, buf: new Uint8Array(재.바이트), 기억: true })
    }).catch(() => { /* 기억이 없거나 사생활 모드 */ })
    return () => { 살 = false }
  }, [])

  /* 도면(쪽지) + 재료표 → 물량 — 브라우저 안에서 셉니다 */
  const 물량 = useMemo(() => {
    if (!_m || !재료표 || !도면들.some((d) => d.n)) return null
    try {
      const r = _m.물.세기(도면들, 재료표)
      return { ...r, 산출서: r.산출서.map((x) => ({ ...x, url: URL.createObjectURL(new Blob([x.bytes], { type: XLSX })), bytes: null })) }
    } catch (e) {
      return { 오류: String(e?.message || e), 항목: [], 경고: [], 산출서: [], 심각: 0, 쪽지: 0 }
    }
  }, [도면들, 재료표])
  useEffect(() => () => { (물량?.산출서 || []).forEach((x) => { try { URL.revokeObjectURL(x.url) } catch { /* */ } }) }, [물량])

  const 놓기 = async (files) => {
    const fs = [...(files || [])]
    if (!fs.length) return
    setErr('')
    let m
    try { m = await 모듈() } catch (e) { setErr('화면 부품을 못 불러왔습니다 — 새로고침해 주십시오'); return }
    const 말 = []
    let 새내역 = null, 새재료 = null
    const 새도면 = []
    for (const f of fs) {
      const 끝 = (f.name.match(/\.[^.]+$/) || [''])[0].toLowerCase()
      try {
        if (끝 === '.dwg') {
          말.push({ name: f.name, 갈래: '✕', 까닭: '.dwg 는 못 읽습니다 — 캐드에서 «다른 이름으로 저장 → DXF» 로 저장해 놓아 주십시오' })
        } else if (끝 === '.dxf') {
          const d = m.물.도면풀기(f.name, new Uint8Array(await f.arrayBuffer()))
          새도면.push({ ...d, size: f.size })
          말.push({ name: f.name, 갈래: '도면', 까닭: d.n ? `찍어 둔 쪽지 ${d.n}개` : '찍어 둔 쪽지(KQTO)가 없습니다 — 이 도면에서는 물량이 안 나옵니다' })
        } else if (끝 === '.csv' || 끝 === '.txt') {
          const t = await f.text()
          if (m.가리기.글자가리기(t) === '치수표') {
            const d = m.물.치수표풀기(f.name, t)
            새도면.push({ ...d, size: f.size })
            말.push({ name: f.name, 갈래: '치수표', 까닭: `산출단위 ${d.n}줄` })
          } else {
            말.push({ name: f.name, 갈래: '✕', 까닭: '단가표는 여기서 안 씁니다 — 단가는 적산자료로 채웁니다' })
          }
        } else if (끝 === '.xlsx') {
          if (f.size > 30 * 1024 * 1024) { 말.push({ name: f.name, 갈래: '✕', 까닭: '30MB 가 넘는 파일은 못 받습니다' }); continue }
          let r = { 갈래: '공내역서', 까닭: '' }
          if (f.size <= 15 * 1024 * 1024) r = m.가리기.책가리기(new Uint8Array(await f.arrayBuffer()))
          if (r.갈래 === '재료표') {
            const buf = new Uint8Array(await f.arrayBuffer())
            새재료 = { name: f.name, buf, 기억: false }
            const 됨 = await m.기억.넣기('재료표', { name: f.name, 바이트: buf })
            새재료.기억 = 됨
            말.push({ name: f.name, 갈래: '재료표', 까닭: 됨 ? '이 브라우저가 기억합니다 — 다음엔 안 놓으셔도 됩니다' : r.까닭 })
          } else {
            if (새내역) 말.push({ name: 새내역.name, 갈래: '✕', 까닭: '공내역서는 하나만 — 뒤에 놓은 것을 씁니다' })
            새내역 = { name: f.name, size: f.size, blob: f, 까닭: r.갈래 === '공내역서' ? r.까닭 : `공내역서로 봅니다 (${r.까닭 || r.갈래})` }
            말.push({ name: f.name, 갈래: '공내역서', 까닭: 새내역.까닭 })
          }
        } else {
          말.push({ name: f.name, 갈래: '✕', 까닭: '다룰 수 있는 것은 공내역서·재료표(.xlsx) · 도면(.dxf) · 치수표(.csv) 입니다' })
        }
      } catch (e) {
        말.push({ name: f.name, 갈래: '✕', 까닭: `못 읽었습니다: ${e?.message || e}` })
      }
    }
    if (새내역) setFile(새내역)
    if (새재료) set재료표(새재료)
    if (새도면.length) set도면들((o) => [...o.filter((x) => !새도면.some((y) => y.name === x.name)), ...새도면])
    if (새내역 || 새재료 || 새도면.length) { setRes(null); set고른({}) }
    set안내(말)
  }

  const 빼기 = async (무엇, 이름) => {
    setRes(null); set고른({})
    if (무엇 === '내역') setFile(null)
    if (무엇 === '도면') set도면들((o) => o.filter((x) => x.name !== 이름))
    if (무엇 === '재료표') {
      set재료표(null)
      try { const m = await 모듈(); await m.기억.지우기('재료표') } catch { /* */ }
    }
  }

  const 도면항목 = (물량 && 물량.항목) || []
  const 보낼수있음 = !!file || 도면항목.length > 0

  const run = async (고른것) => {
    if (!보낼수있음) return
    setErr(''); setBusy(고른것 ? '고르신 것을 넣어 다시 채우는 중' : '단가를 채우는 중'); set초(0)
    const t0 = Date.now()
    timer.current = setInterval(() => set초(Math.round((Date.now() - t0) / 1000)), 1000)
    try {
      let token = 'test-owner'                  /* 시험(내 컴퓨터)에서만 — 올린 사이트에서는 늘 진짜 로그인 */
      if (import.meta.env.VITE_JEOKSAN_TEST !== '1') {
        const { auth, ensureAnon } = await loadFb()
        await ensureAnon()
        token = await auth.currentUser.getIdToken()
      }
      const fd = new FormData()
      if (file) fd.append('file', file.blob, file.name)          /* 칸 이름은 영문 (서버와 같게) */
      if (도면항목.length) {
        /* 도면 파일이 아니라 «센 물량» 만 보냅니다 */
        fd.append('drawing', JSON.stringify({ 파일들: 도면들.filter((d) => d.n).map((d) => d.name), 항목: 도면항목 }))
      }
      fd.append('region', 지역)
      fd.append('temp', 임시채움 ? '1' : '0')
      if (고른것) fd.append('picks', JSON.stringify(고른것))
      const r = await fetch(함수주소, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const j = await r.json().catch(() => ({ 오류: `서버 응답을 못 읽었습니다 (${r.status})` }))
      if (!r.ok || j.오류) throw new Error(j.오류 || `서버 오류 ${r.status}`)
      if (url) URL.revokeObjectURL(url)
      setUrl(b64toUrl(j.파일)); j.파일 = null
      setRes(j); set고른({}); set몇(40)
    } catch (e) {
      setErr(String(e.message || e))
    } finally {
      clearInterval(timer.current); setBusy('')
    }
  }

  const 목록 = useMemo(() => {
    if (!res) return []
    const a = res.고를것 || []
    if (보기 === '확인') return a.filter((r) => r.왜 === '임시' || r.왜 === '장부확인')
    if (보기 === '골라') return a.filter((r) => r.왜 === '골라주십시오' || r.왜 === '참고후보')
    if (보기 === '없음') return a.filter((r) => r.왜 === '못찾음' || r.왜 === '직접넣을줄')
    return a
  }, [res, 보기])
  const 고른수 = Object.keys(고른).length
  const s = res && res.요약
  const 도 = s && s.도면
  const 쪽지없는도면 = 도면들.filter((d) => !d.n)

  return (
    <div className="wrap">
      <div className="card lead-card">
        <div className="sec-title">🧮 공내역서 단가 채우기 <span className="count">소장님만</span></div>
        <p className="muted" style={{ margin: 0, lineHeight: 1.8 }}>
          공내역서를 올리면 적산자료·조달청 가격·발주처 설계내역서로 단가를 채웁니다.
          애매한 줄은 후보를 보여 드리니 고르시면 다시 채워 드립니다.
          <br />도면(.dxf)과 재료표를 <b>같이</b> 떨어뜨리면 도면 물량을 세어 공내역서와 맞대 봅니다. 공내역서 없이 도면만 놓으면 도면 물량으로 내역서를 만듭니다.
          <br />공내역서와 결과는 서버에 남지 않습니다. 도면·재료표는 서버로 가지 않습니다(브라우저에서 센 물량만). 고르신 짝만 기억해 다음부터 저절로 붙입니다.
        </p>
      </div>

      <div className="card">
        <div className="sec-title">① 파일 놓기 <span className="count">여러 개 한꺼번에</span></div>
        <div className={`tldrop${끌림 ? ' on' : ''}`}
             onClick={() => inRef.current && inRef.current.click()}
             onDragOver={(e) => { e.preventDefault(); set끌림(true) }}
             onDragLeave={() => set끌림(false)}
             onDrop={(e) => { e.preventDefault(); set끌림(false); 놓기(e.dataTransfer.files) }}>
          <b>공내역서(.xlsx) · 도면(.dxf) · 재료표(.xlsx) 를 여기에 떨어뜨리거나 눌러서 고르십시오</b>
          <span>열어 보고 무엇인지 가립니다 · 공내역서 30MB 까지 · 재료표는 한 번 놓으면 기억</span>
          <input ref={inRef} type="file" accept=".xlsx,.dxf,.dwg,.csv" multiple hidden
                 onChange={(e) => { 놓기(e.target.files); e.target.value = '' }} />
        </div>

        {안내.length > 0 && (
          <ul className="flist tight fill-note">
            {안내.map((a, i) => (
              <li key={i} className={a.갈래 === '✕' ? 'bad' : ''}>
                <b>{a.갈래 === '✕' ? '✕' : a.갈래}</b> {a.name}{a.까닭 ? ` — ${a.까닭}` : ''}
              </li>
            ))}
          </ul>
        )}

        {(file || 도면들.length > 0 || 재료표) && (
          <div className="fill-files">
            {file && <span className="fill-chip">📄 공내역서 <b>{file.name}</b> <span className="muted">{won(file.size / 1024)}KB</span>
              <button aria-label="빼기" onClick={() => 빼기('내역')}>×</button></span>}
            {도면들.map((d) => (
              <span key={d.name} className={`fill-chip${d.n ? '' : ' off'}`}>📐 {d.꼴} <b>{d.name}</b> <span className="muted">쪽지 {d.n}</span>
                <button aria-label="빼기" onClick={() => 빼기('도면', d.name)}>×</button></span>
            ))}
            {재료표 && <span className="fill-chip">📋 재료표 <b>{재료표.name}</b> {재료표.기억 && <span className="muted">🧠 기억</span>}
              <button aria-label="잊기" title="이 브라우저에서 잊기" onClick={() => 빼기('재료표')}>×</button></span>}
          </div>
        )}

        {도면들.length > 0 && !재료표 && (
          <p className="cwarn fill-warn">⚠️ 도면 물량을 세려면 <b>재료표(.xlsx)</b> 를 같이 놓아 주십시오. 한 번 놓으면 이 브라우저가 기억합니다.</p>
        )}
        {쪽지없는도면.length > 0 && (
          <p className="muted fill-warn">
            쪽지가 없는 도면 {쪽지없는도면.length}장 — 이 화면은 캐드에서 찍어 둔 산출 쪽지(KQTO)만 읽습니다. 선·글자를 짐작해서 물량을 만들지 않습니다.
            쪽지 없는 도면의 표(재료표·일람표) 읽기는 PC 프로그램(한번에.py)에서 됩니다.
          </p>
        )}

        {물량 && (
          <div className="fill-qto">
            {물량.오류
              ? <p className="cwarn">⚠️ 도면 물량을 못 셌습니다: {물량.오류}</p>
              : <>
                <div><b>📐 도면 물량 {won(물량.항목.length)}가지</b> <span className="muted">(쪽지 {won(물량.쪽지)}개)</span>
                  {물량.심각 > 0 && <span className="fill-tag t-못찾음" style={{ marginLeft: 6 }}>✕ 고칠 것 {물량.심각}</span>}</div>
                <details><summary className="muted">물량 보기</summary>
                  <table className="tbl" style={{ marginTop: 6 }}>
                    <thead><tr><th>재료</th><th>규격</th><th>단위</th><th>수량</th></tr></thead>
                    <tbody>{물량.항목.map((h, i) => (
                      <tr key={i}><td>{h.재료}</td><td>{h.규격}</td><td>{h.단위}</td><td>{수(h.수량)}</td></tr>
                    ))}</tbody>
                  </table>
                </details>
                {물량.경고.length > 0 && (
                  <details><summary className="muted">도면·재료표 경고 {물량.경고.length}개</summary>
                    <ul className="flist tight">{물량.경고.slice(0, 50).map((w, i) => <li key={i}>{w.join(' · ')}</li>)}</ul>
                  </details>
                )}
                <div className="navrow" style={{ flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {물량.산출서.map((x) => (
                    <a key={x.name} className="btn sm ghost" href={x.url} download={`${x.name.replace(/\.[^.]+$/, '')}_수량산출서.xlsx`}>⬇ 수량산출서 ({x.name})</a>
                  ))}
                </div>
              </>}
          </div>
        )}

        <div className="fill-opts">
          <label className="muted">공사 지역
            <select value={지역} onChange={(e) => set지역(e.target.value)}>
              {지역들.map((g) => <option key={g} value={g}>{g || '(안 정함)'}</option>)}
            </select>
          </label>
          <label className="muted">
            <input type="checkbox" checked={임시채움} onChange={(e) => set임시채움(e.target.checked)} />
            확실하지 않은 줄도 1등 후보로 임시로 채우기
          </label>
        </div>
        <button className="btn" style={{ marginTop: 12 }} disabled={!보낼수있음 || !!busy} onClick={() => run(null)}>
          ② {file ? (도면항목.length ? '단가 채우기 + 도면 대조' : '단가 채우기') : '도면 물량으로 내역서 만들기'}
        </button>
      </div>

      {busy && <div className="card muted">⏳ {busy}… {초}초 (처음엔 1분쯤 걸립니다)</div>}
      {err && <div className="card cwarn">⚠️ {err}</div>}

      {s && (
        <div className="card">
          <div className="sec-title">③ 결과 <span className="count">{res.걸린초}초</span></div>
          <table className="tbl left" style={{ maxWidth: 520 }}>
            <tbody>
              <tr><td>품목</td><td><b>{won(s.품목)}</b>줄{도 && 도.방식 === '도면만' ? ' (도면 물량)' : ''}</td></tr>
              <tr><td>✓ 확실히 붙음 (+ %계산)</td><td><b>{won(s.확실)}</b> + {won(s.비율계산)}</td></tr>
              <tr><td>🟧 채웠지만 확인 필요</td><td><b>{won(s.임시 + s.장부확인)}</b> (임시 {won(s.임시)} · 지난번 짝 {won(s.장부확인)})</td></tr>
              <tr><td>△ 골라 주실 것</td><td><b>{won(s.골라)}</b> (참고만 {won(s.참고)})</td></tr>
              <tr><td>✕ 못 찾음 · 직접 넣을 1식</td><td><b>{won(s.못찾음)}</b> · {won(s.직접)}</td></tr>
              <tr><td>채운 금액</td><td><b>{won(s.채운금액)}</b>원 (확인 필요 {won(s.확인금액)}원)</td></tr>
              {도 && 도.방식 === '대조' && (
                <tr><td>📐 도면 대조</td><td>맞음 <b>{won(도.맞음)}</b> · 다름 <b>{won(도.다름)}</b> · 내역서에 없음 {won(도.없음)}</td></tr>
              )}
            </tbody>
          </table>
          <a className="btn" style={{ marginTop: 12 }} href={url} download={res.파일이름}>⬇ {res.파일이름}</a>
          <p className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.8 }}>
            엑셀 탭: {도 && 도.방식 === '도면만' ? '수량산출서 · ' : ''}내역서{도 && 도.방식 === '대조' ? ' · 도면대조' : ''} · 일위대가 · 단가산출 · 원가계산서 · 짝짓기 · 검산. 주황색 줄이 «확인 필요» 입니다.
            {도 && 도.방식 === '도면만' ? ' 내역서 수량 칸이 수량산출서를 가리킵니다.' : ''}
            {res.새장부 ? ` 방금 고르신 ${res.새장부}개를 기억했습니다.` : ''}
          </p>
          {s.검산 && s.검산.length > 0 && (
            <details style={{ marginTop: 6 }}><summary className="muted">검산 보기</summary>
              <ul className="flist">{s.검산.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </details>
          )}
        </div>
      )}

      {res && res.대조 && res.대조.length > 0 && (
        <div className="card">
          <div className="sec-title">📐 도면과 대조 <span className="count">발주처 수량은 그대로 — 알리기만</span></div>
          <div className="fill-cmp">
            {res.대조.map((h, i) => (
              <div key={i} className="fill-row">
                <div className="fill-head">
                  <span className={`fill-tag ${h.판정 === '맞음' ? 't-맞음' : h.판정 === '다름' ? 't-다름' : ''}`}>{h.판정}</span>
                  <b>{h.재료}</b>{h.규격 && <span className="muted"> | {h.규격}</span>}
                  <span className="muted"> | {h.단위}</span>
                  <span className="fill-amt">{h.차율 !== null ? 차이글(h.차율) : ''}</span>
                </div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  도면 {수(h.도면)}{h.내역 !== null ? ` · 내역서 ${수(h.내역)} (${h.내역줄수}줄)` : ''}{h.방법 ? ` · ${h.방법}` : ''}
                </div>
                {h.내역줄 && h.내역줄.length > 0 && (
                  <details><summary className="muted" style={{ fontSize: 12 }}>내역서 줄</summary>
                    <ul className="flist tight">{h.내역줄.map((t, k) => <li key={k}>{t}</li>)}</ul>
                  </details>
                )}
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.8 }}>
            ±1% 안이면 «맞음». 도면 단위로 견줍니다(kg↔TON 은 바꿔 셈, ㎥↔㎡ 은 안 견줌). 자세한 것은 엑셀 «도면대조» 탭.
          </p>
        </div>
      )}

      {res && (
        <div className="card">
          <div className="sec-title">④ 고르기 <span className="count">금액 큰 순 · 같은 품목은 한 줄</span></div>
          <div className="navrow" style={{ flexWrap: 'wrap', gap: 6 }}>
            {[['확인', '🟧 확인 필요'], ['골라', '△ 골라 주실 것'], ['없음', '✕ 못 찾음·직접'], ['전체', '전체']].map(([k, t]) => (
              <button key={k} className={`btn sm${보기 === k ? '' : ' ghost'}`} onClick={() => { set보기(k); set몇(40) }}>{t}</button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.8 }}>
            맞는 후보 번호를 누르십시오. 자료에 없으면 «없음». 안 누른 줄은 그대로 둡니다.
          </p>
          {목록.length === 0 && <p className="muted">해당하는 줄이 없습니다.</p>}
          {목록.slice(0, 몇).map((r) => <Row key={r.열쇠} r={r} v={고른[r.열쇠]}
            set={(v) => set고른((o) => { const n = { ...o }; if (v === undefined) delete n[r.열쇠]; else n[r.열쇠] = v; return n })} />)}
          {목록.length > 몇 && (
            <button className="btn ghost sm" onClick={() => set몇(몇 + 60)}>더 보기 ({won(목록.length - 몇)}줄 남음)</button>
          )}
          <div className="fill-go">
            <button className="btn" disabled={!고른수 || !!busy} onClick={() => run(고른)}>
              ⑤ 고른 것 {고른수}개 넣어 다시 채우기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ r, v, set }) {
  const [말, 풀이] = 이름표[r.왜] || [r.왜, '']
  return (
    <div className="fill-row">
      <div className="fill-head">
        <span className={`fill-tag t-${말}`}>{말}</span>
        <b>{r.품명}</b>
        {r.규격 && <span className="muted"> | {r.규격}</span>}
        <span className="muted"> | {r.단위} · {수(r.수량)}{r.줄수 > 1 ? ` (${r.줄수}줄)` : ''}</span>
        <span className="fill-amt">{r.예상금액 ? `${won(r.예상금액)}원` : ''}</span>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>{r.시트} {r.행}행 · {풀이}{r.지금 ? ` · 지금: ${r.지금}` : ''}</div>
      {r.후보.length > 0 && (
        <div className="fill-cands">
          {r.후보.map((c) => (
            <button key={c.번호} className={`fill-cand${v === c.번호 ? ' on' : ''}`}
                    onClick={() => set(v === c.번호 ? undefined : c.번호)}>
              <b>{c.번호}</b> {c.글}
            </button>
          ))}
          <button className={`fill-cand no${v === 'x' ? ' on' : ''}`} onClick={() => set(v === 'x' ? undefined : 'x')}>
            없음 — 자료에 없습니다
          </button>
        </div>
      )}
    </div>
  )
}
