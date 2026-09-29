/* ⚡ 공고 · 1순위 «빠른 길» — 2026-09-30
 *
 * 소장님: 「공고하고 1순위 좀 더 빨리 뜨게 안될까?」 → 「오늘 밤에 만들어 줘」
 *   사이트 목록(board)은 한 바퀴(수집→빌드→배포)를 돌아야 바뀌어 1~2시간 늦었습니다.
 *   fast.py(깃허브 fast.yml)가 10분마다 «오늘 새로 나온 것» 만 데이터베이스 fresh 칸에 넣습니다.
 *   여기서 그것을 읽어 목록 맨 위에 «🆕 방금» 으로 얹습니다.
 *
 * ■ 읽는 법 — 파이어베이스 SDK 를 부르지 않고 REST 로 읽습니다(공고 · 1순위 화면에 SDK 무게를 안 얹습니다).
 *   fresh/meta/{name}.json → {at, built, n, p, h} · fresh/rows/{name}/{i}.json → "[…]"(JSON 글자 — fast.py 가 그렇게 넣음)
 *   처음엔 첫 묶음(40건)만, 거르기(검색·지역·면허)를 하면 나머지 묶음도 받습니다.
 * ■ 한 번 보인 줄은 이 화면에서 지우지 않습니다 — 열어 둔 사이 정기 배포가 그 공고를 싣고 나면
 *   빠른 길에서는 빠지는데, 열어 둔 화면의 목록은 옛것이라 둘 다에 없어지는 틈이 생기기 때문입니다.
 * ■ 못 읽으면(규칙 · 망) 아무것도 안 얹습니다 — 목록은 그대로입니다.
 */
import { useEffect, useRef, useState } from 'react'

const DB = 'https://k-conmap-default-rtdb.firebaseio.com'
const EVERY = 5 * 60000

async function getJSON(path) {
  const r = await fetch(`${DB}/${path}.json`, { cache: 'no-store' })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

async function shard(name, i) {
  const s = await getJSON(`fresh/rows/${name}/${i}`)
  if (typeof s !== 'string') return []
  try { const a = JSON.parse(s); return Array.isArray(a) ? a : [] } catch (e) { return [] }
}

/** name: 'first' | 'live' · all: 거르는 중이면 true(묶음을 다 받음)
 *  돌려주는 것: { at, n, rows } 또는 null(아직 · 못 읽음) */
export function useFresh(name, all = false) {
  const [v, setV] = useState(null)
  const 모음 = useRef(new Map())       // 공고번호 → 줄 (한 번 보인 줄은 남깁니다)
  const 받은 = useRef({ key: null, at: 0, p: 0, upto: -1 })

  useEffect(() => {
    let alive = true
    const load = async (force) => {
      if (typeof document !== 'undefined' && document.hidden && !force) return
      try {
        const m = await getJSON(`fresh/meta/${name}`)
        if (!alive || !m || typeof m !== 'object') return
        const p = Number(m.p) || 0
        const upto = all ? p - 1 : Math.min(0, p - 1)
        /* 묶음 지문(h)이 같으면 묶음은 다시 받지 않고 «기준 시각» 만 바꿉니다 — 10분마다 at 은 바뀌어도
           내용은 그대로인 회차가 대부분이라, 열어 둔 화면이 같은 것을 거듭 받지 않게 (데이터베이스 요금) */
        const key = m.h || m.at
        if (key === 받은.current.key && upto <= 받은.current.upto) {
          if (m.at !== 받은.current.at) {
            받은.current.at = m.at
            setV((o) => (o ? { ...o, at: Number(m.at) || 0 } : o))
          }
          return
        }
        const idx = []
        for (let i = 0; i <= upto; i++) idx.push(i)
        const got = await Promise.all(idx.map((i) => shard(name, i).catch(() => null)))
        if (!alive) return
        for (const arr of got) for (const r of arr || []) if (r && r.no) 모음.current.set(String(r.no), r)
        // 한 묶음이라도 못 받았으면 지문을 적지 않습니다 — 다음 번에 다시 받게
        받은.current = got.every((a) => a !== null) ? { key, at: m.at, p, upto } : { key: null, at: m.at, p, upto: -1 }
        const rows = [...모음.current.values()].sort((a, b) =>
          String(b.dt || '').replace(/\D/g, '').localeCompare(String(a.dt || '').replace(/\D/g, '')))
        setV({ at: Number(m.at) || 0, n: Number(m.n) || 0, rows, more: Math.max(0, (Number(m.n) || 0) - rows.length) })
      } catch (e) { /* 못 읽으면 얹지 않습니다 */ }
    }
    load(true)
    const t = setInterval(() => load(false), EVERY)
    const onVis = () => { if (!document.hidden) load(false) }
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [name, all])

  return v
}

/** 목록에 이미 있는 공고는 빼고, 거르기(match)를 똑같이 적용해 «얹을 줄» 만 돌려줍니다.
 *  match 는 useBoard 에 넘기는 그 함수(색인 한 줄 → 참/거짓) — 빠른 줄에는 fast.py 가 같은 차례의 _ix 를 붙여 둡니다. */
export function freshRows(fresh, have, match) {
  if (!fresh || !fresh.rows || !fresh.rows.length) return []
  const out = []
  for (const r of fresh.rows) {
    if (have.has(String(r.no))) continue
    if (match && !(Array.isArray(r._ix) && match(r._ix, -1))) continue
    out.push(r)
  }
  return out
}

/** «10:42 기준» 처럼 — 몇 분 전인지 같이 */
export function freshWhen(at, now = Date.now()) {
  if (!at) return ''
  const d = new Date(at + 9 * 3600000)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const m = Math.max(0, Math.round((now - at) / 60000))
  return `${hh}:${mm} 기준 (${m < 2 ? '방금' : m + '분 전'})`
}
