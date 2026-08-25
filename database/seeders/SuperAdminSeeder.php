<?php

namespace Database\Seeders;

use App\Enums\UserType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = env('AdminEmail', 'superadmin@example.com');

        $existingUser = User::query()
            ->where('type', UserType::SuperAdmin)
            ->orWhere('user_id', 'SUPER-ADMIN-001')
            ->orWhere('email', $email)
            ->exists();

        if ($existingUser) {
            return;
        }

        User::create([
            'user_id' => 'SUPER-ADMIN-001',
            'name' => 'Super Admin',
            'type' => UserType::SuperAdmin,
            'email' => $email,
            'password' => Hash::make(env('AdminPassword', 'password')),
            'is_active' => true,
        ]);
    }
}
