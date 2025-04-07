const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.use(session({
    secret: "project322",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
}));

// Настройка MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "2025",
    database: "db"
});
db.connect(err => {
    if (err) console.error("❌ Ошибка подключения:", err);
    else console.log("✅ Подключено к MySQL!");
});

// Настройка Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "public/uploads"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

// 🔐 Вход
app.post("/login", (req, res) => {
    const { login, password } = req.body;
    db.query("SELECT * FROM db.users WHERE Login = ?", [login], (err, results) => {
        if (err) return res.status(500).json({ error: "Ошибка сервера" });
        if (results.length === 0) return res.status(400).json({ error: "Пользователь не найден" });
        const user = results[0];
        if (user.password !== password) return res.status(401).json({ error: "Неверный пароль" });

        req.session.userId = user.idUsers;
        res.json({ message: "Успешный вход", role: user.role });
    });
});

// 👤 Получение профиля
app.get("/api/student-profile", (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Не авторизован" });

    db.query("SELECT * FROM db.students WHERE user_id = ?", [userId], (err, results) => {
        if (err) return res.status(500).json({ error: "Ошибка запроса" });
        if (results.length === 0) return res.status(404).json({ error: "Студент не найден" });

        res.json(results[0]);
    });
});

// 📤 Загрузка аватара
app.post("/api/upload-avatar", upload.single("avatar"), (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Не авторизован" });

    const filename = req.file.filename;

    db.query("UPDATE db.students SET avatar = ? WHERE user_id = ?", [filename, userId], (err) => {
        if (err) return res.status(500).json({ error: "Ошибка при сохранении" });
        res.json({ message: "Аватар загружен", avatar: filename });
    });
});

// 🚀
app.listen(3001, () => {
    console.log("✅ Сервер запущен: http://localhost:3001");
});
