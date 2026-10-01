<?php

namespace App\Enums;

enum Specialty: string
{
    case GENERAL_MEDICINE = 'GENERAL_MEDICINE';
    case CARDIOLOGY = 'CARDIOLOGY';
    case DERMATOLOGY = 'DERMATOLOGY';
    case NEUROLOGY = 'NEUROLOGY';
    case PEDIATRICS = 'PEDIATRICS';
    case PSYCHIATRY = 'PSYCHIATRY';
}