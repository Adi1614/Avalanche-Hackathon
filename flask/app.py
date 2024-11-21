import pymongo
from flask import Flask, jsonify, render_template, session, request, redirect, flash, url_for

app = Flask(__name__,
            template_folder="templates",
            static_folder="static",
            static_url_path='/')       # create app
app.secret_key = "team_SkillNotFoundError"

# creating client with connection string
client = pymongo.MongoClient(
    'mongodb+srv://Aditya:1234$@cluster0.rl4qm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
)

# connecting the database and collection
db = client['ScheduleGenerator']
user_collection = db['user']           # collection

uid = ''

@app.route('/test')
def test_con():
    data = user_collection.find_one()
    if data:
        return "yes"

    else:
        return "no"


@app.route('/')             # app.route creates endpoint for our app. It triggers the specific fucn under it
def index():
    return render_template('landing.html')


# @app.route('/login', methods=["GET", "POST"])
# def log_in():
#     if request.method == "GET":
#         return render_template('login.html')

#     elif request.method == "POST":
#         username = request.form.get('username')
#         password = request.form.get('password')
#         user = user_collection.find_one({"username": username})
#         if user and user['password'] == password:
#             return "Confirmed"

#         else:
#             return "not confirmed"
#     return


# @app.route('/signup', methods=['GET', 'POST'])
# def sign_up():
#     if request.method == "GET":
#         return render_template("signin.html", err_code=0)

#     elif request.method == "POST":
#         username = request.form.get('username')
#         password = request.form.get('password')

#         check = user_collection.find_one({"username": username})

#         if check is not None:
#             flash("User Exists", "error")
#             return redirect(url_for('sign_up'))

#         else:
#             user_collection.insert_one({"username": username, "password": password})
#             flash("Successfully Registered")
#             return redirect(url_for('log_in'))

#     return "err"


@app.route('/auth', methods=["GET", "POST"])
def user_auth():
    if request.method == "POST":
        form_type = request.form.get('form_type')

        if form_type == "signup":
            username = request.form.get('txt')
            email = request.form.get("email")
            usn = request.form.get('USN')
            password = request.form.get('pswd')

            check_email = user_collection.find_one({"email": email})
            check_usn = user_collection.find_one({"USN": usn})
            if check_email is not None or check_usn is not None:
                flash("User Exists", "error")
                return redirect(url_for('user_auth'))

            else:
                user_collection.insert_one({"username": username, 
                                            "password": password, 
                                            "email": email, "USN": usn})
                flash("Successfully Registered, Please Log in")
                return redirect(url_for('user_auth'))

        elif form_type == "login":
            email = request.form.get("email")
            password = request.form.get('pswd')

            check_email = user_collection.find_one({"email": email, 
                                                    "password": password})
            
            check_usn = user_collection.find_one({"USN": email, 
                                                  "password": password})
            
            
            
            if check_email is not None or check_usn is not None:
                global uid
                uid = check_email['_id'] if check_email is not None else check_usn['_id']
                print(uid)
                return redirect(url_for('home'))

            else:
                flash("Invalid Credentials", "error")
                return redirect(url_for('user_auth'))

    return render_template("user_auth.html")


@app.route('/home', methods=["GET"])
def home():
    return render_template("home.html")


@app.route('/save_data', methods=['POST'])
def save_data():
    '''
    SAMPLE INPUT FOR DATABASE

    {'courses': [{'id': 1732128661007, 'name': 'Maths'}, 
                 {'id': 1732128671238, 'name': 'Physics'}], 
    'assignments': [{'id': 1732128683939, 'courseId': 1732128661007, 'name': 'Pass1', 'deadline': '2024-11-21T18:51:00.000Z'},
                    {'id': 1732128701523, 'courseId': 1732128661007, 'name': 'Pass2', 'deadline': '2024-11-29T18:51:00.000Z'},
                    {'id': 1732128710957, 'courseId': 1732128671238, 'name': 'Mass1', 'deadline': '2024-11-24T18:51:00.000Z'}, 
                    {'id': 1732128718755, 'courseId': 1732128671238, 'name': 'Mass2', 'deadline': '2024-11-26T18:51:00.000Z'}], 
    'exams': [{'id': 1732128732259, 'courseId': 1732128661007, 'date': '2024-11-26T18:52:00.000Z'}, 
              {'id': 1732128741012, 'courseId': 1732128671238, 'date': '2024-11-28T18:52:00.000Z'}]}
    
    '''
    try:
        # Parse JSON data sent from the frontend
        global uid
        data = request.json
        print("UID is", uid)
        # print(data)
        # print(data.get('courses'))                      # [{'id': 1732128661007, 'name': 'Maths'}, {'id': 1732128671238, 'name': 'Physics'}] gives a list of dictionary. each element represents a course
        
        # Store the data in MongoDB
        db.courses.delete_many({})  # Clear existing data (optional)
        # db.courses.insert_one({uid: data.get('courses')})
        a = user_collection.find_one({"_id": uid})
        print(a)
        user_collection.update_one({"_id": uid}, 
                                      {"$set": {
                                          "courses": data.get('courses', []),
                                          "assignments": data.get('assignments', []),
                                          "exams": data.get('exams', [])
                                      }})
        
        db.assignments.delete_many({})
        # db.assignments.insert_one({uid: data.get('assignments')})
        
        db.exams.delete_many({})
        # db.exams.insert_one({uid: data.get('exams')})

        
        return jsonify({'success': True, 'message': 'Data saved successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/call', methods=["GET", 'POST'])
def calender():
    return render_template('callendar.html')

@app.route('/pomodoro')
def pomodoro():
    return render_template('timer.html')

@app.route('/dashboard')
def chart():
    return render_template('chart.html')

if __name__ == "__main__":
    app.run(debug=True)
