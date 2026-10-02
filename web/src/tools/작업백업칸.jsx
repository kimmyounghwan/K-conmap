/**
 * 💾 작업 백업 파일 칸 — 사진대지 · 영수증 / 수량산출서 (2026-10-02 · G113)
 *
 * 소장님: 「이어서 쓸 수 있는 방법은 없어? 있어야 해」 → (고름) 사진 · 도면처럼 큰 것은 «백업 파일 저장 · 불러오기»
 *   서버로 안 보냅니다(값 0원). 받은 파일을 다른 기기 · 다른 브라우저에서 불러오면 이어서 합니다.
 *
 *   <작업백업칸 곳="photobook" 파일="사진대지" 무엇="사진 · 영수증" 꺼내기={async () => [[열쇠, 값]…]} 넣기={async (자료) => …} />
 *   · 불러오면 넣기(자료) 뒤 화면을 새로 엽니다(작업을 처음부터 다시 읽게).
 *   · 창(alert · confirm) 없이 «한 번 더 누르기».
 */
import { useRef, useState } from 'react'
import { 작업파일만들기, 작업파일풀기, 백업내려받기 } from '../lib/백업파일.js'

const 두자 = (n) => String(n).padStart(2, '0')
const 오늘글 = () => { const d = new Date(); return `${d.getFullYear()}-${두자(d.getMonth() + 1)}-${두자(d.getDate())}` }
const 크기 = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`)

export default function 작업백업칸({ 곳, 파일, 무엇, 꺼내기, 넣기 }) {
  const [바쁨, set바쁨] = useState('')
  const [오류, set오류] = useState('')
  const [알림, set알림] = useState('')
  const [불러온, set불러온] = useState(null)
  const 칸 = useRef(null)

  async function 받기() {
    set오류(''); set알림(''); set바쁨('백업 파일을 만드는 중입니다…')
    try {
      const 자료 = await 꺼내기()
      if (!자료 || !자료.length) { set오류('아직 이 브라우저에 저장된 작업이 없습니다.'); return }
      const b = 작업파일만들기(곳, 자료)
      백업내려받기(`${파일}_작업백업_${오늘글()}.json`, b)
      set알림(`백업 파일(${크기(b.size)})을 받았습니다 — 다른 기기 · 브라우저에서 «📂 백업 파일 불러오기» 로 이어서 합니다.`)
    } catch (e) { set오류('백업 파일을 만들지 못했습니다 — 이 브라우저가 저장소를 막고 있을 수 있습니다.') } finally { set바쁨('') }
  }
  function 고름(e) {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    set오류(''); set알림(''); set바쁨('파일을 읽는 중입니다…')
    const rd = new FileReader()
    rd.onload = () => {
      set바쁨('')
      const x = 작업파일풀기(곳, String(rd.result || ''))
      if (x.오류) { set오류(x.오류); return }
      set불러온({ ...x, 이름: f.name })
    }
    rd.onerror = () => { set바쁨(''); set오류('파일을 읽지 못했습니다.') }
    rd.readAsText(f)
  }
  async function 확정() {
    if (!불러온) return
    set바쁨('불러오는 중입니다…')
    try { await 넣기(불러온.자료); window.location.reload() } catch (e) { set바쁨(''); set오류('불러오지 못했습니다 — 이 브라우저가 저장소를 막고 있을 수 있습니다.') }
  }

  return (
    <div className="bk no-print" data-backup={곳}>
      <div className="bk-bar">
        <b>💾 다른 기기에서 이어 하기</b>
        <span className="muted">{무엇}은 서버로 보내지 않으니, 파일로 옮깁니다</span>
        <span className="bk-btns">
          <button type="button" className="btn line sm" onClick={받기} disabled={!!바쁨}>💾 작업 백업 파일로 받기</button>
          <button type="button" className="btn line sm" onClick={() => 칸.current && 칸.current.click()} disabled={!!바쁨}>📂 백업 파일 불러오기</button>
          <input ref={칸} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={고름} />
        </span>
      </div>
      {바쁨 && <div className="bk-busy">{바쁨}</div>}
      {오류 && <div className="bk-err">{오류}</div>}
      {알림 && <div className="bk-note">{알림}</div>}
      {불러온 && (
        <div className="bk-box warn">
          <div>«{불러온.이름}» ({불러온.자료.length}개{불러온.at ? ` · ${String(불러온.at).slice(0, 10)} 백업` : ''}) — 불러오면 <b>이 브라우저의 지금 작업은 이 파일의 것으로 바뀝니다.</b> 지금 것이 필요하면 먼저 «💾 작업 백업 파일로 받기» 를 하십시오.</div>
          <div className="bk-row">
            <button type="button" className="btn sm" onClick={확정} disabled={!!바쁨}>불러와서 이어 하기</button>
            <button type="button" className="btn ghost sm" onClick={() => set불러온(null)}>그만두기</button>
          </div>
        </div>
      )}
    </div>
  )
}
