import { useCallback, useEffect, useRef, useState } from 'react'
import { getBoardMeta, getBoardPart } from './data.js'

/**
 * 7주치 목록 불러오기 — «필요할 때만» 받습니다.
 *
 * ══════════════════════════════════════════════════════════════
 *  ⚠️ 2026-09-03 되돌림. 이 파일이 전송량의 90% 를 먹고 있었습니다.
 *
 *  전에는 이랬습니다:
 *      ① 첫 묶음을 받아 화면을 그린다
 *      ② **나머지 7주치를 뒤에서 조용히 다 받는다**   ← 이게 문제
 *      ③ loadMore / loadAll 은 noop (할 일이 없으므로)
 *
 *  주석에 「브로틀리라 실제 전송량은 크지 않습니다」라고 적어 뒀는데,
 *  실제로 재보니 **크지 않은 게 아니었습니다** (gzip 기준):
 *
 *      1순위 탭을 열고 몇 초 머무르면   23묶음 · 1.49 MB
 *      공고 탭까지 보면                +25묶음 · 3.22 MB
 *
 *  Firebase 무료 전송량이 하루 360MB 이므로 **하루 112명이 천장**이었습니다.
 *  목록을 500건씩 쪼개 놓고는 결국 다 받고 있었으니, 쪼갠 의미가 없었습니다.
 *  (CLAUDE.md 「큰 파일을 브라우저로 보내지 않는다」를 스스로 어긴 것입니다)
 *
 *  지금은 이렇게 합니다:
 *      ① 첫 묶음만 받는다 (95KB) — 화면이 바로 뜬다
 *      ② 끝까지 넘겨 보면 그때 다음 묶음을 받는다        (loadMore)
 *      ③ 검색·지역선택처럼 «전체를 뒤져야» 하면 다 받는다 (loadAll)
 *
 *  화면 쪽(FirstBoard·LiveBoard)은 이미 이 두 함수를 제때 부르고 있었습니다.
 *  막고 있던 건 이 파일이었습니다.
 *
 *  ⚠️ 다시 «미리 다 받기»로 바꾸지 마세요. 빨라 보이지만 요금이 붙습니다.
 *     바꾸려면 먼저 board 묶음들의 gzip 합계를 재고, 하루 방문자 수로 나눠 보세요.
 * ══════════════════════════════════════════════════════════════
 */
export function useBoard(name, kind) {
  const [meta, setMeta] = useState(null)
  const [rows, setRows] = useState([])
  const [loaded, setLoaded] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const seq = useRef(0)
  const next = useRef(1)        // 다음에 받을 묶음 번호
  const running = useRef(false)
  /* ⚠️ total 을 «상태»가 아니라 ref 로 둡니다.
     처음엔 meta 상태를 봤는데, 사용자가 목록보다 먼저 검색어를 치면
     그 시점의 fetchMore 는 meta=null 을 붙잡고 있어서 **요청이 조용히 버려졌습니다.**
     (검색 결과가 첫 500건 안에서만 나와, 사용자는 «자료가 없네» 라고 읽습니다 — 제일 나쁩니다)
     그래서 total 은 ref 로, 못 받은 요청은 pending 에 적어 뒀다가 meta 가 오면 잇습니다. */
  const total = useRef(0)
  const pending = useRef(0)

  const info = meta ? meta[kind] : null
  const parts = info ? info.parts : 0
  const done = parts > 0 && loaded >= parts

  useEffect(() => {
    const my = ++seq.current
    setLoading(true); setRows([]); setLoaded(0); setBusy(true)
    next.current = 1
    running.current = false
    total.current = 0
    pending.current = 0

    ;(async () => {
      const m = await getBoardMeta(name)
      if (seq.current !== my) return
      setMeta(m)
      total.current = (m && m[kind] && m[kind].parts) || 0
      const p0 = await getBoardPart(name, kind, 0)
      if (seq.current !== my) return
      setRows(p0 || [])
      setLoaded(1)
      setLoading(false)
      setBusy(false)
      // 목록이 도착하기 전에 들어온 요청이 있으면 이제 처리합니다
      if (pending.current > 0) {
        const want = pending.current
        pending.current = 0
        fetchRef.current(want)
      }
    })()
  }, [name, kind])

  /** 묶음을 n개 더 받습니다. 순서가 섞이지 않도록 한 번에 하나만 돕니다. */
  const fetchRef = useRef(null)
  const fetchMore = useCallback(async (howMany) => {
    if (!total.current) {                 // 아직 목록이 안 왔습니다 — 적어 뒀다 잇습니다
      pending.current = Math.max(pending.current, howMany)
      return
    }
    if (running.current) {                // 이미 받는 중 — 더 큰 요청이면 이어서 하도록
      pending.current = Math.max(pending.current, howMany)
      return
    }
    if (next.current >= total.current) return
    running.current = true
    const my = seq.current
    setBusy(true)
    try {
      while (next.current < total.current && howMany > 0) {
        const take = Math.min(5, total.current - next.current, howMany)
        const from = next.current
        const batch = await Promise.all(
          Array.from({ length: take }, (_, k) => getBoardPart(name, kind, from + k)))
        if (seq.current !== my) return
        next.current = from + take
        howMany -= take
        setRows((r) => r.concat(...batch.map((g) => g || [])))
        setLoaded(next.current)
      }
    } finally {
      running.current = false
      if (seq.current === my) setBusy(false)
      // 받는 동안 들어온 요청이 있으면 이어서
      if (seq.current === my && pending.current > 0) {
        const want = pending.current
        pending.current = 0
        if (next.current < total.current) fetchRef.current(want)
      }
    }
  }, [name, kind])
  fetchRef.current = fetchMore

  /* 끝까지 넘겨 봤을 때 — 다음 5묶음만 */
  const loadMore = useCallback(() => { fetchMore(5) }, [fetchMore])
  /* 검색·지역선택 — 전체를 뒤져야 하므로 남은 것 다 */
  const loadAll = useCallback(() => { fetchMore(Number.MAX_SAFE_INTEGER) }, [fetchMore])

  return { meta, info, rows, loading, busy, done, loadMore, loadAll }
}
