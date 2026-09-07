<?php

namespace App\Services;

use App\Models\Surveyor;
use App\Models\User;

/**
 * Centralized resolver for surveyor barge assignment authorization.
 *
 * - super_admin and master: unrestricted access (returns null).
 * - surveyor: returns the linked Surveyor record and assigned barge IDs.
 * - No assignment: returns a denied state.
 */
class SurveyorAssignment
{
    /**
     * Resolve the authenticated user's surveyor assignment.
     *
     * @return array{surveyor: Surveyor|null, barge_id: string|null, barge_ids: list<string>, denied: bool}
     */
    public static function resolve(User $user): array
    {
        // Privileged roles have unrestricted access.
        if ($user->type->isPrivileged()) {
            return [
                'surveyor' => null,
                'barge_id' => null,
                'barge_ids' => [],
                'denied' => false,
            ];
        }

        // Must be a surveyor-type user.
        if ($user->type->value !== 'surveyor') {
            return [
                'surveyor' => null,
                'barge_id' => null,
                'barge_ids' => [],
                'denied' => true,
            ];
        }

        $surveyor = $user->surveyor?->loadMissing('barges');
        $bargeIds = $surveyor?->barges->pluck('imo')->values()->all() ?? [];

        if ($surveyor?->barge_id && ! in_array($surveyor->barge_id, $bargeIds, true)) {
            $bargeIds = [$surveyor->barge_id, ...$bargeIds];
        }

        // Surveyor user with no linked profile or no barge assigned.
        if (! $surveyor || $bargeIds === []) {
            return [
                'surveyor' => $surveyor,
                'barge_id' => null,
                'barge_ids' => [],
                'denied' => true,
            ];
        }

        return [
            'surveyor' => $surveyor,
            'barge_id' => $bargeIds[0],
            'barge_ids' => $bargeIds,
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

        if (! in_array($orderBargeId, $assignment['barge_ids'], true)) {
            abort(403);
        }
    }

    /**
     * Authorize that a BDN barge operation targets the surveyor's assigned barge.
     *
     * Only the order's authoritative barge_id (from route-model binding) is used
     * for the authorization check. The controller later forces surveyors' submitted
     * barge_id to their assignment, so no untrusted user input is needed here.
     */
    public static function authorizeBdnBarge(User $user, string $orderBargeId): void
    {
        $assignment = static::resolve($user);

        if ($assignment['denied']) {
            abort(403);
        }

        // Privileged users can manage any barge.
        if ($assignment['barge_id'] === null && $user->type->isPrivileged()) {
            return;
        }

        // The order's barge must match the surveyor's assignment.
        if (! in_array($orderBargeId, $assignment['barge_ids'], true)) {
            abort(403);
        }
    }
}
