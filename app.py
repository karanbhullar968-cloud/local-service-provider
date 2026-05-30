import os
from flask import Flask, request, jsonify, session, render_template
import firebase_admin
from firebase_admin import credentials, firestore
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)

app.secret_key = 'secret123'

UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# CREATE uploads FOLDER IF NOT EXISTS
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# FIREBASE CONFIG

cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# HOME PAGE
@app.route('/')
def home():
    return render_template('index.html')


# SIGNUP
@app.route('/signup', methods=['POST'])
def signup():

    data = request.json
    try:

        db.collection('users').add({

            'name': data['name'],
            'email': data['email'],
            'password': generate_password_hash(data['password']),
            'user_type': data['user_type']

        })

        return jsonify({
            'message': 'Signup successful'
        })

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 400




# LOGIN
@app.route('/login', methods=['POST'])
def login():

    data = request.json

    users = db.collection('users') \
        .where('email', '==', data['email']) \
        .stream()

    user = None

    for doc in users:

        user = doc.to_dict()

        user['id'] = doc.id


    if user and check_password_hash(user['password'], data['password']):

        session['user_id'] = user['id']
        session['user_type'] = user['user_type']

        return jsonify({
            'message': 'Login success',
            'user_type': user['user_type']
        })

    return jsonify({
        'message': 'Invalid credentials'
    }), 401


# LOGOUT
@app.route('/logout', methods=['POST'])
def logout():

    session.clear()

    return jsonify({
        'message': 'Logged out successfully'
    })


# REGISTER PROVIDER
@app.route('/register', methods=['POST'])
def register_provider():

    if 'user_id' not in session:
        return jsonify({
            'error': 'Login required'
        }), 403

    try:

        image = request.files.get('image')
        image_filename = ''

        if image:

            filename = secure_filename(image.filename)

            image.save(
                os.path.join(
                    app.config['UPLOAD_FOLDER'],
                    filename
                )
            )

            image_filename = filename

        db.collection('providers').add({

            'user_id': session['user_id'],
            'service_type': request.form.get('serviceType'),
            'experience': request.form.get('experience'),
            'rate': request.form.get('rate'),
            'phone': request.form.get('phone'),
            'lat': request.form.get('lat'),
            'lng': request.form.get('lng'),
            'availability': request.form.get('availability'),
            'service_areas': request.form.get('serviceAreas'),
            'service_description': request.form.get('serviceDescription'),
            'image': image_filename

        })

        return jsonify({
            'message': 'Provider added successfully'
        })

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 400


# GET PROVIDERS
@app.route('/providers')
def get_providers():
    providers_ref = db.collection('providers').stream()

    result = []

    for doc in providers_ref:
        p = doc.to_dict()
        result.append({
            "id": doc.id,
            "serviceType": p.get('service_type'),
            "experience": p.get('experience'),
            "rate": p.get('rate'),
            "phone": p.get('phone'),
            "availability": p.get('availability'),
            "serviceAreas": p.get('service_areas'),
            "serviceDescription": p.get('service_description'),
            "image": p.get('image')      
        })

    return jsonify(result)


if __name__ == '__main__':

    print("🚀 Running on http://127.0.0.1:5000")

    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )