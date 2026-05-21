<?php

declare(strict_types=1);

namespace App\Enums;

enum HabitCategory: string
{
    case Health = 'health';
    case Productivity = 'productivity';
    case Learning = 'learning';
    case Fitness = 'fitness';
    case Mindfulness = 'mindfulness';
    case Other = 'other';
}
