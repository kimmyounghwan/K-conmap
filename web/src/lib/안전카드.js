/**
 * 🌏 현장 다국어 안전카드 — 문장 사전 · 머리말 · 셈 (2026-10-22)
 *
 * 소장님: 「현장 다국어 안전카드 — 외국인 건설근로자가 약 23만 명, 현장 7명 중 1명입니다. TBM, 안전수칙, 작업 지시를
 *          중국어·베트남어·우즈벡어로 바로 바꿔 인쇄하게 해 줍니다. … 이거 도구로 만들자.」 「도구화 해서. 캡쳐 보여주고. 나에게 승인 받고 올려」
 *
 * ■ 근거(원문 확인 2026-10-22)
 *   · 산업안전보건법(시행 2026. 6. 1.) 제37조① 후단 — 외국인근로자(같은 조 단서에 따른 사람 포함)를 사용하는 사업주는
 *     안전보건표지를 해당 외국인근로자의 «모국어로 작성» 하여야 한다(국가법령정보센터).
 *   · 같은 법 제31조의2(외국인근로자 기초안전보건교육) — 2026. 7. 7. 신설 · 2027. 1. 8. 시행(국가법령정보센터).
 *   · 같은 법 제52조(근로자의 작업중지) ① 급박한 위험이 있으면 작업을 중지하고 대피할 수 있다 · ④ 그 근로자에게 불리한 처우 금지.
 *   · 외국인 건설근로자: 2024년 22만 5천여 명 · 전체 건설근로자의 약 14.7%(7명 중 1명) · 체류자격 · 국적 확인된 근로자 중
 *     한국계 중국인 83.7% — 고용노동부 · 건설근로자공제회 «건설현장 리포트»(뉴스서울 보도).
 *     → 중국어(간체)를 맨 앞에. 우즈베키스탄 · 카자흐스탄 고려인 동포는 러시아어를 더 잘 읽는 분이 많아 러시아어도 넣음.
 *
 * ■ 번역 원칙: 기계 번역(API)을 쓰지 않습니다 — 비용 0 · 안전 문장이 틀리면 사람이 다치므로 «미리 번역해 두고 되번역으로 확인한 문장만».
 *   · 한 문장 = 한국어 + 중국어(간체) · 베트남어 · 우즈벡어(라틴 — 1993년부터 공식) · 러시아어 · 영어.
 *   · 확인: tools/시험_안전카드.mjs (빠진 말 · 숫자 · 자리표 · 글자 꼴) + 되번역 기록(docs/안전카드_되번역_2026-10-22.md — Bing 번역으로 말마다 되돌려 봄 · 고친 곳 표).
 *   · 직접 쓴 말은 번역하지 않습니다(화면에 늘 적음) — 통역하는 분이 외국어 칸에 직접 적을 수 있게 칸을 둠.
 * ■ 꼴(표지 색 · KS 안전보건표지 꼴을 본뜬 «모양» 만): no 금지(빨강 원) · warn 주의(노랑 세모) · do 지시(파랑 원) · info 안내(초록 네모).
 */

export const 말들 = ['zh', 'vi', 'uz', 'ru', 'en']
export const 말이름 = {
  ko: { 한: '한국어', 제: '한국어', lang: 'ko' },
  zh: { 한: '중국어', 제: '中文(简体)', lang: 'zh-Hans' },
  vi: { 한: '베트남어', 제: 'Tiếng Việt', lang: 'vi' },
  uz: { 한: '우즈벡어', 제: 'Oʻzbekcha', lang: 'uz-Latn' },
  ru: { 한: '러시아어', 제: 'Русский', lang: 'ru' },
  en: { 한: '영어', 제: 'English', lang: 'en' },
}

export const 분류들 = [
  ['tbm', '🗣', '회의 진행'], ['health', '🩺', '건강 확인'], ['ppe', '⛑️', '보호구'], ['fall', '🪜', '추락'],
  ['drop', '⬇️', '떨어지는 물건'], ['equip', '🚜', '장비 · 차량'], ['crane', '🏗️', '크레인 · 양중'], ['collapse', '🧱', '무너짐'],
  ['elec', '⚡', '전기'], ['fire', '🔥', '불 · 용접'], ['confined', '🕳️', '밀폐공간 · 질식'], ['heat', '☀️', '더위'],
  ['cold', '❄️', '추위'], ['tidy', '🧹', '정리 · 통로'], ['emerg', '🆘', '비상시'], ['order', '📋', '작업 지시'],
]

