<?php

namespace App\Http\Middleware;

use App\Enums\UserType;
use App\Models\User;
use App\Support\UserLandingPage;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return redirect()->guest(route('login'));
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

        if (! $request->isMethodSafe()) {
            abort(403);
        }

        $path = UserLandingPage::pathFor($user);

        abort_unless($path, 403);

        return redirect($path);
    }
}
