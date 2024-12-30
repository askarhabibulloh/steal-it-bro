import json
import math

wadah=[]
jumlahKarakter=0

#OK 1. loop setiap karakter dan hitung kemunculannya
def addOrCreate(symbol):
    global jumlahKarakter
    jumlahKarakter+=1
    ada = False
    index = 0
    for x in wadah:
        if x["symbol"] == symbol :
            ada = True
            count=x["count"]
            wadah.pop(index)
        index+=1
    if ada :
        count+=1
        wadah.append({"symbol":symbol,"count":count})
        return
    
    wadah.append({"symbol":symbol,"count":1})

# 2. hitung probabilitas (Pj) tiap karakter (kemunculan karakter/jumlah karakter)
def hitungProbabilitas():
    global wadah
    hasil = []
    for x in wadah:
        probabilitas=x["count"]/jumlahKarakter
        hasil.append({"symbol": x["symbol"], "probabilitas": round(probabilitas,3)})
    wadah = hasil

# 3. self info setiap karakter I(Xj) = log2 1/Pj
def hitungSelfInfo():
    global wadah
    hasil = []
    for x in wadah:
        selfInfo=math.log(1/x["probabilitas"],2)
        hasil.append({"selfInfo":round(selfInfo,3),"probabilitas":x["probabilitas"]})
    wadah=hasil

# 4. hj = Pj . I(Xj)
def hitunghj():
    global wadah
    hasil = []
    for x in wadah:
        hasil.append(round((x["selfInfo"] * x["probabilitas"]),3))
    wadah = hasil


# 5. loop sehingga H = sigma hj
def hitungEntropi():
    global wadah
    entropi  = 0
    for x in wadah:
        entropi+=x 
    return round(entropi,3)



#mulai dari sini
iniInput = input("Input : ")
for char in iniInput:
    addOrCreate(char)
y = json.dumps(wadah,indent=2)
print(y)
print("-------------------------------------------------------")
hitungProbabilitas()
y = json.dumps(wadah,indent=2)
print(y)
print("-------------------------------------------------------")
hitungSelfInfo()
y = json.dumps(wadah,indent=2)
print(y)
print("-------------------------------------------------------")
hitunghj()
print(wadah)
print("-------------------------------------------------------")
print(hitungEntropi())
print("-------------------------------------------------------")
print(jumlahKarakter)
