import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 판단, 신고할일, 달규칙, 달더하기, 짧은날, 달글, 한달되는날, 달, 전날, 회사규모, 사업주몫, 생일풀기, 만나이, 긴날, 취득날, 현장들셈, 다른합치기, 다른현장최대, 금액읽기 } from '../lib/ilyong4.js'
import { 공제셈 } from '../lib/gongje.js'
import { 링크만들기, 링크읽기, 기간날들 } from '../lib/ilyong4link.js'
import G from '../data/ilyong_guide.json'

/**
 * 🛡 /tools/ilyong-boheom — 일용직 4대보험 가입 판단기 (G107 · 2026-10-01)
 *   📘 /tools/ilyong-guide — 가입 기준 설명 (같은 파일 IlyongGuide · 글은 data/ilyong_guide.json 한 곳 — prerender.py 도 같은 글을 굽습니다)
 *
 * 소장님: 「만들어 주고, 연결 대상이 있으면 연결해 주고, 예시도 만들어 주고, 설명페이지도 만들어 줘 검색에 걸리게
 *          모의 계산기 보다 설명도 자세히 해줘야 하고, 기능도 더 좋게 해줘」 · 「일용노무비랑 연결할 수 있어? 가능하면 해줘」
 *
 * ■ 판단 셈은 lib/ilyong4.js 하나(노무비 계산기 · 현장 투입비도 같은 셈) · 공제 금액은 lib/gongje.js(같은 요율 · 같은 끝전)
 * ■ 저장: 이 브라우저 localStorage `kcm_ilyong1` 만 · 이름 · 주민번호 안 받음 · 인쇄 + «📗 값만 엑셀»(G109 — 셈한 값만, 수식 없음)
 * ■ 다른 화면에서 넘겨받기: sessionStorage `kcm_ilyong_from` = { 이름, 일당, 날, 달돈, 생일 } (노무비 계산기 «판단 자세히» · 설명 페이지 «이 사례로 계산»)
 * ■ 🎂 (G109) 생년월일(앞 6자리) → 옵션.생일 — 소장님 「나이를 넣게 하고, 4대 보험은 자동으로」 · 「설명은 자세히」
 *   만 60세가 된 날의 다음 날 국민연금 상실 · 만 65세부터 일한 날은 실업급여 몫 없음(«계속65» 로 되돌림) — 셈은 lib/ilyong4.js
 * ■ 👆 (G122 · 2026-10-03) 소장님 「사이트 계산기 최대한 계산하기 편하게 해줘. 이용자 입장에서」 → 고른 세 가지
 *   ① 결과를 바로 — 폰 · 좁은 화면은 아래 탭 위에 «연금 · 건강 · 고용 · 실지급» 띠(결과 카드가 안 보일 때만 · 글 넣는 중엔 숨김 · 누르면 결과로),
 *      넓은 화면(1100px~)은 달력 옆에 같은 요약(따라 내려옴). 결과 칩은 «뗍니다 / 안 뗍니다 / 가입 · 보험료 없음».
 *   ② 날짜를 빨리 — «기간» 으로 바꾸면 첫날 · 끝날 두 번 눌러 사이를 채움(일요일 빼고 · 평일만 · 매일 · 되돌리기), 달마다 «평일만» 단추,
 *      처음 여는 사람은 달력이 지난달부터(지난달 일을 따지는 경우가 많아서).
 *   ③ 결과 링크 — 넣은 것을 그대로 여는 주소(?c= · lib/ilyong4link.js · 이름 · 생년월일은 안 담음). 폰은 공유 창, PC 는 복사.
 *      받은 쪽은 링크 것으로 채우고(내가 적어 둔 것은 «되돌리기»), 같은 창에서 새로고침해도 다시 덮지 않음(sessionStorage).
 * ■ 🏗 (G125 · 2026-10-03) 소장님 「수정해서 고쳐줘 사이트」 — 카페 질문(A·B·C·D·E 현장)에서 연금 취득일이 «8월 중» 으로만 나옴
 *   ① 다른 현장도 날짜로 — «다른 현장» 칸에 현장마다 달력(5곳까지 · 일당 비우면 이 현장 일당) → 회사 첫 근로일 · 연금 취득일이 그 날로
 *   ② 여러 현장 한 번에 — 결과에 «🏗 현장마다» 표(건강보험은 현장마다 따로 판단 · 국민연금은 회사 합산) · 그 현장 혼자 현장 가입인 달은 저절로 «가입»
 *   날짜를 모르면 예전처럼 달마다 일수 · 받은 돈(둘은 더해짐) · 링크에 날짜 · 일당 담음(현장 이름은 안 담음) · 셈은 lib/ilyong4.js 현장들셈 · 다른합치기
 */

const 열쇠 = 'kcm_ilyong1'
export const 넘김열쇠 = 'kcm_ilyong_from'
const 두자 = (n) => String(n).padStart(2, '0')
const 원 = (n) => Math.round(n || 0).toLocaleString('ko-KR')
const 숫자만 = (s) => String(s || '').replace(/[^\d]/g, '')
const 이번달 = () => { const t = new Date(); return `${t.getFullYear()}-${두자(t.getMonth() + 1)}` }
const 지난달 = () => { const t = new Date(); t.setDate(1); t.setMonth(t.getMonth() - 1); return `${t.getFullYear()}-${두자(t.getMonth() + 1)}` }
const 쓴링크열쇠 = 'kcm_ilyong_link'
const 달날수 = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
const 첫요일 = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1).getDay()
export function 굵게(s) { return String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x)) }

const 빈것 = () => ({ 일당: '', 시작: 지난달(), 달수: 3, 날: [], 달돈: {}, 다른: {}, 현장들: [], 옵션: {}, 이름: '' })
function 읽기() {
  try {
    const s = JSON.parse(localStorage.getItem(열쇠) || 'null')
    if (s && Array.isArray(s.날)) return { ...빈것(), ...s }
  } catch (e) { /* 막힌 브라우저 */ }
  return 빈것()
}
function 쓰기(s) { try { localStorage.setItem(열쇠, JSON.stringify(s)); return true } catch (e) { return false } }

/** 사례(설명 페이지 · 넘겨받은 출역) → 화면 상태 */
export function 상태로(c) {
  const 날 = [...(c.날 || [])].sort()
  const 시작 = 날.length ? 날[0].slice(0, 7) : 이번달()
  const 끝 = 날.length ? 날[날.length - 1].slice(0, 7) : 시작
  let 달수 = 1
  for (let m = 시작; m < 끝; m = 달더하기(m, 1)) 달수++
  const 일당 = Number(c.일당) || 0
  const 달돈 = {}
  for (const [ym, v] of Object.entries(c.달돈 || {})) {
    const n = 날.filter((d) => d.startsWith(ym)).length
    if (!일당 || Number(v) !== 일당 * n) 달돈[ym] = Number(v) || 0
  }
  /* 마지막 근로 달 다음 달까지 보여 줍니다(상실일이 그 달 1일인 경우가 많아서) */
  const 옵션 = { ...(c.옵션 || {}) }
  if (c.생일) 옵션.생일 = c.생일
  return { ...빈것(), 일당: 일당 || '', 시작, 달수: Math.min(12, Math.max(2, 달수 + 1)), 날, 달돈, 다른: c.다른 || {}, 옵션, 이름: c.이름 || '' }
}

/** 🏗 현장마다 표 — 건강보험 칸 · 국민연금 칸 글(G125) */
const 건강칸 = (r) => (r && r.건강.구간.length ? r.건강.구간.map((g) => `${짧은날(g.취득)} 취득${g.상실 ? ` ~ ${짧은날(g.상실)} 상실` : ''}`).join(' · ') : '가입 안 됨')
const 연금칸 = (r, 이현장) => {
  const 달들 = (근거) => Object.entries((r && r.연금.달) || {}).filter(([, x]) => x && x.된다 && x.근거 === 근거).map(([ym]) => ym).sort()
  const 현 = 달들('현장'), 합 = 이현장 ? 달들('회사 합산') : []
  const 글 = [현.length ? `현장 가입(${현.map(달글).join(' · ')})` : '', 합.length ? `회사 합산(${합.map(달글).join(' · ')})` : ''].filter(Boolean)
  return 글.length ? 글.join(' · ') : 이현장 ? '가입 안 됨' : '현장 가입 아님 → 회사 합산에 셈'
}

/** 화면 상태 → 판단 입력(그 달 받은 돈: 적은 값이 있으면 그 값, 없으면 일당 × 일수)
 *   현장: 현장들셈 결과 — 그 달 다른 현장 날(이 현장과 겹친 날은 한 번만) · 돈을 «다른» 에 더하고,
 *   그 현장 혼자 8일(220만) 이상으로 «현장 가입» 인 달은 가입 체크와 같게 봅니다(현장 우선 · 실무안내 22쪽) */
function 입력만들기(st, 현장 = []) {
  const 일 = {}
  for (const d of st.날) 일[d.slice(0, 7)] = (일[d.slice(0, 7)] || 0) + 1
  const 달돈 = {}
  for (const ym of Object.keys(일)) {
    const 적음 = st.달돈[ym]
    달돈[ym] = 적음 !== undefined && 적음 !== '' ? Number(적음) || 0 : (Number(st.일당) || 0) * 일[ym]
  }
  const 다른 = {}
  for (const [ym, o] of Object.entries(st.다른 || {})) if (o && (Number(o.일) || Number(o.돈) || o.가입)) 다른[ym] = { 일: Number(o.일) || 0, 돈: Number(o.돈) || 0, 가입: !!o.가입 }
  return { 날: st.날, 달돈, 다른: 다른합치기(다른, 현장, st.날), 일 }
}

