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
 *   ■ 대상 = 인쇄 판 없이 화면 덩이를 인쇄하던 도구(G588 일용 4대보험 «.iy-out» · 몸표 iy-print) — 그 덩이를 복제본에서 인쇄 CSS 로 펴 찍음 · 손질(판, 문서) = 복제본만 고치기(접은 것 펴기)
 *   ■ 끝 = 찍기가 끝나면(됐든 못 됐든) 부름 — 찍으려고 화면에 잠깐 펼친 판을 걷을 때(G591 투입비 청구서 «이 달 모두 · 업체별 · 근로자별»)
 *   ■ 단추 없이 Ctrl+P 로 찍으면 화면 글이 글자로 나감 → 쓰는 쪽 덩이에 className «그림만인쇄» + <div className="kcm-인쇄안내">…</div> (styles.css)
 *   ■ 🧵 G612 조각 = (판) => [{ el, 쪽, 여백, 종이, 판쪽, z0 }] — 판 안 덩이마다 따로 찍음(엑셀 화면: 서류 35장 · 장마다 가로/세로 · 장마다 줄임) ·
 *            홀로 = 복제본에 판만(사이트 화면은 안 옮김 — 떼어 둔 인쇄 판일 때만) · 진행 = «3/35» · «12/60쪽»(찍는 동안 단추 글에) ·
 *            쪽은 나오는 대로 바로 JPEG(긴 판도 쪽 그림을 다 쥐지 않음 — lib 긴 판 나눠 찍기)
 *   ■ 🧵 G612 아이폰(사파리)으로 🖨 인쇄 — 사파리는 쪽마다 머리 · 바닥글(주소 · 날짜 · 쪽 번호)을 붙여 쓸 높이가 ≈238mm 로 줄어듦(G129 원클릭 흉내 위 27 · 아래 32mm)
 *            → 그림 쪽(273mm)이 두 쪽으로 갈렸음 → 아이폰만 그림 아래 빈칸을 잘라 내고 그래도 넘치면 줄여 가운데(PDF 는 그대로 A4)
 */
import { useEffect, useRef, useState } from 'react'
import { PDF만들기, 캔버스JPEG, 파일주기 } from '../lib/그림PDF.js'
import { 세기 } from '../lib/받은수.jsx'
import { use잠깐말 } from '../lib/잠깐말.js'

const 옛판꼴 = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk/i

