/**
 * 🩹 G588 (2026-11-08) 잠깐 보이는 알림 — 띄울 때마다 보이는 시간을 새로 셈
 *   전: const [말, set말] = useState('') + useEffect(() => { if (!말) return; setTimeout(() => set말(''), 4000) }, [말])
 *       → 같은 글(«📄 PDF 2쪽을 만들었습니다»)을 그 시간 안에 또 띄우면 말이 안 바뀌어 시계가 새로 안 걸리고,
 *         앞 시계가 새 알림을 곧바로 지움(일용 4대보험 시험에서 찾음 — PDF 를 3초 사이 두 번 누르면 둘째 알림이 0.x초 만에 사라짐)
 *   쓰는 법: const [말, set말] = use잠깐말(4000)   · set말('') 은 바로 지움 · 화면이 닫히면 시계도 걷음
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export function use잠깐말(ms = 4000) {
  const [말, set말0] = useState('')
  const 시계 = useRef(0)
  useEffect(() => () => clearTimeout(시계.current), [])
  const set말 = useCallback((m) => {
    clearTimeout(시계.current)
    set말0(m)
    if (m) 시계.current = setTimeout(() => set말0(''), ms)
  }, [ms])
  return [말, set말]
}
