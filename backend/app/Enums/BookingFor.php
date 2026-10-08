<?php

namespace App\Enums;

enum BookingFor: string
{
    case SELF = 'SELF';
    case OTHER = 'OTHER';
}
