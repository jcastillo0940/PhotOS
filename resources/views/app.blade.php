<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @php
            $appName = \App\Models\Setting::get('app_name', config('app.name', 'PhotOS'));
            $faviconPath = \App\Models\Setting::get('app_favicon_path');
        @endphp
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title inertia>{{ $appName }}</title>
        @if($faviconPath)
            <link rel="icon" type="image/png" href="{{ asset('storage/'.$faviconPath) }}">
        @endif
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        @viteReactRefresh
        @vite(['resources/js/app.jsx', 'resources/css/app.css'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-[#0a0a0a] text-[#ededed]">
        @inertia
    </body>
</html>
