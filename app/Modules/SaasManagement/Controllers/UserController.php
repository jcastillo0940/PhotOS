<?php

namespace App\Modules\SaasManagement\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Modules\Tenancy\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}
    public function index()
    {
        return Inertia::render('Admin/Saas/Users/Index', [
            'users' => User::withoutGlobalScope('tenant')
                ->with('tenant:id,name')
                ->orderBy('name')
                ->get()
                ->map(fn ($user) => [
                    'id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                    'tenant_name' => $user->tenant?->name ?? 'Sistema',
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ]),
            'tenants' => Tenant::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:owner,photographer,developer,operator',
        ]);

        if ($validated['role'] === 'photographer') {
            $validated['tenant_id'] = null;
        }

        $tenant = $validated['tenant_id'] ? Tenant::find($validated['tenant_id']) : null;
        if ($tenant) {
            $limit = $tenant->featureLimit('staff_limit');
            if ($limit !== null && $tenant->tenantUsers()->count() >= (int) $limit) {
                return back()->with('error', 'Has alcanzado el limite de usuarios de tu plan.');
            }
        }

        $newUser = User::create([
            'tenant_id' => $validated['tenant_id'],
            'name' => $validated['name'],
            'email' => Str::lower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'email_verified_at' => now(),
        ]);

        $this->audit->log('user.created', [
            'new_user_id'    => $newUser->id,
            'new_user_name'  => $newUser->name,
            'new_user_email' => $newUser->email,
            'role'           => $newUser->role,
            'tenant_id'      => $newUser->tenant_id,
        ]);

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(Request $request, $id)
    {
        $user = User::withoutGlobalScope('tenant')->findOrFail($id);

        $validated = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,'.$user->id,
            'role' => 'required|string|in:owner,photographer,developer,operator',
            'password' => 'nullable|string|min:8',
        ]);

        $tenantId = $validated['role'] === 'photographer'
            ? null
            : ($validated['tenant_id'] ?? null);

        $tenant = $tenantId ? Tenant::find($tenantId) : null;
        if ($tenant) {
            $limit = $tenant->featureLimit('staff_limit');
            $assignedUsers = $tenant->tenantUsers()
                ->where('id', '!=', $user->id)
                ->count();

            if ($limit !== null && $assignedUsers >= (int) $limit) {
                return back()->with('error', 'Has alcanzado el limite de usuarios de tu plan.');
            }
        }

        $user->tenant_id = $tenantId;
        $user->name = $validated['name'];
        $user->email = Str::lower(trim($validated['email']));
        $user->role = $validated['role'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return back()->with('success', 'Usuario actualizado.');
    }

    public function destroy($id)
    {
        $user = User::withoutGlobalScope('tenant')->findOrFail($id);

        if ($user->id === auth()->id()) {
            return back()->with('error', 'No puedes eliminarte a ti mismo.');
        }

        $this->audit->log('user.deleted', [
            'deleted_user_id'    => $user->id,
            'deleted_user_name'  => $user->name,
            'deleted_user_email' => $user->email,
            'role'               => $user->role,
            'tenant_id'          => $user->tenant_id,
        ]);

        $user->delete();

        return back()->with('success', 'Usuario eliminado.');
    }
}
