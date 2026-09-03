import { useEffect, useMemo, useRef, useState } from 'react'
import { getBoardMeta, getBoardPart, getBoardIndex } from './data.js'

/**
 * 7주치 목록 — «지금 보고 있는 쪽»에 필요한 것만 받습니다.
 *
 * ══════════════════════════════════════════════════════════════
 *  왜 이렇게 됐나 (2026-09-03, 전부 실측)
 *
 *  ① 처음엔 「첫 묶음을 그리고 나머지는 뒤에서 조용히 다 받는다」였습니다.
 *     주석엔 「브로틀리라 전송량이 크지 않습니다」라고 적혀 있었는데, 재보니
 *     1순위 탭을 열고 가만히 있기만 해도 **1.49MB** 였습니다.
 *     → 미리 받기를 끊었습니다. 첫 화면은 이제 **95KB** 입니다.
 *
 *  ② 그런데 검색은 7주치를 다 뒤져야 해서 여전히 전부 받았습니다
 *     (1순위 1,528KB · 공고 1,767KB). 검색 한 번이 안 하는 방문 16명분입니다.
 *     그래서 «걸러내기에 필요한 최소한»만 담은 **검색 색인**을 만들었습니다.
 *
 *         1순위 색인 358KB  ·  공고 색인 352KB
 *
 *     화면은 색인으로 «몇 건인지·몇 쪽인지»를 정확히 세고,
 *     **그 쪽에 나올 20건이 든 묶음만** 받습니다. 실측:
 *
 *         「도로」  597건 · 전체를 그리려면 23묶음 · 첫 쪽은 **1묶음**
 *         「경주시」 65건 · 19묶음                  · 첫 쪽은 **5묶음**
 *
 *  ⚠️ 색인의 순서는 묶음을 이어붙인 것과 **정확히 같아야** 합니다.
 *     n번째 항목 = (n÷chunk)묶음의 (n%chunk)번째 줄.
 *     collect.py 의 export_board 가 같은 자리에서 만듭니다. 한쪽만 고치면
 *     **검색 결과가 엉뚱한 공고를 가리킵니다 — 에러 없이.**
 *     tools/selfcheck.py 가 이 순서를 대조합니다.
 *
 *  ⚠️ 다시 «미리 다 받기»로 바꾸지 마세요. 빨라 보이지만 요금이 붙습니다.
 *     바꾸기 전에 board 묶음들의 gzip 합계를 재고 하루 방문자로 나눠 보세요.
 * ══════════════════════════════════════════════════════════════
 *
 * @param match   (idxRow, i) => boolean. 색인 한 줄로 «남길지» 판단합니다.
 *                null 이면 색인을 아예 안 받습니다(=검색 안 하는 방문자).
 * @param page    1부터.
 * @param perPage 한 쪽 건수.
 */
export function useBoard(name, kind, { match = null, page = 1, perPage = 20 } = {}) {
  const [meta, setMeta] = useState(null)
  const [index, setIndex] = useState(null)
  /* 묶음을 «번호별로» 보관합니다. 배열에 이어붙이면 7번을 먼저 받았을 때
     날짜 순서가 깨집니다. 번호를 키로 두면 어떤 순서로 받아도 정렬이 유지됩니다. */
  const [chunks, setChunks] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const seq = useRef(0)
  const asked = useRef(new Set())
  const idxAsked = useRef(false)

  const parts = meta && meta[kind] ? meta[kind].parts : 0
  const CHUNK = (index && index.chunk) || (meta && meta.chunk) || 500

  // ── 처음: 목록표 + 첫 묶음만 ────────────────────────────────
  useEffect(() => {
    const my = ++seq.current
    setLoading(true); setChunks({}); setIndex(null)
    asked.current = new Set([0])
    idxAsked.current = false

    ;(async () => {
      const m = await getBoardMeta(name)
      if (seq.current !== my) return
      setMeta(m)
      const p0 = await getBoardPart(name, kind, 0)
      if (seq.current !== my) return
      setChunks({ 0: p0 || [] })
      setLoading(false)
    })()
  }, [name, kind])

  // ── 검색·지역선택이 시작되면 색인을 한 번만 받습니다 ──────────
  const wantIndex = !!match
  useEffect(() => {
    if (!wantIndex || idxAsked.current) return
    idxAsked.current = true
    const my = seq.current
    setBusy(true)
    getBoardIndex(name, kind)
      .then((d) => { if (seq.current === my && d && Array.isArray(d.r)) setIndex(d) })
      .catch(() => {})
      .finally(() => { if (seq.current === my) setBusy(false) })
  }, [wantIndex, name, kind])

  /* ── 걸러낸 결과의 «위치 목록» — 7주 전체에서 정확히 셉니다 ── */
  const hits = useMemo(() => {
    if (!match || !index) return null
    const out = []
    for (let i = 0; i < index.r.length; i++) if (match(index.r[i], i)) out.push(i)
    return out
  }, [match, index])

  // ── 이 쪽에 필요한 묶음만 받아옵니다 ─────────────────────────
  useEffect(() => {
    if (loading || !parts) return
    const need = new Set()
    if (hits) {
      for (const pos of hits.slice((page - 1) * perPage, page * perPage)) {
        need.add(Math.floor(pos / CHUNK))
      }
    } else {
      const upto = Math.min(parts - 1, Math.floor((page * perPage - 1) / CHUNK))
      for (let i = 0; i <= upto; i++) need.add(i)
    }
    const todo = [...need].filter((i) => i >= 0 && i < parts && !asked.current.has(i))
    if (!todo.length) return
    todo.forEach((i) => asked.current.add(i))
    const my = seq.current
    setBusy(true)
    Promise.all(todo.map((i) => getBoardPart(name, kind, i).then((d) => [i, d || []])))
      .then((got) => {
        if (seq.current !== my) return
        setChunks((c) => {
          const n = { ...c }
          for (const [i, d] of got) n[i] = d
          return n
        })
      })
      .catch(() => { todo.forEach((i) => asked.current.delete(i)) })
      .finally(() => { if (seq.current === my) setBusy(false) })
  }, [loading, parts, hits, page, perPage, CHUNK, name, kind])

  /** 받아 둔 묶음을 번호 순으로 이어붙인 것 (검색 안 할 때 씁니다) */
  const rows = useMemo(() => {
    const ks = Object.keys(chunks).map(Number).sort((a, b) => a - b)
    const out = []
    for (const k of ks) out.push(...chunks[k])
    return out
  }, [chunks])

  /** 검색 중이면 «그 쪽에 그릴 줄», 아니면 null */
  const pageRows = useMemo(() => {
    if (!hits) return null
    const out = []
    for (const pos of hits.slice((page - 1) * perPage, page * perPage)) {
      const c = chunks[Math.floor(pos / CHUNK)]
      const r = c && c[pos % CHUNK]
      if (r) out.push(r)
    }
    return out
  }, [hits, chunks, page, perPage, CHUNK])

  return {
    meta,
    info: meta ? meta[kind] : null,
    rows,
    pageRows,
    total: hits ? hits.length : null,
    indexReady: !!index,
    loading,
    busy,
  }
}
