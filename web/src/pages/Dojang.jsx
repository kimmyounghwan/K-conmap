import { useEffect, useRef, useState } from 'react'
import { 도장그리기, 도장뽑기, 도장돌리기, 정사각자리, 이름꼴들, 회사꼴들, 글씨들, 색들, 이름최대, 둘레최대, 가운데최대, 글정리 } from '../lib/도장.js'
import { 웹글꼴들, 웹글꼴, 글꼴받기 } from '../lib/도장글꼴.js'
import { 내도장들, 내도장더하기, 내도장빼기, 바뀜사건, 내도장최대 } from '../lib/내도장.js'
import { use남김 } from '../lib/길기록.js'
import { 세기 } from '../lib/받은수.jsx'
import 도구설명 from '../tools/도구설명.jsx'

/**
 * 🖋 /tools/dojang — 도장 만들기 (G780 · 2026-11-19)
 *   소장님 「도장만들기 도구 이것도 만들어 줘...사이트 찾아보고 최대한 간단하면서 실용적이게」 → 기획 → 「서식까지 연결하게 해줘」
 *   ■ 탭 셋: ✍️ 이름 도장(1~4자) · 🏢 회사 도장(법인 원형 = 둘레 회사 이름 + 가운데 «대표이사») · 📷 도장 사진 → 투명
 *   ■ 받기 = 투명 PNG 1024px · «💾 내 도장으로 저장» = 이 기기에 512px(lib/내도장.js — 서식 칸에 찍기가 읽음)
 *   ■ 그림은 이 기기 안에서만 만듦(이름 · 사진 모두 서버로 안 감) · 셈 · 그리기 lib/도장.js · 시험 tools/시험_도장.mjs · tools/시험_도장화면.mjs
 *   ■ 📊 |도장|이름 · |도장|직인 · |도장|사진 · |도장|예시 · |도장|받기 · |도장|저장 · |도장|기울기(사진마다 한 번)
 *   🩹 G780a (11-19) 소장님 「반듯하게 안된 것 같은데..도장이...」 — 🧪 예시 사진을 똑바로 · 📐 «기울기 바로잡기»(사진 탭 · ±30° · 0.5° 씩)
 *   🔁 G780b (11-19) 「도장 다시 만들어」 「캡쳐 준 것처럼 만들어」 「○○이랑 비슷하게 … 잘 만들어 줘」 「도장만들기 종류도 여러개 해줘」
 *     → 굵은 고딕 글씨를 칸에 꽉(전자도장 꼴 · 「그것처럼 만들어 줘」 「왜 다 이상하게 만들지」 — 선으로 그린 인장체는 고를 때만) · 가로 읽기 2 × 2(세 자 이름은 «인» 붙여 네 칸이 기본) · 가는 테두리
 *     · 이름을 적으면 «종류» 그림이 한꺼번에(원형만 — 「원형만 만들어. 사각은 하지말고」 · 이름: 원 · 음각 원 · 두 줄 원 / 회사: 법인 원형 · 원형 · 음각 원형) → 눌러 고름
 *     · 글씨(고딕(굵게) · 명조 · 인장체) · 색(빨강 · 검정 · 파랑) · 찍은 느낌(번짐)은 고를 때만 · 📊 |도장|꼴
 */
