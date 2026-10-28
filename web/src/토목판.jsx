/**
 * 🛣 K-적산컨맵 작업 화면 «토목» 탭 (G396 · 2026-10-24) — 🔒 작업 화면은 운영자(소장님 브라우저)만
 *
 * 소장님: 「토목도 되는 거지?」 · 「도구도 따로?」 · 「좌표가 있어야 해」 → 같은 작업 화면에 🏢 건축 | 🛣 토목 (따로 안 만듦)
 *   바탕 = 노선(STA) · 실제 좌표(TM X · Y) · 표고(EL) · 측량점 파일 · 좌표계 — 읽기는 BIM 물량 화면과 같은 길(도면 3D 일꾼)
 * ■ 왼쪽: 🧭 토목 길잡이(측량 → 노선 → 종단 → 횡단 → 구조물 → 땅 → 물량) · 📚 도면함(기준 · 맞춤 · 그대로 · 옆 · 높이만)
 * ■ 가운데: 📐 평면(노선 · 측점 눈금 · 측량점 · 구조물 · 도면 선 — 누르면 그 자리 X · Y · EL · STA) · 🧊 3D(배수로 · 흙 · 구조물 · 땅)
 * ■ 오른쪽: 📍 좌표계(경위도 · 지도) · 고른 자리 · 🛣 노선(측점표 STA · X · Y · 지반고 · 계획고 · 땅 EL) · 📏 측점 성과 맞대기 · 📐 토공 합
 * ■ 이 브라우저에만 저장(IndexedDB «kcm.civil.v1») — 예시는 저장 안 함 · 서버로 안 감 · 비용 0
 * ■ 📊 숨은 누적: |토목탭|열기 · 도면넣기 · 예시 · 엑셀 · CSV · 자리 · 좌표계 · 노선 · 3D
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 세기 } from './lib/받은수.jsx'
import { 노선목록, 측점표, 측점표CSV, 자리읽기, 땅찾개, 좌표계들, TM경위도, 지도주소, 토목길잡이, 도면함, 파일함, 부재도면, 도면줄기, 측점성과대조, STA글, 골조모양, 골조자리, 골조덩어리옮기기, 함께합 } from './lib/토목작업.js'
import { 토목모델, 토목색, 토목비침 } from './lib/BIM토목.js'
import { 부재보기 } from './lib/bim3d.js'
import { 토목상태 } from './lib/토목읽기.js'
import { 넣기 as 기억넣기, 꺼내기 as 기억꺼내기, 지우기 as 기억지우기 } from './lib/기억자료.js'
import { 파일한도 } from './lib/파일한도.js'
import { 층높이 } from './lib/골조모델.js'
import { 건설맵묶음, 맞대기, 갈래이름, 갈래단위, 판정글, 상태갈래 } from './lib/토목내역.js'
import { 차례정렬, 도면차례 } from './lib/도면차례.js'
import 받기검사판 from './받기검사판.jsx'

/* 🧪 예시 — BIM 물량 화면 «가상 배수로 · 배수장 + 관리동 · 건물 · 흙막이 한꺼번에» 와 같은 도면(가상) + 측점 성과 CSV — 🛣🏢 G397 골조(3층)도 같이 */
const 예시파일 = ['BIM예시_측량도면.dxf', 'BIM예시_계획평면도.dxf', 'BIM예시_종횡단면도.dxf', 'BIM예시_배수장일반도.dxf', 'BIM예시_관리동평면도.dxf', 'BIM_예시_3층.dxf', 'BIM예시_흙막이도.dxf', 'BIM예시_측점성과.csv']
const 쉼 = (n, d = 0) => (Number.isFinite(n) ? Number(n).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—')
const 높글 = (v) => (Number.isFinite(v) ? (v > 0 ? '+' : '') + v.toFixed(2) : '—')
const 어두움 = () => { try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch (e) { return false } }
const 내려주기 = (blob, 이름) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 60000)
}
const 골조ID = 3000000                     // 3D 고르기 번호 — 골조 덩어리는 이 위
const 묶음열쇠 = (t) => (t ? String(t.묶음 || '') + '|' + (t.파일 || []).join(',') : null)
const 내역열쇠 = 'kcm.civil.ny.v1'       // 📑 G399 내역 대조 — 이 브라우저 IndexedDB(토목 결과 옆 · 예시는 저장 안 함)

