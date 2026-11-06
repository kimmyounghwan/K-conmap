/* ==========================================================
   📑 계약·공사 관리 도구 6가지 — 화면 (2026-09-28)
     ⚖️ subcontract-check  하도급 적정성 판정 (82% · 64%) + 직접시공 비율
     📅 after-award        낙찰 뒤 할 일 달력 (+ 담은 공고 마감) → .ics
     ⏱ delay-penalty       지체상금 계산기
     🛡 defect-period      하자담보책임기간 · 하자보수보증금 찾기
     💰 payment-deadline   기성금 · 준공금 지급 기한 (G534 · 2026-11-04 — 셈 lib/대금기한.js)
     🤝 joint-split        공동도급 기성 · 준공금 나누기 (G535 · 2026-11-04 — 셈 lib/공동기성.js)
     📦 contract-ready     계약 준비물 계산기 — 계약보증금 · 공사이행보증서 · 보증서 날짜 · 인지세 (G557 · 2026-11-06 — 셈 lib/계약준비.js)
     🧭 toejik-check       퇴직공제 가입 대상 판단기 — 당연가입 · 성립 신고 14일 · 전자카드 (G558 · 2026-11-06 — 셈 lib/퇴직공제대상.js)
     ⏳ time-extension     공기연장 때 할 일 — 연장 청구 · 보증서 · 실비 · 신고 기한 (G559 · 2026-11-06 — 할 일 lib/공기연장.js)
     🌫️ env-reports        착공 전 환경 신고 판단기 — 비산먼지 · 특정공사 · 건설폐기물 · 사업장폐기물 (G561 · 2026-11-06 — 판정 lib/환경신고.js)
     🎯 bid-eligible       입찰 참가 가능 금액 — 시공능력평가액 · 실적 제한 · 공동이행 (G562 · 2026-11-06 — 판정 lib/입찰참가.js · 화면 갈래는 «입찰 · 낙찰»)

   ⚠️ 숫자·조문은 lib/계약셈.js 한 곳에만 있습니다(💰 지급 기한 셈은 lib/대금기한.js). 여기서는 그리기만 합니다.
   ⚠️ 설명·근거 글은 web/src/data/tools.json 에 (prerender 가 같이 굽습니다).
   ⚠️ 넣은 값은 이 기기에만 남습니다(use칸). 달력 파일도 이 브라우저에서 만들어 바로 받습니다 — 서버로 가지 않습니다.
   ========================================================== */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { use칸, Row, Out } from './calcs.jsx'
import {
  발주갈래, 하도급선, 하도급판정, 직접시공판정, 직접시공표,
  낙찰뒤할일, ics만들기, 날읽기, 날차, 요일글, 해더하기, 날더하기,
  지체율표, 지체한도, 지체일수, 지체상금,
  하자표, 하자찾기, 보증금률표, 하자보증,
} from '../lib/계약셈.js'
import { loadBasket } from '../lib/basket.js'
import { 쉬는날, 퇴직공제일액표, 기한미루기 } from '../lib/해마다.js'   /* 🧭 G558 일액표 · 기한미루기 */
import { 대금기한, 날말 } from '../lib/대금기한.js'
import { 회차나누기 } from '../lib/공동기성.js'
import { 발주들 as 준비발주, 인지세, 인지세칸, 인지세표, 변경인지세, 이행보증, 보증기간, 근거 as 준비근거, 공채글, 공채근거 } from '../lib/계약준비.js'   /* 📦 G557 */
import { 종류들 as 공제종류, 발주들 as 공제발주, 건축들 as 공제건축, 가입판단, 성립기한, 전자카드 as 공제카드, 근거 as 공제근거, 할일들 as 공제할일, 아닐때 as 공제아닐때, 바뀜 as 공제바뀜, 금액풀이 as 공제금액풀이 } from '../lib/퇴직공제대상.js'   /* 🧭 G558 */
import { 발주들 as 연장발주, 까닭들 as 연장까닭, 사유들 as 연장사유, 할일 as 연장할일, 근거 as 연장근거, 지체글 as 연장지체글 } from '../lib/공기연장.js'   /* ⏳ G559 */
import { 규모칸 as 환경규모, 종류들 as 환경종류, 고른값 as 환경고른값, 장비들 as 환경장비, 가까이들 as 환경가까이, 비산먼지 as 비산판정, 특정공사 as 특정판정, 폐기물 as 폐기판정, 근거 as 환경근거, 신고들 as 환경신고들, 사업장풀이 as 환경사업장풀이, 함께 as 환경함께 } from '../lib/환경신고.js'   /* 🌫️ G561 */
import { 발주들 as 참가발주, 종류들 as 참가종류, 제한들 as 참가제한, 판정 as 참가판정, 안전선 as 참가안전선, 안전선글 as 참가안전선글, 공동셈 as 참가공동, 안내 as 참가안내, 근거 as 참가근거 } from '../lib/입찰참가.js'   /* 🎯 G562 */
import { getBidIndex, indexRows } from '../lib/data.js'
import 금액입력 from '../금액입력.jsx'   /* 💰 G544 금액 칸 — «3억 8,500만» · 붙여넣은 «385,000,000원» 도 읽음 · 칸 아래 읽은 줄(바로투찰 · 보험료와 같은 칸) */
import { 금액수, 금액말 } from '../lib/금액읽기.js'

const num = (v) => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return isFinite(n) ? n : 0 }   /* 율 · 날 · % 만 — 금액은 금() */
/* 💰 G544 금액은 금() — 전엔 num() 으로 숫자만 남겨 «3억 8,500만» → 38,500 · «12억» → 12 로 셈(칸에는 친 글이 그대로 보여 더 헷갈림) */
const 금 = 금액수
const won = (n) => (n != null && n > 0 ? Math.round(n).toLocaleString('ko-KR') + '원' : '—')
const 원 = (n) => (n != null ? Math.round(n).toLocaleString('ko-KR') + '원' : '—')
const 퍼 = (n, d = 2) => (n != null ? n.toFixed(d) + '%' : '—')
/* 💰 G544 금액 칸 — 금액입력(숫자만 치면 예전처럼 · 억 · 만도 읽음 · 칸 아래 «= 2억 5,000만 원») · 넣은 값은 숫자 글로 남김(use칸)
   예전에 남은 글(«3억 8,500만» 처럼 친 그대로)도 금() 으로 바르게 읽음 · 옛 «2억 5,000만 원» 옆 글(억만)은 칸 아래 줄 하나로 */
function 금액칸({ label, hint, value, set, placeholder }) {
  return (
    <Row label={label} hint={hint}>
      <금액입력 value={value} onValue={(n, d) => set(d)} placeholder={placeholder} />
    </Row>
  )
}
function 오늘() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function 디데이(날, 기준 = 오늘()) {
  const n = 날차(기준, 날)
  if (n == null) return ''
  return n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `${-n}일 지남`
}
const 판정칸 = ({ 종류 = 'info', children }) => <div className={'claudesay ' + 종류}><b>판정</b><span>{children}</span></div>
const 근거줄 = ({ children }) => <div className="kt-law">📜 {children}</div>

/* ══════════════════════════════════════════════════════════
   ⚖️ 하도급 적정성 판정
   ══════════════════════════════════════════════════════════ */
