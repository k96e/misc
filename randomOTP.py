import qrcode,sys
import pyotp
import time

def genQRCode(text):
    qr = qrcode.QRCode()
    qr.add_data(text)
    qr.print_ascii(out=sys.stdout)

def genURL(secret,name='',issuer=''):
    return pyotp.totp.TOTP(secret)\
        .provisioning_uri(name=name, issuer_name=issuer)
    
def writeToFile(text):
    with open('data/otp.txt', 'a') as f:
        f.write(f"{time.asctime(time.localtime(time.time()))} - {text}\n")

randKey = pyotp.random_base32()
genQRCode(genURL(randKey))
print(randKey)
writeToFile(randKey)