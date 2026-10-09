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
 */
/* 🚨 2026-09-18 — 처음 올릴 때 이렇게 죽었습니다:
 *     Error: User code failed to load. Cannot determine backend specification. Timeout after 10000.
 *   파이어베이스는 올리기 전에 이 파일을 «한 번 읽어» 무슨 함수가 있는지 봅니다.
 *   그 읽기에 **10초**만 줍니다. 그런데 맨 윗줄에서 무거운 것들을 통째로 불러오느라
 *   10초를 넘겼습니다. 특히 v2 «묶음» 을 통째로 부르면 https·firestore·storage·
 *   pubsub·scheduler·alerts… 모든 갈래를 한꺼번에 끌고 옵니다.
 *
 *   📌 규칙: **맨 윗줄에서는 꼭 필요한 것만 불러옵니다.**
 *      · firebase-admin·nodemailer 는 «메일을 보낼 때» 비로소 불러옵니다(게으른 불러오기)
 *      · 묶음 설정 대신 함수마다 region·maxInstances 를 적습니다
 *      · 맨 윗줄에서 그물망을 타거나 파일을 읽지 않습니다
 *   (F2_함수올리기.bat 에 읽는 시간도 넉넉히 늘려 두었습니다) */
const { onValueCreated, onValueWritten } = require('firebase-functions/v2/database')
/* 🔔 2026-09-30(G73) 사랑방 답글 알림 — 폰 알림(웹 푸시)의 공개 열쇠를 브라우저에 건네는 창구 */
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

/* 비밀값 — 지메일 «앱 비밀번호». 콘솔에도 로그에도 찍히지 않습니다 */
const MAIL_PASS = defineSecret('MAIL_PASS')

/* 주소는 «비밀이 아닙니다» — 그냥 적습니다.
   ⚠️ 2026-09-18 — 처음엔 defineString 으로 «설정값»으로 뒀는데, 올릴 때
      「In non-interactive mode but have no value for MAIL_USER, MAIL_TO」 로 막혔습니다.
      기본값을 적어 둬도 묻습니다. 비밀도 아닌 것을 설정값으로 만들 까닭이 없습니다. */
const MAIL_USER = 'kimmyounghwan259@gmail.com'   /* 보내는 사람 (지메일 계정) */
const MAIL_TO = 'kimmyounghwan259@gmail.com'     /* 받는 사람 */

/* ⚠️ RTDB 가 `k-conmap-default-rtdb.firebaseio.com`(지역 표시 없음) = us-central1.
   데이터베이스 방아쇠는 그 데이터베이스와 «같은 지역»이라야 합니다. 바꾸지 마세요.
   maxInstances 3 — 종량제는 상한이 없으므로 무슨 일이 있어도 셋까지만 뜨게 묶습니다. */
const 옵션 = { region: 'us-central1', maxInstances: 3, secrets: [MAIL_PASS] }

/* ── 게으른 불러오기 — «쓸 때» 비로소 불러옵니다 ─────────────────── */
let _admin = null
const 자료 = () => {
  if (!_admin) { _admin = require('firebase-admin'); _admin.initializeApp() }
  return _admin.database()
}

const 보내기 = async (제목, 본문) => {
  const 편지 = require('nodemailer').createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: MAIL_USER, pass: MAIL_PASS.value() },
  })
  await 편지.sendMail({
    from: `"K-건설맵" <${MAIL_USER}>`,
    to: MAIL_TO,
    subject: 제목,
    text: 본문,
  })
}

const 줄 = (이름, 값) => `  ${이름} : ${값 || '-'}`

/* ── ① 내역서 문의함 (quotes) ────────────────────────────────────
   ⚠️ 이 노드는 «읽기 금지» 입니다. 공사 정보와 연락처가 들어갑니다.
      함수는 관리자 자격으로 돌기 때문에 규칙을 지나갑니다. */
exports.quoteMail = onValueCreated(
  { ...옵션, ref: '/quotes/{id}' },
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
    await 자료().ref(`/quotes/${id}/sent`).set(true)
  }
)

/* ── ② 사랑방 (qna) ──────────────────────────────────────────────
   ⚠️ 우리가 단 답글(op)은 알리지 않습니다. 내가 쓴 글을 나에게 보낼 까닭이 없습니다. */
