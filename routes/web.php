<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\LimitsController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\WebsiteController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AutomationController;
use App\Http\Controllers\ClientAccountingController;
use App\Http\Controllers\ClientDashboardController;
use App\Http\Controllers\SaasTenantController;
use App\Http\Controllers\SaasTenantWebsiteController;
use App\Http\Controllers\SaasOnboardingController;
use App\Http\Controllers\SaasBillingController;
use Illuminate\Support\Facades\Route;

// Public: Studio Website
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/portfolio', [HomeController::class, 'portfolio'])->name('public.portfolio');
Route::post('/leads', [LeadController::class, 'store'])->name('leads.store');
Route::get('/booking', [BookingController::class, 'index'])->name('public.booking');
Route::post('/booking', [BookingController::class, 'store'])->name('public.booking.store');
Route::get('/get-started', [SaasOnboardingController::class, 'create'])->name('public.saas.signup');
Route::post('/get-started', [SaasOnboardingController::class, 'store'])->name('public.saas.signup.store');
Route::get('/get-started/{registration}', [SaasOnboardingController::class, 'success'])->name('public.saas.signup.success');
Route::post('/get-started/{registration}/paypal/subscribe', [SaasBillingController::class, 'createPayPalSubscription'])->name('public.saas.signup.paypal');
Route::post('/webhooks/paypal/subscriptions', [SaasBillingController::class, 'paypalWebhook'])->name('webhooks.paypal.subscriptions');

