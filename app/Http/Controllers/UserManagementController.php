<?php

namespace App\Http\Controllers;

use App\Enums\UserType;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request, UserPolicy $policy): Response
    {
        /** @var User $actor */
        $actor = $request->user();

        // Build filtered role options for the create/edit dropdown.
        $roleOptions = array_values(array_map(fn (UserType $type) => [
            'value' => $type->value,
            'label' => $type->label(),
        ], array_filter(UserType::cases(), fn (UserType $type) => $actor->type->canManageRole($type))));

        $query = User::query();

        // Hide users whose role the actor cannot manage.
        if (! $actor->type->canManageSuperAdmins()) {
            $query->where('type', '!=', UserType::SuperAdmin->value);
        }

        $users = $query->orderBy('created_at', 'desc')->get()
            ->map(fn (User $user) => $this->formatUser($user));

        return Inertia::render('users/index', [
            'users' => $users,
            'roleOptions' => $roleOptions,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = User::create([
            'user_id' => $data['user_id'] ?? null,
            'name' => $data['name'],
            'type' => UserType::from($data['type']),
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_active' => true,
        ]);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'User created successfully.',
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'User updated successfully.',
        ]);
    }

    /**
     * Deactivate the specified user.
     */
    public function deactivate(Request $request, User $user): RedirectResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $policy = app(UserPolicy::class);

        if (! $policy->deactivate($actor, $user)) {
            abort(403);
        }

        $user->update([
            'is_active' => false,
            'deactivated_at' => now(),
        ]);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'User deactivated successfully.',
        ]);
    }

    /**
     * Activate the specified user.
     */
    public function activate(Request $request, User $user): RedirectResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $policy = app(UserPolicy::class);

        if (! $policy->activate($actor, $user)) {
            abort(403);
        }

        $user->update([
            'is_active' => true,
            'deactivated_at' => null,
        ]);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'User activated successfully.',
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $policy = app(UserPolicy::class);

        if (! $policy->delete($actor, $user)) {
            abort(403);
        }

        $user->delete();

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'User deleted successfully.',
        ]);
    }

    /**
     * Return role options available to the current actor.
     */
    public function roleOptions(Request $request): \Illuminate\Http\JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $options = array_values(array_map(fn (UserType $type) => [
            'value' => $type->value,
            'label' => $type->label(),
        ], array_filter(UserType::cases(), fn (UserType $type) => $actor->type->canManageRole($type))));

        return response()->json($options);
    }

    /**
     * Format a user for the frontend.
     *
     * @return array<string, mixed>
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'user_id' => $user->user_id,
            'name' => $user->name,
            'email' => $user->email,
            'type' => $user->type->value,
            'type_label' => $user->type->label(),
            'is_active' => $user->is_active,
            'created_at' => $user->created_at->toISOString(),
            'updated_at' => $user->updated_at->toISOString(),
        ];
    }
}
