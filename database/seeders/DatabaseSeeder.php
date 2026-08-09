<?php

namespace Database\Seeders;

use App\Enums\UserType;
use App\Models\Agent;
use App\Models\Customer;
use App\Models\Port;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(SuperAdminSeeder::class);

        // Demo users for each role — idempotent.
        $demoUsers = [
            ['user_id' => 'MASTER-001', 'name' => 'Master User', 'type' => UserType::Master, 'email' => 'master@example.com'],
            ['user_id' => 'SALES-001', 'name' => 'Sales User', 'type' => UserType::Sales, 'email' => 'sales@example.com'],
            ['user_id' => 'OPS-001', 'name' => 'Operations User', 'type' => UserType::Operations, 'email' => 'operations@example.com'],
            ['user_id' => 'SURVEYOR-001', 'name' => 'Surveyor User', 'type' => UserType::Surveyor, 'email' => 'surveyor@example.com'],
            ['user_id' => 'FINANCE-001', 'name' => 'Finance User', 'type' => UserType::Finance, 'email' => 'finance@example.com'],
        ];

        foreach ($demoUsers as $data) {
            if (! User::where('email', $data['email'])->exists()) {
                User::create([
                    'user_id' => $data['user_id'],
                    'name' => $data['name'],
                    'type' => $data['type'],
                    'email' => $data['email'],
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]);
            }
        }

        // Remove the old test user if it still exists (pre-ULID migration).
        User::where('email', 'test@example.com')->delete();

        // Placeholder records until real create flows exist.
        foreach (['111' => 'Customer1', '112' => 'Customer2', '113' => 'Customer3'] as $sapId => $name) {
            Customer::firstOrCreate(['sap_id' => $sapId], [
                'name' => $name,
                'address' => 'N/A',
                'credit_limit' => 0,
                'country' => 'N/A',
            ]);
        }

        foreach (['Colombo', 'Trincomalee', 'Hambantota', 'Galle'] as $name) {
            Port::firstOrCreate(['name' => $name]);
        }

        $agents = [
            ['name' => 'Agency1', 'address' => 'N/A', 'contact' => '0700000001', 'mail_id' => 'agency1@example.com', 'pics' => [
                ['name' => 'PIC One', 'mobile' => '0710000001'],
                ['name' => 'PIC One B', 'mobile' => '0710000011'],
            ]],
            ['name' => 'Agency2', 'address' => 'N/A', 'contact' => '0700000002', 'mail_id' => 'agency2@example.com', 'pics' => [
                ['name' => 'PIC Two', 'mobile' => '0710000002'],
                ['name' => 'PIC Two B', 'mobile' => '0710000022'],
            ]],
            ['name' => 'Agency3', 'address' => 'N/A', 'contact' => '0700000003', 'mail_id' => 'agency3@example.com', 'pics' => [
                ['name' => 'PIC Three', 'mobile' => '0710000003'],
                ['name' => 'PIC Three B', 'mobile' => '0710000033'],
            ]],
        ];

        foreach ($agents as $agent) {
            $record = Agent::firstOrCreate(['name' => $agent['name']], [
                'address' => $agent['address'],
                'contact' => $agent['contact'],
                'mail_id' => $agent['mail_id'],
            ]);

            foreach ($agent['pics'] as $pic) {
                $record->pics()->firstOrCreate(['name' => $pic['name']], ['mobile' => $pic['mobile']]);
            }
        }
    }
}
