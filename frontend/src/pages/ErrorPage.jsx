import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ErrorPage.css';

const ErrorPage = () => {
    return (
        <div className="error-container">
            <div className="error-box">
                <h1>404 — Страница не найдена</h1>
                <p>Кажется, вы зашли не туда. Такой страницы не существует.</p>
                <Link to="/login" className="back-button">Вернуться на главную</Link>
            </div>
        </div>
    );
};

export default ErrorPage;