export default function 토목판({ 전체화면, 나가기, 분야칸, M, S, 함께넣기, 도면상태: 상태, set도면상태: set상태, 알림, set알림, 건축으로 }) {
  const [T, setT0] = useState(() => 토목상태.얻기())
  const [보기, set보기] = useState('평면')
  const [고른노선, set고른노선] = useState(() => { const t = 토목상태.얻기(); return t && t.활용.노선.length ? t.활용.노선[0].이름 : '' })
  const [자리, set자리] = useState(null)              // {x, y} mm(일꾼 좌표)
  const [고른부재, set고른부재] = useState(null)
  const [골조같이, set골조같이] = useState(null)       // null = 같이 넣은 것이면 같이(묶음) · true/false = 고름
  const [예시닫음, set예시닫음] = useState(false)
  const [보는, set보는] = useState(null)            // 📚 G440 도면함 «그 도면만 보기» — null = 모두 · Set(도면 줄기)
  const [내역, set내역] = useState(null)               // 📑 G398 내역 대조 — { 나무, 파일 } · G399 이 브라우저에 저장(예시는 안 함)
  const [내역상태번, set내역상태번] = useState(null)
  const [내역고침, set내역고침] = useState({})          // ✋ G399 사람이 고친 짝 {'묶음키|갈래': 공종i | null}
  const 내역읽음 = useRef(false)
  const 내역Ref = useRef(null)
  const 파일Ref = useRef(null)
  const 센 = useRef(new Set())
  const 앞묶음 = useRef(묶음열쇠(토목상태.얻기()))
  const 한번 = (k) => { if (센.current.has(k)) return; 센.current.add(k); 세기(k) }

  /* 토목 결과 — 작업 화면과 같이 보는 저장소(lib/토목읽기.js 토목상태 · 이 브라우저 IndexedDB) */
  useEffect(() => {
    세기('|토목탭|열기')
    /* 다른 도면을 넣었을 때만 고른 것 · 같이 보기를 처음으로(좌표계만 바꾼 것은 그대로) */
    const 끊 = 토목상태.듣기((t) => {
      setT0(t)
      const 새 = 묶음열쇠(t)
      if (새 === 앞묶음.current) return
      앞묶음.current = 새
      set자리(null); set고른부재(null); set골조같이(null); set예시닫음(false); set고른노선(t && t.활용.노선.length ? t.활용.노선[0].이름 : '')
      set내역고침({})                                 // 묶음 번호가 바뀌니 고친 짝은 처음대로(내역서는 그대로)
      set보는(null)                                   // 📚 G440 새 도면이면 모두 보기로
    })
    토목상태.열기()
    return 끊
  }, [])

  const 활 = T ? T.활용 : null
  const 땅 = useMemo(() => (활 ? 땅찾개(활) : () => NaN), [활])
  const 노선들 = useMemo(() => (활 ? 노선목록(활) : []), [활])
  const 길 = useMemo(() => 토목길잡이(T), [T])
  const 함 = useMemo(() => (T ? 도면함(T.그룹) : []), [T])
  const 파일들 = useMemo(() => (T ? 파일함(T) : []), [T])     // 📚 G440 넣은 파일마다 한 줄
  /* 📚 G440 그 도면만 — 평면에 그릴 것이 없고(단면 · 구조물 일반도) 3D 에만 있으면 3D 로 바로 */
  const 선수 = useMemo(() => { const m = new Map(); const F = T && T.바탕파일; if (F) for (const f of F) m.set(f, (m.get(f) || 0) + 1); return m }, [T])
  const 땅보임 = !보는 || 파일들.some((x) => 보는.has(x.줄기) && (x.갈래['측량'] || x.갈래['측량 성과표']))
  const 보기세기 = (v) => {
    set보는(v); 한번('|토목탭|도면만보기')
    if (!v || !v.size || !T) return
    const 고 = 파일들.filter((x) => v.has(x.줄기))
    const 평 = 고.some((x) => (선수.get(x.i) || 0) > 0 || (T.활용.구조 || []).some((q) => q.자리 !== '옆' && 도면줄기((q.파일 || [])[0]) === x.줄기))
    const 삼 = 고.some((x) => x.구조 || x.횡단 || x.건물)
    if (!평 && 삼 && 보기 === '평면') set보기('3D')
  }
  const 표 = useMemo(() => (활 && 고른노선 ? 측점표(활, 고른노선, { 땅 }) : []), [활, 고른노선, 땅])
  const 대조 = useMemo(() => (활 && T.측점성과 && T.측점성과.length ? 측점성과대조(활, T.측점성과) : []), [활, T])
  const 읽은자리 = useMemo(() => (활 && 자리 ? 자리읽기(활, 자리.x, 자리.y, 땅) : null), [활, 자리, 땅])
  const 계 = T ? 좌표계들.find((c) => c.k === (T.좌표계고름 || T.좌표계.k)) || 좌표계들[0] : 좌표계들[0]
  const 가운데경위 = useMemo(() => {
    if (!활 || !활.실좌표 || !계.원 || !T.틀) return null
    const x = (T.틀[0] + T.틀[2]) / 2, y = (T.틀[1] + T.틀[3]) / 2
    const X = 활.바꿈 ? x / 1000 : y / 1000, Y = 활.바꿈 ? y / 1000 : x / 1000
    return TM경위도(X, Y, 계.원)
  }, [활, 계, T])
  /* 🛣🏢 G397 골조와 함께 — 같이 넣은 것(묶음)이면 처음부터 같이 · 다른 도면에서 세운 골조는 고르면 같이 */
  const 골조있음 = !!(M && M.부재 && M.부재.length && S && !S.오류 && (S.덩어리 || []).length)
  const 같이넣음 = !!(골조있음 && T && M.묶음 && T.골조묶음 === M.묶음)
  const 골조보기 = 골조있음 && (골조같이 === null ? 같이넣음 : 골조같이)
  const 토 = useMemo(() => { if (!활) return null; try { return 토목모델(활, T.center, { 뺄건물: 골조보기 && 같이넣음 ? T.골조파일 || [] : [] }) } catch (e) { return { 부재: [], 노선들: [], 구조물들: [], 건물들: [], 합: { 콘크리트: 0, 거푸집: 0, 터파기: 0, 되메우기: 0, 성토: 0, 절토: 0 }, 경고: ['3D 를 세우다 멈췄습니다: ' + e.message], 원점: [0, 0], 땅높이: NaN } } }, [활, T, 골조보기, 같이넣음])
  const 골 = useMemo(() => { if (!골조보기) return null; try { return 골조모양(M, S.덩어리, 층높이(M)) } catch (e) { return null } }, [골조보기, M, S])
  const 자 = useMemo(() => { if (!골) return null; try { return 골조자리(골, 토) } catch (e) { return { θ: 0, tx: 0, ty: 0, dz: 0, 방법: '그대로', 글: '골조 자리를 찾다 멈춤 — 골조 그대로(' + ((e && e.message) || e) + ')' } } }, [골, 토])
  const 뺄번 = 자 && (자.방법 === '통심' || 자.방법 === '발자국') ? 자.번 : -1
  const 골조부재 = useMemo(() => (골조보기 && 자 ? 골조덩어리옮기기(S.덩어리, 자, 골조ID) : []), [골조보기, 자, S])
  const 함께 = useMemo(() => (골조보기 || 토 ? 함께합(골조보기 ? S.합 : null, 토, 뺄번) : null), [골조보기, S, 토, 뺄번])
  /* 📑 G398 내역 대조 — 내역서 품목 ↔ 건설맵 묶음(노선 · 구조물 · 건물 평면 · 골조) */
  const 내대 = useMemo(() => {
    if (!내역 || (!토 && !골조보기)) return null
    try {
      const 철근표 = (T && T.철근표) || []
      const 묶 = 건설맵묶음(토, 골조보기 && 함께 ? 함께.골조 : null, { 뺄건물: 뺄번, 골조이름: M && M.이름, 철근표 })
      return 맞대기(내역.나무, 묶, { 상태번: Number.isInteger(내역상태번) ? 내역상태번 : undefined, 고침: 내역고침, 미터당: 철근표.reduce((a, x) => a + (x.미터당 || 0), 0) })
    } catch (e) { return { 틀림: (e && e.message) || String(e) } }
  }, [내역, 내역상태번, 내역고침, 토, 골조보기, 함께, 뺄번, M, T])
  /* 📑 G399 내역 대조 저장 — 처음 한 번 꺼냄 · 바뀌면 넣음(예시 도면이면 저장 안 함) */
  useEffect(() => {
    if (내역읽음.current || !T) return
    내역읽음.current = true
    if (T.예시) return
    기억꺼내기(내역열쇠).then((v) => { if (v && v.나무 && !내역) { set내역({ 나무: v.나무, 파일: v.파일 }); if (Number.isInteger(v.상태번)) set내역상태번(v.상태번); if (v.묶음 === 묶음열쇠(T) && v.고침) set내역고침(v.고침) } }).catch(() => {})
  }, [T])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!내역읽음.current || !T || T.예시 || !내역) return
    const h = setTimeout(() => { 기억넣기(내역열쇠, { 나무: 내역.나무, 파일: 내역.파일, 상태번: 내역상태번, 고침: 내역고침, 묶음: 묶음열쇠(T) }).catch(() => {}) }, 400)
    return () => clearTimeout(h)
  }, [내역, 내역상태번, 내역고침, T])

  /* ── 넣기 — 🛣🏢 G397 작업 화면의 «함께 넣기»(골조 · 토목 같이) ── */
  const 파일넣기 = async (files) => {
    const list = [...(files || [])]
    const 도 = list.filter((f) => /\.(dxf|dwg)$/i.test(f.name)), 표 = list.filter((f) => /\.(xlsx?|csv|txt)$/i.test(f.name))
    if (!도.length) { set상태({ k: 'err', 글: 'DXF · DWG 도면을 넣어 주십시오(측량점 파일 엑셀 · CSV 는 도면과 같이).' }); return }
    const 한 = 파일한도(), 큰 = 도.filter((f) => f.size > 한)
    if (큰.length) { set상태({ k: 'err', 글: 큰.map((f) => f.name).join(', ') + ' — 이 기기에서 읽기에 너무 큰 도면입니다' }); return }
    const 읽 = async (f) => ({ 이름: f.name, buf: await f.arrayBuffer() })
    const r = await 함께넣기([...(await Promise.all(도.map(읽))), ...(await Promise.all(표.map(읽)))], { 물음: '🏢 건축 탭 골조 모델도 이 도면에서 세운 것으로 바꿀까요? (↶ 되돌리기로 돌아올 수 있습니다)' })
    if (r) 세기('|토목탭|도면넣기')
    if (r && r.세움 && !r.토목) set골조같이(true)       // 토목은 못 찾고 골조만 섰으면 이 탭에서도 바로 골조를 보임
  }
  const 예시열기 = async () => {
    set상태({ k: 'busy', 글: '가상 예시 도면 받는 중' })
    try {
      const 받 = async (n) => { const res = await fetch('/jeoksan/' + encodeURIComponent(n)); if (!res.ok) throw new Error(n + ' 받지 못함'); return { 이름: n, buf: await res.arrayBuffer() } }
      const r = await 함께넣기(await Promise.all(예시파일.map(받)), { 예시: true, 이름: '가상 배수로 · 배수장 · 관리동 · 3층 건물(예시)', 물음: '🏢 건축 탭 골조 모델도 예시(가상 3층 건물)로 바꿀까요? (↶ 되돌리기로 돌아올 수 있습니다)' })
      if (r) 세기('|토목탭|예시')
    } catch (e) { set상태({ k: 'err', 글: (e && e.message) || String(e) }) }
  }
  const 비우기 = async () => {
    if (!window.confirm('토목 탭에 넣은 도면 결과를 이 브라우저에서 지울까요? (🏢 건축 탭 골조 모델은 그대로)')) return
    await 토목상태.지우기()
    set내역(null); set내역고침({}); try { await 기억지우기(내역열쇠) } catch (e) { /* 없음 */ }
  }
  const 좌표계고르기 = async (k) => {
    if (!T) return
    await 토목상태.넣기({ ...T, 좌표계고름: k })
    세기('|토목탭|좌표계')
  }

  /* ── 📑 내역 대조 — 내역서(설계 · 변경 · .xls · .xlsx) 넣기 ── */
  const 내역넣기 = async (f) => {
    if (!f) return
    set상태({ k: 'busy', 글: '내역서 읽는 중 — ' + f.name })
    try {
      const { 내역열기 } = await import('./lib/토목내역.js')
      const 나무 = 내역열기(new Uint8Array(await f.arrayBuffer()), f.name)
      set내역({ 나무, 파일: f.name }); set내역상태번(null); set내역고침({}); 내역읽음.current = true; set보기('내역'); set상태(null)
      세기('|토목탭|내역대조')
    } catch (e) { set상태({ k: 'err', 글: '내역서를 읽지 못했습니다 — ' + ((e && e.message) || e) }) }
  }
  const 예시내역 = async () => {
    try {
      const res = await fetch('/jeoksan/' + encodeURIComponent('BIM예시_내역서.xlsx'))
      if (!res.ok) throw new Error('예시 내역서를 받지 못함')
      await 내역넣기(new File([await res.blob()], 'BIM예시_내역서.xlsx'))
      세기('|토목탭|내역예시')
    } catch (e) { set상태({ k: 'err', 글: (e && e.message) || String(e) }) }
  }

  /* ── 엑셀 · CSV ── */
  const [받는중, set받는중] = useState(false)
  const [검사, set검사] = useState(null)       // 📋 G442 받기 전 검사 결과 {통과, 줄, 바이트, 이름}
  const 파일이름 = (T && T.이름 ? T.이름 : M && M.이름 ? M.이름 : '토목').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30)
  const 엑셀받기 = async () => {
    if (!T && !골조보기) return
    set받는중(true)
    try {
      const { ST } = await import('./lib/qtoxlsx.js')
      const 시 = await import('./lib/토목시트.js')
      const 쓴 = new Set()
      const sheets = []
      /* 🏢 골조(같이 볼 때) — 건축 탭 엑셀과 같은 산출서 시트 */
      if (골조보기) {
        const { 엑셀: 골조엑셀 } = await import('./lib/골조.js')
        const { 모델시트 } = await import('./lib/골조모델.js')
        sheets.push(...골조엑셀(S.공사, S.R, (x) => x, ST), ...모델시트(M, S, ST))
      }
      if (T && 토) {
        const 표들 = 활.노선.map((L) => ({ 이름: L.이름, 줄: 측점표(활, L.이름, { 땅 }) }))
        const 경 = 가운데경위
        sheets.push(...시.토목시트(토, ST, 뺄번 >= 0 ? 토.건물들[뺄번].이름 : ''), ...시.측점표시트(표들, ST, 쓴), ...(대조.length ? [시.대조시트(대조, ST)] : []),
          시.좌표계시트([
            ['좌표', 활.실좌표 ? '실제 측량 좌표(TM · m) — X = 북 · Y = 동' : '도면 좌표(측량 자료가 기준이 아님)'],
            ['좌표계(고름)', 계.이름], ['고른 까닭', T.좌표계.까닭],
            ['현장 가운데 경위도', 경 ? `위도 ${경.위도.toFixed(6)} · 경도 ${경.경도.toFixed(6)}` : '—'],
            ['좌표 성과표', T.성과 ? `${T.성과.파일} · ${T.성과.n}점` : '없음'],
            ['넣은 도면', (T.파일 || []).join(', ')],
            ['측점', '측점(NO) = 노선 간격(도면 측점 글자 사이) · STA = km+m · 지반고 · 계획고 = 종단 표 안에서만(표 밖은 비움) · 땅 면 EL = 측량점 삼각망'],
            ...(골조보기 && 자 ? [['골조 자리', 자.글]] : []),
          ]))
      }
      if (함께 && 골조보기) sheets.unshift(시.함께시트(함께, ST, 자))
      /* 📐 G399 배근도 철근 재료표(파일 · 직경마다 톤) — 합은 SUM 식 */
      const 철표 = ((T && T.철근표) || []).filter((x) => x.t > 0)
      if (철표.length) {
        const 줄 = []
        for (const x of 철표) x.직경.forEach((d, j) => 줄.push([x.파일.replace(/\.(dxf|dwg)$/i, ''), d.d, { v: +d.t.toFixed(3), st: ST.QTY }, j === 0 && x.검산.length ? '표 검산 ' + x.검산.length + '곳 — ' + x.검산.join(' · ') : '']))
        줄.push(['합계', '', { f: `SUM(C2:C${줄.length + 1})`, st: ST.QTY }, ((T && T.철근표) || []).some((x) => x.미터당) ? '«1m당» 철근표는 연장을 곱해야 해서 뺌' : ''])
        sheets.push({ name: '도면 철근 재료표', head: ['도면', '직경', '철근(t)', '비고'], rows: 줄, widths: [40, 8, 12, 60], freeze: 1 })
      }
      if (내대 && !내대.틀림) { const { 내역대조시트 } = await import('./lib/토목내역.js'); sheets.splice(함께 && 골조보기 ? 1 : 0, 0, ...내역대조시트(내대, 내역.나무, ST)) }
      /* 📋 G442 받기 전 검사 — 한 번 더 셈해 보고(화면 · 3D 합 = 엑셀) 통과하면 받음 · 못 통과면 알리고 «알고 받기» */
      const 검 = await import('./lib/받기전검사.js')
      await new Promise((ok) => setTimeout(ok, 30))          // «…» 가 먼저 그려지게
      const r = 검.받기전검사(sheets, [...(T && 토 ? 검.토목맞댈(토, 함께, { 함께시트: !!(함께 && 골조보기) }) : []), ...(골조보기 && S ? 검.골조맞댈(S) : [])])
      const 이름 = (골조보기 && T ? '골조토목_' : 골조보기 ? '골조_' : '토목_') + 파일이름 + '.xlsx'
      set검사({ ...r, 이름 })
      if (r.통과) 내려주기(new Blob([r.바이트], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 이름)
      if (r.통과) 세기('|토목탭|엑셀')
    } catch (e) { set상태({ k: 'err', 글: '엑셀을 만들지 못했습니다 — ' + ((e && e.message) || e) }) } finally { set받는중(false) }
  }
  const CSV받기 = () => {
    if (!고른노선 || !표.length) return
    내려주기(new Blob(['\uFEFF' + 측점표CSV(고른노선, 표)], { type: 'text/csv;charset=utf-8' }), '측점표_' + 고른노선.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30) + '.csv')
    세기('|토목탭|CSV')
  }

  const 바쁨 = !!(상태 && 상태.k === 'busy')
  const 열림 = !!(T || 골조보기)
  const 보기쓸 = 보기 === '내역' && 내역 ? '내역' : T ? (보기 === '내역' ? '평면' : 보기) : '3D'
  const 넣기단추 = (cls) => <button type="button" className={cls} onClick={() => 파일Ref.current && 파일Ref.current.click()} disabled={바쁨}>📐 도면 넣기(골조 · 토목 함께)</button>
  const 뺄ids = useMemo(() => (토 && 뺄번 >= 0 && 토.건물들[뺄번] ? new Set(토.건물들[뺄번].ids || []) : null), [토, 뺄번])
  /* 📚 G440 «그 도면만 보기» — 골조는 골조로 세운 도면을 골랐을 때만 */
  const 보는골조 = useMemo(() => (!보는 ? 골조부재 : ((T && T.골조파일) || []).some((f) => 보는.has(도면줄기(f))) ? 골조부재 : []), [보는, 골조부재, T])
  return (
    <>
      <받기검사판 검사={검사} 닫기={() => set검사(null)} 받기={() => { if (!검사) return; 내려주기(new Blob([검사.바이트], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 검사.이름); 세기('|토목탭|엑셀'); set검사({ ...검사, 알고: true }) }} />
      <div className="gmd-ws-top tmk-top">
        {분야칸}
        <span className="gmd-ws-acts">
          {넣기단추('btn sm gmd-ws-dwg tmk-dwg')}
          <button type="button" className="btn line sm tmk-ex" onClick={예시열기} disabled={바쁨}>🧪 예시</button>
          <button type="button" className="btn line sm tmk-nybtn" onClick={() => 내역Ref.current && 내역Ref.current.click()} disabled={!열림 || 바쁨} title="내역서(설계 · 변경 · .xls · .xlsx)를 넣어 건설맵 물량과 맞대 봅니다">📑 내역 대조</button>
          <button type="button" className="btn line sm tmk-xlsx" onClick={엑셀받기} disabled={!열림 || 받는중 || 바쁨}>{받는중 ? '…' : '📊 엑셀'}</button>
          <button type="button" className="btn line sm" onClick={비우기} disabled={!T || 바쁨} title="이 브라우저에 저장한 토목 결과 지우기(🏢 골조 모델은 그대로)">🗑</button>
          <button type="button" className="btn line sm" onClick={전체화면} title="전체 화면">⛶</button>
          <button type="button" className="btn sm" onClick={나가기}>✕ 나가기</button>
        </span>
        <input ref={파일Ref} className="tmk-in" type="file" accept=".dxf,.dwg,.xlsx,.xls,.csv,.txt" multiple style={{ display: 'none' }} onChange={(e) => { 파일넣기(e.target.files); e.target.value = '' }} />
        <input ref={내역Ref} className="tmk-nyin" type="file" accept=".xls,.xlsx,.csv" style={{ display: 'none' }} onChange={(e) => { 내역넣기(e.target.files && e.target.files[0]); e.target.value = '' }} />
      </div>
      {상태 && <div className={'gmd-note gmd-ws-note tmk-state' + (상태.k === 'err' ? ' gmd-warnbox' : '')} role="status">{상태.k === 'busy' ? '⏳ ' : '⚠ '}{상태.글}{상태.k !== 'busy' && <button type="button" className="gmd-x" onClick={() => set상태(null)} aria-label="닫기">✕</button>}</div>}
      {알림 && !바쁨 && <div className="gmd-note gmd-ws-note tmk-said">{알림}<button type="button" className="gmd-x" onClick={() => set알림('')} aria-label="닫기">✕</button></div>}
      {T && T.예시 && !예시닫음 && <div className="gmd-note gmd-ws-note tmk-exnote">가상 예시(배수로 360 m · 배수장 · 관리동 · 3층 건물 골조 · 측량점 · 측점 성과)입니다 — 실제 현장이 아닙니다. 평면을 누르면 그 자리의 X · Y · EL · STA 가 나오고, 🧊 3D 에는 골조와 토목이 같은 좌표에 섭니다.<button type="button" className="gmd-x" onClick={() => set예시닫음(true)} aria-label="닫기">✕</button></div>}
      {!열림 ? (
        <div className="gmd-ws-page">
          <div className="card tmk-empty">
            <h3 style={{ marginTop: 0 }}>🛣 토목 — 노선(STA) · 실제 좌표(TM X · Y) · 표고(EL) · 🏢 골조와 함께</h3>
            <p className="muted" style={{ lineHeight: 1.75 }}>도면을 한꺼번에 넣으면 측량 자료를 기준으로 실제 좌표에 맞추고, 노선마다 측점(STA) · 좌표 · 지반고 · 계획고 · 땅 면 EL 과 평균단면 토공 · 구조물 물량을 냅니다. 건축 평면 · 부재 일람표가 같이 있으면 <b>🏢 골조도 같이 세워</b> 같은 3D · 같은 좌표에 놓고 물량을 합칩니다(BIM 물량 화면과 같은 읽기).</p>
            <ol className="tmk-need">
              <li><b>측량 자료</b> — GPS · 측량도면(높이 든 측량점) 또는 좌표 성과표(점 · X · Y · Z 엑셀 · CSV) <span className="muted">— 실제 좌표의 기준</span></li>
              <li><b>계획평면도 · 종평면도</b> — 측점 글자(NO.0 · 0+020)와 중심선 <span className="muted">— 노선 · STA</span></li>
              <li><b>종단면도 · 횡단면도</b> — 측점 · 지반고 · 계획고 표 · 단면 <span className="muted">— EL · 토공</span></li>
              <li><b>구조물 일반도</b>(있으면) · <b>측점 성과</b>(시공측량 — 위치 · 설계지반고 · 시공 지반고 엑셀, 있으면)</li>
              <li><b>🏢 건축 평면 · 부재 일람표</b>(있으면) <span className="muted">— 골조(기둥 · 보 · 벽 · 슬라브 · 기초) · 콘크리트 · 거푸집 · 철근</span></li>
            </ol>
            <div className="gmd-top">
              {넣기단추('btn sm')}
              <button type="button" className="btn line sm" onClick={예시열기} disabled={바쁨}>🧪 가상 예시로 해 보기</button>
            </div>
            {골조있음 && <small className="muted">🏢 건축 탭에 골조(부재 {M.부재.length})가 있습니다 — <button type="button" className="gmd-link" onClick={() => set골조같이(true)}>토목 없이 골조만 여기서 보기</button></small>}
          </div>
        </div>
      ) : (
        <div className={'gmd-ws-body tmk-body view-' + 보기쓸 + (T ? '' : ' tmk-only')}>
          <aside className="gmd-ws-left tmk-left" aria-label="토목 길잡이 · 도면함">
            <details className="gmd-guide tmk-guide" open={!T || 길.some((x) => x.상태 === '⚠')}>
              <summary><b>🧭 {T ? '토목 길잡이' : '골조만 — 토목 도면 없음'}</b> <small className="muted">✓ {길.filter((x) => x.상태 === '✓').length} / {길.length}</small></summary>
              <ul className="tmk-steps">
                {길.map((x) => <li key={x.k} className={'tmk-step s-' + (x.상태 === '✓' ? 'ok' : x.상태 === '▶' ? 'now' : x.상태 === '⚠' ? 'need' : 'opt')}><span className="tmk-mark">{x.상태}</span><span><b>{x.이름}</b><small>{x.글}</small></span></li>)}
                {골조있음 && <li className={'tmk-step tmk-gstep s-' + (골조보기 ? (자 && 자.방법 === '옆' ? 'need' : 'ok') : 'opt')}><span className="tmk-mark">{골조보기 ? (자 && 자.방법 === '옆' ? '⚠' : '✓') : '·'}</span><span><b>🏢 골조</b><small>{골조보기 ? `부재 ${M.부재.length.toLocaleString('ko-KR')} · ${자 ? 자.글 : ''}` : '건축 탭 골조 — 오른쪽 «같이 보기» 를 켜면 같은 3D · 엑셀에'}</small></span></li>}
              </ul>
              {!T && <small className="muted">측량 · 계획평면 · 종횡단 도면을 같이 넣으면 노선 · 좌표 · 토공이 같은 3D 에 섭니다.</small>}
            </details>
            {T && <도면함칸 함={함} 들={파일들} T={T} 보는={보는} set보는={보기세기} />}
          </aside>
          <section className="gmd-ws-center tmk-center">
            {(T || 내역) && <div className="gmd-ws-views" role="group" aria-label="보기">
              {[...(T ? [['평면', '📐 평면'], ['3D', '🧊 3D'], ['나란히', '◫ 나란히']] : [['3D', '🧊 3D']]), ['내역', '📑 내역 대조']].map(([k, t]) => <button key={k} type="button" className={'btn line sm' + (보기쓸 === k ? ' on' : '')} aria-pressed={보기쓸 === k} onClick={() => { if (k === '내역' && !내역) { 내역Ref.current && 내역Ref.current.click(); return } set보기(k); if (k === '3D' || k === '나란히') 한번('|토목탭|3D') }}>{t}</button>)}
            </div>}
            {보기쓸 === '내역' && <내역대조칸 대조={내대} 내역={내역} 상태번={내대 && Number.isInteger(내대.상태번) ? 내대.상태번 : 0} set상태번={(i) => { set내역상태번(i); 한번('|토목탭|내역상태') }} 바꾸기={() => 내역Ref.current && 내역Ref.current.click()} 짝고치기={(k, v) => { set내역고침((P) => { const N = { ...P }; if (v === undefined) delete N[k]; else N[k] = v; return N }); 세기(/^(율|값)\|/.test(k) ? '|토목탭|값고침' : '|토목탭|짝고침') }} 짝처음={() => set내역고침({})} />}
            {보기쓸 !== '내역' && <div className="tmk-views">
              {T && 보기쓸 !== '3D' && <평면칸 T={T} 보는={보는} 땅보임={땅보임} 고른노선={고른노선} 자리={자리} 누름={(x, y) => { set자리({ x, y }); 한번('|토목탭|자리') }} 노선누름={(n) => { set고른노선(n); 한번('|토목탭|노선') }} 골조={골조보기 ? 골조부재 : null} 골조원점={토 ? 토.원점 : null} />}
              {보기쓸 !== '평면' && <삼디칸 T={T} 토={토} 보는={보는} 땅보임={땅보임} 뺄ids={뺄ids} 골조부재={보는골조} set고른부재={set고른부재} />}
            </div>}
            {T && 고른노선 && 보기쓸 !== '내역' && <측점표칸 이름={고른노선} 표={표} CSV받기={CSV받기} />}
          </section>
          <aside className="gmd-ws-right tmk-right" aria-label="좌표 · 노선 · 물량">
            <함께칸 함께={함께} 토={토} 자={자} T={T} M={M} 골조있음={골조있음} 골조보기={골조보기} 같이넣음={같이넣음} set골조같이={(v) => { set골조같이(v); if (v) 한번('|토목탭|골조같이') }} 건축으로={건축으로} />
            <div className="tmk-card tmk-nycard">
              <b>📑 내역 대조</b>
              {내역 && 내대 && !내대.틀림 ? (
                <>
                  <small className="tmk-nyfile" title={내역.파일}>{내역.파일} · {내역.나무.시트} · {내대.상태}</small>
                  <div className="tmk-nycount">{['맞음', '비슷', '다름', '없음', '부분'].filter((k) => k !== '부분' || 내대.단셈.부분).map((k) => <span key={k} className={'tmk-nyc c-' + k}>{판정글[k].split(' ')[0]} {내대.단셈[k] || 0}</span>)}</div>
                  <small className="muted">견준 품목 {내대.셈.견준} / 내역 품목 {내대.셈.품목} — 나머지는 건설맵이 아직 안 내는 품목</small>
                  <div className="gmd-top"><button type="button" className="btn line sm" onClick={() => set보기('내역')}>📑 대조 표 보기</button><button type="button" className="btn line sm" onClick={() => { set내역(null); set내역고침({}); 기억지우기(내역열쇠).catch(() => {}); if (보기 === '내역') set보기('평면') }} title="내역 대조 지우기">✕</button></div>
                </>
              ) : 내역 && 내대 && 내대.틀림 ? <small className="gmd-warn">⚠ {내대.틀림}</small> : (
                <>
                  <small className="muted">내역서(.xls · .xlsx)를 넣으면 공종마다 건설맵 물량과 맞대 봅니다.</small>
                  <div className="gmd-top"><button type="button" className="btn line sm" onClick={() => 내역Ref.current && 내역Ref.current.click()}>📑 내역서 넣기</button>{T && T.예시 && <button type="button" className="btn line sm tmk-nyex" onClick={예시내역}>🧪 예시 내역서</button>}</div>
                </>
              )}
            </div>
            {T && <div className="tmk-card tmk-crs">
              <b>📍 좌표계</b>
              {활.실좌표 ? (
                <>
                  <select value={계.k} onChange={(e) => 좌표계고르기(e.target.value)} aria-label="좌표계">{좌표계들.map((c) => <option key={c.k} value={c.k}>{c.이름}</option>)}</select>
                  <details className="tmk-why"><summary>왜 이 좌표계?</summary><small className="muted">{T.좌표계.까닭}</small></details>
                  {가운데경위 && <div className="tmk-ll">현장 가운데 위도 {가운데경위.위도.toFixed(5)}° · 경도 {가운데경위.경도.toFixed(5)}° <a href={지도주소(가운데경위.위도, 가운데경위.경도)} target="_blank" rel="noopener noreferrer">🗺 지도에서 보기</a></div>}
                </>
              ) : <small className="muted">{T.좌표계.까닭}</small>}
              {T.성과 && <small>좌표 성과표 {T.성과.파일} · {T.성과.n}점 = 기준</small>}
            </div>}
            {T && <자리칸 읽은={읽은자리} 계={계} 실좌표={!!활.실좌표} 노선고르기={(n) => set고른노선(n)} />}
            {고른부재 && <div className="tmk-card tmk-pick3d"><b>🧊 {고른부재.이름}</b>{고른부재.크기 && <small>{고른부재.크기}</small>}{고른부재.몫 && <small>{Object.entries(고른부재.몫).filter(([, v]) => Number.isFinite(v) && v).map(([k, v]) => k + ' ' + 쉼(v, 2)).join(' · ')}</small>}</div>}
            {T && <div className="tmk-card tmk-lines">
              <b>🛣 노선 {노선들.length}</b>
              {노선들.length ? (
                <ul>{노선들.map((n) => <li key={n.이름}><button type="button" className={'tmk-line' + (고른노선 === n.이름 ? ' on' : '')} onClick={() => { set고른노선(n.이름); 한번('|토목탭|노선') }}><b>{n.이름}</b><small>{n.시작.측글} ~ {n.끝.측글} · {STA글(n.범위[1]).replace('STA ', '')} · 연장 {쉼(n.연장, 1)} m · 간격 {n.간격} m · 단면 {n.단면수} · 종단 {n.종단줄 ? '✓' : '—'}{n.밖수 ? ` · 평면 노선 밖 ${n.밖수}곳(${STA글(n.끝측).replace('STA ', '')} 까지 늘림)` : ''}</small></button></li>)}</ul>
              ) : <small className="muted">노선이 없습니다 — 측점 글자 · 중심선이 있는 계획평면도를 넣어 주십시오</small>}
              {(T.겹노선 || []).map((x, i) => <small key={i} className="muted">ⓘ {x.이름}: {x.까닭}</small>)}
            </div>}
            {대조.length > 0 && <대조칸 대조={대조} />}
            {토 && <토공칸 토={토} />}
          </aside>
        </div>
      )}
    </>
  )
}

