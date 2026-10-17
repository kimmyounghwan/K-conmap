/**
 * /tools/sigong — 📑 시공계획서 자동 만들기 (G300 · 2026-10-16)
 *
 * 소장님: 「다 해주고, 공사 설명서나 내역서를 넣으면 자동으로 만들 주면 좋을 것 같아 … 모든 서류를 … 최대한 편하면서, 간편하게」
 *         「견본있으니까 거기에 맞춰 서류가 자동으로 만들어 져야 해 … 무료이면서, 최대한 깔끔하게」
 *         (고르심) 화면 = 새 화면 + 원클릭 연결 · 안전관리계획서 등도 «우선은 이용가능» · 「도면 및 내역서, 공사관련 자료를 업로드 시켜 주면 서류가 완성되게」
 *
 * ■ 한 화면: ① 올리기(내역서 · 공사설명서 PDF · 도면 · 사진 한꺼번에) → ② 읽은 것 확인(공사 정보 · 공종) → ③ 미리보기 · 내려받기(PDF · 한글 · 워드 · 엑셀)
 * ■ 셈 · 글: lib/시공계획.js · 시공계획틀.js · 쪽흐름.js → 쪽pdf · 쪽한글 · 쪽워드 · 쪽엑셀
 * ■ 파일은 브라우저 밖으로 나가지 않습니다. 적은 공사 정보만 이 브라우저에 남습니다(kcm.sigong.v1).
 * 📊 세기(안 보임): |시공계획|내역 · |시공계획|설명서 · |시공계획|그림 · |시공계획|예시 · |시공계획|PDF · |시공계획|한글 · |시공계획|워드 · |시공계획|엑셀 · |시공계획|원클릭
 *                   · |시공계획|잠금(잠긴 채 올리기 · 받기를 누름) · |시공계획|열쇠(열쇠말로 엶)
 *
 * 🔒 2026-10-16 소장님: 「우선 올리고 나만 사용할 수 있게 막아둬. 이용자가 볼 수는 있지만, 사용은 못하게 해줘. 단 예시는 볼 수있게 해주고…」
 *   · 소장님 브라우저(lib/운영자.js 나운영자) 또는 열쇠말(lib/gate.js — 적산 실험실과 같은 열쇠말)이면 다 씀.
 *   · 그 밖의 분: 화면 · 설명은 다 보이고, 🧪 예시 내역서로 만든 시공계획서를 미리보기로 넘겨 볼 수 있음.
 *     내 파일 올리기 · 받기(PDF · 한글 · 워드 · 엑셀) · 원클릭 넘기기 · 칸 고치기는 잠김(«준비 중»).
 *   ⚠️ 문 앞 잠금일 뿐입니다(gate.js 머리말) — 화면 코드는 누구나 받을 수 있습니다. 열 때는 이 «씀» 조건만 풀면 됩니다.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 끌어놓기 as 끌어놓기판 } from '../끌어놓기.jsx'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import { 현장나눔 } from '../lib/현장나눔.js'
import { 글맞춤 } from '../lib/쪽문서.js'
import { Row } from '../tools/calcs.jsx'
import { isOpen, tryOpen } from '../lib/gate.js'
import { 나운영자 } from '../lib/운영자.js'

const 남김열쇠 = 'kcm.sigong.v1'
const 엑셀꼴 = /\.(xlsx|xlsm|xls)$/i
const 그림꼴 = /\.(jpe?g|png|webp|gif|bmp)$/i
const PDF꼴 = /\.pdf$/i
const 숨 = () => new Promise((r) => setTimeout(r, 20))
const 오늘달 = () => { const d = new Date(Date.now() + 9 * 3600e3); return `${d.getUTCFullYear()}. ${String(d.getUTCMonth() + 1).padStart(2, '0')}.` }
const 날더하기 = (t, n) => { const d = new Date(t + 'T00:00:00Z'); if (Number.isNaN(+d)) return ''; d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const 날수 = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 86400000) + 1 : 0)
const 공종표시 = { 토공: '토공', 철거: '기존구조물 철거', 자립식: '자립식 가시설', 구조물: '구조물공', 조경: '조경공사', 흙막이: '흙막이 가시설', PHC: 'PHC파일' }
/* [열쇠, 이름, 그 공종을 넣었을 때만, 시공계획서 어디에 들어가나, 무엇을 올리면 좋은가] */
const 그림자리들 = [
  ['철거현황', '철거 구간 평면 · 단면도', '철거', '5장 공종별 › 기존구조물 철거 › 기존구조물 현황 및 철거위치', '철거할 구조물이 표시된 평면도 · 단면도'],
  ['자립식위치', '자립식 가시설 위치도', '자립식', '5장 공종별 › 자립식 가시설 › 공사위치', '가시설 설치 구간이 보이는 평면도'],
  ['타설계획도', '타설 계획도', '구조물', '5장 공종별 › 구조물공사 › 타설 계획', '구조도 · 시공상세도(타설 구획이 보이는 것)'],
  ['말뚝배치도', '말뚝 배치도', 'PHC', '5장 공종별 › PHC파일 시공계획 끝(항타기록부 앞)', '파일 배치도(말뚝 번호가 보이는 것)'],
  ['신호수배치', '신호수 배치계획도', '', '7장 안전관리계획 › 신호수 배치계획', '현장 배치도 · 장비 동선도'],
  ['교통처리', '교통처리 계획도', '', '9장 교통처리계획 › 교통처리 계획도', '현장 배치도 · 우회도로 · 안내표지 계획도'],
]
const 기본셈 = { 노임: 230000, 가동률: 0.7, 회당: 60 }
const 형식표 = {
  pdf: ['PDF', 'application/pdf', '.pdf'],
  hwpx: ['한글', 'application/hwp+zip', '.hwpx'],
  docx: ['워드', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  xlsx: ['엑셀', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
}
const 세기이름 = { pdf: 'PDF', hwpx: '한글', docx: '워드', xlsx: '엑셀' }

function 읽(k, 기본) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? 기본 } catch { return 기본 } }
function 쓰(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* 가득 참 · 사생활 보호 */ } }
function 저장하기(이름, 바이트, 타입) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(new Blob([바이트], { type: 타입 }))
  a.href = url; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