exports.qnaMail = onValueCreated(
  { ...옵션, ref: '/qna/{id}' },
  async (event) => {
    const g = event.data.val() || {}
    const id = event.params.id
    if (g.op) return
    if (g.deleted) return
    if (g.sb) return          /* 🙈 몰래 차단 기기의 글(G101) — 메일도 보내지 않습니다 */

    const 본문 = [
      '맵톡에 새 글이 올라왔습니다.',
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
      '— K-건설맵 맵톡',
    ].join('\n')

    try {
      await 보내기('[K-건설맵] 맵톡 새 글 — ' + String(g.t || '').slice(0, 40), 본문)
    } catch (e) {
      console.error('메일 실패:', e && e.message)
      return
    }
    /* ⚠️ 표는 글이 아니라 «따로» 남깁니다 — qna 는 규칙이 딴 이름표를 막습니다 */
    /* ⚠️ 2026-09-30 — 깃허브(tools/qna_mail.py)는 «q_{글번호}» 를 봅니다. 전엔 여기서 «{글번호}» 로 적어
       깃허브가 같은 글을 몇 시간 뒤 한 번 더 보냈습니다. 이름을 맞춥니다(옛 표시도 남겨 둠). */
    await 자료().ref(`/qna_mail/q_${id}`).set({ at: Date.now(), by: 'fn' })
  }
)


/* ══════════════════════════════════════════════════════════════════
   🔔 ③ 사랑방 답글 알림 — 사이트 안 🔔 + 폰 알림창 (2026-09-30, G73)

   소장님: 「답글이 달렸다는 걸 알게 해줘. 내가 답글달면 의무적으로 가게 해줘. 그래야 또 들어와서 확인하지」
           「사이트 안, 폰 알림창도 뜨게 해줘」 — 회원가입 없이.

   ■ 답글이 달리는 «그 순간» (qna_a/{글}/{답글}) 깨어나서
     ① 받을 사람 = 글쓴이 + 그 글에 앞서 답글을 단 사람들 − 방금 단 사람 (번호 = 사랑방 uid · 되찾은 기기면 옛 번호 r)
     ② noti/{번호}/{답글} 에 한 줄 — 사이트 맨 위 🔔 가 이것을 읽습니다(허락 없이 누구나)
     ③ push/{번호}/* 에 폰 알림 주소가 있으면 웹 푸시 — 글을 올리며 «알림 허용» 을 누른 기기
     ④ 이용자가 단 답글이면 소장님께 메일(깃허브 10분 예약은 3~5시간씩 늦었습니다) · 표시 qna_mail/a_{답글}
   ■ 웹 푸시 열쇠(VAPID)는 사람이 만지지 않습니다 — 처음 필요할 때 여기서 만들어 push_keys(읽기 금지)에 두고,
     공개 열쇠만 pushKey 창구로 건넵니다. 저장소(공개)에 비밀이 들어가지 않습니다.
   ■ 돈: 답글 하나에 한 번 깨어남 · maxInstances 3 · 푸시는 무료(브라우저 회사의 푸시 서버).
   ══════════════════════════════════════════════════════════════════ */
const 푸시옵션 = { region: 'us-central1', maxInstances: 3 }

/* 열쇠 — 없으면 한 번 만들어 둡니다(두 함수가 동시에 만들어도 먼저 넣은 것 하나만 남게 transaction) */
const 푸시열쇠 = async () => {
  const d = 자료()
  const 있 = (await d.ref('/push_keys').get()).val()
  if (있 && 있.pub && 있.priv) return 있
  const k = require('web-push').generateVAPIDKeys()
  const r = await d.ref('/push_keys').transaction((v) => (v && v.pub && v.priv ? v : { pub: k.publicKey, priv: k.privateKey, at: Date.now() }))
  return r.snapshot.val()
}

/* 공개 열쇠 창구 — 브라우저가 폰 알림을 켤 때 한 번 받아 갑니다(공개해도 되는 값) */
exports.pushKey = onRequest({ ...푸시옵션, cors: true }, async (req, res) => {
  try {
    const k = await 푸시열쇠()
    res.set('Cache-Control', 'public, max-age=3600')
    res.type('text/plain').send(k.pub)
  } catch (e) {
    console.error('열쇠 실패:', e && e.message)
    res.status(500).send('')
  }
})

const 자르기 = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s }

