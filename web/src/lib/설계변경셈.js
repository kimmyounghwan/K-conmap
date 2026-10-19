/**
 * 설계변경 증감 계산 «한 벌» — 화면(pages/Change.jsx /change/calc)과 시험(tools/시험_설계변경계산.mjs)이 같이 씁니다.
 * 🩹 2026-10-20 G328 — JSX 안에 있어 node 시험이 못 불렀던 것을 이리로 옮김.
 */
/* ── 계산 — 화면과 검사가 같이 쓰는 «한 벌» ──────
   ⚠️ 규정을 코드로 옮긴 자리입니다. 바꾸려면 근거부터 다시 확인할 것.
      증가 물량 = 계약단가(계약단가 > 예정가격단가면 예정가격단가)
      신규 비목 = 설계변경 당시 단가 × 낙찰률
      발주기관 요구 = 협의, 불성립 시 두 값의 중간 */
export function calcRow(r, rate) {
  const n = (v) => Number(String(v ?? '').replace(/[^0-9.-]/g, '')) || 0
  /* 🩹 2026-10-20 G328 — 단가 · 조정액은 «원 미만 버림»(내역서 ROUNDDOWN 과 같게).
     소장님 검증 때 신규비목 15,000 × 90.535% = 13,580.25원을 그대로 곱해 화면 «13,580원 × 12.5» 와 조정액(169,753)이 3원 달랐습니다. */
  const 버림 = (x) => (x < 0 ? -Math.floor(-x + 1e-9) : Math.floor(x + 1e-9))
  const q0 = n(r.q0), q1 = n(r.q1)
  const uc = 버림(n(r.upCtr)), ue = 버림(n(r.upEst)), un = n(r.upNow)
  const owner = r.by === 'owner'
  const mid = 버림(un * (1 + rate) / 2)
  if (r.kind === 'dec') {
    const q = q1 - q0
    return { qty: q, unit: uc, amt: 버림(q * uc), why: '감소분은 계약단가로 감액합니다.' }
  }
  if (r.kind === 'inc') {
    const q = q1 - q0
    if (owner) return { qty: q, unit: mid, amt: 버림(q * mid), owner: true,
      why: '발주기관이 요구한 증가분(계약상대자에게 책임 없는 사유로 바뀐 것 포함) → 협의 대상입니다. 협의가 안 될 때의 기준(설계변경 당시 단가와 낙찰률 적용 단가의 중간)으로 계산했습니다.' }
    const useEst = ue > 0 && uc > ue
    const u = useEst ? ue : uc
    return { qty: q, unit: u, amt: 버림(q * u),
      why: useEst ? '계약단가가 예정가격단가보다 높아 예정가격단가를 적용했습니다.'
                  : '증가분은 계약단가를 적용합니다. (낙찰률을 곱하지 않습니다)' }
  }
  const q = q1
  if (owner) return { qty: q, unit: mid, amt: 버림(q * mid), owner: true,
    why: '발주기관이 요구한 신규비목(계약상대자에게 책임 없는 사유 포함) → 협의 대상입니다. 협의 불성립 기준(중간값)으로 계산했습니다.' }
  const u = 버림(un * rate)
  return { qty: q, unit: u, amt: 버림(q * u),
    why: '신규비목은 «설계변경 당시 단가 × 낙찰률»입니다.' }
}

