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
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [totalHours, setTotalHours] = useState(0);

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
            }, 500);
        }, 3000);
    }

    const fetchTotalHours = async (studentId) => {
        try {
            const res = await fetch(`http://localhost:3001/api/worked-hours/total/${studentId}`, {
                credentials: 'include',
            });
            const data = await res.json();
            setTotalHours(data.hours || 0);
        } catch (err) {
            console.error('Ошибка при получении общего количества часов', err);
        }
    };
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

            const fetchNotifications = async () => {
                try {

                    const resId = await fetch('http://localhost:3001/api/current-student-id', {
                        credentials: 'include',
                    });
                    if (!resId.ok) throw new Error('Ошибка получения student_id');
                    const { studentId } = await resId.json();
                    await fetchTotalHours(studentId);

                    const resNotification = await fetch(`http://localhost:3001/api/worked-hours/notifications/${studentId}`, {
                        credentials: 'include',
                    });
                    if (!resNotification.ok) throw new Error('Ошибка получения уведомлений');
                    const notificationData = await resNotification.json();


                    console.log('Data:', notificationData);
                    setNotifications(notificationData);
                } catch (err) {
                    console.error('Ошибка при загрузке уведомлений', err);
                }
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
            await fetchNotifications();
            await fetchDutyImage();
            await fetchNews();
            await fetchEvents();

        };

        initializeData().catch((err) => console.error('Ошибка инициализации данных', err));
    }, []);

    const clearAllNotifications = async () => {
        const confirmed = window.confirm("Вы уверены, что хотите очистить все уведомления?");

        if (!confirmed) return;

        try {
            const resId = await fetch('http://localhost:3001/api/current-student-id', {
                credentials: 'include',
            });
            const { studentId } = await resId.json();

            const res = await fetch('http://localhost:3001/api/worked-hours/notifications/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ student_id: studentId }),
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Ошибка при очистке');

            // Очистить отображаемый список
            setNotifications([]);
        } catch (err) {
            console.error('Ошибка при очистке уведомлений', err);
        }
    };



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
                <div className="left-buttons">
                    <button className="profile-button" onClick={() => navigate('/profile')}>Мой профиль</button>
                    <div className="notification-wrapper">

                    <button
                        className={`notifications-button ${showNotifications ? 'active' : ''}`}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                     Отработанные часы
                </button>
                </div>
                    {showNotifications && (
                        <div className="notifications-dropdown">
                            <div className="notification-summary">
                                Всего: <span className={totalHours >= 24 ? 'hours-green' : ''}>{totalHours} час(ов)</span>
                            </div>
                            <div className="notifications-header">
                                <button className="clear-button" onClick={clearAllNotifications}>
                                    Очистить все
                                </button>
                            </div>

                            {notifications.length === 0 ? (
                                <p>Уведомлений нет</p>
                            ) : (
                                notifications.map((note, index) => {
                                    const isPositive = note.hours > 0;
                                    const hoursAbs = Math.abs(note.hours);
                                    const actionText = isPositive ? "Вам начислено" : "Вам отнято";
                                    const hoursColor = isPositive ? 'green' : 'red';

                                    return (
                                        <div key={index} className="notification-item">
                                            <p>
                                                <strong>
                                                    {actionText}{' '}
                                                    <span style={{ color: hoursColor }}>
                                    {hoursAbs} час(ов)
                                </span>
                                                </strong>
                                                <br />
                                                {note.description}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

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

            {location.pathname === '/student' && (
                <footer className="student-footer">
                    <div className="footer-content">
                        <span>© {new Date().getFullYear()} Все права защищены</span>
                        <a href="https://github.com/RicoVKosmose/WebProjectSystemOfDormitory" target="_blank" rel="noopener noreferrer">
                            GitHub
                        </a>
                    </div>
                </footer>
            )}


        </div>
    );
};

export default StudentPage;