const S = 512
const 기본 = { 탭: '이름', 이름: '', 인붙임: true, 꼴: '원', 직인꼴: '법인원', 글씨: '고딕', 색: '빨강', 번짐: false, 둘레글: '', 가운데글: '대표이사', 사진색: '자동', 진하기: 50 }
const 예시이름 = '홍길동'
const 예시회사 = '가상건설 주식회사'
const 기울기최대 = 30
const 파일이름 = (s) => ('도장_' + String(s || '').replace(/[\\/:*?"<>|\s]+/g, '').slice(0, 20)) || '도장'

/* 🧪 예시 사진 — 종이(한쪽 그림자) 위에 찍은 빨간 도장 · 검은 글씨 줄 · 먼지 점(지어낸 그림)
   🩹 G780a 도장은 똑바로(전엔 살짝 돌려 찍어 결과 도장이 기울어 보였음 — 기울어진 사진은 «기울기 바로잡기» 로) */
function 예시사진() {
  const W = 1200, H = 900
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d')
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#cfccc4'); gr.addColorStop(0.5, '#efede7'); gr.addColorStop(1, '#f6f4ef')
  g.fillStyle = gr; g.fillRect(0, 0, W, H)
  const s = document.createElement('canvas'); s.width = 420; s.height = 420
  도장그리기(s.getContext('2d'), 420, { 종류: '이름', 글: 예시이름, 인붙임: true, 꼴: '원', 글씨: '고딕', 색: '빨강', 번짐: true })
  g.save(); g.translate(640, 470); g.globalAlpha = 0.85; g.drawImage(s, -210, -210); g.restore()
  g.fillStyle = '#333'; g.font = '28px serif'; g.fillText('신고인(사업주)            (서명 또는 인)', 110, 800)   /* 글씨 줄은 도장과 안 겹치게(예시 결과가 깔끔하게) */
  let a = 7
  const 난 = () => { a = (a * 16807) % 2147483647; return a / 2147483647 }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(80,70,60,${(난() * 0.3).toFixed(2)})`; g.fillRect(난() * W, 난() * H, 2, 2) }
  return c
}

/* 종류 그림 단추 — 같은 글 · 글씨 · 색으로 꼴만 바꿔 작게(누르면 고름) */
function 꼴단추({ o, 꼴, 이름, on, 고름, 판수 = 0 }) {
  const 판 = useRef(null)
  const 열쇠 = JSON.stringify([o, 꼴, 판수])   /* 🔤 G782 판수 — 고른 글꼴이 다 오면 한 번 더 그림 */
  useEffect(() => {
    const cv = 판.current
    if (!cv) return undefined
    const 그림 = () => { try { 도장그리기(cv.getContext('2d'), cv.width, { ...o, 꼴, 번짐: false }) } catch (e) { /* 그림 못 그려도 단추는 둠 */ } }
    그림()
    let 끝 = false
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!끝) 그림() }) } catch (e) { /* 옛 브라우저 */ }
    return () => { 끝 = true }
  }, [열쇠])   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <button type="button" className={'dj-kind' + (on ? ' on' : '')} aria-pressed={on} onClick={() => 고름(꼴)}>
      <canvas ref={판} width={168} height={168} aria-hidden="true" />
      <span>{이름}</span>
    </button>
  )
}

export default function Dojang() {
  const [입, set입] = use남김('kcm.도장.입력', 기본)
  const v = { ...기본, ...(입 && typeof 입 === 'object' ? 입 : {}) }
  const 고침 = (k, x) => set입((o) => ({ ...기본, ...(o || {}), [k]: x }))
  const 판 = useRef(null)
  const [사진, set사진] = useState(null)          // { 그림(canvas), 이름 }
  const [사진결과, set사진결과] = useState(null)  // { 칸(canvas), 잉크 } | { 없음: true }
  const [말, set말] = useState('')
  const [목록, set목록] = useState(() => 내도장들())
  const [지울, set지울] = useState('')
  const [기울기, set기울기] = useState(0)        // 📐 사진 탭 — 도(+ 시계 방향) · 사진을 새로 고르면 0
  const 기울셈 = useRef(false)
  const 파일칸 = useRef(null)

  useEffect(() => { document.title = '도장 만들기 — 이름 도장 · 회사 직인 · 도장 사진 투명 PNG | K-건설맵' }, [])
  useEffect(() => {
    const f = () => set목록(내도장들())
    window.addEventListener(바뀜사건, f); window.addEventListener('storage', f)
    return () => { window.removeEventListener(바뀜사건, f); window.removeEventListener('storage', f) }
  }, [])

  /* 🔤 G782 글씨 — 기본 셋 + 이 사이트에 둔 공개 글꼴(고를 때만 받음) · 없어진 글꼴이 남아 있으면 고딕 */
  const 글씨목록 = [...글씨들, ...웹글꼴들.map((g) => [g.k, g.이름])]
  const 글씨 = 글씨목록.some(([k]) => k === v.글씨) ? v.글씨 : '고딕'
  const [글꼴판, set글꼴판] = useState(0)
  const 이름글 = 글정리(v.이름, 이름최대).join('')
  const 둘레 = 글정리(v.둘레글, 둘레최대).join('')
  const 예시중 = (v.탭 === '이름' && !이름글) || (v.탭 === '직인' && !둘레)
  const 옵션 = v.탭 === '직인'
    ? { 종류: '직인', 둘레글: 둘레 ? v.둘레글 : 예시회사, 가운데글: v.가운데글, 꼴: v.직인꼴, 글씨, 색: v.색, 번짐: v.번짐 }   /* 🩹 G782 띄어쓰기째(회사 원형은 낱말대로 줄) — 정리는 도장그리기가 */
    : { 종류: '이름', 글: 이름글 || 예시이름, 인붙임: v.인붙임, 꼴: v.꼴, 글씨, 색: v.색, 번짐: v.번짐 }
  const 쓸글자 = v.탭 === '직인' ? (옵션.둘레글 || '') + (옵션.가운데글 || '') : 옵션.글 + '인'
  const 웹 = v.탭 !== '사진' ? 웹글꼴[글씨] : null
  const 글꼴약속 = useRef(null)
  useEffect(() => {
    if (!웹) return undefined
    let 끝 = false
    const 약 = 글꼴받기(웹, 쓸글자)
    글꼴약속.current = 약
    약.then(() => { if (!끝) set글꼴판((n) => n + 1) })
    return () => { 끝 = true }
  }, [글씨, 쓸글자, v.탭])   // eslint-disable-line react-hooks/exhaustive-deps
  /* 받기 · 저장 앞 — 고른 글꼴이 아직 오는 중이면 기다림(덜 온 글꼴로 그리지 않게) */
  const 글꼴기다림 = async () => { if (웹 && 글꼴약속.current) { try { await 글꼴약속.current } catch (e) { /* 그냥 그림 */ } } }
  const 꼴고름 = (k) => { 고침(v.탭 === '직인' ? '직인꼴' : '꼴', k); 세기('|도장|꼴') }

  /* 미리 보기 — 글 · 모양이 바뀌면 바로(글꼴이 늦게 오면 한 번 더) */
  const 그리기 = (cv, 크기) => {
    const ctx = cv.getContext('2d')
    if (v.탭 === '사진') {
      ctx.clearRect(0, 0, 크기, 크기)
      if (사진결과 && 사진결과.칸) ctx.drawImage(사진결과.칸, 0, 0, 크기, 크기)
      return
    }
    도장그리기(ctx, 크기, 옵션)
  }
  useEffect(() => {
    const cv = 판.current
    if (!cv) return undefined
    그리기(cv, S)
    let 끝 = false
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!끝 && 판.current) 그리기(판.current, S) }) } catch (e) { /* 옛 브라우저 */ }
    return () => { 끝 = true }
  })   // eslint-disable-line react-hooks/exhaustive-deps

  /* 📷 사진 → 투명 (📐 각 ≠ 0 이면 뽑은 도장을 돌린 뒤 자름) */
  const 사진처리 = (그림, 색 = v.사진색, 진 = v.진하기, 각 = 기울기) => {
    if (!그림) return
    const W = 그림.width, H = 그림.height
    const g = 그림.getContext('2d', { willReadFrequently: true })
    let r = 도장뽑기(g.getImageData(0, 0, W, H), { 잉크: '자동', 진하기: 진, 색: 색 === '자동' ? undefined : 색 })
    if (r.상자 && 각) r = 도장돌리기(r, r.상자, 각)
    const 자리 = 정사각자리(r.상자, r.width, r.height)
    if (!자리) { set사진결과({ 없음: true }); return }
    const 속 = document.createElement('canvas'); 속.width = r.width; 속.height = r.height
    const sg = 속.getContext('2d'); const id = sg.createImageData(r.width, r.height); id.data.set(r.data); sg.putImageData(id, 0, 0)
    const 칸 = document.createElement('canvas'); 칸.width = 1024; 칸.height = 1024
    칸.getContext('2d').drawImage(속, 자리.x, 자리.y, 자리.변, 자리.변, 0, 0, 1024, 1024)
    set사진결과({ 칸, 잉크: r.잉크 })
  }
  const 사진넣기 = async (f) => {
    if (!f) return
    set말('')
    try {
      const bmp = await createImageBitmap(f)
      const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k))
      const cg = c.getContext('2d'); cg.fillStyle = '#fff'; cg.fillRect(0, 0, c.width, c.height)   /* 🩹 G782 투명 PNG 는 흰 종이 위로(투명 = 검은 바탕으로 읽혀 검은 도장을 못 찾았음) */
      cg.drawImage(bmp, 0, 0, c.width, c.height)
      if (bmp.close) bmp.close()
      set기울기(0); 기울셈.current = false
      set사진({ 그림: c, 이름: f.name || '사진' }); 사진처리(c, v.사진색, v.진하기, 0)
      세기('|도장|사진')
    } catch (e) { set말('⚠️ 사진을 읽지 못했습니다 — JPG · PNG 사진으로 다시 골라 주세요') }
  }
  const 예시사진보기 = () => { const c = 예시사진(); set말(''); set기울기(0); 기울셈.current = false; set사진({ 그림: c, 이름: '예시 사진' }); 사진처리(c, v.사진색, v.진하기, 0); 세기('|도장|예시') }
  const 기울기바꿈 = (x) => {
    const a = Math.max(-기울기최대, Math.min(기울기최대, Math.round((Number(x) || 0) * 2) / 2))
    set기울기(a)
    if (사진) 사진처리(사진.그림, v.사진색, v.진하기, a)
    if (a && !기울셈.current) { 기울셈.current = true; 세기('|도장|기울기') }
  }

  const 준비됨 = v.탭 === '사진' ? !!(사진결과 && 사진결과.칸) : !예시중
  const 이름표 = v.탭 === '직인' ? 둘레 : v.탭 === '사진' ? '도장 사진' : 이름글
  const 받기 = async () => {
    if (!준비됨) return
    await 글꼴기다림()
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024
    그리기(cv, 1024)
    cv.toBlob((b) => {
      if (!b) { set말('⚠️ 그림을 만들지 못했습니다'); return }
      const u = URL.createObjectURL(b)
      const a = document.createElement('a'); a.href = u; a.download = 파일이름(이름표) + '.png'
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(u), 4000)
      set말('⬇ 투명 PNG(1024 × 1024)를 받았습니다 — 한글 · 워드에서는 그림을 «글 앞으로» 두세요')
      세기('|도장|받기')
    }, 'image/png')
  }
  const 저장 = async () => {
    if (!준비됨) return
    await 글꼴기다림()
    const cv = document.createElement('canvas'); cv.width = S; cv.height = S
    그리기(cv, S)
    const r = 내도장더하기(이름표 || '내 도장', cv.toDataURL('image/png'))
    set말(r.ok ? '💾 ' + r.말 + ' — 이 기기에만 남습니다' : '⚠️ ' + r.말)
    if (r.ok) { set목록(r.목록); 세기('|도장|저장') }
  }
  const 탭바꿈 = (t) => { 고침('탭', t); set말(''); 세기(t === '직인' ? '|도장|직인' : t === '사진' ? '|도장|사진탭' : '|도장|이름') }

  return (
    <div className="wrap dj">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🖋 도장 만들기 — 이름 도장 · 회사 도장 · 도장 사진을 투명 PNG로</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          이름이나 회사 이름을 적으면 바로 도장 그림이 됩니다. 종이에 찍은 내 도장을 사진으로 찍어 올리면 흰 바탕을 지우고 도장만 남깁니다.
          받은 그림은 바탕이 투명해 한글 · 워드 · PDF 서류의 «(인)» 자리에 겹쳐 넣을 수 있습니다.
        </p>
        <div className="seg dj-seg" role="tablist" aria-label="도장 종류">
          {[['이름', '✍️ 이름 도장'], ['직인', '🏢 회사 도장'], ['사진', '📷 도장 사진 → 투명']].map(([k, t]) => (
            <button key={k} type="button" role="tab" aria-selected={v.탭 === k} className={v.탭 === k ? 'on' : ''} onClick={() => 탭바꿈(k)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="dj-body">
        <div className="card dj-view">
          <div className="dj-paper"><canvas ref={판} width={S} height={S} className={'dj-cv' + (예시중 && v.탭 !== '사진' ? ' ex' : '')} aria-label="도장 미리 보기" /></div>
          {v.탭 !== '사진' && 예시중 && <p className="dj-exnote">🧪 예시 «{v.탭 === '직인' ? 예시회사 : 예시이름}» — {v.탭 === '직인' ? '회사 이름' : '이름'}을 적으면 바로 바뀝니다</p>}
          {v.탭 === '사진' && !사진결과 && <p className="dj-exnote">사진을 고르면 여기에 도장만 남은 그림이 나옵니다</p>}
          {v.탭 === '사진' && 사진결과 && 사진결과.없음 && <p className="dj-exnote warn">도장을 찾지 못했습니다 — 도장이 크게 보이게 가까이, 그림자 없이 찍어 주세요</p>}
          <div className="dj-btns">
            <button type="button" className="btn sm" onClick={받기} disabled={!준비됨}>⬇ PNG 받기</button>
            <button type="button" className="btn line sm" onClick={저장} disabled={!준비됨}>💾 내 도장으로 저장</button>
          </div>
          {말 && <p className="dj-msg" role="status">{말}</p>}
        </div>

        <div className="card dj-form">
          {v.탭 === '이름' && (
            <>
              <label className="dj-f"><span>이름 <small>한글 · 한자 {이름최대}자까지</small></span>
                <input className="inp" value={v.이름} maxLength={12} placeholder={예시이름} onChange={(e) => 고침('이름', e.target.value)} />
              </label>
              <label className="dj-chk"><input type="checkbox" checked={v.인붙임} onChange={(e) => 고침('인붙임', e.target.checked)} /> 끝에 «인(印)» 붙이기 <small>세 자 이름이면 네 칸(2 × 2) 도장</small></label>
            </>
          )}
          {v.탭 === '직인' && (
            <>
              <label className="dj-f"><span>회사 이름</span>
                <input className="inp" value={v.둘레글} maxLength={24} placeholder={예시회사} onChange={(e) => 고침('둘레글', e.target.value)} />
              </label>
              <label className="dj-f"><span>가운데 글 <small>{가운데최대}자까지 · 법인 원형에 들어감</small></span>
                <input className="inp" value={v.가운데글} maxLength={10} onChange={(e) => 고침('가운데글', e.target.value)} />
              </label>
              <div className="dj-quick">{['대표이사', '대표이사인', '대표이사지인', '사용인감', '직인'].map((t) => <button key={t} type="button" className={v.가운데글 === t ? 'on' : ''} onClick={() => 고침('가운데글', t)}>{t}</button>)}</div>
            </>
          )}
          {v.탭 !== '사진' && (
            <>
              <div className="dj-f"><span>종류 <small>눌러서 고르세요</small></span>
                <div className="dj-kinds">
                  {(v.탭 === '직인' ? 회사꼴들 : 이름꼴들).map(([k, t]) => <꼴단추 key={k} o={옵션} 꼴={k} 이름={t} on={(v.탭 === '직인' ? v.직인꼴 : v.꼴) === k} 고름={꼴고름} 판수={글꼴판} />)}
                </div>
              </div>
              <div className="dj-f"><span>글씨</span>
                <div className="dj-pick">{글씨목록.map(([k, t]) => <button key={k} type="button" className={글씨 === k ? 'on' : ''} aria-pressed={글씨 === k} onClick={() => { 고침('글씨', k); if (웹글꼴[k]) 세기('|도장|글꼴' + k) }}>{t}</button>)}</div>
              </div>
              <div className="dj-f"><span>색</span>
                <div className="dj-pick">{색들.map(([k, t]) => <button key={k} type="button" className={v.색 === k ? 'on' : ''} aria-pressed={v.색 === k} onClick={() => 고침('색', k)}>{t}</button>)}</div>
              </div>
              <label className="dj-chk"><input type="checkbox" checked={v.번짐} onChange={(e) => 고침('번짐', e.target.checked)} /> 찍은 느낌 <small>종이에 찍은 것처럼 군데군데 옅게</small></label>
            </>
          )}
          {v.탭 === '사진' && (
            <>
              <input ref={파일칸} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; 사진넣기(f) }} />
              <div className="dj-btns">
                <button type="button" className="btn sm" onClick={() => 파일칸.current && 파일칸.current.click()}>📷 사진 고르기 · 찍기</button>
                <button type="button" className="btn line sm" onClick={예시사진보기}>🧪 예시 사진으로 해 보기</button>
              </div>
              {사진 && <p className="dj-sub">고른 사진: {사진.이름}{사진결과 && 사진결과.잉크 ? ` · ${사진결과.잉크 === '빨강' ? '빨간' : 사진결과.잉크 === '파랑' ? '파란' : '검은'} 도장으로 봤습니다` : ''}</p>}
              <label className="dj-f"><span>진하기 <small>{v.진하기 < 40 ? '진한 잉크만' : v.진하기 > 60 ? '옅은 잉크까지' : '보통'}</small></span>
                <input type="range" min="10" max="90" step="5" value={v.진하기} onChange={(e) => { const x = Number(e.target.value); 고침('진하기', x); if (사진) 사진처리(사진.그림, v.사진색, x, 기울기) }} />
              </label>
              <div className="dj-f"><span>색</span>
                <div className="dj-pick">{[['자동', '자동(사진 보고)'], ['빨강', '🔴 빨강'], ['검정', '⚫ 검정'], ['파랑', '🔵 파랑']].map(([k, t]) => <button key={k} type="button" className={v.사진색 === k ? 'on' : ''} aria-pressed={v.사진색 === k} onClick={() => { 고침('사진색', k); if (사진) 사진처리(사진.그림, k, v.진하기, 기울기) }}>{t}</button>)}</div>
              </div>
              <div className="dj-f"><span>기울기 바로잡기 <small>{기울기 === 0 ? '사진 그대로' : `${기울기 > 0 ? '시계 방향' : '반시계 방향'} ${Math.abs(기울기)}°`}</small></span>
                <div className="dj-tilt">
                  <button type="button" className="dj-tb" aria-label="반시계 방향으로 0.5도 돌리기" disabled={!사진 || 기울기 <= -기울기최대} onClick={() => 기울기바꿈(기울기 - 0.5)}>⟲</button>
                  <input type="range" min={-기울기최대} max={기울기최대} step="0.5" value={기울기} aria-label="기울기 바로잡기" disabled={!사진} onChange={(e) => 기울기바꿈(e.target.value)} />
                  <button type="button" className="dj-tb" aria-label="시계 방향으로 0.5도 돌리기" disabled={!사진 || 기울기 >= 기울기최대} onClick={() => 기울기바꿈(기울기 + 0.5)}>⟳</button>
                  <button type="button" className="dj-t0" disabled={!사진 || 기울기 === 0} onClick={() => 기울기바꿈(0)}>0°</button>
                </div>
              </div>
              <p className="dj-sub">잘 나오는 사진: 흰 종이에 찍은 도장을 <b>위에서 똑바로 · 그림자 없이 · 도장이 크게</b> 보이게. 비뚤게 찍혔으면 <b>기울기 바로잡기</b>로 맞추세요.</p>
            </>
          )}
          <p className="note sm" style={{ marginTop: 12 }}>
            이름 · 사진은 이 기기 안에서만 그림이 됩니다(어디에도 보내지 않습니다). 본인 · 자기 회사 도장만 만드세요. 인감 증명이 필요한 서류에는 실제 인감을 쓰세요.
          </p>
        </div>
      </div>

      <div className="card dj-mine">
        <h2 className="sec-title" style={{ margin: '0 0 6px' }}>💾 내 도장 <small className="muted">이 기기에 {목록.length} / {내도장최대}</small></h2>
        {목록.length === 0
          ? <p className="cp muted" style={{ margin: 0 }}>아직 저장한 도장이 없습니다. 위에서 만든 뒤 «💾 내 도장으로 저장» 을 누르세요.</p>
          : (
            <div className="dj-list">
              {목록.map((x) => (
                <div key={x.id} className="dj-item">
                  <img src={x.그림} alt={x.이름 + ' 도장'} />
                  <b>{x.이름}</b>
                  {지울 === x.id
                    ? <span className="dj-del"><button type="button" className="btn sm" onClick={() => { set목록(내도장빼기(x.id)); set지울('') }}>지우기</button><button type="button" className="btn ghost sm" onClick={() => set지울('')}>그대로</button></span>
                    : <button type="button" className="dj-x" aria-label={x.이름 + ' 도장 지우기'} onClick={() => set지울(x.id)}>✕</button>}
                </div>
              ))}
            </div>
          )}
      </div>

      <도구설명 k="dojang" />
    </div>
  )
}