/* ── 📑 G398 내역 대조 표 ── */
function 내역대조칸({ 대조, 내역, 상태번, set상태번, 바꾸기, 짝고치기, 짝처음 }) {
  const [거름, set거름] = useState('')
  const [연것, set연것] = useState(null)
  if (!대조) return <div className="card tmk-nytable"><small className="muted">도면을 넣으면 내역서와 맞대 봅니다.</small></div>
  if (대조.틀림) return <div className="card tmk-nytable"><small className="gmd-warn">⚠ {대조.틀림}</small></div>
  const 나무 = 내역.나무
  const 걸른 = 대조.단위들.filter((d) => !거름 || d.판정 === 거름)
  const 줄 = 거름 ? 걸른 : [...걸른.filter((d) => d.판정 !== '없음'), ...걸른.filter((d) => d.판정 === '없음')]   // 🔰 G441 견준 줄(✓ △ ✗) 먼저 · «건설맵에 아직 없음» 은 아래로(회색 줄 사이에 묻히지 않게)
  const 쉼2 = (v, d = 1) => (Number.isFinite(v) ? Number(v).toLocaleString('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—')
  return (
    <div className="card tmk-nytable">
      <div className="tmk-nyhead">
        <b>📑 내역 대조 — {내역.파일}</b>
        <span className="tmk-nyopts">
          {나무.상태.length > 1 && <select value={상태번} onChange={(e) => set상태번(+e.target.value)} aria-label="내역 상태">{나무.상태.map((t, i) => <option key={i} value={i}>{t}{상태갈래(t) === '부분' ? ' (부분 물량)' : ''}</option>)}</select>}
          {대조.고침수 > 0 && <button type="button" className="btn line sm tmk-nyreset" onClick={짝처음} title="사람이 고친 짝 · 값을 모두 처음(건설맵이 짝짓고 센 대로)으로">↺ 고친 것 처음대로 {대조.고침수}</button>}
          <button type="button" className="btn line sm" onClick={바꾸기}>내역서 바꾸기</button>
        </span>
      </div>
      <div className="tmk-nycount" role="group" aria-label="판정 거르기">
        <button type="button" className={'tmk-nyc' + (!거름 ? ' on' : '')} onClick={() => set거름('')}>모두 {대조.단위들.length}</button>
        {['맞음', '비슷', '다름', '없음', '부분'].filter((k) => k !== '부분' || 대조.단셈.부분).map((k) => <button key={k} type="button" className={'tmk-nyc c-' + k + (거름 === k ? ' on' : '')} onClick={() => set거름(거름 === k ? '' : k)}>{판정글[k]} {대조.단셈[k] || 0}</button>)}
      </div>
      {대조.부분 && <small className="gmd-warn tmk-nypart">◇ «{대조.상태}» 은 차수 · 잔여 같은 부분 물량이라 건설맵(도면 전체 물량)과 견주지 않습니다 — 견주려면 위에서 «총괄» 상태(당초 · 변경)를 고르십시오.</small>}
      <div className="tmk-tablewrap tmk-nywrap">
        <table className="tmk-table tmk-nyt">
          <thead><tr><th className="tmk-nym" aria-label="판정"></th><th>공종</th><th className="tmk-nyg2">갈래</th><th>내역({대조.상태})</th><th>건설맵</th><th>차이</th><th className="tmk-nyp">판정</th></tr></thead>
          <tbody>{줄.map((d) => (
            <FragmentRow key={d.키} d={d} 열림={연것 === d.키} 누름={() => set연것(연것 === d.키 ? null : d.키)} 나무={나무} 상태번={대조.상태번} 쉼2={쉼2} 묶음들={대조.묶음들 || []} 짝고치기={짝고치기} />
          ))}</tbody>
        </table>
      </div>
      {대조.남은.length > 0 && <details className="tmk-nyleft"><summary>내역 공종과 짝을 못 찾은 건설맵 물량 {대조.남은.length} — 공종을 골라 맞댈 수 있습니다</summary><ul>{대조.남은.map((x, i) => {
        const 갈곳 = 대조.단위들.filter((u) => u.갈래 === x.갈래)
        return <li key={i}>{x.고침 ? '✋ ' : ''}{x.이름} · {갈래이름[x.갈래]} {쉼2(x.값, x.갈래 === '철근' ? 3 : 1)} {갈래단위[x.갈래]}{갈곳.length > 0 && <select className="tmk-nypair" value="" onChange={(e) => { if (e.target.value !== '') 짝고치기(x.키 + '|' + x.갈래, +e.target.value) }} aria-label={x.이름 + ' 맞댈 공종'}><option value="">→ 맞댈 공종 고르기</option>{갈곳.map((u) => <option key={u.키} value={u.공종i}>{(u.길.length > 1 ? u.길.slice(1) : u.길).slice(-2).join(' > ') || u.공종}</option>)}</select>}</li>
      })}</ul></details>}
      {대조.뺀단위 > 0 && <small className="muted tmk-nyzero">이 상태({대조.상태})에서 내역 수량이 비었거나 0 인 공종 · 갈래 {대조.뺀단위}개는 견줄 것이 없어 뺐습니다{내역.나무.상태.length > 1 ? ' — 위에서 상태를 바꿔 보십시오' : ''}.</small>}
      <small className="muted">✓ 3 % 안 · △ 10 % 안 · ✗ 넘음 — «다름» 은 곧 «틀림» 이 아닙니다 · 줄을 누르면 내역 품목과 근거가 나옵니다.</small>
      <details className="tmk-nyhow"><summary>ⓘ 어떻게 맞대나</summary><small className="muted">공종마다(자리 말 — 배수장 · 유수지 · 배수로 …) 같은 갈래 품목을 더해 건설맵 묶음과 맞댐 — «다름» 은 넣은 도면이 당초인지 변경인지 · 산출서의 셈 · 할증 때문일 수 있습니다. «— 건설맵에 아직 없음» 은 넣은 도면에서 그 공종 물량을 아직 못 뽑은 것(그 공종 도면을 넣지 않았거나 건설맵이 아직 안 세는 품목). 📤 엑셀의 «변경 수량 제안» 시트 = 견준 품목마다 건설맵 비율로 나눈 변경 수량(설계변경 작업대에 옮겨 쓰기 — 확인 후).</small></details>
    </div>
  )
}
function FragmentRow({ d, 열림, 누름, 나무, 상태번, 쉼2, 묶음들, 짝고치기 }) {
  const 율 = Number.isFinite(d.율) ? (d.율 > 0 ? '+' : '') + d.율.toFixed(1) + ' %' : '—'
  return (
    <>
      <tr className={'tmk-nyrow p-' + d.판정 + (열림 ? ' open' : '')} onClick={누름} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') 누름() }}>
        <td className="tmk-nym" title={판정글[d.판정]}>{판정글[d.판정].split(' ')[0]}</td>
        <td title={d.길.join(' > ')}>{(d.길.length > 1 ? d.길.slice(1) : d.길).slice(-2).join(' > ') || d.공종}<small className="tmk-nyg">{갈래이름[d.갈래]}</small></td><td className="tmk-nyg2">{갈래이름[d.갈래]}</td>
        <td>{d.줄수 ? 쉼2(d.내역, d.갈래 === '철근' ? 3 : 1) : '—'} <small className="tmk-nyu">{갈래단위[d.갈래]}</small></td>
        <td>{d.건설맵 > 0 ? 쉼2(d.건설맵, d.갈래 === '철근' ? 3 : 1) : '—'}</td><td>{d.판정 === '없음' || d.판정 === '부분' ? '' : 율}</td><td className="tmk-nyp">{판정글[d.판정]}</td>
      </tr>
      {열림 && <tr className="tmk-nydetail"><td colSpan={7}>
        {d.묶음.length > 0 && <div className="tmk-nypairs"><b>건설맵</b> — {d.묶음.map((b) => <span key={b.키 + b.갈래} className={'tmk-nychip' + (b.고침 ? ' fix' : '')}>{b.고침 ? '✋ ' : ''}{b.이름} {갈래이름[b.갈래] === 갈래이름[d.갈래] ? '' : '(' + 갈래이름[b.갈래] + ') '}{쉼2(b.값, d.갈래 === '철근' ? 3 : 1)}<button type="button" className="tmk-nyx" onClick={() => 짝고치기(b.키 + '|' + b.갈래, null)} title="이 묶음을 이 공종과 맞대지 않기" aria-label={b.이름 + ' 빼기'}>✕</button></span>)}</div>}
        {(d.뺀묶음 || []).length > 0 && <div className="muted">견줌에서 뺀 것 — {d.뺀묶음.map((b) => `${b.이름} ${쉼2(b.값)}`).join(' · ')}</div>}
        <div><b>내역 품목</b> — {d.품목.map((pi) => { const p = 나무.품목[pi]; const q = p.수량[상태번]; return `${p.행}행 ${p.이름}${p.규격 ? ' ' + p.규격 : ''} ${q === null || q === undefined ? '(빈칸)' : 쉼2(q, 3)} ${p.단위}` }).join(' · ')}</div>
        {d.까닭.length > 0 && <div className="tmk-nywhy">ⓘ {d.까닭.join(' · ')}</div>}
        <div className="tmk-nyfix" key={d.키 + JSON.stringify(d.사람값)}>✋ 값 고치기 — 할증 <input type="number" step="0.01" inputMode="decimal" className="tmk-nyin2" defaultValue={d.사람값 && Number.isFinite(d.사람값.율) ? d.사람값.율 : ''} placeholder="0" aria-label="할증 %" onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} onBlur={(e) => { const v = e.currentTarget.value.trim(); const 전 = d.사람값 && Number.isFinite(d.사람값.율) ? String(d.사람값.율) : ''; if (v !== 전) 짝고치기('율|' + d.키, v === '' ? undefined : +v) }} /> % · 값 직접 <input type="number" step="0.001" inputMode="decimal" className="tmk-nyin2" defaultValue={d.사람값 && Number.isFinite(d.사람값.값) ? d.사람값.값 : ''} placeholder={d.건설맵 > 0 ? d.건설맵.toFixed(d.갈래 === '철근' ? 3 : 1) : ''} aria-label="건설맵 값 직접" onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} onBlur={(e) => { const v = e.currentTarget.value.trim(); const 전 = d.사람값 && Number.isFinite(d.사람값.값) ? String(d.사람값.값) : ''; if (v !== 전) 짝고치기('값|' + d.키, v === '' ? undefined : +v) }} /> {갈래단위[d.갈래]}
          {d.사람값 && <button type="button" className="btn line sm tmk-nyunfix" onClick={() => { 짝고치기('율|' + d.키, undefined); 짝고치기('값|' + d.키, undefined) }}>✕ 고친 값 지우기</button>}
          {d.침하 !== undefined && !d.사람값 && <button type="button" className="btn line sm tmk-nysink" onClick={() => 짝고치기('율|' + d.키, +(d.침하 * 100).toFixed(2))}>침하율 {(d.침하 * 100).toFixed(2)} % 넣기</button>}
        </div>
        {(() => {
          const 있 = new Set(d.묶음.map((b) => b.키 + '|' + b.갈래))
          const 붙일 = 묶음들.filter((b) => b.값[d.갈래] > 0 && !있.has(b.키 + '|' + d.갈래))
          return 붙일.length > 0 && <div className="tmk-nyadd">✋ 짝 고치기 — <select className="tmk-nypair" value="" onChange={(e) => { if (e.target.value) 짝고치기(e.target.value + '|' + d.갈래, d.공종i) }} aria-label="이 공종과 맞댈 건설맵 묶음 더하기"><option value="">＋ 이 공종과 맞댈 건설맵 묶음 더하기</option>{붙일.map((b) => <option key={b.키} value={b.키}>{b.이름} · {쉼2(b.값[d.갈래], d.갈래 === '철근' ? 3 : 1)} {갈래단위[d.갈래]}</option>)}</select> <small className="muted">(고친 짝은 이 브라우저에 남음 · ↺ 로 처음대로)</small></div>
        })()}
      </td></tr>}
    </>
  )
}

