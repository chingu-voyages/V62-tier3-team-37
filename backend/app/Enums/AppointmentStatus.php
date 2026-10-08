<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case CONFIRMED = 'CONFIRMED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';
}
