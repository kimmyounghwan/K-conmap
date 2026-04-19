import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import pyrebase
import urllib.parse
from datetime import datetime, timedelta, timezone

# ==========================================
# 🔑 1. 설정 및 보안 (명환 소장님 전용 세팅)
# ==========================================
KST = timezone(timedelta(hours=9))
G2B_API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
SAFE_API_KEY = urllib.parse.unquote(G2B_API_KEY)

# 파이어베이스 설정
firebaseConfig = {
    "apiKey": "AIzaSyB5uvAzUIbEDTTbxwflTQk3wdzOufc4SE0",
    "authDomain": "k-conmap.firebaseapp.com",
    "databaseURL": "https://k-conmap-default-rtdb.firebaseio.com",
    "projectId": "k-conmap",
    "storageBucket": "k-conmap.firebasestorage.app",
}
firebase = pyrebase.initialize_app(firebaseConfig)
db = firebase.database()

# 🚨 [중요] 배달부 신분증 세팅
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "kimmyounghwan259@gmail.com"  # 👈 명환이 발송용 지메일
SENDER_PW = "ofia lwps ulif mgom"  # 👈 16자리 마스터 키


# ==========================================
# 📡 2. 오늘자 신규 공고 가져오기 엔진
# ==========================================
def get_today_bids():
    now = datetime.now(KST)
    today_str = now.strftime('%Y%m%d')
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'
    params = {
        'serviceKey': SAFE_API_KEY, 'numOfRows': '500', 'pageNo': '1',
        'inqryDiv': '1', 'inqryBgnDt': today_str + '0000',
        'inqryEndDt': today_str + '2359', 'bidNtceNm': '공사', 'type': 'json'
    }
    try:
        res = requests.get(url, params=params, verify=False, timeout=15)
        return res.json().get('response', {}).get('body', {}).get('items', [])
    except:
        return []


# ==========================================
# 📧 3. 메일 발송 로직 (HTML 디자인)
# ==========================================
def send_premium_mail(user_email, user_name, matched_bids):
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = user_email
    msg['Subject'] = f"🔔 [K-건설맵] {user_name} 소장님, 오늘자 맞춤 입찰 리포트 도착!"

    html_content = f"""
    <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #1e3a8a; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">🏛️ K-건설맵 프리미엄 알림</h2>
            <p style="font-size: 14px; opacity: 0.9;">{user_name} 소장님만을 위한 오늘의 맞춤 공고입니다.</p>
        </div>
        <div style="padding: 20px;">
            <p>안녕하세요, <b>{user_name} 소장님!</b></p>
            <p>오늘 새롭게 등록된 공고 중 소장님의 면허와 딱 맞는 정보를 선별했습니다.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f8fafc; text-align: left;">
                        <th style="padding: 10px; border-bottom: 2px solid #1e3a8a;">공고명</th>
                        <th style="padding: 10px; border-bottom: 2px solid #1e3a8a; width: 100px;">예산액</th>
                    </tr>
                </thead>
                <tbody>
    """
    for bid in matched_bids:
        amt = f"{int(float(bid.get('bdgtAmt', 0))):,}원"
        html_content += f"""
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #eee;">
                            <a href="https://www.g2b.go.kr" style="text-decoration: none; color: #1e3a8a; font-weight: bold;">{bid.get('bidNtceNm')}</a><br>
                            <small style="color: #666;">{bid.get('ntceInsttNm')}</small>
                        </td>
                        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #e11d48; font-weight: bold;">{amt}</td>
                    </tr>
        """
    html_content += """
                </tbody>
            </table>
            <div style="margin-top: 30px; text-align: center;">
                <a href="https://k-conmap.streamlit.app" style="background-color: #1e3a8a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">상세 정보 확인하러 가기</a>
            </div>
        </div>
    </div>
    """
    msg.attach(MIMEText(html_content, 'html'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PW)
        server.sendmail(SENDER_EMAIL, user_email, msg.as_string())
        server.quit()
        return True
    except:
        return False


# ==========================================
# 🚀 4. 메인 실행 (유료 회원 선별 발송)
# ==========================================
if __name__ == "__main__":
    today_bids = get_today_bids()
    users = db.child("users").get().val()
    if users:
        for uid, info in users.items():
            user_email = info.get('email')
            user_name = info.get('name')
            user_lic = info.get('license', '')

            # [임시 테스트] 명환 소장님 네이버 메일은 무조건 발송!
            # 나중에 정식 오픈하면 info.get('is_paid') == True 조건만 넣으면 돼.
            if user_email == "a02280118@naver.com":
                keywords = ["공사", "토목", "건축", "전기"]  # 테스트용 넓은 키워드
                matched = [b for b in today_bids if any(k in b.get('bidNtceNm', '') for k in keywords)]
                if matched:
                    send_premium_mail(user_email, user_name, matched)
                    print(f"✅ {user_name} 소장님께 테스트 메일 발송 완료!")