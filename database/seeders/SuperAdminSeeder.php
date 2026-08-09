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
        if (User::where('type', UserType::SuperAdmin)->exists()) {
            return;
        }

        User::create([
            'user_id' => 'SUPER-ADMIN-001',
            'name' => 'Super Admin',
            'type' => UserType::SuperAdmin,
            'email' => env('AdminEmail', 'superadmin@example.com'),
            'password' => Hash::make(env('AdminPassword', 'password')),
            'is_active' => true,
        ]);
    }
}
