<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReceiptNotification extends Notification implements ShouldQueue
{
    use Queueable;

        public $booking;

        public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

        public function via(object $notifiable): array
    {
        return ['mail'];
    }

        public function toMail(object $notifiable): MailMessage
    {
        $tutorName   = $this->booking->tutor->name;
        $subjectName = $this->booking->subject->name ?? 'Tutoring';
        $amount      = number_format($this->booking->amount, 2);

        return (new MailMessage)
            ->subject('Payment Receipt: ' . $subjectName . ' Session Confirmed')
            ->greeting("Hello {$notifiable->name},")
            ->line("Your payment of LKR {$amount} was successful.")
            ->line("Your upcoming session with **{$tutorName}** is now confirmed!")
            ->line("**Subject:** {$subjectName}")
            ->line("**Date:** {$this->booking->session_date->toFormattedDateString()}")
            ->action('Go to Dashboard', config('app.frontend_url') . '/student/dashboard')
            ->line('Thank you for learning with Learnora!');
    }
}