// Auth: Studio Access
Route::get('/login', [AuthController::class, 'loginView'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Admin: CRM/ERP (Protected)
Route::prefix('admin')->middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard.alias');
    Route::get('/settings', [SettingsController::class, 'index'])->name('admin.settings');
    Route::get('/settings/branding', [SettingsController::class, 'branding'])->name('admin.settings.branding');
    Route::post('/settings/branding', [SettingsController::class, 'updateBranding'])->name('admin.settings.branding.update');

    Route::middleware('developer')->group(function () {
        Route::get('/settings/integrations', [SettingsController::class, 'integrations'])->name('admin.settings.integrations');
        Route::put('/settings/integrations', [SettingsController::class, 'updateIntegrations'])->name('admin.settings.integrations.update');
        Route::get('/settings/tests', [SettingsController::class, 'tests'])->name('admin.settings.tests');
        Route::get('/settings/billing', [SettingsController::class, 'billing'])->name('admin.settings.billing');
        Route::put('/settings/billing', [SettingsController::class, 'updateBilling'])->name('admin.settings.billing.update');
        Route::post('/settings/test/smtp', [SettingsController::class, 'testSmtp'])->name('admin.settings.test.smtp');
        Route::post('/settings/test/alanube', [SettingsController::class, 'testAlanube'])->name('admin.settings.test.alanube');
        Route::post('/settings/test/cloudflare', [SettingsController::class, 'testCloudflare'])->name('admin.settings.test.cloudflare');
        Route::post('/settings/test/cloudflare_saas', [SettingsController::class, 'testCloudflareSaas'])->name('admin.settings.test.cloudflare_saas');
        Route::post('/settings/test/paypal', [SettingsController::class, 'testPaypal'])->name('admin.settings.test.paypal');
        Route::post('/settings/test/tilopay', [SettingsController::class, 'testTilopay'])->name('admin.settings.test.tilopay');
        Route::post('/invoices/{invoice}/alanube', [InvoiceController::class, 'submitAlanube'])->name('admin.invoices.alanube.submit');
        Route::get('/templates', [TemplateController::class, 'index'])->name('admin.templates');
        Route::put('/templates', [TemplateController::class, 'update'])->name('admin.templates.update');
        Route::get('/saas/tenants', [SaasTenantController::class, 'index'])->name('admin.saas.tenants.index');
        Route::post('/saas/tenants', [SaasTenantController::class, 'store'])->name('admin.saas.tenants.store');
        Route::get('/saas/tenants/{tenant}', [SaasTenantController::class, 'show'])->name('admin.saas.tenants.show');
        Route::put('/saas/tenants/{tenant}', [SaasTenantController::class, 'update'])->name('admin.saas.tenants.update');
        Route::post('/saas/tenants/{tenant}/domains', [SaasTenantController::class, 'storeDomain'])->name('admin.saas.tenants.domains.store');
        Route::post('/saas/tenants/{tenant}/domains/{domain}/sync', [SaasTenantController::class, 'syncDomain'])->name('admin.saas.tenants.domains.sync');
        Route::get('/saas/tenants/{tenant}/website', [SaasTenantWebsiteController::class, 'edit'])->name('admin.saas.tenants.website.edit');
        Route::put('/saas/tenants/{tenant}/website', [SaasTenantWebsiteController::class, 'update'])->name('admin.saas.tenants.website.update');
        Route::post('/saas/tenants/{tenant}/billing/manual', [SaasBillingController::class, 'manualUpdate'])->name('admin.saas.tenants.billing.manual');
        Route::post('/saas/tenants/{tenant}/billing/setup-token', [SaasBillingController::class, 'createSetupToken'])->name('admin.saas.tenants.billing.setup-token');
    });

    Route::middleware('studio.operator')->group(function () {
        Route::get('/website', [WebsiteController::class, 'index'])->name('admin.website');
        Route::get('/automations', [AutomationController::class, 'index'])->name('admin.automations');
        Route::post('/automations', [AutomationController::class, 'store'])->name('admin.automations.store');
        Route::put('/automations/{automationRule}', [AutomationController::class, 'update'])->name('admin.automations.update');
        Route::delete('/automations/{automationRule}', [AutomationController::class, 'destroy'])->name('admin.automations.delete');
        Route::post('/automations/run', [AutomationController::class, 'run'])->name('admin.automations.run');
        Route::put('/crm-tasks/{crmTask}/complete', [AutomationController::class, 'completeTask'])->name('admin.crm-tasks.complete');
        Route::put('/website', [WebsiteController::class, 'update'])->name('admin.website.update');
        Route::get('/contracts', [ContractController::class, 'index'])->name('admin.contracts');
        Route::get('/contracts/{contract}/edit', [ContractController::class, 'edit'])->name('admin.contracts.edit');
        Route::put('/contracts/{contract}', [ContractController::class, 'update'])->name('admin.contracts.update');
        Route::get('/contracts/{contract}/print', [ContractController::class, 'print'])->name('admin.contracts.print');
        Route::get('/contracts/{contract}', [ContractController::class, 'show'])->name('admin.contracts.show');
        Route::get('/limits', [LimitsController::class, 'index'])->name('admin.limits');
        Route::get('/calendar', [EventController::class, 'index'])->name('admin.calendar');
        Route::post('/events', [EventController::class, 'store'])->name('admin.events.store');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('admin.events.delete');
        Route::get('/leads', [LeadController::class, 'index'])->name('admin.leads');
        Route::get('/leads/create', [LeadController::class, 'create'])->name('admin.leads.create');
        Route::post('/leads', [LeadController::class, 'store'])->name('admin.leads.store');
        Route::get('/leads/{lead}', [LeadController::class, 'show'])->name('admin.leads.show');
        Route::put('/leads/{lead}/status', [LeadController::class, 'updateStatus'])->name('admin.leads.status');
        Route::get('/leads/{lead}/accounting', [LeadController::class, 'accountRedirect'])->name('admin.leads.accounting');
        Route::put('/leads/{lead}/briefing', [LeadController::class, 'saveBriefing'])->name('admin.leads.briefing.update');
        Route::post('/leads/{lead}/briefing/send', [LeadController::class, 'sendBriefing'])->name('admin.leads.briefing.send');
        Route::post('/leads/{lead}/nps/send', [LeadController::class, 'sendNps'])->name('admin.leads.nps.send');
        Route::get('/clients/{client}/accounting', [ClientAccountingController::class, 'show'])->name('admin.clients.accounting');
        Route::post('/leads/{lead}/convert', [ProjectController::class, 'convert'])->name('admin.leads.convert');
        Route::post('/projects', [ProjectController::class, 'storeDirect'])->name('admin.projects.store');
        Route::get('/projects', [ProjectController::class, 'index'])->name('admin.projects');
        Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('admin.projects.show');
        Route::get('/projects/{project}/details', [ProjectController::class, 'details'])->name('admin.projects.details');
        Route::get('/projects/{project}/gallery', [ProjectController::class, 'gallery'])->name('admin.projects.gallery');
        Route::get('/projects/{project}/management', [ProjectController::class, 'management'])->name('admin.projects.management');
        Route::put('/projects/{project}', [ProjectController::class, 'update'])->name('admin.projects.update');
        Route::post('/projects/{project}/photos', [GalleryController::class, 'upload'])->middleware('tenant.feature:photo_uploads')->name('admin.projects.photos.upload');
        Route::put('/projects/{project}/photos/{photo}', [GalleryController::class, 'updatePhoto'])->name('admin.projects.photos.update');
        Route::delete('/projects/{project}/photos/{photo}', [GalleryController::class, 'destroyPhoto'])->name('admin.projects.photos.delete');
        Route::post('/projects/{project}/face-identities', [GalleryController::class, 'storeIdentity'])->middleware('tenant.feature:ai_scans')->name('admin.projects.face-identities.store');
        Route::delete('/projects/{project}/face-identities/{faceIdentity}', [GalleryController::class, 'destroyIdentity'])->name('admin.projects.face-identities.delete');
        Route::post('/projects/{project}/recognition/test', [GalleryController::class, 'testRecognition'])->name('admin.projects.recognition.test');
        Route::post('/projects/{project}/recognition/run', [GalleryController::class, 'recognizeProject'])->middleware('tenant.feature:ai_scans')->name('admin.projects.recognition.run');
        Route::delete('/projects/{project}/recognition', [GalleryController::class, 'clearProjectRecognition'])->name('admin.projects.recognition.clear');
        Route::post('/projects/{project}/photos/{photo}/recognition', [GalleryController::class, 'recognizePhoto'])->middleware('tenant.feature:ai_scans')->name('admin.projects.photos.recognition');
        Route::delete('/projects/{project}/photos/{photo}/recognition', [GalleryController::class, 'clearPhotoRecognition'])->name('admin.projects.photos.recognition.clear');
        Route::post('/projects/{project}/contract', [ProjectController::class, 'generateContract'])->name('admin.projects.contract.create');
        Route::post('/projects/{project}/invoices', [InvoiceController::class, 'store'])->name('admin.projects.invoices.store');
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('admin.invoices.pdf');
        Route::put('/invoices/{invoice}/pay', [InvoiceController::class, 'markAsPaid'])->name('admin.invoices.pay');
        Route::put('/invoices/{invoice}/toggle-tax', [InvoiceController::class, 'toggleTax'])->name('admin.invoices.toggle-tax');
        Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'recordPayment'])->name('admin.invoices.payments.store');
    });
});