/* ── 🏢 + 🛣 함께 — 골조 같이 보기 · 물량 합 ── */
function 함께칸({ 함께, 토 = null, 자, T, M, 골조있음, 골조보기, 같이넣음, set골조같이, 건축으로 }) {
  /* 🔰 G441 처음 쓰는 분 눈으로 — 골조가 없으면 «철근 —» 칸은 빼고(늘 빈칸) 큰 수도 안 잘리게 */
  const 철칸 = !!(함께 && 함께.골조)
  return (
    <div className="tmk-card tmk-both">
      <b>{골조있음 ? '🏢 + 🛣 함께 — 물량 합' : '📊 물량 합'}</b>
      {골조있음 && <label className="tmk-chk"><input type="checkbox" checked={!!골조보기} onChange={(e) => set골조같이(e.target.checked)} /><span>🏢 건축 탭 골조(부재 {M.부재.length.toLocaleString('ko-KR')}) 같이 보기{같이넣음 ? ' — 같이 넣은 도면' : ' — 다른 때 세운 골조'}</span></label>}
      {함께 && (
        <table className={'tmk-kv tmk-bothq' + (철칸 ? '' : ' no-rebar')}>
          <thead><tr><th /><th>콘크리트 ㎥</th><th>거푸집 ㎡</th>{철칸 && <th>철근 t</th>}</tr></thead>
          <tbody>
            {함께.골조 && <tr><th>🏢 골조</th><td>{쉼(함께.골조.콘크리트, 2)}</td><td>{쉼(함께.골조.거푸집, 1)}</td><td>{쉼(함께.골조.철근, 3)}</td></tr>}
            {함께.토목 && <tr><th>🛣 토목(노선 · 구조물)</th><td>{쉼(함께.토목.콘크리트, 2)}</td><td>{쉼(함께.토목.거푸집, 1)}</td>{철칸 && <td>—</td>}</tr>}
            {함께.토목 && 토 && (() => {
              /* 📚 G440 토목을 노선 · 구조물로 나눠 보임 — 소장님 「구조물이 달라…왜 이런거지?」(구조물 일반도를 안 넣으면 구조물 0) */
              const 더 = (a) => a.reduce((s, x) => ({ c: s.c + ((x.합 && x.합.콘크리트) || 0), f: s.f + ((x.합 && x.합.거푸집) || 0) }), { c: 0, f: 0 })
              const 노 = 더(토.노선들 || []), 구 = 더(토.구조물들 || [])
              const 남c = 함께.토목.콘크리트 - 노.c - 구.c, 남f = 함께.토목.거푸집 - 노.f - 구.f
              return <>
                <tr className="tmk-sub"><th>· 노선(배수로 · 횡단)</th><td>{쉼(노.c, 2)}</td><td>{쉼(노.f, 1)}</td>{철칸 && <td />}</tr>
                <tr className={'tmk-sub' + ((토.구조물들 || []).length ? '' : ' none')}><th>· 구조물 {(토.구조물들 || []).length}{(토.구조물들 || []).length ? '' : ' — 구조물 일반도 없음'}</th><td>{쉼(구.c, 2)}</td><td>{쉼(구.f, 1)}</td>{철칸 && <td />}</tr>
                {(Math.abs(남c) > 0.01 || Math.abs(남f) > 0.1) && <tr className="tmk-sub"><th>· 그 밖(흙막이 등)</th><td>{쉼(남c, 2)}</td><td>{쉼(남f, 1)}</td>{철칸 && <td />}</tr>}
              </>
            })()}
            {함께.건물 && <tr><th>건물 평면(개략) {함께.건물.수}</th><td>{쉼(함께.건물.콘크리트, 2)}</td><td>{쉼(함께.건물.거푸집, 1)}</td>{철칸 && <td>—</td>}</tr>}
            <tr className="sum"><th>합</th><td>{쉼(함께.합.콘크리트, 2)}</td><td>{쉼(함께.합.거푸집, 1)}</td>{철칸 && <td>{쉼(함께.합.철근, 3)}</td>}</tr>
          </tbody>
        </table>
      )}
      {함께 && 함께.토목 && <small>토공 — 터파기 {쉼(함께.토목.터파기, 1)} · 되메우기 {쉼(함께.토목.되메우기, 1)} · 성토 {쉼(함께.토목.성토, 1)} ㎥</small>}
      {T && (T.철근표 || []).some((x) => x.t > 0) && (() => { const 쓴 = T.철근표.filter((x) => x.t > 0), 미터 = T.철근표.reduce((a, x) => a + (x.미터당 || 0), 0); return <small className="tmk-rebar" title={쓴.map((x) => x.파일 + ' ' + x.t.toFixed(3) + ' t').join('\n') + (미터 ? `\n1m당 표 ${미터}개는 연장을 곱해야 해서 뺌` : '') + '\n합에는 안 넣고 📑 내역 대조에서 견줌'}>📐 도면 철근 재료표 {쉼(쓴.reduce((a, x) => a + x.t, 0), 3)} t <span className="muted">(도면 {쓴.length}장 · 참고 — 합에 안 넣음)</span></small> })()}
      {!골조있음 && <small className="muted">🏢 건축 골조는 없음 — 구조평면 · 일람표 도면을 넣으면 여기 더해집니다.</small>}
      {골조보기 && 자 && <small className={자.방법 === '옆' ? 'gmd-warn' : 'muted'}>📍 골조 자리 — {자.글}</small>}
      {골조보기 && 함께 && 함께.골조 && <small className="muted">철근은 골조만(토목 · 건물 평면은 개략 콘크리트 · 거푸집) · 같은 건물의 평면 덩어리는 두 번 안 셈</small>}
      {골조있음 && <button type="button" className="btn line sm tmk-toarch" onClick={건축으로}>🏢 건축 탭에서 골조 보기 · 고치기</button>}
      {!T && 골조보기 && <small className="muted">토목 도면이 없어 골조만 보입니다.</small>}
    </div>
  )
}

