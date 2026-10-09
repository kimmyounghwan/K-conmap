/* ══════════════════════════════════════════════════════════════
   저절로알림.js — 🔔 내 조건 · 검색어 · 쓴 도구를 저절로 올려 알림 받기 (G210 · 2026-10-09)

   소장님: 「들어온 이용자가 검색한 공고 및 면허가 있을 거잖아. 그것도 기억하지? 그럼, 그와 관련된 공고나 1순위가 나오면
           알림을 가게 해줘. 컴이든, 폰이든」 · 「허용 여부 묻지 말고, 알림가게 설정해」 → 고르심 «맵톡처럼»
           · 「고칠때 뭘 고쳤는지」(쓴 도구를 고치면 알림)

   ■ «🔔 새 공고 알림 받기»(내 조건 줄 · G97) 를 누른 «신청» 은 그대로 watch_cond/{번호} — 하루 두 번(8시 · 13시) · 이 파일과 상관없음.
     이 파일은 «신청하지 않은» 기기의 것만: 폰 알림을 허용한 기기가 지역 · 면허를 고르거나 공고를 찾으면 «저절로» watch_auto/{번호} 에 올립니다.
       {rg, lic, none, kw, tools, at}  — 번호(익명) · 조건만. 이름 · 연락처 · 기기 정보는 없습니다. 폰 알림을 허용하지 않은 기기는 올리지 않습니다.
       kw    = 공고 · 1순위에서 찾은 말 최근 5개(2자 넘는 것) — 공고 이름에 들어 있으면 알림
       tools = 이 기기에서 연 도구 · 서식 주소(마이쓴곳.js · 자주 쓴 20개) — 그 화면을 고치면 알림(public/fixes.json)
   ■ 폰 · PC 알림창은 브라우저 규칙상 «허용» 이 한 번 있어야 합니다. 허용 창은 «누를 때» 만 뜹니다:
     내 조건 «🔔 새 공고 알림 받기» · 알림 안내 쪽지 «🔔 알림 받기»(알림안내.jsx · G222 2026-10-10) · ⭐ 담을 때 · 맵톡.
     허용 안 하면(막음 · 닫음) 사이트 맨 위 🔔 로만 알립니다. 페이지를 보는 데는 아무 상관 없습니다.
   ■ «🔕 끄기»(맨 위 🔔 안) · 내 조건 알림 신청을 끈 기기 = {rg:'전국', off:true} 만 남김(kcm_alert_off) — 하루 한 번도 안 감.
   ■ 돈: 조건이 «바뀌었을 때» 와 사흘에 한 번만 씁니다(kcm_cond_sync) — 화면을 열 때마다 쓰지 않습니다.

   🔔 G222 (2026-10-09) «신청하지 않은 분만» 하루 한 번 · 오전 10시 · 모아서 한 통 — 소장님 「알림 해줘」 → 「그냥, 하루에 한번으로 하면 어때???」
     → 「10시에 하자 …」 → 「현재 하던대로 하고, 알림 신청하지 않은 이용자만 하루 한 번 알림 가게 하자.」
     신청한 분(내 조건 알림 · ☆ 담은 공고)은 하던 대로(내 조건 하루 두 번 · 담은 공고 1순위 바로) — 하루 한 번은 안 감.
     (G222 중간에 만든 «🔔 이 회사로 알림 받기»(업체 자가진단)는 소장님 「업체 자가진단 알림은 삭제…」 「필요한 건 아니잖아」 로 뺐습니다)
     보내는 쪽: web/functions/index.js 하루한통 · 셈 web/functions/alertpack.js
     📊 숨은 누적: |알림|허용 · |알림|막음 · |알림|조건 · |알림|끔 · |알림|켬
   ══════════════════════════════════════════════════════════════ */
import { loadRegion, loadMine, loadLicCodes, loadLicNone } from './lic.js'
import { 표시해두기, 폰알림켜기, 푸시되나 } from './알림.js'
import { 쓴곳읽기 } from './마이쓴곳.js'

