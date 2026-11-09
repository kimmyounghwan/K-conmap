import { Link } from 'react-router-dom'

/* 📚 G625 (2026-11-09) — «분석» 탭을 1순위 탭 안으로(탭 10개 한도 · 그 자리에 📚 자격증).
   1순위 현황판(/first) · 분석(/analysis) 맨 위에 같은 두 칸 단추 — 주소는 그대로라 검색 · 옛 링크가 안 끊깁니다.
   소장님 「분석을 1순위 안으로 넣으면 어떻게 넣을거지??」 → 두 칸 단추 설명 → 「캡쳐로 보여 줘봐」 */
export default function 일순분석칸({ 지금, 일순 = '/first' }) {
  return (
    <div className="seg fa-seg" role="tablist" aria-label="1순위 · 분석">
      <Link role="tab" aria-selected={지금 === 'first'} className={지금 === 'first' ? 'on' : ''} to={일순}>🏆 1순위 현황판</Link>
      <Link role="tab" aria-selected={지금 === 'analysis'} className={지금 === 'analysis' ? 'on' : ''} to="/analysis">🔍 발주기관 · 업체 분석</Link>
    </div>
  )
}