/* ── 📚 도면함 — 📚 G440 넣은 도면(파일)마다 한 줄 · ☑ 보기 · 이름을 누르면 그 도면만 ── */
function 도면함칸({ 함, 들, T, 보는, set보는 }) {
  const 쓴 = 함.filter((x) => ['기준', '맞춤', '그대로', '끼움'].includes(x.상태))
  const 높이 = 함.filter((x) => x.상태 === '높이만')
  const 옆 = 함.filter((x) => x.상태 === '옆' || x.상태 === '꺼둠')
  const 줄 = (x, i) => <li key={x.번 + '-' + i} className={'tmk-dw s-' + x.상태}><span className="tmk-kind">{x.종류}</span><span className="tmk-dwn" title={x.파일}>{x.이름}</span><small>{x.글}</small></li>
  const 켬 = (x) => !보는 || 보는.has(x.줄기)
  const 바꿈 = (x, v) => {
    const n = new Set(보는 || 들.map((d) => d.줄기))
    if (v) n.add(x.줄기); else n.delete(x.줄기)
    set보는(n.size >= new Set(들.map((d) => d.줄기)).size ? null : n)
  }
  const 혼자 = !!(보는 && 보는.size === 1)
  return (
    <div className="tmk-box tmk-files">
      <div className="tmk-fhead">
        <b>📚 도면함 — {들.length}장</b>
        {보는 && <button type="button" className="btn line sm tmk-fall" onClick={() => set보는(null)}>👁 모두 보기</button>}
      </div>
      <small className="muted">{보는 ? `${보는.size}장만 보는 중 — 물량은 넣은 도면 모두` : '이름을 누르면 그 도면만 보입니다'}</small>
      <ul className="tmk-flist">
        {[...들].sort((a, b) => a.이름.localeCompare(b.이름, 'ko', { numeric: true })).map((x) => (   /* 🔰 G441 넣은 차례 말고 이름 차례(탐색기처럼 01 · 02 · 03 …) */
          <li key={x.i} className={(켬(x) ? 'on' : 'off') + (혼자 && 켬(x) ? ' solo' : '') + (x.판 || x.구조 || x.횡단 ? '' : ' none')}>
            <input type="checkbox" checked={켬(x)} onChange={(e) => 바꿈(x, e.target.checked)} aria-label={x.줄기 + ' 보기'} />
            <button type="button" className="tmk-fnm" onClick={() => set보는(혼자 && 켬(x) ? null : new Set([x.줄기]))} title={x.이름 + (혼자 && 켬(x) ? ' — 다시 모두 보기' : ' — 이 도면만 보기')}>
              <span>{x.줄기}</span>
              <small>{x.글}</small>
            </button>
          </li>
        ))}
      </ul>
      {(T.못읽은 || []).length > 0 && <small className="gmd-warn">읽지 못함: {T.못읽은.map((x) => x.이름).join(', ')}</small>}
      <details className="tmk-more">
        <summary>판 자세히 — 좌표에 놓인 판 {쓴.length} · 높이(표)만 {높이.length} · 못 놓음 {옆.length}</summary>
        <ul className="tmk-dws">{쓴.map(줄)}</ul>
        {높이.length > 0 && <><small className="muted">종단 · 상세 · 표</small><ul className="tmk-dws">{높이.map(줄)}</ul></>}
        {옆.length > 0 && <><small className="muted">못 놓음 · 꺼 둠</small><ul className="tmk-dws">{옆.map(줄)}</ul></>}
        {(T.파일 || []).length > 1 && <보는차례 파일={T.파일} />}
      </details>
    </div>
  )
}

