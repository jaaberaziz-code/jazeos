<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\HabitCategory;
use App\Enums\HabitFrequency;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHabitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'category' => ['sometimes', 'required', Rule::in(array_column(HabitCategory::cases(), 'value'))],
            'frequency' => ['sometimes', 'required', Rule::in(array_column(HabitFrequency::cases(), 'value'))],
            'reminder_time' => ['nullable', 'date_format:H:i'],
            'reminder_enabled' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}
