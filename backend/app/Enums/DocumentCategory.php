<?php

namespace App\Enums;

enum DocumentCategory: string
{
    case MEDICAL = 'MEDICAL';
    case CREDENTIAL = 'CREDENTIAL';
    case KYC = 'KYC';
}