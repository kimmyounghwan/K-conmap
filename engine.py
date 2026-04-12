import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta, timezone
import urllib.parse
import urllib3
import streamlit as st

# 경고 무시 및 시간 설정
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
KST = timezone(timedelta(hours=9))
API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"


def fetch_via_crawling(days=7):
    """[방법 2] API가 안될 때 조달청 홈페이지 직접 크롤링"""
    all_bids = []
    end_date = datetime.now(KST).strftime('%Y/%m/%d')
    start_date = (datetime.now(KST) - timedelta(days=days)).strftime('%Y/%m/%d')

    url = "https://www.g2b.go.kr:8101/ep/tbid/tbidList.do"
    params = {
        "taskClCds": "3", "searchDtType": "1", "fromBidDt": start_date,
        "toBidDt": end_date, "regYn": "Y", "bidSearchType": "1", "searchType": "1"
    }

    try:
        encoded_params = urllib.parse.urlencode(params, encoding='euc-kr')
        res = requests.get(f"{url}?{encoded_params}", verify=False, timeout=15)
        soup = BeautifulSoup(res.content, 'html.parser')
        rows = soup.select('table.table_list tr')[1:]

        for row in rows:
            cols = row.select('td')
            if len(cols) >= 5:
                all_bids.append({
                    'bidNtceNo': cols[1].text.strip()[:11],
                    'bidNtceDt': cols[4].text.strip(),
                    'bidNtceNm': cols[2].text.strip(),
                    'ntceInsttNm': cols[3].text.strip(),
                    'bdgtAmt': "별도확인"
                })
    except Exception as e:
        print(f"크롤링 에러: {e}")

    return pd.DataFrame(all_bids)


@st.cache_data(ttl=600)
def get_final_data():
    """[메인] API 우선 시도, 실패 시 크롤링 가동"""
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'
    end_date = datetime.now(KST).date()
    start_date = end_date - timedelta(days=60)
    dates = [(start_date + timedelta(days=i)).strftime('%Y%m%d') for i in range((end_date - start_date).days + 1)]

    all_raw = []
    for dt in dates:
        params = {
            'inqryDiv': '1', 'inqryBgnDt': f'{dt}0000', 'inqryEndDt': f'{dt}2359',
            'pageNo': '1', 'numOfRows': '999', 'bidNtceNm': '공사',
            'type': 'json', 'serviceKey': API_KEY
        }
        try:
            res = requests.get(url, params=params, verify=False, timeout=5)
            if res.status_code == 200:
                items = res.json().get('response', {}).get('body', {}).get('items', [])
                if items: all_raw.extend(items)
        except:
            continue

    df = pd.DataFrame(all_raw)

    # API 결과가 없으면 크롤링 데이터 반환
    if df.empty:
        return fetch_via_crawling(days=7)

    return df