import pymongo

client = pymongo.MongoClient(
    'mongodb+srv://Aditya:1234$@cluster0.rl4qm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
)

db = client['ScheduleGenerator']        #including database 

user = db['user']                       #including collection


user.insert_one({"username": "aditya", "password": "1234"})     #inserting details
# user.insert_one({"kon": "1234"})

dat = user.find()                       # getting all the details

key = "adi"

for i in dat:
    '''
    User Authentication
    '''
    if key in i.keys():
        a = input("pass:")
        if a == i[key]:
            print("ys")

        else:
            print("no")
