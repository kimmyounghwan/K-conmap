import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import urllib3
import time
import streamlit as st

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
KST = timezone(timedelta(hours=9))


def fetch_monster_announcements():
    all_raw = []

    # 🚩 안전한 조달청 전용 무적 주소
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwkPPSSrch'

    # 30일치 날짜를 하루씩 쪼개기
    end_date = datetime.now(KST).date()
    start_date = end_date - timedelta(days=30)
    delta = end_date - start_date
    dates = [(start_date + timedelta(days=i)).strftime('%Y%m%d') for i in range(delta.days + 1)]

    # 🚨 [나노의 반성] 로봇 15명 전면 폐기!
    # 하루씩 순서대로 똑똑 두드리고, 조달청이 해킹으로 오해하지 않게 천천히 가져옵니다.
    for dt in dates:
        params = {
            'inqryDiv': '1',
            'inqryBgnDt': f'{dt}0000',
            'inqryEndDt': f'{dt}2359',
            'pageNo': '1',
            'numOfRows': '999',
            'bidNtceNm': '공사',
            'type': 'json',
            'serviceKey': API_KEY
        }

        try:
            # 15초 타임아웃, 예의 바르게 대기
            res = requests.get(url, params=params, verify=False, timeout=15)
            if res.status_code == 200:
                items = res.json().get('response', {}).get('body', {}).get('items', [])
                if items:
                    all_raw.extend(items)
        except Exception as e:
            # 에러가 나도 화면을 멈추지 않고, 엑스레이 기능에 이유만 남김
            st.session_state['debug_text'] = f"{dt} 통신 에러: {str(e)}"
            pass

        # 🚨 [가장 중요한 핵심] 0.5초 휴식. (보안 시스템에 걸리지 않기 위한 필수 장치)
        time.sleep(0.5)

    return pd.DataFrame(all_raw)