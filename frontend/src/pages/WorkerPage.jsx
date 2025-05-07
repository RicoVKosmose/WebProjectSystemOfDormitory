import React from "react";

export default function WorkerPage() {
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f4f8'
    };

    const titleStyle = {
        fontSize: '36px',
        fontWeight: 'bold',
        background: 'linear-gradient(90deg, #007bff, #00c6ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '20px'
    };

    const buttonStyle = {
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#007bff',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
    };

    const handleLogout = () => {
        // Очищаем localStorage (если там токен или роль) и перенаправляем на страницу входа
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div style={containerStyle}>
            <h1 style={titleStyle}>В разработке</h1>
            <button style={buttonStyle} onClick={handleLogout}>Выйти</button>
        </div>
    );
}
