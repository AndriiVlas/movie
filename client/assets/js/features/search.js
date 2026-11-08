import { api } from '../api.js';
import { UI } from '../ui.js';
import { ViewManager } from '../viewManager.js';

export const Search = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('search-movie-form')?.addEventListener('submit', this.handleSearchMovie.bind(this));
        document.getElementById('search-related-form')?.addEventListener('submit', this.handleSearchRelated.bind(this));
        document.getElementById('search-person-form')?.addEventListener('submit', this.handleSearchPerson.bind(this));
    },

    bindBackButton(container, inputToClearId = null) {
        const backBtn = container.querySelector('.js-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                ViewManager.show('search-section');
                if (inputToClearId) {
                    const input = document.getElementById(inputToClearId);
                    if (input) input.value = '';
                }
            });
        }
    },


    // Пошук детальної інформації про фільм
    async handleSearchMovie(e) {
        e.preventDefault();
        const inputId = 'search-movie-input';
        const title = document.getElementById(inputId).value.trim();
        if (!title) return;

        const container = document.getElementById('movie-details-section');
        ViewManager.show('movie-details-section');
        container.innerHTML = '<p>Завантаження...</p>';

        try {
            const movie = await api.getMovieByTitle(title);
            container.innerHTML = UI.createMovieDetailsHTML(movie);
        } catch (error) {
            UI.showError(container, error.message);
        } finally {
            this.bindBackButton(container, inputId);
        }
    },

    // Пошук фільмографії персони
    async handleSearchRelated(e) {
        e.preventDefault();
        const inputId = 'search-related-input';
        const title = document.getElementById(inputId).value.trim();
        const rel = document.getElementById('search-related-select').value;
        if (!title || !rel) return;

        const container = document.getElementById('related-movies-list');
        ViewManager.show('related-movies-section');
        container.innerHTML = '<p>Завантаження...</p>';

        try {
            const data = await api.getRelatedMovies(title, rel);
            UI.renderMoviesList(container, data.related, 'Схожих фільмів не знайдено.', true);
        } catch (error) {
            UI.showError(container, error.message);
        } finally {
            this.bindBackButton(container, inputId);
        }
    },

    // Пошук фільмів з тими самими людьми
    async handleSearchPerson(e) {
        e.preventDefault();
        const inputId = 'search-person-input';
        const name = document.getElementById(inputId).value.trim();
        const rel = document.getElementById('search-person-select').value;
        if (!name || !rel) return;

        const container = document.getElementById('person-movies-list');
        ViewManager.show('person-movies-section');
        container.innerHTML = '<p>Завантаження...</p>';

        try {
            const movies = await api.getSamePersonMovies(name, rel);
            UI.renderMoviesList(container, movies, 'Фільмів для цієї персони не знайдено.', true);
        } catch (error) {
            UI.showError(container, error.message);
        } finally {
            this.bindBackButton(container, inputId);
        }
    },

    addBackToSearchButton(container) {
        const btn = document.createElement('button');
        btn.textContent = 'Повернутися до пошуку';
        btn.className = 'movie-info__back-btn';
        btn.style.marginTop = '15px';
        btn.addEventListener('click', () => ViewManager.show('search-section'));
        container.appendChild(btn);
    }
};