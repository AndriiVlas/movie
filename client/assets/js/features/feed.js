import { api } from '../api.js';
import { UI } from '../ui.js';

export const Feed = {
    currentPage: 1,
    limit: 9,

    init() {
        this.bindEvents();
        this.loadMovies();
    },

    async loadMovies() {
        const container = document.getElementById('movies-feed-list');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('page-info');

        if (!container) return;

        try {
            const movies = await api.getMovies(this.currentPage, this.limit);
            
            UI.renderMoviesList(container, movies, 'Фільмів не знайдено.');

            if (pageInfo) pageInfo.textContent = `Сторінка ${this.currentPage}`;
            
            if (prevBtn) {
                prevBtn.disabled = this.currentPage === 1;
            }

            if (nextBtn) {
                nextBtn.disabled = !movies || movies.length < this.limit;
            }

        } catch (error) {
            console.error('Помилка завантаження стрічки:', error);
            UI.showError(container, 'Не вдалося завантажити стрічку фільмів. Перевірте з\'єднання.');
        }
    },

    bindEvents() {
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        prevBtn?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadMovies();
            }
        });

        nextBtn?.addEventListener('click', () => {
            this.currentPage++;
            this.loadMovies();
        });
    }
};