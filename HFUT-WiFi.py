import requests
import random
from urllib.parse import urlparse, parse_qs
 
def get_userinfo():
    return {"account": "***", "password": "***"}

def get_authinfo():
    baseurl = "http://210.45.240.252/?cmd=redirect&arubalp=12345"
    session = requests.Session()
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0"
    headers = {
        "User-Agent": user_agent,
        "Host": "210.45.240.252",
        "Connection": "keep-alive",
        "Referer": "http://210.45.240.252/",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"
    }

    response = session.get(url=baseurl,headers=headers)
    reurl = response.url
    parsed_url = urlparse(reurl)
    query_paramaters = parse_qs(parsed_url.query)
    swithchip = query_paramaters.get('switchip',[''])[0]
    mac = query_paramaters.get('mac',[''])[0]
    ip = query_paramaters.get('ip',[''])[0]
    return {'switchip': swithchip, 'mac': mac, 'ip': ip, 'url': reurl}

def auth():
    session = requests.Session()
    v = random.randint(500,10500)
    user = get_userinfo()
    info = get_authinfo()
    print(info)
    url = f"http://210.45.240.105:801/eportal/?c=Portal&a=login&callback=dr1003&login_method=8&user_account={user['account']}&user_password={user['password']}&wlan_user_ip={info['ip']}&wlan_user_ipv6=&wlan_user_mac={info['mac'].replace(':','')}&wlan_ac_ip={info['switchip']}&wlan_ac_name=&jsVersion=3.3.2&v={str(v)}"
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0"
    headers = {
        "User_Agent": user_agent,
        "Host": "210.45.240.105:801",
        "Refer": "http://210.45.240.105/",
        "Connection": "keep-alive"
    }
    response = session.get(url=url,headers=headers)
    print(url)
    print(response.text)

auth()