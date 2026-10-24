/**
 * 🚶 한 층씩 둘러보기 — 골조 모델 작업 화면 3D 안을 사람이 걸어다님 (G390 · 2026-10-23 · 🔒 작업 화면 = 운영자만)
 *
 * 소장님: 「3D 화면에서 사람이 걸어다니게 해줘」 · 「캐릭터 3개 만들어 줘...선택할 수 있게」(하나 · 수아 · 소장) · 「게임하듯이 작업할 수 있게」 ·
 *         「사람이 걸어 다니면서, 점을 찍으면 그 부분이 분리되게」 · 「최대한 편하게 … 근데, 정확해야 해」
 * ■ 걷기: PC = 방향키 · WASD(Q · E 옆걸음) · 폰 = 왼쪽 아래 둥근 손잡이 · ▶ 자동 = 그 층 부재를 가까운 차례로 다 돌아봄
 * ■ 보기: 🎥 뒤에서(끌기 = 둘레 돌기 · 휠 = 멀리 · 가까이) / 👁 눈으로(끌기 = 고개 돌리기)
 * ■ 지나가면 부재에 불(고름 · 오른쪽에 크기 · 물량 · 산출 줄) · 1.8 m 안에 든 부재는 «확인» → 층마다 «확인 n / N» · 빨간 곳 = 도면에서 못 옮긴 것(3D 빨강) · 겹친 곳
 * ■ ✂ 여기서 나누기(가까운 보 · 벽을 사람이 선 자리에서 둘로 — 합은 그대로) · 📝 점검사항에 넣기(모델에 남음 · 엑셀 «점검사항» 시트)
 * ■ 셈은 lib/둘러보기.js(시험 tools/시험_둘러보기.mjs) · 사람 꼴은 lib/사람3d.js · 그림은 bim3d set사람 · set눈.
 * ■ 🎮 캐릭터 = 게임 캐릭터 모델(VRM) 넷 — 소장님 「여자만 하자. 남자는 빼고」 · 「네개 다」: 수아(F) · 리나(G) · 하나(E) · 유나(D)
 *   VRoid 샘플 AvatarSample_D · E · F · G(CC0 · 파일 안 조건도 누구나 · 상업 · 고침 · 재배포 됨) · public/jeoksan/char/{d,e,f,g}.vrm(tools/vrm_싣기.py 로 줄임 · 한 명 3 MB 안팎)
 *   고를 때 받음(lib/사람vrm.js 캐릭터받기) · 받는 동안은 사람 안 그림 · 못 받으면 코드로 짠 사람(lib/사람3d.js) · «🎮 다른 캐릭터 파일 넣기» = 이 PC 의 VRM(이 화면을 여는 동안만)
 *   👁 눈 깜빡임(2 ~ 5 초마다) · 🖱 3D 를 누르면 그리로 걸어감(부재 = 그 앞 · 바닥 = 그 자리 — lib/둘러보기.js 누른곳길 · bim3d 바닥점)
 * ■ 🎮 G392 퀘스트 카드 — 가까운 🟨 제안(건설맵이 도면대로 먼저 세운 것)은 «✓ 맞음 · ✏ 고치기 · ✕ 빼기» · 가까운 🟥 빨간 곳은 «📝 점검사항 · 넘어가기» · 빨간 곳 수 = 손으로 할 곳 + 확인 전 제안
 * ■ 📊 숨은 누적 |골조모델|둘러보기 · |골조모델|점검사항 · |골조모델|나누기 · |골조모델|캐릭터파일 · |골조모델|누른곳걷기 · |골조모델|퀘스트확인
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { 세기 } from './lib/받은수.jsx'
import { 사람몸, 놓기 } from './lib/사람3d.js'
import { 사람모델읽기, 사람자세, 사람놓기, 캐릭터들, 캐릭터받기 } from './lib/사람vrm.js'
import { 층판, 첫자리, 걷기, 가까운것, 확인들, 자동길, 자동입력, 자동막힘, 밀어내기, 누른곳길, 가까운빠짐 } from './lib/둘러보기.js'
import { 층높이, 부재나누기, 부재글, FT층, 제안확인, 제안빼기, 판넓이, 구간물량, 겹침남기기, 겹침둠 } from './lib/골조모델.js'

const 기억열쇠 = 'kcm.walker'
const 각차 = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d }
const 층글 = (f) => (f === 'FT' ? 'FT(기초)' : f + '층')
const 지금때 = () => { try { return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) } catch (e) { return '' } }

function 읽은사람() {
  try { const j = JSON.parse(localStorage.getItem(기억열쇠) || 'null'); if (j && 캐릭터들.some((p) => p.키 === j.키)) return { 키: j.키, 고름: false } } catch (e) { /* 없음 */ }
  return { 키: 캐릭터들[0].키, 고름: true }
}
const 그림읽기 = typeof createImageBitmap === 'function' ? (b) => createImageBitmap(b) : async (b) => { const im = new Image(); im.src = URL.createObjectURL(b); await im.decode(); return im }

