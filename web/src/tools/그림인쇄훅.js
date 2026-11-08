/**
 * 🖼 G585 (2026-11-08) 그림 인쇄 — 도구의 인쇄 판(#gp-인쇄)을 «인쇄 모양 그대로» 그림으로 찍어 📄 PDF 바로 받기 · 🖨 그림만 인쇄
 *   소장님 「PDF 도 변환 안되게 해야 하지 않아? 사이트?」(G584 안전 서식) → 「모든 작업은 사이트에서 하게 해줘」 → 고르심 «엑셀은 그대로 · PDF 는 모두 그림»
 *   — 남은 도구 인쇄(tools/공정인쇄.js use인쇄 · 글자 PDF)를 하나씩 이 길로 바꿈(첫째: 작업일보 /tools/ilbo).
 *   쓰는 쪽:  const 그 = use그림인쇄(파일 이름, { 셈: '작업일보', 쪽: { 폭: 186, 높: 273 }, 여백: [12, 12], 판쪽: 'il세로' })
 *            {그.판 && createPortal(<div id="gp-인쇄">…종이…</div>, document.body)}   ← 찍는 동안만 붙음(화면엔 안 보임 · 복제본에서만 폄)
 *            <button onClick={() => 그.PDF('위')} disabled={!!그.찍기}>📄 PDF 저장</button> · <button onClick={() => 그.인쇄('위')}>🖨 인쇄</button>
 *            {그.말 && 그.말자리 === '위' && <div role="status">{그.말}</div>}   ← 알림은 누른 단추 곁(위 · 아래)
 *   ■ 쪽 = 그 판 @page 의 글자 칸(mm) · 여백 = [왼, 위] mm · 종이 = A4 [210, 297](가로면 [297, 210]) · 판쪽 = 그림 인쇄 때 쓸 @page 이름(같은 여백)
 *   ■ 셈 = 숨은 누적 |{셈}|PDF · |{셈}|인쇄 (소장님 브라우저 · 로봇은 안 셈) · 칸줄 = 겹친 칸 줄 한 번씩(G587 · lib/그림인쇄.js 칸줄고침 — 합친 칸 표도)
 *   ■ 단추 없이 Ctrl+P 로 찍으면 화면 글이 글자로 나감 → 쓰는 쪽 덩이에 className «그림만인쇄» + <div className="kcm-인쇄안내">…</div> (styles.css)
 */
import { useEffect, useRef, useState } from 'react'
import { PDF만들기, 캔버스JPEG, 파일주기 } from '../lib/그림PDF.js'
import { 세기 } from '../lib/받은수.jsx'

const 옛판꼴 = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk/i

