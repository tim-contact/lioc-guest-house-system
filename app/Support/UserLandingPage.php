<?php

namespace App\Support;

use App\Enums\UserType;
use App\Models\User;

class UserLandingPage
{
    /**
     * Return the first authorized page for the user's role.
     */
    public static function routeNameFor(User $user): string
    {
        return match ($user->type) {
            UserType::SuperAdmin, UserType::Master => 'admin',
            UserType::Sales => 'sales-dashboard',
            UserType::Operations => 'operations',
            UserType::Surveyor => 'surveyor',
            UserType::Finance => 'finance',
        };
    }

    /**
     * Return the relative URL for the user's landing page.
     */
    public static function pathFor(User $user): string
    {
        return route(self::routeNameFor($user), absolute: false);
    }
}
