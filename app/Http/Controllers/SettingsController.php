<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\Billing\AlanubeService;
use App\Support\EventTypeSettings;
use App\Support\HomepageSettings;
use App\Support\InstallationPlan;
use App\Services\Billing\PayPalApiService;
use App\Services\Saas\CloudflareCustomHostnameService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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

        return Inertia::render('Admin/Settings/Index');
    }

    public function integrations()
    {
        $this->seedDefaults();

        return Inertia::render('Admin/Settings/Integrations', [
            'settings' => Setting::query()
                ->whereIn('group', ['storage', 'payment', 'einvoice', 'smtp', 'saas'])
                ->get()
                ->groupBy('group'),
        ]);
    }

    public function billing()
    {
        $this->seedDefaults();

        return Inertia::render('Admin/Settings/Billing', [
            'settings' => Setting::query()
                ->whereIn('key', ['tax_itbms_enabled', 'tax_itbms_rate', 'alanube_enabled', 'lead_schedule_blocks_hours', 'lead_parallel_capacity'])
                ->get()
                ->keyBy('key'),
        ]);
    }

    public function tests()
    {
        $this->seedDefaults();

        return Inertia::render('Admin/Settings/Tests');
    }

    public function branding()
    {
        $this->seedDefaults();

        return Inertia::render('Admin/Settings/Branding', [
            'settings' => Setting::query()
                ->whereIn('group', ['app_branding', 'legal', 'branding', 'studio', 'ai'])
                ->get()
                ->keyBy('key'),
        ]);
    }

    public function updateIntegrations(Request $request)
    {
        $allowedKeys = [
            'r2_key', 'r2_secret', 'r2_bucket', 'r2_endpoint',
            'paypal_client_id', 'paypal_secret', 'paypal_environment', 'paypal_webhook_id', 'tilopay_api_key', 'tilopay_secret_key',
            'alanube_email', 'alanube_api_url', 'alanube_api_key',
            'cloudflare_saas_api_token', 'cloudflare_saas_zone_id', 'cloudflare_saas_cname_target', 'cloudflare_saas_dcv_target',
            'smtp_enabled', 'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_scheme', 'smtp_from_address', 'smtp_from_name',
        ];

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

        return redirect()->back()->with('success', 'Integraciones actualizadas.');
    }

    public function updateBilling(Request $request)
    {
        $validated = $request->validate([
            'tax_itbms_enabled' => 'nullable|boolean',
            'tax_itbms_rate' => 'required|numeric|min:0|max:100',
            'alanube_enabled' => 'nullable|boolean',
            'lead_schedule_blocks_hours' => 'nullable|boolean',
            'lead_parallel_capacity' => 'required|integer|min:1|max:20',
        ]);

        Setting::set('tax_itbms_enabled', ($validated['tax_itbms_enabled'] ?? false) ? '1' : '0', 'billing');
        Setting::set('tax_itbms_rate', (string) $validated['tax_itbms_rate'], 'billing');
        Setting::set('alanube_enabled', ($validated['alanube_enabled'] ?? false) ? '1' : '0', 'einvoice');
        Setting::set('lead_schedule_blocks_hours', ($validated['lead_schedule_blocks_hours'] ?? false) ? '1' : '0', 'booking');
        Setting::set('lead_parallel_capacity', (string) $validated['lead_parallel_capacity'], 'booking');

        return redirect()->back()->with('success', 'Configuracion de facturacion actualizada.');
    }

    public function updateBranding(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:255',
            'app_tagline' => 'nullable|string|max:255',
            'photographer_document' => 'nullable|string|max:255',
            'legal_city' => 'nullable|string|max:255',
            'jurisdiction_country' => 'nullable|string|max:255',
            'platform_watermark_label' => 'nullable|string|max:255',
            'event_types' => 'nullable|string',
            'ai_sports_mode_enabled' => 'nullable|boolean',
            'app_logo' => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:4096',
            'app_favicon' => 'nullable|file|mimes:png,ico,svg,webp|max:2048',
            'photographer_watermark' => 'nullable|image|mimes:png,webp|max:4096',
        ]);

        $appName = $request->string('app_name')->toString();
        $appTagline = $request->string('app_tagline')->toString();

        $this->syncStudioIdentity($appName, $appTagline);
        Setting::set('photographer_document', $request->string('photographer_document')->toString(), 'legal');
        Setting::set('legal_city', $request->string('legal_city')->toString(), 'legal');
        Setting::set('jurisdiction_country', $request->string('jurisdiction_country')->toString(), 'legal');
        Setting::set('platform_watermark_label', $request->string('platform_watermark_label')->toString(), 'branding');
        Setting::set('event_types', $request->string('event_types')->toString(), 'studio');
        Setting::set('ai_sports_mode_enabled', ($validated['ai_sports_mode_enabled'] ?? false) ? '1' : '0', 'ai');

        if ($request->hasFile('app_logo')) {
            $path = $request->file('app_logo')->store('branding/app', 'public');
            Setting::set('app_logo_path', $path, 'app_branding');
        }

        if ($request->hasFile('app_favicon')) {
            $path = $request->file('app_favicon')->store('branding/app', 'public');
            Setting::set('app_favicon_path', $path, 'app_branding');
        }

        if ($request->hasFile('photographer_watermark')) {
            $path = $request->file('photographer_watermark')->store('branding', 'public');
            Setting::set('photographer_watermark_path', $path, 'branding');
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

    public function testCloudflare(Request $request)
    {
        // Debug: Log complete R2 config
        \Illuminate\Support\Facades\Log::debug('R2 Test Start', [
            'driver' => config('filesystems.disks.r2.driver'),
            'bucket' => config('filesystems.disks.r2.bucket'),
            'endpoint' => config('filesystems.disks.r2.endpoint'),
            'key_present' => !empty(config('filesystems.disks.r2.key')),
            'secret_present' => !empty(config('filesystems.disks.r2.secret')),
        ]);

        try {
            $disk = Storage::disk('r2');
            $filename = 'test-'.time().'.txt';
            $content = 'Test connection at '.now()->toDateTimeString();

            \Illuminate\Support\Facades\Log::debug('R2 Uploading test file: ' . $filename);
            $disk->put($filename, $content);

            \Illuminate\Support\Facades\Log::debug('R2 Deleting test file: ' . $filename);
            $disk->delete($filename);

            return back()->with('integration_test', [
                'service' => 'cloudflare',
                'ok' => true,
                'message' => 'Conexion con Cloudflare R2 establecida y prueba de lectura/escritura superada.'
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('R2 Test Fail: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ]);
            return back()->with('integration_test', [
                'service' => 'cloudflare',
                'ok' => false,
                'message' => 'Error Cloudflare R2: '.$e->getMessage(),
            ]);
        }
    }

    public function testCloudflareSaas(CloudflareCustomHostnameService $cf)
    {
        \Illuminate\Support\Facades\Log::debug('Cloudflare SaaS Test Start', [
            'api_token_present' => !empty(config('services.cloudflare_saas.api_token')),
            'zone_id' => config('services.cloudflare_saas.zone_id'),
            'managed_cname_target' => config('services.cloudflare_saas.managed_cname_target'),
        ]);

        try {
            if (!$cf->enabled()) {
                \Illuminate\Support\Facades\Log::warning('Cloudflare SaaS Test aborted: Not enabled.');
                return back()->with('integration_test', [
                    'service' => 'cloudflare_saas',
                    'ok' => false,
                    'message' => 'Cloudflare SaaS no esta habilitado en la configuracion.'
                ]);
            }

            $response = Http::baseUrl('https://api.cloudflare.com/client/v4')
                ->withToken(config('services.cloudflare_saas.api_token'))
                ->get('/zones/'.config('services.cloudflare_saas.zone_id').'/custom_hostnames', ['per_page' => 1]);

            \Illuminate\Support\Facades\Log::debug('Cloudflare SaaS Response', [
                'status' => $response->status(),
                'body' => $response->json()
            ]);

            if ($response->failed()) {
                throw new \RuntimeException($response->json('errors.0.message') ?: 'Error de conexion con Cloudflare.');
            }

            return back()->with('integration_test', [
                'service' => 'cloudflare_saas',
                'ok' => true,
                'message' => 'Conexion con Cloudflare SaaS establecida correctamente.',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Cloudflare SaaS Test Fail: ' . $e->getMessage());
            return back()->with('integration_test', [
                'service' => 'cloudflare_saas',
                'ok' => false,
                'message' => 'Error Cloudflare SaaS: '.$e->getMessage(),
            ]);
        }
    }

    public function testPaypal(PayPalApiService $paypal)
    {
        \Illuminate\Support\Facades\Log::debug('PayPal Test Start', [
            'client_id_present' => !empty(config('services.paypal.client_id')),
            'secret_present' => !empty(config('services.paypal.secret')),
            'environment' => config('services.paypal.environment'),
        ]);

        try {
            if (!$paypal->enabled()) {
                \Illuminate\Support\Facades\Log::warning('PayPal Test aborted: Not enabled.');
                return back()->with('integration_test', [
                    'service' => 'paypal',
                    'ok' => false,
                    'message' => 'PayPal no esta habilitado en la configuracion.',
                ]);
            }

            $token = $paypal->accessToken();
            \Illuminate\Support\Facades\Log::debug('PayPal Token Success');

            return back()->with('integration_test', [
                'service' => 'paypal',
                'ok' => true,
                'message' => 'Conexion con PayPal establecida. Access Token obtenido correctamente ('.substr($token, 0, 8).'...).',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('PayPal Test Fail: ' . $e->getMessage());
            return back()->with('integration_test', [
                'service' => 'paypal',
                'ok' => false,
                'message' => 'Error PayPal: '.$e->getMessage(),
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
            ['key' => 'cloudflare_saas_api_token', 'group' => 'saas', 'is_secret' => true, 'value' => ''],
            ['key' => 'cloudflare_saas_zone_id', 'group' => 'saas', 'is_secret' => false, 'value' => ''],
            ['key' => 'cloudflare_saas_cname_target', 'group' => 'saas', 'is_secret' => false, 'value' => ''],
            ['key' => 'cloudflare_saas_dcv_target', 'group' => 'saas', 'is_secret' => false, 'value' => ''],
            ['key' => 'paypal_client_id', 'group' => 'payment', 'is_secret' => true],
            ['key' => 'paypal_secret', 'group' => 'payment', 'is_secret' => true],
            ['key' => 'tilopay_api_key', 'group' => 'payment', 'is_secret' => true],
            ['key' => 'tilopay_secret_key', 'group' => 'payment', 'is_secret' => true],
            ['key' => 'platform_watermark_label', 'group' => 'branding', 'is_secret' => false, 'value' => 'PhotOS'],
            ['key' => 'photographer_watermark_path', 'group' => 'branding', 'is_secret' => false, 'value' => null],
            ['key' => 'ai_sports_mode_enabled', 'group' => 'ai', 'is_secret' => false, 'value' => '0'],
            ['key' => 'event_types', 'group' => 'studio', 'is_secret' => false, 'value' => implode("\n", EventTypeSettings::defaults())],
            ['key' => 'photographer_business_name', 'group' => 'legal', 'is_secret' => false, 'value' => 'Mono Studio'],
            ['key' => 'photographer_document', 'group' => 'legal', 'is_secret' => false, 'value' => 'Cedula / RUC'],
            ['key' => 'legal_city', 'group' => 'legal', 'is_secret' => false, 'value' => 'Panama'],
            ['key' => 'jurisdiction_country', 'group' => 'legal', 'is_secret' => false, 'value' => 'Panama'],
            ['key' => 'default_privacy_fee', 'group' => 'legal', 'is_secret' => false, 'value' => '150'],
            ['key' => 'tax_itbms_enabled', 'group' => 'billing', 'is_secret' => false, 'value' => '1'],
            ['key' => 'tax_itbms_rate', 'group' => 'billing', 'is_secret' => false, 'value' => '7'],
            ['key' => 'alanube_enabled', 'group' => 'einvoice', 'is_secret' => false, 'value' => '0'],
            ['key' => 'lead_schedule_blocks_hours', 'group' => 'booking', 'is_secret' => false, 'value' => '1'],
            ['key' => 'lead_parallel_capacity', 'group' => 'booking', 'is_secret' => false, 'value' => '1'],
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
