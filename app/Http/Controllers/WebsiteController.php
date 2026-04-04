<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Support\HomepageSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WebsiteController extends Controller
{
    public function index()
    {
        $content = HomepageSettings::get();

        return Inertia::render('Admin/Website/Index', [
            'homepage' => $content,
            'homepagePreview' => HomepageSettings::toFrontend($content),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'hero_image' => 'nullable|image|max:5120',
            'about_image' => 'nullable|image|max:5120',
            'gallery_image_0' => 'nullable|image|max:5120',
            'gallery_image_1' => 'nullable|image|max:5120',
            'gallery_image_2' => 'nullable|image|max:5120',
            'gallery_image_3' => 'nullable|image|max:5120',
            'gallery_image_4' => 'nullable|image|max:5120',
            'gallery_image_5' => 'nullable|image|max:5120',
            'featured_image_0' => 'nullable|image|max:5120',
            'featured_image_1' => 'nullable|image|max:5120',
            'featured_image_2' => 'nullable|image|max:5120',
        ]);

        $decoded = json_decode($validated['content'], true);
        abort_unless(is_array($decoded), 422, 'Invalid homepage payload.');

        $content = HomepageSettings::sanitize($decoded);
        $content['brand']['name'] = Setting::get('app_name', Setting::get('photographer_business_name', $content['brand']['name'] ?? 'PhotOS'));
        $content['brand']['tagline'] = Setting::get('app_tagline', $content['brand']['tagline'] ?? 'Admin platform');

        if ($request->hasFile('hero_image')) {
            $content['hero']['image_path'] = $this->storeImageInR2($request->file('hero_image'), 'hero');
        }

        if ($request->hasFile('about_image')) {
            $content['about']['image_path'] = $this->storeImageInR2($request->file('about_image'), 'about');
        }

        foreach (range(0, 5) as $index) {
            $field = 'gallery_image_'.$index;

            if ($request->hasFile($field)) {
                $content['gallery']['images'][$index] = $this->storeImageInR2($request->file($field), 'gallery-'.$index);
            }
        }

        foreach (range(0, 2) as $index) {
            $field = 'featured_image_'.$index;

            if ($request->hasFile($field)) {
                $content['featured']['items'][$index]['image_path'] = $this->storeImageInR2($request->file($field), 'featured-'.$index);
            }
        }

        HomepageSettings::save($content);

        return back()->with('success', 'Website updated successfully.');
    }

    private function storeImageInR2($file, string $slot): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $path = 'website/uploads/'.$slot.'-'.Str::uuid().'.'.$extension;

        Storage::disk('r2')->put($path, fopen($file->getRealPath(), 'r'));

        return 'r2://'.$path;
    }
}