/* 한 줄: [id, 분류, 그림, 꼴, ko, zh, vi, uz, ru, en] */
const 줄들 = [
  /* 🗣 회의 진행 */
  ['t1', 'tbm', '🗣', 'info', '지금부터 작업 전 안전점검회의(TBM)를 시작합니다.', '现在开始班前安全会议（TBM）。', 'Bây giờ chúng ta bắt đầu cuộc họp an toàn trước khi làm việc (TBM).', 'Hozir ish oldidan xavfsizlik yigʻilishini (TBM) boshlaymiz.', 'Начинаем совещание по безопасности перед началом работ (TBM).', 'We will now start the pre-work safety meeting (TBM).'],
  ['t2', 'tbm', '👀', 'info', '오늘 할 작업과 위험한 곳을 같이 확인합시다.', '我们一起确认今天的工作和危险的地方。', 'Chúng ta cùng kiểm tra công việc hôm nay và những chỗ nguy hiểm.', 'Bugungi ishni va xavfli joylarni birga tekshiraylik.', 'Давайте вместе проверим сегодняшнюю работу и опасные места.', "Let's check today's work and the dangerous spots together."],
  ['t3', 'tbm', '❓', 'info', '모르는 것이 있으면 꼭 물어보세요.', '有不明白的地方，一定要问。', 'Nếu có điều gì chưa hiểu, nhất định phải hỏi.', 'Tushunmagan narsangiz boʻlsa, albatta soʻrang.', 'Если что-то непонятно, обязательно спросите.', "If you don't understand something, be sure to ask."],
  ['t4', 'tbm', '✋', 'do', '위험하면 작업을 멈추고 바로 관리자에게 알리세요.', '如果有危险，请停止作业并马上报告管理人员。', 'Nếu thấy nguy hiểm, hãy dừng công việc và báo ngay cho quản lý.', 'Xavf boʻlsa, ishni toʻxtating va darhol rahbarga xabar bering.', 'При опасности прекратите работу и сразу сообщите руководителю.', 'If it is dangerous, stop work and tell the supervisor right away.'],
  ['t5', 'tbm', '🏃', 'info', '급박한 위험이 있으면 작업을 멈추고 대피할 수 있습니다.', '有紧急危险时，可以停止作业并撤离。', 'Khi có nguy hiểm khẩn cấp, bạn có thể dừng công việc và sơ tán.', 'Jiddiy xavf boʻlsa, ishni toʻxtatib, xavfsiz joyga chiqib ketishingiz mumkin.', 'При непосредственной опасности вы можете прекратить работу и уйти в безопасное место.', 'If there is imminent danger, you may stop work and evacuate.'],
  ['t6', 'tbm', '🤝', 'info', '위험해서 작업을 멈춘 사람에게 불이익을 주지 않습니다.', '因危险而停止作业的人不会受到不利待遇。', 'Người dừng việc vì nguy hiểm sẽ không bị đối xử bất lợi.', 'Xavf tufayli ishni toʻxtatgan kishiga nisbatan hech qanday jazo choralari qoʻllanmaydi.', 'Тот, кто остановил работу из-за опасности, не будет наказан.', 'No one will be penalized for stopping work because of danger.'],
  ['t7', 'tbm', '🔁', 'info', '작업 내용이 바뀌면 다시 모여서 확인합니다.', '作业内容有变化时，重新集合确认。', 'Nếu công việc thay đổi, chúng ta sẽ tập trung lại để kiểm tra.', 'Ish oʻzgarsa, yana yigʻilib tekshiramiz.', 'Если работа изменится, мы снова соберёмся и всё проверим.', 'If the work changes, we will gather again and check.'],
  ['t8', 'tbm', '👍', 'info', '오늘도 다치지 않고 안전하게 일합시다.', '今天也要安全作业，不要受伤。', 'Hôm nay chúng ta cũng làm việc an toàn, không để ai bị thương.', 'Bugun ham jarohatsiz, xavfsiz ishlaylik.', 'Давайте и сегодня работать безопасно, без травм.', "Let's work safely today, with no injuries."],

  /* 🩺 건강 확인 */
  ['h1', 'health', '🙂', 'info', '오늘 몸 상태는 괜찮습니까?', '今天身体状况还好吗？', 'Hôm nay sức khỏe của bạn có ổn không?', 'Bugun oʻzingizni yaxshi his qilyapsizmi?', 'Как вы себя сегодня чувствуете? Всё в порядке?', 'Are you feeling well today?'],
  ['h2', 'health', '🤒', 'do', '아프거나 어지러우면 바로 말하세요.', '如果身体不舒服或头晕，请马上说。', 'Nếu bị đau hoặc chóng mặt, hãy nói ngay.', 'Biror joyingiz ogʻrisa yoki boshingiz aylansa, darhol ayting.', 'Если вам плохо или кружится голова, сразу скажите.', 'If you feel sick or dizzy, say so right away.'],
  ['h3', 'health', '🍺', 'no', '술을 마신 사람은 작업할 수 없습니다.', '喝过酒的人不能上岗作业。', 'Người đã uống rượu bia không được làm việc.', 'Spirtli ichimlik ichgan kishi ishlay olmaydi.', 'Тот, кто употреблял алкоголь, к работе не допускается.', 'Anyone who has been drinking alcohol cannot work.'],
  ['h4', 'health', '😴', 'warn', '졸리면 높은 곳 작업이나 장비 운전을 하지 마세요.', '犯困时不要进行高处作业或操作设备。', 'Nếu buồn ngủ, đừng làm việc trên cao hoặc vận hành máy móc.', 'Uyqingiz kelsa, balandlikda ishlamang va texnikani boshqarmang.', 'Если хочется спать, не работайте на высоте и не управляйте техникой.', 'If you are sleepy, do not work at height or operate equipment.'],
  ['h5', 'health', '💊', 'info', '먹은 약 때문에 졸리면 관리자에게 말하세요.', '如果吃药后犯困，请告诉管理人员。', 'Nếu uống thuốc mà thấy buồn ngủ, hãy báo cho quản lý.', 'Ichgan doringiz tufayli uyqingiz kelsa, rahbarga ayting.', 'Если после лекарства клонит в сон, скажите руководителю.', 'If medicine makes you sleepy, tell the supervisor.'],

  /* ⛑️ 보호구 */
  ['p1', 'ppe', '⛑️', 'do', '안전모를 쓰고 턱끈을 꼭 매세요.', '戴好安全帽，一定要系紧下颏带。', 'Đội mũ bảo hộ và nhất định phải cài quai mũ.', 'Himoya kaskasini kiying va iyak tasmasini albatta mahkamlang.', 'Наденьте каску и обязательно застегните подбородочный ремешок.', 'Wear a hard hat and always fasten the chin strap.'],
  ['p2', 'ppe', '🦺', 'do', '높은 곳에서는 안전대(안전벨트)를 걸고 일하세요.', '在高处作业时，要挂好安全带。', 'Khi làm việc trên cao, hãy móc dây an toàn.', 'Balandlikda xavfsizlik kamarini ilib ishlang.', 'На высоте работайте, пристегнув страховочный пояс.', 'When working at height, hook on your safety harness.'],
  ['p3', 'ppe', '👢', 'do', '안전화를 신으세요.', '请穿安全鞋。', 'Hãy mang giày bảo hộ.', 'Himoya poyabzalini kiying.', 'Носите защитную обувь.', 'Wear safety shoes.'],
  ['p4', 'ppe', '🧤', 'do', '작업에 맞는 장갑을 끼세요.', '请戴适合作业的手套。', 'Hãy đeo găng tay phù hợp với công việc.', 'Ishga mos qoʻlqop kiying.', 'Надевайте перчатки, подходящие для работы.', 'Wear gloves suitable for the work.'],
  ['p5', 'ppe', '🥽', 'do', '갈기 · 자르기 · 용접할 때는 보안경(보안면)을 쓰세요.', '打磨、切割、焊接时，请戴护目镜（面罩）。', 'Khi mài, cắt, hàn, hãy đeo kính bảo hộ (mặt nạ).', 'Silliqlash, kesish va payvandlashda himoya koʻzoynagi (niqob) taqing.', 'При шлифовке, резке и сварке надевайте защитные очки (щиток).', 'Wear safety glasses (a face shield) when grinding, cutting or welding.'],
  ['p6', 'ppe', '😷', 'do', '먼지가 많은 곳에서는 방진마스크를 쓰세요.', '在粉尘多的地方，请戴防尘口罩。', 'Ở nơi nhiều bụi, hãy đeo khẩu trang chống bụi.', 'Changli joyda changga qarshi niqob taqing.', 'В пыльных местах надевайте респиратор.', 'Wear a dust mask in dusty areas.'],
  ['p7', 'ppe', '🎧', 'do', '시끄러운 곳에서는 귀마개를 하세요.', '在噪音大的地方，请戴耳塞。', 'Ở nơi ồn ào, hãy đeo nút tai chống ồn.', 'Shovqinli joyda quloq tiqinlarini taqing.', 'В шумных местах используйте беруши.', 'Wear earplugs in noisy areas.'],
  ['p8', 'ppe', '🦺', 'do', '장비 · 차량이 다니는 곳에서는 형광 조끼를 입으세요.', '在设备、车辆通行的地方，请穿反光背心。', 'Ở nơi có máy móc, xe cộ qua lại, hãy mặc áo phản quang.', 'Texnika va mashinalar yuradigan joyda yorqin (nur qaytaruvchi) nimcha kiying.', 'Там, где ездит техника, надевайте сигнальный жилет.', 'Wear a high-visibility vest where equipment and vehicles move.'],
  ['p9', 'ppe', '🔄', 'warn', '망가진 보호구는 쓰지 말고 바꿔 달라고 하세요.', '不要使用损坏的劳保用品，请要求更换。', 'Đừng dùng đồ bảo hộ bị hỏng, hãy yêu cầu đổi cái mới.', 'Buzilgan himoya vositasidan foydalanmang, almashtirib berishni soʻrang.', 'Не пользуйтесь повреждёнными средствами защиты — попросите замену.', 'Do not use damaged protective gear; ask for a replacement.'],

  /* 🪜 추락 */
  ['f1', 'fall', '🕳️', 'no', '바닥 구멍(개구부) 덮개를 함부로 치우지 마세요.', '不要随意移开楼板洞口的盖板。', 'Không được tự ý dỡ nắp đậy lỗ sàn.', 'Poldagi teshik qopqogʻini oʻzboshimchalik bilan olib qoʻymang.', 'Не снимайте без разрешения крышки, закрывающие проёмы в полу.', 'Do not remove floor opening covers without permission.'],
  ['f2', 'fall', '🚧', 'no', '안전난간을 떼지 마세요. 꼭 떼야 하면 관리자에게 먼저 말하세요.', '不要拆除安全护栏。必须拆除时，先告诉管理人员。', 'Không được tháo lan can an toàn. Nếu bắt buộc phải tháo, hãy báo quản lý trước.', 'Himoya panjaralarini (perilalarni) olmang. Olish shart boʻlsa, avval rahbarga ayting.', 'Не снимайте защитные ограждения. Если очень нужно — сначала скажите руководителю.', 'Do not remove guardrails. If you must, tell the supervisor first.'],
  ['f3', 'fall', '🪝', 'do', '2m 이상 높은 곳에서는 안전대 고리를 튼튼한 곳에 거세요.', '在2米以上的高处，要把安全带挂钩挂在牢固的地方。', 'Ở độ cao từ 2 m trở lên, hãy móc khóa dây an toàn vào chỗ chắc chắn.', '2 m va undan baland joyda xavfsizlik kamari ilgagini mustahkam joyga iling.', 'На высоте от 2 м цепляйте карабин пояса за надёжную опору.', 'At 2 m or higher, hook your harness to a strong anchor point.'],
  ['f4', 'fall', '🪜', 'warn', '사다리는 다른 사람이 잡아 주고, 맨 위 칸에 서지 마세요.', '使用梯子时要有人扶住，不要站在最上面一级。', 'Khi dùng thang phải có người giữ, không được đứng ở bậc trên cùng.', 'Narvonni boshqa kishi ushlab tursin, eng yuqori pogʻonada turmang.', 'Пусть кто-то держит лестницу; не вставайте на верхнюю ступеньку.', 'Have someone hold the ladder, and do not stand on the top step.'],
  ['f5', 'fall', '🔩', 'do', '비계 발판이 고정되어 있는지 먼저 확인하세요.', '先确认脚手架踏板是否固定好。', 'Trước tiên hãy kiểm tra ván sàn giàn giáo đã được cố định chưa.', 'Avval havoza (lesa) taxtalari mahkamlanganini tekshiring.', 'Сначала проверьте, закреплён ли настил лесов.', 'First check that the scaffold planks are secured.'],
  ['f6', 'fall', '🛞', 'warn', '이동식 비계는 바퀴를 잠그고, 사람이 탄 채로 옮기지 마세요.', '移动式脚手架要锁住轮子，上面有人时不要移动。', 'Giàn giáo di động phải khóa bánh xe, không được di chuyển khi có người ở trên.', 'Koʻchma havoza gʻildiraklarini qulflang, ustida odam boʻlganda surmang.', 'Заблокируйте колёса передвижных лесов; не передвигайте их, когда на них люди.', 'Lock the wheels of mobile scaffolds, and never move one with people on it.'],
  ['f7', 'fall', '🏠', 'no', '지붕의 채광판 · 슬레이트는 밟지 마세요.', '不要踩屋顶的采光板和石棉瓦。', 'Không được giẫm lên tấm lấy sáng hoặc tấm lợp fibro xi măng trên mái.', 'Tomdagi yorugʻlik oʻtkazuvchi plitalarni va shiferni bosmang.', 'Не наступайте на светопрозрачные панели и шифер на кровле.', 'Do not step on skylight panels or slate roofing.'],
  ['f8', 'fall', '↔️', 'no', '높은 곳에서 몸을 밖으로 내밀지 마세요.', '在高处不要把身体探出去。', 'Ở trên cao, không được nhoài người ra ngoài.', 'Balandlikda tanangizni tashqariga chiqarib egilmang.', 'На высоте не высовывайтесь наружу.', 'Do not lean out when working at height.'],
  ['f9', 'fall', '🛗', 'warn', '고소작업대는 정해진 사람만 운전하고, 난간 밖으로 나가지 마세요.', '高空作业平台只能由指定人员操作，不要越出护栏。', 'Xe nâng người chỉ do người được chỉ định vận hành; không được ra ngoài lan can.', 'Koʻtarish platformasini faqat belgilangan kishi boshqarsin; toʻsiqdan tashqariga chiqmang.', 'Подъёмной платформой управляет только назначенный человек; не выходите за ограждение.', 'Only the assigned operator may run an aerial work platform; do not climb outside the guardrail.'],

  /* ⬇️ 떨어지는 물건 */
  ['d1', 'drop', '⬇️', 'no', '위에서 작업하고 있으면 그 아래로 다니지 마세요.', '上面有人作业时，不要从下面经过。', 'Khi phía trên đang làm việc, không được đi lại bên dưới.', 'Yuqorida ish ketayotgan boʻlsa, uning ostidan oʻtmang.', 'Не проходите внизу, когда наверху идут работы.', 'Do not walk underneath while work is going on above.'],
  ['d2', 'drop', '🔨', 'no', '공구 · 자재를 아래로 던지지 마세요.', '不要往下扔工具和材料。', 'Không được ném dụng cụ, vật liệu xuống dưới.', 'Asbob va materiallarni pastga tashlamang.', 'Не бросайте инструменты и материалы вниз.', 'Do not throw tools or materials down from above.'],
  ['d3', 'drop', '🧰', 'do', '높은 곳에서 쓰는 공구는 끈으로 묶거나 공구 주머니에 넣으세요.', '高处使用的工具要用绳子系住或放进工具袋。', 'Dụng cụ dùng trên cao phải buộc dây hoặc để trong túi đựng dụng cụ.', 'Balandlikda ishlatiladigan asboblarni ip bilan bogʻlang yoki asbob xaltasiga soling.', 'Инструмент на высоте привязывайте или держите в сумке для инструмента.', 'Tie off tools used at height or keep them in a tool bag.'],
  ['d4', 'drop', '📦', 'warn', '자재는 높이 쌓지 말고, 가장자리에 두지 마세요.', '材料不要堆得太高，也不要放在边缘。', 'Không chất vật liệu quá cao và không để ở mép.', 'Materiallarni baland qilib taxlamang va chetga qoʻymang.', 'Не складируйте материалы высоко и у края.', 'Do not stack materials high or leave them near edges.'],
  ['d5', 'drop', '⛔', 'no', '출입 금지 표시가 있는 곳에는 들어가지 마세요.', '不要进入有禁止进入标志的地方。', 'Không được vào nơi có biển cấm vào.', '«Kirish taqiqlangan» belgisi bor joyga kirmang.', 'Не заходите туда, где стоит знак «Вход запрещён».', 'Do not enter areas marked "No Entry."'],

  /* 🚜 장비 · 차량 */
  ['e1', 'equip', '🚜', 'no', '장비가 움직이는 범위 안에 들어가지 마세요.', '不要进入设备作业范围内。', 'Không được đi vào phạm vi hoạt động của máy móc.', 'Texnika ishlayotgan hudud ichiga kirmang.', 'Не заходите в рабочую зону техники.', 'Do not enter the working range of equipment.'],
  ['e2', 'equip', '👁️', 'no', '굴착기 뒤나 옆에 서 있지 마세요. 운전자 눈에 안 보입니다.', '不要站在挖掘机后面或旁边，司机看不见你。', 'Không được đứng phía sau hoặc bên cạnh máy xúc. Người lái không nhìn thấy bạn.', 'Ekskavator orqasida yoki yonida turmang. Haydovchi sizni koʻrmaydi.', 'Не стойте сзади или сбоку экскаватора — машинист вас не видит.', 'Do not stand behind or beside an excavator. The operator cannot see you.'],
  ['e3', 'equip', '🚚', 'no', '뒤로 가는 차량 뒤에 서지 마세요.', '不要站在倒车的车辆后面。', 'Không được đứng phía sau xe đang lùi.', 'Orqaga yurayotgan mashina orqasida turmang.', 'Не стойте позади машины, которая сдаёт назад.', 'Do not stand behind a reversing vehicle.'],
  ['e4', 'equip', '🚩', 'do', '신호수의 신호를 따르세요.', '请听从信号员的指挥。', 'Hãy làm theo hiệu lệnh của người báo hiệu.', 'Signalchining ishoralariga amal qiling.', 'Следуйте сигналам сигнальщика.', "Follow the signal person's signals."],
  ['e5', 'equip', '🔒', 'do', '기계를 고치거나 청소할 때는 전원을 끄고 잠그세요.', '维修或清理机器时，要关闭电源并上锁。', 'Khi sửa chữa hoặc vệ sinh máy, hãy tắt nguồn điện và khóa lại.', 'Mashinani taʼmirlash yoki tozalashda elektrni oʻchirib, qulflab qoʻying.', 'При ремонте или чистке оборудования отключите питание и заблокируйте его.', 'Turn off and lock out the power before repairing or cleaning a machine.'],
  ['e6', 'equip', '⚙️', 'no', '돌아가는 기계에 손을 넣지 마세요.', '不要把手伸进运转中的机器。', 'Không được cho tay vào máy đang chạy.', 'Ishlab turgan mashinaga qoʻl tiqmang.', 'Не суйте руки в работающий механизм.', 'Do not put your hands into running machinery.'],
  ['e7', 'equip', '🪪', 'info', '장비 운전은 자격이 있는 사람만 합니다.', '只有有资格的人才能操作设备。', 'Chỉ người có chứng chỉ mới được vận hành máy móc.', 'Texnikani faqat guvohnomasi bor kishi boshqaradi.', 'Управлять техникой может только человек с удостоверением.', 'Only qualified (licensed) people may operate equipment.'],
  ['e8', 'equip', '🚫', 'no', '장비(굴착기 버킷 등)에 사람을 태우지 마세요.', '不要用设备（如挖掘机铲斗）载人。', 'Không được chở người bằng máy móc (ví dụ: gầu máy xúc).', 'Texnikada (masalan, ekskavator chovgʻumida) odam tashimang.', 'Не перевозите людей на технике (например, в ковше экскаватора).', 'Never carry people on equipment (e.g., in an excavator bucket).'],
  ['e9', 'equip', '🪚', 'no', '둥근톱 · 그라인더의 덮개를 떼지 마세요.', '不要拆除圆锯、角磨机的防护罩。', 'Không được tháo nắp che an toàn của máy cưa đĩa, máy mài.', 'Disk arra va silliqlash mashinasining himoya qopqogʻini olmang.', 'Не снимайте защитный кожух с циркулярной пилы и болгарки.', 'Do not remove the guards from circular saws or grinders.'],

  /* 🏗️ 크레인 · 양중 */
  ['c1', 'crane', '🏗️', 'no', '매단 짐 아래에 서거나 지나가지 마세요.', '不要站在或经过吊物下方。', 'Không được đứng hoặc đi qua bên dưới vật đang được cẩu.', 'Osilib turgan yuk ostida turmang va oʻtmang.', 'Не стойте и не проходите под поднятым грузом.', 'Do not stand or walk under a suspended load.'],
  ['c2', 'crane', '⛓️', 'do', '줄걸이(슬링 · 와이어로프) 상태를 확인하고 거세요.', '挂钩前要检查吊带、钢丝绳的状态。', 'Kiểm tra tình trạng dây cáp, dây cẩu trước khi móc hàng.', 'Ilishdan oldin stroplar va troslar holatini tekshiring.', 'Перед строповкой проверьте стропы и тросы.', 'Check slings and wire ropes before rigging.'],
  ['c3', 'crane', '🙋', 'info', '크레인 신호는 한 사람만 합니다.', '起重信号只能由一个人发出。', 'Chỉ một người được ra hiệu lệnh cho cần cẩu.', 'Kranga signalni faqat bir kishi beradi.', 'Сигналы крановщику подаёт только один человек.', 'Only one person gives signals to the crane.'],
  ['c4', 'crane', '🌬️', 'warn', '바람이 세게 불면 크레인 작업을 멈춥니다.', '风大时停止起重作业。', 'Khi gió mạnh, phải dừng công việc cẩu.', 'Kuchli shamolda kran ishi toʻxtatiladi.', 'При сильном ветре крановые работы прекращаются.', 'Crane work stops in strong winds.'],
  ['c5', 'crane', '🧵', 'do', '짐을 손으로 끌어당기지 말고 유도 로프를 쓰세요.', '不要用手拉吊物，请使用牵引绳。', 'Không kéo hàng bằng tay, hãy dùng dây dẫn hướng.', 'Yukni qoʻl bilan tortmang, yoʻnaltiruvchi arqondan foydalaning.', 'Не тяните груз руками — используйте оттяжку.', 'Do not pull loads by hand; use a tag line.'],

  /* 🧱 무너짐 */
  ['k1', 'collapse', '⛰️', 'no', '굴착한 곳 가장자리에 흙 · 자재를 쌓지 마세요.', '不要在基坑边缘堆放土方或材料。', 'Không được chất đất, vật liệu ở mép hố đào.', 'Qazilgan joy chetiga tuproq va material uymang.', 'Не складируйте грунт и материалы у края выемки.', 'Do not pile soil or materials at the edge of an excavation.'],
  ['k2', 'collapse', '⚠️', 'warn', '흙막이나 땅에 금이 가거나 물이 새면 바로 나오고 알리세요.', '如果支护或地面出现裂缝或渗水，请立即撤出并报告。', 'Nếu hệ chống đỡ hố đào hoặc mặt đất bị nứt hay rò nước, hãy ra ngay và báo cáo.', 'Tuproq tutgich devorda yoki yerda yoriq paydo boʻlsa yoki suv sizsa, darhol chiqing va xabar bering.', 'Если на ограждении котлована или грунте трещины или течёт вода — сразу выходите и сообщите.', 'If shoring or the ground cracks or leaks water, get out at once and report it.'],
  ['k3', 'collapse', '🪵', 'no', '거푸집 동바리를 함부로 빼거나 옮기지 마세요.', '不要随意拆除或移动模板支撑。', 'Không được tự ý tháo hoặc di chuyển cây chống cốp pha.', 'Qolip tayanchlarini oʻzboshimchalik bilan olmang va surmang.', 'Не убирайте и не переставляйте стойки опалубки без разрешения.', 'Do not remove or move formwork shores without permission.'],
  ['k4', 'collapse', '🚧', 'no', '콘크리트를 붓는 동안 동바리 아래에 들어가지 마세요.', '浇筑混凝土期间，不要进入模板支撑下方。', 'Trong khi đổ bê tông, không được vào bên dưới hệ cây chống.', 'Beton quyilayotganda tayanchlar ostiga kirmang.', 'Во время бетонирования не заходите под опалубку.', 'Do not go under the shoring while concrete is being poured.'],
  ['k5', 'collapse', '🏚️', 'no', '해체 작업 중인 곳에는 들어가지 마세요.', '不要进入正在拆除作业的区域。', 'Không được vào khu vực đang phá dỡ.', 'Buzish ishlari ketayotgan joyga kirmang.', 'Не заходите в зону демонтажа.', 'Do not enter areas under demolition.'],
  ['k6', 'collapse', '⚖️', 'no', '비계 · 거푸집에 정해진 무게보다 많이 올리지 마세요.', '脚手架、模板上不要超过规定的荷载。', 'Không được chất lên giàn giáo, cốp pha quá tải trọng cho phép.', 'Havoza (lesa) va qolipga belgilangan ogʻirlikdan ortiq yuk qoʻymang.', 'Не перегружайте леса и опалубку сверх допустимой нагрузки.', 'Do not load scaffolds or formwork beyond the allowed weight.'],

  /* ⚡ 전기 */
  ['l1', 'elec', '💧', 'no', '젖은 손으로 전기 기구를 만지지 마세요.', '不要用湿手触摸电器。', 'Không được chạm vào thiết bị điện khi tay ướt.', 'Hoʻl qoʻl bilan elektr asboblarini ushlamang.', 'Не трогайте электроприборы мокрыми руками.', 'Do not touch electrical tools with wet hands.'],
  ['l2', 'elec', '🔌', 'no', '껍질이 벗겨진 전선은 쓰지 말고 알리세요.', '不要使用绝缘皮破损的电线，请报告。', 'Không dùng dây điện bị bong vỏ, hãy báo cáo.', 'Izolyatsiyasi shilingan simdan foydalanmang, xabar bering.', 'Не пользуйтесь проводом с повреждённой изоляцией — сообщите.', 'Do not use wires with damaged insulation; report them.'],
  ['l3', 'elec', '🔋', 'do', '누전차단기가 달린 콘센트만 쓰세요.', '只使用带漏电保护器的插座。', 'Chỉ dùng ổ cắm có cầu dao chống giật.', 'Faqat himoya avtomati (UZO) oʻrnatilgan rozetkadan foydalaning.', 'Пользуйтесь только розетками с УЗО (защитой от утечки тока).', 'Use only outlets protected by an earth-leakage breaker.'],
  ['l4', 'elec', '🗄️', 'no', '분전반은 전기 담당자만 엽니다.', '配电箱只能由电工打开。', 'Chỉ thợ điện phụ trách mới được mở tủ điện.', 'Elektr shitini faqat masʼul elektrchi ochadi.', 'Электрощит открывает только ответственный электрик.', 'Only the assigned electrician may open the distribution panel.'],
  ['l5', 'elec', '⚡', 'warn', '고압선 근처에서는 크레인 · 긴 자재가 전선에 닿지 않게 하세요.', '在高压线附近，不要让吊车或长材料碰到电线。', 'Gần đường dây cao thế, không để cần cẩu hoặc vật liệu dài chạm vào dây điện.', 'Yuqori kuchlanishli liniya yaqinida kran yoki uzun materiallar simlarga tegmasin.', 'Рядом с ЛЭП следите, чтобы кран и длинные материалы не касались проводов.', 'Near high-voltage lines, keep cranes and long materials from touching the wires.'],
  ['l6', 'elec', '🌊', 'warn', '전선이 물에 잠기지 않게 하세요.', '不要让电线泡在水里。', 'Không để dây điện bị ngâm trong nước.', 'Elektr simlari suvga botib qolmasin.', 'Не допускайте, чтобы кабели лежали в воде.', 'Keep cables out of water.'],

  /* 🔥 불 · 용접 */
  ['r1', 'fire', '🔥', 'do', '용접 · 절단 전에 주변의 탈 수 있는 것을 치우세요.', '焊接、切割前，要清除周围的可燃物。', 'Trước khi hàn, cắt, hãy dọn hết vật dễ cháy xung quanh.', 'Payvandlash va kesishdan oldin atrofdagi yonuvchi narsalarni olib tashlang.', 'Перед сваркой и резкой уберите вокруг всё горючее.', 'Remove anything flammable nearby before welding or cutting.'],
  ['r2', 'fire', '🧯', 'do', '불꽃 작업을 할 때는 소화기를 옆에 두세요.', '动火作业时，旁边要放灭火器。', 'Khi làm việc có lửa, hãy để bình chữa cháy bên cạnh.', 'Olov bilan ishlaganda yoningizda oʻt oʻchirgich boʻlsin.', 'При огневых работах держите огнетушитель рядом.', 'Keep a fire extinguisher nearby during hot work.'],
  ['r3', 'fire', '🎇', 'do', '불티가 떨어지지 않게 방화포를 까세요.', '铺设防火毯，防止火花掉落。', 'Trải bạt chống cháy để tia lửa không rơi xuống.', 'Uchqun tushmasligi uchun yongʻinga chidamli mato yoying.', 'Расстелите огнезащитное полотно, чтобы искры не падали вниз.', 'Lay fire blankets so that sparks do not fall.'],
  ['r4', 'fire', '🚭', 'no', '정해진 곳에서만 담배를 피우세요.', '只能在指定地点吸烟。', 'Chỉ được hút thuốc ở nơi quy định.', 'Faqat belgilangan joyda cheking.', 'Курите только в отведённых местах.', 'Smoke only in designated areas.'],
  ['r5', 'fire', '🛢️', 'do', '가스통은 세워서 묶어 두고, 햇볕을 피하세요.', '气瓶要直立固定，避免阳光直射。', 'Bình gas phải để đứng, buộc chặt và tránh ánh nắng.', 'Gaz ballonlarini tik qoʻyib bogʻlang va quyoshdan saqlang.', 'Газовые баллоны ставьте вертикально, закрепляйте и берегите от солнца.', 'Keep gas cylinders upright, tied down and out of direct sunlight.'],
  ['r6', 'fire', '🎨', 'no', '우레탄폼 · 페인트 · 시너 근처에서는 불을 쓰지 마세요.', '在聚氨酯泡沫、油漆、稀释剂附近不要用火。', 'Không dùng lửa gần xốp PU, sơn và dung môi pha sơn.', 'Poliuretan koʻpik, boʻyoq va erituvchi yaqinida olov ishlatmang.', 'Не пользуйтесь огнём рядом с монтажной пеной, краской и растворителем.', 'No open flames near urethane foam, paint or thinner.'],
  ['r7', 'fire', '🔎', 'do', '작업이 끝난 뒤에도 불씨가 남았는지 다시 확인하세요.', '作业结束后，要再次确认有没有残留火种。', 'Sau khi xong việc, hãy kiểm tra lại xem còn tàn lửa không.', 'Ish tugagandan keyin ham choʻgʻ yoki uchqun qolmaganini yana tekshiring.', 'После окончания работы ещё раз проверьте, не осталось ли тлеющих искр.', 'After finishing, check again for any remaining embers.'],

  /* 🕳️ 밀폐공간 · 질식 */
  ['s1', 'confined', '🕳️', 'no', '맨홀 · 탱크 · 피트 안에는 허락 없이 들어가지 마세요.', '未经许可，不得进入人孔、储罐、地坑内。', 'Không được vào hố ga, bồn chứa, hố pit khi chưa được phép.', 'Ruxsatsiz lyuk, rezervuar va chuqurlar ichiga kirmang.', 'Не входите в колодцы, резервуары и приямки без разрешения.', 'Do not enter manholes, tanks or pits without permission.'],
  ['s2', 'confined', '📟', 'do', '들어가기 전에 산소 · 가스를 재고, 환기하면서 일하세요.', '进入前要检测氧气和有害气体，作业时要持续通风。', 'Trước khi vào phải đo oxy và khí độc, vừa làm vừa thông gió.', 'Kirishdan oldin kislorod va gazni oʻlchang, shamollatib turib ishlang.', 'Перед входом измерьте кислород и газы; работайте при вентиляции.', 'Measure oxygen and gas before entering, and keep ventilating while you work.'],
  ['s3', 'confined', '📣', 'warn', '안에서 사람이 쓰러지면 들어가지 말고, 소리쳐 도움을 부르세요.', '如果里面有人倒下，不要进去，要大声呼救。', 'Nếu thấy người ngã gục bên trong, đừng đi vào, hãy hô to gọi người giúp.', 'Ichkarida odam yiqilib qolsa, kirmang — baland ovozda yordam chaqiring.', 'Если внутри человек упал без сознания, не заходите — громко зовите на помощь.', 'If someone collapses inside, do not go in — shout for help.'],
  ['s4', 'confined', '🧍', 'do', '밖에서 지켜보는 사람(감시인)을 꼭 두세요.', '外面一定要有专人监护。', 'Nhất định phải có người giám sát đứng bên ngoài.', 'Tashqarida albatta kuzatuvchi boʻlsin.', 'Снаружи обязательно должен находиться наблюдающий.', 'Always keep a standby person (attendant) outside.'],
  ['s5', 'confined', '♨️', 'no', '갈탄 · 숯을 피운 곳(콘크리트 보온 양생)에는 들어가지 마세요. 일산화탄소에 중독됩니다.', '不要进入烧褐煤、木炭的地方（混凝土保温养护）。会一氧化碳中毒。', 'Không được vào nơi đang đốt than (ủ ấm bảo dưỡng bê tông). Có thể bị ngộ độc khí CO.', 'Koʻmir yoki pista koʻmir yoqilgan joyga (betonni isitib qotirish) kirmang. Is gazidan zaharlanasiz.', 'Не заходите туда, где жгут уголь или древесный уголь (прогрев бетона). Можно отравиться угарным газом.', 'Do not enter areas heated with coal or charcoal (concrete curing). You can get carbon monoxide poisoning.'],

  /* ☀️ 더위 */
  ['w1', 'heat', '💧', 'do', '목이 마르지 않아도 물을 자주 마시세요.', '即使不渴，也要经常喝水。', 'Dù không khát cũng hãy uống nước thường xuyên.', 'Chanqamasangiz ham tez-tez suv iching.', 'Пейте воду часто, даже если не хочется пить.', 'Drink water often, even if you are not thirsty.'],
  ['w2', 'heat', '⛱️', 'do', '더울 때는 그늘에서 꼭 쉬세요.', '天热时一定要在阴凉处休息。', 'Khi trời nóng, nhất định phải nghỉ ngơi trong bóng râm.', 'Issiqda albatta soyada dam oling.', 'В жару обязательно отдыхайте в тени.', 'In hot weather, be sure to rest in the shade.'],
  ['w3', 'heat', '🥵', 'warn', '어지럽거나 속이 메스껍거나 땀이 멈추면 바로 쉬고 알리세요.', '如果头晕、恶心或不再出汗，请立即休息并报告。', 'Nếu chóng mặt, buồn nôn hoặc không ra mồ hôi nữa, hãy nghỉ ngay và báo cáo.', 'Boshingiz aylansa, koʻnglingiz aynisa yoki terlash toʻxtasa, darhol dam oling va xabar bering.', 'Если кружится голова, тошнит или перестали потеть — сразу отдохните и сообщите.', 'If you feel dizzy or sick, or stop sweating, rest at once and report it.'],
  ['w4', 'heat', '👥', 'info', '동료의 얼굴색이나 말투가 이상하면 서로 살펴 주세요.', '如果同事脸色或说话不正常，请互相关照。', 'Nếu đồng nghiệp có sắc mặt hay giọng nói bất thường, hãy để ý giúp nhau.', 'Hamkasbingizning rangi oʻzgarsa yoki gapi gʻalati boʻlsa, bir-biringizni kuzatib turing.', 'Если у коллеги странный цвет лица или речь — присматривайте друг за другом.', "Look out for each other if a coworker's face or speech seems unusual."],

  /* ❄️ 추위 */
  ['x1', 'cold', '🧥', 'do', '따뜻하게 입고, 젖은 옷 · 장갑은 바꾸세요.', '要穿暖和，湿衣服和手套要及时更换。', 'Hãy mặc ấm, thay quần áo và găng tay bị ướt.', 'Issiq kiyining, hoʻl kiyim va qoʻlqoplarni almashtiring.', 'Одевайтесь тепло, меняйте мокрую одежду и перчатки.', 'Dress warmly and change out of wet clothes and gloves.'],
  ['x2', 'cold', '🧊', 'warn', '얼어서 미끄러운 곳을 조심하세요.', '小心结冰打滑的地方。', 'Hãy cẩn thận ở những chỗ đóng băng, trơn trượt.', 'Muz qotgan sirpanchiq joylardan ehtiyot boʻling.', 'Осторожно: обледенелые скользкие места.', 'Watch out for icy, slippery spots.'],
  ['x3', 'cold', '🔥', 'no', '난로 옆에 탈 수 있는 것을 두지 마세요.', '不要在取暖炉旁放可燃物。', 'Không để vật dễ cháy cạnh lò sưởi.', 'Isitgich yonida yonuvchi narsa qoʻymang.', 'Не держите горючее рядом с обогревателем.', 'Keep flammable items away from heaters.'],

  /* 🧹 정리 · 통로 */
  ['n1', 'tidy', '🧹', 'no', '통로에 자재 · 전선을 두지 마세요. 걸려 넘어집니다.', '通道上不要放材料和电线，会绊倒人。', 'Không để vật liệu, dây điện trên lối đi — dễ vấp ngã.', 'Yoʻlakka material va sim qoʻymang — qoqilib yiqilish mumkin.', 'Не оставляйте материалы и кабели в проходах — можно споткнуться.', 'Keep walkways clear of materials and cables — people trip over them.'],
  ['n2', 'tidy', '📍', 'do', '튀어나온 못 · 철근은 구부리거나 덮으세요.', '突出的钉子、钢筋头要弄弯或盖上保护帽。', 'Đinh, đầu sắt thép nhô ra phải bẻ cong hoặc chụp nắp lại.', 'Chiqib turgan mix va armatura uchlarini egib qoʻying yoki qopqoq kiydiring.', 'Торчащие гвозди и арматуру загибайте или закрывайте колпачками.', 'Bend over or cap any protruding nails and rebar.'],
  ['n3', 'tidy', '✨', 'do', '작업이 끝나면 주변을 정리하세요.', '作业结束后，要整理周围。', 'Xong việc, hãy dọn dẹp xung quanh.', 'Ish tugagach, atrofni tartibga keltiring.', 'После работы наведите порядок вокруг.', 'Clean up your area when the work is done.'],
  ['n4', 'tidy', '🏋️', 'warn', '무거운 것은 혼자 들지 말고 둘이 들거나 장비를 쓰세요.', '重物不要一个人搬，要两个人一起搬或使用设备。', 'Vật nặng đừng khiêng một mình, hãy khiêng hai người hoặc dùng thiết bị.', 'Ogʻir narsani yolgʻiz koʻtarmang — ikki kishi koʻtaring yoki moslama ishlating.', 'Тяжёлое не поднимайте в одиночку — вдвоём или с помощью техники.', 'Do not lift heavy items alone — lift with two people or use equipment.'],
  ['n5', 'tidy', '🚶', 'do', '정해진 통로로만 다니세요.', '只走指定的通道。', 'Chỉ đi theo lối đi quy định.', 'Faqat belgilangan yoʻlaklardan yuring.', 'Ходите только по установленным проходам.', 'Use only the designated walkways.'],

  /* 🆘 비상시 */
  ['m1', 'emerg', '🗣', 'info', '사고가 나면 큰 소리로 주변에 알리세요.', '发生事故时，要大声告诉周围的人。', 'Khi xảy ra tai nạn, hãy hô to báo cho mọi người xung quanh.', 'Baxtsiz hodisa yuz bersa, baland ovozda atrofdagilarga xabar bering.', 'При несчастном случае громко сообщите окружающим.', 'If an accident happens, shout to alert the people around you.'],
  ['m2', 'emerg', '📞', 'info', '119(구급 · 소방)에 전화하고, 관리자에게 바로 알리세요.', '拨打119（急救·消防），并马上通知管理人员。', 'Gọi 119 (cấp cứu, cứu hỏa) và báo ngay cho quản lý.', '119 ga (tez yordam, oʻt oʻchirish) qoʻngʻiroq qiling va darhol rahbarga xabar bering.', 'Позвоните 119 (скорая помощь, пожарные) и сразу сообщите руководителю.', 'Call 119 (ambulance/fire) and tell the supervisor right away.'],
  ['m3', 'emerg', '🚑', 'warn', '크게 다친 사람은 함부로 옮기지 마세요.', '不要随意搬动重伤人员。', 'Không được tự ý di chuyển người bị thương nặng.', 'Ogʻir jarohatlangan kishini oʻzboshimchalik bilan koʻchirmang.', 'Не перемещайте тяжело пострадавшего без необходимости.', 'Do not move a seriously injured person unless necessary.'],
  ['m4', 'emerg', '🏃', 'info', '대피 신호가 나면 정해진 대피 장소로 모이세요.', '听到撤离信号时，到指定的避难地点集合。', 'Khi có tín hiệu sơ tán, hãy tập trung tại nơi sơ tán quy định.', 'Evakuatsiya signali berilsa, belgilangan joyga yigʻiling.', 'По сигналу эвакуации собирайтесь в установленном месте.', 'When the evacuation signal sounds, gather at the designated assembly point.'],
  ['m5', 'emerg', '🩹', 'info', '작은 상처라도 숨기지 말고 알리세요.', '即使是小伤也不要隐瞒，要报告。', 'Dù là vết thương nhỏ cũng đừng giấu, hãy báo cáo.', 'Kichik jarohat boʻlsa ham yashirmang, xabar bering.', 'Даже о небольшой травме не молчите — сообщите.', 'Report even minor injuries — do not hide them.'],

  /* 📋 작업 지시 */
  ['o1', 'order', '⛔', 'no', '이 구역은 출입 금지입니다.', '此区域禁止进入。', 'Khu vực này cấm vào.', 'Bu hududga kirish taqiqlanadi.', 'Вход в эту зону запрещён.', 'This area is off limits.'],
  ['o2', 'order', '📝', 'do', '작업 허가를 받은 뒤에 시작하세요.', '获得作业许可后再开始。', 'Chỉ bắt đầu sau khi đã được cấp phép làm việc.', 'Ishga ruxsat olgandan keyin boshlang.', 'Начинайте только после получения допуска к работе.', 'Start only after you have received a work permit.'],
  ['o3', 'order', '🎯', 'do', '정해진 작업만 하세요. 다른 일을 하려면 먼저 물어보세요.', '只做指定的工作。要做其他工作时，请先询问。', 'Chỉ làm công việc được giao. Muốn làm việc khác, hãy hỏi trước.', 'Faqat topshirilgan ishni bajaring. Boshqa ish qilmoqchi boʻlsangiz, avval soʻrang.', 'Выполняйте только порученную работу. Для другой работы сначала спросите.', 'Do only the assigned work. Ask first before doing anything else.'],
  ['o4', 'order', '👥', 'do', '혼자 일하지 말고 2인 1조로 일하세요.', '不要单独作业，要两人一组。', 'Không làm việc một mình, hãy làm theo nhóm hai người.', 'Yolgʻiz ishlamang, ikki kishilik guruhda ishlang.', 'Не работайте в одиночку — только вдвоём.', 'Do not work alone; work in pairs.'],
  ['o5', 'order', '📢', 'do', '작업을 시작하기 전과 끝난 뒤에 관리자에게 알리세요.', '作业开始前和结束后，都要告诉管理人员。', 'Báo cho quản lý trước khi bắt đầu và sau khi kết thúc công việc.', 'Ishni boshlashdan oldin va tugatgandan keyin rahbarga xabar bering.', 'Сообщайте руководителю перед началом и после окончания работы.', 'Tell the supervisor before you start and after you finish.'],
  ['o6', 'order', '📐', 'warn', '도면이나 지시와 다르면 하지 말고 물어보세요.', '如果与图纸或指示不一样，不要做，先询问。', 'Nếu khác với bản vẽ hoặc chỉ thị, đừng làm mà hãy hỏi.', 'Chizma yoki koʻrsatmadan farq qilsa, qilmang — soʻrang.', 'Если что-то не совпадает с чертежом или указанием — не делайте, спросите.', 'If something differs from the drawings or instructions, stop and ask.'],
  ['o7', 'order', '🪑', 'info', '쉬는 시간에는 정해진 휴게 장소에서 쉬세요.', '休息时间请在指定的休息场所休息。', 'Giờ nghỉ, hãy nghỉ tại khu nghỉ ngơi quy định.', 'Tanaffusda belgilangan dam olish joyida dam oling.', 'В перерыв отдыхайте в отведённом месте.', 'During breaks, rest in the designated rest area.'],
  ['o8', 'order', '🔧', 'do', '장비 · 공구는 쓰기 전에 이상이 없는지 확인하세요.', '使用设备、工具前，要确认有无异常。', 'Kiểm tra máy móc, dụng cụ xem có bất thường không trước khi sử dụng.', 'Texnika va asboblarni ishlatishdan oldin nosozlik yoʻqligini tekshiring.', 'Перед работой проверьте исправность техники и инструментов.', 'Check equipment and tools for problems before use.'],
  ['o9', 'order', '🎓', 'info', '안전교육을 받지 않은 사람은 작업할 수 없습니다.', '没有接受安全教育的人不能作业。', 'Người chưa được đào tạo an toàn không được làm việc.', 'Xavfsizlik boʻyicha oʻqitishdan oʻtmagan kishi ishlay olmaydi.', 'Без инструктажа по безопасности к работе не допускаются.', 'Anyone who has not received safety training cannot work.'],
]

