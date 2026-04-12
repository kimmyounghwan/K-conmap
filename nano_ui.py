import streamlit as st
import pandas as pd
from engine import get_final_data

st.set_page_config(page_title="나노 건설맵 V1.0", layout="wide")

st.title("🏗️ 나노 건설맵 공고 대시보드")
st.write("조달청 실시간 공고 데이터를 수집하여 보여줍니다.")

if st.button('🔄 데이터 새로고침'):
    st.cache_data.clear()
    st.rerun()

# 데이터 로드
with st.spinner('조달청 데이터를 불러오는 중입니다...'):
    data = get_final_data()

if not data.empty:
    # 필터: 공고명 검색
    search_query = st.text_input("🔍 공고명 검색 (예: 도로, 하천, 순천)")

    if search_query:
        # 공고명 컬럼 이름이 API와 크롤링이 다를 수 있어 보정
        name_col = 'bidNtceNm' if 'bidNtceNm' in data.columns else '공고명'
        data = data[data[name_col].str.contains(search_query, na=False)]

    st.write(f"총 **{len(data)}**건의 공고를 찾았습니다.")
    st.dataframe(data, use_container_width=True)
else:
    st.warning("수집된 공고가 없습니다. 잠시 후 다시 시도해주세요.")