import streamlit as st
import pandas as pd
import requests
import pyrebase
import urllib3
import urllib.parse
from datetime import datetime, timedelta, timezone

# ==========================================
# 1. 보안 및 페이지 설정 (네이버 SEO + 예전 버전의 안전한 흐림 방지 복구!)
# ==========================================
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
st.set_page_config(page_title="K-건설맵 Master", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
    <head>
        <meta name="naver-site-verification" content="bfb3f10bce2983b4dd5974ba39d05e3ce5225e73" />
        <meta name="description" content="K-건설맵: 전국 건설 공사 입찰 및 실시간 1순위 개찰 결과를 즉시 확인하세요.">
    </head>
    <style>
        /* [핵심] V9.9 시절의 안전한 화면 흐림 방지 복구 (화살표 정상 작동) */
        .stApp[data-teststate="running"] .stAppViewBlockContainer {
            filter: none !important;
            opacity: 1 !important;
        }
        [data-testid="stStatusWidget"] {
            visibility: hidden !important;
            display: none !important;
        }
        /* 화면 전환 시 깜빡임 방지 */
        .stApp {
            transition: none !important;
        }

        /* 메인 디자인 */
        .main-title { background-color: #1e3a8a; color: white; border-radius: 10px; font-weight: 900; font-size: 28px; text-align: center; padding: 20px; margin-bottom: 25px; } 
        .stat-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; } 
        .stat-val { font-size: 20px; font-weight: 700; color: #1e3a8a; }
    </style>
""", unsafe_allow_html=True)

KST = timezone(timedelta(hours=9))

# ==========================================
# 🔑 2. 파이어베이스 및 API 설정
# ==========================================
firebaseConfig = {
    "apiKey": "AIzaSyB5uvAzUIbEDTTbxwflTQk3wdzOufc4SE0",
    "authDomain": "k-conmap.firebaseapp.com",
    "databaseURL": "https://k-conmap-default-rtdb.firebaseio.com",
    "projectId": "k-conmap",
    "storageBucket": "k-conmap.firebasestorage.app",
    "messagingSenderId": "230642116525",
    "appId": "1:230642116525:web:f6f3765cf9a7273ba92324"
}

G2B_API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
SAFE_API_KEY = urllib.parse.unquote(G2B_API_KEY)

@st.cache_resource
def init_firebase():
    firebase = pyrebase.initialize_app(firebaseConfig)
    return firebase.auth(), firebase.database()

auth, db = init_firebase()

if 'logged_in' not in st.session_state: st.session_state['logged_in'] = False
if 'user_name' not in st.session_state: st.session_state['user_name'] = ""
if 'user_license' not in st.session_state: st.session_state['user_license'] = ""

# ==========================================
# 🚨 3. 절대 안전지대 (상수 데이터 맨 위로 고정!)
# ==========================================
REGION_LIST = ["전국(전체)", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"]

ALL_LICENSES = ["[종합] 건축공사업", "[종합] 토목공사업", "[종합] 토목건축공사업", "[종합] 조경공사업", "[종합] 산업·환경설비공사업", "[전문] 지반조성·포장공사업",
                "[전문] 실내건축공사업", "[전문] 금속창호·지붕건축물조립공사업", "[전문] 도장·습식·방수·석공사업", "[전문] 조경식재·시설물공사업", "[전문] 구조물해체·비계공사업",
                "[전문] 상·하수도설비공사업", "[전문] 철도·궤도공사업", "[전문] 철근·콘크리트공사업", "[전문] 수중·준설공사업", "[전문] 승강기설치공사업", "[전문] 기계설비공사업",
                "[전문] 철강구조물공사업", "[기타] 전기공사업", "[기타] 정보통신공사업", "[기타] 소방시설공사업"]

# ==========================================
# 📈 4. 통계 및 데이터 엔진
# ==========================================
def update_stats():
    try:
        now = datetime.now(KST)
        month_key = now.strftime('%Y-%m')
        if 'visited' not in st.session_state:
            m_v = db.child("stats").child("monthly").child(month_key).get().val() or 0
            db.child("stats").child("monthly").update({month_key: m_v + 1})
            t_v = db.child("stats").child("total_visits").get().val() or 0
            db.child("stats").update({"total_visits": t_v + 1})
            st.session_state['visited'] = True
    except:
        pass

def get_stats():
    try:
        month_key = datetime.now(KST).strftime('%Y-%m')
        m_v = db.child("stats").child("monthly").child(month_key).get().val() or 0
        t_v = db.child("stats").child("total_visits").get().val() or 0
        if t_v < 802: t_v = 802; db.child("stats").update({"total_visits": t_v})
        u_v = db.child("users").get().val()
        return t_v, m_v, len(u_v) if u_v else 0
    except:
        return 802, 802, 0

def fetch_api_fast(url, params):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, params=params, verify=False, timeout=10, headers=headers)
        if res.status_code == 200: return res.json().get('response', {}).get('body', {}).get('items', [])
    except:
        pass
    return []

@st.cache_data(ttl=300, show_spinner=False)
def get_hybrid_1st_bids():
    now = datetime.now(KST)
    cutoff_dt = (now - timedelta(days=180)).replace(tzinfo=None)
    url = 'http://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoCnstwk'
    s_dt = (now - timedelta(days=15)).strftime('%Y%m%d')
    e_dt = now.strftime('%Y%m%d')
    api_items = fetch_api_fast(url, {'serviceKey': SAFE_API_KEY, 'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1',
                                     'inqryBgnDt': s_dt + '0000', 'inqryEndDt': e_dt + '2359', 'type': 'json'})
    db_data = db.child("archive_1st").get().val() or {}
    db_items = list(db_data.values()) if db_data else []
    new_rows = {}
    for item in api_items:
        try:
            bid_no = item.get('bidNtceNo', '')
            corp = str(item.get('opengCorpInfo', '')).split('^')
            if len(corp) > 1:
                new_rows[bid_no] = {
                    '1순위업체': corp[0].strip(), '공고번호': bid_no, '날짜': item.get('opengDt', ''),
                    '공고명': item.get('bidNtceNm', ''), '발주기관': item.get('ntceInsttNm', ''),
                    '투찰금액': f"{int(corp[3].strip()):,}원" if len(corp) > 3 else '-',
                    '투찰률': f"{corp[4].strip()}%" if len(corp) >= 5 else '-'
                }
        except:
            continue
    if new_rows: db.child("archive_1st").update(new_rows)
    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['날짜'], errors='coerce')
        df = df[df['dt'] >= cutoff_dt].sort_values(by='dt', ascending=False)
        df['날짜'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df

@st.cache_data(ttl=300, show_spinner=False)
def get_hybrid_live_bids():
    now = datetime.now(KST)
    cutoff_dt = (now - timedelta(days=180)).replace(tzinfo=None)
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'
    s_dt = now.strftime('%Y%m%d')
    api_items = fetch_api_fast(url, {'serviceKey': SAFE_API_KEY, 'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1',
                                     'inqryBgnDt': s_dt + '0000', 'inqryEndDt': s_dt + '2359', 'bidNtceNm': '공사',
                                     'type': 'json'})
    db_data = db.child("archive_live").get().val() or {}
    db_items = list(db_data.values()) if db_data else []
    new_rows = {}
    for item in api_items:
        bid_no = item.get('bidNtceNo', '')
        new_rows[bid_no] = {
            '공고번호': bid_no, '공고일자': item.get('bidNtceDt', ''), '공고명': item.get('bidNtceNm', ''),
            '발주기관': item.get('ntceInsttNm', ''), '예산금액': int(float(item.get('bdgtAmt', 0))),
            '상세보기': "https://www.g2b.go.kr/index.jsp"
        }
    if new_rows: db.child("archive_live").update(new_rows)
    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['공고일자'], errors='coerce')
        df = df[df['dt'] >= cutoff_dt].sort_values(by='dt', ascending=False)
        df['공고일자'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df

def filter_by_region(df, selected_region):
    if selected_region == "전국(전체)": return df
    region_keywords = {"서울": ["서울"], "부산": ["부산"], "대구": ["대구"], "인천": ["인천"], "광주": ["광주"], "대전": ["대전"], "울산": ["울산"],
                       "세종": ["세종"], "경기": ["경기", "경기도"], "강원": ["강원", "강원도"], "충북": ["충북", "충청북도"],
                       "충남": ["충남", "충청남도"], "전북": ["전북", "전라북도"], "전남": ["전남", "전라남도"], "경북": ["경북", "경상북도"],
                       "경남": ["경남", "경상남도"], "제주": ["제주"]}
    keywords = region_keywords.get(selected_region, [selected_region])
    pattern = '|'.join(keywords)
    return df[df['발주기관'].str.contains(pattern, na=False) | df['공고명'].str.contains(pattern, na=False)]

# ==========================================
# 🎨 5. 메인 UI 대시보드
# ==========================================
update_stats()
t_visit, m_visit, t_user = get_stats()

st.markdown('<div class="main-title">🏛️ K-건설맵</div>', unsafe_allow_html=True)

c1, c2, c3, c4 = st.columns(4)
with c1: st.markdown(
    f'<div class="stat-card">📅 오늘 날짜<br><span class="stat-val">{datetime.now(KST).strftime("%Y-%m-%d")}</span></div>',
    unsafe_allow_html=True)
with c2: st.markdown(
    f'<div class="stat-card">📈 누적 / 이달 방문<br><span class="stat-val">{t_visit:,}명 / {m_visit:,}명</span></div>',
    unsafe_allow_html=True)
with c3: st.markdown(f'<div class="stat-card">👥 전체 회원수<br><span class="stat-val">{t_user:,}명</span></div>',
                     unsafe_allow_html=True)
with c4: st.markdown(
    f'<div class="stat-card">🔔 가동 상태<br><span class="stat-val" style="color:green;">정상 운영 중</span></div>',
    unsafe_allow_html=True)

with st.sidebar:
    st.write("### 👷 K-건설맵 메뉴")
    if st.session_state['logged_in']:
        st.success(f"👋 {st.session_state['user_name']} 소장님")
        st.caption(f"보유 면허: {st.session_state['user_license']}")
        if st.button("🚪 로그아웃"): st.session_state['logged_in'] = False; st.rerun()
        menu_list = ["🏆 1순위 현황판", "📊 실시간 공고 (홈)", "📁 K-건설 자료실", "💬 K건설챗"]
    else:
        st.info("💡 **무료 회원가입** 후 내 면허 **맞춤매칭** 및 실시간 **오픈채팅**을 마음껏 이용하세요!")
        menu_list = ["🏆 1순위 현황판", "📊 실시간 공고 (홈)", "📁 K-건설 자료실", "💬 K건설챗", "👤 로그인 / 회원가입"]
    menu = st.radio("업무 선택", menu_list)
    st.write("---")
    if st.button("🔄 만능 데이터 새로고침"): st.cache_data.clear(); st.rerun()

# ==========================================
# 🚀 6. 메뉴별 작동 로직
# ==========================================
if menu == "🏆 1순위 현황판":
    st.subheader("🏆 실시간 1순위 현황판")
    col_t, col_m, col_b = st.columns([2, 1, 1])
    with col_t:
        st.write(" ")
    with col_m:
        selected_region_1st = st.selectbox("🌍 지역 필터링", REGION_LIST, key="reg_1st")
    with col_b:
        st.link_button("🚀 나라장터 바로가기", "https://www.g2b.go.kr/index.jsp", use_container_width=True)

    with st.expander("🌡️ 5구간 기초금액(예가) 입찰 온도계"):
        calc_col1, calc_col2 = st.columns(2)
        with calc_col1:
            base_price = st.number_input("기초금액 입력 (원)", value=0, step=1000000)
        with calc_col2:
            rate_option = st.radio("투찰률 선택 (%)", ["87.745", "86.745"], horizontal=True)
        if base_price > 0:
            st.write("💡 **사정율 구간별 예상 투찰금액**")
            tr_cols = st.columns(5)
            rates = [99.0, 99.5, 100.0, 100.5, 101.0]
            labels = ["❄️ 차가움", "🌬️ 서늘함", "🌤️ 적정함", "☀️ 따뜻함", "🔥 뜨거움"]
            for i, r in enumerate(rates):
                with tr_cols[i]:
                    bid_p = int(base_price * (r / 100) * (float(rate_option) / 100))
                    st.info(f"**{labels[i]}**\n\n{r}%\n\n**{bid_p:,}원**")

    df_w = get_hybrid_1st_bids()
    if not df_w.empty:
        df_f = filter_by_region(df_w, selected_region_1st)
        st.info("💡 **맨 왼쪽 [빈 칸]을 클릭하세요!** 상세 정보가 열립니다.")
        event = st.dataframe(df_f[['1순위업체', '날짜', '공고명', '발주기관', '투찰금액', '투찰률']], use_container_width=True,
                             hide_index=True, height=400, selection_mode="single-row", on_select="rerun")
        if len(event.selection.rows) > 0:
            row = df_f.iloc[event.selection.rows[0]]
            st.markdown("---")
            sc1, sc2 = st.columns(2)
            with sc1: st.success(
                f"**📝 공고:** {row['공고명']}\n\n**🏛️ 발주:** {row['발주기관']}\n\n**💰 금액:** {row['투찰금액']} ({row['투찰률']})")
            with sc2:
                st.markdown("💡 **조달청 보안 정책으로 복사가 필요합니다.**")
                st.caption("1️⃣ 우측 아이콘(📋)을 눌러 공고번호를 복사하세요.")
                st.code(row['공고번호'], language=None)
                st.link_button("🚀 나라장터 메인 홈페이지 열기", "https://www.g2b.go.kr/index.jsp", use_container_width=True)
                st.link_button("🏢 업체 네이버 검색", f"https://search.naver.com/search.naver?query={row['1순위업체']} 건설",
                               use_container_width=True)

elif menu == "📊 실시간 공고 (홈)":
    st.subheader("📊 실시간 입찰 공고")
    df_live = get_hybrid_live_bids()
    if not df_live.empty:
        selected_region_live = st.selectbox("🌍 지역 필터링", REGION_LIST)
        df_live_f = filter_by_region(df_live, selected_region_live)
        col_cfg = {"상세보기": st.column_config.LinkColumn("상세보기", display_text="나라장터 이동"),
                   "예산금액": st.column_config.NumberColumn("예산(원)", format="%,d")}

        if st.session_state['logged_in'] and st.session_state['user_license']:
            t1, t2 = st.tabs(["🌐 전체 공고", "✨ 내 면허 맞춤매칭"])
            with t1:
                st.dataframe(df_live_f[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']], use_container_width=True,
                             hide_index=True, height=600, column_config=col_cfg)
            with t2:
                user_lic = st.session_state['user_license']
                keywords = []
                if "토목" in user_lic: keywords.extend(["토목", "도로", "포장", "하천", "교량", "정비", "관로", "상수도", "하수도", "부대시설"])
                if "건축" in user_lic: keywords.extend(["건축", "신축", "증축", "보수", "인테리어", "환경개선", "방수", "도장"])
                if "철근" in user_lic or "콘크리트" in user_lic: keywords.extend(
                    ["철근", "콘크리트", "철콘", "구조물", "옹벽", "포장", "배수", "기초", "집수정", "박스", "암거", "석축"])
                if "전기" in user_lic: keywords.extend(["전기", "배전", "가로등", "CCTV", "태양광", "신호등"])
                if "통신" in user_lic: keywords.extend(["통신", "네트워크", "방송", "CCTV", "케이블", "선로"])
                if "소방" in user_lic: keywords.extend(["소방", "화재", "스프링클러", "피난", "경보"])
                if "상·하수도" in user_lic: keywords.extend(["상수도", "하수도", "관로", "배수"])
                if "조경" in user_lic: keywords.extend(["조경", "식재", "공원", "수목", "벌목", "놀이터"])
                matched_df = df_live_f[
                    df_live_f['공고명'].str.contains('|'.join(keywords), na=False)] if keywords else df_live_f
                st.dataframe(matched_df[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']], use_container_width=True,
                             hide_index=True, height=600, column_config=col_cfg)
        else:
            st.dataframe(df_live_f[['공고번호', '공고일자', '공고명', '발주기관', '예산금액', '상세보기']], use_container_width=True,
                         hide_index=True, height=600, column_config=col_cfg)

# --- 📁 K-건설 자료실 섹션 ---
elif menu == "📁 K-건설 자료실":
    st.subheader("📁 K-건설 자료실")
    if st.session_state['logged_in']:
        with st.expander("✏️ 새 글 작성하기"):
            t = st.text_input("제목")
            c = st.text_area("내용")
            if st.button("등록"):
                if t and c:
                    db.child("posts").push({"author": st.session_state['user_name'], "title": t, "content": c,
                                            "time": datetime.now(KST).strftime("%Y-%m-%d %H:%M")})
                    st.success("등록 완료!")
                    st.rerun()
                else:
                    st.warning("제목과 내용을 모두 입력해주세요.")
    else:
        st.info("💡 글을 작성하시려면 로그인해 주세요.")

    posts = db.child("posts").get().val()
    if posts:
        for post_id, p in reversed(list(posts.items())):
            expander_title = f"📢 {p.get('title', '제목 없음')} (작성자: {p.get('author', '알수없음')} | {p.get('time', '')[:10]})"

            with st.expander(expander_title):
                st.write(p.get('content', '내용이 없습니다.'))

                if st.session_state['user_name'] == p.get('author') or st.session_state['user_name'] == "명환":
                    st.write("---")
                    if st.button("🗑️ 이 글 삭제하기", key=f"del_{post_id}"):
                        db.child("posts").child(post_id).remove()
                        st.success("글이 깔끔하게 삭제되었습니다!")
                        st.rerun()
    else:
        st.info("등록된 자료가 없습니다. 첫 글의 주인공이 되어보세요!")

# --- 💬 K건설챗 섹션 ---
elif menu == "💬 K건설챗":
    st.subheader("💬 K건설챗")
    if not st.session_state['logged_in']:
        st.info("로그인 후 소장님들과 실시간 대화를 나눠보세요!")
    else:
        col1, col2 = st.columns([8, 2])
        with col2:
            if st.button("🔄 대화 새로고침", use_container_width=True): st.rerun()
        chat_box = st.container(height=500)

        try:
            chats = db.child("k_chat").limit_to_last(50).get().val()
            with chat_box:
                if chats:
                    chat_list = list(chats.values())
                    chat_list.sort(key=lambda x: x.get('timestamp', 0))

                    for v in chat_list:
                        with st.chat_message("user",
                                             avatar="👷‍♂️" if v['author'] == st.session_state['user_name'] else "👤"):
                            st.markdown(f"**{v['author']}** <small>{v['time']}</small>", unsafe_allow_html=True)
                            st.write(v['message'])
                else:
                    st.info("아직 대화가 없습니다. 첫인사를 남겨보세요!")
        except Exception as e:
            with chat_box:
                st.info("대화 내역을 불러오는 중이거나 아직 대화가 없습니다.")

        if pr := st.chat_input("메시지를 입력하세요 (현장 상황 공유 등)"):
            db.child("k_chat").push({"author": st.session_state['user_name'], "message": pr,
                                     "time": datetime.now(KST).strftime("%m-%d %H:%M"),
                                     "timestamp": datetime.now(KST).timestamp()})
            st.rerun()

        if st.session_state['user_name'] == "명환":
            st.write("---")
            if st.button("🧹 [관리자] K건설챗 대화방 싹 비우기"): db.child("k_chat").remove(); st.rerun()

# --- 👤 로그인 / 회원가입 섹션 ---
elif menu == "👤 로그인 / 회원가입":
    st.subheader("👤 회원 정보 관리")
    t1, t2 = st.tabs(["🔑 로그인", "📝 회원가입"])
    with t1:
        le = st.text_input("이메일", key="login_e")
        lp = st.text_input("비밀번호", type="password", key="login_p")
        if st.button("로그인"):
            le_clean = le.strip().lower()
            if not le_clean or not lp:
                st.warning("이메일과 비밀번호를 모두 입력해주세요.")
            else:
                try:
                    user = auth.sign_in_with_email_and_password(le_clean, lp)
                    info = db.child("users").child(user['localId']).get().val() or {}
                    st.session_state.update({'logged_in': True, 'user_name': info.get('name', '소장님'),
                                             'user_license': info.get('license', '')})
                    st.rerun()
                except Exception as e:
                    st.error("로그인 실패 🥲 이메일이나 비밀번호를 다시 확인해주세요.")
    with t2:
        re = st.text_input("가입용 이메일", key="reg_e")
        rp = st.text_input("비밀번호 (6자 이상)", type="password", key="reg_p")
        rn = st.text_input("성함/직함", key="reg_n")
        rl = st.multiselect("보유 면허 (매칭용)", ALL_LICENSES, key="reg_l")

        if st.button("가입하기"):
            re_clean = re.strip().lower()
            if not re_clean or not rp or not rn:
                st.warning("이메일, 비밀번호, 성함을 모두 입력해주세요.")
            elif len(rp) < 6:
                st.error("비밀번호는 최소 6자리 이상이어야 합니다.")
            else:
                try:
                    u = auth.create_user_with_email_and_password(re_clean, rp)
                    l_s = ", ".join(rl) if rl else "선택안함"
                    db.child("users").child(u['localId']).set({"name": rn, "license": l_s, "email": re_clean})
                    st.success("🎉 가입 성공! 왼쪽 탭에서 로그인을 진행해주세요.");
                except Exception as e:
                    st.error("가입 실패! 이미 가입된 메일이거나 형식이 잘못되었습니다.")