export const 문장들 = 줄들.map(([id, c, g, f, ko, zh, vi, uz, ru, en]) => ({ id, c, g, f, ko, zh, vi, uz, ru, en }))
export const 문장 = Object.fromEntries(문장들.map((s) => [s.id, s]))

/* 오늘 할 작업(공종) — [id, 그림, ko, zh, vi, uz, ru, en] */
const 작업줄 = [
  ['a01', '🪵', '거푸집 설치', '支模（模板安装）', 'Lắp dựng cốp pha', 'Qolip (opalubka) oʻrnatish', 'Монтаж опалубки', 'Formwork installation'],
  ['a02', '🪵', '거푸집 해체', '拆模', 'Tháo dỡ cốp pha', 'Qolipni (opalubkani) yechish', 'Демонтаж опалубки', 'Formwork removal'],
  ['a03', '🔗', '철근 배근', '钢筋绑扎', 'Lắp đặt cốt thép', 'Armatura bogʻlash', 'Вязка арматуры', 'Rebar tying'],
  ['a04', '🧱', '콘크리트 타설', '混凝土浇筑', 'Đổ bê tông', 'Beton quyish', 'Бетонирование', 'Concrete pouring'],
  ['a05', '🏗️', '비계 설치', '搭设脚手架', 'Lắp dựng giàn giáo', 'Havoza (lesa) oʻrnatish', 'Монтаж лесов', 'Scaffold erection'],
  ['a06', '🏗️', '비계 해체', '拆除脚手架', 'Tháo dỡ giàn giáo', 'Havozani (lesani) yechish', 'Демонтаж лесов', 'Scaffold dismantling'],
  ['a07', '⛏️', '굴착(땅파기)', '土方开挖', 'Đào đất', 'Tuproq qazish', 'Земляные работы (выемка грунта)', 'Excavation'],
  ['a08', '🚜', '되메우기', '土方回填', 'Lấp đất', 'Tuproqni qayta toʻldirish', 'Обратная засыпка', 'Backfilling'],
  ['a09', '🧱', '흙막이 설치', '基坑支护施工', 'Thi công hệ chống đỡ hố đào', 'Tuproq tutgich devor oʻrnatish', 'Устройство ограждения котлована', 'Earth retaining (shoring) work'],
  ['a10', '🧱', '조적(벽돌 쌓기)', '砌砖', 'Xây gạch', 'Gʻisht terish', 'Кирпичная кладка', 'Bricklaying'],
  ['a11', '🖌️', '미장', '抹灰', 'Trát tường', 'Suvoq ishlari', 'Штукатурные работы', 'Plastering'],
  ['a12', '💧', '방수', '防水施工', 'Chống thấm', 'Gidroizolyatsiya', 'Гидроизоляция', 'Waterproofing'],
  ['a13', '◻️', '타일', '贴瓷砖', 'Ốp lát gạch', 'Kafel yotqizish', 'Укладка плитки', 'Tiling'],
  ['a14', '🎨', '도장(페인트)', '刷漆（涂装）', 'Sơn', 'Boʻyash', 'Покрасочные работы', 'Painting'],
  ['a15', '🔥', '용접', '焊接', 'Hàn', 'Payvandlash', 'Сварка', 'Welding'],
  ['a16', '🪚', '절단 · 그라인더', '切割、打磨', 'Cắt, mài', 'Kesish va silliqlash', 'Резка и шлифовка', 'Cutting and grinding'],
  ['a17', '🔌', '전기 배선', '电气布线', 'Đi dây điện', 'Elektr simlarini tortish', 'Прокладка электропроводки', 'Electrical wiring'],
  ['a18', '🔧', '배관', '管道安装', 'Lắp đặt đường ống', 'Quvur oʻtkazish', 'Монтаж трубопроводов', 'Pipe installation'],
  ['a19', '📦', '자재 운반', '材料搬运', 'Vận chuyển vật liệu', 'Material tashish', 'Перемещение материалов', 'Material handling'],
  ['a20', '🏗️', '크레인 양중(인양)', '起重吊装', 'Cẩu hàng bằng cần cẩu', 'Kran bilan yuk koʻtarish', 'Подъём грузов краном', 'Crane lifting'],
  ['a21', '🏢', '철골 조립', '钢结构安装', 'Lắp dựng kết cấu thép', 'Metall konstruksiyalarni yigʻish', 'Монтаж металлоконструкций', 'Steel structure erection'],
  ['a22', '▦', '데크플레이트 설치', '楼承板铺设', 'Lắp đặt tấm sàn deck', 'Profnastil (deck) yotqizish', 'Укладка профнастила (несъёмной опалубки)', 'Deck plate installation'],
  ['a23', '🧊', '단열재 설치', '保温材料安装', 'Lắp đặt vật liệu cách nhiệt', 'Issiqlik izolyatsiyasini oʻrnatish', 'Монтаж теплоизоляции', 'Insulation installation'],
  ['a24', '🪟', '창호 설치', '门窗安装', 'Lắp đặt cửa đi, cửa sổ', 'Eshik va derazalarni oʻrnatish', 'Установка окон и дверей', 'Window and door installation'],
  ['a25', '▭', '석고보드', '石膏板安装', 'Lắp tấm thạch cao', 'Gipsokarton oʻrnatish', 'Монтаж гипсокартона', 'Gypsum board installation'],
  ['a26', '🏚️', '해체 · 철거', '拆除作业', 'Phá dỡ', 'Buzish (demontaj)', 'Демонтаж (снос)', 'Demolition'],
  ['a27', '🛣️', '포장(아스팔트)', '沥青铺设', 'Trải nhựa đường', 'Asfalt yotqizish', 'Укладка асфальта', 'Asphalt paving'],
  ['a28', '🌳', '조경', '绿化施工', 'Thi công cảnh quan', 'Koʻkalamzorlashtirish', 'Озеленение', 'Landscaping'],
  ['a29', '🛗', '고소작업대 작업', '高空作业平台作业', 'Làm việc trên xe nâng người', 'Koʻtarish platformasida ishlash', 'Работа на подъёмной платформе', 'Aerial work platform work'],
  ['a30', '🏠', '지붕 작업', '屋面作业', 'Làm việc trên mái', 'Tom ustida ishlash', 'Кровельные работы', 'Roof work'],
  ['a31', '🧹', '청소 · 정리', '清扫整理', 'Dọn dẹp vệ sinh', 'Tozalash va tartibga keltirish', 'Уборка и наведение порядка', 'Cleaning and housekeeping'],
]
export const 작업들 = 작업줄.map(([id, g, ko, zh, vi, uz, ru, en]) => ({ id, g, ko, zh, vi, uz, ru, en }))
export const 작업 = Object.fromEntries(작업들.map((s) => [s.id, s]))
/* 작업마다 먼저 떠올릴 위험 문장 — «👍 추천 넣기» 가 고른 작업의 문장을 같이 넣음(TBM · 작업 지시서) */
export const 작업문장 = {
  a01: ['f3', 'k3', 'd1', 'd3'], a02: ['k3', 'd1', 'd2', 'n2'], a03: ['n2', 'p4', 'f3'], a04: ['k4', 'e1', 'k6', 'l6'],
  a05: ['f5', 'f3', 'd3', 'k6'], a06: ['d1', 'd2', 'f3', 'd5'], a07: ['k1', 'k2', 'e1', 'e2'], a08: ['e1', 'e3', 'e4'],
  a09: ['k2', 'k1', 'c1'], a10: ['d4', 'f5', 'n4'], a11: ['f5', 'p5', 'f6'], a12: ['r6', 's2', 'p6'],
  a13: ['p5', 'l1', 'p6'], a14: ['r6', 'p6', 's2'], a15: ['r1', 'r2', 'r3', 'p5', 'r7'], a16: ['p5', 'e9', 'r1'],
  a17: ['l1', 'l2', 'l3', 'l4'], a18: ['s1', 's2', 'r1'], a19: ['n4', 'e3', 'n1'], a20: ['c1', 'c2', 'c3', 'c5', 'c4'],
  a21: ['f3', 'c1', 'd2', 'd3'], a22: ['f1', 'f3', 'd2'], a23: ['r6', 'r4'], a24: ['f8', 'f3', 'n4'],
  a25: ['n4', 'd4', 'p6'], a26: ['k5', 'd1', 'p6', 'p7'], a27: ['e3', 'e1', 'w1'], a28: ['e1', 'p4'],
  a29: ['f9', 'p2', 'l5'], a30: ['f7', 'f3', 'f8'], a31: ['n1', 'n2', 'n3'],
}

