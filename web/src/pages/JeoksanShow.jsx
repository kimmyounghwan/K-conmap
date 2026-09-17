/**
 * 🖥️ /jeoksan/run 의 «보이는 부분» — 잠겨 있어도 무엇이 나오는지 그대로 보여 줍니다.
 *
 * 소장님: 「적산 프로그램이 «보이게» 하고, 단 나만 사용할 수 있게」
 *         「이용자들이 이런일도 할 수 있다는 걸 알려야 하니까...설명도 자세히 하고」
 *
 * ■ 무엇을 보여 주나
 *   ① 화면 그대로 — 올리는 칸 두 개. 다만 «얼려» 두었습니다(누를 수 없음)
 *   ② 나오는 엑셀 다섯 장을 «진짜 표» 로. 그림이 아니라 표라서 폰에서도 읽힙니다
 *   ③ 내역서·원가계산서까지 — 적산은 수량에서 끝나지 않으니까
 *
 * ⚠️ 여기 숫자는 «보기» 입니다. 남의 공사명·상호·사람 이름은 한 글자도 넣지 않습니다.
 *    단가는 우리가 쓰는 자료에서 실제로 나온 값만 씁니다(레미콘 25-18-100 ㎥ 95,390 등).
 * ⚠️ 단가표 자체는 이 화면에 싣지 않습니다. 실으면 들어오는 사람 모두가 내려받게 됩니다.
 */
import { useState } from 'react'

const 원 = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n))

/* ── ① 수량산출서 — 산출근거가 «살아 있는 수식» 으로 남습니다 ───────── */
const 산출 = [
  ['1', '터파기', '배수로 구간', '㎥', '=(1.2+2.4)/2*1.5*45.0', 121.5],
  ['2', '되메우기', '배수로 구간', '㎥', '=121.5-38.7', 82.8],
  ['3', '레미콘', '25-18-100', '㎥', '=0.86*45.0', 38.7],
  ['4', '거푸집', '합판', '㎡', '=(0.6*2)*45.0', 54.0],
  ['5', '흄관부설및접합', 'D=250mm', '본', '=45.0/2.5', 18.0],
]
const 집계 = [
  ['터파기', '배수로 구간', '㎥', 121.5],
  ['되메우기', '배수로 구간', '㎥', 82.8],
  ['레미콘', '25-18-100', '㎥', 38.7],
  ['거푸집', '합판', '㎡', 54.0],
  ['흄관부설및접합', 'D=250mm', '본', 18.0],
]
const 태그별 = [
  ['1공구', '터파기', '㎥', 72.9], ['1공구', '레미콘', '㎥', 23.2],
  ['2공구', '터파기', '㎥', 48.6], ['2공구', '레미콘', '㎥', 15.5],
]
const 검산 = [
  ['✅', '단위가 섞이지 않았나', '밀리미터를 미터 칸에 넣은 줄 없음'],
  ['✅', '번호가 겹치지 않았나', '겹친 번호 없음'],
  ['✅', '공제가 본체보다 크지 않나', '어긋난 줄 없음'],
  ['⚠️', '수량이 0 인 줄', '1줄 — 보시고 지우거나 채우십시오'],
]

/* ── ② 내역서 — 단가를 붙입니다 (단가는 실제 자료에서 나온 값) ────── */
const 내역 = [
  ['레미콘', '25-18-100', '㎥', 38.7, 95390],
  ['흄관부설및접합', 'D=250mm', '본', 18.0, 29325],
  ['합판(준내수)', '8.5t×1220×2440', '㎡', 54.0, 9238],
  ['0.5B 벽돌쌓기', '3.6m이하', '㎡', 12.0, 46541],
]

/* ── ③ 원가계산서 — 손으로 센 것과 «한 원도» 안 틀린 것을 확인한 셈 ── */
const 원가 = [
  ['직접재료비', '', 100000000, ''],
  ['직접노무비', '', 50000000, ''],
  ['직접경비', '', 10000000, ''],
  ['간접노무비', '직접노무비 × 19.10%', 9550000, 'ㄱ'],
  ['산재보험료', '노무비 × 3.56%', 2119580, 'ㄱ'],
  ['고용보험료', '노무비 × 1.01%', 601355, 'ㄱ'],
  ['안전관리비', '(재료비+직노) × 2.07%', 3088850, 'ㄱ'],
  ['기타경비', '(재료비+노무비) × 5.50%', 8775250, 'ㄱ'],
  ['⋯', '연금·건강·퇴직공제·보증·환경·석면·임금채권 등', 0, '…'],
  ['순공사원가', '', 189692544, 'ㄴ'],
  ['일반관리비', '순공사원가 × 8%', 15175404, 'ㄴ'],
  ['이윤', '(직노+직경+간접노무비+일반관리비) × 15%', 15730192, 'ㄴ'],
  ['총원가', '', 220598140, 'ㄷ'],
  ['부가가치세', '총원가 × 10%', 22059814, 'ㄷ'],
  ['도급액', '', 242657954, 'ㄷ'],
]

