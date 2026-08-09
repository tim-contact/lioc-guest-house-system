<?php

namespace App\Http\Requests;

use App\Enums\UserType;
use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var \App\Models\User $actor */
        $actor = $this->user();

        if (! $actor) {
            return false;
        }

        $role = UserType::tryFrom($this->input('type'));

        if (! $role) {
            return false;
        }

        return app(\App\Policies\UserPolicy::class)->createWithRole($actor, $role);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
            'type' => ['required', 'string', 'in:'.implode(',', array_column(UserType::cases(), 'value'))],
            'user_id' => ['nullable', 'string', 'max:255', 'unique:users,user_id'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }
}
