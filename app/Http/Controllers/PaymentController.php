<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Purchase;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function purchaseFullGallery(Request $request, $token)
    {
        $project = Project::where('gallery_token', $token)->firstOrFail();

        // Redirect to Gateway (Mocked for Demo)
        // Here we would integrate PayPal or Tilopay SDK
        
        Purchase::create([
            'project_id' => $project->id,
            'amount' => $project->full_gallery_price,
            'status' => 'completed', // For demo we autoclose
            'gateway' => 'PayPal',
            'type' => 'full_gallery',
        ]);

        $project->update(['is_full_gallery_purchased' => true]);

        return redirect()->back()->with('success', 'Full Gallery Unlocked Successfully!');
    }

    public function purchaseExtraPack(Request $request, $token)
    {
        $project = Project::where('gallery_token', $token)->firstOrFail();

        Purchase::create([
            'project_id' => $project->id,
            'amount' => 19.99, // Static price for 5 extra downloads
            'status' => 'completed',
            'gateway' => 'Tilopay',
            'type' => 'extra_pack',
        ]);

        $project->increment('extra_download_quota', 5);

        return redirect()->back()->with('success', '5 Extra Downloads Added!');
    }
}
