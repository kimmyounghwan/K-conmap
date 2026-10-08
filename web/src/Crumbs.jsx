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
  '/naeyeok': '내역서',
  '/safety': '안전·유해위험방지 계획서',
  '/shareone': '쉐어원 공유폴더',
  '/report': '업체 입찰 성적표',
  '/lic': '면허별 경쟁도',
  '/qna': '맵톡',
  '/how': '보는 방법',
  '/agency': '발주기관',
  '/corp': '업체',
  '/pdf': 'PDF 도구',
  '/admin': '관리자',
  '/notice': '공고',
  '/pre': '곧 나올 공사',
  '/svc': '용역 공고',
  '/goods': '물품 공고',
  /* 🩹 G198 뒤로가기 이름(«← 물품 1순위») */
  '/svc/first': '용역 1순위', '/svc/calc': '용역 바로투찰',
  '/goods/first': '물품 1순위', '/goods/calc': '물품 바로투찰',
}

/* 두 칸짜리 안쪽 화면의 «제 이름» — 없으면 주소 조각을 그대로 씁니다. */
const LEAF = {
  '/change/calc': '증감율 계산',
  '/change/excel': '엑셀로 만들기',
  '/change/naeyeok': '공사 내역서 모음',
  '/change/twoline': '2줄 자동변환',
  '/change/work': '설계변경 작업대',
  '/change/won': '원 내역서로 설계변경',
  '/jeoksan/run': '수량산출서 만들기',
  '/jeoksan/golgo': '골조 수량산출',
  '/jeoksan/auto': '도면 물량 자동',
  '/jeoksan/magam': '마감 수량산출',
  '/jeoksan/lab': '적산 실험실',
  '/tools/dxf3d': '도면 3D 보기',
  '/tools/dxfpdf': '도면 PDF 만들기',
  '/tools/dwgdxf': 'DWG → DXF 바꾸기',
  '/tools/tuipbi': '현장 투입비 · 공사일보',
  '/tools/equip': '장비 임대료·수금 장부',
  '/tools/risk': '위험성평가 (별지 1~5)',
  '/tools/photo': '사진대지 · 영수증 정리',
  '/tools/wonclick': '공사서류 원클릭',
  '/report/make': '성적표 만들기',
  '/report/agency': '발주기관 보고서 만들기',
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
  '/pre': '/live',
  /* 🩹 G198 소장님 「용역, 물품 에서 클릭해서 들어가면 뒤로가야 하는데 뒤로가기 버튼이 없어?」 —
     계산기를 주소(카톡 링크 · 즐겨찾기)로 바로 열어도 맨 위 «←» 가 그 방 공고로 */
  '/svc/calc': '/svc', '/goods/calc': '/goods',
}
const 탭이름 = { '/tools': '도구', '/forms': '서식', '/naeyeok': '내역서', '/first': '1순위', '/': '바로투찰', '/svc': '용역 공고', '/goods': '물품 공고' }
/* 영문 주소 조각(siljeong-bogo, a-value …)은 사람이 읽는 이름이 아닙니다 — 길에 그리지 않습니다.
   화면 제목(h1)이 바로 아래에 있습니다. */
const 영문조각 = (x) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(x)