export function SubcontractCheck({ ex = {} }) {
  const [발주, set발주] = use칸('발주', ex.발주 ?? '국가')
  const [상당, set상당] = use칸('상당', ex.상당 ?? '')
  const [예가, set예가] = use칸('예가', ex.예가 ?? '')
  const [하도, set하도] = use칸('하도', ex.하도 ?? '')
  const [도급, set도급] = use칸('도급', ex.도급 ?? '')
  const [노무, set노무] = use칸('노무', ex.노무 ?? '')
  const [직접, set직접] = use칸('직접', ex.직접 ?? '')
  const r = 하도급판정({ 발주, 상당금액: 금(상당), 예정가격: 금(예가), 하도급금액: 금(하도) })
  const j = 직접시공판정({ 도급금액: 금(도급), 총노무비: 금(노무), 직접노무비: 금(직접) })
  const 미달글 = [r.미달82 ? `상당금액의 ${하도급선.상당}% 미달` : '', r.미달64 ? `예정가격의 ${하도급선.예가}% 미달` : ''].filter(Boolean).join(' · ')
  return (
    <div className="tool">
      <div className="kt-h">⚖️ 하도급 금액이 적정한가</div>
      <div className="tl-grid">
        <Row label="발주자">
          <select value={발주} onChange={(e) => set발주(e.target.value)}>
            {발주갈래.map((x) => <option key={x.k} value={x.k}>{x.n}</option>)}
          </select>
        </Row>
        <금액칸 label="하도급계약금액" hint="원" value={하도} set={set하도} placeholder="200,000,000" />
        <금액칸 label="도급금액 중 하도급부분 상당금액" hint="원 · 아래 설명" value={상당} set={set상당} placeholder="250,000,000" />
        <금액칸 label="하도급부분의 발주자 예정가격" hint="원 · 모르면 비움" value={예가} set={set예가} placeholder="260,000,000" />
      </div>
      <div className="hint kt-hint">
        <b>상당금액</b> = 하도급할 부분을 우리 <b>산출내역서 계약단가</b>(직접·간접 노무비, 재료비, 경비)로 셈한 금액 + 일반관리비·이윤·부가세.
        {' '}<b>빼는 것</b>: 우리가 하수급인에게 직접 대 주는 자재비, 하도급대금 지급보증서 발급 비용처럼 법령상 우리가 부담하는 금액.
      </div>
      <Out items={[
        { k: `상당금액의 ${하도급선.상당}% 선`, v: r.상당선 != null ? 원(Math.ceil(r.상당선)) : '—' },
        { k: `예정가격의 ${하도급선.예가}% 선`, v: r.예가선 != null ? 원(Math.ceil(r.예가선)) : '—' },
        { k: '하도급금액 ÷ 상당금액', v: 퍼(r.상당율) },
        { k: '하도급금액 ÷ 예정가격', v: 퍼(r.예가율) },
        { k: '적정성 심사', v: r.대상 == null ? '—' : r.대상 ? '심사 대상' : '대상 아님', big: true },
      ]} />
      {r.대상 != null && (
        r.대상
          ? <판정칸 종류="bad">
              {미달글} — 발주자가 하수급인의 시공능력·하도급계약 내용의 적정성을 심사하는 대상입니다.
              {' '}{r.갈.의무 ? <b>이 발주자(국가·지자체·공공기관)는 반드시 심사합니다.</b> : <>민간 발주자는 심사할 수 있습니다.</>}
              {' '}부적정하면 하수급인이나 계약 내용을 바꾸라고 요구받을 수 있습니다(하도급 통보를 받은 날부터 30일 안에 서면).
              {r.최소 ? <> 심사 대상에서 벗어나려면 하도급금액이 <b>{원(r.최소)}</b> 이상이어야 합니다.</> : null}
            </판정칸>
          : <판정칸 종류="good">넣으신 금액으로는 {하도급선.상당}% · {하도급선.예가}% 선을 모두 넘습니다 — 금액 때문에 심사 대상이 되지는 않습니다.</판정칸>
      )}
      <근거줄>건설산업기본법 제31조 · 시행령 제34조①(82% · 64%) · ②(공공기관) · ③(30일 서면) — 시행 2026.6.23. 현행</근거줄>

      <div className="kt-h" style={{ marginTop: 8 }}>🔨 직접시공 비율 (도급 70억 원 미만)</div>
      <div className="tl-grid">
        <금액칸 label="도급금액" hint="원" value={도급} set={set도급} placeholder="1,200,000,000" />
        <금액칸 label="산출내역서 총 노무비" hint="원" value={노무} set={set노무} placeholder="300,000,000" />
        <금액칸 label="우리가 직접 시공할 부분의 노무비" hint="원" value={직접} set={set직접} placeholder="70,000,000" />
      </div>
      <Out items={[
        { k: '도급금액 구간', v: j.칸 ? `${j.칸.글} → ${j.칸.율}%` : j.해당없음 ? '70억 원 이상 — 의무 없음' : '—' },
        { k: '직접 시공해야 할 노무비', v: j.기준 != null ? 원(j.기준) : '—' },
        { k: '지금 직접 시공 비율', v: 퍼(j.지금율, 1) },
        { k: '직접시공', v: j.충족 == null ? '—' : j.충족 ? '충족' : `${원(j.모자람)} 모자람`, big: true },
      ]} />
      <div className="hint kt-hint">
        비율: {직접시공표.map((x) => `${x.글} ${x.율}%`).join(' · ')}. 발주자가 품질·능률을 위해 서면으로 승낙했거나, 특허·신기술 부분을 그 기술을 가진 업체에 하도급하면 예외입니다.
        {' '}직접시공계획은 계약한 날부터 30일 안에 발주자에게 통보합니다. 통보하지 않아도 되는 것: 전문공사를 그 전문업종으로 받은 경우 · 1건 도급금액 4천만 원 미만<b>이면서</b> 공사기간 30일 이내인 공사(둘 다 맞아야 함).
      </div>
      <근거줄>건설산업기본법 제28조의2 · 시행령 제30조의2</근거줄>
      <div className="kt-next">하도급 통보(30일)·지급보증서(30일)·대금 지급(15일) 날짜는 <Link to="/tools/after-award">📅 낙찰 뒤 할 일 달력</Link>에서 한 번에 뽑습니다.</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   📅 낙찰 뒤 할 일 달력
   ══════════════════════════════════════════════════════════ */
function 받기(이름, 글, 꼴) {
  try {
    const url = URL.createObjectURL(new Blob([글], { type: 꼴 }))
    const a = document.createElement('a')
    a.href = url; a.download = 이름
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  } catch (e) { /* 막힌 브라우저 */ }
}
function use담은공고() {
  const [줄, set줄] = useState(null)
  useEffect(() => {
    let 살 = true
    const 담 = loadBasket()
    if (!담.length) { set줄([]); return }
    getBidIndex().then((idx) => {
      if (!살) return
      const rows = indexRows(idx)
      const by = new Map(rows.map((x) => [String(x.no), x]))
      set줄(담.map((no) => by.get(String(no))).filter(Boolean).map((x) => ({
        no: x.no, name: x.name, close: String(x.close || '').slice(0, 16),
        협정: Array.isArray(x.jnt) && x.jnt[5] ? String(x.jnt[5]).slice(0, 16) : '',
      })))
    }).catch(() => { if (살) set줄([]) })
    return () => { 살 = false }
  }, [])
  return 줄
}
export function AfterAward({ ex = {} }) {
  const [낙찰일, set낙찰일] = use칸('낙찰일', ex.낙찰일 ?? '')
  const [계약일, set계약일] = use칸('계약일', ex.계약일 ?? '')
  const [착공일, set착공일] = use칸('착공일', ex.착공일 ?? '')
  const [발주, set발주] = use칸('발주', ex.발주 ?? '국가')
  const [도급, set도급] = use칸('도급', ex.도급 ?? '')
  const [est, setEst] = use칸('추정', ex.추정 ?? '')   /* 이름 est — tools/checklabels.py 가 «추정가격» 이름표에 est 를 찾습니다 */
  const [공기, set공기] = use칸('공기', ex.공기 ?? '')
  const [전문, set전문] = use칸('전문', ex.전문 ?? false)
  const [유해, set유해] = use칸('유해', ex.유해 ?? false)
  const [안전, set안전] = use칸('안전', ex.안전 ?? false)
  const [전기, set전기] = use칸('전기', ex.전기 ?? false)
  const [하도일, set하도일] = use칸('하도일', ex.하도일 ?? '')
  const [하도금, set하도금] = use칸('하도금', ex.하도금 ?? '')
  const [담기, set담기] = use칸('담기', true)
  const 담은 = use담은공고()
  const 일 = useMemo(() => 낙찰뒤할일({
    낙찰일, 계약일, 착공일, 발주, 도급금액: 금(도급), 추정가격: 금(est), 공기: num(공기),
    전문, 유해, 안전, 전기, 하도급일: 하도일, 하도급금액: 금(하도금),
  }), [낙찰일, 계약일, 착공일, 발주, 도급, est, 공기, 전문, 유해, 안전, 전기, 하도일, 하도금])
  const 담은일 = useMemo(() => {
    const out = []
    for (const x of 담은 || []) {
      const d = x.close.slice(0, 10)
      if (날읽기(d) != null) out.push({ 열쇠: 'bid' + x.no, 날: d, 제목: `⭐ 입찰 마감 ${x.close.slice(11)} — ${x.name}`, 글: `공고번호 ${x.no}`, 근거: '' })
      const h = x.협정.slice(0, 10)
      if (날읽기(h) != null) out.push({ 열쇠: 'jnt' + x.no, 날: h, 제목: `🤝 공동수급 협정서 마감 ${x.협정.slice(11)} — ${x.name}`, 글: `공고번호 ${x.no}`, 근거: '' })
    }
    return out.filter((x) => (날차(오늘(), x.날) ?? -1) >= 0)
  }, [담은])
  const 날있는 = 일.filter((x) => x.날)
  const 날없는 = 일.filter((x) => !x.날)
  const 달력용 = [...날있는, ...(담기 ? 담은일 : [])]
  const 받자 = () => 받기('K-건설맵_낙찰뒤할일.ics', ics만들기(달력용, { 이름: 'K-건설맵 낙찰 뒤 할 일' }), 'text/calendar;charset=utf-8')
  const 체크 = (v, set, 글, 곁 = null) => (
    <label className="kt-chk"><input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} /> <span>{글}{곁}</span></label>
  )
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="낙찰 통지 받은 날"><input type="date" value={낙찰일} onChange={(e) => set낙찰일(e.target.value)} /></Row>
        <Row label="계약한 날" hint="아직이면 비움"><input type="date" value={계약일} onChange={(e) => set계약일(e.target.value)} /></Row>
        <Row label="착공(예정)일"><input type="date" value={착공일} onChange={(e) => set착공일(e.target.value)} /></Row>
        <Row label="발주자">
          <select value={발주} onChange={(e) => set발주(e.target.value)}>
            {발주갈래.map((x) => <option key={x.k} value={x.k}>{x.n}</option>)}
          </select>
        </Row>
        <금액칸 label="도급(계약)금액" hint="원" value={도급} set={set도급} placeholder="850,000,000" />
        <금액칸 label="추정가격" hint="원 · 모르면 비움" value={est} set={setEst} placeholder="" />
        <Row label="공사기간" hint="일"><input inputMode="numeric" value={공기} onChange={(e) => set공기(e.target.value)} placeholder="180" /></Row>
      </div>
      <div className="kt-chks">
        {체크(전문, set전문, '전문공사를 전문업종으로 받았음 (직접시공계획 통보 없음)')}
        {체크(유해, set유해, '유해·위험방지계획서 대상', <> — <Link to="/safety">대상인지 보기</Link></>)}
        {체크(안전, set안전, '안전관리계획서 대상', <> — <Link to="/safety">대상인지 보기</Link></>)}
        {체크(전기, set전기, '전기공사 (시공관리책임자 지정 통지)')}
      </div>
      <div className="tl-grid">
        <Row label="하도급계약 맺은 날" hint="하도급 없으면 비움"><input type="date" value={하도일} onChange={(e) => set하도일(e.target.value)} /></Row>
        <금액칸 label="하도급금액" hint="원" value={하도금} set={set하도금} placeholder="120,000,000" />
      </div>

      {!낙찰일 && !착공일 && !하도일
        ? <div className="note sm">낙찰 통지 받은 날부터 넣어 보십시오. 날짜가 정해지는 할 일만 달력에 올립니다.</div>
        : (
          <div className="kt-list">
            {날있는.map((x) => (
              <div className={'kt-it' + ((날차(오늘(), x.날) ?? 0) < 0 ? ' past' : '')} key={x.열쇠}>
                <div className="kt-d"><b>{x.날}</b> ({요일글(x.날)})<em>{디데이(x.날)}</em>{x.미룬날 && <small className="kt-m">쉬는 날 → {x.미룬날.slice(5)}({요일글(x.미룬날)})까지</small>}</div>
                <div className="kt-b"><div className="kt-t">{x.제목}</div><div className="kt-g">{x.글}</div><div className="kt-law">📜 {x.근거}</div></div>
              </div>
            ))}
            {날없는.map((x) => (
              <div className="kt-it rule" key={x.열쇠}>
                <div className="kt-d"><b>{x.종류 === '늘' ? '그때마다' : '날짜 넣으면'}</b></div>
                <div className="kt-b"><div className="kt-t">{x.제목}</div><div className="kt-g">{x.글}</div><div className="kt-law">📜 {x.근거}</div></div>
              </div>
            ))}
          </div>
        )}

      {담은 && 담은일.length > 0 && (
        <div className="kt-bag">
          <div className="kt-h">⭐ 담은 공고 {담은일.length}가지 마감</div>
          {담은일.slice(0, 12).map((x) => <div className="kt-bagit" key={x.열쇠}><b>{x.날}</b> {디데이(x.날)} · {x.제목}</div>)}
          {체크(담기, set담기, '달력 파일에 같이 넣기')}
        </div>
      )}

      <div className="kt-btns">
        <button type="button" className="btn" style={{ width: 'auto' }} disabled={!달력용.length} onClick={받자}>📅 달력 파일(.ics) 받기 · {달력용.length}가지</button>
        <button type="button" className="btn line" style={{ width: 'auto' }} onClick={() => window.print()}>🖨 인쇄</button>
      </div>
      <div className="hint kt-hint">
        달력 파일은 이 브라우저에서 만들어 바로 받습니다(어디로도 보내지 않음). 휴대폰·구글·아웃룩 달력에서 열면 일정이 들어가고 <b>하루 전 아침 9시</b>에 알려 줍니다.
        {' '}기한은 법령에 적힌 날 수로 셌습니다(첫날은 빼고 셈) — <b>공고문·계약서에 따로 정한 기한이 있으면 그것이 먼저입니다.</b>
        {' '}마지막 날이 주말·공휴일이면 그 앞 근무일에 끝내 두시는 것이 안전합니다.
        {' '}계약할 때 낼 <b>계약보증금 · 공사이행보증서 · 인지세</b>와 보증서 날짜는 <Link to="/tools/contract-ready" className="kr-link">계약 준비물 계산기 →</Link>{' '}· 퇴직공제 가입 대상 · 성립 신고는 <Link to="/tools/toejik-check" className="kr-link">퇴직공제 가입 대상 판단기 →</Link>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ⏱ 지체상금 계산기
   ══════════════════════════════════════════════════════════ */
export function DelayPenalty({ ex = {} }) {
  const [곳, set곳] = use칸('곳', ex.곳 ?? '국가')
  const [종, set종] = use칸('종', ex.종 ?? '공사')
  const [율직접, set율직접] = use칸('율직접', ex.율직접 ?? '')
  const [계약, set계약] = use칸('계약', ex.계약 ?? '')
  const [인수, set인수] = use칸('인수', ex.인수 ?? '')
  const [기한, set기한] = use칸('기한', ex.기한 ?? '')
  const [합격, set합격] = use칸('합격', ex.합격 ?? '')
  const [기한안, set기한안] = use칸('기한안', ex.기한안 ?? false)
  const [공휴옛] = use칸('공휴', ex.공휴 ?? false)
  /* 🩹 2026-10-21 소장님 «도구 점검» — 준공기한이 토 · 일 · 공휴일이면 «마지막 날이 공휴일» 칸을 저절로 켭니다(전엔 손으로 켜야 해서 잊으면 하루 더 셈).
     손으로 누르면 그 값이 이깁니다(발주기관 휴무일이 다를 수 있어서) · 날짜를 바꾸면 다시 저절로. 쉬는 날 표 = lib/해마다.js(공휴일에 관한 법률 · 월력요항) */
  const [공휴손, set공휴손] = use칸('공휴손', ex.공휴 ?? null)
  const [손날, set손날] = use칸('공휴손날', '')
  const 쉼 = /^\d{4}-\d{2}-\d{2}$/.test(기한 || '') ? 쉬는날(기한) : false
  const 손맞음 = 공휴손 != null && 손날 === 기한
  const 공휴 = 손맞음 ? !!공휴손 : (쉼 || 공휴옛 === true)
  const set공휴 = (v) => { set공휴손(!!v); set손날(기한) }
  const [뺄, set뺄] = use칸('뺄', ex.뺄 ?? '')
  const [직접일, set직접일] = use칸('직접일', ex.직접일 ?? '')
  const 표 = 지체율표[곳] || null
  const 줄 = 표 ? (표.줄.find((x) => x.k === 종) || 표.줄[0]) : null
  const 율 = 곳 === '직접' ? num(율직접) : 줄 ? 줄.율 : 0
  const 일 = 지체일수({ 준공기한: 기한, 합격일: 합격, 기한안신고: 기한안, 말일공휴: 공휴, 뺄날: num(뺄), 직접: 직접일 === '' ? null : num(직접일) })
  const r = 지체상금({ 계약금액: 금(계약), 인수기성: 금(인수), 율, 일수: 일.날 || 0 })
  return (
    <div className="tool">
      <div className="tl-grid">
        <Row label="계약 구분">
          <select value={곳} onChange={(e) => set곳(e.target.value)}>
            <option value="국가">국가 (국가계약법)</option>
            <option value="지방">지자체 (지방계약법 · 지연배상금)</option>
            <option value="직접">계약서에 적힌 율 직접</option>
          </select>
        </Row>
        {곳 === '직접'
          ? <Row label="지체상금률" hint="1000분의 몇 (예: 0.5)"><input inputMode="decimal" value={율직접} onChange={(e) => set율직접(e.target.value)} placeholder="0.5" /></Row>
          : (
            <Row label="계약 종류">
              <select value={줄 ? 줄.k : ''} onChange={(e) => set종(e.target.value)}>
                {표.줄.map((x) => <option key={x.k} value={x.k}>{x.n} — 1000분의 {x.율}</option>)}
              </select>
            </Row>
          )}
        <금액칸 label="계약금액" hint="원 · 장기계속은 그해 차수 금액" value={계약} set={set계약} placeholder="500,000,000" />
        <금액칸 label="검사 받고 인수한 기성부분" hint="원 · 없으면 비움" value={인수} set={set인수} placeholder="" />
        <Row label="준공기한" hint="계약서의 준공신고서 제출기일"><input type="date" value={기한} onChange={(e) => set기한(e.target.value)} /></Row>
        <Row label="준공검사 합격일" hint="아직이면 오늘로 셈">
          <input type="date" value={합격} onChange={(e) => set합격(e.target.value)} />
          <button type="button" className="btn ghost sm" style={{ width: 'auto', marginTop: 4 }} onClick={() => set합격(오늘())}>오늘까지로</button>
        </Row>
        <Row label="뺄 날" hint="일 · 우리 책임 아닌 사유·연장 승인"><input inputMode="numeric" value={뺄} onChange={(e) => set뺄(e.target.value)} placeholder="0" /></Row>
        <Row label="지체일수 직접" hint="일 · 셈이 다르면 여기에"><input inputMode="numeric" value={직접일} onChange={(e) => set직접일(e.target.value)} placeholder="비우면 날짜로 셈" /></Row>
      </div>
      <div className="kt-chks">
        <label className="kt-chk"><input type="checkbox" checked={!!기한안} onChange={(e) => set기한안(e.target.checked)} /> <span>준공기한 안에 준공신고서를 냈음 (검사 기간은 지체가 아님)</span></label>
        <label className="kt-chk"><input type="checkbox" checked={!!공휴} onChange={(e) => set공휴(e.target.checked)} /> <span>준공기한 마지막 날이 공휴일·발주기관 휴무일 (그 다음 다음 날부터 셈){쉼 && !손맞음 ? <b className="kt-auto"> — {기한}({'일월화수목금토'[new Date(기한 + 'T00:00:00').getDay()]})은 쉬는 날이라 저절로 켰습니다</b> : null}</span></label>
      </div>
      <Out items={[
        { k: '지체일수', v: 일.날 != null ? `${일.날}일` : '—' },
        { k: '지체상금률', v: 율 > 0 ? `1000분의 ${율}` : '—' },
        { k: '셈 기준 금액 (계약 − 인수 기성)', v: won(r.기준) },
        { k: '하루치', v: won(r.하루치) },
        { k: '셈한 지체상금', v: 일.날 ? won(r.원금) : '—' },
        { k: `한도 (${지체한도}%)`, v: won(r.한도) },
        { k: '물어야 할 지체상금', v: 일.날 ? 원(r.적용) : '—', big: true },
      ]} />
      {일.글 && <div className="hint kt-hint">🧮 {일.글}{r.한도날 ? ` · 약 ${r.한도날.toLocaleString('ko-KR')}일 늦으면 한도(${지체한도}%)에 닿습니다` : ''}</div>}
      {r.한도걸림 && <판정칸 종류="bad">셈한 금액이 한도를 넘어 <b>한도 {원(r.한도)}</b>까지만 냅니다. 다만 지체가 길어지면 계약 해제·해지 사유가 될 수 있습니다.</판정칸>}
      <div className="hint kt-hint">
        지체일수는 <b>준공기한 다음 날부터 준공검사(시정했으면 최종 검사)에 합격한 날까지</b>입니다. 기한 안에 준공신고서를 냈다면 검사 기간은 넣지 않지만,
        {' '}기한 뒤에 시정조치를 했다면 시정한 날부터 최종 합격일까지는 들어갑니다 — 그 일수는 «지체일수 직접» 칸에 넣으십시오.
        {' '}불가항력, 관급자재 공급 지연, 발주기관 책임의 착공 지연·공사 중지, 우리 책임 아닌 설계변경 같은 날은 빼고, 연장 승인을 받은 기간에는 붙지 않습니다.
      </div>
      <div className="hint kt-hint">준공기한을 늘려야 하면 연장 청구 · 보증서 · 실비 · 신고 기한을 순서대로 — <Link to="/tools/time-extension" className="kr-link">공기연장 때 할 일 →</Link></div>
      <근거줄>{곳 === '직접' ? '계약서' : 표.근거} · 공사계약일반조건(계약예규) 제25조·제26조③ · 원 미만 버림</근거줄>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   🛡 하자담보책임기간 · 하자보수보증금
   ══════════════════════════════════════════════════════════ */
export function DefectPeriod({ ex = {} }) {
  const [k, setK] = use칸('k', ex.k ?? 'd2')
  const [률, set률] = use칸('률', ex.률 ?? '')
  const [시작, set시작] = use칸('시작', ex.시작 ?? '')
  const [계약, set계약] = use칸('계약', ex.계약 ?? '')
  const x = 하자찾기(k) || 하자찾기('d2')
  const 쓸률 = 률 === '' ? x.률 : num(률)
  const 끝 = 날읽기(시작) != null ? 해더하기(시작, x.년) : ''
  const 보 = 하자보증({ 계약금액: 금(계약), 률: 쓸률, 조경: k === 'c3' })
  return (
    <div className="tool">
      <Row label="공사 종류">
        <select value={k} onChange={(e) => { setK(e.target.value); set률('') }}>
          {하자표.map((g) => (
            <optgroup key={g.갈래} label={g.갈래}>
              {g.줄.map((y) => <option key={y.k} value={y.k}>{y.이름} — {y.년}년</option>)}
            </optgroup>
          ))}
        </select>
      </Row>
      <div className="tl-grid">
        <Row label="시작일" hint="인수한 날·준공검사 끝난 날 중 빠른 날"><input type="date" value={시작} onChange={(e) => set시작(e.target.value)} /></Row>
        <금액칸 label="계약금액" hint="원" value={계약} set={set계약} placeholder="300,000,000" />
        <Row label="하자보수보증금률" hint="공고·계약서가 우선">
          <select value={String(쓸률)} onChange={(e) => set률(e.target.value)}>
            {보증금률표.map((y) => <option key={y.율} value={String(y.율)}>{y.율}% — {y.글.length > 26 ? y.글.slice(0, 26) + '…' : y.글}</option>)}
          </select>
        </Row>
      </div>
      <Out items={[
        { k: '하자담보책임기간', v: `${x.년}년`, big: true },
        { k: '끝나는 무렵', v: 끝 ? `${날더하기(끝, 0)} (${요일글(끝)})` : '시작일을 넣으면' },
        { k: '하자보수보증금률', v: `계약금액의 ${쓸률}%` },
        { k: '하자보수보증금', v: 보.금액 != null ? 원(보.금액) : '—' },
      ]} />
      {보.면제될수 && <판정칸 종류="good">계약금액 3천만 원 이하 공사(조경 제외)는 하자보수보증금을 내지 않게 할 수 있습니다 — 공고·계약서를 보십시오.</판정칸>}
      <div className="hint kt-hint">
        <b>{x.갈래}</b> · {x.이름}. 여러 공종이 섞인 공사는 <b>세부 공종마다</b> 이 기간을 따로 씁니다(책임을 나눌 수 없으면 주된 공종).
        {' '}보증금률은 계약담당공무원이 공종에 따라 네 칸(5·4·3·2%) 가운데서 정합니다 — 위 값은 공종으로 짚어 본 것이니 <b>공고·계약서에 적힌 율을 쓰십시오.</b>
        {' '}끝나는 날은 보증서에 적힌 보증기간이 기준입니다. 해체공사·단순 암반 절취·모래자갈 채취처럼 하자보수가 필요 없는 공사는 보증금이 없습니다.
        {' '}<b>이 표에 없는 것</b>: 공동주택(아파트 등) 건설공사는 «공동주택관리법 시행령» [별표 4], 문화재(국가유산) 수리공사는 그 수리 법령 시행령 [별표 9]의 기간을 따릅니다(국가계약법 시행규칙 제70조①3호·7호).
      </div>
      <근거줄>{x.법} · 국가계약법 시행령 제60조·제62조, 시행규칙 제70조·제72조 / 지방계약법 시행령 제69조·제71조, 시행규칙 제68조·제70조</근거줄>
      <details className="kt-all">
        <summary>📋 공종별 기간 표 전체 보기</summary>
        {하자표.map((g) => (
          <div key={g.갈래} className="kt-allg">
            <div className="kt-allh">{g.갈래} <i>{g.법}</i></div>
            {g.줄.map((y) => <div key={y.k} className="kt-allr"><span>{y.이름}</span><b>{y.년}년</b></div>)}
          </div>
        ))}
      </details>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   💰 기성금 · 준공금 지급 기한 (G534) — 국가계약법 시행령 제58조 · 공사계약일반조건 제39조 · 제40조 · 지방계약법 시행령 제67조 · 민법 제157조 · 제161조
   ══════════════════════════════════════════════════════════ */
const 날칸 = (d) => `${Number(d.slice(5, 7))}.${Number(d.slice(8, 10))}.(${'일월화수목금토'[new Date(d + 'T00:00:00').getDay()]})`
export function PaymentDeadline({ ex = {} }) {
  const [무엇, set무엇] = use칸('무엇', ex.무엇 ?? '기성')
  const [발주, set발주] = use칸('발주', ex.발주 ?? '국가')
  const [검사, set검사] = use칸('검사', ex.검사 ?? '')
  const [청구, set청구] = use칸('청구', ex.청구 ?? '')
  const 기준 = 오늘()
  const r = 대금기한({ 무엇, 발주, 검사일: 검사, 청구일: 청구, 오늘: 기준 })
  const 남은글 = r.기한 ? (r.남은 === 0 ? '오늘까지' : r.남은 > 0 ? `${r.남은}일\u00a0남음` : `${-r.남은}일\u00a0지남`) : ''   // «27일 / 지남» 으로 꺾이지 않게(붙는 빈칸)
  /* 세는 날 — 셈한 날(1 ~ 5) · 뺀 날(토 · 일 · 공휴일) · 기한 */
  const 칸들 = []
  if (r.기한) {
    if (r.셈법 === '토공빼고') {
      const 뺀 = new Set(r.뺀)
      const 모두 = [...r.센, ...r.뺀].sort()
      let n = 0
      for (const d of 모두) 칸들.push(뺀.has(d) ? { d, 꼴: 'x', 글: '쉼' } : { d, 꼴: d === r.기한 ? 'end' : 'n', 글: `${++n}일째` })
    } else {
      r.센.forEach((d, i) => 칸들.push({ d, 꼴: !r.밀림 && d === r.기한 ? 'end' : 'n', 글: `${i + 1}일째${쉬는날(d) ? ' · 쉬는 날' : ''}` }))
      if (r.밀림) { for (const d of r.뺀.slice(1)) 칸들.push({ d, 꼴: 'x', 글: '쉼' }); 칸들.push({ d: r.기한, 꼴: 'end', 글: '다음 일하는 날' }) }
    }
  }
  return (
    <div className="tool pdl">
      <div className="tl-grid">
        <Row label="받을 돈">
          <select value={무엇} onChange={(e) => set무엇(e.target.value)}>
            <option value="기성">기성금 (기성대가)</option>
            <option value="준공">준공금 (준공대가)</option>
          </select>
        </Row>
        <Row label="계약" hint="입찰공고 · 계약서에 적힌 법">
          <select value={발주} onChange={(e) => set발주(e.target.value)}>
            <option value="국가">국가 (국가계약법)</option>
            <option value="지방">지자체 (지방계약법)</option>
          </select>
        </Row>
        {무엇 === '기성' ? (
          <>
            <Row label="기성검사 완료일"><input type="date" value={검사} onChange={(e) => set검사(e.target.value)} /></Row>
            <Row label="청구서 낸 날" hint="검사가 끝난 뒤에 냈을 때만 · 검사 전에 냈으면 비움"><input type="date" value={청구} onChange={(e) => set청구(e.target.value)} /></Row>
          </>
        ) : (
          <>
            <Row label="청구서 낸 날" hint="준공검사에 합격한 뒤 대가 지급 청구서를 낸 날"><input type="date" value={청구} onChange={(e) => set청구(e.target.value)} /></Row>
            <Row label="준공검사 합격일" hint="몰라도 됨"><input type="date" value={검사} onChange={(e) => set검사(e.target.value)} /></Row>
          </>
        )}
      </div>
      <Out items={[
        { k: '세기 시작', v: r.기한 ? `${날말(r.시작, 기준)} 다음 날부터` : '—' },
        { k: '세는 법', v: r.기한 ? (r.셈법 === '달력' ? '달력 5일째 · 쉬는 날이면 다음 날' : '토 · 일 · 공휴일 빼고 5일째') : '—' },
        { k: '지급 기한', v: r.기한 ? `${날말(r.기한, 기준)}까지 · ${남은글}` : (r.오류 || '—'), big: true },
      ]} />
      {칸들.length > 0 && (
        <div className="pdl-days" aria-label="세는 날">
          {칸들.map((x) => <span key={x.d + x.꼴} className={'pdl-d ' + x.꼴}><b>{날칸(x.d)}</b><i>{x.글}</i></span>)}
        </div>
      )}
      {r.기한 && <div className="hint kt-hint">🧮 {r.시작말} 셉니다 — 첫날({날칸(r.시작)})은 넣지 않습니다(민법 제157조).</div>}
      {r.참고기한 && (
        <판정칸 종류="mid">토요일 · 공휴일을 빼고 세는 발주처도 있습니다 — 그렇게 세면 <b>{날말(r.참고기한, 기준)}</b>까지. 국가계약의 «공휴일 및 토요일 제외» 는 시행령 제58조 ⑥(제1항 · 제2항 기간)과 공사계약일반조건 제40조 ②(준공대가)에만 있고 기성(제58조 ④ · 제39조 ②)에는 없어, 위 날짜가 조문 글자대로입니다.</판정칸>
      )}
      {(r.알림 || []).map((m) => <판정칸 key={m} 종류="bad">{m}</판정칸>)}
      {r.기한 && r.남은 < 0 && (
        <판정칸 종류="bad">기한이 지났는데 아직 못 받았다면 — {발주 === '국가'
          ? <>지급기한 다음 날부터 받는 날까지 일수 × 못 받은 금액 × 금융기관 대출평균금리를 이자로 받을 수 있습니다(공사계약일반조건 제41조 ①).</>
          : <>계약서 · 일반조건의 «대가 지급 지연 이자» 조항을 보고 발주처에 이자와 함께 요청하십시오.</>} 청구서가 잘못돼 돌려받았다면 돌려받은 날부터 다시 낸 날까지는 기한에 넣지 않습니다.</판정칸>
      )}
      <div className="hint kt-hint">
        기성금은 <b>적어도 30일마다</b> 줍니다. 검사를 마치는 날까지 미리 청구해 두면 <b>검사 완료일</b>부터, 검사 뒤에 청구하면 <b>청구를 받은 날</b>부터 5일입니다.
        {' '}준공금은 준공검사에 합격한 뒤 청구서를 내고, <b>청구를 받은 날부터 토요일 · 공휴일을 빼고 5일</b>입니다.
        {' '}재난 · 경제위기로 정부가 기간을 정해 고시하면 5일이 3일로 줄고, 계약 때 합의하면 5일을 넘지 않는 범위에서 늘릴 수 있습니다.
        {' '}원도급사는 이 돈을 받은 날부터 <b>15일 안에</b> 하수급인에게 현금으로 줘야 합니다(건설산업기본법 제34조 ①).
      </div>
      <근거줄>{r.근거 && r.근거.length ? r.근거.join(' · ') : '국가계약법 시행령 제58조 · 공사계약일반조건 제39조 · 제40조 · 지방계약법 시행령 제67조'} · 공휴일: 관공서 공휴일 · 대체공휴일(2026 · 2027)</근거줄>
      <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <Link className="btn ghost sm" to="/change/gisung">📆 기성 관리 — 기성내역서 · 선금 공제</Link>
        <Link className="btn ghost sm" to="/forms/gisung-cheonggu">🧾 기성금 청구서</Link>
        <Link className="btn ghost sm" to="/forms/jungong-daega">🏁 준공대가 청구서</Link>
        <Link className="btn ghost sm" to="/tools/unpaid">💸 못 받으면 — 미불금 받는 순서</Link>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   🤝 공동도급 기성 · 준공금 나누기 (G535) — 셈 lib/공동기성.js · 공동계약운용요령 제11조 · 정부 입찰ㆍ계약 집행기준 제37조
   ══════════════════════════════════════════════════════════ */
const 빈구성원 = (i) => ({ 이름: '', 지분: '', 선금: '', 전회: '', 전회정산: '', 직접: '', _: i })
export function JointSplit({ ex = {} }) {
  const [계약, set계약] = use칸('계약', ex.계약 ?? '')
  const [금회, set금회] = use칸('금회', ex.금회 ?? '')
  const [방식, set방식] = use칸('방식', ex.방식 ?? '지분')
  const [준공, set준공] = use칸('준공', ex.준공 ?? false)
  const [끝전, set끝전] = use칸('끝전', ex.끝전 ?? 0)
  const [구성원, set구성원] = use칸('구성원', ex.구성원 ?? [빈구성원(0), 빈구성원(1)])
  const 줄들 = Array.isArray(구성원) && 구성원.length ? 구성원 : [빈구성원(0), 빈구성원(1)]
  const 바꿈 = (i, k, v) => set구성원(줄들.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const r = 회차나누기({
    계약: 금(계약), 금회: 금(금회), 방식, 준공: !!준공, 끝전: Math.min(Number(끝전) || 0, 줄들.length - 1),
    구성원: 줄들.map((x) => ({ 이름: x.이름, 지분: num(x.지분), 선금: 금(x.선금), 전회: 금(x.전회), 전회정산: 금(x.전회정산), 직접: 금(x.직접) })),
  })
  const 이름 = (i) => 줄들[i] && 줄들[i].이름 ? 줄들[i].이름 : (i === 0 ? '대표사' : `구성원 ${i}`)
  return (
    <div className="tool jvs">
      <div className="tl-grid">
        <금액칸 label="계약금액" hint="원 · 공동수급체 전체" value={계약} set={set계약} placeholder="1,000,000,000" />
        <금액칸 label="이번 회 기성금" hint={준공 ? '준공은 몫 − 지난번까지로 셈(안 넣어도 됨)' : '원 · 공동수급체 전체 금회'} value={금회} set={set금회} placeholder="300,000,000" />
        <Row label="나누는 법">
          <select value={방식} onChange={(e) => set방식(e.target.value)} disabled={!!준공}>
            <option value="지분">지분율(출자비율)대로 — 공동이행</option>
            <option value="직접">구성원별로 직접 — 이행내용대로 · 분담이행</option>
          </select>
        </Row>
        <Row label="끝전(원 미만 버리고 남는 원)" hint="공동수급협정서에 정한 곳">
          <select value={String(Math.min(Number(끝전) || 0, 줄들.length - 1))} onChange={(e) => set끝전(Number(e.target.value))}>
            {줄들.map((_, i) => <option key={i} value={String(i)}>{이름(i)}</option>)}
          </select>
        </Row>
      </div>
      <div className="kt-chks">
        <label className="kt-chk"><input type="checkbox" checked={!!준공} onChange={(e) => set준공(e.target.checked)} /> <span>마지막 회 — 준공대가 (구성원별 총액을 지분에 꼭 맞춤 · 남은 선금 모두 정산)</span></label>
      </div>
      <div className="jvs-ms">
        {줄들.map((x, i) => (
          <div key={x._ ?? i} className="jvs-m">
            <div className="jvs-mh"><b>{i === 0 ? '👑 ' : ''}{이름(i)}</b>
              {줄들.length > 2 && <button type="button" className="tp-x" onClick={() => set구성원(줄들.filter((_, j) => j !== i))} aria-label={`${이름(i)} 빼기`}>빼기</button>}
            </div>
            <label>이름 <input value={x.이름} onChange={(e) => 바꿈(i, '이름', e.target.value.slice(0, 20))} placeholder={i === 0 ? '대표사' : `구성원 ${i}`} /></label>
            <label>지분 % <input inputMode="decimal" value={x.지분} onChange={(e) => 바꿈(i, '지분', e.target.value)} placeholder={i === 0 ? '60' : '40'} /></label>
            {방식 === '직접' && !준공 && <label>이번 회 금액 <금액입력 value={x.직접} onValue={(n, d) => 바꿈(i, '직접', d)} placeholder="이행한 금액" /></label>}
            <label>받은 선금 <금액입력 value={x.선금} onValue={(n, d) => 바꿈(i, '선금', d)} placeholder="없으면 비움" /></label>
            <label>지난번까지 받은 기성 <금액입력 value={x.전회} onValue={(n, d) => 바꿈(i, '전회', d)} placeholder="처음이면 비움" /></label>
            <label>지난번까지 선금 정산 <금액입력 value={x.전회정산} onValue={(n, d) => 바꿈(i, '전회정산', d)} placeholder="처음이면 비움" /></label>
          </div>
        ))}
        {줄들.length < 6 && <button type="button" className="btn ghost sm jvs-add" onClick={() => set구성원([...줄들, 빈구성원(Date.now())])}>＋ 구성원 더하기</button>}
      </div>
      {r.오류 ? <div className="hint kt-hint">↑ {r.오류}</div> : (
        <>
        {/* 폰에서도 «이번에 받을 돈» 이 먼저 보이게 — 구성원마다 한 칸(표는 옆으로 밀면 누계 · 남은 것 · 몫) */}
        <div className="jvs-pay" aria-label="구성원별 이번에 받을 돈">
          {r.줄.map((x, i) => (
            <div key={i} className="jvs-p">
              <span>{i === 0 ? '👑 ' : ''}{이름(i)} <i>{x.지분}%</i></span>
              <b>{원(x.지급)}</b>
              <small>이번 회 {원(x.금회)}{x.선금 ? ` − 선금 정산 ${원(x.정산)}` : ''}</small>
            </div>
          ))}
        </div>
        <div className="gg-wrap jvs-out">
          <table className="gg-r">
            <thead><tr><th>구성원 (지분)</th><th className="r">이번 회</th><th className="r">선금 정산</th><th className="r">이번에 받을 돈</th><th className="r">누계</th><th className="r">남은 것</th><th className="r">몫(계약 × 지분)</th></tr></thead>
            <tbody>
              {r.줄.map((x, i) => (
                <tr key={i} className={x.잔여 < 0 || x.금회 < 0 ? 'neg' : ''}>
                  <td>{i === 0 ? '👑 ' : ''}{이름(i)} <span className="muted">{x.지분}%</span></td><td className="r">{원(x.금회)}</td><td className="r">{x.선금 ? 원(x.정산) : '—'}</td><td className="r"><b>{원(x.지급)}</b></td>
                  <td className="r">{원(x.누계)} <span className="muted">({(x.율 * 100).toFixed(1)}%)</span></td><td className="r">{원(x.잔여)}</td><td className="r">{원(x.몫)}</td>
                </tr>
              ))}
              <tr className="jvs-sum"><td>합 <span className="muted">{r.지분합}%</span></td><td className="r">{원(r.총.금회)}</td><td className="r">{r.총.선금 ? 원(r.총.정산) : '—'}</td><td className="r"><b>{원(r.총.지급)}</b></td><td className="r">{원(r.총.누계)}</td><td className="r">{원(r.총.잔여)}</td><td className="r">{원(r.총.몫)}</td></tr>
            </tbody>
          </table>
        </div>
        </>
      )}
      {(r.알림 || []).map((m) => <판정칸 key={m} 종류="bad">{m}</판정칸>)}
      {!r.오류 && !(r.알림 || []).length && <판정칸 종류="good">대표사가 이 표대로 <b>구성원별로 나눠 적은 신청서</b>를 내면 발주처가 구성원 <b>각자</b>에게 줍니다(공동계약운용요령 제11조 ① · ②).</판정칸>}
      <div className="hint kt-hint">
        <b>몫</b> = 계약금액 × 지분율(원 미만 버림 · 남는 원은 끝전 구성원). 기성은 <b>이행내용대로</b> 받을 수 있지만, <b>준공 때 구성원별 총액은 출자비율(분담내용)과 꼭 같아야</b> 합니다(제11조 ③) — 마지막 회를 켜면 그렇게 맞춥니다.
        {' '}<b>선금 정산</b>은 구성원마다 «받은 선금 × 누계 기성 ÷ 몫» 에서 지난번까지 정산한 것을 뺀 최소 금액입니다(정부 입찰ㆍ계약 집행기준 제37조 식 · 누계로 셈해 끝전이 쌓이지 않게) — 발주처가 더 정산하라고 하면 그대로 따르십시오.
        {' '}금액은 청구서와 같은 기준(부가가치세 포함 여부)으로 넣으십시오. 지자체 공사는 «지방자치단체 입찰 및 계약 집행기준» 의 공동계약 운영요령을 따르니 발주처 안내도 함께 보십시오.
      </div>
      <근거줄>(계약예규) 공동계약운용요령 제2조의2 · 제11조 · 정부 입찰ㆍ계약 집행기준 제37조 · 원 미만 버림</근거줄>
      <div className="btn-row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <Link className="btn ghost sm" to="/forms/gisung-cheonggu">🧾 기성금 청구서</Link>
        <Link className="btn ghost sm" to="/tools/payment-deadline">💰 받을 날 — 지급 기한</Link>
        <Link className="btn ghost sm" to="/forms/gy-gongdong">📝 공동수급협정서</Link>
        <Link className="btn ghost sm" to="/gongdong">🤝 공동도급 마당</Link>
      </div>
    </div>
  )
}

/* 🧪 예시 — 가상의 숫자입니다 (남의 공사 금액을 옮기지 않습니다) */
/* ══════════════════════════════════════════════════════════
   📦 계약 준비물 계산기 (G557) — 계약보증금 · 공사이행보증서 · 보증서 날짜 · 인지세
   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ③. 숫자 · 조문은 lib/계약준비.js 한 곳(법제처 원문 세 번 읽음)
   ══════════════════════════════════════════════════════════ */
const 굵게 = (s) => String(s).split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x))
const 날점 = (d) => `${d.slice(0, 4)}. ${Number(d.slice(5, 7))}. ${Number(d.slice(8, 10))}.`
export function ContractReady({ ex = {} }) {
  const [발주, set발주] = use칸('발주', ex.발주 ?? '국가')
  const [계약, set계약] = use칸('계약', ex.계약 ?? '')
  const [시작, set시작] = use칸('시작', ex.시작 ?? '')
  const [끝, set끝] = use칸('끝', ex.끝 ?? '')
  const [장기, set장기] = use칸('장기', ex.장기 ?? false)
  const [총공사, set총공사] = use칸('총공사', ex.총공사 ?? '')
  const [칠십, set칠십] = use칸('칠십', ex.칠십 ?? false)
  const [고시, set고시] = use칸('고시', ex.고시 ?? false)
  const [변경, set변경] = use칸('변경', ex.변경 ?? false)
  const [전금액, set전금액] = use칸('전금액', ex.전금액 ?? '')
  const 곳 = 준비발주.find((x) => x.k === 발주) || 준비발주[0]
  const 금액 = 금(계약)
  const r = 이행보증({ 발주: 곳.k, 계약금액: 금액, 장기: !!장기, 총공사: 금(총공사), 칠십미만: !!칠십, 고시: !!고시 })
  const 기간 = 보증기간(시작, 끝)
  const 세 = 인지세(금액), 세칸 = 인지세칸(금액)
  const 차 = 변경 ? 변경인지세(금(전금액), 금액) : null
  return (
    <div className="tool kr">
      <div className="tl-grid">
        <Row label="발주처">
          <select value={곳.k} onChange={(e) => set발주(e.target.value)}>
            {준비발주.map((x) => <option key={x.k} value={x.k}>{x.이름} — {x.법}</option>)}
          </select>
        </Row>
        <금액칸 label={변경 ? '바뀐 뒤 계약금액' : '계약금액'} hint="원 · 계약서에 적힌 금액" value={계약} set={set계약} placeholder="250,000,000" />
        <Row label="계약기간 첫날" hint="계약서 «계약기간»"><input type="date" value={시작} onChange={(e) => set시작(e.target.value)} /></Row>
        <Row label="계약기간 끝날" hint="준공기한"><input type="date" value={끝} onChange={(e) => set끝(e.target.value)} /></Row>
      </div>
      <div className="kt-chks">
        <label className="kt-chk"><input type="checkbox" checked={!!장기} onChange={(e) => set장기(e.target.checked)} /> <span>장기계속계약(해마다 나눠 계약 — 첫 계약 때 총공사금액을 적음)</span></label>
        {장기 && <div className="tl-grid"><금액칸 label="총공사금액" hint="첫 계약 때 덧붙여 적은 금액" value={총공사} set={set총공사} placeholder="1,200,000,000" /></div>}
        <label className="kt-chk"><input type="checkbox" checked={!!칠십} onChange={(e) => set칠십(e.target.checked)} /> <span>예정가격의 70% 미만으로 낙찰(공사이행보증서 비율이 올라감)</span></label>
        <label className="kt-chk"><input type="checkbox" checked={!!고시} onChange={(e) => set고시(e.target.checked)} /> <span>정부가 기간을 정해 고시한 경제위기 특례 기간(공고 · 계약서에 5% 로 적힘)</span></label>
        <label className="kt-chk"><input type="checkbox" checked={!!변경} onChange={(e) => set변경(e.target.checked)} /> <span>변경계약(금액을 늘림) — 인지세는 늘어난 만큼만</span></label>
        {변경 && <div className="tl-grid"><금액칸 label="바뀌기 전 계약금액" hint="원" value={전금액} set={set전금액} placeholder="200,000,000" /></div>}
      </div>
      <Out items={[
        { k: `계약보증금 (${r.장기 ? '총공사금액' : '계약금액'}의 ${r.보증율}%)`, v: r.보증금 > 0 ? 원(r.보증금) : '—', big: true },
        { k: `또는 공사이행보증서 (${r.이행율}%)`, v: r.이행보증금 != null ? 원(r.이행보증금) : (r.장기 ? '공고 · 계약담당 확인' : '—') },
        { k: '보증서 보증기간', v: 기간 && !기간.틀림 ? `${날점(기간.첫날)} ~ ${날점(기간.끝날)} 이후` : (기간 && 기간.틀림 ? '끝날이 첫날보다 빠름' : '계약기간을 넣으면') },
        { k: 변경 ? '인지세 (늘어난 만큼)' : '인지세 (1통)', v: 금액 > 0 ? (변경 ? 원(차) : (세 > 0 ? 원(세) : '없음 (1천만원 이하)')) : '—' },
      ]} />
      {r.면제될수 && <판정칸 종류="good">계약금액 5천만원 이하라 계약보증금을 <b>면제할 수 있습니다</b>(발주처가 정함). 면제되면 못 지키면 그 금액을 내겠다고 <b>확약하는 문서</b>를 냅니다.</판정칸>}
      <div className="hint kt-hint">
        <b>계약보증금과 공사이행보증서 중 하나</b>를 계약상대자가 고릅니다(공사계약). 발주처가 공사 특성상 이행보증서로 정할 수 있고{곳.k === '지방' ? ', 추정가격 300억원 이상 · 대형공사(일괄입찰 · 대안입찰) · 기술제안입찰 공사는 반드시 이행보증서입니다' : ''}.
        {' '}보증금은 현금이나 <b>보증서</b>(건설공제조합 · 보증보험 · 금융기관 지급보증서 등)로 냅니다 — 보증서의 피보증인은 <b>{곳.피보증인}</b>, 보증금액은 낼 금액 이상이어야 합니다.
        {' '}{곳.k === '국가' ? '국가 공사계약 계약보증금은 2026. 5. 12.부터 10%입니다.' : ''}
      </div>
      <div className="hint kt-hint">
        <b>보증서 날짜</b> — 보증기간 첫날은 <b>계약기간 첫날</b>, 끝날은 <b>계약기간 끝날 이후</b>여야 합니다(보증서를 받은 날 · 계약서 초안을 받은 날이 아님).
        {' '}계약은 발주처 담당자와 계약상대자가 계약서에 <b>기명 · 날인하거나 서명(전자서명)한 때</b> 확정됩니다.
        {' '}하자보수보증서는 준공 뒤 — 기간 · 보증금률은 <Link to="/tools/defect-period" className="kr-link">하자담보책임기간 찾기 →</Link>
      </div>
      <div className="hint kt-hint">
        <b>인지세</b> — 도급계약서 1통마다 냅니다. 발주처가 가지는 1통은 계약상대자가 쓴 것으로 보아 <b>계약상대자가 냅니다</b>(나머지 1통은 비과세).
        {' '}{세칸 ? `이 금액은 «${세칸.글}» 칸이라 ${원(세칸.세액)}입니다. ` : ''}
        <b>나라장터 같은 전자조달시스템</b>으로 계약하면 <b>계약서를 쓰는 날</b>, 그 밖에는 쓴 날이 속한 달의 <b>다음 달 10일까지</b> 전자수입인지로 냅니다.
        {' '}금액을 늘린 변경계약은 늘어난 세액만, 줄인 변경계약은 내지 않습니다. 부가가치세를 따로 적은 계약서라면 기재금액은 국세청(126)에 확인하세요.
      </div>
      <details className="kt-all">
        <summary>📋 인지세 표 · 공채(지역개발채권 · 도시철도채권)</summary>
        <div className="kt-allg">
          <div className="kt-allh">인지세 — 도급계약서 기재금액 <i>인지세법 제3조①1 · 3호</i></div>
          <div className="kt-allr"><span>1천만원 이하</span><b>없음</b></div>
          {인지세표.map((x) => <div key={x.넘고} className="kt-allr"><span>{x.글}</span><b>{원(x.세액)}</b></div>)}
        </div>
        <div className="kt-allg">
          <div className="kt-allh">공채 <i>{공채근거}</i></div>
          {공채글.map((t, i) => <p key={i} className="kr-p">{굵게(t)}</p>)}
        </div>
      </details>
      <근거줄>{준비근거[곳.k]} · {준비근거.인지세}</근거줄>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   🧭 퇴직공제 가입 대상 판단기 (G558) — 당연가입 · 성립 신고 14일 · 전자카드
   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ④. 판단 · 조문은 lib/퇴직공제대상.js 한 곳(법제처 원문 세 번 읽음)
   ══════════════════════════════════════════════════════════ */
export function ToejikCheck({ ex = {} }) {
  const [종류, set종류] = use칸('종류', ex.종류 ?? '건설')
  const [발주, set발주] = use칸('발주', ex.발주 ?? '국가')
  const [금액, set금액] = use칸('금액', ex.금액 ?? '')
  const [건축, set건축] = use칸('건축', ex.건축 ?? '')
  const [착공, set착공] = use칸('착공', ex.착공 ?? '')
  const 쓸건축 = 종류 === '건설' && 발주 === '민간' ? 건축 : ''
  const r = 가입판단({ 종류, 발주, 금액: 금(금액), 건축: 쓸건축 })
  const 기한 = r.대상 ? 성립기한(착공) : ''
  const 밀 = 기한 ? 기한미루기(기한) : null
  const 카 = 공제카드(r.대상, 금(금액))
  const 일액 = 퇴직공제일액표.slice(1).map((x) => `${x.글} ${x.일액.toLocaleString('ko-KR')}원`).join(' · ')
  return (
    <div className="tool tc">
      <div className="tl-grid">
        <Row label="공사 종류">
          <select value={종류} onChange={(e) => set종류(e.target.value)}>
            {공제종류.map((x) => <option key={x.k} value={x.k}>{x.이름}</option>)}
          </select>
        </Row>
        <Row label="발주처">
          <select value={발주} onChange={(e) => set발주(e.target.value)}>
            {공제발주.map((x) => <option key={x.k} value={x.k}>{x.이름}</option>)}
          </select>
        </Row>
        <금액칸 label="공사예정금액" hint={공제금액풀이[종류] || 공제금액풀이.건설} value={금액} set={set금액} placeholder="150,000,000" />
        {종류 === '건설' && 발주 === '민간' && (
          <Row label="건축물" hint="금액과 관계없이 대상">
            <select value={건축} onChange={(e) => set건축(e.target.value)}>
              {공제건축.map((x) => <option key={x.k || '없음'} value={x.k}>{x.이름}</option>)}
            </select>
          </Row>
        )}
        <Row label="착공일" hint="사업 시작일 — 신고 기한"><input type="date" value={착공} onChange={(e) => set착공(e.target.value)} /></Row>
      </div>
      {r.대상 === true && <판정칸 종류="good"><b>당연가입 대상입니다</b> — {r.까닭} ({r.근거})</판정칸>}
      {r.대상 === false && <판정칸 종류="info"><b>당연가입 대상이 아닙니다</b> — {r.까닭} ({r.근거}). {굵게(공제아닐때)}</판정칸>}
      {r.대상 === null && <div className="hint">{r.까닭}.</div>}
      {r.대상 && (
        <>
          <Out items={[
            { k: '성립 신고 기한', v: 기한 ? `${날점(밀.날)}${밀.밀림 ? ' (쉬는 날이라 미룸)' : ''}` : '착공일을 넣으면', big: true },
            { k: '전자카드 출퇴근', v: 카 && 카.앱가능 ? '단말기 또는 휴대폰 앱' : '전자카드 단말기' },
            { k: '공제부금 1일', v: '입찰공고일로 — 아래' },
          ]} />
          <ol className="tc-steps">{공제할일.map((x) => <li key={x.k}>{굵게(x.글)} <span className="hj-src1">({공제근거[x.근거]})</span></li>)}</ol>
          <div className="hint kt-hint">공제부금 1일 금액: {일액}. 사람마다 근로일수 · 부금 집계는 <Link to="/tools/toejik" className="kr-link">퇴직공제 집계 →</Link></div>
        </>
      )}
      <div className="hint kt-hint">📅 {굵게(공제바뀜)}</div>
      <div className="hint kt-hint">착공 전후 다른 기한(보험관계 성립 신고 · 키스콘 등)은 <Link to="/tools/after-award" className="kr-link">낙찰 뒤 할 일 달력 →</Link></div>
      <근거줄>{r.근거} · {공제근거.가입} · {공제근거.신고} · {공제근거.피공제자} · {공제근거.과태료}</근거줄>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ⏳ 공기연장 때 할 일 (G559) — 연장 청구 · 인력투입계획 · 장비 · 보증서 · 실비 · 하도급 · 키스콘 · 고용산재 · 퇴직공제
   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ⑤-1. 할 일 · 조문은 lib/공기연장.js 한 곳(법제처 · 국토교통부 원문 세 번 읽음)
   ══════════════════════════════════════════════════════════ */
export function TimeExtension({ ex = {} }) {
  const [발주, set발주] = use칸('발주', ex.발주 ?? '국가')
  const [까닭, set까닭] = use칸('까닭', ex.까닭 ?? '없음')
  const [지금, set지금] = use칸('지금', ex.지금 ?? '')
  const [새것, set새것] = use칸('새것', ex.새것 ?? '')
  const [합의, set합의] = use칸('합의', ex.합의 ?? '')
  const [장기, set장기] = use칸('장기', ex.장기 ?? false)
  const [하도급, set하도급] = use칸('하도급', ex.하도급 ?? false)
  const [공제, set공제] = use칸('공제', ex.공제 ?? false)
  const 곳 = 발주 === '지방' ? '지방' : '국가'
  const r = 연장할일({ 발주: 곳, 까닭, 지금, 새것, 합의, 장기: !!장기, 하도급: !!하도급, 공제: !!공제 })
  const 미룬 = (d) => { const m = 기한미루기(d); return `${날점(m.날)}${m.밀림 ? ' (쉬는 날이라 미룸)' : ''}` }
  const 단 = (k) => r.단계.find((x) => x.k === k)
  const 일수글 = r.일수 && r.일수.일 ? `${r.일수.일}일` : r.일수 && r.일수.틀림 ? '늘린 준공기한이 지금 준공기한보다 앞이거나 같음' : '두 준공기한을 넣으면'
  return (
    <div className="tool te">
      <div className="tl-grid">
        <Row label="발주처">
          <select value={곳} onChange={(e) => set발주(e.target.value)}>
            {연장발주.map((x) => <option key={x.k} value={x.k}>{x.이름}</option>)}
          </select>
        </Row>
        <Row label="늦어진 까닭" hint="발주기관 사유 · 불가항력 등은 연장 사유">
          <select value={까닭 === '우리' ? '우리' : '없음'} onChange={(e) => set까닭(e.target.value)}>
            {연장까닭.map((x) => <option key={x.k} value={x.k}>{x.이름}</option>)}
          </select>
        </Row>
        <Row label="지금 준공기한" hint="계약서 준공기한"><input type="date" value={지금} onChange={(e) => set지금(e.target.value)} /></Row>
        <Row label="늘린 준공기한" hint="연장 뒤"><input type="date" value={새것} onChange={(e) => set새것(e.target.value)} /></Row>
        <Row label="연장 변경계약한 날" hint="신고 기한 셈 — 아직이면 비움"><input type="date" value={합의} onChange={(e) => set합의(e.target.value)} /></Row>
      </div>
      <div className="kt-chks">
        <label className="kt-chk"><input type="checkbox" checked={!!장기} onChange={(e) => set장기(e.target.checked)} /> <span>장기계속공사(연차별로 계약)</span></label>
        <label className="kt-chk"><input type="checkbox" checked={!!하도급} onChange={(e) => set하도급(e.target.checked)} /> <span>하도급 준 공사가 있음</span></label>
        <label className="kt-chk"><input type="checkbox" checked={!!공제} onChange={(e) => set공제(e.target.checked)} /> <span>퇴직공제 가입 공사</span></label>
      </div>
      {r.판정 === 'no'
        ? <판정칸 종류="info"><b>계약기간 연장 사유가 아닙니다</b> — 우리 책임으로 늦어진 날은 {곳 === '지방' ? '지연배상금' : '지체상금'}이 붙습니다.</판정칸>
        : <판정칸 종류="good"><b>계약기간 연장을 {곳 === '지방' ? '청구' : '신청'}할 수 있습니다</b> — {굵게(연장지체글[곳])}</판정칸>}
      {r.판정 === 'yes' && (
        <Out items={[
          { k: '연장 일수', v: 일수글, big: true },
          { k: '키스콘 변경통보', v: 단('kiscon') && 단('kiscon').날 ? 미룬(단('kiscon').날) : '변경계약한 날을 넣으면' },
          { k: '고용 · 산재 변경신고', v: 단('boheom') && 단('boheom').날 ? 미룬(단('boheom').날) : '변경계약한 날을 넣으면' },
        ]} />
      )}
      <ol className="tc-steps te-steps">
        {r.단계.map((x) => (
          <li key={x.k}>
            <b>{x.제목}</b> <span className="te-when">— {x.때}{x.날 ? (x.k === 'cheong' ? `(준공기한 ${날점(x.날)})` : ` · ${미룬(x.날)}`) : ''}</span>
            <div className="te-p">{굵게(x.글)} <span className="hj-src1">({x.근거})</span></div>
          </li>
        ))}
      </ol>
      {r.판정 === 'yes' && (
        <details className="kt-all te-why">
          <summary>연장 사유가 되는 것 — 지체일수에 넣지 않는 사유</summary>
          <ul className="te-list">{연장사유[곳].map((s) => <li key={s}>{s}</li>)}</ul>
          <div className="hj-src1">{곳 === '지방' ? '지방 집행기준 제9장 제8절 1-다 1) ~ 8)(7) 물품은 뺌)' : '공사계약일반조건 제25조③ 1 ~ 8호(4호 삭제)'}</div>
        </details>
      )}
      <div className="hint kt-hint">
        {r.판정 === 'no'
          ? <>늦어진 날의 금액은 <Link to="/tools/delay-penalty" className="kr-link">지체상금 계산기 →</Link> · 우리 책임이 아닌 날을 빼 달라고 할 때는 <Link to="/forms/jiche-gammyeon" className="kr-link">지체상금 감면 신청서 →</Link></>
          : <>서류: <Link to="/forms/gonggi-yeonjang" className="kr-link">공기연장 신청서 →</Link> · <Link to="/forms/chg-ganjeopbi" className="kr-link">공기연장 간접비 산출서 →</Link> · 환경 신고(변경 기한까지): <Link to="/forms/bisan-singo" className="kr-link">비산먼지 발생사업 신고서 →</Link> · <Link to="/forms/teukjeong-singo" className="kr-link">특정공사 사전신고서 →</Link></>}
      </div>
      <div className="hint kt-hint">기록이 연장을 정합니다 — 작업일보 · 기상 자료 쓰는 법은 <Link to="/change/period" className="kr-link">길잡이 «공기연장과 간접비» →</Link>{공제 ? <> · <Link to="/tools/toejik-check" className="kr-link">퇴직공제 가입 대상 판단기 →</Link></> : null}</div>
      <근거줄>{r.판정 === 'no' ? 연장근거[곳 + '우리'] : 연장근거[곳 + '모두']}</근거줄>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   🌫️ 착공 전 환경 신고 판단기 (G561) — 비산먼지 · 특정공사(소음 · 진동) · 건설폐기물 처리계획 · 사업장폐기물배출자
   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ⑤-2. 판정 · 조문은 lib/환경신고.js 한 곳(법제처 원문 세 번 읽음)
   ══════════════════════════════════════════════════════════ */
export function EnvReports({ ex = {} }) {
  const [고른, set고른] = use칸('고른', ex.고른 ?? {})
  const [규모, set규모] = use칸('규모', ex.규모 ?? {})
  const [장비, set장비] = use칸('장비', ex.장비 ?? false)
  const [가까이, set가까이] = use칸('가까이', ex.가까이 ?? {})
  const [제외, set제외] = use칸('제외', ex.제외 ?? false)
  const [건폐톤, set건폐톤] = use칸('건폐톤', ex.건폐톤 ?? '')
  const [사업장, set사업장] = use칸('사업장', ex.사업장 ?? false)
  const [착공, set착공] = use칸('착공', ex.착공 ?? '')
  const 값 = { ...환경고른값(고른 || {}, 규모 || {}), 장비: !!장비, 가까이: 가까이 || {}, 제외: !!제외 }
  const 보일칸 = new Set(환경종류.filter((x) => (고른 || {})[x.k]).flatMap((x) => x.칸))
  const 비 = 비산판정(값), 특 = 특정판정(값), 폐 = 폐기판정({ 건폐톤, 사업장: !!사업장 })
  const 판 = {
    비산: { 대상: 비.대상, 걸림: 비.걸림, 까닭: 비.대상 === false ? (비.조례 ? `규모 미만 — 다만 ${비.구역.length ? 비.구역.join(' · ') : '매설공사'} 이면 조례로 신고 대상일 수 있음(별표 13 비고 1 · 2) — 시 · 군 · 구 환경과 확인` : '별표 13 제5호 규모 미만') : '공사 규모를 넣으면 판정' },
    특정: { 대상: 특.대상, 걸림: 특.걸림, 까닭: 특.까닭 || '' },
    건폐: { 대상: 폐.건설, 걸림: 폐.건설 ? [`건설폐기물 예상 ${Number(String(건폐톤).replace(/[^0-9.]/g, '')).toLocaleString('ko-KR')}톤 — 5톤 이상`] : [], 까닭: 폐.건설 === false ? '5톤 미만 — 건설폐기물법의 건설폐기물이 아님(종량제 마대 등은 시 · 군 · 구 안내대로)' : '건설폐기물 예상량(톤)을 넣으면 판정' },
    사업장: { 대상: 폐.사업장 ? true : null, 걸림: 폐.사업장 ? ['건설폐기물이 아닌 사업장폐기물 5톤 이상'] : [], 까닭: 환경사업장풀이 + ' 해당하면 위 칸을 고르세요.' },
  }
  const 배지 = (v) => (v === true ? '✓ 신고 대상' : v === false ? '대상 아님' : '확인')
  const 칸 = (k, v) => set규모({ ...(규모 || {}), [k]: v })
  const 날 = 착공 && /^\d{4}-\d{2}-\d{2}$/.test(착공) ? 날점(착공) : ''
  const 몇 = 환경신고들.filter((x) => 판[x.k].대상 === true).length
  return (
    <div className="tool er">
      <div className="er-kinds-h">공사에 들어 있는 것을 고르세요(여럿 가능)</div>
      <div className="er-kinds">
        {환경종류.map((x) => (
          <label key={x.k} className={'er-kind' + ((고른 || {})[x.k] ? ' on' : '')}><input type="checkbox" checked={!!(고른 || {})[x.k]} onChange={(e) => set고른({ ...(고른 || {}), [x.k]: e.target.checked })} /> <span>{x.이름}</span></label>
        ))}
      </div>
      <div className="tl-grid">
        {환경규모.filter((x) => 보일칸.has(x.k)).map((x) => (
          <Row key={x.k} label={x.이름} hint={x.단위 + (x.풀이 ? ' · ' + x.풀이 : '')}>
            <input inputMode="decimal" value={(규모 || {})[x.k] ?? ''} onChange={(e) => 칸(x.k, e.target.value)} placeholder="0" />
          </Row>
        ))}
        <Row label="건설폐기물 예상량" hint="톤 · 폐콘크리트 · 폐아스팔트콘크리트 · 폐목재 등"><input inputMode="decimal" value={건폐톤} onChange={(e) => set건폐톤(e.target.value)} placeholder="0" /></Row>
        <Row label="착공일" hint="신고 기한"><input type="date" value={착공} onChange={(e) => set착공(e.target.value)} /></Row>
      </div>
      <div className="kt-chks">
        <label className="kt-chk"><input type="checkbox" checked={!!장비} onChange={(e) => set장비(e.target.checked)} /> <span>아래 기계 · 장비를 <b>5일 이상</b> 씀(별표 9)</span></label>
        <details className="kt-all er-eq"><summary>별표 9 기계 · 장비 열하나 보기</summary><div className="er-eqs">{환경장비.join(' · ')}</div></details>
        <label className="kt-chk"><input type="checkbox" checked={!!사업장} onChange={(e) => set사업장(e.target.checked)} /> <span>건설폐기물이 아닌 사업장폐기물이 5톤 이상(폐수처리오니 · 발견된 옛 매립 폐기물 등)</span></label>
        <label className="kt-chk"><input type="checkbox" checked={!!제외} onChange={(e) => set제외(e.target.checked)} /> <span>공사장이 산업단지 · 전용공업지역 · 자유무역지역이거나 300m 안에 주택 · 운동 · 휴양시설이 없음</span></label>
      </div>
      <details className="kt-all er-near" open>
        <summary>공사장 가까이 — 부지 경계선에서 직선 50m 안(또는 그 지역)</summary>
        <div className="kt-chks">
          {환경가까이.map((x) => (
            <label key={x.k} className="kt-chk"><input type="checkbox" checked={!!(가까이 || {})[x.k]} onChange={(e) => set가까이({ ...(가까이 || {}), [x.k]: e.target.checked })} /> <span>{x.이름}</span></label>
          ))}
        </div>
      </details>
      {몇 > 0
        ? <판정칸 종류="good"><b>착공 전에 낼 신고 {몇}가지</b>{날 ? ` — 착공일 ${날} 전(폐기물은 착공일까지)` : ''}</판정칸>
        : <div className="hint">공사를 고르고 규모 · 장비 · 폐기물 양을 넣으면 신고마다 판정합니다. (도장 = 장기수선계획 공동주택의 건물외부 도장 · 관로 매설 = 가스관 · 전선로 · 수도관 · 하수관거 · 통신선로)</div>}
      <div className="er-cards">
        {환경신고들.map((x) => {
          const v = 판[x.k]
          return (
            <div key={x.k} className={'er-card ' + (v.대상 === true ? 'yes' : v.대상 === false ? 'no' : 'q')}>
              <div className="er-h"><b>{x.이름}</b> <span className="er-badge">{배지(v.대상)}</span></div>
              {v.걸림.length ? <ul className="er-why">{v.걸림.map((s) => <li key={s}>{s}</li>)}</ul> : null}
              {v.대상 !== true && v.까닭 ? <div className="er-p">{v.까닭}</div> : null}
              {v.대상 !== false && (
                <div className="er-p">언제: <b>{x.언제}{날 ? `(${날}${x.언제 === '착공 전' ? ' 전' : '까지'})` : ''}</b> · 누가: {x.누가} · 어디: {x.어디} · 서류: {x.서식 ? <Link to={x.서식} className="kr-link">{x.서식이름} →</Link> : x.서식이름}</div>
              )}
              <div className="hj-src1">({환경근거[x.k]})</div>
            </div>
          )
        })}
      </div>
      <div className="hint kt-hint">{굵게(환경함께)} 저소음 · 저진동 기계 · 장비로 장관 인정을 받은 것만 쓰면 특정공사에서 빠집니다(제21조① 단서). 공사를 나눠 발주했으면 규모는 <b>총 공사</b>로 셉니다(별표 13 비고 3).</div>
      <div className="hint kt-hint">착공 뒤 공기가 늘면 이 신고들의 변경신고 기한이 있습니다 — <Link to="/tools/time-extension" className="kr-link">공기연장 때 할 일 →</Link> · 다른 착공 기한은 <Link to="/tools/after-award" className="kr-link">낙찰 뒤 할 일 달력 →</Link></div>
      <근거줄>{환경근거.비산} · {환경근거.특정} · {환경근거.건폐} · {환경근거.사업장}</근거줄>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   🎯 입찰 참가 가능 금액 (G562) — 시공능력평가액 · 실적 제한 · 공동이행
   소장님 「1번 부터 5번까지 작업해줘」 — 카페 도구 후보 ⑤-3(«시평액이 추정가격보다 적은데 단독으로 들어갈 수 있나»)
   판정 · 조문은 lib/입찰참가.js 한 곳(법제처 원문 세 번 읽음) · 여기서는 그리기만
   ══════════════════════════════════════════════════════════ */
const 빈동료 = () => [{ 시평: '', 지분: '', 실적: '' }, { 시평: '', 지분: '', 실적: '' }]
export function BidEligible({ ex = {} }) {
  const [발주, set발주] = use칸('발주', ex.발주 ?? '국가')
  const [종류, set종류] = use칸('종류', ex.종류 ?? '종합')
  const [est, setEst] = use칸('추정', ex.추정 ?? '')   /* 이름 est — tools/checklabels.py 가 «추정가격» 이름표에 est 를 찾습니다(위 계약 준비물과 같음) */
  const [제한, set제한] = use칸('제한', ex.제한 ?? '없음')
  const [기준, set기준] = use칸('기준', ex.기준 ?? '')
  const [우리, set우리] = use칸('우리', ex.우리 ?? '')
  const [실적, set실적] = use칸('실적', ex.실적 ?? '')
  const [우리지분, set우리지분] = use칸('우리지분', ex.우리지분 ?? '')
  const [동료, set동료] = use칸('동료', ex.동료 ?? 빈동료())
  const o = { 발주, 종류, 추정: est, 제한, 기준, 우리, 실적 }
  const r = 참가판정(o)
  const 선 = 참가안전선글(참가안전선(o))
  const 규모 = 제한 === '실적규모'
  const 실적칸 = 제한 === '실적금액' || 규모
  const 시평칸 = 제한 === '없음' || 제한 === '시평'
  const 동 = Array.isArray(동료) && 동료.length ? 동료 : 빈동료()
  const 지분칸 = 발주 === '지방' && 제한 === '시평'
  const 공 = 참가공동(o, [{ 시평: 우리, 지분: 우리지분, 실적 }, ...동])
  const 공값 = 제한 === '시평' ? 공.시평합 : 공.실적값
  const 공보기 = (v) => (규모 ? Number(v || 0).toLocaleString('ko-KR') : (금액말(v) || '0원'))
  const 공판 = 제한 !== '없음' && r.기준 > 0 && 공.줄수 >= 2 && !(지분칸 && 공.지분빔) ? (공값 >= r.기준 ? 'yes' : 'no') : null
  const 동고침 = (i, k, v) => set동료(동.map((m, j) => (j === i ? { ...m, [k]: v } : m)))
  const 공근거 = 참가근거[발주 === '지방' ? '지방공동' : '국가공동']
  const 판글 = r.결과 === 'yes' ? 'good' : r.결과 === 'no' ? 'bad' : ''
  return (
    <div className="tool be">
      <div className="tl-grid">
        <Row label="발주처">
          <select value={발주} onChange={(e) => set발주(e.target.value)}>
            {참가발주.map((x) => <option key={x.k} value={x.k}>{x.이름}</option>)}
          </select>
        </Row>
        <Row label="공사 종류">
          <select value={종류} onChange={(e) => set종류(e.target.value)}>
            {참가종류.map((x) => <option key={x.k} value={x.k}>{x.이름}</option>)}
          </select>
        </Row>
        <금액칸 label="추정가격" hint="공고문의 추정가격 — 기초금액 아님" value={est} set={setEst} placeholder="3,200,000,000" />
        <Row label="공고의 참가 제한" hint="공고문 참가 자격에 적힌 것">
          <select value={제한} onChange={(e) => set제한(e.target.value)}>
            {참가제한.map((x) => <option key={x.k} value={x.k}>{x.이름}</option>)}
          </select>
        </Row>
        {제한 === '시평' && <금액칸 label="공고 시평액 기준" hint="«시공능력평가액 ○○원 이상»" value={기준} set={set기준} placeholder="3,200,000,000" />}
        {제한 === '실적금액' && <금액칸 label="공고 실적 기준" hint="같은 종류 공사 · 한 건 금액" value={기준} set={set기준} placeholder="2,000,000,000" />}
        {규모 && <Row label="공고 실적 규모 · 양" hint="단위는 공고대로(㎞ · ㎡ · ㎥ · 개소 등)"><input inputMode="decimal" value={기준} onChange={(e) => set기준(e.target.value)} placeholder="0" /></Row>}
        {시평칸 && <금액칸 label="우리 시평액" hint="공고 업종의 올해 공시 금액" value={우리} set={set우리} placeholder="2,100,000,000" />}
        {제한 === '실적금액' && <금액칸 label="우리 가장 큰 한 건" hint="같은 종류 공사 실적 금액" value={실적} set={set실적} placeholder="1,800,000,000" />}
        {규모 && <Row label="우리 가장 큰 한 건" hint="공고와 같은 단위"><input inputMode="decimal" value={실적} onChange={(e) => set실적(e.target.value)} placeholder="0" /></Row>}
      </div>
      {(제한 === '시평' || 제한 === '실적금액') && r.추정 > 0 && (
        <div className="be-quick">공고 기준 빨리 넣기:
          <button type="button" className="btn ghost sm" onClick={() => set기준(String(r.추정))}>추정가격만큼</button>
          {제한 === '시평' && 발주 === '지방' && <button type="button" className="btn ghost sm" onClick={() => set기준(String(r.추정 * 2))}>추정가격 × 2</button>}
        </div>
      )}
      {판글 ? <판정칸 종류={판글}><b>{r.제목}</b>{r.글 ? ` — ${r.글}` : ''}</판정칸> : <div className="hint">{r.제목}.</div>}
      {r.알림.map((x) => <div key={x} className="hint kt-hint be-warn">⚠ {x}</div>)}
      <Out items={[
        { k: '이 공사에 시평 · 실적 제한', v: r.걸 === true ? '걸 수 있는 규모' : r.걸 === false ? '걸 수 없는 규모' : '추정가격을 넣으면' },
        { k: '시평 기준 상한', v: r.걸 === false ? '제한 못 함' : r.상한 ? `${금액말(r.상한)} (추정가격 × ${r.배})` : '—' },
        { k: '실적 금액 기준 상한', v: r.걸 === false ? '특수 기술 · 공법 공사만' : r.실적상한 ? `${금액말(r.실적상한)} (추정가격 × 1)` : '—' },
        ...(선 && 시평칸 ? [{ k: '시평으로 안 막히는 공사', v: 선.v, big: true }] : []),
      ]} />
      {선 && 시평칸 && <div className="hint kt-hint">{선.풀이}.</div>}
      {제한 !== '없음' && (
        <details className="kt-all be-jv" open={r.결과 === 'no'}>
          <summary>공동이행으로 들어갈 때 — {발주 === '지방' ? (제한 === '시평' ? '시평 = 각 시평액 × 지분을 더함' : '실적 = 구성원 중 한 곳이라도') : '시평 · 실적 = 구성원 모두 합산'}</summary>
          <div className={'be-rows' + (지분칸 ? ' w3' : '')} role="table">
            <div className="be-tr be-th" role="row"><span>구성원</span><span>{제한 === '시평' ? '시평액' : '실적(한 건)'}</span>{지분칸 && <span>지분 %</span>}</div>
            <div className="be-tr" role="row">
              <span>우리</span>
              <span className="be-v">{제한 === '시평' ? (금액말(금액수(우리)) || '위 칸') : (규모 ? (실적 || '위 칸') : (금액말(금액수(실적)) || '위 칸'))}</span>
              {지분칸 && <input className="inp num" aria-label="우리 지분" inputMode="decimal" value={우리지분} placeholder="%" onChange={(e) => set우리지분(e.target.value.replace(/[^0-9.]/g, '').slice(0, 5))} />}
            </div>
            {동.map((m, i) => (
              <div key={i} className="be-tr" role="row">
                <span>구성원 {i + 2}</span>
                {제한 === '시평'
                  ? <div className="be-c"><금액입력 className="inp num" aria-label={`구성원 ${i + 2} 시평액`} value={m.시평} onValue={(n, d) => 동고침(i, '시평', d)} placeholder="—" /></div>
                  : 규모
                    ? <input className="inp num" aria-label={`구성원 ${i + 2} 실적`} inputMode="decimal" value={m.실적} placeholder="—" onChange={(e) => 동고침(i, '실적', e.target.value)} />
                    : <div className="be-c"><금액입력 className="inp num" aria-label={`구성원 ${i + 2} 실적`} value={m.실적} onValue={(n, d) => 동고침(i, '실적', d)} placeholder="—" /></div>}
                {지분칸 && <input className="inp num" aria-label={`구성원 ${i + 2} 지분`} inputMode="decimal" value={m.지분} placeholder="%" onChange={(e) => 동고침(i, '지분', e.target.value.replace(/[^0-9.]/g, '').slice(0, 5))} />}
              </div>
            ))}
          </div>
          <Out items={[
            { k: 제한 === '시평' ? '공동이행 시평액' : '공동이행 실적', v: 공.줄수 >= 2 ? 공보기(공값) : '구성원을 넣으면', big: true },
            ...(지분칸 ? [{ k: '지분 합계', v: 공.줄수 ? `${공.지분합}%` : '—' }] : []),
          ]} />
          {공판 === 'yes' && <판정칸 종류="good"><b>공동이행이면 들어갈 수 있습니다</b> — 기준 {공보기(r.기준)} · 공동 {공보기(공값)}</판정칸>}
          {공판 === 'no' && <판정칸 종류="bad"><b>공동이행으로도 {공보기(r.기준 - 공값)} 모자랍니다</b></판정칸>}
          {지분칸 && 공.줄수 >= 2 && 공.지분빔 > 0 && <div className="hint kt-hint be-warn">⚠ 지자체 공사는 시평액 × 지분으로 셉니다 — 지분을 안 적은 구성원 {공.지분빔}곳.</div>}
          {지분칸 && 공.줄수 >= 2 && !공.지분빔 && Math.abs(공.지분합 - 100) > 0.001 && <div className="hint kt-hint be-warn">⚠ 지분 합계가 {공.지분합}% 입니다 — 100% 가 돼야 합니다.</div>}
          <div className="hint kt-hint">{공.풀이[제한 === '시평' ? '시평' : '실적']}({공근거}).{발주 === '지방' ? ' 주계약자 관리방식은 주계약자의 해당 업종 시평액으로 봅니다.' : ''} 구성원 수 · 최소 지분 · 협정서는 <Link to="/gongdong" className="kr-link">공동도급 마당 →</Link></div>
        </details>
      )}
      {참가안내(발주).map((x) => <div key={x.slice(0, 12)} className="hint kt-hint">{굵게(x)}</div>)}
      <div className="hint kt-hint">적격심사 시공경험 점수는 따로 셉니다 — <Link to="/tools/qualify-docs" className="kr-link">적격심사 서류 길잡이 →</Link> · <Link to="/tools/qualify-score" className="kr-link">적격심사 점수 합산기 →</Link></div>
      <근거줄>{참가근거[발주 === '지방' ? '지방모두' : '국가모두']}</근거줄>
    </div>
  )
}

export const 계약EXAMPLES = {
  'joint-split': { 글: '계약 10억 원 · 대표사 60% · 구성원 40% · 1회 기성 3억 원 · 선금 각 20%', ex: { 계약: '1,000,000,000', 금회: '300,000,000', 방식: '지분', 준공: false, 끝전: 0, 구성원: [{ 이름: '', 지분: '60', 선금: '120,000,000', 전회: '', 전회정산: '', 직접: '', _: 0 }, { 이름: '', 지분: '40', 선금: '80,000,000', 전회: '', 전회정산: '', 직접: '', _: 1 }] } },
  'payment-deadline': { 글: '국가 공사 · 11월 4일(수) 기성검사 완료 · 검사 전에 청구', ex: { 무엇: '기성', 발주: '국가', 검사: '2026-11-04', 청구: '' } },
  'subcontract-check': { 글: '지자체 발주 · 상당금액 2억 5천만 원인 부분을 2억 원에 하도급 · 도급 12억 원', ex: { 발주: '지자체', 상당: '250,000,000', 예가: '260,000,000', 하도: '200,000,000', 도급: '1,200,000,000', 노무: '300,000,000', 직접: '70,000,000' } },
  'after-award': { 글: '국가 발주 8억 5천만 원 공사 · 10월 5일 낙찰 통지 · 10월 20일 착공 · 하도급 1억 2천만 원', ex: { 낙찰일: '2026-10-05', 착공일: '2026-10-20', 발주: '국가', 도급: '850,000,000', 공기: '180', 안전: true, 하도일: '2026-10-26', 하도금: '120,000,000' } },
  'delay-penalty': { 글: '국가 공사 5억 원 · 준공기한 11월 30일 · 12월 15일 준공검사 합격', ex: { 곳: '국가', 종: '공사', 계약: '500,000,000', 기한: '2026-11-30', 합격: '2026-12-15' } },
  'defect-period': { 글: '아스팔트 포장 도로 3억 원 · 12월 20일 준공검사', ex: { k: 'd2', 시작: '2026-12-20', 계약: '300,000,000' } },
  'contract-ready': { 글: '국가 공사 2억 5천만 원 · 계약기간 11월 16일 ~ 내년 3월 31일', ex: { 발주: '국가', 계약: '250,000,000', 시작: '2026-11-16', 끝: '2027-03-31' } },
  'toejik-check': { 글: '지자체 발주 건설공사 · 공사예정금액 1억 5천만 원 · 11월 16일 착공', ex: { 종류: '건설', 발주: '국가', 금액: '150,000,000', 건축: '', 착공: '2026-11-16' } },
  'time-extension': { 글: '국가 공사 · 책임 없는 설계변경 · 준공기한 12월 31일 → 내년 2월 14일 · 12월 10일 변경계약 · 하도급 · 퇴직공제', ex: { 발주: '국가', 까닭: '없음', 지금: '2026-12-31', 새것: '2027-02-14', 합의: '2026-12-10', 장기: false, 하도급: true, 공제: true } },
  'env-reports': { 글: '근린생활시설 신축 연면적 3,200㎡ · 토공 1,800㎡ · 굴착기 등 5일 이상 · 공동주택 50m 안 · 건설폐기물 120톤 · 11월 16일 착공', ex: { 고른: { 건축: true, 토공: true }, 규모: { 건축: '3200', 토공: '1800' }, 장비: true, 가까이: { 공동주택: true }, 제외: false, 건폐톤: '120', 사업장: false, 착공: '2026-11-16' } },
  'bid-eligible': { 글: '지자체 종합공사 · 추정가격 32억 원 · 공고에 시평 · 실적 제한 없음 · 우리 시평액 21억 원', ex: { 발주: '지방', 종류: '종합', 추정: '3,200,000,000', 제한: '없음', 기준: '', 우리: '2,100,000,000', 실적: '', 우리지분: '', 동료: [{ 시평: '', 지분: '', 실적: '' }, { 시평: '', 지분: '', 실적: '' }] } },
}
export const 계약CALCS = {
  'subcontract-check': SubcontractCheck,
  'after-award': AfterAward,
  'delay-penalty': DelayPenalty,
  'defect-period': DefectPeriod,
  'payment-deadline': PaymentDeadline,
  'joint-split': JointSplit,
  'contract-ready': ContractReady,
  'toejik-check': ToejikCheck,
  'time-extension': TimeExtension,
  'env-reports': EnvReports,
  'bid-eligible': BidEligible,
}
