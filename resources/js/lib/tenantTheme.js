export const defaultPublicTheme = {
    font_heading: 'Fraunces, Georgia, serif',
    font_body: 'Inter, system-ui, sans-serif',
    palette: {
        surface: '#f7f3ee',
        surface_alt: '#faf6f1',
        surface_dark: '#241b16',
        text: '#241b16',
        muted: '#6b594c',
        accent: '#8b6d54',
        accent_soft: '#e6dbcf',
    },
};

export function resolveTenantTheme(pageProps = {}) {
    const theme = pageProps.publicTheme || defaultPublicTheme;
    const palette = {
        ...defaultPublicTheme.palette,
        ...(theme?.palette || {}),
    };

    return {
        theme,
        palette,
        headingFont: theme?.font_heading || defaultPublicTheme.font_heading,
        bodyFont: theme?.font_body || defaultPublicTheme.font_body,
        branding: pageProps.branding || {},
        tenant: pageProps.tenant || null,
        studioName: pageProps.branding?.app_name || pageProps.tenant?.name || 'PhotOS',
        studioTagline: pageProps.branding?.app_tagline || 'Experiencias visuales cuidadas por tu estudio',
    };
}