exports.qnaReplyNotify = onValueCreated(
  { ...옵션, ref: '/qna_a/{qid}/{aid}' },
  async (event) => {
    const a = event.data.val() || {}
    const { qid, aid } = event.params
    if (a.deleted) return
    if (a.sb) return          /* 🙈 몰래 차단 기기의 답글(G101) — 글쓴이 · 다른 이용자에게 알리지 않습니다(알리면 들킵니다) */
    const d = 자료()
    const [글s, 답들s] = await Promise.all([d.ref(`/qna/${qid}`).get(), d.ref(`/qna_a/${qid}`).get()])
    const 글 = 글s.val()
    if (!글 || 글.deleted) return
    const 제목 = 자르기(String(글.t || '').replace(/^\[[^\]]{1,8}\]\s*/, ''), 40)
    const 누가 = a.op ? 'K-건설맵' : (자르기(a.nick, 12) || '이웃')
    /* ↩ G148 (2026-10-05) 누구에게 답글 — 소장님 「알림이 가야 의미가 있지. 알림 작업까지 해줘」
       a.to = 받는 답글 번호. 그 답글을 쓴 사람(번호)에게는 «○○님이 내 답글에 답했습니다» + 답글 첫 줄 — 🔔 줄에는 to 표시 */
    const 답들미리 = 답들s.val() || {}
    const 받는답 = a.to && 답들미리[a.to] && !답들미리[a.to].deleted ? 답들미리[a.to] : null
    const 콕 = 받는답 && 받는답.uid && String(받는답.uid) !== String(a.uid) ? String(받는답.uid) : null
    const 첫말 = 자르기(a.b, 36)

    /* ① 받을 사람 */
    const 받는이 = new Set()
    if (글.uid) 받는이.add(String(글.uid))
    if (콕) 받는이.add(콕)
    const 답들 = 답들s.val() || {}
    for (const [k, x] of Object.entries(답들)) {
      if (k !== aid && x && !x.deleted && x.uid) 받는이.add(String(x.uid))
    }
    if (a.uid) 받는이.delete(String(a.uid))

    /* ② 사이트 안 🔔 — 사람마다 최근 30개만 남깁니다 */
    const 한줄 = (r) => ({ q: qid, t: 제목, by: 누가, op: !!a.op, mine: String(글.uid) === r, ...(r === 콕 ? { to: true } : {}), at: Number(a.at) || Date.now() })
    await Promise.all([...받는이].map(async (r) => {
      await d.ref(`/noti/${r}/${aid}`).set(한줄(r))
      const 모두 = (await d.ref(`/noti/${r}`).orderByKey().get()).val() || {}
      const 키 = Object.keys(모두)
      if (키.length > 30) {
        const 뺄 = {}
        키.slice(0, 키.length - 30).forEach((k) => { 뺄[k] = null })
        await d.ref(`/noti/${r}`).update(뺄)
      }
    }))

    /* ③ 폰 알림 */
    const 주소들 = []
    await Promise.all([...받는이].map(async (r) => {
      const ps = (await d.ref(`/push/${r}`).get()).val() || {}
      for (const [sid, p] of Object.entries(ps)) if (p && p.s && p.s.endpoint) 주소들.push({ r, sid, s: p.s })
    }))
    if (주소들.length) {
      const wp = require('web-push')
      const k = await 푸시열쇠()
      wp.setVapidDetails('https://k-conmap.com', k.pub, k.priv)
      await Promise.all(주소들.map(async ({ r, sid, s }) => {
        const 내글 = String(글.uid) === r
        const 알림 = r === 콕
          ? {
              title: `↩ ${a.op ? 'K-건설맵이' : `${누가}님이`} 내 답글에 답했습니다`,
              body: `「${첫말}」 — 글 「${제목}」`,
              url: `/qna/${qid}#${aid}`,
              tag: `qna-${qid}`,
            }
          : {
              title: a.op ? '💬 K-건설맵 답변이 달렸습니다' : '💬 맵톡에 답글이 달렸습니다',
              body: 내글 ? `올리신 글 「${제목}」 — ${누가}: ${첫말}` : `답글을 단 글 「${제목}」 — ${누가}`,
              url: `/qna/${qid}`,
              tag: `qna-${qid}`,
            }
        try {
          await wp.sendNotification(s, JSON.stringify(알림), { TTL: 3 * 86400, urgency: 'normal' })
        } catch (e) {
          /* 404 · 410 = 그 기기가 알림을 끔(또는 앱을 지움) — 주소를 지웁니다 */
          if (e && (e.statusCode === 404 || e.statusCode === 410)) await d.ref(`/push/${r}/${sid}`).remove()
          else console.error('푸시 실패:', e && (e.statusCode || e.message))
        }
      }))
    }

    /* ④ 이용자가 단 답글 → 소장님께 메일 (소장님 본인 답글은 빼고) */
    if (!a.op) {
      const 이미 = (await d.ref(`/qna_mail/a_${aid}`).get()).val()
      if (!이미) {
        const 본문 = [
          '맵톡에 새 답글이 달렸습니다.',
          '',
          줄('글    ', 글.t),
          줄('별명  ', a.nick),
          ...(받는답 ? [줄('누구에게', (받는답.op ? 'K-건설맵' : 받는답.nick || '익명') + ' 님에게(↩ 답글의 답글)')] : []),
          '',
          '  답글:',
          '  ' + (a.b || ''),
          '',
          '  글 주소 : https://k-conmap.com/qna/' + qid,
          '  답은 https://k-conmap.com/admin 에서 다실 수 있습니다.',
          '',
          '— K-건설맵 맵톡',
        ].join('\n')
        try {
          await 보내기('[K-건설맵] 맵톡 새 답글 — ' + 자르기(글.t, 40), 본문)
          await d.ref(`/qna_mail/a_${aid}`).set({ at: Date.now(), by: 'fn' })
        } catch (e) {
          console.error('메일 실패:', e && e.message)       /* 표를 안 남기면 깃허브가 그물로 다시 보냅니다 */
        }
      }
    }
  }
)

