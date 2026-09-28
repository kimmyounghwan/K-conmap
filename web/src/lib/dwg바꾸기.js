/* 🔁 DWG → DXF 바꾸기 — 일꾼 «하나» 를 돌려 씁니다 (2026-09-28)
 *
 * 소장님: 「3d를 보면 토목하고, 건축을 모든 도면을 올리면 3d가 안돼 왜지?」 · 「분리해서 해야 해?」
 *
 * ■ 무엇이 문제였나 (시험으로 잡음)
 *   전에는 DWG 한 장마다 일꾼(dwgdxf.worker.js)을 새로 띄우고, 끝나면 바로 terminate 했습니다.
 *   그렇게 «바로 이어서» 새 일꾼을 띄우면 **네 번째 일꾼이 «변환 엔진 준비» 에서 영영 멈췄습니다**
 *   (도면 크기와 상관없음 — 작은 도면 3장 뒤에도 똑같이 멈춤. 그 도면 혼자는 5초).
 *   일꾼 사이에 10초를 쉬면 멈추지 않았습니다 → 끝낸 일꾼이 다 치워지기 전에 새 엔진을 올리면 걸리는 것으로 봅니다.
 *   토목·건축이 섞여서가 아니라 «DWG 여러 장을 한꺼번에» 가 문제였습니다(DXF 16장은 한 번에 12초).
 *
 * ■ 어떻게
 *   일꾼 하나를 띄워 두고 파일을 «차례로» 넘깁니다. 엔진(기억 공간)은 일꾼 안에서 파일마다 새로 만들고,
 *   컴파일한 엔진 코드만 같이 씁니다 → DWG 16장이 멈추지 않고 돌았습니다(바꿀 수 있는 11장 모두, 한 장 0.2~6초).
 *   · 일꾼이 «오류» 로 답하면(바꾸지 못한 도면) 그 일꾼을 그대로 다음 파일에 씁니다 — 일꾼은 살아 있습니다.
 *   · 일꾼이 죽거나(onerror) 오래 아무 말이 없으면 그 일꾼만 버리고, 잠깐 쉰 뒤 새 일꾼으로 이어 갑니다.
 *   · 한동안 쓰지 않으면 일꾼을 내려 기억을 돌려받습니다.
 *   · 여러 화면(도면 3D · DWG→DXF · 골조/도면판)이 같이 불러도 한 줄로 세워 차례로 합니다.
 */

const 말없음한도 = 240000      // 4분 동안 아무 말이 없으면 멈춘 것으로 봅니다(큰 도면 변환도 보통 1분 안)
const 쉬면내림 = 90000         // 90초 동안 안 쓰면 일꾼을 내립니다
const 새로띄우기전쉼 = 3000     // 죽은 일꾼을 버린 뒤 새 일꾼을 띄우기 전에 쉽니다

let 일꾼 = null
let 내림시계 = null
let 방금버림 = 0
let 차례 = Promise.resolve()

function 새일꾼() {
  return new Worker(new URL('./dwgdxf.worker.js', import.meta.url), { type: 'module' })
}
function 버리기() {
  if (일꾼) { try { 일꾼.terminate() } catch (e) { /* 이미 없음 */ } 일꾼 = null; 방금버림 = Date.now() }
}
function 내림맞추기() {
  clearTimeout(내림시계)
  내림시계 = setTimeout(() => { if (일꾼) { 일꾼.terminate(); 일꾼 = null } }, 쉬면내림)
}
const 쉬기 = (ms) => new Promise((z) => setTimeout(z, ms))

/**
 * DWG 한 장을 DXF 로 — 차례를 기다렸다가 합니다.
 * @param {ArrayBuffer} buf  DWG 바이트(일꾼에게 넘겨 주므로 이 뒤로는 비어 있습니다)
 * @param {string} name
 * @param {(m:{p:number,msg:string})=>void} [알려]
 * @returns {Promise<{dxf:ArrayBuffer, info:object}>}  실패하면 Error(kind: 'mem'|'fail'|'isdxf'|'notdwg'|'timeout')
 */
export function DWG바꾸기(buf, name, 알려 = () => {}) {
  const 할 = 차례.then(() => 한장(buf, name, 알려))
  차례 = 할.catch(() => {})
  return 할
}

async function 한장(buf, name, 알려) {
  clearTimeout(내림시계)
  if (!일꾼) {
    const 남은쉼 = 새로띄우기전쉼 - (Date.now() - 방금버림)
    if (방금버림 && 남은쉼 > 0) await 쉬기(남은쉼)
    일꾼 = 새일꾼()
  }
  const w = 일꾼
  try {
    return await new Promise((되면, 탈) => {
      let 시계 = null
      const 깨움 = () => { clearTimeout(시계); 시계 = setTimeout(() => { 버리기(); 탈(Object.assign(new Error('변환이 멈췄습니다'), { kind: 'timeout' })) }, 말없음한도) }
      const 끝 = () => { clearTimeout(시계); w.onmessage = null; w.onerror = null }
      w.onmessage = (ev) => {
        const d = ev.data || {}
        if (d.type === 'prog') { 깨움(); 알려({ p: d.p || 0, msg: d.msg || '' }) }
        else if (d.type === 'done') { 끝(); 되면({ dxf: d.dxf, info: d.info || {} }) }
        else if (d.type === 'err') { 끝(); 탈(Object.assign(new Error(d.msg || d.kind || 'fail'), { kind: d.kind || 'fail' })) }
      }
      w.onerror = (e) => { 끝(); 버리기(); 탈(Object.assign(new Error((e && e.message) || '일꾼 오류'), { kind: 'fail' })) }
      깨움()
      w.postMessage({ type: 'conv', buf, name }, [buf])
    })
  } finally {
    내림맞추기()
  }
}

/** 화면을 떠날 때 — 지금 도는 변환을 멈추고 일꾼을 내립니다(기다리던 것들은 실패로 끝남) */
export function DWG일꾼내리기() {
  clearTimeout(내림시계)
  if (일꾼) { const w = 일꾼; 일꾼 = null; 방금버림 = Date.now(); try { w.onerror && w.onerror({ message: '화면을 떠나 멈췄습니다' }) } catch (e) { /* 없음 */ } w.terminate() }
}
