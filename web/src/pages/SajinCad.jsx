/**
 * /tools/sajincad — 📷 사진 · 손그림 · 건물 → 캐드(DXF) (G287 · 2026-10-14)
 *
 * 소장님: 「사진을 주면 캐드로 주는 도구, 그림을 그려서 줘도 캐드로」 · 「손그림, 사진 모두 정확도가 높아야 해」
 *        「무료로 도구를 만들어야 해」 · 「건물사진도 캐드로」 · 「치수도 자동으로」 · 「최대한 자료 찾아보고, 정교하게 … 유료 보다 더 좋은 결과물이 나오게 해. 반드시…」
 *
 * ■ 모두 이 기기 안에서(일꾼 lib/사진캐드.worker.js) — 서버 · 요금 없음 · 사진은 어디로도 안 감
 * ■ 흐름: ① 고르기(도면 사진 · 손그림 · 건물) ② 모서리(종이 네 모서리 자동 → 끌어 고침 · 건물은 소실점으로 저절로)
 *         ③ 읽기(선 · 호 · 원 · 글자 · 숫자 · 치수 짝짓기) ④ 고치기(선 눌러 길이 넣기 · 숫자 고치기 · 지우기) ⑤ DXF · 도면 PDF 로
 * ■ 엔진: lib/사진캐드_펴기 · _잉크 · _선 · _글자 · _숫자 · _치수 · _dxf · _흐름 (방안 docs/방안_사진손그림캐드.md)
 * ■ 📊 세기: |사진캐드|도면 · |사진캐드|손그림 · |사진캐드|건물 · |사진캐드|예시 · |사진캐드|DXF · |사진캐드|PDF · |사진캐드|길이넣음 · |사진캐드|숫자고침
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 맞추기, 결과그림, DXF만들기, 건물치수 } from '../lib/사진캐드_흐름.js'
import { 세울것, 보기층, OBJ만들기 } from '../lib/사진캐드_3d.js'
import { LineView } from '../lib/gl3d.js'
import { 도면넘기기 } from '../lib/도면넘김.js'
import { 세기 } from '../lib/받은수.jsx'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 꺼내기 as 찍은사진꺼내기, 사건이름 as 찍은사진사건 } from '../lib/찍은사진.js'   /* 📷 G322 옆 «+» 찍기 단추 */

const 꼴들 = [
  { k: '도면', 아이콘: '📄', 이름: '도면 사진', 설명: '인쇄한 도면 · 모니터 화면을 찍은 사진 — 적힌 치수 숫자를 읽어 그대로 맞춤' },
  { k: '손그림', 아이콘: '✏️', 이름: '손그림', 설명: '종이에 그린 그림 — 치수 숫자를 적어 주시면 그 숫자대로 반듯하게' },
  { k: '건물', 아이콘: '🏢', 이름: '건물 사진', 설명: '건물 정면 사진 — 기울기 · 원근을 펴서 입면도로(아는 길이 하나로 크기)' },
]
const 종이들 = [['', '자동'], ['A4', 'A4'], ['A3', 'A3'], ['A2', 'A2'], ['A1', 'A1'], ['B4', 'B4']]
const 예시들 = { 도면: '/tools/files/ex-sajincad-plan.jpg', 손그림: '/tools/files/ex-sajincad-sketch.jpg', 건물: '/tools/files/ex-sajincad-building.jpg' }
const 최대처리 = 3200

let 일꾼 = null, 번 = 0
const 기다림 = new Map()
function 일꾼부르기(말, 넘김, 진행) {
  if (!일꾼) {
    일꾼 = new Worker(new URL('../lib/사진캐드.worker.js', import.meta.url), { type: 'module' })
    일꾼.onmessage = (e) => {
      const d = e.data || {}
      const w = 기다림.get(d.id); if (!w) return
      if (d.진행) { w.진행 && w.진행(d.진행); return }
      기다림.delete(d.id)
      if (d.오류) w.거절(new Error(d.오류)); else w.풀기(d)
    }
    일꾼.onerror = (e) => { for (const w of 기다림.values()) w.거절(new Error(e.message || '일꾼 오류')); 기다림.clear(); 일꾼 = null }
  }
  const id = ++번
  return new Promise((풀기, 거절) => { 기다림.set(id, { 풀기, 거절, 진행 }); 일꾼.postMessage({ ...말, id }, 넘김 || []) })
}

async function 사진읽기(파일) {
  let bmp
  try { bmp = await createImageBitmap(파일, { imageOrientation: 'from-image' }) } catch (e) { bmp = await createImageBitmap(파일) }
  const s = Math.min(1, 최대처리 / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * s), h = Math.round(bmp.height * s)
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h
  const g = cv.getContext('2d'); g.drawImage(bmp, 0, 0, w, h)
  const im = g.getImageData(0, 0, w, h)
  // 화면용 작은 그림
  const k = Math.min(1, 1400 / Math.max(w, h))
  const sc = document.createElement('canvas'); sc.width = Math.round(w * k); sc.height = Math.round(h * k)
  sc.getContext('2d').drawImage(cv, 0, 0, sc.width, sc.height)
  return { rgba: im.data, w, h, 보기: sc, 보기배: w / sc.width }
}

const 쉼 = (n) => Math.round(n).toLocaleString('ko-KR')

