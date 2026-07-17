<?php

/**
 * Surface: STUDIO (Backoffice del estudio fotográfico)
 * Audiencia: owner, operator, photographer
 * Dominio: admin.misaeldavid.com
 * Guards: auth, studio.operator, tenant.admin, tenant.finance, project.access
 */

use App\Http\Controllers\AutomationController;
use App\Http\Controllers\ClientAccountingController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\FaceDetectionController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LimitsController;
use App\Http\Controllers\ProjectCollaboratorController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TenantSubscriptionPortalController;
use App\Http\Controllers\WebsiteController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->middleware('auth')->group(function () {

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard.alias');

    // Configuración del estudio (branding — tenant.admin)
    Route::get('/settings', [SettingsController::class, 'index'])->middleware('tenant.admin')->name('admin.settings');
    Route::get('/settings/branding', [SettingsController::class, 'branding'])->middleware('tenant.admin')->name('admin.settings.branding');
    Route::post('/settings/branding', [SettingsController::class, 'updateBranding'])->middleware('tenant.admin')->name('admin.settings.branding.update');

    // Las rutas de integraciones y configuración de plataforma viven en routes/saas.php
    // y solo son accesibles desde saas.misaeldavid.com (developer únicamente).

    Route::middleware('studio.operator')->group(function () {

        // Sitio web y contratos
        Route::get('/website', [WebsiteController::class, 'index'])->middleware('tenant.admin')->name('admin.website');
        Route::put('/website', [WebsiteController::class, 'update'])->middleware('tenant.admin')->name('admin.website.update');
        Route::get('/contracts', [ContractController::class, 'index'])->middleware('tenant.admin')->name('admin.contracts');
        Route::get('/contracts/{contract}/edit', [ContractController::class, 'edit'])->middleware('tenant.admin')->name('admin.contracts.edit');
        Route::put('/contracts/{contract}', [ContractController::class, 'update'])->middleware('tenant.admin')->name('admin.contracts.update');
        Route::get('/contracts/{contract}/print', [ContractController::class, 'print'])->middleware('tenant.admin')->name('admin.contracts.print');
        Route::get('/contracts/{contract}', [ContractController::class, 'show'])->middleware('tenant.admin')->name('admin.contracts.show');

        // Detección facial
        Route::get('/face-detection', [FaceDetectionController::class, 'index'])->middleware('tenant.admin')->name('admin.face-detection');
        Route::get('/face-detection/learning', [FaceDetectionController::class, 'learning'])->middleware('tenant.admin')->name('admin.face-detection.learning');
        Route::post('/face-detection/mode', [FaceDetectionController::class, 'updateMode'])->middleware('tenant.admin')->name('admin.face-detection.mode');
        Route::post('/face-detection/identities', [FaceDetectionController::class, 'storeIdentity'])->middleware(['tenant.admin', 'tenant.feature:ai_scans'])->name('admin.face-detection.identities.store');
        Route::post('/face-detection/identities/{faceIdentity}/photos', [FaceDetectionController::class, 'storeIdentityPhoto'])->middleware(['tenant.admin', 'tenant.feature:ai_scans'])->name('admin.face-detection.identities.photos.store');
        Route::delete('/face-detection/identities/{faceIdentity}', [FaceDetectionController::class, 'destroyIdentity'])->middleware('tenant.admin')->name('admin.face-detection.identities.delete');
        Route::post('/face-detection/catalog', [FaceDetectionController::class, 'storeCatalogItem'])->middleware('tenant.admin')->name('admin.face-detection.catalog.store');
        Route::delete('/face-detection/catalog/{type}/{itemId}', [FaceDetectionController::class, 'destroyCatalogItem'])->middleware('tenant.admin')->name('admin.face-detection.catalog.delete');
        Route::post('/face-detection/run-all', [FaceDetectionController::class, 'runAll'])->middleware(['tenant.admin', 'tenant.feature:ai_scans'])->name('admin.face-detection.run-all');
        Route::post('/face-detection/unknowns/{detection}/confirm', [FaceDetectionController::class, 'confirmUnknownDetection'])->middleware('tenant.admin')->name('admin.face-detection.unknowns.confirm');
        Route::post('/face-detection/unknowns/{detection}/name', [FaceDetectionController::class, 'nameUnknownDetection'])->middleware('tenant.admin')->name('admin.face-detection.unknowns.name');
        Route::delete('/face-detection/unknowns/{detection}/reject', [FaceDetectionController::class, 'rejectUnknownDetection'])->middleware('tenant.admin')->name('admin.face-detection.unknowns.reject');

        // Límites y suscripción
        Route::get('/limits', [LimitsController::class, 'index'])->middleware('tenant.admin')->name('admin.limits');
        Route::get('/subscription', [TenantSubscriptionPortalController::class, 'show'])->middleware('tenant.admin')->name('admin.subscription');
        Route::post('/subscription/offline-payment', [TenantSubscriptionPortalController::class, 'submitOfflinePayment'])->middleware('tenant.admin')->name('admin.subscription.offline-payment');
        Route::post('/subscription/plan-change', [TenantSubscriptionPortalController::class, 'requestPlanChange'])->middleware('tenant.admin')->name('admin.subscription.plan-change');
        Route::post('/subscription/domain-search', [TenantSubscriptionPortalController::class, 'searchPurchasableDomains'])->middleware('tenant.admin')->name('admin.subscription.domain-search');
        Route::post('/subscription/domain-purchase', [TenantSubscriptionPortalController::class, 'purchaseDomain'])->middleware('tenant.admin')->name('admin.subscription.domain-purchase');
        Route::post('/subscription/custom-domain', [TenantSubscriptionPortalController::class, 'storeCustomDomain'])->middleware('tenant.admin')->name('admin.subscription.custom-domain');
        Route::post('/subscription/custom-domain/{domain}/sync', [TenantSubscriptionPortalController::class, 'syncCustomDomain'])->middleware('tenant.admin')->name('admin.subscription.custom-domain.sync');
        Route::post('/subscription/domain-orders/{domainOrder}/sync', [TenantSubscriptionPortalController::class, 'syncDomainOrder'])->middleware('tenant.admin')->name('admin.subscription.domain-orders.sync');
        Route::post('/subscription/domain-orders/{domainOrder}/dns-configured', [TenantSubscriptionPortalController::class, 'markDomainOrderDnsConfigured'])->middleware('tenant.admin')->name('admin.subscription.domain-orders.dns-configured');
        Route::post('/subscription/domain-orders/{domainOrder}/retry', [TenantSubscriptionPortalController::class, 'retryDomainOrder'])->middleware('tenant.admin')->name('admin.subscription.domain-orders.retry');
        Route::post('/subscription/domain-orders/{domainOrder}/cancel', [TenantSubscriptionPortalController::class, 'cancelDomainOrder'])->middleware('tenant.admin')->name('admin.subscription.domain-orders.cancel');
        Route::post('/subscription/domain-orders/{domainOrder}/notes', [TenantSubscriptionPortalController::class, 'noteDomainOrder'])->middleware('tenant.admin')->name('admin.subscription.domain-orders.notes');

        // Calendario y eventos
        Route::get('/calendar', [EventController::class, 'index'])->middleware('tenant.admin')->name('admin.calendar');
        Route::post('/events', [EventController::class, 'store'])->middleware('tenant.admin')->name('admin.events.store');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->middleware('tenant.admin')->name('admin.events.delete');

        // CRM — Leads
        Route::get('/leads', [LeadController::class, 'index'])->middleware('tenant.admin')->name('admin.leads');
        Route::get('/leads/create', [LeadController::class, 'create'])->middleware('tenant.admin')->name('admin.leads.create');
        Route::post('/leads', [LeadController::class, 'store'])->middleware('tenant.admin')->name('admin.leads.store');
        Route::get('/leads/{lead}', [LeadController::class, 'show'])->middleware('tenant.admin')->name('admin.leads.show');
        Route::put('/leads/{lead}', [LeadController::class, 'update'])->middleware('tenant.admin')->name('admin.leads.update');
        Route::put('/leads/{lead}/status', [LeadController::class, 'updateStatus'])->middleware('tenant.admin')->name('admin.leads.status');
        Route::get('/leads/{lead}/accounting', [LeadController::class, 'accountRedirect'])->middleware('tenant.admin')->name('admin.leads.accounting');
        Route::put('/leads/{lead}/briefing', [LeadController::class, 'saveBriefing'])->middleware('tenant.admin')->name('admin.leads.briefing.update');
        Route::post('/leads/{lead}/briefing/send', [LeadController::class, 'sendBriefing'])->middleware('tenant.admin')->name('admin.leads.briefing.send');
        Route::post('/leads/{lead}/briefing/disable', [LeadController::class, 'disableBriefing'])->middleware('tenant.admin')->name('admin.leads.briefing.disable');
        Route::post('/leads/{lead}/nps/send', [LeadController::class, 'sendNps'])->middleware('tenant.admin')->name('admin.leads.nps.send');
        Route::get('/clients/{client}/accounting', [ClientAccountingController::class, 'show'])->middleware('tenant.admin')->name('admin.clients.accounting');

        // Automatizaciones CRM
        Route::get('/automations', [AutomationController::class, 'index'])->middleware('tenant.admin')->name('admin.automations');
        Route::post('/automations', [AutomationController::class, 'store'])->middleware('tenant.admin')->name('admin.automations.store');
        Route::put('/automations/{automationRule}', [AutomationController::class, 'update'])->middleware('tenant.admin')->name('admin.automations.update');
        Route::delete('/automations/{automationRule}', [AutomationController::class, 'destroy'])->middleware('tenant.admin')->name('admin.automations.delete');
        Route::post('/automations/run', [AutomationController::class, 'run'])->middleware('tenant.admin')->name('admin.automations.run');
        Route::put('/crm-tasks/{crmTask}/complete', [AutomationController::class, 'completeTask'])->middleware('tenant.admin')->name('admin.crm-tasks.complete');

        // Proyectos y galería
        Route::post('/leads/{lead}/convert', [ProjectController::class, 'convert'])->middleware('tenant.admin')->name('admin.leads.convert');
        Route::post('/projects', [ProjectController::class, 'storeDirect'])->middleware('tenant.admin')->name('admin.projects.store');
        Route::get('/projects', [ProjectController::class, 'index'])->name('admin.projects');
        Route::get('/projects/{project}', [ProjectController::class, 'show'])->middleware('project.access:view')->name('admin.projects.show');
        Route::get('/projects/{project}/details', [ProjectController::class, 'details'])->middleware('project.access:view')->name('admin.projects.details');
        Route::get('/projects/{project}/gallery', [ProjectController::class, 'gallery'])->middleware('project.access:view')->name('admin.projects.gallery');
        Route::get('/projects/{project}/design', [ProjectController::class, 'design'])->middleware('project.access:view')->name('admin.projects.design');
        Route::get('/projects/{project}/ai', [ProjectController::class, 'ai'])->middleware('project.access:view')->name('admin.projects.ai');
        Route::get('/projects/{project}/management', [ProjectController::class, 'management'])->middleware(['project.access:view', 'tenant.finance'])->name('admin.projects.management');
        Route::put('/projects/{project}', [ProjectController::class, 'update'])->middleware('project.access:manage_gallery')->name('admin.projects.update');
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->middleware('project.access:manage_gallery')->name('admin.projects.destroy');

        // Fotos del proyecto
        Route::post('/projects/{project}/photos', [GalleryController::class, 'upload'])->middleware(['project.access:upload', 'tenant.feature:photo_uploads'])->name('admin.projects.photos.upload');
        Route::put('/projects/{project}/photos/{photo}', [GalleryController::class, 'updatePhoto'])->middleware('project.access:manage_gallery')->name('admin.projects.photos.update');
        Route::delete('/projects/{project}/photos/{photo}', [GalleryController::class, 'destroyPhoto'])->middleware('project.access:manage_gallery')->name('admin.projects.photos.delete');

        // Colaboradores
        Route::post('/projects/{project}/collaborators', [ProjectCollaboratorController::class, 'store'])->middleware('tenant.admin')->name('admin.projects.collaborators.store');
        Route::delete('/projects/{project}/collaborators/{collaborator}', [ProjectCollaboratorController::class, 'destroy'])->middleware('tenant.admin')->name('admin.projects.collaborators.destroy');
        Route::post('/projects/{project}/collaborators/{collaborator}/regenerate', [ProjectCollaboratorController::class, 'regenerate'])->middleware('tenant.admin')->name('admin.projects.collaborators.regenerate');
        Route::post('/projects/{project}/collaborators/{collaborator}/revoke', [ProjectCollaboratorController::class, 'revoke'])->middleware('tenant.admin')->name('admin.projects.collaborators.revoke');

        // IA — Reconocimiento facial y Gemini
        Route::post('/projects/{project}/face-identities', [GalleryController::class, 'storeIdentity'])->middleware(['project.access:manage_gallery', 'tenant.feature:ai_scans'])->name('admin.projects.face-identities.store');
        Route::delete('/projects/{project}/face-identities/{faceIdentity}', [GalleryController::class, 'destroyIdentity'])->middleware('project.access:manage_gallery')->name('admin.projects.face-identities.delete');
        Route::post('/projects/{project}/recognition/test', [GalleryController::class, 'testRecognition'])->middleware('project.access:manage_gallery')->name('admin.projects.recognition.test');
        Route::post('/projects/{project}/recognition/run', [GalleryController::class, 'recognizeProject'])->middleware(['project.access:manage_gallery', 'tenant.feature:ai_scans'])->name('admin.projects.recognition.run');
        Route::delete('/projects/{project}/recognition', [GalleryController::class, 'clearProjectRecognition'])->middleware('project.access:manage_gallery')->name('admin.projects.recognition.clear');
        Route::post('/projects/{project}/photos/{photo}/gemini', [GalleryController::class, 'analyzePhotoWithGemini'])->middleware(['project.access:manage_gallery', 'tenant.feature:ai_scans', 'gemini.rate'])->name('admin.projects.photos.gemini');
        Route::post('/projects/{project}/photos/{photo}/manual-face', [GalleryController::class, 'storeManualFaceTag'])->middleware('project.access:manage_gallery')->name('admin.projects.photos.manual-face');
        Route::post('/projects/{project}/photos/{photo}/recognition', [GalleryController::class, 'recognizePhoto'])->middleware(['project.access:manage_gallery', 'tenant.feature:ai_scans'])->name('admin.projects.photos.recognition');
        Route::delete('/projects/{project}/photos/{photo}/recognition', [GalleryController::class, 'clearPhotoRecognition'])->middleware('project.access:manage_gallery')->name('admin.projects.photos.recognition.clear');

        // Finanzas — contratos e invoices (tenant.finance)
        Route::post('/projects/{project}/contract', [ProjectController::class, 'generateContract'])->middleware('tenant.finance')->name('admin.projects.contract.create');
        Route::post('/projects/{project}/invoices', [InvoiceController::class, 'store'])->middleware('tenant.finance')->name('admin.projects.invoices.store');
        Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->middleware('tenant.finance')->name('admin.invoices.pdf');
        Route::put('/invoices/{invoice}/pay', [InvoiceController::class, 'markAsPaid'])->middleware('tenant.finance')->name('admin.invoices.pay');
        Route::put('/invoices/{invoice}/toggle-tax', [InvoiceController::class, 'toggleTax'])->middleware('tenant.finance')->name('admin.invoices.toggle-tax');
        Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'recordPayment'])->middleware('tenant.finance')->name('admin.invoices.payments.store');
    });
});
