# K-건설맵 v2 — 운영 설명서

Streamlit 을 걷어내고 **React + Firebase Hosting + 정적 JSON** 으로 다시 지은 판입니다.
사라사와 같은 구조라 명령도 같습니다.

---

## 1. 한눈에 보는 구조

```
[내 PC 파이썬]                          [Firebase Hosting]
 collect.py   조달청 수집  ─┐
 inbox.py     받은 자료    ─┼→ web/public/data/*.json ─→ npm run build ─→ firebase deploy
 build_json.py 3년치 집계  ─┘                                                  │
 sitemap.py   주소 목록    ─┘                                                  ▼
                                                              방문자는 정적 파일만 받음
                                                              (Firebase 읽기 0회 · 서버 0대)
```

**핵심**: 사용자가 접속할 때 계산하지 않습니다. 미리 만들어 둔 JSON을 그냥 내려받습니다.
그래서 서버가 필요 없고, 데이터베이스 읽기 요금이 발생하지 않습니다.

---

## 2. 처음 한 번만 하는 준비

### ① 필요한 것 설치

```
pip install -r requirements.txt
cd web
npm install
npm install -g firebase-tools     (이미 있으면 생략)
```

### ② API 키 넣기

`.env.example` 을 복사해 이름을 **`.env`** 로 바꾸고 값을 채웁니다.

```
G2B_API_KEY=공공데이터포털에서_받은_디코딩_키
SITE_URL=https://k-conmap.web.app
```

> ⚠️ 지금 `나노_건설시스템/auto_collector.py` 에는 이 키가 코드에 그대로 적혀 있고,
> 그 파일이 GitHub 공개 저장소(`kimmyounghwan/k_map`)에 올라가 있습니다.
> **키를 재발급받는 것을 권합니다.** 자세한 내용은 아래 «7. 보안» 참고.

### ③ 3년치 원본 넣기

`data/` 폴더에 아래 두 파일을 복사합니다.

```
data/bid_data_3years.zip
data/service_data_3years.zip
```

### ④ Firebase 규칙 올리기 (구인구직용, 한 번만)

```
cd web
firebase deploy --only database
```

---

## 3. 평소 운영 — 명령 하나

```
python run_all.py
```

이 한 줄이 아래를 순서대로 합니다.

| 단계 | 하는 일 | 걸리는 시간 |
|---|---|---|
| ① inbox | inbox 폴더에 넣어둔 자료 반영 | 몇 초 |
| ② collect | 조달청 최신 공고·개찰 수집 | 1~3분 |
| ③ build_json | 3년치 집계 → JSON | **3~5분** |
| ④ sitemap | 검색엔진 주소 목록 | 몇 초 |
| ⑤ 빌드 + 배포 | npm run build → firebase deploy | 1~3분 |

### 자주 쓰는 변형

```
python run_all.py --quick          집계 생략 (공고만 갱신 · 가장 자주 씀)
python run_all.py --no-deploy      배포 없이 확인만
python run_all.py --days 7         7일치 수집
python run_all.py --only collect   한 단계만
```

**③ 집계는 매번 돌릴 필요가 없습니다.** 3년치 데이터는 자주 바뀌지 않으니
평소에는 `--quick` 으로 공고만 갱신하고, 집계는 새 데이터를 넣었을 때만 돌리세요.

### 윈도우 작업 스케줄러 등록 (권장)

- 평일 오전 8시 / 오후 4시: `python run_all.py --quick`
- 일요일 새벽 3시: `python run_all.py`

시작 위치를 이 폴더로 지정하는 것만 잊지 마세요.

---

## 4. 바탕화면 자료 → 사이트 (`inbox`)

받은 자료를 사이트에 태우는 통로입니다.

1. `inbox/` 폴더에 CSV·엑셀 파일을 **그냥 던져 넣습니다**
2. `python run_all.py` (또는 `python inbox.py`)
3. 컬럼 이름이 달라도 알아서 맞추고, 날짜·금액·투찰률 형식을 정리하고,
   중복 공고번호를 걸러 `data/extra_*.csv` 로 저장합니다
4. 집계에 자동으로 합쳐집니다
5. 원본은 `inbox/_처리완료/` 로 옮겨집니다 (지우지 않습니다)

**필요한 컬럼**: 공고명 · 발주기관 · 투찰률 (이 셋만 있으면 됩니다)
**있으면 더 좋은 것**: 공고번호 · 날짜 · 1순위업체 · 투찰금액 · 전체업체

컬럼 이름은 아래 중 아무거나 인식합니다.

| 표준 | 인식하는 이름 |
|---|---|
| 발주기관 | 발주기관, 수요기관, 공고기관, 기관명, 발주처, ntceInsttNm |
| 1순위업체 | 1순위업체, 낙찰업체, 낙찰자, 업체명, 수급인 |
| 투찰률 | 투찰률, 사정률, 낙찰률, 투찰율, 비율 |
| 투찰금액 | 투찰금액, 낙찰금액, 계약금액, 투찰가, 금액 |

