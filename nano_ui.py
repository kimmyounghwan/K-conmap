import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import urllib3
import streamlit as st
import concurrent.futures
import time

# --- [사장님 원본 설정 그대로] ---
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
KST = timezone(timedelta(hours=9))


@st.cache_data(ttl=600)
def fetch_monster_announcements():
    all_raw = []
    end_date = datetime.now(KST).date()
    # 🚨 [나노의 처방전] 60일은 너무 무거워요! 7일(1주일)로 가볍게 해서 서버 통과하기!
    start_date = end_date - timedelta(days=7)
    delta = end_date - start_date
    dates = [(start_date + timedelta(days=i)).strftime('%Y%m%d') for i in range(delta.days + 1)]

    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'

    def fetch_per_day(dt):
        params = {
            'inqryDiv': '1', 'inqryBgnDt': f'{dt}0000', 'inqryEndDt': f'{dt}2359',
            'pageNo': '1', 'numOfRows': '999', 'bidNtceNm': '공사',
            'type': 'json', 'serviceKey': API_KEY
        }
        for _ in range(3):  # 🚨 끈기 모드 3번 도전!
            try:
                res = requests.get(url, params=params, verify=False, timeout=10)
                if res.status_code == 200:
                    items = res.json().get('response', {}).get('body', {}).get('items', [])
                    return items if items else []
            except:
                time.sleep(0.5)
                continue
        return []

    with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
        results = list(executor.map(fetch_per_day, dates))
        for res in results:
            if res: all_raw.extend(res)
    return pd.DataFrame(all_raw)


# --- [사장님이 만드신 디자인 UI 그대로] ---
st.set_page_config(page_title="k_건설맵", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
    <style>
    .blue-bar { 
        background-color: #1e3a8a; color: white; border-radius: 8px; 
        font-weight: 900; font-size: 28px; text-align: center;
        padding: 35px 0 15px 0 !important; 
    }
    </style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown("### 🏛️ k_건설맵 메뉴")
    menu = st.radio("이동할 페이지를 선택하세요:", ["📊 실시간 공고 (홈)", "📝 자유 게시판", "👤 로그인 / 회원가입"])

if 'master_data' not in st.session_state:
    with st.spinner("조달청에서 1주일치 최신 공고를 싹 쓸어오는 중..."):
        st.session_state['master_data'] = fetch_monster_announcements()

if menu == "📊 실시간 공고 (홈)":
    st.markdown('<div class="blue-bar"><p>🏛️ k_건설맵 실시간 현황판</p></div>', unsafe_allow_html=True)
    df = st.session_state['master_data'].copy()
    if not df.empty:
        # 사장님 지시사항: 최신순 정렬!
        df['정렬용시간'] = pd.to_datetime(df['bidNtceDt'], errors='coerce')
        df = df.sort_values(by='정렬용시간', ascending=False, na_position='last').reset_index(drop=True)
        df['공고일자'] = df['정렬용시간'].dt.strftime('%Y-%m-%d')

        # 상단 지표
        today_str = datetime.now(KST).strftime('%Y-%m-%d')
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("최근 7일 공고", f"{len(df):,}건")
        if col4.button("🔄 최신 데이터 갱신", use_container_width=True):
            st.cache_data.clear()
            if 'master_data' in st.session_state: del st.session_state['master_data']
            st.rerun()

        st.dataframe(df[['bidNtceNo', '공고일자', 'bidNtceNm', 'ntceInsttNm']], use_container_width=True, height=750)
    else:
        st.warning("🚨 갱신 버튼을 눌러주세요.")