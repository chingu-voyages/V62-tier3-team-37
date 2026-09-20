<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_can_register(): void
    {
        $response = $this->post('/register/patient', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'birth_date' => '1995-05-15',
            'gender' => 'MALE',
            'email' => 'test@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
            'terms_accepted' => true,
        ]);

        $this->assertAuthenticated();
        $response->assertStatus(201);
    }

    public function test_hcp_can_register(): void
    {
        $response = $this->post('/register/hcp', [
            'first_name' => 'Dr',
            'last_name' => 'Nurse',
            'birth_date' => '1980-01-01',
            'gender' => 'FEMALE',
            'email' => 'hcp@example.com',
            'password' => 'Password1!',
            'password_confirmation' => 'Password1!',
            'terms_accepted' => true,
        ]);

        $this->assertAuthenticated();
        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'hcp@example.com',
            'role' => 'HCP',
        ]);
    }
}
