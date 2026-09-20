<?php

namespace App\Enums;

enum UserRole: string
{
    case PATIENT = 'PATIENT';
    case HCP = 'HCP';
    case ADMIN = 'ADMIN';
}
