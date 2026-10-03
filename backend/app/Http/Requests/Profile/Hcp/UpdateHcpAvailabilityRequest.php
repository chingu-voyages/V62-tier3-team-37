<?php

namespace App\Http\Requests\Profile\Hcp;

use App\Enums\DayOfWeek;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateHcpAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::HCP;
    }

    public function rules(): array
    {
        return [
            'slots' => [
                'present',
                'array',
                'max:35',
            ],
            'slots.*.day' => [
                'required',
                Rule::in(array_map(
                    fn (DayOfWeek $day): string => $day->shortName(),
                    DayOfWeek::cases()
                )),
            ],
            'slots.*.start_time' => [
                'required',
                'date_format:H:i',
            ],
            'slots.*.end_time' => [
                'required',
                'date_format:H:i',
                'after:slots.*.start_time',
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $slotsByDay = [];

                foreach ($this->input('slots', []) as $index => $slot) {
                    $slotsByDay[$slot['day']][] = [
                        'index' => $index,
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                    ];
                }

                foreach ($slotsByDay as $slots) {
                    usort(
                        $slots,
                        fn (array $left, array $right): int => $left['start_time'] <=> $right['start_time']
                    );

                    for ($position = 1; $position < count($slots); $position++) {
                        $previous = $slots[$position - 1];
                        $current = $slots[$position];

                        if ($current['start_time'] < $previous['end_time']) {
                            $validator->errors()->add(
                                "slots.{$current['index']}.start_time",
                                'Availability slots cannot overlap on the same day.'
                            );
                        }
                    }
                }
            },
        ];
    }
}
