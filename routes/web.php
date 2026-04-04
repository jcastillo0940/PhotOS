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
use Illuminate\Support\Facades\Route;

// Public: Studio Website
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::post('/leads', [LeadController::class, 'store'])->name('leads.store');

// Auth: Studio Access
Route::get('/login', [AuthController::class, 'loginView'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Admin: CRM/ERP (Protected)
Route::prefix('admin')->middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard.alias');
    Route::get('/website', [WebsiteController::class, 'index'])->name('admin.website');
    Route::put('/website', [WebsiteController::class, 'update'])->name('admin.website.update');
    Route::get('/contracts', [ContractController::class, 'index'])->name('admin.contracts');
    Route::get('/contracts/{contract}/edit', [ContractController::class, 'edit'])->name('admin.contracts.edit');
    Route::put('/contracts/{contract}', [ContractController::class, 'update'])->name('admin.contracts.update');
    Route::get('/contracts/{contract}/print', [ContractController::class, 'print'])->name('admin.contracts.print');
    Route::get('/contracts/{contract}', [ContractController::class, 'show'])->name('admin.contracts.show');
    Route::get('/limits', [LimitsController::class, 'index'])->name('admin.limits');

    
    // Master Calendar
    Route::get('/calendar', [EventController::class, 'index'])->name('admin.calendar');
    Route::post('/events', [EventController::class, 'store'])->name('admin.events.store');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('admin.events.delete');

    // Global Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('admin.settings');
    Route::put('/settings', [SettingsController::class, 'update'])->name('admin.settings.update');
    Route::middleware('developer')->group(function () {
        Route::get('/templates', [TemplateController::class, 'index'])->name('admin.templates');
        Route::put('/templates', [TemplateController::class, 'update'])->name('admin.templates.update');
    });
    
    Route::get('/leads', [LeadController::class, 'index'])->name('admin.leads');
    Route::get('/leads/create', [LeadController::class, 'create'])->name('admin.leads.create');
    Route::post('/leads', [LeadController::class, 'store'])->name('admin.leads.store');
    Route::get('/leads/{lead}', [LeadController::class, 'show'])->name('admin.leads.show');
    Route::put('/leads/{lead}/status', [LeadController::class, 'updateStatus'])->name('admin.leads.status');
    
    // Project Conversion & Management
    Route::post('/leads/{lead}/convert', [ProjectController::class, 'convert'])->name('admin.leads.convert');
    Route::post('/projects', [ProjectController::class, 'storeDirect'])->name('admin.projects.store');
    Route::get('/projects', [ProjectController::class, 'index'])->name('admin.projects');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('admin.projects.show');
    Route::put('/projects/{project}', [ProjectController::class, 'update'])->name('admin.projects.update');
    Route::post('/projects/{project}/photos', [GalleryController::class, 'upload'])->name('admin.projects.photos.upload');
    Route::put('/projects/{project}/photos/{photo}', [GalleryController::class, 'updatePhoto'])->name('admin.projects.photos.update');
    Route::delete('/projects/{project}/photos/{photo}', [GalleryController::class, 'destroyPhoto'])->name('admin.projects.photos.delete');
    
    // Contracts & Invoicing
    Route::post('/projects/{project}/contract', [ProjectController::class, 'generateContract'])->name('admin.projects.contract.create');
    Route::post('/projects/{project}/invoices', [InvoiceController::class, 'store'])->name('admin.projects.invoices.store');
    Route::put('/invoices/{invoice}/pay', [InvoiceController::class, 'markAsPaid'])->name('admin.invoices.pay');
});

// Public: Contracts & Signatures
Route::get('/sign/{token}', [ProjectController::class, 'publicSignatureView'])->name('public.contract.view');
Route::post('/sign/{token}', [ProjectController::class, 'signContract'])->name('public.contract.sign');
Route::get('/sign/{token}/print', [ContractController::class, 'publicPrint'])->name('public.contract.print');

// Public: Professional Gallery
Route::get('/gallery/{token}', [GalleryController::class, 'show'])->name('public.gallery.show');
Route::post('/gallery/{token}/unlock', [GalleryController::class, 'unlock'])->name('public.gallery.unlock');
Route::post('/gallery/photo/{photo}/toggle', [GalleryController::class, 'toggleHeart'])->name('public.gallery.heart');
Route::get('/gallery/photo/{photo}/download', [GalleryController::class, 'download'])->name('public.gallery.download');
Route::get('/gallery/{token}/download/full', [GalleryController::class, 'downloadFullGallery'])->name('public.gallery.download.full');


// Public: Payments
Route::post('/gallery/{token}/buy/full', [PaymentController::class, 'purchaseFullGallery'])->name('public.gallery.buy.full');
Route::post('/gallery/{token}/buy/pack', [PaymentController::class, 'purchaseExtraPack'])->name('public.gallery.buy.pack');