/* ══════════════════════════════════════════════════════════════════
   🔔 ④ 다시 오게 — ☆ 담은 공고 1순위 · 📍 내 조건 새 공고 (2026-10-01, G97)

   소장님: 「다시 오게 하기: 내 지역·면허를 한 번 정하면 1순위·공고가 그 조건으로 열리게 하고,
            관심 공고 결과가 나오면 알림을 보냅니다. ---- 자동으로 할 수 있어?」 → «①+②+내 조건 새 공고 알림»

   ■ 언제 깨어나나 — 빠른 수집(fast.py · 10분마다)이 fresh/meta/{first|live} 를 고칠 때마다.
     따로 시계(Cloud Scheduler)를 두지 않습니다. 빠른 수집이 05~23시에만 돌므로 밤에는 안 깨어납니다.
   ■ first — watch/{공고번호}/{번호} 에 적힌 공고가 «방금 1순위»(fresh/rows/first)에 있으면
     그 사람들에게 폰 알림 + 사이트 🔔(noti) 한 줄 → watch/{공고번호} 를 지웁니다(한 번만).
     빠른 길을 놓친 결과도 잡게, 한 시간에 한 번은 사이트 1순위 첫 묶음(board/first-con-0.json)도 봅니다.
   ■ live — ① 📍 내 조건 «신청»(watch_cond = 내 조건 줄 «🔔 새 공고 알림 받기») — 하루 두 번(8시 칸 · 13시 칸 · watch_meta/slot) · G97 그대로.
     watch_cond/{번호} = {rg, lic, none} 마다 지난번 알림(watch_last/{번호}) 뒤로 올라온 공고 중 맞는 것을 세어 한 통.
     공고 = 사이트 공고 첫 묶음(board/live-con-0.json, 약 24시간) + 그 색인(live-con-idx.json 의 앞 500줄 · sido · lic) + 방금 공고(fresh).
     ② 📢 신청 «안 한» 분 — 하루 한 번 오전 10시(G222 · watch_meta/day · 아래 하루한통) · 소장님 「현재 하던대로 하고, 알림 신청하지 않은 이용자만 하루 한 번 알림 가게 하자.」
     🗓 G223 토 · 일 · 공휴일 · 밤에는 공고 · 1순위 알림(①② · ☆ 담은 공고)을 안 보냄 — 다음 평일 첫 알림에 모아서. 맵톡 답글 알림(qnaReplyNotify)은 그대로.
     지역 · 면허 맞추기는 화면과 «같은 규칙»(lib/fmt.js inRegion · lib/lic.js licHit = alertpack.js 지역맞나 · 면허맞나) — 한쪽만 고치지 말 것.
   ■ 돈: 10분에 한 번 깨어나 watch 를 한 번 읽음(대개 몇 KB) · 하루 두 번 공고 묶음 약 2MB · 하루 한 번 색인 1~2MB 받음 · maxInstances 3.
   ══════════════════════════════════════════════════════════════════ */
const 사이트 = 'https://k-conmap.com'
const 한국 = (ms = Date.now()) => new Date(ms + 9 * 3600e3)
const 한국글 = (ms) => 한국(ms).toISOString().replace('T', ' ').slice(0, 19)      /* «YYYY-MM-DD HH:MM:SS» — 조달청 dt 와 같은 꼴 */
const 받기 = async (길) => {
  const r = await fetch(`${사이트}${길}?t=${Date.now()}`)
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}
const 묶음읽기 = async (d, name) => {
  const v = (await d.ref(`/fresh/rows/${name}`).get()).val() || {}
  const out = []
  for (const s of Object.values(v)) { try { const a = JSON.parse(s); if (Array.isArray(a)) out.push(...a) } catch (e) { /* 깨진 묶음은 건너뜀 */ } }
  return out
}
/* 사이트 🔔 한 줄 — 사람마다 최근 30개(사랑방과 같은 자리 noti/{번호}).
   열쇠는 사랑방 답글과 같은 «시간 차례 열쇠»(push) — 30개를 자를 때 오래된 것부터 빠지게 */
