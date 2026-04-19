import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

// When Inertia navigates via XHR the browser URL doesn't change until AFTER
// the page component resolves. If a Vite chunk fails (vite:preloadError) we
// must navigate to the DESTINATION URL, not reload the current one (/login).
// Key: 'finish' fires before async component resolve, so we clear only on
// 'navigate' (success) or 'error'/'exception'/'invalid' (server-side failure).
let pendingNavigationHref = null;
router.on('start', (event) => { pendingNavigationHref = event.detail.visit.url.href; });
router.on('navigate', () => { pendingNavigationHref = null; });
router.on('error', () => { pendingNavigationHref = null; });
router.on('exception', () => { pendingNavigationHref = null; });
router.on('invalid', () => { pendingNavigationHref = null; });

window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.href = pendingNavigationHref ?? window.location.href;
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
