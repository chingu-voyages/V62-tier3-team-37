<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case BOOKED = 'BOOKED';
    case ARRIVED = 'ARRIVED';
    case NO_SHOW = 'NO_SHOW';
    case POSTPONED = 'POSTPONED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';

    public function occupiesSlot(): bool
    {
        return in_array($this, [self::BOOKED, self::ARRIVED, self::POSTPONED], true);
    }

    public function canMove(): bool
    {
        return in_array($this, [self::BOOKED, self::POSTPONED], true);
    }
}
