''' 从jbsou.cn处获取歌曲信息并写入mp3文件'''

import requests
import mutagen
import mutagen.id3

def get_song_info(song_name,sfilter='name',stype='netease',page=1):
    """
    return: author, lrc, pic
    """
    url = 'https://www.jbsou.cn/'
    headers = {
        'Host': 'www.jbsou.cn',
        'Connection': 'keep-alive',
        'Content-Length': '41',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Origin': 'https://www.jbsou.cn',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)\
             AppleWebKit/58 (KHTML, like Gecko) Chrome/101 Safari/538',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://www.jbsou.cn/',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9',
    }
    data = {
        'input': song_name,
        'filter': sfilter,
        'type': stype,
        'page': page
    }
    r = requests.post(url, data=data,timeout=5,headers=headers)
    print(r.text)
    song_info = r.json()['data'][0]
    return song_info

def write_song_info(song_name, song_info):
    """
    song_info: author, lrc, pic
    """
    song = mutagen.File(song_name)
    song['artist'] = mutagen.id3.TextFrame(encoding=3, text=[song_info['author']])
    song['lyrics'] = mutagen.id3.TextFrame(encoding=3, text=[song_info['lrc']])
    song['APIC'] = mutagen.id3.APIC(
        encoding=3, mime='image/jpeg', type=3, desc='Cover',
        data=requests.get(song_info['pic'],timeout=5).content)
    song.save()

filename = input(">")
info = get_song_info(filename)
print(info)
write_song_info(filename, info)