/* 종이 머리말 — 칸 이름 */
const 머리줄 = [
  ['tbm', '작업 전 안전점검회의 (TBM)', '班前安全会议（TBM）', 'Họp an toàn trước khi làm việc (TBM)', 'Ish oldidan xavfsizlik yigʻilishi (TBM)', 'Совещание по безопасности перед работой (TBM)', 'Pre-work Safety Meeting (TBM)'],
  ['rule', '현장 안전수칙', '现场安全守则', 'Nội quy an toàn công trường', 'Qurilish maydonchasi xavfsizlik qoidalari', 'Правила безопасности на объекте', 'Site Safety Rules'],
  ['order', '작업 지시서', '作业指示单', 'Phiếu giao việc', 'Ish topshirigʻi', 'Задание на работу', 'Work Instructions'],
  ['date', '날짜', '日期', 'Ngày', 'Sana', 'Дата', 'Date'],
  ['time', '시간', '时间', 'Giờ', 'Vaqt', 'Время', 'Time'],
  ['site', '현장', '工地', 'Công trường', 'Qurilish obyekti', 'Объект', 'Site'],
  ['place', '작업 장소', '作业地点', 'Nơi làm việc', 'Ish joyi', 'Место работы', 'Work area'],
  ['leader', '진행자(관리감독자)', '主持人（管理监督者）', 'Người chủ trì (giám sát)', 'Olib boruvchi (nazoratchi)', 'Ведущий (мастер)', 'Leader (supervisor)'],
  ['work', '오늘 할 작업', '今天的工作', 'Công việc hôm nay', 'Bugungi ish', 'Работа на сегодня', "Today's work"],
  ['risk', '위험한 것과 지킬 것', '危险因素与安全措施', 'Nguy hiểm và biện pháp an toàn', 'Xavflar va xavfsizlik choralari', 'Опасности и меры безопасности', 'Hazards and safety measures'],
  ['ppe', '보호구 확인', '劳保用品检查', 'Kiểm tra đồ bảo hộ', 'Himoya vositalarini tekshirish', 'Проверка средств защиты', 'PPE check'],
  ['health', '건강 확인', '身体状况确认', 'Kiểm tra sức khỏe', 'Sogʻliqni tekshirish', 'Проверка самочувствия', 'Health check'],
  ['remember', '꼭 기억하세요', '请一定记住', 'Hãy nhớ kỹ', 'Albatta yodda tuting', 'Обязательно помните', 'Remember'],
  ['emerg', '비상 연락', '紧急联系', 'Liên lạc khẩn cấp', 'Favqulodda aloqa', 'Экстренная связь', 'Emergency contact'],
  ['boss', '관리자', '管理人员', 'Quản lý', 'Rahbar', 'Руководитель', 'Supervisor'],
  ['phone', '전화', '电话', 'Điện thoại', 'Telefon', 'Телефон', 'Phone'],
  ['evac', '대피 장소', '避难地点', 'Nơi sơ tán', 'Evakuatsiya joyi', 'Место эвакуации', 'Evacuation point'],
  ['sign', '참석자 서명', '参加人员签名', 'Chữ ký người tham dự', 'Ishtirokchilar imzosi', 'Подписи участников', 'Attendee signatures'],
  ['no', '번호', '序号', 'STT', '№', '№', 'No.'],
  ['name', '이름', '姓名', 'Họ tên', 'Ism', 'Имя', 'Name'],
  ['nat', '국적 · 언어', '国籍·语言', 'Quốc tịch · Ngôn ngữ', 'Fuqarolik · Til', 'Гражданство · Язык', 'Nationality · Language'],
  ['sig', '서명', '签名', 'Chữ ký', 'Imzo', 'Подпись', 'Signature'],
  ['ok', '위 내용을 듣고 이해했습니다.', '我已听懂以上内容。', 'Tôi đã nghe và hiểu nội dung trên.', 'Yuqoridagi mazmunni eshitdim va tushundim.', 'Я выслушал(а) и понял(а) сказанное выше.', 'I have heard and understood the above.'],
  ['worker', '작업자', '作业人员', 'Người lao động', 'Ishchi', 'Работник', 'Worker'],
  ['start', '시작', '开始', 'Bắt đầu', 'Boshlanishi', 'Начало', 'Start'],
  ['end', '끝', '结束', 'Kết thúc', 'Tugashi', 'Конец', 'End'],
  ['issuer', '지시한 사람', '指示人', 'Người giao việc', 'Topshiriq bergan', 'Выдал задание', 'Issued by'],
  ['confirm', '확인(작업자)', '确认（作业人员）', 'Xác nhận (người lao động)', 'Tasdiq (ishchi)', 'Подтверждение (работник)', 'Confirmed (worker)'],
  ['caution', '주의할 것', '注意事项', 'Điều cần chú ý', 'Eʼtibor berish kerak', 'Обратите внимание', 'Points to watch'],
  ['no_f', '금지', '禁止', 'Cấm', 'Taqiqlanadi', 'Запрещено', 'Prohibited'],
  ['warn_f', '주의', '注意', 'Chú ý', 'Diqqat', 'Внимание', 'Caution'],
  ['do_f', '꼭 지키기', '必须遵守', 'Bắt buộc', 'Majburiy', 'Обязательно', 'Mandatory'],
  ['info_f', '안내', '提示', 'Hướng dẫn', 'Maʼlumot', 'Информация', 'Information'],
  ['self', '직접 쓴 말 — 번역되지 않았습니다', '现场自行填写（未翻译）', 'Nội dung tự viết (chưa dịch)', 'Qoʻshimcha yozilgan (tarjima qilinmagan)', 'Добавлено вручную (без перевода)', 'Added on site (not translated)'],
  ['floor', '층', '层', 'Tầng', 'qavat', 'этаж', 'Floor'],
  ['under', '지하', '地下', 'Tầng hầm', 'Yertoʻla', 'Подземный', 'Basement'],
  ['bldg', '동', '栋', 'Tòa', 'bino', 'корпус', 'Building'],
  ['zone', '구역', '区域', 'Khu vực', 'hudud', 'участок', 'Zone'],
]
export const 머리 = Object.fromEntries(머리줄.map(([k, ko, zh, vi, uz, ru, en]) => [k, { ko, zh, vi, uz, ru, en }]))