const 끔열쇠 = 'kcm_alert_off'
const 맞춤열쇠 = 'kcm_cond_sync'          /* 마지막으로 올린 조건 글 + 때 */
const 말열쇠 = 'kcm_kw'                  /* 찾은 말 최근 5개 */
const 사흘 = 3 * 86400e3
const 셈 = (k) => { import('./받은수.jsx').then((m) => m.세기(k)).catch(() => {}) }   /* 숨은 누적 — 화면엔 안 보임 */

const 읽 = (k, 기본) => { try { const v = localStorage.getItem(k); return v == null ? 기본 : v } catch (e) { return 기본 } }
const 쓰 = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch (e) { /* 개인 창 */ } }

export const 알림꺼짐 = () => 읽(끔열쇠, '') === '1'

/** 찾은 말 — 최근 5개(같은 말은 맨 앞으로) */
export function 찾은말들() {
  try { const v = JSON.parse(읽(말열쇠, '[]')); return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 5) : [] } catch (e) { return [] }
}
/* 너무 흔한 말(모든 공고에 들어가는 말)은 기억하지 않습니다 */
const 흔한말 = new Set(['공사', '공사비', '정비', '정비공사', '보수', '보수공사', '설치', '설치공사', '일원', '사업', '개선', '조성', '구간', '공고', '긴급', '용역'])
let 말시계 = null
/** 공고 · 1순위 찾기 칸 — 다 친 뒤 2.5초 뒤에 한 번(쳐 나가는 중인 글자는 안 셈) */
export function 검색어기억(q) {
  clearTimeout(말시계)
  const s = String(q || '').replace(/\s+/g, ' ').trim()
  if (s.length < 2 || s.length > 30 || 흔한말.has(s) || /^[\d\s.,-]+$/.test(s)) return
  말시계 = setTimeout(() => {
    const L = [s, ...찾은말들().filter((x) => x !== s && !s.includes(x) && !x.includes(s))].slice(0, 5)
    쓰(말열쇠, JSON.stringify(L))
    조건바뀜()
  }, 2500)
}

/** 지금 이 기기의 조건(올릴 꼴) — 아무것도 없으면 null */
export function 지금조건() {
  const rg = loadRegion()
  const 맞춤 = loadMine()
  const lic = 맞춤 ? loadLicCodes().map(String) : []
  const kw = 찾은말들()
  const tools = 쓴곳읽기().slice(0, 20).map((x) => x.p).sort()     /* 가나다 차례 — 쓴 횟수 차례가 바뀔 때마다 다시 올리지 않게 */
  if (rg === '전국' && !lic.length && !kw.length && !tools.length) return null
  const c = { rg: String(rg || '전국').slice(0, 12), lic: lic.join(',').slice(0, 600), none: !!(맞춤 && loadLicNone()), kw: kw.join(',').slice(0, 200), tools: tools.join(',').slice(0, 600) }
  return c
}

let 시계 = null
/** 조건이 바뀌었을 수 있음 — 2초 모아서 올림(바뀌지 않았으면 사흘에 한 번만) */
export function 조건바뀜(바로 = false) {
  clearTimeout(시계)
  시계 = setTimeout(() => { 올리기().catch(() => {}) }, 바로 ? 0 : 2000)
}

