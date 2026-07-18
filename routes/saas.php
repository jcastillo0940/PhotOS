<?php

use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\Saas\AuditLogController as SaasAuditLogController;
use App\Http\Controllers\Saas\CostController;
use App\Http\Controllers\Saas\PaymentController as SaasPaymentController;
use App\Http\Controllers\Saas\PlanController;
use App\Http\Controllers\Saas\SubscriptionController;
use App\Http\Controllers\Saas\TemplateController as SaasTemplateController;
use App\Http\Controllers\Saas\UserController;
use App\Http\Controllers\SaasBillingController;
use App\Http\Controllers\SaasTenantController;
use App\Http\Controllers\SaasTenantWebsiteController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TemplateController;
use Illuminate\Support\Facades\Route;

// Panel SaaS — acceso exclusivo: developer + dominio saas.*
// El login/logout lo sirve web.php y funciona para todos los dominios.
Route::middleware(['auth:saas', 'developer', 'saas.domain'])->group(function () {

    // Tenants
    Route::get('/tenants', [SaasTenantController::class, 'index'])->name('saas.tenants.index');
    Route::post('/tenants', [SaasTenantController::class, 'store'])->name('saas.tenants.store');
    Route::get('/tenants/{tenant}', [SaasTenantController::class, 'show'])->name('saas.tenants.show');
    Route::put('/tenants/{tenant}', [SaasTenantController::class, 'update'])->name('saas.tenants.update');
    Route::post('/tenants/{tenant}/domains', [SaasTenantController::class, 'storeDomain'])->name('saas.tenants.domains.store');
    Route::post('/tenants/{tenant}/domains/{domain}/sync', [SaasTenantController::class, 'syncDomain'])->name('saas.tenants.domains.sync');
    Route::post('/tenants/{tenant}/domain-orders/{domainOrder}/dns-configured', [SaasTenantController::class, 'markDomainOrderDnsConfigured'])->name('saas.tenants.domain-orders.dns-configured');
    Route::post('/tenants/{tenant}/domain-orders/{domainOrder}/retry', [SaasTenantController::class, 'retryDomainOrder'])->name('saas.tenants.domain-orders.retry');
    Route::post('/tenants/{tenant}/domain-orders/{domainOrder}/cancel', [SaasTenantController::class, 'cancelDomainOrder'])->name('saas.tenants.domain-orders.cancel');
    Route::post('/tenants/{tenant}/domain-orders/{domainOrder}/override', [SaasTenantController::class, 'overrideDomainOrder'])->name('saas.tenants.domain-orders.override');
    Route::get('/tenants/{tenant}/website', [SaasTenantWebsiteController::class, 'edit'])->name('saas.tenants.website.edit');
    Route::put('/tenants/{tenant}/website', [SaasTenantWebsiteController::class, 'update'])->name('saas.tenants.website.update');
    Route::post('/tenants/{tenant}/billing/manual', [SaasBillingController::class, 'manualUpdate'])->name('saas.tenants.billing.manual');
    Route::post('/tenants/{tenant}/billing/manual-payment', [SaasBillingController::class, 'recordManualPayment'])->name('saas.tenants.billing.manual-payment');
    Route::post('/tenants/{tenant}/billing/discount', [SaasBillingController::class, 'applyDiscount'])->name('saas.tenants.billing.discount');
    Route::post('/tenants/{tenant}/billing/setup-token', [SaasBillingController::class, 'createSetupToken'])->name('saas.tenants.billing.setup-token');

    // Auditoría global
    Route::get('/audit-log', [SaasAuditLogController::class, 'index'])->name('saas.audit-log');

    // Usuarios de la plataforma
    Route::get('/users', [UserController::class, 'index'])->name('saas.users.index');
    Route::post('/users', [UserController::class, 'store'])->name('saas.users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('saas.users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('saas.users.destroy');

    // Planes SaaS
    Route::get('/plans', [PlanController::class, 'index'])->name('saas.plans.index');
    Route::post('/plans', [PlanController::class, 'store'])->name('saas.plans.store');
    Route::put('/plans/{plan}', [PlanController::class, 'update'])->name('saas.plans.update');
    Route::delete('/plans/{plan}', [PlanController::class, 'destroy'])->name('saas.plans.destroy');

    // Plantillas globales de galería
    Route::get('/templates', [SaasTemplateController::class, 'index'])->name('saas.templates.index');
    Route::post('/templates', [SaasTemplateController::class, 'store'])->name('saas.templates.store');
    Route::put('/templates/{template}', [SaasTemplateController::class, 'update'])->name('saas.templates.update');
    Route::delete('/templates/{template}', [SaasTemplateController::class, 'destroy'])->name('saas.templates.destroy');

    // Plantillas de estudio (watermark / branding global)
    Route::get('/studio-templates', [TemplateController::class, 'index'])->name('saas.studio-templates');
    Route::put('/studio-templates', [TemplateController::class, 'update'])->name('saas.studio-templates.update');

    // Suscripciones
    Route::get('/subscriptions', [SubscriptionController::class, 'index'])->name('saas.subscriptions.index');
    Route::post('/subscriptions', [SubscriptionController::class, 'store'])->name('saas.subscriptions.store');
    Route::put('/subscriptions/{subscription}', [SubscriptionController::class, 'update'])->name('saas.subscriptions.update');
    Route::post('/subscriptions/{subscription}/manual-payment', [SubscriptionController::class, 'recordManualPayment'])->name('saas.subscriptions.manual-payment');

    // Pagos y costos
    Route::get('/payments', [SaasPaymentController::class, 'index'])->name('saas.payments.index');
    Route::get('/costs', [CostController::class, 'index'])->name('saas.costs.index');
    Route::post('/costs', [CostController::class, 'store'])->name('saas.costs.store');
    Route::put('/costs/{cost}', [CostController::class, 'update'])->name('saas.costs.update');
    Route::delete('/costs/{cost}', [CostController::class, 'destroy'])->name('saas.costs.destroy');

    // Uso de Gemini
    Route::get('/gemini-usage', [SaasTenantController::class, 'geminiUsage'])->name('saas.gemini-usage');

    // Facturación electrónica (operación de plataforma)
    Route::post('/invoices/{invoice}/alanube', [InvoiceController::class, 'submitAlanube'])->name('saas.invoices.alanube.submit');

    // Integraciones y configuración de plataforma
    Route::get('/settings/integrations', [SettingsController::class, 'integrations'])->name('saas.settings.integrations');
    Route::put('/settings/integrations', [SettingsController::class, 'updateIntegrations'])->name('saas.settings.integrations.update');
    Route::get('/settings/tests', [SettingsController::class, 'tests'])->name('saas.settings.tests');
    Route::get('/settings/billing', [SettingsController::class, 'billing'])->name('saas.settings.billing');
    Route::put('/settings/billing', [SettingsController::class, 'updateBilling'])->name('saas.settings.billing.update');
    Route::post('/settings/test/smtp', [SettingsController::class, 'testSmtp'])->name('saas.settings.test.smtp');
    Route::post('/settings/test/alanube', [SettingsController::class, 'testAlanube'])->name('saas.settings.test.alanube');
    Route::post('/settings/test/cloudflare', [SettingsController::class, 'testCloudflare'])->name('saas.settings.test.cloudflare');
    Route::post('/settings/test/cloudflare_saas', [SettingsController::class, 'testCloudflareSaas'])->name('saas.settings.test.cloudflare_saas');
    Route::post('/settings/test/paypal', [SettingsController::class, 'testPaypal'])->name('saas.settings.test.paypal');
    Route::post('/settings/test/tilopay', [SettingsController::class, 'testTilopay'])->name('saas.settings.test.tilopay');
});
