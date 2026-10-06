/* 🩹 화면 지킴 — 흰 화면 대신 «다시 열기» (2026-10-05)
   소장님: 「우선 핸드폰에서 사이트가 안보여 흰백지 상태야 고쳐줘」

   ■ 왜 흰 화면이 되나
     · 화면 어디서든 그리다 오류가 나면 React 가 통째로 내려가 «아무것도 없는» 흰 화면이 됩니다
       (지킴 칸이 하나도 없었습니다). 무엇이 잘못됐는지도 남지 않습니다.
     · 배포 직후 폰이 «옛 HTML» 을 들고 있으면 이미 없어진 묶음 파일(/assets/index-*.js)을 부르다 404 →
       React 가 아예 못 뜹니다. 이건 index.html 맨 위 작은 스크립트가 한 번 새로 받아 고칩니다(여기 말고).
   ■ 여기서 하는 일
     · 그리다 오류가 나면 흰 화면 대신 「화면을 그리다 멈췄습니다 · 🔄 다시 열기 · 첫 화면으로」 를 보여 줍니다.
     · 오류 글 앞부분을 작게 적어 둡니다(소장님이 보시고 알려 주시면 바로 찾게) · 애널리틱스에 exception 으로 남깁니다.
     · 묶음 파일을 못 받은 오류(배포가 지나감)면 한 번만 저절로 새로 고칩니다. */
import { Component } from 'react'

const 다시표 = 'kcm_err_reload'
const 묶음오류 = /dynamically imported module|Importing a module script failed|error loading dynamically|ChunkLoadError|Loading chunk|Failed to fetch/i

export function 새로열기() {
  try { sessionStorage.removeItem(다시표) } catch (e) { /* 없음 */ }
  const 주소 = location.pathname + (location.search ? location.search + '&' : '?') + '__v=' + Date.now().toString(36)
  location.replace(주소)
}

export default class 화면지킴 extends Component {
  constructor(p) {
    super(p)
    this.state = { 오류: null }
  }

  /* 🩹 G166 — «한 번만 새로 고침» 표시가 한 번 찍히면 그 탭이 닫힐 때까지 남아,
     두 번째 배포가 지나간 뒤엔 새로 고치지 않고 «멈췄습니다» 만 떴습니다. 잘 뜨고 20초가 지나면 표시를 지웁니다
     (곧바로 또 멈추는 진짜 고장이면 20초 안이라 표시가 남아 — 끝없이 새로 고치지는 않습니다). */
  componentDidMount() {
    this.지움 = setTimeout(() => { if (!this.state.오류) { try { sessionStorage.removeItem(다시표) } catch (e) { /* 없음 */ } } }, 20000)
  }

  componentWillUnmount() { clearTimeout(this.지움) }

  static getDerivedStateFromError(e) {
    return { 오류: e || new Error('알 수 없는 오류') }
  }

  componentDidCatch(e) {
    const 글 = String((e && (e.message || e)) || '').slice(0, 200)
    try { window.gtag && window.gtag('event', 'exception', { description: (글 + ' @' + location.pathname).slice(0, 150), fatal: true }) } catch (x) { /* 없음 */ }
    try { console.error('[화면지킴]', e) } catch (x) { /* 없음 */ }
    if (묶음오류.test(글)) {
      let 한번 = false
      try { 한번 = sessionStorage.getItem(다시표) === '1'; if (!한번) sessionStorage.setItem(다시표, '1') } catch (x) { 한번 = true }
      if (!한번) location.reload()
    }
  }

  render() {
    const e = this.state.오류
    if (!e) return this.props.children
    return (
      <div className="crash" role="alert">
        <div className="crash-ic" aria-hidden="true">🏗️</div>
        <h2>화면을 그리다 멈췄습니다</h2>
        <p>새로 열면 대부분 바로 보입니다. 그래도 같으면 첫 화면으로 가 주세요.</p>
        <div className="crash-btns">
          <button type="button" onClick={새로열기}>🔄 다시 열기</button>
          <a href="/">첫 화면으로</a>
        </div>
        <p className="crash-why">{String(e.message || e).slice(0, 160)}</p>
      </div>
    )
  }
}
