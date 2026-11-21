/**
 * 🏛 G808 (2026-11-20) 바로투찰 «🏛 종심제 계산» 카드 — 바로투찰 종심제 기획 ⑤(화면)
 *   소장님 11-20 「바로투찰이 계산하지 않는다고 하는데, 100억 이상도 해야 하지 않아?」 → 기획서 → 「다섯가지 다 하자」 → 「보내고, 바로투질 작업해줘」
 *   종심제 · 종합평가 공고(낙찰방법 «종합심사» · «종합평가»)에서 «⛔ 이 공고는 계산기를 쓰면 안 됩니다» 카드 자리에 뜹니다(그 밖 하한율 없는 방식은 예전 그대로).
 *   ① 균형가격 예상(기초금액의 %) ② 내 금액의 가격점수 ③ 금액 고르기 세 줄 ④ 내기 전 확인 ⑤ 내역서
 *   · 자료: /data/jongsim.json(종심예측.py) — 맞춰 보기(마지막 3개월 · 80% 범위 적중 75% 이상 · 30건 이상)를 넘었을 때만 «예상» · 금액 고르기를 냄.
 *   🛠 G812 (11-21) 소장님 «넓힌 범위로 열기» — 90% 범위(lo ~ hi) · 매일 맞춰 보기(그날 앞 자료로 그날) · 갈래마다 15건 · 75% 넘는 갈래만 «예상»(lib/종심고르기.js 예상열림) ·
 *     화면에 그 갈래의 실제 적중률을 같이 적음 · 떨어지면 저절로 «지난 개찰 분포(참고)».
 *     못 넘었으면 «지난 개찰 분포(참고)» 만 · 자료가 없으면 «자료 모으는 중».
 *   · 점수 식: lib/종심셈.js(예규 [별표 3] · 조달청 [별표 4]) · 셈: lib/종심고르기.js
 *   · ⚠️ 공사수행능력 · 사회적책임 점수는 회사마다 달라 건설맵이 매기지 않음 · «낙찰 보장» 같은 말 안 씀.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJSON } from './lib/data.js'
import { won } from './lib/fmt.js'
import { 금액뿐 } from './lib/금액읽기.js'
import { 종심갈래 } from './lib/종심셈.js'
import { 갈래글, 묶음고르기, 점수보기, 세줄, 예정어림, 순공사하한, 동점글, 범위끝, 갈래성적, 예상열림 } from './lib/종심고르기.js'
import { 세기 } from './lib/받은수.jsx'

const 퍼 = (v, 자리 = 2) => (v == null || !Number.isFinite(Number(v)) ? '-' : `${Number(v).toFixed(자리)}%`)
const 점 = (v) => (v == null || !Number.isFinite(Number(v)) ? '-' : Number(v).toFixed(3))
const 확인줄 = [   /* 계약예규 제8조① 균형가격 셈에서 빼는 입찰(1 ~ 7 · 8 기타는 세부기준) — notes/종심제_원문.txt(11-20 크롬 세 번째) */
  '입찰서 금액과 산출내역서 금액이 같음',
  '예정가격 이하 · 예정가격의 70% 이상',
  '이윤 · 세부공종에 음(−)의 금액이 없음(발주기관 금액이 음이면 예외)',
  '지정 · 법정 금액(보험료 등) 합계가 정해진 금액의 99.7% 이상',
  '표준시장단가 세부공종이 99.7% 이상',
  '직접노무비가 80% 이상',
  '3인 이상 같은 금액은 균형가격 셈에 1개만 들어감(2026.8.25. 신설)',
]

function 복사(text) {
  let ok = false
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0'
    document.body.appendChild(ta)
    ta.select(); ta.setSelectionRange(0, text.length)
    ok = document.execCommand('copy')
    document.body.removeChild(ta)
  } catch { /* 아래 */ }
  try { navigator.clipboard?.writeText(text) } catch { /* noop */ }
  return ok
}

