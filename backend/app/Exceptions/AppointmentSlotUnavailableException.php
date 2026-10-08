<?php

namespace App\Exceptions;

use RuntimeException;

class AppointmentSlotUnavailableException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('The selected appointment slot is no longer available.');
    }
}