export function use그림인쇄(제목, { 셈 = '', 쪽 = { 폭: 186, 높: 273 }, 여백 = [12, 12], 종이 = [210, 297], 판쪽 = '', 몸표 = ['gp-인쇄중'], 판 = '#gp-인쇄', 맞춤 = true, 더CSS = '', 칸줄 = false } = {}) {
  const [찍기, set찍기] = useState(null)        // 'pdf' | '인쇄' — 판을 붙이고 그림으로 찍는 중
  const [말, set말0] = useState('')
  const [말자리, set말자리] = useState('위')
  const 자리 = useRef('위')
  const 설정 = useRef(null)
  설정.current = { 제목, 셈, 쪽, 여백, 종이, 판쪽, 몸표, 판, 맞춤, 더CSS, 칸줄 }
  const 알림 = (m) => { set말자리(자리.current); set말0(m) }
  useEffect(() => { if (!말) return undefined; const t = setTimeout(() => set말0(''), 4000); return () => clearTimeout(t) }, [말])
  useEffect(() => {
    if (!찍기) return undefined
    let 그만 = false
    const S = 설정.current
    ;(async () => {
      try {
        let el = null
        for (let i = 0; i < 80 && !그만; i++) {
          el = document.querySelector(`${S.판} > *`)
          if (el) break
          await new Promise((r) => setTimeout(r, 50))
        }
        if (그만) return
        if (!el) throw new Error('인쇄 판을 못 찾음')
        const { 인쇄판찍기, A4쪽 } = await import('../lib/그림인쇄.js')
        const { 쪽들 } = await 인쇄판찍기(el, { 몸표: S.몸표, 쪽: S.쪽, 맞춤: S.맞춤, 더CSS: S.더CSS, 칸줄: S.칸줄 })
        if (그만) return
        const 이름 = String(S.제목 || '인쇄').replace(/[\\/:*?"<>|]/g, '').trim() || '인쇄'
        if (찍기 === 'pdf') {
          const pdf = 쪽들.map((cv) => {
            const a = A4쪽(cv, { 글칸: [S.쪽.폭, S.쪽.높], 여백: S.여백, 종이: S.종이 })
            const p = { jpg: 캔버스JPEG(a, 0.9), px: [a.width, a.height], pt: [S.종이[0] * 72 / 25.4, S.종이[1] * 72 / 25.4] }
            a.width = a.height = 1
            return p
          })
          파일주기(PDF만들기(pdf, 이름), 이름 + '.pdf')
          알림(`📄 PDF ${pdf.length}쪽을 만들었습니다 — 내려받은 파일을 여세요`)
        } else {
          그림인쇄(쪽들.map((cv) => cv.toDataURL('image/jpeg', 0.92)), S, 이름)
        }
        쪽들.forEach((cv) => { cv.width = cv.height = 1 })
      } catch (e) {
        if (!그만) 알림(옛판꼴.test(String((e && e.message) || e)) ? '사이트가 새로 바뀌었습니다 — 화면을 새로고침(↻)한 뒤 다시 눌러 주세요(쓴 것은 그대로 남습니다)' : 'PDF 를 만들지 못했습니다 — 잠시 뒤 다시 눌러 주세요')
      }
      if (!그만) set찍기(null)
    })()
    return () => { 그만 = true }
  }, [찍기])   // eslint-disable-line react-hooks/exhaustive-deps
  const PDF = (곳 = '위') => { if (찍기) return; 자리.current = 곳; if (설정.current.셈) 세기(`|${설정.current.셈}|PDF`); set찍기('pdf') }
  const 인쇄 = (곳 = '위') => { if (찍기) return; 자리.current = 곳; if (설정.current.셈) 세기(`|${설정.current.셈}|인쇄`); set찍기('인쇄') }
  return { 판: !!찍기, 찍기, PDF, 인쇄, 말, 말자리 }
}

/** 그림 쪽만 인쇄 — 몸 바로 밑 #kcm-그림인쇄(그림만) · 인쇄 창을 닫으면 걷음
 *  앞 인쇄의 «혹시» 60초 시계가 다음 인쇄를 중간에 걷지 않게 — 새로 찍기 전에 앞 것을 먼저 다 걷음(서식작성 T5 와 같은 사고 막기) */
let 앞것걷기 = null
function 그림인쇄(주소들, S, 이름) {
  if (앞것걷기) 앞것걷기()
  const 옛판 = document.getElementById('kcm-그림인쇄')
  if (옛판) 옛판.remove()
  const 판 = document.createElement('div')
  판.id = 'kcm-그림인쇄'
  if (S.판쪽) 판.style.page = S.판쪽            // 판과 그림의 쪽 이름이 다르면 그 사이에서 쪽이 넘어가 빈 쪽이 생김(첫 시험에서 2쪽 — 빈 첫 쪽)
  for (const u of 주소들) {
    const im = document.createElement('img')
    im.className = 'kcm-쪽그림'; im.alt = ''; im.src = u
    im.style.width = S.쪽.폭 + 'mm'; im.style.height = S.쪽.높 + 'mm'
    if (S.판쪽) im.style.page = S.판쪽
    판.appendChild(im)
  }
  document.body.appendChild(판)
  const 옛 = document.title
  document.title = 이름
  document.body.classList.add('kcm-그림인쇄중'); document.documentElement.classList.add('kcm-그림인쇄중')
  let 늦 = null
  let 시작 = null
  const 끝 = () => {
    clearTimeout(늦); clearTimeout(시작)
    window.removeEventListener('afterprint', 끝)
    document.body.classList.remove('kcm-그림인쇄중'); document.documentElement.classList.remove('kcm-그림인쇄중')
    if (document.title === 이름) document.title = 옛
    판.remove()
    if (앞것걷기 === 끝) 앞것걷기 = null
  }
  앞것걷기 = 끝
  시작 = setTimeout(async () => {
    try { await Promise.all([...판.querySelectorAll('img')].map((im) => (im.decode ? im.decode().catch(() => {}) : null))) } catch (e) { /* 그대로 */ }
    window.addEventListener('afterprint', 끝, { once: true })
    try { window.print() } catch (e) { 끝() }
    if (document.body.classList.contains('kcm-그림인쇄중')) 늦 = setTimeout(끝, 60000)   // 폰 등 print() 가 바로 돌아오는 곳
  }, 120)
}
