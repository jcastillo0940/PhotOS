<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Support\InstallationPlan;
use App\Support\HomepageSettings;
use App\Services\Billing\AlanubeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function __construct(
        private readonly AlanubeService $alanubeService,
    ) {}

    public function index()
    {
        $this->seedDefaults();

        return Inertia::render('Admin/Settings/Index', [
            'settings' => Setting::all()->groupBy('group'),
        ]);
    }

    public function branding()
    {
        $this->seedDefaults();

        return Inertia::render('Admin/Settings/Branding', [
            'settings' => Setting::query()
                ->where('group', 'app_branding')
                ->get()
                ->keyBy('key'),
        ]);
    }

    public function update(Request $request)
    {
        $allowedKeys = Setting::query()
            ->whereIn('group', ['storage', 'payment', 'branding', 'legal', 'billing', 'einvoice', 'smtp'])
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

        $currentBusinessName = collect($settings['settings'])->firstWhere('key', 'photographer_business_name')['value'] ?? null;

        if (filled($currentBusinessName)) {
            $this->syncStudioIdentity($currentBusinessName, Setting::get('app_tagline', 'Admin platform'));
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

    public function updateBranding(Request $request)
    {
        $request->validate([
            'app_name' => 'required|string|max:255',
            'app_tagline' => 'nullable|string|max:255',
            'app_logo' => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:4096',
            'app_favicon' => 'nullable|file|mimes:png,ico,svg,webp|max:2048',
        ]);

        $appName = $request->string('app_name')->toString();
        $appTagline = $request->string('app_tagline')->toString();

        $this->syncStudioIdentity($appName, $appTagline);

        if ($request->hasFile('app_logo')) {
            $path = $request->file('app_logo')->store('branding/app', 'public');
            Setting::set('app_logo_path', $path, 'app_branding');
        }

        if ($request->hasFile('app_favicon')) {
            $path = $request->file('app_favicon')->store('branding/app', 'public');
            Setting::set('app_favicon_path', $path, 'app_branding');
        }

        return redirect()->back()->with('success', 'Branding actualizado.');
    }

    public function testSmtp(Request $request)
    {
        $recipient = $request->user()?->email ?: Setting::get('smtp_from_address');

        if (!filter_var(Setting::get('smtp_enabled', '0'), FILTER_VALIDATE_BOOL)) {
            return back()->with('integration_test', [
                'service' => 'smtp',
                'ok' => false,
                'message' => 'SMTP esta desactivado en configuracion.',
            ]);
        }

        if (!$recipient) {
            return back()->with('integration_test', [
                'service' => 'smtp',
                'ok' => false,
                'message' => 'No hay correo destino para la prueba.',
            ]);
        }

        try {
            Mail::raw('Prueba SMTP enviada desde PhotOS el '.now()->toDateTimeString(), function ($message) use ($recipient) {
                $message->to($recipient)->subject('Prueba SMTP PhotOS');
            });

            return back()->with('integration_test', [
                'service' => 'smtp',
                'ok' => true,
                'message' => 'Correo de prueba enviado a '.$recipient,
            ]);
        } catch (\Throwable $e) {
            return back()->with('integration_test', [
                'service' => 'smtp',
                'ok' => false,
                'message' => 'Error SMTP: '.$e->getMessage(),
            ]);
        }
    }

    public function testAlanube()
    {
        try {
            $result = $this->alanubeService->probeConnection();

            return back()->with('integration_test', [
                'service' => 'alanube',
                'ok' => $result['ok'] ?? false,
                'message' => $result['message'] ?? 'Prueba de Alanube completada.',
                'status' => $result['status'] ?? null,
            ]);
        } catch (\Throwable $e) {
            return back()->with('integration_test', [
                'service' => 'alanube',
                'ok' => false,
                'message' => 'Error Alanube: '.$e->getMessage(),
            ]);
        }
    }

    public function testCloudflare()
    {
        try {
            $path = 'integration-checks/ping-'.now()->format('YmdHis').'.txt';
            Storage::disk('r2')->put($path, 'PhotOS R2 ping '.now()->toDateTimeString());
            Storage::disk('r2')->delete($path);

            return back()->with('integration_test', [
                'service' => 'cloudflare',
                'ok' => true,
                'message' => 'Cloudflare R2 respondio correctamente.',
            ]);
        } catch (\Throwable $e) {
            return back()->with('integration_test', [
                'service' => 'cloudflare',
                'ok' => false,
                'message' => 'Error Cloudflare R2: '.$e->getMessage(),
            ]);
        }
    }

    public function testTilopay()
    {
        $apiKey = Setting::get('tilopay_api_key');
        $secret = Setting::get('tilopay_secret_key');

        if (!$apiKey || !$secret) {
            return back()->with('integration_test', [
                'service' => 'tilopay',
                'ok' => false,
                'message' => 'Faltan credenciales de Tilopay.',
            ]);
        }

        return back()->with('integration_test', [
            'service' => 'tilopay',
            'ok' => true,
            'message' => 'Credenciales de Tilopay cargadas. El proyecto aun no tiene endpoint transaccional configurado para una prueba activa.',
        ]);
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
            ['key' => 'tax_itbms_enabled', 'group' => 'billing', 'is_secret' => false, 'value' => '1'],
            ['key' => 'tax_itbms_rate', 'group' => 'billing', 'is_secret' => false, 'value' => '7'],
            ['key' => 'alanube_enabled', 'group' => 'einvoice', 'is_secret' => false, 'value' => '0'],
            ['key' => 'alanube_email', 'group' => 'einvoice', 'is_secret' => false, 'value' => ''],
            ['key' => 'alanube_api_url', 'group' => 'einvoice', 'is_secret' => false, 'value' => ''],
            ['key' => 'alanube_api_key', 'group' => 'einvoice', 'is_secret' => true, 'value' => ''],
            ['key' => 'smtp_enabled', 'group' => 'smtp', 'is_secret' => false, 'value' => '0'],
            ['key' => 'smtp_host', 'group' => 'smtp', 'is_secret' => false, 'value' => ''],
            ['key' => 'smtp_port', 'group' => 'smtp', 'is_secret' => false, 'value' => '587'],
            ['key' => 'smtp_username', 'group' => 'smtp', 'is_secret' => false, 'value' => ''],
            ['key' => 'smtp_password', 'group' => 'smtp', 'is_secret' => true, 'value' => ''],
            ['key' => 'smtp_scheme', 'group' => 'smtp', 'is_secret' => false, 'value' => 'tls'],
            ['key' => 'smtp_from_address', 'group' => 'smtp', 'is_secret' => false, 'value' => ''],
            ['key' => 'smtp_from_name', 'group' => 'smtp', 'is_secret' => false, 'value' => ''],
            ['key' => 'app_name', 'group' => 'app_branding', 'is_secret' => false, 'value' => config('app.name', 'PhotOS')],
            ['key' => 'app_tagline', 'group' => 'app_branding', 'is_secret' => false, 'value' => 'Admin platform'],
            ['key' => 'app_logo_path', 'group' => 'app_branding', 'is_secret' => false, 'value' => null],
            ['key' => 'app_favicon_path', 'group' => 'app_branding', 'is_secret' => false, 'value' => null],
        ];

        foreach ($defaults as $d) {
            Setting::firstOrCreate(
                ['key' => $d['key']],
                $d
            );
        }

        $this->syncStudioIdentity(
            Setting::get('app_name', Setting::get('photographer_business_name', 'PhotOS')),
            Setting::get('app_tagline', 'Admin platform')
        );
    }

    private function syncStudioIdentity(string $name, ?string $tagline = null): void
    {
        $name = trim($name);
        $tagline = trim((string) $tagline);

        if ($name === '') {
            return;
        }

        Setting::set('app_name', $name, 'app_branding');
        Setting::set('photographer_business_name', $name, 'legal');

        if ($tagline !== '') {
            Setting::set('app_tagline', $tagline, 'app_branding');
        }

        $homepage = HomepageSettings::get();
        data_set($homepage, 'brand.name', $name);
        data_set($homepage, 'brand.tagline', $tagline !== '' ? $tagline : Setting::get('app_tagline', 'Admin platform'));
        HomepageSettings::save($homepage);
    }
}
