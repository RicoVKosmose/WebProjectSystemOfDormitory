import React, { useState, useEffect } from 'react';
import '../styles/news.css';

const NewsPage = () => {
    const [newsList, setNewsList] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);

    const fetchNews = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/news');
            const data = await res.json();
            setNewsList(data);
        } catch (err) {
            console.error('Ошибка загрузки новостей:', err);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (image) {
            formData.append('image', image);
        }

        const res = await fetch('http://localhost:3001/api/add-news', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            alert('Новость добавлена');
            setTitle('');
            setContent('');
            setImage(null);
            fetchNews();
        } else {
            alert('Ошибка при добавлении новости');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить эту новость?')) return;
        const res = await fetch(`http://localhost:3001/api/news/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert('Новость удалена');
            fetchNews();
        } else {
            alert('Ошибка при удалении');
        }
    };

    return (
        <div className="news-page">
            <h2>Новости</h2>

            <form onSubmit={handleSubmit} className="news-form">
                <input
                    type="text"
                    placeholder="Заголовок"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Текст новости"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                ></textarea>
                <label htmlFor="file-upload">Выбрать файл</label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                />
                {image && <span className="file-name">{image.name}</span>}
                <button type="submit">Добавить новость</button>
            </form>

            <h3>Архив новостей</h3>
            <div className="news-archive">
                {newsList.map(news => (
                    <div key={news.id} className="news-item">
                        <h4>{news.title}</h4>
                        <p>{news.content}</p>
                        {news.image && <img src={`http://localhost:3001${news.image}`} alt="Новость" />}
                        <small>Добавлено: {new Date(news.created_at).toLocaleString()}</small>
                        <button onClick={() => handleDelete(news.id)}>Удалить</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NewsPage;
