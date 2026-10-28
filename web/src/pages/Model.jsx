/**
 * /jeoksan/model — 🧱 골조 모델 · 세우면 물량 (G386 · 2026-10-23)
 *
 * 소장님: 「그럼 이제 아까 말했던 플러그인 만들고, 사이트에서 작업 가능하게 하자」 · 「지금 있는 것과 따로 만들고 싶어」 · 「도구 셋 끝낸 뒤」
 *   (카페 «스케치업으로 골조 물량산출» — 기둥 · 보 · 벽 · 슬라브를 세우면 거푸집 ㎡ · 철근 t · 콘크리트 ㎥ 이 층별 · 부호별 엑셀)
 * ■ 지금 있는 골조 수량산출(/jeoksan/golgo · 표에 적기) · BIM 물량(/jeoksan/bim · 도면 읽기)과 «따로» 인 화면 — 통심 위에 눌러 세움.
 *   셈은 같은 골조 셈(lib/골조.js) — 같은 건물이면 어느 화면으로 해도 같은 규칙. 모델 → 셈 줄은 lib/골조모델.js.
 * ■ 흐름: ① 통심 · 층 → ② 부호 일람(단면 · 배근) → ③ 세우기(평면에서 누름 · 3D) → ④ 물량(층별 · 부호별 · 엑셀 산출서)
 * ■ 모델은 이 브라우저에만(localStorage kcm.model.v1) · «모델 파일 저장» 으로 PC 에 받아 두고 다른 기기에서 «모델 파일 열기». 서버 없음 · 비용 0.
 * ■ 🔒 이용권 확인 자리 lib/이용권.js — 꺼 둠(모두 통과 · 화면에 말 없음 · 소장님 「이런 설명을 사이트에 넣지마」)
 * ■ 📊 숨은 누적: |골조모델|열기 · 예시 · 세움(그 판 첫 번) · 층복사 · 엑셀 · 저장 · 열기파일 · 3D고름
 * ■ 시험: node tools/시험_골조모델.mjs (lib) · tools/시험_골조모델화면.mjs (화면 PC · 폰)
 * ■ 🖥 G388 작업 화면(적산컨맵 첫걸음 · 2026-10-23) — 소장님 「지금 화면은 작잖아...크게 해주면 안돼?」 · 「잠가놓고 시험해줘. 그리고 내가 볼 수 있게」
 *   🔒 운영자(소장님 브라우저 · lib/운영자.js 나운영자)만 «🖥 작업 화면» 단추 · ?ws=1 로 열림 — 남에게는 단추 · 글 · 주소 모두 없음. 소장님 «열어» 뒤 잠금 풂.
 *   꼴: 위 막대(이름 · 탭 · 되돌리기 · 예시 · 저장 · 열기 · 엑셀 · ⛶ 전체 화면 · 나가기) / 왼쪽(층 단추 · 도구 · 부호 · 한꺼번에 · 층 복사) / 가운데(🧊 3D · 📐 평면 · ◫ 나란히) / 오른쪽(합 · 고른 부재 · 이 층 표).
 *   3D 바닥에 지금 층 통심을 깖(set배경) — 도면 위에 세우듯. 📊 숨은 누적 |골조모델|작업화면.
 * ■ 📐 G389 «도면 넣기»(작업 화면 · 🔒 운영자만) — 소장님 「캐드 도면 넣으면 … 하나씩 채워가면서」 · 「좌표로 하는 거잖아」
 *   BIM 물량 화면과 같은 길로 읽어(lib/도면넣기.js) 좌표 그대로 골조 모델로 옮김(lib/도면모델.js) · 못 옮긴 것 · 도면 셈과 견줌표는 오른쪽 «📐 도면에서 세움».
 *   📊 숨은 누적 |골조모델|도면넣기.
 * ■ 🚶 G390 «둘러보기»(작업 화면 가운데 · 🔒 운영자만) — 3D 안을 사람(셋 가운데 고름)이 걸으며 부재 확인 · ✂ 나누기 · 📝 점검사항(둘러보기판.jsx)
 *   도면에서 못 옮긴 것(M.빠짐)은 3D 에 빨갛게 · 고른 부재에 «📄 근거 도면»(자리를 읽은 평면) · «짐작»(도면에 없던 값) · ✂ 자리(mm)로 나누기.
 */
import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 세기 } from '../lib/받은수.jsx'
import { 배근칸, 정착표, 기준값, 엑셀 as 골조엑셀 } from '../lib/골조.js'
import { 도면함끄기, 도면함켜기, 도면함넣어둠 } from '../lib/도면모델.js'
import { 새모델, 예시모델, 작업예시모델, 정돈, 겹침둠, 겹침남기기, 겹침물을짝, 큰무리빼기, 정리할것, 무더기빼기, 사선넣기, 사선끝, 띠판, 기둥넣기, 선넣기, 칸넣기, 계단넣기, 부재옮기기, 구간넣기, 구간빼기, 구간고치기, 구간물량, 구간선자르기, 구간색들, 부재빼기, 부재고치기, 부재나누기, 층복사, 통심더하기, 통심빼기, 통심간격, 모델셈, 종류색, 부재글, 모델시트, FT층, 층높이, 제안확인, 제안모두확인, 제안빼기, 기초철근넣기, 계단글 } from '../lib/골조모델.js'
import 둘러보기판 from '../둘러보기판.jsx'
import { 층판 } from '../lib/둘러보기.js'
import { 길잡이 } from '../lib/도우미.js'
import { 부재보기 } from '../lib/bim3d.js'
import { 확인 as 이용권확인 } from '../lib/이용권.js'
import { 나운영자 } from '../lib/운영자.js'
/* 🛣 G396 작업 화면 «토목» 탭 — 노선(STA) · TM 좌표 · EL · 측량점 파일 · 좌표계(따로 불러옴 — 건축만 쓰면 안 받음) */
const 토목판 = lazy(() => import('../토목판.jsx'))
const 분야열쇠 = 'kcm.ws.field'

const 저장열쇠 = 'kcm.model.v1'
const 넣은열쇠 = 'kcm.ws.lastfiles'       // 📚 G440 마지막으로 넣은 도면 이름(골조가 없어도 건축 도면함에 보임)
const 되돌림열쇠 = 'kcm.model.undo.v1'
const 수글 = (n, k = 3) => (Number.isFinite(n) ? n.toLocaleString('ko-KR', { minimumFractionDigits: k, maximumFractionDigits: k }) : '')
const rgb = (c) => 'rgb(' + c.map((v) => Math.round(v * 255)).join(',') + ')'
const 어두움 = () => { try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch (e) { return false } }
const 일람칸 = {
  기둥: ['기호', '가로', '세로', '지름', '주근', '대근단부', '대근중앙'],
  보: ['기호', '폭', '춤', '상부', '하부', '늑근단부', '늑근중앙', '부근'],
  슬라브: ['기호', '두께', '단변하부', '단변상부', '장변하부', '장변상부'],
  벽: ['기호', '두께', '수직', '수평', '배근'],
  기초: ['기호', '가로', '세로', '두께', '하부가로', '하부세로', '상부가로', '상부세로'],
  계단: ['기호', '두께', '주근', '배력근', '참주근', '참배력근', '배근'],   // 🩹 G440 계단 칸이 없어 «부호 일람» 탭이 늘 멈췄음(Cannot read … 'map')
}
const 칸이름 = (종, 속) => ((배근칸[종] || []).find((c) => c[1] === 속) || [속])[0]
const 칸보기 = (종, 속) => ((배근칸[종] || []).find((c) => c[1] === 속) || [])[2] || ''
const 도구들 = [['기둥', '▣ 기둥'], ['보', '━ 보'], ['벽', '▬ 벽'], ['슬라브', '▦ 슬라브'], ['기초', '⬚ 기초'], ['계단', '🪜 계단'], ['고르기', '👆 고르기'], ['옮기기', '✋ 옮기기'], ['구간', '▭ 구간'], ['지우기', '✕ 지우기']]
const 다음부호 = (목록, 머리) => { let n = 1; while (목록.some((r) => String(r.기호).toUpperCase() === 머리 + n)) n++; return 머리 + n }

function 읽기() {
  try { const t = localStorage.getItem(저장열쇠); if (t) return 정돈(JSON.parse(t)) } catch (e) { /* 사생활 보호 모드 · 깨진 저장 */ }
  return null
}

