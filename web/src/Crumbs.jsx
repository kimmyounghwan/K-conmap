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
import { Link, useLocation } from 'react-router-dom'

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
  '/tools': '건설 도구',
  '/cad': '캐드 유틸',
  '/jeoksan': 'K-적산',
  '/naeyeok': '내역서 작성 대행',
  '/safety': '안전관리계획서',
  '/shareone': '쉐어원 공유폴더',
  '/report': '업체 입찰 성적표',
  '/lic': '면허별 경쟁도',
  '/qna': '사랑방',
  '/how': '보는 방법',
  '/agency': '발주기관',
  '/corp': '업체',
  '/notice': '공고',
}

/* 두 칸짜리 안쪽 화면의 «제 이름» — 없으면 주소 조각을 그대로 씁니다. */
const LEAF = {
  '/change/calc': '증감율 계산',
  '/change/excel': '엑셀로 만들기',
  '/change/naeyeok': '설계변경 내역서',
  '/change/twoline': '2줄 자동변환',
  '/jeoksan/run': '수량산출서 만들기',
  '/jeoksan/lab': '적산 실험실',
}

/* 탭(또는 큰 자리)에 이미 있는 주소 — 길을 안 그립니다. */
const TOP = new Set(['/', '/calc', '/first', '/live', '/analysis', '/jobs', '/forms',
  '/change', '/naeyeok', '/jeoksan', '/qna', '/how', '/guide', '/tools', '/cad',
  '/daily', '/safety', '/shareone', '/report', '/lic'])

export default function Crumbs() {
  const { pathname } = useLocation()
  const path = pathname.replace(/\/+$/, '') || '/'
  if (TOP.has(path)) return null

  const seg = path.split('/').filter(Boolean)
  if (!seg.length) return null

  const root = '/' + seg[0]
  const rootName = NAME[root]
  if (!rootName) return null                 /* 모르는 주소 — 섣불리 그리지 않습니다 */

  /* 지금 화면의 이름 */
  let here = LEAF[path]
  if (!here) {
    const last = decodeURIComponent(seg[seg.length - 1] || '')
    here = last.length > 28 ? last.slice(0, 28) + '…' : last
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
        <span className="crumb-sep">›</span>
        <b>{here}</b>
      </span>
    </nav>
  )
}
