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
    case ORTHOPEDICS = 'ORTHOPEDICS';
    case OPHTHALMOLOGY = 'OPHTHALMOLOGY';
    case RADIOLOGY = 'RADIOLOGY';

    /**
     * Patient-facing label.
     *
     * The stored value is a screaming-snake enum case, which is correct for a
     * database and unreadable in a filter dropdown. Having the enum own the
     * display form keeps the two from drifting apart.
     */
    public function label(): string
    {
        return match ($this) {
            self::GENERAL_MEDICINE => 'General Medicine',
            self::CARDIOLOGY => 'Cardiology',
            self::DERMATOLOGY => 'Dermatology',
            self::NEUROLOGY => 'Neurology',
            self::PEDIATRICS => 'Pediatrics',
            self::PSYCHIATRY => 'Psychiatry',
            self::ORTHOPEDICS => 'Orthopedics',
            self::OPHTHALMOLOGY => 'Ophthalmology',
            self::RADIOLOGY => 'Radiology',
        };
    }

    /** Resolves a patient-facing label back to its case, case-insensitively. */
    public static function fromLabel(string $label): ?self
    {
        $needle = trim($label);

        foreach (self::cases() as $case) {
            if (strcasecmp($case->label(), $needle) === 0 || strcasecmp($case->value, $needle) === 0) {
                return $case;
            }
        }

        return null;
    }
}
