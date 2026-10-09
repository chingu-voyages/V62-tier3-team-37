<?php

namespace App\Http\Requests\Patient;

use App\Enums\Specialty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Query parameters for the patient doctor directory.
 *
 * Filters arrive as patient-facing labels ("Cardiology", "Maadi") because those
 * are what the UI sends. `specialty` is normalised to its enum case in
 * `prepareForValidation`, so the controller only ever deals with `Specialty`.
 */
class HcpListingRequest extends FormRequest
{
    /** Ten rows per request: the client asks for the next ten when the user pages. */
    public const DEFAULT_PER_PAGE = 10;

    /** Bounded so a single request cannot pull the whole table. */
    public const MAX_PER_PAGE = 50;

    public const SORTS = ['best', 'name', 'rating', 'experience', 'price'];

    public function authorize(): bool
    {
        return $this->user()?->role !== null;
    }

    protected function prepareForValidation(): void
    {
        $normalized = [];

        foreach (['search', 'city', 'area', 'insurance'] as $field) {
            if ($this->filled($field) && is_string($this->input($field))) {
                $normalized[$field] = trim($this->input($field));
            }
        }

        // Only rewrite the value when the label actually resolves. An unknown
        // label is left untouched so the enum rule rejects it, rather than
        // being silently normalised to null and treated as "no filter".
        if ($this->filled('specialty') && is_string($this->input('specialty'))) {
            $specialty = Specialty::fromLabel($this->input('specialty'));

            if ($specialty) {
                $normalized['specialty'] = $specialty->value;
            }
        }

        $this->merge($normalized);
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:120'],
            'specialty' => ['sometimes', 'nullable', Rule::enum(Specialty::class)],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'area' => ['sometimes', 'nullable', 'string', 'max:100'],
            'insurance' => ['sometimes', 'nullable', 'string', 'max:50'],

            'sort' => ['sometimes', Rule::in(self::SORTS)],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
        ];
    }

    public function search(): ?string
    {
        $value = $this->validated('search');

        return is_string($value) && $value !== '' ? $value : null;
    }

    public function specialty(): ?Specialty
    {
        $value = $this->validated('specialty');

        return is_string($value) ? Specialty::from($value) : null;
    }

    public function city(): ?string
    {
        return $this->filled('city') ? (string) $this->validated('city') : null;
    }

    public function area(): ?string
    {
        return $this->filled('area') ? (string) $this->validated('area') : null;
    }

    public function insurance(): ?string
    {
        return $this->filled('insurance') ? (string) $this->validated('insurance') : null;
    }

    public function sort(): string
    {
        return $this->validated('sort') ?? 'best';
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? self::DEFAULT_PER_PAGE);
    }
}
