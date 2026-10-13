<?php

namespace App\Http\Controllers\Hcp;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Hcp\ConnectedPatientResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HcpPatientController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $patientIds = $request->user()->hcpAppointments()
            ->where('status', '!=', AppointmentStatus::CANCELLED->value)
            ->select('patient_user_id');

        $patients = User::query()
            ->whereIn('id', $patientIds)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate(15);

        return ConnectedPatientResource::collection($patients);
    }
}
