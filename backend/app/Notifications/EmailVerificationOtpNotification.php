<?php

namespace App\Notifications;

use App\Notifications\Channels\BrevoEmailChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerificationOtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $otp
    ) {}

    public function via(object $notifiable): array
    {
        return config('services.brevo.use_api')
            ? [BrevoEmailChannel::class]
            : ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify your HealthHup email')
            ->greeting('Hello '.$notifiable->first_name.'!')
            ->line('Use the following verification code to verify your email address:')
            ->line($this->otp)
            ->line('This code expires in 10 minutes.')
            ->line('If you did not create this account, you can ignore this email.');
    }

    /**
     * @return array{subject: string, html_content: string}
     */
    public function toBrevo(object $notifiable): array
    {
        $firstName = e($notifiable->first_name);
        $otp = e($this->otp);

        return [
            'subject' => 'Verify your HealthHup email',
            'html_content' => <<<HTML
                <h2>Hello {$firstName}!</h2>
                <p>Use the following verification code to verify your email address:</p>
                <h1>{$otp}</h1>
                <p>This code expires in 10 minutes.</p>
                <p>If you did not create this account, you can ignore this email.</p>
                HTML,
        ];
    }
}
