<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Support\HomepageSettings;
use App\Support\TenantSeoSettings;
use App\Support\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Schema;

class SeoController extends Controller
{
    public function robots(Request $request)
    {
        $tenantId = app(TenantContext::class)->id();
        $homepage = HomepageSettings::toFrontend(HomepageSettings::get($tenantId));
        $seo = TenantSeoSettings::get($tenantId, $homepage);
        $host = $request->getSchemeAndHttpHost();

        $lines = [
            'User-agent: *',
            $seo['indexable'] ? 'Allow: /' : 'Disallow: /',
            'Disallow: /admin',
            'Disallow: /client',
            'Disallow: /login',
            'Sitemap: '.$host.'/sitemap.xml',
            '',
        ];

        return Response::make(implode("\n", $lines), 200, ['Content-Type' => 'text/plain']);
    }

    public function sitemap(Request $request)
    {
        $host = $request->getSchemeAndHttpHost();
        $urls = [
            ['loc' => $host.'/', 'priority' => '1.0', 'changefreq' => 'weekly'],
            ['loc' => $host.'/portfolio', 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['loc' => $host.'/booking', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ];

        if (Schema::hasTable('projects')) {
            Project::query()
                ->whereNotNull('gallery_token')
                ->whereHas('photos', fn ($query) => $query->where('show_on_website', true))
                ->latest('updated_at')
                ->limit(100)
                ->get(['gallery_token', 'updated_at'])
                ->each(function (Project $project) use (&$urls, $host) {
                    $urls[] = [
                        'loc' => $host.'/gallery/'.$project->gallery_token,
                        'priority' => '0.5',
                        'changefreq' => 'monthly',
                        'lastmod' => optional($project->updated_at)->toAtomString(),
                    ];
                });
        }

        $xml = view('seo.sitemap', ['urls' => $urls])->render();

        return Response::make($xml, 200, ['Content-Type' => 'application/xml']);
    }
}
