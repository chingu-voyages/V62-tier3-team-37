<?php

namespace App\Enums;

enum ReportStatus: string
{
    case OPEN = 'OPEN';
    case RESOLVED = 'RESOLVED';
    case DISMISSED = 'DISMISSED';
}
