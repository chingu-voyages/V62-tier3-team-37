<?php

namespace App\Enums;

enum DayOfWeek: int
{
    case SUNDAY = 0;
    case MONDAY = 1;
    case TUESDAY = 2;
    case WEDNESDAY = 3;
    case THURSDAY = 4;
    case FRIDAY = 5;
    case SATURDAY = 6;

    public static function fromShortName(string $day): self
    {
        return match ($day) {
            'SUN' => self::SUNDAY,
            'MON' => self::MONDAY,
            'TUE' => self::TUESDAY,
            'WED' => self::WEDNESDAY,
            'THU' => self::THURSDAY,
            'FRI' => self::FRIDAY,
            'SAT' => self::SATURDAY,
        };
    }

    public function shortName(): string
    {
        return substr($this->name, 0, 3);
    }
}
