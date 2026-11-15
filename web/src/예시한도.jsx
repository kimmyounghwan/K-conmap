/**
 * 🧪 G690 (2026-11-15) 잠근 도구 10가지 — 손님 예시는 «앞 3쪽까지» · 받기 단추 자리는 «📄 작성대행 · 견적 문의»
 *   소장님 11-15: 「예시도 2페이지만 볼 수 있게 해줘」 → 「예시도 2페이지에서 3페이지만 볼 수 있게 해줘」 ·
 *   「공사서류 원클릭 엑셀 받기 되는데???」 · 「문의로 하라고 했잖아」 · 「막아 놓은거 다시 점검해. 제발 확실히 해줘」 ·
 *   「내가 확인안하고 믿을 수 있게 해주면 안돼???」 · 「핸폰이라고 노트북만 풀려 있어. 다시 확인해」
 *   ⚠️ G639 「예시는 처음부터 끝까지 이용자가 볼 수 있게 해줘」(유해위험방지계획서)는 이 말씀으로 바뀜(앞 3쪽까지).
 *
 * ■ 손님 = 운영자 기기(lib/운영자.js) · 열쇠말(lib/gate.js)이 아닌 브라우저 — «씀» 이 아니면 손님.
 * ■ 예시자름 — 손님에겐 쪽 · 장 · 서류 · 탭을 앞 3개만 넘김(나머지는 화면 · DOM 에 안 그림).
 * ■ 예시끝 — 넘긴 것보다 많으면 «🔒 예시는 앞 3쪽까지 … 전부는 문의» + 문의 단추.
 * ■ 받기대신문의 — 손님 화면에서 «🔒 PDF · 엑셀 받기 🔒» 처럼 «받기 모양» 단추를 없애고 그 자리에 문의 단추 하나.
 * ■ 열림띠 — 소장님 기기(씀)에서 맨 위 한 줄: 이 기기는 열려 보이지만 손님에겐 어떻게 보이는지(헷갈리지 않게).
 * 재발 막기: tools/시험_잠금손님화면.mjs(10가지 × 폰 · PC — 단추 모두 눌러 받기 0 · 쪽 3 · 받기 모양 단추 0 · 열림띠).
 */
import 잠금문의 from './잠금문의.jsx'

export const 예시한도 = 3

/** 손님이면 앞 n개만 (쪽 · 장 · 서류 · 탭) */
export function 예시자름(들, 손님, n = 예시한도) {
  return 손님 && Array.isArray(들) ? 들.slice(0, n) : 들
}

const 셈글 = (n) => Number(n || 0).toLocaleString('ko-KR')

/** 예시 끝 알림 — 손님이 볼 수 있는 것(한도)보다 전체가 많을 때만 */
export function 예시끝({ 전체, 한도 = 예시한도, 단위 = '쪽', 무엇 = '한 벌', 도구, 갈래, 셈, 붙임 = '', 앞 = true }) {
  if (!(Number(전체) > 한도)) return null
  return (
    <div className="kcm-예시끝 cwarn" role="note">
      🔒 예시는 {앞 ? '앞 ' : ''}<b>{한도}{단위}</b>까지 보입니다{붙임} — {무엇} {셈글(전체)}{단위} 전부는 K-건설맵이 직접 작성해 드립니다(견본 먼저 · 최저가).{' '}
      <잠금문의 도구={도구} 갈래={갈래} 셈={셈} />
    </div>
  )
}

/** 받기 단추 자리(손님) — «받기 모양» 단추 대신 문의 단추 하나 */
export function 받기대신문의({ 도구, 갈래, 셈, 글 = '받기는 K-건설맵이 직접 작성해 드립니다(견본 먼저 · 최저가)' }) {
  return (
    <span className="kcm-받기문의">
      <잠금문의 도구={도구} 갈래={갈래} 셈={셈} />
      {글 && <span className="muted">{글}</span>}
    </span>
  )
}

/* 👀 손님 화면으로 보기 — 소장님 기기에서 손님 화면을 그대로 봄(이 탭만 · sessionStorage) · 소장님 11-15 「내 폰 화면」(열린 화면 사진)
   ⚠️ 셈(받은수 · 방문세기)은 lib/운영자.js 나운영자 그대로라 손님 화면을 봐도 소장님은 안 셈 · 적은 값 · 저장도 그대로(손님 화면은 저장 안 함) */
const 손님보기열쇠 = 'kcm.손님보기'
export function 손님보기켬() {
  try { return window.sessionStorage.getItem(손님보기열쇠) === '1' } catch (e) { return false }
}
export function 손님보기바꿈(켬) {
  try { if (켬) window.sessionStorage.setItem(손님보기열쇠, '1'); else window.sessionStorage.removeItem(손님보기열쇠) } catch (e) { /* 저장소 막힘 — 바뀌지 않음 */ }
  try { window.location.reload() } catch (e) { /* 지나감 */ }
}

/** 🔑 소장님 기기 띠 — 열림(운영자 기기 · 열쇠말)일 때만 · 손님보기 중이면 «👀 손님 화면을 보는 중» */
export function 열림띠({ 씀, 열림 = 씀, 손님보기 = false }) {
  if (!열림) return null
  if (손님보기) {
    return (
      <div className="kcm-열림띠 kcm-손님보기" role="note">
        👀 <b>손님 화면</b>을 보는 중입니다(소장님 기기 · 이 탭만) — 다른 분들에게 보이는 그대로입니다.{' '}
        <button type="button" className="btn line sm kcm-열림단추" onClick={() => 손님보기바꿈(false)}>↩ 원래대로</button>
      </div>
    )
  }
  return (
    <div className="kcm-열림띠" role="note">
      🔑 이 기기는 열려 있습니다(소장님 기기 · 열쇠말) — 손님에게는 <b>🔒 잠금 안내(작성대행 문의)</b>와 <b>🧪 예시(앞 {예시한도}쪽까지 · 보기만)</b>만 보입니다.{' '}
      <button type="button" className="btn line sm kcm-열림단추" onClick={() => 손님보기바꿈(true)}>👀 손님 화면으로 보기</button>
    </div>
  )
}
