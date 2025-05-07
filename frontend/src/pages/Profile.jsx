import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import  '../styles/Profile.css'

const Profile = () => {
    const [currentDateTime, setCurrentDateTime] = useState("");
    const [avatar, setAvatar] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [accountInfo, setAccountInfo] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const updateDateTime = () => {
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleString();
            setCurrentDateTime(formattedDate);
        };
        const intervalId = setInterval(updateDateTime, 1000);
        updateDateTime();
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const response = await fetch("/api/user-profile", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Полученные данные профиля:", data);  // Логируем полученные данные
                setAccountInfo(data);
                setAvatar(data.avatar);
            } else {
                console.error("Ошибка при загрузке профиля");
            }
        };
        fetchUserProfile();
    }, []);

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            alert("Пароли не совпадают!");
            return;
        }

        const response = await fetch("/api/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword }),
        });

        if (response.ok) {
            alert("Пароль успешно изменен!");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            alert("Ошибка при изменении пароля!");
        }
    };

    const handleAvatarUpload = async (e) => {
        console.log("Выбран файл:", e.target.files[0]);
        const formData = new FormData();
        formData.append("avatar", e.target.files[0]);

        const response = await fetch("/api/upload-avatar", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Ответ после загрузки аватара:", data);
            setAvatar(data.avatar);
        } else {
            alert("Ошибка при загрузке аватара");
        }
    };

    const handleNavigateHome = () => {
        if (accountInfo.role === "student") {
            navigate("/student");
        } else if (accountInfo.role === "admin") {
            navigate("/admin");
        }
    };

    return (
        <div>
            <header>
                <div>
                    <button className="profile-button" onClick={handleNavigateHome}>
                        На главную
                    </button>
                </div>
                <div id="datetime">{currentDateTime}</div>
            </header>

            <div className="profile-container">
                {/* Левая колонка — Информация */}
                <div className="profile-info">
                    <h2>Информация о аккаунте</h2>
                    <p><strong>Логин:</strong> {accountInfo.Login}</p>
                    <p><strong>Роль:</strong> {accountInfo.role}</p>
                    <p><strong>Имя:</strong> {accountInfo.name}</p>
                    <p><strong>Фамилия:</strong> {accountInfo.last_name}</p>
                    <p><strong>Отчество:</strong> {accountInfo.patronymic}</p>
                    <p><strong>Дата рождения:</strong> {accountInfo.birth_date}</p>
                    <p><strong>Телефон:</strong> {accountInfo.phone}</p>
                    <p><strong>Email:</strong> {accountInfo.email}</p>
                    <p><strong>Адрес:</strong> {accountInfo.address}</p>
                    <p><strong>Университет:</strong> {accountInfo.university}</p>
                    <p><strong>Факультет:</strong> {accountInfo.faculty}</p>
                    <p><strong>Группа:</strong> {accountInfo.group_name}</p>
                    <p><strong>Блок:</strong> {accountInfo.block}</p>
                    <p><strong>Комната:</strong> {accountInfo.room}</p>
                    <p><strong>Студенческий билет:</strong> {accountInfo.number_ticket}</p>
                    <p><strong>Этаж:</strong> {accountInfo.floor}</p>
                    <p><strong>Крыло:</strong> {accountInfo.flooredge === 'left' ? 'Левое' : accountInfo.flooredge === 'right' ? 'Правое' : ''}</p>
                </div>

                {/* Правая колонка */}
                <div className="profile-right">
                    {/* Аватарка */}
                    <div className="profile-avatar">
                        <h2>Аватар</h2>
                        <img
                            src={`http://localhost:3001/uploads/avatars/${avatar}`}
                            alt="Avatar"
                            className="avatar-img"
                            width="150"
                            height="150"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            id="avatar-upload-input"
                            style={{ display: 'none' }}
                            onChange={handleAvatarUpload}
                        />
                        <button onClick={() => document.getElementById('avatar-upload-input').click()}>
                            Загрузить аватар
                        </button>
                    </div>


                    {/* Смена пароля */}
                    <div className="profile-password">
                        <h2>Изменить пароль</h2>
                        <input
                            type="password"
                            placeholder="Новый пароль"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Подтвердите новый пароль"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button onClick={handlePasswordChange}>Изменить пароль</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
