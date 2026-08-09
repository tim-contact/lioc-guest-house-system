<?php

use App\Models\User;

test('users receive ULID primary keys, not integer auto-increment', function () {
    $user = User::factory()->create();

    // ULIDs are 26-character strings, not integers.
    expect($user->id)
        ->toBeString()
        ->toHaveLength(26);

    // Verify the database stores the ULID string.
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
    ]);
});

test('user_id is unique — creating two users with the same user_id fails', function () {
    User::factory()->create(['user_id' => 'USR-001']);

    $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);

    User::factory()->create(['user_id' => 'USR-001']);
});

test('user_id can change without changing the internal ULID id', function () {
    $user = User::factory()->create(['user_id' => 'USR-001']);

    $originalId = $user->id;

    $user->user_id = 'USR-002';
    $user->save();

    $user->refresh();

    expect($user->id)->toBe($originalId)
        ->and($user->user_id)->toBe('USR-002');
});
