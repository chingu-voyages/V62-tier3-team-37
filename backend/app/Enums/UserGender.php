<?php

namespace App\Enums;

enum UserGender: string
{
    case MALE = 'MALE';
    case FEMALE = 'FEMALE';
    case PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY';
}
