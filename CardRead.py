"""从Mifare卡中读取文件，需要安装libnfc"""
import os

if os.system("nfc-mfclassic r a u out.dump"):
    os.system("pause")
    exit()
dumpFile = open(r"out.dump",'rb')

dumpFile.seek(0,2)
if dumpFile.tell() != 1024:
    print('err!')
    dumpFile.close()
    os.remove("out.dump")
    os.system("pause")
    exit()
dumpFile.seek(0)
data = bytes()
cardInfo = dumpFile.read(16)
fileInfo = dumpFile.read(16)

fileSize = int.from_bytes(fileInfo[:2],'big')
if fileSize==0:
    print('err!')
    dumpFile.close()
    os.remove("out.dump")
    os.system("pause")
    exit()
fileName = str(fileInfo[2:].strip(b'\x00'),encoding='utf-8')
print(fileSize,fileName)

data += dumpFile.read(16)
dumpFile.read(16)
for i in range(15):
    data += dumpFile.read(48)
    dumpFile.read(16)
    
outFile = open(fileName,'wb')
outFile.write(data[:fileSize])
outFile.close()
dumpFile.close()
os.remove("out.dump")
os.startfile(fileName)
os.system("pause")