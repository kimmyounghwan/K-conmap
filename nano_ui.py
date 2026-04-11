import streamlit as st
import pandas as pd
from datetime import datetime, timedelta, timezone
import requests
import urllib3
import concurrent.futures
import time
import gspread

# 🚨 에러 무시 설정
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 🔑 조달청 열쇠 (사장님 키 그대로!)
API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
KST = timezone(timedelta(hours=9))

# ==========================================
# 🟢 1. 구글 시트 연결 (마스터 열쇠)
# ==========================================
@st.cache_resource
def init_gsheets():
    try:
        credentials = dict(st.secrets["gcp_service_account"])
        gc = gspread.service_account_from_dict(credentials)
        sheet = gc.open("k_map_db").sheet1
        return sheet
    except:
        return None

# ==========================================
# 🟢 2. 조달청 데이터 가져오기 (7일치로 가볍게!)
# ==========================================
@st.cache_data(ttl=600)
def fetch_monster_announcements():
    all_raw = []
    end_date = datetime.now(KST).date()
    start_date = end_date - timedelta(days=7) # 딱 1주일치만!
    dates = [(start_date + timedelta(days=i)).strftime('%Y%m%d') for i in range(8)]
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'

    def fetch_per_day(dt):
        params = {
            'inqryDiv': '1', 'inqryBgnDt': f'{dt}0000', 'inqryEndDt': f'{dt}2359',
            'pageNo': '1', 'numOfRows': '999', 'bidNtceNm': '공사', 'type': 'json', 'serviceKey': API_KEY
        }
        try:
            res = requests.get(url, params=params, verify=False, timeout=10)
            if res.status_code == 200:
                return res.json().get('response', {}).get('body', {}).get('items', [])
        except: return []
        return []

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(fetch_per_day, dates))
        for res in results:
            if res: all_raw.extend(res)
    return pd.DataFrame(all_raw)

# --- 이하 생략 (위 코드를 nano_ui.py에 붙여넣으시면 됩니다!) ---
st.title("🏛️ K-건설맵 실시간 공고")
if st.button("🔄 최신 데이터 갱신"):
    st.cache_data.clear()
    st.rerun()

df = fetch_monster_announcements()
st.dataframe(df)