/* 📚 「입찰 알아보기」 로 들어가는 길 — 화면 곳곳에 붙이는 «작은 목록» 입니다.
 *
 * ⚠️ 왜 guide.json 을 안 읽나: guide.json 은 17KB 입니다. 바로투찰 화면이 그걸 import 하면
 *    글을 안 읽는 방문자도 17KB 를 받게 됩니다(첫 화면 전송량 원칙 — CLAUDE.md).
 *    그래서 «제목 한 줄» 만 여기 따로 둡니다.
 * ⚠️ 대신 slug 가 어긋나면 죽은 링크가 됩니다 —
 *    tools/selfcheck.py 의 check_guidenav() 가 guide.json 과 대조합니다.
 */
export const GUIDE_NAV = [
  { slug: 'bid-price', ic: '🧮', t: '투찰금액은 어떻게 정해지나',
    d: '기초금액 · A값 · 사정률 · 낙찰하한율 — 네 값이 하는 일' },
  { slug: 'sajeongryul', ic: '🎲', t: '사정률이란 — 예정가격은 어떻게 뽑히나',
    d: '복수예비가격 15개 중 4개 추첨 · 실측 중앙 99.896%' },
  { slug: 'quantile', ic: '📉', t: '낮게 쓰면 더 딸까',
    d: '분위를 내려도 1순위율은 4% 언저리 — 실측 8,424건' },
  { slug: 'participants', ic: '🎯', t: '참가업체수가 승부를 가른다',
    d: '2~9곳 18.2% · 100곳 넘으면 1.6% — 11배 차이' },
  { slug: 'drawnum', ic: '🔢', t: '추첨번호를 잘 찍으면 유리할까',
    d: '실측 1,451건 — 번호와 낙찰 사이에 관계가 없었습니다' },
]

export const guideOf = (slug) => GUIDE_NAV.find((g) => g.slug === slug)