export default function 둘러보기판({ 보기Ref, 누름Ref = null, M, S, 층, set층, 고른, set고른, setM, 끝내기, on눈 = () => {}, on확인 = () => {}, on확인들 = () => {} }) {
  const [사람, set사람0] = useState(읽은사람)
  const set사람 = (v) => { set사람0(v); try { localStorage.setItem(기억열쇠, JSON.stringify({ 키: v.키 })) } catch (e) { /* 저장 못 함 */ } }
  const [눈, set눈] = useState(false)
  const [자동, set자동] = useState(false)
  const [확인, set확인] = useState(() => new Map())   // 층 → Set(id)
  const [가까이, set가까이] = useState(null)          // {id, 종류, 부호, d}
  const 가까이Ref = useRef(null); 가까이Ref.current = 가까이
  const 말풍선Ref = useRef(null)                       // 💬 G393 가까운 부재 위에 떠서 따라오는 물량
  const 구간Ref = useRef(-2)                           // ▭ G393 지금 서 있는 구간(바뀌면 알림)
  const [알림, set알림] = useState('')
  const [메모, set메모] = useState(null)               // null | 글
  const [퀘, set퀘] = useState(null)                   // 🎮 G392 퀘스트 — {종: '제안', id} 건설맵이 세운 것 확인 · {종: '빨강', k} 손으로 할 곳
  const 넘김Ref = useRef(new Set())
  const [모델, set모델] = useState(null)               // 🎮 VRM {모, 이름, 키 | 내파일} — 있으면 그 사람이 걸음
  const [모델상태, set모델상태] = useState('')
  const [못받음, set못받음] = useState(false)          // 캐릭터 파일을 못 받으면 코드로 짠 사람(lib/사람3d.js)으로
  const 모델Ref = useRef(null); 모델Ref.current = 모델
  const 파일Ref = useRef(null)
  const 모델넣기 = async (f) => {
    if (!f) return
    set모델상태('⏳ 캐릭터 읽는 중 — ' + f.name)
    try {
      const 모 = await 사람모델읽기(await f.arrayBuffer(), 그림읽기)
      set모델({ 모, 이름: 모.이름 || f.name.replace(/\.(vrm|glb)$/i, ''), 내파일: true })
      set모델상태('')
      set사람({ ...사람Ref.current, 고름: false })
      세기('|골조모델|캐릭터파일')
      다시.current = true
    } catch (e) { set모델상태('⚠ 캐릭터를 읽지 못했습니다 — ' + ((e && e.message) || e)) }
  }
  /* 🎮 고른 캐릭터 받기(처음 한 번 · 이 화면을 여는 동안 기억) — 내 파일을 넣었으면 그것 */
  useEffect(() => {
    if (모델Ref.current && 모델Ref.current.내파일) return undefined
    if (모델Ref.current && 모델Ref.current.키 === 사람.키) return undefined
    let 끝 = false
    set모델상태('⏳ ' + 사람.키 + ' 불러오는 중')
    캐릭터받기(사람.키, 그림읽기).then((모) => { if (끝) return; set모델({ 모, 이름: 사람.키, 키: 사람.키 }); set모델상태(''); set못받음(false); 다시.current = true })
      .catch((e) => { if (끝) return; set모델(null); set못받음(true); set모델상태('⚠ 캐릭터를 받지 못했습니다 — ' + ((e && e.message) || e)); 다시.current = true })
    return () => { 끝 = true }
  }, [사람.키, 모델])  // eslint-disable-line react-hooks/exhaustive-deps
  const 못받음Ref = useRef(false); 못받음Ref.current = 못받음
  const H = useMemo(() => 층높이(M), [M])
  const 덩 = (S && S.덩어리) || []
  const 판 = useMemo(() => 층판(덩, H, 층), [덩, H, 층])  // eslint-disable-line react-hooks/exhaustive-deps
  const 판Ref = useRef(판); 판Ref.current = 판
  const 사Ref = useRef(null)
  const 키Ref = useRef(new Set())
  const 조이Ref = useRef({ 앞: 0, 돌: 0 })
  const 자동Ref = useRef(null)
  const 눈Ref = useRef(false); 눈Ref.current = 눈
  const 사람Ref = useRef(사람); 사람Ref.current = 사람
  const 고른Ref = useRef(고른); 고른Ref.current = 고른
  const 확인Ref = useRef(확인); 확인Ref.current = 확인
  const MRef = useRef(M); MRef.current = M
  const SRef = useRef(S); SRef.current = S
  const 덩Ref = useRef(덩); 덩Ref.current = 덩
  const 구간Q = useMemo(() => (M.구간 && M.구간.length && S && !S.오류 ? 구간물량(M, S) : null), [M, S])
  const 구간QRef = useRef(구간Q); 구간QRef.current = 구간Q
  const 다시 = useRef(true)

  /* 처음 · 층이 바뀌면 — 자리(처음엔 건물 앞) · 막힌 곳에서 밀어냄 */
  useEffect(() => {
    if (!사Ref.current) { const s0 = 첫자리(판); 사Ref.current = { ...s0, φ: 0 } }
    const s = 사Ref.current
    ;[s.x, s.y] = 밀어내기(s.x, s.y, 판.막)
    자동Ref.current = null; set자동(false)
    다시.current = true
  }, [판])
  /* 켤 때 · 끌 때 — 3D 를 걷기 꼴로 */
  useEffect(() => {
    const v = 보기Ref.current
    if (!v) return undefined
    v.가까이 = true
    const s = 사Ref.current || { ...첫자리(판), φ: 0 }
    v.눈 = null; v.t = [s.x, s.y, 판.바닥 + 1.0]; v.d = 6.5; v.pit = 0.42; v.yaw = s.방향 + Math.PI
    v.onLook = (h) => { if (사Ref.current) { 사Ref.current.방향 = h; 다시.current = true } }
    v.dirty()
    세기('|골조모델|둘러보기')
    return () => { v.가까이 = false; v.onLook = null; v.set눈(null); v.set사람(null); try { v.fit('tilt') } catch (e) { /* 무시 */ } }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { on눈(눈) }, [눈])  // eslint-disable-line react-hooks/exhaustive-deps
  /* 🟩 G393 확인한 부재(모든 층) → 작업 화면 3D 에서 초록으로 */
  useEffect(() => { const t = new Set(); for (const ids of 확인.values()) for (const id of ids) t.add(id); on확인들(t) }, [확인])  // eslint-disable-line react-hooks/exhaustive-deps
  /* 🧭 길잡이 — 층마다 확인 비율을 위로 */
  useEffect(() => {
    const 덩 = (S && S.덩어리) || []
    const 수 = new Map(); for (const d of 덩) 수.set(d.층, (수.get(d.층) || 0) + 1)
    on확인((옛) => { const n = new Map(옛); for (const [f, ids] of 확인) n.set(f, Math.max(n.get(f) || 0, 수.get(f) ? ids.size / 수.get(f) : 0)); return n })
  }, [확인])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const v = 보기Ref.current; if (!v) return; if (!눈) { v.set눈(null); const s = 사Ref.current; if (s) { v.t = [s.x, s.y, 판Ref.current.바닥 + 1.0]; v.yaw = s.방향 + Math.PI; v.d = Math.max(v.d, 4) } } 다시.current = true }, [눈])  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { 다시.current = true }, [사람, 모델])

  /* 손 — 방향키 · WASD · QE */
  useEffect(() => {
    const 글칸 = (e) => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) }
    const 키 = (e) => ({ ArrowUp: 'f', KeyW: 'f', ArrowDown: 'b', KeyS: 'b', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', KeyQ: 'q', KeyE: 'e' })[e.code]
    const down = (e) => { if (글칸(e)) return; const k = 키(e); if (!k) return; e.preventDefault(); 키Ref.current.add(k); if (자동Ref.current) { 자동Ref.current = null; set자동(false) } }
    const up = (e) => { const k = 키(e); if (k) 키Ref.current.delete(k) }
    const blur = () => 키Ref.current.clear()
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [])

  /* 걷기 고리 */
  useEffect(() => {
    let raf = 0, 앞때 = performance.now(), 늦 = 0
    const 깜 = { 다음: performance.now() + 1800, 값: 0 }     // 👁 눈 깜빡임 — 2 ~ 5 초마다 0.16 초
    const 한 = (t) => {
      const 깜시 = t - 깜.다음
      const 깜값 = 깜시 >= 0 && 깜시 < 160 ? Math.sin((깜시 / 160) * Math.PI) : 0
      if (깜시 >= 160) 깜.다음 = t + 2000 + Math.random() * 3000
      if (Math.abs(깜값 - 깜.값) > 0.2 || (깜값 === 0 && 깜.값 !== 0)) { 깜.값 = 깜값; if (모델Ref.current) 다시.current = true }
      const dt = Math.min(0.05, Math.max(0, (t - 앞때) / 1000)); 앞때 = t
      const v = 보기Ref.current, s = 사Ref.current, 판0 = 판Ref.current
      if (v && s) {
        const k = 키Ref.current, j = 조이Ref.current
        let 입 = { 앞: (k.has('f') ? 1 : 0) - (k.has('b') ? 1 : 0) + j.앞, 돌: (k.has('l') ? 1 : 0) - (k.has('r') ? 1 : 0) + j.돌, 옆: (k.has('q') ? 1 : 0) - (k.has('e') ? 1 : 0) }
        const 손 = 입.앞 || 입.돌 || 입.옆
        const A = 자동Ref.current
        const 자동중 = !손 && A
        if (손 && A && A.누름) { 자동Ref.current = null; set자동(false) }       // 🖱 누른 곳으로 가다가 손으로 움직이면 멈춤
        if (자동중) {
          const 입2 = 자동입력(A, s, dt)
          if (!입2) { 자동Ref.current = null; set자동(false); if (!A.누름) set알림('▶ 자동 둘러보기 끝 — ' + 층글(판0.층) + ' 부재를 다 돌았습니다') }
          else 입 = 입2
        }
        const r = (입.앞 || 입.돌 || 입.옆) ? 걷기(s, 입, dt, 판0, 자동중 ? 2.6 : 1.6) : { x: s.x, y: s.y, 방향: s.방향, 감: 0 }
        if (자동중 && 자동Ref.current) 자동막힘(A, { x: r.x, y: r.y }, dt)     // 막혀서 못 가면 옆걸음 · 다음 부재로
        const 감 = r.감 > 1e-4
        s.x = r.x; s.y = r.y
        const 돌았 = Math.abs(각차(r.방향, s.방향)) > 1e-5
        s.방향 = r.방향
        if (감) s.φ += (r.감 / 0.62) * Math.PI
        else if (s.φ) { const m = s.φ % Math.PI; s.φ = m < 0.15 || m > Math.PI - 0.15 ? 0 : s.φ + dt * 6 }
        if (감 || 돌았 || 다시.current || s.φ) {
          다시.current = false
          const P = 사람Ref.current, VM = 모델Ref.current
          let 몸
          if (VM) { const 자 = 사람자세(VM.모, { 걸음: s.φ, 가는중: 감 || !!s.φ, 감음: 깜.값 }); 몸 = { 키: 자.키 }; v.set사람({ 부분: 사람놓기(자, s.x, s.y, 판0.바닥, s.방향) }) }
          else if (못받음Ref.current) { 몸 = 사람몸('하나', { 옷: 0, 걸음: s.φ, 가는중: 감 || !!s.φ }); v.set사람(놓기(몸, s.x, s.y, 판0.바닥, s.방향)) }   // 파일을 못 받으면 코드로 짠 사람
          else { 몸 = { 키: 1.6 }; v.set사람(null) }                                                                                                      // 받는 중
          /* 🔧 G393 눈으로 볼 때는 내 몸(머리카락 · 얼굴)을 그리지 않음 — 소장님 「눈으로 보기 하면, 중간에 이상한게 떠」: 눈 자리가 머리 안이라 머리카락 · 얼굴 조각이 회색 띠로 보였음 */
          if (눈Ref.current) { v.set사람(null); v.set눈({ E: [s.x + Math.cos(s.방향) * 0.12, s.y + Math.sin(s.방향) * 0.12, 판0.바닥 + 몸.키 * 0.93], h: s.방향, p: v.눈 ? v.눈.p : -0.08 }) }
          else {
            v.t = [s.x, s.y, 판0.바닥 + 1.0]
            if (감 && 입.앞 > 0) v.yaw += 각차(s.방향 + Math.PI, v.yaw) * Math.min(1, dt * 2.2)
            v.dirty()
          }
        }
        /* 💬 G393 말풍선 — 가까운 부재 위(윗면 + 20 cm)에 떠서 따라옴(카메라를 돌려도) */
        {
          const el = 말풍선Ref.current, g = 가까이Ref.current
          if (el) {
            const d = g ? 덩Ref.current.find((x) => x.id === g.id) : null
            let p = null
            if (d && d.판 && d.판.length) {
              /* 사람에게 가장 가까운 부재 자리(둘레 네모 안 가장 가까운 점) — 큰 슬라브 · 벽도 화면 안에 들게 · 그래도 밖이면 가운데 */
              const xs = d.판.map((q) => q[0]), ys = d.판.map((q) => q[1])
              const gx = Math.max(Math.min(...xs), Math.min(Math.max(...xs), s.x * 1000)), gy = Math.max(Math.min(...ys), Math.min(Math.max(...ys), s.y * 1000))
              const zt = Math.min(d.z1 / 1000, 판0.바닥 + 2.4) + 0.2
              p = v.화면점(gx / 1000, gy / 1000, zt) || v.화면점(xs.reduce((a, q) => a + q, 0) / xs.length / 1000, ys.reduce((a, q) => a + q, 0) / ys.length / 1000, zt)
            }
            if (p) { el.style.display = 'block'; el.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px) translate(-50%, -100%)' } else el.style.display = 'none'
          }
        }
        늦 += dt
        if (늦 > 0.2) {
          늦 = 0
          const 든 = 확인들(s, 판0)
          const 옛 = 확인Ref.current.get(판0.층)
          if (든.some((id) => !옛 || !옛.has(id))) {
            const n = new Map(확인Ref.current); const 새 = new Set(옛 || []); for (const id of 든) 새.add(id); n.set(판0.층, 새); set확인(n)
          }
          /* ▭ G393 구간 — 선을 넘어 들어서면 알림(이 층 · 구간 전체 콘크리트) */
          {
            const Q = 구간QRef.current
            if (Q && Q.줄.length) {
              const X = s.x * 1000, Y = s.y * 1000
              const k = Q.줄.findIndex((r) => X >= r.z.판[0] && X <= r.z.판[2] && Y >= r.z.판[1] && Y <= r.z.판[3])
              if (k !== 구간Ref.current) {
                const 처음 = 구간Ref.current === -2
                구간Ref.current = k
                if (!처음 || k >= 0) {
                  if (k >= 0) { const r = Q.줄[k], f = r.층별.get(판0.층); set알림('▭ ' + r.z.이름 + ' — ' + 층글(판0.층) + ' 콘크리트 ' + (f ? f.콘크리트 : 0).toFixed(3) + ' ㎥ · 구간 전체 ' + r.콘크리트.toFixed(3) + ' ㎥'); 세기('|골조모델|구간들어섬') }
                  else set알림('▭ 구간 밖으로 나왔습니다')
                }
              }
            }
          }
          /* 🎮 G392 퀘스트 — 가까운 🟨 제안(건설맵이 세운 것 · 확인 전) · 없으면 가까운 🟥 빨간 곳(넘긴 것은 빼고) */
          {
            const MM = MRef.current
            const 제o = 가까운것(s, 판0).map((r) => r.o).find((o) => { const m = MM.부재.find((x) => x.id === o.id); return m && m.제안 })
            /* 🧩 G394 가까운 부재가 «두 번 그린 곳(❓ 어느 것?)» 이면 그 퀘스트 — 제안 다음 · 빨간 곳 앞 */
            const 겹들 = ((SRef.current && SRef.current.검사 && SRef.current.검사.find((z) => z.겹친)) || {}).겹친 || []
            const 가ids = 제o ? [] : 가까운것(s, 판0).slice(0, 3).map((r) => r.o.id)
            const 겹e = 제o ? null : 겹들.find((x) => x.종 === '둘' && x.ids.some((id) => 가ids.includes(id)) && !넘김Ref.current.has('겹|' + x.ids.join('|')))
            const 빨 = 제o || 겹e ? null : 가까운빠짐(s, MM.빠짐, 판0.층)
            const 새 = 제o ? { 종: '제안', id: 제o.id } : 겹e ? { 종: '겹침', 키: 겹e.ids.join('|') } : 빨 && !넘김Ref.current.has(판0.층 + '|' + 빨.k) ? { 종: '빨강', k: 빨.k } : null
            set퀘((p) => (JSON.stringify(p) === JSON.stringify(새) ? p : 새))
          }
          if (감 || 돌았) {
            const g = 가까운것(s, 판0)[0]
            const 새가 = g ? { id: g.o.id, 종류: g.o.종류, 부호: g.o.부호, d: g.d } : null
            set가까이((p) => (p && 새가 && p.id === 새가.id ? p : 새가))
            if (g && 고른Ref.current !== g.o.id) set고른(g.o.id)
          }
        }
      }
      raf = requestAnimationFrame(한)
    }
    raf = requestAnimationFrame(한)
    return () => cancelAnimationFrame(raf)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  /* 층 차례(FT → 지하 → 1층 → …) */
  const 차례 = M.층.map((f) => f.이름)
  const k층 = 차례.indexOf(층)
  const 층바꿈 = (d) => { const n = 차례[k층 + d]; if (n === undefined) return; set층(n); set고른(null); set알림((d > 0 ? '⬆ ' : '⬇ ') + 층글(n) + '으로 옮겼습니다') }
  const 이층수 = 판.부재.length
  const 본수 = (확인.get(층) || new Set()).size
  /* 🔧 G393 소장님 「빨강....너무 많지 않아 … 뭘 고쳐야 하는지?」 — 겹친 곳(셈 검사)은 빼고 🟥 손으로 할 곳 · 🟨 확인할 제안만 셈(겹침은 건설맵이 먼저 정리 · 남는 것만 따로) */
  const 빨수 = (M.빠짐 || []).filter((x) => x.층 === 층).length, 제수 = M.부재.filter((o) => o.층 === 층 && o.제안).length
  const 퀘제 = 퀘 && 퀘.종 === '제안' ? M.부재.find((o) => o.id === 퀘.id && o.제안) : null
  const 퀘빨 = 퀘 && 퀘.종 === '빨강' ? (M.빠짐 || [])[퀘.k] : null
  const 퀘겹 = 퀘 && 퀘.종 === '겹침' ? (((S && S.검사 && S.검사.find((z) => z.겹친)) || {}).겹친 || []).find((x) => x.ids.join('|') === 퀘.키) || null : null
  const 겹이름 = (k) => { const o = 퀘겹 && M.부재.find((x) => x.id === 퀘겹.ids[k]); return o ? o.종류 + ' ' + (o.부호 || '') + ' · ' + ((퀘겹.부피들 || [])[k] || 0).toFixed(3) + ' ㎥' : '' }
  const 겹남김 = (k) => { if (!퀘겹) return; const 남 = 퀘겹.ids[k], 뺄 = 퀘겹.ids[1 - k]; const 글1 = 겹이름(k); setM((P) => 겹침남기기(P, 남, 뺄)); 세기('|골조모델|퀘스트겹침'); set알림('✓ ' + 글1 + ' 을(를) 남기고 다른 것을 뺐습니다(↶ 되돌리기 됨)'); set퀘(null) }
  const 퀘확인 = () => { if (!퀘제) return; setM((P) => 제안확인(P, 퀘제.id, 지금때())); 세기('|골조모델|퀘스트확인'); set알림('✓ ' + 층글(퀘제.층) + ' ' + 퀘제.종류 + ' ' + 퀘제.부호 + ' — 건설맵이 세운 대로 확인했습니다'); set퀘(null) }
  const 퀘빼기 = () => { if (!퀘제) return; setM((P) => 제안빼기(P, 퀘제.id)); set알림('✕ ' + 퀘제.종류 + ' ' + 퀘제.부호 + ' 을(를) 빼서 빨간 곳(손으로)으로 돌렸습니다'); set퀘(null) }
  const 다봄 = 이층수 > 0 && 본수 >= 이층수
  const 수1 = (v) => (Math.round(v * 10) / 10).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const 층콘 = ((S && S.층별) || []).filter((r) => r.층 === 층).reduce((a, r) => a + r.콘크리트, 0)
  const 본콘 = [...(확인.get(층) || [])].reduce((a, id) => a + ((((S && S.부재별.get(id)) || {}).콘크리트) || 0), 0)
  const 자동켜기 = () => {
    if (자동) { 자동Ref.current = null; set자동(false); return }
    const s = 사Ref.current; if (!s) return
    const 길 = 자동길(판, s)
    if (!길.length) { set알림('이 층에는 둘러볼 부재가 없습니다'); return }
    자동Ref.current = { 길, k: 0, 막: 0 }; set자동(true); set알림('▶ ' + 층글(층) + ' 부재 ' + 길.length + '곳을 가까운 차례로 돌아봅니다(방향키를 누르면 멈춤)')
  }
  /* 🖱 3D 를 누르면 — 부재면 그 앞까지 · 바닥이면 그 자리까지 걸어감(게임처럼) · 방향키 · 손잡이를 쓰면 멈춤 */
  useEffect(() => {
    if (!누름Ref) return undefined
    누름Ref.current = (id, e) => {
      const v = 보기Ref.current, s = 사Ref.current, 판0 = 판Ref.current
      if (!v || !s || !e) return
      const 점 = v.바닥점 ? v.바닥점(e.clientX, e.clientY, 판0.바닥) : null
      const 길 = 누른곳길(판0, s, 점, id >= 0 ? id : null)
      if (!길.length) return
      if (id >= 0 && 길[0].id !== undefined) set고른(id)
      자동Ref.current = { 길, k: 0, 막: 0, 누름: true }
      set자동(false)
      const o = 길[0].id !== undefined ? 판0.부재.find((x) => x.id === 길[0].id) : null
      set알림(o ? '🖱 ' + o.종류 + ' ' + (o.부호 || '') + ' 앞으로 갑니다' : '🖱 누른 곳으로 갑니다')
      세기('|골조모델|누른곳걷기')
    }
    return () => { 누름Ref.current = null }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  /* ✂ 가까운 보 · 벽을 사람이 선 자리에서 둘로 */
  const 나눌것 = 가까이 && (가까이.종류 === '보' || 가까이.종류 === '벽') && 가까이.d <= 1.6 ? 가까이 : null
  const 나누기 = () => {
    const s = 사Ref.current, g = 나눌것 && S && S.G && S.G.기.get(나눌것.id)
    if (!s || !g) return
    const 자리 = (g.축 === 'x' ? s.x : s.y) * 1000
    const N = 부재나누기(M, 나눌것.id, 자리)
    if (N === M) { set알림('✂ 끝에 너무 가까워 나누지 않았습니다(끝에서 50 mm 넘게 떨어진 자리에서)'); return }
    setM(N)
    세기('|골조모델|나누기')
    set알림('✂ ' + 층글(층) + ' ' + 나눌것.종류 + ' ' + 나눌것.부호 + ' 을(를) 선 자리(' + Math.round(자리).toLocaleString('ko-KR') + ' mm)에서 둘로 나눴습니다 — 콘크리트 · 거푸집 합은 그대로')
  }
  const 메모넣기 = () => {
    const 글0 = String(메모 || '').trim()
    if (!글0) { set메모(null); return }
    const s = 사Ref.current
    const o = 가까이 ? M.부재.find((x) => x.id === 가까이.id) : null
    setM((P) => ({ ...P, 점검: [...(P.점검 || []), { 층, 종류: o ? o.종류 : '', 부호: o ? o.부호 : '', 자리: o ? 부재글(P, o) : (s ? 'x ' + Math.round(s.x * 1000) + ' · y ' + Math.round(s.y * 1000) : ''), 글: 글0, 때: 지금때(), id: o ? o.id : null }] }))
    세기('|골조모델|점검사항')
    set메모(null); set알림('📝 점검사항에 넣었습니다 — 오른쪽 «📝 점검사항» · 엑셀 «점검사항» 시트')
  }

  /* 손잡이(폰 · 마우스) */
  const 손잡Ref = useRef(null), [손위치, set손위치] = useState(null)
  const 손 = (e) => {
    const el = 손잡Ref.current; if (!el) return
    const r = el.getBoundingClientRect(), R = r.width / 2
    const dx = Math.max(-1, Math.min(1, (e.clientX - r.left - R) / R)), dy = Math.max(-1, Math.min(1, (e.clientY - r.top - R) / R))
    조이Ref.current = { 앞: Math.abs(dy) > 0.12 ? -dy : 0, 돌: Math.abs(dx) > 0.12 ? -dx * 0.9 : 0 }
    set손위치([dx, dy])
    if (자동Ref.current) { 자동Ref.current = null; set자동(false) }
  }
  const 손놓 = () => { 조이Ref.current = { 앞: 0, 돌: 0 }; set손위치(null) }

  return (
    <div className="gwk" aria-label="둘러보기">
      <div className="gwk-hud" role="status">
        <b>🧭 {층글(층)}</b>
        <span>확인 <b>{본수}</b> / {이층수}</span>
        <span className="gwk-conc" title="지나가며 확인한 부재의 콘크리트 / 이 층 전체">🟩 <b>{수1(본콘)}</b> / {수1(층콘)} ㎥</span>
        <span className={빨수 ? 'gwk-red' : ''} title="도면에서 못 옮겨 손으로 세울 곳">🟥 손으로 <b>{빨수}</b></span>
        {제수 > 0 && <span className="gwk-prop" title="건설맵이 도면대로 먼저 세운 것 — 확인">🟨 확인 <b>{제수}</b></span>}
        <span className="gwk-bar" aria-hidden="true"><i style={{ width: (이층수 ? Math.min(100, (본수 / 이층수) * 100) : 0) + '%' }} /></span>
        {다봄 && k층 + 1 < 차례.length && <button type="button" className="gwk-next" onClick={() => 층바꿈(1)}>✓ {층글(층)} 확인 끝(콘크리트 {수1(층콘)} ㎥) — ⬆ {층글(차례[k층 + 1])}</button>}
        {다봄 && k층 + 1 >= 차례.length && <span className="gwk-done">✓ {층글(층)} 확인 끝 · 콘크리트 {수1(층콘)} ㎥</span>}
      </div>
      <div className="gwk-acts">
        <button type="button" onClick={() => 층바꿈(1)} disabled={k층 + 1 >= 차례.length} title="위층">⬆</button>
        <button type="button" onClick={() => 층바꿈(-1)} disabled={k층 <= 0} title="아래층">⬇</button>
        <button type="button" className={자동 ? 'on' : ''} onClick={자동켜기}>{자동 ? '⏸ 멈춤' : '▶ 자동'}</button>
        <button type="button" className={눈 ? 'on' : ''} onClick={() => set눈((x) => !x)}>{눈 ? '🎥 뒤에서' : '👁 눈으로'}</button>
        <button type="button" onClick={() => set사람({ ...사람, 고름: true })} title="사람 바꾸기">👤 {모델 ? 모델.이름 : 사람.키}</button>
        <button type="button" disabled={!나눌것} onClick={나누기} title="가까운 보 · 벽을 선 자리에서 둘로">✂ 여기서 나누기</button>
        <button type="button" onClick={() => set메모('')}>📝 점검사항에 넣기</button>
        <button type="button" className="gwk-x" onClick={끝내기}>✕ 그만</button>
      </div>
      {퀘제 && (
        <div className="gwk-quest" role="dialog" aria-label="퀘스트 — 건설맵이 세운 것 확인">
          <b>❓ {층글(퀘제.층)} {퀘제.종류} {퀘제.부호} — 맞나요?</b>
          <div>🟨 건설맵이 도면대로 먼저 세웠습니다{퀘제.종류 === '계단' ? <> — 판 <b>{퀘제.판수 || 2}</b> · 길이 <b>{퀘제.길이}</b> · 폭 <b>{퀘제.폭}</b> · 단수 <b>{퀘제.단수 || '자동'}</b></> : Array.isArray(퀘제.판) ? <> — 두께 <b>{퀘제.두께}</b> mm · 넓이 <b>{(판넓이(퀘제.판) / 1e6).toFixed(1)}</b> ㎡</> : null}</div>
          <div className="muted">{퀘제.제안}{퀘제.근거 && 퀘제.근거.평면 ? ' · 📄 ' + 퀘제.근거.평면 : ''}</div>
          <div className="gwk-qbtns">
            <button type="button" className="on" onClick={퀘확인}>✓ 맞음</button>
            <button type="button" onClick={() => set고른(퀘제.id)}>✏ 고치기(오른쪽)</button>
            <button type="button" onClick={퀘빼기}>✕ 빼기</button>
          </div>
        </div>
      )}
      {!퀘제 && 퀘겹 && (
        <div className="gwk-quest" role="dialog" aria-label="퀘스트 — 두 번 그린 곳">
          <b>❓ {층글(층)} 같은 자리에 두 번 그렸습니다 — 어느 것을 남길까요?</b>
          <div>{퀘겹.머리} · 겹친 몫 <b>{퀘겹.부피.toFixed(3)}</b> ㎥</div>
          <div className="gwk-qbtns">
            <button type="button" onClick={() => 겹남김(0)}>✓ {겹이름(0)}</button>
            <button type="button" onClick={() => 겹남김(1)}>✓ {겹이름(1)}</button>
            <button type="button" onClick={() => { setM((P) => 겹침둠(P, 퀘겹.ids[0], 퀘겹.ids[1])); set알림('둘 다 맞음 — 둘 다 셉니다'); set퀘(null) }}>둘 다 맞음</button>
            <button type="button" onClick={() => { 넘김Ref.current.add('겹|' + 퀘겹.ids.join('|')); set퀘(null) }}>넘어가기</button>
          </div>
        </div>
      )}
      {!퀘제 && !퀘겹 && 퀘빨 && (
        <div className="gwk-quest red" role="dialog" aria-label="퀘스트 — 빨간 곳">
          <b>🟥 {층글(퀘빨.층)} {퀘빨.종류} {퀘빨.기호}</b>
          <div>{퀘빨.까닭}</div>
          <div className="gwk-qbtns">
            <button type="button" onClick={() => set메모('손으로: ' + 퀘빨.종류 + ' ' + (퀘빨.기호 || '') + ' — ' + 퀘빨.까닭)}>📝 점검사항에 넣기</button>
            <button type="button" onClick={() => { 넘김Ref.current.add(층 + '|' + 퀘.k); set퀘(null) }}>넘어가기</button>
          </div>
        </div>
      )}
      <div ref={말풍선Ref} className="gwk-bubble" style={{ display: 'none' }} aria-hidden="true">{가까이 && S && (() => { const q = S.부재별.get(가까이.id) || {}; const o = M.부재.find((x) => x.id === 가까이.id); return <>{o && o.제안 ? '🟨 ' : ''}{가까이.종류} <b>{가까이.부호}</b><br />{(q.콘크리트 || 0).toFixed(3)} ㎥ · {(q.거푸집 || 0).toFixed(2)} ㎡ · {((q.철근 || 0) / 1000).toFixed(3)} t</> })()}</div>
      {가까이 && <div className="gwk-near">{가까이.종류} <b>{가까이.부호}</b> · {가까이.d < 0.05 ? '바로 앞' : 가까이.d.toFixed(1) + ' m'} <span className="muted">— 오른쪽에 크기 · 물량</span></div>}
      {모델상태 && !사람.고름 && <div className="gwk-msg">{모델상태}</div>}
      {알림 && <div className="gwk-msg">{알림}<button type="button" onClick={() => set알림('')} aria-label="닫기">✕</button></div>}
      {메모 !== null && (
        <div className="gwk-memo">
          <b>📝 점검사항</b> <span className="muted">{가까이 ? 층글(층) + ' ' + 가까이.종류 + ' ' + 가까이.부호 : 층글(층) + ' · 선 자리'}</span>
          <input autoFocus value={메모} placeholder="예: 보 춤 도면과 다름 · 개구부 확인" onChange={(e) => set메모(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') 메모넣기(); if (e.key === 'Escape') set메모(null) }} />
          <button type="button" onClick={메모넣기}>넣기</button><button type="button" onClick={() => set메모(null)}>취소</button>
        </div>
      )}
      <div className="gwk-joy" ref={손잡Ref} onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId) } catch (er) { /* 무시 */ } 손(e) }} onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') 손(e) }} onPointerUp={손놓} onPointerCancel={손놓} aria-label="움직이기 손잡이">
        <i style={손위치 ? { transform: `translate(${손위치[0] * 34}px, ${손위치[1] * 34}px)` } : undefined} />
      </div>
      <div className="gwk-help">🖱 누르기 = 그리로 걷기 · 방향키 · WASD = 걷기 · Q E = 옆걸음 · 끌기 = {눈 ? '고개 돌리기' : '둘레 돌기'}{눈 ? '' : ' · 휠 = 멀리 · 가까이'}</div>
      {사람.고름 && (
        <div className="gwk-pick" role="dialog" aria-label="사람 고르기">
          <b>누구와 둘러볼까요?</b>
          <div className="gwk-cards">
            {캐릭터들.map((p) => (
              <button key={p.키} type="button" className={'gwk-card' + (p.키 === 사람.키 && !(모델 && 모델.내파일) ? ' on' : '')} onClick={() => { if (모델 && 모델.내파일) set모델(null); set사람({ 키: p.키, 고름: true }) }}>
                <img className="gwk-thumb" src={'/jeoksan/char/' + p.파일 + '.jpg'} alt="" width="96" height="120" loading="lazy" />
                <b>{p.키}</b><small>{p.말}</small>
              </button>
            ))}
          </div>
          <div className="gwk-vrm">
            <button type="button" onClick={() => 파일Ref.current && 파일Ref.current.click()}>🎮 다른 캐릭터 파일(VRM) 넣기</button>
            {모델 && 모델.내파일 && <span>지금: <b>{모델.이름}</b> <button type="button" className="gmd-link" onClick={() => { set모델(null); set사람({ ...사람, 고름: true }) }}>빼기</button></span>}
            <input ref={파일Ref} className="gwk-vrmin" type="file" accept=".vrm,.glb" style={{ display: 'none' }} onChange={(e) => { 모델넣기(e.target.files && e.target.files[0]); e.target.value = '' }} />
            {모델상태 && <div className="muted">{모델상태}</div>}
          </div>
          <p className="muted gwk-credit">캐릭터: VRoid 샘플 모델(CC0)</p>
          <button type="button" className="gwk-go" onClick={() => set사람({ ...사람, 고름: false })}>이 사람으로 걷기 →</button>
        </div>
      )}
    </div>
  )
}

/** 층 이름이 FT 인가(층 표에서) — 화면 글 */
export const FT인가 = (M, 층) => FT층(M.층.find((f) => f.이름 === 층))
