import React from 'react';
import WebsiteBuilder from '@/Pages/Admin/Website/Index';

export default function Website({ tenant, homepage, homepagePreview, theme, seo }) {
    return (
        <WebsiteBuilder
            homepage={homepage}
            homepagePreview={homepagePreview}
            theme={theme}
            seo={seo}
            submitUrl={`/admin/saas/tenants/${tenant.id}/website`}
            tenantLabel={tenant.name}
            pageTitle={`White label | ${tenant.name}`}
            heading={`Front completo de ${tenant.name}`}
            description="Esta es la pantalla correcta para asignar el diseno del home/front completo del tenant. Tambien puedes editar contenido, imagenes, secciones, logo/branding relacionado y estilo visual sin afectar a otros tenants."
            backHref={`/admin/saas/tenants/${tenant.id}`}
            backLabel="Volver al tenant"
        />
    );
}