/** 사진 · 그림 파일 → JPEG(긴 변 1800px) */
async function 그림줄이기(f, 최대 = 1800) {
  const bmp = await createImageBitmap(f)
  const r = Math.min(1, 최대 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  const b = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.86))
  return { 바이트: new Uint8Array(await b.arrayBuffer()), w: c.width, h: c.height }
}

/* ══════════════ 쪽 그림(SVG) — PDF 와 같은 칸 · 글 · 선 ══════════════ */
const 그림주소표 = new WeakMap()
function 그림주소(g) {
  if (!g) return ''
  let u = 그림주소표.get(g)
  if (!u) { u = URL.createObjectURL(new Blob([g.바이트], { type: 'image/jpeg' })); 그림주소표.set(g, u) }
  return u
}
function 쪽그림({ 쪽, 폭px, 그림들 }) {
  const 맞춤들 = useMemo(() => 쪽.칸들.map((k) => (k.글 ? 글맞춤(k.글, k.w, k.h, k.크기 || 9, !!k.굵게) : null)), [쪽])
  const 높px = (쪽.높이 / 쪽.폭) * 폭px
  return (
    <svg className="sg-page" width={폭px} height={높px} viewBox={`0 0 ${쪽.폭} ${쪽.높이}`} role="img" aria-label="미리보기 쪽">
      <rect x="0" y="0" width={쪽.폭} height={쪽.높이} fill="#fff" />
      {쪽.칸들.map((k, i) => k.바탕 ? <rect key={'b' + i} x={k.x} y={k.y} width={k.w} height={k.h} fill={k.바탕} /> : null)}
      {쪽.칸들.map((k, i) => {
        if (!k.그림) return null
        const g = 그림들.get(k.그림)
        if (!g) return null
        return <image key={'g' + i} href={그림주소(g)} x={k.x + 1} y={k.y + 1} width={k.w - 2} height={k.h - 2} preserveAspectRatio="xMidYMid meet" />
      })}
      {쪽.칸들.map((k, i) => {
        const m = 맞춤들[i]
        if (!m || !m.줄들.length) return null
        const 크 = m.크기 * 0.3528, 줄높 = 크 * 1.22
        const 위 = k.y + (k.h - 줄높 * m.줄들.length) / 2
        const x = k.정렬 === '왼' ? k.x + 0.8 : k.정렬 === '오' ? k.x + k.w - 0.8 : k.x + k.w / 2
        const 앵커 = k.정렬 === '왼' ? 'start' : k.정렬 === '오' ? 'end' : 'middle'
        return (
          <text key={'t' + i} fontSize={크} fontWeight={k.굵게 ? 700 : 400} fill={k.색 || '#111'} textAnchor={앵커}>
            {m.줄들.map((줄, j) => <tspan key={j} x={x} y={위 + (j + 0.5) * 줄높 + 크 * 0.34}>{줄}</tspan>)}
          </text>
        )
      })}
      {쪽.칸들.map((k, i) => k.테 ? <rect key={'r' + i} x={k.x} y={k.y} width={k.w} height={k.h} fill="none" stroke={k.선색 || '#333'} strokeWidth={k.굵은테 ? 0.38 : 0.18} /> : null)}
      {(쪽.선들 || []).map((s, i) => (
        <polyline key={'s' + i} points={(s.점들 || []).map((p) => p.join(',')).join(' ')} fill="none" stroke={s.색 || '#333'} strokeWidth={(s.굵기 || 0.6) * 0.3528} strokeDasharray={s.점선 ? '0.8 0.6' : undefined} />
      ))}
      {(쪽.원들 || []).map((o, i) => <circle key={'c' + i} cx={o.x} cy={o.y} r={o.r} fill={o.바탕 || 'none'} stroke={o.색 || '#333'} strokeWidth={(o.굵기 || 0.6) * 0.3528} />)}
    </svg>
  )
}

