import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // для перенаправления
import '../styles/student.css';

const StudentPage = () => {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [dutyImage, setDutyImage] = useState('');
    const [news, setNews] = useState([]);
    const [events, setEvents] = useState([]);
    const navigate = useNavigate(); // Для перенаправления

    useEffect(() => {
        const initializeData = async () => {
            const updateDateTime = () => {
                const now = new Date();
                setCurrentDateTime(now.toLocaleString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }));
            };

            const fetchDutyImage = async () => {
                try {
                    const res = await fetch('http://localhost:3001/api/duty-photo', {
                        credentials: 'include',
                    });
                    const data = await res.json();
                    if (data.imagePath) {
                        setDutyImage(`http://localhost:3001${data.imagePath}`);
                    } else {
                        setDutyImage('');
                    }
                } catch (err) {
                    console.error('Ошибка загрузки фото дежурства', err);
                }
            };

            const fetchNewsAndEvents = async () => {
                setNews([
                    { date: '02.04.2024', text: 'Проверка системы пожарной безопасности' },
                    { date: '31.03.2024', text: 'Отключение горячей воды 5 апреля с 10:00 до 15:00' },
                ]);
                setEvents([
                    { date: '03.04.2024', text: 'Семинар «Карьера в IT»' },
                ]);
            };

            updateDateTime();
            setInterval(updateDateTime, 1000);
            await fetchDutyImage();
            await fetchNewsAndEvents();
        };

        initializeData().catch((err) => console.error('Ошибка инициализации данных', err));
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3001/api/logout', {
                method: 'POST',
                credentials: 'include',
            });
            navigate('/login'); // Перенаправление на страницу входа
        } catch (err) {
            console.error('Ошибка при выходе', err);
        }
    };

    return (
        <div>
            <header>
                <div>
                    <a href="/profile">Мой профиль</a>
                    <a href="#">Уведомления</a>
                    <a href="#">Контакты</a>
                </div>
                <div id="datetime">{currentDateTime}</div>
            </header>

            <main className="dashboard">
                <div className="card news">
                    <h2>Лента новостей</h2>
                    {news.map((item, index) => (
                        <p key={index}><strong>{item.date}</strong><br />{item.text}</p>
                    ))}
                </div>

                <div className="card events">
                    <h2>Мероприятия</h2>
                    {events.map((item, index) => (
                        <p key={index}><strong>{item.date}</strong><br />{item.text}</p>
                    ))}
                </div>

                <div className="card duty-schedule">
                    <h2>Дежурство на кухне</h2>
                    {dutyImage ? (
                        <img src={dutyImage} alt="Расписание дежурств" className="duty-image" />
                    ) : (
                        <p>Фото не найдено</p>
                    )}
                </div>

                <div className="card request">
                    <h2>Оставить заявку</h2>
                    <label htmlFor="repair">Заявка на ремонт</label>
                    <textarea id="repair" placeholder="Опишите проблему..."></textarea>
                    <button>Отправить</button>
                </div>

                <div className="card payment">
                    <h2>Оплата задолженности</h2>
                    <p><strong>12 руб.</strong></p>
                    <img src="#" alt="QR для оплаты" className="qr" />
                    <p>Как оплатить</p>
                    <button onClick={handleLogout}>Выйти</button>
                </div>
            </main>
        </div>
    );
};

export default StudentPage;