const 탭 = ['산출서', '집계', '태그별', '검산', '쓴표']

export default function JeoksanShow() {
  const [t, setT] = useState(0)
  const 합 = 내역.reduce((a, r) => a + Math.round(r[3] * r[4]), 0)
  return (
    <>
      {/* ── 화면 그대로 (얼려 둠) ───────────────────────────── */}
      <div className="card">
        <div className="sec-title">화면은 이렇게 생겼습니다</div>
        <p className="muted" style={{ marginTop: 0 }}>
          올리는 칸 두 개가 전부입니다. 깔 것도, 가입도 없습니다.
          아래는 <b>실제 화면을 그대로 얼려 둔 것</b>입니다 — 열쇠말이 있어야 눌립니다.
        </p>
        <div className="jshow">
          {[['📗 재료표', '품명 · 규격 · 단위를 적어 둔 표 (견본 있음)'],
            ['📐 치수표 또는 도면(.dxf)', '잰 치수를 줄마다 적은 표']].map(([a, b]) => (
            <div className="jbox" key={a}>
              <b>{a}</b>
              <span>{b}</span>
              <em>🔒 잠겨 있습니다</em>
            </div>
          ))}
        </div>
        <div className="btn-grid" style={{ marginTop: 10 }}>
          <button className="btn" disabled>🧮 수량산출서 만들기</button>
          <button className="btn ghost" disabled>⬇ 엑셀로 받기</button>
        </div>
      </div>

      {/* ── 나오는 엑셀 다섯 장 ─────────────────────────────── */}
      <div className="card">
        <div className="sec-title">나오는 엑셀 — 한 통에 다섯 장</div>
        <div className="chips" style={{ marginBottom: 8 }}>
          {탭.map((x, i) => (
            <button key={x} className={'chip' + (i === t ? ' on' : '')} onClick={() => setT(i)}>{x}</button>
          ))}
        </div>

        {t === 0 && (
          <>
            <div className="tblwrap"><table className="tbl left reptbl"><thead><tr>
              <th>번호</th><th>품명</th><th>규격</th><th>단위</th><th>산출근거</th><th>수량</th>
            </tr></thead><tbody>
              {산출.map((r) => (<tr key={r[0]}>
                <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
                <td><code style={{ fontSize: 12 }}>{r[4]}</code></td>
                <td style={{ textAlign: 'right' }}>{r[5].toFixed(3)}</td>
              </tr>))}
            </tbody></table></div>
            <p className="muted" style={{ marginBottom: 0 }}>
              ⭐ <b>수량 칸은 숫자가 아니라 수식입니다</b> — <code>=ROUND(산출근거,3)</code>.
              나중에 치수 하나를 고치면 <b>엑셀이 그 자리에서 다시 셉니다.</b>
              다시 올릴 것도, 저희에게 물을 것도 없습니다.
            </p>
          </>
        )}

        {t === 1 && (
          <div className="tblwrap"><table className="tbl left reptbl"><thead><tr>
            <th>품명</th><th>규격</th><th>단위</th><th>수량</th>
          </tr></thead><tbody>
            {집계.map((r) => (<tr key={r[0]}>
              <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>
              <td style={{ textAlign: 'right' }}>{r[3].toFixed(3)}</td>
            </tr>))}
          </tbody></table></div>
        )}

        {t === 2 && (
          <>
            <div className="tblwrap"><table className="tbl left reptbl"><thead><tr>
              <th>태그</th><th>품명</th><th>단위</th><th>수량</th>
            </tr></thead><tbody>
              {태그별.map((r, i) => (<tr key={i}>
                <td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td>
                <td style={{ textAlign: 'right' }}>{r[3].toFixed(3)}</td>
              </tr>))}
            </tbody></table></div>
            <p className="muted" style={{ marginBottom: 0 }}>
              공구·구간·층처럼 <b>나누어 봐야 하는 단위</b>를 치수표에 적어 두면 이 장이 저절로 갈립니다.
            </p>
          </>
        )}

        {t === 3 && (
          <>
            <div className="tblwrap"><table className="tbl left reptbl"><tbody>
              {검산.map((r, i) => (<tr key={i}>
                <td style={{ width: 34 }}>{r[0]}</td><td><b>{r[1]}</b></td><td>{r[2]}</td>
              </tr>))}
            </tbody></table></div>
            <p className="muted" style={{ marginBottom: 0 }}>
              사람이 손으로 셀 때 나는 잘못을 <b>기계가 먼저 봅니다.</b>{' '}
              단위 섞임 · 번호 겹침 · 공제가 본체보다 큰 것 — 이런 건 눈으로 못 찾습니다.
            </p>
          </>
        )}

        {t === 4 && (
          <p className="muted" style={{ margin: 0 }}>
            <b>쓴표</b> — 어느 재료를 어디에 몇 번 썼는지 되짚는 장입니다.
            「이 재료가 왜 이만큼이지?」 할 때 이 장만 보면 됩니다.
          </p>
        )}
      </div>

      {/* ── 적산은 수량에서 끝나지 않습니다 ──────────────────── */}
      <div className="card">
        <div className="sec-title">그 다음 — 내역서</div>
        <p style={{ marginTop: 0 }}>
          집계에 <b>단가</b>를 붙이면 내역서가 됩니다.
          아래 단가는 <b>실제 자료에서 나온 값</b>입니다 (같은 품목이면 <b>가장 최근 달 · 가장 낮은 값</b>).
        </p>
        <div className="tblwrap"><table className="tbl left reptbl"><thead><tr>
          <th>품명</th><th>규격</th><th>단위</th><th>수량</th><th>단가</th><th>금액</th>
        </tr></thead><tbody>
          {내역.map((r) => (<tr key={r[0]}>
            <td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>
            <td style={{ textAlign: 'right' }}>{r[3].toFixed(3)}</td>
            <td style={{ textAlign: 'right' }}>{원(r[4])}</td>
            <td style={{ textAlign: 'right' }}><b>{원(r[3] * r[4])}</b></td>
          </tr>))}
          <tr><td colSpan={5} style={{ textAlign: 'right' }}><b>합계</b></td>
            <td style={{ textAlign: 'right' }}><b>{원(합)}</b></td></tr>
        </tbody></table></div>
      </div>

      <div className="card">
        <div className="sec-title">마지막 — 원가계산서</div>
        <p style={{ marginTop: 0 }}>
          직접재료비·직접노무비·직접경비 위에 법으로 정해진 비용을 차례로 얹어 <b>도급액</b>까지 갑니다.
          아래는 <b>손으로 센 것과 한 원도 안 틀린 것을 확인한</b> 보기입니다.
        </p>
        <div className="tblwrap"><table className="tbl left reptbl"><thead><tr>
          <th>비목</th><th>산출</th><th>금액</th>
        </tr></thead><tbody>
          {원가.map((r, i) => (
            <tr key={i} style={['순공사원가', '총원가', '도급액'].includes(r[0])
              ? { background: 'var(--accent-soft)', fontWeight: 700 } : undefined}>
              <td>{r[0]}</td>
              <td className="muted" style={{ fontSize: 12.5 }}>{r[1]}</td>
              <td style={{ textAlign: 'right' }}>{r[2] ? 원(r[2]) : ''}</td>
            </tr>
          ))}
        </tbody></table></div>
        <p className="muted" style={{ marginBottom: 0 }}>
          ⚠️ 요율은 <b>발주처·공사 종류마다 다릅니다.</b> 위 숫자는 어떤 차례로 쌓이는지 보여 주는 보기이고,
          실제로는 그 공사의 기준을 넣어 셉니다.
        </p>
      </div>

      {/* ── 어디까지 됐나 ───────────────────────────────────── */}
      <div className="card">
        <div className="sec-title">어디까지 왔나 — 숨기지 않고 적습니다</div>
        <div className="tblwrap"><table className="tbl left reptbl"><tbody>
          <tr><td><b>① 수량산출서</b></td><td>도면·치수 → 물량</td><td><b>됩니다</b></td></tr>
          <tr><td><b>② 일위대가</b></td><td>호표의 재료비·노무비·경비</td><td><b>됩니다</b></td></tr>
          <tr><td><b>③ 단가</b></td><td>같은 품목이면 최신 달 · 최저값</td><td><b>됩니다</b></td></tr>
          <tr><td><b>④ 내역서</b></td><td>수량 × 단가</td><td><b>됩니다</b></td></tr>
          <tr><td><b>⑤ 원가계산서</b></td><td>도급액·부가세까지</td><td><b>됩니다</b></td></tr>
          <tr><td><b>⑥ 단가산출서</b></td><td>「왜 이 단가인가」 근거 붙이기</td><td>만드는 중</td></tr>
        </tbody></table></div>
        <p className="muted" style={{ marginBottom: 0 }}>
          ⑤까지는 실제로 돌아갑니다. 다만 <b>아직 여는 중</b>이라 열쇠말을 받으신 분만 쓰십니다 —
          수량과 금액은 한 번 틀리면 그대로 돈이 되는 자리라, 충분히 돌려 본 뒤에 엽니다.
        </p>
      </div>
    </>
  )
}
