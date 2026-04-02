<?php

return [
    'default' => 'essential',

    'plans' => [
        'essential' => [
            'code' => 'essential',
            'name' => 'Plan Essential',
            'tagline' => 'Base anual',
            'audience' => 'Ideal para operaciones pequenas con control estricto de originales y plantillas basicas.',
            'price_label' => '$200 / ano',
            'billing_label' => 'Anual',
            'price_amount' => 200,
            'storage_limit_gb' => 3,
            'retention_days' => 30,
            'weekly_download_limit' => 1,
            'estimated_cost_label' => 'Operacion base controlada',
            'template_access' => [1, 2, 3, 4],
            'watermark_mode' => 'platform_forced',
            'allows_custom_domain' => false,
            'max_originals_bytes' => 3221225472,
            'highlights' => [
                '3GB de originales por evento',
                'Retencion de 30 dias',
                '1 descarga semanal por cliente',
                'Solo plantillas basicas',
                'Marca de agua obligatoria',
            ],
        ],
        'pro_studio' => [
            'code' => 'pro_studio',
            'name' => 'Plan Pro Studio',
            'tagline' => 'Produccion completa',
            'audience' => 'Pensado para fotografos con mayor volumen, mas descargas y acceso total a plantillas.',
            'price_label' => '$600 / ano',
            'billing_label' => 'Anual',
            'price_amount' => 600,
            'storage_limit_gb' => 10,
            'retention_days' => 90,
            'weekly_download_limit' => 6,
            'estimated_cost_label' => 'Operacion premium con alto volumen',
            'template_access' => 'all',
            'watermark_mode' => 'photographer_custom',
            'allows_custom_domain' => true,
            'max_originals_bytes' => 10737418240,
            'highlights' => [
                '10GB de originales por evento',
                'Retencion de 90 dias',
                '6 descargas semanales por cliente',
                'Acceso a todas las plantillas',
                'Marca de agua personalizada',
                'Custom domain disponible',
            ],
        ],
    ],

    'technical_summary' => [
        'hosting_cost_label' => '$12 - $15 USD mensuales',
        'bucket_layout' => [
            '{event_id}/originals/',
            '{event_id}/web/',
        ],
        'notes' => [
            'La galeria publica siempre se sirve desde el prefix /web/.',
            'Los originales viven en /originals/ y pueden expirar o eliminarse sin tocar /web/.',
            'Las versiones web se convierten a WEBP y se intentan mantener bajo 500KB.',
            'Las descargas de originales se validan con download_logs dentro de una ventana de 7 dias.',
        ],
    ],
];

