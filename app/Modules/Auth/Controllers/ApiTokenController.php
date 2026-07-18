<?php

namespace App\Modules\Auth\Controllers;
use App\Http\Controllers\Controller;

use App\Modules\Tenancy\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class ApiTokenController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}
    public function index(Request $request)
    {
        $tokens = $request->user()
            ->tokens()
            ->latest()
            ->get()
            ->map(fn ($token) => [
                'id'           => $token->id,
                'name'         => $token->name,
                'last_used_at' => $token->last_used_at?->toIso8601String(),
                'expires_at'   => $token->expires_at?->toIso8601String(),
                'created_at'   => $token->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Settings/ApiTokens', [
            'tokens' => $tokens,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'expires_in' => 'nullable|integer|in:30,90,365',
        ]);

        $expiresAt = isset($data['expires_in'])
            ? Carbon::now()->addDays((int) $data['expires_in'])
            : null;

        $token = $request->user()->createToken(
            $data['name'],
            ['*'],
            $expiresAt
        );

        $this->audit->log('api_token.created', [
            'token_name' => $data['name'],
            'expires_at' => $expiresAt?->toIso8601String(),
        ]);

        return back()->with('new_token', $token->plainTextToken);
    }

    public function destroy(Request $request, int $tokenId)
    {
        $token = $request->user()->tokens()->where('id', $tokenId)->first();
        $tokenName = $token?->name;

        $request->user()->tokens()->where('id', $tokenId)->delete();

        $this->audit->log('api_token.revoked', ['token_id' => $tokenId, 'token_name' => $tokenName]);

        return back()->with('success', 'Token revocado correctamente.');
    }
}
