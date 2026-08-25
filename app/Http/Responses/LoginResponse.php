<?php

namespace App\Http\Responses;

use App\Models\User;
use App\Support\UserLandingPage;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents a successful login.
     */
    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        /** @var User $user */
        $user = $request->user();

        return redirect(UserLandingPage::pathFor($user));
    }
}
