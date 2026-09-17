/* 📮 문의·사랑방 메일 — «글이 들어오는 그 순간» 보냅니다 (2026-09-18)
 *
 * 소장님: 「**메일 온 거 없는데**」
 *         「**그냥 메일로 보내기 하면 돼잖아. 깃허브 안통하고**」
 *
 * ■ 왜 만들었나 (8절 47)
 *   전에는 깃허브 예약(10분마다)이 메일을 보냈습니다. 그런데 깃허브 예약은
 *   «되도록 그때쯤» 이지 약속이 아닙니다 — 실측 **3일에 14번**, 3~5시간에 한 번이었습니다.
 *   문의는 몇 시간 뒤에 오면 이미 늦습니다. 그래서 «그 자리에서 보내는 길» 로 옮겼습니다.
 *
 * ■ 어떻게 도는가
 *   이용자가 「보내기」 → RTDB 의 quotes/{id} 에 글이 생김 → **이 함수가 깨어남** → 메일.
 *   서버를 켜 두는 것이 아니라 «글이 생길 때만» 깨어납니다. 평소에는 아무것도 안 돕니다.
 *
 * ■ 깃허브 알림은 «지우지 않습니다»
 *   이 함수가 탈이 나도 몇 시간 뒤엔 깃허브가 같은 글을 집어 보냅니다 — 그물입니다.
 *   두 번 오지 않게, 보낸 뒤에 표를 남깁니다:
 *     · 문의   → quotes/{id}/sent = true      (tools/quote_mail.py 가 이 표를 봅니다)
 *     · 사랑방 → qna_mail/{id}   = {...}      (tools/qna_mail.py 가 이 표를 봅니다)
 *   ⚠️ 이 표들의 «이름과 자리» 를 바꾸면 하루 144통 사고(8절, 2026-09-15)가 되돌아옵니다.
 *
 * ■ 돈
 *   요금제는 이미 Blaze 입니다(9절 — 다시 묻지 말 것). 함수 무료 등급이 월 200만 회라
 *   우리 규모(하루 몇 통)에서는 사실상 0원입니다. 그래도 종량제는 상한이 없으므로
 *   **maxInstances 를 3 으로 묶어** 둡니다. 무슨 일이 있어도 셋까지만 뜹니다.
 *
 * ■ 비밀번호
 *   지메일 앱 비밀번호는 **이 파일에 적지 않습니다.** 파이어베이스 «비밀값»에 넣어 두고
 *   함수가 꺼내 씁니다. 넣는 것은 소장님이 직접 하십니다(`F1_비밀번호넣기.bat`).
 *   ⚠️ 클로드는 이 값을 읽지도 옮기지도 않습니다.
 *
 * ■ 지역
 *   RTDB 가 `k-conmap-default-rtdb.firebaseio.com`(지역 표시 없음) = **us-central1** 입니다.
 *   데이터베이스 방아쇠는 **그 데이터베이스와 같은 지역**에 있어야 합니다. 바꾸지 마세요.
 */
const { onValueCreated } = require('firebase-functions/v2/database')
const { defineSecret, defineString } = require('firebase-functions/params')
const { setGlobalOptions } = require('firebase-functions/v2')
const admin = require('firebase-admin')
const nodemailer = require('nodemailer')

admin.initializeApp()
setGlobalOptions({ region: 'us-central1', maxInstances: 3 })

/* 비밀값 — 지메일 «앱 비밀번호». 콘솔에도 로그에도 찍히지 않습니다 */
const MAIL_PASS = defineSecret('MAIL_PASS')
/* 비밀이 아닌 값 — 보내는 주소와 받는 주소 */
const MAIL_USER = defineString('MAIL_USER', { default: 'kimmyounghwan259@gmail.com' })
const MAIL_TO = defineString('MAIL_TO', { default: 'kimmyounghwan259@gmail.com' })

const 보내기 = async (제목, 본문) => {
  const 편지 = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: MAIL_USER.value(), pass: MAIL_PASS.value() },
  })
  await 편지.sendMail({
    from: `"K-건설맵" <${MAIL_USER.value()}>`,
    to: MAIL_TO.value(),
    subject: 제목,
    text: 본문,
  })
}

const 줄 = (이름, 값) => `  ${이름} : ${값 || '-'}`

/* ── ① 내역서 문의함 (quotes) ────────────────────────────────────
   ⚠️ 이 노드는 «읽기 금지» 입니다. 공사 정보와 연락처가 들어갑니다.
      함수는 관리자 자격으로 돌기 때문에 규칙을 지나갑니다. */
exports.quoteMail = onValueCreated(
  { ref: '/quotes/{id}', secrets: [MAIL_PASS] },
  async (event) => {
    const q = event.data.val() || {}
    const id = event.params.id
    if (q.sent) return                       /* 깃허브가 먼저 보냈으면 그만둡니다 */

    const 본문 = [
      '새 문의가 들어왔습니다.',
      '',
      줄('무슨 일  ', q.work),
      줄('필요한 것', q.want),
      줄('발주처  ', q.org),
      줄('공고번호 ', q.no),
      줄('공사금액 ', q.money),
      줄('언제까지 ', q.due),
      '',
      줄('성함    ', q.name),
      줄('연락처  ', q.phone),
      '',
      '  하실 말씀:',
      '  ' + (q.memo || '(없음)'),
      '',
      '  글 번호 : ' + id,
      '  답은 https://k-conmap.com/admin 에서 다실 수 있습니다.',
      '',
      '— K-건설맵 문의함',
    ].join('\n')

    try {
      await 보내기('[K-건설맵] 새 문의 — ' + String(q.work || '').slice(0, 40), 본문)
    } catch (e) {
      /* ⚠️ 표를 «남기지 않고» 끝냅니다 — 그래야 깃허브 알림이 그물 노릇을 합니다 */
      console.error('메일 실패:', e && e.message)
      return
    }
    await admin.database().ref(`/quotes/${id}/sent`).set(true)
  }
)

/* ── ② 사랑방 (qna) ──────────────────────────────────────────────
   ⚠️ 우리가 단 답글(op)은 알리지 않습니다. 내가 쓴 글을 나에게 보낼 까닭이 없습니다. */
exports.qnaMail = onValueCreated(
  { ref: '/qna/{id}', secrets: [MAIL_PASS] },
  async (event) => {
    const g = event.data.val() || {}
    const id = event.params.id
    if (g.op) return
    if (g.deleted) return

    const 본문 = [
      '사랑방에 새 글이 올라왔습니다.',
      '',
      줄('제목', g.t),
      줄('별명', g.nick),
      '',
      '  내용:',
      '  ' + (g.b || '(제목뿐입니다)'),
      '',
      '  글 번호 : ' + id,
      '  답은 https://k-conmap.com/admin 에서 다실 수 있습니다.',
      '',
      '— K-건설맵 사랑방',
    ].join('\n')

    try {
      await 보내기('[K-건설맵] 사랑방 새 글 — ' + String(g.t || '').slice(0, 40), 본문)
    } catch (e) {
      console.error('메일 실패:', e && e.message)
      return
    }
    /* ⚠️ 표는 글이 아니라 «따로» 남깁니다 — qna 는 규칙이 딴 이름표를 막습니다 */
    await admin.database().ref(`/qna_mail/${id}`).set({ at: Date.now(), by: 'fn' })
  }
)