export const 꼴이름 = { no: '금지', warn: '주의', do: '꼭 지키기', info: '안내' }

/* ── 장소 글: 동 · 층(지하) · 구역 → 말마다 (숫자 · 글자만 바꿔 끼움) ── */
export function 장소글(장, k) {
  const 동 = String((장 && 장.동) || '').trim(), 층 = String((장 && 장.층) || '').trim(), 구 = String((장 && 장.구) || '').trim(), 지하 = !!(장 && 장.지하)
  const 줄 = []
  if (k === 'ko') {
    if (동) 줄.push(`${동}동`)
    if (층) 줄.push(`${지하 ? '지하 ' : ''}${층}층`)
    if (구) 줄.push(`${구}구역`)
    return 줄.join(' ')
  }
  if (k === 'zh') {
    if (동) 줄.push(`${동}栋`)
    if (층) 줄.push(`${지하 ? '地下' : ''}${층}层`)
    if (구) 줄.push(`${구}区`)
    return 줄.join(' ')
  }
  if (k === 'vi') {
    if (동) 줄.push(`Tòa ${동}`)
    if (층) 줄.push(지하 ? `Tầng hầm ${층}` : `Tầng ${층}`)
    if (구) 줄.push(`Khu ${구}`)
    return 줄.join(', ')
  }
  if (k === 'uz') {
    if (동) 줄.push(`${동}-bino`)
    if (층) 줄.push(지하 ? `${층}-yerosti qavat` : `${층}-qavat`)
    if (구) 줄.push(`${구}-hudud`)
    return 줄.join(', ')
  }
  if (k === 'ru') {
    if (동) 줄.push(`корпус ${동}`)
    if (층) 줄.push(지하 ? `${층}-й подземный этаж` : `${층}-й этаж`)
    if (구) 줄.push(`участок ${구}`)
    return 줄.join(', ')
  }
  if (k === 'en') {
    if (동) 줄.push(`Bldg ${동}`)
    if (층) 줄.push(지하 ? `B${층}` : `Floor ${층}`)
    if (구) 줄.push(`Zone ${구}`)
    return 줄.join(', ')
  }
  return ''
}

