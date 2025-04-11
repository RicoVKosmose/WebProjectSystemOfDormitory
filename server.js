const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const util = require('util');


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

const query = util.promisify(db.query).bind(db);
app.get('/api/duty-photo', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const result = await query(
            'SELECT floor, flooredge FROM db.students WHERE user_id = ?',
            [userId]
        );

        if (result.length === 0) return res.status(404).json({ error: 'Student not found' });

        const { floor, flooredge } = result[0];
        const imagePath = `/uploads/duty/${flooredge}_${floor}.jpg`;

        res.json({ imagePath });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

const dutyUpload = multer({ dest: "public/uploads/duty" }); // временно сохраняем

app.post("/api/upload-duty-photo", dutyUpload.single("image"), (req, res) => {
    const { fluredge, floor } = req.body;
    if (!req.file || !fluredge || !floor) {
        return res.status(400).json({ success: false, error: "Недостаточно данных" });
    }

    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "public", "uploads", "duty", `${fluredge}_${floor}.jpg`);

    fs.rename(tempPath, targetPath, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: "Ошибка при сохранении файла" });
        }

        res.json({ success: true });
    });
});

app.get("/api/duty-photos", (req, res) => {
    const dutyDir = path.join(__dirname, "public", "uploads", "duty");

    fs.readdir(dutyDir, (err, files) => {
        if (err) {
            console.error("Ошибка чтения директории duty:", err);
            return res.status(500).json({ error: "Ошибка сервера" });
        }

        const photos = files
            .filter(name => name.endsWith(".jpg"))
            .map(name => {
                const [fluredge, floorWithExt] = name.split("_");
                const floor = floorWithExt.replace(".jpg", "");
                return {
                    fluredge,
                    floor,
                    url: `/uploads/duty/${name}`
                };
            });

        res.json({ photos });
    });
});

// ❌ Удаление duty-фото
app.delete("/api/delete-duty-photo", (req, res) => {
    const { fluredge, floor } = req.body;

    if (!fluredge || !floor) {
        return res.status(400).json({ success: false, error: "Данные не указаны" });
    }

    const filePath = path.join(__dirname, "public", "uploads", "duty", `${fluredge}_${floor}.jpg`);

    fs.unlink(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ success: false, error: "Файл не найден" });
            }
            console.error("Ошибка при удалении файла:", err);
            return res.status(500).json({ success: false, error: "Ошибка сервера" });
        }

        res.json({ success: true });
    });
});

// 📸 Фото дежурства у студента
app.get("/api/student-duty-photo", (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Не авторизован" });

    db.query("SELECT floor, flooredge FROM db.students WHERE user_id = ?", [userId], (err, results) => {
        if (err) return res.status(500).json({ error: "Ошибка БД" });
        if (results.length === 0) return res.status(404).json({ error: "Студент не найден" });

        const { floor, fluredge } = results[0];
        const imagePath = path.join(__dirname, "public", "uploads", "duty", `${fluredge}_${floor}.jpg`);

        if (!fs.existsSync(imagePath)) {
            return res.json({ image: null }); // Фото может отсутствовать
        }

        const imageUrl = `/uploads/duty/${fluredge}_${floor}.jpg`;
        res.json({ image: imageUrl });
    });
});


// 🚀
app.listen(3001, () => {
    console.log("✅ Сервер запущен: http://localhost:3001");
});
