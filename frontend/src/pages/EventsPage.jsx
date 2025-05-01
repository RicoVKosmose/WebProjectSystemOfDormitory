import React, { useState, useEffect } from 'react';
import '../styles/events.css';

const EventsPage = () => {
    const [eventsList, setEventsList] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);  // Для редактируемого события

    const fetchEvents = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/events');
            const data = await res.json();
            setEventsList(data);
        } catch (err) {
            console.error('Ошибка загрузки мероприятий:', err);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const eventData = { title, description, date, time };
        const url = editingEvent ? `http://localhost:3001/api/events/${editingEvent.id}` : 'http://localhost:3001/api/add-event';
        const method = editingEvent ? 'PUT' : 'POST';  // PUT для обновления

        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });

        if (res.ok) {
            alert(editingEvent ? 'Мероприятие обновлено' : 'Мероприятие добавлено');
            setTitle('');
            setDescription('');
            setDate('');
            setTime('');
            setEditingEvent(null);  // Очищаем состояние редактирования
            fetchEvents();
        } else {
            alert('Ошибка при добавлении/обновлении мероприятия');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить это мероприятие?')) return;
        const res = await fetch(`http://localhost:3001/api/events/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            alert('Мероприятие удалено');
            fetchEvents();
        } else {
            alert('Ошибка при удалении');
        }
    };

    const handleEdit = (id) => {
        const event = eventsList.find((event) => event.id === id);
        setTitle(event.title);
        setDescription(event.description);
        setDate(event.date);
        setTime(event.time);
        setEditingEvent(event); // Устанавливаем состояние для редактируемого мероприятия
    };

    return (
        <div className="events-page">
            <h2>{editingEvent ? 'Редактировать мероприятие' : 'Добавить мероприятие'}</h2>

            <form onSubmit={handleSubmit} className="events-form">
                <input
                    type="text"
                    placeholder="Название мероприятия"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Описание мероприятия"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                />
                <button type="submit">{editingEvent ? 'Сохранить изменения' : 'Добавить мероприятие'}</button>
            </form>

            <h3>Архив мероприятий</h3>
            <div className="events-archive">
                <div className="events-header">
                    <span>Название</span>
                    <span>Дата</span>
                    <span>Время</span>
                    <span>Описание</span>
                    <span>Действия</span>
                </div>
                {eventsList.map((event) => (
                    <div key={event.id} className="event-item">
                        <span>{event.title}</span>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                        <span>{event.time}</span>
                        <span>{event.description}</span>
                        <span>
                            <button onClick={() => handleEdit(event.id)}>Редактировать</button>
                            <button onClick={() => handleDelete(event.id)}>Удалить</button>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventsPage;
