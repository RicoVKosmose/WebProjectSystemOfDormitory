const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Подключение к базе данных
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "2025",
    database: "db"
});

db.connect(err => {
    if (err) {
        console.error("Ошибка подключения к MySQL: " + err);
        return;
    }
    console.log("✅ Подключено к MySQL!");
});

// Маршрут для входа
app.post("/login", (req, res) => {
    const { login, password } = req.body;

    db.query("SELECT * FROM db.users WHERE Login = ?", [login], (err, results) => {
        if (err) return res.status(500).json({ error: "Ошибка сервера" });
        if (results.length === 0) return res.status(400).json({ error: "Пользователь не найден" });

        const user = results[0];
        console.log(`Введенный пароль: ${password}, Пароль из БД: ${user.password}`);

        // Простое сравнение пароля (НЕ БЕЗОПАСНО)
        if (password !== user.password) return res.status(401).json({ error: "Неверный пароль" });

        res.json({ message: "Успешный вход!" });
    });
});


// Запуск сервера
app.listen(3001, () => {
    console.log("✅ Сервер запущен на порту 3001");
});
