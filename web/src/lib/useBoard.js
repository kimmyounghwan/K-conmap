import { useCallback, useEffect, useRef, useState } from 'react'
import { getBoardMeta, getBoardPart } from './data.js'

/**
 * 7주치 목록을 «필요한 만큼만» 받아오는 장치.
 *
 *  처음엔 0번 묶음(최신 500건)만 받아 바로 보여줍니다.
 *  검색어를 넣거나 지역을 고르면 그때 나머지를 받아옵니다.
 *  → 첫 화면은 가볍게, 검색은 7주 전체에서.
 */
export function useBoard(name, kind) {
  const [meta, setMeta] = useState(null)
  const [rows, setRows] = useState([])
  const [loaded, setLoaded] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingAll, setLoadingAll] = useState(false)
  const seq = useRef(0)

  const info = meta ? meta[kind] : null
  const parts = info ? info.parts : 0
  const done = parts > 0 && loaded >= parts

  useEffect(() => {
    const my = ++seq.current
    setLoading(true)
    setRows([])
    setLoaded(0)
    ;(async () => {
      const m = await getBoardMeta(name)
      if (seq.current !== my) return
      setMeta(m)
      const p0 = await getBoardPart(name, kind, 0)
      if (seq.current !== my) return
      setRows(p0 || [])
      setLoaded(1)
      setLoading(false)
    })()
  }, [name, kind])

  const loadAll = useCallback(async () => {
    if (!info || loadingAll || loaded >= info.parts) return
    const my = seq.current
    setLoadingAll(true)
    const idxs = []
    for (let i = loaded; i < info.parts; i += 1) idxs.push(i)
    // 한꺼번에 몰아치지 않도록 6개씩 끊어서 받는다
    const got = []
    for (let i = 0; i < idxs.length; i += 6) {
      const batch = await Promise.all(
        idxs.slice(i, i + 6).map((n) => getBoardPart(name, kind, n)))
      if (seq.current !== my) { setLoadingAll(false); return }
      got.push(...batch)
    }
    setRows((r) => r.concat(...got.map((g) => g || [])))
    setLoaded(info.parts)
    setLoadingAll(false)
  }, [name, kind, info, loaded, loadingAll])

  return { meta, info, rows, loading, loadingAll, done, loadAll }
}