/* 🔧 G393 저장된 모델이 너무 크면(실수로 «모든 교점에» 를 눌러 기둥 1만 개 — 소장님 화면이 멈추고 새로고침해도 다시 멈춤) 열기 전에 물음 */
const 큰모델 = 6000
export default function Model() {
  const [큰저장, set큰저장] = useState(() => { const m = 읽기(); return m && m.부재.length > 큰모델 ? m : null })
  const 큰무리 = useMemo(() => (큰저장 ? 큰무리빼기(큰저장).무리 : []), [큰저장])          // 🔧 G430 많은 무리마다 도면에서 온 것 · 손으로 세운 것
  const [M, setM0] = useState(() => { const m = 읽기(); return m && m.부재.length <= 큰모델 ? m : 새모델() })
  /* 🔧 G393 소장님 「뒤로가기가 없어」 — 되돌리기를 이 탭에 남김(새로고침해도 ↶ 로 돌아감 · 10번까지 · 큰 모델은 덜) */
  const [되돌림, set되돌림] = useState(() => { try { const t = sessionStorage.getItem(되돌림열쇠); const a = t ? JSON.parse(t) : []; return Array.isArray(a) ? a.filter((m) => m && Array.isArray(m.부재) && m.통심).map(정돈) : [] } catch (e) { return [] } })
  useEffect(() => {
    const t = setTimeout(() => { for (const n of [10, 5, 2, 1, 0]) { try { if (n) sessionStorage.setItem(되돌림열쇠, JSON.stringify(되돌림.slice(-n))); else sessionStorage.removeItem(되돌림열쇠); break } catch (e) { /* 꽉 참 — 덜 남김 */ } } }, 700)
    return () => clearTimeout(t)
  }, [되돌림])
  const [탭, set탭] = useState(() => (읽기() && 읽기().부재.length ? '세우기' : '통심'))
  const [층, set층] = useState(() => { const m = 읽기() || 새모델(); return (m.층.find((f) => !FT층(f)) || m.층[0]).이름 })
  const [도구, set도구] = useState('기둥')
  const [부호, set부호] = useState({ 기둥: 'C1', 보: 'G1', 벽: 'W1', 슬라브: 'S1', 기초: 'F1' })
  const [첫점, set첫점] = useState(null)
  const [고른, set고른] = useState(null)
  const [보일층, set보일층] = useState('모두')
  const [알림, set알림] = useState('')
  const [받는중, set받는중] = useState('')
  const [glErr, setGlErr] = useState('')
  const [크게, set크게] = useState(false)
  const [도면상태, set도면상태] = useState(null)       // 📐 G389 {k: busy|err, 글}
  const [도면결과, set도면결과] = useState(null)       // 📐 G389 {못옮김, 도면: {합, 종}, 부재수, 경고, 이름}
  const 도면Ref = useRef(null)
  const 원료Ref = useRef(null)                          // 📚 G391 도면함 — 마지막으로 넣은 도면을 한꺼번에 세운 모델(전체) · 읽는 틀(이 화면을 여는 동안만)
  const [엑셀받음, set엑셀받음] = useState(false)        // 🧭 G391 길잡이 «엑셀 받기» ✓
  const [걷기요청, set걷기요청] = useState(0)            // 🧭 길잡이에서 «둘러보기» 누름
  const 길행동 = (할곳) => {
    if (할곳 === '도면') { if (도면Ref.current) 도면Ref.current.click() }
    else if (할곳 === '일람') set탭('일람')
    else if (할곳 === '통심') set탭('통심')
    else if (할곳 === '엑셀') { set탭('물량') }
    else if (할곳 === '둘러보기') { set탭('세우기'); set걷기요청((n) => n + 1) }
    else if (String(할곳).startsWith('층:')) { set탭('세우기'); set층(String(할곳).slice(2)); set고른(null) }
  }
  /* 🖥 G388 작업 화면(크게 · 왼쪽 도구 · 가운데 3D · 오른쪽 물량) — 🔒 지금은 소장님 브라우저(운영자)에서만 보임 · 소장님이 «열어» 하시면 잠금을 풂 */
  const [운영자, set운영자] = useState(false)
  const [작업, set작업0] = useState(false)
  const 작업Ref = useRef(null)
  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (!살 || !v) return; set운영자(true); try { if (new URLSearchParams(window.location.search).get('ws') === '1') set작업0(true) } catch (e) { /* 주소 못 읽음 */ } }).catch(() => {})
    return () => { 살 = false }
  }, [])
  const set작업 = (v) => {
    set작업0(v)
    try { const u = new URL(window.location.href); if (v) u.searchParams.set('ws', '1'); else u.searchParams.delete('ws'); window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash) } catch (e) { /* 주소 못 바꿈 */ }
    if (!v && document.fullscreenElement) { try { document.exitFullscreen() } catch (e) { /* 무시 */ } }
  }
  useEffect(() => {
    if (!작업) return
    세기('|골조모델|작업화면')
    const 전 = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (탭 === '통심' && M.부재.length) set탭('세우기')
    return () => { document.body.style.overflow = 전 }
  }, [작업])  // eslint-disable-line react-hooks/exhaustive-deps
  /* 🛣 G396 🏢 건축 | 🛣 토목 — 같은 작업 화면 · 고른 것은 이 브라우저에 기억 */
  const [분야, set분야0] = useState(() => { try { return localStorage.getItem(분야열쇠) === '토목' ? '토목' : '건축' } catch (e) { return '건축' } })
  const set분야 = (v) => { set분야0(v); try { localStorage.setItem(분야열쇠, v) } catch (e) { /* 막힘 */ } if (v === '토목') 세기('|토목탭|탭') }
  const 전체화면 = () => { const el = 작업Ref.current; try { if (document.fullscreenElement) document.exitFullscreen(); else if (el && el.requestFullscreen) el.requestFullscreen() } catch (e) { /* 막힘 */ } }
  const 센것 = useRef(new Set())
  const 한번세기 = (k) => { if (센것.current.has(k)) return; 센것.current.add(k); 세기(k) }
  useEffect(() => { 세기('|골조모델|열기'); 이용권확인('골조모델').catch(() => {}) }, [])

  /* 고침 — 되돌리기 30번 */
  const setM = useCallback((f) => {
    setM0((P) => {
      const N = typeof f === 'function' ? f(P) : f
      if (N !== P) set되돌림((u) => [...u.slice(-29), P])
      return N
    })
  }, [])
  const 되돌리기 = () => set되돌림((u) => { if (!u.length) return u; setM0(u[u.length - 1]); return u.slice(0, -1) })
  /* 저장(0.4초 모아서) */
  useEffect(() => {
    if (큰저장) return undefined                    // 큰 저장 모델을 고르기 전에는 덮어쓰지 않음
    const t = setTimeout(() => { try { localStorage.setItem(저장열쇠, JSON.stringify(M)) } catch (e) { /* 꽉 참 · 사생활 보호 */ } }, 400)
    return () => clearTimeout(t)
  }, [M, 큰저장])
  /* 층 이름이 없어지면 첫 층으로 */
  useEffect(() => { if (!M.층.some((f) => f.이름 === 층)) set층((M.층.find((f) => !FT층(f)) || M.층[0]).이름) }, [M.층, 층])
  useEffect(() => { set첫점(null) }, [도구, 층])

  /* 셈은 누름을 막지 않게 한 박자 늦게(큰 모델: 부재 3,600개에 0.4초쯤) */
  const M늦 = useDeferredValue(M)
  const S = useMemo(() => { try { return 모델셈(M늦) } catch (e) { return { 오류: String(e && e.message || e) } } }, [M늦])
  const 고른것 = 고른 !== null ? M.부재.find((o) => o.id === 고른) || null : null
  const 층FT = FT층(M.층.find((f) => f.이름 === 층))
  const 쓸도구 = 층FT ? ['기초', '보', '슬라브', '고르기', '옮기기', '구간', '지우기'] : ['기둥', '보', '벽', '슬라브', '계단', '고르기', '옮기기', '구간', '지우기']
  useEffect(() => { if (!쓸도구.includes(도구)) set도구(층FT ? '기초' : '기둥') }, [층FT])  // eslint-disable-line react-hooks/exhaustive-deps

  /* 📚 G393 도면함 단추 — 오른쪽 도면함으로 옮겨 반짝(폰은 아래로) */
  const 도면함보기 = () => {
    if (탭 !== '세우기') set탭('세우기')
    setTimeout(() => { const el = document.getElementById('gmd-dwgbox'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash') } }, 60)
    세기('|골조모델|도면함단추')
  }
  const 예시열기 = () => {
    /* 🧪 G393 작업 화면은 새 기능이 다 든 예시(계단 · 구간 · 도면함 · 층별 대조 · 제안 · 빨간 곳) — 예전 화면은 그대로 */
    if (작업) { setM(작업예시모델()); set층('1'); set탭('세우기'); set고른(null); set알림('가상 예시(2층 라멘조 · 계단 · 구간 · 도면함)를 열었습니다 — 실제 현장이 아닙니다. 🟨 계단 · MAT 확인 · 🟥 빨간 곳 · 📚 도면함 ☑ · ▭ 구간 · 🚶 둘러보기를 해 보십시오.') }
    else { setM(예시모델()); set층('1'); set탭('세우기'); set고른(null); set알림('가상 예시(2층 라멘조)를 열었습니다 — 실제 현장이 아닙니다. 눌러서 고쳐 보십시오.') }
    세기('|골조모델|예시')
  }
  const 새로 = () => {
    if (M.부재.length && !window.confirm('지금 모델을 비우고 새로 시작할까요? (되돌리기로 돌아올 수 있습니다)')) return
    setM(새모델()); set층('1'); set탭('통심'); set고른(null); set알림('')
  }

  /* ── 모델 파일 저장 · 열기 ── */
  const 파일이름 = (M.이름 || '골조모델').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40)
  const 내려주기 = (blob, 이름) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 이름
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 60000)
  }
  const 모델저장 = () => { 내려주기(new Blob([JSON.stringify(M)], { type: 'application/json' }), '골조모델_' + 파일이름 + '.json'); 세기('|골조모델|저장') }
  const 파일Ref = useRef(null)
  const 모델열기 = async (f) => {
    if (!f) return
    try {
      const j = JSON.parse(await f.text())
      if (!j || !Array.isArray(j.부재) || !j.통심) throw new Error('골조 모델 파일이 아닙니다')
      setM(정돈(j)); set고른(null); set탭('세우기'); set알림('«' + f.name + '» 를 열었습니다.')
      세기('|골조모델|열기파일')
    } catch (e) { set알림('열지 못했습니다 — ' + (e.message || e)) }
  }

  /* ── 📐 G389 도면 넣기 → 좌표대로 세우기(BIM 물량 화면과 같은 길로 읽음)
        🛣🏢 G397 «함께 넣기» — 도면을 한 번 넣으면 골조(이 탭)와 토목(🛣 토목 탭)을 같이 읽음(lib/토목읽기.js 함께읽기 — DWG 한 번 바꿈 · 골조 읽기와 도면 3D 일꾼을 같이)
        소장님 「토목하고 건축도 함께 세우는 거지? 골조 물량은 나오는 거고..」 · 「빔 할때 만든거 참고 하고 있지?」 ── */
  const 함께넣기 = async (목록, 옵 = {}) => {
    set도면상태({ k: 'busy', 글: '파일 여는 중' })
    try {
      const [넣기, 읽] = await Promise.all([import('../lib/도면넣기.js'), import('../lib/토목읽기.js')])
      const r0 = await 읽.함께읽기(목록, { 알려: (글) => set도면상태({ k: 'busy', 글 }), 예시: !!옵.예시, 이름: 옵.이름 })
      const 말 = []
      let 세움 = false
      const r = r0.골조
      /* 🔰 G441 토목 도면 묶음에서 골조처럼 읽힌 부스러기(현장 S 23장 → 부재 2 · 콘크리트 0)는 세우지 않음 — 빈 건축 화면에 «(제목 없음) 부재 2» 만 남던 것. 물량 0 이라 빠지는 물량은 없음 */
      let 부스러기 = false
      if (r && r.부재수 > 0 && r0.토목) { try { 부스러기 = !(모델셈(정돈({ ...r.M })).합.콘크리트 > 0.001) } catch (e) { 부스러기 = false } }
      const 골조읽음 = !!(r && r.부재수 > 0 && !부스러기)
      if (골조읽음) {
        if (!M.부재.length || 옵.묻지않음 || window.confirm(옵.물음 || '지금 모델 대신 도면에서 세울까요? (↶ 되돌리기로 돌아올 수 있습니다)')) {
          const N = 정돈({ ...r.M, 빠짐: r.못옮김.filter((x) => Array.isArray(x.판)).map((x) => ({ 종류: x.종류, 층: x.층, 기호: x.기호, 까닭: x.까닭, 판: x.판, 높: x.높, 키: x.키 })), 도면함: r.평면 || [], 대조: r.대조 || null, 도면따로: r.따로 || [], 묶음: r0.묶음 })   // 📚 G393 도면함 목록 · 🧾 층별 대조도 모델에 · 🛣🏢 G397 묶음(같이 넣은 토목과 짝)
          setM(N); set층((N.층.find((f) => !FT층(f)) || N.층[0]).이름); if (분야 === '건축') set탭('세우기'); set고른(null)
          원료Ref.current = { 넣기, 전체: N }       // 📚 도면함 — 한꺼번에 세운 모델에서 평면마다 꺼내 옴(하나씩 = 한꺼번에)
          set도면결과({ 못옮김: r.못옮김, 도면: r.도면, 부재수: r.부재수, 경고: r.경고, 이름: r.이름, 필요: r.필요 || [], 평면: r.평면 || [], 높이: r.높이 || {} })
          const 제안수 = N.부재.filter((o) => o.제안).length
          말.push('도면에서 부재 ' + r.부재수.toLocaleString('ko-KR') + '개를 좌표대로 세웠습니다' + (제안수 ? ' · 🟨 MAT · 계단 ' + 제안수 + '곳은 건설맵이 도면대로 먼저 세웠습니다(노랑 — 확인해 주세요)' : '') + (r.못옮김.length ? ' — 못 옮긴 ' + r.못옮김.length + '개는 오른쪽 «📐 도면에서 세움» 에서 보고 손으로 세우십시오' : ''))
          세움 = true
        } else 말.push('🏢 골조 모델은 그대로 두었습니다')
      } else if (!r0.토목) 말.push('🏢 골조: ' + (r0.골조틀림 || '골조(평면 · 일람표)를 찾지 못했습니다'))
      if (r0.토목) {
        r0.토목.골조파일 = r && 세움 ? [...new Set((r.평면 || []).map((p) => p.파일).filter(Boolean))] : []
        r0.토목.골조묶음 = 세움 ? r0.묶음 : null
        await 읽.토목상태.넣기(r0.토목)
        /* 🔰 G441 처음 쓰는 분 눈으로 — 찾은 것만(0 은 안 씀) · 찾은 것 먼저 · «골조 없음» 은 뒤에 짧게 */
        const 활 = r0.토목.활용
        const 찾음 = [['노선', (활.노선 || []).length], ['구조물', (활.구조 || []).length], ['횡단 단면', (활.횡단 || []).reduce((n, t) => n + (t.노선 ? t.단면.length : 0), 0)], ['건물 평면', (활.건물 || []).length], ['측량점', 활.땅 ? 활.땅.점.length / 3 : 0]].filter(([, n]) => n > 0).map(([k, n]) => k + ' ' + n.toLocaleString('ko-KR'))
        말.push('🛣 토목 — ' + 찾음.join(' · ') + (세움 && 분야 === '건축' ? ' (🛣 토목 탭에서 함께 봄)' : ''))
        if (!세움 && !골조읽음) 말.push('🏢 건축 골조는 없음(구조평면 · 일람표 도면이 아님' + (부스러기 ? ` — 골조처럼 읽힌 선 ${r.부재수}개는 물량이 0 이라 안 세움` : '') + ')')
      } else if (r0.토목틀림) 말.push('🛣 ' + r0.토목틀림)
      set알림((r0.파일 && r0.파일.length ? '✓ 도면 ' + r0.파일.length + '장 읽음 — ' : '') + 말.join(' · ') + '.')
      /* 🔰 G441 건축 탭에서 토목 도면만 넣으면 빈 건축 화면에 남던 것 — 토목 탭으로 바로 */
      if (작업 && 분야 === '건축' && r0.토목 && !세움 && !골조읽음) set분야('토목')
      /* 📚 G440 건축 도면함이 «넣은 도면 없음» 으로만 보이던 것 — 골조가 없어도 무엇을 넣었는지 남김(이 브라우저) */
      if (!옵.예시) { try { localStorage.setItem(넣은열쇠, JSON.stringify({ 파일: r0.파일 || [], 토목: !!r0.토목, 골조: 골조읽음 ? r.부재수 : 0, 세움, 때: Date.now() })) } catch (e) { /* 막힘 */ } }
      set도면상태(r0.못.length ? { k: 'err', 글: '읽지 못한 도면: ' + r0.못.join(', ') } : null)
      세기('|골조모델|도면넣기')
      if (세움 && r0.토목) 세기('|골조모델|함께넣기')
      return { ...r0, 세움 }
    } catch (e) { set도면상태({ k: 'err', 글: '도면에서 세우지 못했습니다 — ' + ((e && e.message) || e) }); return null }
  }
  const 도면넣기 = async (files) => {
    const list = [...(files || [])].filter((f) => /\.(dxf|dwg|xlsx?|csv|txt)$/i.test(f.name))
    if (!list.some((f) => /\.(dxf|dwg)$/i.test(f.name))) { set도면상태({ k: 'err', 글: 'DXF · DWG 도면 파일을 넣어 주십시오.' }); return }
    const { 파일한도 } = await import('../lib/파일한도.js')
    const 한 = 파일한도(), 큰 = list.filter((f) => /\.(dxf|dwg)$/i.test(f.name) && f.size > 한)
    if (큰.length && 큰.length === list.filter((f) => /\.(dxf|dwg)$/i.test(f.name)).length) { set도면상태({ k: 'err', 글: 큰.map((f) => f.name).join(', ') + ' — 이 기기에서 읽기에 너무 큰 도면입니다' }); return }
    const 쓸 = list.filter((f) => !큰.includes(f))
    await 함께넣기(await Promise.all(쓸.map(async (f) => ({ 이름: f.name, buf: await f.arrayBuffer() }))))
    if (큰.length) set도면상태({ k: 'err', 글: '읽지 못한 도면: ' + 큰.map((f) => f.name).join(', ') + ' — 너무 큼' })
  }

  /* ── 엑셀 ── */
  const 엑셀받기 = async () => {
    if (!S || S.오류 || !M.부재.length) return
    set받는중('엑셀')
    try {
      const { writeWorkbook, ST } = await import('../lib/qtoxlsx.js')
      const sheets = [...골조엑셀(S.공사, S.R, (s) => s, ST), ...모델시트(M, S, ST)]
      내려주기(new Blob([writeWorkbook(sheets)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), '골조모델_' + 파일이름 + '.xlsx')
      세기('|골조모델|엑셀')
      set엑셀받음(true)
    } catch (e) { set알림('엑셀을 만들지 못했습니다 — ' + (e.message || e)) } finally { set받는중('') }
  }

  const 세움칸 = (작업판) => (
    <세우기칸 토목으로={() => set분야('토목')} M={M} setM={setM} S={S} 층={층} set층={set층} 도구={도구} set도구={set도구} 쓸도구={쓸도구} 부호={부호} set부호={set부호}
      첫점={첫점} set첫점={set첫점} 고른={고른} set고른={set고른} 고른것={고른것} 보일층={보일층} set보일층={set보일층}
      glErr={glErr} setGlErr={setGlErr} 크게={크게} set크게={set크게} 한번세기={한번세기} 작업={작업판} 도면결과={도면결과} set도면결과={set도면결과}
      엑셀받음={엑셀받음} 걷기요청={걷기요청} 길행동={길행동} 원료Ref={원료Ref} 도면열기={() => 도면Ref.current && 도면Ref.current.click()} />
  )
  if (작업 && 운영자) {
    const 분야칸 = (
      <>
        <b className="gmd-ws-name"><span className="gmd-ws-brand">🏗 K-적산컨맵</span> <span className="gmd-ws-model">{분야 === '토목' ? '토목' : M.이름 || '골조 모델'}</span></b>
        <span className="gmd-ws-field" role="tablist" aria-label="분야">
          {[['건축', '🏢 건축'], ['토목', '🛣 토목']].map(([k, t]) => <button key={k} type="button" role="tab" aria-selected={분야 === k} className={'gmd-field' + (분야 === k ? ' on' : '')} onClick={() => set분야(k)}>{t}</button>)}
        </span>
      </>
    )
    if (분야 === '토목') {
      return (
        <div className="page gmd">
          <div className="gmd-ws tmk" ref={작업Ref} role="dialog" aria-label="K-적산컨맵 작업 화면 — 토목">
            <Suspense fallback={<div className="gmd-ws-top">{분야칸}<span className="muted">토목 화면 여는 중…</span></div>}>
              <토목판 전체화면={전체화면} 나가기={() => set작업(false)} 분야칸={분야칸} M={M} S={S} 함께넣기={함께넣기} 도면상태={도면상태} set도면상태={set도면상태} 알림={알림} set알림={set알림} 건축으로={() => { set분야('건축'); set탭('세우기') }} />
            </Suspense>
          </div>
        </div>
      )
    }
    return (
      <div className="page gmd">
        <div className="gmd-ws" ref={작업Ref} role="dialog" aria-label="K-적산컨맵 작업 화면">
          <div className="gmd-ws-top">
            {분야칸}
            <span className="gmd-ws-tabs" role="tablist">
              {[['세우기', '세우기 · 3D'], ['통심', '통심 · 층'], ['일람', '부호 일람'], ['물량', '물량 · 엑셀']].map(([k, t]) => (
                <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'gmd-tab' + (탭 === k ? ' on' : '')} onClick={() => set탭(k)}>{t}</button>
              ))}
            </span>
            <span className="gmd-ws-acts">
              <button type="button" className="btn line sm gmd-undo" onClick={되돌리기} disabled={!되돌림.length} title="되돌리기 — 바로 앞 모델로(새로고침해도 이 탭에 남음)">↶ 되돌리기{되돌림.length ? ' ' + 되돌림.length : ''}</button>
              <button type="button" className="btn sm gmd-ws-dwg" onClick={() => 도면Ref.current && 도면Ref.current.click()} disabled={!!(도면상태 && 도면상태.k === 'busy')}>📐 도면 넣기</button>
              <button type="button" className="btn line sm gmd-ws-boxbtn" onClick={도면함보기} title="도면함 — 넣은 평면을 ☑ 체크로 세우고 뺌">📚 도면함{M.도면함 && M.도면함.length ? ' ' + M.도면함.filter((p) => M.부재.some((o) => o.근거 && o.근거.키 === p.키)).length + '/' + M.도면함.length : ''}</button>
              <button type="button" className="btn line sm" onClick={예시열기}>🧪 예시</button>
              <button type="button" className="btn line sm" onClick={모델저장} title="모델 파일 저장">💾</button>
              <button type="button" className="btn line sm" onClick={() => 파일Ref.current && 파일Ref.current.click()} title="모델 파일 열기">📂</button>
              <button type="button" className="btn line sm" onClick={엑셀받기} disabled={!!받는중 || !M.부재.length}>{받는중 ? '…' : '📊 엑셀'}</button>
              <button type="button" className="btn line sm" onClick={전체화면} title="전체 화면">⛶</button>
              <button type="button" className="btn sm" onClick={() => set작업(false)}>✕ 나가기</button>
            </span>
            <input ref={파일Ref} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { 모델열기(e.target.files && e.target.files[0]); e.target.value = '' }} />
            <input ref={도면Ref} className="gmd-ws-dwgin" type="file" accept=".dxf,.dwg,.xlsx,.xls,.csv,.txt" multiple style={{ display: 'none' }} onChange={(e) => { 도면넣기(e.target.files); e.target.value = '' }} />
          </div>
          {도면상태 && <div className={'gmd-note gmd-ws-note' + (도면상태.k === 'err' ? ' gmd-warnbox' : '')} role="status">{도면상태.k === 'busy' ? '⏳ ' : '⚠ '}{도면상태.글}{도면상태.k !== 'busy' && <button type="button" className="gmd-x" onClick={() => set도면상태(null)} aria-label="닫기">✕</button>}</div>}
{큰저장 && <div className="gmd-note gmd-warnbox" role="alert">⚠ 저장된 모델의 부재가 <b>{큰저장.부재.length.toLocaleString('ko-KR')}개</b>로 아주 많습니다({[...new Set(큰저장.부재.map((o) => o.층))].map((f) => f + '층 ' + 큰저장.부재.filter((o) => o.층 === f).length.toLocaleString('ko-KR')).join(' · ')}) — 열면 화면이 멈출 수 있습니다.{큰무리.length > 0 && <> 많은 곳: {큰무리.map((g) => `${g.층}층 ${g.종류} ${g.모두.toLocaleString('ko-KR')}개(도면에서 온 것 ${g.도면.toLocaleString('ko-KR')} · 손으로 세운 것 ${g.뺌.toLocaleString('ko-KR')})`).join(' · ')}.</>} <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { const r = 큰무리빼기(큰저장); setM0(r.M); set큰저장(null); set알림('너무 많던 ' + r.무리.map((g) => g.층 + '층 ' + g.종류 + ' 손으로 세운 것 ' + g.뺌.toLocaleString('ko-KR') + '개').join(' · ') + ' 만 빼고 열었습니다(도면에서 온 것은 남김)') }}>많은 것만 빼고 열기</button> <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setM0(큰저장); set큰저장(null) }}>그대로 열기</button> <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { set큰저장(null); set알림('새 모델로 시작합니다') }}>비우고 시작</button></div>}
          {알림 && <div className="gmd-note gmd-ws-note">{알림}<button type="button" className="gmd-x" onClick={() => set알림('')} aria-label="닫기">✕</button></div>}
          {탭 === '세우기' ? 세움칸(true) : (
            <div className="gmd-ws-page">
              {탭 === '통심' && <통심칸 M={M} setM={setM} />}
              {탭 === '일람' && <일람칸들 M={M} setM={setM} />}
              {탭 === '물량' && <물량칸 M={M} S={S} 엑셀받기={엑셀받기} 받는중={받는중} set탭={set탭} set고른={set고른} set층={set층} />}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page gmd">
      <div className="card">
        <h1 style={{ margin: 0, fontSize: 20 }}>🧱 골조 모델 — 세우면 물량</h1>
        <p className="muted" style={{ margin: '6px 0 0', lineHeight: 1.7 }}>
          통심 위에 <b>기둥 · 보 · 벽 · 슬라브 · 기초</b>를 눌러 세우면 <b>콘크리트 ㎥ · 거푸집 ㎡ · 철근 ton</b> 이 층별 · 부호별로 나오고, 산출식이 붙은 엑셀 산출서로 받습니다.
          셈 규칙은 <Link to="/jeoksan/golgo">골조 수량산출</Link>과 같습니다. 모델은 이 브라우저에만 남습니다 — 다른 기기로 옮길 때는 «모델 파일 저장».
        </p>
        <div className="gmd-top">
          <button type="button" className="btn sm" onClick={예시열기}>🧪 가상 예시(2층 라멘조)로 해 보기</button>
          {운영자 && <button type="button" className="btn sm gmd-ws-open" onClick={() => set작업(true)}>🖥 작업 화면</button>}
          <button type="button" className="btn line sm" onClick={새로}>새로</button>
          <button type="button" className="btn line sm" onClick={되돌리기} disabled={!되돌림.length}>↶ 되돌리기</button>
          <button type="button" className="btn line sm" onClick={모델저장}>💾 모델 파일 저장</button>
          <button type="button" className="btn line sm" onClick={() => 파일Ref.current && 파일Ref.current.click()}>📂 모델 파일 열기</button>
          <input ref={파일Ref} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { 모델열기(e.target.files && e.target.files[0]); e.target.value = '' }} />
        </div>
        <label className="gmd-name">공사 이름 <input value={M.이름} placeholder="예: ○○ 근린생활시설 신축" onChange={(e) => { const v = e.target.value; setM0((P) => ({ ...P, 이름: v })) }} /></label>
{큰저장 && <div className="gmd-note gmd-warnbox" role="alert">⚠ 저장된 모델의 부재가 <b>{큰저장.부재.length.toLocaleString('ko-KR')}개</b>로 아주 많습니다({[...new Set(큰저장.부재.map((o) => o.층))].map((f) => f + '층 ' + 큰저장.부재.filter((o) => o.층 === f).length.toLocaleString('ko-KR')).join(' · ')}) — 열면 화면이 멈출 수 있습니다.{큰무리.length > 0 && <> 많은 곳: {큰무리.map((g) => `${g.층}층 ${g.종류} ${g.모두.toLocaleString('ko-KR')}개(도면에서 온 것 ${g.도면.toLocaleString('ko-KR')} · 손으로 세운 것 ${g.뺌.toLocaleString('ko-KR')})`).join(' · ')}.</>} <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { const r = 큰무리빼기(큰저장); setM0(r.M); set큰저장(null); set알림('너무 많던 ' + r.무리.map((g) => g.층 + '층 ' + g.종류 + ' 손으로 세운 것 ' + g.뺌.toLocaleString('ko-KR') + '개').join(' · ') + ' 만 빼고 열었습니다(도면에서 온 것은 남김)') }}>많은 것만 빼고 열기</button> <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setM0(큰저장); set큰저장(null) }}>그대로 열기</button> <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { set큰저장(null); set알림('새 모델로 시작합니다') }}>비우고 시작</button></div>}
        {알림 && <div className="gmd-note">{알림}</div>}
      </div>

      <div className="gmd-tabs" role="tablist">
        {[['통심', '① 통심 · 층'], ['일람', '② 부호 일람'], ['세우기', '③ 세우기 · 3D'], ['물량', '④ 물량 · 엑셀']].map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={탭 === k} className={'gmd-tab' + (탭 === k ? ' on' : '')} onClick={() => set탭(k)}>{t}</button>
        ))}
      </div>

      {탭 === '통심' && <통심칸 M={M} setM={setM} />}
      {탭 === '일람' && <일람칸들 M={M} setM={setM} />}
      {탭 === '세우기' && 세움칸(false)}
      {탭 === '물량' && <물량칸 M={M} S={S} 엑셀받기={엑셀받기} 받는중={받는중} set탭={set탭} set고른={set고른} set층={set층} />}
    </div>
  )
}