/** 띠 그림 — 5 ~ 95분위 폭 · 범위 띠(🛠 G812 90% — 범위끝) · 가운데 · 내 금액(%) */
function 띠그림({ 통, 내율 }) {
  const lo = 통.d[0] - 0.5, hi = 통.d[통.d.length - 1] + 0.5
  const [끝1, 끝2] = 범위끝(통)
  const x = (p) => `${Math.max(0, Math.min(100, ((p - lo) * 100) / (hi - lo)))}%`
  const 밖 = 내율 != null && (내율 < lo || 내율 > hi)
  return (
    <div className="jsc-band" aria-hidden="true">
      <div className="jsc-bar" />
      <div className="jsc-in" style={{ left: x(끝1), width: `calc(${x(끝2)} - ${x(끝1)})` }} />
      <div className="jsc-mid" style={{ left: x(통.q50) }} />
      {내율 != null && <div className={'jsc-me' + (밖 ? ' out' : '')} style={{ left: x(내율) }} />}
      <div className="jsc-lab" style={{ left: x(끝1) }}>{퍼(끝1, 1)}</div>
      <div className="jsc-lab r" style={{ left: x(끝2) }}>{퍼(끝2, 1)}</div>
    </div>
  )
}

/** 🛠 G812 «예상» 을 안 내는 까닭 한 줄 — 표본 적음(위 ⚠️ 줄이 말함) · 성적 확인 전 · 옛 판(전체 맞춰 보기) · 갈래 맞춰 보기 없음 · 15건 미만 · 75% 미만 */
function 안보임까닭(판, 통, 갈성, 갈이름) {
  const 맞 = (판 && 판.맞춤) || {}
  if (통 && 통.표본적음) return null
  if (판 && !판.확인) {
    const g = 갈성 || (맞.n ? 맞 : null)
    return g ? <>지난 3개월 맞춰 보기 {g.적중}/{g.n}건({g.율}%) — 성적을 점검하는 중이라 아직 «예상» 으로 쓰지 않습니다.</> : <>성적을 점검하는 중이라 아직 «예상» 으로 쓰지 않습니다.</>
  }
  if (!판 || !Array.isArray(판.갈래보임)) {   /* 옛 판 — 전체 맞춰 보기 */
    return 맞.n ? <>마지막 3개월로 맞춰 보니 범위에 든 비율이 <b>{맞.율}%</b>({맞.적중}/{맞.n}건)라 기준(75%)에 못 미쳐 «예상» 으로 쓰지 않습니다.</>
      : <>맞춰 볼 개찰이 아직 모자랍니다({(판 && 판.n) || 0}건).</>
  }
  if (!갈성) return <>이 갈래({갈이름})는 맞춰 볼 개찰이 아직 모자랍니다.</>
  if (갈성.n < 15) return <>이 갈래({갈이름})는 맞춰 본 개찰이 아직 {갈성.n}건뿐(15건 미만)이라 «예상» 으로 쓰지 않습니다.</>
  return <>지난 3개월을 매일 맞춰 보니 이 갈래({갈이름}) 범위에 든 비율이 <b>{갈성.율}%</b>({갈성.적중}/{갈성.n}건)라 기준(75%)에 못 미쳐 «예상» 으로 쓰지 않습니다.</>
}

