"""爬取哔哩哔哩番剧短评"""

import requests
from tqdm import tqdm

md = input("待爬取番剧的MediaID: ")

url = "https://api.bilibili.com/pgc/review/short/list?media_id="+md+"&ps=30&sort=0"
cursor = 1
count = 1
scores = [0,0,0,0,0,0]
total = 0
now = 0

contents = [[],[],[],[],[],[]]

r = requests.get(url,timeout=3).json()
for p in r['data']['list']:
    scores[p['score']//2] += 1
    contents[p['score']//2].append([p['author']['uname'],p['content']])
cursor = r['data']['next']
total = r['data']['total']
now += len(r['data']['list'])

pbar = tqdm(total=int(total))

while not cursor == 0:
    try:
        count += 1
        r = requests.get(url+"&cursor="+str(cursor),timeout=3).json()
        for p in r['data']['list']:
            scores[p['score']//2] += 1
            contents[p['score']//2].append([p['author']['uname'],p['content']])
        cursor = r['data']['next']
        pbar.update(len(r['data']['list']))
    except Exception as e:
        pass

pbar.close()
print(scores[1:])
with open("t.txt",'w',encoding='utf-8') as f:
    f.write(str(scores[1:])+'\n')
    f.write("-----------------\nOne Star\n")
    for a in contents[1]:
        f.write(a[0]+": 【"+a[1]+"】\n")
    f.write("-----------------\nTwo Stars\n")
    for a in contents[2]:
        f.write(a[0]+": 【"+a[1]+"】\n")
    f.write("-----------------\nThree Stars\n")
    for a in contents[3]:
        f.write(a[0]+": 【"+a[1]+"】\n")
    f.write("-----------------\nFour Stars\n")
    for a in contents[4]:
        f.write(a[0]+": 【"+a[1]+"】\n")
