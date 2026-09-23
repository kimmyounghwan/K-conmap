/**
 * /jeoksan/fill — 🔒 공내역서 단가 채우기 (소장님만) · 2026-09-23
 *
 * 소장님: 「웹에서 직접 올리는 것」 · 「애매한 부분은 우리 단가 자료에서 3개나 5개를 보여주고
 *          이용자가 선택」 · 「1차로 채워주고, 2차로 사람이 검증」 · 「나만 쓸 수 있게」
 *
 * ■ 하는 일
 *    ① 공내역서(.xlsx)를 올리면  ② 서버(jeoksanfill 함수)가 PC 의 K-적산 프로그램 «그대로» 단가를 채우고
 *    ③ 애매한 줄은 후보 1~5 를 보여 드립니다  ④ 고르시면 다시 채워 엑셀로 받습니다.
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

function Fill() {
  const [file, setFile] = useState(null)          /* {name, size, blob} — 다시 채울 때 또 보냅니다 */
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
  const inRef = useRef(null)
  const timer = useRef(null)

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  useEffect(() => { try { localStorage.setItem('kcm_fill_region', 지역) } catch { /* */ } }, [지역])

  const pick = (f) => {
    if (!f) return
    if (!/\.xlsx$/i.test(f.name)) { setErr('엑셀(.xlsx) 공내역서를 올려 주십시오'); return }
    if (f.size > 30 * 1024 * 1024) { setErr('30MB 가 넘는 파일은 못 받습니다'); return }
    setErr(''); setRes(null); set고른({}); setFile({ name: f.name, size: f.size, blob: f })
  }

  const run = async (고른것) => {
    if (!file) return
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
      fd.append('file', file.blob, file.name)          /* 칸 이름은 영문 (서버와 같게) */
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

  return (
    <div className="wrap">
      <div className="card lead-card">
        <div className="sec-title">🧮 공내역서 단가 채우기 <span className="count">소장님만</span></div>
        <p className="muted" style={{ margin: 0, lineHeight: 1.8 }}>
          공내역서를 올리면 적산자료·조달청 가격·발주처 설계내역서로 단가를 채웁니다.
          애매한 줄은 후보를 보여 드리니 고르시면 다시 채워 드립니다.
          <br />공내역서와 결과는 서버에 남지 않습니다. 고르신 짝만 기억해 다음부터 저절로 붙입니다.
        </p>
      </div>

      <div className="card">
        <div className="sec-title">① 공내역서 올리기</div>
        <div className={`tldrop${file ? ' on' : ''}`}
             onClick={() => inRef.current && inRef.current.click()}
             onDragOver={(e) => e.preventDefault()}
             onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}>
          <b>{file ? `📄 ${file.name}` : '여기에 공내역서(.xlsx)를 떨어뜨리거나 눌러서 고르십시오'}</b>
          <span>{file ? `${won(file.size / 1024)}KB` : '30MB 까지'}</span>
          <input ref={inRef} type="file" accept=".xlsx" hidden onChange={(e) => pick(e.target.files[0])} />
        </div>
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
        <button className="btn" style={{ marginTop: 12 }} disabled={!file || !!busy} onClick={() => run(null)}>② 단가 채우기</button>
      </div>

      {busy && <div className="card muted">⏳ {busy}… {초}초 (처음엔 1분쯤 걸립니다)</div>}
      {err && <div className="card cwarn">⚠️ {err}</div>}

      {s && (
        <div className="card">
          <div className="sec-title">③ 결과 <span className="count">{res.걸린초}초</span></div>
          <table className="tbl left" style={{ maxWidth: 520 }}>
            <tbody>
              <tr><td>품목</td><td><b>{won(s.품목)}</b>줄</td></tr>
              <tr><td>✓ 확실히 붙음 (+ %계산)</td><td><b>{won(s.확실)}</b> + {won(s.비율계산)}</td></tr>
              <tr><td>🟧 채웠지만 확인 필요</td><td><b>{won(s.임시 + s.장부확인)}</b> (임시 {won(s.임시)} · 지난번 짝 {won(s.장부확인)})</td></tr>
              <tr><td>△ 골라 주실 것</td><td><b>{won(s.골라)}</b> (참고만 {won(s.참고)})</td></tr>
              <tr><td>✕ 못 찾음 · 직접 넣을 1식</td><td><b>{won(s.못찾음)}</b> · {won(s.직접)}</td></tr>
              <tr><td>채운 금액</td><td><b>{won(s.채운금액)}</b>원 (확인 필요 {won(s.확인금액)}원)</td></tr>
            </tbody>
          </table>
          <a className="btn" style={{ marginTop: 12 }} href={url} download={res.파일이름}>⬇ {res.파일이름}</a>
          <p className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.8 }}>
            엑셀 탭: 내역서 · 일위대가 · 단가산출 · 원가계산서 · 짝짓기 · 검산. 주황색 줄이 «확인 필요» 입니다.
            {res.새장부 ? ` 방금 고르신 ${res.새장부}개를 기억했습니다.` : ''}
          </p>
          {s.검산 && s.검산.length > 0 && (
            <details style={{ marginTop: 6 }}><summary className="muted">검산 보기</summary>
              <ul className="flist">{s.검산.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </details>
          )}
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
