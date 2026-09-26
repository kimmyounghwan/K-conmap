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
  '/jeoksan/lab': '적산 실험실',
  '/tools/dxf3d': '도면 3D 보기',
  '/tools/dxfpdf': '도면 PDF 만들기',
  '/tools/dwgdxf': 'DWG → DXF 바꾸기',
  '/tools/tuipbi': '현장 투입비 · 공사일보',
  '/tools/wonclick': '공사서류 원클릭',
  '/report/make': '성적표 만들기',
  '/naeyeok/ratio': '내역서 비율 맞추기',
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

export default function Crumbs() {
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const path = pathname.replace(/\/+$/, '') || '/'

  /* 🔖 2026-09-18 — 소장님: 「우리회사 것 신청하기 하면 사랑방으로 가는데,
     뒤로가기가 없어」

     사랑방·바로투찰 같은 «큰 자리» 는 원래 길을 안 그렸습니다 — 탭에 이미 불이
     들어오니까요. 그런데 **다른 화면이 보낸 경우** 는 다릅니다. 성적표를 보다
     「신청하기」를 눌렀는데 사랑방에 떨어지면, **성적표로 돌아갈 길이 화면에
     없습니다.** 앱으로 깔아 쓰면 브라우저 뒤로가기 단추도 없습니다.

     보내는 쪽에서 `state={{ from: { to, name } }}` 만 달아 주면 됩니다.
     ⚠️ 화면을 하나하나 고치지 마십시오 — 길은 여기 한 곳에서만 그립니다. */
  const 온곳 = state && state.from
  if (온곳 && 온곳.to && 온곳.to !== path) {
    const 이름 = 온곳.name || NAME[온곳.to] || '앞 화면'
    return (
      <nav className="crumbs" aria-label="길">
        <Link className="crumb-back" to={온곳.to}>← {이름}</Link>
      </nav>
    )
  }

  /* 🔖 2026-09-18 — 소장님: 「건설맵 사이트 전수조사 해서 뒤로가기 버튼 달아줘」

     라우트 37개를 하나씩 대조했더니 «길이 아예 안 그려지는» 자리가 이렇게 있었습니다.
       · 탭에 있는 큰 자리 20곳 — 다른 화면이 보내 놓고도 돌아갈 길이 없었습니다
       · /pdf · /admin — 이름표(NAME)에 없어서 길을 못 그렸습니다 (지금 넣었습니다)
       · /report/make — 이름이 없어 「업체 입찰 성적표 › make」 로 나왔습니다 (넣었습니다)
       · 없는 주소(NotFound) — 들어오면 나갈 길이 없었습니다

     그래서 «부모로 가는 길» 을 못 그리는 자리에는 **브라우저 기록으로 한 걸음 뒤로**
     갑니다. 리액트 라우터가 기록마다 `idx` 를 매겨 두므로, 0 보다 크면 **우리 사이트
     안에서 걸어 들어온 것**입니다 — 그때만 그립니다.
     ⚠️ 검색·주소창으로 바로 들어온 사람(idx 0)에게는 그리지 않습니다.
        누르면 사이트 밖으로 나가 버립니다.
     ⚠️ sessionStorage 를 쓰므로 새로고침해도 번호는 남습니다. */
  const 걸어들어왔나 = () => {
    try { const i = window.history.state && window.history.state.idx; return typeof i === 'number' && i > 0 }
    catch { return false }
  }
  const 한걸음뒤로 = () => (걸어들어왔나() ? (
    <nav className="crumbs" aria-label="길">
      <button type="button" className="crumb-back" onClick={() => navigate(-1)}>← 뒤로</button>
    </nav>
  ) : null)

  /* 🔙 탭이 아닌 한 칸 화면 — 늘 부모 탭으로 (위 PARENT 설명) */
  if (PARENT[path]) {
    const to = PARENT[path]
    return (
      <nav className="crumbs" aria-label="길">
        <Link className="crumb-back" to={to}>← {탭이름[to] || NAME[to]}</Link>
      </nav>
    )
  }

  if (TOP.has(path)) return 한걸음뒤로()

  const seg = path.split('/').filter(Boolean)
  if (seg.length <= 1) return 한걸음뒤로()   /* 한 칸짜리 주소 — 올라갈 부모가 없습니다 */

  const root = '/' + seg[0]
  const rootName = NAME[root]
  if (!rootName) return 한걸음뒤로()         /* 모르는 주소 — 길은 못 그려도 나갈 문은 냅니다 */

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
  const parentName = midName || rootName

  return (
    <nav className="crumbs" aria-label="길">
      {/* 큰 단추 하나 — 손가락으로 누르는 «뒤로» 입니다 */}
      <Link className="crumb-back" to={parent}>← {parentName}</Link>
      {/* 작은 길 — 여기가 어디인지 */}
      <span className="crumb-trail">
        <Link to={root}>{rootName}</Link>
        {mid && <><span className="crumb-sep">›</span><Link to={mid}>{midName}</Link></>}
        {here && <><span className="crumb-sep">›</span><b>{here}</b></>}
      </span>
    </nav>
  )
}
