/**
 * 📄 도면 PDF 만들기 — «도곽(박스)마다 한 장» 찾기 시험 (G118 · 2026-10-02)
 *   node tools/시험_도곽찾기.mjs
 * 소장님: 「캐드내에서 박스로 여러 도면이 있는데, 박스별로 한장씩 pdf로 나와야 하는데, 한꺼번에 나온다고」
 * 시험 도면은 tools/도곽_시험도면.py 가 그때그때 만듭니다(ezdxf). 웹 예시(ex-drawing-pdf.dxf)도 같이 봅니다.
 * 고치기 전: c·d·e·f·h 다섯 가지가 «0장 또는 1장(통째)» 이었습니다.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import { parsePlot } from '../web/src/lib/dxfplot.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 폴더 = fs.mkdtempSync(path.join(os.tmpdir(), '도곽-'))
const py = process.platform === 'win32' ? 'python' : 'python3'
execFileSync(py, [path.join(여기, '도곽_시험도면.py'), 폴더], { stdio: 'ignore' })

const 답 = {
  a_폴리선도곽3: 3, b_블록도곽3: 3, c_바깥큰네모: 3, d_비율다른박스: 3, e_선도곽_선많음: 3, f_꼭짓점더있는폴리선: 3,
  g_두줄4장: 4, h_끊긴선도곽: 3, i_A1과A3섞임: 3, j_1대1_10장: 10, k_굵은폴리선도곽3: 3,
  n1_한장_안쪽테두리_방: 1, n2_도곽없는평면: 0, n3_한장안상세박스둘: 1, n6_블록도곽_선둘레: 3, n8_큰방둘: 0, p_큰도면6장: 6,
}
const 뜻 = {
  c_바깥큰네모: '모든 도곽을 둘러싼 큰 네모가 있어도 안쪽 도곽마다',
  d_비율다른박스: '종이 비율이 아닌 박스(1:1.6 · 1:1.25)도 서로 떨어져 있으면 박스마다',
  e_선도곽_선많음: '선 4개 도곽 + 긴 선 많음(전엔 2,000개 넘으면 안 봄)',
  f_꼭짓점더있는폴리선: '꼭짓점이 4개보다 많은 폴리선 도곽',
  h_끊긴선도곽: '중간에 끊긴 도곽 선',
  k_굵은폴리선도곽3: '굵은(폭 있는) 폴리선 도곽',
  n1_한장_안쪽테두리_방: '한 장(안쪽 테두리 · 표 · 방 네모)은 한 장 그대로',
  n2_도곽없는평면: '도곽 없는 평면(방 네모들)은 나누지 않음',
  n3_한장안상세박스둘: '한 장 안의 상세 박스 둘은 나누지 않음(바깥 도곽 한 장)',
  n6_블록도곽_선둘레: '블록 도곽 + 선으로 그린 둘레',
  n8_큰방둘: '벽을 나눈 큰 방 둘은 나누지 않음',
  p_큰도면6장: '큰 도면(선 9천 개) 6장 — 2초 안',
}
let bad = 0
for (const [이름, n] of Object.entries(답)) {
  const t0 = Date.now()
  const r = parsePlot(fs.readFileSync(path.join(폴더, 이름 + '.dxf'), 'utf8'))
  const ms = Date.now() - t0
  const 맞음 = r.frames.length === n && ms < 2000
  if (!맞음) bad++
  console.log((맞음 ? '  ✓ ' : '  ✗ ') + 이름 + ' — ' + (뜻[이름] || '도곽마다 한 장') + ` · ${r.frames.length}장 (답 ${n}) · ${ms}ms`)
}
{
  const r = parsePlot(fs.readFileSync(path.join(여기, '..', 'web', 'public', 'tools', 'files', 'ex-drawing-pdf.dxf'), 'utf8'))
  const 맞음 = r.frames.length === 2
  if (!맞음) bad++
  console.log((맞음 ? '  ✓ ' : '  ✗ ') + `웹 예시(ex-drawing-pdf.dxf) — A3 도곽 2장 · ${r.frames.length}장`)
}
fs.rmSync(폴더, { recursive: true, force: true })
console.log(bad ? '✗ ' + bad + '개 틀림' : '✓ 모두 맞음')
process.exit(bad ? 1 : 0)
