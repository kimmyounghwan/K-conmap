/**
 * 🔢 쓴 횟수 — 소장님 브라우저에서만 보이는 판 (2026-10-17)
 *
 * 소장님: 「일 카운트 하느거 바꾸자」 → 고르심 «소장님만 보게» · 「실시간으로 바뀌게」
 *   → 단추 · 받기 · 예시 같은 «일» 셈(lib/받은수.jsx 세기 · 받음 → 데이터베이스 dl/p · dl/f)을
 *     화면 위 «👁 이 화면 조회» 아래에, 그 화면에서 세는 것만 골라 보입니다. 데이터베이스 흐름(EventSource)으로 받아
 *     누가 누르면 바로 오릅니다(흐름이 안 되면 1분마다).
 * ■ 이용자 화면에는 한 글자도 안 나옵니다 — App.jsx 가 나운영자() 일 때만 이 파일을 불러옵니다.
 * ■ 화면 ↔ 셈 열쇠 표(자리표)는 코드의 세기('|…') 를 찾아 맞췄습니다(2026-10-17). 새 도구에 세기를 넣으면 여기도 한 줄.
 *   표에 없는 셈 · 사이트 전체 셈은 «모두 보기» 에 다 나옵니다.
 */
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { 화면열쇠 } from './받은수.jsx'
import { 씀열쇠 } from './씀열쇠.js'   /* ✍ 2026-10-21 화면 안에서 처음 손댄 횟수(모든 화면 한 곳에서 셈) */

const DB = 'https://k-conmap-default-rtdb.firebaseio.com'
/* 화면 주소(앞에서부터 맞춤 · 긴 것 먼저) → 그 화면의 셈 열쇠 머리 */
const 자리표 = [
  ['/tools/jungcheo', ['|중처법']], ['/tools/safecard', ['|안전카드']], ['/tools/colorplan', ['|컬러평면']], ['/tools/cadfix', ['|캐드고침']], ['/tools/sigong', ['|시공계획']], ['/tools/nomubi', ['|노무비']], ['/tools/sajincad', ['|사진캐드']], ['/tools/hado-docs', ['|하도급서류']],
  ['/tools/dxf3d', ['|도면3d', '|3D활용', '|3D활용엑셀', '|3D활용탭']], ['/tools/earthcheck', ['|토공검산']], ['/tools/boheom-jeongsan', ['|보험정산']],
  ['/tools/wonclick', ['|원클릭']], ['/tools/gyeonjeok', ['|견적']], ['/jeoksan/bim', ['|BIM물량']], ['/jeoksan/magam', ['|마감']],
  ['/jeoksan/golgo', ['|골조']], ['/jeoksan/auto', ['|적산자동']], ['/change/gisung', ['|기성']], ['/change/twoline', ['|2줄']], ['/change/won', ['|변경원내역']],
  ['/naeyeok/hado', ['|하도급']], ['/analysis', ['|분석', '|자가진단', '|마감전공고']], ['/qna', ['|맵톡']], ['/my', ['|마이', '|명함']],
]
const 딱자리 = { '/tools': ['|도구'], '/': ['|바로투찰', '|확보예가', '|금액고르기', '|지도', '|내조건', '|방문자'], '/calc': ['|바로투찰', '|확보예가', '|금액고르기'] }
/* 어느 화면에서나 셈(띠 · 창) — «사이트 전체» 줄 */
const 전체머리 = ['|알림', '|앱안내', '|앱설치창', '|앱설치닫음', '|다시오심', '|공지', '|종류', '|종류띠', '|종류물음', '|손끝고름', '|찍기']

function 머리들(path) {
  if (딱자리[path]) return 딱자리[path]
  const x = 자리표.find(([p]) => path === p || path.startsWith(p + '/'))
  return x ? x[1] : []
}
const 머리맞나 = (k, 머리) => k === 머리 || k.startsWith(머리 + '|')
const 이름만 = (k, 머리) => (k === 머리 ? '(전체)' : k.slice(머리.length + 1)).replace(/,/g, '.')
const 쉼 = (n) => Number(n || 0).toLocaleString('ko-KR')