> 💡 더 편하게: 이 `inbox` 폴더를 바탕화면에 **바로가기**로 꺼내두세요.
> 자료를 받으면 바로가기에 끌어다 놓고, 저녁에 `run_all.py` 한 번이면 끝입니다.

---

## 5. 요금 — 왜 0원인가

| 항목 | 사용 | 무료 한도 | 예상 |
|---|---|---|---|
| Hosting 저장 | 약 80MB | 10GB | 0원 |
| Hosting 전송 | 방문자당 약 100KB | **360MB/일** | 0원 |
| Realtime DB | 구인구직만 | 1GB / 10GB월 | 0원 |
| Authentication | 익명, 글 쓸 때만 | 무제한 | 0원 |
| 서버 | **없음** | — | 0원 |

**하루 첫방문 3,000명까지 무료 한도 안**입니다. 재방문자는 캐시 덕에 거의 0에 가깝습니다.

### 이 구조가 지키는 규칙 (건드리지 마세요)

1. **큰 파일을 통으로 보내지 않는다** — 기관·업체는 첫 글자 색인(idx)으로 나누고,
   집계는 200개씩 묶음(dat)으로 쪼갭니다. 검색한 것이 든 묶음 하나만 내려받습니다.
2. **`/assets/**` 는 1년 캐시, `index.html` 은 캐시 금지** — `firebase.json` 에 설정돼 있습니다.
   index.html 을 캐시하면 배포해도 옛 화면이 계속 뜹니다.
3. **Realtime DB 는 실시간 구독(onValue)을 쓰지 않는다** — 화면 열 때 `get()` 한 번만.
   사라사에서 24시간 폴링이 돌아 요금이 샜던 그 문제를 구조적으로 막았습니다.
4. **항상 `limitToLast`** — 구인구직은 최근 200건만 읽습니다.
5. `first.json` 은 300건 상한 — 첫 화면에서 받는 파일이라 무거워지면 그대로 전송량입니다.

### 요금이 늘면 볼 곳

Firebase 콘솔 → Usage. 전송량이 튀었다면 `/data/**` 중 어떤 파일이 큰지 보세요.
`build_json.py` 의 `CHUNK`(묶음 크기)를 줄이면 개별 파일이 작아집니다.

---

## 6. 화면 구성

| 탭 | 내용 |
|---|---|
| 🏆 1순위 | 최근 개찰 결과. 카드를 누르면 참여업체 순위가 펼쳐집니다 |
| 📋 공고 | 나라장터 신규 공고. 면허를 고르면 맞춤 필터 (브라우저에만 저장) |
| 🧮 계산 | 투찰가 계산기 + 낙찰스코어 (세그먼트로 전환) |
| 🔍 분석 | 발주기관 분석 + 업체 자가진단 |
| 🤝 구인구직 | 로그인 없이 글쓰기·삭제 |

**삭제된 것**: 대문(랜딩), 회원가입·로그인, 자료실, K건설챗, 방문자 통계

### 검색 유입 장치

- `/agency/{기관명}` — 기관마다 독립 URL. 제목·설명 메타태그가 각각 붙습니다.
  도구를 쓰는 것만으로 색인 대상 페이지가 자동으로 쌓입니다.
- `sitemap.py` 는 처음에 **상위 300개 기관만** 싣습니다.
  신생 사이트에 URL 수천 개를 한꺼번에 던지면 «발견됨-색인 안 됨» 만 쌓입니다.
  색인이 붙는 것을 보면서 `.env` 의 `SITEMAP_AGENCIES` 를 올리세요.
- 데이터 없는 기관 페이지와 없는 주소는 `noindex` 처리 (soft 404 방지).

---

## 7. 보안 — 지금 바로 확인할 것

### ⚠️ 조달청 API 키가 공개 저장소에 있습니다

`나노_건설시스템/auto_collector.py` 33행에 키가 그대로 적혀 있고,
그 폴더는 `https://github.com/kimmyounghwan/k_map.git` 에 연결돼 있으며
**`.gitignore` 파일이 아예 없습니다.**

권장 조치:
1. 공공데이터포털에서 **키를 재발급**받고
2. 새 키는 이 프로젝트의 `.env` 에만 넣습니다 (`.gitignore` 로 보호됨)
3. 기존 저장소의 `auto_collector.py` 에서도 키를 지우고 `.env` 로 옮깁니다

### 구인구직 게시판

- 글쓰기는 **익명 로그인한 사람만** 가능 (봇 차단)
- 수정·숨김은 **글쓴이 브라우저(uid)만**
- 다른 기기에서 지울 때는 **4자리 비밀번호**
  → 비밀번호는 원문 저장하지 않고 해시만 `job_pins` 에 넣습니다.
     이 노드는 **아무도 읽을 수 없고**, 서버가 대조만 합니다.
