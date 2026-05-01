<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingCreatedNotification extends Notification implements ShouldQueue
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
        $studentName = $this->booking->student->name;
        $subjectName = $this->booking->subject->name ?? 'Tutoring';
        $date        = $this->booking->session_date->toFormattedDateString();
        $time        = substr($this->booking->time_from, 0, 5) . ' - ' . substr($this->booking->time_to, 0, 5);

        return (new MailMessage)
            ->subject("New Booking: {$subjectName} with {$studentName}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Great news! You have received a new booking request from {$studentName}.")
            ->line("**Subject:** {$subjectName}")
            ->line("**Date:** {$date}")
            ->line("**Time:** {$time}")
            ->line('The booking is currently pending. The student has been prompted to complete their payment.')
            ->action('View Booking', config('app.frontend_url') . '/tutor/dashboard')
            ->line('Thank you for using Learnora!');
    }
}