/* ───────────────────────── ① 통심 · 층 */
function 간격글(줄) { return 줄.slice(1).map((g, k) => Math.round(g.자리 - 줄[k].자리)).join(', ') }
function 통심칸({ M, setM }) {
  const [x글, setX글] = useState(() => 간격글(M.통심.x))
  const [y글, setY글] = useState(() => 간격글(M.통심.y))
  useEffect(() => { setX글(간격글(M.통심.x)) }, [M.통심.x])
  useEffect(() => { setY글(간격글(M.통심.y)) }, [M.통심.y])
  const [더축, set더축] = useState('x')
  const [더자리, set더자리] = useState('')
  const [더알, set더알] = useState('')
  /* 🔧 G392 보조 통심 더하기 — 소장님 폰 「더하기가 안돼」: 빈칸 · 쉼표 · «mm» 를 받으면 아무 말 없이 끝났고, 거리를 «첫 줄에서» 가 아니라 0 에서 잰 자리로 넣었음(도면 좌표 모델은 건물 밖) →
       숫자만 골라 읽고 · 첫 줄 자리 + 거리 · 같은 자리 줄이 있으면 알림 · 이름 = 아래 본 줄 + 거리(«X1+3500») · 더한 뒤 알림 */
  const 보조더하기 = () => {
    const 줄 = [...M.통심[더축]].sort((a, b) => a.자리 - b.자리)
    const t = String(더자리).replace(/[,\s]|mm/gi, '')
    const v = Number(t)
    if (t === '' || !Number.isFinite(v) || v < 0) { set더알('거리(mm)를 숫자로 적어 주세요 — 예: 3500'); return }
    const 첫 = 줄.length ? 줄[0].자리 : 0
    const 자리 = 첫 + v
    const 겹 = 줄.find((g) => Math.abs(g.자리 - 자리) < 1)
    if (겹) { set더알('그 자리(' + v.toLocaleString('ko-KR') + ' mm)에는 이미 «' + 겹.이름 + '» 줄이 있습니다'); return }
    const 본 = 줄.filter((g) => !/[+−-]\d+$/.test(String(g.이름)) && g.자리 < 자리).pop()
    const 이름 = 본 ? 본.이름 + '+' + Math.round(자리 - 본.자리) : (더축 === 'x' ? 'X' : 'Y') + '+' + Math.round(v)
    setM((P) => 통심더하기(P, 더축, 자리, 이름))
    set더자리('')
    set더알('✓ ' + (더축 === 'x' ? 'X' : 'Y') + ' 방향 줄 «' + 이름 + '» 을 더했습니다(첫 줄에서 ' + v.toLocaleString('ko-KR') + ' mm)')
  }
  const 간격넣기 = (축, 글) => {
    const 간 = String(글).split(/[,\s·]+/).map((v) => Number(v.replace(/[^\d.]/g, ''))).filter((v) => v > 0)
    if (!간.length) return
    const 줄어듦 = 간.length + 1 < M.통심[축].length
    if (줄어듦 && M.부재.length && !window.confirm('통심 줄이 줄어듭니다 — 없어지는 줄 위의 부재도 지워집니다. 할까요?')) return
    setM((P) => 통심간격(P, 축, 간))
  }
  const ft = M.층.find(FT층)
  const 위층 = M.층.filter((f) => !FT층(f))
  const 층고침 = (이름, 칸, v) => setM((P) => ({ ...P, 층: P.층.map((f) => (f.이름 === 이름 ? { ...f, [칸]: 칸 === '이름' ? v : v } : f)) }))
  const 층이름바꿈 = (옛, 새) => {
    새 = 새.trim()
    if (!새 || M.층.some((f) => f.이름 === 새)) return
    setM((P) => ({ ...P, 층: P.층.map((f) => (f.이름 === 옛 ? { ...f, 이름: 새 } : f)), 부재: P.부재.map((o) => (o.층 === 옛 ? { ...o, 층: 새 } : o)) }))
  }
  const 층더 = () => setM((P) => {
    const 끝 = P.층[P.층.length - 1]
    const n = P.층.filter((f) => !FT층(f)).length + 1
    let 이름 = String(n); while (P.층.some((f) => f.이름 === 이름)) 이름 += "'"
    return { ...P, 층: [...P.층, { 이름, 층고: FT층(끝) ? 3300 : 끝.층고, 슬라브: FT층(끝) ? 150 : 끝.슬라브 }] }
  })
  const 층빼기 = (이름) => {
    const n = M.부재.filter((o) => o.층 === 이름).length
    if (n && !window.confirm(이름 + '층 부재 ' + n + '개도 지워집니다. 할까요?')) return
    setM((P) => ({ ...P, 층: P.층.filter((f) => f.이름 !== 이름), 부재: P.부재.filter((o) => o.층 !== 이름) }))
  }
  const 지하더 = () => setM((P) => {
    let 이름 = 'B1'; let k = 1; while (P.층.some((f) => f.이름 === 이름)) { k++; 이름 = 'B' + k }
    const i = P.층.findIndex((f) => !FT층(f))
    const 새 = { 이름, 층고: 3600, 슬라브: 150 }
    const 층 = [...P.층]; 층.splice(i < 0 ? 1 : i, 0, 새)
    return { ...P, 층 }
  })
  const 맨 = (g) => g.자리
  return (
    <div className="card gmd-grid">
      <h2 className="gmd-h">통심(그리드)</h2>
      <p className="muted gmd-p">앞 줄에서 다음 줄까지 거리(mm)를 쉼표로 적습니다. 줄 수가 같으면 세운 부재는 그대로 따라 옮겨집니다.</p>
      {[['x', 'X 방향(가로로 늘어선 세로 줄 X1, X2 …)', x글, setX글], ['y', 'Y 방향(세로로 늘어선 가로 줄 Y1, Y2 …)', y글, setY글]].map(([축, 말, 값, 바꿈]) => (
        <div key={축} className="gmd-row">
          <label className="gmd-lab">{말}</label>
          <input className="gmd-in wide" inputMode="numeric" value={값} onChange={(e) => 바꿈(e.target.value)} onBlur={() => 간격넣기(축, 값)} onKeyDown={(e) => { if (e.key === 'Enter') 간격넣기(축, 값) }} placeholder="예: 7000, 7000, 7000" />
          <span className="gmd-lines">{M.통심[축].map((g) => (
            <span key={g.id} className="gmd-chip">
              <input className="gmd-in name" value={g.이름} aria-label="통심 이름" onChange={(e) => { const v = e.target.value; setM((P) => ({ ...P, 통심: { ...P.통심, [축]: P.통심[축].map((u) => (u.id === g.id ? { ...u, 이름: v } : u)) } })) }} />
              <small>{Math.round(맨(g)).toLocaleString('ko-KR')}</small>
              {M.통심[축].length > 2 && <button type="button" className="gmd-x" title="이 줄 빼기" onClick={() => { const n = M.부재.filter((o) => JSON.stringify([o.점, o.끝, o.칸]).includes('"' + g.id + '"')).length; if (n && !window.confirm(g.이름 + ' 줄 위 부재 ' + n + '개도 지워집니다. 뺄까요?')) return; setM((P) => 통심빼기(P, 축, g.id)) }}>✕</button>}
            </span>
          ))}</span>
        </div>
      ))}
      <div className="gmd-row">
        <label className="gmd-lab">보조 통심 더하기(작은보 · 벽 자리)</label>
        <select className="gmd-in" value={더축} onChange={(e) => set더축(e.target.value)}><option value="x">X 방향 줄</option><option value="y">Y 방향 줄</option></select>
        <input className="gmd-in" inputMode="numeric" value={더자리} placeholder="첫 줄에서 거리 mm" onChange={(e) => { set더자리(e.target.value); set더알('') }} onKeyDown={(e) => { if (e.key === 'Enter') 보조더하기() }} />
        <button type="button" className="btn line sm" onClick={보조더하기}>더하기</button>
      </div>
      {더알 && <p className={'gmd-p ' + (/^✓/.test(더알) ? 'muted' : 'gmd-warn')} role="status">{더알}</p>}

      <h2 className="gmd-h">층</h2>
      <p className="muted gmd-p">n층 = n층 기둥 · 벽 + 그 위 바닥(보 · 슬라브). 맨 위층의 보 · 슬라브가 지붕입니다. FT 는 기초 · 지중보 · 맨 아래 바닥.</p>
      <div className="gmd-tablewrap">
        <table className="gmd-table">
          <thead><tr><th>층</th><th>층고(mm)</th><th>슬라브 두께(mm)</th><th>부재</th><th /></tr></thead>
          <tbody>
            {[...위층].reverse().map((f) => (
              <tr key={f.이름}>
                <td><input className="gmd-in name" defaultValue={f.이름} onBlur={(e) => 층이름바꿈(f.이름, e.target.value)} aria-label="층 이름" /></td>
                <td><input className="gmd-in num" inputMode="numeric" value={f.층고} onChange={(e) => 층고침(f.이름, '층고', Number(e.target.value) || 0)} /></td>
                <td><input className="gmd-in num" inputMode="numeric" value={f.슬라브} onChange={(e) => 층고침(f.이름, '슬라브', Number(e.target.value) || 0)} /></td>
                <td className="num">{M.부재.filter((o) => o.층 === f.이름).length}</td>
                <td>{위층.length > 1 && <button type="button" className="gmd-x" title="이 층 빼기" onClick={() => 층빼기(f.이름)}>✕</button>}</td>
              </tr>
            ))}
            {ft && (
              <tr className="gmd-ft">
                <td>FT</td>
                <td colSpan={2}>기초 윗면 깊이(맨 아래 바닥에서) <input className="gmd-in num" inputMode="numeric" value={ft.내림 || 0} onChange={(e) => 층고침(ft.이름, '내림', Number(e.target.value) || 0)} /> mm</td>
                <td className="num">{M.부재.filter((o) => o.층 === ft.이름).length}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="gmd-top">
        <button type="button" className="btn line sm" onClick={층더}>＋ 위로 층 더하기</button>
        <button type="button" className="btn line sm" onClick={지하더}>＋ 지하층 더하기</button>
      </div>
    </div>
  )
}

/* ───────────────────────── ② 부호 일람 */
function 일람칸들({ M, setM }) {
  const 기 = M.기준 || 기준값()
  const 기준고침 = (k, v) => setM((P) => {
    const 새 = { ...P.기준, [k]: v }
    if (k === 'fck' || k === 'fy') { const fck = Number(새.fck) || 24, fy = Number(새.fy) || 400; 새.정착 = 정착표(fck, fy) }
    return { ...P, 기준: 새 }
  })
  const 줄고침 = (종, i, 칸, v) => setM((P) => {
    const 줄 = P.배근[종].slice()
    const 옛 = 줄[i]
    줄[i] = { ...옛, [칸]: v }
    let 부재 = P.부재
    if (칸 === '기호' && 옛.기호 && v && !줄.some((r, k) => k !== i && r.기호 === 옛.기호)) 부재 = 부재.map((o) => (o.종류 === 종 && o.부호 === 옛.기호 ? { ...o, 부호: v } : o))
    return { ...P, 배근: { ...P.배근, [종]: 줄 }, 부재 }
  })
  const 줄더 = (종) => setM((P) => {
    const 머리 = { 기둥: 'C', 보: 'G', 슬라브: 'S', 벽: 'W', 기초: 'F', 계단: 'ST' }[종]
    const 끝 = P.배근[종][P.배근[종].length - 1]
    const 새 = { ...(끝 || {}), 기호: 다음부호(P.배근[종], 머리) }
    if (종 === '기초') 새.종류 = '독립'
    return { ...P, 배근: { ...P.배근, [종]: [...P.배근[종], 새] } }
  })
  const 줄빼기 = (종, i) => {
    const r = M.배근[종][i]
    const n = M.부재.filter((o) => o.종류 === 종 && o.부호 === r.기호).length
    if (n && !window.confirm(r.기호 + ' 을 쓰는 부재가 ' + n + '개 있습니다 — 일람에서 빼면 그 부재는 셈에서 빠집니다(경고로 보임). 뺄까요?')) return
    setM((P) => ({ ...P, 배근: { ...P.배근, [종]: P.배근[종].filter((_, k) => k !== i) } }))
  }
  return (
    <div className="card">
      <h2 className="gmd-h">기준</h2>
      <div className="gmd-row gmd-wrap">
        <label className="gmd-kv">fck(MPa) <input className="gmd-in num" inputMode="numeric" value={기.fck} onChange={(e) => 기준고침('fck', Number(e.target.value) || 0)} /></label>
        <label className="gmd-kv">fy(MPa) <input className="gmd-in num" inputMode="numeric" value={기.fy} onChange={(e) => 기준고침('fy', Number(e.target.value) || 0)} /></label>
        <label className="gmd-kv">레미콘 <input className="gmd-in" value={기.콘크리트} onChange={(e) => 기준고침('콘크리트', e.target.value)} /></label>
        <label className="gmd-kv">거푸집 <input className="gmd-in" value={기.거푸집} onChange={(e) => 기준고침('거푸집', e.target.value)} /></label>
      </div>
      <p className="muted gmd-p">정착 · 이음 길이는 fck · fy 로 KDS 14 20 52 기본식(골조 수량산출과 같음). 설계도면 일반사항 표가 있으면 골조 수량산출에서 그 값으로 고쳐 쓰십시오.</p>
      {['기둥', '보', '슬라브', '벽', '기초', '계단'].map((종) => (
        <div key={종} className="gmd-ilam">
          <h2 className="gmd-h"><span className="gmd-dot" style={{ background: rgb(종류색[종]) }} />{종} 일람 <small className="muted">({M.부재.filter((o) => o.종류 === 종).length}개 세움)</small></h2>
          <div className="gmd-tablewrap">
            <table className="gmd-table">
              <thead><tr>{(일람칸[종] || ['기호']).map((k) => <th key={k}>{칸이름(종, k)}</th>)}<th>쓴 수</th><th /></tr></thead>
              <tbody>
                {(M.배근[종] || []).map((r, i) => (
                  <tr key={i}>
                    {(일람칸[종] || ['기호']).map((k) => (
                      <td key={k}><input className={'gmd-in ' + (/^(가로|세로|지름|폭|춤|두께)$/.test(k) ? 'num' : k === '기호' ? 'name' : 'bar')} value={r[k] ?? ''} placeholder={칸보기(종, k)} onChange={(e) => 줄고침(종, i, k, e.target.value)} aria-label={종 + ' ' + 칸이름(종, k)} /></td>
                    ))}
                    <td className="num">{M.부재.filter((o) => o.종류 === 종 && o.부호 === r.기호).length}</td>
                    <td><button type="button" className="gmd-x" title="이 줄 빼기" onClick={() => 줄빼기(종, i)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 줄더(종)}>＋ {종} 부호 더하기</button>
          {종 === '기초' && <span className="muted gmd-p"> 모델의 기초는 독립기초(기둥 밑)입니다.</span>}
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────── ③ 세우기 · 평면 + 3D */
function 세우기칸(p) {
  const { M, setM, S, 층, set층, 도구, set도구, 쓸도구, 부호, set부호, 첫점, set첫점, 고른, set고른, 고른것, 보일층, set보일층, glErr, setGlErr, 크게, set크게, 한번세기, 작업 = false, 도면결과 = null, set도면결과 = () => {}, 엑셀받음 = false, 걷기요청 = 0, 길행동 = () => {}, 원료Ref = null, 도면열기 = () => {} } = p
  const [보기, set보기] = useState('3D')                // 🖥 G388 작업 화면 가운데: 3D · 평면 · 나란히
  const [빗그리기, set빗그리기] = useState(false)          // 🧭 G395 ⟋ 비스듬히 — 가로 · 세로가 다른 교점을 누르면 비스듬한 보 · 벽
  const [걷기, set걷기0] = useState(false)             // 🚶 G390 둘러보기(작업 화면만)
  const [걷기눈, set걷기눈] = useState(false)          // 🚶 눈으로 보는 중(천장도 보임) · 뒤에서 보면 지금 층 천장(보 · 슬라브)은 걷어 냄
  const 걸어봄 = useRef(false)
  const 걷기누름Ref = useRef(null)                      // 🖱 G390 둘러보기 — 3D 를 누르면 그 자리로 걷기(둘러보기판이 채움)
  const 앞보일 = useRef(null)
  const set걷기 = (v) => {
    if (v) {
      앞보일.current = 보일층; set보기('3D'); set보일층('까지')
      /* 처음 걸을 때(또는 빈 층) — 부재가 있는 맨 아래 층(기초 → 지하 → 1층 … 차례) */
      if (!걸어봄.current || !M.부재.some((o) => o.층 === 층)) { const f = M.층.find((x) => M.부재.some((o) => o.층 === x.이름)); if (f) set층(f.이름) }
      걸어봄.current = true
    }
    else if (앞보일.current) { set보일층(앞보일.current); 앞보일.current = null }
    set걷기0(v)
  }
  const [나눌자리, set나눌자리] = useState('')
  const [빨고름, set빨고름] = useState(null)
  /* 👁 G433 도면함 «☑ 체크 = 보기» — 체크한 도면(박스 · 평면)의 부재만 3D · 평면에(여러 장 · 물량은 그대로) · '손' = 도면 근거 없이 손으로 세운 것
       소장님 «도면함에서 도면을 체크하면 그 도면만 나오게도 하고 싶어» · «도면 여러개를 체크하면 그 도면만 보게» · «체크된 도면만 보게» */
  const [체크보기, set체크보기] = useState(false)
  const [도면보기, set도면보기] = useState(null)        // null = 모두 · Set(평면 키 · '손')
  const 보임o = (o) => !도면보기 || (o.근거 && o.근거.키 ? 도면보기.has(o.근거.키) : 도면보기.has('손'))
  const [구간색, set구간색] = useState(false)          // ▭ G393 3D 를 구간 색으로
  const [확인들, set확인들] = useState(() => new Set())  // 🟩 G393 둘러보기에서 확인한 부재 — 걷는 동안 3D 초록            // 🧾 G393 층별 대조에서 고른 빨간 곳(M.빠짐 번호) — 평면 · 3D 에 밝게
  const [확인비, set확인비] = useState(() => new Map())   // 🧭 층 → 둘러보기 확인 비율(길잡이)
  useEffect(() => { if (걷기요청 && M.부재.length && !걷기) set걷기(true) }, [걷기요청])  // eslint-disable-line react-hooks/exhaustive-deps
  const 길 = useMemo(() => (작업 ? 길잡이(M, { 도면: 도면결과, 확인: 확인비, 엑셀: 엑셀받음 }) : []), [작업, M, 도면결과, 확인비, 엑셀받음])
  const 위층 = M.층.filter((f) => !FT층(f)).map((f) => f.이름)
  const 맨아래 = 위층[0]
  const 이층 = M.부재.filter((o) => o.층 === 층)
  const 종 = ['기둥', '보', '벽', '슬라브', '기초', '계단'].includes(도구) ? 도구 : null
  const 부호목록 = 종 ? M.배근[종].map((r) => r.기호).filter(Boolean) : []
  const 지금부호 = 종 ? (부호목록.includes(부호[종]) ? 부호[종] : 부호목록[0] || '') : ''
  const 세움 = (N) => { setM(N); 한번세기('|골조모델|세움') }
  const xs = M.통심.x, ys = M.통심.y

  /* 누르기 */
  const 점누름 = (xid, yid) => {
    if (도구 === '기둥' || 도구 === '기초') { if (!지금부호) return; 세움((P) => 기둥넣기(P, 층, 지금부호, xid, yid, 도구)); return }
    if (도구 === '보' || 도구 === '벽') {
      if (!지금부호) return
      if (!첫점) { set첫점([xid, yid]); return }
      if (첫점[0] === xid && 첫점[1] === yid) { set첫점(null); return }
      if (첫점[0] !== xid && 첫점[1] !== yid) {
        if (!빗그리기) { set첫점([xid, yid]); return }
        /* 🧭 G395 비스듬한 보 · 벽 — 두 교점 자리(mm)를 두 끝으로 */
        const X = (id) => (M.통심.x.find((g) => g.id === id) || {}).자리, Y = (id) => (M.통심.y.find((g) => g.id === id) || {}).자리
        const a = 첫점
        세움((P) => 사선넣기(P, 도구, 층, 지금부호, [X(a[0]), Y(a[1])], [X(xid), Y(yid)]))
        한번세기('|골조모델|비스듬')
        set첫점([xid, yid])
        return
      }
      const a = 첫점
      세움((P) => 선넣기(P, 도구, 층, 지금부호, a, [xid, yid]))
      set첫점([xid, yid])            // 이어 그리기
    }
  }
  const 칸누름 = (x0, y0, x1, y1) => {
    if (도구 === '슬라브' && 지금부호) 세움((P) => 칸넣기(P, 층, 지금부호, x0, y0, x1, y1))
    /* 🪜 G393 계단 — 누른 칸 = 오르는 판 자리(긴 쪽으로 오름 · 판 2) · 길이 · 폭 · 참 · 단수는 오른쪽에서 */
    if (도구 === '계단' && 지금부호) { const N = 계단넣기(M, 층, 지금부호, x0, y0, x1, y1); if (N !== M) { setM(N); 한번세기('|골조모델|계단'); const 새 = N.부재[N.부재.length - 1]; if (새 && 새.종류 === '계단') set고른(새.id) } }
  }
  /* ✋ G393 옮기기 — 평면에서 부재를 눌러 끌기(마우스 · 손가락) · 놓으면 통심에 붙여 옮김 */
  const [끌기, set끌기] = useState(null)               // {id, x0, y0, dx, dy}(mm)
  const svg점 = (e) => { const el = svgRef.current; if (!el || !el.getScreenCTM) return null; const pt = el.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(el.getScreenCTM().inverse()); return [q.x, -q.y] }
  const 끌시작 = (e) => {
    if (도구 === '구간') {          // ▭ G393 구간 — 빈 곳 어디서나 끌어 네모
      const p0 = svg점(e); if (!p0) return
      e.preventDefault()
      try { svgRef.current.setPointerCapture(e.pointerId) } catch (er) { /* 무시 */ }
      set끌기({ 구간: true, x0: p0[0], y0: p0[1], dx: 0, dy: 0 }); return
    }
    if (도구 !== '옮기기') return
    const t = e.target && e.target.closest ? e.target.closest('[data-mid]') : null
    if (!t || t.getAttribute('data-ghost')) return
    const p0 = svg점(e); if (!p0) return
    e.preventDefault()
    try { svgRef.current.setPointerCapture(e.pointerId) } catch (er) { /* 무시 */ }
    set끌기({ id: Number(t.getAttribute('data-mid')), x0: p0[0], y0: p0[1], dx: 0, dy: 0 })
  }
  const 끌중 = (e) => { if (!끌기) return; const p = svg점(e); if (p) set끌기((k) => (k ? { ...k, dx: p[0] - k.x0, dy: p[1] - k.y0 } : k)) }
  const 붙이기 = (v, 줄들) => { const g = 줄들.reduce((m, x) => (Math.abs(x.자리 - v) < Math.abs((m ? m.자리 : Infinity) - v) ? x : m), null); return g && Math.abs(g.자리 - v) <= 400 ? g.자리 : Math.round(v / 50) * 50 }
  const 끌끝 = () => {
    if (!끌기) return
    const k = 끌기; set끌기(null)
    if (k.구간) {
      const 판 = [붙이기(k.x0, xs), 붙이기(k.y0, ys), 붙이기(k.x0 + k.dx, xs), 붙이기(k.y0 + k.dy, ys)]
      const N = 구간넣기(M, 판)
      if (N !== M) { setM(N); 한번세기('|골조모델|구간') }
      return
    }
    const N = 부재옮기기(M, k.id, k.dx, k.dy)
    if (N !== M) { setM(N); set고른(k.id); 한번세기('|골조모델|옮기기') } else set고른(k.id)
  }
  const 부재누름 = (o, e) => {
    if (도구 === '지우기') { e.stopPropagation(); setM((P) => 부재빼기(P, o.id)); if (고른 === o.id) set고른(null); return }
    if (도구 === '고르기') { e.stopPropagation(); set고른(o.id) }
  }
  /* 한꺼번에 */
  const 모두 = (무엇) => {
    if (!지금부호 && 무엇 !== '지움') return
    /* 🔧 G393 «모든 교점 · 모든 통심» 은 도면 통심(X1 · Y1 …)에만 — 보조 통심(«X1+3600» 꼴 · 도면에서 세울 때 수백 줄 생김)까지 넣으면 기둥이 1만 개(소장님 화면 멈춤) · 많으면 먼저 물음 */
    const 본 = (줄) => { const b = 줄.filter((g) => !(String(g.이름 || '').length > 3 && /[+−-]\d+$/.test(String(g.이름 || '')))); return b.length ? b : 줄 }
    const 본X = 본(M.통심.x), 본Y = 본(M.통심.y)
    const 몇 = 무엇 === '교점' ? 본X.length * 본Y.length : 무엇 === '모든줄' ? 본X.length + 본Y.length : 0
    if (몇 > 200 && !window.confirm('도면 통심 ' + 본X.length + ' × ' + 본Y.length + ' 줄 — ' + 몇.toLocaleString('ko-KR') + (무엇 === '교점' ? '곳 교점마다 ' : '줄마다 ') + 지금부호 + ' 을(를) 세웁니다. 많습니다 — 할까요?')) return
    setM((P) => {
      let N = P
      const 본x = new Set(본X.map((g) => g.id)), 본y = new Set(본Y.map((g) => g.id))
      const X = P.통심.x.map((g) => g.id).filter((id) => 본x.has(id)), Y = P.통심.y.map((g) => g.id).filter((id) => 본y.has(id))
      if (무엇 === '교점') for (const x of X) for (const y of Y) N = 기둥넣기(N, 층, 지금부호, x, y, 도구)
      if (무엇 === '기둥밑') for (const o of P.부재.filter((u) => u.종류 === '기둥' && u.층 === 맨아래)) N = 기둥넣기(N, 층, 지금부호, o.점[0], o.점[1], '기초')
      if (무엇 === '둘레') { for (const y of [Y[0], Y[Y.length - 1]]) N = 선넣기(N, 도구, 층, 지금부호, [X[0], y], [X[X.length - 1], y]); for (const x of [X[0], X[X.length - 1]]) N = 선넣기(N, 도구, 층, 지금부호, [x, Y[0]], [x, Y[Y.length - 1]]) }
      if (무엇 === '모든줄') { for (const y of Y) N = 선넣기(N, 도구, 층, 지금부호, [X[0], y], [X[X.length - 1], y]); for (const x of X) N = 선넣기(N, 도구, 층, 지금부호, [x, Y[0]], [x, Y[Y.length - 1]]) }
      if (무엇 === '칸') N = 칸넣기(N, 층, 지금부호, X[0], Y[0], X[X.length - 1], Y[Y.length - 1])
      if (무엇 === '지움') N = { ...N, 부재: N.부재.filter((o) => o.층 !== 층) }
      return N
    })
    if (무엇 !== '지움') 한번세기('|골조모델|세움')
  }
  const [복사받을, set복사받을] = useState([])
  const 복사하기 = () => {
    const 받을 = 복사받을.filter((f) => f !== 층)
    if (!받을.length) return
    const n = M.부재.filter((o) => 받을.includes(o.층) && o.종류 !== '기초').length
    if (n && !window.confirm(받을.join(' · ') + '층에 있던 기둥 · 보 · 벽 · 슬라브 ' + n + '개는 지우고 ' + 층 + '층 것으로 바꿉니다. 할까요?')) return
    setM((P) => 층복사(P, 층, 받을))
    set복사받을([])
    세기('|골조모델|층복사')
  }

  /* 평면 크기(mm) */
  const X0 = xs[0] ? xs[0].자리 : 0, X1 = xs.length ? xs[xs.length - 1].자리 : 1000
  const Y0 = ys[0] ? ys[0].자리 : 0, Y1 = ys.length ? ys[ys.length - 1].자리 : 1000
  const 폭 = Math.max(X1 - X0, 1000), 높 = Math.max(Y1 - Y0, 1000)
  const 큰 = Math.max(폭, 높)
  const 여 = 큰 * 0.12 + 800
  /* 🟥 G393 빨간 곳을 고르면 평면을 그 자리로 크게(±3 m) — «⤢ 평면 전체» 로 돌아옴 · 글 · 점 크기는 보이는 넓이에 맞춤 */
  const [평면확대, set평면확대] = useState(null)
  useEffect(() => { set평면확대(null) }, [층])
  const 보는큰 = 평면확대 ? Math.max(평면확대[2] - 평면확대[0], 평면확대[3] - 평면확대[1]) : 큰
  const r점 = 보는큰 / 90 + 60, 글크기 = 보는큰 / 38 + 120
  /* 📐 G389 보조 통심 — 이름이 «X1+3600» 꼴(도면에서 옮길 때 생김) · 글은 «+3600» 만 작게 · 이웃 글과 겹치면 줄만 */
  const 보조줄 = (g) => String(g.이름 || '').length > 3 && /[+−-]\d+$/.test(String(g.이름 || ''))
  const 보조글 = (t) => { const m = String(t).match(/([+−-]\d+)$/); return m ? m[1] : t }
  const 글자리 = (줄, 틈) => { const s = new Set(); let 앞 = -Infinity; for (const g of 줄) { if (!보조줄(g)) { 앞 = g.자리; continue } if (g.자리 - 앞 >= 틈) { s.add(g.id); 앞 = g.자리 } } return s }
  const x글 = 글자리(xs, 글크기 * 2.4), y글 = 글자리(ys, 글크기 * 0.9)
  /* 🔧 G393 누르는 점 — 교점이 너무 많으면(도면에서 세워 보조 통심이 수백 줄) 도면 통심 교점만(평면이 파랗게 덮이고 무거워짐) */
  const 많음 = xs.length * ys.length > 900
  const 점xs = 많음 ? xs.filter((g) => !보조줄(g)) : xs, 점ys = 많음 ? ys.filter((g) => !보조줄(g)) : ys
  /* 📱 누르는 자리 — 화면에서 손가락 크기(반지름 14px)는 되게(폰에서 평면이 작아져도) */
  const svgRef = useRef(null)
  const [판px, set판px] = useState(600)
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => { const w = el.getBoundingClientRect().width; if (w > 0) set판px(w) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const r누름 = Math.max(r점, 14 * (평면확대 ? 보는큰 : 폭 + 2 * 여) / Math.max(판px, 1))
  const vb = (평면확대 ? [평면확대[0], -평면확대[3], 평면확대[2] - 평면확대[0], 평면확대[3] - 평면확대[1]] : [X0 - 여, -(Y1 + 여), 폭 + 2 * 여, 높 + 2 * 여]).join(' ')
  const 자리X = (id) => (xs.find((g) => g.id === id) || {}).자리, 자리Y = (id) => (ys.find((g) => g.id === id) || {}).자리
  const G = S && S.G ? S.G.기 : new Map()
  const 일 = (종류, 기호) => (M.배근[종류] || []).find((r) => String(r.기호) === String(기호)) || {}
  const 아래기둥 = 층 === M.층[0].이름 ? M.부재.filter((o) => o.종류 === '기둥' && o.층 === 맨아래) : M.부재.filter((o) => o.종류 === '기둥' && o.층 === 위층[위층.indexOf(층) - 1])
  const 그림 = (o, 흐림) => {
    const g = G.get(o.id)
    const 색 = rgb(종류색[o.종류])
    const on = o.id === 고른
    const cls = 'gmd-m' + (on ? ' on' : '') + (흐림 ? ' ghost' : '')
    const 손 = 흐림 ? undefined : (e) => 부재누름(o, e)
    const 집기 = 도구 === '고르기' || 도구 === '지우기' || 도구 === '옮기기'
    if (o.종류 === '계단' && Array.isArray(o.판) && o.판.length >= 3) {     // 🪜 G393 계단 — 오르는 판 자리 + 판마다 대각선(평면 계단 표시) · 참은 점선 · 제안은 노랗게
      const xs2 = o.판.map((q) => +q[0]), ys2 = o.판.map((q) => +q[1])
      const a = Math.min(...xs2), c = Math.max(...xs2), b = Math.min(...ys2), d = Math.max(...ys2)
      const 가 = g ? g.가로 : c - a >= d - b, n = g ? g.판수 : Math.max(1, Math.trunc(+o.판수 || 2))
      const 선들 = []
      for (let k = 0; k < n; k++) { if (가) { const y0 = b + ((d - b) * k) / n, y1 = b + ((d - b) * (k + 1)) / n; 선들.push([a, y0, c, y1]); if (k) 선들.push([a, y0, c, y0]) } else { const x0 = a + ((c - a) * k) / n, x1 = a + ((c - a) * (k + 1)) / n; 선들.push([x0, b, x1, d]); if (k) 선들.push([x0, b, x0, d]) } }
      const 둘 = S && S.덩어리 ? (S.덩어리.find((x) => x.id === o.id) || {}).판 : null
      return (
        <g key={o.id} className={cls + ' st' + (o.제안 ? ' prop' : '')} onClick={손} data-k={'계단' + o.id}>
          {둘 && <polygon className="gmd-st-land" points={둘.map((q) => q[0] + ',' + (-q[1])).join(' ')} />}
          <rect x={a} y={-d} width={c - a} height={d - b} fill={o.제안 ? 'rgba(245,199,46,.28)' : 'rgba(92,168,117,.22)'} stroke={o.제안 ? '#d89b00' : 색} />
          {선들.map((l, i) => <line key={i} x1={l[0]} y1={-l[1]} x2={l[2]} y2={-l[3]} stroke={o.제안 ? '#d89b00' : 색} />)}
          <text x={(a + c) / 2} y={-(b + d) / 2} fontSize={글크기 * 0.7} textAnchor="middle" dominantBaseline="middle">{o.부호}</text>
        </g>
      )
    }
    if (o.종류 === '기초' && Array.isArray(o.판) && o.판.length >= 3) {     // 🟨 G392 자유 모양 기초(MAT) — 제안은 노랗게
      return <polygon key={o.id} className={cls + ' ft' + (o.제안 ? ' prop' : '')} points={o.판.map((q) => q[0] + ',' + (-q[1])).join(' ')} fill={o.제안 ? 'rgba(245,199,46,.28)' : 'none'} stroke={o.제안 ? '#d89b00' : 색} onClick={손} data-k={'기초' + o.id} />
    }
    if (o.종류 === '기둥' || o.종류 === '기초') {
      if (!o.점) return null
      const x = 자리X(o.점[0]), y = 자리Y(o.점[1])
      if (x === undefined || y === undefined) return null
      const r = 일(o.종류, o.부호)
      let a = Number(r.가로) || Number(r.지름) || 500, b = Number(r.세로) || a
      if (o.돌림) [a, b] = [b, a]
      if (o.종류 === '기둥' && Number(r.지름) > 0) return <circle key={o.id} className={cls} cx={x} cy={-y} r={Number(r.지름) / 2} fill={색} onClick={손} />
      return <rect key={o.id} className={cls + (o.종류 === '기초' ? ' ft' : '')} x={x - a / 2} y={-y - b / 2} width={a} height={b} fill={o.종류 === '기초' ? 'none' : 색} stroke={색} onClick={손} />
    }
    /* 🧭 G395 비스듬한 보 · 벽 — 받침 면 사이 띠(셈과 같은 모양) · 제안은 노랗게 */
    const 빗 = (o.종류 === '보' || o.종류 === '벽') ? 사선끝(M, o) : null
    if (빗) {
      const r = 일(o.종류, o.부호)
      const w = Number(o.종류 === '보' ? r.폭 : r.두께) || 300
      const P = g && g.판 ? g.판 : 띠판(빗[0], 빗[1], w)
      return <g key={o.id} className={cls + ' slant' + (o.제안 ? ' prop' : '')} onClick={손} data-k={o.종류 + o.id}><polygon points={P.map((q) => q[0] + ',' + (-q[1])).join(' ')} fill={o.제안 ? 'rgba(245,199,46,.55)' : 색} stroke={o.제안 ? '#d89b00' : 'none'} />{!흐림 && 집기 && <line className="gmd-hitl" x1={빗[0][0]} y1={-빗[0][1]} x2={빗[1][0]} y2={-빗[1][1]} />}</g>
    }
    if (o.종류 === '보' || o.종류 === '벽') {
      const ax = 자리X(o.점[0]), ay = 자리Y(o.점[1]), bx = 자리X(o.끝[0]), by = 자리Y(o.끝[1])
      if ([ax, ay, bx, by].some((v) => v === undefined)) return null
      const r = 일(o.종류, o.부호)
      const w = Number(o.종류 === '보' ? r.폭 : r.두께) || 300
      const s0 = g && g.좌 ? g.좌.값 : 0, s1 = g && g.우 ? g.우.값 : 0
      /* 📱 가는 보 · 벽도 손가락으로 집히게 — 가운데 줄을 따라 보이지 않는 굵은 선(화면 18px) */
      if (ay === by) {
        const x0 = Math.min(ax, bx) + s0, x1 = Math.max(ax, bx) - s1
        return <g key={o.id} className={cls} onClick={손} data-k={o.종류 + o.id}><rect x={x0} y={-ay - w / 2} width={Math.max(x1 - x0, 1)} height={w} fill={색} />{!흐림 && 집기 && <line className="gmd-hitl" x1={x0} y1={-ay} x2={x1} y2={-ay} />}</g>
      }
      const y0 = Math.min(ay, by) + s0, y1 = Math.max(ay, by) - s1
      return <g key={o.id} className={cls} onClick={손} data-k={o.종류 + o.id}><rect x={ax - w / 2} y={-y1} width={w} height={Math.max(y1 - y0, 1)} fill={색} />{!흐림 && 집기 && <line className="gmd-hitl" x1={ax} y1={-y0} x2={ax} y2={-y1} />}</g>
    }
    if (o.종류 === '슬라브') {
      const x0 = g ? g.X0 : Math.min(자리X(o.칸[0]), 자리X(o.칸[2])), x1 = g ? g.X1 : Math.max(자리X(o.칸[0]), 자리X(o.칸[2]))
      const y0 = g ? g.Y0 : Math.min(자리Y(o.칸[1]), 자리Y(o.칸[3])), y1 = g ? g.Y1 : Math.max(자리Y(o.칸[1]), 자리Y(o.칸[3]))
      if ([x0, x1, y0, y1].some((v) => v === undefined || Number.isNaN(v))) return null
      return (
        <g key={o.id} onClick={손} className={cls + ' slab'}>
          <rect x={x0} y={-y1} width={x1 - x0} height={y1 - y0} fill={색} />
          <text x={(x0 + x1) / 2} y={-(y0 + y1) / 2} fontSize={글크기 * 0.8} textAnchor="middle" dominantBaseline="middle">{o.부호}</text>
        </g>
      )
    }
    return null
  }
  const 차례 = { 슬라브: 0, 기초: 1, 계단: 2, 보: 3, 벽: 4, 기둥: 5 }   /* 벽은 보 밑에 있어도 보이게 보 위에 그림 */
  const 판부재 = [...이층].filter(보임o).sort((a, b) => 차례[a.종류] - 차례[b.종류])   // 👁 G433 체크한 도면만
  const 첫xy = 첫점 ? [자리X(첫점[0]), 자리Y(첫점[1])] : null

  /* ── 3D ── */
  const 판Ref = useRef(null), 보기Ref = useRef(null), 맞춤 = useRef(false)
  const 덩 = S && S.덩어리 ? S.덩어리 : []
  const 구간어디 = useMemo(() => (S && !S.오류 && M.구간 && M.구간.length ? 구간물량(M, S).어디 : null), [S, M.구간])  // eslint-disable-line react-hooks/exhaustive-deps
  /* 🚶 G390 둘러보기 — 맨 아래층 · 기초에서는 땅(바닥 판)을 그 층 바닥 높이로(사람이 허공에 뜨지 않게) */
  const 걷는바닥 = useMemo(() => {
    if (!걷기 || !작업) return undefined
    try { const H = 층높이(M); const k = M.층.findIndex((x) => x.이름 === 층), km = M.층.findIndex((x) => x.이름 === H.맨아래); return k <= km ? 층판(덩, H, 층).바닥 * 1000 : undefined } catch (e) { return undefined }
  }, [걷기, 작업, 층, M, 덩])  // eslint-disable-line react-hooks/exhaustive-deps
  /* 🚶 G390 도면에서 못 옮긴 것(M.빠짐) — 3D 에 빨갛게 비쳐(고르기 안 됨) · 그 층 높이에 */
  const 빠짐덩 = useMemo(() => {
    if (!M.빠짐 || !M.빠짐.length) return []
    let H = null
    try { H = 층높이(M) } catch (e) { return [] }
    const 보일층들 = 보일층 === '모두' ? null : 보일층 === '이층' || 보일층 === '벗김' ? new Set([층]) : new Set(M.층.slice(0, M.층.findIndex((f) => f.이름 === 층) + 1).map((f) => f.이름))
    const out = []
    M.빠짐.forEach((x, k) => {
      const f = H.표.get(x.층)
      if (!f || (보일층들 && !보일층들.has(x.층))) return
      if (도면보기 && !(x.키 ? 도면보기.has(x.키) : 도면보기.has('손'))) return          // 👁 G433 체크한 도면의 빨간 곳만
      const 높 = Math.max(+x.높 || 0, 50)
      let z0, z1
      if (x.종류 === '보' || x.종류 === '슬라브') { z1 = f.FT ? 0 : f.z1; z0 = z1 - 높 }
      else if (x.종류 === '기초') { z1 = f.FT ? f.z0 : f.z0; z0 = z1 - 높 }
      else { z0 = f.FT ? f.z0 : f.z0; z1 = z0 + Math.min(높, (f.층고 || 높) + 10) }
      out.push({ id: 2000000 + k, 판: x.판, z0, z1, 색: 빨고름 === k ? [1, 0.05, 0.05] : [0.93, 0.22, 0.2], 비침: 빨고름 === k ? 0.85 : 0.42 })
    })
    return out
  }, [M, 보일층, 층, 빨고름, 도면보기])  // eslint-disable-line react-hooks/exhaustive-deps
  const 보임id = useMemo(() => (도면보기 ? new Set(M.부재.filter(보임o).map((o) => o.id)) : null), [M, 도면보기])  // eslint-disable-line react-hooks/exhaustive-deps
  const 보일0 = useMemo(() => {
    if (보일층 === '모두') return 덩
    if (보일층 === '이층') return 덩.filter((d) => d.층 === 층)
    if (보일층 === '벗김') return 덩.filter((d) => d.층 === 층 && d.종류 !== '보' && d.종류 !== '슬라브')     // 🔍 G393 이 층 안이 보이게(천장 보 · 슬라브 빼고)
    const k = M.층.findIndex((f) => f.이름 === 층)
    const 들 = new Set(M.층.slice(0, k + 1).map((f) => f.이름))
    /* 🚶 G390 둘러보기(뒤에서) — 지금 층 천장(그 층 보 · 슬라브)은 걷어 내 위에서 사람이 보이게(눈으로 볼 때는 그대로) */
    if (걷기 && 작업 && !걷기눈) return 덩.filter((d) => 들.has(d.층) && !(d.층 === 층 && (d.종류 === '보' || d.종류 === '슬라브')))
    return 덩.filter((d) => 들.has(d.층))
  }, [덩, 보일층, 층, M.층, 걷기, 걷기눈, 작업])
  const 보일 = useMemo(() => (보임id ? 보일0.filter((d) => 보임id.has(d.id)) : 보일0), [보일0, 보임id])   // 👁 G433 체크한 도면만
  useEffect(() => {
    if (!판Ref.current) return
    if (!보기Ref.current) {
      try { 보기Ref.current = new 부재보기(판Ref.current) } catch (e) { setGlErr('이 브라우저는 3D(WebGL)를 그리지 못합니다 — 평면 세우기와 물량 · 엑셀은 그대로 쓸 수 있습니다.'); return }
      if (어두움()) { const v0 = 보기Ref.current; v0.bg = [0.086, 0.102, 0.129]; v0.bgT = [0.15, 0.17, 0.21]; v0.bgB = [0.06, 0.07, 0.09]; v0.선색 = [0.03, 0.04, 0.05]; v0.선알 = 0.6 }
      보기Ref.current.hi = [0.98, 0.62, 0.10]     /* 고른 부재 = 주황(보가 파래서 파란 칠이 안 보임 · 평면 고름과 같은 색) */
    }
    const v = 보기Ref.current
    /* 보 · 기둥 · 벽 윗면이 슬라브 밑면과 같은 높이라 겹친 면이 깜빡임 → 그림에서만 3 mm 낮춤(물량은 그대로) */
    const 초 = [0.30, 0.76, 0.42]
    const 구색 = (d) => {
      if (구간색 && 구간어디) { const k = 구간어디.get(d.id); return k >= 0 ? 구간색들[k % 구간색들.length] : [0.78, 0.79, 0.81] }
      if (걷기 && 작업 && 확인들.has(d.id) && !d.제안) return d.색.map((c, i) => c * 0.45 + 초[i] * 0.55)     // 🟩 확인한 부재는 초록 쪽으로
      return d.색
    }
    v.set부재([...보일.map((d) => ({ id: d.id, 판: d.판, z0: d.z0, z1: d.종류 === '슬라브' || d.종류 === '기초' ? d.z1 : d.z1 - 3, 색: 구색(d), ...(d.면 ? { 면: d.면, 선: d.선 } : {}) })), ...빠짐덩], { 바닥: true, 바닥색: 어두움() ? [0.16, 0.18, 0.22] : [0.86, 0.88, 0.90], 바닥z: 걷기 && 작업 ? 걷는바닥 : undefined })
    if (!맞춤.current && 보일.length) { v.fit('tilt'); 맞춤.current = true }
    v.set고름(고른 !== null ? [고른] : [])
    v.onPick = (id, e) => { if (걷기누름Ref.current) { 걷기누름Ref.current(id, e); return } if (id >= 0) { set고른(id); 한번세기('|골조모델|3D고름') } else set고른(null) }   // 🖱 둘러보기 중에는 «누른 곳으로 걷기»
  }, [보일, 빠짐덩, 걷는바닥, 구간색, 구간어디, 확인들, 걷기])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (보기Ref.current) 보기Ref.current.set고름(고른 !== null ? [고른] : []) }, [고른])
  /* 🖥 G388 바닥에 이 층 통심을 깖(3D 에서 지금 세우는 층 높이) — 도면 위에 세우듯 */
  const 바닥선 = useMemo(() => {
    if (!xs.length || !ys.length) return []
    let z = 0
    try { const h = 층높이(M).표.get(층); z = h ? (h.FT ? h.z0 : h.z0) : 0 } catch (e) { z = 0 }
    const 넉 = 큰 * 0.08 + 600, a = []
    for (const g of xs) a.push(g.자리, Y0 - 넉, z, g.자리, Y1 + 넉, z)
    for (const g of ys) a.push(X0 - 넉, g.자리, z, X1 + 넉, g.자리, z)
    return a
  }, [xs, ys, 층, M.층, X0, X1, Y0, Y1, 큰])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (보기Ref.current) 보기Ref.current.set배경(바닥선, 어두움() ? [0.55, 0.6, 0.68] : [0.3, 0.36, 0.45], 0.55) }, [바닥선, 보일])
  useEffect(() => () => { if (보기Ref.current) { 보기Ref.current.dispose(); 보기Ref.current = null } }, [])
  useEffect(() => { if (보기Ref.current) setTimeout(() => 보기Ref.current && 보기Ref.current.dirty(), 50) }, [크게])

  const 고른물량 = 고른것 && S && S.부재별 ? S.부재별.get(고른것.id) : null
  const 고른기하 = 고른것 ? G.get(고른것.id) : null
  const 도움말 = { 기둥: '통심 교점을 누르면 기둥', 기초: '통심 교점을 누르면 기초(기둥 밑)', 보: 첫점 ? (빗그리기 ? '다른 교점을 누르면 — 같은 줄이면 칸마다 보 · 아니면 ⟋ 비스듬한 보(끝은 받침 면까지)' : '같은 줄의 다른 교점을 누르면 그 사이 칸마다 보 — 이어서 누르면 계속') : '교점 하나를 누르고, 같은 줄의 다른 교점을 누릅니다' + (빗그리기 ? '(⟋ 비스듬히 — 아무 교점)' : ''), 벽: 첫점 ? (빗그리기 ? '다른 교점을 누르면 — 같은 줄이면 칸마다 벽 · 아니면 ⟋ 비스듬한 벽' : '같은 줄의 다른 교점을 누르면 그 사이 칸마다 벽') : '교점 하나를 누르고, 같은 줄의 다른 교점을 누릅니다' + (빗그리기 ? '(⟋ 비스듬히 — 아무 교점)' : ''), 슬라브: '통심 사이 칸을 누르면 슬라브', 계단: '통심 사이 칸을 누르면 그 칸에 계단(오르는 판 자리 · 긴 쪽으로 오름 · 판 2) — 길이 · 폭 · 참 · 단수는 오른쪽에서', 고르기: '부재를 누르면 크기 · 물량', 옮기기: '부재를 눌러 끌면 옮겨집니다 — 가까운 통심(10 cm 안)에 붙고 없으면 그 자리에 보조 통심 · 나눈 보 · 벽도 한 토막만 떼어 옮김', 구간: '평면에서 네모를 끌어 구간을 긋습니다(팀별 · 기성 — 가까운 통심에 붙음 · 모든 층 같은 자리) · 이름 · 물량은 오른쪽 «▭ 구간별 물량»', 지우기: '누른 부재를 지웁니다' }[도구]

  /* 🖥 G388 작업 화면 — 같은 조각을 왼쪽 도구 · 가운데 3D(크게) · 오른쪽 정보로 놓음(작업 = true) · 아니면 예전 차례 그대로 */
  const 도구판 = (
      <div className={'gmd-bar' + (작업 ? ' gmd-ws-tools' : '')}>
        <label className="gmd-kv">층 <select className="gmd-in" value={층} onChange={(e) => { set층(e.target.value); set고른(null) }}>
          {[...M.층].reverse().map((f) => <option key={f.이름} value={f.이름}>{FT층(f) ? 'FT (기초 · 지중보)' : f.이름 + '층'} · {M.부재.filter((o) => o.층 === f.이름).length}</option>)}
        </select></label>
        <span className="gmd-tools" role="group" aria-label="도구">
          {도구들.filter(([k]) => 쓸도구.includes(k)).map(([k, t]) => <button key={k} type="button" className={'gmd-tool' + (도구 === k ? ' on' : '')} aria-pressed={도구 === k} onClick={() => set도구(k)}>{t}</button>)}
        </span>
        {종 && (
          <label className="gmd-kv">부호 <select className="gmd-in" value={지금부호} onChange={(e) => set부호((P) => ({ ...P, [종]: e.target.value }))}>
            {부호목록.map((k) => <option key={k} value={k}>{k}</option>)}
          </select></label>
        )}
        {종 && !부호목록.length && <span className="gmd-warn">② 부호 일람에 {종} 부호를 먼저 적으십시오</span>}
      </div>
  )
  const 도움판 = (
      <div className="gmd-hint">{도움말}{첫점 && <button type="button" className="gmd-link" onClick={() => set첫점(null)}>그만</button>}</div>
  )
  const 한꺼번에판 = (<>
      {종 && 지금부호 && (
        <div className="gmd-bar small">
          <span className="muted">이 층 한꺼번에:</span>
          {(도구 === '기둥' || 도구 === '기초') && <button type="button" className="btn line sm" onClick={() => 모두('교점')}>모든 교점에 {지금부호}</button>}
          {도구 === '기초' && <button type="button" className="btn line sm" onClick={() => 모두('기둥밑')}>{맨아래}층 기둥 밑마다 {지금부호}</button>}
          {(도구 === '보' || 도구 === '벽') && <label className="gmd-check-l" title="켜면 가로 · 세로가 다른 두 교점을 누를 때 비스듬한 보 · 벽(끝은 기둥 · 보 · 벽 면까지 비스듬히)"><input type="checkbox" checked={빗그리기} onChange={(e) => set빗그리기(e.target.checked)} /> ⟋ 비스듬히</label>}
          {(도구 === '보' || 도구 === '벽') && <><button type="button" className="btn line sm" onClick={() => 모두('둘레')}>바깥 둘레에 {지금부호}</button><button type="button" className="btn line sm" onClick={() => 모두('모든줄')}>모든 통심에 {지금부호}</button></>}
          {도구 === '슬라브' && <button type="button" className="btn line sm" onClick={() => 모두('칸')}>모든 칸에 {지금부호}</button>}
        </div>
      )}
  </>)
  const 평면판 = (
        <div className="gmd-plan">
          {평면확대 && <button type="button" className="btn line sm gmd-planall" onClick={() => { set평면확대(null); set빨고름(null) }}>⤢ 평면 전체</button>}
          <svg ref={svgRef} viewBox={vb} className={'gmd-svg tool-' + 도구 + (끌기 ? ' dragging' : '')} role="img" aria-label={층 + '층 평면'} onPointerDown={끌시작} onPointerMove={끌중} onPointerUp={끌끝} onPointerCancel={() => set끌기(null)}>
            {/* 칸(슬라브 누르기) */}
            {도구 === '슬라브' && xs.slice(0, -1).map((gx, i) => ys.slice(0, -1).map((gy, j) => (
              <rect key={gx.id + gy.id} className="gmd-cell" x={gx.자리} y={-ys[j + 1].자리} width={xs[i + 1].자리 - gx.자리} height={ys[j + 1].자리 - gy.자리} onClick={() => 칸누름(gx.id, gy.id, xs[i + 1].id, ys[j + 1].id)} />
            )))}
            {/* 통심 */}
            {/* 📐 G389 보조 통심(도면에서 옮길 때 생긴 «X1+3600» 꼴 · 긴 이름) — 점선 · 작은 글 · 이웃 글과 겹치면 글은 빼고 줄만 */}
            {xs.map((g) => { const 보 = 보조줄(g); const 글보임 = !보 || x글.has(g.id); return <g key={g.id}><line className={'gmd-gl' + (보 ? ' aux' : '')} x1={g.자리} y1={-(Y1 + 여 * 0.55)} x2={g.자리} y2={-(Y0 - 여 * 0.55)} />{!보 && <circle className="gmd-gb" cx={g.자리} cy={-(Y1 + 여 * 0.7)} r={글크기 * 0.9} />}{글보임 && <text className={'gmd-gt' + (보 ? ' aux' : '')} x={g.자리} y={-(Y1 + 여 * (보 ? 0.45 : 0.7))} fontSize={보 ? 글크기 * 0.62 : 글크기} textAnchor="middle" dominantBaseline="central">{보 ? 보조글(g.이름) : g.이름}</text>}</g> })}
            {ys.map((g) => { const 보 = 보조줄(g); const 글보임 = !보 || y글.has(g.id); return <g key={g.id}><line className={'gmd-gl' + (보 ? ' aux' : '')} x1={X0 - 여 * 0.55} y1={-g.자리} x2={X1 + 여 * 0.55} y2={-g.자리} />{!보 && <circle className="gmd-gb" cx={X0 - 여 * 0.7} cy={-g.자리} r={글크기 * 0.9} />}{글보임 && <text className={'gmd-gt' + (보 ? ' aux' : '')} x={X0 - 여 * (보 ? 0.6 : 0.7)} y={-g.자리} fontSize={보 ? 글크기 * 0.62 : 글크기} textAnchor="middle" dominantBaseline="central">{보 ? 보조글(g.이름) : g.이름}</text>}</g> })}
            {/* 아래층 기둥(흐리게) */}
            {아래기둥.map((o) => 그림(o, true))}
            {판부재.map((o) => <g key={o.id} data-mid={o.id} transform={끌기 && 끌기.id === o.id ? 'translate(' + 끌기.dx + ',' + (-끌기.dy) + ')' : undefined} className={끌기 && 끌기.id === o.id ? 'gmd-dragg' : undefined}>{그림(o, false)}</g>)}
            {/* ▭ G393 구간(모든 층 같은 자리) · 긋는 중 네모 */}
            {(M.구간 || []).map((z, i) => { const c = 구간색들[i % 구간색들.length].map((v) => Math.round(v * 255)).join(','); return (
              <g key={z.id} className="gmd-zone" data-zone={z.id}>
                <rect x={z.판[0]} y={-z.판[3]} width={z.판[2] - z.판[0]} height={z.판[3] - z.판[1]} style={{ fill: 'rgba(' + c + ',.10)', stroke: 'rgb(' + c + ')' }} />
                <text x={z.판[0] + 글크기 * 0.4} y={-z.판[3] + 글크기 * 1.1} fontSize={글크기 * 0.85} style={{ fill: 'rgb(' + c + ')' }}>▭ {z.이름}</text>
              </g>) })}
            {끌기 && 끌기.구간 && <rect className="gmd-zone-new" x={Math.min(끌기.x0, 끌기.x0 + 끌기.dx)} y={-Math.max(끌기.y0, 끌기.y0 + 끌기.dy)} width={Math.abs(끌기.dx)} height={Math.abs(끌기.dy)} />}
            {/* 🪜 계단 칸은 부재 위에(슬라브가 깔린 칸에도 계단을 놓게) */}
            {도구 === '계단' && 점xs.slice(0, -1).map((gx, i) => 점ys.slice(0, -1).map((gy, j) => (
              <rect key={'st' + gx.id + gy.id} className="gmd-cell st" x={gx.자리} y={-점ys[j + 1].자리} width={점xs[i + 1].자리 - gx.자리} height={점ys[j + 1].자리 - gy.자리} onClick={() => 칸누름(gx.id, gy.id, 점xs[i + 1].id, 점ys[j + 1].id)} />
            )))}
            {끌기 && !끌기.구간 && <text className="gmd-dragtxt" x={끌기.x0 + 끌기.dx} y={-(끌기.y0 + 끌기.dy) - 글크기 * 1.2} fontSize={글크기 * 0.8} textAnchor="middle">{(끌기.dx >= 0 ? '→ ' : '← ') + Math.abs(Math.round(끌기.dx / 5) * 5) + ' · ' + (끌기.dy >= 0 ? '↑ ' : '↓ ') + Math.abs(Math.round(끌기.dy / 5) * 5) + ' mm'}</text>}
            {/* 🟥 G393 빨간 곳(도면에서 못 옮긴 것 — 손으로) — 평면에도 · 고르면 밝게 */}
            {(M.빠짐 || []).map((x, k) => (x.층 === 층 && Array.isArray(x.판) ? (
              <g key={'red' + k} className={'gmd-redspot' + (빨고름 === k ? ' on' : '')} data-red={k}>
                <polygon points={x.판.map((q) => q[0] + ',' + (-q[1])).join(' ')} />
                {빨고름 === k && <circle className="gmd-redring" cx={x.판.reduce((a, q) => a + +q[0], 0) / x.판.length} cy={-x.판.reduce((a, q) => a + +q[1], 0) / x.판.length} r={Math.max(글크기 * 2.2, 500)} />}
                <text dy={-글크기 * 1.1} x={x.판.reduce((a, q) => a + +q[0], 0) / x.판.length} y={-x.판.reduce((a, q) => a + +q[1], 0) / x.판.length} fontSize={글크기 * 0.7} textAnchor="middle" dominantBaseline="middle">🟥 {x.기호 || x.종류}</text>
              </g>) : null))}
            {/* 교점 */}
            {(도구 === '기둥' || 도구 === '기초' || 도구 === '보' || 도구 === '벽') && 점xs.map((gx) => 점ys.map((gy) => (
              <g key={gx.id + gy.id} className="gmd-nodeg" onClick={() => 점누름(gx.id, gy.id)} data-node={gx.이름 + '-' + gy.이름}>
                <circle className="gmd-hit" cx={gx.자리} cy={-gy.자리} r={r누름} />
                <circle className={'gmd-node' + (첫점 && 첫점[0] === gx.id && 첫점[1] === gy.id ? ' first' : '')} cx={gx.자리} cy={-gy.자리} r={r점} />
              </g>
            )))}
            {첫xy && <circle className="gmd-first" cx={첫xy[0]} cy={-첫xy[1]} r={r점 * 1.8} />}
          </svg>
          <div className="gmd-legend">{['기둥', '보', '벽', '슬라브', '기초', '계단'].map((k) => <span key={k}><i style={{ background: rgb(종류색[k]) }} />{k} {이층.filter((o) => o.종류 === k).length}</span>)}</div>
        </div>
  )
  const 삼차원판 = (
        <div className="gmd-3d">
          <div className="gmd-bar small">
            <select className="gmd-in" value={보일층} onChange={(e) => set보일층(e.target.value)} aria-label="3D 에 보일 층">
              <option value="모두">3D: 모든 층</option><option value="까지">3D: 이 층까지</option><option value="이층">3D: 이 층만</option><option value="벗김">3D: 이 층(천장 빼고)</option>
            </select>
            {보일층 === '까지' && M.층.length > 1 && M.층[M.층.length - 1].이름 === 층 && <span className="muted gmd-topnote">맨 위층이라 «모든 층» 과 같음 — 이 층만 보려면 «이 층만»</span>}{/* 🔧 G430 소장님 「이층만해도, 모든층해도 다 똑같아」(PH 에서) */}
            <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.fit('tilt')}>↗</button>
            <button type="button" className="btn line sm" onClick={() => 보기Ref.current && 보기Ref.current.fit('top')}>⬇ 위</button>
            <button type="button" className={'btn line sm gmd-bigbtn' + (크게 ? ' on' : '')} onClick={() => set크게((v) => !v)}>{크게 ? '⊟ 작게' : '⛶ 크게'}</button>
          </div>
          <div className="bim-canvas gmd-canvas">
            {glErr ? <div className="dx3-warn" style={{ margin: 12 }}>{glErr}</div> : <canvas ref={판Ref} />}
            {걷기 && 작업 && 보기Ref.current && S && !S.오류 ? <둘러보기판 보기Ref={보기Ref} 누름Ref={걷기누름Ref} M={M} S={S} 층={층} set층={set층} 고른={고른} set고른={set고른} setM={setM} 끝내기={() => set걷기(false)} on눈={set걷기눈} on확인={set확인비} on확인들={set확인들} />
              : <div className="bim-hint">끌기 = 돌리기 · 오른쪽 끌기(두 손가락) = 옮기기 · 휠(벌리기) = 확대 · <b>누르기 = 물량</b>{M.빠짐 && M.빠짐.length ? <> · <span className="gwk-red">빨강 = 도면에서 못 옮긴 것 {M.빠짐.length}곳</span></> : null}</div>}
          </div>
        </div>
  )
  const 고름판 = (<>
      {고른것 && (
        <div className="gmd-pick">
          <div className="gmd-pick-h">
            <b>{고른것.층 === 'FT' ? 'FT' : 고른것.층 + '층'} {고른것.종류} {고른것.부호}</b> <span className="muted">{부재글(M, 고른것)}</span>
            <button type="button" className="gmd-link gmd-zoom" title="3D 에서 이 부재로 크게" onClick={() => { const d = 덩.find((x) => x.id === 고른것.id); if (!d || !보기Ref.current) return; const xs2 = d.판.map((q) => q[0]), ys2 = d.판.map((q) => q[1]); const m = 2500; if (보기 === '평면') set보기('나란히'); if (고른것.종류 !== '보' && 고른것.종류 !== '슬라브' && !FT층(M.층.find((f) => f.이름 === 고른것.층))) set보일층('벗김'); setTimeout(() => { try { 보기Ref.current.fit('tilt', [(Math.min(...xs2) - m) / 1000, (Math.min(...ys2) - m) / 1000, d.z0 / 1000, (Math.max(...xs2) + m) / 1000, (Math.max(...ys2) + m) / 1000, d.z1 / 1000]) } catch (e) { /* 3D 없음 */ } }, 80); 한번세기('|골조모델|3D크게') }}>🔍 3D 크게</button>
            <button type="button" className="gmd-x" onClick={() => set고른(null)} aria-label="닫기">✕</button>
          </div>
          {고른물량 && (
            <div className="gmd-q">
              <span>콘크리트 <b>{수글(고른물량.콘크리트)}</b> ㎥</span>
              <span>거푸집 <b>{수글(고른물량.거푸집, 2)}</b> ㎡</span>
              <span>철근 <b>{수글(고른물량.철근 / 1000, 4)}</b> ton</span>
            </div>
          )}
          {고른기하 && (
            <div className="muted gmd-p">
              {고른기하.사선 && <>⟋ 비스듬 {고른기하.각}° · </>}
              {고른것.종류 === '보' && <>폭 {고른기하.W} × 춤 {고른기하.H} · 길이 {Math.round(고른기하.L)} − 왼쪽 {Math.round(고른기하.좌.값)}({고른기하.좌.무엇}) − 오른쪽 {Math.round(고른기하.우.값)}({고른기하.우.무엇}) = 안목 {Math.round(고른기하.안)} · 슬라브 {고른기하.S}</>}
              {고른것.종류 === '벽' && <>두께 {고른기하.T} · 길이 {Math.round(고른기하.L)} → {Math.round(고른기하.안)}(왼쪽 {고른기하.좌.무엇} · 오른쪽 {고른기하.우.무엇}) · 위 {고른기하.상부}({고른기하.상부까닭})</>}
              {고른것.종류 === '기둥' && <>{고른기하.원 ? '지름 ' + 고른기하.원 : 고른기하.a + ' × ' + 고른기하.b} · 슬라브 {고른기하.S}{고른기하.내림 ? ' · 내림 ' + 고른기하.내림 : ''} · 위층 {고른기하.연결 === 'R' ? '없음(최상층 정착)' : 고른기하.연결 + ' 와 이음'}{고른기하.기초 ? ' · 기초 ' + 고른기하.기초.o.부호 : ''}</>}
              {고른것.종류 === '슬라브' && <>{Math.round(고른기하.X1 - 고른기하.X0)} × {Math.round(고른기하.Y1 - 고른기하.Y0)} · 두께 {고른기하.t}{Object.values(고른기하.넓).some((v) => v > 0) ? ' · 옆 슬라브 없는 변은 보 · 벽 바깥 면까지' : ''}</>}
              {고른것.종류 === '계단' && <>{계단글(고른기하)} · 한 판 오름 {Math.round(고른기하.h2)} · 빗길이 {Math.round(고른기하.s)} · 참은 네모 앞뒤(점선)</>}
              {고른것.종류 === '기초' && (고른기하.판 ? <>자유 모양 {(고른기하.넓 / 1e6).toFixed(2)} ㎡ · 둘레 {(고른기하.둘 / 1000).toFixed(2)} m · 두께 {고른기하.t}{고른것.윗면 ? ' · 윗면 ' + 고른것.윗면 + '(MAT 밑)' : ''}</> : <>{고른기하.a} × {고른기하.b} × {고른기하.t}</>)}
              {(고른기하.높이 > 0) && <> · 높이 {고른기하.높이}(도면 단면 · 지붕)</>}
            </div>
          )}
          {/* 🟨 G392 건설맵 제안 — 확인 전(셈에는 들어감 · 노랗게) · 두께 · 철근 고치고 «✓ 이대로» 또는 «✕ 빼기» */}
          {고른것.제안 && (
            <div className="gmd-prop" aria-label="건설맵 제안">
              <b>🟨 건설맵 제안 — 확인 전</b> <span className="muted">{고른것.제안}</span>
              <div className="gmd-row gmd-wrap">
                {Array.isArray(고른것.판) && 고른것.종류 === '기초' && <label className="gmd-kv">두께 <input className="gmd-in num" inputMode="numeric" value={고른것.두께 ?? ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setM((P) => 부재고치기(P, 고른것.id, { 두께: v ? Number(v) : '' })) }} /> mm</label>}
                {고른것.종류 === '기초' && 고른물량 && !(고른물량.철근 > 0) && <label className="gmd-kv">철근(상 · 하부 양방향) <input className="gmd-in" placeholder="D19@200" onKeyDown={(e) => { if (e.key === 'Enter') { setM((P) => 기초철근넣기(P, 고른것.부호, e.currentTarget.value)); e.currentTarget.value = '' } }} onBlur={(e) => { if (e.currentTarget.value) { setM((P) => 기초철근넣기(P, 고른것.부호, e.currentTarget.value)); e.currentTarget.value = '' } }} /></label>}
                <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setM((P) => 제안확인(P, 고른것.id, 지금때())); 세기('|골조모델|제안확인') }}>✓ 이대로</button>
                <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setM((P) => 제안빼기(P, 고른것.id)); set고른(null); 세기('|골조모델|제안빼기') }}>✕ 빼기(빨강으로)</button>
              </div>
            </div>
          )}
          {/* 🪜 G393 계단 — 판 수 · 길이 · 폭 · 참 · 단수(비면 층고 ÷ 판 수 ÷ 단 높이) · 오르는 방향 · 중간참 쪽(3D) */}
          {고른것.종류 === '계단' && (
            <div className="gmd-row gmd-wrap gmd-st-edit" aria-label="계단 값">
              {[['판수', '판 수'], ['길이', '길이(한 판)'], ['폭', '폭(한 판)'], ['하단참', '하단참'], ['상단참', '상단참(중간참)'], ['단수', '단수']].map(([k, t]) => (
                <label key={k} className="gmd-kv">{t} <input className="gmd-in num" inputMode="numeric" data-st={k} value={고른것[k] ?? ''} placeholder={k === '단수' && 고른기하 ? String(고른기하.n) + '(자동)' : ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setM((P) => 부재고치기(P, 고른것.id, { [k]: v === '' ? '' : Number(v) })) }} /></label>
              ))}
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => setM((P) => 부재고치기(P, 고른것.id, { 가로: !(고른기하 ? 고른기하.가로 : true) }))}>↻ 오르는 방향</button>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => setM((P) => 부재고치기(P, 고른것.id, { 참끝: 고른기하 && 고른기하.참끝 ? 0 : 1 }))}>⇄ 중간참 쪽</button>
              {!고른것.제안 && 고른것.확인 && <span className="muted">✓ 확인 {고른것.확인}</span>}
            </div>
          )}
          {!고른것.제안 && Array.isArray(고른것.판) && 고른것.종류 === '기초' && (
            <div className="gmd-row gmd-wrap">
              <label className="gmd-kv">두께 <input className="gmd-in num" inputMode="numeric" value={고른것.두께 ?? ''} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setM((P) => 부재고치기(P, 고른것.id, { 두께: v ? Number(v) : '' })) }} /> mm</label>
              {고른것.확인 && <span className="muted">✓ 확인 {고른것.확인}</span>}
            </div>
          )}
          {(고른것.근거 || 고른것.짐작) && (
            <div className="gmd-src">
              {고른것.근거 && 고른것.근거.평면 && <div>📄 자리 · 길이: <b>{고른것.근거.평면}</b></div>}
              <div>📄 크기 · 철근: 부호 일람 «{고른것.부호}»</div>
              {고른것.짐작 && <div className="gmd-warn">⚠ 도면에 없어 짐작: {고른것.짐작}</div>}
            </div>
          )}
          {(고른것.종류 === '보' || 고른것.종류 === '벽') && 고른기하 && (
            <div className="gmd-row gmd-wrap">
              <label className="gmd-kv">✂ 나누기 — {고른기하.사선 ? '앞' : 고른기하.축 === 'x' ? '왼' : '아래'} 끝에서 <input className="gmd-in num" inputMode="numeric" value={나눌자리} placeholder={String(Math.round(고른기하.L / 2))} onChange={(e) => set나눌자리(e.target.value.replace(/[^0-9]/g, ''))} /> mm</label>
              <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { const d = Number(나눌자리 || Math.round(고른기하.L / 2)); const N = 부재나누기(M, 고른것.id, 고른기하.사선 ? d : 고른기하.s0 + d); if (N !== M) { setM(N); 세기('|골조모델|나누기'); set나눌자리('') } }}>✂ 둘로</button>
            </div>
          )}
          <div className="gmd-row gmd-wrap">
            <label className="gmd-kv">부호 <select className="gmd-in" value={고른것.부호} onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 부호: e.target.value }))}>
              {M.배근[고른것.종류].map((r) => <option key={r.기호} value={r.기호}>{r.기호}</option>)}
            </select></label>
            {고른것.종류 === '기둥' && <label className="gmd-kv"><input type="checkbox" checked={!!고른것.돌림} onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 돌림: e.target.checked }))} /> 가로 · 세로 바꿈</label>}
            {고른것.종류 === '벽' && <label className="gmd-kv">문 · 창(폭x높이) <input className="gmd-in" value={고른것.구멍 || ''} placeholder="900x2100" onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 구멍: e.target.value }))} /></label>}
            {고른것.종류 === '벽' && <label className="gmd-kv"><input type="checkbox" checked={!!고른것.한면} onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 한면: e.target.checked }))} /> 거푸집 한 면만(합벽)</label>}
            {고른것.종류 === '슬라브' && <label className="gmd-kv">구멍 넓이(㎡) <input className="gmd-in num" inputMode="decimal" value={고른것.구멍 || ''} onChange={(e) => setM((P) => 부재고치기(P, 고른것.id, { 구멍: e.target.value }))} /></label>}
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setM((P) => 부재빼기(P, 고른것.id)); set고른(null) }}>✕ 이 부재 지우기</button>
          </div>
          {고른물량 && 고른물량.줄.length > 0 && (
            <details className="gmd-lines-d">
              <summary>산출 줄 {고른물량.줄.length}개(이 부재 몫)</summary>
              <div className="gmd-tablewrap">
                <table className="gmd-table small">
                  <thead><tr><th>항목</th><th>규격</th><th>산출근거</th><th>몫</th><th>수량</th><th>비고</th></tr></thead>
                  <tbody>{고른물량.줄.map((x, i) => <tr key={i}><td>{x.항목}</td><td>{x.규격}</td><td className="mono">{x.식}</td><td className="num">{x.몫 < 1 ? '1/' + Math.round(1 / x.몫) : ''}</td><td className="num">{수글(x.수량몫, 3)}</td><td className="muted">{x.비고}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}

  </>)
  /* 🔧 G392 층 복사 미리 보기 — 소장님 폰 「B3, B2…체크하면 ..변해야 하는 거 아니야」: 체크는 «고르기» 라 «복사» 를 눌러야 바뀜 → 체크하면 바로 «복사하면 얼마나 늘어나는지» 보이게 */
  const [미리셈, set미리셈] = useState(0)            // 🔧 G393 부재가 많으면 미리 셈은 단추로(체크할 때마다 모델 전체를 두 번 셈 → 멈춤)
  const 복사미리 = useMemo(() => {
    const 받을 = 복사받을.filter((f) => f !== 층)
    if (!받을.length || !S || S.오류 || 층 === M.층[0].이름) return null
    if (M.부재.length > 1500 && 미리셈 !== M.부재.length) return { 받을, 늦음: true }
    try {
      const N = 층복사(M, 층, 받을), S2 = 모델셈(N)
      return { 받을, 더: N.부재.filter((o) => 받을.includes(o.층)).length - M.부재.filter((o) => 받을.includes(o.층) && o.종류 !== '기초').length, 콘: S2.합.콘크리트 - S.합.콘크리트, 틀: S2.합.거푸집 - S.합.거푸집, 철: (S2.합.철근 - S.합.철근) / 1000, 합: S2.합.콘크리트 }
    } catch (e) { return null }
  }, [M, 층, 복사받을, S, 미리셈])  // eslint-disable-line react-hooks/exhaustive-deps
  const 부호수 = (v, k) => (v >= 0 ? '+' : '−') + 수글(Math.abs(v), k)
  const 층복사판 = (
      <div className="gmd-bar small">
        <span className="muted">층 복사:</span>
        <span>{층 === M.층[0].이름 ? 'FT 는 복사하지 않습니다' : <>{층}층의 기둥 · 보 · 벽 · 슬라브를 →</>}</span>
        {층 !== M.층[0].이름 && 위층.filter((f) => f !== 층).map((f) => (
          <label key={f} className="gmd-kv"><input type="checkbox" checked={복사받을.includes(f)} onChange={(e) => set복사받을((P) => (e.target.checked ? [...P, f] : P.filter((x) => x !== f)))} /> {f}층</label>
        ))}
        {층 !== M.층[0].이름 && <button type="button" className={'btn sm' + (복사미리 ? '' : ' line')} disabled={!복사받을.length} onClick={복사하기}>{복사미리 ? '📋 ' + 복사미리.받을.map((f) => f + '층').join(' · ') + '에 복사' : '복사'}</button>}
        {복사미리 && 복사미리.늦음 && <button type="button" className="btn line sm" onClick={() => set미리셈(M.부재.length)}>🔢 복사하면 얼마나 늘어나는지 셈</button>}
        {복사미리 && !복사미리.늦음 && <span className="gmd-copyprev" role="status">→ «복사» 를 누르면 부재 {복사미리.더 >= 0 ? '+' : ''}{복사미리.더}개 · 콘크리트 <b>{부호수(복사미리.콘, 3)}</b> ㎥ · 거푸집 {부호수(복사미리.틀, 2)} ㎡ · 철근 {부호수(복사미리.철, 3)} t (합 {수글(복사미리.합)} ㎥) — 체크만으로는 안 바뀝니다</span>}
        <button type="button" className="btn line sm" onClick={() => { if (이층.length && window.confirm((층FT(M, 층) ? 'FT' : 층 + '층') + ' 부재 ' + 이층.length + '개를 지울까요?')) 모두('지움') }}>이 층 비우기</button>
        <span className="muted">· 층 더하기는 ① 통심 · 층에서</span>
        {S && !S.오류 && S.검사 && S.검사.find((z) => z.빈층) && <span className="gmd-warn gmd-copyprev" role="alert">⚠ {S.검사.find((z) => z.빈층).글}</span>}
      </div>
  )
  if (작업) {
    return (
      <div className={'gmd-ws-body view-' + 보기}>
        <aside className="gmd-ws-left" aria-label="도구">
          {길.length > 0 && (
            <details className="gmd-guide" open>
              <summary>🧭 길잡이 — {길.filter((x) => x.끝).length} / {길.length}</summary>
              <ol>{길.map((x) => <li key={x.번} className={x.끝 ? 'done' : x.지금 ? 'now' : ''} onClick={() => 길행동(x.할곳)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') 길행동(x.할곳) }}><i>{x.끝 ? '✓' : x.지금 ? '▶' : x.번}</i><span>{x.글}</span></li>)}</ol>
            </details>
          )}
          <div className="gmd-ws-floors" role="group" aria-label="층">
            {[...M.층].reverse().map((f) => <button key={f.이름} type="button" className={'gmd-ws-floor' + (f.이름 === 층 ? ' on' : '')} aria-pressed={f.이름 === 층} onClick={() => { set층(f.이름); set고른(null) }}>{FT층(f) ? 'FT' : f.이름 + '층'}<small>{M.부재.filter((o) => o.층 === f.이름).length}</small></button>)}
          </div>
          {도구판}
          {도움판}
          {한꺼번에판}
          {층복사판}
        </aside>
        <section className="gmd-ws-center">
          <div className="gmd-ws-views" role="group" aria-label="보기">
            {[['3D', '🧊 3D'], ['평면', '📐 평면'], ['나란히', '◫ 나란히']].map(([k, t]) => <button key={k} type="button" className={'gmd-tool' + (보기 === k && !걷기 ? ' on' : '')} aria-pressed={보기 === k && !걷기} onClick={() => { if (걷기) set걷기(false); set보기(k) }}>{t}</button>)}
            <button type="button" className={'gmd-tool gmd-walkbtn' + (걷기 ? ' on' : '')} aria-pressed={걷기} disabled={!M.부재.length} onClick={() => set걷기(!걷기)}>🚶 둘러보기</button>
          </div>
          {도면보기 && <div className="gmd-note gmd-viewband" role="status">👁 체크한 도면 {[...도면보기].filter((k) => k !== '손').length}장{도면보기.has('손') ? ' + 손으로 세운 것' : ''}만 보는 중 — 물량은 그대로 <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => set도면보기(null)}>모두 보기</button></div>}
          <div className="gmd-work">
            {평면판}
            {삼차원판}
          </div>
        </section>
        <aside className="gmd-ws-right" aria-label="물량">
          {S && !S.오류 && <요약줄 S={S} />}
          {S && !S.오류 && <정리판 M={M} S={S} setM={setM} 세기={한번세기} />}
          {고른것 && 고름판}
          {S && !S.오류 && 도구 === '구간' && <구간판 M={M} S={S} setM={setM} 구간색={구간색} set구간색={set구간색} 층={층} />}
          {S && !S.오류 && <제안줄 M={M} S={S} setM={setM} set고른={set고른} set층={set층} />}
          {S && !S.오류 && <겹침판 M={M} S={S} setM={setM} 세기={한번세기} 겹보기={(e) => {
            const o = M.부재.find((u) => u.id === e.ids[0]); if (!o) return
            set층(o.층); set고른(o.id); if (보기 === '3D') set보기('나란히'); set보일층('까지'); set도구('고르기')
            const [a, b, z0, c, d, z1] = e.상자 || [0, 0, 0, 0, 0, 0]
            setTimeout(() => {
              set평면확대([a - 3000, b - 3000, c + 3000, d + 3000])
              try { if (보기Ref.current) 보기Ref.current.fit('tilt', [(a - 3000) / 1000, (b - 3000) / 1000, (z0 - 1500) / 1000, (c + 3000) / 1000, (d + 3000) / 1000, (z1 + 1500) / 1000]) } catch (err) { /* 3D 없음 */ }
            }, 120)
            한번세기('|골조모델|겹침보기')
          }} />}
          <도면함판 토목으로={p.토목으로} M={M} setM={setM} 원료Ref={원료Ref} set층={set층} 도면열기={도면열기} 체크보기={체크보기} set체크보기={(v) => { set체크보기(v); if (!v) set도면보기(null) }} 도면보기={도면보기} set도면보기={set도면보기} />
          {S && !S.오류 && 도구 !== '구간' && M.구간 && M.구간.length > 0 && <구간판 M={M} S={S} setM={setM} 구간색={구간색} set구간색={set구간색} 층={층} />}
          {S && !S.오류 && <층대조판 M={M} S={S} 층={층} 빨고름={빨고름} 층가기={(f) => { set층(f); set고른(null) }} 빨보기={(k) => {
            const x = (M.빠짐 || [])[k]; if (!x) return
            set층(x.층); set빨고름(k); if (보기 === '3D') set보기('나란히'); set보일층('까지'); set도구('고르기')
            const xs2 = x.판.map((q) => +q[0]), ys2 = x.판.map((q) => +q[1]), a = Math.min(...xs2), b = Math.min(...ys2), c = Math.max(...xs2), d = Math.max(...ys2)
            setTimeout(() => {
              set평면확대([a - 3000, b - 3000, c + 3000, d + 3000])
              try { const H = 층높이(M), f = H.표.get(x.층) || { z0: 0, z1: 3000 }; if (보기Ref.current) 보기Ref.current.fit('tilt', [(a - 3000) / 1000, (b - 3000) / 1000, f.z0 / 1000, (c + 3000) / 1000, (d + 3000) / 1000, f.z1 / 1000]) } catch (e) { /* 3D 없음 */ }
            }, 120)
            한번세기('|골조모델|빨간곳보기')
          }} />}
          {도면결과 && <도면결과판 R={도면결과} S={S} 닫기={() => set도면결과(null)} />}
          {M.점검 && M.점검.length > 0 && (
            <details className="gmd-lines-d gmd-chk" open>
              <summary>📝 점검사항 {M.점검.length}개</summary>
              <ul className="gmd-dwglist">{M.점검.map((x, i) => <li key={i}><b>{x.층 === 'FT' ? 'FT' : x.층 + '층'} {x.종류} {x.부호}</b> <span className="muted">{x.자리}</span><div>{x.글}</div><div className="muted">{x.때} <button type="button" className="gmd-link" onClick={() => { setM((P) => ({ ...P, 점검: (P.점검 || []).filter((_, k) => k !== i) })) }}>지우기</button>{x.id !== null && x.id !== undefined && <> · <button type="button" className="gmd-link" onClick={() => { set층(x.층); set고른(x.id) }}>보기</button></>}</div></li>)}</ul>
            </details>
          )}
          {!고른것 && <p className="muted gmd-p">👆 «고르기» 로 부재를 누르면 크기 · 물량 · 산출 줄이 여기(맨 위)에 나옵니다.</p>}
          {S && !S.오류 && S.층별 && S.층별.length > 0 && (
            <div className="gmd-tablewrap"><table className="gmd-table small">
              <thead><tr><th>층</th><th>부재</th><th>개수</th><th>콘크리트 ㎥</th></tr></thead>
              <tbody>{S.층별.filter((r) => r.층 === 층).map((r, i) => <tr key={i}><td>{r.층 === 'FT' ? 'FT' : r.층 + '층'}</td><td>{r.종류}</td><td className="num">{r.개수}</td><td className="num">{수글(r.콘크리트)}</td></tr>)}</tbody>
            </table></div>
          )}
        </aside>
      </div>
    )
  }

  return (
    <div className="card gmd-build">
      {도구판}
      {도움판}
      {한꺼번에판}
      <div className={'gmd-work' + (크게 ? ' big' : '')}>
        {평면판}
        {삼차원판}
      </div>

      {고름판}

      {층복사판}
      {S && !S.오류 && <요약줄 S={S} />}
    </div>
  )
}
const 층FT = (M, 층) => FT층(M.층.find((f) => f.이름 === 층))

/**
 * 📚 G391 도면함 — 넣은 도면(평면)마다 제목 · 층 · 세운 부재 · 다음에 세울 도면(아래층부터)
 *   🔧 G393 소장님 「도면함이 어디 있지 빼고 추가하고 v표시로 할 수 있게 되어 있어야 하잖아」 → 늘 보임(위 «📚 도면함» 단추) · ☑ 체크 = 세움 · ☐ = 뺌(넣어 둠 — 다시 체크하면 고친 그대로)
 *   목록 · 넣어 둔 것은 모델에(M.도면함 · M.도면원) — 화면을 다시 열어도 체크로 빼고 넣음 · 처음 세우기 · 🔄 다시(도면대로)는 원본 도면이 있을 때(이 화면에서 넣은 뒤)
 */
function 도면함판({ M, setM, 원료Ref, set층, 도면열기, 체크보기 = false, set체크보기 = null, 도면보기 = null, set도면보기 = null, 토목으로 = null }) {
  const [알, set알] = useState('')
  const 목록 = M.도면함 || []
  if (!목록.length) {
    /* 📚 G440 소장님 「도면을 넣었는데 도면함에 없다고 나와」 — 넣은 도면에 골조(구조평면 · 일람표)가 없을 때(토목 도면) */
    let 넣은 = null
    try { 넣은 = JSON.parse(localStorage.getItem(넣은열쇠) || 'null') } catch (e) { 넣은 = null }
    if (넣은 && Array.isArray(넣은.파일) && 넣은.파일.length && !넣은.세움) {
      return (
        <div className="gmd-box gmd-box-empty" id="gmd-dwgbox" aria-label="도면함">
          <div className="gmd-row"><b>📚 도면함</b> <span className="muted">넣은 도면 {넣은.파일.length}장</span></div>
          <p className="gmd-p">{넣은.골조 ? <>도면에서 골조 {넣은.골조}개를 읽었지만 지금 모델을 그대로 두었습니다 — 다시 <button type="button" className="gmd-link" onClick={도면열기}>📐 도면 넣기</button>로 세울 수 있습니다.</> : <>이 도면들에는 <b>골조(구조평면 · 부재 일람표)</b>가 없어 건축 탭에는 세울 것이 없습니다.</>}{넣은.토목 ? ' 토목(노선 · 횡단 · 구조물)은 🛣 토목 탭에 있습니다.' : ''}</p>
          {넣은.토목 && 토목으로 && <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={토목으로}>🛣 토목 탭 도면함에서 보기</button>}
          <details className="gmd-p"><summary>넣은 도면 이름</summary><ul className="gmd-names">{넣은.파일.map((n, i) => <li key={i}>{String(n).replace(/\.(dxf|dwg)$/i, '')}</li>)}</ul></details>
        </div>
      )
    }
    return (
      <div className="gmd-box gmd-box-empty" id="gmd-dwgbox" aria-label="도면함">
        <div className="gmd-row"><b>📚 도면함</b> <span className="muted">넣은 도면 없음</span></div>
        <p className="muted gmd-p">구조도면(DWG · DXF)을 <button type="button" className="gmd-link" onClick={도면열기}>📐 도면 넣기</button>로 넣으면 평면마다 여기에 나옵니다 — <b>☑ 체크 = 세움 · 체크를 빼면 뺌</b>(뺀 것은 넣어 두었다가 다시 체크하면 그대로).</p>
      </div>
    )
  }
  const 차 = M.층.map((f) => f.이름)
  const 평면들 = [...목록].sort((a, b) => 차.indexOf(a.층[0]) - 차.indexOf(b.층[0]) || (b.부재 || 0) - (a.부재 || 0))
  const 세운 = (p) => M.부재.filter((o) => o.근거 && o.근거.키 === p.키).length
  const 빨 = (p) => (M.빠짐 || []).filter((x) => x.키 === p.키).length
  const 든 = (p) => 세운(p) + 빨(p)                     // 세운 부재 + 손으로 할 곳(빨강)
  const 둠 = (p) => 도면함넣어둠(M, p.키)
  const 쓸 = 평면들.filter((p) => p.부재 > 0 || p.못옮김 > 0 || 든(p) > 0 || 둠(p))
  const 빈 = 평면들.filter((p) => !쓸.includes(p))                                  // 같은 부재가 다른(주) 평면에서 세워진 확대평면 등
  const 다음 = 쓸.find((p) => !든(p))
  const 원 = 원료Ref && 원료Ref.current
  const 층글 = (f) => (f === 'FT' ? '기초' : f + '층')
  const 켜기 = (p) => {
    if (둠(p)) {
      const r = 도면함켜기(M, [p.키]); setM(r.M); if (p.층[0]) set층(p.층[0])
      set알('☑ «' + p.제목 + '» 부재 ' + r.더함 + '개를 다시 세웠습니다' + (r.빨강 ? ' · 손으로 할 곳 ' + r.빨강 + '곳(빨강)' : '') + ' — 고친 것 그대로')
    } else if (원 && 원.넣기) {
      const r = 원.넣기.평면가져오기(M, 원.전체, new Set([p.키]))
      if (r.틀림) { set알(r.틀림); return }
      setM(r.M); if (p.층[0]) set층(p.층[0])
      set알('☑ «' + p.제목 + '» 에서 부재 ' + r.더함 + '개를 세웠습니다' + (p.못옮김 ? ' — 손으로 할 곳 ' + p.못옮김 + '개는 3D 에 빨갛게' : ''))
    } else { set알('«' + p.제목 + '» 은 원본 도면이 있어야 처음 세울 수 있습니다 — 📐 도면 넣기로 다시 넣어 주세요'); return }
    세기('|골조모델|도면함켜기')
  }
  const 끄기 = (p) => { const r = 도면함끄기(M, [p.키]); setM(r.M); set알('☐ «' + p.제목 + '» 부재 ' + r.뺌 + '개를 뺐습니다 — 넣어 두었으니 다시 체크하면 고친 그대로 돌아옵니다'); 세기('|골조모델|도면함끄기') }
  const 다시 = (p) => { const 넣기 = 원 && 원.넣기; if (!넣기) return; const r1 = 넣기.평면빼기({ ...M, 도면원: { 부재: ((M.도면원 && M.도면원.부재) || []).filter((o) => !(o.근거 && o.근거.키 === p.키)), 빠짐: ((M.도면원 && M.도면원.빠짐) || []).filter((x) => x.키 !== p.키) } }, p.키); const r2 = 넣기.평면가져오기(r1.M, 원.전체, new Set([p.키])); if (r2.틀림) { set알(r2.틀림); return } setM(r2.M); set알('🔄 «' + p.제목 + '» 다시 세움(고친 것은 도면대로)') }
  const 모두끄기 = () => { if (!window.confirm('세운 부재를 모두 빼고(넣어 둠), 도면을 하나씩(기초부터) 체크해서 세울까요? (↶ 되돌리기로 돌아올 수 있습니다)')) return; setM((P) => 도면함끄기(P, (P.도면함 || []).map((p) => p.키)).M); set알('☐ 모두 뺐습니다 — 아래 «다음» 도면부터 하나씩 체크하십시오') }
  const 모두켜기 = () => { setM((P) => 도면함켜기(P, (P.도면함 || []).map((p) => p.키)).M); set알('☑ 넣어 둔 평면을 모두 다시 세웠습니다') }
  const 켠수 = 쓸.filter((p) => 든(p) > 0).length
  /* 👁 G433 보기 체크 — 모두(null)에서 하나를 빼면 나머지 모두 · 다 켜지면 다시 모두 */
  const 손수 = M.부재.filter((o) => !(o.근거 && o.근거.키)).length
  const 보기키들 = [...쓸.map((p) => p.키), ...(손수 ? ['손'] : [])]
  const 보나 = (k) => !도면보기 || 도면보기.has(k)
  const 보는수 = 쓸.filter((p) => 보나(p.키)).length
  const 보기바꿈 = (k, on) => { if (!set도면보기) return; const 지금 = new Set(도면보기 || 보기키들); if (on) 지금.add(k); else 지금.delete(k); set도면보기(보기키들.every((q) => 지금.has(q)) ? null : 지금); 세기('|골조모델|도면보기') }
  return (
    <div className="gmd-box" id="gmd-dwgbox" aria-label="도면함">
      {set체크보기 && <div className="gmd-row gmd-dwgmode" role="group" aria-label="체크 뜻"><span className="muted">☑ 체크 =</span> <button type="button" className={'btn sm' + (체크보기 ? ' line' : '')} style={{ width: 'auto' }} aria-pressed={!체크보기} onClick={() => set체크보기(false)}>세움</button><button type="button" className={'btn sm' + (체크보기 ? '' : ' line')} style={{ width: 'auto' }} aria-pressed={체크보기} onClick={() => set체크보기(true)}>👁 보기</button>{체크보기 && <span className="muted">— 체크한 도면만 3D · 평면에(물량은 그대로)</span>}</div>}
      <div className="gmd-row"><b>📚 도면함</b> <span className="muted">{체크보기 ? `👁 ${보는수} / ${쓸.length}장 보기` : `☑ ${켠수} / ${쓸.length}장 세움`}</span>
        <span style={{ marginLeft: 'auto' }}>{켠수 < 쓸.length && 쓸.some(둠) && <button type="button" className="gmd-link" onClick={모두켜기}>☑ 모두</button>}{켠수 > 0 && <> · <button type="button" className="gmd-link" onClick={모두끄기}>☐ 모두 빼고 하나씩</button></>}</span></div>
      <ul className="gmd-dwglist gmd-box-list">
        {쓸.map((p) => { const n = 든(p); return (
          <li key={p.키} className={(n ? 'on' : '') + (p === 다음 ? ' next' : '')}>
            <label className="gmd-dwgchk">
              {체크보기 ? <input type="checkbox" checked={보나(p.키)} onChange={(e) => 보기바꿈(p.키, e.target.checked)} aria-label={(p.제목 || '평면') + ' 보기'} /> : <input type="checkbox" checked={n > 0} onChange={(e) => (e.target.checked ? 켜기(p) : 끄기(p))} aria-label={(p.제목 || '평면') + ' 세움'} />}
              <span><b>{p === 다음 ? '▶ ' : ''}{p.제목 || '(제목 없음)'}</b> <span className="muted" title="n층 구조평면도의 보 · 슬라브는 그 아래층 기둥 · 벽 위에 얹힘 — 아래층에 세움">→ {p.층.map(층글).join(' · ')} · 부재 {p.부재}{p.못옮김 ? ' · 손으로 ' + p.못옮김 + '(빨강)' : ''}{n && 세운(p) !== p.부재 ? ' · 지금 ' + 세운(p) : ''}{!n && 둠(p) ? ' · 넣어 둠' : ''}</span></span>
            </label>
            {n > 0 && 원 && 원.넣기 && <button type="button" className="gmd-link gmd-redo" onClick={() => 다시(p)} title="고친 것을 버리고 도면대로 다시">🔄 다시</button>}
          </li>) })}
        {체크보기 && 손수 > 0 && <li className="on"><label className="gmd-dwgchk"><input type="checkbox" checked={보나('손')} onChange={(e) => 보기바꿈('손', e.target.checked)} aria-label="손으로 세운 것 보기" /><span><b>✋ 손으로 세운 것</b> <span className="muted">도면 근거 없음 · 부재 {손수.toLocaleString('ko-KR')}</span></span></label></li>}
      </ul>
      {체크보기 && 도면보기 && <p className="gmd-p"><button type="button" className="gmd-link" onClick={() => set도면보기(null)}>👁 모두 보기</button></p>}
      {빈.length > 0 && (
        <details className="gmd-lines-d">
          <summary>📎 세울 것 없는 평면 {빈.length}장 — 같은 부재를 다른 평면에서 이미 세움(확대평면도 등)</summary>
          <ul className="gmd-dwglist">{빈.map((p) => <li key={p.키} className="muted">{p.제목 || '(제목 없음)'} → {p.층.map(층글).join(' · ')}</li>)}</ul>
        </details>
      )}
      {(M.도면따로 || []).length > 0 && (
        <details className="gmd-lines-d gmd-other">
          <summary>🗂 골조에 안 쓴 도면 {M.도면따로.length}장 — {['토목', '건축', '그 밖'].map((k) => [k, M.도면따로.filter((d) => d.종 === k).length]).filter(([, n]) => n).map(([k, n]) => (k === '토목' ? '🛣 토목 ' : k === '건축' ? '🏠 건축 ' : '📄 ') + n + '장').join(' · ')}</summary>
          <p className="muted gmd-p">🛣 토목 도면은 작업 화면 «🛣 토목» 탭(준비 중 — STA · TM 좌표 · EL)에서 씁니다 · 🏠 건축 도면은 골조 셈에 안 씀(읽는 시간만 걸림 — 다음엔 구조도면만 넣으셔도 됩니다)</p>
          <ul className="gmd-dwglist">{M.도면따로.map((d) => <li key={d.이름} className="muted">{d.종 === '토목' ? '🛣' : d.종 === '건축' ? '🏠' : '📄'} {d.이름.replace(/\.(dwg|dxf)$/i, '')}</li>)}</ul>
        </details>
      )}
      {다음 && <p className="gmd-p gmd-nextmsg">▶ 다음: <b>{다음.제목}</b> — ☑ 체크(아래층부터 차례로)</p>}
      {알 && <p className="muted gmd-p" role="status">{알}</p>}
    </div>
  )
}

/**
 * ▭ G393 구간별 물량 — 소장님 「구간 나누기 … 다음으로 미루지 마. 지금해줘」
 *   구간마다 콘크리트 · 거푸집 · 철근(부재별 몫의 합) · 층별 · 구간 밖 · 도면 덧줄 → 합 = 전체(검산) · ✂ 구간 선에서 자르기 · 🎨 3D 구간 색 · 이름 고치기 · ✕ 빼기
 */
function 구간판({ M, S, setM, 구간색, set구간색, 층 }) {
  const [알, set알] = useState('')
  const Q = useMemo(() => 구간물량(M, S), [M, S])
  const 목 = M.구간 || []
  const 합 = { 콘크리트: Q.밖.콘크리트 + Q.덧.콘크리트, 거푸집: Q.밖.거푸집 + Q.덧.거푸집, 철근: Q.밖.철근 + Q.덧.철근 }
  for (const r of Q.줄) { 합.콘크리트 += r.콘크리트; 합.거푸집 += r.거푸집; 합.철근 += r.철근 }
  const 맞 = Math.abs(합.콘크리트 - S.합.콘크리트) < 0.002 && Math.abs(합.철근 - S.합.철근) < 1
  const 층글 = (f) => (f === 'FT' ? 'FT' : f + '층')
  const 칸 = (r, 이름, 색) => (
    <tr key={이름}>
      <td>{색 && <span className="gmd-dot" style={{ background: 색 }} />}{이름}</td>
      <td className="num">{r.개수}</td><td className="num">{수글(r.콘크리트)}</td><td className="num">{수글(r.거푸집, 2)}</td><td className="num">{수글(r.철근 / 1000, 3)}</td>
    </tr>
  )
  const 자르기 = () => { const r = 구간선자르기(M); if (!r.나눔) { set알('구간 선에 걸친 보 · 벽 · 슬라브가 없습니다'); return } setM(r.M); const S2 = 모델셈(r.M); set알('✂ 구간 선에서 ' + r.나눔 + '곳을 둘로 나눴습니다 — 콘크리트 ' + 수글(S2.합.콘크리트 - S.합.콘크리트, 3) + ' ㎥ · 철근 ' + 수글((S2.합.철근 - S.합.철근) / 1000, 3) + ' t 차이(보 · 벽은 이어진 한 줄 그대로 · 슬라브 칸이 나뉘면 «⌈길이/간격⌉+1» 가닥이 칸마다) — ↶ 로 되돌릴 수 있음'); 세기('|골조모델|구간자르기') }
  return (
    <div className="gmd-box gmd-zonebox" aria-label="구간별 물량">
      <div className="gmd-row"><b>▭ 구간별 물량</b> <span className="muted">{목.length}구간 · 모든 층</span>
        <label className="gmd-kv" style={{ marginLeft: 'auto' }}><input type="checkbox" checked={구간색} onChange={(e) => set구간색(e.target.checked)} /> 🎨 3D 구간 색</label></div>
      {!목.length && <p className="muted gmd-p">평면에서 네모를 끌어 구간을 그으십시오(팀별 · 기성 구간). 가까운 통심에 붙습니다.</p>}
      {목.length > 0 && (<>
        <div className="gmd-tablewrap"><table className="gmd-table small">
          <thead><tr><th>구간</th><th>부재</th><th>콘크리트 ㎥</th><th>거푸집 ㎡</th><th>철근 t</th></tr></thead>
          <tbody>
            {Q.줄.map((r, i) => 칸(r, r.z.이름, 'rgb(' + 구간색들[i % 구간색들.length].map((v) => Math.round(v * 255)).join(',') + ')'))}
            {Q.밖.개수 > 0 && 칸(Q.밖, '구간 밖', '#c8cad0')}
            {Q.덧.줄 > 0 && 칸({ ...Q.덧, 개수: Q.덧.줄 }, '도면 덧줄(부재 아님)', '')}
          </tbody>
          <tfoot><tr><td>합 {맞 ? '✓ = 전체' : '⚠ 전체와 다름'}</td><td /><td className="num">{수글(합.콘크리트)}</td><td className="num">{수글(합.거푸집, 2)}</td><td className="num">{수글(합.철근 / 1000, 3)}</td></tr></tfoot>
        </table></div>
        <details className="gmd-lines-d"><summary>층별로 보기</summary>
          <div className="gmd-tablewrap"><table className="gmd-table small">
            <thead><tr><th>구간</th><th>층</th><th>콘크리트 ㎥</th><th>거푸집 ㎡</th><th>철근 t</th></tr></thead>
            <tbody>{[...Q.줄.map((r) => [r.z.이름, r]), ['구간 밖', Q.밖]].flatMap(([이름, r]) => [...r.층별].sort((a, b) => M.층.findIndex((f) => f.이름 === a[0]) - M.층.findIndex((f) => f.이름 === b[0])).map(([f, a]) => <tr key={이름 + f} className={f === 층 ? 'now' : ''}><td>{이름}</td><td>{층글(f)}</td><td className="num">{수글(a.콘크리트)}</td><td className="num">{수글(a.거푸집, 2)}</td><td className="num">{수글(a.철근 / 1000, 3)}</td></tr>))}</tbody>
          </table></div>
        </details>
        <ul className="gmd-zonelist">{목.map((z, i) => (
          <li key={z.id}><span className="gmd-dot" style={{ background: 'rgb(' + 구간색들[i % 구간색들.length].map((v) => Math.round(v * 255)).join(',') + ')' }} />
            <input className="gmd-in" value={z.이름} aria-label="구간 이름" onChange={(e) => setM((P) => 구간고치기(P, z.id, { 이름: e.target.value }))} />
            <span className="muted">{Math.round((z.판[2] - z.판[0]) / 100) / 10} × {Math.round((z.판[3] - z.판[1]) / 100) / 10} m</span>
            <button type="button" className="gmd-link" onClick={() => setM((P) => 구간빼기(P, z.id))}>✕ 빼기</button></li>
        ))}</ul>
        <div className="gmd-row gmd-wrap">
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={자르기} title="구간 선이 지나가는 보 · 벽 · 슬라브를 그 자리에서 둘로 — 양쪽 구간에 정확히">✂ 구간 선에서 자르기</button>
          <span className="muted">선에 걸친 보 · 벽 · 슬라브는 자르지 않아도 길이 · 넓이 비율로 나눠 셉니다 · ✂ 는 부재를 실제로 둘로 나눌 때(슬라브 칸이 나뉘면 철근 가닥 셈이 조금 달라질 수 있음)</span>
        </div>
      </>)}
      {알 && <p className="muted gmd-p" role="status">{알}</p>}
    </div>
  )
}

/**
 * 🧾 G393 층별 대조 — 소장님 「빨간곳이 있으면, 빨간곳이 어디인지 알려줘야 고치지 … 층마다 대조해서 … 몇 대 몇」
 *   층마다: 도면 부재 n = 세움 m + 🟥 손으로 k + 한 번만 셈(같은 자리 두 번 · 다른 평면에도 그림) · 🟨 확인할 제안 · 콘크리트 도면 셈 ↔ 이 모델
 *   🟥 을 누르면 그 층 평면 · 3D 에 그 자리를 밝게
 */
/**
 * 🧹 G431 정리판 — 작업 화면 맨 위 «정리할 것» 을 원인별로 한 줄씩 · 자세한 것은 아래 🧩 겹친 곳 · 🟨 제안 · 🧾 층별 대조(새 목록을 또 만들지 않음)
 *   소장님 «간편하게 할 수 있는 방법 없을까? 전체를 보여 주돼» · «이용자 측면에서 1에서 2로 가는게 제일 좋은 것 같아. 반복되는 것은 없지?»
 */
function 정리판({ M, S, setM, 세기 }) {
  const r = useMemo(() => 정리할것(M, S), [M, S])
  if (!r.있음) return null
  const 층글 = (f) => (f === 'FT' ? 'FT' : f + '층')
  const 수 = (n) => n.toLocaleString('ko-KR')
  const 가기 = (sel) => { const el = document.querySelector(sel); if (!el) return; if (el.tagName === 'DETAILS') el.open = true; try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch (e) { el.scrollIntoView() } el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash') }
  const 남수 = r.겹.남.reduce((t, x) => t + x.수, 0)
  return (
    <div className="gmd-box gmd-tidy" aria-label="정리할 것">
      <div className="gmd-row"><b>🧹 정리할 것</b> <span className="muted">원인별로 한 줄씩 — 자세한 것은 아래</span></div>
      <ul className="gmd-tidylist">
        {r.무더기.map((g) => (
          <li key={g.종류 + '|' + g.층}>⚠ <b>{층글(g.층)} {g.종류} {수(g.수)}개</b> — 도면 근거 없이 손으로 세운 무더기{g.보조 ? ` (보조 통심 교점 ${수(g.보조)}곳)` : ''}{r.겹.무더기때문 ? ` · 겹친 곳 ${수(r.겹.무더기때문)}곳의 원인` : ''}
            <div className="gmd-row"><button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { setM((P) => 무더기빼기(P, g.종류, g.층)); 세기('|골조모델|무더기빼기') }}>이것만 빼기</button> <small className="muted">도면에서 온 것은 남김 · ↶ 되돌리기 됨</small></div>
          </li>
        ))}
        {r.겹.모두 > 0 && (
          <li>🧩 <b>겹친 곳 {수(r.겹.모두)}곳</b>{r.겹.무더기때문 ? ` — 그중 ${수(r.겹.무더기때문)}곳은 위 무더기 때문(빼면 같이 없어짐)` : ''}{남수 ? `${r.겹.무더기때문 ? ` · 남는 ${수(남수)}곳:` : ' —'} ${r.겹.남.slice(0, 3).map((x) => `${층글(x.층)} ${x.짝} ${수(x.수)}`).join(' · ')}${r.겹.남.length > 3 ? ' …' : ''}` : ''}
            {남수 > 0 && <div className="gmd-row"><button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 가기('.gmd-ovl')}>🧩 겹친 곳 목록</button></div>}
          </li>
        )}
        {r.제안 > 0 && <li>🟨 <b>확인할 제안 {수(r.제안)}곳</b> — 건설맵이 먼저 세운 것 <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 가기('.gmd-prop-sum')}>보기</button></li>}
        {r.빨 > 0 && <li>🟥 <b>손으로 할 곳 {수(r.빨)}곳</b> — 도면에서 못 옮긴 것 <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 가기('.gmd-cmp')}>🧾 층별 대조</button></li>}
      </ul>
    </div>
  )
}

