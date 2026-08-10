<?php

namespace App\Services;

use App\Models\Surveyor;
use App\Models\User;

/**
 * Centralized resolver for surveyor barge assignment authorization.
 *
 * - super_admin and master: unrestricted access (returns null).
 * - surveyor: returns the linked Surveyor record and assigned barge_id.
 * - No assignment: returns a denied state.
 */
class SurveyorAssignment
{
    /**
     * Resolve the authenticated user's surveyor assignment.
     *
     * @return array{surveyor: Surveyor|null, barge_id: string|null, denied: bool}
     */
    public static function resolve(User $user): array
    {
        // Privileged roles have unrestricted access.
        if ($user->type->isPrivileged()) {
            return [
                'surveyor' => null,
                'barge_id' => null,
                'denied' => false,
            ];
        }

        // Must be a surveyor-type user.
        if ($user->type->value !== 'surveyor') {
            return [
                'surveyor' => null,
                'barge_id' => null,
                'denied' => true,
            ];
        }

        $surveyor = $user->surveyor;

        // Surveyor user with no linked profile or no barge assigned.
        if (! $surveyor || ! $surveyor->barge_id) {
            return [
                'surveyor' => $surveyor,
                'barge_id' => null,
                'denied' => true,
            ];
        }

        return [
            'surveyor' => $surveyor,
            'barge_id' => $surveyor->barge_id,
            'denied' => false,
        ];
    }

    /**
     * Authorize that an order belongs to the surveyor's assigned barge.
     * Privileged users always pass. Aborts 403 on failure.
     */
    public static function authorizeOrder(User $user, string $orderBargeId): void
    {
        $assignment = static::resolve($user);

        if ($assignment['denied']) {
            abort(403);
        }

        // Privileged users can access any barge.
        if ($assignment['barge_id'] === null && $user->type->isPrivileged()) {
            return;
        }

        if ($orderBargeId !== $assignment['barge_id']) {
            abort(403);
        }
    }

    /**
     * Authorize that a BDN barge operation targets the surveyor's assigned barge.
     * Also rejects attempts to change the barge_id away from the assignment.
     */
    public static function authorizeBdnBarge(User $user, string $bargeId, ?string $inputBargeId = null): void
    {
        $assignment = static::resolve($user);

        if ($assignment['denied']) {
            abort(403);
        }

        // Privileged users can manage any barge.
        if ($assignment['barge_id'] === null && $user->type->isPrivileged()) {
            return;
        }

        // If input is trying to change the barge, reject it.
        if ($inputBargeId !== null && $inputBargeId !== $assignment['barge_id']) {
            abort(403);
        }

        // The current barge must match the assignment.
        if ($bargeId !== $assignment['barge_id']) {
            abort(403);
        }
    }
}
