/**
 * 💬 광고 문자 틀 (G781 · 2026-11-19) — 광고 카드 «💬 문자» 를 누르면 뜨는 작은 창(셈 · 글은 lib/광고자료.js)
 *   소장님 「문자보내기를 하면, 바로 건설맵에서 보낸다는 문구가 들어가 잇는 틀이 있고, 이용자가 쓰고 누르면 바로 가게」 「간단한 틀을 만들어 줘」
 *   ■ 글칸에 «안녕하세요. K-건설맵에서 ○○ 광고 보고 연락드립니다.» 가 미리 · 이어 쓰기(커서는 글 끝) · 자주 쓰는 말 단추(누르면 이어 붙음)
 *   ■ 📤 문자 보내기 — 폰: 문자 앱(받는 번호 · 글이 다 들어감 · 앱에서 «보내기» 한 번) / PC: QR(폰 카메라로 찍으면 같은 문자 창) · 📋 글 복사
 *   ■ 닫기 ✕ · 바깥 누르기 · Esc · 📊 |광고문자보냄|id · |광고문자QR|id · |광고문자복사|id(창 열기는 광고칸.jsx 의 |광고문자|id)
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { 광고문자글, 문자말들, 폰인가, 문자앱주소, 문자QR글 } from './lib/광고자료.js'
import { 세기 } from './lib/받은수.jsx'

export default function 광고문자창({ a, 닫기 }) {
  const [글, set글] = useState(() => 광고문자글(a))
  const [큐알, set큐알] = useState('')      // PC — SVG 글
  const [말, set말] = useState('')
  const 칸 = useRef(null)
  const 폰 = 폰인가()
  useEffect(() => {
    const el = 칸.current
    if (el) { try { el.focus({ preventScroll: true }); const n = el.value.length; el.setSelectionRange(n, n) } catch (e) { /* 옛 브라우저 */ } }
    const 키 = (e) => { if (e.key === 'Escape') 닫기() }
    window.addEventListener('keydown', 키)
    return () => window.removeEventListener('keydown', 키)
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { set큐알('') }, [글])
  const 셈 = (k) => { try { 세기(`|${k}|` + a.id) } catch (e) { /* 없음 */ } }
  const 말붙이기 = (t) => { set글((g) => (g.endsWith('\n') || !g ? g : g.replace(/\s*$/, '') + ' ') + t); setTimeout(() => { const el = 칸.current; if (el) { const n = el.value.length; try { el.focus(); el.setSelectionRange(n, n) } catch (e) { /* */ } } }, 0) }
  const QR보기 = async () => {
    셈('광고문자QR')
    try {
      const m = await import('qrcode-generator')
      const qrcode = m.default || m
      if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8']
      const q = qrcode(0, 'M'); q.addData(문자QR글(a.전화, 글.trim()), 'Byte'); q.make()
      set큐알(q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }))
    } catch (e) { set말('QR을 만들지 못했습니다 — «📋 글 복사» 로 폰에 붙여 보내 주세요') }
  }
  const 복사 = async () => {
    셈('광고문자복사')
    try { await navigator.clipboard.writeText(글.trim()); set말('📋 글을 복사했습니다 — 문자 앱에 붙여 넣으세요') } catch (e) { set말('복사하지 못했습니다 — 글을 길게 눌러 복사해 주세요') }
  }
  return createPortal(
    <div className="adsm-back" onClick={닫기}>
      <div className="adsm" role="dialog" aria-modal="true" aria-label={`${a.이름}에 문자`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="adsm-x" onClick={닫기} aria-label="닫기">✕</button>
        <div className="adsm-h">💬 {a.이름}에 문자</div>
        <div className="adsm-to">받는 번호 <b>{a.전화}</b></div>
        <textarea ref={칸} className="inp adsm-ta" rows={5} maxLength={600} value={글} onChange={(e) => set글(e.target.value)} aria-label="보낼 글" />
        <div className="adsm-chips">{문자말들.map((t) => <button key={t} type="button" onClick={() => 말붙이기(t)}>+ {t}</button>)}</div>
        {폰
          ? <a className="btn primary adsm-go" href={문자앱주소(a.전화, 글.trim())} onClick={() => 셈('광고문자보냄')}>📤 문자 보내기</a>
          : <button type="button" className="btn primary adsm-go" onClick={QR보기}>📤 문자 보내기</button>}
        {!폰 && 큐알 && (
          <div className="adsm-qr">
            <div className="adsm-qrimg" dangerouslySetInnerHTML={{ __html: 큐알 }} />
            <p>📱 폰 카메라로 찍으면 <b>이 글이 담긴 문자 창</b>이 바로 열립니다 — 문자 앱에서 «보내기» 만 누르세요.</p>
          </div>
        )}
        <div className="adsm-foot">
          <button type="button" className="btn ghost sm" onClick={복사}>📋 글 복사</button>
          {!폰 && <span>PC 에서는 문자를 바로 보낼 수 없어 QR · 복사로 폰에서 보냅니다</span>}
        </div>
        {말 && <p className="adsm-msg" role="status">{말}</p>}
      </div>
    </div>,
    document.body,
  )
}