export default function SajinCad() {
  const 넘길곳 = useNavigate()
  const [꼴, set꼴] = useState('도면')
  const [단계, set단계] = useState('고르기')   // 고르기 · 모서리 · 건물네모 · 처리 · 결과
  const [사진, set사진] = useState(null)       // { w, h, 보기, 보기배, 이름 }
  const [네모, set네모] = useState(null)
  const [믿음, set믿음] = useState(0)
  const [종이, set종이] = useState('')
  const [세기값, set세기값] = useState(1)
  const [벽만값, set벽만값] = useState(undefined)   // 🧱 칠한 평면도 → 벽 · 치수만: undefined 저절로 · true · false(사람이 고름)
  const [진행, set진행] = useState(null)
  const [오류, set오류] = useState('')
  const [결과, set결과] = useState(null)
  const [미리, set미리] = useState(null)       // { w, h, d, 배 } → 캔버스
  const [사람치수, set사람치수] = useState([])  // [{ 선, 값 }]
  const [지운선, set지운선] = useState(() => new Set())
  const [끈치수, set끈치수] = useState(() => new Set())
  const [고친값, set고친값] = useState(() => new Map())
  const [고른선, set고른선] = useState(null)
  const [고른숫자, set고른숫자] = useState(null)
  const [넣는값, set넣는값] = useState('')
  const [보기켬, set보기켬] = useState({ 사진: true, 글씨: true, 치수: true })
  const [건물척, set건물척] = useState(null)
  const [건물네모값, set건물네모값] = useState({ 가로: '', 세로: '' })
  const [되돌림, set되돌림] = useState([])
  const 파일칸 = useRef(null), 찍기칸 = useRef(null)
  const 예시로 = useRef(false)

  const 처음으로 = () => {
    set단계('고르기'); set사진(null); set네모(null); set결과(null); set미리(null); set오류(''); set진행(null); set벽만값(undefined)
    set사람치수([]); set지운선(new Set()); set끈치수(new Set()); set고친값(new Map()); set고른선(null); set고른숫자(null); set되돌림([]); set건물척(null)
  }

  const 받기 = async (파일, 예시 = false) => {
    if (!파일) return
    set오류(''); set진행({ 글: '사진 여는 중', p: 0.02 }); set단계('처리')
    예시로.current = 예시
    try {
      const p = await 사진읽기(파일)
      const 보낼 = p.rgba.buffer
      set사진({ w: p.w, h: p.h, 보기: p.보기, 보기배: p.보기배, 이름: (파일.name || '사진').replace(/\.[^.]+$/, '') })
      세기('|사진캐드|' + 꼴)
      if (예시) 세기('|사진캐드|예시')
      const r = await 일꾼부르기({ 일: '넣기', rgba: 보낼, w: p.w, h: p.h, 꼴 }, [보낼])
      set진행(null)
      if (꼴 === '건물') {
        if (r.실패) { set오류(r.실패); set네모(기본네모(p.w, p.h)); set단계('건물네모'); return }
        await 읽기(null)
        return
      }
      set네모(r.네모); set믿음(r.믿음 || 0); set단계('모서리')
    } catch (e) { set오류('사진을 열지 못했습니다 — ' + e.message); set단계('고르기'); set진행(null) }
  }
  /* 📷 G322 옆 «+» 단추(찍기단추.jsx)에서 찍고 «사진→캐드로 바꾸기» 를 고른 사진 — 그 사진으로 바로 시작 */
  useEffect(() => {
    const 받기찍은 = () => {
      const f = 찍은사진꺼내기('캐드')
      if (!f) return
      세기('|사진캐드|찍기단추')
      처음으로()
      받기(f)
      try { window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (e) { /* */ }
    }
    받기찍은()
    window.addEventListener(찍은사진사건, 받기찍은)     /* 이 화면에서 옆 단추로 찍었을 때 */
    return () => window.removeEventListener(찍은사진사건, 받기찍은)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const 예시받기 = async () => {
    try {
      const b = await fetch(예시들[꼴]).then((x) => { if (!x.ok) throw new Error(x.status); return x.blob() })
      받기(new File([b], `예시_${꼴}.jpg`, { type: 'image/jpeg' }), true)
    } catch (e) { set오류('예시를 받지 못했습니다') }
  }

  const 읽기 = async (네모값 = 네모, 벽 = 벽만값) => {
    set오류(''); set단계('처리'); set진행({ 글: '읽는 중', p: 0.05 })
    try {
      const r = await 일꾼부르기({ 일: '읽기', 꼴, 네모: 네모값, 종이: 종이 || undefined, 세기: 세기값, ...(벽 != null ? { 벽만: 벽 } : {}) }, [], (j) => set진행(j))
      set결과(r.결과); set미리(r.미리); set단계('결과'); set진행(null)
      set사람치수([]); set지운선(new Set()); set끈치수(new Set()); set고친값(new Map()); set고른선(null); set고른숫자(null); set되돌림([])
      if (r.결과 && r.결과.글읽기) 세기('|사진캐드|글읽기' + r.결과.글읽기)   // 켬 · 못씀 · 끔 — 화면에는 안 보임
      if (r.결과 && r.결과.벽만 && 벽 == null) 세기('|사진캐드|벽만자동')
    } catch (e) { set오류('읽지 못했습니다 — ' + e.message); set단계(꼴 === '건물' ? '건물네모' : '모서리'); set진행(null) }
  }
  /* 🧱 벽 · 치수만 ↔ 가구 · 무늬까지 — 같은 모서리로 다시 읽음 */
  const 벽만바꾸기 = (v) => { set벽만값(v); 세기(v ? '|사진캐드|벽만켬' : '|사진캐드|벽만끔'); 읽기(네모, v) }
  const 건물네모로 = async () => {
    const 가로 = Number(String(건물네모값.가로).replace(/[^\d.]/g, '')), 세로 = Number(String(건물네모값.세로).replace(/[^\d.]/g, ''))
    set오류(''); set단계('처리'); set진행({ 글: '펴는 중', p: 0.2 })
    try {
      const r = await 일꾼부르기({ 일: '건물네모', 네모, 가로: 가로 || 0, 세로: 세로 || 0 })
      set결과(r.결과); set미리(r.미리); set건물척(r.척 || null); set단계('결과'); set진행(null)
      set사람치수([]); set지운선(new Set()); set고른선(null); set되돌림([])
    } catch (e) { set오류('펴지 못했습니다 — ' + e.message); set단계('건물네모'); set진행(null) }
  }

  /* 풀이: 자동 치수 + 사람이 넣은 길이 → 픽셀 → mm */
  const 쓸결과 = useMemo(() => {
    if (!결과) return null
    if (!지운선.size) return 결과
    // 지운 선은 빼되, 번호(사람치수 · 치수의 선 번호)가 어긋나지 않게 자리는 남김(빈 꼴)
    return { ...결과, 도형: 결과.도형.map((s, i) => (지운선.has(i) ? { ...s, 지움: true } : s)) }
  }, [결과, 지운선])
  const 풀이 = useMemo(() => {
    if (!쓸결과) return null
    const 풀 = 맞추기(쓸결과, 사람치수, { 끈치수, 고친값, 척: 건물척 || undefined })
    if (쓸결과.건물 && !풀.축척모름) 풀.치수들 = [...풀.치수들, ...건물치수(쓸결과, 풀)]
    return 풀
  }, [쓸결과, 사람치수, 끈치수, 고친값, 건물척])
  /* 📏 G360 치수를 못 읽어 문 폭으로 크기를 짐작한 번 — 읽을 때마다 한 번(사람이 길이를 넣어 바뀐 것은 안 셈) */
  useEffect(() => { if (결과 && 풀이 && 풀이.축척추정) 세기('|사진캐드|문폭짐작') }, [결과])   // eslint-disable-line react-hooks/exhaustive-deps

  const 그림만들기 = () => {
    const 보낼 = { ...쓸결과, 도형: 쓸결과.도형.filter((s) => !s.지움) }
    // 선 번호가 바뀌므로 치수의 선(원래 치수선 표시)은 다시 맞춤
    const 새번 = new Map(); let k = 0
    쓸결과.도형.forEach((s, i) => { if (!s.지움) 새번.set(i, k++) })
    const 풀 = { ...풀이, 치수들: 풀이.치수들.map((d) => ({ ...d, 선: 새번.has(d.선) ? 새번.get(d.선) : -1, ...(d.선2 != null ? { 선2: 새번.has(d.선2) ? 새번.get(d.선2) : -1 } : {}) })) }
    return 결과그림(보낼, 풀, { 글씨: 보기켬.글씨 })
  }
  const DXF받기 = () => {
    const 글 = DXF만들기(그림만들기())
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([글], { type: 'application/dxf' }))
    a.download = `${(사진 && 사진.이름) || '사진'}_캐드.dxf`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 60000)
    세기('|사진캐드|DXF')
  }
  const PDF로 = () => {
    const 글 = DXF만들기(그림만들기())
    도면넘기기({ 이름: `${(사진 && 사진.이름) || '사진'}_캐드.dxf`, 바이트: new TextEncoder().encode(글) })
    세기('|사진캐드|PDF')
    넘길곳('/tools/dxfpdf')
  }

  /* 고르기 · 고치기 */
  const 기억 = () => set되돌림((L) => [...L.slice(-30), { 사람치수, 지운선: new Set(지운선), 끈치수: new Set(끈치수), 고친값: new Map(고친값) }])
  const 되돌리기 = () => set되돌림((L) => { if (!L.length) return L; const x = L[L.length - 1]; set사람치수(x.사람치수); set지운선(x.지운선); set끈치수(x.끈치수); set고친값(x.고친값); return L.slice(0, -1) })
  const 길이넣기 = () => {
    const v = Number(String(넣는값).replace(/[^\d.]/g, ''))
    if (!(v > 0) || 고른선 == null) return
    기억()
    set사람치수((L) => [...L.filter((x) => x.선 !== 고른선), { 선: 고른선, 값: v }])
    set넣는값(''); 세기('|사진캐드|길이넣음')
  }
  const 선지우기 = () => { if (고른선 == null) return; 기억(); set지운선((S) => new Set([...S, 고른선])); set사람치수((L) => L.filter((x) => x.선 !== 고른선)); set고른선(null) }
  const 숫자고치기 = () => {
    const v = Number(String(넣는값).replace(/[^\d.]/g, ''))
    if (고른숫자 == null || !(v > 0)) return
    기억()
    set고친값((M) => new Map([...M, [고른숫자, v]])); set끈치수((S) => { const n = new Set(S); n.delete(고른숫자); return n })
    set넣는값(''); 세기('|사진캐드|숫자고침')
  }
  const 숫자끄기 = () => { if (고른숫자 == null) return; 기억(); set끈치수((S) => new Set([...S, 고른숫자])); set고른숫자(null) }

  const 선길이mm = (s) => {
    if (!풀이 || !s || s.t !== 'L') return null
    const dx = 풀이.x(s.b[0]) - 풀이.x(s.a[0]), dy = 풀이.y(s.b[1]) - 풀이.y(s.a[1])
    return Math.hypot(dx, dy)
  }
  const 요약 = useMemo(() => {
    if (!풀이 || !결과) return null
    const 자동 = 풀이.치수들.filter((d) => !d.손넣음)
    const 쓰임 = 자동.filter((d) => d.쓰임), 안 = 자동.filter((d) => !d.쓰임 && !d.치수아님 && !(끈치수.has(d.번호)))
    const 최차 = Math.max(0, ...풀이.치수들.filter((d) => d.쓰임 && isFinite(d.차)).map((d) => Math.abs(d.차)))
    const 의심 = 쓰임.filter((d) => (d.믿음 ?? 1) < 0.6 && !d.사람 && !d.확인)
    return { 확인: 쓰임.filter((d) => d.확인).length, 선: 결과.도형.filter((s, i) => s.t === 'L' && !지운선.has(i)).length, 호: 결과.도형.filter((s) => s.t !== 'L').length, 자동: 자동.length, 쓰임: 쓰임.length, 안: 안.length, 의심: 의심.length, 최차, 사람: 사람치수.length }
  }, [풀이, 결과, 지운선, 끈치수, 사람치수])

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>📷 사진 · 손그림 → 캐드 <span className="count">· DXF · 치수까지</span></h1>
        <div className="note sm">
          도면을 찍은 사진, 종이에 그린 손그림, 건물 정면 사진을 <b>캐드 도면(DXF)</b> 으로 바꿉니다.
          비스듬한 사진을 반듯하게 펴고, 선 · 원 · 호를 찾아 <b>직각 · 평행을 맞추고</b>, 도면에 적힌 <b>치수 숫자를 읽어 그 길이대로</b> 맞춥니다.
        </div>
        <div className="pdfsafe">🔒 <b>사진은 어디로도 올라가지 않습니다.</b> 이 기기 안에서만 바꿉니다. 회원가입 없이 바로 이용 가능.</div>
      </div>

      {단계 === '고르기' && (
        <div className="card">
          <div className="sc-kinds" role="radiogroup" aria-label="무엇을 찍었나요">
            {꼴들.map((x) => (
              <button key={x.k} type="button" role="radio" aria-checked={꼴 === x.k} className={'sc-kind' + (꼴 === x.k ? ' on' : '')} onClick={() => set꼴(x.k)}>
                <span className="sc-kind-i">{x.아이콘}</span><b>{x.이름}</b><span>{x.설명}</span>
              </button>
            ))}
          </div>
          <div className="pdfdrop" style={{ marginTop: 12 }}
               onDragOver={(e) => e.preventDefault()}
               onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) 받기(f) }}>
            <button type="button" className="pdfpick" onClick={() => 찍기칸.current?.click()}>📷 바로 찍기</button>
            <button type="button" className="pdfpick pdfpick2" onClick={() => 파일칸.current?.click()}>🖼 사진 고르기</button>
            <div className="pdfdrop-d">또는 사진을 여기에 끌어다 놓으세요 · JPG · PNG · HEIC(아이폰) · <button type="button" className="sc-ex" onClick={예시받기}>🧪 예시로 해 보기</button></div>
          </div>
          <input ref={파일칸} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => { 받기(e.target.files && e.target.files[0]); e.target.value = '' }} />
          <input ref={찍기칸} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => { 받기(e.target.files && e.target.files[0]); e.target.value = '' }} />
          <끌어놓기판 글="사진을 놓으면 캐드로 바꿉니다" 길들={[{ 꼴: /\.(jpe?g|png|heic|heif|webp|bmp)$/i, 받기: (fs) => 받기(fs[0]) }]} />
          <div className="sc-tip">
            <b>정확하게 찍는 법</b> — {꼴 === '건물' ? <>건물 정면이 크게 나오게 · 아는 길이 하나(문 높이 · 층 높이 · 창 넓이)를 알면 그 크기로 맞춥니다.</> : <>위에서 똑바로 · 밝게 · 그림자 없이 · <b>종이 네 모서리가 다 나오게</b>.{꼴 === '손그림' && <> 진한 펜 · 벽은 두 줄로 · <b>치수 숫자를 적어 주세요</b>(숫자대로 맞춥니다).</>}</>}
          </div>
        </div>
      )}

      {단계 === '처리' && (
        <div className="card">
          <div className="dx3-bar" aria-live="polite">
            <div className="dx3-bar-in" style={{ width: Math.round(((진행 && 진행.p) || 0.05) * 100) + '%' }} />
            <span>{(진행 && 진행.글) || '바꾸는 중'} …</span>
          </div>
          <div className="muted sm" style={{ marginTop: 8 }}>큰 사진은 폰에서 10 ~ 30초 걸릴 수 있습니다. 이 화면을 떠나지 말아 주세요.</div>
        </div>
      )}

      {오류 && <div className="card"><div className="dx3-err">{오류}</div></div>}

      {단계 === '모서리' && 사진 && (
        <div className="card">
          <div className="detail-h">① 종이 네 모서리 {믿음 > 0.5 ? '— 저절로 찾았습니다' : '— 잘 안 보여서 사진 끝으로 두었습니다'}</div>
          <div className="muted sm" style={{ marginBottom: 8 }}>파란 점을 끌어 종이(도면) 모서리에 맞춰 주세요. 반듯하게 펴서 읽습니다.</div>
          <모서리판 사진={사진} 네모={네모} set네모={set네모} />
          <div className="sc-row">
            <label>종이 크기 <select value={종이} onChange={(e) => set종이(e.target.value)}>{종이들.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
            <label title="흐린 선이 빠지면 왼쪽, 얼룩이 선으로 나오면 오른쪽">선 진하기 <input type="range" min="0.6" max="1.6" step="0.1" value={세기값} onChange={(e) => set세기값(Number(e.target.value))} /></label>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set네모(기본네모(사진.w, 사진.h))}>사진 전체</button>
          </div>
          <div className="sc-row">
            <button type="button" className="btn" style={{ width: 'auto' }} onClick={() => 읽기()}>▶ 캐드로 바꾸기</button>
            <button type="button" className="btn line" style={{ width: 'auto' }} onClick={처음으로}>다른 사진</button>
          </div>
        </div>
      )}

      {단계 === '건물네모' && 사진 && (
        <div className="card">
          <div className="detail-h">🏢 정면의 네모 하나를 찍어 주세요</div>
          <div className="muted sm" style={{ marginBottom: 8 }}>창 · 문 · 벽처럼 <b>실제로 네모난 것</b>의 네 모서리에 파란 점을 맞추고, 아시면 그 가로 · 세로(mm)를 넣어 주세요(크기까지 맞춤).</div>
          <모서리판 사진={사진} 네모={네모} set네모={set네모} />
          <div className="sc-row">
            <label>가로 mm <input inputMode="decimal" value={건물네모값.가로} onChange={(e) => set건물네모값((v) => ({ ...v, 가로: e.target.value }))} placeholder="예: 1500" /></label>
            <label>세로 mm <input inputMode="decimal" value={건물네모값.세로} onChange={(e) => set건물네모값((v) => ({ ...v, 세로: e.target.value }))} placeholder="예: 2100" /></label>
          </div>
          <div className="sc-row">
            <button type="button" className="btn" style={{ width: 'auto' }} onClick={건물네모로}>▶ 펴서 캐드로</button>
            <button type="button" className="btn line" style={{ width: 'auto' }} onClick={처음으로}>다른 사진</button>
          </div>
        </div>
      )}

      {단계 === '결과' && 결과 && 미리 && 풀이 && (
        <>
          <div className="card">
            <div className="detail-h">② 다 됐습니다 — 확인하고 받으세요</div>
            {요약 && (
              <div className="sc-sum" data-ocr={결과.글읽기 || ''} data-son={결과.손숫자 || ''}>
                <span>선 <b>{요약.선}</b></span>
                {요약.호 > 0 && <span>원 · 호 <b>{요약.호}</b></span>}
                {!결과.건물 && <span>읽은 치수 <b>{요약.쓰임}</b>{요약.쓰임 + 요약.안 > 요약.쓰임 ? ` / ${요약.쓰임 + 요약.안}` : ''}</span>}
                {요약.사람 > 0 && <span>넣은 길이 <b>{요약.사람}</b></span>}
                {요약.쓰임 + 요약.사람 > 1 && <span>치수끼리 남은 차 <b>{요약.최차 < 0.5 ? '0' : 요약.최차.toFixed(1)}</b> mm</span>}
                {요약.확인 > 0 && <span className="sc-ok">검산된 치수 <b>{요약.확인}</b></span>}
                {요약.의심 > 0 && <span className="sc-warn">확인할 숫자 <b>{요약.의심}</b></span>}
                {요약.안 > 0 && <span className="sc-bad">안 맞아 뺀 숫자 <b>{요약.안}</b></span>}
              </div>
            )}
            {결과.글읽기 === '못씀' && <div className="muted sm" style={{ marginTop: 6 }}>🔤 글 읽기(PaddleOCR)를 불러오지 못해 이 사이트 숫자망으로만 읽었습니다 — 인터넷 연결을 확인하고 «모서리 다시» 로 한 번 더 해 보세요.</div>}
            {!결과.건물 && !결과.손그림 && (결과.벽만 ? (
              <div className="sc-note"><span>🧱 {결과.칠함 && 벽만값 == null ? <>바닥 · 가구가 칠해진 평면도라 <b>벽 · 치수만</b> 뽑았습니다(가구 · 바닥 무늬 · 방 번호 원은 뺌).</> : <><b>벽 · 치수만</b> 뽑았습니다.</>}</span>
                <button type="button" className="btn line sm" onClick={() => 벽만바꾸기(false)}>가구 · 무늬까지 다 뽑기</button></div>
            ) : (결과.칠함 || (요약 && 요약.선 > 400)) ? (
              <div className="sc-note"><span>🧱 가구 · 바닥 무늬까지 선으로 나왔나요? 가구 · 무늬 · 방 번호 원을 빼고 벽과 치수만 뽑을 수도 있습니다.</span>
                <button type="button" className="btn line sm" onClick={() => 벽만바꾸기(true)}>벽 · 치수만 뽑기</button></div>
            ) : null)}
            {풀이.비율차 && (() => {
              const 가 = 풀이.치수들.find((d) => d.전체 && d.쓰임 && d.꼴 === 'H'), 세 = 풀이.치수들.find((d) => d.전체 && d.쓰임 && d.꼴 === 'V')
              return 가 && 세 ? <div className="muted sm" style={{ marginTop: 6 }}>📐 적힌 전체 치수(가로 {쉼(가.mm)} · 세로 {쉼(세.mm)})가 그림의 가로 : 세로와 달라 <b>적힌 숫자대로</b> 맞췄습니다(세로가 그림의 {풀이.비율차.toFixed(2)}배) — 그림이 축척대로 안 그려졌거나 비스듬히 찍혔을 수 있습니다.</div> : null
            })()}
            {풀이.축척모름 && <div className="sc-banner">📏 <b>크기를 모릅니다.</b> 길이를 아는 선(문 높이 · 벽 길이 · 치수선)을 눌러 실제 길이(mm)를 넣어 주세요 — 하나면 전체 크기가 맞습니다.</div>}
            {풀이.축척추정 && <div className="sc-banner">📏 <b>치수 숫자를 못 읽어 크기는 문 폭(900 mm · 문 {풀이.축척추정.개}개)으로 짐작했습니다.</b> 길이를 아는 선(치수선 · 벽 길이)을 눌러 실제 길이(mm)를 넣으면 정확해집니다.</div>}
            <결과판 결과={쓸결과} 미리={미리} 풀이={풀이} 고른선={고른선} 고른숫자={고른숫자} 보기켬={보기켬}
              누름={(t) => { set넣는값(''); if (t && t.선 != null) { set고른선(t.선); set고른숫자(null) } else if (t && t.숫자 != null) { set고른숫자(t.숫자); set고른선(null) } else { set고른선(null); set고른숫자(null) } }} />
            <div className="sc-row sc-toggles">
              {[['사진', '사진 겹쳐 보기'], ['치수', '치수'], ['글씨', '글씨(그림)']].map(([k, n]) => (
                <label key={k}><input type="checkbox" checked={보기켬[k]} onChange={(e) => set보기켬((v) => ({ ...v, [k]: e.target.checked }))} /> {n}</label>
              ))}
              <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={!되돌림.length} onClick={되돌리기}>↶ 되돌리기</button>
            </div>
            {고른선 != null && 쓸결과.도형[고른선] && (
              <div className="sc-pick">
                <div>고른 선 — 지금 길이 <b>{선길이mm(쓸결과.도형[고른선]) != null ? 쉼(선길이mm(쓸결과.도형[고른선])) : '-'} mm</b>
                  {사람치수.find((x) => x.선 === 고른선) && <em> (넣은 값)</em>}</div>
                <div className="sc-row">
                  <input inputMode="decimal" placeholder="실제 길이 mm" value={넣는값} onChange={(e) => set넣는값(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') 길이넣기() }} />
                  <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={길이넣기}>길이 넣기</button>
                  <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={선지우기}>이 선 지우기</button>
                </div>
              </div>
            )}
            {고른숫자 != null && 풀이.치수들.find((d) => d.번호 === 고른숫자) && (() => {
              const d = 풀이.치수들.find((x) => x.번호 === 고른숫자)
              return (
                <div className="sc-pick">
                  <div>읽은 숫자 <b>{쉼(d.mm ?? d.값)} mm</b>{d.글 && String(d.글).replace(/,/g, '') !== String(d.값) && <em> («{d.글}» 로 읽음)</em>}{d.읽은값 != null && <em> (처음 읽음 {d.읽은값})</em>} · {d.쓰임 ? <span className="sc-ok">맞춤에 씀{d.확인 ? ` · ${d.확인}` : ''}</span> : <span className="sc-bad">{d.까닭 || '안 씀'}</span>}{d.믿음 != null && <span className="muted"> · 믿음 {Math.round(d.믿음 * 100)}%</span>}</div>
                  <div className="sc-row">
                    <input inputMode="decimal" placeholder="맞는 숫자" value={넣는값} onChange={(e) => set넣는값(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') 숫자고치기() }} />
                    <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={숫자고치기}>숫자 고치기</button>
                    <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={숫자끄기}>이 숫자 빼기</button>
                  </div>
                </div>
              )
            })()}
            <div className="muted sm" style={{ marginTop: 6 }}>선이나 숫자를 누르면 고칠 수 있습니다 · 두 손가락(마우스 휠)으로 크게 · 끌어서 옮기기</div>
          </div>
          <div className="card">
            <div className="sc-row">
              <button type="button" className="btn" style={{ width: 'auto' }} onClick={DXF받기}>⬇ DXF 받기</button>
              <button type="button" className="btn line" style={{ width: 'auto' }} onClick={PDF로}>📄 도면 PDF 로</button>
              <button type="button" className="btn line" style={{ width: 'auto' }} onClick={() => (꼴 === '건물' ? (set네모(기본네모(사진.w, 사진.h)), set단계('건물네모')) : set단계('모서리'))}>{꼴 === '건물' ? '네 점 직접 찍기' : '모서리 다시'}</button>
              <button type="button" className="btn line" style={{ width: 'auto' }} onClick={처음으로}>다른 사진</button>
            </div>
            <div className="muted sm" style={{ marginTop: 6 }}>레이어: LINE 선 · DIM 자동 치수 · DIM_SRC 원래 치수선 · TEXT 원래 글씨(그림) · DASH 점선 — mm 단위 · AutoCAD · ZWCAD · 캐디안에서 열립니다.</div>
          </div>
          {꼴 !== '건물' && !풀이.축척모름 && <입체판 그림만들기={그림만들기} 열쇠={[풀이, 쓸결과, 보기켬.글씨]} 이름={(사진 && 사진.이름) || '사진'} />}
        </>
      )}

      <div className="card">
        <div className="detail-h">이렇게 정확하게 맞춥니다</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li><b>사진 펴기</b> — 종이 네 모서리를 0.1 픽셀까지 찾고, 비스듬히 찍어 줄어든 쪽까지 <b>진짜 가로 : 세로</b>를 사진기 초점에서 거꾸로 셈(Zhang). 건물은 세로 · 가로선이 모이는 두 점(소실점)으로 정면을 폅니다</li>
          <li><b>선 찾기</b> — 그림자 · 얼룩을 빼고 잉크만 → 1픽셀 뼈대 → 곧은 선 · 원 · 호로 맞춤(점 전체 최소제곱)</li>
          <li><b>반듯하게</b> — 거의 가로 · 세로 · 45° 인 선은 딱 맞추고, 끊긴 선은 잇고, 모서리 · T 자리는 만나게</li>
          <li><b>칠한 평면도</b> — 분양 · 홍보용처럼 바닥 · 가구 · 방 번호 원이 칠해진 그림은 저절로 알아보고 <b>가장 진하고 길게 곧은 벽 띠</b>와 치수만 뽑습니다(가구 · 바닥 무늬는 뺌 · 단추 하나로 다 뽑기도). 적힌 전체 치수(가로 · 세로)가 그림 비율과 달라도 적힌 숫자대로 맞춥니다</li>
          <li><b>치수 숫자대로</b> — 도면 · 손그림에 적힌 숫자를 이 기기 안에서 읽어(인쇄 · 손글씨 · «12,000» «3.6» «0.8m» «12'-6"» 처럼 단위까지) 치수선 양 끝에 맞춥니다. 부분 치수 합이 전체 치수와 안 맞으면 짚어 드리고, 잘못 읽은 숫자는 둥근 수 · 둘레 치수로 고쳐 봅니다</li>
          <li><b>건물 정면 치수</b> — 길이 하나(건물 폭 · 창 폭)만 넣으면 아래에 창 · 문 자리 치수와 전체 폭, 옆에 층 · 창 높이 치수와 전체 높이가 저절로 들어갑니다(DXF 치수 그대로)</li>
          <li><b>3D</b> — 평면의 벽 선을 벽 높이만큼 세워 돌려 보고, <b>3D DXF</b>(AutoCAD · ZWCAD) · <b>OBJ</b>(스케치업 · 블렌더)로 받습니다</li>
          <li><b>함께 쓰기</b> — 받은 DXF 는 <Link to="/tools/dxfpdf">도면 PDF 만들기</Link> · <Link to="/jeoksan/bim">BIM 물량</Link> · <Link to="/tools/dxf3d">도면 3D 보기</Link> 에 바로 넣을 수 있습니다</li>
        </ul>
      </div>
      <div className="card">
        <div className="detail-h">알아 두실 점</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li><b>숫자가 적힌 곳은 숫자 그대로</b>, 안 적힌 곳은 사진 비율대로 그 사이에 들어갑니다. 꼭 맞아야 하는 길이는 선을 눌러 넣어 주세요</li>
          <li>건물 사진은 <b>한 면(정면)</b> 만 정확합니다. 튀어나온 발코니 · 다른 면은 같은 평면이 아니라 틀립니다</li>
          <li>손글씨 숫자는 흘려 쓰면 틀리게 읽을 수 있습니다 — 노란 숫자(믿음 낮음)는 눌러 확인해 주세요</li>
          <li>사진이 흐리거나 어두우면 «선 진하기» 를 왼쪽으로 · 얼룩이 선으로 나오면 오른쪽으로</li>
          <li>사진에 다른 그림 · 제목 딱지가 함께 찍혔으면 «모서리 다시» 로 도면만 들어오게 파란 점을 옮기면 더 깔끔합니다</li>
        </ul>
      </div>
      <div className="card">
        <div className="detail-h">공개 자료</div>
        <div className="tl-p" style={{ lineHeight: 1.8 }}>
          글 · 숫자 읽기는 Baidu 가 공개한 <b>PaddleOCR</b>(PP-OCRv4 · Apache-2.0) 를 <b>ONNX Runtime Web</b>(Microsoft · MIT)으로 이 기기 안에서 돌립니다 — 처음 한 번 공개 CDN(jsDelivr)에서 받아 두고, 사진은 밖으로 나가지 않습니다.
          함께 이 사이트가 직접 학습한 작은 숫자망(손글씨 MNIST · Y. LeCun 들 · npm mnist 1.1.0 · MIT · 공개 글꼴 · Hershey 한붓 글꼴)과 <b>손글씨 치수 숫자 줄 읽기</b>(이 사이트가 MNIST 손글씨 · 공개 손글씨 글꼴 30종 — Google Fonts · SIL OFL · Apache-2.0 — 로 16만 줄을 만들어 학습 · 약 0.75MB)로 한 번 더 읽어 서로 견줍니다.
          방법은 Zhang(2006) 화이트보드 펴기 · Grompone von Gioi 들(LSD, 2010) · Suárez 들(ELSED, 2022) · Lu 들의 치수 글자 연구를 따랐습니다.
        </div>
      </div>
      <div className="card">
        <div className="navrow">
          <Link className="navi" to="/tools">🧰 다른 도구</Link>
          <Link className="navi" to="/tools/dxfpdf">📄 도면 PDF 만들기</Link>
          <Link className="navi" to="/tools/dwgdxf">🔁 DWG → DXF</Link>
          <Link className="navi" to="/jeoksan/bim">🧊 BIM 물량</Link>
        </div>
      </div>
    </div>
  )
}

/* 🧊 3D (G287 · 소장님 「3D도 가능하게 해줘」) — 평면의 벽 선을 벽 높이만큼 세워 돌려 보기 · 3D DXF(3DFACE) · OBJ 받기 */
function 맞춰보기(v, 상자, 꼴) { v.fit(상자, 꼴); v.d *= 꼴 === 'top' ? 1.05 : 1.15; v.dirty() }   // 비스듬히 볼 때 바닥 앞쪽이 잘리지 않게 조금 물러섬
function 입체판({ 그림만들기, 열쇠, 이름 }) {
  const [켬, set켬] = useState(false)
  const [높이, set높이] = useState('2400')
  const 캔 = useRef(null), 뷰 = useRef(null)
  const 높 = Math.max(100, Math.min(100000, Number(String(높이).replace(/[^\d.]/g, '')) || 2400))
  const 만듦 = useMemo(() => {
    if (!켬) return null
    const 그 = 그림만들기()
    const 세 = 세울것(그, { 높이: 높 })
    return 세 ? { 그, 세, 보기: 보기층(그, 세) } : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [켬, 높, ...열쇠])
  useEffect(() => {
    if (!켬 || !만듦 || !캔.current) return
    try {
      if (!뷰.current) 뷰.current = new LineView(캔.current)
      뷰.current.setLayers(만듦.보기.층들)
      뷰.current.set면(0.92)
      if (!뷰.current._맞춤) { const v = 뷰.current; v._맞춤 = true; requestAnimationFrame(() => requestAnimationFrame(() => { try { 맞춰보기(v, 만듦.보기.상자, 'tilt') } catch (e) { /* */ } })) }
    } catch (e) { /* WebGL 없음 */ }
  }, [켬, 만듦])
  useEffect(() => () => { try { 뷰.current && 뷰.current.dispose() } catch (e) { /* */ } 뷰.current = null }, [])
  useEffect(() => { if (!켬 && 뷰.current) { try { 뷰.current.dispose() } catch (e) { /* */ } 뷰.current = null } }, [켬])
  const 받기 = (글, 끝, 꼴) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([글], { type: 꼴 }))
    a.download = `${이름}_3D.${끝}`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 60000)
  }
  const DXF3 = () => { if (!만듦) return; 받기(DXF만들기({ ...만듦.그, 면: [...만듦.세.면, 만듦.세.바닥] }), 'dxf', 'application/dxf'); 세기('|사진캐드|3D_DXF') }
  const OBJ = () => { if (!만듦) return; 받기(OBJ만들기(만듦.세, 이름), 'obj', 'text/plain'); 세기('|사진캐드|3D_OBJ') }
  return (
    <div className="card sc-3d">
      {!켬 ? (
        <div className="sc-row">
          <button type="button" className="btn line" style={{ width: 'auto' }} onClick={() => { set켬(true); 세기('|사진캐드|3D보기') }}>🧊 3D 로 보기</button>
          <span className="muted sm">벽 선을 높이만큼 세워 돌려 봅니다 · 3D DXF · OBJ 로 받기</span>
        </div>
      ) : (
        <>
          <div className="sc-row" style={{ alignItems: 'center' }}>
            <label className="sm" style={{ whiteSpace: 'nowrap' }}>벽 높이 <input className="inp" inputMode="numeric" style={{ width: 90, display: 'inline-block' }} value={높이} onChange={(e) => set높이(e.target.value)} /> mm</label>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 뷰.current && 만듦 && 맞춰보기(뷰.current, 만듦.보기.상자, 'tilt')}>비스듬히</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 뷰.current && 만듦 && 맞춰보기(뷰.current, 만듦.보기.상자, 'top')}>위에서</button>
            <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => set켬(false)}>닫기</button>
          </div>
          <canvas ref={캔} className="sc-3dcv" style={{ width: '100%', height: 'min(62vh, 460px)', display: 'block', borderRadius: 10, marginTop: 8, touchAction: 'none' }} />
          {!만듦 && <div className="muted sm">세울 벽 선이 없습니다.</div>}
          <div className="sc-row" style={{ marginTop: 8 }}>
            <button type="button" className="btn" style={{ width: 'auto' }} onClick={DXF3}>⬇ 3D DXF 받기</button>
            <button type="button" className="btn line" style={{ width: 'auto' }} onClick={OBJ}>⬇ OBJ 받기</button>
          </div>
          <div className="muted sm" style={{ marginTop: 6 }}>끌기 = 돌리기 · 두 손가락 · 오른쪽 끌기 = 옮기기 · 휠 · 벌리기 = 크게. 3D DXF 는 세운 벽(WALL3D · 3DFACE) · 바닥(FLOOR3D) + 원래 선 · 치수 그대로(AutoCAD · ZWCAD 3D 보기) · OBJ 는 스케치업 · 블렌더 · 맥스(mm). 벽 선을 그대로 세운 것이라 창 · 문 높이는 따로 없습니다.</div>
        </>
      )}
    </div>
  )
}