export default function Ilyong4() {
  const [st, setSt] = useState(() => 읽기())
  const [저장됨, set저장됨] = useState(true)
  const [알림, set알림] = useState('')
  const [지움물음, set지움물음] = useState(false)
  const [되돌릴, set되돌릴] = useState(null)       // 링크 · 예시로 덮기 전 내가 적어 둔 것(G122)
  const [누르기, set누르기] = useState('one')      // 'one' 하루씩 · 'range' 기간(첫날 → 끝날)
  const [기간꼴, set기간꼴] = useState('sun')      // 'sun' 일요일 빼고 · 'wk' 평일만 · 'all' 매일
  const [기간첫, set기간첫] = useState(null)
  const [기간한것, set기간한것] = useState(null)   // { 전: 날[], 글 } — 되돌리기
  const [링크, set링크] = useState(null)           // { url, 복사 }
  const [결과보임, set결과보임] = useState(false)
  const [입력중, set입력중] = useState(false)
  const [바닥, set바닥] = useState(12)
  const 결과칸 = useRef(null)
  useEffect(() => {
    /* 🔗 G122 받은 링크(?c=) — 같은 창에서 이미 채운 링크면 다시 덮지 않음(새로고침 · 뒤로가기) */
    try {
      const c = new URLSearchParams(window.location.search).get('c')
      if (c !== null) {
        let 쓴 = ''
        try { 쓴 = sessionStorage.getItem(쓴링크열쇠) || '' } catch (e) { /* 막힘 */ }
        if (쓴 !== c) {
          const r = 링크읽기(c)
          try { sessionStorage.setItem(쓴링크열쇠, c) } catch (e) { /* 막힘 */ }
          if (r) {
            const 전 = 읽기()
            if (전.날.length) set되돌릴(전)
            setSt({ ...빈것(), ...r })
            set알림('🔗 받은 링크의 날짜 · 금액으로 채웠습니다. 이름 · 생년월일은 링크에 담기지 않습니다.')
          } else set알림('🔗 링크를 읽지 못했습니다 — 주소가 잘렸을 수 있습니다. 적어 두신 것은 그대로입니다.')
          return
        }
      }
    } catch (e) { /* 주소 읽기 실패 — 그냥 지나감 */ }
    try {
      const raw = sessionStorage.getItem(넘김열쇠)
      if (raw) {
        sessionStorage.removeItem(넘김열쇠)
        const c = JSON.parse(raw)
        const 전 = 읽기()
        if (전.날.length) set되돌릴(전)
        setSt(상태로(c))
        set알림(c.이름 ? `${c.이름} 님 출역을 노무비 계산기에서 가져왔습니다.` : (c.글 || '사례를 채웠습니다.'))
      }
    } catch (e) { /* 넘겨받기 없음 */ }
  }, [])
  useEffect(() => { set저장됨(쓰기(st)); set링크(null) }, [st])
  /* 👆 G127 (2026-10-04) 소장님 「2달이 왜 고정이지?」 → 「클로드가 판단해」 — 날짜를 마지막으로 보이는 달에 찍으면
   *   다음 달을 저절로 하나 더 보여 줍니다(상실일 · 보험료 달이 다음 달 1일에 걸리는 일이 많아서). 날이 바뀔 때만 보므로 «－ 달» 로 줄인 것은 그대로 둡니다. */
  const 앞날 = useRef(st.날)
  useEffect(() => {
    if (앞날.current === st.날) return
    앞날.current = st.날
    if (!st.날.length) return
    const 끝달 = st.날[st.날.length - 1].slice(0, 7)
    if (끝달 < 달더하기(st.시작, st.달수 - 1)) return
    let n = 1
    for (let m = st.시작; m < 끝달 && n < 13; m = 달더하기(m, 1)) n++
    const 새 = Math.min(12, n + 1)
    if (새 > st.달수) setSt((s) => ({ ...s, 달수: Math.max(s.달수, 새) }))
  }, [st.날])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 👆 G122 결과 띠 — 결과 카드가 화면에 들어오면 숨김 · 아래 탭 높이만큼 띄움 */
  useEffect(() => {
    const el = 결과칸.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => set결과보임(e.isIntersecting), { rootMargin: '0px 0px -90px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const 잼 = () => {
      const tb = document.querySelector('.tabbar')
      const h = tb && getComputedStyle(tb).display !== 'none' ? tb.getBoundingClientRect().height : 0
      set바닥(h ? Math.round(h) + 8 : 12)
    }
    잼()
    window.addEventListener('resize', 잼)
    return () => window.removeEventListener('resize', 잼)
  }, [])
  const 글칸 = (t) => t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName) && t.type !== 'checkbox'
  useEffect(() => {
    const 끝 = () => document.body.classList.remove('iy-print')
    window.addEventListener('afterprint', 끝)
    return () => { window.removeEventListener('afterprint', 끝); 끝() }
  }, [])
  const 바꿈 = (f) => setSt((s) => f(s))
  const 옵션 = st.옵션 || {}
  const 켜진특별 = ['계약', '연금취득달', '연금제외', '고용65', '계속65', '하도급'].filter((k) => 옵션[k]).length
  const [특별열림] = useState(() => { try { const o = (JSON.parse(localStorage.getItem(열쇠) || 'null') || {}).옵션 || {}; return ['계약', '연금취득달', '연금제외', '고용65', '계속65', '하도급'].some((k) => o[k]) } catch (e) { return false } })
  const 현장 = useMemo(() => 현장들셈(st, 옵션), [st.현장들, st.일당, 옵션.생일, 옵션.연금제외])   // eslint-disable-line react-hooks/exhaustive-deps
  const 입력 = useMemo(() => 입력만들기(st, 현장), [st, 현장])
  const R = useMemo(() => 판단({ 날: 입력.날, 달돈: 입력.달돈, 다른: 입력.다른 }, 옵션), [입력, 옵션])
  const 신고 = useMemo(() => 신고할일(R, 옵션), [R, 옵션])
  const 달들 = useMemo(() => { const out = []; for (let i = 0; i < st.달수; i++) out.push(달더하기(st.시작, i)); return out }, [st.시작, st.달수])
  const 일한달들 = Object.keys(입력.일).sort()

  /* 달마다 공제 — 노무비 계산기와 같은 셈(gongje.js) · 연금 · 건강은 위 판단 결과로 */
  const 공제 = useMemo(() => 일한달들.map((ym) => {
    const n = 입력.일[ym], 돈 = 입력.달돈[ym]
    /* 🐞 G127 — 받은 돈 0원인 달은 셈하지 않음(연금 하한 41만으로 셈해 «실지급 -19,470» 이 나오던 것) */
    if (!(Number(돈) > 0)) return { ym, n, 돈: 0, it: 0, lt: 0, ei: 0, np: 0, hi: 0, lc: 0, 합: 0, 빈: true }
    const 하루 = n ? Math.floor(돈 / n) : 0
    const 날돈 = Array.from({ length: n }, (_, i) => 하루 + (i === 0 ? 돈 - 하루 * n : 0))
    const r = 공제셈(ym, 날돈, 옵션.고용65 ? 'E' : '', {}, 달규칙(R, ym))
    return { ym, n, 돈, ...r, 합: r.it + r.lt + r.ei + r.np + r.hi + r.lc }
  }), [일한달들.join(','), 입력, R, 옵션.고용65])   // eslint-disable-line react-hooks/exhaustive-deps

  const 꼴글 = { sun: '일요일 빼고', wk: '평일만', all: '매일' }
  const 날누름 = (ds) => {
    if (누르기 === 'range') {
      /* 📌 G122 기간 — 첫날 누르고 끝날 누르면 사이를 채움(이미 누른 날은 그대로 둠) */
      if (!기간첫) { set기간첫(ds); set기간한것(null); return }
      const 더 = 기간날들(기간첫, ds, 기간꼴)
      const [a, b] = 기간첫 <= ds ? [기간첫, ds] : [ds, 기간첫]
      const 새것 = 더.filter((d) => !st.날.includes(d)).length
      set기간한것({ 전: st.날, 글: `${짧은날(a)} ~ ${짧은날(b)} · ${꼴글[기간꼴]} ${더.length}일${새것 !== 더.length ? `(새로 ${새것}일)` : ''} 채웠습니다.` })
      set기간첫(null)
      바꿈((s) => ({ ...s, 날: [...new Set([...s.날, ...더])].sort() }))
      return
    }
    바꿈((s) => ({ ...s, 날: s.날.includes(ds) ? s.날.filter((d) => d !== ds) : [...s.날, ds].sort() }))
  }
  const 달채움 = (ym, 꼴) => 바꿈((s) => {
    const 남 = s.날.filter((d) => !d.startsWith(ym))
    if (!꼴) return { ...s, 날: 남 }
    return { ...s, 날: [...남, ...기간날들(`${ym}-01`, `${ym}-${두자(달날수(ym))}`, 꼴)].sort() }
  })
  const 누르기바꿈 = (m) => { set누르기(m); set기간첫(null); set기간한것(null) }
  const 사례 = (c) => { if (st.날.length && !되돌릴) set되돌릴(st); setSt(상태로({ ...c.in, 일당: c.in.일당 })); set알림(`예시 «${c.t}» 를 채웠습니다 — ${c.q}`); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const 결과로 = () => { const el = 결과칸.current; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  /* 🖨 인쇄 — 접어 둔 것을 모두 펴서 찍고(사업주 몫은 연 때만 · data-print="as-is") 끝나면 되돌림 */
  const 인쇄 = () => {
    const ds = [...document.querySelectorAll('.iy-out details')].filter((d) => d.dataset.print !== 'as-is')
    const 전 = ds.map((d) => d.open)
    ds.forEach((d) => { d.open = true })
    const 되돌림 = () => { ds.forEach((d, i) => { d.open = 전[i] }); window.removeEventListener('afterprint', 되돌림) }
    window.addEventListener('afterprint', 되돌림)
    document.body.classList.add('iy-print'); setTimeout(() => window.print(), 80)
  }
  /* 📗 G109 값만 엑셀 — 소장님 「엑셀로 값만 주는 걸로 하자. 프로그램 원칙으로 하고」(판단 · 셈은 이 화면, 엑셀은 보관용 값) */
  const 엑셀받기 = async () => {
    const { 값엑셀받기, 수칸, 굵은칸 } = await import('../lib/값엑셀.js')
    const 구간줄 = (이름, X, 아님) => (X.구간.length ? X.구간.map((g, i) => [i ? '' : 이름, '가입 대상', 취득날(g), 짧은날(g.상실), Object.keys(X.부과).sort().map(달글).join(' · '), `${g.취득글 || ''}${g.상실글 ? ' / 상실: ' + g.상실글 : ''}${g.근거 === '회사 합산' ? ' (회사 합산)' : ''}`]) : [[이름, '대상 아님', '', '', '', 아님]])
    const 결과 = [...구간줄('국민연금', P, 아님P), ...구간줄('건강보험 · 장기요양', H, 아님H),
      ['고용보험', 일한달들.length ? '일한 달마다' : '—', '', '', 일한달들.map(달글).join(' · '), 옵션.고용65 || 실업없음 ? '65세 이후 새로 고용 — 실업급여 몫 없음 · 근로내용 확인신고는 그대로' : 실업일부 && R.나이 ? `${긴날(R.나이.L65)}부터 만 65세 — 그 뒤 일한 날은 실업급여 몫 없음` : '근로내용 확인신고 · 근로자 0.9% (2026)'],
      ...(R.나이 ? [['나이', `만 ${R.나이.처음 === R.나이.끝 ? R.나이.처음 : `${R.나이.처음}→${R.나이.끝}`}세`, '', '', '', `만 60세가 된 날 ${긴날(전날(R.나이.L60))} → 다음 날 국민연금 상실 · 만 65세 ${긴날(R.나이.L65)} 부터 실업급여 몫 없음`]] : []),
      ['산재보험', '사업주 부담', '', '', '', '근로자에게서 떼지 않음']]
    const 띠 = R.달들.map((ym) => { const 가 = (X) => (X.부과[ym] ? '보험료' : X.구간.some((g) => 달(g.취득) <= ym && ym <= 달(전날(g.상실))) ? '가입' : ''); return [달글(ym), 입력.일[ym] || 0, 수칸(입력.달돈[ym] || 0), 가(P), 가(H), 입력.일[ym] ? '신고 · 공제' : ''] })
    const 근 = 공제.map((r) => [달글(r.ym), r.n, 수칸(r.돈), 수칸(r.it), 수칸(r.lt), 수칸(r.ei), 수칸(r.np), 수칸(r.hi), 수칸(r.lc), 수칸(r.합), 수칸(r.돈 - r.합)])
    근.push([굵은칸('합계'), R.날들.length, 수칸(합계.돈), 수칸(합계.it), 수칸(합계.lt), 수칸(합계.ei), 수칸(합계.np), 수칸(합계.hi), 수칸(합계.lc), 수칸(합계.합), 수칸(합계.돈 - 합계.합)])
    const 시트 = [
      { name: '판단 결과', head: ['보험', '판단', '취득일', '상실일', '보험료 나오는 달', '까닭'], rows: 결과, widths: [18, 12, 9, 9, 22, 70] },
      { name: '달마다', head: ['달', '일한 날', '받은 돈', '국민연금', '건강보험', '고용보험'], rows: 띠, widths: [8, 8, 14, 10, 10, 12] },
      { name: '근로자 공제', head: ['달', '일한 날', '받은 돈', '소득세', '지방소득세', '고용', '국민연금', '건강', '장기요양', '공제 합', '실지급'], rows: 근, widths: [8, 8, 13, 10, 10, 10, 10, 10, 10, 11, 13] },
    ]
    if (옵션.사업주) {
      const 사 = 사업주.map((r) => [달글(r.ym), 수칸(r.돈), 수칸(r.np), 수칸(r.hi), 수칸(r.lc), 수칸(r.ei), 수칸(r.ia), 수칸(r.합), 수칸(r.근4), 수칸(r.합 + r.근4)])
      사.push([굵은칸('합계'), 수칸(사합.돈), 수칸(사합.np), 수칸(사합.hi), 수칸(사합.lc), 수칸(사합.ei), 수칸(사합.ia), 수칸(사합.합), 수칸(사합.근4), 수칸(사합.합 + 사합.근4)])
      시트.push({ name: '사업주 몫', head: ['달', '받은 돈', '국민연금', '건강', '장기요양', '고용', '산재(참고)', '사업주 합', '근로자 몫(보험)', '보험료 총액'], rows: 사, widths: [8, 13, 10, 10, 10, 10, 11, 12, 13, 13] })
    }
    시트.push({ name: '판단 과정', head: ['보험', '이렇게 셌습니다'], rows: [...H.과정.map((x, i) => [i ? '' : '건강보험', x]), ...P.과정.map((x, i) => [i ? '' : '국민연금', x]), ...R.고용.과정.map((x, i) => [i ? '' : '고용보험', x])], widths: [12, 100] })
    시트.push({ name: '신고할 일', head: ['보험', '무엇을', '언제까지', '근거'], rows: 신고.map((x) => [x.보험, x.무엇, x.기한, x.근거]), widths: [12, 50, 40, 34] })
    값엑셀받기(['4대보험판단', st.이름, R.날들.length ? R.날들[0].slice(0, 7) : ''].filter(Boolean).join('_'), 시트, { 주소: '/tools/ilyong-boheom' })
  }

  const H = R.건강, P = R.연금
  const 부과달 = (o) => Object.keys(o).sort()
  const 첫 = R.묶음[0]
  const 아님H = !R.날들.length ? '일한 날을 누르면 나옵니다.' : 첫 && !첫.한달이상 ? `1개월 미만 — 첫 근로일 ${짧은날(첫.시작)} 부터 1개월 되는 날 ${짧은날(첫.E)} 까지 일하지 않았습니다.` : `첫 근로일부터 1개월(Ⓐ) ${첫 ? 첫.A일 : 0}일 · 그 뒤 달마다 8일 미만입니다.`
  const 나 = R.나이
  const 아님P = 옵션.연금제외 ? '나이 등으로 뺐습니다.' : !R.날들.length ? '일한 날을 누르면 나옵니다.'
    : 나 && 나.L60 <= R.날들[0] ? `만 60세 이상입니다(${긴날(전날(나.L60))}에 60세) — 국민연금은 18세 이상 60세 미만만 사업장가입자입니다.`
      : Object.values(R.연금.달 || {}).some((x) => x && x.다른가입) ? '그 달은 다른 현장에서 현장 가입이라 합치지 않습니다(현장 우선 · 공단 실무안내 22쪽) — 이 현장 근로분은 국민연금 신고 · 공제 없음.'
        : 첫 && !(첫.연한달 ?? 첫.한달이상) ? `1개월 미만입니다 — 국민연금은 근로 시작한 달 말일(${짧은날(첫.E연 || 첫.E)})까지 일해야 1개월입니다(2025.7.1~).` : '달마다 8일 · 220만원 미만입니다.'
  const 생글 = 옵션.생일 ? 생일풀기(옵션.생일) : ''
  /* 🐞 G127 — 받은 돈이 0원(일당을 안 넣음)인 달을 «65세 이후라 실업급여 몫 0» 으로 잘못 읽던 것: 돈이 있는 달만 보고, 돈이 없으면 나이로 */
  const 돈달 = 일한달들.filter((ym) => (Number(입력.달돈[ym]) || 0) > 0)
  const 나이로실업없음 = !!(나 && 나.L65 && !옵션.계속65 && R.날들.length && R.날들[0] >= 나.L65)
  const 실업없음 = 나이로실업없음 || (돈달.length > 0 && 돈달.every((ym) => !R.고용.실업[ym]))
  const 실업일부 = !실업없음 && 돈달.some((ym) => R.고용.실업[ym] !== 입력.달돈[ym])
  /* 🏢 사업주 몫 (G108) — 연금 · 건강 · 요양은 근로자와 같은 금액, 고용은 실업급여 0.9% + 고용안정(회사 규모), 산재는 참고 */
  const 사업주 = 공제.map((r) => ({ ym: r.ym, 돈: r.돈, 근4: r.ei + r.np + r.hi + r.lc, ...사업주몫(r.ym, r.돈, r, { 규모: 옵션.규모, 고용65: 옵션.고용65, 산재: 옵션.산재, 실업보수: R.고용.실업[r.ym] }) }))
  const 사합 = 사업주.reduce((t, r) => ({ 돈: t.돈 + r.돈, np: t.np + r.np, hi: t.hi + r.hi, lc: t.lc + r.lc, ei: t.ei + r.ei, ia: t.ia + r.ia, 합: t.합 + r.합, 근4: t.근4 + r.근4 }), { 돈: 0, np: 0, hi: 0, lc: 0, ei: 0, ia: 0, 합: 0, 근4: 0 })
  const 옵션바꿈 = (k, v) => 바꿈((s) => ({ ...s, 옵션: { ...(s.옵션 || {}), [k]: v } }))
  const 합계 = 공제.reduce((s, r) => ({ 돈: s.돈 + r.돈, 합: s.합 + r.합, it: s.it + r.it, lt: s.lt + r.lt, ei: s.ei + r.ei, np: s.np + r.np, hi: s.hi + r.hi, lc: s.lc + r.lc }), { 돈: 0, 합: 0, it: 0, lt: 0, ei: 0, np: 0, hi: 0, lc: 0 })

  /* 📂 G111 간편하게 — 소장님(폰 화면) 「너무 어렵게 된거 아닌가? 그리고 너무 산만해」 · 「간편하게 해주고 설명은 접기로」
   *   위: 제목 + 한 줄 · 예시는 접기 / 입력: 일당 · 생년월일 · 달력만(드문 체크는 «특별한 경우» 접기)
   *   결과: 결론 세 줄 · 이번에 떼는 돈(달마다 한 줄) · 할 일 몇 줄 → 표 · 판단 과정 · 신고 전부 · 사업주 몫 · 알아 둘 것은 접기
   *   셈은 그대로(lib/ilyong4.js) — 보이는 차례만 바꿈. 인쇄할 때는 접은 것을 모두 펴서 찍고(사업주 몫은 연 때만) 끝나면 되돌림. */
  const 결론 = (X, 아님글) => {
    if (!X.구간.length) return { 됨: false, 글: 아님글 }
    const 구 = X.구간.map((g) => `${취득날(g)} 취득 → ${짧은날(g.상실)} 상실${g.근거 === '회사 합산' ? '(회사 합산)' : ''}`).join(' · ')
    const 낼달 = 부과달(X.부과)
    return { 됨: true, 글: `${구} · 보험료 ${낼달.length ? 낼달.map(달글).join(' · ') + '분' : '없음'}` }
  }
  const 고용글 = 옵션.고용65 || 실업없음 ? '65세 이후 새로 고용 — 신고만(근로자 몫 없음)'
    : 실업일부 && 나 ? `${긴날(나.L65)}부터 만 65세 — 그 뒤 일한 날은 근로자 몫 없음` : '근로내용 확인신고 · 근로자 0.9%'
  const 할일 = 신고.filter((x) => x.날 !== '9999')

  /* 👆 G122 한눈 요약 — 결과 띠(폰) · 달력 옆(넓은 화면) · 링크 글이 같은 말을 씀
   *   y 뗍니다(보험료 나오는 달이 있음) · g 가입 · 보험료 없음(취득한 달만 등) · n 안 뗍니다 */
  const 뗌 = (X) => (X.구간.length ? (Object.keys(X.부과).length ? 'y' : 'g') : 'n')
  const 뗌글 = { y: '뗍니다', g: '가입 · 보험료 없음', n: '안 뗍니다' }
  const 짧은뗌 = { y: '뗌', g: '가입만', n: '안 뗌' }
  const 요약 = (() => {
    if (!R.날들.length) return null
    const p = 뗌(P), h = 뗌(H), e = 실업없음 || 옵션.고용65 ? 'g' : 'y'
    const 하나 = 공제.length === 1 ? 공제[0] : null
    const 돈 = 하나 ? { 이름: `${달글(하나.ym)} ${하나.n}일`, 받음: 하나.돈, 공제: 하나.합 } : { 이름: `${공제.length}달 ${R.날들.length}일`, 받음: 합계.돈, 공제: 합계.합 }
    return { p, h, e, 돈, 고용말: e === 'y' ? '뗌' : '신고만', 돈없음: !(합계.돈 > 0) }
  })()
  const 링크보내기 = async () => {
    if (!요약) return
    const url = `${window.location.origin}/tools/ilyong-boheom?c=${링크만들기(st)}`
    const 글 = `일용직 4대보험 판단 — 국민연금 ${짧은뗌[요약.p]} · 건강보험 ${짧은뗌[요약.h]} · 고용보험 ${요약.고용말} (${요약.돈.이름}${요약.돈없음 ? '' : ` · ${원(요약.돈.받음)}원`})`
    let 폰 = false
    try { 폰 = window.matchMedia('(pointer: coarse)').matches } catch (e) { /* 모름 */ }
    if (폰 && navigator.share) {
      try { await navigator.share({ title: 'K-건설맵 · 일용직 4대보험 판단', text: 글, url }); return } catch (e) { if (e && e.name === 'AbortError') return }
    }
    try { await navigator.clipboard.writeText(url); set링크({ url, 복사: true }) } catch (e) { set링크({ url, 복사: false }) }
  }

  return (
    <div className={'wrap iy' + (요약 ? ' iy-has-bar' : '')} onFocusCapture={(e) => { if (글칸(e.target)) set입력중(true) }} onBlurCapture={(e) => { if (글칸(e.target)) set입력중(false) }}>
      <div className="card iy-in">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🛡 일용직 4대보험 가입 판단기</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          일한 날만 누르면 <b>국민연금 · 건강보험 · 고용보험을 떼는지, 얼마 떼는지</b> 바로 나옵니다. 여러 날은 <b>«기간»</b> 으로 첫날 · 끝날만 누르면 됩니다.
        </p>
        <div className="iy-small">회원가입 없음 · 무료 · 💾 이 브라우저에만 저장{저장됨 ? '' : <b className="nm-warn"> — 지금 저장이 막혀 있습니다</b>} · 공단 실무안내 사례와 같게 나옴</div>
        <details className="iy-exd">
          <summary>👀 예시로 해 보기 ({G.cases.length}가지)</summary>
          <div className="iy-ex">
            {G.cases.map((c) => <button key={c.id} type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 사례(c)}>{c.t}</button>)}
          </div>
        </details>
        <div className="iy-links">
          <Link to="/tools/ilyong-guide">📘 가입 기준 설명</Link>
          <Link to="/tools/nomubi">👷 여러 명은 노무비 계산기</Link>
          {!지움물음 && st.날.length > 0 && <button type="button" className="tp-x" onClick={() => set지움물음(true)}>처음부터</button>}
          {지움물음 && <span className="nm-ask">적은 것을 지웁니다.
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setSt({ ...빈것(), 시작: st.시작 }); set지움물음(false); set알림(''); set되돌릴(null); set기간한것(null); set기간첫(null) }}>지우기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set지움물음(false)}>그대로</button></span>}
        </div>
        {알림 && <div className="note sm" style={{ marginTop: 8 }} role="status">{알림}
          {되돌릴 && <> <button type="button" className="tp-x iy-undo" onClick={() => { setSt(되돌릴); set되돌릴(null); set알림('적어 두셨던 것으로 되돌렸습니다.') }}>↩ 내가 적어 둔 것으로 되돌리기</button></>}
        </div>}
      </div>

      <div className="card iy-in">
        <div className="detail-h" style={{ margin: 0 }}>📅 일한 날 <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>— 날짜를 누르세요 (반나절도 하루)</span></div>
        <div className="iy-top">
          <label>일당(원)<input className="inp" inputMode="numeric" value={st.일당 ? 원(st.일당) : ''} onChange={(e) => 바꿈((s) => ({ ...s, 일당: 금액읽기(e.target.value) }))} placeholder="예: 200,000" /></label>
          <label className="iy-birth">생년월일 <small className="muted">(앞 6자리 · 선택)</small>
            <input className="inp" inputMode="numeric" maxLength={10} value={옵션.생일 || ''} onChange={(e) => 옵션바꿈('생일', e.target.value.replace(/[^\d.\-/ ]/g, ''))} placeholder="예: 610315" aria-label="생년월일" />
            {옵션.생일 && !생글 && <small className="nm-age bad">날짜 확인 (예: 610315)</small>}
            {생글 && <small className={'nm-age' + (나 && (나.L60 <= (R.날들[R.날들.length - 1] || '') || 나.L65 <= (R.날들[R.날들.length - 1] || '')) ? ' on' : '')}>
              {R.날들.length && 나 ? `일한 동안 만 ${나.처음 === 나.끝 ? 나.처음 : `${나.처음}→${나.끝}`}세` : `오늘 만 ${만나이(생글, new Date().toISOString().slice(0, 10))}세`}
            </small>}
          </label>
          <div className="iy-nav">
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((s) => ({ ...s, 시작: 달더하기(s.시작, -1) }))} aria-label="앞 달 보기">◀</button>
            <b>{달글(st.시작)}{st.시작.slice(0, 4) !== String(new Date().getFullYear()) ? ` (${st.시작.slice(0, 4)})` : ''} 부터 {st.달수}달</b>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 바꿈((s) => ({ ...s, 시작: 달더하기(s.시작, 1) }))} aria-label="뒤 달 보기">▶</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={st.달수 <= 1} onClick={() => 바꿈((s) => ({ ...s, 달수: s.달수 - 1 }))}>－ 달</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={st.달수 >= 12} onClick={() => 바꿈((s) => ({ ...s, 달수: s.달수 + 1 }))}>＋ 달</button>
          </div>
        </div>
        <div className="iy-pick" role="group" aria-label="날짜 누르는 방식">
          <span className="iy-pick-k">누르기</span>
          <span className="iy-seg">
            <button type="button" className={누르기 === 'one' ? 'on' : ''} aria-pressed={누르기 === 'one'} onClick={() => 누르기바꿈('one')}>하루씩</button>
            <button type="button" className={누르기 === 'range' ? 'on' : ''} aria-pressed={누르기 === 'range'} onClick={() => 누르기바꿈('range')}>📌 기간 (첫날 → 끝날)</button>
          </span>
          {누르기 === 'range' && <span className="iy-seg">
            {['sun', 'wk', 'all'].map((k) => <button key={k} type="button" className={기간꼴 === k ? 'on' : ''} aria-pressed={기간꼴 === k} onClick={() => set기간꼴(k)}>{꼴글[k]}</button>)}
          </span>}
        </div>
        {누르기 === 'range' && <div className="iy-pick-h" role="status">
          {기간첫 ? <><b>끝날</b>을 누르세요 — 첫날 {짧은날(기간첫)} <button type="button" className="tp-x" onClick={() => set기간첫(null)}>취소</button></>
            : 기간한것 ? <>✅ {기간한것.글} <button type="button" className="tp-x" onClick={() => { const 전 = 기간한것.전; 바꿈((s) => ({ ...s, 날: 전 })); set기간한것(null) }}>↩ 되돌리기</button> <span className="muted">· 다른 기간은 또 첫날부터 · 하루만 고치려면 «하루씩»</span></>
              : <><b>첫날</b>을 누르고 <b>끝날</b>을 누르면 사이가 {꼴글[기간꼴]} 채워집니다(달을 넘어도 됩니다).</>}
        </div>}
        <div className="iy-calrow">
        <div className="iy-cals">
          {달들.map((ym) => {
            const n = 입력.일[ym] || 0
            const 비움 = 첫요일(ym)
            const 수 = 달날수(ym)
            return (
              <div key={ym} className="iy-cal">
                <div className="iy-cal-h"><b>{ym.slice(0, 4)}. {달글(ym)}</b> <span className={'iy-n ' + (n >= 8 ? 'y' : '')}>{n}일</span></div>
                <div className="iy-grid" role="group" aria-label={`${달글(ym)} 일한 날`}>
                  {'일월화수목금토'.split('').map((w) => <span key={w} className={'iy-w ' + (w === '일' ? 'sun' : w === '토' ? 'sat' : '')}>{w}</span>)}
                  {Array.from({ length: 비움 }, (_, i) => <span key={'b' + i} />)}
                  {Array.from({ length: 수 }, (_, i) => {
                    const ds = `${ym}-${두자(i + 1)}`
                    const on = st.날.includes(ds)
                    const 기준 = R.묶음.some((b) => b.E === ds)
                    return <button key={ds} type="button" className={'iy-d' + (on ? ' on' : '') + (기준 ? ' e' : '') + (기간첫 === ds ? ' s' : '')} aria-pressed={on}
                      title={기준 ? '첫 근로일부터 1개월 되는 날' : ''} onClick={() => 날누름(ds)}>{i + 1}</button>
                  })}
                </div>
                <div className="iy-cal-f">
                  <label>받은 돈<input className="inp" inputMode="numeric" value={st.달돈[ym] !== undefined && st.달돈[ym] !== '' ? 원(st.달돈[ym]) : ''}
                    placeholder={n ? 원((Number(st.일당) || 0) * n) : '—'} aria-label={`${달글(ym)} 받은 돈`}
                    onChange={(e) => { const v = 금액읽기(e.target.value); 바꿈((s) => { const 달돈 = { ...s.달돈 }; if (v === '') delete 달돈[ym]; else 달돈[ym] = Number(v); return { ...s, 달돈 } }) }} /></label>
                  <span className="iy-cal-b">
                    <button type="button" className="tp-x" onClick={() => 달채움(ym, 'sun')}>일요일 빼고</button>
                    <button type="button" className="tp-x" onClick={() => 달채움(ym, 'wk')}>평일만</button>
                    <button type="button" className="tp-x" onClick={() => 달채움(ym, '')}>지움</button>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <aside className="iy-side no-print" aria-label="판단 결과 바로 보기">
          <div className="iy-side-h">✅ 판단 결과 <small className="muted">누를 때마다 바로</small></div>
          {요약 ? <>
            {[['국민연금', 요약.p, 뗌글[요약.p]], ['건강 · 요양', 요약.h, 뗌글[요약.h]], ['고용보험', 요약.e, 요약.e === 'y' ? '뗍니다' : '신고만']].map(([k, c, 말]) => (
              <div key={k} className="iy-side-r"><span>{k}</span><span className={'iy-chip ' + c}>{말}</span></div>
            ))}
            <div className="iy-side-m">{요약.돈없음 ? <>{요약.돈.이름}<br /><span className="muted">일당을 넣으면 떼는 돈이 나옵니다</span></> : <>{요약.돈.이름} · {원(요약.돈.받음)}원<br />공제 <b>{원(요약.돈.공제)}</b> · 실지급 <b className="iy-net">{원(요약.돈.받음 - 요약.돈.공제)}</b></>}</div>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={결과로}>까닭 · 할 일 자세히 ↓</button>
          </> : <div className="muted" style={{ fontSize: 12.5 }}>달력에서 일한 날을 누르면 여기에 바로 나옵니다.</div>}
        </aside>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>받은 돈을 비워 두면 일당 × 일한 날 · 노란 테두리 = 첫 근로일부터 «1개월 되는 날»</div>
        <details className="iy-more" open={((st.현장들 || []).length > 0 || Object.values(st.다른 || {}).some((o) => o && (Number(o.일) || Number(o.돈) || o.가입))) || undefined}>
          <summary>같은 회사 다른 현장에서도 일했으면 (국민연금 합산 · 현장마다 건강보험){현장.some((h) => h.날.length) ? ` — ${현장.filter((h) => h.날.length).length}곳` : ''}</summary>
          <div className="muted" style={{ fontSize: 12.5, margin: '6px 0', lineHeight: 1.7 }}>2025년 7월부터 국민연금은 이 현장에서 8일(220만원)이 안 되면 같은 회사(건설사업장) 근로를 합쳐 봅니다. <b>다만 그 달 다른 현장 한 곳에서 8일(220만원) 이상으로 이미 «현장 가입» 했으면 합치지 않습니다</b> — 현장 적용이 먼저라 그 달은 그 현장으로만(공단 실무안내 22쪽). 그런 달은 «그 현장에서 가입» 을 체크하십시오. 건강보험은 이 현장만 봅니다.</div>
          {/* 🏗 G125 (2026-10-03) 소장님 「수정해서 고쳐줘 사이트」 — 다른 현장도 날짜로(연금 취득일을 «○월 중» 이 아니라 그 날로) · 여러 현장 한 번에(현장마다 건강보험) */}
          <div className="iy-sites">
            <div className="iy-sites-h"><b>날짜로 넣기</b> <span className="muted">— 연금 취득일이 정확히 나오고, 결과에 <b>현장마다 건강보험</b> 이 나옵니다. 그 현장 혼자 8일(220만) 이상인 달은 «그 현장에서 가입» 으로 저절로 봅니다.</span></div>
            {(st.현장들 || []).map((x, i) => {
              const h = 현장[i] || { 날: [], 이름: '' }
              const 고침 = (f) => 바꿈((s) => ({ ...s, 현장들: (s.현장들 || []).map((y, j) => (j === i ? f(y) : y)) }))
              const 하루 = (ds) => 고침((y) => ({ ...y, 날: (y.날 || []).includes(ds) ? y.날.filter((d) => d !== ds) : [...(y.날 || []), ds].sort() }))
              const 달로 = (ym, 꼴) => 고침((y) => ({ ...y, 날: [...(y.날 || []).filter((d) => !d.startsWith(ym)), ...(꼴 ? 기간날들(`${ym}-01`, `${ym}-${두자(달날수(ym))}`, 꼴) : [])].sort() }))
              return (
                <div key={i} className="iy-site">
                  <div className="iy-site-h">
                    <label>현장<input className="inp" value={x.이름 || ''} maxLength={20} placeholder={`다른 현장 ${i + 1}`} onChange={(e) => 고침((y) => ({ ...y, 이름: e.target.value }))} /></label>
                    <label>일당<input className="inp" inputMode="numeric" value={x.일당 ? 원(x.일당) : ''} placeholder={Number(st.일당) ? `${원(st.일당)}(이 현장)` : '일당'} onChange={(e) => { const v = 금액읽기(e.target.value); 고침((y) => ({ ...y, 일당: v === '' ? '' : Number(v) })) }} /></label>
                    <span className="iy-site-n">{h.날.length}일</span>
                    <button type="button" className="tp-x" onClick={() => 바꿈((s) => ({ ...s, 현장들: (s.현장들 || []).filter((_, j) => j !== i) }))}>✕ 빼기</button>
                  </div>
                  <div className="iy-cals">
                    {달들.map((ym) => {
                      const n = h.날.filter((d) => d.startsWith(ym)).length
                      return (
                        <div key={ym} className="iy-cal iy-cal-s">
                          <div className="iy-cal-h"><b>{달글(ym)}</b> <span className={'iy-n ' + (n >= 8 ? 'y' : '')}>{n}일</span></div>
                          <div className="iy-grid" role="group" aria-label={`${h.이름} ${달글(ym)} 일한 날`}>
                            {'일월화수목금토'.split('').map((w) => <span key={w} className={'iy-w ' + (w === '일' ? 'sun' : w === '토' ? 'sat' : '')}>{w}</span>)}
                            {Array.from({ length: 첫요일(ym) }, (_, k) => <span key={'b' + k} />)}
                            {Array.from({ length: 달날수(ym) }, (_, k) => {
                              const ds = `${ym}-${두자(k + 1)}`
                              const on = h.날.includes(ds)
                              return <button key={ds} type="button" className={'iy-d' + (on ? ' on o' : '') + (st.날.includes(ds) ? ' me' : '')} aria-pressed={on}
                                title={st.날.includes(ds) ? '이 현장에서도 일한 날' : ''} onClick={() => 하루(ds)}>{k + 1}</button>
                            })}
                          </div>
                          <div className="iy-cal-b" style={{ marginTop: 6 }}>
                            <button type="button" className="tp-x" onClick={() => 달로(ym, 'sun')}>일요일 빼고</button>
                            <button type="button" className="tp-x" onClick={() => 달로(ym, 'wk')}>평일만</button>
                            <button type="button" className="tp-x" onClick={() => 달로(ym, '')}>지움</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {(st.현장들 || []).length < 다른현장최대
              ? <button type="button" className="btn line sm" style={{ width: 'auto', alignSelf: 'flex-start' }} onClick={() => 바꿈((s) => ({ ...s, 현장들: [...(s.현장들 || []), { 이름: '', 일당: '', 날: [] }] }))}>＋ 다른 현장 더하기 (날짜로)</button>
              : <span className="muted" style={{ fontSize: 12 }}>다른 현장은 {다른현장최대}곳까지 — 더 있으면 아래 «달마다 일수 · 받은 돈» 에 합쳐 적으십시오.</span>}
            <div className="muted" style={{ fontSize: 12 }}>점선 테두리 = 이 현장에서도 일한 날(같은 날은 회사 합산에서 하루로 셉니다)</div>
          </div>
          <div className="iy-sites-h" style={{ marginTop: 10 }}><b>날짜를 모르면 — 달마다 일수 · 받은 돈</b> <span className="muted">(위 날짜로 넣은 현장과 따로 더해집니다)</span></div>
          <div className="iy-other">
            {달들.map((ym) => {
              const o = (st.다른 || {})[ym] || {}
              const 고침 = (k, v) => 바꿈((s) => ({ ...s, 다른: { ...(s.다른 || {}), [ym]: { ...((s.다른 || {})[ym] || {}), [k]: v === '' ? '' : Number(v) } } }))
              return (
                <div key={ym} className="iy-other-r"><b>{달글(ym)}</b>
                  <label>일수<input className="inp" inputMode="numeric" value={o.일 || ''} onChange={(e) => 고침('일', 숫자만(e.target.value))} placeholder="0" /></label>
                  <label>받은 돈<input className="inp" inputMode="numeric" value={o.돈 ? 원(o.돈) : ''} onChange={(e) => 고침('돈', 금액읽기(e.target.value))} placeholder="0" /></label>
                  <label className="iy-other-c"><input type="checkbox" checked={!!o.가입} onChange={(e) => 바꿈((s) => ({ ...s, 다른: { ...(s.다른 || {}), [ym]: { ...((s.다른 || {})[ym] || {}), 가입: e.target.checked } } }))} /> 그 현장에서 가입(8일 · 220만 이상)</label>
                  {!o.가입 && ((Number(o.일) || 0) >= 8 || (Number(o.돈) || 0) >= 2200000) && <span className="iy-other-hint">다른 현장 <b>한 곳</b>에서 8일(220만) 이상이었으면 체크 — 그 달은 합치지 않습니다</span>}
                </div>
              )
            })}
          </div>
        </details>
        <details className="iy-more" open={특별열림 || undefined}>
          <summary>특별한 경우 — 근로계약서 · 연금 취득 달 · 하도급 현장 · 나이로 못 가리는 경우{켜진특별 ? ` (${켜진특별}개 켜짐)` : ''}</summary>
          {생글 && <div className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>생년월일을 넣었으니 만 60세(국민연금) · 만 65세(고용보험)는 저절로 가려 금액에 넣었습니다. 아래는 나이로는 알 수 없는 경우만입니다.</div>}
          <div className="iy-opts">
            {[['계약', '근로계약서가 1개월 이상 · 월 8일 이상으로 되어 있음 (건강보험은 실제 일한 날과 관계없이 가입)'],
              ['연금취득달', '국민연금 — 취득한 달 보험료도 내기 (가입자가 원할 때)'],
              ['하도급', '하도급 현장 — 원도급(원수급인)에게서 하도급받은 공사 (고용 · 산재 신고는 하수급인관리번호로 · 보험료는 원수급인)'],
              ['연금제외', 생글 ? '국민연금 빼기 — 18세 미만 본인이 원하지 않음 · 공무원연금 같은 다른 공적연금' : '국민연금 대상 아님 — 만 60세 이상 · 18세 미만 등 (생년월일을 넣으면 60세는 저절로)'],
              /* 🎂 생년월일을 넣으면 65세는 저절로 — 이미 켜 둔 사람만 끌 수 있게 남김 */
              ...(!생글 || 옵션.고용65 ? [['고용65', 생글 ? '65세 이후 새로 고용(손으로 켜 둔 것) — 생년월일로 저절로 가리니 꺼도 됩니다' : '65세 이후 새로 고용 — 고용보험 근로자 몫(실업급여) 없음 (생년월일을 넣으면 저절로)']] : []),
              ...(나 && R.날들.some((d) => d >= 나.L65) ? [['계속65', '65세 전부터 하루도 끊김 없이 계속 고용 — 65세 뒤에도 실업급여 몫을 냄(고용보험법 제10조② 단서)']] : [])].map(([k, 글]) => (
              <label key={k} className="iy-opt"><input type="checkbox" checked={!!옵션[k]} onChange={(e) => 바꿈((s) => ({ ...s, 옵션: { ...(s.옵션 || {}), [k]: e.target.checked } }))} /> {글}</label>
            ))}
          </div>
        </details>
      </div>

      <div className="card iy-out" ref={결과칸}>
        <div className="btn-row no-print" style={{ justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <div className="detail-h" style={{ margin: 0 }}>✅ 판단 결과{st.이름 ? ` — ${st.이름}` : ''}</div>
          <span className="iy-act">
            <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={인쇄} disabled={!R.날들.length}>🖨 인쇄</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={엑셀받기} disabled={!R.날들.length}>📗 엑셀(값만)</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={링크보내기} disabled={!R.날들.length}>🔗 링크 보내기</button>
          </span>
        </div>
        {링크 && <div className="note sm iy-link no-print" role="status">
          {링크.복사 ? '📋 링크를 복사했습니다 — 카톡 · 문자 · 카페에 붙여 넣으십시오. 받는 분이 누르면 같은 날짜 · 금액으로 열립니다.' : '아래 주소를 눌러 복사하십시오 — 받는 분이 누르면 같은 날짜 · 금액으로 열립니다.'}
          <input className="inp" readOnly value={링크.url} onFocus={(e) => e.target.select()} onClick={(e) => e.target.select()} aria-label="결과 링크" />
          <span className="muted">이름{옵션.생일 ? ' · 생년월일' : ''}은 담지 않습니다{옵션.생일 ? ' — 나이로 가린 것은 받는 쪽에서 생년월일을 넣어야 같게 나옵니다' : ''}.</span>
        </div>}
        <div className="iy-print-h">일용직 4대보험 가입 판단{st.이름 ? ` — ${st.이름}` : ''} · {R.날들.length ? `${짧은날(R.날들[0])} ~ ${짧은날(R.날들[R.날들.length - 1])} · ${R.날들.length}일` : ''}</div>
        {!R.날들.length && <div className="note sm">위 달력에서 일한 날을 누르거나, «예시로 해 보기» 를 눌러 보십시오.</div>}
        {R.날들.length > 0 && (() => {
          const p = 결론(P, 아님P), h = 결론(H, 아님H)
          return (
            <>
              <div className="iy-sum">
                <div className="iy-sumr"><span className="iy-sumk">국민연금</span><span className={'iy-chip ' + 요약.p}>{뗌글[요약.p]}</span><span className="iy-sumv">{p.글}</span></div>
                <div className="iy-sumr"><span className="iy-sumk">건강 · 요양</span><span className={'iy-chip ' + 요약.h}>{뗌글[요약.h]}</span><span className="iy-sumv">{h.글}</span></div>
                <div className="iy-sumr"><span className="iy-sumk">고용보험</span><span className={'iy-chip ' + 요약.e}>{요약.e === 'y' ? '뗍니다' : '신고만'}</span><span className="iy-sumv">{고용글}</span></div>
              </div>

              {현장.some((x) => x.날.length) && <>
                <div className="iy-h2">🏗 현장마다 <span className="muted">— 건강보험은 현장마다 따로 · 국민연금은 같은 회사 합산</span></div>
                <div className="tp-scroll">
                  <table className="tbl iy-sitet">
                    <thead><tr><th>현장</th><th>일한 날</th><th>건강보험</th><th>국민연금</th></tr></thead>
                    <tbody>
                      {[{ i: -1, 이름: '이 현장', 날: R.날들, R }, ...현장.filter((x) => x.날.length)].map((x) => (
                        <tr key={x.i}><th>{x.이름}</th><td>{x.날.length}일<br /><span className="muted">{짧은날(x.날[0])}~{짧은날(x.날[x.날.length - 1])}</span></td><td>{건강칸(x.R)}</td><td>{연금칸(x.R, x.i < 0)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="muted" style={{ fontSize: 12.5 }}>국민연금(회사 전체): {p.글}</div>
              </>}

              <div className="iy-h2">이번에 떼는 돈 <span className="muted">(2026 요율)</span></div>
              {/* 🐞 G127 — 일당(받은 돈)이 없으면 돈 줄 대신 여기서 바로 일당을 받습니다(위로 안 올라가도 됨) */}
              {요약 && 요약.돈없음 ? (
                <div className="note sm iy-nowage">
                  <div>💡 <b>일당</b>을 넣으면 달마다 떼는 돈 · 실지급이 나옵니다. 가입 판단(위 세 줄)은 일당 없이도 맞습니다.</div>
                  <label>일당(원)<input className="inp" inputMode="numeric" value={st.일당 ? 원(st.일당) : ''} onChange={(e) => 바꿈((s) => ({ ...s, 일당: 금액읽기(e.target.value) }))} placeholder="예: 200,000" aria-label="일당" /></label>
                </div>
              ) : (
              <div className="iy-pays">
                {공제.map((r) => (
                  <div key={r.ym} className="iy-payr">
                    {r.빈 ? <div className="iy-pay1"><b>{달글(r.ym)}</b> · {r.n}일 · <span className="muted">받은 돈 0원 — 달력 아래 «받은 돈» 을 넣으면 나옵니다</span></div> : <>
                    <div className="iy-pay1"><b>{달글(r.ym)}</b> · {r.n}일 · {원(r.돈)}원 → 공제 <b>{원(r.합)}</b> · 실지급 <b className="iy-net">{원(r.돈 - r.합)}</b></div>
                    <div className="iy-pay2">소득세 {원(r.it)} · 지방 {원(r.lt)} · 고용 {원(r.ei)} · 연금 {원(r.np)} · 건강 {원(r.hi)} · 요양 {원(r.lc)}</div></>}
                  </div>
                ))}
              </div>
              )}

              {할일.length > 0 && <>
                <div className="iy-h2">할 일</div>
                <ul className="iy-todo2">
                  {할일.slice(0, 4).map((x, i) => <li key={i}><b>{x.보험.replace(' · 산재', '')}</b> {x.무엇.replace(/\(일한 날 · 보수\)/, '').replace('직장가입자 ', '').replace('사업장가입자 ', '').replace(' — 이 건설현장 사업장으로', ' · 현장 사업장')} <span className="muted">— {x.기한.split(' — ')[0].replace(/\(.*?\)/g, '').trim()}</span></li>)}
                  {할일.length > 4 && <li className="muted">… 그 밖 {할일.length - 4}가지는 아래 «신고할 일 전부» 에</li>}
                </ul>
              </>}

              <div className="iy-folds">
                <details className="iy-fold">
                  <summary>📅 달마다 한눈에</summary>
                  <div className="tp-scroll">
                    <table className="tbl iy-band">
                      <thead><tr><th>달</th>{R.달들.map((ym) => <th key={ym}>{달글(ym)}</th>)}</tr></thead>
                      <tbody>
                        <tr><td className="nw">일한 날</td>{R.달들.map((ym) => <td key={ym} className="r">{입력.일[ym] || 0}일</td>)}</tr>
                        <tr><td className="nw">받은 돈</td>{R.달들.map((ym) => <td key={ym} className="r">{입력.달돈[ym] ? 원(입력.달돈[ym]) : '—'}</td>)}</tr>
                        {[['국민연금', P], ['건강보험', H]].map(([이름, X]) => (
                          <tr key={이름}><td className="nw">{이름}</td>{R.달들.map((ym) => {
                            const 가입 = X.구간.some((g) => 달(g.취득) <= ym && ym <= 달(전날(g.상실)))
                            return <td key={ym} className={'c ' + (X.부과[ym] ? 'iy-pay' : 가입 ? 'iy-in2' : '')}>{X.부과[ym] ? '보험료' : 가입 ? '가입' : (입력.일[ym] ? '—' : '')}</td>
                          })}</tr>
                        ))}
                        <tr><td className="nw">고용보험</td>{R.달들.map((ym) => <td key={ym} className={'c ' + (입력.일[ym] ? (R.고용.실업[ym] ? 'iy-pay' : 'iy-in2') : '')}>{입력.일[ym] ? (R.고용.실업[ym] ? '신고 · 공제' : '신고만') : ''}</td>)}</tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>«가입» 은 자격은 있지만 그 달 보험료는 없는 달(취득한 달 등), «보험료» 는 노무비에서 떼는 달입니다.{나 ? ' 고용보험 «신고만» 은 만 65세 이후 새로 고용이라 실업급여 몫을 떼지 않는 달입니다.' : ''} 산재보험은 사업주가 내고 근로자에게서 떼지 않습니다.</div>
                </details>

                <details className="iy-fold">
                  <summary>🧾 공제 표 (항목별 · 합계)</summary>
                  <div className="tp-scroll">
                    <table className="tbl iy-ded">
                      <thead><tr><th>달</th><th>일한 날</th><th>받은 돈</th><th>소득세</th><th>지방소득세</th><th>고용</th><th>국민연금</th><th>건강</th><th>장기요양</th><th>공제 합</th><th>실지급</th></tr></thead>
                      <tbody>
                        {공제.map((r) => (
                          <tr key={r.ym}>
                            <td className="nw">{달글(r.ym)}</td><td className="r">{r.n}</td><td className="r">{원(r.돈)}</td>
                            <td className="r">{원(r.it)}</td><td className="r">{원(r.lt)}</td><td className="r">{원(r.ei)}</td>
                            <td className="r">{원(r.np)}</td><td className="r">{원(r.hi)}</td><td className="r">{원(r.lc)}</td>
                            <td className="r"><b>{원(r.합)}</b></td><td className="r"><b>{원(r.돈 - r.합)}</b></td>
                          </tr>
                        ))}
                        <tr className="sum"><td>합계</td><td className="r">{R.날들.length}</td><td className="r">{원(합계.돈)}</td><td className="r">{원(합계.it)}</td><td className="r">{원(합계.lt)}</td>
                          <td className="r">{원(합계.ei)}</td><td className="r">{원(합계.np)}</td><td className="r">{원(합계.hi)}</td><td className="r">{원(합계.lc)}</td><td className="r"><b>{원(합계.합)}</b></td><td className="r"><b>{원(합계.돈 - 합계.합)}</b></td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>소득세는 일용근로소득(일급 15만원 넘는 몫 × 2.7%, 한 달 합 1천원 미만은 안 뗌)으로 셉니다. 10원 미만 버림. 건설일용 보험료는 그 달 실제 보수로 매기므로 마지막에는 공단 고지액과 맞추십시오.</div>
                </details>

                <details className="iy-fold">
                  <summary>🔍 왜 이렇게 나왔나 (판단 과정)</summary>
                  <div className="iy-why">
                    <div>
                      <div className="tp-bill-sub">건강보험은 이렇게 셌습니다</div>
                      <ol>{H.과정.map((x, i) => <li key={i}>{x}</li>)}</ol>
                      {첫 && <div className="muted" style={{ fontSize: 12 }}>첫 근로일 {짧은날(첫.시작)} → 1개월 되는 날 {짧은날(한달되는날(첫.시작))} (Ⓐ 기간)</div>}
                    </div>
                    <div>
                      <div className="tp-bill-sub">국민연금은 이렇게 셌습니다</div>
                      <ol>{P.과정.map((x, i) => <li key={i}>{x}</li>)}</ol>
                      {R.고용.과정.length > 0 && <>
                        <div className="tp-bill-sub">고용보험 — 나이</div>
                        <ol>{R.고용.과정.map((x, i) => <li key={i}>{x}</li>)}</ol>
                      </>}
                    </div>
                  </div>
                </details>

                <details className="iy-fold">
                  <summary>📋 신고할 일 전부 · 기한 · 근거</summary>
                  <div className="tp-scroll">
                    <table className="tbl iy-todo">
                      <thead><tr><th>보험</th><th>무엇을</th><th>언제까지</th><th>근거</th></tr></thead>
                      <tbody>{신고.map((x, i) => <tr key={i}><td className="nw">{x.보험}</td><td>{x.무엇}</td><td>{x.기한}</td><td className="muted">{x.근거}</td></tr>)}</tbody>
                    </table>
                  </div>
                </details>

                <details className={'iy-fold' + (옵션.사업주 ? '' : ' no-print')} data-print="as-is" open={!!옵션.사업주} onToggle={(e) => { if (e.currentTarget.open !== !!옵션.사업주) 옵션바꿈('사업주', e.currentTarget.open) }}>
                  <summary>🏢 사업주 몫 · 공단에 내는 보험료 총액</summary>
                  <div className="iy-emp-o no-print">
                    <label>회사 규모 (상시근로자 — 국내 모든 사업 합산)
                      <select className="inp" value={옵션.규모 || 's'} onChange={(e) => 옵션바꿈('규모', e.target.value)}>
                        {회사규모.map((x) => <option key={x.k} value={x.k}>{x.이름} — 고용안정 {(x.율 * 100).toFixed(2)}%</option>)}
                      </select>
                    </label>
                    <label className="iy-opt"><input type="checkbox" checked={옵션.산재 !== false} onChange={(e) => 옵션바꿈('산재', e.target.checked)} /> 산재보험료(참고 — 2026 건설업 3.56%)도 넣기</label>
                  </div>
                  <div className="tp-scroll">
                    <table className="tbl iy-ded">
                      <thead><tr><th>달</th><th>받은 돈</th><th>국민연금</th><th>건강</th><th>장기요양</th><th>고용</th>{옵션.산재 !== false && <th>산재(참고)</th>}<th>사업주 합</th><th>근로자 몫(보험)</th><th>보험료 총액</th></tr></thead>
                      <tbody>
                        {사업주.map((r) => (
                          <tr key={r.ym}>
                            <td className="nw">{달글(r.ym)}</td><td className="r">{원(r.돈)}</td><td className="r">{원(r.np)}</td><td className="r">{원(r.hi)}</td><td className="r">{원(r.lc)}</td>
                            <td className="r">{원(r.ei)}</td>{옵션.산재 !== false && <td className="r">{원(r.ia)}</td>}<td className="r"><b>{원(r.합)}</b></td><td className="r">{원(r.근4)}</td><td className="r"><b>{원(r.합 + r.근4)}</b></td>
                          </tr>
                        ))}
                        <tr className="sum"><td>합계</td><td className="r">{원(사합.돈)}</td><td className="r">{원(사합.np)}</td><td className="r">{원(사합.hi)}</td><td className="r">{원(사합.lc)}</td>
                          <td className="r">{원(사합.ei)}</td>{옵션.산재 !== false && <td className="r">{원(사합.ia)}</td>}<td className="r"><b>{원(사합.합)}</b></td><td className="r">{원(사합.근4)}</td><td className="r"><b>{원(사합.합 + 사합.근4)}</b></td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    국민연금 · 건강 · 장기요양은 근로자와 같은 금액입니다. 고용은 실업급여 0.9%{옵션.고용65 || 실업없음 ? '(65세 이후 새로 고용 — 없음)' : 실업일부 ? '(만 65세 뒤 일한 날 몫은 없음)' : ''} + 고용안정 · 직업능력개발 {((회사규모.find((x) => x.k === 옵션.규모) || 회사규모[0]).율 * 100).toFixed(2)}%(고용보험료징수법 시행령 제12조 · 하수급인은 원수급인 요율).
                    {옵션.산재 !== false ? ' 산재는 2026 건설업 3.56%(출퇴근 0.6‰ 포함)로 보수에 곱한 참고 금액입니다 — 건설현장은 원수급인이 공사 금액(노무비율)으로 내는 경우가 많습니다.' : ''}
                    {' '}공사 전체 고용 · 산재 보험료(노무비율 · 개산 · 확정 · 분할 납부)는 <Link to="/tools/boheomryo">🧾 고용·산재 보험료 계산기</Link>, 요율 근거는 <Link to="/tools/haemada">해마다 바뀌는 값</Link>.
                  </div>
                </details>
              </div>
            </>
          )
        })()}
      </div>

      <details className="card iy-in iy-know">
        <summary className="detail-h" style={{ margin: 0 }}>📌 알아 두실 것</summary>
        <ul className="flist" style={{ marginTop: 6 }}>
          <li><b>국민연금</b>은 달력 달(일 시작한 달은 시작일~말일)로, <b>건강보험</b>은 첫 근로일부터 1개월 되는 날까지로 셉니다. 그래서 같은 출역이라도 하나만 가입되는 일이 흔합니다.</li>
          <li><b>보험료는 취득한 달의 다음 달부터</b> 나옵니다(1일 취득이면 그 달부터). 국민건강보험법 제69조② · 국민연금법 제17조①.</li>
          <li>이 현장에서 일한 날로 셉니다. 국민연금은 같은 회사 다른 현장을 위 «다른 현장» 칸에 적으면 합쳐 봅니다.</li>
          <li><b>생년월일</b>을 넣으면 나이로 가립니다 — 국민연금은 만 60세가 된 날(60번째 생일 전날)의 다음 날 상실, 고용보험은 만 65세부터 일한 날의 실업급여 몫(근로자 0.9% · 사업주 0.9%)이 없습니다. 건강보험 · 장기요양 · 소득세는 나이와 관계없습니다. <Link to="/tools/ilyong-guide#age">나이 기준 자세히</Link></li>
          <li>여러 사람의 한 달 지급명세서는 <Link to="/tools/nomubi">일용 노무비 계산기</Link>가 같은 판단으로 공제합니다. 서식은 <Link to="/forms/gy-ilyong">일용근로계약서</Link> · <Link to="/forms/nomubi">노무비 지급확인서</Link>.</li>
          <li>판단은 공단이 최종으로 합니다. 기준과 사례는 <Link to="/tools/ilyong-guide">가입 기준 설명</Link>에 원문 그대로 정리했습니다.</li>
        </ul>
      </details>

      {요약 && <button type="button" className={'iy-bar no-print' + (!결과보임 && !입력중 ? ' on' : '')} style={{ bottom: 바닥 }} onClick={결과로} aria-label="판단 결과로 가기">
        <span className="iy-bar-c">
          <span className={'iy-bc ' + 요약.p}>연금 {짧은뗌[요약.p]}</span>
          <span className={'iy-bc ' + 요약.h}>건강 {짧은뗌[요약.h]}</span>
          <span className={'iy-bc ' + 요약.e}>고용 {요약.고용말}</span>
        </span>
        <span className="iy-bar-m">{요약.돈없음 ? <>{요약.돈.이름} · 일당을 넣으면 떼는 돈이 나옵니다</> : <>{요약.돈.이름} · 공제 <b>{원(요약.돈.공제)}</b> · 실지급 <b>{원(요약.돈.받음 - 요약.돈.공제)}</b></>} <span className="iy-bar-go">결과 ▾</span></span>
      </button>}
    </div>
  )
}

/* ── 📘 설명 페이지 ─────────────────────────────────────────── */
export function IlyongGuide() {
  /* #age 처럼 주소에 붙은 칸으로 내려가기(판단기 «나이 기준 자세히») */
  useEffect(() => { const h = window.location.hash.slice(1); if (h) setTimeout(() => { const el = document.getElementById(h); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 80) }, [])
  const navigate = useNavigate()
  const 열기 = (c) => {
    try { sessionStorage.setItem(넘김열쇠, JSON.stringify({ ...c.in, 글: `예시 «${c.t}» 를 채웠습니다 — ${c.q}` })) } catch (e) { /* 저장 막힘 — 그냥 이동 */ }
    navigate('/tools/ilyong-boheom')
  }
  return (
    <div className="wrap iy iyg">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📘 {G.title}</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>{굵게(G.lead)}</p>
        <div className="btn-row" style={{ justifyContent: 'flex-start', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Link className="btn sm" style={{ width: 'auto' }} to="/tools/ilyong-boheom">🛡 가입 판단기로 바로 계산</Link>
          <Link className="btn ghost sm" style={{ width: 'auto' }} to="/tools/nomubi">👷 일용 노무비 계산기</Link>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{G.updated} 기준 · 공단 실무안내 · 법령 원문 확인</div>
      </div>
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>한눈에 — 보험마다 다른 점</div>
        <div className="tp-scroll">
          <table className="tbl iy-tbl">
            <thead><tr>{G.table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{G.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} className="nw">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
          </table>
        </div>
      </div>
      {G.secs.map((s, i) => (
        <div className="card" key={i} id={s.id || undefined}>
          <div className="detail-h" style={{ margin: 0 }}>{s.h}</div>
          {s.p.map((x, j) => <p className="tl-p" key={j}>{굵게(x)}</p>)}
        </div>
      ))}
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>사례로 보기 — 누르면 판단기에 그대로 채워집니다</div>
        {G.cases.map((c) => (
          <div className="iy-case" key={c.id}>
            <div className="iy-case-t">{c.t}</div>
            <div className="iy-case-q">{c.q}</div>
            <ul className="flist">{c.a.map((x, j) => <li key={j}>{굵게(x)}</li>)}</ul>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 열기(c)}>이 사례로 계산해 보기 →</button>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>자주 묻는 것</div>
        {G.faq.map(([q, a], i) => (
          <details className="iy-faq" key={i}><summary>{q}</summary><p className="tl-p">{a}</p></details>
        ))}
      </div>
      <div className="card">
        <div className="detail-h" style={{ margin: 0 }}>근거</div>
        <ul className="flist">{G.refs.map(([a, b], i) => <li key={i}>{a} <span className="muted">— {b}</span></li>)}</ul>
        <div className="muted" style={{ fontSize: 12 }}>보험 가입 판단은 공단이 최종으로 합니다. 근로계약 · 다른 현장 근로 · 나이처럼 출역만으로 알 수 없는 것이 있으면 공단에 확인하십시오.</div>
      </div>
    </div>
  )
}
