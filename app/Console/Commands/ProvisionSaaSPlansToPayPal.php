<?php

namespace App\Console\Commands;

use App\Models\SaasPlan;
use App\Services\Billing\TenantBillingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProvisionSaaSPlansToPayPal extends Command
{
    protected $signature = 'saas:provision-paypal';
    protected $description = 'Crea los productos y planes en PayPal (Live/Sandbox) segun la matriz de la base de datos';

    public function __construct(
        private readonly TenantBillingService $billing
    ) {
        parent::__construct();
    }

    public function handle(): void
    {
        $env = config('services.paypal.environment');
        $this->info("Iniciando provisionamiento en entorno: " . strtoupper($env));

        if (!$this->confirm("¿Estas seguro de que quieres crear estos planes en PayPal {$env}?", true)) {
            return;
        }

        $plans = SaasPlan::where('is_active', true)->get();

        foreach ($plans as $plan) {
            if ($plan->code === 'starter' && ($plan->features['price_monthly'] ?? 0) <= 0) {
                $this->line("Omitiendo plan Starter (es gratuito).");
                continue;
            }

            foreach (['monthly', 'annual'] as $cycle) {
                $this->info("Procesando Plan: {$plan->name} ({$cycle})");

                try {
                    $planDef = $this->billing->planDefinition($plan->code, $cycle);
                    
                    // 1. Crear Producto
                    $this->comment("  - Creando producto...");
                    $product = $this->createProduct($planDef);
                    $productId = $product['id'];
                    $this->info("    Producto creado: {$productId}");

                    // 2. Crear Plan de Cobro
                    $this->comment("  - Creando plan de cobro...");
                    $paypalPlan = $this->createPlan($planDef, $productId);
                    $paypalPlanId = $paypalPlan['id'];
                    $this->info("    Plan creado: {$paypalPlanId}");

                    $this->line("--------------------------------------------------");
                } catch (\Throwable $e) {
                    $this->error("Error procesando {$plan->name} ({$cycle}): " . $e->getMessage());
                }
            }
        }

        $this->info('Provisionamiento completado.');
        $this->warn('RECUERDA: Si cambiaste a LIVE, debes crear un nuevo Webhook en PayPal apuntando a tu URL /paypal/webhook y actualizar paypal_webhook_id en settings.');
    }

    private function createProduct(array $planDef): array
    {
        // Replicamos la logica de TenantBillingService para no depender de una suscripcion existente
        $paypal = app(\App\Services\Billing\PayPalApiService::class);
        return $paypal->createProduct([
            'name' => 'PhotOS ' . $planDef['name'],
            'type' => 'SERVICE',
            'category' => 'SOFTWARE',
            'description' => 'Suscripcion ' . $planDef['name'] . ' del SaaS PhotOS',
        ]);
    }

    private function createPlan(array $planDef, string $productId): array
    {
        $paypal = app(\App\Services\Billing\PayPalApiService::class);
        $cycles = [];
        $currency = $planDef['currency'] ?? 'USD';

        if (!empty($planDef['promo_amount'])) {
            $cycles[] = [
                'frequency' => [
                    'interval_unit' => $planDef['billing_cycle'] === 'annual' ? 'YEAR' : 'MONTH',
                    'interval_count' => 1,
                ],
                'tenure_type' => 'TRIAL',
                'sequence' => 1,
                'total_cycles' => 1,
                'pricing_scheme' => [
                    'fixed_price' => [
                        'value' => number_format((float) $planDef['promo_amount'], 2, '.', ''),
                        'currency_code' => $currency,
                    ],
                ],
            ];
        }

        $cycles[] = [
            'frequency' => [
                'interval_unit' => $planDef['billing_cycle'] === 'annual' ? 'YEAR' : 'MONTH',
                'interval_count' => 1,
            ],
            'tenure_type' => 'REGULAR',
            'sequence' => empty($cycles) ? 1 : 2,
            'total_cycles' => 0,
            'pricing_scheme' => [
                'fixed_price' => [
                    'value' => number_format((float) $planDef['amount'], 2, '.', ''),
                    'currency_code' => $currency,
                ],
            ],
        ];

        return $paypal->createPlan([
            'product_id' => $productId,
            'name' => 'PhotOS ' . $planDef['name'] . ' ' . ($planDef['billing_cycle'] === 'annual' ? 'Anual' : 'Mensual'),
            'description' => 'Suscripcion para plan ' . $planDef['name'],
            'status' => 'ACTIVE',
            'billing_cycles' => $cycles,
            'payment_preferences' => [
                'auto_bill_outstanding' => true,
                'setup_fee_failure_action' => 'CONTINUE',
                'payment_failure_threshold' => 2,
            ],
        ]);
    }
}
