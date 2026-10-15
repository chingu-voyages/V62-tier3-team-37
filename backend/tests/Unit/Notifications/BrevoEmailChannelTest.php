<?php

namespace Tests\Unit\Notifications;

use App\Notifications\Channels\BrevoEmailChannel;
use App\Notifications\EmailVerificationOtpNotification;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class BrevoEmailChannelTest extends TestCase
{
    public function test_notification_uses_mail_channel_when_brevo_api_is_disabled(): void
    {
        config()->set('services.brevo.use_api', false);

        $notification = new EmailVerificationOtpNotification('123456');

        $this->assertSame(['mail'], $notification->via($this->notifiable()));
    }

    public function test_notification_uses_brevo_channel_when_api_is_enabled(): void
    {
        config()->set('services.brevo.use_api', true);

        $notification = new EmailVerificationOtpNotification('123456');

        $this->assertSame(
            [BrevoEmailChannel::class],
            $notification->via($this->notifiable())
        );
    }

    public function test_channel_sends_otp_through_brevo_api(): void
    {
        config()->set('services.brevo', [
            'api_key' => 'test-api-key',
            'from_email' => 'verified@example.com',
            'from_name' => 'HealthHup',
            'use_api' => true,
        ]);

        Http::fake([
            'api.brevo.com/*' => Http::response(['messageId' => 'test-id'], 201),
        ]);

        $notification = new EmailVerificationOtpNotification('123456');

        (new BrevoEmailChannel)->send($this->notifiable(), $notification);

        Http::assertSent(function (Request $request): bool {
            return $request->url() === 'https://api.brevo.com/v3/smtp/email'
                && $request->hasHeader('api-key', 'test-api-key')
                && $request['sender'] === [
                    'name' => 'HealthHup',
                    'email' => 'verified@example.com',
                ]
                && $request['to'] === [[
                    'email' => 'patient@example.com',
                    'name' => 'Test Patient',
                ]]
                && $request['subject'] === 'Verify your HealthHup email'
                && str_contains($request['htmlContent'], '123456');
        });
    }

    public function test_channel_fails_before_sending_when_credentials_are_missing(): void
    {
        config()->set('services.brevo.api_key', null);
        config()->set('services.brevo.from_email', null);

        Http::fake();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Brevo API credentials are not configured.');

        try {
            (new BrevoEmailChannel)->send(
                $this->notifiable(),
                new EmailVerificationOtpNotification('123456')
            );
        } finally {
            Http::assertNothingSent();
        }
    }

    private function notifiable(): object
    {
        return (object) [
            'email' => 'patient@example.com',
            'first_name' => 'Test',
            'last_name' => 'Patient',
        ];
    }
}