Route::prefix('client')->middleware('auth')->group(function () {
    Route::get('/', [ClientDashboardController::class, 'index'])->name('client.dashboard');
});

// Public: Contracts & Signatures
Route::get('/sign/{token}', [ProjectController::class, 'publicSignatureView'])->name('public.contract.view');
Route::post('/sign/{token}', [ProjectController::class, 'signContract'])->name('public.contract.sign');
Route::get('/sign/{token}/print', [ContractController::class, 'publicPrint'])->name('public.contract.print');

// Public: Professional Gallery
Route::get('/gallery/{token}', [GalleryController::class, 'show'])->name('public.gallery.show');
Route::post('/gallery/{token}/register-email', [GalleryController::class, 'registerEmail'])->name('public.gallery.register-email');
Route::post('/gallery/{token}/unlock', [GalleryController::class, 'unlock'])->name('public.gallery.unlock');
Route::post('/gallery/photo/{photo}/toggle', [GalleryController::class, 'toggleHeart'])->name('public.gallery.heart');
Route::get('/gallery/photo/{photo}/download', [GalleryController::class, 'download'])->name('public.gallery.download');
Route::get('/gallery/{token}/download/full', [GalleryController::class, 'downloadFullGallery'])->name('public.gallery.download.full');


// Public: Payments
Route::post('/gallery/{token}/buy/full', [PaymentController::class, 'purchaseFullGallery'])->name('public.gallery.buy.full');
Route::post('/gallery/{token}/buy/pack', [PaymentController::class, 'purchaseExtraPack'])->name('public.gallery.buy.pack');
Route::get('/forms/briefing/{token}', [LeadController::class, 'publicBriefing'])->name('public.leads.briefing.show');
Route::post('/forms/briefing/{token}', [LeadController::class, 'submitPublicBriefing'])->name('public.leads.briefing.submit');
Route::get('/forms/nps/{token}', [LeadController::class, 'publicNps'])->name('public.leads.nps.show');
Route::post('/forms/nps/{token}', [LeadController::class, 'submitPublicNps'])->name('public.leads.nps.submit');
