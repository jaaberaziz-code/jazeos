<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Habit extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'name',
        'description',
        'category',
        'frequency',
        'reminder_time',
        'reminder_enabled',
        'streak_current',
        'streak_longest',
        'total_completions',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'reminder_enabled' => 'boolean',
            'is_active' => 'boolean',
            'reminder_time' => 'string',
            'streak_current' => 'integer',
            'streak_longest' => 'integer',
            'total_completions' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(HabitLog::class);
    }

    public function isCompletedToday(): bool
    {
        return $this->logs()
            ->whereDate('completed_date', today())
            ->exists();
    }

    public function isCompletedOn(string $date): bool
    {
        return $this->logs()
            ->whereDate('completed_date', $date)
            ->exists();
    }

    public function completionRate(int $days = 30): float
    {
        $expected = match ($this->frequency) {
            'daily' => $days,
            'weekly' => max(1, (int) ceil($days / 7)),
            'monthly' => max(1, (int) ceil($days / 30)),
        };

        $actual = $this->logs()
            ->whereDate('completed_date', '>=', now()->subDays($days))
            ->count();

        return $expected > 0 ? round(($actual / $expected) * 100, 1) : 0;
    }
}