const 종한줄 = async (d, r, 줄) => {
  await d.ref(`/noti/${r}`).push().set(줄)
  const 모두 = (await d.ref(`/noti/${r}`).orderByKey().get()).val() || {}
  const 키 = Object.keys(모두)
  if (키.length > 30) {
    const 뺄 = {}
    키.slice(0, 키.length - 30).forEach((k) => { 뺄[k] = null })
    await d.ref(`/noti/${r}`).update(뺄)
  }
}
const 푸시보내기 = async (d, 사람들, 알림) => {
  const 주소들 = []
  await Promise.all(사람들.map(async (r) => {
    const ps = (await d.ref(`/push/${r}`).get()).val() || {}
    for (const [sid, p] of Object.entries(ps)) if (p && p.s && p.s.endpoint) 주소들.push({ r, sid, s: p.s })
  }))
  if (!주소들.length) return 0
  const wp = require('web-push')
  const k = await 푸시열쇠()
  wp.setVapidDetails('https://k-conmap.com', k.pub, k.priv)
  let n = 0
  await Promise.all(주소들.map(async ({ r, sid, s }) => {
    try { await wp.sendNotification(s, JSON.stringify(알림), { TTL: 86400, urgency: 'normal' }); n += 1 } catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) await d.ref(`/push/${r}/${sid}`).remove()
      else console.error('푸시 실패:', e && (e.statusCode || e.message))
    }
  }))
  return n
}

/* ── ☆ 담은 공고 1순위 ── */
async function 담은공고(d) {
  /* 🗓 G223 쉬는 날(토 · 일 · 공휴일) · 밤 · 새벽(평일 8시 전 · 22시 뒤)에는 안 보냄 — watch 를 그대로 두어 다음 평일 아침 8시 지나 첫 깨어남에(alertpack.js 보낼때) */
  if (!require('./alertpack.js').보낼때()) return
  const 지켜 = (await d.ref('/watch').get()).val() || {}
  if (!Object.keys(지켜).length) return
  const 줄들 = await 묶음읽기(d, 'first')
  /* 한 시간에 한 번은 사이트 첫 묶음도 — 빠른 길을 놓친 결과(정기 배포로만 실린 것)를 잡습니다 */
  const 표 = d.ref('/watch_meta/board')
  const 지난 = Number((await 표.get()).val()) || 0
  if (Date.now() - 지난 > 55 * 60e3) {
    await 표.set(Date.now())
    try { const b = await 받기('/data/board/first-con-0.json'); if (Array.isArray(b)) 줄들.push(...b) } catch (e) { console.error('1순위 묶음 못 받음:', e && e.message) }
  }
  const 번호로 = new Map()
  for (const r of 줄들) if (r && r.no && !번호로.has(String(r.no))) 번호로.set(String(r.no), r)
  const 오래 = Date.now() - 45 * 86400e3
  for (const [no, 사람표] of Object.entries(지켜)) {
    const row = 번호로.get(String(no))
    const 사람들 = Object.keys(사람표 || {})
    if (!row) {
      /* 45일 넘게 결과가 안 나온 것(유찰 · 취소 · 나라장터 밖)은 조용히 치웁니다 */
      const 옛 = 사람들.filter((r) => Number((사람표[r] || {}).at) < 오래)
      if (옛.length) { const 뺄 = {}; 옛.forEach((r) => { 뺄[r] = null }); await d.ref(`/watch/${no}`).update(뺄) }
      continue
    }
    await d.ref(`/watch/${no}`).remove()          /* 먼저 지워 두 번 안 가게 */
    const 이름 = 자르기(row.name || ((사람표[사람들[0]] || {}).t), 40)
    const 업체 = 자르기(row.win, 18)
    const 률 = row.rate != null && row.rate !== '' ? `${Number(row.rate).toFixed(3)}%` : ''
    const 곳 = Number(row.np) > 0 ? ` · ${row.np}곳 참가` : ''
    const u = `/first?q=${encodeURIComponent(String(row.name || '').slice(0, 30))}`
    const 글 = `☆ 담은 공고 1순위 — 「${이름}」 ${업체}${률 ? ' · ' + 률 : ''}${곳}`
    await Promise.all(사람들.map((r) => 종한줄(d, r, { k: '1st', m: 글, u, at: Date.now() })))
    await 푸시보내기(d, 사람들, { title: '🏆 담은 공고 1순위가 나왔습니다', body: `「${이름}」 ${업체}${률 ? ' · ' + 률 : ''}${곳}`, url: u, tag: `w-${no}` })
  }
}

/* ── 📍 내 조건 새 공고 «신청한 분» (하루 두 번 · G97 그대로) ──
   🗓 G223 (2026-10-10) 소장님 「휴일하고, 토, 일은 알림이 안가도 돼잖아 공고 나 1순위는…」 → 쉬는 날은 안 보냄 · 다음 평일 8시 칸에 모아서
      (부터 = 지난번 알림 · 직전 평일 같은 시각 − 2시간 = alertpack.js 거슬러 — 평일은 전과 똑같이 26시간 · 하루 넘게 비면 마감 전 색인도 같이 봄) */
