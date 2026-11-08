export const ViewManager = {
    sections: [
        'movies-feed-section', 
        'search-section', 
        'movie-details-section', 
        'related-movies-section', 
        'person-movies-section', 
        'admin-section'
    ],

    init() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.getAttribute('data-target');
                this.show(targetId);

                navButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        if (navButtons.length > 0) {
            navButtons[0].classList.add('active');
        }
    },

    show(targetSectionId) {
        this.sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                section.hidden = (id !== targetSectionId);
            }
        });
    }
};