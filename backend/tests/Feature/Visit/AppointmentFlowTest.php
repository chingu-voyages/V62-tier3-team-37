<?php

namespace Tests\Feature\Visit;

use App\Enums\DayOfWeek;
use App\Enums\Specialty;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AppointmentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-12 08:00:00');
    }

    public function test_a_patient_can_book_an_open_time_and_the_clinician_can_finish_the_visit(): void
    {
        Storage::fake('local');
        [$patient, $clinician] = $this->pair();

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/directory?search='.$clinician->first_name)
            ->assertOk()
            ->assertJsonPath('data.0.id', $clinician->id);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/directory?city=Beirut&area=Hamra')
            ->assertOk()
            ->assertJsonPath('data.0.id', $clinician->id);

        $this->actingAs($patient, 'sanctum')
            ->getJson("/api/patient/clinicians/{$clinician->id}/slots?from=2026-10-12&to=2026-10-12")
            ->assertOk()
            ->assertJsonPath('data.2026-10-12.0', '09:00');

        $booked = $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'clinician_id' => $clinician->id,
                'date' => '2026-10-12',
                'time' => '09:00',
                'reason' => 'Skin check',
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'clinician_id' => $clinician->id,
                'date' => '2026-10-12',
                'time' => '09:00',
            ])
            ->assertUnprocessable();

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/status", ['status' => 'ARRIVED'])
            ->assertOk();

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/status", ['status' => 'BOOKED'])
            ->assertOk()
            ->assertJsonPath('data.status', 'BOOKED');

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/status", ['status' => 'NO_SHOW'])
            ->assertOk();

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/status", ['status' => 'BOOKED'])
            ->assertOk()
            ->assertJsonPath('data.status', 'BOOKED');

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/status", ['status' => 'ARRIVED'])
            ->assertOk();

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/summary", [
                'summary' => 'The visit went well. Start the cream tonight.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'COMPLETED');

        $this->actingAs($clinician, 'sanctum')
            ->post('/api/hcp/appointments/'.$booked.'/results', [
                'title' => 'Lab note',
                'file' => UploadedFile::fake()->create('lab.pdf', 20, 'application/pdf'),
            ])
            ->assertOk()
            ->assertJsonPath('data.results.0.title', 'Lab note');

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/appointments')
            ->assertOk()
            ->assertJsonPath('data.0.summary', 'The visit went well. Start the cream tonight.');

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/follow-up", [
                'date' => '2026-10-19',
                'time' => '09:30',
                'reason' => 'Check the cream',
            ])
            ->assertCreated();

        $this->actingAs($patient, 'sanctum')
            ->postJson('/api/messages', [
                'recipient_id' => $clinician->id,
                'body' => 'Thank you, I started the cream.',
            ])
            ->assertCreated();
    }

    public function test_an_unverified_clinician_stays_out_of_search(): void
    {
        $patient = User::factory()->create(['role' => UserRole::PATIENT]);
        $clinician = User::factory()->create(['role' => UserRole::HCP, 'first_name' => 'Hidden']);
        HcpProfile::factory()->create([
            'user_id' => $clinician->id,
            'specialty' => Specialty::DERMATOLOGY,
        ]);
        HcpVerification::factory()->create([
            'user_id' => $clinician->id,
            'status' => VerificationStatus::UNDER_REVIEW,
        ]);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/directory?search=Hidden')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    /**
     * A clinician who is verified but whose account is disabled must stay out of
     * the directory too.
     *
     * The two rules are separate filters on the same query, and the account-status
     * half had no patient-facing coverage once the old `/api/patient/hcps` test was
     * removed. Losing it would let a suspended clinician keep appearing in search.
     */
    public function test_a_disabled_clinician_stays_out_of_search(): void
    {
        $patient = User::factory()->create(['role' => UserRole::PATIENT]);
        $clinician = User::factory()->create([
            'role' => UserRole::HCP,
            'first_name' => 'Suspended',
            'status' => UserStatus::DISABLED,
        ]);
        HcpProfile::factory()->create([
            'user_id' => $clinician->id,
            'specialty' => Specialty::DERMATOLOGY,
        ]);
        HcpVerification::factory()->create([
            'user_id' => $clinician->id,
            'status' => VerificationStatus::VERIFIED,
        ]);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/directory?search=Suspended')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_identity_shared_with_admin_stays_locked(): void
    {
        $clinician = User::factory()->create(['role' => UserRole::HCP, 'first_name' => 'Rana']);
        HcpProfile::factory()->create(['user_id' => $clinician->id]);
        HcpVerification::factory()->create([
            'user_id' => $clinician->id,
            'status' => VerificationStatus::UNDER_REVIEW,
        ]);

        $this->actingAs($clinician, 'sanctum')
            ->patchJson('/api/hcp/profile', ['first_name' => 'Changed'])
            ->assertUnprocessable();

        $this->assertSame('Rana', $clinician->fresh()->first_name);
    }

    public function test_a_patient_cannot_book_without_a_phone_number(): void
    {
        [$patient] = $this->pair();
        $patient->update(['phone' => null]);
        $clinicianId = User::query()->where('role', UserRole::HCP)->value('id');

        $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'clinician_id' => $clinicianId,
                'date' => '2026-10-12',
                'time' => '09:00',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('phone');
    }

    public function test_directory_search_can_filter_by_insurance_and_clinic_area(): void
    {
        [$patient, $clinician] = $this->pair();
        $clinician->hcpProfile->update([
            'clinic_area' => 'Hamra',
            'accepted_insurances' => ['AXA', 'Allianz'],
        ]);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/directory?insurance=AXA&area=Hamra')
            ->assertOk()
            ->assertJsonPath('data.0.id', $clinician->id)
            ->assertJsonPath('data.0.accepted_insurances.0', 'AXA');

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/directory?insurance=Cigna')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_a_clinician_can_read_the_same_open_times_patients_book(): void
    {
        [, $clinician] = $this->pair();

        $this->actingAs($clinician, 'sanctum')
            ->getJson('/api/hcp/appointments/slots?from=2026-10-12&to=2026-10-12')
            ->assertOk()
            ->assertJsonPath('data.2026-10-12.0', '09:00');
    }

    public function test_updating_a_summary_replaces_it_and_undo_returns_the_visit_to_booked(): void
    {
        [$patient, $clinician] = $this->pair();

        $booked = $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'clinician_id' => $clinician->id,
                'date' => '2026-10-12',
                'time' => '10:00',
                'reason' => 'Skin check',
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/status", ['status' => 'ARRIVED'])
            ->assertOk();

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/summary", [
                'summary' => 'First note.',
            ])
            ->assertOk()
            ->assertJsonPath('data.summary', 'First note.');

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/summary", [
                'summary' => 'Replaced note.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'COMPLETED')
            ->assertJsonPath('data.summary', 'Replaced note.');

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/status", ['status' => 'BOOKED'])
            ->assertOk()
            ->assertJsonPath('data.status', 'BOOKED')
            ->assertJsonPath('data.summary', null);
    }

    public function test_a_clinician_cancel_keeps_the_visit_and_stores_the_reason(): void
    {
        [$patient, $clinician] = $this->pair();

        $booked = $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'clinician_id' => $clinician->id,
                'date' => '2026-10-12',
                'time' => '09:00',
                'reason' => 'Skin check',
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/cancel", [])
            ->assertUnprocessable();

        $this->actingAs($clinician, 'sanctum')
            ->postJson("/api/hcp/appointments/{$booked}/cancel", [
                'reason' => 'The clinic is closed that morning.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'CANCELLED')
            ->assertJsonPath('data.cancellation_reason', 'The clinic is closed that morning.');

        $this->actingAs($clinician, 'sanctum')
            ->getJson('/api/hcp/appointments')
            ->assertOk()
            ->assertJsonPath('data.0.id', $booked)
            ->assertJsonPath('data.0.status', 'CANCELLED');
    }

    /**
     * @return array{0: User, 1: User}
     */
    private function pair(): array
    {
        $patient = User::factory()->create([
            'role' => UserRole::PATIENT,
            'phone' => '+96170000001',
        ]);
        $clinician = User::factory()->create([
            'role' => UserRole::HCP,
            'first_name' => 'Rana',
            'last_name' => 'Khoury',
        ]);
        $profile = HcpProfile::factory()->create([
            'user_id' => $clinician->id,
            'specialty' => Specialty::DERMATOLOGY,
            'city' => 'Beirut',
            'workplace_address' => 'Hamra',
        ]);
        HcpAvailabilitySlot::factory()->create([
            'hcp_profile_id' => $profile->id,
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '09:00',
            'end_time' => '12:00',
        ]);
        HcpVerification::factory()->create([
            'user_id' => $clinician->id,
            'status' => VerificationStatus::VERIFIED,
        ]);

        return [$patient, $clinician];
    }
}
