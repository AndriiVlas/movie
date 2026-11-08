import { api } from '../api.js';

export const Admin = {
    init() {
        this.bindEvents();
        this.toggleRolesField();
    },

    bindEvents() {
        document.getElementById('add-movie-form')?.addEventListener('submit', this.handleAddMovie.bind(this));
        document.getElementById('add-person-form')?.addEventListener('submit', this.handleAddPerson.bind(this));
        document.getElementById('add-link-form')?.addEventListener('submit', this.handleAddLink.bind(this));

        document.getElementById('link-type')?.addEventListener('change', this.toggleRolesField.bind(this));
    },

    async handleAddMovie(e) {
        e.preventDefault();
        const form = e.target;
        
        const title = document.getElementById('movie-title').value;
        const released = document.getElementById('movie-released').value;
        const tagline = document.getElementById('movie-tagline').value;

        try {
            const payload = { title };
            if (released) payload.released = released;
            if (tagline) payload.tagline = tagline;

            await api.createMovie(payload);
            
            alert(`Фільм "${title}" успішно додано!`);
            form.reset();
        } catch (error) {
            alert(`Помилка: ${error.message}`);
        }
    },

    async handleAddPerson(e) {
        e.preventDefault();
        const form = e.target;
        
        const name = document.getElementById('person-name').value;
        const born = document.getElementById('person-born').value;

        try {
            const payload = { name };
            if (born) payload.born = born;

            await api.createPerson(payload);
            
            alert(`Персону "${name}" успішно додано!`);
            form.reset();
        } catch (error) {
            alert(`Помилка: ${error.message}`);
        }
    },

    async handleAddLink(e) {
        e.preventDefault();
        const form = e.target;
        
        const name = document.getElementById('link-person').value;
        const title = document.getElementById('link-movie').value;
        const type = document.getElementById('link-type').value;
        const rolesInput = document.getElementById('link-roles').value;

        try {
            const payload = { name, title, type };

            if (type === 'ACTED_IN' && rolesInput.trim()) {
                payload.roles = rolesInput.split(',').map(role => role.trim());
            }

            await api.createLink(payload);
            
            alert(`Зв'язок [${type}] між "${name}" та фільмом "${title}" успішно створено!`);
            form.reset();
            this.toggleRolesField();
        } catch (error) {
            alert(`Помилка: ${error.message}`);
        }
    },

    toggleRolesField() {
        const typeSelect = document.getElementById('link-type');
        const rolesGroup = document.getElementById('roles-group');
        const rolesInput = document.getElementById('link-roles');
        
        if (typeSelect && rolesGroup) {
            if (typeSelect.value === 'ACTED_IN') {
                rolesGroup.style.display = 'block';
            } else {
                rolesGroup.style.display = 'none';
                rolesInput.value = '';
            }
        }
    }
};