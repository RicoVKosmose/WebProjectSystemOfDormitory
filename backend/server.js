    const express = require("express");
    const mysql = require("mysql2");
    const cors = require("cors");
    const bodyParser = require("body-parser");
    const session = require("express-session");
    const multer = require("multer");
    const path = require("path");
    const fs = require("fs");
    const util = require('util');
    const bcrypt = require('bcrypt');


    const app = express();

    app.use(session({
        secret: "project322",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: true }
    }));


    app.use(cors({ origin: "http://localhost:3000", credentials: true }));

    app.use(bodyParser.json());
    app.use(express.static("public"));
    app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

    // Настройка MySQL
    const db = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "2025",
        database: "db",
        port:3306
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

    // Маршрут для выхода
    app.post('/api/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка при завершении сессии' });
            }
            res.clearCookie('connect.sid'); // Удаляем cookie сессии
            res.json({ message: 'Выход выполнен успешно' });
        });
    });


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
                        url: `http://localhost:3001/uploads/duty/${name}?t=${Date.now()}`
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

    app.get('/api/users', (req, res) => {
        const sql = `
        SELECT u.idUsers, u.Login, u.role, s.name, s.last_name, s.patronymic, s.birth_date, s.phone, s.email, s.address, s.university, s.faculty, s.group_name, s.block, s.room, s.number_ticket, s.avatar, s.floor, s.flooredge
        FROM db.users u
        JOIN db.students s ON u.idUsers = s.user_id
    `;

        db.query(sql, (err, result) => {
            if (err) {
                console.error('Ошибка запроса:', err);
                return res.status(500).json({ error: 'Ошибка при запросе данных' });
            }
            res.json(result); // Отправляем результат в формате JSON
        });
    });

    // Добавление пользователя и студента в базу данных
    app.post('/api/add-user', async (req, res) => {
        const { username, password, role, studentData } = req.body;
        const bcrypt = require('bcrypt');

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            // Добавление пользователя
            const sqlUser = 'INSERT INTO db.users (Login, password, role) VALUES (?, ?, ?)';
            db.query(sqlUser, [username, hashedPassword, role], (err, result) => {
                if (err) {
                    console.error('Ошибка при добавлении пользователя:', err);
                    return res.status(500).json({ error: 'Ошибка при добавлении пользователя' });
                }

                const userId = result.insertId;

                // Добавление данных студента
                const s = studentData;
                const safeNumber = (value) => (value === '' ? null : value);

                const params = [
                    userId,
                    s.name,
                    s.last_name,
                    s.patronymic,
                    s.birth_date === '' ? null : s.birth_date,
                    s.phone,
                    s.email,
                    s.address,
                    s.university,
                    s.faculty,
                    s.group_name,
                    safeNumber(s.block),
                    safeNumber(s.room),
                    safeNumber(s.number_ticket),
                    s.avatar,
                    safeNumber(s.floor),
                    s.flooredge
                ];

                const sqlStudent = `INSERT INTO db.students (user_id, name, last_name, patronymic, birth_date, phone, email, address, university, faculty, group_name, block, room, number_ticket, avatar, floor, flooredge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                db.query(sqlStudent, params, (err2, result2) => {
                    if (err2) {
                        console.error('Ошибка при добавлении данных студента:', err2);
                        return res.status(500).json({ error: 'Ошибка при добавлении данных студента' });
                    }

                    res.json({ message: 'Пользователь и студент успешно добавлены' });
                });
            });
        } catch (err) {
            console.error('Ошибка сервера:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    app.delete('/api/delete-user/:userId', (req, res) => {
        const userId = parseInt(req.params.userId, 10);
        console.log("Получен userId для удаления:", req.params.userId);

        if (isNaN(userId)) {
            console.error("Некорректный ID пользователя:", req.params.userId);
            return res.status(400).json({ error: 'Некорректный ID пользователя' });
        }

        console.log("Удаляем пользователя с ID:", userId);

        // Удаляем данные студента
        const sqlDeleteStudent = 'DELETE FROM db.students WHERE user_id = ?';
        db.query(sqlDeleteStudent, [userId], (err1, result1) => {
            if (err1) {
                console.error('Ошибка удаления данных студента:', err1);
                return res.status(500).json({ error: 'Ошибка при удалении данных студента' });
            }

            if (result1.affectedRows === 0) {
                console.warn("Данные студента не найдены, продолжаем удаление пользователя.");
            }

            // Удаляем пользователя
            const sqlDeleteUser = 'DELETE FROM db.users WHERE idUsers = ?';
            db.query(sqlDeleteUser, [userId], (err2, result2) => {
                if (err2) {
                    console.error('Ошибка удаления пользователя:', err2);
                    return res.status(500).json({ error: 'Ошибка при удалении пользователя' });
                }

                if (result2.affectedRows === 0) {
                    console.error("Пользователь с таким ID не найден.");
                    return res.status(404).json({ error: 'Пользователь не найден' });
                }

                console.log("Пользователь и данные студента успешно удалены");
                res.json({ message: 'Пользователь и данные студента успешно удалены' });
            });
        });
    });

    app.put('/api/update-user/:id', (req, res) => {
        const userId = req.params.id;
        const { username, password, role, studentData } = req.body;

        const sqlUser = password
            ? 'UPDATE db.users SET Login = ?, Password = ?, role = ? WHERE idUsers = ?'
            : 'UPDATE db.users SET Login = ?, role = ? WHERE idUsers = ?';

        const userParams = password ? [username, password, role, userId] : [username, role, userId];

        db.query(sqlUser, userParams, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Ошибка при обновлении учётной записи' });
            }

            const sqlStudent = `
            UPDATE db.students SET
                name = ?, last_name = ?, patronymic = ?, birth_date = ?, phone = ?, email = ?, address = ?,
                university = ?, faculty = ?, group_name = ?, block = ?, room = ?, number_ticket = ?,
                avatar = ?, floor = ?, flooredge = ?
            WHERE user_id = ?
        `;
            const studentValues = [
                studentData.name, studentData.last_name, studentData.patronymic, studentData.birth_date, studentData.phone,
                studentData.email, studentData.address, studentData.university, studentData.faculty, studentData.group_name,
                studentData.block, studentData.room, studentData.number_ticket, studentData.avatar, studentData.floor,
                studentData.flooredge, userId
            ];

            db.query(sqlStudent, studentValues, (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).json({ error: 'Ошибка при обновлении данных студента' });
                }

                res.json({ message: 'Пользователь обновлён' });
            });
        });
    });

    // 🚀
    app.listen(3001, () => {
        console.log("✅ Сервер запущен: http://localhost:3001");
    });
