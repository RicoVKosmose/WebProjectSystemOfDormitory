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


    // 🔐 Входno

    app.post("/login", (req, res) => {
        const { login, password } = req.body;
        db.query("SELECT * FROM db.users WHERE Login = ?", [login], async (err, results) => {
            if (err) return res.status(500).json({ error: "Ошибка сервера" });
            if (results.length === 0) return res.status(400).json({ error: "Пользователь не найден" });

            const user = results[0];

            // Сравнение введённого пароля с хэшом в базе
            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).json({ error: "Неверный пароль" });

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

    // 📂 Для новостей — храним их в отдельной папке uploads/news
    const newsStorage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, "public/uploads/news"),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `news-${Date.now()}${ext}`);
        }
    });
    const uploadNews = multer({ storage: newsStorage });

    // 📋 Получить все новости (архив)
    app.get('/api/news', (req, res) => {
        const sql = 'SELECT * FROM db.news ORDER BY created_at DESC';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('❌ Ошибка получения новостей:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            res.json(results);
        });
    });

    // ➕ Добавить новость
    app.post('/api/add-news', uploadNews.single('image'), (req, res) => {
        const { title, content } = req.body;
        const imagePath = req.file ? `/uploads/news/${req.file.filename}` : null;

        const sql = 'INSERT INTO db.news (title, content, image) VALUES (?, ?, ?)';
        db.query(sql, [title, content, imagePath], (err, result) => {
            if (err) {
                console.error('❌ Ошибка добавления новости:', err);
                return res.status(500).json({ error: 'Ошибка сервера' });
            }
            res.json({ message: 'Новость добавлена' });
        });
    });

    // ❌ Удалить новость
    app.delete('/api/news/:id', (req, res) => {
        const { id } = req.params;
        const getImageSql = 'SELECT image FROM db.news WHERE id = ?';
        const deleteSql = 'DELETE FROM db.news WHERE id = ?';

        db.query(getImageSql, [id], (err, results) => {
            if (err) return res.status(500).json({ error: 'Ошибка сервера' });
            if (results.length > 0 && results[0].image) {
                const imagePath = path.join(__dirname, 'public', results[0].image);
                fs.unlink(imagePath, (unlinkErr) => {
                    if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                        console.error('❌ Ошибка удаления изображения:', unlinkErr);
                    }
                });
            }

            db.query(deleteSql, [id], (err2, result2) => {
                if (err2) return res.status(500).json({ error: 'Ошибка сервера' });
                res.json({ message: 'Новость удалена' });
            });
        });
    });

    // Маршрут для получения всех мероприятий
    app.get('/api/events', (req, res) => {
        const query = 'SELECT * FROM db.events ORDER BY created_at DESC';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Ошибка при получении мероприятий:', err);
                return res.status(500).send('Ошибка при получении мероприятий');
            }
            res.json(results);
        });
    });

    // Маршрут для добавления нового мероприятия
    app.post('/api/add-event', (req, res) => {
        const { title, description, date, time } = req.body;
        const query = 'INSERT INTO db.events (title, description, date, time) VALUES (?, ?, ?, ?)';

        db.query(query, [title, description, date, time], (err, result) => {
            if (err) {
                console.error('Ошибка при добавлении мероприятия:', err);
                return res.status(500).send('Ошибка при добавлении мероприятия');
            }
            res.status(201).send('Мероприятие добавлено');
        });
    });

    // Маршрут для удаления мероприятия по ID
    app.delete('/api/events/:id', (req, res) => {
        const { id } = req.params;
        const query = 'DELETE FROM db.events WHERE id = ?';

        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Ошибка при удалении мероприятия:', err);
                return res.status(500).send('Ошибка при удалении мероприятия');
            }
            res.send('Мероприятие удалено');
        });
    });

    // Маршрут для обновления мероприятия
    app.put('/api/events/:id', (req, res) => {
        const { id } = req.params;
        const { title, description, date, time } = req.body;
        const query = 'UPDATE db.events SET title = ?, description = ?, date = ?, time = ? WHERE id = ?';

        db.query(query, [title, description, date, time, id], (err, result) => {
            if (err) {
                console.error('Ошибка при обновлении мероприятия:', err);
                return res.status(500).send('Ошибка при обновлении мероприятия');
            }
            res.send('Мероприятие обновлено');
        });
    });


    // Получить всех студентов с часами
    app.get('/api/worked-hours', (req, res) => {
        const query = `
            SELECT
                s.id AS student_id, s.last_name, s.name, s.patronymic, s.block, s.room, s.flooredge,
                IFNULL(w.hours, 0) AS hours, IFNULL(w.description, '') AS description
            FROM db.students s
                     LEFT JOIN db.worked_hours w ON s.id = w.student_id
        `;
        db.query(query, (err, result) => {
            if (err) {
                console.error('Ошибка при получении сведений:', err);
                return res.status(500).send('Ошибка при получении сведений');
            }
            res.json(result);
        });
    });

    // Добавить или обновить часы
    app.post('/api/worked-hours/update', (req, res) => {
        const { student_id, delta, description } = req.body;

        const now = new Date();
        const formattedDate = `[${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1)
            .toString().padStart(2, '0')}.${now.getFullYear()}]`;

        const datedDescription = `${formattedDate} ${description}`;

        const selectQuery = 'SELECT * FROM db.worked_hours WHERE student_id = ?';
        db.query(selectQuery, [student_id], (err, rows) => {
            if (err) return res.status(500).send('Ошибка при проверке записи');

            if (rows.length === 0) {
                const insertQuery = 'INSERT INTO db.worked_hours (student_id, hours, description) VALUES (?, ?, ?)';
                db.query(insertQuery, [student_id, delta, datedDescription], (err2) => {
                    if (err2) return res.status(500).send('Ошибка при добавлении записи');

                    // Добавляем запись в лог
                    const logInsertQuery = `INSERT INTO db.worked_hours_log (student_id, hours_change, description, created_at, is_read) VALUES (?, ?, ?, NOW(), FALSE)`;
                    db.query(logInsertQuery, [student_id, delta, description], (errLog) => {
                        if (errLog) console.error('Ошибка при добавлении лога', errLog);
                        // Отвечаем клиенту, даже если лог не добавился
                        res.send('Запись добавлена');
                    });
                });
            } else {
                const currentHours = rows[0].hours;
                const newHours = currentHours + delta;
                const newDescription = rows[0].description
                    ? rows[0].description + '\n' + datedDescription
                    : datedDescription;

                const updateQuery = 'UPDATE db.worked_hours SET hours = ?, description = ? WHERE student_id = ?';
                db.query(updateQuery, [newHours, newDescription, student_id], (err3) => {
                    if (err3) return res.status(500).send('Ошибка при обновлении записи');

                    // Добавляем запись в лог
                    const logInsertQuery = `INSERT INTO db.worked_hours_log (student_id, hours_change, description, created_at, is_read) VALUES (?, ?, ?, NOW(), FALSE)`;
                    db.query(logInsertQuery, [student_id, delta, description], (errLog) => {
                        if (errLog) console.error('Ошибка при добавлении лога', errLog);
                        res.send('Запись обновлена');
                    });
                });
            }
        });
    });



    // Очистить описание у студента
    app.post('/api/worked-hours/clear-description', (req, res) => {
        const { student_id } = req.body;

        const updateQuery = 'UPDATE db.worked_hours SET description = ? WHERE student_id = ?';
        db.query(updateQuery, ['', student_id], (err) => {
            if (err) return res.status(500).send('Ошибка при очистке описания');
            res.send('Описание очищено');
        });
    });

    // Очистить все часы у всех студентов
    app.post('/api/worked-hours/clear-all', (req, res) => {
        const clearQuery = "UPDATE db.worked_hours SET hours = 0, description = ''";
        db.query(clearQuery, (err) => {
            if (err) {
                console.error('Ошибка при очистке данных:', err);
                return res.status(500).send('Ошибка при очистке данных');
            }
            res.send('Все часы и описания успешно очищены');
        });
    });

    // Уменьшить часы у студентов с 25+ часами
    app.post('/api/worked-hours/reduce-over-25', (req, res) => {
        const updateQuery = `
        UPDATE db.worked_hours
        SET hours = hours - 24
        WHERE hours >= 25
    `;
        db.query(updateQuery, (err) => {
            if (err) return res.status(500).send('Ошибка при уменьшении часов');
            res.send('Часы у студентов с 25+ часами уменьшены');
        });
    });

    app.post('/api/repair-request', (req, res) => {
        const userId = req.session.userId;
        const { description } = req.body;

        console.log('Получены данные запроса:', req.body);  // Логируем данные, полученные от клиента
        console.log('ID пользователя:', userId);  // Логируем ID пользователя из сессии

        if (!userId) {
            console.log('Пользователь не авторизован');
            return res.status(401).json({ message: 'Не авторизован' });
        }

        if (!description || description.trim() === '') {
            console.log('Описание пустое');
            return res.status(400).json({ message: 'Описание не может быть пустым' });
        }

        const sql = 'INSERT INTO db.repair_requests (user_id, description) VALUES (?, ?)';
        db.query(sql, [userId, description], (err, result) => {
            if (err) {
                console.error('Ошибка при добавлении заявки:', err);  // Логируем ошибку SQL-запроса
                return res.status(500).json({ message: 'Ошибка сервера' });
            }

            console.log('Заявка успешно добавлена');
            res.status(200).json({ message: 'Заявка успешно отправлена' });
        });
    });



    app.get('/api/repair-requests', (req, res) => {
        console.log('Получен запрос на получение заявок на ремонт');

        const sql = `
            SELECT
                s.last_name, s.name, s.patronymic,
                s.block, s.room, s.flooredge,
                r.description, r.status, r.created_at, r.id as request_id
            FROM db.repair_requests r
                     JOIN db.students s ON r.user_id = s.user_id
            ORDER BY r.created_at DESC
        `;

        console.log('SQL запрос:', sql); // Логируем SQL-запрос

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Ошибка при выполнении запроса:', err);
                return res.status(500).json({ error: err });
            }

            console.log('Результаты запроса:', results); // Логируем результаты запроса
            res.json(results);
        });
    });


    app.put('/api/update-request-status/:id', (req, res) => {
        const { status } = req.body;
        const { id } = req.params;
        const sql = `UPDATE db.repair_requests SET status = ? WHERE id = ?`;
        db.query(sql, [status, id], (err) => {
            if (err) return res.status(500).json({ error: err });
            res.sendStatus(200);
        });
    });

    // Маршрут для удаления заявки
    app.delete('/api/delete-request/:id', (req, res) => {
        const { id } = req.params;

        const sql = 'DELETE FROM db.repair_requests WHERE id = ?';
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Ошибка при удалении заявки:', err);
                return res.status(500).json({ message: 'Ошибка сервера при удалении заявки' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Заявка не найдена' });
            }

            res.status(200).json({ message: 'Заявка удалена успешно' });
        });
    });



    const avatarStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "public/uploads/avatars");
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `avatar-${Date.now()}${ext}`);
        }
    });
    const uploadAvatar = multer({ storage: avatarStorage });
    app.use('/uploads/avatars', express.static(path.join(__dirname, 'public/uploads/avatars')));


    // Загрузка аватара
    app.post('/api/upload-avatar', uploadAvatar.single('avatar'), (req, res) => {
        const userId = req.session.userId;
        const avatarPath = req.file.filename;

        const sql = 'UPDATE db.students SET avatar = ? WHERE user_id = ?';
        db.query(sql, [avatarPath, userId], (err, result) => {
            if (err) {
                console.error('Ошибка загрузки аватара:', err);
                return res.status(500).json({ error: 'Ошибка при загрузке аватара' });
            }
            res.json({ avatar: avatarPath });
        });
    });


    // Изменение пароля
    app.post('/api/change-password', (req, res) => {
        const { newPassword } = req.body;
        const userId = req.session.userId;

        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Ошибка при хешировании пароля:', err);
                return res.status(500).json({ error: 'Ошибка при изменении пароля' });
            }

            const sql = 'UPDATE db.users SET password = ? WHERE idUsers = ?';
            db.query(sql, [hashedPassword, userId], (err2, result) => {
                if (err2) {
                    console.error('Ошибка при обновлении пароля:', err2);
                    return res.status(500).json({ error: 'Ошибка при изменении пароля' });
                }
                res.json({ message: 'Пароль успешно изменен' });
            });
        });
    });

    app.get('/api/user-profile', (req, res) => {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }

        const sql = `
            SELECT u.idUsers, u.Login, u.role, s.name, s.last_name, s.patronymic, s.birth_date, s.phone, s.email, s.address, s.university, s.faculty, s.group_name, s.block, s.room, s.number_ticket, s.avatar, s.floor, s.flooredge
            FROM db.users u
                     LEFT JOIN db.students s ON u.idUsers = s.user_id
            WHERE u.idUsers = ?
        `;

        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.error('Ошибка запроса:', err);
                return res.status(500).json({ error: 'Ошибка при запросе данных' });
            }
            if (result.length === 0) {
                return res.status(404).json({ message: 'Профиль не найден' });
            }
            res.json(result[0]); // Отправляем профиль одного пользователя
        });
    });

    app.post('/register', async (req, res) => {
        const { login, password, name, lastName } = req.body;

        if (!login || !password || !name || !lastName) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            // Проверяем уникальность логина
            const sqlCheck = 'SELECT * FROM db.users WHERE login = ?';
            db.query(sqlCheck, [login], (err, results) => {
                if (err) return res.status(500).json({ error: 'Ошибка сервера' });

                if (results.length > 0) {
                    return res.status(400).json({ error: 'Логин уже занят' });
                }

                // Вставляем пользователя
                const sqlInsertUser = 'INSERT INTO db.users (login, password, role) VALUES (?, ?, ?)';
                db.query(sqlInsertUser, [login, hashedPassword, 'student'], (err, result) => {
                    if (err) return res.status(500).json({ error: 'Ошибка при регистрации пользователя' });

                    const userId = result.insertId;  // получаем id вставленного пользователя

                    // Вставляем данные студента
                    const sqlInsertStudent = 'INSERT INTO db.students (user_id, name, last_name) VALUES (?, ?, ?)';
                    db.query(sqlInsertStudent, [userId, name, lastName], (err, result) => {
                        if (err) return res.status(500).json({ error: 'Ошибка при сохранении данных студента' });

                        res.status(200).json({ message: 'Регистрация успешна' });
                    });
                });
            });
        } catch (error) {
            res.status(500).json({ error: 'Ошибка на сервере' });
        }
    });

    // Получить уведомления для студента (непрочитанные или все)
    app.get('/api/worked-hours/notifications/:student_id', (req, res) => {
        const student_id = req.params.student_id;
        const query = `
            SELECT id, hours_change AS hours, description, is_read
            FROM db.worked_hours_log
            WHERE student_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        `;

        db.query(query, [student_id], (err, rows) => {
            if (err) return res.status(500).send('Ошибка при получении уведомлений');
            console.log('SQL result:', rows);  // <-- добавьте этот вывод
            res.json(rows);
        });
    });



    // Пометить уведомление как прочитанное по id
    app.post('/api/worked-hours/notifications/read', (req, res) => {
        const { notification_id } = req.body;

        const updateQuery = 'UPDATE db.worked_hours_log SET is_read = TRUE WHERE id = ?';
        db.query(updateQuery, [notification_id], (err) => {
            if (err) return res.status(500).send('Ошибка при обновлении статуса уведомления');
            res.send('Уведомление отмечено как прочитанное');
        });
    });

    // На сервере
    app.get('/api/current-student-id', (req, res) => {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Не авторизован' });
        }

        const query = 'SELECT id FROM db.students WHERE user_id = ?';
        db.query(query, [req.session.userId], (err, results) => {
            if (err) return res.status(500).send('Ошибка при получении student_id');
            if (results.length === 0) return res.status(404).send('Студент не найден');

            res.json({ studentId: results[0].id });
        });
    });

    app.post('/api/worked-hours/notifications/clear', (req, res) => {
        const { student_id } = req.body;

        const deleteQuery = 'DELETE FROM db.worked_hours_log WHERE student_id = ?';
        db.query(deleteQuery, [student_id], (err) => {
            if (err) return res.status(500).send('Ошибка при удалении уведомлений');
            res.send('Все уведомления удалены');
        });
    });

    app.get('/api/worked-hours/total/:student_id', (req, res) => {
        const student_id = req.params.student_id;

        const query = `SELECT hours FROM db.worked_hours WHERE student_id = ?`;

        db.query(query, [student_id], (err, results) => {
            if (err) return res.status(500).send('Ошибка при получении общего количества часов');
            if (results.length === 0) return res.json({ hours: 0 });
            res.json({ hours: results[0].hours });
        });
    });



    // 🚀
    app.listen(3001, () => {
        console.log("✅ Сервер запущен: http://localhost:3001");
    });
