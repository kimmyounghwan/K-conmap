/* 🖋 G780 (2026-11-19) 내 도장 — 도장 만들기(/tools/dojang)에서 «내 도장으로 저장» 한 그림
 *   ■ 이 기기(localStorage `kcm.내도장`)에만 · 서버로 안 감 · 여섯 개까지(새것이 앞) · 512px 투명 PNG(data URL)
 *   ■ 서식 «(서명 또는 인)» 칸에 찍기(G781)가 같은 목록을 읽음 — 바뀌면 같은 탭의 다른 화면에도 알림(`kcm-내도장` 사건)
 *   시험: tools/시험_도장.mjs */
export const 내도장열쇠 = 'kcm.내도장'
export const 내도장최대 = 6
export const 그림최대 = 450000                 /* data URL 글자 수(512px 투명 PNG 는 보통 2만 ~ 15만) */
export const 바뀜사건 = 'kcm-내도장'
const 머리 = 'data:image/png;base64,'
const 창고 = () => { try { return globalThis.localStorage || null } catch (e) { return null } }
const 맞나 = (x) => !!x && typeof x.id === 'string' && /^d[0-9a-z]{4,20}$/.test(x.id) && typeof x.그림 === 'string' && x.그림.startsWith(머리) && x.그림.length <= 그림최대

/** 저장한 도장들(새것부터) — 꼴이 틀린 것은 버림 */
export function 내도장들() {
  try {
    const v = JSON.parse((창고() && 창고().getItem(내도장열쇠)) || '[]')
    return Array.isArray(v) ? v.filter(맞나).slice(0, 내도장최대).map((x) => ({ id: x.id, 이름: String(x.이름 || '내 도장').slice(0, 20), 그림: x.그림, at: Number(x.at) || 0 })) : []
  } catch (e) { return [] }
}
function 쓰기(목록) {
  const s = 창고()
  if (!s) return false
  try { s.setItem(내도장열쇠, JSON.stringify(목록)); } catch (e) { return false }
  try { if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new Event(바뀜사건)) } catch (e) { /* 옛 브라우저 */ }
  return true
}
/** 더하기 — { ok, 말, 목록 } · 같은 그림은 한 번만 · 일곱째부터는 가장 옛것이 빠짐 */
export function 내도장더하기(이름, 그림, 지금 = Date.now()) {
  if (typeof 그림 !== 'string' || !그림.startsWith(머리)) return { ok: false, 말: '저장할 도장 그림이 없습니다' }
  if (그림.length > 그림최대) return { ok: false, 말: '그림이 너무 큽니다 — 사진은 도장만 보이게 가까이 찍어 주세요' }
  const 있던 = 내도장들(), 옛 = 있던.filter((x) => x.그림 !== 그림), 같은것 = 옛.length < 있던.length   /* 🩹 G782 같은 그림이면 «이미 저장한 도장» */
  const 새 = { id: 'd' + Math.floor(지금).toString(36) + Math.floor(Math.random() * 1296).toString(36), 이름: String(이름 || '내 도장').trim().slice(0, 20) || '내 도장', 그림, at: 지금 }
  const 목록 = [새, ...옛].slice(0, 내도장최대)
  if (!쓰기(목록)) return { ok: false, 말: '이 기기에 저장하지 못했습니다(저장 공간이 차 있거나 사생활 창)' }
  return { ok: true, 말: 같은것 ? '이미 저장한 도장입니다 — 맨 앞으로 옮겼습니다' : 옛.length >= 내도장최대 ? `저장했습니다 — 여섯 개까지라 가장 옛 도장은 빠졌습니다` : '저장했습니다', 목록 }
}
/** 빼기 — 남은 목록 */
export function 내도장빼기(id) {
  const 목록 = 내도장들().filter((x) => x.id !== id)
  쓰기(목록)
  return 목록
}
