import { useEffect, useMemo, useRef, useState } from 'react'
import { getBoardMeta, getBoardPart, getBoardIndex } from './data.js'
import { 바닥시각 } from './fresh.js'   /* 🩹 G193 빠른 길 겹침 막기 */

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
  /* ══════════════════════════════════════════════════════════════
   *  🩹 2026-10-16 소장님 실제 사이트 점검 — 1순위 «하수» 427건은 맞는데 1쪽 앞 12건이 «하수» 와 상관없는 공고.
   *  까닭: 위 ⚠️ 그대로 «색인과 묶음이 다른 판». 사이트 파일 주소는 화면 판(?v=)만 붙어서, 수집(30분마다)이 새 판을 올려도 주소가 같습니다.
   *        탭을 열 때 받은 0번 묶음은 그 탭이 닫힐 때까지 기억(getJSON)에 남고, 한참 뒤 검색하면 색인은 «새 판» 으로 옵니다
   *        → 새 개찰 N건이 앞에 붙은 만큼 0번 묶음 자리가 밀려 엉뚱한 공고를 가리킴(1번 묶음부터는 둘 다 새 판이라 맞음).
   *  고침: 줄을 그리기 전에 «색인 그 자리의 공고명 · 기관 = 묶음 그 줄의 공고명 · 기관» 을 맞춰 봅니다.
   *        하나라도 다르면 ① 그 줄은 안 그림(틀린 공고를 보이지 않음) ② 색인 · 묶음을 같은 표(tok)를 붙여 지금 판으로 다시 받음(두 번까지).
   *  ⚠️ 이 맞춰 보기를 빼지 마세요. 에러 없이 틀린 공고를 보여 주는 자리입니다.
   * ══════════════════════════════════════════════════════════════ */
  const [tok, setTok] = useState('')
  const [고침중, set고침중] = useState(false)
  const 다시수 = useRef(0)

  /* 줄마다 «전체에서 몇 번째»를 붙여 둡니다 — 카드를 펼쳤을 때
     순위 파일(corps)을 찾아오는 열쇠입니다. 순위는 목록 묶음에서 빼놨습니다
     (1순위 첫 화면 gzip 376KB → 73KB). _rk = [파일번호, 그 안에서 몇 번째].
     ⚠️ 나누는 크기는 여기서 정하지 않습니다. 목록표(meta)의 rankChunk 를 씁니다 —
        collect.py 의 BOARD_RANK_CHUNK 하나만 고치면 되도록. */
  const tagPos = (arr, chunkNo, chunkSize, rankSize) => {
    if (!Array.isArray(arr)) return arr
    const b = chunkNo * chunkSize
    for (let j = 0; j < arr.length; j++) {
      const r = arr[j]
      if (!r || r._rk) continue
      const pos = b + j
      r._b = name + '/' + kind
      r._rk = [Math.floor(pos / rankSize), pos % rankSize]
    }
    return arr
  }

  const parts = meta && meta[kind] ? meta[kind].parts : 0
  const CHUNK = (index && index.chunk) || (meta && meta.chunk) || 500

  // ── 처음: 목록표 + 첫 묶음만 ────────────────────────────────
  useEffect(() => {
    const my = ++seq.current
    setLoading(true); setChunks({}); setIndex(null)
    asked.current = new Set([0])
    idxAsked.current = false
    setTok(''); set고침중(false); 다시수.current = 0

    ;(async () => {
      const m = await getBoardMeta(name)
      if (seq.current !== my) return
      setMeta(m)
      const p0 = await getBoardPart(name, kind, 0)
      if (seq.current !== my) return
      setChunks({ 0: tagPos(p0 || [], 0, (m && m.chunk) || 500,
                            (m && m.rankChunk) || 50) })
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
    Promise.all(todo.map((i) => getBoardPart(name, kind, i, tok).then((d) => [i, d || []])))
      .then((got) => {
        if (seq.current !== my) return
        setChunks((c) => {
          const n = { ...c }
          const RK = (meta && meta.rankChunk) || 50
          for (const [i, d] of got) n[i] = tagPos(d, i, CHUNK, RK)
          return n
        })
      })
      .catch(() => { todo.forEach((i) => asked.current.delete(i)) })
      .finally(() => { if (seq.current === my) setBusy(false) })
  }, [loading, parts, hits, page, perPage, CHUNK, name, kind, tok])

  /** 받아 둔 묶음을 번호 순으로 이어붙인 것 (검색 안 할 때 씁니다) */
  const rows = useMemo(() => {
    const ks = Object.keys(chunks).map(Number).sort((a, b) => a - b)
    const out = []
    for (const k of ks) out.push(...chunks[k])
    return out
  }, [chunks])

  /** 검색 중이면 «그 쪽에 그릴 줄», 아니면 null.
   *
   *  ⚠️ 2026-09-03 — 여기에 조용한 함정이 있었습니다.
   *     이 쪽에 필요한 묶음 하나가 아직 안 왔거나 받기에 실패하면,
   *     그 줄들이 **말없이 빠진 채** 17줄만 그려집니다.
   *     사용자는 «자료가 원래 그만큼인가 보다» 라고 읽습니다 — 알 방법이 없습니다.
   *     (실제로 시험 중 묶음 6번이 404 났는데 화면은 아무 말도 안 했습니다)
   *     → 필요한 묶음이 다 있을 때만 그립니다. 아니면 pageReady=false 로
   *       화면이 «불러오는 중» 을 보여주게 합니다. */
  /* ★ 2026-09-03 저녁 — 「공고하고 1순위가 갑자기 다 사라졌지? 이틀 정도만 있어」
     «미리 다 받기» 를 끊고 나서, 검색을 안 할 때는 화면이 **받아 둔 500건**(≈ 개찰 이틀치)만
     세어 25쪽에서 끝났습니다. 26쪽부터는 묶음 1을 받아야 하는데 쪽수 자체가 25까지라
     갈 수가 없었습니다. 자료가 사라진 게 아니라 «쪽수를 받아 둔 것에서 센» 잘못입니다.
     → 검색이 아닐 때도 전체 건수는 목록표(meta)의 n 으로 세고, 쪽마다 필요한 묶음을
       번호로 찾아 그립니다. 묶음이 아직 없으면 pageReady=false(불러오는 중). */
  const totalAll = (meta && meta[kind] && meta[kind].n) || 0
  const 맞나 = (r, pos) => {
    const x = index && index.r[pos]
    if (!r || !x) return false
    const f = index.f || []
    const ni = f.indexOf('name'), ii = f.indexOf('inst')
    return (ni < 0 || String(x[ni] || '') === String(r.name || '')) && (ii < 0 || String(x[ii] || '') === String(r.inst || ''))
  }
  const { pageRows, pageReady, 어긋남 } = useMemo(() => {
    const out = []
    let ready = true
    let 틀림 = 0
    if (hits) {
      if (고침중) return { pageRows: [], pageReady: false, 어긋남: 0 }
      for (const pos of hits.slice((page - 1) * perPage, page * perPage)) {
        const c = chunks[Math.floor(pos / CHUNK)]
        if (!c) { ready = false; continue }
        const r = c[pos % CHUNK]
        if (r && 맞나(r, pos)) out.push(r)
        else 틀림++
      }
    } else {
      const end = Math.min(totalAll, page * perPage)
      for (let pos = (page - 1) * perPage; pos < end; pos++) {
        const c = chunks[Math.floor(pos / CHUNK)]
        if (!c) { ready = false; continue }
        const r = c[pos % CHUNK]
        if (r) out.push(r)
      }
    }
    return { pageRows: out, pageReady: ready, 어긋남: 틀림 }
  }, [hits, chunks, page, perPage, CHUNK, totalAll, 고침중, index])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 🩹 색인 · 묶음 판이 어긋났으면 — 같은 표(tok)로 둘 다 지금 판을 다시 받습니다(두 번까지). 그 사이엔 «불러오는 중» */
  useEffect(() => {
    if (!어긋남 || 고침중 || 다시수.current >= 2) return
    다시수.current += 1
    const t = Date.now().toString(36) + 다시수.current
    const my = seq.current
    asked.current = new Set([0])
    setChunks({}); setTok(t); set고침중(true); setBusy(true)
    Promise.all([getBoardIndex(name, kind, t), getBoardPart(name, kind, 0, t)])
      .then(([d, p0]) => {
        if (seq.current !== my) return
        if (d && Array.isArray(d.r)) setIndex(d)
        const RK = (meta && meta.rankChunk) || 50
        setChunks((c) => ({ ...c, 0: tagPos(p0 || [], 0, (d && d.chunk) || CHUNK, RK) }))
      })
      .catch(() => {})
      .finally(() => { if (seq.current === my) { set고침중(false); setBusy(false) } })
  }, [어긋남, 고침중])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 🩹 G193 — 0번부터 이어 받은 묶음의 가장 오래된 시각(뒤 묶음이 더 있을 때만) · 빠른 길(fresh) 겹침 막기 */
  const floor = useMemo(() => 바닥시각(chunks, parts), [chunks, parts])

  return {
    meta,
    info: meta ? meta[kind] : null,
    floor,
    rows,
    pageRows,       // 이 쪽에 그릴 줄 (검색 중이든 아니든)
    pageReady,      // 이 쪽에 필요한 묶음이 다 왔나 (아니면 «불러오는 중»)
    total: hits ? hits.length : (meta ? totalAll : null),   // 7주 전체 건수
    indexReady: !!index,
    loading,
    busy,
  }
}
