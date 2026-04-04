import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
});

createInertiaApp({
    title: (title) => {
        const appName = window?.Laravel?.branding?.app_name
            || window.document.getElementsByTagName('title')[0]?.innerText
            || 'PhotOS';

        return `${title} - ${appName}`;
    },
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#6366f1',
    },
});
