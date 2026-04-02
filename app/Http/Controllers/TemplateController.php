<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Support\GalleryTemplate;
use App\Support\InstallationPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Templates/Index', [
            'templates' => array_values(GalleryTemplate::all()),
            'currentTemplateCode' => GalleryTemplate::code(),
            'plans' => array_values(InstallationPlan::all()),
            'currentPlanCode' => InstallationPlan::code(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'installation_plan' => 'required|string',
            'active_gallery_template' => 'required|string',
        ]);

        abort_unless(array_key_exists($validated['installation_plan'], InstallationPlan::all()), 422, 'Plan invalido.');
        abort_unless(array_key_exists($validated['active_gallery_template'], GalleryTemplate::all()), 422, 'Plantilla invalida.');

        Setting::set(InstallationPlan::SETTING_KEY, $validated['installation_plan'], 'installation');
        Setting::set(GalleryTemplate::SETTING_KEY, $validated['active_gallery_template'], 'installation');

        return back()->with('success', 'Plantilla y plan global actualizados.');
    }
}

