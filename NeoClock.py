import tkinter as tk
import tkinter.messagebox
from urllib import request
import json
import time
import traceback
import math

dat = ["英生语数|理化自自|理生", "语英生阅|数数理化|英化", "理语数体|英英化生|语生", "英理数数|化生语语|数化", "生语数英|体化理理|语理", "英语数数|化生理理|考试", "考试|英数"]


link = "http://www.nmc.cn/rest/real/58436"
wdayList = ["周一","周二","周三","周四","周五","周六","周日"]


def handleTraceback(errStr):
    global root
    if "SystemExit: 0" in errStr:
        return
    tkinter.messagebox.showerror('This is a bug, not feature.',errStr)
    root.quit()
    exit(0)

def getSche():
    wday = time.localtime(time.time()).tm_wday
    if time.localtime(time.time()).tm_hour >= 21:
        wday = wday+1 if not wday == 6 else 0
        schData = dat[wday]
        return "明天"+wdayList[wday]+" "+schData
    else:
        schData = dat[wday]
        return wdayList[wday]+"  "+schData

def getCountdown():
    delta = math.ceil((1686067200-time.time())/86400)
    if delta >= 0:
        return "距2023高考还有 %d 天" % delta
    else:
        return ""


def updateWeather():
    global weatherLabel
    for i in range(3):
        try:
            req = request.Request(link)
            with request.urlopen(req,timeout=0.6) as f:
                resp = json.loads(f.read().decode('utf-8'))['weather']
            weatherLabel.config(text=resp['info']+' '+"%.1fK "%(resp['temperature']+273.2))
            return
        except:
            time.sleep(0.4)

def setTime():
    global t,root,countdownLabel
    try:
        ctime = time.localtime(time.time())
        t.config(text=time.strftime('%H:%M:%S',ctime))
        if (ctime.tm_min%10 == 0 and ctime.tm_sec == 0):
            timedWork()
            countdownLabel.config(text=getCountdown())
            if (ctime.tm_hour == 21 and (ctime.tm_min == 10 or ctime.tm_min == 20) and ctime.tm_sec == 0):
                timedWork(False)
            if (ctime.tm_hour == 0 and ctime.tm_min == 0 and ctime.tm_sec == 0):
                timedWork(False)
        #root.after(int((1-time.time()+int(time.time()))*1000-100), setTime)
        root.after(1000, setTime)
    except:
        handleTraceback(traceback.format_exc())

def timedWork(autoUpdate=True):
    global scheText,dateLabel,weatherLabel,scheLable
    if autoUpdate:
        updateWeather()
    else:
        scheLable.config(text=getSche())
        dateLabel.config(text=time.strftime(' %m{m}%d{d}',
            time.localtime(time.time())).format(m='月',d='日'))
 
def quitWin(events):
    global root
    if tk.messagebox.askyesno("info","是否关闭？"):
        root.quit()
        exit(0)

try:
    root = tk.Tk("NeoClock")
    root.overrideredirect(True)
    width = root.winfo_screenwidth()
    height = root.winfo_screenheight()
    defaultPos = "+"+str(width-515)+"+15"
    root.geometry(defaultPos)
    root.geometry("500x290")
    root['background']='black'
    headFrame = tk.Frame(
        bg='black')
    headFrame.pack(fill='x')
    dateLabel = tk.Label(headFrame, 
        text=time.strftime(' %m{m}%d{d}',
            time.localtime(time.time())).format(m='月',d='日'),
        fg='white',
        bg='black',
        font=('Yahei Consolas Hybrid', 20)
        )
    dateLabel.pack(side='left',anchor='w')
    weatherLabel = tk.Label(headFrame, 
        text="",
        fg='white',
        bg='black',
        font=('Yahei Consolas Hybrid', 20)
        )
    weatherLabel.pack(side='right',anchor='e')
    t = tk.Label(root, 
        text='--:--:--',
        fg='white',
        bg='black',
        font=('Yahei Consolas Hybrid', 80)
        )
    t.pack()
    countdownLabel = tk.Label(root,
        text=getCountdown(),
        fg='white',     
        bg='black',
        font=('Yahei Consolas Hybrid', 28),
        )
    countdownLabel.pack()
    scheLable = tk.Label(root,
        text=getSche(),
        fg='white',     
        bg='black',
        font=('Yahei Consolas Hybrid', 20),
        )
    scheLable.pack()
    time.sleep(1)
    updateWeather()
    setTime()
    root.bind("<Double-Button-1>",quitWin)
    root.lower()
    root.mainloop()
except:
    handleTraceback(traceback.format_exc())
