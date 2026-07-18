<?php

/**
 * Surface: API (REST v1)
 * Autenticación: Bearer token (Sanctum personal access tokens)
 * Tenant: resuelto desde el token, no del dominio
 * Middleware: api.tenant (ResolveApiTenant)
 */

use App\Http\Controllers\Api\V1\InvoiceController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Middleware\ResolveApiTenant;
use Illuminate\Support\Facades\Route;

Route::prefix('api/v1')->middleware([ResolveApiTenant::class])->group(function () {

    // Identidad del tenant autenticado
    Route::get('/me', MeController::class)->name('api.v1.me');

    // Proyectos
    Route::apiResource('projects', ProjectController::class)->names([
        'index'   => 'api.v1.projects.index',
        'show'    => 'api.v1.projects.show',
        'store'   => 'api.v1.projects.store',
        'update'  => 'api.v1.projects.update',
        'destroy' => 'api.v1.projects.destroy',
    ]);
    Route::get('projects/{project}/photos', [ProjectController::class, 'photos'])->name('api.v1.projects.photos');

    // Leads
    Route::apiResource('leads', LeadController::class)->names([
        'index'   => 'api.v1.leads.index',
        'show'    => 'api.v1.leads.show',
        'store'   => 'api.v1.leads.store',
        'update'  => 'api.v1.leads.update',
        'destroy' => 'api.v1.leads.destroy',
    ]);

    // Facturas
    Route::get('invoices', [InvoiceController::class, 'index'])->name('api.v1.invoices.index');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('api.v1.invoices.show');
    Route::post('projects/{project}/invoices', [InvoiceController::class, 'store'])->name('api.v1.invoices.store');
    Route::patch('invoices/{invoice}/pay', [InvoiceController::class, 'markPaid'])->name('api.v1.invoices.pay');
});
