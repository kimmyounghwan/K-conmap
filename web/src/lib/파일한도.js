/**
 * 📏 도면 파일 크기 한도 · 일꾼 멈춤 감시 (🧭 G243 — 2026-10-11, 소장님 「파일을 못 읽고 멈췄을때 해결 방안도 만들어서 프로그램이 작동하도록」 ·
 *    「다 읽게 해줘」 · 「다 읽어야 건물이 돼지」 · 「반드시 다 읽게해」)
 *
 * ■ 까닭: 화면마다 «200MB · 250MB 까지» 칸이 있어 현장 C 건축 통합본을 DXF(243 MB)로 넣으면 그 파일을 안 받고
 *   나머지 도면까지 안 읽고 섰음. 같은 도면을 DWG(33 MB)로 넣으면 안에서 243 MB DXF 로 바꿔 잘 읽으니 한도가 능력보다 낮았음.
 * ■ 이제: PC 는 크기 한도 없음(브라우저가 파일 하나를 여는 2 GB 까지) — 아주 큰 DXF 는 줄 끝에서 끊은 조각으로 풀어 읽음(lib/dxf3d.js 조각글).
 *   폰 · 기억이 작은 기기(4 GB 아래)는 200 MB 까지(넘으면 «PC 에서»). 한 파일이 넘쳐도 나머지 도면은 그대로 읽음.
 * ■ 일꾼이 아무 말 없이 오래(5분) 멈추면 그 일을 끝내고 알림 — 기다리기만 하지 않게.
 */
export const MB = 1024 * 1024

export function 작은기기() {
  try {
    const n = globalThis.navigator || {}
    return /Android|iPhone|iPad|iPod|Mobile/i.test(n.userAgent || '') || (typeof n.deviceMemory === 'number' && n.deviceMemory < 4)
  } catch (e) { return false }
}

/** 파일 하나 한도(바이트) — PC 2 GB(브라우저가 여는 끝) · 폰 200 MB */
export function 파일한도() { return (작은기기() ? 200 : 2000) * MB }

/** 한도를 넘었을 때 글 */
export function 한도글() {
  return 작은기기()
    ? '폰 · 태블릿에서는 200MB 까지 엽니다 — PC 에서 열어 주십시오(PC 는 크기 한도 없이 다 읽습니다).'
    : '파일이 2GB 를 넘어 브라우저가 열지 못합니다 — 캐드에서 DWG 로 저장해 넣어 주십시오(DWG 는 훨씬 작고, 안에서 DXF 로 바꿔 읽습니다).'
}

/** 일꾼(Worker)이 «초» 동안 아무 말이 없으면 멈춤() — 깨움() 은 일꾼 말이 올 때마다 · 끝() 은 다 됐을 때 */
export function 멈춤감시(멈춤, 초 = 300) {
  let 마지막 = Date.now()
  const id = setInterval(() => { if (Date.now() - 마지막 > 초 * 1000) { clearInterval(id); 멈춤() } }, Math.min(5000, Math.max(20, 초 * 250)))
  return { 깨움: () => { 마지막 = Date.now() }, 끝: () => clearInterval(id) }
}

export const 멈춤글 = '읽기가 5분 넘게 한 걸음도 나아가지 않아 멈췄습니다 — 이 기기의 기억이 모자랐을 수 있습니다. 다른 창 · 탭을 닫고 다시 넣거나 PC 에서 열어 주십시오'
