<?php

namespace App\Http\Requests;

use App\Enums\UserType;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var User $actor */
        $actor = $this->user();

        if (! $actor) {
            return false;
        }

        /** @var User $target */
        $target = $this->route('user');

        $policy = app(\App\Policies\UserPolicy::class);

        // If role is being changed, check changeRole policy.
        if ($this->has('type')) {
            $newRole = UserType::tryFrom($this->input('type'));
            if ($newRole && $newRole !== $target->type) {
                if (! $policy->changeRole($actor, $target)) {
                    return false;
                }
                // Actor cannot assign a role they are not allowed to manage.
                if (! $actor->type->canManageRole($newRole)) {
                    return false;
                }
            }
        }

        // If user_id is being changed, check changeUserId policy.
        if ($this->has('user_id') && $this->input('user_id') !== $target->user_id) {
            if (! $policy->changeUserId($actor, $target)) {
                return false;
            }
        }

        return $policy->update($actor, $target);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $target */
        $target = $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email,'.$target->id],
            'type' => ['sometimes', 'string', 'in:'.implode(',', array_column(UserType::cases(), 'value'))],
            'user_id' => ['sometimes', 'nullable', 'string', 'max:255', 'unique:users,user_id,'.$target->id],
            'password' => ['sometimes', 'string', 'min:8'],
        ];
    }
}
