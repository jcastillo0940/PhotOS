<?php

namespace App\Http\Controllers\Saas;

use App\Http\Controllers\Controller;
use App\Models\GalleryTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Saas/Templates/Index', [
            'templates' => GalleryTemplate::orderBy('id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:gallery_templates,code',
            'name' => 'required|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'layout' => 'required|string|max:100',
            'mood' => 'required|string|max:100',
            'accent_color' => 'required|string|max:20',
            'is_active' => 'required|boolean',
        ]);

        GalleryTemplate::create($validated);

        return back()->with('success', 'Plantilla creada.');
    }

    public function update(Request $request, GalleryTemplate $template)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'layout' => 'required|string|max:100',
            'mood' => 'required|string|max:100',
            'accent_color' => 'required|string|max:20',
            'is_active' => 'required|boolean',
        ]);

        $template->update($validated);

        return back()->with('success', 'Plantilla actualizada.');
    }

    public function destroy(GalleryTemplate $template)
    {
        $template->delete();
        return back()->with('success', 'Plantilla eliminada.');
    }
}