/** 🧩 G394 겹친 곳 — 같은 것을 두 번 그린 곳(❓ 어느 것을 남길까요?) · 그 밖에 조금 걸친 곳 */
function 겹침판({ M, S, setM, 세기, 겹보기 }) {
  const 겹 = (S.검사.find((z) => z.겹친) || {}).겹친 || []
  const 둔 = (M.겹침둠 || []).length
  if (!겹.length && !둔) return null
  /* 🧩 G430 고른 짝(한쪽 뺌 · 둘 다 맞음)은 셈이 늦게 따라와도 바로 목록에서 뺌 — 같은 짝의 다른 쪽을 또 눌러 둘 다 빠지지 않게 */
  const 둘 = 겹.filter((e) => e.종 === '둘' && 겹침물을짝(e, M)), 남 = 겹.filter((e) => e.종 !== '둘' && e.ids.every((id) => M.부재.some((o) => o.id === id)))
  const 합 = 겹.reduce((a, e) => a + e.부피, 0)
  const 부 = (id) => M.부재.find((u) => u.id === id)
  const 짧 = (e, k) => { const o = 부(e.ids[k]); return (o ? String(o.부호 || '') || o.종류 : '#' + e.ids[k]) + ' · ' + 수글((e.부피들 || [])[k] || 0) + ' ㎥' }
  return (
    <details className="gmd-box gmd-ovl" open={둘.length > 0} aria-label="겹친 곳">
      <summary><b>🧩 겹친 곳 {겹.length}</b> <span className="muted">— ❓ 어느 것을 남길까요? {둘.length}곳 · 합 {수글(합)} ㎥{둔 ? ' · 둘 다 맞음 ' + 둔 : ''}</span></summary>
      {둘.length > 0 && <p className="muted gmd-p">같은 자리에 두 번 그린 것입니다(도면 두 장 · 같은 줄에 다른 부호 · 칸이 겹침). 남길 것을 누르면 다른 것을 뺍니다 — ↶ 되돌리기로 돌아옵니다. 둘 다 맞으면 «둘 다 맞음».</p>}
      <ul className="gmd-ovllist">{둘.slice(0, 40).map((e) => (
        <li key={e.ids.join('|')}>
          <button type="button" className="gmd-link" onClick={() => 겹보기(e)}>🔍 {e.머리}</button> <span className="muted">겹친 몫 {수글(e.부피)} ㎥</span>
          <div className="gmd-row gmd-wrap">
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setM((P) => 겹침남기기(P, e.ids[0], e.ids[1])); 세기('|골조모델|겹침남기기') }}>✓ {짧(e, 0)} 남기기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setM((P) => 겹침남기기(P, e.ids[1], e.ids[0])); 세기('|골조모델|겹침남기기') }}>✓ {짧(e, 1)} 남기기</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { setM((P) => 겹침둠(P, e.ids[0], e.ids[1])); 세기('|골조모델|겹침둘다') }}>둘 다 맞음</button>
          </div>
        </li>
      ))}</ul>
      {둘.length > 40 && <p className="muted gmd-p">… {둘.length - 40}곳 더(위에서 고르면 다음 것이 나옵니다)</p>}
      {남.length > 0 && (
        <details className="gmd-lines-d">
          <summary>그 밖에 조금 걸친 곳 {남.length} — 합 {수글(남.reduce((a, e) => a + e.부피, 0))} ㎥</summary>
          <ul className="gmd-dwglist">{남.slice(0, 30).map((e) => <li key={e.ids.join('|')}><button type="button" className="gmd-link" onClick={() => 겹보기(e)}>🔍 {e.글}</button></li>)}</ul>
        </details>
      )}
      {둔 > 0 && <p className="muted gmd-p">«둘 다 맞음» 으로 둔 겹침 {둔}곳은 둘 다 셉니다. <button type="button" className="gmd-link" onClick={() => setM((P) => ({ ...P, 겹침둠: [] }))}>다시 묻기</button></p>}
    </details>
  )
}

