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
# 3. 상수 및 매칭 키워드 로직
# ==========================================
REGION_LIST = ["전국(전체)", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남",
               "제주"]
ALL_LICENSES = ["[종합] 건축공사업", "[종합] 토목공사업", "[종합] 토목건축공사업", "[종합] 조경공사업", "[전문] 지반조성·포장공사업", "[전문] 실내건축공사업",
                "[전문] 철근·콘크리트공사업", "[기타] 전기공사업", "[기타] 정보통신공사업", "[기타] 소방시설공사업"]


def get_match_keywords(license_str):
    k = []
    if "토목" in license_str: k.extend(["토목", "도로", "포장", "하천", "교량", "단지 조성"])
    if "건축" in license_str: k.extend(["건축", "신축", "증축", "보수", "인테리어"])
    if "조경" in license_str: k.extend(["조경", "식재", "공원", "숲"])
    if "전기" in license_str: k.extend(["전기", "가로등", "배전"])
    if "통신" in license_str: k.extend(["통신", "네트워크", "CCTV"])
    if "소방" in license_str: k.extend(["소방", "화재"])
    if "지반" in license_str or "포장" in license_str: k.extend(["포장", "아스팔트", "보도블럭"])
    if "철근" in license_str or "콘크리트" in license_str: k.extend(["철콘", "구조물", "옹벽"])
    return list(set(k))


# ==========================================
# 4. 데이터 엔진 (Index 에러 우회 적용)
# ==========================================
def get_stats():
    try:
        t_v = db.child("stats").child("total_visits").get().val() or 1828
        u_v = db.child("users").get().val()
        return t_v, len(u_v) if u_v else 0
    except:
        return 1828, 0


@st.cache_data(ttl=180, show_spinner=False)
def get_hybrid_1st_bids():
    now = datetime.now(KST)
    s_dt = (now - timedelta(days=2)).strftime('%Y%m%d')
    url = 'http://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoCnstwk'
    try:
        params = {'serviceKey': SAFE_API_KEY, 'numOfRows': '999', 'pageNo': '1', 'inqryDiv': '1',
                  'inqryBgnDt': s_dt + '0000', 'type': 'json'}
        res = requests.get(url, params=params, verify=False, timeout=20)
        api_items = res.json().get('response', {}).get('body', {}).get('items', []) if res.status_code == 200 else []
    except:
        api_items = []

    # [수정] Index 에러 방지를 위해 order_by_key() 사용
    db_data = db.child("archive_1st").order_by_key().limit_to_last(300).get().val() or {}
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
                           timeout=15)
        api_items = res.json().get('response', {}).get('body', {}).get('items', []) if res.status_code == 200 else []
    except:
        api_items = []

    db_data = db.child("archive_live").order_by_key().limit_to_last(300).get().val() or {}
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
t_visit, t_user = get_stats()
st.markdown('<div class="main-title">🏛️ K-건설맵</div>', unsafe_allow_html=True)

# 상단 통계 카드
c1, c2, c3, c4 = st.columns(4)
with c1: st.markdown(
    f'<div class="stat-card">📅 오늘 날짜<br><span class="stat-val">{datetime.now(KST).strftime("%Y-%m-%d")}</span></div>',
    unsafe_allow_html=True)
with c2: st.markdown(f'<div class="stat-card">📈 누적 방문<br><span class="stat-val">{t_visit:,}명</span></div>',
                     unsafe_allow_html=True)
with c3: st.markdown(f'<div class="stat-card">👥 전체 회원수<br><span class="stat-val">{t_user:,}명</span></div>',
                     unsafe_allow_html=True)
with c4: st.markdown(
    f'<div class="stat-card">🔔 가동 상태<br><span class="stat-val" style="color:green;">정상 가동 중</span></div>',
    unsafe_allow_html=True)

with st.sidebar:
    st.write(f"### 👷 {'👋 ' + st.session_state['user_name'] + ' 소장님' if st.session_state['logged_in'] else 'K-건설맵 메뉴'}")
    menu = st.radio("업무 선택", ["🏆 1순위 현황판", "📊 실시간 공고 (홈)", "📁 K-건설 자료실", "💬 K건설챗", "👤 로그인 / 회원가입"])
    if st.button("🔄 만능 데이터 새로고침"): st.cache_data.clear(); st.rerun()
    if st.session_state['logged_in'] and st.button("🚪 로그아웃"): st.session_state['logged_in'] = False; st.rerun()

