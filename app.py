import streamlit as st
import pandas as pd
import requests
import pyrebase
import urllib3
import urllib.parse
from datetime import datetime, timedelta, timezone

# ==========================================
# 1. 보안 및 페이지 설정
# ==========================================
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
st.set_page_config(page_title="K-건설맵 Master", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
    <style>
        .stApp[data-teststate="running"] .stAppViewBlockContainer { filter: none !important; opacity: 1 !important; }
        [data-testid="stStatusWidget"] { visibility: hidden !important; display: none !important; }
        .stApp { transition: none !important; }
        .main-title { background-color: #1e3a8a; color: white; border-radius: 10px; font-weight: 900; font-size: 28px; text-align: center; padding: 20px; margin-bottom: 25px; } 
        .stat-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; } 
        .stat-val { font-size: 20px; font-weight: 700; color: #1e3a8a; }
    </style>
""", unsafe_allow_html=True)

KST = timezone(timedelta(hours=9))

# ==========================================
# 2. 파이어베이스 및 API 설정
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
# 3. 상수 및 유틸리티
# ==========================================
REGION_LIST = ["전국(전체)", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남",
               "제주"]
ALL_LICENSES = ["[종합] 건축공사업", "[종합] 토목공사업", "[종합] 토목건축공사업", "[전문] 지반조성·포장공사업", "[전문] 철근·콘크리트공사업", "[기타] 전기공사업",
                "[기타] 정보통신공사업", "[기타] 소방시설공사업"]


def safe_fmt_amt(raw):
    r = str(raw).strip()
    if not r or r in ('0', 'None', 'nan', 'NaN', ''): return "미발표"
    try:
        return f"{int(float(r)):,}원"
    except:
        return r


def update_stats():
    try:
        now = datetime.now(KST)
        month_key = now.strftime('%Y-%m')
        if 'visited' not in st.session_state:
            t_v = (db.child("stats").child("total_visits").get().val() or 802) + 1
            db.child("stats").update({"total_visits": t_v})
            st.session_state['visited'] = True
    except:
        pass


# ==========================================
# 4. 데이터 엔진 (에러 우회 및 최적화)
# ==========================================
@st.cache_data(ttl=180, show_spinner=False)
def get_hybrid_1st_bids():
    now = datetime.now(KST)
    s_dt = (now - timedelta(days=2)).strftime('%Y%m%d')
    e_dt = now.strftime('%Y%m%d')
    url = 'http://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoCnstwk'
    try:
        params = {'serviceKey': SAFE_API_KEY, 'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1',
                  'inqryBgnDt': s_dt + '0000', 'inqryEndDt': e_dt + '2359', 'type': 'json'}
        res = requests.get(url, params=params, verify=False, timeout=15)
        api_items = res.json().get('response', {}).get('body', {}).get('items', []) if res.status_code == 200 else []
    except:
        api_items = []

    db_data = db.child("archive_1st").order_by_key().limit_to_last(500).get().val() or {}
    db_items = list(db_data.values()) if isinstance(db_data, dict) else []

    new_rows = {}
    if isinstance(api_items, dict): api_items = api_items.get('item', [api_items])
    for item in (api_items if isinstance(api_items, list) else []):
        try:
            bid_no = item.get('bidNtceNo', '')
            info = str(item.get('opengCorpInfo', '')).split('|')[0].split('^')
            if len(info) > 1:
                new_rows[bid_no] = {
                    '1순위업체': info[0].strip(), '공고번호': bid_no, '공고차수': item.get('bidNtceOrd', '00'),
                    '날짜': item.get('opengDt', ''), '공고명': item.get('bidNtceNm', ''),
                    '발주기관': item.get('ntceInsttNm', ''),
                    '투찰금액': f"{int(float(info[3])):,}원" if len(info) > 3 else '-',
                    '투찰률': f"{info[4]}%" if len(info) > 4 else '-', '전체업체': item.get('opengCorpInfo', '')
                }
        except:
            continue
    if new_rows: db.child("archive_1st").update(new_rows)
    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['날짜'], errors='coerce')
        df = df.sort_values(by='dt', ascending=False)
        df['날짜'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df


@st.cache_data(ttl=300, show_spinner=False)
def get_hybrid_live_bids():
    now = datetime.now(KST)
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'
    try:
        res = requests.get(url, params={'serviceKey': SAFE_API_KEY, 'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1',
                                        'inqryBgnDt': now.strftime('%Y%m%d') + '0000', 'type': 'json'}, verify=False,
                           timeout=10)
        api_items = res.json().get('response', {}).get('body', {}).get('items', []) if res.status_code == 200 else []
    except:
        api_items = []
    db_data = db.child("archive_live").order_by_key().limit_to_last(500).get().val() or {}
    db_items = list(db_data.values()) if isinstance(db_data, dict) else []
    new_rows = {
        it.get('bidNtceNo'): {'공고번호': it.get('bidNtceNo'), '공고일자': it.get('bidNtceDt'), '공고명': it.get('bidNtceNm'),
                              '발주기관': it.get('ntceInsttNm'), '예산금액': int(float(it.get('bdgtAmt', 0) or 0)),
                              '상세보기': it.get('bidNtceDtlUrl')} for it in
        (api_items if isinstance(api_items, list) else [api_items]) if it.get('bidNtceNo')}
    if new_rows: db.child("archive_live").update(new_rows)
    df = pd.DataFrame(list(new_rows.values()) + db_items)
    if not df.empty:
        df = df.drop_duplicates(subset=['공고번호']).copy()
        df['dt'] = pd.to_datetime(df['공고일자'], errors='coerce')
        df = df.sort_values(by='dt', ascending=False)
        df['공고일자'] = df['dt'].dt.strftime('%m-%d %H:%M')
    return df


# ==========================================
# 5. UI 및 메인 로직
# ==========================================
update_stats()
st.markdown('<div class="main-title">🏛️ K-건설맵</div>', unsafe_allow_html=True)

with st.sidebar:
    st.write(f"### 👷 {'👋 ' + st.session_state['user_name'] + ' 소장님' if st.session_state['logged_in'] else '메뉴'}")
    menu = st.radio("업무 선택", ["🏆 1순위 현황판", "📊 실시간 공고 (홈)", "📁 K-건설 자료실", "💬 K건설챗", "👤 로그인 / 회원가입"])
    if st.button("🔄 만능 새로고침"): st.cache_data.clear(); st.rerun()
    if st.session_state['logged_in'] and st.button("🚪 로그아웃"): st.session_state['logged_in'] = False; st.rerun()

if menu == "🏆 1순위 현황판":
    st.subheader("🏆 실시간 1순위 현황판")
    df_w = get_hybrid_1st_bids()
    if not df_w.empty:
        event = st.dataframe(df_w[['1순위업체', '날짜', '공고명', '발주기관', '투찰금액', '투찰률']], use_container_width=True,
                             hide_index=True, selection_mode="single-row", on_select="rerun")
        if len(event.selection.rows) > 0:
            row = df_w.iloc[event.selection.rows[0]]
            st.markdown(f"#### ✅ [나노 분석] {row['공고명']}")
            st.code(f"공고번호: {row['공고번호']}")
    else:
        st.info("데이터를 불러오는 중입니다...")

elif menu == "📊 실시간 공고 (홈)":
    st.subheader("📊 실시간 입찰 공고")
    df_l = get_hybrid_live_bids()
    if not df_l.empty:
        if st.session_state['logged_in'] and st.session_state['user_license']:
            t1, t2 = st.tabs(["🌐 전체 공고", "✨ 내 면허 맞춤"])
            with t1:
                st.dataframe(df_l[['공고번호', '공고일자', '공고명', '발주기관', '예산금액']], use_container_width=True, hide_index=True)
            with t2:
                matched = df_l[df_l['공고명'].str.contains(st.session_state['user_license'][:2], na=False)]
                st.dataframe(matched, use_container_width=True, hide_index=True)
        else:
            st.dataframe(df_l[['공고번호', '공고일자', '공고명', '발주기관', '예산금액']], use_container_width=True, hide_index=True)

elif menu == "📁 K-건설 자료실":
    st.subheader("📁 K-건설 자료실")
    if st.session_state['logged_in']:
        with st.expander("✏️ 새 글 작성"):
            t, c = st.text_input("제목"), st.text_area("내용")
            if st.button("등록") and t and c:
                db.child("posts").push({"author": st.session_state['user_name'], "title": t, "content": c,
                                        "time": datetime.now(KST).strftime("%Y-%m-%d %H:%M")})
                st.toast("등록 완료!", icon="✅");
                st.rerun()
    posts = db.child("posts").get().val()
    if posts:
        for k, p in reversed(list(posts.items())):
            with st.expander(f"📢 {p['title']} (작성자: {p['author']})"):
                st.write(p['content'])
                if st.session_state['user_name'] in [p['author'], "명환"]:
                    if st.button("🗑️ 삭제", key=k): db.child("posts").child(k).remove(); st.rerun()

elif menu == "💬 K건설챗":
    st.subheader("💬 실시간 현장 소통")
    if not st.session_state['logged_in']:
        st.info("로그인 후 이용 가능합니다.")
    else:
        chat_box = st.container(height=400)
        chats = db.child("k_chat").limit_to_last(20).get().val()
        if chats:
            for v in chats.values(): chat_box.write(f"**{v['author']}**: {v['message']}")
        if msg := st.chat_input("메시지 입력"):
            db.child("k_chat").push(
                {"author": st.session_state['user_name'], "message": msg, "time": datetime.now(KST).strftime("%H:%M")})
            st.rerun()

elif menu == "👤 로그인 / 회원가입":
    t1, t2 = st.tabs(["🔑 로그인", "📝 회원가입"])
    with t1:
        le, lp = st.text_input("이메일"), st.text_input("비밀번호", type="password")
        if st.button("로그인"):
            login_success = False
            try:
                user = auth.sign_in_with_email_and_password(le, lp)
                info = db.child("users").child(user['localId']).get().val() or {}
                st.session_state.update(
                    {'logged_in': True, 'user_name': info.get('name', '소장님'), 'user_license': info.get('license', '')})
                login_success = True
            except:
                st.toast("로그인 실패! 정보를 확인해주세요.", icon="🚨")
            if login_success: st.toast(f"어서오세요 {st.session_state['user_name']} 소장님!", icon="✅"); st.rerun()
    with t2:
        re, rp, rn, rl = st.text_input("이메일 "), st.text_input("비번 "), st.text_input("이름 "), st.multiselect("면허",
                                                                                                           ALL_LICENSES)
        if st.button("가입"):
            try:
                u = auth.create_user_with_email_and_password(re, rp)
                db.child("users").child(u['localId']).set({"name": rn, "license": ", ".join(rl)})
                st.toast("가입 성공!", icon="✅")
            except:
                st.toast("가입 실패!", icon="❌")