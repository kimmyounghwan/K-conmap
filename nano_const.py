import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import urllib3
import streamlit as st

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
KST = timezone(timedelta(hours=9))


def fetch_monster_announcements():
    # 🚩 명환이의 백업 원본: 조달청 전용 무적 주소
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwkPPSSrch'

    # 1. 날짜 범위 (안전하게 30일치만 가져오기)
    end_dt = datetime.now(KST).strftime('%Y%m%d2359')
    start_dt = (datetime.now(KST) - timedelta(days=30)).strftime('%Y%m%d0000')

    # 2. 파라미터
    params = {
        'inqryDiv': '1',
        'inqryBgnDt': start_dt,
        'inqryEndDt': end_dt,
        'pageNo': '1',
        'numOfRows': '500',
        'bidNtceNm': '공사',
        'type': 'json',
        'serviceKey': API_KEY
    }

    try:
        # 🚨 [나노의 핵심 조치] 타임아웃 100초! 조달청이 늦게 찾아와도 절대 안 끊고 끝까지 기다림!
        res = requests.get(url, params=params, verify=False, timeout=100)

        # 명환이가 원문 확인할 수 있게 세션에 저장
        st.session_state['debug_text'] = res.text

        if res.status_code == 200:
            data = res.json()
            items = data.get('response', {}).get('body', {}).get('items', [])
            return pd.DataFrame(items) if items else pd.DataFrame()
    except Exception as e:
        # 에러가 나면 에러 내용까지 투명하게 저장
        st.session_state['debug_text'] = f"통신 에러: {str(e)}"

    return pd.DataFrame()