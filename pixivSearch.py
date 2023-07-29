import pixivpy3
import time,random,tqdm
import json

keyword = "聖園ミカ"

api = pixivpy3.AppPixivAPI()
api.auth(refresh_token="*****")

def randSleep(base=0.1, rand=0.5):
    time.sleep(base + rand * random.random())

json_result = api.search_illust(keyword, search_target='partial_match_for_tags')
results = []
for illust in json_result.illusts:
    results.append({"title": illust.title, "id": illust.id, "score": illust.total_bookmarks/illust.total_view,
                    "R":True if any(t.name=="R-18" for t in illust.tags) else False})

while True:
    try:
        next_qs = api.parse_qs(json_result.next_url)
        json_result = api.search_illust(**next_qs)
        for illust in json_result.illusts:
            results.append({"title": illust.title, "id": illust.id, "score": illust.total_bookmarks/illust.total_view,
               "R":True if any(t.name=="R-18" for t in illust.tags) else False})
        results.sort(key=lambda x: x["score"], reverse=True)
        print(f"{results[0]} len: {len(results)}")
        randSleep(0.1)
        with open(f"{keyword}.json", "w", encoding="utf-8") as f:
            for line in results:
                f.write(json.dumps(line, ensure_ascii=False))
                f.write("\n")
    except Exception as e:
        print(e)
        break