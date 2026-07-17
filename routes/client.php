<?php

/**
 * Surface: CLIENT (Portal del cliente)
 * Audiencia: clientes del estudio fotográfico (role=client)
 * Dominio: app.misaeldavid.com
 * Guards: auth, client.role
 */

use App\Http\Controllers\ClientDashboardController;
use Illuminate\Support\Facades\Route;

Route::prefix('client')->middleware(['auth:client', 'client.role'])->group(function () {
    Route::get('/', [ClientDashboardController::class, 'index'])->name('client.dashboard');
});