function 기본네모(w, h) { const m = Math.round(Math.min(w, h) * 0.02); return [[m, m], [w - m, m], [w - m, h - m], [m, h - m]] }

/* ───────── 모서리 고치기 판 ───────── */
function 모서리판({ 사진, 네모, set네모 }) {
  const 캔 = useRef(null)
  const 끄는 = useRef(-1)
  const [크기, set크기] = useState({ w: 600, h: 400 })
  const 감 = useRef(null)
  useEffect(() => {
    const el = 감.current; if (!el) return undefined
    const 재 = () => { const W = el.clientWidth || 600; const s = Math.min(W / 사진.보기.width, (window.innerHeight * 0.62) / 사진.보기.height); set크기({ w: Math.round(사진.보기.width * s), h: Math.round(사진.보기.height * s), s }) }
    재(); window.addEventListener('resize', 재); return () => window.removeEventListener('resize', 재)
  }, [사진])
  const 배 = () => (크기.s || 1) / 사진.보기배   // 처리 픽셀 → 화면 픽셀
  useEffect(() => {
    const c = 캔.current; if (!c || !네모) return
    const dpr = window.devicePixelRatio || 1
    c.width = 크기.w * dpr; c.height = 크기.h * dpr
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.drawImage(사진.보기, 0, 0, 크기.w, 크기.h)
    const k = 배()
    g.fillStyle = 'rgba(30,90,220,0.12)'; g.strokeStyle = '#1e5adc'; g.lineWidth = 2
    g.beginPath(); 네모.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.closePath(); g.fill(); g.stroke()
    네모.forEach(([x, y]) => { g.beginPath(); g.arc(x * k, y * k, 11, 0, 7); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill(); g.lineWidth = 3; g.stroke(); g.beginPath(); g.arc(x * k, y * k, 2.5, 0, 7); g.fillStyle = '#1e5adc'; g.fill() })
  }, [네모, 크기, 사진])   // eslint-disable-line react-hooks/exhaustive-deps
  const 자리 = (e) => { const r = 캔.current.getBoundingClientRect(); return [(e.clientX - r.left) / 배(), (e.clientY - r.top) / 배()] }
  return (
    <div ref={감} className="sc-corner">
      <canvas ref={캔} style={{ width: 크기.w, height: 크기.h, touchAction: 'none' }}
        onPointerDown={(e) => {
          const p = 자리(e); let 최 = Infinity, k = -1
          네모.forEach((q, i) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]) * 배(); if (d < 최) { 최 = d; k = i } })
          if (최 < 44) { 끄는.current = k; e.currentTarget.setPointerCapture(e.pointerId) }
        }}
        onPointerMove={(e) => {
          if (끄는.current < 0) return
          const p = 자리(e)
          p[0] = Math.max(0, Math.min(사진.w, p[0])); p[1] = Math.max(0, Math.min(사진.h, p[1]))
          set네모((Q) => Q.map((q, i) => (i === 끄는.current ? p : q)))
        }}
        onPointerUp={() => { 끄는.current = -1 }} />
    </div>
  )
}

