const API_BASE = '/api';

const IndexPage = {
    currentPage: 1,

    init() {
        this.loadMovies();
        this.bindPagination();
        this.bindSearchMovie();
        this.bindSearchRelatedMovies();
        this.bindSearchSamePersonMovies();
    },

    async loadMovies() {
        const container = document.getElementById('movies-feed-list');
        if (!container) return;

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 10
            });
            const res = await fetch(`${API_BASE}/movie?${params}`);
            if (!res.ok) throw new Error();
            const movies = await res.json();
            this.renderMovies(movies);

            const prevBtn = document.getElementById('prevPageBtn');
            if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        } catch (error) {
            console.error('Помилка завантаження:', error);
            container.innerHTML = `<p class="feed__empty">Не вдалося завантажити матеріали.</p>`;
        }
    },

    async loadMovie() {
        const container = document.getElementById('movie-details-section');
        const titleInput = document.getElementById('search-movie-input');

        if (!container || !titleInput) return;

        const title = titleInput.value.trim();

        if (!title) return;

        try {
            const res = await fetch(`${API_BASE}/movie/${encodeURIComponent(title)}`);
            if (!res.ok) throw new Error();
            const movie = await res.json();
            this.renderMovie(movie);
        } catch (error) {
            console.error('Помилка завантаження:', error);
            container.innerHTML = `<p class="feed__empty">Не вдалося завантажити матеріали.</p>`;
        }
    },

    async loadRelatedMovies() {
        const container = document.getElementById('related-movies-section');
        const titleInput = document.getElementById('search-related-input');
        const relSelect = document.getElementById('search-related-select');

        if (!container || !titleInput || !relSelect) return;

        const title = titleInput.value.trim();
        const rel = relSelect.value;

        if (!title || !rel) return;

        try {
            const res = await fetch(`${API_BASE}/movie/related/${encodeURIComponent(title)}/${encodeURIComponent(rel)}`);
            if (!res.ok) throw new Error();
            const movies = await res.json();
            this.renderRelatedMovies(movies.related);
        } catch (error) {
            console.error('Помилка завантаження:', error);
            container.innerHTML = `<p class="feed__empty">Не вдалося завантажити матеріали.</p>`;
        }

    },

    async loadSamePersonMovies() {
        const container = document.getElementById('person-movies-section');
        const nameInput = document.getElementById('search-person-input');
        const relSelect = document.getElementById('search-person-select');
        
        if (!container || !nameInput || !relSelect) return;

        const name = nameInput.value.trim();
        const rel = relSelect.value;
        
        if (!name || !rel) return;

        try {
            const res = await fetch(`${API_BASE}/movie/${encodeURIComponent(rel)}/${encodeURIComponent(name)}`);
            if (!res.ok) throw new Error('Помилка мережі або запиту');
            
            const movies = await res.json();
            this.renderSamePersonMovies(movies);
        } catch (error) {
            console.error('Помилка завантаження фільмів за участю персони:', error);
            this.renderSamePersonMovies([]); 
        }
    },



    renderMovies(movies) {
        const container = document.getElementById("movies-feed-list");
        if (!container) return;

        container.innerHTML = '';

        if (!movies || movies.length === 0) {
            container.innerHTML = `<p class="movies-feed__empty">Фільмів не знайдено.</p>`;
            const nextBtn = document.getElementById('nextPageBtn');
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        const moviesHTML = movies.map(movie => {
            const title = movie.title || 'Невідома назва';
            const released = movie.released || 'Рік невідомий';
            const tagline = movie.tagline || '';

            return `
                <article class="movie-card movies-feed__item">
                    <h3 class="movie-card__title">${title}</h3>
                    <p class="movie-card__year">Рік: <span>${released}</span></p>
                    ${tagline ? `<p class="movie-card__tagline"><em>"${tagline}"</em></p>` : ''}
                </article>
            `;
        }).join('');

        container.innerHTML = moviesHTML;

        const pageInfo = document.getElementById('page-info');
        if (pageInfo) pageInfo.textContent = `Сторінка ${this.currentPage}`;

        const nextBtn = document.getElementById('nextPageBtn');
        if (nextBtn) {
            nextBtn.disabled = movies.length < 10;
        }
    },

    renderMovie(movie) {
        const detailsSection = document.getElementById('movie-details-section');
        const feedSection = document.getElementById('movies-feed-section');

        if (!detailsSection) return;

        if (feedSection) feedSection.hidden = true;
        detailsSection.hidden = false;

        if (!movie || Object.keys(movie).length === 0) {
            detailsSection.innerHTML = `
                <div class="movie-details__error">
                    <p>Фільм не знайдено.</p>
                    <button class="movie-details__back-btn" id="back-to-feed-btn">Повернутися до списку</button>
                </div>
            `;
        } else {
            const title = movie.title || 'Невідома назва';
            const released = movie.released || 'Невідомо';
            const tagline = movie.tagline || '';

            const excludeKeys = ['title', 'released', 'tagline'];
            const extraDetailsHTML = Object.entries(movie)
                .filter(([key, value]) => {
                    if (excludeKeys.includes(key) || value == null || value === '') return false;
                    if (Array.isArray(value) && value.length === 0) return false;
                    return true;
                })
                .map(([key, value]) => {
                    const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
                    let displayValue = value;

                    if (Array.isArray(value)) {
                        displayValue = value.map(item => {
                            if (typeof item === 'object' && item !== null && item.name) {
                                return item.roles ? `${item.name} (${item.roles.join(', ')})` : item.name;
                            }
                            return item;
                        }).join(', ');
                    }

                    return `<p class="movie-info__detail"><strong>${formattedKey}:</strong> ${displayValue}</p>`;
                })
                .join('');

            detailsSection.innerHTML = `
                <article class="movie-info">
                    <h2 class="movie-info__title">${title}</h2>
                    <p class="movie-info__year"><strong>Рік випуску:</strong> <span>${released}</span></p>
                    ${tagline ? `<p class="movie-info__tagline"><em>"${tagline}"</em></p>` : ''}
                    ${extraDetailsHTML ? `<div class="movie-info__extras">${extraDetailsHTML}</div>` : ''}
                    <button class="movie-info__back-btn" id="back-to-feed-btn">Повернутися до списку</button>
                </article>
            `;
        }

        document.getElementById('back-to-feed-btn')?.addEventListener('click', () => {
            detailsSection.hidden = true;
            if (feedSection) feedSection.hidden = false;

            const searchInput = document.getElementById('search-movie-input');
            if (searchInput) searchInput.value = '';
        });
    },

    renderRelatedMovies(movies) {
        const section = document.getElementById('related-movies-section');
        const listContainer = document.getElementById('related-movies-list');
        const feedSection = document.getElementById('movies-feed-section');
        const detailsSection = document.getElementById('movie-details-section');

        if (!section || !listContainer) return;

        if (feedSection) feedSection.hidden = true;
        if (detailsSection) detailsSection.hidden = true;
        section.hidden = false;

        if (!movies || movies.length === 0) {
            listContainer.innerHTML = `
                <div class="movie-results__error">
                    <p>Схожих фільмів не знайдено.</p>
                    <button class="movie-results__back-btn" id="back-from-related-btn">Повернутися до стрічки</button>
                </div>
            `;
        } else {
            const moviesHTML = movies.map(movie => {
                const title = movie.title || 'Невідома назва';
                const released = movie.released || 'Рік невідомий';
                const tagline = movie.tagline || '';
                return `
                    <article class="movie-card movie-results__item">
                        <h3 class="movie-card__title">${title}</h3>
                        <p class="movie-card__year">Рік: <span>${released}</span></p>
                        ${tagline ? `<p class="movie-card__tagline"><em>"${tagline}"</em></p>` : ''}
                    </article>
                `;
            }).join('');
            listContainer.innerHTML = `
                ${moviesHTML}
                <div class="movie-results__actions" style="margin-top: 20px;">
                    <button class="movie-results__back-btn" id="back-from-related-btn">Повернутися до стрічки</button>
                </div>
            `;
        }

        document.getElementById('back-from-related-btn')?.addEventListener('click', () => {
            section.hidden = true;
            if (feedSection) feedSection.hidden = false;
            const titleInput = document.getElementById('search-related-input');
            if (titleInput) titleInput.value = '';
        });
    },

    renderSamePersonMovies(movies) {
        const section = document.getElementById('person-movies-section');
        const listContainer = document.getElementById('person-movies-list');
        const feedSection = document.getElementById('movies-feed-section');
        const detailsSection = document.getElementById('movie-details-section');
        const relatedSection = document.getElementById('related-movies-section');

        if (!section || !listContainer) return;

        if (feedSection) feedSection.hidden = true;
        if (detailsSection) detailsSection.hidden = true;
        if (relatedSection) relatedSection.hidden = true;
        section.hidden = false;

        if (!movies || movies.length === 0) {
            listContainer.innerHTML = `
                <div class="movie-results__error">
                    <p>Фільмів за участю цієї персони не знайдено.</p>
                    <button class="movie-results__back-btn" id="back-from-person-btn">Повернутися до стрічки</button>
                </div>
            `;
        } else {
            const moviesHTML = movies.map(movie => {
                const title = movie.title || 'Невідома назва';
                const released = movie.released || 'Рік невідомий';
                const tagline = movie.tagline || '';

                return `
                    <article class="movie-card movie-results__item">
                        <h3 class="movie-card__title">${title}</h3>
                        <p class="movie-card__year">Рік: <span>${released}</span></p>
                        ${tagline ? `<p class="movie-card__tagline"><em>"${tagline}"</em></p>` : ''}
                    </article>
                `;
            }).join('');

            listContainer.innerHTML = `
                ${moviesHTML}
                <div class="movie-results__actions" style="margin-top: 20px;">
                    <button class="movie-results__back-btn" id="back-from-person-btn">Повернутися до стрічки</button>
                </div>
            `;
        }

        document.getElementById('back-from-person-btn')?.addEventListener('click', () => {
            section.hidden = true;
            if (feedSection) feedSection.hidden = false;
            
            const nameInput = document.getElementById('search-person-input');
            if (nameInput) nameInput.value = '';
        });
    },



    bindPagination() {
        document.getElementById('prevPageBtn')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadMovies();
            }
        });

        document.getElementById('nextPageBtn')?.addEventListener('click', (e) => {
            if (!e.target.disabled) {
                this.currentPage++;
                this.loadMovies();
            }
        })
    },

    bindSearchMovie() {
        const form = document.getElementById('search-movie-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.loadMovie();
        });
    },

    bindSearchRelatedMovies() {
        const form = document.getElementById('search-related-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.loadRelatedMovies();
        });
    },

    bindSearchSamePersonMovies() {
        const form = document.getElementById('search-person-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.loadSamePersonMovies();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => IndexPage.init());