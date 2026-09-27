/**
 * 🧭 길 — 「여기가 어디고, 어디로 돌아가나」 (2026-09-16)
 *
 * 소장님: 「사이트 뒤로가기가 하나도 없어. 길을 만들어 줘」
 *
 * ■ 왜 필요한가
 *    탭은 «큰 자리» 만 보여 줍니다. 안쪽 화면(캐드 명령 한 가지, 서식 한 장,
 *    공고 한 건, 업체 한 곳)에 들어가면 **돌아 나올 길이 화면에 없었습니다.**
 *    검색으로 바로 들어온 사람은 브라우저 뒤로가기를 눌러도 «검색 결과» 로 나가 버립니다.
 *    앱으로 깔아 쓰면 뒤로가기 단추 자체가 없습니다.
 *
 * ■ 어떻게
 *    주소 한 줄만 보고 길을 그립니다. 화면을 하나하나 고치지 않습니다 —
 *    28개를 각각 고치면 새 화면을 만들 때마다 또 빠집니다. 여기 한 곳만 봅니다.
 *
 * ■ 큰 자리(탭에 있는 주소)에서는 «아무것도 그리지 않습니다».
 *    탭에 이미 불이 들어와 있어서, 거기까지 길을 그리면 군더더기가 됩니다.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 들어온곳 } from './lib/길기록.js'

/* 주소 -> 이름.  안쪽 화면은 :값 이 붙으므로 «앞자리» 로만 찾습니다. */
const NAME = {
  '/': '바로투찰',
  '/calc': '바로투찰',
  '/first': '오늘의 1순위',
  '/live': '입찰 공고',
  '/analysis': '낙찰 분석',
  '/jobs': '구인구직',
  '/daily': '개찰 성적표',
  '/forms': '건설 서식',
  '/change': '설계변경',
  '/guide': '입찰 알아보기',
  '/tools': '도구',
  '/cad': '캐드 유틸',
  '/jeoksan': 'K-적산',
  '/naeyeok': '산출내역서',
  '/safety': '안전·유해위험방지 계획서',
  '/shareone': '쉐어원 공유폴더',
  '/report': '업체 입찰 성적표',
  '/lic': '면허별 경쟁도',
  '/qna': '사랑방',
  '/how': '보는 방법',
  '/agency': '발주기관',
  '/corp': '업체',
  '/pdf': 'PDF 도구',
  '/admin': '관리자',
  '/notice': '공고',
}

/* 두 칸짜리 안쪽 화면의 «제 이름» — 없으면 주소 조각을 그대로 씁니다. */
const LEAF = {
  '/change/calc': '증감율 계산',
  '/change/excel': '엑셀로 만들기',
  '/change/naeyeok': '설계변경 내역서',
  '/change/twoline': '2줄 자동변환',
  '/jeoksan/run': '수량산출서 만들기',
  '/jeoksan/golgo': '골조 수량산출',
  '/jeoksan/auto': '도면 물량 자동',
  '/jeoksan/magam': '마감 수량산출',
  '/jeoksan/lab': '적산 실험실',
  '/tools/dxf3d': '도면 3D 보기',
  '/tools/dxfpdf': '도면 PDF 만들기',
  '/tools/dwgdxf': 'DWG → DXF 바꾸기',
  '/tools/tuipbi': '현장 투입비 · 공사일보',
  '/tools/wonclick': '공사서류 원클릭',
  '/report/make': '성적표 만들기',
  '/naeyeok/ratio': '내역서 비율 맞추기',
  '/jeoksan/fill': '공내역서 단가 채우기',
}

/* 🔙 2026-09-24 — 소장님: 「뒤로가기 항상 빠져 있더라」
   검색·주소창·북마크로 «바로» 들어오면(기록 idx 0) 탭이 아닌 한 칸 화면에 나갈 길이 아예 없었습니다.
   특히 설계변경·서식은 9/24 에 탭에서 빠져 «도구·서식» 안으로 들어갔는데 그리로 돌아갈 길이 없었습니다.
   → 탭이 아닌 한 칸 화면은 들어온 길과 상관없이 «늘» 부모로 가는 단추를 그립니다.
   ⚠️ 부모는 «그 화면이 속한 탭» 입니다 (App.jsx 의 also 와 같게). */
/* 📄 2026-09-25 — «서식» 이 다시 제 탭이 되어 /forms 는 부모 목록에서 뺐습니다. */
const PARENT = {
  '/change': '/tools', '/cad': '/tools', '/pdf': '/tools', '/shareone': '/tools',
  '/safety': '/naeyeok',
  '/daily': '/first',
  '/lic': '/', '/guide': '/', '/how': '/',
}
const 탭이름 = { '/tools': '도구', '/forms': '서식', '/naeyeok': '내역서', '/first': '1순위', '/': '바로투찰' }
/* 영문 주소 조각(siljeong-bogo, a-value …)은 사람이 읽는 이름이 아닙니다 — 길에 그리지 않습니다.
   화면 제목(h1)이 바로 아래에 있습니다. */
const 영문조각 = (x) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(x)

/* 탭(또는 큰 자리)에 이미 있는 주소 — 길을 안 그립니다. */
const TOP = new Set(['/', '/calc', '/first', '/live', '/analysis', '/jobs', '/forms',
  '/change', '/naeyeok', '/jeoksan', '/qna', '/how', '/guide', '/tools', '/cad',
  '/daily', '/safety', '/shareone', '/report', '/lic', '/pdf', '/admin'])

