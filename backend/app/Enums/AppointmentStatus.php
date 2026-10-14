<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case BOOKED = 'BOOKED';
    case ARRIVED = 'ARRIVED';
    case RESCHEDULED = 'RESCHEDULED';
    case NO_SHOW = 'NO_SHOW';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';
}
