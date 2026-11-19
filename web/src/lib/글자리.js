/* 📍 G781 (2026-11-19) 글 자리 짐작 — 맵톡 글쓰기 칸 밖에서 쓴 글에도 시·군(g)을 붙여 맵톡 지도에 핀이 꽂히게
 *   소장님 「글을 쓰면 지역을 선택하고 날아가서 꽂히는 건데 … 꽂히는게 너무 없어? 왜 그러지?」
 *   → 실측(11-19): 최근 글 292 중 지역 있는 글 15 · 이번 주 48 중 0 — 거의 모두 «💬 한 줄 남겨 주세요» 창(AskComment.jsx)에서 올라와
 *     지역(g)이 없었음(맵톡 글쓰기 칸만 지역을 붙였음) → 「그렇게 해」
 *   ■ 맵톡 글쓰기 칸과 같은 길: 이 기기에서 고른 곳(곳기억) → 없으면 접속 위치로 짐작(lib/맵톡.js 자리짐작 · 4초 안)
 *   ■ 지도 자료(39KB) · 맵톡 셈은 창이 열릴 때만 받음(첫 화면 무게 그대로) · 못 찾으면 핀 없이(글은 그대로 올라감)
 *   ■ 창에 «📍 ○○ (짐작) — 맵톡 지도에 핀이 꽂힙니다 · 빼기» 한 줄 — 빼면 핀 없이(자유 방)
 */
import { useEffect, useState } from 'react'

/** 창이 열릴 때(켜짐) 자리 하나 — { k: 곳 번호, n: 이름, 짧은, 짐작: 접속 위치로 짐작했나 } | null */
export function use짐작곳(켜짐) {
  const [곳, set곳] = useState(null)
  useEffect(() => {
    if (!켜짐) return undefined
    let 살 = true
    ;(async () => {
      try {
        const [M, m] = await Promise.all([import('./맵톡.js'), import('../data/한국지도.json')])
        const 바탕 = m.default || m
        const 기억 = M.곳기억읽기(바탕)
        const p = 기억 || (await M.자리짐작(바탕))
        if (살 && p && p.k) set곳({ k: String(p.k), n: p.n, 짧은: M.짧은이름(p.n), 짐작: !기억 })
      } catch (e) { /* 못 찾으면 핀 없이 — 글은 그대로 올라감 */ }
    })()
    return () => { 살 = false }
  }, [켜짐])
  return 곳
}

/** 글값에 붙일 자리 — 빼기를 눌렀거나 못 찾았으면 빈 것 */
export const 자리값 = (곳, 뺌) => (곳 && 곳.k && !뺌 ? { g: String(곳.k) } : {})
