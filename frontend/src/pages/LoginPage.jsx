import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/style.css';

const LoginPage = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    console.log('login')

    const handleSubmit = async (event) => {
        event.preventDefault();

        const response = await fetch('http://localhost:3001/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password }),
        });

        const data = await response.json();

        if (data.error) {
            setMessage(data.error);
        } else {
            // Сохраняем роль в localStorage
            localStorage.setItem('role', data.role);

            // Перенаправляем в зависимости от роли
            if (data.role === 'admin') {
                navigate('/admin');
            } else if (data.role === 'worker') {
                navigate('/worker');
            } else {
                navigate('/student');
            }
        }
    };

    return (
        <div className="login-container">
            <h2>Вход в систему</h2>
            <form id="login-form" onSubmit={handleSubmit}>
                <label htmlFor="login">Логин:</label>
                <input
                    type="text"
                    id="login"
                    placeholder="Введите логин"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                />
                <label htmlFor="password">Пароль:</label>
                <input
                    type="password"
                    id="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Войти</button>
            </form>
            {message && (
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {message}
                </div>)}
        </div>
    );
};

export default LoginPage;