/* ── 📖 G401 도면 보는 차례 — docs/도면보는순서.md (건축: 목록 → 개요 → 배치 → 구조 일반 → 기초 → 지하 → 1층 → … → 지붕 → 옥탑 → 일람표 → 계단 → 데크 → 단면 → 창호 · 토목: 목차 → 사업계획 → 측량 → … → 노선 → 구조물 → 배근도 → … → 수량표) ── */
const 동그라미 = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭']
function 보는차례({ 파일 }) {
  const 순 = 차례정렬(파일)
  const 셈 = { 건축: 0, 토목: 0 }
  for (const n of 파일) { const c = 도면차례(n); if (셈[c.무리] !== undefined) 셈[c.무리]++ }
  const 많은 = 셈.토목 > 셈.건축 ? '토목' : 셈.건축 ? '건축' : null
  return (
    <details className="tmk-order">
      <summary>📖 보는 차례 — 건축은 기초에서 위층으로 · 토목은 목차 → 좌표 → 노선 → 구조물 → 검산</summary>
      <ol>{순.map((n, i) => { const c0 = 도면차례(n), c = c0.무리 === '모름' && 많은 ? 도면차례(n, 많은) : c0; return <li key={i}><span className="tmk-kind">{c.무리 === '공통' ? '표지' : c.무리}</span> <b>{동그라미[c.차례] || '·'}</b> {c.갈래}{c.층 !== null && c.층 !== undefined && c.차례 >= 5 && c.차례 <= 9 ? ` (${c.층 === -100 ? '기초' : c.층 >= 950 ? '옥탑' : c.층 >= 900 ? '지붕' : c.층 < 0 ? '지하 ' + -c.층 + '층' : c.층 + '층'})` : ''} — <span title={n}>{n}</span></li> })}</ol>
    </details>
  )
}

/* ── 📍 고른 자리 ── */
function 자리칸({ 읽은, 계, 실좌표, 노선고르기 }) {
  if (!읽은) return <div className="tmk-card tmk-spot"><b>📍 고른 자리</b><small className="muted">평면을 누르면 그 자리 좌표 · EL · STA 가 나옵니다.</small></div>
  const 경 = 실좌표 && 계.원 ? TM경위도(읽은.X, 읽은.Y, 계.원) : null
  return (
    <div className="tmk-card tmk-spot">
      <b>📍 고른 자리</b>
      <table className="tmk-kv"><tbody>
        <tr><th>X(북)</th><td>{쉼(읽은.X, 3)} m</td></tr>
        <tr><th>Y(동)</th><td>{쉼(읽은.Y, 3)} m</td></tr>
        <tr><th>땅 면 EL</th><td>{Number.isFinite(읽은.EL) ? 높글(읽은.EL) + ' m' : '— (측량점 밖)'}</td></tr>
        {경 && <tr><th>경위도</th><td>{경.위도.toFixed(6)}° · {경.경도.toFixed(6)}° <a href={지도주소(경.위도, 경.경도)} target="_blank" rel="noopener noreferrer">🗺</a></td></tr>}
      </tbody></table>
      {읽은.노선.length ? 읽은.노선.map((q) => (
        <div key={q.이름} className="tmk-near">
          <button type="button" className="gmd-link" onClick={() => 노선고르기(q.이름)}>{q.이름}</button>
          <span>{q.측글} · {q.STA}{q.밖 ? ' (노선 밖)' : ''}</span>
          <small>중심에서 {q.옆 >= 0 ? '오른쪽' : '왼쪽'} {쉼(Math.abs(q.옆), 2)} m · 지반고 {높글(q.지반고)} · 계획고 {높글(q.계획고)}</small>
        </div>
      )) : <small className="muted">60 m 안에 노선이 없습니다</small>}
    </div>
  )
}

/* ── 📍 측점표 ── */
function 측점표칸({ 이름, 표, CSV받기 }) {
  return (
    <div className="tmk-card tmk-sta">
      <div className="tmk-stahead"><b>📍 {이름} — 측점표 {표.length}</b><button type="button" className="btn line sm tmk-csv" onClick={CSV받기}>📍 측점표 CSV</button></div>
      <div className="tmk-tablewrap">
        <table className="tmk-table">
          <thead><tr><th>측점</th><th>STA</th><th>X(북)</th><th>Y(동)</th><th>지반고</th><th>계획고</th><th>땅 EL</th></tr></thead>
          <tbody>{표.map((r) => <tr key={r.측} className={(r.단면 ? 'cut' : '') + (r.밖 ? ' out' : '')} title={r.밖 ? '평면 노선 밖 — 노선 끝 방향으로 늘린 자리' : undefined}><td>{r.측글}</td><td>{r.STA.replace('STA ', '')}</td><td>{쉼(r.X, 3)}</td><td>{쉼(r.Y, 3)}</td><td>{높글(r.지반고)}</td><td>{높글(r.계획고)}</td><td>{높글(r.땅EL)}</td></tr>)}</tbody>
        </table>
      </div>
      <small className="muted">지반고 · 계획고 = 종단 표(표 밖은 —) · 땅 EL = 측량점 삼각망 · 굵은 줄 = 횡단 단면 있음 · 흐린 줄 = 평면 노선(측점 글자) 밖 — 노선 끝 방향으로 늘린 자리</small>
    </div>
  )
}

/* ── 📏 측점 성과 맞대기 ── */
function 대조칸({ 대조 }) {
  return (
    <div className="tmk-card tmk-cmp">
      <b>📏 측점 성과 ↔ 도면 종단</b>
      {대조.map((g, i) => (
        <details key={i} className={'tmk-cmpg' + (g.요약.맞음 < g.요약.맞댐 ? ' bad' : '')}>
          <summary>{g.노선글} → {g.노선 || '짝 노선 없음'} · 같음 {g.요약.맞음}/{g.요약.맞댐}{g.요약.부호만 ? ` · ⚠ 부호만 다름 ${g.요약.부호만}` : ''}{Number.isFinite(g.요약.시공최대) ? ` · 시공−설계 최대 ${g.요약.시공최대.toFixed(2)} m` : ''}</summary>
          <table className="tmk-table"><thead><tr><th>위치</th><th>도면</th><th>파일 설계</th><th>차</th><th>시공</th></tr></thead>
            <tbody>{g.줄.map((r, k) => <tr key={k} className={r.부호만 ? 'sign' : Number.isFinite(r.차) && Math.abs(r.차) > 0.005 ? 'diff' : ''}><td>{r.글}</td><td>{높글(r.도면)}</td><td>{높글(r.설계)}</td><td>{r.부호만 ? '부호' : Number.isFinite(r.차) ? r.차.toFixed(2) : '—'}</td><td>{높글(r.시공)}</td></tr>)}</tbody>
          </table>
        </details>
      ))}
      <small className="muted">파일의 설계지반고와 도면 종단 표 지반고를 같은 측점끼리 맞댐 — «부호만 다름» 은 값은 같은데 +/− 가 반대인 줄</small>
    </div>
  )
}

/* ── 📐 토공 · 구조물 합 ── */
function 토공칸({ 토 }) {
  const h = 토.합 || {}
  return (
    <div className="tmk-card tmk-sum">
      <b>📐 토공 · 구조물(평균단면 · 개략)</b>
      <table className="tmk-kv"><tbody>
        <tr><th>터파기</th><td>{쉼(h.터파기, 1)} ㎥</td></tr>
        <tr><th>되메우기</th><td>{쉼(h.되메우기, 1)} ㎥</td></tr>
        <tr><th>성토</th><td>{쉼(h.성토, 1)} ㎥</td></tr>
        <tr><th>콘크리트</th><td>{쉼(h.콘크리트, 2)} ㎥</td></tr>
        <tr><th>거푸집</th><td>{쉼(h.거푸집, 1)} ㎡</td></tr>
      </tbody></table>
      {(토.노선들 || []).length > 0 && <ul className="tmk-perline">{토.노선들.map((n, i) => <li key={i}><b>{n.이름}</b> <small>터파기 {쉼(n.합.터파기, 1)} · 되메우기 {쉼(n.합.되메우기, 1)} · 콘크리트 {쉼(n.합.콘크리트, 2)}</small></li>)}</ul>}
      {(토.경고 || []).slice(0, 3).map((w, i) => <small key={i} className="gmd-warn">⚠ {w}</small>)}
    </div>
  )
}

/* ── 📐 평면(캔버스) — 노선 · 측점 눈금 · 측량점 · 구조물 · 도면 선 · 누르면 자리 ── */
function 평면칸({ T, 보는 = null, 땅보임 = true, 고른노선, 자리, 누름, 노선누름, 골조 = null, 골조원점 = null }) {
  const 판 = useRef(null), 틀Ref = useRef(null)
  const 활 = T.활용
  /* 📚 G440 «그 도면만 보기» — 선마다 도면 번호(T.바탕파일) · 옛 저장(번호 없음)은 모두 그림 */
  const 줄기들 = useMemo(() => (T.파일 || []).map(도면줄기), [T])
  const 선보임 = useMemo(() => {
    const F = T.바탕파일
    if (!보는 || !F || !T.바탕 || F.length * 4 !== T.바탕.length) return null
    const 번 = new Set(); 줄기들.forEach((z, i) => { if (보는.has(z)) 번.add(i) })
    const u = new Uint8Array(F.length); for (let i = 0; i < F.length; i++) u[i] = 번.has(F[i]) ? 1 : 0
    return u
  }, [T, 보는, 줄기들])
  const 구조보임 = (q) => !보는 || 보는.has(도면줄기(Array.isArray(q.파일) ? q.파일[0] : q.파일))
  /* 노선 ↔ 도면 — 그 노선의 횡단 · 종단이 든 도면(고른 도면과 닿은 노선은 진하게 · 나머지는 흐리게) */
  const 노선파일 = useMemo(() => { const m = new Map(); for (const t of [...(활.횡단 || []), ...(활.종단 || [])]) { if (!t.노선) continue; if (!m.has(t.노선)) m.set(t.노선, new Set()); for (const f of [].concat(t.원파일 || t.파일 || [])) m.get(t.노선).add(도면줄기(f)) } return m }, [활])
  const 노선닿음 = (L) => !보는 || [...(노선파일.get(L.이름) || [])].some((z) => 보는.has(z))
  const 보는틀값 = useMemo(() => 보는틀(), [T, 보는, 선보임])  // eslint-disable-line react-hooks/exhaustive-deps
  function 보는틀() {
    if (!보는) return null
    let b = [Infinity, Infinity, -Infinity, -Infinity], n = 0
    const 넣 = (x, y) => { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; n++ }
    const B = T.바탕, ox = T.원점[0], oy = T.원점[1]
    if (선보임) for (let i = 0; i < 선보임.length; i++) if (선보임[i]) { 넣(B[i * 4] + ox, B[i * 4 + 1] + oy); 넣(B[i * 4 + 2] + ox, B[i * 4 + 3] + oy) }
    for (const q of T.활용.구조 || []) if (q.자리 !== '옆' && 구조보임(q)) for (const r of q.바닥판 || []) for (const [x, y] of r) 넣(x, y)
    for (const L of 활.노선 || []) if (노선닿음(L)) for (let i = 0; i < L.줄.length; i += 5) 넣(L.줄[i + 1], L.줄[i + 2])
    return n ? b : null
  }
  const 뷰 = useRef(null)                      // { cx, cy (mm 일꾼 좌표), k (px/mm) }
  const 그림 = useRef(0)
  const 전체틀 = () => {
    if (!골조 || !골조.length || !골조원점) return T.틀
    const b = [...T.틀]
    for (const o of 골조) for (const [x, y] of o.판) { const X = x + 골조원점[0], Y = y + 골조원점[1]; if (X < b[0]) b[0] = X; if (Y < b[1]) b[1] = Y; if (X > b[2]) b[2] = X; if (Y > b[3]) b[3] = Y }
    return b
  }
  const 맞추기 = (b) => {
    const cv = 판.current; if (!cv || !b) return
    const w = cv.clientWidth || 600, h = cv.clientHeight || 400
    const bw = Math.max(1000, b[2] - b[0]), bh = Math.max(1000, b[3] - b[1])
    뷰.current = { cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2, k: Math.min(w / bw, h / bh) * 0.9 }
  }
  const 노선틀 = (이름) => {
    const L = 활.노선.find((x) => x.이름 === 이름); if (!L) return null
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (let i = 0; i < L.줄.length; i += 5) { const x = L.줄[i + 1], y = L.줄[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    const m = Math.max(x1 - x0, y1 - y0) * 0.15 + 5000
    return [x0 - m, y0 - m, x1 + m, y1 + m]
  }
  const 다시 = () => { cancelAnimationFrame(그림.current); 그림.current = requestAnimationFrame(그리기) }
  const 그리기 = () => {
    const cv = 판.current; if (!cv) return
    const dpr = window.devicePixelRatio || 1
    const w = cv.clientWidth, h = cv.clientHeight
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    if (!뷰.current) 맞추기((보는 && 보는틀값) || 전체틀())      // 📚 G440 «그 도면만» 으로 열면 그 도면 자리로
    const v = 뷰.current
    const c = cv.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    const 어 = 어두움()
    c.fillStyle = 어 ? '#151a21' : '#f7f8fa'; c.fillRect(0, 0, w, h)
    const sx = (x) => w / 2 + (x - v.cx) * v.k, sy = (y) => h / 2 - (y - v.cy) * v.k
    /* 도면 선(바탕) — 원점 기준 Float32 */
    const B = T.바탕, ox = T.원점[0], oy = T.원점[1]
    if (B && B.length) {
      c.strokeStyle = 선보임 ? (어 ? 'rgba(200,210,225,.75)' : 'rgba(30,41,59,.62)') : (어 ? 'rgba(160,170,185,.28)' : 'rgba(80,90,105,.22)'); c.lineWidth = 1
      c.beginPath()
      for (let i = 0; i + 3 < B.length; i += 4) { if (선보임 && !선보임[i >> 2]) continue; const a = sx(B[i] + ox), b = sy(B[i + 1] + oy), d = sx(B[i + 2] + ox), e = sy(B[i + 3] + oy); if ((a < 0 && d < 0) || (a > w && d > w) || (b < 0 && e < 0) || (b > h && e > h)) continue; c.moveTo(a, b); c.lineTo(d, e) }
      c.stroke()
    }
    /* 측량점 */
    if (활.땅 && 땅보임) {
      const P = 활.땅.점; c.fillStyle = 어 ? 'rgba(140,200,120,.55)' : 'rgba(70,140,60,.55)'
      const r = v.k * 1000 > 2 ? 1.6 : 1
      for (let i = 0; i + 2 < P.length; i += 3) { const a = sx(P[i]), b = sy(P[i + 1]); if (a < -2 || a > w + 2 || b < -2 || b > h + 2) continue; c.fillRect(a - r / 2, b - r / 2, r, r) }
    }
    /* 구조물 바닥 */
    c.strokeStyle = 어 ? '#5fd3c8' : '#0d9488'; c.lineWidth = 1.5
    for (const q of 활.구조 || []) {
      if (q.자리 === '옆' || !구조보임(q)) continue
      for (const r of q.바닥판 || []) { c.beginPath(); r.forEach(([x, y], i) => (i ? c.lineTo(sx(x), sy(y)) : c.moveTo(sx(x), sy(y)))); c.closePath(); c.stroke() }
    }
    /* 🏢 G397 골조(같이 볼 때) — 부재 바닥 모양(토목 3D 자리 = 원점 기준 → 일꾼 좌표) */
    if (골조 && 골조.length && 골조원점) {
      const gx = 골조원점[0], gy = 골조원점[1]
      c.strokeStyle = 어 ? 'rgba(196,148,255,.75)' : 'rgba(109,40,217,.65)'; c.lineWidth = 1
      c.beginPath()
      for (const o of 골조.length > 8000 ? 골조.filter((u) => u.종류 !== '슬라브') : 골조) { const P = o.판; P.forEach(([x, y], i) => (i ? c.lineTo(sx(x + gx), sy(y + gy)) : c.moveTo(sx(x + gx), sy(y + gy)))); c.closePath() }
      c.stroke()
    }
    /* 노선 · 측점 눈금 */
    c.font = '11px system-ui, sans-serif'
    for (const L of 활.노선) {
      c.globalAlpha = 노선닿음(L) ? 1 : 0.22
      const on = L.이름 === 고른노선
      c.strokeStyle = on ? '#f97316' : (어 ? '#60a5fa' : '#2563eb'); c.lineWidth = on ? 3 : 2
      c.beginPath()
      for (let i = 0; i < L.줄.length; i += 5) { const a = sx(L.줄[i + 1]), b = sy(L.줄[i + 2]); i ? c.lineTo(a, b) : c.moveTo(a, b) }
      c.stroke()
      const G = L.간격 || 20, 픽 = G * 1000 * v.k
      const 글간 = Math.max(1, Math.ceil(46 / Math.max(픽, 1e-6)))
      const [s0, s1] = L.범위
      let n = 0
      for (let s = Math.ceil((s0 - 1e-6) / G) * G; s <= s1 + 1e-6; s += G, n++) {
        const k = Math.round(s / G)
        const a = L.줄, m = Math.min(a.length / 5 - 1, Math.max(0, Math.round((s - a[0]) / Math.max(1e-9, (a[a.length - 5] - a[0])) * (a.length / 5 - 1))))
        const x = a[m * 5 + 1], y = a[m * 5 + 2], tx = a[m * 5 + 3], ty = a[m * 5 + 4]
        const X = sx(x), Y = sy(y)
        if (X < -20 || X > w + 20 || Y < -20 || Y > h + 20) continue
        const 길 = on ? 7 : 5
        c.beginPath(); c.moveTo(X + ty * 길, Y + tx * 길); c.lineTo(X - ty * 길, Y - tx * 길); c.stroke()
        if (픽 >= 3 && (k % 글간 === 0)) { c.fillStyle = on ? '#c2410c' : (어 ? '#cbd5e1' : '#334155'); c.fillText('NO.' + k, X + ty * 9 + 2, Y + tx * 9 + 4) }
      }
      const a = L.줄
      c.fillStyle = on ? '#c2410c' : (어 ? '#93c5fd' : '#1d4ed8')
      c.font = 'bold 12px system-ui, sans-serif'
      c.fillText(L.이름, sx(a[1]) + 6, sy(a[2]) - 8)
      c.font = '11px system-ui, sans-serif'
    }
    c.globalAlpha = 1
    /* 좌표 성과점 */
    for (const p of 활.성과점 || []) {
      const x = 활.바꿈 ? p.N * 1000 : p.E * 1000, y = 활.바꿈 ? p.E * 1000 : p.N * 1000
      const X = sx(x), Y = sy(y)
      c.fillStyle = '#eab308'; c.beginPath(); c.moveTo(X, Y - 7); c.lineTo(X - 6, Y + 5); c.lineTo(X + 6, Y + 5); c.closePath(); c.fill()
      c.fillStyle = 어 ? '#fde68a' : '#854d0e'; c.fillText(p.이름, X + 8, Y + 4)
    }
    /* 고른 자리 */
    if (자리) {
      const X = sx(자리.x), Y = sy(자리.y)
      c.strokeStyle = '#ef4444'; c.lineWidth = 2
      c.beginPath(); c.moveTo(X - 10, Y); c.lineTo(X + 10, Y); c.moveTo(X, Y - 10); c.lineTo(X, Y + 10); c.stroke()
      c.beginPath(); c.arc(X, Y, 5, 0, Math.PI * 2); c.stroke()
    }
    /* 북 · 축척 */
    c.fillStyle = 어 ? '#e2e8f0' : '#0f172a'; c.font = 'bold 12px system-ui, sans-serif'; c.fillText('N ↑', w - 34, 18)
    const 자 = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000].find((m) => m * 1000 * v.k >= 60) || 5000
    c.fillRect(12, h - 14, 자 * 1000 * v.k, 3); c.font = '11px system-ui, sans-serif'; c.fillText(자 + ' m', 12, h - 20)
  }
  useEffect(() => { 뷰.current = null; 다시() }, [T])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!고른노선) 뷰.current = null; 다시() }, [골조, 골조원점])  // eslint-disable-line react-hooks/exhaustive-deps
  const 막연 = useRef(true)      // 📚 G440 처음 그릴 때 «그 도면만» 이면 고른 노선보다 그 도면 자리로
  useEffect(() => { const 첫 = 막연.current; 막연.current = false; if (첫 && 보는 && 보는틀값) 맞추기(보는틀값); else if (고른노선) { const b = 노선틀(고른노선); if (b) 맞추기(b) } 다시() }, [고른노선])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { 다시() }, [자리])  // eslint-disable-line react-hooks/exhaustive-deps
  const 보는첫 = useRef(true)
  useEffect(() => { if (보는첫.current) { 보는첫.current = false; return } const b = 보는틀값; if (b) 맞추기(b); else if (!보는) 맞추기(전체틀()); 다시() }, [보는, 선보임, 땅보임])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const cv = 판.current; if (!cv) return undefined
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => 다시()) : null
    if (ro) ro.observe(cv)
    const 손 = new Map()
    let 시작 = null, 움직 = 0, 핀 = null
    const 자리mm = (e) => { const r = cv.getBoundingClientRect(), v = 뷰.current; return { x: v.cx + (e.clientX - r.left - r.width / 2) / v.k, y: v.cy - (e.clientY - r.top - r.height / 2) / v.k } }
    const 아래 = (e) => { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); 손.set(e.pointerId, { x: e.clientX, y: e.clientY }); 시작 = { x: e.clientX, y: e.clientY }; 움직 = 0; if (손.size === 2) { const [a, b] = [...손.values()]; 핀 = { d: Math.hypot(a.x - b.x, a.y - b.y), k: 뷰.current.k } } }
    const 이동 = (e) => {
      if (!손.has(e.pointerId) || !뷰.current) return
      const 앞 = 손.get(e.pointerId); 손.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (손.size === 2 && 핀) { const [a, b] = [...손.values()]; 뷰.current.k = 핀.k * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, 핀.d); 움직 = 99; 다시(); return }
      const dx = e.clientX - 앞.x, dy = e.clientY - 앞.y
      움직 += Math.abs(dx) + Math.abs(dy)
      뷰.current.cx -= dx / 뷰.current.k; 뷰.current.cy += dy / 뷰.current.k
      다시()
    }
    const 위 = (e) => {
      const 하나 = 손.size === 1
      손.delete(e.pointerId); if (손.size < 2) 핀 = null
      if (하나 && 시작 && 움직 < 6 && 뷰.current) {
        const p = 자리mm(e)
        /* 노선 가까이(12 px)면 그 노선도 고름 */
        let 가 = null, 가d = 12 / 뷰.current.k
        for (const L of 활.노선) for (let i = 0; i < L.줄.length; i += 25) { const d = Math.hypot(L.줄[i + 1] - p.x, L.줄[i + 2] - p.y); if (d < 가d) { 가d = d; 가 = L.이름 } }
        누름(p.x, p.y)
        if (가) 노선누름(가)
      }
      시작 = null
    }
    const 바퀴 = (e) => {
      if (!뷰.current) return
      e.preventDefault()
      const r = cv.getBoundingClientRect(), v = 뷰.current
      const mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2
      const 전x = v.cx + mx / v.k, 전y = v.cy - my / v.k
      v.k *= Math.exp(-e.deltaY * 0.0015)
      v.cx = 전x - mx / v.k; v.cy = 전y + my / v.k
      다시()
    }
    cv.addEventListener('pointerdown', 아래); cv.addEventListener('pointermove', 이동); cv.addEventListener('pointerup', 위); cv.addEventListener('pointercancel', 위)
    cv.addEventListener('wheel', 바퀴, { passive: false })
    return () => { if (ro) ro.disconnect(); cv.removeEventListener('pointerdown', 아래); cv.removeEventListener('pointermove', 이동); cv.removeEventListener('pointerup', 위); cv.removeEventListener('pointercancel', 위); cv.removeEventListener('wheel', 바퀴); cancelAnimationFrame(그림.current) }
  }, [T, 고른노선, 자리, 선보임, 땅보임])  // eslint-disable-line react-hooks/exhaustive-deps
  const 빈 = !!(보는 && !보는틀값)
  return (
    <div className="tmk-plan" ref={틀Ref}>
      <canvas ref={판} className="tmk-canvas" aria-label="토목 평면 — 누르면 그 자리 좌표 · 끌면 옮김 · 바퀴 · 두 손가락으로 크게" />
      {빈 && <div className="tmk-planempty">고른 도면은 평면 자리에 그릴 것이 없습니다(단면 · 상세 · 표 · 자리를 못 찾은 구조물) — 🧊 3D 를 보십시오.</div>}
      <div className="tmk-planbar">
        <button type="button" className="btn line sm" onClick={() => { 맞추기(전체틀()); 다시() }}>⤢ 현장 전체</button>
        {고른노선 && <button type="button" className="btn line sm" onClick={() => { const b = 노선틀(고른노선); if (b) { 맞추기(b); 다시() } }}>🛣 고른 노선</button>}
      </div>
    </div>
  )
}

