<?php

namespace App\Enums;

enum CredentialType: string
{
    case DEGREE = 'DEGREE';
    case CERTIFICATION = 'CERTIFICATION';
    case TRAINING = 'TRAINING';
    case FELLOWSHIP = 'FELLOWSHIP';
    case OTHER = 'OTHER';
}