/* ============================================================
   Firebase — 구인구직 게시판 한 곳에서만 씁니다.

   비용 원칙
   - 실시간 구독(onValue) 금지. 화면을 열 때 get() 한 번만.
     (사라사에서 24시간 폴링이 돌아 요금이 샜던 전례)
     ⚠️ 예외 하나 — 맵톡(pages/Qna.jsx G288, 2026-10-14): 열어 둔 화면에 새 글 · 답글이 안 들어와
        소장님 「맵톡은 계속 보이게 해줘야」. 맨 끝 글 «하나» · 답글 · 지움 · 고정만 듣고, 처음 뒤로는 «바뀐 것만» 받음.
   - 항상 limitToLast 로 범위를 자른다. 노드 전체를 읽지 않는다.
   - 나머지 모든 데이터는 정적 JSON이라 여기를 거치지 않는다.

   아래 설정값은 공개되어도 되는 값입니다(웹 클라이언트용).
   실제 보호는 database.rules.json 규칙이 담당합니다.
   ============================================================ */
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'

const config = {
  apiKey: 'AIzaSyB5uvAzUIbEDTTbxwflTQk3wdzOufc4SE0',
  authDomain: 'k-conmap.firebaseapp.com',
  databaseURL: 'https://k-conmap-default-rtdb.firebaseio.com',
  projectId: 'k-conmap',
  storageBucket: 'k-conmap.firebasestorage.app',
  messagingSenderId: '230642116525',
  appId: '1:230642116525:web:f6f3765cf9a7273ba92324',
}

const app = initializeApp(config)
export const db = getDatabase(app)
export const auth = getAuth(app)

let signing = null
/** 글을 쓸 때만 익명 로그인한다 — 읽기만 하는 방문자는 인증 요청조차 하지 않음
 *  ⏱ G357 (2026-10-21) — 기기에 남아 있는 로그인을 «다 불러온 뒤» 봅니다(authStateReady).
 *     전에는 화면을 막 연 때 currentUser 가 아직 비어 있으면 익명 로그인을 새로 해서(서버 왕복 · 번호가 바뀔 수 있음) 늦었습니다. */
export async function ensureAnon() {
  try { if (auth.authStateReady) await auth.authStateReady() } catch (e) { /* 못 기다려도 아래대로 */ }
  if (auth.currentUser) return auth.currentUser
  if (!signing) signing = signInAnonymously(auth).then((c) => c.user).finally(() => { signing = null })
  return signing
}
