<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Support\InstallationPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $this->seedDefaults();

        return Inertia::render('Admin/Settings/Index', [
            'settings' => Setting::all()->groupBy('group'),
        ]);
    }

    public function update(Request $request)
    {
        $allowedKeys = Setting::query()
            ->whereIn('group', ['storage', 'payment', 'branding', 'legal'])
            ->pluck('key')
            ->all();

        $settings = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($settings['settings'] as $item) {
            if (in_array($item['key'], $allowedKeys, true)) {
                Setting::where('key', $item['key'])->update(['value' => $item['value']]);
            }
        }

        if ($request->hasFile('photographer_watermark')) {
            $request->validate([
                'photographer_watermark' => 'image|mimes:png,webp|max:4096',
            ]);

            $path = $request->file('photographer_watermark')->store('branding', 'public');
            Setting::set('photographer_watermark_path', $path, 'branding');
        }

        return redirect()->back()->with('success', 'Configuration updated successfully.');
    }

    private function seedDefaults()
    {
        $defaults = [
            ['key' => InstallationPlan::SETTING_KEY, 'group' => 'installation', 'is_secret' => false, 'value' => config('photography_plans.default', 'essential')],
            ['key' => \App\Support\GalleryTemplate::SETTING_KEY, 'group' => 'installation', 'is_secret' => false, 'value' => config('gallery_templates.default', 'cinematic-dark')],
            ['key' => 'r2_key', 'group' => 'storage', 'is_secret' => true],
            ['key' => 'r2_secret', 'group' => 'storage', 'is_secret' => true],
            ['key' => 'r2_bucket', 'group' => 'storage', 'is_secret' => false],
            ['key' => 'r2_endpoint', 'group' => 'storage', 'is_secret' => false],
            ['key' => 'paypal_client_id', 'group' => 'payment', 'is_secret' => true],
            ['key' => 'paypal_secret', 'group' => 'payment', 'is_secret' => true],
            ['key' => 'tilopay_api_key', 'group' => 'payment', 'is_secret' => true],
            ['key' => 'tilopay_secret_key', 'group' => 'payment', 'is_secret' => true],
            ['key' => 'platform_watermark_label', 'group' => 'branding', 'is_secret' => false, 'value' => 'PhotOS'],
            ['key' => 'photographer_watermark_path', 'group' => 'branding', 'is_secret' => false, 'value' => null],
            ['key' => 'photographer_business_name', 'group' => 'legal', 'is_secret' => false, 'value' => 'Mono Studio'],
            ['key' => 'photographer_document', 'group' => 'legal', 'is_secret' => false, 'value' => 'Cedula / RUC'],
            ['key' => 'legal_city', 'group' => 'legal', 'is_secret' => false, 'value' => 'Panama'],
            ['key' => 'jurisdiction_country', 'group' => 'legal', 'is_secret' => false, 'value' => 'Panama'],
            ['key' => 'default_privacy_fee', 'group' => 'legal', 'is_secret' => false, 'value' => '150'],
        ];

        foreach ($defaults as $d) {
            Setting::firstOrCreate(
                ['key' => $d['key']],
                $d
            );
        }
    }
}
