<?php

return [
    // Dominios que resuelven al primer tenant activo (consola central, desarrollo local)
    'central_domains' => array_values(array_filter(array_map(
        static fn (string $domain) => trim(strtolower($domain)),
        explode(',', (string) env('SAAS_CENTRAL_DOMAINS', 'localhost,127.0.0.1'))
    ))),

    // Dominio exclusivo del panel SaaS interno (solo role=developer)
    // Vacío en local = sin restricción de dominio (útil para desarrollo)
    'panel_domain' => env('SAAS_PANEL_DOMAIN', ''),

    // Dominio del portal de clientes
    'client_portal_domain' => env('SAAS_CLIENT_PORTAL_DOMAIN', ''),
];