/* 탭(또는 큰 자리)에 이미 있는 주소 — 길을 안 그립니다. */
const TOP = new Set(['/', '/calc', '/first', '/live', '/analysis', '/jobs', '/my', '/forms',
  '/svc', '/svc/live', '/svc/first', '/svc/calc', '/goods', '/goods/live', '/goods/first', '/goods/calc',   /* 🏠 G194c · 💰 G194d 세 방의 탭 자리 */
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
const 길 = ({ to, className, children, ...남 }) => (정적.has(to)
  ? <a className={className} href={to} {...남}>{children}</a>
  : <Link className={className} to={to} {...남}>{children}</Link>)

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

/* 📱 2026-09-28 — 소장님: 「핸드폰에서 K-건설맵 아래에 뒤로가기 버튼 바로투찰이 보이는데, 이걸 새로고침 옆으로 옮기거나
   공간이 부족하면 삭제해줘. 이상해...뒤로가기 버튼만 둥그러니 있으니까」
   → «뒤로» 단추는 맨 위 막대(새로고침 왼쪽)로 옮깁니다(BackBtn). «←» 그림만(2026-10-05 — 넓은 화면의 이름도 뺌).
     화면 안에는 넓은 화면에서만 작은 길(도구 › 예정공정표)을 남깁니다 — 좁은 화면에서는 아무것도 그리지 않습니다.
   ⚠️ 무엇으로 돌아가는지(기록 되감기 · 부모 · 뿌리)는 예전 그대로입니다 — 길계산() 한 곳에서만 정합니다. */
function 길계산(pathname, state) {
  const path = pathname.replace(/\/+$/, '') || '/'
  /* ── 사이트 안에서 걸어 들어왔으면: «← 들어온 곳» = 기록 되감기 ── */
  const 온 = 들어온곳(pathname)
  const 되감기 = 온 ? { 몇칸: 온.몇칸, 이름: 이름짓기(온.p, 온.t) } : null

  /* 🔖 2026-09-18 — 다른 화면이 state={{ from }} 을 달아 보낸 경우(성적표 → 사랑방 등).
     들어온 기록이 있으면 그것이 먼저입니다(같은 곳이고, 되감으면 보던 자리까지 돌아갑니다). */
  const 온곳 = state && state.from
  if (!되감기 && 온곳 && 온곳.to && 온곳.to !== path) {
    return { back: { to: 온곳.to, 이름: 온곳.name || NAME[온곳.to] || '앞 화면' }, trail: null }
  }

  /* 탭에 있는 큰 자리 — 걸어 들어왔을 때만 «← 들어온 곳». 바로 들어왔으면 아무것도 그리지 않습니다
     (누르면 사이트 밖으로 나가 버리니까요). */
  if (TOP.has(path) && !PARENT[path]) return { back: 되감기, trail: null }

  if (PARENT[path]) {
    const to = PARENT[path]
    return { back: 되감기 || { to, 이름: 탭이름[to] || NAME[to] }, trail: null }
  }

  const seg = path.split('/').filter(Boolean)
  if (seg.length <= 1) return { back: 되감기, trail: null }

  const root0 = '/' + seg[0]
  const rootName = NAME[root0]
  if (!rootName) return { back: 되감기, trail: null }
  const root = 뿌리로[root0] || root0          /* /notice → 공고 목록 · /agency·/corp → 분석 */
  const rootName2 = 뿌리로[root0] ? (NAME[root] || rootName) : rootName

  /* 지금 화면의 이름 */
  let here = LEAF[path]
  if (!here) {
    const last = decodeURIComponent(seg[seg.length - 1] || '')
    /* 💬 /qna/{글번호} — 번호는 사람이 읽는 이름이 아닙니다(글 제목이 바로 아래에 있습니다) */
    here = (영문조각(last) || root0 === '/qna') ? '' : (last.length > 28 ? last.slice(0, 28) + '…' : last)
  }

  /* 세 칸짜리(예: /change/naeyeok/공내역서) 는 가운데도 하나 끼웁니다 */
  const mid = seg.length >= 3 ? '/' + seg[0] + '/' + seg[1] : null
  const midName = mid ? (LEAF[mid] || NAME[mid] || decodeURIComponent(seg[1])) : null

  const parent = mid || root
  const parentName = midName || rootName2
  return { back: 되감기 || { to: parent, 이름: parentName }, trail: { root, rootName2, mid, midName, here } }
}

/** 🔙 맨 위 막대의 «뒤로» (새로고침 왼쪽) — 돌아갈 곳이 없으면 그리지 않습니다 */
export function BackBtn() {
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const { back } = 길계산(pathname, state)
  if (!back) return null
  /* 🔙 2026-10-05 — 소장님: 「뒤로가기가 또 이상하게 됐어. 그냥 화살표만 있고 뒤로 가기로 수정해줘」
     넓은 화면에서 «← 도면 물량 자동» 처럼 앞 화면 이름이 붙어 나왔습니다(이름이 들쭉날쭉 · 무엇을 누르는지 헷갈림).
     → 어느 폭에서나 «←» 하나. 하는 일은 그대로 «뒤로»(들어온 곳으로 기록 되감기 · 바로 들어왔으면 윗 화면).
       어디로 가는지는 마우스를 올리면(title) 보입니다. */
  const 글 = <span className="tbic" aria-hidden="true">←</span>
  const 말 = '뒤로 가기' + (back.이름 ? ` (${back.이름})` : '')
  if (back.몇칸) return <button type="button" className="topback" onClick={() => navigate(back.몇칸)} title={말} aria-label={말}>{글}</button>
  return <길 className="topback" to={back.to} title={말} aria-label={말}>{글}</길>
}

/** 화면 안의 작은 길(넓은 화면에서만) — 「도구 › 예정공정표」 */
export default function Crumbs() {
  const { pathname, state } = useLocation()
  const { trail } = 길계산(pathname, state)
  if (!trail) return null
  const { root, rootName2, mid, midName, here } = trail
  return (
    <nav className="crumbs" aria-label="길">
      <span className="crumb-trail">
        <길 to={root}>{rootName2}</길>
        {mid && <><span className="crumb-sep">›</span><Link to={mid}>{midName}</Link></>}
        {here && <><span className="crumb-sep">›</span><b>{here}</b></>}
      </span>
    </nav>
  )
}
