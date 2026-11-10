export const UI = {
    createMovieCardHTML(movie) {
        const title = movie.title || 'Невідома назва';
        const released = movie.released || 'Рік невідомий';
        const tagline = movie.tagline || '';

        return `
            <article class="movie-card">
                <h3 class="movie-card__title">${title}</h3>
                <p class="movie-card__year">Рік: <span>${released}</span></p>
                ${tagline ? `<p class="movie-card__tagline"><em>"${tagline}"</em></p>` : ''}
            </article>
        `;
    },

    createMovieDetailsHTML(movie) {
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

        return `
            <article class="movie-info">
                <h2 class="movie-info__title">${title}</h2>
                <p class="movie-info__year"><strong>Рік випуску:</strong> <span>${released}</span></p>
                ${tagline ? `<p class="movie-info__tagline"><em>"${tagline}"</em></p>` : ''}
                ${extraDetailsHTML ? `<div class="movie-info__extras" style="margin-top: 15px;">${extraDetailsHTML}</div>` : ''}
            </article>
            <button class="movie-back-btn js-back-btn">Повернутися до пошуку</button>
        `;
    },

    renderMoviesList(container, movies, emptyMessage = 'Фільмів не знайдено.', showBackButton = false) {
        if (!container) return;
        
        let html = '';

        if (!movies || movies.length === 0) {
            html = `<p class="empty-message">${emptyMessage}</p>`;
        } else {
            html = `
                <div class="grid-container">
                    ${movies.map(movie => this.createMovieCardHTML(movie)).join('')}
                </div>
            `;
        }

        if (showBackButton) {
            html += `<button class="movie-back-btn js-back-btn">Повернутися до пошуку</button>`;
        }

        container.innerHTML = html;
    },

    showError(container, message) {
        if (!container) return;
        container.innerHTML = `
            <div class="error-message"><p>${message}</p></div>
            <button class="movie-back-btn js-back-btn">Повернутися до пошуку</button>
        `;
    }
};