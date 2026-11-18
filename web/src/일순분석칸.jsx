import { Link } from 'react-router-dom'
import { 지도가는길 } from './lib/현황판.js'
import { loadRegion } from './lib/lic.js'
import { 세기 } from './lib/받은수.jsx'

/* 📚 G625 (2026-11-09) — «분석» 탭을 1순위 탭 안으로(탭 10개 한도 · 그 자리에 📚 자격증).
   1순위 현황판(/first) · 분석(/analysis) 맨 위에 같은 두 칸 단추 — 주소는 그대로라 검색 · 옛 링크가 안 끊깁니다.
   소장님 「분석을 1순위 안으로 넣으면 어떻게 넣을거지??」 → 두 칸 단추 설명 → 「캡쳐로 보여 줘봐」 */
/* 🗺 G778 (2026-11-19) 소장님 「여기에 지도로 보기 넣으면 어때?」 → 「빈 공간이 있잖아」 — 두 칸 단추 오른쪽 빈자리에 작은 단추 + 설명글
   (공사일 때만 — 용역 · 물품은 현황판이 없음) · 1순위 제목 줄 오른쪽 작은 글은 여기로 옮김 · 폰(640 아래)은 두 칸 아래 한 줄 · 세기 |현황판|1순위에서 */
export default function 일순분석칸({ 지금, 일순 = '/first', 지역 }) {
  const 공사 = 일순 === '/first'
  return (
    <div className="fa-row">
    <div className="seg fa-seg" role="tablist" aria-label="1순위 · 분석">
      <Link role="tab" aria-selected={지금 === 'first'} className={지금 === 'first' ? 'on' : ''} to={일순}>🏆 1순위 현황판</Link>
      <Link role="tab" aria-selected={지금 === 'analysis'} className={지금 === 'analysis' ? 'on' : ''} to="/analysis">🔍 발주기관 · 업체 분석</Link>
    </div>
    {공사 && (
      <Link className="fa-map" to={지도가는길(지역 || loadRegion(), 2)} onClick={() => 세기(지금 === 'analysis' ? '|현황판|분석에서' : '|현황판|1순위에서')}>
        <b>🗺 지도로 보기</b><small>곧 착공 현장을 시 · 도 지도로</small>
      </Link>
    )}
    </div>
  )
}
