/* ============================================================
   정적 JSON 로더

   비용 방어의 핵심이 여기 있습니다.
   - 모든 데이터는 /data/*.json 정적 파일 → Firebase 읽기 과금 0
   - 한 번 받은 파일은 메모리에 캐시 → 같은 세션에서 재요청 없음
   - 이름 첫 글자 색인(idx)으로 필요한 묶음(dat) 하나만 내려받음
   ============================================================ */

const cache = new Map()
const inflight = new Map()

/* 배포마다 바뀌는 도장.
   ⚠️ /data 아래 **모든** 파일에 붙입니다. 일부에만 붙였다가 사고가 났습니다.
      2026-09-02: overview·bidindex 에만 붙여뒀더니, 화면 코드는 새것인데
      업체 자료(corp/)는 어제 것이 24시간 캐시로 남아 «법인 분리가 사라졌다»,
      «어제 오후 이후 갱신이 멈췄다» 로 보였습니다.
      코드와 자료는 반드시 같이 움직여야 합니다.
   전송량 걱정은 없습니다 — 사용자는 자기가 연 묶음 하나(압축 10KB)만 받습니다. */
const V = typeof __BUILD__ === 'string' ? __BUILD__ : '0'
const fresh = (p) => (p.includes('?') ? p : `${p}?v=${V}`)

export async function getJSON(path) {
  const url = path.startsWith('/data/') ? fresh(path) : path
  if (cache.has(url)) return cache.get(url)
  if (inflight.has(url)) return inflight.get(url)

  const p = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((v) => {
      cache.set(url, v)
      inflight.delete(url)
      return v
    })
  inflight.set(url, p)
  return p
}

const key = (name) => {
  const s = String(name || '').trim()
  return s ? s.codePointAt(0) : 0
}

/* ── 전체 요약 ───────────────────────── */
export const getOverview = () => getJSON('/data/overview.json')

/* 가상 시뮬레이션 — 지난 개찰에 우리 방식을 대본 결과 */
export const getSim = () => getJSON('/data/sim.json')

/* ── 발주기관 ────────────────────────── */
export const getAgencyTop = () => getJSON('/data/agency/top.json')

/* ★ 발주기관 검색 — 이름 «어디에» 들어 있어도 찾습니다 (2026-09-04)
   소장님: 「광양시라고 하면 발주기관에 안떠. 전라남도를 앞에 붙여야 되더라고」
   전에는 «검색어 첫 글자» 칸 하나만 열었습니다. 「광양」 → 「광」 칸.
   그런데 실제 이름은 「전남광주통합특별시 광양시」 라 「전」 칸에 있었습니다.
   실측: 「광양」이 든 기관 12곳 중 나오던 건 1곳, 「경주」는 35곳 중 1곳.
   → 이름 목록 한 파일(agency/names.json · 4,923곳 · gzip 42KB)을 받아 전부 뒤집니다.
     검색을 누를 때 한 번만 받고 기억합니다. 첫 화면 전송량에 안 얹습니다.
   ⚠️ 업체(57,555곳 · gzip 348KB)에는 이 방법을 쓰지 않습니다 — 너무 큽니다. */
let _agNames = null
const getAgencyNames = () =>
  _agNames || (_agNames = getJSON('/data/agency/names.json')
    .catch(() => { _agNames = null; return null }))

export async function searchAgency(q) {
  const s = String(q || '').trim()
  if (s.length < 1) return []
  const all = await getAgencyNames()
  if (!Array.isArray(all)) return searchAgencyOld(s)   // 옛 자료면 예전 방식으로
  const hit = []
  for (const [name, n, chunk] of all) {
    const i = name.indexOf(s)
    if (i < 0) continue
    // 순위: 마지막 낱말이 검색어로 시작(「… 순천시」) > 아무 낱말이나 시작 > 그냥 포함
    const words = name.split(/\s+/)
    const rank = words[words.length - 1].startsWith(s) ? 3
      : words.some((w) => w.startsWith(s)) ? 2 : 1
    hit.push({ name, n, chunk, rank })
  }
  return hit.sort((a, b) => (b.rank - a.rank) || (b.n - a.n)).slice(0, 40)
}

