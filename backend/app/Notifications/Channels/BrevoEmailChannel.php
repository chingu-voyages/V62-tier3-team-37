<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class BrevoEmailChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $apiKey = config('services.brevo.api_key');
        $fromEmail = config('services.brevo.from_email');

        if (! is_string($apiKey) || $apiKey === '' ||
            ! is_string($fromEmail) || $fromEmail === '') {
            throw new RuntimeException('Brevo API credentials are not configured.');
        }

        if (! method_exists($notification, 'toBrevo')) {
            throw new RuntimeException('The notification must define a toBrevo method.');
        }

        /** @var array{subject: string, html_content: string} $message */
        $message = $notification->toBrevo($notifiable);

        Http::acceptJson()
            ->withHeaders(['api-key' => $apiKey])
            ->timeout(10)
            ->retry(2, 300)
            ->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => [
                    'name' => config('services.brevo.from_name', 'HealthHup'),
                    'email' => $fromEmail,
                ],
                'to' => [[
                    'email' => $notifiable->email,
                    'name' => trim($notifiable->first_name.' '.$notifiable->last_name),
                ]],
                'subject' => $message['subject'],
                'htmlContent' => $message['html_content'],
            ])
            ->throw();
    }
}
