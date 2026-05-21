<?php

declare(strict_types=1);

namespace App\Enums;

enum HabitFrequency: string
{
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Monthly = 'monthly';
}