const { 지역맞나, 면허맞나, 쉬나, 거슬러 } = require('./alertpack.js')     /* = web/src/lib/fmt.js inRegion · lib/lic.js licHit */
async function 조건묶음(d) {
  if (쉬나()) return                               /* 🗓 토 · 일 · 공휴일 */
  const 지금 = 한국()
  const h = 지금.getUTCHours()
  /* 8시 칸(8~12시) · 13시 칸(13~21시) — 빠른 수집이 그 시각에 한 번 멈췄어도 다음 깨어남에 보냅니다. 밤 22시 뒤로는 안 보냄 */
  const 칸시 = h >= 22 ? 0 : h >= 13 ? 13 : h >= 8 ? 8 : 0
  if (!칸시) return
  const 칸 = 지금.toISOString().slice(0, 10) + '-' + 칸시
  const t = await d.ref('/watch_meta/slot').transaction((v) => (v === 칸 ? undefined : 칸))
  if (!t.committed) return                        /* 이 시간에는 이미 보냄 */
  const 조건들 = (await d.ref('/watch_cond').get()).val()
  if (!조건들) return
  const 지난들 = (await d.ref('/watch_last').get()).val() || {}
  let part = []; let idx = null; let fresh = []
  try { [part, idx, fresh] = await Promise.all([받기('/data/board/live-con-0.json'), 받기('/data/board/live-con-idx.json'), 묶음읽기(d, 'live')]) } catch (e) {
    console.error('공고 묶음 못 받음:', e && e.message)
    await d.ref('/watch_meta/slot').set(null)       /* 다음 깨어남(10분 뒤)에 다시 */
    return
  }
  const f = (idx && idx.f) || []
  const iS = f.indexOf('sido'); const iL = f.indexOf('lic')
  const 공고 = new Map()
  ;(Array.isArray(part) ? part : []).forEach((r, i) => {
    const x = (idx && idx.r && idx.r[i]) || []
    if (r && r.no) 공고.set(String(r.no), { no: r.no, name: r.name, inst: r.inst, dt: String(r.dt || ''), sido: iS >= 0 ? x[iS] : null, codes: iL >= 0 ? x[iL] : [] })
  })
  /* 방금 공고 _ix = [name, inst, base, lo, hi, lic, sido, …] — fast.py finish() 와 같은 차례 */
  for (const r of fresh) if (r && r.no) { const x = r._ix || []; 공고.set(String(r.no), { no: r.no, name: r.name, inst: r.inst, dt: String(r.dt || ''), sido: x[6], codes: x[5] || [] }) }
  /* 🗓 쉬는 날 뒤 첫 칸(월요일 8시 등) — 사이트 첫 묶음(약 24시간)으로는 모자라서 마감 전 색인(bidindex)도 같이 봄(없는 번호만 더함) */
  const 아래끝 = 거슬러()
  const 가장이른 = Math.min(...Object.entries(조건들).filter(([, c]) => c).map(([r, c]) => Math.max(Number(지난들[r]) || 0, Number(c.at) || 0, 아래끝)))
  if (가장이른 < Date.now() - 22 * 3600e3) {
    try { for (const x of await 공고재료(d)) if (!공고.has(String(x.no))) 공고.set(String(x.no), x) } catch (e) { console.error('색인 못 받음(첫 묶음으로만):', e && e.message) }
  }
  const 모두 = [...공고.values()]
  for (const [r, c] of Object.entries(조건들)) {
    if (!c) continue
    const 부터 = Math.max(Number(지난들[r]) || 0, Number(c.at) || 0, 아래끝)
    const 부터글 = 한국글(부터)
    const 원함 = String(c.lic || '').split(',').filter(Boolean)
    const 맞음 = 모두.filter((x) => x.dt > 부터글 && 지역맞나(x, c.rg) && 면허맞나(x.codes, 원함, c.none))
      .sort((a, b) => (a.dt < b.dt ? 1 : -1))
    await d.ref(`/watch_last/${r}`).set(Date.now())
    if (!맞음.length) continue
    const 조건글 = [c.rg && c.rg !== '전국' ? c.rg : '전국', 원함.length ? `면허 ${원함.length}개` : ''].filter(Boolean).join(' · ')
    const 첫 = 자르기(맞음[0].name, 34)
    const 글 = `📢 내 조건(${조건글}) 새 공고 ${맞음.length}건 — 「${첫}」${맞음.length > 1 ? ` 외 ${맞음.length - 1}건` : ''}`
    await 종한줄(d, r, { k: 'new', m: 글, u: '/live', at: Date.now() })
    await 푸시보내기(d, [r], { title: `📢 내 조건 새 공고 ${맞음.length}건`, body: `${조건글} — 「${첫}」${맞음.length > 1 ? ` 외 ${맞음.length - 1}건` : ''}`, url: '/live', tag: 'kcm-cond' })
  }
}

