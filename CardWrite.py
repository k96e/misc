"""向Mifare卡中写入文件，需要安装libnfc"""
import os,sys

if len(sys.argv) == 2:
    fileName = sys.argv[1]
else:
    fileName = input("File name: ")
fileName = fileName.replace('"','')
inputFile = open(fileName,'rb')
fileName = fileName.split('/')[-1]
fileName = fileName.split('\\')[-1]
inputFile.seek(0,2)
inputSize = inputFile.tell()
if inputSize > 736:
    print('err!')
    inputFile.close()
    os.system("pause")
    exit(0)
inputFile.seek(0)

def readRaw(file,length):
    res = file.read(length)
    if len(res) < length:
        res += (bytes.fromhex('00')*(length-len(res)))
    return res

dumpFile = open('out.dump','wb')
dumpFile.write(bytes.fromhex("839111BAB90804006263646566676869"))
dumpFile.write(inputSize.to_bytes(2,'big'))
nameBytes = bytes(fileName,encoding='utf-8')
if len(nameBytes) > 14:
    nameBytes = bytes('o.'+fileName.split('.')[-1],encoding='utf-8')
    if len(nameBytes) > 14:
        nameBytes = bytes('out',encoding='utf-8')
dumpFile.write(nameBytes)
dumpFile.write(bytes.fromhex('00')*(14-len(nameBytes)))
dumpFile.write(readRaw(inputFile,16))
dumpFile.write(bytes.fromhex("FFFFFFFFFFFFFF078069000000000000"))
for i in range(15):  
    dumpFile.write(readRaw(inputFile,48))
    dumpFile.write(bytes.fromhex("FFFFFFFFFFFFFF078069000000000000"))
dumpFile.close()

os.system("nfc-mfclassic w a u out.dump")
os.remove("out.dump")
os.system("pause")