/* ============================================================
   정적 JSON 로더

   비용 방어의 핵심이 여기 있습니다.
   - 모든 데이터는 /data/*.json 정적 파일 → Firebase 읽기 과금 0
   - 한 번 받은 파일은 메모리에 캐시 → 같은 세션에서 재요청 없음
   - 이름 첫 글자 색인(idx)으로 필요한 묶음(dat) 하나만 내려받음
   ============================================================ */

const cache = new Map()
const inflight = new Map()

export async function getJSON(path) {
  if (cache.has(path)) return cache.get(path)
  if (inflight.has(path)) return inflight.get(path)

  const p = fetch(path)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((v) => {
      cache.set(path, v)
      inflight.delete(path)
      return v
    })
  inflight.set(path, p)
  return p
}

const key = (name) => {
  const s = String(name || '').trim()
  return s ? s.codePointAt(0) : 0
}

/* ── 전체 요약 ───────────────────────── */
export const getOverview = () => getJSON('/data/overview.json')

/* ── 발주기관 ────────────────────────── */
export const getAgencyTop = () => getJSON('/data/agency/top.json')

export async function searchAgency(q) {
  const s = String(q || '').trim()
  if (s.length < 1) return []
  const idx = await getJSON(`/data/agency/idx/${key(s)}.json`)
  if (!idx) return []
  return Object.entries(idx)
    .filter(([name]) => name.includes(s))
    .sort((a, b) => b[1][0] - a[1][0])
    .slice(0, 40)
    .map(([name, [n, chunk]]) => ({ name, n, chunk }))
}

export async function getAgency(name, chunk) {
  let c = chunk
  if (c === undefined || c === null) {
    const idx = await getJSON(`/data/agency/idx/${key(name)}.json`)
    if (!idx || !idx[name]) return null
    c = idx[name][1]
  }
  const dat = await getJSON(`/data/agency/dat/${c}.json`)
  return dat ? dat[name] || null : null
}

/* ── 업체 ────────────────────────────── */
export async function searchCorp(qNorm) {
  const s = String(qNorm || '').trim()
  if (s.length < 1) return []
  const idx = await getJSON(`/data/corp/idx/${key(s)}.json`)
  if (!idx) return []
  return Object.entries(idx)
    .filter(([k2]) => k2.includes(s))
    .sort((a, b) => b[1][0] - a[1][0])
    .slice(0, 40)
    // bzn: 이 이름에 섞여 있는 «서로 다른 법인» 수 · reg: 주력 지역
    .map(([k2, [n, chunk, bzn, reg]]) => ({ key: k2, n, chunk, bzn: bzn || 0, reg: reg || '' }))
}

export async function getCorp(ckey, chunk) {
  let c = chunk
  if (c === undefined || c === null) {
    const idx = await getJSON(`/data/corp/idx/${key(ckey)}.json`)
    if (!idx || !idx[ckey]) return null
    c = idx[ckey][1]
  }
  const dat = await getJSON(`/data/corp/dat/${c}.json`)
  return dat ? dat[ckey] || null : null
}

/* ── 유사공고 키워드 ─────────────────── */
/* build_json.py 의 STOPWORDS 와 같아야 합니다.
   «입찰»·«공고» 처럼 아무 공고에나 들어가는 말은 근거가 못 됩니다. */
const KW_STOP = new Set(['공사', '용역', '설치', '사업', '시공', '및', '기타', '위한',
  '구입', '제작', '납품', '관리', '운영', '외', '년도', '정기',
  '입찰', '공고', '재공고', '긴급', '일반', '제한', '지명경쟁',
  '수의시담', '견적', '제출', '총괄분', '분리발주', '관급',
  '구매', '임차', '위탁', '본공사', '추가', '변경', '신규',
  '사업소', '지사', '본부', '관리소', '센터', '확정', '낙찰'])

export function extractKeywords(noticeName, limit = 5) {
  const words = String(noticeName || '').match(/[가-힣]{2,8}/g) || []
  const seen = new Set()
  const out = []
  for (const w of words) {
    if (KW_STOP.has(w) || seen.has(w)) continue
    seen.add(w)
    out.push(w)
    if (out.length >= limit) break
  }
  return out
}

/**
 * 공고명에서 뽑은 키워드 중 표본이 가장 많은 것을 대표로 삼아
 * 유사공고의 최다 낙찰 구간을 돌려준다.
 * → 낙찰스코어 3번 항목의 재료
 */
export async function similarZone(noticeName) {
  const kws = extractKeywords(noticeName, 5)
  if (!kws.length) return null
  const shards = await Promise.all(kws.map((w) => getJSON(`/data/kw/${key(w)}.json`)))
  let best = null
  kws.forEach((w, i) => {
    const hit = shards[i] && shards[i][w]
    if (!hit) return
    const [n, zone, avg, share] = hit
    if (!best || n > best.n) best = { word: w, n, zone, avg, share }
  })
  return best
}

/* ── 수집 데이터 (1순위 / 공고) ──────── */
// first.json / live.json 은 «최신 300건» 요약본입니다.
// 옛 Streamlit 사이트도 이 두 파일을 읽으므로 형식을 바꾸지 마세요.
export const getFirst = () => getJSON('/data/first.json')
export const getLive = () => getJSON('/data/live.json')

/* ── 7주치 목록 (묶음으로 나눠 받음) ───
   하루에 1순위 570건·공고 600건이 나옵니다. 7주면 2만~3만 건이라
   한 파일에 담으면 휴대폰에서 너무 무겁습니다.
   그래서 500건씩 나눠두고, 첫 화면은 0번 묶음만 받습니다.
   검색하거나 지역을 고를 때 나머지를 뒤에서 받아옵니다. */
export const getBoardMeta = (name) => getJSON(`/data/board/${name}.json`)
export const getBoardPart = (name, kind, i) =>
  getJSON(`/data/board/${name}-${kind}-${i}.json`)
