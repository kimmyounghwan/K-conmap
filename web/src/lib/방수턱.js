/**
 * 🧱 G435 방수턱 — 건축 잡상세도 «방수턱 상세» · «방수턱 배근» 판(그림 칸)의 치수(폭 · 높이) · 철근 글 · 쓰는 곳 글을 읽음.
 *
 *   현장 B A-701 잡상세도-4: ① 방수턱 상세(폭 150 · 높이 150) · ② 방수턱 배근(HD10 · HD10@300 · «샤워실 + 화장실 + 거실에 해당되는 부분 공통»)
 *   · ③ 방수턱(옥탑층 출입구) 상세도(치수 없음). 평면(A-111 · 201 · 401 · 031 · 047 · 101)엔 방수턱 선 · 길이가 없음.
 *   → 짐작 안 함: 놓인 곳 · 길이는 ❓ · 📌 사람이 도면을 보고 잰 길이(m)를 넣으면 콘크리트(폭 × 높이 × 길이) · 거푸집(양옆 2면)을 셈.
 *     철근(HD10 가닥 수 · HD10@300 세운 철근 길이)은 그림에 치수가 없어 ❓ 그대로.
 *
 *   판 = 같은 줄(글 높이 같은) 판 제목 사이 간격(P) — 제목 왼쪽 0.12 P ~ 오른쪽 0.88 P · 제목 위 0.95 P 까지(제목이 판 아래에 있는 꼴).
 *   폭 = 판 안 가로 숫자 치수(50 ~ 600) 가장 흔한 것 · 높이 = 세운 숫자 치수(50 ~ 1,000) 가장 흔한 것 · 같은 이름(«상세 · 배근» 뺀 이름) 판끼리 모음.
 */
const 숫 = (s) => /^\d{2,4}$/.test(String(s).replace(/,/g, '').trim()) ? +String(s).replace(/,/g, '').trim() : null
const 가로 = (a) => { const t = ((a % Math.PI) + Math.PI) % Math.PI; return t < 0.1 || t > Math.PI - 0.1 }
const 세로 = (a) => { const t = ((a % Math.PI) + Math.PI) % Math.PI; return Math.abs(t - Math.PI / 2) < 0.1 }
const 흔한 = (a) => { const m = new Map(); for (const v of a) m.set(v, (m.get(v) || 0) + 1); return [...m].sort((p, q) => q[1] - p[1] || p[0] - q[0])[0]?.[0] ?? null }
const 쉼 = (v) => Math.round(v).toLocaleString('en-US')

/**
 * 도면들: 골조읽기 도면(D.글자 {s, x, y, h, a, x0} · D.이름) · 결정: 바탕셈({키: {값: m, 때}})
 * → {물음: [{키, 이름, 파일, 폭, 높이, 철근, 곳, 셈, 값, 단위, 글}], 줄: [보강 줄]}
 */
export function 방수턱읽기(도면들, 결정 = {}) {
  const 물음 = [], 줄 = []
  for (const D of 도면들 || []) {
    const 글들 = D.글자 || []
    const 제목들 = 글들.filter((g) => /방수턱/.test(g.s) && /상세|배근|DETAIL/i.test(g.s) && g.s.trim().length <= 30)
    if (!제목들.length) continue
    const 모 = new Map()
    for (const t of 제목들) {
      const x0 = Number.isFinite(t.x0) ? t.x0 : t.x - (t.w || 0) / 2
      /* 같은 줄 판 제목들(글 높이 같음 · 숫자 아님) 사이 간격 */
      const 줄글 = 글들.filter((g) => g !== t && Math.abs(g.h - t.h) <= 0.1 * t.h && Math.abs(g.y - t.y) <= t.h && 숫(g.s) === null && g.s.trim().length >= 2)
      const 간 = 줄글.map((g) => Math.abs((Number.isFinite(g.x0) ? g.x0 : g.x) - x0)).filter((d) => d >= 10 * t.h)
      const P = 간.length ? Math.min(...간) : 40 * t.h
      const 안 = 글들.filter((g) => { const gx = Number.isFinite(g.x0) ? g.x0 : g.x; return gx >= x0 - 0.12 * P && gx <= x0 + 0.88 * P && g.y > t.y + 0.5 * t.h && g.y <= t.y + 0.95 * P })
      const 이름 = t.s.replace(/\s*(상세도?|배근도?|DETAIL)\s*/gi, '').trim() || '방수턱'
      const o = 모.get(이름) || { 이름, 제목: [], 폭: [], 높이: [], 철근: [], 곳: [] }
      o.제목.push(t.s.trim())
      for (const g of 안) {
        const v = 숫(g.s)
        if (v !== null && 가로(g.a || 0) && v >= 50 && v <= 600) o.폭.push(v)
        else if (v !== null && 세로(g.a || 0) && v >= 50 && v <= 1000) o.높이.push(v)
        else if (/^H?D\d{2}(@\d{2,4})?$/i.test(g.s.replace(/\s+/g, ''))) o.철근.push(g.s.replace(/\s+/g, '').toUpperCase())
        else if (/해당|공통|부위|적용/.test(g.s) && g.s.length <= 40) o.곳.push(g.s.trim())
      }
      모.set(이름, o)
    }
    for (const o of 모.values()) {
      const 폭 = 흔한(o.폭), 높이 = 흔한(o.높이)
      const 키 = '방수턱|' + (D.이름 || '') + '|' + o.이름
      const 철근 = [...new Set(o.철근)]
      const 곳 = [...new Set(o.곳)].join(' · ')
      const 근 = `${D.이름 || '도면'} «${[...new Set(o.제목)].join(' · ')}»`
      if (!(폭 && 높이)) {
        물음.push({ 키, 이름: o.이름, 파일: D.이름 || '', 폭: null, 높이: null, 철근, 곳, 셈: false, 값: null, 단위: null, 글: `${근} — 방수턱 폭 · 높이 치수가 그림에 없어 셈에서 뺐습니다` })
        continue
      }
      const 값 = 결정 && 결정[키] && +결정[키].값 > 0 ? +결정[키].값 : 0
      const 철글 = 철근.length ? ` · 철근 ${철근.join(' · ')}(가닥 수 · 세운 철근 길이가 그림에 없어 ❓)` : ''
      물음.push({ 키, 이름: o.이름, 파일: D.이름 || '', 폭, 높이, 철근, 곳, 셈: !!값, 값: 값 || null, 단위: 'm',
        글: `${근} — ${o.이름} ${쉼(폭)}×${쉼(높이)}${곳 ? '(' + 곳 + ')' : ''} · 놓인 곳 · 길이가 평면에 없어 ` + (값 ? `📌 사람이 잰 길이 ${값} m 로 셈(콘크리트 ${폭 / 1000} × ${높이 / 1000} × ${값} · 거푸집 양옆 ${높이 / 1000} × 2 × ${값})` : '셈에서 뺐습니다 — 길이(m)를 넣으면 셈') + 철글 })
      if (!값) continue
      const 말 = `🧱 ${o.이름} ${쉼(폭)}×${쉼(높이)} × 📌 사람이 잰 길이 ${값} m — ${근}`
      줄.push({ 동: '', 층: '', 부재: '기타-콘크리트', 산출식: `${폭 / 1000}*${높이 / 1000}*${값}`, _비고: 말 + ' · 폭 × 높이 × 길이', _방수턱: 키 })
      줄.push({ 동: '', 층: '', 부재: '기타-거푸집', 산출식: `${높이 / 1000}*2*${값}`, _비고: 말 + ' · 양옆 2면', _방수턱: 키 })
    }
  }
  return { 물음, 줄 }
}