/* 🧭 2026-09-27 — 「특히 뒤로가기 잘 되어 있나 확인해 주고」 전수조사에서 찾은 것
   ① «← 공고» (공고 상세) · «← 발주기관» · «← 업체» 가 **없는 화면(404)** 으로 갔습니다.
      /notice · /agency · /corp 는 주소 «한 칸» 만으로는 화면이 없습니다 → 목록이 있는 곳으로 돌립니다.
   ② 단추가 부모로 «새로 한 칸» 을 쌓았습니다 → 목록 맨 위로 가고, 그 뒤 휴대폰 뒤로가기는 다시 도구로(왔다 갔다).
      → 사이트 안에서 걸어 들어왔으면 **들어온 곳으로 기록을 되감습니다**(보던 자리·검색어 그대로).
        이름도 «들어온 곳» 이름입니다(도구에서 골조로 왔으면 «← 도구», 적산에서 왔으면 «← K-적산»).
      → 검색·주소창으로 바로 들어왔으면 지금처럼 «그 화면이 속한 곳» 으로 갑니다. */
const 뿌리로 = { '/notice': '/live', '/agency': '/analysis', '/corp': '/analysis', '/report': '/' }
/* /daily 는 미리 구운 HTML 안의 자료로만 그려집니다(DailyPage.jsx) — 사이트 안 이동(Link)으로 가면 빈 화면. 통째로 불러옵니다. */
const 정적 = new Set(['/daily'])
const 길 = ({ to, className, children }) => (정적.has(to)
  ? <a className={className} href={to}>{children}</a>
  : <Link className={className} to={to}>{children}</Link>)

/** 주소 → 짧은 이름 (표에 없으면 그 칸의 탭 제목 앞머리) */
function 이름짓기(주소, 제목) {
  const p = (주소 || '').replace(/\/+$/, '') || '/'
  if (LEAF[p]) return LEAF[p]
  if (NAME[p]) return NAME[p]
  let t = String(제목 || '').split(' | ')[0].split(' — ')[0].split(' - ')[0].replace(/^[^0-9A-Za-z가-힣(«]+/, '').trim()
  if (/^K-건설맵/.test(t)) t = ''
  if (!t) {
    const seg = p.split('/').filter(Boolean)
    const r = seg.length ? NAME['/' + seg[0]] : ''
    return r || '앞 화면'
  }
  return t.length > 16 ? t.slice(0, 16) + '…' : t
}

export default function Crumbs() {
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const path = pathname.replace(/\/+$/, '') || '/'

  /* ── 사이트 안에서 걸어 들어왔으면: «← 들어온 곳» = 기록 되감기 ── */
  const 온 = 들어온곳(pathname)
  const 되감기 = 온 ? (
    <button type="button" className="crumb-back" onClick={() => navigate(온.몇칸)}>← {이름짓기(온.p, 온.t)}</button>
  ) : null

  /* 🔖 2026-09-18 — 다른 화면이 state={{ from }} 을 달아 보낸 경우(성적표 → 사랑방 등).
     들어온 기록이 있으면 그것이 먼저입니다(같은 곳이고, 되감으면 보던 자리까지 돌아갑니다). */
  const 온곳 = state && state.from
  if (!되감기 && 온곳 && 온곳.to && 온곳.to !== path) {
    const 이름 = 온곳.name || NAME[온곳.to] || '앞 화면'
    return (
      <nav className="crumbs" aria-label="길">
        <Link className="crumb-back" to={온곳.to}>← {이름}</Link>
      </nav>
    )
  }

  /* 탭에 있는 큰 자리 — 걸어 들어왔을 때만 «← 들어온 곳». 바로 들어왔으면 아무것도 그리지 않습니다
     (누르면 사이트 밖으로 나가 버리니까요). */
  if (TOP.has(path) && !PARENT[path]) {
    return 되감기 ? <nav className="crumbs" aria-label="길">{되감기}</nav> : null
  }

  if (PARENT[path]) {
    const to = PARENT[path]
    return (
      <nav className="crumbs" aria-label="길">
        {되감기 || <Link className="crumb-back" to={to}>← {탭이름[to] || NAME[to]}</Link>}
      </nav>
    )
  }

  const seg = path.split('/').filter(Boolean)
  if (seg.length <= 1) return 되감기 ? <nav className="crumbs" aria-label="길">{되감기}</nav> : null

  const root0 = '/' + seg[0]
  const rootName = NAME[root0]
  if (!rootName) return 되감기 ? <nav className="crumbs" aria-label="길">{되감기}</nav> : null
  const root = 뿌리로[root0] || root0          /* /notice → 공고 목록 · /agency·/corp → 분석 */
  const rootName2 = 뿌리로[root0] ? (NAME[root] || rootName) : rootName

  /* 지금 화면의 이름 */
  let here = LEAF[path]
  if (!here) {
    const last = decodeURIComponent(seg[seg.length - 1] || '')
    here = 영문조각(last) ? '' : (last.length > 28 ? last.slice(0, 28) + '…' : last)
  }

  /* 세 칸짜리(예: /change/naeyeok/공내역서) 는 가운데도 하나 끼웁니다 */
  const mid = seg.length >= 3 ? '/' + seg[0] + '/' + seg[1] : null
  const midName = mid ? (LEAF[mid] || NAME[mid] || decodeURIComponent(seg[1])) : null

  const parent = mid || root
  const parentName = midName || rootName2

  return (
    <nav className="crumbs" aria-label="길">
      {/* 큰 단추 하나 — 손가락으로 누르는 «뒤로» 입니다 */}
      {되감기 || <길 className="crumb-back" to={parent}>← {parentName}</길>}
      {/* 작은 길 — 여기가 어디인지 */}
      <span className="crumb-trail">
        <길 to={root}>{rootName2}</길>
        {mid && <><span className="crumb-sep">›</span><Link to={mid}>{midName}</Link></>}
        {here && <><span className="crumb-sep">›</span><b>{here}</b></>}
      </span>
    </nav>
  )
}
