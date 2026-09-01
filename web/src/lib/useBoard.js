import { useCallback, useEffect, useRef, useState } from 'react'
import { getBoardMeta, getBoardPart } from './data.js'

/**
 * 7주치 목록 불러오기.
 *
 *  하루에 300~500건씩 쌓이므로 한 묶음(500건)만 받으면 하루치밖에 안 됩니다.
 *  그래서 이렇게 합니다:
 *    1) 첫 묶음이 오면 바로 화면을 그린다 (즉시 뜸)
 *    2) 나머지 7주치는 뒤에서 조용히 이어 받는다 (몇 초면 끝)
 *  브로틀리 압축이 걸려 있어 7주 전체라도 실제 전송량은 크지 않습니다.
 */
export function useBoard(name, kind) {
  const [meta, setMeta] = useState(null)
  const [rows, setRows] = useState([])
  const [loaded, setLoaded] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const seq = useRef(0)

  const info = meta ? meta[kind] : null
  const parts = info ? info.parts : 0
  const done = parts > 0 && loaded >= parts

  useEffect(() => {
    const my = ++seq.current
    setLoading(true); setRows([]); setLoaded(0); setBusy(true)

    ;(async () => {
      const m = await getBoardMeta(name)
      if (seq.current !== my) return
      setMeta(m)
      const total = (m && m[kind] && m[kind].parts) || 1

      // ① 첫 묶음 — 바로 그린다
      const p0 = await getBoardPart(name, kind, 0)
      if (seq.current !== my) return
      setRows(p0 || [])
      setLoaded(1)
      setLoading(false)

      // ② 나머지 — 5개씩 끊어서 뒤에서 이어 받는다
      for (let i = 1; i < total; i += 5) {
        const batch = await Promise.all(
          Array.from({ length: Math.min(5, total - i) },
            (_, k) => getBoardPart(name, kind, i + k)))
        if (seq.current !== my) return
        setRows((r) => r.concat(...batch.map((g) => g || [])))
        setLoaded(Math.min(i + 5, total))
      }
      if (seq.current === my) setBusy(false)
    })()
  }, [name, kind])

  // 화면 쪽에서 부르던 이름들 — 이제는 저절로 다 받아오므로 할 일이 없습니다
  const noop = useCallback(() => {}, [])

  return { meta, info, rows, loading, busy, done, loadMore: noop, loadAll: noop }
}
