// 🚫 G632 낱자 글 막기 시험 — node tools/시험_낱자글.mjs
//   소장님(11-10): 「자음만 쓴 글 삭제해줘. 그리고, 이렇게 쓰는 글은 맵톡에 올라오지 못하게 막아줘」
//   ① 낱자만() 표 — 막힘: 지운 넷 그대로(«[후기·건의] ㅇㅇ» · «… ㅌㅋㅌㅋㅌ» · «… ㄱㄱ») · 모음 · 문장부호 · 기호 · 그림 글자 섞임 · 말머리 둘 · 낱 첫소리 글자(U+1100)
//                    올라감: 진짜 글자(가 ~ 힣 · 영문 · 숫자 · 한자)가 하나라도 · 빈 글 · 기호만(여기서 안 막음)
//   ② 서버 규칙(web/database.rules.json) — qna t · qna_a b 가 정한 식 그대로 · «규칙이 막는 글은 화면도 반드시 막는다»(무작위 6만 개 ·
//      한 줄 남기기 창의 말머리 · 76자 자름 · 맵톡 글쓰기 70자 제목 · 운영자 말머리) · 진짜 제목 견본은 규칙도 안 막음
//   ③ 막는 자리 여섯(맵톡 글쓰기 · 글 고치기 · 답글 · 답글 고치기 · 한 줄 남기기 창 · 도구 이야기)이 «쓰기 앞» 에 걸려 있는지
//      · 🤫 G633 막을 때 아무 글도 안 띄움(소장님 「알림은 제거해」 · 「제거....») — 안내 말이 없고 떠 있던 말도 지움
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 낱자모듈 = await import(pathToFileURL(path.join(ROOT, 'web/src/lib/낱자글.js')).href)
const { 낱자만 } = 낱자모듈
const { 갈래붙이기 } = await import(pathToFileURL(path.join(ROOT, 'web/src/lib/말머리.js')).href)
const { 제목내용 } = await import(pathToFileURL(path.join(ROOT, 'web/src/lib/맵톡.js')).href)
const 읽기 = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n')
let n = 0, bad = 0
const ok = (이름, 참, 값) => { n++; if (!참) bad++; console.log((참 ? '  ✓ ' : '  ✗ ') + 이름 + (참 || 값 === undefined ? '' : ' = ' + JSON.stringify(값).slice(0, 400))) }

