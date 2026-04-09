<?php

return [
    'central_domains' => array_values(array_filter(array_map(
        static fn (string $domain) => trim(strtolower($domain)),
        explode(',', (string) env('SAAS_CENTRAL_DOMAINS', 'localhost,127.0.0.1'))
    ))),
];
