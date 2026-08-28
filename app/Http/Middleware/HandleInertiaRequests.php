<?php

namespace App\Http\Middleware;

use App\Enums\UserType;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $userType = $user?->type;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'user_id' => $user->user_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'type' => $userType instanceof UserType ? $userType->value : null,
                    'type_label' => $userType instanceof UserType ? $userType->label() : null,
                    'is_active' => $user->is_active,
                    'email_verified_at' => $user->email_verified_at,
                    'two_factor_enabled' => ! is_null($user->two_factor_confirmed_at),
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ] : null,
            ],
            'flash' => [
                'toast' => $request->session()->get('toast'),
            ],
        ];
    }
}