/* ── 📢 신청 «안 한» 분께 하루 한 번 (G222 · 2026-10-09) — 평일 오전 10시(10:00~21:59 첫 깨어남 · 한 번만 · watch_meta/day · 🗓 G223 쉬는 날은 안 보냄) ──
   소장님: 「알림 해줘」 → 「너무 알림이 많이 가면 짜증이 날 수도 있어」 → 「10시에 하자. 모아서 한 번」
           → 「현재 하던대로 하고, 알림 신청하지 않은 이용자만 하루 한 번 알림 가게 하자.」
   ■ 받는 사람 = 폰 알림을 허용한 사람(push/{번호}) 가운데
       ✕ 내 조건 알림을 신청한 사람(watch_cond — 위 하루 두 번을 받음)  ✕ ☆ 담은 공고가 걸려 있는 사람(watch — 1순위가 나오면 바로)
       ✕ 끈 사람(watch_auto/{번호}.off)
   ■ 한 통에 = 그 기기가 기억하는 것(watch_auto = lib/저절로알림.js: 지역 · 면허 · 찾은 말 · 쓴 화면) 에 맞는 새 공고 · 1순위 · 고친 화면(alertpack.js 한사람 · 글)
       맞는 것이 없거나 기억하는 것이 없으면 «지난 하루 새 공고 N건 · 1순위 N건» 요약(alertpack.js 요약) · 새 것이 0이면 안 보냄.
   공고 = 마감 전 공고 색인(bidindex — 지난 하루 새 공고가 다 들어 있음) + 방금 공고(fresh) · 하루 한 번만 받음(1~2MB)
   ⚠️ 부터 = 지난번 한 통 뒤(watch_day_last · 없으면 26시간 전) */
async function 공고재료(d) {
  const 공고 = new Map()
  const bi = await 받기('/data/bidindex.json')
  const bf = (bi && bi.f) || []
  for (const a of (bi && bi.r) || []) {
    const o = {}; bf.forEach((k, i) => { o[k] = a[i] }); o.lic = Array.isArray(o.lic) ? o.lic : []
    공고.set(String(o.no), { no: o.no, name: o.name, inst: o.inst, dt: String(o.dt || ''), sido: o.sido, codes: o.lic })
  }
  /* 방금 공고 _ix = [name, inst, base, lo, hi, lic, sido, …] — fast.py finish() 와 같은 차례(색인보다 늦게 올라온 것) */
  for (const r of await 묶음읽기(d, 'live')) {
    if (!r || !r.no || 공고.has(String(r.no))) continue
    const x = r._ix || []; 공고.set(String(r.no), { no: r.no, name: r.name, inst: r.inst, dt: String(r.dt || ''), sido: x[6], codes: x[5] || [] })
  }
  return [...공고.values()]
}

