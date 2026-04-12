import requests
import pandas as pd
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, timezone
import urllib3
import urllib.parse
import time
import concurrent.futures

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
KST = timezone(timedelta(hours=9))


# --- [전략 1: API 뒷문 수집] ---
def fetch_via_api(days=30):
    all_raw = []
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'
    end_date = datetime.now(KST).date()
    start_date = end_date - timedelta(days=days)
    dates = [(start_date + timedelta(days=i)).strftime('%Y%m%d') for i in range((end_date - start_date).days + 1)]

    def fetch_day(dt):
        params = {'inqryDiv': '1', 'inqryBgnDt': f'{dt}0000', 'inqryEndDt': f'{dt}2359', 'pageNo': '1',
                  'numOfRows': '999', 'bidNtceNm': '공사', 'type': 'json', 'serviceKey': API_KEY}
        try:
            res = requests.get(url, params=params, verify=False, timeout=10)
            if res.status_code == 200:
                return res.json().get('response', {}).get('body', {}).get('items', [])
        except:
            pass
        return []

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(fetch_day, dates))
        for res in results: all_raw.extend(res)

    return pd.DataFrame(all_raw)


# --- [전략 2: 크롤링 앞문 수집] ---
def fetch_via_crawling():
    all_bids = []
    today = datetime.now(KST).strftime('%Y/%m/%d')
    start_date = (datetime.now(KST) - timedelta(days=7)).strftime('%Y/%m/%d')
    url = "https://www.g2b.go.kr:8101/ep/tbid/tbidList.do"

    # 조달청 홈페이지 검색 파라미터
    params = {
        "taskClCds": "3", "searchDtType": "1", "fromBidDt": start_date,
        "toBidDt": today, "regYn": "Y", "bidSearchType": "1", "searchType": "1"
    }

    try:
        encoded_params = urllib.parse.urlencode(params, encoding='euc-kr')
        res = requests.get(f"{url}?{encoded_params}", verify=False, timeout=15)
        soup = BeautifulSoup(res.content, 'html.parser')
        rows = soup.select('table.table_list tr')[1:]  # 헤더 제외

        for row in rows:
            cols = row.select('td')
            if len(cols) >= 5:
                # API 데이터와 형식을 맞춤
                all_bids.append({
                    'bidNtceNo': cols[1].text.strip()[:11],
                    'bidNtceOrd': cols[1].text.strip()[12:],
                    'bidNtceDt': cols[4].text.strip(),
                    'bidNtceNm': cols[2].text.strip(),
                    'ntceInsttNm': cols[3].text.strip(),
                    'bdgtAmt': "0",  # 크롤링은 예산금액이 바로 안 보여서 0 처리
                    'bidNtceDtlUrl': cols[2].find('a')['href'] if cols[2].find('a') else ""
                })
    except:
        pass
    return pd.DataFrame(all_bids)


# --- [하이브리드 통합 실행] ---
def fetch_monster_announcements():
    # 1. 먼저 API(뒷문) 시도
    df = fetch_via_api(days=15)

    # 2. API가 텅 비었으면 크롤링(앞문) 실행!
    if df.empty:
        df = fetch_via_crawling()

    return df