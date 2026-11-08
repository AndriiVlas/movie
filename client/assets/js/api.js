const API_BASE = '/api';

export const api = {
    // Стрічка фільмів
    async getMovies(page = 1, limit = 10) {
        const res = await fetch(`${API_BASE}/movie?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error('Не вдалося завантажити стрічку фільмів');
        return res.json();
    },

    // Пошук фільму за назвою з отриманням інформації про режесерів, акторів, сценаристів тощо
    async getMovieByTitle(title) {
        const res = await fetch(`${API_BASE}/movie/${encodeURIComponent(title)}`);
        if (res.status === 404) throw new Error('Фільм не знайдено');
        if (!res.ok) throw new Error('Помилка завантаження фільму');
        return res.json();
    },

    // Пошук фільмів за тими самими акторами/режисерами/продюсерами тощо
    async getRelatedMovies(title, rel) {
        const res = await fetch(`${API_BASE}/movie/related/${encodeURIComponent(title)}/${encodeURIComponent(rel)}`);
        if (res.status === 404) throw new Error('Схожих фільмів не знайдено');
        if (!res.ok) throw new Error('Помилка завантаження схожих фільмів');
        return res.json();
    },

    // Пошук фільмів за фільмом з тими самими акторами/режисерами/продюсерами тощо
    async getSamePersonMovies(name, rel) {
        const res = await fetch(`${API_BASE}/movie/${encodeURIComponent(rel)}/${encodeURIComponent(name)}`);
        if (res.status === 404) throw new Error('Фільмів для цієї персони не знайдено');
        if (!res.ok) throw new Error('Помилка завантаження фільмографії');
        return res.json();
    },


    // Додавання нового фільму
    async createMovie(data) {
        const res = await fetch(`${API_BASE}/movie`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Не вдалося створити фільм');
        return result;
    },

    // Додавання нової людини
    async createPerson(data) {
        const res = await fetch(`${API_BASE}/person`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Не вдалося створити персону');
        return result;
    },

    // Додавання зв'язку людини з фільмом
    async createLink(data) {
        const res = await fetch(`${API_BASE}/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Не вдалося створити зв\'язок');
        return result;
    }
};