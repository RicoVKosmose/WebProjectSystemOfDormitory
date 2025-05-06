import React, { useEffect, useState } from "react";
import '../styles/Requests.css';

export default function RequestsPage() {
    const [requests, setRequests] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

    useEffect(() => {
        fetch("/api/repair-requests")
            .then((res) => res.json())
            .then((data) => setRequests(data));
    }, []);

    const updateStatus = (id, newStatus) => {
        fetch(`/api/update-request-status/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        }).then(() => {
            setRequests((prev) =>
                prev.map((req) =>
                    req.request_id === id ? { ...req, status: newStatus } : req
                )
            );
        });
    };

    const deleteRequest = (id) => {
        // Подтверждение перед удалением
        const confirmed = window.confirm("Вы уверены, что хотите удалить эту заявку?");
        if (!confirmed) return;

        // Запрос на удаление
        fetch(`/api/delete-request/${id}`, {
            method: "DELETE",
        }).then((res) => {
            if (res.ok) {
                // Обновление состояния после успешного удаления
                setRequests((prev) => prev.filter((req) => req.request_id !== id));
            } else {
                alert('Ошибка при удалении заявки');
            }
        });
    };

    const sortData = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }

        const sortedRequests = [...requests].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });

        setRequests(sortedRequests);
        setSortConfig({ key, direction });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'В ожидании':
                return 'status-pending'; // оранжевый
            case 'В процессе':
                return 'status-in-progress'; // синий
            case 'Выполнено':
                return 'status-completed'; // зелёный
            default:
                return '';
        }
    };

    return (
        <div className="requests-container">
            <h2 className="requests-title">Заявки на ремонт</h2>
            <div className="table-wrapper">
                <table className="requests-table">
                    <thead>
                    <tr>
                        <th
                            onClick={() => sortData('last_name')}
                            className={sortConfig.key === 'last_name' ? (sortConfig.direction === 'ascending' ? 'sorted-ascending' : 'sorted-descending') : ''}
                        >
                            ФИО
                        </th>
                        <th
                            onClick={() => sortData('block')}
                            className={sortConfig.key === 'block' ? (sortConfig.direction === 'ascending' ? 'sorted-ascending' : 'sorted-descending') : ''}
                        >
                            Блок/Комната
                        </th>
                        <th
                            onClick={() => sortData('flooredge')}
                            className={sortConfig.key === 'flooredge' ? (sortConfig.direction === 'ascending' ? 'sorted-ascending' : 'sorted-descending') : ''}
                        >
                            Крыло
                        </th>
                        <th
                            onClick={() => sortData('description')}
                            className={sortConfig.key === 'description' ? (sortConfig.direction === 'ascending' ? 'sorted-ascending' : 'sorted-descending') : ''}
                        >
                            Описание
                        </th>
                        <th
                            onClick={() => sortData('created_at')}
                            className={sortConfig.key === 'created_at' ? (sortConfig.direction === 'ascending' ? 'sorted-ascending' : 'sorted-descending') : ''}
                        >
                            Дата и время
                        </th>
                        <th
                            onClick={() => sortData('status')}
                            className={sortConfig.key === 'status' ? (sortConfig.direction === 'ascending' ? 'sorted-ascending' : 'sorted-descending') : ''}
                        >
                            Статус
                        </th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {requests.map((req) => (
                        <tr key={req.request_id}>
                            <td>{req.last_name} {req.name} {req.patronymic}</td>
                            <td>{req.block}/{req.room}</td>
                            <td>{req.flooredge}</td>
                            <td>{req.description}</td>
                            <td>{new Date(req.created_at).toLocaleString()}</td>
                            <td>
                                <span className={`status-badge ${getStatusClass(req.status)}`}>
                                    {req.status}
                                </span>
                            </td>
                            <td>
                                <select
                                    className="status-select"
                                    value={req.status}
                                    onChange={(e) =>
                                        updateStatus(req.request_id, e.target.value)
                                    }
                                >
                                    <option>В ожидании</option>
                                    <option>В процессе</option>
                                    <option>Выполнено</option>
                                </select>
                                <button
                                    className="delete-button"
                                    onClick={() => deleteRequest(req.request_id)}
                                >
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
