<?php

namespace App\Policies;

use App\Enums\UserType;
use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the actor can view any users.
     */
    public function viewAny(User $actor): bool
    {
        return $actor->type->canManageUsers();
    }

    /**
     * Determine whether the actor can view the given user.
     */
    public function view(User $actor, User $target): bool
    {
        if (! $actor->type->canManageUsers()) {
            return false;
        }

        return $actor->type->canManageRole($target->type);
    }

    /**
     * Determine whether the actor can create a user.
     */
    public function create(User $actor): bool
    {
        return $actor->type->canManageUsers();
    }

    /**
     * Determine whether the actor can create a user with the given role.
     */
    public function createWithRole(User $actor, UserType $role): bool
    {
        return $actor->type->canManageRole($role);
    }

    /**
     * Determine whether the actor can update the target user.
     */
    public function update(User $actor, User $target): bool
    {
        if (! $actor->type->canManageUsers()) {
            return false;
        }

        if (! $actor->type->canManageRole($target->type)) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the actor can delete the target user.
     */
    public function delete(User $actor, User $target): bool
    {
        if (! $actor->type->canManageUsers()) {
            return false;
        }

        if (! $actor->type->canManageRole($target->type)) {
            return false;
        }

        if ($this->isFirstSuperAdmin($target)) {
            return false;
        }

        // Cannot delete self.
        if ($actor->is($target)) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the actor can deactivate the target user.
     */
    public function deactivate(User $actor, User $target): bool
    {
        if (! $actor->type->canManageUsers()) {
            return false;
        }

        if (! $actor->type->canManageRole($target->type)) {
            return false;
        }

        if ($this->isFirstSuperAdmin($target)) {
            return false;
        }

        // Cannot deactivate self.
        if ($actor->is($target)) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the actor can activate the target user.
     */
    public function activate(User $actor, User $target): bool
    {
        if (! $actor->type->canManageUsers()) {
            return false;
        }

        if (! $actor->type->canManageRole($target->type)) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the actor can change the target user's role.
     */
    public function changeRole(User $actor, User $target): bool
    {
        if (! $actor->type->canManageUsers()) {
            return false;
        }

        if (! $actor->type->canManageRole($target->type)) {
            return false;
        }

        // First super admin cannot have role changed away from super admin.
        if ($this->isFirstSuperAdmin($target)) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the actor can change the target user's human-facing user_id.
     */
    public function changeUserId(User $actor, User $target): bool
    {
        if (! $actor->type->canManageUsers()) {
            return false;
        }

        if (! $actor->type->canManageRole($target->type)) {
            return false;
        }

        return true;
    }

    /**
     * Check whether the given user is the first super admin.
     */
    private function isFirstSuperAdmin(User $user): bool
    {
        if ($user->type !== UserType::SuperAdmin) {
            return false;
        }

        $firstSuperAdminId = User::where('type', UserType::SuperAdmin)
            ->orderBy('created_at')
            ->orderBy('id')
            ->value('id');

        return $user->id === $firstSuperAdminId;
    }
}