/* ── 🧊 3D — 토목(배수로 · 구조물 · 땅) + 🏢 G397 골조(같은 좌표) ── */
function 삼디칸({ T, 토, 보는 = null, 땅보임 = true, 뺄ids = null, 골조부재 = [], set고른부재 }) {
  const 판 = useRef(null), 보기 = useRef(null), 맞춤 = useRef('')
  const [glErr, setGlErr] = useState('')
  /* 📚 G440 «그 도면만 보기» — 바탕 선 · 토목 부재를 고른 도면 것만(땅 면은 늘 깖) */
  const 번들 = useMemo(() => { if (!보는 || !T) return null; const n = new Set(); (T.파일 || []).forEach((f, i) => { if (보는.has(도면줄기(f))) n.add(i) }); return n }, [T, 보는])
  const 바탕 = useMemo(() => {
    if (!T || !T.바탕 || !T.바탕.length || !토) return null
    const a = T.바탕, o = 토.원점 || [0, 0], dx = T.원점[0] - o[0], dy = T.원점[1] - o[1]
    const 깔 = Number.isFinite(토.땅높이) ? 토.땅높이 : 0
    const F = 번들 && T.바탕파일 && T.바탕파일.length * 4 === a.length ? T.바탕파일 : null
    const f = new Float32Array(a.length / 4 * 6)
    let j = 0
    for (let i = 0; i + 3 < a.length; i += 4) { if (F && !번들.has(F[i >> 2])) continue; f[j] = a[i] + dx; f[j + 1] = a[i + 1] + dy; f[j + 2] = 깔; f[j + 3] = a[i + 2] + dx; f[j + 4] = a[i + 3] + dy; f[j + 5] = 깔; j += 6 }
    return j === f.length ? f : f.slice(0, j)
  }, [T, 토, 번들])
  const 있음 = !!((토 && 토.부재.length) || 골조부재.length)
  useEffect(() => {
    if (!판.current || !있음) return
    if (!보기.current) {
      try { 보기.current = new 부재보기(판.current) } catch (e) { setGlErr('이 브라우저는 3D(WebGL)를 그리지 못합니다 — 평면 · 측점표 · 엑셀은 그대로 쓸 수 있습니다.'); return }
      if (어두움()) { const v0 = 보기.current; v0.bg = [0.086, 0.102, 0.129]; v0.bgT = [0.15, 0.17, 0.21]; v0.bgB = [0.06, 0.07, 0.09]; v0.선색 = [0.03, 0.04, 0.05]; v0.선알 = 0.6 }
    }
    const v = 보기.current
    const 토부 = 토 ? 토.부재.filter((o) => o.종류 !== '터파기' && o.종류 !== '성토' && !(뺄ids && 뺄ids.has(o.id)) && (o.종류 === '지형' ? 땅보임 : !보는 || 보는.has(부재도면(o)))) : []
    v.set부재([
      ...토부.map((o) => ({ id: o.id, 면: o.면, 선: o.선, 색: o.색 || 토목색[o.종류], 비침: 토목비침[o.종류] || 0 })),
      ...골조부재.map((d) => (d.면 ? { id: d.id, 면: d.면, 선: d.선, 색: d.색 } : { id: d.id, 판: d.판, z0: d.z0, z1: d.z1, 색: d.색 })),
    ], { 바닥: !토부.length, 바닥색: 어두움() ? [0.16, 0.18, 0.22] : [0.86, 0.88, 0.90] })
    v.set배경(바탕, 어두움() ? [0.62, 0.66, 0.72] : [0.36, 0.40, 0.46], 어두움() ? 0.18 : 0.16)
    /* 처음 · 넣은 것이 바뀔 때만 전체 맞춤(고르기 · 같이 보기를 켜고 끌 때 시점은 그대로 두지 않음 — 덩어리가 늘면 다시 맞춤) */
    const 열쇠 = (토 ? 토.부재.length : 0) + '|' + 골조부재.length + '|' + (보는 ? [...보는].join(',') : '')
    if (맞춤.current !== 열쇠) { v.fit('tilt'); 맞춤.current = 열쇠 }
    v.onPick = (id) => {
      if (id >= 골조ID) { const d = 골조부재.find((u) => u.id === id); set고른부재(d ? { 이름: '🏢 ' + d.이름, 크기: Number.isFinite(d.부피) ? '콘크리트 ' + 쉼(d.부피, 3) + ' ㎥' : '' } : null); v.set고름(d ? [id] : []); return }
      const o = id >= 0 ? 토부.find((u) => u.id === id) : null; set고른부재(o ? { 이름: o.이름, 크기: o.크기, 몫: o.몫 } : null); v.set고름(o ? [o.id] : [])
    }
  }, [토, 바탕, 골조부재, 뺄ids, 있음, 보는, 땅보임])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (보기.current) { 보기.current.dispose(); 보기.current = null } }, [])
  return (
    <div className="tmk-3d">
      {glErr ? <div className="gmd-note gmd-warnbox">{glErr}</div> : <canvas ref={판} className="tmk-canvas3d" aria-label={'3D — ' + (토 ? '배수로 · 구조물 · 땅' : '') + (골조부재.length ? (토 ? ' · ' : '') + '골조 ' + 골조부재.length : '')} />}
      <div className="tmk-planbar"><button type="button" className="btn line sm" onClick={() => 보기.current && 보기.current.fit('tilt')}>⤢ 전체</button><button type="button" className="btn line sm" onClick={() => 보기.current && 보기.current.fit('top')}>⬒ 위에서</button>{골조부재.length > 0 && <small className="tmk-3dn">🏢 골조 {골조부재.length.toLocaleString('ko-KR')}{토 ? ' · 🛣 토목 ' + 토.부재.filter((o) => o.종류 !== '터파기' && o.종류 !== '성토').length.toLocaleString('ko-KR') : ''}</small>}</div>
    </div>
  )
}
