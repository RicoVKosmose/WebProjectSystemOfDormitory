import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import DutyManager from './pages/DutyManager';
import UsersPage from "./pages/UsersPage";
import NewsPage from './pages/NewsPage';
import EventPage from './pages/EventsPage';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/student" element={<StudentPage />} />
                <Route path="/" element={<LoginPage />} />
                <Route path="/admin" element={<AdminPage />}>
                    <Route path="duty-manager" element={<DutyManager />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="news" element={<NewsPage />} />
                    <Route path="events" element={<EventPage />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;