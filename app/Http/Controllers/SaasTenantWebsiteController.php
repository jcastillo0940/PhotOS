<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Tenant;
use App\Support\HomepageSettings;
use App\Support\TenantSeoSettings;
use App\Support\TenantThemeSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SaasTenantWebsiteController extends Controller
{
    public function edit(Tenant $tenant)
    {
        $content = HomepageSettings::get($tenant->id);

        return Inertia::render('Admin/Saas/Website', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
            ],
            'homepage' => $content,
            'homepagePreview' => HomepageSettings::toFrontend($content),
            'theme' => TenantThemeSettings::get($tenant->id),
            'seo' => TenantSeoSettings::get($tenant->id, HomepageSettings::toFrontend($content)),
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'theme' => 'required|string',
            'seo' => 'nullable|string',
            'hero_image' => 'nullable|image|max:5120',
            'about_image' => 'nullable|image|max:5120',
            'gallery_image_0' => 'nullable|image|max:5120',
            'gallery_image_1' => 'nullable|image|max:5120',
            'gallery_image_2' => 'nullable|image|max:5120',
            'gallery_image_3' => 'nullable|image|max:5120',
            'gallery_image_4' => 'nullable|image|max:5120',
            'gallery_image_5' => 'nullable|image|max:5120',
            'featured_image_0' => 'nullable|image|max:5120',
            'featured_image_1' => 'nullable|image|max:5120',
            'featured_image_2' => 'nullable|image|max:5120',
        ]);

        $decoded = json_decode($validated['content'], true);
        $themeDecoded = json_decode($validated['theme'], true);
        $seoDecoded = json_decode($request->input('seo', '{}'), true);

        abort_unless(is_array($decoded), 422, 'Invalid homepage payload.');
        abort_unless(is_array($themeDecoded), 422, 'Invalid theme payload.');

        $content = HomepageSettings::sanitize($decoded, $tenant->id);
        $content['brand']['name'] = Setting::getForTenant($tenant->id, 'app_name', $tenant->name);
        $content['brand']['tagline'] = Setting::getForTenant($tenant->id, 'app_tagline', $content['brand']['tagline'] ?? 'Admin platform');

        if ($request->hasFile('hero_image')) {
            $content['hero']['image_path'] = $this->storeImageInR2($request->file('hero_image'), $tenant, 'hero');
        }

        if ($request->hasFile('about_image')) {
            $content['about']['image_path'] = $this->storeImageInR2($request->file('about_image'), $tenant, 'about');
        }

        foreach (range(0, 5) as $index) {
            $field = 'gallery_image_'.$index;

            if ($request->hasFile($field)) {
                $content['gallery']['images'][$index] = $this->storeImageInR2($request->file($field), $tenant, 'gallery-'.$index);
            }
        }

        foreach (range(0, 2) as $index) {
            $field = 'featured_image_'.$index;

            if ($request->hasFile($field)) {
                $content['featured']['items'][$index]['image_path'] = $this->storeImageInR2($request->file($field), $tenant, 'featured-'.$index);
            }
        }

        HomepageSettings::save($content, $tenant->id);
        TenantThemeSettings::save($themeDecoded, $tenant->id);

        if (is_array($seoDecoded)) {
            TenantSeoSettings::save($seoDecoded, $tenant->id, HomepageSettings::toFrontend($content));
        }

        return back()->with('success', 'Sitio del tenant actualizado.');
    }

    private function storeImageInR2($file, Tenant $tenant, string $slot): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $path = 'tenants/'.$tenant->id.'/website/'.$slot.'-'.Str::uuid().'.'.$extension;

        Storage::disk('r2')->put($path, fopen($file->getRealPath(), 'r'));

        return 'r2://'.$path;
    }
}
