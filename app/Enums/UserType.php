<?php

namespace App\Enums;

enum UserType: string
{
    case SuperAdmin = 'super_admin';
    case Master = 'master';
    case Sales = 'sales';
    case Operations = 'operations';
    case Surveyor = 'surveyor';
    case Finance = 'finance';

    /**
     * Return a human-readable label for the enum case.
     */
    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Master => 'Master',
            self::Sales => 'Sales',
            self::Operations => 'Operations',
            self::Surveyor => 'Surveyor',
            self::Finance => 'Finance',
        };
    }

    /**
     * Whether this role has privileged access (super_admin or master).
     */
    public function isPrivileged(): bool
    {
        return in_array($this, [self::SuperAdmin, self::Master], true);
    }

    /**
     * Whether this role can manage users.
     */
    public function canManageUsers(): bool
    {
        return $this->isPrivileged();
    }

    /**
     * Whether this role can manage users of the given role.
     *
     * SuperAdmin can manage anyone. Master can only manage
     * non-privileged roles (sales, operations, surveyor, finance).
     */
    public function canManageRole(UserType $targetRole): bool
    {
        if (! $this->canManageUsers()) {
            return false;
        }

        if ($this === self::SuperAdmin) {
            return true;
        }

        // Master can only manage non-privileged roles.
        return ! $targetRole->isPrivileged();
    }

    /**
     * Whether this role can manage super_admin users.
     */
    public function canManageSuperAdmins(): bool
    {
        return $this->canManageRole(self::SuperAdmin);
    }
}
