<?php

declare(strict_types=1);

namespace App\Services\Habits;

use App\Models\Habit;
use App\Models\HabitLog;
use Carbon\Carbon;

class HabitService
{
    public function create(array $data): Habit
    {
        $data['user_id'] = auth()->id();

        return Habit::create($data);
    }

    public function update(Habit $habit, array $data): Habit
    {
        $habit->update($data);

        return $habit->fresh();
    }

    public function delete(Habit $habit): void
    {
        $habit->logs()->delete();
        $habit->delete();
    }

    public function logCompletion(Habit $habit, ?string $date = null): HabitLog
    {
        $date = $date ? Carbon::parse($date) : today();

        // Don't double-log
        $existing = $habit->logs()->whereDate('completed_date', $date)->first();
        if ($existing) {
            return $existing;
        }

        $log = $habit->logs()->create([
            'completed_date' => $date,
        ]);

        $this->recalculateStreaks($habit);

        return $log;
    }

    public function unlogCompletion(Habit $habit, ?string $date = null): void
    {
        $date = $date ? Carbon::parse($date) : today();

        $habit->logs()->whereDate('completed_date', $date)->delete();

        $this->recalculateStreaks($habit);
    }

    public function recalculateStreaks(Habit $habit): void
    {
        // Get all completion dates ordered desc
        $dates = $habit->logs()
            ->orderByDesc('completed_date')
            ->pluck('completed_date')
            ->map(fn ($d) => Carbon::parse($d))
            ->values();

        $totalCompletions = $dates->count();
        $currentStreak = 0;
        $longestStreak = 0;

        if ($totalCompletions > 0) {
            $frequency = $habit->frequency;
            $expectedDiff = match ($frequency) {
                'daily' => 1,
                'weekly' => 7,
                'monthly' => 30,
            };

            // Calculate current streak
            $today = today();

            // Check if last completion is recent enough
            $lastDate = $dates->first();
            $diffFromToday = $today->diffInDays($lastDate);

            // For daily: must be today or yesterday to keep streak
            // For weekly: must be within last 7 days
            // For monthly: must be within last 30 days
            $gracePeriod = match ($frequency) {
                'daily' => 1,
                'weekly' => 7,
                'monthly' => 30,
            };

            if ($diffFromToday <= $gracePeriod) {
                $currentStreak = 1;
                for ($i = 0; $i < $totalCompletions - 1; $i++) {
                    $diff = $dates[$i]->diffInDays($dates[$i + 1]);
                    if ($diff <= $expectedDiff + ($frequency === 'daily' ? 1 : $expectedDiff)) {
                        $currentStreak++;
                    } else {
                        break;
                    }
                }
            }

            // Calculate longest streak
            $longestStreak = 1;
            $tempStreak = 1;
            for ($i = 0; $i < $totalCompletions - 1; $i++) {
                $diff = $dates[$i]->diffInDays($dates[$i + 1]);
                if ($diff <= $expectedDiff + ($frequency === 'daily' ? 1 : $expectedDiff)) {
                    $tempStreak++;
                    $longestStreak = max($longestStreak, $tempStreak);
                } else {
                    $tempStreak = 1;
                }
            }
        }

        $habit->update([
            'streak_current' => $currentStreak,
            'streak_longest' => $longestStreak,
            'total_completions' => $totalCompletions,
        ]);
    }
}
