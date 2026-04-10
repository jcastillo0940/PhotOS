import React from 'react';
import WebsiteBuilder from '@/Pages/Admin/Website/Index';

export default function Website({ tenant, homepage, homepagePreview, theme }) {
    return (
        <WebsiteBuilder
            homepage={homepage}
            homepagePreview={homepagePreview}
            theme={theme}
            submitUrl={`/admin/saas/tenants/${tenant.id}/website`}
            tenantLabel={tenant.name}
            pageTitle={`White label | ${tenant.name}`}
            heading={`Front white-label de ${tenant.name}`}
            description="Edita el home publico de este tenant sin duplicar codigo. Todo se guarda aislado por tenant para que cada dominio tenga su propio contenido y estilo."
            backHref={`/admin/saas/tenants/${tenant.id}`}
            backLabel="Volver al tenant"
        />
    );
}
