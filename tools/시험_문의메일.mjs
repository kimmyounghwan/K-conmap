// 📬 G678 문의 메일 머리 시험 (2026-11-14 소장님 「문의함 보내면 이것도 메일로 오게」 — 문의 알림이 맵톡 새 글 알림과 같은 머리 «[K-건설맵]» 라 함께 휴지통으로 가 안 보였음)
//   문의(quoteMail 함수 · tools/quote_mail.py 깃허브 그물) = «[건설맵 중요] 새 문의 — 갈래 · …» / 맵톡 새 글(qnaMail) = «[K-건설맵] 맵톡 새 글 — …» 그대로 — 둘이 다시 섞이면 잡음
//   돌리기: node tools/시험_문의메일.mjs (인터넷 없이 · PC 올리기에도)
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 읽기 = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
let ok = 0, bad = 0
const 봐 = (c, m) => { if (c) ok++; else { bad++; console.log('✗', m) } }

const 함수 = 읽기('web/functions/index.js')
const 몸 = (이름) => { const i = 함수.indexOf(`exports.${이름} =`); const j = 함수.indexOf('\nexports.', i + 5); return i < 0 ? '' : 함수.slice(i, j < 0 ? undefined : j) }
const 문의 = 몸('quoteMail'), 맵톡 = 몸('qnaMail')
봐(!!문의 && !!맵톡, 'quoteMail · qnaMail 함수가 있음')
봐(/보내기\('\[건설맵 중요\] 새 문의 — ' \+ 갈래/.test(문의), '문의 메일 제목 = «[건설맵 중요] 새 문의 — 갈래 · …»')
봐(/const 갈래 = String\(q\.want/.test(문의), '갈래 = 문의의 want(광고 · 제휴 · 공사 연결 · 서류 작성대행 · 사이트 문의)')
봐(!/\[K-건설맵\]/.test(문의.replace(/\/\*[\s\S]*?\*\//g, '')), '문의 메일에 «[K-건설맵]» 머리 없음(맵톡 알림과 섞이지 않게)')
봐(/\[K-건설맵\] 맵톡 새 글/.test(맵톡) && !/건설맵 중요/.test(맵톡.replace(/\/\*[\s\S]*?\*\//g, '')), '맵톡 새 글 메일은 «[K-건설맵] 맵톡 새 글» 그대로')
const 그물 = 읽기('tools/quote_mail.py')
봐(/subject = "\[건설맵 중요\] 새 문의 %d건/.test(그물), '깃허브 그물(quote_mail.py) 제목도 «[건설맵 중요] 새 문의 N건»')
봐(!/subject = "\[K-건설맵\]/.test(그물), 'quote_mail.py 에 옛 «[K-건설맵]» 제목 없음')

console.log(`\n시험_문의메일 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
