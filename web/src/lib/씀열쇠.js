/* ✍ 써 본 횟수의 열쇠 — 화면 주소 → «|씀|tools-nomubi» (lib/씀세기.js · lib/쓴수판.jsx 가 같이 씀 · 시험: tools/시험_씀세기.mjs)
 *  /tools · /forms · /jeoksan · /change · /naeyeok · /goods · /svc · /report · /cad 는 앞 두 마디, 그 밖에 아래 «한 마디» 화면만 · 첫 화면 '/' = 바로투찰.
 *  열쇠 꼴은 데이터베이스 규칙 dl/p 와 받은수.jsx 세기 의 꼴(«|한|둘» · 80자 안 · . → , · / # $ [ ] 못 씀)에 맞춤. */
const 열쇠꼴 = (s) => String(s).replace(/\./g, ',').replace(/\//g, '|').replace(/[#$[\]]/g, '_')   // 받은수.jsx 열쇠꼴 과 똑같이
const 두마디 = new Set(['tools', 'forms', 'jeoksan', 'change', 'naeyeok', 'goods', 'svc', 'report', 'cad'])
const 한마디 = new Set(['calc', 'analysis', 'bunseok', 'gongdong', 'daily', 'pdf', 'safety', 'shareone', 'my', 'qna', 'lic', 'live', 'pre', 'first', 'jobs', 'corp'])

/** 화면 주소 → «|씀|tools-nomubi» · 세지 않는 화면은 null */
export function 씀열쇠(path) {
  const 마디 = String(path || '/').split('?')[0].split('#')[0].split('/').filter(Boolean)
  let 이름
  if (!마디.length) 이름 = '바로투찰'
  else if (두마디.has(마디[0])) 이름 = 마디.slice(0, 2).join('-')
  else if (한마디.has(마디[0])) 이름 = 마디[0]
  else return null
  try { 이름 = decodeURIComponent(이름) } catch (e) { /* 그대로 */ }
  const k = 열쇠꼴('|씀|' + 이름.replace(/\|/g, '-'))
  return k.length <= 80 && /^[|][^|]+[|][^|]+$/.test(k) ? k : null
}