export function use그림인쇄(제목, { 셈 = '', 쪽 = { 폭: 186, 높: 273 }, 여백 = [12, 12], 종이 = [210, 297], 판쪽 = '', 몸표 = ['gp-인쇄중'], 판 = '#gp-인쇄', 맞춤 = true, 더CSS = '', 칸줄 = false, 대상 = '', 손질 = null, 끝 = null, 조각 = null, 홀로 = false } = {}) {
  const [찍기, set찍기] = useState(null)        // 'pdf' | '인쇄' — 판을 붙이고 그림으로 찍는 중
  const [말, set말0] = use잠깐말(4000)   // 🩹 G588 같은 알림을 4초 안에 또 띄워도 4초를 새로 셈(lib/잠깐말.js)
  const [말자리, set말자리] = useState('위')
  const [진행, set진행] = useState('')
  const 자리 = useRef('위')
  const 설정 = useRef(null)
  설정.current = { 제목, 셈, 쪽, 여백, 종이, 판쪽, 몸표, 판, 맞춤, 더CSS, 칸줄, 대상, 손질, 끝, 조각, 홀로 }
  const 알림 = (m) => { set말자리(자리.current); set말0(m) }
  useEffect(() => {
    if (!찍기) return undefined
    let 그만 = false
    const S = 설정.current
    ;(async () => {
      try {
        let el = null
        for (let i = 0; i < 80 && !그만; i++) {
          el = S.대상 ? document.querySelector(S.대상) : S.조각 ? document.querySelector(`${S.판}:not(:empty)`) : document.querySelector(`${S.판} > *`)   // 대상 = 화면에 있는 덩이를 그대로(G588 · 인쇄 판 없이 화면을 인쇄하던 도구)
          if (el) break
          await new Promise((r) => setTimeout(r, 50))
        }
        if (그만) return
        if (!el) throw new Error('인쇄 판을 못 찾음')
        const { 인쇄판찍기, A4쪽, 그림아래끝 } = await import('../lib/그림인쇄.js')
        const 판들 = S.조각 ? S.조각(el) : [{ el, 쪽: S.쪽, 여백: S.여백, 종이: S.종이, 판쪽: S.판쪽, z0: 1 }]
        if (!판들.length) throw new Error('인쇄 판을 못 찾음')
        const 아이폰 = 찍기 === '인쇄' && 아이폰인가()
        const 모은 = []
        for (let 번 = 0; 번 < 판들.length; 번++) {
          if (그만) return
          const p = 판들[번]
          if (판들.length > 1) set진행(`${번 + 1}/${판들.length}`)
          await 인쇄판찍기(p.el, {
            몸표: S.몸표, 쪽: p.쪽, 맞춤: S.맞춤, 더CSS: S.더CSS, 칸줄: S.칸줄, 손질: S.손질, z0: p.z0 || 1, 홀로: S.홀로,
            쪽마다: (cv, i, n) => {
              if (찍기 === 'pdf') {
                const a = A4쪽(cv, { 글칸: [p.쪽.폭, p.쪽.높], 여백: p.여백, 종이: p.종이 })
                모은.push({ jpg: 캔버스JPEG(a, 0.9), px: [a.width, a.height], pt: [p.종이[0] * 72 / 25.4, p.종이[1] * 72 / 25.4] })
                a.width = a.height = 1
              } else if (아이폰) {
                const 끝y = Math.min(cv.height, 그림아래끝(cv) + Math.round(cv.height * 0.006))   // 아래 빈칸 잘라 냄(조금 남김)
                const 자른 = document.createElement('canvas')
                자른.width = cv.width; 자른.height = Math.max(1, 끝y)
                자른.getContext('2d').drawImage(cv, 0, 0)
                모은.push({ url: 자른.toDataURL('image/jpeg', 0.92), 쪽: { 폭: p.쪽.폭, 높: (p.쪽.높 * 자른.height) / cv.height }, 판쪽: p.판쪽, 종이: p.종이 })
                자른.width = 자른.height = 1
              } else 모은.push({ url: cv.toDataURL('image/jpeg', 0.92), 쪽: p.쪽, 판쪽: p.판쪽, 종이: p.종이 })
              if (판들.length === 1 && n > 1) set진행(`${i + 1}/${n}쪽`)
            },
          })
        }
        if (그만) return
        const 이름 = String(S.제목 || '인쇄').replace(/[\\/:*?"<>|]/g, '').trim() || '인쇄'
        if (찍기 === 'pdf') {
          파일주기(PDF만들기(모은, 이름), 이름 + '.pdf')
          알림(`📄 PDF ${모은.length}쪽을 만들었습니다 — 내려받은 파일을 여세요`)
        } else {
          그림인쇄(모은, 이름, 아이폰)
        }
      } catch (e) {
        if (!그만) 알림(옛판꼴.test(String((e && e.message) || e)) ? '사이트가 새로 바뀌었습니다 — 화면을 새로고침(↻)한 뒤 다시 눌러 주세요(쓴 것은 그대로 남습니다)' : 'PDF 를 만들지 못했습니다 — 잠시 뒤 다시 눌러 주세요')
      }
      if (!그만) { set찍기(null); set진행(''); if (typeof S.끝 === 'function') { try { S.끝() } catch (e) { /* 걷기 못 해도 그대로 */ } } }
    })()
    return () => { 그만 = true }
  }, [찍기])   // eslint-disable-line react-hooks/exhaustive-deps
  const PDF = (곳 = '위') => { if (찍기) return; 자리.current = 곳; if (설정.current.셈) 세기(`|${설정.current.셈}|PDF`); set찍기('pdf') }
  const 인쇄 = (곳 = '위') => { if (찍기) return; 자리.current = 곳; if (설정.current.셈) 세기(`|${설정.current.셈}|인쇄`); set찍기('인쇄') }
  return { 판: !!찍기 && !설정.current.대상, 찍기, PDF, 인쇄, 말, 말자리, 진행 }
}

/** 아이폰 · 아이패드(사파리 · 크롬 — 둘 다 웹킷 인쇄) — 아이패드 «데스크톱 사이트» 는 Mac 처럼 보여 손가락 닿기로 가림 */
function 아이폰인가() {
  try { return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) } catch (e) { return false }
}

/** 그림 쪽만 인쇄 — 몸 바로 밑 #kcm-그림인쇄(그림만) · 인쇄 창을 닫으면 걷음
 *  앞 인쇄의 «혹시» 60초 시계가 다음 인쇄를 중간에 걷지 않게 — 새로 찍기 전에 앞 것을 먼저 다 걷음(서식작성 T5 와 같은 사고 막기)
 *  🧵 G612 쪽마다 { url, 쪽(mm), 판쪽, 종이 } — 장마다 가로/세로가 섞여도(엑셀 화면) 그림마다 제 @page · 아이폰이면 사파리 쓸 칸(종이 − 위아래 62 · 양옆 28mm) 안에 들게 줄여 가운데 */
let 앞것걷기 = null
function 그림인쇄(쪽모음, 이름, 아이폰 = false) {
  if (앞것걷기) 앞것걷기()
  const 옛판 = document.getElementById('kcm-그림인쇄')
  if (옛판) 옛판.remove()
  const 판 = document.createElement('div')
  판.id = 'kcm-그림인쇄'
  if (쪽모음[0] && 쪽모음[0].판쪽) 판.style.page = 쪽모음[0].판쪽            // 판과 첫 그림의 쪽 이름이 다르면 그 사이에서 쪽이 넘어가 빈 쪽이 생김(첫 시험에서 2쪽 — 빈 첫 쪽)
  for (const it of 쪽모음) {
    /* 🩹 G612 쪽 이름(@page)은 그림(img)에 달면 크롬이 안 봄(가로 · 세로 섞인 판이 다 가로로 · 세로 그림이 둘로 갈림) → 쪽마다 덩이(div)로 싸서 덩이에 */
    const 덩이 = document.createElement('div')
    덩이.className = 'kcm-쪽덩이'
    const im = document.createElement('img')
    im.className = 'kcm-쪽그림'; im.alt = ''; im.src = it.url
    if (아이폰) {
      const 종이 = it.종이 || [210, 297]
      const s = Math.min(1, (종이[0] - 28) / it.쪽.폭, (종이[1] - 62) / it.쪽.높)
      im.style.width = (it.쪽.폭 * s).toFixed(2) + 'mm'; im.style.height = 'auto'; im.style.margin = '0 auto'
    } else { im.style.width = it.쪽.폭 + 'mm'; im.style.height = it.쪽.높 + 'mm' }
    if (it.판쪽) { 덩이.style.page = it.판쪽; im.style.page = it.판쪽 }
    덩이.appendChild(im)
    판.appendChild(덩이)
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