- 필드마다 길이 제한이 걸려 있어 대용량 쓰기로 요금을 늘리는 공격이 막힙니다
- 목록에 없는 필드는 저장 자체가 거부됩니다

규칙은 `web/database.rules.json` 에 있고, 바꾸면 반드시 배포해야 적용됩니다.

> 규칙을 **병합이 아니라 교체**로 올리면 기존 규칙이 사라집니다.
> 사라사에서 한 번 겪은 사고라 다시 적어둡니다.

---

## 8. 폴더 구조

```
k-conmap-v2/
├── .env                  ← API 키 (직접 만드세요, git 에 안 올라감)
├── .env.example
├── .gitignore            ← 절대 지우지 마세요
├── collect.py            조달청 수집
├── inbox.py              받은 자료 반영
├── build_json.py         3년치 집계 (핵심)
├── sitemap.py            주소 목록
├── run_all.py            ★ 이거 하나만 돌리면 됨
├── requirements.txt
├── data/
│   ├── bid_data_3years.zip      (직접 넣기)
│   ├── service_data_3years.zip  (직접 넣기)
│   ├── extra_*.csv              inbox 가 만든 추가자료
│   └── store/                   수집 누적 보관
├── inbox/                ← 받은 자료를 여기에 던져 넣으세요
│   └── _처리완료/
└── web/                  ← npm · firebase 는 여기서 실행
    ├── package.json
    ├── firebase.json           캐시 헤더
    ├── database.rules.json     구인구직 보안 규칙
    ├── public/
    │   ├── data/               파이썬 산출물 (git 제외)
    │   ├── about.html · privacy.html · contact.html
    │   └── robots.txt · manifest.json · icon-*.png
    └── src/
        ├── App.jsx             레이아웃 + 하단 탭바
        ├── components.jsx      공용 UI
        ├── AgencyReport.jsx    기관 리포트 (분석 탭 + /agency 공용)
        ├── firebase.js
        ├── lib/
        │   ├── data.js         정적 JSON 로더 (비용 방어의 핵심)
        │   ├── engines.js      계산기·낙찰스코어 (app.py 이식)
        │   └── fmt.js          표시 형식·면허 키워드
        └── pages/              화면 7개
```

---

## 9. VS Code 에서 작업하기

```
VS Code → 폴더 열기 → k-conmap-v2
```

파이썬과 React 를 한 창에서 봅니다. 터미널 두 개를 띄우면 편합니다.

| 터미널 | 위치 | 명령 |
|---|---|---|
| 1 | `k-conmap-v2` | `python run_all.py --quick` |
| 2 | `k-conmap-v2\web` | `npm run dev` (저장하면 브라우저 즉시 반영) |

> ⚠️ PowerShell 에서 폴더를 헷갈리기 쉽습니다.
> **파이썬은 루트에서, `npm`·`firebase` 는 `web` 안에서** 돌아갑니다.

권장 확장: ESLint, Prettier, Python

---

## 10. 자주 막히는 곳

| 증상 | 원인과 해결 |
|---|---|
| 배포했는데 옛 화면 | `Ctrl+Shift+R` 강력 새로고침. 그래도면 `firebase.json` 의 index.html 캐시 헤더 확인 |
| 검색해도 기관이 안 나옴 | `build_json.py` 를 안 돌렸거나 `web/public/data/agency/` 가 비어 있음 |
| 한글 입력이 «ㄱ가강» 으로 깨짐 | 입력창 value 를 URL·외부 상태에 직접 묶으면 발생. 로컬 state + 디바운스로 짜여 있으니 그대로 두세요 |
| 구인구직 «저장 실패» | Firebase 콘솔에서 **익명 로그인**이 켜져 있는지, 규칙을 배포했는지 확인 |
| `collect.py` 가 0건 | `.env` 의 `G2B_API_KEY` 확인. 공공데이터포털 키는 **디코딩된** 값을 넣어야 합니다 |
| 배포가 오래 걸림 | 첫 배포는 파일 2,200개라 몇 분 걸립니다. 이후엔 바뀐 것만 올라가서 빨라집니다 |

---

## 11. 다음에 하면 좋은 것

1. **도메인 연결** — Firebase Hosting → 맞춤 도메인. `.env` 의 `SITE_URL` 도 바꾸세요
2. **Search Console·네이버 서치어드바이저에 sitemap.xml 제출**
3. **GA4 연결** — 단, 내부 트래픽 제외를 꼭 설정하세요 (안 하면 본인 접속에 묻혀 판단 불가)
4. **애드센스** — 기관 페이지가 색인되기 시작하면 신청.
   순수 도구 사이트는 «가치 없는 콘텐츠» 로 반려되기 쉬우니, `/agency/*` 색인 수가 붙은 뒤에 넣으세요
5. **기존 Streamlit 종료** — 색인과 유입이 새 사이트로 넘어온 것을 확인한 다음에
