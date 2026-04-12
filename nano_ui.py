import streamlit as st
import pandas as pd
from datetime import datetime, timedelta, timezone
import nano_const

st.set_page_config(page_title="k_건설맵", layout="wide", initial_sidebar_state="expanded")

# 디자인 설정 (명환이 전용 파란색 바)
st.markdown("""
    <style>
    .blue-bar { background-color: #1e3a8a; color: white; border-radius: 8px; margin-bottom: 15px; font-weight: 900; font-size: 28px; text-align: center; padding: 35px 15px 15px 15px !important; }
    </style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown("### 🏛️ k_건설맵 메뉴")
    menu = st.radio("이동할 페이지를 선택하세요:", ["📊 실시간 공고 (홈)", "📝 자유 게시판", "👤 로그인"])
    if st.button("🔄 최신 데이터 강력 갱신"):
        st.cache_data.clear()
        if 'master_data' in st.session_state: del st.session_state['master_data']
        st.rerun()

if menu == "📊 실시간 공고 (홈)":
    st.markdown('<div class="blue-bar">🏛️ k_건설맵 하이브리드 현황판</div>', unsafe_allow_html=True)

    if 'master_data' not in st.session_state:
        with st.spinner("조달청 앞문과 뒷문을 모두 확인하는 중입니다..."):
            st.session_state['master_data'] = nano_const.fetch_monster_announcements()

    df = st.session_state['master_data'].copy()

    if not df.empty:
        # 데이터 정리 및 정렬
        df['정렬용'] = pd.to_datetime(df['bidNtceDt'], errors='coerce')
        df = df.sort_values(by='정렬용', ascending=False).reset_index(drop=True)

        # 표 출력
        st.dataframe(
            df[['bidNtceNo', 'bidNtceDt', 'bidNtceNm', 'ntceInsttNm', 'bdgtAmt']],
            use_container_width=True, height=700, hide_index=True,
            column_config={
                "bidNtceNo": "공고번호", "bidNtceDt": "공고일시",
                "bidNtceNm": "공고명", "ntceInsttNm": "발주기관",
                "bdgtAmt": st.column_config.NumberColumn("예산금액", format="%,d")
            }
        )
    else:
        st.error("🚨 조달청 서버(앞문/뒷문)가 모두 응답하지 않습니다. 잠시 후 갱신 버튼을 눌러주세요.")