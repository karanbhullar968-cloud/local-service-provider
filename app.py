import os
from flask import Flask, request, jsonify, session, render_template
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)

app.secret_key = 'secret123'

UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# CREATE uploads FOLDER IF NOT EXISTS
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# MYSQL CONFIG
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '@Karan2005'
app.config['MYSQL_DB'] = 'service_app'

mysql = MySQL(app)

# HOME PAGE
@app.route('/')
def home():
    return render_template('index.html')


# SIGNUP
@app.route('/signup', methods=['POST'])
def signup():

    data = request.json
    cur = mysql.connection.cursor()

    try:

        cur.execute("""
            INSERT INTO users(
                name,
                email,
                password,
                user_type
            )
            VALUES(%s,%s,%s,%s)
        """, (
            data['name'],
            data['email'],
            generate_password_hash(data['password']),
            data['user_type']
        ))

        mysql.connection.commit()

        return jsonify({
            'message': 'Signup successful'
        })

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 400

    finally:
        cur.close()


# LOGIN
@app.route('/login', methods=['POST'])
def login():

    data = request.json

    cur = mysql.connection.cursor()

    cur.execute("""
        SELECT id,password,user_type
        FROM users
        WHERE email=%s
    """, (data['email'],))

    user = cur.fetchone()

    cur.close()

    if user and check_password_hash(user[1], data['password']):

        session['user_id'] = user[0]
        session['user_type'] = user[2]

        return jsonify({
            'message': 'Login success',
            'user_type': user[2]
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

    cur = mysql.connection.cursor()

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

        cur.execute("""
            INSERT INTO providers(
                user_id,
                service_type,
                experience,
                rate,
                phone,
                lat,
                lng,
                availability,
                service_areas,
                service_description,
                image
            )
            VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (

            session['user_id'],

            request.form.get('serviceType'),
            request.form.get('experience'),
            request.form.get('rate'),
            request.form.get('phone'),
            request.form.get('lat'),
            request.form.get('lng'),
            request.form.get('availability'),
            request.form.get('serviceAreas'),
            request.form.get('serviceDescription'),
            image_filename
        ))

        mysql.connection.commit()

        return jsonify({
            'message': 'Provider added successfully'
        })

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 400

    finally:
        cur.close()


# GET PROVIDERS
@app.route('/providers')
def get_providers():

    cur = mysql.connection.cursor()

    cur.execute("""
        SELECT
            p.id,
            u.name,
            p.service_type,
            p.experience,
            p.rate,
            p.phone,
            p.availability,
            p.service_areas,
            p.service_description,
            p.image

        FROM providers p

        JOIN users u
        ON p.user_id = u.id
    """)

    providers = cur.fetchall()

    cur.close()

    result = []

    for p in providers:

        result.append({
            "id": p[0],
            "name": p[1],
            "serviceType": p[2],
            "experience": p[3],
            "rate": p[4],
            "phone": p[5],
            "availability": p[6],
            "serviceAreas": p[7],
            "serviceDescription": p[8],
            "image": p[9]
        })

    return jsonify(result)


if __name__ == '__main__':

    print("🚀 Running on http://127.0.0.1:5000")

    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )