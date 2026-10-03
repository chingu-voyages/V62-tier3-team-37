<?php

namespace App\Enums;

enum ConsultationType: string
{
    case IN_PERSON = 'IN_PERSON';
    case VIDEO = 'VIDEO';
    case PHONE = 'PHONE';
}