function 층대조판({ M, S, 층, 빨고름, 빨보기, 층가기 = null }) {
  /* 🧾 G432 층마다 겹친 곳 수 · 도면 근거 없는 무더기(정리할것)는 «+손 n» 을 빨갛게 · 줄을 누르면 그 층으로(소장님 «1에서 2로» — 새 표를 만들지 않고 이 표에 더함) */
  const 정 = useMemo(() => 정리할것(M, S), [M, S])
  const 겹층 = useMemo(() => { const m = new Map(), 부 = new Map(M.부재.map((o) => [o.id, o])); for (const e of ((S.검사 || []).find((z) => z.겹친) || {}).겹친 || []) { const a = 부.get(e.ids[0]); if (!a || !부.has(e.ids[1])) continue; m.set(a.층, (m.get(a.층) || 0) + 1) } return m }, [M, S])
  const 대 = M.대조 || null
  const 층들 = [...M.층].reverse().map((f) => f.이름)
  const 콘 = new Map(); for (const r of S.층별 || []) 콘.set(r.층, (콘.get(r.층) || 0) + r.콘크리트)
  const 빨 = (M.빠짐 || []).map((x, k) => ({ ...x, k }))
  const 줄 = 층들.map((f) => {
    const 세운 = M.부재.filter((o) => o.층 === f)
    const 원 = new Set(세운.filter((o) => o.근거 && o.근거.원 !== undefined).map((o) => o.근거.원))
    const 둠 = ((M.도면원 && M.도면원.부재) || []).filter((o) => o.층 === f)
    const 손 = 세운.filter((o) => !(o.근거 && o.근거.원 !== undefined)).length
    const d = 대 && 대[f] ? 대[f] : null
    const 붉 = 빨.filter((x) => x.층 === f)
    const 제 = 세운.filter((o) => o.제안).length
    const 한번 = d ? Math.max(d.도면 - 원.size - 붉.length - new Set(둠.filter((o) => o.근거 && o.근거.원 !== undefined).map((o) => o.근거.원)).size, 0) + (d.겹침 || 0) : 0
    return { f, 세운: 세운.length, 원: 원.size, 손, d, 붉, 제, 한번, 둠: 둠.length, 콘: 콘.get(f) || 0, 겹: 겹층.get(f) || 0, 무: 정.무더기.filter((g) => g.층 === f) }
  }).filter((r) => r.세운 || r.붉.length || (r.d && r.d.도면) || r.둠)
  if (!줄.length) return null
  const 층글 = (f) => (f === 'FT' ? 'FT' : f + '층')
  const 모두빨 = 빨.length
  return (
    <details className="gmd-box gmd-cmp" open={모두빨 > 0} aria-label="층별 대조">
      <summary><b>🧾 층별 대조</b> <span className="muted">{대 ? '도면 ↔ 세움' : '세운 부재'} · 🟥 손으로 {모두빨}{정.겹.모두 ? ` · 🧩 겹친 곳 ${정.겹.모두.toLocaleString('ko-KR')}` : ''}</span></summary>
      <div className="gmd-tablewrap"><table className="gmd-table small">
        <thead><tr><th>층</th>{대 && <th title="도면에 그려진 부재(평면마다)">도면</th>}<th title="세운 부재 — 도면에서 옮긴 것(나눈 보 · 칸은 하나로)">세움</th><th>🟥</th><th>🟨</th><th title="겹친 곳(같은 자리에 두 번 그린 곳 · 걸친 곳 — 셈 검사)">🧩</th>{대 && <th title="같은 자리에 두 번 · 다른 평면에도 그려 한 번만 셈">한 번만</th>}<th>콘크리트 ㎥{대 ? ' 도면 ↔ 모델' : ''}</th></tr></thead>
        <tbody>{줄.map((r) => (
          <tr key={r.f} className={(r.f === 층 ? 'now' : '') + (층가기 ? ' gmd-rowgo' : '')} onClick={층가기 ? () => 층가기(r.f) : undefined} title={층가기 ? 층글(r.f) + ' 으로' : undefined}>
            <td>{층글(r.f)}</td>
            {대 && <td className="num">{r.d ? r.d.도면 : '—'}</td>}
            <td className="num">{대 ? r.원 : r.세운}{r.손 ? <small className={r.무.length ? 'gmd-warn' : 'muted'} title={r.무.length ? '도면 근거 없이 손으로 세운 무더기 — 맨 위 «🧹 정리할 것» 에서 뺄 수 있음' : undefined}> +손 {r.손.toLocaleString('ko-KR')}{r.무.length ? ' ⚠' : ''}</small> : null}{r.둠 ? <small className="muted"> (넣어 둠 {r.둠})</small> : null}</td>
            <td className={'num' + (r.붉.length ? ' gwk-red' : '')}>{r.붉.length || ''}</td>
            <td className={'num' + (r.제 ? ' gwk-prop' : '')}>{r.제 || ''}</td>
            <td className="num">{r.겹 ? r.겹.toLocaleString('ko-KR') : ''}</td>
            {대 && <td className="num muted">{r.한번 || ''}</td>}
            <td className="num">{대 && r.d ? <>{수글(r.d.콘, 1)} ↔ {수글(r.콘, 1)} <small className={Math.abs(r.콘 - r.d.콘) > Math.max(1, r.d.콘 * 0.05) ? 'gmd-warn' : 'muted'}>({(() => { const c = Math.round((r.콘 - r.d.콘) * 10) / 10; return c === 0 ? '±0' : (c > 0 ? '+' : '') + 수글(c, 1) })()})</small></> : 수글(r.콘, 1)}</td>
          </tr>))}</tbody>
      </table></div>
      {모두빨 > 0 && (
        <ul className="gmd-redlist" aria-label="빨간 곳">
          {줄.filter((r) => r.붉.length).map((r) => (
            <li key={r.f}><b>{층글(r.f)}</b> {r.붉.map((x) => <button key={x.k} type="button" className={'gmd-redbtn' + (빨고름 === x.k ? ' on' : '')} onClick={() => 빨보기(x.k)} title={x.까닭}>🟥 {x.종류} {x.기호 || ''} <small>{String(x.까닭 || '').replace(/\(.*$/, '').slice(0, 24)}</small></button>)}</li>
          ))}
        </ul>
      )}
      {대 && <p className="muted gmd-p">도면 = 세움 + 🟥 손으로 + 한 번만(같은 자리에 두 번 · 다른 평면에도 그린 것) · 🟥 을 누르면 평면 · 3D 에 그 자리가 밝게 나옵니다</p>}
    </details>
  )
}

/** 📐 G389 도면에서 세움 — 도면 셈(BIM 물량 화면과 같은 셈) ↔ 이 모델 · 못 옮긴 것(까닭별) */
function 도면결과판({ R, S, 닫기 }) {
  const 모 = {}
  if (S && !S.오류) for (const x of S.R.줄) if (x.항목 === '콘크리트' && !/버림/.test(x.비고 || '')) 모[x.부재] = (모[x.부재] || 0) + x.수량
  const 종들 = [...new Set([...Object.keys(R.도면.종 || {}), ...Object.keys(모)])].sort((a, b) => ['기초', '기둥', '벽', '보', '슬라브', '계단'].indexOf(a) - ['기초', '기둥', '벽', '보', '슬라브', '계단'].indexOf(b))
  const 까닭 = new Map()
  for (const x of R.못옮김) { if (!까닭.has(x.까닭)) 까닭.set(x.까닭, []); 까닭.get(x.까닭).push(x) }
  const 층글 = (f) => (f === 'FT' ? 'FT' : f + '층')
  return (
    <div className="gmd-dwgres" aria-label="도면에서 세움">
      <div className="gmd-row"><b>📐 도면에서 세움</b> <span className="muted">부재 {R.부재수.toLocaleString('ko-KR')}개</span><button type="button" className="gmd-x" onClick={닫기} aria-label="닫기">✕</button></div>
      <div className="gmd-tablewrap"><table className="gmd-table small">
        <thead><tr><th>부재</th><th>도면 셈 ㎥</th><th>이 모델 ㎥</th><th>차</th></tr></thead>
        <tbody>{종들.map((k) => { const a = (R.도면.종 || {})[k] || 0, b = 모[k] || 0; return <tr key={k}><td>{k}</td><td className="num">{수글(a, 1)}</td><td className="num">{수글(b, 1)}</td><td className={'num' + (Math.abs(b - a) > Math.max(1, a * 0.05) ? ' gmd-warn' : '')}>{b === 0 && a > 0 ? '손으로' : (b - a >= 0 ? '+' : '') + 수글(b - a, 1)}</td></tr> })}</tbody>
      </table></div>
      <p className="muted gmd-p">도면 셈 = BIM 물량 화면과 같은 셈. 이 모델은 바깥 보 · 벽 위 슬라브를 바깥 면까지 셉니다.</p>
      {R.필요 && R.필요.length > 0 && (
        <div className="gmd-help">
          <b>🙋 건설맵 도우미 — 있으면 좋은 도면 {R.필요.length}가지</b>
          <ul>{R.필요.map((x, i) => <li key={i}><span className={'gmd-tag ' + (x.급 === '꼭' ? 'must' : 'opt')}>{x.급 === '꼭' ? '꼭' : '있으면'}</span> <b>{x.무엇}</b> — {x.글}</li>)}</ul>
        </div>
      )}
      {R.평면 && R.평면.length > 0 && (
        <details className="gmd-lines-d">
          <summary>📄 가져다 쓴 도면 — 평면 {R.평면.length}장{R.높이 && Object.keys(R.높이).length ? ' · 층 높이' : ''}</summary>
          <ul className="gmd-dwglist">
            {R.평면.map((p, i) => <li key={i}><b>{p.제목 || '(제목 없음)'}</b> <span className="muted">{p.파일 ? p.파일.replace(/\.(dwg|dxf)$/i, '') + ' · ' : ''}{p.층.map((f) => (f === 'FT' ? '기초' : f + '층')).join(' · ')} · 기호 {p.기호수}</span></li>)}
            {R.높이 && Object.keys(R.높이).length > 0 && <li><b>층 높이(단면 · 골구도)</b> <span className="muted">{Object.entries(R.높이).sort((a, b) => a[1] - b[1]).map(([f, z]) => (f === 'FT' ? '기초' : f + '층') + ' ' + Number(z).toLocaleString('ko-KR')).join(' · ')}</span></li>}
          </ul>
        </details>
      )}
      {까닭.size > 0 && (
        <details className="gmd-lines-d" open>
          <summary>못 옮긴 것 {R.못옮김.length}개 — 손으로 세우거나 확인</summary>
          <ul className="gmd-dwglist">{[...까닭.entries()].map(([k, 들]) => <li key={k}><b>{k}</b> <span className="muted">{들.length}개</span><div className="muted">{들.slice(0, 12).map((x) => 층글(x.층) + ' ' + x.종류 + ' ' + (x.기호 || '')).join(' · ')}{들.length > 12 ? ' …' : ''}</div></li>)}</ul>
        </details>
      )}
    </div>
  )
}

/** 🟨 G392 건설맵이 먼저 세운 것(확인 전) — 몇 곳 · 콘크리트 몫 · 하나씩 보기 · ✓ 모두 이대로 */
function 제안줄({ M, S, setM, set고른, set층 }) {
  const 들 = M.부재.filter((o) => o.제안)
  if (!들.length) return null
  const 콘 = 들.reduce((a, o) => a + ((S.부재별.get(o.id) || {}).콘크리트 || 0), 0)
  const 다음 = 들[0]
  return (
    <div className="gmd-prop gmd-prop-sum" aria-label="건설맵 제안">
      <b>🟨 건설맵이 먼저 세운 것 {들.length}곳</b> <span className="muted">— 확인 전 · 콘크리트 {수글(콘)} ㎥ 는 위 합에 들어 있음</span>
      <div className="gmd-row gmd-wrap">
        <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => { set층(다음.층); set고른(다음.id) }}>👆 하나씩 보기({다음.층 === 'FT' ? '기초' : 다음.층 + '층'} {다음.종류} {다음.부호})</button>
        <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => { if (!window.confirm('건설맵이 세운 ' + 들.length + '곳을 모두 «이대로» 확인할까요? (↶ 되돌리기로 돌아올 수 있습니다)')) return; setM((P) => 제안모두확인(P, 지금때())); 세기('|골조모델|제안모두확인') }}>✓ 모두 이대로</button>
      </div>
    </div>
  )
}
const 지금때 = () => { try { return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) } catch (e) { return '' } }