/* ── 저장(이 브라우저) ── */
export const 열쇠 = 'kcm.safecard.v1'
export const 빈판 = () => ({
  종류: 'tbm', 말: ['zh'], 문장: { tbm: ['t1', 't2', 't4', 'h1', 'h2', 'h3', 'p1', 'p2', 'p3'], rule: [], order: [] },
  작업: [], 직접: { tbm: [], rule: [], order: [] },
  칸: { date: '', time: '', site: '', leader: '', boss: '', phone: '', evac: '', 시작: '', 끝: '', issuer: '', 작업자: '' },
  장소: { 동: '', 층: '', 구: '', 지하: false }, 서명줄: 12, 꼴: '목록', 건설맵: true,
})
export function 읽기() {
  try {
    const v = JSON.parse(localStorage.getItem(열쇠) || 'null')
    if (!v || typeof v !== 'object') return 빈판()
    const b = 빈판()
    const 말 = Array.isArray(v.말) ? v.말.filter((k) => 말들.includes(k)).slice(0, 3) : b.말
    const 고른 = (x) => (Array.isArray(x) ? x.filter((id) => 문장[id]) : [])
    return {
      ...b, ...v,
      종류: ['tbm', 'rule', 'order'].includes(v.종류) ? v.종류 : 'tbm',
      말: 말.length ? 말 : b.말,
      문장: { tbm: 고른(v.문장 && v.문장.tbm), rule: 고른(v.문장 && v.문장.rule), order: 고른(v.문장 && v.문장.order) },
      작업: Array.isArray(v.작업) ? v.작업.filter((id) => 작업[id]) : [],
      직접: {
        tbm: 직접고름(v.직접 && v.직접.tbm), rule: 직접고름(v.직접 && v.직접.rule), order: 직접고름(v.직접 && v.직접.order),
      },
      칸: { ...b.칸, ...(v.칸 && typeof v.칸 === 'object' ? v.칸 : {}) },
      장소: { ...b.장소, ...(v.장소 && typeof v.장소 === 'object' ? v.장소 : {}) },
      서명줄: [0, 8, 12, 16, 20].includes(v.서명줄) ? v.서명줄 : 12,
      꼴: v.꼴 === '표지' ? '표지' : '목록',
      건설맵: v.건설맵 !== false,
    }
  } catch (e) { return 빈판() }
}
function 직접고름(x) {
  if (!Array.isArray(x)) return []
  return x.slice(0, 12).map((r) => ({ ko: String((r && r.ko) || '').slice(0, 200), 번: r && typeof r.번 === 'object' ? Object.fromEntries(말들.map((k) => [k, String(r.번[k] || '').slice(0, 300)])) : {} }))
}
export function 쓰기(v) { try { localStorage.setItem(열쇠, JSON.stringify(v)); return true } catch (e) { return false } }

