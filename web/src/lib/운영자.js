/**
 * 🔑 운영자 — 「이 브라우저가 소장님 것인가」 한 곳에서만 봅니다 (2026-09-18)
 *
 * ■ 왜 따로 뺐나
 *    전에는 `Qna.jsx` 안에 `OPS`/`isOp` 가 있었습니다. 그래서 운영자인지 보려는
 *    화면(Admin·ReportMake·Report)이 **사랑방 화면을 통째로 끌고 왔습니다.**
 *    번호 목록 한 줄을 보려고 게시판 코드를 받는 셈이었습니다. 여기 한 곳으로 옮깁니다.
 *
 * ■ 🚨 `database.rules.json` 의 `op` 규칙과 «반드시 같아야» 합니다.
 *    한쪽만 고치면 화면은 표를 붙이려 하는데 서버가 막아 「올리지 못했습니다」 가 납니다.
 *    기기를 더하실 땐 아래 목록과 규칙 둘 다에 번호를 넣고 `3_규칙올리기.bat` 을 한 번.
 *
 * ⚠️ uid 를 여기 적어도 안전합니다 — 익명 로그인은 «원하는 uid 로» 로그인할 수 없습니다.
 */
export const OPS = [
  'ZglL1g3X5UZFBA2590LirDnEnil1',      // 소장님 (사무실 크롬, 2026-09-17 등록)
]

export const isOp = (uid) => !!uid && OPS.includes(uid)

/**
 * 🔖 2026-09-18 — 소장님: 「여전히 내가 업체 성적표를 실행해 볼 수 있는 버튼이 없어」
 *
 * 전에는 `/admin` 에 들러야 `kcm_op` 가 심겼습니다. 그 화면을 안 들르면 단추가
 * 영영 안 보였습니다. **소장님이 손으로 들러야 하는 단계를 만들면 안 됩니다.**
 *
 * 그래서 파이어베이스가 «이미 브라우저에 적어 둔» 번호를 그냥 읽습니다.
 * 파이어베이스 인증은 로그인한 사람을 `firebase:authUser:{키}:{앱}` 에 넣어 둡니다.
 * 읽기만 하므로 **파이어베이스를 부르지 않습니다** — /report 는 설명만 있는
 * 가벼운 화면이라 방문자에게 인증 꾸러미를 받게 하면 안 됩니다.
 *
 * ⚠️ 이건 «문 앞 이름표» 입니다. 진짜 자물쇠가 아닙니다 —
 *    누구든 브라우저 저장소에 아무 번호나 적어 넣을 수 있습니다.
 *    진짜 자물쇠는 ① 서버 규칙(database.rules.json)과
 *    ② **자료** 입니다: 성적표는 소장님 컴퓨터의 `data/store/first.json` 이 있어야
 *    만들어지고, 그 파일은 사이트에 올라가 있지 않습니다.
 */
export function 내번호() {
  try {
    const ls = window.localStorage
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i)
      if (!k || k.indexOf('firebase:authUser:') !== 0) continue
      const u = JSON.parse(ls.getItem(k) || 'null')
      if (u && u.uid) return String(u.uid)
    }
  } catch { /* 사생활 보호 창이면 저장소가 막힙니다 — 없는 것으로 봅니다 */ }
  return ''
}

/** 이 브라우저가 운영자 것인가 — 옛 표식(`kcm_op`)도 그대로 받아 줍니다 */
export function 나운영자() {
  try { if (window.localStorage.getItem('kcm_op') === '1') return true } catch { /* 무시 */ }
  return isOp(내번호())
}
