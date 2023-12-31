import requests
import time
import os
from lxml import html
from urllib.parse import unquote

CategoryURL = "https://bluearchive.wiki/wiki/Category:Eleph"
ItemURL = "https://bluearchive.wiki"
index = {}

def getIdFromName(name):
    r = requests.get(ItemURL+name)
    a_ele = html.fromstring(r.text).xpath('//a[@class="mw-file-description"]')[0]
    return a_ele.get('href')
    
def loadIndex():
    with open("CharIDs.txt",'r',encoding='utf-8') as f:
        for line in f.readlines():
            index[line.split('\t')[0]] = line.split('\t')[1].strip()
    
def updateIndex():
    text = requests.get(CategoryURL).text
    tree = html.fromstring(text)
    a_elements = tree.xpath('//ul//a')
    hrefs = [a.get('href') for a in a_elements]
    with open("CharIDs.txt",'a',encoding='utf-8') as f:
        for href in hrefs:
            if href.startswith("/wiki/Items/") and index.get(unquote(href).replace("/wiki/Items/",'').replace("_Eleph",'')) == None:
                print(href)
                try:
                    f.write(unquote(href).replace("/wiki/Items/",'').replace("_Eleph",'')+'\t'+
                        getIdFromName(href).replace("/wiki/File:Item_Icon_SecretStone_",'').replace(".png",'')+'\n')
                except Exception as e:
                    print(e)

def checkUpdate():
    if not os.path.exists("CharIDs.txt"):
        return 999
    mtime = os.path.getmtime("CharIDs.txt")
    return (time.time() - mtime) / 86400

def searchId(keyword):
    results = []
    for name in index.keys():
        if keyword.lower() in name.lower():
            results.append([name,index[name]])
    return results

def searchIdUi():
    if not os.path.exists("CharIDs.txt"):
        updateIndex()
    else:
        print(f"CharID index is {checkUpdate()} days old, update now?(y/n) ",end="")
        if input() == "y":
            updateIndex()
    keyword = input(">>")
    ids = searchId(keyword)
    if len(ids) == 0:
        print("No result")
        exit(1)
    elif len(ids) == 1:
        print(f"Found {ids[0][0]} with id {ids[0][1]}")
        id = ids[0][1]
    else:
        print("Found multiple results:")
        for i in enumerate(ids):
            print(f"{i[0]}: {i[1][0]} with id {i[1][1]}")
        index = input(">>>>")
        try:
            id = ids[int(index)][1]
        except:
            print("Invalid input")
            exit(1)

loadIndex()
searchIdUi()