console.log('① 낱자만() 표')
const 막힘 = ['[후기·건의] ㅇㅇ', '[후기·건의] ㅌㅋㅌㅋㅌ', '[후기·건의] ㄱㄱ', 'ㄱㄱ', 'ㅇㅇ', 'ㅌㅋㅌㅋㅌ', 'ㅋㅋㅋㅋ', 'ㅎㅎ', 'ㅠㅠ', 'ㅜㅜ', 'ㅡㅡ', 'ㅏ',
  'ㅋㅋ!!', 'ㅇㅇ…', 'ㅋㅋ ㅋㅋ', ' ㄱ ㄱ ', 'ㅋㅋ^^', 'ㄳ~', 'ㅎ👍', '👍ㅋㅋ👍', 'ㅇㅋ?', '[K-건설맵] ㅋㅋ', '[후기·건의] [공지] ㅋㅋ', '[아무 말머리] ㅎㅎ',
  'ㅋㅋ\nㅋㅋ', '\u1100\u1100', 'ㄱ\u3000ㄴ', 'ㆍㆍ', 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ', 'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ']
const 올라감 = ['[후기·건의] Good!', '[후기·건의] 감사합니다', '써보고 말해드리겠습다', 'Good!', '감사합니다', 'ㅋㅋ 좋아요', 'ㅇㅋ 3시', 'ok', '3시', '가ㄱ', 'ㅎㅎ 고맙습니다',
  '工事', '[후기·건의] 잘 쓰겠습니다.', '[K-건설맵] 📢 공지 · 새로 넣은 것', '', '   ', '!!', '👍👍', '...', '\u1100\u1161', 'ㅋㅋ3', 'ㄱㄱ a', '[후기·건의] ', '[후기·건의] [ㅎㅎ]']
const 틀린막힘 = 막힘.filter((s) => !낱자만(s))
const 틀린올라감 = 올라감.filter((s) => 낱자만(s))
ok(`막혀야 할 ${막힘.length}개 모두 막힘(지운 넷 · 모음 · 문장부호 · 기호 · 그림 글자 · 말머리 · 줄바꿈 · 낱 첫소리 · 넓은 띄어쓰기)`, 틀린막힘.length === 0, 틀린막힘)
ok(`올라가야 할 ${올라감.length}개 모두 올라감(진짜 글자 하나라도 · 빈 글 · 기호만 · 첫소리+가운뎃소리 = «가»)`, 틀린올라감.length === 0, 틀린올라감)
ok('null · undefined · 숫자도 오류 없이 «안 막음»', 낱자만(null) === false && 낱자만(undefined) === false && 낱자만(7) === false)

console.log('② 서버 규칙 = 화면보다 좁게(규칙이 막으면 화면도 막음)')
const 규칙글 = 읽기('web/database.rules.json')
const 규칙 = JSON.parse(규칙글.replace(/^\s*\/\/.*$/gm, '')).rules
const tV = 규칙.qna.$id.t['.validate'], bV = 규칙.qna_a.$qid.$aid.b['.validate']
const 식 = '/^\\s*[ㄱ-ㆎ][\\sㄱ-ㆎ]*$/'
ok('qna t — 2 ~ 80자 그대로 + 말머리 둘 떼고 낱자만이면 거절(정한 식 그대로)', tV === `newData.isString() && newData.val().length >= 2 && newData.val().length <= 80 && !newData.val().replace('[후기·건의] ', '').replace('[K-건설맵] ', '').matches(${식})`, tV)
ok('qna_a b — 2 ~ 2000자 그대로 + 낱자만이면 거절(같은 식)', bV === `newData.isString() && newData.val().length >= 2 && newData.val().length <= 2000 && !newData.val().matches(${식})`, bV)
ok('qna b(글 본문)는 그대로(본문은 막지 않음)', 규칙.qna.$id.b['.validate'] === 'newData.isString() && newData.val().length <= 2000')
const 규칙식 = new RegExp(식.slice(1, -1))
/* 규칙 replace = «모두» 바꿈 · JS \s 는 규칙(\s)보다 넓으므로 «규칙이 막는 것» 을 넉넉히 셈(이것이 화면에서 막히면 실제 규칙이 막는 것도 막힘) */
const 서버t = (t) => String(t).length >= 2 && String(t).length <= 80 && 규칙식.test(String(t).split('[후기·건의] ').join('').split('[K-건설맵] ').join(''))
const 서버b = (b) => String(b).length >= 2 && 규칙식.test(String(b))
ok('지운 넷은 규칙도 막음', ['[후기·건의] ㅇㅇ', '[후기·건의] ㅌㅋㅌㅋㅌ', '[후기·건의] ㄱㄱ'].every(서버t))
const 진짜제목 = ['[후기·건의] Good!', '[후기·건의] 감사합니다', '[후기·건의] 써보고 말해드리겠습다', '[후기·건의] ㅋㅋ 좋아요', '[K-건설맵] 📢 공지 · 맵톡 안내', '[후기·건의] 일위대가 · ㅋㅋ', '[후기·건의] ㅇㅋ 3시']
ok(`진짜 제목 견본 ${진짜제목.length}개는 규칙이 안 막음`, 진짜제목.every((t) => !서버t(t)), 진짜제목.filter(서버t))
let 씨 = 632
const 난수 = () => { 씨 = (씨 * 1103515245 + 12345) % 2147483648; return 씨 / 2147483648 }
const 조각 = ['ㄱ', 'ㅋ', 'ㅇ', 'ㅌ', 'ㅏ', 'ㅠ', 'ㆍ', 'ㆎ', ' ', ' ', '\n', '\t', '\u3000', '가', '좋', 'a', 'Z', '3', '.', '!', '?', '~', '…', '^', '·', '👍', '\u1100', '\u1161', '[', ']',
  '[후기·건의] ', '[K-건설맵] ', '[공지] ', 'ㄱ', 'ㅋ', 'ㅎ']
const 낱조각 = ['ㄱ', 'ㅋ', 'ㅇ', 'ㅎ', 'ㅠ', ' ', '\n', '[후기·건의] ', '[K-건설맵] ']
let 셈 = 0, 서버막음 = 0, 어긋남 = []
for (let i = 0; i < 60000; i++) {
  const 모음 = i % 3 === 0 ? 낱조각 : 조각
  const 길이 = 1 + Math.floor(난수() * 12)
  let s = ''
  for (let j = 0; j < 길이; j++) s += 모음[Math.floor(난수() * 모음.length)]
  셈++
  // 가) 맵톡 글쓰기: 제목 = 제목내용(제목, '').t → 말머리를 붙여 씀 · 화면은 t 로 봄
  const { t } = 제목내용(s, '')
  for (const c of ['후기·건의', 'K-건설맵']) {
    const 씀 = 갈래붙이기(c, t)
    if (t.length >= 2 && 서버t(씀)) { 서버막음++; if (!낱자만(t)) 어긋남.push(['글쓰기', s]) }
  }
  // 나) 한 줄 남기기 창: 첫 줄 t → [후기·건의] 붙이고 76자 자름 · 화면은 t 와 실제 제목 둘 다 봄
  const 씀2 = 갈래붙이기('후기·건의', s.trim())
  if (s.trim().length >= 2 && 서버t(씀2) && !(낱자만(s.trim()) || 낱자만(씀2))) 어긋남.push(['한 줄 창', s])
  // 다) 답글: 그대로 b
  if (s.trim().length >= 2 && 서버b(s.trim())) { 서버막음++; if (!낱자만(s.trim())) 어긋남.push(['답글', s]) }
}
ok(`무작위 ${셈.toLocaleString()}개 — 규칙이 막은 ${서버막음.toLocaleString()}개를 화면도 모두 막음(어긋남 0)`, 어긋남.length === 0 && 서버막음 > 3000, { 서버막음, 어긋남: 어긋남.slice(0, 5) })
const 긴줄 = 'ㅋ'.repeat(75) + ' 좋아요'
ok('한 줄 남기기 창 — 76자에서 잘려 낱자만 남는 긴 첫 줄도 화면이 막음(규칙과 같게)', 서버t(갈래붙이기('후기·건의', 긴줄)) && (낱자만(긴줄) || 낱자만(갈래붙이기('후기·건의', 긴줄))))
const 정한식주석 = 읽기('web/src/lib/낱자글.js').includes("/^[\\sㄱ-ㆎ.,!?~…]*[ㄱ-ㆎ][\\sㄱ-ㆎ.,!?~…]*$/")
ok('lib/낱자글.js 머리글이 규칙 식과 같은 말(옛 식이 남지 않게)', !정한식주석 && 읽기('web/src/lib/낱자글.js').includes('/^\\s*[ㄱ-ㆎ][\\sㄱ-ㆎ]*$/'))

console.log('③ 막는 자리 여섯 · 아무 말 없이(G633)')
const 앞에 = (글, 가, 나) => { const i = 글.indexOf(가), j = 글.indexOf(나, Math.max(0, i)); return i >= 0 && j > i }
const 묻 = 읽기('web/src/AskComment.jsx'), 도 = 읽기('web/src/도구이야기.jsx'), 큐 = 읽기('web/src/pages/Qna.jsx')
ok('한 줄 남기기 창 — 첫 줄 · 실제 제목(말머리 · 자름) 둘 다 보고 쓰기 앞에서 멈춤', 앞에(묻, "if (낱자만(t) || 낱자만(갈래붙이기('후기·건의', t))) { set탈(''); return }", "push(ref(db, 'qna'))"))
ok('도구 이야기 — 첫 줄을 도구 이름 붙이기 전에 봄', 앞에(도, "if (낱자만(t)) { set탈(''); return }", '늦으면(올리기안(t, b), 20000)'))
ok('맵톡 글쓰기 — 제목(비우면 첫 줄)', 앞에(큐.slice(큐.indexOf('const submit = async () => {\n    if (busy) return')), "if (낱자만(t)) return setMsg('')", "const slot = push(ref(db, 'qna'))"))
ok('✏️ 글 고치기 — 제목', 앞에(큐.slice(큐.indexOf('const 고쳐올리기 = async')), "if (낱자만(t)) return setMsg('')", 'await update(ref(db, `qna/${row.id}`), 고칠)'))
ok('답글 — 글이 있을 때(파일만 올리는 답글은 그대로)', 앞에(큐, "if (b.trim() && 낱자만(b)) return setMsg('')", 'const slot = push(ref(db, `qna_a/${qid}`))'))
ok('답글 고치기', 앞에(큐.slice(큐.indexOf('const 답고치기 = async')), "if (낱자만(t)) { setMsg(''); return }", 'await set(ref(db, `qna_a/${row.id}/${a.id}/b`), t.slice(0, 2000))'))
ok('맵톡에 글을 쓰는 곳은 이 넷뿐(새로 생기면 여기에 더할 것) — push(ref(db, \'qna\')) 셋 · qna 고치기 하나',
  (묻.match(/push\(ref\(db, 'qna'\)\)/g) || []).length === 1 && (도.match(/push\(ref\(db, 'qna'\)\)/g) || []).length === 1 && (큐.match(/push\(ref\(db, 'qna'\)\)/g) || []).length === 1)
const 낱자원본 = 읽기('web/src/lib/낱자글.js')
ok('🤫 안내 말 없음 — lib 이 낱자말을 안 내보내고 · 여섯 곳 어디서도 안 씀(«자음 · 모음만으로는» 글이 화면 코드에 없음)',
  !('낱자말' in 낱자모듈) && !/export const 낱자말/.test(낱자원본) && ![묻, 도, 큐].some((x) => /낱자말[.}\s,]/.test(x) || x.includes('자음 · 모음만으로는')))
ok('🤫 막을 때 떠 있던 말도 지움 — 여섯 곳 모두 빈 말(set탈(\'\') · setMsg(\'\'))로 끝냄',
  (묻.match(/낱자만\([^\n]*\{ set탈\(''\); return \}/g) || []).length === 1 && (도.match(/낱자만\(t\)\) \{ set탈\(''\); return \}/g) || []).length === 1
  && (큐.match(/낱자만\([^\n]*setMsg\(''\)/g) || []).length === 4)

console.log(`\n${bad ? '❌' : '✅'} 시험_낱자글 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
