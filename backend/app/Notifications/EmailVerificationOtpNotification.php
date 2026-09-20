<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerificationOtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $otp
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
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
}