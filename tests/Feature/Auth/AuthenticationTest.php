<?php

use App\Enums\UserType;
use App\Models\User;
use App\Support\UserLandingPage;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Fortify\Features;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('authenticated users visiting the login screen are redirected to their landing page', function () {
    $user = User::factory()->create(['type' => UserType::Operations]);

    $response = $this->actingAs($user)->get(route('login'));

    $response->assertRedirect(route('operations', absolute: false));
});

test('authenticated users visiting the welcome page are redirected to their landing page', function () {
    $user = User::factory()->create(['type' => UserType::Finance]);

    $response = $this->actingAs($user)->get(route('home'));

    $response->assertRedirect(route('finance', absolute: false));
});

test('users can authenticate using the login screen', function (UserType $type) {
    $user = User::factory()->create(['type' => $type]);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(UserLandingPage::pathFor($user));
})->with(UserType::cases());

test('users without a role receive forbidden after authentication', function () {
    $user = User::factory()->create(['type' => null]);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertForbidden();
});

test('login ignores a forbidden intended url and redirects to the role landing page', function () {
    $user = User::factory()->create(['type' => UserType::Finance]);

    $response = $this
        ->withSession(['url.intended' => route('admin')])
        ->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('finance', absolute: false));
});

test('users with two factor enabled are redirected to two factor challenge', function () {
    $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    $user = User::factory()->withTwoFactor()->create();

    $response = $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('two-factor.login'));
    $response->assertSessionHas('login.id', $user->id);
    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $response->assertRedirect(route('home'));

    $this->assertGuest();
});

test('users are rate limited', function () {
    $user = User::factory()->create();

    RateLimiter::increment(md5('login'.implode('|', [$user->email, '127.0.0.1'])), amount: 5);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertTooManyRequests();
});