export async function 올리기(억지 = false) {
  const 푸시됨 = 푸시되나() && typeof Notification !== 'undefined' && Notification.permission === 'granted'
  const 끔 = 알림꺼짐()
  /* 폰 알림을 허용한 기기만 조건을 올립니다(하루 한 번은 폰 알림으로만 가니까) · 끈 기기는 «끔» 만 */
  const c = 끔 || !푸시됨 ? null : 지금조건()
  const 글 = 끔 ? 'off' : JSON.stringify(c)
  let 지난 = null
  try { 지난 = JSON.parse(읽(맞춤열쇠, 'null')) } catch (e) { 지난 = null }
  const 같음 = 지난 && 지난.c === 글 && Date.now() - (지난.at || 0) < 사흘
  if (같음 && !억지) return
  if (글 === 'null' && (!지난 || 지난.c === 'null') && !(푸시됨 && 억지)) return    /* 올린 적도 없고 올릴 것도 없음 — 파이어베이스를 부르지 않음 */
  const [{ 내뿌리 }, f, d] = await Promise.all([import('./관심알림.js'), import('../firebase.js'), import('firebase/database')])
  const r = await 내뿌리()
  if (끔) {
    /* 🔕 끈 기기 — «끔» 표시를 남겨 하루 한 번(오전 10시)이 안 가게(조건이 없는 폰 허용자 요약도) */
    await d.set(d.ref(f.db, `watch_auto/${r}`), { rg: '전국', off: true, at: Date.now() })
  } else if (c) {
    if (!지난 || !지난.c || 지난.c === 'null' || 지난.c === 'off') 셈('|알림|조건')       /* 이 기기가 처음 조건을 올림 */
    표시해두기()                                  /* 이 기기는 사이트 맨 위 🔔 를 읽음 */
    await d.set(d.ref(f.db, `watch_auto/${r}`), { ...c, at: Date.now() })
  } else {
    await d.set(d.ref(f.db, `watch_auto/${r}`), null)
  }
  if (푸시됨 && !끔) await 폰알림켜기(r, Promise.resolve('granted'))   /* 허용한 기기는 푸시 주소도 같이(바뀌었으면 새로) */
  쓰(맞춤열쇠, JSON.stringify({ c: 글, at: Date.now() }))
}

/* 허용되면 조건이 없어도 폰 주소부터 — 조건 없는 사람도 오전 10시 요약 한 통을 받게(G222 «신청 안 한 분께 하루 한 번») */
async function 폰주소올리기() {
  try {
    const { 내뿌리 } = await import('./관심알림.js')
    const r = await 내뿌리()
    표시해두기()
    await 폰알림켜기(r, Promise.resolve('granted'))
  } catch (e) { /* 그물 · 막힘 — 다음에 조건을 올릴 때 다시 */ }
}

/* ⛔ G222 (2026-10-10) «첫 누름에 브라우저 허용 창»(한번묻기)은 없앴습니다 — 소장님 «허용 비율 올리기»:
   차갑게 바로 물으면 막는 분이 많고, 한 번 막으면 다시 물을 수 없고, 막는 분이 많은 사이트는 크롬이 창을 숨깁니다.
   이제는 내 조건을 고른 순간 우리 쪽지(알림안내.jsx)를 먼저 띄우고 «🔔 알림 받기» 를 누른 분께만 허용 창(= 내 조건 알림 신청).
   허용이 된 기기(쪽지 · ☆ 담기 · 맵톡)는 아래 켜두기가 폰 주소 · 기억 조건을 올립니다. */

/** 🔕 끄기 · 🔔 다시 켜기 — 조용히 = 내 조건 알림 신청을 끄고 켤 때 따라서(숨은 누적은 |알림|신청 · |알림|신청끔 으로 따로 셈) */
export async function 알림끄기(끔, 조용히 = false) {
  if (!끔 && !알림꺼짐() && 조용히) return       /* 끈 적 없음 — 할 것 없음 */
  쓰(끔열쇠, 끔 ? '1' : null)
  if (!조용히) 셈(끔 ? '|알림|끔' : '|알림|켬')
  await 올리기(true)
}

/* ── 사이트를 열 때 한 번(main.jsx) — 조건이 바뀌면(lib/lic.js 가 «kcm-cond» 를 알림) 올림 · 허용된 기기면 폰 주소도 ── */
export function 켜두기() {
  if (typeof window === 'undefined' || window.__저절로알림) return
  window.__저절로알림 = true
  window.addEventListener('kcm-cond', () => 조건바뀜())
  setTimeout(() => {
    조건바뀜()                                       /* 첫 화면이 뜬 뒤 — 바뀌지 않았으면 사흘에 한 번만 씀 */
    try { if (푸시되나() && Notification.permission === 'granted') 폰주소올리기() } catch (e) { /* 없음 */ }
  }, 4000)
}
