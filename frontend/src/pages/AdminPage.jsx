import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import '../styles/admin.css';

const AdminPage = () => {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Проверяем роль пользователя
        if (localStorage.getItem('role') !== 'admin') {
            navigate('/login'); // Перенаправляем на страницу входа, если роль не администратор
        }

        // Обновление даты и времени каждую секунду
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

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000); // обновление каждую секунду
        return () => clearInterval(interval); // Очистка интервала при размонтировании компонента
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('role');
        navigate('/login'); // Перенаправляем на страницу входа после выхода
    };

    return (
        <div className="admin-layout">
            <header>
                <div>
                    <a href="/admin">Главная</a>
                    <a href="#">Настройки</a>
                </div>
                <div id="datetime">{currentDateTime}</div>
            </header>

            <div className="admin-body">
                <aside className="admin-sidebar">
                    <button onClick={() => navigate('/admin/users')}>Пользователи</button>
                    <button onClick={() => navigate('/admin/news')}>Новости</button>
                    <button onClick={() => navigate('/admin/requests')}>Заявки</button>
                    <button onClick={() => navigate('/admin/events')}>Мероприятия</button>
                    <button onClick={() => navigate('/admin/duty-manager')}>Кухонное дежурство</button>
                    <button onClick={() => navigate('/admin/work-hours')}>Отработанные часы</button>
                    <button onClick={handleLogout}>Выйти</button>
                </aside>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminPage;