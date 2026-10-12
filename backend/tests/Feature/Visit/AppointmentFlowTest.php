<?php

namespace Tests\Feature\Visit;

use App\Enums\DayOfWeek;
use App\Enums\Specialty;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\HcpReview;
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

    public function test_featured_clinicians_are_the_ones_patients_rated_well(): void
    {
        [$patient, $clinician] = $this->pair();
        HcpReview::query()->create([
            'hcp_user_id' => $clinician->id,
            'patient_user_id' => $patient->id,
            'rating' => 5,
            'comment' => 'Clear and kind.',
        ]);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/directory/featured')
            ->assertOk()
            ->assertJsonPath('data.0.id', $clinician->id)
            ->assertJsonPath('data.0.rating', 5)
            ->assertJsonPath('data.0.review_count', 1);
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