/** dl 묶음 흐름 — 이 판 하나만 씀 */
function use흐름(길) {
  const [v, setV] = useState(undefined)
  useEffect(() => {
    const url = `${DB}/${길}.json`
    let 살 = true, es = null, 흐름됨 = false
    const 한번 = () => fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : undefined)).then((x) => { if (살 && x !== undefined) setV(x) }).catch(() => {})
    const 고침 = (자리, 값) => setV((옛) => {
      if (!자리 || 자리 === '/') return 값
      const 마디 = 자리.split('/').filter(Boolean)
      const 새 = 옛 && typeof 옛 === 'object' ? { ...옛 } : {}
      let o = 새
      for (let i = 0; i < 마디.length - 1; i++) { o[마디[i]] = o[마디[i]] && typeof o[마디[i]] === 'object' ? { ...o[마디[i]] } : {}; o = o[마디[i]] }
      if (값 === null) delete o[마디[마디.length - 1]]; else o[마디[마디.length - 1]] = 값
      return 새
    })
    try {
      es = new EventSource(url)
      const 받음 = (e) => {
        try {
          const d = JSON.parse(e.data)
          흐름됨 = true
          if (e.type === 'put') 고침(d.path, d.data)
          else for (const [k, val] of Object.entries(d.data || {})) 고침((d.path === '/' ? '' : d.path) + '/' + k, val)
        } catch (er) { /* 지나감 */ }
      }
      es.addEventListener('put', 받음)
      es.addEventListener('patch', 받음)
      es.onerror = () => { if (!흐름됨) { try { es.close() } catch (er) { /* */ } es = null; 한번() } }
    } catch (e) { 한번() }
    const t = setInterval(() => { if (!es || es.readyState === 2) 한번() }, 60000)
    return () => { 살 = false; clearInterval(t); try { es && es.close() } catch (e) { /* */ } }
  }, [길])
  return v
}

export default function 쓴수판() {
  const { pathname } = useLocation()
  const p = use흐름('dl/p')
  const [찾기, set찾기] = useState('')
  const 묶음 = p && typeof p === 'object' ? p : {}
  const 머리 = 머리들(pathname)
  const 화면 = 화면열쇠(pathname)
  const 이화면 = useMemo(() => {
    const out = []
    for (const m of 머리) for (const [k, v] of Object.entries(묶음)) if (머리맞나(k, m)) out.push([이름만(k, m), Number(v) || 0, k])
    return out.sort((a, b) => b[1] - a[1])
  }, [묶음, 머리.join()])   // eslint-disable-line react-hooks/exhaustive-deps
  const 전체 = useMemo(() => {
    const out = []
    for (const m of 전체머리) for (const [k, v] of Object.entries(묶음)) if (머리맞나(k, m)) out.push([k.slice(1).replace(/,/g, '.'), Number(v) || 0])
    return out.sort((a, b) => b[1] - a[1])
  }, [묶음])
  const 모두 = useMemo(() => Object.entries(묶음).map(([k, v]) => [k.replace(/,/g, '.'), Number(v) || 0]).sort((a, b) => b[1] - a[1]), [묶음])
  if (p === undefined) return <div className="opcount"><span className="opcount-t">🔢 쓴 횟수 · 소장님만</span> <span className="muted">받는 중…</span></div>
  const 받음 = Number(묶음[화면]) || 0
  const 씀k = 씀열쇠(pathname)
  const 씀 = 씀k ? Number(묶음[씀k]) || 0 : null
  const 걸러 = 찾기.trim() ? 모두.filter(([k]) => k.includes(찾기.trim())) : 모두
  return (
    <div className="opcount" title="소장님 브라우저에만 보입니다 · 이용자 · 소장님 · 로봇 중 이용자만 셉니다 · 누르면 바로 오름">
      <span className="opcount-t">🔢 쓴 횟수 · 소장님만</span>
      {씀 != null && <span title="이 화면에 들어와 칸 · 단추 · 고르기를 처음 손댄 횟수(들어올 때마다 한 번)">✍ 써 봄 <b>{쉼(씀)}</b></span>}
      <span>⬇ 이 화면에서 받음 <b>{쉼(받음)}</b></span>
      {이화면.length > 0 ? 이화면.slice(0, 12).map(([이름, n, k]) => <span key={k}>{이름} <b>{쉼(n)}</b></span>) : (머리.length ? <span className="muted">이 화면 셈 아직 0</span> : null)}
      <details className="opcount-all">
        <summary>모두 보기 ({모두.length})</summary>
        {전체.length > 0 && <div className="opcount-sub">사이트 전체: {전체.slice(0, 10).map(([k, n]) => <span key={k}>{k} <b>{쉼(n)}</b></span>)}</div>}
        <input value={찾기} onChange={(e) => set찾기(e.target.value)} placeholder="찾기 — 예: 중처법 · 맵톡 · forms" />
        <ol>{걸러.slice(0, 300).map(([k, n]) => <li key={k}><span>{k}</span><b>{쉼(n)}</b></li>)}</ol>
      </details>
    </div>
  )
}
