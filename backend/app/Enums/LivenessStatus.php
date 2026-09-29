<?php

namespace App\Enums;

enum LivenessStatus: string
{
    case PASSED = 'PASSED';
    case FAILED = 'FAILED';
}