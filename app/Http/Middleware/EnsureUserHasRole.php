<?php

namespace App\Http\Middleware;

use App\Enums\UserType;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        /** @var \App\Models\User|null $user */
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $userType = $user->type;

        if (! $userType instanceof UserType) {
            abort(403);
        }

        foreach ($roles as $role) {
            $roleEnum = UserType::tryFrom($role);

            if ($roleEnum && $userType === $roleEnum) {
                return $next($request);
            }
        }

        abort(403);
    }
}
