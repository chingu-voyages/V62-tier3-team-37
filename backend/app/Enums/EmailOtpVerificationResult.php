<?php

namespace App\Enums;

enum EmailOtpVerificationResult
{
    case VERIFIED;
    case ALREADY_VERIFIED;
    case INVALID;
    case EXPIRED;
    case NOT_FOUND;
    case TOO_MANY_ATTEMPTS;
}