/* ───────── 결과 판 (끌어 옮기기 · 크게 · 누르기) ───────── */
const 아래칸 = 46
const 좁음 = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 640px)').matches   // styles.css .sc-zoom 와 같은 문턱
function 결과판({ 결과, 미리, 풀이, 고른선, 고른숫자, 보기켬, 누름 }) {
  const 캔 = useRef(null), 감 = useRef(null)
  const 뷰 = useRef(null)       // { s, ox, oy } — 화면 = (반듯한 판 좌표 − o) × s
  const 손 = useRef(new Map())
  const 끔 = useRef(null)
  const [크기, set크기] = useState({ w: 600, h: 420 })
  const [그림판] = useState(() => document.createElement('canvas'))
  const [, 다시] = useState(0)
  useEffect(() => {
    그림판.width = 미리.w; 그림판.height = 미리.h
    const g = 그림판.getContext('2d'); const im = g.createImageData(미리.w, 미리.h)
    for (let i = 0; i < 미리.d.length; i++) { const v = 미리.d[i]; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255 }
    g.putImageData(im, 0, 0); 다시((n) => n + 1)
  }, [미리])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = 감.current; if (!el) return undefined
    const 재 = () => { const W = el.clientWidth || 600; const H = Math.round(Math.min(window.innerHeight * 0.66, Math.max(300, W * (결과.h / 결과.w)))) + (좁음() ? 아래칸 : 0); 뷰.current = 맞춤뷰(W, H); set크기({ w: W, h: H }) }
    재(); window.addEventListener('resize', 재); return () => window.removeEventListener('resize', 재)
  }, [결과])
  /* 뷰는 그리기 · 누르기 전에 늘 있어야 함(없으면 판 전체가 보이게 맞춤) — 크기가 바뀔 때도 그 자리에서 새로 맞춤 */
  /* 폰(좁은 화면)은 아래에 크게 · 작게 단추 줄(아래칸)을 두고 그림은 그 위에만 — 단추가 그림을 가리지 않게 */
  function 맞춤뷰(w, h) {
    // 건물 정면은 오른쪽 · 아래에 자동 치수가 붙으므로 그만큼 넓게 봄
    const 덤 = 결과.건물 ? 1.16 : 1, bw = 결과.w * 덤, bh = 결과.h * 덤
    const hh = h - (좁음() ? 아래칸 : 0); const s = Math.min(w / bw, hh / bh) * 0.98; return { s, ox: (bw - w / s) / 2, oy: (bh - hh / s) / 2 }
  }
  if (!뷰.current && 크기.w) 뷰.current = 맞춤뷰(크기.w, 크기.h)
  const θ = (결과.돌림각 || 0) * Math.PI / 180, c = 결과.가운데 || [결과.w / 2, 결과.h / 2]
  const 그리기 = () => {
    const cv = 캔.current; if (!cv) return
    const dpr = window.devicePixelRatio || 1
    cv.width = 크기.w * dpr; cv.height = 크기.h * dpr
    const g = cv.getContext('2d')
    if (!뷰.current) 뷰.current = 맞춤뷰(크기.w, 크기.h)
    const { s, ox, oy } = 뷰.current
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#fff'; g.fillRect(0, 0, 크기.w, 크기.h)
    g.setTransform(dpr * s, 0, 0, dpr * s, -ox * s * dpr, -oy * s * dpr)
    if (보기켬.사진) {
      g.save(); g.globalAlpha = 0.42
      g.translate(c[0], c[1]); g.rotate(-θ); g.translate(-c[0], -c[1])
      g.drawImage(그림판, 0, 0, 결과.w, 결과.h)
      g.restore()
    }
    const 선굵 = Math.max(1.4, 2.2 / s) , 한px = 1 / s
    // 글씨 그림
    if (보기켬.글씨) { g.strokeStyle = '#2a9d4b'; g.lineWidth = 1.4 * 한px; for (const pl of 결과.글씨줄 || []) { g.beginPath(); pl.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke() } }
    const 원래치수선 = new Set(풀이.치수들.filter((d) => d.쓰임 && !d.손넣음 && d.선 >= 0).flatMap((d) => (d.선2 >= 0 ? [d.선, d.선2] : [d.선])))
    결과.도형.forEach((sh, i) => {
      if (sh.지움) return
      const 골 = i === 고른선
      g.strokeStyle = 골 ? '#ff7a00' : sh.점선 ? '#888' : (!결과.손그림 && 원래치수선.has(i)) ? '#9aa4b4' : '#1446c8'
      g.lineWidth = (골 ? 2.4 : 1) * 선굵
      g.setLineDash(sh.점선 ? [8 * 한px, 5 * 한px] : [])
      g.beginPath()
      if (sh.t === 'L') { g.moveTo(sh.a[0], sh.a[1]); g.lineTo(sh.b[0], sh.b[1]) }
      else if (sh.t === 'C') g.arc(sh.c[0], sh.c[1], sh.r, 0, Math.PI * 2)
      else g.arc(sh.c[0], sh.c[1], sh.r, Math.min(sh.a0, sh.a1), Math.max(sh.a0, sh.a1))
      g.stroke()
    })
    g.setLineDash([])
    // 치수 숫자 딱지
    if (보기켬.치수) {
      g.font = `${Math.max(11, 13) * 한px}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'
      for (const d of 풀이.치수들) {
        if (d.손넣음 || d.숫자 == null || d.치수아님) continue
        const n = 결과.숫자[d.숫자]; if (!n) continue
        const 색 = !d.쓰임 ? '#d1342b' : ((d.믿음 ?? 1) < 0.6 && !d.확인 && !d.사람) ? '#e0a100' : '#1a9b47'
        const 글 = 쉼(d.mm ?? d.값)   // 딱지는 늘 mm(«0.8m» 도 800)
        const w = g.measureText(글).width + 10 * 한px, h = 18 * 한px
        g.fillStyle = 색; g.globalAlpha = d.번호 === 고른숫자 ? 1 : 0.88
        const x = n.c[0], y = n.c[1]
        g.beginPath(); g.roundRect ? g.roundRect(x - w / 2, y - h / 2, w, h, 5 * 한px) : g.rect(x - w / 2, y - h / 2, w, h); g.fill()
        g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillText(글, x, y + 0.5 * 한px)
        d._딱지 = [x - w / 2, y - h / 2, x + w / 2, y + h / 2]
      }
      // 🏢 건물 정면 자동 치수(창 · 문 자리 줄 + 전체) — 치수선 · 눈금 · 숫자
      g.strokeStyle = '#7b3fe4'; g.fillStyle = '#7b3fe4'; g.lineWidth = 1.2 * 한px
      for (const d of 풀이.치수들) {
        if (!d.건물자동) continue
        const 눈 = 5 * 한px
        g.beginPath()
        if (d.꼴 === 'H') {
          g.moveTo(d.a, d.선자리); g.lineTo(d.b, d.선자리)
          for (const x of [d.a, d.b]) { g.moveTo(x, d.줄); g.lineTo(x, d.선자리 + 눈); g.moveTo(x - 눈, d.선자리 + 눈); g.lineTo(x + 눈, d.선자리 - 눈) }
        } else {
          g.moveTo(d.선자리, d.a); g.lineTo(d.선자리, d.b)
          for (const y of [d.a, d.b]) { g.moveTo(d.줄, y); g.lineTo(d.선자리 + 눈, y); g.moveTo(d.선자리 - 눈, y + 눈); g.lineTo(d.선자리 + 눈, y - 눈) }
        }
        g.stroke()
        const 글 = 쉼(Math.round(d.mm))
        if (Math.abs(d.b - d.a) < g.measureText(글).width + 4 * 한px) continue   // 칸이 글보다 좁으면 화면엔 숫자를 안 씀(DXF 엔 있음)
        if (d.꼴 === 'H') g.fillText(글, (d.a + d.b) / 2, d.선자리 - 8 * 한px)
        else { g.save(); g.translate(d.선자리 - 8 * 한px, (d.a + d.b) / 2); g.rotate(-Math.PI / 2); g.fillText(글, 0, 0); g.restore() }
      }
      // 사람이 넣은 길이
      g.fillStyle = '#ff7a00'
      for (const d of 풀이.치수들) {
        if (!d.손넣음 || d.선 < 0) continue
        const sh = 결과.도형[d.선]; if (!sh) continue
        const x = (sh.a[0] + sh.b[0]) / 2, y = (sh.a[1] + sh.b[1]) / 2
        g.fillText('✎ ' + 쉼(d.mm), x, y - 12 * 한px)
      }
    }
  }
  useEffect(() => { 그리기() })
  const 판자리 = (e) => { const r = 캔.current.getBoundingClientRect(); const { s, ox, oy } = 뷰.current; return [(e.clientX - r.left) / s + ox, (e.clientY - r.top) / s + oy] }
  const 찾기 = (p, 손가락) => {
    const { s } = 뷰.current
    for (const d of 풀이.치수들) { const b = d._딱지; if (b && p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3]) return { 숫자: d.번호 } }
    let 최 = (손가락 ? 22 : 14) / s, k = null   // 손가락은 마우스보다 넓게 집음
    결과.도형.forEach((sh, i) => {
      if (sh.지움 || sh.t !== 'L') return
      const dx = sh.b[0] - sh.a[0], dy = sh.b[1] - sh.a[1], L2 = dx * dx + dy * dy
      let t = L2 ? ((p[0] - sh.a[0]) * dx + (p[1] - sh.a[1]) * dy) / L2 : 0; t = Math.max(0, Math.min(1, t))
      const d = Math.hypot(p[0] - sh.a[0] - t * dx, p[1] - sh.a[1] - t * dy)
      if (d < 최) { 최 = d; k = i }
    })
    return k != null ? { 선: k } : null
  }
  const 크게 = (sx, sy, 배) => {
    const v = 뷰.current
    const 새s = Math.max(0.05, Math.min(40, v.s * 배))
    const px = sx / v.s + v.ox, py = sy / v.s + v.oy
    뷰.current = { s: 새s, ox: px - sx / 새s, oy: py - sy / 새s }
    그리기()
  }
  return (
    <div ref={감} className="sc-view">
      <canvas ref={캔} style={{ width: 크기.w, height: 크기.h, touchAction: 'none' }}
        onWheel={(e) => { e.preventDefault(); const r = 캔.current.getBoundingClientRect(); 크게(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15) }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); 손.current.set(e.pointerId, [e.clientX, e.clientY]); 끔.current = { x: e.clientX, y: e.clientY, 움직임: 0, 둘: 손.current.size > 1 } }}
        onPointerMove={(e) => {
          if (!손.current.has(e.pointerId)) return
          const 앞 = 손.current.get(e.pointerId)
          if (손.current.size >= 2) {
            const [a, b] = [...손.current.values()]
            const 전 = Math.hypot(a[0] - b[0], a[1] - b[1])
            손.current.set(e.pointerId, [e.clientX, e.clientY])
            const [a2, b2] = [...손.current.values()]
            const 후 = Math.hypot(a2[0] - b2[0], a2[1] - b2[1])
            const r = 캔.current.getBoundingClientRect()
            if (전 > 0) 크게((a2[0] + b2[0]) / 2 - r.left, (a2[1] + b2[1]) / 2 - r.top, 후 / 전)
            if (끔.current) { 끔.current.둘 = true; 끔.current.움직임 += 99 }
            return
          }
          손.current.set(e.pointerId, [e.clientX, e.clientY])
          const dx = e.clientX - 앞[0], dy = e.clientY - 앞[1]
          if (끔.current) 끔.current.움직임 += Math.abs(dx) + Math.abs(dy)
          if (끔.current && 끔.current.움직임 > 5) { const v = 뷰.current; 뷰.current = { ...v, ox: v.ox - dx / v.s, oy: v.oy - dy / v.s }; 그리기() }
        }}
        onPointerUp={(e) => {
          손.current.delete(e.pointerId)
          const k = 끔.current
          if (k && !k.둘 && k.움직임 <= 5 && 손.current.size === 0) 누름(찾기(판자리(e), e.pointerType === 'touch'))
          if (손.current.size === 0) 끔.current = null
        }}
        onPointerCancel={(e) => { 손.current.delete(e.pointerId); if (!손.current.size) 끔.current = null }} />
      <div className="sc-zoom">
        <button type="button" onClick={() => 크게(크기.w / 2, 크기.h / 2, 1.4)} aria-label="크게">＋</button>
        <button type="button" onClick={() => 크게(크기.w / 2, 크기.h / 2, 1 / 1.4)} aria-label="작게">－</button>
        <button type="button" onClick={() => { 뷰.current = null; 다시((n) => n + 1) }} aria-label="전체">⤢</button>
      </div>
    </div>
  )
}
