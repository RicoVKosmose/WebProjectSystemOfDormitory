import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/student.css';

const StudentPage = () => {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [dutyImage, setDutyImage] = useState('');
    const [news, setNews] = useState([]);
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [repairDescription, setRepairDescription] = useState('');
    const [repairMessage, setRepairMessage] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [isToastVisible, setIsToastVisible] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.classList.add('toast', 'show', type);
        toast.textContent = message;

        document.body.appendChild(toast);

        // Убираем toast через 3 секунды
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                toast.remove();
            }, 500); // Удаление после завершения анимации исчезновения
        }, 3000); // Задержка перед исчезновением
    }


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

            const fetchNews = async () => {
                try {
                    const res = await fetch('http://localhost:3001/api/news');
                    const data = await res.json();
                    setNews(data);
                } catch (err) {
                    console.error('Ошибка загрузки новостей', err);
                }
            };

            const fetchEvents = async () => {
                try {
                    const res = await fetch('http://localhost:3001/api/events');
                    const data = await res.json();
                    setEvents(data);
                } catch (err) {
                    console.error('Ошибка загрузки мероприятий', err);
                }
            };

            updateDateTime();
            setInterval(updateDateTime, 1000);
            await fetchDutyImage();
            await fetchNews();
            await fetchEvents();
        };

        initializeData().catch((err) => console.error('Ошибка инициализации данных', err));
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3001/api/logout', {
                method: 'POST',
                credentials: 'include',
            });
            navigate('/login');
        } catch (err) {
            console.error('Ошибка при выходе', err);
        }
    };

    const handleRepairSubmit = async () => {
        if (repairDescription.trim() === '') {
            showToast('Пожалуйста, опишите проблему');
            return;
        }

        try {
            const res = await fetch('http://localhost:3001/api/repair-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ description: repairDescription })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Заявка успешно отправлена');
                setRepairDescription('');
            } else {
                showToast(data.message || 'Ошибка при отправке');
            }
        } catch (err) {
            console.error('Ошибка отправки заявки', err);
            showToast('Ошибка сервера');
        }
    };

    return (
        <div>
            <header>
                <div>
                    <button className="profile-button" onClick={() => navigate('/profile')}>Мой профиль</button>
                </div>
                <div id="datetime">{currentDateTime}</div>
            </header>


            <main className="dashboard">
                <div className="card news">
                    <h2>Лента новостей</h2>
                    {news.length === 0 ? (
                        <p>Новостей пока нет</p>
                    ) : (
                        news.map((item) => {
                            const dateObj = item.created_at ? new Date(item.created_at) : null;
                            const formattedDate = dateObj
                                ? dateObj.toLocaleDateString('ru-RU', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })
                                : 'Дата не указана';

                            return (
                                <div key={item.id} className="news-item">
                                    <p><strong>{formattedDate}</strong></p>
                                    <p><strong>{item.title}</strong></p>
                                    <p>{item.content}</p>
                                    {item.image && (
                                        <img
                                            src={`http://localhost:3001${item.image}`}
                                            alt="Новость"
                                            className="news-image"
                                        />
                                    )}
                                    <hr />
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="card events">
                    <h2>Мероприятия</h2>
                    {events.length === 0 ? (
                        <p>Нет запланированных мероприятий</p>
                    ) : (
                        events.map((item) => {
                            const dateObj = new Date(item.date);
                            const formattedDate = dateObj.toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            });
                            const formattedTime = item.time ? item.time.slice(0, 5) : '';

                            return (
                                <div key={item.id} className="event-item">
                                    <p><strong>{formattedDate}, {formattedTime}</strong></p>
                                    <p><strong>{item.title}</strong></p>
                                    <p>{item.description}</p>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="card duty-schedule">
                    <h2>Дежурство на кухне</h2>
                    {dutyImage ? (
                        <img src={dutyImage} alt="Расписание дежурств" className="duty-image" onClick={openModal} />
                    ) : (
                        <p>Фото не найдено</p>
                    )}

                    {isModalOpen && (
                        <div className="modal-overlay" onClick={closeModal}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <button className="close-button" onClick={closeModal}>&times;</button>
                                <img src={dutyImage} alt="Увеличенное расписание" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="card request">
                    <h2>Оставить заявку на ремонт</h2>
                    {repairMessage && <p className="repair-message">{repairMessage}</p>}
                    <textarea
                        value={repairDescription}
                        onChange={(e) => setRepairDescription(e.target.value)}
                        placeholder="Опишите проблему..."
                    ></textarea>
                    <button onClick={handleRepairSubmit}>Отправить</button>
                </div>

                {/* Toast уведомление */}
                {isToastVisible && (
                    <div className="toast">
                        {toastMessage}
                    </div>
                )}

                <div className="card payment">
                    <h2>Оплата общежития</h2>
                    <p><b>М-Банкинг:</b> ЕРИП - Образование и развитие - Высшее образование - Брест - БрГТУ - Общежитие</p>
                    <p><b>Код услуги:</b> 5182</p>
                    <p><b>Стоимость оплаты за общежития БрГТУ:</b></p>
                    <p>Общежитие №1 — 16,00 руб. (0,4 баз.вел.)</p>
                    <p>Общежитие №2, №3, №4 — 32,00 руб. (0,8 баз.вел.)</p>
                    <p>Для учащихся филиала БрГТУ «Политехнический колледж» — 12,00 руб. (0,3 баз.вел.)</p>

                    <button className="logout" onClick={handleLogout}>Выйти</button>
                </div>
            </main>

        </div>
    );
};

export default StudentPage;
