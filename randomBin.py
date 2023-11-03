"""随机生成指定大小的Binary文件"""
import os

fileName = input('>')
size = float(input('Size(MB): '))

with open(fileName,'wb') as f:
    f.write(os.urandom(int(size*1024*1024)))