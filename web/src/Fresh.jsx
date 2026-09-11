/* ==========================================================
   자료 기준 시각 — 「지금 보고 있는 것이 언제 것인가」

   2026-09-07 에 조달청 연결이 막혀 자료가 5시간 멈췄는데,
   화면에는 아무 표시가 없어서 소장님이 직접 눈으로 알아채야 했습니다.
   («오늘자 공고 및 1순위 11시30분에 멈췄어»)

   ⚠️ overview.json 의 built(마지막 집계)를 쓰면 안 됩니다.
      집계·빌드·배포는 수집이 실패해도 그대로 돕니다 — 그래서 한 줄도 못 받은
      회차도 «방금 갱신» 으로 보입니다. 그게 바로 그날의 착시였습니다.
      여기서는 collect.py 가 «실제로 받았는가» 를 적어 둔 health.json 만 봅니다.

   판단은 이 파일 한 곳에만 적습니다 — 1순위·공고 두 화면이 같은 것을 씁니다.
   ========================================================== */
import { useEffect, useState } from 'react'
import { getHealth } from './lib/data.js'
import { kstParts, firstNote } from './lib/freshnote.js'

/* 한국시간의 «시»와 «요일» 은 lib/freshnote.js 한 곳에서만 정합니다 (두 벌 금지). */
const kst = kstParts

/** health.json 을 사람 말로 옮깁니다. 화면 두 곳이 이 함수 하나만 씁니다. */
export function readHealth(h, now = new Date()) {
  if (!h || !h.at) return null
  const at = Date.parse(String(h.at).replace(' ', 'T') + ':00+09:00')
  if (!at) return null
  const mins = Math.max(0, Math.round((now.getTime() - at) / 60000))
  const { h: kh, day } = kst(now)
  // 갱신은 평일 08~19시에만 돕니다. 밤·주말에 «늦었다» 고 하면 거짓 경고입니다.
  const working = day >= 1 && day <= 5 && kh >= 8 && kh < 19
  // 한 회차는 대략 49분 간격입니다(실측: 수집 24분 + 25분 쉬기).
  // 90분이면 두 회차를 놓친 것이라 그때부터 말합니다.
  const failed = h.ok === false
  // ⚠️ 2026-09-07 20:21 — 밤 회차가 조달청 연결에 실패하자 노란 경고가 떴습니다.
  //    소장님: 「현재 건설맵사이트에 이렇게 되어 있어…맞는 거지? 그냥 두면 돼지?」
  //    맞는 판정이지만 **놀랄 일이 아닌 것을 놀라게 했습니다.** 그 시간엔 개찰도 공고도
  //    새로 안 나옵니다. 그래서 경고(노란색)는 «갱신이 도는 시간»에만 띄우고,
  //    밤·주말에는 담담한 한 줄로만 알립니다.
  const late = working && (failed || mins > 90)
  return {
    mins,
    working,
    late,
    failed,
    ok: !failed,
    at: String(h.at),
    why: h.why || '',
    newestFirst: (h.newest && h.newest.first) || '',
    newestLive: (h.newest && h.newest.live) || '',
  }
}

const hhmm = (s) => (s || '').slice(11, 16)
const mdd = (s) => (s || '').slice(5).replace('-', '.')

function elapsed(m) {
  if (m < 60) return `${m}분째`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}시간 ${r}분째` : `${h}시간째`
}
/* 정상 줄에 붙이는 «몇 분 전». 0~1분을 「0분 전」이라 쓰면 어색해서 「방금」으로 둡니다. */
const ago = (m) => (m < 2 ? '방금' : elapsed(m).replace('째', ' 전'))

/** 목록 위에 놓는 한 줄. kind: 'first'(개찰) | 'live'(공고) */
export default function FreshBar({ kind = 'first', extra = '' }) {
  const [h, setH] = useState(null)
  const [, setTick] = useState(0)     // 1분마다 «N분째» 를 다시 그리기 위한 것뿐입니다

  useEffect(() => {
    let alive = true
    const load = () => getHealth().then((v) => { if (alive) setH(v) })
    load()
    // 탭을 열어 둔 채로 새 회차가 돌 수 있습니다. 200바이트짜리라 5분마다 받아도
    // 부담이 없습니다. 이걸 안 하면 열어둔 탭이 «멈췄다» 고 거짓말을 합니다.
    const t1 = setInterval(load, 5 * 60000)
    const t2 = setInterval(() => setTick((n) => n + 1), 60000)   // 경과 시간 다시 그리기
    return () => { alive = false; clearInterval(t1); clearInterval(t2) }
  }, [])

  const v = readHealth(h)
  if (!v) return null

  const newest = kind === 'live' ? v.newestLive : v.newestFirst
  const label = kind === 'live' ? '최신 공고' : '최신 개찰'
  /* 1순위 줄에 붙는 말은 «시각에 따라» 달라집니다 — 아침에는 「아직 시작 전」,
     낮에는 「11시에 65%」. 숫자와 판단은 lib/freshnote.js 한 곳에만 있습니다.
     부르는 쪽에서 extra 를 주면 그게 이깁니다(다른 화면에서 쓸 여지). */
  const note = extra || (kind === 'first' ? firstNote() : '')

  if (v.late) {
    return (
      <div className="freshbar warn">
        <b>⚠️ 자료가 {elapsed(v.mins)} 그대로입니다</b>
        {/* ⚠️ 「5분 뒤」 같은 숫자를 적지 않습니다. 실패 3회까지는 5분이지만 그 뒤로는
              25분이고, 회차가 통째로 밀린 경우는 또 다릅니다. 지킬 수 없는 숫자를
              화면에 박으면 그 자체가 다음 거짓말이 됩니다. */}
        <span>
          조달청에서 새 자료를 받지 못하고 있습니다{v.why ? ` (${v.why})` : ''}.
          대개 조달청 쪽 일시 장애이며, 자동으로 다시 받아옵니다.
          지금 보이는 것은 {v.at} 까지의 자료입니다.
        </span>
      </div>
    )
  }

  // 밤·주말에 마지막 회차가 비었을 때 — 경고가 아니라 «사실 한 줄» 입니다.
  //   「자동으로 다시 받아옵니다」라고 쓰면 안 됩니다. 사슬은 저녁 7시에 끊기므로
  //   실제로 다시 받는 것은 **내일 아침**입니다.
  if (v.failed) {
    return (
      <div className="freshbar">
        <b>{label} {mdd(newest) || '-'}</b>
        <span>
          자료 기준 {hhmm(v.at)} · 마지막 회차에 조달청 자료를 받지 못했습니다
          {v.why ? ` (${v.why})` : ''} — 다음 갱신은 평일 아침입니다.
          그 시간에는 개찰·공고가 새로 나오지 않습니다.
        </span>
      </div>
    )
  }

  return (
    <div className="freshbar">
      <b>{label} {mdd(newest) || '-'}</b>
      {/* «자료 기준 18:07» 만 적으면 지금이 몇 시인지 알아야 뜻이 통합니다.
          소장님이 시계를 보고 뺄셈하지 않으시게 «몇 분 전» 을 같이 적습니다. */}
      <span>
        자료 기준 {hhmm(v.at)} ({ago(v.mins)})
        {v.working ? '' : ' · 갱신은 평일 08~19시에 돕니다'}
        {note ? ` · ${note}` : ''}
      </span>
    </div>
  )
}