async function 하루한통(d) {
  const M = require('./alertpack.js')
  const 칸 = M.칸()
  if (!칸) return
  const t = await d.ref('/watch_meta/day').transaction((v) => (v === 칸 ? undefined : 칸))
  if (!t.committed) return                        /* 오늘 한 통은 이미 보냄 */
  const [ps, cs, ws, as] = await Promise.all([d.ref('/push').get(), d.ref('/watch_cond').get(), d.ref('/watch').get(), d.ref('/watch_auto').get()])
  const 푸시 = ps.val() || {}, 신청 = cs.val() || {}, 담음 = ws.val() || {}, 기억 = as.val() || {}
  const 담은사람 = new Set()
  for (const v of Object.values(담음)) for (const r of Object.keys(v || {})) 담은사람.add(r)
  const 사람들 = Object.keys(푸시).filter((r) => !신청[r] && !담은사람.has(r) && !(기억[r] && 기억[r].off))
  try { await 세어두기(d, { 푸시, 신청, 담음, 담은사람, 기억, 사람들 }) } catch (e) { console.error('알림 수 세기 실패:', e && e.message) }
  if (!사람들.length) return
  let 공고
  try { 공고 = await 공고재료(d) } catch (e) {
    console.error('공고 색인 못 받음:', e && e.message)
    await d.ref('/watch_meta/day').set(null)        /* 다음 깨어남(10분 뒤)에 다시 */
    return
  }
  /* 1순위 — 방금 1순위 + 사이트 1순위 첫 묶음(찾은 말 1순위 · 요약의 1순위 수) */
  let 일순위 = []
  try {
    const [fr, b] = await Promise.all([묶음읽기(d, 'first'), 받기('/data/board/first-con-0.json').catch(() => [])])
    const 본 = new Set()
    for (const y of [...fr, ...(Array.isArray(b) ? b : [])]) {
      if (!y || !y.no || 본.has(String(y.no))) continue
      본.add(String(y.no)); 일순위.push({ no: y.no, name: y.name, dt: String(y.dt || ''), win: y.win })
    }
  } catch (e) { console.error('1순위 묶음 못 받음:', e && e.message) }
  /* 고친 화면 — public/fixes.json {r: [{p, d, m}]} */
  let 고침 = []
  if (사람들.some((r) => 기억[r] && String(기억[r].tools || '').trim())) {
    try { const fx = await 받기('/fixes.json'); 고침 = Array.isArray(fx && fx.r) ? fx.r : [] } catch (e) { /* 없으면 이 칸만 빠짐 */ }
  }
  const 지난들 = (await d.ref('/watch_day_last').get()).val() || {}
  let 보낸 = 0, 요약보낸 = 0
  for (const r of 사람들) {
    const c = 기억[r] && typeof 기억[r] === 'object' ? 기억[r] : null
    const 부터 = Math.max(Number(지난들[r]) || 0, M.거슬러())      /* 🗓 월요일이면 금요일 10시 무렵부터(쉬는 날 공고까지) */
    await d.ref(`/watch_day_last/${r}`).set(Date.now())
    const 머리 = M.사이말(부터)                        /* «지난 하루» · 월요일 «주말 사이» · 연휴 뒤 «연휴 사이» */
    let 알림 = c ? M.글(M.한사람(c, 부터, { 공고, 일순위, 고침 }), c, 머리) : null
    if (알림) 보낸 += 1
    else { 알림 = M.요약(공고, 일순위, 부터, 머리); if (알림) 요약보낸 += 1 }
    if (!알림) continue
    await 종한줄(d, r, { k: 'new', m: `${알림.title} — ${알림.body}`, u: 알림.url, at: Date.now() })
    await 푸시보내기(d, [r], 알림)
  }
  try { await d.ref('/fresh/stat/alert/sent').set({ 칸, n: 보낸, 요약: 요약보낸, at: Date.now() }) } catch (e) { /* 숫자만 */ }
}

/* 📊 알림 수 — 숫자만(번호 · 주소 없음) · 소장님 「알람신청 있었어??? 카운트 하고 있어??」(2026-10-09)
   fresh/stat/alert = {at, push, cond, watch, watchP, day, auto, off, rg, lic, kw, tools, sent{칸, n, 요약}} — 사이트에는 안 보이고, 물으시면 클로드가 읽어 알려 드림
     push = 폰 알림 허용 기기 · cond = 내 조건 알림 신청 · watch / watchP = 담은 공고 수 / 사람 · day = 하루 한 번 받을 사람(신청 안 함)
     auto = 기억 조건이 있는 기기 · off = 하루 한 번 끈 기기 · rg · lic · kw · tools = 기억 조건 가운데 그 칸이 있는 수 */
async function 세어두기(d, { 푸시, 신청, 담음, 담은사람, 기억, 사람들 }) {
  const as = Object.values(기억 || {}).filter((c) => c && typeof c === 'object')
  const 켬 = as.filter((c) => !c.off)
  const 몇 = (k) => 켬.filter((c) => String(c[k] || '').trim()).length
  await d.ref('/fresh/stat/alert').update({
    at: Date.now(), push: Object.keys(푸시).length, cond: Object.keys(신청).length,
    watch: Object.keys(담음).length, watchP: 담은사람.size, day: 사람들.length,
    auto: 켬.length, off: as.length - 켬.length,
    rg: 켬.filter((c) => c.rg && c.rg !== '전국').length, lic: 몇('lic'), kw: 몇('kw'), tools: 몇('tools'),
  })
}

exports.freshNotify = onValueWritten(
  { ...푸시옵션, ref: '/fresh/meta/{name}', timeoutSeconds: 120, memory: '512MiB' },
  async (event) => {
    if (!event.data.after.exists()) return
    const d = 자료()
    try {
      if (event.params.name === 'first') await 담은공고(d)
      else if (event.params.name === 'live') {
        await 조건묶음(d)                         /* 📍 내 조건 신청 — 하루 두 번(8시 · 13시) · 하던 대로 */
        try { await 하루한통(d) } catch (e) { console.error('하루 한 통 실패:', e && e.message) }   /* 📢 신청 안 한 분 — 오전 10시 한 번 */
      }
    } catch (e) {
      console.error('freshNotify 실패:', e && e.message)
    }
  }
)
