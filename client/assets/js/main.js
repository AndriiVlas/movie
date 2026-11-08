import { ViewManager } from './viewManager.js';
import { Feed } from './features/feed.js';
import { Search } from './features/search.js';
import { Admin } from './features/admin.js';

document.addEventListener('DOMContentLoaded', () => {
    ViewManager.init();

    // Фічі (стрічка, пошук, вставлення)
    Feed.init();
    Search.init();
    Admin.init();

    ViewManager.show('movies-feed-section');
});