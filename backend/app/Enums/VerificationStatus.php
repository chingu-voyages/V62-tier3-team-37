<?php

namespace App\Enums;

enum VerificationStatus: string
{
    // case PENDING = 'PENDING';
    case UNDER_REVIEW = 'UNDER_REVIEW';
    case VERIFIED = 'VERIFIED';
    case REJECTED = 'REJECTED';
}