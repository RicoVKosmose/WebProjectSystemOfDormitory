import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/style.css';

const LoginPage = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setMessageType('');

        const response = await fetch('http://localhost:3001/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password }),
        });

        const data = await response.json();

        if (data.error) {
            setMessage(data.error);
            setMessageType('error');
        } else {
            setMessage('Успешная авторизация!');
            setMessageType('success');
            localStorage.setItem('role', data.role);

            setTimeout(() => {
                if (data.role === 'admin') {
                    navigate('/admin');
                } else if (data.role === 'worker') {
                    navigate('/worker');
                } else {
                    navigate('/student');
                }
            }, 1000);
        }
    };

    return (
        <div
            style={{
                backgroundImage: "url('/images/fon_login.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '100vh',
                width: '100vw',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <div className="login-container">
                <h2>Вход в систему</h2>

                <form id="auth-form" onSubmit={handleSubmit}>
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
                    <div className="password-input-container">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            placeholder="Введите пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>

                    <button type="submit">Войти</button>
                </form>

                {message && (
                    <div className={messageType === 'error' ? 'error-message' : 'success-message'}>
                        <span className="message-icon">{messageType === 'error' ? '⚠️' : '✅'}</span>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
