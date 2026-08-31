/* ============================================================
   Firebase — 구인구직 게시판 한 곳에서만 씁니다.

   비용 원칙
   - 실시간 구독(onValue) 금지. 화면을 열 때 get() 한 번만.
     (사라사에서 24시간 폴링이 돌아 요금이 샜던 전례)
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
/** 글을 쓸 때만 익명 로그인한다 — 읽기만 하는 방문자는 인증 요청조차 하지 않음 */
export function ensureAnon() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser)
  if (!signing) signing = signInAnonymously(auth).then((c) => c.user).finally(() => { signing = null })
  return signing
}