# --- 메뉴별 화면 구성 ---

if menu == "🏆 1순위 현황판":
    st.subheader("🏆 실시간 1순위 현황판")
    df_w = get_hybrid_1st_bids()
    if not df_w.empty:
        event = st.dataframe(df_w[['1순위업체', '날짜', '공고명', '발주기관', '투찰금액', '투찰률']], use_container_width=True,
                             hide_index=True, selection_mode="single-row", on_select="rerun")
        if len(event.selection.rows) > 0:
            row = df_w.iloc[event.selection.rows[0]]
            st.info(f"선택된 공고: {row['공고명']} (번호: {row['공고번호']})")
    else:
        st.warning("데이터를 불러오는 중입니다.")

elif menu == "📊 실시간 공고 (홈)":
    st.subheader("📊 실시간 입찰 공고")
    df_l = get_hybrid_live_bids()
    if not df_l.empty:
        if st.session_state['logged_in'] and st.session_state['user_license']:
            t1, t2 = st.tabs(["🌐 전체 공고", "✨ 내 면허 맞춤매칭"])
            with t1:
                st.dataframe(df_l[['공고번호', '공고일자', '공고명', '발주기관', '예산금액']], use_container_width=True, hide_index=True,
                             height=600)
            with t2:
                kw = get_match_keywords(st.session_state['user_license'])
                matched = df_l[df_l['공고명'].str.contains('|'.join(kw), na=False)] if kw else df_l
                st.dataframe(matched[['공고번호', '공고일자', '공고명', '발주기관', '예산금액']], use_container_width=True,
                             hide_index=True, height=600)
        else:
            st.dataframe(df_l[['공고번호', '공고일자', '공고명', '발주기관', '예산금액']], use_container_width=True, hide_index=True,
                         height=600)

elif menu == "📁 K-건설 자료실":
    st.subheader("📁 K-건설 자료실")
    if st.session_state['logged_in']:
        with st.expander("✏️ 새 자료 공유하기"):
            t, c = st.text_input("제목"), st.text_area("내용")
            if st.button("등록") and t and c:
                db.child("posts").push({"author": st.session_state['user_name'], "title": t, "content": c,
                                        "time": datetime.now(KST).strftime("%Y-%m-%d %H:%M")})
                st.toast("자료가 등록되었습니다!", icon="✅");
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
        st.info("로그인 후 소장님들과 대화를 나눠보세요!")
    else:
        chat_box = st.container(height=450)
        try:
            # Index 에러 방지를 위해 단순 호출
            chats_data = db.child("k_chat").get().val()
            if chats_data:
                chat_list = list(chats_data.values())[-30:]  # 최신 30개만
                for v in chat_list: chat_box.write(f"**{v['author']}**: {v['message']}")
        except:
            chat_box.info("대화를 불러오는 중입니다.")

        if msg := st.chat_input("메시지를 입력하세요"):
            db.child("k_chat").push(
                {"author": st.session_state['user_name'], "message": msg, "time": datetime.now(KST).strftime("%H:%M")})
            st.rerun()

elif menu == "👤 로그인 / 회원가입":
    st.subheader("👤 회원 정보 관리")
    t1, t2 = st.tabs(["🔑 로그인", "📝 회원가입"])
    with t1:
        le, lp = st.text_input("이메일"), st.text_input("비밀번호", type="password")
        if st.button("로그인"):
            login_success = False
            try:
                user = auth.sign_in_with_email_and_password(le.strip(), lp)
                info = db.child("users").child(user['localId']).get().val() or {}
                st.session_state.update(
                    {'logged_in': True, 'user_name': info.get('name', '소장님'), 'user_license': info.get('license', '')})
                login_success = True
            except:
                st.toast("이메일 또는 비밀번호를 확인해주세요.", icon="🚨")
            if login_success: st.rerun()
    with t2:
        re, rp, rn, rl = st.text_input("가입용 이메일"), st.text_input("비번 (6자 이상)", type="password"), st.text_input(
            "성함"), st.multiselect("보유 면허", ALL_LICENSES)
        if st.button("가입하기"):
            try:
                u = auth.create_user_with_email_and_password(re.strip(), rp)
                db.child("users").child(u['localId']).set({"name": rn, "license": ", ".join(rl), "email": re.strip()})
                st.success("🎉 가입 성공! 로그인 탭에서 접속해주세요.")
            except:
                st.error("가입 실패! 형식을 확인하거나 이미 있는 이메일인지 확인하세요.")