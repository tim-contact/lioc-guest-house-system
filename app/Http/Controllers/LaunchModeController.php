<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LaunchModeController extends Controller
{
    private const SettingsPath = 'launch-mode.json';

    public function index(): Response
    {
        return Inertia::render('launch/index', [
            'launchModeEnabled' => $this->enabled(),
        ]);
    }

    public function screen(): Response
    {
        return Inertia::render('launch/screen');
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        $written = Storage::disk('local')->put(self::SettingsPath, json_encode([
            'enabled' => $validated['enabled'],
        ], JSON_PRETTY_PRINT));

        if (! $written) {
            throw ValidationException::withMessages([
                'enabled' => 'Launch mode could not be updated.',
            ]);
        }

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => $validated['enabled']
                ? 'Launch mode enabled.'
                : 'Launch mode disabled.',
        ]);
    }

    private function enabled(): bool
    {
        if (! Storage::disk('local')->exists(self::SettingsPath)) {
            return (bool) config('launch.enabled');
        }

        $settings = json_decode(
            Storage::disk('local')->get(self::SettingsPath),
            true,
        );

        return (bool) ($settings['enabled'] ?? false);
    }
}