/* 예전 방식(첫 글자 칸) — names.json 이 아직 없는 자료에서만 씁니다 */
async function searchAgencyOld(s) {
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
/* 업체 이름 목록 — 「이름 가운데로도 찾기」를 눌렀을 때만 받습니다.
   ⚠️ 기관(4,923곳 · gzip 42KB)과 달리 업체는 57,555곳 · **gzip 348KB** 입니다(실측).
      늘 받으면 하루 1,000번 검색에 348MB — Firebase 무료 한도(360MB/일)를 혼자 씁니다.
      그래서 «버튼» 입니다. 한 번 받으면 그 브라우저에서는 기억합니다. */
let _coNames = null
const getCorpNames = () =>
  _coNames || (_coNames = getJSON('/data/corp/names.json')
    .catch(() => { _coNames = null; return null }))

/* deep=true 면 이름 가운데도 찾습니다.
   실측(2026-09-04): 「종합건설」 첫 글자 칸 9곳 → 전부 2,867곳 · 「개발」 0곳 → 2,420곳.
   앞에서부터 친 이름은 첫 글자 칸으로 충분합니다 — 「대영」 119곳 = 전부 119곳. */
export async function searchCorp(qNorm, deep = false) {
  const s = String(qNorm || '').trim()
  if (s.length < 1) return []
  const idx = await getJSON(`/data/corp/idx/${key(s)}.json`)
  const ent = idx ? Object.entries(idx).filter(([k2]) => k2.includes(s)) : []
  if (deep) {
    const all = await getCorpNames()
    if (Array.isArray(all)) {
      const seen = new Set(ent.map(([k2]) => k2))
      for (const [k2, n, chunk] of all) {
        if (!seen.has(k2) && k2.includes(s)) ent.push([k2, [n, chunk]])
      }
    }
  }
  if (!ent.length) return []
  return ent
    .sort((a, b) => b[1][0] - a[1][0])
    .slice(0, 40)
    // bzn: 이 이름에 섞여 있는 «서로 다른 법인» 수 · reg: 주력 지역
    .map(([k2, [n, chunk, bzn, reg, ceo]]) => ({
      key: k2, n, chunk, bzn: bzn || 0, reg: reg || '', ceo: ceo || '',
      // '이름#사업자번호' 는 법인 단위 기록입니다
      biz: k2.includes('#') ? k2.split('#')[1] : '',
      label: k2.split('#')[0],
    }))
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
/* 검색 색인 — «걸러내기»에 필요한 칸만 담은 가벼운 목록.
   검색·지역선택을 실제로 할 때만 받습니다 (1순위 358KB · 공고 352KB).
   전에는 검색하면 묶음을 전부 받아서 1,528KB 였습니다. */
export const getBoardIndex = (name, kind) =>
  getJSON(`/data/board/${name}-${kind}-idx.json`)

/* ── 마감 전 공고 목록(bidindex.json) — 세 화면이 같은 읽기 함수를 씁니다 ──
   ⚠️ 2026-09-03 전에는 BaroBid 가 a[8]·a[9] 처럼 «자리 번호»로 읽고, Spot 은 이름표(f)로 읽었습니다.
   칸을 하나 붙이면 한쪽만 어긋납니다. 이제 셋(바로투찰·공고 자리찾기·분석) 다 여기 하나로 읽습니다.
   collect.py 의 export_bidindex 가 "f" 에 칸 이름을 주므로, 자리 번호를 어디에도 적지 않습니다. */
let _bidIndex = null
export const getBidIndex = () =>
  _bidIndex || (_bidIndex = getJSON('/data/bidindex.json').catch(() => { _bidIndex = null; return null }))

/** {f:[...], r:[[...]]} → [{no, name, inst, base, …}] — 없는 칸은 undefined */
/* 개찰 결과 색인(최근 7일) — 채점 화면과 공고 페이지가 같은 것을 씁니다. */
export const getResults = () => getJSON('/data/bidresult.json')

export function indexRows(idx) {
  if (!idx || !Array.isArray(idx.r) || !Array.isArray(idx.f)) return []
  const f = idx.f
  return idx.r.map((a) => {
    const o = {}
    for (let i = 0; i < f.length; i++) o[f[i]] = a[i]
    if (o.llr == null || o.llr === 0) o.llr = null
    o.lic = Array.isArray(o.lic) ? o.lic : []
    return o
  })
}
