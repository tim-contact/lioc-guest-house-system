<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('contact_information')) {
            return;
        }

        $now = now();

        foreach (DB::table('agents')->get(['id', 'contact', 'mail_id']) as $agent) {
            $this->insertContacts('agent', (int) $agent->id, 'phone', $agent->contact, $now);
            $this->insertContacts('agent', (int) $agent->id, 'email', $agent->mail_id, $now);
        }

        foreach (DB::table('agent_pics')->get(['id', 'mobile']) as $agentPic) {
            $this->insertContacts('agent_pic', (int) $agentPic->id, 'phone', $agentPic->mobile, $now);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('contact_information')) {
            return;
        }

        DB::table('contact_information')
            ->whereIn('contactable_type', ['agent', 'agent_pic'])
            ->delete();
    }

    private function insertContacts(string $type, int $id, string $kind, ?string $values, mixed $timestamp): void
    {
        foreach ($this->splitContacts($values) as $index => $value) {
            DB::table('contact_information')->insertOrIgnore([
                'contactable_type' => $type,
                'contactable_id' => $id,
                'kind' => $kind,
                'value' => $value,
                'is_primary' => $index === 0,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }
    }

    /**
     * @return list<string>
     */
    private function splitContacts(?string $values): array
    {
        return collect(preg_split('/\s*[;\/,]\s*/', trim((string) $values)) ?: [])
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
};
