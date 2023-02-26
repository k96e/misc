"""
2023新课标高考适应性测试(四省联考)数学第12题的DFS解法
"""
from tqdm import tqdm
class SwitchArray():
    def __init__(self,ori=[False for _ in range(9)]):
        self.table = ori
        self.steps = 0
        self.TABINDEX=[[0,1,3],[0,1,2,4],[1,2,5],[0,3,4,6],[1,3,4,5,7],[2,4,5,8],[3,6,7],[4,6,7,8],[5,7,8]]
    def checkState(self,target=[i==0 for i in range(9)]):
        return self.table==target
    def press(self,dex):
        if dex>8:
            return
        for i in self.TABINDEX[dex]:
            self.table[i] = not self.table[i]
    def printtable(self):
        for i,v in enumerate(self.table):
            print('■' if v else '□',end='\n' if i in [2,5,8] else ' ')

n = 5
pbar = tqdm(total=9**n)
lst = [0] * n
results = []
while True:
    s = SwitchArray()
    for i in lst:
        s.press(i)
    if s.checkState():
        results.append(lst[:])
    pbar.update(1)
    i = n - 1
    while i >= 0 and lst[i] == 8:
        lst[i] = 0
        i -= 1
    if i < 0:
        break
    lst[i] += 1


for i in results:
    print(i)
print("共有{}种解法".format(len(results)))