function 요약줄({ S }) {
  return (
    <div className="gmd-sum">
      <span>콘크리트 <b>{수글(S.합.콘크리트)}</b> ㎥</span>
      <span>거푸집 <b>{수글(S.합.거푸집, 2)}</b> ㎡</span>
      <span>철근 <b>{수글(S.합.철근 / 1000, 3)}</b> ton</span>
      {S.경고.length > 0 && <span className="gmd-warn">⚠ 경고 {S.경고.length}</span>}
      {S.검사.some((z) => !z.좋음) && <span className="gmd-warn">⚠ 검사</span>}
    </div>
  )
}

/* ───────────────────────── ④ 물량 */
function 물량칸({ M, S, 엑셀받기, 받는중, set탭, set고른, set층 }) {
  if (!M.부재.length) return <div className="card"><p>아직 세운 부재가 없습니다. <button type="button" className="gmd-link" onClick={() => set탭('세우기')}>③ 세우기</button>에서 세우거나, 위의 «가상 예시» 로 해 보십시오.</p></div>
  if (!S || S.오류) return <div className="card"><p className="gmd-warn">셈을 하지 못했습니다 — {S && S.오류}</p></div>
  const 합표 = (S.R.집계 && S.R.집계.합) || []
  const 줄 = (r, i, 앞) => (
    <tr key={i}>{앞}<td className="num">{r.개수}</td><td className="num">{수글(r.콘크리트)}</td><td className="num">{수글(r.거푸집, 2)}</td><td className="num">{수글(r.철근 / 1000, 4)}</td></tr>
  )
  const 겹친 = (S.검사.find((z) => z.겹친) || {}).겹친 || []
  return (
    <div className="card">
      <요약줄 S={S} />
      <div className="gmd-top">
        <button type="button" className="btn" style={{ width: 'auto' }} onClick={엑셀받기} disabled={!!받는중}>{받는중 ? '만드는 중…' : '📊 엑셀 산출서 받기'}</button>
        <span className="muted gmd-p">산출서(산출식 · =ROUND(식,3)) · 집계 · 부재별 · 모델 시트 — 엑셀에서 다시 셉니다.</span>
      </div>
      <h2 className="gmd-h">층별</h2>
      <div className="gmd-tablewrap"><table className="gmd-table">
        <thead><tr><th>층</th><th>부재</th><th>개수</th><th>콘크리트 ㎥</th><th>거푸집 ㎡</th><th>철근 ton</th></tr></thead>
        <tbody>{S.층별.map((r, i) => 줄(r, i, <><td>{r.층 === 'FT' ? 'FT' : r.층 + '층'}</td><td>{r.종류}</td></>))}</tbody>
      </table></div>
      <h2 className="gmd-h">부호별</h2>
      <div className="gmd-tablewrap"><table className="gmd-table">
        <thead><tr><th>부재</th><th>부호</th><th>개수</th><th>콘크리트 ㎥</th><th>거푸집 ㎡</th><th>철근 ton</th></tr></thead>
        <tbody>{S.부호별.map((r, i) => 줄(r, i, <><td>{r.종류}</td><td>{r.부호}</td></>))}</tbody>
      </table></div>
      {S.덧 && S.덧.줄 > 0 && <p className="gmd-p gmd-addrows" role="note">📄 도면 덧줄 {S.덧.줄}줄(부재가 아닌 줄 — MAT 추가 보강근 · 구조물 판 같은 골조 셈 «보강» 표 그대로): 콘크리트 {수글(S.덧.콘크리트)} ㎥ · 거푸집 {수글(S.덧.거푸집, 2)} ㎡ · 철근 {수글(S.덧.철근 / 1000, 3)} ton — 위 합에 들어 있고 층별 · 부호별에는 없음</p>}
      <h2 className="gmd-h">규격별(할증 넣은 내역 수량)</h2>
      <div className="gmd-tablewrap"><table className="gmd-table">
        <thead><tr><th>항목</th><th>규격</th><th>단위</th><th>산출</th><th>할증 %</th><th>내역</th></tr></thead>
        <tbody>{합표.map((r, i) => <tr key={i}><td>{r.항목}</td><td>{r.규격}</td><td>{r.단위}</td><td className="num">{수글(r.산출)}</td><td className="num">{r.할증}</td><td className="num">{수글(r.내역)}</td></tr>)}</tbody>
      </table></div>
      <h2 className="gmd-h">검사</h2>
      <ul className="gmd-check">
        {S.검사.map((z, i) => <li key={i} className={z.좋음 ? 'ok' : 'bad'}>{z.좋음 ? '✓' : '⚠'} {z.글}</li>)}
        {겹친.slice(0, 30).map((x, i) => <li key={'k' + i} className="bad sub"><button type="button" className="gmd-link" onClick={() => { const o = M.부재.find((u) => u.id === x.ids[0]); if (o) { set층(o.층); set고른(o.id); set탭('세우기') } }}>{x.종 === '둘' ? '❓ ' : ''}{x.글}</button></li>)}
      </ul>
      {S.경고.length > 0 && (<>
        <h2 className="gmd-h">경고 {S.경고.length}</h2>
        <ul className="gmd-check">{S.경고.slice(0, 80).map((w, i) => <li key={i} className="bad">⚠ {w}</li>)}</ul>
      </>)}
      <details className="gmd-lines-d">
        <summary>산출서 미리 보기({S.R.줄.length}줄)</summary>
        <div className="gmd-tablewrap"><table className="gmd-table small">
          <thead><tr><th>층</th><th>부재</th><th>기호</th><th>항목</th><th>규격</th><th>산출근거</th><th>수량</th><th>비고</th></tr></thead>
          <tbody>{S.R.줄.slice(0, 400).map((x, i) => <tr key={i}><td>{x.층}</td><td>{x.부재}</td><td>{x.기호}</td><td>{x.항목}</td><td>{x.규격}</td><td className="mono">{x.식}</td><td className="num">{수글(x.수량)}</td><td className="muted">{x.비고}</td></tr>)}</tbody>
        </table></div>
      </details>
      <p className="muted gmd-p">셈 규칙: 보 = 폭×(춤−슬라브)×안목(받침 면 사이) · 기둥 = 단면×(층고−슬라브) · 슬라브 = 보 가운데까지(옆 슬라브 없는 변은 보 · 벽 바깥 면까지)×두께 · 벽 = (길이−단부)×(높이−위 보 춤 또는 슬라브) · 계단 = 경사판 × 판 수 + 디딤 삼각형 + 참 · 거푸집은 골조 수량산출과 같음 · 철근 정착 · 이음 = 도면 일반사항 표(도면에서 세운 모델 · 없으면 KDS 기본식).</p>
    </div>
  )
}
