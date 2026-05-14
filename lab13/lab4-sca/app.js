const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- Санитизация HTML ---
function sanitizeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// --- CSP заголовок (усиление защиты от XSS) ---
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'");
    next();
});

// --- API KEY из окружения (не hardcoded) ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.error('FATAL: API_KEY environment variable not set');
    process.exit(1);
}

// --- База данных ---
const db = new sqlite3.Database('./comments.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`INSERT OR IGNORE INTO comments (id, username, comment) VALUES 
        (1, 'admin', 'Добро пожаловать на сайт!'),
        (2, 'user1', 'Отличный ресурс'),
        (3, 'user2', 'Очень полезная информация')`);
});

// --- Главная страница ---
app.get('/', (req, res) => {
    db.all(`SELECT * FROM comments ORDER BY created_at DESC`, (err, comments) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }
        res.render('index', { comments: comments, error: null });
    });
});

// --- Добавление комментария (с санитизацией) ---
app.post('/comment', (req, res) => {
    let { username, comment } = req.body;
    username = sanitizeHtml(username || 'Anonymous');
    comment = sanitizeHtml(comment || '');

    db.run(`INSERT INTO comments (username, comment) VALUES (?, ?)`,
        [username, comment],
        function(err) {
            if (err) {
                res.status(500).send('Error saving comment');
                return;
            }
            res.redirect('/');
        });
});

// --- API: получить комментарии (безопасная сортировка) ---
app.get('/api/comments', (req, res) => {
    const sortParam = req.query.sort || 'created_at DESC';
    const allowedSort = ['created_at DESC', 'created_at ASC', 'username ASC', 'username DESC'];
    if (!allowedSort.includes(sortParam)) {
        return res.status(400).json({ error: 'Invalid sort parameter' });
    }
    db.all(`SELECT * FROM comments ORDER BY ${sortParam}`, (err, comments) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(comments);
    });
});

// --- API: поиск (параметризованный запрос) ---
app.get('/api/search', (req, res) => {
    const search = req.query.q || '';
    db.all(`SELECT * FROM comments WHERE comment LIKE ?`, [`%${search}%`], (err, comments) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(comments);
    });
});

// --- Эндпоинт с секретом (теперь читается из окружения) ---
app.get('/api/config', (req, res) => {
    res.json({
        api_key: API_KEY,
        environment: 'development',
        debug: false
    });
});

// --- Уязвимый эндпоинт /api/external (исправлен: валидация URL) ---
const axios = require('axios');
app.get('/api/external', async (req, res) => {
    const url = req.query.url || '';
    // Разрешаем только безопасные домены (пример)
    if (!url.startsWith('https://api.example.com/')) {
        return res.status(400).json({ error: 'Invalid URL' });
    }
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'External request failed' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`App listening at http://0.0.0.0:${port}`);
});