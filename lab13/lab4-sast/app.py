from flask import Flask, request, jsonify, render_template_string
import sqlite3
import os
import subprocess
import shlex

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    cursor.execute("INSERT OR IGNORE INTO users (id, username, email, password) VALUES (1, 'admin', 'admin@example.com', 'admin123')")
    cursor.execute("INSERT OR IGNORE INTO users (id, username, email, password) VALUES (2, 'user', 'user@example.com', 'user123')")
    conn.commit()
    conn.close()

# Секрет из переменной окружения
API_KEY = os.environ.get('API_KEY')
if not API_KEY:
    raise ValueError("API_KEY environment variable not set")

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>User Management</title>
</head>
<body>
    <h1>User Management System</h1>
    <form action="/user" method="GET">
        <label>User ID:</label>
        <input type="text" name="id">
        <button type="submit">Get User</button>
    </form>

    <form action="/search" method="GET">
        <label>Search by username:</label>
        <input type="text" name="username">
        <button type="submit">Search</button>
    </form>

    <div id="result">
        {content}
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE.format(content="<p>Enter user ID or search by username</p>"))

@app.route('/user')
def get_user():
    user_id = request.args.get('id')
    if not user_id:
        return jsonify({"error": "Missing id parameter"}), 400
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Исправлено: параметризованный запрос
    query = "SELECT * FROM users WHERE id = ?"
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return jsonify({"id": user[0], "username": user[1], "email": user[2]})
    return jsonify({"error": "User not found"}), 404

@app.route('/search')
def search_users():
    username = request.args.get('username', '')
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Исправлено: параметризованный запрос с LIKE
    query = "SELECT * FROM users WHERE username LIKE ?"
    cursor.execute(query, (f'%{username}%',))
    users = cursor.fetchall()
    conn.close()
    result = [{"id": u[0], "username": u[1], "email": u[2]} for u in users]
    return jsonify(result)

@app.route('/api/data')
def get_data():
    # Исправлено: теперь API_KEY из окружения, а не захардкожен
    return jsonify({"api_key": API_KEY, "message": "This is sensitive data"})


@app.route('/execute')
def execute_command():
    cmd = request.args.get('cmd', '')
    if not cmd:
        return jsonify({"error": "Missing cmd parameter"}), 400

    # Список разрешённых команд (исполняемые файлы в Windows)
    ALLOWED_COMMANDS = ['whoami', 'hostname', 'ver', 'systeminfo', 'ping']

    parts = cmd.split()
    if not parts:
        return jsonify({"error": "Empty command"}), 400

    command_name = parts[0]
    if command_name not in ALLOWED_COMMANDS:
        return jsonify({"error": f"Command '{command_name}' not allowed"}), 403

    try:
        # Выполняем без shell=True (безопасно)
        result = subprocess.check_output(parts, stderr=subprocess.STDOUT, text=True, encoding='cp866')
    except subprocess.CalledProcessError as e:
        result = f"Command failed (code {e.returncode}):\n{e.output}"
    except FileNotFoundError:
        result = f"Command not found: {command_name}"
    except Exception as e:
        result = f"Unexpected error: {str(e)}"

    return jsonify({"output": result.strip()})

if __name__ == '__main__':
    init_db()
    # Исправлено: debug=False, host=127.0.0.1
    app.run(debug=False, host='127.0.0.1', port=5000)