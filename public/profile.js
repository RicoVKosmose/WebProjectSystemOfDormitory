async function loadProfile() {
    try {
        const res = await fetch("/api/student-profile", { credentials: "include" });
        if (!res.ok) throw new Error("Ошибка загрузки профиля");

        const student = await res.json();
        const avatarPath = student.avatar ? `uploads/${student.avatar}` : "images/avatar.png";

        // Обновляем только аватар
        const avatarImg = document.querySelector(".avatar");
        if (avatarImg) avatarImg.src = avatarPath;

        // Обновляем данные профиля
        document.getElementById("profile-info").innerHTML = `
            <h2>${student.last_name} ${student.name} ${student.patronymic ?? ''}</h2>
            <p><strong>Блок:</strong> ${student.block ?? '-'}</p>
            <p><strong>Комната:</strong> ${student.room ?? '-'}</p>
            <p><strong>Дата рождения:</strong> ${formatDate(student.birth_date)}</p>
            <p><strong>Телефон:</strong> ${student.phone ?? '-'}</p>
            <p><strong>Email:</strong> ${student.email ?? '-'}</p>
            <p><strong>Факультет:</strong> ${student.faculty ?? '-'}</p>
            <p><strong>Группа:</strong> ${student.group_name ?? '-'}</p>
        `;
    } catch (err) {
        console.error(err);
        document.getElementById("profile-info").innerHTML = `<p>❌ Ошибка загрузки профиля</p>`;
    }
}

// Обработчик формы загрузки аватарки
document.getElementById("avatarForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
        credentials: "include"
    });

    const result = await res.json();
    if (res.ok) {
        alert("✅ Аватарка загружена!");
        loadProfile();
    } else {
        alert("❌ Ошибка: " + result.error);
    }
});

// Форматирование даты
function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU");
}

loadProfile();
