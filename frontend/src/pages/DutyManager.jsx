import React, { useEffect, useState } from 'react';
import '../styles/admin.css';


const DutyManager = () => {
    const [photos, setPhotos] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/duty-photos', { credentials: 'include' });
                const data = await res.json();
                console.log(data)
                if (data.photos) {
                    setPhotos(data.photos);
                }
            } catch (err) {
                console.error('Ошибка при загрузке duty-фотографий:', err);
            }
        })();
    }, []);

    const handleUpload = async (file, wing, floor) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('fluredge', wing);
        formData.append('floor', floor);

        try {
            const res = await fetch('/api/upload-duty-photo', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                const newPhoto = {
                    fluredge: wing,
                    floor: floor,
                    url: `http://localhost:3001/uploads/duty/${wing}_${floor}.jpg?${Date.now()}`
                };
                setPhotos((prev) => [...prev, newPhoto]); // Добавляем новое фото в массив
            } else {
                alert('Ошибка при загрузке фото');
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка соединения с сервером');
        }
    };

    const handleDelete = async (wing, floor) => {
        if (!window.confirm('Удалить фото?')) return;

        try {
            const res = await fetch('/api/delete-duty-photo', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fluredge: wing, floor }),
            });
            const data = await res.json();
            if (data.success) {
                setPhotos((prev) => prev.filter((photo) => !(photo.fluredge === wing && photo.floor === floor)));
            } else {
                alert('Ошибка при удалении: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка соединения с сервером');
        }
    };

    const renderFloors = (wing) => {
        return Array.from({ length: 5 }, (_, i) => i + 1).map((floor) => {
            const photo = photos.find((p) => p.fluredge == wing && p.floor == floor);

            const handleFileSelect = async (e, wing, floor) => {
                const file = e.target.files[0];
                if (file) {
                    await handleUpload(file, wing, floor); // Ожидание выполнения handleUpload
                }
            };

            return (
                <div key={floor} className="floor">
                    <h3>{floor} этаж</h3>
                    <img src={photo?.url || null} alt="Нет изображения" className="preview" />
                    <input
                        type="file"
                        accept="image/*"
                        id={`file-input-${wing}-${floor}`}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileSelect(e, wing, floor)}
                    />
                    <button
                        onClick={() => document.getElementById(`file-input-${wing}-${floor}`).click()}
                    >
                        Загрузить фото
                    </button>
                    <div className="button-group">
                        <button onClick={() => handleDelete(wing, floor)}>Удалить фото</button>
                    </div>
                </div>
            );
        });
    };

    return (
        <main className="duty-manager-content">
            <section className="wing">
                <h2>Левое крыло</h2>
                <div className="floor-blocks">{renderFloors('left')}</div>
            </section>
            <section className="wing">
                <h2>Правое крыло</h2>
                <div className="floor-blocks">{renderFloors('right')}</div>
            </section>
        </main>
    );
};

export default DutyManager;