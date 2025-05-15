import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import DutyManager from './pages/DutyManager';
import UsersPage from "./pages/UsersPage";
import NewsPage from './pages/NewsPage';
import EventPage from './pages/EventsPage';
import WorkedHoursPage from "./pages/WorkedHoursPage";
import RequestsPage from "./pages/RequestsPage";
import WorkerPage from "./pages/WorkerPage";
import Profile from './pages/Profile';

const BodyClassController = () => {
    const location = useLocation();

    useEffect(() => {
        // Удаляем предыдущие классы
        document.body.classList.remove('admin-body', 'student-body');

        if (location.pathname.startsWith('/admin')) {
            document.body.classList.add('admin-body');
        } else if (location.pathname.startsWith('/student')) {
            document.body.classList.add('student-body');
        }

        // Очистка классов при размонтировании (опционально)
        return () => {
            document.body.classList.remove('admin-body', 'student-body');
        };
    }, [location]);

    return null; // компонент не рендерит ничего
};

const App = () => {
    return (
        <Router>
            <BodyClassController /> {/* Подключаем сюда */}
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/student" element={<StudentPage />} />
                <Route path="/worker" element={<WorkerPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/" element={<LoginPage />} />
                <Route path="/admin" element={<AdminPage />}>
                    <Route path="duty-manager" element={<DutyManager />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="news" element={<NewsPage />} />
                    <Route path="events" element={<EventPage />} />
                    <Route path="workedhours" element={<WorkedHoursPage />} />
                    <Route path="requests" element={<RequestsPage />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;
