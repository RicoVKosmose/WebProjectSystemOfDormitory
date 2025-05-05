import React, { useState, useEffect } from 'react';
import '../styles/workedHours.css';

const WorkedHoursPage = () => {
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');

    // Функция для получения данных с сервера
    const fetchData = async () => {
        const res = await fetch('http://localhost:3001/api/worked-hours');
        const json = await res.json();
        setData(json);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Функция для обновления часов
    const handleUpdateHours = async (student_id, delta, description) => {
        const res = await fetch('http://localhost:3001/api/worked-hours/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id, delta, description }),
        });
        if (res.ok) {
            fetchData();  // Обновляем данные после отправки
        } else {
            alert('Ошибка при обновлении часов');
        }
    };

    // Очистить описание
    const handleClearDescription = async (student_id) => {
        const res = await fetch('http://localhost:3001/api/worked-hours/clear-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id }),
        });
        if (res.ok) {
            fetchData();
        } else {
            alert('Ошибка при очистке описания');
        }
    };

    // Очистить все часы у всех студентов
    const handleClearAllHours = async () => {
        if (window.confirm('Действительно очистить все часы и описания у всех студентов?')) {
            const res = await fetch('http://localhost:3001/api/worked-hours/clear-all', {
                method: 'POST'
            });
            if (res.ok) {
                fetchData();
            } else {
                alert('Ошибка при очистке данных');
            }
        }
    };

    // Уменьшить часы у студентов с 25+ часами
    const handleReduceOver25Hours = async () => {
        const res = await fetch('http://localhost:3001/api/worked-hours/reduce-over-25', {
            method: 'POST',
        });
        if (res.ok) {
            fetchData();
        } else {
            alert('Ошибка при уменьшении часов у студентов');
        }
    };

    // Фильтрация данных по строкам поиска
    const filteredData = data.filter((item) => {
        const fullSearch = (`${item.last_name} ${item.name} ${item.patronymic}` + item.block + item.room + item.flooredge)
            .toLowerCase()
            .includes(search.toLowerCase()) || item.hours.toString().includes(search);
        return fullSearch;
    });

    return (
        <div className="worked-hours-page">
            <h2>Отработанные часы</h2>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Поиск по ФИО, деталям и количеству часов..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="actions-container">
                <button onClick={handleClearAllHours} className="action-button">
                    Очистить все часы
                </button>
                <button onClick={handleReduceOver25Hours} className="action-button">
                    Уменьшить часы у студентов с 25+ часами
                </button>
            </div>

            <div className="table-header">
                <span>ФИО</span>
                <span>Блок/Комната</span>
                <span>Крыло</span>
                <span>Часы</span>
                <span>Описание</span>
                <span>Действия</span>
            </div>

            {filteredData.map((student) => (
                <div key={student.student_id} className="table-row">
                    <span>{`${student.last_name} ${student.name} ${student.patronymic}`}</span>
                    <span>{`${student.block}/${student.room}`}</span>
                    <span>{student.flooredge === 'left' ? 'Левое' : 'Правое'}</span>
                    <span style={{ color: student.hours >= 24 ? 'green' : 'black' }}>
                        {student.hours}
                    </span>
                    <span>{student.description}</span>
                    <span>
                        <button onClick={() => {
                            const hours = prompt('Сколько часов добавить?', 1);
                            const desc = prompt('Описание действия:', 'Добавлены часы');
                            if (desc && hours) {
                                handleUpdateHours(student.student_id, Number(hours), desc);
                            }
                        }}>+</button>
                        <button onClick={() => {
                            const hours = prompt('Сколько часов убавить?', 1);
                            const desc = prompt('Описание действия:', 'Убавлены часы');
                            if (desc && hours) {
                                handleUpdateHours(student.student_id, -Number(hours), desc);
                            }
                        }}>–</button>
                        <button onClick={() => handleClearDescription(student.student_id)}>Очистить описание</button>
                    </span>
                </div>
            ))}
        </div>
    );
};

export default WorkedHoursPage;