/* ══════════════ 화면 ══════════════ */
export default function SigongPlan() {
  const 이동 = useNavigate()
  const 남은 = useMemo(() => 읽(남김열쇠, {}), [])
  const [lib, setLib] = useState(null)
  const [내역, set내역] = useState(null)          // { 이름, 자료 }
  const [설명서, set설명서] = useState(null)      // { 이름, 찾음 }
  const [공사, set공사] = useState(() => ({ 공사명: '', 위치: '', 발주처: '', 감독기관: '', 시공자: '', 착공: '', 준공: '', 작성일: 오늘달(), 목적: '', ...(남은.공사 || {}) }))
  const [사람, set사람] = useState(() => ({ 현장대리인: '', 공무: '', 공사: '', 품질: '', 안전: '', ...(남은.사람 || {}) }))
  const [설정, set설정] = useState(() => ({ 노임: 230000, 가동률: 0.7, 회당: 60, ...(남은.설정 || {}) }))
  const [고른, set고른] = useState(null)            // null = 내역서대로
  const [공정고침, set공정고침] = useState(null)    // null = 자동
  const [크레인, set크레인] = useState(() => 남은.크레인 || [{ 부재: '', 규격: '', 반경: '', 정격: '' }])
  const [그림들, set그림들] = useState(() => new Map())
  const [그림자리, set그림자리] = useState({})
  const [사진들, set사진들] = useState([])
  const [바쁨, set바쁨] = useState('')
  const [말, set말] = useState([])
  const [오류, set오류] = useState('')
  const [쪽번, set쪽번] = useState(0)
  const [내림중, set내림중] = useState('')
  const 칸 = useRef(null)
  const 틀칸 = useRef(null)
  const 폭틀 = useRef(null)
  const [폭, set폭] = useState(560)
  /* 🔒 씀 = 소장님 브라우저 · 열쇠말을 넣은 브라우저 */
  const [씀, set씀] = useState(() => isOpen())
  const [예시봄, set예시봄] = useState(false)
  const [잠금말, set잠금말] = useState('')
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  useEffect(() => {
    let 살 = true
    나운영자().then((v) => { if (살 && v) set씀(true) }).catch(() => {})
    return () => { 살 = false }
  }, [])
  const 잠김 = (무엇) => { set잠금말(`🔒 ${무엇} 지금 준비 중입니다 — 🧪 예시로 어떻게 나오는지 보실 수 있습니다.`); 세기('|시공계획|잠금') }

  useEffect(() => { if (씀) 쓰(남김열쇠, { 공사, 사람, 설정, 크레인 }) }, [씀, 공사, 사람, 설정, 크레인])
  useEffect(() => {
    const el = 폭틀.current
    if (!el) return undefined
    const 재기 = () => set폭(Math.max(260, Math.min(820, el.clientWidth - 4)))
    재기()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(재기) : null
    if (ro) ro.observe(el); else window.addEventListener('resize', 재기)
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', 재기) }
  }, [lib])
  /* 원클릭에 적어 둔 공사 정보가 있으면 빈 칸만 채움(쓸 수 있는 브라우저만) */
  useEffect(() => {
    if (!씀) return
    try {
      const 나 = 현장나눔('wc')
      const v = JSON.parse(localStorage.getItem(나.열쇠('kcm.wonclick.v1', 나.지금())) || 'null')
      if (!v) return
      set공사((g) => ({
        ...g, 공사명: g.공사명 || v.공사명 || '', 위치: g.위치 || v.현장위치 || '', 발주처: g.발주처 || v.발주기관 || '',
        시공자: g.시공자 || v.상호 || '', 착공: g.착공 || (/^\d{4}-\d{2}-\d{2}$/.test(v.착공일 || '') ? v.착공일 : ''),
        준공: g.준공 || (/^\d{4}-\d{2}-\d{2}$/.test(v.준공기한 || '') ? v.준공기한 : ''),
      }))
      set사람((s) => ({ ...s, 현장대리인: s.현장대리인 || v.대리인 || '' }))
    } catch { /* 지나감 */ }
  }, [씀])

  useEffect(() => { 싣기().catch(() => {}) }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  const 싣기 = async () => {
    if (lib) return lib
    const [q, s] = await Promise.all([import('../lib/qtoxlsx.js'), import('../lib/시공계획.js')])
    const m = { readWorkbook: q.readWorkbook, ...s }
    setLib(m)
    return m
  }

  /* 내역서 · 설명서에서 읽은 것 → 빈 칸만 채움(적은 것은 그대로) */
  const 채우기 = (찾음, 공기일) => {
    set공사((g) => {
      const n = { ...g }
      if (!n.공사명 && 찾음.공사명) n.공사명 = 찾음.공사명
      if (!n.위치 && 찾음.위치) n.위치 = 찾음.위치
      if (!n.발주처 && 찾음.발주처) n.발주처 = 찾음.발주처
      if (!n.목적 && 찾음.목적) n.목적 = 찾음.목적
      if (n.착공 && !n.준공 && 공기일) n.준공 = 날더하기(n.착공, 공기일 - 1)
      return n
    })
  }

  const 받기 = async (fs, 예시로 = false) => {
    const 파일들 = [...(fs || [])]
    if (!파일들.length) return
    if (!씀 && !예시로) { 잠김('내 파일 올리기는'); return }
    set오류(''); set바쁨('읽는 중입니다…'); await 숨()
    const 새말 = []
    try {
      const m = await 싣기()
      for (const f of 파일들) {
        if (엑셀꼴.test(f.name)) {
          set바쁨(`${f.name} — 내역서를 읽는 중…`); await 숨()
          try {
            const 책 = m.readWorkbook(new Uint8Array(await f.arrayBuffer()))
            const 자료 = m.내역읽기(책, f.name)
            set내역({ 이름: f.name, 자료 }); set고른(null); set공정고침(null)
            채우기(자료.머리, 자료.머리.공기일)
            새말.push(`📊 ${f.name} — 품목 ${자료.품목들.length}개${자료.금액있음 ? '' : ' (금액이 없는 공내역서 — 보할은 품목 수로 나눕니다)'}`)
            세기('|시공계획|내역')
          } catch (e) { 새말.push(`⚠️ ${f.name} — ${e?.message || '내역서를 읽지 못했습니다'}`) }
        } else if (PDF꼴.test(f.name)) {
          set바쁨(`${f.name} — PDF 를 읽는 중…`); await 숨()
          try {
            const p = await import('../lib/pdfwork.js')
            const 글 = await p.글모두(f)
            const 찾음 = m.설명서읽기(글)
            const 쓸만 = 찾음.공사명 || 찾음.공기일 || 찾음.위치
            if (쓸만) { set설명서({ 이름: f.name, 찾음 }); 채우기(찾음, 찾음.공기일); 새말.push(`📄 ${f.name} — 공사설명서로 읽음(${[찾음.공사명 && '공사명', 찾음.위치 && '위치', 찾음.공기글 && '공기 ' + 찾음.공기글, 찾음.발주처 && '발주처'].filter(Boolean).join(' · ')})`); 세기('|시공계획|설명서') }
            else {
              const g = await p.첫쪽JPEG(f)
              const 열쇠 = 'p' + Date.now() + Math.random().toString(36).slice(2, 6)
              set그림들((old) => new Map(old).set(열쇠, { ...g, 이름: f.name }))
              새말.push(`🖼 ${f.name} — 도면(첫 쪽)을 그림으로 받았습니다. 아래 «도면 · 사진» 에서 자리를 고르십시오.`)
              세기('|시공계획|그림')
            }
          } catch (e) { 새말.push(`⚠️ ${f.name} — ${e?.message || 'PDF 를 읽지 못했습니다'}`) }
        } else if (그림꼴.test(f.name)) {
          try {
            const g = await 그림줄이기(f)
            const 열쇠 = 'g' + Date.now() + Math.random().toString(36).slice(2, 6)
            set그림들((old) => new Map(old).set(열쇠, { ...g, 이름: f.name }))
            새말.push(`🖼 ${f.name} — 그림으로 받았습니다(착공사진 또는 도면 자리에 넣을 수 있음)`)
            세기('|시공계획|그림')
          } catch (e) { 새말.push(`⚠️ ${f.name} — 그림을 열지 못했습니다`) }
        } else 새말.push(`⚠️ ${f.name} — 엑셀 · PDF · 그림(JPG · PNG)만 받습니다`)
      }
    } catch (e) { set오류(e?.message || '읽지 못했습니다') } finally { set바쁨(''); set말((old) => [...새말, ...old].slice(0, 12)) }
  }
  const 예시 = async () => {
    set바쁨('예시 내역서를 여는 중…')
    try {
      const r = await fetch('/sigong/예시_내역서.xlsx')
      if (!r.ok) throw new Error('예시 파일을 받지 못했습니다')
      const b = await r.arrayBuffer()
      set공사((g) => ({ ...g, 착공: g.착공 || 날더하기(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), 14) }))
      await 받기([{ name: '예시_내역서.xlsx', arrayBuffer: async () => b }], true)
      set예시봄(true); set잠금말('')
      세기('|시공계획|예시')
    } catch (e) { set오류(e?.message || '예시를 열지 못했습니다'); set바쁨('') }
  }

  /* 착공을 넣었고 공기를 알면 준공 저절로 */
  useEffect(() => {
    const 공기 = 내역?.자료?.머리?.공기일 || 설명서?.찾음?.공기일
    if (공사.착공 && !공사.준공 && 공기) set공사((g) => ({ ...g, 준공: 날더하기(g.착공, 공기 - 1) }))
  }, [공사.착공])   // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 만들기 (적는 동안은 잠깐 기다렸다가) */
  const 입력 = useMemo(() => ({
    공사, 사람, 자료: 내역?.자료 || null, 공정줄: 공정고침, 고른: 고른 || undefined, 설정, 크레인, 그림자리, 사진들,
  }), [공사, 사람, 내역, 공정고침, 고른, 설정, 크레인, 그림자리, 사진들])
  const [늦은입력, set늦은입력] = useState(입력)
  useEffect(() => { const t = setTimeout(() => set늦은입력(입력), 350); return () => clearTimeout(t) }, [입력])
  const 결과 = useMemo(() => {
    if (!lib) return null
    try { return lib.시공계획만들기(늦은입력) } catch (e) { return { 오류: e?.message || String(e) } }
  }, [lib, 늦은입력])
  const 쪽들 = 결과?.쪽들 || []
  useEffect(() => { if (쪽번 >= 쪽들.length) set쪽번(Math.max(0, 쪽들.length - 1)) }, [쪽들.length])   // eslint-disable-line react-hooks/exhaustive-deps

  const 내려받기 = async (형식) => {
    if (!씀) { 잠김(형식표[형식][0] + ' 받기는'); return }
    if (!쪽들.length) return
    const [이름, 타입, 끝] = 형식표[형식]
    set내림중(이름); await 숨()
    try {
      let 바이트
      if (형식 === 'pdf') { const m = await import('../lib/쪽pdf.js'); 바이트 = await m.쪽들PDF(쪽들, 그림들, { 제목: (공사.공사명 || '') + ' 시공계획서' }) }
      else if (형식 === 'hwpx') { const m = await import('../lib/쪽한글.js'); 바이트 = m.쪽들한글(쪽들, 그림들, { 제목: '시공계획서' }) }
      else if (형식 === 'docx') { const m = await import('../lib/쪽워드.js'); 바이트 = m.쪽들워드(쪽들, 그림들, { 제목: '시공계획서' }) }
      else {
        /* 엑셀은 용지(세로 · 가로)가 바뀌는 곳마다 시트를 나눔 — 한 시트에 섞으면 칸 너비가 어긋남 */
        const m = await import('../lib/쪽엑셀.js')
        const 무리 = []
        for (const p of 쪽들) { const 가 = p.폭 > p.높이; if (!무리.length || 무리[무리.length - 1].가 !== 가) 무리.push({ 가, 쪽들: [] }); 무리[무리.length - 1].쪽들.push(p) }
        바이트 = m.엑셀책(무리.map((g, i) => m.쪽들시트(g.쪽들, 그림들, 무리.length > 1 ? `${i + 1} ${g.가 ? '공정·투입(가로)' : '시공계획서'}` : '시공계획서')), 그림들)
      }
      const 파일이름 = String((공사.공사명 || '공사') + '_시공계획서').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, '_').slice(0, 60) + 끝
      저장하기(파일이름, 바이트, 타입)
      세기('|시공계획|' + 세기이름[형식])
    } catch (e) { set오류(`${이름} 만들기 실패 — ${e?.message || e}`) } finally { set내림중('') }
  }

  const 원클릭에 = () => {
    if (!씀) { 잠김('착공서류(원클릭)로 넘기기는'); return }
    try {
      const 나 = 현장나눔('wc')
      const 키 = 나.열쇠('kcm.wonclick.v1', 나.지금())
      const v = JSON.parse(localStorage.getItem(키) || '{}') || {}
      const 채 = (k, val) => { if (val && !v[k]) v[k] = val }
      채('공사명', 공사.공사명); 채('현장위치', 공사.위치); 채('발주기관', 공사.발주처); 채('상호', 공사.시공자)
      채('착공일', 공사.착공); 채('준공기한', 공사.준공); 채('대리인', 사람.현장대리인)
      채('공사개요', (결과?.줄들 || []).map((r) => r.이름).slice(0, 6).join(', '))
      localStorage.setItem(키, JSON.stringify(v))
      세기('|시공계획|원클릭')
    } catch { /* 지나감 */ }
    이동('/tools/wonclick')
  }

  const 자료 = 내역?.자료
  const 모 = useMemo(() => (lib && 자료 ? lib.갈래모음(자료.품목들.filter((p) => !p.관급)) : {}), [lib, 자료])
  const 총액 = useMemo(() => (자료 ? 자료.품목들.filter((p) => !p.관급).reduce((s, p) => s + p.금액, 0) : 0), [자료])
  const 지금고른 = 결과?.고른 || {}
  const 그림목록 = [...그림들.entries()]
  const 공정줄화면 = 결과?.줄들 || []
  const 공기 = 날수(공사.착공, 공사.준공)
  const 쪽 = 쪽들[쪽번]
  const 칸고침 = (k) => (e) => set공사((g) => ({ ...g, [k]: e.target.value }))
  /* 그림 자리마다 미리보기 몇 쪽에 있나 — «👁 그 쪽 보기» */
  const 자리쪽 = useMemo(() => {
    const m = {}
    쪽들.forEach((p, i) => p.칸들.forEach((c) => { if (c.자리 && !(c.자리 in m)) m[c.자리] = i }))
    return m
  }, [쪽들])
  const 쪽으로 = (i) => { set쪽번(i); setTimeout(() => 폭틀.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60) }
  /* 셈 기준이 지금 표에 어떻게 들어갔나(보여 주기만) */
  const 셈보기 = useMemo(() => {
    const 노무비 = (결과?.줄들 || []).reduce((t, r) => t + (r.무게만 ? 0 : (r.노무비 || 0)), 0)
    const 인원 = (결과?.투입?.인원 || []).reduce((t, r) => t + (r.계 || 0), 0)
    const 반장 = (결과?.투입?.인원 || []).find((r) => r.이름 === '작업반장')?.계 || 0
    const 펌프 = (결과?.투입?.장비 || []).find((r) => /펌프카/.test(r.이름))?.계 || 0
    const 레미콘 = 결과?.설정?.레미콘 || 0
    return { 노무비, 인원, 반장, 펌프, 레미콘, 일하는날: Math.round(공기 * (설정.가동률 || 0)) }
  }, [결과, 공기, 설정.가동률])

  return (
    <>
      <div className="card lead-card">
        <h1 style={{ margin: 0, fontSize: 20 }}>📑 시공계획서 자동 만들기</h1>
        <p className="why2" style={{ marginBottom: 6 }}>
          <b>내역서(엑셀)</b>를 올리면 공사개요 · 현장조직표 · <b>예정공정표(S커브)</b> · 인원 · 장비 · <b>관급자재 수급계획</b> · 공종별 시공계획(토공 · 철거 · 가시설 · 구조물 · 조경 · 흙막이 · PHC 파일 — 내역서에 있는 것만) ·
          품질 · 안전 · 환경 · 교통 계획까지 <b>시공계획서 한 벌</b>을 만듭니다. 공사설명서(PDF) · 도면 · 착공사진을 같이 넣으면 그 자리에 들어갑니다.
        </p>
        <p className="muted" style={{ margin: 0 }}>
          가입 없음 · <b>파일은 이 브라우저 밖으로 나가지 않습니다.</b> 받는 꼴: <b>PDF</b> · 한글(.hwpx) · 워드 · 엑셀. 숫자(공정 · 인원 · 장비)는 내역서로 셈한 짐작이니 화면에서 고쳐 쓰십시오.
        </p>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 지금은 준비 중입니다</b> — 내 내역서를 올려 만들고 받는 것은 곧 엽니다.
            지금은 <button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={예시}>🧪 예시 내역서</button>로 어떻게 나오는지 미리 보실 수 있습니다.
            {' '}<예시본수 열쇠="|시공계획|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set잠금말(''); 세기('|시공계획|열쇠') }
              }}>
                <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
                <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
              </form>
              {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
            </details>
          </div>
        )}
      </div>

      {/* ── ① 올리기 */}
      <div className="card">
        <div className="sec-title">① 내역서 · 공사설명서 · 도면 · 사진 올리기 <span className="muted" style={{ fontWeight: 500 }}>(여러 개 한꺼번에)</span></div>
        {씀 ? (
          <div className="tldrop" onClick={() => 칸.current?.click()} onDragOver={(e) => e.preventDefault()}
               onDrop={(e) => { e.preventDefault(); 받기(e.dataTransfer?.files) }}>
            <input ref={칸} type="file" multiple accept=".xlsx,.xlsm,.xls,.pdf,.jpg,.jpeg,.png,.webp" hidden onChange={(e) => { 받기(e.target.files); e.target.value = '' }} />
            <끌어놓기판 글="내역서 · 공사설명서 · 도면 · 사진을 놓으면 읽습니다" 길들={[{ 꼴: /\.(xlsx|xlsm|xls|pdf|jpe?g|png|webp)$/i, 받기: (fs) => 받기(fs), 여럿: true }]} />
            <b>＋ 파일을 끌어 놓거나 누르십시오</b>
            <span>내역서 .xlsx · .xls(원가계산서가 있으면 산업안전보건관리비 · 환경보전비까지) · 공사설명서 · 시방서 PDF · 도면 PDF · JPG · PNG</span>
          </div>
        ) : (
          <div className="tldrop sg-locked" onClick={() => 잠김('내 파일 올리기는')} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); 잠김('내 파일 올리기는') }}>
            <b>🔒 올리기는 준비 중입니다</b>
            <span>내역서 .xlsx · .xls · 공사설명서 · 시방서 PDF · 도면 PDF · JPG · PNG 를 올리면 한 벌이 만들어집니다 — 곧 엽니다. 지금은 아래 🧪 예시로 보십시오.</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={예시}>🧪 예시 내역서로 보기</button>
          {내역 && <span className="muted" style={{ alignSelf: 'center' }}>📊 {내역.이름}</span>}
        </div>
        {잠금말 && <div className="cwarn" style={{ marginTop: 8 }}>{잠금말}</div>}
        {바쁨 && <div className="muted" style={{ marginTop: 8 }}>⏳ {바쁨}</div>}
        {오류 && <div className="cwarn" style={{ marginTop: 8 }}>⚠️ {오류}</div>}
        {말.length > 0 && <ul className="sg-msgs">{말.map((t, i) => <li key={i}>{t}</li>)}</ul>}
      </div>

      {/* ── ② 공사 정보 (잠김이면 보이기만) */}
      <fieldset disabled={!씀} className="sg-fs">
      <div className="card">
        <div className="sec-title">② 공사 정보 <span className="muted" style={{ fontWeight: 500 }}>— 내역서 · 설명서에서 찾은 것은 저절로 채웁니다</span></div>
        <div className="tl-grid">
          <Row label="공사명"><input value={공사.공사명} onChange={칸고침('공사명')} placeholder="예: ○○지구 배수로 정비공사" /></Row>
          <Row label="공사위치"><input value={공사.위치} onChange={칸고침('위치')} placeholder="예: ○○시 ○○면 일원" /></Row>
          <Row label="착공일"><input type="date" value={공사.착공} onChange={칸고침('착공')} /></Row>
          <Row label="준공일" hint={공기 > 0 ? `공기 ${공기}일` : (자료?.머리?.공기글 ? `내역서 공기 ${자료.머리.공기글}` : '')}><input type="date" value={공사.준공} onChange={칸고침('준공')} /></Row>
          <Row label="발주처"><input value={공사.발주처} onChange={칸고침('발주처')} placeholder="예: ○○시" /></Row>
          <Row label="감독기관(감리)"><input value={공사.감독기관} onChange={칸고침('감독기관')} placeholder="예: ○○시 건설과" /></Row>
          <Row label="시공자(회사명)"><input value={공사.시공자} onChange={칸고침('시공자')} placeholder="예: ○○건설(주)" /></Row>
          <Row label="작성일(표지)"><input value={공사.작성일} onChange={칸고침('작성일')} placeholder="2026. 10." /></Row>
        </div>
        <label className="tl-row" style={{ marginTop: 10 }}>
          <span className="tl-lab">공사목적 <i>비우면 저절로 한 줄</i></span>
          <textarea rows={2} value={공사.목적} onChange={칸고침('목적')} placeholder="예: 상습 침수구역의 배수 능력을 높여 주민 안전을 확보하는 데 목적이 있음." style={{ width: '100%', fontSize: 14 }} />
        </label>
        <details className="sg-more" style={{ marginTop: 10 }}>
          <summary><b>👷 현장 조직</b> <span className="muted">— 조직표 · 담당자 표에 들어갈 이름(비워 두면 빈칸으로 나옴)</span></summary>
          <div className="tl-grid" style={{ marginTop: 8 }}>
            {[['현장대리인', '현장대리인(소장)'], ['공무', '공무'], ['공사', '공사'], ['품질', '품질관리자'], ['안전', '안전관리자']].map(([k, t]) => (
              <Row key={k} label={t}><input value={사람[k]} onChange={(e) => set사람((s) => ({ ...s, [k]: e.target.value }))} /></Row>
            ))}
          </div>
        </details>
      </div>

      {/* ── ③ 공종 · 공정 · 그림 */}
      {lib && (
        <div className="card">
          <div className="sec-title">③ 넣을 공종 · 공정 · 도면</div>
          <div className="sg-chips">
            {Object.keys(공종표시).map((k) => {
              const g = 모[k]
              const 몫 = g && 총액 > 0 ? (g.금액 / 총액 * 100) : null
              return (
                <label key={k} className={'sg-chip' + (지금고른[k] ? ' on' : '')}>
                  <input type="checkbox" checked={!!지금고른[k]} onChange={(e) => set고른({ ...지금고른, [k]: e.target.checked })} />
                  {공종표시[k]}
                  <i>{g ? `품목 ${g.품목들.length}` + (몫 !== null ? ` · ${몫.toFixed(1)}%` : '') : '내역서에 없음'}</i>
                </label>
              )
            })}
          </div>
          <p className="muted" style={{ margin: '6px 0 0' }}>견본 시공계획서의 공종입니다. 내역서 금액의 1% 이상인 공종을 저절로 고릅니다 — 눌러서 넣고 뺄 수 있습니다.</p>

          <details className="sg-more" style={{ marginTop: 12 }}>
            <summary><b>🗓 공정 고치기</b> <span className="muted">— 예정공정표의 공종마다 시작일 · 기간(일)을 고칩니다. 처음엔 공종 성격대로 저절로 놓습니다</span></summary>
            {!(공사.착공 && 공사.준공) && <div className="cwarn" style={{ marginTop: 8 }}>착공일 · 준공일을 넣으면 공정표 · 투입계획이 그려집니다.</div>}
            <div className="sg-tablewrap">
              <table className="sg-table">
                <thead><tr><th>공종</th><th>금액(천원)</th><th>시작일</th><th>기간(일)</th></tr></thead>
                <tbody>
                  {공정줄화면.map((r, i) => (
                    <tr key={i}>
                      <td><input value={r.이름} onChange={(e) => set공정고침(공정줄화면.map((x, j) => (j === i ? { ...x, 이름: e.target.value } : x)))} /></td>
                      <td className="r">{r.무게만 ? '—' : Math.round(r.금액 / 1000).toLocaleString('ko-KR')}</td>
                      <td><input type="date" value={r.시작 || ''} onChange={(e) => set공정고침(공정줄화면.map((x, j) => (j === i ? { ...x, 시작: e.target.value } : x)))} /></td>
                      <td><input type="number" min="1" value={r.기간 || ''} onChange={(e) => set공정고침(공정줄화면.map((x, j) => (j === i ? { ...x, 기간: e.target.value } : x)))} style={{ width: 80 }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 6 }} onClick={() => set공정고침(null)}>🪄 자동 배치로 되돌리기</button>
          </details>

          <details className="sg-more" style={{ marginTop: 10 }}>
            <summary><b>🖼 도면 · 사진 넣기</b> <span className="muted">— 올린 도면 · 사진을 시공계획서의 그림 자리와 별첨 착공사진에 넣습니다 · 올린 그림 {그림목록.length}장</span></summary>
            <div className="sg-help">
              <b>무엇을 하는 곳인가요?</b> 시공계획서 안에는 도면이 들어가는 자리가 있습니다(타설 계획도 · 말뚝 배치도 · 교통처리 계획도 …).
              여기서 «이 자리에 이 도면» 을 고르면 PDF · 한글 · 워드 · 엑셀에 그 그림이 들어갑니다.
              <ol>
                <li>맨 위 <b>①</b> 칸에 도면(PDF · JPG · PNG)이나 착공사진을 올립니다. PDF 도면은 첫 쪽이 그림으로 들어옵니다.</li>
                <li>아래 자리마다 넣을 그림을 고릅니다. <b>고르지 않은 자리</b>는 «도면을 올리면 이 자리에 들어갑니다» 라는 <b>빈 테두리</b>로 나옵니다.</li>
                <li><b>👁 그 쪽 보기</b>를 누르면 아래 미리보기가 그 쪽으로 넘어가 들어간 모습을 보여 줍니다.</li>
              </ol>
            </div>
            <div className="sg-slots">
              {그림자리들.filter(([, , 공]) => !공 || 지금고른[공]).map(([k, t, , 어디, 무엇]) => (
                <div key={k} className="sg-slot">
                  <div className="sg-slot-h"><b>{t}</b><span>{어디}</span></div>
                  <div className="sg-slot-b">
                    <select value={그림자리[k] || ''} disabled={!그림목록.length} onChange={(e) => set그림자리((s2) => ({ ...s2, [k]: e.target.value }))} aria-label={t + ' 그림 고르기'}>
                      <option value="">{그림목록.length ? '(빈 자리로 둠)' : '(먼저 ① 에 그림을 올리십시오)'}</option>
                      {그림목록.map(([열, g]) => <option key={열} value={열}>{g.이름}</option>)}
                    </select>
                    {k in 자리쪽 && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => 쪽으로(자리쪽[k])}>👁 그 쪽 보기 ({자리쪽[k] + 1}쪽)</button>}
                  </div>
                  <i>넣으면 좋은 것: {무엇}</i>
                </div>
              ))}
            </div>
            <div className="sg-help" style={{ marginTop: 12 }}>
              <b>별첨 착공사진</b> — 시공계획서 맨 뒤 «별첨. 착공사진» 에 붙일 사진을 고릅니다.
              사진을 <b>누른 차례대로 번호</b>가 붙고 2장씩 한 쪽에 들어갑니다. 다시 누르면 빠집니다.
            </div>
            {그림목록.length > 0 ? (
              <div className="sg-thumbs">
                {그림목록.map(([열, g]) => {
                  const n = 사진들.indexOf(열)
                  return (
                    <button type="button" key={열} className={'sg-thumb' + (n >= 0 ? ' on' : '')} onClick={() => set사진들((s2) => (s2.includes(열) ? s2.filter((x) => x !== 열) : [...s2, 열]))} title={(n >= 0 ? '빼기 — ' : '별첨에 넣기 — ') + g.이름}>
                      <img src={그림주소(g)} alt="" />
                      {n >= 0 && <b>{n + 1}</b>}
                    </button>
                  )
                })}
              </div>
            ) : <p className="muted" style={{ margin: '6px 0 0' }}>착공사진(JPG · PNG)을 ① 에 올리면 여기에 작은 그림으로 나옵니다.</p>}
            {사진들.length > 0 && <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 6 }} onClick={() => 쪽으로(Math.max(0, 쪽들.length - Math.ceil(사진들.length / 2)))}>👁 별첨 쪽 보기</button>}
          </details>

          {지금고른.철거 && (
            <details className="sg-more" style={{ marginTop: 10 }}>
              <summary><b>🏗 크레인 인양능력 판정</b> <span className="muted">— 부재 규격(가로×세로×높이 m)과 투입 크레인의 정격하중(작업반경별)을 적으면 O.K / N.G</span></summary>
              <div className="sg-tablewrap">
                <table className="sg-table">
                  <thead><tr><th>부재</th><th>규격(m) L×B×H</th><th>작업반경(m)</th><th>정격하중(t)</th></tr></thead>
                  <tbody>
                    {크레인.map((r, i) => (
                      <tr key={i}>
                        {['부재', '규격', '반경', '정격'].map((k) => (
                          <td key={k}><input value={r[k] || ''} placeholder={{ 부재: '옹벽(L형)', 규격: '5.0×0.25×3.45', 반경: '8', 정격: '17.1' }[k]} onChange={(e) => set크레인(크레인.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 6 }} onClick={() => set크레인([...크레인, { 부재: '', 규격: '', 반경: '', 정격: '' }])}>＋ 줄 더하기</button>
            </details>
          )}

          <details className="sg-more" style={{ marginTop: 10 }}>
            <summary><b>⚙️ 셈 기준</b> <span className="muted">— 인원 · 장비 · 펌프카 숫자를 셀 때 쓰는 값 3가지(고치면 표가 바로 바뀝니다)</span></summary>
            <div className="sg-help">
              <b>무엇을 하는 곳인가요?</b> «4. 인원 · 장비 투입계획» 과 «타설 계획» 표의 숫자는 내역서에 이 세 값을 곱하고 나눠서 셉니다.
              현장에 맞게 고치면 표가 그 자리에서 다시 셈해집니다. 모르시면 그대로 두셔도 됩니다(보통 쓰는 값).
            </div>
            <div className="sg-calc">
              <div className="sg-calc-row">
                <label>💰 평균 노임 <small>원 / 하루</small><input type="number" value={설정.노임} onChange={(e) => set설정((s2) => ({ ...s2, 노임: +e.target.value || 0 }))} /></label>
                <p>사람 한 명의 <b>하루 품삯 평균</b>입니다. <b>연인원(몇 사람 · 몇 날) = 내역서 노무비 ÷ 평균 노임</b>으로 셉니다. 노임을 올리면 인원이 줄고, 내리면 늘어납니다.
                  {셈보기.노무비 > 0 && <em>지금: 노무비 {Math.round(셈보기.노무비).toLocaleString('ko-KR')}원 ÷ {Number(설정.노임 || 0).toLocaleString('ko-KR')}원 = 약 {(셈보기.인원 - 셈보기.반장).toLocaleString('ko-KR')}인{셈보기.반장 > 0 ? ` + 작업반장 ${셈보기.반장.toLocaleString('ko-KR')}인(공사 기간 내내 하루 1명)` : ''} → 인원 투입 합계 {셈보기.인원.toLocaleString('ko-KR')}인</em>}</p>
              </div>
              <div className="sg-calc-row">
                <label>📅 가동률 <small>0.3 ~ 1</small><input type="number" step="0.05" min="0.3" max="1" value={설정.가동률} onChange={(e) => set설정((s2) => ({ ...s2, 가동률: +e.target.value || 0.7 }))} /></label>
                <p>공사 기간 가운데 <b>실제로 일하는 날의 비율</b>입니다(비 · 눈 · 휴일 빼고). 0.7 이면 30일 중 21일입니다. 인원 · 장비를 순(상 · 중 · 하순)마다 나눌 때 날수에 곱합니다.
                  {공기 > 0 && <em>지금: 공기 {공기}일 × {설정.가동률} → 일하는 날 약 {셈보기.일하는날}일</em>}</p>
              </div>
              <div className="sg-calc-row">
                <label>🚚 1회 타설량 <small>㎥ / 하루</small><input type="number" value={설정.회당} onChange={(e) => set설정((s2) => ({ ...s2, 회당: +e.target.value || 60 }))} /></label>
                <p>콘크리트 <b>펌프카 한 대가 하루에 붓는 양</b>입니다(보통 50 ~ 80㎥). <b>타설 횟수 · 펌프카 대수 = 레미콘 물량 ÷ 1회 타설량</b>(올림)입니다.
                  {셈보기.레미콘 > 0 && <em>지금: 레미콘 {Math.round(셈보기.레미콘).toLocaleString('ko-KR')}㎥ ÷ {설정.회당}㎥ → 타설 {Math.ceil(셈보기.레미콘 / (설정.회당 || 60))}회 · 펌프카 {셈보기.펌프}대</em>}</p>
              </div>
            </div>
            <button type="button" className="btn line sm" style={{ width: 'auto', marginTop: 8 }} onClick={() => set설정((s2) => ({ ...s2, ...기본셈 }))}>↺ 보통 값으로(230,000원 · 0.7 · 60㎥)</button>
          </details>
        </div>
      )}

      </fieldset>

      {/* ── ④ 미리보기 · 받기 — 잠김이면 예시를 연 뒤에만 미리보기 */}
      {lib && !씀 && !예시봄 && (
        <div className="card">
          <div className="sec-title">④ 미리보기</div>
          <p className="muted" style={{ marginTop: 0 }}>🧪 예시 내역서를 열면 시공계획서 한 벌(표지 · 공정표 · 투입계획 · 공종별 · 품질 · 안전 · 환경 · 교통)을 쪽마다 넘겨 보실 수 있습니다.</p>
          <button type="button" className="btn" style={{ width: 'auto' }} onClick={예시}>🧪 예시로 미리 보기</button>
        </div>
      )}
      {lib && (씀 || 예시봄) && (
        <div className="card">
          <div className="sec-title">④ 미리보기 · 받기 {쪽들.length > 0 && <span className="muted" style={{ fontWeight: 500 }}>— {쪽들.length}쪽</span>}</div>
          {결과?.오류 && <div className="cwarn">⚠️ {결과.오류}</div>}
          {!자료 && <p className="muted" style={{ marginTop: 0 }}>내역서를 올리기 전에도 틀(품질 · 안전 · 환경 · 교통)은 볼 수 있습니다. 내역서를 넣으면 공정 · 물량 · 공종이 채워집니다.</p>}
          <div className="sg-dl">
            {Object.entries(형식표).map(([k, [이름]]) => (
              <button key={k} type="button" className={씀 ? (k === 'pdf' ? 'btn' : 'btn line') : 'btn line sg-lockbtn'} style={{ width: 'auto' }} disabled={씀 && (!쪽들.length || !!내림중)} onClick={() => 내려받기(k)}>
                {내림중 === 이름 ? '⏳ 만드는 중…' : `${씀 ? '⬇' : '🔒'} ${이름}`}
              </button>
            ))}
            <button type="button" className={'btn line' + (씀 ? '' : ' sg-lockbtn')} style={{ width: 'auto' }} onClick={원클릭에} title="공사명 · 위치 · 착공 · 준공 · 회사 · 현장대리인을 공사서류 원클릭(착공계 · 착공서류)으로 넘깁니다">{씀 ? '⚡' : '🔒'} 착공서류(원클릭)로</button>
          </div>
          {!씀 && <p className="muted" style={{ margin: '6px 0 0' }}>🧪 예시(지어낸 공사)입니다. 받기 · 넘기기는 준비 중 — 화면에서 쪽마다 넘겨 보십시오.</p>}
          {!씀 && 잠금말 && <div className="cwarn" style={{ marginTop: 6 }}>{잠금말}</div>}
          {쪽 && (
            <>
              <div className="sg-pager">
                <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={쪽번 === 0} onClick={() => set쪽번(쪽번 - 1)}>◀</button>
                <select value={쪽번} onChange={(e) => set쪽번(+e.target.value)}>
                  {쪽들.map((p, i) => <option key={i} value={i}>{i + 1} / {쪽들.length}쪽{p.번호 ? ` (- ${p.번호} -)` : ''}</option>)}
                </select>
                <button type="button" className="btn line sm" style={{ width: 'auto' }} disabled={쪽번 >= 쪽들.length - 1} onClick={() => set쪽번(쪽번 + 1)}>▶</button>
              </div>
              <div ref={폭틀} className="sg-view">
                <쪽그림 쪽={쪽} 폭px={쪽.폭 > 쪽.높이 ? 폭 : Math.min(폭, 640)} 그림들={그림들} />
              </div>
            </>
          )}
          <p className="muted" style={{ marginTop: 8 }}>
            ※ 견본 시공계획서의 차례 · 문장을 다듬어 썼고, 낡은 기준(공사장 소음 규제기준 · 안전보건교육 시간)은 현행 법령 값으로 바꿨습니다. 현장마다 다른 숫자는 «설계도서에 따름» 으로 둡니다.
            안전관리계획서 · 유해위험방지계획서(대상 공사)는 <Link to="/safety">안전관리계획서 화면</Link>을 함께 보십시오.
          </p>
        </div>
      )}
      <div ref={틀칸} />
    </>
  )
}
