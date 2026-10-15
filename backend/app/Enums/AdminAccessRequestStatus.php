<?php

namespace App\Enums;

enum AdminAccessRequestStatus: string
{
    case PENDING = 'PENDING';
    case APPROVED = 'APPROVED';
    case DECLINED = 'DECLINED';
}
