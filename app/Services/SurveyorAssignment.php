<?php

namespace App\Services;

use App\Enums\DeliveryMode;
use App\Models\Order;
use App\Models\Surveyor;
use App\Models\User;

/**
 * Centralized resolver for surveyor barge assignment authorization.
 *
 * - super_admin and master: unrestricted access (returns null).
 * - surveyor: returns the linked Surveyor record, assigned barge IDs, and assigned delivery modes.
 * - No assignment: returns a denied state.
 */
class SurveyorAssignment
{
    /**
     * Resolve the authenticated user's surveyor assignment.
     *
     * @return array{surveyor: Surveyor|null, barge_id: string|null, barge_ids: list<string>, delivery_modes: list<string>, denied: bool}
     */
    public static function resolve(User $user): array
    {
        // Privileged roles have unrestricted access.
        if ($user->type->isPrivileged()) {
            return [
                'surveyor' => null,
                'barge_id' => null,
                'barge_ids' => [],
                'delivery_modes' => [],
                'denied' => false,
            ];
        }

        // Must be a surveyor-type user.
        if ($user->type->value !== 'surveyor') {
            return [
                'surveyor' => null,
                'barge_id' => null,
                'barge_ids' => [],
                'delivery_modes' => [],
                'denied' => true,
            ];
        }

        $surveyor = $user->surveyor?->loadMissing(['barges', 'deliveryModeAssignments']);
        $bargeIds = $surveyor?->barges->pluck('imo')->values()->all() ?? [];
        $deliveryModes = $surveyor?->deliveryModeAssignments
            ->pluck('delivery_mode')
            ->map(fn (DeliveryMode|string $mode): string => $mode instanceof DeliveryMode ? $mode->value : $mode)
            ->values()
            ->all() ?? [];

        if ($surveyor?->barge_id && ! in_array($surveyor->barge_id, $bargeIds, true)) {
            $bargeIds = [$surveyor->barge_id, ...$bargeIds];
        }

        // Surveyor user with no linked profile or no delivery scope assigned.
        if (! $surveyor || ($bargeIds === [] && $deliveryModes === [])) {
            return [
                'surveyor' => $surveyor,
                'barge_id' => null,
                'barge_ids' => [],
                'delivery_modes' => [],
                'denied' => true,
            ];
        }

        return [
            'surveyor' => $surveyor,
            'barge_id' => $bargeIds[0] ?? null,
            'barge_ids' => $bargeIds,
            'delivery_modes' => $deliveryModes,
            'denied' => false,
        ];
    }

    /**
     * Authorize that an order belongs to the surveyor's assigned barge.
     * Privileged users always pass. Aborts 403 on failure.
     */
    public static function authorizeOrder(User $user, Order|string|null $order): void
    {
        $assignment = static::resolve($user);

        if ($assignment['denied']) {
            abort(403);
        }

        // Privileged users can access any barge.
        if ($assignment['barge_id'] === null && $user->type->isPrivileged()) {
            return;
        }

        if (! static::canAccessOrder($assignment, $order)) {
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
    public static function authorizeBdnBarge(User $user, Order|string|null $order): void
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
        if (! static::canAccessOrder($assignment, $order)) {
            abort(403);
        }
    }

    /**
     * @param  array{barge_ids: list<string>, delivery_modes: list<string>}  $assignment
     */
    private static function canAccessOrder(array $assignment, Order|string|null $order): bool
    {
        if ($order instanceof Order) {
            if ($order->delivery_mode === DeliveryMode::Barge || ($order->delivery_mode === null && $order->barge_id !== null)) {
                return $order->barge_id !== null && in_array($order->barge_id, $assignment['barge_ids'], true);
            }

            return $order->delivery_mode !== null
                && in_array($order->delivery_mode->value, $assignment['delivery_modes'], true);
        }

        return $order !== null && in_array($order, $assignment['barge_ids'], true);
    }
}