/* 🧪 예시 — 지어낸 현장(가상) */
export function 예시판() {
  const b = 빈판()
  return {
    ...b, 종류: 'tbm', 말: ['zh', 'vi'],
    문장: {
      tbm: ['t1', 't2', 'h1', 'h2', 'h3', 'p1', 'p2', 'p3', 'f1', 'f2', 'f3', 'k3', 'k4', 'w1', 'w3', 't4', 't5'],
      rule: ['p1', 'p2', 'f1', 'f3', 'd1', 'e1', 'c1', 'l1', 'r1', 's1', 'n1', 'm2'],
      order: ['o2', 'o3', 'o4', 'f3', 'c1', 'o5'],
    },
    작업: ['a01', 'a03', 'a04'],
    직접: { tbm: [{ ko: '오후 2시부터 레미콘 차량이 들어옵니다.', 번: {} }], rule: [], order: [] },
    칸: { ...b.칸, date: 예시날(), time: '07:30', site: '예시 근린생활시설 신축공사(가상)', leader: '김반장(가상)', boss: '이과장(가상)', phone: '010-0000-0000', evac: '정문 앞 공터', 시작: '08:00', 끝: '17:00', issuer: '김반장(가상)', 작업자: '형틀 4명 · 철근 3명' },
    장소: { 동: '', 층: '3', 구: 'A', 지하: false },
  }
}
export function 예시날() { const d = new Date(Date.now() + 9 * 3600e3); return d.toISOString().slice(0, 10) }

/* 고른 문장 줄(분류 순서 · 고른 순서 지킴) */
export const 고른문장 = (ids) => (ids || []).map((id) => 문장[id]).filter(Boolean)
