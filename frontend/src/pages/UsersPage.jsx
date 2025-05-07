import React, { useState, useEffect } from 'react';
import '../styles/UsersPage.css'; // Импортируем стили

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false); // Флаг редактирования

    const emptyForm = {
        username: '',
        password: '',
        role: 'student',
        studentData: {
            name: '',
            last_name: '',
            patronymic: '',
            birth_date: '',
            phone: '',
            email: '',
            address: '',
            university: '',
            faculty: '',
            group_name: '',
            block: '',
            room: '',
            number_ticket: '',
            avatar: '',
            floor: '',
            flooredge: 'left',
        }
    };

    const [formData, setFormData] = useState(emptyForm);

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const formatDate = (isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return date.toLocaleDateString('ru-RU'); // формат: дд.мм.гггг
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
                setFilteredUsers(data);
            } else {
                console.error('Ошибка при запросе');
            }
        } catch (err) {
            console.error('Ошибка при запросе:', err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fieldPlaceholders = {
        name: 'Имя',
        last_name: 'Фамилия',
        patronymic: 'Отчество',
        birth_date: 'Дата рождения',
        phone: 'Телефон',
        email: 'Электронная почта',
        address: 'Адрес',
        university: 'Университет',
        faculty: 'Факультет',
        group_name: 'Группа',
        block: 'Блок',
        room: 'Комната',
        number_ticket: 'Номер студенческого билета',
        avatar: 'Ссылка на аватар',
        floor: 'Этаж',
        flooredge: 'Крыло'
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name in formData.studentData) {
            setFormData({ ...formData, studentData: { ...formData.studentData, [name]: value } });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const res = await fetch('http://localhost:3001/api/add-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            alert('Пользователь успешно добавлен');
            setFormData(emptyForm);
            setShowForm(false);
            fetchUsers();
        } else {
            alert('Ошибка при добавлении');
        }
    };

    const handleDelete = async () => {
        if (!selectedUserId) {
            alert('Выберите пользователя для удаления');
            return;
        }

        if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

        try {
            const res = await fetch(`http://localhost:3001/api/delete-user/${selectedUserId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Пользователь успешно удалён');
                setSelectedUserId(null);
                fetchUsers();
            } else {
                const errorData = await res.json();
                alert(`Ошибка при удалении: ${errorData.error || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            console.error('Ошибка при запросе:', err);
            alert('Ошибка при удалении');
        }
    };

    const handleEdit = () => {
        if (!selectedUserId) {
            alert('Выберите пользователя для редактирования');
            return;
        }

        const userToEdit = users.find(user => user.idUsers === selectedUserId);
        if (!userToEdit) {
            alert('Пользователь не найден');
            return;
        }

        setFormData({
            username: userToEdit.Login,
            password: '', // пароль пустой при редактировании
            role: userToEdit.role,
            studentData: {
                name: userToEdit.name || '',
                last_name: userToEdit.last_name || '',
                patronymic: userToEdit.patronymic || '',
                birth_date: userToEdit.birth_date || '',
                phone: userToEdit.phone || '',
                email: userToEdit.email || '',
                address: userToEdit.address || '',
                university: userToEdit.university || '',
                faculty: userToEdit.faculty || '',
                group_name: userToEdit.group_name || '',
                block: userToEdit.block || '',
                room: userToEdit.room || '',
                number_ticket: userToEdit.number_ticket || '',
                avatar: userToEdit.avatar || '',
                floor: userToEdit.floor || '',
                flooredge: userToEdit.flooredge || 'left',
            }
        });

        setIsEditMode(true);
        setShowForm(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        const updatedData = { ...formData, idUsers: selectedUserId };

        const res = await fetch(`http://localhost:3001/api/update-user/${selectedUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            alert('Пользователь успешно обновлён');
            setFormData(emptyForm);
            setIsEditMode(false);
            setShowForm(false);
            fetchUsers();
        } else {
            alert('Ошибка при обновлении');
        }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        setSortConfig({ key, direction });

        const sortedUsers = [...filteredUsers].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredUsers(sortedUsers);
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        const filtered = users.filter(user => {
            return Object.keys(user).some(key => {
                const value = user[key];
                if (value && typeof value === 'string') {
                    return value.toLowerCase().includes(query);
                }
                if (value && typeof value === 'number') {
                    return value.toString().includes(query);
                }
                return false;
            });
        });

        setFilteredUsers(filtered);
    };

    return (
        <div className="users-page">
            <h2 className="page-title">Список пользователей</h2>

            <div className="button-group">
                <button className="add-user-button" onClick={() => { setShowForm(!showForm); setIsEditMode(false); setFormData(emptyForm); }}>
                    {showForm && !isEditMode ? 'Закрыть форму' : 'Добавить пользователя'}
                </button>
                <button className="edit-user-button" onClick={handleEdit}>
                    Редактировать выбранного пользователя
                </button>
                <button className="delete-user-button" onClick={handleDelete}>
                    Удалить выбранного пользователя
                </button>
            </div>

            <input
                type="text"
                placeholder="Поиск по таблице..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
            />

            {showForm && (
                <form onSubmit={isEditMode ? handleUpdate : handleSubmit} className="user-form">
                    <h3>Учётная запись</h3>
                    <input name="username" value={formData.username} onChange={handleChange} placeholder="Логин" required />
                    <input name="password" value={formData.password} onChange={handleChange} placeholder={isEditMode ? "Пароль (необязательно)" : "Пароль"} type="password" />
                    <select name="role" value={formData.role} onChange={handleChange}>
                        <option value="student">Студент</option>
                        <option value="worker">Сотрудник</option>
                        <option value="admin">Администратор</option>
                    </select>

                    <h3>Данные студента</h3>
                    {Object.keys(emptyForm.studentData).map((key) =>
                    key === 'flooredge' ? (
                        <select name={key} value={formData.studentData[key]} onChange={handleChange} key={key}>
                            <option value="left">Левое крыло</option>
                            <option value="right">Правое крыло</option>
                        </select>
                    ) : (
                        <input
                            key={key}
                            name={key}
                            type={key === 'birth_date' ? 'date' : (['block', 'room', 'number_ticket', 'floor'].includes(key) ? 'number' : 'text')}
                            value={formData.studentData[key]}
                            onChange={handleChange}
                            placeholder={fieldPlaceholders[key] || key}
                        />
                    )
                )}


                    <button type="submit">{isEditMode ? 'Сохранить изменения' : 'Добавить пользователя'}</button>
                </form>
            )}

            <table className="users-table">
                <thead>
                <tr>
                    <th onClick={() => requestSort('Login')}>Логин</th>
                    <th onClick={() => requestSort('role')}>Роль</th>
                    <th onClick={() => requestSort('name')}>Имя</th>
                    <th onClick={() => requestSort('last_name')}>Фамилия</th>
                    <th onClick={() => requestSort('patronymic')}>Отчество</th>
                    <th onClick={() => requestSort('birth_date')}>Дата рождения</th>
                    <th onClick={() => requestSort('phone')}>Телефон</th>
                    <th onClick={() => requestSort('email')}>Email</th>
                    <th onClick={() => requestSort('address')}>Адрес</th>
                    <th onClick={() => requestSort('university')}>Университет</th>
                    <th onClick={() => requestSort('faculty')}>Факультет</th>
                    <th onClick={() => requestSort('group_name')}>Группа</th>
                    <th onClick={() => requestSort('block')}>Блок</th>
                    <th onClick={() => requestSort('room')}>Комната</th>
                    <th onClick={() => requestSort('number_ticket')}>Номер студенческого</th>
                    <th>Аватар</th>
                    <th onClick={() => requestSort('floor')}>Этаж</th>
                    <th onClick={() => requestSort('flooredge')}>Крыло</th>
                </tr>
                </thead>
                <tbody>
                {filteredUsers.map(user => (
                    <tr key={user.idUsers} className={selectedUserId === user.idUsers ? 'selected-row' : ''} onClick={() => setSelectedUserId(user.idUsers)}>
                        <td>{user.Login}</td><td>{user.role}</td><td>{user.name}</td><td>{user.last_name}</td><td>{user.patronymic}</td>
                        <td>{formatDate(user.birth_date)}</td><td>{user.phone}</td><td>{user.email}</td><td>{user.address}</td><td>{user.university}</td>
                        <td>{user.faculty}</td><td>{user.group_name}</td><td>{user.block}</td><td>{user.room}</td><td>{user.number_ticket}</td>
                        <td>{user.avatar ? <img src={`http://localhost:3001/uploads/avatars/${user.avatar}`} alt="avatar" className="avatar-img" /> : 'Нет фото'}</td>

                        <td>{user.floor}</td><td>{user.flooredge}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default UsersPage;
