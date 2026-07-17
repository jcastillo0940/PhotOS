<?php

/**
 * Surface: AUTH
 * Audiencia: cualquier usuario que necesite autenticarse
 * Aplica a todas las superficies (studio, client, saas)
 */

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjectInvitationController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [AuthController::class, 'loginView'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Invitaciones a proyectos (colaboradores externos)
Route::get('/project-invitations/{token}', [ProjectInvitationController::class, 'show'])->name('project.invitations.show');
Route::post('/project-invitations/{token}/accept', [ProjectInvitationController::class, 'accept'])->name('project.invitations.accept');
Route::get('/project-invitations/{token}/gallery', [ProjectInvitationController::class, 'gallery'])->name('project.invitations.gallery');
Route::post('/project-invitations/{token}/photos', [ProjectInvitationController::class, 'upload'])
    ->middleware('tenant.feature:photo_uploads')
    ->name('project.invitations.photos');
