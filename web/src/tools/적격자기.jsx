/* 🏛 G795 (2026-11-20) 지방 적격심사 자기평가 계산기 — 화면만(셈 · 근거는 lib/지방적격.js · 설명 글은 data/tools.json «qualify-self»)
 *   소장님 「답글주고, 도구로 가능해?」 → 「만들어 줘」(카페 «적격심사 자기평가표 계산법 도움주세요»)
 *   실적 · 부채비율 · 유동비율 · 입찰가격 · 예정가격 · A값을 넣으면 항목 점수 · 합계 · 95점 통과 · 이 점수로 통과하는 가장 낮은 입찰가격
 */
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Row, Out, use칸 } from './calcs.jsx'
import { 셈, 점글, 신용들, 사고들, 통과점수 } from '../lib/지방적격.js'
import { 세기 } from '../lib/받은수.jsx'

const 원글 = (v) => (v == null ? '—' : BigInt(v).toLocaleString('ko-KR') + '원')
const 퍼글 = (q) => (q / 100).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

export function QualifySelf({ ex = {} }) {
  const [추정, set추정] = use칸('est', ex.est ?? '')
  const [종류, set종류] = use칸('kind', ex.kind ?? '종합')
  const [제한, set제한] = use칸('lim', ex.lim ?? '아님')
  const [실적, set실적] = use칸('perf', ex.perf ?? '')
  const [기간, set기간] = use칸('term', ex.term ?? '미만')
  const [십년, set십년] = use칸('ten', ex.ten ?? '')
  const [경영법, set경영법] = use칸('fin', ex.fin ?? '재무')
  const [부채, set부채] = use칸('debt', ex.debt ?? '')
  const [부채평균, set부채평균] = use칸('debtAvg', ex.debtAvg ?? '')
  const [유동, set유동] = use칸('cur', ex.cur ?? '')
  const [유동평균, set유동평균] = use칸('curAvg', ex.curAvg ?? '')
  const [신용, set신용] = use칸('credit', ex.credit ?? 'a')
  const [특신, set특신] = use칸('special', ex.special ?? false)
  const [사고, set사고] = use칸('acc', ex.acc ?? '')
  const [접근, set접근] = use칸('near', ex.near ?? false)
  const [감점, set감점] = use칸('minus', ex.minus ?? '')
  const [입찰, set입찰] = use칸('bid', ex.bid ?? '')
  const [예정, set예정] = use칸('plan', ex.plan ?? '')
  const [A, setA] = use칸('aval', ex.aval ?? '')

  const r = 셈({ 추정, 종류, 제한: 제한 === '제한', 실적, 넷이상: 기간 === '이상', 십년, 경영법, 부채, 부채평균, 유동, 유동평균, 신용, 특신, 사고, 접근, 감점, 입찰, 예정, A })
  const b = r.b
  const 셈함 = useRef(false)
  useEffect(() => {
    if (셈함.current || r.합 == null || (ex && Object.keys(ex).length)) return
    셈함.current = true
    try { 세기('|적격자기|셈') } catch (e) { /* 없음 */ }
  }, [r.합])   // eslint-disable-line react-hooks/exhaustive-deps

  const 별 = b && !b.밖 ? b.별표 : 0
  const 실적힌트 = 별 === 4 ? '원 · 최근 5년' : '원 · 최근 3년 + 올해 준공분'   /* 짧게 — 긴 도움말은 이름표를 좁혀 꺾음(관급 빼기는 묶음 제목 옆) */
  const 특신보임 = 별 >= 5
  const 접근보임 = r.접근대상
  const 접근말 = 별 === 6 && 종류 !== '전문' ? '접근성 0.2점' : '접근성 +1점'

  return (
    <div className="tool jq">
      <div className="jq-h">① 공고</div>
      <div className="tl-grid">
        <Row label="추정가격" hint="원 · 부가세 빼고 · 공고서">
          <input inputMode="numeric" value={추정} onChange={(e) => set추정(e.target.value)} placeholder="예: 650,000,000" />
        </Row>
        <Row label="공사 종류">
          <select value={종류} onChange={(e) => set종류(e.target.value)}>
            <option value="종합">종합공사(토목 · 건축 · 토건 · 산업환경설비 · 조경)</option>
            <option value="전문">전문 · 그 밖의 공사(전기 · 정보통신 · 소방 등)</option>
          </select>
        </Row>
      </div>
      {b && (
        <div className={'jq-band' + (b.밖 ? ' out' : '')}>
          {b.밖
            ? <><b>{b.이름}</b> — {b.글}</>
            : <><b>[별표 {b.별표}] {b.이름}</b> — 수행능력 {점글(b.수행)} + 입찰가격 {b.가격} · <b>{통과점수}점 이상 통과</b> · 공고 하한율은 보통 {b.하한율}%</>}
        </div>
      )}

      {b && !b.밖 && (
        <>
          <div className="jq-h">② 시공경험 <span className="jq-max">{점글(r.시.만점 ?? b.시공)}점</span><span className="jq-sub">실적은 관급 · 지급자재 빼고</span></div>
          <div className="tl-grid">
            <Row label="입찰 방법" hint="공고서">
              <select value={제한} onChange={(e) => set제한(e.target.value)}>
                <option value="아님">시공실적 제한 없음(보통)</option>
                <option value="제한">시공실적으로 참가자격 제한</option>
              </select>
            </Row>
            {제한 === '제한' && (
              <Row label="10년 동일 종류 실적" hint="평가기준규모 대비 %">
                <input inputMode="decimal" value={십년} onChange={(e) => set십년(e.target.value)} placeholder="예: 120" />
              </Row>
            )}
            {!(별 === 7 && r.시.글.startsWith('추정가격 8천만')) && (제한 !== '제한' || 별 === 4 || 별 === 5) && (
              <Row label="업종 실적" hint={실적힌트}>
                <input inputMode="numeric" value={실적} onChange={(e) => set실적(e.target.value)} placeholder="예: 1,200,000,000" />
              </Row>
            )}
            {별 >= 5 && 제한 !== '제한' && (
              <Row label="실적인정기간" hint="작년 실적 확정 전이면 4년 이상">
                <select value={기간} onChange={(e) => set기간(e.target.value)}>
                  <option value="미만">4년 미만(작년 실적 확정 · 보통)</option>
                  <option value="이상">4년 이상(작년 실적 확정 전)</option>
                </select>
              </Row>
            )}
          </div>
          {r.시.글 && <div className="jq-why">{r.시.글} → <b>{점글(r.시.점)}점</b></div>}

          <div className="jq-h">③ 경영상태 <span className="jq-max">{점글(b.경영)}점</span></div>
          <div className="tl-grid">
            <Row label="평가 방법" hint="입찰자가 고름">
              <select value={경영법} onChange={(e) => set경영법(e.target.value)}>
                <option value="재무">재무비율(부채 · 유동비율)</option>
                <option value="신용">신용평가등급</option>
                <option value="종합">둘 다(재무 0.3 + 신용 0.7)</option>
              </select>
            </Row>
            {(경영법 === '신용' || 경영법 === '종합') && (
              <Row label="신용평가등급">
                <select value={신용} onChange={(e) => set신용(e.target.value)}>
                  {신용들.map(([k, 글]) => <option key={k} value={k}>{글}</option>)}
                </select>
              </Row>
            )}
          </div>
          {(경영법 === '재무' || 경영법 === '종합') && (
            <div className="tl-grid">
              <Row label="부채비율" hint="%">
                <input inputMode="decimal" value={부채} onChange={(e) => set부채(e.target.value)} placeholder="예: 85.4" />
              </Row>
              <Row label="업종평균 부채비율" hint="% · 협회 통보 값">
                <input inputMode="decimal" value={부채평균} onChange={(e) => set부채평균(e.target.value)} placeholder="공고서 · 협회" />
              </Row>
              <Row label="유동비율" hint="%">
                <input inputMode="decimal" value={유동} onChange={(e) => set유동(e.target.value)} placeholder="예: 210.5" />
              </Row>
              <Row label="업종평균 유동비율" hint="% · 협회 통보 값">
                <input inputMode="decimal" value={유동평균} onChange={(e) => set유동평균(e.target.value)} placeholder="공고서 · 협회" />
              </Row>
            </div>
          )}
          {r.경.글 && <div className="jq-why">{r.경.글} → <b>{점글(r.경.점)}점</b></div>}

          <div className="jq-h">④ 가점 · 감점 <span className="jq-sub">수행능력 {점글(b.수행)}점 안에서만</span></div>
          <div className="tl-grid">
            <Row label="사고사망만인율" hint="최근 3년 평균 대비">
              <select value={사고} onChange={(e) => set사고(e.target.value)}>
                {사고들.map(([k, 글]) => <option key={k} value={k}>{글}</option>)}
              </select>
            </Row>
            <Row label="결격 감점" hint="점 · 없으면 비움">
              <input inputMode="decimal" value={감점} onChange={(e) => set감점(e.target.value)} placeholder="0" />
            </Row>
          </div>
          {(특신보임 || 접근보임) && (
            <div className="jq-chk">
              {특신보임 && (
                <label className={'qd-c' + (특신 ? ' on' : '')}>
                  <input type="checkbox" checked={!!특신} onChange={(e) => set특신(e.target.checked)} />
                  <span><b>특별신인도 +1</b><i>여성기업 · 장애인기업 · 인구감소지역 본점(또는 그런 업체 20% 이상 공동수급)</i></span>
                </label>
              )}
              {접근보임 && (
                <label className={'qd-c' + (접근 ? ' on' : '')}>
                  <input type="checkbox" checked={!!접근} onChange={(e) => set접근(e.target.checked)} />
                  <span><b>{접근말}</b><i>{별 === 5 ? '5억 미만 · 현장 시 · 군과 인접 시 · 군에 주된 사무소(전기 · 정보통신 · 소방 · 특별 · 광역시 공사 등 빼고)' : '현장 시 · 군과 인접 시 · 군에 주된 사무소 · 그 시 · 군 신설업체 · 특별 · 광역시 공사 등은 모두'}</i></span>
                </label>
              )}
            </div>
          )}

          <div className="jq-h">⑤ 입찰가격 <span className="jq-max">{b.가격}점</span></div>
          <div className="tl-grid jq-three">
            <Row label="입찰가격(투찰금액)" hint="원">
              <input inputMode="numeric" value={입찰} onChange={(e) => set입찰(e.target.value)} placeholder="예: 590,000,000" />
            </Row>
            <Row label="예정가격" hint="원 · 개찰 결과">
              <input inputMode="numeric" value={예정} onChange={(e) => set예정(e.target.value)} placeholder="예: 650,800,000" />
            </Row>
            <Row label="A값" hint="원 · 공고 · 기초금액 발표">
              <input inputMode="numeric" value={A} onChange={(e) => setA(e.target.value)} placeholder="예: 33,500,000" />
            </Row>
          </div>
          {r.가 && <div className="jq-why">(입찰가격 − A) ÷ (예정가격 − A) = {r.가.날비율.toLocaleString('ko-KR', { maximumFractionDigits: 4 })}% → 다섯째 자리 반올림 {퍼글(r.가.q)} → <b>{점글(r.가.점)}점</b>{r.가.넘음 ? ' · 예정가격보다 높으면 낙찰 대상이 아닙니다' : ''}</div>}

          <Out items={[
            { k: '시공경험', v: r.시.점 != null ? 점글(r.시.점) + '점' : '—' },
            { k: '경영상태', v: r.경.점 != null ? 점글(r.경.점) + '점' : '—' },
            { k: '가점', v: r.특 + r.접 > 0 ? '+' + 점글(r.특 + r.접) + '점' : '—' },
            { k: '수행능력', v: r.다됨 ? `${점글(r.수행)} / ${점글(b.수행)}점` : '—' },
            { k: '입찰가격', v: r.가 ? 점글(r.가.점) + '점' : '—' },
            ...(r.감 > 0 ? [{ k: '결격 감점', v: '−' + 점글(r.감) + '점' }] : []),
            { k: '종합평점', v: r.합 != null ? 점글(r.합) + '점' : '—', big: true },
            { k: `${통과점수}점 통과`, v: r.합 != null ? (r.통과 ? `통과 (+${점글(r.차)})` : `미달 (${점글(-r.차)}점 모자람)`) : '—' },
          ]} />
          {r.다됨 && (
            <div className={'jq-low' + (r.못닿음 ? ' no' : '')}>
              {r.못닿음
                ? <>이 수행능력({점글(r.수행)}점)이면 입찰가격이 만점이어도 {통과점수}점이 안 됩니다.</>
                : r.최저
                  ? <>이 수행능력({점글(r.수행)}점)으로 통과하는 가장 낮은 입찰가격 <b>{원글(r.최저.원)}</b> — (입찰가격 − A) ÷ (예정가격 − A)가 반올림해 <b>{퍼글(r.최저.q)}</b> 이상</>
                  : <>예정가격 · A값을 넣으면 통과하는 가장 낮은 입찰가격이 나옵니다.</>}
            </div>
          )}
        </>
      )}
      <div className="hint">행정안전부 예규 «지방자치단체 입찰시 낙찰자 결정기준»(제393호 · 2026. 11. 2. 시행) 제2장의1 [별표 4] ~ [별표 7] 그대로 셉니다 — 업종 하나 · 단독 입찰 기준입니다. <b>공고서 기준이 다르면 공고서가 우선</b>입니다.</div>
      <div className="qd-go">
        <Link className="btn line sm" to="/tools/qualify-docs" onClick={() => { try { 세기('|적격자기|서류') } catch (e) { /* 없음 */ } }}>🗂 실적인정기간 · 서류</Link>
        <Link className="btn line sm" to="/tools/qualify-score" onClick={() => { try { 세기('|적격자기|합산기') } catch (e) { /* 없음 */ } }}>✅ 점수 합산기(30억 이상 · 다른 기관)</Link>
      </div>
    </div>
  )
}

/* 🧪 예시 — 가상의 공사 숫자(남의 공고 · 금액을 옮기지 않음) · slug 는 tools.json «qualify-self» 와 짝(pages/Tools.jsx 가 합침) */
export const 적격자기EXAMPLES = {
  'qualify-self': {
    글: '추정가격 6억 5천만 원 종합공사 · 실적 12억 · 부채비율 85.4%(평균 120%) · 유동비율 210.5%(평균 150%) · 입찰가격 5억 9,900만 원(가상)',
    ex: { est: '650,000,000', kind: '종합', lim: '아님', perf: '1,200,000,000', term: '미만', fin: '재무', debt: '85.4', debtAvg: '120', cur: '210.5', curAvg: '150', credit: 'a', bid: '599,000,000', plan: '663,000,000', aval: '33,500,000' },
  },
}
export const 적격자기CALCS = { 'qualify-self': QualifySelf }
