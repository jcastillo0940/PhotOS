import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { resolveTenantTheme } from '@/lib/tenantTheme';

export default function ClientLayout({ children, title }) {
    const { props } = usePage();
    const tenantTheme = resolveTenantTheme(props);
    const { palette, headingFont, bodyFont, studioName } = tenantTheme;

    return (
        <div className="min-h-screen" style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: bodyFont }}>
            {title && <Head title={`${title} | ${studioName}`} />}

            <header
                className="sticky top-0 z-30 border-b"
                style={{ backgroundColor: palette.surface, borderColor: palette.accent_soft }}
            >
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <Link href="/client" className="flex items-center gap-2">
                        <span className="text-lg font-semibold tracking-tight" style={{ color: palette.text, fontFamily: headingFont }}>
                            {studioName}
                        </span>
                        <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                            style={{ backgroundColor: palette.accent_soft, color: palette.accent }}
                        >
                            Portal
                        </span>
                    </Link>

                    <Link
                        href="/logout"
                        method="post"
                        data={{ _surface: 'client' }}
                        as="button"
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors"
                        style={{ color: palette.muted }}
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Salir</span>
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-10">
                {children}
            </div>
        </div>
    );
}