export default function 종심카드({ base, est, 공고, 답자리 = null }) {
  const 갈 = 종심갈래(공고?.swin, est || 공고?.est)
  const [판, set판] = useState(undefined)
  const [내, set내] = useState('')
  const [고른, set고른] = useState('')
  const [됨, set됨] = useState('')
  const [체크, set체크] = useState(() => 확인줄.map(() => false))
  useEffect(() => {
    let 살 = true
    getJSON('/data/jongsim.json').then((v) => { if (살) set판(v || null) }).catch(() => { if (살) set판(null) })
    return () => { 살 = false }
  }, [])
  useEffect(() => { if (갈) 세기('|종심카드|봄') }, [공고?.no])   // eslint-disable-line react-hooks/exhaustive-deps
  const 통 = useMemo(() => (판 && 갈 ? 묶음고르기(판, 갈[0], 공고?.inst, est || 공고?.est, 공고?.main) : null), [판, 갈?.[0], 공고?.inst, 공고?.main, est])   // eslint-disable-line react-hooks/exhaustive-deps
  const 보임 = 예상열림(판, 통, 갈?.[0])   /* 🛠 G812 성적 확인 + 이 갈래가 매일 맞춰 보기 15건 · 75% 이상(옛 판은 전체 보임) */
  const 갈성 = 판 && 갈 ? 갈래성적(판, 갈[0]) : null
  const [끝1, 끝2] = 범위끝(통)
  const 범위이름 = 통 && 통.lo != null ? '90%' : '80%'
  const 배점 = 갈 ? 갈[1] : 50
  const 줄들 = useMemo(() => (보임 ? 세줄(통, base, 배점) : []), [보임, 통, base, 배점])
  const 내금 = 금액뿐(내) || 0
  const 내점 = 보임 && 내금 > 0 ? 점수보기(내금, 통, base, 배점) : null
  const 예정 = 통 ? 예정어림(통, base) : 0
  const 순하 = 통 ? 순공사하한(공고?.pc, 예정, base) : 0
  const 맞 = 판?.맞춤 || {}
  if (!갈) return null
  const 고르기 = (줄) => {
    set고른(줄.이름)
    const ok = 복사(String(줄.T))
    set됨(ok ? `${won(줄.T)} 복사됨` : `${won(줄.T)} — 길게 눌러 복사하세요`)
    세기(`|종심카드|고름-${줄.이름}`)
  }
  return (
    <div className="card jsc" ref={답자리}>
      <div className="detail-h">🏛 종심제 계산 <span className="jsc-tag">{갈래글[갈[0]] || 갈[0]} · 가격 {배점}점</span></div>
      {/* 🛠 G813 공고기관이 조달청 · 지자체가 아니면(공기업 · 기관 자체 기준) — 배점 · 식 · 균형가격 셈이 다를 수 있음(나라장터엔 드묾 · 1년 6건) */}
      {!/^조달청/.test(String(공고?.inst || '').trim()) && 갈[0] !== '지방종평' && (
        <div className="note sm jsc-own">⚠️ 조달청 공고가 아닙니다 — 공기업 · 기관은 자체 심사기준(배점 · 가격점수 식 · 균형가격 셈)이 다를 수 있으니 공고서의 심사기준을 꼭 확인하세요. 아래 셈은 계약예규 · 조달청 기준입니다.</div>
      )}
      <div className="kv2">
        <div><span>기초금액</span><b>{won(base)}</b></div>
        <div><span>추정가격</span><b>{won(est || 공고?.est || 0)}</b></div>
        <div><span>낙찰방법</span><b>{String(공고?.swin || '').slice(0, 60) || '종합심사'}</b></div>
      </div>

      {판 === undefined ? <div className="note sm">지난 종심제 개찰 자료를 불러오는 중…</div>
        : !통 ? (
          <div className="jsc-box">
            <b>① 균형가격 예상 — 자료 모으는 중</b>
            <div className="note sm">건설맵이 나라장터에 공개된 업체별 투찰 금액으로 지난 1년 종심제 개찰의 균형가격을 다시 셈해 모으고 있습니다.
              다 모이고 맞춰 보기를 넘으면 이 자리에 예상 범위가 저절로 뜹니다.</div>
          </div>
        ) : !보임 ? (
          <div className="jsc-box">
            <b>① 지난 개찰 분포(참고 · 예상 아님)</b>
            <div className="jsc-big">기초금액의 {퍼(끝1)} ~ {퍼(끝2)} <small>(가운데 {퍼(통.q50)} · {통.n}건)</small></div>
            {통.표본적음 && <div className="note sm jsc-thin">⚠️ 이 갈래({갈래글[갈[0]] || 갈[0]})는 지난 개찰이 {통.n}건뿐(20건 미만)이라 참고만 하세요 — 자료가 더 모이면 저절로 바뀝니다.</div>}
            <띠그림 통={통} 내율={null} />
            <div className="note sm">
              {안보임까닭(판, 통, 갈성, 갈래글[갈[0]] || 갈[0])}{' '}금액 고르기는 {통.표본적음 ? '자료가 모이고 ' : ''}기준을 넘으면 뜹니다.
            </div>
          </div>
        ) : (
          <>
            <div className="jsc-box">
              <b>① 균형가격 예상</b>
              <div className="jsc-big">기초금액의 {퍼(끝1)} ~ {퍼(끝2)} <small>(가운데 {퍼(통.q50)})</small></div>
              <div className="jsc-won">{won(Math.floor(base * 끝1 / 100))} ~ {won(Math.floor(base * 끝2 / 100))}</div>
              <띠그림 통={통} 내율={내금 > 0 ? (내금 * 100) / base : null} />
              <div className="note sm">지난 종심제 개찰 {통.n}건{통.열쇠 !== '전체' ? `(${통.열쇠.split('|').filter((x) => x && x !== '-1').slice(0, 2).join(' · ')}${통.규칙뒤 ? ' · 같은 금액 규칙 뒤' : ''})` : ''}의 «균형가격 ÷ 기초금액» {범위이름} 범위 ·
                {갈성 ? <> 지난 3개월을 매일 그날 앞 자료로 맞춰 보니 이 갈래 {갈성.적중}/{갈성.n}건 들어맞음({갈성.율}%).</> : <> 마지막 3개월 맞춰 보기 {맞.적중}/{맞.n}건 들어맞음({맞.율}%).</>}</div>
            </div>

            <div className="jsc-box">
              <b>② 내 금액의 가격점수</b>
              <div className="jsc-inrow">
                <input className="inp" inputMode="numeric" value={내} onChange={(e) => set내(e.target.value)} placeholder={`예: ${Math.floor(base * 통.q50 / 100 / 1000) * 1000}`} aria-label="내 투찰 금액" />
                <i>원</i>
              </div>
              {내금 > 0 && 내점 && (
                <div className="jsc-me-row">
                  기초금액의 <b>{퍼(내점.율, 3)}</b> · 예상 가격점수 <b>{점(내점.가운데)}</b>점(가운데 기준) · 범위 끝에서 {점(내점.최저)}점 · 기대 {점(내점.기대)}점
                  {순하 > 0 && 내금 < 순하 && <div className="nm-warn">⚠️ 예정가격 중 순공사원가(재료비 · 노무비 · 경비 + 부가세)의 98%(약 {won(순하)}) 아래 — 예정가격 100억 미만 공사는 낙찰자에서 제외됩니다(제13조③).</div>}
                </div>
              )}
            </div>

            <div className="jsc-box">
              <b>③ 금액 고르기</b>
              <div className="jsc-rows" role="list">
                {줄들.map((줄) => (
                  <button key={줄.이름} type="button" role="listitem" className={'jsc-row' + (고른 === 줄.이름 ? ' on' : '') + (줄.이름 === '가운데' ? ' mid' : '')} onClick={() => 고르기(줄)}>
                    <span className="n">{줄.이름}</span>
                    <span className="a">{won(줄.T)}</span>
                    <span className="p">기초의 {퍼(줄.율, 3)}</span>
                    <span className="s">기대 {점(줄.기대)}점 · 끝 {점(줄.최저)}점</span>
                    {순하 > 0 && 줄.T < 순하 && <span className="w">⚠️ 순공사원가 98% 아래(제13조③)</span>}
                  </button>
                ))}
              </div>
              {됨 && <div className="note sm" role="status">📋 {됨}</div>}
              <div className="note sm">«기대» = 균형가격이 예상 띠 어디에 오든 평균 점수 · «끝» = {범위이름} 범위 끝에 왔을 때 점수 · 예정가격은 지난 개찰의 «예정 ÷ 기초» 가운데로 어림({won(예정)}).
                {' '}{동점글(통)}.</div>
            </div>
          </>
        )}

      <details className="jsc-box jsc-chk">
        <summary><b>④ 내기 전 확인</b> — 균형가격 셈에서 빠지는 입찰(예규 제8조)</summary>
        {확인줄.map((t, i) => (
          <label key={i}><input type="checkbox" checked={체크[i]} onChange={() => set체크((a) => a.map((v, j) => (j === i ? !v : v)))} /> {t}</label>
        ))}
      </details>

      <div className="jsc-box">
        <b>⑤ 산출내역서</b>
        <div className="note sm">종심제는 입찰서와 함께 산출내역서를 냅니다.{' '}
          <Link to="/naeyeok" onClick={() => 세기('|종심카드|내역서')}>📑 건설맵 내역서 도구</Link>
          {' · '}
          <a href={`/contact?k=cn&s=${encodeURIComponent('내역서')}&t=${encodeURIComponent('종심제 산출내역서')}`} onClick={() => 세기('|종심카드|대행')}>📄 내역서 작성대행 문의</a>
        </div>
        {/* 🛠 G814 (11-21 「종심제 오늘중 마무리」 ④) 단가심사(감점) — 계약예규 [별표 3] 2. 나(원문 PDF · notes/원문 · 세 번) · 지방 종합평가는 행안부 기준이라 뺌 */}
        {갈[0] !== '지방종평' && (
          <div className="note sm jsc-dan">⚠️ <b>단가심사(감점)</b> — 세부공종 입찰단가가 기준단가({갈[0] === '간이형' ? '예정가격 90 ~ 100% + 균형단가 0 ~ 10%' : '예정가격 70% + 균형단가 30%'})의{' '}
            <b>±{갈[0] === '간이형' ? 12 : 17}%</b> 밖이면 그 공종 금액 비중만큼 감점됩니다(고정비용 비중 20% 이상 공사는 공고에서 ±{갈[0] === '간이형' ? 15 : 21}%까지 넓힐 수 있음 · 계약예규 [별표 3] · 자세한 셈은 공고의 세부기준).</div>
        )}
      </div>

      <details className="jsc-why">
        <summary>근거 보기</summary>
        <div className="note sm">
          · 가격점수 = √(1 − ((투찰 − 균형) ÷ (예정 − 균형))²) × 배점(계약예규 «공사계약 종합심사낙찰제 심사기준» [별표 3] · 조달청 세부기준 [별표 4] — 계수 1.0) · 소수 넷째자리 반올림.<br />
          · 균형가격 = 빼고 자른 뒤 남은 입찰금액의 산술평균(예규 제8조 · 조달청 세부기준 제7조) — 20개 넘음 위 · 아래 20% / 10 ~ 20개 위 40 · 아래 10% / 10개 미만 위 50% · 맨 아래 1개.<br />
          · 건설맵의 균형가격은 나라장터에 공개된 업체별 금액으로 다시 셈한 <b>근사값</b>입니다(내역서 불일치 · 99.7% · 노무비 80% 같은 빼기는 공개 자료로 알 수 없음).<br />
          · 가격점수는 총점의 일부입니다 — 공사수행능력 · 사회적책임 등 가격 밖 점수는 회사 자료로 보세요.
        </div>
      </details>
      {공고?.url && <a className="jsc-g2b" href={공고.url} target="_blank" rel="noreferrer">나라장터에서 공고서 열기 ↗</a>}
    </div>
  )
}
