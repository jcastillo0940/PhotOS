<?php

/**
 * Surface: PUBLIC
 * Audiencia: cualquier visitante, sin autenticación
 * Dominio: {studio}.com, misaeldavid.com
 */

use App\Modules\Tenancy\Controllers\BookingController;
use App\Modules\Gallery\Controllers\GalleryController;
use App\Modules\Tenancy\Controllers\HomeController;
use App\Modules\Leads\Controllers\LeadController;
use App\Modules\Billing\Controllers\PaymentController;
use App\Modules\Projects\Controllers\ProjectController;
use App\Modules\Contracts\Controllers\ContractController;
use App\Modules\Billing\Controllers\SaasBillingController;
use App\Modules\SaasManagement\Controllers\SaasOnboardingController;
use App\Modules\Domains\Controllers\SeoController;
use Illuminate\Support\Facades\Route;

// Studio website (marketing del estudio)
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/robots.txt', [SeoController::class, 'robots'])->name('seo.robots');
Route::get('/sitemap.xml', [SeoController::class, 'sitemap'])->name('seo.sitemap');
Route::get('/sitemap-images.xml', [SeoController::class, 'imageSitemap'])->name('seo.sitemap.images');
Route::get('/portfolio', [HomeController::class, 'portfolio'])->name('public.portfolio');
Route::post('/leads', [LeadController::class, 'store'])->name('leads.store');
Route::get('/booking', [BookingController::class, 'index'])->name('public.booking');
Route::post('/booking', [BookingController::class, 'store'])->name('public.booking.store');

// SaaS onboarding (landing de la plataforma)
Route::get('/get-started', [SaasOnboardingController::class, 'create'])->name('public.saas.signup');
Route::post('/get-started', [SaasOnboardingController::class, 'store'])->name('public.saas.signup.store');
Route::get('/get-started/{registration}', [SaasOnboardingController::class, 'success'])->name('public.saas.signup.success');
Route::post('/get-started/{registration}/paypal/subscribe', [SaasBillingController::class, 'createPayPalSubscription'])->name('public.saas.signup.paypal');
Route::post('/webhooks/paypal/subscriptions', [SaasBillingController::class, 'paypalWebhook'])->name('webhooks.paypal.subscriptions');

// Contratos y firma pública (acceso por token)
Route::get('/sign/{token}', [ProjectController::class, 'publicSignatureView'])->name('public.contract.view');
Route::post('/sign/{token}', [ProjectController::class, 'signContract'])->name('public.contract.sign');
Route::get('/sign/{token}/print', [ContractController::class, 'publicPrint'])->name('public.contract.print');

// Galería pública (acceso por token, sin login)
Route::get('/gallery/{token}', [GalleryController::class, 'show'])->name('public.gallery.show');
Route::post('/gallery/{token}/register-email', [GalleryController::class, 'registerEmail'])->name('public.gallery.register-email');
Route::post('/gallery/{token}/unlock', [GalleryController::class, 'unlock'])->name('public.gallery.unlock');
Route::post('/gallery/photo/{photo}/toggle', [GalleryController::class, 'toggleHeart'])->name('public.gallery.heart');
Route::get('/gallery/photo/{photo}/download', [GalleryController::class, 'download'])->name('public.gallery.download');
Route::get('/gallery/{token}/download/full', [GalleryController::class, 'downloadFullGallery'])->name('public.gallery.download.full');
Route::get('/gallery/{token}/download/zip', [GalleryController::class, 'downloadZip'])->name('public.gallery.download.zip');

// Pagos de galería
Route::post('/gallery/{token}/buy/full', [PaymentController::class, 'purchaseFullGallery'])->name('public.gallery.buy.full');
Route::post('/gallery/{token}/buy/pack', [PaymentController::class, 'purchaseExtraPack'])->name('public.gallery.buy.pack');
Route::get('/payments/paypal/{purchase}/return', [PaymentController::class, 'paypalReturn'])->name('public.gallery.paypal.return');
Route::get('/payments/paypal/{purchase}/cancel', [PaymentController::class, 'paypalCancel'])->name('public.gallery.paypal.cancel');

// Formularios del cliente (briefing y NPS — acceso por token)
Route::get('/forms/briefing/{token}', [LeadController::class, 'publicBriefing'])->name('public.leads.briefing.show');
Route::post('/forms/briefing/{token}', [LeadController::class, 'submitPublicBriefing'])->name('public.leads.briefing.submit');
Route::get('/forms/nps/{token}', [LeadController::class, 'publicNps'])->name('public.leads.nps.show');
Route::post('/forms/nps/{token}', [LeadController::class, 'submitPublicNps'])->name('public.leads.nps.submit');
